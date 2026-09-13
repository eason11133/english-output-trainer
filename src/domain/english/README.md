# B. English Domain / Capability Graph

## Ownership

Canonical owner: `src/domain/english`

Wave B has completed its first production pass. This subsystem defines **what English target/capability is being referred to** and how language targets relate. It deliberately does not own learner evidence, learner mastery/state, curriculum priority, teaching policy, or content-generation policy.

## Public production contracts

- `EnglishDomainObject` / `EnglishFacet` — compatibility types used by existing runtime/evidence code.
- `EnglishDomainNodeV2` — canonical language/capability target node.
- `EnglishDomainGraphV2` — immutable validated graph.
- `EnglishDomainPortV2` — canonical lookup/traversal API.
- `EnglishCapabilityClaimV2` — target + capability facet claim before evidence qualification.
- `EnglishCapabilityConditionV2` — support/context/load/recurrence conditions that qualify an observation without becoming language targets.
- `coreEnglishDomainGraphV2` — a small validated production core, **not** a fixed learner universe or curriculum.

## Core modeling rule

The graph separates three things that must not be collapsed:

1. **Target** — what English object/capability is involved, such as a lexical sense, word form, construction, meaning intent, or writing capability.
2. **Facet** — what the learner may be able to do with that target, such as retrieve, select, construct, or produce.
3. **Observation condition** — under what conditions the action occurred, such as support, changed context, delay, task load, or recurrence.

Changing support or context does not create a different English target. It changes the evidential meaning of an observation, which is owned downstream by Learner Truth / Assessment.

## Stable identity and semantic alternatives

`targetRef` is no longer conceptually an arbitrary string. Canonical IDs can expose legacy aliases so existing evidence remains addressable. Alias collisions are rejected.

Meaning is also separated from wording. `MEANING_INTENT` nodes can have multiple `REALIZES_MEANING` / `ALTERNATIVE_REALIZATION` links. This prevents a reference wording from becoming the only linguistic truth.

## Graph relation direction

`PREREQUISITE_FOR` is directional:

`prerequisite -> dependent target`

Therefore `port.prerequisites(target)` returns incoming prerequisite nodes. Canonical graph validation rejects prerequisite cycles.

Other typed relation families cover sense/form/morphology, meaning realization, alternatives, contrasts, combinations, register variants, enablement, parts, and reuse.

## Writing / Translation / Reading

Wave B establishes graph-addressable capability areas for:

- writing purpose/audience, idea/reasoning, organization/cohesion, sentence realization, revision;
- translation source meaning, segmentation, meaning-to-English, naturalness/precision;
- reading meaning decomposition, reference tracking, logic/structure, inference.

These are capability graph targets only. H/I/J later own specialized teaching behavior.

## Content governance

Canonical nodes/edges require validated provenance and a version/source. Generated-pending content cannot silently enter the canonical graph. G/T/U later deepen generation, provider, and persistence behavior.

## Scope boundary

B does not contain CEFR level claims, fake mastery percentages, or a complete English dictionary/curriculum. External frameworks may inform future content population, but EOT adapts descriptors to its output-training objectives rather than treating any one framework as the production truth.

## Wave B fine-grained scope

Wave B audited and advanced all B capabilities in `src/architecture/capabilityCatalog.ts`, including the original 21 items plus six missing architecture capabilities found during the audit:

- stable target identity / alias resolution;
- semantic-intent nodes;
- typed relation semantics;
- capability observation condition schema;
- graph governance/version/provenance;
- graph query/traversal port.

Executable audit details: `src/domain/english/waveBStatus.ts`.
