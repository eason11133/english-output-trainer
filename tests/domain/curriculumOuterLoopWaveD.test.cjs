const test=require('node:test');
const assert=require('node:assert/strict');

const path=require('node:path');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build';
const fromBuild=rel=>require(path.join(__dirname,'..','..',build,rel));
const curriculum=fromBuild('curriculum/index.js');
const english=fromBuild('domain/english/index.js');
const architecture=fromBuild('architecture/upgradePlan.js');

function context(overrides={}){
  return{
    learnerId:'learner-1',
    goals:['use English independently'],
    learningPurpose:'GENERAL_ENGLISH',
    useContexts:['WRITING','TRANSLATION'],
    studyMinutes:20,
    productMode:'GENERAL',
    entitlement:{status:'ACTIVE',source:'SERVER',planId:'GENERAL'},
    ...overrides,
  };
}

function truth(capabilitySlice=[]){
  return{
    learnerId:'learner-1',
    generatedFromEvidenceIds:capabilitySlice.flatMap(item=>item.sourceEvidenceIds??[]),
    capabilitySlice,
    interactionSlice:[],
    exposureSlice:[],
    goalContext:{},
    projectionVersion:1,
  };
}

function cap(targetRef,facet,state,overrides={}){
  return{
    targetRef,facet,state,
    confidence:'HIGH',
    supportDependence:'NONE_OBSERVED',
    sourceEvidenceIds:[`e-${targetRef}-${facet}`],
    sourceControl:['INDEPENDENT_LOCAL_CONTROL','TRANSFER_PENDING','TRANSFER_SUPPORTED','RETENTION_PENDING','RETENTION_SUPPORTED'].includes(state),
    transferSupport:['TRANSFER_SUPPORTED','RETENTION_PENDING','RETENTION_SUPPORTED'].includes(state),
    retentionSupport:state==='RETENTION_SUPPORTED',
    uncertainty:{level:'LOW',reasons:[]},
    hypotheses:[],
    conditionReliability:'HIGH',
    latestEvidenceAt:'2026-08-25T00:00:00.000Z',
    ...overrides,
  };
}

test('unknown high-level target is blocked until its prerequisite has independent readiness',()=>{
  const candidates=curriculum.buildCurriculumCandidatesV1(
    context(),truth(),english.coreEnglishDomainPortV2,{now:'2026-08-27T00:00:00.000Z'}
  );
  const allow=candidates.find(item=>item.targetRef==='allow-object-infinitive');
  const sense=candidates.find(item=>item.targetRef==='sense.allow.permission');
  assert.equal(allow.frontier,'BLOCKED');
  assert.ok(allow.missingPrerequisiteRefs.includes('sense.allow.permission'));
  assert.equal(sense.frontier,'READY');
  assert.equal(sense.needKind,'NEW_LEARNING');
});

test('prerequisite independent proof unlocks a new downstream target',()=>{
  const model=truth([
    cap('sense.allow.permission','MEANING_TO_RETRIEVAL','INDEPENDENT_LOCAL_CONTROL')
  ]);
  const allow=curriculum.buildCurriculumCandidatesV1(
    context(),model,english.coreEnglishDomainPortV2,{now:'2026-08-27T00:00:00.000Z'}
  ).find(item=>item.targetRef==='allow-object-infinitive');
  assert.notEqual(allow.frontier,'BLOCKED');
  assert.ok(allow.reasonCodes.includes('PREREQUISITE_READY'));
});

test('fragile and assisted control become different reinforcement needs',()=>{
  const model=truth([
    cap('writing.purpose-audience','FREE_PRODUCTION','OBSERVED_FRAGILE'),
    cap('writing.idea-reasoning','FREE_PRODUCTION','ASSISTED_CONTROL',{supportDependence:'HIGH'}),
  ]);
  const candidates=curriculum.buildCurriculumCandidatesV1(context(),model,english.coreEnglishDomainPortV2,{now:'2026-08-27T00:00:00.000Z'});
  const fragile=candidates.find(item=>item.targetRef==='writing.purpose-audience');
  const assisted=candidates.find(item=>item.targetRef==='writing.idea-reasoning');
  assert.equal(fragile.frontier,'REINFORCEMENT');
  assert.equal(fragile.needKind,'REPAIR');
  assert.equal(assisted.frontier,'REINFORCEMENT');
  assert.equal(assisted.needKind,'INDEPENDENCE');
});

