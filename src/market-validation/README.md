# Y. Market / Commercial Validation Readiness

## Ownership

Canonical owner: `src/market-validation`

This subsystem exists as a first-class part of the EOT V1 architecture. The current Main Architecture Skeleton establishes its location, ownership boundary, public entrypoint, dependency direction, and fine-grained capability inventory. Deep implementation is intentionally deferred to a dedicated major-subsystem upgrade wave.

## Depends on

`A`, `W`, `X`

## Does not own

Fabricated market outcomes or product-learning truth.

## Fine-grained capability scope

The following items define the subsystem scope for later full-subsystem audits. Their presence here does **not** claim implementation completion.

- `Y.target-cohorts` — Target-user cohorts
- `Y.problem-interviews` — Problem interview protocol
- `Y.concept-tests` — Concept tests
- `Y.prototype-tests` — Prototype tests
- `Y.pricing-wtp` — Pricing/WTP tests
- `Y.paid-beta` — Paid-beta readiness
- `Y.general-exam-wedge` — General vs Exam wedge test
- `Y.conversion` — Conversion measurement
- `Y.retention` — Market retention measurement
- `Y.learning-outcomes` — Real learning-outcome measurement
- `Y.real-evidence` — Real-market-evidence-only rule

## Upgrade rule

When this subsystem becomes the active upgrade wave, audit **every** capability above before implementation. Advance every capability that can legally move in the same wave, group shared root causes, and run cross-subsystem regression before the wave is accepted.

Do not split the wave into serial micro-patches unless a genuine external dependency prevents completion.
