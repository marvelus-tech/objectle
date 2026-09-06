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
          <strong>Hosts:</strong> Keep this screen visible as the dual-watch theater.
        </p>
        <p style={styles.intro}>
          <strong>Guests:</strong> Scan the QR below to hand this to your agent. Watch the action on this screen.
        </p>
        
        <div style={styles.qrSection}>
          <img 
            src={`${import.meta.env.BASE_URL}pass/qr.svg`}
            alt="QR code for agent onboarding" 
            style={styles.qrLarge}
          />
          <p style={styles.qrLabel}>Scan to onboard your agent</p>
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
    background: '#fff',
    borderRadius: '8px',
    border: '2px solid #4a90e2',
    overflow: 'hidden',
    marginBottom: '1.5rem',
  },
  header: {
    padding: '12px 16px',
    background: '#e8f4f8',
    borderBottom: '2px solid #4a90e2',
  },
  title: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#333',
  },
  content: {
    padding: '16px',
  },
  intro: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '16px',
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  copyButton: {
    padding: '10px 20px',
    background: '#4a90e2',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  passLink: {
    display: 'inline-block',
    padding: '10px 20px',
    background: '#fff',
    color: '#4a90e2',
    border: '2px solid #4a90e2',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'all 0.2s',
  },
  howTo: {
    background: '#f8f9fa',
    padding: '14px',
    borderRadius: '6px',
    marginBottom: '16px',
  },
  howToTitle: {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '8px',
    color: '#333',
  },
  list: {
    fontSize: '13px',
    color: '#555',
    paddingLeft: '20px',
    margin: 0,
  },
  qrSection: {
    textAlign: 'center',
    padding: '20px 0',
    background: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  qrLarge: {
    width: '240px',
    height: 'auto',
    marginBottom: '12px',
    filter: 'contrast(1.3)',
  },
  qrLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#333',
    margin: 0,
  },
};
