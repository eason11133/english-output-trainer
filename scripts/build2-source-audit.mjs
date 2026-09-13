import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const base='artifacts/build2/baseline',receipt=JSON.parse(fs.readFileSync(`${base}/receipt.json`));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();
const delta=[],oldGreen=[],remainingGreen=[],themeConsumers=[];
const isGreen=hex=>{let h=hex.slice(1);if(h.length===3)h=h.split('').map(c=>c+c).join('');if(h.length!==6)return false;const [r,g,b]=h.match(/../g).map(v=>parseInt(v,16));return g>r+4&&g>b+2};
for(const file of receipt.files){
 if(!fs.existsSync(file.path))continue;
 const bytes=fs.readFileSync(file.path),after=hash(bytes);
 if(after!==file.sha256)delta.push({path:file.path,beforeSha256:file.sha256,afterSha256:after});
 if(!/^(app|components|lib|src\/ui)\//.test(file.path)||/\/(__dev__|stage4|stage5a|blocks)\//.test(file.path))continue;
 for(const [kind,source] of [['before',fs.readFileSync(path.join(base,'files',file.path),'utf8')],['after',bytes.toString()]])source.split(/\r?\n/).forEach((line,i)=>{
  for(const color of line.match(/#[\da-fA-F]{3,8}\b/g)||[])if(isGreen(color))(kind==='before'?oldGreen:remainingGreen).push({path:file.path,line:i+1,color,source:line.trim()});
  if(kind==='before'&&/\b(t|theme|learnerPalette)\.colors\.|learnerPalette\.(background|ink|muted|accent|line|paper)/.test(line))themeConsumers.push({path:file.path,line:i+1,source:line.trim()});
 });
}
const report={baseline:receipt.appPath,delta,oldGreen,remainingGreen,themeConsumers,limitations:['Source audit only; does not establish rendered or Android acceptance.','Semantic success is allowed as the supplied muted olive token; it is not a major canvas, card, or navigation surface.']};
fs.writeFileSync('artifacts/build2/source-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({modifiedFiles:delta.length,oldGreenLiterals:oldGreen.length,remainingGreenLiterals:remainingGreen.length,themeConsumerLines:themeConsumers.length,remainingGreen},null,2));
