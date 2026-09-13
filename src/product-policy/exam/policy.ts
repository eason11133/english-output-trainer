import type { ProductContextV1 } from '../../architecture/contracts';
import type { FormalAssessmentIntegritySnapshotV1 } from '../../assessment/types';
export type ExamSessionKindV1='PRACTICE'|'FORMAL_ASSESSMENT'|'MOCK';
export interface ExamPolicyDecisionV1{mode:'EXAM';scope:string;deadline?:string;rubric?:string;timePressure:'LOW'|'MEDIUM'|'HIGH';scoreValuePriority:number;sharedLearnerTruth:true;forkLearnerTruth:false;sessionKind:ExamSessionKindV1;allowMidAttemptTeaching:boolean;allowHint:boolean;allowReveal:boolean;allowLookup:boolean}
const daysUntil=(deadline?:string)=>{if(!deadline)return undefined;const ms=Date.parse(deadline)-Date.now();return Number.isFinite(ms)?Math.ceil(ms/86400000):undefined};
export function examPolicyDecisionV1(context:ProductContextV1,sessionKind:ExamSessionKindV1='PRACTICE'):ExamPolicyDecisionV1{
 if(context.productMode!=='EXAM')throw new Error('exam_policy_requires_exam_context');
 const d=daysUntil(context.examContext?.deadline);const pressure=d===undefined?'MEDIUM':d<=14?'HIGH':d<=60?'MEDIUM':'LOW';const formal=sessionKind!=='PRACTICE';
 return Object.freeze({mode:'EXAM',scope:context.examContext?.scope??'UNSPECIFIED',deadline:context.examContext?.deadline,rubric:context.examContext?.rubric,timePressure:pressure,scoreValuePriority:10,sharedLearnerTruth:true,forkLearnerTruth:false,sessionKind,allowMidAttemptTeaching:!formal,allowHint:!formal,allowReveal:!formal,allowLookup:!formal});
}
export function formalAssessmentIntegrityFromExamPolicyV1(policy:ExamPolicyDecisionV1,integrityRef:string):FormalAssessmentIntegritySnapshotV1{
 if(policy.sessionKind==='PRACTICE')throw new Error('formal_integrity_requires_formal_or_mock');
 return Object.freeze({mode:'FORMAL_EXAM',hintsAvailable:policy.allowHint,answerRevealAvailable:policy.allowReveal,lookupAvailable:policy.allowLookup,modelAnswerVisible:false,midAttemptTeachingOccurred:policy.allowMidAttemptTeaching,integrityRef});
}
