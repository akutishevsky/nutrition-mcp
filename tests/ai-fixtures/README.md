# AI recorded fixtures (S0 — Full Parity App Program)

Golden OpenRouter chat-completion envelopes used by the deterministic,
secret-free `ai-fixture` CI job (`tests/ai-fixtures/ai-fixtures.test.ts`).

- These are **synthetic recorded responses**, authored to the exact wire
  shape the live OpenRouter smokes return. They are not captured user
  traffic and contain only generic fixture foods.
- The fixture lane replays them through the real AI modules with the
  transport mocked (`fetcher` injection): schema parsing, response
  healing/shape assertions, and — for meal ideas — the deterministic
  grounding filter. No network, no `OPENROUTER_API_KEY`, zero live spend.
- When a flow's prompt or response schema changes, update the matching
  golden file in the same PR; the lane fails if the recorded response no
  longer parses or grounds.
- Live-model behaviour stays covered by the manual/nightly OpenRouter
  smoke workflows; this lane is the per-PR contract gate.
