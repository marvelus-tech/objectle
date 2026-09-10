/**
 * Browser WebMCP Implementation for Objectle
 * Registers viewer tools that agents can use directly from the page
 */

import { useGameStore } from './store';
import { api } from './api';
import {
  GuessDetail,
  sanitizePublishedStatus,
  TheaterSource,
  useTheaterStore,
} from './theater';

export interface WebMCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (
    args: any,
    source?: TheaterSource,
  ) => Promise<{ content: Array<{ type: string; text: string }> }>;
}

// Define WebMCP tools
export const webmcpTools: WebMCPTool[] = [
  {
    name: 'rotate_object',
    description: 'Rotate the 3D object to view it from different angles. Use discrete steps (±15° or ±30° recommended).',
    inputSchema: {
      type: 'object',
      properties: {
        axis: {
          type: 'string',
          enum: ['x', 'y', 'z'],
          description: 'The rotation axis (x = tilt up/down, y = turn left/right, z = roll)',
        },
        degrees: {
          type: 'number',
          description: 'Degrees to rotate (positive or negative). Discrete steps like ±15 or ±30 work best.',
        },
      },
      required: ['axis', 'degrees'],
    },
    handler: async (
      args: { axis: 'x' | 'y' | 'z'; degrees: number },
      source = 'agent',
    ) => {
      const eventId = useTheaterStore.getState().startTool(
        'rotate_object',
        { ...args },
        source,
      );
      const store = useGameStore.getState();
      store.rotate(args.axis, args.degrees);
      
      const newState = useGameStore.getState();
      const result = `Rotated object ${args.degrees}° around ${args.axis}-axis. Current rotation: X=${newState.rotationX}°, Y=${newState.rotationY}°, Z=${newState.rotationZ}°`;
      
      useTheaterStore.getState().completeTool(eventId, result, true);
      
      return {
        content: [{ type: 'text', text: result }],
      };
    },
  },
  {
    name: 'zoom',
    description: 'Change the camera zoom level. Zoom is gated and unlocks as you make wrong guesses (Heardle-style). Levels: 0 (far), 1 (medium), 2 (close), 3 (very close).',
    inputSchema: {
      type: 'object',
      properties: {
        level: {
          type: 'number',
          minimum: 0,
          maximum: 3,
          description: 'Zoom level (0-3). Higher levels unlock after wrong guesses.',
        },
      },
      required: ['level'],
    },
    handler: async (args: { level: number }, source = 'agent') => {
      const eventId = useTheaterStore
        .getState()
        .startTool('zoom', { ...args }, source);
      const store = useGameStore.getState();
      const maxZoom = Math.min(store.revealTier + 1, 3);
      
      if (args.level > maxZoom) {
        const result = `Zoom level ${args.level} is locked. Maximum available: ${maxZoom}. Make more guesses to unlock higher zoom levels.`;
        useTheaterStore.getState().completeTool(eventId, result, false);
        return {
          content: [{ type: 'text', text: result }],
        };
      }
      
      store.zoom(args.level);
      const result = `Zoom set to level ${args.level}/3. Camera distance adjusted.`;
      
      useTheaterStore.getState().completeTool(eventId, result, true);
      
      return {
        content: [{ type: 'text', text: result }],
      };
    },
  },
  {
    name: 'read_view',
    description: 'Get a curated description of what is currently visible in the 3D viewer. The description detail increases as you make guesses. Never reveals the answer or filename.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (_args, source = 'agent') => {
      const eventId = useTheaterStore.getState().startTool('read_view', {}, source);
      const store = useGameStore.getState();
      
      const viewDescriptions = [
        {
          detailed: 'You see a pure black silhouette of an object. The shape is somewhat visible but all surface details are hidden. The object is positioned on a light-colored floor with minimal lighting.',
        },
        {
          detailed: 'The object has a dark gray, clay-like appearance. Basic forms and volumes are visible but fine details remain obscured. Studio lighting is dim. You can make out the general structure.',
        },
        {
          detailed: 'The object now has a light beige ceramic appearance. Surface details, edges, and proportions are clearly visible. The lighting is brighter with soft shadows.',
        },
        {
          detailed: 'The object is fully revealed in a professional studio lighting setup. All material details, textures, and subtle features are visible. Soft key lights, fill lights, and contact shadows create a polished presentation.',
        },
      ];
      
      const desc = viewDescriptions[store.revealTier];
      const rotation = `The object is currently rotated X=${store.rotationX}°, Y=${store.rotationY}°, Z=${store.rotationZ}°.`;
      const zoom = `Zoom level: ${store.zoomLevel}/3.`;
      const result = `${desc.detailed}\n\n${rotation}\n${zoom}\n\nGuesses made: ${store.guesses.length}/6`;
      
      useTheaterStore.getState().completeTool(eventId, result, true);
      
      return {
        content: [{ type: 'text', text: result }],
      };
    },
  },
  {
    name: 'publish_status',
    description: 'Share a concise public working-theory update for the human audience. Use this instead of private chain-of-thought. Publish before a guess and after interpreting facet feedback.',
    inputSchema: {
      type: 'object',
      properties: {
        headline: {
          type: 'string',
          maxLength: 80,
          description: 'Plain-language summary of the current decision',
        },
        rationale: {
          type: 'string',
          maxLength: 200,
          description: 'Brief evidence-based explanation intended for the audience',
        },
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
        next: {
          type: 'string',
          maxLength: 100,
          description: 'The next intended action',
        },
        confidence: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
        },
      },
      required: ['headline'],
    },
    handler: async (args: unknown, source = 'agent') => {
      try {
        const status = sanitizePublishedStatus(args);
        useTheaterStore.getState().publishStatus({ ...status, source });
        return {
          content: [
            {
              type: 'text',
              text: `Public status shared: ${status.headline}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Status was not shared: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  },
  {
    name: 'submit_guess',
    description: 'Submit a guess for what the object is. Returns Worldle-style facet feedback (category, material, scale) and whether the guess is correct. Synonym matching is supported (e.g., bike = bicycle).',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Your guess for the object name',
        },
      },
      required: ['name'],
    },
    handler: async (args: { name: string }, source = 'agent') => {
      const eventId = useTheaterStore
        .getState()
        .startTool('submit_guess', { ...args }, source);
      const store = useGameStore.getState();
      
      try {
        const result = await api.checkGuess(store.playerId, args.name);
        
        store.addGuess({
          guessNumber: result.guessNumber,
          guessText: args.name,
          correct: result.correct,
          facets: result.facets,
        });
        
        if (result.gameOver) {
          store.setGameOver(result.won);
        }
        
        const facetFeedback = `
Category: ${result.facets.category.value} ${result.facets.category.match ? '✓' : '✗'}
Material: ${result.facets.material.value} ${result.facets.material.match ? '✓' : '✗'}
Scale: ${result.facets.scale.value} ${result.facets.scale.match ? '✓' : '✗'}`;
        
        let message = `Guess #${result.guessNumber}: "${args.name}"\n\n`;
        
        if (result.correct) {
          message += 'CORRECT! You won!\n\n';
        } else {
          message += `Incorrect. ${6 - result.guessNumber} guesses remaining.\n\n`;
        }
        
        message += `Facet Feedback:\n${facetFeedback}\n\n`;
        message += `Reveal tier increased to ${store.revealTier + 1}/4. More details are now visible.`;
        
        if (result.gameOver) {
          if (result.won) {
            message += `\n\nGame Over - You won in ${result.guessNumber} guesses!`;
          } else {
            message += '\n\nGame Over - No guesses remaining.';
          }
        }
        
        const detail: GuessDetail = {
          guess: args.name,
          guessNumber: result.guessNumber,
          correct: result.correct,
          remaining: Math.max(0, 6 - result.guessNumber),
          facets: result.facets,
        };
        useTheaterStore.getState().completeTool(eventId, message, true, detail);
        
        return {
          content: [{ type: 'text', text: message }],
        };
      } catch (error) {
        const errorMsg = `Error checking guess: ${error}`;
        useTheaterStore.getState().completeTool(eventId, errorMsg, false);
        return {
          content: [{ type: 'text', text: errorMsg }],
        };
      }
    },
  },
];

/**
 * Register WebMCP tools with the browser's modelContext API
 * This makes the tools available to AI agents viewing the page
 */
export function registerWebMCPTools() {
  if (typeof window === 'undefined') return;
  
  // @ts-ignore - modelContext API
  if (window.modelContext) {
    // @ts-ignore
    window.modelContext.registerTools(webmcpTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      handler: (args: unknown) => tool.handler(args, 'agent'),
    })));
    
    console.log('WebMCP tools registered:', webmcpTools.map(t => t.name));
  } else {
    console.warn('modelContext API not available. WebMCP tools not registered.');
  }
}

/**
 * Manually call a WebMCP tool (for testing or fallback panel)
 */
export async function callWebMCPTool(toolName: string, args: any): Promise<string> {
  const tool = webmcpTools.find(t => t.name === toolName);
  if (!tool) {
    throw new Error(`Tool not found: ${toolName}`);
  }
  
  try {
    const result = await tool.handler(args, 'panel');
    return result.content[0].text;
  } catch (error) {
    throw new Error(`Tool execution failed: ${error}`);
  }
}
