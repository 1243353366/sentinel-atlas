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

## Node 22 and local Worker preview

Sentinel Atlas targets Node.js 22 or newer. This matters for current Wrangler releases and avoids relying on an outdated CLI. For the separate Worker target, use a Node 22 shell and preview-provided port:

```bash
nvm install 22
nvm use 22
npx wrangler dev --local --port "${PORT:-8787}"
```

The full Sentinel Atlas application uses MySQL/TiDB, not D1. An imported Replit Worker that declares a D1 binding can initialize its local database with `npx wrangler d1 migrations apply <database-name> --local`. Workers AI may require Cloudflare-hosted bindings; local core/API routes should remain usable, while unavailable AI calls must fail explicitly.

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

On a fresh self-hosted database, apply the schema once before starting the app:

```bash
docker compose -f docker-compose.selfhost.yml run --rm app pnpm db:push
docker compose -f docker-compose.selfhost.yml up -d
```

The production container intentionally does **not** replay the full migration history on every boot; this avoids startup failure when a managed database already contains the tables. Open `http://localhost:3000`. To stop the app without deleting the database volume, run `docker compose -f docker-compose.selfhost.yml down`. Put it behind an HTTPS reverse proxy before exposing it to the public internet, and keep `.env` out of Git.


## Cyber Threat Observatory — analysis slice

The first observatory slice is an analysis-only evidence graph. It models `sources`, `observations`, `entities`, `relationships`, and `evidence` as separate normalized records, preserving provenance, confidence, verification status, and the distinction between facts, observations, inferences, and hypotheses. The dashboard uses a bounded synthetic fixture to demonstrate the graph without acquiring or executing malware.

Production and cyber-range concerns remain separate. The production application is not a range target, the current observatory graph has no real-network adapter, and no interface in this slice executes code, downloads samples, propagates, or reaches external infrastructure. Future ingestion adapters must be authorized, read-only by default, and isolated from production credentials, databases, filesystems, and networks.


The observatory also presents a bounded lifecycle: **detect → simulate → mitigate → authorized countermeasure → legal/policy review**. “What would happen?” is represented with non-routable synthetic targets and telemetry fixtures. Countermeasures require explicit authorization and human approval; the interface does not retaliate against real attackers or third-party infrastructure. Legal cards are operational reminders—not legal advice—and should be reviewed against written scope, rules of engagement, privacy/retention requirements, disclosure obligations, and counsel guidance.


## Satellite / geospatial evidence layer

The Observatory treats satellite and geospatial information as its own evidence class. The intended lifecycle is **observe → correlate → visualize → simulate**; it does not command spacecraft, control ground stations, or infer actor location from an overhead pass. Synthetic orbital windows can be correlated with a synthetic incident timeline, but correlation is not attribution.

Reference ecosystem for future adapters:

- [SatNOGS](https://github.com/satnogs) — open ground-station and telemetry ecosystem (`@satnogs`).
- [OpenSatKit](https://github.com/OpenSatKit/OpenSatKit) — spacecraft flight-software simulation reference (`@OpenSatKit`).
- [Orekit](https://github.com/CS-SI/Orekit) — orbital-dynamics and visibility reference (`@CS-SI`).
- [Gpredict](https://github.com/red5space/gpredict) — satellite tracking reference (`@red5space`).
- [Satvisor Data](https://github.com/satvisorcom/satvisor-data) — orbital-data reference (`@satvisorcom`).
- [Overwatch](https://github.com/confinia/overwatch) — satellite operations dashboard reference (`@confinia`).
- [University Class Open Ground Station](https://github.com/uniclogs/uniclogs-hardware) — educational ground-station reference (`@uniclogs`).
- [Raspi-GroundStation](https://github.com/BrianOMath/Raspi-GroundStation) — educational SDR/ground-station reference (`@BrianOMath`).

These are **reference-only upstreams** in this release: Sentinel Atlas does not copy their source code, bundle their data, or relicense their work. Any future adapter must preserve the upstream repository’s declared license, copyright notices, attribution requirements, and data terms in a separate dependency notice before code or data is incorporated.

The verified creator, organization, license, and uncertainty record is maintained in [`UPSTREAM-ATTRIBUTION.md`](UPSTREAM-ATTRIBUTION.md) and linked from [`NOTICE.md`](NOTICE.md).
