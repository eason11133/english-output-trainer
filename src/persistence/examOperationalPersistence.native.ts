import type { LessonPlanV1 } from '../architecture/contracts';
import type { CanonicalEvidenceEventV3, EvidenceCandidateV3 } from '../domain/evidence/EvidenceCandidateV3';
import type { TaskContract } from '../domain/task/TaskContract';
import { createLearnerObservationV1 } from '../learner-truth/observation';
import { teacherDecisionToExperienceContractV1 } from '../experience/teacherDecisionExperience';
import { teacherModelRunDescriptorV1 } from '../model';
import type { ExamOperationalRuntimeV1 } from './operationalTypes';
import { composeTreatmentPersistenceV1 } from './treatmentChronology';
import { fingerprintV1 } from './identity';
import { operationalDatabaseV1 } from './operationalDatabase';
import type { QualifiedInnerTutorDecisionV1 } from '../teacher-runtime';

export interface ExamEvidencePersistenceUnitV1{
  unitId:string;
  status:'ACCEPTED'|'REJECTED'|'SKIPPED';
  reasons:readonly string[];
  eventId?:string;
  occurredAt?:string;
  candidate?:EvidenceCandidateV3;
  taskContract?:TaskContract;
  canonicalEvent?:CanonicalEvidenceEventV3;
}

export async function saveExamOperationalCheckpointV1(lessonPlan:LessonPlanV1,runtime:ExamOperationalRuntimeV1){
  return operationalDatabaseV1.commitSessionCheckpoint({envelope:{operationId:`exam-session:${runtime.id}:${runtime.updatedAt}`,learnerId:runtime.learnerId,occurredAt:runtime.updatedAt,inputFingerprint:await fingerprintV1({lessonPlan,runtime}),correlationId:runtime.id},lessonPlan,runtime});
}

export async function loadExamOperationalCheckpointV1(learnerId:string,sessionId:string):Promise<{lessonPlan:LessonPlanV1;runtime:ExamOperationalRuntimeV1}|null>{
  const db=operationalDatabaseV1 as typeof operationalDatabaseV1&{loadSessionBundleById(learnerId:string,sessionId:string):Promise<{lessonPlan:LessonPlanV1;runtime:unknown}|null>};
  const bundle=await db.loadSessionBundleById(learnerId,sessionId);
  if(!bundle||!bundle.runtime||typeof bundle.runtime!=='object'||(bundle.runtime as {runtimeKind?:unknown}).runtimeKind!=='EXAM')return null;
  return bundle as {lessonPlan:LessonPlanV1;runtime:ExamOperationalRuntimeV1};
}

export async function loadActiveExamOperationalCheckpointV1(learnerId:string,family?:string):Promise<{lessonPlan:LessonPlanV1;runtime:ExamOperationalRuntimeV1}|null>{
  const db=operationalDatabaseV1 as typeof operationalDatabaseV1&{loadActiveExamSessionBundle(learnerId:string,family?:string):Promise<{lessonPlan:LessonPlanV1;runtime:unknown}|null>};
  const bundle=await db.loadActiveExamSessionBundle(learnerId,family);
  if(!bundle||!bundle.runtime||typeof bundle.runtime!=='object'||(bundle.runtime as {runtimeKind?:unknown}).runtimeKind!=='EXAM')return null;
  const runtime=bundle.runtime as ExamOperationalRuntimeV1;if(runtime.status==='COMPLETED')return null;return{lessonPlan:bundle.lessonPlan,runtime};
}

