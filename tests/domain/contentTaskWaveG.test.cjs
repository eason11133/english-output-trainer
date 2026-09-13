const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build-wave-g';
const fromBuild=rel=>require(path.resolve(__dirname,'..','..',build,rel));
const g=fromBuild('content/index.js');
const h=fromBuild('specializations/writing/index.js');
const catalog=fromBuild('architecture/capabilityCatalog.js');

const lesson={id:'lesson-g',learnerId:'learner-g',targetRef:'allow-object-infinitive',facet:'CONSTRUCTION',needKind:'REPAIR',objective:'repair authentic writing',reason:'source writing',reasonCodes:['AUTHENTIC_OUTPUT'],timeBudgetMinutes:10,productMode:'GENERAL'};
const source=h.writingSourceFromInputV1({promptArtifactId:'prompt-g',promptText:'Should schools allow phones for learning?',productMode:'GENERAL',learnerConfirmed:true});
const sourceView={sourceRef:source.promptArtifactId,promptText:source.promptText,audience:source.audience,genre:source.genre};
const freshNeed=h.createWritingTaskGenerationNeedV1({lessonPlan:lesson,source,purpose:'FRESH_CHECK',desiredContextDistance:'SAME_FUNCTION_NEW_CONTENT',responseScope:'SENTENCE',writingFunction:'permission with a specific actor and action',semanticRequirements:['permission','specific actor','action'],forbiddenReuse:[source.promptText],targetNameVisible:false,functionCueVisible:false,planningSupportAllowed:false,recentModelPrimeAllowed:false});
const transferNeed=h.createWritingTaskGenerationNeedV1({lessonPlan:lesson,source,purpose:'CHANGED_CONTEXT_TRANSFER',desiredContextDistance:'CHANGED_TOPIC',responseScope:'SENTENCE',writingFunction:'permission with a specific actor and action',semanticRequirements:['permission','specific actor','action'],forbiddenReuse:[source.promptText],targetNameVisible:false,functionCueVisible:false,planningSupportAllowed:false,recentModelPrimeAllowed:false});

function generated(need=freshNeed){const result=g.generateValidatedWritingTaskV1({runtimeId:'runtime-g',lessonPlan:lesson,source:sourceView,need,occurredAt:'2026-08-28T05:30:00.000Z'});assert.ok(result);return result}

test('G generates a separately identified validated fresh task rather than reusing the authentic prompt',()=>{
 const result=generated();assert.notEqual(result.delivery.promptText,source.promptText);assert.equal(result.delivery.purpose,'FRESH_CHECK');assert.equal(result.delivery.contextNovelty,'SAME_CONTEXT');assert.equal(result.delivery.desiredContextDistance,'SAME_FUNCTION_NEW_CONTENT');assert.equal(result.candidate.validationStatus,'VALIDATED');assert.equal(result.candidate.validAlternatives,'ACCEPT');assert.equal(result.candidate.targetNameVisible,false);assert.ok(result.delivery.taskId.startsWith('g:runtime-g:'));
});

test('changed-context transfer is grounded in a delivered task with an explicit changed-context contract',()=>{
 const result=generated(transferNeed);assert.equal(result.delivery.purpose,'CHANGED_CONTEXT_TRANSFER');assert.equal(result.delivery.contextNovelty,'CHANGED_CONTEXT');assert.equal(result.delivery.desiredContextDistance,'CHANGED_TOPIC');assert.ok(result.delivery.contextKey);assert.ok(result.delivery.generationRef);assert.ok(result.delivery.validatorRefs.includes('G:deterministic-contract-validator-v1'));
});

test('curated provenance is pinned to the reviewed pack content rather than trusted from a caller label',()=>{
 const result=generated();const forged={...result.candidate,promptText:'Write any unrelated sentence.'};const validation=g.validateGeneratedWritingTaskV1({candidate:forged,need:freshNeed,source:sourceView});assert.equal(validation.deliveryAllowed,false);assert.ok(validation.errors.includes('CURATED_PROMPT_CONTENT_MISMATCH'));
});

test('AI proposal cannot self-declare validation and become deliverable in the current wave',()=>{
 const result=generated();const ai={...result.candidate,provenance:'AI_PROPOSAL',contentRef:'model:self',validationStatus:'VALIDATED',validatorRefs:['model:self','G:deterministic-contract-validator-v1']};const validation=g.validateGeneratedWritingTaskV1({candidate:ai,need:freshNeed,source:sourceView});assert.equal(validation.deliveryAllowed,false);assert.ok(validation.errors.includes('AI_PROPOSAL_REQUIRES_INDEPENDENT_SEMANTIC_VALIDATOR'));
});

