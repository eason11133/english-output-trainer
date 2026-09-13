import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CanonicalEvidenceAppendResultV1,
  CanonicalEvidenceLedgerV3,
} from '../domain/evidence/CanonicalEvidenceLedgerV3';
import { CanonicalEvidenceEventV3 } from '../domain/evidence/EvidenceCandidateV3';

const KEY = 'eot.canonical-evidence-ledger.v3';

const comparable = (event: CanonicalEvidenceEventV3) => JSON.stringify(event);

export class AsyncStorageCanonicalEvidenceLedgerV3 implements CanonicalEvidenceLedgerV3 {
  async append(event: CanonicalEvidenceEventV3) {
    const events = await this.listAll();
    if (events.some(item => item.id === event.id)) throw new Error(`Canonical evidence is immutable and already exists: ${event.id}`);
    if (event.dedupKey && events.some(item => item.dedupKey === event.dedupKey)) {
      throw new Error(`Canonical evidence duplicate observation: ${event.dedupKey}`);
    }
    await AsyncStorage.setItem(KEY, JSON.stringify([...events, event]));
  }

  async appendIdempotent(event: CanonicalEvidenceEventV3): Promise<CanonicalEvidenceAppendResultV1> {
    const events = await this.listAll();
    const byId = events.find(item => item.id === event.id);
    if (byId) {
      if (comparable(byId) !== comparable(event)) throw new Error(`Canonical evidence immutable conflict: ${event.id}`);
      return { status: 'IDEMPOTENT_REPLAY', event: byId };
    }

    const duplicate = event.dedupKey ? events.find(item => item.dedupKey === event.dedupKey) : undefined;
    if (duplicate) return { status: 'DEDUPLICATED', event: duplicate };

    await AsyncStorage.setItem(KEY, JSON.stringify([...events, event]));
    return { status: 'APPENDED', event };
  }

  async listForLearner(learnerId: string) {
    return (await this.listAll())
      .filter(event => event.learnerId === learnerId)
      .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt) || left.id.localeCompare(right.id));
  }

  private async listAll(): Promise<CanonicalEvidenceEventV3[]> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(item => item?.schemaVersion === 3) : [];
    } catch {
      return [];
    }
  }
}
