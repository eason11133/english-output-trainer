import type { CapabilityFacet } from '../domain/english/EnglishDomain';
import {
  bindTeachingPuzzleV1,
  teachingPuzzleDefinitionV1,
  type TeachingPuzzleContentSlotV1,
  type TeachingPuzzleInstanceV1,
  type TeachingPuzzleSelectionV1,
} from '../teaching';
import type { TeachingContentResolutionV1 } from './teachingContent';

export interface TeachingPuzzleContentContextV1{
  sourceText?:string;
  learnerOutput?:string;
  prompt?:string;
  meaningUnits?:readonly string[];
  targetLanguage?:string;
  contrastItems?:readonly unknown[];
  relationNodes?:readonly unknown[];
  relationEdges?:readonly unknown[];
  evidenceSpans?:readonly unknown[];
  authoritativeBindings?:Readonly<Record<string,unknown>>;
  provenanceRefs?:readonly string[];
}

export type TeachingPuzzleContentBindingResultV1=
  |{
      status:'READY';
      instance:TeachingPuzzleInstanceV1;
      provenanceRefs:readonly string[];
      measurementEligible:false;
      reasonCodes:readonly string[];
    }
  |{
      status:'UNAVAILABLE';
      missingSlots:readonly string[];
      provenanceRefs:readonly string[];
      measurementEligible:false;
      reasonCodes:readonly string[];
    };

const nonEmpty=(value:unknown)=>Array.isArray(value)?value.length>0:value!==undefined&&value!==null&&value!=='';

function candidateTexts(resolution:TeachingContentResolutionV1|undefined,kind?:'EXAMPLE'){
  const rows=resolution?.candidates??[];
  return rows.filter(item=>!kind||item.kind===kind).map(item=>item.learnerVisibleText).filter(Boolean);
}

function directContextValue(slot:TeachingPuzzleContentSlotV1,context:TeachingPuzzleContentContextV1,resolution?:TeachingContentResolutionV1):unknown{
  const authoritative=context.authoritativeBindings?.[slot.key];
  if(nonEmpty(authoritative))return authoritative;

  if(slot.kind==='SOURCE_TEXT')return context.sourceText;
  if(slot.kind==='LEARNER_OUTPUT')return context.learnerOutput;
  if(slot.kind==='PROMPT')return context.prompt;
  if(slot.kind==='MEANING_UNIT')return slot.multiple?context.meaningUnits:context.meaningUnits?.[0];
  if(slot.kind==='TARGET_LANGUAGE')return context.targetLanguage;
  if(slot.kind==='CONTRAST_ITEM')return slot.multiple?context.contrastItems:context.contrastItems?.[0];
  if(slot.kind==='RELATION_NODE')return slot.multiple?context.relationNodes:context.relationNodes?.[0];
  if(slot.kind==='RELATION_EDGE')return slot.multiple?context.relationEdges:context.relationEdges?.[0];
  if(slot.kind==='EVIDENCE_SPAN')return slot.multiple?context.evidenceSpans:context.evidenceSpans?.[0];
  if(slot.kind==='EXAMPLE'){
    const examples=candidateTexts(resolution,'EXAMPLE');
    return slot.multiple?examples:examples[0];
  }
  if(slot.kind==='INSTRUCTIONAL_CONTENT'){
    const rows=candidateTexts(resolution);
    return slot.multiple?rows:rows[0];
  }
  return undefined;
}

/**
 * Bind a Teacher-selected puzzle to real content.
 *
 * This function intentionally does not infer semantic relations, contrast
 * boundaries, evidence spans, or learner meaning. Those must come from an
 * owning diagnosis/content subsystem through the typed context above.
 */
export function bindSelectedTeachingPuzzleContentV1(input:{
  selection:TeachingPuzzleSelectionV1;
  targetRef:string;
  facet:CapabilityFacet;
  instanceId:string;
  createdAt:string;
  context:TeachingPuzzleContentContextV1;
  contentResolution?:TeachingContentResolutionV1;
  sourceContextRef?:string;
}):TeachingPuzzleContentBindingResultV1{
  const definition=teachingPuzzleDefinitionV1(input.selection.puzzleId);
  const provenanceRefs=Object.freeze([
    ...new Set([
      ...(input.context.provenanceRefs??[]),
      ...(input.contentResolution?.candidates.flatMap(item=>item.provenanceRefs)??[]),
    ]),
  ]);

  if(!definition)return Object.freeze({
    status:'UNAVAILABLE' as const,
    missingSlots:Object.freeze([]),
    provenanceRefs,
    measurementEligible:false as const,
    reasonCodes:Object.freeze(['PUZZLE_NOT_REGISTERED']),
  });

  if(input.contentResolution){
    if(input.contentResolution.targetRef!==input.targetRef||input.contentResolution.facet!==input.facet){
      return Object.freeze({
        status:'UNAVAILABLE' as const,
        missingSlots:Object.freeze([]),
        provenanceRefs,
        measurementEligible:false as const,
        reasonCodes:Object.freeze(['CONTENT_TARGET_OR_FACET_DRIFT']),
      });
    }
    if(input.contentResolution.mechanismId!==input.selection.mechanismId){
      return Object.freeze({
        status:'UNAVAILABLE' as const,
        missingSlots:Object.freeze([]),
        provenanceRefs,
        measurementEligible:false as const,
        reasonCodes:Object.freeze(['CONTENT_MECHANISM_DRIFT']),
      });
    }
  }

  const content:Record<string,unknown>={};
  const missing:string[]=[];
  for(const slot of definition.contentSlots){
    const value=directContextValue(slot,input.context,input.contentResolution);
    if(nonEmpty(value))content[slot.key]=value;
    else if(slot.required)missing.push(slot.key);
  }

  if(missing.length)return Object.freeze({
    status:'UNAVAILABLE' as const,
    missingSlots:Object.freeze(missing),
    provenanceRefs,
    measurementEligible:false as const,
    reasonCodes:Object.freeze(missing.map(key=>`MISSING_REQUIRED_PUZZLE_CONTENT:${key}`)),
  });

  try{
    const instance=bindTeachingPuzzleV1({
      definition,
      instanceId:input.instanceId,
      mechanismId:input.selection.mechanismId,
      targetRef:input.targetRef,
      facet:input.facet,
      support:input.selection.support,
      content,
      sourceContextRef:input.sourceContextRef,
      createdAt:input.createdAt,
    });
    return Object.freeze({
      status:'READY' as const,
      instance,
      provenanceRefs,
      measurementEligible:false as const,
      reasonCodes:Object.freeze(['PUZZLE_CONTENT_BOUND_WITHOUT_SEMANTIC_INFERENCE']),
    });
  }catch(error){
    return Object.freeze({
      status:'UNAVAILABLE' as const,
      missingSlots:Object.freeze([]),
      provenanceRefs,
      measurementEligible:false as const,
      reasonCodes:Object.freeze([`PUZZLE_BINDING_REJECTED:${error instanceof Error?error.message:'unknown'}`]),
    });
  }
}
