import type { LessonPlanV1, ProductContextV1 } from '../architecture/contracts';
import type { EnglishDomainArea, EnglishDomainNodeV2, EnglishDomainPortV2 } from '../domain/english/EnglishDomainGraph';
import type { LearnerModelSnapshotV3 } from '../domain/learner/LearnerModelV3';
import { deriveGoalPolicySignalsV1 } from './goalPolicy';
import { capabilityProjectionForV1, prerequisiteReadinessV1, preferredCurriculumFacetV1 } from './readiness';
import { classifyReencounterNeedV1 } from './spacing';
import { examAllocationSignalForV1 } from '../product-policy/exam/allocationSignals';
import { resolveTimeArchitectureV1 } from './timeArchitecture';
import type {
  CanonicalCurriculumPortV1,
  CurriculumCandidateV1,
  CurriculumPlanningOptionsV1,
  CurriculumReasonCodeV1,
  TodayCurriculumPlanV1,
} from './types';

const allAreas:readonly EnglishDomainArea[]=['LEXICAL','FORMULAIC','GRAMMAR','MEANING_ENCODING','WRITING','TRANSLATION','READING','DISCOURSE'];

const baseStateScore=(state:CurriculumCandidateV1['learnerState'])=>{
  switch(state){
    case 'OBSERVED_FRAGILE': return 92;
    case 'ASSISTED_CONTROL': return 88;
    case 'INDEPENDENT_LOCAL_CONTROL': return 82;
    case 'TRANSFER_PENDING': return 84;
    case 'TRANSFER_SUPPORTED': return 78;
    case 'RETENTION_PENDING': return 78;
    case 'RETENTION_SUPPORTED': return 18;
    case 'UNKNOWN': return 46;
  }
};

const productModeAreaBoost=(context:ProductContextV1,area:EnglishDomainArea)=>{
  if(context.productMode==='GENERAL'){
    return ['MEANING_ENCODING','WRITING','TRANSLATION','FORMULAIC'].includes(area)?4:0;
  }
  const examBoost:Record<EnglishDomainArea,number>={
    LEXICAL:3,FORMULAIC:2,GRAMMAR:5,MEANING_ENCODING:6,WRITING:8,TRANSLATION:8,READING:8,DISCOURSE:4,
  };
  return examBoost[area];
};

const examUrgencyBoostAt=(context:ProductContextV1,now:string)=>{
  if(context.productMode!=='EXAM'||!context.examContext?.deadline)return 0;
  const deltaDays=(Date.parse(context.examContext.deadline)-Date.parse(now))/86400000;
  if(!Number.isFinite(deltaDays))return 0;
  if(deltaDays<=7)return 22;
  if(deltaDays<=30)return 15;
  if(deltaDays<=90)return 8;
  return 3;
};

const relevanceFor=(node:EnglishDomainNodeV2,context:ProductContextV1)=>{
  const weight=(value:'LOW'|'MEDIUM'|'HIGH')=>value==='HIGH'?8:value==='MEDIUM'?4:0;
  if(context.currentPriority==='WRITING'||context.useContexts.includes('WRITING'))return weight(node.writingRelevance);
  if(context.currentPriority==='TRANSLATION'||context.useContexts.includes('TRANSLATION'))return weight(node.translationRelevance);
  if(context.currentPriority==='READING'||context.useContexts.includes('READING'))return weight(node.readingRelevance);
  return Math.max(weight(node.writingRelevance),weight(node.translationRelevance),weight(node.readingRelevance))/2;
};

const uniqueNodes=(domain:EnglishDomainPortV2)=>{
  const seen=new Map<string,EnglishDomainNodeV2>();
  for(const area of allAreas)for(const node of domain.nodesForArea(area))seen.set(node.id,node);
  return [...seen.values()];
};

function coverageCounts(truth:LearnerModelSnapshotV3,domain:EnglishDomainPortV2){
  const counts=new Map<EnglishDomainArea,number>(allAreas.map(area=>[area,0]));
  const unique=new Set<string>();
  for(const item of truth.capabilitySlice){
    if(unique.has(item.targetRef))continue;
    unique.add(item.targetRef);
    const node=domain.get(item.targetRef);
    if(node)counts.set(node.area,(counts.get(node.area)??0)+1);
  }
  return counts;
}

