import type { ProductionConditionsV1 } from '../../domain/task/TaskContract';
import { productionConditionsAllowIndependentV1 } from '../../domain/task/productionConditions';
import type { WritingRevisionActorV1, WritingRevisionOperationKindV1, WritingRevisionOperationV1, WritingRevisionVersionV1 } from './types';

export function createOriginalWritingRevisionV1(input:{revisionId:string;originalArtifactId:string;text:string;createdAt:string}):WritingRevisionVersionV1{
  if(!input.revisionId.trim()||!input.originalArtifactId.trim())throw new Error('writing original revision identity required');
  return Object.freeze({revisionId:input.revisionId,originalArtifactId:input.originalArtifactId,author:'LEARNER',text:input.text,operations:[],createdAt:input.createdAt,immutable:true});
}

export function revisionActorFromProductionConditionsV1(conditions:ProductionConditionsV1|undefined):WritingRevisionActorV1{
  if(!conditions)return'LEARNER_ASSISTED';
  const independent=productionConditionsAllowIndependentV1(conditions);
  return independent.allowed?'LEARNER':'LEARNER_ASSISTED';
}

export function diffWritingRevisionOperationV1(before:string,after:string):{operation:WritingRevisionOperationKindV1;sourceSpan:{start:number;end:number};before:string;after:string}{
  let start=0;
  while(start<before.length&&start<after.length&&before[start]===after[start])start++;
  let beforeEnd=before.length,afterEnd=after.length;
  while(beforeEnd>start&&afterEnd>start&&before[beforeEnd-1]===after[afterEnd-1]){beforeEnd--;afterEnd--}
  const removed=before.slice(start,beforeEnd),inserted=after.slice(start,afterEnd);
  const operation:WritingRevisionOperationKindV1=!removed&&inserted?'INSERT':removed&&!inserted?'DELETE':'REPLACE';
  return{operation,sourceSpan:{start,end:beforeEnd},before:removed,after:inserted};
}

export function createWritingRevisionV1(input:{revisionId:string;originalArtifactId:string;parent:WritingRevisionVersionV1;text:string;operations:readonly WritingRevisionOperationV1[];createdAt:string}):WritingRevisionVersionV1{
  if(input.parent.originalArtifactId!==input.originalArtifactId)throw new Error('revision must remain bound to original artifact');
  if(input.parent.revisionId===input.revisionId)throw new Error('revision id must be new');
  if(input.operations.some(op=>op.revisionId!==input.revisionId))throw new Error('revision operation bound to wrong revision');
  const author=input.operations.every(op=>op.actor==='LEARNER')?'LEARNER':input.operations.some(op=>op.actor==='AI_SUGGESTION')?'AI':input.operations.some(op=>op.actor==='TEACHER_MODEL')?'TEACHER':input.operations.some(op=>op.actor==='LEARNER_ASSISTED')?'LEARNER_ASSISTED':'SYSTEM';
  return Object.freeze({revisionId:input.revisionId,originalArtifactId:input.originalArtifactId,parentRevisionId:input.parent.revisionId,author,text:input.text,operations:Object.freeze([...input.operations]),createdAt:input.createdAt,immutable:true});
}

export function revisionCanProveLearnerProductionV1(revision:WritingRevisionVersionV1):{eligible:boolean;reasons:readonly string[]}{
  const reasons:string[]=[];
  if(revision.author!=='LEARNER')reasons.push('REVISION_NOT_LEARNER_ONLY');
  if(revision.operations.some(op=>op.actor!=='LEARNER'))reasons.push('NON_LEARNER_ONLY_OPERATION_PRESENT');
  for(const op of revision.operations){
    const independent=productionConditionsAllowIndependentV1(op.productionConditions);
    if(!independent.allowed)reasons.push(...independent.reasons.map(reason=>`REVISION_CONDITION:${reason}`));
  }
  return{eligible:reasons.length===0,reasons:Object.freeze([...new Set(reasons)])};
}
