import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { useAppData } from '../../context/AppDataContext';
import { theme } from '../../lib/theme';

export default function ProgressScreen() {
  const { attempts, errors, resetDemo } = useAppData();
  const independent = attempts.filter((attempt) => attempt.hintsUsed === 0 && attempt.grade.passed).length;
  const independentRate = attempts.length ? Math.round((independent / attempts.length) * 100) : 0;
  const activated = new Set(attempts.flatMap((attempt) => attempt.grade.activatedItems));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Progress that means something.</Text>
      <Text style={styles.subtitle}>We track production behavior, not just “lesson completed”.</Text>

      <View style={styles.row}>
        <AppCard style={styles.stat}><Text style={styles.value}>{attempts.length}</Text><Text style={styles.label}>Attempts</Text></AppCard>
        <AppCard style={styles.stat}><Text style={styles.value}>{independentRate}%</Text><Text style={styles.label}>Independent pass</Text></AppCard>
      </View>
      <View style={styles.row}>
        <AppCard style={styles.stat}><Text style={styles.value}>{activated.size}</Text><Text style={styles.label}>Items retrieved</Text></AppCard>
        <AppCard style={styles.stat}><Text style={styles.value}>{errors.length}</Text><Text style={styles.label}>Error types</Text></AppCard>
      </View>

      <AppCard>
        <Text style={styles.sectionTitle}>Next experiment metric</Text>
        <Text style={styles.body}>The real goal is unseen transfer: can an expression practiced here appear correctly in a different translation or free-writing task later?</Text>
      </AppCard>

      <AppButton
        variant="secondary"
        label="Reset demo data"
        onPress={() => Alert.alert('Reset local data?', 'This clears attempts and the Error Bank on this device.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: () => void resetDemo() },
        ])}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  container: { flexGrow: 1, width: '100%', maxWidth: 840, alignSelf: 'center', padding: 20, paddingBottom: 48, gap: 14, backgroundColor: theme.colors.background },
  title: { color: theme.colors.text, fontSize: 28, fontWeight: '900' },
  subtitle: { color: theme.colors.textMuted, lineHeight: 21, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, alignItems: 'center' },
  value: { color: theme.colors.text, fontSize: 25, fontWeight: '900' },
  label: { color: theme.colors.textMuted, fontSize: 12, marginTop: 4, textAlign: 'center' },
  sectionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  body: { color: theme.colors.textMuted, lineHeight: 22 },
});
