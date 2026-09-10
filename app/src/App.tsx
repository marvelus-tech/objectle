import React, { useEffect } from 'react';
import ObjectViewer from './components/ObjectViewer';
import ViewerControls from './components/ViewerControls';
import GuessInput from './components/GuessInput';
import GuessHistory from './components/GuessHistory';
import GameOver from './components/GameOver';
import ShareModal from './components/ShareModal';
import AgentPanel from './components/AgentPanel';
import ToolLog from './components/ToolLog';
import PassCard from './components/PassCard';
import ProgressionChrome from './components/ProgressionChrome';
import HypothesisBoard from './components/HypothesisBoard';
import StageEffects from './components/StageEffects';
import NeonStage from './components/NeonStage';
import AttemptsGrid from './components/AttemptsGrid';
import { useGameStore } from './lib/store';
import { api, isWorkerAvailable } from './lib/api';
import { registerWebMCPTools } from './lib/webmcp';
import { resolveRoomCode, startRoomSync } from './lib/room';

function formatChallengeDate(iso: string | null): string {
  if (!iso) return 'Today';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
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
          <button onClick={loadDailyChallenge} style={styles.retryButton}>
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

  const agentLive = roomConnected && agentLastSeenAt !== null && Date.now() - agentLastSeenAt < 10_000;

  return (
    <div className="app-shell" style={styles.app}>
      <main className="theater-main">
        {/* Left: brand + guess ritual */}
        <aside className="brand-rail">
          <div>
            <div style={styles.roomSignal}>
              <span
                style={{
                  ...styles.signalDot,
                  background: agentLive
                    ? 'var(--neon-teal)'
                    : roomConnected
                      ? 'var(--neon-cyan)'
                      : 'var(--ink-muted)',
                  animation: agentLive ? 'liveDot 1.4s ease-out infinite' : undefined,
                }}
              />
              {agentLive ? 'Agent live' : roomConnected ? 'Live theater' : 'Local mode'}
            </div>
            <h1 className="brand-mark">Objectle</h1>
            <p className="brand-tagline">A daily 3D object guessing game</p>
            <p className="brand-meta">{formatChallengeDate(date)}</p>
          </div>

          <GuessInput />
          <AttemptsGrid />
          <GameOver />
          <GuessHistory />
        </aside>

        {/* Center: neon stage */}
        <div className="stage-column">
          <NeonStage>
            <div className="viewer-stage" style={styles.viewer}>
              <ObjectViewer visualProfile={visualProfile} />
              <StageEffects />
            </div>
          </NeonStage>
          <ViewerControls />
          <PassCard />
          <details style={styles.moreDetails}>
            <summary style={styles.moreSummary}>Progression & theory</summary>
            <div style={styles.moreBody}>
              <ProgressionChrome />
              <HypothesisBoard />
            </div>
          </details>
        </div>

        {/* Right: agent theater */}
        <aside className="agent-rail">
          <nav className="utility-links" aria-label="Help">
            <a className="utility-link" href="#how-to-play">
              How to play
            </a>
            <span className="utility-link" title="New puzzle each day">
              Daily at midnight
            </span>
          </nav>
          <div className="tool-log-sticky" style={styles.toolLogSection}>
            <ToolLog />
          </div>
        </aside>
      </main>

      <footer className="site-footer">
        <p>Built with curiosity. Designed with care.</p>
        <p>
          Objectle ·{' '}
          <a
            href="https://github.com/marvelus-tech/objectle"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </p>
      </footer>

      <ShareModal />
      <AgentPanel />

      <section id="how-to-play" className="visually-hidden">
        Examine the object, rotate and zoom as unlocked, then guess within six attempts.
        Facet feedback shows category, material, and scale matches.
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  roomSignal: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-4)',
    color: 'var(--ink-secondary)',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  signalDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
  },
  viewer: {
    width: '100%',
    height: 'min(62vh, 560px)',
    minHeight: 420,
    position: 'relative',
  },
  toolLogSection: {
    position: 'sticky',
    top: 'var(--space-4)',
    zIndex: 10,
  },
  moreDetails: {
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-subtle)',
    background: 'var(--glass)',
    padding: 'var(--space-3) var(--space-4)',
  },
  moreSummary: {
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--ink-tertiary)',
    listStyle: 'none',
  },
  moreBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    marginTop: 'var(--space-4)',
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
    border: '1px solid var(--border-subtle)',
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
    background: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-ui)',
    fontWeight: 500,
    cursor: 'pointer',
  },
};
