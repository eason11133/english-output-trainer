import { eotLearnerTokensV1 as woodTheme } from '../../src/ui/tokens';
import { Href, router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCanonicalProductData } from '../../context/AppDataContext';
import { deferTodayRetentionNeedV1, loadMyEnglishAbilityV1, loadTodayCurriculumVMV1, loadTodayRetentionVMV1, loadTodayRuntimeVMV1 } from '../../src/experience';
import { productTaskForTargetV1 } from '../../src/content';
import { resolveProductionExamContentForTargetV1 } from '../../src/content/productionContentSupply';
import { examFamilyToPracticeFamilyV1 } from '../../src/content/examBetaBank';
import { productExperienceAccessDecisionV2 } from '../../src/product';
import { eotLearnerTokensV1 as t } from '../../src/ui';
import { loadActiveExamOperationalCheckpointV1 } from '../../src/persistence/examOperationalPersistence';
import { gsatColdStartDecisionV1 } from '../../src/product-policy/exam';
import{UniversalLookupText}from'../../components/learning/UniversalLookupText';
import{savePrivateBetaProductEventV1}from'../../src/market-validation/privateBetaPulse';
import{ContextualSpotlight}from'../../components/experience/ContextualSpotlight';
import type { CapabilityFacet } from '../../src/domain/english/EnglishDomain';

type TodayRuntime=Awaited<ReturnType<typeof loadTodayRuntimeVMV1>>;
type TodayCurriculum=Awaited<ReturnType<typeof loadTodayCurriculumVMV1>>;
type TodayRetention=Awaited<ReturnType<typeof loadTodayRetentionVMV1>>;
type ActiveExam=Awaited<ReturnType<typeof loadActiveExamOperationalCheckpointV1>>;

const areaZh:Record<string,string>={LEXICAL:'詞彙產出',FORMULAIC:'語塊表達',GRAMMAR:'句型控制',MEANING_ENCODING:'意思轉英文',WRITING:'寫作產出',TRANSLATION:'翻譯產出',READING:'閱讀理解',DISCOURSE:'篇章組織'};
const needZh:Record<string,string>={NEW_LEARNING:'建立新能力',REPAIR:'修回不穩能力',REACTIVATION:'把之前會的拉回來',INDEPENDENCE:'從提示帶到獨立',TRANSFER:'換情境確認',RETENTION:'延後確認',MAINTENANCE:'自然維持'};

