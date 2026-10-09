import type { CapabilityFacet } from '../domain/english/EnglishDomain';
import type { BlockSupportV4 } from '../domain/v4/LearningBlockV4';
import { deriveAdaptiveTeacherEpisodeDecisionV1, deriveTeachingOptionsV1 } from './intelligence';
import { teachingPuzzleLibraryV1 } from './puzzleLibrary';
import type { TeachingPuzzleContentSlotV1, TeachingPuzzleDefinitionV1, TeachingPuzzleRepresentationKindV1 } from './puzzleContract';
import type { TeachingPrimitiveV1, TeachingRequestV1, TeachingResponseSignalV1 } from './types';

export type TeachingPuzzleMoveKindV1=
  |'PRESENT_PUZZLE'
  |'HANDOFF_TO_PRACTICE'
  |'REQUEST_INDEPENDENT_ATTEMPT'
  |'CHECK_PREREQUISITE'
  |'REDUCE_TARGET_GRANULARITY'
  |'REDUCE_TASK_LOAD'
  |'DEFER_TARGET'
  |'RETURN_TO_SOURCE'
  |'STOP'
  |'HOLD';

export interface TeachingPuzzleSelectionV1{
  puzzleId:string;
  mechanismId:string;
  support:BlockSupportV4;
  representationKind:TeachingPuzzleRepresentationKindV1;
  primaryInteraction:TeachingPrimitiveV1;
  requiredContentSlots:readonly TeachingPuzzleContentSlotV1[];
}

export interface TeachingPuzzleHistoryEntryV1 extends TeachingPuzzleSelectionV1{
  responseSignal:TeachingResponseSignalV1;
  occurredAt:string;
}

export interface TeachingPuzzleComposerStateV1{
  schemaVersion:1;
  targetRef:string;
  facet:CapabilityFacet;
  current?:TeachingPuzzleSelectionV1;
  history:readonly TeachingPuzzleHistoryEntryV1[];
  status:'ACTIVE'|'READY_FOR_INDEPENDENT_ATTEMPT'|'RETURN_READY'|'STOPPED'|'DEFERRED';
  updatedAt:string;
}

export interface TeachingPuzzleMoveV1{
  kind:TeachingPuzzleMoveKindV1;
  state:TeachingPuzzleComposerStateV1;
  selection?:TeachingPuzzleSelectionV1;
  reasonCodes:readonly string[];
}

const supportLadder:readonly BlockSupportV4[]=Object.freeze(['MODELED','EXPLICIT','GUIDED','CUED','LIGHT','NONE'] as const);
const supportRank=(support:BlockSupportV4)=>supportLadder.indexOf(support);

function scopeMatches(definition:TeachingPuzzleDefinitionV1,request:TeachingRequestV1){
  const facet=definition.scope.facets.includes(request.facet);
  const area=definition.scope.areas.includes(request.targetArea);
  const kind=definition.scope.kinds.includes(request.targetKind);
  return facet&&(area||kind);
}

function compatibleSupport(definition:TeachingPuzzleDefinitionV1,requested:BlockSupportV4):BlockSupportV4|undefined{
  if(definition.allowedSupport.includes(requested))return requested;
  if(!definition.allowedSupport.length)return undefined;
  const requestedRank=supportRank(requested);
  return [...definition.allowedSupport].sort((a,b)=>Math.abs(supportRank(a)-requestedRank)-Math.abs(supportRank(b)-requestedRank))[0];
}

function completedState(input:{
  targetRef:string;
  facet:CapabilityFacet;
  current?:TeachingPuzzleSelectionV1;
  history:readonly TeachingPuzzleHistoryEntryV1[];
  status:TeachingPuzzleComposerStateV1['status'];
  updatedAt:string;
}):TeachingPuzzleComposerStateV1{
  return Object.freeze({
    schemaVersion:1,
    targetRef:input.targetRef,
    facet:input.facet,
    current:input.current,
    history:Object.freeze([...input.history]),
    status:input.status,
    updatedAt:input.updatedAt,
  });
}

function selectionFrom(definition:TeachingPuzzleDefinitionV1,mechanismId:string,support:BlockSupportV4):TeachingPuzzleSelectionV1{
  return Object.freeze({
    puzzleId:definition.id,
    mechanismId,
    support,
    representationKind:definition.representation.kind,
    primaryInteraction:definition.interaction.primary,
    requiredContentSlots:Object.freeze(definition.contentSlots.filter(slot=>slot.required).map(slot=>Object.freeze({...slot}))),
  });
}

