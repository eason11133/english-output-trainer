import { blockRegistryV4 } from '../application/v4/blockRegistryV4';
import type { BlockSupportV4, LearningBlockDefinitionV4 } from '../domain/v4/LearningBlockV4';
import { deriveAdaptiveTeacherEpisodeDecisionV1, deriveTeachingOptionsV1 } from './intelligence';
import { canonicalPckMechanismsV1 } from './pckCatalog';
import { selectTeachingPuzzlePieceV1 } from './puzzleLibrary';
import type { TeacherCompositionPieceKindV1, TeacherCompositionPlanV1, TeachingPuzzlePieceIdV1, TeachingRequestV1, TeachingResponseSignalV1 } from './types';

type TeacherPuzzleModeV1='WRITING'|'TRANSLATION'|'READING'|'LANGUAGE';

const stable=(value:string)=>value.normalize('NFKC').toLocaleLowerCase('en').replace(/[^a-z0-9._:-]+/g,'-');
const practiceFor=(facet:string,exclude?:string)=>blockRegistryV4.byRole('PRACTICE').find(block=>block.id!==exclude&&block.suitableFacets.includes(facet as never));
const assessFor=(facet:string)=>blockRegistryV4.byRole('ASSESS').find(block=>block.suitableFacets.includes(facet as never));
const returnFor=(mode?:TeacherPuzzleModeV1)=>{
  const preferred=mode==='TRANSLATION'?'return-original-translation':mode==='WRITING'?'return-original-writing':'return-source-navigation';
  return blockRegistryV4.get(preferred)??blockRegistryV4.get('continue-source');
};
function piece(kind:TeacherCompositionPieceKindV1,block:LearningBlockDefinitionV4,support:BlockSupportV4,index:number,mechanismId?:string,surfacePieceId?:TeachingPuzzlePieceIdV1){return Object.freeze({id:`piece:${index}:${block.id}`,kind,blockId:block.id,mechanismId,surfacePieceId,learnerAction:block.learnerAction,support,advanceWhen:Object.freeze(['HELPED','SELF_REPAIRED','ASSISTED_SUCCESS','INDEPENDENT_SUCCESS'] as TeachingResponseSignalV1[]),recomposeWhen:Object.freeze(['NO_PROGRESS','CONFUSED','FAILURE'] as TeachingResponseSignalV1[]),evidenceCeiling:block.evidenceCeiling})}
const teachingFor=(request:TeachingRequestV1,excluded:ReadonlySet<string>)=>{
  const options=deriveTeachingOptionsV1(request);
  const mechanismId=options.preferredMechanismIds.find(id=>!excluded.has(id));
  const mechanism=canonicalPckMechanismsV1.find(item=>item.id===mechanismId);
  const block=mechanism?blockRegistryV4.get(mechanism.id):undefined;
  return block?.role==='TEACH'?{block,mechanismId:block.id}:undefined;
};
const appendPiece=(plan:TeacherCompositionPlanV1,block:LearningBlockDefinitionV4,kind:TeacherCompositionPieceKindV1,support:BlockSupportV4,occurredAt:string,status:TeacherCompositionPlanV1['status']='ACTIVE',mechanismId?:string,excludedMechanismIds:readonly string[]=plan.excludedMechanismIds,responseSignal?:TeachingResponseSignalV1):TeacherCompositionPlanV1=>{
  const priorSurfaceIds=plan.pieces.map(item=>item.surfacePieceId).filter((id):id is TeachingPuzzlePieceIdV1=>Boolean(id));
  const surfacePieceId=mechanismId?selectTeachingPuzzlePieceV1({mechanismId,support,priorPieceIds:priorSurfaceIds,responseSignal}):undefined;
  const next=piece(kind,block,support,plan.pieces.length,mechanismId,surfacePieceId);
  return Object.freeze({...plan,pieces:Object.freeze([...plan.pieces,next]),cursor:plan.pieces.length,status,excludedMechanismIds:Object.freeze([...new Set(excludedMechanismIds)]),updatedAt:occurredAt});
};

/**
 * Production Puzzle Composer entry point.
 *
 * Unlike composeTeacherPlanV1 (legacy bounded-sequence compatibility), this
 * starts with exactly one selected teaching piece. There is no pre-authored
 * REPRESENT -> GUIDED -> FADE -> FRESH -> RETURN skeleton.
 */
export function startTeacherPuzzleV1(input:{request:TeachingRequestV1;occurredAt:string;sessionId:string;mode?:TeacherPuzzleModeV1;excludeMechanismIds?:readonly string[]}):TeacherCompositionPlanV1{
  const excluded=new Set(input.excludeMechanismIds??[]);
  const selected=teachingFor(input.request,excluded);
  if(!selected)throw new Error('no_admissible_teaching_piece');
  const initialSupport=deriveTeachingOptionsV1(input.request).supportPolicy.recommendedSupport;
  const surfacePieceId=selectTeachingPuzzlePieceV1({mechanismId:selected.mechanismId,support:initialSupport});
  const first=piece('REPRESENT',selected.block,initialSupport,0,selected.mechanismId,surfacePieceId);
  return Object.freeze({schemaVersion:1,planId:`puzzle:${stable(input.sessionId)}:${stable(input.request.targetRef)}:${stable(input.request.facet)}:${stable(input.occurredAt)}`,targetRef:input.request.targetRef,facet:input.request.facet,pieces:Object.freeze([first]),cursor:0,status:'ACTIVE',excludedMechanismIds:Object.freeze([...excluded]),createdAt:input.occurredAt,updatedAt:input.occurredAt,masteryMutationAllowed:false});
}

