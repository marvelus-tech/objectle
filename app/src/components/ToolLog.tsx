import React from 'react';
import {
  describeToolAction,
  describeToolResult,
  useTheaterStore,
} from '../lib/theater';
import { useGameStore } from '../lib/store';

const STEPS = [
  {
    id: 'scan',
    title: 'Scan Shape',
    idle: 'Analyzing silhouette...',
    tools: ['read_view'],
  },
  {
    id: 'material',
    title: 'Material Probe',
    idle: 'Estimating material...',
    tools: ['rotate_object', 'zoom'],
  },
  {
    id: 'context',
    title: 'Context Search',
    idle: 'Searching knowledge...',
    tools: ['publish_status'],
  },
  {
    id: 'guess',
    title: 'Final Guess',
    idle: 'Forming hypothesis...',
    tools: ['submit_guess'],
  },
] as const;

function SparkleIcon({ color = 'currentColor' }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2z"
        fill={color}
      />
    </svg>
  );
}

/**
 * Prototype Agent Tool Timeline: fixed 4-step ritual + live status.
 * Detailed event stream still available via the latest activity line.
 */
export default function ToolLog() {
  const events = useTheaterStore(state => state.events);
  const lastAction = useGameStore(state => state.lastAction);
  const agentLastSeenAt = useGameStore(state => state.agentLastSeenAt);
  const roomConnected = useGameStore(state => state.roomConnected);

  const completedTools = new Set(
    events
      .filter(
        (e): e is Extract<typeof e, { kind: 'tool' }> =>
          e.kind === 'tool' && e.phase === 'completed' && e.success !== false,
      )
      .map(e => e.tool),
  );

  const runningEvent = events.find(
    (e): e is Extract<typeof e, { kind: 'tool' }> =>
      e.kind === 'tool' && e.phase === 'running',
  );
  const runningTool = runningEvent?.tool ?? null;

  const stepStates = STEPS.map((step, index) => {
    const done = step.tools.some(t => completedTools.has(t));
    const active = step.tools.some(t => t === runningTool) || (!done && index === 0 && events.length === 0);
    // Progress: first incomplete step after prior completions
    const priorDone = STEPS.slice(0, index).every(s =>
      s.tools.some(t => completedTools.has(t)),
    );
    const current =
      active ||
      (!done && priorDone && !STEPS.some(s => s.tools.some(t => t === runningTool)));
    return { ...step, done, current };
  });

  const stepIndex = Math.min(
    STEPS.filter(s => s.tools.some(t => completedTools.has(t))).length,
    4,
  );

  const thinking =
    Boolean(runningTool) ||
    (roomConnected && agentLastSeenAt !== null && Date.now() - agentLastSeenAt < 10_000);

  const latestLine = (() => {
    const last = events[events.length - 1];
    if (!last) return lastAction?.caption ?? null;
    if (last.kind === 'status') return last.headline;
    return last.phase === 'running'
      ? describeToolAction(last.tool, last.args)
      : describeToolResult(last);
  })();

  return (
    <div className="prism-hairline tool-timeline" style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerLeft}>
          <SparkleIcon color="var(--neon-a-ink)" />
          <span style={styles.title}>Agent tool timeline</span>
        </span>
        <span style={styles.stepPill}>
          Step {stepIndex} / {STEPS.length}
        </span>
      </div>

      <ol style={styles.steps}>
        {stepStates.map((step, index) => (
          <li key={step.id} style={styles.step}>
            <div style={styles.rail}>
              <span
                style={{
                  ...styles.badge,
                  borderColor: step.done || step.current ? 'var(--neon-a)' : 'var(--border)',
                  color: step.done || step.current ? 'var(--neon-a-ink)' : 'var(--ink-muted)',
                  background: step.done || step.current ? 'var(--neon-a-wash)' : 'var(--surface)',
                }}
              >
                {index + 1}
              </span>
              {index < STEPS.length - 1 && (
                <span
                  style={{
                    ...styles.connector,
                    background:
                      step.done ? 'var(--neon-a)' : 'var(--border-subtle)',
                  }}
                />
              )}
            </div>
            <div style={styles.stepCopy}>
              <div style={styles.stepTitleRow}>
                <strong style={styles.stepTitle}>{step.title}</strong>
                <span
                  style={{
                    ...styles.statusDot,
                    background:
                      step.done || step.current ? 'var(--neon-a)' : 'var(--border-strong)',
                    boxShadow:
                      step.current && thinking
                        ? '0 0 0 4px var(--neon-a-soft)'
                        : undefined,
                  }}
                />
              </div>
              <p style={styles.stepSub}>
                {step.current && latestLine ? latestLine : step.idle}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div style={styles.footer}>
        <span style={styles.footerLeft}>
          <SparkleIcon color="var(--neon-b-ink)" />
          <span>{thinking ? 'Agent is thinking' : 'Waiting for agent'}</span>
        </span>
        <span style={styles.ellipsis} aria-hidden="true">
          ···
        </span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--border-subtle)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '420px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-3)',
    padding: 'var(--space-4) var(--space-5)',
    borderBottom: '1px solid var(--border-subtle)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--ink)',
  },
  title: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  stepPill: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--ink-tertiary)',
    fontVariantNumeric: 'tabular-nums',
  },
  steps: {
    listStyle: 'none',
    margin: 0,
    padding: 'var(--space-5)',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  step: {
    display: 'grid',
    gridTemplateColumns: '28px 1fr',
    gap: '12px',
    minHeight: '72px',
  },
  rail: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  badge: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '1.5px solid',
    display: 'grid',
    placeItems: 'center',
    fontSize: '12px',
    fontWeight: 700,
    flexShrink: 0,
  },
  connector: {
    width: '2px',
    flex: 1,
    minHeight: '28px',
    margin: '4px 0',
    borderRadius: '1px',
  },
  stepCopy: {
    paddingBottom: 'var(--space-4)',
  },
  stepTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  stepTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-base)',
    fontWeight: 600,
    color: 'var(--ink)',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  stepSub: {
    margin: '4px 0 0',
    fontSize: 'var(--text-sm)',
    color: 'var(--ink-tertiary)',
    lineHeight: 1.4,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px var(--space-5)',
    borderTop: '1px solid var(--border-subtle)',
    color: 'var(--ink-secondary)',
    fontSize: 'var(--text-sm)',
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  ellipsis: {
    letterSpacing: '2px',
    color: 'var(--ink-muted)',
    fontWeight: 700,
  },
};
