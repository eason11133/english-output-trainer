import { coreEnglishDomainPortV2 } from '../domain/english';
import type { InnerTutorDecisionInputV1, PedagogicalContextV1 } from './types';

export function compilePedagogicalContextV1(input:InnerTutorDecisionInputV1,now=new Date().toISOString()):PedagogicalContextV1{
  const {lessonPlan,learnerTruth}=input;
  const canonicalTarget=coreEnglishDomainPortV2.resolveId(lessonPlan.targetRef);
  if(!canonicalTarget||canonicalTarget!==lessonPlan.targetRef)throw new Error('pedagogical_context_requires_canonical_lesson_target');
  if(!coreEnglishDomainPortV2.supportsFacet(canonicalTarget,lessonPlan.facet as never))throw new Error('pedagogical_context_target_facet_mismatch');
  const requestedDimension=['FORM_RECOGNITION','FORM_TO_MEANING','SENSE_DISCRIMINATION','SELECTION'].includes(lessonPlan.facet)?'RECOGNITION':'PRODUCTION';
  const targetProjection=learnerTruth.capabilitySlice.find(item=>item.targetRef===canonicalTarget&&item.facet===lessonPlan.facet&&(item.senseId??'')===(lessonPlan.senseId??'')&&(item.performanceDimension??requestedDimension)===requestedDimension);
  const prerequisites=coreEnglishDomainPortV2.prerequisites(canonicalTarget).map(targetRef=>({targetRef,projection:learnerTruth.capabilitySlice.find(item=>item.targetRef===targetRef)}));
  return Object.freeze({
    lessonPlan,
    sourceTaskContext:input.sourceTaskContext?Object.freeze({...input.sourceTaskContext}):undefined,
    product:{learnerId:input.productContext.learnerId,goals:input.productContext.goals,learningPurpose:input.productContext.learningPurpose,useContexts:input.productContext.useContexts,currentPriority:input.productContext.currentPriority,productMode:input.productContext.productMode},
    targetProjection,
    prerequisites:Object.freeze(prerequisites),
    competingHypotheses:Object.freeze([...(targetProjection?.hypotheses??[])]),
    recentAttempts:Object.freeze([...input.recentAttempts].slice(-6)),
    recentTreatmentResponses:Object.freeze([...input.recentTreatmentResponses].slice(-6)),
    timeRemainingMinutes:Math.max(0,Math.min(input.timeRemainingMinutes,lessonPlan.timeBudgetMinutes)),
    sourceEvidenceIds:Object.freeze([...(targetProjection?.sourceEvidenceIds??[])]),
    compiledAt:now,
  });
}

export function isPedagogicalDecisionPointV1(input:InnerTutorDecisionInputV1):boolean{
  return ['LESSON_STARTED','LEARNER_RESPONSE','LEARNER_MANIPULATION','HELP_REQUESTED','SUPPORT_REVEALED','SUPPORT_REDUCTION_REQUESTED','SOURCE_CLARIFIED','TIME_EXHAUSTED','RESUMED'].includes(input.event.kind);
}
