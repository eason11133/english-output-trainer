const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');

const source=fs.readFileSync(path.join(__dirname,'../src/persistence/operationalSchema.ts'),'utf8');
const match=/export const U1_SCHEMA_SQL=`([\s\S]*?)`;/.exec(source);
assert(match,'schema SQL export missing');
const db=new DatabaseSync(':memory:');db.exec(match[1]);
const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(row=>row.name);
assert(tables.length>=26,`expected coherent U1 schema, got ${tables.length} tables`);

const now='2026-08-28T00:00:00.000Z',learner='learner-u1';
db.prepare('INSERT INTO schema_migrations(version,checksum,applied_at) VALUES(?,?,?)').run(1,'u1-2026-08-28-schema-1-final',now);
assert.equal(db.prepare('SELECT count(*) n FROM schema_migrations').get().n,1);
db.prepare('INSERT INTO learner_identities VALUES(?,?,?)').run(learner,now,now);
const persistedNeed={schemaVersion:1,needId:'retention:learner-u1:allow:construction:no-sense:proof-1',learnerId:learner,targetRef:'allow-object-infinitive',facet:'CONSTRUCTION',state:'DEFERRED',dueAt:'2026-09-04T00:00:00.000Z',updatedAt:now};
db.prepare('INSERT INTO durable_retention_needs(need_id,learner_id,target_ref,facet,sense_id,lifecycle_state,due_at,need_json,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').run(persistedNeed.needId,learner,persistedNeed.targetRef,persistedNeed.facet,null,persistedNeed.state,persistedNeed.dueAt,JSON.stringify(persistedNeed),now);
db.prepare('INSERT INTO durable_retention_needs(need_id,learner_id,target_ref,facet,sense_id,lifecycle_state,due_at,need_json,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(need_id) DO UPDATE SET need_json=excluded.need_json').run(persistedNeed.needId,learner,persistedNeed.targetRef,persistedNeed.facet,null,persistedNeed.state,persistedNeed.dueAt,JSON.stringify(persistedNeed),now);
assert.equal(db.prepare('SELECT count(*) n FROM durable_retention_needs WHERE learner_id=? AND need_id=?').get(learner,persistedNeed.needId).n,1);
assert.equal(JSON.parse(db.prepare('SELECT need_json FROM durable_retention_needs WHERE need_id=?').get(persistedNeed.needId).need_json).state,'DEFERRED');

