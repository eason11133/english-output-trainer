import { CanonicalEvidenceEventV3 } from '../../domain/evidence/EvidenceCandidateV3';
import { ExposureEvent } from '../../domain/learner/ExposureEvent';
import { LearnerModelSnapshotV3 } from '../../domain/learner/LearnerModelV3';
import { projectCanonicalLearnerTruthV1 } from '../../learner-truth/projection';

/**
 * Compatibility entrypoint for existing Teacher/Curriculum consumers.
 * Canonical projection ownership now lives in C (src/learner-truth).
 */
export function projectLearnerModelV3(
  learnerId: string,
  events: readonly CanonicalEvidenceEventV3[],
  goalContext: Record<string, unknown> = {},
  exposures: readonly ExposureEvent[] = [],
): LearnerModelSnapshotV3 {
  return projectCanonicalLearnerTruthV1(learnerId, events, goalContext, exposures);
}
