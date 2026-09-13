const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build-wave-h';
const fromBuild=rel=>require(path.resolve(__dirname,'..','..',build,rel));
const h=fromBuild('specializations/writing/index.js');

const lesson={id:'lesson-h',learnerId:'learner-h',targetRef:'allow-object-infinitive',facet:'CONSTRUCTION',needKind:'REPAIR',objective:'repair authentic writing',reason:'source writing',reasonCodes:['AUTHENTIC_OUTPUT'],timeBudgetMinutes:10,productMode:'GENERAL'};
const runtime={id:'runtime-h',learnerId:'learner-h',artifact:{schemaVersion:4,id:'artifact-h',learnerId:'learner-h',source:'PASTE',mode:'WRITING',pages:[{page:1,mimeType:'text/plain',originalText:'Schools should allow to use phones for learning.'}],submittedAt:'2026-08-28T04:00:00.000Z',immutable:true},spans:[],confirmations:[],usableSourceText:'Schools should allow to use phones for learning.',status:'READY',blockEvents:[],observations:[],evidenceCandidates:[],trace:[]};
const source=h.writingSourceFromInputV1({promptArtifactId:'prompt-h',promptText:'Should schools allow phones for learning?',productMode:'GENERAL',rubricText:'Explain your opinion.',learnerConfirmed:true});

const cleanConditions={elicitation:'AUTHENTIC_TASK',context:'SOURCE',taskLoad:'HIGH',assistance:{language:'NONE',selection:'NONE',functionCue:'NONE',planning:'NONE',taskLoad:'NONE',recentModelPrime:'NONE'}};
const modelConditions={elicitation:'FUNCTION_CUED',context:'SOURCE',taskLoad:'LOW',assistance:{language:'STRONG',selection:'NONE',functionCue:'STRONG',planning:'NONE',taskLoad:'LIGHT',recentModelPrime:'STRONG'}};

test('all 15 H capabilities have executable policy coverage',()=>{
 assert.equal(h.writingCapabilityIdsV1.length,15);assert.equal(h.writingCapabilityPoliciesV1.length,15);assert.deepEqual(h.validateWritingCapabilityCoverageV1(),[]);
 for(const p of h.writingCapabilityPoliciesV1){assert.equal(p.evidenceAuthority,'C/K');assert.equal(p.teacherAuthority,'E/F');assert.ok(p.learnerActions.length)}
});

test('writing source preserves authentic prompt separately and does not pretend genre interpretation is known',()=>{
 assert.equal(source.promptText,'Should schools allow phones for learning?');assert.equal(source.purpose,'UNRESOLVED');assert.equal(source.learnerConfirmed,true);assert.deepEqual(source.rubricRefs,['Explain your opinion.']);
});

test('H starts learner-owned work without hijacking a grammar target selected by D',()=>{
 const started=h.startWritingWorkV1({runtime,lessonPlan:lesson,sourceContext:source});const work=h.hydrateWritingWorkV1(started);assert.ok(work);assert.equal(work.artifact.originalArtifactId,'artifact-h');assert.equal(h.currentWritingRevisionV1(work).text,runtime.usableSourceText);assert.equal(work.focusCandidates[0].targetRefs[0],lesson.targetRef);assert.equal(work.focusCandidates[0].facets[0],lesson.facet);
});

test('original revision is immutable and learner revision creates lineage rather than overwriting original',()=>{
 const started=h.startWritingWorkV1({runtime,lessonPlan:lesson,sourceContext:source});const revised=h.recordLearnerWritingRevisionV1({runtime:started,text:'Schools should allow students to use phones for learning.',occurredAt:'2026-08-28T04:01:00.000Z',productionConditions:cleanConditions});const work=h.hydrateWritingWorkV1(revised);assert.equal(work.artifact.revisions.length,2);assert.equal(work.artifact.revisions[0].text,runtime.usableSourceText);assert.equal(work.artifact.revisions[0].immutable,true);assert.equal(h.currentWritingRevisionV1(work).text,'Schools should allow students to use phones for learning.');assert.equal(h.revisionCanProveLearnerProductionV1(h.currentWritingRevisionV1(work)).eligible,true);
});

