import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { LearnerAction } from '../../components/experience/LearnerAction';
import { OnboardingShell } from '../../components/experience/OnboardingShell';
import { useCanonicalProductData } from '../../context/AppDataContext';
import type { GsatRecentResultV1, GsatSectionV1 } from '../../src/product';
import { gsatRecentResultFromInputV1, normalizeGsatMockInputV1, type GsatMockEntryKindV1 } from '../../src/product-policy/exam/gsatMockInput';
import { eotLearnerTokensV1 as t } from '../../src/ui';

type Section={id:GsatSectionV1;label:string;maximum:number};
const sections:readonly Section[]=[
  {id:'VOCABULARY',label:'詞彙',maximum:10},{id:'CLOZE',label:'綜合測驗',maximum:10},
  {id:'WORD_BANK',label:'文意選填',maximum:10},{id:'DISCOURSE_STRUCTURE',label:'篇章結構',maximum:8},
  {id:'READING_COMPREHENSION',label:'閱讀測驗',maximum:24},{id:'MIXED_FORMAT',label:'混合題',maximum:10},
  {id:'ZH_EN_TRANSLATION',label:'中譯英',maximum:8},{id:'ENGLISH_COMPOSITION',label:'英文作文',maximum:20},
];

export default function RecentResult(){
  const{profile,updateProductContext}=useCanonicalProductData();
  const[values,setValues]=useState<Record<string,string>>({...profile.onboarding.mockScoreDraft});
  async function next(){
    const now=new Date().toISOString();
    const recentResults:GsatRecentResultV1[]=sections.flatMap(section=>{
      const result=gsatRecentResultFromInputV1({definition:{section:section.id,maximum:section.maximum,maxInput:section.maximum,pointValue:1,kind:'SCORE' as GsatMockEntryKindV1},raw:values[section.id]??'',reportedAt:now});
      return result?[result]:[];
    });
    const history=[...profile.gsatBeta.recentResults,...recentResults].sort((a,b)=>a.reportedAt.localeCompare(b.reportedAt));
    const retained=history.filter((row,index,all)=>all.filter(candidate=>candidate.section===row.section).slice(-3).includes(row));
    await updateProductContext({gsatBeta:{hasRecentMock:'YES',recentResults:retained,calibrationRequired:recentResults.length===0},onboarding:{setupStage:'HANDOFF'}});
    router.push('/onboarding/handoff');
  }
  return <OnboardingShell step={3} title="最近一次模考" subtitle="有寫的就填，沒有可以留白。">
    <View style={s.grid}>{sections.map(section=><View key={section.id} style={s.field}><View style={s.fieldCopy}><Text style={s.label}>{section.label}</Text><Text style={s.affordance}>滿分 {section.maximum}</Text></View><TextInput accessibilityLabel={`${section.label} 得分`} keyboardType="decimal-pad" returnKeyType="next" value={values[section.id]??''} onChangeText={value=>{const normalized=normalizeGsatMockInputV1(value,'SCORE');setValues(current=>{const next={...current,[section.id]:normalized};void updateProductContext({onboarding:{mockScoreDraft:next}});return next})}} placeholder="—" style={s.input}/></View>)}</View>
    <LearnerAction label="繼續" onPress={()=>void next()}/>
  </OnboardingShell>;
}
const s=StyleSheet.create({grid:{flexDirection:'row',flexWrap:'wrap',columnGap:16,rowGap:20},field:{width:'47%',minHeight:76},fieldCopy:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:3},label:{fontSize:14,lineHeight:21,fontWeight:'600',color:t.colors.ink},affordance:{fontSize:12,lineHeight:18,color:t.colors.muted},input:{width:'100%',height:48,borderWidth:1,borderColor:t.colors.line,borderRadius:10,backgroundColor:t.colors.surface,paddingHorizontal:10,fontSize:17,textAlign:'center',color:t.colors.ink}});
