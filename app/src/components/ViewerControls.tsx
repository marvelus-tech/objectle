import React from 'react';
import { useGameStore } from '../lib/store';
import { callWebMCPTool } from '../lib/webmcp';
import { countWrong, maxZoomFor } from '../../../shared/progression';

/**
 * Minimal stage chrome under the neon viewer — zoom track + discrete rotate.
 * Matches the benchmark: thin slider flanked by − / +, reset-style rotate.
 */
export default function ViewerControls() {
  const zoomLevel = useGameStore(state => state.zoomLevel);
  const revealTier = useGameStore(state => state.revealTier);
  const guesses = useGameStore(state => state.guesses);

  const rotate = (axis: 'x' | 'y' | 'z', degrees: number) =>
    void callWebMCPTool('rotate_object', { axis, degrees });
  const zoom = (level: number) => void callWebMCPTool('zoom', { level });

  const maxZoom = maxZoomFor(countWrong(guesses));
  const rotationStep = revealTier >= 2 ? 30 : 15;
  const zoomPct = maxZoom === 0 ? 0 : (zoomLevel / maxZoom) * 100;

  return (
    <div style={styles.container}>
      <div style={styles.zoomRow}>
        <button
          type="button"
          onClick={() => zoom(zoomLevel - 1)}
          style={styles.iconBtn}
          disabled={zoomLevel <= 0}
          title="Zoom out"
          aria-label="Zoom out"
        >
          −
        </button>

        <div style={styles.track} role="presentation">
          <div style={{ ...styles.trackFill, width: `${zoomPct}%` }} />
          <button
            type="button"
            style={{
              ...styles.thumb,
              left: `calc(${zoomPct}% - 7px)`,
            }}
            onClick={() => zoom(Math.min(zoomLevel + 1, maxZoom))}
            disabled={zoomLevel >= maxZoom}
            title={`Zoom ${zoomLevel + 1} / ${maxZoom + 1}`}
            aria-label={`Zoom level ${zoomLevel + 1} of ${maxZoom + 1}`}
          />
        </div>

        <button
          type="button"
          onClick={() => zoom(zoomLevel + 1)}
          style={styles.iconBtn}
          disabled={zoomLevel >= maxZoom}
          title="Zoom in"
          aria-label="Zoom in"
        >
          +
        </button>

        <div style={styles.divider} />

        <button
          type="button"
          onClick={() => rotate('y', -rotationStep)}
          style={styles.iconBtn}
          title="Rotate left"
          aria-label="Rotate left"
        >
          ↺
        </button>
        <button
          type="button"
          onClick={() => rotate('y', rotationStep)}
          style={styles.iconBtn}
          title="Rotate right"
          aria-label="Rotate right"
        >
          ↻
        </button>
        <button
          type="button"
          onClick={() => rotate('x', -rotationStep)}
          style={styles.iconBtn}
          title="Tilt up"
          aria-label="Tilt up"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => rotate('x', rotationStep)}
          style={styles.iconBtn}
          title="Tilt down"
          aria-label="Tilt down"
        >
          ↓
        </button>
      </div>

      {zoomLevel >= maxZoom && maxZoom < 3 && (
        <p style={styles.hint}>More zoom unlocks after wrong guesses</p>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-2) 0',
  },
  zoomRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-3)',
    width: '100%',
    maxWidth: 420,
  },
  track: {
    position: 'relative',
    flex: 1,
    height: 2,
    background: 'var(--border)',
    borderRadius: 2,
  },
  trackFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 2,
    background: 'linear-gradient(90deg, var(--neon-cyan), var(--neon-magenta))',
    boxShadow: '0 0 8px var(--neon-glow)',
    transition: 'width 200ms ease',
  },
  thumb: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: 'var(--surface)',
    border: '2px solid var(--ink)',
    padding: 0,
    cursor: 'pointer',
    boxShadow: '0 0 0 3px var(--accent-subtle)',
  },
  iconBtn: {
    width: 36,
    height: 36,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '50%',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--ink-secondary)',
    fontSize: 'var(--text-base)',
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: 'var(--shadow-sm)',
  },
  divider: {
    width: 1,
    height: 20,
    background: 'var(--border)',
    margin: '0 2px',
  },
  hint: {
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--ink-tertiary)',
    fontStyle: 'italic',
    margin: 0,
  },
};
