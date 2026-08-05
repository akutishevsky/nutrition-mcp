// Food database lookups. Phase 1: barcode resolution via the Open Food Facts
// REST JSON API (https://world.openfoodfacts.org/api/v2/product/{barcode}.json).
//
// The model stays the parser/orchestrator; this module's only job is to return
// canonical macros for an already-identified product. Every path degrades
// gracefully — a miss or an outage returns null/throws and the caller falls
// back to LLM estimation, so the lookup is always additive, never a hard
// dependency for logging a meal.

import { cacheFood, getCachedFood as readCachedFood } from "./storage.js";
import { gramsFromDrink, formatAlcohol, type DrinkUnit } from "./alcohol.js";

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
    fiber_g: number | null;
    sugar_g: number | null; // TOTAL sugars, incl. naturally occurring
    alcohol_g: number | null; // pure ethanol; often null — see resolveAlcoholGrams
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
    // OFF's machine-parsed reading of serving_size ("33 cl" -> 330 + "ml").
    serving_quantity?: unknown;
    serving_quantity_unit?: unknown;
    nutriments?: Record<string, unknown>;
}

// The only alcohol unit Open Food Facts actually emits (see below).
const OFF_ABV_UNIT = "% vol";

// Serving volume in millilitres, or null when OFF did not parse one or parsed
// it in some other unit (grams, or an empty/garbage unit — both occur).
function servingVolumeMl(product: OFFProduct): number | null {
    const unit = String(product.serving_quantity_unit ?? "")
        .trim()
        .toLowerCase();
    if (unit !== "ml") return null;
    const ml = num(product.serving_quantity);
    if (ml == null || ml <= 0) return null;
    return ml;
}

