import {spawn} from 'node:child_process';
import {mkdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

const base=process.env.EOT_REVIEW_URL??'http://127.0.0.1:8081';
const out=resolve('docs/product-review/current');
const profile=join(tmpdir(),`eot-current-review-${Date.now()}`);
const chrome='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
await mkdir(out,{recursive:true});

const child=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars','--remote-debugging-port=9229','--window-size=390,844',`--user-data-dir=${profile}`,`${base}/`],{stdio:'ignore'});
const delay=ms=>new Promise(resolveDelay=>setTimeout(resolveDelay,ms));
let target;
for(let i=0;i<80;i++){try{const list=await fetch('http://127.0.0.1:9229/json/list').then(r=>r.json());target=list.find(x=>x.type==='page');if(target)break}catch{}await delay(250)}
if(!target)throw new Error('review_chrome_not_ready');

const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((ok,bad)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',bad,{once:true})});
let seq=0;const pending=new Map();
ws.addEventListener('message',event=>{const value=JSON.parse(event.data);if(value.id&&pending.has(value.id)){const {ok,bad}=pending.get(value.id);pending.delete(value.id);value.error?bad(new Error(value.error.message)):ok(value.result)}});
const send=(method,params={})=>new Promise((ok,bad)=>{const id=++seq;pending.set(id,{ok,bad});ws.send(JSON.stringify({id,method,params}))});
await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true,screenWidth:390,screenHeight:844});
const evaluate=async expression=>(await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true})).result.value;
const body=()=>evaluate('document.body.innerText');
const waitText=async(text,timeout=35000)=>{const start=Date.now();while(Date.now()-start<timeout){if((await body()).includes(text))return;await delay(250)}throw new Error(`text_not_found:${text}`)};
const clickText=async text=>{const clicked=await evaluate(`(()=>{const all=[...document.querySelectorAll('*')].filter(e=>e.textContent?.trim()===${JSON.stringify(text)}&&e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0);const el=all.sort((a,b)=>a.children.length-b.children.length)[0];if(!el)return false;(el.closest('[role=button],[role=radio]')??el).click();return true})()`);if(!clicked)throw new Error(`click_text_missing:${text}`)};
const clickLabel=async label=>{const clicked=await evaluate(`(()=>{const el=document.querySelector('[aria-label=${JSON.stringify(label)}]');if(!el)return false;el.click();return true})()`);if(!clicked)throw new Error(`click_label_missing:${label}`)};
const shot=async file=>{await delay(350);const {data}=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});await writeFile(join(out,file),Buffer.from(data,'base64'))};
const navigate=async path=>{await send('Page.navigate',{url:`${base}${path}`});await delay(700)};

try{
  await delay(650);await shot('01-opening.png');await waitText('繼續',10000);
  await clickText('繼續');await waitText('還不確定');await clickText('還不確定');await waitText('10 分鐘');await clickText('10 分鐘');
  await waitText('直接幫我測');await clickText('直接幫我測');await waitText('做第一個小動作');await clickText('做第一個小動作');
  for(const answer of ['prevents','therefore','For example','At seven','Snow','review is always easy','either … or …','wrote a location on']){await waitText(answer);await clickText(answer)}
  await waitText('開始第一回');await clickText('開始第一回');await waitText('Vocabulary in context');await shot('05-question.png');
  const lessonUrl=await evaluate('location.href');
  await clickLabel('選擇 C，remove');await waitText('先抓句子裡的線索');await shot('06-repair-evidence-selection.png');
  await clickLabel('查詢 Students');await waitText('學生');await shot('10-lookup-open.png');await clickText('知道了');await shot('11-lookup-closed-state-preserved.png');
  await navigate('/');await waitText('已接回你剛才做到的地方。');await shot('13-resume-active-repair.png');
  await clickText('這個做法沒讓我看懂');await waitText('把三個動作分開');await shot('07-repair-semantic-contrast.png');
  await clickText('remove');await clickText('選好了');await waitText('把最小動作拼回來');await shot('08-repeated-failure.png');
  await clickText('reserve + books');await clickText('選好了');await waitText('Vocabulary in context');await delay(700);await shot('09-support-faded-fresh-attempt.png');
  await navigate('/practice');await waitText('想練哪一種？');await shot('03-practice.png');
  await navigate('/my-english');await waitText('我的英文');await shot('04-my-english.png');
  await navigate('/practice');await waitText('想練哪一種？');await clickText('今天');await waitText('今天練這個');await shot('02-today.png');
  const sourceSession=new URL(lessonUrl).searchParams.get('sessionId');
  await navigate(`/result?origin=TODAY${sourceSession?`&sessionId=${encodeURIComponent(sourceSession)}`:''}`);await delay(1000);await shot('12-result.png');
  await writeFile(join(out,'capture-log.json'),JSON.stringify({capturedAt:new Date().toISOString(),viewport:{width:390,height:844},source:'real Expo production routes and persisted learner runtime',url:base},null,2));
}catch(error){await writeFile(join(out,'capture-error.txt'),`${String(error)}\n\n${await body()}`);throw error}finally{ws.close();child.kill();await delay(500);await rm(profile,{recursive:true,force:true}).catch(()=>{})}
