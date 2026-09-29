const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const build=path.resolve(process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build-production-frontend');
const{examBetaTaskForLearner}=require(path.join(build,'content/examBetaBank.js'));
const{submitExamToCanonicalTeacherV1}=require(path.join(build,'application/exam/examSubmissionAdapter.js'));
const{buildExamTeacherInteractionV1,continueExamTeacherAfterInteractionV1}=require(path.join(build,'application/exam/examTeacherInteraction.js'));
const{projectExamLearnerActionV1}=require(path.join(build,'application/exam/examPuzzleProjection.js'));
const{createExamOperationalRuntimeV1,updateExamOperationalRuntimeV1,resumableExamOperationalRuntimeV1}=require(path.join(build,'application/exam/examOperationalRuntime.js'));
const{createLearningSessionV1,currentLearningActivityV1,advanceLearningSessionV1}=require(path.join(build,'application/session/learningSessionState.js'));

const families=['VOCABULARY','COMPREHENSIVE','CONTEXTUAL_FILL','DISCOURSE','READING','MIXED','TRANSLATION','WRITING'];
const learnerId='frontend-acceptance';
const truth={learnerId,generatedFromEvidenceIds:[],capabilitySlice:[],interactionSlice:[],exposureSlice:[],goalContext:{}};
const product={learnerId,goals:['exam'],learningPurpose:'EXAM',useContexts:['EXAM_TASKS'],studyMinutes:20,productMode:'EXAM',entitlement:{status:'DEVELOPMENT',source:'acceptance',planId:'acceptance'}};

const responseFor=(task)=>Object.fromEntries(task.canonicalBinding.units.map(unit=>[unit.responseKey,'__EOT_COMMITTED_WRONG__']));
const semanticFailureFor=(task)=>Object.fromEntries(task.canonicalBinding.units.filter(unit=>unit.evaluatorKind==='SEMANTIC_RUBRIC').map(unit=>[unit.unitId,{schemaVersion:1,outcome:'INCORRECT',authority:'BOUNDED_RUBRIC',rubricId:`acceptance:${task.task_id}:${unit.unitId}`,dimensions:[{dimension:'family_specific_response',outcome:'INCORRECT',reasonCodes:['COMMITTED_WRONG_RESPONSE']}],reasonCodes:['BOUNDED_WRONG_RESPONSE'],candidateEvidenceAllowed:false,negativeEvidenceAllowed:true}]));

test('all eight production families execute a real wrong-answer direct-learning path and survive exact-state resume',async()=>{
 const receipts=[];
 for(const family of families){
  const task=examBetaTaskForLearner(family,learnerId,'suggested',`acceptance:${family}`,{purpose:'PRACTICE_NEW',recent:[]});
  assert.ok(task,`${family}: promoted task unavailable`);
  assert.equal(task.family,family);
  assert.equal(task.validation.canonical,'PASS');
  assert.ok(task.canonicalBinding.units.length,`${family}: canonical units missing`);
  const response=responseFor(task),semanticAssessmentsByUnitId=semanticFailureFor(task),focus=task.canonicalBinding.units[0];
  const plan={id:`plan:${family}`,learnerId,targetRef:focus.canonicalTargetRef,facet:focus.canonicalFacet,needKind:'REPAIR',objective:`${family} bounded repair`,reason:'frontend production acceptance',reasonCodes:['ACCEPTANCE'],timeBudgetMinutes:20,productMode:'EXAM'};
  const submission=await submitExamToCanonicalTeacherV1({learnerId,sessionId:`session:${family}`,task,lessonPlan:plan,productContext:product,learnerTruth:truth,response,semanticAssessmentsByUnitId,lookupExposure:[],support:'NONE',freshnessIdentity:`PRACTICE_NEW:${task.task_id}`});
  assert.ok(['FAILURE','PARTIAL'].includes(submission.assessment),`${family}: wrong response was not evaluated`);
  assert.ok(submission.unitResults.some(unit=>unit.outcome==='FAILURE'),`${family}: evaluator emitted no failure`);
  assert.equal(submission.unitResults.find(unit=>unit.outcome==='FAILURE').familyDiagnosis.family,family);
  assert.ok(submission.teacherDecision,`${family}: Teacher decision missing`);
  const sourceTaskContext=submission.teacherDecision.lineage.context.sourceTaskContext;
  const interaction=buildExamTeacherInteractionV1({decision:submission.teacherDecision,sessionId:`session:${family}`,sourceTaskContext});
  assert.ok(interaction,`${family}: interaction renderer contract missing`);
  assert.equal(interaction.mustAct,true);
  const surface=projectExamLearnerActionV1({decision:submission.teacherDecision,interaction,task,learnerResponse:response[focus.responseKey]});
  assert.equal(surface.taskId,task.task_id);
  assert.ok(surface.id.includes(submission.teacherDecision.provenance.decisionPointId));
  assert.ok(surface.kind,`${family}: concrete learner surface missing`);
  assert.ok(!('title'in surface)&&!('options'in surface),`${family}: generic title/options shell leaked`);
  const serialized=JSON.stringify(surface);
  assert.ok(serialized.includes('__EOT_COMMITTED_WRONG__')||['MIXED','DISCOURSE'].includes(family),`${family}: learner answer was not preserved`);
  const sourceAnchor=String(task.payload.passage??task.payload.source??task.payload.prompt??task.payload.chineseSentences?.[0]??'').slice(0,24);
  const surfaceStrings=[];const collect=value=>{if(typeof value==='string')surfaceStrings.push(value);else if(Array.isArray(value))value.forEach(collect);else if(value&&typeof value==='object')Object.values(value).forEach(collect)};collect(surface);
  assert.ok(!sourceAnchor||surfaceStrings.some(value=>value.includes(sourceAnchor)),`${family}: actual task source missing from surface`);
  const next=await continueExamTeacherAfterInteractionV1({learnerId,sessionId:`session:${family}`,lessonPlan:plan,productContext:product,learnerTruth:truth,previousDecision:submission.teacherDecision,completion:{kind:'SUBMITTED',response:'__EOT_TEACHING_ACTION__'},sourceTaskContext});
  assert.ok(next.treatmentResponse,`${family}: Treatment Response missing`);
  assert.ok(next.blockDecision.selectedBlockId,`${family}: next step missing`);
  const nextInteraction=buildExamTeacherInteractionV1({decision:next,sessionId:`session:${family}`,sourceTaskContext});
  const nextSurface=nextInteraction?projectExamLearnerActionV1({decision:next,interaction:nextInteraction,task,learnerResponse:response[focus.responseKey]}):undefined;
  const runtime=createExamOperationalRuntimeV1({sessionId:`session:${family}`,learnerId,taskId:task.task_id,family,subtype:task.subtype,freshnessIdentity:`PRACTICE_NEW:${task.task_id}`});
  const saved=updateExamOperationalRuntimeV1(runtime,{responses:response,teacherDecision:next,activeInteraction:interaction,interactionText:'__EOT_TEACHING_ACTION__',phase:'TEACHER_INTERACTION'});
  const resumed=resumableExamOperationalRuntimeV1(JSON.parse(JSON.stringify(saved)),learnerId,`session:${family}`);
  assert.deepEqual(resumed.responses,response,`${family}: responses changed on resume`);
  assert.equal(resumed.teacherDecision.provenance.decisionPointId,next.provenance.decisionPointId,`${family}: Teacher state changed on resume`);
  receipts.push({family,taskId:task.task_id,subtype:task.subtype,diagnosis:submission.unitResults.find(unit=>unit.outcome==='FAILURE').familyDiagnosis.observationKind,internalInteractionMode:interaction.mode,learnerSurface:surface.kind,rendererBlock:interaction.blockId,evaluatorOutcome:'FAILURE',treatmentResponseEvent:next.treatmentResponse.eventId,nextAction:next.action,nextBlock:next.blockDecision.selectedBlockId,nextLearnerSurface:nextSurface?.kind,resumeExact:true});
 }
 assert.equal(new Set(receipts.map(item=>item.taskId)).size,8);
 assert.ok(new Set(receipts.map(item=>item.learnerSurface)).size>=5,'family interactions collapsed into one generic surface');
 const vocabulary=receipts.find(item=>item.family==='VOCABULARY'),reading=receipts.find(item=>item.family==='READING');
 assert.ok(vocabulary.nextLearnerSurface&&vocabulary.nextLearnerSurface!==vocabulary.learnerSurface,`vocabulary relapse repeated ${JSON.stringify(vocabulary)}`);
 assert.ok(reading.nextLearnerSurface&&reading.nextLearnerSurface!==reading.learnerSurface,`reading repeated failure repeated ${JSON.stringify(reading)}`);
 const examRoute=fs.readFileSync('app/exam-practice.tsx','utf8');
 const renderers=fs.readFileSync('components/learning/PuzzleRenderers.tsx','utf8');
 const asyncState=fs.readFileSync('components/learning/LessonAsyncState.tsx','utf8');
 const projection=fs.readFileSync('src/application/exam/examTeacherInteraction.ts','utf8');
 assert.match(examRoute,/projectExamLearnerActionV1/);
 assert.match(examRoute,/<LearnerActionRenderer surface=\{learnerSurface\}/);
 assert.match(examRoute,/onEvent=\{commitLearnerAction\}/);
 assert.doesNotMatch(examRoute,/interaction\.mode==='EVIDENCE_SELECT'/);
 assert.doesNotMatch(`${examRoute}\n${renderers}\n${asyncState}`,/TeacherRail|learnerFacingRepairCopy/);
 assert.doesNotMatch(`${examRoute}\n${renderers}\n${projection}`,/先確認真正卡住的地方|先做一個小判斷|完成一個小判斷|完成這一步|先完成這個可檢查的小步驟|Teacher 不會替你選答案/);
 assert.doesNotMatch(projection,/discriminatingActions\s*\.\s*map\s*\(/);
 assert.doesNotMatch(renderers,/step\.phase\s*\}|step\.support\s*\}/);
 const out=path.resolve('artifacts/eot-production-frontend-acceptance');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'eight-family-paths.json'),JSON.stringify({generatedAt:new Date().toISOString(),count:receipts.length,receipts},null,2));
});

