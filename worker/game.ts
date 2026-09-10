/**
 * Daily-challenge game logic backed by D1.
 * Used by both the legacy /api/check-guess route and the room Durable Object.
 */

import type { Env } from './env';
import { getTodayUTC } from './env';
import { MAX_GUESSES, type GuessOutcome } from '../shared/progression';

export interface DailyChallenge {
  date: string;
  object_key: string;
  object_name: string;
  category: string;
  material: string;
  scale: string;
}

export class GameError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export async function getChallenge(env: Env, date = getTodayUTC()): Promise<DailyChallenge> {
  const challenge = await env.DB.prepare('SELECT * FROM daily_challenges WHERE date = ?')
    .bind(date)
    .first<DailyChallenge>();
  if (!challenge) throw new GameError('No challenge for today', 404);
  return challenge;
}

export async function checkGuess(env: Env, playerId: string, guess: string): Promise<GuessOutcome> {
  const today = getTodayUTC();
  const normalizedGuess = guess.toLowerCase().trim();
  const challenge = await getChallenge(env, today);

  const guessCount = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM guesses WHERE player_id = ? AND date = ?'
  )
    .bind(playerId, today)
    .first<{ count: number }>();

  const guessNumber = (guessCount?.count || 0) + 1;
  if (guessNumber > MAX_GUESSES) throw new GameError('Max guesses exceeded');

  const correct = await matchesAnswer(env, challenge.object_name, normalizedGuess);

  await env.DB.prepare(
    'INSERT INTO guesses (player_id, date, guess_number, guess_text, is_correct) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(playerId, today, guessNumber, normalizedGuess, correct ? 1 : 0)
    .run();

  // Facets of the guessed object, compared against the answer (Worldle-style hints)
  const guessFacets = await getObjectFacets(env, normalizedGuess);
  const facets = {
    category: { value: guessFacets?.category || 'unknown', match: guessFacets?.category === challenge.category },
    material: { value: guessFacets?.material || 'unknown', match: guessFacets?.material === challenge.material },
    scale: { value: guessFacets?.scale || 'unknown', match: guessFacets?.scale === challenge.scale },
  };

  const gameOver = correct || guessNumber >= MAX_GUESSES;
  if (gameOver) await updatePlayerScore(env, playerId, today, correct);

  return { correct, guessNumber, facets, gameOver, won: correct };
}

async function matchesAnswer(env: Env, canonical: string, guess: string): Promise<boolean> {
  if (canonical.toLowerCase() === guess) return true;
  const synonym = await env.DB.prepare('SELECT canonical FROM synonyms WHERE canonical = ? AND synonym = ?')
    .bind(canonical.toLowerCase(), guess)
    .first();
  return !!synonym;
}

async function getObjectFacets(
  env: Env,
  objectName: string
): Promise<Pick<DailyChallenge, 'category' | 'material' | 'scale'> | null> {
  // MVP: look the guessed word up among known challenge objects (and their synonyms)
  const direct = await env.DB.prepare(
    'SELECT category, material, scale FROM daily_challenges WHERE LOWER(object_name) = ?'
  )
    .bind(objectName)
    .first<Pick<DailyChallenge, 'category' | 'material' | 'scale'>>();
  if (direct) return direct;

  return env.DB.prepare(
    'SELECT c.category, c.material, c.scale FROM synonyms s JOIN daily_challenges c ON LOWER(c.object_name) = s.canonical WHERE s.synonym = ? LIMIT 1'
  )
    .bind(objectName)
    .first<Pick<DailyChallenge, 'category' | 'material' | 'scale'>>();
}

async function updatePlayerScore(env: Env, playerId: string, date: string, won: boolean): Promise<void> {
  const existing = await env.DB.prepare('SELECT * FROM player_scores WHERE player_id = ?')
    .bind(playerId)
    .first<{ current_streak: number; max_streak: number; last_played_date: string | null }>();

  if (!existing) {
    await env.DB.prepare(
      'INSERT INTO player_scores (player_id, current_streak, max_streak, total_games, total_wins, last_played_date) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(playerId, won ? 1 : 0, won ? 1 : 0, 1, won ? 1 : 0, date)
      .run();
    return;
  }

  let newStreak = existing.current_streak;
  if (won) {
    if (existing.last_played_date === getYesterdayUTC()) newStreak = existing.current_streak + 1;
    else if (existing.last_played_date !== date) newStreak = 1;
  } else {
    newStreak = 0;
  }
  const maxStreak = Math.max(existing.max_streak, newStreak);

  await env.DB.prepare(
    'UPDATE player_scores SET current_streak = ?, max_streak = ?, total_games = total_games + 1, total_wins = total_wins + ?, last_played_date = ?, updated_at = unixepoch() WHERE player_id = ?'
  )
    .bind(newStreak, maxStreak, won ? 1 : 0, date, playerId)
    .run();
}

function getYesterdayUTC(): string {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() - 1);
  return now.toISOString().split('T')[0];
}
