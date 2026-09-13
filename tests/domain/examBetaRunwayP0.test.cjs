const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'../..');
const{submitExamToCanonicalTeacherV1}=require('../../.domain-test-build/application/exam/examSubmissionAdapter.js');
const{admitExamEvidenceV1}=require('../../.domain-test-build/application/exam/examEvidenceAdmission.js');
const{buildExamTeacherInteractionV1,interactionOutcomeV1}=require('../../.domain-test-build/application/exam/examTeacherInteraction.js');
const{canonicalExamBindingV1}=require('../../.domain-test-build/content/examCanonicalBindings.js');
const{privateBetaUsageDaysV1,privateBetaReturnFollowThroughV1}=require('../../.domain-test-build/market-validation/privateBetaAnalytics.js');
const{assessExamSemanticUnitsV1}=require('../../.domain-test-build/application/exam/examSemanticAssessment.js');
const{blockRegistryV4}=require('../../.domain-test-build/application/v4/blockRegistryV4.js');
const{pckMechanismByIdV1}=require('../../.domain-test-build/teaching/pckCatalog.js');
const truth={learnerId:'learner-1',generatedFromEvidenceIds:[],capabilitySlice:[],interactionSlice:[],exposureSlice:[],goalContext:{}};
const product={learnerId:'learner-1',goals:['exam'],learningPurpose:'EXAM',useContexts:['EXAM_TASKS'],studyMinutes:10,productMode:'EXAM',entitlement:{status:'DEVELOPMENT',source:'test',planId:'test'}};
const plan={id:'plan',learnerId:'learner-1',targetRef:'reading.inference',facet:'SELECTION',needKind:'REPAIR',objective:'exam',reason:'exam',reasonCodes:[],timeBudgetMinutes:10,productMode:'EXAM'};
const base=(task,response={})=>({learnerId:'learner-1',sessionId:'session-1',task,lessonPlan:plan,productContext:product,learnerTruth:truth,response,lookupExposure:[],support:'NONE',freshnessIdentity:'fresh-1'});

test('1 invalid Exam task abstains without learner failure',async()=>{const r=await submitExamToCanonicalTeacherV1(base({task_id:'bad',family:'READING',subtype:'X',payload:{},validation:{canonical:'G1-G10_REQUIRED'}},{Q1:'A'}));assert.equal(r.assessment,'NOT_EVALUATED');assert.equal(r.teacherDecision,undefined);assert.equal(r.evidenceCommitAllowed,false)});

test('2 single semantic response key remains backwards compatible for Translation',async()=>{const binding=canonicalExamBindingV1('TRANS-T-001'),task={task_id:'TRANS-T-001',family:'TRANSLATION',subtype:'TARGETED_ONE_SENTENCE',payload:{},answer_or_rubric:{allowValidAlternatives:true},validation:{canonical:'PASS'},canonicalBinding:binding};const r=await submitExamToCanonicalTeacherV1({...base(task,{0:'A valid alternative'}),semanticOutcomes:{0:'CORRECT'}});assert.equal(r.assessment,'SUCCESS');assert.equal(r.unitResults[0].outcome,'SUCCESS')});

test('3 one Writing response verdict cannot be copied across multiple canonical scopes',async()=>{const binding=canonicalExamBindingV1('WRITE-M-001'),task={task_id:'WRITE-M-001',family:'WRITING',subtype:'MICRO',payload:{},answer_or_rubric:{dimensions:['task_fulfillment','idea_development','language']},validation:{canonical:'PASS'},canonicalBinding:binding};const r=await submitExamToCanonicalTeacherV1({...base(task,{writing:'A response'}),semanticOutcomes:{writing:'INCORRECT'}});assert.equal(r.assessment,'NOT_EVALUATED');assert.ok(r.reasonCodes.includes('UNIT_SCOPED_SEMANTIC_ASSESSMENT_REQUIRED'));assert.ok(r.unitResults.every(x=>x.outcome==='NOT_EVALUATED'))});

