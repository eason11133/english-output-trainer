const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build-wave-n';
const teaching=require(path.join(root,build,'teaching/index.js'));
const experience=require(path.join(root,build,'experience/index.js'));

const bind=(puzzleId,mechanismId,targetRef,facet,content,support='GUIDED')=>teaching.bindTeachingPuzzleV1({
  definition:teaching.teachingPuzzleDefinitionV1(puzzleId),
  instanceId:`${puzzleId}:1`,
  mechanismId,
  targetRef,
  facet,
  support,
  content,
  createdAt:'2026-10-09T00:00:00Z',
});

test('learner experience projects six materially different teaching puzzle surfaces',()=>{
  const cases=[
    bind('contrast-boundary','form-contrast','allow-object-infinitive','FORM_MEANING_MAPPING',{left:'allow students to use',right:'allow to use',context:'Schools should ...'}),
    bind('relation-map','grammar-role-map','allow-object-infinitive','CONSTRUCTION',{nodes:[{id:'school',label:'schools'},{id:'students',label:'students'},{id:'use',label:'use phones'}],edges:[{from:'school',to:'students',label:'allows'},{from:'students',to:'use',label:'to do'}],learnerOutput:'Schools should allow to use phones.'}),
    bind('worked-transformation','worked-transformation','allow-object-infinitive','CONSTRUCTION',{learnerOutput:'Schools should allow to use phones.',steps:['find who is allowed','place students after allow','keep to use phones']},'EXPLICIT'),
    bind('chunk-build','chunk-as-unit','translation.naturalness-precision','COLLOCATION',{targetLanguage:'pay attention to',partners:['close','careful','more'],examples:['pay close attention to safety']}),
    bind('evidence-bridge','inference-evidence-bridge','reading.inference','SELECTION',{sourceText:'The town tested one change and planned two more trials.',prompt:'Which conclusion is best supported?',evidenceSpans:['planned two more trials','did not conclude every street should copy it']}),
    bind('reformulation-space','alternative-translation-compare','translation.source-meaning','SELECTION',{meaning:'越來越多學校開始重視學生的睡眠品質。',learnerOutput:'More schools care students sleep.',alternatives:['More and more schools have begun to value students’ sleep quality.','An increasing number of schools have started to pay attention to students’ sleep quality.']}),
  ];
  const kinds=cases.map(instance=>{
    const projected=experience.projectTeachingPuzzleExperienceV1(instance);
    assert.equal(projected.status,'READY',instance.puzzleId);
    return projected.vm.kind;
  });
  assert.deepEqual(new Set(kinds),new Set(['CONTRAST','RELATION_MAP','WORKED_TRANSFORMATION','CHUNK_BUILD','EVIDENCE_BRIDGE','REFORMULATION']));
});

test('experience projection preserves Teacher selection and never re-decides pedagogy',()=>{
  const instance=bind('contrast-boundary','form-contrast','allow-object-infinitive','FORM_MEANING_MAPPING',{left:'A',right:'B'},'CUED');
  const projected=experience.projectTeachingPuzzleExperienceV1(instance);
  assert.equal(projected.status,'READY');
  assert.equal(projected.vm.puzzleId,'contrast-boundary');
  assert.equal(projected.vm.mechanismId,'form-contrast');
  assert.equal(projected.vm.support,'CUED');
  assert.equal(projected.vm.primaryInteraction,'COMPARE');
});

test('missing semantic content fails closed instead of rendering an empty generic card',()=>{
  const instance={schemaVersion:1,instanceId:'broken',puzzleId:'evidence-bridge',mechanismId:'inference-evidence-bridge',targetRef:'reading.inference',facet:'SELECTION',support:'GUIDED',content:{sourceText:'passage only'},createdAt:'2026-10-09T00:00:00Z'};
  const projected=experience.projectTeachingPuzzleExperienceV1(instance);
  assert.equal(projected.status,'UNAVAILABLE');
  assert.ok(projected.reasonCodes.includes('EVIDENCE_CONTENT_MISSING'));
});
