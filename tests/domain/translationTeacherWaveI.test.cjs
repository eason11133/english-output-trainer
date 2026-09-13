const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build-wave-i';
const fromBuild=rel=>require(path.resolve(__dirname,'..','..',build,rel));
const i=fromBuild('specializations/translation/index.js');
const g=fromBuild('content/index.js');
const catalog=fromBuild('architecture/capabilityCatalog.js');
const clean={elicitation:'OPEN_CHOICE',assistance:{language:'NONE',selection:'NONE',functionCue:'NONE',planning:'NONE',taskLoad:'NONE',recentModelPrime:'NONE'},context:'SOURCE',taskLoad:'LOW'};
const assisted={...clean,assistance:{...clean.assistance,recentModelPrime:'LIGHT'}};
const lesson={id:'lesson-i',learnerId:'learner-i',targetRef:'allow-object-infinitive',facet:'CONSTRUCTION',needKind:'REPAIR',objective:'translate permission meaning into English',reason:'authentic translation',reasonCodes:['AUTHENTIC_OUTPUT'],timeBudgetMinutes:10,productMode:'GENERAL'};
const runtime={id:'runtime-i',learnerId:'learner-i',artifact:{schemaVersion:4,id:'artifact-i',learnerId:'learner-i',source:'DIRECT_TEXT',mode:'TRANSLATION',pages:[{page:1,mimeType:'text/plain',originalText:'Schools should allow to use phones.'}],chineseSource:'學校應該允許學生使用手機。',submittedAt:'t0',immutable:true},spans:[],confirmations:[],usableSourceText:'Schools should allow to use phones.',status:'READY',blockEvents:[],observations:[],evidenceCandidates:[],trace:[]};
const source=i.translationSourceFromInputV1({sourceArtifactId:'translation-source:artifact-i',sourceText:runtime.artifact.chineseSource,productMode:'GENERAL',learnerConfirmed:true});

test('I source meaning keeps Chinese source separate from learner English and reference answers are non-authoritative',()=>{
 const withRef=i.translationSourceFromInputV1({sourceArtifactId:'s',sourceText:'我喜歡閱讀。',productMode:'EXAM',referenceAnswers:['I like reading.'],learnerConfirmed:true});
 assert.equal(withRef.sourceText,'我喜歡閱讀。');assert.deepEqual(withRef.referenceAnswers,['I like reading.']);assert.equal(i.translationValidRealizationPolicyV1.referenceAnswerIsUniqueTruth,false);assert.equal(i.translationValidRealizationPolicyV1.meaningPreservingAlternativesAccepted,true);
});

test('I starts authentic translation work without hijacking D grammar target',()=>{
 const started=i.startTranslationWorkV1({runtime,lessonPlan:lesson,sourceContext:source});const work=i.hydrateTranslationWorkV1(started);assert.ok(work);assert.equal(work.sourceContext.sourceText,runtime.artifact.chineseSource);assert.deepEqual(work.focusCandidates,[]);assert.equal(work.diagnosisStatus,'DIAGNOSTIC_NEEDED');assert.ok(work.diagnosisReasonCodes.includes('DO_NOT_INFER_FAILURE_FROM_D_TARGET'));
});

const ev=(overrides)=>({evidenceId:'ev',source:'SOURCE_ALIGNMENT',dimension:'MEANING_FIDELITY',rootIssueHypothesis:'source meaning changed',confidence:'HIGH',status:'SUPPORTED',reasonCodes:['GROUNDED'],targetRefs:[lesson.targetRef],facets:['CONSTRUCTION'],bottlenecks:['MEANING_FORM_MAPPING'],...overrides});
const dx=(sourceText,learnerText,evidence,analysisComplete=true)=>i.diagnoseTranslationV1({sourceText,learnerText,authorizedTargetRef:lesson.targetRef,evidence,analysisComplete});

