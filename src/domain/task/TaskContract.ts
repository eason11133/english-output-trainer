import { CapabilityFacet } from '../english/EnglishDomain';
export type TaskPurpose='LEARNING'|'DIAGNOSTIC'|'PRACTICE'|'SOURCE_WORK'|'TRANSFER'|'RETENTION';

export type PedagogicalIntentForTaskPurposeV1='TEACH'|'PRACTICE'|'ASSESS'|'TRANSFER'|'SYSTEM'|'RETURN';
export function taskPurposeForPedagogicalIntentV1(intent:PedagogicalIntentForTaskPurposeV1|undefined):TaskPurpose{
  if(intent==='ASSESS')return'DIAGNOSTIC';
  if(intent==='TRANSFER')return'TRANSFER';
  if(intent==='PRACTICE')return'PRACTICE';
  if(intent==='SYSTEM'||intent==='RETURN')return'SOURCE_WORK';
  return'LEARNING';
}
export type TaskFamily='WRITING'|'TRANSLATION'|'READING'|'RECOGNITION'|'RETRIEVAL'|'RECONSTRUCTION'|'CONTRAST'|'GUIDED_CONSTRUCTION'|'FREE_PRODUCTION'|'REVISION'|'OTHER';
export type SemanticProvenance='LEARNER_ORIGINATED'|'ARTIFACT_SUPPORTED'|'TEACHER_HYPOTHESIS'|'TEACHER_SUPPLIED'|'SHARED_CONFIRMED'|'NOT_APPLICABLE';
export type V3ContextNovelty='SOURCE'|'SAME_CONTEXT'|'CHANGED_CONTEXT'|'DELAYED_CONTEXT';
export type ElicitationConditionV1='TARGET_NAMED'|'FUNCTION_CUED'|'OPEN_CHOICE'|'AUTHENTIC_TASK'|'UNKNOWN';
export type AssistanceStrengthV1='NONE'|'LIGHT'|'STRONG'|'UNKNOWN';
export interface MultidimensionalAssistanceV1{language:AssistanceStrengthV1;selection:AssistanceStrengthV1;functionCue:AssistanceStrengthV1;planning:AssistanceStrengthV1;taskLoad:AssistanceStrengthV1;recentModelPrime:AssistanceStrengthV1}
export interface ProductionConditionsV1{elicitation:ElicitationConditionV1;assistance:MultidimensionalAssistanceV1;context:'SOURCE'|'SAME_CONTEXT'|'CHANGED_CONTEXT'|'DELAYED_CONTEXT'|'NOT_APPLICABLE'|'UNKNOWN';taskLoad:'LOW'|'MEDIUM'|'HIGH'|'UNKNOWN'}
export interface EvidenceClaimRef{targetRef:string;facet:CapabilityFacet;senseId?:string}
export type FreshnessRelationshipV1='F0_EXACT_REPLAY'|'F1_SURFACE_CLONE'|'F2_STRUCTURAL_PARALLEL'|'F3_CONTEXT_DIVERSE_EQUIVALENT'|'F4_AUTHENTIC_REDEPLOYMENT'|'F5_DELAYED_CHANGED_CONTEXT';
export type EvidenceCeilingV1='PRACTICE_ONLY'|'ASSISTED_OBSERVATION'|'FRESH_INDEPENDENT'|'CHANGED_CONTEXT_TRANSFER'|'AUTHENTIC_TRANSFER'|'DELAYED_RETENTION';
export type FreshTaskValidationGateV1='G1_TARGET_IDENTITY'|'G2_NO_HIDDEN_TARGET'|'G3_VALID_ANSWER_OR_RUBRIC'|'G4_DISTRACTOR_CAUSALITY'|'G5_FRESHNESS_LEVEL'|'G6_SUPPORT_FIREWALL'|'G7_DIFFICULTY_ANCHOR'|'G8_CURRENT_EXAM_FORMAT'|'G9_PROVENANCE_AND_LICENSE'|'G10_PREUSE_VALIDATION';
export interface FreshTaskLoadProfileV1{lexical:'LOW'|'MEDIUM'|'HIGH'|'UNKNOWN';syntactic:'LOW'|'MEDIUM'|'HIGH'|'UNKNOWN';reasoning:'LOW'|'MEDIUM'|'HIGH'|'UNKNOWN';contextDiversity:'LOW'|'MEDIUM'|'HIGH'|'UNKNOWN';responseGeneration:'LOW'|'MEDIUM'|'HIGH'|'UNKNOWN';distractorCompetition:'LOW'|'MEDIUM'|'HIGH'|'UNKNOWN';evidenceDistance:'LOW'|'MEDIUM'|'HIGH'|'UNKNOWN';timePressure:'LOW'|'MEDIUM'|'HIGH'|'UNKNOWN'}
export interface FreshEvidenceOpportunityV1{
  relationship:FreshnessRelationshipV1;
  comparedSourceId:string;
  comparedItemId:string;
  sourceFingerprint:string;
  itemFingerprint:string;
  templateGeometry:string;
  solutionGeometry:string;
  target:{targetRef:string;facet:CapabilityFacet;senseId?:string};
  topicContext:string;
  genreRepresentation:string;
  lexicalOverlap:number;
  constructionCueOverlap:number;
  distractorStructure:string;
  load:FreshTaskLoadProfileV1;
  validation:Readonly<Record<FreshTaskValidationGateV1,'PASS'|'FAIL'|'NOT_APPLICABLE'>>;
  validationRefs:readonly string[];
  invalidationReasons:readonly string[];
  allowedEvidenceCeiling:EvidenceCeilingV1;
  acceptedAnswerRule:'UNIQUE_KEY'|'EXPLICIT_ALTERNATIVES'|'SEMANTIC_RUBRIC';
  provenanceStatus:'KNOWN_ALLOWED'|'KNOWN_RESTRICTED'|'UNKNOWN';
  examFormatStatus:'CURRENT_EQUIVALENT'|'HISTORICAL_ONLY'|'NOT_EXAM'|'UNKNOWN';
  preuseValidated:boolean;
}
export type MeasurementOpportunityKindV1='SOURCE_WORK'|'VALIDATED_FRESH'|'VALIDATED_CHANGED_CONTEXT'|'DELAYED_PROBE';
export interface TaskMeasurementProvenanceV1{
  opportunityKind:MeasurementOpportunityKindV1;
  taskId:string;
  sourceContentIdentity:string;
  taskContentIdentity:string;
  sourceContextKey:string;
  taskContextKey:string;
  deliveryRef?:string;
  validatorRefs:readonly string[];
  deliveredAt?:string;
  attemptSessionId?:string;
  priorProofEventId?:string;
  priorProofOccurredAt?:string;
  priorProofSessionId?:string;
  minimumDelayMs?:number;
  freshEvidenceOpportunity?:FreshEvidenceOpportunityV1;
}
export interface TaskContract{id:string;purpose:TaskPurpose;taskFamily:TaskFamily;targetRefs:string[];contextNovelty:V3ContextNovelty;responseOpenness:'CLOSED'|'CONSTRAINED'|'OPEN';supportExposed:Array<'NONE'|'CUE'|'HINT'|'EXPLICIT_RULE'|'MODEL'|'SEMANTIC_CONTENT'|'LOOKUP'>;meaningProvenance:SemanticProvenance;eligibleClaims:EvidenceClaimRef[];forbiddenClaims:EvidenceClaimRef[];productionConditions?:ProductionConditionsV1;measurementProvenance?:TaskMeasurementProvenanceV1}
export const claimKey=(claim:EvidenceClaimRef)=>`${claim.targetRef}::${claim.facet}::${claim.senseId??''}`;
export function taskAllowsClaim(task:TaskContract,claim:EvidenceClaimRef):boolean{const key=claimKey(claim);return task.eligibleClaims.some(x=>claimKey(x)===key)&&!task.forbiddenClaims.some(x=>claimKey(x)===key)}
export { buildFreshEvidenceOpportunityV1,classifyFreshnessRelationshipV1,unknownFreshTaskLoadV1,validateFreshEvidenceOpportunityV1 } from './freshEvidence';
