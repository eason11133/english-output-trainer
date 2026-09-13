# F. Teaching Intelligence / PCK / Mechanisms

## Ownership

Canonical owner: `src/teaching`

This subsystem exists as a first-class part of the EOT V1 architecture. The current Main Architecture Skeleton establishes its location, ownership boundary, public entrypoint, dependency direction, and fine-grained capability inventory. Deep implementation is intentionally deferred to a dedicated major-subsystem upgrade wave.

## Depends on

`B`, `E`

## Does not own

Curriculum priority or learner-state ownership.

## Fine-grained capability scope

The following items define the subsystem scope for later full-subsystem audits. Their presence here does **not** claim implementation completion.

- `F.mode-registry` — Teaching Mode registry
- `F.pck-metadata` — Pedagogical content knowledge metadata
- `F.entry-conditions` — Entry conditions
- `F.inappropriate-cases` — Inappropriate-use rules
- `F.teaching-moves` — Teaching Moves
- `F.cognitive-action` — Required learner cognitive action
- `F.content-binding` — Content bindings
- `F.reveal-rules` — Reveal rules
- `F.evaluation-scope` — Evaluation scope
- `F.evidence-implication` — Evidence implications
- `F.accessibility-contract` — Mechanism accessibility contract
- `F.primitive-select` — Select primitive
- `F.primitive-match` — Match primitive
- `F.primitive-order` — Order primitive
- `F.primitive-mark` — Mark primitive
- `F.primitive-complete` — Complete primitive
- `F.primitive-recall` — Recall/type primitive
- `F.primitive-construct` — Construct primitive
- `F.primitive-produce` — Produce primitive
- `F.primitive-repair` — Repair primitive
- `F.primitive-compare` — Compare primitive
- `F.primitive-explain` — Explain primitive
- `F.primitive-plan` — Plan primitive
- `F.primitive-full-task` — Full-task primitive

## Upgrade rule

When this subsystem becomes the active upgrade wave, audit **every** capability above before implementation. Advance every capability that can legally move in the same wave, group shared root causes, and run cross-subsystem regression before the wave is accepted.

Do not split the wave into serial micro-patches unless a genuine external dependency prevents completion.
