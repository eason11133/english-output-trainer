import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { eotLearnerTokensV1 as t } from '../../src/ui';

export function LearnerAction({label,onPress,disabled=false,loading=false,variant='primary',style}:{label:string;onPress:()=>void;disabled?:boolean;loading?:boolean;variant?:'primary'|'secondary';style?:ViewStyle}){
  if(disabled&&!loading)return null;
  return <Pressable accessibilityRole="button" disabled={disabled||loading} onPress={onPress} style={({pressed})=>[
    s.base,
    variant==='primary'?s.primary:s.secondary,
    pressed&&s.pressed,
    (disabled||loading)&&s.disabled,
    style
  ]} accessibilityState={{disabled:disabled||loading,busy:loading}}><Text style={variant==='primary'?s.primaryText:s.secondaryText}>{label}</Text></Pressable>;
}
const s=StyleSheet.create({
  base:{minHeight:56,borderRadius:t.radius.medium,alignItems:'center',justifyContent:'center',paddingHorizontal:t.spacing.md},
  primary:{backgroundColor:t.colors.deepWood,borderWidth:1,borderColor:t.colors.borderStrong,shadowColor:t.colors.shadow,shadowOpacity:.12,shadowRadius:5,shadowOffset:{width:0,height:3},elevation:2},
  secondary:{backgroundColor:t.colors.background,borderWidth:1,borderColor:t.colors.borderStrong},
  primaryText:{color:t.colors.paper,fontSize:16,fontWeight:'800'},
  secondaryText:{color:t.colors.ink,fontSize:16,fontWeight:'700'},
  pressed:{opacity:.88,transform:[{scale:.99}]},
  disabled:{opacity:.42},
});
