# U. Persistence / Backend / Data

## Ownership

Canonical owner: `src/persistence`

Wave U1 provides the native local operational persistence foundation: Expo SQLite migrations/transactions, stable operation identity, durable learner artifacts, LessonPlan-bound sessions, evidence and Teacher/Experience lineage, bounded reads, AsyncStorage migration, and learner-scoped deletion integrity. Web intentionally retains the previous stores behind adapters; U2 server truth, sync, cross-device continuity, and backup/restore are not implemented.

## Depends on

`C`

## Does not own

Pedagogical policy or learner-facing experience decisions.

## Fine-grained capability scope

The following items define the subsystem scope for later full-subsystem audits. Their presence here does **not** claim implementation completion.

- `U.local-persistence` — Local persistence
- `U.server-truth` — Server-truth boundary
- `U.sync` — Sync
- `U.db-schema` — Database schema
- `U.migration` — Data migrations
- `U.backup-restore` — Backup/restore
- `U.file-storage` — File/object storage
- `U.artifact-storage` — Artifact storage
- `U.event-ledger` — Event ledger persistence
- `U.user-deletion` — User deletion
- `U.privacy-boundary` — Privacy/data boundary
- `U.cross-device` — Cross-device continuity

## Authority rule

U persists authoritative outputs but never constructs A product semantics, C evidence policy, D LessonPlan, E Teacher decisions, F teaching moves, K measurements, or N Experience Contracts. Provider/network calls and policy execution stay outside SQLite transactions. Corpus data remains a separate DATA store.
