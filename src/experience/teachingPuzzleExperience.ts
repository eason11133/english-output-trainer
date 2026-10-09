import { teachingPuzzleDefinitionV1, type TeachingPuzzleInstanceV1 } from '../teaching';

export type TeachingPuzzleExperienceKindV1=
  |'CONTRAST'
  |'RELATION_MAP'
  |'WORKED_TRANSFORMATION'
  |'CHUNK_BUILD'
  |'EVIDENCE_BRIDGE'
  |'REFORMULATION';

interface BaseTeachingPuzzleExperienceV1{
  instanceId:string;
  puzzleId:string;
  mechanismId:string;
  support:string;
  kind:TeachingPuzzleExperienceKindV1;
  instruction:string;
  primaryInteraction:string;
}

export type TeachingPuzzleExperienceVMV1=
  |(BaseTeachingPuzzleExperienceV1&{kind:'CONTRAST';left:string;right:string;context?:string;criterion?:string})
  |(BaseTeachingPuzzleExperienceV1&{kind:'RELATION_MAP';nodes:readonly {id:string;label:string}[];edges:readonly {from:string;to:string;label?:string}[];learnerOutput?:string})
  |(BaseTeachingPuzzleExperienceV1&{kind:'WORKED_TRANSFORMATION';learnerOutput:string;steps:readonly string[];targetLanguage?:string})
  |(BaseTeachingPuzzleExperienceV1&{kind:'CHUNK_BUILD';targetLanguage:string;partners:readonly string[];examples:readonly string[];context?:string})
  |(BaseTeachingPuzzleExperienceV1&{kind:'EVIDENCE_BRIDGE';sourceText:string;prompt:string;evidenceSpans:readonly string[];relations:readonly {from:string;to:string;label?:string}[]})
  |(BaseTeachingPuzzleExperienceV1&{kind:'REFORMULATION';meaning:string;learnerOutput?:string;alternatives:readonly string[];context?:string});

export type TeachingPuzzleExperienceProjectionV1=
  |{status:'READY';vm:TeachingPuzzleExperienceVMV1}
  |{status:'UNAVAILABLE';reasonCodes:readonly string[]};

const text=(value:unknown)=>{
  if(typeof value==='string')return value.trim();
  if(value&&typeof value==='object'){
    const row=value as Record<string,unknown>;
    for(const key of ['text','label','value','content'])if(typeof row[key]==='string'&&String(row[key]).trim())return String(row[key]).trim();
  }
  return'';
};

const texts=(value:unknown)=>Array.isArray(value)?value.map(text).filter(Boolean):text(value)?[text(value)]:[];

const nodes=(value:unknown)=>{
  if(!Array.isArray(value))return[];
  return value.map((item,index)=>{
    if(typeof item==='string')return{id:`node-${index}`,label:item};
    if(item&&typeof item==='object'){
      const row=item as Record<string,unknown>;
      const label=text(row.label??row.text??row.value);
      if(!label)return undefined;
      return{id:typeof row.id==='string'&&row.id.trim()?row.id:`node-${index}`,label};
    }
    return undefined;
  }).filter((item):item is {id:string;label:string}=>Boolean(item));
};

const edges=(value:unknown)=>{
  if(!Array.isArray(value))return[];
  return value.map(item=>{
    if(typeof item==='string'){
      const parts=item.split('->').map(part=>part.trim()).filter(Boolean);
      return parts.length>=2?{from:parts[0],to:parts[1]}:undefined;
    }
    if(item&&typeof item==='object'){
      const row=item as Record<string,unknown>,from=text(row.from),to=text(row.to),label=text(row.label);
      if(!from||!to)return undefined;
      return label?{from,to,label}:{from,to};
    }
    return undefined;
  }).filter((item):item is {from:string;to:string;label?:string}=>Boolean(item));
};

