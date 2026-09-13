import type{ProviderFailureKindV1,ProviderFailureV1,ReliabilityOperationV1}from'./types';

export class ProviderRequestErrorV1 extends Error{
  readonly failure:ProviderFailureV1;
  constructor(failure:ProviderFailureV1,cause?:unknown){
    super(failure.diagnosticCode,{cause});
    this.name='ProviderRequestErrorV1';
    this.failure=Object.freeze({...failure});
  }
}

const httpKind=(status:number):ProviderFailureKindV1=>
  status===408?'TIMEOUT':
  status===429?'RATE_LIMITED':
  status>=500?'SERVER_UNAVAILABLE':
  status>=400?'CLIENT_REJECTED':'UNKNOWN';

export function providerFailureFromHttpV1(operation:ReliabilityOperationV1,status:number,requestId?:string):ProviderFailureV1{
  const kind=httpKind(status);
  return Object.freeze({
    kind,operation,httpStatus:status,requestId,
    retryable:kind==='TIMEOUT'||kind==='RATE_LIMITED'||kind==='SERVER_UNAVAILABLE',
    automaticRetry:false,
    safeForLearner:true,
    diagnosticCode:`provider_${kind.toLowerCase()}`,
  });
}

export function providerFailureFromThrownV1(operation:ReliabilityOperationV1,error:unknown,requestId?:string):ProviderFailureV1{
  if(error instanceof ProviderRequestErrorV1)return error.failure;
  const name=typeof error==='object'&&error?String((error as{ name?:unknown}).name??''):'';
  const message=error instanceof Error?error.message:String(error??'');
  const kind:ProviderFailureKindV1=
    name==='AbortError'||/timeout|aborted/i.test(message)?'TIMEOUT':
    /unconfigured/i.test(message)?'UNCONFIGURED':
    /invalid.*config/i.test(message)?'INVALID_CONFIG':
    /network|failed to fetch|network request failed|load failed/i.test(message)?'NETWORK':
    /invalid.*response|invalid.*json|unexpected.*json|empty_output/i.test(message)?'INVALID_RESPONSE':
    'UNKNOWN';
  return Object.freeze({
    kind,operation,requestId,
    retryable:kind==='NETWORK'||kind==='TIMEOUT',
    automaticRetry:false,
    safeForLearner:true,
    diagnosticCode:`provider_${kind.toLowerCase()}`,
  });
}

export function learnerRecoveryMessageV1(failure:ProviderFailureV1):string{
  if(failure.kind==='UNCONFIGURED'||failure.kind==='INVALID_CONFIG')return'目前無法連上教學服務。你的作品已保留，可以稍後再試。';
  if(failure.kind==='INVALID_RESPONSE')return'這次回應無法安全使用，沒有把它當成你的學習結果。可以再試一次。';
  if(failure.kind==='RATE_LIMITED')return'教學服務目前比較忙。你的進度已保留，可以再試一次。';
  return'這次連線沒有完成。你的進度已保留，可以再試一次。';
}

export function providerFailureLearnerMessageV1(error:unknown,operation:ReliabilityOperationV1):string{
  return learnerRecoveryMessageV1(providerFailureFromThrownV1(operation,error));
}
