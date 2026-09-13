import type { CapabilityFacet } from '../domain/english/EnglishDomain';
import type { LearnerLexicalObservationV1, LexicalFacetV1 } from '../domain/english/lexicalLearnerState';
import type { CanonicalEvidenceEventV3 } from '../domain/evidence/EvidenceCandidateV3';
import { createLearnerObservationV1, type LearnerObservationV1 } from './observation';
import type { CanonicalObservationLedgerV1, ObservationAppendStatusV1 } from './observationLedger';

export type LexicalEncounterCaptureMethodV1='EOT_IN_APP_LOOKUP'|'EOT_CONTENT_EXPOSURE'|'QUICK_MANUAL_ADD'|'PLATFORM_SHARE_ADAPTER';
export type LexicalLookupDirectionV1='EN_TO_ZH'|'ZH_TO_EN';
export type LexicalEncounterPhaseV1='PRE_RESPONSE'|'POST_RESPONSE'|'EXPOSURE';
export type LexicalEncounterSourceTypeV1='EOT_CONTENT'|'BROWSER'|'CLASS'|'NOTE'|'MEDIA'|'OTHER_EXTERNAL'|'UNKNOWN';
export type LexicalResolutionStatusV1='RESOLVED'|'AMBIGUOUS'|'UNRESOLVED';
export type LexicalPrivacyScopeV1='EOT_REFERENCE_ONLY'|'EXTERNAL_MINIMIZED'|'LEARNER_KEPT_BOUNDED_CONTEXT';
export interface LexicalEncounterEventV1{
  schemaVersion:1;eventId:string;learnerId:string;sessionId?:string;occurredAt:string;immutable:true;
  captureMethod:LexicalEncounterCaptureMethodV1;sourceType:LexicalEncounterSourceTypeV1;sourceAnchor?:string;
  selectedSpan:string;normalizedTargetCandidate:string;phraseOrChunkCandidate?:string;canonicalTargetRef?:string;canonicalFacet?:CapabilityFacet;
  resolutionStatus:LexicalResolutionStatusV1;candidateSenseRefs:readonly string[];resolvedContextualSense?:string;
  lookupRequested:boolean;lookupResultExposed:boolean;userMarkedRemember:boolean;
  lookupDirection?:LexicalLookupDirectionV1;localContext?:string;sourceFamily?:string;taskId?:string;responsePhase?:LexicalEncounterPhaseV1;targetProtected?:boolean;
  provenanceRefs:readonly string[];privacyScope:LexicalPrivacyScopeV1;keptContext?:string;
  capabilityEvidenceAllowed:false;
}
export interface LexicalEncounterContextEnvelopeV1{selectedSpan:string;localFragment?:string;adjacentDiscourse?:string;keepContext?:boolean;maxPersistedContextCharacters?:number}
const normalize=(value:string)=>value.normalize('NFKC').toLocaleLowerCase('en').replace(/[’]/g,"'").replace(/\s+/g,' ').trim();
export function createLexicalEncounterEventV1(input:Omit<LexicalEncounterEventV1,'schemaVersion'|'immutable'|'capabilityEvidenceAllowed'|'selectedSpan'|'normalizedTargetCandidate'|'candidateSenseRefs'|'provenanceRefs'|'keptContext'>&{selectedSpan:string;normalizedTargetCandidate?:string;candidateSenseRefs?:readonly string[];provenanceRefs?:readonly string[];context?:LexicalEncounterContextEnvelopeV1}):LexicalEncounterEventV1{
 if(!input.eventId.trim())throw new Error('lexical_encounter_event_id_required');if(!input.learnerId.trim())throw new Error('lexical_encounter_learner_required');if(Number.isNaN(Date.parse(input.occurredAt)))throw new Error('lexical_encounter_time_invalid');
 const selectedSpan=input.selectedSpan.trim();if(!selectedSpan)throw new Error('lexical_encounter_selected_span_required');const keep=input.context?.keepContext===true,limit=Math.max(1,input.context?.maxPersistedContextCharacters??240),raw=input.context?.localFragment?.trim();
 return Object.freeze({...input,context:undefined,schemaVersion:1,immutable:true,capabilityEvidenceAllowed:false,selectedSpan,normalizedTargetCandidate:normalize(input.normalizedTargetCandidate??input.phraseOrChunkCandidate??selectedSpan),candidateSenseRefs:Object.freeze([...(input.candidateSenseRefs??[])]),provenanceRefs:Object.freeze([...(input.provenanceRefs??[])]),privacyScope:input.sourceType==='EOT_CONTENT'?'EOT_REFERENCE_ONLY':keep?'LEARNER_KEPT_BOUNDED_CONTEXT':'EXTERNAL_MINIMIZED',...(keep&&raw?{keptContext:raw.slice(0,limit)}:{})});
}
export function lexicalEncounterObservationV1(event:LexicalEncounterEventV1):LearnerObservationV1{return createLearnerObservationV1({id:event.eventId,learnerId:event.learnerId,occurredAt:event.occurredAt,kind:'LEXICAL_ENCOUNTER',source:'LEARNER',action:event.lookupRequested?'CONTEXTUAL_LOOKUP_INVOKED':'LEXICAL_ENCOUNTER_CAPTURED',episodeId:event.sessionId,sourceConfidence:event.resolutionStatus==='RESOLVED'?'HIGH':'UNKNOWN',capabilityEvidenceAllowed:false,payload:{lexicalEncounterJson:JSON.stringify(event)}})}

