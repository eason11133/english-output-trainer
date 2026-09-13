export type AssessmentCapabilityStatusV1='FIRST_PASS'|'CONTRACT_ONLY'|'BLOCKED_EXTERNAL';
export interface AssessmentCapabilityStateV1{id:string;status:AssessmentCapabilityStatusV1;note:string}
export const assessmentCapabilityStatesV1:readonly AssessmentCapabilityStateV1[]=Object.freeze([
  {id:'K.diagnostic',status:'FIRST_PASS',note:'Validated unsupported fresh delivery can be qualified separately from source work.'},
  {id:'K.practice-evidence',status:'FIRST_PASS',note:'Assisted practice and local independent production remain distinct proof classes.'},
  {id:'K.fresh-assessment',status:'FIRST_PASS',note:'Fresh assessment requires unsupported production plus validated new-content delivery provenance.'},
  {id:'K.formal-exam',status:'CONTRACT_ONLY',note:'Formal integrity contract exists; S/P/N integration is not production-complete.'},
  {id:'K.answer-reveal',status:'CONTRACT_ONLY',note:'Formal integrity rejects reveal availability; learner UI enforcement belongs downstream.'},
  {id:'K.lookup-lock',status:'CONTRACT_ONLY',note:'Formal integrity rejects lookup availability; P integration is not wired yet.'},
  {id:'K.unsupported-production',status:'FIRST_PASS',note:'Canonical production-condition predicate and exposed-support check both gate independent proof.'},
  {id:'K.same-vs-fresh',status:'FIRST_PASS',note:'Fresh proof requires validated delivery and content identity distinct from source.'},
  {id:'K.changed-context-transfer',status:'FIRST_PASS',note:'Transfer requires validated changed-context delivery and distinct context identity.'},
  {id:'K.delayed-probe',status:'FIRST_PASS',note:'Temporal/session qualification now consumes persisted L need identity and G validated delayed delivery provenance.'},
  {id:'K.retention',status:'FIRST_PASS',note:'Only accepted delayed C/K qualification can satisfy the persisted L lifecycle; rejected or assisted output reopens it.'},
  {id:'K.scoring-rubric',status:'CONTRACT_ONLY',note:'Writing/Translation analytic observations may feed future S/K scoring; no universal score authority is claimed.'},
  {id:'K.measurement-uncertainty',status:'FIRST_PASS',note:'Low-confidence or mixed/unknown measurement abstains instead of forcing proof.'},
  {id:'K.assessment-separation',status:'FIRST_PASS',note:'Diagnostic/transfer/retention proof requires unsupported conditions; formal assessment separation is separately bounded.'},
]);
export const assessmentWaveSummaryV1=()=>({firstPass:assessmentCapabilityStatesV1.filter(x=>x.status==='FIRST_PASS').length,contractOnly:assessmentCapabilityStatesV1.filter(x=>x.status==='CONTRACT_ONLY').length,blockedExternal:assessmentCapabilityStatesV1.filter(x=>x.status==='BLOCKED_EXTERNAL').length});