test('target-form leakage is independently rejected even when a candidate otherwise looks well formed',()=>{
 const result=generated();const target=fromBuild('domain/english/index.js').coreEnglishDomainPortV2.get(lesson.targetRef);assert.ok(target);const leaked={...result.candidate,promptText:`Use ${target.label} in one sentence.`};const validation=g.validateGeneratedWritingTaskV1({candidate:leaked,need:freshNeed,source:sourceView});assert.equal(validation.deliveryAllowed,false);assert.ok(validation.errors.includes('TARGET_FORM_LEAK'));
});

test('forbidden source reuse prevents a fresh task from recycling protected learner/source material',()=>{
 const result=generated();const need={...freshNeed,forbiddenReuse:[result.candidate.promptText]};const validation=g.validateGeneratedWritingTaskV1({candidate:result.candidate,need,source:sourceView});assert.equal(validation.deliveryAllowed,false);assert.ok(validation.errors.includes('FORBIDDEN_REUSE_PRESENT'));
});

test('target, facet and context-distance policy cannot be silently changed by G',()=>{
 const result=generated(transferNeed);const bad={...result.candidate,facet:'FORM',desiredContextDistance:'SAME_FUNCTION_NEW_CONTENT'};const validation=g.validateGeneratedWritingTaskV1({candidate:bad,need:transferNeed,source:sourceView});assert.equal(validation.deliveryAllowed,false);assert.ok(validation.errors.includes('FACET_MISMATCH'));assert.ok(validation.errors.includes('CONTEXT_DISTANCE_POLICY_MISMATCH'));
});

test('unsupported target coverage fails closed instead of inventing an unvalidated task',()=>{
 const unsupportedLesson={...lesson,targetRef:'writing.organization-cohesion'};const unsupportedNeed={...freshNeed,targetRef:'writing.organization-cohesion'};assert.equal(g.generateValidatedWritingTaskV1({runtimeId:'runtime-g',lessonPlan:unsupportedLesson,source:sourceView,need:unsupportedNeed,occurredAt:'t'}),undefined);
});

test('ACTIVE_PRACTICE is not mislabeled as H fresh assessment delivery',()=>{
 const active={...freshNeed,purpose:'ACTIVE_PRACTICE'};assert.equal(g.generateValidatedWritingTaskV1({runtimeId:'runtime-g',lessonPlan:lesson,source:sourceView,need:active,occurredAt:'t'}),undefined);
});

test('task load is explicit and multidimensional rather than inferred from target identity alone',()=>{
 const result=generated();assert.deepEqual(Object.keys(result.candidate.load).sort(),['clauses','contentSupport','ideaGeneration','length','reasoning'].sort());assert.ok(['LOW','MEDIUM','HIGH'].includes(result.candidate.load.reasoning));assert.ok(['LOW','MEDIUM','HIGH'].includes(result.candidate.load.ideaGeneration));
});

test('G capability catalog is intentionally mixed-status and does not claim unbuilt example/distractor/difficulty systems',()=>{
 const caps=Object.fromEntries(catalog.capabilitiesForSubsystemV1('G').map(x=>[x.id,x.implementation_status]));
 for(const id of ['G.prompt-generation','G.fresh-task','G.changed-context','G.semantic-validity','G.valid-alternatives','G.context-relevance','G.generated-validation','G.content-packs'])assert.equal(caps[id],'FIRST_PASS',id);
 for(const id of ['G.examples','G.counterexamples','G.distractors','G.difficulty','G.load','G.content-safety'])assert.equal(caps[id],'CONTRACT_ONLY',id);
});

