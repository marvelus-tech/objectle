import { create } from 'zustand';
import {
  countWrong,
  maxZoomFor,
  revealTierFor,
  type GuessRecord,
} from '../../../shared/progression';

export type Guess = GuessRecord;

export type Actor = 'agent' | 'host';

/** The most recent thing that happened, used to drive on-screen captions and effects. */
export interface LiveAction {
  id: string;
  ts: number;
  actor: Actor;
  tool: 'read_view' | 'rotate_object' | 'zoom' | 'submit_guess' | 'publish_status';
  args: Record<string, unknown>;
  success: boolean;
  /** Short human caption, e.g. "Agent turned the object 30° right" */
  caption: string;
  /** Set for submit_guess so the stage can react (shake / celebrate) */
  guess?: Guess;
}

/** Snapshot shape shared with the Worker's RoomDO */
export interface RoomSnapshot {
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  zoomLevel: number;
  revealTier: number;
  guesses: Guess[];
  gameOver: boolean;
  won: boolean;
  lastAgentEventAt: number | null;
}

interface GameState {
  // Game data
  playerId: string;
  date: string | null;
  objectKey: string | null;
  visualProfile: string | null;
  answer: string | null;
  guesses: Guess[];
  gameOver: boolean;
  won: boolean;

  // 3D viewer state (targets; the viewer tweens toward them)
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  zoomLevel: number;
  revealTier: number; // 0 silhouette, 1 clay, 2 colour, 3 studio

  // Live room (agent bridge)
  roomCode: string | null;
  roomConnected: boolean;
  agentLastSeenAt: number | null;
  lastAction: LiveAction | null;

  // UI state
  loading: boolean;
  error: string | null;
  showShareModal: boolean;

  // Actions
  initGame: (date: string, objectKey: string, visualProfile?: string) => void;
  addGuess: (guess: Guess) => void;
  setGameOver: (won: boolean, answer?: string) => void;
  rotate: (axis: 'x' | 'y' | 'z', degrees: number) => void;
  zoom: (level: number) => void;
  setRoom: (code: string | null, connected: boolean) => void;
  applySnapshot: (snapshot: RoomSnapshot) => void;
  setLastAction: (action: LiveAction) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleShareModal: () => void;
}

function getOrCreatePlayerId(): string {
  const stored = localStorage.getItem('objectle_player_id');
  if (stored) return stored;
  const newId = `player_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  localStorage.setItem('objectle_player_id', newId);
  return newId;
}

const INITIAL_VIEW = { rotationX: 15, rotationY: 30, rotationZ: 0, zoomLevel: 0, revealTier: 0 };

export const useGameStore = create<GameState>((set) => ({
  playerId: getOrCreatePlayerId(),
  date: null,
  objectKey: null,
  visualProfile: null,
  answer: null,
  guesses: [],
  gameOver: false,
  won: false,
  ...INITIAL_VIEW,

  roomCode: null,
  roomConnected: false,
  agentLastSeenAt: null,
  lastAction: null,

  loading: false,
  error: null,
  showShareModal: false,

  initGame: (date, objectKey, visualProfile) => set({
    date,
    objectKey,
    visualProfile: visualProfile ?? null,
    answer: null,
    guesses: [],
    gameOver: false,
    won: false,
    ...INITIAL_VIEW,
  }),

  // Local (offline) progression. In room mode the Worker computes this and we applySnapshot.
  addGuess: (guess) => set((state) => {
    const guesses = [...state.guesses, guess];
    const wrong = countWrong(guesses);
    return {
      guesses,
      zoomLevel: Math.max(state.zoomLevel, maxZoomFor(wrong)),
      revealTier: guess.correct ? 3 : revealTierFor(wrong),
    };
  }),

  setGameOver: (won, answer) => set({ gameOver: true, won, answer: answer ?? null }),

  rotate: (axis, degrees) => set((state) => {
    const key = `rotation${axis.toUpperCase()}` as 'rotationX' | 'rotationY' | 'rotationZ';
    return { [key]: state[key] + degrees };
  }),

  zoom: (level) => set((state) => ({
    zoomLevel: Math.max(0, Math.min(level, maxZoomFor(countWrong(state.guesses)))),
  })),

  setRoom: (code, connected) => set({ roomCode: code, roomConnected: connected }),

  applySnapshot: (s) => set({
    rotationX: s.rotationX,
    rotationY: s.rotationY,
    rotationZ: s.rotationZ,
    zoomLevel: s.zoomLevel,
    revealTier: s.revealTier,
    guesses: s.guesses,
    gameOver: s.gameOver,
    won: s.won,
    agentLastSeenAt: s.lastAgentEventAt,
  }),

  setLastAction: (action) => set({ lastAction: action }),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  toggleShareModal: () => set((state) => ({ showShareModal: !state.showShareModal })),
}));
