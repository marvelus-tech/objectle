import React from 'react';
import { useGameStore } from '../lib/store';

export default function GameOver() {
  const gameOver = useGameStore(state => state.gameOver);
  const won = useGameStore(state => state.won);
  const guesses = useGameStore(state => state.guesses);
  const toggleShareModal = useGameStore(state => state.toggleShareModal);
  
  if (!gameOver) return null;
  
  const answer = won ? guesses[guesses.length - 1]?.guessText : 'Unknown';
  
  return (
    <div style={styles.container}>
      <div style={{
        ...styles.card,
        background: won ? '#d4edda' : '#f8d7da',
        borderColor: won ? '#2ecc71' : '#e74c3c',
      }}>
        <h2 style={styles.heading}>
          {won ? '🎉 You Won!' : '😔 Game Over'}
        </h2>
        <p style={styles.message}>
          {won
            ? `You guessed it in ${guesses.length} tries!`
            : `The answer was: ${answer}`}
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
    padding: '2rem',
    borderRadius: '12px',
    border: '3px solid',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  heading: {
    fontSize: '28px',
    fontWeight: 700,
    marginBottom: '1rem',
    color: '#333',
  },
  message: {
    fontSize: '18px',
    marginBottom: '1.5rem',
    color: '#555',
  },
  shareButton: {
    padding: '0.75rem 2rem',
    background: '#4a90e2',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
