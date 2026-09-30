import {Href,router,useFocusEffect} from 'expo-router';
import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {ActivityIndicator,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useCanonicalProductData} from '../../context/AppDataContext';
import {examFamilyToPracticeFamilyV1} from '../../src/content/examBetaBank';
import {resolveProductionExamContentForTargetV1} from '../../src/content/productionContentSupply';
import type {CapabilityFacet} from '../../src/domain/english/EnglishDomain';
import {loadMyEnglishAbilityV1,loadTodayCurriculumVMV1,loadTodayRuntimeVMV1,practiceRouteParamsV1,practiceEntryV1} from '../../src/experience';
import {loadActiveExamOperationalCheckpointV1} from '../../src/persistence/examOperationalPersistence';
import {productExperienceAccessDecisionV2} from '../../src/product';
import {eotLearnerTokensV1 as t} from '../../src/ui';

type Curriculum=Awaited<ReturnType<typeof loadTodayCurriculumVMV1>>;
type Runtime=Awaited<ReturnType<typeof loadTodayRuntimeVMV1>>;
type Ability=Awaited<ReturnType<typeof loadMyEnglishAbilityV1>>;
type ActiveExam=Awaited<ReturnType<typeof loadActiveExamOperationalCheckpointV1>>;
const areaLabel:Record<string,string>={LEXICAL:'詞彙',FORMULAIC:'片語',GRAMMAR:'綜合測驗',MEANING_ENCODING:'中譯英',WRITING:'英文作文',TRANSLATION:'中譯英',READING:'閱讀',DISCOURSE:'篇章結構'};
const examLabel:Record<string,string>={VOCABULARY:'詞彙',COMPREHENSIVE:'綜合測驗',CONTEXTUAL_FILL:'文意選填',DISCOURSE:'篇章結構',READING:'閱讀',MIXED:'混合題',TRANSLATION:'中譯英',WRITING:'英文作文'};

