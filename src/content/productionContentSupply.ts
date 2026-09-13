import type { CapabilityFacet } from '../domain/english/EnglishDomain';
import type { EnglishCorpusRetrievalPortV1 } from '../domain/english/corpusRetrieval';
import type { LessonPlanV1 } from '../curriculum';
import { examBetaTasks, type ExamBetaFamily, type ExamBetaTask, type ExamTaskHistoryV1 } from './examBetaBank';
import { examContentHashV1 } from './examValidationReceipts';
import { resolveTeachingContentV1, type TeachingContentResolutionV1 } from './teachingContent';

export type ProductionContentRoleV1='TEACH'|'GUIDED_PRACTICE'|'FADE'|'INDEPENDENT_ASSESS'|'TRANSFER'|'REVIEW_REACTIVATION'|'DISCRIMINATING_PROBE';
export type ContentFrontierV1='FOUNDATION'|'GSAT_STANDARD'|'HIGH_SCORE';
export type DifficultyAxisV1='lexicalLoad'|'syntaxComplexity'|'paraphraseDistance'|'inferenceDepth'|'distractorPlausibility'|'productionBurden'|'formPrecision';
export type DifficultyProfileV1=Readonly<Partial<Record<DifficultyAxisV1,number>>>;
export interface ProductionContentRequestV1{
  family:ExamBetaFamily;learnerId:string;role:ProductionContentRoleV1;targetRef?:string;facet?:CapabilityFacet;
  variant?:string;rotationKey?:string;frontier?:ContentFrontierV1;difficulty?:DifficultyProfileV1;supportState?:'NONE'|'LIGHT'|'MODERATE'|'EXPLICIT'|'MODEL';
  recent?:readonly ExamTaskHistoryV1[];transferRequired?:boolean;diagnosticPurpose?:string;competingHypotheses?:readonly string[];
}
export interface ProductionExamContentV1{
  task:ExamBetaTask;editorialState:'PROMOTED_PRODUCTION_ELIGIBLE';evidenceUse:'INSTRUCTIONAL_ONLY'|'INDEPENDENT_ELIGIBLE';
  role:ProductionContentRoleV1;difficulty:DifficultyProfileV1;difficultySource:'BOUNDED_TASK_INFERENCE'|'PROMOTED_TASK_METADATA';diagnosticCapabilities:readonly string[];cannotProve:readonly string[];
  receipt:{taskId:string;contentHash:string;contentLineage?:string;freshnessGroup?:string;canonicalTargetRefs:readonly string[];canonicalFacets:readonly string[]};
}
export type ProductionContentResolutionV1={status:'READY';content:ProductionExamContentV1;reasonCodes:readonly string[]}|{status:'UNAVAILABLE';reasonCodes:readonly string[]};

