# H. Writing Teacher Runtime

> Current overall status: **PARTIAL / READY_FOR_AUDIT**. Writing is connected to the learner path, but the capability set is intentionally mixed between FIRST_PASS and CONTRACT_ONLY.  
> Repository-wide status: [../../../CURRENT_STATUS.md](../../../CURRENT_STATUS.md).

## Canonical ownership

H owns Writing-specific work semantics:

- authentic prompt / rubric / source context;
- immutable original + learner revision provenance;
- Writing-specific opportunity/focus representation;
- bounded Writing context supplied to the shared Teacher/Teaching layer;
- Writing-specific requirements supplied toward content/measurement;
- analytic Writing observations that cannot themselves become mastery or official scores.

H does **not** own WHAT/WHY/WHEN (D), HOW NOW (E), teaching mechanism/support policy (F), fresh-task generation (G), evidence admission (C/K), Exam scoring policy (S/K), or persistence authority (U/M).

## Learner-facing spine

Authentic prompt / learner original  
→ preserve source truth  
→ bounded Writing focus context  
→ D/E/F teaching  
→ learner revision  
→ return to original  
→ separately delivered fresh-writing opportunity  
→ G/K/C verification.

AI-generated full rewrites are not learner revisions. Same-session return-to-original is not transfer or retention.

## Current FIRST_PASS capabilities

According to `waveHStatus.ts`:

- `H.sentence-realization`
- `H.meaning-encoding`
- `H.revision`
- `H.return-original`
- `H.fresh-writing-transfer`

The fresh-writing transfer path is real but limited to current curated/validated content coverage and downstream measurement support. It is **not** a claim of broad Writing transfer coverage.

## Current CONTRACT_ONLY capabilities

- `H.purpose-audience-genre`
- `H.idea-generation`
- `H.reasoning-depth`
- `H.planning`
- `H.organization`
- `H.cohesion`
- `H.feedback-budget`
- `H.local-repair`
- `H.joint-construction`
- `H.writing-evaluation`

Some of these contracts already have partial executable plumbing—for example bounded issue policy or span-level revision operations—but current main does not promote them to FIRST_PASS.

## Why this is not complete

Higher-level Writing analysis and teaching—planning, organization, cohesion, reasoning depth, dedicated local-repair behavior and full Writing evaluation—remain incomplete. Fresh transfer is constrained by current content packs, measurement depth and native acceptance.

Green tests or this README do not establish completion or real-learner efficacy.
