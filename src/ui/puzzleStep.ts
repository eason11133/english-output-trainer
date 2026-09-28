export type PuzzlePhase='observe'|'diagnose'|'teach'|'supported_retry'|'fade'|'fresh'|'prerequisite'|'stop';
export type PuzzleRepresentation='meaning_contrast'|'context_contrast'|'argument_structure'|'chunk_as_unit'|'form_pattern'|'grammar_slot'|'evidence_map'|'claim_strength'|'reference_chain'|'old_new_information'|'discourse_relation'|'meaning_unit_map'|'sentence_function'|'paragraph_role'|'error_span'|'before_after';
export type PuzzleInteraction='select'|'mark_evidence'|'compare'|'match'|'sort'|'rebuild'|'fill'|'transform'|'retrieve'|'rewrite'|'produce'|'insert'|'order'|'trace_reference'|'delete_excess';
export type PuzzleSupport='S3'|'S2'|'S1'|'S0';
export type PuzzleEvaluationContract={
  taskId:string;
  unitId?:string;
  decisionPointId:string;
  blockId:string;
  targetRef:string;
  facet:string;
};
export type PuzzleStep={id:string;phase:PuzzlePhase;representation:PuzzleRepresentation;interaction:PuzzleInteraction;support:PuzzleSupport;instruction?:string;payload:Record<string,unknown>;evaluation?:PuzzleEvaluationContract};
export type PuzzleLearnerEvent={type:'CHOICE_COMMITTED'|'EVIDENCE_COMMITTED'|'MATCH_COMMITTED'|'SORT_COMMITTED'|'REBUILD_COMMITTED'|'FILL_COMMITTED'|'TRANSFORM_COMMITTED'|'RETRIEVAL_COMMITTED'|'REWRITE_COMMITTED'|'PRODUCTION_COMMITTED'|'INSERT_COMMITTED'|'ORDER_COMMITTED'|'REFERENCE_COMMITTED'|'DELETE_COMMITTED'|'LOOKUP_OPENED'|'LESSON_EXITED';stepId:string;value:unknown};

const compatible:Record<PuzzleRepresentation,readonly PuzzleInteraction[]>={
  meaning_contrast:['compare','match','select','retrieve'],context_contrast:['compare','select','fill','retrieve'],argument_structure:['match','transform','rebuild','produce'],chunk_as_unit:['match','rebuild','fill','retrieve'],form_pattern:['sort','fill','transform','retrieve'],grammar_slot:['mark_evidence','fill','select','transform'],evidence_map:['mark_evidence','select','compare'],claim_strength:['compare','sort','select','rewrite'],reference_chain:['trace_reference','match','select'],old_new_information:['sort','insert','order','compare'],discourse_relation:['sort','insert','compare','select'],meaning_unit_map:['match','transform','rewrite','produce'],sentence_function:['sort','insert','select','order'],paragraph_role:['sort','order','rebuild','insert'],error_span:['transform','rewrite','delete_excess','retrieve'],before_after:['compare','transform','rewrite','produce'],
};
export function isCompatiblePuzzleStepV1(step:PuzzleStep){return compatible[step.representation].includes(step.interaction)}
export function safePuzzleStepV1(step:PuzzleStep):PuzzleStep|null{return isCompatiblePuzzleStepV1(step)?step:null}
