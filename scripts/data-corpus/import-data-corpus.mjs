import {DatabaseSync} from 'node:sqlite';
import {createHash,randomUUID} from 'node:crypto';
import {createReadStream,readFileSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createInterface} from 'node:readline';

const root=resolve(import.meta.dirname,'../..');
const dbPath=resolve(root,process.env.EOT_CORPUS_DB??'.data-cache/eot-corpus.sqlite');
const raw=resolve(root,'.data-cache/raw'),expanded=resolve(root,'.data-cache/expanded');
const manifestPath=resolve(root,'data/sources/sources.manifest.json'),manifestBytes=readFileSync(manifestPath),manifest=JSON.parse(manifestBytes);
const db=new DatabaseSync(dbPath); db.exec(readFileSync(resolve(root,'data/corpus/001_data_corpus.sql'),'utf8'));
const ensureColumn=(table,name,definition)=>{if(!db.prepare(`PRAGMA table_info(${table})`).all().some(column=>column.name===name))db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`)};
for(const [name,definition] of [['license_status',"TEXT NOT NULL DEFAULT 'LICENSE_UNKNOWN'"],['display_allowed','INTEGER NOT NULL DEFAULT 0'],['generation_allowed','INTEGER NOT NULL DEFAULT 0'],['internal_use_allowed','INTEGER NOT NULL DEFAULT 0'],['attribution_required','INTEGER NOT NULL DEFAULT 0'],['license_verified_at','TEXT'],['license_evidence_url','TEXT']])ensureColumn('source_registry',name,definition);
for(const [name,definition] of [['parser_version',"TEXT NOT NULL DEFAULT 'unknown'"],['normalizer_version',"TEXT NOT NULL DEFAULT 'unknown'"],['manifest_checksum','TEXT'],['entity_counts_json',"TEXT NOT NULL DEFAULT '{}'"],['source_drift_status',"TEXT NOT NULL DEFAULT 'MATCHED'"]])ensureColumn('import_runs',name,definition);
db.prepare("UPDATE import_runs SET completed_at=?,status='FAILED',warnings=? WHERE status='RUNNING'").run(new Date().toISOString(),JSON.stringify(['interrupted before completion; safe rerun recovered this ledger row']));
const digest=v=>createHash('sha256').update(v).digest('hex');
const norm=v=>v.normalize('NFKC').trim().toLocaleLowerCase('en');
const fileHash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');

const sourceInsert=db.prepare(`INSERT INTO source_registry(source_id,canonical_name,source_kind,origin_url,publisher_owner,version,retrieved_at,checksum,license_name,license_url,usage_scope,attribution_text,share_alike_required,redistribution_allowed,commercial_use_status,raw_retention_policy,notes,license_status,display_allowed,generation_allowed,internal_use_allowed,attribution_required,license_verified_at,license_evidence_url) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(source_id) DO UPDATE SET canonical_name=excluded.canonical_name,source_kind=excluded.source_kind,origin_url=excluded.origin_url,publisher_owner=excluded.publisher_owner,version=excluded.version,retrieved_at=excluded.retrieved_at,checksum=excluded.checksum,license_name=excluded.license_name,license_url=excluded.license_url,usage_scope=excluded.usage_scope,attribution_text=excluded.attribution_text,share_alike_required=excluded.share_alike_required,redistribution_allowed=excluded.redistribution_allowed,commercial_use_status=excluded.commercial_use_status,raw_retention_policy=excluded.raw_retention_policy,notes=excluded.notes,license_status=excluded.license_status,display_allowed=excluded.display_allowed,generation_allowed=excluded.generation_allowed,internal_use_allowed=excluded.internal_use_allowed,attribution_required=excluded.attribution_required,license_verified_at=excluded.license_verified_at,license_evidence_url=excluded.license_evidence_url`);
for(const s of manifest.sources)sourceInsert.run(s.source_id,s.canonical_name,s.source_kind,s.origin_url,s.publisher_owner,s.version,s.retrieved_at,s.checksum_sha256??null,s.license_name,s.license_url,s.usage_scope,s.attribution_text,Number(s.share_alike_required),Number(s.redistribution_allowed),s.commercial_use_status,s.raw_retention_policy,s.notes??null,s.license_status??'LICENSE_UNKNOWN',Number(s.display_allowed),Number(s.generation_allowed),Number(s.internal_use_allowed),Number(s.attribution_required),s.license_verified_at??null,s.license_evidence_url??null);
const sourceById=id=>manifest.sources.find(s=>s.source_id===id);
const manifestChecksum=digest(manifestBytes),IMPORTER_VERSION='data-major-wave-v2',PARSER_VERSION='data-parsers-v2',NORMALIZER_VERSION='nfkc-lower-en-v1';
const runStart=(source,checksum)=>{const id=randomUUID();db.prepare('INSERT INTO import_runs(import_run_id,source_id,source_version,started_at,importer_version,raw_checksum,status,parser_version,normalizer_version,manifest_checksum,source_drift_status) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(id,source.source_id,source.version,new Date().toISOString(),IMPORTER_VERSION,checksum,'RUNNING',PARSER_VERSION,NORMALIZER_VERSION,manifestChecksum,checksum===source.checksum_sha256?'MATCHED':'DRIFTED');return id};
const runEnd=(id,c,warnings=[])=>db.prepare('UPDATE import_runs SET completed_at=?,rows_read=?,rows_accepted=?,rows_rejected=?,rows_deduped=?,warnings=?,entity_counts_json=?,status=? WHERE import_run_id=?').run(new Date().toISOString(),c.read,c.accepted,c.rejected,c.deduped,JSON.stringify(warnings),JSON.stringify(c.entities),'COMPLETED',id);
const addRaw=(source,path,type,checksum,range='FULL')=>{const id=`${source.source_id}:${digest(path).slice(0,12)}`;db.prepare('INSERT OR REPLACE INTO raw_assets VALUES(?,?,?,?,?,?,?,0)').run(id,source.source_id,path,type,checksum,range,source.usage_scope==='USER_PRIVATE'?'USER_PRIVATE':'PUBLIC');return id};
const count=()=>({read:0,accepted:0,rejected:0,deduped:0,entities:{}});
const changed=(c,entity,result)=>{c.entities[entity]??={accepted:0,deduped:0};if(result.changes){c.accepted++;c.entities[entity].accepted++}else{c.deduped++;c.entities[entity].deduped++}};
const assertVersionCompatible=(source,tables)=>{for(const table of tables){const conflict=db.prepare(`SELECT source_version FROM ${table} WHERE source_id=? AND source_version<>? LIMIT 1`).get(source.source_id,source.version);if(conflict)throw new Error(`source-version conflict for ${source.source_id} in ${table}: existing=${conflict.source_version}, incoming=${source.version}; use a new versioned source_id/migration`)}};

function importOewn(){
  const source=sourceById('oewn-2025'),zip=join(raw,'english-wordnet-2025-json.zip'),checksum=fileHash(zip); if(checksum!==source.checksum_sha256)throw new Error('OEWN checksum drift');
  assertVersionCompatible(source,['lexemes','senses','lexical_relations','examples']);
  const run=runStart(source,checksum),c=count(); addRaw(source,'.data-cache/raw/english-wordnet-2025-json.zip','application/zip',checksum);
  const lex=db.prepare('INSERT OR IGNORE INTO lexemes VALUES(?,?,?,?,?,?,?)'),sense=db.prepare('INSERT OR IGNORE INTO senses VALUES(?,?,?,?,?,?,?)');
  db.exec('BEGIN');
  for(const name of readdirSync(join(expanded,'oewn')).filter(n=>n.startsWith('entries-')&&n.endsWith('.json')).sort()){
    const entries=JSON.parse(readFileSync(join(expanded,'oewn',name),'utf8'));
    for(const [lemma,byPos] of Object.entries(entries))for(const [pos,data] of Object.entries(byPos)){
      const lexemeId=`oewn:${digest(`${lemma}\0${pos}`).slice(0,24)}`; c.read++;
      changed(c,'lexemes',lex.run(lexemeId,lemma,norm(lemma),pos,source.source_id,source.version,`${name}:${lemma}:${pos}`));
      for(const item of data.sense??[])changed(c,'senses',sense.run(`oewn:${item.id}`,lexemeId,item.synset,'[]',source.source_id,source.version,item.id));
    }
  }
  const updateGloss=db.prepare('UPDATE senses SET glosses_json=? WHERE synset_id=? AND source_id=?'),rel=db.prepare('INSERT OR IGNORE INTO lexical_relations VALUES(?,?,?,?,?,?)'),example=db.prepare('INSERT OR IGNORE INTO examples VALUES(?,?,?,?,?,?,?)');
  for(const name of readdirSync(join(expanded,'oewn')).filter(n=>!n.startsWith('entries-')&&n.endsWith('.json')).sort()){
    const synsets=JSON.parse(readFileSync(join(expanded,'oewn',name),'utf8'));
    for(const [sid,data] of Object.entries(synsets)){
      updateGloss.run(JSON.stringify(data.definition??[]),sid,source.source_id);
      for(const value of data.example??[]){const text=typeof value==='string'?value:value?.text;if(typeof text==='string'&&text.trim())changed(c,'examples',example.run(`oewn:${digest(`${sid}|${text}`).slice(0,32)}`,sid,text,norm(text),source.source_id,source.version,`${sid}:example`));}
      for(const [type,targets] of Object.entries(data))if(Array.isArray(targets)&&!['definition','example','members'].includes(type))for(const target of targets)if(typeof target==='string')changed(c,'lexical_relations',rel.run(`oewn:${digest(`${sid}|${type}|${target}`).slice(0,32)}`,sid,type,target,source.source_id,source.version));
    }
  }
  db.exec('COMMIT');runEnd(run,c);return c;
}

async function importUnimorph(){
  const source=sourceById('unimorph-eng-master-20260827'),path=join(raw,'unimorph-eng.tsv'),checksum=fileHash(path);if(checksum!==source.checksum_sha256)throw new Error('UniMorph checksum drift');
  assertVersionCompatible(source,['morphology']);
  const run=runStart(source,checksum),c=count();addRaw(source,'.data-cache/raw/unimorph-eng.tsv','text/tab-separated-values',checksum);
  const stmt=db.prepare('INSERT OR IGNORE INTO morphology VALUES(?,?,?,?,?,?,?,?,?)'); db.exec('BEGIN');
  for await(const line of createInterface({input:createReadStream(path),crlfDelay:Infinity})){
    c.read++;const parts=line.split('\t');if(parts.length!==3||!parts[0]||!parts[1]||!parts[2]||!parts[2].split(';').every(x=>/^[A-Z0-9.]+$/.test(x))){c.rejected++;continue}
    const [lemma,form,features]=parts,id=`unimorph:${digest(`${norm(lemma)}\0${norm(form)}\0${features}`).slice(0,32)}`;
    changed(c,'morphology',stmt.run(id,lemma,norm(lemma),form,norm(form),features,source.source_id,source.version,`line:${c.read}`));
  }
  db.exec('COMMIT');runEnd(run,c,c.rejected?[`${c.rejected} malformed rows rejected`]:[]);return c;
}

async function readSelectedSentences(path,wanted,out){for await(const line of createInterface({input:createReadStream(path),crlfDelay:Infinity})){const [id,lang,...text]=line.split('\t');if(wanted.has(id))out.set(id,{lang,text:text.join('\t')});}}
async function readSelectedDetailed(path,wanted,out){for await(const line of createInterface({input:createReadStream(path),crlfDelay:Infinity})){const [id,lang,text,contributor,dateAdded,dateModified]=line.split('\t');if(wanted.has(id))out.set(id,{lang,text,contributor,dateAdded,dateModified});}}
async function readCc0Ids(path,wanted,out){for await(const line of createInterface({input:createReadStream(path),crlfDelay:Infinity})){const [id]=line.split('\t');if(wanted.has(id))out.add(id);}}
async function importTatoeba(limit=5000){
  const source=sourceById('tatoeba-eng-cmn-20260822'),linkRaw=join(raw,'tatoeba-eng-cmn_links.tsv.bz2'),checksum=fileHash(linkRaw);if(checksum!==source.checksum_sha256)throw new Error('Tatoeba checksum drift');
  assertVersionCompatible(source,['sentences','translation_pairs','sentence_provenance']);
  const run=runStart(source,checksum),c=count(),pairs=[];addRaw(source,'.data-cache/raw/tatoeba-eng-cmn_links.tsv.bz2','application/x-bzip2',checksum,`FIRST_${limit}_PAIRS`);
  const assetByRole=new Map((source.provenance_assets??[]).map(x=>[x.role,x]));for(const asset of assetByRole.values()){const p=join(raw,asset.cache_name),actual=fileHash(p);if(actual!==asset.checksum_sha256)throw new Error(`Tatoeba ${asset.role} checksum drift`);addRaw(source,`.data-cache/raw/${asset.cache_name}`,'application/x-bzip2',actual,`SELECTED_BY_FIRST_${limit}_PAIRS`)}
  const engIds=new Set(),cmnIds=new Set();for await(const line of createInterface({input:createReadStream(join(expanded,'tatoeba-eng-cmn_links.tsv')),crlfDelay:Infinity})){if(pairs.length>=limit)break;c.read++;const [e,z]=line.split('\t');if(!e||!z){c.rejected++;continue}pairs.push([e,z]);engIds.add(e);cmnIds.add(z)}
  const texts=new Map();await readSelectedSentences(join(expanded,'tatoeba-eng_sentences.tsv'),engIds,texts);await readSelectedSentences(join(expanded,'tatoeba-cmn_sentences.tsv'),cmnIds,texts);
  const detailed=new Map(),cc0=new Set();await readSelectedDetailed(join(expanded,'eng_sentences_detailed.tsv'),engIds,detailed);await readSelectedDetailed(join(expanded,'cmn_sentences_detailed.tsv'),cmnIds,detailed);await readCc0Ids(join(expanded,'eng_sentences_CC0.tsv'),engIds,cc0);await readCc0Ids(join(expanded,'cmn_sentences_CC0.tsv'),cmnIds,cc0);
  const sentence=db.prepare('INSERT OR IGNORE INTO sentences VALUES(?,?,?,?,?,?,?,?,?)'),updateSentence=db.prepare('UPDATE sentences SET contributor=?,record_license=? WHERE sentence_id=? AND (contributor IS NULL OR record_license IS NULL)'),pairStmt=db.prepare('INSERT OR IGNORE INTO translation_pairs VALUES(?,?,?,?,?,?)'),cluster=db.prepare('INSERT OR IGNORE INTO sentence_clusters VALUES(?,?,?)'),member=db.prepare('INSERT OR IGNORE INTO sentence_cluster_members VALUES(?,?,?,?)'),provenance=db.prepare('INSERT OR IGNORE INTO sentence_provenance VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');db.exec('BEGIN');
  for(const [e,z] of pairs){const et=texts.get(e),zt=texts.get(z);if(!et||!zt){c.rejected++;continue}for(const [id,item] of [[e,et],[z,zt]]){const sentenceId=`tatoeba:${id}`,normalized=norm(item.text),clusterId=`text:${digest(`${item.lang}|${normalized}`).slice(0,32)}`,detail=detailed.get(id),isCc0=cc0.has(id),integrity=Boolean(detail&&detail.lang===item.lang&&detail.text===item.text),quality=Boolean(item.text.trim()&&['eng','cmn'].includes(item.lang)),contributor=detail?.contributor&&!['\\N',''].includes(detail.contributor)?detail.contributor:null,eligible=integrity&&quality&&(isCc0||Boolean(contributor)),license=isCc0?'CC0 1.0':'CC BY 2.0 FR',licenseStatus=isCc0?'VERIFIED_PRODUCTION_ALLOWED':contributor?'ATTRIBUTION_REQUIRED':'QUARANTINED',usage=isCc0?'PRODUCTION_ALLOWED':contributor?'ATTRIBUTION_REQUIRED':'QUARANTINED',reason=eligible?null:!detail?'DETAILED_RECORD_MISSING':!integrity?'SOURCE_TEXT_OR_LANGUAGE_MISMATCH':!quality?'RECORD_QUALITY_INVALID':'CONTRIBUTOR_MISSING';changed(c,'sentences',sentence.run(sentenceId,item.lang,item.text,normalized,source.source_id,source.version,id,contributor,license));updateSentence.run(contributor,license,sentenceId);changed(c,'sentence_clusters',cluster.run(clusterId,item.lang,normalized));changed(c,'sentence_cluster_members',member.run(clusterId,sentenceId,source.source_id,id));changed(c,'sentence_provenance',provenance.run(sentenceId,source.source_id,source.version,id,contributor,license,licenseStatus,isCc0?'Tatoeba sentence released under CC0 1.0':contributor?`Tatoeba sentence ${id}, contributor ${contributor}`:null,Number(!isCc0),Number(Boolean(detail)),Number(integrity),Number(quality),usage,reason,run,`${source.source_id}:${digest(`.data-cache/raw/${item.lang==='eng'?'eng':'cmn'}_sentences_detailed.tsv.bz2`).slice(0,12)}`,assetByRole.get(item.lang==='eng'?'ENG_SENTENCES_DETAILED':'CMN_SENTENCES_DETAILED').checksum_sha256,new Date().toISOString()))}changed(c,'translation_pairs',pairStmt.run(`tatoeba:${e}:${z}`,`tatoeba:${e}`,`tatoeba:${z}`,source.source_id,source.version,`${e}:${z}`))}
  db.exec('COMMIT');db.exec("BEGIN; DELETE FROM sentences_fts; INSERT INTO sentences_fts(sentence_id,normalized_text,language) SELECT sentence_id,normalized_text,language FROM sentences; COMMIT;");const fingerprint=digest(`${db.prepare('SELECT count(*) n FROM sentences').get().n}|${source.version}|${NORMALIZER_VERSION}`);db.prepare("INSERT INTO retrieval_index_state VALUES(?,?,?,?,?,?) ON CONFLICT(index_name) DO UPDATE SET index_version=excluded.index_version,source_fingerprint=excluded.source_fingerprint,built_at=excluded.built_at,row_count=excluded.row_count,status=excluded.status").run('sentences_fts','fts5-v1',fingerprint,new Date().toISOString(),db.prepare('SELECT count(*) n FROM sentences_fts').get().n,'READY');runEnd(run,c,c.rejected?[`${c.rejected} malformed/orphan pairs rejected`]:[]);return c;
}

const results={oewn:importOewn(),unimorph:await importUnimorph(),tatoeba:await importTatoeba(Number(process.env.EOT_TATOEBA_PAIR_LIMIT??5000)),database:dbPath};
console.log(JSON.stringify(results,null,2));db.close();
