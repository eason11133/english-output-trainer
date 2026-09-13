import type { CapabilityFacet } from '../../domain/english/EnglishDomain';
import { pckMechanismByIdV1 } from '../../teaching/pckCatalog';
import type { ProductionBottleneckKindV1 } from '../../teaching/types';
import type { TranslationDimensionV1, TranslationOpportunityCandidateV1 } from './types';

export interface TranslationDiagnosticEvidenceV1 {
  evidenceId:string;
  source:'AUTHORIZED_TASK'|'AUTHORIZED_RUBRIC'|'SOURCE_ALIGNMENT'|'LEARNER_EXPLANATION'|'LEARNER_RETRIEVAL_PROBE'|'LANGUAGE_ANALYSIS';
  dimension:TranslationDimensionV1;
  sourceSpan?:{start:number;end:number};
  learnerSpan?:{start:number;end:number};
  rootIssueHypothesis:string;
  confidence:'LOW'|'MEDIUM'|'HIGH';
  status:'SUPPORTED'|'POSSIBLE'|'CONTRADICTED';
  reasonCodes:readonly string[];
  targetRefs:readonly string[];
  facets:readonly CapabilityFacet[];
  bottlenecks:readonly ProductionBottleneckKindV1[];
}
export interface TranslationDiagnosisClusterV1 {clusterId:string;dimension:TranslationDimensionV1;rootIssueHypothesis:string;evidenceIds:readonly string[];sourceSpans:readonly {start:number;end:number}[];learnerSpans:readonly {start:number;end:number}[];confidence:'MEDIUM'|'HIGH';targetRefs:readonly string[];facets:readonly CapabilityFacet[];bottlenecks:readonly ProductionBottleneckKindV1[];mechanismCandidateIds:readonly string[]}
export interface TranslationDiagnosisV1 {status:'NO_MATERIAL_ISSUE'|'CANDIDATES_READY'|'DIAGNOSTIC_NEEDED';clusters:readonly TranslationDiagnosisClusterV1[];candidates:readonly TranslationOpportunityCandidateV1[];unresolvedHypotheses:readonly string[];dReplanRequests:readonly {clusterId:string;reason:'SUPPORTED_OUT_OF_TARGET_TRANSLATION_ISSUE';targetRefs:readonly string[]}[];maxConcurrentTeachingTargets:1;canClaimCapability:false;reasonCodes:readonly string[]}

const mechanisms:Record<TranslationDimensionV1,readonly string[]>={
 SOURCE_MEANING:['meaning-segmentation','alternative-translation-compare'],MEANING_SEGMENTATION:['meaning-segmentation','sentence-anatomy'],LEXICAL_RETRIEVAL:['chunk-as-unit','meaning-representation'],LEXICAL_PRECISION:['reformulation-map','collocation-network'],COLLOCATION:['collocation-network','chunk-as-unit'],GRAMMAR_FORM:['form-contrast','grammar-role-map'],VERB_PATTERN:['grammar-role-map','form-contrast'],ROLE_MAPPING:['grammar-role-map','sentence-anatomy'],L1_L2_CONTRAST:['l1-collision','sentence-anatomy'],RESTRUCTURING:['sentence-anatomy','reformulation-map'],MEANING_FIDELITY:['alternative-translation-compare','meaning-segmentation'],NATURALNESS_PRECISION:['reformulation-map','collocation-network']
};
const uniq=<T>(xs:readonly T[])=>Object.freeze([...new Set(xs)]);
const key=(e:TranslationDiagnosticEvidenceV1)=>`${e.dimension}\u0000${e.rootIssueHypothesis.trim().toLowerCase()}`;
export function translationMechanismCandidatesV1(dimension:TranslationDimensionV1):readonly string[]{return Object.freeze(mechanisms[dimension].filter(id=>!!pckMechanismByIdV1(id)))}

