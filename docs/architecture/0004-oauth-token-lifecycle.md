# ADR-0004: Railway-native MCP OAuth token lifecycle

- Status: Accepted
- Date: 2026-08-03

## Context

The inherited OAuth implementation uses one global client credential, accepts authorization redirects without exact registration matching, stores authorization sessions in process memory, and issues long-lived bearer tokens. Munch requires a multi-user commercial service that survives deploys and supports revocation without storing usable credentials in PostgreSQL.

## Decision

Munch's Railway-native OAuth implementation uses:

- one persisted registration per MCP client;
- exact redirect URI matching;
- HTTPS redirects, with HTTP permitted only for loopback development clients;
- mandatory authorization code flow with PKCE `S256`;
- persistent 10-minute authorization sessions;
- hashed, one-time authorization codes with a 5-minute lifetime;
- hashed access tokens with a 15-minute lifetime;
- hashed rotating refresh tokens with a 90-day maximum lifetime;
- token-family revocation when a consumed refresh token is presented again;
- explicit per-user/per-client connection revocation;
- no raw token, verifier, authorization code, or client state logging.

Public clients use `token_endpoint_auth_method=none`. Confidential clients may use `client_secret_post`; their secrets are generated once, returned once, and stored only as SHA-256 hashes.

## Transaction invariants

- An authorization session can attach to only one Munch user.
- An authorization session can issue at most one live authorization code.
- An authorization code is consumed in the same transaction that issues its token family.
- A refresh token is consumed in the same transaction that inserts its replacement.
- Refresh-token reuse commits revocation of the entire family before the OAuth error is returned.
- Access-token resolution requires an active Munch account and a non-expired, non-revoked token.

## Staged rollout

This ADR and its repository implementation do not immediately replace the inherited OAuth routes. Route cutover is a separate change that must include passwordless login continuation, consent, Stripe entitlement handling, OAuth error redirects, and live connector compatibility tests.
