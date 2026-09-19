import { projectLearnerModelV3 } from '../application/learner/projectLearnerModelV3';
import type { LessonPlanV1, ProductContextV1 } from '../architecture/contracts';
import { canonicalCurriculumV1 } from '../curriculum';
import { coreEnglishDomainPortV2 } from '../domain/english';
import { canonicalLexicalEncounterStoreV1, loadActiveExamOperationalCheckpointV1, loadExamOperationalCheckpointV1, operationalHistoryReadPortV1, operationalRetentionNeedStoreV1 } from '../persistence';
import { lexicalTodayPrioritySignalV1, projectOperationSpecificLexicalMemoryV1, type LexicalOperationTrackV1 } from '../learner-truth/lexicalEncounter';
import { advanceRetentionDueV1, deferRetentionNeedV1, todayRetentionProjectionV1 } from '../longitudinal';
import { projectMyEnglishAbilityV1 } from './myEnglishAbility';

export async function loadMyEnglishAbilityV1(learnerId:string){const events=await operationalHistoryReadPortV1.canonicalEvidence(learnerId),truth=projectLearnerModelV3(learnerId,events),areas=projectMyEnglishAbilityV1(truth.capabilitySlice);return{state:truth.capabilitySlice.length?'READY' as const:'EMPTY' as const,areas,recommendations:areas.filter(x=>x.status==='MOST_WORTH_PRACTICING').slice(0,3)}}

export interface MyEnglishVMV1 {
  state:'EMPTY'|'READY';
  recentLearnerEnglish:readonly string[];
  practiceAgain:readonly string[];
  recentMemory:readonly string[];
  progressNarrative:string;
}
export async function loadMyEnglishVMV1(learnerId:string):Promise<MyEnglishVMV1>{
  const [events,encounters]=await Promise.all([operationalHistoryReadPortV1.canonicalEvidence(learnerId),canonicalLexicalEncounterStoreV1.listForLearner(learnerId)]);
  const projection=projectLearnerModelV3(learnerId,events);
  const items=projection.capabilitySlice;
  const recentLearnerEnglish=[...events]
    .filter(event=>event.evidencePolarity==='POSITIVE'&&event.semanticProvenance==='LEARNER_ORIGINATED'&&event.observation.trim().length>0)
    .sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt))
    .map(event=>event.observation.trim())
    .filter((value,index,all)=>all.indexOf(value)===index)
    .slice(0,3);
  const practiceAgain=[...events]
    .filter(event=>event.evidencePolarity==='POSITIVE'&&['CUED','GUIDED','MODELED'].includes(event.productionMode)&&event.semanticProvenance==='LEARNER_ORIGINATED'&&event.observation.trim().length>0)
    .sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt))
    .map(event=>event.observation.trim())
    .filter((value,index,all)=>all.indexOf(value)===index)
    .slice(0,3);
  const hasIndependent=items.some(item=>['INDEPENDENT_LOCAL_CONTROL','TRANSFER_PENDING','TRANSFER_SUPPORTED','RETENTION_PENDING','RETENTION_SUPPORTED'].includes(item.state));
  const hasBroaderUse=items.some(item=>item.transferSupport||item.retentionSupport);
  const hasWeakening=items.some(item=>item.historicalIndependentControl&&item.currentAvailability==='WEAKENING');
  return{
    state:items.length?'READY':'EMPTY',
    recentLearnerEnglish,
    practiceAgain,
    recentMemory:[...encounters].filter(item=>item.lookupResultExposed).sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt)).map(item=>`${item.selectedSpan}：查過，但還不算已經會了。`).filter((value,index,all)=>all.indexOf(value)===index).slice(0,2),
    progressNarrative:hasWeakening
      ?'有些英文之前已經能自己完成，最近提取比較不穩。歷史進展仍會保留，接下來會用短練習把它拉回來。'
      :hasBroaderUse
      ?'你已經在不只一次的使用情境中，把學過的英文重新用出來。下一步是隔一段時間再自然地使用。'
      :hasIndependent
        ?'你已經有一些英文能自己完成。下一步是在新的內容裡再用一次。'
        :'目前看得到練習中的進展；下一步會減少提示，讓你再自己試一次。',
  };
}

