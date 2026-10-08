import { QualifiedBlockSelectionV4, adaptQualifiedBlockDecisionV4 } from '../application/stage4/blockDecisionAdapterV4';
import { recordBlockEventStage4V4, selectBlockV4 } from '../application/stage4/learnerRuntimeV4';
import { evaluateAllowConstructionV4 } from '../teaching/mechanisms/allowObjectInfinitive';
import { OutputWorkspaceVM, allowWorkspaceVM } from '../experience/outputWorkspaceVM';
import { Stage4RuntimeV4 } from '../domain/stage4/LearnerRuntimeV4';
import { BlockLearnerEventTypeV4, BlockSupportV4 } from '../domain/v4/LearningBlockV4';
import type { AssistanceStrengthV1, ElicitationConditionV1, ProductionConditionsV1 } from '../domain/task/TaskContract';
import { blockRegistryV4 } from '../application/v4/blockRegistryV4';
import { compileTeachingPuzzlePayloadV1, teachingPuzzlePieceByIdV1, type TeachingPuzzlePieceIdV1 } from '../teaching';

export type AdaptiveLearnerActionKindV4='INITIAL'|'OUTPUT_SUBMITTED'|'LANGUAGE_OBJECT_PLACED'|'HELP_REQUESTED'|'CONTINUE_REQUESTED'|'INTENT_CORRECTED'|'RESUMED';
export interface AdaptiveLearnerObservationV4{
  kind:AdaptiveLearnerActionKindV4;
  response?:string;
  success?:boolean;
  payload?:Record<string,string|number|boolean>;
}
export interface AdaptiveDecisionContextV4{
  runtimeId:string;
  authenticWork:string;
  currentDecision?:{intent:string;blockId:string;support:string};
  latestObservation:AdaptiveLearnerObservationV4;
  supportHistory:{type:string;support:string}[];
  evidenceSummary:{eligible:number;ineligible:number;independent:number;assisted:number};
  registeredBlocks:{id:string;role:string;facet:string}[];
}
export type QualifiedDecisionProviderV4=(context:AdaptiveDecisionContextV4)=>Promise<QualifiedBlockSelectionV4>|QualifiedBlockSelectionV4;
export interface AdaptiveDecisionPointResultV4{runtime:Stage4RuntimeV4;context:AdaptiveDecisionContextV4;qualifiedDecision:QualifiedBlockSelectionV4}


