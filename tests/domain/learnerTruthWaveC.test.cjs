const test = require('node:test');
const assert = require('node:assert/strict');

const path = require('node:path');
const build = process.env.EOT_DOMAIN_TEST_BUILD || '.domain-test-build';
const fromBuild = rel => require(path.join(__dirname, '..', '..', build, rel));
const truth = fromBuild('learner-truth/index.js');
const guards = fromBuild('application/evidence/evidenceGuardsV3.js');
const runtime = fromBuild('application/stage4/learnerRuntimeV4.js');
const architecture = fromBuild('architecture/upgradePlan.js');

const now = '2026-08-26T01:00:00.000Z';

function independentConditions(context='SOURCE') {
  return {
    elicitation:'OPEN_CHOICE', context, taskLoad:'MEDIUM',
    assistance:{language:'NONE',selection:'NONE',functionCue:'NONE',planning:'NONE',taskLoad:'NONE',recentModelPrime:'NONE'},
  };
}

function task(targetRef='allow O to V', facet='CONTROLLED_PRODUCTION', contextNovelty='SOURCE') {
  return {
    id: 'task-1',
    purpose: 'PRACTICE',
    taskFamily: 'WRITING',
    targetRefs: [targetRef],
    contextNovelty,
    responseOpenness: 'OPEN',
    supportExposed: ['NONE'],
    meaningProvenance: 'LEARNER_ORIGINATED',
    eligibleClaims: [{ targetRef, facet }],
    forbiddenClaims: [],
    productionConditions: independentConditions(contextNovelty),
  };
}

function candidate(overrides={}) {
  const contextNovelty=overrides.contextNovelty ?? 'SOURCE';
  return {
    candidateKind: 'CAPABILITY',
    observation: 'learner produced allow construction',
    capabilityDomain: 'ENGLISH',
    capabilityFacet: 'CONTROLLED_PRODUCTION',
    evidenceEligibility: 'ELIGIBLE',
    evidencePolarity: 'POSITIVE',
    evidenceScope: 'LOCAL',
    productionMode: 'INDEPENDENT',
    supportBeforeResponse: 'NONE',
    semanticProvenance: 'LEARNER_ORIGINATED',
    contextNovelty: 'SOURCE',
    confidence: 'HIGH',
    competingExplanations: [],
    taskAffordanceChecked: true,
    targetRef: 'allow O to V',
    taskId: 'task-1',
    artifactId: 'artifact-1',
    episodeId: 'episode-1',
    observationId: 'observation-1',
    opportunityPresent: true,
    productionConditions: independentConditions(contextNovelty),
    ...overrides,
  };
}

test('OriginalArtifact stays immutable while source confirmation becomes a separate non-evidence observation', () => {
  const artifact = runtime.createOriginalArtifactV4({
    id: 'artifact-1',
    learnerId: 'learner-1',
    source: 'CAMERA',
    mode: 'WRITING',
    pages: [{ page: 1, mimeType: 'image/jpeg', originalText: 'Schools allow to use phones.' }],
    submittedAt: now,
  });
  const started = runtime.beginStage4RuntimeV4(artifact, [{
    id: 'span-1',
    artifactId: artifact.id,
    region: 'LEARNER_WRITING',
    text: 'Schools allow to use phones.',
    confidence: 'LOW',
    alternatives: ['Schools allow students to use phones.'],
  }], false);
  const confirmed = runtime.confirmSourceSpanV4(started, 'span-1', 'Schools allow to use phones.');
  assert.equal(confirmed.artifact.pages[0].originalText, 'Schools allow to use phones.');
  const observation = confirmed.observations.at(-1);
  assert.equal(observation.kind, 'SOURCE_CONFIRMATION');
  assert.equal(observation.capabilityEvidenceAllowed, false);
  assert.equal(observation.immutable, true);
});