test('4 Writing unit-scoped semantic outcomes preserve distinct facets',async()=>{const binding=canonicalExamBindingV1('WRITE-M-001'),task={task_id:'WRITE-M-001',family:'WRITING',subtype:'MICRO',payload:{},answer_or_rubric:{dimensions:['task_fulfillment','idea_development','language']},validation:{canonical:'PASS'},canonicalBinding:binding};const outcomes=Object.fromEntries(binding.units.map((u,i)=>[u.unitId,i===0?'INCORRECT':'CORRECT']));const r=await submitExamToCanonicalTeacherV1({...base(task,{writing:'A response'}),semanticOutcomesByUnitId:outcomes});assert.equal(r.assessment,'PARTIAL');assert.equal(r.unitResults[0].outcome,'FAILURE');assert.ok(r.unitResults.slice(1).every(x=>x.outcome==='SUCCESS'));assert.equal(r.teacherDecision.provenance.targetRef,'writing.purpose-audience')});

test('5 closed-key clean success reaches C/K admission as independent local evidence',async()=>{const full=canonicalExamBindingV1('READ-001'),binding={...full,units:[full.units[0]]},task={task_id:'READ-001',family:'READING',subtype:'PASSAGE_3Q',payload:{},answer_or_rubric:{answers:{Q1:'B'}},validation:{canonical:'PASS'},canonicalBinding:binding};const r=await submitExamToCanonicalTeacherV1(base(task,{Q1:'B'}));const a=admitExamEvidenceV1({learnerId:'learner-1',sessionId:'s',task,result:r,support:'NONE',lookupExposure:[],freshnessIdentity:'fresh'});assert.equal(a[0].status,'ACCEPTED');assert.equal(a[0].proofMode,'INDEPENDENT')});

test('6 lookup-assisted success can be recorded but cannot masquerade as independent',async()=>{const full=canonicalExamBindingV1('READ-001'),binding={...full,units:[full.units[0]]},task={task_id:'READ-001',family:'READING',subtype:'PASSAGE_3Q',payload:{},answer_or_rubric:{answers:{Q1:'B'}},validation:{canonical:'PASS'},canonicalBinding:binding};const r=await submitExamToCanonicalTeacherV1({...base(task,{Q1:'B'}),lookupExposure:['target:Q1']});const a=admitExamEvidenceV1({learnerId:'learner-1',sessionId:'s',task,result:r,support:'NONE',lookupExposure:['target:Q1'],freshnessIdentity:'fresh'});assert.equal(a[0].status,'ACCEPTED');assert.equal(a[0].proofMode,'ASSISTED')});

test('7 semantic outcomes do not enter C/K without qualified semantic evidence authority',async()=>{const binding=canonicalExamBindingV1('TRANS-T-001'),task={task_id:'TRANS-T-001',family:'TRANSLATION',subtype:'TARGETED_ONE_SENTENCE',payload:{},answer_or_rubric:{},validation:{canonical:'PASS'},canonicalBinding:binding};const r=await submitExamToCanonicalTeacherV1({...base(task,{0:'valid'}),semanticOutcomesByUnitId:{[binding.units[0].unitId]:'CORRECT'}});const a=admitExamEvidenceV1({learnerId:'learner-1',sessionId:'s',task,result:r,support:'NONE',lookupExposure:[],freshnessIdentity:'fresh'});assert.equal(a[0].status,'SKIPPED');assert.ok(a[0].reasons.includes('SEMANTIC_OUTCOME_NOT_QUALIFIED_FOR_EVIDENCE'))});

test('8 Teacher interaction requires learner action and completion does not fake success',()=>{const decision={action:'TEACH',blockDecision:{selectedBlockId:'inference-evidence-bridge',supportLevel:'LIGHT',pedagogicalIntent:'TEACH'},provenance:{decisionPointId:'dp-1'},experience:{mechanismId:'inference-evidence-bridge'}};const i=buildExamTeacherInteractionV1({decision,sessionId:'s'});assert.equal(i.mustAct,true);assert.equal(i.answerLeakageForbidden,true);assert.notEqual(i.mode,'RETURN');assert.equal(interactionOutcomeV1({decision,completion:{kind:'SUBMITTED',response:'evidence'}}),'EXPOSURE_ONLY');const practice={...decision,action:'PRACTICE',blockDecision:{...decision.blockDecision,selectedBlockId:'sentence-builder',pedagogicalIntent:'PRACTICE'}};assert.equal(interactionOutcomeV1({decision:practice,completion:{kind:'SUBMITTED',response:'anything'}}),'NOT_EVALUATED')});

