export type ExerciseKind = 'translation' | 'retrieval' | 'mini_output';

export type ErrorSeverity = 'low' | 'medium' | 'high';

export type OutputLevel = 'beginner' | 'intermediate' | 'upper_intermediate' | 'advanced';

export type SkillKey =
  | 'vocabulary_recognition'
  | 'active_vocabulary'
  | 'grammar'
  | 'collocation'
  | 'sentence_structure'
  | 'translation'
  | 'reading'
  | 'writing_output';

export type SkillAssessmentStatus = 'unassessed' | 'provisional' | 'assessed';
export type SkillLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface SkillDimension {
  skill: SkillKey;
  skillLevel: SkillLevel;
  score: number | null;
  level: OutputLevel | null;
  evidenceCount: number;
  updatedAt: string | null;
  status: SkillAssessmentStatus;
}

export type ContentSourceType = 'demo_seed' | 'licensed_dataset' | 'original' | 'learner_created';

export interface ContentProvenance {
  sourceType: ContentSourceType;
  sourceName: string;
  license: string;
  attribution?: string;
  version: string;
}

export interface VocabularyCatalogItem {
  schemaVersion: 1;
  id: string;
  word: string;
  lemma: string;
  partOfSpeech: string;
  zhTWMeaning: string;
  coreSense: string;
  commonCollocations: string[];
  prepositionPatterns: string[];
  synonyms: string[];
  confusingWords: string[];
  exampleSentences: string[];
  notes: string;
  contentLevel: SkillLevel;
  provenance: ContentProvenance;
}

export interface LearnerVocabularyState {
  schemaVersion: 1;
  learnerId: string;
  catalogItemId: string;
  sourceReferences: VocabularySourceReference[];
  firstSeenAt: string;
  lastSeenAt: string;
  masteryStage: VocabularyMasteryStage;
  recognitionCorrectCount: number;
  recognitionIncorrectCount: number;
  productionCorrectCount: number;
  productionIncorrectCount: number;
  nextReviewAt: string;
  lastReviewedAt: string | null;
  markedForReview: boolean;
}

export type LearningModule =
  | 'vocabulary'
  | 'grammar'
  | 'translation'
  | 'reading'
  | 'writing'
  | 'sentence_collocation'
  | 'diagnostic'
  | 'imported_work';

export type LearningEventKind =
  | 'vocabulary_unknown'
  | 'vocabulary_recognized'
  | 'active_recall_failed'
  | 'active_recall_succeeded'
  | 'grammar_rule_failed'
  | 'grammar_rule_succeeded'
  | 'collocation_failed'
  | 'collocation_succeeded'
  | 'reading_question_incorrect'
  | 'reading_question_correct'
  | 'translation_failed'
  | 'translation_succeeded'
  | 'writing_observed'
  | 'spontaneous_correct_usage';

