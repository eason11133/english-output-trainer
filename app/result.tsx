import { Href, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCanonicalProductData } from '../context/AppDataContext';
import { loadExamResultVMV1, loadLatestResultVMV1, resultNavigationV1 } from '../src/experience';
import { useLearnerBack } from '../components/experience/useLearnerBack';
import { eotLearnerTokensV1 as t } from '../src/ui';
import { ResultTruthSurface,type ResultOutcomeV1 } from '../components/experience/ResultTruthSurface';

type VM=Awaited<ReturnType<typeof loadLatestResultVMV1>>;
type ExamReceipt={freshnessIdentity:string;evaluationCount:number;evidenceIds:readonly string[]};

export default function Result(){
  const params=useLocalSearchParams<{origin?:string;practiceFamily?:string;practiceArea?:string;amount?:string;sessionId?:string}>(),navigation=resultNavigationV1(params);
  const {learnerPreferences,profile,recordTutorialAction}=useCanonicalProductData();
  const [vm,setVM]=useState<VM|null>(null);
  const navigationInFlight=useRef(false);
  const tutorial=profile.onboarding.status!=='COMPLETED';
  useEffect(()=>{void (params.sessionId?loadExamResultVMV1(learnerPreferences.learnerId,params.sessionId):loadLatestResultVMV1(learnerPreferences.learnerId)).then(setVM)},[learnerPreferences.learnerId,params.sessionId]);
  const navigateOnce=(href:string,replace=false)=>{if(navigationInFlight.current)return;navigationInFlight.current=true;if(replace)router.replace(href as Href);else router.push(href as Href)};
  const exitResult=()=>navigateOnce(navigation.primary.href,true);
  useLearnerBack(exitResult);
  const truth=vm?.state==='READY'?(vm.canDoMoreIndependently?'換到新的內容後，你已經自己完成一次。':vm.worthAnotherTry?'剛才有提示時已經能完成，但還沒有確認換到新內容後能不能自己做。':'這次先找到最值得修的一小段，還沒有足夠證據說已經會了。'):'';
  const examReceipt=vm?.state==='READY'&&'examReceipt'in vm?vm.examReceipt as ExamReceipt:undefined;
  const authored=['TRANSLATION','WRITING'].includes(params.practiceFamily??'');
  const outcome:ResultOutcomeV1=vm?.state!=='READY'?'UNRESOLVED':vm.canDoMoreIndependently?'INDEPENDENT_FRESH_SUCCESS':vm.worthAnotherTry?'SUPPORTED_PROGRESS':authored?'AUTHORED_REPAIR':examReceipt?.freshnessIdentity.startsWith('FRESH_CHECK')?'FRESH_FAILURE':examReceipt?.evaluationCount===1?'QUICK_FIX':'UNRESOLVED';
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
    {!vm?<ActivityIndicator/>:vm.state==='EMPTY'
      ?<ResultTruthSurface primary="剛才做到的位置已保存。" secondary="查過的字和看過的提示，都沒有被算成已經會了。" next="回到原本的內容，再完成最重要的一小步。" outcome="UNRESOLVED"/>
      :<ResultTruthSurface primary={truth} next={vm.nextStep} outcome={outcome} evidenceCount={examReceipt?.evidenceIds.length??0}/>}
    <Pressable accessibilityRole="button" onPress={()=>void (async()=>{if(tutorial)await recordTutorialAction('FIRST_RESULT_SEEN',`result-seen:${learnerPreferences.learnerId}`,'/result');exitResult()})} style={s.primary}><Text style={s.primaryText}>回到 Today</Text></Pressable>
    {tutorial?<Pressable accessibilityRole="button" onPress={()=>{navigateOnce('/(tabs)/my-english',true);void recordTutorialAction('FIRST_RESULT_SEEN',`result-seen:${learnerPreferences.learnerId}`,'/result')}} style={s.secondary}><Text style={s.secondaryText}>看看這次留下的英文</Text></Pressable>:null}
  </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:t.colors.background},page:{flexGrow:1,width:'100%',maxWidth:t.layout.learnerShellMaxWidth,alignSelf:'center',paddingHorizontal:20,paddingTop:56,paddingBottom:32},primary:{minHeight:52,marginTop:'auto',borderRadius:14,backgroundColor:t.colors.deepWood,alignItems:'center',justifyContent:'center'},primaryText:{fontSize:16,fontWeight:'600',color:t.colors.paper},secondary:{minHeight:44,alignItems:'center',justifyContent:'center'},secondaryText:{fontSize:14,fontWeight:'600',color:t.colors.midWood}});
