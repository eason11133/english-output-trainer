import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCanonicalProductData } from '../../context/AppDataContext';
import { loadMyEnglishAbilityV1, loadMyEnglishVMV1, MyEnglishVMV1 } from '../../src/experience';
import { Href, router } from 'expo-router';
import { eotLearnerTokensV1 as t } from '../../src/ui';
import { LexicalEncounterPanel } from '../../components/learning/LexicalEncounterPanel';
import { UniversalLookupText } from '../../components/learning/UniversalLookupText';
import {MemoryTruthSurface,type MemoryTruthGroup} from '../../components/experience/MemoryTruthSurface';

export default function MyEnglish(){
  const {learnerPreferences,profile,recordTutorialAction}=useCanonicalProductData();
  const [vm,setVM]=useState<MyEnglishVMV1|null>(null);
  const [ability,setAbility]=useState<Awaited<ReturnType<typeof loadMyEnglishAbilityV1>>|null>(null);
  const [captureOpen,setCaptureOpen]=useState(false);
  useEffect(()=>{void Promise.all([loadMyEnglishVMV1(learnerPreferences.learnerId),loadMyEnglishAbilityV1(learnerPreferences.learnerId)]).then(([nextVM,nextAbility])=>{setVM(nextVM);setAbility(nextAbility)})},[learnerPreferences.learnerId]);

  const memoryGroups:MemoryTruthGroup[]=ability?.state==='EMPTY'?[]:[{title:'已經能自己做到',items:(ability?.areas??[]).filter(x=>x.statusLabel.includes('自己')).map(x=>({when:'最近',target:x.label,truth:x.statusLabel}))},{title:'還常需要一點支援',items:(ability?.areas??[]).filter(x=>!x.statusLabel.includes('自己')).map(x=>({when:'最近',target:x.label,truth:x.statusLabel}))},{title:'最近出現',items:(vm?.recentMemory??[]).map((truth,index)=>({when:index?'最近':'今天',target:ability?.areas[index]?.label??'這次練過的英文',truth}))}];
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}><Text style={s.title}>My English</Text><Text style={s.subtitle}>EOT 最近記得這些</Text>
    {!vm||!ability?<ActivityIndicator/>:ability.state==='EMPTY'
      ?<View style={s.empty}><Text style={s.emptyTitle}>先做一次練習</Text><Text style={s.note}>這裡只會記下你真的用過的英文；現在空白，不代表你不會。</Text><Pressable accessibilityRole="button"onPress={()=>router.push('/(tabs)/practice' as Href)}style={s.action}><Text style={s.actionTitle}>開始練習</Text></Pressable></View>
      :<>
        <MemoryTruthSurface groups={memoryGroups}/>
        <View style={s.direction}><Text style={s.sectionTitle}>接下來</Text><Text style={s.directionText}>{vm.progressNarrative}</Text></View>
        {vm.practiceAgain.length?<View style={s.direction}><Text style={s.sectionLabel}>再找回來</Text>{vm.practiceAgain.slice(0,2).map(item=><Text key={item} style={s.example}>{item}</Text>)}</View>:null}
        {vm.recentLearnerEnglish.slice(0,1).map((example,index)=><UniversalLookupText key={`${index}-${example}`} text={example} sourceFamily="MY_ENGLISH" responsePhase="POST_RESPONSE" style={s.example}/>)}
        {profile.onboarding.status!=='COMPLETED'?<Pressable accessibilityRole="button" onPress={()=>{router.push('/(tabs)/practice' as Href);void recordTutorialAction('MY_ENGLISH_EXPLAINED_FROM_REAL_CHANGE',`my-english-reviewed:${learnerPreferences.learnerId}`,'/(tabs)/my-english')}}style={s.action}><Text style={s.actionTitle}>我看懂了，看看相關練習</Text></Pressable>:null}
      </>}
    <View style={s.capture}><Pressable accessibilityRole="button" accessibilityState={{expanded:captureOpen}} onPress={()=>setCaptureOpen(value=>!value)} style={s.captureToggle}><Text style={s.captureTitle}>記下我遇到的英文</Text><Text style={s.chevron}>{captureOpen?'−':'＋'}</Text></Pressable>{captureOpen?<LexicalEncounterPanel/>:null}</View>
    <Pressable accessibilityRole="button"onPress={()=>router.push('/progress-history' as Href)}style={s.history}><Text style={s.historyText}>查看完整歷程</Text></Pressable>
  </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:t.colors.canvas},page:{width:'100%',maxWidth:t.layout.learnerShellMaxWidth,alignSelf:'center',paddingHorizontal:20,paddingTop:28,paddingBottom:96},title:{fontSize:30,lineHeight:37,fontWeight:'600',color:t.colors.ink},subtitle:{fontSize:16,lineHeight:24,color:t.colors.muted,marginTop:8,marginBottom:40},note:{fontSize:14,lineHeight:21,color:t.colors.muted},capture:{borderTopWidth:1,borderBottomWidth:1,borderColor:t.colors.line,marginTop:24},captureToggle:{minHeight:58,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},captureTitle:{fontSize:15,fontWeight:'600',color:t.colors.deepWood},empty:{paddingVertical:32,borderTopWidth:1,borderBottomWidth:1,borderColor:t.colors.line,gap:16},emptyTitle:{fontSize:24,lineHeight:31,fontWeight:'600',color:t.colors.ink},memoryGroup:{marginBottom:32},sectionTitle:{fontSize:18,lineHeight:25,fontWeight:'600',color:t.colors.ink,marginBottom:8},memoryItem:{paddingVertical:16,borderBottomWidth:1,borderBottomColor:t.colors.line,gap:6},when:{fontSize:12,lineHeight:18,color:t.colors.subtle},memoryText:{fontSize:16,lineHeight:24,color:t.colors.ink},chevron:{fontSize:24,color:t.colors.muted},direction:{paddingVertical:8,marginBottom:24},directionText:{fontSize:16,lineHeight:24,color:t.colors.ink},sectionLabel:{fontSize:12,color:t.colors.muted},example:{fontSize:14,lineHeight:21,color:t.colors.muted,marginBottom:8},action:{minHeight:52,paddingHorizontal:18,borderRadius:14,backgroundColor:t.colors.deepWood,alignItems:'center',justifyContent:'center',marginBottom:24},actionTitle:{color:t.colors.paper,fontSize:16,fontWeight:'600'},history:{minHeight:44,justifyContent:'center'},historyText:{color:t.colors.deepWood,fontSize:14,fontWeight:'600'}});

