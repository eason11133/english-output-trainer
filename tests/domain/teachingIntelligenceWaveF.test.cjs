const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build-wave-f';
const fromBuild=rel=>require(path.join(root,build,rel));
const f=fromBuild('teaching/index.js');
const teacher=fromBuild('teacher-runtime/index.js');
const evaluation=fromBuild('evaluation/index.js');

const allowRequest=(overrides={})=>({
  targetRef:'allow-object-infinitive',facet:'CONSTRUCTION',targetArea:'GRAMMAR',targetKind:'GRAMMAR_CONSTRUCTION',learnerState:'OBSERVED_FRAGILE',supportDependence:'UNKNOWN',competingHypotheses:[],
  current:{outcome:'FAILURE',support:'NONE',eventKind:'LEARNER_RESPONSE'},
  conditions:f.defaultTeachingOpportunityConditionsV1({support:'NONE',elicitation:'OPEN_CHOICE',context:'SOURCE',taskLoad:'MEDIUM'}),recentTreatment:[],...overrides,
});
const lesson={id:'f-lesson',learnerId:'f-learner',targetRef:'allow-object-infinitive',facet:'CONSTRUCTION',needKind:'REINFORCEMENT',objective:'repair production',reason:'fragile output',reasonCodes:['FRAGILE'],timeBudgetMinutes:20,productMode:'GENERAL'};
const productContext={learnerId:'f-learner',goals:['write independently'],learningPurpose:'school writing',useContexts:['writing'],studyMinutes:20,productMode:'GENERAL',entitlement:{status:'DEVELOPMENT',source:'test',planId:'test'}};
const learnerTruth=(hypotheses=[])=>({learnerId:'f-learner',generatedFromEvidenceIds:[],capabilitySlice:[{targetRef:'allow-object-infinitive',facet:'CONSTRUCTION',state:'OBSERVED_FRAGILE',confidence:'MEDIUM',supportDependence:'UNKNOWN',sourceEvidenceIds:[],sourceControl:false,transferSupport:false,retentionSupport:false,hypotheses}],interactionSlice:[],exposureSlice:[],goalContext:{},projectionVersion:1});
const event=(overrides={})=>({id:'f-event',kind:'LEARNER_RESPONSE',occurredAt:'2026-08-28T00:00:00Z',outcome:'FAILURE',support:'NONE',observationIds:['obs-f'],productionConditions:f.defaultTeachingOpportunityConditionsV1({support:'NONE',elicitation:'OPEN_CHOICE',context:'SOURCE',taskLoad:'MEDIUM'}),...overrides});
const proposal=(overrides={})=>({teacherAction:'TEACH',lessonPlanId:lesson.id,pedagogicalIntent:'TEACH',focusFacet:lesson.facet,targetReference:lesson.targetRef,selectedBlockId:'grammar-role-map',supportLevel:'EXPLICIT',contextProvenance:'SAME_CONTEXT',evidenceToObserve:[],successTransitionIntent:'REDECIDE',failureTransitionIntent:'CHANGE_REPRESENTATION',confidence:'HIGH',unresolvedAmbiguity:null,internalDecisionReason:'hidden',...overrides});

function context(hypotheses=[],ev=event()){
  return teacher.compilePedagogicalContextV1({lessonPlan:lesson,productContext,learnerTruth:learnerTruth(hypotheses),event:ev,recentAttempts:[],recentTreatmentResponses:[],timeRemainingMinutes:20,provider:async()=>proposal()});
}

test('F mode registry covers all required learner cognitive primitives through registered production blocks',()=>{
  assert.deepEqual(f.validateTeachingPrimitiveCoverageV1(),[]);
  for(const primitive of f.requiredTeachingPrimitivesV1)assert.ok(f.teachingModesByPrimitiveV1(primitive).length>0,primitive);
});

test('the ten established teaching representations are reconciled into one canonical PCK catalog',()=>{
  const ids=f.canonicalPckMechanismsV1.map(x=>x.id);
  assert.equal(f.establishedTeachingRepresentationIdsV1.length,10);
  for(const id of f.establishedTeachingRepresentationIdsV1)assert.ok(ids.includes(id),id);
  for(const block of f.blockRegistryV4.byRole('TEACH'))assert.ok(ids.includes(block.id),`missing PCK metadata for ${block.id}`);
  for(const item of f.canonicalPckMechanismsV1){assert.ok(item.requiredLearnerAction.length>10,item.id);assert.ok(item.suitableBottlenecks.length>0,item.id);assert.ok(item.replanConditions.length>0,item.id)}
});

