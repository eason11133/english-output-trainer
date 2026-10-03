# T. AI / Model Layer

> Current overall status: **PARTIAL / READY_FOR_AUDIT**.  
> For the repository-wide snapshot, see [../../CURRENT_STATUS.md](../../CURRENT_STATUS.md).

## Ownership

Canonical owner: `src/model`.

T owns the bounded model-call boundary: operation contracts, provider/server separation, structured-output requirements, prompt/schema identity, timeout/retry ownership, proposal guards and model-run lineage.

T does **not** own learner truth, mastery, curriculum selection, pedagogical diagnosis authority, or generated-content validity.

## Current first-pass capabilities

- server-owned provider abstraction;
- required structured output for production operations;
- timeout/retry ownership;
- authority/hallucination guard boundary;
- prompt/schema version identity;
- deterministic failure/fallback boundary.

Current production operation contracts include:

- Teacher planning;
- qualified Teaching Block selection;
- artifact transcription/OCR;
- GSAT semantic assessment.

The learner client does not select a provider/model or receive provider secrets.

## Contract-only / incomplete areas

- semantic diagnosis as a T-owned capability — intentionally not claimed; H/I/E/F own interpretation/qualification;
- model-assisted content generation — G owns validity and current generation coverage is incomplete;
- alternate paid-model fallback routing;
- whole-product monetary cost governance;
- global learner/account rate governance;
- calibrated whole-product model evaluation.

## Core truth rule

> Structured model output is a proposal. Guards and owning subsystems decide whether it may affect execution or canonical learner truth.

See `src/model/contracts.ts`, `src/model/capabilities.ts`, `src/model/guards.ts`, and `coach-server/teacher-server.mjs`.
