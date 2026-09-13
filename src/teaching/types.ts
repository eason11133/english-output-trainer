import type { CapabilityFacet } from '../domain/english/EnglishDomain';
import type { EnglishDomainArea, EnglishDomainNodeKind } from '../domain/english/EnglishDomainGraph';
import type { CapabilityState, CompetingHypothesisProjectionV1 } from '../domain/learner/LearnerModelV3';
import type { BlockSupportV4, PedagogicalRoleV4 } from '../domain/v4/LearningBlockV4';
import type { AssistanceStrengthV1 as DomainAssistanceStrengthV1, ElicitationConditionV1 as DomainElicitationConditionV1, MultidimensionalAssistanceV1 as DomainMultidimensionalAssistanceV1, ProductionConditionsV1 } from '../domain/task/TaskContract';

export type ProductionBottleneckKindV1 =
  | 'REPRESENTATION'
  | 'MEANING_FORM_MAPPING'
  | 'OPPORTUNITY_RECOGNITION'
  | 'RETRIEVAL'
  | 'SELECTION'
  | 'LEXICAL_SLOT_FILLING'
  | 'FORM_ASSEMBLY'
  | 'COMPETING_REPRESENTATION'
  | 'DEPLOYMENT_UNDER_LOAD'
  | 'MONITORING_SELF_REPAIR'
  | 'UNKNOWN';

export type BottleneckHypothesisStatusV1='SUPPORTED'|'POSSIBLE'|'UNRESOLVED'|'WEAKENED';
export interface ProductionBottleneckHypothesisV1{
  kind:ProductionBottleneckKindV1;
  status:BottleneckHypothesisStatusV1;
  reasonCodes:readonly string[];
  sourceHypothesisIds:readonly string[];
}

export type ElicitationConditionV1=DomainElicitationConditionV1;
export type AssistanceStrengthV1=DomainAssistanceStrengthV1;
export type MultidimensionalAssistanceV1=DomainMultidimensionalAssistanceV1;

export type TeachingPrimitiveV1=
  |'SELECT'|'MATCH'|'ORDER'|'MARK'|'COMPLETE'|'RECALL'|'CONSTRUCT'|'PRODUCE'|'REPAIR'|'COMPARE'|'EXPLAIN'|'PLAN'|'FULL_TASK';

export type TeachingResponseSignalV1='HELPED'|'NO_PROGRESS'|'CONFUSED'|'SELF_REPAIRED'|'ASSISTED_SUCCESS'|'INDEPENDENT_SUCCESS'|'FAILURE'|'UNKNOWN';
export type TreatmentResponseStrengthV1='TR_OBSERVED_RESPONSE'|'TR_CONTEXTUAL_PREFERENCE_SIGNAL'|'TR_STRONG_LOCAL_EFFECT_SIGNAL';
export type TreatmentConfoundV1='EASIER_TASK'|'MORE_SUPPORT'|'ANSWER_OR_MODEL_EXPOSURE'|'REPEATED_RETRIEVAL'|'CHANGED_LOAD'|'MORE_TIME'|'CHANGED_ASSESSMENT'|'MULTIPLE_MECHANISMS_CHANGED'|'CHANGED_CONTEXT_FAMILIARITY'|'UNRESOLVED';
export interface TeachingTreatmentObservationV1{
  mechanismId:string;
  support:BlockSupportV4;
  outcome:'NOT_EVALUATED'|'EXPOSURE_ONLY'|'HELP_WITHOUT_ATTEMPT'|'SUCCESS'|'PARTIAL'|'FAILURE'|'ABANDONED';
  responseSignal?:TeachingResponseSignalV1;
  occurredAt?:string;
  feedbackTiming?:FeedbackTimingV1;
  taskLoadAttribution?:TaskLoadAttributionV1;
  learnerActionObserved?:boolean;
  targetRef?:string;
  facet?:CapabilityFacet;
  contextFamily?:string;
  learnerStateBand?:CapabilityState;
  strength?:TreatmentResponseStrengthV1;
  confounds?:readonly TreatmentConfoundV1[];
}

