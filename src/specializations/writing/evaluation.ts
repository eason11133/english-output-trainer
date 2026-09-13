import type { WritingAnalyticObservationV1 } from './types';

export function createWritingAnalyticObservationV1(input:Omit<WritingAnalyticObservationV1,'capabilityClaimAllowed'|'examScoreAllowed'>):WritingAnalyticObservationV1{
  if(!input.observationId.trim())throw new Error('writing observation id required');
  if(!input.statement.trim())throw new Error('writing observation statement required');
  return Object.freeze({...input,rubricRefs:Object.freeze([...new Set(input.rubricRefs)]),targetRefs:Object.freeze([...new Set(input.targetRefs)]),capabilityClaimAllowed:false,examScoreAllowed:false});
}
