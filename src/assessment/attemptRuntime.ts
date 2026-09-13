import type { ReadingAttemptModeV1 } from '../specializations/language/readingExamRuntime';
export type AssessmentScoringStatusV1='NOT_AUTHORIZED'|'PENDING'|'PARTIAL'|'COMPLETE';
export interface AuthorizedAssessmentResultV1{assessmentAttemptId:string;assessmentType:string;scoringAuthorityId:string;scoringAuthorityVersion:string;scoringStatus:Exclude<AssessmentScoringStatusV1,'NOT_AUTHORIZED'>;score?:number;componentScores?:Readonly<Record<string,number>>;uncertainty?:string;rubricReference:string;committedAt:string}
export interface AssessmentAttemptLifecycleV1{id:string;mode:ReadingAttemptModeV1;state:'ACTIVE'|'SUBMITTING'|'SUBMITTED'|'REVIEW';startedAt:string;submittedAt?:string;clock?:{budgetSeconds:number;elapsedSeconds:number;lastResumedAt?:string};submissionFingerprint?:string;result?:AuthorizedAssessmentResultV1}
export function assessmentScoreProjectionV1(attempt:AssessmentAttemptLifecycleV1):{visible:false}|{visible:true;result:AuthorizedAssessmentResultV1}{return attempt.result?{visible:true,result:attempt.result}:{visible:false}}
export function submitAssessmentAttemptV1(attempt:AssessmentAttemptLifecycleV1,input:{submittedAt:string;submissionFingerprint:string}):AssessmentAttemptLifecycleV1{
  if(attempt.state==='SUBMITTED'||attempt.state==='REVIEW'){if(attempt.submissionFingerprint!==input.submissionFingerprint)throw new Error('assessment_submission_conflict');return attempt}
  return Object.freeze({...attempt,state:'SUBMITTED',submittedAt:input.submittedAt,submissionFingerprint:input.submissionFingerprint});
}
