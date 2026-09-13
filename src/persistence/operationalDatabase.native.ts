import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { File } from 'expo-file-system';
import { canonicalJsonV1, fingerprintV1 } from './identity';
import { U1_SCHEMA_CHECKSUM, U1_SCHEMA_SQL, U1_SCHEMA_VERSION } from './operationalSchema';
import type { ArtifactIntakeCommandV1, CommitResultV1, EvidenceChainCommandV1, OperationalCommandPortV1, ProductMutationCommandV1, RetentionNeedCheckpointCommandV1, SessionCheckpointCommandV1, TeacherLineageCommandV1 } from './operationalTypes';

const DB_NAME='eot-operational-v1.db';
let databasePromise:Promise<SQLiteDatabase>|undefined;

async function open(){
  if(!databasePromise)databasePromise=(async()=>{
    const db=await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
    await db.withExclusiveTransactionAsync(async tx=>{
      await tx.execAsync(U1_SCHEMA_SQL);
      const existing=await tx.getFirstAsync<{checksum:string}>('SELECT checksum FROM schema_migrations WHERE version=?',U1_SCHEMA_VERSION);
      if(existing&&existing.checksum!==U1_SCHEMA_CHECKSUM)throw new Error(`u1_schema_checksum_conflict:${U1_SCHEMA_VERSION}`);
      if(!existing)await tx.runAsync('INSERT INTO schema_migrations(version,checksum,applied_at) VALUES(?,?,?)',U1_SCHEMA_VERSION,U1_SCHEMA_CHECKSUM,new Date().toISOString());
    });
    return db;
  })();
  return databasePromise;
}
export const openOperationalDatabaseInternalV1=open;

async function ensureLearner(db:SQLiteDatabase,learnerId:string,occurredAt:string){
  await db.runAsync('INSERT INTO learner_identities(learner_id,created_at,updated_at) VALUES(?,?,?) ON CONFLICT(learner_id) DO UPDATE SET updated_at=excluded.updated_at',learnerId,occurredAt,occurredAt);
}

async function idempotent(db:SQLiteDatabase,commandType:string,envelope:ProductMutationCommandV1['envelope'],entityId:string,write:(tx:SQLiteDatabase)=>Promise<void>):Promise<CommitResultV1>{
  let outcome:CommitResultV1|undefined;
  await db.withExclusiveTransactionAsync(async tx=>{
    const prior=await tx.getFirstAsync<{input_fingerprint:string;result_json:string}>('SELECT input_fingerprint,result_json FROM idempotency_records WHERE operation_id=?',envelope.operationId);
    if(prior){
      if(prior.input_fingerprint!==envelope.inputFingerprint)throw new Error(`idempotency_fingerprint_conflict:${envelope.operationId}`);
      outcome={...(JSON.parse(prior.result_json) as CommitResultV1),status:'IDEMPOTENT_REPLAY'};
      return;
    }
    await ensureLearner(tx,envelope.learnerId,envelope.occurredAt);
    await write(tx);
    const result:CommitResultV1={operationId:envelope.operationId,entityId,status:'COMMITTED'};
    await tx.runAsync('INSERT INTO idempotency_records(operation_id,learner_id,input_fingerprint,command_type,entity_id,result_json,committed_at) VALUES(?,?,?,?,?,?,?)',envelope.operationId,envelope.learnerId,envelope.inputFingerprint,commandType,entityId,canonicalJsonV1(result),envelope.occurredAt);
    outcome=result;
  });
  if(!outcome)throw new Error('transaction_completed_without_result');
  return outcome;
}

function isExamOperationalRuntimeV1(runtime:SessionCheckpointCommandV1['runtime']):runtime is Extract<SessionCheckpointCommandV1['runtime'],{runtimeKind:'EXAM'}>{
  return 'runtimeKind' in runtime&&runtime.runtimeKind==='EXAM';
}

