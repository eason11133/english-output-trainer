import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const repo=process.cwd(),output=resolve(repo,'artifacts/stage1-block-visual-acceptance');
if(!output.startsWith(resolve(repo,'artifacts')))throw new Error('Unsafe artifact output');
await rm(output,{recursive:true,force:true});
for(const dir of ['01-founder-library','02-teaching-blocks','03-practice-vs-assessment','04-allow-flow','05-alternate-teaching-strategy'])await mkdir(join(output,dir),{recursive:true});
function run(command,args,{stdio='inherit',env=process.env}={}){return new Promise((resolveRun,reject)=>{const child=spawn(command,args,{cwd:repo,stdio,shell:command.endsWith('.cmd'),env});child.once('error',reject);child.once('exit',code=>code===0?resolveRun():reject(new Error(`${command} exited ${code}`)))})}
await run('npx.cmd',['expo','export','--platform','web','--output-dir','dist-block-lab'],{env:{...process.env,EXPO_PUBLIC_ENABLE_BLOCK_LAB:'true'}});
const server=spawn(process.execPath,['scripts/serve-export.mjs','dist-block-lab','8091'],{cwd:repo,stdio:'ignore'});server.unref();
const delay=ms=>new Promise(resolveDelay=>setTimeout(resolveDelay,ms));
for(let i=0;i<40;i++){try{if((await fetch('http://127.0.0.1:8091/__dev__/blocks',{signal:AbortSignal.timeout(500)})).ok)break}catch{}if(i===39)throw new Error('Static acceptance server did not start');await delay(250)}
const chrome='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',manifest=[];
async function capture(file,route,width=430,height=900){const target=join(output,file),profile=join(tmpdir(),`eot-capture-${Date.now()}-${Math.random().toString(16).slice(2)}`);await run(chrome,['--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars','--run-all-compositor-stages-before-draw','--virtual-time-budget=7000',`--window-size=${width},${height}`,`--user-data-dir=${profile}`,`--screenshot=${target}`,`http://127.0.0.1:8091${route}`],{stdio:'ignore'});await rm(profile,{recursive:true,force:true})}
const add=async(file,block,state,route,width=430,height=900)=>{await capture(file,route,width,height);manifest.push({file,block,state,route})};

await add('01-founder-library/founder-library-all-roles.png','Founder Library','all five pedagogical sections and + New Block','/__dev__/blocks',1440,12000);
const teaching=[['meaning-representation','Meaning Representation'],['grammar-role-map','Grammar Role Map'],['form-contrast','Form–Meaning Mapping'],['l1-collision','L1 Collision'],['chunk-as-unit','Chunk as a Unit'],['collocation-network','Collocation Network'],['sentence-anatomy','Sentence Anatomy'],['reformulation-map','Reformulation Map'],['cohesion-relation-map','Cohesion / Relation Map'],['worked-transformation','Worked Transformation']];
for(let i=0;i<teaching.length;i++){const[id,label]=teaching[i],prefix=String(i+1).padStart(2,'0'),base=`/__dev__/blocks/${id}?student=1`;await add(`02-teaching-blocks/${prefix}-${id}-entry.png`,label,'entry / first instructional layer',base);await add(`02-teaching-blocks/${prefix}-${id}-complete.png`,label,'completed instructional representation and transition',`${base}&state=complete`)}
await add('03-practice-vs-assessment/01-practice-supported.png','Guided Sentence Builder','support available and visible; success remains assisted','/__dev__/blocks/allow-flow?student=practice');
await add('03-practice-vs-assessment/02-practice-faded.png','Guided Sentence Builder','less support than prior opportunity','/__dev__/blocks/allow-flow?student=fade');
await add('03-practice-vs-assessment/03-assessment-fresh-no-leak.png','Independent Sentence Production','fresh opportunity; no hints or answer leakage','/__dev__/blocks/allow-flow?student=assess');
const flow=[['01-teach.png','teach','TEACH: completed construction role representation'],['02-practice-supported.png','practice','PRACTICE: supported reconstruction'],['03-support-fade.png','fade','FADE: less help'],['04-assess-fresh.png','assess','ASSESS: fresh independent production'],['05-return-original-writing.png','return','RETURN: authentic source revision']];
for(const[file,stage,state]of flow){const extra=stage==='teach'?'&state=complete':'';await add(`04-allow-flow/${file}`,'allow + O + to V',state,`/__dev__/blocks/allow-flow?student=${stage}${extra}`)}
await add('05-alternate-teaching-strategy/01-worked-transformation-after-practice-failure.png','Worked Transformation','different registered teaching mechanism after prior approach fails','/__dev__/blocks/allow-flow?student=alternate&state=complete');
const lines=['# Stage 1 Block Visual Acceptance','','Deterministic headless Chrome captures of the local Expo web implementation. Student View images contain learner-facing UI only.','','| Screenshot | Block / mechanism | State | Route |','|---|---|---|---|',...manifest.map(item=>`| [${item.file}](./${item.file}) | ${item.block} | ${item.state} | \`${item.route}\` |`)];await writeFile(join(output,'INDEX.md'),lines.join('\n'),'utf8');
server.kill();console.log(`Captured ${manifest.length} screenshots to ${output}`);
