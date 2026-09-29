import type { LessonPlanV1, ProductContextV1 } from '../../architecture/contracts';
import type { LearnerModelSnapshotV3 } from '../../domain/learner/LearnerModelV3';
import type { InnerTutorDecisionInputV1, QualifiedInnerTutorDecisionV1 } from '../../teacher-runtime';
import { decideInnerTutorV1 } from '../../teacher-runtime';
import { blockRegistryV4 } from '../v4/blockRegistryV4';
import type { ExamTriageActionV1 } from './examTriage';

export type ExamTeacherInteractionModeV1='SELECT'|'CLASSIFY'|'MARK'|'EVIDENCE_SELECT'|'REFERENCE_LINK'|'MATCH'|'COMPARE'|'REORDER'|'PLAN'|'CHUNK_RECONSTRUCTION'|'REPAIR'|'FREE_PRODUCTION'|'RETURN';
export interface ExamTeacherInteractionV1{
  schemaVersion:1;
  interactionId:string;
  decisionPointId:string;
  blockId:string;
  mechanismId:string;
  mode:ExamTeacherInteractionModeV1;
  title:string;
  prompt:string;
  placeholder?:string;
  options?:readonly {id:string;label:string}[];
  support:QualifiedInnerTutorDecisionV1['blockDecision']['supportLevel'];
  treatmentDepth:ExamTriageActionV1;
  mustAct:true;
  answerLeakageForbidden:true;
}

