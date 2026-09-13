import {createHash} from 'node:crypto';
import {createReadStream,createWriteStream,existsSync,mkdirSync,renameSync,unlinkSync} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {createGunzip,gzipSync} from 'node:zlib';
import {readFileSync,writeFileSync} from 'node:fs';

const sqlite='assets/corpus/eot-corpus-20260827.sqlite';
const packed=`${sqlite}.gz`;
const expected='3b24f4c5c51ae7085adf2729534755fdb724c3ad4c093531c3ea43eccee18447';
const digest=path=>createHash('sha256').update(readFileSync(path)).digest('hex');

if(process.argv.includes('--pack')){
  if(!existsSync(sqlite)||digest(sqlite)!==expected)throw new Error('bundled_corpus_source_hash_mismatch');
  writeFileSync(packed,gzipSync(readFileSync(sqlite),{level:9}));
  console.log(`Packed verified EOT corpus: ${packed}`);
}else if(existsSync(sqlite)){
  if(digest(sqlite)!==expected)throw new Error('bundled_corpus_hash_mismatch');
  console.log('Bundled EOT corpus already materialized and verified.');
}else{
  if(!existsSync(packed))throw new Error('bundled_corpus_archive_missing');
  mkdirSync('assets/corpus',{recursive:true});
  const temporary=`${sqlite}.tmp`;
  try{
    await pipeline(createReadStream(packed),createGunzip(),createWriteStream(temporary));
    if(digest(temporary)!==expected)throw new Error('materialized_corpus_hash_mismatch');
    renameSync(temporary,sqlite);
  }catch(error){if(existsSync(temporary))unlinkSync(temporary);throw error}
  console.log('Materialized and verified bundled EOT corpus.');
}
