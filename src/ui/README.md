# O. UI / Interaction Design System

> Current subsystem status: **PARTIAL / READY_FOR_AUDIT**. Existing components/tokens are first-pass implementation and **must not be read as the final EOT visual or interaction direction**.  
> Repository-wide status: [../../CURRENT_STATUS.md](../../CURRENT_STATUS.md).

## Ownership

Canonical owner: `src/ui`.

O renders N's learner-facing contracts. It owns current tokens, visual hierarchy, manuscript/language-object surfaces, inputs, action states and accessibility/touch-target presentation. It does not encode pedagogy or evidence meaning.

## What exists in current main

The current code includes:

- shared learner-facing tokens and bounded mobile layouts;
- manuscript/output surfaces;
- manipulable language-object renderers;
- Writing/Translation inputs;
- primary/secondary action states;
- several intervention renderers;
- feedback states;
- >=44pt touch-target contracts;
- mobile-first responsive bounds;
- separation between production and `__dev__` review surfaces.

These are implementation facts, not a claim that the current visual language or interaction composition is final.

## Current rebuild boundary

The learner-facing UI/UX is being redesigned so the adaptive teaching loop is understandable through learner action rather than through engineering/debug structure. Existing palette, component composition and renderer layouts may be replaced. Backend authority, learner-truth boundaries and Teacher/Teaching-Block contracts remain the stable integration constraints.

## Known limits

Motion, general sheets/overlays, final responsive behavior, screen-reader behavior, dynamic text scaling, physical keyboard/IME behavior and final device acceptance remain incomplete.
