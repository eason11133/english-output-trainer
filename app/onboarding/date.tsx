import DateTimePicker, {type DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {router} from 'expo-router';
import React,{useState} from 'react';
import {Platform,Pressable,StyleSheet,Text,View} from 'react-native';
import {LearnerAction} from '../../components/experience/LearnerAction';
import {OnboardingShell} from '../../components/experience/OnboardingShell';
import {useCanonicalProductData} from '../../context/AppDataContext';
import {eotLearnerTokensV1 as t} from '../../src/ui';

const tomorrow=()=>{const value=new Date();value.setHours(12,0,0,0);value.setDate(value.getDate()+1);return value};
const dateText=(value:Date)=>`${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;

export default function ExamDate(){
  const{profile,updateProductContext}=useCanonicalProductData();
  const initial=profile.onboarding.examTargetDate?new Date(`${profile.onboarding.examTargetDate}T12:00:00`):tomorrow();
  const[selected,setSelected]=useState<Date>(initial);
  const[showPicker,setShowPicker]=useState(Platform.OS==='ios');
  const[hasSelection,setHasSelection]=useState(Boolean(profile.onboarding.examTargetDate));
  const onChange=(_:DateTimePickerEvent,value?:Date)=>{if(Platform.OS==='android')setShowPicker(false);if(value){setSelected(value);setHasSelection(true)}};
  async function commitDate(){const value=dateText(selected);await updateProductContext({exam:{deadline:value},onboarding:{examTargetDate:value,examTargetUnknown:false,setupStage:'TIME'}});router.push('/onboarding/time')}
  async function commitUnknown(){await updateProductContext({exam:{deadline:''},onboarding:{examTargetDate:undefined,examTargetUnknown:true,setupStage:'TIME'}});router.push('/onboarding/time')}
  return <OnboardingShell step={2} title="下一次模考或學測，大概什麼時候？" subtitle="只是用來調整現在最值得先補什麼，不確定也沒關係。">
    <View style={s.pickerCard}>
      <Pressable accessibilityRole="button" onPress={()=>setShowPicker(true)} style={s.dateButton}><Text style={s.dateLabel}>{hasSelection?dateText(selected):'選日期'}</Text></Pressable>
      {showPicker?<DateTimePicker value={selected} mode="date" display="default" minimumDate={tomorrow()} onChange={onChange}/>:null}
      {hasSelection?<LearnerAction label="繼續" onPress={()=>void commitDate()}/>:null}
    </View>
    <LearnerAction label="還不確定" variant="secondary" onPress={()=>void commitUnknown()}/>
  </OnboardingShell>;
}
const s=StyleSheet.create({pickerCard:{padding:18,borderRadius:t.radius.large,backgroundColor:t.colors.paper,gap:14},dateButton:{minHeight:56,borderWidth:1,borderColor:t.colors.borderStrong,borderRadius:t.radius.medium,alignItems:'center',justifyContent:'center'},dateLabel:{fontSize:17,fontWeight:'900',color:t.colors.deepWood}});
