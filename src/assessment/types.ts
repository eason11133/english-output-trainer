import type { EvidenceCandidateV3 } from '../domain/evidence/EvidenceCandidateV3';
import type { TaskContract } from '../domain/task/TaskContract';

export type MeasurementProofClassV1=
  | 'NO_CAPABILITY_PROOF'
  | 'ASSISTED_PRACTICE'
  | 'LOCAL_INDEPENDENT'
  | 'FRESH_INDEPENDENT'
  | 'CHANGED_CONTEXT_TRANSFER'
  | 'DELAYED_RETENTION';

export type MeasurementUncertaintyV1='NONE'|'BOUNDED'|'MATERIAL';

export interface MeasurementQualificationV1{
  eligible:boolean;
  proofClass:MeasurementProofClassV1;
  independent:boolean;
  fresh:boolean;
  transfer:boolean;
  delayed:boolean;
  abstained:boolean;
  uncertainty:MeasurementUncertaintyV1;
  reasons:readonly string[];
  warnings:readonly string[];
}

export interface MeasurementQualificationInputV1{
  candidate:EvidenceCandidateV3;
  task:TaskContract|null;
  occurredAt?:string;
}

export interface FormalAssessmentIntegritySnapshotV1{
  mode:'FORMAL_EXAM';
  hintsAvailable:boolean;
  answerRevealAvailable:boolean;
  lookupAvailable:boolean;
  modelAnswerVisible:boolean;
  midAttemptTeachingOccurred:boolean;
  integrityRef:string;
}

export interface FormalAssessmentIntegrityResultV1{
  valid:boolean;
  reasons:readonly string[];
}
