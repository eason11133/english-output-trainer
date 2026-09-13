const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build';
const fromBuild=rel=>require(path.join(__dirname,'..','..',build,rel));
const product=fromBuild('product/index.js');
const architecture=fromBuild('architecture/upgradePlan.js');
const experience=fromBuild('experience/firstUseState.js');

const now='2026-08-26T00:00:00.000Z';
const demoSeed={learnerId:'local-learner',accountId:null,displayName:'Eason',demoMode:true};
const authSeed={learnerId:'account-123',accountId:'account-123',displayName:'Eason',demoMode:false};

test('initial product profile keeps identity separate from capability truth and is honest about access',()=>{
  const demo=product.createInitialProductProfileV2(demoSeed,now);
  assert.equal(demo.identity.learnerId,'local-learner');
  assert.equal(demo.identity.source,'LOCAL_DEMO');
  assert.equal(demo.access.entitlements.GENERAL.status,'DEVELOPMENT');
  assert.equal(demo.access.entitlements.EXAM.status,'DEVELOPMENT');
  const auth=product.createInitialProductProfileV2(authSeed,now);
  assert.equal(auth.access.entitlements.GENERAL.status,'UNKNOWN');
  assert.equal(product.productExperienceAccessDecisionV2(auth,'GENERAL'),'PREVIEW');
});

test('first-launch receipt survives normalization and never completes onboarding',()=>{
  const first=product.createInitialProductProfileV2(demoSeed,now);
  assert.equal(experience.needsFirstLaunchIntroV1(first),true);
  const skipped=product.applyLearnerProductContextMutationV2(first,{gsatBeta:{coachMarks:{opening:true}}},'2026-08-26T00:00:01.000Z');
  assert.equal(skipped.onboarding.status,'NOT_STARTED');
  assert.equal(experience.needsFirstLaunchIntroV1(skipped),false);
  const restored=product.normalizeProductProfileV2(JSON.parse(JSON.stringify(skipped)),demoSeed,'2026-08-27T00:00:00.000Z');
  assert.equal(restored.gsatBeta.coachMarks.opening,true);
  assert.equal(experience.needsFirstLaunchIntroV1(restored),false);
  const legacy={...first,gsatBeta:{...first.gsatBeta,coachMarks:{today:false,practice:false,teacher:false}}};
  assert.equal(product.normalizeProductProfileV2(legacy,demoSeed,now).gsatBeta.coachMarks.opening,false);
});

test('learner context mutation cannot mint entitlement or subscription truth',()=>{
  const before=product.createInitialProductProfileV2(authSeed,now);
  const after=product.applyLearnerProductContextMutationV2(before,{identity:{displayName:'New Name'},goals:{primaryGoal:'學測作文',learningPurpose:'EXAM',useContexts:['WRITING','EXAM_TASKS']},study:{dailyStudyMinutes:999,preferredSessionMinutes:1},activeExperience:'EXAM'},'2026-08-26T01:00:00.000Z');
  assert.equal(after.identity.displayName,'New Name');
  assert.equal(after.study.dailyStudyMinutes,120);
  assert.equal(after.study.preferredSessionMinutes,5);
  assert.equal(after.access.entitlements.EXAM.status,'UNKNOWN');
  assert.equal(after.provenance.goals.source,'LEARNER');
  assert.equal(after.provenance.access.source,'SYSTEM');
});

test('entitlement service mutation cannot rewrite learner-owned goal context',()=>{
  const before=product.createInitialProductProfileV2(authSeed,now);
  const after=product.applySystemEntitlementMutationV2(before,{entitlements:{EXAM:{status:'ACTIVE',source:'SERVER',planId:'EXAM'}},subscription:{provider:'EXTERNAL',state:'ACTIVE',product:'EXAM'}},'2026-08-26T01:00:00.000Z');
  assert.equal(after.goals.primaryGoal,before.goals.primaryGoal);
  assert.equal(after.access.entitlements.EXAM.status,'ACTIVE');
  assert.equal(after.access.subscription.state,'ACTIVE');
  assert.equal(after.provenance.access.source,'ENTITLEMENT_SERVICE');
});

