# Objectle - AI Agent Guide

This guide explains how AI agents can play Objectle using the WebMCP protocol.

## What is Objectle?

Objectle is a daily 3D object guessing game where you have 6 attempts to identify an object. The game provides:

- **Visual observation** through a 3D viewer
- **Rotation tools** to examine the object from different angles
- **Zoom progression** that unlocks as you make guesses (Heardle-style)
- **Reveal tiers** that progressively show more detail (silhouette → gray clay → colored → full studio)
- **Facet feedback** after each guess (Worldle-style: category, material, scale)
- **Synonym matching** so "bike" and "bicycle" are both accepted

## WebMCP Tools

The game exposes 4 MCP tools for agent interaction:

### 1. `read_view()`

Returns a curated description of what is currently visible in the 3D viewer.

**Behavior:**
- Early game: Describes only the silhouette and basic shape
- Mid game: Adds color, material hints, and structural details
- Late game: Provides rich descriptions with lighting and texture information
- **Never reveals the answer or filename**

**Example response:**
```
You see a dark gray, clay-like object. Basic forms and volumes are visible but fine details remain obscured. The object appears cylindrical with a curved protrusion on one side, possibly a handle. Studio lighting is dim. You can make out the general structure.

The object is currently rotated X=15°, Y=75°, Z=0°.
Zoom level: 1/3.

Guesses made: 2/6
```

### 2. `rotate_object(axis, degrees)`

Rotates the 3D object around the specified axis.

**Parameters:**
- `axis` (string): "x", "y", or "z"
  - X-axis: Tilt up/down
  - Y-axis: Turn left/right
  - Z-axis: Roll/spin
- `degrees` (number): Rotation amount (positive or negative)

**Recommended usage:**
- Use discrete steps: ±15°, ±30°, ±45°
- Y-axis rotation is most informative for identifying objects
- X-axis helps see top/bottom features

**Example:**
```json
{
  "axis": "y",
  "degrees": 30
}
```

**Response:**
```
Rotated object 30° around y-axis. Current rotation: X=15°, Y=60°, Z=0°
```

### 3. `zoom(level)`

Changes the camera zoom level to see the object more closely.

**Parameters:**
- `level` (number): 0-3
  - 0: Far view (default)
  - 1: Medium (unlocks after 1 wrong guess)
  - 2: Close (unlocks after 2 wrong guesses)
  - 3: Very close (unlocks after 3 wrong guesses)

**Gating:** Zoom is Heardle-style gated. You start at level 0 and unlock higher levels by making wrong guesses.

**Example:**
```json
{
  "level": 2
}
```

**Response (if unlocked):**
```
Zoom set to level 2/3. Camera distance adjusted.
```

**Response (if locked):**
```
Zoom level 2 is locked. Maximum available: 1. Make more guesses to unlock higher zoom levels.
```

### 4. `submit_guess(name)`

Submits your guess for what the object is.

**Parameters:**
- `name` (string): Your guess (case-insensitive, trimmed)

**Synonym matching:** The game accepts common variations:
- bicycle, bike, cycle
- chair, seat
- lamp, light
- mug, cup, coffee cup
- table, desk

**Response format:**
```
Guess #2: "chair"

Incorrect. 4 guesses remaining.

Facet Feedback:
Category: furniture ✓
Material: wood ✓
Scale: medium ✓

Reveal tier increased to 2/4. More details are now visible.
```

**Correct guess response:**
```
Guess #3: "office chair"

🎉 CORRECT! You won!

Facet Feedback:
Category: furniture ✓
Material: metal ✓
Scale: medium ✓

Game Over - You won in 3 guesses!
```

## Strategy Guide

### Phase 1: Initial Observation (Guesses 0-1)
- Use `read_view()` to get the initial silhouette description
- Rotate around Y-axis (left/right) to see the profile: `rotate_object("y", 45)`
- Rotate around X-axis (up/down) to see top/bottom: `rotate_object("x", -20)`
- Identify basic shape categories: round, rectangular, tall, wide, has handles, has legs, etc.

**Key questions:**
- What is the overall form? (cube, cylinder, complex, organic)
- Are there distinctive parts? (handles, legs, wheels, spouts)
- What are the proportions? (tall and thin, short and wide)

### Phase 2: First Guess (Guess 1)
- Make an informed guess based on the silhouette
- The facet feedback is crucial:
  - **Category match**: You are in the right domain (e.g., furniture, vehicle)
  - **Material match**: The object is made of that material
  - **Scale match**: The object is that size category

**Example:**
```
Guess: "pitcher"
Feedback: Category: kitchenware ✓, Material: ceramic ✗, Scale: small ✓

Interpretation: It is a small kitchenware item, but NOT ceramic. Likely metal or glass.
Candidates: mug, cup, bowl, glass
```

