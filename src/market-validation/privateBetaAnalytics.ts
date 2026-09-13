export type PrivateBetaReturnIntentAnalyticsV1 = 'YES' | 'MAYBE' | 'NO';

export interface PrivateBetaPulseAnalyticsV1 {
  submittedAt: string;
  localDate?: string;
  returnTomorrow: PrivateBetaReturnIntentAnalyticsV1;
}

export interface PrivateBetaEventAnalyticsV1 {
  occurredAt: string;
  localDate?: string;
  type: string;
}

export function privateBetaLocalDateV1(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function privateBetaPulseLocalDateV1(value: Pick<PrivateBetaPulseAnalyticsV1, 'submittedAt' | 'localDate'>) {
  return value.localDate ?? value.submittedAt.slice(0, 10);
}

export function privateBetaEventLocalDateV1(value: Pick<PrivateBetaEventAnalyticsV1, 'occurredAt' | 'localDate'>) {
  return value.localDate ?? value.occurredAt.slice(0, 10);
}

export function privateBetaUsageDaysV1(pulses: readonly PrivateBetaPulseAnalyticsV1[]) {
  return new Set(pulses.map(privateBetaPulseLocalDateV1)).size;
}

function nextLocalDateV1(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  const date = new Date(year, month - 1, day + 1);
  return privateBetaLocalDateV1(date);
}

export function privateBetaReturnFollowThroughV1(pulses: readonly PrivateBetaPulseAnalyticsV1[], events: readonly PrivateBetaEventAnalyticsV1[]) {
  const activeDates = new Set(events.filter(event => event.type === 'SESSION_OPENED' || event.type === 'SESSION_RESUMED').map(privateBetaEventLocalDateV1));
  const summary = { YES: { stated: 0, returnedNextDay: 0 }, MAYBE: { stated: 0, returnedNextDay: 0 }, NO: { stated: 0, returnedNextDay: 0 } } as Record<PrivateBetaReturnIntentAnalyticsV1, { stated: number; returnedNextDay: number }>;
  for (const pulse of pulses) {
    const bucket = summary[pulse.returnTomorrow];
    bucket.stated += 1;
    if (activeDates.has(nextLocalDateV1(privateBetaPulseLocalDateV1(pulse)))) bucket.returnedNextDay += 1;
  }
  return summary;
}
