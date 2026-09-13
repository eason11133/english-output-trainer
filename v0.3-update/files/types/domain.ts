export type ExerciseKind = 'translation' | 'retrieval' | 'mini_output';

export type ErrorSeverity = 'low' | 'medium' | 'high';

export type OutputLevel = 'foundation' | 'developing' | 'intermediate';

export interface Exercise {
  id: string;
  kind: ExerciseKind;
  title: string;
  prompt: string;
  estimatedSeconds: number;
  focusTags: string[];
  hints: string[];
  expectedPatterns: Array<{
    id: string;
    label: string;
    regex: string;
    flags?: string;
  }>;
  referenceAnswer?: string;
}

export interface Workout {
  id: string;
  title: string;
  estimatedMinutes: number;
  focusTags: string[];
  exercises: Exercise[];
}

export interface WorkoutSessionState {
  workoutId: string;
  currentIndex: number;
  answerDraft: string;
  hintsUsed: number;
  lastAttemptId: string | null;
  completed: boolean;
  updatedAt: string;
}

export interface DetectedError {
  code: string;
  title: string;
  explanation: string;
  correction?: string;
  severity: ErrorSeverity;
}

export interface GradeResult {
  passed: boolean;
  coverage: number;
  errors: DetectedError[];
  activatedItems: string[];
  feedback: string[];
}

export interface Attempt {
  id: string;
  exerciseId: string;
  workoutId: string;
  answer: string;
  hintsUsed: number;
  submittedAt: string;
  grade: GradeResult;
}

export interface UserErrorRecord {
  code: string;
  title: string;
  count: number;
  lastSeenAt: string;
  severity: ErrorSeverity;
}


export type AccountRole = 'learner' | 'teacher' | 'org_admin';
export type OrganizationKind = 'teacher' | 'cram_school' | 'school';

export interface OrganizationMembership {
  organizationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'teacher' | 'learner';
}
