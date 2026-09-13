import { LearnerObservationV1 } from './observation';

export type ObservationAppendStatusV1 = 'APPENDED' | 'IDEMPOTENT_REPLAY';

export interface CanonicalObservationLedgerV1 {
  appendIdempotent(observation: LearnerObservationV1): Promise<ObservationAppendStatusV1>;
  listForLearner(learnerId: string): Promise<readonly LearnerObservationV1[]>;
}

const comparable = (value: LearnerObservationV1) => JSON.stringify(value);

export class InMemoryCanonicalObservationLedgerV1 implements CanonicalObservationLedgerV1 {
  private readonly observations = new Map<string, LearnerObservationV1>();

  async appendIdempotent(observation: LearnerObservationV1): Promise<ObservationAppendStatusV1> {
    const existing = this.observations.get(observation.id);
    if (existing) {
      if (comparable(existing) !== comparable(observation)) throw new Error(`immutable_observation_conflict:${observation.id}`);
      return 'IDEMPOTENT_REPLAY';
    }
    this.observations.set(observation.id, Object.freeze({
      ...observation,
      payload: Object.freeze({ ...observation.payload }),
    }));
    return 'APPENDED';
  }

  async listForLearner(learnerId: string): Promise<readonly LearnerObservationV1[]> {
    return Object.freeze(
      [...this.observations.values()]
        .filter(observation => observation.learnerId === learnerId)
        .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt) || left.id.localeCompare(right.id)),
    );
  }
}
