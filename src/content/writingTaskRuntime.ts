import type { LessonPlanV1 } from '../architecture/contracts';
import type { WritingTaskGenerationNeedV1, WritingTaskSourceViewV1 } from './types';
import { writingFreshTaskPackV1, type CuratedWritingTaskTemplateV1 } from './contentPacks';
import type { GeneratedWritingTaskCandidateV1, ValidatedWritingTaskV1 } from './types';
import { validateGeneratedWritingTaskV1 } from './validation';
import { queryContentCoverageV1 } from './coverage';

const normalizedWords=(text:string)=>new Set((text.toLowerCase().match(/[a-z]+/g)??[]).filter(word=>word.length>2));
const overlap=(a:string,b:string)=>{const x=normalizedWords(a),y=normalizedWords(b);if(!x.size||!y.size)return 0;let shared=0;for(const token of x)if(y.has(token))shared++;return shared/Math.min(x.size,y.size)};

export function rankedCuratedWritingTaskTemplatesV1(input:{lessonPlan:LessonPlanV1;source:WritingTaskSourceViewV1;need:WritingTaskGenerationNeedV1}){
  const coverage=queryContentCoverageV1({targetRef:input.lessonPlan.targetRef,facet:input.lessonPlan.facet as never,arena:'WRITING',useCase:input.need.purpose});
  if(coverage.status!=='VALIDATED_DELIVERY_AVAILABLE')return Object.freeze([]);
  const refs=new Set(coverage.entries.map(entry=>entry.contentRef));
  const eligible=writingFreshTaskPackV1.filter(item=>refs.has(`${item.provenanceRef}#${item.id}`)&&item.responseScope===input.need.responseScope);
  return Object.freeze([...eligible].sort((a,b)=>overlap(a.promptText,input.source.promptText)-overlap(b.promptText,input.source.promptText)||a.id.localeCompare(b.id)));
}
export function selectCuratedWritingTaskTemplateV1(input:{lessonPlan:LessonPlanV1;source:WritingTaskSourceViewV1;need:WritingTaskGenerationNeedV1}){return rankedCuratedWritingTaskTemplatesV1(input)[0]}

function proposalFromTemplate(input:{runtimeId:string;lessonPlan:LessonPlanV1;source:WritingTaskSourceViewV1;need:WritingTaskGenerationNeedV1;occurredAt:string},template:CuratedWritingTaskTemplateV1,purpose:'FRESH_CHECK'|'CHANGED_CONTEXT_TRANSFER'):GeneratedWritingTaskCandidateV1{
  return Object.freeze({
    taskId:`g:${input.runtimeId}:${purpose}:${template.id}:${input.occurredAt}`,
    promptText:template.promptText,targetRef:input.lessonPlan.targetRef,facet:input.lessonPlan.facet as never,purpose,
    desiredContextDistance:input.need.desiredContextDistance,contextNovelty:purpose==='CHANGED_CONTEXT_TRANSFER'?'CHANGED_CONTEXT':'SAME_CONTEXT',contextKey:template.contextKey,responseScope:input.need.responseScope,validAlternatives:'ACCEPT',
    semanticRequirements:Object.freeze([...new Set([...template.semanticRequirements,...input.need.semanticRequirements])]),forbiddenReuse:Object.freeze([...input.need.forbiddenReuse]),
    targetNameVisible:input.need.targetNameVisible,functionCueVisible:input.need.functionCueVisible,planningSupportAllowed:input.need.planningSupportAllowed,recentModelPrimeAllowed:input.need.recentModelPrimeAllowed,
    load:Object.freeze({...template.load}),provenance:'CURATED_PACK',contentRef:`${template.provenanceRef}#${template.id}`,validationStatus:'PENDING',validatorRefs:Object.freeze([template.provenanceRef,'G:deterministic-contract-validator-v1']),
  });
}

export function generateValidatedWritingTaskV1(input:{runtimeId:string;lessonPlan:LessonPlanV1;source:WritingTaskSourceViewV1;need:WritingTaskGenerationNeedV1;occurredAt:string}):ValidatedWritingTaskV1|undefined{
  if(input.need.purpose==='ACTIVE_PRACTICE')return undefined;
  const purpose=input.need.purpose;
  for(const template of rankedCuratedWritingTaskTemplatesV1(input)){
    const proposal=proposalFromTemplate(input,template,purpose);
    const firstPass=validateGeneratedWritingTaskV1({candidate:proposal,need:input.need,source:input.source});
    if(!firstPass.deliveryAllowed)continue;
    const candidate:GeneratedWritingTaskCandidateV1=Object.freeze({...proposal,validationStatus:'VALIDATED'});
    const validation=Object.freeze({...firstPass,candidate});
    const delivery=Object.freeze({taskId:candidate.taskId,promptText:candidate.promptText,targetRef:candidate.targetRef,facet:candidate.facet,purpose,desiredContextDistance:candidate.desiredContextDistance,contextNovelty:candidate.contextNovelty,contextKey:candidate.contextKey,generationRef:candidate.contentRef,semanticRequirements:candidate.semanticRequirements,deliveredAt:input.occurredAt,validated:true as const,validatorRefs:candidate.validatorRefs,load:candidate.load});
    return Object.freeze({candidate,delivery,validation});
  }
  return undefined;
}
