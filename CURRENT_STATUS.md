# CURRENT STATUS

**Date:** 2026-10-03  
**Audited implementation baseline:** `ea07dbaf212c3c8284c8759d0688279df55c08a8`  
**Documentation cleanup on main:** begun at `a3ac30c3a2bd2d4694e8c615d83b7b64b0219b77`  
**Purpose:** professor-facing snapshot of what is implemented now, what is first-pass/partial, and what remains unfinished.

This file is the repository's **authoritative current status**. Dated rebuild contracts, closure reports, audit prompts, older “current” documents, and legacy visual contracts are historical unless this file explicitly adopts them.

The implementation baseline above is the latest behavior-changing commit before the professor-facing documentation cleanup. Documentation-only commits after that SHA do not imply new product behavior.

## What EOT is now

EOT is an adaptive AI English-learning system for Taiwan's GSAT (學測) English exam.

It began from an output problem: English that could be recognized was not always available in translation or writing. The current system has expanded to all eight repository GSAT families:

**Vocabulary · Comprehensive · Contextual Fill · Discourse · Reading · Mixed · Translation · Writing**

The central engineering problem is not simply generating explanations. EOT tries to preserve a shared learner model, distinguish observation from admissible evidence, choose a justified teaching action, track how much support was used, and verify whether later performance is independent, transferable, and retained.

## How to read status labels

- **Implemented / active path:** executable code exists and is used by, or directly connected to, a current learner path.
- **First pass:** executable implementation exists, but coverage, calibration, integration, or device acceptance is incomplete.
- **Partial:** meaningful implementation exists, but important capabilities remain contract-only or unfinished.
- **Contract-only:** types, policy, or authority boundaries exist without enough executable product behavior to call the capability implemented.
- **Unfinished:** not implemented to the level needed for the product claim.

The architecture registry also uses the label `PRODUCTION_CORE`. In this repository that means “canonical executable subsystem/owner,” **not** “the product is production-ready.”

No status below is a claim of real-learner efficacy.

## Implemented / active core

| Area | Current status | What is real in current main |
| --- | --- | --- |
| Shared learner truth / model | **First pass** | Immutable observations and canonical evidence; evidence guards; provenance; uncertainty; competing hypotheses; assisted-vs-independent rules; transfer/delayed evidence; deterministic learner-state projection. |
| Curriculum / Outer Loop | **First pass** | Ready/reinforcement/transfer/retention/blocked frontiers, Today planning, LessonPlan generation, time/priority signals, and General/Exam allocation over shared learner truth. |
| AI Teacher / Inner Tutor | **First pass** | Bounded pedagogical context, legal actions, mechanism selection, support policy, representation change, support fade, return/stop behavior, proposal qualification, deterministic provider fallback, and decision replay semantics. |
| Teaching intelligence / Learning Blocks | **First pass** | Registered teaching mechanisms, suitability/contraindication metadata, learner cognitive actions, support/replan/fade rules, block runtime and evidence ceilings. |
| Assessment / evidence qualification | **First-pass measurement core; partial formal Exam** | Diagnostic/practice/fresh/transfer/delayed/retention qualification exists. Formal Exam, answer-reveal, lookup-lock integration and universal scoring/rubric authority remain contract-heavy. |
| Lesson / Session Runtime | **First pass; native lifecycle gaps remain** | Session lifecycle, pause/resume, time budget, checkpoint/hydration, duplicate-action identity, session close and continuity semantics. Physical AppState/background/foreground and interruption acceptance remain incomplete. |
| Local persistence | **U1 first-pass foundation / partial overall** | Native Expo SQLite schema/transactions, migrations, durable artifacts, event/evidence/Teacher lineage, bounded reads, replay/idempotency and learner-scoped local deletion. Server truth/sync/cross-device/backup are not implemented. |
| Contextual lookup | **First-pass slice / partial subsystem** | Phrase-first selection, word fallback, contextual sense resolution, zh-TW explanation, lookup history, assessment locking, and the rule that lookup exposure is assistance rather than capability evidence. |
| Authentic input / OCR | **First-pass slice / partial overall** | Direct typing/paste, Writing/Translation artifacts, image/PDF intake, role-separated transcription, immutable source truth and fail-closed uncertainty handling. School/teacher-source metadata and broad device/layout acceptance remain incomplete. |
| AI / model layer | **Partial** | Server-owned provider calls, structured-output contracts, prompt/schema versions, timeout/retry ownership, authority guards, operation lineage and deterministic failure/fallback boundaries. Whole-product rate/cost governance, alternate-model fallback and calibrated model evaluation remain incomplete. |
| Eight-family GSAT practice path | **Implemented path; uneven teaching depth** | Promoted project-authored tasks, canonical bindings, family-specific diagnosis candidates, Teacher interaction and learner-action projection exist for all eight families. This does not mean equal specialized teaching depth. |

## Eight GSAT families in current main

