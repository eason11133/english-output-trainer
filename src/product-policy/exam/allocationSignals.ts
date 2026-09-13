import type { ExamSchedulingResultV1, ProductContextV1 } from '../../architecture/contracts';
import type { EnglishDomainArea } from '../../domain/english/EnglishDomainGraph';
import type { CapabilityProjection } from '../../domain/learner/LearnerModelV3';

export type ExamAllocationSignalReasonV1='REAL_MOCK_LOSS'|'DEADLINE_AMPLIFIED_RECOVERABLE_LOSS'|'EXPECTED_GAIN_SUPPORTED'|'TRANSFER_CALIBRATION_WARNING';
export interface ExamAllocationSignalV1{boost:number;reasonCodes:readonly ExamAllocationSignalReasonV1[];transferWarning:boolean;matchedResults:readonly ExamSchedulingResultV1[];recoverableRawPoints:number;scoreGap:number;transferLeverage:number;estimatedMinutes:number}

const areasBySection:Readonly<Record<ExamSchedulingResultV1['section'],readonly EnglishDomainArea[]>>=Object.freeze({
  VOCABULARY:['LEXICAL','FORMULAIC'],CLOZE:['GRAMMAR','FORMULAIC'],WORD_BANK:['LEXICAL','FORMULAIC'],DISCOURSE_STRUCTURE:['READING'],READING_COMPREHENSION:['READING'],MIXED_FORMAT:['READING','GRAMMAR'],ZH_EN_TRANSLATION:['TRANSLATION','MEANING_ENCODING'],ENGLISH_COMPOSITION:['WRITING','MEANING_ENCODING'],
});

function deadlineMultiplier(context:ProductContextV1,now:string){
  const deadline=context.examContext?.deadline;if(!deadline)return 1;
  const days=(Date.parse(deadline)-Date.parse(now))/86400000;
  if(!Number.isFinite(days))return 1;
  if(days<=7)return 1.8;if(days<=14)return 1.6;if(days<=30)return 1.35;if(days<=90)return 1.15;return 1;
}
const chronological=(rows:readonly ExamSchedulingResultV1[])=>[...rows].filter(row=>row.maximum>0&&row.lost>=0).sort((a,b)=>a.reportedAt.localeCompare(b.reportedAt));
const transferLeverageByArea:Readonly<Record<EnglishDomainArea,number>>=Object.freeze({LEXICAL:1.45,FORMULAIC:1.6,GRAMMAR:1.35,MEANING_ENCODING:1.45,READING:1.2,DISCOURSE:1.15,TRANSLATION:1.05,WRITING:1});
const estimateMinutes=(state:CapabilityProjection['state']|undefined,historicalIndependent=false)=>historicalIndependent?3:state==='ASSISTED_CONTROL'?5:state==='OBSERVED_FRAGILE'?8:state==='UNKNOWN'?10:6;

export function examAllocationSignalForV1(input:{context:ProductContextV1;area:EnglishDomainArea;projection?:CapabilityProjection;now:string}):ExamAllocationSignalV1{
  const empty=()=>Object.freeze({boost:0,reasonCodes:Object.freeze([]),transferWarning:false,matchedResults:Object.freeze([]),recoverableRawPoints:0,scoreGap:0,transferLeverage:1,estimatedMinutes:estimateMinutes(input.projection?.state,input.projection?.historicalIndependentControl)});
  if(input.context.productMode!=='EXAM')return empty();
  const matched=chronological(input.context.examContext?.schedulingResults??[]).filter(row=>areasBySection[row.section].includes(input.area));
  if(!matched.length)return empty();
  const latestBySection=new Map<ExamSchedulingResultV1['section'],ExamSchedulingResultV1>();for(const row of matched)latestBySection.set(row.section,row);
  const latest=[...latestBySection.values()],allLatest=new Map<ExamSchedulingResultV1['section'],ExamSchedulingResultV1>();for(const row of chronological(input.context.examContext?.schedulingResults??[]))allLatest.set(row.section,row);
  const target=Number(String(input.context.examContext?.targetScore??'').replace(/[^\d.]/g,'')),currentRaw=[...allLatest.values()].reduce((sum,row)=>sum+Math.max(0,row.maximum-row.lost),0),scoreGap=Number.isFinite(target)&&target>0?Math.max(0,target-currentRaw):latest.reduce((sum,row)=>sum+row.lost,0),recoverableRawPoints=Math.min(latest.reduce((sum,row)=>sum+row.lost,0),scoreGap||Infinity),leverage=transferLeverageByArea[input.area],recurrence=Math.min(1.5,1+matched.filter(row=>row.lost>0).length*.1),minutes=estimateMinutes(input.projection?.state,input.projection?.historicalIndependentControl),confidence=input.projection?.confidence==='HIGH'?1:input.projection?.confidence==='MEDIUM'?0.82:0.62,weightedLoss=(recoverableRawPoints*leverage*recurrence*confidence/Math.max(minutes,1))*12;
  const multiplier=deadlineMultiplier(input.context,input.now),reasons:ExamAllocationSignalReasonV1[]=['REAL_MOCK_LOSS'];
  if(multiplier>1&&weightedLoss>0)reasons.push('DEADLINE_AMPLIFIED_RECOVERABLE_LOSS');
  const recoverable=Boolean(input.projection&&['OBSERVED_FRAGILE','ASSISTED_CONTROL','TRANSFER_PENDING'].includes(input.projection.state));
  if(recoverable){reasons.push('EXPECTED_GAIN_SUPPORTED')}
  let transferWarning=false;
  for(const section of latestBySection.keys()){
    const series=matched.filter(row=>row.section===section);if(series.length<2)continue;
    const first=series[0],last=series.at(-1)!;
    const noMeaningfulMockGain=(last.lost/last.maximum)>=(first.lost/first.maximum)-0.05;
    const appImprovement=Boolean(input.projection&&input.projection.sourceEvidenceIds.length>=2&&['INDEPENDENT_LOCAL_CONTROL','TRANSFER_PENDING','TRANSFER_SUPPORTED','RETENTION_PENDING','RETENTION_SUPPORTED'].includes(input.projection.state)&&input.projection.latestEvidenceAt&&input.projection.latestEvidenceAt<=last.reportedAt);
    if(noMeaningfulMockGain&&appImprovement){transferWarning=true;reasons.push('TRANSFER_CALIBRATION_WARNING');break}
  }
  return Object.freeze({boost:Math.round(weightedLoss*multiplier)+(recoverable?6:0)+(transferWarning?24:0),reasonCodes:Object.freeze(reasons),transferWarning,matchedResults:Object.freeze(matched),recoverableRawPoints,scoreGap,transferLeverage:leverage,estimatedMinutes:minutes});
}
