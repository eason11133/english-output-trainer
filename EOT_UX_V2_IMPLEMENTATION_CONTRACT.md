> **HISTORICAL — superseded by [CURRENT_STATUS.md](CURRENT_STATUS.md).**  
> Preserved as development history. Do not use this file as current product/status authority.

# EOT UX V2 — Learner Experience Implementation Contract

**Status:** AUTHORITATIVE  
**Supersedes:** `EOT_LEARNER_EXPERIENCE_VISUAL_CONTRACT_V1.md` for learner-facing UX  
**Date:** 2026-08-21

## 0. V2 reset

V1 exposed too much internal state-machine structure to the learner. The runtime remains, but the learner-facing unit changes from **a sequence of questions** to **one continuous adaptive lesson**.

Preserve the existing core:
- canonical Evidence and learner projection
- progressive diagnosis
- Tutor Policy
- Interaction Planner
- semantic/deterministic evaluation routing
- General/Exam shared truth
- policy-owned reteach
- no mandatory Placement

The product spine is:

**Today → Lesson → Result → My English → Next Frontier → next Today**

Journey records meaningful long-term milestones.

## 1. Visual reference is an implementation target

Use `EOT_UX_V2_VISUAL_REFERENCE.png` as the primary visual reference.

Match it closely in:
- overall layout
- information hierarchy
- card proportions
- spacing and whitespace
- rounded surfaces
- restrained blue/green palette
- typography scale
- primary CTA placement
- bottom navigation
- Today composition
- continuous Lesson composition
- Result / My English / Journey composition

Do not reinterpret the reference into a different visual style. Do not add dashboards, XP, streak pressure, fake levels, progress rings, AI illustrations, module grids, or debug surfaces.

Do not copy external branding, logos, proprietary illustrations, or brand-specific copy.

## 2. One lesson, one Start

Forbidden:

```text
Mission start
→ Unit ready
→ Start
→ Question
→ Submit
→ Feedback page
→ Continue
→ Unit ready
→ Start
→ ...
```

Required:

```text
Today
→ Start lesson once
→ Build / Activate
→ Teach / Contrast / Explain
→ Learner action
→ System responds in context
→ Adapt if needed
→ Learner acts again
→ Proof moment
→ Natural lesson close
→ Result
```

Internal READY/BEGIN states may remain, but ordinary MissionUnit boundaries must not leak into UX.

## 3. Today

Today answers only:
1. What are we working on?
2. Why this?
3. What do I press now?

For a new learner, do not fabricate a weakness, Day count, score, or level.

Example:
- **今天**
- **先把一個英文能力真的練起來**
- 「先從一小段真實學習開始。系統會從你的反應決定接下來怎麼教。」
- one learning focus
- duration
- one dominant CTA: **開始今天的學習**

Returning learner example:
- **把 significant 從「看得懂」推到「自己叫得出來」**
- reason based on real evidence
- CTA: **開始今天 · 5 分鐘**

No module/toolbox home.

## 4. Lesson shell

The whole lesson should feel like one tutor-led session.

Persistent top:
- back/close
- subtle active-learning progress
- remaining active time

Do not show:
- Question 1/10
- Unit 2
- Activity family
- primitive names
- repeated Start buttons

Keep one visible learning focus across the lesson.

Example:
- **今天正在練**
- **significant**
- 「你看得懂，但還不容易自己叫回來。」 only if supported by evidence.

## 5. Entry depends on learner state

Do not force everyone to fail first.

- no representation → teach meaning/form first
- recognition only → retrieval
- retrieval available → production
- unstable output → repair/construction
- support dependence → fade support
- transfer ready → changed-context use
- diagnosis only when competing hypotheses would change the next action

Teaching is a core lesson function, not merely post-error remediation.

## 6. Stable primitives are hidden teaching tools

Learner should not feel they are switching between quiz types.

### SELECT
Use only when a meaningful discrimination exists.

Good:
> 哪一句最接近 significant 的意思？

Plausible answers:
- 會帶來明顯影響的
- 很普通、不重要的
- 很快就會消失的

Bad:
- significant
- figure out + noun / wh-clause
- allow O to V

Do not use arbitrary internal KnowledgePoint labels as distractors.

### RECALL
Do not show the answer.
> 「有重大影響的」你會想到哪個英文？

### COMPLETE
Only when answer space is genuinely constrained.
> This change had a ______ effect on the community.

### CONSTRUCT
Build the smallest correct core.
> significant + impact

### PRODUCE
Only when actual output evidence is useful.
> 用 significant 寫一句跟你生活有關的句子。

### COMPARE
Use for real distinctions.
> important 和 significant 在這兩個情境裡有什麼差別？

### READING / EXPLAIN
Anchor the learner to textual meaning/evidence. Do not turn reading comprehension into phrase production.

## 7. Wrong answers stay in context

Do not automatically navigate to a generic failure page.

Wrong SELECT:
- show learner choice
- show the discriminating feature
- contrast alternatives
- retry or change teaching move

Never use sentence-production feedback for a SELECT action.

Wrong production:
- preserve genuinely correct material
- localize one issue
- rebuild only the unstable part

Retrieval failure:
- identify retrieval/form gap
- use an appropriate cue or changed teaching representation

Feedback must derive from:
**actual primitive + actual response + focused issue + Tutor decision**

## 8. 「我還不會」 is a first-class action

Required:

```text
learner taps 我還不會
→ support request is recorded
→ no fabricated learner failure
→ Tutor Policy chooses a teaching entry
→ lesson changes representation
→ learner continues
```

It must work from every primitive where it is shown. It must not require a prior wrong answer. It must never be a dead control.

## 9. Reteach means changing approach

Reteach may:
- shrink the sentence
- contrast two forms
- reconnect meaning and form
- build a chunk first
- highlight reading evidence
- reconstruct from a frame
- show one worked example then remove support

Bad:
**Hint 1 → Hint 2 → Hint 3 → reveal full answer**

Good:
> 「你意思知道，只是字叫不回來。先把意思和字重新連起來。」

Then the learner acts again.

## 10. Proof moment

Not every interaction is a test.

Only request independent proof when the runtime actually needs it.

Example:
- **現在自己來一次**
- support fades
- learner performs independently

Immediate post-teaching success must remain honest:
> **這次做到了。**
> 「剛教過後能用出來，但還需要之後再確認一次。」

Do not call this stable.

## 11. Natural transitions

After one interaction:
- no another Start
- no Continue → Start
- next teaching/action block appears naturally
- content may reveal, morph, or scroll in place

An explicit preparation interstitial is allowed only for genuinely high-setup tasks and must be plan-driven, not the default.

## 12. Result

Do not summarize accuracy.

Headline:
**今天推進了什麼**

Example:
- **significant**
- Before: 看得懂，但自己叫不太出來
- Now: 教學後能在句子裡主動使用
- Truth: **還需要之後再確認**
- Next: 新情境、無提示

Primary:
**看我的英文**

Secondary:
**回今天**

Must derive from canonical mission evidence, before/after learner projection, assistance, and next evidence need.

## 13. My English

This page is a growing personal English profile, not analytics.

- **我的英文**
- 「只顯示目前真的有證據的能力。」

First section:
**正在突破**

Cards:
- target
- learner-friendly current state
- next evidence needed

Sparse state is correct. Do not fill empty meters or invent percentages.

## 14. Journey

Journey is not an activity log.

Record meaningful milestones such as:
- first useful independent output
- repaired recurring weakness
- first delayed verification
- first transfer success
- meaningful active-vocabulary growth
- translation/writing score improvement

Do not log ordinary question counts, minutes, hints, or routine sessions.

Visual direction: calm vertical growth path with milestone cards.

## 15. Updated Today

After the lesson, Today must visibly know what happened.

Example:
- **今天完成**
- **significant**
- 「剛才從『看得懂』推進到『教學後能主動使用』」
- **Next Frontier**
- 「下一次換新情境、無提示確認。」

Do not promise a date unless scheduler truth supports it.

## 16. Bottom navigation

Use exactly:
- **今天**
- **我的英文**
- **歷程**

Learn/modules must not be a first-level tab. Profile/settings are small secondary entries.

## 17. Visual system

Follow the supplied V2 reference closely.

- soft neutral background
- 20–24 px horizontal padding
- white cards
- 16–20 px radius
- subtle border/shadow
- large titles around 26–30 px
- section titles 18–22 px
- body 15–17 px
- blue = primary/current focus
- green = evidence-backed positive change
- amber = focused issue
- red only for true destructive/system error states, not normal mistakes
- one dominant 52–56 px CTA
- subtle fade/reveal/morph motion
- no confetti or noisy gamification

## 18. Runtime ownership

UI may render pedagogy; UI may not invent pedagogy.

React components must not decide:
- reteach
- mastery/stability
- next evidence need
- next target
- semantic answer validity
- assistance independence

UI may decide:
- layout
- scrolling/focus
- animation
- local input state
- keyboard/accessibility behavior

Use presentation/view-model adapters so raw runtime enums are not shown directly.

Learner-facing language examples:
- `ASSISTED_USE` → **教學後能用出來**
- `TRANSFER` → **已能換情境使用**
- `STABLE_FOR_SCOPE` → **目前已穩定**

## 19. Required physical-device flow

```text
Open app
→ Today
→ Start lesson ONCE
→ lesson teaches/activates one target
→ learner acts
→ system responds in context
→ learner taps 我還不會
→ teaching changes immediately
→ learner acts again
→ proof moment
→ Result
→ My English
→ Today updated
```

Also verify:
- keyboard does not hide CTA
- Android Back is coherent
- background/resume preserves lesson state
- background time is excluded
- no duplicate evidence
- no internal labels as arbitrary distractors
- technical evaluator failure never becomes learner-failure evidence

## 20. Hard FAIL conditions

FAIL if any appear:
- repeated Start
- Question 1/10 framing
- arbitrary other KnowledgePoint labels as distractors
- dead 「我還不會」
- wrong SELECT receives sentence-writing feedback
- learner must fail before useful teaching
- lesson feels like separate quiz cards
- Result focuses on accuracy
- My English shows fake scores
- Today becomes a toolbox/module menu
- React owns Tutor Policy logic
- assisted work appears stable/independent
- backend enum/jargon leaks into surface
- V1 fragmented Attempt/Feedback/Reteach-page model returns

## 21. PASS definition

A normal learner should be able to say:

> 「我知道今天在學什麼。」  
> 「它不是一直考我。」  
> 「我不會的時候，它真的換方法教我。」  
> 「整段像一堂課，不像一串題目。」  
> 「做完後我知道自己剛才進步了什麼。」  
> 「我會想再回來看下一步。」

Green engineering tests are necessary but not sufficient. Physical learner experience is the release gate.
