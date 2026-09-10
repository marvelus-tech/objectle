/**
 * Browser WebMCP implementation for Objectle.
 *
 * Registers the four viewer tools on `window.modelContext` (for browsers/agents
 * that support WebMCP) and exposes `callWebMCPTool` for the in-page controls.
 *
 * When the page is in a live room, every call is routed through the room so the
 * Worker holds the single source of truth and remote agents see host actions too.
 * Without a room (Worker offline) the tools fall back to local-only state.
 */

import { useGameStore, type Actor } from './store';
import { api } from './api';
import { callRoomTool, onRoomEvent, toLiveAction, type RoomEvent } from './room';
import { TOOL_DEFINITIONS, normalizeToolArgs, type ToolName } from '../../../shared/tools';
import { countWrong, describeGuess, describeView, maxZoomFor, MAX_ZOOM } from '../../../shared/progression';

export interface WebMCPTool {
  name: ToolName;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<{ content: Array<{ type: 'text'; text: string }> }>;
}

// Tool execution log for the dual-watch UI
export interface ToolExecution {
  id: string;
  timestamp: number;
  actor: Actor;
  tool: string;
  args: Record<string, unknown>;
  result: string;
  success: boolean;
}

let toolExecutions: ToolExecution[] = [];
let executionCallbacks: Array<(executions: ToolExecution[]) => void> = [];

export function subscribeToToolExecutions(callback: (executions: ToolExecution[]) => void) {
  executionCallbacks.push(callback);
  callback(toolExecutions);
  return () => {
    executionCallbacks = executionCallbacks.filter(cb => cb !== callback);
  };
}

function logToolExecution(entry: Omit<ToolExecution, 'id' | 'timestamp'> & { id?: string; timestamp?: number }) {
  toolExecutions = [
    ...toolExecutions,
    {
      id: entry.id ?? `${Date.now()}-${Math.random()}`,
      timestamp: entry.timestamp ?? Date.now(),
      actor: entry.actor,
      tool: entry.tool,
      args: entry.args,
      result: entry.result,
      success: entry.success,
    },
  ].slice(-50);
  executionCallbacks.forEach(cb => cb(toolExecutions));
}

// Room events (from agents or other tabs) land in the same timeline
onRoomEvent((event: RoomEvent) => {
  logToolExecution({
    id: `room-${event.seq}`,
    timestamp: event.ts,
    actor: event.actor,
    tool: event.tool,
    args: event.args,
    result: event.result,
    success: event.success,
  });
});

/** Local-only execution used when no room is connected. */
async function executeLocally(tool: ToolName, rawArgs: Record<string, unknown>): Promise<{ text: string; success: boolean }> {
  const store = useGameStore.getState();
  try {
    const args = normalizeToolArgs(tool, rawArgs);
    switch (tool) {
      case 'read_view':
        return { text: describeView(store), success: true };
      case 'rotate_object': {
        store.rotate(args.axis as 'x' | 'y' | 'z', args.degrees as number);
        const s = useGameStore.getState();
        return {
          text: `Rotated object ${args.degrees}° around ${args.axis}-axis. Current rotation: X=${s.rotationX}°, Y=${s.rotationY}°, Z=${s.rotationZ}°`,
          success: true,
        };
      }
      case 'zoom': {
        const level = args.level as number;
        const unlocked = maxZoomFor(countWrong(store.guesses));
        if (level > unlocked) {
          return { text: `Zoom level ${level} is locked. Maximum available: ${unlocked}. Make more guesses to unlock higher zoom levels.`, success: false };
        }
        store.zoom(level);
        return { text: `Zoom set to level ${level}/${MAX_ZOOM}. Camera distance adjusted.`, success: true };
      }
      case 'submit_guess': {
        const name = args.name as string;
        const result = await api.checkGuess(store.playerId, name);
        store.addGuess({ guessNumber: result.guessNumber, guessText: name, correct: result.correct, facets: result.facets });
        if (result.gameOver) store.setGameOver(result.won);
        return { text: describeGuess(name, result, useGameStore.getState().revealTier), success: true };
      }
    }
  } catch (error) {
    return { text: error instanceof Error ? error.message : String(error), success: false };
  }
}

/**
 * Run a tool as `actor`. In room mode the Worker executes it and the resulting
 * event flows back through the room listener above; offline we execute locally.
 */
export async function runTool(tool: ToolName, args: Record<string, unknown>, actor: Actor): Promise<{ text: string; success: boolean }> {
  const { roomCode, roomConnected } = useGameStore.getState();
  if (roomCode && roomConnected) {
    const res = await callRoomTool(roomCode, tool, args, actor);
    return { text: res.text, success: res.success };
  }

  const local = await executeLocally(tool, args);
  const event: RoomEvent = { seq: 0, ts: Date.now(), actor, tool, args, result: local.text, success: local.success };
  logToolExecution({ actor, tool, args, result: local.text, success: local.success });
  useGameStore.getState().setLastAction({
    ...toLiveAction(event, useGameStore.getState().guesses),
    id: `local-${event.ts}-${Math.random()}`,
  });
  return local;
}

export const webmcpTools: WebMCPTool[] = TOOL_DEFINITIONS.map(def => ({
  name: def.name,
  description: def.description,
  inputSchema: def.inputSchema,
  handler: async (args: Record<string, unknown>) => {
    const { text } = await runTool(def.name, args ?? {}, 'agent');
    return { content: [{ type: 'text', text }] };
  },
}));

/**
 * Register WebMCP tools with the browser's modelContext API (Chrome WebMCP
 * preview). Agents driving this tab directly get the tools without any server.
 */
export function registerWebMCPTools() {
  if (typeof window === 'undefined') return;
  // @ts-ignore - experimental modelContext API
  const modelContext = window.modelContext;
  if (modelContext?.registerTools) {
    modelContext.registerTools(webmcpTools);
    console.log('WebMCP tools registered:', webmcpTools.map(t => t.name));
  } else {
    console.info('modelContext API not available in this browser; agents connect through the room URL instead.');
  }
}

/** Manually call a tool (AgentPanel / in-page controls). */
export async function callWebMCPTool(toolName: string, args: Record<string, unknown>, actor: Actor = 'host'): Promise<string> {
  const tool = webmcpTools.find(t => t.name === toolName);
  if (!tool) throw new Error(`Tool not found: ${toolName}`);
  const { text } = await runTool(tool.name, args, actor);
  return text;
}
