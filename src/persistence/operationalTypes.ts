import type { ExperienceContractV1, LessonPlanV1 } from '../architecture/contracts';
import type { CanonicalEvidenceEventV3, EvidenceCandidateV3 } from '../domain/evidence/EvidenceCandidateV3';
import type { Stage4RuntimeV4 } from '../domain/stage4/LearnerRuntimeV4';
import type { LearnerObservationV1 } from '../learner-truth/observation';
import type { ProductProfileV2 } from '../product';
import type { PedagogicalContextV1, QualifiedInnerTutorDecisionV1, TreatmentResponseV1 } from '../teacher-runtime/types';

export type U1ElicitationCondition='TARGET_NAMED'|'FUNCTION_CUED'|'OPEN_CHOICE'|'AUTHENTIC'|'UNKNOWN';

export interface CommandEnvelopeV1 {
  operationId:string;
  learnerId:string;
  occurredAt:string;
  inputFingerprint:string;
  causationId?:string;
  correlationId?:string;
}

export interface ExamOperationalRuntimeV1 {
  schemaVersion:1;
  runtimeKind:'EXAM';
  id:string;
  learnerId:string;
  taskId:string;
  contentHash:string;
  bindingVersion:'exam-binding-v1';
  attemptId:string;
  submitActionId:string;
  submittedAt?:string;
  family:string;
  subtype:string;
  status:'LEARNING'|'PAUSED'|'COMPLETED';
  phase:'ANSWERING'|'TEACHER_INTERACTION'|'COMPLETED';
  startedAt:string;
  updatedAt:string;
  endedAt?:string;
  responses:Readonly<Record<string,string>>;
  activeBlankId:string;
  sourceOpen:boolean;
  interactionText:string;
  learnerActionState?:Readonly<Record<string,unknown>>;
  teacherMessage:string;
  teacherDecision?:QualifiedInnerTutorDecisionV1;
  activeInteraction?:{schemaVersion:1;interactionId:string;decisionPointId:string;blockId:string;mechanismId:string;mode:string;title:string;prompt:string;placeholder?:string;options?:readonly {id:string;label:string}[];support:string;mustAct:true;answerLeakageForbidden:true};
  decisionHistory:readonly {decisionPointId:string;mechanismId:string;support:string;decidedAt:string}[];
  interactionEvaluations?:readonly Readonly<Record<string,unknown>>[];
  lookupExposure:readonly string[];
  support:'NONE'|'LIGHT'|'MEDIUM'|'EXPLICIT'|'MODEL'|'UNKNOWN';
  freshnessIdentity:string;
}
export type OperationalSessionRuntimeV1=Stage4RuntimeV4|ExamOperationalRuntimeV1;

export interface CommitResultV1 {operationId:string;entityId:string;status:'COMMITTED'|'IDEMPOTENT_REPLAY'|'DEDUPLICATED'}
export interface ProductMutationCommandV1 {envelope:CommandEnvelopeV1;profile:ProductProfileV2}
export interface ArtifactIntakeCommandV1 {envelope:CommandEnvelopeV1;artifactId:string;pageIndex:number;objectId:string;sha256:string;byteSize:number;mimeType:string;storagePath:string;sourceKind:string;mode:'WRITING'|'TRANSLATION';originalUri?:string;metadata:unknown}
export interface SessionCheckpointCommandV1 {envelope:CommandEnvelopeV1;lessonPlan:LessonPlanV1;runtime:OperationalSessionRuntimeV1}
export interface RetentionNeedCheckpointCommandV1 {envelope:CommandEnvelopeV1;need:{needId:string;learnerId:string;targetRef:string;facet:string;senseId?:string;state:string;dueAt:string;updatedAt:string}}
export interface EvidenceChainCommandV1 {
  envelope:CommandEnvelopeV1;
  observation:LearnerObservationV1;
  evaluation:{id:string;evaluatorId:string;evaluatorVersion:string;result:unknown};
  candidate:{id:string;value:EvidenceCandidateV3};
  admission:{id:string;accepted:boolean;reasonCodes:readonly string[];authority:'C'|'K'|'C/K'};
  canonicalEvidence?:CanonicalEvidenceEventV3;
  conditions:{elicitation:U1ElicitationCondition;supportCeiling:string;supportVisibleBeforeResponse:string;answerExposed:boolean;recentModelPrime:boolean;exposureRef?:string;contextProvenance:string;freshIndependentEligible:boolean;taskId?:string;opportunityId?:string};
  sessionCheckpoint?:{lessonPlan:LessonPlanV1;runtime:Stage4RuntimeV4}|{lessonPlan:LessonPlanV1;runtime:ExamOperationalRuntimeV1};
}
export interface TeacherLineageCommandV1 {
  envelope:CommandEnvelopeV1;
  context:{id:string;value:PedagogicalContextV1};
  modelRun:{id:string;provider:string;model:string;promptVersion:string;requestHash:string;responseHash?:string;status:'SUCCEEDED'|'FAILED'|'REJECTED'|'NOT_CALLED'};
  proposal:{id:string;value:unknown};
  qualification:{id:string;accepted:boolean;reasonCodes:readonly string[];validatorVersion:string};
  decision:{id:string;value:QualifiedInnerTutorDecisionV1};
  experience:{id:string;value:ExperienceContractV1};
  execution:{id:string;status:'PENDING'|'STARTED'|'COMPLETED'|'FAILED';result?:unknown};
  sessionCheckpoint?:{lessonPlan:LessonPlanV1;runtime:Stage4RuntimeV4}|{lessonPlan:LessonPlanV1;runtime:ExamOperationalRuntimeV1};
  treatment?:{
    episodeId:string;
    targetRef:string;
    facet:string;
    currentMove?:{moveId:string;mechanismId:string;support:string;deliveredAt:string};
    responseAttribution?:{moveId:string;mechanismId:string;support:string;deliveredAt:string;response:TreatmentResponseV1};
  };
}

export interface OperationalCommandPortV1 {
  commitProductMutation(command:ProductMutationCommandV1):Promise<CommitResultV1>;
  commitArtifactIntake(command:ArtifactIntakeCommandV1):Promise<CommitResultV1>;
  commitSessionCheckpoint(command:SessionCheckpointCommandV1):Promise<CommitResultV1>;
  commitEvidenceChain(command:EvidenceChainCommandV1):Promise<CommitResultV1>;
  commitTeacherLineage(command:TeacherLineageCommandV1):Promise<CommitResultV1>;
  commitRetentionNeed(command:RetentionNeedCheckpointCommandV1):Promise<CommitResultV1>;
  deleteLearnerOperationalData(learnerId:string):Promise<{deleted:boolean;orphanArtifactsRemoved:number}>;
}

export interface TeacherContextInputReadPortV1 {load(learnerId:string,lessonPlanId:string):Promise<Readonly<Record<string,unknown>>>}
export interface TeacherContextSnapshotWritePortV1 {save(envelope:CommandEnvelopeV1,id:string,snapshot:PedagogicalContextV1):Promise<CommitResultV1>}
export interface LearnerExperienceReadPortV1 {
  today(learnerId:string):Promise<Readonly<Record<string,unknown>>>;
  myEnglish(learnerId:string):Promise<Readonly<Record<string,unknown>>>;
  journey(learnerId:string,limit?:number):Promise<readonly Readonly<Record<string,unknown>>[]>;
  latestResult(learnerId:string):Promise<Readonly<Record<string,unknown>>|null>;
}

export interface U1MigrationReportV1 {runId:string;accepted:number;rejected:number;deduped:number;quarantined:number;sourceDeleted:false;errors:readonly string[]}
