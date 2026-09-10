import React, { useEffect, useState } from 'react';
import { webmcpTools, callWebMCPTool, openAgentPanel } from '../lib/webmcp';

/**
 * Foresight-style Agent Tools panel.
 * Always available on this tab — the demo path when Cloudflare is down.
 */
export default function AgentPanel() {
  const [selectedTool, setSelectedTool] = useState<string>(webmcpTools[0]?.name || '');
  const [toolArgs, setToolArgs] = useState('{"axis":"y","degrees":30}');
  const [result, setResult] = useState('');
  const [executing, setExecuting] = useState(false);
  const [showPanel, setShowPanel] = useState(() => {
    if (typeof window === 'undefined') return false;
    const q = new URLSearchParams(window.location.search);
    return q.get('demo') === '1' || q.get('agent') === '1';
  });

  useEffect(() => {
    const open = () => setShowPanel(true);
    window.addEventListener('objectle:open-agent-panel', open);
    return () => window.removeEventListener('objectle:open-agent-panel', open);
  }, []);

  useEffect(() => {
    // Seed sensible JSON args when the tool changes.
    if (selectedTool === 'rotate_object') setToolArgs('{"axis":"y","degrees":30}');
    else if (selectedTool === 'zoom') setToolArgs('{"level":1}');
    else if (selectedTool === 'submit_guess') setToolArgs('{"name":"mug"}');
    else if (selectedTool === 'publish_status') {
      setToolArgs('{"headline":"Checking the silhouette for a handle","confidence":"medium"}');
    } else setToolArgs('{}');
  }, [selectedTool]);

  const handleExecute = async () => {
    if (!selectedTool) return;
    setExecuting(true);
    setResult('');
    try {
      const args = JSON.parse(toolArgs || '{}');
      const output = await callWebMCPTool(selectedTool, args, 'agent');
      setResult(output);
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setExecuting(false);
    }
  };

  const quick = async (tool: string, args: Record<string, unknown>) => {
    setShowPanel(true);
    setSelectedTool(tool);
    setToolArgs(JSON.stringify(args));
    setExecuting(true);
    setResult('');
    try {
      setResult(await callWebMCPTool(tool, args, 'agent'));
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
        type="button"
        onClick={() => setShowPanel(!showPanel)}
        style={styles.toggleButton}
        title="Agent Tools Panel"
      >
        Agent Tools {showPanel ? '▼' : '▲'}
      </button>

      {showPanel && (
        <div style={styles.panel}>
          <h3 style={styles.heading}>Agent tools</h3>
          <p style={styles.subtitle}>
            Same tools WebMCP agents call. Run them here and watch the stage move — no Cloudflare required.
          </p>

          <div style={styles.quickRow}>
            <button type="button" style={styles.quick} onClick={() => quick('read_view', {})}>
              Read view
            </button>
            <button
              type="button"
              style={styles.quick}
              onClick={() => quick('rotate_object', { axis: 'y', degrees: 30 })}
            >
              Rotate Y+30
            </button>
            <button
              type="button"
              style={styles.quick}
              onClick={() =>
                quick('publish_status', {
                  headline: 'Silhouette looks like a vessel',
                  confidence: 'medium',
                })
              }
            >
              Status
            </button>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Tool</label>
            <select
              value={selectedTool}
              onChange={e => setSelectedTool(e.target.value)}
              style={styles.select}
            >
              {webmcpTools.map(t => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {tool && (
            <div style={styles.section}>
              <div style={styles.toolInfo}>
                <strong>Description</strong>
                <p style={styles.description}>{tool.description}</p>
                <strong>Schema</strong>
                <pre style={styles.schema}>{JSON.stringify(tool.inputSchema, null, 2)}</pre>
              </div>
            </div>
          )}

          <div style={styles.section}>
            <label style={styles.label}>Arguments (JSON)</label>
            <textarea
              value={toolArgs}
              onChange={e => setToolArgs(e.target.value)}
              style={styles.textarea}
              rows={4}
              placeholder='{"axis":"y","degrees":30}'
            />
          </div>

          <button
            type="button"
            onClick={handleExecute}
            disabled={executing}
            style={{ ...styles.executeButton, opacity: executing ? 0.6 : 1 }}
          >
            {executing ? 'Running…' : 'Execute tool'}
          </button>

          {result && (
            <div style={styles.resultSection}>
              <strong>Result</strong>
              <pre style={styles.result}>{result}</pre>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(result)}
                style={styles.copyButton}
              >
                Copy result
              </button>
            </div>
          )}

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Tip: add <code>?demo=1</code> to the URL to open this panel automatically. Or call{' '}
              <button type="button" style={styles.linkish} onClick={() => openAgentPanel()}>
                openAgentPanel()
              </button>
              .
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
    bottom: 'var(--space-5, 20px)',
    right: 'var(--space-5, 20px)',
    zIndex: 1000,
  },
  toggleButton: {
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #2EE6D6, #FF5EC8)',
    color: '#101018',
    border: 'none',
    borderRadius: '12px',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
  },
  panel: {
    marginTop: '10px',
    width: 'min(420px, calc(100vw - 32px))',
    maxHeight: '80vh',
    overflowY: 'auto',
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(14px)',
    borderRadius: '16px',
    padding: '18px',
    boxShadow: '0 16px 40px rgba(0,0,0,0.2)',
    border: '1px solid rgba(30,30,30,0.12)',
    color: '#1c1c1c',
  },
  heading: {
    fontSize: '1.2rem',
    fontFamily: 'Newsreader, Georgia, serif',
    fontWeight: 600,
    margin: '0 0 6px',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: '#555',
    marginBottom: '12px',
  },
  quickRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '14px',
  },
  quick: {
    cursor: 'pointer',
    borderRadius: '999px',
    border: '1px solid rgba(30,30,30,0.15)',
    background: '#F4F1EB',
    padding: '6px 10px',
    fontSize: '0.78rem',
    fontWeight: 600,
  },
  section: { marginBottom: '14px' },
  label: {
    display: 'block',
    fontSize: '0.72rem',
    fontWeight: 700,
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  select: {
    width: '100%',
    padding: '10px',
    fontSize: '0.9rem',
    border: '2px solid #ddd',
    borderRadius: '10px',
    background: '#fff',
  },
  toolInfo: {
    background: '#F7F5F0',
    padding: '12px',
    borderRadius: '10px',
    fontSize: '0.85rem',
    border: '1px solid #e6e2da',
  },
  description: { margin: '6px 0 10px', color: '#444' },
  schema: {
    background: '#fff',
    padding: '8px',
    borderRadius: '8px',
    fontSize: '0.72rem',
    overflow: 'auto',
    maxHeight: '120px',
    border: '1px solid #e6e2da',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    fontSize: '0.85rem',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    border: '2px solid #ddd',
    borderRadius: '10px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  executeButton: {
    width: '100%',
    padding: '12px',
    background: '#1c1c1c',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  resultSection: {
    marginTop: '14px',
    padding: '12px',
    background: '#F0FBFF',
    borderRadius: '10px',
    border: '1px solid #b7e6f5',
  },
  result: {
    margin: '8px 0',
    padding: '8px',
    background: '#fff',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    whiteSpace: 'pre-wrap',
    overflow: 'auto',
    maxHeight: '180px',
  },
  copyButton: {
    padding: '6px 10px',
    background: '#1c1c1c',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  footer: {
    marginTop: '14px',
    paddingTop: '12px',
    borderTop: '1px solid #e6e2da',
  },
  footerText: {
    fontSize: '0.75rem',
    color: '#777',
    margin: 0,
  },
  linkish: {
    background: 'none',
    border: 'none',
    color: '#0a6',
    cursor: 'pointer',
    padding: 0,
    font: 'inherit',
    textDecoration: 'underline',
  },
};
