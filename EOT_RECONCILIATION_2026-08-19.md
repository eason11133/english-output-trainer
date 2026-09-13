# EOT Research → Product → Code Reconciliation
**Date:** 2026-08-19  
**Baseline ZIP SHA-256:** `0301f77b2121ba0b1e7383f1da0b332295b6422f80930d400d5c539c39a60abc`  
**Baseline:** user-uploaded full current repository, `english-output-trainer-current-2026-08-19.zip`

## 0. Why this document exists

This is not another design proposal.

It is a reconciliation between:

1. the user's repeated product decisions,
2. the research / learning-system decisions already made,
3. the current repository that is actually governing the learner experience.

The purpose is to stop the Eason One failure pattern:

> add a new architecture, leave old authority alive, pass local tests, then discover on the real product that the old path is still governing.

From this point onward, a product decision is not "implemented" because a screen, type, presenter, or test exists. It is implemented only if the **active learner path is governed by it**.

---

# 1. Executive verdict

The current repository is not one coherent product generation.

It contains at least two active learner-truth / learning-control systems:

### Legacy / v1 world

Centered around:

- `context/AppDataContext.tsx`
- `types/domain.ts`
- `LearnerSkillProfile`
- `PlacementDiagnosticResult`
- `DiagnosticSession`
- `WeaknessEvidence`
- `LearningEvent`
- `DailyPlan`
- `DailyLearningRecord`
- `RetrievalState`
- `WorkoutSessionState`
- `lib/learnerModel.ts`
- `lib/dailyPlan.ts`
- `lib/dailyLearning.ts`
- `lib/retrieval.ts`

### v2 world

Centered around:

- `src/domain/evidence/EvidenceEvent.ts`
- `src/domain/learner/LearnerKnowledgeState.ts`
- `src/domain/learner/projection.ts`
- `src/domain/scheduler/*`
- `src/domain/mission/*`
- `src/domain/session/*`
- `src/application/today/*`
- `src/application/growth/*`
- `src/application/journey/*`
- `src/repositories/AsyncStorageEvidenceRepository.ts`

The current learner-facing shell has begun moving toward the newer product idea, but the runtime is still split.

**Most important consequence:**
the app can say "we learn about you continuously" while a legacy placement guard still forces Placement; Placement can produce a skill profile and weaknesses while Today / My English / Journey read a different v2 evidence store; and the v2 Today system itself only has three hard-coded gold knowledge points.

That is not a cosmetic inconsistency. It is the central product/runtime failure.

---

# 2. Decisive current-repo contradictions

## R-01 — Optional Placement is stated in one path but overridden by the real root guard

`app/index.tsx` says:

- placement is not required,
- new learners should get value first,
- onboarding routes to `/onboarding/goals`.

But `app/_layout.tsx` still contains the actual root-level redirect:

```ts
if (
  ready
  && !loading
  && isAuthenticated
  && !placementDiagnostic.completed
  && !developerLevelOverride
  && !isAllowedBeforePlacement
) {
  return <Redirect href={'/placement' as Href} />;
}
```

So the active navigation authority still says:

> authenticated + placement incomplete → Placement

This directly violates the latest product rule:

> **No mandatory placement gate. Start learning immediately by default.**

### Required action

Remove Placement completion from production root access authority.

Placement / Ability Exploration may remain optional, but cannot control access to Today.

---

## R-02 — The test for "Placement is optional" checks the wrong route authority

`tests/domain/todayViewModel.test.cjs` checks:

- `app/index.tsx`
- `app/(tabs)/_layout.tsx`

for `!placementDiagnostic.completed`.

It does **not** check `app/_layout.tsx`, where the actual mandatory redirect lives.

Therefore a green test currently proves the wrong thing.

### Required action

Replace filename/string-presence checks with an application routing policy test that exercises the authoritative pre-onboarding routing function.

A scenario must prove:

```text
authenticated learner
placement incomplete
onboarding complete
→ may enter Today
```

and:

