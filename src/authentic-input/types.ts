import type { ArtifactModeV4, ArtifactSpanV4, IntakeSourceV4, OriginalArtifactV4 } from '../domain/stage4/LearnerRuntimeV4';

export type AuthenticMaterialSourceKindV1='LEARNER_OWNED'|'SCHOOL_OWNED'|'TEACHER_OWNED'|'EXAM'|'REAL_WORLD'|'UNKNOWN';
export type AuthenticMaterialRoleV1='PROMPT'|'RUBRIC'|'LEARNER_WORK'|'TRANSLATION_SOURCE'|'TEACHER_ANNOTATION'|'UNKNOWN_REGION';
export type AuthenticInputIntegrityV1='READY'|'REVIEW_REQUIRED';

export interface AuthenticMaterialPartV1{
  role:AuthenticMaterialRoleV1;
  text:string;
  provenance:'DIRECT_USER_INPUT'|'OCR_CONFIRMED'|'OCR_UNCONFIRMED'|'ARTIFACT_FIELD';
  confidence:'LOW'|'MEDIUM'|'HIGH';
  spanIds:readonly string[];
  teachingEligible:boolean;
}

export interface AuthenticInputBundleV1{
  schemaVersion:1;
  artifact:OriginalArtifactV4;
  mode:ArtifactModeV4;
  captureMethod:IntakeSourceV4;
  sourceKind:AuthenticMaterialSourceKindV1;
  parts:readonly AuthenticMaterialPartV1[];
  learnerWorkText:string;
  promptText?:string;
  rubricText?:string;
  translationSourceText?:string;
  decisionRelevantUncertaintySpanIds:readonly string[];
  quarantinedSpanIds:readonly string[];
  integrity:AuthenticInputIntegrityV1;
  immutableOriginal:true;
  capabilityEvidenceAllowed:false;
}

export interface NormalizeAuthenticInputV1{
  artifact:OriginalArtifactV4;
  spans:readonly ArtifactSpanV4[];
  sourceKind?:AuthenticMaterialSourceKindV1;
  directPromptText?:string;
  directRubricText?:string;
  directTranslationSourceText?:string;
}
