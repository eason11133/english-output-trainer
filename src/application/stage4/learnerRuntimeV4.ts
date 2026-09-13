import { blockRegistryV4, validateTeacherBlockDecisionV4 } from '../v4/blockRegistryV4';
import { applyBlockEventV4, blockEventToEvidenceCandidateV4, createBlockRuntimeV4, fadeSupportV4 } from '../v4/blockRuntimeV4';
import { EvidenceCandidateV3 } from '../../domain/evidence/EvidenceCandidateV3';
import { ArtifactSpanV4, OriginalArtifactV4, RuntimeTraceEntryV4, SourceConfirmationV4, Stage4RuntimeV4 } from '../../domain/stage4/LearnerRuntimeV4';
import { BlockLearnerEventTypeV4, TeacherBlockDecisionV4 } from '../../domain/v4/LearningBlockV4';
import type { ProductionConditionsV1 } from '../../domain/task/TaskContract';
import { createLearnerObservationV1 } from '../../learner-truth/observation';

const id=(prefix:string)=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
const trace=(kind:RuntimeTraceEntryV4['kind'],payload:Record<string,unknown>,fixture=false):RuntimeTraceEntryV4=>({id:id('trace'),occurredAt:new Date().toISOString(),kind,fixture,payload});
const freezeArtifact=(artifact:OriginalArtifactV4):OriginalArtifactV4=>Object.freeze({...artifact,pages:Object.freeze(artifact.pages.map(page=>Object.freeze({...page})))});

