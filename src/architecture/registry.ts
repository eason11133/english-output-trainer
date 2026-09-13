import { subsystemCapabilityCountV1 } from './capabilityCatalog';

export type SubsystemMaturity='SKELETON'|'PARTIAL'|'PRODUCTION_CORE'|'DEV_ONLY'|'SUPERSEDED'|'FUTURE';
export type SubsystemWaveStatusV1='ESTABLISHED'|'ADAPTED'|'DEFERRED_DEEP_IMPLEMENTATION'|'READY_FOR_AUDIT'|'COMPLETE_FIRST_PASS';

export interface ArchitectureSubsystemV1 {
  id:string;
  name:string;
  owner_path:string;
  maturity_status:SubsystemMaturity;
  production_entrypoint:string;
  dependencies:string[];
  public_contracts:string[];
  legacy_sources:string[];
  capability_count:number;
  current_wave_status:SubsystemWaveStatusV1;
}

const s=(id:string,name:string,owner_path:string,maturity_status:SubsystemMaturity,production_entrypoint:string,dependencies:string[],public_contracts:string[],legacy_sources:string[]=[],wave?:SubsystemWaveStatusV1):ArchitectureSubsystemV1=>({
  id,name,owner_path,maturity_status,production_entrypoint,dependencies,public_contracts,legacy_sources,
  capability_count:subsystemCapabilityCountV1(id),
  current_wave_status:wave??(maturity_status==='SKELETON'?'DEFERRED_DEEP_IMPLEMENTATION':legacy_sources.length?'ADAPTED':'ESTABLISHED')
});

