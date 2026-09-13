const fs=require('node:fs'),path=require('node:path');
const {spawnSync}=require('node:child_process');

const root=path.resolve(__dirname,'..');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build';
const fromBuild=rel=>require(path.join(root,build,rel));
const registry=fromBuild('architecture/registry.js');
const catalog=fromBuild('architecture/capabilityCatalog.js');
const routes=fromBuild('architecture/routeManifest.js');
const gate=fromBuild('evaluation/runArchitectureGateV1.js');

const failures=[...gate.runArchitectureGateV1().reasons];
const childGateScripts=[
  'scripts/run-product-context-wave-a-gate.cjs',
  'scripts/run-english-domain-wave-b-gate.cjs',
  'scripts/run-learner-truth-wave-c-gate.cjs',
  'scripts/run-curriculum-wave-d-gate.cjs',
  'scripts/run-teacher-runtime-wave-e-gate.cjs',
  'scripts/run-teaching-intelligence-wave-f-gate.cjs',
];
for(const script of childGateScripts){
  const result=spawnSync(process.execPath,[path.join(root,script)],{cwd:root,env:{...process.env,EOT_DOMAIN_TEST_BUILD:build},encoding:'utf8'});
  if(result.status!==0){
    failures.push(`child release gate failed: ${script}`);
    const detail=[result.stdout,result.stderr].filter(Boolean).join('\n').trim();
    if(detail)failures.push(detail);
  }
}


function exists(rel){return fs.existsSync(path.join(root,rel))}
function text(rel){return fs.readFileSync(path.join(root,rel),'utf8')}
function walk(dir){
  if(!fs.existsSync(dir))return[];
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const target=path.join(dir,entry.name);
    return entry.isDirectory()?walk(target):[target];
  });
}

// Every major subsystem must have a real entrypoint and ownership README.
for(const item of registry.eotArchitectureRegistryV1){
  if(!exists(item.production_entrypoint))failures.push(`${item.id} entrypoint missing: ${item.production_entrypoint}`);
  const readme=path.join(item.owner_path,'README.md');
  if(!exists(readme))failures.push(`${item.id} ownership README missing: ${readme}`);
  const count=catalog.capabilitiesForSubsystemV1(item.id).length;
  if(count!==item.capability_count)failures.push(`${item.id} capability count mismatch on disk`);
}


// Wave A must be a real first-pass subsystem, not a skeleton label.
const waveA=registry.eotArchitectureRegistryV1.find(item=>item.id==='A');
if(!waveA||waveA.current_wave_status!=='COMPLETE_FIRST_PASS'||waveA.maturity_status!=='PRODUCTION_CORE')failures.push('Wave A Product / Identity / Commercial Context is not COMPLETE_FIRST_PASS');
const waveACaps=catalog.capabilitiesForSubsystemV1('A');
if(waveACaps.length<22)failures.push(`Wave A fine-grained inventory incomplete: ${waveACaps.length}`);
for(const capability of waveACaps){const expected=['A.product-plan','A.trial-access','A.subscription-boundary'].includes(capability.id)?'CONTRACT_ONLY':'FIRST_PASS';if(capability.implementation_status!==expected)failures.push(`Wave A capability status mismatch ${capability.id}: expected ${expected}, got ${capability.implementation_status}`)}
const productFiles=walk(path.join(root,'src/product')).filter(file=>/\.ts$/.test(file));
for(const file of productFiles){
  const source=fs.readFileSync(file,'utf8');
  if(/learner-truth|domain\/evidence|application\/learner/.test(source))failures.push(`Product subsystem illegally owns learner truth: ${path.relative(root,file)}`);
}

// Canonical architecture assets.
for(const rel of [
  'src/architecture/capabilityCatalog.ts',
  'src/architecture/routeManifest.ts',
  'src/architecture/authority.ts',
  'src/architecture/upgradePlan.ts',
  'docs/architecture/EOT_V1_MAIN_ARCHITECTURE.md',
  'docs/architecture/EOT_V1_CODE_MIGRATION.md',
  'docs/architecture/EOT_V1_SUBSYSTEM_UPGRADE_PLAYBOOK.md',
])if(!exists(rel))failures.push(`architecture asset missing: ${rel}`);

