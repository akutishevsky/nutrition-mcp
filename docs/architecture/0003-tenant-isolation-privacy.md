# ADR-0003: Multi-tenant isolation and administrative privacy

- Status: Accepted
- Date: 2026-08-03

## Context

Munch will store meals, weight, hydration, goals, and related consumer wellness data for many users in one PostgreSQL database. The service operator must manage billing and operations without making nutrition contents part of routine administrative workflows.

## Decision

Every user-owned row carries a non-null `user_id`. PostgreSQL row-level security is enabled and forced on all user-owned tables. Normal application queries run under a non-owner role without `BYPASSRLS`.

The application establishes user context inside a transaction using a server-derived identifier:

```sql
begin;
select set_config('app.user_id', '<verified-user-uuid>', true);
-- user-scoped queries
commit;
```

RLS policies compare the row's `user_id` with `current_setting('app.user_id', true)`.

Database privileges are separated:

- `munch_migrations`: owns schemas and applies migrations; never used by the web service.
- `munch_app`: executes user-scoped application queries and is subject to RLS.
- `munch_billing`: accesses account and subscription metadata but not nutrition schemas.
- `munch_support`: accesses sanitized account diagnostics and connection state but not nutrition contents.

## Logging policy

Application logs must not include:

- raw MCP tool arguments or results;
- meal descriptions or notes;
- weight, hydration, alcohol, or goal values;
- email addresses;
- bearer, refresh, login, authorization, Stripe, or session tokens;
- database connection strings;
- full IP addresses when a coarser operational signal is sufficient.

Permitted operational fields include request ID, route, tool name, status, duration, coarse error category, subscription state, and anonymized installation or user identifiers.

## Administrative access

Routine billing and support interfaces cannot display nutrition contents. Privileged production database access is break-glass access, protected by strong authentication and recorded in an audit trail.

RLS does not make Munch zero-knowledge. The Railway project owner ultimately controls the database and application deployment. Product language must not claim that the operator is cryptographically incapable of accessing data.

## Verification

Automated tests must create at least two users and attempt cross-tenant reads, writes, updates, deletes, searches, exports, widget loads, and indirect identifier access. A feature is not complete until those tests pass for every affected table and route.
