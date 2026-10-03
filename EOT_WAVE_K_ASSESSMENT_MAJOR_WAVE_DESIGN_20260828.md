> **HISTORICAL — superseded by [CURRENT_STATUS.md](CURRENT_STATUS.md).**  
> Preserved as development history. Do not use this file as current product/status authority.

# EOT Wave K — Assessment / Measurement Major-Wave Design

Date: 2026-08-28
Status: READY FOR INDEPENDENT AUDIT AFTER CROSS-TRACK DATA RECONCILIATION

## 1. Authority

K answers one question:

> Given this actual performance, delivered task, support/exposure conditions, context provenance and timing, what may this performance legitimately prove?

K does not choose the curriculum target (D), choose the teaching action (E), select the mechanism/support (F), generate the task (G), interpret Writing/Translation pedagogy (H/I), write learner mastery (C), schedule the future probe (L), or define Exam policy/scoring (S).

C remains the final canonical evidence admission and learner-truth owner. K qualifies measurement semantics used by that admission.

## 2. Shared root cause

Before Wave K, `contextNovelty` and other evidence metadata carried too much trust. A path could look internally consistent while lacking a genuinely delivered fresh/changed-context task.

Wave K therefore makes measurement provenance first class inside `TaskContract`.

A measurement opportunity is explicitly one of:

- SOURCE_WORK
- VALIDATED_FRESH
- VALIDATED_CHANGED_CONTEXT
- DELAYED_PROBE

A string such as `CHANGED_CONTEXT` does not by itself prove transfer.

## 3. Measurement proof classes

- NO_CAPABILITY_PROOF
- ASSISTED_PRACTICE
- LOCAL_INDEPENDENT
- FRESH_INDEPENDENT
- CHANGED_CONTEXT_TRANSFER
- DELAYED_RETENTION

These classes are measurement qualification, not learner state. C/L projections may use admitted evidence later.

## 4. Fresh assessment

Fresh independent proof requires all of:

- Task purpose DIAGNOSTIC
- Candidate and TaskContract are SAME_CONTEXT
- unsupported/open production under canonical production conditions
- no exposed task support
- validated delivery provenance
- task id matches the delivered task
- task content identity differs from source content identity
- nonempty validator/delivery provenance

Merely clearing an editor or changing a task id is insufficient.

## 5. Changed-context transfer

Transfer requires all of:

- Task purpose TRANSFER
- candidate and task context are CHANGED_CONTEXT
- unsupported/open production
- validated changed-context delivery
- new content identity
- task id matches delivery
- source and task context identities genuinely differ

H/I/G may provide the task. K decides whether its provenance is sufficient for a transfer claim.

## 6. Delayed retention

K has a bounded qualification contract for delayed proof:

- RETENTION task purpose
- DELAYED_CONTEXT
- unsupported/open production
- validated delayed probe provenance
- prior proof reference/time
- different attempt session
- configured minimum delay elapsed

This remains CONTRACT_ONLY at the product level because G/L do not yet deliver/schedule real delayed probes end to end.

## 7. Measurement uncertainty

K abstains instead of forcing proof when measurement is materially uncertain.

Current material-abstention cases include:

- LOW classification confidence
- MIXED evidence polarity
- UNKNOWN evidence polarity

Competing explanations are preserved as bounded warnings rather than silently erased.

## 8. Formal Exam integrity

Formal assessment has a fail-closed integrity contract:

- hints unavailable
- answer reveal unavailable
- lookup unavailable
- model answer not visible
- no mid-attempt teaching
- explicit integrity reference

The contract exists, but production enforcement across S/P/N is not claimed complete yet.

## 9. Scoring and rubrics

K does not invent a universal EOT Writing/Translation score.

H/I may provide analytic observations. S provides exam-specific rubric/scoring policy. K later combines those under a measurement contract.

This remains CONTRACT_ONLY.

## 10. Capability status

FIRST_PASS:
- K.diagnostic
- K.practice-evidence
- K.fresh-assessment
- K.unsupported-production
- K.same-vs-fresh
- K.changed-context-transfer
- K.measurement-uncertainty
- K.assessment-separation

CONTRACT_ONLY:
- K.formal-exam
- K.answer-reveal
- K.lookup-lock
- K.delayed-probe
- K.retention
- K.scoring-rubric

## 11. Production integration

`guardEvidenceCandidateV3` now calls K measurement qualification for capability candidates. Therefore the K rules are not an isolated test-only engine.

In the H/G/I branch, the daily TaskContract is also projected with measurement provenance from the actual delivered Writing/Translation fresh task. Source work receives SOURCE_WORK provenance.

This integration must still be semantically reconciled with the parallel Data branch before live installation.

## 12. Acceptance attacks

The K gate includes adversarial checks for:

- unsupported source production vs fresh production
- assisted practice
- DIAGNOSTIC without delivered fresh task
- exposed model despite candidate claiming independence
- CHANGED_CONTEXT on non-transfer purpose
- validated changed-context transfer
- unchanged context identity
- low/mixed uncertainty
- delayed proof in the same session
- delayed proof before minimum time
- canonical C/K guard rejection when changed-context delivery provenance is missing
- formal assessment hint/reveal/lookup/model/mid-teaching contamination

Green diagnostics are not proof of product readiness. The final branch requires live Expo typecheck/lint and independent adversarial audit after Data reconciliation.
