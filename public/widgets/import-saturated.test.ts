// The import widget's mapping of saturated and trans fat — the header aliases
// for Cronometer, MyFitnessPal and this app's own export — and the round trip
// from meals.csv through the widget into the importer. Same evaluation
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

test("Cronometer's Saturated (g) and Trans-Fats (g) map to the new fields", async () => {
    const w = await freshImportWidget();
    w.S.table = tableFrom(
        [
            "Day",
            "Food Name",
            "Energy (kcal)",
            "Fat (g)",
            "Saturated (g)",
            "Trans-Fats (g)",
        ],
        [["2026-01-15", "Croissant", "250", "14", "8.5", "0.3"]],
    );
    w.autoMap();
    expect(w.S.mapping.saturated_fat_g).toBe(4);
    expect(w.S.mapping.trans_fat_g).toBe(5);
    // Total fat still maps to fat_g alone, never to the saturated column.
    expect(w.S.mapping.fat_g).toBe(3);
});

test("MyFitnessPal's Saturated Fat and Trans Fat map to the new fields", async () => {
    const w = await freshImportWidget();
    w.S.table = tableFrom(
        ["Date", "Meal", "Food Name", "Fat", "Saturated Fat", "Trans Fat"],
        [["2026-01-15", "Breakfast", "Croissant", "14", "8.5", "0.3"]],
    );
    w.autoMap();
    expect(w.S.mapping.saturated_fat_g).toBe(4);
    expect(w.S.mapping.trans_fat_g).toBe(5);
    expect(w.S.mapping.fat_g).toBe(3);
});

test("a file without either column maps both to -1 and builds rows without them", async () => {
    const w = await freshImportWidget();
    w.S.table = tableFrom(
        ["Day", "Food Name", "Energy (kcal)"],
        [["2026-01-15", "Oatmeal", "300"]],
    );
    w.autoMap();
    expect(w.S.mapping.saturated_fat_g).toBe(-1);
    expect(w.S.mapping.trans_fat_g).toBe(-1);
    w.S.dateFormat = "iso";
    w.S.energyUnit = "kcal";
    w.buildRows();
    // Undefined, not null or 0: JSON drops it, so the server never sees a value.
    expect(w.S.rows[0]!.saturated_fat_g).toBeUndefined();
    expect(w.S.rows[0]!.trans_fat_g).toBeUndefined();
});

test("meals.csv round-trips through the widget and importer with both values kept", async () => {
    // The export's own headers are the importer's aliases, so a meals.csv
    // written by this server maps without any remapping.
    const meal = {
        id: "11111111-1111-4111-8111-111111111111",
        user_id: "user-1",
        logged_at: "2026-06-20T14:30:00.000Z",
        meal_type: "breakfast",
        description: "Croissant",
        calories: 250,
        protein_g: 4,
        carbs_g: 27,
        fat_g: 14,
        saturated_fat_g: 8.5,
        trans_fat_g: 0.3,
        fiber_g: 1,
        sugar_g: 5,
        added_sugar_g: null,
        alcohol_g: null,
        caffeine_mg: null,
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
    expect(w.S.rows[0]!.saturated_fat_g).toBe(8.5);
    expect(w.S.rows[0]!.trans_fat_g).toBe(0.3);

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
    expect(inserted[0]!.saturated_fat_g).toBe(8.5);
    expect(inserted[0]!.trans_fat_g).toBe(0.3);
});
