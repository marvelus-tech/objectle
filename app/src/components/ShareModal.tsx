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
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '1.5rem',
    color: '#333',
  },
  shareGrid: {
    background: '#f8f9fa',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
  },
  shareText: {
    fontFamily: 'monospace',
    fontSize: '14px',
    margin: 0,
    whiteSpace: 'pre-wrap',
    color: '#333',
  },
  buttons: {
    display: 'flex',
    gap: '1rem',
  },
  copyButton: {
    flex: 1,
    padding: '0.75rem 1.5rem',
    background: '#4a90e2',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  closeButton: {
    padding: '0.75rem 1.5rem',
    background: '#e0e0e0',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
