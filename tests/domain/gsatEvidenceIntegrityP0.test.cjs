const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build';
const req=rel=>require(path.join(__dirname,'..','..',build,rel));
const {projectCanonicalLearnerTruthV1}=req('learner-truth/projection.js');
const {openEnglishResponseIntegrityV1}=req('application/exam/examSemanticAssessment.js');

const event=(id,overrides={})=>({id,schemaVersion:3,learnerId:'l',occurredAt:`2026-09-0${id.length}T00:00:00.000Z`,immutable:true,candidateKind:'CAPABILITY',observation:id,capabilityDomain:'ENGLISH',capabilityFacet:'SENSE_DISCRIMINATION',evidenceEligibility:'ELIGIBLE',evidencePolarity:'POSITIVE',evidenceScope:'LOCAL',productionMode:'INDEPENDENT',supportBeforeResponse:'NONE',semanticProvenance:'LEARNER_ORIGINATED',contextNovelty:'SOURCE',confidence:'HIGH',competingExplanations:[],taskId:id,targetRef:'sense.allow.permission',senseId:'sense:address:problem',taskAffordanceChecked:true,opportunityPresent:true,performanceDimension:'RECOGNITION',...overrides});

test('recognition success and later production failure coexist without cross-dimension erasure',()=>{
 const model=projectCanonicalLearnerTruthV1('l',[event('mcq'),event('retrieval',{capabilityFacet:'MEANING_TO_RETRIEVAL',evidencePolarity:'NEGATIVE',performanceDimension:'PRODUCTION'})]);
 const recognition=model.capabilitySlice.find(x=>x.performanceDimension==='RECOGNITION');
 const production=model.capabilitySlice.find(x=>x.performanceDimension==='PRODUCTION');
 assert.ok(recognition.sourceEvidenceIds.includes('mcq'));assert.equal(recognition.state,'TRANSFER_PENDING');
 assert.equal(production.state,'OBSERVED_FRAGILE');
});

test('productive success does not fabricate recognition history',()=>{
 const model=projectCanonicalLearnerTruthV1('l',[event('write',{capabilityFacet:'MEANING_TO_RETRIEVAL',performanceDimension:'PRODUCTION'})]);
 assert.equal(model.capabilitySlice.length,1);assert.equal(model.capabilitySlice[0].performanceDimension,'PRODUCTION');
});

test('sense identities never merge',()=>{
 const model=projectCanonicalLearnerTruthV1('l',[event('a'),event('b',{senseId:'sense:address:location'})]);
 assert.equal(model.capabilitySlice.length,2);assert.deepEqual(new Set(model.capabilitySlice.map(x=>x.senseId)),new Set(['sense:address:problem','sense:address:location']));
});

test('repeated exact task is one projection opportunity while different task remains distinct',()=>{
 const model=projectCanonicalLearnerTruthV1('l',[event('one',{taskId:'same'}),event('two',{taskId:'same'}),event('three',{taskId:'different'})]);
 const p=model.capabilitySlice[0];assert.equal(p.sourceEvidenceIds.length,2);assert.equal(p.confidence,'HIGH');
 const repeated=projectCanonicalLearnerTruthV1('l',[event('one',{taskId:'same'}),event('two',{taskId:'same'})]).capabilitySlice[0];
 assert.equal(repeated.sourceEvidenceIds.length,1);assert.equal(repeated.confidence,'LOW');
});

test('open-English integrity rejects keyword soup and preserves ordinary realized English',()=>{
 assert.equal(openEnglishResponseIntegrityV1('Study shows. Regular review. More effective than. All at once before exam.').qualified,false);
 assert.equal(openEnglishResponseIntegrityV1('AI students can if because because learning because useful because.').qualified,false);
 assert.equal(openEnglishResponseIntegrityV1('The study shows that regular review is more effective than studying all at once before an exam.').qualified,true);
 assert.equal(openEnglishResponseIntegrityV1('Students can become passive if they let AI do every difficult step for them.').qualified,true);
});
