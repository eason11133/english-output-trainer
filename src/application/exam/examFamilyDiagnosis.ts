import type { LearnerModelSnapshotV3 } from '../../domain/learner/LearnerModelV3';
import { diagnoseAccountForDistractorV1 } from '../teacher/teachingLookupRetentionWave';

export type ExamFamilyDiagnosisDepthV1='FIX_ONLY'|'MICRO_TEACH'|'DEEP_TEACH';
export interface ExamFamilyDiagnosisV1{
  schemaVersion:1;
  family:string;
  unitId:string;
  observationKind:string;
  candidateBottlenecks:readonly string[];
  discriminatingActions:readonly string[];
  knownCapabilityRefs:readonly string[];
  doNotReteachKnownLanguage:boolean;
  recommendedDepth:ExamFamilyDiagnosisDepthV1;
  learnerAuthorshipRequired:boolean;
}

type Input={family:string;subtype:string;taskId:string;unitId:string;responseKey:string;targetRef:string;facet:string;outcome:string;payload:Record<string,unknown>;learnerResponse?:string;truth:LearnerModelSnapshotV3};
const known=(truth:LearnerModelSnapshotV3,refs:readonly string[])=>refs.filter(ref=>truth.capabilitySlice.some(item=>item.targetRef===ref&&item.sourceControl));
const result=(input:Input,observationKind:string,candidateBottlenecks:string[],discriminatingActions:string[],refs:string[]=[],depth:ExamFamilyDiagnosisDepthV1='MICRO_TEACH',authorship=false):ExamFamilyDiagnosisV1=>{
  const knownCapabilityRefs=known(input.truth,refs);
  return Object.freeze({schemaVersion:1,family:input.family,unitId:input.unitId,observationKind,candidateBottlenecks:Object.freeze(candidateBottlenecks),discriminatingActions:Object.freeze(discriminatingActions),knownCapabilityRefs:Object.freeze(knownCapabilityRefs),doNotReteachKnownLanguage:knownCapabilityRefs.length>0,recommendedDepth:input.outcome==='SUCCESS'?'FIX_ONLY':depth,learnerAuthorshipRequired:authorship});
};
const responseType=(payload:Record<string,unknown>,key:string)=>{for(const raw of [payload.parts,payload.questions])if(Array.isArray(raw)){const row=(raw as {id?:unknown;type?:unknown;operation?:unknown}[]).find(item=>String(item.id)===key);if(row)return String(row.type??row.operation??'UNKNOWN')}return'UNKNOWN'};

