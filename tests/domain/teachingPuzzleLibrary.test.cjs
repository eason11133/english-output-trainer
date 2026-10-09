const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build-wave-f';
const teaching=require(path.join(root,build,'teaching/index.js'));

test('first teaching puzzle library is valid and target-agnostic',()=>{
  const checked=teaching.validateTeachingPuzzleLibraryV1();
  assert.equal(checked.valid,true,checked.reasons.join('|'));
  assert.equal(teaching.teachingPuzzleLibraryV1.length,6);
  for(const puzzle of teaching.teachingPuzzleLibraryV1){
    assert.equal('targetRef' in puzzle,false,puzzle.id);
    assert.ok(puzzle.mechanismIds.length>0,puzzle.id);
    assert.equal(puzzle.observation.capabilityEvidenceMayBeWrittenDirectly,false,puzzle.id);
    assert.equal(puzzle.interaction.producesStructuredObservation,true,puzzle.id);
  }
});

test('library covers the first cross-domain teaching set without one screen per target',()=>{
  const areas=new Set(teaching.teachingPuzzleLibraryV1.flatMap(puzzle=>puzzle.scope.areas));
  for(const area of ['GRAMMAR','LEXICAL','READING','TRANSLATION','WRITING'])assert.ok(areas.has(area),area);
  const mechanisms=new Set(teaching.teachingPuzzleLibraryV1.flatMap(puzzle=>puzzle.mechanismIds));
  for(const id of ['grammar-role-map','form-contrast','worked-transformation','chunk-as-unit','inference-evidence-bridge','reformulation-map'])assert.ok(mechanisms.has(id),id);
});

test('contrast puzzle can bind grammar, translation and reading content through one contract',()=>{
  const puzzle=teaching.teachingPuzzleDefinitionV1('contrast-boundary');
  assert.ok(puzzle);
  const cases=[
    {instanceId:'grammar',mechanismId:'form-contrast',targetRef:'allow-object-infinitive',facet:'FORM_MEANING_MAPPING',content:{left:'allow students to use',right:'allow to use'}},
    {instanceId:'translation',mechanismId:'alternative-translation-compare',targetRef:'translation.source-meaning',facet:'FORM_MEANING_MAPPING',content:{left:'Students may...',right:'Students are allowed to...'}},
    {instanceId:'reading',mechanismId:'claim-strength-contrast',targetRef:'reading.inference',facet:'SELECTION',content:{left:'must be true',right:'may be true',context:'passage'}},
  ];
  for(const item of cases){
    const bound=teaching.bindTeachingPuzzleV1({definition:puzzle,...item,support:'GUIDED',createdAt:'2026-10-09T00:00:00Z'});
    assert.equal(bound.puzzleId,'contrast-boundary');
  }
});

test('relation map preserves learner-owned material as a distinct content slot',()=>{
  const puzzle=teaching.teachingPuzzleDefinitionV1('relation-map');
  const learnerSlot=puzzle.contentSlots.find(slot=>slot.key==='learnerOutput');
  assert.equal(learnerSlot.learnerAuthored,true);
  const bound=teaching.bindTeachingPuzzleV1({
    definition:puzzle,
    instanceId:'relation-1',
    mechanismId:'grammar-role-map',
    targetRef:'allow-object-infinitive',
    facet:'CONSTRUCTION',
    support:'GUIDED',
    content:{nodes:['school','students','use phones'],edges:['school->students','students->use phones'],learnerOutput:'Schools should allow to use phones.'},
    createdAt:'2026-10-09T00:00:00Z',
  });
  assert.equal(bound.content.learnerOutput,'Schools should allow to use phones.');
});

test('worked transformation is explicitly answer-exposing and remains exposure-only',()=>{
  const puzzle=teaching.teachingPuzzleDefinitionV1('worked-transformation');
  assert.equal(puzzle.answerExposure,'DIRECT_MODEL');
  assert.equal(puzzle.observation.evidenceCeiling,'EXPOSURE_ONLY');
  assert.equal(puzzle.allowedSupport.includes('NONE'),false);
});

test('self explanation is optional rather than a universal learner requirement',()=>{
  for(const puzzle of teaching.teachingPuzzleLibraryV1){
    if(puzzle.interaction.optional.includes('EXPLAIN'))assert.notEqual(puzzle.interaction.primary,'EXPLAIN',puzzle.id);
  }
});