const stable=value=>value===null||typeof value!=='object'?JSON.stringify(value):Array.isArray(value)?`[${value.map(stable).join(',')}]`:`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
const reviewSemantics=review=>({schemaVersion:review.schemaVersion,reviewId:review.id,learnerId:review.learnerId,originalAttemptId:review.originalAttemptId,originalAttemptSnapshot:review.originalAttemptSnapshot,passage:review.passage,question:review.question,submittedAnswer:review.submittedAnswer,assessment:review.assessment,focus:review.focus,lessonPlan:review.lessonPlan,immutable:review.immutable});
db.prepare('INSERT INTO reading_attempt_checkpoints VALUES(?,?,?,?)').run('reading-attempt-u1',learner,JSON.stringify({id:'reading-attempt-u1',immutableSubmit:true,resultCommittedAt:now}),now);
const canonicalReview={schemaVersion:1,id:'reading-review-u1',learnerId:learner,originalAttemptId:'reading-attempt-u1',originalAttemptSnapshot:'{"id":"reading-attempt-u1"}',passage:'Passage',question:'Question',submittedAnswer:'Answer',assessment:{mode:'PRACTICE',submittedAt:now,resultCommittedAt:now},focus:{questionId:'q1',kind:'INFERENCE_BRIDGE',anchorText:'anchor',reasonRef:'learner'},lessonPlan:{id:'lesson:reading-review:reading-review-u1',learnerId:learner,targetRef:'reading.inference',facet:'SELECTION',needKind:'REPAIR',objective:'reason from evidence',reason:'POST_ATTEMPT_REVIEW',reasonCodes:['COMMITTED_READING_RESULT'],timeBudgetMinutes:12,productMode:'GENERAL'},immutable:true};
function saveImmutableReview(review){const prior=db.prepare('SELECT review_json FROM reading_review_checkpoints WHERE review_id=?').get(review.id);if(prior){if(stable(reviewSemantics(JSON.parse(prior.review_json)))!==stable(reviewSemantics(review)))throw new Error('canonical_reading_review_is_immutable');return}db.prepare('INSERT INTO reading_review_checkpoints VALUES(?,?,?,?,?)').run(review.id,review.learnerId,review.originalAttemptId,JSON.stringify(review),now)}
saveImmutableReview(canonicalReview);
saveImmutableReview({immutable:true,lessonPlan:{...canonicalReview.lessonPlan},focus:{...canonicalReview.focus},assessment:{...canonicalReview.assessment},submittedAnswer:canonicalReview.submittedAnswer,question:canonicalReview.question,passage:canonicalReview.passage,originalAttemptSnapshot:canonicalReview.originalAttemptSnapshot,originalAttemptId:canonicalReview.originalAttemptId,learnerId:canonicalReview.learnerId,id:canonicalReview.id,schemaVersion:1});
assert.equal(db.prepare('SELECT count(*) n FROM reading_review_checkpoints WHERE review_id=?').get(canonicalReview.id).n,1);
assert.throws(()=>saveImmutableReview({...canonicalReview,focus:{...canonicalReview.focus,anchorText:'changed'}}),/canonical_reading_review_is_immutable/);
assert.throws(()=>saveImmutableReview({...canonicalReview,originalAttemptSnapshot:'changed'}),/canonical_reading_review_is_immutable/);
assert.throws(()=>saveImmutableReview({...canonicalReview,lessonPlan:{...canonicalReview.lessonPlan,timeBudgetMinutes:13}}),/canonical_reading_review_is_immutable/);
for(const file of ['readingAttemptStore.native.ts','readingAttemptStore.web.ts']){const storeSource=fs.readFileSync(path.join(__dirname,'../src/persistence',file),'utf8');assert.match(storeSource,/assertCanonicalReadingReviewReplayV1/);assert.doesNotMatch(storeSource,/ON CONFLICT\(review_id\) DO UPDATE SET review_json/)}

function commitOperation(operationId,fingerprint,write){
  const prior=db.prepare('SELECT input_fingerprint,result_json FROM idempotency_records WHERE operation_id=?').get(operationId);
  if(prior){if(prior.input_fingerprint!==fingerprint)throw new Error('idempotency_fingerprint_conflict');return JSON.parse(prior.result_json)}
  db.exec('BEGIN IMMEDIATE');try{write();const result={operationId,entityId:operationId,status:'COMMITTED'};db.prepare('INSERT INTO idempotency_records VALUES(?,?,?,?,?,?,?)').run(operationId,learner,fingerprint,'TEST',operationId,JSON.stringify(result),now);db.exec('COMMIT');return result}catch(error){db.exec('ROLLBACK');throw error}
}
commitOperation('op-1','fp-1',()=>db.prepare('INSERT INTO product_profile_revisions VALUES(?,?,?,?,?)').run('r1',learner,1,'{}',now));
commitOperation('op-1','fp-1',()=>assert.fail('replay executed write'));
assert.throws(()=>commitOperation('op-1','changed',()=>{}),/idempotency_fingerprint_conflict/);
assert.throws(()=>commitOperation('op-rollback','fp',()=>{db.prepare('INSERT INTO product_profile_revisions VALUES(?,?,?,?,?)').run('rollback-row',learner,2,'{}',now);throw new Error('forced')}),/forced/);
assert.equal(db.prepare("SELECT count(*) n FROM product_profile_revisions WHERE revision_id='rollback-row'").get().n,0);

db.prepare('INSERT INTO artifact_objects VALUES(?,?,?,?,?,?,?)').run('sha256:abc','abc',3,'text/plain','file:///durable/abc',now,'AVAILABLE');
db.prepare('INSERT INTO artifact_intakes VALUES(?,?,?,?,?,?,?,?,?)').run('artifact-1',learner,'sha256:abc','PASTE','WRITING',null,'{}',now,1);
db.prepare('INSERT INTO artifact_versions VALUES(?,?,?,?,?,?,?)').run('version-1','artifact-1','LEARNER','abc','{"text":"mine"}',now,1);
assert.equal(db.prepare('SELECT immutable FROM artifact_versions WHERE version_id=?').get('version-1').immutable,1);

db.prepare('INSERT INTO lesson_plan_snapshots VALUES(?,?,?,?,?,?,?,?)').run('plan-snapshot','plan-1',learner,1,'{"id":"plan-1"}','plan-hash',now,'D');
db.prepare('INSERT INTO lesson_sessions VALUES(?,?,?,?,?,?,?,?,?)').run('session-1',learner,'plan-snapshot','artifact-1','LEARNING','{}',now,now,null);
assert.equal(db.prepare('SELECT lesson_plan_snapshot_id id FROM lesson_sessions WHERE session_id=?').get('session-1').id,'plan-snapshot');

db.prepare('INSERT INTO observations VALUES(?,?,?,?,?,?,?,?,?,?,?)').run('obs-1',learner,'session-1','artifact-1','task-1',now,'LEARNER_ACTION','LEARNER','submit','{}',1);
db.prepare('INSERT INTO production_conditions VALUES(?,?,?,?,?,?,?,?,?,?,?)').run('obs-1','TARGET_NAMED','ASSISTED','NONE',0,1,'model-1','SOURCE',0,'task-1','opp-1');
db.prepare('INSERT INTO evaluation_runs VALUES(?,?,?,?,?,?,?)').run('eval-rejected','obs-1','K-evaluator','1','{}',now,'K');
db.prepare('INSERT INTO evidence_candidates VALUES(?,?,?,?,?)').run('candidate-rejected','eval-rejected','{}',now,1);
db.prepare('INSERT INTO evidence_admissions VALUES(?,?,?,?,?,?,?)').run('admission-rejected','candidate-rejected',0,'["TARGET_NAMED"]','C/K',now,1);
assert.equal(db.prepare('SELECT count(*) n FROM canonical_evidence').get().n,0);

db.prepare('INSERT INTO evaluation_runs VALUES(?,?,?,?,?,?,?)').run('eval-ok','obs-1','K-evaluator','1','{}',now,'K');
db.prepare('INSERT INTO evidence_candidates VALUES(?,?,?,?,?)').run('candidate-ok','eval-ok','{}',now,1);
db.prepare('INSERT INTO evidence_admissions VALUES(?,?,?,?,?,?,?)').run('admission-ok','candidate-ok',1,'[]','C/K',now,1);
db.prepare('INSERT INTO canonical_evidence VALUES(?,?,?,?,?,?,?,?)').run('evidence-1',learner,'admission-ok','obs-1:target',now,'{}',1,'C');
assert.equal(db.prepare('SELECT count(*) n FROM canonical_evidence').get().n,1);
assert.equal(db.prepare('SELECT count(*) n FROM canonical_evidence').get().n,1);

// Simulate the native crash window: evidence commit succeeds, process dies before the next Teacher step,
// then the same learner action is replayed with newly generated observation/evaluation IDs.
// A durable action operation id must replay the committed transaction instead of writing a second chain.
const actionIdentity=response=>`lesson-action:sha256:${createHash('sha256').update(JSON.stringify({blockInstanceId:'block-1',decisionPointId:'point-1',eventType:'ANSWER_SUBMITTED',response,runtimeId:'session-1',schemaVersion:2,taskId:'task-1'})).digest('hex')}`;
const firstAnswer='answer-n98sdp-11lkl3j',secondAnswer='answer-1v047b3-1bzblp';
const replayActionOperationId=`evidence:${actionIdentity(firstAnswer)}`;
const replaySemanticFingerprint=createHash('sha256').update(`semantic:${firstAnswer}`).digest('hex');
assert.notEqual(actionIdentity(firstAnswer),actionIdentity(secondAnswer));
commitOperation(replayActionOperationId,replaySemanticFingerprint,()=>{
  db.prepare('INSERT INTO observations VALUES(?,?,?,?,?,?,?,?,?,?,?)').run('obs-action-first',learner,'session-1','artifact-1','task-1',now,'LEARNER_ACTION','LEARNER','submit','{}',1);
  db.prepare('INSERT INTO production_conditions VALUES(?,?,?,?,?,?,?,?,?,?,?)').run('obs-action-first','AUTHENTIC','NONE','NONE',0,0,null,'SOURCE',1,'task-1',actionIdentity(firstAnswer));
  db.prepare('INSERT INTO evaluation_runs VALUES(?,?,?,?,?,?,?)').run('eval-action-first','obs-action-first','K-evaluator','1','{}',now,'K');
  db.prepare('INSERT INTO evidence_candidates VALUES(?,?,?,?,?)').run('candidate-action-first','eval-action-first','{}',now,1);
  db.prepare('INSERT INTO evidence_admissions VALUES(?,?,?,?,?,?,?)').run('admission-action-first','candidate-action-first',1,'[]','C/K',now,1);
  db.prepare('INSERT INTO canonical_evidence VALUES(?,?,?,?,?,?,?,?)').run('evidence-action-first',learner,'admission-action-first','action-dedup-key',now,'{}',1,'C');
  db.prepare('UPDATE lesson_sessions SET runtime_json=?,updated_at=? WHERE session_id=?').run(JSON.stringify({blockEvents:[{id:'obs-action-first',payload:{actionIdentity:actionIdentity(firstAnswer),response:firstAnswer}}],pendingTeacherContinuation:{schemaVersion:1,continuationId:`teacher-continuation:${actionIdentity(firstAnswer)}`,actionIdentity:actionIdentity(firstAnswer),eventId:'obs-action-first',status:'PENDING'}}),now,'session-1');
});
const evidenceBeforeReplay=db.prepare('SELECT count(*) n FROM canonical_evidence').get().n;
commitOperation(replayActionOperationId,replaySemanticFingerprint,()=>{
  assert.fail('process-death replay must not execute a second evidence write even when retry would generate new row ids');
});
assert.equal(db.prepare('SELECT count(*) n FROM canonical_evidence').get().n,evidenceBeforeReplay);
assert.equal(JSON.parse(db.prepare('SELECT runtime_json FROM lesson_sessions WHERE session_id=?').get('session-1').runtime_json).blockEvents.length,1);

// Recovery requires no learner resubmit: the persisted pending event enters the same Teacher
// decision path, and decision lineage plus the checkpoint that clears pending commit atomically.
const pendingAfterRestart=JSON.parse(db.prepare('SELECT runtime_json FROM lesson_sessions WHERE session_id=?').get('session-1').runtime_json);
assert.equal(pendingAfterRestart.pendingTeacherContinuation.eventId,'obs-action-first');
const teacherContinuationOperationId='teacher:session-1:obs-action-first',teacherContinuationFingerprint=createHash('sha256').update('qualified-decision-for-obs-action-first').digest('hex');
commitOperation(teacherContinuationOperationId,teacherContinuationFingerprint,()=>{
  db.prepare('INSERT INTO teacher_context_snapshots VALUES(?,?,?,?,?,?,?)').run('context-continuation',learner,'plan-snapshot','{}','context-continuation-hash',now,'E');
  db.prepare('INSERT INTO model_runs VALUES(?,?,?,?,?,?,?,?,?)').run('model-continuation','context-continuation','provider','model','prompt-v1','request-continuation-hash','response-continuation-hash','SUCCEEDED',now);
  db.prepare('INSERT INTO teacher_proposals VALUES(?,?,?,?,?)').run('proposal-continuation','model-continuation','{}',now,1);
  db.prepare('INSERT INTO qualifications VALUES(?,?,?,?,?,?,?)').run('qualification-continuation','proposal-continuation',1,'[]','validator-v1','E',now);
  db.prepare('INSERT INTO qualified_teacher_decisions VALUES(?,?,?,?,?,?)').run('decision-continuation','qualification-continuation','obs-action-first','{"selectedBlockId":"guided-sentence-builder"}','E',now);
  db.prepare('INSERT INTO experience_contracts VALUES(?,?,?,?,?,?)').run('contract-continuation','decision-continuation','{}','N/E',now,1);
  db.prepare('INSERT INTO experience_executions VALUES(?,?,?,?,?,?)').run('execution-continuation','contract-continuation',teacherContinuationOperationId,'COMPLETED','{}',now);
  db.prepare('UPDATE lesson_sessions SET runtime_json=?,updated_at=? WHERE session_id=?').run(JSON.stringify({blockEvents:pendingAfterRestart.blockEvents,decision:{configuration:{decisionPointId:'obs-action-first'},selectedBlockId:'guided-sentence-builder'}}),now,'session-1');
});
const decisionCountAfterRecovery=db.prepare("SELECT count(*) n FROM qualified_teacher_decisions WHERE decision_point_id='obs-action-first'").get().n;
commitOperation(teacherContinuationOperationId,teacherContinuationFingerprint,()=>assert.fail('completed Teacher continuation replay must not create duplicate lineage'));
const restoredAfterRepeatedRestart=JSON.parse(db.prepare('SELECT runtime_json FROM lesson_sessions WHERE session_id=?').get('session-1').runtime_json);
assert.equal(restoredAfterRepeatedRestart.pendingTeacherContinuation,undefined);
assert.equal(db.prepare("SELECT count(*) n FROM qualified_teacher_decisions WHERE decision_point_id='obs-action-first'").get().n,decisionCountAfterRecovery);
assert.equal(db.prepare('SELECT count(*) n FROM canonical_evidence').get().n,evidenceBeforeReplay);

const newActionOperationId=`evidence:${actionIdentity(secondAnswer)}`;
commitOperation(newActionOperationId,createHash('sha256').update(`semantic:${secondAnswer}`).digest('hex'),()=>{
  db.prepare('INSERT INTO observations VALUES(?,?,?,?,?,?,?,?,?,?,?)').run('obs-action-second',learner,'session-1','artifact-1','task-1',now,'LEARNER_ACTION','LEARNER','submit','{}',1);
  db.prepare('INSERT INTO production_conditions VALUES(?,?,?,?,?,?,?,?,?,?,?)').run('obs-action-second','AUTHENTIC','NONE','NONE',0,0,null,'SOURCE',1,'task-1',actionIdentity(secondAnswer));
  db.prepare('INSERT INTO evaluation_runs VALUES(?,?,?,?,?,?,?)').run('eval-action-second','obs-action-second','K-evaluator','1','{}',now,'K');
  db.prepare('INSERT INTO evidence_candidates VALUES(?,?,?,?,?)').run('candidate-action-second','eval-action-second','{}',now,1);
  db.prepare('INSERT INTO evidence_admissions VALUES(?,?,?,?,?,?,?)').run('admission-action-second','candidate-action-second',1,'[]','C/K',now,1);
  db.prepare('INSERT INTO canonical_evidence VALUES(?,?,?,?,?,?,?,?)').run('evidence-action-second',learner,'admission-action-second','action-dedup-key-second',now,'{}',1,'C');
  db.prepare('UPDATE lesson_sessions SET runtime_json=?,updated_at=? WHERE session_id=?').run(JSON.stringify({blockEvents:[{payload:{actionIdentity:actionIdentity(firstAnswer),response:firstAnswer}},{payload:{actionIdentity:actionIdentity(secondAnswer),response:secondAnswer}}]}),now,'session-1');
});
assert.equal(db.prepare('SELECT count(*) n FROM canonical_evidence').get().n,evidenceBeforeReplay+1);
assert.equal(JSON.parse(db.prepare('SELECT runtime_json FROM lesson_sessions WHERE session_id=?').get('session-1').runtime_json).blockEvents.length,2);

db.prepare('INSERT INTO teacher_context_snapshots VALUES(?,?,?,?,?,?,?)').run('context-1',learner,'plan-snapshot','{}','context-hash',now,'E');
db.prepare('INSERT INTO model_runs VALUES(?,?,?,?,?,?,?,?,?)').run('model-1','context-1','provider','model','prompt-v1','request-hash','response-hash','SUCCEEDED',now);
db.prepare('INSERT INTO teacher_proposals VALUES(?,?,?,?,?)').run('proposal-1','model-1','{}',now,1);
db.prepare('INSERT INTO qualifications VALUES(?,?,?,?,?,?,?)').run('qualification-1','proposal-1',1,'[]','validator-v1','E',now);
db.prepare('INSERT INTO qualified_teacher_decisions VALUES(?,?,?,?,?,?)').run('decision-1','qualification-1','decision-point-1','{}','E',now);
db.prepare('INSERT INTO experience_contracts VALUES(?,?,?,?,?,?)').run('contract-1','decision-1','{}','N/E',now,1);
db.prepare('INSERT INTO experience_executions VALUES(?,?,?,?,?,?)').run('execution-1','contract-1','teacher-op-1','COMPLETED','{}',now);
db.prepare('INSERT INTO teaching_episodes VALUES(?,?,?,?,?,?,?,?)').run('episode-1',learner,'session-1','target','FORM','ACTIVE',now,now);
db.prepare('INSERT INTO teaching_moves VALUES(?,?,?,?,?,?,?)').run('move-1','episode-1','decision-1','mechanism','LIGHT',now,'F');
db.prepare('INSERT INTO treatment_responses VALUES(?,?,?,?,?,?)').run('response-1','move-1','obs-1','{"outcome":"SUCCESS"}',now,1);
assert.equal(db.prepare('SELECT count(*) n FROM treatment_responses tr JOIN teaching_moves tm ON tm.move_id=tr.move_id JOIN teaching_episodes te ON te.episode_id=tm.episode_id WHERE te.learner_id=? AND te.target_ref=?').get(learner,'target').n,1);

db.exec('PRAGMA foreign_keys=ON');
assert.throws(()=>db.prepare('DELETE FROM artifact_objects WHERE object_id=?').run('sha256:abc'),/FOREIGN KEY/);
const projection=db.prepare('SELECT count(*) evidence_count FROM canonical_evidence WHERE learner_id=?').get(learner);
assert.equal(projection.evidence_count,3);

console.log(JSON.stringify({status:'PASS',tables:tables.length,checks:['schema','migration-bookkeeping','bound-statements','idempotent-replay','fingerprint-conflict','rollback','artifact-integrity','lesson-plan-binding','immutable-reading-review','rejected-admission','canonical-chain','teacher-lineage','treatment-query','rebuildable-projection','durable-learner-action-replay','durable-teacher-continuation','durable-retention-restart']},null,2));
