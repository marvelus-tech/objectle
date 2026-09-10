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

Objectle is designed to be watched: a human opens the host screen, a guest scans the QR code, and everything the guest's agent does is animated live on the host screen.

### How the live room works

1. The host screen picks a 4-letter room code and puts it in the URL (`?room=ABCD`) and in the QR code.
2. The Worker keeps one Durable Object per room with the viewer state (rotation, zoom, reveal tier, guesses) and an ordered log of tool calls.
3. Agents call the room's tools. The host screen polls the room and animates each event: the object turns, the camera dollies, the clay reveals, captions narrate, and the timeline fills in.

Agents can connect three ways, from zero-setup to native:

- **Plain URLs (any agent that can fetch a web page):** `GET https://<worker>/api/room/ABCD` returns a text manual with the exact tool URLs, e.g. `.../tools/rotate_object?axis=y&degrees=30`. This is what the QR prompt uses.
- **MCP connector:** add `https://<worker>/mcp/ABCD` as a Streamable HTTP server (no auth). Works with Claude.ai connectors, ChatGPT developer mode, Cursor, Claude Code.
- **Browser WebMCP:** when the host page is driven by a browser agent that supports `window.modelContext`, the same four tools are registered in-page and routed through the room.

The four tools:

- `read_view()` - Curated description of the current view (never the answer)
- `rotate_object(axis, degrees)` - Rotate the object
- `zoom(level)` - Zoom in (one level unlocks per wrong guess)
- `submit_guess(name)` - Guess, get facet feedback (category, material, scale)

### Node.js MCP Server (desktop clients)

`worker/mcp-server.ts` is a thin stdio proxy to the room endpoints for clients like Claude Desktop. Set `WORKER_API` and either `ROOM_CODE` or call `join_room(code)` first. See AGENTS.md.

**Agent Panel:**
The page includes a visible agent tools panel (bottom-right) that shows available tools, their schemas, and allows manual execution with copyable results. This follows the Foresight Shop pattern for transparent agent interaction.

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
- **Live rooms**: Cloudflare Durable Object per room (viewer state + tool event log, MCP endpoint)
- **Database**: Cloudflare D1 (daily challenges, scores, synonyms)
- **Shared rules**: `shared/` (progression thresholds and tool schemas used by browser, Worker and MCP server)
- **Deployment**: Cloudflare Pages (frontend) + Workers (backend)
- **MCP Server**: Node.js stdio server for AI agent tools

## Local Development

### Fastest path (agent drives the UI, no Cloudflare deploy)

Friend/prospect walkthrough: [DEMO.md](./DEMO.md).

```bash
npm install
npm run dev:local
```

Then open http://127.0.0.1:3000, copy `?room=ABCD` from the URL, and run:

```bash
npm run smoke:agent -- ABCD
```

Full walkthrough: [LEARN_LOCAL.md](./LEARN_LOCAL.md).

### Prerequisites
- Node.js 18+
- Wrangler CLI (via `npm install` — no Cloudflare account needed for `--local`)
- Cloudflare account only when you want to deploy

### Manual setup (two terminals)

1. Install dependencies:
```bash
npm install
```

2. Set up the local D1 database:
```bash
npm run db:migrate:local
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
      "command": "npx",
      "args": ["tsx", "worker/mcp-server.ts"],
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
3. Push to main branch. Automatic deployment via GitHub Actions to GitHub Pages

**Manual deployment:**
```bash
npm run build
npx wrangler pages deploy dist
```

### 2. GitHub Pages (Demo/Static with Fallback)

GitHub Pages deployment works **without requiring a Worker**. The frontend includes a local challenges catalog that provides full gameplay offline.

**Setup:**
1. Enable GitHub Pages in repository settings (Source: GitHub Actions)
2. Push to main branch. Automatic deployment to `marvelus-tech.github.io/objectle/`

**How it works:**
- On GitHub Pages (or when Worker is unavailable), the app falls back to a local catalog
- Daily challenges, guess checking, and scoring work entirely client-side
- Uses localStorage for guess history and state persistence
- No server required, fully playable as a static site

### Worker Deployment (Optional)

The Worker provides live rooms (the agent-to-screen bridge), server-side scoring, leaderboards, and persistent state. Deploy it for full features:

1. Update `wrangler.jsonc` with your D1 database ID
2. Deploy (this also runs the `RoomDO` Durable Object migration declared in `wrangler.jsonc`):
```bash
npm run worker:deploy
```

Without a deployed Worker the page still plays locally, but remote agents cannot join a room, and the PassCard says so.

The Worker will be available at `objectle.yourusername.workers.dev`.

**Note:** The frontend tries the Worker first, then gracefully falls back to local mode if unavailable. This means:
- GitHub Pages works immediately without any Worker
- When you deploy a Worker, update `app/src/lib/api.ts` to point to your Worker URL
- Both paths coexist: Worker for full features, local fallback for demos

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
