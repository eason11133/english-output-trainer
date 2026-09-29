import React from 'react';
import {StyleSheet,Text,View} from 'react-native';
import {eotLearnerTokensV1 as t} from '../../src/ui/tokens';
import {UniversalLookupText} from '../learning/UniversalLookupText';

export type ResultOutcomeV1='INDEPENDENT_FRESH_SUCCESS'|'SUPPORTED_PROGRESS'|'FRESH_FAILURE'|'QUICK_FIX'|'UNRESOLVED'|'AUTHORED_REPAIR';
const labels:Record<ResultOutcomeV1,string>={INDEPENDENT_FRESH_SUCCESS:'這次能自己完成',SUPPORTED_PROGRESS:'提示有幫上忙',FRESH_FAILURE:'換了情境，還需要再練一次',QUICK_FIX:'這一點已經修好',UNRESOLVED:'這次先保留到這裡',AUTHORED_REPAIR:'你的內容已經往前一步'};
export function ResultTruthSurface({primary,next,secondary,outcome='UNRESOLVED'}:{primary:string;next:string;secondary?:string;outcome?:ResultOutcomeV1;evidenceCount?:number}){
  return <View style={s.root}>
    <Text style={s.eyebrow}>今天你自己做到</Text><Text style={s.title}>{labels[outcome]}</Text>
    <UniversalLookupText text={primary} submitted style={s.truth}/>
    <View style={s.divider}/><Text style={s.nextLabel}>還需要練</Text><Text style={s.next}>{secondary??(outcome==='INDEPENDENT_FRESH_SUCCESS'?'換到更多新內容後，再確認一次。':'目前這一點還需要一些支援。')}</Text>
    <View style={s.divider}/><Text style={s.nextLabel}>接下來</Text><UniversalLookupText text={next.replace(/^下一步：/,'')} submitted style={s.next}/>
  </View>;
}
const s=StyleSheet.create({root:{gap:0},eyebrow:{fontSize:12,lineHeight:18,fontWeight:'600',color:t.colors.muted},title:{fontSize:30,lineHeight:38,fontWeight:'600',color:t.colors.ink,marginTop:8,marginBottom:40},truth:{fontSize:21,lineHeight:31,fontWeight:'600',color:t.colors.ink},secondary:{fontSize:16,lineHeight:24,color:t.colors.muted,marginTop:12},divider:{height:1,backgroundColor:t.colors.divider,marginTop:48,marginBottom:24},nextLabel:{fontSize:18,lineHeight:25,fontWeight:'600',color:t.colors.ink,marginBottom:8},next:{fontSize:16,lineHeight:24,color:t.colors.muted}});
