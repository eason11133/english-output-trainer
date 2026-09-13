import type { LessonPlanV1 } from '../curriculum';
import type { CapabilityFacet } from '../domain/english/EnglishDomain';
import type { EnglishCorpusRetrievalPortV1 } from '../domain/english/corpusRetrieval';
import { coreEnglishDomainPortV2 } from '../domain/english';
import { pckMechanismByIdV1 } from '../teaching';
import { bindCorpusBundleToContentCoverageV1, canonicalContentCoverageV1 } from './coverage';
import { createLearningContentGatewayV1, type LearningContentRequestV1 } from './learnerContent';
import type { SemanticBindingEvidenceV1 } from './types';

export interface TeachingContentCandidateV1{contentRef:string;kind:'SENSE'|'MORPHOLOGY'|'EXAMPLE'|'CURATED_REQUIREMENT';learnerVisibleText:string;provenanceRefs:readonly string[];binding:SemanticBindingEvidenceV1;instructionalOnly:true}
export interface TeachingContentResolutionV1{lessonPlanId:string;targetRef:string;facet:CapabilityFacet;mechanismId:string;candidates:readonly TeachingContentCandidateV1[];measurementEligible:false;reasonCodes:readonly string[]}
export async function resolveTeachingContentV1(input:{lessonPlan:LessonPlanV1;mechanismId:string;corpus?:EnglishCorpusRetrievalPortV1;maxItems?:number}):Promise<TeachingContentResolutionV1>{
  const mechanism=pckMechanismByIdV1(input.mechanismId),node=coreEnglishDomainPortV2.get(input.lessonPlan.targetRef),binding=node?.contentBindings?.[0],max=Math.max(1,Math.min(6,input.maxItems??3));
  const base={lessonPlanId:input.lessonPlan.id,targetRef:input.lessonPlan.targetRef,facet:input.lessonPlan.facet as CapabilityFacet,mechanismId:input.mechanismId,measurementEligible:false as const};
  if(!mechanism)return Object.freeze({...base,candidates:Object.freeze([]),reasonCodes:Object.freeze(['MECHANISM_NOT_REGISTERED'])});
  if(mechanism.contentRequirements.includes('CURATED_SEMANTIC_TASK')){
    const entries=canonicalContentCoverageV1.filter(x=>x.targetRef===input.lessonPlan.targetRef&&x.facet===input.lessonPlan.facet).slice(0,max);
    const candidates=entries.map((entry,index):TeachingContentCandidateV1=>Object.freeze({contentRef:entry.contentRef,kind:'CURATED_REQUIREMENT',learnerVisibleText:entry.semanticRequirements[index%entry.semanticRequirements.length]??input.lessonPlan.objective,provenanceRefs:entry.provenanceRefs,binding:entry.semanticBinding,instructionalOnly:true}));
    return Object.freeze({...base,candidates:Object.freeze(candidates),reasonCodes:Object.freeze(candidates.length?['CURATED_SEMANTIC_CONTENT_BOUND']:['NO_CURATED_TARGET_CONTENT'])});
  }
  if(!binding)return Object.freeze({...base,candidates:Object.freeze([]),reasonCodes:Object.freeze(['NO_CANONICAL_CONTENT_BINDING'])});
  if(!input.corpus)return Object.freeze({...base,candidates:Object.freeze([]),reasonCodes:Object.freeze(['CORPUS_UNAVAILABLE'])});
  const requirements=mechanism.contentRequirements,lemma=binding.kind==='MORPHOLOGY_PATTERN'?binding.probeLemma:binding.lemma;
  const needs:LearningContentRequestV1['needs']=Object.freeze([...new Set(requirements.flatMap(x=>x==='SENSE_EVIDENCE'?['SENSE' as const]:x==='MORPHOLOGY_EVIDENCE'?['MORPHOLOGY' as const]:x==='EXAMPLE'?['EXAMPLE' as const]:[]))]);
  if(!needs.length)return Object.freeze({...base,candidates:Object.freeze([]),reasonCodes:Object.freeze(['MECHANISM_USES_CURATED_OR_NO_EXTERNAL_CONTENT'])});
  const bundle=await createLearningContentGatewayV1(input.corpus).resolve({purpose:requirements.includes('MORPHOLOGY_EVIDENCE')?'SPELLING_RECONSTRUCTION':requirements.includes('SENSE_EVIDENCE')?'MEANING_CONTRAST':'LEXICAL_RETRIEVAL',arena:'WRITING',sourceContext:`lesson:${input.lessonPlan.id}`,lemma,senseId:binding.kind==='SENSE_IDENTITY'?binding.sourceRecordId:undefined,needs,maxItems:max,excludeContentIds:Object.freeze([])});
  const bound=bindCorpusBundleToContentCoverageV1({bundle,targetRef:input.lessonPlan.targetRef,facet:input.lessonPlan.facet as CapabilityFacet,arena:'LANGUAGE'});
  if(bound.status!=='SEMANTICALLY_BOUND')return Object.freeze({...base,candidates:Object.freeze([]),reasonCodes:bound.reasonCodes});
  const provenanceRefs=bound.entries[0].provenanceRefs,bindingEvidence=bound.evidence[0],candidates:TeachingContentCandidateV1[]=[];
  if(requirements.includes('SENSE_EVIDENCE'))for(const row of bundle.senses??[])candidates.push({contentRef:`sense:${row.senseId}`,kind:'SENSE',learnerVisibleText:row.glosses.join('；'),provenanceRefs,binding:bindingEvidence,instructionalOnly:true});
  if(requirements.includes('MORPHOLOGY_EVIDENCE'))for(const row of bundle.morphology)candidates.push({contentRef:`morph:${row.provenance.sourceRecordId}`,kind:'MORPHOLOGY',learnerVisibleText:`${row.lemma} → ${row.form}`,provenanceRefs,binding:bindingEvidence,instructionalOnly:true});
  if(requirements.includes('EXAMPLE'))for(const row of bundle.examples)candidates.push({contentRef:`example:${row.exampleId}`,kind:'EXAMPLE',learnerVisibleText:row.text,provenanceRefs,binding:bindingEvidence,instructionalOnly:true});
  return Object.freeze({...base,candidates:Object.freeze(candidates.slice(0,max)),reasonCodes:Object.freeze(['SEMANTICALLY_BOUND_INSTRUCTIONAL_CONTENT'])});
}
