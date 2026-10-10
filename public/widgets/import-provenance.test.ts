// The provenance columns of this server's own export through the import
// widget and into the importer: the widget passes them through only when the
// file carries the provenance_version marker, and the importer keeps the labels
// only then. Same evaluation technique as import-saturated.test.ts.
import { test, expect } from "bun:test";
import type { MealInput, MealInsertResult, Meal } from "../../src/supabase";
import { runImport, type ImportDeps } from "../../src/import";
import { buildMealsCsv } from "../../src/export";
import { parseCsv } from "../../src/csv";
import type { ReferenceRecord } from "../../src/provenance";

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

const CROISSANT: ReferenceRecord = {
    source: "usda",
    id: "171477",
    name: "Croissant, plain",
    data_type: "SR Legacy",
    basis: "per_100g",
    values: { calories: 400, protein_g: 8, carbs_g: 50, fat_g: 20 },
    added_sugar_estimated: false,
    fetched_at: "2026-09-01T00:00:00.000Z",
};

function exportedMeal(over: Partial<Meal> = {}): Meal {
    return {
        id: "11111111-1111-4111-8111-111111111111",
        user_id: "user-1",
        logged_at: "2026-06-20T14:30:00.000Z",
        meal_type: "breakfast",
        description: "Croissant",
        calories: 600,
        protein_g: 12,
        carbs_g: 75,
        fat_g: 30,
        saturated_fat_g: null,
        trans_fat_g: null,
        fiber_g: null,
        sugar_g: null,
        added_sugar_g: null,
        alcohol_g: null,
        caffeine_mg: null,
        notes: null,
        idempotency_key: null,
        saved_meal_id: null,
        nutrient_sources: {
            calories: { s: "usda", ref: "171477" },
            protein_g: { s: "usda", ref: "171477" },
            carbs_g: { s: "estimate" },
            fat_g: { s: "user" },
        },
        source_detail: {
            "usda:171477": {
                name: "=Croissant, plain",
                data_type: "SR Legacy",
                amount_g: 150,
                fetched_at: "2026-09-01T00:00:00.000Z",
            },
        },
        ...over,
    } as unknown as Meal;
}

async function importCsv(
    csv: string,
    inserted: MealInput[],
    record: ReferenceRecord | null,
) {
    const w = await freshImportWidget();
    w.S.table = parseCsv(csv);
    w.autoMap();
    w.S.dateFormat = "iso";
    w.S.energyUnit = "kcal";
    w.buildRows();
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
        async foodRecord(source, id) {
            return record && source === record.source && id === record.id
                ? record
                : null;
        },
    };
    return runImport(
        {
            meals: w.S.rows,
            expected_row_count: w.S.rows.length,
        } as unknown as Parameters<typeof runImport>[0],
        deps,
    );
}

test("the widget passes the provenance columns through when the marker is present", async () => {
    const w = await freshImportWidget();
    w.S.table = parseCsv(buildMealsCsv([exportedMeal()], "UTC"));
    w.autoMap();
    w.S.dateFormat = "iso";
    w.S.energyUnit = "kcal";
    w.buildRows();
    const row = w.S.rows[0]!;
    expect(row.provenance_version).toBe("1");
    expect(JSON.parse(row.nutrient_sources as string)).toEqual({
        calories: { s: "usda", ref: "171477" },
        protein_g: { s: "usda", ref: "171477" },
        carbs_g: { s: "estimate" },
        fat_g: { s: "user" },
    });
    expect(
        JSON.parse(row.source_detail as string)["usda:171477"].amount_g,
    ).toBe(150);
});

test("a third-party file sends none of the provenance fields", async () => {
    const w = await freshImportWidget();
    w.S.table = parseCsv(
        "Day,Food Name,Energy (kcal),Fat (g)\n2026-01-15,Croissant,250,14\n",
    );
    w.autoMap();
    w.S.dateFormat = "iso";
    w.S.energyUnit = "kcal";
    w.buildRows();
    const row = w.S.rows[0]!;
    expect("provenance_version" in row).toBe(false);
    expect("nutrient_sources" in row).toBe(false);
    expect("source_detail" in row).toBe(false);
});

test("our own export round-trips: a verified usda label is kept and the file's name is defused", async () => {
    const inserted: MealInput[] = [];
    const result = await importCsv(
        buildMealsCsv([exportedMeal()], "UTC"),
        inserted,
        CROISSANT,
    );
    expect(result.summary.created).toBe(1);
    expect(inserted[0]!.nutrient_sources).toEqual({
        calories: { s: "usda", ref: "171477" },
        protein_g: { s: "usda", ref: "171477" },
        carbs_g: { s: "estimate" },
        fat_g: { s: "user" },
    });
    // The export defused the name for a spreadsheet (the apostrophe); a
    // re-verified tag takes the record's own name instead.
    expect(inserted[0]!.source_detail!["usda:171477"]!.name).toBe(
        CROISSANT.name,
    );
    expect(inserted[0]!.source_detail!["usda:171477"]!.amount_g).toBe(150);
});

test("a round-trip label whose record has changed since the export is downgraded", async () => {
    const inserted: MealInput[] = [];
    const changed: ReferenceRecord = {
        ...CROISSANT,
        values: { ...CROISSANT.values, calories: 300 },
    };
    const result = await importCsv(
        buildMealsCsv([exportedMeal()], "UTC"),
        inserted,
        changed,
    );
    expect(result.summary.created).toBe(1);
    expect(inserted[0]!.nutrient_sources!.calories).toEqual({ s: "estimate" });
    expect(inserted[0]!.nutrient_sources!.protein_g).toEqual({
        s: "usda",
        ref: "171477",
    });
});

test("a round trip with no cached record keeps user labels and estimates every record label", async () => {
    const inserted: MealInput[] = [];
    await importCsv(buildMealsCsv([exportedMeal()], "UTC"), inserted, null);
    expect(inserted[0]!.nutrient_sources).toEqual({
        calories: { s: "estimate" },
        protein_g: { s: "estimate" },
        carbs_g: { s: "estimate" },
        fat_g: { s: "user" },
    });
});

test("a legacy meal with no provenance round-trips with no labels at all", async () => {
    const inserted: MealInput[] = [];
    await importCsv(
        buildMealsCsv(
            [exportedMeal({ nutrient_sources: null, source_detail: null })],
            "UTC",
        ),
        inserted,
        CROISSANT,
    );
    // An empty cell is never sent, so the importer has nothing to label and
    // the write records no provenance (insertMeal stores null).
    expect(inserted[0]!.nutrient_sources).toBeUndefined();
    expect(inserted[0]!.source_detail).toBeUndefined();
});
