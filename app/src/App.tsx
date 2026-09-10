import React, { useEffect, useMemo, useState } from 'react';
import ObjectViewer from './components/ObjectViewer';
import ViewerControls from './components/ViewerControls';
import GuessInput from './components/GuessInput';
import GuessHistory from './components/GuessHistory';
import GameOver from './components/GameOver';
import ShareModal from './components/ShareModal';
import AgentPanel from './components/AgentPanel';
import ToolLog from './components/ToolLog';
import PassCard from './components/PassCard';
import StageEffects from './components/StageEffects';
import AttemptsGrid from './components/AttemptsGrid';
import HowToPlay from './components/HowToPlay';
import { useGameStore } from './lib/store';
import { api, isWorkerAvailable } from './lib/api';
import { registerWebMCPTools } from './lib/webmcp';
import { resolveRoomCode, startRoomSync } from './lib/room';

const EPOCH = Date.UTC(2026, 0, 1);

function formatPuzzleMeta(dateIso: string | null) {
  const date = dateIso ? new Date(`${dateIso}T12:00:00Z`) : new Date();
  const label = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).toUpperCase();
  const dayNum =
    Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - EPOCH) /
      86_400_000) + 1;
  return `TODAY, ${label} · #${dayNum}`;
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 10.5v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" />
    </svg>
  );
}

