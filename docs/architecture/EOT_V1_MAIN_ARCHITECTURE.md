# EOT V1 Main Architecture

> **Current-status authority:** [../../CURRENT_STATUS.md](../../CURRENT_STATUS.md)  
> This document is the deeper engineering map. The A–Y notation is intentionally kept here instead of the repository README.

The machine-readable sources of truth are:

- `src/architecture/registry.ts` — subsystem owner, maturity and current wave status;
- `src/architecture/capabilityCatalog.ts` — fine-grained capability implementation status;
- `src/architecture/routeManifest.ts` — production, secondary and development routes;
- `src/architecture/authority.ts` — authority boundaries;
- `src/architecture/upgradePlan.ts` — upgrade sequencing;
- `src/architecture/migrationManifest.ts` — legacy/current ownership decisions.

The architecture map is **not** a claim that every capability is complete.

## Authority chain

```text
Product Context + English Domain + Canonical Learner Truth
→ General / Exam policy + Curriculum / Outer Loop
→ AI Teacher / Inner Tutor
→ Teaching Intelligence / Specialized Teacher Runtime
→ Lesson / Session Runtime
→ Experience Contract
→ UI Renderer
→ Learner Action
→ Observation / Evidence Guards
→ Canonical Learner Truth
```

Platform/model/persistence services support this chain but do not own pedagogical or learner truth.

### Non-negotiable authority rules

- UI/React does not decide pedagogy.
- Today and My English do not maintain private mastery state.
- General and Exam share learner identity, evidence and history.
- LLM output is a proposal; owning subsystems and guards decide whether it may affect execution.
- Lookup/help exposure is not capability evidence.
- Assisted success is not independent proof.
- Same-context immediate work is not transfer or delayed retention.
- Development/review fixtures cannot become normal production authority.

## Production learner spine

First-level routes in the current route manifest:

- **Today** — `/(tabs)`
- **Practice** — `/(tabs)/practice`
- **My English** — `/(tabs)/my-english`

Secondary/flow routes include onboarding, lesson, reading attempt, result, progress/history, profile and settings.

Development/evaluation routes live under `/__dev__/*`.

## Current A–Y ownership map

This table mirrors the current `src/architecture/registry.ts` at the audited 2026-10-03 checkpoint. “COMPLETE_FIRST_PASS” means the current subsystem wave has an implemented first pass; it is not a 100% completion or efficacy claim.

| ID | Major subsystem | Canonical owner | Maturity | Current status |
| --- | --- | --- | --- | --- |
| A | Product / Identity / Commercial Context | `src/product` | Production core | COMPLETE_FIRST_PASS |
| B | English Domain / Capability Graph | `src/domain/english` | Production core | COMPLETE_FIRST_PASS |
| C | Canonical Learner Truth | `src/learner-truth` | Production core | COMPLETE_FIRST_PASS |
| D | Curriculum / Outer Loop | `src/curriculum` | Production core | COMPLETE_FIRST_PASS |
| E | AI Teacher / Inner Tutor Runtime | `src/teacher-runtime` | Production core | COMPLETE_FIRST_PASS |
| F | Teaching Intelligence / PCK / Mechanisms | `src/teaching` | Production core | COMPLETE_FIRST_PASS |
| G | Content / Task / Context Generation | `src/content` | Partial | READY_FOR_AUDIT |
| H | Writing Teacher Runtime | `src/specializations/writing` | Partial | READY_FOR_AUDIT |
| I | Translation Teacher Runtime | `src/specializations/translation` | Partial | READY_FOR_AUDIT |
| J | Vocabulary / Chunks / Grammar / Reading Runtimes | `src/specializations/language` | Partial | Established/adapted; dedicated deep upgrade not complete |
| K | Assessment / Measurement | `src/assessment` | Production core | READY_FOR_AUDIT |
| L | Longitudinal Learning System | `src/longitudinal` | Partial | READY_FOR_AUDIT |
| M | Lesson / Session Runtime | `src/lesson-runtime` | Production core | READY_FOR_AUDIT |
| N | Product Experience / UX Architecture | `src/experience` | Partial | READY_FOR_AUDIT |
| O | UI / Interaction Design System | `src/ui` | Partial | READY_FOR_AUDIT |
| P | Contextual Lookup | `src/lookup` | Partial | READY_FOR_AUDIT |
| Q | Authentic Input / Materials | `src/authentic-input` | Production core | READY_FOR_AUDIT |
| R | General Product Policy | `src/product-policy/general` | Partial | READY_FOR_AUDIT |
| S | Exam Product Policy | `src/product-policy/exam` | Partial | READY_FOR_AUDIT |
| T | AI / Model Layer | `src/model` | Partial | READY_FOR_AUDIT |
| U | Persistence / Backend / Data | `src/persistence` | Production core | COMPLETE_FIRST_PASS for current U1/local wave; full U remains partial |
| V | Production Reliability | `src/reliability` | Partial | READY_FOR_AUDIT |
| W | Analytics / Product Intelligence | `src/analytics` | Skeleton | Deep implementation deferred |
| X | Evaluation / QA / Research Harness | `src/evaluation` | Partial | Established |
| Y | Market / Commercial Validation Readiness | `src/market-validation` | Future boundary | Future |

## Key cross-cutting implementation notes

### Learner truth

`src/learner-truth` owns immutable observations/evidence and derived learner state. The projection can preserve uncertainty, competing hypotheses, support dependence, changed-context transfer and delayed evidence without allowing model/UI code to write mastery directly.

### Curriculum and Teacher

D chooses **WHAT / WHY / WHEN**. E chooses **HOW NOW** within D's target/facet and time contract. F supplies registered teaching mechanisms, cognitive actions, suitability/contraindication rules, support/fade/replan behavior and task-generation requirements.

### Exam and eight families

The current Exam/practice path represents all eight GSAT families through `src/content/examBetaBank.ts`, `src/application/exam/`, and `app/exam-practice.tsx`. Family-specific diagnosis exists, but specialized runtime depth remains uneven; H, I and J must not be treated as equally complete.

### Persistence

U1 provides native local Expo SQLite operational persistence and durable learner/Teacher lineage. The current `src/persistence/waveU1Status.ts` explicitly leaves server truth, sync, cross-device continuity and backup/restore unfinished.

### Model boundary

T provides bounded server-owned model operations and structured-output contracts. Semantic diagnosis/content authority stays with the owning pedagogical/content subsystems; model output remains proposal-only.

### Authentic input

Q handles direct text, paste, image and PDF intake, immutable artifacts, OCR/source-role separation, and decision-relevant uncertainty. Physical permission/device/OCR-layout acceptance remains incomplete.

## UI / UX ownership

- **N — Product Experience / UX Architecture** owns learner flow, information hierarchy, action contracts and Teacher-decision-to-experience translation.
- **O — UI / Interaction Design System** owns tokens, renderers, accessibility contracts and presentation primitives.

Current screens and renderers are first-pass implementation, not the final product design. The current product milestone is a learner-facing teaching UX rebuild/integration on top of the existing adaptive core.

## Reading engineering gates correctly

Automated gates are engineering evidence, not learner-efficacy evidence. A capability marked FIRST_PASS can still lack broad target coverage, physical-device acceptance, calibration or real-user validation.

For a concise status view, return to [CURRENT_STATUS.md](../../CURRENT_STATUS.md).
