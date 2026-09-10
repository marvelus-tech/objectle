import { roomManualUrl, roomMcpUrl } from './room';

/**
 * The prompt a guest pastes into their agent. Kept deliberately short: the room
 * manual URL is self-describing, so the agent only needs to know to fetch it.
 * (Mirror of public/pass/prompt.js, which must stay plain JS for the static page.)
 */
export function agentPromptFor(code: string): string {
  return [
    `You are playing Objectle, a daily 3D object guessing game. A human is watching your moves live on a big screen (room ${code}).`,
    '',
    'Step 1: Fetch this URL and read it. It is your room manual with the exact tool URLs:',
    roomManualUrl(code),
    '',
    'Step 2: Play by fetching the tool URLs (plain GET requests). Every fetch is shown instantly on the human\'s screen, so narrate in one short sentence what you are doing between calls.',
    '  read_view, rotate_object(axis, degrees), zoom(level), submit_guess(name)',
    '  6 guesses. Facet feedback after each guess: category, material, scale.',
    '',
    `If your client supports MCP connectors, add ${roomMcpUrl(code)} (Streamable HTTP, no auth) to get the same tools natively.`,
    '',
    'Start now with read_view.',
  ].join('\n');
}
