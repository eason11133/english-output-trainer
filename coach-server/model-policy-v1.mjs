export const DEFAULT_MODEL_V1=process.env.OPENAI_MODEL||'gpt-5.6-terra';
export const MODEL_PRICE_ESTIMATE_V1=Object.freeze({inputPerMillionUsd:2,cachedInputPerMillionUsd:.2,outputPerMillionUsd:12});

export const MODEL_OPERATION_POLICY_V1=Object.freeze({
  TEACHER_PLAN:Object.freeze({promptVersion:'teacher-plan-v1',schemaVersion:'teacher-turn-plan-v1',timeoutMs:90000,maxOutputTokens:1800,maxRetries:1,retryOwner:'SERVER'}),
  TEACHER_PROPOSAL:Object.freeze({promptVersion:'teacher-proposal-v4',schemaVersion:'teacher-proposal-v4',timeoutMs:90000,maxOutputTokens:1800,maxRetries:1,retryOwner:'SERVER'}),
  BLOCK_SELECTION:Object.freeze({promptVersion:'qualified-block-v1',schemaVersion:'block-decision-v4',timeoutMs:90000,maxOutputTokens:450,maxRetries:0,retryOwner:'NONE'}),
  ARTIFACT_TRANSCRIPTION:Object.freeze({promptVersion:'artifact-transcription-v1',schemaVersion:'artifact-transcript-v1',timeoutMs:120000,maxOutputTokens:4000,maxRetries:1,retryOwner:'SERVER'}),
});

export function estimateModelCostUsdV1({inputTokens=0,cachedInputTokens=0,outputTokens=0}){
  const p=MODEL_PRICE_ESTIMATE_V1;
  return ((Math.max(0,inputTokens-cachedInputTokens)*p.inputPerMillionUsd)+(cachedInputTokens*p.cachedInputPerMillionUsd)+(outputTokens*p.outputPerMillionUsd))/1e6;
}

const NON_RETRYABLE_429_V1=new Set(['credit_balance_exhausted','organization_spend_limit_exceeded','project_spend_limit_exceeded','organization_usage_limit_exceeded','insufficient_quota']);
export function retryableProviderResponseV1(response,raw){
  if([408,500,502,503,504].includes(response.status))return true;
  if(response.status!==429)return false;
  const code=raw?.error?.code||raw?.error?.type||'';
  return !NON_RETRYABLE_429_V1.has(code);
}
export function retryDelayMsV1(response,attempt){
  const retryAfter=Number(response.headers?.get?.('retry-after'));
  if(Number.isFinite(retryAfter)&&retryAfter>=0)return Math.min(retryAfter*1000,5000);
  return Math.min(250*(2**attempt),1000);
}
