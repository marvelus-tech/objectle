/**
 * The Objectle tools, described once and reused by:
 *  - the browser WebMCP registration (app/src/lib/webmcp.ts)
 *  - the Worker's MCP endpoint (worker/mcp-http.ts)
 *  - the stdio MCP server (worker/mcp-server.ts)
 */

export type ToolName = 'read_view' | 'rotate_object' | 'zoom' | 'submit_guess' | 'publish_status';

export interface ToolDefinition {
  name: ToolName;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const TOOL_DEFINITIONS: readonly ToolDefinition[] = [
  {
    name: 'read_view',
    description:
      'Get a curated description of what is currently visible in the 3D viewer. Detail increases as you make guesses. Never reveals the answer.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'rotate_object',
    description:
      'Rotate the 3D object to view it from different angles. Use discrete steps (±15° or ±30° recommended). The human watching sees the object turn.',
    inputSchema: {
      type: 'object',
      properties: {
        axis: {
          type: 'string',
          enum: ['x', 'y', 'z'],
          description: 'Rotation axis (x = tilt up/down, y = turn left/right, z = roll)',
        },
        degrees: {
          type: 'number',
          description: 'Degrees to rotate, positive or negative. ±15 or ±30 work best.',
        },
      },
      required: ['axis', 'degrees'],
    },
  },
  {
    name: 'zoom',
    description:
      'Change the camera zoom level. Zoom is gated Heardle-style: each wrong guess unlocks one more level. Levels: 0 (far), 1, 2, 3 (very close).',
    inputSchema: {
      type: 'object',
      properties: {
        level: {
          type: 'number',
          minimum: 0,
          maximum: 3,
          description: 'Zoom level 0-3. Higher levels unlock after wrong guesses.',
        },
      },
      required: ['level'],
    },
  },
  {
    name: 'publish_status',
    description:
      'Share a concise public working-theory update for the human audience. Use this instead of private chain-of-thought. Publish before a guess and after interpreting facet feedback.',
    inputSchema: {
      type: 'object',
      properties: {
        headline: { type: 'string', maxLength: 80, description: 'Plain-language summary of the current decision' },
        rationale: { type: 'string', maxLength: 200, description: 'Brief evidence-based explanation for the audience' },
        candidates: {
          type: 'array',
          maxItems: 3,
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', maxLength: 40 },
              confidence: { type: 'number', minimum: 0, maximum: 100 },
              evidence: { type: 'string', maxLength: 100 },
            },
            required: ['name'],
          },
        },
        next: { type: 'string', maxLength: 100, description: 'The next intended action' },
        confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
      },
      required: ['headline'],
    },
  },
  {
    name: 'submit_guess',
    description:
      'Submit a guess for what the object is. Returns Worldle-style facet feedback (category, material, scale) and whether it is correct. Synonyms accepted (bike = bicycle).',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Your guess for the object name' },
      },
      required: ['name'],
    },
  },
];

export const TOOL_NAMES: readonly ToolName[] = TOOL_DEFINITIONS.map(t => t.name);

/** Tool args are flat primitives so they survive query strings and Durable Object RPC. */
export type ToolArgs = Record<string, string | number | boolean | null>;

/** Flatten arbitrary JSON (LLM output can be creative) into ToolArgs. */
export function toToolArgs(raw: unknown): ToolArgs {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: ToolArgs = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
      out[key] = value as string | number | boolean | null;
    } else if (value !== undefined) {
      out[key] = JSON.stringify(value);
    }
  }
  return out;
}

export function isToolName(value: string): value is ToolName {
  return (TOOL_NAMES as readonly string[]).includes(value);
}

/**
 * Agents invent names. Map common aliases onto the canonical ToolName so a
 * Grok/Claude call to read_view / rotate_object / submit_guess still works.
 */
const TOOL_ALIASES: Record<string, ToolName> = {
  read_view: 'read_view',
  readview: 'read_view',
  'read-view': 'read_view',
  observe: 'read_view',
  look: 'read_view',
  view: 'read_view',

  rotate_object: 'rotate_object',
  rotateobject: 'rotate_object',
  'rotate-object': 'rotate_object',
  rotate: 'rotate_object',
  turn: 'rotate_object',

  zoom: 'zoom',
  zoom_in: 'zoom',
  zoom_out: 'zoom',

  submit_guess: 'submit_guess',
  submitguess: 'submit_guess',
  'submit-guess': 'submit_guess',
  guess: 'submit_guess',
  submit: 'submit_guess',

  publish_status: 'publish_status',
  publishstatus: 'publish_status',
  'publish-status': 'publish_status',
  status: 'publish_status',
  narrate: 'publish_status',
};

export function resolveToolName(raw: string): ToolName | null {
  const key = raw.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (isToolName(key)) return key;
  return TOOL_ALIASES[key] ?? TOOL_ALIASES[key.replace(/_/g, '')] ?? null;
}

/**
 * Coerce loosely-typed args (query-string values, LLM JSON) into what each tool
 * expects. Throws a readable error for agents when required args are missing.
 */
export function normalizeToolArgs(tool: ToolName, raw: Record<string, unknown>): ToolArgs {
  switch (tool) {
    case 'read_view':
      return {};
    case 'rotate_object': {
      const axis = String(raw.axis ?? '').toLowerCase();
      const degrees = Number(raw.degrees);
      if (!['x', 'y', 'z'].includes(axis)) throw new Error('rotate_object needs axis = x, y or z');
      if (!Number.isFinite(degrees)) throw new Error('rotate_object needs a numeric degrees value');
      return { axis, degrees: Math.max(-360, Math.min(360, Math.round(degrees))) };
    }
    case 'zoom': {
      const level = Number(raw.level);
      if (!Number.isInteger(level) || level < 0 || level > 3) throw new Error('zoom needs an integer level from 0 to 3');
      return { level };
    }
    case 'submit_guess': {
      const name = String(raw.name ?? raw.guess ?? '').trim();
      if (!name) throw new Error('submit_guess needs a name');
      return { name: name.slice(0, 60) };
    }
    case 'publish_status': {
      const headline = String(raw.headline ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
      if (!headline) throw new Error('publish_status needs a headline');
      const args: ToolArgs = { headline };
      const rationale = String(raw.rationale ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);
      if (rationale) args.rationale = rationale;
      const next = String(raw.next ?? '').replace(/\s+/g, ' ').trim().slice(0, 100);
      if (next) args.next = next;
      const confidence = String(raw.confidence ?? '').toLowerCase();
      if (['low', 'medium', 'high'].includes(confidence)) args.confidence = confidence;
      if (raw.candidates !== undefined && raw.candidates !== null) {
        args.candidates = typeof raw.candidates === 'string' ? raw.candidates : JSON.stringify(raw.candidates);
      }
      return args;
    }
  }
}
