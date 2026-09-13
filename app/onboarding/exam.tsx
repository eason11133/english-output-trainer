import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { LearnerAction } from '../../components/experience/LearnerAction';
import { OnboardingShell } from '../../components/experience/OnboardingShell';
import { useCanonicalProductData } from '../../context/AppDataContext';
import type { GsatRecentResultV1, GsatSectionV1 } from '../../src/product';
import { gsatRecentResultFromInputV1, normalizeGsatMockInputV1, type GsatMockEntryKindV1 } from '../../src/product-policy/exam/gsatMockInput';
import { eotLearnerTokensV1 as t } from '../../src/ui';

type Section={id:GsatSectionV1;label:string;maximum:number;maxInput:number;pointValue:number;kind:'wrong'|'score'};
const wrongSections:readonly Section[]=[
  {id:'VOCABULARY',label:'詞彙題',maximum:10,maxInput:10,pointValue:1,kind:'wrong'},
  {id:'CLOZE',label:'綜合測驗',maximum:10,maxInput:10,pointValue:1,kind:'wrong'},
  {id:'WORD_BANK',label:'文意選填',maximum:10,maxInput:10,pointValue:1,kind:'wrong'},
  {id:'DISCOURSE_STRUCTURE',label:'篇章結構',maximum:8,maxInput:4,pointValue:2,kind:'wrong'},
  {id:'READING_COMPREHENSION',label:'閱讀測驗',maximum:24,maxInput:12,pointValue:2,kind:'wrong'},
];
const scoreSections:readonly Section[]=[
  {id:'MIXED_FORMAT',label:'混合題',maximum:10,maxInput:10,pointValue:1,kind:'score'},
  {id:'ZH_EN_TRANSLATION',label:'中譯英',maximum:8,maxInput:8,pointValue:1,kind:'score'},
  {id:'ENGLISH_COMPOSITION',label:'英文作文',maximum:20,maxInput:20,pointValue:1,kind:'score'},
];
const sections=[...wrongSections,...scoreSections];

export default function RecentResult(){
  const{profile,updateProductContext}=useCanonicalProductData();
  const[values,setValues]=useState<Record<string,string>>({...profile.onboarding.mockScoreDraft});
  async function next(){
    const now=new Date().toISOString();
    const recentResults:GsatRecentResultV1[]=sections.flatMap(section=>{
      const result=gsatRecentResultFromInputV1({definition:{section:section.id,maximum:section.maximum,maxInput:section.maxInput,pointValue:section.pointValue,kind:(section.kind==='wrong'?'WRONG_COUNT':'SCORE') as GsatMockEntryKindV1},raw:values[section.id]??'',reportedAt:now});
      return result?[result]:[];
    });
    const history=[...profile.gsatBeta.recentResults,...recentResults].sort((a,b)=>a.reportedAt.localeCompare(b.reportedAt));
    const retained=history.filter((row,index,all)=>all.filter(candidate=>candidate.section===row.section).slice(-3).includes(row));
    await updateProductContext({gsatBeta:{hasRecentMock:'YES',recentResults:retained,calibrationRequired:recentResults.length===0},onboarding:{setupStage:'HANDOFF'}});
    router.push('/onboarding/handoff');
  }
  const group=(title:string,helper:string,items:readonly Section[])=><View style={s.group}><Text style={s.groupTitle}>{title}</Text><Text style={s.helper}>{helper}</Text>{items.map(section=><View key={section.id} style={s.field}><View style={s.fieldCopy}><Text style={s.label}>{section.label}</Text><Text style={s.affordance}>{section.kind==='wrong'?`錯幾題（共 ${section.maxInput} 題）`:`拿幾分（滿分 ${section.maximum} 分）`}</Text></View><TextInput accessibilityLabel={`${section.label} ${section.kind==='wrong'?'錯幾題':'拿幾分'}`} keyboardType={section.kind==='score'?'decimal-pad':'number-pad'} returnKeyType="next" value={values[section.id]??''} onChangeText={value=>{const normalized=normalizeGsatMockInputV1(value,section.kind==='wrong'?'WRONG_COUNT':'SCORE');setValues(current=>{const next={...current,[section.id]:normalized};void updateProductContext({onboarding:{mockScoreDraft:next}});return next})}} placeholder={section.kind==='wrong'?'錯題數':'得分'} style={s.input}/></View>)}</View>;
  return <OnboardingShell step={3} title="填你記得的就好" subtitle="不知道的可以留白；這只是幫 EOT 安排第一步。">
    {group('選擇題：填「錯幾題」','例如詞彙題錯 3 題，就填 3。',wrongSections)}
    {group('非選擇題：填「拿幾分」','混合題、中譯英和作文，請填老師給的分數。',scoreSections)}
    <LearnerAction label="繼續" onPress={()=>void next()}/>
  </OnboardingShell>;
}
const s=StyleSheet.create({group:{padding:16,borderRadius:t.radius.large,backgroundColor:t.colors.paper,gap:11},groupTitle:{fontSize:18,fontWeight:'900',color:t.colors.ink},helper:{fontSize:13,lineHeight:20,color:t.colors.muted},field:{minHeight:70,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,borderTopWidth:1,borderTopColor:t.colors.line,paddingTop:11},fieldCopy:{flex:1,gap:3},label:{fontSize:15,fontWeight:'900',color:t.colors.ink},affordance:{fontSize:12,color:t.colors.muted},input:{width:92,minHeight:50,borderRadius:10,backgroundColor:t.colors.background,paddingHorizontal:10,fontSize:17,textAlign:'center',color:t.colors.ink}});
