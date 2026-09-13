export type TutorialMilestone =
  | 'OPENING_COMPLETED' | 'INITIAL_CONTEXT_COMPLETED' | 'TODAY_STARTED'
  | 'FIRST_MICRO_ACTION_COMPLETED' | 'FIRST_LOOKUP_USED'
  | 'FIRST_TEACHER_REPAIR_COMPLETED' | 'FIRST_SUPPORT_FADE_COMPLETED'
  | 'FIRST_FRESH_ATTEMPT_COMPLETED' | 'FIRST_RESULT_SEEN'
  | 'MY_ENGLISH_EXPLAINED_FROM_REAL_CHANGE' | 'PRACTICE_VISITED'
  | 'RETURNED_TO_TODAY' | 'FIRST_DAY_TUTORIAL_COMPLETED';

/** Product progress only. These receipts never constitute capability evidence. */
export interface FirstDayTutorialState {
  version: 1;
  milestones: Partial<Record<TutorialMilestone, { actionId: string; occurredAt: string; route: string }>>;
  learningRoute?: string;
}