export interface JourneyMilestoneV1 {id:string;occurredAt:string;title:string;detail:string}
export async function loadJourneyVMV1(learnerId:string):Promise<{state:'EMPTY'|'READY';milestones:JourneyMilestoneV1[]}>{const [events,runtimes]=await Promise.all([operationalHistoryReadPortV1.canonicalEvidence(learnerId),operationalHistoryReadPortV1.sessions(learnerId)]);const milestones:JourneyMilestoneV1[]=[];for(const runtime of runtimes.filter(item=>item.learnerId===learnerId&&(item.status==='RETURNED'||item.status==='COMPLETED'))){milestones.push({id:`source-${runtime.id}`,occurredAt:runtime.trace.at(-1)?.occurredAt??runtime.artifact.submittedAt,title:'回到原作',detail:'完成教學後，重新處理原本的英文作品。'})}for(const event of events.filter(item=>item.evidencePolarity==='POSITIVE'&&(item.productionMode==='INDEPENDENT'||item.contextNovelty==='CHANGED_CONTEXT'||item.contextNovelty==='DELAYED_CONTEXT'))){const recognition=event.performanceDimension==='RECOGNITION'||(!event.performanceDimension&&['FORM_RECOGNITION','FORM_TO_MEANING','SENSE_DISCRIMINATION','SELECTION'].includes(String(event.capabilityFacet))),title=recognition?'完成一次獨立辨認':event.contextNovelty==='DELAYED_CONTEXT'?'延後仍能產出':event.contextNovelty==='CHANGED_CONTEXT'?'新的情境也能產出':'完成一次獨立產出';milestones.push({id:event.id,occurredAt:event.occurredAt,title,detail:event.observation})}milestones.sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt));return{state:milestones.length?'READY':'EMPTY',milestones}}

export async function loadTodayRuntimeVMV1(learnerId:string){const runtime=await operationalHistoryReadPortV1.activeSession(learnerId);if(!runtime||runtime.trace.some(entry=>entry.fixture))return{hasActiveLesson:false as const};return{hasActiveLesson:true as const,status:runtime.status,mode:runtime.artifact.mode,source:runtime.usableSourceText}}
export async function loadTodayRetentionVMV1(learnerId:string,now=new Date().toISOString()){try{const rows=await operationalRetentionNeedStoreV1.load(learnerId),advanced=rows.map(n=>advanceRetentionDueV1(n,now));for(let i=0;i<rows.length;i++)if(advanced[i]!==rows[i])await operationalRetentionNeedStoreV1.save(advanced[i]);const p=todayRetentionProjectionV1(advanced);return{state:p.nextNeed?'READY' as const:'EMPTY' as const,dueCount:p.dueCount,nextNeed:p.nextNeed,reasonCodes:p.reasonCodes}}catch{return{state:'EMPTY' as const,dueCount:0,reasonCodes:Object.freeze(['RETENTION_STORE_UNAVAILABLE'])}}}
export async function deferTodayRetentionNeedV1(learnerId:string,needId:string,occurredAt=new Date().toISOString()){const rows=await operationalRetentionNeedStoreV1.load(learnerId),need=rows.find(n=>n.needId===needId);if(!need)throw new Error('retention_need_not_found');const deferred=deferRetentionNeedV1(need,occurredAt);await operationalRetentionNeedStoreV1.save(deferred);return deferred}

export async function loadLatestResultVMV1(learnerId:string){const [events,runtimes]=await Promise.all([operationalHistoryReadPortV1.canonicalEvidence(learnerId),operationalHistoryReadPortV1.sessions(learnerId)]),runtime=[...runtimes].reverse().find(item=>item.learnerId===learnerId&&!item.trace.some(entry=>entry.fixture));if(!runtime)return{state:'EMPTY' as const};const related=events.filter(event=>event.artifactId===runtime.artifact.id),canDoMoreIndependently=related.some(event=>event.performanceDimension!=='RECOGNITION'&&event.productionMode==='INDEPENDENT'&&event.evidencePolarity==='POSITIVE'),worthAnotherTry=related.some(event=>event.performanceDimension!=='RECOGNITION'&&['CUED','GUIDED','MODELED'].includes(event.productionMode)&&event.evidencePolarity==='POSITIVE'),returned=runtime.status==='RETURNED'||runtime.status==='COMPLETED';return{state:'READY' as const,artifact:runtime.usableSourceText,canDoMoreIndependently,worthAnotherTry,returned,nextStep:worthAnotherTry?'下一步：用更少提示，再自己完成一次。':canDoMoreIndependently?'下一步：換一個內容，再把這個英文用出來。':'下一步：回到原本的內容，完成一個最重要的修改。'}}

