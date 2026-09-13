import type{ProductionConditionsV1}from'../domain/task/TaskContract';

export function applyLookupAssistanceV1(conditions:ProductionConditionsV1):ProductionConditionsV1{
  return Object.freeze({...conditions,assistance:Object.freeze({...conditions.assistance,language:conditions.assistance.language==='NONE'?'LIGHT':conditions.assistance.language})});
}

export const lookupVisibleSupportTokenV1=(candidateId:string)=>`LOOKUP:${candidateId}`;
