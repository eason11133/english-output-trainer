const {eotFineGrainedCapabilityCatalogV1}=require('../.domain-test-build-wave-i/architecture/capabilityCatalog.js');
const caps=eotFineGrainedCapabilityCatalogV1.filter(x=>x.subsystem==='I');
const failures=[];if(caps.length!==15)failures.push(`expected 15 I capabilities, got ${caps.length}`);if(caps.some(x=>x.implementation_status==='NOT_AUDITED'))failures.push('I capability remains NOT_AUDITED');
console.log(JSON.stringify({passed:failures.length===0,capabilities:caps.length,status:'READY_FOR_AUDIT',firstPass:caps.filter(x=>x.implementation_status==='FIRST_PASS').map(x=>x.id),failures},null,2));if(failures.length)process.exit(1);
