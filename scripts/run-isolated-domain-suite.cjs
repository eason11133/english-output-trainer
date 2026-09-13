const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

const [suiteId,testFile,gateScript]=process.argv.slice(2);
if(!suiteId||!testFile)throw new Error('usage: run-isolated-domain-suite <suiteId> <testFile> [gateScript]');
const root=path.resolve(__dirname,'..');
const safe=suiteId.replace(/[^a-zA-Z0-9_-]/g,'-');
const build=`.domain-test-build-${safe}`;
const buildPath=path.join(root,build);
fs.rmSync(buildPath,{recursive:true,force:true});

const typescriptCli=require.resolve('typescript/bin/tsc');
function run(label,command,args,options={}){
  const result=spawnSync(command,args,{cwd:root,stdio:'inherit',env:process.env,...options});
  if(result.error){
    console.error(`${label} failed to start: ${result.error.stack||result.error.message}`);
    process.exit(1);
  }
  if(result.signal){
    console.error(`${label} terminated by signal ${result.signal}`);
    process.exit(1);
  }
  if(result.status!==0)process.exit(result.status??1);
}

run('TypeScript compile',process.execPath,[typescriptCli,'-p','tsconfig.domain-tests.json','--outDir',build]);
const env={...process.env,EOT_DOMAIN_TEST_BUILD:build};
run('Domain test',process.execPath,['--test',testFile],{env});
if(gateScript){
  run('Domain gate',process.execPath,[gateScript],{env});
}
