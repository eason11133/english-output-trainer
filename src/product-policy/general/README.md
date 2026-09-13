# R. General Product Policy

## Ownership

Canonical owner: `src/product-policy/general`

This subsystem exists as a first-class part of the EOT V1 architecture. The current Main Architecture Skeleton establishes its location, ownership boundary, public entrypoint, dependency direction, and fine-grained capability inventory. Deep implementation is intentionally deferred to a dedicated major-subsystem upgrade wave.

## Depends on

`A`, `B`, `C`

## Does not own

Separate General learner identity/evidence.

## Fine-grained capability scope

The following items define the subsystem scope for later full-subsystem audits. Their presence here does **not** claim implementation completion.

- `R.durable-use` — Durable usable-English objective
- `R.coverage` — Broad-domain coverage
- `R.transfer` — General transfer priority
- `R.retention` — General retention priority
- `R.real-use` — Real-use integration
- `R.allocation` — General allocation policy
- `R.frontier` — General frontier selection
- `R.shared-truth` — Shared learner truth enforcement

## Upgrade rule

When this subsystem becomes the active upgrade wave, audit **every** capability above before implementation. Advance every capability that can legally move in the same wave, group shared root causes, and run cross-subsystem regression before the wave is accepted.

Do not split the wave into serial micro-patches unless a genuine external dependency prevents completion.
