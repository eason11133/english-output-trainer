# English Output Trainer (EOT)

EOT is an AI English Teacher focused on moving learners from **seen/known** English to **independent correct production**.

This repository is no longer organized around prototype Stage numbers as product architecture. The production architecture is defined by the EOT V1 Main Architecture Skeleton.

## Start here for architecture work

- `docs/architecture/EOT_V1_MAIN_ARCHITECTURE.md`
- `docs/architecture/EOT_V1_CODE_MIGRATION.md`
- `docs/architecture/EOT_V1_SUBSYSTEM_UPGRADE_PLAYBOOK.md`
- `src/architecture/registry.ts`
- `src/architecture/capabilityCatalog.ts`
- `src/architecture/routeManifest.ts`

The repository contains 25 major subsystem owners (A–Y) and a fine-grained capability catalog. The catalog defines future audit scope; it does **not** claim those capabilities are complete.

## Development unit

After the Main Architecture Skeleton, the default unit of major development is **one major subsystem at a time**.

For the active subsystem:

1. audit every fine-grained capability;
2. identify concrete problems and shared root causes;
3. advance every capability that can legally improve in the same wave;
4. integrate necessary UX changes in the same wave;
5. run subsystem acceptance plus cross-subsystem regression;
6. update progress only after real product behavior proves movement.

Do not return to serial bug/component/Stage-driven micro-patching as the main development method.

## Learner-facing production spine

First-level navigation:

- Today
- My English
- Journey

Flow/secondary routes include Onboarding, Lesson, Result, Profile and Settings. Development/review routes live under `/__dev__/*`.

## Core authority direction

`Product Context + English Domain + Canonical Learner Truth`
→ `Curriculum / Outer Loop`
→ `AI Teacher / Inner Tutor`
→ `Teaching Mechanism`
→ `Lesson / Session Runtime`
→ `Experience Contract`
→ `UI Renderer`
→ `Learner Action`
→ `Observation / Evidence`
→ `Canonical Learner Truth`

UI does not own pedagogy. General/Exam do not fork learner truth. Model output cannot directly become mastery.

## Useful commands

```bash
npm install
npm run typecheck
npm run lint
npm run test:domain
npm run test:scenario
npm run test:stage2
npm run test:stage4
npm run test:stage5a
npm run test:main-architecture
```

The architecture gate verifies A–Y ownership, the fine-grained capability inventory, production route structure, canonical Output Workspace ownership, and common prototype/authority leaks.

## Expo

This project currently targets Expo SDK 57. Before changing Expo-specific behavior, follow the versioned SDK 57 documentation referenced by `AGENTS.md`.

Typical local start:

```bash
npm install
npx expo start
```

Physical Android keyboard/IME acceptance for the current Output Workspace remains explicitly **UNVERIFIED** until tested on a device/emulator with a visible IME.
