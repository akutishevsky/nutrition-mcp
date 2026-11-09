# Data-layer audit + stress baseline — Amendment E, Phase 1 (evidence only)

Slice: **data-layer (Amendment E items 1+2), Phase 1**. This document reports
what the code actually does today and a measured stress baseline. It proposes
fixes in §4 but **implements none of them** — Phase 2 starts only after the
coordinator reviews this audit. No production behaviour changed in Phase 1:
the only additions are this doc, `scripts/data-layer-stress.ts`, and a
manual-only workflow (`.github/workflows/data-layer-stress.yml`,
`workflow_dispatch` — deliberately **not** a per-PR gate).

Code references are to `main` at `ee74a6c` (the branch point of
`data-layer-audit-baseline`).

---

## 1. Cache-through audit

**Michael's belief, tested:** provider responses (USDA / Open Food Facts) are
written back into Munch's own database with provenance, so repeat lookups
resolve locally.

**Headline:** the belief is **true for the canonical pipeline** — it is fully
built, with provenance, TTLs, a query-result cache, and negative caching —
**except for one legacy barcode path** that writes to a different, siloed
table the canonical resolution order never reads, with a TTL that is declared
but never enforced.

### The canonical write-back (shared by paths i–iii-canonical)

- Tables: `munch.food_catalog_entries`, `munch.food_catalog_query_cache`,
  `munch.food_catalog_negative_cache` — `db/schema/0019_persistent_food_catalog.sql`.
  Unique identity is `(provider, provider_food_id)`; barcode, name-trigram
  (GIN), brand-trigram (GIN), and a lexical GIN index on
  `to_tsvector('simple', normalized_name || ' ' || coalesce(normalized_brand,''))`
  all exist in that migration.
- Provenance persisted per entry (`FoodCatalogRepository.catalogPayload`,
  `src/food-providers/catalog-repository.ts`): `provider`, `provider_food_id`,
  `source_snapshot` (the full normalized `FoodCandidate` JSON),
  `source_url`, `source_license`, `provider_revision`,
  `source_updated_at`, `fetched_at`, `last_successful_refresh_at`,
  `refresh_after`, `confidence`, `content_hash`, plus `access_count` /
  `last_accessed_at` usage tracking.
- Freshness: TTLs from `src/food-providers/catalog-config.ts` — packaged
  90 days, generic 180 days, query-cache 3 days, negative cache 1 day
  (env-overridable). Reads/writes can be disabled by env
  (`MUNCH_FOOD_CATALOG_READS_ENABLED` / `..._WRITES_ENABLED`, default on when
  `DATABASE_URL` is set).
- Access pattern (RLS): the catalog tables are **global, not tenant tables** —
  no RLS policies on them; grants are `munch_service`-only (0019), and every
  repository call runs via `withServiceDatabase` (`src/platform/database.ts`)
  in a transaction under role `munch_service`. That is the pattern the
  harness in §3 uses too.

### (i) Interactive food search — web/app + MCP — **COMPLETE**

Callers: web/app `GET /api/app/food-search` → `searchAppFoods`
(`src/app/meal-entry.ts`), MCP `search_foods` (`src/food-tools.ts`) — both go
through the shared `FoodSearchService.search` (`src/food-providers/service.ts`).

Resolution order actually implemented in `resolveSearch` (service.ts):

1. `findCachedSearch` — query-result cache (normalized-query hash →
   entry IDs), fresh entries only used (service.ts:184).
2. `searchLocal` — local catalog, lexical FTS first, trigram fallback
   (service.ts:209). A strong exact match (confidence ≥ 0.90 and normalized
   name/brand+name equality, `isStrongLocalMatch`) or a full result limit
   short-circuits providers entirely.
3. Providers concurrently via `FoodProviderRegistry.search` (USDA + OFF,
   2,500 ms per-provider timeout, circuit breaker in `registry.ts`).
4. **Write-back:** provider candidates are persisted with
   `catalog.upsertMany` (service.ts:237), and the combined ranked result is
   recorded with `catalog.recordSearch` (service.ts:248) so the next
   identical query is served by step 1.

Details lookups (`FoodSearchService.details`, used by web/app item
resolution and MCP `get_food_details`) follow the same pattern: local first,
negative-cache check, provider fetch, `catalog.upsert` on hit,
`recordNegative` on a verified miss (service.ts:288–311).