test('Batch 2 production route uses a persisted multi-activity session and spatial direct manipulation',()=>{
 const examRoute=fs.readFileSync('app/exam-practice.tsx','utf8');
 const renderers=fs.readFileSync('components/learning/PuzzleRenderers.tsx','utf8');
 const session=fs.readFileSync('src/application/session/learningSessionState.ts','utf8');
 assert.match(session,/kind:'CORE'/);assert.match(session,/kind:'UNRELATED'/);assert.match(session,/kind:'REENCOUNTER'/);
 assert.match(examRoute,/advanceLearningSessionV1/);
 assert.doesNotMatch(examRoute,/router\.replace\(`\/exam-practice\?/);
 assert.doesNotMatch(examRoute,/看看這次改變了什麼/);
 assert.match(renderers,/measureInWindow/);assert.match(renderers,/g\.moveX/);assert.match(renderers,/g\.moveY/);
 assert.match(renderers,/accessibilityLabel="可直接修改的原作"/);
 assert.doesNotMatch(renderers,/authored!==undefined\?<Text/);
 assert.match(renderers,/lookupGesture="LONG_PRESS"/);
});

test('session re-encounter is scheduled only after unrelated work and closes once',()=>{
 let session=createLearningSessionV1({id:'s',learnerId:'l',occurredAt:'2026-09-29T00:00:00.000Z',primary:{taskId:'read-a',family:'READING'},unrelated:{taskId:'vocab-b',family:'VOCABULARY'},reencounter:{taskId:'read-c',family:'READING'}});
 assert.equal(currentLearningActivityV1(session).kind,'CORE');
 session=advanceLearningSessionV1(session,'2026-09-29T00:01:00.000Z');assert.equal(currentLearningActivityV1(session).kind,'UNRELATED');
 session=advanceLearningSessionV1(session,'2026-09-29T00:02:00.000Z');assert.equal(currentLearningActivityV1(session).kind,'REENCOUNTER');
 session=advanceLearningSessionV1(session,'2026-09-29T00:03:00.000Z');assert.equal(session.status,'COMPLETED');assert.equal(currentLearningActivityV1(session),undefined);assert.equal(session.completedActivityIds.length,3);
});
