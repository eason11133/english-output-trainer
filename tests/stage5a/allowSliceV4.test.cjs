const test = require('node:test');
const assert = require('node:assert/strict');
const {
  allowSliceSource,
  evaluateAllowConstructionV4,
  sourceIntentKeepsAllowTargetV4,
} = require('../../.domain-test-build/application/stage5a/allowSliceV4.js');

const adaptive = () => require('../../.domain-test-build/application/stage5a/adaptiveOutputWorkspaceRuntime.js');
const runtimeCore = () => require('../../.domain-test-build/application/stage4/learnerRuntimeV4.js');
const makeRuntime = () => { const core=runtimeCore(),artifact=core.createOriginalArtifactV4({id:`a-${Math.random()}`,learnerId:'learner',source:'PASTE',mode:'WRITING',pages:[{page:1,mimeType:'text/plain',originalText:allowSliceSource}],submittedAt:new Date().toISOString()});return core.beginStage4RuntimeV4(artifact,[{id:'span',artifactId:artifact.id,region:'LEARNER_WRITING',text:allowSliceSource,confidence:'HIGH',alternatives:[]}],true) };

test('adaptive decision point branches from learner observations instead of a fixed phase sequence', async()=>{
  const a=adaptive();let result=await a.runAdaptiveDecisionPointV4(makeRuntime(),{kind:'INITIAL'},context=>a.controlledAdaptiveDecisionV4('ALLOW_ROLE_MAP',context),true);
  assert.equal(result.runtime.decision.selectedBlockId,'grammar-role-map');
  result=await a.runAdaptiveDecisionPointV4(result.runtime,{kind:'LANGUAGE_OBJECT_PLACED',success:false,payload:{item:'students'}},context=>a.controlledAdaptiveDecisionV4('ALLOW_ROLE_MAP',context),true);
  assert.equal(result.runtime.decision.selectedBlockId,'sentence-builder');
  assert.equal(result.runtime.evidenceCandidates.at(-1).productionMode,'NOT_PRODUCTION');
  result=await a.runAdaptiveDecisionPointV4(result.runtime,{kind:'HELP_REQUESTED',success:false},context=>a.controlledAdaptiveDecisionV4('ALLOW_ROLE_MAP',context),true);
  assert.equal(result.runtime.decision.selectedBlockId,'l1-collision');
  assert.equal(result.runtime.blockEvents.at(-1).type,'HINT_REQUESTED');
  assert.notEqual(result.runtime.evidenceCandidates.at(-1).evidencePolarity,'FAILURE');
});

test('correct and valid-alternative seeded states skip unnecessary teaching',async()=>{const a=adaptive();for(const seed of ['CORRECT_IMMEDIATELY','VALID_ALTERNATIVE']){const result=await a.runAdaptiveDecisionPointV4(makeRuntime(),{kind:'INITIAL'},context=>a.controlledAdaptiveDecisionV4(seed,context),true);assert.equal(result.runtime.decision.selectedBlockId,'continue-source');assert.equal(result.runtime.decision.pedagogicalIntent,'SYSTEM')}});

test('supported success opens a fresh check but unsupported success can stop teaching',async()=>{const a=adaptive();let result=await a.runAdaptiveDecisionPointV4(makeRuntime(),{kind:'INITIAL'},context=>a.controlledAdaptiveDecisionV4('ALLOW_ROLE_MAP',context),true);result=await a.runAdaptiveDecisionPointV4(result.runtime,{kind:'OUTPUT_SUBMITTED',response:'Schools should allow students to use phones for learning.',success:true},context=>a.controlledAdaptiveDecisionV4('ALLOW_ROLE_MAP',context),true);assert.equal(result.runtime.decision.selectedBlockId,'independent-sentence-production');result=await a.runAdaptiveDecisionPointV4(result.runtime,{kind:'OUTPUT_SUBMITTED',response:'Libraries should allow visitors to use computers.',success:true},context=>a.controlledAdaptiveDecisionV4('ALLOW_ROLE_MAP',context),true);assert.equal(result.runtime.decision.selectedBlockId,'continue-source')});

test('help before a wrong production changes support without failure evidence',async()=>{const a=adaptive();let result=await a.runAdaptiveDecisionPointV4(makeRuntime(),{kind:'INITIAL'},context=>a.controlledAdaptiveDecisionV4('STUCK_BEFORE_ATTEMPT',context),true);result=await a.runAdaptiveDecisionPointV4(result.runtime,{kind:'HELP_REQUESTED',success:false},context=>a.controlledAdaptiveDecisionV4('STUCK_BEFORE_ATTEMPT',context),true);assert.equal(result.runtime.decision.selectedBlockId,'sentence-anatomy');assert.equal(result.runtime.blockEvents.at(-1).type,'HINT_REQUESTED');assert.notEqual(result.runtime.evidenceCandidates.at(-1).evidencePolarity,'FAILURE')});

test('different grounded seeds select different decisions for similar source text',async()=>{const a=adaptive(),seeds=['LEXICAL_RETRIEVAL','COMPOSITION_OVERLOAD','STUCK_BEFORE_ATTEMPT','DELAYED_CHANGED_CONTEXT','ALLOW_ROLE_MAP'],expected=['meaning-representation','sentence-anatomy','independent-sentence-production','changed-context-production','grammar-role-map'];for(let i=0;i<seeds.length;i++){const result=await a.runAdaptiveDecisionPointV4(makeRuntime(),{kind:'INITIAL'},context=>a.controlledAdaptiveDecisionV4(seeds[i],context),true);assert.equal(result.runtime.decision.selectedBlockId,expected[i])}});