export function contentExposureEventV1(input:{learnerId:string;sessionId:string;contentIdentity:string;span:string;sourceFamily:string;taskId?:string;occurredAt:string}):LexicalEncounterEventV1{return createLexicalEncounterEventV1({eventId:`exposure:${input.learnerId}:${input.sessionId}:${input.contentIdentity}:${normalize(input.span)}`,learnerId:input.learnerId,sessionId:input.sessionId,occurredAt:input.occurredAt,captureMethod:'EOT_CONTENT_EXPOSURE',sourceType:'EOT_CONTENT',sourceAnchor:input.contentIdentity,selectedSpan:input.span,normalizedTargetCandidate:input.span,resolutionStatus:'UNRESOLVED',lookupRequested:false,lookupResultExposed:false,userMarkedRemember:false,lookupDirection:/[\u3400-\u9fff]/.test(input.span)?'ZH_TO_EN':'EN_TO_ZH',localContext:input.span,sourceFamily:input.sourceFamily,taskId:input.taskId,responsePhase:'EXPOSURE',targetProtected:false,provenanceRefs:[input.contentIdentity],privacyScope:'EOT_REFERENCE_ONLY'})}
export function lexicalEncounterFromObservationV1(observation:LearnerObservationV1):LexicalEncounterEventV1|undefined{if(observation.kind!=='LEXICAL_ENCOUNTER'||typeof observation.payload.lexicalEncounterJson!=='string')return undefined;try{const value=JSON.parse(observation.payload.lexicalEncounterJson);return value?.schemaVersion===1&&value?.immutable===true&&value?.capabilityEvidenceAllowed===false?value:undefined}catch{return undefined}}
export class CanonicalLexicalEncounterStoreV1{
 constructor(private readonly ledger:CanonicalObservationLedgerV1){}
 append(event:LexicalEncounterEventV1):Promise<ObservationAppendStatusV1>{return this.ledger.appendIdempotent(lexicalEncounterObservationV1(event))}
 async listForLearner(learnerId:string){return Object.freeze((await this.ledger.listForLearner(learnerId)).flatMap(x=>{const event=lexicalEncounterFromObservationV1(x);return event?[event]:[]}))}
}

