import AsyncStorage from '@react-native-async-storage/async-storage';
import * as betaAnalytics from './privateBetaAnalytics';
import{anonymousInstallIdV1}from'./privateBetaIdentity';

export type PrivateBetaRatingV1 = 1 | 2 | 3 | 4 | 5;
export type PrivateBetaReturnIntentV1 = 'YES' | 'MAYBE' | 'NO';

export interface PrivateBetaPulseV1 {
  schemaVersion: 1;
  id: string;
  learnerId: string;
  sessionId: string;
  taskId: string;
  family: string;
  submittedAt: string;
  localDate?: string;
  usefulness: PrivateBetaRatingV1;
  friction: PrivateBetaRatingV1;
  returnTomorrow: PrivateBetaReturnIntentV1;
  redundantNote?: string;
  source: 'EXAM_SESSION_COMPLETION';
}

export interface PrivateBetaWeekOneSurveyV1 {
  schemaVersion: 1;
  id: string;
  learnerId: string;
  submittedAt: string;
  disappointedIfGone: PrivateBetaRatingV1;
  paymentChoice: 'FREE_2_PER_WEEK' | 'NT199_PER_MONTH' | 'WOULD_NOT_USE';
  substitute: string;
  reason?: string;
}
export interface PrivateBetaWeekOneSurveyV2{schemaVersion:2;id:string;learnerId:string;submittedAt:string;missMost:string;difference:string;keepUsing:'YES'|'MAYBE'|'NO';recommend:'YES'|'MAYBE'|'NO';substitute:string;paidReaction:'WOULD_CONSIDER'|'NOT_SURE'|'FREE_ONLY'|'WOULD_NOT_USE';reason?:string}

const PULSE_KEY = 'eot:private-beta:pulses:v1';
const WEEK_ONE_KEY = 'eot:private-beta:week-one:v1';
const WEEK_ONE_V2_KEY='eot:private-beta:week-one:v2';
const EVENT_KEY = 'eot:private-beta:events:v1';
const MAX_PULSES = 250;
const MAX_EVENTS = 1200;

export type PrivateBetaProductEventTypeV1 =
  | 'SESSION_OPENED'
  | 'SESSION_RESUMED'
  | 'RESPONSE_SUBMITTED'
  | 'TEACHER_INTERACTION_SHOWN'
  | 'TEACHER_INTERACTION_COMPLETED'
  | 'TEACHER_RECOMPOSED'
  | 'SESSION_PAUSED'
  | 'SESSION_COMPLETED'
  | 'PULSE_SUBMITTED'
  | 'WEEK_ONE_SURVEY_SUBMITTED'
  | 'FIRST_RUN_COMPLETED'|'QUICK_CALIBRATION_STARTED'|'QUICK_CALIBRATION_STAGE2_ROUTED'|'QUICK_CALIBRATION_COMPLETED'|'TODAY_STARTED'|'PRACTICE_STARTED'|'LOOKUP_OPENED'|'LOOKUP_LOCKED'|'LOOKUP_UNRESOLVED'|'CONTENT_REPORTED';

export interface PrivateBetaProductEventV1 {
  schemaVersion: 1;
  id: string;
  learnerId: string;
  anonymousInstallId:string;
  sessionId: string;
  taskId: string;
  family: string;
  occurredAt: string;
  localDate?: string;
  type: PrivateBetaProductEventTypeV1;
  phase?: string;
  interactionMode?: string;
  teacherAction?: string;
  mechanismId?: string;
  source: 'PRIVATE_BETA_PRODUCT_TELEMETRY';
}


function asArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value as T[] : [];
  } catch {
    return [];
  }
}

export function privateBetaPulseIdV1(learnerId: string, sessionId: string) {
  return `beta-pulse:${learnerId}:${sessionId}`;
}

export async function savePrivateBetaPulseV1(input: Omit<PrivateBetaPulseV1, 'schemaVersion' | 'id' | 'submittedAt' | 'source'> & { submittedAt?: string }) {
  const pulse: PrivateBetaPulseV1 = {
    schemaVersion: 1,
    id: privateBetaPulseIdV1(input.learnerId, input.sessionId),
    learnerId: input.learnerId,
    sessionId: input.sessionId,
    taskId: input.taskId,
    family: input.family,
    submittedAt: input.submittedAt ?? new Date().toISOString(),
    localDate: betaAnalytics.privateBetaLocalDateV1(input.submittedAt ? new Date(input.submittedAt) : new Date()),
    usefulness: input.usefulness,
    friction: input.friction,
    returnTomorrow: input.returnTomorrow,
    redundantNote: input.redundantNote?.trim() || undefined,
    source: 'EXAM_SESSION_COMPLETION',
  };
  const existing = asArray<PrivateBetaPulseV1>(await AsyncStorage.getItem(PULSE_KEY));
  const next = [...existing.filter(value => value.id !== pulse.id), pulse].slice(-MAX_PULSES);
  await AsyncStorage.setItem(PULSE_KEY, JSON.stringify(next));
  return pulse;
}

