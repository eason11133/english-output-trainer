import type{LookupCandidateV1,LookupHistoryEventV1,LookupRequestV1}from'./types';

export function lookupHistoryEventV1(input:{id:string;learnerId:string;sessionId:string;candidate:LookupCandidateV1;request:LookupRequestV1;occurredAt:string}):LookupHistoryEventV1{
  return Object.freeze({
    id:input.id,learnerId:input.learnerId,sessionId:input.sessionId,candidateId:input.candidate.id,label:input.candidate.label,kind:input.candidate.kind,
    occurredAt:input.occurredAt,assessmentMode:input.request.assessmentMode,evidenceEligible:false,productionConditionEffect:'LANGUAGE_ASSISTANCE'
  });
}