test('Teacher composes a bounded registered sequence through learner action fade fresh attempt and return',()=>{const plan=f.composeTeacherPlanV1({request:allowRequest(),occurredAt:'2026-08-30T00:00:00Z',sessionId:'s1',mode:'WRITING'}),validation=f.validateTeacherCompositionV1(plan);assert.equal(validation.valid,true);assert.ok(plan.pieces.length>=4&&plan.pieces.length<=7);assert.equal(plan.pieces[0].kind,'REPRESENT');assert.ok(plan.pieces.some(x=>x.kind==='GUIDED_ACTION'));assert.ok(plan.pieces.some(x=>x.kind==='FADE_SUPPORT'));assert.ok(plan.pieces.some(x=>x.kind==='FRESH_ATTEMPT'));assert.equal(plan.pieces.at(-1).kind,'RETURN_TO_OUTPUT');assert.equal(plan.masteryMutationAllowed,false)});
test('failed composition excludes the ineffective mechanism and recomposes with a material alternative',()=>{const a=f.composeTeacherPlanV1({request:allowRequest(),occurredAt:'2026-08-30T00:00:00Z',sessionId:'s1'}),failed=f.advanceTeacherCompositionV1(a,'CONFUSED','2026-08-30T00:01:00Z'),b=f.recomposeTeacherPlanV1({prior:failed,request:allowRequest({recentTreatment:[{mechanismId:a.pieces[0].mechanismId,support:'GUIDED',outcome:'FAILURE',responseSignal:'CONFUSED'}]}),occurredAt:'2026-08-30T00:01:00Z',sessionId:'s1'});assert.equal(failed.status,'RECOMPOSED');assert.notEqual(b.pieces[0].mechanismId,a.pieces[0].mechanismId);assert.ok(b.excludedMechanismIds.includes(a.pieces[0].mechanismId))});
test('composition validation rejects arbitrary unregistered UI pieces',()=>{const plan=f.composeTeacherPlanV1({request:allowRequest(),occurredAt:'2026-08-30T00:00:00Z',sessionId:'s1'}),invalid={...plan,pieces:[...plan.pieces,{...plan.pieces[0],id:'invented',blockId:'invented-widget'}]};assert.equal(f.validateTeacherCompositionV1(invalid).valid,false)});
test('cross-session failed treatment changes HOW only for the matching target/facet request',()=>{const first=f.selectPreferredTeachingBlockV1(allowRequest()).block,session2=f.selectPreferredTeachingBlockV1(allowRequest({recentTreatment:[{mechanismId:first.id,support:'GUIDED',outcome:'FAILURE',responseSignal:'CONFUSED',occurredAt:'2026-08-29'}]})).block;assert.notEqual(session2.id,first.id);const unrelated=f.selectPreferredTeachingBlockV1({...allowRequest(),targetRef:'writing.sentence-realization',targetArea:'WRITING',targetKind:'WRITING_CAPABILITY',facet:'FREE_PRODUCTION',recentTreatment:[]}).block;assert.ok(unrelated);assert.equal(f.deriveTeachingOptionsV1(allowRequest()).feedbackBudget.maxConcurrentTargets,1)});
test('lexical composition preserves exact sense identity instead of reteaching a whole lemma',()=>{const lexical={...allowRequest(),targetRef:'sense.allow.permission',targetArea:'LEXICAL',targetKind:'SENSE',facet:'SENSE_DISCRIMINATION',current:{outcome:'FAILURE',support:'NONE',eventKind:'LEARNER_RESPONSE'}},plan=f.composeTeacherPlanV1({request:lexical,occurredAt:'2026-08-30',sessionId:'lexical'});assert.equal(plan.targetRef,'sense.allow.permission');assert.equal(plan.facet,'SENSE_DISCRIMINATION');assert.ok(['meaning-representation','form-contrast'].includes(plan.pieces[0].mechanismId))});
test('Reading ability and exam-procedure causes retain materially different registered representations',()=>{const ability={...allowRequest(),targetRef:'reading.inference',targetArea:'READING',targetKind:'READING_CAPABILITY',facet:'FORM_TO_MEANING',competingHypotheses:[{id:'reference-break',label:'reference meaning unresolved',status:'SUPPORTED',supportingEvidenceIds:[],contradictingEvidenceIds:[]}]},procedure={...allowRequest(),targetRef:'reading.inference',targetArea:'READING',targetKind:'READING_CAPABILITY',facet:'SELECTION',competingHypotheses:[{id:'option-procedure',label:'distractor evidence checking',status:'SUPPORTED',supportingEvidenceIds:[],contradictingEvidenceIds:[]}]};const a=f.selectPreferredTeachingBlockV1(ability).block,b=f.selectPreferredTeachingBlockV1(procedure).block;assert.ok(a&&b);assert.notEqual(a.id,b.id)});
const pck=(overrides={})=>({schemaVersion:1,assetId:'pck:sense:allow',kind:'LEXICAL_SENSE_CONTRAST',domain:'LEXICAL',family:'contextual-sense',targetRefs:['sense.allow.permission'],facets:['SENSE_DISCRIMINATION'],lexical:{lemma:'allow',senseId:'sense.allow.permission'},learnerStates:['UNKNOWN'],compatibleMechanismIds:['meaning-representation'],representation:'contrast permit with nearby senses',learnerAction:'select the intended contextual sense',supportCompatibility:['GUIDED','LIGHT'],contraindications:['sense already independently controlled'],recomposeConditions:['no progress'],fadeConditions:['select without contrast'],productModes:['GENERAL','EXAM'],provenance:{sourceKind:'TEACHER_HANDWRITTEN_NOTE',sourceId:'teacher-note-1',sourceLocation:'page-2'},confidence:'HIGH',status:'PRODUCTION_ELIGIBLE',productionEligible:true,reviewedBy:'reviewer',reviewedAt:'2026-08-31',...overrides});
test('PCK ingestion preserves provenance and only reviewed high-confidence assets become production eligible',()=>{const raw=pck({assetId:'pck:sense:allow:candidate',status:'EXTRACTED_CANDIDATE',productionEligible:false,confidence:'LOW',reviewedBy:undefined,reviewedAt:undefined}),valid=pck(),result=f.ingestPckAssetsV1([raw,valid]);assert.equal(result.accepted.length,2);assert.equal(result.productionEligible.length,1);assert.equal(result.productionEligible[0].provenance.sourceKind,'TEACHER_HANDWRITTEN_NOTE');assert.equal(result.productionEligible[0].provenance.sourceLocation,'page-2')});
test('PCK exact-sense, shared General/Exam identity and failed-mechanism contraindication gates are enforced',()=>{const asset=pck(),base={...allowRequest(),targetRef:'sense.allow.permission',targetArea:'LEXICAL',targetKind:'SENSE',facet:'SENSE_DISCRIMINATION'},general=f.eligiblePckAssetsForRequestV1([asset],{request:base,productMode:'GENERAL',senseId:'sense.allow.permission'}),exam=f.eligiblePckAssetsForRequestV1([asset],{request:base,productMode:'EXAM',senseId:'sense.allow.permission'}),wrong=f.eligiblePckAssetsForRequestV1([asset],{request:base,productMode:'GENERAL',senseId:'sense.other'}),failed=f.eligiblePckAssetsForRequestV1([asset],{request:{...base,recentTreatment:[{mechanismId:'meaning-representation',support:'GUIDED',outcome:'FAILURE',responseSignal:'CONFUSED'}]},productMode:'GENERAL',senseId:'sense.allow.permission'});assert.equal(general[0].assetId,exam[0].assetId);assert.equal(wrong.length,0);assert.equal(failed.length,0)});
test('Exam procedure PCK carries bounded time strategy and cannot infer language inability from slowness',()=>{const asset=pck({assetId:'pck:exam:reading-return',kind:'EXAM_PROCEDURE',domain:'EXAM',family:'reading',targetRefs:['reading.inference'],facets:['SELECTION'],lexical:undefined,compatibleMechanismIds:['distractor-evidence-contrast'],examTiming:{minimumEvidenceWindowSeconds:45,readDepthEscalation:'increase only after option evidence conflicts',stopRule:'stop after sufficient contradictory evidence',skipCondition:'insufficient evidence within bounded window',returnCondition:'return after higher-value items',accuracyTimeTradeoff:'preserve evidence threshold before speed',recurringTimeFailurePattern:'procedure-only repeated overrun',languageAbilityInferenceAllowed:false}});assert.equal(f.validatePckAssetV1(asset).productionEligible,true);assert.equal(asset.examTiming.languageAbilityInferenceAllowed,false);assert.equal(f.validatePckAssetV1({...asset,examTiming:{...asset.examTiming,languageAbilityInferenceAllowed:true}}).accepted,false)});

