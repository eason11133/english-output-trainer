import { coreEnglishDomainPortV2 } from '../domain/english';
import type { CapabilityFacet } from '../domain/english/EnglishDomain';
import type { BlockSupportV4 } from '../domain/v4/LearningBlockV4';
import { blockRegistryV4 } from '../application/v4/blockRegistryV4';
import { canonicalPckMechanismsV1, pckMechanismByIdV1 } from './pckCatalog';
import type { AdaptiveAssistanceLevelV1, AdaptiveTeacherEpisodeDecisionV1, AssistanceStrengthV1, ContingentSupportPolicyV1, DeploymentStageV1, ElicitationConditionV1, FeedbackTimingV1, MechanismSuitabilityV1, MultidimensionalAssistanceV1, ProductionBottleneckHypothesisV1, ProductionBottleneckKindV1, TaskGenerationNeedFromFV1, TaskLoadAttributionV1, TaskLoadDimensionV1, TeachingOpportunityConditionsV1, TeachingOptionsV1, TeachingRequestV1 } from './types';
import { deriveLocalTreatmentSignalV1 } from './personalization';

const unique=<T,>(values:readonly T[])=>[...new Set(values)];
const statusRank:Record<ProductionBottleneckHypothesisV1['status'],number>={SUPPORTED:4,POSSIBLE:3,UNRESOLVED:2,WEAKENED:1};
const supportStrength=(support:TeachingRequestV1['current']['support']):AssistanceStrengthV1=>support==='NONE'?'NONE':support==='LIGHT'||support==='CUED'?'LIGHT':'STRONG';

const supportLadder:readonly BlockSupportV4[]=Object.freeze(['MODELED','EXPLICIT','GUIDED','CUED','LIGHT','NONE'] as const);
const supportIndex=(support:BlockSupportV4)=>Math.max(0,supportLadder.indexOf(support));
export const fadeSupportLevelV1=(support:BlockSupportV4):BlockSupportV4=>supportLadder[Math.min(supportIndex(support)+1,supportLadder.length-1)];
export const increaseSupportLevelV1=(support:BlockSupportV4):BlockSupportV4=>supportLadder[Math.max(supportIndex(support)-1,0)];

function startingSupportV1(request:TeachingRequestV1):BlockSupportV4{
  if(request.learnerState==='INDEPENDENT_LOCAL_CONTROL'||request.learnerState==='TRANSFER_SUPPORTED'||request.learnerState==='RETENTION_SUPPORTED')return'LIGHT';
  if(request.supportDependence==='HIGH')return'EXPLICIT';
  if(request.supportDependence==='MEDIUM')return'GUIDED';
  if(request.supportDependence==='LOW'||request.supportDependence==='NONE_OBSERVED')return'LIGHT';
  if(request.learnerState==='UNKNOWN'||request.learnerState===undefined)return'EXPLICIT';
  return request.current.support==='NONE'?'GUIDED':request.current.support;
}

