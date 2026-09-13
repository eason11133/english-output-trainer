const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build';
const fromBuild=rel=>require(path.join(__dirname,'..','..',build,rel));
const graph=fromBuild('domain/english/EnglishDomainGraph.js');
const core=fromBuild('domain/english/coreGraph.js');
const capability=fromBuild('domain/english/capabilityModel.js');

const domain=core.coreEnglishDomainPortV2;

test('canonical English graph is valid and immutable enough for one authority',()=>{
  assert.deepEqual(graph.validateEnglishDomainGraphV2(core.coreEnglishDomainGraphV2),[]);
  assert.equal(domain.version,'2.0.0-wave-b');
  assert.ok(core.coreEnglishDomainGraphV2.nodes.length>=20);
});

test('stable target identity resolves legacy aliases without changing canonical targetRef',()=>{
  assert.equal(domain.resolveId('allow-object-infinitive'),'allow-object-infinitive');
  assert.equal(domain.resolveId('allow O to V'),'allow-object-infinitive');
  assert.equal(domain.resolveId('allow'),'word.allow');
});

test('lexical word sense and forms are distinct graph nodes',()=>{
  const sense=domain.relationsFrom('word.allow','HAS_SENSE').map(e=>e.toId);
  const forms=domain.relationsFrom('word.allow','HAS_FORM').map(e=>e.toId);
  assert.deepEqual(sense,['sense.allow.permission']);
  assert.ok(forms.includes('form.allow.base'));
  assert.ok(forms.includes('form.allows.3sg'));
  assert.ok(forms.includes('form.allowed.past-participle'));
});

test('meaning intent is independent from wording and permits multiple realizations',()=>{
  const realizations=domain.realizationsForMeaning('meaning.permission-agent-action').map(node=>node.id);
  assert.ok(realizations.includes('sense.allow.permission'));
  assert.ok(realizations.includes('allow-object-infinitive'));
  assert.ok(realizations.includes('phrase-frame.allow-someone-to'));
  assert.ok(domain.alternatives('allow-object-infinitive').some(node=>node.id==='phrase-frame.allow-someone-to'));
});

test('prerequisite direction is prerequisite -> dependent and cycles are rejected',()=>{
  assert.deepEqual(domain.prerequisites('translation.meaning-segmentation'),['translation.source-meaning']);
  assert.ok(domain.dependents('translation.source-meaning').includes('translation.meaning-segmentation'));
  const p={sourceKind:'CURATED_SYSTEM',sourceId:'test',version:'1',validated:true};
  const node=id=>({id,kind:'GRAMMAR_CONSTRUCTION',area:'GRAMMAR',label:id,aliases:[],facets:['CONSTRUCTION'],registerConstraints:[],genreConstraints:[],writingRelevance:'MEDIUM',translationRelevance:'MEDIUM',readingRelevance:'MEDIUM',provenance:p});
  const bad={version:'1',nodes:[node('a'),node('b')],edges:[
    {id:'ab',fromId:'a',toId:'b',relation:'PREREQUISITE_FOR',provenance:p,confidence:'HIGH'},
    {id:'ba',fromId:'b',toId:'a',relation:'PREREQUISITE_FOR',provenance:p,confidence:'HIGH'},
  ]};
  assert.match(graph.validateEnglishDomainGraphV2(bad).join(' '),/prerequisite cycle/);
});

test('capability claims require a canonical target that affords the claimed facet',()=>{
  const ok=capability.qualifyEnglishCapabilityClaimV2(domain,{targetRef:'allow O to V',facet:'CONSTRUCTION'});
  assert.equal(ok.accepted,true);
  assert.equal(ok.claim.canonicalTargetRef,'allow-object-infinitive');
  const impossible=capability.qualifyEnglishCapabilityClaimV2(domain,{targetRef:'allow-object-infinitive',facet:'ORTHOGRAPHIC_PRODUCTION'});
  assert.equal(impossible.accepted,false);
  const missing=capability.qualifyEnglishCapabilityClaimV2(domain,{targetRef:'made-up-target',facet:'CONSTRUCTION'});
  assert.equal(missing.accepted,false);
});

test('support/context/load/recurrence change observation condition, not capability identity',()=>{
  const q=capability.qualifyEnglishCapabilityClaimV2(domain,{targetRef:'allow-object-infinitive',facet:'CONSTRUCTION'});
  assert.equal(q.accepted,true);
  const a={claim:q.claim,conditions:{support:'EXPLICIT',contextNovelty:'SOURCE',taskLoad:'LOW',recurrence:'FIRST_OBSERVATION'}};
  const b={claim:q.claim,conditions:{support:'NONE',contextNovelty:'CHANGED_CONTEXT',taskLoad:'HIGH',recurrence:'RECURRING'}};
  assert.equal(capability.capabilityClaimKeyV2(a.claim),capability.capabilityClaimKeyV2(b.claim));
  assert.equal(capability.sameCapabilityDifferentConditionV2(a,b),true);
});

test('writing translation and reading are graph-addressable capability areas without learner state',()=>{
  assert.ok(domain.nodesForArea('WRITING').length>=5);
  assert.ok(domain.nodesForArea('TRANSLATION').length>=4);
  assert.ok(domain.nodesForArea('READING').length>=4);
  for(const node of core.coreEnglishDomainGraphV2.nodes){
    assert.equal(Object.hasOwn(node,'mastery'),false);
    assert.equal(Object.hasOwn(node,'learnerState'),false);
    assert.equal(Object.hasOwn(node,'supportDependence'),false);
  }
});

test('canonical graph rejects unvalidated content and alias collisions',()=>{
  const p={sourceKind:'CURATED_SYSTEM',sourceId:'test',version:'1',validated:true};
  const node=(id,alias,validated=true)=>({id,kind:'LEXEME',area:'LEXICAL',label:id,aliases:alias?[alias]:[],facets:['FORM_TO_MEANING'],registerConstraints:[],genreConstraints:[],writingRelevance:'MEDIUM',translationRelevance:'MEDIUM',readingRelevance:'MEDIUM',provenance:{...p,validated}});
  assert.match(graph.validateEnglishDomainGraphV2({version:'1',nodes:[node('a','x',false)],edges:[]}).join(' '),/unvalidated node/);
  assert.match(graph.validateEnglishDomainGraphV2({version:'1',nodes:[node('a','x'),node('b','x')],edges:[]}).join(' '),/multiple nodes/);
});
