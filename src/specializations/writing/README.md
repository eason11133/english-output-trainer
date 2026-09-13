# H. Writing Teacher Runtime

## Current wave status

`READY_FOR_AUDIT` — integrated first-pass candidate, not sealed.

H is now connected to the learner-owned Writing path, but the capability set is deliberately mixed-status. Capabilities that only have authority/contracts are not promoted to FIRST_PASS, and fresh-writing transfer remains BLOCKED_EXTERNAL until G/K provide real generated-task + measurement integration.

## Canonical ownership

H owns Writing-specific work semantics:

- authentic prompt / rubric / source context;
- immutable original + learner revision provenance;
- Writing-specific opportunity/focus representation;
- feedback-attention budgeting;
- local repair / return-to-original semantics;
- bounded Writing context supplied to E/F;
- Writing-specific requirements supplied toward G/K;
- analytic Writing observations that cannot themselves become mastery or official scores.

H does **not** own:

- WHAT / WHY / WHEN → D;
- HOW NOW → E;
- teaching mechanism / support policy → F;
- fresh task generation → G;
- evidence admission / independent / transfer / delayed status → C/K;
- exam scoring policy → S/K;
- persistence authority → U/M.

A Writing artifact may legitimately have a non-`writing.*` D target, for example a grammar construction exposed inside a real essay. H specializes the artifact/work context and must not hijack D's target namespace.

## Learner-facing spine

Authentic prompt / learner original
→ preserve source truth
→ bounded Writing focus context
→ D/E/F teaching
→ learner revision
→ return to original
→ fresh-writing requirement
→ G/K downstream verification.

AI-generated full rewrites are not learner revisions. Same-session return-to-original is not transfer or retention.

## Capability status

### FIRST_PASS

- `H.sentence-realization`
- `H.meaning-encoding`
- `H.feedback-budget`
- `H.local-repair`
- `H.revision`
- `H.return-original`

### CONTRACT_ONLY

- `H.purpose-audience-genre`
- `H.idea-generation`
- `H.reasoning-depth`
- `H.planning`
- `H.organization`
- `H.cohesion`
- `H.joint-construction`
- `H.writing-evaluation`

### BLOCKED_EXTERNAL

- `H.fresh-writing-transfer` — H emits/holds the writing-specific fresh-task requirement and protects fresh-output provenance, but actual changed-context task generation and measurement require G/K.

## Audit rule

Independent review must challenge both implementation correctness and this capability-status classification. Green tests or this README do not establish completion.