test('fluent English with changed source meaning diagnoses fidelity/source meaning rather than grammar',()=>{
 const r=dx('雖然下雨，他仍然出門。','Because it rained, he stayed home.',[ev({dimension:'MEANING_FIDELITY',rootIssueHypothesis:'concession and outcome changed',reasonCodes:['CONCESSION_CHANGED']})]);assert.equal(r.status,'CANDIDATES_READY');assert.equal(r.clusters[0].dimension,'MEANING_FIDELITY');assert.notEqual(r.clusters[0].dimension,'GRAMMAR_FORM');assert.ok(r.clusters[0].mechanismCandidateIds.includes('alternative-translation-compare'));
});
test('literal Chinese order diagnoses L1 collision/restructuring',()=>{const r=dx('我昨天在圖書館看書。','I yesterday at library read book.',[ev({dimension:'L1_L2_CONTRAST',rootIssueHypothesis:'Chinese surface order transferred into English',bottlenecks:['COMPETING_REPRESENTATION']})]);assert.equal(r.clusters[0].dimension,'L1_L2_CONTRAST');assert.ok(r.clusters[0].mechanismCandidateIds.includes('l1-collision'))});
test('known meaning with unavailable English item diagnoses lexical retrieval',()=>{const r=dx('這項措施能減輕壓力。','This measure can ... pressure.',[ev({source:'LEARNER_RETRIEVAL_PROBE',dimension:'LEXICAL_RETRIEVAL',rootIssueHypothesis:'learner explains reduce but cannot retrieve an English item',bottlenecks:['RETRIEVAL']})]);assert.equal(r.clusters[0].dimension,'LEXICAL_RETRIEVAL')});
test('related word in incompatible combination diagnoses lexical precision/collocation',()=>{const r=dx('做出決定','do a decision',[ev({dimension:'COLLOCATION',rootIssueHypothesis:'related verb retrieved in incompatible collocation',bottlenecks:['SELECTION']})]);assert.equal(r.clusters[0].dimension,'COLLOCATION');assert.ok(r.clusters[0].mechanismCandidateIds.includes('collocation-network'))});
test('verb pattern error with intact meaning diagnoses verb pattern',()=>{const r=dx('學校應允許學生使用手機。','Schools should allow students use phones.',[ev({dimension:'VERB_PATTERN',rootIssueHypothesis:'allow object infinitive marker omitted',bottlenecks:['FORM_ASSEMBLY']})]);assert.equal(r.clusters[0].dimension,'VERB_PATTERN');assert.ok(r.clusters[0].mechanismCandidateIds.includes('grammar-role-map'))});
test('ambiguous translation evidence abstains instead of guessing',()=>{const r=dx('他沒有去。','He did not go.',[ev({status:'POSSIBLE',dimension:'SOURCE_MEANING',rootIssueHypothesis:'scope may be misunderstood'})]);assert.equal(r.status,'DIAGNOSTIC_NEEDED');assert.deepEqual(r.candidates,[])});
test('multiple supported bottlenecks coexist, repeated roots cluster, and out-of-target issues only request D replan',()=>{const r=dx('學校應允許學生使用手機並負責任地使用。','Schools should allow students use phones and use them responsibility.',[ev({evidenceId:'v1',dimension:'VERB_PATTERN',rootIssueHypothesis:'allow pattern unstable',learnerSpan:{start:15,end:33},targetRefs:[lesson.targetRef]}),ev({evidenceId:'v2',dimension:'VERB_PATTERN',rootIssueHypothesis:'Allow Pattern Unstable',learnerSpan:{start:15,end:33},targetRefs:[lesson.targetRef]}),ev({evidenceId:'c1',dimension:'COLLOCATION',rootIssueHypothesis:'adverb form and combination inaccurate',learnerSpan:{start:48,end:62},targetRefs:['translation.naturalness-precision'],facets:['CONTEXTUAL_APPROPRIACY'],bottlenecks:['SELECTION']})]);assert.equal(r.clusters.length,2);assert.equal(r.clusters.find(x=>x.dimension==='VERB_PATTERN').evidenceIds.length,2);assert.equal(r.dReplanRequests.length,1);assert.equal(r.maxConcurrentTeachingTargets,1);assert.equal(r.canClaimCapability,false)});

test('translation original is immutable and assisted learner revision cannot masquerade as learner-only proof',()=>{
 const started=i.startTranslationWorkV1({runtime,lessonPlan:lesson,sourceContext:source});const revised=i.recordLearnerTranslationRevisionV1({runtime:started,text:'Schools should allow students to use phones.',occurredAt:'t1',productionConditions:assisted,visibleBeforeResponse:['MODEL']});const work=i.hydrateTranslationWorkV1(revised);assert.equal(work.artifact.revisions[0].text,runtime.usableSourceText);const current=i.currentTranslationRevisionV1(work);assert.equal(current.operations[0].actor,'LEARNER_ASSISTED');assert.equal(i.translationRevisionCanProveLearnerProductionV1(current).eligible,false);
});

