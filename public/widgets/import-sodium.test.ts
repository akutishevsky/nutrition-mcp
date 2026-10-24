// The import widget's mapping of sodium — the header aliases for Cronometer,
// MyFitnessPal and this app's own export — and the round trip from meals.csv
// through the widget into the importer. Modelled on import-saturated.test.ts. Same evaluation
// technique as import-time.test.ts: the assembled widget script is run with
// only the `initWidget({…})` bootstrap cut off.
import { test, expect } from "bun:test";
import type { MealInput, MealInsertResult, Meal } from "../../src/supabase";
import { runImport, type ImportDeps } from "../../src/import";
import { buildMealsCsv } from "../../src/export";
import { parseCsv } from "../../src/csv";

async function freshImportWidget() {
    const { getWidgetHtml } = await import("../../src/widgets");
    const html = await getWidgetHtml("import-meals");
    const script = html.slice(
        html.lastIndexOf("<script>") + "<script>".length,
        html.lastIndexOf("</script>"),
    );
    const boot = script.indexOf("initWidget({");
    if (boot === -1) throw new Error("import-meals bootstrap not found");
    const factory = new Function(
        `${script.slice(0, boot)}
         return { S, buildRows, autoMap };`,
    );
    return factory() as {
        S: {
            table: unknown;
            mapping: Record<string, number>;
            dateFormat: string;
            energyUnit: string;
            rows: Record<string, unknown>[];
        };
        buildRows: () => void;
        autoMap: () => void;
    };
}

function tableFrom(headers: string[], rows: string[][]) {
    return {
        headers,
        rows,
        sourceLines: rows.map((_, i) => i + 2),
        encoding: "utf-8",
        delimiter: ",",
        decimalSeparator: ".",
        warnings: [],
        skippedTotalsRows: 0,
        skippedBlankRows: 0,
    };
}

test("Cronometer's Sodium (mg) maps to sodium_mg", async () => {
    const w = await freshImportWidget();
    w.S.table = tableFrom(
        ["Day", "Food Name", "Energy (kcal)", "Sodium (mg)", "Salt (g)"],
        [["2026-01-15", "Ramen", "520", "1820.5", "4.6"]],
    );
    w.autoMap();
    expect(w.S.mapping.sodium_mg).toBe(3);
    w.S.dateFormat = "iso";
    w.S.energyUnit = "kcal";
    w.buildRows();
    // Milligrams straight across: no conversion.
    expect(w.S.rows[0]!.sodium_mg).toBe(1820.5);
});

test("MyFitnessPal's bare Sodium (milligrams) maps to sodium_mg", async () => {
    const w = await freshImportWidget();
    w.S.table = tableFrom(
        ["Date", "Meal", "Food Name", "Calories", "Sodium"],
        [["2026-01-15", "Lunch", "Soup", "180", "890"]],
    );
    w.autoMap();
    expect(w.S.mapping.sodium_mg).toBe(4);
});

test("a salt column or a grams-headed sodium column is never mapped to sodium_mg", async () => {
    const w = await freshImportWidget();
    w.S.table = tableFrom(
        ["Day", "Food Name", "Salt (g)", "Sodium (g)"],
        [["2026-01-15", "Crisps", "1.2", "0.48"]],
    );
    w.autoMap();
    expect(w.S.mapping.sodium_mg).toBe(-1);
});

test("a file without the column maps it to -1 and builds rows without it", async () => {
    const w = await freshImportWidget();
    w.S.table = tableFrom(
        ["Day", "Food Name", "Energy (kcal)"],
        [["2026-01-15", "Oatmeal", "300"]],
    );
    w.autoMap();
    expect(w.S.mapping.sodium_mg).toBe(-1);
    w.S.dateFormat = "iso";
    w.S.energyUnit = "kcal";
    w.buildRows();
    // Undefined, not null or 0: JSON drops it, so the server never sees a value.
    expect(w.S.rows[0]!.sodium_mg).toBeUndefined();
});

test("meals.csv round-trips through the widget and importer with sodium kept", async () => {
    const meal = {
        id: "11111111-1111-4111-8111-111111111111",
        user_id: "user-1",
        logged_at: "2026-06-20T14:30:00.000Z",
        meal_type: "lunch",
        description: "Miso soup",
        calories: 80,
        protein_g: 6,
        carbs_g: 8,
        fat_g: 3,
        fiber_g: 1,
        sugar_g: 2,
        added_sugar_g: 0,
        alcohol_g: null,
        caffeine_mg: null,
        sodium_mg: 980,
        notes: null,
        idempotency_key: null,
        saved_meal_id: null,
    } as unknown as Meal;
    const csv = buildMealsCsv([meal], "UTC");

    const w = await freshImportWidget();
    w.S.table = parseCsv(csv);
    w.autoMap();
    w.S.dateFormat = "iso";
    w.S.energyUnit = "kcal";
    w.buildRows();
    expect(w.S.rows).toHaveLength(1);
    expect(w.S.rows[0]!.sodium_mg).toBe(980);

    const inserted: MealInput[] = [];
    const deps: ImportDeps = {
        userId: "user-1",
        tz: "UTC",
        tzConfigured: true,
        nowMs: Date.parse("2026-07-25T12:00:00Z"),
        async insert(input: MealInput): Promise<MealInsertResult> {
            inserted.push({ ...input });
            return { meal: { id: "x" } as Meal, deduplicated: false };
        },
        async existingKeys() {
            return new Set();
        },
        async existingMealIds() {
            return new Set();
        },
    };
    const result = await runImport(
        {
            meals: w.S.rows,
            expected_row_count: 1,
        } as unknown as Parameters<typeof runImport>[0],
        deps,
    );
    expect(result.summary.created).toBe(1);
    expect(inserted[0]!.sodium_mg).toBe(980);
});
