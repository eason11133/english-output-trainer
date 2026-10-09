import { adaptQualifiedBlockDecisionV4 } from '../application/stage4/blockDecisionAdapterV4';
import { coreEnglishDomainPortV2 } from '../domain/english';
import type { LearningBlockDefinitionV4, PedagogicalRoleV4 } from '../domain/v4/LearningBlockV4';
import { blockRegistryV4, bundledPckAssetsV1, decideNextTeachingPuzzleMoveV1, defaultTeachingOpportunityConditionsV1, deriveAdaptiveTeacherEpisodeDecisionV1, deriveTeachingOptionsV1, eligiblePckAssetsForRequestV1, selectPreferredTeachingBlockV1, treatmentConfoundsV1, validateContingentSupportChoiceV1, validateTeachingMechanismChoiceV1, type TeachingPuzzleComposerStateV1, type TeachingPuzzleSelectionV1, type TeachingRequestV1, type TeachingResponseSignalV1 } from '../teaching';
import { compilePedagogicalContextV1, isPedagogicalDecisionPointV1 } from './contextCompiler';
import { teacherModelCallRouteV1 } from './modelRouting';
import { legalTeacherActionsV1, type InnerTutorDecisionInputV1, type InnerTutorProposalV1, type LegalTeacherActionV1, type PedagogicalContextV1, type QualifiedInnerTutorDecisionV1, type TeacherExperienceRequestV1 } from './types';

const roleAction=(proposal:InnerTutorProposalV1):LegalTeacherActionV1=>proposal.teacherAction as LegalTeacherActionV1||(
  proposal.pedagogicalIntent==='TEACH'?'TEACH':proposal.pedagogicalIntent==='PRACTICE'?'PRACTICE':proposal.pedagogicalIntent==='ASSESS'?'CHECK':proposal.pedagogicalIntent==='TRANSFER'?'RETURN_TO_TASK':proposal.selectedBlockId==='clarify-context'?'ASK':proposal.selectedBlockId==='return-source-navigation'?'RETURN_TO_TASK':'NONE'
);
const actionRole=(action:LegalTeacherActionV1):PedagogicalRoleV4=>action==='TEACH'?'TEACH':action==='REPAIR'||action==='PRACTICE'?'PRACTICE':action==='CHECK'?'ASSESS':'SYSTEM';
const actionAllowsRole=(action:LegalTeacherActionV1,role:PedagogicalRoleV4)=>action==='CHECK'?role==='ASSESS'||role==='TRANSFER':action==='RETURN_TO_TASK'?role==='TRANSFER'||role==='SYSTEM':role===actionRole(action);
const narrator=(action:LegalTeacherActionV1,support:QualifiedInnerTutorDecisionV1['blockDecision']['supportLevel'],changed=false):TeacherExperienceRequestV1['narrator']=>changed?{state:'CHANGE_APPROACH',message:'剛才的方法沒有幫你看清楚；我們換一個角度，直接做下一小步。'}:action==='TEACH'?{state:'FOCUS',message:'我看見你卡住的地方了。先只處理這一小步。'}:action==='PRACTICE'||action==='REPAIR'?{state:'GUIDE',message:'現在換你動手；我只保留目前需要的協助。'}:action==='CHECK'?{state:support==='NONE'?'FADE':'ACKNOWLEDGE',message:'這一步有進展。現在把提示拿掉，再由你完成一次。'}:action==='RETURN_TO_TASK'?{state:'RETURN',message:'這一小步已經可以放回你的原作；回去由你親自改寫。'}:action==='NONE'?{state:'ACKNOWLEDGE',message:'這次你已經自己完成，不需要多加教學。'}:undefined;
const experience=(action:LegalTeacherActionV1,mechanismId:string,support:QualifiedInnerTutorDecisionV1['blockDecision']['supportLevel'],changed=false):TeacherExperienceRequestV1=>({kind:action==='NONE'||action==='WAIT'?'NO_INTERVENTION':action==='ASK'?'QUESTION':action==='RETURN_TO_TASK'?'RETURN_TO_TASK':action==='STOP'||action==='EXIT'?'SESSION_STOP':'LEARNING_BLOCK',action,mechanismId:actionRole(action)==='SYSTEM'?undefined:mechanismId,support,internalReasoningVisible:false,narrator:narrator(action,support,changed)});
const mechanismFor=(role:PedagogicalRoleV4,facet:string,exclude?:string):LearningBlockDefinitionV4|undefined=>blockRegistryV4.byRole(role).find(block=>block.id!==exclude&&block.suitableFacets.includes(facet as never));

