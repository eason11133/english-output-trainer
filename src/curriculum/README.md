# D. Curriculum / Outer Loop — Wave D first pass

## Ownership

Canonical owner: `src/curriculum`

The Outer Loop answers:

- What is worth learning next?
- Why now?
- Is the learner ready for it?
- Is this new learning, reinforcement, transfer, retention, or maintenance?
- What should Today prioritize within the learner's actual time budget?

It does **not** decide how to teach the selected target. That remains E/F.

## Canonical inputs

- A — Product / Identity / Commercial Context
- B — English Domain / Capability Graph
- C — Canonical Learner Truth
- R/S — product-policy signals (still first-pass / later hardening)

## Canonical outputs

- ranked curriculum candidates
- ready / reinforcement / transfer / retention / blocked frontiers
- TodayCurriculumPlanV1
- LessonPlanV1 adapter

## Important invariants

1. Unknown is not weakness.
2. New knowledge that is needed and prerequisite-ready is a learning candidate, not a cold-test failure.
3. A high-value target with missing prerequisites stays visible as BLOCKED but cannot be selected directly.
4. Learner priority can change ranking but cannot bypass prerequisites or mutate learner truth.
5. Same learner truth can yield different General vs Exam allocation without forking learner evidence.
6. Immediate success is not delayed evidence. Retention work cannot become due before a configurable minimum delayed-evidence gate.
7. 5/10/20/30/60 are time-budget envelopes, not fixed lesson recipes.
8. D chooses WHAT/WHY/WHEN; E chooses HOW NOW.
9. Allocation never writes mastery/evidence.

## Wave D status

`COMPLETE_FIRST_PASS`

Next major subsystem: E — AI Teacher / Inner Tutor Runtime.
