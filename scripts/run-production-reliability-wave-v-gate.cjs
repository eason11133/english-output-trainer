const path=require('node:path');const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build-wave-v';const req=rel=>require(path.resolve(process.cwd(),build,rel));const{reliabilityCapabilityStatesV1,reliabilityWaveSummaryV1}=req('reliability/capabilities.js');const expected=['V.network-failure','V.model-failure','V.partial-response','V.crash-recovery','V.logging','V.error-monitoring','V.secret-handling','V.release-config','V.android-ios','V.keyboard-ime','V.safe-area-back','V.rate-cost-guardrails'];for(const id of expected)if(!reliabilityCapabilityStatesV1.some(x=>x.id===id))throw new Error(`missing ${id}`);if(reliabilityCapabilityStatesV1.length!==expected.length)throw new Error(`expected ${expected.length} V capabilities, got ${reliabilityCapabilityStatesV1.length}`);console.log(JSON.stringify({status:'READY_FOR_AUDIT',...reliabilityWaveSummaryV1()},null,2));
const fs=require('node:fs');const{spawnSync}=require('node:child_process');
for(const file of ['coach-server/reliability-v1.mjs','coach-server/teacher-server.mjs','coach-server/teacher-agent-v4.mjs']){
  const checked=spawnSync(process.execPath,['--check',file],{cwd:process.cwd(),stdio:'inherit'});
  if(checked.status!==0)throw new Error(`server syntax check failed: ${file}`);
}
let tscCli=null;try{tscCli=require.resolve('typescript/bin/tsc')}catch{}
if(tscCli){
  const compiled=spawnSync(process.execPath,[tscCli,'--ignoreConfig','--noEmit','--target','ES2022','--module','node16','--moduleResolution','node16','--resolveJsonModule','--strict','--skipLibCheck','lib/teacherApi.ts'],{cwd:process.cwd(),stdio:'inherit'});
  if(compiled.status!==0)throw new Error('teacherApi standalone compile failed');
}