export async function hasPrivateBetaPulseV1(learnerId: string, sessionId: string) {
  const id = privateBetaPulseIdV1(learnerId, sessionId);
  return asArray<PrivateBetaPulseV1>(await AsyncStorage.getItem(PULSE_KEY)).some(value => value.id === id);
}

export async function listPrivateBetaPulsesV1(learnerId: string) {
  return asArray<PrivateBetaPulseV1>(await AsyncStorage.getItem(PULSE_KEY)).filter(value => value.learnerId === learnerId);
}

export async function shouldAskWeekOneSurveyV1(learnerId: string) {
  const [pulses, rawSurvey] = await Promise.all([
    listPrivateBetaPulsesV1(learnerId),
    AsyncStorage.getItem(WEEK_ONE_KEY),
  ]);
  const surveys = asArray<PrivateBetaWeekOneSurveyV1>(rawSurvey);
  if (surveys.some(value => value.learnerId === learnerId)) return false;
  return privateBetaUsageDaysV1(pulses) >= 5;
}

export async function savePrivateBetaWeekOneSurveyV1(input: Omit<PrivateBetaWeekOneSurveyV1, 'schemaVersion' | 'id' | 'submittedAt'> & { submittedAt?: string }) {
  const survey: PrivateBetaWeekOneSurveyV1 = {
    schemaVersion: 1,
    id: `beta-week-one:${input.learnerId}`,
    learnerId: input.learnerId,
    submittedAt: input.submittedAt ?? new Date().toISOString(),
    disappointedIfGone: input.disappointedIfGone,
    paymentChoice: input.paymentChoice,
    substitute: input.substitute.trim(),
    reason: input.reason?.trim() || undefined,
  };
  const existing = asArray<PrivateBetaWeekOneSurveyV1>(await AsyncStorage.getItem(WEEK_ONE_KEY));
  const next = [...existing.filter(value => value.id !== survey.id), survey];
  await AsyncStorage.setItem(WEEK_ONE_KEY, JSON.stringify(next));
  return survey;
}
export async function savePrivateBetaWeekOneSurveyV2(input:Omit<PrivateBetaWeekOneSurveyV2,'schemaVersion'|'id'|'submittedAt'>&{submittedAt?:string}){const survey:PrivateBetaWeekOneSurveyV2={...input,schemaVersion:2,id:`beta-week-one-v2:${input.learnerId}`,submittedAt:input.submittedAt??new Date().toISOString(),missMost:input.missMost.trim(),difference:input.difference.trim(),substitute:input.substitute.trim(),reason:input.reason?.trim()||undefined};const existing=asArray<PrivateBetaWeekOneSurveyV2>(await AsyncStorage.getItem(WEEK_ONE_V2_KEY));await AsyncStorage.setItem(WEEK_ONE_V2_KEY,JSON.stringify([...existing.filter(x=>x.id!==survey.id),survey]));return survey}


export async function savePrivateBetaProductEventV1(input: Omit<PrivateBetaProductEventV1, 'schemaVersion' | 'id' | 'occurredAt' | 'localDate' | 'source'|'anonymousInstallId'> & { occurredAt?: string; eventKey?: string }) {
  const occurredAt = input.occurredAt ?? new Date().toISOString();
  const event: PrivateBetaProductEventV1 = {
    schemaVersion: 1,
    id: input.eventKey ? `beta-event:${input.learnerId}:${input.sessionId}:${input.eventKey}` : `beta-event:${input.learnerId}:${input.sessionId}:${input.type}:${occurredAt}:${Math.random().toString(36).slice(2, 7)}`,
    learnerId: input.learnerId,
    anonymousInstallId:await anonymousInstallIdV1(),
    sessionId: input.sessionId,
    taskId: input.taskId,
    family: input.family,
    occurredAt,
    localDate: betaAnalytics.privateBetaLocalDateV1(new Date(occurredAt)),
    type: input.type,
    phase: input.phase,
    interactionMode: input.interactionMode,
    teacherAction: input.teacherAction,
    mechanismId: input.mechanismId,
    source: 'PRIVATE_BETA_PRODUCT_TELEMETRY',
  };
  try {
    const existing = asArray<PrivateBetaProductEventV1>(await AsyncStorage.getItem(EVENT_KEY));
    const next = input.eventKey ? [...existing.filter(value => value.id !== event.id), event] : [...existing, event];
    await AsyncStorage.setItem(EVENT_KEY, JSON.stringify(next.slice(-MAX_EVENTS)));
    return event;
  } catch {
    // Product telemetry must never block or alter the learning/evidence path.
    return null;
  }
}

