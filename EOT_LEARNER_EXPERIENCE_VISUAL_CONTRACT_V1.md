# EOT Learner Experience Visual Contract — Vertical Slice V1
**Date:** 2026-08-20  
**Scope:** first-use → Today → Mission → focused feedback → reteach → re-output → Result → My English → updated Today

This is a learner-facing implementation contract, not a prototype to productize blindly and not a replacement for runtime truth.

## 0. North star

The learner should feel:

> 我正在培養「我的英文」。

The product spine is:

**Today → Mission → Result → My English → Next Frontier → next Today**

Journey accumulates only meaningful long-term milestones.

The visual contract assumes the core runtime already owns:
- canonical Evidence,
- progressive diagnosis,
- Tutor Policy,
- Interaction Planning,
- policy-owned reteach,
- semantic vs deterministic evaluation,
- shared General/Exam learner truth.

The UI must execute those decisions. It must not invent pedagogy.

---

# 1. Non-negotiable visual rules

- zh-TW is Chinese-first.
- Do not expose internal labels such as EvidenceEvent, Tutor Policy, hypothesis type, activity family, scheduler reason code.
- One dominant action per state.
- No XP, levels, fake mastery %, streak pressure, celebratory confetti, or RPG language.
- Wrong answers should not flood the screen with red.
- Use brand blue mainly for primary action / current focus.
- Green is reserved for evidence-backed positive change.
- Amber may mark a focused issue, not learner failure as identity.
- Keep the current restrained palette and existing design tokens. Do not invent a new visual theme.
- Horizontal content margin: 20–24 px on 390 px mobile width.
- Main surface radius: 16–20 px.
- Primary tap target height: 54 px.
- Mission primary action stays reachable above keyboard.
- No more than two major surfaces competing above the fold.
- No developer cards, debug badges, score grids, or backend reasoning dumps.
- Existing learner text should be tappable for contextual phrase/word lookup where English is shown.
- Bottom navigation: **今天 / 我的英文 / 歷程**. Learn is not a first-level product destination.
- Profile is a small top-right secondary entry, not a fourth product pillar.

---

# 2. Screen 01 — First entry

## Purpose
Get the learner to value before asking them to prove a level.

## Exact hierarchy

1. Headline  
   **把英文練成真的會用**

2. Short promise  
   **不用先做程度測驗。先學一小段，系統會從你的真實作答決定下一步。**

3. Compact value surface showing only:
   - 今天學什麼
   - 下一次要驗證什麼
   - 哪些英文正在變成你真的會用

4. Primary CTA  
   **先學 5 分鐘**

5. Secondary CTA  
   **帶入我剛做過的英文**

6. Tertiary text action  
   **快速能力探索（選填）**

## Forbidden
- “Start Placement”
- “Complete diagnostic first”
- CEFR labels before evidence
- long onboarding explanation
- feature/module menu

## If goal/time context is required
Do not open a three-page wizard. Use one compact sheet after the primary CTA:
- 今天主要為了什麼學英文
- 今天先花多久

Then continue directly to Today/Mission.

---

# 3. Screen 02 — Today for a new learner

Do not fabricate Day count, weakness, or personal history.

## Copy
Title:
**先找到最適合你的起點**

Supporting:
**現在還沒有足夠資料，不需要猜你的程度。這 5 分鐘會一邊學、一邊認識你。**

Focus:
**今天正在培養**
**主動輸出**

Reason:
**目前沒有舊問題需要追。這一步的目的不是考你，而是找到下一個真正有用的教學入口。**

Primary CTA:
**開始今天 · 5 分鐘**

## Data contract
The text must come from the actual Today state:
- no `hasPersonalEvidence` → honest new-learner copy
- target/interaction must be selected by current runtime
- no hard-coded “translation” unless runtime actually chose it

---

# 4. Screen 03 — Mission, first independent attempt

## Shell
Top:
- compact time context
- remaining active learning time
- no “Question 1/10”
- no visible activity-family name

Body:
- one instruction
- one task
- one learner input surface

Support actions:
- **看提示**
- **我還不會**

Primary:
**送出**

## Rule
Typing is required only when production evidence is actually needed.

If the planned primitive is SELECT / ORDER / MATCH / MARK, render that primitive instead. Do not force everything into a text box.

---

# 5. Screen 04 — Focused feedback

Wrong does not mean “show the model answer.”

The UI should preserve correct material and localize one important issue.

Example:
> Many **teenager** spend a lot of time…

Message:
**這句大部分都對。現在只卡在一個地方。**

Focused explanation:
**many 後面是可數名詞時，要用複數。**

Contrast:
- many teenager ×
- many teenagers ✓

Primary:
**自己修一次**

Secondary:
**我還是不會**

## Runtime contract
This screen renders `ActivityJudgment` / focused issue and the current `InteractionDecision`.
The UI may not independently decide the learner “needs reteach.”

---

# 6. Screen 05 — Reteach / changed entry point

This state only appears when Tutor Policy / mission orchestration decides to reteach.

Headline:
**先把句子縮小**

Teaching move:
- preserve correct material
- isolate the target relation
- lower composition load
- provide contrast / construction / meaning-form mapping appropriate to InteractionPlan

Example:
**many + teenagers**

Supporting:
**先完成最小正確核心，再回到完整句子。**

Primary:
**完成後再寫一次**

## Forbidden
- Hint 1 → Hint 2 → Hint 3 as the only strategy
- simply revealing the whole answer and calling it teaching
- recording this as independent success