test('a delivered fresh task is single-use and composition selects a different prompt next time',()=>{
 const runtime={id:'runtime-g-h',learnerId:'learner-g',artifact:{schemaVersion:4,id:'artifact-g-h',learnerId:'learner-g',source:'PASTE',mode:'WRITING',pages:[{page:1,mimeType:'text/plain',originalText:'Schools should allow to use phones.'}],submittedAt:'t0',immutable:true},spans:[],confirmations:[],usableSourceText:'Schools should allow to use phones.',status:'READY',blockEvents:[],observations:[],evidenceCandidates:[],trace:[]};
 const started=h.startWritingWorkV1({runtime,lessonPlan:lesson,sourceContext:source});
 const first=h.prepareWritingFreshTaskForIntentV1({runtime:started,lessonPlan:lesson,intent:'ASSESS',occurredAt:'t1'});assert.equal(first.status,'READY');const firstWork=h.hydrateWritingWorkV1(first.runtime);assert.ok(firstWork?.freshTask);
 const firstPrompt=firstWork.freshTask.promptText;const consumed=h.consumeWritingFreshTaskV1(first.runtime,'t2');assert.equal(h.writingFreshOpportunityGateV1(consumed,lesson,'ASSESS').allowed,false);
 const second=h.prepareWritingFreshTaskForIntentV1({runtime:consumed,lessonPlan:lesson,intent:'ASSESS',occurredAt:'t3'});assert.equal(second.status,'READY');const secondWork=h.hydrateWritingWorkV1(second.runtime);assert.ok(secondWork?.freshTask);assert.notEqual(secondWork.freshTask.taskId,firstWork.freshTask.taskId);assert.notEqual(secondWork.freshTask.promptText,firstPrompt);
});

test('fresh assessment and transfer map to truthful TaskContract purposes',()=>{
 const task=fromBuild('domain/task/TaskContract.js');
 assert.equal(task.taskPurposeForPedagogicalIntentV1('ASSESS'),'DIAGNOSTIC');
 assert.equal(task.taskPurposeForPedagogicalIntentV1('TRANSFER'),'TRANSFER');
 assert.equal(task.taskPurposeForPedagogicalIntentV1('PRACTICE'),'PRACTICE');
 assert.equal(task.taskPurposeForPedagogicalIntentV1('TEACH'),'LEARNING');
 assert.equal(task.taskPurposeForPedagogicalIntentV1('RETURN'),'SOURCE_WORK');
});

const authenticLoad={length:'HIGH',reasoning:'MEDIUM',ideaGeneration:'HIGH',contentSupport:'NONE',clauses:3,planningSupport:'NONE',languageSupport:'NONE',selectionSupport:'NONE',functionCue:'NONE',recentModelPrime:'NONE'};
test('shared G delivery request preserves D target and explicit load/assistance dimensions',()=>{
 const trajectory=g.createActivePracticeTrajectoryV1({runtimeId:'active-g',lessonPlan:lesson,arena:'WRITING',sourceIdentity:'prompt-authentic',sourcePrompt:source.promptText,semanticRequirements:['permission','specific actor','action'],authenticLoad,provenanceRefs:['Q:prompt-authentic'],occurredAt:'t1'});assert.ok(trajectory);
 const first=trajectory.steps[0];assert.equal(first.targetRef,lesson.targetRef);assert.equal(first.facet,lesson.facet);assert.equal(first.purpose,'ACTIVE_PRACTICE');assert.equal(first.answerExposure,'NONE');assert.equal(first.measurementIntent,'PRACTICE_ACCESS_ONLY');
 assert.deepEqual(Object.keys(first.load).sort(),['length','reasoning','ideaGeneration','contentSupport','clauses','planningSupport','languageSupport','selectionSupport','functionCue','recentModelPrime'].sort());
 assert.ok(first.loadDelta.length>0);assert.ok(first.loadDelta.every(x=>x.targetRequirementPreserved));
});

test('shared delivery fails closed for unsupported targets and DATA_CANDIDATE_ONLY content',()=>{
 const request={requestId:'bad',lessonPlanId:lesson.id,targetRef:'writing.organization-cohesion',facet:'CONSTRUCTION',arena:'WRITING',purpose:'ACTIVE_PRACTICE',semanticRequirements:['organization'],contentRequirement:'x',context:{sourceIdentity:'p',requiredNovelty:'NEW_CONTENT'},authenticLoad,requestedLoad:authenticLoad,loadDelta:[],answerExposure:'NONE',assistanceCeiling:{language:'NONE',selection:'NONE',functionCue:'NONE',planning:'NONE',recentModelPrime:'NONE'},provenanceRequirements:['Q:p'],measurementIntent:'PRACTICE_ACCESS_ONLY',forbiddenContentRefs:[]};
 assert.equal(g.deliverSharedWritingRequestV1({request,sourcePrompt:'x',occurredAt:'t'}),undefined);
});

