> **HISTORICAL — superseded by [CURRENT_STATUS.md](CURRENT_STATUS.md).**  
> Preserved as development history. Do not use this file as current product/status authority.

# DATA × BETA CORE SEMANTIC MERGE REPORT — 2026-08-28

## Merge bases

- Data side: exact bytes from `EOT_DATA_POST_WAVE_MERGE_HANDOFF_20260828.zip`.
- Beta side: latest isolated Beta Core + T implementation branch derived from the previously installed F/U1/H combined checkpoint.

## Data handoff verification

- 14/14 manifest files present.
- 14/14 current SHA256 values matched the handoff manifest.

## Shared-file reconciliation

### `package.json`

Merged additively. Data commands and Beta wave diagnostics coexist. No dependency/version conflict was detected.

### `src/domain/english/corpusRetrieval.ts`

Beta branch had not modified this file. Exact Data current version preserved.

### `src/persistence/dataCorpusTypes.ts`

Beta branch had not modified this file. Exact Data current version preserved.

### `src/persistence/index.ts`

Beta branch had not modified this file. Exact Data current version preserved, including corpus adapter export.

## Data-owned source

Exact Data handoff bytes preserved for corpus schema, source manifest, Data acquisition/import/retrieval/validation source, tests, cross-track documentation and SQLite corpus adapter.

## Cross-track semantic issue discovered

K measurement abstention had been wired too strongly into C admission: an UNKNOWN-polarity capability observation was being rejected from history because it could not prove capability.

Resolution:

- K remains authoritative over proof strength and returns `NO_CAPABILITY_PROOF` / abstention.
- C remains authoritative over immutable learner history and may retain UNKNOWN observations.
- UNKNOWN never becomes positive/negative ability proof merely because it is retained.

## Diagnostics

Merged isolated-source diagnostics currently pass across A–V implemented waves, U1 host gate, architecture/domain/scenario/Stage4/Stage5A, Stage3 preflight and strict domain compilation.

The real live Expo dependency environment is not present here, so full project typecheck/lint and Data live gate are intentionally deferred to the user’s actual repository after installation.

## Merge acceptance status

`READY_FOR_LIVE_INTEGRATED_REAUDIT`

This is not `STABLE_BETA` and not learner-facing UI/UX acceptance.
