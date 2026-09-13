import Ionicons from '@expo/vector-icons/Ionicons';
import{router}from'expo-router';
import React,{useState}from'react';
import{Pressable,StyleSheet,Text,View}from'react-native';
import{LearnerAction}from'../../components/experience/LearnerAction';
import{OnboardingShell}from'../../components/experience/OnboardingShell';
import{EOTFirstLaunchIntro}from'../../components/experience/EOTFirstLaunchIntro';
import{useCanonicalProductData}from'../../context/AppDataContext';
import{eotLearnerTokensV1 as t}from'../../src/ui';
import{needsFirstLaunchIntroV1}from'../../src/experience';

export default function GsatWelcome(){
 const{profile,updateProductContext,selectProductExperience,recordTutorialAction}=useCanonicalProductData();const[recent,setRecent]=useState<'YES'|'NO'|undefined>(profile.gsatBeta.hasRecentMock==='UNKNOWN'?undefined:profile.gsatBeta.hasRecentMock);
 async function next(){if(!recent)return;await updateProductContext({goals:{primaryGoal:'準備學測英文，找出最值得補強的得分能力',learningPurpose:'EXAM',useContexts:['EXAM_TASKS']},exam:{examType:'學測英文',scope:'學測英文全卷'},gsatBeta:{hasRecentMock:recent,calibrationRequired:recent==='NO',recentResults:[]},onboarding:{status:'IN_PROGRESS'}});await selectProductExperience('EXAM');router.push(recent==='YES'?'/onboarding/exam':'/onboarding/time')}
 return <EOTFirstLaunchIntro active={needsFirstLaunchIntroV1(profile)} onFinished={async()=>{await recordTutorialAction('OPENING_COMPLETED','first-opening','/onboarding/goals');await updateProductContext({gsatBeta:{coachMarks:{opening:true}}})}}><OnboardingShell step={1} title="學過的，讓你真正用得出來。" subtitle="先留一點背景，再一起走過今天的學習。卡住的地方，我會陪你拆成一小步。">
  <View style={s.promise}><View style={s.icon}><Ionicons name="navigate" size={22} color={t.colors.paper}/></View><View style={s.promiseCopy}><Text style={s.promiseTitle}>只專注學測英文</Text><Text style={s.promiseBody}>詞彙、綜合測驗、文意選填、篇章結構、閱讀、混合題、中譯英與英文作文。</Text></View></View>
  <View style={s.question}><Text style={s.label}>最近有學測模考成績嗎？</Text><Text style={s.hint}>有的話，只填你記得的部分；沒有也可以直接做快速校準。</Text><View style={s.row}><Choice label="有，可以大概填" active={recent==='YES'} onPress={()=>setRecent('YES')}/><Choice label="沒有／不記得" active={recent==='NO'} onPress={()=>setRecent('NO')}/></View></View>
  <LearnerAction label={recent==='YES'?'填最近成績':recent==='NO'?'做快速校準':'選一個選項繼續'} disabled={!recent} onPress={()=>void next()}/>
 </OnboardingShell></EOTFirstLaunchIntro>
}
function Choice({label,active,onPress}:{label:string;active:boolean;onPress:()=>void}){return <Pressable accessibilityRole="radio" accessibilityState={{selected:active}} onPress={onPress} style={[s.choice,active&&s.choiceOn]}><Ionicons name={active?'radio-button-on':'radio-button-off'} size={21} color={active?t.colors.deepWood:t.colors.subtle}/><Text style={s.choiceText}>{label}</Text></Pressable>}
const s=StyleSheet.create({promise:{padding:18,borderRadius:t.radius.xlarge,backgroundColor:t.colors.woodWash,flexDirection:'row',gap:13},icon:{width:42,height:42,borderRadius:21,backgroundColor:t.colors.deepWood,alignItems:'center',justifyContent:'center'},promiseCopy:{flex:1,gap:4},promiseTitle:{fontSize:17,fontWeight:'900',color:t.colors.ink},promiseBody:{fontSize:13,lineHeight:20,color:t.colors.muted},question:{gap:11,paddingVertical:8},label:{fontSize:20,lineHeight:28,fontWeight:'900',color:t.colors.ink},hint:{fontSize:14,lineHeight:22,color:t.colors.muted},row:{gap:10},choice:{minHeight:58,paddingHorizontal:15,borderRadius:t.radius.medium,backgroundColor:t.colors.paper,borderWidth:1,borderColor:'transparent',flexDirection:'row',alignItems:'center',gap:10},choiceOn:{backgroundColor:t.colors.woodWash,borderColor:t.colors.deepWood},choiceText:{fontSize:15,fontWeight:'800',color:t.colors.ink}});
