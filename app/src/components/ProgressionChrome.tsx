import React from 'react';
import { useGameStore } from '../lib/store';

/**
 * Progression Chrome - Shows Heardle-style zoom locks and reveal tier
 * Makes the zoom progression visible without reading docs
 */
export default function ProgressionChrome() {
  const guesses = useGameStore(state => state.guesses);
  const won = useGameStore(state => state.won);
  const lost = useGameStore(state => state.lost);
  
  const wrongGuesses = guesses.filter(g => !g.correct).length;
  const maxZoom = Math.min(wrongGuesses, 3);
  const revealTier = Math.min(wrongGuesses + 1, 4);
  
  const zoomLocks = [0, 1, 2, 3];
  
  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <div style={styles.label}>Zoom unlocked</div>
        <div style={styles.locks}>
          {zoomLocks.map(level => {
            const unlocked = level <= maxZoom;
            return (
              <div
                key={level}
                style={{
                  ...styles.lock,
                  background: unlocked ? '#4a90e2' : '#e0e0e0',
                  color: unlocked ? '#fff' : '#999',
                }}
                title={unlocked ? `Zoom ${level} unlocked` : `Zoom ${level} locked`}
              >
                {level}
              </div>
            );
          })}
        </div>
      </div>
      
      <div style={styles.section}>
        <div style={styles.label}>Reveal tier</div>
        <div style={styles.revealBar}>
          <div 
            style={{
              ...styles.revealFill,
              width: `${(revealTier / 4) * 100}%`,
            }}
          />
          <div style={styles.revealText}>{revealTier}/4</div>
        </div>
        <div style={styles.revealLabels}>
          <span style={styles.revealLabelItem}>Silhouette</span>
          <span style={styles.revealLabelItem}>Clay</span>
          <span style={styles.revealLabelItem}>Color</span>
          <span style={styles.revealLabelItem}>Studio</span>
        </div>
      </div>
      
      {!won && !lost && (
        <div style={styles.hint}>
          <small style={styles.hintText}>
            Wrong guesses unlock zoom and reveal more detail
          </small>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#fff',
    borderRadius: '8px',
    padding: '14px 16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e0e0e0',
  },
  section: {
    marginBottom: '14px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#666',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  locks: {
    display: 'flex',
    gap: '6px',
  },
  lock: {
    flex: 1,
    padding: '8px 0',
    textAlign: 'center',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.3s',
  },
  revealBar: {
    position: 'relative',
    height: '28px',
    background: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  revealFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    background: 'linear-gradient(90deg, #4a90e2, #2ecc71)',
    transition: 'width 0.4s ease',
  },
  revealText: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 600,
    color: '#333',
    zIndex: 1,
  },
  revealLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '4px',
  },
  revealLabelItem: {
    fontSize: '10px',
    color: '#888',
  },
  hint: {
    marginTop: '8px',
    paddingTop: '12px',
    borderTop: '1px solid #e0e0e0',
  },
  hintText: {
    fontSize: '11px',
    color: '#888',
    fontStyle: 'italic',
  },
};
