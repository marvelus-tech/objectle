# Objectle

Daily Wordle-style 3D object guessing game for AI agents and humans.

## Overview

Objectle is a web-based puzzle game where players have 6 guesses to identify a daily 3D object. The game features:

- Heardle-style zoom progression (unlock closer views with wrong guesses)
- Worldle-style facet feedback (category, material, scale)
- Silhouette-first reveal (color and detail unlock as you play)
- WebMCP tools for AI agent gameplay
- Synonym matching (bike = bicycle)
- Daily challenges with streak tracking

## For AI Agents

Objectle is designed to be playable by AI agents using WebMCP tools. See DEMO.md for a detailed playthrough guide.

**Available MCP Tools:**
- `rotate_object(axis, degrees)` - Rotate the object to view from different angles
- `zoom(level)` - Zoom in (gated by wrong guesses)
- `read_view()` - Get a curated description of the current view
- `submit_guess(name)` - Submit a guess and receive facet feedback

Configure the MCP server in your MCP client settings. See AGENTS.md for setup instructions.

## For Humans

Visit the live site to play the daily challenge. Use the on-screen controls to:
- Rotate the object with arrow buttons
- Zoom in as you unlock higher levels
- Type your guess and submit

Share your results with friends using the Worldle-style grid:

```
Objectle 2026-09-06 3/6

🟥🟥🟩
🟥🟩🟩
🟩🟩🟩
```

## Architecture

- **Frontend**: React + React Three Fiber + Three.js (Vite build)
- **Backend**: Cloudflare Worker (game logic, anti-cheat)
- **Database**: Cloudflare D1 (daily challenges, scores, synonyms)
- **Deployment**: Cloudflare Pages (frontend) + Workers (backend)
- **MCP Server**: Node.js stdio server for AI agent tools

## Local Development

### Prerequisites
- Node.js 18+
- Cloudflare account (for deployment)
- Wrangler CLI

### Setup

1. Install dependencies:
```bash
npm install
```

2. Set up the D1 database:
```bash
# Create D1 database
wrangler d1 create objectle-db

# Update wrangler.jsonc with the returned database_id

# Run migrations
wrangler d1 execute objectle-db --local --file=./schema.sql
```

3. Start the Worker (backend):
```bash
npm run worker:dev
```

4. Start the frontend (in a new terminal):
```bash
npm run dev
```

5. Visit http://localhost:3000

### WebMCP Server (for AI agents)

The MCP server requires the Worker to be running. Configure it in your MCP client:

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

## Deployment

Objectle supports two deployment paths:

### 1. Cloudflare Pages (Primary)

The repository includes a GitHub Actions workflow that automatically deploys to Cloudflare Pages on push to `main`.

**Setup:**
1. Create a Cloudflare API Token with "Cloudflare Pages" permissions
2. Add GitHub secrets:
   - `CLOUDFLARE_API_TOKEN`: Your API token
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
3. Push to main branch. Automatic deployment to `objectle.pages.dev`

**Manual deployment:**
```bash
npm run build
npx wrangler pages deploy dist
```

### 2. GitHub Pages (Demo/Static)

GitHub Pages deployment is available for testing and demonstration without requiring Cloudflare secrets.

**Setup:**
1. Enable GitHub Pages in repository settings (Source: GitHub Actions)
2. Push to main branch. Automatic deployment to `marvelus-tech.github.io/objectle/`

The GitHub Pages build automatically configures the correct base path and API endpoints.

### Environment Variables

Set these in Cloudflare Pages settings:
- `WORKER_API`: Your deployed Worker URL (e.g., `https://objectle-worker.yourusername.workers.dev/api`)

## Adding More Objects

Objects are defined in the `daily_challenges` table. To add more:

1. Create or source a 3D model (GLTF/GLB format)
2. Upload to Cloudflare R2 (or serve from `/public/models/`)
3. Add database entry:

```sql
INSERT INTO daily_challenges (date, object_key, object_name, category, material, scale)
VALUES ('2026-09-09', 'daily/obj_lamp_001', 'lamp', 'furniture', 'metal', 'medium');
```

4. Add synonyms if applicable:

```sql
INSERT INTO synonyms (canonical, synonym) VALUES ('lamp', 'light');
```

### Path to 100 Objects

The current MVP uses procedural geometry (boxes, cylinders, tori) for simplicity. To scale to 100+ objects:

1. **Source models**: Use free 3D asset libraries (Sketchfab, Poly Haven) or commission custom models
2. **Optimize**: Keep triangle counts low (<10k tris), compress textures, use Draco compression
3. **Categorize**: Balance categories (furniture, vehicles, tools, kitchenware, electronics, etc.)
4. **R2 Storage**: Upload all models to Cloudflare R2 with opaque keys
5. **Batch insert**: Use SQL scripts to populate `daily_challenges` table
6. **Synonym coverage**: Maintain comprehensive synonym lists for common variations

Recommended object list structure:
- 20 furniture items (chair, table, lamp, etc.)
- 20 kitchenware items (mug, plate, fork, etc.)
- 20 vehicles (car, bicycle, skateboard, etc.)
- 20 tools (hammer, screwdriver, wrench, etc.)
- 20 electronics/misc (phone, keyboard, camera, etc.)

## Anti-Cheat Measures

- Answer is never sent to the client
- Object file names are opaque (never answer-based)
- GLTF metadata is stripped
- Rate limiting on guess submissions
- Guesses validated against allowlist (optional)

## SEO Notes

**Meta Description**: "Objectle: Daily 3D object guessing game for AI agents and humans. Guess the object in 6 tries with Wordle-style feedback."

**Keywords**: objectle, 3d game, wordle, daily puzzle, ai agents, three.js, webmcp

All pages use semantic HTML, proper heading hierarchy, and descriptive alt text. Images are optimized (<200KB). No em dashes in user-facing text per style guide.

## License

MIT License - See LICENSE file for details.

## Credits

Built with:
- React Three Fiber & Three.js
- Cloudflare Workers & Pages
- Cloudflare D1
- WebMCP Protocol
- Zustand state management

Inspired by Wordle, Heardle, and Worldle.