const boundAction=(source?:Readonly<Record<string,unknown>>):Pick<ExamTeacherInteractionV1,'mode'|'title'|'prompt'|'placeholder'|'options'>|undefined=>{
  const payload=source?.taskPayload as Record<string,unknown>|undefined,key=String(source?.responseKey??'');if(!payload||!key)return undefined;
  const configuration=source?.decisionConfiguration as Record<string,unknown>|undefined;
  const faded=Number(configuration?.compositionCursor)===2||['CUED','LIGHT','NONE'].includes(String(source?.decisionSupport??''));
  for(const raw of [payload.questions,payload.parts,payload.blanks])if(Array.isArray(raw)){const item=(raw as {id?:unknown;prompt?:unknown;options?:unknown}[]).find(row=>String(row.id??'')===key);if(item&&Array.isArray(item.options))return{mode:'SELECT',title:faded?'提示收起來，自己判斷':'換你再判斷一次',prompt:String(item.prompt??'依照剛才的關係，重新選出最符合的答案。'),options:(item.options as {id?:unknown;text?:unknown}[]).map(option=>({id:String(option.id??''),label:String(option.text??option.id??'')}))};}
  return{mode:'REPAIR',title:'只修這一小步',prompt:'保留原本是對的部分，只改剛才尚未成立的地方。',placeholder:'寫下你修正後的英文'};
};
const familyDiagnosticAction=(source?:Readonly<Record<string,unknown>>):Pick<ExamTeacherInteractionV1,'mode'|'title'|'prompt'|'placeholder'|'options'>|undefined=>{
  const diagnosis=source?.familyDiagnosis as {family?:string;observationKind?:string;discriminatingActions?:readonly string[];learnerAuthorshipRequired?:boolean}|undefined;
  if(!diagnosis?.discriminatingActions?.length)return undefined;
  const configuration=source?.decisionConfiguration as Record<string,unknown>|undefined;
  if(diagnosis.learnerAuthorshipRequired)return diagnosis.family==='WRITING'
    ?{mode:'FREE_PRODUCTION',title:'保留你的文章，只重寫這一句',prompt:'原稿不會被參考答案取代。請用你自己的語氣，讓這句更完整。',placeholder:'在這裡重寫目標句'}
    :{mode:'REPAIR',title:'先保留你的意思，再修一小段',prompt:'先對齊原文的意思單位，再用你自己的英文完成修正。',placeholder:'寫下你修正後的英文'};
  if(diagnosis.family==='VOCABULARY'){
    const payload=source?.taskPayload as {passage?:string;questions?:{prompt?:string;options?:{id:string;text:string}[]}[]}|undefined;
    const question=payload?.questions?.[0],choices=question?.options??[];
    if(configuration?.repeatedFailure)return{
      mode:'CHUNK_RECONSTRUCTION',
      title:'縮小到關鍵字',
      prompt:'先不要處理整句。只比較每個候選字放進空格後的意思。',
      options:choices.slice(0,4).map(choice=>({id:choice.id,label:choice.text})),
    };
    if(source?.interactionKind==='IMPASSE')return{
      mode:'COMPARE',
      title:'把三個動作分開',
      prompt:'不要再猜字形。先把每個字真正做的動作分清楚，再放回原句。',
      options:choices.slice(0,4).map(choice=>({id:choice.id,label:choice.text})),
    };
    return{
      mode:'EVIDENCE_SELECT',
      title:'先抓句子裡的線索',
      prompt:'哪一個線索最能限制空格需要的意思？',
      options:[{id:'PROMPT',label:String(question?.prompt??'題目問的意思')},{id:'PASSAGE',label:String(payload?.passage??'原句的上下文')},{id:'CHOICES',label:'候選字彼此的意思差異'}],
    };
  }
  if(diagnosis.family==='COMPREHENSIVE')return{mode:'CLASSIFY',title:'看空格前後',prompt:'這格需要哪一種形式？',options:[{id:'VERB',label:'動詞原形'},{id:'NOUN',label:'名詞'},{id:'ADJECTIVE',label:'形容詞'},{id:'ADVERB',label:'副詞'}]};
  if(diagnosis.family==='CONTEXTUAL_FILL')return{mode:'MATCH',title:'回到這個空格',prompt:'把候選字放回同一個空格，看看哪個讓整句成立。',options:((source?.taskPayload as {wordPool?:string[]}|undefined)?.wordPool??[]).slice(0,4).map((label,index)=>({id:`POOL_${index}`,label}))};
  if(diagnosis.family==='DISCOURSE')return{mode:'REFERENCE_LINK',title:'回到段落',prompt:'這裡指的是前面的哪一段？',options:[]};
  if(diagnosis.family==='READING'&&configuration?.repeatedFailure)return{mode:'COMPARE',title:'原文和選項放在一起看',prompt:'哪個說法沒有比原文更強？',options:[]};
  if(diagnosis.family==='READING')return{mode:'EVIDENCE_SELECT',title:'回到原文',prompt:'先找真正能決定答案的原文。',options:[]};
  if(diagnosis.family==='MIXED')return{mode:'MARK',title:'回到資料',prompt:'答案要從哪一塊資料開始？',options:[]};
  return{mode:diagnosis.family==='READING'?'EVIDENCE_SELECT':'SELECT',title:'回到題目',prompt:'用題目裡的英文再判斷一次。',options:[]};
};
const copy=(blockId:string,sourceTaskContext?:Readonly<Record<string,unknown>>,role?:string):Pick<ExamTeacherInteractionV1,'mode'|'title'|'prompt'|'placeholder'|'options'>=>{
  const diagnostic=familyDiagnosticAction(sourceTaskContext);if(diagnostic)return diagnostic;
  if(role==='PRACTICE'||role==='ASSESS')return boundAction(sourceTaskContext)??{mode:'REPAIR',title:'修改目標片段',prompt:'保留原本內容，只改目前標出的英文。',placeholder:'寫下修正後的英文'};
  if(blockId==='inference-evidence-bridge')return{mode:'EVIDENCE_SELECT',title:'回到原文',prompt:'先找真正能決定答案的原文。',options:[]};
  const modes:Record<string,ExamTeacherInteractionModeV1>={'reference-chain':'REFERENCE_LINK','text-structure-map':'CLASSIFY','paragraph-function-map':'CLASSIFY','sentence-insertion-continuity':'REORDER','distractor-evidence-contrast':'COMPARE','claim-strength-contrast':'COMPARE','meaning-representation':'MATCH','form-contrast':'COMPARE','chunk-as-unit':'CHUNK_RECONSTRUCTION','collocation-network':'MATCH','morphology-decomposition':'MARK','meaning-segmentation':'MARK','task-requirement-map':'PLAN','idea-development-ladder':'PLAN','alternative-translation-compare':'COMPARE'};
  if(blockId==='task-requirement-map'){
    const requirements=Array.isArray(sourceTaskContext?.requirements)?sourceTaskContext!.requirements as string[]:[];
    return{mode:'PLAN',title:'先確認你有沒有答完整',prompt:`把題目要求逐一對回你的文章。${requirements.length?` 題目要求：${requirements.join('；')}`:''}`,options:(requirements.length?requirements:['立場','理由','例子']).map((label,index)=>({id:`REQ_${index}`,label}))};
  }
  if(blockId==='idea-development-ladder')return{mode:'FREE_PRODUCTION',title:'補上缺少的內容',prompt:'用你自己的內容，補一個能支持這句主張的具體細節。',placeholder:'寫下一個具體細節'};
  if(blockId==='return-original-writing'||blockId==='return-original-translation'||blockId==='return-source-navigation')return{mode:'REPAIR',title:'修改你的原句',prompt:'保留全文，只把剛才處理的片段改進去。',placeholder:'寫下修改後的片段'};
  const block=blockRegistryV4.get(blockId);
  if(block&&(modes[blockId]||['SELECT','COMPARE','MATCH','ORDER','MOVE','RECONSTRUCT'].includes(block.interaction)))return{mode:modes[blockId]??'SELECT',title:'直接在題目上處理',prompt:block.learnerAction,options:[]};
  return{mode:blockId.includes('repair')?'REPAIR':'FREE_PRODUCTION',title:'用你的英文完成',prompt:block?.learnerAction??'保留原意，只處理現在這一段。',placeholder:'寫下你的英文'};
};

