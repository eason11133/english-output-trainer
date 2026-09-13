# U1 Local Operational Persistence — Contract and Migration Design

Status: **DESIGN ONLY — NOT AN EXECUTABLE MIGRATION**  
Scope: Stable-Beta local operational persistence. No cloud sync, corpus import, organization model, or F/H/I/K policy expansion.

## 1. Decision

U1 introduces one U-owned operational store behind ports. The physical target is an Expo SDK 57-compatible SQLite database selected during implementation. AsyncStorage remains allowed for Supabase auth/session compatibility and small non-learning UI preferences.

The operational store is distinct from:

1. English Knowledge & Content Corpus (`.data-cache/eot-corpus.sqlite` in development);
2. artifact/object bytes stored in a durable app-owned filesystem location;
3. future Supabase/Postgres server reconciliation.

Canonical truth is the immutable domain identity and semantics. SQLite is the local physical replica, not a new authority subsystem.

## 2. Authority invariants

- A owns identity/product context semantics; U only persists them.
- B owns canonical English target identity. Corpus records require validated links and never mutate B automatically.
- C owns observation/evidence admission/canonical learner truth. Projections are rebuildable.
- D owns the immutable LessonPlan WHAT/WHY/WHEN bound to a session.
- E owns qualified HOW NOW decisions. Provider output remains an untrusted proposal.
- F owns mechanisms/PCK/treatment interpretation; K owns evaluation semantics.
- `QualifiedTeacherDecision -> ExperienceContract -> execution` is the only execution chain.
- Original learner work is immutable. Learner revision creates a new learner-authored version; AI output has a different author kind.
- A rejected evidence candidate is durable lineage, not canonical evidence.

## 3. U-owned port contracts

The implementation wave should publish domain-neutral ports from `src/persistence`; callers must not import SQLite implementations.

```ts
type OperationId = string;
type RecordVersion = number;
type CommandResult<T> =
  | { status: 'COMMITTED'; value: T }
  | { status: 'IDEMPOTENT_REPLAY'; value: T };

interface OperationalCommandPortV1 {
  commitProductMutation(command: ProductMutationCommandV1): Promise<CommandResult<ProductProfileV2>>;
  commitArtifactIntake(command: ArtifactIntakeCommandV1): Promise<CommandResult<DurableArtifactRefV1>>;
  commitSessionStart(command: SessionStartCommandV1): Promise<CommandResult<HydratedLessonSessionV1>>;
  commitLearnerAction(command: LearnerActionCommandV1): Promise<CommandResult<HydratedLessonSessionV1>>;
  commitEvaluationAndAdmission(command: EvaluationAdmissionCommandV1): Promise<CommandResult<EvidenceCommitResultV3>>;
  commitTeacherContextIntent(command: TeacherContextIntentCommandV1): Promise<CommandResult<ModelRunIntentV1>>;
  commitTeacherDecisionLineage(command: TeacherDecisionLineageCommandV1): Promise<CommandResult<QualifiedTeacherDecisionRefV1>>;
  commitExperienceExecution(command: ExperienceExecutionCommandV1): Promise<CommandResult<HydratedLessonSessionV1>>;
  commitPauseResume(command: SessionLifecycleCommandV1): Promise<CommandResult<HydratedLessonSessionV1>>;
}

interface CommandEnvelopeV1 {
  operationId: OperationId;
  learnerId: string;
  commandKind: string;
  inputFingerprint: string;
  occurredAt: string;
  schemaVersion: 1;
}

interface LearnerTruthReadPortV1 {
  evidence(learnerId: string): Promise<readonly CanonicalEvidenceEventV3[]>;
  observations(learnerId: string, after?: string): Promise<readonly LearnerObservationV1[]>;
  project(learnerId: string): Promise<LearnerModelSnapshotV3>;
}

interface LessonSessionReadPortV1 {
  active(learnerId: string): Promise<HydratedLessonSessionV1 | null>;
  latestResult(learnerId: string): Promise<LatestLessonResultReadModelV1 | null>;
}

interface TeacherContextInputReadPortV1 {
  load(input: {
    learnerId: string;
    sessionId: string;
    lessonPlanId: string;
    taskInstanceId?: string;
    decisionPointId: string;
  }): Promise<TeacherContextInputsV1>;
}

interface TeacherContextSnapshotWritePortV1 {
  append(snapshot: TeacherContextSnapshotV1, operation: CommandEnvelopeV1): Promise<CommandResult<TeacherContextSnapshotRefV1>>;
}
```

