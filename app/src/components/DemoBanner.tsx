import React, { useEffect, useState } from 'react';
import { getWebMCPMode, openAgentPanel, callWebMCPTool, type WebMCPMode } from '../lib/webmcp';
import { useGameStore } from '../lib/store';
import { agentPromptFor } from '../lib/prompt';
import { isWorkerAvailable } from '../lib/api';

/**
 * Foresight-style demo strip: keep this tab open, copy a prompt, prove a rotate.
 * Always works offline — page tools drive the theater directly.
 */
export default function DemoBanner() {
  const roomCode = useGameStore(s => s.roomCode);
  const roomConnected = useGameStore(s => s.roomConnected);
  const [mode, setMode] = useState<WebMCPMode>('panel');
  const [copied, setCopied] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [spinMsg, setSpinMsg] = useState('');

  useEffect(() => {
    setMode(getWebMCPMode());
    const t = window.setInterval(() => setMode(getWebMCPMode()), 1500);
    return () => window.clearInterval(t);
  }, []);

  const modeLabel =
    mode === 'live' ? 'WebMCP live' : mode === 'polyfill' ? 'WebMCP polyfill' : 'Agent panel';

  const copyPrompt = async () => {
    const text = agentPromptFor(roomCode || 'DEMO');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      openAgentPanel();
    }
  };

  const proveRotate = async () => {
    setSpinning(true);
    setSpinMsg('');
    try {
      const text = await callWebMCPTool('rotate_object', { axis: 'y', degrees: 45 }, 'agent');
      setSpinMsg(text);
      openAgentPanel();
    } catch (err) {
      setSpinMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSpinning(false);
    }
  };

  return (
    <section style={styles.bar} aria-label="Demo controls for agents">
      <div style={styles.left}>
        <strong style={styles.kicker}>Demo mode</strong>
        <span style={styles.chip} data-mode={mode}>
          {modeLabel}
        </span>
        <span style={styles.chipMuted}>
          {roomConnected
            ? `Room ${roomCode} live`
            : isWorkerAvailable()
              ? `Room ${roomCode || '—'} connecting…`
              : `Local theater · room ${roomCode || '—'}`}
        </span>
        <span style={styles.hint}>Keep this tab open. Agents move what you see here.</span>
      </div>
      <div style={styles.actions}>
        <button type="button" style={styles.primary} onClick={proveRotate} disabled={spinning}>
          {spinning ? 'Spinning…' : 'Prove it: rotate 45°'}
        </button>
        <button type="button" style={styles.secondary} onClick={() => openAgentPanel()}>
          Agent tools
        </button>
        <button type="button" style={styles.secondary} onClick={copyPrompt}>
          {copied ? 'Copied' : 'Copy agent prompt'}
        </button>
      </div>
      {spinMsg ? <p style={styles.msg}>{spinMsg}</p> : null}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '12px 16px',
    margin: '0 0 16px',
    borderRadius: '14px',
    background: 'linear-gradient(120deg, rgba(20,28,40,0.92), rgba(28,18,36,0.92))',
    color: '#F4F1EB',
    border: '1px solid rgba(120, 220, 255, 0.35)',
    boxShadow: '0 0 0 1px rgba(255,80,180,0.12), 0 12px 40px rgba(0,0,0,0.25)',
  },
  left: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
    flex: 1,
  },
  kicker: {
    fontFamily: 'Newsreader, Georgia, serif',
    fontSize: '1.05rem',
    letterSpacing: '0.02em',
  },
  chip: {
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '999px',
    background: 'rgba(80, 255, 210, 0.18)',
    color: '#9FFFF0',
    border: '1px solid rgba(80, 255, 210, 0.35)',
  },
  chipMuted: {
    fontSize: '0.75rem',
    padding: '3px 8px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.08)',
    color: 'rgba(244,241,235,0.85)',
  },
  hint: {
    fontSize: '0.8rem',
    color: 'rgba(244,241,235,0.7)',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  primary: {
    cursor: 'pointer',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 12px',
    fontWeight: 600,
    fontSize: '0.85rem',
    color: '#101018',
    background: 'linear-gradient(135deg, #7CF5FF, #FF7AD9)',
  },
  secondary: {
    cursor: 'pointer',
    borderRadius: '10px',
    padding: '8px 12px',
    fontWeight: 600,
    fontSize: '0.85rem',
    color: '#F4F1EB',
    background: 'transparent',
    border: '1px solid rgba(244,241,235,0.35)',
  },
  msg: {
    flexBasis: '100%',
    margin: 0,
    fontSize: '0.78rem',
    color: 'rgba(244,241,235,0.75)',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
};
