import type { CapabilityFacet } from '../../domain/english/EnglishDomain';
import type { CanonicalEvidenceEventV3, EvidenceCandidateV3 } from '../../domain/evidence/EvidenceCandidateV3';
import type { TaskContract,TaskFamily,ProductionConditionsV1 } from '../../domain/task/TaskContract';
import { guardEvidenceCandidateV3 } from '../evidence/evidenceGuardsV3';
import { enrichCanonicalEvidenceEventV1 } from '../../learner-truth/evidenceSemantics';
import type { CanonicalExamSubmissionResultV1 } from './examSubmissionAdapter';

type ExamTaskLike={task_id:string;family:string;canonicalBinding?:{units:readonly{unitId:string;responseKey:string;canonicalTargetRef:string;canonicalFacet:string;senseId?:string;evaluatorKind:'EXACT_KEY'|'SEMANTIC_RUBRIC'}[]}};
export interface ExamEvidenceAdmissionV1{unitId:string;status:'ACCEPTED'|'REJECTED'|'SKIPPED';reasons:readonly string[];proofMode?:'INDEPENDENT'|'ASSISTED';eventId?:string;occurredAt?:string;candidate?:EvidenceCandidateV3;taskContract?:TaskContract;canonicalEvent?:CanonicalEvidenceEventV3}
const family=(value:string,evaluatorKind:'EXACT_KEY'|'SEMANTIC_RUBRIC'):TaskFamily=>value==='WRITING'?'WRITING':value==='TRANSLATION'?'TRANSLATION':value==='MIXED'&&evaluatorKind==='SEMANTIC_RUBRIC'?'FREE_PRODUCTION':value==='READING'?'READING':'RECOGNITION';
const conditions=(clean:boolean):ProductionConditionsV1=>({elicitation:'AUTHENTIC_TASK',context:'SOURCE',taskLoad:'MEDIUM',assistance:{language:clean?'NONE':'LIGHT',selection:clean?'NONE':'LIGHT',functionCue:'NONE',planning:'NONE',taskLoad:'NONE',recentModelPrime:'NONE'}});
export function admitExamEvidenceV1(input:{learnerId:string;sessionId:string;task:ExamTaskLike;result:CanonicalExamSubmissionResultV1;support:'NONE'|'LIGHT'|'MEDIUM'|'EXPLICIT'|'MODEL'|'UNKNOWN';lookupExposure:readonly string[];supportByUnitId?:Readonly<Record<string,'NONE'|'LIGHT'|'MEDIUM'|'EXPLICIT'|'MODEL'|'UNKNOWN'>>;exposureByUnitId?:Readonly<Record<string,readonly string[]>>;freshnessIdentity:string;semanticEvidenceAuthorityByUnitId?:Readonly<Record<string,{candidateEvidenceAllowed:boolean;negativeEvidenceAllowed:boolean}>>;occurredAt?:string}):readonly ExamEvidenceAdmissionV1[]{
  const occurredAt=input.occurredAt??new Date().toISOString(),units=input.task.canonicalBinding?.units??[];
  return input.result.unitResults.map(result=>{
    if(result.outcome==='NOT_EVALUATED')return{unitId:result.unitId,status:'SKIPPED' as const,reasons:['NOT_EVALUATED_NEVER_BECOMES_LEARNER_EVIDENCE']};
    const bound=units.find(x=>x.unitId===result.unitId);if(!bound)return{unitId:result.unitId,status:'REJECTED' as const,reasons:['CANONICAL_BINDING_UNIT_MISSING']};
    if(bound.evaluatorKind==='SEMANTIC_RUBRIC'){
      const semantic=result.semanticAssessment,authority=semantic?{candidateEvidenceAllowed:semantic.candidateEvidenceAllowed,negativeEvidenceAllowed:semantic.negativeEvidenceAllowed}:input.semanticEvidenceAuthorityByUnitId?.[result.unitId];
      if(!authority?.candidateEvidenceAllowed)return{unitId:result.unitId,status:'SKIPPED' as const,reasons:['SEMANTIC_OUTCOME_NOT_QUALIFIED_FOR_EVIDENCE']};
      if(result.outcome==='FAILURE'&&!authority.negativeEvidenceAllowed)return{unitId:result.unitId,status:'SKIPPED' as const,reasons:['SEMANTIC_NEGATIVE_EVIDENCE_NOT_QUALIFIED']};
    }
    const unitSupport=input.supportByUnitId?.[result.unitId]??input.support,unitExposure=Object.freeze([...input.lookupExposure,...input.exposureByUnitId?.[result.unitId]??[]]),clean=unitSupport==='NONE'&&unitExposure.length===0,productionConditions=conditions(clean),claim={targetRef:result.targetRef,facet:result.facet as CapabilityFacet,senseId:result.senseId};
    const task:TaskContract={id:`exam-task:${input.task.task_id}:${result.unitId}`,purpose:'SOURCE_WORK',taskFamily:family(input.task.family,bound.evaluatorKind),targetRefs:[result.targetRef],contextNovelty:'SOURCE',responseOpenness:bound.evaluatorKind==='EXACT_KEY'?'CLOSED':'OPEN',supportExposed:unitExposure.length?['LOOKUP']:clean?['NONE']:['HINT'],meaningProvenance:'LEARNER_ORIGINATED',eligibleClaims:[claim],forbiddenClaims:[],productionConditions};
    const polarity=result.outcome==='SUCCESS'?'POSITIVE':result.outcome==='FAILURE'?'NEGATIVE':'UNKNOWN';
    const diagnosis=result.familyDiagnosis,diagnosticContext=diagnosis?` [${diagnosis.observationKind}; candidates=${diagnosis.candidateBottlenecks.join('|')}]`:'';
    const candidate:EvidenceCandidateV3={candidateKind:'CAPABILITY',observation:`Exam ${input.task.task_id} ${result.unitId} -> ${result.outcome}${diagnosticContext}`,capabilityFacet:claim.facet,senseId:claim.senseId,evidenceEligibility:'ELIGIBLE',evidencePolarity:polarity,evidenceScope:'LOCAL',productionMode:clean?'INDEPENDENT':'GUIDED',performanceDimension:bound.evaluatorKind==='SEMANTIC_RUBRIC'?'PRODUCTION':task.taskFamily==='READING'?'RECOGNITION':'RECOGNITION',supportBeforeResponse:clean?'NONE':unitExposure.length?'EXPLICIT':unitSupport,semanticProvenance:'LEARNER_ORIGINATED',contextNovelty:'SOURCE',confidence:result.outcome==='PARTIAL'?'LOW':'HIGH',competingExplanations:result.outcome==='PARTIAL'||result.outcome==='FAILURE'?(diagnosis?.candidateBottlenecks??['PARTIAL_RESPONSE_REQUIRES_FURTHER_DIAGNOSIS']):[],taskId:task.id,targetRef:claim.targetRef,taskAffordanceChecked:true,opportunityPresent:true,productionConditions};
    const eventId=`exam-evidence:${input.sessionId}:${input.freshnessIdentity}:${result.unitId}`,guarded=guardEvidenceCandidateV3({candidate,task,learnerId:input.learnerId,id:eventId,occurredAt});
    return guarded.accepted?{unitId:result.unitId,status:'ACCEPTED' as const,reasons:[],proofMode:clean?'INDEPENDENT' as const:'ASSISTED' as const,eventId,occurredAt,candidate,taskContract:task,canonicalEvent:enrichCanonicalEvidenceEventV1(guarded.event)}:{unitId:result.unitId,status:'REJECTED' as const,reasons:guarded.reasons,eventId,occurredAt,candidate,taskContract:task};
  });
}
