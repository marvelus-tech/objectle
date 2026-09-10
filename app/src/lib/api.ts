/**
 * API client for Objectle Worker
 */

import { getTodaysChallenge, checkGuessLocal, getScoreLocal } from './challenges';

// Support multiple deployment paths
const getAPIBase = () => {
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // Deployed Worker on Cloudflare (marvelus subdomain)
  return 'https://objectle-worker-demo.marvelus.workers.dev/api';
};

const API_BASE = getAPIBase();

function legacyVisualProfile(objectKey: string) {
  const profiles: Array<[string, string]> = [
    ['chair', 'p01'], ['bicycle', 'p02'], ['mug', 'p03'], ['lamp', 'p04'],
    ['hammer', 'p05'], ['table', 'p06'], ['phone', 'p07'], ['bowl', 'p08'],
    ['car', 'p09'], ['spoon', 'p10'], ['bench', 'p11'], ['key', 'p12'],
  ];
  return profiles.find(([name]) => objectKey.toLowerCase().includes(name))?.[1] ?? 'p00';
}

// Track if Worker is available
let workerAvailable: boolean | null = null;

export interface DailyChallengeResponse {
  date: string;
  objectKey: string;
  visualProfile: string;
  maxGuesses: number;
}

export interface CheckGuessResponse {
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

export interface ScoreResponse {
  score: {
    current_streak: number;
    max_streak: number;
    total_games: number;
    total_wins: number;
  };
  todayGuesses: Array<{
    guess_number: number;
    guess_text: string;
    is_correct: number;
  }>;
}

export interface LeaderboardResponse {
  leaderboard: Array<{
    player_id: string;
    current_streak: number;
    max_streak: number;
    total_wins: number;
    total_games: number;
  }>;
}

export const api = {
  async getDailyChallenge(): Promise<DailyChallengeResponse> {
    // Try Worker first
    if (workerAvailable !== false) {
      try {
        const res = await fetch(`${API_BASE}/daily-challenge`, {
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        
        if (res.ok) {
          workerAvailable = true;
          const challenge = await res.json() as DailyChallengeResponse;
          return {
            ...challenge,
            objectKey: `challenge-${challenge.date}`,
            visualProfile:
              challenge.visualProfile ?? legacyVisualProfile(challenge.objectKey),
          };
        }
        
        // Worker returned error, fall back
        console.warn('Worker returned non-ok status, falling back to local catalog');
        workerAvailable = false;
      } catch (error) {
        console.warn('Worker fetch failed, falling back to local catalog:', error);
        workerAvailable = false;
      }
    }
    
    // Fallback to local catalog
    const local = getTodaysChallenge();
    if (!local) {
      throw new Error('No challenge available for today');
    }
    
    return {
      date: local.date,
      objectKey: local.objectKey,
      visualProfile: local.visualProfile,
      maxGuesses: 6,
    };
  },

  async checkGuess(playerId: string, guess: string): Promise<CheckGuessResponse> {
    // Try Worker first
    if (workerAvailable !== false) {
      try {
        const res = await fetch(`${API_BASE}/check-guess`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId, guess }),
          signal: AbortSignal.timeout(5000),
        });
        
        if (res.ok) {
          workerAvailable = true;
          return res.json();
        }
        
        console.warn('Worker returned non-ok status, falling back to local check');
        workerAvailable = false;
      } catch (error) {
        console.warn('Worker fetch failed, falling back to local check:', error);
        workerAvailable = false;
      }
    }
    
    // Fallback to local check
    return checkGuessLocal(playerId, guess);
  },

  async getScore(playerId: string): Promise<ScoreResponse> {
    // Try Worker first
    if (workerAvailable !== false) {
      try {
        const res = await fetch(`${API_BASE}/score?playerId=${encodeURIComponent(playerId)}`, {
          signal: AbortSignal.timeout(5000),
        });
        
        if (res.ok) {
          workerAvailable = true;
          return res.json();
        }
        
        console.warn('Worker returned non-ok status, falling back to local score');
        workerAvailable = false;
      } catch (error) {
        console.warn('Worker fetch failed, falling back to local score:', error);
        workerAvailable = false;
      }
    }
    
    // Fallback to local score
    return getScoreLocal(playerId);
  },

  async getLeaderboard(): Promise<LeaderboardResponse> {
    // Try Worker first (leaderboard requires server)
    if (workerAvailable !== false) {
      try {
        const res = await fetch(`${API_BASE}/leaderboard`, {
          signal: AbortSignal.timeout(5000),
        });
        
        if (res.ok) {
          workerAvailable = true;
          return res.json();
        }
      } catch (error) {
        console.warn('Worker fetch failed for leaderboard:', error);
        workerAvailable = false;
      }
    }
    
    // Leaderboard not available in fallback mode
    return { leaderboard: [] };
  },
};
