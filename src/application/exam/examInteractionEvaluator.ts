import type { SemanticAssessmentDecisionV1 } from '../../assessment/semanticAssessment';
import type { BlockSupportV4 } from '../../domain/v4/LearningBlockV4';
import type { QualifiedInnerTutorDecisionV1 } from '../../teacher-runtime';
import { assessExamSemanticUnitsV1 } from './examSemanticAssessment';
import type { ExamFamilyDiagnosisV1 } from './examFamilyDiagnosis';

type BoundUnit={unitId:string;responseKey:string;canonicalTargetRef:string;canonicalFacet:string;senseId?:string;evaluatorKind:'EXACT_KEY'|'SEMANTIC_RUBRIC'};
export type InteractiveExamTaskV1={task_id:string;family:string;subtype:string;payload:Record<string,unknown>;answer_or_rubric?:unknown;validation?:{canonical?:string};canonicalBinding?:{units:readonly BoundUnit[]}};
export type InteractiveEvaluationClassV1='CORRECT'|'INCORRECT'|'PARTIAL'|'VALID_ALTERNATIVE'|'SAME_MISCONCEPTION'|'NEW_ERROR'|'DIAGNOSIS_CONTRADICTED'|'UNCERTAIN';
export interface ExamInteractionEvaluationV1{
  evaluatorId:'exam-production-interaction-evaluator-v1';evaluatorVersion:'1.0.0';
  classification:InteractiveEvaluationClassV1;outcome:'SUCCESS'|'PARTIAL'|'FAILURE'|'NOT_EVALUATED';
  learnerResponse:string;previousLearnerResponse?:string;taskId:string;unitId:string;responseKey:string;targetRef:string;facet:string;senseId?:string;
  support:BlockSupportV4;lookupExposure:readonly string[];runtimeMode:'LIVE_AI'|'DETERMINISTIC_FALLBACK'|'SAFE_ABSTAIN'|'OFFLINE_PROVIDER_UNAVAILABLE';
  diagnosisHypothesis?:string;diagnosisConfidence?:string;treatmentPieceId:string;mechanismId:string;reasonCodes:readonly string[];semanticAssessment?:SemanticAssessmentDecisionV1;
  familyDiagnosis?:ExamFamilyDiagnosisV1;
}
const normalized=(value:unknown)=>String(value??'').trim().toLocaleLowerCase('en');
const answers=(value:unknown):Record<string,unknown>=>{if(!value||typeof value!=='object'||Array.isArray(value))return{};const row=value as Record<string,unknown>;return(row.answers&&typeof row.answers==='object'?row.answers:row)as Record<string,unknown>};
const runtimeMode=(decision:QualifiedInnerTutorDecisionV1):ExamInteractionEvaluationV1['runtimeMode']=>decision.provenance.providerReceipt?'LIVE_AI':decision.provenance.provider==='DETERMINISTIC_FALLBACK'?'DETERMINISTIC_FALLBACK':decision.provenance.provider==='FALLBACK_AFTER_REJECTION'?'OFFLINE_PROVIDER_UNAVAILABLE':'SAFE_ABSTAIN';

export function evaluateExamTeacherInteractionV1(input:{task:InteractiveExamTaskV1;unitId:string;learnerResponse:string;previousLearnerResponse?:string;support:BlockSupportV4;lookupExposure:readonly string[];decision:QualifiedInnerTutorDecisionV1}):ExamInteractionEvaluationV1{
  const unit=input.task.canonicalBinding?.units.find(item=>item.unitId===input.unitId),familyDiagnosis=input.decision.lineage?.context?.sourceTaskContext?.familyDiagnosis as ExamFamilyDiagnosisV1|undefined,base={evaluatorId:'exam-production-interaction-evaluator-v1' as const,evaluatorVersion:'1.0.0' as const,learnerResponse:input.learnerResponse,previousLearnerResponse:input.previousLearnerResponse,taskId:input.task.task_id,unitId:input.unitId,responseKey:unit?.responseKey??'',targetRef:unit?.canonicalTargetRef??input.decision.provenance.targetRef,facet:unit?.canonicalFacet??input.decision.provenance.facet,senseId:unit?.senseId,support:input.support,lookupExposure:Object.freeze([...input.lookupExposure]),runtimeMode:runtimeMode(input.decision),diagnosisHypothesis:String(input.decision.blockDecision.configuration.fPrimaryBottleneck??''),diagnosisConfidence:input.decision.lineage?.proposal.confidence,treatmentPieceId:String(input.decision.blockDecision.configuration.compositionActivePieceId??input.decision.provenance.decisionPointId),mechanismId:input.decision.provenance.selectedMechanismId,familyDiagnosis};
  if(!unit||input.task.validation?.canonical!=='PASS'||!input.learnerResponse.trim())return{...base,classification:'UNCERTAIN',outcome:'NOT_EVALUATED',reasonCodes:['CANONICAL_UNIT_AND_NONEMPTY_RESPONSE_REQUIRED']};
  if(unit.evaluatorKind==='EXACT_KEY'){
    const expected=answers(input.task.answer_or_rubric)[unit.responseKey],correct=typeof expected==='string'&&normalized(expected)===normalized(input.learnerResponse);
    if(correct)return{...base,classification:'CORRECT',outcome:'SUCCESS',reasonCodes:['CANONICAL_EXACT_KEY_MATCH']};
    const same=Boolean(input.previousLearnerResponse&&normalized(input.previousLearnerResponse)===normalized(input.learnerResponse));
    return{...base,classification:same?'SAME_MISCONCEPTION':'NEW_ERROR',outcome:'FAILURE',reasonCodes:[same?'SAME_RESPONSE_PATTERN_PERSISTED':'DIFFERENT_INCORRECT_RESPONSE_OBSERVED']};
  }
  const semantic=assessExamSemanticUnitsV1({task:input.task,response:{[unit.responseKey]:input.learnerResponse}}).decisionsByUnitId[unit.unitId];
  if(!semantic||semantic.abstained||semantic.outcome==='AMBIGUOUS'||semantic.outcome==='ABSTAIN')return{...base,classification:'UNCERTAIN',outcome:'NOT_EVALUATED',reasonCodes:semantic?.reasonCodes??['SEMANTIC_EVALUATOR_ABSTAINED'],semanticAssessment:semantic};
  if(semantic.outcome==='CORRECT')return{...base,classification:'VALID_ALTERNATIVE',outcome:'SUCCESS',reasonCodes:[...semantic.reasonCodes,'OPEN_RESPONSE_NOT_EXACT_MATCHED'],semanticAssessment:semantic};
  if(semantic.outcome==='PARTIALLY_CORRECT')return{...base,classification:'PARTIAL',outcome:'PARTIAL',reasonCodes:semantic.reasonCodes,semanticAssessment:semantic};
  const same=Boolean(input.previousLearnerResponse&&normalized(input.previousLearnerResponse)===normalized(input.learnerResponse));
  return{...base,classification:same?'SAME_MISCONCEPTION':'INCORRECT',outcome:'FAILURE',reasonCodes:semantic.reasonCodes,semanticAssessment:semantic};
}
