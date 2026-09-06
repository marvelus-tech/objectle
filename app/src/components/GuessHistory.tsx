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
                color: guess.correct ? '#2ecc71' : '#e74c3c',
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
    <div style={{
      ...styles.facetBadge,
      background: match ? '#d4edda' : '#f8d7da',
      borderColor: match ? '#2ecc71' : '#e74c3c',
    }}>
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
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '1rem',
    color: '#333',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  empty: {
    padding: '2rem',
    textAlign: 'center',
    background: '#f8f9fa',
    borderRadius: '8px',
  },
  emptyText: {
    color: '#666',
    fontSize: '14px',
    margin: 0,
  },
  guessItem: {
    padding: '1rem',
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  guessHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  guessNumber: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#666',
  },
  guessText: {
    fontSize: '16px',
    flex: 1,
  },
  checkmark: {
    fontSize: '20px',
    color: '#2ecc71',
  },
  facets: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  facetBadge: {
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '2px solid',
    fontSize: '12px',
  },
  facetLabel: {
    fontWeight: 600,
    marginBottom: '0.25rem',
  },
  facetValue: {
    textTransform: 'capitalize',
  },
};
