# Deployment Guide

This document explains how to deploy Objectle to production.

## Prerequisites

- Cloudflare account
- GitHub account (for automatic deployments)
- Node.js 18+ installed locally
- Wrangler CLI installed (`npm install -g wrangler`)

## Step 1: Set Up Cloudflare D1 Database

1. Create a D1 database:
```bash
wrangler d1 create objectle-db
```

2. Note the `database_id` from the output.

3. Update `wrangler.jsonc` with your database ID:
```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "objectle-db",
      "database_id": "YOUR_DATABASE_ID_HERE"
    }
  ]
}
```

4. Run the schema migration:
```bash
wrangler d1 execute objectle-db --remote --file=./schema.sql
```

## Step 2: Deploy the Worker

1. Authenticate with Cloudflare:
```bash
wrangler login
```

2. Deploy the Worker:
```bash
npm run worker:deploy
```

   This deploy also creates the `RoomDO` Durable Object (declared under `durable_objects` and `migrations` in `wrangler.jsonc`). It is SQLite-backed, so it works on the free plan. Rooms are the bridge between agents and the host screen: without this deploy, tool calls have nowhere to land and nothing moves on screen.

3. Note the deployed Worker URL (e.g., `https://objectle-worker.yourusername.workers.dev`)

4. Smoke-test a room:
```bash
curl https://objectle-worker.yourusername.workers.dev/api/room/TEST
curl "https://objectle-worker.yourusername.workers.dev/api/room/TEST/tools/rotate_object?axis=y&degrees=30"
```

## Step 3: Set Up Cloudflare Pages

### Option A: GitHub Actions (Recommended)

1. Create a Cloudflare API Token:
   - Go to https://dash.cloudflare.com/profile/api-tokens
   - Create token with "Cloudflare Pages" template
   - Copy the token

2. Add GitHub secrets:
   - Go to your repo → Settings → Secrets and variables → Actions
   - Add these secrets:
     - `CLOUDFLARE_API_TOKEN`: Your API token
     - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID (found in dashboard URL)

3. Create a Cloudflare Pages project:
   - Go to Cloudflare Dashboard → Pages
   - Create a new project named "objectle"
   - Choose "Direct Upload" (GitHub Actions will handle builds)

4. Push to main branch. GitHub Actions will automatically build and deploy.

### Option B: Manual Deployment

1. Build the frontend:
```bash
npm run build
```

2. Deploy to Pages:
```bash
npx wrangler pages deploy dist --project-name=objectle
```

## Step 4: Configure Environment Variables

In Cloudflare Pages settings:

1. Go to your Pages project → Settings → Environment variables
2. Add these variables (for production):
   - `WORKER_API`: Your deployed Worker URL + `/api` (e.g., `https://objectle-worker.yourusername.workers.dev/api`)

## Step 5: Configure Custom Domain (Optional)

1. Go to Cloudflare Pages → Your project → Custom domains
2. Add your domain (e.g., `objectle.yourdomain.com`)
3. Follow DNS setup instructions

Your site will be available at:
- Default: `https://marvelus-tech.github.io/objectle/`
- Custom: `https://objectle.yourdomain.com`

## Step 6: Set Up MCP Server for Agents (Optional)

For AI agents to play via MCP:

1. The MCP server runs locally on each agent's machine (not deployed)
2. Agents configure their MCP client with:

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

3. Agents must have the repo cloned locally for the MCP server files

## Monitoring

### Worker Logs
```bash
wrangler tail
```

### D1 Database Query
```bash
wrangler d1 execute objectle-db --remote --command="SELECT * FROM daily_challenges LIMIT 5"
```

### Pages Deployment Logs
- View in Cloudflare Dashboard → Pages → Your project → Deployments

## Updating

### Update Worker
```bash
npm run worker:deploy
```

### Update Frontend
Push to main branch (if using GitHub Actions) or run:
```bash
npm run build
npx wrangler pages deploy dist --project-name=objectle
```

### Add New Daily Objects
```bash
wrangler d1 execute objectle-db --remote --command="INSERT INTO daily_challenges (date, object_key, object_name, category, material, scale) VALUES ('2026-09-10', 'daily/obj_table_001', 'table', 'furniture', 'wood', 'large')"
```

## Troubleshooting

**Q: Worker returns 500 error**
A: Check D1 database is set up and `database_id` in `wrangler.jsonc` is correct. View logs with `wrangler tail`.

**Q: Frontend shows "Failed to load daily challenge"**
A: Verify `WORKER_API` environment variable is set correctly in Pages settings and points to your deployed Worker.

**Q: An agent is playing but nothing moves on the host screen**
A: Check that the host screen and the agent use the same room code (the code in the page URL `?room=` must match the code in the tool URLs / MCP URL). Then confirm the Worker was deployed after the Durable Object was added: `curl <worker>/api/room/<CODE>` should return the room manual, not 404. The Tool Timeline header shows "Offline (local mode)" when the page cannot reach the Worker.

**Q: D1 commands fail**
A: Ensure you are authenticated (`wrangler login`) and have permissions for the account.

**Q: GitHub Actions deployment fails**
A: Check that `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets are set correctly. Verify API token has "Cloudflare Pages" permissions.

**Q: Custom domain not working**
A: DNS propagation can take up to 24 hours. Verify DNS records are correct in Cloudflare DNS settings.

## Security Notes

- D1 database is private (only accessible via Worker)
- Worker implements CORS (configured for Pages domain)
- Rate limiting prevents abuse (can enhance with Durable Objects in production)
- API tokens and account IDs should be kept secret (use GitHub secrets, never commit)

## Costs

Cloudflare Free Tier includes:
- Workers: 100,000 requests/day
- D1: 5 GB storage, 5 million reads/day
- Pages: Unlimited static requests

For higher traffic, upgrade to Cloudflare paid plans.

## Next Steps

- Add more daily objects (see README "Path to 100")
- Set up R2 for 3D model storage
- Implement Durable Objects for advanced rate limiting
- Add analytics (Cloudflare Web Analytics)
- Set up alerts for errors (Cloudflare Workers Analytics)

Your Objectle instance is now live!
