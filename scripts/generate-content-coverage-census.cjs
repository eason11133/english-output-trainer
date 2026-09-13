const fs=require('node:fs');
const path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const root=path.resolve(__dirname,'..');
const build=path.join(root,'.domain-test-build');
const {SqliteEnglishCorpusRetrievalPortV1}=require(path.join(build,'persistence/sqliteCorpusRetrieval.js'));
const {buildCanonicalContentCoverageCensusV1}=require(path.join(build,'content/coverageCensus.js'));
const db=new DatabaseSync(path.join(root,'assets/corpus/eot-corpus-20260827.sqlite'),{readOnly:true});
const port=new SqliteEnglishCorpusRetrievalPortV1({getAllAsync:async(sql,...params)=>db.prepare(sql).all(...params)});
buildCanonicalContentCoverageCensusV1(port).then(census=>{
  const output=path.join(root,'artifacts/data-learning-puzzle/content-coverage-census.json');
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.writeFileSync(output,`${JSON.stringify(census,null,2)}\n`);
  console.log(JSON.stringify({status:'PASS',output,nodeCount:census.nodeCount,targetFacetCount:census.targetFacetCount,cells:census.rows.length*census.useCases.length},null,2));
}).finally(()=>db.close()).catch(error=>{console.error(error);process.exitCode=1});