```text
authenticated learner
placement incomplete
onboarding incomplete
→ may enter first-start onboarding
→ may choose "start now"
→ reaches Today
```

---

## R-03 — Placement writes old learner truth; Today/My English/Journey read new learner truth

`context/AppDataContext.tsx::completePlacement()` writes:

- old `LearnerSkillProfile`
- old `PlacementDiagnosticResult`
- old `DiagnosticSession`
- old `WeaknessEvidence`
- old `LearningEvent`
- old vocabulary state
- old overall output level

It does **not** write v2 `EvidenceEvent` into `AsyncStorageEvidenceRepository`.

Meanwhile:

- Today reads `AsyncStorageEvidenceRepository`
- My English / Growth reads `AsyncStorageEvidenceRepository`
- Journey reads `AsyncStorageEvidenceRepository`
- Scheduler projects v2 state from `EvidenceEvent`

So "ability exploration" and "the system that decides my next learning action" are currently not one learner truth.

### Required action

There must be one canonical evidence truth for the active product.

Raw optional exploration responses can become normal vNext observations/evidence with appropriate scope/confidence/support metadata.

Legacy placement scores must not become a second capability authority.

---

## R-04 — Today / My English / Journey only know three gold knowledge points

`src/fixtures/goldKnowledgePoints.ts` defines only:

1. `many + plural noun`
2. `allow O to V`
3. `contribute to`

`src/application/today/todayMission.ts` builds scheduler candidates only from these IDs.

`app/(tabs)/growth.tsx` and `app/(tabs)/progress.tsx` also directly use these gold points.

So the new "My English" / "Journey" shell is honest within the gold slice, but it is not yet a model of the learner's English.

### Required action

Gold fixtures become test/dev fixtures, not production knowledge authority.

Production candidate supply must come from a real knowledge/target registry containing:

- learner-created / captured English,
- imported work,
- system content,
- teacher/school/cram content when real,
- current exam scope when relevant,
- existing trustworthy content packs,
- hypotheses/targets created from learner output.

The learner graph may remain sparse/unknown. It must not be artificially filled.

---

## R-05 — Mission is still a canned-activity selector, not the researched teaching loop

`goldActivityContracts.ts` predefines a small fixed set of activity IDs.
`goldActivities.ts` resolves canned prompts for the three gold points.
Mission Composer chooses among those contracts.

This means the current core is closer to:

> rank target → select one pre-authored activity

than:

> observe learner → form hypotheses → decide whether diagnosis matters → select teaching mechanism → compose the best interaction → collect new evidence.

### Required action

Separate:

- learning **intent**,
- teaching **mechanism**,
- interaction **primitive**,
- content / context generation,
- evaluation contract.

The production Mission runner must execute an `InteractionPlan`, not assume `promptId -> GoldActivityDefinition` is the product.

Gold activities may stay as deterministic fixtures for regression tests.

---

## R-06 — Current diagnostic router contradicts the newer research

`src/application/learning/diagnosticRouter.ts` is extremely coarse.

Current behavior includes:

```text
contains Chinese → MEANING_TO_ENGLISH / HIGH confidence
empty → PROMPT_COMPREHENSION
<8 words → IDEA_DEVELOPMENT
else → EXPRESSION_RANGE
```

This is not the hypothesis system previously designed.

It particularly contradicts the translation rule:

> Chinese→English failures should default to English realization hypotheses; source-language comprehension becomes a competitor only when output shows meaning distortion.

### Required action

Replace coarse single-label routing with:

```text
Raw response
→ observations
→ competing hypotheses
→ confidence / uncertainty
→ decision-relevance test
→ minimum diagnostic if needed
→ teaching / training / move on
```

Do not infer a source-language problem from the mere presence of Chinese.

---

## R-07 — Teaching is canned and only weakly tied to the learner's actual failure

`src/application/learning/teachingExperience.ts` contains fixed examples such as:

- `reduce stress`
- `stay away from my phone`
- `release pressure × / reduce stress ✓`
- `This activity → helps me → reduce stress`

