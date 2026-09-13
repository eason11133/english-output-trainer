import { coreEnglishDomainPortV2 } from '../domain/english';
import type { WritingTaskGenerationNeedV1, WritingTaskSourceViewV1 } from './types';
import { writingFreshTaskPackV1 } from './contentPacks';
import type { GeneratedTaskValidationResultV1, GeneratedWritingTaskCandidateV1 } from './types';

const words=(text:string)=>new Set((text.toLowerCase().match(/[a-z]+/g)??[]).filter(word=>word.length>2));
const overlap=(a:string,b:string)=>{const x=words(a),y=words(b);if(!x.size||!y.size)return 0;let shared=0;for(const token of x)if(y.has(token))shared++;return shared/Math.min(x.size,y.size)};
const normalized=(text:string)=>text.trim().replace(/\s+/g,' ').toLowerCase();
const sameLoad=(a:GeneratedWritingTaskCandidateV1['load'],b:GeneratedWritingTaskCandidateV1['load'])=>a.length===b.length&&a.reasoning===b.reasoning&&a.ideaGeneration===b.ideaGeneration&&a.contentSupport===b.contentSupport&&a.clauses===b.clauses;

function curatedBindingErrors(candidate:GeneratedWritingTaskCandidateV1){
  const errors:string[]=[];
  const template=writingFreshTaskPackV1.find(item=>candidate.contentRef===`${item.provenanceRef}#${item.id}`);
  if(!template)return['CURATED_CONTENT_REF_NOT_PINNED'];
  if(candidate.promptText!==template.promptText)errors.push('CURATED_PROMPT_CONTENT_MISMATCH');
  if(candidate.contextKey!==template.contextKey)errors.push('CURATED_CONTEXT_KEY_MISMATCH');
  if(!template.targetRefs.includes(candidate.targetRef))errors.push('CURATED_TARGET_NOT_ALLOWED');
  if(!template.facets.includes(candidate.facet))errors.push('CURATED_FACET_NOT_ALLOWED');
  if(candidate.responseScope!==template.responseScope)errors.push('CURATED_RESPONSE_SCOPE_MISMATCH');
  if(!sameLoad(candidate.load,template.load))errors.push('CURATED_LOAD_MISMATCH');
  for(const requirement of template.semanticRequirements)if(!candidate.semanticRequirements.includes(requirement))errors.push('CURATED_SEMANTIC_REQUIREMENT_DROPPED');
  return errors;
}

export function validateGeneratedWritingTaskV1(input:{candidate:GeneratedWritingTaskCandidateV1;need:WritingTaskGenerationNeedV1;source:WritingTaskSourceViewV1}):GeneratedTaskValidationResultV1{
  const c=input.candidate,n=input.need,s=input.source,errors:string[]=[],warnings:string[]=[];
  const canonical=coreEnglishDomainPortV2.resolveId(c.targetRef);
  if(!canonical||canonical!==c.targetRef)errors.push('TARGET_NOT_CANONICAL');
  if(c.targetRef!==n.targetRef)errors.push('TARGET_MISMATCH');
  if(c.facet!==n.facet)errors.push('FACET_MISMATCH');
  if(c.purpose!==n.purpose)errors.push('PURPOSE_MISMATCH');
  if(c.desiredContextDistance!==n.desiredContextDistance)errors.push('CONTEXT_DISTANCE_POLICY_MISMATCH');
  if(!c.promptText.trim())errors.push('PROMPT_EMPTY');
  if(normalized(c.promptText)===normalized(s.promptText))errors.push('PROMPT_NOT_FRESH');
  if(c.validAlternatives!=='ACCEPT')errors.push('VALID_ALTERNATIVES_MUST_BE_ACCEPTED');
  if(c.targetNameVisible!==n.targetNameVisible)errors.push('TARGET_VISIBILITY_MISMATCH');
  if(c.functionCueVisible!==n.functionCueVisible)errors.push('FUNCTION_CUE_VISIBILITY_MISMATCH');
  if(c.planningSupportAllowed!==n.planningSupportAllowed)errors.push('PLANNING_SUPPORT_MISMATCH');
  if(c.recentModelPrimeAllowed!==n.recentModelPrimeAllowed)errors.push('MODEL_PRIME_POLICY_MISMATCH');
  if(c.responseScope!==n.responseScope)errors.push('RESPONSE_SCOPE_MISMATCH');
  if(n.purpose==='CHANGED_CONTEXT_TRANSFER'&&c.contextNovelty!=='CHANGED_CONTEXT')errors.push('TRANSFER_CONTEXT_NOT_CHANGED');
  if(n.purpose==='FRESH_CHECK'&&c.contextNovelty!=='SAME_CONTEXT')errors.push('FRESH_CHECK_CONTEXT_MISMATCH');
  if(c.provenance==='CURATED_PACK')errors.push(...curatedBindingErrors(c));
  else if(c.provenance==='AI_PROPOSAL')errors.push('AI_PROPOSAL_REQUIRES_INDEPENDENT_SEMANTIC_VALIDATOR');
  else errors.push('UNREVIEWED_TEMPLATE_NOT_DELIVERABLE');
  if(!c.validatorRefs.includes('G:deterministic-contract-validator-v1'))errors.push('CONTRACT_VALIDATOR_PROVENANCE_MISSING');
  if(!c.validatorRefs.length)errors.push('VALIDATOR_PROVENANCE_MISSING');
  for(const forbidden of n.forbiddenReuse){if(forbidden.trim()&&normalized(c.promptText).includes(normalized(forbidden)))errors.push('FORBIDDEN_REUSE_PRESENT')}
  const target=coreEnglishDomainPortV2.get(c.targetRef);
  if(target&&!n.targetNameVisible){const leakTerms=[target.label,...target.aliases].map(normalized).filter(term=>term.length>2);if(leakTerms.some(term=>normalized(c.promptText).includes(term)))errors.push('TARGET_FORM_LEAK')}
  const lexicalOverlap=overlap(c.promptText,s.promptText);
  if(n.purpose==='CHANGED_CONTEXT_TRANSFER'&&lexicalOverlap>0.55)errors.push('CONTEXT_DISTANCE_TOO_SMALL');
  else if(lexicalOverlap>0.7)warnings.push('HIGH_SOURCE_PROMPT_OVERLAP');
  if(c.load.clauses<1||c.load.clauses>3)errors.push('UNSUPPORTED_CLAUSE_LOAD');
  if(c.load.length==='HIGH'&&c.responseScope==='SENTENCE')warnings.push('HIGH_LENGTH_FOR_SENTENCE_SCOPE');
  if(!c.semanticRequirements.length)errors.push('SEMANTIC_REQUIREMENTS_MISSING');
  return Object.freeze({deliveryAllowed:errors.length===0,errors:Object.freeze([...new Set(errors)]),warnings:Object.freeze([...new Set(warnings)]),candidate:c});
}
