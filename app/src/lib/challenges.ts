/**
 * Local challenges catalog for client-side fallback
 * Used when Worker is unavailable (GitHub Pages, offline, etc.)
 * 
 * Derived from schema.sql daily_challenges table
 * Keeps answers internal to module (not exposed as window globals)
 */

export interface Challenge {
  date: string;
  objectKey: string;
  visualProfile: string;
  objectName: string;
  category: string;
  material: string;
  scale: string;
}

export interface Synonym {
  canonical: string;
  synonym: string;
}

// Daily challenges catalog
const challenges: Challenge[] = [
  { date: '2026-09-06', objectKey: 'daily/obj_chair_001', visualProfile: 'p01', objectName: 'chair', category: 'furniture', material: 'wood', scale: 'medium' },
  { date: '2026-09-07', objectKey: 'daily/obj_bicycle_001', visualProfile: 'p02', objectName: 'bicycle', category: 'vehicle', material: 'metal', scale: 'large' },
  { date: '2026-09-08', objectKey: 'daily/obj_mug_001', visualProfile: 'p03', objectName: 'mug', category: 'kitchenware', material: 'ceramic', scale: 'small' },
  { date: '2026-09-09', objectKey: 'daily/obj_lamp_001', visualProfile: 'p04', objectName: 'lamp', category: 'furniture', material: 'metal', scale: 'medium' },
  { date: '2026-09-10', objectKey: 'daily/obj_hammer_001', visualProfile: 'p05', objectName: 'hammer', category: 'tool', material: 'metal', scale: 'small' },
  { date: '2026-09-11', objectKey: 'daily/obj_table_001', visualProfile: 'p06', objectName: 'table', category: 'furniture', material: 'wood', scale: 'large' },
  { date: '2026-09-12', objectKey: 'daily/obj_phone_001', visualProfile: 'p07', objectName: 'phone', category: 'electronics', material: 'metal', scale: 'small' },
  { date: '2026-09-13', objectKey: 'daily/obj_bowl_001', visualProfile: 'p08', objectName: 'bowl', category: 'kitchenware', material: 'ceramic', scale: 'small' },
  { date: '2026-09-14', objectKey: 'daily/obj_car_001', visualProfile: 'p09', objectName: 'car', category: 'vehicle', material: 'metal', scale: 'large' },
  { date: '2026-09-15', objectKey: 'daily/obj_spoon_001', visualProfile: 'p10', objectName: 'spoon', category: 'kitchenware', material: 'metal', scale: 'small' },
  { date: '2026-09-16', objectKey: 'daily/obj_bench_001', visualProfile: 'p11', objectName: 'bench', category: 'furniture', material: 'wood', scale: 'large' },
  { date: '2026-09-17', objectKey: 'daily/obj_key_001', visualProfile: 'p12', objectName: 'key', category: 'tool', material: 'metal', scale: 'small' },
];

// Synonym mappings
const synonyms: Synonym[] = [
  { canonical: 'bicycle', synonym: 'bike' },
  { canonical: 'bicycle', synonym: 'cycle' },
  { canonical: 'chair', synonym: 'seat' },
  { canonical: 'lamp', synonym: 'light' },
  { canonical: 'mug', synonym: 'cup' },
  { canonical: 'mug', synonym: 'coffee cup' },
  { canonical: 'table', synonym: 'desk' },
  { canonical: 'phone', synonym: 'cellphone' },
  { canonical: 'phone', synonym: 'mobile' },
  { canonical: 'phone', synonym: 'smartphone' },
  { canonical: 'car', synonym: 'automobile' },
  { canonical: 'car', synonym: 'vehicle' },
  { canonical: 'bowl', synonym: 'dish' },
  { canonical: 'spoon', synonym: 'tablespoon' },
  { canonical: 'bench', synonym: 'seat' },
  { canonical: 'bench', synonym: 'seating' },
  { canonical: 'hammer', synonym: 'mallet' },
  { canonical: 'key', synonym: 'housekey' },
  { canonical: 'key', synonym: 'door key' },
];

/**
 * Get today's date in UTC YYYY-MM-DD format
 */
