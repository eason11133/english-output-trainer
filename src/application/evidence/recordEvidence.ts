import { EvidenceEvent } from '../../domain/evidence/EvidenceEvent';
import { LearnerKnowledgeState } from '../../domain/learner/LearnerKnowledgeState';
import { LearnerProjectionPolicy, projectLearnerState } from '../../domain/learner/projection';
import { EvidenceRepository } from '../../repositories/EvidenceRepository';

export async function recordEvidenceAndProject(repository: EvidenceRepository, event: EvidenceEvent, policy?: Partial<LearnerProjectionPolicy>): Promise<LearnerKnowledgeState> {
  await repository.append(event);
  return projectLearnerState(await repository.listForKnowledgePoint(event.learnerId, event.knowledgePointId), policy);
}
