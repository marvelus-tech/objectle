/**
 * RoomDO: one Durable Object per room code.
 *
 * Why a Durable Object? The host screen and the agent are two different clients
 * that never talk to each other directly. The DO is the single place where the
 * live viewer state (rotation, zoom, reveal tier, guesses) and an ordered event
 * log live. Agents write to it through tool calls; the host screen reads from it
 * and animates every change.
 */

import { DurableObject } from 'cloudflare:workers';
import type { Env } from './env';
import { getTodayUTC } from './env';
import { checkGuess, GameError } from './game';
import {
  isToolName,
  normalizeToolArgs,
  resolveToolName,
  type ToolArgs,
  type ToolName,
} from '../shared/tools';
import {
  countWrong,
  describeGuess,
  describeView,
  maxZoomFor,
  revealTierFor,
  MAX_ZOOM,
  type GuessRecord,
} from '../shared/progression';

export type Actor = 'agent' | 'host';

export interface RoomState {
  code: string;
  playerId: string;
  date: string;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  zoomLevel: number;
  revealTier: number;
  guesses: GuessRecord[];
  gameOver: boolean;
  won: boolean;
  seq: number;
  lastAgentEventAt: number | null;
  hostSeenAt: number | null;
}

export interface RoomEvent {
  seq: number;
  ts: number;
  actor: Actor;
  tool: ToolName;
  args: ToolArgs;
  result: string;
  success: boolean;
}

export interface ToolCallResult {
  text: string;
  success: boolean;
  state: RoomState;
  event: RoomEvent;
}

export interface EventsResponse {
  state: RoomState;
  events: RoomEvent[];
  now: number;
}

const MAX_EVENTS = 200;

function freshState(code: string, date: string): RoomState {
  return {
    code,
    // A unique player id per room-day keeps D1 guess counting isolated per session
    playerId: `room_${code}_${date}_${Math.random().toString(36).slice(2, 8)}`,
    date,
    rotationX: 15,
    rotationY: 30,
    rotationZ: 0,
    zoomLevel: 0,
    revealTier: 0,
    guesses: [],
    gameOver: false,
    won: false,
    seq: 0,
    lastAgentEventAt: null,
    hostSeenAt: null,
  };
}

export class RoomDO extends DurableObject<Env> {
  private state!: RoomState;
  private events: RoomEvent[] = [];

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      const [state, events] = await Promise.all([
        ctx.storage.get<RoomState>('state'),
        ctx.storage.get<RoomEvent[]>('events'),
      ]);
      this.state = state ?? freshState('', getTodayUTC());
      this.events = events ?? [];
    });
  }

  /** Called by the host screen on every poll. Also marks the host as present. */
  async getEvents(code: string, since: number, fromHost: boolean): Promise<EventsResponse> {
    this.ensureToday(code);
    if (fromHost) {
      this.state.hostSeenAt = Date.now();
      await this.persist();
    }
    return {
      state: this.state,
      events: this.events.filter(e => e.seq > since),
      now: Date.now(),
    };
  }

  async getState(code: string): Promise<RoomState> {
    this.ensureToday(code);
    return this.state;
  }

  async callTool(code: string, tool: string, rawArgs: ToolArgs, actor: Actor): Promise<ToolCallResult> {
    this.ensureToday(code);

    let text: string;
    let success = true;
    let args: ToolArgs = rawArgs;
    const resolved = resolveToolName(tool) ?? (isToolName(tool) ? tool : null);

    if (!resolved) {
      text = `Unknown tool "${tool}". Available: read_view, rotate_object, zoom, publish_status, submit_guess.`;
      success = false;
    } else {
      try {
        args = normalizeToolArgs(resolved, rawArgs);
        text = await this.execute(resolved, args);
      } catch (err) {
        success = false;
        text = err instanceof Error ? err.message : String(err);
      }
    }

    const event: RoomEvent = {
      seq: ++this.state.seq,
      ts: Date.now(),
      actor,
      tool: resolved ?? 'read_view',
      args,
      result: text,
      success,
    };
    this.events.push(event);
    if (this.events.length > MAX_EVENTS) this.events = this.events.slice(-MAX_EVENTS);
    if (actor === 'agent') this.state.lastAgentEventAt = event.ts;
    await this.persist();

    return { text, success, state: this.state, event };
  }

  private async execute(tool: ToolName, args: ToolArgs): Promise<string> {
    const s = this.state;
    switch (tool) {
      case 'read_view':
        return describeView(s);

      case 'rotate_object': {
        const axis = args.axis as 'x' | 'y' | 'z';
        const degrees = args.degrees as number;
        const key = `rotation${axis.toUpperCase()}` as 'rotationX' | 'rotationY' | 'rotationZ';
        s[key] += degrees;
        return `Rotated object ${degrees}° around ${axis}-axis. Current rotation: X=${s.rotationX}°, Y=${s.rotationY}°, Z=${s.rotationZ}°`;
      }

      case 'zoom': {
        const level = args.level as number;
        const unlocked = maxZoomFor(countWrong(s.guesses));
        if (level > unlocked) {
          throw new Error(
            `Zoom level ${level} is locked. Maximum available: ${unlocked}. Make more guesses to unlock higher zoom levels.`
          );
        }
        s.zoomLevel = level;
        return `Zoom set to level ${level}/${MAX_ZOOM}. Camera distance adjusted.`;
      }

      case 'submit_guess': {
        if (s.gameOver) {
          return s.won
            ? 'The game is already over: you won! Come back tomorrow for a new object.'
            : 'The game is already over: no guesses remaining. Come back tomorrow for a new object.';
        }
        const name = args.name as string;
        let outcome;
        try {
          outcome = await checkGuess(this.env, s.playerId, name);
        } catch (err) {
          if (err instanceof GameError) throw new Error(err.message);
          throw err;
        }
        s.guesses.push({
          guessNumber: outcome.guessNumber,
          guessText: name,
          correct: outcome.correct,
          facets: outcome.facets,
        });
        const wrong = countWrong(s.guesses);
        s.revealTier = revealTierFor(wrong);
        // Auto-advance the camera to the newly unlocked zoom, like the original host UI did
        s.zoomLevel = Math.max(s.zoomLevel, maxZoomFor(wrong));
        if (outcome.gameOver) {
          s.gameOver = true;
          s.won = outcome.won;
          if (outcome.won) s.revealTier = 3;
        }
        return describeGuess(name, outcome, s.revealTier);
      }

      case 'publish_status': {
        const headline = args.headline as string;
        return `Public status shared: ${headline}`;
      }
    }
  }

  /** Rooms live across UTC midnight; when the daily object changes the round resets. */
  private ensureToday(code: string): void {
    const today = getTodayUTC();
    if (this.state.code !== code || this.state.date !== today) {
      const hostSeenAt = this.state.hostSeenAt;
      this.state = freshState(code, today);
      this.state.hostSeenAt = hostSeenAt;
      this.events = [];
      void this.persist();
    }
  }

  private async persist(): Promise<void> {
    await this.ctx.storage.put({ state: this.state, events: this.events });
  }
}
