# G. Content / Task / Context Generation

> Current overall status: **PARTIAL / READY_FOR_AUDIT**.  
> For the repository-wide snapshot, see [../../CURRENT_STATUS.md](../../CURRENT_STATUS.md).

## Ownership

Canonical owner: `src/content`.

G owns bounded content/task/context supply and validation. It does **not** own learner mastery/evidence state, curriculum target selection, or Teacher policy.

## Current implementation

The current capability catalog marks the following as **FIRST_PASS**:

- prompt-generation contracts/runtime pieces;
- fresh-task supply;
- changed-context tasks;
- semantic validity;
- valid-alternative handling;
- context relevance;
- generated-content validation;
- content/material packs.

The following remain **CONTRACT_ONLY / incomplete**:

- broad examples and counterexamples;
- distractor generation depth;
- general difficulty control;
- cognitive-load control;
- content-safety depth across generated content.

The current GSAT content path also includes promoted, project-authored tasks with canonical bindings and validation receipts for all eight repository families through `examBetaBank.ts` and related promotion/validation code.

## Authority boundary

G can supply a validated task opportunity. It cannot decide what a learner has mastered, select the curriculum target, or turn model-generated content into canonical evidence on its own.

Generated/model-authored content must pass the owning validation path before it can be used for a learning/evidence claim.

## Why this is not “complete”

Fresh/changed-context content exists, but broad content coverage, generation quality, difficulty/load calibration, examples/counterexamples/distractors, and real learner validation are still unfinished.
