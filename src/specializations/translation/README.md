# I. Translation Teacher Runtime

## Ownership

Canonical owner: `src/specializations/translation`

This subsystem exists as a first-class part of the EOT V1 architecture. The current Main Architecture Skeleton establishes its location, ownership boundary, public entrypoint, dependency direction, and fine-grained capability inventory. Deep implementation is intentionally deferred to a dedicated major-subsystem upgrade wave.

## Depends on

`C`, `E`, `F`, `G`, `K`

## Does not own

A separate learner identity/evidence store.

## Fine-grained capability scope

The following items define the subsystem scope for later full-subsystem audits. Their presence here does **not** claim implementation completion.

- `I.source-meaning` — Source meaning decomposition
- `I.meaning-fidelity` — Meaning fidelity
- `I.lexical-retrieval` — Lexical retrieval
- `I.collocation` — Collocation
- `I.verb-pattern` — Verb patterns
- `I.grammar-form` — Grammar/form
- `I.role-mapping` — Sentence-role mapping
- `I.l1-l2-contrast` — L1/L2 contrast
- `I.restructuring` — Restructuring
- `I.guided-reconstruction` — Guided reconstruction
- `I.valid-realizations` — Alternative valid realizations
- `I.naturalness-precision` — Naturalness/precision
- `I.exam-alignment` — Exam scoring alignment
- `I.changed-context-retranslation` — Changed-context retranslation
- `I.translation-evaluation` — Translation-specific evaluation

## Upgrade rule

When this subsystem becomes the active upgrade wave, audit **every** capability above before implementation. Advance every capability that can legally move in the same wave, group shared root causes, and run cross-subsystem regression before the wave is accepted.

Do not split the wave into serial micro-patches unless a genuine external dependency prevents completion.