function latestHistoryWithResponse(input:{
  state?:TeachingPuzzleComposerStateV1;
  responseSignal?:TeachingResponseSignalV1;
  occurredAt:string;
}){
  if(!input.state?.current||!input.responseSignal)return input.state?.history??[];
  const prior=input.state.current;
  const entry:TeachingPuzzleHistoryEntryV1=Object.freeze({...prior,responseSignal:input.responseSignal,occurredAt:input.occurredAt});
  return Object.freeze([...(input.state.history??[]),entry]);
}

function selectPuzzle(input:{
  request:TeachingRequestV1;
  desiredSupport:BlockSupportV4;
  prior?:TeachingPuzzleSelectionV1;
  responseSignal?:TeachingResponseSignalV1;
  history:readonly TeachingPuzzleHistoryEntryV1[];
  availablePuzzleIds?:readonly string[];
}):TeachingPuzzleSelectionV1|undefined{
  const options=deriveTeachingOptionsV1(input.request);
  const failed=['NO_PROGRESS','CONFUSED','FAILURE'].includes(input.responseSignal??'UNKNOWN')||input.request.current.outcome==='FAILURE';
  const rankedMechanisms=options.admissibleMechanisms.filter(item=>item.admissible);
  const usedPairs=new Set(input.history.map(item=>`${item.mechanismId}::${item.puzzleId}`));
  const candidates:{definition:TeachingPuzzleDefinitionV1;mechanismId:string;support:BlockSupportV4;score:number}[]=[];

  for(const mechanism of rankedMechanisms){
    for(const definition of teachingPuzzleLibraryV1){
      if(input.availablePuzzleIds&&!input.availablePuzzleIds.includes(definition.id))continue;
      if(!definition.mechanismIds.includes(mechanism.mechanismId)||!scopeMatches(definition,input.request))continue;
      const support=compatibleSupport(definition,input.desiredSupport);
      if(!support)continue;
      let score=mechanism.score*10;
      if(definition.scope.areas.includes(input.request.targetArea))score+=4;
      if(definition.scope.kinds.includes(input.request.targetKind))score+=4;
      if(definition.scope.facets.includes(input.request.facet))score+=6;
      if(!usedPairs.has(`${mechanism.mechanismId}::${definition.id}`))score+=2;

      if(input.prior){
        const samePuzzle=definition.id===input.prior.puzzleId;
        const sameMechanism=mechanism.mechanismId===input.prior.mechanismId;
        const sameRepresentation=definition.representation.kind===input.prior.representationKind;
        if(failed){
          if(samePuzzle&&sameMechanism)score-=1000;
          if(!sameRepresentation)score+=30;
          if(!samePuzzle)score+=16;
          if(!sameMechanism)score+=10;
        }else{
          if(samePuzzle&&sameMechanism)score+=18;
          if(sameRepresentation)score+=4;
        }
      }
      candidates.push({definition,mechanismId:mechanism.mechanismId,support,score});
    }
  }

  let pool=candidates;
  if(failed&&input.prior){
    const differentRepresentation=candidates.filter(candidate=>candidate.definition.representation.kind!==input.prior?.representationKind);
    if(differentRepresentation.length)pool=differentRepresentation;
    else{
      const differentPair=candidates.filter(candidate=>candidate.definition.id!==input.prior?.puzzleId||candidate.mechanismId!==input.prior?.mechanismId);
      if(differentPair.length)pool=differentPair;
    }
  }
  pool.sort((a,b)=>b.score-a.score||a.definition.id.localeCompare(b.definition.id)||a.mechanismId.localeCompare(b.mechanismId));
  const winner=pool[0];
  return winner?selectionFrom(winner.definition,winner.mechanismId,winner.support):undefined;
}

function moveWithoutPuzzle(input:{
  kind:TeachingPuzzleMoveKindV1;
  request:TeachingRequestV1;
  history:readonly TeachingPuzzleHistoryEntryV1[];
  occurredAt:string;
  reasonCodes:readonly string[];
}):TeachingPuzzleMoveV1{
  const status:TeachingPuzzleComposerStateV1['status']=input.kind==='REQUEST_INDEPENDENT_ATTEMPT'?'READY_FOR_INDEPENDENT_ATTEMPT':input.kind==='RETURN_TO_SOURCE'?'RETURN_READY':input.kind==='DEFER_TARGET'?'DEFERRED':input.kind==='STOP'?'STOPPED':'ACTIVE';
  return Object.freeze({
    kind:input.kind,
    state:completedState({targetRef:input.request.targetRef,facet:input.request.facet,history:input.history,status,updatedAt:input.occurredAt}),
    reasonCodes:Object.freeze([...input.reasonCodes]),
  });
}

