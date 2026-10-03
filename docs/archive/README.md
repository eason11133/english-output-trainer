# Historical development documents

This directory defines the repository's documentation policy for older EOT development material.

## Current authority

For current product truth, use:

- [../../README.md](../../README.md)
- [../../CURRENT_STATUS.md](../../CURRENT_STATUS.md)
- [../architecture/EOT_V1_MAIN_ARCHITECTURE.md](../architecture/EOT_V1_MAIN_ARCHITECTURE.md)
- current implementation under `src/`, `app/`, `components/`, and `coach-server/`

## Historical material

EOT intentionally preserves dated rebuild contracts, Codex prompts, reconciliation reports, closure reports, old UX/visual contracts, merge reports and audit artifacts because they document how the system evolved.

They are **not current product/status authority**, even when an old file originally used labels such as `AUTHORITATIVE`, `CURRENT`, `CLOSURE`, `READY`, or `PRODUCTION`.

The root-level historical documents should carry an explicit banner pointing back to `CURRENT_STATUS.md`. Historical non-text artifacts include `EOT_RECONCILIATION_MATRIX_2026-08-19.csv`, `EOT_UX_V2_VISUAL_REFERENCE.png`, and `EOT_VISUAL_CONTRACT_VERTICAL_SLICE_V1.png`.

The legacy snapshot directories `v0.2-update/` and `v0.3-update/` are also historical snapshots, not current architecture.

## Rule

When a historical document conflicts with `CURRENT_STATUS.md` or current executable code, current code wins and `CURRENT_STATUS.md` is the human-readable summary.

This cleanup does not delete or rewrite development history; it separates current truth from historical process documentation.