export const assistanceLevelForSupportV1=(support:BlockSupportV4):AdaptiveAssistanceLevelV1=>support==='NONE'?'H0_NO_HELP':support==='LIGHT'?'H1_ORIENTATION':support==='CUED'?'H2_BROAD_ACTION_PROMPT':support==='GUIDED'?'H3_DIRECTED_HINT':support==='EXPLICIT'?'H4_PARTIAL_COMPLETION_OR_CONTRAST':'H5_EXPLICIT_MODEL_OR_BOTTOM_OUT';
const feedbackTimingV1=(request:TeachingRequestV1,action:AdaptiveTeacherEpisodeDecisionV1['action']):FeedbackTimingV1=>action==='DEFER_TARGET'?'DEFER_LOW_PRIORITY':action==='RETURN_TO_SOURCE'?'LATER_REENCOUNTER':request.current.outcome==='PARTIAL'?'IMMEDIATE_BOUNDED':request.learnerState==='INDEPENDENT_LOCAL_CONTROL'?'RETRIEVE_THEN_IMMEDIATE':'AFTER_OUTPUT_CHUNK';
const loadDimensionsV1=(request:TeachingRequestV1)=>Object.freeze((['LEXICAL','SYNTACTIC','PROPOSITION_REASONING','CONTEXT_DIVERSITY','RESPONSE_GENERATION','DISTRACTOR_COMPETITION','EVIDENCE_DISTANCE','TIME_PRESSURE','SUPPORT_REMOVAL'] as TaskLoadDimensionV1[]).map(dimension=>Object.freeze({dimension,level:dimension==='RESPONSE_GENERATION'||dimension==='SUPPORT_REMOVAL'?request.conditions.taskLoad:'UNKNOWN' as const})));
export function deriveAdaptiveTeacherEpisodeDecisionV1(request:TeachingRequestV1):AdaptiveTeacherEpisodeDecisionV1{
  const policy=deriveContingentSupportPolicyV1(request),recentFailures=request.recentTreatment.filter(item=>item.outcome==='FAILURE'||item.responseSignal==='NO_PROGRESS'||item.responseSignal==='CONFUSED'),sameMechanismRepeated=recentFailures.length>1&&new Set(recentFailures.slice(-2).map(item=>item.mechanismId)).size===1,assistedOnly=request.recentTreatment.filter(item=>item.outcome==='SUCCESS'&&item.support!=='NONE').length>1;
  const controlled=['INDEPENDENT_LOCAL_CONTROL','TRANSFER_SUPPORTED','RETENTION_SUPPORTED'].includes(request.learnerState??'');
  const loadConfound=request.current.outcome==='FAILURE'&&request.conditions.taskLoad==='HIGH'&&controlled;
  let action:AdaptiveTeacherEpisodeDecisionV1['action']='CONTINUE_CURRENT_PIECE',support=policy.recommendedSupport,attribution:TaskLoadAttributionV1='UNRESOLVED';const reasons:string[]=[];
  if(request.learnerRequestedIndependentAttempt){action='FADE_SUPPORT';support=fadeSupportLevelV1(request.current.support);reasons.push('LEARNER_REQUESTED_INDEPENDENT_ATTEMPT')}
  else if(request.current.outcome==='SUCCESS'&&request.current.support==='NONE'){action=controlled?'STOP_NO_FURTHER_INTERVENTION':'RETURN_TO_SOURCE';support='NONE';attribution='TARGET_KNOWLEDGE';reasons.push('LOCAL_INDEPENDENCE_REDUCES_INTERVENTION')}
  else if(request.current.outcome==='SUCCESS'||assistedOnly){action='FADE_SUPPORT';support=fadeSupportLevelV1(request.current.support);reasons.push('ASSISTED_SUCCESS_REQUIRES_FADE')}
  else if(loadConfound){action='REDUCE_TASK_LOAD';support=request.current.support;attribution='TASK_LOAD_CONFOUND';reasons.push('HARDER_TASK_IS_NOT_LEARNER_REGRESSION')}
  else if(sameMechanismRepeated&&request.prerequisiteWeakness){action='CHECK_PREREQUISITE';reasons.push('REPEATED_NO_PROGRESS_WITH_PREREQUISITE_RISK')}
  else if(sameMechanismRepeated){action='REDUCE_TARGET_GRANULARITY';reasons.push('REPEATED_NO_PROGRESS_REQUIRES_SMALLER_OPERATION')}
  else if(policy.requiresRepresentationChange){action='RECOMPOSE_DIFFERENT_MECHANISM';reasons.push('FAILED_REPRESENTATION_MUST_CHANGE')}
  else if(request.current.outcome==='FAILURE'){attribution='TARGET_KNOWLEDGE';reasons.push('BOUNDED_SUPPORT_ESCALATION')}
  else reasons.push('CONTINUE_CURRENT_BOUNDED_PIECE');
  return Object.freeze({action,assistanceLevel:assistanceLevelForSupportV1(support),support,feedbackTiming:feedbackTimingV1(request,action),taskLoadAttribution:attribution,loadDimensions:loadDimensionsV1(request),changeOneMajorLoadDimension:action==='REDUCE_TASK_LOAD',learnerActionRequired:!['DEFER_TARGET','STOP_NO_FURTHER_INTERVENTION','RETURN_TO_SOURCE'].includes(action),reasonCodes:Object.freeze(reasons),canWriteMastery:false,canQualifyEvidence:false});
}