export const eotArchitectureRegistryV1:readonly ArchitectureSubsystemV1[]=Object.freeze([
  s('A','Product / Identity / Commercial Context','src/product','PRODUCTION_CORE','src/product/index.ts',[],['ProductContextV1','ProductProfileV2'],['context/AppDataContext.tsx','context/AuthContext.tsx','src/persistence/productContextStore.ts'],'COMPLETE_FIRST_PASS'),
  s('B','English Domain / Capability Graph','src/domain/english','PRODUCTION_CORE','src/domain/english/index.ts',[],['EnglishDomainPortV1','EnglishDomainPortV2','EnglishDomainGraphV2'],['src/domain/english/EnglishDomain.ts'],'COMPLETE_FIRST_PASS'),
  s('C','Canonical Learner Truth','src/learner-truth','PRODUCTION_CORE','src/learner-truth/index.ts',['B'],['LearnerTruthPortV1','CanonicalLearnerTruthPortV1','LearnerObservationV1'],['src/domain/evidence','src/application/evidence','src/application/learner'],'COMPLETE_FIRST_PASS'),
  s('D','Curriculum / Outer Loop','src/curriculum','PRODUCTION_CORE','src/curriculum/index.ts',['A','B','C','R','S'],['CurriculumPortV1','LessonPlanV1','CanonicalCurriculumPortV1','TodayCurriculumPlanV1'],['src/application/learning','src/application/v4/learningOrchestratorV4.ts'],'COMPLETE_FIRST_PASS'),
  s('E','AI Teacher / Inner Tutor Runtime','src/teacher-runtime','PRODUCTION_CORE','src/teacher-runtime/index.ts',['A','B','C','D','T'],['InnerTutorPortV1','TeacherDecisionContextV1','PedagogicalContextV1','QualifiedInnerTutorDecisionV1'],['src/application/teacher','src/application/stage4/blockDecisionAdapterV4.ts'],'COMPLETE_FIRST_PASS'),
  s('F','Teaching Intelligence / PCK / Mechanisms','src/teaching','PRODUCTION_CORE','src/teaching/index.ts',['B','E'],['TeachingMechanismPortV1','TeachingOptionsV1','TaskGenerationNeedFromFV1'],['src/application/v4/blockRegistryV4.ts','src/application/teacher/pckV3.ts'],'COMPLETE_FIRST_PASS'),
  s('G','Content / Task / Context Generation','src/content','PARTIAL','src/content/index.ts',['B','C','T'],['ContentGenerationPortV1','GeneratedTaskV1'],['src/application/v4/taskGenerationV4.ts','src/domain/v4/ContentGovernanceV4.ts','src/content/writingTaskRuntime.ts','src/content/validation.ts'],'READY_FOR_AUDIT'),
  s('H','Writing Teacher Runtime','src/specializations/writing','PARTIAL','src/specializations/writing/index.ts',['C','E','F','G','K'],['SpecializedTeacherRuntimeV1','WritingSourceContextV1','WritingWorkStateV1','WritingTeachingContextV1','WritingTaskGenerationNeedV1','WritingAnalyticObservationV1'],['src/domain/stage4','src/application/stage4'],'READY_FOR_AUDIT'),
  s('I','Translation Teacher Runtime','src/specializations/translation','PARTIAL','src/specializations/translation/index.ts',['C','E','F','G','K'],['SpecializedTeacherRuntimeV1'],['src/domain/stage4','src/application/stage4'],'READY_FOR_AUDIT'),
  s('J','Vocabulary / Chunks / Grammar / Reading Runtimes','src/specializations/language','PARTIAL','src/specializations/language/index.ts',['B','C','E','F','G','K'],['SpecializedTeacherRuntimeV1'],['src/application/teacher/pckCore.ts']),
  s('K','Assessment / Measurement','src/assessment','PRODUCTION_CORE','src/assessment/index.ts',['B','C'],['AssessmentPortV1','MeasurementDecisionV1','MeasurementQualificationV1'],['src/assessment/measurement.ts','src/assessment/formalIntegrity.ts','src/application/evidence/evidenceGuardsV3.ts','src/application/v4/evaluationV4.ts'],'READY_FOR_AUDIT'),
  s('L','Longitudinal Learning System','src/longitudinal','PARTIAL','src/longitudinal/index.ts',['C','K'],['LongitudinalPortV1','ReencounterNeedV1','LongitudinalTargetSnapshotV1','FutureAllocationSignalV1'],['src/application/v4/reencounterSchedulerV4.ts'],'READY_FOR_AUDIT'),
  s('M','Lesson / Session Runtime','src/lesson-runtime','PRODUCTION_CORE','src/lesson-runtime/index.ts',['C','D','E','F','K','L','Q','U'],['LessonSessionPortV1','LessonSessionLifecycleV1'],['src/domain/stage4','src/application/stage4','src/repositories/Stage4RuntimeStorage.ts','src/application/stage5a/adaptiveOutputWorkspaceRuntime.ts'],'READY_FOR_AUDIT'),
  s('N','Product Experience / UX Architecture','src/experience','PARTIAL','src/experience/index.ts',['A','C','D','E','M','P'],['ExperienceContractV1','LearnerRouteV1','LearnerLessonChromeV1'],['app','src/application/stage5a/outputWorkspaceVM.ts'],'READY_FOR_AUDIT'),
  s('O','UI / Interaction Design System','src/ui','PARTIAL','src/ui/index.ts',['N'],['UIContractV1'],['lib/theme.ts','components/stage5a/OutputWorkspace.tsx'],'READY_FOR_AUDIT'),
  s('P','Contextual Lookup','src/lookup','PARTIAL','src/lookup/index.ts',['B','K','T'],['LookupPortV1','ContextualLookupPortV2'],['components/learning/ContextualLookup.tsx'],'READY_FOR_AUDIT'),
  s('Q','Authentic Input / Materials','src/authentic-input','PRODUCTION_CORE','src/authentic-input/index.ts',['C','T','U'],['AuthenticInputPortV1','AuthenticInputBundleV1'],['src/domain/stage4/LearnerRuntimeV4.ts','app/daily-lesson.tsx','src/authentic-input/runtime.ts'],'READY_FOR_AUDIT'),
  s('R','General Product Policy','src/product-policy/general','PARTIAL','src/product-policy/general/index.ts',['A','B','C'],['ProductPolicyV1','GeneralPolicyDecisionV1'],['src/curriculum/goalPolicy.ts'],'READY_FOR_AUDIT'),
  s('S','Exam Product Policy','src/product-policy/exam','PARTIAL','src/product-policy/exam/index.ts',['A','B','C','K'],['ProductPolicyV1','ExamPolicyDecisionV1'],['src/assessment/formalIntegrity.ts'],'READY_FOR_AUDIT'),
  s('T','AI / Model Layer','src/model','PARTIAL','src/model/index.ts',[],['ModelGatewayV1','BoundedModelGatewayV1','ModelEndpointContractV1'],['lib/teacherApi.ts','coach-server'],'READY_FOR_AUDIT'),
  s('U','Persistence / Backend / Data','src/persistence','PRODUCTION_CORE','src/persistence/index.ts',['C'],['PersistencePortV1','OperationalCommandPortV1','OperationalHistoryReadPortV1'],['src/repositories','lib/supabase.ts'],'COMPLETE_FIRST_PASS'),
  s('V','Production Reliability','src/reliability','PARTIAL','src/reliability/index.ts',['T','U','M','N'],['ReliabilityStatusV1','ReliabilityPolicyV1','ProviderFailureV1','ReliabilityEventV1'],['lib/teacherApi.ts','coach-server/teacher-server.mjs'],'READY_FOR_AUDIT'),
  s('W','Analytics / Product Intelligence','src/analytics','SKELETON','src/analytics/index.ts',['A','C','E','M','V'],['AnalyticsEventV1']),
  s('X','Evaluation / QA / Research Harness','src/evaluation','PARTIAL','src/evaluation/index.ts',['B','C','D','E','F','G','H','I','J','K','L','M','N','O','V'],['EvaluationGateV1'],['tests','scripts/run-stage1-v4-architecture.cjs']),
  s('Y','Market / Commercial Validation Readiness','src/market-validation','FUTURE','src/market-validation/index.ts',['A','W','X'],['MarketValidationReadinessV1']),
]);

export function architectureSubsystemV1(id:string){return eotArchitectureRegistryV1.find(item=>item.id===id)}