test('9 Writing teaching gaps are registered without creating a new Teacher system',()=>{for(const id of['task-requirement-map','idea-development-ladder']){assert.ok(blockRegistryV4.get(id));assert.ok(pckMechanismByIdV1(id));assert.equal(blockRegistryV4.get(id).role,'TEACH');assert.equal(blockRegistryV4.get(id).evidenceCeiling,'EXPOSURE_ONLY')}});

const{createExamOperationalRuntimeV1,updateExamOperationalRuntimeV1,resumableExamOperationalRuntimeV1,examLessonPlanForDecisionV1}=require('../../.domain-test-build/application/exam/examOperationalRuntime.js');

test('10 Exam operational runtime survives JSON restart with the same task answers and Teacher interaction',()=>{const runtime=createExamOperationalRuntimeV1({sessionId:'exam:READ-001:learner-1',learnerId:'learner-1',taskId:'READ-001',family:'READING',subtype:'PASSAGE_3Q',freshnessIdentity:'fresh'}),decision={action:'TEACH',blockDecision:{selectedBlockId:'inference-evidence-bridge',supportLevel:'LIGHT',pedagogicalIntent:'TEACH'},provenance:{decisionPointId:'dp-1',selectedMechanismId:'inference-evidence-bridge',targetRef:'reading.inference',facet:'SELECTION'},experience:{mechanismId:'inference-evidence-bridge'}},interaction={schemaVersion:1,interactionId:'i',decisionPointId:'dp-1',blockId:'inference-evidence-bridge',mechanismId:'inference-evidence-bridge',mode:'TEXT',title:'t',prompt:'p',support:'LIGHT',mustAct:true,answerLeakageForbidden:true};const updated=updateExamOperationalRuntimeV1(runtime,{responses:{Q1:'B'},teacherDecision:decision,activeInteraction:interaction,interactionText:'evidence',phase:'TEACHER_INTERACTION'}),reloaded=resumableExamOperationalRuntimeV1(JSON.parse(JSON.stringify(updated)),'learner-1','exam:READ-001:learner-1');assert.ok(reloaded);assert.equal(reloaded.taskId,'READ-001');assert.equal(reloaded.responses.Q1,'B');assert.equal(reloaded.interactionText,'evidence');assert.equal(reloaded.teacherDecision.provenance.decisionPointId,'dp-1');assert.equal(reloaded.decisionHistory.length,1)});

test('11 same Teacher decision point does not duplicate Exam decision history on retry',()=>{const runtime=createExamOperationalRuntimeV1({sessionId:'s',learnerId:'learner-1',taskId:'T',family:'READING',subtype:'X',freshnessIdentity:'f'}),decision={action:'TEACH',blockDecision:{selectedBlockId:'inference-evidence-bridge',supportLevel:'LIGHT',pedagogicalIntent:'TEACH'},provenance:{decisionPointId:'same',selectedMechanismId:'inference-evidence-bridge',targetRef:'reading.inference',facet:'SELECTION'},experience:{mechanismId:'inference-evidence-bridge'}};const once=updateExamOperationalRuntimeV1(runtime,{teacherDecision:decision}),twice=updateExamOperationalRuntimeV1(once,{teacherDecision:decision});assert.equal(twice.decisionHistory.length,1)});

test('12 persisted Exam LessonPlan follows the canonical Teacher target rather than the route placeholder',()=>{const decision={provenance:{targetRef:'writing.purpose-audience',facet:'CONTEXTUAL_APPROPRIACY'}};const bound=examLessonPlanForDecisionV1(plan,decision);assert.equal(bound.targetRef,'writing.purpose-audience');assert.equal(bound.facet,'CONTEXTUAL_APPROPRIACY');assert.equal(bound.id,plan.id)});