export type AdaptiveAssistanceLevelV1='H0_NO_HELP'|'H1_ORIENTATION'|'H2_BROAD_ACTION_PROMPT'|'H3_DIRECTED_HINT'|'H4_PARTIAL_COMPLETION_OR_CONTRAST'|'H5_EXPLICIT_MODEL_OR_BOTTOM_OUT';
export type AdaptiveEpisodeActionV1='CONTINUE_CURRENT_PIECE'|'FADE_SUPPORT'|'RECOMPOSE_DIFFERENT_MECHANISM'|'CHECK_PREREQUISITE'|'REDUCE_TARGET_GRANULARITY'|'REDUCE_TASK_LOAD'|'DEFER_TARGET'|'RETURN_TO_SOURCE'|'STOP_NO_FURTHER_INTERVENTION';
export type FeedbackTimingV1='IMMEDIATE_BOUNDED'|'RETRIEVE_THEN_IMMEDIATE'|'AFTER_OUTPUT_CHUNK'|'DEFER_LOW_PRIORITY'|'LATER_REENCOUNTER';
export type TaskLoadDimensionV1='LEXICAL'|'SYNTACTIC'|'PROPOSITION_REASONING'|'CONTEXT_DIVERSITY'|'RESPONSE_GENERATION'|'DISTRACTOR_COMPETITION'|'EVIDENCE_DISTANCE'|'TIME_PRESSURE'|'SUPPORT_REMOVAL';
export type TaskLoadAttributionV1='TARGET_KNOWLEDGE'|'TASK_LOAD_CONFOUND'|'MIXED'|'UNRESOLVED';
export interface AdaptiveTeacherEpisodeDecisionV1{action:AdaptiveEpisodeActionV1;assistanceLevel:AdaptiveAssistanceLevelV1;support:BlockSupportV4;feedbackTiming:FeedbackTimingV1;taskLoadAttribution:TaskLoadAttributionV1;loadDimensions:readonly {dimension:TaskLoadDimensionV1;level:'LOW'|'MEDIUM'|'HIGH'|'UNKNOWN'}[];changeOneMajorLoadDimension:boolean;learnerActionRequired:boolean;reasonCodes:readonly string[];canWriteMastery:false;canQualifyEvidence:false}

export type TeachingOpportunityConditionsV1=ProductionConditionsV1;

export interface TeachingRequestV1{
  targetRef:string;
  facet:CapabilityFacet;
  targetArea:EnglishDomainArea;
  targetKind:EnglishDomainNodeKind;
  learnerState?:CapabilityState;
  supportDependence?:'UNKNOWN'|'HIGH'|'MEDIUM'|'LOW'|'NONE_OBSERVED';
  prerequisiteWeakness?:boolean;
  learnerRequestedIndependentAttempt?:boolean;
  competingHypotheses:readonly CompetingHypothesisProjectionV1[];
  current:{
    outcome:'NOT_EVALUATED'|'EXPOSURE_ONLY'|'HELP_WITHOUT_ATTEMPT'|'SUCCESS'|'PARTIAL'|'FAILURE'|'ABANDONED';
    support:BlockSupportV4;
    eventKind:string;
  };
  conditions:TeachingOpportunityConditionsV1;
  recentTreatment:readonly TeachingTreatmentObservationV1[];
  contextFamily?:string;
}

export interface PckMechanismV1{
  id:string;
  label:string;
  suitableAreas:readonly EnglishDomainArea[];
  suitableKinds:readonly EnglishDomainNodeKind[];
  suitableFacets:readonly CapabilityFacet[];
  suitableBottlenecks:readonly ProductionBottleneckKindV1[];
  primitives:readonly TeachingPrimitiveV1[];
  requiredLearnerAction:string;
  applicability:string;
  inappropriateWhen:readonly string[];
  expectedResponseSignals:readonly TeachingResponseSignalV1[];
  fadeConditions:readonly string[];
  replanConditions:readonly string[];
  stopConditions:readonly string[];
  contentRequirements:readonly TeachingContentRequirementKindV1[];
  supportProgression:readonly string[];
  answerExposureConstraint:'NO_DIRECT_ANSWER'|'ANSWER_ONLY_AFTER_LEARNER_COMMITMENT';
}
export type TeachingContentRequirementKindV1='LEXICAL_IDENTITY'|'SENSE_EVIDENCE'|'MORPHOLOGY_EVIDENCE'|'EXAMPLE'|'SENTENCE_PAIR'|'CURATED_SEMANTIC_TASK';

