// Food database lookups. Phase 1: barcode resolution via the Open Food Facts
// REST JSON API (https://world.openfoodfacts.org/api/v2/product/{barcode}.json).
//
// The model stays the parser/orchestrator; this module's only job is to return
// canonical macros for an already-identified product. Every path degrades
// gracefully — a miss or an outage returns null/throws and the caller falls
// back to LLM estimation, so the lookup is always additive, never a hard
// dependency for logging a meal.

import { getSupabase } from "./supabase.js";

const OFF_PRODUCT_URL = "https://world.openfoodfacts.org/api/v2/product";
const REQUEST_TIMEOUT_MS = 8_000;

const SOURCE_OFF = "openfoodfacts" as const;
// Open Food Facts is community-edited and changes often; refresh weekly.
const OFF_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Open Food Facts requires a custom User-Agent in the form
// `AppName (ContactEmail)` so they can reach the operator about traffic. It is
// configuration, not a constant: every deployment (including self-hosters) must
// set OFF_USER_AGENT to its own app + contact.
function offUserAgent(): string {
    const ua = process.env.OFF_USER_AGENT;
    if (!ua) {
        throw new Error(
            "OFF_USER_AGENT is not configured — Open Food Facts requires a " +
                "User-Agent like 'nutrition-mcp (you@example.com)'",
        );
    }
    return ua;
}

export interface FoodResult {
    name: string;
    brand: string | null;
    serving: string | null; // human label for the basis of the macros below
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    source: string; // stable id, e.g. "off:737628064502"
    source_name: typeof SOURCE_OFF;
    barcode: string;
}

// Strip everything but digits and validate length. Real barcodes (EAN-8/13,
// UPC-A/E, GTIN-14) are 8–14 digits. Returns the cleaned digits or null.
export function normalizeBarcode(raw: string): string | null {
    const digits = (raw ?? "").replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 14) return null;
    return digits;
}

// Coerce an Open Food Facts nutriment to a finite number rounded to one
// decimal, or null when absent/unparseable.
function num(value: unknown): number | null {
    const n = typeof value === "string" ? parseFloat(value) : (value as number);
    if (typeof n !== "number" || !Number.isFinite(n)) return null;
    return Math.round(n * 10) / 10;
}

interface OFFProduct {
    product_name?: string;
    brands?: string;
    serving_size?: string;
    nutriments?: Record<string, unknown>;
}

// Normalize an OFF product into our shape. Prefer per-serving values when the
// product declares a serving size and a per-serving energy; otherwise fall back
// to the always-present per-100g basis and label it as such.
function normalizeOFFProduct(product: OFFProduct, barcode: string): FoodResult {
    const n = product.nutriments ?? {};
    const hasServing =
        !!product.serving_size && n["energy-kcal_serving"] != null;
    const pick = (servingKey: string, hundredKey: string) =>
        hasServing ? num(n[servingKey]) : num(n[hundredKey]);

    return {
        name: product.product_name?.trim() || `Product ${barcode}`,
        brand: product.brands?.split(",")[0]?.trim() || null,
        serving: hasServing ? product.serving_size!.trim() : "100 g",
        calories: pick("energy-kcal_serving", "energy-kcal_100g"),
        protein_g: pick("proteins_serving", "proteins_100g"),
        carbs_g: pick("carbohydrates_serving", "carbohydrates_100g"),
        fat_g: pick("fat_serving", "fat_100g"),
        source: `off:${barcode}`,
        source_name: SOURCE_OFF,
        barcode,
    };
}

// Pure HTTP fetch + normalize, no caching. Returns null when the product is not
// in Open Food Facts; throws on network failure or an unexpected HTTP status so
// the caller can distinguish "not found" from "couldn't reach the service".
export async function fetchProductFromOFF(
    barcode: string,
): Promise<FoodResult | null> {
    const url = `${OFF_PRODUCT_URL}/${barcode}.json`;
    const res = await fetch(url, {
        headers: { "User-Agent": offUserAgent(), Accept: "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (res.status === 404) return null;
    if (!res.ok) {
        throw new Error(`Open Food Facts request failed: ${res.status}`);
    }

    const body = (await res.json()) as {
        status?: number;
        product?: OFFProduct;
    };
    if (!body || body.status === 0 || !body.product) return null;

    const food = normalizeOFFProduct(body.product, barcode);
    // Open Food Facts is full of "stub" products: an entry exists (status 1,
    // sometimes even a name) but carries no nutriments at all. That is a miss
    // for our purposes — returning it would report the product as "found" with
    // every macro n/a (suppressing the caller's estimation fallback) and pin a
    // useless record in the cache for the full TTL. Treat it as not found.
    if (
        food.calories == null &&
        food.protein_g == null &&
        food.carbs_g == null &&
        food.fat_g == null
    ) {
        return null;
    }
    return food;
}

// ---------- Cache ----------
// All cache access is best-effort: any failure (missing table, no Supabase
// config, transient error) is swallowed and treated as a miss so a cache
// problem can never break a lookup.

async function getCachedFood(
    source: string,
    sourceId: string,
    ttlMs: number,
): Promise<FoodResult | null> {
    try {
        const { data, error } = await getSupabase()
            .from("food_cache")
            .select("payload, fetched_at")
            .eq("source", source)
            .eq("source_id", sourceId)
            .maybeSingle();
        if (error || !data) return null;
        const ageMs = Date.now() - new Date(data.fetched_at).getTime();
        if (ageMs > ttlMs) return null;
        return data.payload as FoodResult;
    } catch {
        return null;
    }
}

async function putCachedFood(
    source: string,
    sourceId: string,
    payload: FoodResult,
): Promise<void> {
    try {
        await getSupabase().from("food_cache").upsert(
            {
                source,
                source_id: sourceId,
                payload,
                fetched_at: new Date().toISOString(),
            },
            { onConflict: "source,source_id" },
        );
    } catch {
        // best-effort; ignore
    }
}

// Cache-first barcode lookup. `barcode` must already be normalized
// (see normalizeBarcode). Returns null when the product is unknown; throws only
// when Open Food Facts itself is unreachable.
export async function lookupBarcode(
    barcode: string,
): Promise<FoodResult | null> {
    const cached = await getCachedFood(SOURCE_OFF, barcode, OFF_TTL_MS);
    if (cached) return cached;

    const food = await fetchProductFromOFF(barcode);
    if (food) await putCachedFood(SOURCE_OFF, barcode, food);
    return food;
}

// ---------- Formatting ----------

function macro(value: number | null, unit: string): string {
    return value == null ? "n/a" : `${value} ${unit}`;
}

export function formatFoodResult(food: FoodResult): string {
    const title = food.brand ? `${food.name} (${food.brand})` : food.name;
    return [
        title,
        `Serving: ${food.serving ?? "n/a"}`,
        `Calories: ${macro(food.calories, "kcal")} · Protein: ${macro(
            food.protein_g,
            "g",
        )} · Carbs: ${macro(food.carbs_g, "g")} · Fat: ${macro(
            food.fat_g,
            "g",
        )}`,
        `Source: Open Food Facts (barcode ${food.barcode})`,
    ].join("\n");
}