export type LexicalOperationTrackV1='RECOGNITION_COMPREHENSION'|'RETRIEVAL'|'PRODUCTION_USE';
export type LexicalReactivationStateV1='NEW_OR_UNSEEN'|'ENCOUNTERED_ONLY'|'ASSISTED_OR_LOOKED_UP'|'PREVIOUSLY_AVAILABLE_NOW_UNCERTAIN'|'PREVIOUSLY_AVAILABLE_NOW_FAILED'|'CURRENTLY_AVAILABLE';
export interface OperationSpecificLexicalProjectionV1{learnerId:string;targetRef:string;facet:string;operation:LexicalOperationTrackV1;state:LexicalReactivationStateV1;encounterCount:number;lookupCount:number;historicalIndependentAttainment:boolean;latestIndependentOutcome?:'SUCCESS'|'FAILURE';sourceEventIds:readonly string[];preciseRecallProbabilityAvailable:false}
const trackForFacet=(facet:string):LexicalOperationTrackV1=>/RETRIEVAL/.test(facet)?'RETRIEVAL':/PRODUCT|COLLOCATION_CONTROL|PHRASE_CHUNK_CONTROL|MORPHOLOGY_FORM_CONTROL|SPELLING/.test(facet)?'PRODUCTION_USE':'RECOGNITION_COMPREHENSION';
export function projectOperationSpecificLexicalMemoryV1(input:{learnerId:string;targetRef:string;facet:string;senseId?:string;operation:LexicalOperationTrackV1;encounters:readonly LexicalEncounterEventV1[];lexicalObservations?:readonly LearnerLexicalObservationV1[];canonicalEvidence?:readonly CanonicalEvidenceEventV3[]}):OperationSpecificLexicalProjectionV1{
 const encounters=input.encounters.filter(x=>x.learnerId===input.learnerId&&x.canonicalTargetRef===input.targetRef&&(!input.senseId||x.resolvedContextualSense===input.senseId||x.candidateSenseRefs.includes(input.senseId))),lookup=encounters.filter(x=>x.lookupResultExposed);
 const observations=(input.lexicalObservations??[]).filter(x=>x.learnerId===input.learnerId&&trackForFacet(x.facet)===input.operation&&(!input.senseId||x.identity.senseId===input.senseId));
 const evidence=(input.canonicalEvidence??[]).filter(x=>x.learnerId===input.learnerId&&(x.canonicalTargetRef??x.targetRef)===input.targetRef&&String(x.capabilityFacet)===input.facet&&trackForFacet(String(x.capabilityFacet))===input.operation);
 const independent=[...observations.filter(x=>x.evidenceEligible&&x.support==='NONE').map(x=>({id:x.id,at:x.occurredAt,success:x.control!=='NEEDS_WORK'})),...evidence.map(x=>({id:x.id,at:x.occurredAt,success:true}))].sort((a,b)=>a.at.localeCompare(b.at));const attained=independent.some(x=>x.success),latest=independent.at(-1);
 const state:LexicalReactivationStateV1=latest?.success?'CURRENTLY_AVAILABLE':latest&&!latest.success&&attained?'PREVIOUSLY_AVAILABLE_NOW_FAILED':attained?'PREVIOUSLY_AVAILABLE_NOW_UNCERTAIN':lookup.length?'ASSISTED_OR_LOOKED_UP':encounters.length?'ENCOUNTERED_ONLY':'NEW_OR_UNSEEN';
 return Object.freeze({learnerId:input.learnerId,targetRef:input.targetRef,facet:input.facet,operation:input.operation,state,encounterCount:encounters.length,lookupCount:lookup.length,historicalIndependentAttainment:attained,latestIndependentOutcome:latest?(latest.success?'SUCCESS':'FAILURE'):undefined,sourceEventIds:Object.freeze([...encounters.map(x=>x.eventId),...independent.map(x=>x.id)]),preciseRecallProbabilityAvailable:false});
}
export interface LexicalTodayPrioritySignalV1{targetRef:string;facet:string;operation:LexicalOperationTrackV1;repeatedEncounter:boolean;repeatedLookup:boolean;userWantsToRemember:boolean;recentFailure:boolean;reactivationRisk:boolean;crossFamilyTransferValue:boolean;priorityBoost:number;reasonCodes:readonly ('REPEATED_ENCOUNTER'|'REPEATED_LOOKUP'|'USER_WANTS_TO_REMEMBER'|'RECENT_LEXICAL_FAILURE'|'RETENTION_REACTIVATION_RISK'|'CROSS_FAMILY_TRANSFER_VALUE')[];capabilityDelta:0}
export function lexicalTodayPrioritySignalV1(input:{projection:OperationSpecificLexicalProjectionV1;encounters:readonly LexicalEncounterEventV1[];crossFamilyTransferValue?:boolean}):LexicalTodayPrioritySignalV1{const relevant=input.encounters.filter(x=>x.canonicalTargetRef===input.projection.targetRef||x.normalizedTargetCandidate===input.projection.targetRef),reasons:LexicalTodayPrioritySignalV1['reasonCodes'][number][]=[],repeatedEncounter=relevant.length>=2,repeatedLookup=relevant.filter(x=>x.lookupResultExposed).length>=2,userWantsToRemember=relevant.some(x=>x.userMarkedRemember),recentFailure=input.projection.latestIndependentOutcome==='FAILURE',reactivationRisk=input.projection.state==='PREVIOUSLY_AVAILABLE_NOW_FAILED'||input.projection.state==='PREVIOUSLY_AVAILABLE_NOW_UNCERTAIN';if(repeatedEncounter)reasons.push('REPEATED_ENCOUNTER');if(repeatedLookup)reasons.push('REPEATED_LOOKUP');if(userWantsToRemember)reasons.push('USER_WANTS_TO_REMEMBER');if(recentFailure)reasons.push('RECENT_LEXICAL_FAILURE');if(reactivationRisk)reasons.push('RETENTION_REACTIVATION_RISK');if(input.crossFamilyTransferValue)reasons.push('CROSS_FAMILY_TRANSFER_VALUE');return Object.freeze({targetRef:input.projection.targetRef,facet:input.projection.facet,operation:input.projection.operation,repeatedEncounter,repeatedLookup,userWantsToRemember,recentFailure,reactivationRisk,crossFamilyTransferValue:input.crossFamilyTransferValue??false,priorityBoost:Math.min(24,reasons.length*4),reasonCodes:Object.freeze(reasons),capabilityDelta:0})}

export const lexicalReencounterCuePolicyV1=Object.freeze({enabled:true,minLookupCount:2,minEncounterCount:3});
export function shouldShowLexicalReencounterCueV1(events:readonly LexicalEncounterEventV1[],normalizedTargetCandidate:string){
 if(!lexicalReencounterCuePolicyV1.enabled)return false;
 const relevant=events.filter(x=>x.normalizedTargetCandidate===normalizedTargetCandidate);
 return relevant.some(x=>x.userMarkedRemember)||relevant.filter(x=>x.lookupResultExposed).length>=lexicalReencounterCuePolicyV1.minLookupCount||relevant.length>=lexicalReencounterCuePolicyV1.minEncounterCount;
}