function fRequest(context:PedagogicalContextV1,event:InnerTutorDecisionInputV1['event'],currentMechanism?:string):TeachingRequestV1{
  const target=coreEnglishDomainPortV2.get(context.lessonPlan.targetRef);if(!target)throw new Error('F requires canonical target metadata');
  const contextFamily=String(context.sourceTaskContext?.kind??context.product.productMode);
  const currentTreatment=currentMechanism?{mechanismId:currentMechanism,support:event.support,outcome:event.outcome,occurredAt:event.occurredAt,responseSignal:event.learnerIntent==='IMPASSE_REPLAN'?'CONFUSED' as const:undefined,targetRef:context.lessonPlan.targetRef,facet:context.lessonPlan.facet as TeachingRequestV1['facet'],contextFamily,learnerStateBand:context.targetProjection?.state,confounds:treatmentConfoundsV1({support:event.support,taskLoadAttribution:event.productionConditions?.taskLoad==='HIGH'?'TASK_LOAD_CONFOUND':undefined,recentModelPrime:event.productionConditions?.assistance.recentModelPrime})}:undefined;
  return{
    targetRef:context.lessonPlan.targetRef,
    facet:context.lessonPlan.facet as TeachingRequestV1['facet'],
    targetArea:target.area,
    targetKind:target.kind,
    learnerState:context.targetProjection?.state,
    supportDependence:context.targetProjection?.supportDependence,
    prerequisiteWeakness:context.prerequisites.some(item=>!item.projection||item.projection.state==='UNKNOWN'||item.projection.state==='OBSERVED_FRAGILE'),
    learnerRequestedIndependentAttempt:event.learnerIntent==='TRY_INDEPENDENT',
    competingHypotheses:context.competingHypotheses,
    current:{outcome:event.outcome,support:event.support,eventKind:event.kind},
    conditions:event.productionConditions??defaultTeachingOpportunityConditionsV1({support:event.support}),
    recentTreatment:[...context.recentTreatmentResponses,...(currentTreatment?[currentTreatment]:[])],
    contextFamily,
  };
}

function withFTeachingContextV1(context:PedagogicalContextV1,event:InnerTutorDecisionInputV1['event'],currentMechanism?:string):PedagogicalContextV1{
  const request=fRequest(context,event,currentMechanism),options=deriveTeachingOptionsV1(request),pckAssets=eligiblePckAssetsForRequestV1(bundledPckAssetsV1().productionEligible,{request,productMode:context.product.productMode,senseId:request.targetKind==='SENSE'?request.targetRef:undefined});
  return Object.freeze({...context,teaching:Object.freeze({
    bottleneckHypotheses:options.bottleneckHypotheses,
    preferredMechanismIds:options.preferredMechanismIds,
    supportPolicy:options.supportPolicy,
    learnerAction:options.learnerAction,
    fadeConditions:options.fadeConditions,
    replanConditions:options.replanConditions,
    stopConditions:options.stopConditions,
    elicitation:options.elicitation,
    deploymentStage:options.deploymentStage,
    pckAssets:pckAssets.map(asset=>({assetId:asset.assetId,kind:asset.kind,mechanismIds:asset.compatibleMechanismIds,sourceKind:asset.provenance.sourceKind,sourceId:asset.provenance.sourceId})),
  })});
}