export function buildExamTeacherInteractionV1(input:{decision:QualifiedInnerTutorDecisionV1;sessionId:string;sourceTaskContext?:Readonly<Record<string,unknown>>}):ExamTeacherInteractionV1|undefined{
  const action=input.decision.action;
  if(['NONE','WAIT','STOP','EXIT'].includes(action))return undefined;
  const treatmentDepth=String(input.decision.blockDecision.configuration.examTriageAction??'MICRO_TEACH') as ExamTriageActionV1;
  if(treatmentDepth==='SAVE_FOR_LATER')return undefined;
  const blockId=input.decision.blockDecision.selectedBlockId;
  const block=blockRegistryV4.get(blockId);if(!block)return undefined;
  const projectedRole=treatmentDepth==='FIX_ONLY'||treatmentDepth==='QUICK_NOTE'?'PRACTICE':block.role;
  const base=copy(blockId,{...input.sourceTaskContext,decisionConfiguration:input.decision.blockDecision.configuration,decisionSupport:input.decision.blockDecision.supportLevel},projectedRole);
  const c=treatmentDepth==='FIX_ONLY'?{...base,title:'只改這一點',prompt:'把剛才這一點修正後就回到題目。'}:treatmentDepth==='QUICK_NOTE'?{...base,title:'先留意這個線索',prompt:'看一次關鍵線索，接著繼續。'}:base;
  return Object.freeze({schemaVersion:1,interactionId:`exam-interaction:${input.sessionId}:${input.decision.provenance.decisionPointId}:${blockId}`,decisionPointId:input.decision.provenance.decisionPointId,blockId,mechanismId:input.decision.experience.mechanismId??blockId,...c,support:input.decision.blockDecision.supportLevel,treatmentDepth,mustAct:true,answerLeakageForbidden:true});
}

export type ExamInteractionCompletionV1={kind:'SUBMITTED'|'IMPASSE'|'RETURNED';response?:string;evaluatedOutcome?:'SUCCESS'|'PARTIAL'|'FAILURE'};
export function interactionOutcomeV1(input:{decision:QualifiedInnerTutorDecisionV1;completion:ExamInteractionCompletionV1}):'NOT_EVALUATED'|'EXPOSURE_ONLY'|'SUCCESS'|'PARTIAL'|'FAILURE'{
  if(input.completion.kind==='IMPASSE')return'FAILURE';
  if(input.completion.kind==='RETURNED')return'NOT_EVALUATED';
  if(input.decision.blockDecision.pedagogicalIntent==='TEACH')return'EXPOSURE_ONLY';
  return input.completion.evaluatedOutcome??'NOT_EVALUATED';
}