export function deriveContingentSupportPolicyV1(request:TeachingRequestV1):ContingentSupportPolicyV1{
  const current=request.current.support,outcome=request.current.outcome,reasons:string[]=[];
  let recommended:BlockSupportV4=current,transition:ContingentSupportPolicyV1['transition']='HOLD',requiresRepresentationChange=false,nextEvidence:ContingentSupportPolicyV1['nextEvidenceCeiling']='ASSISTED';
  let nextElicitation=request.conditions.elicitation;
  if(outcome==='NOT_EVALUATED'||outcome==='ABANDONED'){
    if(request.learnerRequestedIndependentAttempt)return Object.freeze({recommendedSupport:fadeSupportLevelV1(current),transition:'FADE',reasonCodes:Object.freeze(['LEARNER_REQUESTED_INDEPENDENT_ATTEMPT','SUPPORT_REDUCED_WITHOUT_MASTERY_CLAIM']),requiresRepresentationChange:false,nextElicitation,nextEvidenceCeiling:'ASSISTED'});
    return Object.freeze({recommendedSupport:'NONE',transition:'NONE',reasonCodes:Object.freeze([outcome]),requiresRepresentationChange:false,nextElicitation,nextEvidenceCeiling:'NONE'});
  }
  if(outcome==='HELP_WITHOUT_ATTEMPT'){
    recommended=current==='NONE'?startingSupportV1(request):increaseSupportLevelV1(current);transition='INCREASE';reasons.push('HELP_BEFORE_FAILURE','START_WITH_MINIMUM_PLAUSIBLE_SUPPORT');nextEvidence='EXPOSURE_ONLY';
  }else if(outcome==='EXPOSURE_ONLY'){
    recommended=current==='MODELED'||current==='EXPLICIT'?'GUIDED':current==='NONE'?startingSupportV1(request):fadeSupportLevelV1(current);transition='FADE';reasons.push('TEACHING_EXPOSURE_REQUIRES_LEARNER_ACTION','FADE_FROM_EXPLANATION_TO_PRODUCTION');nextEvidence='ASSISTED';
  }else if(outcome==='SUCCESS'&&current==='NONE'){
    recommended='NONE';transition='NONE';reasons.push('UNSUPPORTED_SUCCESS','NO_MORE_SUPPORT');nextEvidence='FRESH_INDEPENDENT';
  }else if(outcome==='SUCCESS'){
    recommended=fadeSupportLevelV1(current);transition=recommended==='NONE'?'FRESH_CHECK':'FADE';reasons.push('SUPPORTED_SUCCESS','SUPPORT_MUST_FADE');nextEvidence=recommended==='NONE'?'FRESH_INDEPENDENT':'ASSISTED';
    if(recommended==='NONE')nextElicitation=nextElicitationAfterSuccessV1(request.conditions.elicitation);
  }else if(outcome==='PARTIAL'){
    recommended=current==='NONE'?'LIGHT':current;transition=current==='NONE'?'INCREASE':'HOLD';reasons.push('PARTIAL_PROGRESS','LOCAL_REPAIR_WITHOUT_FULL_RESET');nextEvidence='ASSISTED';
  }else if(outcome==='FAILURE'){
    const latest=request.recentTreatment.at(-1);const sameMechanismStalled=!!latest&&(latest.outcome==='FAILURE'||latest.responseSignal==='NO_PROGRESS'||latest.responseSignal==='CONFUSED');
    if(sameMechanismStalled){requiresRepresentationChange=true;recommended=startingSupportV1(request);transition='RESET_FOR_NEW_REPRESENTATION';reasons.push('NO_PROGRESS_REQUIRES_REPRESENTATION_CHANGE');}
    else {recommended=current==='MODELED'?current:increaseSupportLevelV1(current);transition='INCREASE';reasons.push('FAILURE_INCREASES_SUPPORT_ONE_STEP');}
    nextEvidence='ASSISTED';
  }
  return Object.freeze({recommendedSupport:recommended,transition,reasonCodes:Object.freeze(reasons),requiresRepresentationChange,nextElicitation,nextEvidenceCeiling:nextEvidence});
}

