# Munch

Munch is a privacy-conscious nutrition tracking service designed for ChatGPT and other Model Context Protocol clients. It lets users log meals, water, body weight, nutrition goals, and history through conversation while keeping deterministic validation, food-data retrieval, account authorization, and storage in the Munch backend.

> **Development status:** Munch is an active commercial-development fork and is not yet available as a production service. Do not use the repository's current configuration for sensitive production data.

## Origin and attribution

Munch is based on [Nutrition MCP](https://github.com/akutishevsky/nutrition-mcp), created by [akutishevsky](https://github.com/akutishevsky). The upstream project established the core MCP nutrition tools, OAuth flow, data model, import/export support, widgets, trend analysis, hydration tracking, and weight tracking that Munch is building upon.

The original project and this fork are licensed under the MIT License. See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md). Munch is an independent project and is not endorsed by the upstream maintainer.

## Product direction

Munch is being developed around the following operating model:

- ChatGPT or another MCP client performs language and image reasoning.
- Munch performs authentication, subscription entitlement checks, deterministic validation, food-source retrieval, storage, summaries, exports, and deletion.
- Railway hosts the application and PostgreSQL database.
- Stripe manages checkout, subscriptions, invoices, and customer billing state.
- A Munch account remains the identity boundary; Stripe is the billing authority rather than the sole authenticator.
- Users share one multi-tenant deployment, with PostgreSQL row-level security and restricted database roles isolating user-owned records.
- Administrative tools expose billing and service metadata, not meal, weight, hydration, or goal contents.
- No advertising or behavioral analytics are planned for authenticated or nutrition-data surfaces.

Architecture decisions are documented under [`docs/architecture/`](docs/architecture/).

## Inherited capabilities

The fork currently inherits the upstream Nutrition MCP feature set, including:

- meal logging, editing, deletion, date retrieval, range retrieval, and history search;
- calories, protein, carbohydrates, fat, fiber, total sugar, and opt-in alcohol tracking;
- water logging and daily hydration goals;
- body-weight logging, unit preferences, trends, and target weight;
- nutrition goals and daily progress;
- 7-, 14-, and 30-day trends and behavioral meal patterns;
- CSV history import with validation and idempotency;
- CSV export and account deletion;
- Open Food Facts barcode lookup;
- MCP Apps widgets for summaries, goals, trends, imports, and confirmation;
- OAuth-based remote MCP access.

Until the Railway/PostgreSQL migration is complete, some inherited implementation details still refer to Supabase and the original project. These are being replaced through staged, tested pull requests.

## Planned Munch additions

The commercial foundation is being built before broader feature expansion:

1. Railway-native PostgreSQL storage and migrations.
2. Passwordless Munch identity and hardened MCP OAuth.
3. Stripe checkout, subscription synchronization, customer portal, and entitlement middleware.
4. Strong tenant isolation and cross-account authorization tests.
5. Federated food search across USDA FoodData Central, Open Food Facts, saved foods, and confirmed meal history.
6. Structured meal items with source provenance and serving options.
7. Draft-and-confirm meal workflows for uncertain text and photo logs.
8. Saved foods, saved meals, and “log my usual” behavior.
9. A customer portal for billing, connection management, export, deletion, and privacy controls.
10. Production observability, redacted logging, backups, restore testing, and synthetic MCP checks.

Plugin marketplace submission and public directory distribution are intentionally deferred until the backend, billing, and authorization foundations are stable.

## Development

The current inherited runtime uses Bun and Hono.

```bash
bun install
cp .env.example .env
bun run dev
```

Quality gates:

```bash
bun run format:check
bun run typecheck
bun test
```

## Repository workflow

The fork should retain an `upstream` remote pointing to the original project:

```bash
git remote add upstream https://github.com/akutishevsky/nutrition-mcp.git
git fetch upstream
```

Generic security fixes and broadly useful nutrition improvements may be contributed upstream. Munch-specific billing, Railway infrastructure, account administration, branding, and commercial product features remain fork-specific.

See [`docs/upstream-sync.md`](docs/upstream-sync.md) for the synchronization policy.

## Security and privacy

Munch handles sensitive consumer wellness information. Development requirements include:

- derive the user identity from a verified session or bearer token;
- never accept a selectable `user_id` in an MCP tool schema;
- hash login, access, refresh, and authorization tokens at rest;
- enforce PostgreSQL RLS on every user-owned table;
- separate migration, application, billing, and support database roles;
- avoid logging tool payloads, meal descriptions, weights, goals, tokens, or email addresses;
- retain export and deletion access after subscription expiration;
- audit privileged production access;
- maintain clear privacy, terms, retention, deletion, and incident-response policies before launch.

Munch is intended as a consumer wellness tracker, not a medical device, diagnostic system, or clinical records platform.

## License

MIT. See [LICENSE](LICENSE).
