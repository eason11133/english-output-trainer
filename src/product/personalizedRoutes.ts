import type { GsatRecentResultV1, GsatSectionV1 } from './types';

export type PersonalizedRouteFamilyV1='VOCABULARY'|'COMPREHENSIVE'|'CONTEXTUAL_FILL'|'DISCOURSE'|'READING'|'MIXED'|'TRANSLATION'|'WRITING';
export interface PersonalizedRouteEvidenceV1{family:PersonalizedRouteFamilyV1;fragile:number;independent:number}
export interface PersonalizedRouteV1{id:'RECOVER'|'TRANSFER'|'OUTPUT';title:string;family:PersonalizedRouteFamilyV1;reason:string;durationMinutes:number;timePlan:string}

const familyFor:Record<GsatSectionV1,PersonalizedRouteFamilyV1>={VOCABULARY:'VOCABULARY',CLOZE:'COMPREHENSIVE',WORD_BANK:'CONTEXTUAL_FILL',DISCOURSE_STRUCTURE:'DISCOURSE',READING_COMPREHENSION:'READING',MIXED_FORMAT:'MIXED',ZH_EN_TRANSLATION:'TRANSLATION',ENGLISH_COMPOSITION:'WRITING'};
const label:Record<PersonalizedRouteFamilyV1,string>={VOCABULARY:'詞彙',COMPREHENSIVE:'綜合測驗',CONTEXTUAL_FILL:'文意選填',DISCOURSE:'篇章結構',READING:'閱讀測驗',MIXED:'混合題',TRANSLATION:'中譯英',WRITING:'英文作文'};
const examValue:Record<GsatSectionV1,number>={VOCABULARY:1.15,CLOZE:1.2,WORD_BANK:1.25,DISCOURSE_STRUCTURE:1.05,READING_COMPREHENSION:1.35,MIXED_FORMAT:1.15,ZH_EN_TRANSLATION:1.15,ENGLISH_COMPOSITION:1.3};
const transfer:Record<GsatSectionV1,number>={VOCABULARY:1.3,CLOZE:1.35,WORD_BANK:1.45,DISCOURSE_STRUCTURE:1.25,READING_COMPREHENSION:1.2,MIXED_FORMAT:1.3,ZH_EN_TRANSLATION:1.15,ENGLISH_COMPOSITION:1.1};
const dayCount=(iso:string|undefined,now:string)=>iso?Math.max(0,Math.ceil((new Date(iso).getTime()-new Date(now).getTime())/86400000)):undefined;
const latest=(rows:readonly GsatRecentResultV1[])=>[...new Map(rows.map(row=>[row.section,row])).values()];
const shownScore=(row:GsatRecentResultV1)=>`${Math.max(0,row.maximum-row.lost)}／${row.maximum}`;
const evidenceBoost=(family:PersonalizedRouteFamilyV1,evidence:readonly PersonalizedRouteEvidenceV1[])=>{const row=evidence.find(item=>item.family===family);return row?(row.fragile*.18-row.independent*.08):0};

export function buildPersonalizedRoutesV1(input:{results:readonly GsatRecentResultV1[];dailyMinutes:number;examDate?:string;nextMockDate?:string;evidence?:readonly PersonalizedRouteEvidenceV1[];now?:string}):readonly PersonalizedRouteV1[]{
 const provided=latest(input.results),rows=provided.length?provided:[{section:'VOCABULARY' as const,lost:5,maximum:10,reportedAt:input.now??new Date().toISOString(),evidenceEligible:false as const},{section:'READING_COMPREHENSION' as const,lost:12,maximum:24,reportedAt:input.now??new Date().toISOString(),evidenceEligible:false as const},{section:'ZH_EN_TRANSLATION' as const,lost:4,maximum:8,reportedAt:input.now??new Date().toISOString(),evidenceEligible:false as const}],evidence=input.evidence??[],now=input.now??new Date().toISOString(),examDays=dayCount(input.examDate,now),mockDays=dayCount(input.nextMockDate,now),daily=Math.max(8,input.dailyMinutes);
 const urgency=examDays===undefined?1:examDays<=60?1.35:examDays<=120?1.18:1, mockUrgency=mockDays===undefined?1:mockDays<=14?1.3:mockDays<=30?1.15:1;
 const ranked=(weight:(row:GsatRecentResultV1)=>number,filter:((row:GsatRecentResultV1)=>boolean)=()=>true)=>[...rows].filter(filter).sort((a,b)=>weight(b)-weight(a))[0]??rows[0];
 const recover=ranked(row=>row.lost*examValue[row.section]*mockUrgency*(1+evidenceBoost(familyFor[row.section],evidence)));
 const transferable=ranked(row=>(row.lost/Math.max(1,row.maximum))*examValue[row.section]*transfer[row.section]*urgency*(1+evidenceBoost(familyFor[row.section],evidence)),row=>!['ZH_EN_TRANSLATION','ENGLISH_COMPOSITION'].includes(row.section));
 const output=ranked(row=>(row.lost/Math.max(1,row.maximum))*examValue[row.section]*urgency*(1+evidenceBoost(familyFor[row.section],evidence)),row=>['ZH_EN_TRANSLATION','ENGLISH_COMPOSITION'].includes(row.section))??recover;
 const duration=daily<=10?8:daily<=20?12:18,examCopy=examDays===undefined?'朝學測累積':`距學測 ${examDays} 天`,mockCopy=mockDays===undefined?'下一次模考前':`距下次模考 ${mockDays} 天`;
 const evidenceCopy=(family:PersonalizedRouteFamilyV1)=>{const row=evidence.find(item=>item.family===family);return row?.fragile?`你之前在這一類也有卡住；`:row?.independent?`這一類已有一些穩定表現，先維持；`:''};
 return Object.freeze([
  {id:'RECOVER',title:'下一次模考先追回這區',family:familyFor[recover.section],durationMinutes:duration,timePlan:`先做 ${Math.max(5,duration-3)} 分鐘判斷，再用 3 分鐘自己驗證`,reason:`${label[familyFor[recover.section]]}目前 ${shownScore(recover)}；${mockCopy}，先追回最明顯的失分。`},
  {id:'TRANSFER',title:'先補會牽動多區的能力',family:familyFor[transferable.section],durationMinutes:duration,timePlan:`${Math.max(5,duration-4)} 分鐘找關鍵線索，最後 4 分鐘換題確認`,reason:`${evidenceCopy(familyFor[transferable.section])}${label[familyFor[transferable.section]]}目前 ${shownScore(transferable)}；${examCopy}，先補能帶動其他題型的一區。`},
  {id:'OUTPUT',title:'每天保留一段給自己產出',family:familyFor[output.section],durationMinutes:duration,timePlan:`${Math.max(5,duration-5)} 分鐘修一個重點，5 分鐘不看提示重寫`,reason:`${evidenceCopy(familyFor[output.section])}${label[familyFor[output.section]]}目前 ${shownScore(output)}；每天 ${daily} 分鐘裡，固定留時間給你自己寫。`},
 ]);
}
