import type { LearningBlockDefinitionV4 } from '../domain/v4/LearningBlockV4';
import type { CapabilityFacet } from '../domain/english/EnglishDomain';
import { blockRegistryV4 } from '../application/v4/blockRegistryV4';
import type { TeachingModeV1, TeachingPrimitiveV1 } from './types';

const primitiveForInteraction:Record<LearningBlockDefinitionV4['interaction'],TeachingPrimitiveV1>={
  SELECT:'SELECT',MATCH:'MATCH',ORDER:'ORDER',MOVE:'MARK',RECONSTRUCT:'CONSTRUCT',TYPE:'RECALL',REWRITE:'REPAIR',COMPARE:'COMPARE',SOURCE_RETURN:'FULL_TASK',SYSTEM:'FULL_TASK',
};

const primitiveOverrides:Readonly<Record<string,TeachingPrimitiveV1>>=Object.freeze({
  'slot-completion':'COMPLETE',
  'chunk-completion':'COMPLETE',
  'independent-sentence-production':'PRODUCE',
  'independent-translation':'PRODUCE',
  'contextual-production':'PRODUCE',
  'changed-context-production':'PRODUCE',
  'return-original-writing':'FULL_TASK',
  'return-original-translation':'FULL_TASK',
  'idea-ordering':'PLAN',
  'meaning-segmentation':'PLAN',
  'meaning-representation':'EXPLAIN',
  'grammar-role-map':'EXPLAIN',
  'form-contrast':'COMPARE',
  'l1-collision':'COMPARE',
  'sentence-anatomy':'EXPLAIN',
  'worked-transformation':'EXPLAIN',
});

export function teachingPrimitiveForBlockV1(block:LearningBlockDefinitionV4):TeachingPrimitiveV1{return primitiveOverrides[block.id]??primitiveForInteraction[block.interaction]}
export function teachingModeRegistryV1():readonly TeachingModeV1[]{return Object.freeze(blockRegistryV4.all().map(block=>Object.freeze({blockId:block.id,role:block.role,primitive:teachingPrimitiveForBlockV1(block),evidenceCeiling:block.evidenceCeiling,exposesTargetAnswer:block.exposesTargetAnswer,suitableFacets:Object.freeze([...block.suitableFacets] as CapabilityFacet[])})))}
export function teachingModesByPrimitiveV1(primitive:TeachingPrimitiveV1):readonly TeachingModeV1[]{return teachingModeRegistryV1().filter(mode=>mode.primitive===primitive)}
export const requiredTeachingPrimitivesV1:readonly TeachingPrimitiveV1[]=Object.freeze(['SELECT','MATCH','ORDER','MARK','COMPLETE','RECALL','CONSTRUCT','PRODUCE','REPAIR','COMPARE','EXPLAIN','PLAN','FULL_TASK']);
export function validateTeachingPrimitiveCoverageV1():readonly string[]{const modes=teachingModeRegistryV1(),errors:string[]=[];for(const primitive of requiredTeachingPrimitivesV1)if(!modes.some(mode=>mode.primitive===primitive))errors.push(`teaching primitive lacks production mode: ${primitive}`);return errors}
