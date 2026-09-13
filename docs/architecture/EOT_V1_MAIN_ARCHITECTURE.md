# EOT V1 Main Architecture Skeleton

This document is the human-readable map of the production architecture. The machine-readable sources are:

- `src/architecture/registry.ts` — 25 major subsystem owners A–Y.
- `src/architecture/capabilityCatalog.ts` — fine-grained capability inventory used by later large upgrade waves.
- `src/architecture/routeManifest.ts` — production/secondary/dev route ownership.
- `src/architecture/authority.ts` — authority layers and forbidden authority moves.
- `src/architecture/upgradePlan.ts` — subsystem-by-subsystem construction rule.
- `src/architecture/migrationManifest.ts` — existing-code classification and migration decisions.

The architecture skeleton is intentionally **not** a claim that all fine-grained capabilities are implemented. Its purpose is to make the whole EOT building exist before deep subsystem upgrades begin.

## Construction model

EOT development now uses two levels:

1. **Main Architecture Skeleton** — establish the whole building map, owners, contracts, routes, dependency direction, and migration targets.
2. **Major Subsystem Upgrade Waves** — select one major subsystem, audit every fine-grained capability inside it, group shared root causes, advance every capability that can legally move in the same wave, and run cross-subsystem regression before acceptance.

The unit of major implementation is therefore **one major subsystem**, not one bug/component/Stage.

## Authority chain

`Product Context + English Domain + Canonical Learner Truth`
→ `General / Exam policy + Curriculum / Outer Loop`
→ `AI Teacher / Inner Tutor`
→ `Teaching Mechanism / Specialized Teacher Runtime`
→ `Lesson / Session Runtime`
→ `Experience Contract`
→ `UI Renderer`
→ `Learner Action`
→ `Observation / Evidence Guards`
→ `Canonical Learner Truth`

Platform/model/persistence services support this chain but do not own product or pedagogical truth.

### Non-negotiable authority rules

- UI/React does not decide pedagogy.
- Today does not maintain private learner truth.
- My English projects canonical truth and does not maintain its own mastery state.
- General and Exam share learner identity/evidence/history.
- LLM output is a proposal; canonical validation/guards control truth updates.
- Stage/prototype/dev fixtures cannot become normal production navigation or authority.
- Lookup exposure is not capability evidence.
- Assisted success is not independent proof.

## Production learner spine

First-level learner navigation is intentionally small:

- Today — `/(tabs)` — system-chosen next best action
- Practice — `/(tabs)/practice` — learner-chosen practice area and external-material import
- My English — `/(tabs)/my-english` — understandable ability projection with Practice deep links

Progress / History is secondary under My English at `/progress-history`; Journey is not a first-level product surface. AI Teacher remains cross-surface behavior rather than a tab or chat home.

Secondary or flow routes:

- Onboarding — `/onboarding/goals` → `/onboarding/time` → optional `/onboarding/exam`
- Lesson — `/daily-lesson`
- Result — `/result`
- Profile / Settings — `/profile`, `/settings`

Development/evaluation routes live under `/__dev__/*` and are not part of learner navigation.

## A–Y major subsystem ownership

| ID | Major subsystem | Canonical owner | Current skeleton status |
|---|---|---|---|
| A | Product / Identity / Commercial Context | `src/product` | Wave A COMPLETE_FIRST_PASS |
| B | English Domain / Capability Graph | `src/domain/english` | Wave B COMPLETE_FIRST_PASS |
| C | Canonical Learner Truth | `src/learner-truth` | Wave C COMPLETE_FIRST_PASS |
| D | Curriculum / Outer Loop | `src/curriculum` | Wave D COMPLETE_FIRST_PASS |
| E | AI Teacher / Inner Tutor Runtime | `src/teacher-runtime` | Wave E COMPLETE_FIRST_PASS |
| F | Teaching Intelligence / PCK / Mechanisms | `src/teaching` | Wave F COMPLETE_FIRST_PASS |
| G | Content / Task / Context Generation | `src/content` | Partial |
| H | Writing Teacher Runtime | `src/specializations/writing` | Partial |
| I | Translation Teacher Runtime | `src/specializations/translation` | Partial |
| J | Vocabulary / Chunks / Grammar / Reading Runtimes | `src/specializations/language` | Partial |
| K | Assessment / Measurement | `src/assessment` | Existing production core |
| L | Longitudinal Learning System | `src/longitudinal` | Partial |
| M | Lesson / Session Runtime | `src/lesson-runtime` | Existing production core |
| N | Product Experience / UX Architecture | `src/experience` | Partial |
| O | UI / Interaction Design System | `src/ui` | Partial |
| P | Contextual Lookup | `src/lookup` | Partial |
| Q | Authentic Input / Materials | `src/authentic-input` | Existing production core |
| R | General Product Policy | `src/product-policy/general` | Skeleton |
| S | Exam Product Policy | `src/product-policy/exam` | Skeleton |
| T | AI / Model Layer | `src/model` | Partial |
| U | Persistence / Backend / Data | `src/persistence` | Partial |
| V | Production Reliability | `src/reliability` | Skeleton |
| W | Analytics / Product Intelligence | `src/analytics` | Skeleton |
| X | Evaluation / QA / Research Harness | `src/evaluation` | Partial |
| Y | Market / Commercial Validation Readiness | `src/market-validation` | Future/readiness boundary |

