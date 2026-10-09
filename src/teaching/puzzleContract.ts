import type { CapabilityFacet } from '../domain/english/EnglishDomain';
import type { EnglishDomainArea, EnglishDomainNodeKind } from '../domain/english/EnglishDomainGraph';
import type { BlockSupportV4 } from '../domain/v4/LearningBlockV4';
import { canonicalPckMechanismsV1 } from './pckCatalog';
import type { TeachingPrimitiveV1, TeachingResponseSignalV1 } from './types';

export type TeachingPuzzleRepresentationKindV1=
  |'ANNOTATED_LANGUAGE'
  |'RELATION_MAP'
  |'CONTRAST'
  |'SEQUENCE'
  |'NETWORK'
  |'WORKED_TRANSFORMATION'
  |'EVIDENCE_MAP'
  |'EDITABLE_LANGUAGE';

export type TeachingPuzzleAnchorV1='SOURCE'|'LEARNER_OUTPUT'|'GENERATED_EXAMPLE'|'MIXED';
export type TeachingPuzzleSpatialRelationV1='INLINE'|'SIDE_BY_SIDE'|'STACKED'|'SPATIAL'|'SEQUENCE'|'NETWORK';

export interface TeachingPuzzleRepresentationV1{
  kind:TeachingPuzzleRepresentationKindV1;
  anchor:TeachingPuzzleAnchorV1;
  spatialRelation:TeachingPuzzleSpatialRelationV1;
  rationale:string;
}

export type TeachingPuzzleContentSlotKindV1=
  |'SOURCE_TEXT'
  |'LEARNER_OUTPUT'
  |'TARGET_LANGUAGE'
  |'MEANING_UNIT'
  |'EXAMPLE'
  |'CONTRAST_ITEM'
  |'RELATION_NODE'
  |'RELATION_EDGE'
  |'EVIDENCE_SPAN'
  |'PROMPT'
  |'INSTRUCTIONAL_CONTENT';

export interface TeachingPuzzleContentSlotV1{
  key:string;
  kind:TeachingPuzzleContentSlotKindV1;
  required:boolean;
  multiple:boolean;
  learnerAuthored?:boolean;
}

export interface TeachingPuzzleInteractionV1{
  primary:TeachingPrimitiveV1;
  optional:readonly TeachingPrimitiveV1[];
  learnerMustAct:boolean;
  producesStructuredObservation:true;
  rationale:string;
}

export type TeachingPuzzleEvidenceCeilingV1='NONE'|'EXPOSURE_ONLY'|'ASSISTED';

export interface TeachingPuzzleObservationContractV1{
  responseSignals:readonly TeachingResponseSignalV1[];
  evidenceCeiling:TeachingPuzzleEvidenceCeilingV1;
  capabilityEvidenceMayBeWrittenDirectly:false;
  observationKinds:readonly string[];
}

export interface TeachingPuzzleScopeV1{
  areas:readonly EnglishDomainArea[];
  kinds:readonly EnglishDomainNodeKind[];
  facets:readonly CapabilityFacet[];
}

export interface TeachingPuzzleDefinitionV1{
  schemaVersion:1;
  id:string;
  label:string;
  intendedLearningChange:string;
  mechanismIds:readonly string[];
  representation:TeachingPuzzleRepresentationV1;
  interaction:TeachingPuzzleInteractionV1;
  contentSlots:readonly TeachingPuzzleContentSlotV1[];
  allowedSupport:readonly BlockSupportV4[];
  answerExposure:'NONE'|'BOUNDED'|'DIRECT_MODEL';
  observation:TeachingPuzzleObservationContractV1;
  scope:TeachingPuzzleScopeV1;
  contraindications:readonly string[];
}

export interface TeachingPuzzleInstanceV1{
  schemaVersion:1;
  instanceId:string;
  puzzleId:string;
  mechanismId:string;
  targetRef:string;
  facet:CapabilityFacet;
  support:BlockSupportV4;
  content:Readonly<Record<string,unknown>>;
  sourceContextRef?:string;
  createdAt:string;
}

export interface TeachingPuzzleObservationV1{
  schemaVersion:1;
  puzzleInstanceId:string;
  puzzleId:string;
  mechanismId:string;
  action:TeachingPrimitiveV1;
  payload:Readonly<Record<string,unknown>>;
  supportSeen:BlockSupportV4;
  responseSignal:TeachingResponseSignalV1;
  occurredAt:string;
  capabilityEvidenceAllowed:false;
}

const unique=(values:readonly string[])=>new Set(values).size===values.length;
const hasValue=(value:unknown)=>Array.isArray(value)?value.length>0:value!==undefined&&value!==null&&value!=='';

