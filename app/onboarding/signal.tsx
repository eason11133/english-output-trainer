import {router} from 'expo-router';
import React,{useRef} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {OnboardingShell} from '../../components/experience/OnboardingShell';
import {useCanonicalProductData} from '../../context/AppDataContext';
import {eotLearnerTokensV1 as t} from '../../src/ui';

export default function InitialSignal(){
  const{updateProductContext}=useCanonicalProductData();const busy=useRef(false);
  async function choose(source:'MOCK'|'QUICK_DIAG'){if(busy.current)return;busy.current=true;try{await updateProductContext({gsatBeta:{hasRecentMock:source==='MOCK'?'YES':'NO',calibrationRequired:source==='QUICK_DIAG'},onboarding:{initialSignalSource:source,setupStage:source==='MOCK'?'MOCK_SCORE':'QUICK_DIAG'}});router.push(source==='MOCK'?'/onboarding/exam':'/quick-calibration')}finally{busy.current=false}}
  return <OnboardingShell step={3} title="先用哪一種資訊找方向？" subtitle="兩條路都只用來安排第一步，不會直接判定你已經會了什麼。">
    <View style={s.paths}>
      <Path title="我剛考完模考" copy="把你記得的成績填進來，我先用現成資訊抓方向。" onPress={()=>void choose('MOCK')}/>
      <Path title="直接幫我測" copy="用幾個短題目快速找出現在最值得補的地方。" onPress={()=>void choose('QUICK_DIAG')}/>
    </View>
  </OnboardingShell>;
}
function Path({title,copy,onPress}:{title:string;copy:string;onPress:()=>void}){return <Pressable accessibilityRole="button" onPress={onPress} style={({pressed})=>[s.path,pressed&&s.pressed]}><Text style={s.title}>{title}</Text><Text style={s.copy}>{copy}</Text></Pressable>}
const s=StyleSheet.create({paths:{gap:12},path:{minHeight:104,padding:18,borderRadius:t.radius.large,backgroundColor:t.colors.paper,borderWidth:1,borderColor:t.colors.line,gap:7},title:{fontSize:19,fontWeight:'900',color:t.colors.ink},copy:{fontSize:14,lineHeight:22,color:t.colors.muted},pressed:{opacity:.75}});
