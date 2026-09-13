import{randomUUID}from'node:crypto';

export function requestIdV1(req){const supplied=String(req.headers['x-eot-request-id']||'').trim();return supplied&&supplied.length<=120?supplied:`srv-${randomUUID()}`}

export function classifyServerFailureV1(error){
  const name=String(error?.name||''),message=String(error?.message||'');
  if(name==='AbortError'||/timeout|aborted/i.test(message))return{status:408,code:'timeout',retryable:true};
  const m=message.match(/provider_(\d{3})/),status=m?Number(m[1]):0;
  if(status===429)return{status:429,code:'rate_limited',retryable:true};
  if(status>=500)return{status:503,code:'provider_unavailable',retryable:true};
  if(status>=400)return{status:502,code:'provider_rejected',retryable:false};
  if(/empty_output|invalid.*schema|invalid.*decision|JSON|json/i.test(message))return{status:502,code:'invalid_provider_response',retryable:false};
  if(/missing_server_config/i.test(message))return{status:503,code:'server_unconfigured',retryable:false};
  return{status:503,code:'unavailable',retryable:true};
}

export function sendFailureV1(res,error,requestId){
  const failure=classifyServerFailureV1(error);
  res.writeHead(failure.status,{'content-type':'application/json','x-eot-request-id':requestId});
  res.end(JSON.stringify({error:failure.code,retryable:failure.retryable,requestId}));
  return failure;
}

export function safeServerEventV1(event){
  const out={};
  for(const[key,value]of Object.entries(event||{})){
    if(/text|answer|writing|translation|prompt|content|base64|authorization|token|secret|key/i.test(key))continue;
    out[key]=value;
  }
  return out;
}
