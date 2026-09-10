#!/usr/bin/env node

/**
 * Objectle stdio MCP server (for desktop MCP clients such as Claude Desktop).
 *
 * It is a thin proxy: every tool call is forwarded to the Worker's room endpoint,
 * so what the agent does shows up on the host screen watching that room. It used
 * to keep its own in-memory game state, which is exactly why the UI never moved.
 *
 * Env:
 *   WORKER_API  e.g. https://objectle-worker-demo.marvelus.workers.dev/api
 *   ROOM_CODE   optional; otherwise call join_room(code) first
 *
 * Hosted clients don't need this file at all: point them at <origin>/mcp/<CODE>.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TOOL_DEFINITIONS, isToolName } from '../shared/tools.ts';

declare const process: {
  env: Record<string, string | undefined>;
  exit(code: number): never;
};

const WORKER_API = process.env.WORKER_API || 'http://localhost:8787/api';
let roomCode: string | null = process.env.ROOM_CODE?.toUpperCase() || null;

const server = new Server(
  { name: 'objectle-viewer', version: '2.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'join_room',
      description: 'Join the Objectle room shown on the host screen (4-letter code). Required before the other tools unless ROOM_CODE is configured.',
      inputSchema: {
        type: 'object',
        properties: { code: { type: 'string', description: 'Room code, e.g. ABCD' } },
        required: ['code'],
      },
    },
    ...TOOL_DEFINITIONS,
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  if (name === 'join_room') {
    const code = String((args as { code?: string }).code ?? '').trim().toUpperCase();
    if (!/^[A-Z0-9]{4,8}$/.test(code)) return reply('Room codes are 4-8 letters/digits, e.g. ABCD.', true);
    roomCode = code;
    const manual = await fetch(`${WORKER_API}/room/${code}`).then(r => r.text()).catch(err => `Joined ${code}, but could not fetch the manual: ${err}`);
    return reply(manual);
  }

  if (!isToolName(name)) return reply(`Unknown tool: ${name}`, true);
  if (!roomCode) return reply('No room joined. Call join_room with the code from the host screen first.', true);

  try {
    const res = await fetch(`${WORKER_API}/room/${roomCode}/tools/${name}?actor=agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    const data = (await res.json()) as { text: string; success: boolean };
    return reply(data.text, !data.success);
  } catch (error) {
    return reply(`Error reaching the Objectle Worker at ${WORKER_API}: ${error}`, true);
  }
});

function reply(text: string, isError = false) {
  return { content: [{ type: 'text' as const, text }], isError };
}

async function main() {
  await server.connect(new StdioServerTransport());
  console.error(`Objectle MCP server running on stdio (worker: ${WORKER_API}, room: ${roomCode ?? 'not joined'})`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