test('local independent control creates transfer need instead of same-item repetition',()=>{
  const model=truth([cap('writing.purpose-audience','FREE_PRODUCTION','TRANSFER_PENDING')]);
  const item=curriculum.buildCurriculumCandidatesV1(context(),model,english.coreEnglishDomainPortV2,{now:'2026-08-27T00:00:00.000Z'})
    .find(value=>value.targetRef==='writing.purpose-audience');
  assert.equal(item.frontier,'TRANSFER');
  assert.equal(item.needKind,'TRANSFER');
  assert.ok(item.reasonCodes.includes('TRANSFER_UNVERIFIED'));
});

test('retention pending cannot become due before the delayed-evidence minimum',()=>{
  const model=truth([cap('writing.purpose-audience','FREE_PRODUCTION','RETENTION_PENDING',{latestEvidenceAt:'2026-08-27T00:00:00.000Z'})]);
  const early=curriculum.buildCurriculumCandidatesV1(context(),model,english.coreEnglishDomainPortV2,{now:'2026-08-27T12:00:00.000Z',retentionMinimumDelayHours:24})
    .find(value=>value.targetRef==='writing.purpose-audience');
  const due=curriculum.buildCurriculumCandidatesV1(context(),model,english.coreEnglishDomainPortV2,{now:'2026-08-28T01:00:00.000Z',retentionMinimumDelayHours:24})
    .find(value=>value.targetRef==='writing.purpose-audience');
  assert.equal(early.dueNow,false);
  assert.equal(due.dueNow,true);
});

test('learner priority changes ranking but cannot bypass prerequisite gate',()=>{
  const base=curriculum.buildCurriculumCandidatesV1(context({currentPriority:'GRAMMAR'}),truth(),english.coreEnglishDomainPortV2,{now:'2026-08-27T00:00:00.000Z'});
  const allow=base.find(item=>item.targetRef==='allow-object-infinitive');
  const noPriority=curriculum.buildCurriculumCandidatesV1(context({currentPriority:undefined}),truth(),english.coreEnglishDomainPortV2,{now:'2026-08-27T00:00:00.000Z'})
    .find(item=>item.targetRef==='allow-object-infinitive');
  assert.ok(allow.score>noPriority.score);
  assert.equal(allow.frontier,'BLOCKED');
});

test('same learner truth can yield different General and Exam allocation signals without forking truth',()=>{
  const model=truth([cap('writing.purpose-audience','FREE_PRODUCTION','TRANSFER_PENDING')]);
  const general=curriculum.buildCurriculumCandidatesV1(
    context({productMode:'GENERAL'}),model,english.coreEnglishDomainPortV2,{now:'2026-08-27T00:00:00.000Z'}
  );
  const exam=curriculum.buildCurriculumCandidatesV1(
    context({productMode:'EXAM',examContext:{scope:'writing and translation',deadline:'2026-09-02T00:00:00.000Z'}}),
    model,english.coreEnglishDomainPortV2,{now:'2026-08-27T00:00:00.000Z'}
  );
  const g=general.find(item=>item.targetRef==='reading.meaning-decomposition');
  const e=exam.find(item=>item.targetRef==='reading.meaning-decomposition');
  assert.notEqual(g.score,e.score);
  assert.ok(e.reasonCodes.includes('EXAM_URGENCY'));
  assert.deepEqual(model,truth([cap('writing.purpose-audience','FREE_PRODUCTION','TRANSFER_PENDING')]));
});

test('coverage governor gives uncovered goal-relevant areas a coverage-gap signal',()=>{
  const model=truth([
    cap('writing.purpose-audience','FREE_PRODUCTION','RETENTION_SUPPORTED'),
    cap('writing.idea-reasoning','FREE_PRODUCTION','RETENTION_SUPPORTED'),
  ]);
  const translation=curriculum.buildCurriculumCandidatesV1(
    context({useContexts:['TRANSLATION']}),model,english.coreEnglishDomainPortV2,{now:'2026-08-27T00:00:00.000Z'}
  ).find(item=>item.targetRef==='translation.source-meaning');
  assert.ok(translation.reasonCodes.includes('COVERAGE_GAP'));
});

test('5/10/20/30/60 are budget envelopes, not fixed lesson recipes',()=>{
  assert.deepEqual(
    [4,10,22,35,90].map(value=>curriculum.resolveTimeArchitectureV1(value).budgetMinutes),
    [5,10,20,30,60]
  );
  const sixty=curriculum.resolveTimeArchitectureV1(60);
  assert.equal(sixty.maxActiveFocuses,4);
  assert.equal(sixty.fixedSequence,false);
  assert.equal(sixty.softStopAllowed,true);
});

