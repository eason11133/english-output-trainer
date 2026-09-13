import type { TeacherLineageCommandV1 } from './operationalTypes';
import type { TreatmentResponseV1 } from '../teacher-runtime/types';

type TreatmentPersistenceV1=NonNullable<TeacherLineageCommandV1['treatment']>;

export function composeTreatmentPersistenceV1(input:{
  episodeId:string;
  targetRef:string;
  facet:string;
  currentMove?:{decisionPointId:string;mechanismId:string;support:string;deliveredAt:string};
  priorMove?:{decisionPointId:string;mechanismId:string;support:string;deliveredAt:string};
  response?:TreatmentResponseV1;
}):TreatmentPersistenceV1|undefined{
  if(input.response&&!input.priorMove)throw new Error('treatment_response_requires_prior_move');
  if(input.response&&input.priorMove&&input.response.mechanismId!==input.priorMove.mechanismId)throw new Error('treatment_response_mechanism_mismatch');
  const currentMove=input.currentMove?{
    moveId:`move:${input.currentMove.decisionPointId}`,
    mechanismId:input.currentMove.mechanismId,
    support:input.currentMove.support,
    deliveredAt:input.currentMove.deliveredAt,
  }:undefined;
  const responseAttribution=input.response&&input.priorMove?{
    moveId:`move:${input.priorMove.decisionPointId}`,
    mechanismId:input.priorMove.mechanismId,
    support:input.priorMove.support,
    deliveredAt:input.priorMove.deliveredAt,
    response:input.response,
  }:undefined;
  if(!currentMove&&!responseAttribution)return undefined;
  return{episodeId:input.episodeId,targetRef:input.targetRef,facet:input.facet,currentMove,responseAttribution};
}