function scoreCandidate(
  candidate:Omit<CurriculumCandidateV1,'score'|'reasonCodes'|'sampleAdequacy'|'allocationIntent'>,
  context:ProductContextV1,
  truth:LearnerModelSnapshotV3,
  domain:EnglishDomainPortV2,
  node:EnglishDomainNodeV2,
  now:string,
  options:CurriculumPlanningOptionsV1,
){
  const goal=deriveGoalPolicySignalsV1(context);
  const reasons=new Set<CurriculumReasonCodeV1>();
  let score=baseStateScore(candidate.learnerState);
  score+=goal.areaWeights[node.area]??0;
  score+=context.productMode==='EXAM'?0:relevanceFor(node,context);
  score+=productModeAreaBoost(context,node.area);

  if((goal.areaWeights[node.area]??0)>8)reasons.add('GOAL_RELEVANT');
  if(context.useContexts.length)reasons.add('USE_CONTEXT_RELEVANT');
  if(context.productMode!=='EXAM'&&goal.priorityAreas.includes(node.area)){score+=16;reasons.add('LEARNER_PRIORITY')}

  if(context.productMode==='EXAM'){
    const urgency=examUrgencyBoostAt(context,now);
    if(urgency)reasons.add('EXAM_URGENCY');
  }else if(candidate.needKind==='TRANSFER'||candidate.needKind==='RETENTION'){
    score+=8;
  }

  const counts=coverageCounts(truth,domain);
  const coverageBoost=Math.max(0,8-Math.min((counts.get(node.area)??0)*2,8));
  if(coverageBoost>0&&(goal.areaWeights[node.area]??0)>0){score+=coverageBoost;reasons.add('COVERAGE_GAP')}

  if(candidate.missingPrerequisiteRefs.length){
    reasons.add('PREREQUISITE_MISSING');
    if(candidate.learnerState==='UNKNOWN')score-=100;
  }else reasons.add('PREREQUISITE_READY');

  const projection=capabilityProjectionForV1(truth,candidate.targetRef,candidate.facet);
  if(projection?.uncertainty?.level==='HIGH'){score+=8;reasons.add('HIGH_UNCERTAINTY')}
  const sampleAdequacy=projection&&projection.sourceEvidenceIds.length<2?'INSUFFICIENT' as const:'ADEQUATE' as const;
  if(candidate.learnerState==='OBSERVED_FRAGILE'&&sampleAdequacy==='INSUFFICIENT'){
    score-=38;reasons.add('INSUFFICIENT_SAMPLE');reasons.add('DIAGNOSTIC_PRIORITY');
  }
  const examSignal=examAllocationSignalForV1({context,area:node.area,projection,now});
  score+=examSignal.boost;
  for(const reason of examSignal.reasonCodes)reasons.add(reason);

  if(candidate.needKind==='NEW_LEARNING')reasons.add('NEW_CAPABILITY');
  if(candidate.needKind==='REPAIR')reasons.add('OBSERVED_FRAGILE');
  if(candidate.needKind==='REACTIVATION'){score+=14;reasons.add('OBSERVED_FRAGILE');reasons.add('RETENTION_UNVERIFIED')}
  if(candidate.needKind==='INDEPENDENCE')reasons.add('SUPPORT_DEPENDENT');
  if(candidate.needKind==='TRANSFER')reasons.add('TRANSFER_UNVERIFIED');
  if(candidate.needKind==='RETENTION')reasons.add('RETENTION_UNVERIFIED');
  if(candidate.needKind==='MAINTENANCE')reasons.add('ALREADY_STABLE');

  if(!candidate.dueNow&&candidate.needKind==='RETENTION')score-=35;
  if(candidate.needKind==='MAINTENANCE')score-=20;
  if(options.deprioritizedTargetRefs?.includes(candidate.targetRef))score-=120;
  const encounterSignal=options.lexicalEncounterSignals?.find(x=>x.targetRef===candidate.targetRef&&String(x.facet)===String(candidate.facet));
  if(encounterSignal)score+=encounterSignal.priorityBoost;

  return{score:Math.round(score),reasonCodes:Object.freeze([...reasons]),sampleAdequacy,allocationIntent:examSignal.transferWarning?'TRANSFER_CALIBRATION' as const:candidate.learnerState==='OBSERVED_FRAGILE'&&sampleAdequacy==='INSUFFICIENT'?'DIAGNOSE' as const:'LEARN' as const,transferWarning:examSignal.transferWarning};
}

