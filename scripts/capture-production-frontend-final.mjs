import {spawn} from 'node:child_process';
import {mkdir,rm,stat,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

const repo=process.cwd(),root=resolve(repo,'artifacts/eot-production-final-v2'),dist=resolve(repo,'.eot-production-final-export'),base='http://127.0.0.1:8094';
if(!root.startsWith(resolve(repo,'artifacts')))throw new Error('unsafe_output');
await rm(root,{recursive:true,force:true});await mkdir(root,{recursive:true});
const run=(command,args,{stdio='inherit',env=process.env}={})=>new Promise((ok,bad)=>{const child=spawn(command,args,{cwd:repo,stdio,shell:command.endsWith('.cmd'),env});child.once('error',bad);child.once('exit',code=>code===0?ok():bad(new Error(`${command} exited ${code}`)))});
if(process.env.EOT_SKIP_EXPORT!=='1')await run('npx.cmd',['expo','export','--platform','web','--output-dir',dist]);
const server=spawn(process.execPath,['scripts/serve-export.mjs','.eot-production-final-export','8094'],{cwd:repo,stdio:'ignore'}),delay=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<80;i++){try{if((await fetch(base,{signal:AbortSignal.timeout(500)})).ok)break}catch{}if(i===79)throw new Error('capture_server_not_ready');await delay(250)}
const chrome='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',profile=join(tmpdir(),`eot-production-${Date.now()}`),browser=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars','--remote-debugging-port=9334',`--user-data-dir=${profile}`,'about:blank'],{cwd:repo,stdio:'ignore'});
async function cdp(){let endpoint;for(let i=0;i<80;i++){try{const pages=await(await fetch('http://127.0.0.1:9334/json')).json();endpoint=pages.find(page=>page.type==='page')?.webSocketDebuggerUrl;if(endpoint)break}catch{}await delay(100)}if(!endpoint)throw new Error('chrome_cdp_not_ready');const ws=new WebSocket(endpoint),pending=new Map();let id=0;ws.onmessage=event=>{const message=JSON.parse(String(event.data));if(message.id&&pending.has(message.id)){const{ok,bad}=pending.get(message.id);pending.delete(message.id);message.error?bad(new Error(message.error.message)):ok(message.result)}};await new Promise((ok,bad)=>{ws.onopen=ok;ws.onerror=bad});return{call(method,params={}){return new Promise((ok,bad)=>{const callId=++id;pending.set(callId,{ok,bad});ws.send(JSON.stringify({id:callId,method,params}))})},close(){ws.close()}}}
const manifest=[];
try{
  const devtools=await cdp();await devtools.call('Page.enable');await devtools.call('Runtime.enable');await devtools.call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true,screenWidth:390,screenHeight:844});
  const evaluate=async expression=>(await devtools.call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true})).result.value;
  const body=()=>evaluate('document.body.innerText');
  const waitText=async(text,timeout=40000)=>{const started=Date.now();while(Date.now()-started<timeout){if((await body()).includes(text))return;await delay(250)}throw new Error(`text_not_found:${text}`)};
  const clickText=async text=>{const clicked=await evaluate(`(()=>{const all=[...document.querySelectorAll('*')].filter(node=>node.textContent?.trim().includes(${JSON.stringify(text)})&&node.getBoundingClientRect().width>0);const node=all.sort((a,b)=>(a.textContent?.length??0)-(b.textContent?.length??0))[0];if(!node)return false;(node.closest('[role=button],[role=radio]')??node).click();return true})()`);if(!clicked)throw new Error(`click_missing:${text}`)};
  const navigate=async path=>{await devtools.call('Page.navigate',{url:`${base}${path}`});await delay(2500)};
  const shot=async(file,state,path,focus)=>{const target=join(root,file);if(focus)await evaluate(`(()=>{const nodes=[...document.querySelectorAll('*')].filter(item=>item.textContent?.includes(${JSON.stringify(focus)})&&item.getBoundingClientRect().height>0);nodes.sort((a,b)=>(a.textContent?.length??0)-(b.textContent?.length??0))[0]?.scrollIntoView({block:'start'})})()`);else await evaluate("window.scrollTo(0,0);document.querySelectorAll('*').forEach(node=>{node.scrollTop=0;node.scrollLeft=0})");await delay(250);const capture=await devtools.call('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false,clip:{x:0,y:0,width:390,height:844,scale:1}});await writeFile(target,Buffer.from(capture.data,'base64'));const info=await stat(target);if(info.size<3000)throw new Error(`screenshot_not_rendered:${file}`);manifest.push({file,state,url:`${base}${path}`,bytes:info.size,modifiedAt:info.mtime.toISOString()})};

  await navigate('/');
  const calibrationAnswers=['prevents','therefore','For example','At seven','Snow','review is always easy','either … or …','wrote a location on'];
  for(let turn=0;turn<60;turn++){
    const visible=await body();
    const candidate=['繼續','開始設定','10 分','直接幫我測','用這條路開始','做第一個小動作',...calibrationAnswers,'開始第一回'].find(text=>visible.includes(text));
    if(candidate){await clickText(candidate);await delay(1100);continue}
    if(visible.includes('今天')&&visible.includes('開始'))break;
    await delay(700);
  }
  await navigate('/(tabs)');await delay(1800);await shot('01-today.png','TODAY','/(tabs)');
  const reading='/exam-practice?practiceFamily=READING&origin=PRACTICE';await navigate(reading);const radioCount=await evaluate("document.querySelectorAll('[role=radio]').length");for(let index=0;index<radioCount;index+=4)await evaluate(`document.querySelectorAll('[role=radio]')[${index}]?.click()`);await delay(9000);let readingState=await body();await shot('02-reading-evidence.png','READING_EVIDENCE_REAL',reading);if(readingState.includes('選一句原文'))await clickText('The design of a neighborhood');await delay(500);readingState=await body();await shot('03-reading-compare.png','READING_COMPARE_REAL',reading,readingState.includes('你的選擇')?'原文':undefined);
  const setEditor=async(label,value)=>{const focused=await evaluate(`(()=>{const node=document.querySelector('[aria-label=${JSON.stringify(label)}]');if(!node)return false;node.focus();node.select?.();return true})()`);if(!focused)throw new Error(`editor_not_found:${label}`);await devtools.call('Input.insertText',{text:value});await delay(300)};
  const translation='/exam-practice?practiceFamily=TRANSLATION&origin=PRACTICE';await navigate(translation);await setEditor('你的翻譯','x');await delay(300);await clickText('完成翻譯');await delay(9000);await shot('04-translation-repair.png','TRANSLATION_REPAIR_REAL',translation);
  const writing='/exam-practice?practiceFamily=WRITING&origin=PRACTICE';await navigate(writing);await setEditor('你的文章','I agree. This is good. It helps people.');await delay(300);await clickText('完成這一版');await delay(9000);await shot('05-writing-repair.png','WRITING_REPAIR_REAL',writing);
  const contextual='/exam-practice?practiceFamily=CONTEXTUAL_FILL&origin=PRACTICE';await navigate(contextual);await shot('06-contextual-fill.png','CONTEXTUAL_FILL_REAL',contextual);
  const discourse='/exam-practice?practiceFamily=DISCOURSE&origin=PRACTICE';await navigate(discourse);await shot('07-discourse.png','DISCOURSE_REAL',discourse);
  await navigate('/my-english');await shot('08-my-english.png','MY_ENGLISH','/my-english');
  devtools.close();
}finally{browser.kill();server.kill();await Promise.race([new Promise(ok=>browser.once('exit',ok)),delay(1500)]);await rm(profile,{recursive:true,force:true}).catch(()=>{})}
await writeFile(join(root,'manifest.json'),JSON.stringify({capturedAt:new Date().toISOString(),viewport:'390x844',source:'real Expo production routes and persisted learner runtime',count:manifest.length,files:manifest},null,2));
console.log(`Captured ${manifest.length} production-route screenshots to ${root}`);