export default function App() {
  const initGame = useGameStore(state => state.initGame);
  const objectKey = useGameStore(state => state.objectKey);
  const visualProfile = useGameStore(state => state.visualProfile);
  const loading = useGameStore(state => state.loading);
  const error = useGameStore(state => state.error);
  const date = useGameStore(state => state.date);
  const setLoading = useGameStore(state => state.setLoading);
  const setError = useGameStore(state => state.setError);
  const setRoom = useGameStore(state => state.setRoom);
  const roomConnected = useGameStore(state => state.roomConnected);
  const agentLastSeenAt = useGameStore(state => state.agentLastSeenAt);
  const [howToOpen, setHowToOpen] = useState(false);

  useEffect(() => {
    let stopSync: (() => void) | undefined;
    loadDailyChallenge().then(() => {
      registerWebMCPTools();
      const code = resolveRoomCode();
      if (isWorkerAvailable()) stopSync = startRoomSync(code);
      else setRoom(code, false);
    });
    return () => stopSync?.();
  }, []);

  const loadDailyChallenge = async () => {
    setLoading(true);
    setError(null);

    try {
      const challenge = await api.getDailyChallenge();
      initGame(challenge.date, challenge.objectKey, challenge.visualProfile);
    } catch (err) {
      console.error('Failed to load daily challenge:', err);
      setError('Failed to load today\'s challenge. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const puzzleMeta = useMemo(() => formatPuzzleMeta(date), [date]);

  if (loading) {
    return (
      <div style={styles.centered}>
        <div style={styles.loader}>Loading Objectle...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centered}>
        <div style={styles.error}>
          <p>{error}</p>
          <button onClick={loadDailyChallenge} className="btn-primary" style={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!objectKey || !visualProfile) {
    return (
      <div style={styles.centered}>
        <div style={styles.loader}>No challenge available</div>
      </div>
    );
  }

  const agentLive =
    roomConnected && agentLastSeenAt !== null && Date.now() - agentLastSeenAt < 10_000;

  return (
    <div className="app-shell paper-field" style={styles.app}>
      <div className="prototype-top">
        <div className="prototype-brand-spacer" aria-hidden="true" />
        <nav className="prototype-nav" style={styles.topNav} aria-label="Site">
          <span style={styles.navItem}>
            <CalendarIcon />
            Daily at midnight
          </span>
          <span style={styles.navDivider} aria-hidden="true">
            |
          </span>
          <button
            type="button"
            style={styles.navButton}
            onClick={() => setHowToOpen(true)}
          >
            <InfoIcon />
            How to play
          </button>
        </nav>
      </div>

      <main className="theater-main prototype-grid" style={styles.main}>
        {/* Left: brand + guess + attempts */}
        <aside className="left-rail" style={styles.leftRail}>
          <header style={styles.brand}>
            <span style={styles.roomSignal}>
              <span
                style={{
                  ...styles.signalDot,
                  background: agentLive
                    ? 'var(--neon-a)'
                    : roomConnected
                      ? 'var(--accent)'
                      : 'var(--ink-muted)',
                  boxShadow: agentLive
                    ? '0 0 0 4px var(--neon-a-soft)'
                    : '0 0 0 4px var(--accent-subtle)',
                  animation: agentLive ? 'liveDot 1.6s ease-out infinite' : undefined,
                }}
              />
              {agentLive ? 'Agent live' : roomConnected ? 'Live theater' : 'Local mode'}
            </span>
            <h1 style={styles.title}>Objectle</h1>
            <p style={styles.subtitle}>A daily 3D object guessing game.</p>
            <div style={styles.dateRule}>
              <span style={styles.dateMeta}>{puzzleMeta}</span>
            </div>
          </header>

          <div style={styles.leftControls}>
            <GuessInput />
            <AttemptsGrid />
            <GameOver />
            <div className="guess-history-compact">
              <GuessHistory />
            </div>
          </div>
        </aside>

        {/* Center: stage + pass */}
        <section className="stage-column" style={styles.stageColumn}>
          <div className="viewer-frame" style={styles.viewerWrapper}>
            <div className="prism-frame">
              <div className="prism-frame__inner viewer-stage" style={styles.viewer}>
                <ObjectViewer visualProfile={visualProfile} />
                <StageEffects />
                <div className="stage-corners" aria-hidden="true" />
                <div className="viewer-controls-dock">
                  <ViewerControls />
                </div>
              </div>
            </div>
          </div>
          <PassCard />
        </section>

        {/* Right: agent timeline */}
        <aside className="side-rail" style={styles.rightRail}>
          <div className="tool-log-sticky" style={styles.toolLogSection}>
            <ToolLog />
          </div>
        </aside>
      </main>

      <ShareModal />
      <AgentPanel />
      <HowToPlay open={howToOpen} onClose={() => setHowToOpen(false)} />

      <footer className="prototype-footer" style={styles.footer}>
        <p style={styles.footerLeft}>
          Built with curiosity. Designed with care.
          <span style={styles.heart} aria-hidden="true">
            ♥
          </span>
        </p>
        <p style={styles.footerRight}>Objectle © 2026 · All rights reserved.</p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: 'var(--field)',
  },
  topNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '12px',
    color: 'var(--ink-secondary)',
    fontSize: '12px',
    fontWeight: 500,
  },
  navItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  navDivider: {
    color: 'var(--border-strong)',
  },
  navButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'transparent',
    color: 'var(--ink-secondary)',
    padding: 0,
    fontSize: '12px',
    fontWeight: 500,
  },
  main: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'minmax(220px, 0.85fr) minmax(420px, 1.35fr) minmax(280px, 0.95fr)',
    gap: 'var(--space-8)',
    padding: '0 var(--space-8) var(--space-8)',
    maxWidth: '1440px',
    width: '100%',
    margin: '0 auto',
    alignItems: 'start',
  },
  leftRail: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-8)',
    paddingTop: 'var(--space-2)',
  },
  brand: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  roomSignal: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
    color: 'var(--ink-tertiary)',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  signalDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
  },
  title: {
    margin: 0,
    fontSize: 'clamp(2.4rem, 4vw, 3.25rem)',
    fontWeight: 600,
    fontFamily: 'var(--font-display)',
    color: 'var(--ink)',
    letterSpacing: '-0.03em',
    lineHeight: 1.05,
  },
  subtitle: {
    margin: 0,
    fontSize: '11px',
    fontFamily: 'var(--font-ui)',
    color: 'var(--ink-tertiary)',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  dateRule: {
    marginTop: 'var(--space-5)',
    padding: '12px 0',
    borderTop: '1px solid var(--border)',
    borderBottom: '1px solid var(--border)',
  },
  dateMeta: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--ink-secondary)',
  },
  leftControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-6)',
  },
  stageColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-5)',
    minWidth: 0,
  },
  viewerWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  },
  viewer: {
    width: '100%',
    height: 'min(62vh, 560px)',
    minHeight: '420px',
    position: 'relative',
  },
  rightRail: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-6)',
    paddingTop: '4px',
  },
  toolLogSection: {
    position: 'sticky',
    top: 'var(--space-4)',
    zIndex: 10,
  },
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'var(--field)',
  },
  loader: {
    fontSize: 'var(--text-xl)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--ink-secondary)',
    padding: 'var(--space-8)',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-md)',
  },
  error: {
    textAlign: 'center',
    padding: 'var(--space-8)',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-md)',
    border: '2px solid var(--error)',
    maxWidth: '500px',
  },
  retryButton: {
    marginTop: 'var(--space-4)',
    padding: 'var(--space-3) var(--space-6)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 500,
    cursor: 'pointer',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-4)',
    flexWrap: 'wrap',
    padding: 'var(--space-5) var(--space-8)',
    maxWidth: '1440px',
    width: '100%',
    margin: '0 auto',
  },
  footerLeft: {
    margin: 0,
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--ink-tertiary)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  heart: {
    color: 'var(--ink-muted)',
    fontSize: '11px',
  },
  footerRight: {
    margin: 0,
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--ink-tertiary)',
  },
};
