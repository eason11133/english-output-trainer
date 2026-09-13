# X. Evaluation / QA / Research Harness

## Ownership

Canonical owner: `src/evaluation`

This subsystem exists as a first-class part of the EOT V1 architecture. The current Main Architecture Skeleton establishes its location, ownership boundary, public entrypoint, dependency direction, and fine-grained capability inventory. Deep implementation is intentionally deferred to a dedicated major-subsystem upgrade wave.

## Depends on

`B`, `C`, `D`, `E`, `F`, `G`, `H`, `I`, `J`, `K`, `L`, `M`, `N`, `O`, `V`

## Does not own

Production product authority; evaluation observes and gates.

## Fine-grained capability scope

The following items define the subsystem scope for later full-subsystem audits. Their presence here does **not** claim implementation completion.

- `X.architecture-gates` — Architecture gates
- `X.pedagogical-invariants` — Pedagogical invariants
- `X.scenario-harness` — Scenario harness
- `X.teacher-regression` — Teacher regression corpus
- `X.writing-eval` — Writing evaluation
- `X.translation-eval` — Translation evaluation
- `X.general-exam-eval` — General/Exam differentiation evaluation
- `X.longitudinal-sim` — Longitudinal simulation
- `X.visual-acceptance` — Visual acceptance
- `X.device-acceptance` — Device acceptance
- `X.model-eval` — Model evaluation
- `X.time-architecture-stress` — 5/10/20/30/60 stress tests
- `X.regression-suite` — Cross-subsystem regression suite

## Upgrade rule

When this subsystem becomes the active upgrade wave, audit **every** capability above before implementation. Advance every capability that can legally move in the same wave, group shared root causes, and run cross-subsystem regression before the wave is accepted.

Do not split the wave into serial micro-patches unless a genuine external dependency prevents completion.
