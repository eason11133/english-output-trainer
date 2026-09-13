import type { AssistanceStrengthV1, ProductionConditionsV1 } from './TaskContract';

const strengths:readonly AssistanceStrengthV1[]=['NONE','LIGHT','STRONG','UNKNOWN'];
export function isAssistanceStrengthV1(value:unknown):value is AssistanceStrengthV1{return typeof value==='string'&&strengths.includes(value as AssistanceStrengthV1)}

export function unknownProductionConditionsV1(context:ProductionConditionsV1['context']='UNKNOWN'):ProductionConditionsV1{return Object.freeze({elicitation:'UNKNOWN',context,taskLoad:'UNKNOWN',assistance:Object.freeze({language:'UNKNOWN',selection:'UNKNOWN',functionCue:'UNKNOWN',planning:'UNKNOWN',taskLoad:'UNKNOWN',recentModelPrime:'UNKNOWN'})})}

export function productionConditionsAllowIndependentV1(conditions:ProductionConditionsV1|undefined):{allowed:boolean;reasons:readonly string[]}{
  if(!conditions)return{allowed:false,reasons:Object.freeze(['production conditions missing'])};
  const reasons:string[]=[];
  if(!['OPEN_CHOICE','AUTHENTIC_TASK'].includes(conditions.elicitation))reasons.push(`elicitation ${conditions.elicitation} is not independent-open`);
  for(const [axis,value] of Object.entries(conditions.assistance))if(value!=='NONE')reasons.push(`${axis} assistance is ${value}`);
  if(conditions.context==='UNKNOWN')reasons.push('context is unknown');
  if(!['LOW','MEDIUM','HIGH'].includes(conditions.taskLoad))reasons.push(`task load is ${conditions.taskLoad??'missing'}`);
  return{allowed:reasons.length===0,reasons:Object.freeze(reasons)};
}

export function hasAnyRecordedAssistanceV1(conditions:ProductionConditionsV1|undefined):boolean{
  if(!conditions)return true;
  if(conditions.elicitation==='TARGET_NAMED'||conditions.elicitation==='FUNCTION_CUED'||conditions.elicitation==='UNKNOWN')return true;
  return Object.values(conditions.assistance).some(value=>value!=='NONE');
}

export function supportExposedFromProductionConditionsV1(conditions:ProductionConditionsV1|undefined):Array<'NONE'|'CUE'|'HINT'|'EXPLICIT_RULE'|'MODEL'|'SEMANTIC_CONTENT'|'LOOKUP'>{
  if(!conditions)return['CUE'];
  const values=new Set<'NONE'|'CUE'|'HINT'|'EXPLICIT_RULE'|'MODEL'|'SEMANTIC_CONTENT'|'LOOKUP'>();
  if(conditions.elicitation==='TARGET_NAMED')values.add('EXPLICIT_RULE');
  if(conditions.elicitation==='FUNCTION_CUED'||conditions.assistance.selection!=='NONE'||conditions.assistance.functionCue!=='NONE'||conditions.assistance.planning!=='NONE'||conditions.assistance.taskLoad!=='NONE')values.add('CUE');
  if(conditions.assistance.language==='STRONG')values.add('HINT');
  else if(conditions.assistance.language==='LIGHT')values.add('CUE');
  if(conditions.assistance.recentModelPrime!=='NONE')values.add('MODEL');
  if(!values.size)values.add('NONE');
  return[...values];
}