test('13 accepted Exam evidence exposes deterministic canonical payload for persistence',async()=>{const full=canonicalExamBindingV1('READ-001'),binding={...full,units:[full.units[0]]},task={task_id:'READ-001',family:'READING',subtype:'PASSAGE_3Q',payload:{},answer_or_rubric:{answers:{Q1:'B'}},validation:{canonical:'PASS'},canonicalBinding:binding};const r=await submitExamToCanonicalTeacherV1(base(task,{Q1:'B'}));const a=admitExamEvidenceV1({learnerId:'learner-1',sessionId:'session-1',task,result:r,support:'NONE',lookupExposure:[],freshnessIdentity:'fresh-1',occurredAt:'2026-09-04T15:00:00.000Z'});assert.equal(a[0].status,'ACCEPTED');assert.ok(a[0].candidate);assert.ok(a[0].taskContract);assert.ok(a[0].canonicalEvent);assert.equal(a[0].canonicalEvent.id,a[0].eventId);assert.equal(a[0].canonicalEvent.learnerId,'learner-1')});

test('14 private beta week-one threshold counts local usage days and can compare stated return intent with actual next-day return',()=>{
 const pulses=[
  {submittedAt:'2026-09-04T15:40:00.000Z',localDate:'2026-09-04',returnTomorrow:'YES'},
  {submittedAt:'2026-09-04T16:10:00.000Z',localDate:'2026-09-04',returnTomorrow:'MAYBE'},
  {submittedAt:'2026-09-05T14:00:00.000Z',localDate:'2026-09-05',returnTomorrow:'YES'},
 ];
 const events=[{occurredAt:'2026-09-05T02:00:00.000Z',localDate:'2026-09-05',type:'SESSION_OPENED'}];
 assert.equal(privateBetaUsageDaysV1(pulses),2);
 const follow=privateBetaReturnFollowThroughV1(pulses,events);
 assert.equal(follow.YES.stated,2);assert.equal(follow.YES.returnedNextDay,1);assert.equal(follow.MAYBE.stated,1);assert.equal(follow.MAYBE.returnedNextDay,1);
 const src=fs.readFileSync(path.join(root,'src/market-validation/privateBetaPulse.ts'),'utf8');assert.match(src,/privateBetaUsageDaysV1\(pulses\) >= 5/);
});

test('15 private beta product feedback is stored outside canonical learner truth',()=>{
 const src=fs.readFileSync(path.join(root,'src/market-validation/privateBetaPulse.ts'),'utf8');
 assert.match(src,/eot:private-beta:pulses:v1/);
 assert.doesNotMatch(src,/commitCandidate|CanonicalEvidence|learner-truth|operationalDatabase/);
});


test('16 promoted Translation bounded semantic assessment accepts a valid alternative without exact-string matching',async()=>{
 const binding=canonicalExamBindingV1('TRANS-T-001'),task={task_id:'TRANS-T-001',family:'TRANSLATION',subtype:'TARGETED_ONE_SENTENCE',payload:{chineseSentences:['學生應該善用每天零碎的時間，因為這樣比較不容易半途放棄。']},answer_or_rubric:{allowValidAlternatives:true},validation:{canonical:'PASS'},canonicalBinding:binding},response={0:'Students should make good use of short periods of free time each day because they are less likely to give up.'};
 const semantic=assessExamSemanticUnitsV1({task,response}),decision=semantic.decisionsByUnitId[binding.units[0].unitId];assert.equal(decision.outcome,'CORRECT');assert.equal(decision.authority,'BOUNDED_RUBRIC');
 const r=await submitExamToCanonicalTeacherV1({...base(task,response),semanticAssessmentsByUnitId:semantic.decisionsByUnitId});assert.equal(r.assessment,'SUCCESS');assert.equal(r.unitResults[0].semanticAssessment.authority,'BOUNDED_RUBRIC');
});

