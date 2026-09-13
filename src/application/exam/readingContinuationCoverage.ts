import { blockRegistryV4 } from '../v4/blockRegistryV4';
import { examBetaTasks } from '../../content/examBetaBank';

export interface ReadingContinuationCoverageFailureV1{targetRef:string;facet:string;missingRole:'TEACH'|'PRACTICE'|'ASSESS'|'FRESH_CONTENT';mechanism:string;taskIds:readonly string[]}
function identityCount(targetRef:string,facet:string){const rows=examBetaTasks('READING').filter(task=>(task.canonicalBinding?.units??[]).some(unit=>unit.canonicalTargetRef===targetRef&&unit.canonicalFacet===facet));return new Set(rows.map(task=>task.freshness_group_id??task.content_lineage_id??task.task_id)).size}
export function readingAdaptiveTeachingEligibilityV1(targetRef:string,facet:string){return identityCount(targetRef,facet)>=2}
export function readingContinuationCoverageV1(){
  const tasks=examBetaTasks('READING'),pairs=[...new Map(tasks.flatMap(task=>(task.canonicalBinding?.units??[]).map(unit=>[`${unit.canonicalTargetRef}|${unit.canonicalFacet}`,{targetRef:unit.canonicalTargetRef,facet:unit.canonicalFacet}]))).values()],failures:ReadingContinuationCoverageFailureV1[]=[],heldFromAdaptiveTeaching:ReadingContinuationCoverageFailureV1[]=[];
  const coverage=pairs.map(pair=>{
    const taskRows=tasks.filter(task=>(task.canonicalBinding?.units??[]).some(unit=>unit.canonicalTargetRef===pair.targetRef&&unit.canonicalFacet===pair.facet));
    const roles={TEACH:blockRegistryV4.byRole('TEACH').filter(block=>block.suitableFacets.includes(pair.facet as never)),PRACTICE:blockRegistryV4.byRole('PRACTICE').filter(block=>block.suitableFacets.includes(pair.facet as never)),ASSESS:blockRegistryV4.byRole('ASSESS').filter(block=>block.suitableFacets.includes(pair.facet as never))};
    const identities=new Set(taskRows.map(task=>task.freshness_group_id??task.content_lineage_id??task.task_id)),productionTeachingEligible=identities.size>=2;
    if(!productionTeachingEligible)heldFromAdaptiveTeaching.push({targetRef:pair.targetRef,facet:pair.facet,missingRole:'FRESH_CONTENT',mechanism:roles.ASSESS[0]?.id??'NONE_REGISTERED',taskIds:taskRows.map(task=>task.task_id)});
    else for(const role of ['TEACH','PRACTICE','ASSESS'] as const)if(!roles[role].length)failures.push({targetRef:pair.targetRef,facet:pair.facet,missingRole:role,mechanism:'NONE_REGISTERED',taskIds:taskRows.map(task=>task.task_id)});
    return{...pair,productionTeachingEligible,taskIds:taskRows.map(task=>task.task_id),contentRoles:['TEACH_EXAMPLE','GUIDED','FADE','INDEPENDENT','TRANSFER','REVIEW_ONLY'] as const,teachingMechanisms:roles.TEACH.map(block=>block.id),practiceMechanisms:roles.PRACTICE.map(block=>block.id),assessMechanisms:roles.ASSESS.map(block=>block.id),freshIdentityCount:identities.size};
  });
  return Object.freeze({passed:failures.length===0,coverage:Object.freeze(coverage),heldFromAdaptiveTeaching:Object.freeze(heldFromAdaptiveTeaching),failures:Object.freeze(failures)});
}
