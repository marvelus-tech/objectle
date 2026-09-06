import React, { useState } from 'react';

/**
 * Pass to Agent card - Always visible for room demos
 * QR must be scannable without clicking anything
 */
export default function PassCard() {
  const [copied, setCopied] = useState(false);

  const agentPrompt = `You are playing Objectle. Your human is watching the game on their host screen.

Game URL (open this): https://marvelus-tech.github.io/objectle/
Worker API: https://objectle-worker-demo.marvelus.workers.dev/api

How to play:
1. Open the game URL above in your browser.
2. Use the WebMCP / page modelContext tools to play:
   - read_view() - See current 3D view description
   - rotate_object(axis, degrees) - Rotate for different angles (x/y/z, ±15-45°)
   - zoom(level) - Zoom closer (0-3, unlocks with wrong guesses)
   - submit_guess(name) - Submit your guess
3. You have 6 guesses. Facet feedback shows category/material/scale matches.
4. Your human is watching the 3D viewer and tool timeline on their screen as you play.

Strategy:
- Start with read_view() to see the silhouette
- Rotate around y-axis to see different angles
- Make informed guesses based on shape, facets, and details
- Zoom unlocks progressively (Heardle-style)

Play now!`;

  const handleCopy = () => {
    navigator.clipboard.writeText(agentPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Pass to agent</span>
      </div>
      
      <div style={styles.content}>
        <p style={styles.intro}>
          <strong>Room demo:</strong> Guests scan the QR code to hand this game to your AI agent. Watch the action unfold on this screen in real-time.
        </p>
        
        <div style={styles.qrSection}>
          <img 
            src={`${import.meta.env.BASE_URL}pass/qr.svg`}
            alt="QR code for agent onboarding" 
            style={styles.qrLarge}
          />
          <p style={styles.qrLabel}>Scan to hand to your agent</p>
        </div>
        
        <div style={styles.actions}>
          <button onClick={handleCopy} style={styles.copyButton}>
            {copied ? '✓ Copied!' : 'Copy prompt'}
          </button>
          <a 
            href={`${import.meta.env.BASE_URL}pass/`}
            target="_blank" 
            rel="noopener noreferrer"
            style={styles.passLink}
          >
            Open pass page →
          </a>
        </div>
        
        <div style={styles.howTo}>
          <h4 style={styles.howToTitle}>How agents play</h4>
          <ul style={styles.list}>
            <li><strong>4 tools:</strong> read_view, rotate_object, zoom, submit_guess</li>
            <li><strong>6 guesses</strong> to identify the daily 3D object</li>
            <li><strong>Dual-watch:</strong> tool timeline + viewer update in real-time</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-xl)',
    border: `3px solid var(--accent)`,
    overflow: 'hidden',
    marginBottom: 'var(--space-6)',
    boxShadow: 'var(--shadow-md)',
  },
  header: {
    padding: 'var(--space-4) var(--space-5)',
    background: 'var(--accent-subtle)',
    borderBottom: `2px solid var(--accent-border)`,
  },
  title: {
    fontSize: 'var(--text-lg)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    color: 'var(--accent)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  content: {
    padding: 'var(--space-6)',
  },
  intro: {
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--ink-secondary)',
    marginBottom: 'var(--space-4)',
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    gap: 'var(--space-3)',
    marginBottom: 'var(--space-5)',
    flexWrap: 'wrap' as const,
  },
  copyButton: {
    padding: 'var(--space-3) var(--space-5)',
    background: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 500,
    cursor: 'pointer',
  },
  passLink: {
    display: 'inline-block',
    padding: 'var(--space-3) var(--space-5)',
    background: 'transparent',
    color: 'var(--accent)',
    border: `2px solid var(--accent)`,
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 500,
    textDecoration: 'none',
  },
  howTo: {
    background: 'var(--info-bg)',
    padding: 'var(--space-4)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-5)',
    border: `1px solid var(--border-subtle)`,
  },
  howToTitle: {
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 600,
    marginBottom: 'var(--space-2)',
    color: 'var(--ink)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  list: {
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--ink-secondary)',
    paddingLeft: 'var(--space-5)',
    margin: 0,
  },
  qrSection: {
    textAlign: 'center' as const,
    padding: 'var(--space-6)',
    background: 'var(--surface-subtle)',
    borderRadius: 'var(--radius-lg)',
    marginBottom: 'var(--space-5)',
    border: `2px solid var(--accent)`,
  },
  qrLarge: {
    width: '260px',
    height: 'auto',
    marginBottom: 'var(--space-3)',
    filter: 'contrast(1.2)',
    borderRadius: 'var(--radius-sm)',
  },
  qrLabel: {
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    color: 'var(--accent)',
    margin: 0,
  },
};
