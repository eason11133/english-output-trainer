import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreGsatSemanticV1} from '../../coach-server/gsat-semantic-v1.mjs';
import {classifyServerFailureV1} from '../../coach-server/reliability-v1.mjs';

const packet={taskId:'T',family:'TRANSLATION',taskContentHash:'content',rubricHash:'rubric',rubricVersion:'1',support:{lookupExposed:false,learnerAuthored:true},units:[{unitId:'U',family:'TRANSLATION',response:'Students should review regularly.',sourceText:'學生應規律複習。',meaningUnits:[{id:'MU1',requirement:'regular review',concepts:[{canonical:'review',aliases:['review','revise']}]}],relationConstraints:[]}]};
const provider=(body,status=200)=>async()=>({ok:status>=200&&status<300,status,json:async()=>body});
const output=value=>({id:'resp',output_text:JSON.stringify(value),usage:{input_tokens:10,output_tokens:5}});

test('bounded GSAT response receives server-owned provenance',async()=>{
 const raw=await scoreGsatSemanticV1({apiKey:'not-sent',model:'gpt-5.6-terra',input:packet,requestId:'req',fetchImpl:provider(output({results:[{unitId:'U',outcome:'CORRECT',dimensions:[{dimension:'MU1',outcome:'CORRECT',reasonCodes:['PRESENT']}],reasonCodes:['MEANING_PRESERVED']}]}))});
 assert.equal(raw.results[0].provider,'OpenAI');assert.equal(raw.results[0].model,'gpt-5.6-terra');assert.equal(raw.results[0].canonicalAuthority,undefined);assert.equal(raw.results[0].requestId,'req');
});
test('malformed provider output is rejected',async()=>{await assert.rejects(()=>scoreGsatSemanticV1({apiKey:'x',model:'gpt-5.6-terra',input:packet,fetchImpl:provider(output({results:[]}))}),/invalid_gsat_semantic_schema/)});
test('429 is classified as retryable rate limit without learner failure',async()=>{await assert.rejects(()=>scoreGsatSemanticV1({apiKey:'x',model:'gpt-5.6-terra',input:packet,fetchImpl:provider({error:{code:'rate'}},429)}),/provider_429/);assert.deepEqual(classifyServerFailureV1(new Error('provider_429:rate')),{status:429,code:'rate_limited',retryable:true})});
test('timeout is contained',async()=>{const e=new Error('aborted');e.name='AbortError';await assert.rejects(()=>scoreGsatSemanticV1({apiKey:'x',model:'gpt-5.6-terra',input:packet,fetchImpl:async()=>{throw e}}),/aborted/);assert.equal(classifyServerFailureV1(e).code,'timeout')});
test('missing secret fails server-side',async()=>{await assert.rejects(()=>scoreGsatSemanticV1({apiKey:'',model:'gpt-5.6-terra',input:packet}),/missing_server_config/)});