Each owner directory contains a `README.md` with its scope and fine-grained capability list. The capability catalog contains hundreds of explicitly named items. Wave A items are now marked `FIRST_PASS`; untouched subsystems remain `NOT_AUDITED`. These statuses are implementation evidence, not claims of real learner efficacy or market validation.

## Canonical Output Workspace ownership

Validated Output Workspace work is preserved, but production ownership is no longer a Stage5A island:

- Renderer → `components/learning/OutputWorkspace.tsx` (O)
- Experience VM → `src/experience/outputWorkspaceVM.ts` (N)
- Adaptive session projection/runtime → `src/lesson-runtime/adaptiveOutputWorkspaceRuntime.ts` (M)
- Allow construction semantics → `src/teaching/mechanisms/allowObjectInfinitive.ts` (F)

Old Stage5A paths remain only as compatibility/review entrypoints where needed.

The normal `/daily-lesson` production route imports these canonical owners and remains an authentic-work entry rather than a hidden allow fixture.

## UI / UX ownership

UI/UX is intentionally split:

- **N — Product Experience / UX Architecture** owns flows, information hierarchy, learner actions, route experience, and the Teacher Decision → Experience Contract boundary.
- **O — UI / Interaction Design System** owns tokens, renderer components, accessibility, responsive behavior, and visual interaction primitives.

UI/UX also participates in each later subsystem wave where a domain capability changes learner interaction. It is not postponed until final polish.

Current learner-shell tokens live under `src/ui`; the accepted Output Workspace keeps its manuscript/language-object direction. Deep visual polish is deferred.

## Dependency enforcement

`npm run test:main-architecture` is the main skeleton gate. It verifies:

- all A–Y owners and public entrypoints;
- non-empty fine-grained capability inventories;
- no duplicate capability IDs;
- no ownership dependency cycles;
- canonical owner README presence;
- production route manifest and exact three first-level tabs;
- no normal learner imports from Stage5A/dev/review fixtures;
- no direct persistence implementation ownership in UI;
- no UI Tutor Policy ownership;
- no fixed Teach→Practice→Assess screenplay identifiers on production surfaces;
- no General/Exam learner-truth fork;
- no learner-facing leakage of internal runtime terminology;
- canonical Output Workspace ownership outside Stage5A.

## Device acceptance

Physical Android keyboard/IME remains `UNVERIFIED`. It is tracked under V (Production Reliability) and X (Evaluation / Device Acceptance). It is not treated as an architecture-skeleton blocker and must not be mislabeled as PASS without physical/emulator IME evidence.

## What happens after this skeleton

Do **not** start serial micro-patching.

Wave A — Product / Identity / Commercial Context — has completed its first production pass. Its executable audit is in `src/product/waveAStatus.ts` and its implementation report is in `docs/architecture/waves/A_PRODUCT_IDENTITY_COMMERCIAL_CONTEXT_WAVE.md`.

Wave B — English Domain / Capability Graph — has completed its first production pass. Its executable audit is in `src/domain/english/waveBStatus.ts` and its implementation report is in `docs/architecture/waves/B_ENGLISH_DOMAIN_CAPABILITY_GRAPH_WAVE.md`.

Wave C — Canonical Learner Truth — has completed its first production pass. Its executable audit is in `src/learner-truth/waveCStatus.ts` and its implementation report is in `docs/architecture/waves/C_CANONICAL_LEARNER_TRUTH_WAVE.md`.

Wave E consumes D's canonical WHAT/WHY/WHEN through a qualified, fallback-safe inner-tutor runtime. Wave F now provides the first-pass HOW-content layer: canonical PCK metadata, mechanism suitability, competing production-bottleneck hypotheses, multidimensional assistance/elicitation conditions, teaching primitives, representation switching, and a bounded F→G task-generation need. F still cannot change D target/facet or write C learner truth. Database/persistence audit and Writing/Translation integration remain downstream work, not evidence that F is 100% complete.
