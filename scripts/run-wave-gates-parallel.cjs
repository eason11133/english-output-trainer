const path=require('node:path');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const node=process.execPath;
const suites=[
  ['wave-a','tests/domain/productContextWaveA.test.cjs','scripts/run-product-context-wave-a-gate.cjs'],
  ['wave-b','tests/domain/englishDomainWaveB.test.cjs','scripts/run-english-domain-wave-b-gate.cjs'],
  ['wave-c','tests/domain/learnerTruthWaveC.test.cjs','scripts/run-learner-truth-wave-c-gate.cjs'],
  ['wave-d','tests/domain/curriculumOuterLoopWaveD.test.cjs','scripts/run-curriculum-wave-d-gate.cjs'],
  ['wave-e','tests/domain/teacherRuntimeWaveE.test.cjs','scripts/run-teacher-runtime-wave-e-gate.cjs'],
  ['wave-f','tests/domain/teachingIntelligenceWaveF.test.cjs','scripts/run-teaching-intelligence-wave-f-gate.cjs'],
];
Promise.all(suites.map(args=>new Promise((resolve,reject)=>{
  const child=spawn(node,['scripts/run-isolated-domain-suite.cjs',...args],{cwd:root,stdio:'inherit'});
  child.on('exit',code=>code===0?resolve(args[0]):reject(new Error(`${args[0]} failed with ${code}`)));
  child.on('error',reject);
}))).then(done=>{console.log(JSON.stringify({passed:true,parallelSuites:done},null,2))}).catch(error=>{console.error(error);process.exitCode=1});
