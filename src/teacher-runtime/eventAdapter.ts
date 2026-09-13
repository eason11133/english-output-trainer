import type { BlockLearnerEventTypeV4, BlockSupportV4, PedagogicalRoleV4 } from '../domain/v4/LearningBlockV4';
import type { ProductionConditionsV1 } from '../domain/task/TaskContract';
import type { LearnerOutcomeV1, PedagogicalEventKindV1, PedagogicalEventV1 } from './types';

export interface AdaptedPedagogicalEventV1{event:PedagogicalEventV1;requiresSemanticEvaluation:boolean;capabilityEvidenceAllowed:boolean;contextOnly:boolean}

export function adaptLearnerEventToPedagogyV1(input:{id:string;type:'STARTED'|'SOURCE_CLARIFIED'|'RESUMED'|'TIME_EXHAUSTED'|'SYSTEM'|BlockLearnerEventTypeV4;occurredAt:string;support:BlockSupportV4;observationIds:readonly string[];attemptId?:string;role?:PedagogicalRoleV4;evaluatedOutcome?:LearnerOutcomeV1;productionConditions?:ProductionConditionsV1}):AdaptedPedagogicalEventV1{
  let kind:PedagogicalEventKindV1='SYSTEM_EVENT',outcome:LearnerOutcomeV1='NOT_EVALUATED',requiresSemanticEvaluation=false,capabilityEvidenceAllowed=false,contextOnly=true;
  if(input.type==='STARTED'){kind='LESSON_STARTED'}
  else if(input.type==='SOURCE_CLARIFIED'){kind='SOURCE_CLARIFIED'}
  else if(input.type==='RESUMED'){kind='RESUMED'}
  else if(input.type==='TIME_EXHAUSTED'){kind='TIME_EXHAUSTED'}
  else if(input.type==='HINT_REQUESTED'){kind='HELP_REQUESTED';outcome='HELP_WITHOUT_ATTEMPT'}
  else if(input.type==='IMPASSE_REPLAN_REQUESTED'){kind='HELP_REQUESTED';outcome='HELP_WITHOUT_ATTEMPT'}
  else if(input.type==='SUPPORT_REVEALED'){kind='SUPPORT_REVEALED'}
  else if(input.type==='SUPPORT_FADE_REQUESTED'){kind='SUPPORT_REDUCTION_REQUESTED';outcome='NOT_EVALUATED';contextOnly=true}
  else if(['ITEM_MOVED','ITEM_REORDERED','OPTION_SELECTED','TEXT_ENTERED'].includes(input.type)){kind='LEARNER_MANIPULATION'}
  else if(input.type==='BLOCK_ABANDONED'){kind='LEARNER_RESPONSE';outcome='ABANDONED'}
  else if(input.type==='BLOCK_COMPLETED'&&input.role==='TEACH'){kind='LEARNER_RESPONSE';outcome='EXPOSURE_ONLY'}
  else if(['ANSWER_SUBMITTED','BLOCK_COMPLETED','SELF_REPAIR','RETRY'].includes(input.type)){
    kind='LEARNER_RESPONSE';requiresSemanticEvaluation=input.evaluatedOutcome===undefined;outcome=input.evaluatedOutcome??'NOT_EVALUATED';capabilityEvidenceAllowed=['SUCCESS','PARTIAL','FAILURE'].includes(outcome);contextOnly=false;
  }
  return{event:{id:input.id,kind,occurredAt:input.occurredAt,outcome,support:input.support,observationIds:input.observationIds,attemptId:input.attemptId,learnerIntent:input.type==='IMPASSE_REPLAN_REQUESTED'?'IMPASSE_REPLAN':input.type==='HINT_REQUESTED'?'ORDINARY_SUPPORT':input.type==='SUPPORT_FADE_REQUESTED'?'TRY_INDEPENDENT':undefined,productionConditions:input.productionConditions},requiresSemanticEvaluation,capabilityEvidenceAllowed,contextOnly};
}
