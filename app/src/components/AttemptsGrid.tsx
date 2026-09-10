import { useGameStore } from '../lib/store';

const MAX_GUESSES = 6;
/** Extra hollow rows under the active row, matching the benchmark chrome */
const PREVIEW_ROWS = 2;

/**
 * Worldle-style attempt dots: filled for used guesses, hollow for remaining.
 * Why a grid? The benchmark UI reads "progress at a glance" without numbers alone.
 */
export default function AttemptsGrid() {
  const guesses = useGameStore(state => state.guesses);

  return (
    <div className="attempts-grid">
      <div className="attempts-grid__label">
        <span>Attempts</span>
        <span className="attempts-grid__count">
          {guesses.length} / {MAX_GUESSES}
        </span>
      </div>
      <div className="attempts-grid__rows" aria-hidden>
        <div className="attempts-grid__row">
          {Array.from({ length: MAX_GUESSES }, (_, i) => {
            const guess = guesses[i];
            const filled = Boolean(guess);
            const tone = guess?.correct ? 'ok' : filled ? 'miss' : 'empty';
            return (
              <span
                key={i}
                className={`attempts-grid__dot attempts-grid__dot--${tone}`}
              />
            );
          })}
        </div>
        {Array.from({ length: PREVIEW_ROWS }, (_, row) => (
          <div key={row} className="attempts-grid__row attempts-grid__row--ghost">
            {Array.from({ length: MAX_GUESSES }, (_, i) => (
              <span key={i} className="attempts-grid__dot attempts-grid__dot--empty" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
