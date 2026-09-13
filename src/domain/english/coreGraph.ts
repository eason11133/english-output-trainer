import { createEnglishDomainGraphV2, createEnglishDomainPortV2, EnglishDomainEdgeV2, EnglishDomainNodeV2, EnglishDomainProvenanceV2 } from './EnglishDomainGraph';

const provenance=(sourceId:string):EnglishDomainProvenanceV2=>({sourceKind:'CURATED_SYSTEM',sourceId,version:'2026-08-26',validated:true,reviewedAt:'2026-08-26'});
const p=provenance('eot-core-domain-wave-b');
const node=(value:Omit<EnglishDomainNodeV2,'aliases'|'registerConstraints'|'genreConstraints'|'writingRelevance'|'translationRelevance'|'readingRelevance'|'provenance'> & Partial<Pick<EnglishDomainNodeV2,'aliases'|'registerConstraints'|'genreConstraints'|'writingRelevance'|'translationRelevance'|'readingRelevance'>>):EnglishDomainNodeV2=>({
  aliases:[],registerConstraints:[],genreConstraints:[],writingRelevance:'MEDIUM',translationRelevance:'MEDIUM',readingRelevance:'MEDIUM',provenance:p,...value,
});
const edge=(id:string,fromId:string,toId:string,relation:EnglishDomainEdgeV2['relation']):EnglishDomainEdgeV2=>({id,fromId,toId,relation,provenance:p,confidence:'HIGH'});

