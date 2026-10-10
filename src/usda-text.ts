import type { MealNutrientKey } from "./meal-items.js";
import type { UsdaRecord } from "./usda-record.js";
import { scaleValues, type UsdaCandidate } from "./usda.js";

// Model-facing text for search_foods and get_food_macros (src/mcp.ts). A
// nutrient the record does not carry is named as not in the record, never
// printed as 0: a zero would be a measured figure, and the meal tools would
// then store it as one.

const NUTRIENTS: ReadonlyArray<{
    key: MealNutrientKey;
    label: string;
    unit: "kcal" | "g" | "mg";
}> = [
    { key: "calories", label: "calories", unit: "kcal" },
    { key: "protein_g", label: "protein", unit: "g" },
    { key: "carbs_g", label: "carbs", unit: "g" },
    { key: "fat_g", label: "fat", unit: "g" },
    { key: "saturated_fat_g", label: "saturated fat", unit: "g" },
    { key: "trans_fat_g", label: "trans fat", unit: "g" },
    { key: "fiber_g", label: "fiber", unit: "g" },
    { key: "sugar_g", label: "sugar", unit: "g" },
    { key: "added_sugar_g", label: "added sugar", unit: "g" },
    { key: "alcohol_g", label: "alcohol", unit: "g" },
    { key: "caffeine_mg", label: "caffeine", unit: "mg" },
];

/** Three decimals at most, so a scaled 2-decimal value prints as itself and a
 * per-100 g figure such as 0.112 keeps its digits. */
function num(n: number): string {
    return String(Math.round(n * 1000) / 1000);
}

function amountOf(
    value: number | null | undefined,
    unit: "kcal" | "g" | "mg",
): string {
    return value == null ? "not in record" : `${num(value)} ${unit}`;
}

/** Search rows carry four macros only; the rest of the list is not shown. */
function candidateMacros(c: UsdaCandidate): string {
    return [
        `calories ${amountOf(c.calories, "kcal")}`,
        `protein ${amountOf(c.protein_g, "g")}`,
        `carbs ${amountOf(c.carbs_g, "g")}`,
        `fat ${amountOf(c.fat_g, "g")}`,
    ].join(" · ");
}

export function formatUsdaSearch(candidates: UsdaCandidate[]): string {
    return [
        "USDA FoodData Central generic foods, in USDA's order. Values are per 100 g.",
        ...candidates.map(
            (c) =>
                `${c.fdc_id} · ${c.description} · ${c.data_type} · ${candidateMacros(c)}`,
        ),
    ].join("\n");
}

function listOf(
    values: Partial<Record<MealNutrientKey, number | null | undefined>>,
): string {
    return NUTRIENTS.filter(({ key }) => values[key] != null)
        .map(
            ({ key, label, unit }) => `${label} ${amountOf(values[key], unit)}`,
        )
        .join(" · ");
}

function portionsOf(record: UsdaRecord): string {
    return [
        "100 g",
        ...record.portions.map((p) => `${p.label} (${num(p.grams)} g)`),
    ].join(" · ");
}

/** The record's values per 100 g, plus the same scaled to amountG when given,
 * the portions USDA lists, and the food_ref that names this record and amount. */
export function formatUsdaRecord(
    record: UsdaRecord,
    amountG: number | null,
): string {
    const per100g = record.per100g;
    const missing = NUTRIENTS.filter(({ key }) => per100g[key] == null).map(
        (n) => n.label,
    );
    const lines = [
        record.name,
        `USDA FoodData Central ${record.fdc_id} · ${record.data_type}`,
        `Per 100 g: ${listOf(per100g) || "no nutrient values in this record"}`,
    ];
    if (amountG !== null) {
        lines.push(
            `For ${num(amountG)} g: ${listOf(scaleValues(per100g as Partial<Record<MealNutrientKey, number>>, amountG)) || "no nutrient values in this record"}`,
        );
    }
    if (missing.length > 0) {
        lines.push(`Not in this record (not zero): ${missing.join(", ")}.`);
    }
    lines.push(`Portions: ${portionsOf(record)}`);
    if (amountG !== null) {
        const ref = JSON.stringify({
            source: "usda",
            id: String(record.fdc_id),
            amount_g: amountG,
        });
        lines.push(
            `food_ref: ${ref} · sent with the values above, the meal tools record values that match this record as USDA.`,
        );
    } else {
        lines.push("Scaled values and a food_ref come with amount_g.");
    }
    lines.push(
        "Source: USDA FoodData Central (fdc.nal.usda.gov), U.S. government data in the public domain.",
    );
    return lines.join("\n");
}
