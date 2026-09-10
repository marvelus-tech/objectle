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
import { useGameStore } from './lib/store';
import { api, isWorkerAvailable } from './lib/api';
import { registerWebMCPTools } from './lib/webmcp';
import { resolveRoomCode, startRoomSync } from './lib/room';

export default function App() {
  const initGame = useGameStore(state => state.initGame);
  const objectKey = useGameStore(state => state.objectKey);
  const visualProfile = useGameStore(state => state.visualProfile);
  const loading = useGameStore(state => state.loading);
  const error = useGameStore(state => state.error);
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
      <header className="theater-header" style={styles.header}>
        <span style={styles.roomSignal}>
          <span
            style={{
              ...styles.signalDot,
              background: agentLive ? 'var(--success)' : roomConnected ? 'var(--accent)' : 'var(--ink-muted)',
            }}
          />
          {agentLive ? 'Agent live' : roomConnected ? 'Live theater' : 'Local mode'}
        </span>
        <h1 style={styles.title}>Objectle</h1>
        <p style={styles.subtitle}>Daily 3D Object Guessing Game · Dual-Watch Theater</p>
      </header>

      <main className="theater-main" style={styles.main}>
        <div className="stage-column" style={styles.stageColumn}>
          <div className="viewer-frame" style={styles.viewerWrapper}>
            <div className="viewer-stage" style={styles.viewer}>
              <ObjectViewer visualProfile={visualProfile} />
              <StageEffects />
            </div>
            <div style={styles.controls}>
              <ViewerControls />
            </div>
          </div>
          <ProgressionChrome />
          <HypothesisBoard />
        </div>

        <div className="side-rail" style={styles.sideColumn}>
          <div className="tool-log-sticky" style={styles.toolLogSection}>
            <ToolLog />
          </div>

          <div className="game-section" style={styles.gameSection}>
            <PassCard />
            <GameOver />
            <GuessInput />
            <GuessHistory />
          </div>
        </div>
      </main>

      <ShareModal />
      <AgentPanel />

      <footer style={styles.footer}>
        <p style={styles.footerText}>
          Built with React Three Fiber & Cloudflare Workers |
          <a
            href="https://github.com/marvelus-tech/objectle"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            GitHub
          </a>
        </p>
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
  header: {
    position: 'relative',
    padding: 'var(--space-6) var(--space-4)',
    textAlign: 'center' as const,
    background: 'var(--surface)',
    borderBottom: `1px solid var(--border-subtle)`,
    boxShadow: 'var(--shadow-sm)',
  },
  roomSignal: {
    position: 'absolute',
    top: 'var(--space-4)',
    left: 'var(--space-5)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    color: 'var(--ink-secondary)',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  signalDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    boxShadow: '0 0 0 4px var(--accent-subtle)',
  },
  title: {
    fontSize: 'var(--text-3xl)',
    fontWeight: 600,
    fontFamily: 'var(--font-display)',
    color: 'var(--ink)',
    marginBottom: 'var(--space-1)',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--ink-secondary)',
    fontWeight: 400,
  },
  main: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: 'var(--space-8)',
    padding: 'var(--space-8)',
    maxWidth: '1600px',
    width: '100%',
    margin: '0 auto',
  },
  stageColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-6)',
  },
  viewerWrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-8)',
    boxShadow: 'var(--shadow-md)',
    border: `1px solid var(--border-subtle)`,
  },
  viewer: {
    width: '100%',
    height: '500px',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    background: 'var(--stage-bg)',
    position: 'relative' as const,
  },
  controls: {
    width: '100%',
  },
  sideColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-6)',
  },
  toolLogSection: {
    position: 'sticky' as const,
    top: 'var(--space-4)',
    zIndex: 10,
  },
  gameSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-6)',
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
    textAlign: 'center' as const,
    padding: 'var(--space-8)',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-md)',
    border: `2px solid var(--error)`,
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
  footer: {
    padding: 'var(--space-6)',
    textAlign: 'center' as const,
    background: 'var(--surface)',
    borderTop: `1px solid var(--border-subtle)`,
  },
  footerText: {
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-ui)',
    color: 'var(--ink-secondary)',
    margin: 0,
  },
  link: {
    marginLeft: 'var(--space-2)',
    color: 'var(--accent)',
    textDecoration: 'none',
    fontWeight: 500,
  },
};
