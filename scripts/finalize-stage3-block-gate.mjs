import { readFileSync, writeFileSync } from 'node:fs';
import { validateBlockDecisionV4 } from '../coach-server/block-teacher-v4.mjs';

const records = readFileSync(
  'artifacts/stage3-v4-block-qualification/telemetry.jsonl',
  'utf8',
)
  .split(/\r?\n/)
  .filter(Boolean)
  .map(JSON.parse);

const calls = new Map();
for (const record of records.filter(
  (candidate) => candidate.runId === 'stage3-block-v4-initial',
)) {
  const call = calls.get(record.qualificationCallId) ?? { events: [] };
  Object.assign(call, record);
  call.events.push(record.type);
  calls.set(record.qualificationCallId, call);
}

const completed = [...calls.values()].filter((call) =>
  call.events.includes('REQUEST_COMPLETED'),
);
const final9 = completed.filter((call) => call.caseId?.startsWith('final9-'));
const sourceRegression = completed.find(
  (call) => call.caseId === 'final10-return-original-source-provenance',
);
const sum = (items, key) =>
  items.reduce((total, item) => total + (item[key] || 0), 0);
const latencies = completed.map((call) => call.latencyMs).sort((a, b) => a - b);
const percentile = (value) =>
  latencies[Math.min(latencies.length - 1, Math.ceil(latencies.length * value) - 1)] || 0;
const validationFor = (call) => validateBlockDecisionV4(call.decision);
const sourceRegressionValidation = sourceRegression
  ? validationFor(sourceRegression)
  : { valid: false, errors: ['authorized_source_regression_missing'] };
const sourceRegressionCritic = sourceRegression
  ? records.find(
      (record) =>
        record.qualificationCallId === sourceRegression.qualificationCallId &&
        record.type === 'CRITIC_RESULT',
    )
  : undefined;
const sourceRegressionPassed =
  sourceRegressionValidation.valid &&
  sourceRegressionCritic?.criticResult?.passed === true &&
  sourceRegression.decision?.pedagogicalIntent === 'TRANSFER' &&
  sourceRegression.decision?.selectedBlockId === 'return-original-writing' &&
  sourceRegression.decision?.supportLevel === 'NONE' &&
  sourceRegression.decision?.evidenceToObserve?.every(
    (observation) => observation.productionCondition === 'FRESH_INDEPENDENT',
  );

// The single authorized regression is the corrected evidence for the one affected
// final-9 case. Other final-9 validation failures remain unresolved.
const unresolved = final9
  .map((call) => ({ caseId: call.caseId, validation: validationFor(call) }))
  .filter(
    (result) =>
      !result.validation.valid &&
      !(
        result.caseId === 'final9-grammar-return-transfer' &&
        sourceRegressionPassed
      ),
  );
if (!sourceRegressionPassed) {
  unresolved.push({
    caseId: 'final10-return-original-source-provenance',
    validation: sourceRegressionValidation,
    criticPassed: sourceRegressionCritic?.criticResult?.passed === true,
  });
}

const missingTelemetry = completed.filter(
  (call) =>
    !call.events.includes('USAGE_RECORDED') ||
    !call.events.includes('VALIDATION_RESULT') ||
    !call.events.includes('CRITIC_RESULT'),
);
const duplicateCompletedCaseIds =
  completed.length - new Set(completed.map((call) => call.caseId)).size;
const passed =
  unresolved.length === 0 &&
  missingTelemetry.length === 0 &&
  duplicateCompletedCaseIds === 0;

const report = {
  verdict: passed ? 'PASS' : 'FAIL',
  finalAuthorizedRegression: {
    caseId: sourceRegression?.caseId ?? null,
    qualificationCallId: sourceRegression?.qualificationCallId ?? null,
    passed: sourceRegressionPassed,
    validation: sourceRegressionValidation,
    criticPassed: sourceRegressionCritic?.criticResult?.passed === true,
    decision: sourceRegression?.decision ?? null,
  },
  final9Calls: final9.length,
  cumulativeCalls: completed.length,
  cumulativeCostUsd: sum(completed, 'estimatedCostUsd'),
  cumulativeInputTokens: sum(completed, 'inputTokens'),
  cumulativeCachedInputTokens: sum(completed, 'cachedInputTokens'),
  cumulativeOutputTokens: sum(completed, 'outputTokens'),
  cumulativeReasoningTokens: sum(completed, 'reasoningTokens'),
  averageOutputTokens: sum(completed, 'outputTokens') / completed.length,
  p50LatencyMs: percentile(0.5),
  p95LatencyMs: percentile(0.95),
  telemetryMissing: missingTelemetry.map((call) => call.caseId),
  duplicateCompletedCaseIds,
  unresolvedHardViolations: unresolved,
  nextAuthorization: null,
  stage1: 'PASS',
  stage2: 'PASS',
  stage3: passed ? 'PASS' : 'FAIL',
};

writeFileSync(
  'artifacts/stage3-v4-block-qualification/FINAL_GATE.json',
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
if (!passed) process.exitCode = 1;
