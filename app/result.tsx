import { Href, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { LearnerAction } from '../components/experience/LearnerAction';
import { LearnerPage, SparseCard } from '../components/experience/LearnerPage';
import { useCanonicalProductData } from '../context/AppDataContext';
import { loadExamResultVMV1, loadLatestResultVMV1, resultNavigationV1 } from '../src/experience';
import { UniversalLookupText } from '../components/learning/UniversalLookupText';
import { useLearnerBack } from '../components/experience/useLearnerBack';
import { eotLearnerTokensV1 as t } from '../src/ui';

type VM=Awaited<ReturnType<typeof loadLatestResultVMV1>>;

export default function Result(){
  const params=useLocalSearchParams<{origin?:string;practiceFamily?:string;practiceArea?:string;amount?:string;sessionId?:string}>(),navigation=resultNavigationV1(params);
  const {learnerPreferences,profile,recordTutorialAction}=useCanonicalProductData();
  const [vm,setVM]=useState<VM|null>(null);
  const [reviewed,setReviewed]=useState(false);
  const navigationInFlight=useRef(false);
  const tutorial=profile.onboarding.status!=='COMPLETED';
  useEffect(()=>{void (params.sessionId?loadExamResultVMV1(learnerPreferences.learnerId,params.sessionId):loadLatestResultVMV1(learnerPreferences.learnerId)).then(setVM)},[learnerPreferences.learnerId,params.sessionId]);
  const navigateOnce=(href:string,replace=false)=>{if(navigationInFlight.current)return;navigationInFlight.current=true;if(replace)router.replace(href as Href);else router.push(href as Href)};
  const exitResult=()=>navigateOnce(navigation.primary.href,true);
  useLearnerBack(exitResult);
  return <LearnerPage title="這次真的留下了什麼">
    <Pressable accessibilityRole="button" accessibilityLabel="返回" onPress={exitResult} style={s.back}><Text style={s.backText}>‹ 返回</Text></Pressable>
    {!vm?<ActivityIndicator/>:vm.state==='EMPTY'
      ?<SparseCard title="還沒有可整理的結果" body="完成一份真實英文作品後，這裡會整理這次做到的改變和下一步。"/>
      :reviewed?<><SparseCard
        title={vm.canDoMoreIndependently?'這次有些內容已經更能自己完成':vm.worthAnotherTry?'已經找到值得再試一次的地方':'這次先把問題看清楚了'}
        body={`${vm.returned?'你已經把剛才學到的內容帶回原本作品修改。':'接下來可以把剛才練過的內容帶回原本作品。'} ${vm.nextStep}`}
      /><UniversalLookupText text={vm.nextStep}submitted/></>:<LearnerAction label="看懂這次的改變" onPress={()=>void (async()=>{setReviewed(true);if(profile.onboarding.status!=='COMPLETED')await recordTutorialAction('FIRST_RESULT_SEEN',`result-reviewed:${learnerPreferences.learnerId}`,'/result')})}/>}
    {reviewed?<>{tutorial?<LearnerAction label="接著看看我的英文" onPress={()=>navigateOnce('/(tabs)/my-english')}/>:<LearnerAction label={navigation.primary.label} onPress={()=>navigateOnce(navigation.primary.href,true)}/>} 
    {!tutorial?navigation.secondary.map(action=><LearnerAction key={action.label} label={action.label} onPress={()=>navigateOnce(action.href)}/>):null}</>:null}
  </LearnerPage>;
}
const s=StyleSheet.create({back:{minHeight:44,alignSelf:'flex-start',justifyContent:'center',paddingRight:18},backText:{color:t.colors.deepWood,fontWeight:'800'}});