async function upsertSessionRuntimeCoreV1(tx:SQLiteDatabase,envelope:SessionCheckpointCommandV1['envelope'],lessonPlan:SessionCheckpointCommandV1['lessonPlan'],runtime:SessionCheckpointCommandV1['runtime']){
  const snapshotId=`${lessonPlan.id}:${await fingerprintV1(lessonPlan)}`;
  await tx.runAsync('INSERT OR IGNORE INTO lesson_plan_snapshots(snapshot_id,lesson_plan_id,learner_id,schema_version,plan_json,plan_hash,created_at) VALUES(?,?,?,?,?,?,?)',snapshotId,lessonPlan.id,envelope.learnerId,1,canonicalJsonV1(lessonPlan),snapshotId.split(':').at(-1)!,envelope.occurredAt);
  if(isExamOperationalRuntimeV1(runtime)){
    await tx.runAsync('INSERT INTO lesson_sessions(session_id,learner_id,lesson_plan_snapshot_id,artifact_id,status,runtime_json,started_at,updated_at,completed_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(session_id) DO UPDATE SET lesson_plan_snapshot_id=excluded.lesson_plan_snapshot_id,artifact_id=excluded.artifact_id,status=excluded.status,runtime_json=excluded.runtime_json,updated_at=excluded.updated_at,completed_at=excluded.completed_at',runtime.id,envelope.learnerId,snapshotId,null,runtime.status,canonicalJsonV1(runtime),runtime.startedAt,envelope.occurredAt,runtime.endedAt??null);
    return;
  }
  const artifact=runtime.artifact;
  if(artifact)await tx.runAsync('INSERT OR IGNORE INTO artifact_intakes(artifact_id,learner_id,object_id,source_kind,mode,original_uri,metadata_json,submitted_at,immutable) VALUES(?,?,NULL,?,?,?,?,?,1)',artifact.id,artifact.learnerId,artifact.source,artifact.mode,artifact.pages[0]?.uri??null,canonicalJsonV1(artifact),artifact.submittedAt);
  const startedAt=runtime.tutorSession?.startedAt??null;
  const completedAt=runtime.tutorSession?.endedAt??null;
  await tx.runAsync('INSERT INTO lesson_sessions(session_id,learner_id,lesson_plan_snapshot_id,artifact_id,status,runtime_json,started_at,updated_at,completed_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(session_id) DO UPDATE SET lesson_plan_snapshot_id=excluded.lesson_plan_snapshot_id,artifact_id=excluded.artifact_id,status=excluded.status,runtime_json=excluded.runtime_json,updated_at=excluded.updated_at,completed_at=excluded.completed_at',runtime.id,envelope.learnerId,snapshotId,artifact?.id??null,runtime.status,canonicalJsonV1(runtime),startedAt,envelope.occurredAt,completedAt);
}