export interface MechanismSuitabilityV1{
  mechanismId:string;
  admissible:boolean;
  score:number;
  reasonCodes:readonly string[];
  contraindications:readonly string[];
}

export type DeploymentStageV1='CONTROLLED_CONSTRUCTION'|'FUNCTION_CUED_RETRIEVAL'|'OPEN_CHOICE_RETRIEVAL'|'AUTHENTIC_DEPLOYMENT'|'UNKNOWN';
export type SupportTransitionV1='HOLD'|'FADE'|'INCREASE'|'RESET_FOR_NEW_REPRESENTATION'|'FRESH_CHECK'|'NONE';
export interface ContingentSupportPolicyV1{
  recommendedSupport:BlockSupportV4;
  transition:SupportTransitionV1;
  reasonCodes:readonly string[];
  requiresRepresentationChange:boolean;
  nextElicitation:ElicitationConditionV1;
  nextEvidenceCeiling:'NONE'|'EXPOSURE_ONLY'|'ASSISTED'|'FRESH_INDEPENDENT';
}
export interface TeachingOptionsV1{
  targetRef:string;
  facet:CapabilityFacet;
  bottleneckHypotheses:readonly ProductionBottleneckHypothesisV1[];
  admissibleMechanisms:readonly MechanismSuitabilityV1[];
  preferredMechanismIds:readonly string[];
  assistance:MultidimensionalAssistanceV1;
  elicitation:ElicitationConditionV1;
  deploymentStage:DeploymentStageV1;
  supportPolicy:ContingentSupportPolicyV1;
  feedbackBudget:{maxConcurrentTargets:1;rationale:string};
  learnerAction:string;
  fadeConditions:readonly string[];
  replanConditions:readonly string[];
  stopConditions:readonly string[];
}

export type TeacherCompositionPieceKindV1='REPRESENT'|'GUIDED_ACTION'|'SUPPORTED_PRACTICE'|'FADE_SUPPORT'|'FRESH_ATTEMPT'|'RETURN_TO_OUTPUT';
export interface TeacherCompositionPieceV1{id:string;kind:TeacherCompositionPieceKindV1;blockId:string;mechanismId?:string;learnerAction:string;support:BlockSupportV4;advanceWhen:readonly TeachingResponseSignalV1[];recomposeWhen:readonly TeachingResponseSignalV1[];evidenceCeiling:string}
export interface TeacherCompositionPlanV1{schemaVersion:1;planId:string;targetRef:string;facet:CapabilityFacet;pieces:readonly TeacherCompositionPieceV1[];cursor:number;status:'ACTIVE'|'RECOMPOSED'|'RETURN_READY'|'STOPPED';excludedMechanismIds:readonly string[];createdAt:string;updatedAt:string;masteryMutationAllowed:false}

export interface TeachingModeV1{
  blockId:string;
  role:PedagogicalRoleV4;
  primitive:TeachingPrimitiveV1;
  evidenceCeiling:string;
  exposesTargetAnswer:boolean;
  suitableFacets:readonly CapabilityFacet[];
}

export interface TaskGenerationNeedFromFV1{
  targetRef:string;
  facet:CapabilityFacet;
  purpose:'CONTROLLED_CONSTRUCTION'|'OPPORTUNITY_RECOGNITION'|'RETRIEVAL'|'DISCRIMINATION'|'DEPLOYMENT'|'REPAIR';
  elicitation:ElicitationConditionV1;
  targetNameVisible:boolean;
  functionCueVisible:boolean;
  recentModelPrimeAllowed:boolean;
  desiredContext:'SAME_CONTEXT'|'CHANGED_CONTEXT'|'SOURCE';
  validAlternatives:'ACCEPT';
  observationWanted:string;
}