test('clean open-choice learner revision may remain learner-authored but still does not self-admit evidence',()=>{
 const started=i.startTranslationWorkV1({runtime,lessonPlan:lesson,sourceContext:source});const revised=i.recordLearnerTranslationRevisionV1({runtime:started,text:'Schools should allow students to use phones.',occurredAt:'t1',productionConditions:clean});const current=i.currentTranslationRevisionV1(i.hydrateTranslationWorkV1(revised));assert.equal(current.operations[0].actor,'LEARNER');assert.equal(i.translationRevisionCanProveLearnerProductionV1(current).eligible,true);const obs=i.translationAnalyticObservationV1({observationId:'o',sourceText:source.sourceText,learnerText:current.text,meaningFidelity:'PRESERVED',languageAcceptability:'ACCEPTABLE',naturalness:'NATURAL',validAlternativePossible:true,reasonCodes:[]});assert.equal(obs.canClaimCapability,false);assert.equal(obs.canAssignExamScore,false);
});

test('I provider context hides reference answers and keeps D/E/F/C-K authority explicit',()=>{
 const started=i.startTranslationWorkV1({runtime,lessonPlan:lesson,sourceContext:i.translationSourceFromInputV1({sourceArtifactId:'s',sourceText:runtime.artifact.chineseSource,productMode:'EXAM',referenceAnswers:['Schools should allow students to use phones.']})});const ctx=i.translationProviderContextV1(started,lesson);assert.deepEqual(ctx.sourceContext.referenceAnswers,[]);assert.equal(ctx.referenceAnswersAreAuthority,false);assert.equal(ctx.authority.targetOwner,'D');assert.equal(ctx.authority.mechanismOwner,'F');assert.equal(ctx.authority.evidenceOwner,'C/K');
});

test('G delivers a real fresh Chinese translation source and I rejects blank-editor-only freshness',()=>{
 const started=i.startTranslationWorkV1({runtime,lessonPlan:lesson,sourceContext:source});assert.equal(i.translationFreshOpportunityGateV1(started,lesson,'ASSESS').allowed,false);const prepared=i.prepareTranslationFreshTaskForIntentV1({runtime:started,lessonPlan:lesson,intent:'ASSESS',occurredAt:'t2'});assert.equal(prepared.status,'READY');const work=i.hydrateTranslationWorkV1(prepared.runtime);assert.ok(work.freshTask);assert.notEqual(work.freshTask.sourceText,source.sourceText);assert.equal(i.translationFreshOpportunityGateV1(prepared.runtime,lesson,'ASSESS').allowed,true);
});

test('changed-context retranslation requires a changed-context delivered task',()=>{
 const started=i.startTranslationWorkV1({runtime,lessonPlan:lesson,sourceContext:source});const prepared=i.prepareTranslationFreshTaskForIntentV1({runtime:started,lessonPlan:lesson,intent:'TRANSFER',occurredAt:'t2'});assert.equal(prepared.status,'READY');const task=i.hydrateTranslationWorkV1(prepared.runtime).freshTask;assert.equal(task.purpose,'CHANGED_CONTEXT_TRANSFER');assert.equal(task.contextNovelty,'CHANGED_CONTEXT');assert.equal(i.translationFreshOpportunityGateV1(prepared.runtime,lesson,'TRANSFER').allowed,true);
});

test('fresh translation tasks are single-use and same source text cannot be recycled under a new id',()=>{
 const started=i.startTranslationWorkV1({runtime,lessonPlan:lesson,sourceContext:source});const first=i.prepareTranslationFreshTaskForIntentV1({runtime:started,lessonPlan:lesson,intent:'ASSESS',occurredAt:'t1'});const firstTask=i.hydrateTranslationWorkV1(first.runtime).freshTask;const consumed=i.consumeTranslationFreshTaskV1(first.runtime,'t2');assert.equal(i.translationFreshOpportunityGateV1(consumed,lesson,'ASSESS').allowed,false);const forged={...firstTask,taskId:'new-id',consumedAt:undefined,deliveredAt:'t3'};assert.ok(i.validateTranslationDeliveredTaskV1(consumed,lesson,forged).includes('FRESH_TRANSLATION_SOURCE_REUSED'));
});