export class NativeOperationalDatabaseV1 implements OperationalCommandPortV1{
  async initialize(){await open()}
  async loadActiveSession(learnerId:string){const db=await open(),row=await db.getFirstAsync<{runtime_json:string}>("SELECT runtime_json FROM lesson_sessions WHERE learner_id=? AND status NOT IN ('COMPLETED','RETURNED') AND runtime_json NOT LIKE '%\"runtimeKind\":\"EXAM\"%' ORDER BY updated_at DESC LIMIT 1",learnerId);return row?JSON.parse(row.runtime_json):null}
  async loadActiveSessionBundle(learnerId:string){const db=await open(),row=await db.getFirstAsync<{runtime_json:string;plan_json:string}>("SELECT ls.runtime_json,lp.plan_json FROM lesson_sessions ls JOIN lesson_plan_snapshots lp ON lp.snapshot_id=ls.lesson_plan_snapshot_id WHERE ls.learner_id=? AND ls.status NOT IN ('COMPLETED','RETURNED') AND ls.runtime_json NOT LIKE '%\"runtimeKind\":\"EXAM\"%' ORDER BY ls.updated_at DESC LIMIT 1",learnerId);return row?{runtime:JSON.parse(row.runtime_json),lessonPlan:JSON.parse(row.plan_json)}:null}
  async loadSessionBundleById(learnerId:string,sessionId:string){const db=await open(),row=await db.getFirstAsync<{runtime_json:string;plan_json:string}>('SELECT ls.runtime_json,lp.plan_json FROM lesson_sessions ls JOIN lesson_plan_snapshots lp ON lp.snapshot_id=ls.lesson_plan_snapshot_id WHERE ls.learner_id=? AND ls.session_id=? LIMIT 1',learnerId,sessionId);return row?{runtime:JSON.parse(row.runtime_json),lessonPlan:JSON.parse(row.plan_json)}:null}
  async loadActiveExamSessionBundle(learnerId:string,family?:string){const db=await open(),rows=await db.getAllAsync<{runtime_json:string;plan_json:string}>("SELECT ls.runtime_json,lp.plan_json FROM lesson_sessions ls JOIN lesson_plan_snapshots lp ON lp.snapshot_id=ls.lesson_plan_snapshot_id WHERE ls.learner_id=? AND ls.status NOT IN ('COMPLETED','RETURNED') AND ls.runtime_json LIKE '%\"runtimeKind\":\"EXAM\"%' ORDER BY ls.updated_at DESC LIMIT 20",learnerId);for(const row of rows){const runtime=JSON.parse(row.runtime_json);if(!family||runtime.family===family)return{runtime,lessonPlan:JSON.parse(row.plan_json)}}return null}
  async listSessions(learnerId:string){const db=await open(),rows=await db.getAllAsync<{runtime_json:string}>("SELECT runtime_json FROM lesson_sessions WHERE learner_id=? AND runtime_json NOT LIKE '%\"runtimeKind\":\"EXAM\"%' ORDER BY updated_at",learnerId);return rows.map(row=>JSON.parse(row.runtime_json))}
  async listCanonicalEvidence(learnerId:string){const db=await open(),rows=await db.getAllAsync<{evidence_json:string}>('SELECT evidence_json FROM canonical_evidence WHERE learner_id=? ORDER BY occurred_at,evidence_id',learnerId);return rows.map(row=>JSON.parse(row.evidence_json))}
  async listRetentionNeeds(learnerId:string){const db=await open(),rows=await db.getAllAsync<{need_json:string}>('SELECT need_json FROM durable_retention_needs WHERE learner_id=? ORDER BY due_at,need_id',learnerId);return rows.map(row=>JSON.parse(row.need_json))}
  async loadTeacherContextInputs(learnerId:string,lessonPlanId:string,targetRef?:string,facet?:string){const db=await open();const [profile,evidence,treatments,session]=await Promise.all([db.getFirstAsync<{profile_json:string}>('SELECT profile_json FROM product_profiles WHERE learner_id=?',learnerId),db.getAllAsync<{evidence_json:string}>('SELECT evidence_json FROM canonical_evidence WHERE learner_id=? ORDER BY occurred_at DESC LIMIT 100',learnerId),db.getAllAsync<{response_json:string}>('SELECT tr.response_json FROM treatment_responses tr JOIN teaching_moves tm ON tm.move_id=tr.move_id JOIN teaching_episodes te ON te.episode_id=tm.episode_id WHERE te.learner_id=? AND (? IS NULL OR te.target_ref=?) AND (? IS NULL OR te.facet=?) ORDER BY tr.occurred_at DESC LIMIT 20',learnerId,targetRef??null,targetRef??null,facet??null,facet??null),db.getFirstAsync<{runtime_json:string}>('SELECT ls.runtime_json FROM lesson_sessions ls JOIN lesson_plan_snapshots lp ON lp.snapshot_id=ls.lesson_plan_snapshot_id WHERE ls.learner_id=? AND lp.lesson_plan_id=? ORDER BY ls.updated_at DESC LIMIT 1',learnerId,lessonPlanId)]);return{learnerId,lessonPlanId,targetRef,facet,productProfile:profile?JSON.parse(profile.profile_json):null,canonicalEvidence:evidence.map(row=>JSON.parse(row.evidence_json)),recentTreatmentResponses:treatments.map(row=>JSON.parse(row.response_json)),runtime:session?JSON.parse(session.runtime_json):null}}
  async getProductProfile(learnerId:string){const db=await open(),row=await db.getFirstAsync<{profile_json:string}>('SELECT profile_json FROM product_profiles WHERE learner_id=?',learnerId);return row?JSON.parse(row.profile_json):null}
  async commitProductMutation(command:ProductMutationCommandV1){
    const db=await open(),profile=command.profile;
    return idempotent(db,'PRODUCT_MUTATION',command.envelope,profile.identity.learnerId,async tx=>{
      const current=await tx.getFirstAsync<{revision:number}>('SELECT revision FROM product_profiles WHERE learner_id=?',command.envelope.learnerId);
      const revision=(current?.revision??0)+1;
      await tx.runAsync('INSERT INTO product_profile_revisions(revision_id,learner_id,revision,profile_json,occurred_at) VALUES(?,?,?,?,?)',`${command.envelope.learnerId}:${revision}`,command.envelope.learnerId,revision,canonicalJsonV1(profile),command.envelope.occurredAt);
      await tx.runAsync('INSERT INTO product_profiles(learner_id,schema_version,revision,profile_json,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(learner_id) DO UPDATE SET schema_version=excluded.schema_version,revision=excluded.revision,profile_json=excluded.profile_json,updated_at=excluded.updated_at',command.envelope.learnerId,profile.schemaVersion,revision,canonicalJsonV1(profile),command.envelope.occurredAt);
    });
  }
  async commitArtifactIntake(command:ArtifactIntakeCommandV1){
    const db=await open();
    return idempotent(db,'ARTIFACT_INTAKE',command.envelope,command.artifactId,async tx=>{
      await tx.runAsync('INSERT INTO artifact_objects(object_id,sha256,byte_size,mime_type,storage_path,created_at,availability) VALUES(?,?,?,?,?,?,?) ON CONFLICT(sha256) DO NOTHING',command.objectId,command.sha256,command.byteSize,command.mimeType,command.storagePath,command.envelope.occurredAt,'AVAILABLE');
      const object=await tx.getFirstAsync<{object_id:string}>('SELECT object_id FROM artifact_objects WHERE sha256=?',command.sha256);
      if(!object)throw new Error('artifact_object_registration_failed');
      await tx.runAsync('INSERT OR IGNORE INTO artifact_intakes(artifact_id,learner_id,object_id,source_kind,mode,original_uri,metadata_json,submitted_at,immutable) VALUES(?,?,?,?,?,?,?,?,1)',command.artifactId,command.envelope.learnerId,object.object_id,command.sourceKind,command.mode,command.originalUri??null,canonicalJsonV1(command.metadata),command.envelope.occurredAt);
      await tx.runAsync('INSERT INTO artifact_pages(artifact_id,page_index,object_id,original_uri,mime_type) VALUES(?,?,?,?,?)',command.artifactId,command.pageIndex,object.object_id,command.originalUri??null,command.mimeType);
    });
  }
  async commitSessionCheckpoint(command:SessionCheckpointCommandV1){
    const db=await open();
    return idempotent(db,'SESSION_CHECKPOINT',command.envelope,command.runtime.id,async tx=>{
      await upsertSessionRuntimeCoreV1(tx,command.envelope,command.lessonPlan,command.runtime);
      if(isExamOperationalRuntimeV1(command.runtime))return;
      for(const observation of command.runtime.observations??[]){
        const prior=await tx.getFirstAsync<{payload_json:string}>('SELECT payload_json FROM observations WHERE observation_id=?',observation.id);
        if(prior){if(prior.payload_json!==canonicalJsonV1(observation.payload))throw new Error(`immutable_observation_conflict:${observation.id}`);continue}
        await tx.runAsync('INSERT INTO observations(observation_id,learner_id,session_id,artifact_id,task_id,occurred_at,kind,source,action,payload_json,immutable) VALUES(?,?,?,?,?,?,?,?,?,?,1)',observation.id,observation.learnerId,command.runtime.id,observation.artifactId??null,observation.taskId??null,observation.occurredAt,observation.kind,observation.source,observation.action,canonicalJsonV1(observation.payload));
      }
    });
  }
  async commitRetentionNeed(command:RetentionNeedCheckpointCommandV1){const db=await open(),n=command.need;return idempotent(db,'RETENTION_NEED_CHECKPOINT',command.envelope,n.needId,async tx=>{await tx.runAsync('INSERT INTO durable_retention_needs(need_id,learner_id,target_ref,facet,sense_id,lifecycle_state,due_at,need_json,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(need_id) DO UPDATE SET lifecycle_state=excluded.lifecycle_state,due_at=excluded.due_at,need_json=excluded.need_json,updated_at=excluded.updated_at',n.needId,n.learnerId,n.targetRef,n.facet,n.senseId??null,n.state,n.dueAt,canonicalJsonV1(n),n.updatedAt)})}
  async commitEvidenceChain(command:EvidenceChainCommandV1){
    const db=await open(),canonical=command.canonicalEvidence;
    if(command.admission.accepted!==Boolean(canonical))throw new Error('admission_canonical_mismatch');
    return idempotent(db,'EVIDENCE_CHAIN',command.envelope,canonical?.id??command.admission.id,async tx=>{
      const o=command.observation,c=command.conditions;
      await tx.runAsync('INSERT INTO observations(observation_id,learner_id,session_id,artifact_id,task_id,occurred_at,kind,source,action,payload_json,immutable) VALUES(?,?,?,?,?,?,?,?,?,?,1)',o.id,o.learnerId,null,o.artifactId??null,o.taskId??null,o.occurredAt,o.kind,o.source,o.action,canonicalJsonV1(o.payload));
      await tx.runAsync('INSERT INTO production_conditions(observation_id,elicitation_condition,support_ceiling,support_visible_before_response,answer_exposed,recent_model_prime,exposure_ref,context_provenance,fresh_independent_eligible,task_id,opportunity_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)',o.id,c.elicitation,c.supportCeiling,c.supportVisibleBeforeResponse,c.answerExposed?1:0,c.recentModelPrime?1:0,c.exposureRef??null,c.contextProvenance,c.freshIndependentEligible?1:0,c.taskId??null,c.opportunityId??null);
      await tx.runAsync('INSERT INTO evaluation_runs(evaluation_id,observation_id,evaluator_id,evaluator_version,result_json,occurred_at) VALUES(?,?,?,?,?,?)',command.evaluation.id,o.id,command.evaluation.evaluatorId,command.evaluation.evaluatorVersion,canonicalJsonV1(command.evaluation.result),command.envelope.occurredAt);
      await tx.runAsync('INSERT INTO evidence_candidates(candidate_id,evaluation_id,candidate_json,created_at,immutable) VALUES(?,?,?,?,1)',command.candidate.id,command.evaluation.id,canonicalJsonV1(command.candidate.value),command.envelope.occurredAt);
      await tx.runAsync('INSERT INTO evidence_admissions(admission_id,candidate_id,accepted,reason_codes_json,authority_owner,decided_at,immutable) VALUES(?,?,?,?,?,?,1)',command.admission.id,command.candidate.id,command.admission.accepted?1:0,canonicalJsonV1(command.admission.reasonCodes),command.admission.authority,command.envelope.occurredAt);
      if(canonical)await tx.runAsync('INSERT INTO canonical_evidence(evidence_id,learner_id,admission_id,dedup_key,occurred_at,evidence_json,immutable) VALUES(?,?,?,?,?,?,1)',canonical.id,canonical.learnerId,command.admission.id,canonical.dedupKey??null,canonical.occurredAt,canonicalJsonV1(canonical));
      if(command.sessionCheckpoint)await upsertSessionRuntimeCoreV1(tx,command.envelope,command.sessionCheckpoint.lessonPlan,command.sessionCheckpoint.runtime);
    });
  }
  async commitTeacherLineage(command:TeacherLineageCommandV1){
    const db=await open(),lessonPlanId=command.context.value.lessonPlan.id,lessonHash=await fingerprintV1(command.context.value.lessonPlan),snapshotId=`${lessonPlanId}:${lessonHash}`;
    return idempotent(db,'TEACHER_LINEAGE',command.envelope,command.execution.id,async tx=>{
      await tx.runAsync('INSERT OR IGNORE INTO lesson_plan_snapshots(snapshot_id,lesson_plan_id,learner_id,schema_version,plan_json,plan_hash,created_at) VALUES(?,?,?,?,?,?,?)',snapshotId,lessonPlanId,command.envelope.learnerId,1,canonicalJsonV1(command.context.value.lessonPlan),lessonHash,command.envelope.occurredAt);
      await tx.runAsync('INSERT INTO teacher_context_snapshots(context_id,learner_id,lesson_plan_snapshot_id,context_json,context_hash,compiled_at) VALUES(?,?,?,?,?,?)',command.context.id,command.envelope.learnerId,snapshotId,canonicalJsonV1(command.context.value),await fingerprintV1(command.context.value),command.context.value.compiledAt);
      await tx.runAsync('INSERT INTO model_runs(model_run_id,context_id,provider,model,prompt_version,request_hash,response_hash,status,occurred_at) VALUES(?,?,?,?,?,?,?,?,?)',command.modelRun.id,command.context.id,command.modelRun.provider,command.modelRun.model,command.modelRun.promptVersion,command.modelRun.requestHash,command.modelRun.responseHash??null,command.modelRun.status,command.envelope.occurredAt);
      await tx.runAsync('INSERT INTO teacher_proposals(proposal_id,model_run_id,proposal_json,created_at,immutable) VALUES(?,?,?,?,1)',command.proposal.id,command.modelRun.id,canonicalJsonV1(command.proposal.value),command.envelope.occurredAt);
      await tx.runAsync('INSERT INTO qualifications(qualification_id,proposal_id,accepted,reason_codes_json,validator_version,decided_at) VALUES(?,?,?,?,?,?)',command.qualification.id,command.proposal.id,command.qualification.accepted?1:0,canonicalJsonV1(command.qualification.reasonCodes),command.qualification.validatorVersion,command.envelope.occurredAt);
      if(!command.qualification.accepted)throw new Error('unqualified_teacher_decision_cannot_execute');
      await tx.runAsync('INSERT INTO qualified_teacher_decisions(decision_id,qualification_id,decision_point_id,decision_json,decided_at) VALUES(?,?,?,?,?)',command.decision.id,command.qualification.id,command.decision.value.provenance.decisionPointId,canonicalJsonV1(command.decision.value),command.envelope.occurredAt);
      await tx.runAsync('INSERT INTO experience_contracts(contract_id,decision_id,contract_json,created_at,immutable) VALUES(?,?,?,?,1)',command.experience.id,command.decision.id,canonicalJsonV1(command.experience.value),command.envelope.occurredAt);
      await tx.runAsync('INSERT INTO experience_executions(execution_id,contract_id,operation_id,status,result_json,updated_at) VALUES(?,?,?,?,?,?)',command.execution.id,command.experience.id,command.envelope.operationId,command.execution.status,command.execution.result===undefined?null:canonicalJsonV1(command.execution.result),command.envelope.occurredAt);
      if(command.treatment){
        await tx.runAsync('INSERT OR IGNORE INTO teaching_episodes(episode_id,learner_id,target_ref,facet,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)',command.treatment.episodeId,command.envelope.learnerId,command.treatment.targetRef,command.treatment.facet,'ACTIVE',command.envelope.occurredAt,command.envelope.occurredAt);
        if(command.treatment.responseAttribution){
          const prior=command.treatment.responseAttribution;
          await tx.runAsync('INSERT OR IGNORE INTO teaching_moves(move_id,episode_id,decision_id,mechanism_id,support,delivered_at) VALUES(?,?,?,?,?,?)',prior.moveId,command.treatment.episodeId,null,prior.mechanismId,prior.support,prior.deliveredAt);
          await tx.runAsync('INSERT INTO treatment_responses(response_id,move_id,response_json,occurred_at,immutable) VALUES(?,?,?,?,1)',prior.response.eventId,prior.moveId,canonicalJsonV1(prior.response),prior.response.occurredAt);
        }
        if(command.treatment.currentMove){
          const move=command.treatment.currentMove;
          await tx.runAsync('INSERT OR IGNORE INTO teaching_moves(move_id,episode_id,decision_id,mechanism_id,support,delivered_at) VALUES(?,?,?,?,?,?)',move.moveId,command.treatment.episodeId,command.decision.id,move.mechanismId,move.support,move.deliveredAt);
        }
      }
      if(command.sessionCheckpoint)await upsertSessionRuntimeCoreV1(tx,command.envelope,command.sessionCheckpoint.lessonPlan,command.sessionCheckpoint.runtime);
    });
  }
  async deleteLearnerOperationalData(learnerId:string){
    const db=await open();let orphans:{object_id:string;storage_path:string}[]=[];
    await db.withExclusiveTransactionAsync(async tx=>{await tx.runAsync('DELETE FROM learner_identities WHERE learner_id=?',learnerId);orphans=await tx.getAllAsync<{object_id:string;storage_path:string}>('SELECT object_id,storage_path FROM artifact_objects WHERE object_id NOT IN (SELECT object_id FROM artifact_intakes WHERE object_id IS NOT NULL)');for(const item of orphans)await tx.runAsync('DELETE FROM artifact_objects WHERE object_id=?',item.object_id)});
    for(const item of orphans){const file=new File(item.storage_path);if(file.exists)file.delete()}
    return{deleted:true,orphanArtifactsRemoved:orphans.length};
  }
}

export const operationalDatabaseV1=new NativeOperationalDatabaseV1();