const supportAssistance=(support:BlockSupportV4):AssistanceStrengthV1=>support==='NONE'?'NONE':support==='LIGHT'||support==='CUED'?'LIGHT':'STRONG';
const conditionContext=(value:Stage4RuntimeV4['decision'] extends infer _T ? string : string):ProductionConditionsV1['context']=>value==='SOURCE'?'SOURCE':value==='CHANGED_CONTEXT'?'CHANGED_CONTEXT':value==='DELAYED_CONTEXT'?'DELAYED_CONTEXT':value==='SAME_CONTEXT'?'SAME_CONTEXT':value==='NOT_APPLICABLE'?'NOT_APPLICABLE':'UNKNOWN';
const elicitationFromDecision=(runtime:Stage4RuntimeV4):ElicitationConditionV1=>{
  const configured=runtime.decision?.configuration.fNextElicitation??runtime.decision?.configuration.fElicitationCondition;
  if(['TARGET_NAMED','FUNCTION_CUED','OPEN_CHOICE','AUTHENTIC_TASK','UNKNOWN'].includes(String(configured)))return String(configured) as ElicitationConditionV1;
  if(runtime.decision?.pedagogicalIntent==='TRANSFER'&&runtime.decision.contextProvenance==='SOURCE')return'AUTHENTIC_TASK';
  if(runtime.decision?.pedagogicalIntent==='ASSESS'||runtime.decision?.pedagogicalIntent==='TRANSFER')return'OPEN_CHOICE';
  return runtime.decision?.pedagogicalIntent==='TEACH'?'FUNCTION_CUED':'OPEN_CHOICE';
};
const decayedPriorPrime=(runtime:Stage4RuntimeV4):AssistanceStrengthV1=>{
  const prior=[...runtime.blockEvents].reverse().find(event=>event.productionConditions)?.productionConditions?.assistance.recentModelPrime;
  return prior==='STRONG'?'LIGHT':'NONE';
};
function conditionsForWorkspaceV4(runtime:Stage4RuntimeV4,input:Partial<ProductionConditionsV1> & {assistance?:Partial<ProductionConditionsV1['assistance']>;elicitation?:ElicitationConditionV1;currentModelPrime?:AssistanceStrengthV1}={}):ProductionConditionsV1{
  const support=(runtime.blockState?.supportLevel??runtime.decision?.supportLevel??'NONE') as BlockSupportV4;
  const block=runtime.decision?blockRegistryV4.get(runtime.decision.selectedBlockId):undefined;
  const currentPrime=input.currentModelPrime??(block?.exposesTargetAnswer?'STRONG':decayedPriorPrime(runtime));
  const lookupUsed=runtime.blockState?.visibleBeforeResponse.some(value=>value.startsWith('LOOKUP:'))===true,base=supportAssistance(support);
  return Object.freeze({
    elicitation:input.elicitation??elicitationFromDecision(runtime),
    context:input.context??conditionContext(runtime.decision?.contextProvenance??'UNKNOWN'),
    taskLoad:input.taskLoad??'UNKNOWN',
    assistance:Object.freeze({
      language:lookupUsed?'STRONG':input.assistance?.language??base,
      selection:input.assistance?.selection??'NONE',
      functionCue:input.assistance?.functionCue??'NONE',
      planning:input.assistance?.planning??'NONE',
      taskLoad:input.assistance?.taskLoad??'NONE',
      recentModelPrime:input.assistance?.recentModelPrime??currentPrime,
    }),
  });
}
export function recordContextualLookupExposureV4(runtime:Stage4RuntimeV4,candidateId:string):Stage4RuntimeV4{if(!runtime.blockState)return runtime;const marker=`LOOKUP:${candidateId}`,occurredAt=new Date().toISOString();return{...runtime,blockState:{...runtime.blockState,visibleBeforeResponse:[...new Set([...runtime.blockState.visibleBeforeResponse,marker])]},trace:[...runtime.trace,{id:`lookup-${occurredAt}-${candidateId}`,occurredAt,kind:'BLOCK_EVENT',fixture:false,payload:{type:'LOOKUP_OPENED',candidateId,evidenceEligible:false,supportEffect:'LANGUAGE_ASSISTANCE'}}]}}

const eventFor=(action:AdaptiveLearnerObservationV4):BlockLearnerEventTypeV4|null=>action.kind==='OUTPUT_SUBMITTED'?'ANSWER_SUBMITTED':action.kind==='LANGUAGE_OBJECT_PLACED'?'ITEM_MOVED':action.kind==='HELP_REQUESTED'?'HINT_REQUESTED':null;

export function compileAdaptiveDecisionContextV4(runtime:Stage4RuntimeV4,latestObservation:AdaptiveLearnerObservationV4):AdaptiveDecisionContextV4{
  return{
    runtimeId:runtime.id,
    authenticWork:runtime.usableSourceText,
    currentDecision:runtime.decision?{intent:runtime.decision.pedagogicalIntent,blockId:runtime.decision.selectedBlockId,support:runtime.decision.supportLevel}:undefined,
    latestObservation,
    supportHistory:runtime.blockEvents.map(event=>({type:event.type,support:event.supportLevel})),
    evidenceSummary:{
      eligible:runtime.evidenceCandidates.filter(item=>item.evidenceEligibility==='ELIGIBLE').length,
      ineligible:runtime.evidenceCandidates.filter(item=>item.evidenceEligibility==='INELIGIBLE').length,
      independent:runtime.evidenceCandidates.filter(item=>item.productionMode==='INDEPENDENT').length,
      assisted:runtime.evidenceCandidates.filter(item=>item.productionMode==='GUIDED'||item.productionMode==='CUED').length,
    },
    registeredBlocks:blockRegistryV4.all().map(block=>({id:block.id,role:block.role,facet:block.suitableFacets[0]})),
  };
}

