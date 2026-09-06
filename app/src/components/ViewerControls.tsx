import React from 'react';
import { useGameStore } from '../lib/store';

/**
 * Control panel for rotating and zooming the 3D object
 * Implements GeoGuessr-style verb gating
 */
export default function ViewerControls() {
  const rotate = useGameStore(state => state.rotate);
  const zoom = useGameStore(state => state.zoom);
  const zoomLevel = useGameStore(state => state.zoomLevel);
  const revealTier = useGameStore(state => state.revealTier);
  const guesses = useGameStore(state => state.guesses);
  
  // Gating: early rotation is limited, zoom unlocks progressively
  const canRotate = true; // Always allow some rotation
  const maxZoom = Math.min(revealTier + 1, 3);
  const rotationStep = revealTier >= 2 ? 30 : 15; // Larger steps when more revealed
  
  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <h3 style={styles.heading}>Rotate Object</h3>
        <div style={styles.buttonGrid}>
          <button
            onClick={() => rotate('y', -rotationStep)}
            style={styles.button}
            disabled={!canRotate}
            title="Rotate left"
          >
            ← Left
          </button>
          <button
            onClick={() => rotate('y', rotationStep)}
            style={styles.button}
            disabled={!canRotate}
            title="Rotate right"
          >
            Right →
          </button>
          <button
            onClick={() => rotate('x', -rotationStep)}
            style={styles.button}
            disabled={!canRotate}
            title="Rotate up"
          >
            ↑ Up
          </button>
          <button
            onClick={() => rotate('x', rotationStep)}
            style={styles.button}
            disabled={!canRotate}
            title="Rotate down"
          >
            Down ↓
          </button>
        </div>
      </div>
      
      <div style={styles.section}>
        <h3 style={styles.heading}>Zoom Level</h3>
        <div style={styles.zoomControls}>
          <button
            onClick={() => zoom(zoomLevel - 1)}
            style={styles.button}
            disabled={zoomLevel <= 0}
            title="Zoom out"
          >
            -
          </button>
          <span style={styles.zoomDisplay}>{zoomLevel + 1} / {maxZoom + 1}</span>
          <button
            onClick={() => zoom(zoomLevel + 1)}
            style={styles.button}
            disabled={zoomLevel >= maxZoom}
            title="Zoom in"
          >
            +
          </button>
        </div>
        {zoomLevel >= maxZoom && maxZoom < 3 && (
          <p style={styles.hint}>
            More zoom unlocks after wrong guesses
          </p>
        )}
      </div>
      
      <div style={styles.info}>
        <p style={styles.infoText}>
          Wrong guesses: {guesses.filter(g => !g.correct).length} / 6
        </p>
        <p style={styles.infoText}>
          Each wrong guess unlocks more detail and zoom
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '1rem',
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  section: {
    marginBottom: '1.5rem',
  },
  heading: {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '0.5rem',
    color: '#333',
  },
  buttonGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
  },
  button: {
    padding: '0.75rem 1rem',
    background: '#4a90e2',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  zoomControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  zoomDisplay: {
    fontSize: '16px',
    fontWeight: 600,
    minWidth: '50px',
    textAlign: 'center',
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '0.5rem',
    fontStyle: 'italic',
  },
  info: {
    borderTop: '1px solid #e0e0e0',
    paddingTop: '1rem',
  },
  infoText: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '0.25rem',
  },
};
