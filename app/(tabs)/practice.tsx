import { Href, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCanonicalProductData } from '../../context/AppDataContext';
import { examFamilyToPracticeFamilyV1 } from '../../src/content/examBetaBank';
import { loadTodayRuntimeVMV1, practiceRouteParamsV1, visiblePracticeEntriesV1, type PracticeEntryV1 } from '../../src/experience';
import { savePrivateBetaProductEventV1 } from '../../src/market-validation/privateBetaPulse';
import { loadActiveExamOperationalCheckpointV1 } from '../../src/persistence/examOperationalPersistence';
import { eotLearnerTokensV1 as t } from '../../src/ui';

export default function Practice(){
  const{runtimeProductContext,learnerPreferences,profile,updateProductContext,recordTutorialAction}=useCanonicalProductData();
  const params=useLocalSearchParams<{practiceFamily?:string}>();
  const entries=useMemo(()=>visiblePracticeEntriesV1(runtimeProductContext.productMode),[runtimeProductContext.productMode]);
  const orderedEntries=useMemo(()=>{const order=['VOCABULARY_USAGE','CLOZE','CONTEXTUAL_FILL','DISCOURSE','READING','MIXED','TRANSLATION','WRITING'];return [...entries].sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id))},[entries]);
  const[resume,setResume]=useState(false);
  const[examResume,setExamResume]=useState<Awaited<ReturnType<typeof loadActiveExamOperationalCheckpointV1>>>(null);
  const launchInFlight=useRef(false);
  useEffect(()=>{void loadTodayRuntimeVMV1(learnerPreferences.learnerId).then(vm=>setResume(vm.hasActiveLesson));void loadActiveExamOperationalCheckpointV1(learnerPreferences.learnerId).then(setExamResume)},[learnerPreferences.learnerId]);
  useFocusEffect(useCallback(()=>{void loadTodayRuntimeVMV1(learnerPreferences.learnerId).then(vm=>setResume(vm.hasActiveLesson));void loadActiveExamOperationalCheckpointV1(learnerPreferences.learnerId).then(setExamResume)},[learnerPreferences.learnerId]));
  useEffect(()=>{const requested=entries.find(entry=>entry.id===params.practiceFamily);if(requested)start(requested)},[]);

  function start(entry:PracticeEntryV1){
    if(launchInFlight.current||!entry.destination||entry.availability==='UNAVAILABLE')return;
    launchInFlight.current=true;
    if(!profile.gsatBeta.coachMarks.practice)void updateProductContext({gsatBeta:{coachMarks:{practice:true}}});
    const query=new URLSearchParams(Object.entries(practiceRouteParamsV1({entry,origin:'PRACTICE'})).filter((x):x is [string,string]=>typeof x[1]==='string')).toString();
    void savePrivateBetaProductEventV1({learnerId:learnerPreferences.learnerId,sessionId:`practice:${Date.now()}`,taskId:entry.id,family:entry.id,type:'PRACTICE_STARTED',phase:'STARTED',eventKey:'practice-start'});
    router.push(`${entry.destination}?${query}` as Href);
    setTimeout(()=>{launchInFlight.current=false},800);
  }
  const copy:Record<string,[string,string]>={VOCABULARY_USAGE:['詞彙','單字、片語與搭配'],CLOZE:['綜合測驗','綜合語意、搭配與文法'],CONTEXTUAL_FILL:['文意選填','依上下文完成空格'],DISCOURSE:['篇章結構','句子銜接與篇章順序'],READING:['閱讀','最近最值得練：證據 → 選項'],MIXED:['混合題','表格、圖表與短文整合'],TRANSLATION:['中譯英','保留你的原意，練準確表達'],WRITING:['英文作文','用自己的內容把想法寫清楚']};
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
    <Text style={s.title}>練習</Text><Text style={s.subtitle}>想練哪一種？</Text>
    {runtimeProductContext.productMode==='EXAM'&&examResume?<Pressable accessibilityRole="button" onPress={()=>router.push(`/exam-practice?practiceFamily=${encodeURIComponent(examFamilyToPracticeFamilyV1(examResume.runtime.family as Parameters<typeof examFamilyToPracticeFamilyV1>[0]))}` as Href)}style={s.resume}><Text style={s.resumeTitle}>繼續剛才的練習</Text><Text style={s.arrow}>→</Text></Pressable>:resume?<Pressable accessibilityRole="button" onPress={()=>router.push('/daily-lesson?origin=PRACTICE' as Href)}style={s.resume}><Text style={s.resumeTitle}>繼續上次練習</Text><Text style={s.arrow}>→</Text></Pressable>:null}
    <View style={s.list}>{orderedEntries.map(entry=>{const label=copy[entry.id]??[entry.label,entry.learnerMessage];return <Pressable key={entry.id} accessibilityRole="button" accessibilityLabel={`開始${entry.label}`} accessibilityState={{disabled:entry.availability==='UNAVAILABLE'}} disabled={entry.availability==='UNAVAILABLE'} onPress={()=>start(entry)} style={({pressed})=>[s.entry,pressed&&s.pressed,entry.availability==='UNAVAILABLE'&&s.disabled]}><View style={s.entryCopy}><Text style={s.entryTitle}>{label[0]}</Text><Text style={s.entryBody}>{label[1]}</Text></View><Text style={s.arrow}>›</Text></Pressable>})}</View>
    {profile.onboarding.status!=='COMPLETED'&&profile.onboarding.firstDay?.milestones.MY_ENGLISH_EXPLAINED_FROM_REAL_CHANGE?<Pressable accessibilityRole="button" onPress={()=>{router.replace('/(tabs)' as Href);void(async()=>{await recordTutorialAction('PRACTICE_VISITED',`practice-visited:${learnerPreferences.learnerId}`,'/(tabs)/practice');await recordTutorialAction('RETURNED_TO_TODAY',`return-today:${learnerPreferences.learnerId}`,'/(tabs)/practice');await recordTutorialAction('FIRST_DAY_TUTORIAL_COMPLETED',`first-day-complete:${learnerPreferences.learnerId}`,'/(tabs)')})()}}style={s.resume}><Text style={s.resumeTitle}>回到 Today</Text><Text style={s.resumeBody}>今天的學習和進度都會保留。</Text></Pressable>:null}
  </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:t.colors.canvas},page:{width:'100%',maxWidth:t.layout.learnerShellMaxWidth,alignSelf:'center',paddingHorizontal:20,paddingTop:28,paddingBottom:96},title:{fontSize:30,lineHeight:37,fontWeight:'600',color:t.colors.ink},subtitle:{fontSize:16,lineHeight:24,color:t.colors.muted,marginTop:8,marginBottom:32},group:{marginBottom:32},groupTitle:{fontSize:18,lineHeight:25,fontWeight:'600',color:t.colors.ink,marginBottom:8},list:{borderTopWidth:1,borderTopColor:t.colors.line},entry:{minHeight:72,flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderBottomColor:t.colors.line},entryCopy:{flex:1,paddingVertical:12},entryTitle:{fontSize:16,lineHeight:24,fontWeight:'600',color:t.colors.ink},entryBody:{fontSize:14,lineHeight:21,color:t.colors.muted},arrow:{fontSize:24,color:t.colors.muted},pressed:{opacity:.65},disabled:{opacity:.38},resume:{minHeight:56,paddingHorizontal:16,borderRadius:14,backgroundColor:t.colors.deepWood,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:24},resumeTitle:{fontSize:16,fontWeight:'600',color:t.colors.paper},resumeBody:{fontSize:12,color:t.colors.lightWood},import:{minHeight:58,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderTopWidth:1,borderBottomWidth:1,borderColor:t.colors.line,marginBottom:24},importTitle:{fontSize:15,fontWeight:'600',color:t.colors.deepWood}});
