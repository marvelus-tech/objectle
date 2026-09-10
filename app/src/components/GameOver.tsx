import React from 'react';
import { useGameStore } from '../lib/store';

export default function GameOver() {
  const gameOver = useGameStore(state => state.gameOver);
  const won = useGameStore(state => state.won);
  const answer = useGameStore(state => state.answer);
  const guesses = useGameStore(state => state.guesses);
  const toggleShareModal = useGameStore(state => state.toggleShareModal);
  
  if (!gameOver) return null;
  
  return (
    <div style={styles.container}>
      <div style={{
        ...styles.card,
        background: won ? 'var(--success-bg)' : 'var(--error-bg)',
        borderColor: won ? 'var(--success)' : 'var(--error)',
      }}>
        <h2 style={styles.heading}>
          {won ? 'Object identified' : 'The reveal'}
        </h2>
        <p style={styles.message}>
          {won
            ? `Solved in ${guesses.length} ${guesses.length === 1 ? 'guess' : 'guesses'}.`
            : answer
              ? `The object was ${answer}.`
              : 'The answer will appear when the host reconnects.'}
        </p>
        <button onClick={toggleShareModal} style={styles.shareButton}>
          Share Result
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
  },
  card: {
    padding: 'var(--space-8)',
    borderRadius: 'var(--radius-xl)',
    border: '2px solid',
    textAlign: 'center' as const,
    boxShadow: 'var(--shadow-lg)',
  },
  heading: {
    fontSize: 'var(--text-3xl)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    marginBottom: 'var(--space-4)',
    color: 'var(--ink)',
  },
  message: {
    fontSize: 'var(--text-lg)',
    fontFamily: 'var(--font-ui)',
    marginBottom: 'var(--space-6)',
    color: 'var(--ink-secondary)',
  },
  shareButton: {
    padding: 'var(--space-3) var(--space-8)',
    background: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 500,
    cursor: 'pointer',
  },
};
