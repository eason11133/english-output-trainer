const fs=require('node:fs');
const path=require('node:path');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build';
const registry=require(path.resolve(build,'application/v4/blockRegistryV4.js'));
const contract=registry.providerBlockContractV4();
const destination=path.resolve('shared/block-contract-v4.generated.json');
const next=JSON.stringify(contract,null,2)+'\n';
if(process.argv.includes('--verify')){
  const existing=fs.existsSync(destination)?fs.readFileSync(destination,'utf8'):'';
  if(existing!==next){console.error('canonical_block_contract_generated_snapshot_diverged');process.exit(1)}
  console.log(JSON.stringify({pass:true,fingerprint:contract.fingerprint,blocks:contract.blocks.length}));
}else{
  fs.writeFileSync(destination,next);
  console.log(JSON.stringify({written:destination,fingerprint:contract.fingerprint,blocks:contract.blocks.length}));
}
