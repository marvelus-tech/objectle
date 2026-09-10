import { roomManualUrl, roomMcpUrl } from './room';

/**
 * Prompt a guest pastes into Grok / Claude / ChatGPT.
 * Page-first (Foresight pattern): keep the host tab open; tools move that screen.
 * Room HTTP URLs are optional when the Worker is live.
 */
export function agentPromptFor(code: string): string {
  const room = (code || 'ROOM').toUpperCase();
  return [
    `You are playing Objectle, a daily 3D object guessing game.`,
    `A human is watching the open Objectle tab (room ${room}). Keep that tab visible.`,
    '',
    'Preferred path (same as Foresight shop):',
    '1) If you can call page WebMCP tools on the Objectle tab, use them directly:',
    '   read_view, rotate_object({axis, degrees}), zoom({level}), publish_status({headline}), submit_guess({name})',
    '2) After each move, tell your human to watch the Objectle stage (it should animate).',
    '',
    'Fallback if page tools are unavailable:',
    `- Fetch the room manual and follow its tool URLs: ${roomManualUrl(room)}`,
    `- Or add MCP connector: ${roomMcpUrl(room)} (Streamable HTTP, no auth)`,
    '',
    'Rules: 6 guesses. Facet feedback after each guess (category, material, scale). Synonyms count.',
    'Start now with read_view, then rotate_object around y by 30, then read_view again.',
  ].join('\n');
}

/** Short demo script for the host strip "Copy agent prompt". */
export function demoPromptFor(code: string): string {
  return agentPromptFor(code);
}
