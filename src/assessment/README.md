# K. Assessment / Measurement

## Ownership

Canonical owner: `src/assessment`

Wave K now has a first-pass measurement qualification layer. K determines what a performance can legitimately prove under the delivered task and production conditions. C remains the canonical evidence admission / learner-truth owner; K does not write mastery or learner state directly.

## Depends on

`B`, `C`

## Does not own

Teaching hints inside formal assessment or product identity.

## Fine-grained capability scope

The following items define the subsystem scope for later full-subsystem audits. Their presence here does **not** claim implementation completion.

- `K.diagnostic` — Diagnostic measurement
- `K.practice-evidence` — Practice evidence
- `K.fresh-assessment` — Fresh assessment
- `K.formal-exam` — Formal Exam assessment
- `K.answer-reveal` — Answer reveal policy
- `K.lookup-lock` — Assessment lookup locking
- `K.unsupported-production` — Unsupported production
- `K.same-vs-fresh` — Same-item vs fresh-item distinction
- `K.changed-context-transfer` — Changed-context transfer
- `K.delayed-probe` — Delayed probe
- `K.retention` — Retention/stability measurement
- `K.scoring-rubric` — Scoring/rubric alignment
- `K.measurement-uncertainty` — Measurement uncertainty
- `K.assessment-separation` — Assessment/teaching separation

## Upgrade rule

When this subsystem becomes the active upgrade wave, audit **every** capability above before implementation. Advance every capability that can legally move in the same wave, group shared root causes, and run cross-subsystem regression before the wave is accepted.

Do not split the wave into serial micro-patches unless a genuine external dependency prevents completion.

## Current first-pass measurement invariants

- Fresh assessment requires unsupported production and validated new-content delivery provenance.
- Changed-context transfer requires a validated changed-context delivery and a genuinely different context identity.
- `contextNovelty` alone is never sufficient to prove transfer or delayed retention.
- Low-confidence or mixed/unknown measurement abstains instead of forcing a capability proof.
- Delayed qualification requires a separate session and minimum elapsed-time provenance, but production scheduling/delivery remains a G/L dependency.
- Formal Exam integrity is fail-closed at the contract level (no hint/reveal/lookup/model/mid-attempt teaching), but full S/P/N runtime enforcement is not yet claimed.
- Exam-specific scoring/rubric alignment remains contract-only and belongs with S plus H/I analytic observations.
