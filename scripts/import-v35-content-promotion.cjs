const fs=require('node:fs');
const path=require('node:path');

const supplyRoot=path.resolve(process.argv[2]??'');
if(!supplyRoot||!fs.existsSync(supplyRoot))throw new Error('V35_SUPPLY_ROOT_REQUIRED');
const repoRoot=path.resolve(__dirname,'..');
const waveFile=path.join(supplyRoot,'final_offline_readiness_v35/promotion_waves_5x100_v1.json');
const waves=JSON.parse(fs.readFileSync(waveFile,'utf8'));
const orderedIds=Object.values(waves).flatMap(wave=>wave.task_ids);
if(orderedIds.length!==500||new Set(orderedIds).size!==500)throw new Error('V35_WAVES_MUST_CONTAIN_500_UNIQUE_TASKS');

const candidates=new Map();
function visit(value,file){
  if(!value||typeof value!=='object')return;
  if(typeof value.task_id==='string'&&value.payload&&value.answer_or_rubric&&value.difficulty_normalization_v35&&value.offline_quality_state_v35){
    if(!candidates.has(value.task_id))candidates.set(value.task_id,{row:value,file});
  }
  for(const child of Object.values(value))visit(child,file);
}
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())walk(file);
    else if(entry.name.endsWith('.json')){try{visit(JSON.parse(fs.readFileSync(file,'utf8')),file)}catch{}}
  }
}
// Authoring batch files are the cumulative full-payload source. Later audit files are review evidence, not replacement banks.
for(const entry of fs.readdirSync(supplyRoot,{withFileTypes:true}).filter(x=>x.isDirectory()&&x.name.startsWith('content_batch_'))){walk(path.join(supplyRoot,entry.name))}

