import { CanonicalEvidenceAppendStatusV1, CanonicalEvidenceLedgerV3 } from '../../domain/evidence/CanonicalEvidenceLedgerV3';
import { CanonicalEvidenceEventV3, EvidenceCandidateV3 } from '../../domain/evidence/EvidenceCandidateV3';
import { TaskContract } from '../../domain/task/TaskContract';
import { enrichCanonicalEvidenceEventV1 } from '../../learner-truth/evidenceSemantics';
import { EvidenceGuardResultV3, guardEvidenceCandidateV3 } from './evidenceGuardsV3';

export type EvidenceCommitResultV3 =
  | { accepted: false; reasons: string[] }
  | { accepted: true; event: CanonicalEvidenceEventV3; writeStatus: CanonicalEvidenceAppendStatusV1 };

export async function commitEvidenceCandidateV3(input: {
  candidate: EvidenceCandidateV3;
  task: TaskContract | null;
  learnerId: string;
  id: string;
  occurredAt: string;
  ledger: CanonicalEvidenceLedgerV3;
}): Promise<EvidenceCommitResultV3> {
  const guarded: EvidenceGuardResultV3 = guardEvidenceCandidateV3(input);
  if (!guarded.accepted) return guarded;

  const event = enrichCanonicalEvidenceEventV1(guarded.event);

  if (input.ledger.appendIdempotent) {
    const result = await input.ledger.appendIdempotent(event);
    return { accepted: true, event: result.event, writeStatus: result.status };
  }

  await input.ledger.append(event);
  return { accepted: true, event, writeStatus: 'APPENDED' };
}
