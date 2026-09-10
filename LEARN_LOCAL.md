# Local agent ↔ UI learning lab

**Goal:** get a learning agent driving the host UI **without** Cloudflare deploy credentials.

For the friend/prospect demo (Foresight-style same-tab tools), see [DEMO.md](./DEMO.md) first.

This file is the store-sim path: one local process pair, shared room state, plain HTTP tool calls.

## One command

```bash
npm run dev:local
```

That seeds local D1, starts the Worker on `:8787`, and the UI on `:3000`.

Open: http://127.0.0.1:3000

Copy the room code from the URL (`?room=ABCD`).

## Agent actions (plain curl = any agent that can fetch)

```bash
CODE=ABCD   # from the URL

curl -sS "http://127.0.0.1:8787/api/room/$CODE/tools/read_view"
curl -sS "http://127.0.0.1:8787/api/room/$CODE/tools/rotate_object?axis=y&degrees=30"
curl -sS "http://127.0.0.1:8787/api/room/$CODE/tools/zoom?level=1"
curl -sS "http://127.0.0.1:8787/api/room/$CODE/tools/publish_status?headline=Checking+for+a+handle"
curl -sS "http://127.0.0.1:8787/api/room/$CODE/tools/submit_guess?name=mug"
```

Watch the host screen: the object should rotate, the timeline should fill, status should appear.

Or:

```bash
npm run smoke:agent -- ABCD
```

## Why this works (and prod didn't)

| Layer | Local lab | Broken prod URL |
|-------|-----------|-----------------|
| Room brain | `wrangler dev --local` on your machine | Stale Worker missing `/api/room/*` |
| Host UI | Vite proxies `/api` → `:8787` | Pages UI calling that stale hostname |
| Secrets | None | Needs `CLOUDFLARE_API_TOKEN` to redeploy |

Same tool contract either way. Local just skips the deploy gate.

## MCP (optional)

Point a desktop MCP client at the room after `npm run dev:local`:

```json
{
  "mcpServers": {
    "objectle": {
      "command": "npx",
      "args": ["tsx", "worker/mcp-server.ts"],
      "env": {
        "WORKER_API": "http://127.0.0.1:8787/api",
        "ROOM_CODE": "ABCD"
      }
    }
  }
}
```

Or Streamable HTTP: `http://127.0.0.1:8787/mcp/ABCD`

## Later upgrades

1. Redeploy the real Worker when CF secrets exist (public Grok URLs work again).
2. Optional: Vite in-memory room (zero wrangler) if we want UI-only demos.
3. Tunnel (`cloudflared` / ngrok) if a remote agent must reach your laptop.
