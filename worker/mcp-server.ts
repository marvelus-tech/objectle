#!/usr/bin/env node

/**
 * Objectle WebMCP Server
 * Provides MCP tools for AI agents to interact with the 3D viewer
 * 
 * Tools:
 * - rotate_object(axis, degrees)
 * - zoom(level)
 * - read_view()
 * - publish_status(headline, rationale, candidates, next, confidence)
 * - submit_guess(name)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

interface GuessResult {
  correct: boolean;
  guessNumber: number;
  facets: {
    category: { value: string; match: boolean };
    material: { value: string; match: boolean };
    scale: { value: string; match: boolean };
  };
  gameOver: boolean;
  won: boolean;
}

interface PublishedStatus {
  headline: string;
  rationale?: string;
  candidates?: Array<{ name: string; confidence?: number; evidence?: string }>;
  next?: string;
  confidence?: 'low' | 'medium' | 'high';
}

interface McpGameState {
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  zoomLevel: number;
  revealTier: number;
  guesses: GuessResult[];
  playerId: string | null;
  objectKey: string | null;
  lastStatus: PublishedStatus | null;
}

// Game state (in production, this would be shared via D1 or Durable Objects)
const gameState: McpGameState = {
  rotationX: 15,
  rotationY: 30,
  rotationZ: 0,
  zoomLevel: 0,
  revealTier: 0,
  guesses: [],
  playerId: null,
  objectKey: null,
  lastStatus: null,
};

// View descriptions based on reveal tier (never include the answer)
const viewDescriptions = {
  0: {
    short: 'A dark silhouette against a light background',
    detailed: 'You see a pure black silhouette of an object. The shape is somewhat visible but all surface details are hidden. The object is positioned on a light-colored floor with minimal lighting.',
  },
  1: {
    short: 'A dark gray clay-like object with basic form visible',
    detailed: 'The object has a dark gray, clay-like appearance. Basic forms and volumes are visible but fine details remain obscured. Studio lighting is dim. You can make out the general structure.',
  },
  2: {
    short: 'A light-colored ceramic object with clear details',
    detailed: 'The object now has a light beige ceramic appearance. Surface details, edges, and proportions are clearly visible. The lighting is brighter with soft shadows.',
  },
  3: {
    short: 'A fully lit object with rich material details in a studio setup',
    detailed: 'The object is fully revealed in a professional studio lighting setup. All material details, textures, and subtle features are visible. Soft key lights, fill lights, and contact shadows create a polished presentation.',
  },
};

// API endpoint for the Worker
const WORKER_API = process.env.WORKER_API || 'http://localhost:8787/api';

const server = new Server(
  {
    name: 'objectle-viewer',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'rotate_object',
        description: 'Rotate the 3D object to view it from different angles. Use discrete steps (±15° or ±30° recommended). Early in the game, rotation may be limited.',
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
      },
      {
        name: 'read_view',
        description: 'Get a curated description of what is currently visible in the 3D viewer. The description detail increases as you make guesses. Never reveals the answer or filename.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'publish_status',
        description: 'Share a short public working-theory update for the human audience. Do not send private chain-of-thought.',
        inputSchema: {
          type: 'object',
          properties: {
            headline: { type: 'string', maxLength: 80 },
            rationale: { type: 'string', maxLength: 200 },
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
            next: { type: 'string', maxLength: 100 },
            confidence: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
            },
          },
          required: ['headline'],
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
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'rotate_object': {
        const { axis, degrees } = args as { axis: 'x' | 'y' | 'z'; degrees: number };
        
        // Apply rotation
        const axisKey = `rotation${axis.toUpperCase()}` as 'rotationX' | 'rotationY' | 'rotationZ';
        gameState[axisKey] += degrees;
        
        return {
          content: [
            {
              type: 'text',
              text: `Rotated object ${degrees}° around ${axis}-axis. Current rotation: X=${gameState.rotationX}°, Y=${gameState.rotationY}°, Z=${gameState.rotationZ}°`,
            },
          ],
        };
      }

      case 'zoom': {
        const { level } = args as { level: number };
        const maxZoom = Math.min(gameState.revealTier + 1, 3);
        
        if (level > maxZoom) {
          return {
            content: [
              {
                type: 'text',
                text: `Zoom level ${level} is locked. Maximum available: ${maxZoom}. Make more guesses to unlock higher zoom levels.`,
              },
            ],
          };
        }
        
        gameState.zoomLevel = level;
        
        return {
          content: [
            {
              type: 'text',
              text: `Zoom set to level ${level}/3. Camera distance adjusted.`,
            },
          ],
        };
      }

      case 'read_view': {
        const desc = viewDescriptions[gameState.revealTier as keyof typeof viewDescriptions];
        const rotation = `The object is currently rotated X=${gameState.rotationX}°, Y=${gameState.rotationY}°, Z=${gameState.rotationZ}°.`;
        const zoom = `Zoom level: ${gameState.zoomLevel}/3.`;
        
        return {
          content: [
            {
              type: 'text',
              text: `${desc.detailed}\n\n${rotation}\n${zoom}\n\nGuesses made: ${gameState.guesses.length}/6`,
            },
          ],
        };
      }

      case 'publish_status': {
        const input = (args ?? {}) as Record<string, unknown>;
        const headline =
          typeof input.headline === 'string'
            ? input.headline.replace(/\s+/g, ' ').trim().slice(0, 80)
            : '';

        if (!headline) {
          throw new Error('A short headline is required.');
        }

        const candidates = Array.isArray(input.candidates)
          ? input.candidates.slice(0, 3).flatMap(candidate => {
              if (!candidate || typeof candidate !== 'object') return [];
              const item = candidate as Record<string, unknown>;
              if (typeof item.name !== 'string' || !item.name.trim()) return [];
              return [{
                name: item.name.trim().slice(0, 40),
                confidence:
                  typeof item.confidence === 'number'
                    ? Math.min(100, Math.max(0, Math.round(item.confidence)))
                    : undefined,
                evidence:
                  typeof item.evidence === 'string'
                    ? item.evidence.replace(/\s+/g, ' ').trim().slice(0, 100)
                    : undefined,
              }];
            })
          : undefined;

        gameState.lastStatus = {
          headline,
          rationale:
            typeof input.rationale === 'string'
              ? input.rationale.replace(/\s+/g, ' ').trim().slice(0, 200)
              : undefined,
          candidates,
          next:
            typeof input.next === 'string'
              ? input.next.replace(/\s+/g, ' ').trim().slice(0, 100)
              : undefined,
          confidence: ['low', 'medium', 'high'].includes(String(input.confidence))
            ? (input.confidence as PublishedStatus['confidence'])
            : undefined,
        };

        return {
          content: [
            {
              type: 'text',
              text: `Public status prepared: ${headline}`,
            },
          ],
        };
      }

      case 'submit_guess': {
        const { name: guessName } = args as { name: string };
        
        if (!gameState.playerId) {
          gameState.playerId = `agent_${Date.now()}`;
        }
        
        // Call the Worker API to check the guess
        try {
          const response = await fetch(`${WORKER_API}/check-guess`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              playerId: gameState.playerId,
              guess: guessName,
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Worker API error: ${response.status}`);
          }
          
          const result = await response.json<GuessResult>();
          
          // Update game state
          gameState.guesses.push(result);
          const wrongGuesses = gameState.guesses.filter(guess => !guess.correct).length;
          gameState.revealTier = Math.min(
            wrongGuesses >= 5 ? 3 : wrongGuesses >= 3 ? 2 : wrongGuesses >= 1 ? 1 : 0,
            3
          );
          
          // Format response
          const facetFeedback = `
Category: ${result.facets.category.value} ${result.facets.category.match ? '✓' : '✗'}
Material: ${result.facets.material.value} ${result.facets.material.match ? '✓' : '✗'}
Scale: ${result.facets.scale.value} ${result.facets.scale.match ? '✓' : '✗'}`;
          
          let message = `Guess #${result.guessNumber}: "${guessName}"\n\n`;
          
          if (result.correct) {
            message += 'CORRECT! You won!\n\n';
          } else {
            message += `Incorrect. ${6 - result.guessNumber} guesses remaining.\n\n`;
          }
          
          message += `Facet Feedback:\n${facetFeedback}\n\n`;
          message += `Reveal tier increased to ${gameState.revealTier + 1}/4. More details are now visible.`;
          
          if (result.gameOver) {
            if (result.won) {
              message += `\n\nGame Over - You won in ${result.guessNumber} guesses!`;
            } else {
              message += '\n\nGame Over - No guesses remaining.';
            }
          }
          
          return {
            content: [
              {
                type: 'text',
                text: message,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error checking guess: ${error}. Make sure the Worker is running at ${WORKER_API}`,
              },
            ],
          };
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Objectle WebMCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
