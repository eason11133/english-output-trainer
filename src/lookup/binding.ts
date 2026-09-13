import type { LearningContentRequestV1 } from '../content/learnerContent';
import type { LookupAssessmentModeV1, LookupRequestV1 } from './types';

export interface LookupTapV1{text:string;start:number;end:number;surroundingText:string;origin:'SYSTEM_SOURCE'|'LEARNER_EDITABLE'}
export function lookupRequestsFromTapV1(tap:LookupTapV1,assessmentMode:LookupAssessmentModeV1,activeTargetRefs:readonly string[]):{lookup:LookupRequestV1;content:LearningContentRequestV1}|undefined{
  if(tap.origin==='LEARNER_EDITABLE')return undefined;
  return{lookup:{text:tap.surroundingText,selectionStart:tap.start,selectionEnd:tap.end,contextText:tap.surroundingText,assessmentMode,activeTargetRefs},content:{purpose:'CONTEXTUAL_LOOKUP',arena:'WRITING',sourceContext:tap.surroundingText,targetSpan:{text:tap.text,start:tap.start,end:tap.end,origin:tap.origin},lemma:tap.text.toLocaleLowerCase('en'),needs:['SENSE','EXAMPLE','RELATION','SENTENCE_PAIR'],maxItems:5,excludeContentIds:[]}};
}
