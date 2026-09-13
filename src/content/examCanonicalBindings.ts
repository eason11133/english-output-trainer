import type{CapabilityFacet}from'../domain/english/EnglishDomain';
import{coreEnglishDomainPortV2}from'../domain/english';
import v35Bank from './examV35PromotedBank.json';
export interface ExamBindingUnitV1{unitId:string;responseKey:string;canonicalTargetRef:string;canonicalFacet:CapabilityFacet;senseId?:string;evaluatorKind:'EXACT_KEY'|'SEMANTIC_RUBRIC';status:'BOUND';validatorRefs:readonly string[]}
export interface ExamTaskCanonicalBindingV1{taskId:string;family:string;bindingMode:'PER_BLANK'|'PER_BLANK_SHARED_BANK'|'PER_QUESTION'|'PER_PART'|'PER_SENTENCE'|'ONE_RESPONSE_MULTI_SCOPED_OBSERVATIONS';units:readonly ExamBindingUnitV1[]}
const gates=Object.freeze(['G1_TARGET_IDENTITY','G2_NO_HIDDEN_TARGET','G3_VALID_ANSWER_RUBRIC','G4_DISTRACTOR_CAUSALITY','G5_FRESHNESS_CLASSIFIED','G6_SUPPORT_FIREWALL','G7_DIFFICULTY_ANCHORED','G8_CURRENT_FORMAT','G9_PROVENANCE_LICENSE','G10_PREUSE_VALIDATION']);
const unit=(taskId:string,suffix:string,responseKey:string,target:string,facet:CapabilityFacet,evaluatorKind:ExamBindingUnitV1['evaluatorKind']='EXACT_KEY'):ExamBindingUnitV1=>{if(coreEnglishDomainPortV2.resolveId(target)!==target||!coreEnglishDomainPortV2.supportsFacet(target,facet))throw new Error(`invalid_exam_binding:${taskId}:${responseKey}`);return Object.freeze({unitId:`${taskId}:${suffix}`,responseKey,canonicalTargetRef:target,canonicalFacet:facet,evaluatorKind,status:'BOUND',validatorRefs:gates})};
const vocabulary=(taskId:string,target:string,facet:CapabilityFacet,senseId?:string):ExamTaskCanonicalBindingV1=>({taskId,family:'VOCABULARY',bindingMode:'PER_QUESTION',units:[Object.freeze({...unit(taskId,'Q1','Q1',target,facet),senseId})]});
const lexicalFive=(taskId:string):ExamTaskCanonicalBindingV1=>({taskId,family:'COMPREHENSIVE',bindingMode:'PER_BLANK',units:['1','2','3','4','5'].map(k=>unit(taskId,`blank:${k}`,k,'lexical.contextual-fit','CONTEXTUAL_APPROPRIACY'))});
const lexicalTen=(taskId:string):ExamTaskCanonicalBindingV1=>({taskId,family:'CONTEXTUAL_FILL',bindingMode:'PER_BLANK_SHARED_BANK',units:Array.from({length:10},(_,i)=>String(i+1)).map(k=>unit(taskId,`blank:${k}`,k,'lexical.contextual-fit','CONTEXTUAL_APPROPRIACY'))});
const discourseFour=(taskId:string):ExamTaskCanonicalBindingV1=>({taskId,family:'DISCOURSE',bindingMode:'PER_BLANK',units:['1','2','3','4'].map(k=>unit(taskId,`blank:${k}`,k,'reading.logic-structure','SELECTION'))});
const readingThree=(taskId:string,operations:readonly('MAIN_IDEA'|'DETAIL'|'INFERENCE'|'CONTEXTUAL_MEANING')[]):ExamTaskCanonicalBindingV1=>({taskId,family:'READING',bindingMode:'PER_QUESTION',units:operations.map((op,i)=>{const key=`Q${i+1}`;if(op==='INFERENCE')return unit(taskId,key,key,'reading.inference','SELECTION');if(op==='CONTEXTUAL_MEANING')return unit(taskId,key,key,'reading.meaning-decomposition','SENSE_DISCRIMINATION');if(op==='DETAIL')return unit(taskId,key,key,'reading.meaning-decomposition','SELECTION');return unit(taskId,key,key,'reading.logic-structure','SELECTION')})});
const mixedThree=(taskId:string):ExamTaskCanonicalBindingV1=>({taskId,family:'MIXED',bindingMode:'PER_PART',units:[unit(taskId,'P1','P1','reading.logic-structure','SELECTION'),unit(taskId,'P2','P2','reading.meaning-decomposition','FORM_TO_MEANING'),unit(taskId,'P3','P3','reading.meaning-decomposition','FORM_TO_MEANING','SEMANTIC_RUBRIC')]});
const translationOne=(taskId:string):ExamTaskCanonicalBindingV1=>({taskId,family:'TRANSLATION',bindingMode:'PER_SENTENCE',units:[unit(taskId,'sentence:1','0','translation.meaning-to-english','CONSTRUCTION','SEMANTIC_RUBRIC')]});
const writingBinding=(taskId:string,paragraph=false):ExamTaskCanonicalBindingV1=>({taskId,family:'WRITING',bindingMode:'ONE_RESPONSE_MULTI_SCOPED_OBSERVATIONS',units:[unit(taskId,'scope:1','writing','writing.purpose-audience','CONTEXTUAL_APPROPRIACY','SEMANTIC_RUBRIC'),unit(taskId,'scope:2','writing','writing.idea-reasoning','FREE_PRODUCTION','SEMANTIC_RUBRIC'),...(paragraph?[unit(taskId,'scope:3','writing','writing.organization-cohesion','FREE_PRODUCTION','SEMANTIC_RUBRIC')]:[]),unit(taskId,paragraph?'scope:4':'scope:3','writing','writing.sentence-realization','CONSTRUCTION','SEMANTIC_RUBRIC')]});
export function canonicalExamBindingV1(taskId:string):ExamTaskCanonicalBindingV1|undefined{
 const generated=(v35Bank.tasks as unknown as {task_id:string;canonicalBinding:ExamTaskCanonicalBindingV1}[]).find(task=>task.task_id===taskId)?.canonicalBinding;
 if(generated)return generated;
 if(taskId==='VOC-G-001')return vocabulary(taskId,'sense.allow.permission','SENSE_DISCRIMINATION','oewn:allow%2:32:00::');
 if(taskId==='VOC-G-002')return vocabulary(taskId,'lexical.contextual-fit','COLLOCATION');
 if(taskId==='VOC-G-003')return vocabulary(taskId,'form.allows.3sg','MORPHOLOGY');
 if(taskId==='COMP-001'||['COMP-G-004','COMP-G-007','COMP-G-008'].includes(taskId))return lexicalFive(taskId);
 if(taskId==='CF-001'||['CF-G-001','CF-G-002','CF-G-004'].includes(taskId))return lexicalTen(taskId);
 if(taskId==='DISC-001'||['DISC-G-001','DISC-G-003','DISC-G-004'].includes(taskId))return discourseFour(taskId);
 if(taskId==='READ-001')return readingThree(taskId,['MAIN_IDEA','DETAIL','INFERENCE']);
 if(taskId==='READ-G-001'||taskId==='READ-G-007')return readingThree(taskId,['MAIN_IDEA','DETAIL','INFERENCE']);
 if(taskId==='READ-G-004')return readingThree(taskId,['CONTEXTUAL_MEANING','INFERENCE','MAIN_IDEA']);
 if(taskId==='MIX-001'||['MIX-G-001','MIX-G-002','MIX-G-004'].includes(taskId))return mixedThree(taskId);
 if(taskId==='TRANS-T-001'||['TRANS-G-T02','TRANS-G-T05','TRANS-G-T17'].includes(taskId))return translationOne(taskId);
 if(taskId==='TRANS-F-001')return{taskId,family:'TRANSLATION',bindingMode:'PER_SENTENCE',units:[unit(taskId,'sentence:1','0','translation.meaning-to-english','CONSTRUCTION','SEMANTIC_RUBRIC'),unit(taskId,'sentence:2','1','translation.meaning-to-english','CONSTRUCTION','SEMANTIC_RUBRIC')]};
 if(taskId==='TRANS-G-F02')return{taskId,family:'TRANSLATION',bindingMode:'PER_SENTENCE',units:[unit(taskId,'sentence:1','0','translation.meaning-to-english','CONSTRUCTION','SEMANTIC_RUBRIC'),unit(taskId,'sentence:2','1','translation.meaning-to-english','CONSTRUCTION','SEMANTIC_RUBRIC')]};
 if(taskId==='WRITE-M-001'||['WRITE-G-M06','WRITE-G-M09'].includes(taskId))return writingBinding(taskId,false);
 if(taskId==='WRITE-P-001'||taskId==='WRITE-F-001'||taskId==='WRITE-G-P01')return writingBinding(taskId,true);
 return undefined;
}
export const canonicalExamValidatorRefsV1=gates;
