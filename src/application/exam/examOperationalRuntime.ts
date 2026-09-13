import type { LessonPlanV1 } from '../../architecture/contracts';
import type { ExamOperationalRuntimeV1 } from '../../persistence/operationalTypes';
import type { QualifiedInnerTutorDecisionV1 } from '../../teacher-runtime';
import type { ExamTeacherInteractionV1 } from './examTeacherInteraction';

export function examLessonPlanForDecisionV1(base:LessonPlanV1,decision?:QualifiedInnerTutorDecisionV1):LessonPlanV1{
  if(!decision)return base;
  return {...base,targetRef:decision.provenance.targetRef,facet:decision.provenance.facet};
}

export function createExamOperationalRuntimeV1(input:{
  sessionId:string;learnerId:string;taskId:string;contentHash?:string;family:string;subtype:string;freshnessIdentity:string;occurredAt?:string;
}):ExamOperationalRuntimeV1{
  const now=input.occurredAt??new Date().toISOString();
  const attemptId=`${input.sessionId}:attempt:1`;return Object.freeze({schemaVersion:1,runtimeKind:'EXAM',id:input.sessionId,learnerId:input.learnerId,taskId:input.taskId,contentHash:input.contentHash??`legacy:${input.taskId}`,bindingVersion:'exam-binding-v1',attemptId,submitActionId:`${attemptId}:submit`,family:input.family,subtype:input.subtype,status:'LEARNING',phase:'ANSWERING',startedAt:now,updatedAt:now,responses:{},activeBlankId:'1',sourceOpen:true,interactionText:'',teacherMessage:'',decisionHistory:[],interactionEvaluations:[],lookupExposure:[],support:'NONE',freshnessIdentity:input.freshnessIdentity});
}

export function updateExamOperationalRuntimeV1(runtime:ExamOperationalRuntimeV1,input:{
  responses?:Readonly<Record<string,string>>;activeBlankId?:string;sourceOpen?:boolean;interactionText?:string;teacherMessage?:string;
  teacherDecision?:QualifiedInnerTutorDecisionV1|null;activeInteraction?:ExamTeacherInteractionV1|null;interactionEvaluation?:Readonly<Record<string,unknown>>;phase?:ExamOperationalRuntimeV1['phase'];status?:ExamOperationalRuntimeV1['status'];submittedAt?:string;occurredAt?:string;
}):ExamOperationalRuntimeV1{
  const now=input.occurredAt??new Date().toISOString(),decision=input.teacherDecision===null?undefined:input.teacherDecision??runtime.teacherDecision,interaction=input.activeInteraction===null?undefined:input.activeInteraction??runtime.activeInteraction;
  const history=decision&&!runtime.decisionHistory.some(item=>item.decisionPointId===decision.provenance.decisionPointId)?[...runtime.decisionHistory,{decisionPointId:decision.provenance.decisionPointId,mechanismId:decision.provenance.selectedMechanismId,support:decision.blockDecision.supportLevel,decidedAt:now}]:runtime.decisionHistory;
  const status=input.status??runtime.status,phase=input.phase??runtime.phase;
  const evaluations=input.interactionEvaluation?[...(runtime.interactionEvaluations??[]).filter(item=>item.evaluationId!==input.interactionEvaluation?.evaluationId),input.interactionEvaluation]:runtime.interactionEvaluations??[];
  return Object.freeze({...runtime,responses:input.responses??runtime.responses,activeBlankId:input.activeBlankId??runtime.activeBlankId,sourceOpen:input.sourceOpen??runtime.sourceOpen,interactionText:input.interactionText??runtime.interactionText,teacherMessage:input.teacherMessage??runtime.teacherMessage,teacherDecision:decision,activeInteraction:interaction,decisionHistory:Object.freeze(history),interactionEvaluations:Object.freeze(evaluations),phase,status,submittedAt:input.submittedAt??runtime.submittedAt,updatedAt:now,endedAt:status==='COMPLETED'?runtime.endedAt??now:undefined});
}

export function resumableExamOperationalRuntimeV1(value:unknown,learnerId:string,sessionId:string):ExamOperationalRuntimeV1|undefined{
  if(!value||typeof value!=='object')return undefined;
  const runtime=value as Partial<ExamOperationalRuntimeV1>;
  if(runtime.runtimeKind!=='EXAM'||runtime.schemaVersion!==1||runtime.learnerId!==learnerId||runtime.id!==sessionId||runtime.status==='COMPLETED')return undefined;
  if(!runtime.taskId||!runtime.contentHash||runtime.bindingVersion!=='exam-binding-v1'||!runtime.attemptId||!runtime.submitActionId||!runtime.family||!runtime.subtype||!runtime.startedAt||!runtime.updatedAt||!runtime.freshnessIdentity)return undefined;
  return runtime as ExamOperationalRuntimeV1;
}

export function retryExamOperationalRuntimeV1(runtime:ExamOperationalRuntimeV1,occurredAt=new Date().toISOString()):ExamOperationalRuntimeV1{const n=Number(runtime.attemptId.match(/:attempt:(\d+)$/)?.[1]??1)+1,attemptId=`${runtime.id}:attempt:${n}`;return Object.freeze({...runtime,attemptId,submitActionId:`${attemptId}:submit`,submittedAt:undefined,responses:{},teacherDecision:undefined,activeInteraction:undefined,decisionHistory:[],phase:'ANSWERING',status:'LEARNING',updatedAt:occurredAt,endedAt:undefined})}
