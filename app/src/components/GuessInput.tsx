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
      <label style={styles.label} htmlFor="objectle-guess">
        Make a guess
      </label>
      <div style={styles.inputContainer}>
        <input
          id="objectle-guess"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter an object..."
          style={styles.input}
          disabled={submitting}
          autoComplete="off"
          autoFocus
        />
        <button
          type="submit"
          style={styles.button}
          disabled={!input.trim() || submitting}
          aria-label="Submit guess"
          title="Submit guess"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M3.4 20.3 21 12 3.4 3.7 3 10.2l11.2 1.8L3 13.8l.4 6.5Z"
              fill="currentColor"
            />
          </svg>
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
  label: {
    display: 'block',
    marginBottom: 'var(--space-2)',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--ink-tertiary)',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '999px',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
    padding: '4px 4px 4px 16px',
  },
  input: {
    flex: 1,
    padding: '10px 8px',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-ui)',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: 'var(--ink)',
    minWidth: 0,
    boxShadow: 'none',
  },
  button: {
    display: 'grid',
    placeItems: 'center',
    width: 40,
    height: 40,
    flexShrink: 0,
    background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-magenta))',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    boxShadow: '0 0 12px var(--neon-glow)',
  },
  hint: {
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--ink-secondary)',
    margin: 'var(--space-2) 0 0',
  },
};