const base=(instance:TeachingPuzzleInstanceV1,kind:TeachingPuzzleExperienceKindV1,instruction:string):BaseTeachingPuzzleExperienceV1=>{
  const definition=teachingPuzzleDefinitionV1(instance.puzzleId);
  return{
    instanceId:instance.instanceId,
    puzzleId:instance.puzzleId,
    mechanismId:instance.mechanismId,
    support:instance.support,
    kind,
    instruction,
    primaryInteraction:definition?.interaction.primary??'UNKNOWN',
  };
};

/**
 * Pure learner-experience projection.
 *
 * This function never chooses pedagogy or changes support. It only translates
 * an already-selected, already-bound TeachingPuzzleInstance into a UI view
 * model. Missing semantic content fails closed.
 */
export function projectTeachingPuzzleExperienceV1(instance:TeachingPuzzleInstanceV1):TeachingPuzzleExperienceProjectionV1{
  const content=instance.content;
  if(instance.puzzleId==='contrast-boundary'){
    const left=text(content.left),right=text(content.right);
    if(!left||!right)return{status:'UNAVAILABLE',reasonCodes:['CONTRAST_CONTENT_MISSING']};
    return{status:'READY',vm:{...base(instance,'CONTRAST','先看兩邊，找出真正影響選擇的差別。'),left,right,context:text(content.context)||undefined,criterion:text(content.criterion)||undefined}};
  }
  if(instance.puzzleId==='relation-map'){
    const mappedNodes=nodes(content.nodes),mappedEdges=edges(content.edges);
    if(mappedNodes.length<2||!mappedEdges.length)return{status:'UNAVAILABLE',reasonCodes:['RELATION_CONTENT_MISSING']};
    return{status:'READY',vm:{...base(instance,'RELATION_MAP','先把兩個單位連起來，再看它們的關係。'),nodes:mappedNodes,edges:mappedEdges,learnerOutput:text(content.learnerOutput)||undefined}};
  }
  if(instance.puzzleId==='worked-transformation'){
    const learnerOutput=text(content.learnerOutput),steps=texts(content.steps);
    if(!learnerOutput||!steps.length)return{status:'UNAVAILABLE',reasonCodes:['TRANSFORMATION_CONTENT_MISSING']};
    return{status:'READY',vm:{...base(instance,'WORKED_TRANSFORMATION','一次只看一個變化；看懂操作後再由你自己重建。'),learnerOutput,steps,targetLanguage:text(content.targetLanguage)||undefined}};
  }
  if(instance.puzzleId==='chunk-build'){
    const targetLanguage=text(content.targetLanguage),partners=texts(content.partners),examples=texts(content.examples);
    if(!targetLanguage||!partners.length)return{status:'UNAVAILABLE',reasonCodes:['CHUNK_CONTENT_MISSING']};
    return{status:'READY',vm:{...base(instance,'CHUNK_BUILD','把會一起出現的語言單位當成一組來處理。'),targetLanguage,partners,examples,context:text(content.context)||undefined}};
  }
  if(instance.puzzleId==='evidence-bridge'){
    const sourceText=text(content.sourceText),prompt=text(content.prompt),evidenceSpans=texts(content.evidenceSpans),relations=edges(content.relations);
    if(!sourceText||!prompt||!evidenceSpans.length)return{status:'UNAVAILABLE',reasonCodes:['EVIDENCE_CONTENT_MISSING']};
    return{status:'READY',vm:{...base(instance,'EVIDENCE_BRIDGE','先選證據，再決定它到底支持哪個判斷。'),sourceText,prompt,evidenceSpans,relations}};
  }
  if(instance.puzzleId==='reformulation-space'){
    const meaning=text(content.meaning),alternatives=texts(content.alternatives);
    if(!meaning||!alternatives.length)return{status:'UNAVAILABLE',reasonCodes:['REFORMULATION_CONTENT_MISSING']};
    return{status:'READY',vm:{...base(instance,'REFORMULATION','先守住原意，再比較不同英文怎麼表達同一件事。'),meaning,learnerOutput:text(content.learnerOutput)||undefined,alternatives,context:text(content.context)||undefined}};
  }
  return{status:'UNAVAILABLE',reasonCodes:['PUZZLE_EXPERIENCE_NOT_IMPLEMENTED']};
}
