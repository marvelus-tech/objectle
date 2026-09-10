/**
 * Objectle Worker
 * Cloudflare Worker backend for the daily 3D object guessing game.
 *
 * Routes
 *   GET  /api/daily-challenge                 today's opaque object key
 *   POST /api/check-guess                     legacy single-player guess check
 *   GET  /api/score?playerId=                 streaks + today's guesses
 *   GET  /api/leaderboard
 *   GET  /api/health                          deploy smoke check (rooms: true)
 *
 *   Live rooms (agent <-> host screen bridge, backed by RoomDO)
 *   GET  /api/room/:code                      plain-text agent manual for the room
 *   GET  /api/room/:code/state                JSON snapshot
 *   GET  /api/room/:code/events?since=N       JSON snapshot + events after N (host polls this)
 *   GET  /api/room/:code/tools/:tool?...      run a tool with query-string args, plain-text reply
 *   POST /api/room/:code/tools/:tool  {args}  run a tool with JSON args, JSON reply
 *   POST /mcp/:code                           MCP Streamable HTTP (JSON-RPC) for hosted agents
 */

import { corsHeaders, getTodayUTC, json, text, type Env } from './env';
import { checkGuess, GameError, getChallenge } from './game';
import { handleMcp } from './mcp-http';
import type { Actor, RoomState } from './room';
import { MAX_GUESSES, MAX_ZOOM, countWrong, maxZoomFor } from '../shared/progression';
import { toToolArgs, type ToolArgs } from '../shared/tools';

export { RoomDO } from './room';

const ROOM_CODE_RE = /^[A-Z0-9]{4,8}$/;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {
      const room = path.match(/^\/api\/room\/([^/]+)(?:\/(.*))?$/);
      if (room) return handleRoom(request, env, url, room[1], room[2] ?? '');

      const mcp = path.match(/^\/mcp(?:\/([^/]+))?$/);
      if (mcp) {
        const code = normalizeCode(mcp[1] ?? url.searchParams.get('room') ?? '');
        if (!code) return json({ error: 'Room code required: /mcp/ABCD' }, 400);
        return handleMcp(request, env.ROOM.get(env.ROOM.idFromName(code)), code);
      }

      if (path === '/api/health' && request.method === 'GET') {
        return json({
          ok: true,
          service: 'objectle-worker',
          rooms: true,
          version: 'roomdo-v1',
        });
      }

      if (path === '/api/daily-challenge' && request.method === 'GET') return handleGetDailyChallenge(env);
      if (path === '/api/check-guess' && request.method === 'POST') return handleCheckGuess(request, env);
      if (path === '/api/score' && request.method === 'GET') return handleGetScore(url, env);
      if (path === '/api/leaderboard' && request.method === 'GET') return handleGetLeaderboard(env);

      return text('Not Found', 404);
    } catch (error) {
      if (error instanceof GameError) return json({ error: error.message }, error.status);
      console.error('Worker error:', error);
      return json({ error: 'Internal server error' }, 500);
    }
  },
};

function normalizeCode(raw: string): string | null {
  const code = raw.trim().toUpperCase();
  return ROOM_CODE_RE.test(code) ? code : null;
}

async function handleRoom(request: Request, env: Env, url: URL, rawCode: string, rest: string): Promise<Response> {
  const code = normalizeCode(rawCode);
  if (!code) return text('Invalid room code. Use 4-8 letters or digits, e.g. /api/room/ABCD', 400);
  const stub = env.ROOM.get(env.ROOM.idFromName(code));

  if (rest === '') {
    const state = await stub.getState(code);
    return text(roomManual(url.origin, state));
  }

  if (rest === 'state') return json(await stub.getState(code));

  if (rest === 'events') {
    const since = Number(url.searchParams.get('since') ?? 0) || 0;
    const fromHost = url.searchParams.get('host') === '1';
    return json(await stub.getEvents(code, since, fromHost));
  }

  const tool = rest.match(/^tools\/([a-z_]+)$/);
  if (tool) {
    const actor: Actor = url.searchParams.get('actor') === 'host' ? 'host' : 'agent';
    let args: ToolArgs = {};
    if (request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      args = toToolArgs(body.arguments ?? body);
    } else {
      url.searchParams.forEach((value, key) => {
        if (!['actor', 'format'].includes(key)) args[key] = value;
      });
    }

    const result = await stub.callTool(code, tool[1], args, actor);
    const wantsJson = request.method === 'POST' || url.searchParams.get('format') === 'json';
    if (wantsJson) return json(result, result.success ? 200 : 422);
    return text(result.text, result.success ? 200 : 422);
  }

  return text('Not Found', 404);
}

