import { CanonicalEvidenceEventV3 } from './EvidenceCandidateV3';

export type CanonicalEvidenceAppendStatusV1 = 'APPENDED' | 'IDEMPOTENT_REPLAY' | 'DEDUPLICATED';
export interface CanonicalEvidenceAppendResultV1 {
  status: CanonicalEvidenceAppendStatusV1;
  event: CanonicalEvidenceEventV3;
}

export interface CanonicalEvidenceLedgerV3 {
  append(event: CanonicalEvidenceEventV3): Promise<void>;
  appendIdempotent?(event: CanonicalEvidenceEventV3): Promise<CanonicalEvidenceAppendResultV1>;
  listForLearner(learnerId: string): Promise<readonly CanonicalEvidenceEventV3[]>;
}

const stableComparable = (event: CanonicalEvidenceEventV3) => JSON.stringify({
  ...event,
  competingExplanations: [...event.competingExplanations],
  provenance: event.provenance ? { ...event.provenance } : undefined,
  uncertainty: event.uncertainty ? { ...event.uncertainty, competingExplanations: [...event.uncertainty.competingExplanations] } : undefined,
});

const freezeEvent = (event: CanonicalEvidenceEventV3): CanonicalEvidenceEventV3 => Object.freeze({
  ...event,
  competingExplanations: Object.freeze([...event.competingExplanations]),
  provenance: event.provenance ? Object.freeze({ ...event.provenance }) : undefined,
  uncertainty: event.uncertainty ? Object.freeze({
    ...event.uncertainty,
    competingExplanations: Object.freeze([...event.uncertainty.competingExplanations]),
  }) : undefined,
});

export class InMemoryCanonicalEvidenceLedgerV3 implements CanonicalEvidenceLedgerV3 {
  private readonly events = new Map<string, CanonicalEvidenceEventV3>();
  private readonly dedup = new Map<string, string>();

  async append(event: CanonicalEvidenceEventV3): Promise<void> {
    if (this.events.has(event.id)) throw new Error(`Canonical evidence is immutable and already exists: ${event.id}`);
    if (event.dedupKey && this.dedup.has(event.dedupKey)) throw new Error(`Canonical evidence duplicate observation: ${event.dedupKey}`);
    const frozen = freezeEvent(event);
    this.events.set(event.id, frozen);
    if (event.dedupKey) this.dedup.set(event.dedupKey, event.id);
  }

  async appendIdempotent(event: CanonicalEvidenceEventV3): Promise<CanonicalEvidenceAppendResultV1> {
    const byId = this.events.get(event.id);
    if (byId) {
      if (stableComparable(byId) !== stableComparable(event)) {
        throw new Error(`Canonical evidence immutable conflict: ${event.id}`);
      }
      return { status: 'IDEMPOTENT_REPLAY', event: byId };
    }

    if (event.dedupKey) {
      const existingId = this.dedup.get(event.dedupKey);
      if (existingId) return { status: 'DEDUPLICATED', event: this.events.get(existingId)! };
    }

    await this.append(event);
    return { status: 'APPENDED', event: this.events.get(event.id)! };
  }

  async listForLearner(learnerId: string): Promise<readonly CanonicalEvidenceEventV3[]> {
    return Object.freeze(
      [...this.events.values()]
        .filter(event => event.learnerId === learnerId)
        .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt) || left.id.localeCompare(right.id)),
    );
  }
}