const nodes:EnglishDomainNodeV2[]=[
  node({id:'lexical.contextual-fit',kind:'COLLOCATION',area:'LEXICAL',label:'select a lexically and collocationally appropriate form from context',aliases:['contextual lexical fit'],facets:['SELECTION','CONTEXTUAL_APPROPRIACY','COLLOCATION'],writingRelevance:'HIGH',translationRelevance:'HIGH',readingRelevance:'HIGH'}),
  node({id:'word.allow',kind:'LEXEME',area:'LEXICAL',label:'allow',aliases:['allow'],facets:['FORM_RECOGNITION','FORM_TO_MEANING','MEANING_TO_RETRIEVAL','ORTHOGRAPHIC_PRODUCTION','LEXICAL_SYNTACTIC_BEHAVIOR'],writingRelevance:'HIGH',translationRelevance:'HIGH',contentBindings:[{kind:'LEXEME_IDENTITY',lemma:'allow'}]}),
  node({id:'sense.allow.permission',kind:'SENSE',area:'LEXICAL',label:'allow = permit',aliases:['allow:permit'],facets:['FORM_TO_MEANING','SENSE_DISCRIMINATION','MEANING_TO_RETRIEVAL','CONTEXTUAL_APPROPRIACY'],writingRelevance:'HIGH',translationRelevance:'HIGH',contentBindings:[{kind:'SENSE_IDENTITY',lemma:'allow',sourceId:'oewn-2025',sourceRecordId:'oewn:allow%2:32:00::'}]}),
  node({id:'form.allow.base',kind:'WORD_FORM',area:'LEXICAL',label:'allow',aliases:['allow/base'],facets:['FORM_RECOGNITION','ORTHOGRAPHIC_PRODUCTION','MORPHOLOGY'],contentBindings:[{kind:'WORD_FORM_IDENTITY',lemma:'allow',form:'allow',requiredFeatures:['V']}]}),
  node({id:'form.allows.3sg',kind:'WORD_FORM',area:'LEXICAL',label:'allows',aliases:['allows'],facets:['FORM_RECOGNITION','ORTHOGRAPHIC_PRODUCTION','MORPHOLOGY'],contentBindings:[{kind:'WORD_FORM_IDENTITY',lemma:'allow',form:'allows',requiredFeatures:['V','PRS','3','SG']}]}),
  node({id:'form.allowed.past-participle',kind:'WORD_FORM',area:'LEXICAL',label:'allowed',aliases:['allowed'],facets:['FORM_RECOGNITION','ORTHOGRAPHIC_PRODUCTION','MORPHOLOGY'],contentBindings:[{kind:'WORD_FORM_IDENTITY',lemma:'allow',form:'allowed',requiredFeatures:['V','V.PTCP','PST']}]}),
  node({id:'morph.regular-verb-ed-s',kind:'MORPHOLOGICAL_PATTERN',area:'LEXICAL',label:'regular verb inflection',facets:['MORPHOLOGY','ORTHOGRAPHIC_PRODUCTION'],contentBindings:[{kind:'MORPHOLOGY_PATTERN',pattern:'REGULAR_VERB_ED_S',probeLemma:'walk'}]}),
  node({id:'meaning.permission-agent-action',kind:'MEANING_INTENT',area:'MEANING_ENCODING',label:'permission for an actor to perform an action',facets:['FORM_MEANING_MAPPING','SELECTION','CONSTRUCTION','FREE_PRODUCTION'],writingRelevance:'HIGH',translationRelevance:'HIGH'}),
  node({id:'allow-object-infinitive',kind:'GRAMMAR_CONSTRUCTION',area:'GRAMMAR',label:'allow + object + to-infinitive',aliases:['allow O to V','allow + object + to V'],facets:['FORM_MEANING_MAPPING','SELECTION','CONSTRUCTION','CONTROLLED_PRODUCTION','FREE_PRODUCTION','CONTEXTUAL_APPROPRIACY'],writingRelevance:'HIGH',translationRelevance:'HIGH'}),
  node({id:'phrase-frame.allow-someone-to',kind:'PHRASE_FRAME',area:'FORMULAIC',label:'allow someone to …',aliases:['allow someone to'],facets:['FORM_MEANING_MAPPING','MEANING_TO_RETRIEVAL','CONSTRUCTION','CONTROLLED_PRODUCTION','FREE_PRODUCTION'],writingRelevance:'HIGH',translationRelevance:'HIGH'}),

  node({id:'writing.purpose-audience',kind:'WRITING_CAPABILITY',area:'WRITING',label:'control purpose and audience',facets:['SELECTION','CONTEXTUAL_APPROPRIACY','FREE_PRODUCTION'],writingRelevance:'HIGH',translationRelevance:'LOW',readingRelevance:'LOW'}),
  node({id:'writing.idea-reasoning',kind:'WRITING_CAPABILITY',area:'WRITING',label:'develop relevant ideas and reasoning',facets:['CONSTRUCTION','FREE_PRODUCTION'],writingRelevance:'HIGH',translationRelevance:'LOW',readingRelevance:'LOW'}),
  node({id:'writing.organization-cohesion',kind:'WRITING_CAPABILITY',area:'WRITING',label:'organize and connect ideas',facets:['SELECTION','CONSTRUCTION','FREE_PRODUCTION'],writingRelevance:'HIGH',translationRelevance:'LOW'}),
  node({id:'writing.sentence-realization',kind:'WRITING_CAPABILITY',area:'WRITING',label:'realize intended meaning as English sentences',facets:['FORM_MEANING_MAPPING','SELECTION','CONSTRUCTION','FREE_PRODUCTION'],writingRelevance:'HIGH',translationRelevance:'MEDIUM'}),
  node({id:'writing.revision',kind:'WRITING_CAPABILITY',area:'WRITING',label:'revise learner-owned writing',facets:['SENSE_DISCRIMINATION','SELECTION','CONSTRUCTION','CONTEXTUAL_APPROPRIACY','FREE_PRODUCTION'],writingRelevance:'HIGH',translationRelevance:'LOW'}),

  node({id:'translation.source-meaning',kind:'TRANSLATION_CAPABILITY',area:'TRANSLATION',label:'preserve source meaning',facets:['FORM_TO_MEANING','SENSE_DISCRIMINATION','SELECTION'],writingRelevance:'MEDIUM',translationRelevance:'HIGH',readingRelevance:'HIGH'}),
  node({id:'translation.meaning-segmentation',kind:'TRANSLATION_CAPABILITY',area:'TRANSLATION',label:'segment source meaning into realizable units',facets:['FORM_TO_MEANING','SELECTION','CONSTRUCTION'],translationRelevance:'HIGH',readingRelevance:'HIGH'}),
  node({id:'translation.meaning-to-english',kind:'TRANSLATION_CAPABILITY',area:'TRANSLATION',label:'encode source meaning into English',facets:['MEANING_TO_RETRIEVAL','FORM_MEANING_MAPPING','SELECTION','CONSTRUCTION','FREE_PRODUCTION'],writingRelevance:'HIGH',translationRelevance:'HIGH'}),
  node({id:'translation.naturalness-precision',kind:'TRANSLATION_CAPABILITY',area:'TRANSLATION',label:'choose precise and natural English realization',facets:['SENSE_DISCRIMINATION','COLLOCATION','LEXICAL_SYNTACTIC_BEHAVIOR','SELECTION','CONTEXTUAL_APPROPRIACY'],writingRelevance:'HIGH',translationRelevance:'HIGH'}),

  node({id:'reading.meaning-decomposition',kind:'READING_CAPABILITY',area:'READING',label:'decompose sentence and passage meaning',facets:['FORM_TO_MEANING','SENSE_DISCRIMINATION','FORM_MEANING_MAPPING','SELECTION'],writingRelevance:'LOW',translationRelevance:'MEDIUM',readingRelevance:'HIGH'}),
  node({id:'reading.reference-tracking',kind:'READING_CAPABILITY',area:'READING',label:'track references across text',facets:['FORM_TO_MEANING','SELECTION'],writingRelevance:'MEDIUM',translationRelevance:'MEDIUM',readingRelevance:'HIGH'}),
  node({id:'reading.logic-structure',kind:'READING_CAPABILITY',area:'READING',label:'track discourse logic and structure',facets:['FORM_TO_MEANING','SELECTION','CONSTRUCTION'],writingRelevance:'HIGH',translationRelevance:'MEDIUM',readingRelevance:'HIGH'}),
  node({id:'reading.inference',kind:'READING_CAPABILITY',area:'READING',label:'make evidence-grounded inferences',facets:['FORM_TO_MEANING','SENSE_DISCRIMINATION','SELECTION'],writingRelevance:'MEDIUM',translationRelevance:'MEDIUM',readingRelevance:'HIGH'}),
];

