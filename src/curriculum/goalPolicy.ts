import type { ProductContextV1 } from '../architecture/contracts';
import type { EnglishDomainArea } from '../domain/english/EnglishDomainGraph';

export interface GoalPolicySignalsV1{
  areaWeights:Readonly<Record<EnglishDomainArea,number>>;
  priorityAreas:readonly EnglishDomainArea[];
  reasonCodes:readonly ('GOAL_RELEVANT'|'USE_CONTEXT_RELEVANT'|'LEARNER_PRIORITY')[];
}

const areas:readonly EnglishDomainArea[]=['LEXICAL','FORMULAIC','GRAMMAR','MEANING_ENCODING','WRITING','TRANSLATION','READING','DISCOURSE'];

function blankWeights():Record<EnglishDomainArea,number>{
  return Object.fromEntries(areas.map(area=>[area,0])) as Record<EnglishDomainArea,number>;
}

const add=(weights:Record<EnglishDomainArea,number>,values:Partial<Record<EnglishDomainArea,number>>)=>{
  for(const [area,value] of Object.entries(values) as [EnglishDomainArea,number][])weights[area]+=value;
};

const priorityAreasFor=(priority?:string):EnglishDomainArea[]=>{
  switch(priority){
    case 'WRITING': return ['WRITING','DISCOURSE','MEANING_ENCODING','GRAMMAR','LEXICAL','FORMULAIC'];
    case 'TRANSLATION': return ['TRANSLATION','MEANING_ENCODING','LEXICAL','GRAMMAR','FORMULAIC','READING'];
    case 'VOCABULARY': return ['LEXICAL','FORMULAIC','MEANING_ENCODING'];
    case 'GRAMMAR': return ['GRAMMAR','MEANING_ENCODING'];
    case 'READING': return ['READING','DISCOURSE','LEXICAL'];
    case 'EXAM_TASK': return ['WRITING','TRANSLATION','READING','GRAMMAR','LEXICAL','DISCOURSE'];
    default:return[];
  }
};

export function deriveGoalPolicySignalsV1(context:ProductContextV1):GoalPolicySignalsV1{
  const weights=blankWeights();
  add(weights,{WRITING:8,TRANSLATION:8,MEANING_ENCODING:8,GRAMMAR:6,LEXICAL:6,FORMULAIC:6,READING:4,DISCOURSE:4});
  const reasons=new Set<GoalPolicySignalsV1['reasonCodes'][number]>();

  switch(context.learningPurpose){
    case 'WORK': add(weights,{WRITING:9,FORMULAIC:7,LEXICAL:6,MEANING_ENCODING:8,DISCOURSE:5}); reasons.add('GOAL_RELEVANT'); break;
    case 'TRAVEL': add(weights,{FORMULAIC:9,LEXICAL:8,MEANING_ENCODING:8,READING:4}); reasons.add('GOAL_RELEVANT'); break;
    case 'SCHOOL': add(weights,{WRITING:8,READING:8,TRANSLATION:7,GRAMMAR:7,DISCOURSE:6}); reasons.add('GOAL_RELEVANT'); break;
    case 'EXAM': add(weights,{WRITING:9,TRANSLATION:9,READING:9,GRAMMAR:8,LEXICAL:7,DISCOURSE:7}); reasons.add('GOAL_RELEVANT'); break;
    case 'PERSONAL_PROJECT': add(weights,{WRITING:8,MEANING_ENCODING:8,LEXICAL:6}); reasons.add('GOAL_RELEVANT'); break;
    case 'GENERAL_ENGLISH': add(weights,{MEANING_ENCODING:6,WRITING:5,TRANSLATION:5,READING:5,LEXICAL:5,FORMULAIC:5,GRAMMAR:5}); reasons.add('GOAL_RELEVANT'); break;
  }

  for(const use of context.useContexts){
    if(use==='WRITING'||use==='WORK_MESSAGES')add(weights,{WRITING:10,DISCOURSE:6,MEANING_ENCODING:7});
    if(use==='TRANSLATION')add(weights,{TRANSLATION:10,MEANING_ENCODING:8,LEXICAL:5,GRAMMAR:5});
    if(use==='READING')add(weights,{READING:10,LEXICAL:5,DISCOURSE:5});
    if(use==='SCHOOLWORK')add(weights,{WRITING:7,READING:7,TRANSLATION:6,GRAMMAR:5});
    if(use==='EXAM_TASKS')add(weights,{WRITING:8,TRANSLATION:8,READING:8,GRAMMAR:6,LEXICAL:5});
    if(use==='MEETINGS'||use==='DAILY_LIFE'||use==='TRAVEL')add(weights,{FORMULAIC:8,LEXICAL:7,MEANING_ENCODING:7});
    reasons.add('USE_CONTEXT_RELEVANT');
  }

  const priorityAreas=priorityAreasFor(context.currentPriority);
  if(priorityAreas.length){
    priorityAreas.forEach((area,index)=>{weights[area]+=Math.max(14-index*2,4)});
    reasons.add('LEARNER_PRIORITY');
  }

  return{areaWeights:Object.freeze(weights),priorityAreas:Object.freeze(priorityAreas),reasonCodes:Object.freeze([...reasons])};
}
