const test=require('node:test');
const assert=require('node:assert/strict');
const harness=require('../../.domain-test-build/application/stage2/stage2HarnessV4.js');
const policy=require('../../.domain-test-build/application/stage2/teacherPolicyV4.js');

test('Stage 2 V4 family gate has no unresolved critic or hard-guard failures',()=>{
 const r=harness.runStage2GateV4();
 assert.equal(r.passed,true,JSON.stringify(r,null,2));
 assert.equal(r.hardFailures.length,0);
 assert.equal(r.processFailures.length,0);
 assert.equal(r.outcomeFailures.length,0);
 assert.equal(r.contrastFailures.length,0);
 assert.equal(r.unownedFamilies.length,0);
});

test('allow to MUST NOT count as successful production of allow O to V',()=>{
 const testCase=harness.buildStage2CorpusV4().find(x=>x.id==='EV-allow');
 const d=policy.decideTeacherPolicyV4(testCase.input);
 assert.equal(d.evidenceCandidates.some(x=>x.evidencePolarity==='POSITIVE'),false);
 assert.equal(d.action,'DISCRIMINATING_PROBE');
});

test('critic accepts semantic safe-action equivalence and paraphrase variants',()=>{
 const r=harness.runStage2GateV4();
 assert.deepEqual(r.evaluatorRegressions,{equivalentSafeActions:true,paraphraseInvariant:true,contextSensitive:true});
});

test('Stage 2 evaluates capability and SOURCE/CHANGED_CONTEXT provenance independently',()=>{const r=harness.capabilityProvenanceContrastsV4();assert.equal(r.passed,true,JSON.stringify(r.failures));assert.deepEqual(r.failures,[])});
