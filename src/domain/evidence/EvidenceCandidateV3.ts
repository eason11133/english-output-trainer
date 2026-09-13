import { CapabilityFacet } from '../english/EnglishDomain';
import { Confidence } from '../teacher/TeacherRuntime';
import { ProductionConditionsV1, SemanticProvenance, V3ContextNovelty } from '../task/TaskContract';

export type ProductionMode = 'INDEPENDENT' | 'SELF_REPAIR' | 'CUED' | 'GUIDED' | 'MODELED' | 'NOT_PRODUCTION';
export type EvidenceConditionReliabilityV1 = 'UNKNOWN' | 'LOW' | 'MEDIUM' | 'HIGH';
export type EvidencePerformanceDimensionV1 = 'RECOGNITION' | 'PRODUCTION';

export interface EvidenceProvenanceV1 {
  observationId?: string;
  artifactId?: string;
  taskId?: string;
  episodeId?: string;
  rawTargetRef?: string;
  canonicalTargetRef?: string;
  semanticProvenance: SemanticProvenance;
  productionMode: ProductionMode;
  supportBeforeResponse: EvidenceCandidateV3['supportBeforeResponse'];
  contextNovelty: EvidenceCandidateV3['contextNovelty'];
  taskAffordanceChecked: boolean;
  opportunityPresent?: boolean;
  productionConditions?: ProductionConditionsV1;
}

export interface EvidenceUncertaintyV1 {
  classificationConfidence: Confidence;
  competingExplanations: readonly string[];
  unresolved: boolean;
}

export interface EvidenceCandidateV3 {
  candidateKind: 'CAPABILITY' | 'RESPONSIVENESS' | 'NO_CAPABILITY_EVIDENCE' | 'OCR_CORRECTION' | 'GOAL_CONTEXT';
  observation: string;
  capabilityDomain?: string | null;
  capabilityFacet?: CapabilityFacet | null;
  evidenceEligibility: 'ELIGIBLE' | 'CONDITIONAL' | 'INELIGIBLE';
  evidencePolarity: 'POSITIVE' | 'NEGATIVE' | 'MIXED' | 'UNKNOWN' | 'NOT_APPLICABLE';
  evidenceScope: 'LOCAL' | 'WHOLE_OUTPUT' | 'INTERACTION_ONLY' | 'NOT_APPLICABLE';
  productionMode: ProductionMode;
  supportBeforeResponse: 'NONE' | 'LIGHT' | 'MEDIUM' | 'EXPLICIT' | 'MODEL' | 'UNKNOWN';
  semanticProvenance: SemanticProvenance;
  contextNovelty: V3ContextNovelty | 'NOT_APPLICABLE';
  confidence: Confidence;
  competingExplanations: readonly string[];
  guardNotes?: string[];
  taskId?: string | null;
  targetRef?: string | null;
  senseId?: string;
  /** What the observed task actually elicited. Recognition is never projected as productive control. */
  performanceDimension?: EvidencePerformanceDimensionV1;
  taskAffordanceChecked: boolean;
  observableAction?: string;
  artifactId?: string;
  episodeId?: string;
  observationId?: string;
  opportunityPresent?: boolean;
  productionConditions?: ProductionConditionsV1;
}

export interface CanonicalEvidenceEventV3 extends EvidenceCandidateV3 {
  id: string;
  schemaVersion: 3;
  learnerId: string;
  occurredAt: string;
  immutable: true;
  canonicalTargetRef?: string;
  dedupKey?: string;
  provenance?: EvidenceProvenanceV1;
  uncertainty?: EvidenceUncertaintyV1;
  conditionReliability?: EvidenceConditionReliabilityV1;
}