test('AI suggestion cannot masquerade as learner-authored productive revision',()=>{
 const original=h.createOriginalWritingRevisionV1({revisionId:'r0',originalArtifactId:'a',text:'I think it good.',createdAt:'t0'});const ai=h.createWritingRevisionV1({revisionId:'r1',originalArtifactId:'a',parent:original,text:'I think it is beneficial.',operations:[{operationId:'o1',revisionId:'r1',actor:'AI_SUGGESTION',operation:'REPLACE',before:original.text,after:'I think it is beneficial.',occurredAt:'t1'}],createdAt:'t1'});assert.equal(ai.author,'AI');assert.equal(h.revisionCanProveLearnerProductionV1(ai).eligible,false);
});

test('feedback budget can surface several candidates but never authorizes multiple concurrent teaching targets',()=>{
 const base={targetRefs:['x'],facets:['CONSTRUCTION'],evidenceRefs:[],rubricRelevance:[],possibleBottlenecks:[],learnerIntentRequired:false,confidence:'HIGH'};const result=h.applyWritingFeedbackBudgetV1([{...base,candidateId:'typo',writingDimension:'MECHANICS',impact:'LOW',scope:'TOKEN',reasonCodes:['TYPO']},{...base,candidateId:'task',writingDimension:'TASK_FULFILLMENT',impact:'TASK_BLOCKING',scope:'GLOBAL',reasonCodes:['MISSING_PART']},{...base,candidateId:'org',writingDimension:'ORGANIZATION',impact:'HIGH',scope:'GLOBAL',reasonCodes:['ORDER']}],{maxCandidates:2});assert.deepEqual(result.candidates.map(x=>x.candidateId),['task','org']);assert.equal(result.maxConcurrentTeachingTargets,1);assert.equal(result.hiddenCount,1);
});

test('H provider context exposes bounded writing semantics but keeps D/E/F/C-K authority explicit',()=>{
 const started=h.startWritingWorkV1({runtime,lessonPlan:lesson,sourceContext:source});const ctx=h.writingProviderContextV1(started,lesson);assert.equal(ctx.authority.targetOwner,'D');assert.equal(ctx.authority.teacherActionOwner,'E');assert.equal(ctx.authority.mechanismOwner,'F');assert.equal(ctx.authority.evidenceOwner,'C/K');assert.equal(ctx.originalRevisionId,h.hydrateWritingWorkV1(started).artifact.originalRevisionId);assert.equal(ctx.feedbackBudget.maxConcurrentTeachingTargets,1);
});

test('fresh writing need is answer-safe by default and does not become K evidence itself',()=>{
 const need=h.createWritingTaskGenerationNeedV1({lessonPlan:lesson,source,purpose:'FRESH_CHECK',desiredContextDistance:'SAME_FUNCTION_NEW_CONTENT',responseScope:'SENTENCE',writingFunction:'allow someone to do something',semanticRequirements:['permission'],forbiddenReuse:['Schools should allow students to use phones for learning.']});assert.equal(need.targetNameVisible,false);assert.equal(need.functionCueVisible,false);assert.equal(need.planningSupportAllowed,false);assert.equal(need.recentModelPrimeAllowed,false);assert.equal(need.validAlternatives,'ACCEPT');
});

test('writing analytic observation is explicitly not mastery or exam score authority',()=>{
 const o=h.createWritingAnalyticObservationV1({observationId:'wo1',writingDimension:'ORGANIZATION',statement:'Second paragraph repeats the first without adding a reason.',confidence:'MEDIUM',rubricRefs:['organization'],targetRefs:['writing.organization-cohesion']});assert.equal(o.capabilityClaimAllowed,false);assert.equal(o.examScoreAllowed,false);
});

