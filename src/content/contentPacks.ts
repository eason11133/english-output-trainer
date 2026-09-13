import type { CapabilityFacet } from '../domain/english/EnglishDomain';

export interface CuratedWritingTaskTemplateV1{
  id:string;
  targetRefs:readonly string[];
  facets:readonly CapabilityFacet[];
  contextKey:string;
  promptText:string;
  semanticRequirements:readonly string[];
  responseScope:'SENTENCE'|'PARAGRAPH'|'SHORT_TEXT';
  load:{length:'LOW'|'MEDIUM'|'HIGH';reasoning:'LOW'|'MEDIUM'|'HIGH';ideaGeneration:'LOW'|'MEDIUM'|'HIGH';contentSupport:'NONE'|'LIGHT'|'STRONG';clauses:number};
  reviewedAt:string;
  provenanceRef:string;
}
const t=(value:CuratedWritingTaskTemplateV1)=>Object.freeze(value);
export const writingFreshTaskPackV1:readonly CuratedWritingTaskTemplateV1[]=Object.freeze([
  t({id:'allow-library',targetRefs:['allow-object-infinitive'],facets:['CONSTRUCTION','CONTROLLED_PRODUCTION','FREE_PRODUCTION'],contextKey:'PUBLIC_LIBRARY',promptText:'Write one complete English sentence about a library rule that gives a specific group of people permission to do an action.',semanticRequirements:['permission','specific actor','action'],responseScope:'SENTENCE',load:{length:'LOW',reasoning:'LOW',ideaGeneration:'LOW',contentSupport:'LIGHT',clauses:1},reviewedAt:'2026-08-28',provenanceRef:'G:curated-writing-pack-v1'}),
  t({id:'allow-workplace',targetRefs:['allow-object-infinitive'],facets:['CONSTRUCTION','CONTROLLED_PRODUCTION','FREE_PRODUCTION'],contextKey:'WORKPLACE',promptText:'Write one complete English sentence about a workplace policy that gives a specific group permission to do something.',semanticRequirements:['permission','specific actor','action'],responseScope:'SENTENCE',load:{length:'LOW',reasoning:'LOW',ideaGeneration:'LOW',contentSupport:'LIGHT',clauses:1},reviewedAt:'2026-08-28',provenanceRef:'G:curated-writing-pack-v1'}),
  t({id:'allow-sports-club',targetRefs:['allow-object-infinitive'],facets:['CONSTRUCTION','CONTROLLED_PRODUCTION','FREE_PRODUCTION'],contextKey:'SPORTS_CLUB',promptText:'Write one complete English sentence about a sports-club rule that gives members permission to do an action.',semanticRequirements:['permission','specific actor','action'],responseScope:'SENTENCE',load:{length:'LOW',reasoning:'LOW',ideaGeneration:'LOW',contentSupport:'LIGHT',clauses:1},reviewedAt:'2026-08-28',provenanceRef:'G:curated-writing-pack-v1'}),
  t({id:'sentence-reading',targetRefs:['writing.sentence-realization'],facets:['CONSTRUCTION','FREE_PRODUCTION'],contextKey:'READING_HABIT',promptText:'Write one complete English sentence stating one benefit of reading every day.',semanticRequirements:['one benefit','complete proposition'],responseScope:'SENTENCE',load:{length:'LOW',reasoning:'LOW',ideaGeneration:'LOW',contentSupport:'NONE',clauses:1},reviewedAt:'2026-08-28',provenanceRef:'G:curated-writing-pack-v1'}),
  t({id:'sentence-public-space',targetRefs:['writing.sentence-realization'],facets:['CONSTRUCTION','FREE_PRODUCTION'],contextKey:'PUBLIC_SPACE',promptText:'Write one complete English sentence stating one rule a public place should follow.',semanticRequirements:['one rule','complete proposition'],responseScope:'SENTENCE',load:{length:'LOW',reasoning:'LOW',ideaGeneration:'LOW',contentSupport:'NONE',clauses:1},reviewedAt:'2026-08-28',provenanceRef:'G:curated-writing-pack-v1'}),
  t({id:'sentence-study',targetRefs:['writing.sentence-realization'],facets:['CONSTRUCTION','FREE_PRODUCTION'],contextKey:'STUDY_HABIT',promptText:'Write one complete English sentence explaining one study habit that helps students learn.',semanticRequirements:['one study habit','one benefit relation'],responseScope:'SENTENCE',load:{length:'MEDIUM',reasoning:'LOW',ideaGeneration:'LOW',contentSupport:'NONE',clauses:1},reviewedAt:'2026-08-28',provenanceRef:'G:curated-writing-pack-v1'}),
]);

export interface CuratedTranslationTaskTemplateV1{
  id:string;targetRefs:readonly string[];facets:readonly CapabilityFacet[];contextKey:string;sourceText:string;semanticRequirements:readonly string[];load:{length:'LOW'|'MEDIUM'|'HIGH';reasoning:'LOW'|'MEDIUM'|'HIGH';ideaGeneration:'LOW'|'MEDIUM'|'HIGH';contentSupport:'NONE'|'LIGHT'|'STRONG';clauses:number};reviewedAt:string;provenanceRef:string;
}
const tt=(value:CuratedTranslationTaskTemplateV1)=>Object.freeze(value);
export const translationFreshTaskPackV1:readonly CuratedTranslationTaskTemplateV1[]=Object.freeze([
  tt({id:'allow-library-zh',targetRefs:['allow-object-infinitive'],facets:['CONSTRUCTION','CONTROLLED_PRODUCTION','FREE_PRODUCTION'],contextKey:'PUBLIC_LIBRARY',sourceText:'圖書館應該允許訪客使用電腦。',semanticRequirements:['permission','specific actor','action'],load:{length:'LOW',reasoning:'LOW',ideaGeneration:'LOW',contentSupport:'NONE',clauses:1},reviewedAt:'2026-08-28',provenanceRef:'G:curated-translation-pack-v1'}),
  tt({id:'allow-workplace-zh',targetRefs:['allow-object-infinitive'],facets:['CONSTRUCTION','CONTROLLED_PRODUCTION','FREE_PRODUCTION'],contextKey:'WORKPLACE',sourceText:'公司應該允許員工在休息時間使用手機。',semanticRequirements:['permission','specific actor','action'],load:{length:'LOW',reasoning:'LOW',ideaGeneration:'LOW',contentSupport:'NONE',clauses:1},reviewedAt:'2026-08-28',provenanceRef:'G:curated-translation-pack-v1'}),
  tt({id:'allow-club-zh',targetRefs:['allow-object-infinitive'],facets:['CONSTRUCTION','CONTROLLED_PRODUCTION','FREE_PRODUCTION'],contextKey:'SCHOOL_CLUB',sourceText:'學校應該允許學生參加自己有興趣的社團。',semanticRequirements:['permission','specific actor','action'],load:{length:'LOW',reasoning:'LOW',ideaGeneration:'LOW',contentSupport:'NONE',clauses:1},reviewedAt:'2026-08-28',provenanceRef:'G:curated-translation-pack-v1'}),
]);
