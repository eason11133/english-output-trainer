import type { EnglishCorpusRetrievalPortV1 } from '../domain/english/corpusRetrieval';
import { corpusScopeAllowedV1, type CorpusExampleV1, type CorpusMorphologyV1, type CorpusProvenanceV1, type CorpusSenseV1, type CorpusSentencePairV1 } from '../persistence/dataCorpusTypes';

export type LearningContentPurposeV1='CONTEXTUAL_LOOKUP'|'SPELLING_RECONSTRUCTION'|'LEXICAL_RETRIEVAL'|'CHUNK_COLLOCATION'|'GRAMMAR_INSTANTIATION'|'MEANING_CONTRAST'|'GUIDED_PRODUCTION'|'FRESH_PRODUCTION'|'TRANSLATION_REALIZATION';
export interface LearningContentRequestV1{
  purpose:LearningContentPurposeV1;arena:'WRITING'|'TRANSLATION'|'EXAM';sourceContext:string;targetSpan?:{text:string;start:number;end:number;origin:'SYSTEM_SOURCE'|'LEARNER_EDITABLE'};lemma?:string;surfaceForm?:string;senseId?:string;needs:readonly ('SENSE'|'MORPHOLOGY'|'EXAMPLE'|'RELATION'|'SENTENCE_PAIR')[];maxItems:number;excludeContentIds:readonly string[];sourcePolicy?:{includeSourceIds?:readonly string[];excludeSourceIds?:readonly string[]};grammarPatternRef?:string;
}
export interface LearningContentBundleV1{
  schemaVersion:1;purpose:LearningContentPurposeV1;focusEnglish:string;meaningZhTw?:string;lemma?:string;senseId?:string;sourceContext:string;clickedToken?:{text:string;start:number;end:number};contextualUnit?:{text:string;kind:'WORD'|'CHUNK'|'PHRASE'};senses?:readonly CorpusSenseV1[];morphology:readonly CorpusMorphologyV1[];examples:readonly CorpusExampleV1[];relations:readonly {type:string;targetId:string}[];sentencePairs:readonly CorpusSentencePairV1[];provenance:readonly CorpusProvenanceV1[];licenseStatus:'ALL_ALLOWED'|'ATTRIBUTION_REQUIRED'|'NO_USABLE_RESULTS';candidateNovelty:'DATA_CANDIDATE_ONLY';
}
export interface LearningContentSnapshotV1{snapshotVersion:1;snapshotId:string;request:LearningContentRequestV1;bundle:LearningContentBundleV1}
export function createLearningContentSnapshotV1(snapshotId:string,request:LearningContentRequestV1,bundle:LearningContentBundleV1):LearningContentSnapshotV1{
  if(!snapshotId.trim())throw new Error('snapshot_id_required');
  return Object.freeze({snapshotVersion:1,snapshotId,request:Object.freeze({...request,needs:Object.freeze([...request.needs]),excludeContentIds:Object.freeze([...request.excludeContentIds])}),bundle});
}
export function replayLearningContentSnapshotV1(snapshot:LearningContentSnapshotV1){if(snapshot.snapshotVersion!==1)throw new Error('unsupported_learning_content_snapshot');return snapshot.bundle}