These are useful prototype primitives, but they are not a learner-specific teaching policy.

### Required action

Keep stable teaching primitives, but parameterize them from:

- the actual learner response,
- the focused hypothesis/target,
- preserved correct parts,
- current support history,
- learner state,
- task context,
- the exact repair needed.

The learner should feel:

> "it is teaching the thing I just failed at"

not:

> "it opened a generic explanation template."

---

## R-08 — Mission lacks an explicit Reteach path

Current Mission interaction states include:

- READY
- ANSWERING
- HINT
- REVEAL
- REVISING
- CHECKING
- FEEDBACK
- etc.

There is no explicit `RETEACH` state / path.

The visible action pattern is essentially:

> answer → check → hint / reveal → revise

This violates the previously locked rule:

> repeated failure / "I still don't know" should change entry point and teach; do not escalate hints forever.

### Required action

Add a first-class teaching/reteach transition driven by policy, not just by a button label.

Reteach must be able to:

- preserve correct parts,
- isolate one issue,
- change representation,
- lower composition load,
- use contrast / meaning-form mapping / construction,
- return to learner production,
- record assisted vs independent evidence correctly.

---

## R-09 — New consumer shell is ahead of the runtime beneath it

Current tabs have been changed toward:

- Today
- My English
- Journey

Learn is hidden.

This is directionally aligned with the latest product framework.

But the data behind those screens is still the tiny v2 gold slice, while broader old learner data lives elsewhere.

Result:

> the surface says "my English life" but the runtime can only truthfully narrate three grammar/collocation targets.

### Required action

Do not undo the growth-oriented product spine.

Instead, make the runtime broad enough and singular enough to justify it.

---

## R-10 — The old repo audit already identified architecture that still governs today

Earlier EOT 2.0 Source of Truth already identified:

- ~1200-line God `AppDataContext`
- multiple overlapping daily truths
- coarse old learner scores
- prototype retrieval scheduler
- migration rule: preserve raw evidence, do not trust derived legacy scores
- rewrite `AppDataContext`
- archive/remove old active UX/state paths

The current repo still contains those active legacy authorities.

### Required action

Treat this rebuild as a **cutover/consolidation**, not another additive layer.

---

# 3. Latest product invariants that must govern code

These supersede conflicting older frontend contracts.

## P-01 — The product is a growth loop, not a feature toolbox

Authoritative learner loop:

```text
TODAY
↓
MISSION
↓
RESULT
↓
MY ENGLISH UPDATE
↓
NEXT FRONTIER
↓
NEXT TODAY
```

Parallel long-term projection:

```text
JOURNEY / HISTORY
```

`Learn` may exist as a deliberate override / library, not as the main product spine.

---

## P-02 — First-use promise

A new user must be able to receive value without first taking a test.

Default first-use path:

```text
Entry
→ one lightweight goal/context choice only when necessary
→ first useful learning action
→ first Result
→ first My English evidence
→ first Frontier
```

Optional accelerator:

```text
Quick Ability Exploration
```

It is never an admission ticket.

---

## P-03 — The product may start with UNKNOWN

Unknown is valid learner truth.

Do not invent:

- weak,
- strong,
- 73%,
- B2,
- mastery

simply because the UI wants a complete profile.

The system only needs enough evidence to choose the next useful action.

---

## P-04 — Progressive diagnosis happens inside real learning

The system learns about the learner through real learning actions.

Decision rule:

> Would competing hypotheses produce meaningfully different next actions?

If no:
- do the useful learning action.

If yes:
- insert the minimum useful diagnostic.

The learner should rarely experience this as "now I am taking a diagnostic test."

---

## P-05 — Interaction type follows the evidence need

Do not solve "diagnostic quality" by rotating question formats.

Examples:

- recognition uncertainty → low-friction discrimination/selection may be useful
- retrieval uncertainty → recall
- production uncertainty → controlled/free production
- sentence-construction uncertainty → construction/reorder/build
- meaning fidelity uncertainty → focused semantic check
- execution-load uncertainty → lower-load production
- transfer uncertainty → changed-context production

