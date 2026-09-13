export type MigrationDispositionV1='KEEP'|'MOVE'|'ADAPT'|'REUSE_AS_MECHANISM'|'DEV_ONLY'|'SUPERSEDED'|'REMOVE';

export interface MigrationRecordV1{
  current_path:string;
  classification:MigrationDispositionV1;
  owner_subsystem:string;
  action_taken:string;
  deferred_action?:string;
}

export const architectureMigrationManifestV1:readonly MigrationRecordV1[]=[
  {current_path:'context/AppDataContext.tsx',classification:'ADAPT',owner_subsystem:'A/N',action_taken:'Now projects one canonical ProductProfileV2 into learner-facing compatibility views and runtime ProductContextV1; it owns no capability truth.'},
  {current_path:'context/AuthContext.tsx',classification:'KEEP',owner_subsystem:'A/U',action_taken:'Authentication remains an access concern and is not allowed to fork learner identity/evidence.'},
  {current_path:'src/domain/product + src/application/product',classification:'SUPERSEDED',owner_subsystem:'A',action_taken:'Legacy product concepts no longer own production product context; src/product is canonical after Wave A.'},

  {current_path:'src/persistence/productContextStore.ts',classification:'ADAPT',owner_subsystem:'A/U',action_taken:'Upgraded to per-learner ProductProfileV2 persistence with local V1 migration and normalization; legacy global key is read only for safe demo migration.'},

  {current_path:'src/domain/english',classification:'KEEP',owner_subsystem:'B',action_taken:'Existing English-domain objects remain the canonical capability-graph foundation.'},
  {current_path:'src/domain/knowledge',classification:'ADAPT',owner_subsystem:'B',action_taken:'Knowledge concepts remain supporting implementation and must converge on the English Domain graph contract.'},

  {current_path:'src/domain/evidence + src/application/evidence',classification:'KEEP',owner_subsystem:'C',action_taken:'Published through src/learner-truth; immutable guarded evidence remains canonical learning truth.'},
  {current_path:'src/application/learner',classification:'KEEP',owner_subsystem:'C',action_taken:'Learner-state projection remains derived from canonical evidence.'},
  {current_path:'src/repositories/AsyncStorageCanonicalEvidenceLedgerV3.ts',classification:'ADAPT',owner_subsystem:'C/U',action_taken:'Concrete storage remains behind the persistence composition boundary.'},
  {current_path:'src/repositories/AsyncStorageEvidenceRepository.ts',classification:'SUPERSEDED',owner_subsystem:'U',action_taken:'Not exported by canonical production entrypoints.',deferred_action:'Remove after compatibility consumers are fully audited.'},

  {current_path:'src/application/learning + src/application/scheduler + src/application/mission',classification:'ADAPT',owner_subsystem:'D/L/M',action_taken:'Existing planning/scheduling implementations are classified under Curriculum, Longitudinal, and Session ownership instead of product navigation.'},
  {current_path:'src/application/v4/learningOrchestratorV4.ts',classification:'KEEP',owner_subsystem:'D',action_taken:'Retained as partial outer-loop production core behind src/curriculum.'},

  {current_path:'src/application/teacher',classification:'KEEP',owner_subsystem:'E/F',action_taken:'Teacher reasoning and PCK remain production core behind teacher-runtime/teaching entrypoints.'},
  {current_path:'src/application/stage4/blockDecisionAdapterV4.ts',classification:'ADAPT',owner_subsystem:'E',action_taken:'Retained as a compatibility adapter behind the canonical Inner Tutor entrypoint.'},
  {current_path:'src/repositories/TeacherRuntimeStorage.ts',classification:'KEEP',owner_subsystem:'E/U',action_taken:'Teacher episode persistence stays separate from canonical learner truth.'},

  {current_path:'src/application/v4/blockRegistryV4.ts + blockRuntimeV4.ts',classification:'REUSE_AS_MECHANISM',owner_subsystem:'F',action_taken:'Published through src/teaching as registered mechanism infrastructure.'},
  {current_path:'src/application/stage5a/allowSliceV4.ts',classification:'REUSE_AS_MECHANISM',owner_subsystem:'F/X',action_taken:'Allow construction semantics moved to src/teaching/mechanisms/allowObjectInfinitive.ts; Stage path now only preserves controlled fixture compatibility.'},

  {current_path:'src/application/v4/taskGenerationV4.ts + src/domain/v4/ContentGovernanceV4.ts',classification:'KEEP',owner_subsystem:'G',action_taken:'Published as governed content/task-generation infrastructure.'},
  {current_path:'src/domain/stage4 + src/application/stage4 learner-artifact/runtime code',classification:'ADAPT',owner_subsystem:'H/I/M/Q',action_taken:'Validated artifact/session behavior remains; Stage names are implementation history, not product architecture.',deferred_action:'Rename/move internals only in a dedicated migration where behavior can be preserved.'},

  {current_path:'src/application/evidence/evidenceGuardsV3.ts + src/application/v4/evaluationV4.ts',classification:'KEEP',owner_subsystem:'K',action_taken:'Measurement/evidence guards remain the Assessment authority.'},
  {current_path:'src/application/v4/reencounterSchedulerV4.ts',classification:'KEEP',owner_subsystem:'L',action_taken:'Retained behind Longitudinal ownership.'},

  {current_path:'src/application/stage5a/adaptiveOutputWorkspaceRuntime.ts',classification:'MOVE',owner_subsystem:'M',action_taken:'Production adaptive runtime moved to src/lesson-runtime/adaptiveOutputWorkspaceRuntime.ts; Stage path is now review-fixture compatibility only.'},
  {current_path:'src/application/stage5a/outputWorkspaceVM.ts',classification:'MOVE',owner_subsystem:'N',action_taken:'Production OutputWorkspace VM moved to src/experience/outputWorkspaceVM.ts; Stage path is compatibility only.'},
  {current_path:'components/stage5a/OutputWorkspace.tsx',classification:'MOVE',owner_subsystem:'O',action_taken:'Production renderer moved to components/learning/OutputWorkspace.tsx; Stage component path now re-exports for dev compatibility.'},
  {current_path:'components/stage5a/AllowTeachingSlice.tsx',classification:'DEV_ONLY',owner_subsystem:'X',action_taken:'Removed from normal learner routes; remains a controlled adaptive-runtime acceptance harness.'},
  {current_path:'components/stage5a/OutputWorkspaceReview.tsx',classification:'DEV_ONLY',owner_subsystem:'X',action_taken:'Retained only as a low-level visual fixture.'},
  {current_path:'src/application/stage2/*',classification:'DEV_ONLY',owner_subsystem:'X',action_taken:'Retained as evaluation harness, not production Tutor authority.'},
  {current_path:'app/__dev__/*',classification:'DEV_ONLY',owner_subsystem:'X',action_taken:'Kept out of learner navigation and guarded from production imports.'},

  {current_path:'app/(tabs)/index.tsx',classification:'ADAPT',owner_subsystem:'N/D',action_taken:'Today is a production experience surface that reads session/planning projections and owns no private learner truth.'},
  {current_path:'app/(tabs)/practice.tsx',classification:'ADAPT',owner_subsystem:'N/G/M',action_taken:'Founder-directed first-level Practice shell owns learner choice and external-material entry while reusing canonical content, Teacher, lesson, and evidence systems.',deferred_action:'Complete selectable family, amount, continue-practice, recommendation, and My English deep-link behavior in the dedicated Practice surface implementation.'},
  {current_path:'app/(tabs)/my-english.tsx',classification:'ADAPT',owner_subsystem:'N/C',action_taken:'My English projects canonical truth and does not store mastery state.'},
  {current_path:'app/(tabs)/journey.tsx',classification:'MOVE',owner_subsystem:'N/L',action_taken:'Removed Journey from first-level tabs; the existing milestone projection moved to secondary app/progress-history.tsx under My English.'},
  {current_path:'app/daily-lesson.tsx',classification:'ADAPT',owner_subsystem:'N/M/Q',action_taken:'Normal Lesson consumes canonical lesson-runtime, teacher-runtime, teaching, persistence, learner-truth, and experience entrypoints; it no longer imports the Stage5A renderer.'},
  {current_path:'app/result.tsx',classification:'ADAPT',owner_subsystem:'N/K/C',action_taken:'Result is a learner-facing projection of evidence/session outcomes.'},
  {current_path:'app/profile.tsx + app/settings.tsx',classification:'ADAPT',owner_subsystem:'A/N',action_taken:'Secondary product-context/settings surfaces; no learner capability truth is stored there.'},

  {current_path:'lib/teacherApi.ts + coach-server',classification:'ADAPT',owner_subsystem:'T',action_taken:'Current model/provider access is classified behind the AI/Model boundary.',deferred_action:'Provider abstraction/cost/fallback hardening belongs to T/V waves.'},
  {current_path:'src/repositories + lib/supabase.ts',classification:'ADAPT',owner_subsystem:'U',action_taken:'Concrete data implementations remain behind persistence/backend ownership.'},

  {current_path:'archive + _patch_backups + v0.2-update + v0.3-update',classification:'SUPERSEDED',owner_subsystem:'X',action_taken:'Excluded from production architecture and architecture gates.',deferred_action:'Physical cleanup is deferred because these are recovery/history artifacts.'},
  {current_path:'src/index.ts + src/v4.ts',classification:'SUPERSEDED',owner_subsystem:'X',action_taken:'Compatibility barrels remain for old consumers; new production code uses A–Y public entrypoints.',deferred_action:'Remove after downstream import migration is complete.'},
];
