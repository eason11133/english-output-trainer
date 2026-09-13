import { EnglishFacet } from '../english/EnglishDomain';
import { Confidence } from '../teacher/TeacherRuntime';

export type CapabilityState =
  | 'UNKNOWN'
  | 'OBSERVED_FRAGILE'
  | 'ASSISTED_CONTROL'
  | 'INDEPENDENT_LOCAL_CONTROL'
  | 'TRANSFER_PENDING'
  | 'TRANSFER_SUPPORTED'
  | 'RETENTION_PENDING'
  | 'RETENTION_SUPPORTED';

export interface ProjectionUncertaintyV1 {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: readonly string[];
}

export interface CompetingHypothesisProjectionV1 {
  id: string;
  label: string;
  status: 'SUPPORTED' | 'POSSIBLE' | 'UNRESOLVED' | 'WEAKENED';
  sourceEvidenceIds: readonly string[];
}

export interface CapabilityProjection {
  targetRef: string;
  facet: EnglishFacet;
  senseId?: string;
  performanceDimension?: 'RECOGNITION' | 'PRODUCTION';
  state: CapabilityState;
  confidence: Confidence;
  supportDependence: 'UNKNOWN' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE_OBSERVED';
  sourceEvidenceIds: string[];
  sourceControl: boolean;
  transferSupport: boolean;
  retentionSupport: boolean;
  uncertainty?: ProjectionUncertaintyV1;
  hypotheses?: readonly CompetingHypothesisProjectionV1[];
  conditionReliability?: 'UNKNOWN' | 'LOW' | 'MEDIUM' | 'HIGH';
  latestEvidenceAt?: string;
  historicalIndependentControl?: boolean;
  currentAvailability?: 'UNSEEN'|'SUPPORTED'|'AVAILABLE'|'WEAKENING';
}

export interface InteractionProjection {
  strategy: string;
  domain: string;
  helped: number;
  noProgress: number;
  confused: number;
  confidence: Confidence;
  sourceEvidenceIds: string[];
}

export interface ExposureProjection {
  targetRef: string;
  kind: 'SEEN' | 'TAUGHT' | 'LOOKED_UP' | 'PRACTICED';
  count: number;
  sourceEvidenceIds: string[];
  isCapabilityEvidence: false;
}

export interface LearnerModelSnapshotV3 {
  learnerId: string;
  generatedFromEvidenceIds: string[];
  capabilitySlice: CapabilityProjection[];
  interactionSlice: InteractionProjection[];
  exposureSlice: ExposureProjection[];
  goalContext: Record<string, unknown>;
  projectionVersion?: number;
}