### Phase 3: Use Unlocked Zoom (Guesses 2-3)
- After your first wrong guess, zoom level 1 unlocks
- Use `zoom(1)` to get closer
- Use `read_view()` to get more detailed descriptions
- The reveal tier also increases, showing color and material hints

### Phase 4: Refine (Guesses 4-5)
- Combine facet feedback, zoom, and rotation
- Higher zoom levels unlock (2-3)
- Full studio lighting reveals all details
- Narrow down to specific object variations

### Phase 5: Final Guess (Guess 6)
- Use all available information
- Consider synonyms if stuck
- Remember: 6 wrong guesses = game over

## Example Playthrough

```
Agent: read_view()
Response: "A dark silhouette... cylindrical body with a curved protrusion on one side..."

Agent: rotate_object("y", 45)
Response: "Rotated 45° around y-axis..."

Agent: read_view()
Response: "From this angle, the protrusion appears to be a handle. The body tapers slightly..."

Agent: submit_guess("pitcher")
Response: "Incorrect. Category: kitchenware ✓, Material: ceramic ✗, Scale: small ✓"

Agent: zoom(1)
Response: "Zoom set to level 1/3..."

Agent: read_view()
Response: "A dark gray clay-like object... cylindrical body with a C-shaped handle... appears to be a drinking vessel..."

Agent: submit_guess("mug")
Response: "🎉 CORRECT! You won in 2 guesses!"
```

## MCP Server Setup

Add this to your MCP client configuration file (e.g., `claude_desktop_config.json` for Claude Desktop):

```json
{
  "mcpServers": {
    "objectle-viewer": {
      "command": "node",
      "args": ["/path/to/objectle/worker/mcp-server.js"],
      "env": {
        "WORKER_API": "http://localhost:8787/api"
      }
    }
  }
}
```

For production (deployed Worker):
```json
{
  "mcpServers": {
    "objectle-viewer": {
      "command": "node",
      "args": ["/path/to/objectle/worker/mcp-server.js"],
      "env": {
        "WORKER_API": "https://objectle-worker.yourusername.workers.dev/api"
      }
    }
  }
}
```

### Verification

After configuring, verify the MCP server is available:
```
List available tools -> Should show: rotate_object, zoom, read_view, submit_guess
```

## Tips for High Scores

1. **Rotate before guessing**: Always examine from multiple angles
2. **Use facet clues**: If category matches but material does not, filter candidates by category + correct material
3. **Think synonyms**: "bike" might be "bicycle", "lamp" might be "light"
4. **Zoom strategically**: Do not rush to max zoom; each wrong guess unlocks more, so balance exploration with guess accuracy
5. **Read after every action**: The descriptions evolve as reveal tier increases

## Scoring

- **1 guess**: Genius (very rare)
- **2 guesses**: Excellent
- **3 guesses**: Good
- **4 guesses**: Average
- **5 guesses**: Acceptable
- **6 guesses**: Close call
- **Failed**: Try again tomorrow

Maintain a daily streak for bragging rights!

## Share Format

After winning, you can share your result:

```
Objectle 2026-09-06 3/6

🟥🟥🟩
🟥🟩🟩
🟩🟩🟩

https://objectle.pages.dev
```

Each row represents a guess. Each symbol represents a facet:
- 🟩 = Match
- 🟥 = No match

The three symbols are: [Category] [Material] [Scale]

## Troubleshooting

**Q: The MCP server is not connecting**
A: Ensure the Worker is running (locally or deployed). Check the `WORKER_API` environment variable.

**Q: Zoom is locked at level 0**
A: You need to make wrong guesses to unlock higher zoom levels (Heardle-style progression).

**Q: Read view is not giving detailed descriptions**
A: Descriptions get richer as you make guesses. The reveal tier increases with wrong guesses.

**Q: My guess was not accepted (synonym issue)**
A: Check the synonyms table in `schema.sql`. You can add more synonyms to the database.

## For Developers

If you want to extend the MCP tools or add custom behaviors:

1. Edit `worker/mcp-server.ts`
2. Rebuild: `npm run build` (if using TypeScript)
3. Restart the MCP client

The MCP server communicates with the Cloudflare Worker via REST API, so you can also test the Worker independently:

```bash
curl -X POST http://localhost:8787/api/check-guess \
  -H "Content-Type: application/json" \
  -d '{"playerId": "test", "guess": "chair"}'
```

## Community

Share your best scores, strategies, and feedback:
- GitHub: https://github.com/marvelus-tech/objectle
- Issues: https://github.com/marvelus-tech/objectle/issues

Happy guessing!
