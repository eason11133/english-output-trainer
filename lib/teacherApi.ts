import{ObservedSpan,TeacherPlanningContext,TeacherTurnPlan}from'../src/domain/teacher/TeacherRuntime';
import{QualifiedBlockSelectionV4}from'../src/application/stage4/blockDecisionAdapterV4';
import{ProviderRequestErrorV1,providerFailureFromHttpV1,providerFailureFromThrownV1,requireCoachEndpointV1,type ReliabilityOperationV1}from'../src/reliability';
import{guardModelProposalAuthorityV1,productionModelEndpointContractV1,type ModelOperationV1}from'../src/model';
import type{GsatScoringPacketV1,GsatScoringResponseV1}from'../src/application/exam/gsatLiveSemanticAssessment';

declare const process:{env:Record<string,string|undefined>};
declare const __DEV__:boolean;

let requestSequence=0;
const requestId=()=>`app-${Date.now().toString(36)}-${(++requestSequence).toString(36)}`;
const base=(operation:ReliabilityOperationV1)=>requireCoachEndpointV1(process.env.EXPO_PUBLIC_COACH_API_URL,__DEV__?'DEVELOPMENT':'PRODUCTION',operation);

const jsonObject=async(response:Response,operation:ReliabilityOperationV1,id:string):Promise<unknown>=>{
  let raw:unknown;
  try{raw=await response.json()}catch(error){throw new ProviderRequestErrorV1({kind:'INVALID_RESPONSE',operation,requestId:id,httpStatus:response.status,retryable:false,automaticRetry:false,safeForLearner:true,diagnosticCode:'provider_invalid_json'},error)}
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new ProviderRequestErrorV1({kind:'INVALID_RESPONSE',operation,requestId:id,httpStatus:response.status,retryable:false,automaticRetry:false,safeForLearner:true,diagnosticCode:'provider_invalid_payload'});
  return raw;
};

const reliabilityOperationV1=(operation:ModelOperationV1):ReliabilityOperationV1=>operation==='ARTIFACT_TRANSCRIPTION'?'TRANSCRIPTION':'TEACHER_DECISION';

async function post<T>(operation:ModelOperationV1,body:unknown,validate:(value:unknown)=>value is T):Promise<T>{
  const contract=productionModelEndpointContractV1(operation),reliabilityOperation=reliabilityOperationV1(operation);
  const id=requestId(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),contract.timeoutMs);
  try{
    const response=await fetch(`${base(reliabilityOperation)}${contract.path}`,{method:'POST',headers:{'content-type':'application/json','x-eot-request-id':id},body:JSON.stringify(body),signal:controller.signal});
    if(!response.ok)throw new ProviderRequestErrorV1(providerFailureFromHttpV1(reliabilityOperation,response.status,response.headers.get('x-eot-request-id')||id));
    const raw=await jsonObject(response,reliabilityOperation,response.headers.get('x-eot-request-id')||id);
    if(!validate(raw))throw new ProviderRequestErrorV1({kind:'INVALID_RESPONSE',operation:reliabilityOperation,requestId:id,httpStatus:response.status,retryable:false,automaticRetry:false,safeForLearner:true,diagnosticCode:'provider_invalid_shape'});
    if(operation!=='ARTIFACT_TRANSCRIPTION'){const guard=guardModelProposalAuthorityV1(raw);if(!guard.valid)throw new ProviderRequestErrorV1({kind:'INVALID_RESPONSE',operation:reliabilityOperation,requestId:id,httpStatus:response.status,retryable:false,automaticRetry:false,safeForLearner:true,diagnosticCode:`provider_forbidden_authority:${guard.errors.join('|')}`});}
    return raw;
  }catch(error){
    if(error instanceof ProviderRequestErrorV1)throw error;
    throw new ProviderRequestErrorV1(providerFailureFromThrownV1(reliabilityOperation,error,id),error);
  }finally{clearTimeout(timer)}
}

const teacherPlanShape=(value:unknown):value is TeacherTurnPlan=>Boolean(value&&typeof value==='object'&&typeof (value as{interventionDecision?:unknown}).interventionDecision==='string');
const transcriptionShape=(value:unknown):value is {spans:ObservedSpan[]}=>Boolean(value&&typeof value==='object'&&Array.isArray((value as{spans?:unknown}).spans));
const blockDecisionShape=(value:unknown):value is {decision:QualifiedBlockSelectionV4;validation:{valid:boolean;errors:string[]}}=>{
  if(!value||typeof value!=='object')return false;
  const record=value as Record<string,unknown>,validation=record.validation,decision=record.decision;
  return Boolean(decision&&typeof decision==='object'&&validation&&typeof validation==='object'&&typeof (validation as{valid?:unknown}).valid==='boolean'&&Array.isArray((validation as{errors?:unknown}).errors));
};
const gsatScoringShape=(value:unknown):value is GsatScoringResponseV1=>Boolean(value&&typeof value==='object'&&Array.isArray((value as{results?:unknown}).results)&&typeof (value as{telemetry?:{provider?:unknown}}).telemetry?.provider==='string'&&typeof (value as{telemetry?:{model?:unknown}}).telemetry?.model==='string');

export const requestTeacherPlan=(context:TeacherPlanningContext)=>post<TeacherTurnPlan>('TEACHER_PLAN',context,teacherPlanShape);
export const transcribeArtifact=(input:{artifactId:string;mimeType:string;base64:string})=>post<{spans:ObservedSpan[]}>('ARTIFACT_TRANSCRIPTION',input,transcriptionShape);
export const requestQualifiedBlockDecision=(context:unknown)=>post<{decision:QualifiedBlockSelectionV4;validation:{valid:boolean;errors:string[]};telemetry?:{callId?:string;model?:string;responseId?:string;latencyMs?:number;inputTokens?:number;outputTokens?:number}}>('TEACHER_BLOCK_SELECTION',{context},blockDecisionShape);
export const requestGsatSemanticAssessment=(packet:GsatScoringPacketV1)=>post<GsatScoringResponseV1>('SEMANTIC_ANALYSIS',packet,gsatScoringShape);
