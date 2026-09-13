import type { LessonPlanV1 } from '../architecture/contracts';
import { coreEnglishDomainPortV2 } from '../domain/english';
import type { TranslationTaskGenerationNeedV1, TranslationTaskSourceViewV1, GeneratedTranslationTaskCandidateV1, GeneratedTranslationTaskValidationResultV1, ValidatedTranslationTaskV1 } from './types';
import { translationFreshTaskPackV1, type CuratedTranslationTaskTemplateV1 } from './contentPacks';
import { queryContentCoverageV1 } from './coverage';

const normalized=(text:string)=>text.trim().replace(/\s+/g,' ').toLowerCase();
const sameLoad=(a:GeneratedTranslationTaskCandidateV1['load'],b:GeneratedTranslationTaskCandidateV1['load'])=>a.length===b.length&&a.reasoning===b.reasoning&&a.ideaGeneration===b.ideaGeneration&&a.contentSupport===b.contentSupport&&a.clauses===b.clauses;

function curatedBindingErrors(candidate:GeneratedTranslationTaskCandidateV1){
  const errors:string[]=[];
  const template=translationFreshTaskPackV1.find(item=>candidate.contentRef===`${item.provenanceRef}#${item.id}`);
  if(!template)return['CURATED_TRANSLATION_CONTENT_REF_NOT_PINNED'];
  if(candidate.sourceText!==template.sourceText)errors.push('CURATED_TRANSLATION_SOURCE_MISMATCH');
  if(candidate.contextKey!==template.contextKey)errors.push('CURATED_TRANSLATION_CONTEXT_KEY_MISMATCH');
  if(!template.targetRefs.includes(candidate.targetRef))errors.push('CURATED_TRANSLATION_TARGET_NOT_ALLOWED');
  if(!template.facets.includes(candidate.facet))errors.push('CURATED_TRANSLATION_FACET_NOT_ALLOWED');
  if(!sameLoad(candidate.load,template.load))errors.push('CURATED_TRANSLATION_LOAD_MISMATCH');
  for(const requirement of template.semanticRequirements)if(!candidate.semanticRequirements.includes(requirement))errors.push('CURATED_TRANSLATION_SEMANTIC_REQUIREMENT_DROPPED');
  return errors;
}

export function validateGeneratedTranslationTaskV1(input:{candidate:GeneratedTranslationTaskCandidateV1;need:TranslationTaskGenerationNeedV1;source:TranslationTaskSourceViewV1}):GeneratedTranslationTaskValidationResultV1{
  const c=input.candidate,n=input.need,s=input.source,errors:string[]=[];
  const canonical=coreEnglishDomainPortV2.resolveId(c.targetRef);
  if(!canonical||canonical!==c.targetRef)errors.push('TARGET_NOT_CANONICAL');
  if(c.targetRef!==n.targetRef)errors.push('TARGET_MISMATCH');
  if(c.facet!==n.facet)errors.push('FACET_MISMATCH');
  if(c.purpose!==n.purpose)errors.push('PURPOSE_MISMATCH');
  if(c.desiredContextDistance!==n.desiredContextDistance)errors.push('CONTEXT_DISTANCE_POLICY_MISMATCH');
  if(!c.sourceText.trim())errors.push('SOURCE_EMPTY');
  if(normalized(c.sourceText)===normalized(s.sourceText))errors.push('SOURCE_NOT_FRESH');
  if(n.forbiddenReuse.some(item=>item.trim()&&normalized(c.sourceText).includes(normalized(item))))errors.push('FORBIDDEN_REUSE_PRESENT');
  if(c.validAlternatives!=='ACCEPT')errors.push('VALID_ALTERNATIVES_MUST_BE_ACCEPTED');
  if(c.targetNameVisible!==n.targetNameVisible)errors.push('TARGET_VISIBILITY_MISMATCH');
  if(c.functionCueVisible!==n.functionCueVisible)errors.push('FUNCTION_CUE_VISIBILITY_MISMATCH');
  if(c.recentModelPrimeAllowed!==n.recentModelPrimeAllowed)errors.push('MODEL_PRIME_POLICY_MISMATCH');
  if(n.purpose==='CHANGED_CONTEXT_TRANSFER'&&c.contextNovelty!=='CHANGED_CONTEXT')errors.push('TRANSFER_CONTEXT_NOT_CHANGED');
  if(n.purpose==='FRESH_CHECK'&&c.contextNovelty!=='SAME_CONTEXT')errors.push('FRESH_CHECK_CONTEXT_MISMATCH');
  if(c.provenance==='CURATED_PACK')errors.push(...curatedBindingErrors(c));
  else if(c.provenance==='AI_PROPOSAL')errors.push('AI_PROPOSAL_REQUIRES_INDEPENDENT_SEMANTIC_VALIDATOR');
  else errors.push('UNREVIEWED_TEMPLATE_NOT_DELIVERABLE');
  if(!c.validatorRefs.includes('G:deterministic-translation-contract-validator-v1'))errors.push('CONTRACT_VALIDATOR_PROVENANCE_MISSING');
  if(!c.semanticRequirements.length)errors.push('SEMANTIC_REQUIREMENTS_MISSING');
  if(c.load.clauses<1||c.load.clauses>3)errors.push('UNSUPPORTED_CLAUSE_LOAD');
  return Object.freeze({deliveryAllowed:errors.length===0,errors:Object.freeze([...new Set(errors)]),candidate:c});
}

