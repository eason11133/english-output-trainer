const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const{pathToFileURL}=require('node:url');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build-wave-t';const req=rel=>require(path.resolve(process.cwd(),build,rel));
const contracts=req('model/contracts.js');const guards=req('model/guards.js');const caps=req('model/capabilities.js');const lineage=req('model/lineage.js');

test('model operations are versioned but only implemented operations expose production endpoints',()=>{
  for(const id of ['TEACHER_PLAN','TEACHER_BLOCK_SELECTION','ARTIFACT_TRANSCRIPTION','CONTENT_GENERATION','SEMANTIC_ANALYSIS']){const c=contracts.modelOperationContractV1(id);assert.equal(c.id,id);assert.match(c.promptVersion,/v\d/i);assert.match(c.schemaVersion,/v\d/i);assert.equal(c.providerSelection,'SERVER_ONLY');assert.equal(c.structuredOutput,'REQUIRED');assert.ok(c.timeoutMs>0);assert.ok(c.maxOutputTokens>0)}
  for(const id of ['TEACHER_PLAN','TEACHER_BLOCK_SELECTION','ARTIFACT_TRANSCRIPTION'])assert.match(contracts.productionModelEndpointContractV1(id).path,/^\/teacher\//);
  assert.equal(contracts.productionModelEndpointContractV1('SEMANTIC_ANALYSIS').path,'/assessment/gsat');
  assert.throws(()=>contracts.productionModelEndpointContractV1('CONTENT_GENERATION'),/not_production/);
});

test('client Teacher API consumes T operation registry and never chooses provider/model',()=>{
  const src=fs.readFileSync('lib/teacherApi.ts','utf8');
  assert.match(src,/productionModelEndpointContractV1/);assert.match(src,/TEACHER_PLAN/);assert.match(src,/ARTIFACT_TRANSCRIPTION/);assert.match(src,/TEACHER_BLOCK_SELECTION/);assert.match(src,/SEMANTIC_ANALYSIS/);
  assert.doesNotMatch(src,/gpt-|OPENAI_MODEL|OPENAI_API_KEY|authorization:\s*`Bearer/);
  assert.doesNotMatch(src,/while\s*\(|maxRetries|retryAfter/i);
});

test('model authority guard rejects nested canonical truth/session authority claims',()=>{
  const clean=guards.guardModelProposalAuthorityV1({proposal:{action:'TEACH',notes:['ok']}});assert.equal(clean.valid,true);
  const bad=guards.guardModelProposalAuthorityV1({proposal:{nested:{canonicalEvidence:{id:'fake'}},sessionMutation:true}});assert.equal(bad.valid,false);assert.ok(bad.errors.some(x=>x.includes('canonicalEvidence')));assert.ok(bad.errors.some(x=>x.includes('sessionMutation')));
});

test('fallback lineage does not masquerade as successful model run',()=>{
  assert.deepEqual(lineage.teacherModelRunDescriptorV1('AI'),{provider:'AI',model:'teacher-gateway',promptVersion:'qualified-block-v1',status:'SUCCEEDED',responseIsModelOutput:true});
  const rejected=lineage.teacherModelRunDescriptorV1('FALLBACK_AFTER_REJECTION');assert.equal(rejected.status,'REJECTED');assert.equal(rejected.responseIsModelOutput,false);
  const deterministic=lineage.teacherModelRunDescriptorV1('DETERMINISTIC_FALLBACK');assert.equal(deterministic.status,'NOT_CALLED');assert.equal(deterministic.model,'none');assert.equal(deterministic.responseIsModelOutput,false);
});

test('server retry ownership is explicit and quota exhaustion is never retried',async()=>{
  const p=await import(pathToFileURL(path.resolve(process.cwd(),'coach-server/model-policy-v1.mjs')).href);
  assert.equal(p.MODEL_OPERATION_POLICY_V1.TEACHER_PROPOSAL.retryOwner,'SERVER');
  assert.equal(p.MODEL_OPERATION_POLICY_V1.BLOCK_SELECTION.retryOwner,'NONE');
  assert.equal(p.retryableProviderResponseV1({status:503,headers:{get(){return null}}},{}),true);
  assert.equal(p.retryableProviderResponseV1({status:429,headers:{get(){return null}}},{error:{code:'insufficient_quota'}}),false);
  assert.equal(p.retryableProviderResponseV1({status:400,headers:{get(){return null}}},{}),false);
});

test('Teacher agent uses shared T retry and cost policy with bounded context/output',()=>{
  const src=fs.readFileSync('coach-server/teacher-agent-v4.mjs','utf8');
  assert.match(src,/model-policy-v1\.mjs/);assert.match(src,/retryableProviderResponseV1/);assert.match(src,/estimateModelCostUsdV1/);assert.match(src,/maxContextChars:24000/);assert.match(src,/max_output_tokens:AGENT_BUDGETS\.maxOutputTokens/);
});

test('T capability claims remain conservative',()=>{
  const by=id=>caps.modelCapabilityStatesV1.find(x=>x.id===id);
  assert.equal(by('T.provider-abstraction').status,'FIRST_PASS');assert.equal(by('T.structured-output').status,'FIRST_PASS');assert.equal(by('T.timeout-retry').status,'FIRST_PASS');assert.equal(by('T.prompt-versioning').status,'FIRST_PASS');
  assert.equal(by('T.semantic-diagnosis').status,'CONTRACT_ONLY');assert.equal(by('T.content-generation').status,'CONTRACT_ONLY');assert.equal(by('T.fallback-model').status,'CONTRACT_ONLY');assert.equal(by('T.cost-control').status,'CONTRACT_ONLY');assert.equal(by('T.rate-control').status,'CONTRACT_ONLY');assert.equal(by('T.model-evaluation').status,'CONTRACT_ONLY');
});
