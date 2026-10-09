const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build-wave-f';
const f=rel=>require(path.join(root,build,rel));
const teaching=f('teaching/index.js');

const contrastPuzzle={
  schemaVersion:1,
  id:'contrast-meaning-boundary',
  label:'Meaning boundary contrast',
  intendedLearningChange:'learner can distinguish the meaning/function feature that changes the choice',
  mechanismIds:['form-contrast','alternative-translation-compare'],
  representation:{kind:'CONTRAST',anchor:'MIXED',spatialRelation:'SIDE_BY_SIDE',rationale:'comparison must keep both alternatives visible at once'},
  interaction:{primary:'COMPARE',optional:['SELECT','EXPLAIN'],learnerMustAct:true,producesStructuredObservation:true,rationale:'learner identifies the relevant difference instead of receiving a rule only'},
  contentSlots:[
    {key:'left',kind:'CONTRAST_ITEM',required:true,multiple:false},
    {key:'right',kind:'CONTRAST_ITEM',required:true,multiple:false},
    {key:'context',kind:'SOURCE_TEXT',required:false,multiple:false},
  ],
  allowedSupport:['EXPLICIT','GUIDED','CUED','LIGHT'],
  answerExposure:'BOUNDED',
  observation:{responseSignals:['HELPED','NO_PROGRESS','CONFUSED','SELF_REPAIRED','ASSISTED_SUCCESS'],evidenceCeiling:'EXPOSURE_ONLY',capabilityEvidenceMayBeWrittenDirectly:false,observationKinds:['CHOICE','EXPLANATION','COMPARISON']},
  scope:{areas:['GRAMMAR','TRANSLATION','MEANING_ENCODING'],kinds:['GRAMMAR_CONSTRUCTION','TRANSLATION_CAPABILITY','MEANING_INTENT'],facets:['FORM_MEANING_MAPPING','SELECTION','CONTEXTUAL_APPROPRIACY']},
  contraindications:['source meaning is unresolved','contrast would reveal an imminent independent-check answer'],
};

test('puzzle contract separates mechanism, representation, interaction, content, support and observation',()=>{
  const result=teaching.validateTeachingPuzzleDefinitionV1(contrastPuzzle);
  assert.equal(result.valid,true,result.reasons.join('|'));
  assert.deepEqual(contrastPuzzle.mechanismIds,['form-contrast','alternative-translation-compare']);
  assert.equal(contrastPuzzle.representation.kind,'CONTRAST');
  assert.equal(contrastPuzzle.interaction.primary,'COMPARE');
  assert.equal(contrastPuzzle.contentSlots[0].key,'left');
  assert.equal(contrastPuzzle.observation.capabilityEvidenceMayBeWrittenDirectly,false);
  assert.equal('targetRef' in contrastPuzzle,false,'target identity belongs to an instance, not the reusable puzzle definition');
});

test('one reusable puzzle definition binds to different targets without target-specific screen code',()=>{
  const grammar=teaching.bindTeachingPuzzleV1({
    definition:contrastPuzzle,
    instanceId:'puzzle:grammar:1',
    mechanismId:'form-contrast',
    targetRef:'allow-object-infinitive',
    facet:'FORM_MEANING_MAPPING',
    support:'GUIDED',
    content:{left:'allow students to use',right:'allow to use',context:'Schools should ...'},
    createdAt:'2026-10-09T00:00:00Z',
  });
  const translation=teaching.bindTeachingPuzzleV1({
    definition:contrastPuzzle,
    instanceId:'puzzle:translation:1',
    mechanismId:'alternative-translation-compare',
    targetRef:'translation.source-meaning',
    facet:'FORM_MEANING_MAPPING',
    support:'GUIDED',
    content:{left:'Students are allowed to...',right:'Schools allow students to...',context:'學校允許學生...'},
    createdAt:'2026-10-09T00:00:00Z',
  });
  assert.equal(grammar.puzzleId,translation.puzzleId);
  assert.notEqual(grammar.targetRef,translation.targetRef);
  assert.notEqual(grammar.mechanismId,translation.mechanismId);
});

test('required content and support are validated before a puzzle can execute',()=>{
  assert.throws(()=>teaching.bindTeachingPuzzleV1({
    definition:contrastPuzzle,
    instanceId:'bad-content',
    mechanismId:'form-contrast',
    targetRef:'allow-object-infinitive',
    facet:'FORM_MEANING_MAPPING',
    support:'GUIDED',
    content:{left:'A'},
    createdAt:'2026-10-09T00:00:00Z',
  }),/missing_puzzle_content:right/);
  assert.throws(()=>teaching.bindTeachingPuzzleV1({
    definition:contrastPuzzle,
    instanceId:'bad-support',
    mechanismId:'form-contrast',
    targetRef:'allow-object-infinitive',
    facet:'FORM_MEANING_MAPPING',
    support:'NONE',
    content:{left:'A',right:'B'},
    createdAt:'2026-10-09T00:00:00Z',
  }),/support_not_supported_by_puzzle/);
});

test('teaching interaction emits observation but cannot directly write capability evidence',()=>{
  const instance=teaching.bindTeachingPuzzleV1({
    definition:contrastPuzzle,
    instanceId:'obs-1',
    mechanismId:'form-contrast',
    targetRef:'allow-object-infinitive',
    facet:'FORM_MEANING_MAPPING',
    support:'CUED',
    content:{left:'A',right:'B'},
    createdAt:'2026-10-09T00:00:00Z',
  });
  const observation=teaching.createTeachingPuzzleObservationV1({
    definition:contrastPuzzle,
    instance,
    action:'COMPARE',
    payload:{selectedDifference:'recipient role'},
    supportSeen:'CUED',
    responseSignal:'HELPED',
    occurredAt:'2026-10-09T00:01:00Z',
  });
  assert.equal(observation.capabilityEvidenceAllowed,false);
  assert.equal(observation.puzzleInstanceId,'obs-1');
  assert.equal(observation.responseSignal,'HELPED');
});

test('answer-exposing puzzle definitions are forced to exposure-only evidence ceiling',()=>{
  const invalid={...contrastPuzzle,id:'bad-direct-model',answerExposure:'DIRECT_MODEL',observation:{...contrastPuzzle.observation,evidenceCeiling:'ASSISTED'}};
  const result=teaching.validateTeachingPuzzleDefinitionV1(invalid);
  assert.equal(result.valid,false);
  assert.ok(result.reasons.includes('direct_model_requires_exposure_only_ceiling'));
});

test('unknown mechanisms are rejected at the puzzle-library boundary',()=>{
  const invalid={...contrastPuzzle,id:'unknown-mechanism',mechanismIds:['invented-teaching-mode']};
  const result=teaching.validateTeachingPuzzleDefinitionV1(invalid);
  assert.equal(result.valid,false);
  assert.ok(result.reasons.includes('unknown_mechanism:invented-teaching-mode'));
});
