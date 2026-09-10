import React from 'react';
import { useGameStore } from '../lib/store';
import { countWrong, maxZoomFor } from '../../../shared/progression';

/**
 * Progression Chrome - Shows Heardle-style zoom locks and reveal tier
 * Makes the zoom progression visible without reading docs
 */
export default function ProgressionChrome() {
  const guesses = useGameStore(state => state.guesses);
  const won = useGameStore(state => state.won);
  const gameOver = useGameStore(state => state.gameOver);
  const tier = useGameStore(state => state.revealTier);
  const lost = gameOver && !won;
  
  const maxZoom = maxZoomFor(countWrong(guesses));
  const revealTier = tier + 1;
  
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
                  background: unlocked ? 'var(--accent)' : 'var(--surface)',
                  color: unlocked ? 'white' : 'var(--ink-muted)',
                  border: unlocked ? 'none' : `1px solid var(--border)`,
                }}
                title={unlocked ? `Zoom ${level + 1} unlocked` : `Zoom ${level + 1} locked`}
              >
                {level + 1}
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
    background: 'var(--glass)',
    backdropFilter: 'blur(12px)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-5)',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'var(--shadow-sm)',
  },
  section: {
    marginBottom: 'var(--space-5)',
  },
  label: {
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 600,
    color: 'var(--ink-secondary)',
    marginBottom: 'var(--space-2)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  locks: {
    display: 'flex',
    gap: 'var(--space-2)',
  },
  lock: {
    flex: 1,
    padding: 'var(--space-3) 0',
    textAlign: 'center' as const,
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    border: '1px solid transparent',
  },
  revealBar: {
    position: 'relative' as const,
    height: '32px',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    border: `1px solid var(--border)`,
  },
  revealFill: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    height: '100%',
    background: 'var(--accent)',
    transition: 'width 0.4s ease',
  },
  revealText: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 600,
    color: 'var(--ink)',
    zIndex: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  revealLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 'var(--space-2)',
  },
  revealLabelItem: {
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--ink-tertiary)',
  },
  hint: {
    marginTop: 'var(--space-3)',
    paddingTop: 'var(--space-4)',
    borderTop: `1px solid var(--border-subtle)`,
  },
  hintText: {
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--ink-tertiary)',
    fontStyle: 'italic' as const,
  },
};
