/**
 * Objectle Worker
 * Cloudflare Worker backend for daily 3D object guessing game
 */

import { DurableObject } from 'cloudflare:workers';

export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  THEATER_ROOMS: DurableObjectNamespace<TheaterRoom>;
}

interface TheaterEventPayload {
  id: string;
  kind: 'tool' | 'status';
  timestamp: number;
  source: 'agent' | 'human' | 'panel' | 'remote';
  [key: string]: unknown;
}

interface RoomMessage {
  type: 'event';
  event: TheaterEventPayload;
}

interface DailyChallenge {
  date: string;
  object_key: string;
  object_name: string;
  category: string;
  material: string;
  scale: string;
}

interface GuessResult {
  correct: boolean;
  guessNumber: number;
  facets: {
    category: { value: string; match: boolean };
    material: { value: string; match: boolean };
    scale: { value: string; match: boolean };
  };
  gameOver: boolean;
  won: boolean;
  answer?: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // API Routes
      if (path === '/api/daily-challenge' && request.method === 'GET') {
        return handleGetDailyChallenge(env);
      }

      if (path === '/api/check-guess' && request.method === 'POST') {
        return handleCheckGuess(request, env);
      }

      if (path === '/api/score' && request.method === 'GET') {
        return handleGetScore(url, env);
      }

      if (path === '/api/leaderboard' && request.method === 'GET') {
        return handleGetLeaderboard(env);
      }

      if (path === '/api/rooms' && request.method === 'POST') {
        return Response.json(
          { roomId: crypto.randomUUID() },
          { headers: corsHeaders },
        );
      }

      const roomRoute = matchRoomRoute(path);
      if (roomRoute?.action === 'watch' && request.method === 'GET') {
        const room = env.THEATER_ROOMS.getByName(roomRoute.roomId);
        return room.fetch(request);
      }

      if (roomRoute?.action === 'events' && request.method === 'POST') {
        const body = await request.json<RoomMessage>();
        if (body.type !== 'event' || !isTheaterEvent(body.event)) {
          return Response.json(
            { error: 'Invalid theater event' },
            { status: 400, headers: corsHeaders },
          );
        }

        const room = env.THEATER_ROOMS.getByName(roomRoute.roomId);
        await room.publish(body.event);
        return Response.json({ accepted: true }, { headers: corsHeaders });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
} satisfies ExportedHandler<Env>;

function matchRoomRoute(path: string) {
  const match = path.match(/^\/api\/rooms\/([a-zA-Z0-9-]{8,64})\/(watch|events)$/);
  if (!match) return null;
  return { roomId: match[1], action: match[2] as 'watch' | 'events' };
}

function isTheaterEvent(value: unknown): value is TheaterEventPayload {
  if (!value || typeof value !== 'object') return false;
  const event = value as Record<string, unknown>;
  return (
    typeof event.id === 'string' &&
    event.id.length <= 100 &&
    (event.kind === 'tool' || event.kind === 'status') &&
    typeof event.timestamp === 'number' &&
    ['agent', 'human', 'panel', 'remote'].includes(String(event.source))
  );
}

export class TheaterRoom extends DurableObject<Env> {
  private static readonly historyKey = 'events';

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);

    const events =
      (await this.ctx.storage.get<TheaterEventPayload[]>(
        TheaterRoom.historyKey,
      )) ?? [];
    server.send(JSON.stringify({ type: 'history', events }));

    return new Response(null, { status: 101, webSocket: client });
  }

  async publish(event: TheaterEventPayload): Promise<void> {
    if (!isTheaterEvent(event)) throw new Error('Invalid theater event');
    await this.recordAndBroadcast(event);
  }

  async webSocketMessage(
    sender: WebSocket,
    message: string | ArrayBuffer,
  ): Promise<void> {
    if (typeof message !== 'string' || message.length > 16_384) return;

    try {
      const body = JSON.parse(message) as RoomMessage;
      if (body.type !== 'event' || !isTheaterEvent(body.event)) return;
      await this.recordAndBroadcast(body.event, sender);
    } catch {
      sender.send(JSON.stringify({ type: 'error', error: 'Invalid message' }));
    }
  }

  async webSocketClose(
    webSocket: WebSocket,
    code: number,
    reason: string,
  ): Promise<void> {
    webSocket.close(code, reason);
  }

  async webSocketError(webSocket: WebSocket): Promise<void> {
    webSocket.close(1011, 'Room connection error');
  }

  private async recordAndBroadcast(
    event: TheaterEventPayload,
    sender?: WebSocket,
  ) {
    const history =
      (await this.ctx.storage.get<TheaterEventPayload[]>(
        TheaterRoom.historyKey,
      )) ?? [];
    const events = [...history.filter(item => item.id !== event.id), event].slice(
      -60,
    );

    await this.ctx.storage.put(TheaterRoom.historyKey, events);

    const payload = JSON.stringify({ type: 'event', event });
    for (const client of this.ctx.getWebSockets()) {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }
}

