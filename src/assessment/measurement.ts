import type { EvidenceCandidateV3 } from '../domain/evidence/EvidenceCandidateV3';
import type { TaskContract,TaskMeasurementProvenanceV1 } from '../domain/task/TaskContract';
import { validateFreshEvidenceOpportunityV1 } from '../domain/task/freshEvidence';
import { productionConditionsAllowIndependentV1 } from '../domain/task/productionConditions';
import type { MeasurementProofClassV1,MeasurementQualificationInputV1,MeasurementQualificationV1,MeasurementUncertaintyV1 } from './types';

const noProof=(reasons:string[],warnings:string[]=[],uncertainty:MeasurementUncertaintyV1='NONE'):MeasurementQualificationV1=>({eligible:false,proofClass:'NO_CAPABILITY_PROOF',independent:false,fresh:false,transfer:false,delayed:false,abstained:uncertainty==='MATERIAL',uncertainty,reasons:Object.freeze(reasons),warnings:Object.freeze(warnings)});
const parseTime=(value:string|undefined)=>value?Date.parse(value):Number.NaN;
const hasValidatedDelivery=(p:TaskMeasurementProvenanceV1|undefined,kind:'VALIDATED_FRESH'|'VALIDATED_CHANGED_CONTEXT'|'DELAYED_PROBE')=>Boolean(p&&p.opportunityKind===kind&&p.deliveryRef?.trim()&&p.validatorRefs.length&&p.taskContentIdentity.trim()&&p.sourceContentIdentity.trim()&&p.taskContentIdentity!==p.sourceContentIdentity);

function uncertaintyFor(candidate:EvidenceCandidateV3):{level:MeasurementUncertaintyV1;reasons:string[];warnings:string[]}{
  const reasons:string[]=[],warnings:string[]=[];
  if(candidate.confidence==='LOW')reasons.push('MEASUREMENT_CLASSIFICATION_CONFIDENCE_LOW');
  if(candidate.evidencePolarity==='UNKNOWN'||candidate.evidencePolarity==='MIXED')reasons.push(`MEASUREMENT_POLARITY_${candidate.evidencePolarity}`);
  if(candidate.competingExplanations.length)warnings.push('MEASUREMENT_HAS_COMPETING_EXPLANATIONS');
  return{level:reasons.length?'MATERIAL':warnings.length?'BOUNDED':'NONE',reasons,warnings};
}

function independentCandidate(candidate:EvidenceCandidateV3,task:TaskContract):{allowed:boolean;reasons:string[]}{
  const reasons:string[]=[];
  if(candidate.productionMode!=='INDEPENDENT')reasons.push(`PRODUCTION_MODE_${candidate.productionMode}_NOT_INDEPENDENT`);
  if(candidate.supportBeforeResponse!=='NONE')reasons.push(`SUPPORT_${candidate.supportBeforeResponse}_NOT_UNSUPPORTED`);
  const condition=productionConditionsAllowIndependentV1(candidate.productionConditions);reasons.push(...condition.reasons.map(x=>`PRODUCTION_CONDITION:${x}`));
  if(task.supportExposed.some(x=>x!=='NONE'))reasons.push(`TASK_SUPPORT_EXPOSED:${task.supportExposed.filter(x=>x!=='NONE').join(',')}`);
  return{allowed:reasons.length===0,reasons};
}

function localClass(candidate:EvidenceCandidateV3,task:TaskContract):MeasurementProofClassV1{
  if(candidate.productionMode==='INDEPENDENT'&&independentCandidate(candidate,task).allowed)return'LOCAL_INDEPENDENT';
  return'ASSISTED_PRACTICE';
}

