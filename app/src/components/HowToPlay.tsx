import React from 'react';

interface HowToPlayProps {
  open: boolean;
  onClose: () => void;
}

export default function HowToPlay({ open, onClose }: HowToPlayProps) {
  if (!open) return null;

  return (
    <div style={styles.backdrop} onClick={onClose} role="presentation">
      <div
        style={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-play-title"
        onClick={e => e.stopPropagation()}
      >
        <div style={styles.header}>
          <h2 id="how-to-play-title" style={styles.title}>
            How to play
          </h2>
          <button type="button" onClick={onClose} style={styles.close} aria-label="Close">
            ×
          </button>
        </div>
        <ol style={styles.list}>
          <li>Inspect the mystery 3D object. Rotate and zoom as unlocks allow.</li>
          <li>You have 6 guesses. After each miss, facets reveal category, material, and scale.</li>
          <li>Wrong guesses unlock closer zoom and richer lighting.</li>
          <li>Pass the game to an AI agent via the QR card. Watch its tools live on this stage.</li>
          <li>Synonyms count. Bike and bicycle both work.</li>
        </ol>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 2000,
    background: 'rgba(26, 26, 26, 0.28)',
    display: 'grid',
    placeItems: 'center',
    padding: 'var(--space-4)',
  },
  modal: {
    width: 'min(440px, 100%)',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border-subtle)',
    padding: 'var(--space-6)',
    animation: 'fadeScaleIn 220ms ease-out',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-4)',
  },
  title: {
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-xl)',
    fontWeight: 600,
    color: 'var(--ink)',
  },
  close: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'var(--accent-subtle)',
    color: 'var(--ink)',
    fontSize: '20px',
    lineHeight: 1,
  },
  list: {
    margin: 0,
    paddingLeft: 'var(--space-5)',
    color: 'var(--ink-secondary)',
    fontSize: 'var(--text-sm)',
    lineHeight: 1.55,
    display: 'grid',
    gap: 'var(--space-3)',
  },
};
