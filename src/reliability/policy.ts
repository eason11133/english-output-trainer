import type{ReliabilityPolicyV1}from'./types';

export const eotReliabilityPolicyV1:ReliabilityPolicyV1=Object.freeze({
  automaticClientRetry:false,
  teacherDecisionFailure:'DETERMINISTIC_E_FALLBACK',
  transcriptionFailure:'PRESERVE_ARTIFACT_AND_USER_RETRY',
  invalidResponse:'REJECT_WITHOUT_LEARNER_TRUTH_MUTATION',
  publicClientSecretsForbidden:true,
});
