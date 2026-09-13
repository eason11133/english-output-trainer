import type { ExperienceContractV1 } from '../architecture/contracts';
import type { QualifiedInnerTutorDecisionV1, TeacherDecisionProvenanceV1 } from '../teacher-runtime/types';
import type { Stage4RuntimeV4 } from '../domain/stage4/LearnerRuntimeV4';
import { endTutorSessionV1 } from '../teacher-runtime/sessionTime';

export function teacherDecisionToExperienceContractV1(decision:QualifiedInnerTutorDecisionV1):ExperienceContractV1{
  const request=decision.experience;
  const title=request.kind==='NO_INTERVENTION'?'繼續你的原作':request.kind==='QUESTION'?'先確認一件事':request.kind==='RETURN_TO_TASK'?'回到原作':request.kind==='SESSION_STOP'?'今天先到這裡':'處理目前最值得學的一件事';
  const action=decision.action==='NONE'?'NONE':decision.action==='WAIT'?'WAIT':decision.action==='RETURN_TO_TASK'?'RETURN_TO_TASK':decision.action==='STOP'?'STOP':decision.action==='EXIT'?'EXIT':'LEARNING_BLOCK';
  return{route:'LESSON',title,dominantAction:{label:request.kind==='SESSION_STOP'?'回到 Today':request.kind==='NO_INTERVENTION'?'繼續':'開始',action},state:'READY',internalReasoningVisible:false,execution:{action,blockDecision:action==='LEARNING_BLOCK'?decision.blockDecision:undefined,provenance:decision.provenance}};
}

export type TeacherExperienceEffectV1='SELECT_BLOCK'|'CONTINUE_ORIGINAL_TASK'|'RETURN_TO_ORIGINAL_TASK'|'STOP_SESSION'|'EXIT_SESSION';
export function executeTeacherExperienceV1(runtime:Stage4RuntimeV4,contract:ExperienceContractV1,now=new Date().toISOString()):{runtime:Stage4RuntimeV4;effect:TeacherExperienceEffectV1;blockDecision?:NonNullable<ExperienceContractV1['execution']['blockDecision']>}{
  const execution=contract.execution,provenance=execution.provenance as TeacherDecisionProvenanceV1;
  const base={...runtime,decisionProvenance:provenance,trace:[...runtime.trace,{id:`experience-${provenance.decisionPointId}`,occurredAt:now,kind:'EXPERIENCE_ACTION' as const,fixture:false,payload:{action:execution.action,decisionPointId:provenance.decisionPointId}}]};
  if(execution.action==='NONE'||execution.action==='WAIT')return{effect:'CONTINUE_ORIGINAL_TASK',runtime:{...base,status:'LEARNING',experienceState:'ORIGINAL_TASK',decision:undefined,blockState:undefined}};
  if(execution.action==='RETURN_TO_TASK')return{effect:'RETURN_TO_ORIGINAL_TASK',runtime:{...base,status:'LEARNING',experienceState:'RETURNED_TO_TASK',decision:undefined,blockState:undefined}};
  if(execution.action==='STOP')return{effect:'STOP_SESSION',runtime:endTutorSessionV1({...base,status:'COMPLETED',experienceState:'STOPPED',decision:undefined,blockState:undefined},now)};
  if(execution.action==='EXIT')return{effect:'EXIT_SESSION',runtime:endTutorSessionV1({...base,status:'COMPLETED',experienceState:'EXITED',decision:undefined,blockState:undefined},now)};
  if(!execution.blockDecision)throw new Error('experience_contract_learning_block_requires_decision_payload');
  return{effect:'SELECT_BLOCK',runtime:{...base,experienceState:'INTERVENTION'},blockDecision:execution.blockDecision};
}