/**
 * Self-describing manual so a chat agent that can only fetch URLs can still play.
 * It is the single URL we hand to agents via the QR / pass page.
 */
function roomManual(origin: string, state: RoomState): string {
  const base = `${origin}/api/room/${state.code}`;
  const hostLive = state.hostSeenAt !== null && Date.now() - state.hostSeenAt < 15_000;
  const wrong = countWrong(state.guesses);
  return [
    `OBJECTLE ROOM ${state.code} - agent manual`,
    '',
    hostLive
      ? 'A human is watching this room live on their screen right now. Every tool call you make is animated for them.'
      : 'No host screen is connected at the moment (your calls still work and will show up when one opens the room).',
    '',
    `Status: ${state.guesses.length}/${MAX_GUESSES} guesses used, zoom unlocked ${maxZoomFor(wrong)}/${MAX_ZOOM}, reveal tier ${state.revealTier + 1}/4${state.gameOver ? state.won ? ', GAME WON' : ', GAME OVER' : ''}.`,
    '',
    'TOOLS - fetch these URLs with a plain GET. Each returns text you should read before your next move:',
    `  read_view       ${base}/tools/read_view`,
    `  rotate_object   ${base}/tools/rotate_object?axis=y&degrees=30      (axis x|y|z, degrees +/-15..45)`,
    `  zoom            ${base}/tools/zoom?level=1                        (0-3, one level unlocks per wrong guess)`,
    `  publish_status  ${base}/tools/publish_status?headline=Looking+at+a+handle`,
    `  submit_guess    ${base}/tools/submit_guess?name=mug`,
    '',
    `MCP clients: add ${origin}/mcp/${state.code} as a Streamable HTTP server (no auth) to get the same five tools natively.`,
    '',
    'RULES',
    `- You have ${MAX_GUESSES} guesses to name the object. Synonyms are accepted (bike = bicycle, cup = mug).`,
    '- After each guess you get facet feedback: category, material and scale, each marked correct or wrong.',
    '- Wrong guesses reveal more: silhouette -> clay -> colour -> full studio lighting, and unlock closer zoom.',
    '- Narrate with publish_status (headline + rationale) so the human can follow your reasoning.',
    '',
    'Suggested opening: read_view, then rotate_object around y by 45, read_view again, then make your first guess.',
  ].join('\n');
}

async function handleGetDailyChallenge(env: Env): Promise<Response> {
  const challenge = await getChallenge(env);
  // Only safe metadata, never the answer
  return json({
    date: getTodayUTC(),
    objectKey: challenge.object_key,
    visualProfile: visualProfileFor(challenge.object_key),
    maxGuesses: MAX_GUESSES,
  });
}

function visualProfileFor(objectKey: string): string {
  const profiles: Array<[string, string]> = [
    ['chair', 'p01'], ['bicycle', 'p02'], ['mug', 'p03'], ['lamp', 'p04'],
    ['hammer', 'p05'], ['table', 'p06'], ['phone', 'p07'], ['bowl', 'p08'],
    ['car', 'p09'], ['spoon', 'p10'], ['bench', 'p11'], ['key', 'p12'],
  ];
  return profiles.find(([name]) => objectKey.toLowerCase().includes(name))?.[1] ?? 'p00';
}

async function handleCheckGuess(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as { playerId?: string; guess?: string };
  if (!body.playerId || !body.guess) return json({ error: 'Missing playerId or guess' }, 400);
  return json(await checkGuess(env, body.playerId, body.guess));
}

async function handleGetScore(url: URL, env: Env): Promise<Response> {
  const playerId = url.searchParams.get('playerId');
  if (!playerId) return json({ error: 'Missing playerId' }, 400);

  const score = await env.DB.prepare('SELECT * FROM player_scores WHERE player_id = ?').bind(playerId).first();
  const todayGuesses = await env.DB.prepare(
    'SELECT guess_number, guess_text, is_correct FROM guesses WHERE player_id = ? AND date = ? ORDER BY guess_number'
  )
    .bind(playerId, getTodayUTC())
    .all();

  return json({
    score: score || { current_streak: 0, max_streak: 0, total_games: 0, total_wins: 0 },
    todayGuesses: todayGuesses.results || [],
  });
}

async function handleGetLeaderboard(env: Env): Promise<Response> {
  const leaderboard = await env.DB.prepare(
    'SELECT player_id, current_streak, max_streak, total_wins, total_games FROM player_scores ORDER BY current_streak DESC, total_wins DESC LIMIT 10'
  ).all();
  return json({ leaderboard: leaderboard.results || [] });
}