export function validateContingentSupportChoiceV1(request:TeachingRequestV1,input:{action:string;support:BlockSupportV4;mechanismId?:string}):readonly string[]{
  const errors:string[]=[],policy=deriveContingentSupportPolicyV1(request);
  if(input.action==='CHECK'&&input.support!=='NONE')errors.push('FRESH_CHECK_REQUIRES_NONE_SUPPORT');
  if(request.current.outcome==='SUCCESS'&&request.current.support!=='NONE'&&['TEACH','REPAIR'].includes(input.action))errors.push('SUPPORTED_SUCCESS_MUST_FADE_NOT_RETEACH');
  if(request.current.outcome==='SUCCESS'&&request.current.support!=='NONE'&&['PRACTICE','CHECK'].includes(input.action)&&supportIndex(input.support)<supportIndex(request.current.support))errors.push('SUPPORTED_SUCCESS_CANNOT_INCREASE_SUPPORT');
  if(request.current.outcome==='SUCCESS'&&request.current.support==='NONE'&&!['NONE','WAIT','RETURN_TO_TASK','STOP','EXIT'].includes(input.action))errors.push('UNSUPPORTED_SUCCESS_FORBIDS_INTERVENTION');
  if(policy.requiresRepresentationChange&&input.action==='TEACH'&&input.mechanismId&&request.recentTreatment.some(item=>item.mechanismId===input.mechanismId&&(item.outcome==='FAILURE'||item.responseSignal==='NO_PROGRESS'||item.responseSignal==='CONFUSED')))errors.push('FAILED_REPRESENTATION_CANNOT_REPEAT_UNCHANGED');
  if(request.current.outcome==='HELP_WITHOUT_ATTEMPT'&&input.action==='CHECK')errors.push('HELP_BEFORE_ATTEMPT_CANNOT_BECOME_ASSESSMENT');
  return Object.freeze(unique(errors));
}

export function defaultTeachingOpportunityConditionsV1(input:{support:TeachingRequestV1['current']['support'];context?:TeachingOpportunityConditionsV1['context'];elicitation?:ElicitationConditionV1;taskLoad?:TeachingOpportunityConditionsV1['taskLoad'];language?:AssistanceStrengthV1;selection?:AssistanceStrengthV1;functionCue?:AssistanceStrengthV1;planning?:AssistanceStrengthV1;taskLoadAssistance?:AssistanceStrengthV1;recentModelPrime?:AssistanceStrengthV1}):TeachingOpportunityConditionsV1{
  return Object.freeze({
    elicitation:input.elicitation??'UNKNOWN',
    context:input.context??'UNKNOWN',
    taskLoad:input.taskLoad??'UNKNOWN',
    assistance:Object.freeze({
      language:input.language??supportStrength(input.support),
      selection:input.selection??'UNKNOWN',
      functionCue:input.functionCue??'UNKNOWN',
      planning:input.planning??'UNKNOWN',
      taskLoad:input.taskLoadAssistance??'UNKNOWN',
      recentModelPrime:input.recentModelPrime??'UNKNOWN',
    }),
  });
}

const facetBottlenecks:Readonly<Record<CapabilityFacet,readonly ProductionBottleneckKindV1[]>>=Object.freeze({
  FORM_RECOGNITION:['REPRESENTATION'],FORM_TO_MEANING:['REPRESENTATION','MEANING_FORM_MAPPING'],MEANING_TO_RETRIEVAL:['RETRIEVAL'],ORTHOGRAPHIC_PRODUCTION:['FORM_ASSEMBLY','MONITORING_SELF_REPAIR'],MORPHOLOGY:['FORM_ASSEMBLY'],SENSE_DISCRIMINATION:['REPRESENTATION','SELECTION'],COLLOCATION:['LEXICAL_SLOT_FILLING','SELECTION'],LEXICAL_SYNTACTIC_BEHAVIOR:['LEXICAL_SLOT_FILLING','FORM_ASSEMBLY'],FORM_MEANING_MAPPING:['MEANING_FORM_MAPPING'],SELECTION:['OPPORTUNITY_RECOGNITION','SELECTION'],CONSTRUCTION:['FORM_ASSEMBLY','LEXICAL_SLOT_FILLING'],CONTEXTUAL_APPROPRIACY:['SELECTION','DEPLOYMENT_UNDER_LOAD'],CONTROLLED_PRODUCTION:['FORM_ASSEMBLY','RETRIEVAL'],FREE_PRODUCTION:['OPPORTUNITY_RECOGNITION','RETRIEVAL','DEPLOYMENT_UNDER_LOAD'],SPONTANEOUS_DEPLOYMENT:['OPPORTUNITY_RECOGNITION','RETRIEVAL','DEPLOYMENT_UNDER_LOAD'],
});

