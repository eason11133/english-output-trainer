# S. Exam Product Policy

## Ownership

Canonical owner: `src/product-policy/exam`

This subsystem exists as a first-class part of the EOT V1 architecture. The current Main Architecture Skeleton establishes its location, ownership boundary, public entrypoint, dependency direction, and fine-grained capability inventory. Deep implementation is intentionally deferred to a dedicated major-subsystem upgrade wave.

## Depends on

`A`, `B`, `C`

## Does not own

Separate Exam learner identity/evidence.

## Fine-grained capability scope

The following items define the subsystem scope for later full-subsystem audits. Their presence here does **not** claim implementation completion.

- `S.scope` — Exam scope
- `S.deadline` — Deadline optimization
- `S.rubric` — Rubric optimization
- `S.time-pressure` — Time pressure
- `S.score-value` — Expected score value
- `S.weakness-parking` — Weakness parking
- `S.allocation` — Exam allocation
- `S.formal-integrity` — Formal assessment integrity
- `S.post-assessment-teaching` — Post-assessment teaching
- `S.mock-behavior` — Mock behavior
- `S.shared-truth` — Shared learner truth enforcement

## Upgrade rule

When this subsystem becomes the active upgrade wave, audit **every** capability above before implementation. Advance every capability that can legally move in the same wave, group shared root causes, and run cross-subsystem regression before the wave is accepted.

Do not split the wave into serial micro-patches unless a genuine external dependency prevents completion.