const independentRoles=new Set<ProductionContentRoleV1>(['INDEPENDENT_ASSESS','TRANSFER','REVIEW_REACTIVATION','DISCRIMINATING_PROBE']);
const frontierMid:Record<ContentFrontierV1,number>={FOUNDATION:1,GSAT_STANDARD:2.5,HIGH_SCORE:3.5};
function words(value:unknown){return typeof value==='string'?value.trim().split(/\s+/).filter(Boolean).length:0}
function inferredDifficulty(task:ExamBetaTask):DifficultyProfileV1{
  if(task.productionDifficulty)return Object.freeze({...task.productionDifficulty}) as DifficultyProfileV1;
  const p=task.payload,text=[p.passage,p.source,Array.isArray(p.chineseSentences)?p.chineseSentences.join(' '):''].map(String).join(' '),length=words(text);
  const output=task.family==='WRITING'?4:task.family==='TRANSLATION'?3:task.family==='MIXED'?2:1;
  return Object.freeze({lexicalLoad:length>350?4:length>180?3:length>70?2:1,syntaxComplexity:['DISCOURSE','READING','WRITING','TRANSLATION'].includes(task.family)?3:2,paraphraseDistance:['READING','MIXED','TRANSLATION'].includes(task.family)?3:1,inferenceDepth:task.family==='READING'?3:task.family==='DISCOURSE'?2:1,distractorPlausibility:['VOCABULARY','COMPREHENSIVE','READING'].includes(task.family)?2:1,productionBurden:output,formPrecision:['VOCABULARY','CONTEXTUAL_FILL','MIXED','TRANSLATION'].includes(task.family)?3:1});
}
function diagnosticCapabilities(task:ExamBetaTask){
  const common=task.canonicalBinding?.units.flatMap(unit=>[unit.canonicalTargetRef,String(unit.canonicalFacet)])??[];
  const family:Record<ExamBetaFamily,string[]>={VOCABULARY:['LEXICAL_KNOWLEDGE_VS_SENTENCE_INTEGRATION','RECOGNITION_VS_RETRIEVAL','MORPHOLOGY_VS_SEMANTIC_SELECTION'],COMPREHENSIVE:['LEXICAL_KNOWLEDGE_VS_SENTENCE_INTEGRATION','LOCAL_MEANING_VS_GRAMMAR_SLOT'],CONTEXTUAL_FILL:['LOCAL_MEANING_VS_GRAMMAR_SLOT','MORPHOLOGY_VS_SEMANTIC_SELECTION','POOL_CHAIN_ERROR'],DISCOURSE:['REFERENCE_VS_LOGICAL_FIT','BEFORE_VS_AFTER_FIT'],READING:['EVIDENCE_LOCATION_VS_INTERPRETATION','TEXT_COMPREHENSION_VS_DISTRACTOR_REASONING'],MIXED:['RECOGNITION_VS_RETRIEVAL','COPYABLE_VS_MORPHOLOGY','CROSS_SOURCE_INTEGRATION'],TRANSLATION:['MEANING_COVERAGE_VS_ENGLISH_REALIZATION','RETRIEVAL_VS_FORM_PRECISION'],WRITING:['IDEA_VS_REALIZATION','DIAGNOSIS_VS_REVISION']};
  return Object.freeze([...new Set([...family[task.family],...common,...task.diagnosticCapabilities??[]])]);
}
function difficultyDistance(profile:DifficultyProfileV1,request:ProductionContentRequestV1){const requested=request.difficulty??(request.frontier?Object.fromEntries(Object.keys(profile).map(key=>[key,frontierMid[request.frontier!]])) as DifficultyProfileV1:{});return Object.entries(requested).reduce((sum,[key,value])=>sum+Math.abs((profile[key as DifficultyAxisV1]??2)-Number(value)),0)}
function matchesTarget(task:ExamBetaTask,request:ProductionContentRequestV1){const units=task.canonicalBinding?.units??[];return(!request.targetRef||units.some(x=>x.canonicalTargetRef===request.targetRef))&&(!request.facet||units.some(x=>x.canonicalFacet===request.facet))}
function matchesDiagnosis(task:ExamBetaTask,request:ProductionContentRequestV1){if(request.role!=='DISCRIMINATING_PROBE')return true;const wanted=[request.diagnosticPurpose,...request.competingHypotheses??[]].filter(Boolean).map(x=>String(x).toUpperCase()),can=diagnosticCapabilities(task).map(x=>x.toUpperCase()),tokens=(x:string)=>new Set(x.split('_').filter(t=>t.length>3));return wanted.length===0||wanted.some(x=>can.some(c=>c.includes(x)||x.includes(c)||[...tokens(x)].filter(t=>tokens(c).has(t)).length>=2))}
function matchesVariant(task:ExamBetaTask,variant:string|undefined){const value=variant??'',mode=String(task.payload.mode??'');if(task.family==='TRANSLATION')return value.includes('2')?mode==='FULL':value.includes('1')?mode==='TARGETED':true;if(task.family==='WRITING')return value.includes('完整')?mode==='FULL':value.includes('一段')?mode==='PARAGRAPH':value.includes('短')?mode==='MICRO':true;return true}

