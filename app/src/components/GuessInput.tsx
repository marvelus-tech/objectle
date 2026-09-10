import React, { useState } from 'react';
import { useGameStore } from '../lib/store';
import { runTool } from '../lib/webmcp';

export default function GuessInput() {
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const guesses = useGameStore(state => state.guesses);
  const gameOver = useGameStore(state => state.gameOver);
  const setError = useGameStore(state => state.setError);
  
  const remainingGuesses = 6 - guesses.length;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || submitting || gameOver) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Same path as agents: the room (or local fallback) updates the store for us
      const result = await runTool('submit_guess', { name: input.trim() }, 'host');
      if (!result.success) throw new Error(result.text);
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
