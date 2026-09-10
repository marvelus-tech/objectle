import React, { useState } from 'react';
import { useGameStore } from '../lib/store';
import { runTool } from '../lib/webmcp';

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.4 20.4L21 12 3.4 3.6 3.4 10.2 15 12 3.4 13.8z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function GuessInput() {
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const gameOver = useGameStore(state => state.gameOver);
  const setError = useGameStore(state => state.setError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || submitting || gameOver) return;

    setSubmitting(true);
    setError(null);

    try {
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
      <label htmlFor="guess-input" style={styles.label}>
        Make a guess
      </label>
      <div style={styles.inputContainer}>
        <input
          id="guess-input"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Enter an object..."
          style={styles.input}
          disabled={submitting}
          autoComplete="off"
          autoFocus
        />
        <button
          type="submit"
          className="guess-send"
          style={styles.button}
          disabled={!input.trim() || submitting}
          aria-label={submitting ? 'Submitting guess' : 'Submit guess'}
        >
          <SendIcon />
        </button>
      </div>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    width: '100%',
  },
  label: {
    display: 'block',
    marginBottom: 'var(--space-3)',
    fontSize: '11px',
    fontFamily: 'var(--font-ui)',
    fontWeight: 600,
    color: 'var(--ink-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  inputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    padding: '14px 48px 14px 18px',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-ui)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    outline: 'none',
    background: 'var(--surface)',
    color: 'var(--ink)',
    boxShadow: 'var(--shadow-sm)',
  },
  button: {
    position: 'absolute',
    right: '8px',
    width: '34px',
    height: '34px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '10px',
    background: 'transparent',
    color: 'var(--accent)',
    padding: 0,
  },
};
