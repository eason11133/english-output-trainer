English Output Trainer — MVP 0.2 dogfood patch

Fixes / changes:
- Android keyboard-safe answer area.
- Workout resumes exact task, draft, hint count, and feedback state after leaving/reloading.
- Foundation / Developing / Intermediate manual difficulty levels.
- English-only ASCII input filter, autocorrect/spellcheck off, context-menu paste hidden.
- Mock grader no longer calls hinted answers "independent" and explicitly states its limits.
- Adds one obvious missing-be grammar rule exposed by dogfooding.
- Adds (auth)/_layout.tsx to clean Expo Router group warnings.
- Resets now also clear workout resume state and selected level.

Apply from the Expo project root:
  Expand-Archive -Path <downloaded zip> -DestinationPath .\v0.2-update -Force
  Set-ExecutionPolicy -Scope Process Bypass
  .\v0.2-update\apply-v0.2.ps1 -ProjectPath .
  npx expo start -c
