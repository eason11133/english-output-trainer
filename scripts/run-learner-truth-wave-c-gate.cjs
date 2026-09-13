const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build';
const fromBuild=rel=>require(path.join(root,build,rel));
const registry=fromBuild('architecture/registry.js');
const catalog=fromBuild('architecture/capabilityCatalog.js');
const upgrade=fromBuild('architecture/upgradePlan.js');
const status=fromBuild('learner-truth/waveCStatus.js');

const failures = [];
const exists = rel => fs.existsSync(path.join(root, rel));
const text = rel => fs.readFileSync(path.join(root, rel), 'utf8');

for (const rel of [
  'src/learner-truth/observation.ts',
  'src/learner-truth/observationLedger.ts',
  'src/learner-truth/evidenceSemantics.ts',
  'src/learner-truth/projection.ts',
  'src/learner-truth/waveCStatus.ts',
  'src/domain/evidence/CanonicalEvidenceLedgerV3.ts',
  'src/application/evidence/commitEvidenceCandidateV3.ts',
  'docs/architecture/waves/C_CANONICAL_LEARNER_TRUTH_WAVE.md',
]) if (!exists(rel)) failures.push(`missing Wave C asset: ${rel}`);

const c = registry.eotArchitectureRegistryV1.find(item => item.id === 'C');
if (!c || c.maturity_status !== 'PRODUCTION_CORE' || c.current_wave_status !== 'COMPLETE_FIRST_PASS') {
  failures.push('C registry status is not COMPLETE_FIRST_PASS / PRODUCTION_CORE');
}

const caps = catalog.capabilitiesForSubsystemV1('C');
if (caps.length !== 17) failures.push(`expected 17 Wave C capabilities, got ${caps.length}`);
for (const cap of caps) if (cap.implementation_status !== 'FIRST_PASS') failures.push(`Wave C capability not FIRST_PASS: ${cap.id}`);

const auditIds = new Set(status.learnerTruthWaveCCapabilityStatusV1.map(item => item.capabilityId));
for (const cap of caps) if (!auditIds.has(cap.id)) failures.push(`Wave C audit row missing: ${cap.id}`);
for (const row of status.learnerTruthWaveCCapabilityStatusV1) {
  if (row.afterPercent <= row.beforePercent && !row.auditAdjusted) failures.push(`Wave C capability did not advance without independent-audit calibration: ${row.capabilityId}`);
  if (![25,50,75,90,100].includes(row.afterPercent)) failures.push(`Wave C afterPercent is not evidence-gated: ${row.capabilityId}:${row.afterPercent}`);
}

const cWave = upgrade.recommendedMajorSubsystemUpgradeWavesV1.find(item => item.subsystem === 'C');
const dWave = upgrade.recommendedMajorSubsystemUpgradeWavesV1.find(item => item.subsystem === 'D');
if (cWave?.state !== 'COMPLETE_FIRST_PASS') failures.push('Wave C upgrade plan state incorrect');
if (!['READY_FOR_AUDIT','IN_PROGRESS','COMPLETE_FIRST_PASS'].includes(dWave?.state)) failures.push('Wave D has invalid later-wave state');

const guard = text('src/application/evidence/evidenceGuardsV3.ts');
for (const marker of ['negative evidence requires an observed target opportunity','low-confidence failure cannot become negative capability evidence','supported response cannot be independent']) {
  if (!guard.includes(marker)) failures.push(`evidence guard missing: ${marker}`);
}

if(!guard.includes('capability target must resolve to canonical English Domain identity'))failures.push('canonical target qualification guard missing');
const semantics=text('src/learner-truth/evidenceSemantics.ts');
if(!semantics.includes('canonical capability evidence requires a resolvable English Domain target'))failures.push('canonical event enrichment can retain unresolved target');

const commit = text('src/application/evidence/commitEvidenceCandidateV3.ts');
if (!commit.includes('enrichCanonicalEvidenceEventV1')) failures.push('commit does not enrich canonical event');
if (!commit.includes('appendIdempotent')) failures.push('commit does not use idempotent append');

const ledger = text('src/domain/evidence/CanonicalEvidenceLedgerV3.ts');
for (const marker of ['IDEMPOTENT_REPLAY','DEDUPLICATED','immutable conflict','duplicate observation']) {
  if (!ledger.includes(marker)) failures.push(`canonical ledger missing: ${marker}`);
}

const projector = text('src/application/learner/projectLearnerModelV3.ts');
if (!projector.includes('projectCanonicalLearnerTruthV1')) failures.push('legacy projector does not delegate to canonical C projection');

const stage4 = text('src/application/stage4/learnerRuntimeV4.ts');
for (const marker of ['SUPPORT_REQUEST','capabilityEvidenceAllowed:false','observationId:event.id','opportunityPresent:capabilityOpportunity']) {
  if (!stage4.includes(marker)) failures.push(`Stage4 observation/evidence split missing: ${marker}`);
}

const lesson = text('app/daily-lesson.tsx');
if (!lesson.includes('canonicalLearnerTruthV1.recordObservation')) failures.push('production lesson does not persist canonical observations through C authority');
if (!lesson.includes('canonicalLearnerTruthV1.commitCandidate')) failures.push('production lesson does not commit evidence through C authority');
if (lesson.includes('BOUND_TARGET')) failures.push('production lesson can still write unresolved BOUND_TARGET evidence');
if (!lesson.includes('canonicalTargetRef')) failures.push('production lesson does not resolve a canonical target before evidence commit');

const normalProduction = [
  'app/daily-lesson.tsx',
  'context/AppDataContext.tsx',
].map(rel => text(rel)).join('\n');
if (/EvidenceEvent\b/.test(normalProduction)) failures.push('normal production imports legacy EvidenceEvent V2 authority');

const result = {
  passed: failures.length === 0,
  auditedCapabilities: caps.length,
  evidenceGatedScale: '0/25/50/75/90/100',
  nextWave: dWave?.subsystem,
  failures,
};
console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;