| Family | Current implementation status |
| --- | --- |
| Vocabulary | Active Exam/practice path with contextual sense, collocation, form/retrieval diagnosis candidates and shared teaching-block projection. Broader specialized lexical teaching remains partial. |
| Comprehensive | Active passage-local choice path with vocabulary/sense, phrase/collocation, grammar-fit, local-context and discourse-clue diagnosis candidates. |
| Contextual Fill | Active shared-pool path with syntax/POS, semantics, collocation, local/global context and pool-chain diagnosis candidates. |
| Discourse | Active sentence-insertion path with reference, cohesion, logical relation, sentence-function and before/after-fit diagnosis candidates. |
| Reading | Dedicated attempt/review runtime exists, including immutable submit, evidence-focused review, diagnosis probes and Teacher handoff. |
| Mixed | Active multi-part path with cross-source integration, evidence localization, paraphrase, retrieval/form and short-response diagnosis candidates. |
| Translation | Active shared Exam/learner path. Changed-context retranslation is first pass; the rest of the Translation-specific capability set remains mostly contract-only. |
| Writing | Active shared Exam/learner path. Sentence realization, meaning encoding, revision, return-to-original and current fresh-writing transfer are first pass; planning, organization, cohesion, idea/reasoning and full Writing evaluation remain incomplete. |

## What is currently being rebuilt / integrated

The repository contains functional learner-facing screens and first-pass interaction renderers, but the current UI is **not the final learner experience**.

The active product milestone is the learner-facing adaptive teaching UX rebuild and integration, beginning with the core Vocabulary teaching experience and a shared interaction model that later families can reuse.

The goal is not a cosmetic reskin. The interface must make the existing adaptive behavior understandable through learner action: diagnosis-specific teaching, representation changes after failure, support fading, return to the original task, contextual lookup, and later independent re-checks.

## Partial / contract-heavy areas

- **Content generation:** fresh/changed-context tasks, semantic validity, valid alternatives, context relevance, validation and content packs have first-pass pieces; broad examples/counterexamples/distractors, difficulty/load control and content-safety depth remain incomplete.
- **Writing specialization:** sentence realization, meaning encoding, revision, return-to-original and current fresh-transfer are first pass; higher-level planning/organization/cohesion/reasoning/evaluation are not.
- **Translation specialization:** changed-context retranslation is first pass; most Translation-specific teaching/evaluation capabilities remain contract-only.
- **Vocabulary / chunks / grammar / reading specialization:** Reading has concrete runtime/diagnosis implementation and the shared Exam layer handles the relevant families, but the full J specialization has not completed a dedicated major upgrade/audit.
- **Longitudinal learning:** reencounter, delayed verification, transfer scheduling and retention-history pieces exist; a broad spacing optimizer and policy calibration are not finished.
- **Formal Exam product behavior:** integrity boundaries exist, but full mock/formal runtime, reveal/lookup integration and post-assessment teaching are incomplete.
- **Model system:** production structured endpoints exist, but global cost/rate governance, alternate-model routing and calibrated whole-product model evaluation are incomplete.

## Unfinished

- server-authoritative learner truth;
- sync and cross-device continuity;
- backup/restore and cloud/account-level deletion;
- complete native process-death, AppState race, keyboard/IME, accessibility, permissions and difficult OCR/PDF acceptance;
- full formal/mock GSAT product experience;
- complete specialized teaching repertoire across all eight families;
- broad validated content-generation coverage and difficulty/load calibration;
- real-learner efficacy validation and calibrated learning-outcome evidence;
- final learner-facing interaction and visual system.

## Active learner path

The current first-level learner spine is:

```text
Today
Practice
My English
```

Learning flows then enter lesson/exam runtime, Teacher decisions, learner actions, evidence/persistence, and Result. Development/review routes remain under `/__dev__/*`.

Important current authority rules:

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

## Primary current implementation sources

- learner truth / model: `src/learner-truth/`, `src/domain/evidence/`
- curriculum: `src/curriculum/`
- AI Teacher: `src/teacher-runtime/`
- teaching mechanisms: `src/teaching/`, `src/application/v4/blockRegistryV4.ts`
- assessment: `src/assessment/`
- session runtime: `src/lesson-runtime/`
- eight-family Exam path: `src/content/examBetaBank.ts`, `src/content/examCanonicalBindings.ts`, `src/application/exam/`, `app/exam-practice.tsx`
- Reading specialization: `src/specializations/language/`
- Writing / Translation: `src/specializations/writing/`, `src/specializations/translation/`
- local persistence: `src/persistence/`
- contextual lookup / lexical encounters: `src/lookup/`, `src/learner-truth/lexicalEncounter.ts`
- authentic input / OCR: `src/authentic-input/`, `coach-server/vision-v4.mjs`
- model boundary / server operations: `src/model/`, `coach-server/teacher-server.mjs`
- learner-facing surfaces: `app/`, `components/learning/`

For the deeper A–Y ownership map, see [docs/architecture/EOT_V1_MAIN_ARCHITECTURE.md](docs/architecture/EOT_V1_MAIN_ARCHITECTURE.md).
