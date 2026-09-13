const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const core=require('../../.domain-test-build/domain/teacher/TeacherRuntime.js');
const harness=require('../../.domain-test-build/application/teacher/evalHarness.js');

test('full supplied 24-case corpus executes real planning trajectories',()=>{
 const yaml=fs.readFileSync(path.join(__dirname,'../../data/teacher/eval_regression_v1.yaml'),'utf8');const loaded=harness.loadRegressionCorpusYaml(yaml);assert.equal(loaded.length,24);const traces=harness.runRegressionCorpus();
 assert.equal(traces.length,24);
 for(const trace of traces){assert.ok(trace.turns.length>=1,trace.worldId);assert.ok(trace.candidatePlans.length>=3,trace.worldId);assert.equal(trace.turns.every(t=>Array.isArray(t.observations)&&t.decision&&t.action),true,trace.worldId)}
});
test('required multi-turn replanning trajectories change pedagogical decisions',()=>{
 const traces=new Map(harness.runRegressionCorpus().map(x=>[x.worldId,x]));
 for(const id of['REG-001','REG-002','REG-004','REG-005']){const t=traces.get(id);assert.ok(t.turns.length>1,id);assert.notEqual(t.turns[0].action,t.turns[1].action,id)}
 assert.equal(traces.get('REG-001').turns[1].decision,'CONTINUE');
 assert.equal(traces.get('REG-002').turns[1].action,'REPRESENT_DIFFERENTLY');
 assert.equal(traces.get('REG-004').turns[1].decision,'CONTINUE');
});
test('critical guard cases have no hard failures',()=>{
 const traces=new Map(harness.runRegressionCorpus().map(x=>[x.worldId,x]));
 for(const id of['REG-007','REG-008','REG-009','REG-010','REG-011','REG-018','REG-022'])assert.deepEqual(traces.get(id).turns.flatMap(t=>t.hardFails),[],id);
});
test('allow to MUST NOT count as successful production of allow O to V',()=>{
 const visible={sourceText:'Schools should allow to use phones.',learnerResponse:'Schools should allow to use phones.',priorEvidence:[],priorTurns:[]};
 const plan=core.planTeacherTurn(visible);assert.equal(plan.interventionDecision,'INTERVENE');assert.equal(plan.positiveEvidence.some(x=>/allow.*success/i.test(x.claim)),false);assert.deepEqual(harness.hardFailChecks(plan,visible),[]);
});
test('every learner response creates a new observation and fresh plan',()=>{const c={sourceText:'signigicant',learnerResponse:'signigicant',priorEvidence:[],priorTurns:[]};const turns=harness.runMultiTurn(c,["I always forget how to spell this.",'significant']);assert.equal(turns.length,3);assert.notEqual(turns[0].action,turns[1].action);assert.notEqual(turns[1].action,turns[2].action);assert.equal(turns.every(t=>t.observations.length>0),true)});
