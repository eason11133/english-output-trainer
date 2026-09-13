import type { ProductContextV1 } from '../architecture/contracts';
import type { Stage4RuntimeV4 } from '../domain/stage4/LearnerRuntimeV4';
import type { OutputWorkspaceVM } from './outputWorkspaceVM';
import { assertUnsupportedPresentationV1, frozenExamExperienceDecisionV1 } from './frozenExamExperience';

export type LearnerLessonPhaseV1='AUTHENTIC_WORK'|'FOCUSED_REPAIR'|'GUIDED_PRACTICE'|'FRESH_CHECK'|'TRANSFER'|'RETURN_ORIGINAL';
export interface LearnerLessonChromeV1{
  phase:LearnerLessonPhaseV1;
  eyebrow:string;
  title:string;
  instruction:string;
  timeLabel?:string;
  editorLabel:string;
  sourceLabel:string;
}

function phaseFromRuntimeV1(runtime:Stage4RuntimeV4):LearnerLessonPhaseV1{
  const intent=runtime.decision?.pedagogicalIntent;
  if(intent==='ASSESS')return'FRESH_CHECK';
  if(intent==='TRANSFER')return'TRANSFER';
  if(intent==='RETURN')return'RETURN_ORIGINAL';
  if(intent==='TEACH')return'FOCUSED_REPAIR';
  if(intent==='PRACTICE')return'GUIDED_PRACTICE';
  return'AUTHENTIC_WORK';
}
function copyV1(phase:LearnerLessonPhaseV1,mode:Stage4RuntimeV4['artifact']['mode']){
  const translation=mode==='TRANSLATION';
  if(phase==='FOCUSED_REPAIR')return{title:'先處理這一小段',instruction:translation?'保留原本中文的意思，只把這一小段英文修到你自己能控制。':'保留你原本想說的內容，只處理現在最值得修的一小段。'};
  if(phase==='GUIDED_PRACTICE')return{title:'再自己做一次',instruction:'剛才的協助會慢慢拿掉；這次由你把英文重新組起來。'};
  if(phase==='FRESH_CHECK')return{title:translation?'換一句中文，自己翻一次':'換一個新題目，自己寫一次',instruction:'這次不沿用剛才的答案。先靠自己完成，再決定需不需要繼續教。'};
  if(phase==='TRANSFER')return{title:'換個情境，再試一次',instruction:'用新的內容完成同一種英文工作，確認不是只記住剛才那一句。'};
  if(phase==='RETURN_ORIGINAL')return{title:translation?'回到原本的翻譯':'把它放回你的原文',instruction:'回到你一開始的作品，由你親自把剛才學到的用回去。'};
  return{title:translation?'先看你的原翻譯':'先看你的原作品',instruction:'從你真正要完成的英文開始；只有需要時才插入教學。'};
}
export function learnerLessonChromeV1(input:{runtime:Stage4RuntimeV4;productMode:ProductContextV1['productMode'];timeRemainingMinutes?:number}):LearnerLessonChromeV1{
  const phase=phaseFromRuntimeV1(input.runtime),copy=copyV1(phase,input.runtime.artifact.mode),minutes=input.timeRemainingMinutes;
  return Object.freeze({
    phase,
    eyebrow:input.productMode==='EXAM'?'考試輸出':'英文輸出',
    title:copy.title,
    instruction:copy.instruction,
    timeLabel:Number.isFinite(minutes)?`約 ${Math.max(0,Math.ceil(minutes!))} 分鐘`:undefined,
    editorLabel:input.runtime.artifact.mode==='TRANSLATION'?'你的英文翻譯':'你的英文',
    sourceLabel:input.runtime.artifact.mode==='TRANSLATION'?'中文原文':'題目／原意',
  });
}
export function withLearnerLessonExperienceV1(input:{vm:OutputWorkspaceVM;runtime:Stage4RuntimeV4;productMode:ProductContextV1['productMode'];timeRemainingMinutes?:number}):OutputWorkspaceVM{
  const range=input.vm.output.focusedRanges?.find(item=>item.kind==='FOCUS'),text=input.vm.output.text;
  const anchor=input.vm.focusAnchor??(range?{artifactId:input.runtime.artifact.id,start:range.start,end:range.end,excerpt:text.slice(range.start,range.end),page:input.runtime.spans.find(span=>span.text.includes(text.slice(range.start,range.end)))?.location?.page,before:text.slice(Math.max(0,range.start-48),range.start),after:text.slice(range.end,range.end+48)}:undefined);
  const decision=assertUnsupportedPresentationV1(frozenExamExperienceDecisionV1(input.runtime,anchor?{artifactId:anchor.artifactId,start:anchor.start,end:anchor.end,excerpt:anchor.excerpt,page:anchor.page,sourceNeighborhood:{before:anchor.before??'',after:anchor.after??''}}:undefined));
  const chrome=learnerLessonChromeV1(input),message=input.runtime.decision?.configuration.teacherNarratorMessage,state=input.runtime.decision?.configuration.teacherNarratorState,teacher=typeof message==='string'&&message.trim()?{state:typeof state==='string'?state:'FOCUS',message}:undefined;
  return{...input.vm,focusAnchor:anchor,frozenState:decision.state,experience:{...chrome,teacher}};
}
