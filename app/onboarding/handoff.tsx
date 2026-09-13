import {Href,router} from 'expo-router';
import React,{useEffect,useRef,useState} from 'react';
import {ActivityIndicator,Pressable,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useCanonicalProductData} from '../../context/AppDataContext';
import {examBetaTaskForLearner,examFamilyToPracticeFamilyV1,practiceFamilyToExamFamily,type ExamBetaFamily} from '../../src/content/examBetaBank';
import {resolveProductionExamContentForTargetV1} from '../../src/content/productionContentSupply';
import {loadTodayCurriculumVMV1} from '../../src/experience';
import {gsatColdStartDecisionV1} from '../../src/product-policy/exam';
import {eotLearnerTokensV1 as t} from '../../src/ui';
import type {CapabilityFacet} from '../../src/domain/english/EnglishDomain';

type Mission=NonNullable<ReturnType<typeof useCanonicalProductData>['profile']['onboarding']['firstMission']>;
const familyLabel:Record<ExamBetaFamily,string>={VOCABULARY:'詞彙 × 語境辨識',COMPREHENSIVE:'綜合測驗 × 句意連接',CONTEXTUAL_FILL:'文意選填 × 上下文',DISCOURSE:'篇章結構 × 連貫',READING:'閱讀 × 證據定位',MIXED:'混合題 × 資訊整合',TRANSLATION:'中譯英 × 意義表達',WRITING:'英文作文 × 清楚展開'};
const reasonFor=(family:ExamBetaFamily,source:'MOCK'|'QUICK_DIAG'|undefined)=>source==='MOCK'?`先從你剛提供的資訊確認${familyLabel[family].split(' × ')[0]}最值得處理的一步。`:source==='QUICK_DIAG'?`短題顯示這裡最值得先確認；做完再依你的真實作答調整。`:'先從目前最值得確認的一小步開始。';

export default function FirstMissionHandoff(){
  const{profile,learnerPreferences,runtimeProductContext,updateProductContext}=useCanonicalProductData();
  const[mission,setMission]=useState<Mission|undefined>(profile.onboarding.firstMission);const launching=useRef(false),selecting=useRef(false);
  useEffect(()=>{if(mission||selecting.current)return;selecting.current=true;let live=true;void(async()=>{
    let family:ExamBetaFamily|undefined;
    if(profile.onboarding.initialSignalSource==='QUICK_DIAG')family=practiceFamilyToExamFamily(profile.onboarding.quickDiagnosticPracticeFamily??'');
    if(!family){const cold=gsatColdStartDecisionV1(profile,false);if(cold.kind==='MOCK_DIAGNOSTIC')family=practiceFamilyToExamFamily(cold.practiceFamily)}
    let task=family?examBetaTaskForLearner(family,learnerPreferences.learnerId,'suggested','first-mission'):undefined;
    if(!task){const today=await loadTodayCurriculumVMV1(learnerPreferences.learnerId,runtimeProductContext),resolved=today.lessonPlan?resolveProductionExamContentForTargetV1({learnerId:learnerPreferences.learnerId,role:'GUIDED_PRACTICE',targetRef:today.lessonPlan.targetRef,facet:today.lessonPlan.facet as CapabilityFacet,rotationKey:'first-mission'}):undefined;if(resolved?.status==='READY'){task=resolved.content.task;family=task.family}}
    if(!task){family='VOCABULARY';task=examBetaTaskForLearner(family,learnerPreferences.learnerId,'suggested','first-mission')}
    if(!task||!family){selecting.current=false;return}
    const durationMinutes=profile.study.dailyStudyMinutes<=10?8:profile.study.dailyStudyMinutes<=20?12:18;
    const next:Mission={family:familyLabel[family],taskLabel:String(task.payload.title??familyLabel[family]),reason:reasonFor(family,profile.onboarding.initialSignalSource),durationMinutes,route:`/exam-practice?practiceFamily=${encodeURIComponent(examFamilyToPracticeFamilyV1(family))}&taskId=${encodeURIComponent(task.task_id)}&origin=TODAY`,selectedAt:new Date().toISOString()};
    if(live)setMission(next);await updateProductContext({onboarding:{firstMission:next,setupStage:'HANDOFF'}});
  })();return()=>{live=false}},[learnerPreferences.learnerId,mission,profile,runtimeProductContext,updateProductContext]);
  async function start(){if(!mission||launching.current)return;launching.current=true;const startedAt=new Date().toISOString(),current=profile.onboarding.firstDay??{version:1 as const,milestones:{}};await updateProductContext({onboarding:{firstMission:{...mission,startedAt},activationHandoffCompleted:true,setupStage:'MISSION_STARTED',firstDay:{...current,learningRoute:mission.route,milestones:{...current.milestones,OPENING_COMPLETED:current.milestones.OPENING_COMPLETED??{actionId:'first-run-value-screen-completed',route:'/onboarding/goals',occurredAt:startedAt},INITIAL_CONTEXT_COMPLETED:current.milestones.INITIAL_CONTEXT_COMPLETED??{actionId:'first-run-context-completed',route:'/onboarding/time',occurredAt:startedAt},TODAY_STARTED:current.milestones.TODAY_STARTED??{actionId:'first-mission-started',route:'/onboarding/handoff',occurredAt:startedAt}}}}});router.replace(mission.route as Href)}
  return <SafeAreaView style={s.safe}><View style={s.page}><Text style={s.eyebrow}>EOT 幫你選</Text><Text style={s.heading}>我先從這裡幫你搶分。</Text>{mission?<><View style={s.mission}><Text style={s.family}>{mission.family}</Text><Text style={s.task}>{mission.taskLabel}</Text><Text style={s.reason}>{mission.reason}</Text><Text style={s.duration}>約 {mission.durationMinutes} 分鐘</Text></View><Pressable accessibilityRole="button" onPress={()=>void start()} style={({pressed})=>[s.primary,pressed&&s.pressed]}><Text style={s.primaryText}>開始第一回</Text></Pressable></>:<ActivityIndicator color={t.colors.deepWood}/>}</View></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:t.colors.background},page:{flex:1,width:'100%',maxWidth:t.layout.learnerShellMaxWidth,alignSelf:'center',padding:24,justifyContent:'center',gap:16},eyebrow:{fontSize:13,fontWeight:'900',color:t.colors.midWood},heading:{fontSize:31,lineHeight:40,fontWeight:'900',color:t.colors.ink},mission:{paddingVertical:20,borderTopWidth:1,borderBottomWidth:1,borderColor:t.colors.line,gap:7},family:{fontSize:18,fontWeight:'900',color:t.colors.deepWood},task:{fontSize:16,fontWeight:'800',color:t.colors.ink},reason:{fontSize:14,lineHeight:22,color:t.colors.muted},duration:{fontSize:13,fontWeight:'800',color:t.colors.subtle},primary:{minHeight:58,borderRadius:t.radius.medium,backgroundColor:t.colors.deepWood,alignItems:'center',justifyContent:'center'},primaryText:{fontSize:16,fontWeight:'900',color:t.colors.paper},pressed:{opacity:.78}});
