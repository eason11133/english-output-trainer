# EOT core authority audit — 2026-08-19

This audit classifies the repository after the public-MVP learner-path cutover. `ACTIVE AUTHORITY` means a value can affect Today, Mission, Result, My English, Next Frontier, Journey, or tutor policy. All other classifications are explicitly non-governing.

## Active authority

- Access: `src/application/access/learnerAccessPolicy.ts`, enforced once by `app/_layout.tsx`. Authentication and minimal onboarding are required; Placement is absent from the gate.
- Learner truth: canonical `EvidenceEvent` records in `EvidenceRepository`, projected by `src/domain/learner/projection.ts`.
- Target supply: `buildTargetUniverse` merges repository grammar/exam/vocabulary, learner-created vocabulary, imported work, and observation-created targets. Bootstrap seeds are last-priority fallback only.
- Allocation: scheduler candidates derived from canonical evidence and the dynamic target universe in `src/application/today/todayMission.ts`.
- Teaching decisions: progressive observations/hypotheses plus `tutorPolicy`; Mission interaction state executes the chosen reteach and requires re-output.
- Interaction planning: `interactionPlanner.ts` receives the selected target, knowledge kind, current candidate/state, persisted failure hypotheses, next evidence need, recurrence/support dependence, transfer eligibility, task context, and time budget. It emits only currently justified plans; target registration emits no activity ladder.
- Mission turn authority: `missionTurnOrchestrator.ts` owns submission → evidence/projection → diagnosis → Tutor Policy → `InteractionDecision` → state transition. `MissionRunner.tsx` executes this service and contains no diagnosis, policy, or `REQUEST_RETEACH` authority.
- Evaluation routing: `InteractionPlan.evaluation` declares constrained versus open-semantic answer space and scope. Deterministic evaluation refuses open work; semantic work never falls through to exact-string failure when the provider is unavailable.
- Product policy: General and Exam use the same evidence/projection while applying different allocation policy.

## Migration only

- `context/AppDataContext.tsx` retains `LearnerSkillProfile`, `PlacementDiagnosticResult`, `WeaknessEvidence`, legacy `LearningEvent`, `DailyPlan`, `RetrievalState`, and checkpoint state for storage compatibility and legacy screens. Active learner routes receive the narrow `CanonicalProductData` facade, which excludes all of these fields.
- `lib/storage.ts`, `lib/learnerModel.ts`, `lib/dailyPlan.ts`, `lib/dailyLearning.ts`, `lib/retrieval.ts`, `lib/skillEvidence.ts`, and legacy domain types remain compatibility readers/writers only.
- `src/application/migration/migrateLegacyRawData.ts` imports raw artifacts idempotently and explicitly ignores legacy scores/mastery/completion conclusions.
- Optional Placement/Ability Exploration keeps its compatibility snapshot but also writes raw observations to canonical Evidence; the snapshot is not read by active learner authority.

## Dev-test only

- `src/fixtures/gold*`, `src/domain/evaluation/goldEvaluator.ts`, and `src/application/execution/goldDevMission.ts`.
- Gold-backed domain tests remain deterministic fixtures. Gold modules are no longer exported by the production barrel.
- `bootstrapTargetSupply` is a production-safe empty-account fallback, not the candidate universe; supplied and observed sources outrank it and are independently schedulable.

## Dead legacy / unreachable compatibility

- Old module, workout, checkpoint, retrieval, daily lesson, proof check, vocabulary practice, diagnostic review, skill-profile, and old Learn/error routes remain source-compatible but are rejected by the global route policy and redirected to Today.
- `(tabs)/learn.tsx` is the remaining Gold-backed compatibility UI. The tab link was removed and direct navigation is rejected by the global policy.
- `extra-practice` legacy routing is rejected; its application service itself was migrated to dynamic contracts so it cannot reintroduce Gold authority if reused later.

## Search conclusion

There are no unexplained active uses of `placementDiagnostic.completed`, `LearnerSkillProfile`, `PlacementDiagnosticResult`, `WeaknessEvidence`, legacy `LearningEvent`, old `DailyPlan`/`dailyLearning`, `RetrievalState`/checkpoint mastery, Gold fixtures, or a fixed production target array in the active learner spine.

The 2026-08-20 pedagogical re-audit additionally confirms:

- `buildTargetUniverse` supplies targets only and has no `contracts`/five-variant generation.
- Vocabulary NEW, vocabulary RECOGNIZED, writing strategy, reading comprehension, repair/support-dependent, and transfer candidates produce different primitives and evaluator contracts.
- Transfer plans are generated only for scheduler candidates whose prior canonical evidence makes transfer eligible.
- Open transfer and free translation are semantic-evaluator work; constrained grammar remains deterministic.
- Result, My English, Frontier, Journey, and future Today allocation continue to consume canonical Evidence/projection rather than InteractionPlan-local state.
