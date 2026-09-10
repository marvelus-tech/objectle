import React from 'react';
import { useGameStore } from '../lib/store';
import { callWebMCPTool } from '../lib/webmcp';
import { countWrong, maxZoomFor } from '../../../shared/progression';

/**
 * Compact stage controls matching the prototype: zoom rail + rotate nudge.
 * Overlays the bottom of the prism frame.
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

  return (
    <div className="viewer-controls" style={styles.container}>
      <button
        type="button"
        className="btn-ghost"
        style={styles.iconBtn}
        onClick={() => zoom(zoomLevel - 1)}
        disabled={zoomLevel <= 0}
        title="Zoom out"
        aria-label="Zoom out"
      >
        −
      </button>

      <input
        type="range"
        min={0}
        max={Math.max(maxZoom, 1)}
        step={1}
        value={Math.min(zoomLevel, maxZoom)}
        onChange={e => zoom(Number(e.target.value))}
        style={styles.slider}
        aria-label={`Zoom level ${zoomLevel} of ${maxZoom}`}
      />

      <button
        type="button"
        className="btn-ghost"
        style={styles.iconBtn}
        onClick={() => zoom(zoomLevel + 1)}
        disabled={zoomLevel >= maxZoom}
        title="Zoom in"
        aria-label="Zoom in"
      >
        +
      </button>

      <button
        type="button"
        className="btn-ghost"
        style={styles.rotateBtn}
        onClick={() => rotate('y', rotationStep)}
        title="Rotate right"
        aria-label="Rotate object"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 12a8 8 0 1 1-2.34-5.66"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M20 4v5h-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(8px)',
    borderRadius: '999px',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'var(--shadow-sm)',
  },
  iconBtn: {
    width: '28px',
    height: '28px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '50%',
    padding: 0,
    fontSize: '16px',
    fontWeight: 600,
    lineHeight: 1,
    color: 'var(--ink)',
    background: 'transparent',
    border: 'none',
  },
  slider: {
    width: '140px',
    accentColor: 'var(--accent)',
    cursor: 'pointer',
  },
  rotateBtn: {
    width: '32px',
    height: '32px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '50%',
    padding: 0,
    color: 'var(--ink)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    marginLeft: '4px',
  },
};