function getTodayUTC(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get challenge for a specific date (client-side fallback)
 */
export function getChallengeByDate(date: string): Challenge | null {
  return challenges.find(c => c.date === date) || null;
}

/**
 * Get today's challenge (client-side fallback)
 */
export function getTodaysChallenge(): { date: string; objectKey: string; visualProfile: string } | null {
  const today = getTodayUTC();
  const challenge = getChallengeByDate(today);
  
  if (!challenge) return null;
  
  // Return only safe data (no answer)
  return {
    date: challenge.date,
    objectKey: `challenge-${challenge.date}`,
    visualProfile: challenge.visualProfile,
  };
}

/**
 * Check if a guess matches the answer (with synonym support)
 */
function checkAnswer(canonical: string, guess: string): boolean {
  const normalizedGuess = guess.toLowerCase().trim();
  const normalizedCanonical = canonical.toLowerCase().trim();
  
  // Direct match
  if (normalizedCanonical === normalizedGuess) {
    return true;
  }
  
  // Check synonyms
  return synonyms.some(
    s => s.canonical.toLowerCase() === normalizedCanonical && 
         s.synonym.toLowerCase() === normalizedGuess
  );
}

/**
 * Get facets for a guess (for feedback)
 */
function getGuessFacets(guessName: string): { category: string; material: string; scale: string } | null {
  const normalized = guessName.toLowerCase().trim();
  
  // Find by direct name match
  const byName = challenges.find(c => c.objectName.toLowerCase() === normalized);
  if (byName) {
    return {
      category: byName.category,
      material: byName.material,
      scale: byName.scale,
    };
  }
  
  // Find by synonym
  const syn = synonyms.find(s => s.synonym.toLowerCase() === normalized);
  if (syn) {
    const byCanonical = challenges.find(c => c.objectName.toLowerCase() === syn.canonical.toLowerCase());
    if (byCanonical) {
      return {
        category: byCanonical.category,
        material: byCanonical.material,
        scale: byCanonical.scale,
      };
    }
  }
  
  // Unknown object
  return { category: 'unknown', material: 'unknown', scale: 'unknown' };
}

/**
 * Client-side guess checker (fallback when Worker unavailable)
 * Stores guess history in localStorage for persistence
 */
export function checkGuessLocal(playerId: string, guess: string): {
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
} {
  const today = getTodayUTC();
  const challenge = getChallengeByDate(today);
  
  if (!challenge) {
    throw new Error('No challenge available for today');
  }
  
  // Load guess history from localStorage
  const storageKey = `objectle_guesses_${playerId}_${today}`;
  const stored = localStorage.getItem(storageKey);
  const previousGuesses: string[] = stored ? JSON.parse(stored) : [];
  
  // Check max guesses
  if (previousGuesses.length >= 6) {
    throw new Error('Maximum guesses exceeded');
  }
  
  const guessNumber = previousGuesses.length + 1;
  const normalizedGuess = guess.toLowerCase().trim();
  
  // Check if correct
  const isCorrect = checkAnswer(challenge.objectName, normalizedGuess);
  
  // Get facets for feedback
  const guessFacets = getGuessFacets(normalizedGuess);
  
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
  
  // Save guess
  previousGuesses.push(normalizedGuess);
  localStorage.setItem(storageKey, JSON.stringify(previousGuesses));
  
  const gameOver = isCorrect || guessNumber >= 6;
  
  return {
    correct: isCorrect,
    guessNumber,
    facets,
    gameOver,
    won: isCorrect,
    answer: gameOver ? challenge.objectName : undefined,
  };
}

/**
 * Get score from localStorage (fallback)
 */
export function getScoreLocal(playerId: string): {
  score: {
    current_streak: number;
    max_streak: number;
    total_games: number;
    total_wins: number;
  };
  todayGuesses: Array<{ guess_number: number; guess_text: string; is_correct: number }>;
} {
  const today = getTodayUTC();
  const storageKey = `objectle_guesses_${playerId}_${today}`;
  const stored = localStorage.getItem(storageKey);
  const guesses: string[] = stored ? JSON.parse(stored) : [];
  
  const challenge = getChallengeByDate(today);
  
  const todayGuesses = guesses.map((g, i) => ({
    guess_number: i + 1,
    guess_text: g,
    is_correct: challenge ? (checkAnswer(challenge.objectName, g) ? 1 : 0) : 0,
  }));
  
  // Simple score from localStorage (no streak tracking in fallback)
  return {
    score: {
      current_streak: 0,
      max_streak: 0,
      total_games: 0,
      total_wins: 0,
    },
    todayGuesses,
  };
}
