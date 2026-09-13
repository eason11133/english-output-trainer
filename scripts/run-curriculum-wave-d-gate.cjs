const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build';
const fromBuild=rel=>require(path.join(root,build,rel));
const registry=fromBuild('architecture/registry.js');
const catalog=fromBuild('architecture/capabilityCatalog.js');
const upgrade=fromBuild('architecture/upgradePlan.js');
const status=fromBuild('curriculum/waveDStatus.js');

const failures=[];
const exists=rel=>fs.existsSync(path.join(root,rel));
const text=rel=>fs.readFileSync(path.join(root,rel),'utf8');

for(const rel of[
  'src/curriculum/types.ts',
  'src/curriculum/goalPolicy.ts',
  'src/curriculum/readiness.ts',
  'src/curriculum/spacing.ts',
  'src/curriculum/timeArchitecture.ts',
  'src/curriculum/engine.ts',
  'src/curriculum/waveDStatus.ts',
  'tests/domain/curriculumOuterLoopWaveD.test.cjs',
  'docs/architecture/waves/D_CURRICULUM_OUTER_LOOP_WAVE.md',
]) if(!exists(rel))failures.push(`missing Wave D asset: ${rel}`);

const d=registry.eotArchitectureRegistryV1.find(item=>item.id==='D');
if(!d||d.maturity_status!=='PRODUCTION_CORE'||d.current_wave_status!=='COMPLETE_FIRST_PASS'){
  failures.push('D registry status is not COMPLETE_FIRST_PASS / PRODUCTION_CORE');
}

const caps=catalog.capabilitiesForSubsystemV1('D');
if(caps.length!==17)failures.push(`expected 17 Wave D capabilities, got ${caps.length}`);
for(const cap of caps)if(cap.implementation_status!=='FIRST_PASS')failures.push(`Wave D capability not FIRST_PASS: ${cap.id}`);

const auditIds=new Set(status.curriculumWaveDCapabilityStatusV1.map(item=>item.capabilityId));
for(const cap of caps)if(!auditIds.has(cap.id))failures.push(`Wave D audit row missing: ${cap.id}`);
for(const row of status.curriculumWaveDCapabilityStatusV1){
  if(row.afterPercent<=row.beforePercent)failures.push(`Wave D capability did not advance: ${row.capabilityId}`);
  if(![25,50,75,90,100].includes(row.afterPercent))failures.push(`Wave D afterPercent is not evidence-gated: ${row.capabilityId}:${row.afterPercent}`);
}

const dWave=upgrade.recommendedMajorSubsystemUpgradeWavesV1.find(item=>item.subsystem==='D');
const eWave=upgrade.recommendedMajorSubsystemUpgradeWavesV1.find(item=>item.subsystem==='E');
if(dWave?.state!=='COMPLETE_FIRST_PASS')failures.push('Wave D upgrade plan state incorrect');
if(!['READY_FOR_AUDIT','IN_PROGRESS','COMPLETE_FIRST_PASS'].includes(eWave?.state))failures.push('Wave E has an invalid later-wave state');

const engine=text('src/curriculum/engine.ts');
for(const marker of[
  'buildCurriculumCandidatesV1',
  'createTodayCurriculumPlanV1',
  'lessonPlanFromTodayV1',
  "frontier:blocked?'BLOCKED':need.frontier",
  "needKind!=='MAINTENANCE'",
  'noFixedSequence:true',
]) if(!engine.includes(marker))failures.push(`canonical curriculum engine missing: ${marker}`);

const readiness=text('src/curriculum/readiness.ts');
if(!readiness.includes('prerequisiteReadinessV1'))failures.push('prerequisite readiness missing');
if(!readiness.includes('targetHasIndependentReadinessV1'))failures.push('prerequisites are not evidence-qualified');

const spacing=text('src/curriculum/spacing.ts');
if(!spacing.includes('retentionMinimumDelayHours'))failures.push('retention delayed-evidence gate missing');

const time=text('src/curriculum/timeArchitecture.ts');
if(!time.includes('fixedSequence:false'))failures.push('time architecture does not explicitly reject fixed lesson sequence');

const todayQuery=text('src/experience/learnerSpineQueries.ts');
if(!todayQuery.includes('loadTodayCurriculumVMV1'))failures.push('production experience has no Today curriculum consumer');
if(!todayQuery.includes('canonicalCurriculumV1'))failures.push('Today consumer does not use canonical D authority');

const todayScreen=text('app/(tabs)/index.tsx');
if(!todayScreen.includes('loadTodayCurriculumVMV1'))failures.push('Today route does not request canonical curriculum plan');

const lessonRoute=text('app/daily-lesson.tsx');
for(const marker of['loadTodayCurriculumVMV1','curriculumLessonPlan:lessonPlan','canonical_lesson_plan_required','decideInnerTutorV1','lessonPlan,productContext:runtimeProductContext'])if(!lessonRoute.includes(marker))failures.push(`production lesson continuity missing: ${marker}`);
if(lessonRoute.includes('BOUND_TARGET'))failures.push('production lesson bypasses canonical curriculum target with BOUND_TARGET');
const lessonPlanRow=status.curriculumWaveDCapabilityStatusV1.find(item=>item.capabilityId==='D.lesson-plan');
if(lessonPlanRow?.afterPercent!==90)failures.push('D.lesson-plan must reflect production consumer reconciliation at 90');
const dSource=[engine,readiness,spacing,time].join('\n');
if(/selectedBlockId|supportLevel|TeachingMode|mechanism-selection/.test(dSource))failures.push('D authority leak: Curriculum is choosing HOW to teach');

const result={
  passed:failures.length===0,
  auditedCapabilities:caps.length,
  evidenceGatedScale:'0/25/50/75/90/100',
  nextWave:eWave?.subsystem,
  failures,
};
console.log(JSON.stringify(result,null,2));
if(!result.passed)process.exitCode=1;