test('F keeps competing production bottlenecks instead of turning one failure into one diagnosis',()=>{
  const options=f.deriveTeachingOptionsV1(allowRequest());
  assert.equal(options.targetRef,'allow-object-infinitive');assert.equal(options.facet,'CONSTRUCTION');
  assert.ok(options.bottleneckHypotheses.some(x=>x.kind==='FORM_ASSEMBLY'));
  assert.ok(options.bottleneckHypotheses.length>=2);
  assert.equal(options.feedbackBudget.maxConcurrentTargets,1);
});

test('L1 Collision is unavailable without grounded L1 evidence and becomes admissible when a competing hypothesis exists',()=>{
  const base=allowRequest({facet:'FORM_MEANING_MAPPING'});
  assert.ok(f.validateTeachingMechanismChoiceV1(base,'l1-collision').includes('L1_HYPOTHESIS_NOT_GROUNDED'));
  const grounded={...base,competingHypotheses:[{id:'candidate:l1-literal-map',label:'Repeated output may reflect an L1 literal mapping',status:'POSSIBLE',sourceEvidenceIds:['e1','e2']}]};
  assert.deepEqual(f.validateTeachingMechanismChoiceV1(grounded,'l1-collision'),[]);
});

test('a failed representation is not repeated unchanged when an admissible alternative exists',()=>{
  const request=allowRequest({recentTreatment:[{mechanismId:'grammar-role-map',support:'EXPLICIT',outcome:'FAILURE',responseSignal:'NO_PROGRESS'}]});
  const selected=f.selectPreferredTeachingBlockV1(request,'grammar-role-map');
  assert.ok(selected.block);assert.notEqual(selected.block.id,'grammar-role-map');
  assert.ok(selected.options.admissibleMechanisms.find(x=>x.mechanismId==='grammar-role-map').contraindications.includes('RECENT_NO_PROGRESS_WITH_SAME_MECHANISM'));
});

test('support NONE does not erase task-selection help: elicitation condition remains a separate axis',()=>{
  const named=f.defaultTeachingOpportunityConditionsV1({support:'NONE',elicitation:'TARGET_NAMED',context:'SAME_CONTEXT'});
  const open=f.defaultTeachingOpportunityConditionsV1({support:'NONE',elicitation:'OPEN_CHOICE',context:'SAME_CONTEXT'});
  assert.equal(named.assistance.language,'NONE');assert.equal(f.deploymentStageFromConditionsV1(named),'CONTROLLED_CONSTRUCTION');
  assert.equal(f.deploymentStageFromConditionsV1(open),'OPEN_CHOICE_RETRIEVAL');
  assert.equal(f.nextElicitationAfterSuccessV1('TARGET_NAMED'),'FUNCTION_CUED');
  assert.equal(f.nextElicitationAfterSuccessV1('FUNCTION_CUED'),'OPEN_CHOICE');
});

test('F to G contract asks for the output operation, not merely a named grammar item',()=>{
  const request=allowRequest({facet:'FREE_PRODUCTION',learnerState:'INDEPENDENT_LOCAL_CONTROL',conditions:f.defaultTeachingOpportunityConditionsV1({support:'NONE',elicitation:'OPEN_CHOICE',context:'CHANGED_CONTEXT',taskLoad:'MEDIUM'})});
  const need=f.taskGenerationNeedFromTeachingOptionsV1(f.deriveTeachingOptionsV1(request));
  assert.equal(need.targetRef,'allow-object-infinitive');assert.equal(need.validAlternatives,'ACCEPT');assert.equal(need.targetNameVisible,false);assert.equal(need.desiredContext,'CHANGED_CONTEXT');
});

test('production Teacher qualification now rejects an ungrounded PCK mechanism instead of trusting the provider',()=>{
  const ev=event({productionConditions:f.defaultTeachingOpportunityConditionsV1({support:'NONE',elicitation:'OPEN_CHOICE'})});
  const result=teacher.qualifyInnerTutorProposalV1(context([],ev),ev,proposal({focusFacet:'FORM_MEANING_MAPPING',selectedBlockId:'l1-collision'}));
  // D owns facet, so this is rejected before or together with F; use an aligned lesson below for the actual F guard.
  assert.equal(result.accepted,false);
  const alignedLesson={...lesson,facet:'FORM_MEANING_MAPPING'};
  const alignedTruth={...learnerTruth([]),capabilitySlice:[{...learnerTruth([]).capabilitySlice[0],facet:'FORM_MEANING_MAPPING'}]};
  const alignedContext=teacher.compilePedagogicalContextV1({lessonPlan:alignedLesson,productContext,learnerTruth:alignedTruth,event:ev,recentAttempts:[],recentTreatmentResponses:[],timeRemainingMinutes:20,provider:async()=>proposal()});
  const alignedProposal={...proposal({focusFacet:'FORM_MEANING_MAPPING',selectedBlockId:'l1-collision'}),lessonPlanId:alignedLesson.id};
  const fRejected=teacher.qualifyInnerTutorProposalV1(alignedContext,ev,alignedProposal);
  assert.equal(fRejected.accepted,false);assert.ok(fRejected.reasons.includes('F:L1_HYPOTHESIS_NOT_GROUNDED'));
});

test('production fallback consumes F suitability and changes representation after failure',async()=>{
  const current={objectiveId:lesson.id,focus:'CONSTRUCTION',pedagogicalIntent:'TEACH',selectedBlockId:'grammar-role-map',targetReference:'allow-object-infinitive',supportLevel:'EXPLICIT',contextProvenance:'SAME_CONTEXT',configuration:{decisionPointId:'prior',teacherAction:'TEACH'},reasonForSelection:'prior',evidenceToObserve:[],successTransition:'REDECIDE',failureTransition:'CHANGE_REPRESENTATION',requestedSystemAction:'NONE'};
  const ev=event();
  const result=await teacher.decideInnerTutorV1({lessonPlan:lesson,productContext,learnerTruth:learnerTruth([]),event:ev,recentAttempts:[],recentTreatmentResponses:[],timeRemainingMinutes:20,currentDecision:current,provider:async()=>{throw new Error('provider unavailable')}});
  assert.equal(result.action,'TEACH');assert.notEqual(result.blockDecision.selectedBlockId,'grammar-role-map');
  assert.equal(result.blockDecision.configuration.fPrimaryBottleneck!==undefined,true);
  assert.ok(result.provenance.reasonCodes.includes('F_PCK_SUITABILITY_SELECTED'));
});

