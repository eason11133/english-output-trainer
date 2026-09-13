# G. Content / Task / Context Generation

## Ownership

Canonical owner: `src/content`

This subsystem exists as a first-class part of the EOT V1 architecture. The current Main Architecture Skeleton establishes its location, ownership boundary, public entrypoint, dependency direction, and fine-grained capability inventory. Deep implementation is intentionally deferred to a dedicated major-subsystem upgrade wave.

## Depends on

`B`, `C`, `T`

## Does not own

Learner mastery/evidence state.

## Fine-grained capability scope

The following items define the subsystem scope for later full-subsystem audits. Their presence here does **not** claim implementation completion.

- `G.prompt-generation` — Prompt generation
- `G.examples` — Examples
- `G.counterexamples` — Counterexamples
- `G.distractors` — Distractors
- `G.fresh-task` — Fresh tasks
- `G.changed-context` — Changed-context tasks
- `G.difficulty` — Difficulty control
- `G.load` — Cognitive load control
- `G.semantic-validity` — Semantic validity
- `G.valid-alternatives` — Valid alternative handling
- `G.content-safety` — Content safety
- `G.context-relevance` — Context relevance
- `G.generated-validation` — Generated-content validation
- `G.content-packs` — Content/material packs

## Upgrade rule

When this subsystem becomes the active upgrade wave, audit **every** capability above before implementation. Advance every capability that can legally move in the same wave, group shared root causes, and run cross-subsystem regression before the wave is accepted.

Do not split the wave into serial micro-patches unless a genuine external dependency prevents completion.
