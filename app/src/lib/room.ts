/**
 * Live room client.
 *
 * The host screen (this page) and the agent never talk directly. Both talk to the
 * Worker's RoomDO for a shared room code. This module:
 *   1. picks the room code (from ?room=, else generates one and puts it in the URL)
 *   2. polls the room's event log and folds new events into the store
 *   3. lets in-page actions (buttons, AgentPanel, WebMCP) run through the same room
 */

import { API_BASE, API_BASE_ABSOLUTE } from './api';
import { useGameStore, type Actor, type Guess, type LiveAction, type RoomSnapshot } from './store';

export interface RoomEvent {
  seq: number;
  ts: number;
  actor: Actor;
  tool: LiveAction['tool'];
  args: Record<string, unknown>;
  result: string;
  success: boolean;
}

export interface ToolCallResponse {
  text: string;
  success: boolean;
  state: RoomSnapshot;
  event: RoomEvent;
}

type EventListener = (event: RoomEvent) => void;

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L lookalikes
const POLL_ACTIVE_MS = 600;
const POLL_IDLE_MS = 1500;
const AGENT_ACTIVE_WINDOW_MS = 10_000;

let lastSeq = 0;
const listeners = new Set<EventListener>();

function generateCode(): string {
  return Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');
}

/** Room code from the URL, else a new one written into the URL so a refresh keeps the room. */
export function resolveRoomCode(): string {
  const url = new URL(window.location.href);
  const fromUrl = (url.searchParams.get('room') ?? '').toUpperCase();
  if (/^[A-Z0-9]{4,8}$/.test(fromUrl)) return fromUrl;

  const code = generateCode();
  url.searchParams.set('room', code);
  window.history.replaceState(null, '', url.toString());
  return code;
}

export const roomApiUrl = (code: string, path = '') => `${API_BASE}/room/${code}${path}`;
export const roomManualUrl = (code: string) => `${API_BASE_ABSOLUTE}/room/${code}`;
export const roomMcpUrl = (code: string) => `${API_BASE_ABSOLUTE.replace(/\/api$/, '')}/mcp/${code}`;

/** Public URL of the pass page for this room (what the QR encodes). */
export function passPageUrl(code: string): string {
  return new URL(`${import.meta.env.BASE_URL}pass/?room=${code}`, window.location.href).toString();
}

export function onRoomEvent(listener: EventListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Run a tool through the room so the agent's read_view sees the same state the host sees. */
export async function callRoomTool(
  code: string,
  tool: LiveAction['tool'],
  args: Record<string, unknown>,
  actor: Actor
): Promise<ToolCallResponse> {
  const res = await fetch(`${roomApiUrl(code, `/tools/${tool}`)}?actor=${actor}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(8000),
  });
  if (res.status >= 500) throw new Error(`Room call failed (${res.status})`);
  const data = (await res.json()) as ToolCallResponse;
  ingest(data.state, [data.event]);
  return data;
}

/** Fold a snapshot + new events into the store exactly once per event (dedupe by seq). */
function ingest(state: RoomSnapshot, events: RoomEvent[]): void {
  const store = useGameStore.getState();
  const fresh = events.filter(e => e.seq > lastSeq).sort((a, b) => a.seq - b.seq);
  if (fresh.length === 0) return;

  lastSeq = fresh[fresh.length - 1].seq;
  store.applySnapshot(state);

  for (const event of fresh) {
    listeners.forEach(l => l(event));
    // Only the newest event drives the stage caption/effects
    if (event === fresh[fresh.length - 1]) {
      store.setLastAction(toLiveAction(event, state.guesses));
    }
  }
}

export function toLiveAction(event: RoomEvent, guesses: Guess[]): LiveAction {
  const who = event.actor === 'agent' ? 'Agent' : 'You';
  let caption: string;
  let guess: Guess | undefined;

  switch (event.tool) {
    case 'read_view':
      caption = `${who} ${event.actor === 'agent' ? 'is' : 'are'} studying the view`;
      break;
    case 'rotate_object': {
      const deg = Number(event.args.degrees) || 0;
      const axis = String(event.args.axis);
      const dir = axis === 'y' ? (deg > 0 ? 'right' : 'left') : axis === 'x' ? (deg > 0 ? 'down' : 'up') : deg > 0 ? 'clockwise' : 'counter-clockwise';
      caption = event.success ? `${who} turned the object ${Math.abs(deg)}° ${dir}` : `${who} tried an invalid rotation`;
      break;
    }
    case 'zoom':
      caption = event.success
        ? `${who} zoomed to level ${Number(event.args.level) + 1}`
        : `${who} tried a locked zoom level`;
      break;
    case 'submit_guess': {
      const name = String(event.args.name ?? '');
      guess = guesses.find(g => g.guessText.toLowerCase() === name.toLowerCase() && g.guessNumber === guesses.length);
      if (!event.success) caption = `${who} could not submit "${name}"`;
      else if (guess?.correct) caption = `${who} guessed "${name}" and got it!`;
      else caption = `${who} guessed "${name}"`;
      break;
    }
  }

  return {
    id: `${event.seq}`,
    ts: event.ts,
    actor: event.actor,
    tool: event.tool,
    args: event.args,
    success: event.success,
    caption,
    guess,
  };
}

/**
 * Start polling the room. Poll cadence tightens while an agent is active so the
 * screen reacts within ~0.6s of a tool call, and relaxes when idle.
 */
export function startRoomSync(code: string): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let failures = 0;
  const store = useGameStore.getState();
  store.setRoom(code, false);

  const tick = async () => {
    if (stopped) return;
    let delay = POLL_IDLE_MS;
    try {
      const res = await fetch(`${roomApiUrl(code, '/events')}?since=${lastSeq}&host=1`, {
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) throw new Error(`events ${res.status}`);
      const data = (await res.json()) as { state: RoomSnapshot; events: RoomEvent[]; now: number };
      failures = 0;
      if (!useGameStore.getState().roomConnected) store.setRoom(code, true);
      ingest(data.state, data.events);

      const agentActive = data.state.lastAgentEventAt !== null && data.now - data.state.lastAgentEventAt < AGENT_ACTIVE_WINDOW_MS;
      delay = agentActive ? POLL_ACTIVE_MS : POLL_IDLE_MS;
    } catch (err) {
      failures += 1;
      if (failures >= 3 && useGameStore.getState().roomConnected) store.setRoom(code, false);
      delay = Math.min(POLL_IDLE_MS * failures, 8000);
      if (failures === 1) console.warn('Room sync hiccup:', err);
    }
    timer = setTimeout(tick, delay);
  };

  void tick();
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
