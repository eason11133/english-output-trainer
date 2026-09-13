import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppCard } from '../components/AppCard';
import { WORKSPACE_DEMOS, WorkspaceKind } from '../data/organizationSeed';
import { theme } from '../lib/theme';

const WORKSPACE_KINDS: WorkspaceKind[] = ['teacher', 'cram_school', 'school'];

function AbilityBar({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.abilityRow}>
      <Text style={styles.abilityLabel}>{label}</Text>
      <View style={styles.track}><View style={[styles.fill, { width: `${value}%` }]} /></View>
      <Text style={styles.abilityValue}>{value}</Text>
    </View>
  );
}

export default function OrganizationDemoScreen() {
  const [kind, setKind] = useState<WorkspaceKind>('cram_school');
  const workspace = WORKSPACE_DEMOS[kind];
  const averageIndependent = useMemo(
    () => Math.round(workspace.learners.reduce((sum, learner) => sum + learner.independentRate, 0) / workspace.learners.length),
    [workspace],
  );
  const highRisk = workspace.learners.filter((learner) => learner.risk === 'high').length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>ORGANIZATION WORKSPACE · DEMO</Text>
      <Text style={styles.title}>One engine, different workspaces.</Text>
      <Text style={styles.subtitle}>
        Personal learners use the training app. Teachers, cram schools and schools can manage learner seats and view ability evidence from the same underlying data.
      </Text>

      <View style={styles.chips}>
        {WORKSPACE_KINDS.map((item) => {
          const active = item === kind;
          return (
            <Pressable key={item} onPress={() => setKind(item)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{WORKSPACE_DEMOS[item].label}</Text>
            </Pressable>
          );
        })}
      </View>

      <AppCard>
        <Text style={styles.cardTitle}>{workspace.label}</Text>
        <Text style={styles.className}>{workspace.className}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statValue}>{workspace.activeSeats}/{workspace.seatLimit}</Text><Text style={styles.statLabel}>Learner seats</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{averageIndependent}%</Text><Text style={styles.statLabel}>Avg. independent</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{highRisk}</Text><Text style={styles.statLabel}>High-risk</Text></View>
        </View>
        <Text style={styles.note}>Commercial concept only: organization plans can later be billed by active learner seats. No pricing is decided yet.</Text>
      </AppCard>

      <Text style={styles.sectionTitle}>Learner ability snapshots</Text>
      {workspace.learners.map((learner) => (
        <AppCard key={learner.id}>
          <View style={styles.learnerHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.learnerName}>{learner.name}</Text>
              <Text style={styles.meta}>{learner.outputLevel} · Last practice: {learner.lastPractice}</Text>
            </View>
            <View style={[styles.riskBadge, learner.risk === 'high' && styles.riskHigh, learner.risk === 'watch' && styles.riskWatch]}>
              <Text style={styles.riskText}>{learner.risk.replace('_', ' ')}</Text>
            </View>
          </View>
          <AbilityBar label="Grammar" value={learner.grammar} />
          <AbilityBar label="Active vocab" value={learner.activeVocabulary} />
          <AbilityBar label="Retrieval" value={learner.retrieval} />
          <Text style={styles.metaBottom}>{learner.independentRate}% independent · {learner.trackedErrors} tracked error types</Text>
        </AppCard>
      ))}

      <AppCard>
        <Text style={styles.cardTitle}>What a real teacher workspace will need</Text>
        <Text style={styles.bullet}>• Invite / remove learners and manage seat count</Text>
        <Text style={styles.bullet}>• Create classes and assign workouts</Text>
        <Text style={styles.bullet}>• View learner ability, recurring errors and practice history</Text>
        <Text style={styles.bullet}>• Compare class-level trends without exposing private free-writing by default</Text>
      </AppCard>

      <AppButton variant="secondary" label="Back to personal training" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  container: { flexGrow: 1, width: '100%', maxWidth: 980, alignSelf: 'center', padding: 20, paddingBottom: 56, gap: 16, backgroundColor: theme.colors.background },
  kicker: { color: theme.colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: theme.colors.text, fontSize: 30, lineHeight: 36, fontWeight: '900' },
  subtitle: { color: theme.colors.textMuted, fontSize: 15, lineHeight: 23 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceAlt, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999 },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.textMuted, fontWeight: '800', fontSize: 12 },
  chipTextActive: { color: theme.colors.primaryText },
  cardTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '900' },
  className: { color: theme.colors.textMuted, marginTop: 4, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: theme.colors.surfaceAlt, borderRadius: 14, padding: 12, alignItems: 'center' },
  statValue: { color: theme.colors.text, fontSize: 20, fontWeight: '900' },
  statLabel: { color: theme.colors.textMuted, marginTop: 4, fontSize: 10, textAlign: 'center' },
  note: { color: theme.colors.warning, marginTop: 14, fontSize: 12, lineHeight: 19 },
  sectionTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '900', marginTop: 4 },
  learnerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  learnerName: { color: theme.colors.text, fontWeight: '900', fontSize: 16 },
  meta: { color: theme.colors.textMuted, fontSize: 11, marginTop: 4 },
  riskBadge: { backgroundColor: theme.colors.surfaceAlt, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  riskWatch: { backgroundColor: '#40351D' },
  riskHigh: { backgroundColor: '#49252A' },
  riskText: { color: theme.colors.text, fontWeight: '800', fontSize: 10, textTransform: 'uppercase' },
  abilityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 9 },
  abilityLabel: { width: 82, color: theme.colors.textMuted, fontSize: 11 },
  track: { flex: 1, height: 8, borderRadius: 999, backgroundColor: theme.colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999, backgroundColor: theme.colors.primary },
  abilityValue: { width: 28, color: theme.colors.text, fontSize: 11, textAlign: 'right' },
  metaBottom: { color: theme.colors.textMuted, fontSize: 11, marginTop: 12 },
  bullet: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 23, marginTop: 4 },
});