Two gaps _inside_ an otherwise complete path:

- **No negative caching for search.** `recordSearch` is skipped when the
  combined result is empty, and `recordNegative` is never called for the
  `search` operation (only `details` and `barcode`). A query with no
  provider result re-queries USDA + OFF on **every** repeat.
- **Stale entries are not refreshed by search.** Stale local hits are
  excluded from results and only surface as a fallback when _all_ providers
  fail (`staleOnError`, default on). If providers return other candidates,
  the stale row stays stale until a `details` lookup or a bulk re-import
  refreshes it.

### (ii) Photo / receipt / pantry grounding lookups — **COMPLETE (by delegation)**

There is no second grounding implementation. Every grounding consumer calls
the same `FoodSearchService.search`, so all of §(i)'s write-back and
resolution order applies unchanged:

- Photo logging: `src/meal-photo/grounding.ts` — stage 3 calls
  `deps.search(query, 10)` per vision item (read for this audit only; the
  meal-photo pipeline itself was out of scope for changes).
- Recipe import: `src/recipe-import/service.ts` (`searchIngredientCandidates`
  → `foodSearch.search`).
- Recipe nutrition resolution: `src/recipe-nutrition-resolution.ts:469`.
- Pantry meal-ideas planning: `src/inventory/planning-profile.ts:429`.

Receipt/pantry **vision** itself performs no per-item provider grounding —
it extracts inventory items; nutrition grounding happens later, when those
names flow through the search paths above (e.g. planning-profile, meal
logging). So there is no uncached provider path hiding in the vision flows.

### (iii) Barcode lookups — **SPLIT: canonical COMPLETE, legacy PARTIAL (siloed)**

Canonical: MCP `lookup_food_barcode` (`src/food-tools.ts:337`) and web/app
`lookupAppFoodBarcode` (`src/app/meal-entry.ts`) →
`FoodSearchService.barcode` (service.ts:330–386): local `findByBarcode` →
aggregate negative cache → concurrent provider `lookupBarcode` →
`upsertMany` on hit (service.ts:369), `recordNegative` only when providers
answered without failures (service.ts:376). **Complete**, same tables and
provenance as (i).

Legacy: MCP `lookup_barcode` (`src/mcp.ts`, registered alongside the
canonical tool) → `src/foods.ts` `lookupBarcode`. This path:

- talks **only** to Open Food Facts (never USDA),
- persists to a **different table**, `munch.food_cache`
  (`db/schema/0004_service_facilities.sql`), keyed `(source, source_id)` =
  `('openfoodfacts', barcode)` via `src/service-platform/repository.ts`,
- is **never consulted** by the canonical resolution order — a product found
  through this tool never lands in `food_catalog_entries`, and canonical
  barcode/search never reads `food_cache`,
- declares a 7-day TTL (`OFF_TTL_MS`, `src/foods.ts:19`) that is **never
  enforced**: `getCachedFood` takes `_ttlMs` and ignores it (foods.ts:233),
  and the repository read has no expiry predicate — cached products are
  effectively served forever.

Verdict for the legacy path: **partial** — a provider hit _is_ persisted,
but into a silo, with no provenance beyond the payload JSON and no working
freshness.

### (iv) Bulk USDA import — **COMPLETE, same tables, same write path**

`scripts/import-usda-food-catalog.ts` → `importUsdaBulkFile`
(`src/food-providers/usda-bulk.ts`) streams USDA bulk JSON (foundation /
survey / sr_legacy / branded) and writes through the **same**
`FoodCatalogRepository.upsertMany` sink as interactive write-back — same
table, same `(provider, provider_food_id)` conflict target, so bulk rows and
interactive rows overwrite/refresh each other rather than duplicating.
Provenance: `provider_revision = 'bulk:<dataset>:<release>'` and
`raw.ingestionSource = 'bulk_seed'` inside `source_snapshot`
(usda-bulk.ts:65). The seed wrapper `scripts/seed-usda-generic-catalog.sh`
additionally **clears the query cache** after seeding, because cached
query → entry mappings recorded before the generic corpus existed can point
at branded results. Verified live in this session: the CI ingestion smoke
(`scripts/food-catalog-ingestion-smoke.ts`) passes against the harness
database — import (2 rows from the repo fixture), idempotent re-import,
local recovery, query-cache recovery, and stale exposure all confirmed.

### Verdict summary

