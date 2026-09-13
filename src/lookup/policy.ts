import type{LookupAssessmentModeV1,LookupCandidateV1,LookupDecisionV1}from'./types';

export function lookupAccessDecisionV1(candidate:LookupCandidateV1|undefined,mode:LookupAssessmentModeV1):LookupDecisionV1{
  if(!candidate)return{allowed:false,evidenceEligible:false,supportEffect:'NONE'};
  if(mode==='FORMAL_ASSESSMENT')return{allowed:false,lockedReason:'FORMAL_ASSESSMENT',candidate,evidenceEligible:false,supportEffect:'NONE'};
  if(mode==='LEARNING_CHECK'&&candidate.wouldRevealTargetAnswer)return{allowed:false,lockedReason:'TARGET_ANSWER_LEAK',candidate,evidenceEligible:false,supportEffect:'NONE'};
  return{allowed:true,candidate,evidenceEligible:false,supportEffect:'LANGUAGE_ASSISTANCE'};
}