test('contingent support fades after assisted success and only reaches fresh check from the lightest support',()=>{
  const explicit=f.deriveContingentSupportPolicyV1(allowRequest({current:{outcome:'SUCCESS',support:'EXPLICIT',eventKind:'LEARNER_RESPONSE'}}));
  assert.equal(explicit.transition,'FADE');assert.equal(explicit.recommendedSupport,'GUIDED');assert.equal(explicit.nextEvidenceCeiling,'ASSISTED');
  const light=f.deriveContingentSupportPolicyV1(allowRequest({current:{outcome:'SUCCESS',support:'LIGHT',eventKind:'LEARNER_RESPONSE'},conditions:f.defaultTeachingOpportunityConditionsV1({support:'LIGHT',elicitation:'FUNCTION_CUED'})}));
  assert.equal(light.transition,'FRESH_CHECK');assert.equal(light.recommendedSupport,'NONE');assert.equal(light.nextEvidenceCeiling,'FRESH_INDEPENDENT');assert.equal(light.nextElicitation,'OPEN_CHOICE');
});

test('failure increases support by one step while no progress on the current representation requires a representation reset',()=>{
  const first=f.deriveContingentSupportPolicyV1(allowRequest({current:{outcome:'FAILURE',support:'NONE',eventKind:'LEARNER_RESPONSE'},recentTreatment:[]}));
  assert.equal(first.transition,'INCREASE');assert.equal(first.recommendedSupport,'LIGHT');assert.equal(first.requiresRepresentationChange,false);
  const stalled=f.deriveContingentSupportPolicyV1(allowRequest({current:{outcome:'FAILURE',support:'EXPLICIT',eventKind:'LEARNER_RESPONSE'},recentTreatment:[{mechanismId:'grammar-role-map',support:'EXPLICIT',outcome:'FAILURE',responseSignal:'NO_PROGRESS'}]}));
  assert.equal(stalled.transition,'RESET_FOR_NEW_REPRESENTATION');assert.equal(stalled.requiresRepresentationChange,true);assert.notEqual(stalled.nextEvidenceCeiling,'FRESH_INDEPENDENT');
});

test('production fallback performs a contingent fade before fresh assessment',async()=>{
  const current={objectiveId:lesson.id,focus:'CONSTRUCTION',pedagogicalIntent:'PRACTICE',selectedBlockId:'sentence-builder',targetReference:'allow-object-infinitive',supportLevel:'EXPLICIT',contextProvenance:'SAME_CONTEXT',configuration:{decisionPointId:'prior-supported',teacherAction:'PRACTICE'},reasonForSelection:'prior',evidenceToObserve:[{targetRef:'allow-object-infinitive',facet:'CONSTRUCTION'}],successTransition:'REDECIDE',failureTransition:'CHANGE_REPRESENTATION',requestedSystemAction:'NONE'};
  const ev=event({id:'supported-success',outcome:'SUCCESS',support:'EXPLICIT'});
  const result=await teacher.decideInnerTutorV1({lessonPlan:lesson,productContext,learnerTruth:learnerTruth([]),event:ev,recentAttempts:[],recentTreatmentResponses:[],timeRemainingMinutes:20,currentDecision:current,provider:async()=>{throw new Error('provider unavailable')}});
  assert.equal(result.action,'PRACTICE');assert.equal(result.blockDecision.supportLevel,'GUIDED');assert.equal(result.blockDecision.configuration.fSupportTransition,'FADE');assert.ok(result.provenance.reasonCodes.includes('F_CONTINGENT_SUPPORT_FADE'));
});

test('production fallback moves from LIGHT assisted success to an answer-safe NONE fresh check',async()=>{
  const current={objectiveId:lesson.id,focus:'CONSTRUCTION',pedagogicalIntent:'PRACTICE',selectedBlockId:'sentence-builder',targetReference:'allow-object-infinitive',supportLevel:'LIGHT',contextProvenance:'SAME_CONTEXT',configuration:{decisionPointId:'prior-light',teacherAction:'PRACTICE'},reasonForSelection:'prior',evidenceToObserve:[{targetRef:'allow-object-infinitive',facet:'CONSTRUCTION'}],successTransition:'REDECIDE',failureTransition:'CHANGE_REPRESENTATION',requestedSystemAction:'NONE'};
  const ev=event({id:'light-success',outcome:'SUCCESS',support:'LIGHT',productionConditions:f.defaultTeachingOpportunityConditionsV1({support:'LIGHT',elicitation:'FUNCTION_CUED'})});
  const result=await teacher.decideInnerTutorV1({lessonPlan:lesson,productContext,learnerTruth:learnerTruth([]),event:ev,recentAttempts:[],recentTreatmentResponses:[],timeRemainingMinutes:20,currentDecision:current,provider:async()=>{throw new Error('provider unavailable')}});
  assert.equal(result.action,'CHECK');assert.equal(result.blockDecision.supportLevel,'NONE');assert.equal(result.blockDecision.configuration.fSupportTransition,'FRESH_CHECK');assert.equal(result.blockDecision.configuration.fNextElicitation,'OPEN_CHOICE');
});

test('provider cannot answer assisted success by strengthening support or reteaching',()=>{
  const ev=event({id:'provider-supported-success',outcome:'SUCCESS',support:'GUIDED'});
  const c=context([],ev);
  const reteach=teacher.qualifyInnerTutorProposalV1(c,ev,proposal({supportLevel:'EXPLICIT'}));
  assert.equal(reteach.accepted,false);assert.ok(reteach.reasons.includes('F:SUPPORTED_SUCCESS_MUST_FADE_NOT_RETEACH'));
  const strongerPractice=teacher.qualifyInnerTutorProposalV1(c,ev,proposal({teacherAction:'PRACTICE',pedagogicalIntent:'PRACTICE',selectedBlockId:'sentence-builder',supportLevel:'EXPLICIT',evidenceToObserve:[{facet:'CONSTRUCTION',productionCondition:'ASSISTED'}]}));
  assert.equal(strongerPractice.accepted,false);assert.ok(strongerPractice.reasons.includes('F:SUPPORTED_SUCCESS_CANNOT_INCREASE_SUPPORT'));
});

test('AI provider receives bounded F teaching context rather than only raw learner history',async()=>{
  let seen;
  const ev=event({id:'provider-f-context',outcome:'FAILURE',support:'NONE'});
  await teacher.decideInnerTutorV1({lessonPlan:lesson,productContext,learnerTruth:learnerTruth([]),event:ev,recentAttempts:[],recentTreatmentResponses:[],timeRemainingMinutes:20,provider:async compiled=>{seen=compiled.teaching;return proposal();}});
  assert.ok(seen);assert.ok(Array.isArray(seen.bottleneckHypotheses));assert.ok(Array.isArray(seen.preferredMechanismIds));assert.ok(seen.supportPolicy);assert.equal(seen.supportPolicy.recommendedSupport,'LIGHT');assert.equal(typeof seen.learnerAction,'string');assert.equal('generatedFromEvidenceIds' in seen,false);
});

