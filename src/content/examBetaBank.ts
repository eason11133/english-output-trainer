import productionBank from './examPrivateBetaProductionBank.json';
import{canonicalExamBindingV1,type ExamTaskCanonicalBindingV1}from'./examCanonicalBindings';
import{canonicalExamPromotionV1}from'./examCanonicalPromotions';
import{validateExamReceiptV1}from'./examValidationReceipts';
import{examContentHashV1}from'./examValidationReceipts';
import v35Bank from './examV35PromotedBank.json';

export type ExamBetaFamily='VOCABULARY'|'COMPREHENSIVE'|'CONTEXTUAL_FILL'|'DISCOURSE'|'READING'|'MIXED'|'TRANSLATION'|'WRITING';
export interface ExamBetaTask{task_id:string;family:ExamBetaFamily;subtype:string;payload:Record<string,unknown>;answer_or_rubric?:unknown;freshness_group_id?:string;content_lineage_id?:string;promotion_state?:string;validation?:{structure?:string;canonical?:string};provenance?:{author?:string;license?:string};canonicalBinding?:ExamTaskCanonicalBindingV1;difficultyProfile?:'FOUNDATION'|'GSAT_STANDARD'|'HIGH_SCORE';productionDifficulty?:Readonly<Record<string,number>>;diagnosticCapabilities?:readonly string[];diagnosticCannotProve?:readonly string[];semanticRubricRef?:string}
type ProductionBank=Record<string,unknown>;
const bank=productionBank as ProductionBank;
const vocabularyTasks:readonly ExamBetaTask[]=Object.freeze([
 {task_id:'VOC-G-001',family:'VOCABULARY',subtype:'CONTEXTUAL_SENSE_4_CHOICE',freshness_group_id:'vocab-allow-permission-school',promotion_state:'CURATED_CANDIDATE',provenance:{author:'EOT original',license:'project-authored'},payload:{title:'詞彙題｜語境中的意思',passage:'The new school policy allows students to borrow a tablet for class projects.',questions:[{id:'Q1',prompt:'The word “allows” is closest in meaning to:',options:[{id:'A',text:'permits'},{id:'B',text:'prevents'},{id:'C',text:'reminds'},{id:'D',text:'forces'}]}]},answer_or_rubric:{answers:{Q1:'A'}}},
 {task_id:'VOC-G-002',family:'VOCABULARY',subtype:'COLLOCATION_4_CHOICE',freshness_group_id:'vocab-progress-study-plan',promotion_state:'CURATED_CANDIDATE',provenance:{author:'EOT original',license:'project-authored'},payload:{title:'詞彙題｜搭配與語塊',passage:'With a realistic weekly plan, Mina began to make steady progress in English.',questions:[{id:'Q1',prompt:'Which word best completes “___ steady progress”?',options:[{id:'A',text:'make'},{id:'B',text:'do'},{id:'C',text:'take'},{id:'D',text:'set'}]}]},answer_or_rubric:{answers:{Q1:'A'}}},
 {task_id:'VOC-G-003',family:'VOCABULARY',subtype:'WORD_FAMILY_FIT_4_CHOICE',freshness_group_id:'vocab-form-allow-museum',promotion_state:'CURATED_CANDIDATE',provenance:{author:'EOT original',license:'project-authored'},payload:{title:'詞彙題｜字形與句法位置',passage:'The museum ___ visitors to take photos in this room.',questions:[{id:'Q1',prompt:'Which form best fits the sentence?',options:[{id:'A',text:'allows'},{id:'B',text:'allow'},{id:'C',text:'allowed'},{id:'D',text:'allowing'}]}]},answer_or_rubric:{answers:{Q1:'A'}}},
]);
const translationReplacement:ExamBetaTask=Object.freeze({task_id:'TRANS-G-F02',family:'TRANSLATION',subtype:'FULL_TWO_SENTENCE',freshness_group_id:'trans-full-daily-time-community-repair',promotion_state:'CURATED_CANDIDATE',provenance:{author:'EOT original',license:'project-authored'},payload:{title:'完整中譯英',mode:'FULL',chineseSentences:['學生應該善用每天零碎的時間，因為這樣比較不容易半途放棄。','這個活動不但減少浪費，也讓居民學會如何修理日常用品。']},answer_or_rubric:{semantic:true}});
const keyFor:Record<ExamBetaFamily,string[]>={VOCABULARY:[],COMPREHENSIVE:['comprehensive'],CONTEXTUAL_FILL:['contextual_fill'],DISCOURSE:['discourse'],READING:['reading'],MIXED:['mixed'],TRANSLATION:['translation_targeted','translation_full'],WRITING:['writing_micro','writing_paragraph','writing_full']};

