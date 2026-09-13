# EOT Major-Subsystem Upgrade Playbook

This file defines the construction method after the Main Architecture Skeleton.

## One wave = one major subsystem

A major subsystem wave is not a micro-patch and not a whole-product rewrite.

For the selected subsystem:

1. Read its canonical owner `README.md`.
2. Load every fine-grained capability belonging to that subsystem from `src/architecture/capabilityCatalog.ts`.
3. Audit every capability before coding.
4. For every capability record:
   - Current state / completion estimate
   - Concrete problem
   - Root cause
   - Upgrade possible in this wave
   - Cross-subsystem dependency
   - Acceptance evidence
5. Group capabilities by shared root causes.
6. Implement integrated fixes that move multiple capabilities together.
7. Do not ignore high-maturity capabilities if this wave can legally improve them.
8. Do not ignore externally blocked/0% outcome areas: advance execution readiness without fabricating real-world results.
9. Run the selected subsystem acceptance plus cross-subsystem regression.
10. Update fine-grained progress only after real product behavior proves movement.

## Founder involvement

The Founder is not routine QA.

Do not hand off:
- compile failures;
- lint failures introduced by the wave;
- ordinary route breakage;
- missing files;
- obvious fixture leakage;
- repeated micro-debug commands.

Hand off:
- a consolidated, review-worthy subsystem checkpoint;
- any genuine Founder-level product decision;
- any external-only validation that cannot be performed internally.

## UI / UX during subsystem waves

UX is both its own major subsystem (N/O) and a cross-cutting contract.

When a domain wave changes learner interaction, update the relevant Experience Contract/UI integration in the same wave. Do not wait until a final visual-polish phase to discover that domain architecture cannot support the intended learner experience.

At the same time, do not turn every subsystem wave into full visual polish. Final polish comes after the production structure and core vertical behaviors exist.

## Completion reporting

Do not report only a single overall EOT percentage.

For the active major subsystem, report every fine-grained capability as:

`previous -> current (+change)`

A capability that could have moved but did not must have an explicit reason.

Engineering PASS, Founder Product PASS, real learner efficacy, and real market validation are different forms of evidence and must not be conflated.