test('high-load failure with prior local control keeps deployment-under-load as a supported hypothesis',()=>{
  const request={targetRef:'writing.sentence-realization',facet:'FREE_PRODUCTION',targetArea:'WRITING',targetKind:'WRITING_CAPABILITY',learnerState:'INDEPENDENT_LOCAL_CONTROL',supportDependence:'LOW',competingHypotheses:[],current:{outcome:'FAILURE',support:'NONE',eventKind:'LEARNER_RESPONSE'},conditions:f.defaultTeachingOpportunityConditionsV1({support:'NONE',elicitation:'AUTHENTIC_TASK',context:'SOURCE',taskLoad:'HIGH'}),recentTreatment:[]};
  const options=f.deriveTeachingOptionsV1(request),load=options.bottleneckHypotheses.find(x=>x.kind==='DEPLOYMENT_UNDER_LOAD');
  assert.ok(load);assert.equal(load.status,'SUPPORTED');assert.ok(load.reasonCodes.includes('FAILURE_UNDER_HIGH_LOAD_WITH_PRIOR_CONTROL'));const anatomy=options.admissibleMechanisms.find(x=>x.mechanismId==='sentence-anatomy');assert.equal(anatomy.admissible,true);assert.ok(anatomy.reasonCodes.includes('BOTTLENECK_DEPLOYMENT_UNDER_LOAD'));const worked=options.admissibleMechanisms.find(x=>x.mechanismId==='worked-transformation');assert.equal(worked.admissible,false);assert.ok(worked.contraindications.includes('WORKED_EXAMPLE_REDUNDANT_FOR_CURRENT_CONTROL'));
});

test('production evidence fails closed across multidimensional assistance even when block support is NONE',()=>{
  const blockRuntime=fromBuild('application/v4/blockRuntimeV4.js');
  const guards=fromBuild('application/evidence/evidenceGuardsV3.js');
  const block=f.blockRegistryV4.get('independent-sentence-production');
  assert.ok(block);
  const contaminated=f.defaultTeachingOpportunityConditionsV1({support:'NONE',elicitation:'TARGET_NAMED',context:'SAME_CONTEXT',language:'NONE',selection:'NONE',functionCue:'NONE',planning:'NONE',taskLoadAssistance:'NONE',recentModelPrime:'STRONG'});
  const state=blockRuntime.createBlockRuntimeV4('block-f','independent-sentence-production','NONE');
  const eventV4={id:'answer-f',instanceId:'block-f',type:'ANSWER_SUBMITTED',payload:{taskId:'task-f'},supportLevel:'NONE',visibleBeforeResponse:[],occurredAt:'2026-08-28T00:00:01Z',productionConditions:contaminated};
  const candidate=blockRuntime.blockEventToEvidenceCandidateV4(block,state,eventV4,true,{targetRef:'allow-object-infinitive',facet:'CONSTRUCTION'});
  assert.notEqual(candidate.productionMode,'INDEPENDENT');
  assert.equal(candidate.productionConditions.elicitation,'TARGET_NAMED');
  const malicious={...candidate,productionMode:'INDEPENDENT'};
  const task={id:'task-f',purpose:'LEARNING',taskFamily:'WRITING',targetRefs:['allow-object-infinitive'],contextNovelty:'SAME_CONTEXT',responseOpenness:'OPEN',supportExposed:['MODEL','EXPLICIT_RULE'],meaningProvenance:'LEARNER_ORIGINATED',eligibleClaims:[{targetRef:'allow-object-infinitive',facet:'CONSTRUCTION'}],forbiddenClaims:[],productionConditions:contaminated};
  const guarded=guards.guardEvidenceCandidateV3({candidate:malicious,task,learnerId:'f-learner',id:'e-f',occurredAt:'2026-08-28T00:00:02Z'});
  assert.equal(guarded.accepted,false);
  assert.ok(guarded.reasons.some(reason=>reason.includes('elicitation TARGET_NAMED')));
  assert.ok(guarded.reasons.some(reason=>reason.includes('recentModelPrime assistance is STRONG')));

  const unknownLoad={elicitation:'OPEN_CHOICE',context:'SOURCE',taskLoad:'UNKNOWN',assistance:{language:'NONE',selection:'NONE',functionCue:'NONE',planning:'NONE',taskLoad:'NONE',recentModelPrime:'NONE'}};
  const unknownEvent={...eventV4,id:'answer-f-unknown-load',productionConditions:unknownLoad};
  const unknownCandidate=blockRuntime.blockEventToEvidenceCandidateV4(block,state,unknownEvent,true,{targetRef:'allow-object-infinitive',facet:'CONSTRUCTION'});
  const unknownTask={...task,id:'task-f-unknown-load',supportExposed:['NONE'],productionConditions:unknownLoad};
  const unknownGuarded=guards.guardEvidenceCandidateV3({candidate:{...unknownCandidate,productionMode:'INDEPENDENT'},task:unknownTask,learnerId:'f-learner',id:'e-f-unknown-load',occurredAt:'2026-08-28T00:00:03Z'});
  assert.equal(unknownGuarded.accepted,false);
  assert.ok(unknownGuarded.reasons.some(reason=>reason.includes('task load is UNKNOWN')));
});

test('coach server consumes the versioned canonical block contract and rejects registry divergence',async()=>{
  const server=await import('../../coach-server/block-teacher-v4.mjs');
  const contract=f.blockRegistryV4.providerContract();
  assert.equal(server.BLOCKS,undefined);
  assert.equal(server.validateProviderBlockContractV4(contract).valid,true);
  const schema=server.decisionSchemaForBlockContractV4(contract);
  assert.deepEqual(new Set(schema.properties.selectedBlockId.enum),new Set(contract.blocks.map(block=>block.id)));
  const tampered={...contract,blocks:contract.blocks.map((block,index)=>index===0?{...block,role:block.role==='TEACH'?'PRACTICE':'TEACH'}:block)};
  const invalid=server.validateProviderBlockContractV4(tampered);
  assert.equal(invalid.valid,false);
  assert.ok(invalid.errors.includes('canonical_block_contract_fingerprint_mismatch'));
  const unknown={...contract,blocks:[...contract.blocks,{...contract.blocks[0],id:'server-only-fake-block'}]};
  assert.equal(server.validateProviderBlockContractV4(unknown).valid,false);

  const injectedBlocks=[...contract.blocks,{...contract.blocks[0],id:'server-only.injected'}];
  let hash=0x811c9dc5;for(const char of JSON.stringify(injectedBlocks)){hash^=char.charCodeAt(0);hash=Math.imul(hash,0x01000193)>>>0}
  const recomputed=`fnv1a32:${hash.toString(16).padStart(8,'0')}`;
  const selfConsistentButNoncanonical={...contract,blocks:injectedBlocks,fingerprint:recomputed};
  const pinned=server.validateProviderBlockContractV4(selfConsistentButNoncanonical);
  assert.equal(pinned.valid,false);
  assert.ok(pinned.errors.includes('canonical_block_contract_not_pinned'));
  assert.ok(pinned.errors.includes('canonical_block_contract_content_mismatch'));
});