function fConfiguration(context:PedagogicalContextV1,event:InnerTutorDecisionInputV1['event'],currentMechanism?:string):Record<string,string|number|boolean>{
  const request=fRequest(context,event,currentMechanism),options=deriveTeachingOptionsV1(request),episode=deriveAdaptiveTeacherEpisodeDecisionV1(request),primary=options.bottleneckHypotheses[0];
  return{
    fPrimaryBottleneck:primary?.kind??'UNKNOWN',
    fElicitationCondition:options.elicitation,
    fDeploymentStage:options.deploymentStage,
    fLanguageAssistance:options.assistance.language,
    fSelectionAssistance:options.assistance.selection,
    fFunctionCueAssistance:options.assistance.functionCue,
    fPlanningAssistance:options.assistance.planning,
    fTaskLoadAssistance:options.assistance.taskLoad,
    fRecentModelPrime:options.assistance.recentModelPrime,
    fSupportTransition:options.supportPolicy.transition,
    fRecommendedSupport:options.supportPolicy.recommendedSupport,
    fNextElicitation:options.supportPolicy.nextElicitation,
    fNextEvidenceCeiling:options.supportPolicy.nextEvidenceCeiling,
    fMustChangeRepresentation:options.supportPolicy.requiresRepresentationChange,
    dEpisodeAction:episode.action,
    dAssistanceLevel:episode.assistanceLevel,
    dFeedbackTiming:episode.feedbackTiming,
    dTaskLoadAttribution:episode.taskLoadAttribution,
    dTaskLoadProfile:JSON.stringify(episode.loadDimensions),
    dChangeOneMajorLoadDimension:episode.changeOneMajorLoadDimension,
    dLearnerActionRequired:episode.learnerActionRequired,
    dEpisodeReasonCodes:episode.reasonCodes.join('|'),
  };
}

const responseSignal=(event:InnerTutorDecisionInputV1['event']):TeachingResponseSignalV1=>event.learnerIntent==='IMPASSE_REPLAN'?'CONFUSED':event.outcome==='EXPOSURE_ONLY'?'HELPED':event.outcome==='SUCCESS'?(event.support==='NONE'?'INDEPENDENT_SUCCESS':'ASSISTED_SUCCESS'):event.outcome==='PARTIAL'?'HELPED':event.outcome==='FAILURE'?'FAILURE':'UNKNOWN';

function parsePuzzleComposerStateV1(value:unknown):TeachingPuzzleComposerStateV1|undefined{
  if(typeof value!=='string'||!value.trim())return undefined;
  try{
    const parsed=JSON.parse(value) as TeachingPuzzleComposerStateV1;
    return parsed?.schemaVersion===1&&typeof parsed.targetRef==='string'&&typeof parsed.facet==='string'&&Array.isArray(parsed.history)?parsed:undefined;
  }catch{return undefined}
}

function practiceForPuzzleHandoffV1(facet:string,desiredSupport:QualifiedInnerTutorDecisionV1['blockDecision']['supportLevel']){
  const candidates=blockRegistryV4.byRole('PRACTICE').filter(block=>block.suitableFacets.includes(facet as never)&&block.supportLevels.includes(desiredSupport)&&!block.forbiddenSupport.includes(desiredSupport));
  return candidates[0]??blockRegistryV4.byRole('PRACTICE').find(block=>block.suitableFacets.includes(facet as never));
}

function withPuzzleStateConfigurationV1(
  decision:QualifiedInnerTutorDecisionV1['blockDecision'],
  moveKind:string,
  state:TeachingPuzzleComposerStateV1,
  selection?:TeachingPuzzleSelectionV1
){
  return{
    ...decision.configuration,
    teachingPuzzleMoveKind:moveKind,
    teachingPuzzleComposerState:JSON.stringify(state),
    teachingPuzzleId:selection?.puzzleId??'',
    teachingPuzzleMechanismId:selection?.mechanismId??'',
    teachingPuzzleRepresentation:selection?.representationKind??'',
    teachingPuzzleInteraction:selection?.primaryInteraction??'',
    teachingPuzzleSelection:selection?JSON.stringify(selection):'',
  };
}

