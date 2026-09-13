export type ModelOperationV1='TEACHER_PLAN'|'TEACHER_BLOCK_SELECTION'|'ARTIFACT_TRANSCRIPTION'|'CONTENT_GENERATION'|'SEMANTIC_ANALYSIS';
export type ModelRetryOwnerV1='NONE'|'SERVER';
export type StructuredOutputRequirementV1='REQUIRED'|'OPTIONAL';
export type ModelOperationAvailabilityV1='PRODUCTION'|'CONTRACT_ONLY';

export interface ModelEndpointContractV1{
  id:ModelOperationV1;
  availability:ModelOperationAvailabilityV1;
  path?:string;
  timeoutMs:number;
  retryOwner:ModelRetryOwnerV1;
  structuredOutput:StructuredOutputRequirementV1;
  providerSelection:'SERVER_ONLY';
  promptVersion:string;
  schemaVersion:string;
  maxOutputTokens:number;
}
export type ProductionModelEndpointContractV1=ModelEndpointContractV1&{availability:'PRODUCTION';path:string};

export interface ModelUsageV1{inputTokens:number;cachedInputTokens:number;outputTokens:number;reasoningTokens:number;estimatedCostUsd?:number}
export interface ModelRunProvenanceV1{operation:ModelOperationV1;provider:string;model:string;promptVersion:string;schemaVersion:string;requestId:string;responseId?:string;retries:number;usage?:ModelUsageV1;outcome:'SUCCEEDED'|'FAILED'|'REJECTED';fallback:'NONE'|'DETERMINISTIC_E_FALLBACK'|'CALLER_OWNED'}
export interface ModelProposalEnvelopeV1<T>{value:T;provenance:ModelRunProvenanceV1;canonicalAuthority:false}
export interface BoundedModelGatewayV1{requestStructured<T>(operation:ModelOperationV1,input:unknown,validate:(value:unknown)=>value is T):Promise<ModelProposalEnvelopeV1<T>>}
