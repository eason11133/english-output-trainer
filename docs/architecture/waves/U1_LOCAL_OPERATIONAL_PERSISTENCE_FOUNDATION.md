# U1 Local Operational Persistence Foundation

Status: **PARTIAL**. The coherent native foundation and production adapters exist and pass host SQLite/type gates. Native Android/iOS migration, filesystem, crash, and reload acceptance still require a device or emulator; web intentionally retains legacy stores.

## Capability matrix

| Capability | Before | After | Evidence / boundary |
|---|---:|---:|---|
| local-persistence | 15 | 85 | SDK 57 Expo SQLite open, WAL, schema init, exclusive transaction runner |
| server-truth | 10 | 10 | U2, deliberately unchanged |
| sync | 0 | 0 | U2, deliberately unchanged |
| db-schema | 10 | 90 | 29 bounded operational tables; no DATA1/U2 tables |
| migration | 10 | 80 | hashed, versioned AsyncStorage run with counts and quarantine |
| backup-restore | 0 | 0 | deferred pending product/key-custody contract |
| file-storage | 10 | 80 | app document directory, SHA-256 object identity, stage then move |
| artifact-storage | 10 | 85 | intake/page/object/version separation; learner original immutable |
| event-ledger | 25 | 85 | observation/evaluation/admission/evidence and Teacher lineage transactions |
| user-deletion | 0 | 70 | learner cascade and shared-object FK protection; cloud deletion excluded |
| privacy-boundary | 20 | 75 | learner-scoped keys and bounded query ports |
| cross-device | 0 | 0 | U2, deliberately unchanged |

## Shared root causes

The old production path used independent AsyncStorage arrays and mutable Stage4 blobs. Product, observation, evidence, runtime, Teacher episode, and artifact metadata had no shared transaction or stable retry identity. Picker/cache URIs were treated as durable references. Learner-facing projections read physical repositories directly. Full Teacher proposal/qualification/Experience execution lineage was lost after the in-memory call.

U1 addresses these as four shared roots: a relational transaction kernel, stable command identity/fingerprints, app-owned immutable artifact objects, and bounded read/migration adapters.

## Store and path classification

| Existing path | Classification | U1 action |
|---|---|---|
| ProductProfile V2 AsyncStorage | MIGRATE | Native migrates to current profile plus revisions; web retains adapter |
| global product V1 | DEFER migration fallback | Only existing A demo migration may consume it; never overrides canonical V2 |
| canonical observation V1 | MIGRATE | Valid immutable rows imported idempotently |
| canonical evidence V3 | MIGRATE | Canonical ledger outranks runtime copies; orphan rows quarantined |
| legacy EvidenceEvent V2 | SUPERSEDE | Quarantined; never admitted as canonical evidence |
| Stage4 artifacts | ADAPT/MIGRATE | Metadata imported; URI-backed legacy objects flagged for durable reconciliation |
| Stage4 runtime blobs | SUPERSEDE native / KEEP web | Safe sessions imported only with LessonPlan binding; embedded ledgers excluded |
| Teacher episode stores | MIGRATE/DEFER | Quarantined for explicit treatment classification; no mastery inference |
| learner spine repository reads | ADAPT | U-owned `OperationalHistoryReadPortV1` |
| daily lesson writes | ADAPT | Native typed SQLite commands; web legacy adapter |
| Supabase auth storage | KEEP | SDK-owned authentication only; no production operational schema |
| corpus database | KEEP SEPARATE | Not touched or merged |

Legacy source keys are not deleted by U1 migration. Migration reports always return `sourceDeleted: false`.

## Physical schema

Families actually created: schema/idempotency; learner/profile revisions; artifact objects/intakes/pages/versions; LessonPlan snapshots/sessions; observations and typed production conditions; evaluations/candidates/admissions/canonical evidence; Teacher contexts/model runs/proposals/qualifications/decisions; Experience contracts/executions; teaching episodes/moves/treatment responses; migration runs/quarantine. Read models are rebuilt from these rows instead of becoming a second truth store.

Authority-critical columns include `elicitation_condition`, support ceiling, support visible before response, answer exposure, recent model prime, exposure reference, context provenance, fresh-independent eligibility, task/opportunity identity, and explicit authority-owner checks.

## Transaction and idempotency model

Public callers use typed commands. `operationId + inputFingerprint` is recorded inside the same exclusive transaction as authoritative rows and lineage. Same ID/same fingerprint replays the stored logical result; same ID/different fingerprint fails. Provider/network calls, artifact copying, and A–F/K/N policy execution occur outside transactions. C semantic evidence dedup remains separate from U operation identity.

## Durable artifacts

Native intake copies each page from picker/cache into an app document staging directory, hashes bytes with SHA-256, finalizes into a content-addressed sharded path, verifies existence and size, then commits ownership metadata. Missing sources fail before DB ownership. Duplicate bytes share an object while preserving distinct intake/page lineage. Web keeps its existing URI behavior and does not claim parity.

## Lineage behavior

The durable learner chain is Observation → EvaluationRun → EvidenceCandidate → EvidenceAdmissionDecision → CanonicalEvidence. Rejections are durable and canonical rows require an accepted admission. Production conditions are typed.

E now returns persistence provenance containing its compiled context, proposal, and accepted qualification; it does not delegate policy to U. N still constructs `ExperienceContractV1`. After the external model call and N construction, U atomically persists TeacherContextSnapshot → ModelRun → Proposal → Qualification → QualifiedDecision → ExperienceContract → ExperienceExecution. F mechanism/support/response is persisted as treatment history and never projected directly to mastery.

## Acceptance

`npm run test:wave-u1` executes the real schema in Node SQLite and proves schema creation, migration bookkeeping, bound statements, replay/conflict semantics, rollback, artifact FK integrity, LessonPlan binding, rejected admission, accepted canonical chain, Teacher/Experience lineage, bounded treatment query, and projection rebuild. `npm run typecheck` passes. Full A–F/main/domain/scenario/Stage4/Stage5A regression results are recorded in the implementation handoff.

## Intentionally not implemented

U2 server truth, Supabase production schema/RLS, sync, cross-device continuity, cloud deletion, backup/restore UX, SQLCipher, DATA1/corpus, H/I/G expansion, evaluator relocation, teaching policy, organizations/classes, billing, and analytics warehouse.
