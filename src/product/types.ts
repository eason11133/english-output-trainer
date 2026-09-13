import type { FirstDayTutorialState } from './firstDayTutorial';
export type ProductExperienceV2 = 'GENERAL' | 'EXAM';
export type LearningPurposeV2 = 'GENERAL_ENGLISH' | 'SCHOOL' | 'EXAM' | 'WORK' | 'TRAVEL' | 'PERSONAL_PROJECT' | 'OTHER';
export type UseContextV2 = 'WRITING' | 'TRANSLATION' | 'READING' | 'SCHOOLWORK' | 'EXAM_TASKS' | 'WORK_MESSAGES' | 'MEETINGS' | 'TRAVEL' | 'DAILY_LIFE';
export type PriorityKindV2 = 'NONE' | 'WRITING' | 'TRANSLATION' | 'VOCABULARY' | 'GRAMMAR' | 'READING' | 'EXAM_TASK';
export type EntitlementStatusV2 = 'UNKNOWN' | 'NOT_ENTITLED' | 'TRIAL' | 'ACTIVE' | 'DEVELOPMENT';
export type EntitlementSourceV2 = 'UNCONFIGURED' | 'LOCAL_DEVELOPMENT' | 'LOCAL_TRIAL_POLICY' | 'SERVER' | 'MIGRATION';
export type SubscriptionStateV2 = 'UNCONFIGURED' | 'NONE' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNKNOWN';
export type ProductPlanIdV2 = 'UNCONFIGURED' | 'GENERAL' | 'EXAM' | 'BUNDLE' | 'DEVELOPMENT';
export type ContextProvenanceSourceV2 = 'LEARNER' | 'AUTH' | 'SYSTEM' | 'MIGRATION' | 'ENTITLEMENT_SERVICE';
export type OnboardingStatusV2 = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface LearnerIdentityV2 {
  learnerId: string;
  accountId: string | null;
  displayName: string;
  source: 'LOCAL_DEMO' | 'AUTHENTICATED_ACCOUNT';
  createdAt: string;
  updatedAt: string;
}

export interface LearnerGoalContextV2 {
  primaryGoal: string;
  learningPurpose: LearningPurposeV2;
  useContexts: readonly UseContextV2[];
  currentPriority: { kind: PriorityKindV2; label?: string; setAt?: string };
}

export interface LearnerStudyContextV2 {
  dailyStudyMinutes: number;
  preferredSessionMinutes: number;
  /** New-user semantic choice. Legacy numeric values remain authoritative and valid. */
  dailyBudget?: 10 | 20 | '30_PLUS';
}

export interface ExamContextV2 {
  examType: string;
  scope: string;
  deadline?: string;
  rubric?: string;
  targetScore?: string;
}

export type GsatSectionV1='VOCABULARY'|'CLOZE'|'WORD_BANK'|'DISCOURSE_STRUCTURE'|'READING_COMPREHENSION'|'MIXED_FORMAT'|'ZH_EN_TRANSLATION'|'ENGLISH_COMPOSITION';
export interface GsatRecentResultV1{section:GsatSectionV1;lost:number;maximum:number;reportedAt:string;evidenceEligible:false}
export interface GsatBetaContextV1{
  hasRecentMock:'UNKNOWN'|'YES'|'NO';
  recentResults:readonly GsatRecentResultV1[];
  calibrationRequired:boolean;
  lookupTutorialCompleted:boolean;
  coachMarks:{today:boolean;practice:boolean;teacher:boolean;mcq?:boolean;lookup?:boolean;opening?:boolean};
}

export interface ProductEntitlementV2 {
  product: ProductExperienceV2;
  status: EntitlementStatusV2;
  source: EntitlementSourceV2;
  planId: ProductPlanIdV2;
  validUntil?: string;
  updatedAt: string;
}

export interface TrialAccessV2 {
  product: ProductExperienceV2;
  state: 'UNCONFIGURED' | 'AVAILABLE' | 'ACTIVE' | 'EXHAUSTED' | 'NOT_OFFERED';
  startedAt?: string;
  endsAt?: string;
}

export interface SubscriptionBoundaryV2 {
  provider: 'UNCONFIGURED' | 'EXTERNAL';
  state: SubscriptionStateV2;
  product?: ProductExperienceV2 | 'BUNDLE';
  opaqueCustomerRef?: string;
  opaqueSubscriptionRef?: string;
  updatedAt: string;
}

export interface ProductAccessContextV2 {
  activeExperience: ProductExperienceV2;
  entitlements: Record<ProductExperienceV2, ProductEntitlementV2>;
  trials: Record<ProductExperienceV2, TrialAccessV2>;
  subscription: SubscriptionBoundaryV2;
}

export interface OnboardingContextV2 {
  status: OnboardingStatusV2;
  version: 2;
  completedAt?: string;
  firstDay?: FirstDayTutorialState;
  setupStage?: 'DATE'|'TIME'|'SIGNAL'|'MOCK_SCORE'|'QUICK_DIAG'|'HANDOFF'|'MISSION_STARTED';
  examTargetDate?: string;
  examTargetUnknown?: boolean;
  initialSignalSource?: 'MOCK'|'QUICK_DIAG';
  mockScoreDraft?: Readonly<Record<string,string>>;
  quickDiagnosticPracticeFamily?: string;
  firstMission?: {
    family:string; taskLabel:string; reason:string; durationMinutes:number; route:string;
    selectedAt:string; startedAt?:string;
  };
  activationHandoffCompleted?: boolean;
}

export interface ContextProvenanceV2 {
  source: ContextProvenanceSourceV2;
  updatedAt: string;
}

export interface ProductProfileV2 {
  schemaVersion: 2;
  identity: LearnerIdentityV2;
  goals: LearnerGoalContextV2;
  study: LearnerStudyContextV2;
  exam: ExamContextV2;
  access: ProductAccessContextV2;
  onboarding: OnboardingContextV2;
  gsatBeta:GsatBetaContextV1;
  provenance: Readonly<Record<string, ContextProvenanceV2>>;
  updatedAt: string;
}

export interface ProductIdentitySeedV2 {
  learnerId: string;
  accountId: string | null;
  displayName?: string;
  demoMode: boolean;
}

export interface ProductContextMutationV2 {
  identity?: Partial<Pick<LearnerIdentityV2, 'displayName'>>;
  goals?: Partial<Omit<LearnerGoalContextV2, 'currentPriority'>> & { currentPriority?: LearnerGoalContextV2['currentPriority'] };
  study?: Partial<LearnerStudyContextV2>;
  exam?: Partial<ExamContextV2>;
  activeExperience?: ProductExperienceV2;
  onboarding?: Partial<OnboardingContextV2>;
  gsatBeta?:Partial<Omit<GsatBetaContextV1,'coachMarks'>> & {coachMarks?:Partial<GsatBetaContextV1['coachMarks']>};
}

export interface EntitlementMutationV2 {
  entitlements?: Partial<Record<ProductExperienceV2, Partial<ProductEntitlementV2>>>;
  trials?: Partial<Record<ProductExperienceV2, Partial<TrialAccessV2>>>;
  subscription?: Partial<SubscriptionBoundaryV2>;
}