| Path                                         | Persisted?  | Where                                               | Provenance                                                               | Consulted later?                                                | Verdict                                                             |
| -------------------------------------------- | ----------- | --------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------- |
| (i) Interactive search + details             | Yes         | `food_catalog_entries` + `food_catalog_query_cache` | provider, provider id, snapshot, URL, license, revision, fetched-at, TTL | Yes — resolution order consults query cache → local → providers | **Complete** (no search negative cache; no stale refresh on search) |
| (ii) Photo/receipt/pantry grounding          | Yes (via i) | Same as (i)                                         | Same as (i)                                                              | Yes — same service                                              | **Complete** (by delegation)                                        |
| (iii-a) Barcode, canonical                   | Yes         | `food_catalog_entries` + negative cache             | Same as (i)                                                              | Yes                                                             | **Complete**                                                        |
| (iii-b) Barcode, legacy MCP `lookup_barcode` | Yes, siloed | `munch.food_cache` (0004)                           | Payload only                                                             | **No** — canonical paths never read it; TTL unenforced          | **Partial**                                                         |
| (iv) Bulk USDA import                        | Yes         | `food_catalog_entries` (same upsert)                | `provider_revision='bulk:<dataset>:<release>'`                           | Yes — it _is_ the local catalog                                 | **Complete**                                                        |

---

## 2. Connection pool — what the app actually uses

`src/platform/database.ts`: a single shared Bun `SQL` pool per process —
`max = MUNCH_DB_POOL_SIZE` (**default 10**, validated 1–50),
`idleTimeout: 30` s, `connectionTimeout: 10` s. **Every** catalog repository
method runs as its own transaction on this pool via `withServiceDatabase`
(role `munch_service`). Consequences measured in §3: at concurrency ≥ 10 the
miss/write workloads saturate the pool; work queues (no errors — the 10 s
connection timeout was never hit) and latency grows ~linearly with offered
concurrency while throughput stays flat.

Reads that write: `findByProviderId` and `findByBarcode` are implemented as
`UPDATE … SET last_accessed_at = now(), access_count = access_count + 1 …
RETURNING` — a read takes a **row write lock** for the transaction's life.
`searchLocal`'s access tracking, by contrast, is already batched and async
(`scheduleTouch`, 250 ms debounce). Lock waits from the update-reads were
directly observed during the stress run (§3).

---

## 3. Stress baseline

### Harness

`scripts/data-layer-stress.ts` (run instructions in its header). It mirrors
the CI `database` job's provisioning: fresh Postgres + `bun run db:migrate`
(the same command CI runs), then seeds **through the real write paths** and
drives the repository/service directly, exactly as the app connects
(`withServiceDatabase`, role `munch_service`). Provider APIs are stubbed at
the `FoodProvider` transport layer (deterministic canned candidates), so the
database — not the internet — is the system under test. Direct SQL is used
only for seed counts, the `pg_locks`/`pg_stat_activity` monitor, and
EXPLAIN ANALYZE (stated deviation from app access patterns, for evidence
only).

