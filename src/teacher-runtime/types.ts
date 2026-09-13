import type { LessonPlanV1, ProductContextV1 } from '../architecture/contracts';
import type { CapabilityProjection, CompetingHypothesisProjectionV1, LearnerModelSnapshotV3 } from '../domain/learner/LearnerModelV3';
import type { CapabilityFacet } from '../domain/english/EnglishDomain';
import type { BlockSupportV4, TeacherBlockDecisionV4 } from '../domain/v4/LearningBlockV4';
import type { QualifiedBlockSelectionV4 } from '../application/stage4/blockDecisionAdapterV4';
import type { ContingentSupportPolicyV1, DeploymentStageV1, ElicitationConditionV1, FeedbackTimingV1, ProductionBottleneckHypothesisV1, TaskLoadAttributionV1, TeacherCompositionPlanV1, TeachingResponseSignalV1, TreatmentConfoundV1, TreatmentResponseStrengthV1 } from '../teaching/types';
import type { ProductionConditionsV1 } from '../domain/task/TaskContract';

export const legalTeacherActionsV1=['NONE','WAIT','ASK','TEACH','REPAIR','PRACTICE','CHECK','RETURN_TO_TASK','STOP','EXIT'] as const;
export type LegalTeacherActionV1=typeof legalTeacherActionsV1[number];
export type LearnerOutcomeV1='NOT_EVALUATED'|'EXPOSURE_ONLY'|'HELP_WITHOUT_ATTEMPT'|'SUCCESS'|'PARTIAL'|'FAILURE'|'ABANDONED';
export type PedagogicalEventKindV1='LESSON_STARTED'|'LEARNER_RESPONSE'|'LEARNER_MANIPULATION'|'HELP_REQUESTED'|'SUPPORT_REVEALED'|'SUPPORT_REDUCTION_REQUESTED'|'SOURCE_CLARIFIED'|'TIME_EXHAUSTED'|'RESUMED'|'SYSTEM_EVENT';
export interface PedagogicalEventV1{id:string;kind:PedagogicalEventKindV1;occurredAt:string;outcome:LearnerOutcomeV1;support:BlockSupportV4;observationIds:readonly string[];attemptId?:string;learnerIntent?:'ORDINARY_SUPPORT'|'IMPASSE_REPLAN'|'TRY_INDEPENDENT';productionConditions?:ProductionConditionsV1}
export interface TreatmentResponseV1{mechanismId:string;support:BlockSupportV4;outcome:LearnerOutcomeV1;eventId:string;occurredAt:string;responseSignal?:TeachingResponseSignalV1;feedbackTiming?:FeedbackTimingV1;taskLoadAttribution?:TaskLoadAttributionV1;learnerActionObserved?:boolean;targetRef?:string;facet?:CapabilityFacet;contextFamily?:string;learnerStateBand?:CapabilityProjection['state'];strength?:TreatmentResponseStrengthV1;confounds?:readonly TreatmentConfoundV1[]}
export interface PedagogicalContextV1{
  lessonPlan:LessonPlanV1;
  sourceTaskContext?:Readonly<Record<string,unknown>>;
  product:Pick<ProductContextV1,'learnerId'|'goals'|'learningPurpose'|'useContexts'|'currentPriority'|'productMode'>;
  targetProjection?:CapabilityProjection;
  prerequisites:readonly {targetRef:string;projection?:CapabilityProjection}[];
  competingHypotheses:readonly CompetingHypothesisProjectionV1[];
  recentAttempts:readonly PedagogicalEventV1[];
  recentTreatmentResponses:readonly TreatmentResponseV1[];
  teaching?:{
    bottleneckHypotheses:readonly ProductionBottleneckHypothesisV1[];
    preferredMechanismIds:readonly string[];
    supportPolicy:ContingentSupportPolicyV1;
    learnerAction:string;
    fadeConditions:readonly string[];
    replanConditions:readonly string[];
    stopConditions:readonly string[];
    elicitation:ElicitationConditionV1;
    deploymentStage:DeploymentStageV1;
    pckAssets:readonly {assetId:string;kind:string;mechanismIds:readonly string[];sourceKind:string;sourceId:string}[];
  };
  timeRemainingMinutes:number;
  sourceEvidenceIds:readonly string[];
  compiledAt:string;
}
export interface InnerTutorProposalV1 extends QualifiedBlockSelectionV4{teacherAction?:string;lessonPlanId?:string;providerReceipt?:{provider:'OpenAI';callId:string;model:string;responseId:string;latencyMs?:number;inputTokens?:number;outputTokens?:number}}
export interface TeacherModelCallTelemetryV1{route:'MODEL_REQUIRED'|'DETERMINISTIC_CONTINUATION'|'AVOIDED_MODEL_CALL';reason:string}
export interface TeacherDecisionProvenanceV1{lessonPlanId:string;decisionPointId:string;targetRef:string;facet:string;sourceEvidenceIds:readonly string[];observationIds:readonly string[];supportBeforeDecision:BlockSupportV4;selectedMechanismId:string;reasonCodes:readonly string[];provider:'AI'|'DETERMINISTIC_FALLBACK'|'FALLBACK_AFTER_REJECTION';rejectionReasons:readonly string[];modelCall?:TeacherModelCallTelemetryV1;providerReceipt?:InnerTutorProposalV1['providerReceipt']}
export interface TeacherExperienceRequestV1{kind:'NO_INTERVENTION'|'QUESTION'|'LEARNING_BLOCK'|'RETURN_TO_TASK'|'SESSION_STOP';action:LegalTeacherActionV1;mechanismId?:string;support:BlockSupportV4;internalReasoningVisible:false;narrator?:{state:'ENTER'|'FOCUS'|'GUIDE'|'ACKNOWLEDGE'|'CHANGE_APPROACH'|'FADE'|'RETURN';message:string}}
export interface TeacherDecisionLineageV1{context:PedagogicalContextV1;proposal:InnerTutorProposalV1;qualification:{accepted:true;reasonCodes:readonly string[];validatorVersion:'E_INNER_TUTOR_V1'}}
export interface QualifiedInnerTutorDecisionV1{action:LegalTeacherActionV1;blockDecision:TeacherBlockDecisionV4;provenance:TeacherDecisionProvenanceV1;experience:TeacherExperienceRequestV1;reused:boolean;composition?:TeacherCompositionPlanV1;treatmentResponse?:TreatmentResponseV1;lineage?:TeacherDecisionLineageV1}
export interface InnerTutorDecisionInputV1{lessonPlan:LessonPlanV1;sourceTaskContext?:Readonly<Record<string,unknown>>;productContext:ProductContextV1;learnerTruth:LearnerModelSnapshotV3;event:PedagogicalEventV1;recentAttempts:readonly PedagogicalEventV1[];recentTreatmentResponses:readonly TreatmentResponseV1[];timeRemainingMinutes:number;currentDecision?:TeacherBlockDecisionV4;currentProvenance?:TeacherDecisionProvenanceV1;provider:(context:PedagogicalContextV1)=>Promise<InnerTutorProposalV1>}