test('generated offline block contract snapshot is an exact projection of the canonical production registry',()=>{
  const fs=require('node:fs');
  const generated=JSON.parse(fs.readFileSync(path.join(root,'shared/block-contract-v4.generated.json'),'utf8'));
  const canonical=f.blockRegistryV4.providerContract();
  assert.deepEqual(generated,canonical,'generated Stage3/offline contract must be regenerated whenever the canonical registry changes');
});

test('actual Output Workspace conditions survive the Stage4 production path and block recent-prime independence',()=>{
  const runtimeV4=fromBuild('application/stage4/learnerRuntimeV4.js');
  const workspaceRuntime=fromBuild('lesson-runtime/adaptiveOutputWorkspaceRuntime.js');
  const guards=fromBuild('application/evidence/evidenceGuardsV3.js');
  const artifact=runtimeV4.createOriginalArtifactV4({id:'artifact-daily-style',learnerId:'f-learner',source:'PASTE',mode:'WRITING',pages:[{page:1,mimeType:'text/plain',originalText:'Schools should allow to use phones.'}],submittedAt:'2026-08-28T00:00:00Z'});
  let state=runtimeV4.beginStage4RuntimeV4(artifact,[{id:'span-daily-style',artifactId:artifact.id,region:'LEARNER_WRITING',text:'Schools should allow to use phones.',confidence:'HIGH',alternatives:[]}],false);
  state=runtimeV4.selectBlockV4(state,{objectiveId:'f-lesson',focus:'CONSTRUCTION',pedagogicalIntent:'TEACH',selectedBlockId:'grammar-role-map',targetReference:'allow-object-infinitive',supportLevel:'EXPLICIT',contextProvenance:'SAME_CONTEXT',configuration:{decisionPointId:'prior-model'},reasonForSelection:'prior model exposure',evidenceToObserve:[],successTransition:'REDECIDE',failureTransition:'CHANGE_REPRESENTATION',requestedSystemAction:'NONE'},false);
  const priorConditions=workspaceRuntime.projectAdaptiveWorkspaceV4({runtime:state,draft:'Schools should allow to use phones.'}).productionConditions;
  assert.equal(priorConditions.assistance.recentModelPrime,'STRONG');
  state=runtimeV4.recordBlockEventStage4V4(state,'BLOCK_COMPLETED',{taskId:'prior-model-task'},true,priorConditions);
  state=runtimeV4.selectBlockV4(state,{objectiveId:'f-lesson',focus:'CONSTRUCTION',pedagogicalIntent:'ASSESS',selectedBlockId:'independent-sentence-production',targetReference:'allow-object-infinitive',supportLevel:'NONE',contextProvenance:'SAME_CONTEXT',configuration:{decisionPointId:'daily-style'},reasonForSelection:'audit regression',evidenceToObserve:[{targetRef:'allow-object-infinitive',facet:'CONSTRUCTION'}],successTransition:'REDECIDE',failureTransition:'CHANGE_REPRESENTATION',requestedSystemAction:'NONE'},false);
  const workspace=workspaceRuntime.projectAdaptiveWorkspaceV4({runtime:state,draft:'Schools should allow students to use phones.'});
  assert.equal(workspace.productionConditions.elicitation,'OPEN_CHOICE');
  assert.equal(workspace.productionConditions.assistance.language,'NONE');
  assert.equal(workspace.productionConditions.assistance.recentModelPrime,'LIGHT');
  state=runtimeV4.recordBlockEventStage4V4(state,'ANSWER_SUBMITTED',{taskId:'daily-style-task',response:'Schools should allow students to use phones.'},true,workspace.productionConditions);
  const candidate=state.evidenceCandidates.at(-1);
  assert.equal(candidate.productionConditions.assistance.recentModelPrime,'LIGHT');
  assert.notEqual(candidate.productionMode,'INDEPENDENT');
  const task={id:'daily-style-task',purpose:'LEARNING',taskFamily:'WRITING',targetRefs:['allow-object-infinitive'],contextNovelty:'SAME_CONTEXT',responseOpenness:'OPEN',supportExposed:['MODEL'],meaningProvenance:'LEARNER_ORIGINATED',eligibleClaims:[{targetRef:'allow-object-infinitive',facet:'CONSTRUCTION'}],forbiddenClaims:[],productionConditions:workspace.productionConditions};
  const forced=guards.guardEvidenceCandidateV3({candidate:{...candidate,productionMode:'INDEPENDENT'},task,learnerId:'f-learner',id:'daily-style-evidence',occurredAt:'2026-08-28T00:00:02Z'});
  assert.equal(forced.accepted,false);
  assert.ok(forced.reasons.some(reason=>reason.includes('recentModelPrime')));
});

