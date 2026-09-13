import {
  ContextProvenanceSourceV2,
  ContextProvenanceV2,
  EntitlementMutationV2,
  ExamContextV2,
  LearnerGoalContextV2,
  LearnerStudyContextV2,
  ProductContextMutationV2,
  ProductExperienceV2,
  ProductIdentitySeedV2,
  ProductProfileV2,
  UseContextV2,
} from './types';

const DEFAULT_GOAL = '準備學測英文，找出最值得補強的得分能力';
const DEFAULT_USE_CONTEXTS: readonly UseContextV2[] = ['EXAM_TASKS'];

export const PRODUCT_CONTEXT_SCHEMA_VERSION = 2 as const;
export const PRODUCT_CONTEXT_MIN_DAILY_MINUTES = 5;
export const PRODUCT_CONTEXT_MAX_DAILY_MINUTES = 120;
export const PRODUCT_CONTEXT_MIN_SESSION_MINUTES = 5;
export const PRODUCT_CONTEXT_MAX_SESSION_MINUTES = 60;

function clampMinutes(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function cleanText(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() || fallback : fallback;
}

function isoDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const candidate = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : undefined;
}

function uniqueUseContexts(values: readonly UseContextV2[] | undefined): readonly UseContextV2[] {
  return values?.length ? [...new Set(values)] : DEFAULT_USE_CONTEXTS;
}

function provenance(source: ContextProvenanceSourceV2, now: string): ContextProvenanceV2 {
  return { source, updatedAt: now };
}

export function createInitialProductProfileV2(seed: ProductIdentitySeedV2, now = new Date().toISOString()): ProductProfileV2 {
  const entitlementStatus = seed.demoMode ? 'DEVELOPMENT' as const : 'UNKNOWN' as const;
  const entitlementSource = seed.demoMode ? 'LOCAL_DEVELOPMENT' as const : 'UNCONFIGURED' as const;
  const planId = seed.demoMode ? 'DEVELOPMENT' as const : 'UNCONFIGURED' as const;
  return {
    schemaVersion: 2,
    identity: {
      learnerId: seed.learnerId,
      accountId: seed.accountId,
      displayName: cleanText(seed.displayName, 'Learner'),
      source: seed.demoMode ? 'LOCAL_DEMO' : 'AUTHENTICATED_ACCOUNT',
      createdAt: now,
      updatedAt: now,
    },
    goals: {
      primaryGoal: DEFAULT_GOAL,
      learningPurpose: 'EXAM',
      useContexts: DEFAULT_USE_CONTEXTS,
      currentPriority: { kind: 'NONE' },
    },
    study: { dailyStudyMinutes: 10, preferredSessionMinutes: 10 },
    exam: { examType: '學測英文', scope: '學測英文全卷' },
    access: {
      activeExperience: 'EXAM',
      entitlements: {
        GENERAL: { product: 'GENERAL', status: entitlementStatus, source: entitlementSource, planId, updatedAt: now },
        EXAM: { product: 'EXAM', status: entitlementStatus, source: entitlementSource, planId, updatedAt: now },
      },
      trials: {
        GENERAL: { product: 'GENERAL', state: 'UNCONFIGURED' },
        EXAM: { product: 'EXAM', state: 'UNCONFIGURED' },
      },
      subscription: { provider: 'UNCONFIGURED', state: 'UNCONFIGURED', updatedAt: now },
    },
    onboarding: { status: 'NOT_STARTED', version: 2 },
    gsatBeta:{hasRecentMock:'UNKNOWN',recentResults:[],calibrationRequired:true,lookupTutorialCompleted:false,coachMarks:{today:false,practice:false,teacher:false,mcq:false,lookup:false,opening:false}},
    provenance: {
      identity: provenance(seed.demoMode ? 'SYSTEM' : 'AUTH', now),
      goals: provenance('SYSTEM', now),
      study: provenance('SYSTEM', now),
      exam: provenance('SYSTEM', now),
      access: provenance('SYSTEM', now),
      onboarding: provenance('SYSTEM', now),
    },
    updatedAt: now,
  };
}