export default function Today(){
  const {learnerPreferences,profile,runtimeProductContext,recordTutorialAction}=useCanonicalProductData();
  const [active,setActive]=useState<TodayRuntime>({hasActiveLesson:false});
  const [curriculum,setCurriculum]=useState<TodayCurriculum>({state:'EMPTY',timeBudgetMinutes:runtimeProductContext.studyMinutes,reasonCodes:[]});
  const [retention,setRetention]=useState<TodayRetention>({state:'EMPTY',dueCount:0,reasonCodes:[]});
  const [activeExam,setActiveExam]=useState<ActiveExam>(null);
  const [hasEvidence,setHasEvidence]=useState<boolean|null>(null);
  const launchInFlight=useRef(false);
  const accessDecision=productExperienceAccessDecisionV2(profile,profile.access.activeExperience);
  const displayName=learnerPreferences.displayName==='Learner'?'':learnerPreferences.displayName;
  useEffect(()=>{void loadTodayRuntimeVMV1(learnerPreferences.learnerId).then(setActive)},[learnerPreferences.learnerId]);
  useEffect(()=>{void loadTodayCurriculumVMV1(learnerPreferences.learnerId,runtimeProductContext).then(setCurriculum)},[learnerPreferences.learnerId,runtimeProductContext]);
  useEffect(()=>{void loadTodayRetentionVMV1(learnerPreferences.learnerId).then(setRetention)},[learnerPreferences.learnerId]);
  useEffect(()=>{void loadActiveExamOperationalCheckpointV1(learnerPreferences.learnerId).then(setActiveExam)},[learnerPreferences.learnerId]);
  useEffect(()=>{void loadMyEnglishAbilityV1(learnerPreferences.learnerId).then(value=>setHasEvidence(value.state!=='EMPTY'))},[learnerPreferences.learnerId]);
  useFocusEffect(useCallback(()=>{void loadTodayRuntimeVMV1(learnerPreferences.learnerId).then(setActive);void loadTodayCurriculumVMV1(learnerPreferences.learnerId,runtimeProductContext).then(setCurriculum);void loadActiveExamOperationalCheckpointV1(learnerPreferences.learnerId).then(setActiveExam)},[learnerPreferences.learnerId,runtimeProductContext]));
  if(hasEvidence===null)return <SafeAreaView style={s.safe}><View style={s.loading}><ActivityIndicator color={t.colors.deepWood}/><Text style={s.focusBody}>正在準備今天的下一步…</Text></View></SafeAreaView>;
  const examResume=runtimeProductContext.productMode==='EXAM'&&!curriculum.reconsideredAfterNoEffect?activeExam:null;
  const hasResume=runtimeProductContext.productMode==='EXAM'?Boolean(examResume):active.hasActiveLesson;
  const coldStart=hasEvidence===false?gsatColdStartDecisionV1(profile,false):undefined;
  const curriculumLabel=curriculum.state==='READY'&&curriculum.focusArea&&curriculum.focusNeed?`${needZh[curriculum.focusNeed]??'今天的學習重點'} · ${areaZh[curriculum.focusArea]??'英文產出'}`:profile.goals.primaryGoal;
  const todayExamResolution=runtimeProductContext.productMode==='EXAM'&&curriculum.state==='READY'&&curriculum.lessonPlan?resolveProductionExamContentForTargetV1({learnerId:learnerPreferences.learnerId,role:'GUIDED_PRACTICE',targetRef:curriculum.lessonPlan.targetRef,facet:curriculum.lessonPlan.facet as CapabilityFacet,rotationKey:`today:${new Date().toISOString().slice(0,10)}`}):undefined;
  const todayExamTask=todayExamResolution?.status==='READY'?todayExamResolution.content.task:undefined;
  const todayTask=runtimeProductContext.productMode!=='EXAM'&&curriculum.state==='READY'?productTaskForTargetV1(curriculum.lessonPlan?.targetRef):undefined;
  const examResumeHref=examResume?`/exam-practice?practiceFamily=${encodeURIComponent(examFamilyToPracticeFamilyV1(examResume.runtime.family as Parameters<typeof examFamilyToPracticeFamilyV1>[0]))}`:undefined;
  const startHref=examResumeHref??(runtimeProductContext.productMode!=='EXAM'&&active.hasActiveLesson?'/daily-lesson':coldStart?.kind==='CALIBRATION'?'/quick-calibration':coldStart?.kind==='MOCK_DIAGNOSTIC'?`/exam-practice?practiceFamily=${encodeURIComponent(coldStart.practiceFamily)}`:todayExamTask?`/exam-practice?practiceFamily=${encodeURIComponent(examFamilyToPracticeFamilyV1(todayExamTask.family))}&taskId=${encodeURIComponent(todayExamTask.task_id)}`:todayTask?`/daily-lesson?origin=TODAY&systemTask=${encodeURIComponent(todayTask.id)}`:'/(tabs)/practice');
  const actionLabel=hasResume?'繼續進行中的練習':coldStart?.kind==='CALIBRATION'?'先做 6–8 分鐘快速校準':coldStart?.kind==='MOCK_DIAGNOSTIC'?`先確認${coldStart.label}`:'開始今天的練習';
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
    <View style={s.header}>
      <View style={s.heading}>
        <Text style={s.kicker}>{runtimeProductContext.productMode==='EXAM'?'考試模式':'一般練習'}</Text>
        <Text style={s.title}>{displayName?`${displayName}，今天先做這件事`:'今天先做這件事'}</Text>
      </View>
      <Pressable accessibilityLabel="個人設定" onPress={()=>router.push('/profile')} style={s.avatar}>
        <Text style={s.avatarText}>{(displayName[0]||'E').toUpperCase()}</Text>
      </Pressable>
    </View>
    <Text style={s.body}>{examResume?'你剛才的 Exam 練習和 Teacher 進度都還在。':curriculum.reconsideredAfterNoEffect?'EOT 已依剛才的學習結果重排；現在先處理更值得的一件事。':active.hasActiveLesson?'從離開的位置繼續。':coldStart?.kind==='CALIBRATION'?'EOT 還沒有足夠資料，不會先假設你該練哪一科。':coldStart?.kind==='MOCK_DIAGNOSTIC'?'先依你提供的模考失分選一科做短診斷；不代表已判定原因。':'EOT 已根據你的目標、失分與目前狀態，選出現在最值得學的一件事。'}</Text>
    <View style={[s.todayFocus,hasResume&&s.resumeFocus]}><View style={s.focusTop}><Text style={s.focusLabel}>{hasResume?'繼續進行中':coldStart?'先找準方向':'今天的練習'}</Text><Text style={s.duration}>{coldStart?.kind==='CALIBRATION'?'6–8':curriculum.timeBudgetMinutes} 分鐘</Text></View><Text style={s.focusTitle}>{coldStart?.kind==='CALIBRATION'?'快速校準':coldStart?.kind==='MOCK_DIAGNOSTIC'?`${coldStart.label}短診斷`:curriculumLabel}</Text>{!hasResume&&!coldStart&&(todayTask||todayExamTask)?<UniversalLookupText text={todayTask?.title??String(todayExamTask?.payload.title??'考試練習')}style={s.focusBody}/>:<Text style={s.focusBody}>{hasResume?'從離開的位置繼續，不會重做已完成的步驟。':coldStart?.kind==='CALIBRATION'?'幾道短題，涵蓋詞彙、篇章與閱讀；有時間再做一題中譯英。':coldStart?.kind==='MOCK_DIAGNOSTIC'?'用實際作答確認方向，再決定接下來怎麼練。':'目前沒有符合目標且通過驗證的題目。'}</Text>}</View>
    {retention.state==='READY'&&retention.nextNeed?<View style={s.todayFocus}><Text style={s.focusLabel}>之前學過的內容已適合再確認</Text><Text style={s.focusBody}>這個需要仍由今天的學習排序決定；延後不會消失，也不代表退步。</Text><Pressable accessibilityRole="button"onPress={()=>void deferTodayRetentionNeedV1(learnerPreferences.learnerId,retention.nextNeed!.needId).then(()=>loadTodayRetentionVMV1(learnerPreferences.learnerId).then(setRetention))}style={s.addContent}><Text style={s.addContentTitle}>今天先延後</Text></Pressable></View>:null}
    <ContextualSpotlight active={profile.onboarding.status!=='COMPLETED'&&!profile.onboarding.firstDay?.milestones.TODAY_STARTED} copy="今天先把這個學會。" support={coldStart?.kind==='CALIBRATION'?'先用幾個小動作，EOT 才知道怎麼帶你開始。':undefined}><Pressable accessibilityRole="button" accessibilityHint={hasResume?'從保存的位置繼續':undefined} onPress={()=>void (async()=>{if(launchInFlight.current)return;launchInFlight.current=true;try{if(accessDecision!=='FULL'){router.push('/profile');return}if(!startHref.startsWith('/(tabs)')){await recordTutorialAction('TODAY_STARTED','today-mission-pressed','/(tabs)',startHref);await savePrivateBetaProductEventV1({learnerId:learnerPreferences.learnerId,sessionId:`today:${new Date().toISOString().slice(0,10)}`,taskId:'today',family:runtimeProductContext.productMode,type:'TODAY_STARTED',phase:'STARTED',eventKey:'today-action'})}router.push(startHref as Href)}finally{setTimeout(()=>{launchInFlight.current=false},800)}})()} style={({pressed})=>[s.primary,pressed&&s.pressed]}><Text style={s.primaryText}>{accessDecision==='FULL'?actionLabel:'查看產品設定'}</Text></Pressable></ContextualSpotlight>
    {accessDecision==='FULL'&&!hasResume?<Pressable accessibilityRole="button"onPress={()=>router.push('/(tabs)/practice' as Href)}style={s.quiet}><Text style={s.quietText}>我想自己選練習</Text></Pressable>:null}
  </ScrollView></SafeAreaView>;
}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:t.colors.background},
  loading:{flex:1,alignItems:'center',justifyContent:'center',gap:12},
  content:{width:'100%',maxWidth:t.layout.learnerShellMaxWidth,alignSelf:'center',padding:t.spacing.lg,paddingBottom:90,gap:t.spacing.lg},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},
  heading:{flex:1,paddingRight:14},
  kicker:{color:t.colors.midWood,fontSize:12,fontWeight:'900',letterSpacing:.7},
  title:{color:t.colors.ink,fontSize:30,lineHeight:38,fontWeight:'900',letterSpacing:-.5,marginTop:6},
  body:{color:t.colors.muted,fontSize:16,lineHeight:25},
  todayFocus:{marginTop:t.spacing.sm,padding:20,borderRadius:t.radius.xlarge,backgroundColor:t.colors.paper,gap:9,shadowColor:woodTheme.colors.shadow,shadowOpacity:.06,shadowRadius:14,shadowOffset:{width:0,height:5},elevation:2},resumeFocus:{backgroundColor:t.colors.woodWash},focusTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},focusLabel:{color:t.colors.midWood,fontSize:12,fontWeight:'900'},duration:{fontSize:12,fontWeight:'800',color:t.colors.subtle},focusTitle:{color:t.colors.ink,fontSize:22,lineHeight:30,fontWeight:'900'},focusBody:{color:t.colors.muted,fontSize:14,lineHeight:22},
  avatar:{width:44,height:44,borderRadius:22,backgroundColor:t.colors.paper,borderWidth:1,borderColor:t.colors.line,alignItems:'center',justifyContent:'center'},
  avatarText:{color:t.colors.ink,fontWeight:'900'},
  primary:{minHeight:58,marginTop:2,borderRadius:t.radius.medium,backgroundColor:t.colors.deepWood,alignItems:'center',justifyContent:'center'},pressed:{opacity:.88,transform:[{scale:.99}]},
  primaryText:{color:t.colors.paper,fontSize:16,fontWeight:'900'},addContent:{minHeight:60,justifyContent:'center',paddingVertical:10},addContentTitle:{color:t.colors.focus,fontSize:15,fontWeight:'800'},addContentBody:{color:t.colors.muted,fontSize:12,marginTop:4},quiet:{minHeight:44,alignItems:'center',justifyContent:'center'},quietText:{color:t.colors.deepWood,fontSize:14,fontWeight:'800'},coach:{padding:16,borderRadius:t.radius.medium,backgroundColor:t.colors.woodWash,gap:7},coachTitle:{fontSize:16,fontWeight:'900',color:t.colors.ink},coachDismiss:{fontSize:14,fontWeight:'900',color:t.colors.focus,paddingVertical:5}
});
