import type { LessonPlanV1 } from '../../architecture/contracts';
import type { Stage4RuntimeV4 } from '../../domain/stage4/LearnerRuntimeV4';
import type { CapabilityFacet } from '../../domain/english/EnglishDomain';
import { createOriginalWritingRevisionV1, createWritingRevisionV1, diffWritingRevisionOperationV1, revisionActorFromProductionConditionsV1 } from './revision';
import { createWritingSourceContextV1 } from './sourceContext';
import { applyWritingFeedbackBudgetV1 } from './feedbackBudget';
import type { WritingArtifactContextV1, WritingDeliveredTaskV1, WritingOpportunityCandidateV1, WritingRevisionOperationV1, WritingRevisionVersionV1, WritingSourceContextV1 } from './types';
import type { ProductionConditionsV1 } from '../../domain/task/TaskContract';
import type { ActivePracticeTrajectoryV1 } from '../../content';

export interface WritingWorkStateV1 {
  schemaVersion:1;
  sourceContext:WritingSourceContextV1;
  artifact:WritingArtifactContextV1;
  focusCandidates:readonly WritingOpportunityCandidateV1[];
  hiddenCandidateCount:number;
  freshTask?:WritingDeliveredTaskV1;
  freshTaskHistory?:readonly WritingDeliveredTaskV1[];
  activePracticeTrajectory?:ActivePracticeTrajectoryV1;
  phase:'SOURCE_GROUNDING'|'ORIGINAL_WRITING'|'LOCAL_REPAIR'|'RETURN_TO_ORIGINAL'|'FRESH_WRITING'|'COMPLETE_FOR_NOW';
  createdAt:string;
  updatedAt:string;
}
export type Stage4WritingRuntimeV1=Stage4RuntimeV4 & {writingWork?:WritingWorkStateV1};

const uniq=(values:readonly string[])=>Object.freeze([...new Set(values.filter(Boolean))]);
const span=(text:string)=>({start:0,end:text.length});

export function writingSourceFromInputV1(input:{promptArtifactId:string;promptText:string;productMode:'GENERAL'|'EXAM';rubricText?:string;sourceType?:WritingSourceContextV1['sourceType'];learnerConfirmed?:boolean;interpretationConfidence?:WritingSourceContextV1['interpretationConfidence']}):WritingSourceContextV1{
  const prompt=input.promptText.trim();
  return createWritingSourceContextV1({
    promptArtifactId:input.promptArtifactId,
    promptText:prompt,
    sourceType:input.sourceType??(input.productMode==='EXAM'?'EXAM':'UNSPECIFIED_AUTHENTIC'),
    purpose:'UNRESOLVED',audience:'UNRESOLVED',genre:'UNRESOLVED',
    taskRequirements:prompt&&prompt!=='（未提供明確題目）'?[prompt]:[],rubricRefs:input.rubricText?.trim()?[input.rubricText.trim()]:[],formatConstraints:[],
    interpretationConfidence:input.interpretationConfidence??'LOW',learnerConfirmed:input.learnerConfirmed??false,
  });
}

