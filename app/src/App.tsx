import React, { useEffect } from 'react';
import ObjectViewer from './components/ObjectViewer';
import ViewerControls from './components/ViewerControls';
import GuessInput from './components/GuessInput';
import GuessHistory from './components/GuessHistory';
import GameOver from './components/GameOver';
import ShareModal from './components/ShareModal';
import AgentPanel from './components/AgentPanel';
import ToolLog from './components/ToolLog';
import { useGameStore } from './lib/store';
import { api } from './lib/api';
import { registerWebMCPTools } from './lib/webmcp';

export default function App() {
  const initGame = useGameStore(state => state.initGame);
  const objectKey = useGameStore(state => state.objectKey);
  const loading = useGameStore(state => state.loading);
  const error = useGameStore(state => state.error);
  const setLoading = useGameStore(state => state.setLoading);
  const setError = useGameStore(state => state.setError);
  
  // Load daily challenge and register WebMCP tools on mount
  useEffect(() => {
    loadDailyChallenge();
    registerWebMCPTools();
  }, []);
  
  const loadDailyChallenge = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const challenge = await api.getDailyChallenge();
      initGame(challenge.date, challenge.objectKey);
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
  
  if (!objectKey) {
    return (
      <div style={styles.centered}>
        <div style={styles.loader}>No challenge available</div>
      </div>
    );
  }
  
  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>Objectle</h1>
        <p style={styles.subtitle}>Daily 3D Object Guessing Game</p>
      </header>
      
      <main style={styles.main}>
        <div style={styles.viewerSection}>
          <div style={styles.viewer}>
            <ObjectViewer objectKey={objectKey} />
          </div>
          <div style={styles.controls}>
            <ViewerControls />
          </div>
        </div>
        
        <div style={styles.gameSection}>
          <GameOver />
          <GuessInput />
          <GuessHistory />
        </div>
      </main>
      
      <ShareModal />
      <AgentPanel />
      <ToolLog />
      
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
    background: '#f8f9fa',
  },
  header: {
    padding: '2rem 1rem',
    textAlign: 'center',
    background: '#fff',
    borderBottom: '2px solid #e0e0e0',
  },
  title: {
    fontSize: '36px',
    fontWeight: 700,
    color: '#333',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
  },
  main: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '2rem',
    padding: '2rem',
    maxWidth: '1400px',
    width: '100%',
    margin: '0 auto',
  },
  viewerSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  viewer: {
    width: '100%',
    height: '500px',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  controls: {
    width: '100%',
  },
  gameSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#f8f9fa',
  },
  loader: {
    fontSize: '20px',
    color: '#666',
    padding: '2rem',
  },
  error: {
    textAlign: 'center',
    padding: '2rem',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  retryButton: {
    marginTop: '1rem',
    padding: '0.75rem 2rem',
    background: '#4a90e2',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  footer: {
    padding: '1.5rem',
    textAlign: 'center',
    background: '#fff',
    borderTop: '2px solid #e0e0e0',
  },
  footerText: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  link: {
    marginLeft: '0.5rem',
    color: '#4a90e2',
    textDecoration: 'none',
  },
};