export function createOriginalArtifactV4(input:Omit<OriginalArtifactV4,'schemaVersion'|'immutable'>):OriginalArtifactV4 {
  if(!input.pages.length) throw new Error('original_artifact_requires_page');
  return freezeArtifact({...input,schemaVersion:4,immutable:true});
}
export function beginStage4RuntimeV4(artifact:OriginalArtifactV4,spans:ArtifactSpanV4[],fixture=false):Stage4RuntimeV4 {
  const learnerSpans=spans.filter(span=>span.region==='LEARNER_WRITING');
  const rawText=artifact.pages.map(page=>page.originalText??'').filter(Boolean).join('\n');
  const usableSourceText=(learnerSpans.length?learnerSpans.map(span=>span.text).join('\n'):rawText).trim();
  const needsReview=decisionRelevantUncertaintyV4(spans).length>0;
  const submittedObservation=createLearnerObservationV1({
    id:id('observation'),
    learnerId:artifact.learnerId,
    occurredAt:artifact.submittedAt,
    kind:'ARTIFACT_SUBMITTED',
    source:'LEARNER',
    action:'ARTIFACT_SUBMITTED',
    artifactId:artifact.id,
    sourceConfidence:'HIGH',
    capabilityEvidenceAllowed:false,
    payload:{source:artifact.source,mode:artifact.mode,pages:artifact.pages.length},
  });
  const transcriptionObservation=createLearnerObservationV1({
    id:id('observation'),
    learnerId:artifact.learnerId,
    occurredAt:new Date().toISOString(),
    kind:'TRANSCRIPTION_CAPTURED',
    source:'OCR',
    action:'TRANSCRIPTION_CAPTURED',
    artifactId:artifact.id,
    sourceConfidence:needsReview?'LOW':'HIGH',
    capabilityEvidenceAllowed:false,
    payload:{spanCount:spans.length,decisionRelevantUncertainty:needsReview},
  });
  return {id:id('runtime'),learnerId:artifact.learnerId,artifact,spans:[...spans],confirmations:[],usableSourceText,status:needsReview?'SOURCE_REVIEW':'READY',blockEvents:[],observations:[submittedObservation,transcriptionObservation],evidenceCandidates:[],trace:[trace('ARTIFACT_CREATED',{artifactId:artifact.id,source:artifact.source,pages:artifact.pages.length},fixture),trace('TRANSCRIPTION_RECORDED',{spanCount:spans.length},fixture)]};
}
export function decisionRelevantUncertaintyV4(spans:ArtifactSpanV4[]):ArtifactSpanV4[]{
  return spans.filter(span=>(span.region==='LEARNER_WRITING'||span.region==='PRINTED_PROMPT'||span.region==='UNKNOWN')&&span.confidence==='LOW'&&span.alternatives.length>0);
}
export function confirmSourceSpanV4(runtime:Stage4RuntimeV4,spanId:string,confirmedText:string):Stage4RuntimeV4 {
  const span=runtime.spans.find(item=>item.id===spanId);if(!span)throw new Error('span_not_found');
  const confirmation:SourceConfirmationV4={id:id('confirmation'),artifactId:runtime.artifact.id,spanId,observedText:span.text,confirmedText,occurredAt:new Date().toISOString(),eventType:confirmedText===span.text?'TRANSCRIPT_CONFIRMED':'OCR_ERROR_CORRECTED'};
  const spans=runtime.spans.map(item=>item.id===spanId?{...item,text:confirmedText,confidence:'HIGH' as const,alternatives:[]}:item);
  const usableSourceText=spans.filter(item=>item.region==='LEARNER_WRITING').map(item=>item.text).join('\n').trim();
  const observation=createLearnerObservationV1({
    id:confirmation.id,
    learnerId:runtime.learnerId,
    occurredAt:confirmation.occurredAt,
    kind:'SOURCE_CONFIRMATION',
    source:'LEARNER',
    action:confirmation.eventType,
    artifactId:runtime.artifact.id,
    episodeId:runtime.id,
    sourceConfidence:'HIGH',
    capabilityEvidenceAllowed:false,
    payload:{spanId,changed:confirmedText!==span.text},
  });
  return {...runtime,spans,confirmations:[...runtime.confirmations,confirmation],observations:[...(runtime.observations??[]),observation],usableSourceText,status:decisionRelevantUncertaintyV4(spans).length?'SOURCE_REVIEW':'READY',trace:[...runtime.trace,trace('SOURCE_CONFIRMATION',{...confirmation})]};
}
export function selectBlockV4(runtime:Stage4RuntimeV4,decision:TeacherBlockDecisionV4,fixture=false):Stage4RuntimeV4 {
  if(runtime.status==='SOURCE_REVIEW')throw new Error('decision_relevant_transcript_uncertainty');
  const errors=validateTeacherBlockDecisionV4(decision);if(errors.length)throw new Error(`invalid_block_decision:${errors.join(',')}`);
  const block=blockRegistryV4.get(decision.selectedBlockId);if(!block)throw new Error('unregistered_block');
  return {...runtime,status:'LEARNING',decision,blockState:createBlockRuntimeV4(id('block'),block.id,decision.supportLevel),trace:[...runtime.trace,trace('TEACHER_DECISION',{objectiveId:decision.objectiveId,targetReference:decision.targetReference,focus:decision.focus,pedagogicalIntent:decision.pedagogicalIntent,selectedBlockId:decision.selectedBlockId,supportLevel:decision.supportLevel,decisionPointId:decision.configuration.decisionPointId,decisionProvider:decision.configuration.decisionProvider,decisionReasonCodes:decision.configuration.decisionReasonCodes},fixture)]};
}
export function recordBlockEventStage4V4(runtime:Stage4RuntimeV4,type:BlockLearnerEventTypeV4,payload:Record<string,string|number|boolean>,success=false,productionConditions?:ProductionConditionsV1):Stage4RuntimeV4 {
  if(!runtime.blockState||!runtime.decision)throw new Error('block_not_selected');const block=blockRegistryV4.get(runtime.blockState.blockId);if(!block)throw new Error('unregistered_block');
  const event={id:id('event'),instanceId:runtime.blockState.instanceId,type,payload,supportLevel:runtime.blockState.supportLevel,visibleBeforeResponse:[...runtime.blockState.visibleBeforeResponse],occurredAt:new Date().toISOString(),productionConditions};
  const blockState=applyBlockEventV4(runtime.blockState,event);const rawCandidate=blockEventToEvidenceCandidateV4(block,runtime.blockState,event,success,runtime.decision.evidenceToObserve[0]);
  const capabilityOpportunity=rawCandidate.candidateKind==='CAPABILITY'&&['ANSWER_SUBMITTED','BLOCK_COMPLETED'].includes(type);
  const candidate:EvidenceCandidateV3={...rawCandidate,observationId:event.id,artifactId:runtime.artifact.id,episodeId:runtime.id,opportunityPresent:capabilityOpportunity?true:undefined};
  const observation=createLearnerObservationV1({
    id:event.id,
    learnerId:runtime.learnerId,
    occurredAt:event.occurredAt,
    kind:type==='HINT_REQUESTED'||type==='SUPPORT_REVEALED'?'SUPPORT_REQUEST':'LEARNER_ACTION',
    source:'LEARNER',
    action:type,
    artifactId:runtime.artifact.id,
    taskId:typeof payload.taskId==='string'?payload.taskId:undefined,
    episodeId:runtime.id,
    sourceConfidence:'HIGH',
    capabilityEvidenceAllowed:capabilityOpportunity,
    payload:{...payload,success,supportLevel:event.supportLevel,elicitationCondition:event.productionConditions?.elicitation??'UNKNOWN',languageAssistance:event.productionConditions?.assistance.language??'UNKNOWN',selectionAssistance:event.productionConditions?.assistance.selection??'UNKNOWN',functionCueAssistance:event.productionConditions?.assistance.functionCue??'UNKNOWN',planningAssistance:event.productionConditions?.assistance.planning??'UNKNOWN',taskLoadAssistance:event.productionConditions?.assistance.taskLoad??'UNKNOWN',recentModelPrime:event.productionConditions?.assistance.recentModelPrime??'UNKNOWN',productionContext:event.productionConditions?.context??'UNKNOWN',productionTaskLoad:event.productionConditions?.taskLoad??'UNKNOWN'},
  });
  const status=type==='RETURNED_TO_SOURCE'?'RETURNED':runtime.status;
  return {...runtime,status,blockState,blockEvents:[...runtime.blockEvents,event],observations:[...(runtime.observations??[]),observation],evidenceCandidates:[...runtime.evidenceCandidates,candidate],trace:[...runtime.trace,trace('BLOCK_EVENT',{type,eventId:event.id,supportLevel:event.supportLevel,visibleBeforeResponse:event.visibleBeforeResponse,productionConditions:event.productionConditions}),trace('EVIDENCE_GUARD',{candidateKind:candidate.candidateKind,evidenceEligibility:candidate.evidenceEligibility,productionMode:candidate.productionMode,contextNovelty:candidate.contextNovelty})]};
}
export function revealSupportStage4V4(runtime:Stage4RuntimeV4,visible:string):Stage4RuntimeV4{return recordBlockEventStage4V4(runtime,'SUPPORT_REVEALED',{visible},false)}
export function fadeSupportStage4V4(runtime:Stage4RuntimeV4):Stage4RuntimeV4 {if(!runtime.blockState)throw new Error('block_not_selected');return{...runtime,blockState:fadeSupportV4(runtime.blockState)}}
export function correctInterpretationStage4V4(runtime:Stage4RuntimeV4,interpretation:string):Stage4RuntimeV4{
  const occurredAt=new Date().toISOString(),observation=createLearnerObservationV1({id:id('observation'),learnerId:runtime.learnerId,occurredAt,kind:'SOURCE_INTENT',source:'LEARNER',action:'INTERPRETATION_CORRECTED',artifactId:runtime.artifact.id,episodeId:runtime.id,sourceConfidence:'HIGH',capabilityEvidenceAllowed:false,payload:{interpretation}});
  return{...runtime,interpretation,observations:[...(runtime.observations??[]),observation],trace:[...runtime.trace,trace('INTERPRETATION_CORRECTED',{interpretation})]}
}
export function confirmSourceIntentStage4V4(runtime:Stage4RuntimeV4,interpretation:string):Stage4RuntimeV4{
  const occurredAt=new Date().toISOString(),observation=createLearnerObservationV1({id:id('observation'),learnerId:runtime.learnerId,occurredAt,kind:'SOURCE_INTENT',source:'LEARNER',action:'SOURCE_INTENT_CONFIRMED',artifactId:runtime.artifact.id,episodeId:runtime.id,sourceConfidence:'HIGH',capabilityEvidenceAllowed:false,payload:{interpretation}});
  return{...runtime,interpretation,observations:[...(runtime.observations??[]),observation],trace:[...runtime.trace,trace('SOURCE_CONFIRMATION',{eventType:'SOURCE_INTENT_CONFIRMED',artifactId:runtime.artifact.id,interpretation})]}
}
export function pauseStage4V4(runtime:Stage4RuntimeV4):Stage4RuntimeV4{return{...runtime,status:'PAUSED',trace:[...runtime.trace,trace('PAUSED',{})]}}
export function sourceConfirmationCandidateV4(confirmation:SourceConfirmationV4):EvidenceCandidateV3{return{candidateKind:'OCR_CORRECTION',observation:`${confirmation.observedText} -> ${confirmation.confirmedText}`,evidenceEligibility:'INELIGIBLE',evidencePolarity:'NOT_APPLICABLE',evidenceScope:'NOT_APPLICABLE',productionMode:'NOT_PRODUCTION',supportBeforeResponse:'NONE',semanticProvenance:'ARTIFACT_SUPPORTED',contextNovelty:'NOT_APPLICABLE',confidence:'HIGH',competingExplanations:[],taskAffordanceChecked:true,artifactId:confirmation.artifactId,observationId:confirmation.id,opportunityPresent:false}}
