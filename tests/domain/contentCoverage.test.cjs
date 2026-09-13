const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const req=relative=>require(path.resolve(__dirname,'../../.domain-test-build',relative));
const coverage=req('content/coverage.js');
const content=req('content/index.js');
const writing=req('specializations/writing/index.js');
const translation=req('specializations/translation/index.js');

test('curated Writing and Translation packs project canonical coverage without duplicating pack truth',()=>{
  const w=coverage.queryContentCoverageV1({targetRef:'writing.sentence-realization',facet:'CONSTRUCTION',arena:'WRITING',useCase:'FRESH_CHECK'});
  const t=coverage.queryContentCoverageV1({targetRef:'allow-object-infinitive',facet:'CONSTRUCTION',arena:'TRANSLATION',useCase:'CHANGED_CONTEXT_TRANSFER'});
  assert.equal(w.status,'VALIDATED_DELIVERY_AVAILABLE');assert.ok(w.entries.some(x=>x.contentRef.endsWith('#sentence-reading')));
  assert.equal(t.status,'VALIDATED_DELIVERY_AVAILABLE');assert.ok(t.entries.some(x=>x.contentRef.endsWith('#allow-library-zh')));
  assert.equal(w.entries[0].context.noveltyQualification,'VALIDATED_AT_DELIVERY');assert.ok(w.entries[0].load);assert.ok(w.entries[0].provenanceRefs.length);assert.ok(w.entries[0].validatorRefs.length);
});

test('unsupported target/facet fails closed while Active Practice and delayed retention use validated coverage',()=>{
  assert.equal(coverage.queryContentCoverageV1({targetRef:'writing.organization-cohesion',facet:'CONSTRUCTION',arena:'WRITING',useCase:'FRESH_CHECK'}).status,'NO_CONTENT');
  assert.equal(coverage.queryContentCoverageV1({targetRef:'writing.sentence-realization',facet:'CONSTRUCTION',arena:'WRITING',useCase:'ACTIVE_PRACTICE'}).status,'VALIDATED_DELIVERY_AVAILABLE');
  assert.equal(coverage.queryContentCoverageV1({targetRef:'writing.sentence-realization',facet:'CONSTRUCTION',arena:'WRITING',useCase:'DELAYED_RETENTION'}).status,'VALIDATED_DELIVERY_AVAILABLE');
});

test('caller targetRef cannot fabricate construction coverage from an allow example',()=>{
  const provenance={sourceId:'tatoeba',sourceVersion:'v',sourceRecordId:'1',licenseName:'CC',licenseStatus:'ATTRIBUTION_REQUIRED',usageScope:'PRODUCTION_OK_WITH_ATTRIBUTION',attributionText:'source',attributionRequired:true};
  const bundle={schemaVersion:1,purpose:'FRESH_PRODUCTION',focusEnglish:'allow',sourceContext:'context',morphology:[],examples:[{exampleId:'e',text:'Libraries allow visitors to use computers.',language:'eng',lemma:'allow',pos:'v',synsetId:'s',learnerDisplayEligible:true,provenance}],relations:[],sentencePairs:[],provenance:[provenance],licenseStatus:'ATTRIBUTION_REQUIRED',candidateNovelty:'DATA_CANDIDATE_ONLY'};
  const binding=coverage.bindCorpusBundleToContentCoverageV1({bundle,targetRef:'allow-object-infinitive',facet:'CONSTRUCTION',arena:'LANGUAGE'});
  assert.equal(binding.status,'DATA_EXISTS_BUT_UNBOUND');assert.deepEqual(binding.entries,[]);
});

