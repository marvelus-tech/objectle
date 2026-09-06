import React, { useState, useEffect } from 'react';
import { subscribeToToolExecutions, ToolExecution } from '../lib/webmcp';

/**
 * Dual Watch UI: Tool observation log
 * Shows real-time tool execution for humans watching agents play
 */
export default function ToolLog() {
  const [executions, setExecutions] = useState<ToolExecution[]>([]);
  const [expanded, setExpanded] = useState(true);
  
  useEffect(() => {
    const unsubscribe = subscribeToToolExecutions(setExecutions);
    return unsubscribe;
  }, []);
  
  return (
    <div style={styles.container}>
      <div style={styles.header} onClick={() => setExpanded(!expanded)}>
        <span style={styles.title}>
          Tool Timeline ({executions.length})
        </span>
        <span style={styles.toggle}>{expanded ? '▼' : '▲'}</span>
      </div>
      
      {expanded && (
        <div style={styles.logContainer}>
          {executions.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>Waiting for an agent…</p>
              <p style={styles.emptySubtext}>
                Tool calls will appear here as agents play
              </p>
            </div>
          ) : (
            executions.slice().reverse().map((exec, index) => (
            <div
              key={exec.id}
              style={{
                ...styles.logEntry,
                borderLeft: exec.success
                  ? `3px solid var(--success)`
                  : `3px solid var(--error)`,
                animation: 'slideInFade 200ms ease-out',
                animationDelay: `${index * 40}ms`,
                animationFillMode: 'both',
              }}
            >
              <div style={styles.logHeader}>
                <span style={styles.toolName}>{exec.tool}</span>
                <span style={styles.timestamp}>
                  {new Date(exec.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              {Object.keys(exec.args).length > 0 && (
                <div style={styles.args}>
                  <strong>Args:</strong> {JSON.stringify(exec.args)}
                </div>
              )}
              
              <div style={styles.result}>
                {exec.result.split('\n').slice(0, 3).map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
                {exec.result.split('\n').length > 3 && (
                  <div style={styles.more}>
                    ... ({exec.result.split('\n').length - 3} more lines)
                  </div>
                )}
              </div>
            </div>
          ))
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-md)',
    border: `2px solid var(--accent)`,
    overflow: 'hidden',
  },
  header: {
    padding: 'var(--space-4) var(--space-5)',
    background: 'var(--accent)',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none' as const,
  },
  title: {
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
  toggle: {
    fontSize: 'var(--text-sm)',
  },
  logContainer: {
    maxHeight: '400px',
    overflowY: 'auto' as const,
    padding: 'var(--space-4)',
  },
  logEntry: {
    marginBottom: 'var(--space-3)',
    padding: 'var(--space-4)',
    background: 'var(--info-bg)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-ui)',
    opacity: 0,
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-2)',
  },
  toolName: {
    fontWeight: 600,
    color: 'var(--ink)',
    fontFamily: 'var(--font-ui)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
  },
  timestamp: {
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--ink-tertiary)',
    fontVariantNumeric: 'tabular-nums',
  },
  args: {
    marginBottom: 'var(--space-2)',
    padding: 'var(--space-2)',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-ui), monospace',
    color: 'var(--ink-secondary)',
    border: `1px solid var(--border-subtle)`,
  },
  result: {
    padding: 'var(--space-2)',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--ink)',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    border: `1px solid var(--border-subtle)`,
  },
  more: {
    color: 'var(--ink-tertiary)',
    fontStyle: 'italic' as const,
    marginTop: 'var(--space-1)',
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
