export type ModelCapabilityStatusV1='FIRST_PASS'|'CONTRACT_ONLY'|'BLOCKED_EXTERNAL';
export interface ModelCapabilityStateV1{id:string;status:ModelCapabilityStatusV1;note:string}

export const modelCapabilityStatesV1:readonly ModelCapabilityStateV1[]=Object.freeze([
  {id:'T.provider-abstraction',status:'FIRST_PASS',note:'Learner client calls server-owned operation contracts and never selects a provider/model or receives provider secrets.'},
  {id:'T.structured-output',status:'FIRST_PASS',note:'Production Teacher/transcription calls require structured payloads plus caller/domain validation before use.'},
  {id:'T.semantic-diagnosis',status:'CONTRACT_ONLY',note:'T transports semantic proposals; H/I/E/F own interpretation and qualification, so T does not claim diagnosis correctness.'},
  {id:'T.content-generation',status:'CONTRACT_ONLY',note:'G defines generated-content validity; AI self-validation is not accepted as delivery authority.'},
  {id:'T.fallback-model',status:'CONTRACT_ONLY',note:'No alternate paid model routing is claimed; deterministic E fallback is intentionally not a model fallback.'},
  {id:'T.timeout-retry',status:'FIRST_PASS',note:'Operation contracts assign timeout and retry ownership; nested client/server semantic retry storms are forbidden.'},
  {id:'T.hallucination-guards',status:'FIRST_PASS',note:'Model authority-key guard plus subsystem validators keep model output proposal-only; semantic truth remains outside T.'},
  {id:'T.prompt-versioning',status:'FIRST_PASS',note:'Every production model operation has explicit prompt/schema version identity in the T operation registry.'},
  {id:'T.cost-control',status:'CONTRACT_ONLY',note:'Per-operation output budgets and telemetry exist, but whole-product monetary budgets are not uniformly enforced.'},
  {id:'T.rate-control',status:'CONTRACT_ONLY',note:'Provider rate failures are normalized and retry bounded, but no global learner/account rate governor is claimed.'},
  {id:'T.model-evaluation',status:'CONTRACT_ONLY',note:'Model telemetry/validation hooks exist; calibrated whole-product model evaluation belongs to X.'},
  {id:'T.deterministic-fallback',status:'FIRST_PASS',note:'T exposes failure/rejection; E owns and re-qualifies deterministic fallback rather than T silently fabricating a successful model run.'},
]);

export const modelWaveSummaryV1=()=>({
  firstPass:modelCapabilityStatesV1.filter(x=>x.status==='FIRST_PASS').length,
  contractOnly:modelCapabilityStatesV1.filter(x=>x.status==='CONTRACT_ONLY').length,
  blockedExternal:modelCapabilityStatesV1.filter(x=>x.status==='BLOCKED_EXTERNAL').length,
});
