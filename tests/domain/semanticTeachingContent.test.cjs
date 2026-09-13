const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const req=relative=>require(path.resolve(__dirname,'../../.domain-test-build',relative));
const content=req('content/index.js');
const teaching=req('teaching/index.js');

const provenance={sourceId:'oewn-2025',sourceVersion:'v',sourceRecordId:'oewn:allow%2:32:00::',licenseName:'CC',licenseStatus:'VERIFIED_PRODUCTION_ALLOWED',usageScope:'PRODUCTION_OK',attributionText:'OEWN',attributionRequired:true};
const result=records=>({records,provenance:records.map(x=>x.provenance),sourceVersions:[],licenseStatus:records.length?'ATTRIBUTION_REQUIRED':'NO_USABLE_RESULTS',qualitySignals:[],retrievalReason:'bounded indexed test'});
const corpus={query:async query=>query.requestedResourceType==='LEMMA_SENSES'?result([{senseId:'oewn:allow%2:32:00::',pos:'v',glosses:['give permission'],relations:[],provenance}]):query.requestedResourceType==='EXAMPLES'?result([{exampleId:'e',text:'Libraries allow visitors to use computers.',language:'eng',lemma:'allow',pos:'v',synsetId:'00803980-v',learnerDisplayEligible:true,provenance}]):result([])};
const lesson={id:'lesson-semantic',learnerId:'l',targetRef:'sense.allow.permission',facet:'SENSE_DISCRIMINATION',needKind:'REPAIR',objective:'distinguish permission sense',reason:'observed',reasonCodes:[],timeBudgetMinutes:10,productMode:'GENERAL'};

test('F mechanism requirement resolves bounded semantically-bound instructional content without changing D target',async()=>{
  const mechanism=teaching.pckMechanismByIdV1('meaning-representation');assert.deepEqual(mechanism.contentRequirements,['SENSE_EVIDENCE','EXAMPLE']);
  const resolution=await content.resolveTeachingContentV1({lessonPlan:lesson,mechanismId:mechanism.id,corpus,maxItems:2});
  assert.equal(resolution.targetRef,lesson.targetRef);assert.equal(resolution.facet,lesson.facet);assert.equal(resolution.measurementEligible,false);assert.ok(resolution.candidates.length<=2);assert.ok(resolution.candidates.length);
  assert.ok(resolution.candidates.every(x=>x.binding.kind==='SENSE_IDENTITY'&&x.instructionalOnly&&x.provenanceRefs.length));
});

test('unrelated content and arena labels cannot satisfy semantic content requirements',async()=>{
  const unrelated={query:async query=>query.requestedResourceType==='EXAMPLES'?result([{exampleId:'x',text:'They walk home.',language:'eng',lemma:'walk',pos:'v',synsetId:'x',learnerDisplayEligible:true,provenance}]):result([])};
  const resolution=await content.resolveTeachingContentV1({lessonPlan:lesson,mechanismId:'meaning-representation',corpus:unrelated,maxItems:3});
  assert.deepEqual(resolution.candidates,[]);
  for(const targetRef of ['translation.source-meaning','writing.idea-reasoning']){
    const fakeLesson={...lesson,targetRef,facet:targetRef.startsWith('translation')?'FORM_TO_MEANING':'CONSTRUCTION'};
    const fake=await content.resolveTeachingContentV1({lessonPlan:fakeLesson,mechanismId:'meaning-representation',corpus,maxItems:3});assert.deepEqual(fake.candidates,[]);
  }
});

test('curated construction binding remains validated-source based, not sentence keyword inference',async()=>{
  const allowLesson={...lesson,targetRef:'allow-object-infinitive',facet:'CONSTRUCTION'};
  const resolution=await content.resolveTeachingContentV1({lessonPlan:allowLesson,mechanismId:'grammar-role-map',maxItems:3});
  assert.equal(resolution.targetRef,'allow-object-infinitive');assert.ok(resolution.candidates.length);assert.ok(resolution.candidates.every(x=>x.binding.kind==='CURATED_SEMANTIC_REQUIREMENTS'&&x.measurementEligible===undefined));
  assert.equal(resolution.measurementEligible,false);
});