test('17 promoted Translation bounded rubric stays fail-closed when a valid-alternative judgment is not safe',()=>{
 const binding=canonicalExamBindingV1('TRANS-T-001'),task={task_id:'TRANS-T-001',family:'TRANSLATION',subtype:'TARGETED_ONE_SENTENCE',payload:{chineseSentences:['學生應該善用每天零碎的時間，因為這樣比較不容易半途放棄。']},validation:{canonical:'PASS'},canonicalBinding:binding};
 const semantic=assessExamSemanticUnitsV1({task,response:{0:'Time matters a lot for teenagers.'}}),decision=semantic.decisionsByUnitId[binding.units[0].unitId];assert.ok(['AMBIGUOUS','ABSTAIN'].includes(decision.outcome));assert.equal(decision.candidateEvidenceAllowed,false);assert.equal(decision.negativeEvidenceAllowed,false);
});

test('18 Writing one response produces genuinely different scoped semantic decisions',()=>{
 const binding=canonicalExamBindingV1('WRITE-M-001'),task={task_id:'WRITE-M-001',family:'WRITING',subtype:'MICRO',payload:{mode:'MICRO',prompt:'手機',requirementBullets:['表達清楚觀點','至少一個理由或具體發展']},validation:{canonical:'PASS'},canonicalBinding:binding},response={writing:'I think phones should be limited in class.'};
 const semantic=assessExamSemanticUnitsV1({task,response}),byTarget=Object.fromEntries(binding.units.map(u=>[u.canonicalTargetRef,semantic.decisionsByUnitId[u.unitId].outcome]));assert.equal(byTarget['writing.purpose-audience'],'CORRECT');assert.notEqual(byTarget['writing.idea-reasoning'],'CORRECT');assert.ok(['CORRECT','PARTIALLY_CORRECT'].includes(byTarget['writing.sentence-realization']));
});

test('19 Writing idea development can become correct without changing task-fulfillment authority',()=>{
 const binding=canonicalExamBindingV1('WRITE-M-001'),task={task_id:'WRITE-M-001',family:'WRITING',subtype:'MICRO',payload:{mode:'MICRO'},validation:{canonical:'PASS'},canonicalBinding:binding},response={writing:'I think phones should be limited in class because notifications distract students from the lesson.'};
 const semantic=assessExamSemanticUnitsV1({task,response}),byTarget=Object.fromEntries(binding.units.map(u=>[u.canonicalTargetRef,semantic.decisionsByUnitId[u.unitId]]));assert.equal(byTarget['writing.purpose-audience'].outcome,'CORRECT');assert.equal(byTarget['writing.idea-reasoning'].outcome,'CORRECT');assert.equal(byTarget['writing.purpose-audience'].authority,'BOUNDED_RUBRIC');assert.equal(byTarget['writing.idea-reasoning'].authority,'BOUNDED_RUBRIC');
});

test('20 qualified bounded semantic success can reach C/K while ambiguous semantic output cannot',async()=>{
 const binding=canonicalExamBindingV1('TRANS-T-001'),task={task_id:'TRANS-T-001',family:'TRANSLATION',subtype:'TARGETED_ONE_SENTENCE',payload:{chineseSentences:['學生應該善用每天零碎的時間，因為這樣比較不容易半途放棄。']},validation:{canonical:'PASS'},canonicalBinding:binding};
 const goodResponse={0:'Students should use their spare time well every day because this makes them less likely to give up.'},goodSemantic=assessExamSemanticUnitsV1({task,response:goodResponse}),good=await submitExamToCanonicalTeacherV1({...base(task,goodResponse),semanticAssessmentsByUnitId:goodSemantic.decisionsByUnitId}),goodAdmission=admitExamEvidenceV1({learnerId:'learner-1',sessionId:'s-good',task,result:good,support:'NONE',lookupExposure:[],freshnessIdentity:'fresh-good'});assert.equal(goodAdmission[0].status,'ACCEPTED');
 const unclearResponse={0:'Time matters a lot for teenagers.'},unclearSemantic=assessExamSemanticUnitsV1({task,response:unclearResponse}),unclear=await submitExamToCanonicalTeacherV1({...base(task,unclearResponse),semanticAssessmentsByUnitId:unclearSemantic.decisionsByUnitId}),unclearAdmission=admitExamEvidenceV1({learnerId:'learner-1',sessionId:'s-unclear',task,result:unclear,support:'NONE',lookupExposure:[],freshnessIdentity:'fresh-unclear'});assert.equal(unclear.assessment,'NOT_EVALUATED');assert.equal(unclearAdmission[0].status,'SKIPPED');
});

