import type { EnglishCorpusRetrievalPortV1 } from '../domain/english/corpusRetrieval';
import { coreEnglishDomainGraphV2, coreEnglishDomainPortV2, type EnglishDomainNodeV2 } from '../domain/english';
import type { EnglishContentBindingV1 } from '../domain/english/EnglishDomainGraph';
import { createLearningContentGatewayV1, type LearningContentBundleV1, type LearningContentRequestV1 } from './learnerContent';
import { bindCorpusBundleToContentCoverageV1, canonicalContentCoverageV1, queryContentCoverageV1 } from './coverage';
import type { ContentCoverageEntryV1, ContentCoverageStatusV1, ContentDeliveryUseCaseV1, SemanticBindingStatusV1 } from './types';

export const contentDeliveryUseCasesV1:readonly ContentDeliveryUseCaseV1[]=Object.freeze(['TEACH','GUIDED_PRACTICE','ACTIVE_PRACTICE','FRESH_CHECK','CHANGED_CONTEXT_TRANSFER','DELAYED_RETENTION']);
export type ContentGapClassV1='NO_DATA'|'DATA_EXISTS_BUT_UNBOUND'|'SEMANTICALLY_BOUND_DATA_CANDIDATE_ONLY'|'PURPOSE_NOT_IMPLEMENTED'|'VALIDATED_DELIVERY_AVAILABLE';
export interface ContentCoverageCensusCellV1{useCase:ContentDeliveryUseCaseV1;status:ContentCoverageStatusV1;gapClass:ContentGapClassV1;candidateCount:number;sourceTypes:readonly ContentCoverageEntryV1['sourceKind'][];provenanceRefs:readonly string[];validatorRefs:readonly string[];contextMetadataAvailable:boolean;loadMetadataAvailable:boolean;reasonCodes:readonly string[]}
export interface ContentCoverageCensusRowV1{targetRef:string;nodeKind:EnglishDomainNodeV2['kind'];area:EnglishDomainNodeV2['area'];facet:ContentCoverageEntryV1['facet'];prerequisiteRefs:readonly string[];rawCorpusCandidateCount:number;semanticBindingStatus:SemanticBindingStatusV1;bindingEvidence:readonly string[];cells:readonly ContentCoverageCensusCellV1[]}
export interface CanonicalContentCoverageCensusV1{schemaVersion:2;artifactStatus:'CANONICAL_SEMANTIC_BINDING_CENSUS';supersedes:'PROVISIONAL_TARGET_ASSERTED_CENSUS';domainVersion:string;nodeCount:number;targetFacetCount:number;useCases:readonly ContentDeliveryUseCaseV1[];rows:readonly ContentCoverageCensusRowV1[]}

