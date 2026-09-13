const { runStage2GateV4 }=require('../.domain-test-build/application/stage2/stage2HarnessV4.js');
const report=runStage2GateV4();
console.log(JSON.stringify(report,null,2));
if(!report.passed)process.exitCode=1;
