# J. Vocabulary / Chunks / Grammar / Reading Runtimes

## Ownership

Canonical owner: `src/specializations/language`

This subsystem exists as a first-class part of the EOT V1 architecture. The current Main Architecture Skeleton establishes its location, ownership boundary, public entrypoint, dependency direction, and fine-grained capability inventory. Deep implementation is intentionally deferred to a dedicated major-subsystem upgrade wave.

## Depends on

`B`, `C`, `E`, `F`, `G`, `K`

## Does not own

Separate learner-facing product silos or separate learner truth.

## Fine-grained capability scope

The following items define the subsystem scope for later full-subsystem audits. Their presence here does **not** claim implementation completion.

- `J.vocab-representation` — Lexical representation
- `J.vocab-retrieval` — Vocabulary retrieval
- `J.vocab-production` — Vocabulary productive use
- `J.morphology-teaching` — Morphology teaching
- `J.collocation-teaching` — Collocation teaching
- `J.chunk-reuse` — Chunk productive reuse
- `J.register-teaching` — Register teaching
- `J.grammar-meaning-form` — Grammar meaning-form mapping
- `J.grammar-construction` — Construction teaching
- `J.grammar-contrast` — Grammar contrast
- `J.reading-decomposition` — Reading decomposition
- `J.reading-reference` — Reference tracking
- `J.reading-logic` — Reading logic
- `J.reading-structure` — Reading structure
- `J.reading-inference` — Reading inference
- `J.input-output-reuse` — Input-to-output reuse
- `J.domain-repertoire-selection` — Domain-specific repertoire selection

## Upgrade rule

When this subsystem becomes the active upgrade wave, audit **every** capability above before implementation. Advance every capability that can legally move in the same wave, group shared root causes, and run cross-subsystem regression before the wave is accepted.

Do not split the wave into serial micro-patches unless a genuine external dependency prevents completion.
