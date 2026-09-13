import type { LessonPlanV1 } from '../architecture/contracts';
import { coreEnglishDomainPortV2 } from '../domain/english';
import type { CapabilityFacet } from '../domain/english/EnglishDomain';
import { queryContentCoverageV1 } from './coverage';
import { writingFreshTaskPackV1 } from './contentPacks';

export type SharedDeliveryPurposeV1='ACTIVE_PRACTICE'|'FRESH_CHECK'|'CHANGED_CONTEXT_TRANSFER'|'DELAYED_RETENTION';
export type LoadBandV1='LOW'|'MEDIUM'|'HIGH';
export type SupportBandV1='NONE'|'LIGHT'|'STRONG';
export interface DeliveryLoadProfileV1{
  length:LoadBandV1;reasoning:LoadBandV1;ideaGeneration:LoadBandV1;contentSupport:SupportBandV1;clauses:number;
  planningSupport:SupportBandV1;languageSupport:SupportBandV1;selectionSupport:SupportBandV1;functionCue:SupportBandV1;recentModelPrime:SupportBandV1;
}
export type DeliveryLoadDimensionV1=keyof DeliveryLoadProfileV1;
export interface DeliveryLoadDeltaV1{dimension:DeliveryLoadDimensionV1;from:LoadBandV1|SupportBandV1|number;to:LoadBandV1|SupportBandV1|number;reason:string;targetRequirementPreserved:true}
export interface SharedDeliveryRequestV1{
  requestId:string;lessonPlanId:string;targetRef:string;facet:CapabilityFacet;arena:'WRITING'|'TRANSLATION';purpose:SharedDeliveryPurposeV1;
  semanticRequirements:readonly string[];contentRequirement:string;context:{sourceIdentity:string;requiredNovelty:'SAME_CONTEXT'|'NEW_CONTENT'|'CHANGED_CONTEXT'|'DELAYED_CONTEXT'|'AUTHENTIC_SOURCE'};
  authenticLoad:DeliveryLoadProfileV1;requestedLoad:DeliveryLoadProfileV1;loadDelta:readonly DeliveryLoadDeltaV1[];
  answerExposure:'NONE';assistanceCeiling:{language:SupportBandV1;selection:SupportBandV1;functionCue:SupportBandV1;planning:SupportBandV1;recentModelPrime:SupportBandV1};
  provenanceRequirements:readonly string[];measurementIntent:'PRACTICE_ACCESS_ONLY'|'FRESH_INDEPENDENT'|'TRANSFER'|'RETENTION';forbiddenContentRefs:readonly string[];
}
export interface ValidatedSharedDeliveryV1{
  deliveryId:string;requestId:string;targetRef:string;facet:CapabilityFacet;arena:SharedDeliveryRequestV1['arena'];purpose:SharedDeliveryPurposeV1;
  content:string;contentRef:string;contextIdentity:string;contextNovelty:SharedDeliveryRequestV1['context']['requiredNovelty'];semanticRequirements:readonly string[];
  load:DeliveryLoadProfileV1;loadDelta:readonly DeliveryLoadDeltaV1[];answerExposure:'NONE';measurementIntent:SharedDeliveryRequestV1['measurementIntent'];
  provenanceRefs:readonly string[];validatorRefs:readonly string[];deliveryEligibility:'VALIDATED';deliveredAt:string;
}
export interface ActivePracticeTrajectoryV1{trajectoryId:string;targetRef:string;facet:CapabilityFacet;authenticLoad:DeliveryLoadProfileV1;steps:readonly ValidatedSharedDeliveryV1[];currentStep:number;status:'ACTIVE'|'REPLAN_REQUIRED'|'READY_FOR_AUTHENTIC_REDEPLOY'|'COMPLETE';lineage:readonly {fromDeliveryId?:string;toDeliveryId:string;loadDelta:readonly DeliveryLoadDeltaV1[];reason:string}[]}

