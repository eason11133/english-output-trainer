import { eotLearnerTokensV1 as woodTheme } from '../../src/ui/tokens';
import { Href, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LearnerPage, learnerPalette } from '../../components/experience/LearnerPage';
import {ContextualSpotlight} from '../../components/experience/ContextualSpotlight';
import { useCanonicalProductData } from '../../context/AppDataContext';
import { examFamilyToPracticeFamilyV1 } from '../../src/content/examBetaBank';
import { loadTodayRuntimeVMV1, practiceRouteParamsV1, visiblePracticeEntriesV1, type PracticeEntryV1 } from '../../src/experience';
import { savePrivateBetaProductEventV1 } from '../../src/market-validation/privateBetaPulse';
import { loadActiveExamOperationalCheckpointV1 } from '../../src/persistence/examOperationalPersistence';

export default function Practice(){
  const{runtimeProductContext,learnerPreferences,profile,updateProductContext,recordTutorialAction}=useCanonicalProductData();
  const params=useLocalSearchParams<{practiceFamily?:string}>();
  const entries=useMemo(()=>visiblePracticeEntriesV1(runtimeProductContext.productMode),[runtimeProductContext.productMode]);
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
  return <LearnerPage title="想加強哪一種學測題型？" subtitle="選一項，Teacher 會安排這幾分鐘最值得做的練習。">
    {runtimeProductContext.productMode==='EXAM'&&examResume?<Pressable accessibilityRole="button" onPress={()=>router.push(`/exam-practice?practiceFamily=${encodeURIComponent(examFamilyToPracticeFamilyV1(examResume.runtime.family as Parameters<typeof examFamilyToPracticeFamilyV1>[0]))}` as Href)}style={s.resume}><Text style={s.resumeTitle}>繼續剛才的考試練習</Text><Text style={s.resumeBody}>答案和目前進度都已保存。</Text></Pressable>:resume?<Pressable accessibilityRole="button" onPress={()=>router.push('/daily-lesson?origin=PRACTICE' as Href)}style={s.resume}><Text style={s.resumeTitle}>繼續上次練習</Text></Pressable>:null}
    <Text style={s.groupLabel}>EOT 提供練習</Text>
    <ContextualSpotlight active={Boolean(profile.onboarding.firstDay?.milestones.MY_ENGLISH_EXPLAINED_FROM_REAL_CHANGE)&&!profile.onboarding.firstDay?.milestones.PRACTICE_VISITED} copy="如果你今天還想自己加練，就從這裡選。"><View style={s.grid}>{entries.map(entry=><Pressable key={entry.id} accessibilityRole="button" accessibilityLabel={`開始${entry.label}`} accessibilityState={{disabled:entry.availability==='UNAVAILABLE'}} disabled={entry.availability==='UNAVAILABLE'} onPress={()=>start(entry)} style={({pressed})=>[s.entry,pressed&&s.pressed,entry.availability==='UNAVAILABLE'&&s.disabled]}><Text style={s.entryTitle}>{entry.label}</Text><Text style={s.entryBody}>{entry.learnerMessage}</Text><Text style={s.start}>{entry.availability==='UNAVAILABLE'?'準備中':'開始練習 →'}</Text></Pressable>)}</View></ContextualSpotlight>
    <View style={s.divider}/><Text style={s.groupLabel}>帶入我自己的作品（選用）</Text>
    <Pressable accessibilityRole="button" onPress={()=>router.push('/daily-lesson?origin=IMPORTED_WORK' as Href)}style={s.import}><Text style={s.importTitle}>加入作文、翻譯或考卷</Text><Text style={s.importBody}>拍照、選 PDF，或直接貼上文字。</Text></Pressable>
    {profile.onboarding.status!=='COMPLETED'&&profile.onboarding.firstDay?.milestones.MY_ENGLISH_EXPLAINED_FROM_REAL_CHANGE?<Pressable accessibilityRole="button" onPress={()=>void (async()=>{await recordTutorialAction('PRACTICE_VISITED',`practice-visited:${learnerPreferences.learnerId}`,'/(tabs)/practice');await recordTutorialAction('RETURNED_TO_TODAY',`return-today:${learnerPreferences.learnerId}`,'/(tabs)/practice');await recordTutorialAction('FIRST_DAY_TUTORIAL_COMPLETED',`first-day-complete:${learnerPreferences.learnerId}`,'/(tabs)');router.replace('/(tabs)' as Href)})}style={s.resume}><Text style={s.resumeTitle}>回到 Today</Text><Text style={s.resumeBody}>今天的學習和進度都會保留。</Text></Pressable>:null}
  </LearnerPage>;
}
const s=StyleSheet.create({groupLabel:{fontSize:12,fontWeight:'900',color:learnerPalette.muted,letterSpacing:.7},grid:{gap:10},entry:{minHeight:118,padding:16,borderWidth:1,borderColor:learnerPalette.line,borderRadius:16,backgroundColor:learnerPalette.paper,gap:6},pressed:{opacity:.82,transform:[{scale:.99}]},disabled:{opacity:.45},entryTitle:{fontSize:18,fontWeight:'900',color:learnerPalette.ink},entryBody:{fontSize:13,lineHeight:20,color:learnerPalette.muted},start:{fontSize:14,fontWeight:'900',color:learnerPalette.accent,marginTop:3},divider:{height:1,backgroundColor:learnerPalette.line,marginVertical:6},import:{padding:16,borderRadius:16,backgroundColor:learnerPalette.paper,gap:4},importTitle:{fontSize:16,fontWeight:'900',color:learnerPalette.accent},importBody:{fontSize:13,lineHeight:20,color:learnerPalette.muted},resume:{padding:18,borderRadius:18,backgroundColor:learnerPalette.accent,gap:4},resumeTitle:{fontSize:16,fontWeight:'900',color:learnerPalette.paper},resumeBody:{fontSize:13,color:woodTheme.colors.lightWood},coach:{padding:14,borderRadius:14,backgroundColor:woodTheme.colors.woodWash,gap:5,borderWidth:2,borderColor:learnerPalette.accent},coachTitle:{fontSize:16,fontWeight:'900',color:learnerPalette.ink},coachBody:{fontSize:13,color:learnerPalette.muted}});
