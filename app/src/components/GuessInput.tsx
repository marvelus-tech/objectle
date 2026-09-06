import React, { useState } from 'react';
import { useGameStore } from '../lib/store';
import { api } from '../lib/api';

export default function GuessInput() {
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const playerId = useGameStore(state => state.playerId);
  const guesses = useGameStore(state => state.guesses);
  const gameOver = useGameStore(state => state.gameOver);
  const addGuess = useGameStore(state => state.addGuess);
  const setGameOver = useGameStore(state => state.setGameOver);
  const setError = useGameStore(state => state.setError);
  
  const remainingGuesses = 6 - guesses.length;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || submitting || gameOver) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const result = await api.checkGuess(playerId, input.trim());
      
      addGuess({
        guessNumber: result.guessNumber,
        guessText: input.trim(),
        correct: result.correct,
        facets: result.facets,
      });
      
      if (result.gameOver) {
        setGameOver(result.won);
      }
      
      setInput('');
    } catch (error) {
      console.error('Failed to submit guess:', error);
      setError('Failed to submit guess. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (gameOver) {
    return null;
  }
  
  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your guess..."
          style={styles.input}
          disabled={submitting}
          autoComplete="off"
          autoFocus
        />
        <button
          type="submit"
          style={styles.button}
          disabled={!input.trim() || submitting}
        >
          {submitting ? 'Submitting...' : 'Guess'}
        </button>
      </div>
      <p style={styles.hint}>
        {remainingGuesses} guess{remainingGuesses !== 1 ? 'es' : ''} remaining
      </p>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    width: '100%',
  },
  inputContainer: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  input: {
    flex: 1,
    padding: '0.75rem 1rem',
    fontSize: '16px',
    border: '2px solid #d0d0d0',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  button: {
    padding: '0.75rem 1.5rem',
    background: '#2ecc71',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '100px',
  },
  hint: {
    fontSize: '13px',
    color: '#666',
    margin: 0,
  },
};
