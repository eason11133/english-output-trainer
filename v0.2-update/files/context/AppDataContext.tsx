import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { gradeAttempt } from '../lib/mockGrader';
import {
  loadAttempts,
  loadErrors,
  loadOutputLevel,
  loadWorkoutSessions,
  resetLocalData,
  saveAttempts,
  saveErrors,
  saveOutputLevel,
  saveWorkoutSessions,
} from '../lib/storage';
import {
  Attempt,
  Exercise,
  OutputLevel,
  UserErrorRecord,
  WorkoutSessionState,
} from '../types/domain';

type SessionPatch = Partial<Omit<WorkoutSessionState, 'workoutId'>>;

type AppDataContextValue = {
  ready: boolean;
  attempts: Attempt[];
  errors: UserErrorRecord[];
  outputLevel: OutputLevel;
  workoutSessions: Record<string, WorkoutSessionState>;
  submitAttempt: (workoutId: string, exercise: Exercise, answer: string, hintsUsed: number) => Promise<Attempt>;
  setOutputLevel: (level: OutputLevel) => Promise<void>;
  updateWorkoutSession: (workoutId: string, patch: SessionPatch) => Promise<void>;
  resetWorkoutSession: (workoutId: string) => Promise<void>;
  resetDemo: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [errors, setErrors] = useState<UserErrorRecord[]>([]);
  const [outputLevel, setOutputLevelState] = useState<OutputLevel>('foundation');
  const [workoutSessions, setWorkoutSessions] = useState<Record<string, WorkoutSessionState>>({});

  useEffect(() => {
    Promise.all([loadAttempts(), loadErrors(), loadOutputLevel(), loadWorkoutSessions()]).then(
      ([storedAttempts, storedErrors, storedLevel, storedSessions]) => {
        setAttempts(storedAttempts);
        setErrors(storedErrors);
        setOutputLevelState(storedLevel);
        setWorkoutSessions(storedSessions);
        setReady(true);
      },
    );
  }, []);

  async function submitAttempt(workoutId: string, exercise: Exercise, answer: string, hintsUsed: number) {
    const grade = gradeAttempt(exercise, answer, hintsUsed);
    const attempt: Attempt = {
      id: `${Date.now()}-${exercise.id}`,
      exerciseId: exercise.id,
      workoutId,
      answer,
      hintsUsed,
      submittedAt: new Date().toISOString(),
      grade,
    };

    const nextAttempts = [...attempts, attempt];
    const nextErrors = [...errors];

    for (const error of grade.errors) {
      const existingIndex = nextErrors.findIndex((item) => item.code === error.code);
      if (existingIndex >= 0) {
        nextErrors[existingIndex] = {
          ...nextErrors[existingIndex],
          count: nextErrors[existingIndex].count + 1,
          lastSeenAt: attempt.submittedAt,
          severity: error.severity,
        };
      } else {
        nextErrors.push({
          code: error.code,
          title: error.title,
          count: 1,
          lastSeenAt: attempt.submittedAt,
          severity: error.severity,
        });
      }
    }

    setAttempts(nextAttempts);
    setErrors(nextErrors);
    await Promise.all([saveAttempts(nextAttempts), saveErrors(nextErrors)]);
    return attempt;
  }

  async function setOutputLevel(level: OutputLevel) {
    setOutputLevelState(level);
    await saveOutputLevel(level);
  }

  async function updateWorkoutSession(workoutId: string, patch: SessionPatch) {
    const existing = workoutSessions[workoutId] ?? {
      workoutId,
      currentIndex: 0,
      answerDraft: '',
      hintsUsed: 0,
      lastAttemptId: null,
      completed: false,
      updatedAt: new Date().toISOString(),
    };
    const nextSession: WorkoutSessionState = {
      ...existing,
      ...patch,
      workoutId,
      updatedAt: new Date().toISOString(),
    };
    const nextSessions = { ...workoutSessions, [workoutId]: nextSession };
    setWorkoutSessions(nextSessions);
    await saveWorkoutSessions(nextSessions);
  }

  async function resetWorkoutSession(workoutId: string) {
    const nextSessions = { ...workoutSessions };
    delete nextSessions[workoutId];
    setWorkoutSessions(nextSessions);
    await saveWorkoutSessions(nextSessions);
  }

  async function resetDemo() {
    await resetLocalData();
    setAttempts([]);
    setErrors([]);
    setWorkoutSessions({});
    setOutputLevelState('foundation');
  }

  const value = useMemo(
    () => ({
      ready,
      attempts,
      errors,
      outputLevel,
      workoutSessions,
      submitAttempt,
      setOutputLevel,
      updateWorkoutSession,
      resetWorkoutSession,
      resetDemo,
    }),
    [ready, attempts, errors, outputLevel, workoutSessions],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used inside AppDataProvider');
  return context;
}