Port rules:

- `operationId + commandKind` is unique.
- Reuse with the same fingerprint returns the committed result; reuse with another fingerprint is an immutable conflict.
- The public port exposes typed commands, not a transaction callback. Only the U implementation owns the internal transaction/unit-of-work.
- External model/network calls occur between `commitTeacherContextIntent` and `commitTeacherDecisionLineage`; callers cannot pass a provider callback into a U transaction.
- Domain validators run before canonical writes. Database constraints are defense in depth, not policy ownership.
- N/O readers receive bounded read models, never raw tables.
- `TeacherContextInputReadPortV1.load` retrieves bounded facts only. E's existing `compilePedagogicalContextV1` remains the compiler/semantic owner; U persists the E-produced snapshot.

This corrects two source-level risks in the current code: `PersistencePortV1` is too small to express atomic multi-record commands, while a generic public transaction callback would let a caller accidentally await a provider inside the transaction.

## 3.1 Stable ID and idempotency rules

Current production helpers use `Date.now() + Math.random()`. U1 must not treat those values as reliable operation identities.

- New durable record IDs use cryptographically random UUIDs generated by one U-owned `IdFactoryV1`; the exact UUID version remains an implementation decision.
- Ordering uses explicit `occurred_at` plus deterministic tie-breaker ID, never lexical ID ordering as event time.
- A learner gesture/command receives `operation_id` before the first durable write. The UI/runtime retains it across retry until a committed result is observed.
- Derived records use stable parent-scoped IDs or unique constraints: one admission per candidate, one final qualified decision per `(session_id, decision_point_id)`, one contract per decision.
- `input_fingerprint` is canonical serialization of semantic command input, excluding retry time, transient URI and UI-only state.
- C's existing evidence `dedup_key` remains a domain duplicate key and is not replaced by U's operation ID. One operation may legitimately create several immutable records.
- Imported legacy IDs are namespaced (`legacy:<store>:<id>`); collisions or same-ID/different-content records are quarantined.

## 4. Command transaction recipes

### 4.1 Learner action

One local transaction writes:

1. idempotency record;
2. immutable learner observation/action;
3. task/block event if present;
4. session checkpoint/version update;
5. outbox record for future U2 sync.

It must not create canonical evidence merely because the action was stored.

### 4.2 Evaluation and evidence admission

One transaction writes:

1. evaluation run with evaluator ID/version and complete input references;
2. evidence candidate;
3. admission/rejection decision;
4. canonical evidence only when admitted;
5. projection invalidation/high-water mark;
6. outbox record.

The canonical evidence ID and dedup key are unique. Admission must reference exactly one candidate and validator/guard version.

### 4.3 Teacher decision

Transaction A stores the immutable Teacher context snapshot and pending model-run intent, then commits. The provider call occurs outside a transaction. Transaction B stores provider response/proposal, qualification result, qualified decision, Experience Contract and outbox records. Contract execution is a later idempotent command.

Source correction: E, not U, calls `compilePedagogicalContextV1`. U supplies `TeacherContextInputsV1` and stores the resulting immutable snapshot. N's existing `teacherDecisionToExperienceContractV1` remains contract construction authority; U only persists its result.

### 4.4 Pause/resume

Pause/resume appends a lifecycle event and updates only the session projection/checkpoint in the same transaction. Elapsed-time calculation uses persisted timestamps; it does not infer capability evidence.

## 5. Logical record requirements

All learner-scoped tables require `learner_id`. Immutable records require `id`, `schema_version`, `created_at`, `operation_id`, and source lineage. Mutable projections require `version`, `updated_at`, and enough source IDs/high-water marks to rebuild or invalidate them.

Core typed opportunity fields:

- `target_ref`, `facet`;
- `production_mode`;
- `support_before_response`;
- `answer_exposure` and `model_exposure`;
- `elicitation_condition`: `TARGET_NAMED | FUNCTION_CUED | OPEN_CHOICE | AUTHENTIC | UNKNOWN`;
- `context_provenance`: `SOURCE | SAME_CONTEXT | CHANGED_CONTEXT | DELAYED_CONTEXT | NOT_APPLICABLE`;
- `opportunity_present`;
- `task_affordance_checked`;
- evaluator ID/version;
- occurrence time, task/session/artifact/observation lineage.

