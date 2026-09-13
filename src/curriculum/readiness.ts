import type { EnglishFacet } from '../domain/english/EnglishDomain';
import type { EnglishDomainNodeV2, EnglishDomainPortV2 } from '../domain/english/EnglishDomainGraph';
import type { CapabilityProjection, LearnerModelSnapshotV3 } from '../domain/learner/LearnerModelV3';

const strongStates=new Set(['INDEPENDENT_LOCAL_CONTROL','TRANSFER_PENDING','TRANSFER_SUPPORTED','RETENTION_PENDING','RETENTION_SUPPORTED']);

export function capabilityProjectionForV1(truth:LearnerModelSnapshotV3,targetRef:string,facet:EnglishFacet):CapabilityProjection|undefined{
  return truth.capabilitySlice.find(item=>item.targetRef===targetRef&&item.facet===facet);
}

export function targetHasIndependentReadinessV1(truth:LearnerModelSnapshotV3,targetRef:string):boolean{
  return truth.capabilitySlice.some(item=>item.targetRef===targetRef&&item.performanceDimension!=='RECOGNITION'&&strongStates.has(item.state));
}

export function prerequisiteReadinessV1(domain:EnglishDomainPortV2,truth:LearnerModelSnapshotV3,targetRef:string){
  const prerequisiteRefs=domain.prerequisites(targetRef);
  const missingPrerequisiteRefs=prerequisiteRefs.filter(ref=>!targetHasIndependentReadinessV1(truth,ref));
  return{
    prerequisiteRefs:Object.freeze([...prerequisiteRefs]),
    missingPrerequisiteRefs:Object.freeze(missingPrerequisiteRefs),
    ready:missingPrerequisiteRefs.length===0,
  };
}

const facetOrder:readonly EnglishFacet[]=[
  'FREE_PRODUCTION','CONTROLLED_PRODUCTION','CONSTRUCTION','MEANING_TO_RETRIEVAL','SELECTION',
  'FORM_MEANING_MAPPING','CONTEXTUAL_APPROPRIACY','LEXICAL_SYNTACTIC_BEHAVIOR',
  'ORTHOGRAPHIC_PRODUCTION','MORPHOLOGY','SENSE_DISCRIMINATION','COLLOCATION',
  'FORM_TO_MEANING','FORM_RECOGNITION'
];

export function preferredCurriculumFacetV1(node:EnglishDomainNodeV2):EnglishFacet{
  return facetOrder.find(facet=>node.facets.includes(facet as never))??node.facets[0];
}