function sourceHypothesesFor(kind:ProductionBottleneckKindV1,request:TeachingRequestV1){
  const matches=request.competingHypotheses.filter(h=>{
    const text=`${h.id} ${h.label}`.toLowerCase();
    if(kind==='DEPLOYMENT_UNDER_LOAD')return /condition|load|support|fragil|情境|負荷|支援/.test(text);
    if(kind==='COMPETING_REPRESENTATION')return /l1|first language|母語|中文|literal/.test(text);
    if(kind==='RETRIEVAL')return /retriev|access|提取|叫不出/.test(text);
    if(kind==='OPPORTUNITY_RECOGNITION')return /opportun|deploy|spontaneous|使用時機|自己想到/.test(text);
    return false;
  });
  return matches;
}

export function deriveProductionBottleneckHypothesesV1(request:TeachingRequestV1):readonly ProductionBottleneckHypothesisV1[]{
  const map=new Map<ProductionBottleneckKindV1,{status:ProductionBottleneckHypothesisV1['status'];reasons:string[];sources:string[]}>();
  const add=(kind:ProductionBottleneckKindV1,status:ProductionBottleneckHypothesisV1['status'],reason:string,sources:readonly string[]=[])=>{
    const prior=map.get(kind);if(!prior||statusRank[status]>statusRank[prior.status])map.set(kind,{status,reasons:unique([...(prior?.reasons??[]),reason]),sources:unique([...(prior?.sources??[]),...sources])});else{prior.reasons=unique([...prior.reasons,reason]);prior.sources=unique([...prior.sources,...sources])}
  };
  for(const kind of facetBottlenecks[request.facet]??['UNKNOWN'])add(kind,'POSSIBLE',`FACET_${request.facet}`);
  if(request.supportDependence==='HIGH'||request.supportDependence==='MEDIUM')add('DEPLOYMENT_UNDER_LOAD','POSSIBLE','SUPPORT_DEPENDENCE');
  if(request.learnerState==='INDEPENDENT_LOCAL_CONTROL'||request.learnerState==='TRANSFER_PENDING')add('OPPORTUNITY_RECOGNITION','POSSIBLE','LOCAL_CONTROL_WITHOUT_BROAD_DEPLOYMENT');
  if(request.current.outcome==='PARTIAL'&&['CONSTRUCTION','CONTROLLED_PRODUCTION','FREE_PRODUCTION'].includes(request.facet))add('FORM_ASSEMBLY','POSSIBLE','PARTIAL_FORMATION');
  if(request.current.outcome==='FAILURE'&&request.conditions.taskLoad==='HIGH'&&request.learnerState&&request.learnerState!=='UNKNOWN')add('DEPLOYMENT_UNDER_LOAD','SUPPORTED','FAILURE_UNDER_HIGH_LOAD_WITH_PRIOR_CONTROL');
  for(const kind of ['DEPLOYMENT_UNDER_LOAD','COMPETING_REPRESENTATION','RETRIEVAL','OPPORTUNITY_RECOGNITION'] as const){const hs=sourceHypothesesFor(kind,request);for(const h of hs)add(kind,h.status==='SUPPORTED'?'SUPPORTED':'POSSIBLE','CANONICAL_COMPETING_HYPOTHESIS',hs.map(x=>x.id))}
  if(request.current.outcome==='HELP_WITHOUT_ATTEMPT')for(const value of map.values())if(value.status==='SUPPORTED')value.status='POSSIBLE';
  const values=[...map.entries()].map(([kind,value])=>Object.freeze({kind,status:value.status,reasonCodes:Object.freeze(value.reasons),sourceHypothesisIds:Object.freeze(value.sources)}));
  return Object.freeze(values.sort((a,b)=>statusRank[b.status]-statusRank[a.status]||a.kind.localeCompare(b.kind)));
}