test('F x U1 treatment chronology attaches the learner response to the prior delivered mechanism, not the newly selected mechanism',()=>{
  const chronology=fromBuild('persistence/treatmentChronology.js');
  const response={mechanismId:'grammar-role-map',support:'EXPLICIT',outcome:'FAILURE',eventId:'learner-response-after-old-move',occurredAt:'2026-08-28T00:01:00Z'};
  const plan=chronology.composeTreatmentPersistenceV1({
    episodeId:'episode-chronology',
    targetRef:'allow-object-infinitive',
    facet:'CONSTRUCTION',
    priorMove:{decisionPointId:'old-decision-point',mechanismId:'grammar-role-map',support:'EXPLICIT',deliveredAt:'2026-08-28T00:00:30Z'},
    currentMove:{decisionPointId:'new-decision-point',mechanismId:'sentence-anatomy',support:'GUIDED',deliveredAt:'2026-08-28T00:01:00Z'},
    response,
  });
  assert.equal(plan.responseAttribution.moveId,'move:old-decision-point');
  assert.equal(plan.responseAttribution.mechanismId,'grammar-role-map');
  assert.equal(plan.responseAttribution.response.eventId,response.eventId);
  assert.equal(plan.currentMove.moveId,'move:new-decision-point');
  assert.equal(plan.currentMove.mechanismId,'sentence-anatomy');
  assert.notEqual(plan.responseAttribution.moveId,plan.currentMove.moveId);
});
test('Founder harness has every required reusable scenario and preserves canonical composition authority',()=>{const required=['SAME_ERROR_LEVEL','DIFFERENT_CAUSE','RECOMPOSE','ASSISTED_FADE','POLYSEMY','COLLOCATION','WRITING_RETURN','TRANSLATION_RETURN','READING_CAUSE','CROSS_SESSION','DETERMINISTIC','MODEL_RECOMPOSE','DELAYED_RETENTION'],scenarios=evaluation.founderTeacherScenariosV1;assert.deepEqual(scenarios.map(value=>value.id),required);for(const scenario of scenarios){const plan=f.composeTeacherPlanV1({request:scenario.request,occurredAt:'2026-08-31',sessionId:scenario.id,mode:scenario.mode});assert.equal(f.validateTeacherCompositionV1(plan).valid,true);assert.equal(plan.targetRef,scenario.request.targetRef);assert.equal(plan.masteryMutationAllowed,false);assert.ok(['MODEL_REQUIRED','DETERMINISTIC_CONTINUATION','AVOIDED_MODEL_CALL'].includes(scenario.expectedRoute))}});

test('D target-specific H0-H5 assistance starts explicit for zero knowledge and bounded for fragile knowledge',()=>{const zero=f.deriveAdaptiveTeacherEpisodeDecisionV1(allowRequest({learnerState:'UNKNOWN',current:{outcome:'HELP_WITHOUT_ATTEMPT',support:'NONE',eventKind:'HELP_REQUESTED'}})),fragile=f.deriveAdaptiveTeacherEpisodeDecisionV1(allowRequest({learnerState:'OBSERVED_FRAGILE',current:{outcome:'PARTIAL',support:'NONE',eventKind:'LEARNER_RESPONSE'}}));assert.equal(zero.support,'EXPLICIT');assert.equal(zero.assistanceLevel,'H4_PARTIAL_COMPLETION_OR_CONTRAST');assert.equal(fragile.support,'LIGHT');assert.equal(fragile.assistanceLevel,'H1_ORIENTATION');assert.equal(zero.canWriteMastery,false);assert.equal(zero.canQualifyEvidence,false)});
test('D help raises assistance while learner-requested independence fades it without ability inference',()=>{const more=f.deriveAdaptiveTeacherEpisodeDecisionV1(allowRequest({current:{outcome:'HELP_WITHOUT_ATTEMPT',support:'LIGHT',eventKind:'HELP_REQUESTED'}})),independent=f.deriveAdaptiveTeacherEpisodeDecisionV1(allowRequest({current:{outcome:'NOT_EVALUATED',support:'EXPLICIT',eventKind:'SUPPORT_REDUCTION_REQUESTED'},learnerRequestedIndependentAttempt:true}));assert.equal(more.support,'CUED');assert.equal(more.action,'CONTINUE_CURRENT_PIECE');assert.equal(independent.support,'GUIDED');assert.equal(independent.action,'FADE_SUPPORT');assert.ok(independent.reasonCodes.includes('LEARNER_REQUESTED_INDEPENDENT_ATTEMPT'))});
test('D wheel-spin chooses material recompose then prerequisite or granularity escalation without a universal count',()=>{const one=f.deriveAdaptiveTeacherEpisodeDecisionV1(allowRequest({recentTreatment:[{mechanismId:'grammar-role-map',support:'GUIDED',outcome:'FAILURE',responseSignal:'NO_PROGRESS'}]})),repeated=f.deriveAdaptiveTeacherEpisodeDecisionV1(allowRequest({prerequisiteWeakness:true,recentTreatment:[{mechanismId:'grammar-role-map',support:'GUIDED',outcome:'FAILURE',responseSignal:'NO_PROGRESS'},{mechanismId:'grammar-role-map',support:'EXPLICIT',outcome:'FAILURE',responseSignal:'NO_PROGRESS'}]})),granular=f.deriveAdaptiveTeacherEpisodeDecisionV1(allowRequest({prerequisiteWeakness:false,recentTreatment:[{mechanismId:'grammar-role-map',support:'GUIDED',outcome:'FAILURE',responseSignal:'NO_PROGRESS'},{mechanismId:'grammar-role-map',support:'EXPLICIT',outcome:'FAILURE',responseSignal:'NO_PROGRESS'}]}));assert.equal(one.action,'RECOMPOSE_DIFFERENT_MECHANISM');assert.equal(repeated.action,'CHECK_PREREQUISITE');assert.equal(granular.action,'REDUCE_TARGET_GRANULARITY')});
test('D task-load attribution keeps harder-task failure separate from learner regression and changes one dimension',()=>{const d=f.deriveAdaptiveTeacherEpisodeDecisionV1(allowRequest({learnerState:'INDEPENDENT_LOCAL_CONTROL',current:{outcome:'FAILURE',support:'NONE',eventKind:'LEARNER_RESPONSE'},conditions:f.defaultTeachingOpportunityConditionsV1({support:'NONE',elicitation:'AUTHENTIC_TASK',context:'CHANGED_CONTEXT',taskLoad:'HIGH'})}));assert.equal(d.action,'REDUCE_TASK_LOAD');assert.equal(d.taskLoadAttribution,'TASK_LOAD_CONFOUND');assert.equal(d.changeOneMajorLoadDimension,true);assert.equal(d.loadDimensions.find(x=>x.dimension==='RESPONSE_GENERATION').level,'HIGH')});
test('D feedback timing and reliable performance reduce intervention while assisted success fades',()=>{const partial=f.deriveAdaptiveTeacherEpisodeDecisionV1(allowRequest({current:{outcome:'PARTIAL',support:'LIGHT',eventKind:'LEARNER_RESPONSE'}})),assisted=f.deriveAdaptiveTeacherEpisodeDecisionV1(allowRequest({current:{outcome:'SUCCESS',support:'GUIDED',eventKind:'LEARNER_RESPONSE'}})),reliable=f.deriveAdaptiveTeacherEpisodeDecisionV1(allowRequest({learnerState:'TRANSFER_SUPPORTED',current:{outcome:'SUCCESS',support:'NONE',eventKind:'LEARNER_RESPONSE'}}));assert.equal(partial.feedbackTiming,'IMMEDIATE_BOUNDED');assert.equal(assisted.action,'FADE_SUPPORT');assert.equal(assisted.support,'CUED');assert.equal(reliable.action,'STOP_NO_FURTHER_INTERVENTION');assert.equal(reliable.support,'NONE')});
test('D production Teacher executes try-independent through the existing decision and composition runtime',async()=>{const tryEvent=event({id:'try-independent',kind:'SUPPORT_REDUCTION_REQUESTED',outcome:'NOT_EVALUATED',support:'EXPLICIT',learnerIntent:'TRY_INDEPENDENT'}),result=await teacher.decideInnerTutorV1({lessonPlan:lesson,productContext,learnerTruth:learnerTruth(),event:tryEvent,recentAttempts:[],recentTreatmentResponses:[],timeRemainingMinutes:20,provider:async()=>{throw new Error('routine learner agency must stay deterministic')}});assert.equal(result.action,'PRACTICE');assert.equal(result.blockDecision.supportLevel,'GUIDED');assert.equal(result.blockDecision.configuration.dEpisodeAction,'FADE_SUPPORT');assert.equal(result.blockDecision.configuration.dAssistanceLevel,'H3_DIRECTED_HINT');assert.equal(result.provenance.provider,'DETERMINISTIC_FALLBACK');assert.equal(result.blockDecision.targetReference,lesson.targetRef)});