export async function persistExamEvidenceAdmissionsV1(input:{
  learnerId:string;sessionId:string;lessonPlan:LessonPlanV1;runtime:ExamOperationalRuntimeV1;units:readonly ExamEvidencePersistenceUnitV1[];
}){
  const results=[] as {unitId:string;status:string}[];
  for(const unit of input.units){
    if(unit.status==='SKIPPED'||!unit.candidate||!unit.taskContract||!unit.eventId||!unit.occurredAt){results.push({unitId:unit.unitId,status:'SKIPPED'});continue}
    const observationId=`exam-observation:${input.runtime.attemptId}:${unit.unitId}`;
    const observation=createLearnerObservationV1({id:observationId,learnerId:input.learnerId,occurredAt:unit.occurredAt,kind:'LEARNER_ACTION',source:'LEARNER',action:'EXAM_RESPONSE_SUBMITTED',taskId:unit.taskContract.id,sourceConfidence:'HIGH',capabilityEvidenceAllowed:unit.status==='ACCEPTED',payload:{unitId:unit.unitId,outcome:unit.candidate.evidencePolarity,proofMode:unit.candidate.productionMode}});
    const candidate={...unit.candidate,observationId};
    const accepted=unit.status==='ACCEPTED';
    const canonicalEvidence=accepted&&unit.canonicalEvent?{...unit.canonicalEvent,observationId,provenance:unit.canonicalEvent.provenance?{...unit.canonicalEvent.provenance,observationId}:unit.canonicalEvent.provenance}:undefined;
    const conditions=candidate.productionConditions;
    if(!conditions){results.push({unitId:unit.unitId,status:'SKIPPED_NO_CONDITIONS'});continue}
    const command={envelope:{operationId:`${input.runtime.submitActionId}:evidence:${unit.unitId}`,learnerId:input.learnerId,occurredAt:unit.occurredAt,inputFingerprint:'',causationId:observationId,correlationId:input.sessionId},observation,evaluation:{id:`exam-evaluation:${input.runtime.attemptId}:${unit.unitId}`,evaluatorId:'EXAM_CANONICAL_UNIT_V1',evaluatorVersion:'v1',result:{polarity:candidate.evidencePolarity,status:unit.status,reasons:unit.reasons}},candidate:{id:`exam-candidate:${input.runtime.attemptId}:${unit.unitId}`,value:candidate},admission:{id:`exam-admission:${input.runtime.attemptId}:${unit.unitId}`,accepted,reasonCodes:unit.reasons,authority:'C/K' as const},canonicalEvidence,conditions:{elicitation:conditions.elicitation==='AUTHENTIC_TASK'?'AUTHENTIC' as const:'UNKNOWN' as const,supportCeiling:candidate.supportBeforeResponse,supportVisibleBeforeResponse:candidate.supportBeforeResponse,answerExposed:candidate.supportBeforeResponse==='MODEL',recentModelPrime:conditions.assistance.recentModelPrime!=='NONE',contextProvenance:candidate.contextNovelty,freshIndependentEligible:candidate.productionMode==='INDEPENDENT'&&candidate.supportBeforeResponse==='NONE',taskId:unit.taskContract.id,opportunityId:unit.eventId},sessionCheckpoint:{lessonPlan:input.lessonPlan,runtime:input.runtime}};
    command.envelope.inputFingerprint=await fingerprintV1({...command,envelope:{...command.envelope,inputFingerprint:undefined}});
    const persisted=await operationalDatabaseV1.commitEvidenceChain(command);
    results.push({unitId:unit.unitId,status:persisted.status});
  }
  return results;
}

export async function persistExamTeacherLineageV1(input:{
  learnerId:string;sessionId:string;lessonPlan:LessonPlanV1;runtime:ExamOperationalRuntimeV1;decision:QualifiedInnerTutorDecisionV1;previousDecision?:QualifiedInnerTutorDecisionV1;occurredAt?:string;
}){
  const decision=input.decision;if(!decision.lineage)return{status:'SKIPPED_NO_LINEAGE' as const};
  const occurredAt=input.occurredAt??input.runtime.updatedAt,point=decision.provenance.decisionPointId,experience=teacherDecisionToExperienceContractV1(decision),modelRun=teacherModelRunDescriptorV1(decision.provenance.provider),previous=input.previousDecision;
  const priorMeta=previous?input.runtime.decisionHistory.find(item=>item.decisionPointId===previous.provenance.decisionPointId):undefined;
  const treatment=composeTreatmentPersistenceV1({episodeId:`exam-episode:${input.sessionId}:${decision.provenance.targetRef}:${decision.provenance.facet}`,targetRef:decision.provenance.targetRef,facet:decision.provenance.facet,currentMove:['TEACH','REPAIR','PRACTICE','CHECK'].includes(decision.action)?{decisionPointId:point,mechanismId:decision.provenance.selectedMechanismId,support:decision.blockDecision.supportLevel,deliveredAt:occurredAt}:undefined,priorMove:decision.treatmentResponse&&previous?{decisionPointId:previous.provenance.decisionPointId,mechanismId:decision.treatmentResponse.mechanismId,support:decision.treatmentResponse.support,deliveredAt:priorMeta?.decidedAt??decision.treatmentResponse.occurredAt}:undefined,response:decision.treatmentResponse});
  const command={envelope:{operationId:`exam-teacher:${input.sessionId}:${point}`,learnerId:input.learnerId,occurredAt,inputFingerprint:'',correlationId:input.sessionId},context:{id:`exam-context:${point}`,value:decision.lineage.context},modelRun:{id:`exam-model:${point}`,provider:modelRun.provider,model:modelRun.model,promptVersion:modelRun.promptVersion,requestHash:await fingerprintV1(decision.lineage.context),responseHash:modelRun.responseIsModelOutput?await fingerprintV1(decision.lineage.proposal):undefined,status:modelRun.status},proposal:{id:`exam-proposal:${point}`,value:decision.lineage.proposal},qualification:{id:`exam-qualification:${point}`,accepted:true,reasonCodes:decision.lineage.qualification.reasonCodes,validatorVersion:decision.lineage.qualification.validatorVersion},decision:{id:`exam-decision:${point}`,value:decision},experience:{id:`exam-contract:${point}`,value:experience},execution:{id:`exam-execution:${point}`,status:'COMPLETED' as const,result:{phase:input.runtime.phase,taskId:input.runtime.taskId}},treatment,sessionCheckpoint:{lessonPlan:input.lessonPlan,runtime:input.runtime}};
  command.envelope.inputFingerprint=await fingerprintV1({...command,envelope:{...command.envelope,inputFingerprint:undefined}});
  return operationalDatabaseV1.commitTeacherLineage(command);
}
