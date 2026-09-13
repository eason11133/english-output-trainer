import { createInitialProductProfileV2 } from './model';
import { ProductIdentitySeedV2, ProductProfileV2 } from './types';

export interface LegacyProductContextV1 {
  learnerPreferences?: { learnerId?: string; displayName?: string; dailyStudyMinutes?: number };
  practiceGoals?: { onboardingCompleted?: boolean; selectedPracticeAreas?: string[] };
  learnerTrack?: { primaryGoal?: string; dailyStudyMinutes?: number; targetDate?: string; usageContexts?: string[] };
}

const legacyUseContextMap: Record<string, ProductProfileV2['goals']['useContexts'][number]> = {
  writing_output: 'WRITING', writing: 'WRITING', translation: 'TRANSLATION', reading: 'READING',
  school: 'SCHOOLWORK', exam: 'EXAM_TASKS', work: 'WORK_MESSAGES', travel: 'TRAVEL',
};

export function migrateLegacyProductContextV1ToV2(legacy: LegacyProductContextV1, seed: ProductIdentitySeedV2, now = new Date().toISOString()): ProductProfileV2 {
  const base = createInitialProductProfileV2(seed, now);
  const selected = legacy.practiceGoals?.selectedPracticeAreas ?? [];
  const usage = legacy.learnerTrack?.usageContexts ?? [];
  const mapped = [...new Set([...selected, ...usage].map(item => legacyUseContextMap[item]).filter(Boolean))];
  const daily = legacy.learnerTrack?.dailyStudyMinutes ?? legacy.learnerPreferences?.dailyStudyMinutes ?? base.study.dailyStudyMinutes;
  const deadline = legacy.learnerTrack?.targetDate;
  return {
    ...base,
    identity: {
      ...base.identity,
      displayName: legacy.learnerPreferences?.displayName?.trim() || base.identity.displayName,
      updatedAt: now,
    },
    goals: {
      ...base.goals,
      primaryGoal: legacy.learnerTrack?.primaryGoal?.trim() || base.goals.primaryGoal,
      useContexts: mapped.length ? mapped : base.goals.useContexts,
    },
    study: { dailyStudyMinutes: daily, preferredSessionMinutes: daily },
    exam: { ...base.exam, deadline },
    onboarding: legacy.practiceGoals?.onboardingCompleted ? { status: 'COMPLETED', version: 2, completedAt: now } : base.onboarding,
    provenance: {
      ...base.provenance,
      identity: { source: 'MIGRATION', updatedAt: now },
      goals: { source: 'MIGRATION', updatedAt: now },
      study: { source: 'MIGRATION', updatedAt: now },
      onboarding: { source: 'MIGRATION', updatedAt: now },
    },
    updatedAt: now,
  };
}
