const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const Module=require('node:module');
const {createHash}=require('node:crypto');

const root=path.resolve(__dirname,'../..');
const domain=rel=>require(path.join(root,'.domain-test-build',rel));
const persisted=rel=>path.join(root,'.wave1d-persistence-build',rel);

function installHostWebEnvironment(){
  const values=new Map();
  const localStorage={
    get length(){return values.size},
    key(index){return [...values.keys()][index]??null},
    getItem(key){return values.has(String(key))?values.get(String(key)):null},
    setItem(key,value){values.set(String(key),String(value))},
    removeItem(key){values.delete(String(key))},
    clear(){values.clear()},
  };
  global.window={localStorage};
  global.localStorage=localStorage;
  const original=Module._load;
  Module._load=function(request,parent,isMain){
    if(request==='react-native')return{Platform:{OS:'web'}};
    if(request==='expo-sqlite')return{openDatabaseAsync:async()=>{throw new Error('native_sqlite_must_not_run_in_web_integration')}};
    if(request==='expo-file-system')return{File:class File{}};
    if(request==='expo-crypto')return{CryptoDigestAlgorithm:{SHA256:'SHA-256'},digestStringAsync:async(_algorithm,value)=>createHash('sha256').update(value).digest('hex')};
    return original.call(this,request,parent,isMain);
  };
  return()=>{Module._load=original;delete global.window;delete global.localStorage};
}

function purgePersistenceModules(){
  for(const id of Object.keys(require.cache))if(id.includes('.wave1d-persistence-build'))delete require.cache[id];
}

test('READING-HANDOFF-07 real persistence owners restore identity and prevent a second provider call',async()=>{
  const restoreHost=installHostWebEnvironment();
  try{
    const reading=domain('specializations/language/readingExamRuntime.js');
    const reviews=domain('specializations/language/readingReviewRuntime.js');
    const teacher=domain('teacher-runtime/index.js');
    const stage4=domain('application/stage4/learnerRuntimeV4.js');
    const source=Object.freeze({id:'reading-source-wave1d-persisted',passage:'The library stayed open because students needed a quiet place to finish their projects.',questions:Object.freeze([{id:'q1',passageId:'reading-source-wave1d-persisted',stem:'Why did the library stay open?',options:Object.freeze([{id:'a',text:'Students needed a quiet place.'},{id:'b',text:'The teachers had a meeting.'}])}]),sourceRef:'frozen-exam:reading-persisted',immutable:true});
    let attempt=reading.startReadingAttemptV1({id:'attempt-wave1d-persisted',learnerId:'learner-wave1d-persisted',mode:'PRACTICE',source,startedAt:'2026-08-30T00:00:00.000Z'});
    attempt=reading.answerReadingItemV1(attempt,{questionId:'q1',response:'The teachers had a meeting.',updatedAt:'2026-08-30T00:01:00.000Z'});
    attempt=reading.commitReadingResultV1(reading.submitReadingAttemptV1(attempt,'2026-08-30T00:02:00.000Z'),'2026-08-30T00:02:01.000Z');
    const review=reviews.createCanonicalReadingReviewV1({id:'review-wave1d-persisted',attempt,focus:{questionId:'q1',kind:'INFERENCE_BRIDGE',anchorText:'because students needed a quiet place',reasonRef:'review:learner-selected'},timeBudgetMinutes:12,productMode:'GENERAL'});
    const firstStore=require(persisted('persistence/readingAttemptStore.web.js')).readingAttemptStoreV1;
    const firstGateway=require(persisted('persistence/lessonPersistenceGateway.js'));
    await firstStore.save(attempt);
    await firstStore.saveReview(review);
    const event={id:'reading-decision-wave1d-persisted',kind:'LEARNER_RESPONSE',occurredAt:'2026-08-30T00:03:00.000Z',outcome:'FAILURE',support:'NONE',observationIds:[attempt.id],attemptId:attempt.id};
    const product={learnerId:attempt.learnerId,goals:['read with evidence'],learningPurpose:'school',useContexts:['reading'],studyMinutes:12,productMode:'GENERAL',entitlement:{status:'DEVELOPMENT',source:'test',planId:'test'}};
    const truth={learnerId:attempt.learnerId,generatedFromEvidenceIds:[],capabilitySlice:[],interactionSlice:[],exposureSlice:[],goalContext:{},projectionVersion:1};
    let providerCalls=0;
    const decision=await teacher.decideInnerTutorV1({lessonPlan:review.lessonPlan,productContext:product,learnerTruth:truth,event,recentAttempts:[],recentTreatmentResponses:[],timeRemainingMinutes:12,provider:async()=>{providerCalls++;throw new Error('offline fallback')}});
    const initial=reviews.startCanonicalReadingReviewSessionV1(review,'2026-08-30T00:03:00.000Z');
    const runtime={...stage4.selectBlockV4(initial,decision.blockDecision),decisionProvenance:decision.provenance};
    await firstGateway.saveOperationalLessonCheckpointV1(review.lessonPlan,runtime);

    purgePersistenceModules();
    const restoredStore=require(persisted('persistence/readingAttemptStore.web.js')).readingAttemptStoreV1;
    const restoredGateway=require(persisted('persistence/lessonPersistenceGateway.js'));
    const [restoredAttempt,restoredReview,bundle]=await Promise.all([restoredStore.loadById(attempt.id),restoredStore.loadReview(review.id),restoredGateway.loadActiveOperationalLessonBundleV1(attempt.learnerId)]);
    assert.ok(restoredAttempt&&restoredReview&&bundle);
    assert.equal(bundle.runtime.id,runtime.id);
    assert.deepEqual(bundle.runtime.tutorSession,runtime.tutorSession);
    assert.equal(bundle.runtime.readingReview.reviewId,review.id);
    assert.equal(bundle.runtime.readingReview.originalAttemptId,attempt.id);
    assert.equal(bundle.lessonPlan.id,review.lessonPlan.id);
    assert.equal(bundle.runtime.decision.configuration.decisionPointId,event.id);
    assert.equal(bundle.runtime.decision.selectedBlockId,decision.blockDecision.selectedBlockId);
    assert.deepEqual(bundle.runtime.decisionProvenance,decision.provenance);
    assert.equal(restoredReview.originalAttemptId,attempt.id);
    assert.equal(restoredAttempt.id,attempt.id);
    assert.equal(restoredAttempt.resultCommittedAt,attempt.resultCommittedAt);

    const replay=await teacher.decideInnerTutorV1({lessonPlan:bundle.lessonPlan,productContext:product,learnerTruth:truth,event,recentAttempts:[],recentTreatmentResponses:[],timeRemainingMinutes:11,currentDecision:bundle.runtime.decision,currentProvenance:bundle.runtime.decisionProvenance,provider:async()=>{providerCalls++;throw new Error('provider_must_not_run_for_persisted_replay')}});
    assert.equal(replay.reused,true);
    assert.equal(replay.blockDecision.configuration.decisionPointId,event.id);
    assert.equal(replay.blockDecision.selectedBlockId,decision.blockDecision.selectedBlockId);
    assert.deepEqual(replay.provenance.observationIds,decision.provenance.observationIds);
    assert.ok(replay.provenance.reasonCodes.includes('IDEMPOTENT_REPLAY'));
    assert.equal(providerCalls,1);
  }finally{restoreHost()}
});
