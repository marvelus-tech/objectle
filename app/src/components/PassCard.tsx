import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useGameStore } from '../lib/store';
import { passPageUrl, roomManualUrl } from '../lib/room';
import { agentPromptFor } from '../lib/prompt';

/**
 * Pass to Agent card - Always visible for room demos
 * The QR encodes this room's pass page, so whatever the guest's agent does lands
 * on this screen. QR must be scannable without clicking anything.
 */
export default function PassCard() {
  const [copied, setCopied] = useState(false);
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const roomCode = useGameStore(state => state.roomCode);
  const roomConnected = useGameStore(state => state.roomConnected);

  useEffect(() => {
    if (!roomCode) return;
    QRCode.toDataURL(passPageUrl(roomCode), {
      margin: 1,
      width: 520,
      errorCorrectionLevel: 'M',
      color: { dark: '#1A1A1A', light: '#FFFFFF' },
    })
      .then(setQrSrc)
      .catch(err => console.warn('QR generation failed', err));
  }, [roomCode]);

  if (!roomCode) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(agentPromptFor(roomCode)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="prism-hairline" style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Pass to agent</span>
        <span style={styles.roomCode}>Room {roomCode}</span>
      </div>
      
      <div style={styles.content}>
        <p style={styles.intro}>
          <strong>Room demo:</strong> Guests scan the QR code to hand this game to their AI agent. Everything the agent does is animated on this screen.
        </p>
        
        <div style={styles.qrSection}>
          {qrSrc ? (
            <img src={qrSrc} alt={`QR code for room ${roomCode}`} style={styles.qrLarge} />
          ) : (
            <div style={{ ...styles.qrLarge, height: '260px' }} />
          )}
          <p style={styles.qrLabel}>Scan to hand to your agent</p>
          <p style={styles.qrCode}>{roomCode}</p>
        </div>

        {!roomConnected && (
          <p style={styles.offline}>
            The game server is unreachable, so remote agents cannot join this room right now. Local play still works.
          </p>
        )}
        
        <div style={styles.actions}>
          <button onClick={handleCopy} className="btn-primary" style={styles.copyButton}>
            {copied ? 'Copied' : 'Copy prompt'}
          </button>
          <a 
            href={passPageUrl(roomCode)}
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-ghost"
            style={styles.passLink}
          >
            Open pass page
          </a>
        </div>
        
        <div style={styles.howTo}>
          <h4 style={styles.howToTitle}>How agents play</h4>
          <ul style={styles.list}>
            <li><strong>5 tools:</strong> read_view, rotate_object, zoom, publish_status, submit_guess</li>
            <li><strong>Any agent that can fetch a URL</strong> can play: the tools are plain links</li>
            <li><strong>MCP clients</strong> can add the room as a connector for native tools</li>
            <li><strong>6 guesses</strong>, facet feedback on category, material and scale</li>
          </ul>
          <p style={styles.manualLink}>
            Agent manual: <a href={roomManualUrl(roomCode)} target="_blank" rel="noopener noreferrer" style={styles.link}>{roomManualUrl(roomCode)}</a>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'var(--surface)',
    borderRadius: 'var(--radius-xl)',
    border: `1px solid var(--border-subtle)`,
    overflow: 'hidden',
    marginBottom: 'var(--space-6)',
    boxShadow: 'var(--shadow-md)',
  },
  header: {
    padding: 'var(--space-4) var(--space-5)',
    background: 'var(--surface)',
    borderBottom: `1px solid var(--border-subtle)`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    fontSize: 'var(--text-lg)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    color: 'var(--ink)',
    letterSpacing: '0.01em',
  },
  roomCode: {
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 600,
    color: 'var(--ink-secondary)',
    letterSpacing: '0.08em',
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
  offline: {
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--error)',
    background: 'var(--error-bg)',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-5)',
  },
  actions: {
    display: 'flex',
    gap: 'var(--space-3)',
    marginBottom: 'var(--space-5)',
    flexWrap: 'wrap' as const,
  },
  copyButton: {
    padding: 'var(--space-3) var(--space-5)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 500,
    cursor: 'pointer',
  },
  passLink: {
    display: 'inline-block',
    padding: 'var(--space-3) var(--space-5)',
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
  manualLink: {
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--ink-tertiary)',
    marginTop: 'var(--space-3)',
    wordBreak: 'break-all' as const,
  },
  link: {
    color: 'var(--accent)',
    textDecoration: 'none',
  },
  qrSection: {
    textAlign: 'center' as const,
    padding: 'var(--space-6)',
    background: '#FFFFFF',
    borderRadius: 'var(--radius-lg)',
    marginBottom: 'var(--space-5)',
    border: `2px solid var(--accent)`,
  },
  qrLarge: {
    width: '260px',
    height: 'auto',
    marginBottom: 'var(--space-3)',
    borderRadius: 'var(--radius-sm)',
  },
  qrLabel: {
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    color: 'var(--ink)',
    margin: 0,
  },
  qrCode: {
    fontSize: 'var(--text-2xl)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    color: 'var(--ink)',
    letterSpacing: '0.18em',
    margin: 'var(--space-2) 0 0 0',
  },
};
