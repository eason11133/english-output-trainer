# CURRENT EOT STATUS — UI/UX PRE-CLOSURE CANDIDATE

Date: 2026-08-28

This source tree is the post-Data + Beta Core merged checkpoint plus a consolidated closure wave for the two semantic blockers found by the latest independent integrated audit.

It is NOT yet a claim that the backend is sealed or that learner-facing UI/UX may be locked without re-audit.

## Latest independent audit before this candidate

Independent verdict:

- `MERGE_BLOCKED`
- blocking count: 2

The audit confirmed that the earlier F/U1 blockers, C/K UNKNOWN-history regression, live TypeScript composition and lint were already closed, while finding two remaining semantic blockers:

1. native learner-action replay could write the same production twice after a process-death retry;
2. Q could mix teacher annotation / unknown OCR regions into learner work through unsafe whole-page fallback.

The audit also found the TypeScript `SqliteEnglishCorpusRetrievalPortV1` implementation overclaimed the public Data contract, although no runtime consumer was injected yet.

## Closure implemented in this candidate

### M/U1/C durable learner-action idempotency

The learner action identity is now used as the durable native evidence operation identity rather than retry-generated observation IDs.

The evidence idempotency fingerprint is based on stable semantic action content rather than random observation/evaluation/candidate IDs.

The action identity is stored in the persisted block-event payload. A restored session checkpoint checks whether that learner action was already recorded before creating another runtime event.

Therefore the crash window:

learner submits
→ evidence + checkpoint commits
→ process dies before next Teacher step
→ app restores checkpoint
→ same answer is submitted again

is intended to resolve as an idempotent replay, not a second canonical evidence chain or a duplicate runtime learner action.

### Q authentic source-role fail-closed normalization

Q now explicitly represents:

- `TEACHER_ANNOTATION`
- `UNKNOWN_REGION`

as non-teaching material parts.

Teacher annotation and unknown-region spans are preserved/quarantined rather than merged into learner work.

Whole-page fallback is allowed only for direct learner text capture (`PASTE` / `DIRECT_TEXT`) when no classifier spans exist.

For camera/gallery/PDF/classified input, if no confirmed learner-work region exists, Q fails closed with `authentic_input_requires_confirmed_learner_work`.

Mixed teacher annotation + learner work keeps only the learner span as `learnerWorkText`.

### Data runtime adapter truthfulness

`SqliteEnglishCorpusRetrievalPortV1` now implements the public bounded contract instead of casting flat SQLite rows into nested TypeScript shapes.

It now has explicit projections for:

- lemma senses with parsed glosses and lexical relations;
- morphology with parsed features and provenance;
- OEWN examples with target occurrence and learner-display metadata;
- nested EN↔CMN sentence pairs with independent provenance/contributor/license state on both sides plus pair provenance.

`EXAMPLES` has its own SQL branch.

Data authority remains unchanged: the adapter supplies bounded records only and does not decide teaching, learner truth, transfer or evidence.

## Fresh diagnostics in the isolated closure tree

Engineering diagnostics currently pass for the changed boundaries:

- strict domain TypeScript compile;
- Q adversarial tests including annotation-only, mixed annotation/work, high/low unknown-region and direct-paste fallback;
- M session/idempotency tests including restored-checkpoint replay suppression;
- U1 host gate including durable learner-action replay simulation;
- Data runtime adapter contract-shape tests;
- fresh H rebuild/gate, confirming the previous six H failures were stale generated-artifact debt rather than live H behavior.

Relevant G/H/I/K/L/M/Q targeted regressions also pass in the fresh compiled source.

These diagnostics do NOT replace live Expo typecheck/lint or native-device acceptance.

## Current product boundary

The learner-facing UI/UX is still NOT Stable Beta.

No major learner UI redesign is included in this closure package.

The UI/UX research/design wave may continue in parallel, but runtime contracts should only be treated as sealable after an independent live re-audit confirms these closure semantics.

## If independent re-audit passes

The next major product wave is:

**Writing + Translation learner-facing UI/UX redesign**

This means a real UX/visual rebuild while preserving useful working capabilities such as paste, camera/gallery/PDF intake, OCR clarification, contextual lookup and backend learning truth.

The redesign must include a learner-facing Teaching Block interaction system, not merely chat bubbles or visual reskinning.