export function diagnoseExamFamilyUnitV1(input:Input):ExamFamilyDiagnosisV1{
  if(input.family==='VOCABULARY'){
    if(/account[._ -]?for/i.test(input.targetRef)){const hypothesis=diagnoseAccountForDistractorV1(input.learnerResponse??'');const actions=hypothesis==='RECOGNITION_PRESENT'?['CHECK_MEANING_TO_ENGLISH_RETRIEVAL']:hypothesis==='SENSE_CONFUSION'?['CONTRAST_PROPORTION_AND_CAUSE','CLASSIFY_SEMANTIC_RELATION']:hypothesis==='PHRASE_BOUNDARY_CONFUSION'?['CONTRAST_PHRASE_BOUNDARIES','RECONSTRUCT_CHUNK']:hypothesis==='CHUNK_VS_WORD_CONFUSION'?['GROUP_CHUNK_NOT_SINGLE_WORD','SORT_CHUNK_FRAMES']:['CHECK_MEANING_TO_ENGLISH_RETRIEVAL','FADE_RETRIEVAL_SUPPORT'];return result(input,`ACCOUNT_FOR_${hypothesis}`,[hypothesis],actions,[input.targetRef],'MICRO_TEACH')}
    if(input.targetRef.startsWith('sense.'))return result(input,'CONTEXTUAL_SENSE_SELECTION',['UNKNOWN_WORD_OR_PHRASE','WRONG_SENSE','CONTEXT_DISCRIMINATION'],['ASK_MEANING_RECOGNITION','CONTRAST_NEARBY_SENSES','CHECK_MEANING_TO_ENGLISH_RETRIEVAL'],[input.targetRef,'word.allow'],'MICRO_TEACH');
    if(input.facet==='COLLOCATION')return result(input,'COLLOCATION_SELECTION',['UNKNOWN_PHRASE','COLLOCATION','CONTEXT_DISCRIMINATION','RECOGNITION_VS_RETRIEVAL'],['CONTRAST_COLLOCATES','CHECK_CHUNK_RETRIEVAL','CHECK_FRESH_PRODUCTION'],[input.targetRef],'MICRO_TEACH');
    return result(input,'WORD_FORM_SELECTION',['WORD_FAMILY_OR_FORM','GRAMMAR_SLOT','SPELLING_OR_FORM','RECOGNITION_VS_PRODUCTION'],['MARK_SYNTACTIC_SLOT','REBUILD_WORD_FORM','CHECK_TYPED_PRODUCTION'],[input.targetRef,'morph.regular-verb-ed-s'],'MICRO_TEACH');
  }
  if(input.family==='COMPREHENSIVE')return result(input,'PASSAGE_LOCAL_CHOICE',['VOCABULARY_OR_SENSE','PHRASE_OR_COLLOCATION','GRAMMAR_FIT','LOCAL_CONTEXT','DISCOURSE_CLUE'],['ASK_LOCAL_MEANING','MARK_GRAMMAR_SLOT','COMPARE_COLLOCATION','CHECK_PREVIOUS_AND_NEXT_SENTENCE'],['lexical.contextual-fit','reading.logic-structure'],'MICRO_TEACH');
  if(input.family==='CONTEXTUAL_FILL')return result(input,'SHARED_POOL_SLOT',['SYNTAX_OR_POS','SEMANTICS','COLLOCATION','GRAMMAR_SLOT','LOCAL_CONTEXT','GLOBAL_CONTEXT','POOL_CHAIN_ERROR'],['MARK_SLOT_CONSTRAINT','COMPARE_LOCAL_MEANING','TRACE_PARAGRAPH_ROLE','RECHECK_REMAINING_POOL'],['lexical.contextual-fit','reading.logic-structure'],'MICRO_TEACH');
  if(input.family==='DISCOURSE')return result(input,'SENTENCE_INSERTION_FIT',['REFERENCE_CHAIN','OLD_NEW_INFORMATION','LEXICAL_COHESION','CONNECTOR_OR_LOGICAL_RELATION','SENTENCE_FUNCTION','BEFORE_AFTER_FIT'],['LINK_REFERENCES','LABEL_SENTENCE_FUNCTION','MARK_BACKWARD_LINK','MARK_FORWARD_LINK'],['reading.reference-tracking','reading.logic-structure'],'MICRO_TEACH');
  if(input.family==='READING'){
    const operation=responseType(input.payload,input.responseKey);
    const candidates=operation==='INFERENCE'?['EVIDENCE_LOCALIZATION','CLAIM_STRENGTH','TEXT_VS_INFERENCE','DISTRACTOR_REASONING','NOT_STATED_VS_CONTRADICTED']:operation==='DETAIL'?['EVIDENCE_LOCALIZATION','REFERENCE_RESOLUTION','PARAPHRASE','WRONG_EVIDENCE_VS_WRONG_REASONING']:operation==='MAIN_IDEA'?['MAIN_IDEA_VS_DETAIL','PARAGRAPH_ROLE','CLAIM_STRENGTH','DISTRACTOR_REASONING']:['CONTEXTUAL_MEANING','PARAPHRASE','REFERENCE_RESOLUTION'];
    return result(input,`READING_${operation}`,candidates,['SELECT_EVIDENCE_LOCATION','EXPLAIN_EVIDENCE_TO_OPTION_LINK','COMPARE_CLAIM_STRENGTH','CLASSIFY_NOT_STATED_OR_CONTRADICTED'],['reading.meaning-decomposition','reading.reference-tracking','reading.logic-structure','reading.inference'],'MICRO_TEACH');
  }
  if(input.family==='MIXED'){
    const type=responseType(input.payload,input.responseKey),candidates=type==='FILL'?['DEFINITION_TO_WORD_RETRIEVAL','GRAMMAR_SLOT','SPELLING_OR_FORM','COPYABLE_VS_MORPHOLOGY']:type==='SHORT_RESPONSE'?['SUMMARY_RECONSTRUCTION','PARAPHRASE','SYNTHESIS','RECOGNITION_VS_RETRIEVAL']:['CROSS_SOURCE_INTEGRATION','EVIDENCE_LOCALIZATION','PARAPHRASE'];
    return result(input,`MIXED_${type}`,candidates,['IDENTIFY_SOURCE_EVIDENCE','CLASSIFY_COPYABLE_OR_TRANSFORMED','RETRIEVE_WITHOUT_OPTION','RECONSTRUCT_SUMMARY'],['reading.meaning-decomposition','reading.logic-structure'],'MICRO_TEACH',type==='SHORT_RESPONSE');
  }
  if(input.family==='TRANSLATION')return result(input,'LEARNER_AUTHORED_TRANSLATION',['MEANING_UNIT_COVERAGE','MAIN_CLAUSE_OR_RELATIONSHIP','MEANING_TO_ENGLISH_RETRIEVAL','CHUNK_OR_COLLOCATION','GRAMMAR_CONSTRUCTION','WORD_FORM','SPELLING','VALID_ALTERNATIVE'],['MARK_MEANING_UNITS','MAP_CLAUSE_RELATIONS','CHECK_RETRIEVAL_BEFORE_MODEL','REPAIR_MINIMUM_SPAN'],['translation.source-meaning','translation.meaning-segmentation','translation.meaning-to-english','translation.naturalness-precision'],'DEEP_TEACH',true);
  if(input.family==='WRITING')return result(input,'LEARNER_AUTHORED_WRITING',['TASK_FULFILLMENT','IDEA_DEVELOPMENT','ORGANIZATION_OR_COHESION','SENTENCE_REALIZATION','RETRIEVAL','GRAMMAR_OR_FORM','REVISION'],['PRESERVE_ORIGINAL_DRAFT','SELECT_ONE_WORTHWHILE_TARGET','REPAIR_MINIMUM_SPAN','LEARNER_REWRITE','KEEP_MODEL_REWRITE_NON_EVIDENCE'],['writing.purpose-audience','writing.idea-reasoning','writing.organization-cohesion','writing.sentence-realization','writing.revision'],'DEEP_TEACH',true);
  return result(input,'UNCLASSIFIED_EXAM_RESPONSE',['UNRESOLVED'],['CLARIFY_CONTEXT'],[],'FIX_ONLY');
}
