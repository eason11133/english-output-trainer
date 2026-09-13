import type { LessonPlanV1 } from '../../architecture/contracts';
import type { WritingArtifactContextV1, WritingIntentUnitV1, WritingOpportunityCandidateV1, WritingSourceContextV1, WritingTeachingContextV1 } from './types';

export function compileWritingTeachingContextV1(input:{lessonPlan:LessonPlanV1;sourceContext:WritingSourceContextV1;artifact:WritingArtifactContextV1;focusCandidate:WritingOpportunityCandidateV1;localTextWindow:string;paragraphFunction?:string;learnerIntent?:WritingIntentUnitV1}):WritingTeachingContextV1{
  if(!input.focusCandidate.targetRefs.includes(input.lessonPlan.targetRef))throw new Error('writing focus candidate cannot hijack D target');
  if(!input.focusCandidate.facets.includes(input.lessonPlan.facet as never))throw new Error('writing focus candidate cannot hijack D facet');
  if(input.artifact.originalRevisionId===input.artifact.workingRevisionId&&input.artifact.revisions.length>1)throw new Error('working revision identity inconsistent');
  const revisions=input.artifact.revisions.filter(r=>r.revisionId===input.artifact.workingRevisionId);
  if(revisions.length!==1)throw new Error('working revision must resolve exactly once');
  const allowed:WritingTeachingContextV1['allowedLearnerActions']=input.focusCandidate.writingDimension==='ORGANIZATION'||input.focusCandidate.writingDimension==='COHERENCE'||input.focusCandidate.writingDimension==='COHESION'
    ?['SELECT','ORDER','MOVE_SPAN','REWRITE_SPAN','PRODUCE']
    :input.focusCandidate.writingDimension==='IDEA_AVAILABILITY'||input.focusCandidate.writingDimension==='REASONING_DEPTH'
      ?['SELECT','ADD_IDEA','REWRITE_SPAN','PRODUCE']
      :['SELECT','REWRITE_SPAN','CONSTRUCT','PRODUCE'];
  return Object.freeze({lessonPlan:input.lessonPlan,sourceContext:input.sourceContext,originalArtifactRef:input.artifact.originalArtifactId,workingRevisionRef:input.artifact.workingRevisionId,focusCandidate:input.focusCandidate,localTextWindow:input.localTextWindow,paragraphFunction:input.paragraphFunction,learnerIntent:input.learnerIntent,rubricRelevance:Object.freeze([...input.focusCandidate.rubricRelevance]),revisionHistory:Object.freeze(revisions[0].operations.slice(-8)),allowedLearnerActions:Object.freeze(allowed)});
}
