# ADR-0007: Coherent Railway data backend selector

- Status: Accepted
- Date: 2026-08-03

## Context

Munch must not authenticate a user through Railway OAuth while reading or writing nutrition records under an unrelated Supabase Auth UUID. The remaining inherited dependencies also include Open Food Facts cache records, tool telemetry, CSV export storage, and landing statistics. Selecting those facilities independently would create a mixed backend that is difficult to reason about and unsafe to enable incrementally.

## Decision

Munch uses one data-plane flag:

```text
MUNCH_RAILWAY_DATA_ENABLED=true
```

When false, all inherited data functions continue to use Supabase. When true, all of the following use Railway PostgreSQL together:

- meals, goals, profiles, hydration, and weight;
- food-provider cache entries;
- operational tool events;
- CSV export storage and download capabilities;
- public landing statistics.

The existing `./supabase.js` import path remains a compatibility facade. The original implementation lives in `inherited-supabase.ts`; explicit facade exports override data-plane functions with the selected repository while preserving inherited authentication helpers for rollback mode. This avoids a high-risk rewrite of the large MCP tool implementation.

## Service-role boundary

Global facilities use the restricted `munch_service` database role. It can:

- maintain global food-cache rows;
- insert and inspect redacted operational tool events;
- maintain short-lived export files;
- execute a fixed privacy-minimized landing-statistics function.

It receives no grants on meals, goals, water, weight, or account preferences. Public statistics expose only coarse user and meal counts; geographic breakdowns remain empty until a separately reviewed privacy design exists.

## Export design

Railway CSV exports are stored temporarily in PostgreSQL and addressed by a high-entropy opaque capability token. Only the token hash is stored. Download URLs use:

```text
/exports/download?token=<capability>
```

The token is kept out of the logged pathname. Responses are private and non-cacheable. Expired export records are periodically deleted.

## Cutover invariant

Railway OAuth may be enabled only when Railway data is also enabled:

```text
MUNCH_RAILWAY_DATA_ENABLED=true
MUNCH_RAILWAY_AUTH_ENABLED=true
```

The reverse staging order is permitted for testing—Railway data with inherited OAuth—but Railway auth with inherited data is prohibited.

## Verification

The PostgreSQL smoke suite must verify:

- the compatibility facade selects Railway nutrition repositories;
- food-cache round trips;
- MCP session identifiers are hashed before telemetry storage;
- public statistics contain no geographic breakdown;
- export capabilities retrieve the correct CSV and reject modified tokens;
- expired exports are removed;
- the service role cannot select meal contents directly.
