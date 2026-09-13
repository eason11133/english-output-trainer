import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { allowWorkspaceVM, OutputWorkspaceReviewScenario, reviewScenarioLabels, reviewScenarioOrder, reviewWorkspaceVM } from '../../src/application/stage5a/outputWorkspaceVM';
import { OutputWorkspace } from './OutputWorkspace';

export function OutputWorkspaceReview({initialScenario}:{initialScenario:OutputWorkspaceReviewScenario}){
  const {width}=useWindowDimensions();
  const [scenario,setScenario]=useState(initialScenario);
  const [placed,setPlaced]=useState(false);
  const [value,setValue]=useState('');
  const vm=useMemo(()=>scenario==='ALLOW_ROLE_MAP'?allowWorkspaceVM({output:placed?'Schools should allow students to use phones for learning.':'Schools should allow to use phones for learning.',mechanismId:'grammar-role-map',supportLevel:'GUIDED',placed,representation:'ORIGINAL',editable:false,inputScope:'CONSTRUCTION'}):reviewWorkspaceVM(scenario),[placed,scenario]);
  function choose(next:OutputWorkspaceReviewScenario){setScenario(next);setPlaced(false);setValue('');router.setParams({scenario:next})}
  return <SafeAreaView style={s.safe}>
    {width>620?<View style={s.reviewControls}>{reviewScenarioOrder.map(item=><Pressable accessibilityRole="button" key={item} onPress={()=>choose(item)} style={[s.reviewChip,item===scenario&&s.reviewChipOn]}><Text style={[s.reviewChipText,item===scenario&&s.reviewChipTextOn]}>{reviewScenarioLabels[item]}</Text></Pressable>)}</View>:null}
    <KeyboardAwareScrollView style={s.safe} contentContainerStyle={s.page} keyboardShouldPersistTaps="handled" bottomOffset={96}>
      <View style={s.canvas}><View style={s.topbar}><View style={s.brandMark}><Text style={s.brandMarkText}>E</Text></View><Text style={s.brand}>EOT</Text><Text style={s.pause}>先暫停</Text></View><OutputWorkspace vm={vm} value={value} onChangeText={setValue} onPrimary={()=>{}} onPlaceLanguageObject={()=>setPlaced(true)} onStuck={()=>choose('TEACHING_CHANGES_REPRESENTATION')} onCorrectIntent={()=>{}} onPause={()=>{}} /></View>
    </KeyboardAwareScrollView>
  </SafeAreaView>;
}

const s=StyleSheet.create({safe:{flex:1,backgroundColor:'#F1EEE8'},reviewControls:{padding:14,flexDirection:'row',justifyContent:'center',gap:7,flexWrap:'wrap',backgroundColor:'#F1EEE8'},reviewChip:{minHeight:38,paddingHorizontal:13,borderRadius:999,borderWidth:1,borderColor:'#D5CFC7',backgroundColor:'#F8F5F0',alignItems:'center',justifyContent:'center'},reviewChipOn:{backgroundColor:'#292622',borderColor:'#292622'},reviewChipText:{fontSize:11,fontWeight:'600',color:'#5F574F'},reviewChipTextOn:{color:'#FFFEFC'},page:{flexGrow:1,paddingBottom:40},canvas:{width:'100%',maxWidth:390,alignSelf:'center',minHeight:844,backgroundColor:'#FFFEFC',borderWidth:1,borderColor:'#DDD7CF'},topbar:{height:60,paddingHorizontal:20,borderTopWidth:5,borderTopColor:'#9A785C',borderBottomWidth:1,borderBottomColor:'#E3DED6',flexDirection:'row',alignItems:'center'},brandMark:{width:25,height:25,borderRadius:7,borderWidth:1,borderColor:'#DCCBB8',alignItems:'center',justifyContent:'center',backgroundColor:'#FAF8F3'},brandMarkText:{fontSize:10,fontWeight:'700',color:'#654D3B'},brand:{marginLeft:9,fontSize:13,fontWeight:'800',letterSpacing:1.4,color:'#292622'},pause:{marginLeft:'auto',fontSize:12,fontWeight:'600',color:'#746E66'}});
