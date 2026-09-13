export type LookupCapabilityStatusV1='FIRST_PASS'|'CONTRACT_ONLY'|'BLOCKED_EXTERNAL';
export interface LookupCapabilityStateV1{id:string;status:LookupCapabilityStatusV1;note:string}
export const lookupCapabilityStatesV1:readonly LookupCapabilityStateV1[]=Object.freeze([
  {id:'P.phrase-first',status:'FIRST_PASS',note:'Deterministic candidate selection prefers overlapping phrase/chunk units before word fallback; production candidate discovery is a separate Data/T integration.'},
  {id:'P.word-fallback',status:'FIRST_PASS',note:'Deterministic selection falls back to a word only when no overlapping phrase/chunk candidate exists.'},
  {id:'P.context-sense',status:'FIRST_PASS',note:'Single-token resolution lemmatizes the token, ranks sentence/paragraph evidence, and fails closed on unresolved ambiguity.'},
  {id:'P.zh-tw-explanation',status:'FIRST_PASS',note:'Grounded contextual records return a compact zh-TW meaning and supported local phrase/chunk.'},
  {id:'P.lookup-history',status:'FIRST_PASS',note:'Production lesson lookup exposure is checkpointed as a non-evidence event and remains visible before response.'},
  {id:'P.assessment-lock',status:'FIRST_PASS',note:'Formal attempts lock lookup; learning checks selectively lock answer-revealing target tokens and reopen after submission.'},
  {id:'P.teaching-lookup',status:'FIRST_PASS',note:'One shared single-token primitive is consumed across production learner surfaces and Output Workspace lookup.'},
  {id:'P.lookup-not-evidence',status:'FIRST_PASS',note:'Lookup decisions/history explicitly carry evidenceEligible=false and assistance contamination helpers.'},
]);
export const lookupWaveSummaryV1=()=>({firstPass:lookupCapabilityStatesV1.filter(x=>x.status==='FIRST_PASS').length,contractOnly:lookupCapabilityStatesV1.filter(x=>x.status==='CONTRACT_ONLY').length,blockedExternal:lookupCapabilityStatesV1.filter(x=>x.status==='BLOCKED_EXTERNAL').length});
