export type { ProductContextV1 } from '../architecture/contracts';
export * from './types';
export * from './personalizedRoutes';
export * from './model';
export * from './access';
export * from './projection';
export * from './migration';
export * from './waveAStatus';

export const PRODUCT_CONTEXT_AUTHORITY='Product context owns learner identity, goals, real-use context, study context, General/Exam access context, and commercial boundaries; it never owns English capability truth or Tutor Policy.' as const;
