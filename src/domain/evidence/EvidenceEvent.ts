import { ActivityFamily, AssistanceLevel } from '../activity/Activity';

export type EvidenceResult = 'SUCCESS' | 'PARTIAL' | 'FAILURE' | 'UNJUDGED';
export type EvidenceSource = 'SELF' | 'TEACHER' | 'CRAM_SCHOOL' | 'SCHOOL' | 'MOCK_EXAM' | 'OFFICIAL_EXAM' | 'IMPORTED_WORK' | 'SYSTEM';
export type EvaluationScope = 'TARGET_ONLY' | 'FULL_RESPONSE';
export type ContextNovelty = 'SAME' | 'NEAR' | 'NEW';
export type EvidenceConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type EvidenceOrigin = 'LEARNER_PRODUCTION' | 'OCR_OBSERVATION' | 'OCR_CORRECTION' | 'TEACHER_ANNOTATION';
export type SupportDependency = 'INDEPENDENT' | 'CUED' | 'GUIDED' | 'MODELED';
export type EvidenceTiming = 'IMMEDIATE' | 'DELAYED';

export interface EvidenceEvent {
  schemaVersion: 2;
  id: string;
  learnerId: string;
  sessionId: string;
  missionUnitId: string;
  knowledgePointId: string;
  activityFamily: ActivityFamily;
  result: EvidenceResult;
  evaluationScope: EvaluationScope;
  responseText?: string;
  acceptedTarget?: string;
  assistance: AssistanceLevel;
  attemptNumber: number;
  selfRepairSucceeded: boolean;
  answerRevealed: boolean;
  contextId: string;
  contextNovelty: ContextNovelty;
  source: EvidenceSource;
  sourceReferenceId?: string;
  confidence: EvidenceConfidence;
  origin?: EvidenceOrigin;
  supportDependency?: SupportDependency;
  timing?: EvidenceTiming;
  opportunityPresent?: boolean;
  occurredAt: string;
  metadata?: Record<string, string | number | boolean>;
}

export type EvidenceEventInput = Omit<EvidenceEvent, 'schemaVersion' | 'id' | 'occurredAt'> & { id?: string; occurredAt?: string };

export function createEvidenceId(now = Date.now(), random = Math.random): string {
  return `ev2-${now.toString(36)}-${random().toString(36).slice(2, 10)}`;
}

export function createEvidenceEvent(input: EvidenceEventInput, now = new Date()): EvidenceEvent {
  return { ...input, schemaVersion: 2, id: input.id ?? createEvidenceId(now.getTime()), occurredAt: input.occurredAt ?? now.toISOString() };
}
