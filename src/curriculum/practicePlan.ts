import type { LessonPlanV1 } from '../architecture/contracts';
import type { ProductTaskV1 } from '../content/productTaskCatalog';

export function practiceLessonPlanV1(input:{learnerId:string;task:ProductTaskV1;timeBudgetMinutes:number;productMode:'GENERAL'|'EXAM'}):LessonPlanV1{
  return Object.freeze({id:`lesson:practice:${input.task.id}:${input.learnerId}`,learnerId:input.learnerId,targetRef:input.task.targetRef,facet:input.task.facet,needKind:'MAINTENANCE',objective:`完成「${input.task.title}」並依回應接受必要教學`,reason:'LEARNER_SELECTED_VALIDATED_PRACTICE',reasonCodes:Object.freeze(['PRACTICE_SCOPE_SELECTED','SYSTEM_TASK_G1_G10_VALIDATED',...input.task.validatorRefs]),timeBudgetMinutes:Math.max(5,Math.min(60,input.timeBudgetMinutes)),productMode:input.productMode});
}
