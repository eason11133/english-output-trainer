import { Href, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCanonicalProductData } from '../context/AppDataContext';
import { loadExamResultVMV1, loadLatestResultVMV1, resultNavigationV1 } from '../src/experience';
import { useLearnerBack } from '../components/experience/useLearnerBack';
import { eotLearnerTokensV1 as t } from '../src/ui';
import { UniversalLookupText } from '../components/learning/UniversalLookupText';

type VM=Awaited<ReturnType<typeof loadLatestResultVMV1>>;

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
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
    {!vm?<ActivityIndicator/>:vm.state==='EMPTY'
      ?<><Text style={s.mark}>✓</Text><Text style={s.title}>這次先留在這裡</Text><Text style={s.body}>剛才做到的位置已保存；查過的字和看過的提示都沒有被算成已經會了。</Text></>
      :<><Text style={s.mark}>✓</Text><Text style={s.title}>{vm.canDoMoreIndependently?'這次更能自己完成了':vm.worthAnotherTry?'找到下一個練習點':'這次先完成到這裡'}</Text><UniversalLookupText text={vm.nextStep} submitted style={s.body}/></>}
    <Pressable accessibilityRole="button" onPress={()=>void (async()=>{if(tutorial)await recordTutorialAction('FIRST_RESULT_SEEN',`result-seen:${learnerPreferences.learnerId}`,'/result');exitResult()})} style={s.primary}><Text style={s.primaryText}>回到 Today</Text></Pressable>
    {tutorial?<Pressable accessibilityRole="button" onPress={()=>void (async()=>{await recordTutorialAction('FIRST_RESULT_SEEN',`result-seen:${learnerPreferences.learnerId}`,'/result');navigateOnce('/(tabs)/my-english')})} style={s.secondary}><Text style={s.secondaryText}>看看這次留下的英文</Text></Pressable>:null}
  </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:t.colors.background},page:{flexGrow:1,width:'100%',maxWidth:t.layout.learnerShellMaxWidth,alignSelf:'center',paddingHorizontal:28,paddingVertical:48,justifyContent:'center',gap:18},mark:{fontSize:34,fontWeight:'900',textAlign:'center',color:t.colors.success},title:{fontSize:29,lineHeight:38,fontWeight:'900',textAlign:'center',color:t.colors.ink},body:{fontSize:15,lineHeight:23,textAlign:'center',color:t.colors.muted},primary:{minHeight:58,marginTop:14,borderRadius:17,backgroundColor:t.colors.deepWood,alignItems:'center',justifyContent:'center'},primaryText:{fontSize:16,fontWeight:'900',color:t.colors.paper},secondary:{minHeight:48,alignItems:'center',justifyContent:'center'},secondaryText:{fontSize:14,fontWeight:'800',color:t.colors.midWood}});
