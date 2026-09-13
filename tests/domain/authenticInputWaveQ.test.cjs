const test=require('node:test');const assert=require('node:assert/strict');const path=require('node:path');
const root=path.resolve(__dirname,'../..'),build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build-wave-q';const q=require(path.join(root,build,'authentic-input/index.js'));
const artifact=(mode='WRITING',extra={})=>q.createAuthenticOriginalArtifactV1({id:'a1',learnerId:'l1',source:'PASTE',mode,pages:[{page:1,mimeType:'text/plain',originalText:'Learner work'}],submittedAt:'2026-08-28T00:00:00Z',...extra});

test('direct Writing keeps prompt rubric and learner work as separate roles',()=>{const b=q.normalizeAuthenticInputV1({artifact:artifact(),spans:[{id:'w1',artifactId:'a1',region:'LEARNER_WRITING',text:'Learner work',confidence:'HIGH',alternatives:[]}],directPromptText:'Should schools allow phones?',directRubricText:'Give two reasons'});assert.equal(b.promptText,'Should schools allow phones?');assert.equal(b.rubricText,'Give two reasons');assert.equal(b.learnerWorkText,'Learner work');assert.deepEqual(b.parts.map(x=>x.role),['PROMPT','RUBRIC','LEARNER_WORK']);assert.equal(b.capabilityEvidenceAllowed,false)});

test('unknown source ownership remains UNKNOWN rather than defaulting to school',()=>{const b=q.normalizeAuthenticInputV1({artifact:artifact(),spans:[]});assert.equal(b.sourceKind,'UNKNOWN')});

test('low-confidence printed prompt makes bundle review-required and cannot be teaching-ready',()=>{const a=artifact();const b=q.normalizeAuthenticInputV1({artifact:a,spans:[{id:'p1',artifactId:'a1',region:'PRINTED_PROMPT',text:'Should school allow phone?',confidence:'LOW',alternatives:['Should schools allow phones?']},{id:'w1',artifactId:'a1',region:'LEARNER_WRITING',text:'Learner work',confidence:'HIGH',alternatives:[]}]});assert.equal(b.integrity,'REVIEW_REQUIRED');assert.equal(q.authenticInputReadyForTeachingV1(b),false);assert.deepEqual(b.decisionRelevantUncertaintySpanIds,['p1'])});

test('prompt OCR never becomes learner work',()=>{const a=artifact();const b=q.normalizeAuthenticInputV1({artifact:a,spans:[{id:'p',artifactId:'a1',region:'PRINTED_PROMPT',text:'Prompt text',confidence:'HIGH',alternatives:[]},{id:'w',artifactId:'a1',region:'LEARNER_WRITING',text:'My answer',confidence:'HIGH',alternatives:[]}]});assert.equal(b.promptText,'Prompt text');assert.equal(b.learnerWorkText,'My answer');assert.equal(q.authenticInputPartV1(b,'PROMPT').text,'Prompt text');assert.equal(q.authenticInputPartV1(b,'LEARNER_WORK').text,'My answer')});

test('Translation requires a distinct source meaning and learner English',()=>{assert.throws(()=>q.normalizeAuthenticInputV1({artifact:artifact('TRANSLATION'),spans:[{id:'w',artifactId:'a1',region:'LEARNER_WRITING',text:'English answer',confidence:'HIGH',alternatives:[]}]}),/translation_requires_source_meaning/);const b=q.normalizeAuthenticInputV1({artifact:artifact('TRANSLATION',{translationSourceText:'中文原文'}),spans:[{id:'w',artifactId:'a1',region:'LEARNER_WRITING',text:'English answer',confidence:'HIGH',alternatives:[]}]});assert.equal(b.translationSourceText,'中文原文');assert.equal(b.learnerWorkText,'English answer')});

test('capability summary is conservative',()=>{const s=q.authenticInputWaveSummaryV1();assert.equal(s.total,10);assert.equal(s.firstPass,7);assert.equal(s.contractOnly,2);assert.equal(s.future,1)});


test('teacher-annotation-only OCR cannot fall back to whole-page learner work',()=>{
  const a=q.createAuthenticOriginalArtifactV1({id:'a2',learnerId:'l1',source:'GALLERY',mode:'WRITING',pages:[{page:1,mimeType:'image/jpeg',originalText:'Teacher: use allowed them to go'}],submittedAt:'2026-08-28T00:00:00Z'});
  assert.throws(()=>q.normalizeAuthenticInputV1({artifact:a,spans:[{id:'t1',artifactId:'a2',region:'TEACHER_ANNOTATION',text:'use allowed them to go',confidence:'HIGH',alternatives:[]}]}),/requires_confirmed_learner_work/);
});

test('mixed teacher annotation and learner writing preserves roles and never contaminates learner work',()=>{
  const a=q.createAuthenticOriginalArtifactV1({id:'a3',learnerId:'l1',source:'GALLERY',mode:'WRITING',pages:[{page:1,mimeType:'image/jpeg',originalText:'I allow people go. Teacher: add to.'}],submittedAt:'2026-08-28T00:00:00Z'});
  const b=q.normalizeAuthenticInputV1({artifact:a,spans:[
    {id:'w1',artifactId:'a3',region:'LEARNER_WRITING',text:'I allow people go.',confidence:'HIGH',alternatives:[]},
    {id:'t1',artifactId:'a3',region:'TEACHER_ANNOTATION',text:'add to',confidence:'HIGH',alternatives:[]},
  ]});
  assert.equal(b.learnerWorkText,'I allow people go.');
  const annotation=q.authenticInputPartV1(b,'TEACHER_ANNOTATION');
  assert.equal(annotation.text,'add to');assert.equal(annotation.teachingEligible,false);
  assert.deepEqual(b.quarantinedSpanIds,['t1']);
});

test('unknown OCR regions are quarantined and cannot substitute for learner work',()=>{
  const a=q.createAuthenticOriginalArtifactV1({id:'a4',learnerId:'l1',source:'PDF',mode:'WRITING',pages:[{page:1,mimeType:'application/pdf',originalText:'Unknown text'}],submittedAt:'2026-08-28T00:00:00Z'});
  assert.throws(()=>q.normalizeAuthenticInputV1({artifact:a,spans:[{id:'u1',artifactId:'a4',region:'UNKNOWN',text:'Unknown text',confidence:'HIGH',alternatives:[]}]}),/requires_confirmed_learner_work/);
  const b=q.normalizeAuthenticInputV1({artifact:a,spans:[
    {id:'w1',artifactId:'a4',region:'LEARNER_WRITING',text:'My actual answer',confidence:'HIGH',alternatives:[]},
    {id:'u1',artifactId:'a4',region:'UNKNOWN',text:'Maybe margin note',confidence:'LOW',alternatives:['Maybe margin note?']},
  ]});
  assert.equal(b.learnerWorkText,'My actual answer');
  assert.equal(q.authenticInputPartV1(b,'UNKNOWN_REGION').teachingEligible,false);
  assert.ok(b.quarantinedSpanIds.includes('u1'));
  assert.equal(b.integrity,'REVIEW_REQUIRED');
});

test('direct paste without classifier spans may still use the user-provided page text as learner work',()=>{
  const b=q.normalizeAuthenticInputV1({artifact:artifact(),spans:[]});
  assert.equal(b.learnerWorkText,'Learner work');
  assert.equal(q.authenticInputPartV1(b,'LEARNER_WORK').provenance,'ARTIFACT_FIELD');
});
