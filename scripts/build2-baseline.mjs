import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd(), out=path.join(root,'artifacts/build2/baseline');
if(fs.existsSync(path.join(out,'receipt.json')))throw new Error('Baseline already exists; refusing to overwrite');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex').toUpperCase();
const files=[];
function snapshot(rel){const full=path.join(root,rel);if(!fs.existsSync(full))return;if(fs.statSync(full).isDirectory()){for(const name of fs.readdirSync(full))snapshot(path.join(rel,name));return;}const bytes=fs.readFileSync(full);files.push({path:rel.replaceAll('\\','/'),sha256:hash(bytes)});const dest=path.join(out,'files',rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);}
for(const rel of ['app','components','context','lib','src','scripts','tests','package.json','package-lock.json','app.json','eas.json','tsconfig.json','tsconfig.domain-tests.json'])snapshot(rel);
const apk='founder-builds/eot-founder-preview-0.3.0-build1-4f306f90.apk';
const receipt={createdAt:new Date().toISOString(),appPath:root,baselineAuthority:'Current EOT working-directory contents, explicitly authorized by Founder; parent Git HEAD is not the product baseline',package:JSON.parse(fs.readFileSync('package.json')),app:JSON.parse(fs.readFileSync('app.json')),eas:JSON.parse(fs.readFileSync('eas.json')),founderBuild1:{classification:'DEVICE_INFRASTRUCTURE_SMOKE_ONLY',version:'0.3.0',build:1,easBuildId:'4f306f90-1c1b-47dd-8c89-0f045df4d579',apk,sha256:hash(fs.readFileSync(apk))},files};
fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2));
console.log(JSON.stringify({receipt:path.join(out,'receipt.json'),files:files.length,apkSha256:receipt.founderBuild1.sha256}));