Typing friction is justified only when the resulting evidence is worth the cost.

---

## P-06 — Closed-loop adaptive teaching system

Authoritative intelligence loop:

```text
Observe
→ Diagnose
→ Find entry point
→ Teach
→ Observe response
→ Adapt locally
→ Re-encounter later
→ Transfer
→ Measure
→ Update
```

The product does not begin from "which content do I want to show?"
It begins from:

> "Why can this learner not do this yet, and what is the highest-value next cognitive action?"

---

## P-07 — Evidence rules

Hard invariants:

- recognition ≠ retrieval
- retrieval ≠ production
- immediate success ≠ delayed evidence
- same-context success ≠ transfer
- hint/reveal/lookup cannot produce independent evidence
- assisted success remains assisted
- explanation exposure ≠ mastery
- teacher exposure ≠ capability evidence
- one failure ≠ inability
- one success ≠ mastery
- unknown ≠ weak
- opportunity absence ≠ negative evidence

No UI or policy may contradict these.

---

## P-08 — Result must change the learner's world

Mission Result is not:

- 8/10
- XP
- "good job"
- task count

It should answer:

1. What actually changed?
2. What is still unresolved?
3. What does that change about the next step?

The change must come from evidence/state transition, not copywriting.

---

## P-09 — My English is the learner's evolving capability state

My English should answer:

> What English is becoming usable, what is still unstable, and what evidence do we actually have?

No fake precision.

It may show:
- active vocabulary / chunks
- sentence control
- translation production
- reading
- writing
- other scoped capability areas

but only when evidence exists.

Deep views may show target-level states and evidence stories.

---

## P-10 — Frontier is real, not gamified

Frontier is the next evidence-backed breakthrough.

Examples:

- "能在提示後使用 → 下一步：無提示獨立輸出"
- "已在原情境獨立使用 → 下一步：換情境"
- "已 transfer → 下一步：48 小時後無提示驗證"
- exam: "最近 3 次 2 次達標 → 下一步：再一次新題達標"

Do not invent an XP bar.

---

## P-11 — Journey is meaningful history

Journey records meaningful changes:

- first independent use
- first transfer
- delayed verification
- recurring error materially reduced
- translation / writing score milestone when real
- exam-cycle change when real
- meaningful external learning event

Do not turn Journey into an activity log or streak log.

---

## P-12 — Good stickiness, not manipulative retention

Optimize for:

> Useful Return Rate

A learner returns because:
- the app remembers,
- today's next step is useful,
- progress is visible,
- the frontier is clear,
- the product increasingly understands them.

Do not rely on fake streak pressure, FOMO, or arbitrary XP.

---

# 4. One authoritative learner path

For all new production use, the active path must become:

```text
ENTRY
  ↓
Learner Intent / Context
  ↓
START LEARNING
  ↓
Interaction
  ↓
Raw Learner Action
  ↓
Observation
  ↓
Evidence Ledger
  ↓
Hypothesis Set
  ↓
Decision-Relevance Gate
  ├─ no diagnosis needed → Teach / Train / Continue
  └─ diagnosis needed → Minimum Diagnostic
                         ↓
                     Hypothesis update
  ↓
Tutor Policy
  ↓
Interaction Plan
  ↓
Learner Repair / Production
  ↓
Evidence
  ↓
Learner State Projection
  ↓
Result Story
  ↓
Frontier
  ↓
Between-session Allocation
  ↓
Next Today
  ↓
Later Probe / Transfer / Delayed Verification
  ↓
Journey Milestone when warranted
```

General and Exam share evidence truth.

They do **not** share the same allocation policy.

---

# 5. Governing-authority cutover

## A. Entry authority

### New authority
A single onboarding/access policy based on:
- authentication
- minimum profile state needed to operate
- entitlement/product access

### Must lose authority
- `placementDiagnostic.completed`

Placement cannot gate Today.

---

## B. Learner truth authority