export async function continueExamTeacherAfterInteractionV1(input:{
  learnerId:string;sessionId:string;lessonPlan:LessonPlanV1;productContext:ProductContextV1;learnerTruth:LearnerModelSnapshotV3;
  previousDecision:QualifiedInnerTutorDecisionV1;completion:ExamInteractionCompletionV1;sourceTaskContext?:Readonly<Record<string,unknown>>;
  provider?:InnerTutorDecisionInputV1['provider'];
}):Promise<QualifiedInnerTutorDecisionV1>{
  const now=new Date().toISOString(),outcome=interactionOutcomeV1({decision:input.previousDecision,completion:input.completion});
  const targetPlan:LessonPlanV1={...input.lessonPlan,targetRef:input.previousDecision.provenance.targetRef,facet:input.previousDecision.provenance.facet};
  const history=input.previousDecision.lineage?.context.recentTreatmentResponses??[];
  const treatments=[...history,...(input.previousDecision.treatmentResponse?[input.previousDecision.treatmentResponse]:[])].filter((item,index,all)=>all.findIndex(other=>other.eventId===item.eventId)===index).slice(-6);
  const next=await decideInnerTutorV1({lessonPlan:targetPlan,productContext:input.productContext,learnerTruth:input.learnerTruth,event:{id:`exam-interaction-response:${input.sessionId}:${input.previousDecision.provenance.decisionPointId}`,kind:'LEARNER_MANIPULATION',occurredAt:now,outcome,support:input.previousDecision.blockDecision.supportLevel,observationIds:[],learnerIntent:input.completion.kind==='IMPASSE'?'IMPASSE_REPLAN':undefined},recentAttempts:[],recentTreatmentResponses:treatments,timeRemainingMinutes:targetPlan.timeBudgetMinutes,currentDecision:input.previousDecision.blockDecision,currentProvenance:input.previousDecision.provenance,sourceTaskContext:{...input.sourceTaskContext,learnerResponse:input.completion.response,interactionKind:input.completion.kind,interactionOutcome:outcome},provider:input.provider??(async()=>{throw new Error('exam_teacher_provider_unavailable')})});
  const family=input.sourceTaskContext?.family??(input.sourceTaskContext?.familyDiagnosis as {family?:string}|undefined)?.family;
  if(family==='READING'&&outcome==='FAILURE'){
    const alternatives=['distractor-evidence-contrast','claim-strength-contrast','inference-evidence-bridge'];
    const selectedBlockId=alternatives.find(id=>id!==input.previousDecision.blockDecision.selectedBlockId)??alternatives[0];
    return Object.freeze({...next,action:'TEACH' as const,blockDecision:{...next.blockDecision,pedagogicalIntent:'TEACH' as const,selectedBlockId,supportLevel:'EXPLICIT' as const,configuration:{...next.blockDecision.configuration,repeatedFailure:true},reasonForSelection:'Repeated Reading failure requires a materially different evidence representation.'},experience:{...next.experience,mechanismId:selectedBlockId,narrator:{state:'CHANGE_APPROACH' as const,message:'不再重選答案，改成比對原文和選項的關係。'}},provenance:{...next.provenance,selectedMechanismId:selectedBlockId,reasonCodes:Object.freeze([...next.provenance.reasonCodes,'REPEATED_FAILURE_REPRESENTATION_CHANGE'])}});
  }
  if(input.completion.kind==='IMPASSE'&&family==='VOCABULARY'){
    const selectedBlockId=input.previousDecision.blockDecision.selectedBlockId==='form-contrast'?'meaning-representation':'form-contrast';
    return Object.freeze({...next,action:'TEACH' as const,blockDecision:{...next.blockDecision,pedagogicalIntent:'TEACH' as const,selectedBlockId,supportLevel:'GUIDED' as const,configuration:{...next.blockDecision.configuration,replannedAfterImpasse:true},reasonForSelection:'Learner impasse requires a materially different contrast representation.'},experience:{...next.experience,mechanismId:selectedBlockId,narrator:{state:'CHANGE_APPROACH' as const,message:'同一個做法沒有幫上忙，改用字義對照。'}},provenance:{...next.provenance,selectedMechanismId:selectedBlockId,reasonCodes:Object.freeze([...next.provenance.reasonCodes,'IMPASSE_MATERIAL_REPRESENTATION_CHANGE'])}});
  }
  const previousInteractionKind=input.previousDecision.lineage?.context.sourceTaskContext?.interactionKind;
  const expectedResponse=String(input.sourceTaskContext?.expectedResponse??'');
  if((family==='VOCABULARY'||previousInteractionKind==='IMPASSE'||input.previousDecision.blockDecision.selectedBlockId==='form-contrast')&&input.completion.kind==='SUBMITTED'&&Boolean(expectedResponse)&&input.completion.response!==expectedResponse){
    const selectedBlockId='meaning-representation';
    return Object.freeze({...next,action:'TEACH' as const,blockDecision:{...next.blockDecision,pedagogicalIntent:'TEACH' as const,selectedBlockId,supportLevel:'EXPLICIT' as const,configuration:{...next.blockDecision.configuration,replannedAfterImpasse:true,repeatedFailure:true},reasonForSelection:'Repeated failure requires reducing the sentence to a manipulable constituent.'},experience:{...next.experience,mechanismId:selectedBlockId,narrator:{state:'CHANGE_APPROACH' as const,message:'整句先放下，改成拼一個最小片語。'}},provenance:{...next.provenance,selectedMechanismId:selectedBlockId,reasonCodes:Object.freeze([...next.provenance.reasonCodes,'REPEATED_FAILURE_SMALLER_CONSTITUENT'])}});
  }
  return next;
}