const edges:EnglishDomainEdgeV2[]=[
  edge('allow-has-sense','word.allow','sense.allow.permission','HAS_SENSE'),
  edge('allow-has-base','word.allow','form.allow.base','HAS_FORM'),
  edge('allow-has-3sg','word.allow','form.allows.3sg','HAS_FORM'),
  edge('allow-has-past','word.allow','form.allowed.past-participle','HAS_FORM'),
  edge('allow-base-morph','form.allow.base','morph.regular-verb-ed-s','USES_MORPHOLOGY'),
  edge('allows-morph','form.allows.3sg','morph.regular-verb-ed-s','USES_MORPHOLOGY'),
  edge('allowed-morph','form.allowed.past-participle','morph.regular-verb-ed-s','USES_MORPHOLOGY'),
  edge('allow-sense-realizes-permission','sense.allow.permission','meaning.permission-agent-action','REALIZES_MEANING'),
  edge('allow-construction-realizes-permission','allow-object-infinitive','meaning.permission-agent-action','REALIZES_MEANING'),
  edge('allow-frame-realizes-permission','phrase-frame.allow-someone-to','meaning.permission-agent-action','REALIZES_MEANING'),
  edge('allow-frame-alt-construction','phrase-frame.allow-someone-to','allow-object-infinitive','ALTERNATIVE_REALIZATION'),
  edge('allow-sense-prereq-construction','sense.allow.permission','allow-object-infinitive','PREREQUISITE_FOR'),
  edge('allow-construction-enables-writing-realization','allow-object-infinitive','writing.sentence-realization','ENABLES'),
  edge('allow-construction-enables-translation-realization','allow-object-infinitive','translation.meaning-to-english','ENABLES'),
  edge('read-meaning-enables-translation-source','reading.meaning-decomposition','translation.source-meaning','ENABLES'),
  edge('translation-source-prereq-segmentation','translation.source-meaning','translation.meaning-segmentation','PREREQUISITE_FOR'),
  edge('translation-segmentation-prereq-encoding','translation.meaning-segmentation','translation.meaning-to-english','PREREQUISITE_FOR'),
  edge('translation-encoding-prereq-naturalness','translation.meaning-to-english','translation.naturalness-precision','PREREQUISITE_FOR'),
  edge('writing-purpose-prereq-organization','writing.purpose-audience','writing.organization-cohesion','PREREQUISITE_FOR'),
  edge('writing-ideas-prereq-organization','writing.idea-reasoning','writing.organization-cohesion','PREREQUISITE_FOR'),
  edge('writing-sentence-prereq-revision','writing.sentence-realization','writing.revision','PREREQUISITE_FOR'),
  edge('reading-reference-enables-logic','reading.reference-tracking','reading.logic-structure','ENABLES'),
  edge('reading-decomposition-prereq-inference','reading.meaning-decomposition','reading.inference','PREREQUISITE_FOR'),
];

export const coreEnglishDomainGraphV2=createEnglishDomainGraphV2({version:'2.0.0-wave-b',nodes,edges});
export const coreEnglishDomainPortV2=createEnglishDomainPortV2(coreEnglishDomainGraphV2);