test('help is recorded as an observation but does not become capability evidence', () => {
  const artifact = runtime.createOriginalArtifactV4({
    id: 'artifact-help',
    learnerId: 'learner-1',
    source: 'PASTE',
    mode: 'WRITING',
    pages: [{ page: 1, mimeType: 'text/plain', originalText: 'Schools should allow to use phones.' }],
    submittedAt: now,
  });
  let state = runtime.beginStage4RuntimeV4(artifact, [{
    id: 'span-help', artifactId: artifact.id, region: 'LEARNER_WRITING', text: 'Schools should allow to use phones.', confidence: 'HIGH', alternatives: [],
  }], false);
  state = runtime.selectBlockV4(state, {
    objectiveId:'o',focus:'allow',pedagogicalIntent:'TEACH',selectedBlockId:'grammar-role-map',targetReference:'allow-object-infinitive',
    supportLevel:'GUIDED',contextProvenance:'SAME_CONTEXT',configuration:{},reasonForSelection:'test',
    evidenceToObserve:[],
    successTransition:'continue',failureTransition:'change',requestedSystemAction:'NONE',
  }, false);
  state = runtime.recordBlockEventStage4V4(state, 'HINT_REQUESTED', { learnerRequestedHelp:true }, false);
  assert.equal(state.observations.at(-1).kind, 'SUPPORT_REQUEST');
  assert.equal(state.observations.at(-1).capabilityEvidenceAllowed, false);
  assert.equal(state.evidenceCandidates.at(-1).candidateKind, 'NO_CAPABILITY_EVIDENCE');
});

test('canonical commit enriches target identity, provenance, uncertainty and condition reliability', async () => {
  const ledger = new truth.InMemoryCanonicalEvidenceLedgerV3();
  const result = await truth.commitEvidenceCandidateV3({
    candidate: candidate(),
    task: task(),
    learnerId: 'learner-1',
    id: 'evidence-1',
    occurredAt: now,
    ledger,
  });
  assert.equal(result.accepted, true);
  assert.equal(result.event.canonicalTargetRef, 'allow-object-infinitive');
  assert.equal(result.event.targetRef, 'allow-object-infinitive');
  assert.equal(result.event.provenance.observationId, 'observation-1');
  assert.equal(result.event.provenance.rawTargetRef, 'allow O to V');
  assert.equal(result.event.conditionReliability, 'HIGH');
  assert.equal(result.event.uncertainty.unresolved, false);
  assert.ok(result.event.dedupKey.includes('observation-1'));
});

test('same event retry is idempotent and same observation under another id is deduplicated', async () => {
  const ledger = new truth.InMemoryCanonicalEvidenceLedgerV3();
  const input = { candidate: candidate(), task: task(), learnerId:'learner-1', occurredAt:now, ledger };
  const first = await truth.commitEvidenceCandidateV3({ ...input, id:'evidence-1' });
  const retry = await truth.commitEvidenceCandidateV3({ ...input, id:'evidence-1' });
  const duplicate = await truth.commitEvidenceCandidateV3({ ...input, id:'evidence-2' });
  assert.equal(first.accepted, true);
  assert.equal(retry.writeStatus, 'IDEMPOTENT_REPLAY');
  assert.equal(duplicate.writeStatus, 'DEDUPLICATED');
  assert.equal(duplicate.event.id, 'evidence-1');
  assert.equal((await ledger.listForLearner('learner-1')).length, 1);
});

test('conflicting reuse of the same canonical event id is rejected', async () => {
  const ledger = new truth.InMemoryCanonicalEvidenceLedgerV3();
  const input = { task: task(), learnerId:'learner-1', id:'evidence-1', occurredAt:now, ledger };
  await truth.commitEvidenceCandidateV3({ ...input, candidate:candidate() });
  await assert.rejects(
    () => truth.commitEvidenceCandidateV3({ ...input, candidate:candidate({ observation:'different learner action', observationId:'observation-2' }) }),
    /immutable conflict/,
  );
});

test('negative evidence requires a real opportunity and sufficient source confidence', () => {
  const noOpportunity = guards.guardEvidenceCandidateV3({
    candidate: candidate({ evidencePolarity:'NEGATIVE', opportunityPresent:false }),
    task: task(),
    learnerId:'learner-1', id:'n1', occurredAt:now,
  });
  assert.equal(noOpportunity.accepted, false);
  assert.ok(noOpportunity.reasons.some(reason => /opportunity/.test(reason)));

  const lowConfidence = guards.guardEvidenceCandidateV3({
    candidate: candidate({ evidencePolarity:'NEGATIVE', opportunityPresent:true, confidence:'LOW' }),
    task: task(),
    learnerId:'learner-1', id:'n2', occurredAt:now,
  });
  assert.equal(lowConfidence.accepted, false);
  assert.ok(lowConfidence.reasons.some(reason => /low-confidence/.test(reason)));
});

