import Ionicons from '@expo/vector-icons/Ionicons';
import{router}from'expo-router';
import React from'react';
import{StyleSheet,Text,View}from'react-native';
import{LearnerAction}from'../../components/experience/LearnerAction';
import{OnboardingShell}from'../../components/experience/OnboardingShell';
import{EOTFirstLaunchIntro}from'../../components/experience/EOTFirstLaunchIntro';
import{useCanonicalProductData}from'../../context/AppDataContext';
import{eotLearnerTokensV1 as t}from'../../src/ui';
import{needsFirstLaunchIntroV1}from'../../src/experience';

export default function GsatWelcome(){
 const{profile,updateProductContext,selectProductExperience,recordTutorialAction}=useCanonicalProductData();
 async function next(){await updateProductContext({goals:{primaryGoal:'準備學測英文，找出最值得補強的得分能力',learningPurpose:'EXAM',useContexts:['EXAM_TASKS']},exam:{examType:'學測英文',scope:'學測英文全卷'},onboarding:{status:'IN_PROGRESS',setupStage:'DATE'}});await selectProductExperience('EXAM');router.push('/onboarding/date')}
 return <EOTFirstLaunchIntro active={needsFirstLaunchIntroV1(profile)} onFinished={async()=>{await recordTutorialAction('OPENING_COMPLETED','first-opening','/onboarding/goals');await updateProductContext({gsatBeta:{coachMarks:{opening:true}}})}}><OnboardingShell step={1} title="學過的，讓你真正用得出來。" subtitle="先留一點背景，再一起走過今天的學習。卡住的地方，我會陪你拆成一小步。">
  <View style={s.promise}><View style={s.icon}><Ionicons name="navigate" size={22} color={t.colors.paper}/></View><View style={s.promiseCopy}><Text style={s.promiseTitle}>只專注學測英文</Text><Text style={s.promiseBody}>詞彙、綜合測驗、文意選填、篇章結構、閱讀、混合題、中譯英與英文作文。</Text></View></View>
  <LearnerAction label="繼續" onPress={()=>void next()}/>
 </OnboardingShell></EOTFirstLaunchIntro>
}
const s=StyleSheet.create({promise:{padding:18,borderRadius:t.radius.xlarge,backgroundColor:t.colors.woodWash,flexDirection:'row',gap:13},icon:{width:42,height:42,borderRadius:21,backgroundColor:t.colors.deepWood,alignItems:'center',justifyContent:'center'},promiseCopy:{flex:1,gap:4},promiseTitle:{fontSize:17,fontWeight:'900',color:t.colors.ink},promiseBody:{fontSize:13,lineHeight:20,color:t.colors.muted}});
