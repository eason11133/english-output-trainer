import { eotLearnerTokensV1 as woodTheme } from '../../src/ui/tokens';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import { coreReverseLookupLexiconV1, lookupDirectionForTextV1, normalizeTappedLemmaV1, resolveReverseContextV1, resolveTapPhraseFirstContextV1, type ContextualLookupResultV1, type LookupAssessmentModeV1 } from '../../src/lookup';
import { nativeCorpusServiceV1 } from '../../src/persistence/nativeCorpus';
import { eotLearnerTokensV1 as t } from '../../src/ui';
import {ContextualSpotlight} from '../experience/ContextualSpotlight';
import { useCanonicalProductData } from '../../context/AppDataContext';
import { canonicalLexicalEncounterStoreV1 } from '../../src/persistence';
import { contentExposureEventV1, createLexicalEncounterEventV1, shouldShowLexicalReencounterCueV1 } from '../../src/learner-truth/lexicalEncounter';
export const FORMAL_LOOKUP_LOCK_COPY_V1='模考中先不提供查字。交卷後可以查。';

type Segment={text:string;index:number;interactive:boolean};
function segmentLanguage(text:string):Segment[]{const spans:Array<{text:string;index:number}>=[];for(const match of text.matchAll(/[A-Za-z]+(?:['’-][A-Za-z]+)?/g))spans.push({text:match[0],index:match.index!});for(const record of [...coreReverseLookupLexiconV1].sort((a,b)=>b.zh.length-a.zh.length)){let index=text.indexOf(record.zh);while(index>=0){spans.push({text:record.zh,index});index=text.indexOf(record.zh,index+record.zh.length)}}spans.sort((a,b)=>a.index-b.index||b.text.length-a.text.length);const result:Segment[]=[],accepted:Array<{start:number;end:number}>=[];let cursor=0;for(const span of spans){if(accepted.some(x=>span.index<x.end&&x.start<span.index+span.text.length))continue;if(span.index>cursor)result.push({text:text.slice(cursor,span.index),index:cursor,interactive:false});result.push({...span,interactive:true});accepted.push({start:span.index,end:span.index+span.text.length});cursor=Math.max(cursor,span.index+span.text.length)}if(cursor<text.length)result.push({text:text.slice(cursor),index:cursor,interactive:false});return result.length?result:[{text,index:0,interactive:false}]}
type Props={text:string;paragraph?:string;assessmentMode?:LookupAssessmentModeV1;activeTargetTokens?:readonly string[];submitted?:boolean;style?:StyleProp<TextStyle>;onLookupUsed?:(result:ContextualLookupResultV1)=>void;onLookupResult?:(result:ContextualLookupResultV1)=>void;showHint?:boolean;sourceFamily?:string;taskId?:string;sessionId?:string;responsePhase?:'PRE_RESPONSE'|'POST_RESPONSE';exposureIdentity?:string;instruction?:boolean};
export function UniversalLookupText({text,paragraph,assessmentMode='NONE',activeTargetTokens=[],submitted=false,style,onLookupUsed,onLookupResult,showHint=false,sourceFamily='UNKNOWN',taskId,sessionId,responsePhase='PRE_RESPONSE',exposureIdentity,instruction=false}:Props){
  const {profile,learnerPreferences,recordTutorialAction}=useCanonicalProductData();
  const[result,setResult]=useState<ContextualLookupResultV1>();
  const[pending,setPending]=useState(false);
  const[fallbackMessage,setFallbackMessage]=useState('');
  const[reencounter,setReencounter]=useState(false);
  const action=useRef(0);
  const lookupInFlight=useRef(false);
  const parts=useMemo(()=>segmentLanguage(text),[text]);
  useEffect(()=>{if(!exposureIdentity||instruction||!text.trim())return;void canonicalLexicalEncounterStoreV1.append(contentExposureEventV1({learnerId:learnerPreferences.learnerId,sessionId:sessionId??'view',contentIdentity:exposureIdentity,span:text,sourceFamily,taskId,occurredAt:new Date().toISOString()}))},[exposureIdentity,instruction,learnerPreferences.learnerId,sessionId,sourceFamily,taskId,text]);
  const encounterFor=(next:ContextualLookupResultV1,token:string,eventId:string)=>createLexicalEncounterEventV1({eventId,learnerId:learnerPreferences.learnerId,sessionId,occurredAt:new Date().toISOString(),captureMethod:'EOT_IN_APP_LOOKUP',sourceType:'EOT_CONTENT',sourceAnchor:taskId,selectedSpan:next.resolvedSpan?.text??token,normalizedTargetCandidate:next.lemma??token,phraseOrChunkCandidate:next.localUnit?.text,canonicalTargetRef:next.status==='RESOLVED'?'lexical.contextual-fit':undefined,canonicalFacet:next.localUnit?'COLLOCATION':'SENSE_DISCRIMINATION',resolutionStatus:next.status==='RESOLVED'?'RESOLVED':next.status==='AMBIGUOUS'?'AMBIGUOUS':'UNRESOLVED',candidateSenseRefs:next.senseId?[next.senseId]:[],resolvedContextualSense:next.senseId,lookupRequested:true,lookupResultExposed:next.status==='RESOLVED',userMarkedRemember:false,lookupDirection:lookupDirectionForTextV1(token),localContext:(paragraph??text).slice(0,240),sourceFamily,taskId,responsePhase:submitted?'POST_RESPONSE':responsePhase,targetProtected:next.status==='LOCKED',provenanceRefs:next.provenanceRefs??[],privacyScope:'EOT_REFERENCE_ONLY'});
  async function recordEncounter(next:ContextualLookupResultV1,token:string){const id=`lexical:${learnerPreferences.learnerId}:lookup:${Date.now()}:${++action.current}`;try{await canonicalLexicalEncounterStoreV1.append(encounterFor(next,token,id));const all=await canonicalLexicalEncounterStoreV1.listForLearner(learnerPreferences.learnerId);setReencounter(shouldShowLexicalReencounterCueV1(all,next.lemma??token));return true}catch{setFallbackMessage('查詢結果可以繼續看，但這次記錄沒有儲存成功。');return false}}
  const publish=async(next:ContextualLookupResultV1,token:string)=>{setResult(next);onLookupResult?.(next);if(next.status!=='LOCKED')await recordEncounter(next,token);if(next.status==='RESOLVED'){onLookupUsed?.(next);if(profile.onboarding.status!=='COMPLETED'&&profile.onboarding.firstDay?.milestones.TODAY_STARTED&&!profile.onboarding.firstDay.milestones.FIRST_LOOKUP_USED)void recordTutorialAction('FIRST_LOOKUP_USED',`resolved-lookup:${next.senseId??next.lemma}`,profile.onboarding.firstDay.learningRoute??'/(tabs)').catch(()=>setFallbackMessage('查詢已開啟，但進度暫時無法儲存；下次可再點一下。'))}};
  async function lookup(token:string){
    if(lookupInFlight.current)return;lookupInFlight.current=true;
    try{const reverse=lookupDirectionForTextV1(token)==='ZH_TO_EN',next=reverse?resolveReverseContextV1({selected:token,context:text,activeTargetRefs:activeTargetTokens,submitted}):resolveTapPhraseFirstContextV1({tappedToken:token,sentence:text,paragraph,assessmentMode,activeTargetTokens,submitted});
    if(next.status!=='ABSTAIN'){await publish(next,token);return}
    setResult(next);setPending(true);setFallbackMessage('正在查本機辭典…');
    try{
      if(reverse){setFallbackMessage('本機辭典目前找不到這段中文的安全英文表達；你仍可繼續作答。');onLookupResult?.(next);await recordEncounter(next,token);return}const corpus=await nativeCorpusServiceV1.get();
      if(corpus.status==='READY'){
        const found=await corpus.port.lookupLemma(normalizeTappedLemmaV1(token),'LEARNER_PRODUCTION'),sense=found.senses[0];
        if(sense){await publish({status:'RESOLVED',tappedToken:token,lemma:found.lemma,senseId:sense.senseId,partOfSpeech:sense.pos,meaningZhTw:sense.glosses[0]??'English definition available',usageNote:'本機辭典英文釋義',confidence:'MEDIUM',provenanceRefs:[sense.provenance.sourceRecordId],supportEffect:'LOOKUP_ASSISTED'},token);return}
      }
      setFallbackMessage('本機辭典目前找不到這個詞；你仍可繼續作答。');onLookupResult?.(next);await recordEncounter(next,token);
    }catch{setFallbackMessage('本機辭典暫時無法開啟；你仍可繼續作答。');onLookupResult?.(next)}finally{setPending(false)}}finally{lookupInFlight.current=false}
  }
  const close=()=>{setResult(undefined);setFallbackMessage('');setPending(false);setReencounter(false)};
  return <ContextualSpotlight active={showHint} copy="點英文可以查意思"><View>
    <Text style={style}>{parts.map((part,i)=>part.interactive&&!instruction?<Text accessibilityRole="button" accessibilityLabel={`查詢 ${part.text}`} key={`${part.index}-${i}`} onPress={event=>{event.stopPropagation();void lookup(part.text)}}>{part.text}</Text>:<Text key={`${part.index}-${i}`}>{part.text}</Text>)}</Text>
    <Modal transparent visible={Boolean(result)} animationType="slide" onRequestClose={close}><Pressable style={s.backdrop} onPress={close}/><View style={s.sheet}><View style={s.handle}/>
      {pending?<View style={s.lock}><Ionicons name="book" size={22} color={t.colors.midWood}/><Text style={s.note}>{fallbackMessage}</Text></View>:result?.status==='RESOLVED'?<><Text style={s.word}>{result.localUnit?.text??result.tappedToken}</Text><Text style={s.meaning}>{result.localUnit?.meaningZhTw??result.meaningZhTw}</Text>{result.localUnit?<Text style={s.fallback}>這裡的核心字義：{result.meaningZhTw}</Text>:null}{result.usageNote?<Text style={s.note}>{result.usageNote}</Text>:null}</>:<View style={s.lock}><Ionicons name={result?.status==='LOCKED'?'lock-closed':'information-circle'} size={22} color={t.colors.midWood}/><Text style={s.note}>{result?.status==='LOCKED'?(result.lockReason==='FORMAL_ASSESSMENT'?FORMAL_LOOKUP_LOCK_COPY_V1:'這個目標送出前先不顯示，避免直接透露答案。'):(fallbackMessage||(result?.status==='AMBIGUOUS'?'目前語境不足，還不能安全判定這個字在這裡的意思。':'本機辭典目前沒有這個詞。'))}</Text></View>}
      {reencounter?<Text style={s.cue}>這個英文之前也出現過，可以先留意它。</Text>:null}
      <Pressable accessibilityRole="button" onPress={close} style={s.close}><Text style={s.closeText}>知道了</Text></Pressable>
    </View></Modal>
  </View></ContextualSpotlight>;
}
const s=StyleSheet.create({backdrop:{...StyleSheet.absoluteFill,backgroundColor:woodTheme.colors.overlay},sheet:{position:'absolute',left:0,right:0,bottom:0,paddingHorizontal:22,paddingTop:10,paddingBottom:30,borderTopLeftRadius:24,borderTopRightRadius:24,backgroundColor:t.colors.paper,gap:11},handle:{width:42,height:4,borderRadius:2,backgroundColor:t.colors.line,alignSelf:'center',marginBottom:4},word:{fontSize:23,fontWeight:'900',color:t.colors.ink},meaning:{fontSize:20,lineHeight:28,fontWeight:'800',color:t.colors.deepWood},fallback:{fontSize:13,color:t.colors.muted},note:{fontSize:14,lineHeight:22,color:t.colors.muted},lock:{flexDirection:'row',gap:10,alignItems:'flex-start'},cue:{fontSize:13,lineHeight:20,color:t.colors.midWood},close:{minHeight:50,borderRadius:t.radius.medium,backgroundColor:t.colors.deepWood,alignItems:'center',justifyContent:'center'},closeText:{fontSize:15,fontWeight:'900',color:t.colors.paper}});