export function resolveProductionExamContentV1(request:ProductionContentRequestV1):ProductionContentResolutionV1{
  const recent=request.recent??[],strict=independentRoles.has(request.role)||request.transferRequired===true;
  const candidates=examBetaTasks(request.family).filter(task=>matchesVariant(task,request.variant)&&matchesTarget(task,request)&&matchesDiagnosis(task,request)).map(task=>({task,difficulty:inferredDifficulty(task)})).filter(({task})=>{
    if(request.role==='TEACH'||request.role==='GUIDED_PRACTICE')return true;
    const exact=recent.some(x=>x.taskId===task.task_id||(x.contentHash&&x.contentHash===examContentHashV1(task))),lineage=recent.some(x=>x.contentLineage&&x.contentLineage===task.content_lineage_id),group=recent.some(x=>x.freshnessGroupId&&x.freshnessGroupId===task.freshness_group_id);
    return strict?!exact&&!lineage&&!group:!exact;
  }).sort((a,b)=>difficultyDistance(a.difficulty,request)-difficultyDistance(b.difficulty,request)||a.task.task_id.localeCompare(b.task.task_id));
  if(candidates.length){
    const bestDistance=difficultyDistance(candidates[0].difficulty,request),best=candidates.filter(x=>difficultyDistance(x.difficulty,request)===bestDistance),key=`${request.learnerId}:${request.variant??''}:${request.rotationKey??''}`,hash=[...key].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7),row=best[hash%best.length];
    const caps=diagnosticCapabilities(row.task),targets=Object.freeze([...(row.task.canonicalBinding?.units.map(x=>x.canonicalTargetRef)??[])]),facets=Object.freeze([...(row.task.canonicalBinding?.units.map(x=>String(x.canonicalFacet))??[])]);
    return Object.freeze({status:'READY',content:Object.freeze({task:row.task,editorialState:'PROMOTED_PRODUCTION_ELIGIBLE',evidenceUse:independentRoles.has(request.role)||request.role==='FADE'?'INDEPENDENT_ELIGIBLE':'INSTRUCTIONAL_ONLY',role:request.role,difficulty:row.difficulty,difficultySource:row.task.productionDifficulty?'PROMOTED_TASK_METADATA':'BOUNDED_TASK_INFERENCE',diagnosticCapabilities:caps,cannotProve:Object.freeze(['CAPABILITY_MASTERY_FROM_ONE_ITEM','CAUSES_OUTSIDE_DECLARED_DIAGNOSTIC_CAPABILITIES',...row.task.diagnosticCannotProve??[]]),receipt:Object.freeze({taskId:row.task.task_id,contentHash:examContentHashV1(row.task),contentLineage:row.task.content_lineage_id,freshnessGroup:row.task.freshness_group_id,canonicalTargetRefs:targets,canonicalFacets:facets})}),reasonCodes:Object.freeze(['CANONICAL_PROMOTION_VERIFIED','BOUNDED_INDEXED_FAMILY_RETRIEVAL','FRESHNESS_EXCLUSIONS_APPLIED'])});
  }
  return Object.freeze({status:'UNAVAILABLE',reasonCodes:Object.freeze([candidates.length?'NO_FRESH_ELIGIBLE_CONTENT':'NO_PROMOTED_CONTENT_MATCHES_TARGET_FACET_DIAGNOSTIC_PURPOSE'])});
}

const allExamFamilies:readonly ExamBetaFamily[]=Object.freeze(['VOCABULARY','COMPREHENSIVE','CONTEXTUAL_FILL','DISCOURSE','READING','MIXED','TRANSLATION','WRITING']);
export function resolveProductionExamContentForTargetV1(request:Omit<ProductionContentRequestV1,'family'>):ProductionContentResolutionV1{
  for(const family of allExamFamilies){const result=resolveProductionExamContentV1({...request,family});if(result.status==='READY')return result}
  return Object.freeze({status:'UNAVAILABLE',reasonCodes:Object.freeze(['NO_PROMOTED_CONTENT_MATCHES_SCHEDULER_TARGET'])});
}

export async function resolveProductionTeacherContentV1(input:{lessonPlan:LessonPlanV1;mechanismId:string;role:Extract<ProductionContentRoleV1,'TEACH'|'GUIDED_PRACTICE'>;corpus?:EnglishCorpusRetrievalPortV1;maxItems?:number}):Promise<TeachingContentResolutionV1>{
  return resolveTeachingContentV1({lessonPlan:input.lessonPlan,mechanismId:input.mechanismId,corpus:input.corpus,maxItems:input.maxItems});
}