const{examBetaTasks,examBetaTaskForLearner,examBetaPromotionReport,practiceFamilyToExamFamily,examFamilyToPracticeFamilyV1}=require('../../.domain-test-build/content/examBetaBank.js');

test('21 comprehensive choice IDs are resolved through the displayed option text instead of being falsely marked wrong',async()=>{
 const task=examBetaTasks('COMPREHENSIVE').find(x=>x.task_id==='COMP-G-004');assert.ok(task);const r=await submitExamToCanonicalTeacherV1(base(task,{1:'A',2:'A',3:'A',4:'A',5:'A'}));assert.equal(r.unitResults[0].outcome,'SUCCESS');assert.equal(r.unitResults[1].outcome,'SUCCESS');assert.equal(r.unitResults[2].outcome,'SUCCESS');assert.equal(r.unitResults[3].outcome,'SUCCESS');assert.equal(r.unitResults[4].outcome,'SUCCESS');
});

test('22 Mixed typed fill accepts its explicit acceptable-answer set',async()=>{
 const task=examBetaTasks('MIXED').find(x=>x.task_id==='MIX-G-002');assert.ok(task);const semantic=assessExamSemanticUnitsV1({task,response:{P1:'C',P2:'58',P3:'Volunteer/service has the largest number of interested non-members, with 58 students.'}}),r=await submitExamToCanonicalTeacherV1({...base(task,{P1:'C',P2:'58',P3:'Volunteer/service has the largest number of interested non-members, with 58 students.'}),semanticAssessmentsByUnitId:semantic.decisionsByUnitId});assert.equal(r.unitResults.find(x=>x.unitId.endsWith(':P2')).outcome,'SUCCESS');
});

test('23 Mixed short response is semantic and part-scoped rather than exact-string scored',async()=>{
 const task=examBetaTasks('MIXED').find(x=>x.task_id==='MIX-G-001');assert.ok(task);const response={P1:'C',P2:'Lake',P3:'A passenger with a bicycle should avoid it because bicycles cannot be carried on the replacement bus.'},semantic=assessExamSemanticUnitsV1({task,response}),p3=task.canonicalBinding.units.find(x=>x.responseKey==='P3'),decision=semantic.decisionsByUnitId[p3.unitId];assert.equal(decision.outcome,'CORRECT');assert.equal(decision.authority,'BOUNDED_RUBRIC');
});

test('24 classmate content runway has at least three explicitly promoted tasks for every Exam-practice family',()=>{
 const report=examBetaPromotionReport();assert.equal(report.classmateRunwayMinimumMet,true);for(const family of['COMPREHENSIVE','CONTEXTUAL_FILL','DISCOURSE','READING','MIXED','TRANSLATION','WRITING'])assert.ok(report.byFamily[family]>=3,`${family}:${report.byFamily[family]}`);
});

test('25 Translation and Writing amount selectors preserve the learner-selected task scale',()=>{
 for(let i=0;i<20;i++){const one=examBetaTaskForLearner('TRANSLATION','L','1 句',String(i)),two=examBetaTaskForLearner('TRANSLATION','L','2 句',String(i)),micro=examBetaTaskForLearner('WRITING','L','短練習',String(i)),paragraph=examBetaTaskForLearner('WRITING','L','一段',String(i)),full=examBetaTaskForLearner('WRITING','L','完整作文',String(i));assert.equal(one.payload.mode,'TARGETED');assert.equal(two.payload.mode,'FULL');assert.equal(micro.payload.mode,'MICRO');assert.equal(paragraph.payload.mode,'PARAGRAPH');assert.equal(full.payload.mode,'FULL')}
});

test('26 only explicit promoted registry members enter the learner Exam bank',()=>{
 const all=['COMPREHENSIVE','CONTEXTUAL_FILL','DISCOURSE','READING','MIXED','TRANSLATION','WRITING'].flatMap(examBetaTasks);assert.equal(all.some(task=>task.task_id==='COMP-G-001'),false);assert.equal(all.some(task=>task.promotion_state!=='PROMOTED'||task.validation.canonical!=='PASS'),false);
});

