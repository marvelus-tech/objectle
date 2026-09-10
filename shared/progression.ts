/**
 * Game progression rules shared by the browser, the Worker and the MCP server.
 *
 * Keeping these in one place means the host screen, the room Durable Object and
 * the agent all agree on what a wrong guess unlocks. Previously each side had its
 * own copy and they had already drifted apart (zoom gating differed between
 * store.ts and ProgressionChrome.tsx).
 */

export const MAX_GUESSES = 6;
export const MAX_ZOOM = 3;
export const MAX_REVEAL_TIER = 3;

export interface Facet {
  value: string;
  match: boolean;
}

export interface Facets {
  category: Facet;
  material: Facet;
  scale: Facet;
}

export interface GuessRecord {
  guessNumber: number;
  guessText: string;
  correct: boolean;
  facets?: Facets;
}

/** Zoom levels unlock one per wrong guess (Heardle-style). */
export function maxZoomFor(wrongGuesses: number): number {
  return Math.min(wrongGuesses, MAX_ZOOM);
}

/** Reveal tier: 0 silhouette, 1 clay (1+ wrong), 2 colour (3+ wrong), 3 studio (5+ wrong). */
export function revealTierFor(wrongGuesses: number): number {
  if (wrongGuesses >= 5) return 3;
  if (wrongGuesses >= 3) return 2;
  if (wrongGuesses >= 1) return 1;
  return 0;
}

export function countWrong(guesses: Array<{ correct: boolean }>): number {
  return guesses.filter(g => !g.correct).length;
}

export const VIEW_DESCRIPTIONS: readonly string[] = [
  'You see a pure black silhouette of an object. The shape is somewhat visible but all surface details are hidden. The object is positioned on a light-colored floor with minimal lighting.',
  'The object has a dark gray, clay-like appearance. Basic forms and volumes are visible but fine details remain obscured. Studio lighting is dim. You can make out the general structure.',
  'The object now has a light beige ceramic appearance. Surface details, edges, and proportions are clearly visible. The lighting is brighter with soft shadows.',
  'The object is fully revealed in a professional studio lighting setup. All material details, textures, and subtle features are visible. Soft key lights, fill lights, and contact shadows create a polished presentation.',
];

export interface ViewSnapshot {
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  zoomLevel: number;
  revealTier: number;
  guesses: GuessRecord[];
}

const mark = (f: Facet) => `${f.value} ${f.match ? '✓' : '✗'}`;

/** Text returned by read_view. Never includes the answer. */
export function describeView(view: ViewSnapshot): string {
  const lines = [
    VIEW_DESCRIPTIONS[Math.min(view.revealTier, MAX_REVEAL_TIER)],
    '',
    `The object is currently rotated X=${view.rotationX}°, Y=${view.rotationY}°, Z=${view.rotationZ}°.`,
    `Zoom level: ${view.zoomLevel}/${MAX_ZOOM} (max unlocked: ${maxZoomFor(countWrong(view.guesses))}).`,
    '',
    `Guesses made: ${view.guesses.length}/${MAX_GUESSES}`,
  ];
  for (const g of view.guesses) {
    const f = g.facets;
    const facetText = f
      ? ` (category ${mark(f.category)}, material ${mark(f.material)}, scale ${mark(f.scale)})`
      : '';
    lines.push(`  #${g.guessNumber} "${g.guessText}" ${g.correct ? 'CORRECT' : 'wrong'}${facetText}`);
  }
  return lines.join('\n');
}

export interface GuessOutcome {
  correct: boolean;
  guessNumber: number;
  facets: Facets;
  gameOver: boolean;
  won: boolean;
}

/** Text returned by submit_guess. */
export function describeGuess(guessText: string, result: GuessOutcome, revealTier: number): string {
  const parts = [
    `Guess #${result.guessNumber}: "${guessText}"`,
    result.correct ? 'CORRECT! You won!' : `Incorrect. ${MAX_GUESSES - result.guessNumber} guesses remaining.`,
    [
      'Facet Feedback:',
      `Category: ${mark(result.facets.category)}`,
      `Material: ${mark(result.facets.material)}`,
      `Scale: ${mark(result.facets.scale)}`,
    ].join('\n'),
  ];
  if (!result.correct) {
    parts.push(`Reveal tier is now ${revealTier + 1}/${MAX_REVEAL_TIER + 1}. More details are visible.`);
  }
  if (result.gameOver) {
    parts.push(result.won ? `Game Over - You won in ${result.guessNumber} guesses!` : 'Game Over - No guesses remaining.');
  }
  return parts.join('\n\n');
}
