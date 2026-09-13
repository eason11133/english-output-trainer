# Wave B — English Domain / Capability Graph

## Goal

Replace the flat/partially duplicated English-target model with one canonical, queryable capability graph that downstream learner truth, curriculum, Teacher, teaching, assessment, writing, translation and reading systems can reference without inventing their own target identity.

## Shared root causes found

1. `targetRef` was operationally useful but semantically close to an arbitrary string.
2. The old `EnglishDomainObject` flattened target kind, capability facet and context constraints.
3. Meaning-to-English encoding had no first-class meaning anchor, making reference wording too easy to over-authorize.
4. Word/sense/form/morphology relationships were not explicitly modeled.
5. Writing, Translation and Reading constructs lived in adjacent types rather than one English Domain graph.
6. Support, transfer, retention, load and recurrence were spread across learner/evidence/runtime code without one shared condition vocabulary.
7. Graph relations and content-governance relations were not strong enough to provide one stable downstream query authority.

## Integrated upgrade

Wave B introduces:

- stable canonical target identity with alias resolution;
- lexical, formulaic, grammar, meaning-intent, discourse and skill-capability node kinds;
- explicit word/sense/form/morphology graph relations;
- `MEANING_INTENT` nodes and multiple realizations;
- typed prerequisite/alternative/contrast/combination/register/enablement/reuse relations;
- cycle validation for prerequisite edges;
- validated source/version provenance on canonical nodes and edges;
- a condition schema for support/context novelty/task load/recurrence that does not become learner state;
- capability-claim qualification against target identity + afforded facet;
- graph-addressable Writing, Translation and Reading capability areas;
- `EnglishDomainPortV2` as the downstream query boundary;
- controlled `allow O to V` fixture binding to canonical target identity rather than a duplicated raw string.

## Deliberately not done here

Wave B does not:

- populate a complete English dictionary/corpus;
- assign CEFR levels to every target;
- infer learner mastery;
- choose curriculum priority;
- decide how to teach a target;
- generate new content;
- implement Writing/Translation/Reading teaching runtimes;
- claim real learner efficacy.

Those belong to later major subsystems.

## Research constraint

The graph remains adaptable to learner/task context rather than treating a proficiency framework as a ready-made curriculum. The Council of Europe itself describes CEFR as a reference framework that must be adapted to particular contexts and target learners. Wave B therefore uses broad linguistic/pragmatic distinctions as a compatibility constraint, not as a copied level taxonomy.

## Acceptance

Automated Wave B acceptance requires:

- all B capabilities FIRST_PASS and represented in the executable audit;
- one valid immutable canonical graph;
- stable alias resolution;
- explicit lexical sense/form/morphology relations;
- meaning intent with multiple realizations;
- prerequisite direction and cycle rejection;
- capability target/facet qualification;
- support/context/load/recurrence separated from target identity;
- Writing/Translation/Reading areas addressable;
- controlled allow mechanism bound to canonical domain identity;
- B COMPLETE_FIRST_PASS and C READY_FOR_AUDIT;
- cross-system regression.
