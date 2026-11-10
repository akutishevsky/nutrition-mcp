#!/usr/bin/env bun
/**
 * Data-layer stress baseline (Amendment E, Phase 1 — evidence only).
 *
 * Provisions nothing itself: point DATABASE_URL at a database that already
 * has the canonical schema installed the same way CI does
 * (`bun run db:migrate`, see the `database` job in .github/workflows/ci.yml),
 * then run:
 *
 *   DATABASE_URL=postgres://postgres@127.0.0.1:5432/munch_test \
 *     bun scripts/data-layer-stress.ts
 *
 * What it does:
 *   1. Seeds a stated, realistic corpus through the REAL write paths:
 *      the USDA bulk-import machinery (repo fixture) plus
 *      FoodCatalogRepository.upsertMany batches of generic (USDA-shaped)
 *      and branded/barcoded (Open Food Facts-shaped) candidates.
 *   2. Drives the data-grabbing paths the app actually uses, at concurrency
 *      1 / 10 / 30 / 60: local lexical search, local trigram-fallback
 *      search, query-cache reads, barcode reads, provider-id detail reads
 *      (hot row), full FoodSearchService searches that resolve locally,
 *      full FoodSearchService searches that miss locally and write the
 *      stubbed provider results back, and concurrent same-row upserts.
 *      Provider APIs are stubbed at the FoodProvider transport layer, so
 *      the database — not the internet — is the system under test.
 *   3. Samples pg_locks / pg_stat_activity during the runs and reports
 *      lock waits, plus EXPLAIN ANALYZE for the core query shapes.
 *
 * All repository/service calls go through withServiceDatabase exactly as
 * the app connects (role munch_service, pool from src/platform/database.ts,
 * MUNCH_DB_POOL_SIZE default 10). Direct SQL is used ONLY for seeding
 * counts, lock monitoring, and EXPLAIN ANALYZE.
 *
 * This script is a manual/nightly evidence tool. It is NOT wired into the
 * per-PR CI gate (see .github/workflows/data-layer-stress.yml, which is
 * workflow_dispatch-only).
 *
 * Phase 2 extension (same corpus, same concurrency matrix): stub provider
 * calls are counted per workload, and a `legacy.lookupBarcode-repeat`
 * workload drives the legacy MCP barcode path (src/foods.ts) against the
 * stub-backed FoodSearchService, reporting whether its hits land in the
 * canonical catalog (and not in the siloed munch.food_cache).
 */
import { SQL } from "bun";
import path from "node:path";
import { foodCatalogConfig } from "../src/food-providers/catalog-config.js";
import { FoodCatalogRepository } from "../src/food-providers/catalog-repository.js";
import { FoodProviderRegistry } from "../src/food-providers/registry.js";
import { FoodSearchService } from "../src/food-providers/service.js";
import type {
    FoodCandidate,
    FoodProvider,
} from "../src/food-providers/types.js";
import { importUsdaBulkFile } from "../src/food-providers/usda-bulk.js";
import { lookupBarcode as legacyLookupBarcode } from "../src/foods.js";
import { closePlatformDatabase } from "../src/platform/database.js";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const CONCURRENCY_LEVELS = [1, 10, 30, 60];
const OPS_PER_WORKLOAD = Number(process.env.MUNCH_STRESS_OPS ?? 90);
const monitor = new SQL({ url: databaseUrl, max: 2 });
const repository = new FoodCatalogRepository(foodCatalogConfig());

// ---------------------------------------------------------------------------
// Corpus seeding (realistic names; stated counts are printed in the report)
// ---------------------------------------------------------------------------

