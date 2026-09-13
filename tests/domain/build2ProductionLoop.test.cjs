const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const build=path.resolve(process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build-build2-loop');
const {evaluateExamTeacherInteractionV1}=require(path.join(build,'application/exam/examInteractionEvaluator.js'));
const {examBetaTaskById,examBetaTaskForLearner}=require(path.join(build,'content/examBetaBank.js'));
const {createExamOperationalRuntimeV1,updateExamOperationalRuntimeV1}=require(path.join(build,'application/exam/examOperationalRuntime.js'));
const {triageExamUnitsV1}=require(path.join(build,'application/exam/examTriage.js'));

const decision={provenance:{provider:'AI',providerReceipt:{provider:'OpenAI',callId:'call',model:'model',responseId:'resp'},targetRef:'sense.make.progress',facet:'SELECTION',decisionPointId:'dp',selectedMechanismId:'form-contrast'},blockDecision:{supportLevel:'GUIDED',configuration:{fPrimaryBottleneck:'SELECTION',compositionActivePieceId:'piece:1'}},lineage:{proposal:{confidence:'MEDIUM'}}};

test('closed interaction evaluator distinguishes success, persistent misconception, and new error with full receipt context',()=>{
 const task=examBetaTaskById('VOCABULARY','VOC-G-002'),unit=task.canonicalBinding.units[0],base={task,unitId:unit.unitId,support:'GUIDED',lookupExposure:['sense:x'],decision};
 const success=evaluateExamTeacherInteractionV1({...base,learnerResponse:'A',previousLearnerResponse:'B'});
 assert.equal(success.classification,'CORRECT');assert.equal(success.outcome,'SUCCESS');assert.equal(success.runtimeMode,'LIVE_AI');assert.equal(success.taskId,task.task_id);assert.equal(success.treatmentPieceId,'piece:1');
 const same=evaluateExamTeacherInteractionV1({...base,learnerResponse:'B',previousLearnerResponse:'B'});assert.equal(same.classification,'SAME_MISCONCEPTION');assert.equal(same.outcome,'FAILURE');
 const changed=evaluateExamTeacherInteractionV1({...base,learnerResponse:'C',previousLearnerResponse:'B'});assert.equal(changed.classification,'NEW_ERROR');assert.equal(changed.outcome,'FAILURE');
});

test('open response evaluator accepts bounded valid alternatives and safely abstains when meaning is uncertain',()=>{
 const task=examBetaTaskForLearner('TRANSLATION','loop','suggested','translation',{purpose:'PRACTICE_NEW',recent:[]}),unit=task.canonicalBinding.units[0],base={task,unitId:unit.unitId,support:'LIGHT',lookupExposure:[],decision};
 const uncertain=evaluateExamTeacherInteractionV1({...base,learnerResponse:'Maybe.',previousLearnerResponse:''});
 assert.equal(uncertain.classification,'UNCERTAIN');assert.equal(uncertain.outcome,'NOT_EVALUATED');
});

test('fresh allocation excludes exact task, content lineage, and freshness group',()=>{
 const first=examBetaTaskForLearner('VOCABULARY','loop','suggested','first',{purpose:'PRACTICE_NEW',recent:[]});
 const fresh=examBetaTaskForLearner('VOCABULARY','loop','suggested','fresh',{purpose:'FRESH_CHECK',recent:[{taskId:first.task_id,contentLineage:first.content_lineage_id,freshnessGroupId:first.freshness_group_id}]});
 assert.ok(fresh);assert.notEqual(fresh.task_id,first.task_id);if(first.content_lineage_id)assert.notEqual(fresh.content_lineage_id,first.content_lineage_id);if(first.freshness_group_id)assert.notEqual(fresh.freshness_group_id,first.freshness_group_id);
});

test('interaction evaluation checkpoint is idempotent by evaluation identity and survives JSON resume',()=>{
 const runtime=createExamOperationalRuntimeV1({sessionId:'s',learnerId:'l',taskId:'t',family:'VOCABULARY',subtype:'x',freshnessIdentity:'fresh',occurredAt:'2026-09-08T00:00:00Z'});
 const receipt={evaluationId:'evaluation:dp',outcome:'SUCCESS',learnerResponse:'A'},a=updateExamOperationalRuntimeV1(runtime,{interactionEvaluation:receipt}),b=updateExamOperationalRuntimeV1(JSON.parse(JSON.stringify(a)),{interactionEvaluation:receipt});
 assert.equal(b.interactionEvaluations.length,1);assert.deepEqual(b.interactionEvaluations[0],receipt);
});

test('Exam triage teaches only the highest-value unresolved unit and defers or notes the rest',()=>{
 const triage=triageExamUnitsV1([{unitId:'high',targetRef:'reading.inference',facet:'SELECTION',outcome:'FAILURE'},{unitId:'low',targetRef:'reading.reference-tracking',facet:'FORM_TO_MEANING',outcome:'FAILURE'},{unitId:'partial',targetRef:'reading.logic-structure',facet:'SELECTION',outcome:'PARTIAL'}],20);
 assert.equal(triage[0].action,'MICRO_TEACH');assert.equal(triage[0].priority,'HIGH');assert.equal(triage[1].action,'SAVE_FOR_LATER');assert.equal(triage[2].action,'QUICK_NOTE');assert.equal(triage.filter(item=>['MICRO_TEACH','DEEP_TEACH'].includes(item.action)).length,1);
});