export async function loadExamResultVMV1(learnerId:string,sessionId:string){
  const [bundle,events]=await Promise.all([loadExamOperationalCheckpointV1(learnerId,sessionId),operationalHistoryReadPortV1.canonicalEvidence(learnerId)]);
  if(!bundle||bundle.runtime.status!=='COMPLETED')return{state:'EMPTY' as const};
  const runtime=bundle.runtime,related=events.filter(event=>event.taskId?.includes(runtime.taskId)),positive=related.filter(event=>event.evidencePolarity==='POSITIVE'),independent=positive.some(event=>event.productionMode==='INDEPENDENT'),supported=positive.some(event=>event.productionMode!=='INDEPENDENT'),production=positive.some(event=>event.performanceDimension!=='RECOGNITION'),evaluations=runtime.interactionEvaluations??[];
  const statement=independent?(production?'你剛剛已經能在沒有提示下完成這個英文動作。之後還會換情境再確認。':'你剛剛已經能在沒有提示下分清這個英文關係；這還不等於能自己產出。'):supported?'剛剛有提示幫忙，這個已經有進展，但還不算完全自己會。之後會再拿掉提示確認。':'這次已經看清需要處理的位置，但目前沒有足夠結果可以說能力已改變。';
  return{state:'READY' as const,artifact:runtime.taskId,canDoMoreIndependently:independent&&production,worthAnotherTry:supported,returned:true,nextStep:statement,examReceipt:{sessionId:runtime.id,taskId:runtime.taskId,attemptId:runtime.attemptId,freshnessIdentity:runtime.freshnessIdentity,evaluationCount:evaluations.length,evidenceIds:related.map(event=>event.id),support:runtime.support}};
}

export interface TodayCurriculumVMV1{
  state:'EMPTY'|'READY';
  timeBudgetMinutes:number;
  focusArea?:string;
  focusNeed?:string;
  reasonCodes:readonly string[];
  lessonPlan?:LessonPlanV1;
  reconsideredAfterNoEffect?:boolean;
}
export async function loadTodayCurriculumVMV1(
  learnerId:string,
  productContext:ProductContextV1,
):Promise<TodayCurriculumVMV1>{
  const [events,activeExam,encounters]=await Promise.all([operationalHistoryReadPortV1.canonicalEvidence(learnerId),productContext.productMode==='EXAM'?loadActiveExamOperationalCheckpointV1(learnerId):Promise.resolve(null),canonicalLexicalEncounterStoreV1.listForLearner(learnerId)]);
  const truth=projectLearnerModelV3(learnerId,events);
  const failures=activeExam?.runtime.interactionEvaluations?.filter(item=>item.outcome==='FAILURE').length??0;
  const activeTarget=activeExam?.runtime.teacherDecision?.provenance.targetRef;
  const reconsideredAfterNoEffect=Boolean(activeTarget&&failures>=2&&activeExam!.runtime.decisionHistory.length>=3);
  const lexicalSignals=encounters.filter(x=>x.canonicalTargetRef).map(x=>x.canonicalTargetRef!).filter((x,i,a)=>a.indexOf(x)===i).map(targetRef=>{const facet='CONTEXTUAL_APPROPRIACY',operation:LexicalOperationTrackV1='RECOGNITION_COMPREHENSION',projection=projectOperationSpecificLexicalMemoryV1({learnerId,targetRef,facet,operation,encounters});return lexicalTodayPrioritySignalV1({projection,encounters})});
  const plan=await canonicalCurriculumV1.planToday(productContext,truth,coreEnglishDomainPortV2,{deprioritizedTargetRefs:reconsideredAfterNoEffect?[activeTarget!]:[],lexicalEncounterSignals:lexicalSignals});
  if(!plan)return{
    state:'EMPTY',
    timeBudgetMinutes:productContext.studyMinutes,
    reasonCodes:[],
  };
  return{
    state:'READY',
    timeBudgetMinutes:plan.time.budgetMinutes,
    focusArea:plan.primaryFocus.area,
    focusNeed:plan.primaryFocus.needKind,
    reasonCodes:plan.reasonCodes,
    lessonPlan:canonicalCurriculumV1.lessonPlan(plan),
    reconsideredAfterNoEffect,
  };
}
