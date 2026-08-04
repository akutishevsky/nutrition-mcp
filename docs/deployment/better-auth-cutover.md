# Better Auth production cutover

This runbook changes Munch from the custom authentication implementation to Better Auth without changing the stable `munch.users.id` used by nutrition and billing records.

## Preconditions

- The exact candidate commit passed `docs/deployment/better-auth-certification.md` in staging.
- GitHub environment protection is enabled for production.
- Railway production variables contain a unique Better Auth secret, working transactional-email delivery, the live Stripe API key, live webhook secret, live monthly price, USDA key, and Open Food Facts identification.
- Stripe Customer Portal and the production webhook endpoint are configured.
- `/health/ready` is 200 with strict startup validation.
- A current PostgreSQL backup exists and restore has been tested.
- Existing users are informed that old browser sessions and custom OAuth connections may require reauthorization.

## Deploy dormant code first

Deploy the certified commit while keeping:

```text
MUNCH_AUTH_BACKEND=custom
```

Verify migrations, liveness, readiness, the homepage, current account login, current OAuth, and representative MCP reads and writes. This proves the release itself is healthy before traffic is switched.

## Enable Better Auth

Change only:

```text
MUNCH_AUTH_BACKEND=better_auth
```

Keep Railway data enabled and strict startup validation enabled. Deploy through the GitHub Actions `Railway Deploy` workflow using the same certified commit SHA.

Do not drop or edit the custom authentication tables during this release. They are the rollback path.

## Immediate production certification

1. Verify `/health/live` and `/health/ready`.
2. Fetch path-aware protected-resource and authorization-server metadata.
3. Dynamically register a public test client.
4. Start authorization with PKCE S256.
5. Sign in using a production smoke email and magic link.
6. Confirm scanner-safe POST redemption and automatic signup.
7. Complete the approved low-risk live Premium purchase or use a pre-authorized owner subscription.
8. Approve consent and exchange the authorization code.
9. Initialize MCP and call `tools/list`.
10. Perform one representative read and one idempotent write.
11. Refresh the token.
12. Revoke the connection and confirm the token is rejected.
13. Reconnect and confirm the account portal lists the new connection.
14. Export and permanently delete the smoke account when testing is complete.
15. Confirm Stripe webhook reconciliation and no duplicate customer or subscription.

## Reopen traffic

Treat the cutover as complete only when OAuth registration, magic-link delivery, checkout, consent, token exchange, MCP calls, refresh, revocation, portal access, export, and deletion have all passed and logs contain no secrets or nutrition payloads.

## Rollback triggers

Rollback immediately for cross-user access, lost or duplicated writes, broken dynamic registration, authorization/token failures affecting normal clients, incorrect Premium enforcement, persistent readiness failure, inability to export/delete, or any security/privacy incident.

## Rollback

1. Stop new Better Auth connection testing.
2. Preserve the database and logs.
3. Set `MUNCH_AUTH_BACKEND=custom`.
4. Redeploy the same known-good commit through GitHub Actions.
5. Verify custom login, OAuth discovery, MCP initialization, a read, and a controlled write.
6. Reopen traffic only after verification.

Nutrition and Stripe data do not require rollback because both authentication implementations map to the same Munch user UUID. Better Auth browser sessions and OAuth credentials are not converted into custom credentials; affected users reconnect.

## Cleanup window

Keep custom authentication code and tables for an approved observation period. Monitor readiness, restarts, authorization errors, email delivery, Stripe webhooks, MCP errors/latency, database connections, exports, and deletion. Remove the legacy implementation in a later additive migration only after the rollback window closes.