export function validateTeachingPuzzleDefinitionV1(definition:TeachingPuzzleDefinitionV1){
  const reasons:string[]=[];
  if(definition.schemaVersion!==1)reasons.push('schema_version_invalid');
  if(!definition.id.trim())reasons.push('id_required');
  if(!definition.label.trim())reasons.push('label_required');
  if(!definition.intendedLearningChange.trim())reasons.push('intended_learning_change_required');
  if(!definition.mechanismIds.length)reasons.push('mechanism_required');
  if(!unique(definition.mechanismIds))reasons.push('duplicate_mechanism');
  for(const mechanismId of definition.mechanismIds){
    if(!canonicalPckMechanismsV1.some(mechanism=>mechanism.id===mechanismId))reasons.push(`unknown_mechanism:${mechanismId}`);
  }
  if(!definition.contentSlots.length)reasons.push('content_slot_required');
  const slotKeys=definition.contentSlots.map(slot=>slot.key);
  if(!unique(slotKeys))reasons.push('duplicate_content_slot');
  if(slotKeys.some(key=>!key.trim()))reasons.push('content_slot_key_required');
  if(!definition.allowedSupport.length)reasons.push('support_required');
  if(!unique(definition.allowedSupport))reasons.push('duplicate_support');
  if(!definition.observation.responseSignals.length)reasons.push('response_signal_required');
  if(!definition.observation.observationKinds.length)reasons.push('observation_kind_required');
  if(definition.observation.capabilityEvidenceMayBeWrittenDirectly!==false)reasons.push('teaching_puzzle_cannot_write_capability_evidence');
  if(definition.answerExposure==='DIRECT_MODEL'&&definition.observation.evidenceCeiling!=='EXPOSURE_ONLY')reasons.push('direct_model_requires_exposure_only_ceiling');
  if(!definition.interaction.producesStructuredObservation)reasons.push('interaction_must_produce_observation');
  if(definition.scope.areas.length===0&&definition.scope.kinds.length===0&&definition.scope.facets.length===0)reasons.push('scope_required');
  return Object.freeze({valid:reasons.length===0,reasons:Object.freeze([...new Set(reasons)])});
}

export function bindTeachingPuzzleV1(input:{
  definition:TeachingPuzzleDefinitionV1;
  instanceId:string;
  mechanismId:string;
  targetRef:string;
  facet:CapabilityFacet;
  support:BlockSupportV4;
  content:Readonly<Record<string,unknown>>;
  sourceContextRef?:string;
  createdAt:string;
}):TeachingPuzzleInstanceV1{
  const checked=validateTeachingPuzzleDefinitionV1(input.definition);
  if(!checked.valid)throw new Error(`invalid_teaching_puzzle_definition:${checked.reasons.join(',')}`);
  if(!input.definition.mechanismIds.includes(input.mechanismId))throw new Error('mechanism_not_supported_by_puzzle');
  if(!input.definition.allowedSupport.includes(input.support))throw new Error('support_not_supported_by_puzzle');
  if(input.definition.scope.facets.length&&!input.definition.scope.facets.includes(input.facet))throw new Error('facet_not_supported_by_puzzle');
  for(const slot of input.definition.contentSlots){
    if(slot.required&&!hasValue(input.content[slot.key]))throw new Error(`missing_puzzle_content:${slot.key}`);
    const value=input.content[slot.key];
    if(value!==undefined&&slot.multiple&&!Array.isArray(value))throw new Error(`puzzle_content_must_be_array:${slot.key}`);
    if(value!==undefined&&!slot.multiple&&Array.isArray(value))throw new Error(`puzzle_content_must_be_single:${slot.key}`);
  }
  return Object.freeze({
    schemaVersion:1,
    instanceId:input.instanceId,
    puzzleId:input.definition.id,
    mechanismId:input.mechanismId,
    targetRef:input.targetRef,
    facet:input.facet,
    support:input.support,
    content:Object.freeze({...input.content}),
    sourceContextRef:input.sourceContextRef,
    createdAt:input.createdAt,
  });
}

export function createTeachingPuzzleObservationV1(input:{
  definition:TeachingPuzzleDefinitionV1;
  instance:TeachingPuzzleInstanceV1;
  action:TeachingPrimitiveV1;
  payload?:Readonly<Record<string,unknown>>;
  supportSeen:BlockSupportV4;
  responseSignal:TeachingResponseSignalV1;
  occurredAt:string;
}):TeachingPuzzleObservationV1{
  if(input.instance.puzzleId!==input.definition.id)throw new Error('puzzle_instance_definition_mismatch');
  const allowedActions=new Set([input.definition.interaction.primary,...input.definition.interaction.optional]);
  if(!allowedActions.has(input.action))throw new Error('action_not_supported_by_puzzle');
  if(!input.definition.observation.responseSignals.includes(input.responseSignal))throw new Error('response_signal_not_supported_by_puzzle');
  return Object.freeze({
    schemaVersion:1,
    puzzleInstanceId:input.instance.instanceId,
    puzzleId:input.instance.puzzleId,
    mechanismId:input.instance.mechanismId,
    action:input.action,
    payload:Object.freeze({...input.payload}),
    supportSeen:input.supportSeen,
    responseSignal:input.responseSignal,
    occurredAt:input.occurredAt,
    capabilityEvidenceAllowed:false,
  });
}
