import type {EnglishCorpusRetrievalPortV1} from '../domain/english/corpusRetrieval';
import type {CorpusDataQueryV1,CorpusDataResultV1,CorpusExampleV1,CorpusLemmaLookupV1,CorpusMorphologyV1,CorpusProvenanceV1,CorpusRecordEligibilityV1,CorpusSenseV1,CorpusSentencePairV1,CorpusSentenceV1,CorpusUsageContext,CorpusUsageScope} from './dataCorpusTypes';

export interface CorpusSqlReadDatabaseV1 {getAllAsync<T>(sql:string,...params:unknown[]):Promise<T[]>}
const MAX=50,norm=(v:string)=>v.normalize('NFKC').trim().toLocaleLowerCase('en');
type Row=Record<string,unknown>;

function sourceEligibilitySql(context:CorpusUsageContext){
  return context==='INTERNAL_RESEARCH'
    ?"s.internal_use_allowed=1"
    :"s.display_allowed=1 AND s.generation_allowed=1 AND s.license_status IN ('VERIFIED_PRODUCTION_ALLOWED','ATTRIBUTION_REQUIRED') AND s.usage_scope NOT IN ('RESEARCH_ONLY','DISCOVERY_ONLY','UNKNOWN','QUARANTINED','REJECTED')";
}
function sourcePolicySql(query:CorpusDataQueryV1){
  const parts:string[]=[],params:unknown[]=[];
  if(query.sourcePolicy?.includeSourceIds?.length){parts.push(`s.source_id IN (${query.sourcePolicy.includeSourceIds.map(()=>'?').join(',')})`);params.push(...query.sourcePolicy.includeSourceIds)}
  if(query.sourcePolicy?.excludeSourceIds?.length){parts.push(`s.source_id NOT IN (${query.sourcePolicy.excludeSourceIds.map(()=>'?').join(',')})`);params.push(...query.sourcePolicy.excludeSourceIds)}
  return {sql:parts.length?` AND ${parts.join(' AND ')}`:'',params};
}
function provenance(row:Row):CorpusProvenanceV1{
  return {
    sourceId:String(row.sourceId),
    sourceVersion:String(row.sourceVersion),
    sourceRecordId:String(row.sourceRecordId),
    licenseName:String(row.licenseName),
    licenseStatus:row.licenseStatus as CorpusProvenanceV1['licenseStatus'],
    usageScope:row.usageScope as CorpusProvenanceV1['usageScope'],
    attributionText:String(row.attributionText??''),
    attributionRequired:Boolean(row.attributionRequired),
  };
}
function uniqueProvenance(items:readonly CorpusProvenanceV1[]){
  return [...new Map(items.map(item=>[`${item.sourceId}|${item.sourceVersion}|${item.sourceRecordId}`,item])).values()];
}
function resultMeta(prov:readonly CorpusProvenanceV1[],reason:string):Omit<CorpusDataResultV1<unknown>,'records'>{
  const p=uniqueProvenance(prov);
  return {
    provenance:p,
    sourceVersions:[...new Map(p.map(x=>[`${x.sourceId}|${x.sourceVersion}`,{sourceId:x.sourceId,version:x.sourceVersion}])).values()],
    licenseStatus:p.length?(p.some(x=>x.attributionRequired)?'ATTRIBUTION_REQUIRED':'ALL_ALLOWED'):'NO_USABLE_RESULTS',
    qualitySignals:[],
    retrievalReason:reason,
  };
}
function scopeForEligibility(eligibility:CorpusRecordEligibilityV1,sourceScope:CorpusUsageScope):CorpusUsageScope{
  if(eligibility==='PRODUCTION_ALLOWED')return sourceScope;
  if(eligibility==='ATTRIBUTION_REQUIRED')return 'PRODUCTION_OK_WITH_ATTRIBUTION';
  if(eligibility==='INTERNAL_ONLY')return 'RESEARCH_ONLY';
  if(eligibility==='QUARANTINED')return 'QUARANTINED';
  if(eligibility==='REJECTED')return 'REJECTED';
  return 'UNKNOWN';
}
function sentenceProvenance(row:Row,prefix:'english'|'chinese'):CorpusProvenanceV1{
  const eligibility=row[`${prefix}Eligibility`] as CorpusRecordEligibilityV1;
  return {
    sourceId:String(row[`${prefix}SourceId`]??row.sourceId),
    sourceVersion:String(row[`${prefix}SourceVersion`]??row.sourceVersion),
    sourceRecordId:String(row[`${prefix}SourceSentenceId`]??row[`${prefix}Id`]),
    licenseName:String(row[`${prefix}License`]??row.licenseName),
    licenseStatus:row[`${prefix}LicenseStatus`] as CorpusProvenanceV1['licenseStatus'],
    usageScope:scopeForEligibility(eligibility,row.usageScope as CorpusUsageScope),
    attributionText:String(row[`${prefix}Attribution`]??''),
    attributionRequired:Boolean(row[`${prefix}AttributionRequired`]),
  };
}
function sentenceFromRow(row:Row,prefix:'english'|'chinese'):CorpusSentenceV1{
  const prov=sentenceProvenance(row,prefix);
  return {
    id:String(row[`${prefix}Id`]),
    language:prefix==='english'?'eng':'cmn',
    text:String(row[prefix]),
    contributor:row[`${prefix}Contributor`]==null?undefined:String(row[`${prefix}Contributor`]),
    recordLicense:String(row[`${prefix}License`]??''),
    eligibility:row[`${prefix}Eligibility`] as CorpusRecordEligibilityV1,
    provenance:prov,
  };
}