function structurallyValid(task:ExamBetaTask){
 const p=task.payload;
 if(task.family==='VOCABULARY')return typeof p.passage==='string'&&(p.questions as {options?:unknown[]}[])?.length===1&&(p.questions as {options?:unknown[]}[])[0]?.options?.length===4;
 if(task.family==='CONTEXTUAL_FILL')return(p.blanks as unknown[])?.length===10&&(p.options as unknown[])?.length===10;
 if(task.family==='DISCOURSE')return(p.blanks as unknown[])?.length===4&&(p.sentenceOptions as unknown[])?.length===5;
 if(task.family==='COMPREHENSIVE')return typeof p.passage==='string'&&(p.blanks as unknown[])?.length===5;
 if(task.family==='READING')return typeof p.passage==='string'&&[3,4].includes((p.questions as unknown[])?.length);
 if(task.family==='MIXED')return typeof p.source==='string'&&new Set((p.parts as {type:string}[])?.map(x=>x.type)).size>=2;
 if(task.family==='TRANSLATION')return p.mode!=='FULL'||(p.chineseSentences as unknown[])?.length===2;
 if(task.family==='WRITING')return p.mode!=='FULL'||Number(p.minimumWords)>=120;
 return false;
}
const v35Tasks=v35Bank.tasks as unknown as ExamBetaTask[];
function sourceTasks(family:ExamBetaFamily){return [...(family==='VOCABULARY'?vocabularyTasks:[]),...(family==='TRANSLATION'?[translationReplacement]:[]),...keyFor[family].flatMap(key=>Array.isArray(bank[key])?bank[key] as ExamBetaTask[]:[]),...v35Tasks.filter(task=>task.family===family)]}
function promotedProjection(task:ExamBetaTask):ExamBetaTask|undefined{
 const binding=canonicalExamBindingV1(task.task_id),promotion=canonicalExamPromotionV1(task.task_id);
 if(!binding||!promotion||!structurallyValid(task)||task.provenance?.license!=='project-authored')return undefined;
 const bound={...task,canonicalBinding:binding};if(!validateExamReceiptV1(bound).valid)return undefined;
 return Object.freeze({...bound,validation:{...task.validation,canonical:'PASS'},promotion_state:'PROMOTED'});
}
export function examBetaTasks(family:ExamBetaFamily):readonly ExamBetaTask[]{const seen=new Set<string>();return Object.freeze(sourceTasks(family).flatMap(task=>{if(seen.has(task.task_id))return[];seen.add(task.task_id);const projected=promotedProjection(task);return projected?[projected]:[]}))}
export function examBetaPromotionReport(){
 const families=['VOCABULARY','COMPREHENSIVE','CONTEXTUAL_FILL','DISCOURSE','READING','MIXED','TRANSLATION','WRITING'] as ExamBetaFamily[],productionRows=families.flatMap(sourceTasks),unique=[...new Map(productionRows.map(task=>[task.task_id,task])).values()],promoted=unique.filter(task=>Boolean(promotedProjection(task))),byFamily=Object.fromEntries(families.map(family=>[family,examBetaTasks(family).length]));
 return Object.freeze({productionBankCount:unique.length,promotedCount:promoted.length,rejectedProductionRows:unique.length-promoted.length,byFamily:Object.freeze(byFamily),classmateRunwayMinimumMet:Object.values(byFamily).every(count=>count>=3),candidateQuarantineExternalToLearnerRuntime:true,reason:promoted.length===unique.length?'PASS':'PRODUCTION_BANK_CONTAINS_UNPROMOTED_ROW'});
}
function matchesVariant(task:ExamBetaTask,variant:string){const mode=String(task.payload.mode??'');if(task.family==='TRANSLATION')return variant.includes('2')?mode==='FULL':variant.includes('1')?mode==='TARGETED':true;if(task.family==='WRITING')return variant.includes('完整')?mode==='FULL':variant.includes('一段')?mode==='PARAGRAPH':variant.includes('短')?mode==='MICRO':true;return true}
export interface ExamTaskHistoryV1{taskId:string;contentHash?:string;contentLineage?:string;freshnessGroupId?:string}
export type ExamAllocationPurposeV1='PRACTICE_NEW'|'FRESH_CHECK'|'CHANGED_CONTEXT'|'RETENTION_CHECK'|'REVIEW_ONLY';
export function examBetaTaskForLearner(family:ExamBetaFamily,learnerId:string,variant='suggested',rotationKey='',allocation?:{purpose:ExamAllocationPurposeV1;recent:readonly ExamTaskHistoryV1[]}){
 const all=examBetaTasks(family),filtered=all.filter(task=>matchesVariant(task,variant)),base=filtered.length?filtered:all;if(!base.length)return undefined;
 const recent=allocation?.recent??[],strict=allocation?.purpose==='PRACTICE_NEW'||allocation?.purpose==='FRESH_CHECK'||allocation?.purpose==='CHANGED_CONTEXT'||allocation?.purpose==='RETENTION_CHECK';
 const eligible=base.filter(task=>{
  const exact=recent.some(row=>row.taskId===task.task_id||(row.contentHash&&row.contentHash===examContentHashV1(task))),sameGroup=recent.some(row=>row.freshnessGroupId&&row.freshnessGroupId===task.freshness_group_id),sameLineage=recent.some(row=>row.contentLineage&&row.contentLineage===task.content_lineage_id);
  if(allocation?.purpose==='REVIEW_ONLY')return true;
  return strict?!exact&&!sameGroup&&!sameLineage:!exact;
 });
 const tasks=eligible.length?eligible:strict?[]:base;if(!tasks.length)return undefined;
 const hash=[...`${learnerId}:${variant}:${rotationKey}`].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7);return tasks[hash%tasks.length]
}
export function examBetaTaskById(family:ExamBetaFamily,taskId:string){return examBetaTasks(family).find(task=>task.task_id===taskId)}
const practiceToExamFamilyV1=Object.freeze({VOCABULARY_USAGE:'VOCABULARY',CLOZE:'COMPREHENSIVE',CONTEXTUAL_FILL:'CONTEXTUAL_FILL',DISCOURSE:'DISCOURSE',READING:'READING',MIXED:'MIXED',TRANSLATION:'TRANSLATION',WRITING:'WRITING'} as const);
const examToPracticeFamilyV1=Object.freeze(Object.fromEntries(Object.entries(practiceToExamFamilyV1).map(([practice,exam])=>[exam,practice])) as Record<ExamBetaFamily,string>);
export function practiceFamilyToExamFamily(value:string):ExamBetaFamily|undefined{return(practiceToExamFamilyV1 as Record<string,ExamBetaFamily>)[value]}
export function examFamilyToPracticeFamilyV1(family:ExamBetaFamily){return examToPracticeFamilyV1[family]}