/**
 * Get today's daily challenge
 * Returns opaque object_key and facets, but NOT the answer
 */
async function handleGetDailyChallenge(env: Env): Promise<Response> {
  const today = getTodayUTC();

  const challenge = await env.DB.prepare(
    'SELECT object_key, category, material, scale FROM daily_challenges WHERE date = ?'
  )
    .bind(today)
    .first<Pick<DailyChallenge, 'object_key' | 'category' | 'material' | 'scale'>>();

  if (!challenge) {
    return new Response(JSON.stringify({ error: 'No challenge for today' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Return only safe metadata, never the answer
  return new Response(
    JSON.stringify({
      date: today,
      objectKey: `challenge-${today}`,
      visualProfile: getVisualProfile(challenge.object_key),
      // Facets hidden until guesses made
      maxGuesses: 6,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Check a player's guess
 * Returns facet feedback (Worldle-style) and correctness
 */
async function handleCheckGuess(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as { playerId: string; guess: string };
  const { playerId, guess } = body;

  if (!playerId || !guess) {
    return new Response(JSON.stringify({ error: 'Missing playerId or guess' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const today = getTodayUTC();
  const normalizedGuess = guess.toLowerCase().trim();

  // Get today's challenge
  const challenge = await env.DB.prepare(
    'SELECT * FROM daily_challenges WHERE date = ?'
  )
    .bind(today)
    .first<DailyChallenge>();

  if (!challenge) {
    return new Response(JSON.stringify({ error: 'No challenge for today' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Check how many guesses player has made
  const guessCount = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM guesses WHERE player_id = ? AND date = ?'
  )
    .bind(playerId, today)
    .first<{ count: number }>();

  const currentGuessNumber = (guessCount?.count || 0) + 1;

  if (currentGuessNumber > 6) {
    return new Response(JSON.stringify({ error: 'Max guesses exceeded' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Check if guess matches answer (with synonym support)
  const isCorrect = await checkAnswerWithSynonyms(env, challenge.object_name, normalizedGuess);

  // Record the guess
  await env.DB.prepare(
    'INSERT INTO guesses (player_id, date, guess_number, guess_text, is_correct) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(playerId, today, currentGuessNumber, normalizedGuess, isCorrect ? 1 : 0)
    .run();

  // Prepare facet feedback (always show the correct facets of the guessed object for comparison)
  const guessFacets = await getObjectFacets(env, normalizedGuess);

  const facets = {
    category: {
      value: guessFacets?.category || 'unknown',
      match: guessFacets?.category === challenge.category,
    },
    material: {
      value: guessFacets?.material || 'unknown',
      match: guessFacets?.material === challenge.material,
    },
    scale: {
      value: guessFacets?.scale || 'unknown',
      match: guessFacets?.scale === challenge.scale,
    },
  };

  const gameOver = isCorrect || currentGuessNumber >= 6;
  const won = isCorrect;

  // Update player score if game over
  if (gameOver) {
    await updatePlayerScore(env, playerId, today, won);
  }

  const result: GuessResult = {
    correct: isCorrect,
    guessNumber: currentGuessNumber,
    facets,
    gameOver,
    won,
    answer: gameOver ? challenge.object_name : undefined,
  };

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Get player score and streak
 */
async function handleGetScore(url: URL, env: Env): Promise<Response> {
  const playerId = url.searchParams.get('playerId');

  if (!playerId) {
    return new Response(JSON.stringify({ error: 'Missing playerId' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const score = await env.DB.prepare(
    'SELECT * FROM player_scores WHERE player_id = ?'
  )
    .bind(playerId)
    .first();

  const today = getTodayUTC();
  const todayGuesses = await env.DB.prepare(
    'SELECT guess_number, guess_text, is_correct FROM guesses WHERE player_id = ? AND date = ? ORDER BY guess_number'
  )
    .bind(playerId, today)
    .all();

  return new Response(
    JSON.stringify({
      score: score || {
        current_streak: 0,
        max_streak: 0,
        total_games: 0,
        total_wins: 0,
      },
      todayGuesses: todayGuesses.results || [],
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Get leaderboard (top 10 by current streak)
 */
async function handleGetLeaderboard(env: Env): Promise<Response> {
  const leaderboard = await env.DB.prepare(
    'SELECT player_id, current_streak, max_streak, total_wins, total_games FROM player_scores ORDER BY current_streak DESC, total_wins DESC LIMIT 10'
  ).all();

  return new Response(JSON.stringify({ leaderboard: leaderboard.results || [] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Helper functions

function getTodayUTC(): string {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getVisualProfile(objectKey: string): string {
  const profiles: Array<[string, string]> = [
    ['chair', 'p01'],
    ['bicycle', 'p02'],
    ['mug', 'p03'],
    ['lamp', 'p04'],
    ['hammer', 'p05'],
    ['table', 'p06'],
    ['phone', 'p07'],
    ['bowl', 'p08'],
    ['car', 'p09'],
    ['spoon', 'p10'],
    ['bench', 'p11'],
    ['key', 'p12'],
  ];
  return profiles.find(([name]) => objectKey.toLowerCase().includes(name))?.[1] ?? 'p00';
}

async function checkAnswerWithSynonyms(
  env: Env,
  canonical: string,
  guess: string
): Promise<boolean> {
  // Direct match
  if (canonical.toLowerCase() === guess) {
    return true;
  }

  // Check synonyms
  const synonym = await env.DB.prepare(
    'SELECT canonical FROM synonyms WHERE canonical = ? AND synonym = ?'
  )
    .bind(canonical.toLowerCase(), guess)
    .first();

  return !!synonym;
}

async function getObjectFacets(
  env: Env,
  objectName: string
): Promise<Pick<DailyChallenge, 'category' | 'material' | 'scale'> | null> {
  // In production, this would query a comprehensive object database
  // For MVP, we'll use a simple lookup from any past challenge or a hardcoded map
  const facets = await env.DB.prepare(
    'SELECT category, material, scale FROM daily_challenges WHERE LOWER(object_name) = ?'
  )
    .bind(objectName.toLowerCase())
    .first<Pick<DailyChallenge, 'category' | 'material' | 'scale'>>();

  return facets || null;
}

async function updatePlayerScore(
  env: Env,
  playerId: string,
  date: string,
  won: boolean
): Promise<void> {
  const existing = await env.DB.prepare(
    'SELECT * FROM player_scores WHERE player_id = ?'
  )
    .bind(playerId)
    .first<any>();

  if (!existing) {
    // New player
    await env.DB.prepare(
      'INSERT INTO player_scores (player_id, current_streak, max_streak, total_games, total_wins, last_played_date) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(playerId, won ? 1 : 0, won ? 1 : 0, 1, won ? 1 : 0, date)
      .run();
  } else {
    const lastDate = existing.last_played_date;
    const yesterday = getYesterdayUTC();

    let newStreak = existing.current_streak;

    if (won) {
      if (lastDate === yesterday) {
        // Continuing streak
        newStreak = existing.current_streak + 1;
      } else if (lastDate !== date) {
        // New streak
        newStreak = 1;
      }
    } else {
      // Lost: break streak
      newStreak = 0;
    }

    const maxStreak = Math.max(existing.max_streak, newStreak);

    await env.DB.prepare(
      'UPDATE player_scores SET current_streak = ?, max_streak = ?, total_games = total_games + 1, total_wins = total_wins + ?, last_played_date = ?, updated_at = unixepoch() WHERE player_id = ?'
    )
      .bind(maxStreak, maxStreak, won ? 1 : 0, date, playerId)
      .run();
  }
}

function getYesterdayUTC(): string {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() - 1);
  return now.toISOString().split('T')[0];
}