/**
 * Decide one move only.
 *
 * The Composer never emits a pre-authored future lesson. The next call must
 * include the learner response to the current move before another move is
 * selected.
 */
export function decideNextTeachingPuzzleMoveV1(input:{
  request:TeachingRequestV1;
  state?:TeachingPuzzleComposerStateV1;
  responseSignal?:TeachingResponseSignalV1;
  occurredAt:string;
  availablePuzzleIds?:readonly string[];
}):TeachingPuzzleMoveV1{
  if(input.state&&(input.state.targetRef!==input.request.targetRef||input.state.facet!==input.request.facet))throw new Error('teaching_puzzle_composer_target_drift');
  if(input.state?.current&&!input.responseSignal)throw new Error('teaching_puzzle_response_required_before_next_move');

  const history=latestHistoryWithResponse(input);
  const episode=deriveAdaptiveTeacherEpisodeDecisionV1(input.request);
  const reasons=[...episode.reasonCodes];

  if(episode.action==='CHECK_PREREQUISITE')return moveWithoutPuzzle({kind:'CHECK_PREREQUISITE',request:input.request,history,occurredAt:input.occurredAt,reasonCodes:reasons});
  if(episode.action==='REDUCE_TARGET_GRANULARITY')return moveWithoutPuzzle({kind:'REDUCE_TARGET_GRANULARITY',request:input.request,history,occurredAt:input.occurredAt,reasonCodes:reasons});
  if(episode.action==='REDUCE_TASK_LOAD')return moveWithoutPuzzle({kind:'REDUCE_TASK_LOAD',request:input.request,history,occurredAt:input.occurredAt,reasonCodes:reasons});
  if(episode.action==='DEFER_TARGET')return moveWithoutPuzzle({kind:'DEFER_TARGET',request:input.request,history,occurredAt:input.occurredAt,reasonCodes:reasons});
  if(episode.action==='RETURN_TO_SOURCE')return moveWithoutPuzzle({kind:'RETURN_TO_SOURCE',request:input.request,history,occurredAt:input.occurredAt,reasonCodes:reasons});
  if(episode.action==='STOP_NO_FURTHER_INTERVENTION')return moveWithoutPuzzle({kind:'STOP',request:input.request,history,occurredAt:input.occurredAt,reasonCodes:reasons});

  const positiveTeachingResponse=['HELPED','SELF_REPAIRED','ASSISTED_SUCCESS'].includes(input.responseSignal??'UNKNOWN');
  if(input.state?.current&&positiveTeachingResponse&&!input.request.learnerRequestedIndependentAttempt&&episode.support!=='NONE'){
    return moveWithoutPuzzle({kind:'HANDOFF_TO_PRACTICE',request:input.request,history,occurredAt:input.occurredAt,reasonCodes:[...reasons,'TEACHING_HELPED_HANDOFF_TO_LEARNER_ACTION']});
  }

  if(input.request.learnerRequestedIndependentAttempt||episode.support==='NONE'){
    return moveWithoutPuzzle({kind:'REQUEST_INDEPENDENT_ATTEMPT',request:input.request,history,occurredAt:input.occurredAt,reasonCodes:[...reasons,'NO_TEACHING_PUZZLE_WITHOUT_SUPPORT']});
  }

  const selection=selectPuzzle({
    request:input.request,
    desiredSupport:episode.support,
    prior:input.state?.current,
    responseSignal:input.responseSignal,
    history,
    availablePuzzleIds:input.availablePuzzleIds,
  });
  if(!selection)return moveWithoutPuzzle({kind:'STOP',request:input.request,history,occurredAt:input.occurredAt,reasonCodes:[...reasons,'NO_ADMISSIBLE_TEACHING_PUZZLE']});

  const state=completedState({
    targetRef:input.request.targetRef,
    facet:input.request.facet,
    current:selection,
    history,
    status:'ACTIVE',
    updatedAt:input.occurredAt,
  });
  return Object.freeze({kind:'PRESENT_PUZZLE',state,selection,reasonCodes:Object.freeze([...reasons,'ONE_MOVE_ONLY'])});
}
