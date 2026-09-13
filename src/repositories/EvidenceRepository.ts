import { EvidenceEvent } from '../domain/evidence/EvidenceEvent';

export interface EvidenceRepository {
  append(event: EvidenceEvent): Promise<void>;
  listForKnowledgePoint(learnerId: string, knowledgePointId: string): Promise<EvidenceEvent[]>;
  listForLearner(learnerId: string): Promise<EvidenceEvent[]>;
}
