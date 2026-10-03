> **HISTORICAL — superseded by [CURRENT_STATUS.md](CURRENT_STATUS.md).**  
> Preserved as development history. Do not use this file as current product/status authority.

# EOT Public MVP — Full-Repo Rebuild Contract for Codex
**Date:** 2026-08-19  
**Baseline SHA-256:** `0301f77b2121ba0b1e7383f1da0b332295b6422f80930d400d5c539c39a60abc`  
**Status:** AUTHORITATIVE — supersedes conflicting v1.0/v1.1 frontend reset contracts and recent patch instructions.

## 0. Role

You are implementing the real English-learning product in the user's complete Expo repository.

This is not:
- a visual patch,
- a Placement patch,
- a Today patch,
- another prototype,
- another parallel vNext layer.

This is a **learner-path consolidation and public-MVP rebuild**.

Read first:
1. repository `AGENTS.md`
2. this contract
3. `EOT_RECONCILIATION_2026-08-19.md`

Because the repo uses Expo 57, follow `AGENTS.md` and verify exact Expo 57 APIs before changing framework behavior.

The old folder:

`docs/EOT_v1.1_READY_FOR_CODEX/`

is historical input only. It is NOT the current governing source of truth where it conflicts with this contract.

---

# 1. Non-negotiable product spine

The learner-facing product is:

```text
Today
→ Mission
→ Result
→ My English update
→ Next Frontier
→ next Today

Journey / History accumulates meaningful changes over time.
```

The learner must feel:

> "I am cultivating my own English."

Not:

> "I am choosing an English feature."

Do not use game/dice mechanics or fake RPG scores.

---

# 2. First-use contract

A new learner must NOT be required to complete Placement before getting value.

Default:

```text
first entry
→ minimal intent/context only if needed
→ start useful learning
```

Optional:

```text
Quick Ability Exploration
```

Ability Exploration:
- is never a gate,
- can be stopped,
- can leave state UNKNOWN,
- writes into the same learner truth as normal learning,
- is not required for Today.

Remove all root/navigation authority from `placementDiagnostic.completed`.

---

# 3. One learner truth

## Canonical source of truth

Raw:
- learner actions
- Evidence / Observation events
- support usage
- response behavior
- imported learner work
- assessment artifacts
- encounter/capture evidence when implemented

Derived:
- Learner State
- Hypotheses
- target lifecycle
- behavioral profile
- scheduling/allocation views

## Legacy data rule

Legacy:
- `LearnerSkillProfile`
- old score fields
- old `PlacementDiagnosticResult`
- old `WeaknessEvidence`
- old `LearningEvent`
- old `RetrievalState`
- old checkpoint/mastery state
- old DailyPlan truth

must NOT remain a second governing learner model.

Create explicit migration/read adapters for trustworthy raw history where useful.

Do not migrate derived score truth blindly.

---

# 4. No parallel governing path

This is the most important engineering rule.

Do NOT:
- add a new v3 service while old screens still mutate old learner truth,
- add a new onboarding route while root guard still enforces old Placement,
- add a new target registry while Today still sources only Gold points,
- add a new tutor policy while MissionRunner still fundamentally resolves only canned Gold prompts.

At the end of the rebuild, production routes must have one active path.

Old code may remain only if:
- unreachable from production, or
- read-only for migration/history, or
- clearly marked dev/test fixture.

---

# 5. Production content / target universe

The production learner universe cannot be the three Gold fixtures.

Move Gold fixtures to dev/test role.

Build a real production Target/Knowledge registry abstraction fed by:
- existing trustworthy system content,
- vocabulary catalog,
- grammar knowledge,
- exam packs,
- imported learner work,
- learner-created content,
- diagnosed targets from real output,
- teacher/school/cram content when present,
- later capture/encounter sources.

A learner state may be sparse.

Do not create fake state for every possible English skill.

---

# 6. Progressive learner discovery

Do not equate adaptive diagnosis with:
- answer correct → harder,
- answer wrong → easier,
- rotate MCQ / fill-in,
- cover every skill category.

Implement:

```text
raw learner action
→ observations
→ competing hypotheses
→ decision relevance
→ minimum diagnostic only if it changes the next action
```

