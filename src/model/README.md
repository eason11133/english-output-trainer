# T. AI / Model Layer

## Ownership

Canonical owner: `src/model`

This subsystem exists as a first-class part of the EOT V1 architecture. The current Main Architecture Skeleton establishes its location, ownership boundary, public entrypoint, dependency direction, and fine-grained capability inventory. Deep implementation is intentionally deferred to a dedicated major-subsystem upgrade wave.

## Depends on

No upstream EOT product subsystem dependency at the ownership level.

## Does not own

Direct mastery/state writes.

## Fine-grained capability scope

The following items define the subsystem scope for later full-subsystem audits. Their presence here does **not** claim implementation completion.

- `T.provider-abstraction` — Model provider abstraction
- `T.structured-output` — Structured output
- `T.semantic-diagnosis` — Semantic diagnosis
- `T.content-generation` — Model-assisted content generation
- `T.fallback-model` — Fallback model
- `T.timeout-retry` — Timeout/retry
- `T.hallucination-guards` — Hallucination/grounding guards
- `T.prompt-versioning` — Prompt/schema versioning
- `T.cost-control` — Cost controls
- `T.rate-control` — Rate controls
- `T.model-evaluation` — Model evaluation hooks
- `T.deterministic-fallback` — Deterministic fallback where appropriate

## Upgrade rule

When this subsystem becomes the active upgrade wave, audit **every** capability above before implementation. Advance every capability that can legally move in the same wave, group shared root causes, and run cross-subsystem regression before the wave is accepted.

Do not split the wave into serial micro-patches unless a genuine external dependency prevents completion.
