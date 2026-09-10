import { create } from 'zustand';

interface Guess {
  guessNumber: number;
  guessText: string;
  correct: boolean;
  facets?: {
    category: { value: string; match: boolean };
    material: { value: string; match: boolean };
    scale: { value: string; match: boolean };
  };
}

interface GameState {
  // Game data
  playerId: string;
  date: string | null;
  objectKey: string | null;
  visualProfile: string | null;
  guesses: Guess[];
  gameOver: boolean;
  won: boolean;
  answer: string | null;
  
  // 3D viewer state
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  zoomLevel: number;
  revealTier: number; // 0 = silhouette, 1 = partial color, 2 = full color, 3 = full studio
  
  // UI state
  loading: boolean;
  error: string | null;
  showShareModal: boolean;
  
  // Actions
  setPlayerId: (id: string) => void;
  initGame: (date: string, objectKey: string, visualProfile: string) => void;
  addGuess: (guess: Guess) => void;
  setGameOver: (won: boolean, answer?: string) => void;
  rotate: (axis: 'x' | 'y' | 'z', degrees: number) => void;
  zoom: (level: number) => void;
  setRevealTier: (tier: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleShareModal: () => void;
  resetGame: () => void;
}

// Generate a unique player ID (stored in localStorage)
function getOrCreatePlayerId(): string {
  const stored = localStorage.getItem('objectle_player_id');
  if (stored) return stored;
  
  const newId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('objectle_player_id', newId);
  return newId;
}

export const useGameStore = create<GameState>((set) => ({
  // Initial state
  playerId: getOrCreatePlayerId(),
  date: null,
  objectKey: null,
  visualProfile: null,
  guesses: [],
  gameOver: false,
  won: false,
  answer: null,
  
  rotationX: 15, // Slightly tilted initial pose
  rotationY: 30,
  rotationZ: 0,
  zoomLevel: 0, // Start at base zoom
  revealTier: 0, // Start with silhouette
  
  loading: false,
  error: null,
  showShareModal: false,
  
  // Actions
  setPlayerId: (id) => set({ playerId: id }),
  
  initGame: (date, objectKey, visualProfile) => set({
    date,
    objectKey,
    visualProfile,
    guesses: [],
    gameOver: false,
    won: false,
    answer: null,
    rotationX: 15,
    rotationY: 30,
    rotationZ: 0,
    zoomLevel: 0,
    revealTier: 0,
  }),
  
  addGuess: (guess) => set((state) => {
    const newGuesses = [...state.guesses, guess];
    const wrongGuesses = newGuesses.filter(g => !g.correct).length;
    
    // Heardle-style zoom progression: unlock zoom levels with wrong guesses
    const newZoomLevel = Math.min(wrongGuesses, 3);
    
    // Reveal tier progression:
    // 0 guesses: silhouette only
    // 1+ guesses: partial color
    // 3+ guesses: full color
    // 5+ guesses: full studio lighting
    let newRevealTier = 0;
    if (wrongGuesses >= 5) newRevealTier = 3;
    else if (wrongGuesses >= 3) newRevealTier = 2;
    else if (wrongGuesses >= 1) newRevealTier = 1;
    
    return {
      guesses: newGuesses,
      zoomLevel: newZoomLevel,
      revealTier: newRevealTier,
    };
  }),
  
  setGameOver: (won, answer) => set({
    gameOver: true,
    won,
    answer: answer ?? null,
  }),
  
  rotate: (axis, degrees) => set((state) => {
    const key = `rotation${axis.toUpperCase()}` as keyof Pick<GameState, 'rotationX' | 'rotationY' | 'rotationZ'>;
    return {
      [key]: state[key] + degrees,
    };
  }),
  
  zoom: (level) => set((state) => {
    // Each wrong guess unlocks one Heardle-style zoom level.
    const wrongGuesses = state.guesses.filter(guess => !guess.correct).length;
    const maxZoom = Math.min(wrongGuesses, 3);
    return {
      zoomLevel: Math.max(0, Math.min(level, maxZoom)),
    };
  }),
  
  setRevealTier: (tier) => set({ revealTier: tier }),
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  toggleShareModal: () => set((state) => ({ showShareModal: !state.showShareModal })),
  
  resetGame: () => set({
    date: null,
    objectKey: null,
    visualProfile: null,
    guesses: [],
    gameOver: false,
    won: false,
    answer: null,
    rotationX: 15,
    rotationY: 30,
    rotationZ: 0,
    zoomLevel: 0,
    revealTier: 0,
    loading: false,
    error: null,
    showShareModal: false,
  }),
}));