const GENERIC_BASES = [
    "banana",
    "apple",
    "chicken breast",
    "brown rice",
    "white rice",
    "sweet potato",
    "broccoli florets",
    "salmon fillet",
    "ground beef",
    "rolled oats",
    "whole milk",
    "cheddar cheese",
    "Greek yogurt",
    "peanut butter",
    "olive oil",
    "egg",
    "avocado",
    "spinach",
    "carrot",
    "tomato",
    "onion",
    "garlic",
    "almond",
    "walnut",
    "quinoa",
    "lentils",
    "black beans",
    "chickpeas",
    "tofu",
    "turkey breast",
    "pork chop",
    "shrimp",
    "tuna",
    "sardines",
    "blueberries",
    "strawberries",
    "orange",
    "grapes",
    "pear",
    "peach",
    "mango",
    "pineapple",
    "kale",
    "cauliflower",
    "green beans",
    "corn",
    "peas",
    "cucumber",
    "bell pepper",
    "mushroom",
    "zucchini",
    "honey",
    "maple syrup",
    "butter",
    "cream cheese",
    "mozzarella",
    "parmesan",
    "cottage cheese",
    "sour cream",
];
const FORMS = [
    "raw",
    "cooked",
    "boiled",
    "roasted",
    "grilled",
    "steamed",
    "baked",
    "fresh",
    "frozen",
    "dried",
    "canned",
    "chopped",
    "sliced",
    "whole",
    "skinless",
    "boneless",
    "salted",
    "unsalted",
    "organic",
    "enriched",
];
const BRANDS = [
    "Nature Valley",
    "Quaker",
    "Kellogg's",
    "General Mills",
    "Chobani",
    "Fage",
    "Kraft",
    "Heinz",
    "Barilla",
    "Ronzoni",
    "Tyson",
    "Perdue",
    "Blue Diamond",
    "Planters",
    "Jif",
    "Skippy",
    "Nutella",
    "Oreo",
    "Lay's",
    "Doritos",
];

function ean13CheckDigit(first12: string): string {
    let sum = 0;
    for (let i = 0; i < 12; i += 1) {
        const digit = Number(first12[i]);
        sum += i % 2 === 0 ? digit : digit * 3;
    }
    return String((10 - (sum % 10)) % 10);
}

function candidate(
    overrides: Partial<FoodCandidate> &
        Pick<FoodCandidate, "provider" | "providerFoodId" | "name">,
): FoodCandidate {
    return {
        dataKind: "generic",
        nutrientsPer100g: {
            calories: 120,
            protein_g: 8,
            carbs_g: 14,
            fat_g: 3,
        },
        portions: [
            {
                id: "100g",
                amount: 100,
                unit: "g",
                label: "100 g",
                gramWeight: 100,
                nutrients: {
                    calories: 120,
                    protein_g: 8,
                    carbs_g: 14,
                    fat_g: 3,
                },
            },
        ],
        attribution: {
            label:
                overrides.provider === "usda"
                    ? "USDA FoodData Central"
                    : "Open Food Facts",
            license:
                overrides.provider === "usda" ? "CC0 / public domain" : "ODbL",
        },
        confidence: 0.92,
        ...overrides,
    };
}

function buildCorpus(): FoodCandidate[] {
    const corpus: FoodCandidate[] = [];
    // Generic USDA-shaped rows: base x form x index variants.
    let genericIndex = 0;
    for (const base of GENERIC_BASES) {
        for (const form of FORMS) {
            corpus.push(
                candidate({
                    provider: "usda",
                    providerFoodId: String(900_000 + genericIndex),
                    name: `${base}, ${form}`,
                    dataKind: "generic",
                }),
            );
            genericIndex += 1;
        }
    }
    // Second generic wave: seasoned variants of every base x form.
    for (const base of GENERIC_BASES) {
        for (const form of FORMS) {
            corpus.push(
                candidate({
                    provider: "usda",
                    providerFoodId: String(950_000 + genericIndex),
                    name: `${base}, ${form}, seasoned`,
                    dataKind: "generic",
                }),
            );
            genericIndex += 1;
        }
    }
    // Branded OFF-shaped rows with valid EAN-13 barcodes (two pack sizes).
    let brandedIndex = 0;
    for (const brand of BRANDS) {
        for (const base of GENERIC_BASES) {
            for (const pack of ["snack pack", "family pack"]) {
                const first12 =
                    `30${String(10_000_000 + brandedIndex).padStart(10, "0")}`.slice(
                        0,
                        12,
                    );
                corpus.push(
                    candidate({
                        provider: "open_food_facts",
                        providerFoodId: `${first12}${ean13CheckDigit(first12)}`,
                        name: `${base} ${pack}`,
                        brand,
                        dataKind: "packaged",
                        barcode: `${first12}${ean13CheckDigit(first12)}`,
                    }),
                );
                brandedIndex += 1;
            }
        }
    }
    return corpus;
}

