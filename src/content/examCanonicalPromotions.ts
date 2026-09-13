import { canonicalExamBindingV1, canonicalExamValidatorRefsV1 } from './examCanonicalBindings';
import v35Registry from './examV35PromotionRegistry.json';

export type ExamCanonicalPromotionSourceV1='20260903_LIVE_BINDING_CUT'|'20260904_PRIVATE_BETA_GOLD_CLOSURE'|'20260909_V35_ALL500_CANONICAL_PASS'|'20260909_V35_SEMANTIC165_CANONICAL_PASS'|'20260910_V37_RETAINED100_CANONICAL_PASS';
export interface ExamCanonicalPromotionV1{taskId:string;source:ExamCanonicalPromotionSourceV1;validatorRefs:readonly string[];status:'PROMOTED'}

// Original smoke fixtures remain available to internal tests but are quarantined from learner rotation.
const live=Object.freeze(['TRANS-T-001','WRITE-M-001','WRITE-P-001','WRITE-F-001']);
const gold=Object.freeze([
  'VOC-G-001','VOC-G-002','VOC-G-003',
  'COMP-G-004','COMP-G-007','COMP-G-008',
  'CF-G-001','CF-G-002','CF-G-004',
  'DISC-G-001','DISC-G-003','DISC-G-004',
  'READ-G-001','READ-G-004','READ-G-007',
  'MIX-G-001','MIX-G-002','MIX-G-004',
  'TRANS-G-T02','TRANS-G-T05','TRANS-G-F02',
  'WRITE-G-M06','WRITE-G-M09','WRITE-G-P01',
]);
const registry=new Map<string,ExamCanonicalPromotionV1>([
 ...live.map(taskId=>[taskId,Object.freeze({taskId,source:'20260903_LIVE_BINDING_CUT' as const,validatorRefs:canonicalExamValidatorRefsV1,status:'PROMOTED' as const})] as const),
 ...gold.map(taskId=>[taskId,Object.freeze({taskId,source:'20260904_PRIVATE_BETA_GOLD_CLOSURE' as const,validatorRefs:canonicalExamValidatorRefsV1,status:'PROMOTED' as const})] as const),
 ...(v35Registry.promotions as unknown as ExamCanonicalPromotionV1[]).map(row=>[row.taskId,Object.freeze(row)] as const),
]);

export function canonicalExamPromotionV1(taskId:string):ExamCanonicalPromotionV1|undefined{
 const promotion=registry.get(taskId);
 return promotion&&canonicalExamBindingV1(taskId)?promotion:undefined;
}
export function canonicalExamPromotedTaskIdsV1(){return Object.freeze([...registry.keys()])}
