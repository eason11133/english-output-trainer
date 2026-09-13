import{ProviderRequestErrorV1}from'./providerFailure';
import type{ProviderFailureV1,ReliabilityOperationV1}from'./types';

export type ReleaseModeV1='DEVELOPMENT'|'PRODUCTION';

const localHost=(hostname:string)=>hostname==='localhost'||hostname==='127.0.0.1'||hostname==='::1'||/^10\./.test(hostname)||/^192\.168\./.test(hostname)||/^172\.(1[6-9]|2\d|3[01])\./.test(hostname);

export function validateCoachEndpointV1(raw:string|undefined,mode:ReleaseModeV1):{valid:true;url:string}|{valid:false;failure:ProviderFailureV1}{
  if(!raw?.trim())return{valid:false,failure:{kind:'UNCONFIGURED',operation:'HEALTH_CHECK',retryable:false,automaticRetry:false,safeForLearner:true,diagnosticCode:'coach_endpoint_missing'}};
  let url:URL;
  try{url=new URL(raw.trim())}catch{return{valid:false,failure:{kind:'INVALID_CONFIG',operation:'HEALTH_CHECK',retryable:false,automaticRetry:false,safeForLearner:true,diagnosticCode:'coach_endpoint_invalid_url'}}}
  if(!['http:','https:'].includes(url.protocol))return{valid:false,failure:{kind:'INVALID_CONFIG',operation:'HEALTH_CHECK',retryable:false,automaticRetry:false,safeForLearner:true,diagnosticCode:'coach_endpoint_invalid_protocol'}};
  if(mode==='PRODUCTION'&&url.protocol!=='https:')return{valid:false,failure:{kind:'INVALID_CONFIG',operation:'HEALTH_CHECK',retryable:false,automaticRetry:false,safeForLearner:true,diagnosticCode:'coach_endpoint_https_required'}};
  if(mode==='DEVELOPMENT'&&url.protocol==='http:'&&!localHost(url.hostname))return{valid:false,failure:{kind:'INVALID_CONFIG',operation:'HEALTH_CHECK',retryable:false,automaticRetry:false,safeForLearner:true,diagnosticCode:'coach_endpoint_http_requires_local_network'}};
  return{valid:true,url:url.toString().replace(/\/$/,'')};
}

export function requireCoachEndpointV1(raw:string|undefined,mode:ReleaseModeV1,operation:ReliabilityOperationV1='HEALTH_CHECK'):string{
  const result=validateCoachEndpointV1(raw,mode);
  if(result.valid)return result.url;
  throw new ProviderRequestErrorV1({...result.failure,operation});
}