export function writingCandidatesForAuthorizedPlanV1(input:{lessonPlan:LessonPlanV1;text:string;source:WritingSourceContextV1}):readonly WritingOpportunityCandidateV1[]{
  const text=input.text.trim();
  const target=input.lessonPlan.targetRef;
  const facet=input.lessonPlan.facet as CapabilityFacet;
  const items:WritingOpportunityCandidateV1[]=[];
  const add=(candidate:Omit<WritingOpportunityCandidateV1,'candidateId'|'targetRefs'|'facets'|'evidenceRefs'|'rubricRelevance'|'possibleBottlenecks'> & {reasonCodes:readonly string[];possibleBottlenecks?:readonly string[]})=>items.push({
    ...candidate,candidateId:`writing:${candidate.writingDimension.toLowerCase()}:${items.length+1}`,targetRefs:[target],facets:[facet],evidenceRefs:[],rubricRelevance:input.source.rubricRefs,possibleBottlenecks:candidate.possibleBottlenecks??[],
  });
  if(!input.source.promptText.trim())add({writingDimension:'TASK_FULFILLMENT',impact:'TASK_BLOCKING',scope:'GLOBAL',confidence:'HIGH',reasonCodes:['WRITING_PROMPT_MISSING'],learnerIntentRequired:true});
  if(!text)add({writingDimension:'IDEA_AVAILABILITY',impact:'TASK_BLOCKING',scope:'GLOBAL',confidence:'HIGH',reasonCodes:['WRITING_EMPTY_OUTPUT'],learnerIntentRequired:true});
  if(text&&target==='writing.purpose-audience')add({writingDimension:'PURPOSE_AUDIENCE_GENRE',impact:'HIGH',scope:'GLOBAL',confidence:'MEDIUM',reasonCodes:['D_AUTHORIZED_WRITING_PURPOSE_TARGET'],learnerIntentRequired:true,sourceSpan:span(text)});
  else if(text&&target==='writing.idea-reasoning')add({writingDimension:'REASONING_DEPTH',impact:'HIGH',scope:'PARAGRAPH',confidence:'MEDIUM',reasonCodes:['D_AUTHORIZED_WRITING_IDEA_REASONING_TARGET'],learnerIntentRequired:true,sourceSpan:span(text)});
  else if(text&&target==='writing.organization-cohesion')add({writingDimension:'ORGANIZATION',impact:'HIGH',scope:'GLOBAL',confidence:'MEDIUM',reasonCodes:['D_AUTHORIZED_WRITING_ORGANIZATION_TARGET'],learnerIntentRequired:false,sourceSpan:span(text)});
  else if(text&&target==='writing.revision')add({writingDimension:'MONITORING_SELF_REPAIR',impact:'MEDIUM',scope:'SENTENCE',confidence:'MEDIUM',reasonCodes:['D_AUTHORIZED_WRITING_REVISION_TARGET'],learnerIntentRequired:false,sourceSpan:span(text),possibleBottlenecks:['MONITORING_SELF_REPAIR']});
  else if(text)add({writingDimension:target==='writing.sentence-realization'?'SENTENCE_REALIZATION':'MEANING_ENCODING',impact:'HIGH',scope:'SENTENCE',confidence:'MEDIUM',reasonCodes:['D_AUTHORIZED_WRITING_LANGUAGE_TARGET'],learnerIntentRequired:true,sourceSpan:span(text),possibleBottlenecks:['MEANING_FORM_MAPPING','FORM_ASSEMBLY','RETRIEVAL']});
  return applyWritingFeedbackBudgetV1(items,{maxCandidates:3}).candidates;
}

export function startWritingWorkV1(input:{runtime:Stage4RuntimeV4;lessonPlan:LessonPlanV1;sourceContext:WritingSourceContextV1;createdAt?:string}):Stage4WritingRuntimeV1{
  if(input.runtime.artifact.mode!=='WRITING')throw new Error('writing work requires WRITING artifact');
  const now=input.createdAt??input.runtime.artifact.submittedAt;
  const original=createOriginalWritingRevisionV1({revisionId:`writing-original:${input.runtime.artifact.id}`,originalArtifactId:input.runtime.artifact.id,text:input.runtime.usableSourceText,createdAt:now});
  const artifact:WritingArtifactContextV1={originalArtifactId:input.runtime.artifact.id,originalRevisionId:original.revisionId,workingRevisionId:original.revisionId,revisions:[original],learnerIntentNotes:[]};
  const budget=applyWritingFeedbackBudgetV1(writingCandidatesForAuthorizedPlanV1({lessonPlan:input.lessonPlan,text:original.text,source:input.sourceContext}),{maxCandidates:3});
  return {...input.runtime,writingWork:{schemaVersion:1,sourceContext:input.sourceContext,artifact,focusCandidates:budget.candidates,hiddenCandidateCount:budget.hiddenCount,freshTaskHistory:Object.freeze([]),phase:'ORIGINAL_WRITING',createdAt:now,updatedAt:now}};
}

export function hydrateWritingWorkV1(runtime:Stage4RuntimeV4):WritingWorkStateV1|undefined{return (runtime as Stage4WritingRuntimeV1).writingWork}
export function currentWritingRevisionV1(work:WritingWorkStateV1):WritingRevisionVersionV1{
  const revision=work.artifact.revisions.find(item=>item.revisionId===work.artifact.workingRevisionId);
  if(!revision)throw new Error('writing working revision missing');return revision;
}

export function recordLearnerWritingRevisionV1(input:{runtime:Stage4RuntimeV4;text:string;occurredAt:string;productionConditions:ProductionConditionsV1;visibleBeforeResponse?:readonly string[];reasonRef?:string}):Stage4WritingRuntimeV1{
  const runtime=input.runtime as Stage4WritingRuntimeV1,work=runtime.writingWork;if(!work)throw new Error('writing work missing');
  const prior=currentWritingRevisionV1(work);if(prior.text===input.text)return runtime;
  const revisionId=`writing-revision:${runtime.id}:${work.artifact.revisions.length}`;
  const diff=diffWritingRevisionOperationV1(prior.text,input.text),actor=revisionActorFromProductionConditionsV1(input.productionConditions);
  const operation:WritingRevisionOperationV1={operationId:`writing-op:${runtime.id}:${work.artifact.revisions.length}`,revisionId,actor,operation:diff.operation,sourceSpan:diff.sourceSpan,before:diff.before,after:diff.after,occurredAt:input.occurredAt,productionConditions:input.productionConditions,visibleBeforeResponse:Object.freeze([...(input.visibleBeforeResponse??[])]),reasonRef:input.reasonRef};
  const next=createWritingRevisionV1({revisionId,originalArtifactId:work.artifact.originalArtifactId,parent:prior,text:input.text,operations:[operation],createdAt:input.occurredAt});
  return {...runtime,writingWork:{...work,artifact:{...work.artifact,workingRevisionId:next.revisionId,revisions:Object.freeze([...work.artifact.revisions,next])},phase:work.phase==='FRESH_WRITING'?'FRESH_WRITING':'LOCAL_REPAIR',updatedAt:input.occurredAt}};
}

