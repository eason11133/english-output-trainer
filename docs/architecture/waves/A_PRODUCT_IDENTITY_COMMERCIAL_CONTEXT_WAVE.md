# Wave A — Product / Identity / Commercial Context

## Result

**COMPLETE_FIRST_PASS**

This wave replaced the previous three overlapping objects (`learnerPreferences`, `practiceGoals`, `learnerTrack`) as product authority with one canonical `ProductProfileV2`. Compatibility projections remain temporarily for existing screens, but they are derived views and are never saved separately.

## Shared root causes removed

1. Product context had no real domain model; UI/context storage became accidental authority.
2. Identity, learning intent, study time, exam context and commercial access were mixed or missing.
3. General/Exam were product ideas rather than separately representable access contexts.
4. Old storage used one global key and duplicate facts.
5. No provenance/update authority existed, so learner-editable data and system access truth could not be distinguished.
6. Runtime contracts existed but had no truthful adapter from the learner's current product context.

## Integrated upgrade

- `ProductProfileV2` is the single product-context authority.
- account identity and local demo identity are explicit;
- General and Exam share the same learner identity while keeping separate entitlement objects;
- active experience is first-class;
- learning purpose, real-use contexts, priority, daily time and session time are first-class;
- exam type/scope/deadline/rubric/target score are first-class;
- trial/subscription/plan boundaries are provider-neutral and honest when unconfigured;
- per-learner V2 AsyncStorage replaces the old global product-context key;
- legacy local data migrates without migrating one person's local data into an authenticated account;
- product context has source provenance;
- learner mutation and entitlement-service mutation are separate APIs;
- runtime projection feeds the existing `ProductContextV1` contract;
- onboarding collects purpose/use/time and Exam context only when relevant;
- Profile/Settings can update learner-owned context and show honest General/Exam access state;
- Today and Lesson consume active product mode and runtime context.

## Capability audit

The executable audit lives in `src/product/waveAStatus.ts`. It records, per capability:

`before % -> after % -> problem -> root cause -> upgrade -> dependency -> acceptance`

Commercial percentages remain below full production because real entitlement/billing infrastructure and final business rules are external/unsettled. The code does not turn that uncertainty into fake paid access.

## Acceptance boundary

Wave A is accepted when:

- all A capabilities are `FIRST_PASS` in the architecture catalog;
- A registry state is `COMPLETE_FIRST_PASS`;
- B becomes `READY_FOR_AUDIT`;
- product-domain regression tests pass;
- existing Main Architecture and Stage5A regressions still pass;
- full TypeScript typecheck passes locally;
- normal learner routes use the canonical context provider;
- no product mutation can directly create learner capability/evidence truth;
- no learner-facing edit can create ACTIVE/TRIAL/DEVELOPMENT entitlement state;
- unconfigured commercial services remain explicit rather than fabricated.
