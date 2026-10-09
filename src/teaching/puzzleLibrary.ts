import type { TeachingPuzzleDefinitionV1 } from './puzzleContract';
import { validateTeachingPuzzleDefinitionV1 } from './puzzleContract';

const p=(value:TeachingPuzzleDefinitionV1)=>{
  const checked=validateTeachingPuzzleDefinitionV1(value);
  if(!checked.valid)throw new Error(`invalid_teaching_puzzle_library_entry:${value.id}:${checked.reasons.join(',')}`);
  return Object.freeze({
    ...value,
    mechanismIds:Object.freeze([...value.mechanismIds]),
    contentSlots:Object.freeze(value.contentSlots.map(slot=>Object.freeze({...slot}))),
    allowedSupport:Object.freeze([...value.allowedSupport]),
    contraindications:Object.freeze([...value.contraindications]),
    interaction:Object.freeze({...value.interaction,optional:Object.freeze([...value.interaction.optional])}),
    representation:Object.freeze({...value.representation}),
    observation:Object.freeze({
      ...value.observation,
      responseSignals:Object.freeze([...value.observation.responseSignals]),
      observationKinds:Object.freeze([...value.observation.observationKinds]),
    }),
    scope:Object.freeze({
      areas:Object.freeze([...value.scope.areas]),
      kinds:Object.freeze([...value.scope.kinds]),
      facets:Object.freeze([...value.scope.facets]),
    }),
  });
};

