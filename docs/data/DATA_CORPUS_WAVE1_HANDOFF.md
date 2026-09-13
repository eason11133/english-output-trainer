# Data Corpus Wave 1 — WIP checkpoint (2026-08-27)

## Completed architecture

- Source Registry manifest with operational license and usage scopes.
- SQLite migration for Source → Raw Catalog → Import Run → normalized lexical/morphology/sentence corpus.
- B-domain source-independent retrieval port and U-owned corpus contracts.
- Local cache/database paths added to `.gitignore`.

## Importers completed in code

- `scripts/data-corpus/import-data-corpus.mjs`: OEWN 2025 JSON, UniMorph English TSV, bounded Tatoeba English–Mandarin official export.
- `scripts/data-corpus/query-data-corpus.mjs`: lemma/sense, reverse morphology, and bilingual-pair queries with usage-context filtering.
- Unique identities use deterministic hashes/keys; import-run IDs are intentionally unique per run.

## Downloaded/cache state (not committed)

- OEWN 2025 JSON ZIP: 9,986,555 bytes, SHA-256 `7d749f6e2c39e6970e4997839dcf6e42fd281f3c2fae0171d2192bae8cfa4b51`.
- UniMorph English TSV: 18,022,905 bytes, SHA-256 `20a191cefdc7cad6fa74b00f49d6f658684f17b14541aae372e5a3d5a8c15c67`.
- Tatoeba eng-cmn links: 480,558 bytes, SHA-256 `48fccaab49a817389e5f9308217e10f85800fb73a08bacbd886e9c2d6f7d743d`.
- Tatoeba English sentences: 24,845,207 bytes, SHA-256 `3cd74d608ffd2900b7bcd6a2c4cb9f59694f31a02591c15145d9597f2abbfc96`.
- Tatoeba Mandarin sentences: 1,253,257 bytes, SHA-256 `44c1b34e0a68fd0e64127e5afe169071e96bdf916373f10196170fa5e1393b18`.
- Cache: `.data-cache/`; SQLite DB: `.data-cache/eot-corpus.sqlite`; both gitignored.

## Current DB/schema state

- Two full import passes completed. Stable normalized counts: 135,969 lexemes; 185,129 senses; 132,238 lexical relations; 619,716 morphology rows; 9,627 sentences; 4,997 translation pairs.
- Tables: `source_registry`, `import_runs`, `raw_assets`, `lexemes`, `senses`, `lexical_relations`, `morphology`, `frequencies`, `sentences`, `translation_pairs`.
- Indexes cover normalized lemma, reverse morphology form, sentence language/text, and source IDs.

## Known failed commands

- Initial Git status failed dubious-ownership; read-only/worktree commands now use `git -c safe.directory=D:/school`.
- Independent worktree could not be made safely because the requested EOT directory is untracked inside the dirty `D:\school` parent repository, not its own repository.
- Initial importer failed because Source Registry INSERT had 18 placeholders for 17 columns; corrected.
- Windows `tar` could not decompress standalone bzip2; the already-installed project Python runtime was used for mechanical decompression.

## Next exact task

1. Run remaining architecture/domain/lint regression gates.
2. Expand documentation only if required; the core import/retrieval pipeline is operational.

## Validation

- Already: official downloads/SHA-256 checks; manifest/schema; two imports proving idempotency; acceptance queries with provenance; five executable data-corpus tests; typecheck.
- Pending: lint and architecture/domain regression gates.
