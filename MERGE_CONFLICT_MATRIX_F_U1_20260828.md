> **HISTORICAL — superseded by [CURRENT_STATUS.md](CURRENT_STATUS.md).**  
> Preserved as development history. Do not use this file as current product/status authority.

# F Audit-Fix + U1 Merge Conflict Matrix — 2026-08-28

## Why a merge was required

The previous F audit-fix installer treated the F checkpoint as a file-replacement patch. The live local repository already contained U1 operational persistence changes. Both tracks changed `app/daily-lesson.tsx` and `src/teacher-runtime/types.ts`, while U1 also changed `src/teacher-runtime/runtime.ts`. Blind replacement therefore removed U1 lineage typing while leaving U1 runtime lineage writes intact, and risked removing U1 persistence integration.

## Ownership-preserving resolution

| File / area | F requirement | U1 requirement | Merge decision |
| --- | --- | --- | --- |
| `app/daily-lesson.tsx` | Production conditions flow Workspace → event → Stage4 → candidate → TaskContract; canonical provider contract | Native operational lesson persistence, durable evidence and Teacher-lineage persistence | Semantic merge; keep both. |
| `src/teacher-runtime/types.ts` | Pedagogical event carries domain `ProductionConditionsV1` | Qualified decision carries optional `TeacherDecisionLineageV1` | Semantic merge; keep both. |
| `src/teacher-runtime/runtime.ts` | No audit-fix ownership change | U1 lineage emission | Preserve U1 version. |
| F registry / guards / Stage4 / block runtime / coach provider files | 52-block canonical contract + fail-closed multidimensional assistance | U1 did not own these files | Use F audit-fix versions. |
| `src/persistence/**`, package deps, `app.json` | No F ownership | U1 SQLite / crypto / operational persistence | Preserve U1 versions. |

## Verified merged-source diagnostics

The merged source was compiled with the isolated domain TypeScript configuration and exercised through the project gates before packaging:

- Wave F 20/20
- Wave E 24/24
- U1 gate 29 tables / 13 behavioral checks
- Main Architecture PASS
- Domain 42/42
- Scenario 11/11
- Stage4 13/13
- Stage5A 12/12
- Wave C 12/12
- Stage3 block preflight 52 blocks / registry 4.2.0 / `fnv1a32:6214cd37`

These are engineering diagnostics, not independent product acceptance. F remains a re-audit candidate. U1 remains PARTIAL until native device acceptance.
