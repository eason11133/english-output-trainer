export * from './types';
export * from './goalPolicy';
export * from './readiness';
export * from './spacing';
export * from './timeArchitecture';
export * from './engine';
export * from './waveDStatus';
export * from './readingReviewPlan';
export * from './practicePlan';
export type { CurriculumPortV1, LessonPlanV1 } from '../architecture/contracts';

export const CURRICULUM_OUTER_LOOP_AUTHORITY='Curriculum decides WHAT/WHY/WHEN from Product Context + English Domain + Canonical Learner Truth. It does not diagnose moment-to-moment teaching moves, render UI, or write learner truth.' as const;
