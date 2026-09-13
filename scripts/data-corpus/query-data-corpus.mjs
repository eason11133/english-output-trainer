import {DatabaseSync} from 'node:sqlite';import {resolve} from 'node:path';import {queryCorpus} from './lib/retrieval.mjs';
const root=resolve(import.meta.dirname,'../..'),db=new DatabaseSync(resolve(root,process.env.EOT_CORPUS_DB??'.data-cache/eot-corpus.sqlite'));console.log(JSON.stringify(queryCorpus(db,{context:process.argv[2],query:process.argv[3],limit:process.argv[4]}),null,2));db.close();
