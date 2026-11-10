import { createHash } from "node:crypto";
import { isValidGtin } from "./barcode.js";
import { rankCandidates } from "./ranking.js";
import { withServiceDatabase } from "../platform/database.js";
import type {
    FoodCandidate,
    FoodProviderName,
    NutrientValues,
} from "./types.js";

export interface CatalogConfig {
    readsEnabled: boolean;
    writesEnabled: boolean;
    staleOnError: boolean;
    packagedTtlMs: number;
    genericTtlMs: number;
    searchTtlMs: number;
    negativeTtlMs: number;
}

export interface CatalogHit {
    candidate: FoodCandidate;
    stale: boolean;
}

interface CatalogRow {
    id: string;
    provider: FoodProviderName;
    provider_food_id: string;
    source_snapshot: unknown;
    refresh_after: Date | string;
}

interface CatalogIdentityRow {
    id: string;
}

export function normalizeFoodText(value: string): string {
    return value
        .normalize("NFKC")
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function lexicalFoodSearchTsquery(value: string): string {
    const normalized = normalizeFoodText(value);
    if (!normalized) return "";
    const tokens = normalized.split(" ").filter(Boolean);
    const lastIndex = tokens.length - 1;
    const last = tokens[lastIndex];
    if (!last) return "";

    let stem = last;
    if (last.length > 4 && last.endsWith("ies")) {
        stem = last.slice(0, -3);
    } else if (/[^aeiou]y$/u.test(last)) {
        stem = last.slice(0, -1);
    } else if (last.length > 4 && last.endsWith("oes")) {
        stem = last.slice(0, -2);
    } else if (
        last.length > 3 &&
        last.endsWith("s") &&
        !last.endsWith("ss") &&
        !last.endsWith("us")
    ) {
        stem = last.slice(0, -1);
    }

    tokens[lastIndex] = `${stem}:*`;
    return tokens.join(" & ");
}

export function hashCatalogIdentity(value: string): string {
    return createHash("sha256").update(value, "utf8").digest("hex");
}

function finiteNonNegative(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function validateNutrients(nutrients: NutrientValues | undefined): void {
    if (!nutrients) return;
    for (const [name, value] of Object.entries(nutrients)) {
        if (value !== undefined && !finiteNonNegative(value)) {
            throw new Error(`Invalid nutrient value for ${name}`);
        }
    }
}

export function validateCatalogCandidate(candidate: FoodCandidate): void {
    if (!candidate.providerFoodId.trim()) {
        throw new Error("Missing provider food ID");
    }
    if (!candidate.name.trim()) throw new Error("Missing food name");
    if (candidate.barcode && !isValidGtin(candidate.barcode)) {
        throw new Error("Invalid barcode");
    }
    if (
        !Number.isFinite(candidate.confidence) ||
        candidate.confidence < 0 ||
        candidate.confidence > 1
    ) {
        throw new Error("Invalid confidence");
    }
    validateNutrients(candidate.nutrientsPer100g);
    for (const portion of candidate.portions) {
        if (!Number.isFinite(portion.amount) || portion.amount <= 0) {
            throw new Error("Invalid portion amount");
        }
        if (
            portion.gramWeight !== undefined &&
            (!Number.isFinite(portion.gramWeight) || portion.gramWeight <= 0)
        ) {
            throw new Error("Invalid portion gram weight");
        }
        validateNutrients(portion.nutrients);
    }
}

function contentHash(candidate: FoodCandidate): string {
    return createHash("sha256")
        .update(JSON.stringify(candidate), "utf8")
        .digest("hex");
}

function candidateFromRow(
    row: Pick<CatalogRow, "source_snapshot">,
): FoodCandidate | null {
    const snapshot =
        typeof row.source_snapshot === "string"
            ? JSON.parse(row.source_snapshot)
            : row.source_snapshot;
    if (!snapshot || typeof snapshot !== "object") return null;
    return snapshot as FoodCandidate;
}

function hitFromRow(row: CatalogRow, now = Date.now()): CatalogHit | null {
    const candidate = candidateFromRow(row);
    if (!candidate) return null;
    return {
        candidate,
        stale: new Date(row.refresh_after).getTime() <= now,
    };
}

function refreshAfter(
    candidate: FoodCandidate,
    config: CatalogConfig,
    now: Date,
): Date {
    const ttl =
        candidate.dataKind === "generic"
            ? config.genericTtlMs
            : config.packagedTtlMs;
    return new Date(now.getTime() + ttl);
}

function providerRevision(candidate: FoodCandidate): string | null {
    return typeof candidate.raw?.revision === "string"
        ? candidate.raw.revision
        : null;
}

function sourceUpdatedAt(candidate: FoodCandidate): string | null {
    const value = candidate.sourceUpdatedAt?.trim();
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

function catalogPayload(
    candidate: FoodCandidate,
    config: CatalogConfig,
    now: Date,
) {
    const serving = candidate.portions[0]?.nutrients ?? null;
    return {
        provider: candidate.provider,
        provider_food_id: candidate.providerFoodId,
        barcode: candidate.barcode ?? null,
        name: candidate.name,
        normalized_name: normalizeFoodText(candidate.name),
        brand: candidate.brand ?? null,
        normalized_brand: candidate.brand
            ? normalizeFoodText(candidate.brand)
            : null,
        data_kind: candidate.dataKind,
        portions: candidate.portions,
        nutrients_per_100g: candidate.nutrientsPer100g ?? null,
        declared_serving_nutrition: serving,
        nutrient_payload: candidate.nutrientsPer100g ?? {},
        source_snapshot: candidate,
        source_url: candidate.attribution.url ?? null,
        source_license: candidate.attribution.license ?? null,
        provider_revision: providerRevision(candidate),
        source_updated_at: sourceUpdatedAt(candidate),
        fetched_at: now.toISOString(),
        last_successful_refresh_at: now.toISOString(),
        refresh_after: refreshAfter(candidate, config, now).toISOString(),
        confidence: candidate.confidence,
        content_hash: contentHash(candidate),
    };
}

export class FoodCatalogRepository {
    private readonly pendingTouchIds = new Set<string>();
    private touchTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(private readonly config: CatalogConfig) {}

    private scheduleTouch(ids: string[]): void {
        if (!this.config.writesEnabled || ids.length === 0) return;
        for (const id of ids) this.pendingTouchIds.add(id);
        if (this.touchTimer) return;
        this.touchTimer = setTimeout(() => {
            const pending = [...this.pendingTouchIds];
            this.pendingTouchIds.clear();
            this.touchTimer = null;
            void this.touch(pending).catch((error) => {
                console.warn(
                    `[food_catalog] access_touch_failed count=${pending.length} code=${error instanceof Error ? error.name : "unknown"}`,
                );
            });
        }, 250);
        this.touchTimer.unref?.();
    }

    private async touch(ids: string[]): Promise<void> {
        if (!this.config.writesEnabled || ids.length === 0) return;
        await withServiceDatabase(async (tx) => {
            await tx`
                update munch.food_catalog_entries
                set last_accessed_at = now(),
                    access_count = access_count + 1
                where id in (
                    select value::uuid
                    from jsonb_array_elements_text(${ids}::jsonb)
                )
            `;
        });
    }

    async findByProviderId(
        provider: FoodProviderName,
        providerFoodId: string,
    ): Promise<CatalogHit | null> {
        if (!this.config.readsEnabled) return null;
        const rows = await withServiceDatabase(
            async (tx) =>
                tx<CatalogRow[]>`
                select id, provider, provider_food_id, source_snapshot, refresh_after
                from munch.food_catalog_entries
                where provider = ${provider}
                  and provider_food_id = ${providerFoodId}
                  and deprecated_at is null
            `,
        );
        const row = rows[0];
        if (!row) return null;
        // Read paths never write synchronously (Phase 2, item 1): access
        // tracking is folded into the same debounced scheduleTouch batch
        // searchLocal already uses, so a hot row takes no write lock.
        this.scheduleTouch([row.id]);
        return hitFromRow(row);
    }

    async findByBarcode(barcode: string): Promise<CatalogHit[]> {
        if (!this.config.readsEnabled) return [];
        const rows = await withServiceDatabase(
            async (tx) =>
                tx<CatalogRow[]>`
                select id, provider, provider_food_id, source_snapshot, refresh_after
                from munch.food_catalog_entries
                where barcode = ${barcode}
                  and deprecated_at is null
            `,
        );
        this.scheduleTouch(rows.map((row) => row.id));
        const now = Date.now();
        return rows.flatMap((row) => {
            const hit = hitFromRow(row, now);
            return hit ? [hit] : [];
        });
    }

    async searchLocal(query: string, limit: number): Promise<CatalogHit[]> {
        if (!this.config.readsEnabled) return [];
        const normalized = normalizeFoodText(query);
        if (!normalized) return [];
        const boundedLimit = Math.max(1, Math.min(25, limit));
        const lexicalTsquery = lexicalFoodSearchTsquery(normalized);
        const retrievalLimit = Math.min(50, Math.max(25, boundedLimit * 5));
        const lexicalRows = await withServiceDatabase(
            async (tx) =>
                tx<CatalogRow[]>`
            select id, provider, provider_food_id, source_snapshot, refresh_after
            from munch.food_catalog_entries
            where deprecated_at is null
              and to_tsvector(
                    'simple',
                    normalized_name || ' ' || coalesce(normalized_brand, '')
                  ) @@ to_tsquery('simple', ${lexicalTsquery})
            order by
                case when normalized_name = ${normalized} then 0 else 1 end,
                length(normalized_name) asc,
                confidence desc
            limit ${retrievalLimit}
        `,
        );
        const rows = lexicalRows.length
            ? lexicalRows
            : await withServiceDatabase(
                  async (tx) =>
                      tx<CatalogRow[]>`
                  select id, provider, provider_food_id, source_snapshot, refresh_after
                  from munch.food_catalog_entries
                  where deprecated_at is null
                    and (
                      normalized_name % ${normalized}
                      or normalized_name like ${`%${normalized}%`}
                      or coalesce(normalized_brand, '') % ${normalized}
                    )
                  order by
                      case when normalized_name = ${normalized} then 0 else 1 end,
                      greatest(
                          similarity(normalized_name, ${normalized}),
                          similarity(coalesce(normalized_brand, ''), ${normalized})
                      ) desc,
                      confidence desc,
                      length(normalized_name) asc
                  limit ${retrievalLimit}
              `,
              );
        const now = Date.now();
        const hits = rows.flatMap((row) => {
            const hit = hitFromRow(row, now);
            return hit ? [hit] : [];
        });
        const ranked = rankCandidates(
            { query: normalized },
            hits.map((hit) => hit.candidate),
        );
        const order = new Map(
            ranked.map((candidate, index) => [
                `${candidate.provider}:${candidate.providerFoodId}`,
                index,
            ]),
        );
        const rowIds = new Map(
            rows.map((row) => [
                `${row.provider}:${row.provider_food_id}`,
                row.id,
            ]),
        );
        const selected = hits
            .sort(
                (left, right) =>
                    (order.get(
                        `${left.candidate.provider}:${left.candidate.providerFoodId}`,
                    ) ?? Number.MAX_SAFE_INTEGER) -
                    (order.get(
                        `${right.candidate.provider}:${right.candidate.providerFoodId}`,
                    ) ?? Number.MAX_SAFE_INTEGER),
            )
            .slice(0, boundedLimit);
        this.scheduleTouch(
            selected
                .map(
                    (hit) =>
                        rowIds.get(
                            `${hit.candidate.provider}:${hit.candidate.providerFoodId}`,
                        ) ?? "",
                )
                .filter(Boolean),
        );
        return selected;
    }

    async findCachedSearch(
        query: string,
        limit: number,
    ): Promise<CatalogHit[] | null> {
        if (!this.config.readsEnabled) return null;
        const normalized = normalizeFoodText(query);
        if (!normalized) return null;
        const queryHash = hashCatalogIdentity(normalized);
        const boundedLimit = Math.max(1, Math.min(25, limit));
        const rows = await withServiceDatabase(
            async (tx) =>
                tx<CatalogRow[]>`
                select
                    entry.id,
                    entry.provider,
                    entry.provider_food_id,
                    entry.source_snapshot,
                    entry.refresh_after
                from munch.food_catalog_query_cache cache
                cross join lateral unnest(cache.entry_ids)
                    with ordinality as cached(entry_id, ordinal)
                join munch.food_catalog_entries entry
                  on entry.id = cached.entry_id
                 and entry.deprecated_at is null
                where cache.query_hash = ${queryHash}
                  and cache.expires_at > now()
                order by cached.ordinal
                limit ${boundedLimit}
            `,
        );
        if (rows.length === 0) return null;
        this.scheduleTouch(rows.map((row) => row.id));
        const now = Date.now();
        return rows.flatMap((row) => {
            const hit = hitFromRow(row, now);
            return hit ? [hit] : [];
        });
    }

    async recordSearch(
        query: string,
        candidates: FoodCandidate[],
    ): Promise<void> {
        if (!this.config.writesEnabled || candidates.length === 0) return;
        const normalized = normalizeFoodText(query);
        if (!normalized) return;
        const queryHash = hashCatalogIdentity(normalized);
        const identities = candidates.map((candidate, index) => ({
            provider: candidate.provider,
            provider_food_id: candidate.providerFoodId,
            ordinal: index,
        }));
        const providers = [
            ...new Set(candidates.map((candidate) => candidate.provider)),
        ];
        const expiresAt = new Date(Date.now() + this.config.searchTtlMs);
        await withServiceDatabase(async (tx) => {
            const rows = await tx<CatalogIdentityRow[]>`
                select entry.id
                from jsonb_to_recordset(${identities}::jsonb)
                    as input(provider text, provider_food_id text, ordinal integer)
                join munch.food_catalog_entries entry
                  on entry.provider = input.provider
                 and entry.provider_food_id = input.provider_food_id
                 and entry.deprecated_at is null
                order by input.ordinal
            `;
            if (rows.length === 0) return;
            const entryIds = rows.map((row) => row.id);
            await tx`
                insert into munch.food_catalog_query_cache (
                    query_hash,
                    normalized_query,
                    provider_set,
                    entry_ids,
                    fetched_at,
                    expires_at
                ) values (
                    ${queryHash},
                    ${normalized},
                    array(
                        select value
                        from jsonb_array_elements_text(${providers}::jsonb)
                    ),
                    array(
                        select value::uuid
                        from jsonb_array_elements_text(${entryIds}::jsonb)
                    ),
                    now(),
                    ${expiresAt}
                )
                on conflict (query_hash) do update set
                    normalized_query = excluded.normalized_query,
                    provider_set = excluded.provider_set,
                    entry_ids = excluded.entry_ids,
                    fetched_at = excluded.fetched_at,
                    expires_at = excluded.expires_at
            `;
        });
    }

    async upsert(candidate: FoodCandidate): Promise<void> {
        await this.upsertMany([candidate]);
    }

    async upsertMany(candidates: FoodCandidate[]): Promise<void> {
        if (!this.config.writesEnabled || candidates.length === 0) return;
        for (const candidate of candidates) validateCatalogCandidate(candidate);
        const now = new Date();
        const payload = candidates.map((candidate) =>
            catalogPayload(candidate, this.config, now),
        );
        await withServiceDatabase(async (tx) => {
            await tx`
                insert into munch.food_catalog_entries (
                    provider, provider_food_id, barcode, name, normalized_name,
                    brand, normalized_brand, data_kind, portions,
                    nutrients_per_100g, declared_serving_nutrition, nutrient_payload,
                    source_snapshot, source_url, source_license, provider_revision,
                    source_updated_at, fetched_at, last_successful_refresh_at,
                    refresh_after, confidence, content_hash
                )
                select
                    row.provider,
                    row.provider_food_id,
                    row.barcode,
                    row.name,
                    row.normalized_name,
                    row.brand,
                    row.normalized_brand,
                    row.data_kind,
                    row.portions,
                    row.nutrients_per_100g,
                    row.declared_serving_nutrition,
                    row.nutrient_payload,
                    row.source_snapshot,
                    row.source_url,
                    row.source_license,
                    row.provider_revision,
                    nullif(row.source_updated_at, '')::timestamptz,
                    row.fetched_at::timestamptz,
                    row.last_successful_refresh_at::timestamptz,
                    row.refresh_after::timestamptz,
                    row.confidence,
                    row.content_hash
                from jsonb_to_recordset(${payload}::jsonb) as row(
                    provider text,
                    provider_food_id text,
                    barcode text,
                    name text,
                    normalized_name text,
                    brand text,
                    normalized_brand text,
                    data_kind text,
                    portions jsonb,
                    nutrients_per_100g jsonb,
                    declared_serving_nutrition jsonb,
                    nutrient_payload jsonb,
                    source_snapshot jsonb,
                    source_url text,
                    source_license text,
                    provider_revision text,
                    source_updated_at text,
                    fetched_at text,
                    last_successful_refresh_at text,
                    refresh_after text,
                    confidence double precision,
                    content_hash text
                )
                on conflict (provider, provider_food_id) do update set
                    barcode = excluded.barcode,
                    name = excluded.name,
                    normalized_name = excluded.normalized_name,
                    brand = excluded.brand,
                    normalized_brand = excluded.normalized_brand,
                    data_kind = excluded.data_kind,
                    portions = excluded.portions,
                    nutrients_per_100g = excluded.nutrients_per_100g,
                    declared_serving_nutrition = excluded.declared_serving_nutrition,
                    nutrient_payload = excluded.nutrient_payload,
                    source_snapshot = excluded.source_snapshot,
                    source_url = excluded.source_url,
                    source_license = excluded.source_license,
                    provider_revision = excluded.provider_revision,
                    source_updated_at = excluded.source_updated_at,
                    fetched_at = excluded.fetched_at,
                    last_successful_refresh_at = excluded.last_successful_refresh_at,
                    refresh_after = excluded.refresh_after,
                    confidence = excluded.confidence,
                    content_hash = excluded.content_hash,
                    deprecated_at = null
            `;
        });
    }

    async isNegative(
        operation: string,
        identity: string,
        provider: string,
    ): Promise<boolean> {
        if (!this.config.readsEnabled) return false;
        const identityHash = hashCatalogIdentity(identity);
        return withServiceDatabase(async (tx) => {
            const rows = await tx<Array<{ found: boolean }>>`
                select true as found
                from munch.food_catalog_negative_cache
                where operation = ${operation}
                  and identity_hash = ${identityHash}
                  and provider = ${provider}
                  and expires_at > now()
                limit 1
            `;
            return rows.length > 0;
        });
    }

    async recordNegative(
        operation: string,
        identity: string,
        provider: string,
    ): Promise<void> {
        if (!this.config.writesEnabled) return;
        const identityHash = hashCatalogIdentity(identity);
        const expiresAt = new Date(Date.now() + this.config.negativeTtlMs);
        await withServiceDatabase(async (tx) => {
            await tx`
                insert into munch.food_catalog_negative_cache (operation, identity_hash, provider, expires_at)
                values (${operation}, ${identityHash}, ${provider}, ${expiresAt})
                on conflict (operation, identity_hash, provider) do update
                set not_found_at = now(), expires_at = excluded.expires_at
            `;
        });
    }
}
