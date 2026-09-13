const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build';
const req=rel=>require(path.join(__dirname,'..','..',build,rel));
const product=req('product/index.js');
const planning=req('product-policy/exam/gsatBetaPlanning.js');
const mockInput=req('product-policy/exam/gsatMockInput.js');
const lookup=req('lookup/contextualResolution.js');
const bank=req('content/examBetaBank.js');
const root=path.join(__dirname,'..','..');

test('GSAT beta bootstraps into Exam without arbitrary writing or translation',()=>{
  const profile=product.createInitialProductProfileV2({learnerId:'local',accountId:null,displayName:'',demoMode:true},'2026-09-05T00:00:00.000Z');
  assert.equal(profile.goals.learningPurpose,'EXAM');
  assert.deepEqual(profile.goals.useContexts,['EXAM_TASKS']);
  assert.equal(profile.exam.examType,'學測英文');
  assert.equal(profile.access.activeExperience,'EXAM');
  assert.equal(planning.gsatColdStartDecisionV1(profile,false).kind,'CALIBRATION');
});

test('self-reported mock loss selects the largest proportional GSAT family but is never evidence',()=>{
  const profile=product.createInitialProductProfileV2({learnerId:'local',accountId:null,displayName:'',demoMode:true},'2026-09-05T00:00:00.000Z');
  profile.gsatBeta.recentResults=[
    {section:'ENGLISH_COMPOSITION',lost:4,maximum:20,reportedAt:'2026-09-05',evidenceEligible:false},
    {section:'READING_COMPREHENSION',lost:6,maximum:10,reportedAt:'2026-09-05',evidenceEligible:false},
  ];
  const decision=planning.gsatColdStartDecisionV1(profile,false);
  assert.equal(decision.practiceFamily,'exam_reading');
  assert.equal(decision.evidenceEligible,false);
});

test('mock input production policy clamps boundaries, rejects malformed values, and preserves GSAT loss semantics',()=>{
  const definition={section:'READING_COMPREHENSION',maximum:24,maxInput:12,pointValue:2,kind:'WRONG_COUNT'};
  assert.equal(mockInput.gsatRecentResultFromInputV1({definition,raw:'14',reportedAt:'t'}).lost,24);
  assert.equal(mockInput.gsatRecentResultFromInputV1({definition,raw:'1.2.3',reportedAt:'t'}).lost,24);
  assert.equal(mockInput.gsatRecentResultFromInputV1({definition,raw:'',reportedAt:'t'}),undefined);
  const score={section:'ZH_EN_TRANSLATION',maximum:8,maxInput:8,pointValue:1,kind:'SCORE'};
  assert.equal(mockInput.normalizeGsatMockInputV1('1.2.3','SCORE'),'1.2');
  assert.equal(mockInput.gsatRecentResultFromInputV1({definition:score,raw:'1.5',reportedAt:'t'}).lost,6.5);
  assert.equal(mockInput.gsatRecentResultFromInputV1({definition:score,raw:'99',reportedAt:'t'}).lost,0);
});

test('Practice exposes exactly the eight canonical GSAT labels',()=>{
  assert.deepEqual(planning.GSAT_PRACTICE_FAMILIES_V1.map(x=>x.label),['詞彙題','綜合測驗','文意選填','篇章結構','閱讀測驗','混合題','中譯英','英文作文']);
});

test('tap lookup resolves an overlapping phrase before its word and preserves formal lock',()=>{
  const phrase=lookup.resolveTapPhraseFirstContextV1({tappedToken:'make',sentence:'Small steps help you make progress every day.',assessmentMode:'NONE',activeTargetTokens:[]});
  assert.equal(phrase.localUnit.text,'make progress');
  assert.equal(phrase.resolvedSpan.text,'make progress');
  const locked=lookup.resolveTapPhraseFirstContextV1({tappedToken:'progress',sentence:'Small steps help you make progress every day.',assessmentMode:'FORMAL_ASSESSMENT',activeTargetTokens:[],submitted:false});
  assert.equal(locked.status,'LOCKED');
});

test('first run has no General choice and coach dismissals write canonical profile flags',()=>{
  const goals=fs.readFileSync(path.join(root,'app/onboarding/goals.tsx'),'utf8');
  assert.doesNotMatch(goals,/一般英文|GENERAL/);
  const today=fs.readFileSync(path.join(root,'app/(tabs)/index.tsx'),'utf8');
  assert.match(today,/coachMarks:\{today:true\}/);
});

test('history-aware allocation avoids exact replay and fails closed for fresh purposes',()=>{
  const first=bank.examBetaTasks('READING')[0];assert.ok(first);
  const next=bank.examBetaTaskForLearner('READING','l','suggested','r',{purpose:'PRACTICE_NEW',recent:[{taskId:first.task_id}]});
  assert.notEqual(next.task_id,first.task_id);
  const all=bank.examBetaTasks('READING').map(task=>({taskId:task.task_id,freshnessGroupId:task.freshness_group_id}));
  assert.equal(bank.examBetaTaskForLearner('READING','l','suggested','r',{purpose:'FRESH_CHECK',recent:all}),undefined);
});

test('known unsafe fixtures are quarantined and the expense/cost dual answer is removed',()=>{
  for(const [family,id] of [['COMPREHENSIVE','COMP-001'],['CONTEXTUAL_FILL','CF-001'],['DISCOURSE','DISC-001'],['READING','READ-001'],['MIXED','MIX-001'],['TRANSLATION','TRANS-G-T17'],['TRANSLATION','TRANS-F-001']])assert.equal(bank.examBetaTaskById(family,id),undefined);
  const comp=bank.examBetaTaskById('COMPREHENSIVE','COMP-G-004');
  const options=comp.payload.blanks.find(x=>x.id==='2').options.map(x=>x.text);
  assert.ok(options.includes('expense'));assert.ok(!options.includes('cost'));
});

test('詞彙題 routes to the live promoted vocabulary bank while preserving the three baseline operations',()=>{
  const tasks=bank.examBetaTasks('VOCABULARY');
  assert.equal(tasks.length,123);
  for(const subtype of ['CONTEXTUAL_SENSE_4_CHOICE','COLLOCATION_4_CHOICE','WORD_FAMILY_FIT_4_CHOICE'])assert.ok(tasks.some(x=>x.subtype===subtype));
  for(const task of tasks){assert.equal(task.payload.questions[0].options.length,4);assert.equal(task.validation.canonical,'PASS');assert.ok(task.canonicalBinding)}
  const practice=fs.readFileSync(path.join(root,'src/experience/practiceProduct.ts'),'utf8');
  assert.match(practice,/id:'VOCABULARY_USAGE'.*destination:'\/exam-practice'/);
});
