import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../../components/AppCard';
import { useAppData } from '../../context/AppDataContext';
import { theme } from '../../lib/theme';

export default function ErrorBankScreen() {
  const { errors } = useAppData();
  const sorted = [...errors].sort((a, b) => b.count - a.count);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your real grammar bugs.</Text>
      <Text style={styles.subtitle}>Not a textbook chapter list — only mistakes you actually made.</Text>

      {sorted.length === 0 ? (
        <AppCard>
          <Text style={styles.emptyTitle}>No tracked errors yet.</Text>
          <Text style={styles.empty}>
            This is intentional: the bank only grows from mistakes detected in your own answers. The current demo grader catches a small set of known patterns, so it may stay empty until you actually trigger one.
          </Text>
          <Text style={styles.example}>Try writing “many student” or “I want improve my English” in a workout to test the demo tracking.</Text>
        </AppCard>
      ) : (
        sorted.map((error) => (
          <AppCard key={error.code}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.errorTitle}>{error.title}</Text>
                <Text style={styles.code}>{error.code}</Text>
              </View>
              <View style={styles.badge}><Text style={styles.badgeText}>{error.count}×</Text></View>
            </View>
            <Text style={styles.lastSeen}>Last seen: {new Date(error.lastSeenAt).toLocaleDateString()}</Text>
          </AppCard>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  container: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 840,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 48,
    gap: 14,
    backgroundColor: theme.colors.background,
  },
  title: { color: theme.colors.text, fontSize: 28, fontWeight: '900' },
  subtitle: { color: theme.colors.textMuted, lineHeight: 21, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  errorTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
  code: { color: theme.colors.textMuted, marginTop: 4, fontSize: 12 },
  badge: { minWidth: 42, height: 32, paddingHorizontal: 10, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceAlt },
  badgeText: { color: theme.colors.warning, fontWeight: '900' },
  lastSeen: { color: theme.colors.textMuted, marginTop: 12, fontSize: 13 },
  emptyTitle: { color: theme.colors.text, fontWeight: '900', fontSize: 17, marginBottom: 8 },
  empty: { color: theme.colors.textMuted, lineHeight: 22 },
  example: { color: theme.colors.warning, lineHeight: 20, fontSize: 12, marginTop: 12 },
});
