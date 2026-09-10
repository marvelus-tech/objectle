import React, { useState } from 'react';
import { webmcpTools, callWebMCPTool } from '../lib/webmcp';

/**
 * Agent Fallback Panel (Foresight Shop pattern)
 * Visible panel where agents can execute tools and see results
 */
export default function AgentPanel() {
  const [selectedTool, setSelectedTool] = useState(webmcpTools[0]?.name || '');
  const [toolArgs, setToolArgs] = useState('{}');
  const [result, setResult] = useState('');
  const [executing, setExecuting] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  
  const handleExecute = async () => {
    if (!selectedTool) return;
    
    setExecuting(true);
    setResult('');
    
    try {
      const args = JSON.parse(toolArgs);
      const output = await callWebMCPTool(selectedTool, args);
      setResult(output);
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setExecuting(false);
    }
  };
  
  const tool = webmcpTools.find(t => t.name === selectedTool);
  
  return (
    <div className="agent-panel-shell" style={styles.container}>
      <button
        onClick={() => setShowPanel(!showPanel)}
        style={styles.toggleButton}
        title="Agent Tools Panel"
      >
        Agent Tools {showPanel ? '▼' : '▲'}
      </button>
      
      {showPanel && (
        <div className="agent-panel-drawer" style={styles.panel}>
          <h3 style={styles.heading}>WebMCP Tools</h3>
          <p style={styles.subtitle}>
            Agents: These tools are available via the page modelContext API
          </p>
          
          <div style={styles.section}>
            <label style={styles.label}>Select Tool:</label>
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              style={styles.select}
            >
              {webmcpTools.map(tool => (
                <option key={tool.name} value={tool.name}>
                  {tool.name}
                </option>
              ))}
            </select>
          </div>
          
          {tool && (
            <div style={styles.section}>
              <div style={styles.toolInfo}>
                <strong>Description:</strong>
                <p style={styles.description}>{tool.description}</p>
                
                <strong>Schema:</strong>
                <pre style={styles.schema}>
                  {JSON.stringify(tool.inputSchema, null, 2)}
                </pre>
              </div>
            </div>
          )}
          
          <div style={styles.section}>
            <label style={styles.label}>Arguments (JSON):</label>
            <textarea
              value={toolArgs}
              onChange={(e) => setToolArgs(e.target.value)}
              style={styles.textarea}
              rows={4}
              placeholder='{"axis": "y", "degrees": 30}'
            />
          </div>
          
          <button
            onClick={handleExecute}
            disabled={executing}
            style={{
              ...styles.executeButton,
              opacity: executing ? 0.6 : 1,
            }}
          >
            {executing ? 'Executing...' : 'Execute Tool'}
          </button>
          
          {result && (
            <div style={styles.resultSection}>
              <strong>Result:</strong>
              <pre style={styles.result}>{result}</pre>
              <button
                onClick={() => navigator.clipboard.writeText(result)}
                style={styles.copyButton}
              >
                Copy Result
              </button>
            </div>
          )}
          
          <div style={styles.footer}>
            <p style={styles.footerText}>
              Agents can call these tools directly without this panel.
              This fallback UI is for testing and demonstration.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed' as const,
    bottom: 'var(--space-5)',
    right: 'var(--space-5)',
    zIndex: 1000,
  },
  toggleButton: {
    padding: 'var(--space-3) var(--space-5)',
    background: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: 'var(--shadow-lg)',
    letterSpacing: '0.02em',
  },
  panel: {
    marginTop: 'var(--space-3)',
    width: '420px',
    maxHeight: '80vh',
    overflowY: 'auto' as const,
    background: 'var(--surface)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-6)',
    boxShadow: 'var(--shadow-lg)',
    border: `2px solid var(--accent)`,
    animation: 'fadeScaleIn 220ms ease-out',
  },
  heading: {
    fontSize: 'var(--text-xl)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    marginBottom: 'var(--space-2)',
    color: 'var(--ink)',
  },
  subtitle: {
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--ink-secondary)',
    marginBottom: 'var(--space-5)',
  },
  section: {
    marginBottom: 'var(--space-5)',
  },
  label: {
    display: 'block',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 600,
    marginBottom: 'var(--space-2)',
    color: 'var(--ink)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  select: {
    width: '100%',
    padding: 'var(--space-3)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    border: `2px solid var(--border)`,
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    background: 'var(--surface)',
    color: 'var(--ink)',
  },
  toolInfo: {
    background: 'var(--info-bg)',
    padding: 'var(--space-4)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    border: `1px solid var(--border-subtle)`,
  },
  description: {
    margin: `var(--space-2) 0 var(--space-4) 0`,
    color: 'var(--ink-secondary)',
  },
  schema: {
    background: 'var(--surface)',
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-ui), monospace',
    overflow: 'auto' as const,
    maxHeight: '150px',
    border: `1px solid var(--border-subtle)`,
  },
  textarea: {
    width: '100%',
    padding: 'var(--space-3)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui), monospace',
    border: `2px solid var(--border)`,
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    resize: 'vertical' as const,
    background: 'var(--surface)',
    color: 'var(--ink)',
  },
  executeButton: {
    width: '100%',
    padding: 'var(--space-4)',
    background: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 500,
    cursor: 'pointer',
  },
  resultSection: {
    marginTop: 'var(--space-5)',
    padding: 'var(--space-4)',
    background: 'var(--info-bg)',
    borderRadius: 'var(--radius-md)',
    border: `2px solid var(--accent-border)`,
  },
  result: {
    margin: `var(--space-3) 0`,
    padding: 'var(--space-3)',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-ui), monospace',
    whiteSpace: 'pre-wrap' as const,
    overflow: 'auto' as const,
    maxHeight: '200px',
    border: `1px solid var(--border-subtle)`,
  },
  copyButton: {
    padding: 'var(--space-2) var(--space-4)',
    background: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    cursor: 'pointer',
  },
  footer: {
    marginTop: 'var(--space-5)',
    paddingTop: 'var(--space-5)',
    borderTop: `1px solid var(--border-subtle)`,
  },
  footerText: {
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--ink-tertiary)',
    margin: 0,
    fontStyle: 'italic' as const,
  },
};
