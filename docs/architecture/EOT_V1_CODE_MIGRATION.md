# EOT V1 Existing-Code Classification and Migration

Machine-readable source: `src/architecture/migrationManifest.ts`.

## Classification vocabulary

- `KEEP` — validated behavior remains production core.
- `MOVE` — ownership/path moves to the canonical major subsystem.
- `ADAPT` — behavior stays but is wrapped or composed behind the canonical boundary.
- `REUSE_AS_MECHANISM` — implementation becomes a registered pedagogical/mechanism asset rather than product architecture.
- `DEV_ONLY` — review/evaluation fixture only; never normal learner authority.
- `SUPERSEDED` — compatibility/history only.
- `REMOVE` — obsolete behavior that may be physically removed once no safe consumer remains.

## Important ownership corrections in this skeleton

### Output Workspace

The Stage5A work is preserved but production ownership is moved:

- `src/application/stage5a/outputWorkspaceVM.ts` → canonical `src/experience/outputWorkspaceVM.ts`.
- `src/application/stage5a/adaptiveOutputWorkspaceRuntime.ts` → canonical `src/lesson-runtime/adaptiveOutputWorkspaceRuntime.ts`.
- `components/stage5a/OutputWorkspace.tsx` → canonical `components/learning/OutputWorkspace.tsx`.
- allow-construction semantics → canonical `src/teaching/mechanisms/allowObjectInfinitive.ts`.

Compatibility files remain for Stage5A review harnesses, but the normal Lesson route no longer imports Stage5A.

### Learner truth

- V3 canonical guarded evidence remains truth.
- Learner Model remains a projection.
- old compatibility evidence repositories are not exported as production authority.
- My English/Progress & History/Result are read projections and cannot write mastery.

### Stage4

Stage4 contains validated artifact/session/evidence behavior and is therefore not deleted merely because the name is historical. Its production value is exposed through canonical A–Y entrypoints. Physical renaming is deferred until it can be done without destabilizing validated behavior.

### Dev/review

`app/__dev__`, `AllowTeachingSlice`, `OutputWorkspaceReview`, Stage2 evaluation harnesses, archives and old patch bundles are not production information architecture.

## Why physical cleanup is not the goal of this wave

The Main Architecture Skeleton establishes ownership first. Destructive cleanup is deferred when it would add risk without improving product authority. Later subsystem waves can remove compatibility paths after downstream import audits prove they are no longer required.