export interface LearningEvent {
  schemaVersion: 1;
  id: string;
  learnerId: string;
  kind: LearningEventKind;
  module: LearningModule;
  skill: SkillKey;
  occurredAt: string;
  correct: boolean;
  evidenceWeight: number;
  contentLevel: SkillLevel;
  catalogItemId?: string;
  canonicalKey?: string;
  sourceId: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface ActiveLearningSession {
  schemaVersion: 1;
  id: string;
  learnerId: string;
  module: LearningModule;
  sourceId: string;
  startedAt: string;
  lastActiveAt: string;
  endedAt: string | null;
  activeSeconds: number;
}

export type WorkspaceType = 'personal' | 'teacher' | 'cram_school' | 'school';

export interface LearnerPreferences {
  schemaVersion: 1;
  learnerId: string;
  displayName: string;
  learningGoal: string;
  targetExam: string;
  dailyStudyMinutes: number;
  notificationsEnabled: boolean;
  activeWorkspace: WorkspaceType;
}

export type PracticeArea =
  | 'vocabulary'
  | 'grammar'
  | 'translation'
  | 'reading'
  | 'writing'
  | 'sentence_collocation';

export interface PracticeGoalSelection {
  schemaVersion: 1;
  selectedPracticeAreas: PracticeArea[];
  recommendedPracticeAreas: PracticeArea[];
  recommendationReasons: Partial<Record<PracticeArea, string>>;
  selectedAt: string | null;
  version: string;
  onboardingCompleted: boolean;
}

export interface TodayTimeOverride {
  schemaVersion: 1;
  localDate: string;
  minutes: number;
}

export type DailyPlanStatus = 'not_started' | 'in_progress' | 'completed';
export type DailyPlanItemStatus = 'pending' | 'in_progress' | 'completed';

export interface DailyPlanItem {
  id: string;
  module: LearningModule;
  estimatedMinutes: number;
  reason: string;
  relevantSkill: SkillKey;
  relevantSkillLevel: SkillLevel;
  sourceEvidenceIds: string[];
  route: string;
  status: DailyPlanItemStatus;
}

export interface DailyPlan {
  schemaVersion: 1;
  id: string;
  localDate: string;
  targetMinutes: number;
  sourceOfTimeTarget: 'default' | 'today_override';
  generatedAt: string;
  reasonSummary: string;
  items: DailyPlanItem[];
  progress: number;
  status: DailyPlanStatus;
}

export type LearningTrackId = 'EXAM_OUTPUT' | 'SCHOOL_ACADEMIC' | 'WORK_ENGLISH' | 'FOUNDATION_DAILY';

export interface LearnerTrackProfile {
  schemaVersion: 1;
  selectedTrack: LearningTrackId;
  primaryGoal: string;
  targetDate?: string;
  usageContexts: string[];
  contentPackId: string;
  dailyStudyMinutes: number;
  selectedAt: string;
}

export type RetrievalStage =
  | 'GUIDED'
  | 'DELAYED_RETRIEVAL'
  | 'MIXED_RETRIEVAL'
  | 'CONTROLLED_PRODUCTION'
  | 'UNSEEN_TRANSFER';

export type QuestionType =
  | 'MULTIPLE_CHOICE_MEANING'
  | 'MULTIPLE_CHOICE_ENGLISH'
  | 'MULTIPLE_CHOICE_GRAMMAR'
  | 'MULTIPLE_CHOICE_COLLOCATION'
  | 'MULTIPLE_CHOICE_NATURAL_SENTENCE'
  | 'READING_MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'MATCHING'
  | 'LETTER_REORDER'
  | 'FIRST_LETTER_RECALL'
  | 'CHINESE_TO_ENGLISH_WORD'
  | 'CONSTRAINED_CLOZE'
  | 'SENTENCE_REORDER'
  | 'CONTROLLED_TRANSLATION'
  | 'FREE_TRANSLATION'
  | 'GUIDED_SENTENCE'
  | 'FREE_SENTENCE';

export type EvidenceMode = 'recognition' | 'production';
export type PracticeDifficulty = 'easy' | 'standard' | 'challenge';

export interface KnowledgePoint {
  id: string;
  type: 'vocabulary_pattern' | 'grammar_control';
  title: string;
  tags: string[];
  targetSkill: SkillKey;
  recognitionLevel: SkillLevel;
  productionLevel: SkillLevel;
  contentPackId: string;
}

export interface PracticeErrorRule {
  tag: string;
  pattern: string;
  feedback: string;
}

export interface RetrievalPracticeItem {
  id: string;
  knowledgePointId: string;
  stage: RetrievalStage;
  prompt: string;
  instruction: string;
  answerType: 'cloze' | 'open_text';
  acceptedAnswers: string[];
  explanation: string;
  errorRules: PracticeErrorRule[];
  hintLayers: string[];
  isUnseenVariant: boolean;
  questionType?: QuestionType;
  difficultyLevel?: number;
  skill?: SkillKey;
  recognitionOrProduction?: EvidenceMode;
  options?: string[];
  acceptedPatterns?: string[];
}

export interface AttemptEvidence {
  id: string;
  itemId: string;
  knowledgePointId: string;
  attemptedAt: string;
  correct: boolean;
  stage: RetrievalStage;
  hintsUsed: number;
  answerRevealed: boolean;
  selfRepairSucceeded: boolean;
  errorTags: string[];
  responseText?: string;
  questionType?: QuestionType;
  evidenceMode?: EvidenceMode;
  difficultyLevel?: number;
}

export interface RetrievalState {
  schemaVersion: 1 | 2;
  knowledgePointId: string;
  recognitionEvidence: number;
  productionEvidence: number;
  lastAttemptAt: string | null;
  nextDueAt: string;
  highestVerifiedStage: RetrievalStage | null;
  repeatedErrorTags: Record<string, number>;
  confidence: 'low' | 'developing' | 'verified';
}

export type LevelUpCheckpointStatus = 'eligible' | 'passed' | 'not_passed' | 'dismissed';

export interface LevelUpCheckpoint {
  schemaVersion: 1;
  id: string;
  learnerId: string;
  skill: SkillKey;
  fromLevel: SkillLevel;
  toLevel: SkillLevel;
  status: LevelUpCheckpointStatus;
  createdAt: string;
  completedAt: string | null;
  questionIds: string[];
  correctCount: number;
  requiredCorrect: number;
}

export interface LearnerSkillProfile {
  learnerId: string;
  overallLevel: OutputLevel;
  dimensions: Record<SkillKey, SkillDimension>;
  updatedAt: string;
}

export type PlacementConfidence = 'low' | 'moderate' | 'high';

export interface DiagnosticResponse {
  questionId: string;
  skill: SkillKey;
  difficulty: OutputLevel;
  answer: string;
  correct: boolean;
  answeredAt: string;
  difficultyLevel?: number;
  answerType?: QuestionType;
  recognitionOrProduction?: EvidenceMode;
  knowledgePointIds?: string[];
  /** Time from item presentation until submission. Used as supporting evidence, never as a standalone ability score. */
  responseTimeMs?: number;
  /** Text edits for production items. Stored for later calibration; a single high count is not treated as weakness. */
  editCount?: number;
  /** Explicit "I don't know" is different from an omitted / interrupted item. */
  explicitUnknown?: boolean;
}

export interface PlacementDiagnosticResult {
  schemaVersion: 1;
  completed: boolean;
  assignedLevel: OutputLevel | null;
  responses: DiagnosticResponse[];
  evidenceCount: number;
  confidence: PlacementConfidence;
  startedAt: string | null;
  completedAt: string | null;
}

export interface DiagnosticQuestionAttempt {
  questionId: string;
  questionContent: string;
  learnerAnswer: string;
  correctAnswer: string;
  correct: boolean;
  skill: SkillKey;
  testedLevel: OutputLevel;
  explanation: string;
  answeredAt: string;
  canonicalRuleKey?: string;
}

export interface DiagnosticSession {
  schemaVersion: 1;
  id: string;
  diagnosticVersion: string;
  startedAt: string;
  completedAt: string;
  attempts: DiagnosticQuestionAttempt[];
  skillProfileSnapshot: LearnerSkillProfile;
  overallTrack: OutputLevel;
  evidenceCounts: Partial<Record<SkillKey, number>>;
  confidence: PlacementConfidence;
}

export interface WeaknessEvidence {
  schemaVersion: 1;
  id: string;
  canonicalKey: string;
  skill: SkillKey;
  source: 'diagnostic' | 'practice' | 'imported_work' | 'ai_analysis';
  sourceId: string;
  questionId?: string;
  incorrectAt: string;
  status: 'observed';
}

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
  scaffold?: 'recognition' | 'multiple_choice' | 'word_order' | 'cloze' | 'guided_translation' | 'controlled_output' | 'independent_output';
  choices?: string[];
  answerTemplate?: string;
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

export type VocabularyMasteryStage =
  | 'NEW'
  | 'RECOGNIZED'
  | 'GUIDED_OUTPUT'
  | 'INDEPENDENT_OUTPUT'
  | 'SPONTANEOUS_OUTPUT'
  | 'TRANSFERRED'
  | 'MASTERED';

export interface VocabularySourceReference {
  type: 'seed' | 'imported_work' | 'reading' | 'feedback' | 'error_bank';
  sourceId: string;
  label?: string;
}

export interface VocabularyItem {
  id: string;
  word: string;
  lemma: string;
  partOfSpeech: string;
  zhTWMeaning: string;
  coreSense: string;
  commonCollocations: string[];
  prepositionPatterns: string[];
  synonyms: string[];
  confusingWords: string[];
  exampleSentences: string[];
  notes: string;
  sourceReferences: VocabularySourceReference[];
  createdAt: string;
  lastSeenAt: string;
  masteryStage: VocabularyMasteryStage;
  correctCount: number;
  incorrectCount: number;
  nextReviewAt: string;
  lastReviewedAt: string | null;
  markedForReview: boolean;
}

export type VocabularyPracticeMode =
  | 'recognition'
  | 'reverse_recognition'
  | 'sentence_cloze'
  | 'guided_production'
  | 'independent_production';

export interface VocabularyAttempt {
  id: string;
  vocabularyItemId: string;
  mode: VocabularyPracticeMode;
  answer: string;
  correct: boolean;
  attemptedAt: string;
  stageBefore: VocabularyMasteryStage;
  stageAfter: VocabularyMasteryStage;
  nextReviewAt: string;
}

export interface ReadingPassage {
  id: string;
  title: string;
  passage: string;
  questions: Array<{
    id: string;
    prompt: string;
    answer: string;
  }>;
  vocabularyItemIds: string[];
  sourceOrigin: WorkOrigin;
}

export interface ReadingAttempt {
  id: string;
  passageId: string;
  learnerId: string;
  answers: Record<string, string>;
  vocabularyItemIdsAdded: string[];
  completedAt: string;
}

export type ImportedWorkType = 'translation' | 'essay';
export type WorkOrigin = 'self_imported' | 'teacher_assigned' | 'system_generated';
export type WorkAnalysisStatus = 'not_started' | 'pending' | 'completed' | 'failed';

export interface ImportedWorkConnections {
  analysisIds: string[];
  errorRecordIds: string[];
  vocabularyGapIds: string[];
  generatedExerciseIds: string[];
  assignmentIds: string[];
}

export interface ImportedWorkContext {
  workspaceType: 'personal' | 'teacher' | 'cram_school' | 'school';
  organizationId?: string;
  classId?: string;
  teacherId?: string;
}

interface ImportedWorkBase {
  schemaVersion: 1;
  id: string;
  origin: WorkOrigin;
  createdAt: string;
  updatedAt: string;
  analysisStatus: WorkAnalysisStatus;
  connections: ImportedWorkConnections;
  context: ImportedWorkContext;
}

export interface ImportedTranslationWork extends ImportedWorkBase {
  type: 'translation';
  content: {
    chineseQuestion: string;
    studentAnswer: string;
    referenceAnswer?: string;
    teacherFeedback?: string;
    score?: string;
  };
}

export interface ImportedEssayWork extends ImportedWorkBase {
  type: 'essay';
  content: {
    prompt: string;
    studentEssay: string;
    teacherFeedback?: string;
    score?: string;
  };
}

export type ImportedWorkItem = ImportedTranslationWork | ImportedEssayWork;

export type ImportedWorkInput =
  | {
      type: 'translation';
      chineseQuestion: string;
      studentAnswer: string;
      referenceAnswer?: string;
      teacherFeedback?: string;
      score?: string;
    }
  | {
      type: 'essay';
      prompt: string;
      studentEssay: string;
      teacherFeedback?: string;
      score?: string;
    };

export interface ImportedWorkDraft {
  key: string;
  itemId?: string;
  type: ImportedWorkType;
  chineseQuestion: string;
  studentAnswer: string;
  referenceAnswer: string;
  prompt: string;
  studentEssay: string;
  teacherFeedback: string;
  score: string;
  updatedAt: string;
}

export type AccountRole = 'learner' | 'teacher' | 'org_admin';
export type OrganizationKind = 'teacher' | 'cram_school' | 'school';

export interface OrganizationMembership {
  organizationId: string;
  userId: string;
  role: 'owner' | 'admin' | 'teacher' | 'learner';
}