export class SqliteEnglishCorpusRetrievalPortV1 implements EnglishCorpusRetrievalPortV1 {
  constructor(private readonly db:CorpusSqlReadDatabaseV1){}

  async query<T=CorpusLemmaLookupV1|CorpusMorphologyV1|CorpusSentencePairV1|CorpusExampleV1>(query:CorpusDataQueryV1):Promise<CorpusDataResultV1<T>>{
    const limit=Math.max(1,Math.min(MAX,query.limit||20));
    const target=norm(query.lemma??query.surfaceForm??query.targetRefs?.[0]??'');
    if(!target)return {records:[],provenance:[],sourceVersions:[],licenseStatus:'NO_USABLE_RESULTS',qualitySignals:['EMPTY_QUERY'],retrievalReason:'empty bounded target'};
    const sourceRule=sourceEligibilitySql(query.usagePolicy),sourceFilter=sourcePolicySql(query);

    if(query.requestedResourceType==='MORPHOLOGY'){
      const rows=await this.db.getAllAsync<Row>(
        `SELECT m.lemma,m.form,m.features,m.source_record_id sourceRecordId,s.source_id sourceId,s.version sourceVersion,s.license_name licenseName,s.license_status licenseStatus,s.usage_scope usageScope,s.attribution_text attributionText,s.attribution_required attributionRequired FROM morphology m JOIN source_registry s ON s.source_id=m.source_id WHERE (m.normalized_form=? OR m.normalized_lemma=?) AND ${sourceRule}${sourceFilter.sql} LIMIT ?`,
        target,target,...sourceFilter.params,limit,
      );
      const records:CorpusMorphologyV1[]=rows.map(row=>({lemma:String(row.lemma),form:String(row.form),features:String(row.features).split(';').filter(Boolean),provenance:provenance(row)}));
      const meta=resultMeta(records.map(x=>x.provenance),'bounded MORPHOLOGY; eligibility filtered before delivery');
      return {records:records as T[],...meta};
    }

    if(query.requestedResourceType==='EXAMPLES'){
      const rows=await this.db.getAllAsync<Row>(
        `SELECT e.example_id exampleId,e.text,e.normalized_text normalizedText,e.source_record_id sourceRecordId,se.synset_id synsetId,l.lemma,l.pos,s.source_id sourceId,s.version sourceVersion,s.license_name licenseName,s.license_status licenseStatus,s.usage_scope usageScope,s.attribution_text attributionText,s.attribution_required attributionRequired FROM examples e JOIN senses se ON se.synset_id=e.synset_id AND se.source_id=e.source_id JOIN lexemes l ON l.lexeme_id=se.lexeme_id JOIN source_registry s ON s.source_id=e.source_id WHERE l.normalized_lemma=? AND (? IS NULL OR l.pos=?) AND ${sourceRule}${sourceFilter.sql} GROUP BY e.example_id LIMIT ?`,
        target,query.pos??null,query.pos??null,...sourceFilter.params,limit,
      );
      const records:CorpusExampleV1[]=rows.map(row=>{
        const normalizedText=String(row.normalizedText??'');
        const start=normalizedText.indexOf(target);
        return {exampleId:String(row.exampleId),text:String(row.text),language:'eng',lemma:String(row.lemma),pos:String(row.pos),synsetId:String(row.synsetId),targetOccurrence:start>=0?{start,length:target.length}:undefined,learnerDisplayEligible:true,provenance:provenance(row)};
      });
      const meta=resultMeta(records.map(x=>x.provenance),'bounded EXAMPLES; eligibility filtered before delivery');
      return {records:records as T[],...meta};
    }

    if(query.requestedResourceType==='SENTENCE_PAIRS'){
      const pairRule=query.usagePolicy==='INTERNAL_RESEARCH'
        ?"ep.usage_eligibility<>'REJECTED' AND zp.usage_eligibility<>'REJECTED'"
        :"ep.usage_eligibility IN ('PRODUCTION_ALLOWED','ATTRIBUTION_REQUIRED') AND zp.usage_eligibility IN ('PRODUCTION_ALLOWED','ATTRIBUTION_REQUIRED') AND ep.provenance_complete=1 AND zp.provenance_complete=1 AND ep.source_integrity_valid=1 AND zp.source_integrity_valid=1 AND ep.record_quality_valid=1 AND zp.record_quality_valid=1";
      const fts=`"${target.replaceAll('"','""')}"`;
      const rows=await this.db.getAllAsync<Row>(
        `SELECT e.sentence_id englishId,e.text english,ep.source_id englishSourceId,ep.source_version englishSourceVersion,ep.source_sentence_id englishSourceSentenceId,ep.contributor englishContributor,ep.record_license englishLicense,ep.license_status englishLicenseStatus,ep.attribution_text englishAttribution,ep.attribution_required englishAttributionRequired,ep.usage_eligibility englishEligibility,z.sentence_id chineseId,z.text chinese,zp.source_id chineseSourceId,zp.source_version chineseSourceVersion,zp.source_sentence_id chineseSourceSentenceId,zp.contributor chineseContributor,zp.record_license chineseLicense,zp.license_status chineseLicenseStatus,zp.attribution_text chineseAttribution,zp.attribution_required chineseAttributionRequired,zp.usage_eligibility chineseEligibility,tp.source_record_id sourceRecordId,s.source_id sourceId,s.version sourceVersion,s.license_name licenseName,s.license_status licenseStatus,s.usage_scope usageScope,s.attribution_text attributionText,s.attribution_required attributionRequired FROM translation_pairs tp JOIN sentences e ON e.sentence_id=tp.from_sentence_id JOIN sentences z ON z.sentence_id=tp.to_sentence_id JOIN sentence_provenance ep ON ep.sentence_id=e.sentence_id JOIN sentence_provenance zp ON zp.sentence_id=z.sentence_id JOIN source_registry s ON s.source_id=tp.source_id WHERE e.language='eng' AND z.language='cmn' AND (e.sentence_id IN (SELECT sentence_id FROM sentences_fts WHERE normalized_text MATCH ?) OR z.sentence_id IN (SELECT sentence_id FROM sentences_fts WHERE normalized_text MATCH ?)) AND ${sourceRule} AND ${pairRule}${sourceFilter.sql} GROUP BY e.normalized_text,z.normalized_text LIMIT ?`,
        fts,fts,...sourceFilter.params,limit,
      );
      const records:CorpusSentencePairV1[]=rows.map(row=>({english:sentenceFromRow(row,'english'),chinese:sentenceFromRow(row,'chinese'),pairProvenance:provenance(row)}));
      const prov=records.flatMap(x=>[x.pairProvenance,x.english.provenance,x.chinese.provenance]);
      const meta=resultMeta(prov,'bounded SENTENCE_PAIRS; pair-side provenance and eligibility filtered before delivery');
      return {records:records as T[],...meta};
    }

    const rows=await this.db.getAllAsync<Row>(
      `SELECT l.lemma,l.pos,se.sense_id senseId,se.synset_id synsetId,se.glosses_json glosses,se.source_record_id sourceRecordId,s.source_id sourceId,s.version sourceVersion,s.license_name licenseName,s.license_status licenseStatus,s.usage_scope usageScope,s.attribution_text attributionText,s.attribution_required attributionRequired FROM lexemes l JOIN senses se ON se.lexeme_id=l.lexeme_id JOIN source_registry s ON s.source_id=l.source_id WHERE l.normalized_lemma=? AND (? IS NULL OR l.pos=?) AND ${sourceRule}${sourceFilter.sql} LIMIT ?`,
      target,query.pos??null,query.pos??null,...sourceFilter.params,limit,
    );
    const records:CorpusSenseV1[]=[];
    for(const row of rows){
      const relations=await this.db.getAllAsync<{type:string;targetId:string}>('SELECT relation_type type,to_record_id targetId FROM lexical_relations WHERE from_record_id=? AND source_id=? LIMIT 30',String(row.synsetId),String(row.sourceId));
      let glosses:readonly string[]=[];
      try{const parsed=JSON.parse(String(row.glosses??'[]'));glosses=Array.isArray(parsed)?parsed.map(String):[]}catch{glosses=[]}
      records.push({senseId:String(row.senseId),pos:String(row.pos),glosses,relations:relations.map(x=>({type:String(x.type),targetId:String(x.targetId)})),provenance:provenance(row)});
    }
    const meta=resultMeta(records.map(x=>x.provenance),'bounded LEMMA_SENSES; eligibility filtered before delivery');
    return {records:records as T[],...meta};
  }

  async lookupLemma(lemma:string,context:CorpusUsageContext):Promise<CorpusLemmaLookupV1>{
    const senses=await this.query<CorpusSenseV1>({requestedResourceType:'LEMMA_SENSES',lemma,usagePolicy:context,limit:MAX});
    const morphology=await this.lookupMorphology(lemma,context);
    return {lemma,senses:senses.records,morphology,frequency:[]};
  }
  async lookupMorphology(form:string,context:CorpusUsageContext):Promise<readonly CorpusMorphologyV1[]>{
    return (await this.query<CorpusMorphologyV1>({requestedResourceType:'MORPHOLOGY',surfaceForm:form,usagePolicy:context,limit:MAX})).records;
  }
  async lookupSentencePairs(query:string,context:CorpusUsageContext,limit=20):Promise<readonly CorpusSentencePairV1[]>{
    return (await this.query<CorpusSentencePairV1>({requestedResourceType:'SENTENCE_PAIRS',targetRefs:[query],usagePolicy:context,limit})).records;
  }
}
