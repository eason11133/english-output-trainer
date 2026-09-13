import type { WritingDeliveredTaskV1, WritingTaskGenerationNeedV1 } from '../../content/types';
export type { WritingDeliveredTaskV1, WritingTaskGenerationNeedV1 } from '../../content/types';
import type { LessonPlanV1 } from '../../architecture/contracts';
import type { CapabilityFacet } from '../../domain/english/EnglishDomain';
import type { ProductionConditionsV1 } from '../../domain/task/TaskContract';

export type WritingSourceTypeV1='SCHOOL'|'EXAM'|'TEACHER'|'TUTORING'|'SELF_CHOSEN'|'REAL_WORLD'|'UNSPECIFIED_AUTHENTIC'|'GENERATED_FALLBACK';
export type WritingInterpretationConfidenceV1='LOW'|'MEDIUM'|'HIGH';
export type WritingIssueImpactV1='TASK_BLOCKING'|'MEANING_BLOCKING'|'HIGH'|'MEDIUM'|'LOW';
export type WritingIssueScopeV1='GLOBAL'|'PARAGRAPH'|'SENTENCE'|'PHRASE'|'TOKEN';
export type WritingDimensionV1=
  |'TASK_FULFILLMENT'|'PURPOSE_AUDIENCE_GENRE'|'IDEA_AVAILABILITY'|'REASONING_DEPTH'|'PLANNING'|'ORGANIZATION'|'COHERENCE'|'COHESION'
  |'MEANING_ENCODING'|'SENTENCE_REALIZATION'|'LEXICAL_SELECTION'|'COLLOCATION'|'GRAMMAR_CONSTRUCTION'|'REFERENCE'|'MECHANICS'|'MONITORING_SELF_REPAIR';

export interface WritingSourceContextV1{
  promptArtifactId:string;
  promptText:string;
  sourceType:WritingSourceTypeV1;
  purpose:string;
  audience:string;
  genre:string;
  taskRequirements:readonly string[];
  rubricRefs:readonly string[];
  formatConstraints:readonly string[];
  timeLimitMinutes?:number;
  wordGuidance?:{minimum?:number;maximum?:number;recommended?:number};
  examContext?:{examType?:string;rubricId?:string};
  interpretationConfidence:WritingInterpretationConfidenceV1;
  learnerConfirmed:boolean;
}

export type WritingIntentProvenanceV1='LEARNER_STATED'|'TEXT_INFERRED'|'PROMPT_SUPPORTED'|'TEACHER_HYPOTHESIS'|'SHARED_CONFIRMED';
export interface WritingIntentUnitV1{
  unitId:string;
  sourceSpan:{start:number;end:number};
  intendedMeaning:string;
  provenance:WritingIntentProvenanceV1;
  confidence:WritingInterpretationConfidenceV1;
}

export interface WritingOpportunityCandidateV1{
  candidateId:string;
  writingDimension:WritingDimensionV1;
  sourceSpan?:{start:number;end:number};
  paragraphId?:string;
  sentenceId?:string;
  targetRefs:readonly string[];
  facets:readonly CapabilityFacet[];
  impact:WritingIssueImpactV1;
  scope:WritingIssueScopeV1;
  confidence:WritingInterpretationConfidenceV1;
  reasonCodes:readonly string[];
  evidenceRefs:readonly string[];
  learnerIntentRequired:boolean;
  rubricRelevance:readonly string[];
  possibleBottlenecks:readonly string[];
}

export type WritingRevisionActorV1='LEARNER'|'LEARNER_ASSISTED'|'AI_SUGGESTION'|'TEACHER_MODEL'|'SYSTEM';
export type WritingRevisionOperationKindV1='INSERT'|'DELETE'|'REPLACE'|'MOVE'|'SPLIT'|'MERGE';
export interface WritingRevisionOperationV1{
  operationId:string;
  revisionId:string;
  actor:WritingRevisionActorV1;
  operation:WritingRevisionOperationKindV1;
  sourceSpan?:{start:number;end:number};
  before:string;
  after:string;
  occurredAt:string;
  productionConditions?:ProductionConditionsV1;
  reasonRef?:string;
  visibleBeforeResponse?:readonly string[];
}
export interface WritingRevisionVersionV1{
  revisionId:string;
  originalArtifactId:string;
  parentRevisionId?:string;
  author:'LEARNER'|'LEARNER_ASSISTED'|'AI'|'TEACHER'|'SYSTEM';
  text:string;
  operations:readonly WritingRevisionOperationV1[];
  createdAt:string;
  immutable:boolean;
}

export interface WritingArtifactContextV1{
  originalArtifactId:string;
  originalRevisionId:string;
  workingRevisionId:string;
  revisions:readonly WritingRevisionVersionV1[];
  learnerIntentNotes:readonly WritingIntentUnitV1[];
}

export interface WritingTeachingContextV1{
  lessonPlan:LessonPlanV1;
  sourceContext:WritingSourceContextV1;
  originalArtifactRef:string;
  workingRevisionRef:string;
  focusCandidate:WritingOpportunityCandidateV1;
  localTextWindow:string;
  paragraphFunction?:string;
  learnerIntent?:WritingIntentUnitV1;
  rubricRelevance:readonly string[];
  revisionHistory:readonly WritingRevisionOperationV1[];
  allowedLearnerActions:readonly ('SELECT'|'ORDER'|'ADD_IDEA'|'REWRITE_SPAN'|'MOVE_SPAN'|'CONSTRUCT'|'PRODUCE')[];
}


export interface WritingAnalyticObservationV1{
  observationId:string;
  writingDimension:WritingDimensionV1;
  sourceSpan?:{start:number;end:number};
  statement:string;
  confidence:WritingInterpretationConfidenceV1;
  rubricRefs:readonly string[];
  targetRefs:readonly string[];
  capabilityClaimAllowed:false;
  examScoreAllowed:false;
}
