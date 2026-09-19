# Upstream attribution and license record

Sentinel Atlas uses the projects below as **reference material only** for a future satellite/geospatial evidence layer. No source code, binaries, spacecraft commands, telemetry datasets, or orbital datasets from these projects are bundled in this repository. Because no upstream code or data is copied, these projects are not dependencies of the current release. If a future adapter incorporates any upstream material, re-check the exact repository and version, preserve its license and notices, and update this file before release.

| Upstream | Creator / organization | Declared license | License / source | Current use |
|---|---|---|---|---|
| [SatNOGS](https://github.com/satnogs) | [Libre Space Foundation](https://libre.space/) / `@satnogs` | **No single organization-wide license verified.** Official repositories checked in the verification pass reported no repository-level license metadata; components may differ. | [SatNOGS organization](https://github.com/satnogs); current project group is linked from the official repositories. | Reference only; do not copy code or data without component-level review. |
| [OpenSatKit](https://github.com/OpenSatKit/OpenSatKit) | OpenSatKit organization; project materials credit David McComas | **Mixed component licenses; no single repository-wide license declared.** COSMOS, cFS, 42, and project code have separate terms. | [OpenSatKit license discussion](https://github.com/OpenSatKit/OpenSatKit/issues/116) | Reference only; do not copy components without reviewing each component’s terms. |
| [Orekit](https://github.com/CS-SI/Orekit) | CS GROUP / `@CS-SI` | Apache License 2.0 | [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0.html) | Reference only; Apache notices would be required if code were later incorporated. |
| [Gpredict](https://github.com/csete/gpredict) | Alexandru Csete (OZ9AEC) / `@csete` | GNU GPL v2.0 | [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html) | Reference only; no GPL code is included. |
| [Satvisor Data](https://github.com/satvisorcom/satvisor-data) | satvisor.com / `@satvisorcom` | **No declared license verified.** No LICENSE or COPYING file was found in the official repository during verification. | [Repository](https://github.com/satvisorcom/satvisor-data) | Reference only; do not copy code or datasets without permission or a verified license. |
| [Overwatch](https://github.com/confinia/overwatch) | `@confinia` | GNU AGPL v3.0 | [Repository LICENSE](https://github.com/confinia/overwatch/blob/main/LICENSE) | Reference only; no AGPL code is included. |
| [University Class Open Ground Station](https://github.com/uniclogs/uniclogs-hardware) | The University Class Open Ground Station / `@uniclogs` | GNU GPL v3.0 | [GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html) | Reference only; no GPL code or hardware artifacts are included. |
| [Raspi-GroundStation](https://github.com/BrianOMath/Raspi-GroundStation) | Brian O’Math / `@BrianOMath` | **Not verified in this attribution pass.** | [Repository](https://github.com/BrianOMath/Raspi-GroundStation) | Reference only; do not copy until its repository license and data terms are verified. |

## Verification notes

The verified entries were checked against official repository pages, repository license files or metadata, and official maintainer or organization pages on 2026-09-19. “Unknown,” “mixed,” or “not verified” is intentional: Sentinel Atlas does not infer permission from popularity, open-source wording, or the existence of a GitHub repository.

## Separation and safety

The satellite layer is limited to **observe → correlate → visualize → simulate**. Sentinel Atlas does not command spacecraft, control ground stations, infer actor location from an overhead pass, or treat geospatial correlation as attribution. Any future adapter must be read-only by default, explicitly authorized, rate-limited, provenance-preserving, and isolated from production credentials, databases, filesystems, and networks.