If diagnosis is not decision-relevant, teach/train directly.

Unknown is valid.

The system needs enough certainty to choose the next useful action, not a complete level label.

---

# 7. Hypothesis / target model

Introduce or consolidate a real hypothesis layer.

Minimum hypothesis kinds:
- CAPABILITY
- EXECUTION
- CONTEXT
- SCORING
- SOURCE_ERROR
- SLIP
- UNKNOWN

Target gate:
- IGNORE
- MONITOR
- HOLD
- DIAGNOSE
- ACTIVE_TARGET

Target lifecycle should support:
- candidate / monitoring
- active
- strengthening
- transfer pending
- stable-for-scope
- released
- diagnosis required when needed

Do not treat one observation as a permanent weakness.

---

# 8. Tutor policy

Implement a policy service that chooses the next pedagogical action.

Intervention intents:
- HOLD
- PROBE
- DIAGNOSE
- TEACH
- TRAIN
- SIMULATE
- VERIFY / TRANSFER as needed

Inputs include:
- learner state
- hypotheses
- target state
- recent evidence
- support history
- task context
- current product (General / Exam)
- current goal/deadline
- behavior evidence
- time budget
- available content/interactions

The learner must not choose:
- "AI mode"
- "teach me with example vs contrast"
as a required product decision.

The system chooses the teaching move.

---

# 9. Teaching mechanisms

Support stable teaching mechanisms such as:
- Representation Formation
- Discrimination / Contrast
- Meaning–Form Mapping
- Retrieval Strengthening
- Construction / Composition
- Corrective Repair
- Elaboration / Reasoning
- Consolidation / Transfer

Teaching content must be parameterized from the actual learner failure.

Preserve correct parts.

Focus one important issue at a time where appropriate.

Repeated failure must be able to change entry point.

---

# 10. Reteach is first-class

Mission interaction must have a real teaching/reteach path.

Required behavior:

```text
independent attempt
→ focused failure
→ light support when appropriate
→ learner still cannot do it / chooses "I don't know"
→ RETEACH / lower-load entry
→ learner re-produces
→ assisted evidence
→ independent proof required later
```

Do not model this as "Hint 1 → Hint 2 → Hint 3 → Reveal" only.

---

# 11. Stable interaction primitives

Use reusable learner actions, not one bespoke screen per pedagogical state.

At minimum architect for:
- SELECT
- ORDER
- MATCH
- MARK
- COMPLETE
- RECALL
- CONSTRUCT
- PRODUCE
- EXPAND
- REPAIR
- COMPARE
- EXPLAIN
- PLAN
- FULL_TASK

For every interaction:

> Prompt scope = Answer scope = Evaluator scope = Reveal scope.

---

# 12. Evaluation

Use deterministic evaluation when the task truly permits it.

Use AI when required for:
- free translation interpretation
- writing/open output
- multiple valid realizations
- naturalness/register
- intended meaning
- ambiguous diagnosis
- personalized examples/context when templates are insufficient

AI is not the teaching policy.

Coach failure/network timeout must not become learner-failure evidence.

Low confidence must not promote learner state.

---

# 13. Chinese→English translation policy

Default to English-side hypotheses:
- lexical retrieval
- collocation
- grammar
- tense/aspect
- verb pattern
- sentence construction
- meaning→English encoding
- production/composition load
- article/plural/form
- naturalness
- slip

Only introduce source-language comprehension as a competing hypothesis when output shows actual semantic distortion.

Separate:
1. linguistic validity
2. meaning fidelity
3. exam/teacher scoring alignment

A valid alternative must not pollute General capability truth.

---

# 14. Evidence / state integrity

Must preserve:

- recognition ≠ retrieval
- retrieval ≠ production
- hinted success = assisted
- reveal cannot create independent proof
- lookup counts as support
- immediate ≠ delayed
- same-context ≠ transfer
- one failure ≠ inability
- one success ≠ mastery
- unknown ≠ weak

Use `STABLE_FOR_SCOPE` semantics, not universal mastery.

If existing enum names must remain for migration, learner-facing copy and policy must still obey this rule.

---

# 15. Time-boxed sessions

A stated 5/10/20 minute session is a real time budget.

