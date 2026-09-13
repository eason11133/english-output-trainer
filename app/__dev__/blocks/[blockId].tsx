import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PedagogicalBlockPreview } from '../../../components/blocks/PedagogicalBlockPreview';
import { blockRegistryV4 } from '../../../src/application/v4/blockRegistryV4';

export default function BlockDetail() {
  const { blockId, student } = useLocalSearchParams<{ blockId: string; student?: string }>();
  const block = blockRegistryV4.get(blockId);
  if (!block) return <SafeAreaView><Text>Unknown registered block.</Text></SafeAreaView>;
  if (student === '1') return <SafeAreaView style={styles.studentOnly}><Stack.Screen options={{ headerShown: false }} /><PedagogicalBlockPreview block={block} /></SafeAreaView>;
  return <SafeAreaView style={styles.safe}>
    <Stack.Screen options={{ headerShown: false }} />
    <ScrollView contentContainerStyle={styles.page}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>← Block Library</Text></Pressable>
      <View style={styles.layout}>
        <View style={styles.student}>
          <Text style={styles.section}>A. Student View</Text>
          <Text style={styles.note}>這個框內只有學生可見資訊；可直接操作並檢查各種狀態。</Text>
          <PedagogicalBlockPreview block={block} />
        </View>
        <View style={styles.review}>
          <Text style={styles.section}>B. Founder Review</Text>
          <Text style={styles.title}>{block.label}</Text>
          <Meta label="Primary pedagogical role" value={block.role} />
          <Meta label="Learner action" value={block.learnerAction} />
          <Meta label="What learner gains / does" value={block.learnerGain} />
          <Meta label="Teacher must believe" value={block.selectionBelief} />
          <Meta label="Learning mechanism" value={block.mechanism} />
          <Meta label="Teacher should select" value={block.suitableFacets.join(' · ')} />
          <Meta label="Do not select" value={block.inappropriateWhen.join('；')} />
          <Meta label="Support / fade" value={`${block.supportLevels.join(' → ')}；${block.fadeRules.join('；')}`} />
          <Meta label="Evidence allowed" value={block.eligibleClaims.map(claim => claim.facet).join(' · ')} />
          <Meta label="Evidence ceiling" value={block.evidenceCeiling} />
          <Meta label="Answer exposed" value={block.exposesTargetAnswer ? 'YES — fresh assessment required' : 'NO'} />
          <Meta label="Evidence forbidden" value={block.forbiddenClaims.map(claim => claim.facet).join(' · ')} />
          <Meta label="Transitions" value={block.nextBlockIds.join(' → ')} />
          <Meta label="Accessibility" value={block.accessibility.join('；')} />
          <View style={styles.version}><Text style={styles.versionText}>v{block.version} · {block.status}</Text></View>
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return <View style={styles.meta}><Text style={styles.metaLabel}>{label}</Text><Text style={styles.metaValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFEEE9' },
  page: { padding: 24, paddingBottom: 80, maxWidth: 1120, width: '100%', alignSelf: 'center' },
  back: { fontWeight: '900', color: '#27685A', marginBottom: 20 },
  layout: { flexDirection: 'row', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start' },
  student: { width: 420, gap: 9 },
  review: { flex: 1, minWidth: 310, padding: 24, borderRadius: 22, backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDDCD5', gap: 16 },
  section: { fontSize: 12, fontWeight: '900', letterSpacing: 1, color: '#397565' },
  note: { color: '#78817D', lineHeight: 20, marginBottom: 4 },
  title: { fontSize: 30, fontWeight: '900', color: '#1B342E' },
  meta: { gap: 5, borderTopWidth: 1, borderColor: '#ECEAE4', paddingTop: 14 },
  metaLabel: { fontSize: 12, fontWeight: '900', color: '#6F7A75' },
  metaValue: { fontSize: 15, lineHeight: 23, color: '#263D37' },
  version: { alignSelf: 'flex-start', backgroundColor: '#E2EEE9', borderRadius: 99, paddingVertical: 7, paddingHorizontal: 12 },
  versionText: { fontWeight: '900', color: '#286759' },
  studentOnly: { flex: 1, backgroundColor: '#E9ECE7', alignItems: 'center', padding: 18 },
});
