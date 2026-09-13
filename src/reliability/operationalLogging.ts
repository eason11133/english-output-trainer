import type{ReliabilityEventV1}from'./types';

export type ReliabilityEventSinkV1=(event:ReliabilityEventV1)=>void|Promise<void>;

const safeMetadata=(metadata:ReliabilityEventV1['metadata'])=>{
  if(!metadata)return undefined;
  const out:Record<string,string|number|boolean|null>={};
  for(const[key,value]of Object.entries(metadata)){
    if(/text|answer|writing|translation|prompt|content|base64|token|secret|key/i.test(key))continue;
    out[key]=value;
  }
  return Object.freeze(out);
};

export function safeReliabilityEventV1(event:ReliabilityEventV1):ReliabilityEventV1{
  return Object.freeze({...event,metadata:safeMetadata(event.metadata)});
}

export function recordReliabilityEventV1(sink:ReliabilityEventSinkV1|undefined,event:ReliabilityEventV1):void{
  if(!sink)return;
  const safe=safeReliabilityEventV1(event);
  try{void sink(safe)}catch{/* operational logging must never break learner runtime */}
}
