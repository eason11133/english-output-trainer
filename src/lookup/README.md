# P. Contextual Lookup

> Current overall status: **PARTIAL subsystem with a FIRST_PASS current lookup slice / READY_FOR_AUDIT**.  
> For repository-wide status, see [../../CURRENT_STATUS.md](../../CURRENT_STATUS.md).

P owns contextual lookup interaction, resolution policy and lookup-exposure constraints.

## Current first-pass behavior

- phrase/chunk candidates are preferred before word fallback;
- single-word lookup can resolve lemma/contextual sense and fail closed on unresolved ambiguity;
- grounded results can return concise zh-TW meaning in the current context;
- lookup exposure/history is recorded as a non-evidence event;
- normal learning checks can lock only answer-revealing target lookup;
- formal assessment can lock lookup entirely;
- the same lookup primitive is available across current learner surfaces;
- lookup/help exposure is never, by itself, proof that the learner can produce the language.

Lookup exposure also contaminates the current evidence opportunity as assistance; closing the lookup UI does not erase that support history.

## Current limits

Contextual resolution remains provenance-gated and can abstain when available lexical/content bindings are insufficient. Native behavior across every physical device is not yet accepted.

Lexical encounter history is additionally tracked under `src/learner-truth/lexicalEncounter.ts`, including target/sense context, encounter/lookup counts and reencounter signals.