Environment for this baseline run: local PostgreSQL **16** on the agent VM
(CI uses Postgres 17 — schema and queries are identical; absolute numbers
are VM-class evidence, and the _shapes_ — saturation ceilings, lock waits,
plan choices — are the baseline's content). Shared-CPU VM noise is real:
percentiles varied between repeat runs (noted where it matters).

### Corpus (exactly what was seeded)

- 4,720 generated candidates via `upsertMany` in batches of 500:
  2,360 USDA-shaped generics (59 real base foods × 20 preparation forms,
  plus a seasoned variant of each) and 2,360 Open-Food-Facts-shaped branded
  rows (20 brands × 59 bases × 2 pack sizes, each with a valid EAN-13
  barcode), all with per-100 g nutrition and a 100 g portion.
- Plus the repo's USDA bulk fixture through the real bulk machinery
  (`usda-foundation-mini.json` → 2 written, 1 rejected).
- **Catalog rows after seed: 4,722.** Seed time 587 ms total.
- The query cache was additionally warmed for 10 queries via
  `recordSearch`, as production traffic would.

### Results — 90 operations per workload per concurrency level, 0 errors, 0 timeouts everywhere

| Workload                                           | Conc. | Throughput/s | p50 ms   | p95 ms       | p99 ms   |
| -------------------------------------------------- | ----- | ------------ | -------- | ------------ | -------- |
| searchLocal — lexical                              | 1     | 307.7        | 2.65     | 5.34         | 27.84    |
|                                                    | 10    | 411.6        | 12.37    | 66.22        | 75.44    |
|                                                    | 30    | 384.6        | 61.13    | 123.09       | 131.75   |
|                                                    | 60    | 310.9        | 160.48   | 200.32       | 202.94   |
| searchLocal — trigram fallback (typo queries)      | 1     | 43.9         | 22.91    | 26.61        | 52.20    |
|                                                    | 10    | 59.0         | 185.90   | 272.66       | 289.18   |
|                                                    | 30    | 54.5         | 510.24   | 708.71       | 770.01   |
|                                                    | 60    | 50.2         | 888.64   | **1,278.58** | 1,308.68 |
| findCachedSearch (query cache)                     | 1     | 1,142.6      | 0.76     | 1.83         | 2.93     |
|                                                    | 10    | 5,658.9      | 1.37     | 3.60         | 4.90     |
|                                                    | 30    | 1,346.8      | 4.53     | 55.81        | 56.52    |
|                                                    | 60    | 958.7        | 70.88    | 80.49        | 85.69    |
| findByBarcode (UPDATE…RETURNING read)              | 1     | 965.8        | 0.89     | 1.96         | 3.56     |
|                                                    | 10    | 1,026.0      | 3.74     | 55.22        | 60.75    |
|                                                    | 30    | 1,751.6      | 13.42    | 26.03        | 39.41    |
|                                                    | 60    | 746.3        | 76.45    | 104.29       | 111.35   |
| findByProviderId — hot row (UPDATE…RETURNING read) | 1     | 1,082.9      | 0.70     | 1.63         | 9.99     |
|                                                    | 10    | 2,540.9      | 2.68     | 10.09        | 21.85    |
|                                                    | 30    | 1,517.1      | 15.51    | 34.71        | 37.27    |
|                                                    | 60    | 880.0        | 55.24    | 92.51        | 94.07    |
| findByProviderId — rotating rows                   | 1     | 1,628.8      | 0.57     | 0.90         | 2.49     |
|                                                    | 10    | 2,163.3      | 1.68     | 28.71        | 29.03    |
|                                                    | 30    | 3,290.4      | 7.03     | 15.53        | 16.08    |
|                                                    | 60    | 1,164.6      | 52.99    | 66.33        | 71.99    |
| service.search — local hit (full path)             | 1     | 470.6        | 1.82     | 3.92         | 4.82     |
|                                                    | 10    | 837.1        | 6.63     | 54.15        | 58.89    |
|                                                    | 30    | 1,051.0      | 12.16    | 61.61        | 67.75    |
|                                                    | 60    | 1,030.2      | 19.70    | 80.43        | 86.90    |
| service.search — provider miss + write-back        | 1     | 29.0         | 32.06    | 49.45        | 56.17    |
|                                                    | 10    | 33.2         | 292.12   | 496.18       | 518.74   |
|                                                    | 30    | 31.0         | 911.10   | 1,267.69     | 1,280.31 |
|                                                    | 60    | 34.3         | 1,395.98 | **1,803.08** | 1,891.03 |
| upsertMany — same 10 hot rows                      | 1     | 451.1        | 1.77     | 2.64         | 28.82    |
|                                                    | 10    | 276.5        | 17.64    | 105.15       | 219.84   |
|                                                    | 30    | 215.7        | 115.47   | 183.57       | 278.95   |
|                                                    | 60    | 420.0        | 104.43   | 168.41       | 205.88   |

### Findings

1. **The provider-miss path has a hard ceiling of ≈ 30/s regardless of
   concurrency.** Throughput is flat (29.0 → 34.3/s from concurrency 1 → 60)
   while p95 grows 49 ms → 1,803 ms: every miss pays the two-stage local
   search (lexical _and_ trigram fallback), the stubbed provider call, an
   `upsertMany`, and a `recordSearch` — several pool transactions per
   search, on a 10-connection pool. This is the exact path photo/receipt/
   pantry grounding hammers when foods aren't yet cached.
2. **The trigram fallback is the most expensive read: ≈ 50/s ceiling**,
   p95 1,279 ms at concurrency 60. Typo/fuzzy searches (and every provider
   miss, which falls through to it) pay this.
3. **Lock waits are real on the update-reads.** The monitor (100 ms polls
   of `pg_locks` / `pg_stat_activity`) observed up to **9–10 ungranted
   locks** with `Lock/tuple` and `Lock/transactionid` wait events in both
   baseline runs, coinciding with the barcode/hot-row/upsert workloads.
   No deadlocks and no errors occurred. (One repeat run showed hot-row
   p50 ≈ 913 ms at concurrency 60 vs 55 ms in the table above — contention
   on this path is high-variance, which is itself the finding.)
4. **Pool exhaustion is queueing, not failure.** Max active connections
   observed: 12 = the app's 10 (saturated) + the monitor's 2. At
   concurrency ≥ 10, added concurrency buys latency, not throughput, on
   every write-touching workload. Pure query-cache reads stay fast
   (p95 ≤ 4 ms at concurrency 10) and degrade at 60 only from pool queueing.
5. **Local-hit full searches are healthy**: `service.search` resolving from
   the query cache/local catalog holds p95 ≤ 87 ms even at concurrency 60 —
   cache-through is doing its job where it exists.

### EXPLAIN ANALYZE (worst offenders; full plans in the harness JSON output)

- **Lexical search** (`banana:*`): GIN index used
  (`food_catalog_lexical_search_idx`, bitmap), execution 4.40 ms — but it
  touches ~1,020 buffers / 907 heap blocks because rows carry the wide
  `source_snapshot` JSONB. In the smaller 2,362-row run the planner instead
  chose `food_catalog_refresh_idx` + filter over all non-deprecated rows —
  plan choice flips with table size/statistics.
- **Trigram fallback** (`'bananna'`): GIN trgm bitmap-or
  (`food_catalog_name_trgm_idx`), 4.67 ms single-shot — cheap alone, but it
  runs _after_ a failed lexical query and _before_ providers on every miss,
  and its ~50/s ceiling under concurrency makes it the miss path's biggest
  single cost.
- **Barcode update-read**: index scan on `food_catalog_barcode_idx`,
  2.05 ms including the `updated_at` trigger — cheap alone; its cost under
  load is the row lock (finding 3), not the plan.
- **Query-cache join**: 0.19 ms, index-only scans + memoize — not a problem.

---

## 4. Phase 2 proposal (for coordinator review — nothing here is built)

In order:

1. **Close the legacy barcode silo.** Route MCP `lookup_barcode` through
   `FoodSearchService.barcode` (or retire the legacy tool in favour of
   `lookup_food_barcode`), and either enforce the TTL on `munch.food_cache`
   or drop the table's food use. _No schema migration expected._ Moves:
   duplicate OFF traffic eliminated; every barcode hit starts landing in
   the canonical catalog.
2. **Stop writing on read paths.** Convert `findByProviderId` /
   `findByBarcode` from `UPDATE … RETURNING` to plain `SELECT`, folding
   access tracking into the existing debounced `scheduleTouch` batch used
   by `searchLocal`. _No migration._ Moves: hot-row lock waits → none
   expected; barcode/details p95 at concurrency 60 down sharply; prove
   with the harness before/after.
3. **Add search negative caching.** `recordNegative("search", …)` on
   verified no-result searches (respecting provider failures, as barcode
   already does). _No migration — the table and code path exist._ Moves:
   repeat no-result queries stop hitting providers.
4. **Cut miss-path cost.** Options to test with the harness: skip the
   trigram fallback when the lexical leg already returned fresh rows;
   run the miss path's write-back (`upsertMany` + `recordSearch`) as one
   transaction; trial a larger `MUNCH_DB_POOL_SIZE` (config-only) and
   report the trade-off honestly. Moves: the ≈ 30/s provider-miss ceiling.
5. **Refresh stale entries opportunistically on search** (return fresh
   results now, refresh stale hits in the background touch-style batch).
   _No migration expected._ Moves: catalog freshness without user-visible
   latency.

Migration coordination: none of items 1–5 is expected to need a schema
migration. If item 1's TTL enforcement chooses an index on
`food_cache(fetched_at)` it already exists (0004). Any migration that does
emerge will be numbered at merge time via the coordinator, per the slice
constraints (PR #188 may renumber the credits-ledger area; this slice does
not touch billing/credits, `src/meal-photo/`, or `public/`).

Re-running the baseline after Phase 2: same harness, same corpus recipe —
`MUNCH_STRESS_REPORT=after.json bun scripts/data-layer-stress.ts` — and
diff the tables.
