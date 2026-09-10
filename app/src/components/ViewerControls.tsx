import React from 'react';
import { useGameStore } from '../lib/store';
import { callWebMCPTool } from '../lib/webmcp';
import { countWrong, maxZoomFor } from '../../../shared/progression';

/**
 * Control panel for rotating and zooming the 3D object
 * Implements GeoGuessr-style verb gating
 *
 * Buttons run the same tools agents use, so host actions show up in the
 * timeline and are visible to connected agents via read_view.
 */
export default function ViewerControls() {
  const zoomLevel = useGameStore(state => state.zoomLevel);
  const revealTier = useGameStore(state => state.revealTier);
  const guesses = useGameStore(state => state.guesses);
  
  const rotate = (axis: 'x' | 'y' | 'z', degrees: number) => void callWebMCPTool('rotate_object', { axis, degrees });
  const zoom = (level: number) => void callWebMCPTool('zoom', { level });
  
  // Gating: rotation is always free, zoom unlocks one level per wrong guess
  const canRotate = true;
  const maxZoom = maxZoomFor(countWrong(guesses));
  const rotationStep = revealTier >= 2 ? 30 : 15; // Larger steps when more revealed
  
  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <h3 style={styles.heading}>Rotate Object</h3>
        <div style={styles.buttonGrid}>
          <button
            onClick={() => rotate('y', -rotationStep)}
            className="btn-ghost"
            style={styles.button}
            disabled={!canRotate}
            title="Rotate left"
          >
            ← Left
          </button>
          <button
            onClick={() => rotate('y', rotationStep)}
            className="btn-ghost"
            style={styles.button}
            disabled={!canRotate}
            title="Rotate right"
          >
            Right →
          </button>
          <button
            onClick={() => rotate('x', -rotationStep)}
            className="btn-ghost"
            style={styles.button}
            disabled={!canRotate}
            title="Rotate up"
          >
            ↑ Up
          </button>
          <button
            onClick={() => rotate('x', rotationStep)}
            className="btn-ghost"
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
            className="btn-ghost"
            style={styles.button}
            disabled={zoomLevel <= 0}
            title="Zoom out"
          >
            -
          </button>
          <span style={styles.zoomDisplay}>{zoomLevel + 1} / {maxZoom + 1}</span>
          <button
            onClick={() => zoom(zoomLevel + 1)}
            className="btn-ghost"
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
    padding: 'var(--space-5)',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-sm)',
    border: `1px solid var(--border-subtle)`,
  },
  section: {
    marginBottom: 'var(--space-5)',
  },
  heading: {
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 600,
    marginBottom: 'var(--space-3)',
    color: 'var(--ink)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  buttonGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-2)',
  },
  button: {
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 500,
    cursor: 'pointer',
  },
  zoomControls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-4)',
  },
  zoomDisplay: {
    fontSize: 'var(--text-lg)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
    minWidth: '60px',
    textAlign: 'center' as const,
    color: 'var(--ink)',
  },
  hint: {
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--ink-tertiary)',
    marginTop: 'var(--space-2)',
    fontStyle: 'italic' as const,
  },
  info: {
    borderTop: `1px solid var(--border-subtle)`,
    paddingTop: 'var(--space-4)',
    marginTop: 'var(--space-2)',
  },
  infoText: {
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--ink-secondary)',
    marginBottom: 'var(--space-2)',
  },
};
