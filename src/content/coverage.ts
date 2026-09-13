import { coreEnglishDomainPortV2 } from '../domain/english';
import type { EnglishContentBindingV1 } from '../domain/english/EnglishDomainGraph';
import type { LearningContentBundleV1 } from './learnerContent';
import { translationFreshTaskPackV1, writingFreshTaskPackV1 } from './contentPacks';
import type { ContentCoverageEntryV1, ContentCoverageQueryV1, ContentCoverageResultV1, CorpusSemanticBindingResultV1, SemanticBindingEvidenceV1 } from './types';

const measured=Object.freeze(['ACTIVE_PRACTICE','FRESH_CHECK','CHANGED_CONTEXT_TRANSFER','DELAYED_RETENTION'] as const);
const curated=(ref:string):SemanticBindingEvidenceV1=>Object.freeze({kind:'CURATED_SEMANTIC_REQUIREMENTS',sourceRef:ref,explanation:'Curated targetRefs and semanticRequirements are checked by the named G delivery validator.'});
function packEntries(arena:'WRITING'|'TRANSLATION'):ContentCoverageEntryV1[]{
  const packs=arena==='WRITING'?writingFreshTaskPackV1:translationFreshTaskPackV1,validator=arena==='WRITING'?'G:deterministic-contract-validator-v1':'G:deterministic-translation-contract-validator-v1';
  return packs.flatMap(template=>template.targetRefs.flatMap(targetRef=>template.facets.map(facet=>Object.freeze({
    contentRef:`${template.provenanceRef}#${template.id}`,sourceKind:'CURATED_PACK' as const,targetRef,facet,arena,supportedUseCases:measured,
    context:Object.freeze({identity:template.contextKey,noveltyQualification:'VALIDATED_AT_DELIVERY' as const}),load:Object.freeze({...template.load}),
    exposure:Object.freeze({answer:'NONE_IN_CONTENT' as const,cue:'NEED_BOUND' as const}),semanticRequirements:Object.freeze([...template.semanticRequirements]),
    provenanceRefs:Object.freeze([template.provenanceRef]),validatorRefs:Object.freeze([validator]),productionEligibility:'DETERMINISTIC_VALIDATION_REQUIRED' as const,
    semanticBinding:curated(template.provenanceRef),instructionalEligibility:Object.freeze(['TEACH','GUIDED_PRACTICE'] as const),measurementEligibility:measured,
  }))));
}
export const canonicalContentCoverageV1:readonly ContentCoverageEntryV1[]=Object.freeze([...packEntries('WRITING'),...packEntries('TRANSLATION')]);
const norm=(v:string|undefined)=>v?.trim().toLowerCase();
const hasData=(b:LearningContentBundleV1)=>Boolean((b.senses?.length??0)+b.morphology.length+b.examples.length+b.sentencePairs.length+b.relations.length);
function bindingSupportsFacet(binding:EnglishContentBindingV1,facet:ContentCoverageEntryV1['facet']){
  if(binding.kind==='LEXEME_IDENTITY')return facet==='FORM_RECOGNITION';
  if(binding.kind==='SENSE_IDENTITY')return facet==='FORM_TO_MEANING'||facet==='SENSE_DISCRIMINATION';
  if(binding.kind==='WORD_FORM_IDENTITY')return facet==='FORM_RECOGNITION'||facet==='MORPHOLOGY'||facet==='ORTHOGRAPHIC_PRODUCTION';
  return facet==='MORPHOLOGY';
}
function prove(b:LearningContentBundleV1,x:EnglishContentBindingV1):SemanticBindingEvidenceV1|undefined{
  if(x.kind==='LEXEME_IDENTITY'){
    const lemma=norm(x.lemma),ok=norm(b.lemma)===lemma||b.examples.some(r=>norm(r.lemma)===lemma)||b.morphology.some(r=>norm(r.lemma)===lemma);
    return ok?Object.freeze({kind:'LEXEME_IDENTITY',sourceRef:`lemma:${x.lemma}`,explanation:`Corpus record lemma exactly matches ${x.lemma}.`}):undefined;
  }
  if(x.kind==='SENSE_IDENTITY'){
    const ok=norm(b.lemma)===norm(x.lemma)&&(b.senses??[]).some(r=>r.senseId===x.sourceRecordId&&r.provenance.sourceId===x.sourceId);
    return ok?Object.freeze({kind:'SENSE_IDENTITY',sourceRef:`${x.sourceId}:${x.sourceRecordId}`,explanation:'Exact source, lemma, and sense record identity match.'}):undefined;
  }
  if(x.kind==='WORD_FORM_IDENTITY'){
    const ok=b.morphology.some(r=>norm(r.lemma)===norm(x.lemma)&&norm(r.form)===norm(x.form)&&x.requiredFeatures.every(feature=>r.features.includes(feature)));
    return ok?Object.freeze({kind:'WORD_FORM_IDENTITY',sourceRef:`unimorph:${x.lemma}:${x.form}`,explanation:'Exact lemma, surface form, and required UniMorph features match.'}):undefined;
  }
  const rows=b.morphology.filter(r=>norm(r.lemma)===norm(x.probeLemma));
  const present=rows.some(r=>r.features.includes('V')&&r.features.includes('PRS')&&r.features.includes('3')&&r.features.includes('SG')&&norm(r.form)===`${norm(r.lemma)}s`)&&rows.some(p=>p.features.includes('V')&&p.features.includes('PST')&&norm(p.form)===`${norm(p.lemma)}ed`);
  return present?Object.freeze({kind:'MORPHOLOGY_PATTERN',sourceRef:`unimorph:${x.probeLemma}`,explanation:'One lemma has structurally matching V;PRS;3;SG +s and V;PST +ed records.'}):undefined;
}
export function bindCorpusBundleToContentCoverageV1(input:{bundle:LearningContentBundleV1;targetRef:string;facet:ContentCoverageEntryV1['facet'];arena:ContentCoverageEntryV1['arena']}):CorpusSemanticBindingResultV1{
  const canonical=coreEnglishDomainPortV2.resolveId(input.targetRef),node=canonical?coreEnglishDomainPortV2.get(canonical):undefined,empty=Object.freeze([]);
  const base={targetRef:input.targetRef,facet:input.facet,entries:empty,evidence:empty};
  if(!node||canonical!==input.targetRef||!coreEnglishDomainPortV2.supportsFacet(canonical,input.facet))return Object.freeze({...base,status:'NO_RELEVANT_DATA',reasonCodes:Object.freeze(['CANONICAL_TARGET_FACET_NOT_FOUND'])});
  if(!hasData(input.bundle)||input.bundle.licenseStatus==='NO_USABLE_RESULTS'||!input.bundle.provenance.length)return Object.freeze({...base,status:'NO_RELEVANT_DATA',reasonCodes:Object.freeze(['NO_ELIGIBLE_CORPUS_DATA'])});
  const evidence=(node.contentBindings??[]).filter(x=>bindingSupportsFacet(x,input.facet)).map(x=>prove(input.bundle,x)).filter((x):x is SemanticBindingEvidenceV1=>Boolean(x));
  if(!evidence.length)return Object.freeze({...base,status:'DATA_EXISTS_BUT_UNBOUND',reasonCodes:Object.freeze(['NO_DETERMINISTIC_SEMANTIC_BINDING'])});
  const provenanceRefs=Object.freeze([...new Set(input.bundle.provenance.map(x=>`${x.sourceId}:${x.sourceVersion}:${x.sourceRecordId}`))]);
  const entry:ContentCoverageEntryV1=Object.freeze({contentRef:`corpus-bundle:${canonical}:${evidence[0].sourceRef}`,sourceKind:'CORPUS',targetRef:canonical,facet:input.facet,arena:input.arena,supportedUseCases:Object.freeze(['TEACH','GUIDED_PRACTICE'] as const),context:Object.freeze({noveltyQualification:'NOT_QUALIFIED'}),exposure:Object.freeze({answer:'UNKNOWN',cue:'UNKNOWN'}),semanticRequirements:Object.freeze([]),provenanceRefs,validatorRefs:Object.freeze([]),productionEligibility:'DATA_CANDIDATE_ONLY',semanticBinding:evidence[0],instructionalEligibility:Object.freeze(['TEACH','GUIDED_PRACTICE'] as const),measurementEligibility:Object.freeze([])});
  return Object.freeze({...base,status:'SEMANTICALLY_BOUND',entries:Object.freeze([entry]),evidence:Object.freeze(evidence),reasonCodes:Object.freeze(['DETERMINISTIC_SEMANTIC_BINDING'])});
}
export function queryContentCoverageV1(query:ContentCoverageQueryV1):ContentCoverageResultV1{
  const canonical=coreEnglishDomainPortV2.resolveId(query.targetRef);
  if(!canonical||canonical!==query.targetRef||!coreEnglishDomainPortV2.supportsFacet(query.targetRef,query.facet))return Object.freeze({...query,entries:Object.freeze([]),status:'NO_CONTENT',reasonCodes:Object.freeze(['CANONICAL_TARGET_FACET_NOT_FOUND'])});
  const all=[...canonicalContentCoverageV1,...(query.dataCandidates??[])].filter(e=>e.targetRef===query.targetRef&&e.facet===query.facet&&e.arena===query.arena);
  const deliverable=all.filter(e=>e.productionEligibility==='DETERMINISTIC_VALIDATION_REQUIRED'&&(e.measurementEligibility.some(x=>x===query.useCase)||e.instructionalEligibility.some(x=>x===query.useCase)));
  if(deliverable.length)return Object.freeze({...query,entries:Object.freeze(deliverable),status:'VALIDATED_DELIVERY_AVAILABLE',reasonCodes:Object.freeze(['G_VALIDATION_STILL_REQUIRED'])});
  const instructional=all.filter(e=>e.instructionalEligibility.some(x=>x===query.useCase));
  if(instructional.length)return Object.freeze({...query,entries:Object.freeze(instructional),status:'DATA_CANDIDATE_ONLY',reasonCodes:Object.freeze(['SEMANTICALLY_BOUND_INSTRUCTIONAL_CONTENT_ONLY'])});
  const dataOnly=all.filter(e=>e.productionEligibility==='DATA_CANDIDATE_ONLY');
  if(dataOnly.length)return Object.freeze({...query,entries:Object.freeze(dataOnly),status:'DATA_CANDIDATE_ONLY',reasonCodes:Object.freeze(['CORPUS_CONTENT_NOT_MEASUREMENT_QUALIFIED'])});
  if(all.length)return Object.freeze({...query,entries:Object.freeze(all),status:'PURPOSE_NOT_SUPPORTED',reasonCodes:Object.freeze(['DELIVERY_USE_CASE_UNAVAILABLE'])});
  return Object.freeze({...query,entries:Object.freeze([]),status:'NO_CONTENT',reasonCodes:Object.freeze(['NO_BOUND_CONTENT'])});
}
