export type TeacherModelProviderOutcomeV1='AI'|'DETERMINISTIC_FALLBACK'|'FALLBACK_AFTER_REJECTION';
export type PersistedModelRunStatusV1='SUCCEEDED'|'FAILED'|'REJECTED'|'NOT_CALLED';

export function teacherModelRunDescriptorV1(provider:TeacherModelProviderOutcomeV1){
  if(provider==='AI')return Object.freeze({provider:'AI',model:'teacher-gateway',promptVersion:'qualified-block-v1',status:'SUCCEEDED' as const,responseIsModelOutput:true});
  if(provider==='FALLBACK_AFTER_REJECTION')return Object.freeze({provider:'AI_REJECTED_THEN_DETERMINISTIC_E',model:'teacher-gateway',promptVersion:'qualified-block-v1',status:'REJECTED' as const,responseIsModelOutput:false});
  return Object.freeze({provider:'DETERMINISTIC_E',model:'none',promptVersion:'deterministic-e-v1',status:'NOT_CALLED' as const,responseIsModelOutput:false});
}
