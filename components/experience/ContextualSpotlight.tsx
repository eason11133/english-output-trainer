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

const s=StyleSheet.create({wrap:{gap:10},copy:{paddingLeft:12,borderLeftWidth:2,borderLeftColor:t.colors.focus,gap:4},title:{fontSize:14,lineHeight:21,fontWeight:'800',color:t.colors.ink},support:{fontSize:13,lineHeight:19,color:t.colors.muted},target:{paddingLeft:0}});