---

# 7. Screen 06 — Re-output

After teaching, the learner acts again.

Headline:
**現在再自己寫一次**

The support used during reteach is removed or reduced according to the InteractionPlan.

After success:
**這次完成了目標形式**
**這仍是剛教過後的成功，還不算穩定。**

This copy is important. It visually teaches the evidence model without exposing technical terms.

---

# 8. Screen 07 — Result

The primary question is not “how many did I get right?”

Headline:
**今天真的推進了什麼**

Change card:
- target label
- previous usable state → current usable state in learner language
- short evidence story

Example:
**many + plural noun**
**提示後能用**

Story:
**你原本在輸出時漏掉複數。換一個入口教過後，這次能完成正確形式。**

Truth card:
**還沒算穩定**
**下一個突破是拿掉提示，在新的句子裡自己用出來。**

Primary:
**看我的英文**

Secondary:
**回今天**

## Data contract
Result must be generated from:
- session evidence,
- before/after learner projection,
- actual assistance level,
- actual next evidence need.

Never infer a stronger state for prettier copy.

---

# 9. Screen 08 — My English

For a learner with very little evidence, sparse is correct.

Header:
**我的英文**

Supporting:
**只顯示目前真的有證據的部分。其他能力先保持未知。**

First surface:
**下一個突破**

Target:
**many + plural noun**

State:
**提示後能用**

Next evidence:
**下一步：無提示，在新句子裡自己用出來。**

Other capabilities:
**還在認識中，不先替你貼上強或弱的標籤。**

## Rule
Do not fill the page with empty capability meters just to make it look complete.

---

# 10. Screen 09 — Today after completion

If the learner returns to Today after the session, Today must visibly know the session happened.

Headline:
**今天已完成**

Recent change:
**many + plural noun**
**從「輸出時漏掉」推進到「教學後能正確用」。**

Frontier:
**下一次會拿掉提示，換一個新句子確認你能不能自己用出來。**

Optional secondary:
**再練 5 分鐘**

## Rule
Do not immediately repeat the same proof unless policy says it is useful.
Do not promise “tomorrow” or “48 hours” unless the scheduler actually created that timing.

---

# 11. Interaction-state contract

The learner-facing state path for this vertical slice:

```text
FIRST_ENTRY
→ optional MINIMAL_CONTEXT_SHEET
→ TODAY_NEW / TODAY_READY
→ MISSION_ATTEMPT
→ SUBMITTING
→ FOCUSED_FEEDBACK
   ├─ REVISE
   └─ RETEACH_DECIDED_BY_POLICY
       → LOWER_LOAD_TEACHING
       → RE_OUTPUT
→ RESULT
→ MY_ENGLISH
→ TODAY_UPDATED
```

Technical states that must have calm recovery:
- LOADING
- NETWORK_EVALUATOR_UNAVAILABLE
- APP_BACKGROUND / RESUME
- TIME_BOUNDARY_SOFT_STOP
- SESSION_RESTART

A technical failure must never become learner-failure evidence.

---

# 12. Screen-to-runtime bindings

## Today
Must bind to:
- canonical learner projection
- current MissionPlan
- scheduler/Tutor Policy reason
- actual target label
- current/next evidence goal

## Mission
Must bind to:
- `MissionUnit.interactionPlan`
- primitive
- prompt
- allowed support
- evaluation scope
- `InteractionDecision`

## Focused feedback
Must bind to:
- `ActivityJudgment.focusedIssue`
- concise explanation
- accepted alternative / meaning-preserved information
- assistance state

## Reteach
Must bind to:
- policy-owned `InteractionDecision.RETEACH`
- `interactionPlan.reteach`
- no UI attempt-count heuristic

## Result
Must bind to:
- evidence written this mission
- before/after projected learner state
- assistance
- next evidence requirement

## My English
Must bind only to canonical Evidence / projection.

## Updated Today
Must re-read persisted canonical truth.
Do not retain a fake local-only “completed” story.

---

# 13. Visual acceptance on physical device

Codex must not return “done” from screenshots alone.

Check on a 390-ish width Android device / Expo Go:

1. First entry has one obvious primary action.
2. No Placement redirect.
3. No internal/backend wording.
4. Mission primary CTA remains reachable when keyboard is open.
5. Focused feedback never becomes a giant red error block.
6. Long Chinese/English strings wrap without clipping.
7. Contextual English lookup remains tappable.
8. “我還不會” leads to a valid teaching path, not a dead end.
9. Android Back from teaching returns to the coherent prior state and does not reopen dismissed scaffolds incorrectly.
10. Background/resume preserves the current interaction.
11. Result persists after navigation.
12. My English changes only when canonical evidence changed.
13. Returning to Today visibly reflects that change.
14. Bottom nav labels and current selection are clear.
15. No debug/dev cards appear.
16. No fake Day count for zero-evidence learner.
17. General/Exam switch, if shown, must not dominate the first-screen hierarchy.

---

# 14. Definition of PASS for this task

This vertical slice is PASS only when:

- the exact learner flow above is implemented in the real Expo app,
- visuals follow this contract,
- the runtime remains authoritative,
- no pedagogy moves back into UI components,
- screenshots match the hierarchy closely,
- device behavior is checked,
- and the learner can finish the entire flow without understanding internal system concepts.

Do not redesign the product while implementing this contract.
If the current runtime cannot produce a required UI state, report the missing runtime contract rather than inventing fake UI data.
