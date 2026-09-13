import type { TranslationAnalyticObservationV1 } from './types';
export function translationAnalyticObservationV1(input:Omit<TranslationAnalyticObservationV1,'referenceMatchRequired'|'canClaimCapability'|'canAssignExamScore'>):TranslationAnalyticObservationV1{
  return Object.freeze({...input,reasonCodes:Object.freeze([...input.reasonCodes]),referenceMatchRequired:false,canClaimCapability:false,canAssignExamScore:false});
}
export const translationValidRealizationPolicyV1=Object.freeze({referenceAnswerIsUniqueTruth:false,meaningPreservingAlternativesAccepted:true,exactStringMatchRequired:false,examScoringOwner:'S/K',capabilityEvidenceOwner:'C/K'});
