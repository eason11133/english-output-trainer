const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const{pathToFileURL}=require('node:url');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build-wave-v';const req=rel=>require(path.resolve(process.cwd(),build,rel));
const failures=req('reliability/providerFailure.js');const config=req('reliability/releaseConfig.js');const logs=req('reliability/operationalLogging.js');const policy=req('reliability/policy.js');const caps=req('reliability/capabilities.js');

test('HTTP failures are classified without automatic client retry',()=>{
  const timeout=failures.providerFailureFromHttpV1('TEACHER_DECISION',408,'r1'),rate=failures.providerFailureFromHttpV1('TEACHER_DECISION',429,'r2'),server=failures.providerFailureFromHttpV1('TRANSCRIPTION',503,'r3'),client=failures.providerFailureFromHttpV1('TRANSCRIPTION',400,'r4');
  assert.equal(timeout.kind,'TIMEOUT');assert.equal(rate.kind,'RATE_LIMITED');assert.equal(server.kind,'SERVER_UNAVAILABLE');assert.equal(client.kind,'CLIENT_REJECTED');
  for(const f of [timeout,rate,server,client])assert.equal(f.automaticRetry,false);
  assert.equal(client.retryable,false);assert.equal(rate.retryable,true);
});

test('thrown timeout/network/invalid response become bounded infrastructure failures',()=>{
  const t=failures.providerFailureFromThrownV1('TRANSCRIPTION',Object.assign(new Error('aborted'),{name:'AbortError'}),'a');
  const n=failures.providerFailureFromThrownV1('TRANSCRIPTION',new Error('Network request failed'),'b');
  const i=failures.providerFailureFromThrownV1('TEACHER_DECISION',new Error('provider_invalid_response'),'c');
  assert.equal(t.kind,'TIMEOUT');assert.equal(n.kind,'NETWORK');assert.equal(i.kind,'INVALID_RESPONSE');
  assert.doesNotMatch(failures.learnerRecoveryMessageV1(i),/provider|json|schema|OpenAI/i);
});

test('release config requires HTTPS in production and allows local-network HTTP only in development',()=>{
  assert.equal(config.validateCoachEndpointV1(undefined,'PRODUCTION').valid,false);
  assert.equal(config.validateCoachEndpointV1('http://example.com:8787','PRODUCTION').valid,false);
  assert.equal(config.validateCoachEndpointV1('https://api.example.com','PRODUCTION').valid,true);
  assert.equal(config.validateCoachEndpointV1('http://192.168.1.4:8787','DEVELOPMENT').valid,true);
  assert.equal(config.validateCoachEndpointV1('http://example.com:8787','DEVELOPMENT').valid,false);
});

test('operational reliability logging scrubs learner content and secret-like metadata',()=>{
  const safe=logs.safeReliabilityEventV1({event:'REQUEST_FAILED',operation:'TRANSCRIPTION',occurredAt:'2026-08-28T00:00:00Z',metadata:{artifactId:'a1',writing:'private essay',prompt:'private prompt',base64:'AAAA',token:'secret',latencyBucket:3}});
  assert.deepEqual(safe.metadata,{artifactId:'a1',latencyBucket:3});
});

test('policy assigns Teacher provider failure to E fallback and forbids app automatic retry',()=>{
  assert.equal(policy.eotReliabilityPolicyV1.automaticClientRetry,false);
  assert.equal(policy.eotReliabilityPolicyV1.teacherDecisionFailure,'DETERMINISTIC_E_FALLBACK');
  assert.equal(policy.eotReliabilityPolicyV1.invalidResponse,'REJECT_WITHOUT_LEARNER_TRUTH_MUTATION');
});

