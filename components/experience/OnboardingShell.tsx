import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView, type KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { eotLearnerTokensV1 as t } from '../../src/ui';

export function OnboardingShell({step,title,subtitle,children}:{step:1|2|3;title:string;subtitle:string;children:React.ReactNode}){
  const scrollRef=useRef<KeyboardAwareScrollViewRef>(null);
  useEffect(()=>{scrollRef.current?.scrollTo({y:0,animated:false})},[step]);
  return <SafeAreaView style={s.safe}><KeyboardAwareScrollView ref={scrollRef} style={s.safe} keyboardShouldPersistTaps="handled" bottomOffset={96} contentContainerStyle={s.page}>
      <View style={s.top}>
        {step>1?<Pressable accessibilityRole="button" accessibilityLabel="返回上一步" hitSlop={10} onPress={()=>router.back()} style={s.back}><Ionicons name="arrow-back" size={22} color={t.colors.ink}/></Pressable>:<View style={s.brand}><View style={s.brandMark}/><Text style={s.brandText}>EOT</Text></View>}
        <Text style={s.step}>{step} / 3</Text>
      </View>
      <View style={s.progress}>{[1,2,3].map(item=><View key={item} style={[s.progressPart,item<=step&&s.progressOn]}/>)}</View>
      <View style={s.body}><View style={s.heading}><Text style={s.title}>{title}</Text><Text style={s.subtitle}>{subtitle}</Text></View>{children}</View>
  </KeyboardAwareScrollView></SafeAreaView>;
}

const s=StyleSheet.create({safe:{flex:1,backgroundColor:t.colors.background},page:{width:'100%',maxWidth:t.layout.learnerShellMaxWidth,alignSelf:'center',paddingHorizontal:t.spacing.lg,paddingTop:8,paddingBottom:160,gap:t.spacing.lg},body:{gap:t.spacing.lg},top:{height:44,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{width:44,height:44,alignItems:'flex-start',justifyContent:'center'},brand:{flexDirection:'row',alignItems:'center',gap:8},brandMark:{width:12,height:12,borderRadius:6,backgroundColor:t.colors.focus},brandText:{fontSize:16,fontWeight:'900',letterSpacing:1,color:t.colors.deepWood},step:{fontSize:13,fontWeight:'800',color:t.colors.subtle},progress:{height:4,flexDirection:'row',gap:6},progressPart:{flex:1,borderRadius:2,backgroundColor:t.colors.line},progressOn:{backgroundColor:t.colors.deepWood},heading:{gap:8,marginTop:t.spacing.sm},title:{fontSize:30,lineHeight:38,fontWeight:'900',letterSpacing:-.5,color:t.colors.ink},subtitle:{fontSize:15,lineHeight:23,color:t.colors.muted}});