export async function runAdaptiveDecisionPointV4(runtime:Stage4RuntimeV4,observation:AdaptiveLearnerObservationV4,provider:QualifiedDecisionProviderV4,fixture=false):Promise<AdaptiveDecisionPointResultV4>{
  let observed=runtime;
  const eventType=eventFor(observation);
  if(eventType&&runtime.blockState&&runtime.decision){
    const conditions=projectAdaptiveWorkspaceV4({runtime,draft:observation.response??runtime.usableSourceText}).productionConditions;
    observed=recordBlockEventStage4V4(runtime,eventType,{taskId:`workspace-${runtime.id}`,...observation.payload,response:observation.response??''},observation.success===true,conditions);
  }
  const context=compileAdaptiveDecisionContextV4(observed,observation);
  const qualifiedDecision=await provider(context);
  const decision=adaptQualifiedBlockDecisionV4(qualifiedDecision,`workspace-${runtime.id}`);
  return{runtime:selectBlockV4(observed,decision,fixture),context,qualifiedDecision};
}

export interface AdaptiveWorkspaceContentV1{roleMap?:{actor:string;verb:string;recipient:string;action:string;sentence?:string}}
const configuredList=(value:unknown)=>typeof value==='string'?value.split('|').map(item=>item.trim()).filter(Boolean):[];
export function projectAdaptiveWorkspaceV4(input:{runtime:Stage4RuntimeV4;draft:string;sourceMeaning?:string;placed?:boolean;content?:AdaptiveWorkspaceContentV1}):OutputWorkspaceVM{
  const {runtime}=input,decision=runtime.decision;
  if(!decision)return{source:{label:'原作',text:input.sourceMeaning??runtime.usableSourceText,canCollapse:false},output:{text:input.draft||runtime.usableSourceText,editable:true,placeholder:'寫下完整英文'},nextAction:{kind:'SUBMIT_OUTPUT',label:'送出這次產出',inputScope:'FULL_OUTPUT'},secondaryActions:['STUCK','CORRECT_INTENT','PAUSE'],productionConditions:conditionsForWorkspaceV4(runtime,{elicitation:'AUTHENTIC_TASK',context:'SOURCE',taskLoad:'HIGH',assistance:{language:'NONE',selection:'NONE',functionCue:'NONE',planning:'NONE',taskLoad:'NONE',recentModelPrime:'NONE'}})};
  const sharedDelivery=typeof decision.configuration.gDeliveryContent==='string'?decision.configuration.gDeliveryContent:undefined;
  const source={label:sharedDelivery?'這次任務':runtime.artifact.chineseSource?'原本想表達':'原作',text:sharedDelivery??input.sourceMeaning??runtime.artifact.chineseSource??runtime.usableSourceText,canCollapse:false};
  const puzzlePieceId=String(decision.configuration.teachingPuzzlePieceId??'') as TeachingPuzzlePieceIdV1,puzzleDefinition=teachingPuzzlePieceByIdV1(puzzlePieceId);
  if(decision.pedagogicalIntent==='TEACH'&&puzzleDefinition){
    const original=input.draft||runtime.usableSourceText,instructionalContent=configuredList(decision.configuration.instructionalContent),payload=compileTeachingPuzzlePayloadV1({pieceId:puzzlePieceId,payloadJson:typeof decision.configuration.teachingPuzzlePayloadJson==='string'?decision.configuration.teachingPuzzlePayloadJson:undefined,sourceText:source.text,learnerText:original,instructionalContent});
    return{source,output:{text:original,editable:false},intervention:{mechanismId:decision.selectedBlockId,renderer:puzzleDefinition.renderer,learnerCopy:String(decision.configuration.learnerInstruction??'先用這一塊把目前的關係看清楚。'),supportLevel:decision.supportLevel,payload:payload as unknown as Record<string,unknown>},nextAction:{kind:'CONTINUE_PRODUCTION',label:'換我試',inputScope:'CONSTRUCTION'},secondaryActions:['STUCK','CORRECT_INTENT','PAUSE'],productionConditions:conditionsForWorkspaceV4(runtime,{elicitation:'FUNCTION_CUED',taskLoad:'LOW',currentModelPrime:'STRONG',assistance:{language:'LIGHT',selection:'LIGHT',functionCue:'LIGHT',planning:'LIGHT',taskLoad:'LIGHT',recentModelPrime:'STRONG'}})};
  }
  if(decision.selectedBlockId==='grammar-role-map'&&input.content?.roleMap){const role=input.content.roleMap;return{source,output:{text:input.draft||runtime.usableSourceText,editable:false},intervention:{mechanismId:'grammar-role-map',renderer:'ROLE_MAP',learnerCopy:'先確認句子裡每個角色的位置。',supportLevel:decision.supportLevel,payload:{...role,placed:input.placed===true}},nextAction:{kind:'PLACE_LANGUAGE_OBJECT',label:'',inputScope:'CONSTRUCTION'},secondaryActions:['STUCK','CORRECT_INTENT','PAUSE'],productionConditions:conditionsForWorkspaceV4(runtime,{elicitation:'FUNCTION_CUED',taskLoad:'LOW',currentModelPrime:'STRONG',assistance:{language:'STRONG',selection:'STRONG',functionCue:'STRONG',planning:'NONE',taskLoad:'LIGHT',recentModelPrime:'STRONG'}})}}
  if(runtime.trace.some(entry=>entry.fixture)&&decision.selectedBlockId==='grammar-role-map'&&/allow\s+to\s+(use|work|choose|read|write|bring|take)/i.test(runtime.usableSourceText))return{...allowWorkspaceVM({output:input.placed?runtime.usableSourceText.replace(/allow\s+to\s+/i,'allow students to '):runtime.usableSourceText,mechanismId:'grammar-role-map',supportLevel:decision.supportLevel,placed:input.placed===true,representation:'ORIGINAL',editable:false,inputScope:'CONSTRUCTION'}),productionConditions:conditionsForWorkspaceV4(runtime,{elicitation:'FUNCTION_CUED',taskLoad:'LOW',currentModelPrime:'STRONG',assistance:{language:'STRONG',selection:'STRONG',functionCue:'STRONG',planning:'NONE',taskLoad:'LIGHT',recentModelPrime:'STRONG'}})};
  if(decision.selectedBlockId==='l1-collision')return{source,output:{text:input.draft||runtime.usableSourceText,editable:true},intervention:{mechanismId:'l1-collision',renderer:'ROLE_CONTRAST',learnerCopy:'換一種方式看句子裡的角色關係。',supportLevel:decision.supportLevel,payload:{}},nextAction:{kind:'CONTINUE_PRODUCTION',label:'保留原意，再寫一次',inputScope:'FULL_OUTPUT'},secondaryActions:['STUCK','CORRECT_INTENT','PAUSE'],productionConditions:conditionsForWorkspaceV4(runtime,{elicitation:'FUNCTION_CUED',taskLoad:'LOW',currentModelPrime:'STRONG',assistance:{language:'STRONG',selection:'LIGHT',functionCue:'STRONG',planning:'NONE',taskLoad:'LIGHT',recentModelPrime:'STRONG'}})};
  if(decision.selectedBlockId==='meaning-representation'){const bound=configuredList(decision.configuration.instructionalContent);return{source,output:{text:input.draft||runtime.usableSourceText,editable:true,placeholder:'保留你的意思，補上需要的英文'},intervention:{mechanismId:'meaning-representation',renderer:'LEXICAL_RETRIEVAL',learnerCopy:'先從你確定的意思找回這個詞。',supportLevel:decision.supportLevel,payload:{meaning:bound[0]??'依上下文找回意思，不直接替你完成整句',examples:bound.slice(1),syllables:[]}},nextAction:{kind:'SUBMIT_OUTPUT',label:'送出我的英文',inputScope:'FOCUSED_SPAN'},secondaryActions:['STUCK','CORRECT_INTENT','PAUSE'],productionConditions:conditionsForWorkspaceV4(runtime,{elicitation:'FUNCTION_CUED',taskLoad:'LOW',currentModelPrime:'LIGHT',assistance:{language:'LIGHT',selection:'LIGHT',functionCue:'LIGHT',planning:'NONE',taskLoad:'LIGHT',recentModelPrime:'LIGHT'}})}};
  if(decision.selectedBlockId==='sentence-anatomy')return{source,output:{text:input.draft||runtime.usableSourceText,editable:true,placeholder:'保留完整內容，由你修改'},intervention:{mechanismId:'sentence-anatomy',renderer:'COMPOSITION_DECOMPOSITION',learnerCopy:'先保留你的意思，只拆開目前負荷最大的部分。',supportLevel:decision.supportLevel,payload:{lines:['第一個意思','第二個意思','兩者的關係']}},nextAction:{kind:'SUBMIT_OUTPUT',label:'完成這次修改',inputScope:'FOCUSED_SPAN'},secondaryActions:['STUCK','CORRECT_INTENT','PAUSE'],productionConditions:conditionsForWorkspaceV4(runtime,{elicitation:'FUNCTION_CUED',taskLoad:'MEDIUM',currentModelPrime:'LIGHT',assistance:{language:'LIGHT',selection:'NONE',functionCue:'LIGHT',planning:'STRONG',taskLoad:'STRONG',recentModelPrime:'LIGHT'}})};
  const rendererByBlock:Partial<Record<string,NonNullable<OutputWorkspaceVM['intervention']>['renderer']>>={
    'spelling-reconstruction':'SPELLING_RECONSTRUCTION','sentence-builder':'SENTENCE_BUILDER','form-contrast':'FORM_MEANING_CONTRAST','collocation-match':'COLLOCATION_MATCH','rewrite-surface':'REWRITE_SURFACE','meaning-segmentation':'TRANSLATION_SEGMENTATION','contextual-production':'CONTEXTUAL_PRODUCTION','return-original-writing':'RETURN_TO_ORIGINAL','return-original-translation':'RETURN_TO_ORIGINAL'
  };
  const frozenRenderer=rendererByBlock[decision.selectedBlockId];
  if(frozenRenderer){
    const configuration=decision.configuration,original=input.draft||runtime.usableSourceText;
    const payload:Record<string,unknown>={original,target:String(configuration.targetWord??decision.targetReference),letters:configuredList(configuration.letters),parts:configuredList(configuration.parts),choices:configuredList(configuration.choices),meanings:configuredList(configuration.meanings),left:configuredList(configuration.leftItems),right:configuredList(configuration.rightItems),segments:configuredList(configuration.meaningSegments),context:input.sourceMeaning??source.text,constraint:String(configuration.rewriteConstraint??'保留原意，只修改目前標示的一小段。')};
    const returning=frozenRenderer==='RETURN_TO_ORIGINAL',unsupported=frozenRenderer==='CONTEXTUAL_PRODUCTION'||returning;
    return{source,output:{text:returning?'':original,editable:['REWRITE_SURFACE','CONTEXTUAL_PRODUCTION','RETURN_TO_ORIGINAL'].includes(frozenRenderer),placeholder:returning?'由你把修改寫回原作':'寫下你的英文'},intervention:{mechanismId:decision.selectedBlockId,renderer:frozenRenderer,learnerCopy:String(configuration.learnerInstruction??(returning?'剛才的支援收起了。現在回到原作，由你自己改。':'只處理目前這一小步。')),supportLevel:decision.supportLevel,payload},nextAction:{kind:'SUBMIT_OUTPUT',label:returning?'檢查修改':'繼續',inputScope:returning?'FOCUSED_SPAN':'CONSTRUCTION'},secondaryActions:['STUCK','CORRECT_INTENT','PAUSE'],lookupLocked:unsupported,productionConditions:conditionsForWorkspaceV4(runtime,{elicitation:unsupported?'AUTHENTIC_TASK':'FUNCTION_CUED',context:returning?'SOURCE':undefined,taskLoad:returning?'HIGH':'LOW',currentModelPrime:unsupported?'NONE':undefined,assistance:unsupported?{language:'NONE',selection:'NONE',functionCue:'NONE',planning:'NONE',taskLoad:'NONE',recentModelPrime:'NONE'}:undefined})};
  }
  if(decision.pedagogicalIntent==='SYSTEM')return{source,output:{text:input.draft||runtime.usableSourceText,editable:false},nextAction:{kind:'CONTINUE_SOURCE',label:'回到原作',inputScope:'FULL_OUTPUT'},secondaryActions:['CORRECT_INTENT','PAUSE'],status:{tone:'POSITIVE',text:'這份英文目前不需要額外教學。'},productionConditions:conditionsForWorkspaceV4(runtime,{elicitation:'UNKNOWN',context:'NOT_APPLICABLE',assistance:{language:'NONE',selection:'NONE',functionCue:'NONE',planning:'NONE',taskLoad:'NONE',recentModelPrime:'NONE'}})};
  const sharedPractice=decision.configuration.gDeliveryPurpose==='ACTIVE_PRACTICE',authenticRedeploy=decision.configuration.gAuthenticRedeploy===true;
  return{source,output:{text:input.draft,editable:true,placeholder:decision.pedagogicalIntent==='ASSESS'?'請重新寫一個完整句子':'寫下你的英文'},nextAction:{kind:'SUBMIT_OUTPUT',label:decision.pedagogicalIntent==='TRANSFER'?'送出新的情境':'送出這次產出',inputScope:'FULL_OUTPUT'},secondaryActions:['STUCK','CORRECT_INTENT','PAUSE'],lookupLocked:decision.pedagogicalIntent==='ASSESS'||decision.pedagogicalIntent==='TRANSFER'||authenticRedeploy,status:sharedPractice?{tone:'NEUTRAL',text:'這一步只降低非目標負荷；成功不等於已經獨立掌握。'}:decision.pedagogicalIntent==='PRACTICE'?{tone:'NEUTRAL',text:'剛才的成功有使用協助；接下來仍由你親自產出。'}:undefined,productionConditions:conditionsForWorkspaceV4(runtime,{elicitation:authenticRedeploy?'AUTHENTIC_TASK':decision.pedagogicalIntent==='TRANSFER'&&decision.contextProvenance==='SOURCE'?'AUTHENTIC_TASK':decision.pedagogicalIntent==='ASSESS'||decision.pedagogicalIntent==='TRANSFER'?'OPEN_CHOICE':elicitationFromDecision(runtime),context:authenticRedeploy?'SOURCE':undefined,taskLoad:authenticRedeploy?'HIGH':sharedPractice?'LOW':decision.pedagogicalIntent==='TRANSFER'?'HIGH':'MEDIUM',currentModelPrime:authenticRedeploy?'NONE':undefined,assistance:authenticRedeploy?{language:'NONE',selection:'NONE',functionCue:'NONE',planning:'NONE',taskLoad:'NONE',recentModelPrime:'NONE'}:sharedPractice?{language:'NONE',selection:'NONE',functionCue:'NONE',planning:'NONE',taskLoad:'STRONG',recentModelPrime:'NONE'}:undefined})};
}

export function allowResponseIsSuccessfulV4(response:string){return(['GUIDED','LIGHT','ASSESS','SOURCE'] as const).some(context=>evaluateAllowConstructionV4(response,context))}