test('return-original and fresh-writing require a separately delivered validated task',()=>{
 const started=h.startWritingWorkV1({runtime,lessonPlan:lesson,sourceContext:source});assert.throws(()=>h.markWritingFreshV1(started,'t1'),/validated fresh task/);const delivered=h.registerWritingDeliveredTaskV1(started,lesson,{taskId:'fresh-1',promptText:'Should libraries allow visitors to use computers?',targetRef:lesson.targetRef,facet:lesson.facet,purpose:'FRESH_CHECK',desiredContextDistance:'SAME_FUNCTION_NEW_CONTENT',contextNovelty:'SAME_CONTEXT',contextKey:'PUBLIC_LIBRARY',generationRef:'G:test-pack#fresh-1',semanticRequirements:['permission'],deliveredAt:'t1',validated:true,validatorRefs:['G:semantic-validator']});assert.equal(h.writingFreshOpportunityGateV1(delivered,lesson,'ASSESS').allowed,true);assert.equal(h.hydrateWritingWorkV1(delivered).phase,'FRESH_WRITING');const returned=h.markWritingReturnToOriginalV1(delivered,'t2');assert.equal(h.hydrateWritingWorkV1(returned).phase,'RETURN_TO_ORIGINAL');assert.equal(h.currentWritingRevisionV1(h.hydrateWritingWorkV1(returned)).text,runtime.usableSourceText);
});



test('capability catalog does not overclaim H capabilities that still depend on deeper Writing or downstream G/K behavior',()=>{
 const catalog=fromBuild('architecture/capabilityCatalog.js');const caps=Object.fromEntries(catalog.capabilitiesForSubsystemV1('H').map(x=>[x.id,x.implementation_status]));
 for(const id of ['H.sentence-realization','H.meaning-encoding','H.revision','H.return-original','H.fresh-writing-transfer'])assert.equal(caps[id],'FIRST_PASS',id);
 for(const id of ['H.purpose-audience-genre','H.idea-generation','H.reasoning-depth','H.planning','H.organization','H.cohesion','H.feedback-budget','H.local-repair','H.joint-construction','H.writing-evaluation'])assert.equal(caps[id],'CONTRACT_ONLY',id);
});


test('model-primed learner submission is recorded as assisted and cannot masquerade as learner-only revision',()=>{
 const started=h.startWritingWorkV1({runtime,lessonPlan:lesson,sourceContext:source});
 const copied=h.recordLearnerWritingRevisionV1({runtime:started,text:'Schools should allow students to use phones for learning.',occurredAt:'t-model',productionConditions:modelConditions,visibleBeforeResponse:['Schools should allow students to use phones for learning.']});
 const revision=h.currentWritingRevisionV1(h.hydrateWritingWorkV1(copied));
 assert.equal(revision.author,'LEARNER_ASSISTED');assert.equal(revision.operations[0].actor,'LEARNER_ASSISTED');assert.equal(h.revisionCanProveLearnerProductionV1(revision).eligible,false);
});

test('revision records the minimal changed span instead of claiming a full-document replace',()=>{
 const started=h.startWritingWorkV1({runtime,lessonPlan:lesson,sourceContext:source});
 const revised=h.recordLearnerWritingRevisionV1({runtime:started,text:'Schools should allow students to use phones for learning.',occurredAt:'t-diff',productionConditions:cleanConditions});
 const op=h.currentWritingRevisionV1(h.hydrateWritingWorkV1(revised)).operations[0];
 assert.equal(op.operation,'INSERT');assert.equal(op.before,'');assert.equal(op.after,'students ');assert.ok(op.sourceSpan.start>0);
});