// ---------------------------------------------------------------------------
// Stub providers (transport layer stubbed; DB is the system under test)
// ---------------------------------------------------------------------------

const providerCalls = { search: 0, barcode: 0, details: 0 };
const corpusBarcodes = new Set<string>();

function stubProvider(name: "usda" | "open_food_facts"): FoodProvider {
    return {
        name,
        async search(input) {
            providerCalls.search += 1;
            // Verified-miss marker: queries containing "zzznoresult"
            // return no candidates from either provider (Phase 2
            // negative-caching workload).
            if (input.query.includes("zzznoresult")) return [];
            // Deterministic per-query candidates with fresh provider IDs,
            // so a local miss exercises upsertMany + recordSearch writes.
            const seed = [...input.query].reduce(
                (acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0,
                7,
            );
            return [0, 1, 2].map((offset) =>
                candidate({
                    provider: name,
                    providerFoodId: `stub-${seed}-${offset}`,
                    name: `${input.query} provider result ${offset}`,
                    dataKind: name === "usda" ? "generic" : "packaged",
                }),
            );
        },
        async getDetails(input) {
            providerCalls.details += 1;
            return candidate({
                provider: name,
                providerFoodId: input.providerFoodId,
                name: "stub details food",
            });
        },
        async lookupBarcode(input) {
            providerCalls.barcode += 1;
            // USDA only "carries" GTINs from the seeded corpus; OFF is
            // the barcode authority for everything else. (A provider
            // returning a candidate for every barcode would hide the
            // cross-provider barcode dedupe the registry performs.)
            if (name === "usda" && !corpusBarcodes.has(input.barcode)) {
                return null;
            }
            return candidate({
                provider: name,
                providerFoodId: input.barcode,
                name: "stub barcode food",
                barcode: input.barcode,
            });
        },
    };
}

const service = new FoodSearchService(
    new FoodProviderRegistry([
        stubProvider("usda"),
        stubProvider("open_food_facts"),
    ]),
    repository,
);

// ---------------------------------------------------------------------------
// Measurement helpers
// ---------------------------------------------------------------------------

function percentile(values: number[], fraction: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    if (sorted.length === 0) return 0;
    const index = Math.min(
        sorted.length - 1,
        Math.max(0, Math.ceil(sorted.length * fraction) - 1),
    );
    return Number(sorted[index]!.toFixed(2));
}

interface WorkloadResult {
    workload: string;
    concurrency: number;
    ops: number;
    errors: number;
    wall_ms: number;
    throughput_per_s: number;
    p50_ms: number;
    p95_ms: number;
    p99_ms: number;
    max_ms: number;
    provider_calls: { search: number; barcode: number; details: number };
}

async function runWorkload(
    workload: string,
    concurrency: number,
    operation: (index: number) => Promise<void>,
): Promise<WorkloadResult> {
    const durations: number[] = [];
    let errors = 0;
    let next = 0;
    const callsBefore = { ...providerCalls };
    const startedAt = performance.now();
    await Promise.all(
        Array.from({ length: concurrency }, async () => {
            for (;;) {
                const index = next;
                next += 1;
                if (index >= OPS_PER_WORKLOAD) return;
                const opStartedAt = performance.now();
                try {
                    await operation(index);
                } catch {
                    errors += 1;
                }
                durations.push(performance.now() - opStartedAt);
            }
        }),
    );
    const wallMs = performance.now() - startedAt;
    return {
        workload,
        concurrency,
        ops: durations.length,
        errors,
        wall_ms: Number(wallMs.toFixed(1)),
        throughput_per_s: Number(
            (durations.length / (wallMs / 1000)).toFixed(1),
        ),
        p50_ms: percentile(durations, 0.5),
        p95_ms: percentile(durations, 0.95),
        p99_ms: percentile(durations, 0.99),
        max_ms: Number(Math.max(...durations).toFixed(2)),
        provider_calls: {
            search: providerCalls.search - callsBefore.search,
            barcode: providerCalls.barcode - callsBefore.barcode,
            details: providerCalls.details - callsBefore.details,
        },
    };
}

// Lock monitor: poll while workloads run.
let monitoring = true;
let maxLockWaiters = 0;
let lockWaitSamples = 0;
let maxActiveConnections = 0;
const lockWaitEvents: string[] = [];
const monitorLoop = (async () => {
    while (monitoring) {
        try {
            const rows = await monitor<
                Array<{ waiters: number; active: number }>
            >`
                select
                    (select count(*)::int from pg_locks where not granted) as waiters,
                    (select count(*)::int from pg_stat_activity
                     where datname = current_database()) as active
            `;
            const waiters = rows[0]?.waiters ?? 0;
            const active = rows[0]?.active ?? 0;
            if (waiters > 0) {
                lockWaitSamples += 1;
                const detail = await monitor<
                    Array<{
                        wait_event_type: string | null;
                        wait_event: string | null;
                        state: string;
                    }>
                >`
                    select wait_event_type, wait_event, state
                    from pg_stat_activity
                    where datname = current_database()
                      and wait_event_type = 'Lock'
                    limit 3
                `;
                for (const row of detail) {
                    lockWaitEvents.push(
                        `${row.wait_event_type}/${row.wait_event ?? "?"} state=${row.state}`,
                    );
                }
            }
            maxLockWaiters = Math.max(maxLockWaiters, waiters);
            maxActiveConnections = Math.max(maxActiveConnections, active);
        } catch {
            // Monitor failures never fail the baseline.
        }
        await Bun.sleep(100);
    }
})();

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

const corpus = buildCorpus();
for (const entry of corpus) {
    if (entry.barcode) corpusBarcodes.add(entry.barcode);
}
const seedStartedAt = performance.now();
for (let i = 0; i < corpus.length; i += 500) {
    await repository.upsertMany(corpus.slice(i, i + 500));
}
const bulkStats = await importUsdaBulkFile({
    filePath: path.resolve(
        "src/food-providers/fixtures/usda-foundation-mini.json",
    ),
    dataset: "foundation",
    release: "2026-04",
    batchSize: 100,
    sink: repository,
});
const seedMs = Math.round(performance.now() - seedStartedAt);
const countRows = await monitor<Array<{ count: number | string }>>`
    select count(*) as count from munch.food_catalog_entries
`;
const catalogRows = Number(countRows[0]?.count ?? 0);

// Queries used by the workloads, all resolvable against the seeded corpus.
const lexicalQueries = GENERIC_BASES.slice(0, 20).map((base) => base);
const trigramQueries = [
    "bananna",
    "chiken breast",
    "brocoli florets",
    "salmon filet",
    "avacado",
];
const hotProviderId = corpus[0]!.providerFoodId; // "banana, raw" row
const hotBarcode = corpus.find((entry) => entry.barcode)?.barcode ?? "";
const detailIds = corpus.slice(0, 40).map((entry) => entry.providerFoodId);

// Warm the query cache for the query-cache workload.
for (const query of lexicalQueries.slice(0, 10)) {
    const hits = await repository.searchLocal(query, 10);
    await repository.recordSearch(
        query,
        hits.map((hit) => hit.candidate),
    );
}

// ---------------------------------------------------------------------------
// Workloads x concurrency levels
// ---------------------------------------------------------------------------

const hotCandidates = corpus.slice(0, 10);
// A barcode that is NOT in the seeded corpus: the first legacy lookup must
// go to the (stubbed) providers, repeats must resolve from the canonical
// catalog the canonical service writes back to.
const legacyBarcode = `301234567890${ean13CheckDigit("301234567890")}`;
const results: WorkloadResult[] = [];
for (const concurrency of CONCURRENCY_LEVELS) {
    results.push(
        await runWorkload("searchLocal-lexical", concurrency, async (i) => {
            await repository.searchLocal(
                lexicalQueries[i % lexicalQueries.length]!,
                10,
            );
        }),
        await runWorkload(
            "searchLocal-trigram-fallback",
            concurrency,
            async (i) => {
                await repository.searchLocal(
                    trigramQueries[i % trigramQueries.length]!,
                    10,
                );
            },
        ),
        await runWorkload("findCachedSearch", concurrency, async (i) => {
            await repository.findCachedSearch(lexicalQueries[i % 10]!, 10);
        }),
        await runWorkload("findByBarcode", concurrency, async () => {
            await repository.findByBarcode(hotBarcode);
        }),
        await runWorkload("findByProviderId-hot-row", concurrency, async () => {
            await repository.findByProviderId("usda", hotProviderId);
        }),
        await runWorkload(
            "findByProviderId-rotating",
            concurrency,
            async (i) => {
                await repository.findByProviderId(
                    "usda",
                    detailIds[i % detailIds.length]!,
                );
            },
        ),
        await runWorkload(
            "service.search-local-hit",
            concurrency,
            async (i) => {
                await service.search(
                    lexicalQueries[i % lexicalQueries.length]!,
                    10,
                );
            },
        ),
        await runWorkload(
            "service.search-provider-miss",
            concurrency,
            async (i) => {
                // Unique query per (level, op): always a local miss, always a
                // provider write-back through the stubbed transport.
                await service.search(
                    `stress miss ${concurrency} ${i} zucchini`,
                    10,
                );
            },
        ),
        await runWorkload("upsertMany-hot-rows", concurrency, async () => {
            await repository.upsertMany(hotCandidates);
        }),
        await runWorkload(
            "legacy.lookupBarcode-repeat",
            concurrency,
            async () => {
                const food = await legacyLookupBarcode(legacyBarcode, service);
                if (!food) throw new Error("legacy barcode lookup missed");
            },
        ),
        await runWorkload(
            "service.search-no-result-repeat",
            concurrency,
            async () => {
                // The SAME no-result query for every op at this level:
                // the first op pays the provider calls, repeats must be
                // served by the search negative cache (provider_calls
                // delta for the workload is the evidence).
                const result = await service.search(
                    `zzznoresult flakes ${concurrency}`,
                    10,
                );
                if (result.candidates.length !== 0) {
                    throw new Error("no-result workload returned candidates");
                }
            },
        ),
    );
}

monitoring = false;
await monitorLoop;

// ---------------------------------------------------------------------------
// Stale-refresh verification (Phase 2, item 5): age one corpus row past its
// refresh_after, touch it with a search, and poll until the background
// refresh re-freshens it. The search itself must return without waiting.
// ---------------------------------------------------------------------------

await monitor`
    update munch.food_catalog_entries
    set refresh_after = now() - interval '1 day'
    where provider = 'usda' and provider_food_id = ${hotProviderId}
`;
const staleDetailsBefore = providerCalls.details;
const staleSearchStartedAt = performance.now();
await service.search("banana, raw", 10);
const staleSearchMs = Math.round(performance.now() - staleSearchStartedAt);
let staleRefreshed = false;
for (let i = 0; i < 50 && !staleRefreshed; i += 1) {
    const rows = await monitor<Array<{ fresh: boolean }>>`
        select refresh_after > now() as fresh
        from munch.food_catalog_entries
        where provider = 'usda' and provider_food_id = ${hotProviderId}
    `;
    staleRefreshed = rows[0]?.fresh ?? false;
    if (!staleRefreshed) await Bun.sleep(100);
}
const staleRefresh = {
    provider_food_id: hotProviderId,
    search_ms: staleSearchMs,
    refreshed_in_background: staleRefreshed,
    provider_details_calls: providerCalls.details - staleDetailsBefore,
};

// ---------------------------------------------------------------------------
// EXPLAIN ANALYZE for the core query shapes (direct SQL; read the audit doc)
// ---------------------------------------------------------------------------

async function explain(sql: string): Promise<string> {
    const rows = await monitor<Array<{ "QUERY PLAN": string }>>`
        select 'x' as "QUERY PLAN" where false
    `;
    void rows;
    const plan = await monitor.unsafe(
        `explain (analyze, buffers, format text) ${sql}`,
    );
    return (plan as Array<Record<string, string>>)
        .map((row) => Object.values(row)[0])
        .join("\n");
}

const explains: Record<string, string> = {};
explains["searchLocal-lexical"] = await explain(`
    select id from munch.food_catalog_entries
    where deprecated_at is null
      and to_tsvector('simple', normalized_name || ' ' || coalesce(normalized_brand, ''))
          @@ to_tsquery('simple', 'banana:*')
    order by length(normalized_name) asc, confidence desc limit 50
`);
explains["searchLocal-trigram"] = await explain(`
    select id from munch.food_catalog_entries
    where deprecated_at is null
      and (normalized_name % 'bananna' or normalized_name like '%bananna%')
    order by similarity(normalized_name, 'bananna') desc limit 50
`);
explains["findByBarcode-select"] = await explain(`
    select id from munch.food_catalog_entries
    where barcode = '${hotBarcode}' and deprecated_at is null
`);
explains["query-cache-join"] = await explain(`
    select entry.id from munch.food_catalog_query_cache cache
    cross join lateral unnest(cache.entry_ids) with ordinality as cached(entry_id, ordinal)
    join munch.food_catalog_entries entry on entry.id = cached.entry_id
    where cache.expires_at > now() limit 10
`);

const legacyCatalogRows = await monitor<Array<{ count: number | string }>>`
    select count(*) as count from munch.food_catalog_entries
    where barcode = ${legacyBarcode}
`;
const legacySiloRows = await monitor<Array<{ count: number | string }>>`
    select count(*) as count from munch.food_cache
    where source_id = ${legacyBarcode}
`;

const report = {
    stale_refresh: staleRefresh,
    legacy_barcode: {
        barcode: legacyBarcode,
        catalog_rows_after_workloads: Number(legacyCatalogRows[0]?.count ?? 0),
        food_cache_rows_after_workloads: Number(legacySiloRows[0]?.count ?? 0),
    },
    corpus: {
        generated_candidates: corpus.length,
        bulk_fixture_written: bulkStats.written,
        catalog_rows_after_seed: catalogRows,
        seed_ms: seedMs,
    },
    pool: {
        note: "App pool = Bun SQL in src/platform/database.ts; max = MUNCH_DB_POOL_SIZE (default 10), idleTimeout 30s, connectionTimeout 10s. Repository calls run via withServiceDatabase (role munch_service, one transaction per call).",
        max_active_connections_observed: maxActiveConnections,
    },
    locks: {
        max_lock_waiters_observed: maxLockWaiters,
        poll_samples_with_waiters: lockWaitSamples,
        sample_wait_events: [...new Set(lockWaitEvents)].slice(0, 10),
    },
    results,
    explains,
};
console.log(`[data_layer_stress] ${JSON.stringify(report, null, 2)}`);
if (process.env.MUNCH_STRESS_REPORT) {
    await Bun.write(
        process.env.MUNCH_STRESS_REPORT,
        JSON.stringify(report, null, 2),
    );
}

await closePlatformDatabase();
await monitor.close();
