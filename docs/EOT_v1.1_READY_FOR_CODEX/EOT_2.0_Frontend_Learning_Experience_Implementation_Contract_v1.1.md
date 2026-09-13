# English Output Trainer 2.0
## Frontend & Learning Experience Implementation Contract v1.1

Status: LOCKED implementation contract
Date: 2026-08-10
Purpose: Versioned engineering handoff for the complete learner-facing frontend reset.

# 0. Supersession

This v1.1 contract supersedes conflicting v1.0 frontend rules:
- dark-first visual direction
- one-screen-at-a-time recovery sequencing
- any rejected four-tab shell implementation
- any engineering-inferred visual hierarchy created without approved references

The learning/pedagogy rules from v1.0 remain binding unless explicitly changed here.

Authoritative visual references:
1. EOT_VIS_01_General_Core_v1.1.png
2. EOT_VIS_02_Mission_Interaction_v1.1.png
3. EOT_VIS_03_Exam_Core_v1.1.png
4. EOT_VIS_04_Design_System_v1.1.png

# 1. Engineering role [LOCKED]

Codex implements code.
Codex must not redesign the product, invent visual hierarchy, propose alternate IA, substitute its own palette, or change LOCKED product decisions.

# 2. Product invariant [LOCKED]

EOT is one shared learning platform with two independently sellable product experiences:
- EOT General English
- EOT Exam

They share Learner Identity, Evidence Ledger, Learner Graph, Knowledge Graph and long-term learning history.
Switching products must not fork learner truth.

# 3. Core learning promise [LOCKED]

Passive English >> Active English
Known -> Retrievable -> Usable

Evidence is truth. Learner state is projection.
Do not use XP, streak, arbitrary mastery percentage, one-shot Mastered, or legacy +/-2 score as learning truth.

Meaningful states include:
NEW, RECOGNIZED, RETRIEVING, ASSISTED_USE, INDEPENDENT_USE, TRANSFER, STABLE, FRAGILE.

# 4. App shell [LOCKED]

Bottom navigation contains exactly:
- Today
- Learn
- Growth

Profile opens from one restrained avatar.
Settings lives inside Profile.
Mission hides bottom navigation and unrelated app chrome.
No learner-facing DEV controls.

# 5. Visual system [LOCKED]

Light-first, practical, premium, focused, intelligent, energetic but calm, consumer-product quality.
Not sci-fi, cyberpunk, pastel EdTech, engineering dashboard, or admin UI.

Core tokens:
Canvas #F7F8FA
Surface #FFFFFF
Secondary surface #F1F4F8
Primary text #111827
Secondary text #667085
Muted #98A2B3
Border #E4E7EC
Brand #2563EB
Brand pressed #1D4ED8
Success #16803A
Attention #B65C00
Error #D92D20
Hint/Teaching #4F46E5

No rainbow module colors.
Typography, spacing and hierarchy before cards.
Cards restrained and purposeful.

# 6. Shared interaction system [LOCKED]

READY -> ANSWERING -> CHECKING -> FEEDBACK -> REVISING -> VERIFYING -> TRANSFER -> COMPLETE

Special:
HINT, RETEACH, REVEAL, LOW_CONFIDENCE, NETWORK_ERROR, INTERRUPTED.

Prompt scope = Answer scope = Evaluator scope = Reveal scope.
Mismatch is a P0 learning UX bug.

# 7. Tutor policy [LOCKED]

NEW:
Teach -> Notice -> Guided completion -> Partial production -> Fade support -> later independent production.

Hint is for previously learned but unretrievable knowledge.

Before self-repair, diagnose or visually localize the issue.

Practice must provide:
- Modify / Try again
- Hint
- I still don't know

"I still don't know" enters RETEACH, not infinite hints.

Independent evidence cannot include hint/reveal/direct answer exposure.
Transfer requires a genuinely new context.
Stable requires delayed verification.

Practice may teach/hint/reteach.
Assessment/Mock does not hint/reveal/reteach during the assessed attempt.

# 8. General Today [LOCKED]

Job: What should I do now to make my English more usable?

Use real persisted DAILY MissionPlan, MissionSession, MissionUnits, scheduler reasons, sourceEvidenceIds, KnowledgePoint and projected learner state.

Hierarchy:
- human greeting
- dominant lesson time or learning statement
- concise evidence-based reason
- truthful Today Focus when useful
- one Start/Resume CTA
- compact mission composition
- Why this lesson?
- Adjust time
- real source/material signal only if supported
- optional real weekly signal
- bottom navigation

Never fabricate encounter history, teacher content, streak, XP, percentages or personalization history.

# 9. Exam Today [LOCKED]

Job: Given the exam, deadline and current weaknesses, what is the most valuable use of my study time today?

Exam Today must have different information priority from General Today.
Where real data exists it may show target exam, time remaining, exam risk/priority, evidence reason and today's exam mission.

Do not fabricate countdown, mock trend, readiness, coverage or score prediction.
Exam Today is not General Today with new copy.

