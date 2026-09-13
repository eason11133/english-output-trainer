const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..'),build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build-wave-q';const q=require(path.join(root,build,'authentic-input/index.js'));const registry=require(path.join(root,build,'architecture/registry.js'));const catalog=require(path.join(root,build,'architecture/capabilityCatalog.js'));const failures=[];
for(const rel of ['src/authentic-input/types.ts','src/authentic-input/runtime.ts','src/authentic-input/capabilities.ts','src/authentic-input/waveQStatus.ts','tests/domain/authenticInputWaveQ.test.cjs'])if(!fs.existsSync(path.join(root,rel)))failures.push(`missing Q asset: ${rel}`);
const sub=registry.architectureSubsystemV1('Q');if(!sub||sub.production_entrypoint!=='src/authentic-input/index.ts')failures.push('Q registry entrypoint mismatch');
const caps=Object.fromEntries(catalog.capabilitiesForSubsystemV1('Q').map(x=>[x.id,x.implementation_status]));
for(const id of ['Q.typing','Q.paste','Q.writing-artifact','Q.translation-prompt','Q.image-intake','Q.pdf-intake','Q.artifact-normalization'])if(caps[id]!=='FIRST_PASS')failures.push(`${id} should be FIRST_PASS`);
for(const id of ['Q.school-material','Q.teacher-material'])if(caps[id]!=='CONTRACT_ONLY')failures.push(`${id} should be CONTRACT_ONLY`);
if(caps['Q.future-capture-boundary']!=='NOT_AUDITED')failures.push('future capture must remain FUTURE/not production-complete');
const summary=q.authenticInputWaveSummaryV1();if(summary.firstPass!==7||summary.contractOnly!==2||summary.future!==1)failures.push('Q summary mismatch');
console.log(JSON.stringify({wave:'Q',status:q.waveQAuthenticInputStatusV1.status,summary,failures},null,2));if(failures.length)process.exit(1);
