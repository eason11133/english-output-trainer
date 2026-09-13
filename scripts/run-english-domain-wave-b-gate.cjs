const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build';
const fromBuild=rel=>require(path.join(root,build,rel));
const registry=fromBuild('architecture/registry.js');
const catalog=fromBuild('architecture/capabilityCatalog.js');
const upgrade=fromBuild('architecture/upgradePlan.js');
const status=fromBuild('domain/english/waveBStatus.js');
const core=fromBuild('domain/english/coreGraph.js');
const graph=fromBuild('domain/english/EnglishDomainGraph.js');
const failures=[];
const exists=rel=>fs.existsSync(path.join(root,rel));
const text=rel=>fs.readFileSync(path.join(root,rel),'utf8');

for(const rel of[
  'src/domain/english/EnglishDomainGraph.ts','src/domain/english/capabilityModel.ts','src/domain/english/coreGraph.ts','src/domain/english/waveBStatus.ts',
  'tests/domain/englishDomainWaveB.test.cjs','docs/architecture/waves/B_ENGLISH_DOMAIN_CAPABILITY_GRAPH_WAVE.md',
])if(!exists(rel))failures.push(`missing Wave B asset: ${rel}`);

const b=registry.eotArchitectureRegistryV1.find(item=>item.id==='B');
if(!b||b.maturity_status!=='PRODUCTION_CORE'||b.current_wave_status!=='COMPLETE_FIRST_PASS')failures.push('B registry status is not COMPLETE_FIRST_PASS / PRODUCTION_CORE');
if(!b?.public_contracts.includes('EnglishDomainPortV2'))failures.push('B registry does not expose EnglishDomainPortV2');
const caps=catalog.capabilitiesForSubsystemV1('B');
if(caps.length<27)failures.push(`expected at least 27 audited Wave B capabilities, got ${caps.length}`);
for(const cap of caps){const expected=['B.chunk','B.collocation'].includes(cap.id)?'CONTRACT_ONLY':'FIRST_PASS';if(cap.implementation_status!==expected)failures.push(`Wave B capability status mismatch ${cap.id}: expected ${expected}, got ${cap.implementation_status}`)}
const auditIds=new Set(status.englishDomainWaveBCapabilityStatusV1.map(item=>item.capabilityId));
for(const cap of caps)if(!auditIds.has(cap.id))failures.push(`Wave B audit row missing: ${cap.id}`);
for(const row of status.englishDomainWaveBCapabilityStatusV1)if(row.afterPercent<=row.beforePercent&&!row.auditAdjusted)failures.push(`Wave B capability did not advance without an explicit independent-audit correction: ${row.capabilityId}`);
for(const id of ['B.chunk','B.collocation']){const row=status.englishDomainWaveBCapabilityStatusV1.find(item=>item.capabilityId===id);if(row?.afterPercent!==25)failures.push(`${id} must remain honestly audited at 25 until canonical content + production consumer exist`)}

const bWave=upgrade.recommendedMajorSubsystemUpgradeWavesV1.find(item=>item.subsystem==='B');
const cWave=upgrade.recommendedMajorSubsystemUpgradeWavesV1.find(item=>item.subsystem==='C');
if(bWave?.state!=='COMPLETE_FIRST_PASS')failures.push('Wave B upgrade plan state incorrect');
if(!['READY_FOR_AUDIT','IN_PROGRESS','COMPLETE_FIRST_PASS'].includes(cWave?.state))failures.push('Wave C has invalid later-wave state');

const graphErrors=graph.validateEnglishDomainGraphV2(core.coreEnglishDomainGraphV2);
if(graphErrors.length)failures.push(...graphErrors.map(error=>`core graph invalid: ${error}`));
if(core.coreEnglishDomainPortV2.resolveId('allow O to V')!=='allow-object-infinitive')failures.push('legacy allow target alias does not resolve canonically');
if(!core.coreEnglishDomainPortV2.realizationsForMeaning('meaning.permission-agent-action').some(node=>node.id==='allow-object-infinitive'))failures.push('meaning-to-English realization relation missing for controlled allow target');
if(core.coreEnglishDomainPortV2.prerequisites('translation.meaning-to-english')[0]!=='translation.meaning-segmentation')failures.push('canonical prerequisite direction/query incorrect');

const domainText=text('src/domain/english/EnglishDomainGraph.ts');
for(const marker of['MEANING_INTENT','WORD_FORM','MORPHOLOGICAL_PATTERN','ALTERNATIVE_REALIZATION','EnglishCapabilityConditionV2','prerequisite cycle'])if(!domainText.includes(marker))failures.push(`English graph model missing ${marker}`);
if(/mastery|learnerId|evidenceIds/.test(domainText.replace(/\/\*[\s\S]*?\*\//g,'')))failures.push('English Domain graph appears to own learner-state/evidence fields');

const evidenceGuard=text('src/application/evidence/evidenceGuardsV3.ts');
if(!evidenceGuard.includes('capability target must resolve to canonical English Domain identity'))failures.push('production evidence guard does not reject unresolved English targets');
const lessonRoute=text('app/daily-lesson.tsx');
if(lessonRoute.includes('BOUND_TARGET'))failures.push('production lesson still writes BOUND_TARGET');
if(!lessonRoute.includes('coreEnglishDomainPortV2.resolveId'))failures.push('production lesson does not canonicalize evidence targets');

const allow=text('src/teaching/mechanisms/allowObjectInfinitive.ts');
if(!allow.includes('coreEnglishDomainPortV2')||!allow.includes('ALLOW_OBJECT_INFINITIVE_TARGET_REF'))failures.push('validated allow mechanism does not bind to canonical English Domain target identity');
const fixture=text('src/application/stage5a/adaptiveOutputWorkspaceRuntime.ts');
if(/targetReference:\s*['"]allow-object-infinitive['"]/.test(fixture))failures.push('Stage5A compatibility provider still hard-codes targetRef instead of canonical domain identity');

const result={
  passed:failures.length===0,
  auditedCapabilities:caps.length,
  totalCapabilities:catalog.eotFineGrainedCapabilityCatalogV1.length,
  graphNodes:core.coreEnglishDomainGraphV2.nodes.length,
  graphEdges:core.coreEnglishDomainGraphV2.edges.length,
  beforeAverage:Number((status.englishDomainWaveBCapabilityStatusV1.reduce((sum,item)=>sum+item.beforePercent,0)/status.englishDomainWaveBCapabilityStatusV1.length).toFixed(1)),
  afterAverage:Number((status.englishDomainWaveBCapabilityStatusV1.reduce((sum,item)=>sum+item.afterPercent,0)/status.englishDomainWaveBCapabilityStatusV1.length).toFixed(1)),
  nextWave:cWave?.subsystem,
  failures,
};
console.log(JSON.stringify(result,null,2));
if(!result.passed)process.exitCode=1;