function probe(binding:EnglishContentBindingV1):LearningContentRequestV1{
  const lemma=binding.kind==='MORPHOLOGY_PATTERN'?binding.probeLemma:binding.lemma;
  return {purpose:binding.kind==='SENSE_IDENTITY'?'MEANING_CONTRAST':binding.kind==='MORPHOLOGY_PATTERN'||binding.kind==='WORD_FORM_IDENTITY'?'SPELLING_RECONSTRUCTION':'LEXICAL_RETRIEVAL',arena:'WRITING',sourceContext:'canonical semantic coverage census',lemma,surfaceForm:binding.kind==='WORD_FORM_IDENTITY'?binding.form:undefined,senseId:binding.kind==='SENSE_IDENTITY'?binding.sourceRecordId:undefined,needs:binding.kind==='SENSE_IDENTITY'?['SENSE','EXAMPLE']:binding.kind==='MORPHOLOGY_PATTERN'||binding.kind==='WORD_FORM_IDENTITY'?['MORPHOLOGY']:['SENSE','MORPHOLOGY','EXAMPLE','SENTENCE_PAIR'],maxItems:8,excludeContentIds:Object.freeze([])};
}
const count=(b:LearningContentBundleV1)=>Number(b.senses?.length??0)+b.morphology.length+b.examples.length+b.sentencePairs.length+b.relations.length;
const unique=<T>(v:readonly T[])=>Object.freeze([...new Set(v)]);
function gap(status:ContentCoverageStatusV1,binding:SemanticBindingStatusV1,useCase:ContentDeliveryUseCaseV1,hasAnyCoverage:boolean):ContentGapClassV1{
  if(status==='VALIDATED_DELIVERY_AVAILABLE')return'VALIDATED_DELIVERY_AVAILABLE';
  if(binding==='SEMANTICALLY_BOUND')return ['TEACH','GUIDED_PRACTICE'].includes(useCase)?'SEMANTICALLY_BOUND_DATA_CANDIDATE_ONLY':'PURPOSE_NOT_IMPLEMENTED';
  if(hasAnyCoverage)return'PURPOSE_NOT_IMPLEMENTED';
  return binding==='DATA_EXISTS_BUT_UNBOUND'?'DATA_EXISTS_BUT_UNBOUND':'NO_DATA';
}
export async function buildCanonicalContentCoverageCensusV1(corpus?:EnglishCorpusRetrievalPortV1):Promise<CanonicalContentCoverageCensusV1>{
  const gateway=corpus?createLearningContentGatewayV1(corpus):undefined,rows:ContentCoverageCensusRowV1[]=[];
  for(const node of coreEnglishDomainGraphV2.nodes){
    const bindings=node.contentBindings??[],bundles=gateway?await Promise.all(bindings.map(x=>gateway.resolve(probe(x)))):[],raw=bundles.reduce((n,b)=>n+count(b),0);
    for(const facet of node.facets){
      const results=bundles.map(bundle=>bindCorpusBundleToContentCoverageV1({bundle,targetRef:node.id,facet,arena:'LANGUAGE'}));
      const curated=canonicalContentCoverageV1.filter(entry=>entry.targetRef===node.id&&entry.facet===facet);
      const semanticBindingStatus:SemanticBindingStatusV1=results.some(x=>x.status==='SEMANTICALLY_BOUND')||curated.length?'SEMANTICALLY_BOUND':raw?'DATA_EXISTS_BUT_UNBOUND':'NO_RELEVANT_DATA';
      const candidates=results.flatMap(x=>x.entries),bindingEvidence=unique([...results.flatMap(x=>x.evidence.map(e=>`${e.kind}:${e.sourceRef}`)),...curated.map(entry=>`${entry.semanticBinding.kind}:${entry.semanticBinding.sourceRef}`)]);
      const cells=contentDeliveryUseCasesV1.map(useCase=>{
        const queries=(['WRITING','TRANSLATION','LANGUAGE'] as const).map(arena=>queryContentCoverageV1({targetRef:node.id,facet,arena,useCase,dataCandidates:arena==='LANGUAGE'?candidates:undefined}));
        const preferred=queries.find(x=>x.status==='VALIDATED_DELIVERY_AVAILABLE')??queries.find(x=>x.entries.length)??queries[0],entries=preferred.entries,hasAny=queries.some(x=>x.entries.length);
        return Object.freeze({useCase,status:preferred.status,gapClass:gap(preferred.status,semanticBindingStatus,useCase,hasAny),candidateCount:new Set(entries.map(x=>x.contentRef)).size,sourceTypes:unique(entries.map(x=>x.sourceKind)),provenanceRefs:unique(entries.flatMap(x=>x.provenanceRefs)),validatorRefs:unique(entries.flatMap(x=>x.validatorRefs)),contextMetadataAvailable:entries.some(x=>Boolean(x.context.identity)||x.context.noveltyQualification!=='NOT_QUALIFIED'),loadMetadataAvailable:entries.some(x=>Boolean(x.load)),reasonCodes:Object.freeze([...preferred.reasonCodes,...(semanticBindingStatus==='DATA_EXISTS_BUT_UNBOUND'?['DATA_PRESENT_WITHOUT_CANONICAL_BINDING']:[])])});
      });
      rows.push(Object.freeze({targetRef:node.id,nodeKind:node.kind,area:node.area,facet,prerequisiteRefs:Object.freeze([...coreEnglishDomainPortV2.prerequisites(node.id)]),rawCorpusCandidateCount:raw,semanticBindingStatus,bindingEvidence,cells:Object.freeze(cells)}));
    }
  }
  return Object.freeze({schemaVersion:2,artifactStatus:'CANONICAL_SEMANTIC_BINDING_CENSUS',supersedes:'PROVISIONAL_TARGET_ASSERTED_CENSUS',domainVersion:coreEnglishDomainGraphV2.version,nodeCount:coreEnglishDomainGraphV2.nodes.length,targetFacetCount:rows.length,useCases:contentDeliveryUseCasesV1,rows:Object.freeze(rows)});
}
