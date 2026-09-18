# Sentinel Atlas

Sentinel Atlas is a defensive cyber-reasoning workspace and training roguelike. It combines evidence-grounded analysis, synthetic simulations, a Python research layer, provenance-backed evaluation records, and a bounded Cloudflare Worker superagent.

## Product experiences

Sentinel Atlas is organized around five connected experiences: **Autonomous Investigation Lab**, **Purple-Team Arena**, **AI Self-Training Laboratory**, **Adversarial / Deception Lab**, and **Researcher / Scenario Builder**. The shared loop is **Investigate → Attack/Defend → Observe → Explain → Evaluate → Learn → Generate a harder test**.

## Worker versions

**v1.0.0** is the previously working Worker baseline at commit `1dca5a8`. **v2.0.0** is the current labeled configuration and audit release; it preserves the same bounded safety model while enforcing one canonical Wrangler configuration.

## Deploy the correct Worker

The **only deployable Cloudflare Worker target** is:

```text
cloudflare/sentinel-atlas-superagent.js
```

The root `wrangler.jsonc` is configured for that Worker. From the repository root:

```bash
npx wrangler deploy
```

The expected Worker name is `sentinel-atlas-superagent`.

## Do not deploy the failed target

`docs/failed/wrangler.FAILED-node-build-do-not-deploy.jsonc.disabled` is a historical reference for the Node/Express application bundle at `dist/index.js`. **It failed to deploy as a Cloudflare Worker and must not be selected.** The Node application remains a separate WebDev runtime target.

## License and attribution

Original Sentinel Atlas project code is licensed under the MIT License; see `LICENSE`. Attribution and third-party license preservation guidance are in `NOTICE.md`. The project is authored by Aadi Shankar (`1243353366`) with agent-assisted implementation by Manus. Third-party dependencies retain their own licenses.

## Safety boundary

The superagent exposes bounded, read-only, synthetic-evidence tools. It does not execute code, download samples, grant permissions, access production systems, or learn permission bypasses.

## Self-host with Docker

The full Node application can run independently of WebDev and Cloudflare with Docker Compose. It uses a persistent MySQL volume for Sentinel Atlas data; the Cloudflare Worker is a separate optional deployment target.

```bash
cp .env.selfhost.example .env
# Edit .env and replace every required placeholder with unique secrets.
docker compose -f docker-compose.selfhost.yml up -d --build
```

Open `http://localhost:3000`. To stop the app without deleting the database volume, run `docker compose -f docker-compose.selfhost.yml down`. The stack runs database migrations on application startup. Put it behind an HTTPS reverse proxy before exposing it to the public internet, and keep `.env` out of Git.