/**
 * Decide exactly one next teaching piece after a meaningful learner response.
 * The Teacher re-decides on every turn from learner state + response +
 * treatment history. The UI never advances through a predetermined lesson.
 */
export function decideNextTeacherPuzzleV1(input:{prior:TeacherCompositionPlanV1;request:TeachingRequestV1;signal:TeachingResponseSignalV1;occurredAt:string;sessionId:string;mode?:TeacherPuzzleModeV1}):TeacherCompositionPlanV1{
  const {prior,request,signal,occurredAt}=input;
  if(prior.status==='STOPPED'||prior.status==='RETURN_READY')return prior;
  if(prior.targetRef!==request.targetRef||prior.facet!==request.facet)throw new Error('puzzle_target_or_facet_drift');
  const current=prior.pieces[prior.cursor],currentBlock=current?blockRegistryV4.get(current.blockId):undefined;
  if(!current||!currentBlock)throw new Error('puzzle_current_piece_not_registered');

  const episode=deriveAdaptiveTeacherEpisodeDecisionV1(request);
  const failed=['NO_PROGRESS','CONFUSED','FAILURE'].includes(signal)||episode.action==='RECOMPOSE_DIFFERENT_MECHANISM';

  if(failed){
    const excluded=new Set(prior.excludedMechanismIds);
    if(currentBlock.role==='TEACH')excluded.add(current.mechanismId??current.blockId);
    const selected=teachingFor(request,excluded);
    if(!selected)return Object.freeze({...prior,status:'STOPPED' as const,excludedMechanismIds:Object.freeze([...excluded]),updatedAt:occurredAt});
    return appendPiece(prior,selected.block,'REPRESENT',episode.support,occurredAt,'ACTIVE',selected.mechanismId,[...excluded],signal);
  }

  if(currentBlock.role==='ASSESS'&&signal==='INDEPENDENT_SUCCESS'){
    const back=returnFor(input.mode);
    return back?appendPiece(prior,back,'RETURN_TO_OUTPUT','NONE',occurredAt,'RETURN_READY'):Object.freeze({...prior,status:'STOPPED' as const,updatedAt:occurredAt});
  }

  if(currentBlock.role==='TRANSFER'||episode.action==='STOP_NO_FURTHER_INTERVENTION'){
    return Object.freeze({...prior,status:'STOPPED' as const,updatedAt:occurredAt});
  }

  if(episode.action==='RETURN_TO_SOURCE'){
    const back=returnFor(input.mode);
    return back?appendPiece(prior,back,'RETURN_TO_OUTPUT','NONE',occurredAt,'RETURN_READY'):Object.freeze({...prior,status:'STOPPED' as const,updatedAt:occurredAt});
  }

  if(currentBlock.role==='TEACH'){
    if(!['HELPED','SELF_REPAIRED','ASSISTED_SUCCESS','INDEPENDENT_SUCCESS'].includes(signal)&&!request.learnerRequestedIndependentAttempt)return prior;
    if(request.learnerRequestedIndependentAttempt&&episode.support==='NONE'){
      const assess=assessFor(request.facet);
      return assess?appendPiece(prior,assess,'FRESH_ATTEMPT','NONE',occurredAt):prior;
    }
    const practice=practiceFor(request.facet);
    return practice?appendPiece(prior,practice,'GUIDED_ACTION',episode.support,occurredAt):prior;
  }

  if(currentBlock.role==='PRACTICE'){
    if(signal==='INDEPENDENT_SUCCESS'&&current.support==='NONE'){
      const assess=assessFor(request.facet);
      return assess?appendPiece(prior,assess,'FRESH_ATTEMPT','NONE',occurredAt):prior;
    }
    if(['HELPED','SELF_REPAIRED','ASSISTED_SUCCESS','INDEPENDENT_SUCCESS'].includes(signal)||request.learnerRequestedIndependentAttempt){
      if(episode.support==='NONE'){
        const assess=assessFor(request.facet);
        return assess?appendPiece(prior,assess,'FRESH_ATTEMPT','NONE',occurredAt):prior;
      }
      const practice=blockRegistryV4.get(current.blockId)??practiceFor(request.facet);
      const kind:TeacherCompositionPieceKindV1=episode.action==='FADE_SUPPORT'||episode.support!==current.support?'FADE_SUPPORT':'SUPPORTED_PRACTICE';
      return practice?appendPiece(prior,practice,kind,episode.support,occurredAt):prior;
    }
  }

  return prior;
}

