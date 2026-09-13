# L. Longitudinal Learning System

## Ownership

Canonical owner: `src/longitudinal`

This subsystem exists as a first-class part of the EOT V1 architecture. The current Main Architecture Skeleton establishes its location, ownership boundary, public entrypoint, dependency direction, and fine-grained capability inventory. Deep implementation is intentionally deferred to a dedicated major-subsystem upgrade wave.

## Depends on

`C`, `K`

## Does not own

Canonical evidence mutation outside guarded evidence APIs.

## Fine-grained capability scope

The following items define the subsystem scope for later full-subsystem audits. Their presence here does **not** claim implementation completion.

- `L.reencounter-scheduler` — Re-encounter scheduler
- `L.spacing` — Spacing execution
- `L.delayed-verification` — Delayed verification
- `L.transfer-scheduling` — Transfer scheduling
- `L.recurrence-trend` — Recurring-error/capability trends
- `L.treatment-response` — Treatment-response history
- `L.retention-history` — Retention history
- `L.future-allocation-input` — Next-learning allocation inputs
- `L.stability-refresh` — Stability refresh
- `L.longitudinal-causality` — Future Today affected by prior outcomes

## Upgrade rule

When this subsystem becomes the active upgrade wave, audit **every** capability above before implementation. Advance every capability that can legally move in the same wave, group shared root causes, and run cross-subsystem regression before the wave is accepted.

Do not split the wave into serial micro-patches unless a genuine external dependency prevents completion.
