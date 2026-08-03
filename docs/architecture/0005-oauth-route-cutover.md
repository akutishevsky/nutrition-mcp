# ADR-0005: Staged Railway OAuth route cutover

- Status: Accepted
- Date: 2026-08-03

## Decision

The Railway-native OAuth HTTP routes and MCP bearer middleware are selected with:

```text
MUNCH_RAILWAY_AUTH_ENABLED=true
```

The default remains `false` until Railway PostgreSQL also stores the nutrition records consumed by MCP tools and live connector certification passes. A Munch user UUID cannot safely be sent into the inherited Supabase nutrition repository because it is not a Supabase Auth user identifier.

## Railway flow

1. The MCP client dynamically registers an exact redirect URI.
2. `/authorize` validates response type, client, redirect URI, state, and PKCE S256.
3. Munch persists an authorization session and redirects to `/oauth/continue`.
4. A user without a Munch web session receives a passwordless sign-in form.
5. The magic link returns directly to the pending authorization session.
6. If the account lacks an active entitlement, Munch creates Stripe Checkout and persists the pending OAuth session identifier.
7. The checkout return verifies the session directly with Stripe, synchronizes the subscription, and resumes authorization without waiting for webhook timing.
8. The user explicitly approves or denies access.
9. The authorization code is exchanged for a short-lived access token and rotating refresh token.
10. Refresh issuance rechecks subscription entitlement. A canceled or unpaid subscription cannot extend MCP access.

## Safety properties

- OAuth client state is never placed in logs.
- Redirects are selected only from registered URIs or validated local paths.
- Cookie-authenticated POST actions require the configured application Origin.
- Login and checkout continuations remain local until the final registered-client redirect.
- Stripe remains the billing source of truth; the checkout return closes only the webhook timing gap.
- The inherited OAuth implementation remains available as a rollback path until production cutover is certified.
