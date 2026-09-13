import{lookupAccessDecisionV1}from'./policy';
import{selectPhraseFirstLookupV1}from'./resolver';
import type{ContextualLookupPortV2,LookupDataSourceV1,LookupDecisionV1,LookupRequestV1}from'./types';

export function createContextualLookupRuntimeV1(source:LookupDataSourceV1,hooks?:{onLearnerLookup?:(event:{request:LookupRequestV1;decision:LookupDecisionV1})=>void|Promise<void>}):ContextualLookupPortV2{
  return{
    async lookup(request:LookupRequestV1):Promise<LookupDecisionV1>{
      const candidates=await source.candidates(request),candidate=selectPhraseFirstLookupV1(candidates,request);
      const decision=lookupAccessDecisionV1(candidate,request.assessmentMode);if(decision.allowed&&decision.candidate)await hooks?.onLearnerLookup?.({request,decision});return decision;
    },
  };
}
