const test=require('node:test');const assert=require('node:assert/strict');const path=require('node:path');
const build=process.env.EOT_DOMAIN_TEST_BUILD||'.domain-test-build-data-adapter';
const {SqliteEnglishCorpusRetrievalPortV1}=require(path.resolve(process.cwd(),build,'persistence/sqliteCorpusRetrieval.js'));

const sourceBase={sourceId:'oewn-2025',sourceVersion:'2025-edition',sourceRecordId:'record-1',licenseName:'CC BY 4.0',licenseStatus:'ATTRIBUTION_REQUIRED',usageScope:'PRODUCTION_OK_WITH_ATTRIBUTION',attributionText:'OEWN attribution',attributionRequired:1};

class FakeDb{
  async getAllAsync(sql,...params){
    if(sql.includes('FROM lexical_relations'))return [{type:'derivation',targetId:'target-synset'}];
    if(sql.includes('FROM examples e'))return [{exampleId:'ex-1',text:'Prices increase quickly.',normalizedText:'prices increase quickly.',synsetId:'syn-1',lemma:'increase',pos:'v',...sourceBase}];
    if(sql.includes('FROM morphology m'))return [{lemma:'go',form:'went',features:'V;PST',...sourceBase,sourceRecordId:'morph-1'}];
    if(sql.includes('FROM translation_pairs tp'))return [{
      englishId:'e-1',english:'I like this.',englishSourceId:'tatoeba',englishSourceVersion:'2026-08-22',englishSourceSentenceId:'1',englishContributor:'alice',englishLicense:'CC BY 2.0 FR',englishLicenseStatus:'ATTRIBUTION_REQUIRED',englishAttribution:'alice / Tatoeba',englishAttributionRequired:1,englishEligibility:'ATTRIBUTION_REQUIRED',
      chineseId:'z-1',chinese:'我喜歡這個。',chineseSourceId:'tatoeba',chineseSourceVersion:'2026-08-22',chineseSourceSentenceId:'2',chineseContributor:'bob',chineseLicense:'CC BY 2.0 FR',chineseLicenseStatus:'ATTRIBUTION_REQUIRED',chineseAttribution:'bob / Tatoeba',chineseAttributionRequired:1,chineseEligibility:'ATTRIBUTION_REQUIRED',
      sourceId:'tatoeba',sourceVersion:'2026-08-22',sourceRecordId:'pair-1',licenseName:'CC BY 2.0 FR',licenseStatus:'ATTRIBUTION_REQUIRED',usageScope:'PRODUCTION_OK_WITH_ATTRIBUTION',attributionText:'Tatoeba',attributionRequired:1,
    }];
    if(sql.includes('FROM lexemes l JOIN senses'))return [{lemma:'increase',pos:'v',senseId:'sense-1',synsetId:'syn-1',glosses:'["become greater"]',...sourceBase}];
    throw new Error('unexpected SQL: '+sql.slice(0,100));
  }
}
const port=()=>new SqliteEnglishCorpusRetrievalPortV1(new FakeDb());

test('production adapter returns parsed nested lemma senses and morphology',async()=>{
  const value=await port().lookupLemma('increase','LEARNER_PRODUCTION');
  assert.equal(value.senses[0].senseId,'sense-1');
  assert.deepEqual(value.senses[0].glosses,['become greater']);
  assert.deepEqual(value.senses[0].relations,[{type:'derivation',targetId:'target-synset'}]);
  assert.equal(value.senses[0].provenance.sourceId,'oewn-2025');
});

test('production adapter has a real EXAMPLES branch with learner-display metadata',async()=>{
  const result=await port().query({requestedResourceType:'EXAMPLES',lemma:'increase',usagePolicy:'LEARNER_PRODUCTION',limit:5});
  assert.equal(result.records[0].exampleId,'ex-1');
  assert.equal(result.records[0].learnerDisplayEligible,true);
  assert.deepEqual(result.records[0].targetOccurrence,{start:7,length:8});
  assert.equal(result.records[0].provenance.attributionRequired,true);
});

test('production adapter maps sentence pairs into nested independently attributed sentences',async()=>{
  const pairs=await port().lookupSentencePairs('like','LEARNER_PRODUCTION',5);
  assert.equal(pairs[0].english.text,'I like this.');
  assert.equal(pairs[0].chinese.text,'我喜歡這個。');
  assert.equal(pairs[0].english.contributor,'alice');
  assert.equal(pairs[0].chinese.contributor,'bob');
  assert.equal(pairs[0].english.provenance.sourceRecordId,'1');
  assert.equal(pairs[0].chinese.provenance.sourceRecordId,'2');
  assert.equal(pairs[0].pairProvenance.sourceRecordId,'pair-1');
});

test('production adapter keeps bounded empty-query behavior',async()=>{
  const result=await port().query({requestedResourceType:'EXAMPLES',lemma:'   ',usagePolicy:'LEARNER_PRODUCTION',limit:999});
  assert.deepEqual(result.records,[]);
  assert.deepEqual(result.qualitySignals,['EMPTY_QUERY']);
});
