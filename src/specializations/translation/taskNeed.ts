import type { LessonPlanV1 } from '../../architecture/contracts';
import type { CapabilityFacet } from '../../domain/english/EnglishDomain';
import type { TranslationTaskGenerationNeedV1 } from '../../content/types';
import type { TranslationSourceContextV1 } from './types';
export function createTranslationTaskGenerationNeedV1(input:{lessonPlan:LessonPlanV1;source:TranslationSourceContextV1;purpose:TranslationTaskGenerationNeedV1['purpose'];desiredContextDistance:TranslationTaskGenerationNeedV1['desiredContextDistance'];semanticRequirements?:readonly string[];forbiddenReuse?:readonly string[];targetNameVisible?:boolean;functionCueVisible?:boolean;recentModelPrimeAllowed?:boolean}):TranslationTaskGenerationNeedV1{
  return Object.freeze({targetRef:input.lessonPlan.targetRef,facet:input.lessonPlan.facet as CapabilityFacet,purpose:input.purpose,desiredContextDistance:input.desiredContextDistance,targetNameVisible:input.targetNameVisible??false,functionCueVisible:input.functionCueVisible??false,recentModelPrimeAllowed:input.recentModelPrimeAllowed??false,validAlternatives:'ACCEPT',semanticRequirements:Object.freeze([...(input.semanticRequirements??[])]),forbiddenReuse:Object.freeze([input.source.sourceText,...(input.forbiddenReuse??[])]),observationWanted:`translation:${input.lessonPlan.targetRef}:${input.lessonPlan.facet}`});
}
