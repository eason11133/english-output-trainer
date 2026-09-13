const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..'),failures=[];const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const today=read('app/(tabs)/index.tsx'),practice=read('app/(tabs)/practice.tsx'),practiceContract=read('src/experience/practiceProduct.ts'),lesson=read('app/daily-lesson.tsx'),tabs=read('app/(tabs)/_layout.tsx'),catalog=read('src/content/productTaskCatalog.ts');
if(!/systemTask=/.test(today)||!/開始今天的練習/.test(today))failures.push('Today does not direct-start a system task');
if(!/systemTask:'AUTO'/.test(practiceContract)||!/帶入我自己的作品（選用）/.test(practice))failures.push('Practice does not separate EOT tasks from optional own work');
if(!/beginSystemTask/.test(lesson)||!/practiceLessonPlanV1/.test(lesson))failures.push('system task does not enter canonical lesson runtime');
if(!/G3_ACCEPTED_ANSWER_CONTRADICTS_SOURCE/.test(catalog)||!/V24-MIX-002/.test(catalog))failures.push('bad Mixed validation tripwire missing');
const names=[...tabs.matchAll(/Tabs\.Screen name="([^"]+)"/g)].map(x=>x[1]);if(JSON.stringify(names)!==JSON.stringify(['index','practice','my-english']))failures.push('canonical bottom navigation diverged');
console.log(JSON.stringify({passed:!failures.length,status:failures.length?'BLOCKED':'R6_READY_FOR_FOUNDER_RETEST',founderAccepted:false,failures},null,2));if(failures.length)process.exitCode=1;
