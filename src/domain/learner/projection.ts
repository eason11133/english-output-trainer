import { PRODUCTION_ACTIVITY_FAMILIES } from '../activity/Activity';
import { EvidenceEvent } from '../evidence/EvidenceEvent';
import { classifyEvidence, isDelayedProof } from '../evidence/rules';
import { LearnerKnowledgeStage, LearnerKnowledgeState } from './LearnerKnowledgeState';

export interface LearnerProjectionPolicy {
  minimumRecognitionProofs: number;
  minimumIndependentProductionProofs: number;
  minimumTransferProofs: number;
  minimumStableDelayMs: number;
  recentProductionWindow: number;
  recurrenceWindow: number;
  fragileFailureCount: number;
  fragileRecentWindow: number;
  nextDueAt?: (state: Omit<LearnerKnowledgeState, 'nextDueAt'>, events: readonly EvidenceEvent[]) => string | null;
}

export const DEFAULT_LEARNER_PROJECTION_POLICY: LearnerProjectionPolicy = {
  minimumRecognitionProofs: 1,
  minimumIndependentProductionProofs: 1,
  minimumTransferProofs: 1,
  minimumStableDelayMs: 24 * 60 * 60 * 1000,
  recentProductionWindow: 10,
  recurrenceWindow: 8,
  fragileFailureCount: 2,
  fragileRecentWindow: 3,
};

export function canonicalizeEvidence(events: readonly EvidenceEvent[]): EvidenceEvent[] {
  return [...events].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt) || left.id.localeCompare(right.id));
}

const rounded = (value: number) => Math.round(value * 1000) / 1000;

/** Recent eligible production attempts requiring any cue/reveal divided by all recent eligible production attempts. */
export function calculateHintDependency(events: readonly EvidenceEvent[], windowSize = 10): number {
  const eligible = canonicalizeEvidence(events).filter((event) => PRODUCTION_ACTIVITY_FAMILIES.has(event.activityFamily) && event.result !== 'UNJUDGED').slice(-windowSize);
  if (!eligible.length) return 0;
  return rounded(eligible.filter((event) => event.assistance !== 'NONE' || event.answerRevealed).length / eligible.length);
}

/** Reliable failures / recent judged attempts, plus 0.15 for each repeated failure after the first, capped at 1. */
export function calculateRecurrence(events: readonly EvidenceEvent[], windowSize = 8): number {
  const recent = canonicalizeEvidence(events).filter((event) => event.result !== 'UNJUDGED').slice(-windowSize);
  if (!recent.length) return 0;
  const failures = recent.filter((event) => classifyEvidence(event).failureEvidence).length;
  return rounded(Math.min(1, failures / recent.length + Math.max(0, failures - 1) * 0.15));
}

function assertSingleProjectionTarget(events: readonly EvidenceEvent[]): { learnerId: string; knowledgePointId: string } {
  const first = events[0];
  if (!first) throw new Error('projectLearnerState requires learnerId and knowledgePointId when evidence is empty');
  if (events.some((event) => event.learnerId !== first.learnerId || event.knowledgePointId !== first.knowledgePointId)) throw new Error('Evidence must belong to one learner and one knowledge point');
  return first;
}

export function emptyLearnerKnowledgeState(learnerId: string, knowledgePointId: string): LearnerKnowledgeState {
  return { learnerId, knowledgePointId, stage: 'NEW', recognitionProofs: 0, independentRecallProofs: 0, assistedProductionProofs: 0, independentProductionProofs: 0, transferProofs: 0, delayedProofs: 0, hintDependencyScore: 0, recurrenceScore: 0, lastEvidenceAt: null, nextDueAt: null, reasonEvidenceIds: [], version: 2 };
}

export function projectLearnerState(events: readonly EvidenceEvent[], policyOverrides: Partial<LearnerProjectionPolicy> = {}): LearnerKnowledgeState {
  const ordered = canonicalizeEvidence(events);
  const target = assertSingleProjectionTarget(ordered);
  const policy = { ...DEFAULT_LEARNER_PROJECTION_POLICY, ...policyOverrides };
  const classified = ordered.map((event) => ({ event, proof: classifyEvidence(event) }));
  const recognition = classified.filter(({ proof }) => proof.recognitionProof);
  const recall = classified.filter(({ proof }) => proof.independentRecallProof);
  const assisted = classified.filter(({ proof }) => proof.assistedProductionProof);
  const production = classified.filter(({ proof }) => proof.independentProductionProof);
  const transfer = classified.filter(({ proof }) => proof.transferProof);
  const firstTransferAt = transfer[0]?.event.occurredAt ?? null;
  const delayed = classified.filter(({ event }) => isDelayedProof(event, firstTransferAt, policy.minimumStableDelayMs) && event.id !== transfer[0]?.event.id);
  let stage: LearnerKnowledgeStage = 'NEW'; let reasons: string[] = [];
  if (recognition.length >= policy.minimumRecognitionProofs) { stage = 'RECOGNIZED'; reasons = recognition.slice(-policy.minimumRecognitionProofs).map(({ event }) => event.id); }
  const retrievalEntries = classified.filter(({ event }) => event.activityFamily === 'RETRIEVAL');
  if (retrievalEntries.length && recall.length === 0 && stage === 'RECOGNIZED') { stage = 'RETRIEVING'; reasons = [retrievalEntries.at(-1)!.event.id]; }
  if (assisted.length) { stage = 'ASSISTED_USE'; reasons = [assisted.at(-1)!.event.id]; }
  if (production.length >= policy.minimumIndependentProductionProofs) { stage = 'INDEPENDENT_USE'; reasons = production.slice(-policy.minimumIndependentProductionProofs).map(({ event }) => event.id); }
  if (transfer.length >= policy.minimumTransferProofs) { stage = 'TRANSFER'; reasons = transfer.slice(-policy.minimumTransferProofs).map(({ event }) => event.id); }
  if (delayed.length) { stage = 'STABLE'; reasons = [transfer[0].event.id, delayed.at(-1)!.event.id]; }
  const advanced = stage === 'INDEPENDENT_USE' || stage === 'TRANSFER' || stage === 'STABLE';
  const recentAfterProof = classified.filter(({ event }) => reasons.length === 0 || event.occurredAt >= (ordered.find((candidate) => candidate.id === reasons.at(-1))?.occurredAt ?? '')).slice(-policy.fragileRecentWindow);
  const recentFailures = recentAfterProof.filter(({ proof }) => proof.failureEvidence);
  if (advanced && recentFailures.length >= policy.fragileFailureCount) { stage = 'FRAGILE'; reasons = [...reasons.slice(-1), ...recentFailures.map(({ event }) => event.id)]; }
  const withoutDue: Omit<LearnerKnowledgeState, 'nextDueAt'> = { learnerId: target.learnerId, knowledgePointId: target.knowledgePointId, stage, recognitionProofs: recognition.length, independentRecallProofs: recall.length, assistedProductionProofs: assisted.length, independentProductionProofs: production.length, transferProofs: transfer.length, delayedProofs: delayed.length, hintDependencyScore: calculateHintDependency(ordered, policy.recentProductionWindow), recurrenceScore: calculateRecurrence(ordered, policy.recurrenceWindow), lastEvidenceAt: ordered.at(-1)?.occurredAt ?? null, reasonEvidenceIds: [...new Set(reasons)], version: 2 };
  return { ...withoutDue, nextDueAt: policy.nextDueAt?.(withoutDue, ordered) ?? null };
}
