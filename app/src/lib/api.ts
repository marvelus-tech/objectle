/**
 * API client for Objectle Worker
 */

// Support multiple deployment paths
const getAPIBase = () => {
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // Check if we're on GitHub Pages
  if (window.location.hostname.includes('github.io')) {
    // Use demo Worker endpoint for GitHub Pages
    return 'https://objectle-worker-demo.marvelus-tech.workers.dev/api';
  }
  
  // Default to Cloudflare Pages Worker
  return 'https://objectle-worker.marvelus-tech.workers.dev/api';
};

const API_BASE = getAPIBase();

export interface DailyChallengeResponse {
  date: string;
  objectKey: string;
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
    const res = await fetch(`${API_BASE}/daily-challenge`);
    if (!res.ok) throw new Error('Failed to fetch daily challenge');
    return res.json();
  },

  async checkGuess(playerId: string, guess: string): Promise<CheckGuessResponse> {
    const res = await fetch(`${API_BASE}/check-guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, guess }),
    });
    if (!res.ok) throw new Error('Failed to check guess');
    return res.json();
  },

  async getScore(playerId: string): Promise<ScoreResponse> {
    const res = await fetch(`${API_BASE}/score?playerId=${encodeURIComponent(playerId)}`);
    if (!res.ok) throw new Error('Failed to fetch score');
    return res.json();
  },

  async getLeaderboard(): Promise<LeaderboardResponse> {
    const res = await fetch(`${API_BASE}/leaderboard`);
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return res.json();
  },
};
