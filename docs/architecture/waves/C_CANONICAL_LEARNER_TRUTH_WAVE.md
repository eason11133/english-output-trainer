# Wave C — Canonical Learner Truth

Status: **COMPLETE_FIRST_PASS**

## Why this wave existed

EOT already had strong evidence-related pieces, but authority was split across:

- immutable Stage4 artifacts;
- raw runtime traces;
- V2 evidence history;
- V3 evidence candidates/events;
- learner projection;
- support/transfer/retention fields.

The central risk was that downstream systems could still mistake:

- a learner action for evidence;
- assisted success for independent control;
- one failure for a global capability gap;
- source correction for learning;
- repeated network writes for repeated proof;
- a projected learner state for mutable truth.

Wave C reconciles those concerns under one canonical learner-truth owner.

## Shared root causes addressed

1. Observation and evidence were not explicitly separated.
2. Evidence provenance existed as scattered fields, not a single lineage.
3. Deduplication and retry semantics were not canonical.
4. Projection did not formally expose uncertainty / competing hypotheses.
5. Negative evidence rules were weaker than positive evidence guards.
6. Wave B canonical target identity was not yet consumed by learner truth.

## Integrated upgrade

The production authority is now:

`Learner action / source event`
→ immutable `LearnerObservationV1`
→ optional `EvidenceCandidateV3`
→ evidence guard
→ enriched immutable canonical event
→ idempotent/deduplicated ledger
→ deterministic learner-state projection.

Normal Lesson uses `canonicalLearnerTruthV1` for both observation recording and evidence commit.

## Evidence semantics

- Help and support requests are observations, not failures.
- OCR correction and source-intent correction are observations, not learning evidence.
- Teacher/model support contaminates independence claims.
- Changed context and delayed context only support transfer/retention when production is independent.
- Negative evidence requires a real target opportunity.
- Low-confidence failure does not become negative capability proof.
- UNKNOWN can be retained without moving capability state.
- Multiple explanations can remain live simultaneously.
- Repeated recent negative evidence can mark an advanced capability fragile without deleting historic proof.

## Completion scale

Wave C uses the evidence-gated percentage scale:

- 0 — not implemented
- 25 — formal ownership/contract only
- 50 — core implementation exists
- 75 — canonical integration + automated positive/negative behavior
- 90 — real production consumer + cross-system regression
- 100 — complete for current product scope with no required later-subsystem dependency

No Wave C capability is marked 100 because several intentionally depend on K/L/U/X/E/N.

## Founder manual acceptance

Not required.

This is primarily canonical backend/domain behavior. Local automated acceptance is sufficient for this wave.

Next: **D — Curriculum / Outer Loop**