export function qualifyMeasurementV1(input:MeasurementQualificationInputV1):MeasurementQualificationV1{
  const {candidate,task}=input;
  const warnings:string[]=[];
  if(candidate.candidateKind!=='CAPABILITY')return noProof(['NON_CAPABILITY_CANDIDATE']);
  if(candidate.evidenceEligibility==='INELIGIBLE')return noProof(['CANDIDATE_EXPLICITLY_INELIGIBLE']);
  if(!task)return noProof(['TASK_CONTRACT_REQUIRED']);
  const uncertainty=uncertaintyFor(candidate);warnings.push(...uncertainty.warnings);
  if(uncertainty.level==='MATERIAL')return noProof(uncertainty.reasons,warnings,'MATERIAL');
  const provenance=task.measurementProvenance;
  const claim=candidate.targetRef&&candidate.capabilityFacet?{targetRef:candidate.targetRef,facet:candidate.capabilityFacet,senseId:candidate.senseId}:undefined;

  if(candidate.contextNovelty==='CHANGED_CONTEXT'&&task.purpose!=='TRANSFER')return noProof(['CHANGED_CONTEXT_REQUIRES_TRANSFER_TASK_PURPOSE'],warnings,uncertainty.level);
  if(candidate.contextNovelty==='DELAYED_CONTEXT'&&task.purpose!=='RETENTION')return noProof(['DELAYED_CONTEXT_REQUIRES_RETENTION_TASK_PURPOSE'],warnings,uncertainty.level);

  if(task.purpose==='DIAGNOSTIC'){
    const independent=independentCandidate(candidate,task);if(!independent.allowed)return noProof(['FRESH_ASSESSMENT_REQUIRES_UNSUPPORTED_PRODUCTION',...independent.reasons],warnings,uncertainty.level);
    if(task.contextNovelty!=='SAME_CONTEXT'||candidate.contextNovelty!=='SAME_CONTEXT')return noProof(['FRESH_ASSESSMENT_REQUIRES_SAME_CONTEXT_NEW_CONTENT'],warnings,uncertainty.level);
    if(!hasValidatedDelivery(provenance,'VALIDATED_FRESH'))return noProof(['FRESH_ASSESSMENT_REQUIRES_VALIDATED_DELIVERY_PROVENANCE'],warnings,uncertainty.level);
    if(!claim)return noProof(['FRESH_ASSESSMENT_REQUIRES_EXACT_TARGET_IDENTITY'],warnings,uncertainty.level);
    const opportunity=validateFreshEvidenceOpportunityV1(provenance?.freshEvidenceOpportunity,claim);if(!opportunity.valid)return noProof(['FRESH_OPPORTUNITY_INVALID',...opportunity.reasons],warnings,uncertainty.level);
    if(!['F2_STRUCTURAL_PARALLEL','F4_AUTHENTIC_REDEPLOYMENT'].includes(provenance!.freshEvidenceOpportunity!.relationship))return noProof([`${provenance!.freshEvidenceOpportunity!.relationship}_CANNOT_PROVE_FRESH_INDEPENDENCE`],warnings,uncertainty.level);
    if(provenance!.taskId!==task.id)return noProof(['MEASUREMENT_DELIVERY_TASK_ID_MISMATCH'],warnings,uncertainty.level);
    return{eligible:true,proofClass:'FRESH_INDEPENDENT',independent:true,fresh:true,transfer:false,delayed:false,abstained:false,uncertainty:uncertainty.level,reasons:Object.freeze([]),warnings:Object.freeze(warnings)};
  }

  if(task.purpose==='TRANSFER'){
    const independent=independentCandidate(candidate,task);if(!independent.allowed)return noProof(['TRANSFER_REQUIRES_UNSUPPORTED_PRODUCTION',...independent.reasons],warnings,uncertainty.level);
    if(task.contextNovelty!=='CHANGED_CONTEXT'||candidate.contextNovelty!=='CHANGED_CONTEXT')return noProof(['TRANSFER_REQUIRES_CHANGED_CONTEXT'],warnings,uncertainty.level);
    if(!hasValidatedDelivery(provenance,'VALIDATED_CHANGED_CONTEXT'))return noProof(['TRANSFER_REQUIRES_VALIDATED_CHANGED_CONTEXT_DELIVERY'],warnings,uncertainty.level);
    if(!claim)return noProof(['TRANSFER_REQUIRES_EXACT_TARGET_IDENTITY'],warnings,uncertainty.level);
    const opportunity=validateFreshEvidenceOpportunityV1(provenance?.freshEvidenceOpportunity,claim);if(!opportunity.valid)return noProof(['TRANSFER_OPPORTUNITY_INVALID',...opportunity.reasons],warnings,uncertainty.level);
    if(!['F3_CONTEXT_DIVERSE_EQUIVALENT','F4_AUTHENTIC_REDEPLOYMENT'].includes(provenance!.freshEvidenceOpportunity!.relationship))return noProof([`${provenance!.freshEvidenceOpportunity!.relationship}_CANNOT_PROVE_TRANSFER`],warnings,uncertainty.level);
    if(provenance!.taskId!==task.id)return noProof(['MEASUREMENT_DELIVERY_TASK_ID_MISMATCH'],warnings,uncertainty.level);
    if(!provenance!.sourceContextKey.trim()||!provenance!.taskContextKey.trim()||provenance!.sourceContextKey===provenance!.taskContextKey)return noProof(['TRANSFER_CONTEXT_IDENTITY_NOT_CHANGED'],warnings,uncertainty.level);
    return{eligible:true,proofClass:'CHANGED_CONTEXT_TRANSFER',independent:true,fresh:true,transfer:true,delayed:false,abstained:false,uncertainty:uncertainty.level,reasons:Object.freeze([]),warnings:Object.freeze(warnings)};
  }

  if(task.purpose==='RETENTION'){
    const independent=independentCandidate(candidate,task);if(!independent.allowed)return noProof(['RETENTION_REQUIRES_UNSUPPORTED_PRODUCTION',...independent.reasons],warnings,uncertainty.level);
    if(task.contextNovelty!=='DELAYED_CONTEXT'||candidate.contextNovelty!=='DELAYED_CONTEXT')return noProof(['RETENTION_REQUIRES_DELAYED_CONTEXT'],warnings,uncertainty.level);
    if(!hasValidatedDelivery(provenance,'DELAYED_PROBE'))return noProof(['RETENTION_REQUIRES_VALIDATED_DELAYED_PROBE'],warnings,uncertainty.level);
    if(!claim)return noProof(['RETENTION_REQUIRES_EXACT_TARGET_IDENTITY'],warnings,uncertainty.level);
    const opportunity=validateFreshEvidenceOpportunityV1(provenance?.freshEvidenceOpportunity,claim);if(!opportunity.valid)return noProof(['RETENTION_OPPORTUNITY_INVALID',...opportunity.reasons],warnings,uncertainty.level);
    if(provenance!.freshEvidenceOpportunity!.relationship!=='F5_DELAYED_CHANGED_CONTEXT')return noProof(['RETENTION_REQUIRES_F5_DELAYED_CHANGED_CONTEXT'],warnings,uncertainty.level);
    if(provenance!.taskId!==task.id)return noProof(['MEASUREMENT_DELIVERY_TASK_ID_MISMATCH'],warnings,uncertainty.level);
    if(!provenance!.priorProofOccurredAt||!provenance!.minimumDelayMs||!provenance!.attemptSessionId||!provenance!.priorProofSessionId)return noProof(['DELAYED_PROBE_TEMPORAL_PROVENANCE_INCOMPLETE'],warnings,uncertainty.level);
    if(provenance!.attemptSessionId===provenance!.priorProofSessionId)return noProof(['DELAYED_PROBE_REQUIRES_DIFFERENT_SESSION'],warnings,uncertainty.level);
    const now=parseTime(input.occurredAt),prior=parseTime(provenance!.priorProofOccurredAt);
    if(!Number.isFinite(now)||!Number.isFinite(prior)||now-prior<provenance!.minimumDelayMs)return noProof(['DELAYED_PROBE_MINIMUM_DELAY_NOT_MET'],warnings,uncertainty.level);
    return{eligible:true,proofClass:'DELAYED_RETENTION',independent:true,fresh:true,transfer:false,delayed:true,abstained:false,uncertainty:uncertainty.level,reasons:Object.freeze([]),warnings:Object.freeze(warnings)};
  }

  if(provenance?.freshEvidenceOpportunity){if(!claim)return noProof(['AUTHENTIC_OPPORTUNITY_REQUIRES_EXACT_TARGET_IDENTITY'],warnings,uncertainty.level);const opportunity=validateFreshEvidenceOpportunityV1(provenance.freshEvidenceOpportunity,claim);if(!opportunity.valid)return noProof(['AUTHENTIC_OPPORTUNITY_INVALID',...opportunity.reasons],warnings,uncertainty.level);if(provenance.freshEvidenceOpportunity.relationship!=='F4_AUTHENTIC_REDEPLOYMENT')return noProof(['SOURCE_WORK_ONLY_ACCEPTS_F4_AUTHENTIC_OPPORTUNITY'],warnings,uncertainty.level)}
  const proofClass=localClass(candidate,task),independent=proofClass==='LOCAL_INDEPENDENT';
  return{eligible:true,proofClass,independent,fresh:false,transfer:false,delayed:false,abstained:false,uncertainty:uncertainty.level,reasons:Object.freeze([]),warnings:Object.freeze(warnings)};
}