Mechanism-specific payload, experimental rubric dimensions, provider metadata and evolving H/I/K detail remain in versioned extension JSON. Extension JSON may refine a typed fact but must not contradict it.

## 5.1 Append-only and mutable boundary

| Append-only / immutable-versioned | Mutable but versioned | Rebuildable/cache only |
|---|---|---|
| artifact versions/objects and source confirmations | current ProductProfile | session checkpoint |
| LessonPlan snapshots | lesson-session lifecycle status/pointers | learner projection cache |
| task instances/contracts and learner actions | active-session pointer | Today/My English/Journey/Result read models |
| observations and evaluation runs | reencounter schedule status/due time | query indexes/materialized summaries |
| candidates, admission decisions, canonical evidence | model-run status before terminal completion | sync checkpoints |
| Teacher context, model responses/proposals, qualification, qualified decisions | object upload/copy state | UI draft state |
| Experience Contracts/executions | outbox delivery state in future U2 | |
| teaching moves/treatment responses | migration-run progress | |

Mutable rows use optimistic `record_version` or an equivalent compare-and-swap guard. Mutable status updates may not rewrite immutable payload or source lineage.

## 6. Artifact durable-copy contract

Picker/cache URIs are intake handles only.

```ts
interface DurableArtifactObjectV1 {
  objectId: string;
  learnerId: string;
  artifactVersionId: string;
  appOwnedRelativePath: string;
  sha256: string;
  byteLength: number;
  mimeType: string;
  storageState: 'COPY_PENDING' | 'AVAILABLE' | 'FAILED' | 'DELETED';
  privacyScope: 'USER_PRIVATE';
  createdAt: string;
}
```

Required sequence:

1. copy source bytes to an app-owned temporary path;
2. calculate hash/size and fsync/close;
3. atomically rename into durable content-addressed location;
4. transactionally register object metadata and immutable artifact version;
5. only then allow artifact-dependent session creation.

Text-only input stores immutable original text in `artifact_versions`; it does not require a binary object. Learner revision points to `parent_version_id`. OCR/source confirmation and AI reformulation never overwrite the original version.

## 7. Teacher Read Model and lineage

U returns `TeacherContextInputsV1`; E compiles `TeacherContextSnapshotV1`. The snapshot contains only:

- product context projection;
- immutable LessonPlan snapshot;
- canonical target/facet and prerequisite projections;
- bounded learner capability projection and competing hypotheses;
- current task/opportunity conditions and latest observation;
- last six attempts and last six relevant treatment responses by default;
- session/time/current mechanism state;
- F mechanism/PCK summary;
- production-safe corpus results with source/license provenance;
- all source evidence/observation/task/artifact IDs;
- compiler version and compiled time.

It excludes raw ledgers, unrelated learner history, provider secrets, research-only corpus text and internal unrestricted database access.

Durable chain:

`teacher_context_snapshots -> model_runs -> model_proposals -> teacher_qualifications -> qualified_teacher_decisions -> experience_contracts -> experience_executions`.

F history is separately represented by `teaching_moves` and `treatment_responses`. E receives a bounded projection; it cannot reinterpret those rows as canonical C evidence.

## 8. Read models

- `today_read_model`: active-session pointer + D plan summary. Rebuildable.
- `my_english_read_model`: C projection version/high-water mark. Rebuildable.
- `journey_read_model`: meaningful milestones derived from canonical evidence/session lifecycle. Rebuildable.
- `latest_result_read_model`: artifact/session/evidence summary. Rebuildable.
- `teacher_context_snapshot`: immutable decision input, not a mutable UI projection.

No read model may be the only copy of observations, evaluations, evidence, decisions or treatment history.

## 9. AsyncStorage migration protocol

Migration manifest: `docs/data/u1-asyncstorage-migration-map.json`.

Protocol:

1. acquire a local migration lease;
2. fingerprint the raw key value without deleting it;
3. parse and schema-validate;
4. import within one transaction per source key/bounded batch;
5. record accepted/rejected counts and row fingerprints;
6. run semantic reconciliation checks;
7. mark source key `IMPORTED`, `PARTIAL`, `QUARANTINED`, or `EMPTY`;
8. switch canonical readers only after all required keys pass;
9. keep legacy values read-only for one release; deletion is a separate explicit cleanup operation.

Legacy evidence V2 and Teacher episode evidence are quarantined by default. They may become migration candidates but never canonical evidence without a versioned migration validator and admission record.

## 10. U1 deletion, privacy, backup and future sync

- Local learner deletion removes learner-scoped operational rows and artifact objects, then writes a local deletion audit/tombstone outside learner content.
- Shared/public corpus data is not learner data and is not deleted with a learner.
- User-private corpus/material cache is learner-scoped and deleted.
- U1 outbox records are local preparation only; no network sync is implemented.
- Backup/export must include schema version, database checksum, artifact inventory and per-object hashes. Restore must refuse newer incompatible schema versions.

## 11. Implementation sequence for a later job

1. choose and verify the exact Expo SDK 57 SQLite API;
2. implement migration runner and schema from the reviewed proposal;
3. implement unit-of-work/idempotency foundation;
4. implement artifact durable copy;
5. migrate ProductProfile and Stage4 artifacts/sessions;
6. migrate canonical observation/evidence ledgers;
7. add evaluation/admission and Teacher lineage writers;
8. replace production readers with U ports;
9. dual-read comparison, then stop legacy writers;
10. retain rollback/export evidence before legacy cleanup.

## 11.1 Unresolved design decisions (must be resolved before implementation)

1. **Exact Expo SQLite API and transaction behavior.** Verify SDK 57 documentation, WAL support, async transaction semantics and platform differences before choosing an adapter.
2. **UUID format.** UUIDv4 is sufficient for uniqueness; UUIDv7 may aid locality but requires a verified implementation. Do not invent a timestamp-random format.
3. **Database encryption at rest.** Product/privacy requirements and supported Expo deployment options are not yet established. This does not justify custom cryptography.
4. **Artifact retention after local learner deletion.** Default is deletion; legal/support retention exceptions require an explicit product decision.
5. **Large text placement.** U1 may store normal text artifacts inline; a size threshold for moving exceptionally large text to object storage needs measurement.
6. **Evaluation ownership location.** `OutcomeEvaluatorV1` currently lives under `teacher-runtime` although K owns measurement semantics. U1 persists evaluator lineage but must not move the code during this wave.
7. **Legacy partial-runtime policy.** A runtime whose artifact URI is missing can retain text/history, but whether it remains resumable must be decided; default safe state is non-resumable/quarantined.
8. **Read-model persistence threshold.** Start with query-built projections unless profiling proves cache tables necessary; schema support does not require immediate population.
9. **Backup UX and key custody.** U1 defines export integrity but not a user-facing encrypted backup product.

## 11.2 Challenges to the DB0 baseline

- A "U-owned Teacher Read Model" must mean U-owned retrieval/transport, not U-owned pedagogical compilation. Real source places compilation in E, so the proposed boundary was corrected.
- A generic unit-of-work callback is not safe merely because documentation forbids network calls. Typed commands are safer and keep transaction mechanics private to U.
- Not every proposed table needs to ship in the first implementation slice. In particular generation, reencounter and persisted experience read-model caches may remain uninstantiated until a real writer exists; empty tables are not progress.
- `OutcomeEvaluatorV1` is physically under E today despite K's declared ownership. U1 records evaluator identity/version but does not silently relocate or redefine evaluation policy.

## 12. U1 acceptance gates

- same command replay produces no duplicate row or effect;
- conflicting idempotency-key reuse is rejected;
- crash between provider call phases cannot create an executed unqualified proposal;
- observation/runtime/evidence commit cannot partially succeed;
- rejected candidates remain queryable but never appear in canonical projection;
- projections rebuild deterministically from immutable rows;
- original bytes/text survive picker cache removal and retain hashes;
- AI-authored text cannot be labeled learner-authored;
- resume binds the original LessonPlan snapshot;
- current learner cannot read another learner's rows through any U port;
- legacy V2 mastery/error data cannot enter canonical truth;
- no operational migration opens or mutates the corpus database;
- existing A-E authority and architecture gates remain unchanged.
