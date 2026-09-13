import { eotLearnerTokensV1 as woodTheme } from '../../src/ui/tokens';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert,Platform,Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useCanonicalProductData } from '../../context/AppDataContext';
import { PriorityKindV2 } from '../../src/product';
import { buildPrivateBetaReportTextV1 } from '../../src/market-validation/privateBetaPulse';
import { LearnerAction } from './LearnerAction';
import { LearnerPage, SparseCard, learnerPalette } from './LearnerPage';
import{resetLearnerDataV1}from'../../src/persistence';

const PRIORITIES:readonly {id:PriorityKindV2;label:string}[]=[{id:'NONE',label:'照老師安排'},{id:'WRITING',label:'最近先多處理寫作'},{id:'TRANSLATION',label:'最近先多處理翻譯'},{id:'VOCABULARY',label:'最近先補輸出需要的字詞'},{id:'GRAMMAR',label:'最近先補句型與文法'},{id:'READING',label:'最近先處理閱讀後輸出'},{id:'EXAM_TASK',label:'最近先處理考試題型'}];

export function ProfileSettingsScreen(){
  const {profile,updateProductContext}=useCanonicalProductData();
  const [name,setName]=useState(profile.identity.displayName);
  const [goal,setGoal]=useState(profile.goals.primaryGoal);
  const [daily,setDaily]=useState(String(profile.study.dailyStudyMinutes));
  const [session,setSession]=useState(String(profile.study.preferredSessionMinutes));
  const [examType,setExamType]=useState(profile.exam.examType);
  const [scope,setScope]=useState(profile.exam.scope);
  const [deadline,setDeadline]=useState(profile.exam.deadline??'');
  const [rubric,setRubric]=useState(profile.exam.rubric??'');
  const [targetScore,setTargetScore]=useState(profile.exam.targetScore??'');
  const [saveMessage,setSaveMessage]=useState('');
  const [betaExportBusy,setBetaExportBusy]=useState(false);
  const priority=profile.goals.currentPriority.kind;

  async function shareBetaReport(){
    if(betaExportBusy)return;
    setBetaExportBusy(true);
    try{
      const report=await buildPrivateBetaReportTextV1(profile.identity.learnerId);
      await Share.share({title:'EOT Private Beta 回饋',message:report});
      setSaveMessage('Beta 回饋報告已準備好，可直接分享給測試負責人。');
    }catch{
      setSaveMessage('目前無法匯出 Beta 回饋，資料仍保留在這台裝置。');
    }finally{setBetaExportBusy(false)}
  }

  async function save(){
    await updateProductContext({
      identity:{displayName:name},
      goals:{primaryGoal:goal},
      study:{dailyStudyMinutes:Number(daily),preferredSessionMinutes:Number(session)},
      exam:{examType,scope,deadline,rubric,targetScore},
    });
    setSaveMessage('設定已儲存。英文能力紀錄沒有被改動。');
  }
  function confirmReset(){Alert.alert('清除本機學習資料？','只會清除這台裝置上目前學習者的 EOT 資料；這不是刪除線上帳號。',[{text:'取消',style:'cancel'},{text:'清除',style:'destructive',onPress:()=>void(async()=>{const result=await resetLearnerDataV1(profile.identity.learnerId);if(!result.complete){setSaveMessage(`清除未完成：${result.errors.join('、')}`);return}router.replace('/' as never)})()}])}

  return <LearnerPage title="設定" subtitle="調整你的學習方向、時間與 Private Beta 回饋。">
    <SparseCard title="學測英文 Private Beta" body="目前版本專注學測八大題型。你的練習紀錄會持續用來調整 Today。"/>

    <SparseCard title="你的學測目標" body="這裡只用來安排學測英文的分數、速度與穩定度；不會展開成一般英文課程。">
      <Label text="目前目標"/><TextInput value={goal}onChangeText={setGoal}multiline placeholder="例如：加強閱讀速度與中譯英穩定度" style={[s.input,s.multi]}/>
    </SparseCard>

    <SparseCard title="最近有沒有想優先處理的東西" body="這只是你給老師的優先提示，不會被當成能力弱點證據。">
      <View style={s.chips}>{PRIORITIES.map(item=><Pressable key={item.id} onPress={()=>void updateProductContext({goals:{currentPriority:{kind:item.id,setAt:item.id==='NONE'?undefined:new Date().toISOString()}}})} style={[s.chip,priority===item.id&&s.chipActive]}><Text style={[s.chipText,priority===item.id&&s.chipTextActive]}>{item.label}</Text></Pressable>)}</View>
    </SparseCard>

    <SparseCard title="時間" body="每天可用時間和一次適合專心多久分開保存。">
      <View style={s.two}><View style={s.flex}><Label text="每天分鐘"/><TextInput keyboardType="number-pad" value={daily}onChangeText={setDaily}style={s.input}/></View><View style={s.flex}><Label text="一次分鐘"/><TextInput keyboardType="number-pad" value={session}onChangeText={setSession}style={s.input}/></View></View>
    </SparseCard>

    <SparseCard title="學測情境" body="日期、範圍與目標分數會協助 Today 判斷現在最值得投入的題型。">
      <Label text="考試名稱"/><TextInput value={examType}onChangeText={setExamType}placeholder="例如 學測英文"style={s.input}/>
      <Label text="範圍"/><TextInput value={scope}onChangeText={setScope}placeholder="例如 中譯英、英文作文"style={s.input}/>
      <Label text="日期"/><TextInput value={deadline}onChangeText={setDeadline}placeholder="YYYY-MM-DD"style={s.input}/>
      <Label text="評分方式"/><TextInput value={rubric}onChangeText={setRubric}multiline style={[s.input,s.multi]}/>
      <Label text="目標分數"/><TextInput value={targetScore}onChangeText={setTargetScore}style={s.input}/>
    </SparseCard>


    <SparseCard title="分享我的 Beta 回饋" body="10 秒回饋，不影響你的英文紀錄。報告不包含作答內容。">
      <LearnerAction label={betaExportBusy?'正在準備…':'分享回饋'} loading={betaExportBusy} disabled={betaExportBusy} onPress={()=>void shareBetaReport()}/>
    </SparseCard>
    {Platform.OS!=='web'?<SparseCard title="這台裝置上的資料" body="清除目前學習者的作答、能力紀錄、Teacher 歷程、草稿與 Beta 回饋。匿名安裝識別碼會保留，避免把同一台裝置誤算成新安裝。"><LearnerAction label="清除這台裝置上的 EOT 學習資料" variant="secondary" onPress={confirmReset}/></SparseCard>:null}

    {saveMessage?<Text style={s.message}>{saveMessage}</Text>:null}
    <LearnerAction label="儲存設定" onPress={()=>void save()}/>
    <LearnerAction label="回上一頁" variant="secondary" onPress={()=>router.back()}/>
  </LearnerPage>;
}

