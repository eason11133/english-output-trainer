# CURRENT STATUS

**Date:** 2026-10-03  
**Audited main:** `ea07dbaf212c3c8284c8759d0688279df55c08a8`  
**Purpose:** professor-facing snapshot of what is implemented now, what is partial, and what remains unfinished.

This file is the repository's **authoritative current status**. Dated rebuild contracts, closure reports, audit prompts, and older “current” documents are historical unless this file links to them.

## What EOT is now

EOT is an adaptive AI English-learning system for Taiwan's GSAT (學測) English exam.

It began from an output problem: English that could be recognized was not always available in translation or writing. The current system has expanded to all eight repository GSAT families:

**Vocabulary · Comprehensive · Contextual Fill · Discourse · Reading · Mixed · Translation · Writing**

The central engineering problem is not simply generating explanations. EOT tries to preserve a shared learner model, distinguish observation from admissible evidence, choose a justified teaching action, track how much support was used, and verify whether later performance is independent, transferable, and retained.

## Status language used here

- **Implemented / active:** executable code exists and is used by, or directly connected to, the current learner path.
- **First pass:** executable implementation exists, but coverage/calibration/device acceptance is incomplete.
- **Partial:** meaningful implementation exists, but important capability areas remain contract-only or unfinished.
- **Contract-only:** types/policy/boundaries exist without enough executable product behavior to call the capability implemented.
- **Unfinished:** not currently implemented to the level required for the product claim.

No status below is a claim of real-learner efficacy.

## Implemented / active core

| Area | Current status | What is real in current main |
| --- | --- | --- |
| Shared learner truth / model | **First-pass production core** | Immutable observations and canonical evidence; guards; provenance; uncertainty; competing hypotheses; assisted-vs-independent rules; transfer/delayed evidence; deterministic learner-state projection. |
| Curriculum / Outer Loop | **First-pass production core** | Ready/reinforcement/transfer/retention/blocked frontiers, Today planning, LessonPlan generation, time/priority signals, General/Exam allocation over shared learner truth. |
| AI Teacher / Inner Tutor | **First-pass production core** | Bounded pedagogical context, legal actions, mechanism selection, support policy, representation change, support fade, return/stop behavior, qualification/guards, provider fallback and decision replay semantics. |
| Teaching intelligence / Learning Blocks | **First-pass production core** | Registered teaching mechanisms, suitability/contraindication metadata, learner cognitive actions, support/replan/fade contracts, block runtime and evidence ceilings. |
| Assessment / evidence qualification | **Existing production core, still being audited** | Formal-integrity boundaries, measurement qualification, source/assistance conditions, semantic-assessment integration. |
| Lesson / Session Runtime | **Production core, ready for audit** | Session lifecycle, pause/resume, time budget, checkpoint/hydration, duplicate-action identity and continuity semantics. |
| Local persistence | **U1 first-pass foundation / partial overall** | Native Expo SQLite schema/transactions, migration, durable artifacts, local event/Teacher lineage, bounded reads, replay/idempotency. Server truth/sync are not implemented. |
| Contextual lookup | **First pass** | Phrase-first selection, word fallback, contextual sense resolution, zh-TW explanation, lookup history, lookup locking, and assistance contamination rules. |
| Authentic input / OCR | **Production core, ready for audit** | Direct/paste/image/PDF intake, immutable artifact, OCR/transcription path, learner/prompt/annotation/unknown-region separation, fail-closed uncertainty behavior. |
| AI / model layer | **Partial** | Server-owned provider calls, structured-output contracts, prompt/schema versions, timeout/retry ownership, proposal guards, model-run lineage and deterministic fallback boundary. |
| Eight-family GSAT practice path | **Implemented path; uneven teaching depth** | Promoted content/task contracts for all eight families, canonical bindings, family-specific diagnosis candidates, Teacher interaction and learner-action projection in Exam practice. |

## Eight GSAT families in current main

All eight families are represented in the current Exam/practice architecture. This does **not** mean every family has the same teaching-runtime depth.

