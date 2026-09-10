import { create } from 'zustand';
import { useGameStore } from './store';
import {
  setTheaterEventPublisher,
  TheaterEvent,
  ToolTheaterEvent,
  useTheaterStore,
} from './theater';

type RoomConnection = 'connecting' | 'connected' | 'reconnecting' | 'offline';

interface RoomState {
  roomId: string | null;
  connection: RoomConnection;
  role: 'host' | 'participant';
  setRoom: (
    roomId: string,
    role: RoomState['role'],
    connection?: RoomConnection,
  ) => void;
  setConnection: (connection: RoomConnection) => void;
}

const WORKER_API = 'https://objectle-worker-demo.marvelus.workers.dev/api';
const API_BASE = import.meta.env.DEV ? '/api' : WORKER_API;
const locallyPublishedIds = new Set<string>();

let socket: WebSocket | null = null;
let reconnectTimer: number | null = null;
let activeRoomId: string | null = null;
let intentionallyClosed = false;
let initializationPromise: Promise<void> | null = null;

export const useRoomStore = create<RoomState>(set => ({
  roomId: null,
  connection: 'connecting',
  role: 'host',
  setRoom: (roomId, role, connection = 'connecting') =>
    set({ roomId, role, connection }),
  setConnection: connection => set({ connection }),
}));

export function initializeTheaterRoom() {
  initializationPromise ??= setupTheaterRoom();
  return initializationPromise;
}

async function setupTheaterRoom() {
  const url = new URL(window.location.href);
  let roomId = url.searchParams.get('room');
  let role: RoomState['role'] = 'participant';

  if (!roomId) {
    const response = await fetch(`${API_BASE}/rooms`, { method: 'POST' });
    if (!response.ok) throw new Error('Could not create a theater room.');
    const body = await response.json() as { roomId: string };
    roomId = body.roomId;
    role = 'host';
    url.searchParams.set('room', roomId);
    window.history.replaceState({}, '', url);
  }

  useRoomStore.getState().setRoom(roomId, role);
  useGameStore.getState().setPlayerId(`room_${roomId}`);
  connectToRoom(roomId);
}

export function disconnectTheaterRoom() {
  intentionallyClosed = true;
  setTheaterEventPublisher(null);
  if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
  reconnectTimer = null;
  socket?.close(1000, 'Page closed');
  socket = null;
}

function connectToRoom(roomId: string) {
  intentionallyClosed = false;
  activeRoomId = roomId;
  useRoomStore.getState().setConnection(
    socket ? 'reconnecting' : 'connecting',
  );

  const workerUrl = new URL(WORKER_API);
  const websocketBase = import.meta.env.DEV
    ? 'ws://localhost:8787/api'
    : `${workerUrl.protocol === 'https:' ? 'wss:' : 'ws:'}//${workerUrl.host}${workerUrl.pathname}`;
  socket = new WebSocket(`${websocketBase}/rooms/${encodeURIComponent(roomId)}/watch`);

  socket.addEventListener('open', () => {
    useRoomStore.getState().setConnection('connected');
  });

  socket.addEventListener('message', message => {
    if (typeof message.data !== 'string') return;

    try {
      const payload = JSON.parse(message.data) as
        | { type: 'event'; event: TheaterEvent }
        | { type: 'history'; events: TheaterEvent[] };

      const events = payload.type === 'history' ? payload.events : [payload.event];
      events.forEach(event => {
        if (!locallyPublishedIds.has(event.id)) applyRemoteEvent(event);
      });
    } catch {
      // Ignore malformed room messages. The Worker validates published events.
    }
  });

  socket.addEventListener('close', () => {
    if (intentionallyClosed) return;
    useRoomStore.getState().setConnection('reconnecting');
    reconnectTimer = window.setTimeout(() => {
      if (activeRoomId) connectToRoom(activeRoomId);
    }, 1500);
  });

  socket.addEventListener('error', () => {
    useRoomStore.getState().setConnection('offline');
  });

  setTheaterEventPublisher(event => {
    locallyPublishedIds.add(event.id);
    if (locallyPublishedIds.size > 100) {
      const oldest = locallyPublishedIds.values().next().value;
      if (oldest) locallyPublishedIds.delete(oldest);
    }

    const message = JSON.stringify({ type: 'event', event });
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(message);
      return;
    }

    void fetch(`${API_BASE}/rooms/${encodeURIComponent(roomId)}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: message,
    }).catch(() => {
      useRoomStore.getState().setConnection('offline');
    });
  });
}

function applyRemoteEvent(event: TheaterEvent) {
  useTheaterStore.getState().ingestEvent(event);
  if (event.kind !== 'tool' || event.phase !== 'completed' || !event.success) return;

  const game = useGameStore.getState();

  if (event.tool === 'rotate_object') {
    const axis = event.args.axis;
    const degrees = Number(event.args.degrees);
    if ((axis === 'x' || axis === 'y' || axis === 'z') && Number.isFinite(degrees)) {
      game.rotate(axis, degrees);
    }
  }

  if (event.tool === 'zoom') {
    const level = Number(event.args.level);
    if (Number.isFinite(level)) game.zoom(level);
  }

  if (event.tool === 'submit_guess' && event.detail) {
    applyRemoteGuess(event);
  }
}

function applyRemoteGuess(event: ToolTheaterEvent) {
  if (!event.detail) return;
  const game = useGameStore.getState();
  if (game.guesses.some(guess => guess.guessNumber === event.detail?.guessNumber)) {
    return;
  }

  game.addGuess({
    guessNumber: event.detail.guessNumber,
    guessText: event.detail.guess,
    correct: event.detail.correct,
    facets: event.detail.facets,
  });

  if (event.detail.correct || event.detail.remaining === 0) {
    game.setGameOver(event.detail.correct, event.detail.answer);
  }
}
