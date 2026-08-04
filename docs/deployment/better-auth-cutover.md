# Better Auth production cutover

This runbook changes Munch from the custom authentication implementation to Better Auth without changing the stable `munch.users.id` used by nutrition and billing records.

## Deployment model

`main` is the only production release branch. GitHub CI runs formatting, TypeScript, unit tests, migrations, schema-drift validation, PostgreSQL/RLS smoke suites, and the production container build. Railway watches `main` and deploys merged commits automatically.

Do not use a separate staging environment or the former manually dispatched Railway deployment workflow.

## Required production configuration

Before changing the authentication backend, Railway must contain:

```text
NODE_ENV=production
MUNCH_APP_BASE_URL=https://<production-domain>
MUNCH_RAILWAY_AUTH_ENABLED=true
MUNCH_RAILWAY_DATA_ENABLED=true
MUNCH_AUTH_BACKEND=custom
MUNCH_STRICT_STARTUP_VALIDATION=true
BETTER_AUTH_SECRET=<unique production secret>
RESEND_API_KEY=<production sending key>
MUNCH_EMAIL_FROM=Munch <sign-in@verified-domain>
STRIPE_SECRET_KEY=<live secret key>
STRIPE_WEBHOOK_SECRET=<live endpoint secret>
STRIPE_PRICE_ID=price_1U0WKnPcvGwdms66hflE5giO
USDA_FDC_API_KEY=<production key>
OFF_USER_AGENT=Munch (<real support contact>)
```

The Resend sender domain must be verified before signup is opened to arbitrary users. The Resend test sender is suitable only for limited account testing.

## Deploy the implementation

1. Merge a green pull request into `main`.
2. Confirm Railway deploys the matching `main` commit successfully.
3. Keep `MUNCH_AUTH_BACKEND=custom` during this deployment.
4. Verify `/health/live`, the homepage, current login, current OAuth, and representative MCP reads and writes.

## Enable Better Auth

1. Confirm every required production variable is present.
2. Confirm `/health/ready` returns 200 with strict startup validation.
3. Set `MUNCH_AUTH_BACKEND=better_auth` in Railway.
4. Allow Railway to redeploy the current `main` source.
5. Do not remove the custom authentication code or tables during the rollback window.

## Immediate production checks

1. Verify `/health/live` and `/health/ready`.
2. Fetch protected-resource and authorization-server metadata.
3. Dynamically register a public OAuth client.
4. Start authorization with PKCE S256.
5. Request a Resend magic link using a production smoke email.
6. Confirm opening the email performs only the scanner-safe GET.
7. Confirm the explicit POST signs the user in and creates the account when needed.
8. Complete Premium Checkout or use an existing active owner subscription.
9. Approve consent and exchange the authorization code.
10. Initialize MCP and call `tools/list`.
11. Perform one read and one idempotent write.
12. Refresh the token, revoke the connection, and confirm the revoked token fails.
13. Reconnect, export, and delete the smoke account.
14. Confirm Stripe webhook reconciliation and no duplicate subscription.
15. Confirm Resend logs show delivery without exposing the magic link in application logs.

## Rollback

Rollback immediately for cross-user access, lost or duplicated writes, broken OAuth registration, authorization or token failures, incorrect Premium enforcement, persistent readiness failure, export/deletion failure, or any security incident.

1. Preserve the database and logs.
2. Set `MUNCH_AUTH_BACKEND=custom` in Railway.
3. Allow Railway to redeploy the current known-good `main` source.
4. Verify custom login, OAuth discovery, MCP initialization, a read, and a controlled write.
5. Reopen traffic only after verification.

Nutrition and Stripe data do not require remapping because both authentication implementations use the same Munch user UUID. Better Auth browser sessions and OAuth credentials are not converted into custom credentials; affected users reconnect.