test('legacy local profile migrates into one canonical V2 context',()=>{
  const migrated=product.migrateLegacyProductContextV1ToV2({learnerPreferences:{learnerId:'local-learner',displayName:'Old',dailyStudyMinutes:15},practiceGoals:{onboardingCompleted:true,selectedPracticeAreas:['writing_output','translation']},learnerTrack:{primaryGoal:'舊目標',dailyStudyMinutes:20,targetDate:'2026-11-01'}},demoSeed,now);
  assert.equal(migrated.schemaVersion,2);
  assert.equal(migrated.identity.displayName,'Old');
  assert.equal(migrated.study.dailyStudyMinutes,20);
  assert.equal(migrated.onboarding.status,'COMPLETED');
  assert.ok(migrated.goals.useContexts.includes('WRITING'));
  assert.ok(migrated.goals.useContexts.includes('TRANSLATION'));
  assert.equal(migrated.provenance.study.source,'MIGRATION');
});

test('exam onboarding requires meaningful exam context without creating a placement test',()=>{
  let profile=product.createInitialProductProfileV2(demoSeed,now);
  profile=product.applyLearnerProductContextMutationV2(profile,{goals:{learningPurpose:'EXAM'},onboarding:{status:'COMPLETED',completedAt:now}},now);
  assert.equal(product.onboardingIsCompleteV2(profile),false);
  profile=product.applyLearnerProductContextMutationV2(profile,{exam:{examType:'學測英文'}},now);
  assert.equal(product.onboardingIsCompleteV2(profile),true);
});

test('exam detail screen may be skipped without looping onboarding because prior learner use-context choices provide the minimal exam scope',()=>{
  let profile=product.createInitialProductProfileV2(demoSeed,now);
  profile=product.applyLearnerProductContextMutationV2(profile,{goals:{learningPurpose:'EXAM',useContexts:['WRITING','TRANSLATION','EXAM_TASKS']}},now);
  const exam=product.examContextForOnboardingCompletionV2({examType:'',scope:''},profile.goals.useContexts);
  assert.equal(exam.examType,'');
  assert.equal(exam.scope,'寫作、中翻英、考試題型');
  profile=product.applyLearnerProductContextMutationV2(profile,{exam,onboarding:{status:'COMPLETED',completedAt:now}},now);
  assert.equal(product.onboardingIsCompleteV2(profile),true);
});

test('runtime projection carries product goal time mode and exam context without learner-state claims',()=>{
  let profile=product.createInitialProductProfileV2(demoSeed,now);
  profile=product.applyLearnerProductContextMutationV2(profile,{goals:{primaryGoal:'學測中翻英',learningPurpose:'EXAM',useContexts:['TRANSLATION','EXAM_TASKS']},study:{preferredSessionMinutes:15},exam:{examType:'學測英文',scope:'中譯英',deadline:'2026-11-01',rubric:'語意與文法'},activeExperience:'EXAM'},now);
  const runtime=product.projectRuntimeProductContextV2(profile);
  assert.equal(runtime.learnerId,'local-learner');
  assert.equal(runtime.productMode,'EXAM');
  assert.equal(runtime.studyMinutes,15);
  assert.equal(runtime.examContext.scope,'中譯英');
  assert.equal(runtime.examContext.deadline,'2026-11-01');
});

test('Wave A marks every audited capability as advanced without depending on later-wave state',()=>{
  assert.ok(product.productWaveACapabilityStatusV1.length>=22);
  assert.ok(product.productWaveACapabilityStatusV1.every(item=>item.afterPercent>item.beforePercent));
  assert.equal(architecture.recommendedMajorSubsystemUpgradeWavesV1.find(item=>item.subsystem==='A').state,'COMPLETE_FIRST_PASS');
  assert.ok(['READY_FOR_AUDIT','IN_PROGRESS','COMPLETE_FIRST_PASS'].includes(architecture.recommendedMajorSubsystemUpgradeWavesV1.find(item=>item.subsystem==='B').state));
});