test('lexeme, exact sense, and structural morphology bind while nearby data fails closed',()=>{
  const p=(sourceId,sourceRecordId)=>({sourceId,sourceVersion:'v',sourceRecordId,licenseName:'CC',licenseStatus:'VERIFIED_PRODUCTION_ALLOWED',usageScope:'PRODUCTION_OK',attributionText:'',attributionRequired:false});
  const base={schemaVersion:1,purpose:'LEXICAL_RETRIEVAL',focusEnglish:'allow',lemma:'allow',sourceContext:'x',morphology:[],examples:[],relations:[],sentencePairs:[],licenseStatus:'ALL_ALLOWED',candidateNovelty:'DATA_CANDIDATE_ONLY'};
  const lexical={...base,examples:[{exampleId:'e',text:'Allow it.',language:'eng',lemma:'allow',pos:'v',synsetId:'s',learnerDisplayEligible:true,provenance:p('oewn-2025','e')}],provenance:[p('oewn-2025','e')]};
  assert.equal(coverage.bindCorpusBundleToContentCoverageV1({bundle:lexical,targetRef:'word.allow',facet:'FORM_RECOGNITION',arena:'LANGUAGE'}).status,'SEMANTICALLY_BOUND');
  assert.equal(coverage.bindCorpusBundleToContentCoverageV1({bundle:{...lexical,lemma:'permit',examples:[{...lexical.examples[0],lemma:'permit'}]},targetRef:'word.allow',facet:'FORM_RECOGNITION',arena:'LANGUAGE'}).status,'DATA_EXISTS_BUT_UNBOUND');
  const exact=p('oewn-2025','oewn:allow%2:32:00::'),sense={...base,purpose:'MEANING_CONTRAST',senses:[{senseId:'oewn:allow%2:32:00::',pos:'v',glosses:['permit'],relations:[],provenance:exact}],provenance:[exact]};
  assert.equal(coverage.bindCorpusBundleToContentCoverageV1({bundle:sense,targetRef:'sense.allow.permission',facet:'SENSE_DISCRIMINATION',arena:'LANGUAGE'}).status,'SEMANTICALLY_BOUND');
  const other=p('oewn-2025','oewn:allow%2:42:00::');
  assert.equal(coverage.bindCorpusBundleToContentCoverageV1({bundle:{...sense,senses:[{...sense.senses[0],senseId:other.sourceRecordId,provenance:other}],provenance:[other]},targetRef:'sense.allow.permission',facet:'SENSE_DISCRIMINATION',arena:'LANGUAGE'}).status,'DATA_EXISTS_BUT_UNBOUND');
  const mp=p('unimorph-eng-master-20260827','walk'),morph={...base,focusEnglish:'walk',lemma:'walk',morphology:[{lemma:'walk',form:'walks',features:['V','PRS','3','SG'],provenance:mp},{lemma:'walk',form:'walked',features:['V','PST'],provenance:mp}],provenance:[mp]};
  assert.equal(coverage.bindCorpusBundleToContentCoverageV1({bundle:morph,targetRef:'morph.regular-verb-ed-s',facet:'MORPHOLOGY',arena:'LANGUAGE'}).status,'SEMANTICALLY_BOUND');
  assert.equal(coverage.bindCorpusBundleToContentCoverageV1({bundle:{...morph,morphology:[{lemma:'go',form:'went',features:['V','PST'],provenance:mp}]},targetRef:'morph.regular-verb-ed-s',facet:'MORPHOLOGY',arena:'LANGUAGE'}).status,'DATA_EXISTS_BUT_UNBOUND');
});

