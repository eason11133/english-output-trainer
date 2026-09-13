import type { LessonSessionLifecycleV1 } from '../architecture/contracts';
import type { RuntimeTraceEntryV4, Stage4RuntimeV4 } from '../domain/stage4/LearnerRuntimeV4';
import { canonicalJsonV1 } from '../persistence/canonicalJson';
import { endTutorSessionV1,pauseTutorSessionV1,resumeTutorSessionV1 } from '../teacher-runtime/sessionTime';
import { sha256HexV1 } from './actionDigest';

const normalized=(value:string)=>value.normalize('NFC').replace(/\r\n?/g,'\n');
function fnv(value:string){let h=0x811c9dc5;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}return h.toString(16).padStart(8,'0')}
function lifecycleTraceV1(runtime:Stage4RuntimeV4,kind:RuntimeTraceEntryV4['kind'],now:string,action:string,payload:Record<string,unknown>={}):RuntimeTraceEntryV4{
  return{id:`lifecycle:${fnv([runtime.id,kind,action,now].join('|'))}`,occurredAt:now,kind,fixture:false,payload:{action,...payload}};
}
function withLifecycleTraceV1(runtime:Stage4RuntimeV4,entry:RuntimeTraceEntryV4):Stage4RuntimeV4{
  if(runtime.trace.some(item=>item.id===entry.id))return runtime;
  return{...runtime,trace:[...runtime.trace,entry]};
}
export type LessonActionIdentityInputV1={runtime:Stage4RuntimeV4;type:string;taskId?:string;response?:string};
export function canonicalLessonActionPayloadV1(input:LessonActionIdentityInputV1):string{
  const decisionPointId=typeof input.runtime.decision?.configuration.decisionPointId==='string'?input.runtime.decision.configuration.decisionPointId:'NO_POINT';
  return canonicalJsonV1({schemaVersion:2,runtimeId:input.runtime.id,decisionPointId,blockInstanceId:input.runtime.blockState?.instanceId??'NO_BLOCK',eventType:input.type,taskId:input.taskId??null,response:normalized(input.response??'')});
}
export async function lessonActionIdentityV1(input:LessonActionIdentityInputV1):Promise<string>{
  const canonicalPayload=canonicalLessonActionPayloadV1(input);
  return`lesson-action:sha256:${await sha256HexV1(canonicalPayload)}`;
}
function legacyActionSemanticallyMatchesV1(runtime:Stage4RuntimeV4,event:Stage4RuntimeV4['blockEvents'][number],canonicalPayload:string):boolean{
  let candidate:{runtimeId?:unknown;decisionPointId?:unknown;blockInstanceId?:unknown;eventType?:unknown;taskId?:unknown;response?:unknown};
  try{candidate=JSON.parse(canonicalPayload)}catch{return false}
  const point=typeof runtime.decision?.configuration.decisionPointId==='string'?runtime.decision.configuration.decisionPointId:'NO_POINT';
  const eventTaskId=typeof event.payload.taskId==='string'?event.payload.taskId:null;
  const eventResponse=typeof event.payload.response==='string'?normalized(event.payload.response):'';
  return candidate.runtimeId===runtime.id&&candidate.decisionPointId===point&&candidate.blockInstanceId===event.instanceId&&candidate.eventType===event.type&&candidate.taskId===eventTaskId&&candidate.response===eventResponse;
}
export function lessonActionAlreadyRecordedV1(runtime:Stage4RuntimeV4,actionIdentity:string,canonicalPayload:string):boolean{return runtime.blockEvents.some(event=>{
  const storedIdentity=typeof event.payload.actionIdentity==='string'?event.payload.actionIdentity:undefined;
  const storedPayload=typeof event.payload.actionPayloadCanonical==='string'?event.payload.actionPayloadCanonical:undefined;
  if(storedPayload)return storedIdentity===actionIdentity&&storedPayload===canonicalPayload;
  return Boolean(storedIdentity?.startsWith('lesson-action:')&&!storedIdentity.startsWith('lesson-action:sha256:')&&legacyActionSemanticallyMatchesV1(runtime,event,canonicalPayload));
})}
export function markPendingTeacherContinuationV1(runtime:Stage4RuntimeV4,actionIdentity:string,eventId:string):Stage4RuntimeV4{
  const continuationId=`teacher-continuation:${actionIdentity}`;
  const current=runtime.pendingTeacherContinuation;
  if(current){if(current.continuationId!==continuationId||current.eventId!==eventId)throw new Error('conflicting_pending_teacher_continuation');return runtime}
  return{...runtime,pendingTeacherContinuation:{schemaVersion:1,continuationId,actionIdentity,eventId,status:'PENDING'}};
}
export function completePendingTeacherContinuationV1(runtime:Stage4RuntimeV4,eventId:string):Stage4RuntimeV4{
  const current=runtime.pendingTeacherContinuation;
  if(!current)return runtime;
  if(current.eventId!==eventId)throw new Error('teacher_continuation_event_mismatch');
  const next={...runtime};delete next.pendingTeacherContinuation;return next;
}
export function sessionCanResumeV1(runtime:Stage4RuntimeV4):boolean{return runtime.status!=='RETURNED'&&runtime.status!=='COMPLETED'&&runtime.tutorSession?.endedAt===undefined&&runtime.sessionControl?.lifecycle!=='CLOSED'}
export function pauseLessonSessionV1(runtime:Stage4RuntimeV4,now=new Date().toISOString()):Stage4RuntimeV4{
  if(!sessionCanResumeV1(runtime)||(runtime.status==='PAUSED'&&runtime.sessionControl?.lifecycle==='PAUSED'))return runtime;
  const pausedFromStatus=runtime.status==='PAUSED'?runtime.sessionControl?.pausedFromStatus:runtime.status;
  const next={...pauseTutorSessionV1(runtime,now),status:'PAUSED' as const,sessionControl:{schemaVersion:1 as const,lifecycle:'PAUSED' as const,pausedFromStatus:pausedFromStatus==='RETURNED'||pausedFromStatus==='COMPLETED'?undefined:pausedFromStatus}};
  return withLifecycleTraceV1(next,lifecycleTraceV1(runtime,'PAUSED',now,'MANUAL_PAUSE',{pausedFromStatus:next.sessionControl.pausedFromStatus}));
}
export function resumeLessonSessionV1(runtime:Stage4RuntimeV4,now=new Date().toISOString()):Stage4RuntimeV4{
  if(!sessionCanResumeV1(runtime))throw new Error('closed_lesson_session_cannot_resume');
  if(runtime.status!=='PAUSED'&&runtime.sessionControl?.lifecycle!=='PAUSED')return runtime;
  const restore=runtime.sessionControl?.pausedFromStatus??'LEARNING';
  const next={...resumeTutorSessionV1(runtime,now),status:restore,sessionControl:{schemaVersion:1 as const,lifecycle:'ACTIVE' as const,lastForegroundAt:now}};
  return withLifecycleTraceV1(next,lifecycleTraceV1(runtime,'RESUMED',now,'MANUAL_RESUME',{restoredStatus:restore}));
}
export function closeReturnedLessonSessionV1(runtime:Stage4RuntimeV4,now=new Date().toISOString()):Stage4RuntimeV4{
  if(runtime.status==='RETURNED'&&runtime.sessionControl?.lifecycle==='CLOSED')return runtime;
  const next={...endTutorSessionV1({...runtime,status:'RETURNED' as const},now),sessionControl:{schemaVersion:1 as const,lifecycle:'CLOSED' as const,closedAt:now,closeReason:'RETURNED_TO_SOURCE' as const}};
  return withLifecycleTraceV1(next,lifecycleTraceV1(runtime,'EXPERIENCE_ACTION',now,'SESSION_CLOSED',{closeReason:'RETURNED_TO_SOURCE'}));
}
export function backgroundLessonSessionV1(runtime:Stage4RuntimeV4,now=new Date().toISOString()):Stage4RuntimeV4{
  if(!sessionCanResumeV1(runtime)||runtime.sessionControl?.lifecycle==='BACKGROUND')return runtime;
  const next={...pauseTutorSessionV1(runtime,now),sessionControl:{...runtime.sessionControl,schemaVersion:1 as const,lifecycle:'BACKGROUND' as const,lastBackgroundAt:now}};
  return withLifecycleTraceV1(next,lifecycleTraceV1(runtime,'PAUSED',now,'APP_BACKGROUND',{pedagogicalStatus:runtime.status}));
}
export function foregroundLessonSessionV1(runtime:Stage4RuntimeV4,now=new Date().toISOString()):Stage4RuntimeV4{
  if(!sessionCanResumeV1(runtime)||runtime.sessionControl?.lifecycle!=='BACKGROUND')return runtime;
  const next={...resumeTutorSessionV1(runtime,now),sessionControl:{...runtime.sessionControl,schemaVersion:1 as const,lifecycle:'ACTIVE' as const,lastForegroundAt:now}};
  return withLifecycleTraceV1(next,lifecycleTraceV1(runtime,'RESUMED',now,'APP_FOREGROUND',{pedagogicalStatus:runtime.status}));
}
export const lessonSessionLifecycleV1:LessonSessionLifecycleV1=Object.freeze({canResume:sessionCanResumeV1,pause:pauseLessonSessionV1,resume:resumeLessonSessionV1,background:backgroundLessonSessionV1,foreground:foregroundLessonSessionV1,closeReturned:closeReturnedLessonSessionV1,actionIdentity:lessonActionIdentityV1});