test('blank editor or block metadata alone cannot manufacture changed-context transfer',()=>{
 const started=h.startWritingWorkV1({runtime,lessonPlan:lesson,sourceContext:source});
 const gate=h.writingFreshOpportunityGateV1(started,lesson,'TRANSFER');assert.equal(gate.allowed,false);assert.ok(gate.reasons.includes('VALIDATED_FRESH_TASK_NOT_DELIVERED'));
 const sameTask={taskId:'fresh-transfer',promptText:source.promptText,targetRef:lesson.targetRef,facet:lesson.facet,purpose:'CHANGED_CONTEXT_TRANSFER',desiredContextDistance:'CHANGED_TOPIC',contextNovelty:'CHANGED_CONTEXT',contextKey:'PUBLIC_LIBRARY',generationRef:'G:test-pack#transfer',semanticRequirements:['permission'],deliveredAt:'t-transfer',validated:true,validatorRefs:['G:validator']};assert.throws(()=>h.registerWritingDeliveredTaskV1(started,lesson,sameTask),/FRESH_TASK_PROMPT_NOT_NEW/);
 const changed=h.registerWritingDeliveredTaskV1(started,lesson,{...sameTask,promptText:'Should public libraries allow visitors to use computers?'});assert.equal(h.writingFreshOpportunityGateV1(changed,lesson,'TRANSFER').allowed,true);
});

test('confirmed printed prompt refreshes H source truth instead of leaving Teacher on stale OCR prompt',()=>{
 const started=h.startWritingWorkV1({runtime:{...runtime,spans:[{id:'prompt-span',artifactId:'artifact-h',region:'PRINTED_PROMPT',text:'Should school allow phone?',confidence:'LOW',alternatives:['Should schools allow phones?']}],confirmations:[],status:'SOURCE_REVIEW'},lessonPlan:lesson,sourceContext:h.writingSourceFromInputV1({promptArtifactId:'prompt-h',promptText:'Should school allow phone?',productMode:'GENERAL',learnerConfirmed:false,interpretationConfidence:'LOW'})});
 const confirmed={...started,spans:[{...started.spans[0],text:'Should schools allow phones?',confidence:'HIGH',alternatives:[]}],confirmations:[{id:'c1',artifactId:'artifact-h',spanId:'prompt-span',observedText:'Should school allow phone?',confirmedText:'Should schools allow phones?',occurredAt:'2026-08-28T04:02:00.000Z',eventType:'OCR_ERROR_CORRECTED'}],trace:[...started.trace,{id:'t1',occurredAt:'2026-08-28T04:02:00.000Z',kind:'SOURCE_CONFIRMATION',fixture:false,payload:{}}]};
 const refreshed=h.refreshWritingWorkSourceFromSpansV1(confirmed);const work=h.hydrateWritingWorkV1(refreshed);assert.equal(work.sourceContext.promptText,'Should schools allow phones?');assert.equal(work.sourceContext.interpretationConfidence,'HIGH');assert.equal(work.sourceContext.learnerConfirmed,true);
});

test('generated fallback prompt cannot masquerade as learner-confirmed authentic source',()=>{
 assert.throws(()=>h.createWritingSourceContextV1({...source,sourceType:'GENERATED_FALLBACK',learnerConfirmed:true}),/generated fallback prompt/);
});

test('H provider context carries the active validated fresh writing prompt after delivery',()=>{
 const started=h.startWritingWorkV1({runtime,lessonPlan:lesson,sourceContext:source});const prepared=h.prepareWritingFreshTaskForIntentV1({runtime:started,lessonPlan:lesson,intent:'ASSESS',occurredAt:'2026-08-28T06:20:00.000Z'});assert.equal(prepared.status,'READY');const ctx=h.writingProviderContextV1(prepared.runtime,lesson);assert.ok(ctx.activeFreshTask);assert.equal(ctx.activeFreshTask.promptText,h.hydrateWritingWorkV1(prepared.runtime).freshTask.promptText);assert.notEqual(ctx.activeFreshTask.promptText,source.promptText);
});

