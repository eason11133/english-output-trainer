import { coreEnglishDomainPortV2 } from '../../domain/english';
import { TeacherBlockDecisionV4 } from '../../domain/v4/LearningBlockV4';
import { validateTeacherBlockDecisionV4 } from '../v4/blockRegistryV4';

export interface QualifiedBlockSelectionV4 {pedagogicalIntent:'TEACH'|'PRACTICE'|'ASSESS'|'TRANSFER'|'SYSTEM';focusFacet:string;targetReference:string;selectedBlockId:string;supportLevel:'MODELED'|'EXPLICIT'|'GUIDED'|'CUED'|'LIGHT'|'NONE';contextProvenance:'SOURCE'|'SAME_CONTEXT'|'CHANGED_CONTEXT'|'DELAYED_CONTEXT'|'NOT_APPLICABLE';evidenceToObserve:{facet:string;productionCondition:'EXPOSURE_ONLY'|'ASSISTED'|'FRESH_INDEPENDENT'|'CHANGED_CONTEXT'|'NONE'}[];successTransitionIntent:string;failureTransitionIntent:string;confidence:'LOW'|'MEDIUM'|'HIGH';unresolvedAmbiguity:string|null;internalDecisionReason:string}

export function adaptQualifiedBlockDecisionV4(raw:QualifiedBlockSelectionV4,objectiveId:string):TeacherBlockDecisionV4 {
  const resolvedTarget=coreEnglishDomainPortV2.resolveId(raw.targetReference);
  if(raw.pedagogicalIntent!=='SYSTEM'&&!resolvedTarget)throw new Error('qualified_decision_adapter_rejected:unresolved canonical target');
  const targetReference=resolvedTarget??raw.targetReference;
  const evidenceToObserve=raw.evidenceToObserve
    .filter(item=>item.productionCondition!=='NONE'&&item.productionCondition!=='EXPOSURE_ONLY')
    .map(item=>{
      if(!resolvedTarget)throw new Error('qualified_decision_adapter_rejected:capability evidence requires canonical target');
      if(!coreEnglishDomainPortV2.supportsFacet(resolvedTarget,item.facet as never))throw new Error('qualified_decision_adapter_rejected:target does not afford requested facet');
      return{targetRef:resolvedTarget,facet:item.facet as never};
    });
  const decision:TeacherBlockDecisionV4={
    objectiveId,
    focus:raw.focusFacet,
    pedagogicalIntent:raw.pedagogicalIntent,
    selectedBlockId:raw.selectedBlockId,
    targetReference,
    supportLevel:raw.supportLevel,
    contextProvenance:raw.contextProvenance,
    configuration:{},
    reasonForSelection:'qualified-block-selection',
    evidenceToObserve,
    successTransition:raw.successTransitionIntent,
    failureTransition:raw.failureTransitionIntent,
    requestedSystemAction:raw.selectedBlockId==='return-source-navigation'?'RETURN_TO_SOURCE':raw.selectedBlockId==='continue-source'?'CONTINUE_SOURCE':raw.selectedBlockId==='clarify-context'?'CLARIFY_CONTEXT':'NONE'
  };
  const errors=validateTeacherBlockDecisionV4(decision);
  if(errors.length)throw new Error(`qualified_decision_adapter_rejected:${errors.join(',')}`);
  return decision;
}
