import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LearnerAction } from '../../components/experience/LearnerAction';
import { OnboardingShell } from '../../components/experience/OnboardingShell';
import { useCanonicalProductData } from '../../context/AppDataContext';
import { eotLearnerTokensV1 as t } from '../../src/ui';

const DAILY=[5,10,15,20,30] as const;
const SESSION=[5,10,15,20] as const;

export default function Time(){
  const {profile,updateProductContext,recordTutorialAction}=useCanonicalProductData();
  const [daily,setDaily]=useState(profile.study.dailyStudyMinutes);
  const [session,setSession]=useState(profile.study.preferredSessionMinutes);

  async function next(){
    await updateProductContext({study:{dailyStudyMinutes:daily,preferredSessionMinutes:Math.min(session,daily)}});
    await recordTutorialAction('INITIAL_CONTEXT_COMPLETED','initial-context-saved','/onboarding/time');
    router.replace('/(tabs)');
  }

  return <OnboardingShell step={profile.gsatBeta.hasRecentMock==='YES'?3:2} title="每天留一點時間，就能開始" subtitle="EOT 會依你真的有空的時間安排份量，不用勉強完成固定題數。">
    <View style={s.section}><Text style={s.label}>一天大約能留多少時間？</Text><View style={s.row}>{DAILY.map(value=><Chip key={value}value={value}active={daily===value}onPress={()=>{setDaily(value);if(session>value)setSession(value)}}/>)}</View></View>
    <View style={s.section}><Text style={s.label}>一次專心多久最舒服？</Text><Text style={s.hint}>可以比每天總時間短，我們會拆成適合的段落。</Text><View style={s.row}>{SESSION.filter(value=>value<=daily).map(value=><Chip key={value}value={value}active={session===value}onPress={()=>setSession(value)}/>)}</View></View>
    <LearnerAction label="下一步" onPress={()=>void next()}/>
  </OnboardingShell>;
}

function Chip({value,active,onPress}:{value:number;active:boolean;onPress:()=>void}){
  return <Pressable accessibilityRole="radio" accessibilityState={{selected:active}} onPress={onPress} style={[s.chip,active&&s.active]}><Text style={[s.chipNumber,active&&s.activeText]}>{value}</Text><Text style={[s.chipUnit,active&&s.activeText]}>分鐘</Text></Pressable>;
}

const s=StyleSheet.create({
  section:{gap:12,backgroundColor:t.colors.paper,borderRadius:t.radius.large,padding:18},label:{fontSize:17,fontWeight:'900',color:t.colors.ink},hint:{fontSize:13,lineHeight:20,color:t.colors.muted,marginTop:-6},row:{flexDirection:'row',flexWrap:'wrap',gap:9},chip:{minWidth:66,minHeight:64,paddingHorizontal:11,borderRadius:t.radius.medium,borderWidth:1,borderColor:t.colors.line,backgroundColor:t.colors.background,justifyContent:'center',alignItems:'center'},active:{borderColor:t.colors.deepWood,backgroundColor:t.colors.woodWash},chipNumber:{color:t.colors.ink,fontSize:19,fontWeight:'900'},chipUnit:{color:t.colors.muted,fontSize:11,fontWeight:'700',marginTop:2},activeText:{color:t.colors.deepWood},
});
