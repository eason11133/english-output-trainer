const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const req=relative=>require(path.resolve(__dirname,'../../.domain-test-build',relative));
const {buildCanonicalContentCoverageCensusV1,contentDeliveryUseCasesV1}=req('content/coverageCensus.js');
const {coreEnglishDomainGraphV2}=req('domain/english/coreGraph.js');
const allowed=new Set(['VALIDATED_DELIVERY_AVAILABLE','DATA_CANDIDATE_ONLY','NO_CONTENT','PURPOSE_NOT_SUPPORTED']);
const provenance={sourceId:'oewn-2025',sourceVersion:'v',sourceRecordId:'r',licenseName:'CC',licenseStatus:'VERIFIED_PRODUCTION_ALLOWED',usageScope:'PRODUCTION_OK_WITH_ATTRIBUTION',attributionText:'source',attributionRequired:true};
const result=records=>({records,provenance:records.flatMap(x=>x.provenance?[x.provenance]:[]),sourceVersions:[],licenseStatus:records.length?'ATTRIBUTION_REQUIRED':'NO_USABLE_RESULTS',qualitySignals:[],retrievalReason:'bounded'});
const corpus={query:async query=>query.requestedResourceType==='MORPHOLOGY'&&query.lemma==='walk'?result([{lemma:'walk',form:'walks',features:['V','PRS','3','SG'],provenance},{lemma:'walk',form:'walked',features:['V','PST'],provenance}]):query.requestedResourceType==='LEMMA_SENSES'&&query.senseId?result([{senseId:query.senseId,pos:'v',glosses:['permit'],relations:[],provenance:{...provenance,sourceRecordId:query.senseId}}]):query.requestedResourceType==='EXAMPLES'&&query.lemma==='allow'?result([{exampleId:'e',text:'Libraries allow visitors.',language:'eng',lemma:'allow',pos:'v',synsetId:'s',learnerDisplayEligible:true,provenance}]):result([]),lookupLemma:async()=>({lemma:'',senses:[],morphology:[],frequency:[]}),lookupMorphology:async()=>[],lookupSentencePairs:async()=>[]};

test('census covers every canonical node, facet and delivery use case with canonical statuses',async()=>{
  const census=await buildCanonicalContentCoverageCensusV1(corpus);
  assert.equal(census.nodeCount,23);assert.equal(census.targetFacetCount,census.rows.length);assert.deepEqual(census.useCases,contentDeliveryUseCasesV1);
  for(const row of census.rows){assert.equal(row.cells.length,6);for(const cell of row.cells)assert.ok(allowed.has(cell.status))}
});

test('23-node graph differs from the governed 22-node set only by lexical.contextual-fit',()=>{
  const current=new Set(coreEnglishDomainGraphV2.nodes.map(node=>node.id));
  const governed22=new Set(['word.allow','sense.allow.permission','form.allow.base','form.allows.3sg','form.allowed.past-participle','morph.regular-verb-ed-s','meaning.permission-agent-action','allow-object-infinitive','phrase-frame.allow-someone-to','writing.purpose-audience','writing.idea-reasoning','writing.organization-cohesion','writing.sentence-realization','writing.revision','translation.source-meaning','translation.meaning-segmentation','translation.meaning-to-english','translation.naturalness-precision','reading.meaning-decomposition','reading.reference-tracking','reading.logic-structure','reading.inference']);
  assert.equal(governed22.size,22);
  assert.deepEqual([...current].filter(id=>!governed22.has(id)),['lexical.contextual-fit']);
  assert.deepEqual([...governed22].filter(id=>!current.has(id)),[]);
});

test('census distinguishes validated packs, bound data-only, unbound raw data and unimplemented purposes',async()=>{
  const census=await buildCanonicalContentCoverageCensusV1(corpus),cell=(target,facet,useCase)=>census.rows.find(row=>row.targetRef===target&&row.facet===facet).cells.find(value=>value.useCase===useCase);
  assert.equal(cell('writing.sentence-realization','CONSTRUCTION','FRESH_CHECK').gapClass,'VALIDATED_DELIVERY_AVAILABLE');
  assert.equal(cell('word.allow','FORM_RECOGNITION','TEACH').gapClass,'SEMANTICALLY_BOUND_DATA_CANDIDATE_ONLY');
  assert.equal(cell('sense.allow.permission','FORM_TO_MEANING','TEACH').gapClass,'SEMANTICALLY_BOUND_DATA_CANDIDATE_ONLY');
  assert.equal(cell('writing.sentence-realization','CONSTRUCTION','ACTIVE_PRACTICE').gapClass,'VALIDATED_DELIVERY_AVAILABLE');
  assert.equal(census.schemaVersion,2);assert.equal(census.artifactStatus,'CANONICAL_SEMANTIC_BINDING_CENSUS');
});
