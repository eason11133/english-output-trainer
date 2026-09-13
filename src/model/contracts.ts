import type{ModelEndpointContractV1,ModelOperationV1,ProductionModelEndpointContractV1}from'./types';
const endpoint=(value:ModelEndpointContractV1)=>Object.freeze(value);
export const modelEndpointContractsV1:Readonly<Record<ModelOperationV1,ModelEndpointContractV1>>=Object.freeze({
  TEACHER_PLAN:endpoint({id:'TEACHER_PLAN',availability:'PRODUCTION',path:'/teacher/plan',timeoutMs:90000,retryOwner:'SERVER',structuredOutput:'REQUIRED',providerSelection:'SERVER_ONLY',promptVersion:'teacher-plan-v1',schemaVersion:'teacher-turn-plan-v1',maxOutputTokens:1800}),
  TEACHER_BLOCK_SELECTION:endpoint({id:'TEACHER_BLOCK_SELECTION',availability:'PRODUCTION',path:'/teacher/v4/block-select',timeoutMs:90000,retryOwner:'NONE',structuredOutput:'REQUIRED',providerSelection:'SERVER_ONLY',promptVersion:'qualified-block-v1',schemaVersion:'block-decision-v4',maxOutputTokens:450}),
  ARTIFACT_TRANSCRIPTION:endpoint({id:'ARTIFACT_TRANSCRIPTION',availability:'PRODUCTION',path:'/teacher/transcribe',timeoutMs:120000,retryOwner:'SERVER',structuredOutput:'REQUIRED',providerSelection:'SERVER_ONLY',promptVersion:'artifact-transcription-v1',schemaVersion:'artifact-transcript-v1',maxOutputTokens:4000}),
  CONTENT_GENERATION:endpoint({id:'CONTENT_GENERATION',availability:'CONTRACT_ONLY',timeoutMs:90000,retryOwner:'NONE',structuredOutput:'REQUIRED',providerSelection:'SERVER_ONLY',promptVersion:'content-generation-v1',schemaVersion:'generated-content-v1',maxOutputTokens:1400}),
  SEMANTIC_ANALYSIS:endpoint({id:'SEMANTIC_ANALYSIS',availability:'PRODUCTION',path:'/assessment/gsat',timeoutMs:65000,retryOwner:'NONE',structuredOutput:'REQUIRED',providerSelection:'SERVER_ONLY',promptVersion:'gsat-semantic-scoring-v1',schemaVersion:'semantic-assessment-v1',maxOutputTokens:1800}),
});
export const modelOperationContractV1=(operation:ModelOperationV1)=>modelEndpointContractsV1[operation];
export function productionModelEndpointContractV1(operation:ModelOperationV1):ProductionModelEndpointContractV1{
  const contract=modelEndpointContractsV1[operation];
  if(contract.availability!=='PRODUCTION'||!contract.path)throw new Error(`model_operation_not_production:${operation}`);
  return contract as ProductionModelEndpointContractV1;
}
