import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { LearnerPage, SparseCard, learnerPalette } from '../../components/experience/LearnerPage';
import { useCanonicalProductData } from '../../context/AppDataContext';
import { loadMyEnglishAbilityV1, loadMyEnglishVMV1, MyEnglishVMV1 } from '../../src/experience';
import { UniversalLookupText } from '../../components/learning/UniversalLookupText';
import { Href, router } from 'expo-router';

export default function MyEnglish(){
  const {learnerPreferences,profile,recordTutorialAction}=useCanonicalProductData();
  const [vm,setVM]=useState<MyEnglishVMV1|null>(null);
  const [ability,setAbility]=useState<Awaited<ReturnType<typeof loadMyEnglishAbilityV1>>|null>(null);
  useEffect(()=>{void Promise.all([loadMyEnglishVMV1(learnerPreferences.learnerId),loadMyEnglishAbilityV1(learnerPreferences.learnerId)]).then(([nextVM,nextAbility])=>{setVM(nextVM);setAbility(nextAbility)})},[learnerPreferences.learnerId]);

  return <LearnerPage title="我的英文">
    {!vm||!ability?<ActivityIndicator/>:ability.state==='EMPTY'
      ?<SparseCard title="EOT 還在認識你的英文" body="做幾個真實練習後，這裡會記住你認出過、用過，以及最近需要再找回來的英文。現在沒有資料，不代表你不會。"><Pressable accessibilityRole="button"onPress={()=>router.push('/(tabs)/practice' as Href)}style={s.action}><Text style={s.actionTitle}>開始一次練習</Text></Pressable></SparseCard>
      :<>
        <Text style={s.note}>只整理你真的遇過或做過的部分；其他英文先不替你下判斷。</Text>
        {ability.areas.map(item=><SparseCard key={item.id} title={item.label} body={item.statusLabel}><Pressable accessibilityRole="button"onPress={()=>router.push(`/(tabs)/practice?practiceFamily=${encodeURIComponent(item.family)}&area=${encodeURIComponent(item.id)}&origin=MY_ENGLISH` as Href)}style={s.areaAction}><Text style={s.areaActionText}>{item.actionLabel}</Text></Pressable></SparseCard>)}
        <SparseCard title="目前整體方向" body={vm.progressNarrative}/>
        {vm.practiceAgain.length?<SparseCard title="最近需要提示的例子" body={vm.practiceAgain.slice(0,2).join('\n')}/>:null}
        {vm.recentLearnerEnglish.slice(0,1).map((example,index)=><UniversalLookupText key={`${index}-${example}`}text={example}submitted/>)}
        {profile.onboarding.status!=='COMPLETED'?<Pressable accessibilityRole="button" onPress={()=>void (async()=>{await recordTutorialAction('MY_ENGLISH_EXPLAINED_FROM_REAL_CHANGE',`my-english-reviewed:${learnerPreferences.learnerId}`,'/(tabs)/my-english');router.push('/(tabs)/practice' as Href)})}style={s.action}><Text style={s.actionTitle}>我看懂了，看看相關練習</Text></Pressable>:null}
      </>}
    <Pressable accessibilityRole="button"onPress={()=>router.push('/progress-history' as Href)}style={s.history}><Text style={s.historyText}>查看進展與歷程</Text></Pressable>
  </LearnerPage>;
}
const s=StyleSheet.create({note:{fontSize:13,lineHeight:20,color:learnerPalette.muted},action:{padding:16,borderRadius:12,backgroundColor:learnerPalette.accent,gap:4},actionTitle:{color:learnerPalette.paper,fontSize:16,fontWeight:'900'},areaAction:{paddingVertical:8},areaActionText:{color:learnerPalette.accent,fontWeight:'900'},history:{paddingVertical:14},historyText:{color:learnerPalette.accent,fontSize:15,fontWeight:'800'}});

