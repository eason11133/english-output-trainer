export type ReliabilityCapabilityStatusV1='FIRST_PASS'|'CONTRACT_ONLY'|'BLOCKED_EXTERNAL';
export interface ReliabilityCapabilityStateV1{id:string;status:ReliabilityCapabilityStatusV1;note:string}

export const reliabilityCapabilityStatesV1:readonly ReliabilityCapabilityStateV1[]=Object.freeze([
  {id:'V.network-failure',status:'FIRST_PASS',note:'Client/server failures are normalized; Teacher decisions fall back through E and app-level automatic retries are forbidden.'},
  {id:'V.model-failure',status:'FIRST_PASS',note:'Provider failure or rejected structured decisions do not execute directly; E re-qualifies deterministic fallback.'},
  {id:'V.partial-response',status:'FIRST_PASS',note:'Invalid/non-JSON/shape-invalid responses are rejected as infrastructure failures rather than consumed as learner truth.'},
  {id:'V.crash-recovery',status:'CONTRACT_ONLY',note:'U/M transactional checkpoint semantics exist, but physical process-death acceptance remains device-unverified.'},
  {id:'V.logging',status:'FIRST_PASS',note:'Reliability events are structured and metadata is scrubbed of learner text/content/secret-like fields.'},
  {id:'V.error-monitoring',status:'CONTRACT_ONLY',note:'A sink contract exists but no production external monitoring backend is claimed.'},
  {id:'V.secret-handling',status:'FIRST_PASS',note:'Client public env is treated as public; provider secrets remain server-side and static gates reject public secret patterns.'},
  {id:'V.release-config',status:'FIRST_PASS',note:'Coach endpoint configuration is validated and production requires HTTPS.'},
  {id:'V.android-ios',status:'CONTRACT_ONLY',note:'Cross-platform code paths exist but Android/iOS physical acceptance is pending.'},
  {id:'V.keyboard-ime',status:'CONTRACT_ONLY',note:'UI contracts and resize configuration exist; physical keyboard/IME acceptance is pending.'},
  {id:'V.safe-area-back',status:'CONTRACT_ONLY',note:'Safe-area/router foundations exist; physical back-navigation lifecycle acceptance is pending.'},
  {id:'V.rate-cost-guardrails',status:'CONTRACT_ONLY',note:'T has bounded model budgets in selected paths, but whole-product rate/cost policy is not yet uniformly enforced.'},
]);

export const reliabilityWaveSummaryV1=()=>({
  firstPass:reliabilityCapabilityStatesV1.filter(x=>x.status==='FIRST_PASS').length,
  contractOnly:reliabilityCapabilityStatesV1.filter(x=>x.status==='CONTRACT_ONLY').length,
  blockedExternal:reliabilityCapabilityStatesV1.filter(x=>x.status==='BLOCKED_EXTERNAL').length,
});