// Open Food Facts reports alcohol as ABV — percent by VOLUME — and NOT as grams
// per serving or per 100 g the way every other nutriment is reported.
//
// Verified against the live API rather than assumed: of 164 products carrying an
// `alcohol` nutriment, 164 declared `alcohol_unit: "% vol"` and none declared
// grams. Decisively, all 164 also had
// `alcohol === alcohol_100g === alcohol_serving`. That equality is the proof: a
// genuine gram nutriment scales with the serving — the same product (1664,
// barcode 3080216052885, 250 mL serving) reports `carbohydrates_100g: 3` but
// `carbohydrates_serving: 7.5` — so a value that flatly refuses to scale with
// serving size is a dimensionless percentage, not a mass.
//
// Copying that number into `alcohol_g` would therefore be garbage: a 40% vodka
// would log "40 g of ethanol" no matter the pour, and the 250 mL 1664 above
// would log 5.5 g instead of its true ~10.8 g. So we populate `alcohol_g` only
// when we can honestly convert, which needs the serving VOLUME:
// grams = mL x ABV/100 x 0.789 (gramsFromDrink, src/alcohol.ts).
//
// All three conditions must hold; any miss yields null, never a guess:
//   1. the declared unit really is "% vol" — an unrecognized unit means OFF
//      changed something, and null beats a misread number;
//   2. OFF parsed a serving quantity AND it is in mL. Only ~1/3 of alcoholic
//      products have one; most carry no serving quantity at all;
//   3. we resolved on the per-serving basis. On the per-100 g fallback basis
//      every other field is per 100 GRAMS while ABV is per unit VOLUME, so
//      converting would need the beverage's density — which OFF does not
//      publish. Mixing two bases inside one FoodResult is worse than a null.
//
// Net effect: a real number for products that declare a millilitre serving, and
// null (rendered "n/a", so the caller can fall back to estimation) for the rest.
// A null is correct; a wrong number is not.
function resolveAlcoholGrams(
    product: OFFProduct,
    n: Record<string, unknown>,
    hasServing: boolean,
): number | null {
    if (!hasServing) return null;

    const unit =
        typeof n["alcohol_unit"] === "string"
            ? n["alcohol_unit"].trim().toLowerCase()
            : null;
    if (unit !== OFF_ABV_UNIT) return null;

    // All three keys carry the same ABV; prefer the most specific that is set.
    const abv = num(n["alcohol_serving"] ?? n["alcohol_100g"] ?? n["alcohol"]);
    // Bounds-check before calling gramsFromDrink, which throws on nonsense — a
    // corrupt community-edited value must degrade to null, not blow up a lookup.
    if (abv == null || abv < 0 || abv > 100) return null;

    const ml = servingVolumeMl(product);
    if (ml == null) return null;

    return num(gramsFromDrink(ml, abv));
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
        // OFF spells it "fiber" (American) — no "fibre_*" key exists; confirmed
        // across 100 products, where only fiber_100g / fiber_serving appear.
        fiber_g: pick("fiber_serving", "fiber_100g"),
        // "sugars", plural. This is TOTAL sugars including naturally occurring
        // sugar from fruit and milk. OFF also carries a separate
        // `added-sugars_*`; we deliberately do not read it — the canonical
        // stored field is total sugar.
        sugar_g: pick("sugars_serving", "sugars_100g"),
        alcohol_g: resolveAlcoholGrams(product, n, hasServing),
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
    //
    // Deliberately still keyed on the four core macros only, not on the newer
    // fiber/sugar/alcohol fields. A product with sugar but no calories, protein,
    // carbs or fat is a broken record, not a usable hit, and returning it would
    // suppress exactly the estimation fallback this check exists to preserve.
    // (Adding alcohol_g here would be a no-op regardless: it is only ever
    // non-null on the per-serving basis, which requires energy-kcal_serving,
    // which makes calories non-null.)
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
// All cache access is best-effort: any failure (missing table, no Railway PostgreSQL
// config, transient error) is swallowed and treated as a miss so a cache
// problem can never break a lookup.

async function getCachedFood(
    source: string,
    sourceId: string,
    _ttlMs: number,
): Promise<FoodResult | null> {
    try {
        const payload = await readCachedFood<FoodResult>(source, sourceId);
        if (!payload) return null;
        return {
            ...payload,
            fiber_g: payload.fiber_g ?? null,
            sugar_g: payload.sugar_g ?? null,
            alcohol_g: payload.alcohol_g ?? null,
        };
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
        await cacheFood(source, sourceId, payload);
    } catch {
        // Best-effort cache writes never block a food lookup.
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

/**
 * Render a lookup for the model. `alcoholUnit` is the user's drink unit, or null
 * when alcohol tracking is off for them — in which case the alcohol line is
 * omitted entirely, matching every other display path. The value is still
 * returned in the FoodResult and still stored if the meal is logged; only the
 * rendering is gated.
 *
 * Fiber and sugar are never gated, and are shown even when null ("n/a"): a food
 * with no fiber figure in Open Food Facts is a fact worth stating, since the
 * alternative is the model quietly assuming zero.
 */
export function formatFoodResult(
    food: FoodResult,
    alcoholUnit: DrinkUnit | null = null,
): string {
    const title = food.brand ? `${food.name} (${food.brand})` : food.name;
    const lines = [
        title,
        `Serving: ${food.serving ?? "n/a"}`,
        `Calories: ${macro(food.calories, "kcal")} · Protein: ${macro(
            food.protein_g,
            "g",
        )} · Carbs: ${macro(food.carbs_g, "g")} · Fat: ${macro(
            food.fat_g,
            "g",
        )}`,
        `Fiber: ${macro(food.fiber_g, "g")} · Sugar (total): ${macro(
            food.sugar_g,
            "g",
        )}`,
    ];
    if (alcoholUnit && food.alcohol_g != null) {
        lines.push(`Alcohol: ${formatAlcohol(food.alcohol_g, alcoholUnit)}`);
    }
    lines.push(`Source: Open Food Facts (barcode ${food.barcode})`);
    return lines.join("\n");
}