function priorFailureCount(request:TeachingRequestV1,mechanismId:string){const signal=deriveLocalTreatmentSignalV1(request,mechanismId);return signal.avoidLocally?signal.negativeCount:0}
function l1Grounded(request:TeachingRequestV1){return sourceHypothesesFor('COMPETING_REPRESENTATION',request).some(h=>h.status==='SUPPORTED'||h.status==='POSSIBLE')}

export function rankMechanismSuitabilityV1(request:TeachingRequestV1,bottlenecks:readonly ProductionBottleneckHypothesisV1[]=deriveProductionBottleneckHypothesesV1(request)):readonly MechanismSuitabilityV1[]{
  const kinds=new Set(bottlenecks.filter(h=>h.status!=='WEAKENED').map(h=>h.kind));
  return Object.freeze(canonicalPckMechanismsV1.map(mechanism=>{
    const reasons:string[]=[],contra:string[]=[];let score=0;
    if(mechanism.suitableFacets.includes(request.facet)){score+=4;reasons.push('FACET_MATCH')}else contra.push('FACET_MISMATCH');
    if(mechanism.suitableAreas.includes(request.targetArea)){score+=2;reasons.push('AREA_MATCH')}
    if(mechanism.suitableKinds.includes(request.targetKind)){score+=2;reasons.push('TARGET_KIND_MATCH')}
    const overlap=mechanism.suitableBottlenecks.filter(kind=>kinds.has(kind));if(overlap.length){score+=overlap.length*3;reasons.push(...overlap.map(kind=>`BOTTLENECK_${kind}`))}
    if(mechanism.id==='l1-collision'&&!l1Grounded(request))contra.push('L1_HYPOTHESIS_NOT_GROUNDED');
    if(mechanism.id==='worked-transformation'&&(request.learnerState==='INDEPENDENT_LOCAL_CONTROL'||request.learnerState==='TRANSFER_SUPPORTED'||request.learnerState==='RETENTION_SUPPORTED'))contra.push('WORKED_EXAMPLE_REDUNDANT_FOR_CURRENT_CONTROL');
    const localSignal=deriveLocalTreatmentSignalV1(request,mechanism.id),fails=priorFailureCount(request,mechanism.id);if(fails){score-=fails*5;contra.push('RECENT_NO_PROGRESS_WITH_SAME_MECHANISM')}else if(localSignal.strength==='TR_STRONG_LOCAL_EFFECT_SIGNAL'){score+=3;reasons.push('STRONG_LOCAL_EFFECT_SIGNAL')}
    if(request.current.outcome==='HELP_WITHOUT_ATTEMPT'){score+=1;reasons.push('HELP_BEFORE_FAILURE_REQUIRES_LOW_RISK_SUPPORT')}
    const structuralMatch=mechanism.suitableAreas.includes(request.targetArea)||mechanism.suitableKinds.includes(request.targetKind)||overlap.length>0;
    const admissible=contra.length===0&&mechanism.suitableFacets.includes(request.facet)&&structuralMatch&&score>0;
    return Object.freeze({mechanismId:mechanism.id,admissible,score,reasonCodes:Object.freeze(reasons),contraindications:Object.freeze(contra)});
  }).sort((a,b)=>Number(b.admissible)-Number(a.admissible)||b.score-a.score||a.mechanismId.localeCompare(b.mechanismId)));
}

export function deploymentStageFromConditionsV1(conditions:TeachingOpportunityConditionsV1):DeploymentStageV1{
  if(conditions.elicitation==='TARGET_NAMED')return'CONTROLLED_CONSTRUCTION';
  if(conditions.elicitation==='FUNCTION_CUED')return'FUNCTION_CUED_RETRIEVAL';
  if(conditions.elicitation==='OPEN_CHOICE')return'OPEN_CHOICE_RETRIEVAL';
  if(conditions.elicitation==='AUTHENTIC_TASK')return'AUTHENTIC_DEPLOYMENT';
  return'UNKNOWN';
}

