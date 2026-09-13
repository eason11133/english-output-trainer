# EOT repository instructions

## Expo

Expo has changed. Before changing Expo-specific APIs or configuration, read the exact SDK 57 documentation:

https://docs.expo.dev/versions/v57.0.0/

## Production architecture

Before substantial production work, read:

- `docs/architecture/EOT_V1_MAIN_ARCHITECTURE.md`
- `docs/architecture/EOT_V1_SUBSYSTEM_UPGRADE_PLAYBOOK.md`
- `src/architecture/registry.ts`
- the active subsystem owner's `README.md`

Stage-numbered folders are implementation history/compatibility, not product information architecture.

Normal production code should enter through canonical A–Y subsystem owners. Do not create a second learner truth store, Tutor Policy, General/Exam learner identity, or UI-owned pedagogy.

## Development unit

After the Main Architecture Skeleton, substantial development is performed one **major subsystem** at a time.

For the selected subsystem, audit all fine-grained capabilities in `src/architecture/capabilityCatalog.ts`, group shared root causes, and advance every capability that can legally move in the same upgrade wave.

Do not make serial micro-patches the default development method. Do not ask the Founder to perform routine engineering QA that can be automated locally.

## UI / UX

UX is both a formal subsystem and a cross-cutting contract. Domain changes that alter learner interaction must update the corresponding Experience Contract/UI integration in the same subsystem wave, without turning every wave into final visual polish.
