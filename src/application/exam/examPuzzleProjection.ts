import type {QualifiedInnerTutorDecisionV1} from '../../teacher-runtime';
import type {ExamBetaTask} from '../../content/examBetaBank';
import type {PuzzleInteraction,PuzzleRepresentation,PuzzleStep,PuzzleSupport} from '../../ui/puzzleStep';
import {isCompatiblePuzzleStepV1} from '../../ui/puzzleStep';
import type {ExamTeacherInteractionV1} from './examTeacherInteraction';

type Input={decision:QualifiedInnerTutorDecisionV1;interaction:ExamTeacherInteractionV1;task:ExamBetaTask;learnerResponse?:string};

const supportMap:Record<string,PuzzleSupport>={MODELED:'S3',EXPLICIT:'S3',GUIDED:'S2',CUED:'S1',LIGHT:'S1',NONE:'S0'};
const modeMap:Record<ExamTeacherInteractionV1['mode'],PuzzleInteraction>={
  SELECT:'select',CLASSIFY:'sort',MARK:'mark_evidence',EVIDENCE_SELECT:'mark_evidence',REFERENCE_LINK:'trace_reference',MATCH:'match',COMPARE:'compare',REORDER:'order',PLAN:'order',CHUNK_RECONSTRUCTION:'rebuild',REPAIR:'rewrite',FREE_PRODUCTION:'produce',RETURN:'retrieve',
};
const blockRepresentation:Record<string,PuzzleRepresentation>={
  'meaning-representation':'meaning_contrast','form-contrast':'form_pattern','chunk-as-unit':'chunk_as_unit','collocation-network':'argument_structure','morphology-decomposition':'form_pattern','meaning-segmentation':'meaning_unit_map','task-requirement-map':'sentence_function','idea-development-ladder':'paragraph_role','alternative-translation-compare':'before_after','reference-chain':'reference_chain','text-structure-map':'paragraph_role','paragraph-function-map':'paragraph_role','sentence-insertion-continuity':'old_new_information','distractor-evidence-contrast':'evidence_map','claim-strength-contrast':'claim_strength','inference-evidence-bridge':'evidence_map',
};

function sourceText(task:ExamBetaTask){const payload=task.payload,sentences=Array.isArray(payload.chineseSentences)?payload.chineseSentences:[];return String(payload.passage??payload.source??payload.prompt??sentences[0]??payload.title??'')}
function optionLabels(interaction:ExamTeacherInteractionV1){return (interaction.options??[]).map(item=>({id:item.id,label:item.label}))}
function representationFor(input:Input):PuzzleRepresentation{
  const configured=blockRepresentation[input.interaction.blockId];if(configured)return configured;
  const family=input.task.family;
  if(family==='READING'||family==='MIXED')return'evidence_map';
  if(family==='DISCOURSE')return input.interaction.mode==='REFERENCE_LINK'?'reference_chain':'old_new_information';
  if(family==='TRANSLATION'||family==='WRITING')return'error_span';
  if(family==='COMPREHENSIVE'||family==='CONTEXTUAL_FILL')return'grammar_slot';
  return'meaning_contrast';
}
function interactionFor(input:Input):PuzzleInteraction{
  const id=input.interaction.blockId;
  if(id.includes('fill')||id.includes('slot'))return'fill';
  if(id.includes('transform')||id.includes('form-contrast'))return'transform';
  if(id.includes('retriev'))return'retrieve';
  if(id.includes('insert'))return'insert';
  if(id.includes('delete')||id.includes('excess'))return'delete_excess';
  return modeMap[input.interaction.mode];
}
function evidenceSpans(text:string){const spans=text.split(/(?<=[.!?])\s+|[,;:]\s*/).map(value=>value.trim()).filter(Boolean);return spans.length>1?spans:[text]}
function payloadFor(input:Input,interaction:PuzzleInteraction){
  const text=sourceText(input.task),options=optionLabels(input.interaction),labels=options.map(item=>item.label),response=input.learnerResponse??'';
  switch(interaction){
    case'select':return{options};
    case'mark_evidence':return{passage:text,spans:evidenceSpans(text),options};
    case'compare':return{left:labels[0]??text,leftLabel:'原文／做法 A',leftExample:labels[0]??'',right:labels[1]??response,rightLabel:'選項／做法 B',rightExample:labels[1]??'',options};
    case'match':{const middle=Math.ceil(options.length/2);return{left:options.slice(0,middle),right:options.slice(middle),options}}
    case'sort':return{categories:['符合','不符合'],items:options};
    case'rebuild':return{tokens:options.length?options:text.split(/\s+/).filter(Boolean).map((label,index)=>({id:`token-${index}`,label}))};
    case'fill':return{prompt:text,candidates:options};
    case'transform':return{original:response||text,target:String(input.interaction.prompt),targetSpan:String(input.decision.blockDecision.configuration.targetSpan??'')};
    case'retrieve':return{context:text,clues:options};
    case'rewrite':return{original:response||String(input.decision.lineage?.context.sourceTaskContext?.previousLearnerResponse??text),targetSpan:String(input.decision.blockDecision.configuration.targetSpan??''),goal:input.interaction.prompt};
    case'produce':return{context:text,goal:input.interaction.prompt};
    case'insert':return{passage:text,points:options};
    case'order':return{items:options};
    case'trace_reference':return{passage:text,targets:options};
    case'delete_excess':return{text:response||text};
  }
}

export function projectExamTeachingPuzzleStepV1(input:Input):PuzzleStep{
  const interaction=interactionFor(input),source=input.decision.lineage?.context.sourceTaskContext,proposed=representationFor(input);
  const fallback:Record<PuzzleInteraction,PuzzleRepresentation>={select:'context_contrast',mark_evidence:'evidence_map',compare:'claim_strength',match:'meaning_contrast',sort:'sentence_function',rebuild:'chunk_as_unit',fill:'grammar_slot',transform:'form_pattern',retrieve:'context_contrast',rewrite:'error_span',produce:'meaning_unit_map',insert:'old_new_information',order:'paragraph_role',trace_reference:'reference_chain',delete_excess:'error_span'};
  const representation=isCompatiblePuzzleStepV1({id:'compatibility',phase:'teach',representation:proposed,interaction,support:'S2',payload:{}})?proposed:fallback[interaction];
  return Object.freeze({
    id:input.interaction.interactionId,
    phase:input.interaction.support==='NONE'?'fresh':input.interaction.support==='LIGHT'||input.interaction.support==='CUED'?'fade':'teach',
    representation,interaction,support:supportMap[input.interaction.support]??'S2',
    instruction:input.interaction.prompt,payload:payloadFor(input,interaction),
    evaluation:{taskId:input.task.task_id,unitId:String(source?.unitId??''),decisionPointId:input.decision.provenance.decisionPointId,blockId:input.interaction.blockId,targetRef:input.decision.provenance.targetRef,facet:input.decision.provenance.facet},
  });
}
