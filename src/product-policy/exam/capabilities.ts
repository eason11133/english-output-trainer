export const examPolicyCapabilityStatusV1=Object.freeze([
 {id:'S.scope',status:'FIRST_PASS',effect:'Exam policy carries explicit exam scope without creating separate learner truth.'},
 {id:'S.deadline',status:'FIRST_PASS',effect:'Deadline is converted to bounded time-pressure policy.'},
 {id:'S.rubric',status:'FIRST_PASS',effect:'Exam rubric context is preserved for downstream K/S scoring alignment.'},
 {id:'S.time-pressure',status:'FIRST_PASS',effect:'Time pressure is explicit and bounded.'},
 {id:'S.score-value',status:'FIRST_PASS',effect:'Exam optimization prioritizes score-relevant performance.'},
 {id:'S.weakness-parking',status:'CONTRACT_ONLY',effect:'Parking low-score-value weaknesses still belongs to D allocation logic.'},
 {id:'S.allocation',status:'CONTRACT_ONLY',effect:'S supplies policy; D remains allocation authority.'},
 {id:'S.formal-integrity',status:'FIRST_PASS',effect:'Formal/mock policy disables hints, reveal, lookup and mid-attempt teaching and can emit K integrity snapshot.'},
 {id:'S.post-assessment-teaching',status:'CONTRACT_ONLY',effect:'Post-assessment reteaching requires M/E integration after attempt closes.'},
 {id:'S.mock-behavior',status:'CONTRACT_ONLY',effect:'Policy can represent MOCK, but full mock runtime/rendering is not implemented.'},
 {id:'S.shared-truth',status:'FIRST_PASS',effect:'Exam policy explicitly forbids a separate Exam learner-truth fork.'}
] as const);