test('F personalization strengthens only repeated comparable local independent response',()=>{const request=allowRequest({contextFamily:'WRITING',recentTreatment:[{mechanismId:'grammar-role-map',targetRef:'allow-object-infinitive',facet:'CONSTRUCTION',contextFamily:'WRITING',support:'NONE',outcome:'SUCCESS',responseSignal:'INDEPENDENT_SUCCESS',learnerActionObserved:true},{mechanismId:'grammar-role-map',targetRef:'allow-object-infinitive',facet:'CONSTRUCTION',contextFamily:'WRITING',support:'NONE',outcome:'SUCCESS',responseSignal:'INDEPENDENT_SUCCESS',learnerActionObserved:true}]});const signal=f.deriveLocalTreatmentSignalV1(request,'grammar-role-map');assert.equal(signal.strength,'TR_STRONG_LOCAL_EFFECT_SIGNAL');assert.equal(signal.canWriteMastery,false);assert.equal(signal.canQualifyEvidence,false)});
test('F model-exposed success remains observed and cannot become strong effect',()=>{const request=allowRequest({recentTreatment:[{mechanismId:'grammar-role-map',targetRef:'allow-object-infinitive',facet:'CONSTRUCTION',support:'EXPLICIT',outcome:'SUCCESS',responseSignal:'ASSISTED_SUCCESS',confounds:['MORE_SUPPORT','ANSWER_OR_MODEL_EXPOSURE']},{mechanismId:'grammar-role-map',targetRef:'allow-object-infinitive',facet:'CONSTRUCTION',support:'MODELED',outcome:'SUCCESS',responseSignal:'ASSISTED_SUCCESS',confounds:['MORE_SUPPORT','ANSWER_OR_MODEL_EXPOSURE']}]});assert.equal(f.deriveLocalTreatmentSignalV1(request,'grammar-role-map').strength,'TR_OBSERVED_RESPONSE')});
test('F load-spike failure does not globally avoid a mechanism',()=>{const request=allowRequest({recentTreatment:[{mechanismId:'grammar-role-map',targetRef:'allow-object-infinitive',facet:'CONSTRUCTION',support:'NONE',outcome:'FAILURE',taskLoadAttribution:'TASK_LOAD_CONFOUND',confounds:['CHANGED_LOAD']},{mechanismId:'grammar-role-map',targetRef:'allow-object-infinitive',facet:'CONSTRUCTION',support:'NONE',outcome:'SUCCESS',responseSignal:'INDEPENDENT_SUCCESS',learnerActionObserved:true}]});assert.equal(f.deriveLocalTreatmentSignalV1(request,'grammar-role-map').avoidLocally,false)});
test('F exact identity prevents sense and reading-facet spillover',()=>{const history=[{mechanismId:'sentence-anatomy',targetRef:'sense-a',facet:'SENSE_DISCRIMINATION',contextFamily:'READING_INFERENCE',support:'NONE',outcome:'FAILURE'},{mechanismId:'sentence-anatomy',targetRef:'reading.inference',facet:'CONSTRUCTION',contextFamily:'READING_INFERENCE',support:'NONE',outcome:'FAILURE'}];const senseB=f.deriveLocalTreatmentSignalV1(allowRequest({targetRef:'allow-object-infinitive',recentTreatment:history}),'sentence-anatomy');assert.equal(senseB.comparableCount,0)});
test('F sparse and conflicting histories remain neutral',()=>{const sparse=f.deriveLocalTreatmentSignalV1(allowRequest({recentTreatment:[]}),'grammar-role-map'),conflict=f.deriveLocalTreatmentSignalV1(allowRequest({recentTreatment:[{mechanismId:'grammar-role-map',support:'NONE',outcome:'SUCCESS',responseSignal:'INDEPENDENT_SUCCESS',learnerActionObserved:true},{mechanismId:'grammar-role-map',support:'NONE',outcome:'FAILURE'}]}),'grammar-role-map');assert.equal(sparse.strength,'TR_OBSERVED_RESPONSE');assert.equal(conflict.strength,'TR_OBSERVED_RESPONSE');assert.equal(conflict.avoidLocally,false)});
test('F repeated comparable local failure changes production mechanism selection',async()=>{const current=teacher.qualifyInnerTutorProposalV1(teacher.compilePedagogicalContextV1({lessonPlan:lesson,productContext,learnerTruth:learnerTruth(),event:event(),recentAttempts:[],recentTreatmentResponses:[],timeRemainingMinutes:20,provider:async()=>proposal()}),event(),proposal()).decision.blockDecision;const failure={mechanismId:current.selectedBlockId,support:'NONE',outcome:'FAILURE',eventId:'prior-fail',occurredAt:'2026-09-01',targetRef:lesson.targetRef,facet:lesson.facet,contextFamily:'GENERAL'};const result=await teacher.decideInnerTutorV1({lessonPlan:lesson,productContext,learnerTruth:learnerTruth(),event:event({id:'next-fail',outcome:'FAILURE'}),recentAttempts:[],recentTreatmentResponses:[failure,{...failure,eventId:'prior-fail-2'}],timeRemainingMinutes:20,currentDecision:current,provider:async()=>{throw new Error('fallback')}});assert.notEqual(result.blockDecision.selectedBlockId,current.selectedBlockId);assert.equal(result.treatmentResponse.targetRef,lesson.targetRef);assert.equal(result.treatmentResponse.strength,'TR_OBSERVED_RESPONSE')});
