const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build-wave-g';
const teaching=require(path.join(root,build,'teaching/index.js'));
const content=require(path.join(root,build,'content/index.js'));

const selection=(overrides={})=>({
  puzzleId:'reformulation-space',
  mechanismId:'alternative-translation-compare',
  support:'GUIDED',
  representationKind:'CONTRAST',
  primaryInteraction:'COMPARE',
  requiredContentSlots:[],
  ...overrides,
});

const resolution=(overrides={})=>({
  lessonPlanId:'lesson',
  targetRef:'translation.source-meaning',
  facet:'SELECTION',
  mechanismId:'alternative-translation-compare',
  candidates:[
    {contentRef:'e1',kind:'EXAMPLE',learnerVisibleText:'More and more schools have begun to value students’ sleep quality.',provenanceRefs:['p1'],binding:{},instructionalOnly:true},
    {contentRef:'e2',kind:'EXAMPLE',learnerVisibleText:'An increasing number of schools have started to pay attention to students’ sleep quality.',provenanceRefs:['p2'],binding:{},instructionalOnly:true},
  ],
  measurementEligible:false,
  reasonCodes:['TEST'],
  ...overrides,
});

test('typed binder creates a real puzzle instance only when required content is present',()=>{
  const result=content.bindSelectedTeachingPuzzleContentV1({
    selection:selection(),
    targetRef:'translation.source-meaning',
    facet:'SELECTION',
    instanceId:'puzzle-instance-1',
    createdAt:'2026-10-09T00:00:00Z',
    context:{
      meaningUnits:['近年來，越來越多學校開始重視學生的睡眠品質。'],
      learnerOutput:'More schools care students sleep.',
      provenanceRefs:['source:p'],
    },
    contentResolution:resolution(),
    sourceContextRef:'task:translation',
  });
  assert.equal(result.status,'READY');
  assert.equal(result.measurementEligible,false);
  assert.equal(result.instance.puzzleId,'reformulation-space');
  assert.equal(result.instance.content.meaning,'近年來，越來越多學校開始重視學生的睡眠品質。');
  assert.equal(result.instance.content.alternatives.length,2);
  assert.deepEqual(new Set(result.provenanceRefs),new Set(['source:p','p1','p2']));
});

test('binder fails closed instead of inventing relation nodes or edges from learner text',()=>{
  const result=content.bindSelectedTeachingPuzzleContentV1({
    selection:selection({puzzleId:'relation-map',mechanismId:'grammar-role-map',representationKind:'RELATION_MAP',primaryInteraction:'MARK'}),
    targetRef:'allow-object-infinitive',
    facet:'CONSTRUCTION',
    instanceId:'relation-missing',
    createdAt:'2026-10-09T00:00:00Z',
    context:{learnerOutput:'Schools should allow to use phones.',sourceText:'Schools should allow students to use phones.'},
    sourceContextRef:'task:writing',
  });
  assert.equal(result.status,'UNAVAILABLE');
  assert.deepEqual(new Set(result.missingSlots),new Set(['nodes','edges']));
  assert.ok(result.reasonCodes.includes('MISSING_REQUIRED_PUZZLE_CONTENT:nodes'));
  assert.ok(result.reasonCodes.includes('MISSING_REQUIRED_PUZZLE_CONTENT:edges'));
});

test('specialized content owner can provide structured relation bindings without target-specific renderer code',()=>{
  const result=content.bindSelectedTeachingPuzzleContentV1({
    selection:selection({puzzleId:'relation-map',mechanismId:'grammar-role-map',representationKind:'RELATION_MAP',primaryInteraction:'MARK'}),
    targetRef:'allow-object-infinitive',
    facet:'CONSTRUCTION',
    instanceId:'relation-ready',
    createdAt:'2026-10-09T00:00:00Z',
    context:{
      learnerOutput:'Schools should allow to use phones.',
      relationNodes:[{id:'actor',label:'schools'},{id:'recipient',label:'students'},{id:'action',label:'use phones'}],
      relationEdges:[{from:'actor',to:'recipient',label:'allows'},{from:'recipient',to:'action',label:'to do'}],
      provenanceRefs:['diagnosis:role-map'],
    },
  });
  assert.equal(result.status,'READY');
  assert.equal(result.instance.content.nodes.length,3);
  assert.equal(result.instance.content.edges.length,2);
  assert.equal(result.measurementEligible,false);
});

test('content target, facet and mechanism drift are rejected before rendering',()=>{
  const targetDrift=content.bindSelectedTeachingPuzzleContentV1({
    selection:selection(),
    targetRef:'translation.source-meaning',
    facet:'SELECTION',
    instanceId:'drift-1',
    createdAt:'2026-10-09T00:00:00Z',
    context:{meaningUnits:['x']},
    contentResolution:resolution({targetRef:'reading.inference'}),
  });
  assert.equal(targetDrift.status,'UNAVAILABLE');
  assert.ok(targetDrift.reasonCodes.includes('CONTENT_TARGET_OR_FACET_DRIFT'));

  const mechanismDrift=content.bindSelectedTeachingPuzzleContentV1({
    selection:selection(),
    targetRef:'translation.source-meaning',
    facet:'SELECTION',
    instanceId:'drift-2',
    createdAt:'2026-10-09T00:00:00Z',
    context:{meaningUnits:['x']},
    contentResolution:resolution({mechanismId:'meaning-representation'}),
  });
  assert.equal(mechanismDrift.status,'UNAVAILABLE');
  assert.ok(mechanismDrift.reasonCodes.includes('CONTENT_MECHANISM_DRIFT'));
});

test('authoritative slot bindings override generic candidates but remain non-measurement content',()=>{
  const result=content.bindSelectedTeachingPuzzleContentV1({
    selection:selection({puzzleId:'contrast-boundary',mechanismId:'form-contrast'}),
    targetRef:'allow-object-infinitive',
    facet:'FORM_MEANING_MAPPING',
    instanceId:'contrast-1',
    createdAt:'2026-10-09T00:00:00Z',
    context:{authoritativeBindings:{left:'allow students to use',right:'allow to use'},provenanceRefs:['semantic:contrast']},
  });
  assert.equal(result.status,'READY');
  assert.equal(result.instance.content.left,'allow students to use');
  assert.equal(result.instance.content.right,'allow to use');
  assert.equal(result.measurementEligible,false);
});
