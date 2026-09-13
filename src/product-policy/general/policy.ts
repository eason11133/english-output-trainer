import type { ProductContextV1 } from '../../architecture/contracts';
export interface GeneralPolicyDecisionV1{mode:'GENERAL';objective:'DURABLE_USABLE_ENGLISH';prioritySignals:readonly string[];transferPriority:number;retentionPriority:number;realUsePriority:number;sharedLearnerTruth:true;forkLearnerTruth:false}
export function generalPolicyDecisionV1(context:ProductContextV1):GeneralPolicyDecisionV1{
 if(context.productMode!=='GENERAL')throw new Error('general_policy_requires_general_context');
 const signals=['DURABLE_USE','TRANSFER','RETENTION'];
 if(context.useContexts.length)signals.push('REAL_USE_CONTEXT');
 if(context.currentPriority)signals.push('LEARNER_PRIORITY');
 return Object.freeze({mode:'GENERAL',objective:'DURABLE_USABLE_ENGLISH',prioritySignals:Object.freeze(signals),transferPriority:10,retentionPriority:10,realUsePriority:context.useContexts.length?10:7,sharedLearnerTruth:true,forkLearnerTruth:false});
}
