# CHANGELOG CURRENT — 2026-08-28 UI/UX PRE-CLOSURE WAVE

## Blocking semantic fixes

### Durable learner-action replay

- Native evidence operation IDs now derive from stable `lessonActionIdentityV1`.
- Random retry-generated observation IDs no longer define evidence-operation idempotency.
- Semantic input fingerprint excludes retry-generated row IDs.
- Persisted block events carry the action identity.
- Restored checkpoints suppress a learner action already committed before process death.
- U1 host regression simulates commit → process death → same-action replay and verifies no second canonical evidence write.

### Authentic input role separation

- Added explicit learner-facing source roles for `TEACHER_ANNOTATION` and `UNKNOWN_REGION`.
- These parts are preserved but marked non-teaching.
- Removed unsafe whole-page learner-work fallback for classified image/PDF/camera/gallery material.
- No confirmed learner-work region now fails closed.
- Added annotation-only, mixed teacher/learner and unknown-region adversarial tests.
- Direct paste/text without classifier spans retains safe raw-text fallback.

## Data adapter correction

- Replaced flat-row casts with real public-contract projections in `SqliteEnglishCorpusRetrievalPortV1`.
- Added dedicated `EXAMPLES` retrieval.
- Parsed OEWN glosses and lexical relations.
- Parsed morphology feature arrays.
- Built nested bilingual sentence objects with independent sentence provenance and pair provenance.
- Added focused runtime-adapter contract tests.

## Test harness clarification

- Fresh H rebuild passes; the six failures reported by the prior read-only audit were stale generated build artifacts.
- No product behavior was changed merely to satisfy those stale artifacts.

## Explicit non-claims

- This is an independent re-audit candidate, not backend seal.
- Physical iOS/Android process-death, SQLite, file-permission, OCR and lifecycle acceptance remain unverified.
- UI/UX redesign has not been implemented in this closure package.
