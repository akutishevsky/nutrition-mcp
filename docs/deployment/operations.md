# Munch production operations

## Health endpoints

- `/health/live` proves the Bun process can serve HTTP.
- `/health/ready` validates configuration, PostgreSQL connectivity, migration coverage, required database roles, and forced RLS on every user-owned nutrition table.
- `/health` is a compatibility alias for liveness.

The repository keeps Railway on `/health/live` while the inherited backend remains available. During the controlled Railway cutover:

1. configure all Railway, Stripe, login-delivery, Open Food Facts, and USDA variables;
2. enable both Railway backend flags in staging;
3. confirm `/health/ready` returns 200;
4. complete MCP certification;
5. set `MUNCH_STRICT_STARTUP_VALIDATION=true`;
6. change the production Railway health check to `/health/ready`.

Readiness responses never contain secrets, user identities, meal contents, or database connection strings.

## Startup validation

Strict production startup enforcement is enabled only when:

```text
MUNCH_STRICT_STARTUP_VALIDATION=true
```

Once enabled, startup fails before the server is exposed when any of these conditions is true:

- Railway authentication and data flags do not match.
- The public application origin is missing, malformed, contains a path, or does not use HTTPS.
- The session secret is shorter than 32 characters.
- development magic-link exposure is enabled.
- Stripe, login delivery, Open Food Facts, USDA, or database configuration is missing.
- the login-delivery endpoint does not use HTTPS.
- the database pool size is outside the allowed range.

Do not enable strict validation until staging readiness is green. Once production uses the Railway backend, do not disable it merely to force an unhealthy deployment online.

## Scheduled maintenance

Create a separate Railway cron service from the same repository and image.

Command:

```text
bun run maintenance
```

Recommended schedule:

```text
0 4 * * *
```

That runs once daily at 04:00 UTC. The job removes only bounded operational records:

- consumed or expired login tokens after 24 hours;
- expired or revoked web sessions after 7 days;
- expired OAuth authorization sessions and codes;
- expired or revoked access tokens after 7 days;
- expired or revoked refresh tokens after 30 days;
- expired export capabilities;
- provider cache entries older than 30 days;
- redacted tool events older than 90 days;
- cancelled or expired drafts older than 30 days.

Confirmed drafts, meals, meal items, saved foods, goals, hydration, weight, subscriptions, and Stripe webhook idempotency records are not deleted by routine maintenance.

The cron service requires only `DATABASE_URL`; use the same private Railway PostgreSQL reference as the web service. Do not expose the database publicly for the cron job.

## Monitoring

Alert on:

- `/health/ready` returning 503 after the Railway cutover;
- repeated container restarts;
- failed migration pre-deploy commands;
- Stripe webhook 5xx responses;
- passwordless delivery failures;
- database storage or connection-pool saturation;
- a sustained increase in MCP authorization or tool errors.

Logs must not include OAuth tokens, magic links, Stripe secrets, database URLs, meal descriptions, weights, tool arguments, export capabilities, or request bodies.

## Backups and recovery

Enable Railway PostgreSQL backups and point-in-time recovery before accepting paid users. Perform a restore exercise into an isolated Railway environment before launch and after material schema changes. A backup is not considered operational until a restore has been verified.
