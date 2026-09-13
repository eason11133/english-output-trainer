import type { LessonPlanV1 } from '../architecture/contracts';
export type ReadingReviewFocusKindV1='REFERENCE_RESOLUTION'|'INFERENCE_BRIDGE'|'OPTION_CONTRAST'|'LOGICAL_RELATION'|'VOCABULARY_IN_CONTEXT'|'STEM_MISREAD'|'EVIDENCE_SELECTION';
const authority:Record<ReadingReviewFocusKindV1,{targetRef:string;facet:string;objective:string}>={
  REFERENCE_RESOLUTION:{targetRef:'reading.reference-tracking',facet:'FORM_TO_MEANING',objective:'追蹤題目所指的文本資訊'},
  INFERENCE_BRIDGE:{targetRef:'reading.inference',facet:'SELECTION',objective:'用文本證據建立推論'},
  OPTION_CONTRAST:{targetRef:'reading.inference',facet:'SELECTION',objective:'比較選項與文本證據'},
  LOGICAL_RELATION:{targetRef:'reading.logic-structure',facet:'SELECTION',objective:'辨認文本中的邏輯關係'},
  VOCABULARY_IN_CONTEXT:{targetRef:'reading.meaning-decomposition',facet:'SENSE_DISCRIMINATION',objective:'依上下文判斷字詞意思'},
  STEM_MISREAD:{targetRef:'reading.meaning-decomposition',facet:'FORM_TO_MEANING',objective:'準確拆解題幹意思'},
  EVIDENCE_SELECTION:{targetRef:'reading.inference',facet:'SELECTION',objective:'選出支持答案的文本證據'},
};
export function readingReviewLessonPlanV1(input:{reviewId:string;learnerId:string;focusKind:ReadingReviewFocusKindV1;timeBudgetMinutes:number;productMode:'GENERAL'|'EXAM'}):LessonPlanV1{const selected=authority[input.focusKind];return Object.freeze({id:`lesson:reading-review:${input.reviewId}`,learnerId:input.learnerId,targetRef:selected.targetRef,facet:selected.facet,needKind:'REPAIR',objective:selected.objective,reason:'POST_ATTEMPT_REVIEW',reasonCodes:Object.freeze(['COMMITTED_READING_RESULT','LEARNER_SELECTED_REVIEW_FOCUS']),timeBudgetMinutes:input.timeBudgetMinutes,productMode:input.productMode})}
