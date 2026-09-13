import type { LessonPlanV1 } from '../../architecture/contracts';
import { activePracticeEvidenceCeilingV1, advanceActivePracticeTrajectoryV1, createActivePracticeTrajectoryV1, type ActivePracticeTrajectoryV1, type DeliveryLoadProfileV1 } from '../../content';
import type { CapabilityState } from '../../domain/learner/LearnerModelV3';
import type { Stage4RuntimeV4 } from '../../domain/stage4/LearnerRuntimeV4';
import type { LearnerOutcomeV1 } from '../../teacher-runtime/types';
import { hydrateWritingWorkV1, type Stage4WritingRuntimeV1 } from './workRuntime';

export const authenticWritingLoadV1:DeliveryLoadProfileV1=Object.freeze({length:'HIGH',reasoning:'MEDIUM',ideaGeneration:'HIGH',contentSupport:'NONE',clauses:3,planningSupport:'NONE',languageSupport:'NONE',selectionSupport:'NONE',functionCue:'NONE',recentModelPrime:'NONE'});
const hasPriorControl=(state?:CapabilityState)=>state==='INDEPENDENT_LOCAL_CONTROL'||state==='TRANSFER_PENDING'||state==='TRANSFER_SUPPORTED'||state==='RETENTION_PENDING'||state==='RETENTION_SUPPORTED';
export interface WritingActivePracticeTransitionV1{status:'NOT_APPLICABLE'|'DELIVERED'|'ADVANCED'|'AUTHENTIC_REDEPLOY'|'REPLAN_REQUIRED'|'COMPLETE'|'BLOCKED';runtime:Stage4RuntimeV4;reasonCodes:readonly string[];deliveryId?:string}

export function transitionWritingActivePracticeV1(input:{runtime:Stage4RuntimeV4;lessonPlan:LessonPlanV1;outcome:LearnerOutcomeV1;priorCapabilityState?:CapabilityState;occurredAt:string}):WritingActivePracticeTransitionV1{
  const work=hydrateWritingWorkV1(input.runtime);if(!work)return{status:'NOT_APPLICABLE',runtime:input.runtime,reasonCodes:Object.freeze([])};
  let trajectory=work.activePracticeTrajectory;
  if(!trajectory){
    const latest=[...input.runtime.blockEvents].reverse().find(x=>x.productionConditions)?.productionConditions;
    if(input.outcome!=='FAILURE'||latest?.taskLoad!=='HIGH'||!hasPriorControl(input.priorCapabilityState))return{status:'NOT_APPLICABLE',runtime:input.runtime,reasonCodes:Object.freeze([])};
    trajectory=createActivePracticeTrajectoryV1({runtimeId:input.runtime.id,lessonPlan:input.lessonPlan,arena:'WRITING',sourceIdentity:work.sourceContext.promptArtifactId,sourcePrompt:work.sourceContext.promptText,semanticRequirements:[input.lessonPlan.objective,'preserve the D-authorized target construction'],authenticLoad:authenticWritingLoadV1,provenanceRefs:[work.sourceContext.promptArtifactId],occurredAt:input.occurredAt});
    if(!trajectory)return{status:'BLOCKED',runtime:input.runtime,reasonCodes:Object.freeze(['G_VALIDATED_ACTIVE_PRACTICE_UNAVAILABLE'])};
    const runtime={...(input.runtime as Stage4WritingRuntimeV1),writingWork:{...work,activePracticeTrajectory:trajectory,updatedAt:input.occurredAt}};
    return{status:'DELIVERED',runtime,reasonCodes:Object.freeze(['DEPLOYMENT_UNDER_LOAD','PRIOR_LOCAL_CONTROL']),deliveryId:trajectory.steps[0].deliveryId};
  }
  if(!['SUCCESS','FAILURE','PARTIAL'].includes(input.outcome))return{status:'NOT_APPLICABLE',runtime:input.runtime,reasonCodes:Object.freeze([]),deliveryId:trajectory.steps[trajectory.currentStep]?.deliveryId};
  trajectory=advanceActivePracticeTrajectoryV1(trajectory,input.outcome as 'SUCCESS'|'FAILURE'|'PARTIAL');
  const runtime={...(input.runtime as Stage4WritingRuntimeV1),writingWork:{...work,activePracticeTrajectory:trajectory,updatedAt:input.occurredAt}};
  if(trajectory.status==='REPLAN_REQUIRED')return{status:'REPLAN_REQUIRED',runtime,reasonCodes:Object.freeze(['REDUCED_LOAD_NOT_YET_SUCCESSFUL','F_REPLAN_REQUIRED'])};
  if(trajectory.status==='COMPLETE')return{status:'COMPLETE',runtime,reasonCodes:Object.freeze(['AUTHENTIC_REDEPLOY_COMPLETED'])};
  const delivery=trajectory.steps[trajectory.currentStep];
  return{status:trajectory.status==='READY_FOR_AUTHENTIC_REDEPLOY'?'AUTHENTIC_REDEPLOY':'ADVANCED',runtime,reasonCodes:Object.freeze([trajectory.status==='READY_FOR_AUTHENTIC_REDEPLOY'?'AUTHENTIC_DEMAND_RESTORED':'NON_TARGET_DEMAND_RE_ADDED']),deliveryId:delivery.deliveryId};
}
export function currentWritingActivePracticeV1(runtime:Stage4RuntimeV4):{trajectory:ActivePracticeTrajectoryV1;delivery:ActivePracticeTrajectoryV1['steps'][number];firewall:ReturnType<typeof activePracticeEvidenceCeilingV1>}|undefined{
  const trajectory=hydrateWritingWorkV1(runtime)?.activePracticeTrajectory;if(!trajectory||trajectory.status==='COMPLETE'||trajectory.status==='REPLAN_REQUIRED')return undefined;
  return{trajectory,delivery:trajectory.steps[trajectory.currentStep],firewall:activePracticeEvidenceCeilingV1(trajectory)};
}
