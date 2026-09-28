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
  if(diagnosis.family==='COMPREHENSIVE')return{mode:'CLASSIFY',title:'先找出這一格在句子裡的工作',prompt:'先判斷是語法位置、字義，還是前後文造成限制。',options:[{id:'GRAMMAR',label:'語法或詞性位置'},{id:'MEANING',label:'這一句需要的意思'},{id:'CONTEXT',label:'前後句的線索'}]};
  if(diagnosis.family==='CONTEXTUAL_FILL')return{mode:'MATCH',title:'把空格限制和字庫配對',prompt:'這一格同時需要哪一組詞性、意思與篇章功能？',options:[{id:'FORM',label:'形式：空格前後允許什麼'},{id:'SENSE',label:'語意：放回句子是否合理'},{id:'POOL',label:'字庫：會不會害下一格無字可用'}]};
  if(diagnosis.family==='DISCOURSE')return{mode:'REFERENCE_LINK',title:'先連回這句的新舊資訊',prompt:'找出這句向前承接的對象，以及它要把讀者帶往哪裡。',options:[{id:'BACK',label:'向前：指示詞或已知資訊'},{id:'FUNCTION',label:'當下：這句的篇章功能'},{id:'FORWARD',label:'向後：下一句如何承接'}]};
  if(diagnosis.family==='READING'&&configuration?.repeatedFailure)return{mode:'COMPARE',title:'改成原文／選項對照',prompt:'不要再重選答案。先判斷選項和原文之間是哪一種關係。',options:[{id:'DIRECT_SUPPORT',label:'原文有直接支持'},{id:'TOO_STRONG',label:'選項比原文說得更強'},{id:'NOT_STATED',label:'原文沒有提供這個意思'}]};
  if(diagnosis.family==='READING')return{mode:'EVIDENCE_SELECT',title:'先圈證據，不要先重選答案',prompt:'選出真正能支持或限制這個選項的原文位置。',options:[{id:'DIRECT',label:'原文直接說明'},{id:'INFERENCE',label:'需要從兩個線索推出'},{id:'STRENGTH',label:'要比較語氣強度'}]};
  if(diagnosis.family==='MIXED')return{mode:'MARK',title:'先分開資料、轉換與表達',prompt:'標出這一小題是直接取用資料，還是需要轉換後再表達。',options:[{id:'COPYABLE',label:'資料可直接取用'},{id:'TRANSFORM',label:'需要計算、推論或改寫'},{id:'PRODUCE',label:'需要自己組織答案'}]};
  const labels:Record<string,string>={ASK_MEANING_RECOGNITION:'先確認看得懂的意思',CONTRAST_NEARBY_SENSES:'比較相近意思',CHECK_MEANING_TO_ENGLISH_RETRIEVAL:'不看選項，從意思叫出英文',CONTRAST_PROPORTION_AND_CAUSE:'比較「比例」與「原因」兩種意思',CLASSIFY_SEMANTIC_RELATION:'判斷句子正在說哪一種關係',CONTRAST_PHRASE_BOUNDARIES:'比較片語邊界從哪裡開始',RECONSTRUCT_CHUNK:'把完整片語重新組起來',GROUP_CHUNK_NOT_SINGLE_WORD:'把它當完整語塊，不拆成單字',SORT_CHUNK_FRAMES:'比較片語常出現的句型',FADE_RETRIEVAL_SUPPORT:'逐步拿掉提示再回想',CONTRAST_COLLOCATES:'比較哪些字會自然搭配',CHECK_CHUNK_RETRIEVAL:'不看選項回想完整語塊',CHECK_FRESH_PRODUCTION:'換一個新句子自己用一次',MARK_SYNTACTIC_SLOT:'標出句法位置需要什麼形式',REBUILD_WORD_FORM:'從字根重新組出正確詞形',CHECK_TYPED_PRODUCTION:'不看選項自己打出答案',ASK_LOCAL_MEANING:'先確認這一句需要的意思',MARK_GRAMMAR_SLOT:'標出空格需要的詞性或形式',COMPARE_COLLOCATION:'比較哪個搭配自然',CHECK_PREVIOUS_AND_NEXT_SENTENCE:'同時檢查前後文',MARK_SLOT_CONSTRAINT:'標出詞性與句型限制',COMPARE_LOCAL_MEANING:'比較候選字放回句中的意思',TRACE_PARAGRAPH_ROLE:'確認這一句在段落中的作用',RECHECK_REMAINING_POOL:'重查剩餘選項的連鎖影響',LINK_REFERENCES:'連回代名詞或指涉來源',LABEL_SENTENCE_FUNCTION:'判斷句子的篇章功能',MARK_BACKWARD_LINK:'標出向前連接',MARK_FORWARD_LINK:'標出向後連接',SELECT_EVIDENCE_LOCATION:'先選真正支持答案的原文位置',EXPLAIN_EVIDENCE_TO_OPTION_LINK:'說明證據如何連到選項',COMPARE_CLAIM_STRENGTH:'比較原文與選項語氣強度',CLASSIFY_NOT_STATED_OR_CONTRADICTED:'分清未提及與原文相反',IDENTIFY_SOURCE_EVIDENCE:'標出各來源提供的證據',CLASSIFY_COPYABLE_OR_TRANSFORMED:'判斷可直接取用或必須改寫',RETRIEVE_WITHOUT_OPTION:'拿掉選項後自己提取',RECONSTRUCT_SUMMARY:'用自己的話重組摘要',CLARIFY_CONTEXT:'補充剛才作答時的想法'};
  return{mode:diagnosis.family==='READING'?'EVIDENCE_SELECT':'SELECT',title:'先確認真正卡住的地方',prompt:'完成一個小判斷，EOT 老師才不會把不同問題當成同一種錯誤。',options:diagnosis.discriminatingActions.slice(0,4).map(id=>({id,label:labels[id]??'換一個角度再判斷'}))};
};
const copy=(blockId:string,sourceTaskContext?:Readonly<Record<string,unknown>>,role?:string):Pick<ExamTeacherInteractionV1,'mode'|'title'|'prompt'|'placeholder'|'options'>=>{
  const diagnostic=familyDiagnosticAction(sourceTaskContext);if(diagnostic)return diagnostic;
  if(role==='PRACTICE'||role==='ASSESS')return boundAction(sourceTaskContext)??{mode:'REPAIR',title:'換你完成',prompt:'依照剛才的關係完成修正。',placeholder:'寫下修正後的英文'};
  if(blockId==='inference-evidence-bridge')return{mode:'EVIDENCE_SELECT',title:'先找證據，再做推論',prompt:'先選你要用哪一種證據檢查方式；Teacher 不會替你選答案。',options:[{id:'DIRECT',label:'找原文直接支持的句子'},{id:'REFERENCE',label:'追查代名詞或指涉'},{id:'STRENGTH',label:'比較原文與選項的語氣強度'}]};
  const modes:Record<string,ExamTeacherInteractionModeV1>={'reference-chain':'REFERENCE_LINK','text-structure-map':'CLASSIFY','paragraph-function-map':'CLASSIFY','sentence-insertion-continuity':'REORDER','distractor-evidence-contrast':'COMPARE','claim-strength-contrast':'COMPARE','meaning-representation':'MATCH','form-contrast':'COMPARE','chunk-as-unit':'CHUNK_RECONSTRUCTION','collocation-network':'MATCH','morphology-decomposition':'MARK','meaning-segmentation':'MARK','task-requirement-map':'PLAN','idea-development-ladder':'PLAN','alternative-translation-compare':'COMPARE'};
  if(blockId==='task-requirement-map'){
    const requirements=Array.isArray(sourceTaskContext?.requirements)?sourceTaskContext!.requirements as string[]:[];
    return{mode:'PLAN',title:'先確認你有沒有答完整',prompt:`把題目要求逐一對回你的文章。${requirements.length?` 題目要求：${requirements.join('；')}`:''}`,options:(requirements.length?requirements:['立場','理由','例子']).map((label,index)=>({id:`REQ_${index}`,label}))};
  }
  if(blockId==='idea-development-ladder')return{mode:'PLAN',title:'把理由往下一層推',prompt:'不要重寫整篇。先選下一個必要內容步驟。',options:[{id:'WHY',label:'WHY：補原因'},{id:'MECHANISM',label:'MECHANISM：補如何發生'},{id:'EXAMPLE',label:'EXAMPLE：補具體例子'}]};
  if(blockId==='return-original-writing'||blockId==='return-original-translation'||blockId==='return-source-navigation')return{mode:'RETURN',title:'回到你的原作',prompt:'把剛才處理的那一點放回原本答案，由你自己修改。'};
  const block=blockRegistryV4.get(blockId);
  if(block&&(modes[blockId]||['SELECT','COMPARE','MATCH','ORDER','MOVE','RECONSTRUCT'].includes(block.interaction)))return{mode:modes[blockId]??'SELECT',title:block.label,prompt:`${block.learnerAction}。先完成這個可檢查的小步驟。`,options:[{id:'CHECK_CONTEXT',label:'回到上下文標出限制'},{id:'COMPARE_CHOICES',label:'比較兩個候選的差異'},{id:'VERIFY_FIT',label:'放回原句檢查連貫與語意'}]};
  return{mode:blockId.includes('repair')?'REPAIR':'FREE_PRODUCTION',title:block?.label??'現在換你做',prompt:block?.learnerAction??'請完成 Teacher 指定的下一小步。',placeholder:'在這裡完成這一步'};
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
