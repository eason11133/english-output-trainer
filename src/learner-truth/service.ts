import { CanonicalEvidenceLedgerV3 } from '../domain/evidence/CanonicalEvidenceLedgerV3';
import { CanonicalEvidenceEventV3, EvidenceCandidateV3 } from '../domain/evidence/EvidenceCandidateV3';
import { LearnerModelSnapshotV3 } from '../domain/learner/LearnerModelV3';
import { TaskContract } from '../domain/task/TaskContract';
import { commitEvidenceCandidateV3, EvidenceCommitResultV3 } from '../application/evidence/commitEvidenceCandidateV3';
import { LearnerObservationV1 } from './observation';
import { CanonicalObservationLedgerV1 } from './observationLedger';
import { projectCanonicalLearnerTruthV1 } from './projection';

export interface CanonicalLearnerTruthPortV1 {
  recordObservation(observation: LearnerObservationV1): Promise<'APPENDED' | 'IDEMPOTENT_REPLAY'>;
  commitCandidate(input: {
    candidate: EvidenceCandidateV3;
    task: TaskContract | null;
    learnerId: string;
    id: string;
    occurredAt: string;
  }): Promise<EvidenceCommitResultV3>;
  evidence(learnerId: string): Promise<readonly CanonicalEvidenceEventV3[]>;
  observations(learnerId: string): Promise<readonly LearnerObservationV1[]>;
  project(learnerId: string, goalContext?: Record<string, unknown>): Promise<LearnerModelSnapshotV3>;
}

export function createCanonicalLearnerTruthPortV1(dependencies: {
  evidenceLedger: CanonicalEvidenceLedgerV3;
  observationLedger: CanonicalObservationLedgerV1;
}): CanonicalLearnerTruthPortV1 {
  return Object.freeze({
    recordObservation(observation: LearnerObservationV1) {
      return dependencies.observationLedger.appendIdempotent(observation);
    },
    commitCandidate(input: Parameters<CanonicalLearnerTruthPortV1['commitCandidate']>[0]) {
      return commitEvidenceCandidateV3({ ...input, ledger: dependencies.evidenceLedger });
    },
    evidence(learnerId: string) {
      return dependencies.evidenceLedger.listForLearner(learnerId);
    },
    observations(learnerId: string) {
      return dependencies.observationLedger.listForLearner(learnerId);
    },
    async project(learnerId: string, goalContext: Record<string, unknown> = {}) {
      return projectCanonicalLearnerTruthV1(
        learnerId,
        await dependencies.evidenceLedger.listForLearner(learnerId),
        goalContext,
      );
    },
  });
}
