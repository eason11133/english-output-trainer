# J. Vocabulary / Chunks / Grammar / Reading Runtimes

> Current overall status: **PARTIAL**. The current Exam/shared-teaching architecture contains real Vocabulary/grammar/reading behavior, but J has not completed one dedicated full-subsystem upgrade/audit.  
> For repository-wide status, see [../../../CURRENT_STATUS.md](../../../CURRENT_STATUS.md).

## Ownership

Canonical owner: `src/specializations/language`.

J owns specialized language-teaching behavior for vocabulary, chunks, grammar and reading. It does not own separate learner truth or a separate learner-facing product silo.

## What is implemented now

The current J package contains concrete Reading runtime/review/diagnosis behavior:

- Practice / Mock / Formal reading-attempt state;
- immutable submit and result boundary;
- review focus and teaching handoff;
- evidence-focused diagnosis that can ask for learner explanation, evidence selection or option contrast and can abstain when evidence is insufficient.

Vocabulary, Comprehensive, Contextual Fill, Discourse, Reading and Mixed also participate in the current shared Exam path through:

- `src/content/examBetaBank.ts`;
- `src/application/exam/examFamilyDiagnosis.ts`;
- `src/application/exam/examTeacherInteraction.ts`;
- `src/application/exam/examPuzzleProjection.ts`;
- `app/exam-practice.tsx`.

The shared Teacher/Teaching-Block layer already contains vocabulary, chunk, morphology, spelling, construction and reading-oriented mechanisms. That does **not** mean every J capability has a complete specialized runtime.

## J capability scope still to deepen

- lexical representation/retrieval/productive use;
- morphology, collocation, chunk and register teaching;
- grammar meaning/form, construction and contrast;
- reading decomposition, reference, logic, structure and inference;
- input-to-output reuse and domain-specific repertoire selection.

Treat J as a real but incomplete specialization layer, not as either an empty concept or a finished subsystem.