### New authority
Canonical raw truth:
- vNext Evidence / Observation ledger
- raw imported learner work / encounters
- raw assessment artifacts
- support/behavior telemetry

Derived truth:
- learner state projection
- hypotheses
- target lifecycle
- behavioral profile

### Must lose authority
Legacy derived:
- `LearnerSkillProfile.score`
- old ±2 / checkpoint state
- old `PlacementDiagnosticResult` as capability truth
- old `WeaknessEvidence` as target truth
- old `LearningEvent` as parallel evidence truth

Legacy raw data may be migrated through explicit adapters.

---

## C. Diagnostic authority

### New authority
Progressive diagnosis service using:
- observations
- competing hypotheses
- information value
- decision relevance
- time cost

### Must lose authority
- standalone placement coverage requirements
- "every learner needs an overall level before learning"
- answer-correctness-only adaptive difficulty as the definition of adaptivity

---

## D. Learning decision authority

### New authority
A `TutorPolicy / LearningDecisionService` that chooses:
- HOLD
- PROBE
- DIAGNOSE
- TEACH
- TRAIN
- SIMULATE
- VERIFY / TRANSFER where appropriate

Inputs:
- learner state
- active hypotheses
- target lifecycle
- recent evidence
- goal/product context
- time budget
- behavior
- content availability

### Must lose authority
- direct `knowledgePoint -> canned prompt` as the product decision
- feature/module selection as the default daily decision

---

## E. Interaction authority

### New authority
Stable interaction primitives + adaptive composition.

Examples:
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

Each interaction has:
- prompt scope
- answer scope
- evaluator scope
- reveal scope
- support contract
- evidence contract

### Must lose authority
`GoldActivityDefinition` as the universal production lesson format.

---

## F. Session authority

### Keep / upgrade
`MissionSession` / time-budget / resume / restart / idempotency can remain the durable session execution foundation.

But Mission becomes an execution container for adaptive `InteractionPlan`s, not a fixed list of Gold prompts.

---

## G. Result / My English / Journey authority

### New authority
All three are projections from the same learner truth.

No screen-specific fake state.

- Result = delta created by this session
- My English = current evidence-backed projection
- Frontier = highest-value next evidence state
- Journey = meaningful historical transitions

---

# 6. Exact repository disposition

## KEEP / UPGRADE

- `context/AuthContext.tsx`
- `context/LocaleContext.tsx`
- Expo Router shell
- `KeyboardProvider`
- `src/domain/evidence/*`
- `src/domain/learner/LearnerKnowledgeState.ts` concepts
- `src/domain/learner/projection.ts` rules, upgraded to richer state model
- `src/domain/session/*` durability semantics
- `src/repositories/*` patterns
- `src/domain/product/*`
- `src/domain/goal/*`
- entitlement separation from learner evidence
- `src/application/learning/contextualLookup.ts`
- Mission timing/resume/restart/idempotency concepts
- support-level evidence rules
- coach-server as an AI capability boundary, not the pedagogy authority
- existing imported work / vocabulary raw content where trustworthy

## REWRITE / CONSOLIDATE

- `app/_layout.tsx`
- `context/AppDataContext.tsx`
- `types/domain.ts` active responsibilities
- `data/diagnosticV2.ts`
- `app/placement/*`
- `src/application/today/todayMission.ts`
- `src/application/evaluation/missionActivityEvaluator.ts`
- `src/application/learning/diagnosticRouter.ts`
- `src/application/learning/teachingExperience.ts`
- `src/domain/learning/LearningInteraction.ts`
- `src/domain/mission/*` where it assumes static Gold activities
- `components/mission/MissionRunner.tsx`
- `src/application/growth/*`
- `src/application/journey/*`
- `src/fixtures/learningLibrary.ts`
- General / Exam allocation policy

## REMOVE GOVERNING AUTHORITY

The following may remain temporarily only for migration/history/legacy routes, but active vNext product code must not depend on them as learner truth:

- `LearnerSkillProfile` derived scores
- `lib/learnerModel.ts`
- `lib/dailyPlan.ts`
- `lib/dailyLearning.ts`
- old `LearningEvent`
- old `WeaknessEvidence`
- old `PlacementDiagnosticResult` capability authority
- old `RetrievalState` as a second learner model
- old checkpoint/mastery logic
- old Daily Plan as a second Today truth

## MOVE TO DEV / TEST FIXTURES

- `src/fixtures/goldKnowledgePoints.ts`
- `src/fixtures/goldActivities.ts`
- `src/fixtures/goldActivityContracts.ts`

These remain valuable as deterministic regression fixtures.

They must not define the production learner universe.

## ARCHIVE / REMOVE FROM ACTIVE PRODUCT PATH

After migration is complete:

- stale old module-first routes that are not intentionally reachable
- old placement route variants
- old daily lesson path
- old proof/checkpoint UX
- old debug/demo pages outside `__DEV__`
- old patch folders / archive code (already excluded from normal typecheck)

---

# 7. Translation-specific policy

For Chinese→English:

Default hypotheses are English-side:

- lexical retrieval
- collocation
- grammar control
- tense/aspect
- verb pattern
- sentence construction
- meaning→English encoding
- composition / execution load
- article/plural/word form
- naturalness / precision
- slip

Source-language comprehension becomes a competing hypothesis only if the learner output shows meaning distortion such as:

- negation reversal
- cause/effect reversal
- agent/patient reversal
- concession misread
- source main-clause misparse
- important semantic relation omitted/distorted

A valid English alternative must not become a General-English weakness simply because it differs from an exam/teacher reference.

Keep three views separate:

1. linguistic validity
2. meaning fidelity
3. assessment scoring alignment

---

# 8. Session adaptation policy

## During a session

Only local adaptation:

- error localization
- focused correction
- hint
- reteach / lower-load entry
- repair
- complete the current interaction coherently

Do not strategically reallocate the entire session after every answer.

## Between sessions

Strategic adaptation:

- evidence projection
- hypothesis / target update
- behavioral profile update
- General / Exam allocation
- delayed probe scheduling
- next Today

---

# 9. Public-MVP human factors

A technically correct learning engine is still not a consumer product.

The public MVP must satisfy:

## First 30 seconds
- value proposition is understandable
- one primary action
- no required test
- no internal terminology
- no setup wall

## First learning session
- useful within minutes
- interaction is not a form-filling routine
- typing only when evidence value warrants it
- choice questions auto-advance when no reflection step is required
- user is not asked to choose how the AI should teach
- feedback is focused and actionable
- failure does not feel punitive
- "I don't know" is a valid path into teaching

## End of session
- learner can say what changed
- next frontier is clear
- result is not fake gamification
- next session is genuinely influenced by current evidence

## Return reason
- app remembers
- app surfaces the next useful thing
- prior work comes back at meaningful times
- My English / Journey gets more valuable over time

## Paid-value test
If the product cannot make a free user think:

> "This is learning me, teaching me, and remembering what actually stuck"

then adding subscription packaging is premature.

---

# 10. Machine-enforced architecture gates

These gates are required to prevent another "new architecture exists but old path governs" failure.

## Gate A — No mandatory placement access gate

A test must execute the actual route policy and prove placement-incomplete learners can reach Today after minimal onboarding.

## Gate B — No production screen imports Gold fixtures

Production:
- Today
- Mission
- My English
- Journey

must not import:
- `goldKnowledgePoints`
- `goldActivities`
- `goldActivityContracts`

directly.

## Gate C — One learner evidence authority

Active product writes capability evidence only through the canonical evidence service.

Legacy placement/skill-profile code cannot independently mutate current capability truth.

## Gate D — No legacy learner score imports from active vNext path

Active vNext application/domain code must not import:
- `lib/learnerModel`
- legacy `LearnerSkillProfile` score state
- old `DailyPlan` truth
- old checkpoint mastery truth

except inside explicit migration adapters.

## Gate E — Progressive diagnosis scenario

A learner can begin UNKNOWN and receive a useful interaction.

