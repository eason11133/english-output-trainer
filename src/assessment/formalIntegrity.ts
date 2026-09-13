import type { FormalAssessmentIntegrityResultV1,FormalAssessmentIntegritySnapshotV1 } from './types';
export function validateFormalAssessmentIntegrityV1(snapshot:FormalAssessmentIntegritySnapshotV1|undefined):FormalAssessmentIntegrityResultV1{
  if(!snapshot)return{valid:false,reasons:Object.freeze(['FORMAL_ASSESSMENT_INTEGRITY_SNAPSHOT_MISSING'])};
  const reasons:string[]=[];
  if(!snapshot.integrityRef.trim())reasons.push('FORMAL_ASSESSMENT_INTEGRITY_REF_MISSING');
  if(snapshot.hintsAvailable)reasons.push('FORMAL_ASSESSMENT_HINT_AVAILABLE');
  if(snapshot.answerRevealAvailable)reasons.push('FORMAL_ASSESSMENT_ANSWER_REVEAL_AVAILABLE');
  if(snapshot.lookupAvailable)reasons.push('FORMAL_ASSESSMENT_LOOKUP_AVAILABLE');
  if(snapshot.modelAnswerVisible)reasons.push('FORMAL_ASSESSMENT_MODEL_VISIBLE');
  if(snapshot.midAttemptTeachingOccurred)reasons.push('FORMAL_ASSESSMENT_MID_ATTEMPT_TEACHING_OCCURRED');
  return{valid:reasons.length===0,reasons:Object.freeze(reasons)};
}