export function markWritingReturnToOriginalV1(runtime:Stage4RuntimeV4,occurredAt:string):Stage4WritingRuntimeV1{
  const typed=runtime as Stage4WritingRuntimeV1,work=typed.writingWork;if(!work)throw new Error('writing work missing');
  return {...typed,writingWork:{...work,phase:'RETURN_TO_ORIGINAL',updatedAt:occurredAt}};
}
export function markWritingFreshV1(runtime:Stage4RuntimeV4,occurredAt:string):Stage4WritingRuntimeV1{
  const typed=runtime as Stage4WritingRuntimeV1,work=typed.writingWork;if(!work)throw new Error('writing work missing');
  if(!work.freshTask?.validated)throw new Error('validated fresh task required before fresh-writing phase');
  return {...typed,writingWork:{...work,phase:'FRESH_WRITING',updatedAt:occurredAt}};
}
export function writingProviderContextV1(runtime:Stage4RuntimeV4,lessonPlan:LessonPlanV1){
  const work=hydrateWritingWorkV1(runtime);if(!work)return undefined;
  const revision=currentWritingRevisionV1(work),focus=work.focusCandidates.find(candidate=>candidate.targetRefs.includes(lessonPlan.targetRef)&&candidate.facets.includes(lessonPlan.facet as CapabilityFacet));
  const active=work.activePracticeTrajectory,activeDelivery=active&&active.status!=='COMPLETE'&&active.status!=='REPLAN_REQUIRED'?active.steps[active.currentStep]:undefined;
  return Object.freeze({sourceContext:work.sourceContext,activeFreshTask:work.phase==='FRESH_WRITING'&&work.freshTask?Object.freeze({taskId:work.freshTask.taskId,promptText:work.freshTask.promptText,purpose:work.freshTask.purpose,contextNovelty:work.freshTask.contextNovelty,semanticRequirements:work.freshTask.semanticRequirements,validatorRefs:work.freshTask.validatorRefs}):undefined,activePracticeDelivery:activeDelivery?Object.freeze({deliveryId:activeDelivery.deliveryId,content:activeDelivery.content,load:activeDelivery.load,loadDelta:activeDelivery.loadDelta,measurementIntent:activeDelivery.measurementIntent,validatorRefs:activeDelivery.validatorRefs}):undefined,originalArtifactId:work.artifact.originalArtifactId,originalRevisionId:work.artifact.originalRevisionId,workingRevisionId:work.artifact.workingRevisionId,currentLearnerWriting:revision.text,focusCandidate:focus,feedbackBudget:{visibleCandidates:work.focusCandidates.length,hiddenCandidates:work.hiddenCandidateCount,maxConcurrentTeachingTargets:1},phase:work.phase,authority:{targetOwner:'D',teacherActionOwner:'E',mechanismOwner:'F',writingSemanticsOwner:'H',evidenceOwner:'C/K'}});
}

export function refreshWritingWorkSourceFromSpansV1(runtime:Stage4RuntimeV4):Stage4WritingRuntimeV1{
  const typed=runtime as Stage4WritingRuntimeV1,work=typed.writingWork;if(!work)return typed;
  const promptSpans=runtime.spans.filter(span=>span.region==='PRINTED_PROMPT');if(!promptSpans.length)return typed;
  const promptText=promptSpans.map(span=>span.text).join('\n').trim();if(!promptText)return typed;
  const confirmed=new Set(runtime.confirmations.map(item=>item.spanId));
  const sourceContext=createWritingSourceContextV1({...work.sourceContext,promptText,taskRequirements:[promptText],interpretationConfidence:promptSpans.some(span=>span.confidence==='LOW')?'LOW':promptSpans.some(span=>span.confidence==='MEDIUM')?'MEDIUM':'HIGH',learnerConfirmed:work.sourceContext.learnerConfirmed||promptSpans.some(span=>confirmed.has(span.id))});
  return {...typed,writingWork:{...work,sourceContext,updatedAt:runtime.trace.at(-1)?.occurredAt??work.updatedAt}};
}
