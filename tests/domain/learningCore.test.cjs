const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyEvidence } = require('../../.domain-test-build/domain/evidence/rules.js');
const { projectLearnerState } = require('../../.domain-test-build/domain/learner/projection.js');

const baseTime = Date.parse('2026-01-01T00:00:00.000Z');
function event(id, offsetHours, overrides = {}) {
  return {
    schemaVersion: 2, id, learnerId: 'learner-1', sessionId: 'session-1', missionUnitId: 'unit-1', knowledgePointId: 'kp-many-plural-noun',
    activityFamily: 'CONTROLLED_PRODUCTION', result: 'SUCCESS', evaluationScope: 'TARGET_ONLY', responseText: 'Many students practice.', acceptedTarget: 'many students', assistance: 'NONE', attemptNumber: 1, selfRepairSucceeded: false, answerRevealed: false, contextId: `context-${id}`, contextNovelty: 'SAME', source: 'SYSTEM', confidence: 'HIGH', occurredAt: new Date(baseTime + offsetHours * 3_600_000).toISOString(), ...overrides,
  };
}

test('hint success is assisted and never independent proof', () => {
  const proof = classifyEvidence(event('hint', 0, { assistance: 'RULE_CUE', metadata: { hintsUsed: 1 } }));
  assert.equal(proof.assistedProductionProof, true); assert.equal(proof.independentProductionProof, false);
});

test('FULL_REVEAL success never creates independent or assisted proof', () => {
  const proof = classifyEvidence(event('reveal', 0, { assistance: 'FULL_REVEAL', answerRevealed: true }));
  assert.equal(proof.independentProductionProof, false); assert.equal(proof.assistedProductionProof, false);
});

test('high-confidence unassisted production promotes assisted use to independent use', () => {
  const state = projectLearnerState([event('assisted', 0, { assistance: 'STRUCTURE_CUE' }), event('independent', 1)]);
  assert.equal(state.stage, 'INDEPENDENT_USE'); assert.equal(state.assistedProductionProofs, 1); assert.equal(state.independentProductionProofs, 1);
});

test('new-context high-confidence unassisted success promotes independent use to transfer', () => {
  const state = projectLearnerState([event('independent', 0), event('transfer', 1, { activityFamily: 'TRANSFER', contextNovelty: 'NEW' })]);
  assert.equal(state.stage, 'TRANSFER'); assert.equal(state.transferProofs, 1);
});

test('delayed independent verification promotes transfer to stable', () => {
  const state = projectLearnerState([event('transfer', 0, { activityFamily: 'TRANSFER', contextNovelty: 'NEW' }), event('delayed', 25)]);
  assert.equal(state.stage, 'STABLE'); assert.equal(state.delayedProofs, 1);
});

test('one isolated failure preserves historic advanced evidence and does not trigger fragility', () => {
  const history = [event('transfer', 0, { activityFamily: 'TRANSFER', contextNovelty: 'NEW' }), event('miss', 1, { result: 'FAILURE' })];
  const state = projectLearnerState(history);
  assert.equal(state.stage, 'TRANSFER'); assert.equal(state.transferProofs, 1); assert.equal(history.length, 2);
});

test('repeated reliable recent failures make an advanced state fragile without deleting proof counts', () => {
  const state = projectLearnerState([event('transfer', 0, { activityFamily: 'TRANSFER', contextNovelty: 'NEW' }), event('miss-1', 1, { result: 'FAILURE' }), event('miss-2', 2, { result: 'FAILURE' })]);
  assert.equal(state.stage, 'FRAGILE'); assert.equal(state.transferProofs, 1); assert.deepEqual(state.reasonEvidenceIds, ['transfer', 'miss-1', 'miss-2']);
});

test('LOW-confidence success cannot promote a verified state', () => {
  const state = projectLearnerState([event('low', 0, { confidence: 'LOW' })]);
  assert.equal(state.stage, 'NEW'); assert.equal(state.independentProductionProofs, 0);
});

test('TARGET_ONLY success confirms only its requested target, not the full response', () => {
  const proof = classifyEvidence(event('target', 0, { evaluationScope: 'TARGET_ONLY' }));
  assert.equal(proof.confirmsTarget, true); assert.equal(proof.confirmsFullResponse, false);
});

test('self-repair remains represented when the final result is SUCCESS', () => {
  const proof = classifyEvidence(event('repair', 0, { selfRepairSucceeded: true, activityFamily: 'CORRECTION', assistance: 'RULE_CUE' }));
  assert.equal(proof.selfRepairSucceeded, true); assert.equal(proof.assistedProductionProof, true);
});

test('projection is deterministic for identical evidence', () => {
  const history = [event('recognized', 0, { activityFamily: 'RECOGNITION' }), event('independent', 1)];
  assert.deepEqual(projectLearnerState(history), projectLearnerState(history));
});

test('input ordering does not affect canonical projected state', () => {
  const history = [event('recognized', 0, { activityFamily: 'RECOGNITION' }), event('assisted', 1, { assistance: 'SEMANTIC_CUE' }), event('independent', 2)];
  assert.deepEqual(projectLearnerState(history), projectLearnerState([history[2], history[0], history[1]]));
});
