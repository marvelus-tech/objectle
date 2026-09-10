import React, { useState } from 'react';
import {
  describeToolAction,
  describeToolResult,
  ToolTheaterEvent,
  useTheaterStore,
} from '../lib/theater';

/**
 * Dual Watch UI: Tool observation log
 * Shows real-time tool execution for humans watching agents play
 */
export default function ToolLog() {
  const events = useTheaterStore(state => state.events);
  const [expanded, setExpanded] = useState(true);

  const stepLabel = Math.min(events.length, 4);

  return (
    <div className="glass-panel" style={styles.container}>
      <button
        type="button"
        style={styles.header}
        onClick={() => setExpanded(current => !current)}
        aria-expanded={expanded}
      >
        <span>
          <span style={styles.eyebrow}>Agent tool timeline</span>
          <span style={styles.title}>Live probe</span>
        </span>
        <span style={styles.count}>
          Step {stepLabel} / 4
        </span>
      </button>

      {expanded && (
        <div style={styles.logContainer} aria-live="polite">
          {events.length === 0 ? (
            <div style={styles.emptyState}>
              <ol style={styles.probeList}>
                <li style={styles.probeActive}>
                  <span style={styles.probeDot} />
                  <div>
                    <strong>Scan shape</strong>
                    <span style={styles.probeHint}>Analyzing silhouette...</span>
                  </div>
                </li>
                <li style={styles.probeIdle}>
                  <span style={styles.probeRing} />
                  <div>
                    <strong>Material probe</strong>
                    <span style={styles.probeHint}>Estimating material...</span>
                  </div>
                </li>
                <li style={styles.probeIdle}>
                  <span style={styles.probeRing} />
                  <div>
                    <strong>Context search</strong>
                    <span style={styles.probeHint}>Searching knowledge...</span>
                  </div>
                </li>
                <li style={styles.probeIdle}>
                  <span style={styles.probeRing} />
                  <div>
                    <strong>Final guess</strong>
                    <span style={styles.probeHint}>Forming hypothesis...</span>
                  </div>
                </li>
              </ol>
              <p style={styles.thinking}>
                <span style={styles.thinkingSpark} aria-hidden />
                Agent is thinking
                <span style={styles.thinkingDots}>...</span>
              </p>
            </div>
          ) : (
            events
              .slice()
              .reverse()
              .map((event, index) =>
                event.kind === 'tool' ? (
                  <ToolEntry key={event.id} event={event} index={index} />
                ) : (
                  <article key={event.id} style={styles.statusEntry}>
                    <span style={styles.entryEyebrow}>Working theory</span>
                    <strong style={styles.entryHeadline}>{event.headline}</strong>
                    {event.rationale && <p style={styles.result}>{event.rationale}</p>}
                    {event.candidates && (
                      <div style={styles.statusCandidates}>
                        {event.candidates.map(candidate => (
                          <span key={candidate.name} style={styles.statusCandidate}>
                            {candidate.name}
                            {typeof candidate.confidence === 'number'
                              ? ` ${candidate.confidence}%`
                              : ''}
                          </span>
                        ))}
                      </div>
                    )}
                    {event.next && (
                      <p style={styles.next}>
                        <strong>Next:</strong> {event.next}
                      </p>
                    )}
                  </article>
                ),
              )
          )}
        </div>
      )}
    </div>
  );
}

