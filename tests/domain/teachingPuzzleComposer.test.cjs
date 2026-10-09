const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build-wave-f';
const teaching=require(path.join(root,build,'teaching/index.js'));

const request=(overrides={})=>({
  targetRef:'allow-object-infinitive',
  facet:'CONSTRUCTION',
  targetArea:'GRAMMAR',
  targetKind:'GRAMMAR_CONSTRUCTION',
  learnerState:'OBSERVED_FRAGILE',
  supportDependence:'UNKNOWN',
  competingHypotheses:[],
  current:{outcome:'FAILURE',support:'NONE',eventKind:'LEARNER_RESPONSE'},
  conditions:teaching.defaultTeachingOpportunityConditionsV1({support:'NONE',elicitation:'OPEN_CHOICE',context:'SOURCE',taskLoad:'MEDIUM'}),
  recentTreatment:[],
  ...overrides,
});

test('composer emits one current move only and has no pre-authored future sequence',()=>{
  const move=teaching.decideNextTeachingPuzzleMoveV1({request:request(),occurredAt:'2026-10-09T00:00:00Z'});
  assert.equal(move.kind,'PRESENT_PUZZLE');
  assert.ok(move.selection);
  assert.equal(move.state.history.length,0);
  assert.equal(move.state.current.puzzleId,move.selection.puzzleId);
  assert.equal('pieces' in move.state,false);
  assert.equal('nextPieces' in move.state,false);
  assert.ok(move.reasonCodes.includes('ONE_MOVE_ONLY'));
});

test('composer refuses to advance until the learner response to the current puzzle exists',()=>{
  const first=teaching.decideNextTeachingPuzzleMoveV1({request:request(),occurredAt:'2026-10-09T00:00:00Z'});
  assert.throws(()=>teaching.decideNextTeachingPuzzleMoveV1({request:request(),state:first.state,occurredAt:'2026-10-09T00:01:00Z'}),/response_required/);
});

test('failed puzzle changes representation when another admissible representation exists',()=>{
  const first=teaching.decideNextTeachingPuzzleMoveV1({request:request(),occurredAt:'2026-10-09T00:00:00Z'});
  const prior=first.selection;
  const failedRequest=request({
    current:{outcome:'FAILURE',support:prior.support,eventKind:'LEARNER_RESPONSE'},
    recentTreatment:[{mechanismId:prior.mechanismId,support:prior.support,outcome:'FAILURE',responseSignal:'CONFUSED',occurredAt:'2026-10-09T00:00:30Z'}],
    conditions:teaching.defaultTeachingOpportunityConditionsV1({support:prior.support,elicitation:'FUNCTION_CUED',context:'SOURCE',taskLoad:'MEDIUM'}),
  });
  const next=teaching.decideNextTeachingPuzzleMoveV1({request:failedRequest,state:first.state,responseSignal:'CONFUSED',occurredAt:'2026-10-09T00:01:00Z'});
  assert.equal(next.kind,'PRESENT_PUZZLE');
  assert.equal(next.state.history.length,1);
  assert.notEqual(next.selection.representationKind,prior.representationKind);
});

test('supported success fades the current approach instead of forcing a new scripted stage',()=>{
  const first=teaching.decideNextTeachingPuzzleMoveV1({request:request(),occurredAt:'2026-10-09T00:00:00Z'});
  const prior=first.selection;
  const successRequest=request({
    current:{outcome:'SUCCESS',support:prior.support,eventKind:'LEARNER_RESPONSE'},
    recentTreatment:[{mechanismId:prior.mechanismId,support:prior.support,outcome:'SUCCESS',responseSignal:'ASSISTED_SUCCESS',occurredAt:'2026-10-09T00:00:30Z'}],
    conditions:teaching.defaultTeachingOpportunityConditionsV1({support:prior.support,elicitation:'FUNCTION_CUED',context:'SOURCE',taskLoad:'MEDIUM'}),
  });
  const next=teaching.decideNextTeachingPuzzleMoveV1({request:successRequest,state:first.state,responseSignal:'ASSISTED_SUCCESS',occurredAt:'2026-10-09T00:01:00Z'});
  if(next.kind==='PRESENT_PUZZLE'){
    const order=['MODELED','EXPLICIT','GUIDED','CUED','LIGHT','NONE'];
    assert.ok(order.indexOf(next.selection.support)>=order.indexOf(prior.support));
    assert.equal(next.selection.puzzleId,prior.puzzleId);
  }else{
    assert.equal(next.kind,'REQUEST_INDEPENDENT_ATTEMPT');
  }
});

test('learner request for independence returns control instead of selecting another teaching puzzle',()=>{
  const first=teaching.decideNextTeachingPuzzleMoveV1({request:request(),occurredAt:'2026-10-09T00:00:00Z'});
  const independence=request({
    learnerRequestedIndependentAttempt:true,
    current:{outcome:'EXPOSURE_ONLY',support:first.selection.support,eventKind:'LEARNER_RESPONSE'},
    conditions:teaching.defaultTeachingOpportunityConditionsV1({support:first.selection.support,elicitation:'FUNCTION_CUED',context:'SOURCE',taskLoad:'MEDIUM'}),
  });
  const next=teaching.decideNextTeachingPuzzleMoveV1({request:independence,state:first.state,responseSignal:'HELPED',occurredAt:'2026-10-09T00:01:00Z'});
  assert.equal(next.kind,'REQUEST_INDEPENDENT_ATTEMPT');
  assert.equal(next.selection,undefined);
  assert.equal(next.state.status,'READY_FOR_INDEPENDENT_ATTEMPT');
});

test('same composer contract works across lexical, reading and translation targets',()=>{
  const cases=[
    request({targetRef:'sense.allow.permission',facet:'SENSE_DISCRIMINATION',targetArea:'LEXICAL',targetKind:'SENSE',learnerState:'UNKNOWN'}),
    request({targetRef:'reading.inference',facet:'SELECTION',targetArea:'READING',targetKind:'READING_CAPABILITY'}),
    request({targetRef:'translation.source-meaning',facet:'SELECTION',targetArea:'TRANSLATION',targetKind:'TRANSLATION_CAPABILITY'}),
  ];
  for(const [index,item] of cases.entries()){
    const move=teaching.decideNextTeachingPuzzleMoveV1({request:item,occurredAt:`2026-10-09T00:0${index}:00Z`});
    assert.equal(move.kind,'PRESENT_PUZZLE',item.targetRef);
    assert.ok(move.selection.puzzleId,item.targetRef);
  }
});