export function deriveTeachingOptionsV1(request:TeachingRequestV1):TeachingOptionsV1{
  const canonical=coreEnglishDomainPortV2.resolveId(request.targetRef);if(!canonical||canonical!==request.targetRef)throw new Error('F requires canonical D target');if(!coreEnglishDomainPortV2.supportsFacet(canonical,request.facet))throw new Error('F target/facet mismatch');
  const bottlenecks=deriveProductionBottleneckHypothesesV1(request),ranked=rankMechanismSuitabilityV1(request,bottlenecks),preferred=ranked.filter(item=>item.admissible).slice(0,3).map(item=>item.mechanismId),primary=preferred.length?pckMechanismByIdV1(preferred[0]):undefined,supportPolicy=deriveContingentSupportPolicyV1(request);
  return Object.freeze({targetRef:canonical,facet:request.facet,bottleneckHypotheses:bottlenecks,admissibleMechanisms:ranked,preferredMechanismIds:Object.freeze(preferred),assistance:request.conditions.assistance,elicitation:request.conditions.elicitation,deploymentStage:deploymentStageFromConditionsV1(request.conditions),supportPolicy,feedbackBudget:{maxConcurrentTargets:1 as const,rationale:'F may shape one D-authorized focus at a time; multi-issue prioritization belongs to H/I/D.'},learnerAction:primary?.requiredLearnerAction??'produce or repair learner-owned English without changing the authorized target',fadeConditions:primary?.fadeConditions??['remove support when the learner can perform the same operation without it'],replanConditions:primary?.replanConditions??['change representation after no progress'],stopConditions:primary?.stopConditions??['stop intervention when it no longer changes useful learner action']});
}

export function validateTeachingMechanismChoiceV1(request:TeachingRequestV1,mechanismId:string):readonly string[]{
  const block=blockRegistryV4.get(mechanismId);if(!block)return Object.freeze(['UNREGISTERED_MECHANISM']);if(block.role!=='TEACH')return Object.freeze([]);
  const options=deriveTeachingOptionsV1(request),match=options.admissibleMechanisms.find(item=>item.mechanismId===mechanismId);const errors:string[]=[];
  if(!match||!match.admissible)errors.push(...(match?.contraindications.length?match.contraindications:['MECHANISM_NOT_ADMISSIBLE_FOR_CURRENT_F_CONTEXT']));return Object.freeze(unique(errors));
}

export function selectPreferredTeachingBlockV1(request:TeachingRequestV1,exclude?:string){const options=deriveTeachingOptionsV1(request);for(const id of options.preferredMechanismIds){if(id===exclude)continue;const block=blockRegistryV4.get(id);if(block&&block.role==='TEACH')return{block,options}}return{block:undefined,options}}

export function taskGenerationNeedFromTeachingOptionsV1(options:TeachingOptionsV1):TaskGenerationNeedFromFV1{
  const primary=options.bottleneckHypotheses[0]?.kind;const purpose:TaskGenerationNeedFromFV1['purpose']=primary==='OPPORTUNITY_RECOGNITION'?'OPPORTUNITY_RECOGNITION':primary==='RETRIEVAL'?'RETRIEVAL':primary==='SELECTION'?'DISCRIMINATION':primary==='DEPLOYMENT_UNDER_LOAD'?'DEPLOYMENT':primary==='FORM_ASSEMBLY'||primary==='LEXICAL_SLOT_FILLING'?'CONTROLLED_CONSTRUCTION':'REPAIR';
  return Object.freeze({targetRef:options.targetRef,facet:options.facet,purpose,elicitation:options.elicitation,targetNameVisible:options.elicitation==='TARGET_NAMED',functionCueVisible:options.elicitation==='FUNCTION_CUED',recentModelPrimeAllowed:purpose==='CONTROLLED_CONSTRUCTION',desiredContext:purpose==='DEPLOYMENT'||purpose==='OPPORTUNITY_RECOGNITION'?'CHANGED_CONTEXT':'SAME_CONTEXT',validAlternatives:'ACCEPT',observationWanted:`observe ${primary??'authorized output operation'} without converting a valid alternative into failure`});
}

export function nextElicitationAfterSuccessV1(current:ElicitationConditionV1):ElicitationConditionV1{return current==='TARGET_NAMED'?'FUNCTION_CUED':current==='FUNCTION_CUED'?'OPEN_CHOICE':current==='OPEN_CHOICE'?'AUTHENTIC_TASK':current}
