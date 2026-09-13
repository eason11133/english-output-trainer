import type { ProductContextV1, LessonPlanV1 } from '../architecture/contracts';
import type { EnglishFacet } from '../domain/english/EnglishDomain';
import type { EnglishDomainArea, EnglishDomainPortV2 } from '../domain/english/EnglishDomainGraph';
import type { LearnerModelSnapshotV3, CapabilityState } from '../domain/learner/LearnerModelV3';
import type { LexicalTodayPrioritySignalV1 } from '../learner-truth/lexicalEncounter';

export type CurriculumFrontierV1='READY'|'REINFORCEMENT'|'TRANSFER'|'RETENTION'|'BLOCKED'|'MAINTENANCE';
export type CurriculumNeedKindV1='NEW_LEARNING'|'REPAIR'|'REACTIVATION'|'INDEPENDENCE'|'TRANSFER'|'RETENTION'|'MAINTENANCE';
export type CurriculumReasonCodeV1=
  |'GOAL_RELEVANT'
  |'USE_CONTEXT_RELEVANT'
  |'LEARNER_PRIORITY'
  |'EXAM_URGENCY'
  |'COVERAGE_GAP'
  |'OBSERVED_FRAGILE'
  |'SUPPORT_DEPENDENT'
  |'TRANSFER_UNVERIFIED'
  |'RETENTION_UNVERIFIED'
  |'HIGH_UNCERTAINTY'
  |'PREREQUISITE_MISSING'
  |'PREREQUISITE_READY'
  |'NEW_CAPABILITY'
  |'ALREADY_STABLE'
  |'INSUFFICIENT_SAMPLE'
  |'DIAGNOSTIC_PRIORITY'
  |'REAL_MOCK_LOSS'
  |'DEADLINE_AMPLIFIED_RECOVERABLE_LOSS'
  |'EXPECTED_GAIN_SUPPORTED'
  |'TRANSFER_CALIBRATION_WARNING';

export interface CurriculumCandidateV1 {
  targetRef:string;
  label:string;
  facet:EnglishFacet;
  area:EnglishDomainArea;
  learnerState:CapabilityState;
  frontier:CurriculumFrontierV1;
  needKind:CurriculumNeedKindV1;
  prerequisiteRefs:readonly string[];
  missingPrerequisiteRefs:readonly string[];
  score:number;
  reasonCodes:readonly CurriculumReasonCodeV1[];
  sourceEvidenceIds:readonly string[];
  latestEvidenceAt?:string;
  dueNow:boolean;
  sampleAdequacy:'INSUFFICIENT'|'ADEQUATE';
  allocationIntent:'LEARN'|'DIAGNOSE'|'TRANSFER_CALIBRATION';
}

export interface TimeArchitectureV1 {
  requestedMinutes:number;
  budgetMinutes:5|10|20|30|60;
  maxActiveFocuses:1|2|3|4;
  softStopAllowed:true;
  fixedSequence:false;
}

export interface TodayCurriculumPlanV1 {
  id:string;
  learnerId:string;
  productMode:'GENERAL'|'EXAM';
  generatedAt:string;
  time:TimeArchitectureV1;
  primaryFocus:CurriculumCandidateV1;
  reserveFocuses:readonly CurriculumCandidateV1[];
  blockedHighValue:readonly CurriculumCandidateV1[];
  reasonCodes:readonly CurriculumReasonCodeV1[];
  noFixedSequence:true;
  planVersion:1;
}

export interface CurriculumPlanningOptionsV1 {
  now?:string;
  retentionMinimumDelayHours?:number;
  deprioritizedTargetRefs?:readonly string[];
  lexicalEncounterSignals?:readonly LexicalTodayPrioritySignalV1[];
}

export interface CanonicalCurriculumPortV1 {
  candidates(
    context:ProductContextV1,
    truth:LearnerModelSnapshotV3,
    domain:EnglishDomainPortV2,
    options?:CurriculumPlanningOptionsV1,
  ):readonly CurriculumCandidateV1[];
  planToday(
    context:ProductContextV1,
    truth:LearnerModelSnapshotV3,
    domain:EnglishDomainPortV2,
    options?:CurriculumPlanningOptionsV1,
  ):Promise<TodayCurriculumPlanV1|null>;
  lessonPlan(today:TodayCurriculumPlanV1):LessonPlanV1;
}