test('teacher API has explicit shape validation and no automatic retry loop',()=>{
  const src=fs.readFileSync('lib/teacherApi.ts','utf8');
  assert.match(src,/ProviderRequestErrorV1/);
  assert.match(src,/provider_invalid_json/);
  assert.match(src,/provider_invalid_shape/);
  assert.match(src,/automaticRetry:false/);
  assert.doesNotMatch(src,/while\s*\(|for\s*\([^)]*retry|setTimeout\([^)]*=>[^)]*post\(/);
});

test('teacher runtime owns semantic fallback after provider failure rather than V executing model output',()=>{
  const src=fs.readFileSync('src/teacher-runtime/runtime.ts','utf8');
  assert.match(src,/catch\(error\)\{rejected=/);
  assert.match(src,/provider:rejected\.length\?'FALLBACK_AFTER_REJECTION':'DETERMINISTIC_FALLBACK'/);
  assert.match(src,/qualifyInnerTutorProposalV1\(context,input\.event,deterministic\.proposal/);
});

test('server failures are bounded and do not echo provider raw messages to client',async()=>{
  const mod=await import(pathToFileURL(path.resolve(process.cwd(),'coach-server/reliability-v1.mjs')).href);
  const raw=new Error('provider_500:internal:do not expose this secret detail'),f=mod.classifyServerFailureV1(raw);
  assert.deepEqual(f,{status:503,code:'provider_unavailable',retryable:true});
  const writes=[];const res={writeHead(status,headers){writes.push({status,headers});return this},end(body){writes.at(-1).body=body;return this}};
  mod.sendFailureV1(res,raw,'req-1');
  const body=JSON.parse(writes[0].body);
  assert.equal(body.error,'provider_unavailable');assert.equal(body.requestId,'req-1');assert.doesNotMatch(writes[0].body,/do not expose|internal/);
});


test('server model timeout aborts the underlying fetch and retry policy is bounded',()=>{
  const src=fs.readFileSync('coach-server/teacher-agent-v4.mjs','utf8');
  assert.match(src,/new AbortController\(\)/);
  assert.match(src,/signal:controller\.signal/);
  assert.match(src,/model-policy-v1\.mjs/);
  assert.match(src,/retryableProviderResponseV1/);
  assert.match(src,/retries>=AGENT_BUDGETS\.maxRetries/);
  assert.doesNotMatch(src,/Promise\.race\(\[callTeacherV4/);
});

test('server request id is propagated and CORS allows the operational header',()=>{
  const src=fs.readFileSync('coach-server/teacher-server.mjs','utf8');
  assert.match(src,/x-eot-request-id/);
  assert.match(src,/sendFailureV1\(res,error,requestId\)/);
  assert.doesNotMatch(src,/String\(error\?\.message\|\|'unavailable'\).*res\.writeHead/);
});

test('client-side source contains no public provider secret variables',()=>{
  const roots=['app','components','context','hooks','i18n','lib','src'];const bad=[];
  const visit=p=>{for(const e of fs.readdirSync(p,{withFileTypes:true})){const full=path.join(p,e.name);if(e.isDirectory())visit(full);else if(/\.(?:ts|tsx|js|jsx)$/.test(e.name)){const text=fs.readFileSync(full,'utf8');if(/EXPO_PUBLIC_(?:OPENAI|.*(?:SECRET|PRIVATE|TOKEN))\w*/i.test(text))bad.push(full)}}};
  roots.filter(fs.existsSync).forEach(visit);
  assert.deepEqual(bad,[]);
  const teacher=fs.readFileSync('lib/teacherApi.ts','utf8');assert.match(teacher,/EXPO_PUBLIC_COACH_API_URL/);assert.doesNotMatch(teacher,/OPENAI_API_KEY/);
});

test('server provider key remains server-side and local env files are ignored',()=>{
  const server=fs.readFileSync('coach-server/teacher-server.mjs','utf8'),gitignore=fs.readFileSync('.gitignore','utf8');
  assert.match(server,/process\.env\.OPENAI_API_KEY/);assert.match(gitignore,/\.env\*\.local/);
});

test('capability status does not overclaim device or external monitoring acceptance',()=>{
  const by=id=>caps.reliabilityCapabilityStatesV1.find(x=>x.id===id);
  assert.equal(by('V.network-failure').status,'FIRST_PASS');
  assert.equal(by('V.partial-response').status,'FIRST_PASS');
  assert.equal(by('V.crash-recovery').status,'CONTRACT_ONLY');
  assert.equal(by('V.error-monitoring').status,'CONTRACT_ONLY');
  assert.equal(by('V.android-ios').status,'CONTRACT_ONLY');
  assert.equal(by('V.keyboard-ime').status,'CONTRACT_ONLY');
  assert.equal(by('V.safe-area-back').status,'CONTRACT_ONLY');
  assert.equal(by('V.rate-cost-guardrails').status,'CONTRACT_ONLY');
});
