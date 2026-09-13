const path=require('node:path');
const build=path.resolve(process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build-reading-continuation');
const {readingContinuationCoverageV1}=require(path.join(build,'application/exam/readingContinuationCoverage.js'));
const report=readingContinuationCoverageV1();console.log(JSON.stringify(report,null,2));if(!report.passed)process.exit(1);