function puzzleFlowFor(input:InnerTutorDecisionInputV1,context:PedagogicalContextV1,decision:QualifiedInnerTutorDecisionV1):QualifiedInnerTutorDecisionV1{
  const prior=parsePuzzleComposerStateV1(input.currentDecision?.configuration.teachingPuzzleComposerState);
  const signal=responseSignal(input.event);
  const hasActivePuzzle=Boolean(prior?.current);

  // Manipulation/reveal events belong to the currently rendered puzzle. They
  // are observations, not permission to choose the next teaching move.
  if(hasActivePuzzle&&signal==='UNKNOWN'&&['LEARNER_MANIPULATION','SUPPORT_REVEALED','SUPPORT_REDUCTION_REQUESTED'].includes(input.event.kind))return decision;
  if(!hasActivePuzzle&&decision.action!=='TEACH')return decision;

  const request=fRequest(context,input.event,input.currentDecision?.selectedBlockId);
  let move;
  try{
    move=decideNextTeachingPuzzleMoveV1({request,state:prior,responseSignal:hasActivePuzzle?signal:undefined,occurredAt:input.event.occurredAt});
  }catch{return decision}

  if(move.kind==='PRESENT_PUZZLE'&&move.selection){
    const block=blockRegistryV4.get(move.selection.mechanismId);
    if(!block||block.role!=='TEACH')return decision;
    const changed=Boolean(prior?.current&&prior.current.representationKind!==move.selection.representationKind);
    const blockDecision={
      ...decision.blockDecision,
      selectedBlockId:block.id,
      supportLevel:move.selection.support,
      pedagogicalIntent:'TEACH' as const,
      contextProvenance:block.contextAffordance,
      configuration:withPuzzleStateConfigurationV1(decision.blockDecision,move.kind,move.state,move.selection),
      reasonForSelection:'response-driven-teaching-puzzle',
      evidenceToObserve:[],
      requestedSystemAction:'NONE' as const,
    };
    return{
      ...decision,
      action:'TEACH',
      blockDecision,
      experience:experience('TEACH',block.id,move.selection.support,changed),
      provenance:{...decision.provenance,selectedMechanismId:block.id,reasonCodes:[...decision.provenance.reasonCodes,'RESPONSE_DRIVEN_TEACHING_PUZZLE',...move.reasonCodes]},
    };
  }

  if(move.kind==='HANDOFF_TO_PRACTICE'||move.kind==='REQUEST_INDEPENDENT_ATTEMPT'){
    const desiredSupport=deriveAdaptiveTeacherEpisodeDecisionV1(request).support;
    const block=practiceForPuzzleHandoffV1(request.facet,desiredSupport);
    if(!block)return decision;
    const support=block.supportLevels.includes(desiredSupport)&&!block.forbiddenSupport.includes(desiredSupport)?desiredSupport:block.supportLevels.find(value=>!block.forbiddenSupport.includes(value))??'NONE';
    const blockDecision={
      ...decision.blockDecision,
      selectedBlockId:block.id,
      supportLevel:support,
      pedagogicalIntent:'PRACTICE' as const,
      contextProvenance:block.contextAffordance,
      configuration:withPuzzleStateConfigurationV1(decision.blockDecision,move.kind,move.state),
      reasonForSelection:'teaching-puzzle-handoff-to-learner-action',
      evidenceToObserve:[],
      requestedSystemAction:'NONE' as const,
    };
    return{
      ...decision,
      action:'PRACTICE',
      blockDecision,
      experience:experience('PRACTICE',block.id,support,false),
      provenance:{...decision.provenance,selectedMechanismId:block.id,reasonCodes:[...decision.provenance.reasonCodes,move.kind,...move.reasonCodes]},
    };
  }

  const configured={...decision.blockDecision,configuration:withPuzzleStateConfigurationV1(decision.blockDecision,move.kind,move.state)};
  if(move.kind==='RETURN_TO_SOURCE'){
    const nav=blockRegistryV4.get('return-source-navigation');
    if(nav)return{
      ...decision,
      action:'RETURN_TO_TASK',
      blockDecision:{...configured,selectedBlockId:nav.id,pedagogicalIntent:'SYSTEM',supportLevel:'NONE',contextProvenance:nav.contextAffordance,evidenceToObserve:[],requestedSystemAction:'RETURN_TO_SOURCE'},
      experience:experience('RETURN_TO_TASK',nav.id,'NONE',false),
      provenance:{...decision.provenance,selectedMechanismId:nav.id,reasonCodes:[...decision.provenance.reasonCodes,'PUZZLE_RETURN_TO_SOURCE',...move.reasonCodes]},
    };
  }
  if(move.kind==='STOP'){
    const safe=blockRegistryV4.get('continue-source');
    if(safe)return{
      ...decision,
      action:'STOP',
      blockDecision:{...configured,selectedBlockId:safe.id,pedagogicalIntent:'SYSTEM',supportLevel:'NONE',contextProvenance:safe.contextAffordance,evidenceToObserve:[],requestedSystemAction:'NONE'},
      experience:experience('STOP',safe.id,'NONE',false),
      provenance:{...decision.provenance,selectedMechanismId:safe.id,reasonCodes:[...decision.provenance.reasonCodes,'PUZZLE_STOP',...move.reasonCodes]},
    };
  }
  return{...decision,blockDecision:configured,provenance:{...decision.provenance,reasonCodes:[...decision.provenance.reasonCodes,`PUZZLE_${move.kind}`,...move.reasonCodes]}};
}

