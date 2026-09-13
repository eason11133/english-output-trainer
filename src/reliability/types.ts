export type ProviderFailureKindV1=
  'UNCONFIGURED'|'INVALID_CONFIG'|'NETWORK'|'TIMEOUT'|'RATE_LIMITED'|'CLIENT_REJECTED'|'SERVER_UNAVAILABLE'|'INVALID_RESPONSE'|'UNKNOWN';

export type ReliabilityOperationV1='TEACHER_DECISION'|'TRANSCRIPTION'|'HEALTH_CHECK';

export interface ProviderFailureV1{
  kind:ProviderFailureKindV1;
  operation:ReliabilityOperationV1;
  httpStatus?:number;
  requestId?:string;
  retryable:boolean;
  automaticRetry:false;
  safeForLearner:boolean;
  diagnosticCode:string;
}

export interface ReliabilityEventV1{
  event:
    'REQUEST_STARTED'|'REQUEST_SUCCEEDED'|'REQUEST_FAILED'|'FALLBACK_USED'|
    'CONFIG_REJECTED'|'LIFECYCLE_RECOVERY'|'DUPLICATE_SUPPRESSED';
  operation:ReliabilityOperationV1|'LESSON_SESSION';
  requestId?:string;
  occurredAt:string;
  durationMs?:number;
  failureKind?:ProviderFailureKindV1;
  httpStatus?:number;
  retryable?:boolean;
  diagnosticCode?:string;
  metadata?:Readonly<Record<string,string|number|boolean|null>>;
}

export interface ReliabilityPolicyV1{
  automaticClientRetry:false;
  teacherDecisionFailure:'DETERMINISTIC_E_FALLBACK';
  transcriptionFailure:'PRESERVE_ARTIFACT_AND_USER_RETRY';
  invalidResponse:'REJECT_WITHOUT_LEARNER_TRUTH_MUTATION';
  publicClientSecretsForbidden:true;
}
