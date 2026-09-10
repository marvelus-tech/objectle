import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useGameStore } from '../lib/store';
import { passPageUrl, roomManualUrl } from '../lib/room';
import { agentPromptFor } from '../lib/prompt';
import { openAgentPanel } from '../lib/webmcp';

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
    <div className="glass-panel" style={styles.container}>
      <div style={styles.row}>
        {qrSrc ? (
          <img src={qrSrc} alt={`QR code for room ${roomCode}`} style={styles.qr} />
        ) : (
          <div style={{ ...styles.qr, background: 'var(--field-deep)' }} />
        )}
        <div style={styles.copyBlock}>
          <span style={styles.title}>Pass to agent</span>
          <p style={styles.intro}>Scan to continue on mobile · Room {roomCode}</p>
          {!roomConnected && (
            <p style={styles.offline}>Server offline — local play still works.</p>
          )}
          <div style={styles.actions}>
            <button onClick={handleCopy} style={styles.copyButton}>
              {copied ? 'Copied' : 'Copy agent prompt'}
            </button>
            <button
              type="button"
              onClick={() => openAgentPanel()}
              style={styles.copyButton}
            >
              Agent tools
            </button>
            <a
              href={passPageUrl(roomCode)}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.passLink}
            >
              Open pass
            </a>
            <a
              href={roomManualUrl(roomCode)}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.passLink}
            >
              Manual
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    overflow: 'hidden',
    padding: 'var(--space-4)',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-4)',
  },
  qr: {
    width: 72,
    height: 72,
    flexShrink: 0,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)',
  },
  copyBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    display: 'block',
    fontSize: '11px',
    fontFamily: 'var(--font-ui)',
    fontWeight: 600,
    color: 'var(--ink)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  },
  intro: {
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--ink-secondary)',
    margin: 'var(--space-1) 0 var(--space-3)',
    lineHeight: 1.4,
  },
  offline: {
    fontSize: 'var(--text-xs)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--error)',
    margin: '0 0 var(--space-2)',
  },
  actions: {
    display: 'flex',
    gap: 'var(--space-2)',
    flexWrap: 'wrap',
  },
  copyButton: {
    padding: '6px 12px',
    background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-magenta))',
    color: 'white',
    border: 'none',
    borderRadius: '999px',
    fontSize: '11px',
    fontFamily: 'var(--font-ui)',
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '0.04em',
  },
  passLink: {
    display: 'inline-block',
    padding: '6px 12px',
    background: 'transparent',
    color: 'var(--accent)',
    border: '1px solid var(--accent-border)',
    borderRadius: '999px',
    fontSize: '11px',
    fontFamily: 'var(--font-ui)',
    fontWeight: 600,
    textDecoration: 'none',
  },
};
