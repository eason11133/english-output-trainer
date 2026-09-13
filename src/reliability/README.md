# V. Production Reliability

## Authority

V owns failure containment and operational reliability policy.

V does not own:
- model/prompt selection (T),
- learner truth/evidence admission (C/K),
- pedagogy (D/E/F),
- session semantics (M),
- persistence truth (U),
- learner experience decisions (N).

## Runtime policy

- A failed provider call must never become learner evidence.
- Teacher-decision failure is handled by E's qualified deterministic fallback; the client does not automatically retry semantic decisions.
- Transcription/network failure preserves the learner artifact and exposes a safe user retry path.
- Invalid/partial provider responses are rejected, not consumed.
- Reliability logs contain operational metadata, not learner writing, prompt text, full provider payloads, keys, or hidden reasoning.
- Client-side `EXPO_PUBLIC_*` configuration is treated as public. Provider API keys remain server-only.
- Production coach endpoints require HTTPS.
- Retry ownership must be explicit; nested app/server/model retry storms are forbidden.

## Capability status

See `capabilities.ts`. Host-verifiable failure containment can be FIRST_PASS. Physical Android/iOS crash, IME, safe-area/back, and external monitoring remain CONTRACT_ONLY until real acceptance.
