# Sentinel Atlas Game Plan

## Product loop

Investigate → Map → Hypothesize → Defend → Test → Explain → Quiz → Unlock.

## Five product experiences

1. **Autonomous Investigation Lab** — objective-driven, evidence-backed investigation records with explainable actions.
2. **Purple-Team Arena** — bounded red/blue exercises, telemetry comparison, detection-gap analysis, and evidence-first scoring.
3. **AI Self-Training Laboratory** — evaluation records, failure analysis, regression candidates, and human-gated promotion.
4. **Adversarial / Deception Lab** — synthetic tripwires, fail-closed containment, safe snapshots, and prompt-injection resistance tests.
5. **Researcher / Scenario Builder** — future authoring surface that compiles objectives, fixtures, telemetry, quizzes, and regression cases.

All five experiences share the same provenance chain. No experience executes live samples, contacts real command-and-control, captures credentials, changes permissions, or promotes model behavior without human review.

## Implemented slices

1. Evidence-grounded reasoning and defensive simulation fixtures.
2. Fail-closed zombie quarantine for inert failure metadata.
3. Evidence connection game with deterministic scoring and quiz evaluation.
4. XP, level progression, unlock tree, and provenance-backed evaluation records.
5. Safety boundary: no code execution, malware handling, credential capture, real network access, or autonomous permission changes.

## Verification criteria

- `pnpm check` passes.
- `pnpm build` passes.
- `pnpm test` passes.
- UI visibly exposes map, quiz, mitigation, XP, and fail-closed boundaries.
- All learning records remain pending until regression validation and human approval.