function Label({text}:{text:string}){return <Text style={s.label}>{text}</Text>}
const s=StyleSheet.create({
  label:{color:learnerPalette.muted,fontWeight:'800',fontSize:12,marginTop:5},input:{borderWidth:1,borderColor:learnerPalette.line,borderRadius:13,padding:13,color:learnerPalette.ink,backgroundColor:learnerPalette.paper,minHeight:48},multi:{minHeight:78,textAlignVertical:'top'},small:{fontSize:12,lineHeight:19,color:learnerPalette.muted},message:{fontSize:13,lineHeight:20,color:learnerPalette.accent,fontWeight:'800'},optionRow:{flexDirection:'row',gap:8,marginTop:6},product:{flex:1,minHeight:48,borderRadius:13,borderWidth:1,borderColor:learnerPalette.line,justifyContent:'center',alignItems:'center',paddingHorizontal:8},productActive:{borderColor:learnerPalette.accent,backgroundColor:woodTheme.colors.woodWash},productText:{color:learnerPalette.muted,fontWeight:'800',fontSize:12,textAlign:'center'},productTextActive:{color:learnerPalette.ink},chips:{gap:8,marginTop:5},chip:{minHeight:44,borderRadius:12,borderWidth:1,borderColor:learnerPalette.line,paddingHorizontal:12,justifyContent:'center'},chipActive:{borderColor:learnerPalette.accent,backgroundColor:woodTheme.colors.woodWash},chipText:{fontSize:13,color:learnerPalette.muted,fontWeight:'700'},chipTextActive:{color:learnerPalette.ink,fontWeight:'900'},two:{flexDirection:'row',gap:10},flex:{flex:1,gap:5},
});
