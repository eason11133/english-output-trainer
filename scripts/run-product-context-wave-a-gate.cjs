const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build';
const fromBuild=rel=>require(path.join(root,build,rel));
const registry=fromBuild('architecture/registry.js');
const catalog=fromBuild('architecture/capabilityCatalog.js');
const upgrade=fromBuild('architecture/upgradePlan.js');
const status=fromBuild('product/waveAStatus.js');
const failures=[];
const exists=rel=>fs.existsSync(path.join(root,rel));
const text=rel=>fs.readFileSync(path.join(root,rel),'utf8');

for(const rel of [
  'src/product/types.ts','src/product/model.ts','src/product/access.ts','src/product/projection.ts','src/product/migration.ts','src/product/waveAStatus.ts',
  'src/persistence/productContextStore.ts','context/AppDataContext.tsx',
  'app/onboarding/goals.tsx','app/onboarding/time.tsx','app/onboarding/exam.tsx','components/experience/ProfileSettingsScreen.tsx',
  'docs/architecture/waves/A_PRODUCT_IDENTITY_COMMERCIAL_CONTEXT_WAVE.md',
])if(!exists(rel))failures.push(`missing Wave A asset: ${rel}`);

const a=registry.eotArchitectureRegistryV1.find(item=>item.id==='A');
if(!a||a.maturity_status!=='PRODUCTION_CORE'||a.current_wave_status!=='COMPLETE_FIRST_PASS')failures.push('A registry status is not COMPLETE_FIRST_PASS / PRODUCTION_CORE');
const caps=catalog.capabilitiesForSubsystemV1('A');
if(caps.length<22)failures.push(`expected at least 22 audited Wave A capabilities, got ${caps.length}`);
for(const cap of caps){const expected=['A.product-plan','A.trial-access','A.subscription-boundary'].includes(cap.id)?'CONTRACT_ONLY':'FIRST_PASS';if(cap.implementation_status!==expected)failures.push(`Wave A capability status mismatch ${cap.id}: expected ${expected}, got ${cap.implementation_status}`)}
const auditIds=new Set(status.productWaveACapabilityStatusV1.map(item=>item.capabilityId));
for(const cap of caps)if(!auditIds.has(cap.id))failures.push(`Wave A audit row missing: ${cap.id}`);
for(const row of status.productWaveACapabilityStatusV1)if(row.afterPercent<=row.beforePercent)failures.push(`Wave A capability did not advance: ${row.capabilityId}`);
const aWave=upgrade.recommendedMajorSubsystemUpgradeWavesV1.find(item=>item.subsystem==='A');
const bWave=upgrade.recommendedMajorSubsystemUpgradeWavesV1.find(item=>item.subsystem==='B');
if(aWave?.state!=='COMPLETE_FIRST_PASS')failures.push('Wave A upgrade plan state incorrect');
if(!['READY_FOR_AUDIT','IN_PROGRESS','COMPLETE_FIRST_PASS'].includes(bWave?.state))failures.push('Wave B has invalid later-wave state');

const store=text('src/persistence/productContextStore.ts');
if(!store.includes('eot.product-context.v2'))failures.push('versioned product-context storage key missing');
if(!store.includes('seed.demoMode'))failures.push('safe local-only legacy migration guard missing');
if(/saveProductContextV1\s*\(/.test(store))failures.push('legacy product context remains independently writable');

const provider=text('context/AppDataContext.tsx');
for(const marker of ['ProductProfileV2','projectRuntimeProductContextV2','loadProductProfileV2','selectProductExperience'])if(!provider.includes(marker))failures.push(`canonical product provider integration missing ${marker}`);
if(provider.includes('initialProductContextV1'))failures.push('AppDataContext still treats V1 snapshot as authority');

const model=text('src/product/model.ts');
if(!model.includes('applyLearnerProductContextMutationV2')||!model.includes('applySystemEntitlementMutationV2'))failures.push('learner/system mutation authority split missing');
const learnerMutation=model.slice(model.indexOf('export function applyLearnerProductContextMutationV2'),model.indexOf('export function applySystemEntitlementMutationV2'));
if(/status:\s*['"]ACTIVE|status:\s*['"]TRIAL|status:\s*['"]DEVELOPMENT/.test(learnerMutation))failures.push('learner mutation can mint product entitlement');

const lesson=text('app/daily-lesson.tsx');
if(!lesson.includes('productContext:runtimeProductContext'))failures.push('lesson Teacher request does not receive product context');
if(!lesson.includes("accessDecision!=='FULL'"))failures.push('lesson does not enforce honest product-access gate');
const today=text('app/(tabs)/index.tsx');
if(!today.includes('productExperienceAccessDecisionV2'))failures.push('Today does not consume product access state');

const profile=text('components/experience/ProfileSettingsScreen.tsx');
if(!profile.includes("General ·")||!profile.includes("Exam ·"))failures.push('Profile lacks separate General/Exam access projection');
if(/mastery|capability state|evidence ledger/i.test(profile))failures.push('Profile mixes product settings with learner capability truth');

const result={
  passed:failures.length===0,
  auditedCapabilities:caps.length,
  beforeAverage:Number((status.productWaveACapabilityStatusV1.reduce((sum,item)=>sum+item.beforePercent,0)/status.productWaveACapabilityStatusV1.length).toFixed(1)),
  afterAverage:Number((status.productWaveACapabilityStatusV1.reduce((sum,item)=>sum+item.afterPercent,0)/status.productWaveACapabilityStatusV1.length).toFixed(1)),
  nextWave:bWave?.subsystem,
  failures,
};
console.log(JSON.stringify(result,null,2));
if(!result.passed)process.exitCode=1;
