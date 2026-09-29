import { Href, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCanonicalProductData } from '../context/AppDataContext';
import { loadExamResultVMV1, loadLatestResultVMV1, resultNavigationV1 } from '../src/experience';
import { useLearnerBack } from '../components/experience/useLearnerBack';
import { eotLearnerTokensV1 as t } from '../src/ui';

type VM=Awaited<ReturnType<typeof loadLatestResultVMV1>>;

export default function Result(){
  const params=useLocalSearchParams<{origin?:string;practiceFamily?:string;practiceArea?:string;amount?:string;sessionId?:string}>(),navigation=resultNavigationV1(params);
  const {learnerPreferences,profile,recordTutorialAction,runtimeProductContext}=useCanonicalProductData();
  const [vm,setVM]=useState<VM|null>(null);
  const navigationInFlight=useRef(false);
  const tutorial=profile.onboarding.status!=='COMPLETED';
  useEffect(()=>{void (params.sessionId?loadExamResultVMV1(learnerPreferences.learnerId,params.sessionId):loadLatestResultVMV1(learnerPreferences.learnerId)).then(setVM)},[learnerPreferences.learnerId,params.sessionId]);
  const navigateOnce=(href:string,replace=false)=>{if(navigationInFlight.current)return;navigationInFlight.current=true;if(replace)router.replace(href as Href);else router.push(href as Href)};
  const exitResult=()=>navigateOnce(navigation.primary.href,true);
  useLearnerBack(exitResult);
  const note=vm?.state==='READY'&&params.practiceFamily?`${params.practiceFamily}之後還會再碰到。`:undefined;
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
    {!vm?<ActivityIndicator/>:<><Text style={s.title}>今天先到這裡</Text><Text style={s.time}>{runtimeProductContext.studyMinutes} 分鐘</Text>{note?<Text numberOfLines={2} style={s.note}>{note}</Text>:null}</>}
    <View style={s.actions}><Pressable accessibilityRole="button" onPress={()=>void (async()=>{if(tutorial)await recordTutorialAction('FIRST_RESULT_SEEN',`result-seen:${learnerPreferences.learnerId}`,'/result');exitResult()})} style={s.primary}><Text style={s.primaryText}>完成</Text></Pressable><Pressable accessibilityRole="button" onPress={()=>navigateOnce('/(tabs)/practice',true)} style={s.secondary}><Text style={s.secondaryText}>再練 5 分鐘</Text></Pressable></View>
  </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:t.colors.background},page:{flexGrow:1,width:'100%',maxWidth:t.layout.learnerShellMaxWidth,alignSelf:'center',paddingHorizontal:20,paddingTop:88,paddingBottom:32},title:{fontSize:30,lineHeight:38,fontWeight:'600',color:t.colors.ink},time:{fontSize:17,lineHeight:27,color:t.colors.muted,marginTop:12},note:{fontSize:15,lineHeight:23,color:t.colors.muted,marginTop:36},actions:{marginTop:'auto',flexDirection:'row',gap:10},primary:{flex:1,minHeight:52,borderRadius:14,backgroundColor:t.colors.deepWood,alignItems:'center',justifyContent:'center'},primaryText:{fontSize:16,fontWeight:'600',color:t.colors.paper},secondary:{flex:1,minHeight:52,borderRadius:14,borderWidth:1,borderColor:t.colors.dividerStrong,alignItems:'center',justifyContent:'center'},secondaryText:{fontSize:14,fontWeight:'600',color:t.colors.deepWood}});