export default function Today(){
 const{learnerPreferences,profile,runtimeProductContext}=useCanonicalProductData(),[curriculum,setCurriculum]=useState<Curriculum>(),[runtime,setRuntime]=useState<Runtime>(),[ability,setAbility]=useState<Ability>(),[exam,setExam]=useState<ActiveExam>(null),launching=useRef(false);
 const load=useCallback(()=>{void Promise.all([loadTodayCurriculumVMV1(learnerPreferences.learnerId,runtimeProductContext),loadTodayRuntimeVMV1(learnerPreferences.learnerId),loadMyEnglishAbilityV1(learnerPreferences.learnerId),loadActiveExamOperationalCheckpointV1(learnerPreferences.learnerId)]).then(([c,r,a,e])=>{setCurriculum(c);setRuntime(r);setAbility(a);setExam(e)})},[learnerPreferences.learnerId,runtimeProductContext]);
 useEffect(load,[load]);useFocusEffect(load);
 const access=productExperienceAccessDecisionV2(profile,profile.access.activeExperience),authoredResume=runtime?.hasActiveLesson&&['WRITING','TRANSLATION'].includes(runtime.mode),examAuthored=exam&&['WRITING','TRANSLATION'].includes(exam.runtime.family)?exam:null;
 const resolution=runtimeProductContext.productMode==='EXAM'&&curriculum?.state==='READY'&&curriculum.lessonPlan?resolveProductionExamContentForTargetV1({learnerId:learnerPreferences.learnerId,role:'GUIDED_PRACTICE',targetRef:curriculum.lessonPlan.targetRef,facet:curriculum.lessonPlan.facet as CapabilityFacet,rotationKey:`today:${new Date().toISOString().slice(0,10)}`}):undefined,task=resolution?.status==='READY'?resolution.content.task:undefined;
 const round=useMemo(()=>{const values=[curriculum?.state==='READY'&&curriculum.focusArea?areaLabel[curriculum.focusArea]:undefined,task?examLabel[task.family]:undefined].filter((x):x is string=>Boolean(x));return [...new Set(values)].slice(0,3)},[curriculum,task]);
 const start=task?`/exam-practice?practiceFamily=${examFamilyToPracticeFamilyV1(task.family)}&taskId=${task.task_id}&origin=TODAY`:'/(tabs)/practice';
 const quick=ability?.state==='READY'?ability.recommendations.slice(0,3):[];
 const quickActions=quick.length?quick:[{id:'quick-reading',label:'閱讀',family:'READING'},{id:'quick-vocabulary',label:'詞彙',family:'VOCABULARY'}];
 const go=(href:string)=>{if(launching.current)return;launching.current=true;if(access!=='FULL')router.push('/profile');else router.push(href as Href);setTimeout(()=>{launching.current=false},600)};
 if(!curriculum||!runtime||!ability)return <SafeAreaView style={s.safe}><View style={s.loading}><ActivityIndicator color={t.colors.deepWood}/></View></SafeAreaView>;
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
  <View style={s.header}><View><Text style={s.title}>今天</Text><Text style={s.date}>{new Intl.DateTimeFormat('zh-TW',{month:'long',day:'numeric',weekday:'short'}).format(new Date())}</Text></View><Pressable onPress={()=>router.push('/profile')}><Text style={s.settings}>設定</Text></Pressable></View>
  <View style={s.round}><View style={s.roundHead}><Text style={s.sectionTitle}>今天這一輪</Text><Text style={s.minutes}>約 {curriculum.timeBudgetMinutes} 分鐘</Text></View><View style={s.roundItems}>{(round.length?round:['英文練習']).map(item=><Text key={item} style={s.roundItem}>{item}</Text>)}</View><Pressable onPress={()=>go(start)} style={s.start}><Text style={s.startText}>開始</Text></Pressable></View>
  <Section title="快速練">{quickActions.map((item,index)=><Row key={item.id} title={item.label} meta={index===0?'3 分鐘':'2 分鐘'} onPress={()=>{const entry=practiceEntryV1(item.family);if(entry?.destination){const query=new URLSearchParams(Object.entries(practiceRouteParamsV1({entry,origin:'MY_ENGLISH'})).filter((x):x is [string,string]=>typeof x[1]==='string')).toString();go(`${entry.destination}?${query}`)}}}/>)}</Section>
  {authoredResume||examAuthored?<Section title="繼續"><Row title={examAuthored?examLabel[examAuthored.runtime.family]:runtime.mode==='WRITING'?'英文作文':'中譯英'} meta={(examAuthored?.runtime.responses.writing??runtime.source??'').slice(0,34)} onPress={()=>go(examAuthored?`/exam-practice?practiceFamily=${examFamilyToPracticeFamilyV1(examAuthored.runtime.family as Parameters<typeof examFamilyToPracticeFamilyV1>[0])}`:'/daily-lesson')}/></Section>:null}
  <Pressable onPress={()=>router.push('/(tabs)/practice')} style={s.choose}><Text style={s.chooseText}>自己選題型</Text><Text style={s.arrow}>›</Text></Pressable>
 </ScrollView></SafeAreaView>
}
function Section({title,children}:{title:string;children:React.ReactNode}){return <View style={s.section}><Text style={s.sectionTitle}>{title}</Text>{children}</View>}
function Row({title,meta,onPress}:{title:string;meta?:string;onPress:()=>void}){return <Pressable onPress={onPress} style={s.row}><View style={s.flex}><Text style={s.rowTitle}>{title}</Text>{meta?<Text numberOfLines={1} style={s.rowMeta}>{meta}</Text>:null}</View><Text style={s.arrow}>›</Text></Pressable>}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:t.colors.canvas},page:{width:'100%',maxWidth:430,alignSelf:'center',paddingHorizontal:20,paddingTop:28,paddingBottom:100},loading:{flex:1,alignItems:'center',justifyContent:'center'},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:36},title:{fontSize:30,lineHeight:37,fontWeight:'600',color:t.colors.ink},date:{fontSize:14,lineHeight:21,color:t.colors.muted,marginTop:3},settings:{fontSize:14,color:t.colors.muted},round:{gap:20,paddingBottom:34,borderBottomWidth:1,borderBottomColor:t.colors.divider},roundHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},sectionTitle:{fontSize:18,lineHeight:25,fontWeight:'600',color:t.colors.ink},minutes:{fontSize:14,color:t.colors.muted},roundItems:{gap:6},roundItem:{fontSize:22,lineHeight:31,fontWeight:'600',color:t.colors.ink},start:{minHeight:50,alignSelf:'flex-start',minWidth:112,borderRadius:13,backgroundColor:t.colors.deepWood,alignItems:'center',justifyContent:'center'},startText:{fontSize:16,fontWeight:'600',color:t.colors.paper},section:{marginTop:34},row:{minHeight:68,flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderBottomColor:t.colors.divider},flex:{flex:1},rowTitle:{fontSize:16,lineHeight:24,fontWeight:'600',color:t.colors.ink},rowMeta:{fontSize:13,lineHeight:20,color:t.colors.muted},arrow:{fontSize:24,color:t.colors.muted},choose:{minHeight:64,marginTop:34,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderTopWidth:1,borderBottomWidth:1,borderColor:t.colors.divider},chooseText:{fontSize:16,fontWeight:'600',color:t.colors.ink}});
