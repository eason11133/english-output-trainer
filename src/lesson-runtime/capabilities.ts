export type LessonRuntimeCapabilityStatusV1='FIRST_PASS'|'CONTRACT_ONLY'|'BLOCKED_EXTERNAL';
export interface LessonRuntimeCapabilityStateV1{id:string;status:LessonRuntimeCapabilityStatusV1;note:string}
export const lessonRuntimeCapabilityStatesV1:readonly LessonRuntimeCapabilityStateV1[]=Object.freeze([
 {id:'M.lesson-session',status:'FIRST_PASS',note:'Stage4 learner runtime is bound to a canonical LessonPlan and operational checkpoint.'},
 {id:'M.episode-lifecycle',status:'FIRST_PASS',note:'Qualified Teacher decisions, block events, evidence and return/stop transitions form one executable lifecycle.'},
 {id:'M.pause',status:'FIRST_PASS',note:'Pause freezes tutor time and persists the pedagogical runtime.'},
 {id:'M.resume',status:'FIRST_PASS',note:'Resume preserves the exact runtime and cannot reopen RETURNED/COMPLETED sessions.'},
 {id:'M.background-foreground',status:'CONTRACT_ONLY',note:'Timer-safe lifecycle functions exist; real AppState/device acceptance is pending.'},
 {id:'M.crash-recovery',status:'FIRST_PASS',note:'Native response evidence and the corresponding runtime checkpoint can commit atomically; physical process-death acceptance remains pending.'},
 {id:'M.duplicate-action',status:'FIRST_PASS',note:'Learner UI action identity/in-flight protection plus U1 idempotency prevents ordinary duplicate submission.'},
 {id:'M.hydration',status:'FIRST_PASS',note:'Active session hydration excludes closed RETURNED/COMPLETED lessons and preserves nested H/I state.'},
 {id:'M.time-budget',status:'FIRST_PASS',note:'Tutor elapsed time excludes explicit pause intervals and is preserved in runtime.'},
 {id:'M.interruption',status:'CONTRACT_ONLY',note:'Pause/source-review are covered; full background/foreground and device interruption acceptance remains pending.'},
 {id:'M.session-close',status:'FIRST_PASS',note:'Return-to-source ends tutor time and the closed lesson is no longer loadable as active.'},
 {id:'M.cross-surface-continuity',status:'FIRST_PASS',note:'Closed runtime remains available to Result and secondary Progress/History while Lesson active lookup excludes it.'},
]);
export const lessonRuntimeWaveSummaryV1=()=>({firstPass:lessonRuntimeCapabilityStatesV1.filter(x=>x.status==='FIRST_PASS').length,contractOnly:lessonRuntimeCapabilityStatesV1.filter(x=>x.status==='CONTRACT_ONLY').length,blockedExternal:lessonRuntimeCapabilityStatesV1.filter(x=>x.status==='BLOCKED_EXTERNAL').length});
