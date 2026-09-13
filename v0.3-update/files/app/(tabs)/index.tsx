import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { useAppData } from '../../context/AppDataContext';
import { getWorkoutForLevel, OUTPUT_LEVEL_META } from '../../data/seed';
import { theme } from '../../lib/theme';
import { OutputLevel } from '../../types/domain';

const LEVELS: OutputLevel[] = ['foundation', 'developing', 'intermediate'];

export default function TodayScreen() {
  const { attempts, errors, outputLevel, setOutputLevel, workoutSessions } = useAppData();
  const workout = getWorkoutForLevel(outputLevel);
  const session = workoutSessions[workout.id];
  const todayAttempts = attempts.filter((attempt) => attempt.workoutId === workout.id);
  const independent = todayAttempts.filter((attempt) => attempt.hintsUsed === 0 && attempt.grade.passed).length;
  const hasStarted = Boolean(
    session && (session.currentIndex > 0 || session.answerDraft || session.lastAttemptId || session.completed),
  );

  const workoutButtonLabel = session?.completed
    ? 'Review completed workout'
    : hasStarted
      ? 'Continue workout'
      : 'Start training';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>TODAY'S WORKOUT</Text>
      <Text style={styles.title}>Train output at the right difficulty.</Text>
      <Text style={styles.subtitle}>About {workout.estimatedMinutes} minutes · {workout.exercises.length} tasks</Text>

      <AppCard>
        <Text style={styles.cardLabel}>Output level</Text>
        <View style={styles.levelRow}>
          {LEVELS.map((level) => {
            const active = level === outputLevel;
            return (
              <Pressable
                key={level}
                onPress={() => void setOutputLevel(level)}
                style={[styles.levelChip, active && styles.levelChipActive]}
              >
                <Text style={[styles.levelChipText, active && styles.levelChipTextActive]}>
                  {OUTPUT_LEVEL_META[level].label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.levelDescription}>{OUTPUT_LEVEL_META[outputLevel].description}</Text>
        <Text style={styles.levelNote}>Manual for now. Diagnostic-based placement comes later.</Text>
      </AppCard>

      <AppCard style={styles.heroCard}>
        <Text style={styles.cardLabel}>Focus</Text>
        {workout.focusTags.map((tag) => (
          <Text key={tag} style={styles.focusItem}>• {tag}</Text>
        ))}
        <AppButton
          label={workoutButtonLabel}
          onPress={() => router.push(`/workout/${workout.id}`)}
          style={{ marginTop: 18 }}
        />
      </AppCard>

      <View style={styles.row}>
        <AppCard style={styles.statCard}>
          <Text style={styles.statValue}>{todayAttempts.length}</Text>
          <Text style={styles.statLabel}>Attempts</Text>
        </AppCard>
        <AppCard style={styles.statCard}>
          <Text style={styles.statValue}>{independent}</Text>
          <Text style={styles.statLabel}>Independent</Text>
        </AppCard>
        <AppCard style={styles.statCard}>
          <Text style={styles.statValue}>{errors.length}</Text>
          <Text style={styles.statLabel}>Tracked bugs</Text>
        </AppCard>
      </View>

      <AppCard>
        <Text style={styles.cardLabel}>Use your own mistakes</Text>
        <Text style={styles.body}>
          Import your own mock-exam questions and answers is next. Text import comes first; photo/OCR follows after the core workout UX is stable.
        </Text>
      </AppCard>

      <AppCard>
        <Text style={styles.cardLabel}>For teachers, cram schools & schools</Text>
        <Text style={styles.body}>
          The product will support separate organization workspaces where teachers can manage learner seats, classes and ability snapshots.
        </Text>
        <AppButton
          variant="secondary"
          label="Preview organization workspace"
          onPress={() => router.push('/organization-demo')}
          style={{ marginTop: 14 }}
        />
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  container: { flexGrow: 1, width: '100%', maxWidth: 840, alignSelf: 'center', padding: 20, paddingBottom: 48, gap: 18, backgroundColor: theme.colors.background },
  kicker: { color: theme.colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1.3 },
  title: { color: theme.colors.text, fontSize: 30, lineHeight: 36, fontWeight: '900' },
  subtitle: { color: theme.colors.textMuted, fontSize: 15 },
  heroCard: { padding: 20 },
  cardLabel: { color: theme.colors.text, fontSize: 16, fontWeight: '800', marginBottom: 10 },
  focusItem: { color: theme.colors.textMuted, fontSize: 16, lineHeight: 25 },
  row: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { color: theme.colors.text, fontSize: 24, fontWeight: '900' },
  statLabel: { color: theme.colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 4 },
  body: { color: theme.colors.textMuted, fontSize: 15, lineHeight: 22 },
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  levelChip: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999 },
  levelChipActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
  levelChipText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '800' },
  levelChipTextActive: { color: theme.colors.background },
  levelDescription: { color: theme.colors.text, fontSize: 14, lineHeight: 21, marginTop: 12 },
  levelNote: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 6 },
});
