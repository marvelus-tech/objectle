import React from 'react';
import { useGameStore } from '../lib/store';

/**
 * Share modal with Worldle-style facet feedback grid
 * Generates a shareable text representation of the game
 */
export default function ShareModal() {
  const showShareModal = useGameStore(state => state.showShareModal);
  const toggleShareModal = useGameStore(state => state.toggleShareModal);
  const guesses = useGameStore(state => state.guesses);
  const won = useGameStore(state => state.won);
  const date = useGameStore(state => state.date);
  
  if (!showShareModal) return null;
  
  const shareText = generateShareText(date || '', guesses, won);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    alert('Copied to clipboard!');
  };
  
  return (
    <div style={styles.overlay} onClick={toggleShareModal}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.heading}>Share Your Result</h2>
        
        <div style={styles.shareGrid}>
          <pre style={styles.shareText}>{shareText}</pre>
        </div>
        
        <div style={styles.buttons}>
          <button onClick={handleCopy} style={styles.copyButton}>
            Copy to Clipboard
          </button>
          <button onClick={toggleShareModal} style={styles.closeButton}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function generateShareText(date: string, guesses: any[], won: boolean): string {
  const guessCount = guesses.length;
  const result = won ? `${guessCount}/6` : 'X/6';
  
  let text = `Objectle ${date} ${result}\n\n`;
  
  // Generate facet feedback grid (Worldle-style)
  guesses.forEach((guess) => {
    if (guess.correct) {
      text += '🟩🟩🟩\n'; // All green for correct answer
    } else if (guess.facets) {
      const categorySymbol = guess.facets.category.match ? '🟩' : '🟥';
      const materialSymbol = guess.facets.material.match ? '🟩' : '🟥';
      const scaleSymbol = guess.facets.scale.match ? '🟩' : '🟥';
      text += `${categorySymbol}${materialSymbol}${scaleSymbol}\n`;
    } else {
      text += '⬜⬜⬜\n'; // Unknown
    }
  });
  
  text += '\nhttps://marvelus-tech.github.io/objectle/';
  
  return text;
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(26, 26, 26, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-8)',
    maxWidth: '500px',
    width: '90%',
    boxShadow: 'var(--shadow-lg)',
    animation: 'fadeScaleIn 220ms ease-out',
  },
  heading: {
    fontSize: 'var(--text-2xl)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    marginBottom: 'var(--space-6)',
    color: 'var(--ink)',
  },
  shareGrid: {
    background: 'var(--info-bg)',
    padding: 'var(--space-5)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-6)',
    border: `1px solid var(--border-subtle)`,
  },
  shareText: {
    fontFamily: 'var(--font-ui), monospace',
    fontSize: 'var(--text-sm)',
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
    color: 'var(--ink)',
  },
  buttons: {
    display: 'flex',
    gap: 'var(--space-4)',
  },
  copyButton: {
    flex: 1,
    padding: 'var(--space-3) var(--space-6)',
    background: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 500,
    cursor: 'pointer',
  },
  closeButton: {
    padding: 'var(--space-3) var(--space-6)',
    background: 'transparent',
    color: 'var(--ink)',
    border: `1px solid var(--border)`,
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 500,
    cursor: 'pointer',
  },
};
