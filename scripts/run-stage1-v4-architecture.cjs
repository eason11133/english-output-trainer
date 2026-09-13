const fs=require('node:fs'),path=require('node:path'),gate=require('../.domain-test-build/application/v4/architectureGateV4.js');
const scenarios=gate.parseArchitectureScenariosV4(fs.readFileSync(path.join(__dirname,'../data/architecture/v4/architecture_scenarios_v4.yaml'),'utf8'));
const result=gate.runArchitectureGateV4(scenarios);
const representative=['LIFE-001','TEACH-002','TEACH-003','INT-001','INT-002','INT-003','EVD-003','WRT-001','LM-001','LM-002','AI-001','CTX-001'].map(id=>{const x=result.resolutions.find(r=>r.scenario.id===id);return x?`${id} ${x.resolution.trace.join(' -> ')}`:null}).filter(Boolean);
console.log(JSON.stringify({scenarioCount:result.scenarioCount,authorityFailures:result.authorityFailures,invariantFailures:result.invariantFailures,modelCallFailures:result.modelCallFailures,unownedFamilies:result.unownedFamilies,representative,pass:result.pass},null,2));if(!result.pass)process.exitCode=1;
