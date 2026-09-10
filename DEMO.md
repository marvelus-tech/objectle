# Objectle demo (Foresight-style) — for friends & prospects

**Goal:** agent moves the 3D object on the open tab. No Cloudflare deploy required.

## 60-second host script

1. Open the game (local or Pages):
   ```bash
   npm run dev:local
   # or production Pages once this PR is on main:
   # https://marvelus-tech.github.io/objectle/?demo=1
   ```
2. Keep that tab visible on the big screen.
3. Click **Prove it: rotate 45°** on the Demo strip — the object should turn.
4. Click **Agent tools** → **Rotate Y+30** / **Read view**.
5. Click **Copy agent prompt** and paste into Grok / Claude / ChatGPT.

## What prospects should see

| Action | On-screen proof |
|--------|-----------------|
| `rotate_object` | Object turns on the neon stage |
| `read_view` | Text description + tool log row |
| `publish_status` | Stage caption / status line updates |
| `submit_guess` | Guess history + facet chips |

## Why this matches Foresight

- Tools live **on the page** (`document.modelContext` + polyfill).
- Agent panel is the same-tab fallback when the browser has no WebMCP host.
- Worker / room URLs are optional sync — demos never wait on Cloudflare secrets.

## Optional: live shared room

When `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` are set and the Worker is redeployed, the same tools also work via:

`https://objectle-worker-demo.marvelus.workers.dev/api/room/ABCD/tools/...`

Until then, same-tab tools are the demo path.
