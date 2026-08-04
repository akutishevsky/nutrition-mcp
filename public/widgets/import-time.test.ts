// Behaviour tests for the import widget's buildRows() — issue #64: a raw time
// cell (a separate Time column, or a time riding along in the date cell) was
// appended to the ISO date verbatim. The server's LOCAL_DATETIME_RE only
// accepts zero-padded 24-hour HH:MM[:SS], so an unpadded 24-hour time
// ("9:15") or a 12-hour time ("9:15 AM" — Cronometer's own Time column shape)
// matched none of the accepted forms and every such row was rejected. The fix
// runs the raw cell through normalizeTime (src/csv.ts) before appending it.
//
// This also covers the "bonus symptom" from the issue: the preview's
// no-time check (/\d\d:\d\d/) missed unpadded times like "9:15" and
// mislabeled those rows "will be logged at midday" even though they had a
// real time — fixed for free once logged_at always carries a zero-padded
// time when one was present.
//
// Same evaluation technique as macros.test.ts and import-run.test.ts: the
// real assembled widget script is run as one script with only the
// `initWidget({…})` bootstrap cut off.
import { test, expect } from "bun:test";

interface ImportRow {
    source_line: number;
    logged_at: string;
    description: string | undefined;
    meal_type: string | undefined;
    calories: number | undefined;
    carbs_g: number | undefined;
    fat_g: number | undefined;
}

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
         return { S, buildRows };`,
    );
    return factory() as {
        S: {
            table: unknown;
            mapping: Record<string, number>;
            dateFormat: string;
            energyUnit: string;
            rows: ImportRow[];
            badDates: number;
            skipped: number;
        };
        buildRows: () => void;
    };
}

// A Cronometer-shaped table: Day/Time split, 12-hour Time column — the exact
// shape modeled by the fixture in src/csv.test.ts that motivated the issue.
function cronometerTable() {
    return {
        headers: [
            "Day",
            "Time",
            "Group",
            "Food Name",
            "Amount",
            "Energy (kcal)",
            "Carbs (g)",
            "Fat (g)",
        ],
        rows: [
            [
                "2026-01-15",
                "9:15 AM",
                "Breakfast",
                "Oats, rolled",
                "58.00 g",
                "220",
                "37.5",
                "4.1",
            ],
            [
                "2026-01-15",
                "1:00 PM",
                "Lunch",
                "Chicken breast, roasted",
                "120.00 g",
                "198",
                "0",
                "4.3",
            ],
        ],
        sourceLines: [2, 3],
        encoding: "utf-8",
        delimiter: ",",
        decimalSeparator: ".",
        warnings: [],
        skippedTotalsRows: 0,
        skippedBlankRows: 0,
    };
}

function cronometerMapping() {
    return {
        deleted: -1,
        logged_at: 0,
        time: 1,
        meal_type: 2,
        description: 3,
        calories: 5,
        protein_g: -1,
        carbs_g: 6,
        fat_g: 7,
        fiber_g: -1,
        sugar_g: -1,
        alcohol_g: -1,
        notes: -1,
    };
}

test("a 12-hour Time column (Cronometer) produces a zero-padded 24-hour logged_at", async () => {
    const w = await freshImportWidget();
    w.S.table = cronometerTable();
    w.S.mapping = cronometerMapping();
    w.S.dateFormat = "iso";
    w.S.energyUnit = "kcal";

    w.buildRows();

    expect(w.S.rows).toHaveLength(2);
    // 9:15 AM -> 09:15, not the raw "2026-01-15 9:15 AM" the server rejects.
    expect(w.S.rows[0]!.logged_at).toBe("2026-01-15 09:15");
    // 1:00 PM -> 13:00.
    expect(w.S.rows[1]!.logged_at).toBe("2026-01-15 13:00");
    // Nothing was dropped as a bad date — this used to fail every row.
    expect(w.S.badDates).toBe(0);
    expect(w.S.skipped).toBe(0);
    // The "no time" check (/\d\d:\d\d/) now finds a real zero-padded time, so
    // neither row is mislabeled as timeless / logged at midday.
    for (const r of w.S.rows) {
        expect(/\d\d:\d\d/.test(r.logged_at)).toBe(true);
    }
});

test("an unpadded 24-hour Time column is zero-padded too", async () => {
    const w = await freshImportWidget();
    const table = cronometerTable();
    table.rows[0]![1] = "9:15"; // unpadded 24-hour, no AM/PM
    w.S.table = table;
    w.S.mapping = cronometerMapping();
    w.S.dateFormat = "iso";
    w.S.energyUnit = "kcal";

    w.buildRows();

    expect(w.S.rows[0]!.logged_at).toBe("2026-01-15 09:15");
    expect(w.S.badDates).toBe(0);
});

test("a time embedded in the date cell is normalized the same way", async () => {
    const w = await freshImportWidget();
    const table = cronometerTable();
    // No separate Time column: the whole timestamp rides in Day instead.
    table.headers = table.headers.filter((h) => h !== "Time");
    table.rows = table.rows.map((r) => {
        const [day, time, ...rest] = r;
        return [`${day} ${time}`, ...rest];
    });
    w.S.table = table;
    w.S.mapping = { ...cronometerMapping(), time: -1 };
    // Column indices after removing Time shift left by one.
    w.S.mapping.meal_type = 1;
    w.S.mapping.description = 2;
    w.S.mapping.calories = 4;
    w.S.mapping.carbs_g = 5;
    w.S.mapping.fat_g = 6;
    w.S.dateFormat = "iso";
    w.S.energyUnit = "kcal";

    w.buildRows();

    expect(w.S.rows[0]!.logged_at).toBe("2026-01-15 09:15");
    expect(w.S.rows[1]!.logged_at).toBe("2026-01-15 13:00");
    expect(w.S.badDates).toBe(0);
});

test("an unparseable time is dropped, not failed — the row still imports, dateless", async () => {
    const w = await freshImportWidget();
    const table = cronometerTable();
    table.rows[0]![1] = "not a time";
    w.S.table = table;
    w.S.mapping = cronometerMapping();
    w.S.dateFormat = "iso";
    w.S.energyUnit = "kcal";

    w.buildRows();

    expect(w.S.rows).toHaveLength(2);
    expect(w.S.badDates).toBe(0);
    // Bare date only — no time appended, so this row now correctly falls
    // into the "no time" preview notice instead of silently misdating.
    expect(w.S.rows[0]!.logged_at).toBe("2026-01-15");
    expect(/\d\d:\d\d/.test(w.S.rows[0]!.logged_at)).toBe(false);
});