export async function listPrivateBetaProductEventsV1(learnerId: string) {
  return asArray<PrivateBetaProductEventV1>(await AsyncStorage.getItem(EVENT_KEY)).filter(value => value.learnerId === learnerId);
}

export async function loadPrivateBetaWeekOneSurveyV1(learnerId: string) {
  return asArray<PrivateBetaWeekOneSurveyV1>(await AsyncStorage.getItem(WEEK_ONE_KEY)).find(value => value.learnerId === learnerId) ?? null;
}


function privateBetaFamilySummaryV1(events: readonly PrivateBetaProductEventV1[]) {
  const families = new Map<string, { openedSessions: Set<string>; completedSessions: Set<string>; teacherInteractionSessions: Set<string> }>();
  for (const event of events) {
    const current = families.get(event.family) ?? { openedSessions: new Set<string>(), completedSessions: new Set<string>(), teacherInteractionSessions: new Set<string>() };
    if (event.type === 'SESSION_OPENED' || event.type === 'SESSION_RESUMED') current.openedSessions.add(event.sessionId);
    if (event.type === 'SESSION_COMPLETED') current.completedSessions.add(event.sessionId);
    if (event.type === 'TEACHER_INTERACTION_SHOWN') current.teacherInteractionSessions.add(event.sessionId);
    families.set(event.family, current);
  }
  return Object.fromEntries([...families.entries()].map(([family, value]) => [family, Object.freeze({ openedSessions: value.openedSessions.size, completedSessions: value.completedSessions.size, teacherInteractionSessions: value.teacherInteractionSessions.size })]));
}

export async function buildPrivateBetaReportV1(learnerId: string) {
  const [pulses, events, weekOne] = await Promise.all([
    listPrivateBetaPulsesV1(learnerId),
    listPrivateBetaProductEventsV1(learnerId),
    loadPrivateBetaWeekOneSurveyV1(learnerId),
  ]);
  const typeCounts = events.reduce<Record<string, number>>((result, event) => {
    result[event.type] = (result[event.type] ?? 0) + 1;
    return result;
  }, {});
  const completedSessions = new Set(events.filter(event => event.type === 'SESSION_COMPLETED').map(event => event.sessionId)).size;
  const openedSessions = new Set(events.filter(event => event.type === 'SESSION_OPENED' || event.type === 'SESSION_RESUMED').map(event => event.sessionId)).size;
  const usefulnessAverage = pulses.length ? pulses.reduce((sum, pulse) => sum + pulse.usefulness, 0) / pulses.length : null;
  const frictionAverage = pulses.length ? pulses.reduce((sum, pulse) => sum + pulse.friction, 0) / pulses.length : null;
  const returnIntent = pulses.reduce<Record<PrivateBetaReturnIntentV1, number>>((result, pulse) => {
    result[pulse.returnTomorrow] += 1;
    return result;
  }, { YES: 0, MAYBE: 0, NO: 0 });
  const returnFollowThrough = betaAnalytics.privateBetaReturnFollowThroughV1(pulses, events);
  const teacherInteractionSessions = new Set(events.filter(event => event.type === 'TEACHER_INTERACTION_SHOWN').map(event => event.sessionId)).size;
  const recomposedSessions = new Set(events.filter(event => event.type === 'TEACHER_RECOMPOSED').map(event => event.sessionId)).size;
  const completionRate = openedSessions ? completedSessions / openedSessions : null;
  const redundantNotes = pulses.map(pulse => pulse.redundantNote).filter((value): value is string => Boolean(value));
  const byFamily = privateBetaFamilySummaryV1(events);
  return Object.freeze({
    schemaVersion: 1 as const,
    generatedAt: new Date().toISOString(),
    learnerId,
    summary: Object.freeze({
      usageDays: betaAnalytics.privateBetaUsageDaysV1(pulses),
      pulseCount: pulses.length,
      openedSessions,
      completedSessions,
      completionRate,
      incompleteOpenedSessions: Math.max(0, openedSessions - completedSessions),
      usefulnessAverage,
      frictionAverage,
      returnIntent: Object.freeze(returnIntent),
      returnFollowThrough: Object.freeze(returnFollowThrough),
      teacherInteractionSessions,
      recomposedSessions,
      redundantNotes: Object.freeze(redundantNotes),
      byFamily: Object.freeze(byFamily),
      eventCounts: Object.freeze(typeCounts),
    }),
    pulses: Object.freeze([...pulses]),
    weekOne,
    events: Object.freeze([...events]),
    learnerTruthIncluded: false as const,
  });
}

export async function buildPrivateBetaReportTextV1(learnerId: string) {
  const report = await buildPrivateBetaReportV1(learnerId);
  return `EOT PRIVATE BETA REPORT V1\n${JSON.stringify(report, null, 2)}`;
}