test('active-practice golden trajectory re-adds demand and only authentic redeploy may reach C/K qualification',()=>{
 let trajectory=g.createActivePracticeTrajectoryV1({runtimeId:'golden-g',lessonPlan:lesson,arena:'WRITING',sourceIdentity:'prompt-authentic',sourcePrompt:source.promptText,semanticRequirements:['permission','specific actor','action'],authenticLoad,provenanceRefs:['Q:prompt-authentic'],occurredAt:'t1'});assert.ok(trajectory);
 let firewall=g.activePracticeEvidenceCeilingV1(trajectory);assert.equal(firewall.mayCommitIndependent,false);assert.equal(firewall.mayCommitTransfer,false);assert.equal(firewall.mayCommitRetention,false);
 trajectory=g.advanceActivePracticeTrajectoryV1(trajectory,'SUCCESS');assert.equal(trajectory.currentStep,1);assert.ok(trajectory.steps[1].loadDelta.length>0);assert.equal(g.activePracticeEvidenceCeilingV1(trajectory).mayCommitIndependent,false);
 trajectory=g.advanceActivePracticeTrajectoryV1(trajectory,'SUCCESS');assert.equal(trajectory.status,'READY_FOR_AUTHENTIC_REDEPLOY');assert.equal(trajectory.steps[2].contextNovelty,'AUTHENTIC_SOURCE');assert.equal(g.activePracticeEvidenceCeilingV1(trajectory).mayCommitIndependent,true);
 trajectory=g.advanceActivePracticeTrajectoryV1(trajectory,'SUCCESS');assert.equal(trajectory.status,'COMPLETE');
});

test('reduced-load failure holds load and requests F replan without manufacturing truth',()=>{
 const trajectory=g.createActivePracticeTrajectoryV1({runtimeId:'failure-g',lessonPlan:lesson,arena:'WRITING',sourceIdentity:'prompt-authentic',sourcePrompt:source.promptText,semanticRequirements:['permission','specific actor','action'],authenticLoad,provenanceRefs:['Q:prompt-authentic'],occurredAt:'t1'});assert.ok(trajectory);
 const failed=g.advanceActivePracticeTrajectoryV1(trajectory,'FAILURE');assert.equal(failed.status,'REPLAN_REQUIRED');assert.equal(failed.currentStep,0);assert.equal(g.activePracticeEvidenceCeilingV1(failed).mayCommitIndependent,false);
});

test('Writing production coordinator consumes shared G trajectory after authentic high-load failure',()=>{
 const runtime={id:'runtime-production-active',learnerId:'learner-g',artifact:{schemaVersion:4,id:'artifact-active',learnerId:'learner-g',source:'PASTE',mode:'WRITING',pages:[{page:1,mimeType:'text/plain',originalText:'Schools should allow to use phones.'}],submittedAt:'t0',immutable:true},spans:[],confirmations:[],usableSourceText:'Schools should allow to use phones.',status:'READY',blockEvents:[{id:'event-high-failure',instanceId:'block-1',type:'ANSWER_SUBMITTED',payload:{pedagogicalOutcome:'FAILURE'},supportLevel:'NONE',visibleBeforeResponse:[],occurredAt:'t1',productionConditions:{elicitation:'AUTHENTIC_TASK',context:'SOURCE',taskLoad:'HIGH',assistance:{language:'NONE',selection:'NONE',functionCue:'NONE',planning:'NONE',taskLoad:'NONE',recentModelPrime:'NONE'}}}],observations:[],evidenceCandidates:[],trace:[]};
 const started=h.startWritingWorkV1({runtime,lessonPlan:lesson,sourceContext:source});const delivered=h.transitionWritingActivePracticeV1({runtime:started,lessonPlan:lesson,outcome:'FAILURE',priorCapabilityState:'INDEPENDENT_LOCAL_CONTROL',occurredAt:'t2'});assert.equal(delivered.status,'DELIVERED');
 const active=h.currentWritingActivePracticeV1(delivered.runtime);assert.ok(active);assert.equal(active.delivery.purpose,'ACTIVE_PRACTICE');assert.equal(active.firewall.mayCommitIndependent,false);
 const advanced=h.transitionWritingActivePracticeV1({runtime:delivered.runtime,lessonPlan:lesson,outcome:'SUCCESS',priorCapabilityState:'INDEPENDENT_LOCAL_CONTROL',occurredAt:'t3'});assert.equal(advanced.status,'ADVANCED');assert.equal(h.currentWritingActivePracticeV1(advanced.runtime).trajectory.currentStep,1);
});
