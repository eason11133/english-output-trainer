const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const build=path.resolve(process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build-build2');
const {recordFirstDayAction,nextTutorialScene,initialContextReady,firstDayResumeRoute}=require(path.join(build,'experience/firstDayTutorialState.js'));
const {createInitialProductProfileV2,normalizeProductProfileV2,applyLearnerProductContextMutationV2,onboardingIsCompleteV2}=require(path.join(build,'product/model.js'));
const seed={learnerId:'build2-test',accountId:null,demoMode:true};
const now='2026-09-07T12:00:00.000Z';
const sequence=['OPENING_COMPLETED','INITIAL_CONTEXT_COMPLETED','TODAY_STARTED','FIRST_MICRO_ACTION_COMPLETED','FIRST_TEACHER_REPAIR_COMPLETED','FIRST_SUPPORT_FADE_COMPLETED','FIRST_FRESH_ATTEMPT_COMPLETED','FIRST_RESULT_SEEN','MY_ENGLISH_EXPLAINED_FROM_REAL_CHANGE','PRACTICE_VISITED','RETURNED_TO_TODAY','FIRST_DAY_TUTORIAL_COMPLETED'];
const act=(state,milestone)=>recordFirstDayAction(state,{milestone,actionId:`action:${milestone}`,occurredAt:now,route:'/(tabs)',learningRoute:milestone==='TODAY_STARTED'?'/exam-practice?practiceFamily=exam_reading':undefined});

test('initial context permits production routes but cannot finish the tutorial',()=>{
 let profile=createInitialProductProfileV2(seed,now),state=act(undefined,'OPENING_COMPLETED');state=act(state,'INITIAL_CONTEXT_COMPLETED');
 profile=applyLearnerProductContextMutationV2(profile,{onboarding:{status:'IN_PROGRESS',firstDay:state}},now);
 assert.equal(initialContextReady(profile),true);assert.equal(onboardingIsCompleteV2(profile),false);assert.equal(nextTutorialScene(state),'TODAY');
 const bypass=applyLearnerProductContextMutationV2(profile,{onboarding:{status:'COMPLETED'}},now);
 assert.equal(bypass.onboarding.status,'IN_PROGRESS');assert.equal(onboardingIsCompleteV2(bypass),false);
});
test('out-of-order events and missing action identities cannot finish milestones',()=>{
 assert.throws(()=>act(undefined,'TODAY_STARTED'),/prerequisites/);
 assert.throws(()=>act(undefined,'FIRST_DAY_TUTORIAL_COMPLETED'),/prerequisites/);
 assert.throws(()=>recordFirstDayAction(undefined,{milestone:'OPENING_COMPLETED',actionId:'',route:'/',occurredAt:now}),/receipt/);
});
test('receipt replay is idempotent and lookup is optional without inventing its use',()=>{
 let state;for(const milestone of sequence){state=act(state,milestone);assert.equal(act(state,milestone),state)}
 assert.equal(nextTutorialScene(state),'DONE');assert.equal(state.milestones.FIRST_LOOKUP_USED,undefined);
});
test('JSON and product normalization retain every intermediate scene and learning route',()=>{
 let state;for(const milestone of sequence){state=act(state,milestone);const before=nextTutorialScene(state);const profile=createInitialProductProfileV2(seed,now);profile.onboarding={status:'IN_PROGRESS',version:2,firstDay:state};const restored=normalizeProductProfileV2(JSON.parse(JSON.stringify(profile)),seed,now);assert.equal(nextTutorialScene(restored.onboarding.firstDay),before);assert.deepEqual(restored.onboarding.firstDay,state)}
});
test('returning completed profiles do not replay; unfinished learning resumes its stored production route',()=>{
 const profile=createInitialProductProfileV2(seed,now);profile.onboarding.status='COMPLETED';assert.equal(firstDayResumeRoute(profile),'/(tabs)');
 let state;for(const milestone of sequence.slice(0,3))state=act(state,milestone);profile.onboarding={version:2,status:'IN_PROGRESS',firstDay:state};assert.equal(firstDayResumeRoute(profile),'/exam-practice?practiceFamily=exam_reading');
});
test('source guards keep setup and tooltip dismissal out of completion',()=>{
 const fs=require('node:fs'),time=fs.readFileSync('app/onboarding/time.tsx','utf8'),today=fs.readFileSync('app/(tabs)/index.tsx','utf8'),lookup=fs.readFileSync('components/learning/UniversalLookupText.tsx','utf8');
 assert.doesNotMatch(time,/status:'COMPLETED'|FIRST_RUN_COMPLETED|lookupTutorialCompleted:true/);assert.match(time,/INITIAL_CONTEXT_COMPLETED/);assert.match(time,/router.replace\('\/\(tabs\)'\)/);
 assert.doesNotMatch(today,/type:'TODAY_STARTED',phase:'OPENED'/);assert.match(today,/recordTutorialAction\('TODAY_STARTED'/);assert.match(lookup,/next.status==='RESOLVED'[\s\S]*recordTutorialAction\('FIRST_LOOKUP_USED'/);
});
