# Railway deployment foundation

Munch uses one Railway project containing the API/MCP service and one PostgreSQL service. The account, Stripe, and Railway OAuth frameworks are implemented, but inherited nutrition storage remains Supabase-backed until its migration PRs merge.

## Services

1. Create a Railway project.
2. Add a PostgreSQL service.
3. Add a service from the `michaelhmiv/Munch` GitHub repository.
4. Railway reads [`railway.json`](../../railway.json), builds the Dockerfile, runs `bun run db:migrate` as the pre-deploy command, and checks `/health`.

## Required variables

Set these on the Munch service:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
MUNCH_APP_BASE_URL=https://<munch-domain>
MUNCH_DB_POOL_SIZE=10
MUNCH_RAILWAY_AUTH_ENABLED=false
MUNCH_SESSION_SECRET=<at-least-32-random-bytes>
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
MUNCH_LOGIN_DELIVERY_ENDPOINT=https://<transactional-email-adapter>
MUNCH_LOGIN_DELIVERY_SECRET=<independent-random-secret>
OFF_USER_AGENT=Munch (<support-contact>)
```

Keep `MUNCH_DEV_EXPOSE_LOGIN_LINK` unset or `false` in Railway.

### OAuth cutover flag

`MUNCH_RAILWAY_AUTH_ENABLED` selects the OAuth and bearer-token implementation:

- `false`: inherited Supabase-backed OAuth remains active.
- `true`: Railway PostgreSQL client registration, passwordless authorization, Stripe subscription onboarding, short-lived access tokens, and rotating refresh tokens are active.

Keep the flag `false` until both conditions are satisfied:

1. nutrition persistence has moved to Railway PostgreSQL, so the Munch user UUID used by OAuth is also the owner key used by meal, water, weight, goal, and profile records; and
2. the Railway deployment has passed live MCP connector registration, authorization, refresh, reconnect, and revocation certification.

Enabling Railway OAuth while MCP tools still use inherited Supabase nutrition tables would create incompatible user identities and is not supported.

The inherited runtime still requires the temporary Supabase variables documented in [`.env.example`](../../.env.example). The inherited global OAuth client variables are required only while `MUNCH_RAILWAY_AUTH_ENABLED=false`.

## Stripe configuration

Create one recurring Stripe Price for the initial Munch plan and set its ID as `STRIPE_PRICE_ID`.

Configure the Stripe webhook endpoint as:

```text
https://<munch-domain>/webhooks/stripe
```

Subscribe to at least:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.paused`
- `customer.subscription.resumed`

Checkout sessions include the Munch user UUID in both Checkout metadata and subscription metadata. Webhook processing uses that value to associate Stripe records with the correct Munch account. The checkout success return also verifies the completed Checkout Session and retrieves its Subscription directly, so OAuth onboarding does not depend on webhook delivery timing.

## Passwordless login delivery

`MUNCH_LOGIN_DELIVERY_ENDPOINT` is a server-to-server adapter rather than a browser endpoint. Munch sends:

```json
{
  "email": "user@example.com",
  "loginUrl": "https://<munch-domain>/account/login/consume?token=...",
  "expiresAt": "2026-08-03T18:00:00.000Z",
  "product": "Munch"
}
```

The adapter must authenticate the Bearer secret, send a transactional email, avoid logging the magic link, and return a successful 2xx response only after accepting the delivery request.

## Deployment safety

- Do not use the Railway database-owner connection for routine application queries outside the role-scoped database helpers.
- Do not expose PostgreSQL publicly unless operationally necessary.
- Never place Stripe secrets, database URLs, magic links, OAuth tokens, client state, or nutrition payloads in logs.
- Enable Railway backups and test restoration before production launch.
- Treat a migration failure as a blocked deployment; do not bypass the pre-deploy command.
- Treat changing `MUNCH_RAILWAY_AUTH_ENABLED` as a controlled release event with an explicit rollback plan.
