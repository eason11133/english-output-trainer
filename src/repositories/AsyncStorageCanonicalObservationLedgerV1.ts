import AsyncStorage from '@react-native-async-storage/async-storage';
import { CanonicalObservationLedgerV1, ObservationAppendStatusV1 } from '../learner-truth/observationLedger';
import { LearnerObservationV1 } from '../learner-truth/observation';

const KEY = 'eot.canonical-observation-ledger.v1';

export class AsyncStorageCanonicalObservationLedgerV1 implements CanonicalObservationLedgerV1 {
  async appendIdempotent(observation: LearnerObservationV1): Promise<ObservationAppendStatusV1> {
    const all = await this.listAll();
    const existing = all.find(item => item.id === observation.id);
    if (existing) {
      if (JSON.stringify(existing) !== JSON.stringify(observation)) throw new Error(`immutable_observation_conflict:${observation.id}`);
      return 'IDEMPOTENT_REPLAY';
    }
    await AsyncStorage.setItem(KEY, JSON.stringify([...all, observation]));
    return 'APPENDED';
  }

  async listForLearner(learnerId: string): Promise<readonly LearnerObservationV1[]> {
    return (await this.listAll())
      .filter(observation => observation.learnerId === learnerId)
      .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt) || left.id.localeCompare(right.id));
  }

  private async listAll(): Promise<LearnerObservationV1[]> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(item => item?.schemaVersion === 1 && item?.immutable === true) : [];
    } catch {
      return [];
    }
  }
}
