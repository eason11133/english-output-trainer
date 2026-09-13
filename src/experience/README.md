# N. Product Experience / UX Architecture

## Ownership

Canonical owner: `src/experience`

N translates authorized product/runtime truth into learner-facing actions and information hierarchy. It does not choose pedagogy, mutate learner truth or score performance.

## Core learner spine

`Today / Practice / My English → Lesson / Output Workspace → Result`

Progress / History is secondary under My English. External-material import belongs to Practice. AI Teacher remains cross-surface behavior, never a tab or chat home.

## Current Beta rules

- One dominant learner action per state.
- Authentic work remains the anchor; teaching attaches to the learner's output.
- Internal reasoning, target IDs, mechanisms, evidence categories and Stage/debug terminology stay hidden.
- Writing prompt/rubric/original and Translation source/output remain separate objects.
- Fresh check and transfer must display the actually delivered new task, not merely a blank editor.
- Result describes what was independent/assisted/returned without activity gamification.
- Resume returns to saved pedagogical state; closed sessions do not reopen.
- Help requests and source corrections are explicit learner actions and do not become failure evidence.

## Public contracts

- `ExperienceContractV1`
- `OutputWorkspaceVM`
- `LearnerLessonChromeV1`
- learner-spine read VMs

## External limits

Formal Exam isolation, complete Explore, physical keyboard/back behavior and screen-reader/device acceptance remain downstream or device-dependent. Host gates do not prove those behaviors.