test('Today plan contains primary/reserve/blocked frontiers and no fixed sequence',()=>{
  const plan=curriculum.createTodayCurriculumPlanV1(
    context({studyMinutes:30,currentPriority:'WRITING'}),truth(),english.coreEnglishDomainPortV2,{now:'2026-08-27T00:00:00.000Z'}
  );
  assert.ok(plan);
  assert.equal(plan.time.budgetMinutes,30);
  assert.equal(plan.noFixedSequence,true);
  assert.ok(plan.reserveFocuses.length<=2);
  assert.ok(plan.blockedHighValue.some(item=>item.targetRef==='allow-object-infinitive'));
  assert.notEqual(plan.primaryFocus.frontier,'BLOCKED');
});

test('LessonPlan adapter carries WHAT/WHY/WHEN without choosing teaching mechanism',()=>{
  const plan=curriculum.createTodayCurriculumPlanV1(
    context({studyMinutes:10}),truth(),english.coreEnglishDomainPortV2,{now:'2026-08-27T00:00:00.000Z'}
  );
  const lesson=curriculum.lessonPlanFromTodayV1(plan);
  assert.equal(lesson.timeBudgetMinutes,10);
  assert.equal(lesson.productMode,'GENERAL');
  assert.ok(lesson.objective.includes(plan.primaryFocus.label));
  assert.ok(!/grammar-role-map|sentence-builder|TEACH|PRACTICE_GUIDED/.test(JSON.stringify(lesson)));
});

test('Wave D audits all 17 capabilities, completes D and makes E ready',()=>{
  assert.equal(curriculum.curriculumWaveDCapabilityStatusV1.length,17);
  assert.ok(curriculum.curriculumWaveDCapabilityStatusV1.every(item=>[25,50,75,90,100].includes(item.afterPercent)));
  assert.ok(curriculum.curriculumWaveDCapabilityStatusV1.every(item=>item.afterPercent>item.beforePercent));
  assert.equal(architecture.recommendedMajorSubsystemUpgradeWavesV1.find(item=>item.subsystem==='D').state,'COMPLETE_FIRST_PASS');
  assert.ok(['READY_FOR_AUDIT','IN_PROGRESS','COMPLETE_FIRST_PASS'].includes(architecture.recommendedMajorSubsystemUpgradeWavesV1.find(item=>item.subsystem==='E').state));
});


test('canonical LessonPlan carries the selected Today target facet reason and time without choosing pedagogy', async () => {
  const domain=english.coreEnglishDomainPortV2;
  const learner=truth();
  const plan=await curriculum.canonicalCurriculumV1.planToday(context({studyMinutes:20}),learner,domain,{now:'2026-08-27T00:00:00.000Z'});
  const lesson=curriculum.canonicalCurriculumV1.lessonPlan(plan);
  assert.equal(lesson.targetRef,plan.primaryFocus.targetRef);
  assert.equal(lesson.facet,plan.primaryFocus.facet);
  assert.deepEqual([...lesson.reasonCodes],[...plan.primaryFocus.reasonCodes]);
  assert.equal(lesson.timeBudgetMinutes,plan.time.budgetMinutes);
  assert.equal(Object.prototype.hasOwnProperty.call(lesson,'selectedBlockId'),false);
  assert.equal(Object.prototype.hasOwnProperty.call(lesson,'supportLevel'),false);
});

test('real mock production loss remains a non-evidence scheduling signal after recognition evidence exists',()=>{
  const recognition=cap('sense.allow.permission','SENSE_DISCRIMINATION','RETENTION_SUPPORTED',{performanceDimension:'RECOGNITION',sourceEvidenceIds:['r1','r2']});
  const model=truth([recognition]);
  const exam=context({productMode:'EXAM',learningPurpose:'EXAM',useContexts:['EXAM_TASKS'],examContext:{scope:'GSAT',schedulingResults:[
    {section:'ZH_EN_TRANSLATION',lost:6.5,maximum:8,reportedAt:'2026-09-01T00:00:00.000Z',evidenceEligible:false},
    {section:'ENGLISH_COMPOSITION',lost:9,maximum:20,reportedAt:'2026-09-01T00:00:00.000Z',evidenceEligible:false},
  ]}});
  const plan=curriculum.createTodayCurriculumPlanV1(exam,model,english.coreEnglishDomainPortV2,{now:'2026-09-07T00:00:00.000Z'});
  assert.ok(['TRANSLATION','WRITING','MEANING_ENCODING'].includes(plan.primaryFocus.area));
  assert.ok(plan.primaryFocus.reasonCodes.includes('REAL_MOCK_LOSS'));
  assert.deepEqual(model,truth([recognition]));
  assert.ok(exam.examContext.schedulingResults.every(row=>row.evidenceEligible===false));
});