# 10. Product switching [LOCKED]

One product owned: no persistent switch.
Both owned: restrained contextual selector may switch General/Exam.
Switching changes Today/Learn/Growth experience, not learner identity/evidence.

# 11. Daily Mission [LOCKED]

Header only:
- Back
- current/total
- thin progress

No bottom nav.
No raw engineering labels.

Wrong answer:
- preserve learner response
- preserve what was correct
- focus one priority issue
- Modify / Hint / I still don't know
- no immediate reveal

Hint appears inline.
Reteach visibly changes testing into teaching and then requires output again.
New knowledge is taught first, not cold-tested.

# 12. Evidence Promotion [LOCKED]

Signature moments:
- Assisted -> Independent
- Independent -> Transfer
- Transfer -> Stable

Only show on real projected-state change.
No XP, coins, fake Mastered or generic level-up language.

# 13. Lesson Complete [LOCKED]

Lead with evidence-supported learning story:
- Genuine new progress
- Improving
- Just started / building

Do not lead with task count, accuracy %, XP or streak.

# 14. General Learn [LOCKED]

Hierarchy:
- Actively Developing
- Needs Work
- From Teachers only when real
- My Materials only when real
- Explore

Rows show skill/expression, current learner state, next meaningful step.
Vocabulary/Grammar/etc. live in Explore, not main navigation.

# 15. Exam Learn [LOCKED]

Meaningfully exam-specific.
May emphasize exam capability priorities, weak exam skills, exam scope/content, Vocabulary, Grammar, Reading, Translation, Writing and teacher/cram content when real.
Not General Learn with only a title/filter change.

# 16. General Growth [LOCKED]

Job: What English has actually become more usable?
Prioritize first independent use, transfer, stable knowledge, reduced hint dependence and recurring-error decay.
Result before evidence detail.
Not an evidence debugger.

# 17. Exam Growth [LOCKED]

Job: Am I becoming more ready for the exam, and what still threatens my result?
Use only trustworthy existing data.
Do not fabricate readiness score, predicted grade, mock trend or coverage.

# 18. Skill Detail [LOCKED]

Answer: Why does EOT think I can do this?
Show canonical expression/skill, meaning, current state, progression, recent human-readable evidence timeline, what happens next, source only when real.
No raw telemetry for normal learners.

# 19. Profile [LOCKED]

Organize learner identity, My Products/real entitlements, Learning Goals, Learning Preferences, Learning Sources/Connections, Privacy & Data and Settings.

Do not expose legacy mastery, Normal/AI mode, old workspace assumptions, learner-facing debug entitlement controls or legacy +/-2 state.

# 20. Mobile behavior [LOCKED]

20-24px horizontal padding.
44-48dp minimum touch target.
Keyboard-safe input and CTA.
Android Back dismisses keyboard before unintended lesson exit.
Mixed Chinese/English wraps correctly.
Double-submit blocked.
Interrupted session persists.
Background/foreground does not lose session.
Loading does not create major jumps.

# 21. Data truth [LOCKED]

Never fabricate consumer data.
If data does not exist, hide the section or show a truthful empty state.

This includes Capture/Encounter history, teacher content, connected-learning counts, weekly progress, exam countdown/readiness, streak, XP, percentages and score predictions.

# 22. Current implementation scope [LOCKED]

This v1.1 batch intentionally implements the coherent learner-facing frontend together:
- shared shell/design system
- General Today
- Exam Today
- Daily Mission interaction
- Lesson Complete
- General Learn
- Exam Learn
- General Growth
- Exam Growth
- Skill Detail
- Profile
- surface-level onboarding/diagnostic visual alignment where active

Do not stop after Today.

Do not add new backend/product features.
Freeze unless needed for frontend runtime integration:
Evidence Ledger, Learner Graph, Scheduler, Mission Composer, ProductEntitlement, LearningGoal, ProductExperienceContext, repositories, Capture, EncounterEvent, AI, Speaking, Teacher organization architecture and payments.

# 23. Validation [LOCKED]

Run:
- npm.cmd run typecheck
- npm.cmd run test:domain
- npx.cmd expo config --type public
- existing relevant frontend/unit tests if configured

Engineering pass is not physical visual acceptance.

# 24. Required Android QA states [LOCKED]

Return steps for:
1. General Today
2. Exam Today
3. General Learn
4. Exam Learn
5. General Growth
6. Exam Growth
7. Mission answering
8. Mission focused diagnosis
9. Mission hint
10. Mission reteach
11. Mission successful repair
12. Mission Evidence Promotion
13. Lesson Complete
14. Skill Detail
15. Profile
16. Resume interrupted Mission
17. keyboard-open answer state

If real data cannot produce a state, report why.
Do not create fake production data merely for screenshots.

# 25. Delivery rule [LOCKED]

Codex implements.
Product analysis and UX decisions are not delegated to Codex.
If a truly missing technical dependency blocks implementation, report the exact dependency.
Do not replace a missing product decision with engineering invention.