function fallback(context:PedagogicalContextV1,event:InnerTutorDecisionInputV1['event'],currentMechanism?:string):{proposal:InnerTutorProposalV1;action:LegalTeacherActionV1;reasons:string[]} {
  let action:LegalTeacherActionV1='TEACH',role:PedagogicalRoleV4='TEACH',reasons=['FALLBACK_GROUNDED_IN_CANONICAL_CONTEXT'];
  const request=fRequest(context,event,currentMechanism),episode=deriveAdaptiveTeacherEpisodeDecisionV1(request);
  if(context.timeRemainingMinutes<=0||event.kind==='TIME_EXHAUSTED'){action='STOP';role='SYSTEM';reasons=['TIME_EXHAUSTED']}
  else if(event.learnerIntent==='TRY_INDEPENDENT'){action='PRACTICE';role='PRACTICE';reasons=['LEARNER_AGENCY_TRY_INDEPENDENT','FADE_SUPPORT_WITHOUT_MASTERY_CLAIM']}
  else if(event.kind==='HELP_REQUESTED'||event.outcome==='HELP_WITHOUT_ATTEMPT'){action='TEACH';role='TEACH';reasons=['HELP_BEFORE_FAILURE','NO_FAILURE_EVIDENCE']}
  else if(event.outcome==='EXPOSURE_ONLY'){action='PRACTICE';role='PRACTICE';reasons=['EXPOSURE_REQUIRES_LEARNER_ACTION']}
  else if(event.outcome==='NOT_EVALUATED'||event.kind==='LEARNER_MANIPULATION'||event.kind==='SOURCE_CLARIFIED'||event.kind==='RESUMED'){action='WAIT';role='SYSTEM';reasons=['CONTEXT_UPDATED_WITHOUT_CAPABILITY_OUTCOME']}
  else if(event.outcome==='SUCCESS'&&event.support==='NONE'){action='NONE';role='SYSTEM';reasons=['UNSUPPORTED_SUCCESS','NO_USEFUL_INTERVENTION']}
  else if(event.outcome==='SUCCESS'){action='CHECK';role='ASSESS';reasons=['SUPPORTED_SUCCESS','FADE_TO_FRESH_CHECK']}
  else if(event.outcome==='PARTIAL'){action='REPAIR';role='PRACTICE';reasons=['PARTIAL_LOCAL_REPAIR']}
  else if(episode.action==='REDUCE_TASK_LOAD'){action='PRACTICE';role='PRACTICE';reasons=['TASK_LOAD_CONFOUND','REDUCE_ONE_MAJOR_LOAD_DIMENSION','NO_LEARNER_REGRESSION_INFERENCE']}
  else if(episode.action==='CHECK_PREREQUISITE'||episode.action==='REDUCE_TARGET_GRANULARITY'){action='ASK';role='SYSTEM';reasons=[episode.action,'NO_PROGRESS_DIAGNOSTIC_BEFORE_MORE_TEACHING']}
  else if(event.outcome==='FAILURE'&&['INDEPENDENT_LOCAL_CONTROL','TRANSFER_SUPPORTED','RETENTION_SUPPORTED'].includes(context.targetProjection?.state??'')&&context.lessonPlan.facet==='MEANING_TO_RETRIEVAL'){action='REPAIR';role='PRACTICE';reasons=['KNOWN_TARGET_RETRIEVAL_PROMPT_BEFORE_RETEACHING']}
  else if(event.outcome==='FAILURE'&&currentMechanism){action='TEACH';role='TEACH';reasons=['REPRESENTATION_CHANGE_AFTER_FAILURE']}
  else if(context.targetProjection?.state==='INDEPENDENT_LOCAL_CONTROL'||context.targetProjection?.state==='TRANSFER_SUPPORTED'||context.targetProjection?.state==='RETENTION_SUPPORTED'){action='NONE';role='SYSTEM';reasons=['EXISTING_CONTROL','INTERVENTION_NONE']}

  const options=deriveTeachingOptionsV1(request),supportPolicy=options.supportPolicy;
  if(event.outcome==='SUCCESS'&&event.support!=='NONE'){
    if(supportPolicy.transition==='FRESH_CHECK'){action='CHECK';role='ASSESS';reasons=['SUPPORTED_SUCCESS','F_CONTINGENT_SUPPORT_TO_FRESH_CHECK']}
    else {action='PRACTICE';role='PRACTICE';reasons=['SUPPORTED_SUCCESS','F_CONTINGENT_SUPPORT_FADE']}
  }
  let block:LearningBlockDefinitionV4|undefined;
  if(role==='SYSTEM')block=blockRegistryV4.get('continue-source');
  else if(role==='TEACH'){
    const selected=selectPreferredTeachingBlockV1(request,currentMechanism);block=selected.block;
    if(block)reasons=[...reasons,'F_PCK_SUITABILITY_SELECTED',...(selected.options.bottleneckHypotheses[0]?.reasonCodes??[])];
  }else block=mechanismFor(role,context.lessonPlan.facet,currentMechanism);
  const safeBlock=block??blockRegistryV4.get('clarify-context')!;
  if(!block){action='ASK';role='SYSTEM';reasons=[...reasons,'NO_SAFE_REGISTERED_MECHANISM']}
  const support=role==='SYSTEM'?'NONE':action==='CHECK'?'NONE':episode.support;
  reasons=[...reasons,...supportPolicy.reasonCodes.map(code=>`F_SUPPORT_${code}`)];
  return{action,reasons,proposal:{teacherAction:action,lessonPlanId:context.lessonPlan.id,pedagogicalIntent:role==='SYSTEM'?'SYSTEM':role,targetReference:context.lessonPlan.targetRef,focusFacet:context.lessonPlan.facet,selectedBlockId:safeBlock.id,supportLevel:support,contextProvenance:safeBlock.contextAffordance,evidenceToObserve:role==='ASSESS'?[{facet:context.lessonPlan.facet,productionCondition:'FRESH_INDEPENDENT'}]:[],successTransitionIntent:role==='TEACH'||role==='PRACTICE'?'REDECIDE_AND_FADE':'RETURN_OR_STOP',failureTransitionIntent:'REDECIDE_CHANGE_REPRESENTATION',confidence:'MEDIUM',unresolvedAmbiguity:null,internalDecisionReason:'deterministic policy reason codes only'}};
}