test('UNKNOWN stays honest: it is preserved in history but does not become ability proof', async () => {
  const ledger = new truth.InMemoryCanonicalEvidenceLedgerV3();
  const result = await truth.commitEvidenceCandidateV3({
    candidate:candidate({ evidencePolarity:'UNKNOWN', observationId:'unknown-observation' }),
    task:task(), learnerId:'learner-1', id:'unknown-evidence', occurredAt:now, ledger,
  });
  assert.equal(result.accepted, true);
  const model = truth.projectCanonicalLearnerTruthV1('learner-1', await ledger.listForLearner('learner-1'));
  assert.equal(model.capabilitySlice[0].state, 'UNKNOWN');
  assert.equal(model.capabilitySlice[0].uncertainty.level, 'MEDIUM');
});

test('assisted success stays separate from independent, transfer and delayed proof', async () => {
  const events = [
    truth.enrichCanonicalEvidenceEventV1({
      ...candidate({ productionMode:'GUIDED', supportBeforeResponse:'MEDIUM', observationId:'o1' }),
      id:'e1', schemaVersion:3, learnerId:'learner-1', occurredAt:'2026-08-26T01:00:00.000Z', immutable:true,
    }),
    truth.enrichCanonicalEvidenceEventV1({
      ...candidate({ capabilityFacet:'CONTROLLED_PRODUCTION', productionMode:'INDEPENDENT', supportBeforeResponse:'NONE', contextNovelty:'SOURCE', observationId:'o2' }),
      id:'e2', schemaVersion:3, learnerId:'learner-1', occurredAt:'2026-08-26T02:00:00.000Z', immutable:true,
    }),
    truth.enrichCanonicalEvidenceEventV1({
      ...candidate({ productionMode:'INDEPENDENT', supportBeforeResponse:'NONE', contextNovelty:'CHANGED_CONTEXT', observationId:'o3' }),
      id:'e3', schemaVersion:3, learnerId:'learner-1', occurredAt:'2026-08-26T03:00:00.000Z', immutable:true,
    }),
    truth.enrichCanonicalEvidenceEventV1({
      ...candidate({ productionMode:'INDEPENDENT', supportBeforeResponse:'NONE', contextNovelty:'DELAYED_CONTEXT', observationId:'o4' }),
      id:'e4', schemaVersion:3, learnerId:'learner-1', occurredAt:'2026-08-27T03:00:00.000Z', immutable:true,
    }),
  ];
  const model = truth.projectCanonicalLearnerTruthV1('learner-1', events);
  const cap = model.capabilitySlice[0];
  assert.equal(cap.state, 'RETENTION_SUPPORTED');
  assert.equal(cap.sourceControl, true);
  assert.equal(cap.transferSupport, true);
  assert.equal(cap.retentionSupport, true);
  assert.equal(cap.supportDependence, 'LOW');
});

test('conflicting evidence raises uncertainty and preserves competing hypotheses instead of forcing one diagnosis', () => {
  const events = [
    truth.enrichCanonicalEvidenceEventV1({
      ...candidate({ observationId:'p1', evidencePolarity:'POSITIVE' }),
      id:'p1', schemaVersion:3, learnerId:'learner-1', occurredAt:'2026-08-26T01:00:00.000Z', immutable:true,
    }),
    truth.enrichCanonicalEvidenceEventV1({
      ...candidate({ observationId:'n1', evidencePolarity:'NEGATIVE', competingExplanations:['TASK_LOAD'] }),
      id:'n1', schemaVersion:3, learnerId:'learner-1', occurredAt:'2026-08-26T02:00:00.000Z', immutable:true,
    }),
  ];
  const cap = truth.projectCanonicalLearnerTruthV1('learner-1', events).capabilitySlice[0];
  assert.equal(cap.uncertainty.level, 'HIGH');
  assert.ok(cap.hypotheses.some(item => item.id === 'condition-dependent-fragility'));
  assert.ok(cap.hypotheses.some(item => /TASK_LOAD/.test(item.label)));
});

