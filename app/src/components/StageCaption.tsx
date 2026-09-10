import React from 'react';
import {
  describeToolAction,
  describeToolResult,
  useTheaterStore,
} from '../lib/theater';

export default function StageCaption() {
  const latestEvent = useTheaterStore(
    state => state.events[state.events.length - 1],
  );

  if (!latestEvent) {
    // Keep the stage clean like the product shot until something happens
    return null;
  }

  if (latestEvent.kind === 'status') {
    return (
      <div key={latestEvent.id} style={styles.caption}>
        <span style={styles.eyebrow}>Working theory</span>
        <strong style={styles.headline}>{latestEvent.headline}</strong>
        {latestEvent.rationale && (
          <span style={styles.supporting}>{latestEvent.rationale}</span>
        )}
      </div>
    );
  }

  const running = latestEvent.phase === 'running';

  return (
    <div key={`${latestEvent.id}-${latestEvent.phase}`} style={styles.caption}>
      <span style={styles.eyebrow}>
        {running ? 'Agent in motion' : latestEvent.success ? 'Action complete' : 'Action paused'}
      </span>
      <strong style={styles.headline}>
        {running
          ? describeToolAction(latestEvent.tool, latestEvent.args)
          : describeToolResult(latestEvent)}
      </strong>
      <span style={styles.supporting}>
        {running
          ? 'The result will appear in the director’s log.'
          : latestEvent.detail
            ? `${latestEvent.detail.remaining} guesses remain.`
            : `${latestEvent.durationMs ?? 0}ms · ${latestEvent.source}`}
      </span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  caption: {
    position: 'absolute',
    left: 'var(--space-5)',
    right: 'var(--space-5)',
    bottom: 'var(--space-5)',
    zIndex: 2,
    padding: 'var(--space-3) var(--space-4)',
    border: '1px solid rgba(255, 255, 255, 0.7)',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255, 255, 255, 0.82)',
    boxShadow: 'var(--shadow-sm)',
    backdropFilter: 'blur(12px)',
    animation: 'captionReveal 240ms ease-out both',
  },
  eyebrow: {
    display: 'block',
    marginBottom: 'var(--space-1)',
    color: 'var(--accent)',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  headline: {
    display: 'block',
    color: 'var(--ink)',
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(1.1rem, 2vw, 1.45rem)',
    fontWeight: 600,
    lineHeight: 1.15,
  },
  supporting: {
    display: 'block',
    marginTop: 'var(--space-1)',
    color: 'var(--ink-secondary)',
    fontSize: 'var(--text-xs)',
    lineHeight: 1.45,
  },
};
