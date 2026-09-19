# Cloudflare deployment targets

This repository contains two intentionally separate runtimes.

The previously working Worker baseline is **v1.0.0** at commit `1dca5a8`. The current canonical deployment configuration is **v2.0.0**; it keeps the same bounded Worker behavior and removes ambiguous Wrangler targets.

| Label | Entry point | Runtime | Deploy status |
|---|---|---|---|
| **FAILED — do not deploy** | `dist/index.js` | Node/Express with MySQL, OAuth, and tRPC | **Failed to deploy as a Cloudflare Worker.** Retained only as a historical reference; do not select this config. |
| **Sentinel Atlas Superagent** | `cloudflare/sentinel-atlas-superagent.js` | Cloudflare Worker | Deploy this target with Wrangler or the Cloudflare dashboard. |

The root `wrangler.jsonc` points to the Worker target. The old Node-shaped configuration is retained only as `docs/failed/wrangler.FAILED-node-build-do-not-deploy.jsonc.disabled` and is explicitly marked as failed. Do not select or deploy it.

From the repository root, deploy the Worker with:

```bash
export CLOUDFLARE_ACCOUNT_ID="YOUR_ACCOUNT_ID"
export CLOUDFLARE_API_TOKEN="YOUR_WORKERS_EDIT_TOKEN"
npx wrangler deploy
```

The expected public URL is `https://sentinel-atlas-superagent.<your-workers-subdomain>.workers.dev`. The Worker exposes `/`, `/health`, `/tools`, and `POST /agent/run`. It is bounded, read-only, synthetic-evidence-only, and fail-closed. It does not replace Aadi’s Digital Lab or Corpora AI.

## Local Wrangler / Replit preview

The current Wrangler release requires **Node.js 22 or newer**. Do not downgrade Wrangler to accommodate a Node 20 image. In a Replit or local shell, use a Node 22 runtime and a preview-provided port:

```bash
nvm install 22
nvm use 22
node --version
npm install

# For a Worker project that declares a D1 binding:
npx wrangler d1 migrations apply <database-name> --local
PORT=${PORT:-8787} npx wrangler dev --local --port "$PORT"
```

The D1 command is intentionally conditional: this Sentinel Atlas repository’s full application uses MySQL/TiDB, while the bounded superagent Worker currently has no D1 binding. Do not create a duplicate D1 schema unless the Worker is explicitly being extended with a D1-backed adapter.

For an imported Replit Worker that already stores authentication state in D1, local startup does not require an additional application secret beyond the environment values declared by that Worker. Cloudflare Workers AI features may still require Cloudflare-hosted bindings and credentials; the local core Worker/API can run without those AI calls, but AI requests should fail clearly rather than silently pretending to be available. Never put Cloudflare tokens in client code or commit them to the repository.
