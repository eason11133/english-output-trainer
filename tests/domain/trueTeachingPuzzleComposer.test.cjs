const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build-wave-f';
const fromBuild=rel=>require(path.join(root,build,rel));
const f=fromBuild('teaching/index.js');

const request=(overrides={})=>({
  targetRef:'allow-object-infinitive',
  facet:'CONSTRUCTION',
  targetArea:'GRAMMAR',
  targetKind:'GRAMMAR_CONSTRUCTION',
  learnerState:'OBSERVED_FRAGILE',
  supportDependence:'UNKNOWN',
  competingHypotheses:[],
  current:{outcome:'FAILURE',support:'NONE',eventKind:'LEARNER_RESPONSE'},
  conditions:f.defaultTeachingOpportunityConditionsV1({support:'NONE',elicitation:'OPEN_CHOICE',context:'SOURCE',taskLoad:'MEDIUM'}),
  recentTreatment:[],
  ...overrides,
});

test('true puzzle composer starts with one decision, not a pre-authored lesson skeleton',()=>{
  const plan=f.startTeacherPuzzleV1({request:request(),occurredAt:'2026-10-08T00:00:00Z',sessionId:'puzzle-1',mode:'WRITING'});
  assert.equal(plan.pieces.length,1);
  assert.equal(plan.cursor,0);
  assert.equal(plan.pieces[0].kind,'REPRESENT');
  assert.equal(f.validateTeacherPuzzleV1(plan).valid,true);
  assert.equal(plan.pieces.some(piece=>piece.kind==='FRESH_ATTEMPT'),false);
  assert.equal(plan.pieces.some(piece=>piece.kind==='RETURN_TO_OUTPUT'),false);
});

test('same current teaching piece branches differently from learner response',()=>{
  const initial=f.startTeacherPuzzleV1({request:request(),occurredAt:'2026-10-08T00:00:00Z',sessionId:'puzzle-2',mode:'WRITING'});
  const helpedRequest=request({current:{outcome:'EXPOSURE_ONLY',support:initial.pieces[0].support,eventKind:'LEARNER_RESPONSE'}});
  const helped=f.decideNextTeacherPuzzleV1({prior:initial,request:helpedRequest,signal:'HELPED',occurredAt:'2026-10-08T00:01:00Z',sessionId:'puzzle-2',mode:'WRITING'});
  const failedRequest=request({current:{outcome:'FAILURE',support:initial.pieces[0].support,eventKind:'LEARNER_RESPONSE'},recentTreatment:[{mechanismId:initial.pieces[0].blockId,support:initial.pieces[0].support,outcome:'FAILURE',responseSignal:'CONFUSED'}]});
  const failed=f.decideNextTeacherPuzzleV1({prior:initial,request:failedRequest,signal:'CONFUSED',occurredAt:'2026-10-08T00:01:00Z',sessionId:'puzzle-2',mode:'WRITING'});
  assert.equal(helped.pieces.length,2);
  assert.equal(f.blockRegistryV4.get(helped.pieces[1].blockId).role,'PRACTICE');
  assert.equal(failed.pieces.length,2);
  assert.equal(f.blockRegistryV4.get(failed.pieces[1].blockId).role,'TEACH');
  assert.notEqual(failed.pieces[1].blockId,initial.pieces[0].blockId);
  assert.ok(failed.excludedMechanismIds.includes(initial.pieces[0].blockId));
});

test('supported learner success makes a new fade decision instead of advancing a fixed cursor',()=>{
  const initial=f.startTeacherPuzzleV1({request:request(),occurredAt:'2026-10-08T00:00:00Z',sessionId:'puzzle-3',mode:'WRITING'});
  const practice=f.decideNextTeacherPuzzleV1({
    prior:initial,
    request:request({current:{outcome:'EXPOSURE_ONLY',support:initial.pieces[0].support,eventKind:'LEARNER_RESPONSE'}}),
    signal:'HELPED',
    occurredAt:'2026-10-08T00:01:00Z',
    sessionId:'puzzle-3',
    mode:'WRITING',
  });
  const active=practice.pieces[practice.cursor];
  const faded=f.decideNextTeacherPuzzleV1({
    prior:practice,
    request:request({current:{outcome:'SUCCESS',support:active.support,eventKind:'LEARNER_RESPONSE'}}),
    signal:'ASSISTED_SUCCESS',
    occurredAt:'2026-10-08T00:02:00Z',
    sessionId:'puzzle-3',
    mode:'WRITING',
  });
  assert.equal(faded.cursor,2);
  assert.ok(['FADE_SUPPORT','FRESH_ATTEMPT'].includes(faded.pieces[2].kind));
  assert.equal(faded.pieces.length,3);
});

test('the same composer contract can start lexical and grammar teaching without target-specific flow code',()=>{
  const grammar=f.startTeacherPuzzleV1({request:request(),occurredAt:'2026-10-08',sessionId:'grammar',mode:'LANGUAGE'});
  const lexicalRequest=request({
    targetRef:'sense.allow.permission',
    targetArea:'LEXICAL',
    targetKind:'SENSE',
    facet:'SENSE_DISCRIMINATION',
    current:{outcome:'FAILURE',support:'NONE',eventKind:'LEARNER_RESPONSE'},
  });
  const lexical=f.startTeacherPuzzleV1({request:lexicalRequest,occurredAt:'2026-10-08',sessionId:'lexical',mode:'LANGUAGE'});
  assert.equal(grammar.pieces.length,1);
  assert.equal(lexical.pieces.length,1);
  assert.equal(lexical.targetRef,'sense.allow.permission');
  assert.equal(lexical.facet,'SENSE_DISCRIMINATION');
  assert.ok(f.blockRegistryV4.get(grammar.pieces[0].blockId));
  assert.ok(f.blockRegistryV4.get(lexical.pieces[0].blockId));
});
