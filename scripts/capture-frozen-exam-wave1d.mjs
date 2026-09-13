import { spawn } from 'node:child_process';
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const repo=process.cwd(),root=resolve(repo,'artifacts/frozen-exam-wave1d'),shots=join(root,'screenshots'),qa=join(root,'qa'),logs=join(root,'test-logs');
if(!root.startsWith(resolve(repo,'artifacts')))throw new Error('unsafe_wave1d_output');
await mkdir(root,{recursive:true});await rm(shots,{recursive:true,force:true});await rm(qa,{recursive:true,force:true});await mkdir(shots,{recursive:true});await mkdir(qa,{recursive:true});await mkdir(logs,{recursive:true});
const states=[
  ['TODAY','TODAY','/(tabs)','SOURCE_WORK'],['TRANSLATION_ATTEMPT','TRANSLATION_ATTEMPT','/daily-lesson','SOURCE_WORK'],['TEACHER_ENTRY','TEACHER_ENTRY','/daily-lesson','TEACHER_ENTRY'],['REPLAN','REPLAN','/daily-lesson','REPLAN'],['FRESH_CHECK','FRESH_CHECK','/daily-lesson','FRESH_CHECK'],['RETURN_TO_ORIGINAL','RETURN_TO_ORIGINAL','/daily-lesson','RETURN_OR_CLOSE'],['WRITING_FOCUS','WRITING_FOCUS','/daily-lesson','FOCUSED_REPAIR'],['RESULT','RESULT','/result','RESULT'],['CONTEXTUAL_LOOKUP','CONTEXTUAL_LOOKUP','/daily-lesson','SOURCE_WORK'],['MY_ENGLISH','MY_ENGLISH','/(tabs)/my-english','RESULT'],['PROGRESS_HISTORY','PROGRESS_HISTORY','/progress-history','RESULT'],['READING_PRACTICE','READING_PRACTICE','/reading-attempt','SOURCE_WORK'],['FORMAL_LOCKED_ATTEMPT','FORMAL_LOCKED_ATTEMPT','/reading-attempt','SOURCE_WORK'],
  ['BLOCK_SPELLING','SPELLING_RECONSTRUCTION','/daily-lesson','LEARNING_SPACE'],['BLOCK_SENTENCE_BUILDER','SENTENCE_BUILDER','/daily-lesson','LEARNING_SPACE'],['BLOCK_FORM_MEANING','FORM_MEANING_CONTRAST','/daily-lesson','LEARNING_SPACE'],['BLOCK_COLLOCATION','COLLOCATION_MATCH','/daily-lesson','LEARNING_SPACE'],['BLOCK_REWRITE','REWRITE_SURFACE','/daily-lesson','LEARNING_SPACE'],['BLOCK_TRANSLATION_SEGMENTATION','TRANSLATION_SEGMENTATION','/daily-lesson','LEARNING_SPACE'],['BLOCK_CONTEXTUAL_PRODUCTION','CONTEXTUAL_PRODUCTION','/daily-lesson','FRESH_CHECK'],['BLOCK_RETURN_ORIGINAL','FROZEN_RETURN_ORIGINAL','/daily-lesson','RETURN_OR_CLOSE']
];
function run(command,args,{stdio='inherit',env=process.env}={}){return new Promise((ok,bad)=>{const child=spawn(command,args,{cwd:repo,stdio,shell:command.endsWith('.cmd'),env});child.once('error',bad);child.once('exit',code=>code===0?ok():bad(new Error(`${command} exited ${code}`)))})}
await run('npx.cmd',['expo','export','--platform','web','--output-dir','dist-frozen-exam-wave1d-web'],{env:{...process.env,EXPO_PUBLIC_ENABLE_UIUX_HARNESS:'true'}});
const server=spawn(process.execPath,['scripts/serve-export.mjs','dist-frozen-exam-wave1d-web','8092'],{cwd:repo,stdio:'ignore'});server.unref();
const delay=ms=>new Promise(resolveDelay=>setTimeout(resolveDelay,ms));
for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:8092/__dev__/uiux-harness?state=TODAY',{signal:AbortSignal.timeout(500)})).ok)break}catch{}if(i===49)throw new Error('wave1d_acceptance_server_not_ready');await delay(250)}
const chrome='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',manifest=[];
for(let index=0;index<states.length;index++){
  const[stateId,fixture,entry,experienceState]=states[index],file=`${String(index+1).padStart(2,'0')}-${stateId.toLowerCase().replaceAll('_','-')}.png`,target=join(shots,file),profile=join(tmpdir(),`eot-wave1d-${Date.now()}-${index}`),route=`/__dev__/uiux-harness?state=${fixture}&viewport=390x844`;
  await run(chrome,['--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars','--run-all-compositor-stages-before-draw','--virtual-time-budget=5000','--window-size=390,844',`--user-data-dir=${profile}`,`--screenshot=${target}`,`http://127.0.0.1:8092${route}`],{stdio:'ignore'});await rm(profile,{recursive:true,force:true});
  const bytes=(await stat(target)).size;if(bytes<5000)throw new Error(`screenshot_not_rendered:${stateId}:${bytes}`);
  manifest.push({stateId,file:`screenshots/${file}`,routeComponentEntry:entry,productionRoute:false,deterministicProductionStateHarness:true,harnessRoute:route,experienceState,fixtureId:fixture,viewport:{width:390,height:844},bytes});
}
server.kill();
await writeFile(join(qa,'production-state-evidence.json'),JSON.stringify(manifest,null,2),'utf8');
await writeFile(join(root,'manifest.json'),JSON.stringify({schemaVersion:1,wave:'FROZEN_EXAM_WAVE1D',capturedAt:new Date().toISOString(),requiredStateCount:21,actualStateCount:manifest.length,viewport:'390x844',evidence:manifest},null,2),'utf8');
console.log(`Captured ${manifest.length} Wave 1D production states to ${shots}`);
