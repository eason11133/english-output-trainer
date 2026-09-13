import type { Stage4RuntimeV4 } from '../domain/stage4/LearnerRuntimeV4';
import type { TeacherBlockDecisionV4 } from '../domain/v4/LearningBlockV4';

export type FrozenExamExperienceStateV1=
  |'SOURCE_WORK'|'EVALUATING'|'FOCUSED_REPAIR'|'TEACHER_ENTRY'|'LEARNING_SPACE'
  |'REPLAN'|'SUPPORT_FADE'|'FRESH_CHECK'|'RETURN_OR_CLOSE'|'RESULT';

export interface FocusAnchorV1{
  artifactId:string;
  spanId?:string;
  start:number;
  end:number;
  excerpt:string;
  page?:number;
  sourceNeighborhood?:{before:string;after:string;scrollOffset?:number};
}

export type FrozenExamLearnerActionV1='SUBMIT'|'REQUEST_HELP'|'CORRECT_INTENT'|'RETRY'|'CONTINUE'|'RETURN'|'CLOSE'|'PAUSE';
export interface FrozenExamExperienceDecisionV1{
  schemaVersion:1;
  state:FrozenExamExperienceStateV1;
  artifactId:string;
  focusAnchor?:FocusAnchorV1;
  registeredBlockId?:string;
  supportVisible:boolean;
  answerVisible:boolean;
  allowedActions:readonly FrozenExamLearnerActionV1[];
  pendingEvaluationIdentity?:string;
}

const supported=(decision?:TeacherBlockDecisionV4)=>Boolean(decision&&decision.supportLevel!=='NONE');
export function frozenExamExperienceDecisionV1(runtime:Stage4RuntimeV4,focusAnchor?:FocusAnchorV1):FrozenExamExperienceDecisionV1{
  const decision=runtime.decision,block=runtime.blockState;
  let state:FrozenExamExperienceStateV1='SOURCE_WORK';
  if(runtime.status==='COMPLETED'||runtime.status==='RETURNED')state='RESULT';
  else if(runtime.pendingTeacherContinuation)state='EVALUATING';
  else if(decision?.pedagogicalIntent==='RETURN'||runtime.experienceState==='RETURNED_TO_TASK')state='RETURN_OR_CLOSE';
  else if((decision?.pedagogicalIntent==='ASSESS'||decision?.pedagogicalIntent==='TRANSFER')&&supported(decision))state='SUPPORT_FADE';
  else if(decision?.pedagogicalIntent==='ASSESS'||decision?.pedagogicalIntent==='TRANSFER')state='FRESH_CHECK';
  else if(block?.status==='RETRY'&&block.supportLevel==='NONE')state='SUPPORT_FADE';
  else if(block?.status==='WRONG'||block?.status==='RETRY')state='REPLAN';
  else if(decision?.pedagogicalIntent==='TEACH')state=block?'LEARNING_SPACE':'TEACHER_ENTRY';
  else if(decision?.pedagogicalIntent==='PRACTICE')state='LEARNING_SPACE';
  else if(decision)state='FOCUSED_REPAIR';
  const answerVisible=Boolean(block?.visibleBeforeResponse.length)||supported(decision);
  const allowed:FrozenExamLearnerActionV1[]=state==='RESULT'?['CLOSE']:state==='EVALUATING'?['PAUSE']:state==='RETURN_OR_CLOSE'?['SUBMIT','CLOSE','PAUSE']:['SUBMIT','REQUEST_HELP','CORRECT_INTENT','PAUSE'];
  return Object.freeze({schemaVersion:1,state,artifactId:runtime.artifact.id,focusAnchor,registeredBlockId:decision?.selectedBlockId,supportVisible:supported(decision),answerVisible,allowedActions:Object.freeze(allowed),pendingEvaluationIdentity:runtime.pendingTeacherContinuation?.actionIdentity});
}

export function assertUnsupportedPresentationV1(decision:FrozenExamExperienceDecisionV1){
  if((decision.supportVisible||decision.answerVisible)&&decision.state==='FRESH_CHECK')throw new Error('fresh_check_cannot_present_visible_support');
  return decision;
}
