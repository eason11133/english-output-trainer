import type { CanonicalEvidenceEventV3 } from '../domain/evidence/EvidenceCandidateV3';
import type { ReencounterNeedV1 } from '../architecture/contracts';
import { scheduleReencounterV4, verificationDueV4 } from '../application/v4/reencounterSchedulerV4';

export interface LongitudinalTargetSnapshotV1{targetRef:string;facet:string;positive:number;negative:number;independent:number;changedContext:number;delayed:number;latestEvidenceAt?:string;retentionVerified:boolean;transferVerified:boolean;createsNegativeEvidenceFromSilence:false}
export interface FutureAllocationSignalV1{targetRef:string;facet:string;kind:'REPAIR'|'FADE_SUPPORT'|'TRANSFER'|'DELAYED_VERIFY'|'NATURAL_REENCOUNTER';priority:'LOW'|'MEDIUM'|'HIGH';reason:string;sourceEvidenceIds:readonly string[];canonicalTruthMutationAllowed:false}

export function longitudinalTargetSnapshotV1(targetRef:string,facet:string,evidence:readonly CanonicalEvidenceEventV3[]):LongitudinalTargetSnapshotV1{
 const relevant=evidence.filter(e=>e.targetRef===targetRef&&e.capabilityFacet===facet),positive=relevant.filter(e=>e.evidencePolarity==='POSITIVE'),negative=relevant.filter(e=>e.evidencePolarity==='NEGATIVE'),independent=positive.filter(e=>e.productionMode==='INDEPENDENT'),changed=independent.filter(e=>e.contextNovelty==='CHANGED_CONTEXT'),delayed=independent.filter(e=>e.contextNovelty==='DELAYED_CONTEXT'),latest=[...relevant].sort((a,b)=>Date.parse(b.occurredAt)-Date.parse(a.occurredAt))[0];
 return Object.freeze({targetRef,facet,positive:positive.length,negative:negative.length,independent:independent.length,changedContext:changed.length,delayed:delayed.length,latestEvidenceAt:latest?.occurredAt,retentionVerified:delayed.length>0,transferVerified:changed.length>0,createsNegativeEvidenceFromSilence:false});
}

export function futureAllocationSignalV1(input:{id:string;learnerId:string;targetRef:string;facet:any;evidence:CanonicalEvidenceEventV3[];now:string;naturalOpportunity?:boolean}):FutureAllocationSignalV1{
 const plan=scheduleReencounterV4(input);const kind:FutureAllocationSignalV1['kind']=plan.type==='IMMEDIATE_REPAIR'?'REPAIR':plan.type==='SAME_SESSION_FADE'?'FADE_SUPPORT':plan.type==='CHANGED_CONTEXT_TRANSFER'?'TRANSFER':plan.type==='DELAYED_PRODUCTION'?'DELAYED_VERIFY':'NATURAL_REENCOUNTER';return Object.freeze({targetRef:plan.targetRef,facet:plan.facet,kind,priority:plan.priority,reason:plan.reason,sourceEvidenceIds:Object.freeze([...plan.sourceEvidenceIds]),canonicalTruthMutationAllowed:false});
}

export function reencounterNeedV1(input:{targetRef:string;facet:string;latestEvidenceAt?:string;now:string;importance:'LOW'|'MEDIUM'|'HIGH';snapshot:LongitudinalTargetSnapshotV1}):ReencounterNeedV1|undefined{
 if(!input.latestEvidenceAt)return{targetRef:input.targetRef,kind:'TRANSFER',dueAt:input.now};
 if(!input.snapshot.transferVerified)return{targetRef:input.targetRef,kind:'TRANSFER',dueAt:input.now};
 const due=verificationDueV4(input.latestEvidenceAt,input.now,input.importance);if(!input.snapshot.retentionVerified&&due.due)return{targetRef:input.targetRef,kind:'DELAYED',dueAt:input.now};
 if(input.snapshot.retentionVerified&&due.due)return{targetRef:input.targetRef,kind:'RETENTION',dueAt:input.now};
 return undefined;
}

export function recurrenceTrendV1(evidence:readonly CanonicalEvidenceEventV3[]){const ordered=[...evidence].sort((a,b)=>Date.parse(a.occurredAt)-Date.parse(b.occurredAt));const last=ordered.slice(-5),failures=last.filter(e=>e.evidencePolarity==='NEGATIVE').length,successes=last.filter(e=>e.evidencePolarity==='POSITIVE').length;return Object.freeze({window:last.length,failures,successes,direction:last.length<2?'INSUFFICIENT':failures===0&&successes>1?'IMPROVING':failures>successes?'RECURRING_RISK':'MIXED',masteryMutationAllowed:false})}
