import {router} from 'expo-router';
import React,{useRef} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {OnboardingShell} from '../../components/experience/OnboardingShell';
import {useCanonicalProductData} from '../../context/AppDataContext';
import {eotLearnerTokensV1 as t} from '../../src/ui';

const choices=[{label:'10 分',minutes:10,budget:10 as const},{label:'15 分',minutes:15,budget:20 as const},{label:'20 分',minutes:20,budget:20 as const},{label:'30 分',minutes:30,budget:'30_PLUS' as const},{label:'45 分',minutes:45,budget:'30_PLUS' as const}] as const;
export default function Time(){
  const{updateProductContext,recordTutorialAction}=useCanonicalProductData();
  const busy=useRef(false);
  async function select(choice:typeof choices[number]){if(busy.current)return;busy.current=true;try{await updateProductContext({study:{dailyStudyMinutes:choice.minutes,preferredSessionMinutes:choice.minutes,dailyBudget:choice.budget},gsatBeta:{hasRecentMock:'YES',calibrationRequired:false},onboarding:{initialSignalSource:'MOCK',setupStage:'MOCK_SCORE'}});await recordTutorialAction('INITIAL_CONTEXT_COMPLETED',`daily-budget:${choice.budget}`,'/onboarding/time');router.push('/onboarding/exam')}finally{busy.current=false}}
  return <OnboardingShell step={3} title="每天想留多少時間給英文？" subtitle="之後可以再調整。">
    <View style={s.choices}>{choices.map(choice=><Pressable key={choice.label} accessibilityRole="button" onPress={()=>void select(choice)} style={({pressed})=>[s.choice,pressed&&s.pressed]}><Text style={s.label}>{choice.label}</Text></Pressable>)}</View>
  </OnboardingShell>;
}
const s=StyleSheet.create({choices:{flexDirection:'row',flexWrap:'wrap',gap:8},choice:{minHeight:44,paddingHorizontal:16,borderRadius:8,borderWidth:1,borderColor:t.colors.line,justifyContent:'center'},label:{fontSize:16,fontWeight:'600',color:t.colors.ink},pressed:{backgroundColor:t.colors.amberSoft,borderColor:t.colors.focus}});
