export type LearnerObservationKindV1 =
  | 'ARTIFACT_SUBMITTED'
  | 'TRANSCRIPTION_CAPTURED'
  | 'SOURCE_CONFIRMATION'
  | 'SOURCE_INTENT'
  | 'LEARNER_ACTION'
  | 'SUPPORT_REQUEST'
  | 'LEXICAL_ENCOUNTER'
  | 'SYSTEM_EVENT';

export type LearnerObservationSourceV1 =
  | 'LEARNER'
  | 'ARTIFACT'
  | 'OCR'
  | 'TEACHER'
  | 'SYSTEM';

export interface LearnerObservationV1 {
  schemaVersion: 1;
  id: string;
  learnerId: string;
  occurredAt: string;
  immutable: true;
  kind: LearnerObservationKindV1;
  source: LearnerObservationSourceV1;
  action: string;
  artifactId?: string;
  taskId?: string;
  episodeId?: string;
  sourceConfidence: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  capabilityEvidenceAllowed: boolean;
  payload: Readonly<Record<string, string | number | boolean | null>>;
}

export function createLearnerObservationV1(
  input: Omit<LearnerObservationV1, 'schemaVersion' | 'immutable' | 'payload'> & {
    payload?: Record<string, string | number | boolean | null>;
  },
): LearnerObservationV1 {
  if (!input.id.trim()) throw new Error('observation_id_required');
  if (!input.learnerId.trim()) throw new Error('observation_learner_required');
  if (!input.action.trim()) throw new Error('observation_action_required');
  if (Number.isNaN(Date.parse(input.occurredAt))) throw new Error('observation_time_invalid');
  return Object.freeze({
    ...input,
    schemaVersion: 1,
    immutable: true,
    payload: Object.freeze({ ...(input.payload ?? {}) }),
  });
}

export function observationCanSupportCapabilityEvidenceV1(observation: LearnerObservationV1): boolean {
  return observation.capabilityEvidenceAllowed && (
    observation.kind === 'LEARNER_ACTION' || observation.kind === 'ARTIFACT_SUBMITTED'
  );
}
