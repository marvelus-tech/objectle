#!/usr/bin/env node
/**
 * Path of least resistance for agent ↔ UI learning.
 *
 * Starts a LOCAL Worker (no Cloudflare account / no deploy) + Vite UI.
 * Agents hit http://localhost:8787/api/room/<CODE>/tools/... and the host
 * screen at http://localhost:3000?room=<CODE> animates the same room.
 *
 * Usage: npm run dev:local
 */

import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const ROOT = new URL('..', import.meta.url).pathname;
const TODAY = new Date().toISOString().slice(0, 10);
const TMP = join(ROOT, '.tmp');
const SEED = join(TMP, 'seed-today.sql');

mkdirSync(TMP, { recursive: true });

// Ensure today has a row even if schema.sql's static seeds fall behind.
writeFileSync(
  SEED,
  `-- Auto-seeded by scripts/dev-local.mjs for ${TODAY}
INSERT OR IGNORE INTO daily_challenges (date, object_key, object_name, category, material, scale)
VALUES ('${TODAY}', 'daily/obj_hammer_001', 'hammer', 'tool', 'metal', 'small');
`,
);

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: ROOT,
      stdio: 'inherit',
      shell: false,
      ...opts,
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`));
    });
  });
}

function start(cmd, args, label) {
  const child = spawn(cmd, args, {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  const prefix = (line) => `[${label}] ${line}`;
  for (const stream of [child.stdout, child.stderr]) {
    stream?.on('data', (buf) => {
      String(buf)
        .split(/\r?\n/)
        .filter(Boolean)
        .forEach((line) => console.log(prefix(line)));
    });
  }
  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      console.error(`[${label}] exited code=${code} signal=${signal}`);
      shutdown(code ?? 1);
    }
  });
  return child;
}

let shuttingDown = false;
/** @type {import('node:child_process').ChildProcess[]} */
const children = [];

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    try {
      child.kill('SIGTERM');
    } catch {
      // already gone
    }
  }
  setTimeout(() => process.exit(code), 500).unref();
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log(`\nObjectle local agent lab (${TODAY})`);
console.log('1) Seeding local D1…');
await run('npx', ['wrangler', 'd1', 'execute', 'objectle-db', '--local', '--file=./schema.sql']);
await run('npx', ['wrangler', 'd1', 'execute', 'objectle-db', '--local', '--file', SEED]);

console.log('2) Starting Worker on :8787…');
children.push(start('npx', ['wrangler', 'dev', '--local', '--ip', '127.0.0.1', '--port', '8787'], 'worker'));

// Wait until /api/health answers so Vite's first proxy calls don't 502.
for (let i = 0; i < 40; i++) {
  try {
    const res = await fetch('http://127.0.0.1:8787/api/health');
    if (res.ok) break;
  } catch {
    // still booting
  }
  await sleep(250);
}

console.log('3) Starting UI on :3000…');
children.push(start('npx', ['vite', '--host', '127.0.0.1', '--port', '3000'], 'ui'));

await sleep(800);
console.log(`
Ready.
  Host UI:   http://127.0.0.1:3000
  Worker:    http://127.0.0.1:8787/api/health
  Agent:     open the UI, copy the room code from the URL (?room=XXXX), then:

    curl -sS "http://127.0.0.1:8787/api/room/XXXX/tools/read_view"
    curl -sS "http://127.0.0.1:8787/api/room/XXXX/tools/rotate_object?axis=y&degrees=30"
    curl -sS "http://127.0.0.1:8787/api/room/XXXX/tools/submit_guess?name=hammer"

  Or: npm run smoke:agent -- XXXX

Ctrl+C stops both processes.
`);