test('two recent reliable failures can mark an advanced capability fragile without deleting prior proof', () => {
  const make = (id, at, polarity, context='SOURCE') => truth.enrichCanonicalEvidenceEventV1({
    ...candidate({ observationId:id, evidencePolarity:polarity, contextNovelty:context, opportunityPresent:true }),
    id, schemaVersion:3, learnerId:'learner-1', occurredAt:at, immutable:true,
  });
  const events = [
    make('source','2026-08-20T01:00:00.000Z','POSITIVE','SOURCE'),
    make('transfer','2026-08-21T01:00:00.000Z','POSITIVE','CHANGED_CONTEXT'),
    make('retention','2026-08-22T01:00:00.000Z','POSITIVE','DELAYED_CONTEXT'),
    make('miss1','2026-08-25T01:00:00.000Z','NEGATIVE','SOURCE'),
    make('miss2','2026-08-26T01:00:00.000Z','NEGATIVE','SOURCE'),
  ];
  const cap = truth.projectCanonicalLearnerTruthV1('learner-1', events).capabilitySlice[0];
  assert.equal(cap.state, 'OBSERVED_FRAGILE');
  assert.equal(cap.transferSupport, true);
  assert.equal(cap.retentionSupport, true);
  assert.ok(cap.sourceEvidenceIds.includes('retention'));
});

test('Wave C remains complete when later waves advance beyond READY_FOR_AUDIT', () => {
  assert.equal(truth.learnerTruthWaveCCapabilityStatusV1.length, 17);
  assert.ok(truth.learnerTruthWaveCCapabilityStatusV1.every(item => item.afterPercent > item.beforePercent || item.auditAdjusted === true));
  assert.equal(architecture.recommendedMajorSubsystemUpgradeWavesV1.find(item => item.subsystem === 'C').state, 'COMPLETE_FIRST_PASS');
  assert.ok(['READY_FOR_AUDIT','IN_PROGRESS','COMPLETE_FIRST_PASS'].includes(architecture.recommendedMajorSubsystemUpgradeWavesV1.find(item => item.subsystem === 'D').state));
});


test('canonical evidence rejects unresolved targets and stores resolved target identity', async () => {
  const ledger = new truth.InMemoryCanonicalEvidenceLedgerV3();
  const base = {
    candidateKind:'CAPABILITY', observation:'allow', capabilityDomain:'GRAMMAR', capabilityFacet:'CONTROLLED_PRODUCTION',
    evidenceEligibility:'ELIGIBLE', evidencePolarity:'POSITIVE', evidenceScope:'LOCAL', productionMode:'INDEPENDENT',
    supportBeforeResponse:'NONE', semanticProvenance:'LEARNER_ORIGINATED', contextNovelty:'SOURCE', confidence:'HIGH',
    competingExplanations:[], taskAffordanceChecked:true, opportunityPresent:true, taskId:'task-canonical', productionConditions:independentConditions('SOURCE')
  };
  const badTask={id:'task-bad',purpose:'SOURCE_WORK',taskFamily:'WRITING',targetRefs:['BOUND_TARGET'],contextNovelty:'SOURCE',responseOpenness:'OPEN',supportExposed:['NONE'],meaningProvenance:'LEARNER_ORIGINATED',eligibleClaims:[{targetRef:'BOUND_TARGET',facet:'CONTROLLED_PRODUCTION'}],forbiddenClaims:[],productionConditions:independentConditions('SOURCE')};
  const bad=await truth.commitEvidenceCandidateV3({candidate:{...base,targetRef:'BOUND_TARGET'},task:badTask,learnerId:'l',id:'bad-target',occurredAt:now,ledger});
  assert.equal(bad.accepted,false);
  assert.ok(bad.reasons.some(reason=>reason.includes('canonical English Domain identity')));

  const aliasTask={id:'task-canonical',purpose:'SOURCE_WORK',taskFamily:'WRITING',targetRefs:['allow O to V'],contextNovelty:'SOURCE',responseOpenness:'OPEN',supportExposed:['NONE'],meaningProvenance:'LEARNER_ORIGINATED',eligibleClaims:[{targetRef:'allow O to V',facet:'CONTROLLED_PRODUCTION'}],forbiddenClaims:[],productionConditions:independentConditions('SOURCE')};
  const good=await truth.commitEvidenceCandidateV3({candidate:{...base,targetRef:'allow O to V'},task:aliasTask,learnerId:'l',id:'canonical-target',occurredAt:now,ledger});
  assert.equal(good.accepted,true);
  assert.equal(good.event.targetRef,'allow-object-infinitive');
  assert.equal(good.event.canonicalTargetRef,'allow-object-infinitive');
});
