# Munch architecture decisions

Architecture decision records (ADRs) document decisions that constrain later implementation. A later ADR may supersede an earlier one, but merged ADRs are not silently rewritten to hide prior reasoning.

- [ADR-0001: Railway and PostgreSQL runtime](0001-railway-postgresql-runtime.md)
- [ADR-0002: Munch identity, MCP OAuth, and Stripe entitlements](0002-identity-oauth-stripe.md)
- [ADR-0003: Multi-tenant isolation and administrative privacy](0003-tenant-isolation-privacy.md)
- [ADR-0004: Railway-native MCP OAuth token lifecycle](0004-oauth-token-lifecycle.md)

## Non-negotiable boundaries

- ChatGPT or another MCP host performs language and image reasoning.
- Munch authenticates requests, retrieves food data, validates writes, stores records, and calculates deterministic results.
- Stripe is the billing authority, not the sole authentication system.
- Railway PostgreSQL is the production system of record.
- User identity is derived from a verified session or MCP bearer token.
- User-owned tables are protected by row-level security.
- Routine support and billing tooling cannot display nutrition record contents.
- Raw nutrition payloads are excluded from application logs and analytics.