export function qualifyInnerTutorProposalV1(context:PedagogicalContextV1,event:InnerTutorDecisionInputV1['event'],proposal:InnerTutorProposalV1,currentMechanism?:string):{accepted:true;decision:QualifiedInnerTutorDecisionV1}|{accepted:false;reasons:string[]} {
  const reasons:string[]=[];
  const action=roleAction(proposal);
  if(!legalTeacherActionsV1.includes(action))reasons.push('illegal Teacher action');
  if(proposal.lessonPlanId&&proposal.lessonPlanId!==context.lessonPlan.id)reasons.push('Teacher decision provenance lacks canonical LessonPlan binding');
  if(proposal.targetReference&&coreEnglishDomainPortV2.resolveId(proposal.targetReference)!==context.lessonPlan.targetRef)reasons.push('Teacher cannot change D target');
  if(proposal.focusFacet&&proposal.focusFacet!==context.lessonPlan.facet)reasons.push('Teacher cannot change D facet');
  if(proposal.pedagogicalIntent!=='SYSTEM'&&proposal.evidenceToObserve.some(item=>item.productionCondition!=='NONE'&&item.productionCondition!=='EXPOSURE_ONLY'&&item.facet!==context.lessonPlan.facet))reasons.push('Teacher evidence facet diverges from D facet');
  const block=blockRegistryV4.get(proposal.selectedBlockId);
  if(!block)reasons.push('mechanism is not registered by F');
  if(block&&!actionAllowsRole(action,block.role))reasons.push('legal action and mechanism role mismatch');
  const request=fRequest(context,event,currentMechanism);
  if(block?.role==='TEACH')reasons.push(...validateTeachingMechanismChoiceV1(request,block.id).map(reason=>`F:${reason}`));
  reasons.push(...validateContingentSupportChoiceV1(request,{action,support:proposal.supportLevel,mechanismId:proposal.selectedBlockId}).map(reason=>`F:${reason}`));
  if((context.timeRemainingMinutes<=0||event.kind==='TIME_EXHAUSTED')&&action!=='STOP'&&action!=='EXIT')reasons.push('time exhaustion requires tutor stop');
  if(event.outcome==='SUCCESS'&&event.support==='NONE'&&!['NONE','WAIT','RETURN_TO_TASK','STOP','EXIT'].includes(action))reasons.push('unsupported success forbids unnecessary intervention');
  let blockDecision;
  try{blockDecision=adaptQualifiedBlockDecisionV4(proposal,context.lessonPlan.id)}catch(error){reasons.push(error instanceof Error?error.message:'block decision qualification failed')}
  if(blockDecision&&blockDecision.evidenceToObserve.length&&(['NONE','WAIT','ASK','STOP','EXIT'].includes(action)||event.outcome==='HELP_WITHOUT_ATTEMPT'))reasons.push('non-performance intervention cannot request capability evidence');
  if(reasons.length||!blockDecision)return{accepted:false,reasons};
  blockDecision={...blockDecision,configuration:{...blockDecision.configuration,...fConfiguration(context,event,currentMechanism),decisionPointId:event.id,teacherAction:action},reasonForSelection:'qualified-inner-tutor-decision'};
  return{accepted:true,decision:{action,blockDecision,experience:experience(action,proposal.selectedBlockId,blockDecision.supportLevel),reused:false,provenance:{lessonPlanId:context.lessonPlan.id,decisionPointId:event.id,targetRef:context.lessonPlan.targetRef,facet:context.lessonPlan.facet,sourceEvidenceIds:context.sourceEvidenceIds,observationIds:event.observationIds,supportBeforeDecision:event.support,selectedMechanismId:proposal.selectedBlockId,reasonCodes:['QUALIFIED_PROVIDER_DECISION'],provider:'AI',rejectionReasons:[]}}};
}

