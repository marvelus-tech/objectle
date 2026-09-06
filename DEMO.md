# Objectle Demo Script for AI Agents

This script demonstrates how an AI agent can play Objectle using the WebMCP tools.

## Prerequisites

1. The Objectle Worker must be running (locally or deployed)
2. The WebMCP server must be configured in your MCP client
3. Add this to your MCP settings:

```json
{
  "mcpServers": {
    "objectle-viewer": {
      "command": "node",
      "args": ["worker/mcp-server.js"],
      "env": {
        "WORKER_API": "http://localhost:8787/api"
      }
    }
  }
}
```

## Gameplay Strategy for Agents

### Step 1: Initial Observation
Start by reading the current view to understand what you can see.

```
Tool: read_view
```

At the beginning, you will see only a dark silhouette. Note the general shape and proportions.

### Step 2: Explore Different Angles
Rotate the object to see it from multiple perspectives.

```
Tool: rotate_object
Arguments: { "axis": "y", "degrees": 30 }

Tool: rotate_object
Arguments: { "axis": "x", "degrees": 15 }

Tool: read_view
```

Rotation is always available. Try to identify key features:
- Overall shape (round, rectangular, tall, wide)
- Distinctive parts (handles, legs, spouts, wheels)
- Proportions and symmetry

### Step 3: Make Your First Guess
Based on the silhouette and rotations, make an educated guess.

```
Tool: submit_guess
Arguments: { "name": "chair" }
```

The response will include:
- Whether the guess is correct
- Facet feedback (category, material, scale)
- Updated reveal tier (more details now visible)

### Step 4: Use Facet Feedback
The facet feedback tells you:
- **Category** (furniture, vehicle, kitchenware, tool, etc.)
- **Material** (wood, metal, ceramic, plastic, etc.)
- **Scale** (small, medium, large)

If your guess was wrong but matched the category, you are in the right domain. Adjust based on material and scale clues.

### Step 5: Unlock Zoom
After your first wrong guess, zoom becomes available. Use it to see details more clearly.

```
Tool: zoom
Arguments: { "level": 1 }

Tool: read_view
```

Higher zoom levels unlock with more wrong guesses (Heardle-style progression).

### Step 6: Iterate
Continue rotating, zooming, and reading the view. With each wrong guess:
- The object becomes less silhouetted (more color and detail)
- Higher zoom levels unlock
- Studio lighting improves

### Step 7: Narrow Down and Guess
Use all available information to make your final guesses strategically.

```
Tool: submit_guess
Arguments: { "name": "office chair" }
```

Remember: synonyms are accepted (e.g., bike = bicycle, cup = mug).

## Example Full Playthrough

```
1. read_view
   → "A dark silhouette... somewhat cylindrical with a handle-like protrusion"

2. rotate_object { "axis": "y", "degrees": 45 }
   → See it from the side

3. read_view
   → "The handle is curved, there is a tapered body"

4. submit_guess { "name": "pitcher" }
   → Incorrect. Category: kitchenware ✓, Material: ceramic ✗, Scale: small ✓
   → Reveal tier increased. More detail visible.

5. zoom { "level": 1 }
   → Get closer

6. read_view
   → "Now see more detail: a cylindrical body, possibly a mug or cup"

7. submit_guess { "name": "mug" }
   → Correct! You won in 2 guesses.
```

## Tips for Agents

1. **Start broad**: Look at overall shape before details
2. **Use facets**: Category/material/scale feedback is very informative
3. **Rotate systematically**: Try Y-axis first (left/right), then X-axis (up/down)
4. **Zoom progressively**: Each wrong guess unlocks more zoom
5. **Think synonyms**: The game accepts common variations (bike/bicycle, lamp/light)
6. **Watch the reveal tier**: As it increases, read_view gives richer descriptions

## Scoring

- 1-2 guesses: Expert
- 3-4 guesses: Good
- 5-6 guesses: Solved
- 6+ guesses: Failed

Streaks are tracked across days. Can you maintain a winning streak?

## Share Your Results

After completing the game, you can share your results in Worldle-style format:

```
Objectle 2026-09-06 2/6

🟥🟩🟩
🟩🟩🟩

https://objectle.pages.dev
```

Green squares indicate matching facets, red squares indicate mismatches.
