import type { QualifiedBlockSelectionV4 } from '../stage4/blockDecisionAdapterV4';
import type { AdaptiveDecisionContextV4 } from '../../lesson-runtime/adaptiveOutputWorkspaceRuntime';
import { ALLOW_OBJECT_INFINITIVE_TARGET_REF } from '../../teaching/mechanisms/allowObjectInfinitive';

export * from '../../lesson-runtime/adaptiveOutputWorkspaceRuntime';

const q=(intent:QualifiedBlockSelectionV4['pedagogicalIntent'],blockId:string,support:QualifiedBlockSelectionV4['supportLevel'],facet:string,condition:QualifiedBlockSelectionV4['evidenceToObserve'][number]['productionCondition'],reason:string,context:QualifiedBlockSelectionV4['contextProvenance']='SAME_CONTEXT'):QualifiedBlockSelectionV4=>({pedagogicalIntent:intent,focusFacet:facet,targetReference:ALLOW_OBJECT_INFINITIVE_TARGET_REF,selectedBlockId:blockId,supportLevel:support,contextProvenance:context,evidenceToObserve:condition==='NONE'||condition==='EXPOSURE_ONLY'?[]:[{facet,productionCondition:condition}],successTransitionIntent:'REASSESS',failureTransitionIntent:'CHANGE_MECHANISM',confidence:'HIGH',unresolvedAmbiguity:null,internalDecisionReason:reason});


export type AdaptiveReviewSeedV4='CORRECT_IMMEDIATELY'|'VALID_ALTERNATIVE'|'LEXICAL_RETRIEVAL'|'TEACHING_SUCCEEDS'|'TEACHING_CHANGES_REPRESENTATION'|'COMPOSITION_OVERLOAD'|'STUCK_BEFORE_ATTEMPT'|'DELAYED_CHANGED_CONTEXT'|'ALLOW_ROLE_MAP';

export function adaptiveReviewSourceV4(seed:AdaptiveReviewSeedV4):string{
  if(seed==='CORRECT_IMMEDIATELY')return'Schools should allow students to use phones for learning.';
  if(seed==='VALID_ALTERNATIVE')return'Schools should permit students to use phones for learning.';
  if(seed==='LEXICAL_RETRIEVAL')return'This policy had a ___ impact on students.';
  if(seed==='COMPOSITION_OVERLOAD')return'This not only reduce waste but also encourage more people reuse things.';
  if(seed==='STUCK_BEFORE_ATTEMPT')return'The library should ___.';
  if(seed==='DELAYED_CHANGED_CONTEXT')return'The company should allow employees to work from home.';
  return'Schools should allow to use phones for learning.';
}

export function controlledAdaptiveDecisionV4(seed:AdaptiveReviewSeedV4,context:AdaptiveDecisionContextV4):QualifiedBlockSelectionV4{
  const action=context.latestObservation;
  if(seed==='CORRECT_IMMEDIATELY'||seed==='VALID_ALTERNATIVE')return q('SYSTEM','continue-source','NONE','CONSTRUCTION','NONE','valid learner output requires no intervention','NOT_APPLICABLE');
  if(seed==='LEXICAL_RETRIEVAL')return q('TEACH','meaning-representation','LIGHT','SENSE_DISCRIMINATION','EXPOSURE_ONLY','grounded lexical retrieval gap');
  if(seed==='COMPOSITION_OVERLOAD')return q('TEACH','sentence-anatomy','GUIDED','CONSTRUCTION','EXPOSURE_ONLY','composition load requires meaning segmentation');
  if(seed==='DELAYED_CHANGED_CONTEXT')return q('TRANSFER','changed-context-production','NONE','CONSTRUCTION','CHANGED_CONTEXT','delayed changed-context verification is eligible','CHANGED_CONTEXT');
  if(seed==='STUCK_BEFORE_ATTEMPT'&&action.kind==='HELP_REQUESTED')return q('TEACH','sentence-anatomy','GUIDED','CONSTRUCTION','EXPOSURE_ONLY','help request before an incorrect response adds structure without failure evidence');
  if(action.kind==='HELP_REQUESTED')return q('TEACH','l1-collision','EXPLICIT','FORM_MEANING_MAPPING','EXPOSURE_ONLY','help request reopens policy and changes representation');
  if(action.kind==='CONTINUE_REQUESTED')return q('PRACTICE','sentence-builder','CUED','CONSTRUCTION','ASSISTED','learner is ready to act after the changed representation');
  if(action.kind==='OUTPUT_SUBMITTED'&&action.success===true){
    if(context.currentDecision?.support!=='NONE')return q('ASSESS','independent-sentence-production','NONE','CONSTRUCTION','FRESH_INDEPENDENT','successful supported production requires a fresh answer-safe check');
    return q('SYSTEM','continue-source','NONE','CONSTRUCTION','NONE','fresh unsupported production satisfied the local objective','NOT_APPLICABLE');
  }
  if(action.kind==='OUTPUT_SUBMITTED'&&action.success===false)return q('TEACH','l1-collision','EXPLICIT','FORM_MEANING_MAPPING','EXPOSURE_ONLY','failed production requires a different teaching mechanism');
  if(seed==='TEACHING_CHANGES_REPRESENTATION'&&action.kind!=='INITIAL')return q('TEACH','l1-collision','EXPLICIT','FORM_MEANING_MAPPING','EXPOSURE_ONLY','previous representation did not resolve the learning need');
  if((seed==='TEACHING_SUCCEEDS'||seed==='ALLOW_ROLE_MAP')&&action.kind==='LANGUAGE_OBJECT_PLACED')return q('PRACTICE','sentence-builder','CUED','CONSTRUCTION','ASSISTED','supported action succeeded; request a fresh learner production without assuming independence');
  if(seed==='STUCK_BEFORE_ATTEMPT')return q('ASSESS','independent-sentence-production','NONE','CONSTRUCTION','FRESH_INDEPENDENT','answer-safe production opportunity is open; no failure has occurred');
  return q('TEACH','grammar-role-map','GUIDED','CONSTRUCTION','EXPOSURE_ONLY','missing allowed-participant role is grounded in learner output');
}

