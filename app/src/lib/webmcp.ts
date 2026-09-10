/**
 * Browser WebMCP for Objectle (Foresight-style, page-first).
 *
 * Tools register on `document.modelContext` (polyfill or native). The Agent
 * Tools panel always works on this tab. Room Worker is optional sync — if it
 * flakes, tools still drive the local store + theater so demos never brick.
 */

import { useGameStore, type Actor } from './store';
import { api, isWorkerAvailable } from './api';
import { callRoomTool, onRoomEvent, toLiveAction, type RoomEvent } from './room';
import { TOOL_DEFINITIONS, normalizeToolArgs, type ToolName } from '../../../shared/tools';
import { countWrong, describeGuess, describeView, maxZoomFor, MAX_ZOOM } from '../../../shared/progression';
import { describeCurrentView } from './view-copy';
import { sanitizePublishedStatus, useTheaterStore } from './theater';

export interface WebMCPTool {
  name: ToolName;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<{ content: Array<{ type: 'text'; text: string }> }>;
}

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

async function executeLocally(tool: ToolName, rawArgs: Record<string, unknown>): Promise<{ text: string; success: boolean }> {
  const store = useGameStore.getState();
  try {
    const args = normalizeToolArgs(tool, rawArgs);
    switch (tool) {
      case 'read_view': {
        const text = store.visualProfile
          ? describeCurrentView({
              visualProfile: store.visualProfile,
              revealTier: store.revealTier,
              rotationX: store.rotationX,
              rotationY: store.rotationY,
              rotationZ: store.rotationZ,
              zoomLevel: store.zoomLevel,
              guessesMade: store.guesses.length,
            })
          : describeView(store);
        return { text, success: true };
      }
      case 'rotate_object': {
        store.rotate(args.axis as 'x' | 'y' | 'z', args.degrees as number);
        const s = useGameStore.getState();
        return {
          text: `Rotated object ${args.degrees}° around ${args.axis}-axis. Current rotation: X=${s.rotationX}°, Y=${s.rotationY}°, Z=${s.rotationZ}°. Tell your human to watch the Objectle tab.`,
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
        return { text: `Zoom set to level ${level}/${MAX_ZOOM}. Camera distance adjusted. Tell your human to watch the Objectle tab.`, success: true };
      }
      case 'submit_guess': {
        const name = args.name as string;
        const result = await api.checkGuess(store.playerId, name);
        store.addGuess({ guessNumber: result.guessNumber, guessText: name, correct: result.correct, facets: result.facets });
        if (result.gameOver) store.setGameOver(result.won, result.answer);
        return { text: describeGuess(name, result, useGameStore.getState().revealTier), success: true };
      }
      case 'publish_status': {
        const status = sanitizePublishedStatus(args);
        return { text: `Public status shared: ${status.headline}`, success: true };
      }
    }
  } catch (error) {
    return { text: error instanceof Error ? error.message : String(error), success: false };
  }
}

async function finishLocal(
  tool: ToolName,
  args: Record<string, unknown>,
  actor: Actor,
  local: { text: string; success: boolean },
): Promise<{ text: string; success: boolean }> {
  const event: RoomEvent = { seq: 0, ts: Date.now(), actor, tool, args, result: local.text, success: local.success };
  logToolExecution({ actor, tool, args, result: local.text, success: local.success });
  const theater = useTheaterStore.getState();
  if (tool === 'publish_status' && local.success) {
    try {
      theater.publishStatus({ ...sanitizePublishedStatus(args), source: actor === 'agent' ? 'agent' : 'human' });
    } catch {
      // already reported in local.text
    }
  } else {
    const id = theater.startTool(tool, args, actor === 'agent' ? 'agent' : 'human');
    theater.completeTool(id, local.text, local.success);
  }
  useGameStore.getState().setLastAction({
    ...toLiveAction(event, useGameStore.getState().guesses),
    id: `local-${event.ts}-${Math.random()}`,
  });
  return local;
}

export async function runTool(tool: ToolName, args: Record<string, unknown>, actor: Actor): Promise<{ text: string; success: boolean }> {
  const { roomCode, roomConnected } = useGameStore.getState();
  const demoLocal =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).get('demo') === '1' ||
      new URLSearchParams(window.location.search).get('local') === '1' ||
      !isWorkerAvailable());
  // Prefer the live room when connected, but never brick a demo if the Worker flakes / demo=1.
  if (!demoLocal && roomCode && roomConnected) {
    try {
      const res = await callRoomTool(roomCode, tool, args, actor);
      return { text: res.text, success: res.success };
    } catch (err) {
      console.warn('Room tool failed; falling back to local theater', err);
    }
  }

  const local = await executeLocally(tool, args);
  return finishLocal(tool, args, actor, local);
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