export async function decideInnerTutorV1(input:InnerTutorDecisionInputV1):Promise<QualifiedInnerTutorDecisionV1>{
  if(!isPedagogicalDecisionPointV1(input))throw new Error('event_is_not_a_pedagogical_decision_point');
  if(input.currentDecision?.configuration.decisionPointId===input.event.id){const action=String(input.currentDecision.configuration.teacherAction) as LegalTeacherActionV1,prior=input.currentProvenance;return{action,blockDecision:input.currentDecision,experience:experience(action,input.currentDecision.selectedBlockId,input.currentDecision.supportLevel),reused:true,provenance:prior?{...prior,reasonCodes:[...prior.reasonCodes,'IDEMPOTENT_REPLAY']}:{lessonPlanId:input.lessonPlan.id,decisionPointId:input.event.id,targetRef:input.lessonPlan.targetRef,facet:input.lessonPlan.facet,sourceEvidenceIds:[],observationIds:input.event.observationIds,supportBeforeDecision:input.event.support,selectedMechanismId:input.currentDecision.selectedBlockId,reasonCodes:['IDEMPOTENT_REPLAY'],provider:'DETERMINISTIC_FALLBACK',rejectionReasons:[]}}}
  const context=compilePedagogicalContextV1(input),providerContext=withFTeachingContextV1(context,input.event,input.currentDecision?.selectedBlockId);
  let rejected:string[]=[];
  const treatmentRequest=fRequest(context,input.event,input.currentDecision?.selectedBlockId),episodeDecision=deriveAdaptiveTeacherEpisodeDecisionV1(treatmentRequest);
  const treatmentResponse=input.currentDecision?{mechanismId:input.currentDecision.selectedBlockId,support:input.event.support,outcome:input.event.outcome,eventId:input.event.id,occurredAt:input.event.occurredAt,responseSignal:input.event.learnerIntent==='IMPASSE_REPLAN'?'CONFUSED' as const:undefined,feedbackTiming:episodeDecision.feedbackTiming,taskLoadAttribution:episodeDecision.taskLoadAttribution,learnerActionObserved:input.event.kind==='LEARNER_RESPONSE'||input.event.kind==='LEARNER_MANIPULATION',targetRef:input.lessonPlan.targetRef,facet:input.lessonPlan.facet as TeachingRequestV1['facet'],contextFamily:treatmentRequest.contextFamily,learnerStateBand:context.targetProjection?.state,confounds:treatmentConfoundsV1({support:input.event.support,taskLoadAttribution:episodeDecision.taskLoadAttribution,recentModelPrime:input.event.productionConditions?.assistance.recentModelPrime}),strength:'TR_OBSERVED_RESPONSE' as const}:undefined;
  const modelCall=teacherModelCallRouteV1(context,input.event),finish=(decision:QualifiedInnerTutorDecisionV1)=>puzzleFlowFor(input,context,{...decision,treatmentResponse,provenance:{...decision.provenance,modelCall}});
  if(context.timeRemainingMinutes<=0||input.event.kind==='TIME_EXHAUSTED'){
    const deterministic=fallback(context,input.event,input.currentDecision?.selectedBlockId),qualified=qualifyInnerTutorProposalV1(context,input.event,deterministic.proposal,input.currentDecision?.selectedBlockId);
    if(!qualified.accepted)throw new Error(`deterministic_inner_tutor_failed:${qualified.reasons.join(',')}`);
    return finish({...qualified.decision,lineage:{context:providerContext,proposal:deterministic.proposal,qualification:{accepted:true,reasonCodes:deterministic.reasons,validatorVersion:'E_INNER_TUTOR_V1'}},provenance:{...qualified.decision.provenance,reasonCodes:deterministic.reasons,provider:'DETERMINISTIC_FALLBACK',rejectionReasons:[]}});
  }
  if(modelCall.route!=='MODEL_REQUIRED'){const deterministic=fallback(context,input.event,input.currentDecision?.selectedBlockId),qualified=qualifyInnerTutorProposalV1(context,input.event,deterministic.proposal,input.currentDecision?.selectedBlockId);if(!qualified.accepted)throw new Error(`deterministic_inner_tutor_failed:${qualified.reasons.join(',')}`);return finish({...qualified.decision,lineage:{context:providerContext,proposal:deterministic.proposal,qualification:{accepted:true,reasonCodes:[...deterministic.reasons,modelCall.route],validatorVersion:'E_INNER_TUTOR_V1'}},provenance:{...qualified.decision.provenance,reasonCodes:[...deterministic.reasons,modelCall.route],provider:'DETERMINISTIC_FALLBACK',rejectionReasons:[]}})}
  try{const proposal=await input.provider(providerContext);const qualified=qualifyInnerTutorProposalV1(context,input.event,proposal,input.currentDecision?.selectedBlockId);if(qualified.accepted)return finish({...qualified.decision,lineage:{context:providerContext,proposal,qualification:{accepted:true,reasonCodes:['QUALIFIED_PROVIDER_DECISION'],validatorVersion:'E_INNER_TUTOR_V1'}},provenance:{...qualified.decision.provenance,providerReceipt:proposal.providerReceipt}});rejected=qualified.reasons}catch(error){rejected=[error instanceof Error?error.message:'teacher provider failed']}
  const deterministic=fallback(context,input.event,input.currentDecision?.selectedBlockId);
  const qualified=qualifyInnerTutorProposalV1(context,input.event,deterministic.proposal,input.currentDecision?.selectedBlockId);
  if(!qualified.accepted)throw new Error(`deterministic_inner_tutor_failed:${qualified.reasons.join(',')}`);
  return finish({...qualified.decision,lineage:{context:providerContext,proposal:deterministic.proposal,qualification:{accepted:true,reasonCodes:deterministic.reasons,validatorVersion:'E_INNER_TUTOR_V1'}},provenance:{...qualified.decision.provenance,reasonCodes:deterministic.reasons,provider:rejected.length?'FALLBACK_AFTER_REJECTION':'DETERMINISTIC_FALLBACK',rejectionReasons:rejected}});
}
