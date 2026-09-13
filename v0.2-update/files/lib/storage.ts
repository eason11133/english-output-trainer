import AsyncStorage from '@react-native-async-storage/async-storage';
import { Attempt, OutputLevel, UserErrorRecord, WorkoutSessionState } from '../types/domain';

const ATTEMPTS_KEY = 'eot.attempts.v1';
const ERRORS_KEY = 'eot.errors.v1';
const WORKOUT_SESSIONS_KEY = 'eot.workoutSessions.v2';
const OUTPUT_LEVEL_KEY = 'eot.outputLevel.v2';

export async function loadAttempts(): Promise<Attempt[]> {
  const raw = await AsyncStorage.getItem(ATTEMPTS_KEY);
  return raw ? (JSON.parse(raw) as Attempt[]) : [];
}

export async function saveAttempts(attempts: Attempt[]): Promise<void> {
  await AsyncStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
}

export async function loadErrors(): Promise<UserErrorRecord[]> {
  const raw = await AsyncStorage.getItem(ERRORS_KEY);
  return raw ? (JSON.parse(raw) as UserErrorRecord[]) : [];
}

export async function saveErrors(errors: UserErrorRecord[]): Promise<void> {
  await AsyncStorage.setItem(ERRORS_KEY, JSON.stringify(errors));
}

export async function loadWorkoutSessions(): Promise<Record<string, WorkoutSessionState>> {
  const raw = await AsyncStorage.getItem(WORKOUT_SESSIONS_KEY);
  return raw ? (JSON.parse(raw) as Record<string, WorkoutSessionState>) : {};
}

export async function saveWorkoutSessions(sessions: Record<string, WorkoutSessionState>): Promise<void> {
  await AsyncStorage.setItem(WORKOUT_SESSIONS_KEY, JSON.stringify(sessions));
}

export async function loadOutputLevel(): Promise<OutputLevel> {
  const raw = await AsyncStorage.getItem(OUTPUT_LEVEL_KEY);
  if (raw === 'foundation' || raw === 'developing' || raw === 'intermediate') return raw;
  return 'foundation';
}

export async function saveOutputLevel(level: OutputLevel): Promise<void> {
  await AsyncStorage.setItem(OUTPUT_LEVEL_KEY, level);
}

export async function resetLocalData(): Promise<void> {
  await AsyncStorage.multiRemove([
    ATTEMPTS_KEY,
    ERRORS_KEY,
    WORKOUT_SESSIONS_KEY,
    OUTPUT_LEVEL_KEY,
  ]);
}
