const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build';
const fromBuild=rel=>require(path.join(__dirname,'..','..',build,rel));
const architecture=fromBuild('architecture/registry.js');
const catalog=fromBuild('architecture/capabilityCatalog.js');
const routes=fromBuild('architecture/routeManifest.js');
const gate=fromBuild('evaluation/runArchitectureGateV1.js');
const migration=fromBuild('architecture/migrationManifest.js');

test('EOT V1 registry owns all A-Y subsystem families',()=>{
  assert.equal(architecture.eotArchitectureRegistryV1.length,25);
  assert.deepEqual(architecture.eotArchitectureRegistryV1.map(item=>item.id),'ABCDEFGHIJKLMNOPQRSTUVWXY'.split(''));
  assert.equal(gate.runArchitectureGateV1().passed,true);
});

test('every subsystem has a real fine-grained capability inventory',()=>{
  assert.ok(catalog.eotFineGrainedCapabilityCatalogV1.length>=300);
  const ids=new Set(catalog.eotFineGrainedCapabilityCatalogV1.map(item=>item.id));
  assert.equal(ids.size,catalog.eotFineGrainedCapabilityCatalogV1.length);
  for(const item of architecture.eotArchitectureRegistryV1){
    assert.ok(item.owner_path);
    assert.ok(item.production_entrypoint);
    assert.ok(item.public_contracts.length);
    assert.ok(Array.isArray(item.dependencies));
    assert.ok(item.capability_count>0,`${item.id} capability inventory missing`);
    assert.equal(catalog.capabilitiesForSubsystemV1(item.id).length,item.capability_count);
  }
});

test('Founder canonical production learner spine is Today / Practice / My English',()=>{
  assert.deepEqual([...routes.eotFirstLevelNavigationV1],['TODAY','PRACTICE','MY_ENGLISH']);
  const production=routes.eotLearnerRouteManifestV1.filter(item=>item.visibility!=='DEV_ONLY');
  for(const id of routes.eotFirstLevelNavigationV1){
    assert.equal(production.find(item=>item.id===id)?.first_level,true);
  }
  assert.equal(routes.eotLearnerRouteManifestV1.find(item=>item.id==='PROGRESS_HISTORY')?.first_level,false);
  assert.equal(routes.eotLearnerRouteManifestV1.some(item=>item.id==='JOURNEY'&&item.first_level),false);
  assert.equal(routes.eotLearnerRouteManifestV1.find(item=>item.id==='DEV_OUTPUT_WORKSPACE').visibility,'DEV_ONLY');
});

test('migration manifest explicitly moves Stage5A product ownership out of Stage paths',()=>{
  const dispositions=new Set(migration.architectureMigrationManifestV1.map(item=>item.classification));
  for(const expected of ['KEEP','MOVE','ADAPT','REUSE_AS_MECHANISM','DEV_ONLY','SUPERSEDED'])assert.ok(dispositions.has(expected));
  assert.ok(migration.architectureMigrationManifestV1.some(item=>item.current_path.includes('adaptiveOutputWorkspaceRuntime')&&item.classification==='MOVE'&&item.owner_subsystem==='M'));
  assert.ok(migration.architectureMigrationManifestV1.some(item=>item.current_path.includes('outputWorkspaceVM')&&item.classification==='MOVE'&&item.owner_subsystem==='N'));
  assert.ok(migration.architectureMigrationManifestV1.some(item=>item.current_path.includes('AllowTeachingSlice')&&item.classification==='DEV_ONLY'));
});

test('Waves A-F are first-pass complete without prematurely promoting downstream subsystems',()=>{
  const a=architecture.eotArchitectureRegistryV1.find(item=>item.id==='A');
  assert.equal(a.current_wave_status,'COMPLETE_FIRST_PASS');
  assert.equal(a.maturity_status,'PRODUCTION_CORE');
  const aCaps=catalog.capabilitiesForSubsystemV1('A');
  assert.ok(aCaps.length>=22);
  assert.deepEqual(aCaps.filter(item=>item.implementation_status==='CONTRACT_ONLY').map(item=>item.id).sort(),['A.product-plan','A.subscription-boundary','A.trial-access']);
  assert.ok(aCaps.filter(item=>item.implementation_status!=='CONTRACT_ONLY').every(item=>item.implementation_status==='FIRST_PASS'));
  const b=architecture.eotArchitectureRegistryV1.find(item=>item.id==='B');
  assert.equal(b.current_wave_status,'COMPLETE_FIRST_PASS');
  const bCaps=catalog.capabilitiesForSubsystemV1('B');
  assert.ok(bCaps.length>=27);
  assert.deepEqual(bCaps.filter(item=>item.implementation_status==='CONTRACT_ONLY').map(item=>item.id).sort(),['B.chunk','B.collocation']);
  assert.ok(bCaps.filter(item=>item.implementation_status!=='CONTRACT_ONLY').every(item=>item.implementation_status==='FIRST_PASS'));
  const c=architecture.eotArchitectureRegistryV1.find(item=>item.id==='C');
  assert.equal(c.current_wave_status,'COMPLETE_FIRST_PASS');
  const cCaps=catalog.capabilitiesForSubsystemV1('C');
  assert.equal(cCaps.length,17);
  assert.ok(cCaps.every(item=>item.implementation_status==='FIRST_PASS'));
  const d=architecture.eotArchitectureRegistryV1.find(item=>item.id==='D');
  assert.equal(d.current_wave_status,'COMPLETE_FIRST_PASS');
  assert.equal(d.maturity_status,'PRODUCTION_CORE');
  const dCaps=catalog.capabilitiesForSubsystemV1('D');
  assert.equal(dCaps.length,17);
  assert.ok(dCaps.every(item=>item.implementation_status==='FIRST_PASS'));
  const e=architecture.eotArchitectureRegistryV1.find(item=>item.id==='E');
  assert.equal(e.current_wave_status,'COMPLETE_FIRST_PASS');
  const eCaps=catalog.capabilitiesForSubsystemV1('E');
  assert.equal(eCaps.length,26);
  assert.ok(eCaps.every(item=>item.implementation_status==='FIRST_PASS'));
  const f=architecture.eotArchitectureRegistryV1.find(item=>item.id==='F');
  assert.equal(f.current_wave_status,'COMPLETE_FIRST_PASS');
  assert.equal(f.maturity_status,'PRODUCTION_CORE');
  const fCaps=catalog.capabilitiesForSubsystemV1('F');
  assert.equal(fCaps.length,24);
  assert.ok(fCaps.every(item=>item.implementation_status==='FIRST_PASS'));
});
