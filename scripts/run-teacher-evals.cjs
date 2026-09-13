const fs=require('node:fs'),path=require('node:path');
const harness=require('../.domain-test-build/application/teacher/evalHarness.js');
const root=path.join(__dirname,'..'),out=path.join(root,'artifacts');fs.mkdirSync(out,{recursive:true});
const yaml=fs.readFileSync(path.join(root,'data/teacher/eval_regression_v1.yaml'),'utf8');harness.loadRegressionCorpusYaml(yaml);
const traces=harness.runRegressionCorpus();fs.writeFileSync(path.join(out,'teacher-eval-traces.json'),harness.serializeTraces(traces));fs.writeFileSync(path.join(out,'teacher-eval-traces.txt'),traces.map(t=>t.readable).join('\n\n'));
const failures=traces.flatMap(t=>t.turns.flatMap(x=>x.hardFails.map(f=>`${t.worldId}:${f}`)));if(failures.length){console.error(failures.join('\n'));process.exitCode=1}else console.log(`Teacher eval traces: ${traces.length} cases, ${traces.reduce((n,t)=>n+t.turns.length,0)} turns, 0 hard fails`);
