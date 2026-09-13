import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { useAppData } from '../../context/AppDataContext';
import { getWorkoutForLevel } from '../../data/seed';
import { theme } from '../../lib/theme';
import { Attempt } from '../../types/domain';

function sanitizeEnglishInput(value: string): string {
  return value.replace(/[^\x20-\x7E\n]/g, '');
}

export default function WorkoutScreen() {
  const {
    ready,
    attempts,
    outputLevel,
    workoutSessions,
    submitAttempt,
    updateWorkoutSession,
    resetWorkoutSession,
  } = useAppData();
  const workout = getWorkoutForLevel(outputLevel);
  const savedSession = workoutSessions[workout.id];
  const scrollRef = useRef<ScrollView>(null);
  const hydratedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [lastAttemptId, setLastAttemptId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    hydratedRef.current = false;
  }, [workout.id]);

  useEffect(() => {
    if (!ready || hydratedRef.current) return;
    if (savedSession) {
      setIndex(savedSession.currentIndex);
      setAnswer(savedSession.answerDraft);
      setHintsUsed(savedSession.hintsUsed);
      setLastAttemptId(savedSession.lastAttemptId);
      setCompleted(savedSession.completed);
    }
    hydratedRef.current = true;
  }, [ready, savedSession, workout.id]);

  useEffect(() => {
    if (!ready || !hydratedRef.current || completed) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void updateWorkoutSession(workout.id, {
        currentIndex: index,
        answerDraft: answer,
        hintsUsed,
        lastAttemptId,
        completed: false,
      });
    }, 250);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [answer, hintsUsed, index, lastAttemptId, completed, ready, workout.id]);

  const done = completed || index >= workout.exercises.length;
  const exercise = workout.exercises[Math.min(index, workout.exercises.length - 1)];
  const lastAttempt: Attempt | null = useMemo(
    () => (lastAttemptId ? attempts.find((attempt) => attempt.id === lastAttemptId) ?? null : null),
    [attempts, lastAttemptId],
  );
  const progress = `${Math.min(index + 1, workout.exercises.length)} / ${workout.exercises.length}`;

  async function handleSubmit() {
    if (!answer.trim() || !exercise) return;
    setBusy(true);
    try {
      const attempt = await submitAttempt(workout.id, exercise, answer, hintsUsed);
      setLastAttemptId(attempt.id);
      await updateWorkoutSession(workout.id, {
        currentIndex: index,
        answerDraft: answer,
        hintsUsed,
        lastAttemptId: attempt.id,
        completed: false,
      });
    } finally {
      setBusy(false);
    }
  }

  async function showHint() {
    const nextHints = hintsUsed + 1;
    setHintsUsed(nextHints);
    await updateWorkoutSession(workout.id, {
      currentIndex: index,
      answerDraft: answer,
      hintsUsed: nextHints,
      lastAttemptId: null,
      completed: false,
    });
  }

  async function next() {
    if (index + 1 >= workout.exercises.length) {
      setCompleted(true);
      setLastAttemptId(null);
      await updateWorkoutSession(workout.id, {
        currentIndex: workout.exercises.length,
        answerDraft: '',
        hintsUsed: 0,
        lastAttemptId: null,
        completed: true,
      });
      return;
    }

    const nextIndex = index + 1;
    setIndex(nextIndex);
    setAnswer('');
    setHintsUsed(0);
    setLastAttemptId(null);
    await updateWorkoutSession(workout.id, {
      currentIndex: nextIndex,
      answerDraft: '',
      hintsUsed: 0,
      lastAttemptId: null,
      completed: false,
    });
  }

  async function startOver() {
    await resetWorkoutSession(workout.id);
    setIndex(0);
    setAnswer('');
    setHintsUsed(0);
    setLastAttemptId(null);
    setCompleted(false);
  }

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading workout…</Text>
      </View>
    );
  }

  if (done) {
    return (
      <View style={styles.completeContainer}>
        <Text style={styles.completeKicker}>WORKOUT COMPLETE</Text>
        <Text style={styles.completeTitle}>Good. What matters now is what you can still produce later.</Text>
        <Text style={styles.completeBody}>
          This demo does not claim mastery. Later unseen-transfer tasks will decide what actually stuck.
        </Text>
        <AppButton label="View progress" onPress={() => router.replace('/(tabs)/progress')} />
        <AppButton variant="secondary" label="Practice this level again" onPress={startOver} />
        <AppButton variant="secondary" label="Back to Today" onPress={() => router.replace('/(tabs)')} />
      </View>
    );
  }

  const resultTitle = lastAttempt
    ? lastAttempt.grade.passed
      ? lastAttempt.hintsUsed === 0
        ? 'Independent retrieval'
        : 'Retrieved with support'
      : 'Needs another pass'
    : '';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.container}
      >
        <View style={styles.topRow}>
          <Text style={styles.kind}>{exercise.kind.replace('_', ' ').toUpperCase()}</Text>
          <Text style={styles.progress}>{progress}</Text>
        </View>
        <Text style={styles.title}>{exercise.title}</Text>
        <Text style={styles.levelLabel}>{outputLevel.toUpperCase()}</Text>

        <AppCard>
          <Text style={styles.prompt}>{exercise.prompt}</Text>
        </AppCard>

        <View style={styles.tags}>
          {exercise.focusTags.map((tag) => (
            <Text key={tag} style={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>

        <Text style={styles.inputMode}>English input only · translation tools are not part of the app</Text>
        <TextInput
          multiline
          placeholder="Write your English answer here…"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          value={answer}
          editable={!lastAttempt}
          onChangeText={(value) => setAnswer(sanitizeEnglishInput(value))}
          onFocus={() => {
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 180);
          }}
          autoCorrect={false}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="sentences"
          contextMenuHidden
          textAlignVertical="top"
        />

        {!lastAttempt && (
          <>
            {hintsUsed > 0 && (
              <AppCard>
                <Text style={styles.hintTitle}>Hint {hintsUsed}</Text>
                <Text style={styles.hintText}>
                  {exercise.hints[Math.min(hintsUsed - 1, exercise.hints.length - 1)]}
                </Text>
              </AppCard>
            )}
            <View style={styles.actions}>
              <AppButton
                variant="secondary"
                label={hintsUsed < exercise.hints.length ? 'Show hint' : 'No more hints'}
                disabled={hintsUsed >= exercise.hints.length}
                onPress={showHint}
                style={styles.actionButton}
              />
              <AppButton
                label={busy ? 'Checking…' : 'Submit'}
                disabled={busy || !answer.trim()}
                onPress={handleSubmit}
                style={styles.actionButton}
              />
            </View>
          </>
        )}

        {lastAttempt && (
          <>
            <AppCard>
              <Text style={styles.resultTitle}>{resultTitle}</Text>
              <Text style={styles.demoNote}>Demo grader: target retrieval + a few known grammar rules only.</Text>
              <Text style={styles.metric}>Target coverage: {Math.round(lastAttempt.grade.coverage * 100)}%</Text>
              <Text style={styles.metric}>Hints used: {lastAttempt.hintsUsed}</Text>

              {lastAttempt.grade.errors.map((error) => (
                <View key={error.code} style={styles.errorBox}>
                  <Text style={styles.errorTitle}>{error.title}</Text>
                  <Text style={styles.errorText}>{error.explanation}</Text>
                  {error.correction ? <Text style={styles.correction}>Try: {error.correction}</Text> : null}
                </View>
              ))}

              {lastAttempt.grade.feedback.map((item) => (
                <Text key={item} style={styles.feedback}>
                  • {item}
                </Text>
              ))}

              {exercise.referenceAnswer ? (
                <View style={styles.referenceBox}>
                  <Text style={styles.referenceLabel}>Reference answer</Text>
                  <Text style={styles.reference}>{exercise.referenceAnswer}</Text>
                </View>
              ) : null}
            </AppCard>
            <AppButton
              label={index + 1 === workout.exercises.length ? 'Finish workout' : 'Next task'}
              onPress={next}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  loadingText: { color: theme.colors.textMuted },
  container: { flexGrow: 1, padding: 20, paddingBottom: 160, gap: 16, backgroundColor: theme.colors.background },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kind: { color: theme.colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  progress: { color: theme.colors.textMuted, fontWeight: '700' },
  title: { color: theme.colors.text, fontSize: 26, fontWeight: '900' },
  levelLabel: { color: theme.colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1.1, marginTop: -8 },
  prompt: { color: theme.colors.text, fontSize: 19, lineHeight: 30, fontWeight: '700' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { color: theme.colors.textMuted, backgroundColor: theme.colors.surfaceAlt, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12 },
  inputMode: { color: theme.colors.textMuted, fontSize: 12, marginBottom: -8 },
  input: { minHeight: 150, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 17, lineHeight: 25, padding: 16 },
  actions: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1 },
  hintTitle: { color: theme.colors.warning, fontWeight: '900', marginBottom: 6 },
  hintText: { color: theme.colors.text, lineHeight: 22 },
  resultTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '900', marginBottom: 8 },
  demoNote: { color: theme.colors.warning, fontSize: 12, lineHeight: 18, marginBottom: 10 },
  metric: { color: theme.colors.textMuted, marginBottom: 4 },
  errorBox: { marginTop: 14, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12 },
  errorTitle: { color: theme.colors.danger, fontWeight: '900', marginBottom: 4 },
  errorText: { color: theme.colors.textMuted, lineHeight: 21 },
  correction: { color: theme.colors.text, marginTop: 6, fontWeight: '700' },
  feedback: { color: theme.colors.textMuted, lineHeight: 21, marginTop: 8 },
  referenceBox: { marginTop: 16, backgroundColor: theme.colors.surfaceAlt, borderRadius: 14, padding: 14 },
  referenceLabel: { color: theme.colors.primary, fontWeight: '900', fontSize: 12, marginBottom: 6 },
  reference: { color: theme.colors.text, lineHeight: 22 },
  completeContainer: { flex: 1, justifyContent: 'center', padding: 24, gap: 16, backgroundColor: theme.colors.background },
  completeKicker: { color: theme.colors.primary, fontWeight: '900', letterSpacing: 1.2 },
  completeTitle: { color: theme.colors.text, fontSize: 28, lineHeight: 35, fontWeight: '900' },
  completeBody: { color: theme.colors.textMuted, fontSize: 16, lineHeight: 24, marginBottom: 4 },
});
