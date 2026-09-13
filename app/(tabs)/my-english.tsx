import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { LearnerPage, SparseCard, learnerPalette } from '../../components/experience/LearnerPage';
import { useCanonicalProductData } from '../../context/AppDataContext';
import { loadMyEnglishAbilityV1, loadMyEnglishVMV1, MyEnglishVMV1 } from '../../src/experience';
import { UniversalLookupText } from '../../components/learning/UniversalLookupText';
import { Href, router } from 'expo-router';
import { LexicalEncounterPanel } from '../../components/learning/LexicalEncounterPanel';

export default function MyEnglish(){
  const {learnerPreferences,profile,recordTutorialAction}=useCanonicalProductData();
  const [vm,setVM]=useState<MyEnglishVMV1|null>(null);
  const [ability,setAbility]=useState<Awaited<ReturnType<typeof loadMyEnglishAbilityV1>>|null>(null);
  const [captureOpen,setCaptureOpen]=useState(false);
  useEffect(()=>{void Promise.all([loadMyEnglishVMV1(learnerPreferences.learnerId),loadMyEnglishAbilityV1(learnerPreferences.learnerId)]).then(([nextVM,nextAbility])=>{setVM(nextVM);setAbility(nextAbility)})},[learnerPreferences.learnerId]);

  return <LearnerPage title="我的英文">
    <SparseCard title="遇到的英文" body="先留下一次真實遇見；這不會被當成已經學會。"><Pressable accessibilityRole="button" accessibilityState={{expanded:captureOpen}} onPress={()=>setCaptureOpen(value=>!value)} style={s.captureToggle}><Text style={s.captureToggleText}>{captureOpen?'收起':'記下單字、片語或句子'}</Text></Pressable>{captureOpen?<LexicalEncounterPanel/>:null}</SparseCard>
    {!vm||!ability?<ActivityIndicator/>:ability.state==='EMPTY'
      ?<SparseCard title="還沒有足夠資料" body="現在不知道，不代表你不會。做幾個練習後，這裡才會整理目前能支持的能力狀態。"><Pressable accessibilityRole="button"onPress={()=>router.push('/(tabs)/practice' as Href)}style={s.action}><Text style={s.actionTitle}>做幾題看看</Text></Pressable></SparseCard>
      :<>
        <Text style={s.note}>這是目前有有效資料支持的能力地圖；資料不足會直接說不知道，不會顯示成弱。</Text>
        {ability.areas.map(item=><SparseCard key={item.id} title={item.label} body={item.statusLabel}><Pressable accessibilityRole="button"onPress={()=>router.push(`/(tabs)/practice?practiceFamily=${encodeURIComponent(item.family)}&area=${encodeURIComponent(item.id)}&origin=MY_ENGLISH` as Href)}style={s.areaAction}><Text style={s.areaActionText}>{item.actionLabel}</Text></Pressable></SparseCard>)}
        <SparseCard title="目前整體方向" body={vm.progressNarrative}/>
        {vm.practiceAgain.length?<SparseCard title="最近需要提示的例子" body={vm.practiceAgain.slice(0,2).join('\n')}/>:null}
        {vm.recentLearnerEnglish.slice(0,1).map((example,index)=><UniversalLookupText key={`${index}-${example}`}text={example}submitted/>)}
        {profile.onboarding.status!=='COMPLETED'?<Pressable accessibilityRole="button" onPress={()=>void (async()=>{await recordTutorialAction('MY_ENGLISH_EXPLAINED_FROM_REAL_CHANGE',`my-english-reviewed:${learnerPreferences.learnerId}`,'/(tabs)/my-english');router.push('/(tabs)/practice' as Href)})}style={s.action}><Text style={s.actionTitle}>我看懂了，看看相關練習</Text></Pressable>:null}
      </>}
    <Pressable accessibilityRole="button"onPress={()=>router.push('/progress-history' as Href)}style={s.history}><Text style={s.historyText}>查看進展與歷程</Text></Pressable>
  </LearnerPage>;
}
const s=StyleSheet.create({captureToggle:{minHeight:44,justifyContent:'center'},captureToggleText:{color:learnerPalette.accent,fontWeight:'900'},note:{fontSize:13,lineHeight:20,color:learnerPalette.muted},action:{padding:16,borderRadius:12,backgroundColor:'#C16F36',gap:4},actionTitle:{color:learnerPalette.paper,fontSize:16,fontWeight:'900'},areaAction:{paddingVertical:8},areaActionText:{color:learnerPalette.accent,fontWeight:'900'},history:{paddingVertical:14},historyText:{color:learnerPalette.accent,fontSize:15,fontWeight:'800'}});

