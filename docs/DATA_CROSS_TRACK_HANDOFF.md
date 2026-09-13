# DATA CROSS-TRACK HANDOFF — 2026-08-28

## Current Data checkpoint

Status: **FIRST_PASS_CANDIDATE for bounded OEWN/UniMorph retrieval and the current attributed Tatoeba slice; PARTIAL overall** because the corpus is not yet packaged/opened by the application and only the first 5,000 official EN→CMN links are materialized.

| Source | Frozen version | Real state | License / usage |
|---|---|---|---|
| Open English WordNet | 2025 edition / dc343f2 | 135,969 lexemes; 185,129 senses; 49,593 examples; 132,238 relations | CC BY 4.0 plus Princeton WordNet License; attribution required; production eligible |
| UniMorph English | master snapshot 2026-08-27 | 619,716 morphology rows | CC BY-SA 3.0; attribution/share-alike; source-isolated; production eligible |
| Tatoeba ENG/CMN | weekly export 2026-08-22 | 9,627 unique sentences; 4,997 pairs; 9,623 normalized clusters | official detailed exports provide username; official CC0 lists checked independently |

Tatoeba promotion result: 9,613 sentences are `ATTRIBUTION_REQUIRED`; 14 are `QUARANTINED` because contributor is missing. No selected sentence appeared in either official CC0 list. Exactly 4,983 pairs have two eligible sides; 14 pairs remain quarantined. Each side retains contributor, record license, attribution, source/version/ID, raw-asset checksum, import run, integrity, quality, eligibility, and quarantine reason.

Latest repeat import accepted zero entities. Raw and expanded assets stay under gitignored `.data-cache/`.

## New production interfaces

- `EnglishCorpusRetrievalPortV1` — `src/domain/english/corpusRetrieval.ts`
- `CorpusDataQueryV1` / `CorpusDataResultV1<T>` — `src/persistence/dataCorpusTypes.ts`
- `SqliteEnglishCorpusRetrievalPortV1` — `src/persistence/sqliteCorpusRetrieval.ts`
- executable reference query — `scripts/data-corpus/lib/retrieval.mjs`

The query accepts resource type, lemma/surface form, optional POS, language/context/source constraints, usage policy, and a clamped limit (maximum 50). Results contain records, deduplicated provenance, source versions, license status, quality signals, and retrieval reason. No arbitrary SQL is exposed.

Supported real retrieval: lemma/POS/senses/glosses/WordNet relations; form→lemma morphology and inflected forms; OEWN examples with target occurrence; attributed EN↔ZH pairs with both-side provenance. Sentence search uses FTS5; normalized duplicate pairs are collapsed before delivery.

Production filtering happens before delivery. `UNKNOWN`, `RESEARCH_ONLY`, `DISCOVERY_ONLY`, `QUARANTINED`, and `REJECTED` never pass learner/generation policy. Internal research may inspect quarantined records but cannot promote them.

## Shared files modified

- `package.json` — Data-only acquire/import/validate/gate commands.
- `src/domain/english/corpusRetrieval.ts` — bounded query method.
- `src/persistence/dataCorpusTypes.ts` — Data contracts.
- `src/persistence/index.ts` — corpus adapter export.

No H/G/I/K/M teaching, evidence, assessment, session, or UI file was modified.

## Expected future consumers

- **G:** licensed candidate examples, morphology, senses, relations, translations. Data does not select targets, validate tasks, or decide pedagogy.
- **H:** contextual lexical alternatives, inflections, authentic examples. Data does not diagnose or assess writing.
- **I:** senses, morphology and both-side-attributed EN↔ZH candidates. Data does not assert meaning preservation or evaluate translation.
- **B:** may map corpus IDs to English-domain references. Data does not change the capability graph.
- **E/F:** may request candidates. Data does not choose WHAT/HOW or evidence policy.

K and M must not consume corpus tables directly. Corpus data is content support, never learner evidence or session truth.

## Merge conflict expectations

Likely semantic conflicts: `src/domain/english/corpusRetrieval.ts`, `src/persistence/dataCorpusTypes.ts`, `src/persistence/index.ts`, and `package.json`. Data-owned schema, manifest, scripts, tests and this handoff should merge independently. `app/daily-lesson.tsx` currently has unrelated parallel type errors and was not touched.

## REQUIRED CONSUMER CONTRACT CHANGES

1. Depend on `EnglishCorpusRetrievalPortV1`, never SQLite or corpus tables.
2. Preserve returned attribution and eligibility through displayed/embedded artifacts.
3. Treat empty results as empty; never invent or use an unlicensed fallback.
4. Never reinterpret `INTERNAL_RESEARCH` as learner-safe.

No immediate consumer implementation is required.

## Safe integration order

1. Reconcile shared contracts without moving B/C/D/E/F/K authority.
2. Package/open a read-only Data-owned corpus outside U1 learner transactions.
3. Inject the bounded port into G candidate generation.
4. Preserve provenance through G artifacts.
5. Let H/I request candidates while their qualified decisions retain teaching authority.
6. Keep K evidence admission and M transactions separate.

Validation: `npm run gate:data-corpus`. Data-only TypeScript diagnostics pass. Full project typecheck is currently blocked by two unrelated `app/daily-lesson.tsx` errors in the parallel runtime.
