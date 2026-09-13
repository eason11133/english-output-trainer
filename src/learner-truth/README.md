# C. Canonical Learner Truth

## Ownership

Canonical owner: `src/learner-truth`

Wave C is now `COMPLETE_FIRST_PASS`.

This subsystem owns the rule:

> Immutable guarded evidence is truth; learner state is a projection.

It records broad learner observations, admits only guarded evidence into canonical truth, preserves provenance/uncertainty, and projects learner state from immutable events rather than storing mastery as mutable truth.

## Depends on

`B — English Domain / Capability Graph`

Canonical English targets are resolved when possible. Unresolved legacy targets are preserved with lower condition reliability instead of being silently rewritten.

## Does not own

- Product entitlement
- Curriculum allocation
- Teacher pedagogy
- Assessment policy depth
- Longitudinal scheduling
- UI copy

## Current first-pass behavior

- Original learner artifact remains immutable.
- OCR/source correction and learner intent correction are separate observations, not capability evidence.
- Learner actions are represented as immutable observations.
- Help/support requests are observations but explicitly cannot become capability evidence.
- Evidence candidates remain proposals until guard + canonical commit.
- Canonical commits add structured provenance, uncertainty, condition reliability, canonical target identity when resolvable, and dedup identity.
- Same event replay is idempotent.
- Different event IDs from the same observation are deduplicated.
- Conflicting reuse of an immutable event ID is rejected.
- Assisted production cannot become independent proof.
- Changed-context/delayed proof requires independent production.
- Negative evidence requires an actual target opportunity and sufficient confidence.
- UNKNOWN remains UNKNOWN instead of being forced into mastered/not-mastered.
- Projection preserves competing hypotheses and uncertainty.
- Learner model projection is derived from canonical events and can be rebuilt deterministically.

## Production integration

Normal `/daily-lesson` now commits through `canonicalLearnerTruthV1`.

The same authority records observations and evidence instead of letting the screen maintain private learner truth.

## Fine-grained capability scope

Wave C audited all 17 capabilities:

- `C.original-artifact`
- `C.observation`
- `C.evidence-candidate`
- `C.canonical-event`
- `C.provenance`
- `C.assistance-contamination`
- `C.independent-proof`
- `C.transfer-proof`
- `C.delayed-proof`
- `C.negative-evidence`
- `C.unknown`
- `C.hypotheses`
- `C.projection`
- `C.dedup`
- `C.idempotency`
- `C.uncertainty`
- `C.condition-reliability`

The executable audit lives in `waveCStatus.ts`.

## Deliberately not 100%

Wave C does not claim final production completion for areas that depend on later subsystems:

- server/cross-device event ledger and distributed idempotency → U
- measurement calibration / assessment qualification → K/X
- delayed/transfer scheduling → L
- hypothesis-aware Teacher actions → E
- learner-facing My English projection → N
- broader Writing/Translation/Language task coverage → H/I/J
