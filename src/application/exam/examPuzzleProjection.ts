import type {QualifiedInnerTutorDecisionV1} from '../../teacher-runtime';
import type {ExamBetaTask} from '../../content/examBetaBank';
import type {LearnerActionSurface,LearnerItem,LearnerSpan} from '../../ui/learnerActionSurface';

type InternalInteraction={interactionId:string;mode:string;blockId:string;prompt:string;options?:readonly {id:string;label:string}[]};
type Input={decision:QualifiedInnerTutorDecisionV1;interaction:InternalInteraction;task:ExamBetaTask;learnerResponse?:string};
const options=(value:unknown):LearnerItem[]=>Array.isArray(value)?value.map((x,index)=>typeof x==='object'&&x?{id:String((x as {id?:unknown}).id??index),label:String((x as {text?:unknown;label?:unknown}).text??(x as {label?:unknown}).label??'')}:{id:String(index),label:String(x)}):[];
const sentenceSpans=(text:string):LearnerSpan[]=>text.split(/(?<=[.!?])\s+|(?<=,)\s+/).map((part,index)=>({id:`span-${index}`,text:part.trim()})).filter(x=>x.text);
const source=(task:ExamBetaTask)=>String(task.payload.passage??task.payload.source??task.payload.prompt??'');
const firstQuestion=(task:ExamBetaTask)=>((task.payload.questions as {id:string;prompt:string;options?:unknown}[]|undefined)?.[0]);
const base=(input:Input)=>({id:input.interaction.interactionId,taskId:input.task.task_id,instruction:input.interaction.prompt});
function contrastItems(input:Input){const question=firstQuestion(input.task),choices=options(question?.options??input.interaction.options).slice(0,4);return choices.map(item=>({id:item.id,word:item.label,meaning:'和這一題的實際語境比較',example:question?.prompt??source(input.task)}))}
function readingAlignment(passage:string,option:string){const spans=sentenceSpans(passage),optionWords=option.toLowerCase().match(/[a-z]+/g)??[],score=(s:string)=>optionWords.filter(word=>word.length>3&&s.toLowerCase().includes(word)).length,sourceSpan=[...spans].sort((a,b)=>score(b.text)-score(a.text))[0]?.text??passage.split(/\n/)[0]??'',sourceWords=sourceSpan.match(/[A-Za-z]+|[^A-Za-z\s]+/g)??[],choiceWords=option.match(/[A-Za-z]+|[^A-Za-z\s]+/g)??[],length=Math.max(sourceWords.length,choiceWords.length),aligned=Array.from({length},(_,i)=>({id:`align-${i}`,source:sourceWords[i]??'—',option:choiceWords[i]??'—'})).filter(x=>x.source.toLowerCase()!==x.option.toLowerCase());return{sourceSpan,aligned}}

export function projectExamLearnerActionV1(input:Input):LearnerActionSurface{
  const b=base(input),payload=input.task.payload,text=source(input.task),question=firstQuestion(input.task),target=String(input.decision.blockDecision.configuration.targetSpan??''),selected=input.learnerResponse;
  if(input.task.family==='VOCABULARY'){
    if(input.interaction.blockId==='clarify-context')return{...b,kind:'MEANING_CONTRAST',sentence:question?.prompt??text,contrasts:contrastItems(input),selectedAnswer:selected};
    if(input.interaction.mode==='EVIDENCE_SELECT')return{...b,kind:'EVIDENCE',passage:question?.prompt??text,spans:sentenceSpans(question?.prompt??text),single:true,selectedAnswer:selected};
    if(input.interaction.blockId.includes('collocation'))return{...b,kind:'COLLOCATION',heads:contrastItems(input).map(x=>({id:x.id,label:x.word})),collocates:[{id:'seat',label:'seat'},{id:'table',label:'table'},{id:'file',label:'file'},{id:'building',label:'building'}]};
    if(input.interaction.blockId.includes('morphology'))return{...b,kind:'WORD_BUILD',original:selected??'',pieces:contrastItems(input).map(x=>({id:x.id,label:x.word}))};
    return{...b,kind:'MEANING_CONTRAST',sentence:question?.prompt??text,contrasts:contrastItems(input),selectedAnswer:selected};
  }
  if(input.task.family==='COMPREHENSIVE'){
    const blanks=payload.blanks as {id:string;options?:unknown}[]|undefined,blank=blanks?.[0];
    return{...b,kind:'SLOT',sentence:text,blankId:blank?.id??'1',candidates:options(blank?.options??input.interaction.options),placed:selected};
  }
  if(input.task.family==='CONTEXTUAL_FILL')return{...b,kind:'SLOT',sentence:text,blankId:String((payload.blanks as unknown[]|undefined)?.[0]??'1'),candidates:options(payload.options),placed:selected};
  if(input.task.family==='DISCOURSE'){
    const candidates=options(payload.sentenceOptions),candidate=candidates.find(x=>x.id===selected)?.label??candidates[0]?.label??'';
    if(input.interaction.mode==='REFERENCE_LINK')return{...b,kind:'REFERENCE_TRACE',passage:text,reference:candidate.match(/\b(this|these|it|they|such(?: a change)?|the problem|this approach)\b/i)?.[0]??'this',antecedents:sentenceSpans(text)};
    return{...b,kind:'INSERTION',passage:text,candidate,points:(payload.blanks as string[]|undefined)?.map(id=>({id,label:`___${id}___`}))??[],placed:selected};
  }
  if(input.task.family==='READING'){
    if(input.interaction.mode==='COMPARE'||input.decision.treatmentResponse){
      const choices=options(question?.options),wrong=choices.find(x=>x.id===selected)??choices[0],comparison=readingAlignment(text,wrong?.label??'');
      return{...b,kind:'READING_COMPARE',sourceSpan:comparison.sourceSpan,selectedOption:wrong?.label??String(selected??''),aligned:comparison.aligned};
    }
    const choices=options(question?.options),wrong=choices.find(x=>x.id===selected)?.label??String(selected??'');
    return{...b,kind:'READING_EVIDENCE',passage:text,spans:sentenceSpans(text),selectedOption:wrong};
  }
  if(input.task.family==='MIXED'){
    if(input.interaction.mode==='MARK')return{...b,kind:'SOURCE_TRACE',source:text,regions:text.split(/\n+/).filter(Boolean).map((part,index)=>({id:`source-${index}`,text:part}))};
    return{...b,kind:'SOURCE_TRANSFORM',source:text,goal:input.interaction.prompt};
  }
  const authored=selected??String(input.decision.lineage?.context.sourceTaskContext?.previousLearnerResponse??'');
  if(input.task.family==='TRANSLATION')return{...b,kind:'TRANSLATION_EDITOR',sourceZh:String((payload.chineseSentences as string[]|undefined)?.[0]??''),authoredText:authored,targetSpan:target||authored};
  if(input.task.family==='WRITING'){
    if(input.interaction.blockId==='idea-development-ladder')return{...b,kind:'WRITING_DEVELOPMENT',authoredText:authored,targetSpan:target||authored,missing:'SPECIFIC_DETAIL'};
    return{...b,kind:'WRITING_EDITOR',prompt:String(payload.prompt??''),authoredText:authored,targetSpan:target||authored};
  }
  const real=options(question?.options??input.interaction.options);
  if(real.length)return{...b,kind:'CHOICE',sentence:question?.prompt??text,choices:real,selectedAnswer:selected};
  return{...b,kind:'RECALL',context:text,clues:[]};
}
