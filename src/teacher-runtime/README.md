# E. AI Teacher / Inner Tutor Runtime

## Status

Wave E first production pass: `COMPLETE_FIRST_PASS`.

E owns **HOW NOW**. D remains the authority for the canonical LessonPlan and therefore owns WHAT / WHY / WHEN. E cannot change the selected target, facet, objective, product mode, or time contract.

## Production flow

`D LessonPlan + A ProductContext + B domain graph + C learner projection + learner observation`
→ bounded `PedagogicalContextV1`
→ AI proposal or deterministic fallback
→ legal-action, target/facet, F-registry and evidence-affordance qualification
→ `QualifiedInnerTutorDecisionV1`
→ N Experience Contract
→ learner action
→ C observation/evidence path
→ next pedagogical decision point.

Normal `/daily-lesson` consumes this runtime. The model response is always a proposal. Invalid actions, target/facet drift, unregistered mechanisms and invalid evidence affordances are rejected before execution.

## Core invariants

- Every decision is bound to a canonical LessonPlan and decision-point event.
- Context is relevant and bounded; complete learner history is not sent blindly.
- Legal actions include NONE/WAIT/ASK/TEACH/REPAIR/PRACTICE/CHECK/RETURN_TO_TASK/STOP/EXIT.
- Help before failure does not manufacture failure evidence.
- Supported success routes toward fresh ownership; it is not independent proof in place.
- Failure can change registered representation/mechanism rather than repeat prose.
- Bottom-out exposure creates no capability claim.
- Same-context immediate work is not transfer or retention.
- Provider failure or invalid structured output uses a qualified deterministic fallback.
- Replaying the same decision point reuses the decision rather than calling the provider again.
- Provenance stores reason codes and source IDs, not learner-facing chain-of-thought.

## Scope boundary

E selects and schedules registered mechanisms. F owns the full mechanism/PCK repertoire and content. G owns fresh content generation; K owns measurement depth; L owns longitudinal policy learning; M owns full session/device lifecycle; N/O own final learner experience and rendering.

The executable audit is `src/teacher-runtime/waveEStatus.ts`; acceptance is `tests/domain/teacherRuntimeWaveE.test.cjs` and `scripts/run-teacher-runtime-wave-e-gate.cjs`.
