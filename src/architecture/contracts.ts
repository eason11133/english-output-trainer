import { CanonicalEvidenceEventV3, EvidenceCandidateV3 } from '../domain/evidence/EvidenceCandidateV3';
import { EnglishDomainObject } from '../domain/english/EnglishDomain';
import { LearnerModelSnapshotV3 } from '../domain/learner/LearnerModelV3';
import { OriginalArtifactV4, Stage4RuntimeV4 } from '../domain/stage4/LearnerRuntimeV4';
import { TeacherBlockDecisionV4 } from '../domain/v4/LearningBlockV4';

export interface ExamSchedulingResultV1{section:'VOCABULARY'|'CLOZE'|'WORD_BANK'|'DISCOURSE_STRUCTURE'|'READING_COMPREHENSION'|'MIXED_FORMAT'|'ZH_EN_TRANSLATION'|'ENGLISH_COMPOSITION';lost:number;maximum:number;reportedAt:string;evidenceEligible:false}
export interface ProductContextV1 { learnerId:string; goals:readonly string[]; learningPurpose:string; useContexts:readonly string[]; currentPriority?:string; studyMinutes:number; productMode:'GENERAL'|'EXAM'; entitlement:{status:'UNKNOWN'|'NOT_ENTITLED'|'TRIAL'|'ACTIVE'|'DEVELOPMENT';source:string;planId:string}; examContext?:{examType?:string;scope:string;deadline?:string;rubric?:string;targetScore?:string;schedulingResults?:readonly ExamSchedulingResultV1[]}; }
export interface EnglishDomainPortV1 { get(id:string):EnglishDomainObject|undefined; prerequisites(id:string):readonly string[]; }
export interface LearnerTruthPortV1 { appendCandidate(candidate:EvidenceCandidateV3):Promise<CanonicalEvidenceEventV3|undefined>; evidence(learnerId:string):Promise<readonly CanonicalEvidenceEventV3[]>; project(learnerId:string):Promise<LearnerModelSnapshotV3>; }
export interface LessonPlanV1 { id:string; learnerId:string; targetRef:string; facet:string; senseId?:string; needKind:string; objective:string; reason:string; reasonCodes:readonly string[]; timeBudgetMinutes:number; productMode:'GENERAL'|'EXAM'; }
export interface CurriculumPortV1 { planToday(context:ProductContextV1, truth:LearnerModelSnapshotV3):Promise<LessonPlanV1|null>; }
export interface TeacherDecisionContextV1 { product:ProductContextV1; lesson:LessonPlanV1; learnerTruth:LearnerModelSnapshotV3; runtime:Stage4RuntimeV4; latestObservation?:unknown; }
export interface InnerTutorPortV1 { decide(context:TeacherDecisionContextV1):Promise<TeacherBlockDecisionV4>; }
export interface TeachingMechanismPortV1 { validate(decision:TeacherBlockDecisionV4):readonly string[]; }
export interface GeneratedTaskV1 { id:string; prompt:string; targetRefs:readonly string[]; changedContext:boolean; validated:boolean; }
export interface ContentGenerationPortV1 { createFreshTask(plan:LessonPlanV1):Promise<GeneratedTaskV1>; }
export interface SpecializedTeacherRuntimeV1 { domain:'WRITING'|'TRANSLATION'|'VOCABULARY'|'CHUNKS'|'GRAMMAR'|'READING'; supports(plan:LessonPlanV1):boolean; }
export interface MeasurementDecisionV1 { eligible:boolean; independent:boolean; transfer:boolean; delayed:boolean; reasons:readonly string[]; }
export interface AssessmentPortV1 { qualify(candidate:EvidenceCandidateV3):MeasurementDecisionV1; }
export interface ReencounterNeedV1 { targetRef:string; kind:'TRANSFER'|'DELAYED'|'RETENTION'; dueAt:string; }
export interface LongitudinalPortV1 { due(learnerId:string, now:string):Promise<readonly ReencounterNeedV1[]>; }
export interface LessonSessionPortV1 { hydrate(learnerId:string):Promise<Stage4RuntimeV4|null>; save(runtime:Stage4RuntimeV4):Promise<void>; pause(runtime:Stage4RuntimeV4):Promise<void>; }
export interface LessonSessionLifecycleV1 { canResume(runtime:Stage4RuntimeV4):boolean; pause(runtime:Stage4RuntimeV4,now?:string):Stage4RuntimeV4; resume(runtime:Stage4RuntimeV4,now?:string):Stage4RuntimeV4; background(runtime:Stage4RuntimeV4,now?:string):Stage4RuntimeV4; foreground(runtime:Stage4RuntimeV4,now?:string):Stage4RuntimeV4; closeReturned(runtime:Stage4RuntimeV4,now?:string):Stage4RuntimeV4; actionIdentity(input:{runtime:Stage4RuntimeV4;type:string;taskId?:string;response?:string}):Promise<string>; }
export type LearnerRouteV1='ONBOARDING'|'TODAY'|'PRACTICE'|'LESSON'|'RESULT'|'MY_ENGLISH'|'PROGRESS_HISTORY'|'PROFILE';
export type ExperienceExecutionActionV1='NONE'|'WAIT'|'LEARNING_BLOCK'|'RETURN_TO_TASK'|'STOP'|'EXIT';
export interface ExperienceContractV1 { route:LearnerRouteV1; title:string; dominantAction?:{label:string;action:string}; state:'READY'|'EMPTY'|'LOADING'|'ERROR'; internalReasoningVisible:false; execution:{action:ExperienceExecutionActionV1;blockDecision?:TeacherBlockDecisionV4;provenance:{lessonPlanId:string;decisionPointId:string;targetRef:string;facet:string;sourceEvidenceIds:readonly string[];observationIds:readonly string[];supportBeforeDecision:string;selectedMechanismId:string;reasonCodes:readonly string[];provider:'AI'|'DETERMINISTIC_FALLBACK'|'FALLBACK_AFTER_REJECTION';rejectionReasons:readonly string[]}}; }
export interface UIContractV1 { learnerShellMaxWidth:number; lessonCanvasMaxWidth:number; minimumTouchTarget:number; supportsKeyboard:boolean; supportsSafeArea:boolean; }
export interface LookupPortV1 { lookup(text:string, context:string):Promise<readonly {label:string;meaningZhTw:string}[]>; locked:boolean; }
export interface AuthenticInputPortV1 { createArtifact(input:Omit<OriginalArtifactV4,'schemaVersion'|'immutable'>):OriginalArtifactV4; }
export interface ProductPolicyV1 { mode:'GENERAL'|'EXAM'; prioritize(context:ProductContextV1, truth:LearnerModelSnapshotV3):readonly string[]; }
export interface ModelGatewayV1 { requestStructured<T>(operation:string,input:unknown):Promise<T>; }
export interface PersistencePortV1 { learnerTruth:LearnerTruthPortV1; lessons:LessonSessionPortV1; }
export interface ReliabilityStatusV1 { network:'UNKNOWN'|'AVAILABLE'|'UNAVAILABLE'; model:'UNKNOWN'|'AVAILABLE'|'UNAVAILABLE'; deviceIme:'UNVERIFIED'|'PASS'|'FAIL'; }
export interface AnalyticsEventV1 { name:string; occurredAt:string; learnerId?:string; properties:Readonly<Record<string,unknown>>; }
export interface EvaluationGateV1 { id:string; run():Promise<{passed:boolean;reasons:readonly string[]}>; }
export interface MarketValidationReadinessV1 { realEvidenceOnly:true; status:'NOT_STARTED'|'PLANNED'|'IN_PROGRESS'|'COMPLETE'; }
