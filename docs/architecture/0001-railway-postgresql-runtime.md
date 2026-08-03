# ADR-0001: Railway and PostgreSQL runtime

- Status: Accepted
- Date: 2026-08-03

## Context

The upstream project uses Supabase for PostgreSQL, authentication, and export storage. Munch requires a commercial service with one centrally managed deployment, one shared multi-tenant database, Stripe subscriptions, and an operational model controlled through Railway.

## Decision

Munch will run as a containerized Bun/Hono service on Railway. Railway PostgreSQL is the production system of record. The application receives its database connection through `DATABASE_URL`, normally configured as a Railway service reference to the PostgreSQL service.

Bun's native `SQL` client will be used initially to avoid adding a separate PostgreSQL runtime dependency. Database access will be isolated behind Munch repository modules rather than called directly from MCP tool handlers.

SQL migrations will be stored in version control and applied by an explicit migration command. Application startup will verify the expected schema version but will not silently run destructive migrations.

## Deployment topology

```text
Railway project
├── Munch API/MCP service
└── PostgreSQL service
```

The first production release may run one API replica. Process-local authentication sessions, rate limits, and other coordination state must be moved into PostgreSQL before horizontal scaling.

## Consequences

- Supabase-specific persistence and authentication code will be replaced incrementally.
- The application must implement account identity and MCP OAuth itself.
- Export delivery must no longer depend on Supabase Storage.
- Railway database backups, restore tests, monitoring, and capacity alerts become Munch operational responsibilities.
- `DATABASE_URL` is required for Railway-native operation.
- Local development may use any compatible PostgreSQL instance.

## Rejected alternatives

### One Railway project per customer

Rejected because it complicates onboarding, billing, upgrades, monitoring, and support. It also prevents a straightforward single subscription experience.

### Continue using Supabase in production

Rejected because Munch's intended backend and database are Railway-managed, and the commercial authorization model should not remain coupled to Supabase Auth or service-role access.

### Add an ORM immediately

Deferred. The inherited codebase is SQL-shaped and Bun includes a native PostgreSQL client. An ORM may be reconsidered after the schema and repository boundaries stabilize.
