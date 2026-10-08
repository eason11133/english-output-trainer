import type { BlockSupportV4 } from '../domain/v4/LearningBlockV4';
import type { TeachingPuzzlePieceIdV1, TeachingResponseSignalV1 } from './types';

export type TeachingPuzzleRendererV1=
  |'PUZZLE_ANNOTATED_SPANS'
  |'PUZZLE_ROLE_RELATION'
  |'PUZZLE_CONTRAST'
  |'PUZZLE_CHUNK_GROUPING'
  |'PUZZLE_RELATION_NETWORK'
  |'PUZZLE_TRANSFORMATION'
  |'PUZZLE_REFORMULATION'
  |'PUZZLE_EVIDENCE_BRIDGE';

export interface TeachingPuzzlePieceDefinitionV1{
  id:TeachingPuzzlePieceIdV1;
  label:string;
  renderer:TeachingPuzzleRendererV1;
  purpose:string;
  compatibleMechanismIds:readonly string[];
  supportsLearnerAction:boolean;
  payloadKeys:readonly string[];
}

const d=(value:TeachingPuzzlePieceDefinitionV1)=>Object.freeze({...value,compatibleMechanismIds:Object.freeze([...value.compatibleMechanismIds]),payloadKeys:Object.freeze([...value.payloadKeys])});

export const teachingPuzzleLibraryV1:readonly TeachingPuzzlePieceDefinitionV1[]=Object.freeze([
  d({
    id:'ANNOTATED_SPANS',
    label:'Annotated spans',
    renderer:'PUZZLE_ANNOTATED_SPANS',
    purpose:'make the relevant parts of learner/source language visible without replacing the whole task',
    compatibleMechanismIds:['sentence-anatomy','meaning-segmentation','morphology-decomposition','reference-chain','text-structure-map','paragraph-function-map'],
    supportsLearnerAction:true,
    payloadKeys:['segments'],
  }),
  d({
    id:'ROLE_RELATION_MAP',
    label:'Role relation map',
    renderer:'PUZZLE_ROLE_RELATION',
    purpose:'show how semantic roles or meaning units connect before form assembly',
    compatibleMechanismIds:['grammar-role-map','sentence-anatomy','meaning-segmentation','cohesion-relation-map'],
    supportsLearnerAction:true,
    payloadKeys:['nodes','edges'],
  }),
  d({
    id:'CONTRAST_PAIR',
    label:'Contrast pair',
    renderer:'PUZZLE_CONTRAST',
    purpose:'make one material distinction visible by comparing two competing representations or choices',
    compatibleMechanismIds:['form-contrast','l1-collision','reformulation-map','alternative-translation-compare','distractor-evidence-contrast','claim-strength-contrast'],
    supportsLearnerAction:true,
    payloadKeys:['left','right'],
  }),
  d({
    id:'CHUNK_GROUPING',
    label:'Chunk grouping',
    renderer:'PUZZLE_CHUNK_GROUPING',
    purpose:'make a reusable multiword unit or compatible lexical grouping visible as one production resource',
    compatibleMechanismIds:['chunk-as-unit','collocation-network'],
    supportsLearnerAction:true,
    payloadKeys:['groups'],
  }),
  d({
    id:'RELATION_NETWORK',
    label:'Relation network',
    renderer:'PUZZLE_RELATION_NETWORK',
    purpose:'show compatible or causal/reference relations among language or ideas',
    compatibleMechanismIds:['collocation-network','cohesion-relation-map','reference-chain','cross-representation-evidence-integration'],
    supportsLearnerAction:true,
    payloadKeys:['nodes','edges'],
  }),
  d({
    id:'TRANSFORMATION_STEPS',
    label:'Transformation steps',
    renderer:'PUZZLE_TRANSFORMATION',
    purpose:'show a worked sequence of meaning-preserving or structure-preserving changes that can later be faded',
    compatibleMechanismIds:['worked-transformation','grammar-role-map','sentence-anatomy'],
    supportsLearnerAction:true,
    payloadKeys:['steps'],
  }),
  d({
    id:'REFORMULATION_SET',
    label:'Reformulation set',
    renderer:'PUZZLE_REFORMULATION',
    purpose:'show multiple valid realizations and their usage boundaries without treating one reference answer as truth',
    compatibleMechanismIds:['reformulation-map','alternative-translation-compare','meaning-representation'],
    supportsLearnerAction:true,
    payloadKeys:['base','alternatives'],
  }),
  d({
    id:'EVIDENCE_BRIDGE',
    label:'Evidence bridge',
    renderer:'PUZZLE_EVIDENCE_BRIDGE',
    purpose:'connect claims, premises, references, and evidence without revealing the answer itself',
    compatibleMechanismIds:['inference-evidence-bridge','distractor-evidence-contrast','claim-strength-contrast','cross-representation-evidence-integration','sentence-insertion-continuity'],
    supportsLearnerAction:true,
    payloadKeys:['claim','evidence','bridge'],
  }),
]);

