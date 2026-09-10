import React from 'react';
import { useGameStore } from '../lib/store';

/**
 * Display guess history with Worldle-style facet feedback
 */
export default function GuessHistory() {
  const guesses = useGameStore(state => state.guesses);
  
  if (guesses.length === 0) {
    return (
      <div style={styles.empty}>
        <p style={styles.emptyText}>No guesses yet. Start by examining the object!</p>
      </div>
    );
  }
  
  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Guess History</h3>
      <div style={styles.list}>
        {guesses.map((guess) => (
          <div key={guess.guessNumber} style={styles.guessItem}>
            <div style={styles.guessHeader}>
              <span style={styles.guessNumber}>#{guess.guessNumber}</span>
              <span style={{
                ...styles.guessText,
                color: guess.correct ? 'var(--success)' : 'var(--error)',
                fontWeight: guess.correct ? 600 : 400,
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
        background: match ? 'var(--success-bg)' : 'var(--error-bg)',
        borderColor: match ? 'var(--success)' : 'var(--error)',
        color: match ? 'var(--success)' : 'var(--error)',
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
  heading: {
    fontSize: 'var(--text-xl)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    marginBottom: 'var(--space-4)',
    color: 'var(--ink)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
  },
  empty: {
    padding: 'var(--space-8)',
    textAlign: 'center' as const,
    background: 'var(--info-bg)',
    borderRadius: 'var(--radius-lg)',
    border: `1px solid var(--border-subtle)`,
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
