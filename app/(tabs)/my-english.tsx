import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCanonicalProductData } from '../../context/AppDataContext';
import { loadMyEnglishAbilityV1, loadMyEnglishVMV1, MyEnglishVMV1 } from '../../src/experience';
import { UniversalLookupText } from '../../components/learning/UniversalLookupText';
import { Href, router } from 'expo-router';
import { eotLearnerTokensV1 as t } from '../../src/ui';
import { LexicalEncounterPanel } from '../../components/learning/LexicalEncounterPanel';

export default function MyEnglish(){
  const {learnerPreferences,profile,recordTutorialAction}=useCanonicalProductData();
  const [vm,setVM]=useState<MyEnglishVMV1|null>(null);
  const [ability,setAbility]=useState<Awaited<ReturnType<typeof loadMyEnglishAbilityV1>>|null>(null);
  const [captureOpen,setCaptureOpen]=useState(false);
  useEffect(()=>{void Promise.all([loadMyEnglishVMV1(learnerPreferences.learnerId),loadMyEnglishAbilityV1(learnerPreferences.learnerId)]).then(([nextVM,nextAbility])=>{setVM(nextVM);setAbility(nextAbility)})},[learnerPreferences.learnerId]);

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}><Text style={s.kicker}>MY ENGLISH</Text><Text style={s.title}>我的英文</Text>
    <View style={s.capture}><Pressable accessibilityRole="button" accessibilityState={{expanded:captureOpen}} onPress={()=>setCaptureOpen(value=>!value)} style={s.captureToggle}><Text style={s.captureTitle}>記下我遇到的英文</Text><Text style={s.chevron}>{captureOpen?'−':'＋'}</Text></Pressable>{captureOpen?<LexicalEncounterPanel/>:null}</View>
    {!vm||!ability?<ActivityIndicator/>:ability.state==='EMPTY'
      ?<View style={s.empty}><Text style={s.emptyTitle}>先做一次練習</Text><Text style={s.note}>這裡只會記下你真的用過的英文；現在空白，不代表你不會。</Text><Pressable accessibilityRole="button"onPress={()=>router.push('/(tabs)/practice' as Href)}style={s.action}><Text style={s.actionTitle}>開始練習</Text></Pressable></View>
      :<>
        {vm.recentMemory.length?<View style={s.memory}><Text style={s.sectionLabel}>EOT 記得</Text>{vm.recentMemory.map(item=><Text key={item} style={s.memoryText}>{item}</Text>)}</View>:null}
        <Text style={s.note}>下面只根據你真的寫過、選過、修正過的內容。</Text>
        <View style={s.areas}>{ability.areas.map(item=><Pressable key={item.id} accessibilityRole="button" onPress={()=>router.push(`/(tabs)/practice?practiceFamily=${encodeURIComponent(item.family)}&area=${encodeURIComponent(item.id)}&origin=MY_ENGLISH` as Href)} style={s.area}><View style={s.areaCopy}><Text style={s.areaTitle}>{item.label}</Text><Text style={s.areaStatus}>{item.statusLabel}</Text></View><Text style={s.chevron}>›</Text></Pressable>)}</View>
        <View style={s.direction}><Text style={s.sectionLabel}>接下來</Text><Text style={s.directionText}>{vm.progressNarrative}</Text></View>
        {vm.practiceAgain.length?<View style={s.direction}><Text style={s.sectionLabel}>再找回來</Text>{vm.practiceAgain.slice(0,2).map(item=><Text key={item} style={s.example}>{item}</Text>)}</View>:null}
        {vm.recentLearnerEnglish.slice(0,1).map((example,index)=><UniversalLookupText key={`${index}-${example}`}text={example}submitted/>)}
        {profile.onboarding.status!=='COMPLETED'?<Pressable accessibilityRole="button" onPress={()=>void (async()=>{await recordTutorialAction('MY_ENGLISH_EXPLAINED_FROM_REAL_CHANGE',`my-english-reviewed:${learnerPreferences.learnerId}`,'/(tabs)/my-english');router.push('/(tabs)/practice' as Href)})}style={s.action}><Text style={s.actionTitle}>我看懂了，看看相關練習</Text></Pressable>:null}
      </>}
    <Pressable accessibilityRole="button"onPress={()=>router.push('/progress-history' as Href)}style={s.history}><Text style={s.historyText}>查看進展與歷程</Text></Pressable>
  </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:t.colors.canvas},page:{width:'100%',maxWidth:t.layout.learnerShellMaxWidth,alignSelf:'center',paddingHorizontal:24,paddingTop:28,paddingBottom:96,gap:22},kicker:{fontSize:11,fontWeight:'900',letterSpacing:1.8,color:t.colors.midWood},title:{fontSize:32,lineHeight:40,fontWeight:'900',letterSpacing:-.7,color:t.colors.ink},note:{fontSize:14,lineHeight:22,color:t.colors.muted},capture:{borderTopWidth:1,borderBottomWidth:1,borderColor:t.colors.line},captureToggle:{minHeight:58,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},captureTitle:{fontSize:15,fontWeight:'800',color:t.colors.deepWood},empty:{paddingVertical:26,borderTopWidth:1,borderBottomWidth:1,borderColor:t.colors.line,gap:14},emptyTitle:{fontSize:22,fontWeight:'900',color:t.colors.ink},memory:{padding:18,borderRadius:16,backgroundColor:t.colors.woodWash,gap:8},memoryText:{fontSize:16,lineHeight:24,fontWeight:'800',color:t.colors.ink},areas:{borderTopWidth:1,borderTopColor:t.colors.line},area:{minHeight:76,flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderBottomColor:t.colors.line},areaCopy:{flex:1,gap:5},areaTitle:{fontSize:18,fontWeight:'900',color:t.colors.ink},areaStatus:{fontSize:13,color:t.colors.muted},chevron:{fontSize:26,color:t.colors.midWood},direction:{paddingVertical:6,gap:9},sectionLabel:{fontSize:12,fontWeight:'900',letterSpacing:.8,color:t.colors.midWood},directionText:{fontSize:17,lineHeight:26,fontWeight:'700',color:t.colors.ink},example:{fontSize:14,lineHeight:22,color:t.colors.muted},action:{minHeight:54,paddingHorizontal:18,borderRadius:16,backgroundColor:t.colors.deepWood,alignItems:'center',justifyContent:'center'},actionTitle:{color:t.colors.paper,fontSize:16,fontWeight:'900'},history:{paddingVertical:14},historyText:{color:t.colors.deepWood,fontSize:14,fontWeight:'800'}});