export function rankedCuratedTranslationTaskTemplatesV1(input:{lessonPlan:LessonPlanV1;source:TranslationTaskSourceViewV1;need:TranslationTaskGenerationNeedV1}){
  const coverage=queryContentCoverageV1({targetRef:input.lessonPlan.targetRef,facet:input.lessonPlan.facet as never,arena:'TRANSLATION',useCase:input.need.purpose});
  if(coverage.status!=='VALIDATED_DELIVERY_AVAILABLE')return Object.freeze([]);
  const refs=new Set(coverage.entries.map(entry=>entry.contentRef));
  const eligible=translationFreshTaskPackV1.filter(item=>refs.has(`${item.provenanceRef}#${item.id}`));
  const used=new Set(input.need.forbiddenReuse.map(normalized));
  return Object.freeze([...eligible].sort((a,b)=>Number(used.has(normalized(a.sourceText)))-Number(used.has(normalized(b.sourceText)))||a.id.localeCompare(b.id)));
}
function proposalFromTemplate(input:{runtimeId:string;lessonPlan:LessonPlanV1;need:TranslationTaskGenerationNeedV1;occurredAt:string},template:CuratedTranslationTaskTemplateV1,purpose:'FRESH_CHECK'|'CHANGED_CONTEXT_TRANSFER'):GeneratedTranslationTaskCandidateV1{
  return Object.freeze({taskId:`g:${input.runtimeId}:translation:${purpose}:${template.id}:${input.occurredAt}`,sourceText:template.sourceText,targetRef:input.lessonPlan.targetRef,facet:input.lessonPlan.facet as never,purpose,desiredContextDistance:input.need.desiredContextDistance,contextNovelty:purpose==='CHANGED_CONTEXT_TRANSFER'?'CHANGED_CONTEXT':'SAME_CONTEXT',contextKey:template.contextKey,validAlternatives:'ACCEPT',semanticRequirements:Object.freeze([...new Set([...template.semanticRequirements,...input.need.semanticRequirements])]),forbiddenReuse:Object.freeze([...input.need.forbiddenReuse]),targetNameVisible:input.need.targetNameVisible,functionCueVisible:input.need.functionCueVisible,recentModelPrimeAllowed:input.need.recentModelPrimeAllowed,load:Object.freeze({...template.load}),provenance:'CURATED_PACK',contentRef:`${template.provenanceRef}#${template.id}`,validationStatus:'PENDING',validatorRefs:Object.freeze([template.provenanceRef,'G:deterministic-translation-contract-validator-v1'])});
}
export function generateValidatedTranslationTaskV1(input:{runtimeId:string;lessonPlan:LessonPlanV1;source:TranslationTaskSourceViewV1;need:TranslationTaskGenerationNeedV1;occurredAt:string}):ValidatedTranslationTaskV1|undefined{
  if(input.need.purpose==='ACTIVE_PRACTICE')return undefined;
  const purpose=input.need.purpose;
  for(const template of rankedCuratedTranslationTaskTemplatesV1(input)){
    const proposal=proposalFromTemplate(input,template,purpose),firstPass=validateGeneratedTranslationTaskV1({candidate:proposal,need:input.need,source:input.source});
    if(!firstPass.deliveryAllowed)continue;
    const candidate:GeneratedTranslationTaskCandidateV1=Object.freeze({...proposal,validationStatus:'VALIDATED'});
    const validation=Object.freeze({...firstPass,candidate});
    const delivery=Object.freeze({taskId:candidate.taskId,sourceText:candidate.sourceText,targetRef:candidate.targetRef,facet:candidate.facet,purpose,desiredContextDistance:candidate.desiredContextDistance,contextNovelty:candidate.contextNovelty,contextKey:candidate.contextKey,generationRef:candidate.contentRef,semanticRequirements:candidate.semanticRequirements,deliveredAt:input.occurredAt,validated:true as const,validatorRefs:candidate.validatorRefs,load:candidate.load});
    return Object.freeze({candidate,delivery,validation});
  }
  return undefined;
}
