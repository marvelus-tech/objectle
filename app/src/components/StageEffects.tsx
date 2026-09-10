import React, { useEffect, useState } from 'react';
import { useGameStore, type LiveAction } from '../lib/store';

/**
 * DOM overlays on top of the 3D stage that narrate what just happened.
 *
 * Why DOM and not in-canvas? Text, chips and confetti are cheap and crisp as
 * HTML, and they can reuse the design tokens + reduced-motion rules in CSS.
 *
 *  - Caption pill: "Agent turned the object 30° right" (every tool call)
 *  - Viewfinder flash: corner brackets pulse when the agent calls read_view
 *  - Shake: wrong guess nudges the stage
 *  - Confetti: correct guess (the one moment worth real delight)
 */
const CAPTION_MS = 2600;
const FLASH_MS = 700;
const SHAKE_MS = 320;
const CONFETTI_MS = 1400;

export default function StageEffects() {
  const lastAction = useGameStore(state => state.lastAction);
  const [caption, setCaption] = useState<LiveAction | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [shake, setShake] = useState<string | null>(null);
  const [confetti, setConfetti] = useState<string | null>(null);

  useEffect(() => {
    if (!lastAction) return;
    // Ignore stale actions replayed from the event log on page load
    if (Date.now() - lastAction.ts > 8000) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    setCaption(lastAction);
    timers.push(setTimeout(() => setCaption(c => (c?.id === lastAction.id ? null : c)), CAPTION_MS));

    if (lastAction.tool === 'read_view') {
      setFlash(lastAction.id);
      timers.push(setTimeout(() => setFlash(null), FLASH_MS));
    }
    if (lastAction.tool === 'submit_guess' && lastAction.success && lastAction.guess) {
      if (lastAction.guess.correct) {
        setConfetti(lastAction.id);
        timers.push(setTimeout(() => setConfetti(null), CONFETTI_MS));
      } else {
        setShake(lastAction.id);
        timers.push(setTimeout(() => setShake(null), SHAKE_MS));
      }
    }
    return () => timers.forEach(clearTimeout);
  }, [lastAction]);

  return (
    <div style={styles.layer} aria-live="polite">
      {shake && <div key={shake} style={styles.shakeFrame} />}

      {flash && (
        <div key={flash} style={styles.viewfinder}>
          <span style={{ ...styles.corner, top: 0, left: 0, borderWidth: '2px 0 0 2px' }} />
          <span style={{ ...styles.corner, top: 0, right: 0, borderWidth: '2px 2px 0 0' }} />
          <span style={{ ...styles.corner, bottom: 0, left: 0, borderWidth: '0 0 2px 2px' }} />
          <span style={{ ...styles.corner, bottom: 0, right: 0, borderWidth: '0 2px 2px 0' }} />
        </div>
      )}

      {confetti && <Confetti key={confetti} />}

      {caption && (
        <div key={caption.id} style={{
          ...styles.caption,
          borderColor: caption.success ? (caption.guess?.correct ? 'var(--success)' : 'var(--accent-border)') : 'var(--error)',
        }}>
          <span style={{
            ...styles.actor,
            background: caption.actor === 'agent' ? 'var(--accent)' : 'var(--ink-secondary)',
          }}>
            {caption.actor === 'agent' ? 'Agent' : 'You'}
          </span>
          <span style={styles.captionText}>{caption.caption}</span>
        </div>
      )}
    </div>
  );
}

const CONFETTI_COLORS = ['var(--accent)', 'var(--success)', 'var(--clay-mid)', 'var(--accent-border)', 'var(--ink)'];

function Confetti() {
  const pieces = Array.from({ length: 36 }, (_, i) => ({
    left: `${(i / 36) * 100 + (Math.random() * 3 - 1.5)}%`,
    delay: `${Math.random() * 180}ms`,
    duration: `${900 + Math.random() * 400}ms`,
    drift: `${(Math.random() - 0.5) * 120}px`,
    spin: `${(Math.random() - 0.5) * 720}deg`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.round(Math.random() * 6),
  }));
  return (
    <div style={styles.confettiLayer}>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: '-12px',
            left: p.left,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            borderRadius: '1px',
            animation: `confettiFall ${p.duration} ease-out ${p.delay} forwards`,
            ['--drift' as string]: p.drift,
            ['--spin' as string]: p.spin,
          }}
        />
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layer: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
    borderRadius: 'inherit',
  },
  shakeFrame: {
    position: 'absolute',
    inset: 0,
    boxShadow: 'inset 0 0 0 3px var(--error)',
    borderRadius: 'inherit',
    animation: `stageShake ${SHAKE_MS}ms ease-out both`,
  },
  viewfinder: {
    position: 'absolute',
    inset: 'var(--space-6)',
    animation: `focusPulse ${FLASH_MS}ms ease-out both`,
  },
  corner: {
    position: 'absolute',
    width: '28px',
    height: '28px',
    borderStyle: 'solid',
    borderColor: 'var(--accent)',
  },
  confettiLayer: {
    position: 'absolute',
    inset: 0,
  },
  caption: {
    position: 'absolute',
    left: '50%',
    bottom: 'var(--space-5)',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-2)',
    background: 'var(--surface)',
    border: '1px solid',
    borderRadius: '999px',
    boxShadow: 'var(--shadow-md)',
    maxWidth: 'calc(100% - var(--space-10))',
    animation: 'captionIn 220ms ease-out both',
  },
  actor: {
    color: 'white',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    padding: '2px 8px',
    borderRadius: '999px',
  },
  captionText: {
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--text-sm)',
    color: 'var(--ink)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};