test('runtime review seeds preserve distinct controlled OriginalArtifact inputs',()=>{const a=adaptive(),pairs=[['CORRECT_IMMEDIATELY','allow students to use'],['VALID_ALTERNATIVE','permit students to use'],['LEXICAL_RETRIEVAL','___ impact'],['COMPOSITION_OVERLOAD','not only reduce'],['STUCK_BEFORE_ATTEMPT','library should ___'],['DELAYED_CHANGED_CONTEXT','company should allow'],['ALLOW_ROLE_MAP','allow to use']];for(const[seed,expected]of pairs)assert.match(a.adaptiveReviewSourceV4(seed),new RegExp(expected,'i'))});

test('bare daily lesson does not silently seed or resume the allow fixture',()=>{const fs=require('node:fs'),path=require('node:path'),source=fs.readFileSync(path.join(__dirname,'../../app/daily-lesson.tsx'),'utf8');assert.doesNotMatch(source,/params\.fixture==='stage5a-allow'\|\|\(!params\.fixture&&!review\)/);assert.match(source,/!value\.trace\.some\(entry=>entry\.fixture\)/)});

test('allow to MUST NOT count as allow O to V production', () => {
  assert.equal(allowSliceSource, 'Schools should allow to use phones for learning.');
  assert.equal(evaluateAllowConstructionV4(allowSliceSource, 'SOURCE'), false);
  assert.equal(evaluateAllowConstructionV4('Schools should allow students use phones.', 'SOURCE'), false);
  assert.equal(adaptive().allowResponseIsSuccessfulV4(allowSliceSource),false);
  assert.equal(adaptive().allowResponseIsSuccessfulV4('Parents should allow their children to choose their hobbies.'),true);
});

test('valid production is evaluated by construction and grounded context', () => {
  assert.equal(evaluateAllowConstructionV4('Parents should allow their children to choose their hobbies.', 'GUIDED'), true);
  assert.equal(evaluateAllowConstructionV4('The company should allow employees to work from home.', 'LIGHT'), true);
  assert.equal(evaluateAllowConstructionV4('The library should allow visitors to use computers.', 'ASSESS'), true);
  assert.equal(evaluateAllowConstructionV4('Schools should allow learners to use phones for learning.', 'SOURCE'), true);
  assert.equal(evaluateAllowConstructionV4('Libraries should allow visitors to use computers.', 'SOURCE'), false);
});

test('source intent confirmation can preserve or invalidate the narrow teaching target', () => {
  assert.equal(sourceIntentKeepsAllowTargetV4('我想說學校允許學生用手機學習'), true);
  assert.equal(sourceIntentKeepsAllowTargetV4('I mean schools allow students to use phones for learning.'), true);
  assert.equal(sourceIntentKeepsAllowTargetV4('我想說手機讓學習更方便'), false);
});

test('Output Workspace review coverage is complete and presentation-only', () => {
  const workspace = require('../../.domain-test-build/application/stage5a/outputWorkspaceVM.js');
  assert.deepEqual(workspace.reviewScenarioOrder, [
    'ALLOW_ROLE_MAP','CORRECT_IMMEDIATELY','VALID_ALTERNATIVE','LEXICAL_RETRIEVAL','TEACHING_SUCCEEDS','TEACHING_CHANGES_REPRESENTATION','COMPOSITION_OVERLOAD','STUCK_BEFORE_ATTEMPT','DELAYED_CHANGED_CONTEXT'
  ]);
  for (const scenario of workspace.reviewScenarioOrder) {
    const vm = workspace.reviewWorkspaceVM(scenario);
    assert.ok(vm.output);
    assert.ok(vm.nextAction);
    assert.doesNotMatch(JSON.stringify(vm), /blockId|targetId|runtimeState|Stage 5|GUIDED\/LIGHT\/NONE/);
  }
});

test('allow role workspace withholds the answer until placement and changes representation semantically', () => {
  const workspace = require('../../.domain-test-build/application/stage5a/outputWorkspaceVM.js');
  const before = workspace.allowWorkspaceVM({output:allowSliceSource,mechanismId:'grammar-role-map',supportLevel:'GUIDED',placed:false,representation:'ORIGINAL',editable:false,inputScope:'CONSTRUCTION'});
  assert.equal(before.output.text, allowSliceSource);
  assert.doesNotMatch(before.output.text, /allow students to use/);
  assert.equal(before.intervention.renderer, 'ROLE_MAP');
  assert.equal(before.intervention.payload.placed, false);
  const changed = workspace.allowWorkspaceVM({output:allowSliceSource,mechanismId:'grammar-role-map',supportLevel:'EXPLICIT',placed:false,representation:'ALTERNATIVE',editable:false,inputScope:'CONSTRUCTION'});
  assert.equal(changed.intervention.renderer, 'ROLE_CONTRAST');
  assert.match(JSON.stringify(changed.intervention.payload), /students/);
});