export function buildCurriculumCandidatesV1(
  context:ProductContextV1,
  truth:LearnerModelSnapshotV3,
  domain:EnglishDomainPortV2,
  options:CurriculumPlanningOptionsV1={},
):readonly CurriculumCandidateV1[]{
  const now=options.now??new Date().toISOString();
  const retentionMinimumDelayHours=options.retentionMinimumDelayHours??24;

  const candidates=uniqueNodes(domain).map(node=>{
    const observed=truth.capabilitySlice.filter(item=>item.targetRef===node.id).sort((a,b)=>baseStateScore(b.state)-baseStateScore(a.state)||b.sourceEvidenceIds.length-a.sourceEvidenceIds.length)[0];
    const facet=observed?.facet??preferredCurriculumFacetV1(node);
    const projection=capabilityProjectionForV1(truth,node.id,facet);
    const readiness=prerequisiteReadinessV1(domain,truth,node.id);
    const need=classifyReencounterNeedV1(projection,now,retentionMinimumDelayHours);
    const blocked=projection?.state===undefined||projection.state==='UNKNOWN'
      ? readiness.missingPrerequisiteRefs.length>0
      : false;
    const base:Omit<CurriculumCandidateV1,'score'|'reasonCodes'|'sampleAdequacy'|'allocationIntent'>={
      targetRef:node.id,
      label:node.label,
      facet,
      area:node.area,
      learnerState:projection?.state??'UNKNOWN',
      frontier:blocked?'BLOCKED':need.frontier,
      needKind:need.needKind,
      prerequisiteRefs:readiness.prerequisiteRefs,
      missingPrerequisiteRefs:readiness.missingPrerequisiteRefs,
      sourceEvidenceIds:Object.freeze([...(projection?.sourceEvidenceIds??[])]),
      latestEvidenceAt:projection?.latestEvidenceAt,
      dueNow:blocked?false:need.dueNow,
    };
    const scored=scoreCandidate(base,context,truth,domain,node,now,options);
    return Object.freeze({...base,...scored,...(scored.transferWarning?{frontier:'TRANSFER' as const,needKind:'TRANSFER' as const,dueNow:true}:{}),transferWarning:undefined});
  });

  return Object.freeze(candidates.sort((a,b)=>b.score-a.score||a.targetRef.localeCompare(b.targetRef)));
}

function selectDiverseV1(candidates:readonly CurriculumCandidateV1[],count:number){
  const selected:CurriculumCandidateV1[]=[];
  const remaining=[...candidates];
  while(selected.length<count&&remaining.length){
    let bestIndex=0;
    let bestAdjusted=-Infinity;
    for(let index=0;index<remaining.length;index++){
      const item=remaining[index];
      const sameArea=selected.filter(value=>value.area===item.area).length;
      const adjusted=item.score-sameArea*10;
      if(adjusted>bestAdjusted){bestAdjusted=adjusted;bestIndex=index}
    }
    selected.push(remaining.splice(bestIndex,1)[0]);
  }
  return selected;
}

export function createTodayCurriculumPlanV1(
  context:ProductContextV1,
  truth:LearnerModelSnapshotV3,
  domain:EnglishDomainPortV2,
  options:CurriculumPlanningOptionsV1={},
):TodayCurriculumPlanV1|null{
  const now=options.now??new Date().toISOString();
  const time=resolveTimeArchitectureV1(context.studyMinutes);
  const candidates=buildCurriculumCandidatesV1(context,truth,domain,{...options,now});
  const selectable=candidates.filter(item=>item.frontier!=='BLOCKED'&&item.dueNow&&item.needKind!=='MAINTENANCE');
  if(!selectable.length)return null;

  const chosen=selectDiverseV1(selectable,time.maxActiveFocuses);
  const [primaryFocus,...reserveFocuses]=chosen;
  const blockedHighValue=candidates.filter(item=>item.frontier==='BLOCKED').slice(0,3);
  return Object.freeze({
    id:`today:${context.learnerId}:${now.slice(0,10)}:${context.productMode}:${primaryFocus.targetRef}:${primaryFocus.facet}`,
    learnerId:context.learnerId,
    productMode:context.productMode,
    generatedAt:now,
    time,
    primaryFocus,
    reserveFocuses:Object.freeze(reserveFocuses),
    blockedHighValue:Object.freeze(blockedHighValue),
    reasonCodes:Object.freeze([...primaryFocus.reasonCodes]),
    noFixedSequence:true,
    planVersion:1,
  });
}

export function lessonPlanFromTodayV1(today:TodayCurriculumPlanV1):LessonPlanV1{
  return{
    id:`lesson:${today.id}`,
    learnerId:today.learnerId,
    targetRef:today.primaryFocus.targetRef,
    facet:today.primaryFocus.facet,
    needKind:today.primaryFocus.needKind,
    objective:`${today.primaryFocus.label} · ${today.primaryFocus.needKind}`,
    reason:today.primaryFocus.reasonCodes.join(','),
    reasonCodes:Object.freeze([...today.primaryFocus.reasonCodes]),
    timeBudgetMinutes:today.time.budgetMinutes,
    productMode:today.productMode,
  };
}

export const canonicalCurriculumV1:CanonicalCurriculumPortV1=Object.freeze({
  candidates:buildCurriculumCandidatesV1,
  async planToday(
    context:ProductContextV1,
    truth:LearnerModelSnapshotV3,
    domain:EnglishDomainPortV2,
    options?:CurriculumPlanningOptionsV1,
  ){return createTodayCurriculumPlanV1(context,truth,domain,options)},
  lessonPlan:lessonPlanFromTodayV1,
});
