import { fromCachedPayload, type FoodResult } from "../foods.js";
import {
    referenceFromFood,
    referenceFromUsda,
    type RecordSource,
    type ReferenceRecord,
} from "../provenance.js";
import {
    USDA_CACHE_SOURCE,
    usdaRecordFromPayload,
    usdaSourceId,
    type UsdaRecord,
} from "../usda-record.js";
import { getSupabase } from "./client.js";

// ---------- Food records (provenance) ----------

/**
 * A cached food record for provenance (src/provenance.ts), with no TTL. The
 * lookup cache (src/foods.ts) refetches a stale row; a provenance check never
 * fetches upstream, and a record past its TTL still verifies a logged value,
 * because the facts it holds do not expire with the cache. The row is
 * normalized the way the lookup normalizes it (fromCachedPayload for Open Food
 * Facts, usdaRecordFromPayload for USDA), so both read the same figures.
 *
 * Best-effort, like the lookup cache: any failure, or a row that does not
 * normalize or belongs to another id, is a miss. A miss labels the value
 * "estimate" and never fails the write.
 */
export async function getCachedFoodRecord(
    source: RecordSource,
    id: string,
): Promise<ReferenceRecord | null> {
    try {
        const { data, error } = await getSupabase()
            .from("food_cache")
            .select("payload, fetched_at")
            .eq("source", source)
            .eq("source_id", id)
            .maybeSingle();
        if (error || !data) return null;
        const fetchedAt =
            typeof data.fetched_at === "string" ? data.fetched_at : null;
        if (source === "openfoodfacts") {
            const cached = fromCachedPayload(data.payload as FoodResult);
            return cached
                ? referenceFromFood(cached.food, id, fetchedAt)
                : null;
        }
        const record = usdaRecordFromPayload(data.payload);
        if (!record || String(record.fdc_id) !== id) return null;
        return referenceFromUsda(record, fetchedAt);
    } catch {
        return null;
    }
}

/**
 * The USDA cache row for one FoodData Central id, with its fetch time in epoch
 * ms, for the lookup in src/usda.ts (which applies the 30-day TTL itself). Best
 * effort: any failure, or a row that is not a valid record for this id, is a
 * miss, so the caller fetches upstream or reports the record unavailable.
 */
export async function readUsdaFoodCache(
    fdcId: number,
): Promise<{ record: UsdaRecord; fetchedAt: number } | null> {
    try {
        const { data, error } = await getSupabase()
            .from("food_cache")
            .select("payload, fetched_at")
            .eq("source", USDA_CACHE_SOURCE)
            .eq("source_id", usdaSourceId(fdcId))
            .maybeSingle();
        if (error || !data) return null;
        const record = usdaRecordFromPayload(data.payload);
        if (!record || record.fdc_id !== fdcId) return null;
        const fetchedAt = Date.parse(String(data.fetched_at));
        if (!Number.isFinite(fetchedAt)) return null;
        return { record, fetchedAt };
    } catch {
        return null;
    }
}

/**
 * Writes one normalized USDA record to food_cache (src/usda-record.ts), keyed
 * by its FoodData Central id. Best effort, like putCachedFood: a failed write
 * only means the next call fetches again, so it never fails the tool.
 */
export async function writeUsdaFoodCache(
    record: UsdaRecord,
    fetchedAt: number,
): Promise<void> {
    try {
        await getSupabase()
            .from("food_cache")
            .upsert(
                {
                    source: USDA_CACHE_SOURCE,
                    source_id: usdaSourceId(record.fdc_id),
                    payload: record,
                    fetched_at: new Date(fetchedAt).toISOString(),
                },
                { onConflict: "source,source_id" },
            );
    } catch {
        // best-effort; ignore
    }
}
