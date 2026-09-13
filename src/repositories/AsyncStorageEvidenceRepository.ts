import AsyncStorage from '@react-native-async-storage/async-storage';
import { EvidenceEvent } from '../domain/evidence/EvidenceEvent';
import { assertValidEvidenceEvent } from '../domain/evidence/rules';
import { canonicalizeEvidence } from '../domain/learner/projection';
import { EvidenceRepository } from './EvidenceRepository';

export const EVIDENCE_STORAGE_KEY = 'eot.v2.evidence.events';

function parseStoredEvents(value: string | null): EvidenceEvent[] {
  if (!value) return [];
  try { const parsed: unknown = JSON.parse(value); if (!Array.isArray(parsed)) return []; return parsed.filter((item): item is EvidenceEvent => typeof item === 'object' && item !== null && (item as EvidenceEvent).schemaVersion === 2); } catch { return []; }
}

export class AsyncStorageEvidenceRepository implements EvidenceRepository {
  constructor(private readonly storageKey = EVIDENCE_STORAGE_KEY) {}
  async append(event: EvidenceEvent): Promise<void> {
    assertValidEvidenceEvent(event);
    const events = parseStoredEvents(await AsyncStorage.getItem(this.storageKey));
    if (events.some((candidate) => candidate.id === event.id)) throw new Error(`EvidenceEvent already exists: ${event.id}`);
    await AsyncStorage.setItem(this.storageKey, JSON.stringify([...events, event]));
  }
  async listForKnowledgePoint(learnerId: string, knowledgePointId: string): Promise<EvidenceEvent[]> {
    const events = parseStoredEvents(await AsyncStorage.getItem(this.storageKey));
    return canonicalizeEvidence(events.filter((event) => event.learnerId === learnerId && event.knowledgePointId === knowledgePointId));
  }
  async listForLearner(learnerId: string): Promise<EvidenceEvent[]> { return canonicalizeEvidence(parseStoredEvents(await AsyncStorage.getItem(this.storageKey)).filter((event) => event.learnerId === learnerId)); }
}