test('instructional corpus eligibility never becomes Fresh or Transfer eligibility',()=>{
  const provenance={sourceId:'oewn-2025',sourceVersion:'v',sourceRecordId:'e',licenseName:'CC',licenseStatus:'VERIFIED_PRODUCTION_ALLOWED',usageScope:'PRODUCTION_OK',attributionText:'',attributionRequired:false};
  const bundle={schemaVersion:1,purpose:'LEXICAL_RETRIEVAL',focusEnglish:'allow',lemma:'allow',sourceContext:'x',morphology:[],examples:[{exampleId:'e',text:'Allow it.',language:'eng',lemma:'allow',pos:'v',synsetId:'s',learnerDisplayEligible:true,provenance}],relations:[],sentencePairs:[],provenance:[provenance],licenseStatus:'ALL_ALLOWED',candidateNovelty:'DATA_CANDIDATE_ONLY'};
  const binding=coverage.bindCorpusBundleToContentCoverageV1({bundle,targetRef:'word.allow',facet:'FORM_RECOGNITION',arena:'LANGUAGE'});
  assert.equal(coverage.queryContentCoverageV1({targetRef:'word.allow',facet:'FORM_RECOGNITION',arena:'LANGUAGE',useCase:'TEACH',dataCandidates:binding.entries}).status,'DATA_CANDIDATE_ONLY');
  const fresh=coverage.queryContentCoverageV1({targetRef:'word.allow',facet:'FORM_RECOGNITION',arena:'LANGUAGE',useCase:'FRESH_CHECK',dataCandidates:binding.entries});
  assert.equal(fresh.status,'DATA_CANDIDATE_ONLY');assert.deepEqual(fresh.entries[0].measurementEligibility,[]);
});

test('G still requires existing deterministic validation for Fresh and Transfer',()=>{
  const lesson={id:'lesson',learnerId:'l',targetRef:'writing.sentence-realization',facet:'CONSTRUCTION',needKind:'TRANSFER',objective:'sentence',reason:'test',reasonCodes:[],timeBudgetMinutes:10,productMode:'GENERAL'};
  const source={promptArtifactId:'p',promptText:'Write about your school.',productMode:'GENERAL',audience:'teacher',genre:'paragraph',rubricRefs:[],learnerConfirmed:true,interpretationConfidence:'HIGH'};
  const need=writing.createWritingTaskGenerationNeedV1({lessonPlan:lesson,source,purpose:'FRESH_CHECK',desiredContextDistance:'SAME_FUNCTION_NEW_CONTENT',responseScope:'SENTENCE',writingFunction:'sentence',semanticRequirements:['complete proposition'],forbiddenReuse:[source.promptText]});
  const generated=content.generateValidatedWritingTaskV1({runtimeId:'r',lessonPlan:lesson,source:{sourceRef:'p',promptText:source.promptText,audience:'teacher',genre:'paragraph'},need,occurredAt:'t'});
  assert.ok(generated);assert.equal(generated.validation.deliveryAllowed,true);assert.ok(generated.delivery.validatorRefs.includes('G:deterministic-contract-validator-v1'));
  const translationLesson={...lesson,targetRef:'allow-object-infinitive'};
  const translationSource={sourceArtifactId:'z',sourceText:'學校應該允許學生使用手機。',productMode:'GENERAL',learnerConfirmed:true};
  const tn=translation.createTranslationTaskGenerationNeedV1({lessonPlan:translationLesson,source:translationSource,purpose:'CHANGED_CONTEXT_TRANSFER',desiredContextDistance:'CHANGED_TOPIC',semanticRequirements:['permission'],forbiddenReuse:[translationSource.sourceText]});
  const tg=content.generateValidatedTranslationTaskV1({runtimeId:'r',lessonPlan:translationLesson,source:{sourceRef:'z',sourceText:translationSource.sourceText,sourceLanguage:'zh-TW',targetLanguage:'en'},need:tn,occurredAt:'t'});
  assert.ok(tg);assert.equal(tg.validation.deliveryAllowed,true);assert.ok(tg.delivery.validatorRefs.includes('G:deterministic-translation-contract-validator-v1'));
});

test('coverage reports availability only and exposes no curriculum, Teacher, evidence, or mastery authority',()=>{
  const text=JSON.stringify(coverage.canonicalContentCoverageV1);
  for(const forbidden of ['learnerId','mastery','curriculumDecision','teacherDecision','evidenceAdmission','examScore'])assert.equal(text.includes(forbidden),false);
});
