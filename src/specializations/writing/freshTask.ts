import type { LessonPlanV1 } from '../../architecture/contracts';
import type { Stage4RuntimeV4 } from '../../domain/stage4/LearnerRuntimeV4';
import type { PedagogicalIntentV4 } from '../../domain/v4/LearningBlockV4';
import type { WritingDeliveredTaskV1 } from './types';
import { hydrateWritingWorkV1, type Stage4WritingRuntimeV1 } from './workRuntime';

export function validateWritingDeliveredTaskV1(runtime:Stage4RuntimeV4,lessonPlan:LessonPlanV1,task:WritingDeliveredTaskV1):readonly string[]{
  const work=hydrateWritingWorkV1(runtime),errors:string[]=[];
  if(!work)return Object.freeze(['WRITING_WORK_MISSING']);
  if(!task.validated)errors.push('FRESH_TASK_NOT_VALIDATED');
  if(task.consumedAt)errors.push('FRESH_TASK_ALREADY_CONSUMED');
  if(task.targetRef!==lessonPlan.targetRef)errors.push('FRESH_TASK_TARGET_MISMATCH');
  if(task.facet!==lessonPlan.facet)errors.push('FRESH_TASK_FACET_MISMATCH');
  if(!task.taskId.trim()||task.taskId===work.sourceContext.promptArtifactId)errors.push('FRESH_TASK_ID_NOT_NEW');
  if(!task.promptText.trim()||task.promptText.trim()===work.sourceContext.promptText.trim())errors.push('FRESH_TASK_PROMPT_NOT_NEW');
  const normalizedPrompt=task.promptText.trim().replace(/\s+/g,' ').toLowerCase();
  if((work.freshTaskHistory??[]).some(item=>item.taskId!==task.taskId&&item.promptText.trim().replace(/\s+/g,' ').toLowerCase()===normalizedPrompt))errors.push('FRESH_TASK_PROMPT_REUSED');
  if(task.purpose==='CHANGED_CONTEXT_TRANSFER'&&task.contextNovelty!=='CHANGED_CONTEXT')errors.push('TRANSFER_TASK_CONTEXT_NOT_CHANGED');
  if(task.purpose==='CHANGED_CONTEXT_TRANSFER'&&task.desiredContextDistance==='SAME_FUNCTION_NEW_CONTENT')errors.push('TRANSFER_TASK_DISTANCE_NOT_CHANGED');
  if(task.purpose==='FRESH_CHECK'&&task.desiredContextDistance!=='SAME_FUNCTION_NEW_CONTENT')errors.push('FRESH_CHECK_DISTANCE_MISMATCH');
  if(!task.contextKey.trim())errors.push('FRESH_TASK_CONTEXT_KEY_MISSING');
  if(!task.generationRef.trim())errors.push('FRESH_TASK_GENERATION_REF_MISSING');
  if(!task.semanticRequirements.length)errors.push('FRESH_TASK_SEMANTIC_REQUIREMENTS_MISSING');
  if(!task.validatorRefs.length)errors.push('FRESH_TASK_VALIDATOR_MISSING');
  return Object.freeze(errors);
}

export function registerWritingDeliveredTaskV1(runtime:Stage4RuntimeV4,lessonPlan:LessonPlanV1,task:WritingDeliveredTaskV1):Stage4WritingRuntimeV1{
  const typed=runtime as Stage4WritingRuntimeV1,work=hydrateWritingWorkV1(runtime);if(!work)throw new Error('writing work missing');
  const history=work.freshTaskHistory??[];if(history.some(item=>item.taskId===task.taskId)||work.freshTask?.taskId===task.taskId)throw new Error('writing fresh task id already used');
  const errors=validateWritingDeliveredTaskV1(runtime,lessonPlan,task);if(errors.length)throw new Error(`invalid_writing_fresh_task:${errors.join('|')}`);
  const delivered=Object.freeze({...task,validatorRefs:Object.freeze([...task.validatorRefs]),semanticRequirements:Object.freeze([...task.semanticRequirements])});
  return{...typed,writingWork:{...work,freshTask:delivered,freshTaskHistory:Object.freeze([...history,delivered]),phase:'FRESH_WRITING',updatedAt:task.deliveredAt}};
}

export function consumeWritingFreshTaskV1(runtime:Stage4RuntimeV4,occurredAt:string):Stage4WritingRuntimeV1{
  const typed=runtime as Stage4WritingRuntimeV1,work=hydrateWritingWorkV1(runtime);if(!work?.freshTask)throw new Error('writing fresh task missing');
  if(work.freshTask.consumedAt)return typed;
  const consumed=Object.freeze({...work.freshTask,consumedAt:occurredAt});
  const history=(work.freshTaskHistory??[]).map(item=>item.taskId===consumed.taskId?consumed:item);
  return{...typed,writingWork:{...work,freshTask:consumed,freshTaskHistory:Object.freeze(history),updatedAt:occurredAt}};
}

export function writingFreshOpportunityGateV1(runtime:Stage4RuntimeV4,lessonPlan:LessonPlanV1,intent:PedagogicalIntentV4):{allowed:boolean;reasons:readonly string[];task?:WritingDeliveredTaskV1}{
  if(intent!=='ASSESS'&&intent!=='TRANSFER')return{allowed:true,reasons:Object.freeze([])};
  const work=hydrateWritingWorkV1(runtime);if(!work)return{allowed:false,reasons:Object.freeze(['WRITING_WORK_MISSING'])};
  const task=work.freshTask;if(!task)return{allowed:false,reasons:Object.freeze(['VALIDATED_FRESH_TASK_NOT_DELIVERED'])};
  const reasons=[...validateWritingDeliveredTaskV1(runtime,lessonPlan,task)];
  if(intent==='TRANSFER'&&(task.purpose!=='CHANGED_CONTEXT_TRANSFER'||task.contextNovelty!=='CHANGED_CONTEXT'))reasons.push('TRANSFER_REQUIRES_VALIDATED_CHANGED_CONTEXT_TASK');
  if(intent==='ASSESS'&&task.purpose!=='FRESH_CHECK')reasons.push('ASSESS_REQUIRES_VALIDATED_FRESH_CHECK_TASK');
  return{allowed:reasons.length===0,reasons:Object.freeze(reasons),task};
}