test('authentic writing diagnosis can produce zero material clusters without copying the D target into a fake issue',()=>{
 const result=h.diagnoseWritingMultiBottlenecksV1({artifactId:'essay-clean',text:'A clear response.',authorizedTargetRef:'writing.organization-cohesion',evidence:[],analysisComplete:true});
 assert.equal(result.status,'NO_MATERIAL_CLUSTER');assert.deepEqual(result.clusters,[]);assert.equal(result.capabilityClaimAllowed,false);
});

test('repeated same-root spans cluster while competing bottlenecks remain distinct and deferred issues survive the budget',()=>{
 const text='People is concerned. The reasons is complex. First, transport matters.';
 const evidence=[
  {evidenceId:'e1',dimension:'GRAMMAR_CONSTRUCTION',sourceSpan:{start:0,end:9},rootIssueHypothesis:'subject verb agreement',impact:'HIGH',confidence:'HIGH',scope:'SENTENCE',reasonCodes:['AGREEMENT'],possibleBottlenecks:['FORM_ASSEMBLY'],targetRefs:['grammar.subject-verb-agreement'],facets:['CONSTRUCTION'],rubricRelevance:['grammar']},
  {evidenceId:'e2',dimension:'GRAMMAR_CONSTRUCTION',sourceSpan:{start:21,end:35},rootIssueHypothesis:'Subject Verb Agreement',impact:'HIGH',confidence:'HIGH',scope:'SENTENCE',reasonCodes:['AGREEMENT_REPEAT'],possibleBottlenecks:['FORM_ASSEMBLY'],targetRefs:['grammar.subject-verb-agreement'],facets:['CONSTRUCTION'],rubricRelevance:['grammar']},
  {evidenceId:'e3',dimension:'ORGANIZATION',sourceSpan:{start:37,end:text.length},rootIssueHypothesis:'reason sequence lacks an explicit controlling relation',impact:'HIGH',confidence:'MEDIUM',scope:'PARAGRAPH',reasonCodes:['RELATION_UNCLEAR'],possibleBottlenecks:['DISCOURSE_PLANNING'],targetRefs:['writing.organization-cohesion'],facets:['SELECTION'],rubricRelevance:['organization']}
 ];
 const result=h.diagnoseWritingMultiBottlenecksV1({artifactId:'essay-multi',text,authorizedTargetRef:'writing.organization-cohesion',evidence,analysisComplete:true,maxVisibleCandidates:1});
 assert.equal(result.status,'CLUSTERS_READY');assert.equal(result.clusters.length,2);assert.equal(result.clusters.find(x=>x.dimension==='GRAMMAR_CONSTRUCTION').evidenceSpans.length,2);assert.equal(result.selectedCandidates.length,1);assert.equal(result.deferredClusterIds.length,1);assert.equal(result.maxConcurrentTeachingTargets,1);
});

test('critical out-of-target writing issue requests D replan and H never silently hijacks authority',()=>{
 const text='This does not answer the required question.';
 const result=h.diagnoseWritingMultiBottlenecksV1({artifactId:'essay-off-task',text,authorizedTargetRef:'grammar.allow-object-infinitive',analysisComplete:true,evidence:[{evidenceId:'e-task',dimension:'TASK_FULFILLMENT',sourceSpan:{start:0,end:text.length},rootIssueHypothesis:'required task component is absent',impact:'TASK_BLOCKING',confidence:'HIGH',scope:'GLOBAL',reasonCodes:['PROMPT_REQUIREMENT_MISSING'],possibleBottlenecks:['TASK_INTERPRETATION'],targetRefs:['writing.task-fulfillment'],facets:['SELECTION'],rubricRelevance:['task fulfillment']}]});
 assert.equal(result.dReplanRequests.length,1);assert.equal(result.dReplanRequests[0].reason,'CRITICAL_OUT_OF_TARGET_ISSUE');assert.equal(result.capabilityClaimAllowed,false);
});
