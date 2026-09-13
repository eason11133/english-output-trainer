import type { Stage4RuntimeV4 } from '../domain/stage4/LearnerRuntimeV4';

export function saveLearnerDraftV1(runtime:Stage4RuntimeV4,text:string,occurredAt=new Date().toISOString()):Stage4RuntimeV4{
  if(runtime.learnerDraft?.text===text)return runtime;
  const traceId=`draft:${runtime.id}:${occurredAt}:${runtime.trace.length}`;
  return{...runtime,learnerDraft:{schemaVersion:1,text,updatedAt:occurredAt},trace:[...runtime.trace,{id:traceId,occurredAt,kind:'DRAFT_SAVED',fixture:false,payload:{characterCount:text.length}}]};
}

export function hydrateLearnerDraftV1(runtime:Stage4RuntimeV4,fallback:string){return runtime.learnerDraft?.text??fallback}