test('27 curated Translation meaning alternative can be scored by bounded semantic authority',()=>{
 const task=examBetaTasks('TRANSLATION').find(x=>x.task_id==='TRANS-G-T05');assert.ok(task);const response={0:'The event not only reduces waste but also teaches residents how to repair everyday items.'},semantic=assessExamSemanticUnitsV1({task,response}),decision=semantic.decisionsByUnitId[task.canonicalBinding.units[0].unitId];assert.equal(decision.outcome,'CORRECT');assert.equal(decision.candidateEvidenceAllowed,true);
});

test('28 curated Writing task fulfillment uses its own prompt requirements instead of the old phone-only heuristic',()=>{
 const task=examBetaTasks('WRITING').find(x=>x.task_id==='WRITE-G-M06');assert.ok(task);const response={writing:'I think AI can make students lazy if they copy answers without thinking, but it can help when they use it only for hints.'},semantic=assessExamSemanticUnitsV1({task,response}),purpose=task.canonicalBinding.units.find(x=>x.canonicalTargetRef==='writing.purpose-audience'),idea=task.canonicalBinding.units.find(x=>x.canonicalTargetRef==='writing.idea-reasoning');assert.equal(semantic.decisionsByUnitId[purpose.unitId].outcome,'CORRECT');assert.equal(semantic.decisionsByUnitId[idea.unitId].outcome,'CORRECT');
});

test('29 curated semantic uncertainty remains fail-closed and cannot create negative learner evidence',async()=>{
 const task=examBetaTasks('TRANSLATION').find(x=>x.task_id==='TRANS-G-T05');assert.ok(task);const response={0:'Teachers are important.'},semantic=assessExamSemanticUnitsV1({task,response}),r=await submitExamToCanonicalTeacherV1({...base(task,response),semanticAssessmentsByUnitId:semantic.decisionsByUnitId}),a=admitExamEvidenceV1({learnerId:'learner-1',sessionId:'semantic-uncertain',task,result:r,support:'NONE',lookupExposure:[],freshnessIdentity:'fresh-semantic-uncertain'});assert.equal(r.assessment,'NOT_EVALUATED');assert.ok(a.every(x=>x.status==='SKIPPED'));
});

test('30 Exam family routing is reversible so Today and Practice can resume the exact active Exam family',()=>{
 for(const family of['VOCABULARY','COMPREHENSIVE','CONTEXTUAL_FILL','DISCOURSE','READING','MIXED','TRANSLATION','WRITING']){const practice=examFamilyToPracticeFamilyV1(family);assert.ok(practice);assert.equal(practiceFamilyToExamFamily(practice),family)}
});

test('31 learner-facing Today and Practice consume active Exam persistence instead of hiding an unfinished Exam session',()=>{
 const today=fs.readFileSync(path.join(root,'app/(tabs)/index.tsx'),'utf8'),practice=fs.readFileSync(path.join(root,'app/(tabs)/practice.tsx'),'utf8');
 assert.match(today,/loadActiveExamOperationalCheckpointV1/);assert.match(today,/exam-practice\?practiceFamily=/);assert.match(today,/你剛才的 Exam 練習和 Teacher 進度都還在/);
 assert.match(practice,/loadActiveExamOperationalCheckpointV1/);assert.match(practice,/繼續剛才的考試練習/);assert.match(practice,/答案和目前進度都已保存/);
});

test('32 beta telemetry is idempotent at stable product milestones and report includes actual return follow-through without learner truth',()=>{
 const pulse=fs.readFileSync(path.join(root,'src/market-validation/privateBetaPulse.ts'),'utf8'),exam=fs.readFileSync(path.join(root,'app/exam-practice.tsx'),'utf8');
 assert.match(pulse,/eventKey\?: string/);assert.match(pulse,/filter\(value => value\.id !== event\.id\)/);assert.match(pulse,/returnFollowThrough/);assert.match(pulse,/learnerTruthIncluded: false/);
 assert.match(exam,/eventKey: `shown:\$\{decision\.provenance\.decisionPointId\}`/);assert.match(exam,/eventKey: 'completed'/);assert.match(exam,/eventKey: 'pulse'/);
});
