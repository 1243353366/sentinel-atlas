# Sentinel Atlas attribution and notices

## Project attribution

Sentinel Atlas is a project of **Aadi Shankar** (GitHub account `1243353366`) with agent-assisted implementation by **Manus**. The public repository contains the defensive reasoning workspace, synthetic training game, Python research layer, and Cloudflare Worker superagent source.

The original Sentinel Atlas project code is offered under the MIT License in `LICENSE`.

## Third-party components

Third-party dependencies are not relicensed by this repository. Their copyright notices and license terms remain governed by their respective packages and upstream projects. Before redistribution, generate and review the dependency notices for the exact lockfile using the package managers and license terms applicable to the release.

The optional Release Trust Center queries the public [CIRCL Hashlookup](https://www.circl.lu/services/hashlookup/) service by SHA-256 only after explicit user consent. Sentinel Atlas sends no file bytes, filename, local path, or API credential. CIRCL data remains governed by its upstream sources and service terms; a match or absence is shown as context rather than an antivirus verdict.

Tagged release archives use [GitHub artifact attestations](https://docs.github.com/actions/security-for-github-actions/using-artifact-attestations/using-artifact-attestations-to-establish-provenance-for-builds) and the Sigstore public-good infrastructure available to public repositories. An attestation establishes artifact identity and workflow provenance; it does not guarantee that an artifact is vulnerability-free or non-malicious.

Satellite and geospatial projects referenced for the Observatory are listed in [`UPSTREAM-ATTRIBUTION.md`](UPSTREAM-ATTRIBUTION.md). They are reference-only in this release; no upstream source code or data is bundled. The record preserves verified creator, organization, license, and uncertainty notes, and requires component-level review before any future incorporation.

The repository does not include malware samples, offensive payloads, credentials, or production access tokens. The Worker target is bounded, read-only, synthetic-evidence-only, and fail-closed.
