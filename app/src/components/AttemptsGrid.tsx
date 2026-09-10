import React from 'react';
import { useGameStore } from '../lib/store';

const ROWS = 5;
const COLS = 6;

/**
 * Prototype attempts meter: 5×6 circle grid.
 * Columns = guess slots (6). Rows 0–2 = category / material / scale once guessed.
 * Row 3 = overall hit/miss. Empty board fills the top row as the "ready" state.
 */
export default function AttemptsGrid() {
  const guesses = useGameStore(state => state.guesses);

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span style={styles.label}>Attempts</span>
        <span style={styles.count}>
          {guesses.length} / {COLS}
        </span>
      </div>
      <div
        style={styles.grid}
        role="img"
        aria-label={`${guesses.length} of ${COLS} attempts used`}
      >
        {Array.from({ length: ROWS }, (_, row) =>
          Array.from({ length: COLS }, (_, col) => {
            const guess = guesses[col];
            let fill = 'transparent';
            let border = 'var(--border-strong)';

            if (!guess && guesses.length === 0 && row === 0) {
              // Prototype empty state: top row solid charcoal
              fill = 'var(--accent)';
              border = 'var(--accent)';
            } else if (guess) {
              if (row < 3 && guess.facets) {
                const facet = (['category', 'material', 'scale'] as const)[row];
                const match = guess.facets[facet].match;
                fill = match ? 'var(--success)' : 'var(--accent)';
                border = fill;
              } else if (row === 3) {
                fill = guess.correct ? 'var(--success)' : 'var(--accent)';
                border = fill;
              }
            }

            return (
              <span
                key={`${row}-${col}`}
                style={{
                  ...styles.dot,
                  background: fill,
                  borderColor: border,
                }}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    width: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-3)',
  },
  label: {
    fontSize: '11px',
    fontFamily: 'var(--font-ui)',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--ink-secondary)',
  },
  count: {
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
    color: 'var(--ink)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gridTemplateRows: 'repeat(5, auto)',
    gap: '10px 12px',
    maxWidth: '220px',
  },
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '1.5px solid',
    boxSizing: 'border-box',
  },
};
