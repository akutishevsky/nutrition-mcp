# Better Auth staging certification

Munch must pass this matrix in an isolated Railway staging environment before `MUNCH_AUTH_BACKEND` is changed in production.

## Required staging isolation

Use a separate Railway environment and PostgreSQL database, Stripe test-mode API and webhook secrets, a test recurring price, a real transactional-email sandbox, a staging domain, and provider credentials. Do not copy production nutrition data into staging.

Required settings:

```text
NODE_ENV=production
MUNCH_APP_BASE_URL=https://<staging-domain>
MUNCH_RAILWAY_AUTH_ENABLED=true
MUNCH_RAILWAY_DATA_ENABLED=true
MUNCH_AUTH_BACKEND=better_auth
MUNCH_STRICT_STARTUP_VALIDATION=true
BETTER_AUTH_SECRET=<unique staging secret>
MUNCH_EMAIL_DELIVERY_ENDPOINT=<staging email adapter>
MUNCH_EMAIL_DELIVERY_SECRET=<unique staging secret>
STRIPE_SECRET_KEY=<test key>
STRIPE_WEBHOOK_SECRET=<test endpoint secret>
STRIPE_PRICE_ID=<test monthly price>
USDA_FDC_API_KEY=<staging key>
```

The Railway health check must use `/health/ready`.

## GitHub Actions setup

Create GitHub environments named `staging` and `production`. Each environment requires:

- secret `RAILWAY_TOKEN`;
- variables `RAILWAY_PROJECT_ID`, `RAILWAY_SERVICE_ID`, `RAILWAY_ENVIRONMENT_ID`, and `MUNCH_CERTIFICATION_BASE_URL`.

Require manual approval for the `production` environment. Run the `Railway Deploy` workflow with the exact commit SHA certified in staging. The workflow checks out and uploads that source tree with `railway up --ci`; it does not ask Railway to rebuild an unspecified branch head.

## Automated public gate

The deployment workflow verifies:

- `/health/live` and `/health/ready` return 200;
- path-aware protected-resource metadata identifies `/mcp`;
- authorization-server metadata exposes authorization, token, and dynamic-registration endpoints;
- PKCE S256 is advertised;
- an unauthenticated `/mcp` request returns 401 and advertises the path-aware resource metadata document.

## Browser and magic-link flow

Using a new email address:

1. Begin authorization from ChatGPT or the MCP Inspector.
2. Verify Munch preserves the signed OAuth continuation.
3. Request a magic link and confirm the visible response does not disclose account existence.
4. Verify the email link opens a confirmation page without consuming the token.
5. Press **Continue signing in** and confirm the new account is created automatically.
6. Reuse the link and confirm it is rejected.
7. Repeat with an existing email and confirm the same `munch.users.id` is used.
8. Confirm no password endpoint is available and no password value is stored.

## Premium and Stripe

1. Confirm a user without entitlement is sent to Stripe Checkout before OAuth consent.
2. Cancel Checkout and confirm no authorization code is issued.
3. Complete the seven-day trial Checkout and confirm the original OAuth request resumes.
4. Confirm direct Checkout verification allows continuation even if the webhook is delayed.
5. Deliver the webhook twice and confirm idempotency.
6. Confirm the Stripe customer, subscription, configured price, and Munch user match.
7. Exercise active, trialing, past-due/grace, canceled, unpaid, and paused states.
8. Confirm inactive entitlement blocks every MCP request without deleting stored nutrition data.
9. Confirm the Stripe Customer Portal remains accessible after cancellation.

## OAuth 2.1 and MCP

Certify:

- unauthenticated dynamic registration of a public client;
- exact redirect-URI matching;
- mandatory PKCE S256;
- state validation;
- consent approval and denial;
- one-time, short-lived authorization codes;
- `nutrition.read`, `nutrition.write`, and `offline_access` scopes;
- `/mcp` audience validation;
- access-token expiration;
- refresh-token use and revocation;
- revoked consent immediately blocks MCP access;
- wrong issuer, audience, scope, redirect URI, code verifier, code, access token, and refresh token are rejected without internal details;
- MCP initialization and `tools/list` succeed after authorization.

## Product operations

From ChatGPT, certify representative read and write tools, including food search, saved-food memory, meal drafts and confirmation, meal history, goals, hydration, weight, export, connection revocation, and account deletion. Repeat idempotent writes and verify a second user cannot read or mutate the first user's data.

## Privacy and operations

Confirm auth, OAuth, billing, portal, and export responses are private and non-cacheable; raw emails, magic links, authorization codes, access tokens, refresh tokens, nutrition payloads, and export capabilities do not appear in logs. Validate forced RLS, migration idempotency, schema drift, maintenance, backup/restore, readiness degradation, Stripe webhook alerts, and email-delivery alerts.

## Exit criteria

The candidate is eligible for production only when all automated checks and manual cases pass, no severity-one or severity-two issue remains, the exact tested commit SHA is recorded, production secrets are configured, a current database backup exists, and rollback has been reviewed.