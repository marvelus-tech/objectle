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
    <div style={styles.container}>
      <button
        onClick={() => setShowPanel(!showPanel)}
        style={styles.toggleButton}
        title="Agent Tools Panel"
      >
        🤖 Agent Tools {showPanel ? '▼' : '▲'}
      </button>
      
      {showPanel && (
        <div style={styles.panel}>
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
    position: 'fixed',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  toggleButton: {
    padding: '12px 20px',
    background: '#4a90e2',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)',
  },
  panel: {
    marginTop: '10px',
    width: '400px',
    maxHeight: '80vh',
    overflowY: 'auto',
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
    border: '2px solid #4a90e2',
  },
  heading: {
    fontSize: '20px',
    fontWeight: 700,
    marginBottom: '8px',
    color: '#333',
  },
  subtitle: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '16px',
  },
  section: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '6px',
    color: '#333',
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    border: '2px solid #d0d0d0',
    borderRadius: '6px',
    outline: 'none',
  },
  toolInfo: {
    background: '#f8f9fa',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '13px',
  },
  description: {
    margin: '6px 0 12px 0',
    color: '#555',
  },
  schema: {
    background: '#fff',
    padding: '8px',
    borderRadius: '4px',
    fontSize: '11px',
    overflow: 'auto',
    maxHeight: '150px',
  },
  textarea: {
    width: '100%',
    padding: '8px 12px',
    fontSize: '13px',
    fontFamily: 'monospace',
    border: '2px solid #d0d0d0',
    borderRadius: '6px',
    outline: 'none',
    resize: 'vertical',
  },
  executeButton: {
    width: '100%',
    padding: '12px',
    background: '#2ecc71',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  resultSection: {
    marginTop: '16px',
    padding: '12px',
    background: '#e8f4f8',
    borderRadius: '6px',
    border: '2px solid #4a90e2',
  },
  result: {
    margin: '8px 0',
    padding: '10px',
    background: '#fff',
    borderRadius: '4px',
    fontSize: '12px',
    whiteSpace: 'pre-wrap',
    overflow: 'auto',
    maxHeight: '200px',
  },
  copyButton: {
    padding: '6px 12px',
    background: '#4a90e2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  footer: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e0e0e0',
  },
  footerText: {
    fontSize: '11px',
    color: '#888',
    margin: 0,
  },
};