No overall level is required.

## Gate F — Reteach scenario

Two failures / "I don't know" can cause a teaching entry-point change, followed by learner re-output.

It cannot be modeled as only "more hint".

## Gate G — Support evidence integrity

Hinted/revealed success cannot create independent evidence.

## Gate H — Result-to-next-session causality

A session that changes evidence must change:
- Result,
- My English,
- Frontier,
- and eligible next-session allocation when policy says it should.

## Gate I — Delayed/transfer integrity

Same-session repetition alone cannot create Stable.

## Gate J — General/Exam separation

Same shared evidence may produce different action priorities without duplicating learner truth.

---

# 11. End-to-end Company-Scenario equivalent for EOT

Unit tests are not release proof.

Every release candidate must run the same learner scenario harness.

## Scenario 1 — New learner, no placement

```text
fresh account
→ skip ability exploration
→ start learning
→ answer
→ evidence exists
→ Result explains real delta
→ My English has only supported state
→ Frontier exists
```

## Scenario 2 — Recognition ahead of production

```text
recognizes target
→ production attempt fails
→ system does not call it mastered
→ chooses production-focused next action
→ focused teaching
→ assisted repair
→ later independent proof required
```

## Scenario 3 — Repeated failure changes teaching

```text
attempt fails
→ light support
→ fails again / I don't know
→ reteach / lower-load entry
→ re-output
→ assisted evidence only
```

## Scenario 4 — Delayed transfer

```text
independent use
→ later changed-context probe
→ transfer
→ later delayed independent probe
→ stable-for-scope
```

No same-session shortcut.

## Scenario 5 — Translation valid alternative

```text
learner produces linguistically valid meaning-preserving alternative
teacher/reference uses different wording
→ General truth stays valid
→ Exam scoring-alignment risk may be recorded separately
```

## Scenario 6 — Exam deadline

```text
real weakness with low exam value / slow recoverability
high-value exam action available
→ exam policy may PARK the weakness
→ General learner truth is unchanged
```

## Scenario 7 — Session time / restart

```text
6-minute session
→ variable number of interactions
→ soft stop
→ background time excluded
→ restart does not duplicate evidence
→ resume preserves state
```

## Scenario 8 — Consumer first-use

A real device run must verify:
- no dev UI
- no mandatory test
- keyboard behavior
- back navigation
- copy is Chinese-first in zh-TW
- no mixed-language engineering terms
- no dead-end
- no unexplained loading/error screen
- one obvious primary action per state

If any known invariant fails here, the build fails before user acceptance.

---

# 12. Public beta readiness after product spine passes

Before anonymous public market testing / store beta:

- stable account/session behavior
- privacy policy
- account/data deletion path
- no secrets in client
- AI/network timeout fallback
- AI cost guardrails
- rate/abuse guardrails
- basic analytics for:
  - landing → start
  - first mission completion
  - next-day return
  - day-7 return
  - mission abandonment
  - support usage
  - technical failure
- feedback/report entry
- crash/error monitoring
- data backup / migration plan
- release configuration for Web / TestFlight / Google Play testing

These are launch gates, not substitutes for product value.

---

# 13. Definition of "implemented"

A research/product decision is implemented only if all are true:

1. it has a named invariant,
2. the active runtime is governed by it,
3. conflicting old authority has been removed or isolated,
4. a machine gate protects it,
5. the end-to-end scenario demonstrates it,
6. the learner-facing product expresses the value without exposing internal debug truth.

A type, presenter, prototype, markdown, test fixture, or hidden dev screen alone is not implementation.

---

# 14. Immediate decision

Do **not** continue the current patch/hotfix line.

Do **not** make Product Reset V3 as another surface patch.

The next implementation is a full-repo **learner-path consolidation / public-MVP rebuild**.

It must:
- preserve trustworthy capabilities,
- remove conflicting governing authority,
- make one learner truth,
- make one adaptive teaching path,
- make the growth loop the actual product,
- and prove the whole lifecycle before asking the user to test.
