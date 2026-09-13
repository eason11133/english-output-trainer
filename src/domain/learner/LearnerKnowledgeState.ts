export type LearnerKnowledgeStage = 'NEW' | 'RECOGNIZED' | 'RETRIEVING' | 'ASSISTED_USE' | 'INDEPENDENT_USE' | 'TRANSFER' | 'STABLE' | 'FRAGILE';

export interface LearnerKnowledgeState {
  learnerId: string;
  knowledgePointId: string;
  stage: LearnerKnowledgeStage;
  recognitionProofs: number;
  independentRecallProofs: number;
  assistedProductionProofs: number;
  independentProductionProofs: number;
  transferProofs: number;
  delayedProofs: number;
  hintDependencyScore: number;
  recurrenceScore: number;
  lastEvidenceAt: string | null;
  nextDueAt: string | null;
  reasonEvidenceIds: string[];
  version: number;
}