export function normalizeProductProfileV2(value: ProductProfileV2, seed: ProductIdentitySeedV2, now = new Date().toISOString()): ProductProfileV2 {
  const base = createInitialProductProfileV2(seed, now);
  const identity = value?.identity ?? base.identity;
  const goals = value?.goals ?? base.goals;
  const study = value?.study ?? base.study;
  const exam = value?.exam ?? base.exam;
  const access = value?.access ?? base.access;
  const onboarding = value?.onboarding ?? base.onboarding;
  const gsatBeta=value?.gsatBeta??base.gsatBeta;
  return {
    ...base,
    ...value,
    schemaVersion: 2,
    identity: {
      ...base.identity,
      ...identity,
      learnerId: seed.learnerId,
      accountId: seed.accountId,
      displayName: cleanText(identity.displayName, base.identity.displayName),
      source: seed.demoMode ? 'LOCAL_DEMO' : 'AUTHENTICATED_ACCOUNT',
      createdAt: identity.createdAt || base.identity.createdAt,
      updatedAt: identity.updatedAt || now,
    },
    goals: {
      ...base.goals,
      ...goals,
      primaryGoal: cleanText(goals.primaryGoal, base.goals.primaryGoal),
      useContexts: uniqueUseContexts(goals.useContexts),
      currentPriority: goals.currentPriority ?? base.goals.currentPriority,
    },
    study: {
      dailyStudyMinutes: clampMinutes(study.dailyStudyMinutes, PRODUCT_CONTEXT_MIN_DAILY_MINUTES, PRODUCT_CONTEXT_MAX_DAILY_MINUTES, base.study.dailyStudyMinutes),
      preferredSessionMinutes: clampMinutes(study.preferredSessionMinutes, PRODUCT_CONTEXT_MIN_SESSION_MINUTES, PRODUCT_CONTEXT_MAX_SESSION_MINUTES, base.study.preferredSessionMinutes),
      ...(study.dailyBudget===10||study.dailyBudget===20||study.dailyBudget==='30_PLUS'?{dailyBudget:study.dailyBudget}:{}),
    },
    exam: {
      ...base.exam,
      ...exam,
      examType: cleanText(exam.examType),
      scope: cleanText(exam.scope),
      deadline: isoDate(exam.deadline),
      rubric: cleanText(exam.rubric) || undefined,
      targetScore: cleanText(exam.targetScore) || undefined,
    },
    access: {
      ...base.access,
      ...access,
      entitlements: {
        GENERAL: { ...base.access.entitlements.GENERAL, ...access.entitlements?.GENERAL, product: 'GENERAL' },
        EXAM: { ...base.access.entitlements.EXAM, ...access.entitlements?.EXAM, product: 'EXAM' },
      },
      trials: {
        GENERAL: { ...base.access.trials.GENERAL, ...access.trials?.GENERAL, product: 'GENERAL' },
        EXAM: { ...base.access.trials.EXAM, ...access.trials?.EXAM, product: 'EXAM' },
      },
      subscription: { ...base.access.subscription, ...access.subscription },
    },
    onboarding: { ...base.onboarding, ...onboarding, version: 2 },
    gsatBeta:{...base.gsatBeta,...gsatBeta,recentResults:gsatBeta.recentResults??[],coachMarks:{...base.gsatBeta.coachMarks,...gsatBeta.coachMarks}},
    provenance: { ...base.provenance, ...(value?.provenance ?? {}) },
    updatedAt: value?.updatedAt || now,
  };
}

export function applyLearnerProductContextMutationV2(profile: ProductProfileV2, mutation: ProductContextMutationV2, now = new Date().toISOString()): ProductProfileV2 {
  const next: ProductProfileV2 = {
    ...profile,
    identity: mutation.identity ? { ...profile.identity, ...mutation.identity, displayName: cleanText(mutation.identity.displayName, profile.identity.displayName), updatedAt: now } : profile.identity,
    goals: mutation.goals ? {
      ...profile.goals,
      ...mutation.goals,
      primaryGoal: cleanText(mutation.goals.primaryGoal, profile.goals.primaryGoal),
      useContexts: mutation.goals.useContexts ? uniqueUseContexts(mutation.goals.useContexts) : profile.goals.useContexts,
    } : profile.goals,
    study: mutation.study ? {
      dailyStudyMinutes: clampMinutes(mutation.study.dailyStudyMinutes ?? profile.study.dailyStudyMinutes, PRODUCT_CONTEXT_MIN_DAILY_MINUTES, PRODUCT_CONTEXT_MAX_DAILY_MINUTES, profile.study.dailyStudyMinutes),
      preferredSessionMinutes: clampMinutes(mutation.study.preferredSessionMinutes ?? profile.study.preferredSessionMinutes, PRODUCT_CONTEXT_MIN_SESSION_MINUTES, PRODUCT_CONTEXT_MAX_SESSION_MINUTES, profile.study.preferredSessionMinutes),
      ...((mutation.study.dailyBudget??profile.study.dailyBudget)!==undefined?{dailyBudget:mutation.study.dailyBudget??profile.study.dailyBudget}:{}),
    } : profile.study,
    exam: mutation.exam ? {
      ...profile.exam,
      ...mutation.exam,
      examType: mutation.exam.examType === undefined ? profile.exam.examType : cleanText(mutation.exam.examType),
      scope: mutation.exam.scope === undefined ? profile.exam.scope : cleanText(mutation.exam.scope),
      deadline: mutation.exam.deadline === undefined ? profile.exam.deadline : isoDate(mutation.exam.deadline),
      rubric: mutation.exam.rubric === undefined ? profile.exam.rubric : cleanText(mutation.exam.rubric) || undefined,
      targetScore: mutation.exam.targetScore === undefined ? profile.exam.targetScore : cleanText(mutation.exam.targetScore) || undefined,
    } : profile.exam,
    access: mutation.activeExperience && (()=>{
      const entitlement=profile.access.entitlements[mutation.activeExperience!];
      const trial=profile.access.trials[mutation.activeExperience!];
      return entitlement.status!=='NOT_ENTITLED'||trial.state==='AVAILABLE';
    })() ? { ...profile.access, activeExperience: mutation.activeExperience } : profile.access,
    onboarding: mutation.onboarding ? { ...profile.onboarding, ...mutation.onboarding, version: 2 } : profile.onboarding,
    gsatBeta:mutation.gsatBeta?{...profile.gsatBeta,...mutation.gsatBeta,coachMarks:{...profile.gsatBeta.coachMarks,...mutation.gsatBeta.coachMarks}}:profile.gsatBeta,
    provenance: {
      ...profile.provenance,
      ...(mutation.identity ? { identity: provenance('LEARNER', now) } : {}),
      ...(mutation.goals ? { goals: provenance('LEARNER', now) } : {}),
      ...(mutation.study ? { study: provenance('LEARNER', now) } : {}),
      ...(mutation.exam ? { exam: provenance('LEARNER', now) } : {}),
      ...(mutation.activeExperience ? { activeExperience: provenance('LEARNER', now) } : {}),
      ...(mutation.onboarding ? { onboarding: provenance('LEARNER', now) } : {}),
    },
    updatedAt: now,
  };
  if(next.onboarding.firstDay&&!next.onboarding.firstDay.milestones.FIRST_DAY_TUTORIAL_COMPLETED&&next.onboarding.status==='COMPLETED')next.onboarding={...next.onboarding,status:'IN_PROGRESS',completedAt:undefined};
  return next;
}

