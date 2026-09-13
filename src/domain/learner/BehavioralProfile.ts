import { ActivityFamily } from '../activity/Activity';
import { EvidenceEvent } from '../evidence/EvidenceEvent';

export type BehavioralSignal = 'SLOW_RELATIVE_TO_PERSONAL_BASELINE' | 'HIGH_REVISION_RELATIVE_TO_PERSONAL_BASELINE' | 'FAST_FAILURE_PATTERN';

export interface BehavioralEvidenceContext {
  targetSampleCount: number;
  familySampleCount: number;
  targetMedianResponseMs?: number;
  familyMedianResponseMs?: number;
  responseTimeRatio?: number;
  targetAverageEdits?: number;
  familyAverageEdits?: number;
  targetSupportRate?: number;
  fastFailureCount: number;
  signals: BehavioralSignal[];
}

const numberMeta = (event: EvidenceEvent, key: string): number | undefined => typeof event.metadata?.[key] === 'number' ? event.metadata[key] as number : undefined;
const median = (values: number[]): number | undefined => { if (!values.length) return undefined; const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2; };
const average = (values: number[]): number | undefined => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined;
const rounded = (value: number | undefined, digits = 2): number | undefined => value === undefined ? undefined : Math.round(value * 10 ** digits) / 10 ** digits;

/**
 * Derives only relative, learner-specific behavior signals. A single slow answer never becomes a learner label.
 * The result is intentionally secondary evidence for the NEXT interaction/session, not a live-session rerouter.
 */
export function deriveBehavioralEvidenceContext(events: readonly EvidenceEvent[], knowledgePointId: string, activityFamily: ActivityFamily): BehavioralEvidenceContext {
  const timedFamily = events.filter((event) => event.activityFamily === activityFamily && numberMeta(event, 'responseTimeMs') !== undefined).slice(-20);
  const timedTarget = timedFamily.filter((event) => event.knowledgePointId === knowledgePointId).slice(-8);
  const targetTimes = timedTarget.map((event) => numberMeta(event, 'responseTimeMs')!).filter(Number.isFinite);
  // Prefer the learner's same-family behavior on OTHER targets as the personal baseline.
  // Otherwise a repeatedly slow target drags its own baseline upward and hides the pattern.
  const nonTargetFamily = timedFamily.filter((event) => event.knowledgePointId !== knowledgePointId);
  const baselineFamily = nonTargetFamily.length >= 3 ? nonTargetFamily : timedFamily;
  const familyTimes = baselineFamily.map((event) => numberMeta(event, 'responseTimeMs')!).filter(Number.isFinite);
  const targetEdits = timedTarget.map((event) => numberMeta(event, 'editCount')).filter((value): value is number => value !== undefined);
  const familyEdits = baselineFamily.map((event) => numberMeta(event, 'editCount')).filter((value): value is number => value !== undefined);
  const targetMedian = median(targetTimes); const familyMedian = median(familyTimes);
  const targetEditAverage = average(targetEdits); const familyEditAverage = average(familyEdits);
  const ratio = targetMedian !== undefined && familyMedian && familyMedian > 0 ? targetMedian / familyMedian : undefined;
  const supportRate = timedTarget.length ? timedTarget.filter((event) => event.assistance !== 'NONE').length / timedTarget.length : undefined;
  const fastThreshold = familyMedian !== undefined ? Math.max(2_500, familyMedian * 0.35) : 2_500;
  const fastFailureCount = timedTarget.filter((event) => event.result === 'FAILURE' && (numberMeta(event, 'responseTimeMs') ?? Infinity) <= fastThreshold).length;
  const signals: BehavioralSignal[] = [];
  if (timedTarget.length >= 3 && timedFamily.length >= 6 && ratio !== undefined && ratio >= 1.8 && (targetMedian ?? 0) >= 5_000) signals.push('SLOW_RELATIVE_TO_PERSONAL_BASELINE');
  if (timedTarget.length >= 3 && timedFamily.length >= 6 && targetEditAverage !== undefined && familyEditAverage !== undefined && targetEditAverage >= Math.max(3, familyEditAverage * 1.8)) signals.push('HIGH_REVISION_RELATIVE_TO_PERSONAL_BASELINE');
  if (fastFailureCount >= 2) signals.push('FAST_FAILURE_PATTERN');
  return { targetSampleCount: timedTarget.length, familySampleCount: timedFamily.length, targetMedianResponseMs: rounded(targetMedian, 0), familyMedianResponseMs: rounded(familyMedian, 0), responseTimeRatio: rounded(ratio), targetAverageEdits: rounded(targetEditAverage), familyAverageEdits: rounded(familyEditAverage), targetSupportRate: rounded(supportRate), fastFailureCount, signals };
}
