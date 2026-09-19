import { Href, router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCanonicalProductData } from '../../context/AppDataContext';
import { loadMyEnglishAbilityV1, loadTodayCurriculumVMV1, loadTodayRuntimeVMV1 } from '../../src/experience';
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
type ActiveExam=Awaited<ReturnType<typeof loadActiveExamOperationalCheckpointV1>>;

const areaZh:Record<string,string>={LEXICAL:'詞彙產出',FORMULAIC:'語塊表達',GRAMMAR:'句型控制',MEANING_ENCODING:'意思轉英文',WRITING:'寫作產出',TRANSLATION:'翻譯產出',READING:'閱讀理解',DISCOURSE:'篇章組織'};
const needZh:Record<string,string>={NEW_LEARNING:'建立新能力',REPAIR:'修回不穩能力',REACTIVATION:'把之前會的拉回來',INDEPENDENCE:'從提示帶到獨立',TRANSFER:'換情境確認',RETENTION:'延後確認',MAINTENANCE:'自然維持'};
const examFamilyZh:Record<string,string>={VOCABULARY:'詞彙辨義',CLOZE:'文意選填',READING:'閱讀理解',TRANSLATION:'中譯英',WRITING:'英文作文',MIXED:'綜合測驗'};

export default function Today(){
  const {learnerPreferences,profile,runtimeProductContext,recordTutorialAction}=useCanonicalProductData();
  const [active,setActive]=useState<TodayRuntime>({hasActiveLesson:false});
  const [curriculum,setCurriculum]=useState<TodayCurriculum>({state:'EMPTY',timeBudgetMinutes:runtimeProductContext.studyMinutes,reasonCodes:[]});
  const [activeExam,setActiveExam]=useState<ActiveExam>(null);
  const [hasEvidence,setHasEvidence]=useState<boolean|null>(null);
  const launchInFlight=useRef(false);
  const accessDecision=productExperienceAccessDecisionV2(profile,profile.access.activeExperience);
  const displayName=learnerPreferences.displayName==='Learner'?'':learnerPreferences.displayName;
  useEffect(()=>{void loadTodayRuntimeVMV1(learnerPreferences.learnerId).then(setActive)},[learnerPreferences.learnerId]);
  useEffect(()=>{void loadTodayCurriculumVMV1(learnerPreferences.learnerId,runtimeProductContext).then(setCurriculum)},[learnerPreferences.learnerId,runtimeProductContext]);
  useEffect(()=>{void loadActiveExamOperationalCheckpointV1(learnerPreferences.learnerId).then(setActiveExam)},[learnerPreferences.learnerId]);
  useEffect(()=>{void loadMyEnglishAbilityV1(learnerPreferences.learnerId).then(value=>setHasEvidence(value.state!=='EMPTY'))},[learnerPreferences.learnerId]);
  useFocusEffect(useCallback(()=>{void loadTodayRuntimeVMV1(learnerPreferences.learnerId).then(setActive);void loadTodayCurriculumVMV1(learnerPreferences.learnerId,runtimeProductContext).then(setCurriculum);void loadActiveExamOperationalCheckpointV1(learnerPreferences.learnerId).then(setActiveExam)},[learnerPreferences.learnerId,runtimeProductContext]));
  if(hasEvidence===null)return <SafeAreaView style={s.safe}><View style={s.loading}><ActivityIndicator color={t.colors.deepWood}/><Text style={s.focusBody}>正在準備今天的下一步…</Text></View></SafeAreaView>;
  const examResume=runtimeProductContext.productMode==='EXAM'&&!curriculum.reconsideredAfterNoEffect?activeExam:null;
  const hasResume=runtimeProductContext.productMode==='EXAM'?Boolean(examResume):active.hasActiveLesson;
  const coldStart=hasEvidence===false?gsatColdStartDecisionV1(profile,false):undefined;
  const curriculumLabel=curriculum.state==='READY'&&curriculum.focusArea&&curriculum.focusNeed?`${needZh[curriculum.focusNeed]??'今天的學習重點'} · ${areaZh[curriculum.focusArea]??'英文產出'}`:profile.goals.primaryGoal;
  const missionLabel=examResume?`${examFamilyZh[examResume.runtime.family]??'英文練習'} · 接回剛才那一步`:curriculumLabel;
  const todayExamResolution=runtimeProductContext.productMode==='EXAM'&&curriculum.state==='READY'&&curriculum.lessonPlan?resolveProductionExamContentForTargetV1({learnerId:learnerPreferences.learnerId,role:'GUIDED_PRACTICE',targetRef:curriculum.lessonPlan.targetRef,facet:curriculum.lessonPlan.facet as CapabilityFacet,rotationKey:`today:${new Date().toISOString().slice(0,10)}`}):undefined;
  const todayExamTask=todayExamResolution?.status==='READY'?todayExamResolution.content.task:undefined;
  const todayTask=runtimeProductContext.productMode!=='EXAM'&&curriculum.state==='READY'?productTaskForTargetV1(curriculum.lessonPlan?.targetRef):undefined;
  const examResumeHref=examResume?`/exam-practice?practiceFamily=${encodeURIComponent(examFamilyToPracticeFamilyV1(examResume.runtime.family as Parameters<typeof examFamilyToPracticeFamilyV1>[0]))}`:undefined;
  const startHref=examResumeHref??(runtimeProductContext.productMode!=='EXAM'&&active.hasActiveLesson?'/daily-lesson':coldStart?.kind==='CALIBRATION'?'/quick-calibration':coldStart?.kind==='MOCK_DIAGNOSTIC'?`/exam-practice?practiceFamily=${encodeURIComponent(coldStart.practiceFamily)}`:todayExamTask?`/exam-practice?practiceFamily=${encodeURIComponent(examFamilyToPracticeFamilyV1(todayExamTask.family))}&taskId=${encodeURIComponent(todayExamTask.task_id)}`:todayTask?`/daily-lesson?origin=TODAY&systemTask=${encodeURIComponent(todayTask.id)}`:'/(tabs)/practice');
  const actionLabel=hasResume?'繼續進行中的練習':coldStart?.kind==='CALIBRATION'?'先做 6–8 分鐘快速校準':coldStart?.kind==='MOCK_DIAGNOSTIC'?`先確認${coldStart.label}`:'開始今天的練習';
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
    <View style={s.header}><View style={s.heading}>
        <Text style={s.kicker}>TODAY</Text>
        <Text style={s.title}>{displayName?`${displayName}，今天練這個`:'今天練這個'}</Text>
      </View>
      <Pressable accessibilityLabel="個人設定" onPress={()=>router.push('/profile')} style={s.avatar}>
        <Text style={s.avatarText}>{(displayName[0]||'E').toUpperCase()}</Text>
      </Pressable>
    </View>
    <View style={s.mission}><View style={s.focusTop}><Text style={s.focusLabel}>{hasResume?'進行中':'今日任務'}</Text><Text style={s.duration}>{coldStart?.kind==='CALIBRATION'?'6–8':curriculum.timeBudgetMinutes} 分鐘</Text></View><Text style={s.focusTitle}>{coldStart?.kind==='CALIBRATION'?'快速校準':coldStart?.kind==='MOCK_DIAGNOSTIC'?`${coldStart.label}短診斷`:missionLabel}</Text>{!hasResume&&!coldStart&&(todayTask||todayExamTask)?<UniversalLookupText text={todayTask?.title??String(todayExamTask?.payload.title??'考試練習')} style={s.focusBody}/>:null}</View>
    <ContextualSpotlight active={profile.onboarding.status!=='COMPLETED'&&!profile.onboarding.firstDay?.milestones.TODAY_STARTED} copy="今天先把這個學會。" support={coldStart?.kind==='CALIBRATION'?'先用幾個小動作，EOT 才知道怎麼帶你開始。':undefined}><Pressable accessibilityRole="button" accessibilityHint={hasResume?'從保存的位置繼續':undefined} onPress={()=>void (async()=>{if(launchInFlight.current)return;launchInFlight.current=true;try{if(accessDecision!=='FULL'){router.push('/profile');return}if(!startHref.startsWith('/(tabs)')){await recordTutorialAction('TODAY_STARTED','today-mission-pressed','/(tabs)',startHref);await savePrivateBetaProductEventV1({learnerId:learnerPreferences.learnerId,sessionId:`today:${new Date().toISOString().slice(0,10)}`,taskId:'today',family:runtimeProductContext.productMode,type:'TODAY_STARTED',phase:'STARTED',eventKey:'today-action'})}router.push(startHref as Href)}finally{setTimeout(()=>{launchInFlight.current=false},800)}})()} style={({pressed})=>[s.primary,pressed&&s.pressed]}><Text style={s.primaryText}>{accessDecision==='FULL'?actionLabel:'查看產品設定'}</Text></Pressable></ContextualSpotlight>
  </ScrollView></SafeAreaView>;
}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:t.colors.background},
  loading:{flex:1,alignItems:'center',justifyContent:'center',gap:12},
  content:{width:'100%',maxWidth:t.layout.learnerShellMaxWidth,alignSelf:'center',paddingHorizontal:24,paddingTop:28,paddingBottom:90,gap:28},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},
  heading:{flex:1,paddingRight:14},
  kicker:{color:t.colors.midWood,fontSize:11,fontWeight:'900',letterSpacing:1.8},
  title:{color:t.colors.ink,fontSize:32,lineHeight:40,fontWeight:'900',letterSpacing:-.7,marginTop:8},
  body:{color:t.colors.muted,fontSize:16,lineHeight:25},
  mission:{marginTop:18,paddingVertical:24,borderTopWidth:1,borderBottomWidth:1,borderColor:t.colors.line,gap:12},focusTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},focusLabel:{color:t.colors.midWood,fontSize:12,fontWeight:'900'},duration:{fontSize:13,fontWeight:'800',color:t.colors.subtle},focusTitle:{color:t.colors.ink,fontSize:25,lineHeight:33,fontWeight:'900'},focusBody:{color:t.colors.muted,fontSize:14,lineHeight:22},
  avatar:{width:44,height:44,borderRadius:22,backgroundColor:t.colors.paper,borderWidth:1,borderColor:t.colors.line,alignItems:'center',justifyContent:'center'},
  avatarText:{color:t.colors.ink,fontWeight:'900'},
  primary:{minHeight:60,borderRadius:18,backgroundColor:t.colors.deepWood,alignItems:'center',justifyContent:'center'},pressed:{opacity:.88,transform:[{scale:.99}]},
  primaryText:{color:t.colors.paper,fontSize:17,fontWeight:'900'}
});
