# ADR-0002: Munch identity, MCP OAuth, and Stripe entitlements

- Status: Accepted
- Date: 2026-08-03

## Context

Munch needs seamless subscription onboarding and secure returning-user access. Stripe can create customers and subscriptions, but Stripe Checkout is not a complete application authentication system. ChatGPT also requires an OAuth authorization flow to obtain scoped credentials for MCP calls.

## Decision

Munch will maintain three related but separate authorities:

1. **Munch identity** proves which human owns the account.
2. **Stripe billing state** determines the account's commercial entitlement.
3. **MCP OAuth credentials** authorize a ChatGPT or other MCP client to act for that Munch user.

Initial Munch identity will be passwordless email authentication using short-lived, single-use login tokens. Passwords and social login are out of scope for the first Railway-native milestone.

MCP OAuth will use authorization code flow with mandatory PKCE (`S256`), exact registered redirect URI matching, short-lived access tokens, rotating refresh tokens, token hashing at rest, connection revocation, and persistent authorization sessions.

Stripe Checkout and the Stripe customer portal will be used for subscription creation and management. Stripe webhook events will be signature-verified from the raw request body and stored idempotently before processing.

## Entitlement states

- `trialing`: full product access.
- `active`: full product access.
- `past_due`: time-limited grace access according to policy.
- `canceled` or `unpaid`: write tools disabled; export, deletion, billing, and account-management access retained.
- no subscription: onboarding and checkout access only.

The database subscription record is a cache of Stripe state. Stripe remains the billing source of truth, and uncertain local state is reconciled against Stripe.

## Consequences

- A Stripe email alone does not create an authenticated Munch session.
- Checkout can occur inside a pending OAuth flow, but the authorization transaction must persist across the external Stripe redirect.
- No MCP tool accepts `user_id`; user identity comes from the verified bearer token.
- Subscription checks occur after authentication and before protected tool execution.
- Billing failures never automatically delete nutrition data.
- Account export and deletion remain available after commercial access ends.