// Production learner routes and exact first-level navigation.
for(const route of routes.eotLearnerRouteManifestV1.filter(item=>item.visibility!=='DEV_ONLY')){
  const routeFiles={
    '/onboarding/goals':'app/onboarding/goals.tsx',
    '/onboarding/time':'app/onboarding/time.tsx',
    '/onboarding/exam':'app/onboarding/exam.tsx',
    '/(tabs)':'app/(tabs)/index.tsx',
    '/(tabs)/practice':'app/(tabs)/practice.tsx',
    '/(tabs)/my-english':'app/(tabs)/my-english.tsx',
    '/progress-history':'app/progress-history.tsx',
    '/daily-lesson':'app/daily-lesson.tsx',
    '/result':'app/result.tsx',
    '/profile':'app/profile.tsx',
    '/settings':'app/settings.tsx',
  };
  const rel=routeFiles[route.path];
  if(rel&&!exists(rel))failures.push(`missing learner route ${route.path}: ${rel}`);
}
const tabs=text('app/(tabs)/_layout.tsx');
for(const route of ['index','practice','my-english'])if(!tabs.includes(`name="${route}"`))failures.push(`missing first-level tab ${route}`);
if(/name="journey"/.test(tabs))failures.push('Founder override forbids Journey as a first-level tab');
if((tabs.match(/<Tabs\.Screen/g)||[]).length!==3)failures.push('learner first-level tab bar must expose exactly three tabs');

// Scan production-facing code for prototype leakage or forbidden authority.
const productionRoots=['app','components/experience','components/learning','context','src/experience','src/ui','src/product-policy'];
const production=productionRoots.flatMap(rel=>walk(path.join(root,rel))).filter(file=>/\.(ts|tsx)$/.test(file)&&!file.includes(`${path.sep}__dev__${path.sep}`));
const forbidden=[
  ['review/dev fixture import',/from\s*['"][^'"]*(?:__dev__|OutputWorkspaceReview|AllowTeachingSlice)['"]/],
  ['Stage5A production ownership',/from\s*['"][^'"]*(?:application\/stage5a|components\/stage5a)['"]/],
  ['direct persistence implementation',/from\s*['"][^'"]*(?:repositories\/|AsyncStorageCanonicalEvidenceLedgerV3|Stage4RuntimeStorage)['"]/],
  ['UI Teacher-policy ownership',/from\s*['"][^'"]*(?:teacherPolicyV4|teacherInnerLoopV3)['"]/],
  ['fixed learner screenplay',/PRACTICE_GUIDED|PRACTICE_LIGHT|productionAllowWorkspaceVM|AllowSlicePhaseV4/],
];
for(const file of production){
  const source=fs.readFileSync(file,'utf8');
  for(const[label,pattern]of forbidden)if(pattern.test(source))failures.push(`${label}: ${path.relative(root,file)}`);
}

// Canonical Output Workspace ownership must be outside Stage5A.
if(!exists('components/learning/OutputWorkspace.tsx'))failures.push('canonical OutputWorkspace renderer missing');
if(!exists('src/experience/outputWorkspaceVM.ts'))failures.push('canonical OutputWorkspace VM missing');
if(!exists('src/lesson-runtime/adaptiveOutputWorkspaceRuntime.ts'))failures.push('canonical adaptive lesson runtime missing');
if(text('app/daily-lesson.tsx').includes('stage5a'))failures.push('normal lesson route still imports Stage5A');
if(text('src/experience/index.ts').includes('application/stage5a'))failures.push('Experience public entrypoint still owned by Stage5A');
if(text('src/lesson-runtime/index.ts').includes('application/stage5a'))failures.push('Lesson Runtime public entrypoint still owned by Stage5A');

// General/Exam policies may not fork learner truth or persistence.
for(const file of ['src/product-policy/general/index.ts','src/product-policy/exam/index.ts']){
  const source=text(file);
  if(/AsyncStorage|EvidenceLedger|new\s+Map|LearnerModelSnapshot\s*=/.test(source))failures.push(`product policy forks learner truth: ${file}`);
}

// Learner-facing shell must not expose internal evidence/state-machine vocabulary.
for(const file of ['app/(tabs)/index.tsx','app/(tabs)/practice.tsx','app/(tabs)/my-english.tsx','app/progress-history.tsx','app/result.tsx']){
  const source=text(file);
  if(/canonical evidence|GUIDED|LIGHT|NONE|INDEPENDENT_LOCAL_CONTROL|TRANSFER_SUPPORTED|RETENTION_SUPPORTED/.test(source))failures.push(`internal runtime/evidence terminology leaks to learner surface: ${file}`);
}

const result={
  passed:failures.length===0,
  subsystems:registry.eotArchitectureRegistryV1.length,
  fineGrainedCapabilities:catalog.eotFineGrainedCapabilityCatalogV1.length,
  productionFilesScanned:production.length,
  learnerRoutes:routes.eotLearnerRouteManifestV1.length,
  failures
};
console.log(JSON.stringify(result,null,2));
if(!result.passed)process.exitCode=1;
