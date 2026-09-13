import {router} from 'expo-router';
import React,{useRef} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {OnboardingShell} from '../../components/experience/OnboardingShell';
import {useCanonicalProductData} from '../../context/AppDataContext';
import {eotLearnerTokensV1 as t} from '../../src/ui';

const choices=[{label:'10 分鐘',minutes:10,budget:10 as const},{label:'20 分鐘',minutes:20,budget:20 as const},{label:'30+ 分鐘',minutes:30,budget:'30_PLUS' as const}] as const;
export default function Time(){
  const{updateProductContext,recordTutorialAction}=useCanonicalProductData();
  const busy=useRef(false);
  async function select(choice:typeof choices[number]){if(busy.current)return;busy.current=true;try{await updateProductContext({study:{dailyStudyMinutes:choice.minutes,preferredSessionMinutes:choice.minutes,dailyBudget:choice.budget},onboarding:{setupStage:'SIGNAL'}});await recordTutorialAction('INITIAL_CONTEXT_COMPLETED',`daily-budget:${choice.budget}`,'/onboarding/time');router.push('/onboarding/signal')}finally{busy.current=false}}
  return <OnboardingShell step={3} title="平常一天，你願意給 EOT 幾分鐘？" subtitle="之後可以改。先讓我知道每次任務要切多大。">
    <View style={s.choices}>{choices.map(choice=><Pressable key={choice.label} accessibilityRole="button" onPress={()=>void select(choice)} style={({pressed})=>[s.choice,pressed&&s.pressed]}><Text style={s.label}>{choice.label}</Text></Pressable>)}</View>
  </OnboardingShell>;
}
const s=StyleSheet.create({choices:{gap:10},choice:{minHeight:62,paddingHorizontal:18,borderRadius:t.radius.medium,borderWidth:1,borderColor:t.colors.line,backgroundColor:t.colors.paper,justifyContent:'center'},label:{fontSize:18,fontWeight:'900',color:t.colors.ink},pressed:{opacity:.75}});
