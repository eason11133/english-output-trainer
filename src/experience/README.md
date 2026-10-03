# N. Product Experience / UX Architecture

> Current subsystem status: **PARTIAL / READY_FOR_AUDIT**. The code below describes the existing first-pass learner path; it is **not the final UX design source**. The learner-facing teaching experience is currently being rebuilt and integrated on top of the existing adaptive runtime.  
> Repository-wide status: [../../CURRENT_STATUS.md](../../CURRENT_STATUS.md).

## Ownership

Canonical owner: `src/experience`.

N translates authorized product/runtime truth into learner-facing actions and information hierarchy. It does not choose pedagogy, mutate learner truth or score performance.

## Current implemented learner spine

`Today / Practice / My English → Lesson or Exam practice → Result`

Progress / History is secondary under My English. External-material import belongs to Practice. AI Teacher remains cross-surface behavior rather than a separate chat/home authority.

Current first-pass experience contracts preserve several important boundaries:

- one dominant learner action per state;
- authentic learner work remains distinct from Teacher/model output;
- internal reasoning, target IDs, mechanisms and evidence categories remain hidden from normal learner surfaces;
- Writing prompt/rubric/original and Translation source/output remain distinct objects;
- fresh checks/transfer use separately delivered content rather than silently reusing the source task;
- Result distinguishes assisted/independent/returned outcomes;
- resume restores persisted runtime state;
- help requests and source corrections do not automatically become failure evidence.

## Current rebuild boundary

The existing screens/renderers are implementation evidence, not a design freeze. Current product work is redefining the learner-facing interaction model so diagnosis-specific teaching, representation changes, support fade, return-to-task behavior, lookup and reencounter can be experienced coherently without exposing internal architecture.

## Public contracts

- `ExperienceContractV1`
- `OutputWorkspaceVM`
- `LearnerLessonChromeV1`
- learner-spine read VMs

## Known limits

Formal Exam isolation, complete Explore, physical keyboard/back behavior, long-form IME behavior, accessibility/device acceptance and the final interaction/visual system remain incomplete.
