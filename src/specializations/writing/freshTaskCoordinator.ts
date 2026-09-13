import type { LessonPlanV1 } from '../../architecture/contracts';
import { generateValidatedWritingTaskV1 } from '../../content';
import type { Stage4RuntimeV4 } from '../../domain/stage4/LearnerRuntimeV4';
import { currentWritingRevisionV1, hydrateWritingWorkV1 } from './workRuntime';
import { createWritingTaskGenerationNeedV1 } from './taskNeed';
import { registerWritingDeliveredTaskV1, writingFreshOpportunityGateV1 } from './freshTask';

export interface WritingFreshTaskPreparationV1{status:'NOT_APPLICABLE'|'READY'|'BLOCKED';runtime:Stage4RuntimeV4;reusedExisting:boolean;reasonCodes:readonly string[];taskId?:string}
export function prepareWritingFreshTaskForIntentV1(input:{runtime:Stage4RuntimeV4;lessonPlan:LessonPlanV1;intent:'ASSESS'|'TRANSFER';occurredAt:string}):WritingFreshTaskPreparationV1{
  const {runtime,lessonPlan,intent}=input;if(runtime.artifact.mode!=='WRITING')return{status:'NOT_APPLICABLE',runtime,reusedExisting:false,reasonCodes:Object.freeze([])};
  const work=hydrateWritingWorkV1(runtime);if(!work)return{status:'NOT_APPLICABLE',runtime,reusedExisting:false,reasonCodes:Object.freeze([])};
  const existing=writingFreshOpportunityGateV1(runtime,lessonPlan,intent);if(existing.allowed)return{status:'READY',runtime,reusedExisting:true,reasonCodes:Object.freeze([]),taskId:existing.task?.taskId};
  const need=createWritingTaskGenerationNeedV1({lessonPlan,source:work.sourceContext,purpose:intent==='TRANSFER'?'CHANGED_CONTEXT_TRANSFER':'FRESH_CHECK',desiredContextDistance:intent==='TRANSFER'?'CHANGED_TOPIC':'SAME_FUNCTION_NEW_CONTENT',responseScope:'SENTENCE',writingFunction:lessonPlan.objective,semanticRequirements:[],forbiddenReuse:[work.sourceContext.promptText,currentWritingRevisionV1(work).text,...(work.freshTaskHistory??[]).map(task=>task.promptText)],targetNameVisible:false,functionCueVisible:false,planningSupportAllowed:false,recentModelPrimeAllowed:false});
  const generated=generateValidatedWritingTaskV1({runtimeId:runtime.id,lessonPlan,source:{sourceRef:work.sourceContext.promptArtifactId,promptText:work.sourceContext.promptText,audience:work.sourceContext.audience,genre:work.sourceContext.genre},need,occurredAt:input.occurredAt});
  if(!generated)return{status:'BLOCKED',runtime,reusedExisting:false,reasonCodes:Object.freeze(['G_VALIDATED_FRESH_TASK_UNAVAILABLE'])};
  const prepared=registerWritingDeliveredTaskV1(runtime,lessonPlan,generated.delivery),gate=writingFreshOpportunityGateV1(prepared,lessonPlan,intent);if(!gate.allowed)return{status:'BLOCKED',runtime,reusedExisting:false,reasonCodes:Object.freeze(gate.reasons)};
  return{status:'READY',runtime:prepared,reusedExisting:false,reasonCodes:Object.freeze([]),taskId:generated.delivery.taskId};
}