test('one failed discourse opportunity is governed as low-sample diagnosis, not precise high-confidence weakness',()=>{
  const single=cap('reading.logic-structure','SELECTION','OBSERVED_FRAGILE',{confidence:'LOW',sourceEvidenceIds:['d1'],uncertainty:{level:'MEDIUM',reasons:['limited evidence volume']}});
  const item=curriculum.buildCurriculumCandidatesV1(context({productMode:'EXAM',learningPurpose:'EXAM',useContexts:['EXAM_TASKS'],examContext:{scope:'GSAT'}}),truth([single]),english.coreEnglishDomainPortV2,{now:'2026-09-07T00:00:00.000Z'}).find(row=>row.targetRef===single.targetRef);
  assert.equal(item.sampleAdequacy,'INSUFFICIENT');assert.equal(item.allocationIntent,'DIAGNOSE');
  assert.ok(item.reasonCodes.includes('INSUFFICIENT_SAMPLE'));assert.ok(item.reasonCodes.includes('DIAGNOSTIC_PRIORITY'));
  const adequate=curriculum.buildCurriculumCandidatesV1(context({productMode:'EXAM',learningPurpose:'EXAM',useContexts:['EXAM_TASKS'],examContext:{scope:'GSAT'}}),truth([{...single,sourceEvidenceIds:['d1','d2']}]),english.coreEnglishDomainPortV2,{now:'2026-09-07T00:00:00.000Z'}).find(row=>row.targetRef===single.targetRef);
  assert.ok(item.score<adequate.score);
});

test('improved app evidence followed by unchanged real Reading mock creates transfer-calibration work without deleting history',()=>{
  const improved=cap('reading.inference','SELECTION','RETENTION_SUPPORTED',{performanceDimension:'RECOGNITION',sourceEvidenceIds:['app1','app2','app3'],latestEvidenceAt:'2026-09-03T00:00:00.000Z'});
  const model=truth([improved]),exam=context({productMode:'EXAM',learningPurpose:'EXAM',useContexts:['EXAM_TASKS'],examContext:{scope:'GSAT',schedulingResults:[
    {section:'READING_COMPREHENSION',lost:12,maximum:24,reportedAt:'2026-08-20T00:00:00.000Z',evidenceEligible:false},
    {section:'READING_COMPREHENSION',lost:12,maximum:24,reportedAt:'2026-09-05T00:00:00.000Z',evidenceEligible:false},
  ]}});
  const item=curriculum.buildCurriculumCandidatesV1(exam,model,english.coreEnglishDomainPortV2,{now:'2026-09-07T00:00:00.000Z'}).find(row=>row.targetRef==='reading.inference');
  assert.equal(item.allocationIntent,'TRANSFER_CALIBRATION');assert.equal(item.needKind,'TRANSFER');assert.equal(item.dueNow,true);
  assert.ok(item.reasonCodes.includes('TRANSFER_CALIBRATION_WARNING'));assert.deepEqual(model,truth([improved]));
});

test('near-exam deadline amplifies recoverable score loss rather than every local weakness equally',()=>{
  const reading=cap('reading.inference','SELECTION','OBSERVED_FRAGILE',{sourceEvidenceIds:['read1','read2']});
  const writing=cap('writing.idea-reasoning','FREE_PRODUCTION','OBSERVED_FRAGILE',{sourceEvidenceIds:['write1','write2']});
  const exam=context({productMode:'EXAM',learningPurpose:'EXAM',useContexts:['EXAM_TASKS'],examContext:{scope:'GSAT',deadline:'2026-09-21T00:00:00.000Z',schedulingResults:[
    {section:'READING_COMPREHENSION',lost:16,maximum:24,reportedAt:'2026-09-06T00:00:00.000Z',evidenceEligible:false},
    {section:'ENGLISH_COMPOSITION',lost:2,maximum:20,reportedAt:'2026-09-06T00:00:00.000Z',evidenceEligible:false},
  ]}});
  const rows=curriculum.buildCurriculumCandidatesV1(exam,truth([reading,writing]),english.coreEnglishDomainPortV2,{now:'2026-09-07T00:00:00.000Z'}),r=rows.find(x=>x.targetRef===reading.targetRef),w=rows.find(x=>x.targetRef===writing.targetRef);
  assert.ok(r.score>w.score);assert.ok(r.reasonCodes.includes('DEADLINE_AMPLIFIED_RECOVERABLE_LOSS'));assert.equal(rows[0].area,'READING');
});