export function validateTeacherPuzzleV1(plan:TeacherCompositionPlanV1){
  const reasons:string[]=[];
  if(plan.pieces.length<1||plan.pieces.length>12)reasons.push('puzzle_history_must_be_bounded');
  if(plan.cursor!==plan.pieces.length-1)reasons.push('puzzle_cursor_must_point_to_latest_decision');
  for(const item of plan.pieces){
    const block=blockRegistryV4.get(item.blockId);
    if(!block)reasons.push(`unregistered_piece:${item.blockId}`);
    if(item.mechanismId&&!canonicalPckMechanismsV1.some(m=>m.id===item.mechanismId))reasons.push(`unregistered_mechanism:${item.mechanismId}`);
    if(block&&block.evidenceCeiling!==item.evidenceCeiling)reasons.push(`evidence_ceiling_drift:${item.blockId}`);
  }
  return Object.freeze({valid:reasons.length===0,reasons:Object.freeze(reasons)});
}

/**
 * Legacy compatibility API. Existing harnesses still exercise the old bounded
 * sequence while production migrates to startTeacherPuzzleV1 /
 * decideNextTeacherPuzzleV1. Do not use this to drive learner-facing runtime.
 */
export function composeTeacherPlanV1(input:{request:TeachingRequestV1;occurredAt:string;sessionId:string;mode?:TeacherPuzzleModeV1;excludeMechanismIds?:readonly string[]}):TeacherCompositionPlanV1{const options=deriveTeachingOptionsV1(input.request),excluded=new Set(input.excludeMechanismIds??[]),mechanismId=options.preferredMechanismIds.find(id=>!excluded.has(id)),mechanism=canonicalPckMechanismsV1.find(item=>item.id===mechanismId);if(!mechanism)throw new Error('no_admissible_composition_mechanism');const teach=blockRegistryV4.get(mechanism.id);if(!teach||teach.role!=='TEACH')throw new Error('composition_requires_registered_teaching_piece');const practice=practiceFor(input.request.facet),assess=assessFor(input.request.facet),returnBlock=returnFor(input.mode);if(!practice||!assess||!returnBlock)throw new Error('composition_piece_coverage_missing');const support=options.supportPolicy.recommendedSupport,pieces=Object.freeze([piece('REPRESENT',teach,support,0,mechanism.id),piece('GUIDED_ACTION',practice,support,1),piece('FADE_SUPPORT',practice,support==='NONE'?'NONE':'LIGHT',2),piece('FRESH_ATTEMPT',assess,'NONE',3),piece('RETURN_TO_OUTPUT',returnBlock,'NONE',4)]);return Object.freeze({schemaVersion:1,planId:`composition:${stable(input.sessionId)}:${stable(input.request.targetRef)}:${stable(input.request.facet)}:${stable(input.occurredAt)}`,targetRef:input.request.targetRef,facet:input.request.facet,pieces,cursor:0,status:'ACTIVE',excludedMechanismIds:Object.freeze([...excluded]),createdAt:input.occurredAt,updatedAt:input.occurredAt,masteryMutationAllowed:false})}
export function validateTeacherCompositionV1(plan:TeacherCompositionPlanV1){const reasons:string[]=[];if(plan.pieces.length<2||plan.pieces.length>7)reasons.push('composition_must_be_bounded');for(const item of plan.pieces){const block=blockRegistryV4.get(item.blockId);if(!block)reasons.push(`unregistered_piece:${item.blockId}`);if(item.mechanismId&&!canonicalPckMechanismsV1.some(m=>m.id===item.mechanismId))reasons.push(`unregistered_mechanism:${item.mechanismId}`);if(block&&block.evidenceCeiling!==item.evidenceCeiling)reasons.push(`evidence_ceiling_drift:${item.blockId}`)}return Object.freeze({valid:reasons.length===0,reasons:Object.freeze(reasons)})}
export function advanceTeacherCompositionV1(plan:TeacherCompositionPlanV1,signal:TeachingResponseSignalV1,occurredAt:string){const current=plan.pieces[plan.cursor];if(!current||plan.status==='STOPPED'||plan.status==='RETURN_READY')return plan;if(current.recomposeWhen.includes(signal))return Object.freeze({...plan,status:'RECOMPOSED' as const,excludedMechanismIds:Object.freeze([...new Set([...plan.excludedMechanismIds,...(current.mechanismId?[current.mechanismId]:[])])]),updatedAt:occurredAt});if(!current.advanceWhen.includes(signal))return plan;const cursor=Math.min(plan.cursor+1,plan.pieces.length-1),status=plan.pieces[cursor]?.kind==='RETURN_TO_OUTPUT'?'RETURN_READY' as const:'ACTIVE' as const;return Object.freeze({...plan,cursor,status,updatedAt:occurredAt})}
export function recomposeTeacherPlanV1(input:{prior:TeacherCompositionPlanV1;request:TeachingRequestV1;occurredAt:string;sessionId:string;mode?:TeacherPuzzleModeV1}){if(input.prior.status!=='RECOMPOSED')return input.prior;return composeTeacherPlanV1({...input,excludeMechanismIds:input.prior.excludedMechanismIds})}
