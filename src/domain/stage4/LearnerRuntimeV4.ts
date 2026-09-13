import { EvidenceCandidateV3 } from '../evidence/EvidenceCandidateV3';
import { LearnerObservationV1 } from '../../learner-truth/observation';
import { BlockLearnerEventV4, BlockRuntimeStateV4, TeacherBlockDecisionV4 } from '../v4/LearningBlockV4';
import type { TeacherDecisionProvenanceV1 } from '../../teacher-runtime/types';

export type IntakeSourceV4 = 'CAMERA'|'GALLERY'|'PDF'|'PASTE'|'DIRECT_TEXT';
export type ArtifactModeV4 = 'WRITING'|'TRANSLATION'|'READING';
export type ArtifactRegionV4 = 'LEARNER_WRITING'|'TEACHER_ANNOTATION'|'PRINTED_PROMPT'|'UNKNOWN';

export interface OriginalArtifactPageV4 {
  page: number;
  uri?: string;
  mimeType: string;
  originalText?: string;
  width?: number;
  height?: number;
}
export interface OriginalArtifactV4 {
  schemaVersion: 4;
  id: string;
  learnerId: string;
  source: IntakeSourceV4;
  mode: ArtifactModeV4;
  pages: readonly Readonly<OriginalArtifactPageV4>[];
  chineseSource?: string;
  submittedAt: string;
  immutable: true;
}
export interface ArtifactSpanV4 {
  id: string;
  artifactId: string;
  region: ArtifactRegionV4;
  text: string;
  confidence: 'LOW'|'MEDIUM'|'HIGH';
  alternatives: string[];
  location?: {page:number;x:number;y:number;width:number;height:number};
}
export interface SourceConfirmationV4 {
  id: string;
  artifactId: string;
  spanId: string;
  observedText: string;
  confirmedText: string;
  occurredAt: string;
  eventType: 'OCR_ERROR_CORRECTED'|'TRANSCRIPT_CONFIRMED';
}
export interface RuntimeTraceEntryV4 {
  id:string;
  occurredAt:string;
  kind:'ARTIFACT_CREATED'|'TRANSCRIPTION_RECORDED'|'SOURCE_CONFIRMATION'|'TEACHER_DECISION'|'EXPERIENCE_ACTION'|'BLOCK_EVENT'|'EVIDENCE_GUARD'|'EVIDENCE_COMMITTED'|'INTERPRETATION_CORRECTED'|'DRAFT_SAVED'|'PAUSED'|'RESUMED';
  fixture:boolean;
  payload:Record<string,unknown>;
}
export interface Stage4RuntimeV4 {
  id:string;
  learnerId:string;
  artifact:OriginalArtifactV4;
  spans:ArtifactSpanV4[];
  confirmations:SourceConfirmationV4[];
  usableSourceText:string;
  learnerDraft?:{schemaVersion:1;text:string;updatedAt:string};
  interpretation?:string;
  status:'SOURCE_REVIEW'|'READY'|'LEARNING'|'PAUSED'|'RETURNED'|'COMPLETED';
  tutorSession?:{startedAt:string;budgetMinutes:number;pausedAt?:string;accumulatedPausedMs:number;endedAt?:string};
  sessionControl?:{schemaVersion:1;lifecycle:'ACTIVE'|'PAUSED'|'BACKGROUND'|'CLOSED';pausedFromStatus?:'SOURCE_REVIEW'|'READY'|'LEARNING';lastBackgroundAt?:string;lastForegroundAt?:string;closedAt?:string;closeReason?:'RETURNED_TO_SOURCE'|'STOPPED'|'EXITED'|'TIME_EXHAUSTED'};
  experienceState?:'ORIGINAL_TASK'|'INTERVENTION'|'RETURNED_TO_TASK'|'STOPPED'|'EXITED';
  decision?:TeacherBlockDecisionV4;
  decisionProvenance?:TeacherDecisionProvenanceV1;
  pendingTeacherContinuation?:{schemaVersion:1;continuationId:string;actionIdentity:string;eventId:string;status:'PENDING'};
  blockState?:BlockRuntimeStateV4;
  blockEvents:BlockLearnerEventV4[];
  observations:LearnerObservationV1[];
  evidenceCandidates:EvidenceCandidateV3[];
  trace:RuntimeTraceEntryV4[];
  readingReview?:{schemaVersion:1;reviewId:string;originalAttemptId:string;originalAttemptSnapshot:string;passage:string;question:string;submittedAnswer:string;focus:{kind:string;anchorText:string;reasonRef:string};assessment:{mode:string;submittedAt:string;resultCommittedAt:string};immutable:true};
}
