import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useGameStore } from '../lib/store';
import { passPageUrl } from '../lib/room';
import { agentPromptFor } from '../lib/prompt';

/**
 * Compact "Pass to agent" bar under the stage (prototype layout).
 * QR stays scannable without expanding anything.
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
      width: 180,
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
    <div className="pass-card" style={styles.container}>
      <div style={styles.qrWell}>
        {qrSrc ? (
          <img src={qrSrc} alt={`QR code for room ${roomCode}`} style={styles.qr} />
        ) : (
          <div style={styles.qrPlaceholder} />
        )}
      </div>

      <div style={styles.copy}>
        <div style={styles.titleRow}>
          <span style={styles.title}>Pass to agent</span>
          {!roomConnected && <span style={styles.offline}>Offline</span>}
        </div>
        <p style={styles.sub}>Scan to continue on mobile</p>
      </div>

      <button type="button" onClick={handleCopy} style={styles.share} className="btn-ghost">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="7" y="3" width="10" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10 6.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span>{copied ? 'Copied' : 'Or share link'}</span>
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'center',
    gap: 'var(--space-4)',
    padding: '12px 16px',
    background: 'var(--surface)',
    borderRadius: '16px',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'var(--shadow-sm)',
  },
  qrWell: {
    width: '64px',
    height: '64px',
    padding: '4px',
    borderRadius: '8px',
    border: '2px solid var(--accent)',
    background: '#FFFFFF',
    display: 'grid',
    placeItems: 'center',
  },
  qr: {
    width: '100%',
    height: '100%',
    display: 'block',
  },
  qrPlaceholder: {
    width: '100%',
    height: '100%',
    background: 'var(--info-bg)',
  },
  copy: {
    minWidth: 0,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  title: {
    fontFamily: 'var(--font-ui)',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--ink)',
  },
  offline: {
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--ink-tertiary)',
  },
  sub: {
    margin: '2px 0 0',
    fontSize: 'var(--text-sm)',
    color: 'var(--ink-secondary)',
  },
  share: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--ink-secondary)',
    background: 'transparent',
    border: 'none',
    whiteSpace: 'nowrap',
  },
};