export function diagnoseTranslationV1(input:{sourceText:string;learnerText:string;authorizedTargetRef:string;evidence:readonly TranslationDiagnosticEvidenceV1[];analysisComplete:boolean}):TranslationDiagnosisV1{
 const empty=()=>Object.freeze({status:'DIAGNOSTIC_NEEDED' as const,clusters:Object.freeze([]),candidates:Object.freeze([]),unresolvedHypotheses:Object.freeze(input.evidence.filter(e=>e.status==='POSSIBLE').map(e=>e.evidenceId)),dReplanRequests:Object.freeze([]),maxConcurrentTeachingTargets:1 as const,canClaimCapability:false as const,reasonCodes:Object.freeze(['TRANSLATION_EVIDENCE_INSUFFICIENT','DO_NOT_INFER_FAILURE_FROM_D_TARGET'])});
 if(!input.analysisComplete||!input.sourceText.trim()||!input.learnerText.trim())return empty();
 const possible=input.evidence.filter(e=>e.status==='POSSIBLE'&&e.confidence!=='LOW'),supported=input.evidence.filter(e=>e.status==='SUPPORTED'&&e.confidence!=='LOW');
 if(possible.length||!supported.length)return input.evidence.length?empty():Object.freeze({...empty(),status:'NO_MATERIAL_ISSUE' as const,reasonCodes:Object.freeze(['ANALYSIS_COMPLETE_NO_SUPPORTED_MATERIAL_ISSUE'])});
 const groups=new Map<string,TranslationDiagnosticEvidenceV1[]>();for(const e of supported)groups.set(key(e),[...(groups.get(key(e))??[]),e]);
 const clusters=[...groups.values()].map((items,n):TranslationDiagnosisClusterV1=>{const first=items[0],confidence=items.some(e=>e.confidence==='HIGH')?'HIGH' as const:'MEDIUM' as const;return Object.freeze({clusterId:`translation-cluster:${n+1}`,dimension:first.dimension,rootIssueHypothesis:first.rootIssueHypothesis,evidenceIds:uniq(items.map(e=>e.evidenceId)),sourceSpans:Object.freeze(items.flatMap(e=>e.sourceSpan?[e.sourceSpan]:[])),learnerSpans:Object.freeze(items.flatMap(e=>e.learnerSpan?[e.learnerSpan]:[])),confidence,targetRefs:uniq(items.flatMap(e=>e.targetRefs)),facets:uniq(items.flatMap(e=>e.facets)),bottlenecks:uniq(items.flatMap(e=>e.bottlenecks)),mechanismCandidateIds:translationMechanismCandidatesV1(first.dimension)});});
 const candidates=clusters.map((c):TranslationOpportunityCandidateV1=>Object.freeze({candidateId:c.clusterId,translationDimension:c.dimension,targetRefs:c.targetRefs,facets:c.facets,sourceText:input.sourceText,learnerText:input.learnerText,confidence:c.confidence,reasonCodes:Object.freeze(['SUPPORTED_TRANSLATION_DIAGNOSIS',...c.evidenceIds]),possibleBottlenecks:c.bottlenecks,referenceMatchRequired:false}));
 const replans=clusters.filter(c=>!c.targetRefs.includes(input.authorizedTargetRef)).map(c=>Object.freeze({clusterId:c.clusterId,reason:'SUPPORTED_OUT_OF_TARGET_TRANSLATION_ISSUE' as const,targetRefs:c.targetRefs}));
 return Object.freeze({status:'CANDIDATES_READY',clusters:Object.freeze(clusters),candidates:Object.freeze(candidates),unresolvedHypotheses:Object.freeze([]),dReplanRequests:Object.freeze(replans),maxConcurrentTeachingTargets:1,canClaimCapability:false,reasonCodes:Object.freeze(['EVIDENCE_FIRST_TRANSLATION_DIAGNOSIS','D_RETAINS_TARGET_AUTHORITY','I_CANNOT_WRITE_MASTERY'])});
}
