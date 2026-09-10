import React from 'react';
import { useGameStore } from '../lib/store';

/**
 * Display guess history with Worldle-style facet feedback
 */
export default function GuessHistory() {
  const guesses = useGameStore(state => state.guesses);
  const attempts = (
    <div style={styles.attempts}>
      <span style={styles.attemptsLabel}>Attempts</span>
      <span style={styles.dots} aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <span
            key={index}
            style={{
              ...styles.dot,
              background: index < guesses.length ? 'var(--accent)' : 'transparent',
              borderColor: index < guesses.length ? 'var(--accent)' : 'var(--border-strong)',
            }}
          />
        ))}
      </span>
      <span style={styles.attemptsCount}>{guesses.length} / 6</span>
    </div>
  );
  
  if (guesses.length === 0) {
    return (
      <div style={styles.empty}>
        {attempts}
        <p style={styles.emptyText}>No guesses yet. Start by examining the object.</p>
      </div>
    );
  }
  
  return (
    <div style={styles.container}>
      <div style={styles.headingRow}>
        <h3 style={styles.heading}>Guess history</h3>
        {attempts}
      </div>
      <div style={styles.list}>
        {guesses.map((guess) => (
          <div key={guess.guessNumber} style={styles.guessItem}>
            <div style={styles.guessHeader}>
              <span style={styles.guessNumber}>#{guess.guessNumber}</span>
              <span style={{
                ...styles.guessText,
                color: guess.correct ? 'var(--success)' : 'var(--ink)',
                fontWeight: guess.correct ? 600 : 500,
              }}>
                {guess.guessText}
              </span>
              {guess.correct && <span style={styles.checkmark}>✓</span>}
            </div>
            
            {guess.facets && (
              <div style={styles.facets}>
                <FacetBadge
                  label="Category"
                  value={guess.facets.category.value}
                  match={guess.facets.category.match}
                />
                <FacetBadge
                  label="Material"
                  value={guess.facets.material.value}
                  match={guess.facets.material.match}
                />
                <FacetBadge
                  label="Scale"
                  value={guess.facets.scale.value}
                  match={guess.facets.scale.match}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FacetBadge({ label, value, match }: { label: string; value: string; match: boolean }) {
  return (
    <div
      className={match ? 'facet-chip facet-chip--match' : 'facet-chip'}
      style={{
        ...styles.facetBadge,
        background: match ? 'var(--success-bg)' : 'var(--info-bg)',
        borderColor: match ? 'var(--success)' : 'var(--border)',
        color: match ? 'var(--success)' : 'var(--ink-secondary)',
      }}
    >
      <div style={styles.facetLabel}>{label}</div>
      <div style={styles.facetValue}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
  },
  headingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-4)',
    flexWrap: 'wrap' as const,
    marginBottom: 'var(--space-4)',
  },
  heading: {
    fontSize: 'var(--text-xl)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    margin: 0,
    color: 'var(--ink)',
  },
  attempts: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
  },
  attemptsLabel: {
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 600,
    color: 'var(--ink-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  dots: {
    display: 'flex',
    gap: '6px',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    border: '1.5px solid',
    transition: 'background-color 180ms ease-out, border-color 180ms ease-out',
  },
  attemptsCount: {
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--ink-tertiary)',
    fontVariantNumeric: 'tabular-nums',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 'var(--space-4)',
    padding: 'var(--space-6)',
    textAlign: 'center' as const,
    background: 'var(--surface)',
    borderRadius: 'var(--radius-xl)',
    border: `1px solid var(--border-subtle)`,
    boxShadow: 'var(--shadow-sm)',
  },
  emptyText: {
    color: 'var(--ink-secondary)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    margin: 0,
  },
  guessItem: {
    padding: 'var(--space-5)',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    border: `1px solid var(--border-subtle)`,
  },
  guessHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    marginBottom: 'var(--space-3)',
  },
  guessNumber: {
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 600,
    color: 'var(--ink-tertiary)',
  },
  guessText: {
    fontSize: 'var(--text-lg)',
    fontFamily: 'var(--font-ui)',
    flex: 1,
  },
  checkmark: {
    fontSize: 'var(--text-xl)',
    color: 'var(--success)',
  },
  facets: {
    display: 'flex',
    gap: 'var(--space-2)',
    flexWrap: 'wrap' as const,
  },
  facetBadge: {
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid',
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-ui)',
  },
  facetLabel: {
    fontWeight: 600,
    marginBottom: 'var(--space-1)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  facetValue: {
    textTransform: 'capitalize' as const,
  },
};
