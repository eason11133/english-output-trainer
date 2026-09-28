import DateTimePicker, {type DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {router} from 'expo-router';
import React,{useState} from 'react';
import {Platform,Pressable,StyleSheet,Text,View} from 'react-native';
import {LearnerAction} from '../../components/experience/LearnerAction';
import {OnboardingShell} from '../../components/experience/OnboardingShell';
import {useCanonicalProductData} from '../../context/AppDataContext';
import {eotLearnerTokensV1 as t} from '../../src/ui';

const afterDays=(days:number)=>{const value=new Date();value.setHours(12,0,0,0);value.setDate(value.getDate()+days);return value};
const dateText=(value:Date)=>`${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;

export default function ExamDate(){
  const{profile,updateProductContext}=useCanonicalProductData();
  const[examDate,setExamDate]=useState(profile.onboarding.examTargetDate?new Date(`${profile.onboarding.examTargetDate}T12:00:00`):afterDays(120));
  const[mockDate,setMockDate]=useState(profile.onboarding.nextMockDate?new Date(`${profile.onboarding.nextMockDate}T12:00:00`):afterDays(14));
  const[editing,setEditing]=useState<'EXAM'|'MOCK'|null>(null);
  const onChange=(_:DateTimePickerEvent,value?:Date)=>{if(value)(editing==='EXAM'?setExamDate:setMockDate)(value);if(Platform.OS!=='ios')setEditing(null)};
  async function commit(){const exam=dateText(examDate),mock=dateText(mockDate);await updateProductContext({exam:{deadline:exam},onboarding:{examTargetDate:exam,nextMockDate:mock,examTargetUnknown:false,setupStage:'TIME'}});router.push('/onboarding/time')}
  return <OnboardingShell step={2} title="接下來的時間點" subtitle="先把重要日期放進來。">
    <View style={s.pickerCard}><Text style={s.label}>學測日期</Text><Pressable accessibilityRole="button" accessibilityLabel="修改學測日期" onPress={()=>setEditing('EXAM')} style={s.dateButton}><Text style={s.dateLabel}>{dateText(examDate)}</Text></Pressable></View>
    <View style={s.pickerCard}><Text style={s.label}>下一次模考</Text><Pressable accessibilityRole="button" accessibilityLabel="修改下一次模考日期" onPress={()=>setEditing('MOCK')} style={s.dateButton}><Text style={s.dateLabel}>{dateText(mockDate)}</Text></Pressable></View>
    {editing?<DateTimePicker value={editing==='EXAM'?examDate:mockDate} mode="date" display="default" minimumDate={afterDays(1)} onChange={onChange}/>:null}
    <LearnerAction label="繼續" onPress={()=>void commit()}/>
  </OnboardingShell>;
}
const s=StyleSheet.create({pickerCard:{paddingVertical:16,borderBottomWidth:1,borderBottomColor:t.colors.line,gap:4},label:{fontSize:14,lineHeight:21,color:t.colors.muted},dateButton:{minHeight:48,alignItems:'flex-start',justifyContent:'center'},dateLabel:{fontSize:18,lineHeight:25,fontWeight:'600',color:t.colors.ink}});
