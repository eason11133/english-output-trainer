import { coreEnglishDomainPortV2 } from '../domain/english';
import { ALLOW_OBJECT_INFINITIVE_TARGET_REF, evaluateAllowConstructionV4 } from '../teaching/mechanisms/allowObjectInfinitive';
import { qualifySemanticAssessmentV1, scoringAwareDiagnosisV1, type BoundedSemanticJudgmentV1, type ScoringAwareDiagnosisV1, type SemanticAssessmentDecisionV1, type SemanticAssessmentFailureV1, type SemanticModelJudgmentV1 } from '../assessment/semanticAssessment';
import type { LearnerOutcomeV1 } from './types';

export interface OutcomeEvaluationRequestV1{
  targetRef:string;
  facet:string;
  response:string;
  context:'SOURCE'|'SAME_CONTEXT'|'CHANGED_CONTEXT'|'DELAYED_CONTEXT'|'NOT_APPLICABLE';
  arena?:'MIXED'|'TRANSLATION'|'WRITING';
  rubricJudgment?:BoundedSemanticJudgmentV1;
  semanticModelJudgment?:unknown;
  semanticModelRequired?:boolean;
  semanticProviderFailure?:SemanticAssessmentFailureV1;
  assessorConflict?:boolean;
  taskValidated?:boolean;
  contentValidated?:boolean;
  supportIntegrityValid?:boolean;
  allowedSemanticModels?:readonly {provider:string;model:string;modelVersion:string;schemaVersion:'semantic-assessment-v1'}[];
}
export interface OutcomeEvaluationResultV1{outcome:Extract<LearnerOutcomeV1,'SUCCESS'|'PARTIAL'|'FAILURE'|'NOT_EVALUATED'>;evaluatorId:string;evaluatorVersion:string;evaluatorProvenance:string;reasonCodes:readonly string[];semanticAssessment:SemanticAssessmentDecisionV1;scoringDiagnosis?:ScoringAwareDiagnosisV1}
export interface OutcomeEvaluatorV1{id:string;version:string;provenance:string;targetRef:string;facets:readonly string[];evaluate(request:OutcomeEvaluationRequestV1):Pick<OutcomeEvaluationResultV1,'outcome'|'reasonCodes'>}
const semanticOutcome=(outcome:OutcomeEvaluationResultV1['outcome']):BoundedSemanticJudgmentV1['outcome']=>outcome==='SUCCESS'?'CORRECT':outcome==='PARTIAL'?'PARTIALLY_CORRECT':outcome==='FAILURE'?'INCORRECT':'UNINTERPRETABLE';
const learnerOutcome=(outcome:SemanticAssessmentDecisionV1['outcome']):OutcomeEvaluationResultV1['outcome']=>outcome==='CORRECT'?'SUCCESS':outcome==='PARTIALLY_CORRECT'?'PARTIAL':outcome==='INCORRECT'?'FAILURE':'NOT_EVALUATED';
const unavailable=(reason:string,request?:OutcomeEvaluationRequestV1):OutcomeEvaluationResultV1=>{const semanticAssessment=qualifySemanticAssessmentV1({rubric:request?.rubricJudgment,model:request?.semanticModelJudgment as SemanticModelJudgmentV1|undefined,modelRequired:request?.semanticModelRequired,providerFailure:request?.semanticProviderFailure,assessorConflict:request?.assessorConflict,taskValidated:request?.taskValidated??false,contentValidated:request?.contentValidated??false,supportIntegrityValid:request?.supportIntegrityValid??false,allowedModels:request?.allowedSemanticModels});return{outcome:learnerOutcome(semanticAssessment.outcome),evaluatorId:'NONE',evaluatorVersion:'0',evaluatorProvenance:'SYSTEM',reasonCodes:Object.freeze([reason,...semanticAssessment.reasonCodes]),semanticAssessment}};