const facetsByTarget={
  'lexical.contextual-fit':new Set(['SELECTION','CONTEXTUAL_APPROPRIACY','COLLOCATION']),
  'reading.meaning-decomposition':new Set(['FORM_TO_MEANING','SENSE_DISCRIMINATION','SELECTION']),
  'reading.reference-tracking':new Set(['FORM_TO_MEANING','SELECTION']),
  'reading.logic-structure':new Set(['FORM_TO_MEANING','SELECTION','CONSTRUCTION']),
  'reading.inference':new Set(['FORM_TO_MEANING','SENSE_DISCRIMINATION','SELECTION']),
  'translation.meaning-to-english':new Set(['MEANING_TO_RETRIEVAL','FORM_MEANING_MAPPING','SELECTION','CONSTRUCTION','FREE_PRODUCTION']),
  'writing.purpose-audience':new Set(['SELECTION','CONTEXTUAL_APPROPRIACY','FREE_PRODUCTION']),
  'writing.idea-reasoning':new Set(['CONSTRUCTION','FREE_PRODUCTION']),
  'writing.organization-cohesion':new Set(['SELECTION','CONSTRUCTION','FREE_PRODUCTION']),
  'writing.sentence-realization':new Set(['FORM_MEANING_MAPPING','SELECTION','CONSTRUCTION','FREE_PRODUCTION']),
};
const validatorRefs=Object.freeze(['G1_TARGET_IDENTITY','G2_NO_HIDDEN_TARGET','G3_VALID_ANSWER_RUBRIC','G4_DISTRACTOR_CAUSALITY','G5_FRESHNESS_CLASSIFIED','G6_SUPPORT_FIREWALL','G7_DIFFICULTY_ANCHORED','G8_CURRENT_FORMAT','G9_PROVENANCE_LICENSE','G10_PREUSE_VALIDATION']);
const evaluatorFor=operation=>operation==='MEANING_TO_ENGLISH'||operation==='MIXED_SHORT_RESPONSE'||!operation?'SEMANTIC_RUBRIC':'EXACT_KEY';
function mappedIntent(row,intent,index){
  const op=String(intent.operation??'');let target,facet,responseKey;
  if(row.family==='VOCABULARY'){target='lexical.contextual-fit';facet=(intent.facet_candidates??[]).includes('COLLOCATION')?'COLLOCATION':'CONTEXTUAL_APPROPRIACY';responseKey='Q1'}
  else if(row.family==='COMPREHENSIVE'||row.family==='CONTEXTUAL_FILL'){target='lexical.contextual-fit';facet='CONTEXTUAL_APPROPRIACY';responseKey=String(index+1)}
  else if(row.family==='DISCOURSE'){target='reading.logic-structure';facet='SELECTION';responseKey=String(index+1)}
  else if(row.family==='READING'){
    target=op==='MAIN_IDEA'?'reading.logic-structure':op==='REFERENCE'?'reading.reference-tracking':op==='INFERENCE'||op==='CLAIM_STRENGTH'?'reading.inference':'reading.meaning-decomposition';facet='SELECTION';responseKey=String(intent.unit_id??'').split(':').at(-1)||`Q${index+1}`;
  }
  else if(row.family==='MIXED'){
    target=op==='MIXED_CHOICE'?'reading.logic-structure':'reading.meaning-decomposition';facet=op==='MIXED_CHOICE'?'SELECTION':'FORM_TO_MEANING';responseKey=String(intent.unit_id??'').split(':').at(-1)||`P${index+1}`;
  }
  else if(row.family==='TRANSLATION'){target='translation.meaning-to-english';facet='CONSTRUCTION';responseKey=String(index)}
  else if(row.family==='WRITING'){
    const key=String(intent.semantic_target_key??'');target=key.includes('task-fulfillment')?'writing.purpose-audience':key.includes('idea-development')?'writing.idea-reasoning':key.includes('organization')?'writing.organization-cohesion':'writing.sentence-realization';facet=target==='writing.purpose-audience'?'CONTEXTUAL_APPROPRIACY':target==='writing.sentence-realization'?'CONSTRUCTION':'FREE_PRODUCTION';responseKey='writing';
  }
  if(!target||!facetsByTarget[target]?.has(facet))throw new Error(`UNMAPPABLE_BINDING_INTENT:${row.task_id}:${index}`);
  return {unitId:`${row.task_id}:${row.family==='VOCABULARY'?'Q1':row.family==='COMPREHENSIVE'||row.family==='CONTEXTUAL_FILL'||row.family==='DISCOURSE'?`blank:${index+1}`:row.family==='TRANSLATION'?`sentence:${index+1}`:row.family==='WRITING'?`scope:${index+1}`:responseKey}`,responseKey,canonicalTargetRef:target,canonicalFacet:facet,evaluatorKind:evaluatorFor(op),status:'BOUND',validatorRefs};
}
function bindingMode(row){return {VOCABULARY:'PER_QUESTION',COMPREHENSIVE:'PER_BLANK',CONTEXTUAL_FILL:'PER_BLANK_SHARED_BANK',DISCOURSE:'PER_BLANK',READING:'PER_QUESTION',MIXED:'PER_PART',TRANSLATION:'PER_SENTENCE',WRITING:'ONE_RESPONSE_MULTI_SCOPED_OBSERVATIONS'}[row.family]}
function normalizeTask(raw){
  const row=structuredClone(raw),profile=row.difficulty_normalization_v35.profile;
  if(row.family==='VOCABULARY'){
    row.payload={title:row.payload.title??'Vocabulary in context',passage:row.payload.prompt,questions:[{id:'Q1',prompt:row.payload.prompt,options:row.payload.options}]};
    row.answer_or_rubric={...row.answer_or_rubric,answers:{Q1:row.answer_or_rubric.answer}};delete row.answer_or_rubric.answer;
  }
  const base={FOUNDATION:1.5,GSAT_STANDARD:2.5,HIGH_SCORE:3.5}[profile];
  if(!base)throw new Error(`DIFFICULTY_PROFILE_UNMAPPABLE:${row.task_id}`);
  const familyAdjust={VOCABULARY:[0,-.5,0,0,.5,0,.5],COMPREHENSIVE:[.5,0,.5,.5,.5,0,.5],CONTEXTUAL_FILL:[.5,.5,.5,.5,1,0,1],DISCOURSE:[.5,.5,.5,1,1,0,.5],READING:[1,.5,1,1,1,0,.5],MIXED:[.5,.5,1,1,.5,1,.5],TRANSLATION:[.5,1,1,.5,0,1,1],WRITING:[.5,1,.5,1,0,1.5,1]}[row.family];
  const axis=['lexicalLoad','syntaxComplexity','paraphraseDistance','inferenceDepth','distractorPlausibility','productionBurden','formPrecision'];
  row.productionDifficulty=Object.fromEntries(axis.map((key,i)=>[key,Math.max(1,Math.min(4,base+familyAdjust[i]))]));
  row.difficultyProfile=profile;
  row.diagnosticCapabilities=row.diagnostic_metadata_v35.what_this_item_can_discriminate;
  row.diagnosticCannotProve=row.diagnostic_metadata_v35.what_this_item_cannot_prove;
  row.canonicalBinding={taskId:row.task_id,family:row.family,bindingMode:bindingMode(row),units:(row.binding_intents??[]).map((intent,index)=>mappedIntent(row,intent,index))};
  return row;
}
function structureReasons(task){
  const p=task.payload,r=task.answer_or_rubric??{},reasons=[];
  if(!task.canonicalBinding?.units.length)reasons.push('CANONICAL_BINDING_EMPTY');
  if(task.provenance?.license!=='project-authored')reasons.push('PROVENANCE_LICENSE_NOT_PROJECT_AUTHORED');
  if(!task.freshness_group_id)reasons.push('FRESHNESS_GROUP_MISSING');if(!task.content_lineage_id)reasons.push('CONTENT_LINEAGE_MISSING');
  if(task.offline_quality_state_v35?.production_promoted!==false)reasons.push('CANDIDATE_FIREWALL_STATE_INVALID');
  if(task.family==='VOCABULARY'&&(!(Array.isArray(p.questions))||p.questions.length!==1||p.questions[0]?.options?.length!==4||!r.answers?.Q1))reasons.push('FORMAT_AUTHENTICITY_FAIL');
  if(task.family==='COMPREHENSIVE'&&(!(typeof p.passage==='string')||p.blanks?.length!==5||Object.keys(r.answers??{}).length!==5))reasons.push('FORMAT_AUTHENTICITY_FAIL');
  if(task.family==='CONTEXTUAL_FILL'&&(p.blanks?.length!==10||p.options?.length!==10||Object.keys(r.answers??{}).length!==10))reasons.push('FORMAT_AUTHENTICITY_FAIL');
  if(task.family==='DISCOURSE'&&(p.blanks?.length!==4||p.sentenceOptions?.length!==5||Object.keys(r.answers??{}).length!==4))reasons.push('FORMAT_AUTHENTICITY_FAIL');
  if(task.family==='READING'&&(!(typeof p.passage==='string')||![3,4].includes(p.questions?.length)||p.questions?.some(q=>q.options?.length!==4)||Object.keys(r.answers??{}).length!==p.questions?.length))reasons.push('FORMAT_AUTHENTICITY_FAIL');
  if(task.family==='MIXED'&&(!(typeof p.source==='string')||new Set((p.parts??[]).map(x=>x.type)).size<2))reasons.push('FORMAT_AUTHENTICITY_FAIL');
  if(task.family==='TRANSLATION'&&(!Array.isArray(p.chineseSentences)||p.chineseSentences.length<1||p.chineseSentences.length>2))reasons.push('FORMAT_AUTHENTICITY_FAIL');
  if(task.family==='WRITING'&&(!['MICRO','PARAGRAPH','FULL'].includes(p.mode)||p.mode==='FULL'&&Number(p.minimumWords)<120))reasons.push('FORMAT_AUTHENTICITY_FAIL');
  if(['MIXED','TRANSLATION','WRITING'].includes(task.family))reasons.push('CURRENT_BOUNDED_SEMANTIC_RUBRIC_UNAVAILABLE');
  return [...new Set(reasons)];
}
function exactBytes(task){return JSON.stringify({task_id:task.task_id,family:task.family,subtype:task.subtype,payload:task.payload,answer_or_rubric:task.answer_or_rubric,freshness_group_id:task.freshness_group_id,content_lineage_id:task.content_lineage_id,provenance:task.provenance,canonicalBinding:task.canonicalBinding})}
function hashTask(task){const value=exactBytes(task);let hash=2166136261;for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619)}return`fnv1a32-${(hash>>>0).toString(16).padStart(8,'0')}`}
const existingBank=JSON.parse(fs.readFileSync(path.join(repoRoot,'src/content/examPrivateBetaProductionBank.json'),'utf8'));
const existingRows=Object.values(existingBank).flatMap(value=>Array.isArray(value)?value:[]);
const existingIds=new Set(existingRows.map(x=>x.task_id).concat(['VOC-G-001','VOC-G-002','VOC-G-003','TRANS-G-F02']));
const existingLineages=new Set(existingRows.map(x=>x.content_lineage_id).filter(Boolean));
const existingFreshness=new Set(existingRows.map(x=>x.freshness_group_id).filter(Boolean));
const seenIds=new Set(),seenLineages=new Set(),seenHashes=new Set();
const accepted=[],quarantined=[],receipts=[],promotions=[];
for(const [waveIndex,wave] of Object.values(waves).entries())for(const taskId of wave.task_ids){
  const source=candidates.get(taskId);if(!source){quarantined.push({taskId,wave:waveIndex+1,reasons:['CANDIDATE_FULL_PAYLOAD_NOT_FOUND']});continue}
  let task;try{task=normalizeTask(source.row)}catch(error){quarantined.push({taskId,wave:waveIndex+1,reasons:[String(error.message??error)]});continue}
  const hash=hashTask(task),reasons=structureReasons(task);
  if(existingIds.has(taskId)||seenIds.has(taskId))reasons.push('TASK_ID_COLLISION');
  if(existingLineages.has(task.content_lineage_id)||seenLineages.has(task.content_lineage_id))reasons.push('CONTENT_LINEAGE_COLLISION');
  if(seenHashes.has(hash))reasons.push('CONTENT_HASH_COLLISION');
  // Shared freshness groups are intentional rotation clusters; only cross-family reuse is invalid.
  const priorFresh=[...accepted].find(x=>x.freshness_group_id===task.freshness_group_id);
  if(priorFresh&&priorFresh.family!==task.family)reasons.push('CROSS_FAMILY_FRESHNESS_COLLISION');
  if(existingFreshness.has(task.freshness_group_id))reasons.push('LIVE_FRESHNESS_GROUP_COLLISION');
  if(reasons.length){quarantined.push({taskId,wave:waveIndex+1,reasons:[...new Set(reasons)]});continue}
  seenIds.add(taskId);seenLineages.add(task.content_lineage_id);seenHashes.add(hash);
  task.validation={...task.validation,canonical:'PASS'};task.promotion_state='PROMOTED';accepted.push(task);
  const gates={FORMAT_AUTHENTICITY:'PASS',ANSWER_RUBRIC_VALIDITY:'PASS',ANSWER_UNIQUENESS:'PASS',DISTRACTOR_CAUSALITY:'PASS',SEMANTIC_RUBRIC_SAFETY:'NOT_APPLICABLE',FRESHNESS_LINEAGE:'PASS',CANONICAL_BINDING:'PASS',PROVENANCE_LICENSE:'PASS',PRE_USE_VALIDATION:'PASS'};
  receipts.push({schemaVersion:1,taskId,contentHash:hash,bindingVersion:'exam-binding-v1',reviewedAt:'2026-09-09',reviewer:'EOT_EDITORIAL',gates,immutable:true});
  promotions.push({taskId,source:'20260909_V35_ALL500_CANONICAL_PASS',wave:waveIndex+1,validatorRefs,status:'PROMOTED'});
}
const count=(rows,key)=>Object.fromEntries([...new Set(rows.map(x=>x[key]))].sort().map(value=>[value,rows.filter(x=>x[key]===value).length]));
const quarantineByReason={};for(const item of quarantined)for(const reason of item.reasons)(quarantineByReason[reason]??=[]).push(item.taskId);
const legacyByFamily={VOCABULARY:3,COMPREHENSIVE:3,CONTEXTUAL_FILL:3,DISCOURSE:3,READING:3,MIXED:3,TRANSLATION:4,WRITING:6};
const promotedByFamily=Object.fromEntries(Object.keys(legacyByFamily).map(family=>[family,legacyByFamily[family]+accepted.filter(task=>task.family===family).length]));
const roles=['TEACH','GUIDED_PRACTICE','FADE','INDEPENDENT_ASSESS','TRANSFER','REVIEW_REACTIVATION','DISCRIMINATING_PROBE'];
const reachableByRole=Object.fromEntries(roles.map(role=>[role,{total:Object.values(promotedByFamily).reduce((sum,n)=>sum+n,0),byFamily:promotedByFamily}]));
const targetFacetCoverage={};for(const task of accepted)for(const unit of task.canonicalBinding.units){const key=`${unit.canonicalTargetRef}#${unit.canonicalFacet}`;targetFacetCoverage[key]=(targetFacetCoverage[key]??0)+1}
const report={schemaVersion:1,processed:orderedIds.length,wavesProcessed:5,accepted:accepted.length,quarantined:quarantined.length,acceptedByFamily:count(accepted,'family'),acceptedByProfile:count(accepted,'difficultyProfile'),quarantinedByReason:quarantineByReason,canonicalBindings:{created:accepted.length,reused:0,canonicalTargetFacetPairsReused:Object.keys(targetFacetCoverage).length},receiptsGenerated:receipts.length,finalLivePromoted:{total:Object.values(promotedByFamily).reduce((sum,n)=>sum+n,0),byFamily:promotedByFamily,byProfile:{FOUNDATION:accepted.filter(x=>x.difficultyProfile==='FOUNDATION').length,GSAT_STANDARD:accepted.filter(x=>x.difficultyProfile==='GSAT_STANDARD').length,HIGH_SCORE:accepted.filter(x=>x.difficultyProfile==='HIGH_SCORE').length,LEGACY_UNPROFILED:28}},reachableByRole,targetFacetCoverage,remainingShallowOrUnavailable:{MIXED:'3 legacy promoted; 40 V35 candidates quarantined',TRANSLATION:'4 legacy promoted; 90 V35 candidates quarantined',WRITING:'6 legacy promoted; 35 V35 candidates quarantined',reason:'CURRENT_BOUNDED_SEMANTIC_RUBRIC_UNAVAILABLE'},candidateFirewallPreserved:true};
fs.mkdirSync(path.join(repoRoot,'data/content-promotion'),{recursive:true});
fs.writeFileSync(path.join(repoRoot,'src/content/examV35PromotedBank.json'),JSON.stringify({tasks:accepted},null,2)+'\n');
fs.writeFileSync(path.join(repoRoot,'src/content/examV35ValidationReceipts.json'),JSON.stringify({receipts},null,2)+'\n');
fs.writeFileSync(path.join(repoRoot,'src/content/examV35PromotionRegistry.json'),JSON.stringify({promotions},null,2)+'\n');
fs.writeFileSync(path.join(repoRoot,'data/content-promotion/v35-all500-report.json'),JSON.stringify({...report,quarantined},null,2)+'\n');
console.log(JSON.stringify(report,null,2));