export function applySystemEntitlementMutationV2(profile: ProductProfileV2, mutation: EntitlementMutationV2, now = new Date().toISOString()): ProductProfileV2 {
  const patchEntitlement = (product: ProductExperienceV2) => ({
    ...profile.access.entitlements[product],
    ...(mutation.entitlements?.[product] ?? {}),
    product,
    updatedAt: now,
  });
  return {
    ...profile,
    access: {
      ...profile.access,
      entitlements: { GENERAL: patchEntitlement('GENERAL'), EXAM: patchEntitlement('EXAM') },
      trials: {
        GENERAL: { ...profile.access.trials.GENERAL, ...(mutation.trials?.GENERAL ?? {}), product: 'GENERAL' },
        EXAM: { ...profile.access.trials.EXAM, ...(mutation.trials?.EXAM ?? {}), product: 'EXAM' },
      },
      subscription: { ...profile.access.subscription, ...(mutation.subscription ?? {}), updatedAt: now },
    },
    provenance: { ...profile.provenance, access: provenance('ENTITLEMENT_SERVICE', now) },
    updatedAt: now,
  };
}

export function examContextIsMeaningfulV2(exam: ExamContextV2) {
  return Boolean(exam.examType.trim() || exam.scope.trim() || exam.deadline || exam.rubric?.trim() || exam.targetScore?.trim());
}

const EXAM_USE_CONTEXT_SCOPE_LABELS_V2: Readonly<Record<UseContextV2, string>> = Object.freeze({
  WRITING: '寫作',
  TRANSLATION: '中翻英',
  READING: '閱讀後輸出',
  SCHOOLWORK: '學校作業',
  EXAM_TASKS: '考試題型',
  WORK_MESSAGES: '工作訊息 / Email',
  MEETINGS: '會議',
  TRAVEL: '旅遊',
  DAILY_LIFE: '日常生活',
});

/**
 * The Exam detail screen explicitly allows learners to continue and fill in
 * details later. If every optional detail is blank, preserve that promise
 * without inventing an exam name: derive a minimal meaningful scope only from
 * the use-context choices the learner already made on the previous screen.
 */
export function examContextForOnboardingCompletionV2(
  exam: ExamContextV2,
  useContexts: readonly UseContextV2[],
): ExamContextV2 {
  if (examContextIsMeaningfulV2(exam)) return exam;
  return {
    ...exam,
    scope: useContexts.map(value => EXAM_USE_CONTEXT_SCOPE_LABELS_V2[value]).filter(Boolean).join('、'),
  };
}

export function onboardingIsCompleteV2(profile: ProductProfileV2) {
  if (profile.onboarding.status !== 'COMPLETED') return false;
  if (profile.onboarding.firstDay&&!profile.onboarding.firstDay.milestones.FIRST_DAY_TUTORIAL_COMPLETED) return false;
  if (!profile.goals.primaryGoal.trim()) return false;
  if (!profile.goals.useContexts.length) return false;
  if (profile.study.dailyStudyMinutes < PRODUCT_CONTEXT_MIN_DAILY_MINUTES) return false;
  return profile.goals.learningPurpose !== 'EXAM' || (examContextIsMeaningfulV2(profile.exam)&&profile.provenance.exam.source==='LEARNER');
}
