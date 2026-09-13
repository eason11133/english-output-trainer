import { PRODUCTION_ACTIVITY_FAMILIES } from '../activity/Activity';
import { EvidenceEvent } from './EvidenceEvent';

export type EvidenceClassification = {
  recognitionProof: boolean;
  independentRecallProof: boolean;
  assistedProductionProof: boolean;
  independentProductionProof: boolean;
  transferProof: boolean;
  failureEvidence: boolean;
  confirmsTarget: boolean;
  confirmsFullResponse: boolean;
  selfRepairSucceeded: boolean;
};

const revealed = (event: EvidenceEvent) => event.answerRevealed || event.assistance === 'FULL_REVEAL' || event.assistance === 'PARTIAL_REVEAL';
const reliableSuccess = (event: EvidenceEvent) => event.result === 'SUCCESS' && event.confidence === 'HIGH' && !revealed(event);
const independent = (event: EvidenceEvent) => reliableSuccess(event) && event.assistance === 'NONE';

export function validateEvidenceEvent(event: EvidenceEvent): string[] {
  const errors: string[] = [];
  if (event.schemaVersion !== 2) errors.push('schemaVersion must be 2');
  for (const [key, value] of Object.entries({ id: event.id, learnerId: event.learnerId, sessionId: event.sessionId, missionUnitId: event.missionUnitId, knowledgePointId: event.knowledgePointId, contextId: event.contextId })) if (!value.trim()) errors.push(`${key} is required`);
  if (!Number.isInteger(event.attemptNumber) || event.attemptNumber < 1) errors.push('attemptNumber must be a positive integer');
  if (Number.isNaN(Date.parse(event.occurredAt))) errors.push('occurredAt must be an ISO-compatible timestamp');
  if (event.answerRevealed && event.assistance !== 'FULL_REVEAL') errors.push('answerRevealed requires FULL_REVEAL assistance');
  if (event.assistance === 'FULL_REVEAL' && !event.answerRevealed) errors.push('FULL_REVEAL requires answerRevealed');
  if (typeof event.metadata?.hintsUsed === 'number' && event.metadata.hintsUsed > 0 && event.assistance === 'NONE') errors.push('hint use requires a non-NONE assistance level');
  if (event.metadata?.providerFailure === true || event.metadata?.systemFailure === true) errors.push('provider/system failures are not learner evidence');
  return errors;
}

export function assertValidEvidenceEvent(event: EvidenceEvent): void { const errors = validateEvidenceEvent(event); if (errors.length) throw new Error(`Invalid EvidenceEvent: ${errors.join('; ')}`); }

export function classifyEvidence(event: EvidenceEvent): EvidenceClassification {
  const production = PRODUCTION_ACTIVITY_FAMILIES.has(event.activityFamily);
  const independentProduction = independent(event) && production && event.activityFamily !== 'CORRECTION';
  const assistedProduction = event.result === 'SUCCESS' && production && event.assistance !== 'NONE' && event.assistance !== 'PARTIAL_REVEAL' && event.assistance !== 'FULL_REVEAL' && !event.answerRevealed && event.confidence !== 'LOW';
  return {
    recognitionProof: independent(event) && event.activityFamily === 'RECOGNITION',
    independentRecallProof: independent(event) && event.activityFamily === 'RETRIEVAL',
    assistedProductionProof: assistedProduction,
    independentProductionProof: independentProduction,
    transferProof: independentProduction && event.contextNovelty === 'NEW' && (event.activityFamily === 'TRANSFER' || event.activityFamily === 'MINI_OUTPUT'),
    failureEvidence: event.result === 'FAILURE' && event.confidence === 'HIGH',
    confirmsTarget: reliableSuccess(event),
    confirmsFullResponse: reliableSuccess(event) && event.evaluationScope === 'FULL_RESPONSE',
    selfRepairSucceeded: event.selfRepairSucceeded,
  };
}

export function isDelayedProof(event: EvidenceEvent, transferOccurredAt: string | null, minimumDelayMs: number): boolean {
  if (!transferOccurredAt || !classifyEvidence(event).independentProductionProof) return false;
  return Date.parse(event.occurredAt) - Date.parse(transferOccurredAt) >= minimumDelayMs;
}

export function evidenceFromEvaluation<T>(evaluation: { status: 'COMPLETED'; event: T } | { status: 'PROVIDER_FAILURE' | 'SYSTEM_FAILURE'; error: string }): T | null {
  return evaluation.status === 'COMPLETED' ? evaluation.event : null;
}