function ToolEntry({ event, index }: { event: ToolTheaterEvent; index: number }) {
  const [showRaw, setShowRaw] = useState(false);
  const running = event.phase === 'running';
  const accent = running
    ? 'var(--accent)'
    : event.success
      ? 'var(--success)'
      : 'var(--error)';

  return (
    <article
      style={{
        ...styles.logEntry,
        borderLeftColor: accent,
        animationDelay: `${Math.min(index, 5) * 35}ms`,
      }}
    >
      <div style={styles.logHeader}>
        <span style={styles.source}>{event.source}</span>
        <time style={styles.timestamp}>
          {new Date(event.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </time>
      </div>

      <strong style={styles.entryHeadline}>
        {running
          ? describeToolAction(event.tool, event.args)
          : describeToolResult(event)}
      </strong>

      <div style={styles.stateLine}>
        <span style={{ ...styles.stateDot, background: accent }} />
        {running
          ? 'In progress'
          : `${event.success ? 'Complete' : 'Needs attention'} · ${event.durationMs ?? 0}ms`}
      </div>

      {event.detail && <FacetSummary detail={event.detail} />}

      {event.result && event.tool === 'read_view' && (
        <p style={styles.observation}>{event.result.split('\n\n')[0]}</p>
      )}

      {(Object.keys(event.args).length > 0 || event.result) && (
        <>
          <button
            type="button"
            style={styles.detailButton}
            onClick={() => setShowRaw(current => !current)}
          >
            {showRaw ? 'Hide technical detail' : 'Show technical detail'}
          </button>
          {showRaw && (
            <pre style={styles.rawDetail}>
              {Object.keys(event.args).length > 0
                ? `Input\n${JSON.stringify(event.args, null, 2)}\n\n`
                : ''}
              {event.result ? `Output\n${event.result}` : ''}
            </pre>
          )}
        </>
      )}
    </article>
  );
}

function FacetSummary({ detail }: { detail: NonNullable<ToolTheaterEvent['detail']> }) {
  return (
    <div style={styles.facets}>
      {Object.entries(detail.facets).map(([name, facet]) => (
        <span
          key={name}
          style={{
            ...styles.facet,
            color: facet.match ? 'var(--success)' : 'var(--error)',
            background: facet.match ? 'var(--success-bg)' : 'var(--error-bg)',
          }}
        >
          {name} {facet.match ? 'matched' : 'missed'}
        </span>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    overflow: 'hidden',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'var(--shadow-md), 0 0 0 1px rgba(34, 211, 238, 0.08)',
  },
  header: {
    width: '100%',
    border: 0,
    padding: 'var(--space-4) var(--space-5)',
    background: 'transparent',
    color: 'var(--ink)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textAlign: 'left',
    borderBottom: '1px solid var(--border-subtle)',
  },
  eyebrow: {
    display: 'block',
    marginBottom: '2px',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--accent)',
  },
  title: {
    display: 'block',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
  count: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--ink-tertiary)',
  },
  logContainer: {
    maxHeight: '420px',
    overflowY: 'auto' as const,
    padding: 'var(--space-4)',
  },
  logEntry: {
    marginBottom: 'var(--space-3)',
    padding: 'var(--space-4)',
    background: 'rgba(255,255,255,0.65)',
    borderRadius: 'var(--radius-md)',
    borderLeft: '3px solid var(--accent)',
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-ui)',
    animation: 'slideInFade 240ms ease-out both',
  },
  statusEntry: {
    marginBottom: 'var(--space-3)',
    padding: 'var(--space-4)',
    background: 'var(--accent-subtle)',
    borderRadius: 'var(--radius-md)',
    borderLeft: '3px solid var(--accent)',
    animation: 'slideInFade 240ms ease-out both',
  },
  probeList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    margin: '0 0 var(--space-5)',
    padding: 0,
  },
  probeActive: {
    display: 'flex',
    gap: 'var(--space-3)',
    alignItems: 'flex-start',
    color: 'var(--ink)',
    fontSize: 'var(--text-sm)',
  },
  probeIdle: {
    display: 'flex',
    gap: 'var(--space-3)',
    alignItems: 'flex-start',
    color: 'var(--ink-tertiary)',
    fontSize: 'var(--text-sm)',
  },
  probeDot: {
    width: 10,
    height: 10,
    marginTop: 4,
    borderRadius: '50%',
    background: 'var(--neon-teal)',
    boxShadow: '0 0 0 4px rgba(20, 184, 166, 0.2), 0 0 12px var(--neon-glow)',
    flexShrink: 0,
  },
  probeRing: {
    width: 10,
    height: 10,
    marginTop: 4,
    borderRadius: '50%',
    border: '1.5px solid var(--border-strong)',
    flexShrink: 0,
  },
  probeHint: {
    display: 'block',
    fontSize: '11px',
    color: 'var(--ink-muted)',
    marginTop: 2,
  },
  thinking: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingTop: 'var(--space-4)',
    borderTop: '1px solid var(--border-subtle)',
    fontSize: '12px',
    color: 'var(--ink-secondary)',
    margin: 0,
  },
  thinkingSpark: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-magenta))',
    boxShadow: '0 0 8px var(--neon-glow)',
  },
  thinkingDots: {
    animation: 'thinkingPulse 1.4s ease-in-out infinite',
    letterSpacing: '0.12em',
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-2)',
  },
  source: {
    fontWeight: 600,
    color: 'var(--ink-tertiary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  timestamp: {
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--ink-tertiary)',
    fontVariantNumeric: 'tabular-nums',
  },
  entryEyebrow: {
    display: 'block',
    marginBottom: 'var(--space-1)',
    color: 'var(--accent)',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  entryHeadline: {
    display: 'block',
    color: 'var(--ink)',
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-base)',
    fontWeight: 600,
    lineHeight: 1.25,
  },
  stateLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: 'var(--space-2)',
    color: 'var(--ink-tertiary)',
    fontSize: '11px',
  },
  stateDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
  },
  facets: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-1)',
    marginTop: 'var(--space-3)',
  },
  facet: {
    padding: '4px 7px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  observation: {
    marginTop: 'var(--space-3)',
    color: 'var(--ink-secondary)',
    fontSize: 'var(--text-xs)',
    lineHeight: 1.5,
  },
  result: {
    marginTop: 'var(--space-2)',
    color: 'var(--ink-secondary)',
    fontSize: 'var(--text-xs)',
    lineHeight: 1.5,
  },
  statusCandidates: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-1)',
    marginTop: 'var(--space-3)',
  },
  statusCandidate: {
    padding: '4px 7px',
    borderRadius: '999px',
    background: 'var(--surface)',
    color: 'var(--accent)',
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  next: {
    marginTop: 'var(--space-3)',
    color: 'var(--ink-secondary)',
    fontSize: '11px',
  },
  detailButton: {
    marginTop: 'var(--space-3)',
    padding: 0,
    background: 'transparent',
    color: 'var(--accent)',
    fontSize: '11px',
    fontWeight: 600,
  },
  rawDetail: {
    maxHeight: '220px',
    marginTop: 'var(--space-2)',
    padding: 'var(--space-3)',
    overflow: 'auto',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--info-bg)',
    color: 'var(--ink-secondary)',
    fontSize: '10px',
    lineHeight: 1.45,
    whiteSpace: 'pre-wrap',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: 'var(--space-10) var(--space-4)',
  },
  emptyText: {
    fontSize: 'var(--text-lg)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    color: 'var(--ink-secondary)',
    margin: `0 0 var(--space-2) 0`,
  },
  emptySubtext: {
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--ink-tertiary)',
    margin: 0,
  },
};
