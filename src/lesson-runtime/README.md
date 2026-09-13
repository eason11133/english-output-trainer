# M. Lesson / Session Runtime

## Ownership

Canonical owner: `src/lesson-runtime`

M owns execution continuity for an already-authorized lesson: lifecycle, pause/resume, background/foreground semantics, time budget, duplicate-action identity, checkpoint/hydration semantics and session closure.

It does **not** choose curriculum targets, teaching mechanisms, learner evidence meaning, or UI styling.

## Depends on

`C`, `D`, `E`, `F`, `K`, `L`, `Q`, `U`

`U` persists operational checkpoints; M defines what runtime state must remain coherent across those checkpoints.

## Public contracts

- `LessonSessionPortV1` — persistence-facing session hydrate/save boundary.
- `LessonSessionLifecycleV1` / `lessonSessionLifecycleV1` — pure lifecycle and action-identity semantics.

## Fine-grained capability scope

- `M.lesson-session` — LessonSession
- `M.episode-lifecycle` — Episode/task lifecycle
- `M.pause` — Pause
- `M.resume` — Resume
- `M.background-foreground` — Background/foreground
- `M.crash-recovery` — Crash recovery
- `M.duplicate-action` — Duplicate-action protection
- `M.hydration` — State hydration
- `M.time-budget` — Time budget
- `M.interruption` — Interruption handling
- `M.session-close` — Session close
- `M.cross-surface-continuity` — Cross-surface lesson continuity

## Runtime invariants

1. `RETURNED` and `COMPLETED` sessions are not active/resumable.
2. Every lifecycle mutation that is persisted creates a new trace/logical step so U1 idempotency does not mistake a legitimate state transition for conflicting replay.
3. Pause/background time is excluded from tutor elapsed time.
4. Background/foreground does not change pedagogical status.
5. A duplicate learner action has a stable action identity; ordinary in-flight duplicates are suppressed before evidence writing.
6. Native evidence commit may include the corresponding runtime checkpoint in the same operational transaction.
7. Nested Writing/Translation work survives lifecycle transforms.
8. Physical Android/iOS process-death, AppState races and IME interruption remain acceptance unknowns until device testing.

## Acceptance rule

Host gates are diagnostic only. `M.background-foreground` and `M.interruption` remain `CONTRACT_ONLY` until real AppState/device acceptance. `M.crash-recovery` is first-pass at the transaction semantics level but still carries explicit physical-device unknowns.
