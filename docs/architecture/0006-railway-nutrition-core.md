# ADR-0006: Railway-native nutrition core

- Status: Accepted
- Date: 2026-08-03

## Context

Railway-native Munch accounts and OAuth use Munch user UUIDs. The inherited nutrition repository uses Supabase tables keyed to Supabase Auth UUIDs. Railway OAuth cannot be enabled until meal, goal, hydration, weight, and preference ownership uses the same Munch identity.

## Decision

Railway PostgreSQL stores the nutrition core in the `munch` schema:

- `meals`
- `nutrition_goals`
- `water_logs`
- `weight_logs`
- `account_preferences`

Every user-owned table carries a non-null Munch `user_id`, references `munch.users`, enables and forces RLS, and grants routine access only to the restricted `munch_app` role. The application establishes `app.user_id` inside each transaction.

The Railway repository preserves the inherited Nutrition MCP field names and public value contracts. In particular:

- meal calories and integer goal fields are rounded before storage;
- meal idempotency keys remain byte-for-byte compatible with upstream;
- hydration and weight use the canonical integer values supplied by the tool layer;
- fiber, sugar, and alcohol remain nullable for historical coverage semantics;
- alcohol remains stored regardless of display preference;
- profile defaults remain UTC, widgets enabled, and alcohol tracking disabled;
- date retrieval uses timezone-aware UTC boundaries;
- searches require all tokens within either the description or notes for each query alternative.

Permanent account deletion removes the Munch user row and cascades through account, OAuth, billing, and nutrition tables. Retained operational audit rows have actor and subject UUIDs severed first.

## Staged cutover

This ADR introduces the schema and compatibility repository but does not switch the MCP import surface yet. The following cutover must also address:

- tool analytics;
- Open Food Facts cache;
- CSV export delivery that currently uses Supabase Storage;
- landing statistics;
- any remaining direct `supabase.ts` imports.

`MUNCH_RAILWAY_AUTH_ENABLED` remains false until the compatibility layer is complete and black-box MCP tests pass against Railway data.

## Verification

The PostgreSQL smoke suite must verify:

- meal, water, and weight idempotency;
- profile and goal compatibility;
- timezone-aware reads;
- meal search and updates;
- direct cross-tenant reads return no rows;
- direct cross-tenant writes are rejected by RLS;
- permanent account deletion cascades successfully.
