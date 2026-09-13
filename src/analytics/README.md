# W. Analytics / Product Intelligence

## Ownership

Canonical owner: `src/analytics`

This subsystem exists as a first-class part of the EOT V1 architecture. The current Main Architecture Skeleton establishes its location, ownership boundary, public entrypoint, dependency direction, and fine-grained capability inventory. Deep implementation is intentionally deferred to a dedicated major-subsystem upgrade wave.

## Depends on

`A`, `C`, `E`, `M`, `V`

## Does not own

Learner truth; analytics is derived telemetry only.

## Fine-grained capability scope

The following items define the subsystem scope for later full-subsystem audits. Their presence here does **not** claim implementation completion.

- `W.activation` — Activation
- `W.lesson-start-finish` — Lesson start/finish
- `W.help-intervention` — Help/intervention telemetry
- `W.dropoff-return` — Drop-off/return
- `W.d1-d7` — D1/D7 retention
- `W.teacher-decision` — Teacher decision telemetry
- `W.support-outcome` — Support/outcome relation
- `W.latency` — Latency
- `W.cost` — AI/infra cost
- `W.crash` — Crash telemetry
- `W.learning-events` — Learning-event analytics

## Upgrade rule

When this subsystem becomes the active upgrade wave, audit **every** capability above before implementation. Advance every capability that can legally move in the same wave, group shared root causes, and run cross-subsystem regression before the wave is accepted.

Do not split the wave into serial micro-patches unless a genuine external dependency prevents completion.