export class OutcomeEvaluatorRegistryV1{
  private readonly evaluators=new Map<string,OutcomeEvaluatorV1>();
  register(evaluator:OutcomeEvaluatorV1){
    const target=coreEnglishDomainPortV2.resolveId(evaluator.targetRef);
    if(!target||target!==evaluator.targetRef)throw new Error('outcome_evaluator_requires_canonical_target');
    if(evaluator.facets.some(facet=>!coreEnglishDomainPortV2.supportsFacet(target,facet as never)))throw new Error('outcome_evaluator_target_facet_mismatch');
    this.evaluators.set(evaluator.id,evaluator);return this;
  }
  evaluate(request:OutcomeEvaluationRequestV1):OutcomeEvaluationResultV1{
    const target=coreEnglishDomainPortV2.resolveId(request.targetRef);
    if(!target||target!==request.targetRef||!coreEnglishDomainPortV2.supportsFacet(target,request.facet as never))return unavailable('INVALID_TARGET_OR_FACET',{...request,taskValidated:false});
    const evaluator=[...this.evaluators.values()].find(item=>item.targetRef===target&&item.facets.includes(request.facet));
    const deterministic=evaluator?.evaluate(request);
    const deterministicJudgment=deterministic&&deterministic.outcome!=='NOT_EVALUATED'?{outcome:semanticOutcome(deterministic.outcome),dimensions:[{dimension:request.facet,outcome:semanticOutcome(deterministic.outcome)==='PARTIALLY_CORRECT'?'PARTIALLY_CORRECT' as const:semanticOutcome(deterministic.outcome) as 'CORRECT'|'INCORRECT',reasonCodes:deterministic.reasonCodes}],rubricId:evaluator!.id,rubricVersion:evaluator!.version,reasonCodes:deterministic.reasonCodes}:undefined;
    const semanticAssessment=qualifySemanticAssessmentV1({deterministic:deterministicJudgment,rubric:request.rubricJudgment,model:request.semanticModelJudgment,modelRequired:request.semanticModelRequired,providerFailure:request.semanticProviderFailure,assessorConflict:request.assessorConflict,taskValidated:request.taskValidated??true,contentValidated:request.contentValidated??true,supportIntegrityValid:request.supportIntegrityValid??true,allowedModels:request.allowedSemanticModels});
    const dimensions=semanticAssessment.dimensions.map(item=>({dimension:item.dimension,outcome:item.outcome,reasonCodes:item.reasonCodes}));
    const scoringDiagnosis=request.arena&&dimensions.length?scoringAwareDiagnosisV1({arena:request.arena,observations:dimensions}):undefined;
    return{outcome:learnerOutcome(semanticAssessment.outcome),evaluatorId:evaluator?.id??(semanticAssessment.authority==='BOUNDED_RUBRIC'?'BOUNDED_RUBRIC':semanticAssessment.authority==='VALIDATED_MODEL'?'VALIDATED_MODEL':'NONE'),evaluatorVersion:evaluator?.version??semanticAssessment.provenance.rubricVersion??semanticAssessment.provenance.modelVersion??'0',evaluatorProvenance:evaluator?.provenance??semanticAssessment.authority,reasonCodes:Object.freeze([...(deterministic?.reasonCodes??[]),...semanticAssessment.reasonCodes]),semanticAssessment,scoringDiagnosis};
  }
}

const allowEvaluator:OutcomeEvaluatorV1={
  id:'allow-object-infinitive-v4',version:'4.0.0',provenance:'CURATED_DETERMINISTIC_MECHANISM',targetRef:ALLOW_OBJECT_INFINITIVE_TARGET_REF,
  facets:['FORM_MEANING_MAPPING','SELECTION','CONSTRUCTION','CONTROLLED_PRODUCTION','FREE_PRODUCTION','CONTEXTUAL_APPROPRIACY'],
  evaluate(request){
    const context=request.context==='SOURCE'?'SOURCE':request.context==='CHANGED_CONTEXT'||request.context==='DELAYED_CONTEXT'?'ASSESS':'LIGHT';
    if(evaluateAllowConstructionV4(request.response,context))return{outcome:'SUCCESS',reasonCodes:['TARGET_CONSTRUCTION_PRODUCED']};
    if(/\ballow(?:s|ed)?\s+to\s+\w+/i.test(request.response))return{outcome:'PARTIAL',reasonCodes:['ALLOW_OBJECT_SLOT_MISSING']};
    return{outcome:'FAILURE',reasonCodes:['TARGET_CONSTRUCTION_NOT_PRODUCED']};
  }
};

const sentenceRealizationEvaluator:OutcomeEvaluatorV1={
  id:'writing-sentence-realization-construction-v1',version:'1.0.0',provenance:'CURATED_DETERMINISTIC_WRITING_CONSTRUCTION',targetRef:'writing.sentence-realization',facets:['CONSTRUCTION'],
  evaluate(request){
    const response=request.response.trim(),tokens:string[]=response.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)??[];
    if(!response)return{outcome:'NOT_EVALUATED',reasonCodes:['NO_WRITING_PRODUCTION']};
    if(tokens.length<2)return{outcome:'FAILURE',reasonCodes:['NO_CLAUSE_OPPORTUNITY_REALIZED']};
    const normalized=tokens.map(token=>token.toLowerCase()),predicate=normalized[1],finiteLike=/^(?:am|is|are|was|were|be|has|have|had|do|does|did|can|could|will|would|shall|should|may|might|must|learn|study|work|help|improve|need|want|make|use|go|read|write|think|believe|seem|become|allow|permit|\w+(?:s|ed))$/.test(predicate);
    if(finiteLike&&/[.!?]$/.test(response))return{outcome:'SUCCESS',reasonCodes:['CONSERVATIVE_FINITE_CLAUSE_REALIZED']};
    return{outcome:'PARTIAL',reasonCodes:['CLAUSE_MATERIAL_PRESENT_BUT_NOT_COMPLETE']};
  }
};

export const productionOutcomeEvaluatorsV1=new OutcomeEvaluatorRegistryV1().register(allowEvaluator).register(sentenceRealizationEvaluator);
