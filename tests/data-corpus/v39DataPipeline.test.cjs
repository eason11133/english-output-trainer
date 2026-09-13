const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');

const root=path.resolve(__dirname,'../..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));

test('V39 promotion receipts and live-bank projection remain complete and hash-pinned',()=>{
 const bank=read('src/content/examV35PromotedBank.json'),receipts=read('src/content/examV35ValidationReceipts.json'),promotions=read('src/content/examV35PromotionRegistry.json');
 const v36=bank.tasks.filter(x=>x.task_id.startsWith('V36-'));
 assert.equal(v36.length,100);assert.equal(new Set(v36.map(x=>x.task_id)).size,100);
 assert.equal(receipts.receipts.filter(x=>x.taskId.startsWith('V36-')&&x.immutable).length,100);
 assert.equal(promotions.promotions.filter(x=>x.taskId.startsWith('V36-')&&x.status==='PROMOTED').length,100);
});

test('grounded packets and cohorts cannot masquerade as learner tasks',()=>{
 const packets=read('data/content-supply/v39/grounding/grounded-authoring-packets.json');
 assert.equal(packets.count,1911);assert.equal(packets.packets.length,1911);
 for(const row of packets.packets){assert.equal(row.contentState,'GROUNDED_AUTHORING_INPUT_NOT_A_TASK');assert.equal(row.state,'GROUNDED_READY_FOR_AUTHORING');assert.equal(Object.hasOwn(row,'task_id'),false)}
 const priority=read('data/content-supply/v39/authoring-cohorts/priority-queue.json');
 assert.equal(priority.state,'AUTHORING_INPUT_NOT_A_TASK');assert.equal(priority.rows.length,1911);
});

test('production-safe corpus grounding fails closed with exact blocked reasons',()=>{
 const blocked=read('data/content-supply/v39/grounding/blocked-authoring-jobs.json');
 assert.equal(blocked.count,89);assert.equal(blocked.jobs.length,89);
 assert.ok(blocked.jobs.every(x=>x.reasons.includes('CORPUS_LEMMA_SENSE_MISSING')));
 assert.ok(blocked.jobs.filter(x=>x.reasons.includes('PRODUCTION_SAFE_LICENSED_GROUNDING_MISSING')).length>0);
});

test('V39 deterministic candidate regression is advisory and has no R3 issue',()=>{
 const qc=read('data/content-supply/v39/qc/v37-regression.json');
 assert.equal(qc.processed,100);assert.equal(qc.R3Issues,0);assert.equal(qc.result,'PASS');
 assert.ok(qc.rows.every(x=>x.riskLevel==='R0'));
});