export const teachingPuzzlePieceByIdV1=(id:string|undefined)=>teachingPuzzleLibraryV1.find(piece=>piece.id===id);
export const teachingPuzzlePiecesForMechanismV1=(mechanismId:string)=>teachingPuzzleLibraryV1.filter(piece=>piece.compatibleMechanismIds.includes(mechanismId));

const supportRank:Record<BlockSupportV4,number>={MODELED:5,EXPLICIT:4,GUIDED:3,CUED:2,LIGHT:1,NONE:0};

/**
 * Teacher-owned surface choice.
 *
 * A teaching mechanism can afford more than one learner-facing puzzle piece.
 * The runtime chooses among those affordances from support + prior response
 * history. UI receives the chosen piece; it never decides pedagogy.
 */
export function selectTeachingPuzzlePieceV1(input:{
  mechanismId:string;
  support:BlockSupportV4;
  priorPieceIds?:readonly TeachingPuzzlePieceIdV1[];
  responseSignal?:TeachingResponseSignalV1;
}):TeachingPuzzlePieceIdV1|undefined{
  const candidates=teachingPuzzlePiecesForMechanismV1(input.mechanismId);
  if(!candidates.length)return undefined;
  const used=new Set(input.priorPieceIds??[]);
  const failed=['NO_PROGRESS','CONFUSED','FAILURE'].includes(input.responseSignal??'UNKNOWN');
  if(failed){
    const unused=candidates.find(piece=>!used.has(piece.id));
    if(unused)return unused.id;
  }
  const explicit=supportRank[input.support]>=4;
  const preference:TeachingPuzzlePieceIdV1[]=explicit
    ?['CONTRAST_PAIR','ROLE_RELATION_MAP','TRANSFORMATION_STEPS','EVIDENCE_BRIDGE','ANNOTATED_SPANS','REFORMULATION_SET','RELATION_NETWORK','CHUNK_GROUPING']
    :['ANNOTATED_SPANS','CHUNK_GROUPING','ROLE_RELATION_MAP','RELATION_NETWORK','EVIDENCE_BRIDGE','REFORMULATION_SET','CONTRAST_PAIR','TRANSFORMATION_STEPS'];
  return preference.find(id=>candidates.some(piece=>piece.id===id))??candidates[0].id;
}

export interface TeachingPuzzlePayloadV1{
  segments?:readonly {text:string;label?:string;emphasis?:boolean}[];
  nodes?:readonly {id:string;label:string;detail?:string}[];
  edges?:readonly {from:string;to:string;label?:string}[];
  left?:{title?:string;lines:readonly string[]};
  right?:{title?:string;lines:readonly string[]};
  groups?:readonly {label?:string;items:readonly string[]}[];
  steps?:readonly {before?:string;after:string;note?:string}[];
  base?:string;
  alternatives?:readonly {text:string;note?:string}[];
  claim?:string;
  evidence?:readonly string[];
  bridge?:string;
}

export function validateTeachingPuzzlePayloadV1(pieceId:TeachingPuzzlePieceIdV1,payload:TeachingPuzzlePayloadV1){
  const reasons:string[]=[];
  const nonEmpty=(value:unknown)=>Array.isArray(value)&&value.length>0;
  if(pieceId==='ANNOTATED_SPANS'&&!nonEmpty(payload.segments))reasons.push('segments_required');
  if((pieceId==='ROLE_RELATION_MAP'||pieceId==='RELATION_NETWORK')&&(!nonEmpty(payload.nodes)||!nonEmpty(payload.edges)))reasons.push('nodes_and_edges_required');
  if(pieceId==='CONTRAST_PAIR'&&(!payload.left?.lines?.length||!payload.right?.lines?.length))reasons.push('contrast_sides_required');
  if(pieceId==='CHUNK_GROUPING'&&!nonEmpty(payload.groups))reasons.push('groups_required');
  if(pieceId==='TRANSFORMATION_STEPS'&&!nonEmpty(payload.steps))reasons.push('steps_required');
  if(pieceId==='REFORMULATION_SET'&&(!payload.base||!nonEmpty(payload.alternatives)))reasons.push('reformulation_required');
  if(pieceId==='EVIDENCE_BRIDGE'&&(!payload.claim||!nonEmpty(payload.evidence)))reasons.push('claim_and_evidence_required');
  return Object.freeze({valid:reasons.length===0,reasons:Object.freeze(reasons)});
}
