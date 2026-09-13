import { eotLearnerTokensV1 as woodTheme } from '../../src/ui/tokens';
import React from 'react';
import {StyleSheet,Text,View} from 'react-native';
import {eotLearnerTokensV1 as t} from '../../src/ui';

export function ContextualSpotlight({active,copy,support,children}:{active:boolean;copy:string;support?:string;children:React.ReactNode}){
  if(!active)return <>{children}</>;
  return <View style={s.wrap} pointerEvents="box-none" accessibilityLabel={copy}>
    <View pointerEvents="none" style={s.copy}><Text style={s.title}>{copy}</Text>{support?<Text style={s.support}>{support}</Text>:null}</View>
    <View style={s.target} pointerEvents="box-none">{children}</View>
  </View>;
}

const s=StyleSheet.create({wrap:{gap:9},copy:{paddingHorizontal:14,paddingVertical:11,borderRadius:t.radius.medium,backgroundColor:t.colors.woodWash,gap:4},title:{fontSize:15,lineHeight:21,fontWeight:'900',color:t.colors.ink},support:{fontSize:13,lineHeight:19,color:t.colors.muted},target:{padding:4,borderRadius:t.radius.medium,borderWidth:2,borderColor:t.colors.focus,backgroundColor:woodTheme.colors.paper,shadowColor:t.colors.focus,shadowOpacity:.18,shadowRadius:10,shadowOffset:{width:0,height:2},elevation:3}});
