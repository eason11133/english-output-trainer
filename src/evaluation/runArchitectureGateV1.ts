import { eotFineGrainedCapabilityCatalogV1 } from '../architecture/capabilityCatalog';
import { eotArchitectureRegistryV1 } from '../architecture/registry';
import { eotFirstLevelNavigationV1, eotLearnerRouteManifestV1 } from '../architecture/routeManifest';

function dependencyCyclesV1(){
  const graph=new Map(eotArchitectureRegistryV1.map(item=>[item.id,item.dependencies] as const));
  const visiting=new Set<string>(),visited=new Set<string>(),cycles:string[]=[];
  const walk=(id:string,path:string[])=>{
    if(visiting.has(id)){cycles.push([...path,id].join(' -> '));return}
    if(visited.has(id))return;
    visiting.add(id);
    for(const dependency of graph.get(id)??[])walk(dependency,[...path,id]);
    visiting.delete(id);visited.add(id);
  };
  for(const item of eotArchitectureRegistryV1)walk(item.id,[]);
  return cycles;
}

export function runArchitectureGateV1(){
  const expected='ABCDEFGHIJKLMNOPQRSTUVWXY'.split('');
  const ids=eotArchitectureRegistryV1.map(item=>item.id);
  const reasons:string[]=[];
  if(ids.length!==25)reasons.push(`expected 25 subsystems, got ${ids.length}`);
  for(const id of expected)if(!ids.includes(id))reasons.push(`missing subsystem ${id}`);
  if(new Set(ids).size!==ids.length)reasons.push('duplicate subsystem id');

  const capabilityIds=eotFineGrainedCapabilityCatalogV1.map(item=>item.id);
  if(new Set(capabilityIds).size!==capabilityIds.length)reasons.push('duplicate fine-grained capability id');
  for(const item of eotArchitectureRegistryV1){
    if(!item.owner_path||!item.production_entrypoint||!item.public_contracts.length)reasons.push(`${item.id} missing ownership or public contract`);
    for(const dependency of item.dependencies)if(!ids.includes(dependency))reasons.push(`${item.id} has unknown dependency ${dependency}`);
    const actual=eotFineGrainedCapabilityCatalogV1.filter(capability=>capability.subsystem===item.id).length;
    if(actual===0)reasons.push(`${item.id} has no fine-grained capability inventory`);
    if(actual!==item.capability_count)reasons.push(`${item.id} capability count mismatch ${item.capability_count} != ${actual}`);
  }
  for(const cycle of dependencyCyclesV1())reasons.push(`authority dependency cycle: ${cycle}`);

  const contractOnlyCapabilitiesV1=new Set(['A.product-plan','A.trial-access','A.subscription-boundary','B.chunk','B.collocation']);
  for(const id of ['A','B','C','D','E','F']){
    const wave=eotArchitectureRegistryV1.find(item=>item.id===id);
    if(!wave||wave.current_wave_status!=='COMPLETE_FIRST_PASS'||wave.maturity_status!=='PRODUCTION_CORE')reasons.push(`Wave ${id} must be COMPLETE_FIRST_PASS / PRODUCTION_CORE`);
    for(const capability of eotFineGrainedCapabilityCatalogV1.filter(item=>item.subsystem===id)){
      const expected=contractOnlyCapabilitiesV1.has(capability.id)?'CONTRACT_ONLY':'FIRST_PASS';
      if(capability.implementation_status!==expected)reasons.push(`Wave ${id} capability status mismatch ${capability.id}: expected ${expected}, got ${capability.implementation_status}`);
    }
  }
  const next=eotArchitectureRegistryV1.find(item=>item.id==='G');
  if(!next||!['ESTABLISHED','ADAPTED','DEFERRED_DEEP_IMPLEMENTATION','READY_FOR_AUDIT'].includes(next.current_wave_status))reasons.push('Wave G must remain a non-complete downstream subsystem after Wave F');

  const productionRoutes=eotLearnerRouteManifestV1.filter(route=>route.visibility!=='DEV_ONLY');
  for(const routeId of eotFirstLevelNavigationV1){
    const route=productionRoutes.find(item=>item.id===routeId);
    if(!route||!route.first_level)reasons.push(`missing first-level learner route ${routeId}`);
  }
  if(JSON.stringify(eotFirstLevelNavigationV1)!==JSON.stringify(['TODAY','PRACTICE','MY_ENGLISH']))reasons.push('first-level learner navigation must be exactly Today / Practice / My English');
  const paths=eotLearnerRouteManifestV1.map(item=>item.path);
  if(new Set(paths).size!==paths.length)reasons.push('duplicate learner route path');

  return{
    passed:reasons.length===0,
    reasons,
    subsystemCount:eotArchitectureRegistryV1.length,
    fineGrainedCapabilityCount:eotFineGrainedCapabilityCatalogV1.length,
    productionRouteCount:productionRoutes.length,
  };
}
