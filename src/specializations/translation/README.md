# I. Translation Teacher Runtime

> Current overall status: **PARTIAL / READY_FOR_AUDIT**. One Translation-specific capability is currently FIRST_PASS; the rest of the specialized capability set remains contract-only.  
> Repository-wide status: [../../../CURRENT_STATUS.md](../../../CURRENT_STATUS.md).

## Ownership

Canonical owner: `src/specializations/translation`.

I owns Translation-specific source/learner-work semantics. It does not own a separate learner model, curriculum policy, teaching-mechanism registry, content-generation authority, evidence admission, or Exam scoring authority.

## What is implemented now

Translation participates in the current shared Exam/learner path through canonical task bindings, semantic assessment, family-specific diagnosis, Teacher decisions, learner-authored repair, and the shared evidence/runtime path.

The Translation-specific capability currently marked **FIRST_PASS** is:

- `I.changed-context-retranslation` — a separately delivered changed-context retranslation opportunity can be carried into the shared G/K/C verification path.

Current production-facing integration is visible in:

- `src/content/examBetaBank.ts`
- `src/content/examCanonicalBindings.ts`
- `src/application/exam/examSubmissionAdapter.ts`
- `src/application/exam/examFamilyDiagnosis.ts`
- `src/specializations/translation/freshTaskCoordinator.ts`
- `src/specializations/translation/freshAssessmentBridge.ts`

## Contract-only / incomplete specialized capabilities

The following Translation-specific capabilities remain contract-only in current main:

- source-meaning decomposition;
- meaning fidelity;
- lexical retrieval;
- collocation;
- verb patterns;
- grammar/form;
- sentence-role mapping;
- L1/L2 contrast;
- restructuring;
- guided reconstruction;
- alternative valid realizations;
- naturalness/precision;
- Exam alignment;
- Translation-specific evaluation.

The shared Teacher/Teaching-Block layer can still teach some lexical, grammar, reconstruction and repair needs encountered inside Translation. That does **not** make the full Translation specialization complete.

## Authority boundary

- WHAT / WHY / WHEN → Curriculum (D)
- HOW NOW → AI Teacher (E)
- teaching mechanism / support policy → F
- fresh/changed-context content → G
- evidence admission / transfer / delayed proof → C/K
- Exam scoring policy → S/K

Translation preserves source meaning and learner authorship/provenance; it must not replace the learner's translation with model-authored text and then treat that text as learner evidence.

## Why this is not complete

Changed-context retranslation has a real first-pass implementation, but most Translation-specific diagnosis/teaching/evaluation depth is still represented by contracts and shared mechanisms rather than a complete dedicated runtime. Coverage, measurement depth and native learner acceptance remain unfinished.
