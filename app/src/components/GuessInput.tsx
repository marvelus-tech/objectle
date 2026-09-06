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
    gap: 'var(--space-3)',
    marginBottom: 'var(--space-2)',
  },
  input: {
    flex: 1,
    padding: 'var(--space-3) var(--space-4)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-ui)',
    border: `2px solid var(--border)`,
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    background: 'var(--surface)',
    color: 'var(--ink)',
  },
  button: {
    padding: 'var(--space-3) var(--space-6)',
    background: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 500,
    cursor: 'pointer',
    minWidth: '100px',
  },
  hint: {
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--ink-secondary)',
    margin: 0,
  },
};
