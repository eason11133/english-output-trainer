const {runBlockSelectionStage2V4}=require('../.domain-test-build/application/stage2/blockSelectionEvalV4.js');
const r=runBlockSelectionStage2V4();
const summary={passed:r.passed,baseFamilies:r.baseFamilies,baseCases:r.baseCases,contrastPairs:r.contrastPairs,semanticVariants:r.semanticVariants,totalCases:r.totalCases,byRole:r.byRole,byDomain:r.byDomain,teachingMechanisms:r.teachingMechanisms,calibration:r.calibration,failures:r.failures.length,hardFailures:r.hardFailures,contrastFailures:r.contrastFailures,owners:r.owners,paidModelCalls:r.paidModelCalls};
console.log(JSON.stringify(summary,null,2));if(!r.passed)process.exitCode=1;