const rank={NONE:0,LOW:1,LIGHT:1,MEDIUM:2,HIGH:3,STRONG:3} as const;
const lower=(value:LoadBandV1):LoadBandV1=>value==='HIGH'?'MEDIUM':'LOW';
const reduceProfile=(a:DeliveryLoadProfileV1):DeliveryLoadProfileV1=>Object.freeze({...a,length:lower(a.length),reasoning:lower(a.reasoning),ideaGeneration:'LOW',clauses:1,contentSupport:'STRONG',planningSupport:'NONE',languageSupport:'NONE',selectionSupport:'NONE',functionCue:'NONE',recentModelPrime:'NONE'});
const delta=(from:DeliveryLoadProfileV1,to:DeliveryLoadProfileV1,reason:string)=>Object.freeze((Object.keys(from) as DeliveryLoadDimensionV1[]).filter(k=>from[k]!==to[k]).map(d=>Object.freeze({dimension:d,from:from[d],to:to[d],reason,targetRequirementPreserved:true as const})));
const midpoint=(reduced:DeliveryLoadProfileV1,authentic:DeliveryLoadProfileV1):DeliveryLoadProfileV1=>{
  const next={...reduced};
  for(const key of ['length','reasoning','ideaGeneration'] as const)if(rank[next[key]]<rank[authentic[key]]){next[key]=authentic[key];break}
  if(next.clauses<authentic.clauses)next.clauses=Math.min(authentic.clauses,next.clauses+1);
  if(rank[next.contentSupport]>rank[authentic.contentSupport])next.contentSupport=authentic.contentSupport;
  return Object.freeze(next);
};
export function validateSharedDeliveryRequestV1(request:SharedDeliveryRequestV1):readonly string[]{
  const errors:string[]=[],canonical=coreEnglishDomainPortV2.resolveId(request.targetRef);
  if(!canonical||canonical!==request.targetRef)errors.push('TARGET_NOT_CANONICAL');
  if(canonical&&!coreEnglishDomainPortV2.supportsFacet(canonical,request.facet))errors.push('FACET_NOT_AUTHORIZED');
  if(!request.semanticRequirements.length)errors.push('SEMANTIC_REQUIREMENTS_MISSING');
  if(request.answerExposure!=='NONE')errors.push('ANSWER_EXPOSURE_FORBIDDEN');
  if(request.purpose==='ACTIVE_PRACTICE'&&request.measurementIntent!=='PRACTICE_ACCESS_ONLY')errors.push('ACTIVE_PRACTICE_MEASUREMENT_OVERCLAIM');
  if(request.purpose==='DELAYED_RETENTION'&&request.measurementIntent!=='RETENTION')errors.push('RETENTION_MEASUREMENT_INTENT_REQUIRED');
  if(!request.loadDelta.every(x=>x.targetRequirementPreserved))errors.push('TARGET_REQUIREMENT_DROPPED');
  return Object.freeze(errors);
}
function validated(request:SharedDeliveryRequestV1,input:{content:string;contentRef:string;contextIdentity:string;provenanceRefs:readonly string[];deliveredAt:string}):ValidatedSharedDeliveryV1|undefined{
  if(validateSharedDeliveryRequestV1(request).length)return undefined;
  if(input.contentRef.startsWith('corpus-bundle:'))return undefined;
  return Object.freeze({deliveryId:`delivery:${request.requestId}:${request.loadDelta.map(x=>`${x.dimension}-${x.to}`).join('.')||'authentic'}`,requestId:request.requestId,targetRef:request.targetRef,facet:request.facet,arena:request.arena,purpose:request.purpose,content:input.content,contentRef:input.contentRef,contextIdentity:input.contextIdentity,contextNovelty:request.context.requiredNovelty,semanticRequirements:Object.freeze([...request.semanticRequirements]),load:Object.freeze({...request.requestedLoad}),loadDelta:Object.freeze([...request.loadDelta]),answerExposure:'NONE',measurementIntent:request.measurementIntent,provenanceRefs:Object.freeze([...input.provenanceRefs]),validatorRefs:Object.freeze(['G:shared-delivery-contract-v1','G:deterministic-contract-validator-v1']),deliveryEligibility:'VALIDATED',deliveredAt:input.deliveredAt});
}
export function deliverSharedWritingRequestV1(input:{request:SharedDeliveryRequestV1;sourcePrompt:string;occurredAt:string}):ValidatedSharedDeliveryV1|undefined{
  const {request}=input;if(request.arena!=='WRITING')return undefined;
  if(request.context.requiredNovelty==='AUTHENTIC_SOURCE')return validated(request,{content:input.sourcePrompt,contentRef:`authentic:${request.context.sourceIdentity}`,contextIdentity:request.context.sourceIdentity,provenanceRefs:request.provenanceRequirements,deliveredAt:input.occurredAt});
  const coverage=queryContentCoverageV1({targetRef:request.targetRef,facet:request.facet,arena:'WRITING',useCase:request.purpose});
  if(coverage.status!=='VALIDATED_DELIVERY_AVAILABLE')return undefined;
  const refs=new Set(coverage.entries.filter(x=>x.productionEligibility==='DETERMINISTIC_VALIDATION_REQUIRED').map(x=>x.contentRef));
  const template=writingFreshTaskPackV1.find(x=>refs.has(`${x.provenanceRef}#${x.id}`)&&!request.forbiddenContentRefs.includes(`${x.provenanceRef}#${x.id}`));
  if(!template)return undefined;
  return validated(request,{content:template.promptText,contentRef:`${template.provenanceRef}#${template.id}`,contextIdentity:template.contextKey,provenanceRefs:[template.provenanceRef],deliveredAt:input.occurredAt});
}
export function createActivePracticeTrajectoryV1(input:{runtimeId:string;lessonPlan:LessonPlanV1;arena:'WRITING';sourceIdentity:string;sourcePrompt:string;semanticRequirements:readonly string[];authenticLoad:DeliveryLoadProfileV1;provenanceRefs:readonly string[];occurredAt:string}):ActivePracticeTrajectoryV1|undefined{
  const facet=input.lessonPlan.facet as CapabilityFacet,reduced=reduceProfile(input.authenticLoad),readd=midpoint(reduced,input.authenticLoad),base={lessonPlanId:input.lessonPlan.id,targetRef:input.lessonPlan.targetRef,facet,arena:input.arena,semanticRequirements:input.semanticRequirements,contentRequirement:input.lessonPlan.objective,answerExposure:'NONE' as const,assistanceCeiling:{language:'NONE',selection:'NONE',functionCue:'NONE',planning:'NONE',recentModelPrime:'NONE'} as const,provenanceRequirements:input.provenanceRefs,forbiddenContentRefs:[] as readonly string[]};
  const make=(suffix:string,purpose:'ACTIVE_PRACTICE'|'FRESH_CHECK',load:DeliveryLoadProfileV1,from:DeliveryLoadProfileV1,novelty:SharedDeliveryRequestV1['context']['requiredNovelty'])=>deliverSharedWritingRequestV1({request:{...base,requestId:`${input.runtimeId}:${suffix}`,purpose,context:{sourceIdentity:input.sourceIdentity,requiredNovelty:novelty},authenticLoad:input.authenticLoad,requestedLoad:load,loadDelta:delta(from,load,suffix),measurementIntent:purpose==='ACTIVE_PRACTICE'?'PRACTICE_ACCESS_ONLY':'FRESH_INDEPENDENT'},sourcePrompt:input.sourcePrompt,occurredAt:input.occurredAt});
  const first=make('reduced','ACTIVE_PRACTICE',reduced,input.authenticLoad,'NEW_CONTENT');if(!first)return undefined;
  const second=make('readd','ACTIVE_PRACTICE',readd,reduced,'NEW_CONTENT');if(!second)return undefined;
  const authentic=make('authentic-redeploy','FRESH_CHECK',input.authenticLoad,readd,'AUTHENTIC_SOURCE');if(!authentic)return undefined;
  const steps=Object.freeze([first,second,authentic]);
  return Object.freeze({trajectoryId:`active-practice:${input.runtimeId}:${input.lessonPlan.targetRef}`,targetRef:input.lessonPlan.targetRef,facet,authenticLoad:input.authenticLoad,steps,currentStep:0,status:'ACTIVE',lineage:Object.freeze([{toDeliveryId:first.deliveryId,loadDelta:first.loadDelta,reason:'HIGH_LOAD_FAILURE_WITH_PRIOR_LOCAL_CONTROL'}])});
}
export function advanceActivePracticeTrajectoryV1(trajectory:ActivePracticeTrajectoryV1,outcome:'SUCCESS'|'FAILURE'|'PARTIAL'):ActivePracticeTrajectoryV1{
  if(trajectory.status==='COMPLETE'||trajectory.status==='REPLAN_REQUIRED')return trajectory;
  if(outcome!=='SUCCESS')return Object.freeze({...trajectory,status:'REPLAN_REQUIRED'});
  const next=trajectory.currentStep+1;if(next>=trajectory.steps.length)return Object.freeze({...trajectory,status:'COMPLETE'});
  const delivery=trajectory.steps[next],prior=trajectory.steps[trajectory.currentStep];
  return Object.freeze({...trajectory,currentStep:next,status:next===trajectory.steps.length-1?'READY_FOR_AUTHENTIC_REDEPLOY':'ACTIVE',lineage:Object.freeze([...trajectory.lineage,{fromDeliveryId:prior.deliveryId,toDeliveryId:delivery.deliveryId,loadDelta:delivery.loadDelta,reason:next===trajectory.steps.length-1?'RESTORE_AUTHENTIC_DEMAND':'RE_ADD_ONE_NON_TARGET_DEMAND'}])});
}
export function activePracticeEvidenceCeilingV1(trajectory:ActivePracticeTrajectoryV1){const d=trajectory.steps[trajectory.currentStep];return Object.freeze({deliveryId:d.deliveryId,mayCommitIndependent:d.contextNovelty==='AUTHENTIC_SOURCE',mayCommitTransfer:false,mayCommitRetention:false,evidenceCeiling:d.contextNovelty==='AUTHENTIC_SOURCE'?'QUALIFY_CK':'PRACTICE_ACCESS_ONLY'});}