- queue may contain planned + reserve actions
- faster learner may complete more
- slower learner may complete fewer
- do not start high-setup-cost action near the boundary
- finish the current small interaction
- soft stop is allowed
- background time does not count
- interruption is not failure
- restart/resume must not duplicate evidence

Strategic reallocation happens between sessions.

Within-session changes are local teaching adaptations.

---

# 16. Today

Today is the main product entry.

It answers:
1. Where is my English right now?
2. What am I pushing today?
3. Why this?
4. What do I press now?

It must not be a module toolbox or engineering dashboard.

It should be driven by real learner truth.

For a new learner with almost no evidence:
- show an honest starting state,
- choose a useful learning entry,
- do not fabricate personal history.

For an established learner:
- focus + reason must cite actual evidence/target state.

---

# 17. Mission

Mission is not "a list of questions."

It is the execution environment for the adaptive teaching interaction.

Desired local loop:

```text
Attempt
→ Observe
→ evaluate / hypothesize
→ minimal diagnosis only if needed
→ focused teaching/support
→ learner repair / re-output
→ evidence closes
```

Later sessions handle transfer/delayed verification.

No dead ends.

"I don't know" is a valid learning action.

---

# 18. Result

Result must tell a learning story from real evidence.

Required outputs when evidence supports them:
- what moved forward,
- what remained unresolved,
- what the next frontier is,
- that future allocation has changed when it actually has.

Do not show:
- arbitrary XP,
- fake percent mastery,
- generic 8/10 as the primary result.

---

# 19. My English

My English is the learner-facing projection of learner state.

It should become more valuable with use.

It may organize capability areas such as:
- active vocabulary/chunks
- sentence control
- translation production
- reading
- long-form writing
- other supported domains

But:
- unknown stays unknown,
- no fake 0–100 scores,
- no false global mastery.

Target-level detail can show:
- current evidence-supported state
- latest meaningful evidence
- support dependence
- next evidence needed

---

# 20. Next Frontier

Frontier is not a percentage bar.

It is the next real evidence-backed breakthrough.

It must be computed from:
- current state,
- target lifecycle,
- next required evidence,
- General/Exam policy,
- timing/spacing.

It must be understandable in learner language.

---

# 21. Journey / History

Journey records meaningful milestones, not activity spam.

Eligible examples:
- first independent use
- first changed-context transfer
- delayed verification
- recurring error materially reduced
- real translation/writing score breakthrough
- meaningful exam milestone
- real external achievement when imported

Do not record every question, every session, or streak as a milestone.

---

# 22. Learn

Learn is secondary / learner override.

It answers:
> "I want to deliberately choose what to practice or bring into the system."

Possible content:
- translation
- vocabulary/chunks
- grammar
- reading
- writing
- imported work
- my materials
- teacher content
- exam scope

Do not put "what is currently growing / unstable / my frontier" here as the main learner state view.

That belongs to My English.

Do not make vocabulary/grammar/etc. first-level app navigation.

---

# 23. General vs Exam

Shared learner truth.

Different policy.

General:
- durable usable English
- transfer
- long horizon
- rich tutoring

Exam:
- maximize obtainable exam performance given scope/time
- can RECOVER, SECURE, EXPAND, EXECUTE, VERIFY
- can PARK a real weakness
- prioritizes actions, not weaknesses
- no fake expected-score precision

Exam assessment/mock:
- no hints/reveal/reteach during the assessment attempt
- teaching may happen afterward

Exam practice may teach.

---

# 24. Behavioral evidence

Record when available:
- response time
- first input latency
- edits
- hint/lookup/reveal
- retry
- skip / return
- task completion time
- session position
- timed/untimed
- support

Rules:
- fast ≠ strong
- slow ≠ weak
- compare to learner/task context, not arbitrary global thresholds
- use mostly between sessions for policy, not instant personality labels

---

# 25. Data migration

Before destructive removal:
- preserve a raw legacy snapshot.

Migrate only trustworthy raw data:
- learner-created vocabulary/content
- raw diagnostic responses
- imported work
- raw retrieval attempts where semantics can be mapped
- meaningful timestamps/source references

Do not trust as current truth:
- old score percentages
- old ±2 skill scores
- old mastery/checkpoint conclusions
- old DailyPlan completion as new Mission truth

