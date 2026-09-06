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
          📋 Tool Log ({executions.length})
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
            executions.slice().reverse().map((exec) => (
            <div
              key={exec.id}
              style={{
                ...styles.logEntry,
                borderLeft: exec.success
                  ? '4px solid #2ecc71'
                  : '4px solid #e74c3c',
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
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    border: '2px solid #4a90e2',
    overflow: 'hidden',
  },
  header: {
    padding: '12px 16px',
    background: '#4a90e2',
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none',
  },
  title: {
    fontSize: '14px',
    fontWeight: 600,
  },
  toggle: {
    fontSize: '12px',
  },
  logContainer: {
    maxHeight: '400px',
    overflowY: 'auto',
    padding: '12px',
  },
  logEntry: {
    marginBottom: '12px',
    padding: '10px',
    background: '#f8f9fa',
    borderRadius: '6px',
    fontSize: '12px',
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  toolName: {
    fontWeight: 600,
    color: '#333',
  },
  timestamp: {
    fontSize: '11px',
    color: '#888',
  },
  args: {
    marginBottom: '6px',
    padding: '6px',
    background: '#fff',
    borderRadius: '4px',
    fontSize: '11px',
    fontFamily: 'monospace',
    color: '#555',
  },
  result: {
    padding: '6px',
    background: '#fff',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#333',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  more: {
    color: '#888',
    fontStyle: 'italic',
    marginTop: '4px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '2rem 1rem',
  },
  emptyText: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#666',
    margin: '0 0 0.5rem 0',
  },
  emptySubtext: {
    fontSize: '12px',
    color: '#888',
    margin: 0,
  },
};
