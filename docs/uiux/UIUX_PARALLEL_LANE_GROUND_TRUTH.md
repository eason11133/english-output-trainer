# UI/UX parallel lane ground truth

This document is an implementation handoff, not a visual specification. Native iOS/Android is the production scope; `__dev__` routes are review-only.

## Production route surface

| Route | Source | Classification | Recommendation |
|---|---|---|---|
| `/` | `app/index.tsx` | Current redirect boundary | Keep |
| `/(auth)/sign-in`, `sign-up` | `app/(auth)/*` | Current account boundary | Keep; design later |
| `/onboarding/goals`, `/time`, optional `/exam` | `app/onboarding/*` | Current minimal onboarding | Defer visual decisions; no placement |
| `/(tabs)` | `app/(tabs)/index.tsx` | Current Today foundation | Keep semantics; redesign only from approved spec |
| `/(tabs)/practice` | `app/(tabs)/practice.tsx` | Canonical learner-chosen Practice entry and external-import owner | Keep first-level; complete configuration with surface implementation |
| `/(tabs)/my-english` | `app/(tabs)/my-english.tsx` | Current canonical projection | Keep sparse evidence-honest semantics |
| `/progress-history` | `app/progress-history.tsx` | Secondary milestone projection under My English | Keep secondary; avoid session spam |
| `/daily-lesson` | `app/daily-lesson.tsx` | Current native runtime integration | Keep runtime bindings; presentation needs approved design |
| `/result` | `app/result.tsx` | Current result projection | Keep canonical query binding |
| `/profile`, `/settings` | corresponding files | Secondary | Keep secondary |
| `/__dev__/*` | `app/__dev__/*` | DEV/review only | Never link from learner navigation |

No current production routes named Mission, Growth, Learn, Placement, Coach, Retrieval, or Import Work exist under `app/`. Stage5A components and Stage-numbered review routes are compatibility/evaluation assets, not product IA.

## Canonical implementation seams

- Today: `loadTodayCurriculumVMV1`, `loadTodayLearnerSpineVMV1`, and active-session projection.
- Lesson hydration: `loadActiveOperationalLessonV1`; native durable state is `Stage4RuntimeV4`.
- Learner actions: `handleEvent` in `app/daily-lesson.tsx` creates canonical action payload/identity, then Stage4 event and C/K admission.
- Teacher experience: `decideInnerTutorV1` → `teacherDecisionToExperienceContractV1` → `executeTeacherExperienceV1` → `projectAdaptiveWorkspaceV4` → `withLearnerLessonExperienceV1`.
- Renderer: `components/learning/OutputWorkspace.tsx` consumes `OutputWorkspaceVM`; it must not choose block, support, evidence, target, or next pedagogy.
- Writing/Translation: `hydrateWritingWorkV1` / `hydrateTranslationWorkV1`; prompt/source and learner revisions remain separate.
- Pause/resume: `pauseLessonSessionV1`, `resumeLessonSessionV1`, AppState lifecycle, and persisted tutor clock.
- Recovery: `pendingTeacherContinuation` is backstage. Frontstage may show ordinary loading/resume only.
- Fresh/transfer: specialization fresh-task preparation and validated delivery gates supply the actual prompt/source.
- Return: Experience Contract `RETURN_TO_TASK`, specialization return marker, then original source/revision.
- Lookup: `src/lookup` owns phrase-first resolution, assessment lock and non-evidence effects. `ContextualLookup` is current presentation only; learner-entered editor text must not be automatically tokenized as lookup content.

Safe frontstage data: learner-authored text, confirmed source/prompt, learner-facing Experience title/instruction, actual delivered fresh task, editable/input scope, learner action labels, ordinary progress/loading/error, lookup meaning approved by P policy.

Backstage only: evidence/candidates/admissions, observations, hypotheses, target/facet IDs, mechanism/block IDs, ProductionConditions, TaskContract, ExperienceContract internals, provenance/license metadata, provider/fallback lineage, decision reason codes, confidence enums, runtime/debug status, continuation and transaction identity, capability/gate status.

## Reuse classification

- `components/learning/OutputWorkspace.tsx`: REUSE_BEHAVIOR and renderer boundary; DO_NOT freeze its current visual design.
- `src/experience/outputWorkspaceVM.ts`: REUSE_INFRASTRUCTURE_ONLY; VM contains backstage fields that components must not display.
- `src/lesson-runtime/adaptiveOutputWorkspaceRuntime.ts`: REUSE_BEHAVIOR for support, fresh and return projections.
- `components/learning/ContextualLookup.tsx` plus `src/lookup/*`: REUSE_BEHAVIOR; current chip styling is DO_NOT_REUSE_UI until approved.
- `components/stage5a/*`, `src/application/stage5a/*`: LEGACY/REVIEW; mine behavior only, never restore as product authority.
- `components/blocks/*`, `components/stage4/*`, `app/__dev__/blocks/*`: REVIEW tooling; DO_NOT_REUSE_UI directly.

## Known frontstage leaks and risks

- `app/daily-lesson.tsx`: source contains extensive backend vocabulary, but current learner-visible leak is the copy “不會建立學習證據” in correction flow (medium). Replace only when approved copy arrives.
- `components/learning/OutputWorkspace.tsx`: learner-visible sentence says an interaction is “不是能力證明” (medium). Semantically safe but backstage terminology.
- `app/__dev__/stage4-acceptance.tsx`: “學習證據” appears, but DEV-only (none for production).
- `app/__dev__/blocks/*` and `stage4-inspector.tsx`: mechanism/evidence/runtime/provenance fields are intentionally exposed in DEV-only surfaces.
- `OutputWorkspaceVM.intervention.mechanismId`, `supportLevel`, and `productionConditions` are backstage fields in a presentation VM (high misuse risk). Current production renderer uses renderer/payload but must never render these identifiers.

## QA and screenshots

The deterministic route is `/__dev__/uiux-harness?state=STATE&viewport=390x844`. States are exported by `src/ui/qa/lessonHarness.ts`. Recommended screenshot name: `uiux-{state}-{viewport}-{platform}.png`. Capture only after approved visuals exist; compare same state, viewport and platform. Current fixtures have no network or model dependency.

Executable host coverage is structural/state-contract coverage. Back, IME, keyboard CTA reachability, real focus, touch target geometry, reduced motion, screen reader, and rendered screenshots remain device/emulator acceptance.
