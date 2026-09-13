import { canonicalizeEvidence } from '../domain/learner/projection';
import { EvidenceEvent } from '../domain/evidence/EvidenceEvent';
import { assertValidEvidenceEvent } from '../domain/evidence/rules';
import { EvidenceRepository } from './EvidenceRepository';

export class InMemoryEvidenceRepository implements EvidenceRepository {
  private readonly events = new Map<string, EvidenceEvent>();
  async append(event: EvidenceEvent): Promise<void> { assertValidEvidenceEvent(event); if (this.events.has(event.id)) throw new Error(`EvidenceEvent already exists: ${event.id}`); this.events.set(event.id, { ...event, metadata: event.metadata ? { ...event.metadata } : undefined }); }
  async listForKnowledgePoint(learnerId: string, knowledgePointId: string): Promise<EvidenceEvent[]> { return canonicalizeEvidence([...this.events.values()].filter((event) => event.learnerId === learnerId && event.knowledgePointId === knowledgePointId)); }
  async listForLearner(learnerId: string): Promise<EvidenceEvent[]> { return canonicalizeEvidence([...this.events.values()].filter((event) => event.learnerId === learnerId)); }
}