Use an explicit migration version and make it idempotent.

---

# 26. UI / human-factor acceptance

This is a consumer subscription product.

Every surface must be tested against human behavior.

Requirements:
- Chinese-first in zh-TW
- no mixed engineering copy
- one dominant action per state
- no mandatory setup wall
- no mandatory diagnostic
- no confusing "mode" decisions
- low friction
- typing only when justified
- selection auto-advances when no feedback decision is needed
- keyboard/safe-area behavior works
- visual hierarchy feels like a finished consumer app, not a dev dashboard
- no debug data on learner surface
- errors have recovery
- loading never looks frozen
- no screen whose only value is explaining the system architecture

The product should feel:
- intelligent
- personal
- calm
- alive
- progressively more valuable

Not:
- childish
- gamified for its own sake
- cram-school worksheet
- admin dashboard
- generic AI chat wrapper

---

# 27. Architecture enforcement tests

Add machine gates, not only behavior-unit tests.

Required:

### A. Root route gate
Actual production routing proves Placement is optional.

### B. Production Gold-fixture ban
Fail if production Today / Mission / My English / Journey directly import Gold fixture modules.

### C. Legacy learner-truth boundary
Fail if active vNext application services import legacy learner-score/daily-plan/checkpoint truth outside explicit migration adapters.

### D. One evidence write path
Capability evidence goes through canonical evidence service.

### E. Same-session Stable ban
Stable-for-scope cannot be created by same-session repetition alone.

### F. Support integrity
Hint/reveal cannot create independent evidence.

### G. Reteach path exists
Repeated failure / unknown response can reach teaching and re-output.

### H. Result causality
Session evidence transition changes Result + learner projection.

### I. Next-session causality
Relevant session evidence changes future allocation.

### J. Product policy separation
Same shared evidence can yield different General vs Exam allocation.

---

# 28. End-to-end scenario harness

Do not declare done because unit tests pass.

Build an application scenario harness that executes at least these cases:

1. fresh learner → no placement → first learning → Result → My English → Frontier
2. recognition success + production failure → production-focused teaching → assisted only
3. repeated failure → RETEACH → re-output
4. independent → later transfer → later delayed stable-for-scope
5. translation valid alternative vs teacher reference
6. Exam deadline policy parks low-value weakness
7. time-box / soft stop / resume / restart
8. imported learner work creates actionable target without pretending exposure = mastery

If any known invariant fails, build FAILS.

---

# 29. Public beta release gates

Before asking the user to do product acceptance, Codex must report:

## Engineering
- `npm run typecheck`
- `npm run test:domain`
- any new scenario test command
- Expo bundle/start validation
- no missing imports
- no stale compile errors

## Product
- all 8 scenario gates pass
- no mandatory placement
- no Gold-only production universe
- My English reflects more than the three fixture targets in realistic seed/flow
- real learner actions cause persistent next-step changes

## Reliability
- network/provider failure has safe fallback
- evidence not duplicated
- session resume/restart verified
- migration idempotent

## Public-market basics
Either implemented or explicitly listed as the only remaining launch-hardening items:
- privacy
- delete account/data
- feedback/report
- analytics
- crash/error monitoring
- AI cost/rate guard
- release config

The user must not be used to discover ordinary integration defects.

---

# 30. Do not stop halfway

Do NOT finish after:
- removing the Placement gate,
- rebuilding Today,
- adding a new hypothesis type,
- making Mission prettier,
- adding a Journey page,
- getting tests green.

The requested deliverable is the complete product spine working together.

If a compatibility layer prevents consolidation, prefer cutting active vNext production over to the new authoritative path and isolating legacy behavior.

Preserve useful capabilities, not legacy governing semantics.

---

# 31. Completion report

Return a concrete handoff:

1. **What governing paths were removed**
2. **What became authoritative**
3. files added / changed / archived
4. data migration behavior
5. exact scenario-harness results
6. typecheck/test/bundle results
7. exact physical-device acceptance steps
8. what the user should observe
9. explicit FAIL conditions
10. remaining public-beta launch-hardening work, if any

Do not say only "implemented" or "tests passed".

Do not ask the user to debug ordinary runtime failures.
