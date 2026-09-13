import type { WritingDimensionV1 } from './types';

export const writingCapabilityIdsV1=[
  'H.purpose-audience-genre','H.idea-generation','H.reasoning-depth','H.planning','H.organization','H.cohesion','H.sentence-realization','H.meaning-encoding','H.feedback-budget','H.local-repair','H.joint-construction','H.revision','H.return-original','H.fresh-writing-transfer','H.writing-evaluation'
] as const;
export type WritingCapabilityIdV1=typeof writingCapabilityIdsV1[number];
export interface WritingCapabilityPolicyV1{capabilityId:WritingCapabilityIdV1;dimensions:readonly WritingDimensionV1[];learnerActions:readonly string[];evidenceAuthority:'C/K';teacherAuthority:'E/F';notes:readonly string[]}
const policy=(capabilityId:WritingCapabilityIdV1,dimensions:readonly WritingDimensionV1[],learnerActions:readonly string[],notes:readonly string[]=[]):WritingCapabilityPolicyV1=>Object.freeze({capabilityId,dimensions:Object.freeze([...dimensions]),learnerActions:Object.freeze([...learnerActions]),evidenceAuthority:'C/K',teacherAuthority:'E/F',notes:Object.freeze([...notes])});
export const writingCapabilityPoliciesV1:readonly WritingCapabilityPolicyV1[]=Object.freeze([
  policy('H.purpose-audience-genre',['TASK_FULFILLMENT','PURPOSE_AUDIENCE_GENRE'],['CONFIRM_TASK','CORRECT_INTERPRETATION'],['prompt interpretation remains a hypothesis until grounded']),
  policy('H.idea-generation',['IDEA_AVAILABILITY'],['ADD_IDEA','SELECT_IDEA'],['teacher-supplied semantic content cannot become learner-originated evidence']),
  policy('H.reasoning-depth',['REASONING_DEPTH'],['ADD_REASON','ADD_EXAMPLE','ELABORATE']),
  policy('H.planning',['PLANNING'],['GROUP_IDEAS','ORDER_IDEAS','PLAN_PARAGRAPHS'],['planning assistance contaminates later independence until support fades']),
  policy('H.organization',['ORGANIZATION','COHERENCE'],['MOVE_SPAN','ORDER_PARAGRAPHS','REWRITE_TRANSITION']),
  policy('H.cohesion',['COHESION','REFERENCE'],['CONNECT_IDEAS','REPAIR_REFERENCE','REWRITE_SPAN']),
  policy('H.sentence-realization',['SENTENCE_REALIZATION','GRAMMAR_CONSTRUCTION'],['CONSTRUCT','REWRITE_SPAN','PRODUCE'],['multiple valid realizations must remain valid']),
  policy('H.meaning-encoding',['MEANING_ENCODING','LEXICAL_SELECTION','COLLOCATION'],['RETRIEVE','SELECT','PRODUCE'],['learner meaning and Teacher hypothesis stay distinct']),
  policy('H.feedback-budget',['TASK_FULFILLMENT','ORGANIZATION','SENTENCE_REALIZATION','MECHANICS'],['FOCUS_ONE'],['H ranks candidates; D still owns authorized target']),
  policy('H.local-repair',['SENTENCE_REALIZATION','MEANING_ENCODING','MECHANICS'],['REWRITE_SPAN','CONSTRUCT'],['no automatic source replacement']),
  policy('H.joint-construction',['SENTENCE_REALIZATION','MEANING_ENCODING'],['SELECT','COMPLETE','CONSTRUCT'],['joint text remains assisted']),
  policy('H.revision',['MONITORING_SELF_REPAIR'],['REWRITE_SPAN','MOVE_SPAN','ADD_IDEA'],['original revision immutable; actor provenance required']),
  policy('H.return-original',['MONITORING_SELF_REPAIR'],['INTEGRATE_REPAIR','RETURN_TO_SOURCE'],['same-session reintegration is not transfer']),
  policy('H.fresh-writing-transfer',['TASK_FULFILLMENT','SENTENCE_REALIZATION','ORGANIZATION'],['PRODUCE_FRESH'],['G generates; K decides what fresh performance can prove']),
  policy('H.writing-evaluation',['TASK_FULFILLMENT','REASONING_DEPTH','ORGANIZATION','COHERENCE','COHESION','SENTENCE_REALIZATION','MECHANICS'],['OBSERVE_ONLY'],['H emits analytic observations; no canonical mastery or official exam score'])
]);
export function validateWritingCapabilityCoverageV1(){const ids=new Set(writingCapabilityPoliciesV1.map(item=>item.capabilityId));return writingCapabilityIdsV1.filter(id=>!ids.has(id));}