const bounded=(value:number)=>Math.max(1,Math.min(20,Math.trunc(value||1)));
const idOf=(value:CorpusExampleV1|CorpusMorphologyV1|CorpusSentencePairV1)=>'exampleId'in value?value.exampleId:'form'in value?`${value.provenance.sourceId}:${value.provenance.sourceRecordId}`:value.pairProvenance.sourceRecordId;
const allowed=(value:{provenance:CorpusProvenanceV1})=>corpusScopeAllowedV1(value.provenance.usageScope,'LEARNER_PRODUCTION');
const pairAllowed=(value:CorpusSentencePairV1)=>corpusScopeAllowedV1(value.pairProvenance.usageScope,'LEARNER_PRODUCTION')&&corpusScopeAllowedV1(value.english.provenance.usageScope,'LEARNER_PRODUCTION')&&corpusScopeAllowedV1(value.chinese.provenance.usageScope,'LEARNER_PRODUCTION');
export function createLearningContentGatewayV1(corpus:EnglishCorpusRetrievalPortV1){return{async resolve(request:LearningContentRequestV1):Promise<LearningContentBundleV1>{
  if(request.targetSpan?.origin==='LEARNER_EDITABLE'&&request.purpose==='CONTEXTUAL_LOOKUP')throw new Error('learner_editable_text_not_lookup_bindable');
  const limit=bounded(request.maxItems),target=(request.lemma??request.surfaceForm??request.targetSpan?.text??'').trim(),exclude=new Set(request.excludeContentIds);
  const senseResult=request.needs.some(x=>x==='SENSE'||x==='RELATION')?await corpus.query<CorpusSenseV1>({requestedResourceType:'LEMMA_SENSES',lemma:target,senseId:request.senseId,context:request.sourceContext,usagePolicy:'LEARNER_PRODUCTION',sourcePolicy:request.sourcePolicy,limit}):undefined;
  const morphologyResult=request.needs.includes('MORPHOLOGY')?await corpus.query<CorpusMorphologyV1>({requestedResourceType:'MORPHOLOGY',surfaceForm:request.surfaceForm??target,context:request.sourceContext,usagePolicy:'LEARNER_PRODUCTION',sourcePolicy:request.sourcePolicy,limit}):undefined;
  const exampleResult=request.needs.includes('EXAMPLE')?await corpus.query<CorpusExampleV1>({requestedResourceType:'EXAMPLES',lemma:target,senseId:request.senseId,context:request.sourceContext,usagePolicy:'LEARNER_PRODUCTION',sourcePolicy:request.sourcePolicy,limit}):undefined;
  const pairResult=request.needs.includes('SENTENCE_PAIR')?await corpus.query<CorpusSentencePairV1>({requestedResourceType:'SENTENCE_PAIRS',targetRefs:[target],context:request.sourceContext,usagePolicy:'LEARNER_PRODUCTION',sourcePolicy:request.sourcePolicy,limit}):undefined;
  const senses=(senseResult?.records??[]).filter(x=>allowed(x)&&!exclude.has(x.senseId)),morphology=(morphologyResult?.records??[]).filter(x=>allowed(x)&&!exclude.has(idOf(x))),examples=(exampleResult?.records??[]).filter(x=>allowed(x)&&x.learnerDisplayEligible&&!exclude.has(idOf(x))),sentencePairs=(pairResult?.records??[]).filter(x=>pairAllowed(x)&&!exclude.has(idOf(x))),provenance=[...senses.map(x=>x.provenance),...morphology.map(x=>x.provenance),...examples.map(x=>x.provenance),...sentencePairs.flatMap(x=>[x.pairProvenance,x.english.provenance,x.chinese.provenance])];
  const licenseStatus=provenance.length?(provenance.some(x=>x.attributionRequired)?'ATTRIBUTION_REQUIRED':'ALL_ALLOWED'):'NO_USABLE_RESULTS';
  return Object.freeze({schemaVersion:1,purpose:request.purpose,focusEnglish:request.targetSpan?.text??target,lemma:request.lemma??(senses[0]?target:undefined),senseId:request.senseId??senses[0]?.senseId,sourceContext:request.sourceContext,clickedToken:request.targetSpan?{text:request.targetSpan.text,start:request.targetSpan.start,end:request.targetSpan.end}:undefined,contextualUnit:request.targetSpan?{text:request.targetSpan.text,kind:'WORD' as const}:undefined,senses:Object.freeze(senses.slice(0,limit)),morphology:Object.freeze(morphology.slice(0,limit)),examples:Object.freeze(examples.slice(0,limit)),relations:Object.freeze(senses.flatMap(x=>x.relations).slice(0,limit)),sentencePairs:Object.freeze(sentencePairs.slice(0,limit)),provenance:Object.freeze(provenance),licenseStatus,candidateNovelty:'DATA_CANDIDATE_ONLY' as const});
}}}