test('AI translation task proposal cannot self-validate',()=>{
 const need=i.createTranslationTaskGenerationNeedV1({lessonPlan:lesson,source,purpose:'FRESH_CHECK',desiredContextDistance:'SAME_FUNCTION_NEW_CONTENT'});const generated=g.generateValidatedTranslationTaskV1({runtimeId:'r',lessonPlan:lesson,source:{sourceRef:source.sourceArtifactId,sourceText:source.sourceText,sourceLanguage:'zh-TW',targetLanguage:'en'},need,occurredAt:'t'});assert.ok(generated);const ai={...generated.candidate,provenance:'AI_PROPOSAL',validationStatus:'VALIDATED',validatorRefs:['model:self','G:deterministic-translation-contract-validator-v1']};const validation=g.validateGeneratedTranslationTaskV1({candidate:ai,need,source:{sourceRef:source.sourceArtifactId,sourceText:source.sourceText,sourceLanguage:'zh-TW',targetLanguage:'en'}});assert.equal(validation.deliveryAllowed,false);assert.ok(validation.errors.includes('AI_PROPOSAL_REQUIRES_INDEPENDENT_SEMANTIC_VALIDATOR'));
});

test('I capability catalog is conservative instead of claiming unbuilt semantic evaluators',()=>{
 const caps=Object.fromEntries(catalog.capabilitiesForSubsystemV1('I').map(x=>[x.id,x.implementation_status]));assert.equal(caps['I.source-meaning'],'CONTRACT_ONLY');assert.equal(caps['I.changed-context-retranslation'],'FIRST_PASS');for(const id of ['I.meaning-fidelity','I.lexical-retrieval','I.collocation','I.verb-pattern','I.grammar-form','I.role-mapping','I.l1-l2-contrast','I.restructuring','I.guided-reconstruction','I.valid-realizations','I.naturalness-precision','I.exam-alignment','I.translation-evaluation'])assert.equal(caps[id],'CONTRACT_ONLY',id);
});

test('I provider context carries the active validated fresh Chinese source after delivery',()=>{
 const started=i.startTranslationWorkV1({runtime,lessonPlan:lesson,sourceContext:source});const prepared=i.prepareTranslationFreshTaskForIntentV1({runtime:started,lessonPlan:lesson,intent:'ASSESS',occurredAt:'t2'});const ctx=i.translationProviderContextV1(prepared.runtime,lesson);assert.ok(ctx.activeFreshTask);assert.equal(ctx.activeFreshTask.sourceText,i.hydrateTranslationWorkV1(prepared.runtime).freshTask.sourceText);assert.notEqual(ctx.activeFreshTask.sourceText,source.sourceText);
});

test('I revision provenance reuses the canonical fail-closed independence predicate',()=>{
 const unknownLoad={...clean,taskLoad:'UNKNOWN'};const started=i.startTranslationWorkV1({runtime,lessonPlan:lesson,sourceContext:source});const revised=i.recordLearnerTranslationRevisionV1({runtime:started,text:'Schools should allow students to use phones.',occurredAt:'t-unknown',productionConditions:unknownLoad});const current=i.currentTranslationRevisionV1(i.hydrateTranslationWorkV1(revised));assert.equal(current.operations[0].actor,'LEARNER_ASSISTED');assert.equal(i.translationRevisionCanProveLearnerProductionV1(current).eligible,false);assert.ok(i.translationRevisionCanProveLearnerProductionV1(current).reasons.some(x=>x.toLowerCase().includes('task load is unknown')));
});

test('I revision records only the changed span instead of claiming the whole translation changed',()=>{
 const started=i.startTranslationWorkV1({runtime,lessonPlan:lesson,sourceContext:source});const revised=i.recordLearnerTranslationRevisionV1({runtime:started,text:'Schools should allow students to use phones.',occurredAt:'t-diff',productionConditions:clean});const op=i.currentTranslationRevisionV1(i.hydrateTranslationWorkV1(revised)).operations[0];assert.equal(op.before,'');assert.equal(op.after,'students ');assert.ok(op.sourceSpan.start>0);
});