| Family | Current implementation status |
| --- | --- |
| Vocabulary | Active Exam/practice path with contextual sense, collocation, form/retrieval diagnosis candidates and teaching-block projection. Broader vocabulary/chunk specialization remains partial. |
| Comprehensive | Active passage-local choice path with vocabulary/sense, phrase/collocation, grammar-fit, local-context and discourse-clue diagnosis candidates. |
| Contextual Fill | Active shared-pool path with syntax/POS, semantics, collocation, local/global context and pool-chain diagnosis candidates. |
| Discourse | Active sentence-insertion path with reference, cohesion, logical relation, sentence-function and before/after-fit diagnosis candidates. |
| Reading | Dedicated attempt/review runtime exists, including immutable submit, evidence-focused review, diagnosis probes and Teacher handoff. |
| Mixed | Active multi-part path with cross-source integration, evidence localization, paraphrase, retrieval/form and short-response diagnosis candidates. |
| Translation | Active learner-facing/Exam path and changed-context retranslation first pass. Most Translation-specialized teaching capabilities are still contract-only. |
| Writing | Active learner-facing/Exam path. Sentence realization, meaning encoding, revision, return-original and current fresh-writing transfer have first-pass implementations; planning, organization, cohesion, idea/reasoning and full writing evaluation remain incomplete. |

## What is currently being rebuilt / integrated

The repository contains functional learner-facing surfaces and first-pass UI/experience capabilities, but the current UI is **not the final learner experience**.

The active product milestone is to rebuild and integrate the learner-facing teaching UX on top of the existing learner-truth, Teacher, mechanism, and persistence architecture. The immediate design focus is the core Vocabulary teaching experience and the shared interaction language that later families can reuse.

The goal is not a cosmetic reskin. The interface must make the underlying adaptive behavior legible through learner action: diagnosis-specific teaching, different representations after failure, support fading, return to the original task, contextual lookup, and later independent re-checks.

## Partial / contract-heavy areas

- **Content generation:** fresh/changed-context tasks, semantic validity, alternatives, context relevance, validation and content packs have first-pass pieces; examples/counterexamples/distractors, broad difficulty/load control and content-safety depth are not complete.
- **Writing specialization:** several source/revision/return/fresh-transfer paths are first pass, while higher-level planning/organization/cohesion/reasoning/evaluation remain incomplete.
- **Translation specialization:** the changed-context retranslation path is first pass; most Translation-specific teaching/evaluation capability is still contract-only.
- **Vocabulary / chunks / grammar / reading specialization:** Reading has concrete runtime/diagnosis implementation and the shared Exam layer handles all families, but the full J subsystem has not completed a dedicated upgrade/audit.
- **Longitudinal learning:** reencounter/retention infrastructure exists, but broad scheduling/policy calibration is not finished.
- **Formal Exam product behavior:** formal-integrity policy exists, but full mock runtime/rendering and post-assessment teaching remain incomplete.
- **Model system:** production structured endpoints exist, but model-wide cost/rate governance, fallback-model routing and calibrated whole-product model evaluation are not complete.

## Unfinished

- server-authoritative learner truth;
- sync and cross-device continuity;
- backup/restore and cloud/account-level deletion completion;
- complete native process-death, AppState race, keyboard/IME, accessibility, permission and difficult OCR/PDF acceptance;
- full formal/mock GSAT product experience;
- complete specialized teaching repertoire across all eight families;
- broad validated content-generation coverage and difficulty/load calibration;
- real-learner efficacy validation and calibrated learning-outcome evidence;
- final learner-facing UX/visual design.

## Active learner path

The current first-level learner spine is:

```text
Today
Practice
My English
```

Learning flows then enter lesson/exam runtime, Teacher decisions, learner actions, evidence/persistence, and Result. Development/review routes remain under `/__dev__/*`.

Important authority rules in current main:

- General and Exam share learner truth.
- UI does not decide pedagogy.
- Lookup/help is not automatically capability evidence.
- Assisted success is not independent proof.
- Same-context immediate success is not transfer or delayed retention.
- Model output cannot directly write mastery.
- Source/OCR correction changes source truth, not English ability evidence.

## Next product milestone

**Learner-facing adaptive teaching UX rebuild and integration**, beginning with the core Vocabulary experience and the shared interaction model.

The milestone is successful when the existing backend behavior can be experienced coherently by a learner without exposing internal runtime/evidence terminology and without reducing the product to “wrong answer → AI explanation.”

## Where the status comes from

The primary implementation sources audited for this snapshot are:

- `src/architecture/registry.ts`
- `src/architecture/capabilityCatalog.ts`
- `src/learner-truth/`
- `src/curriculum/`
- `src/teacher-runtime/`
- `src/teaching/`
- `src/content/`
- `src/specializations/`
- `src/assessment/`
- `src/lesson-runtime/`
- `src/lookup/`
- `src/authentic-input/`
- `src/model/`
- `src/persistence/`
- `src/product-policy/exam/`
- `src/application/exam/`
- `app/exam-practice.tsx`
- `app/daily-lesson.tsx`

For the deeper A–Y ownership map, see [docs/architecture/EOT_V1_MAIN_ARCHITECTURE.md](docs/architecture/EOT_V1_MAIN_ARCHITECTURE.md).
