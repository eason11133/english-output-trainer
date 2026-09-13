import {Stack,useLocalSearchParams} from'expo-router';
import React from'react';
import{Pressable,ScrollView,StyleSheet,Text,TextInput,View}from'react-native';
import{SafeAreaView}from'react-native-safe-area-context';
import{LearnerPage,SparseCard}from'../../components/experience/LearnerPage';
import{ContextualLookup}from'../../components/learning/ContextualLookup';
import{OutputWorkspace}from'../../components/learning/OutputWorkspace';
import{lessonHarnessFixtureV1}from'../../src/ui/qa/lessonHarness';

export default function UiuxHarness(){const p=useLocalSearchParams<{state?:string;viewport?:string}>(),f=lessonHarnessFixtureV1(p.state),meta=<View style={s.meta}><Text style={s.dev}>DEV / REVIEW ONLY · PRODUCTION STATE · {f.id}</Text><Text style={s.metaText}>{p.viewport??'390x844'} · {f.experienceState??f.workspaceScenario??'LEARNING_SPACE'}</Text></View>;
if(f.productionEntry==='RESULT')return <Page kicker="RESULT" title="這次真的留下了什麼" meta={meta}><SparseCard title="有一部分是你自己完成的" body="這次有 1 次不靠提示的成功產出，1 次是在協助下完成。你也已經回到原本的作品重新處理。"/><Primary label="回到今天"/></Page>;
if(f.productionEntry==='MY_ENGLISH')return <Page kicker="MY ENGLISH" title="我的英文" meta={meta}><Text style={s.note}>只根據你實際做過的英文整理，不把看過提示或老師示範當成「已經會了」。</Text><SparseCard title="已經能自己做的部分" body="目前有 1 個能力點出現不靠提示的成功產出。"/><SparseCard title="還需要再確認" body="有 1 個能力點目前仍看得到協助依賴。"/></Page>;
if(f.productionEntry==='PROGRESS_HISTORY')return <Page kicker="PROGRESS / HISTORY" title="進展與歷程" meta={meta}><SparseCard title="回到原作完成修改" body="你把剛才學到的做法帶回原本的作品；這是有意義的里程碑，而不是一次點擊紀錄。"/><SparseCard title="第一次獨立產出" body="在沒有提示與答案曝光的情況下完成。"/></Page>;
return <SafeAreaView style={s.safe}><Stack.Screen options={{headerShown:false}}/><ScrollView contentContainerStyle={s.page}>{meta}{f.productionEntry==='TODAY'?<Today/>:f.productionEntry==='CONTEXTUAL_LOOKUP'?<Lookup/>:f.productionEntry==='READING_PRACTICE'||f.productionEntry==='FORMAL_LOCKED_ATTEMPT'?<Reading formal={f.productionEntry==='FORMAL_LOCKED_ATTEMPT'}/>:f.vm?<OutputWorkspace vm={f.vm} value={f.vm.output.text} onChangeText={()=>{}} onPrimary={()=>{}} onPlaceLanguageObject={()=>{}} onStuck={()=>{}} onCorrectIntent={()=>{}}/>:<Text>{f.transport}</Text>}</ScrollView></SafeAreaView>}
function Page({kicker,title,meta,children}:{kicker:string;title:string;meta:React.ReactNode;children:React.ReactNode}){return <><Stack.Screen options={{headerShown:false}}/><LearnerPage kicker={kicker} title={title}>{meta}{children}</LearnerPage></>}
function Today(){return <><Text style={s.kicker}>EOT · GENERAL</Text><Text style={s.title}>從你真正寫的英文開始</Text><Text style={s.body}>這次只處理最值得學的一件事，再回到你的原作。</Text><View style={s.focus}><Text style={s.label}>今天最值得做的</Text><Text style={s.focusTitle}>修回不穩能力 · 英文產出</Text><Text style={s.body}>用一份真實英文開始；需要時才會進入短暫教學。</Text></View><Primary label="開始"/><SparseCard title="加入自己的英文" body="貼上、輸入、照片或 PDF"/></>}
function Lookup(){return <><Text style={s.kicker}>CONTEXTUAL LOOKUP</Text><Text style={s.title}>只查這裡的意思</Text><SparseCard title="原作中的片語" body="查字不會替你完成答案；使用紀錄會保留為語言協助。"><ContextualLookup entries={[{id:'e1',label:'significant change',meaning:'顯著的改變',note:'在這段文字裡表示變化很明顯。'},{id:'e2',label:'allow students to',meaning:'允許學生做某事'}]}/></SparseCard><Primary label="回到原作"/></>}
function Reading({formal}:{formal:boolean}){return <><View style={s.row}><Text style={s.kicker}>{formal?'FORMAL':'PRACTICE'} · 閱讀作答</Text>{formal?<Text style={s.clock}>18 分鐘</Text>:null}</View><View style={s.card}><Text style={s.passage}>The library stayed open because students needed a quiet place to finish their projects.</Text></View><Text style={s.question}>Why did the library stay open?</Text><TextInput multiline value="Students needed a quiet place." editable={false} style={s.input}/><Text style={s.note}>{formal?'正式作答中：Teacher、提示、揭答與查字已鎖定。':'練習模式可在提交前使用一般支援。'}</Text><Primary label="提交整份作答"/></>}
function Primary({label}:{label:string}){return <Pressable style={s.primary}><Text style={s.primaryText}>{label}</Text></Pressable>}
const s=StyleSheet.create({
safe:{flex:1,backgroundColor:'#F7F1E7'},
page:{alignSelf:'stretch',maxWidth:390,padding:20,paddingBottom:70,gap:16},
meta:{paddingBottom:8,borderBottomWidth:1,borderBottomColor:'#D9CBB8'},dev:{fontSize:10,fontWeight:'900',color:'#806D59'},metaText:{fontSize:10,color:'#806D59'},
kicker:{fontSize:12,fontWeight:'900',color:'#654D3B'},title:{fontSize:29,lineHeight:39,fontWeight:'900',color:'#2F261F'},body:{fontSize:15,lineHeight:24,color:'#6F6256'},note:{fontSize:13,lineHeight:20,color:'#6F6256'},
focus:{paddingVertical:20,borderTopWidth:1,borderBottomWidth:1,borderColor:'#D9CBB8',gap:8},label:{fontSize:12,fontWeight:'900',color:'#654D3B'},focusTitle:{fontSize:21,lineHeight:30,fontWeight:'900',color:'#2F261F'},
primary:{minHeight:54,borderRadius:14,backgroundColor:'#654D3B',alignItems:'center',justifyContent:'center'},primaryText:{color:'#fff',fontWeight:'900'},row:{flexDirection:'row',justifyContent:'space-between'},clock:{fontSize:12,fontWeight:'900',color:'#A75E2D'},
card:{padding:16,borderRadius:14,backgroundColor:'#FFFCF7',borderWidth:1,borderColor:'#D9CBB8'},passage:{fontSize:16,lineHeight:26,color:'#2F261F'},question:{fontSize:18,lineHeight:27,fontWeight:'800',color:'#2F261F'},input:{minHeight:80,borderWidth:1,borderColor:'#D9CBB8',borderRadius:14,padding:14,fontSize:16,backgroundColor:'#FFFCF7'}
});