export const teachingPuzzleLibraryV1:readonly TeachingPuzzleDefinitionV1[]=Object.freeze([
  p({
    schemaVersion:1,
    id:'contrast-boundary',
    label:'Contrast Boundary',
    intendedLearningChange:'learner distinguishes the meaning, function, or evidence feature that makes two plausible alternatives behave differently',
    mechanismIds:['form-contrast','l1-collision','alternative-translation-compare','distractor-evidence-contrast','claim-strength-contrast'],
    representation:{kind:'CONTRAST',anchor:'MIXED',spatialRelation:'SIDE_BY_SIDE',rationale:'the relevant distinction should stay simultaneously visible instead of being explained as two disconnected rules'},
    interaction:{primary:'COMPARE',optional:['SELECT','EXPLAIN'],learnerMustAct:true,producesStructuredObservation:true,rationale:'the learner must identify or use the discriminating feature rather than only read the answer'},
    contentSlots:[
      {key:'left',kind:'CONTRAST_ITEM',required:true,multiple:false},
      {key:'right',kind:'CONTRAST_ITEM',required:true,multiple:false},
      {key:'context',kind:'SOURCE_TEXT',required:false,multiple:false},
      {key:'criterion',kind:'INSTRUCTIONAL_CONTENT',required:false,multiple:false},
    ],
    allowedSupport:['EXPLICIT','GUIDED','CUED','LIGHT'],
    answerExposure:'BOUNDED',
    observation:{responseSignals:['HELPED','NO_PROGRESS','CONFUSED','SELF_REPAIRED','ASSISTED_SUCCESS'],evidenceCeiling:'EXPOSURE_ONLY',capabilityEvidenceMayBeWrittenDirectly:false,observationKinds:['COMPARISON','CHOICE','EXPLANATION']},
    scope:{areas:['GRAMMAR','MEANING_ENCODING','TRANSLATION','READING'],kinds:['GRAMMAR_CONSTRUCTION','MEANING_INTENT','TRANSLATION_CAPABILITY','READING_CAPABILITY'],facets:['FORM_MEANING_MAPPING','SELECTION','CONTEXTUAL_APPROPRIACY']},
    contraindications:['the learner has not established the underlying meaning yet','the comparison would expose an imminent independent-check answer','the two alternatives are both valid and no meaningful distinction is currently relevant'],
  }),

  p({
    schemaVersion:1,
    id:'relation-map',
    label:'Relation Map',
    intendedLearningChange:'learner sees and manipulates the relation among semantic roles, meaning units, references, or discourse units before choosing language',
    mechanismIds:['grammar-role-map','sentence-anatomy','meaning-segmentation','cohesion-relation-map','reference-chain'],
    representation:{kind:'RELATION_MAP',anchor:'MIXED',spatialRelation:'SPATIAL',rationale:'the relation itself is the learning object, so nodes and links must remain perceptually connected'},
    interaction:{primary:'MARK',optional:['MATCH','CONSTRUCT','EXPLAIN'],learnerMustAct:true,producesStructuredObservation:true,rationale:'the learner should map or reconstruct relations instead of receiving a completed diagram only'},
    contentSlots:[
      {key:'nodes',kind:'RELATION_NODE',required:true,multiple:true},
      {key:'edges',kind:'RELATION_EDGE',required:true,multiple:true},
      {key:'learnerOutput',kind:'LEARNER_OUTPUT',required:false,multiple:false,learnerAuthored:true},
      {key:'sourceText',kind:'SOURCE_TEXT',required:false,multiple:false},
    ],
    allowedSupport:['EXPLICIT','GUIDED','CUED','LIGHT'],
    answerExposure:'BOUNDED',
    observation:{responseSignals:['HELPED','NO_PROGRESS','CONFUSED','SELF_REPAIRED','ASSISTED_SUCCESS'],evidenceCeiling:'EXPOSURE_ONLY',capabilityEvidenceMayBeWrittenDirectly:false,observationKinds:['NODE_MARK','RELATION_LINK','RECONSTRUCTION']},
    scope:{areas:['GRAMMAR','WRITING','TRANSLATION','MEANING_ENCODING','DISCOURSE','READING'],kinds:['GRAMMAR_CONSTRUCTION','WRITING_CAPABILITY','TRANSLATION_CAPABILITY','MEANING_INTENT','DISCOURSE_MOVE','READING_CAPABILITY'],facets:['FORM_MEANING_MAPPING','CONSTRUCTION','CONTROLLED_PRODUCTION','FREE_PRODUCTION','SELECTION','FORM_TO_MEANING']},
    contraindications:['the relation is already independently controlled and only retrieval speed is weak','the Teacher would have to invent learner meaning to populate the map'],
  }),

  p({
    schemaVersion:1,
    id:'worked-transformation',
    label:'Worked Transformation',
    intendedLearningChange:'learner understands the operation that transforms current output into a viable form and can later reconstruct that operation with less support',
    mechanismIds:['worked-transformation'],
    representation:{kind:'WORKED_TRANSFORMATION',anchor:'LEARNER_OUTPUT',spatialRelation:'SEQUENCE',rationale:'the change must be inspectable as a sequence of operations anchored to the learner current form'},
    interaction:{primary:'CONSTRUCT',optional:['REPAIR','EXPLAIN'],learnerMustAct:true,producesStructuredObservation:true,rationale:'worked support must transition toward learner reconstruction rather than copying'},
    contentSlots:[
      {key:'learnerOutput',kind:'LEARNER_OUTPUT',required:true,multiple:false,learnerAuthored:true},
      {key:'steps',kind:'INSTRUCTIONAL_CONTENT',required:true,multiple:true},
      {key:'targetLanguage',kind:'TARGET_LANGUAGE',required:false,multiple:false},
    ],
    allowedSupport:['MODELED','EXPLICIT','GUIDED'],
    answerExposure:'DIRECT_MODEL',
    observation:{responseSignals:['HELPED','NO_PROGRESS','CONFUSED','SELF_REPAIRED','ASSISTED_SUCCESS'],evidenceCeiling:'EXPOSURE_ONLY',capabilityEvidenceMayBeWrittenDirectly:false,observationKinds:['STEP_RECONSTRUCTION','LOCAL_REPAIR','OPERATION_EXPLANATION']},
    scope:{areas:['GRAMMAR','WRITING','TRANSLATION','MEANING_ENCODING'],kinds:['GRAMMAR_CONSTRUCTION','WRITING_CAPABILITY','TRANSLATION_CAPABILITY','MEANING_INTENT'],facets:['FORM_MEANING_MAPPING','CONSTRUCTION','CONTROLLED_PRODUCTION','FREE_PRODUCTION']},
    contraindications:['strong independent history makes the model redundant','the model would contaminate an imminent fresh check','the Teacher cannot preserve learner-authored meaning through the transformation'],
  }),

  p({
    schemaVersion:1,
    id:'chunk-build',
    label:'Chunk Build',
    intendedLearningChange:'learner treats a useful multiword unit or collocational relation as a retrievable production resource rather than assembling every word independently',
    mechanismIds:['chunk-as-unit','collocation-network'],
    representation:{kind:'NETWORK',anchor:'MIXED',spatialRelation:'NETWORK',rationale:'the unit and its compatible partners should be visible as one structured resource rather than a flat word list'},
    interaction:{primary:'MATCH',optional:['RECALL','CONSTRUCT','SELECT'],learnerMustAct:true,producesStructuredObservation:true,rationale:'the learner should discriminate, retrieve, or rebuild the unit instead of only viewing it'},
    contentSlots:[
      {key:'targetLanguage',kind:'TARGET_LANGUAGE',required:true,multiple:false},
      {key:'partners',kind:'RELATION_NODE',required:true,multiple:true},
      {key:'examples',kind:'EXAMPLE',required:false,multiple:true},
      {key:'context',kind:'SOURCE_TEXT',required:false,multiple:false},
    ],
    allowedSupport:['EXPLICIT','GUIDED','CUED','LIGHT'],
    answerExposure:'BOUNDED',
    observation:{responseSignals:['HELPED','NO_PROGRESS','CONFUSED','ASSISTED_SUCCESS','SELF_REPAIRED'],evidenceCeiling:'EXPOSURE_ONLY',capabilityEvidenceMayBeWrittenDirectly:false,observationKinds:['MATCH','RECALL_ATTEMPT','CHUNK_CONSTRUCTION']},
    scope:{areas:['LEXICAL','FORMULAIC','WRITING','TRANSLATION'],kinds:['LEXEME','CHUNK','COLLOCATION','PHRASE_FRAME','WRITING_CAPABILITY','TRANSLATION_CAPABILITY'],facets:['MEANING_TO_RETRIEVAL','COLLOCATION','LEXICAL_SYNTACTIC_BEHAVIOR','CONTEXTUAL_APPROPRIACY','CONTROLLED_PRODUCTION','FREE_PRODUCTION']},
    contraindications:['the intended meaning itself is unresolved','the issue is unrelated to multiword retrieval or lexical partnership','the candidate sequence is not supported by validated content'],
  }),

  p({
    schemaVersion:1,
    id:'evidence-bridge',
    label:'Evidence Bridge',
    intendedLearningChange:'learner connects a claim, answer option, reference, or inference to the passage evidence that actually licenses it',
    mechanismIds:['inference-evidence-bridge','sentence-insertion-continuity','cross-representation-evidence-integration'],
    representation:{kind:'EVIDENCE_MAP',anchor:'SOURCE',spatialRelation:'SPATIAL',rationale:'the reasoning bridge must stay anchored to the source evidence instead of becoming an answer explanation detached from the passage'},
    interaction:{primary:'MARK',optional:['SELECT','EXPLAIN','MATCH'],learnerMustAct:true,producesStructuredObservation:true,rationale:'the learner should locate and connect evidence before the Teacher supplies an interpretation'},
    contentSlots:[
      {key:'sourceText',kind:'SOURCE_TEXT',required:true,multiple:false},
      {key:'prompt',kind:'PROMPT',required:true,multiple:false},
      {key:'evidenceSpans',kind:'EVIDENCE_SPAN',required:true,multiple:true},
      {key:'relations',kind:'RELATION_EDGE',required:false,multiple:true},
    ],
    allowedSupport:['EXPLICIT','GUIDED','CUED','LIGHT'],
    answerExposure:'BOUNDED',
    observation:{responseSignals:['HELPED','NO_PROGRESS','CONFUSED','SELF_REPAIRED','ASSISTED_SUCCESS'],evidenceCeiling:'EXPOSURE_ONLY',capabilityEvidenceMayBeWrittenDirectly:false,observationKinds:['EVIDENCE_MARK','BRIDGE_LINK','SOURCE_EXPLANATION']},
    scope:{areas:['READING','DISCOURSE'],kinds:['READING_CAPABILITY','DISCOURSE_MOVE'],facets:['SELECTION','FORM_TO_MEANING']},
    contraindications:['the necessary passage evidence is unavailable','the task failure is purely lexical decoding','the selected evidence itself would reveal the answer in an imminent fresh assessment'],
  }),

  p({
    schemaVersion:1,
    id:'reformulation-space',
    label:'Reformulation Space',
    intendedLearningChange:'learner preserves intended meaning while recognizing or producing more than one viable English realization and the boundary between them',
    mechanismIds:['reformulation-map','alternative-translation-compare','meaning-representation'],
    representation:{kind:'CONTRAST',anchor:'MIXED',spatialRelation:'SIDE_BY_SIDE',rationale:'multiple valid realizations must remain visible together so the learner does not infer that one reference wording is the only truth'},
    interaction:{primary:'COMPARE',optional:['SELECT','PRODUCE','EXPLAIN'],learnerMustAct:true,producesStructuredObservation:true,rationale:'the learner should preserve meaning while choosing or generating language, not copy a model sentence'},
    contentSlots:[
      {key:'meaning',kind:'MEANING_UNIT',required:true,multiple:false},
      {key:'learnerOutput',kind:'LEARNER_OUTPUT',required:false,multiple:false,learnerAuthored:true},
      {key:'alternatives',kind:'EXAMPLE',required:true,multiple:true},
      {key:'context',kind:'SOURCE_TEXT',required:false,multiple:false},
    ],
    allowedSupport:['EXPLICIT','GUIDED','CUED','LIGHT'],
    answerExposure:'BOUNDED',
    observation:{responseSignals:['HELPED','NO_PROGRESS','CONFUSED','SELF_REPAIRED','ASSISTED_SUCCESS'],evidenceCeiling:'EXPOSURE_ONLY',capabilityEvidenceMayBeWrittenDirectly:false,observationKinds:['MEANING_PRESERVATION','ALTERNATIVE_SELECTION','REFORMULATION_ATTEMPT']},
    scope:{areas:['WRITING','TRANSLATION','MEANING_ENCODING','LEXICAL'],kinds:['WRITING_CAPABILITY','TRANSLATION_CAPABILITY','MEANING_INTENT','SENSE','PHRASE_FRAME'],facets:['FORM_MEANING_MAPPING','SELECTION','CONTEXTUAL_APPROPRIACY','FREE_PRODUCTION','SENSE_DISCRIMINATION']},
    contraindications:['source or learner meaning is unresolved','one supplied realization would be presented as the only correct answer','the learner already produced an adequate realization and no useful distinction remains'],
  }),
]);

export function teachingPuzzleDefinitionV1(id:string){return teachingPuzzleLibraryV1.find(item=>item.id===id)}

export function validateTeachingPuzzleLibraryV1(){
  const reasons:string[]=[];
  const ids=teachingPuzzleLibraryV1.map(item=>item.id);
  if(new Set(ids).size!==ids.length)reasons.push('duplicate_puzzle_id');
  for(const item of teachingPuzzleLibraryV1){
    const checked=validateTeachingPuzzleDefinitionV1(item);
    if(!checked.valid)reasons.push(...checked.reasons.map(reason=>`${item.id}:${reason}`));
  }
  return Object.freeze({valid:reasons.length===0,reasons:Object.freeze(reasons)});
}