export type WebMCPMode = 'live' | 'polyfill' | 'panel';

let registrationMode: WebMCPMode = 'panel';
let toolsRegistered = false;

export function getWebMCPMode(): WebMCPMode {
  return registrationMode;
}

/** Open the Agent Tools panel (DemoBanner / PassCard dispatch this). */
export function openAgentPanel() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('objectle:open-agent-panel'));
}

/**
 * Register tools Foresight-style:
 *   1) document.modelContext.registerTool (native / polyfill)
 *   2) window.modelContext.registerTools (legacy plural)
 *   3) panel-only fallback (Agent Tools UI still works)
 */
export function registerWebMCPTools() {
  if (typeof window === 'undefined') return;
  // React StrictMode mounts twice in DEV; polyfill throws if we re-register.
  if (toolsRegistered) return;

  const docCtx = (document as unknown as { modelContext?: ModelContextHost }).modelContext;
  const winCtx = (window as unknown as { modelContext?: ModelContextHost }).modelContext;
  let registered = false;

  const singular = docCtx?.registerTool ?? winCtx?.registerTool;
  if (typeof singular === 'function') {
    const host = docCtx?.registerTool ? docCtx : winCtx;
    for (const tool of webmcpTools) {
      void singular.call(host, {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        async execute(args: Record<string, unknown>) {
          const { text } = await runTool(tool.name, args ?? {}, 'agent');
          return text;
        },
      });
    }
    registered = true;
  }

  const plural = docCtx?.registerTools ?? winCtx?.registerTools;
  if (!registered && typeof plural === 'function') {
    const host = docCtx?.registerTools ? docCtx : winCtx;
    plural.call(host, webmcpTools);
    registered = true;
  }

  const hasPolyfill = typeof (window as unknown as { __webmcp_registered_tools?: unknown }).__webmcp_registered_tools !== 'undefined';
  registrationMode = registered ? (hasPolyfill ? 'polyfill' : 'live') : 'panel';
  if (registered) toolsRegistered = true;

  if (registered) {
    console.log(`WebMCP tools registered (${registrationMode}):`, webmcpTools.map(t => t.name));
  } else {
    console.info('WebMCP host API missing — use Agent Tools on this tab (Foresight fallback).');
  }

  (window as unknown as { __objectleWebMCP?: unknown }).__objectleWebMCP = {
    mode: registrationMode,
    tools: webmcpTools.map(t => t.name),
    call: callWebMCPTool,
    openPanel: openAgentPanel,
  };
}

interface ModelContextHost {
  registerTool?: (tool: Record<string, unknown>) => void | Promise<void>;
  registerTools?: (tools: unknown[]) => void;
}

export async function callWebMCPTool(toolName: string, args: Record<string, unknown>, actor: Actor = 'host'): Promise<string> {
  const tool = webmcpTools.find(t => t.name === toolName);
  if (!tool) throw new Error(`Tool not found: ${toolName}`);
  const { text } = await runTool(tool.name, args, actor);
  return text;
}
