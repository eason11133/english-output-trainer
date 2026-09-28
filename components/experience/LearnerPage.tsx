import { eotLearnerTokensV1 as woodTheme } from '../../src/ui/tokens';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { eotLearnerTokensV1 as t } from '../../src/ui';

export const learnerPalette={
  background:t.colors.background,
  paper:t.colors.paper,
  ink:t.colors.ink,
  muted:t.colors.muted,
  accent:t.colors.deepWood,
  line:t.colors.line
};

export function LearnerPage({kicker,title,subtitle,children}:{kicker?:string;title:string;subtitle?:string;children:React.ReactNode}){
  return <SafeAreaView style={s.safe}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.page}>{kicker?<Text style={s.kicker}>{kicker}</Text>:null}<Text style={s.title}>{title}</Text>{subtitle?<Text style={s.subtitle}>{subtitle}</Text>:null}{children}</ScrollView></SafeAreaView>;
}
export function SparseCard({title,body,children}:{title:string;body:string;children?:React.ReactNode}){
  return <View style={s.card}><Text style={s.cardTitle}>{title}</Text><Text style={s.body}>{body}</Text>{children}</View>;
}
const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:t.colors.canvas},
  page:{width:'100%',minWidth:0,maxWidth:t.layout.learnerShellMaxWidth,alignSelf:'center',paddingHorizontal:t.spacing.lg,paddingTop:t.spacing.md,paddingBottom:96,gap:t.spacing.md},
  kicker:{fontSize:12,fontWeight:'800',color:t.colors.midWood,letterSpacing:1.1,textTransform:'uppercase'},
  title:{fontSize:30,lineHeight:38,fontWeight:'900',letterSpacing:-.5,color:t.colors.ink,flexShrink:1},
  subtitle:{fontSize:15,lineHeight:23,color:t.colors.muted,marginTop:-6,flexShrink:1},
  card:{padding:20,borderRadius:t.radius.large,backgroundColor:t.colors.paper,borderWidth:1,borderColor:t.colors.border,gap:10,shadowColor:woodTheme.colors.shadow,shadowOpacity:.05,shadowRadius:12,shadowOffset:{width:0,height:4},elevation:1},
  cardTitle:{fontSize:18,lineHeight:26,fontWeight:'900',color:t.colors.ink},
  body:{fontSize:14,lineHeight:22,color:t.colors.muted},
});
