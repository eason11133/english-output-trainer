export type ReadingAttemptModeV1='PRACTICE'|'MOCK'|'FORMAL';
export type ReadingArenaStateV1='PASSAGE_OR_ITEM'|'ANSWERING'|'SUBMITTING'|'RESULT'|'REVIEW_FOCUS'|'TEACHING_HANDOFF'|'FRESH_REASONING_CHECK'|'CLOSE';
export interface ReadingExamItemV1{id:string;passageId:string;stem:string;options?:readonly {id:string;text:string}[];rubricRef?:string}
export interface ReadingExamSourceV1{id:string;passage:string;questions:readonly ReadingExamItemV1[];sourceRef:string;immutable:true}
export interface ReadingAnswerV1{questionId:string;response:string;updatedAt:string}
export interface ReadingReviewFocusV1{questionId:string;kind:'REFERENCE_RESOLUTION'|'INFERENCE_BRIDGE'|'OPTION_CONTRAST'|'LOGICAL_RELATION'|'VOCABULARY_IN_CONTEXT'|'STEM_MISREAD'|'EVIDENCE_SELECTION';anchorText:string;reasonRef:string}
export interface ReadingAttemptV1{
  schemaVersion:1;id:string;learnerId:string;mode:ReadingAttemptModeV1;source:ReadingExamSourceV1;state:ReadingArenaStateV1;
  answers:readonly ReadingAnswerV1[];startedAt:string;submittedAt?:string;immutableSubmit:boolean;
  locks:{teacher:boolean;hints:boolean;reveal:boolean;lookup:boolean};reviewFocus?:ReadingReviewFocusV1;originalAttemptId?:string;
  clock?:{budgetSeconds:number;deadlineAt:string};resultCommittedAt?:string;pendingContinuationId?:string;
}
const locks=(mode:ReadingAttemptModeV1)=>Object.freeze({teacher:mode!=='PRACTICE',hints:mode!=='PRACTICE',reveal:mode!=='PRACTICE',lookup:mode!=='PRACTICE'});
export function startReadingAttemptV1(input:{id:string;learnerId:string;mode:ReadingAttemptModeV1;source:ReadingExamSourceV1;startedAt:string;budgetSeconds?:number}):ReadingAttemptV1{const clock=input.budgetSeconds&&input.mode!=='PRACTICE'?Object.freeze({budgetSeconds:input.budgetSeconds,deadlineAt:new Date(Date.parse(input.startedAt)+input.budgetSeconds*1000).toISOString()}):undefined;return Object.freeze({schemaVersion:1,id:input.id,learnerId:input.learnerId,mode:input.mode,source:input.source,startedAt:input.startedAt,state:'PASSAGE_OR_ITEM',answers:Object.freeze([]),immutableSubmit:false,locks:locks(input.mode),clock})}
export function readingClockProjectionV1(attempt:ReadingAttemptV1,now:string){if(!attempt.clock)return{timed:false as const};const remainingSeconds=Math.max(0,Math.ceil((Date.parse(attempt.clock.deadlineAt)-Date.parse(now))/1000));return{timed:true as const,remainingSeconds,elapsedSeconds:attempt.clock.budgetSeconds-remainingSeconds,exhausted:remainingSeconds===0}}
export function answerReadingItemV1(attempt:ReadingAttemptV1,answer:ReadingAnswerV1):ReadingAttemptV1{
  if(attempt.immutableSubmit)throw new Error('reading_attempt_already_submitted');
  const answers=[...attempt.answers.filter(item=>item.questionId!==answer.questionId),Object.freeze(answer)];
  return Object.freeze({...attempt,state:'ANSWERING',answers:Object.freeze(answers)});
}
export function submitReadingAttemptV1(attempt:ReadingAttemptV1,submittedAt:string):ReadingAttemptV1{
  if(attempt.immutableSubmit)return attempt;
  return Object.freeze({...attempt,state:'RESULT',submittedAt,immutableSubmit:true,answers:Object.freeze(attempt.answers.map(item=>Object.freeze({...item})))});
}
export function commitReadingResultV1(attempt:ReadingAttemptV1,committedAt:string):ReadingAttemptV1{if(!attempt.immutableSubmit)throw new Error('reading_result_requires_submit');return Object.freeze({...attempt,state:'RESULT',resultCommittedAt:attempt.resultCommittedAt??committedAt})}
export function openReadingReviewV1(attempt:ReadingAttemptV1,focus:ReadingReviewFocusV1):ReadingAttemptV1{
  if(!attempt.immutableSubmit||!attempt.resultCommittedAt)throw new Error('reading_review_requires_committed_result');
  return Object.freeze({...attempt,state:'REVIEW_FOCUS',reviewFocus:Object.freeze(focus)});
}
export function handoffReadingTeachingV1(attempt:ReadingAttemptV1,newAttemptId:string):ReadingAttemptV1{
  if(!attempt.reviewFocus)throw new Error('reading_handoff_requires_review_focus');
  return Object.freeze({...attempt,id:newAttemptId,mode:'PRACTICE',state:'TEACHING_HANDOFF',locks:locks('PRACTICE'),originalAttemptId:attempt.id,answers:Object.freeze([]),immutableSubmit:false,submittedAt:undefined});
}
