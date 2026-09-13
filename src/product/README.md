# A. Product / Identity / Commercial Context

## Status

**Wave A first production pass: COMPLETE.**

This subsystem now has a real versioned product-context model, learner/account identity boundary, General/Exam access context, onboarding-derived context, per-learner persistence/migration, runtime projection, update authority, provenance, and learner-facing settings/onboarding integration.

It still does **not** claim that a billing provider or server entitlement service exists. Those external facts remain explicit as `UNCONFIGURED` / `UNKNOWN` instead of being fabricated.

## Ownership

Canonical owner: `src/product`

Product context owns:
- who the learner/account is;
- why and where they need English;
- current learner-stated priority;
- study-time and preferred-session context;
- current General/Exam experience;
- General and Exam product access context;
- exam scope/deadline/rubric context;
- provider-neutral trial/subscription boundaries;
- provenance and legal update paths.

It never owns English capability mastery, evidence truth, Tutor Policy, or UI rendering logic.

## Runtime flow

`Auth identity -> ProductProfileV2 -> per-learner persistence -> ProductContextV1 projection -> Curriculum / Teacher context`

Learner-facing changes go through learner mutation APIs. Entitlements/subscription truth has a separate system mutation API so learner edits cannot masquerade as paid access.

## Fine-grained capability scope

All formal Wave A capabilities have a first-pass implementation:

- `A.identity`
- `A.goals`
- `A.learning-purpose`
- `A.use-context`
- `A.current-priority`
- `A.study-time`
- `A.session-duration`
- `A.general-entitlement`
- `A.exam-entitlement`
- `A.exam-scope`
- `A.exam-deadline`
- `A.exam-rubric`
- `A.product-plan`
- `A.trial-access`
- `A.subscription-boundary`
- `A.context-provenance`
- `A.context-update`
- `A.active-experience`
- `A.onboarding-context`
- `A.runtime-projection`
- `A.persistence`
- `A.account-access-rules`

See `src/product/waveAStatus.ts` and `docs/architecture/waves/A_PRODUCT_IDENTITY_COMMERCIAL_CONTEXT_WAVE.md` for the explicit before/after audit.

## Deliberately unresolved external integrations

- real billing provider;
- server entitlement synchronization;
- final trial duration/eligibility/pricing rules;
- cross-device account merge/migration.

The architecture is ready for those integrations without baking a provider choice into learner truth.
