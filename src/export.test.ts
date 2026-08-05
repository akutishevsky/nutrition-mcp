import { test, expect } from "bun:test";
import { buildMealsCsv } from "./export.js";
import type { Meal } from "./storage.js";

function meal(overrides: Partial<Meal> = {}): Meal {
    return {
        id: "11111111-1111-1111-1111-111111111111",
        user_id: "user-1",
        logged_at: "2026-06-20T14:30:00.000Z",
        meal_type: "lunch",
        description: "Grilled chicken",
        calories: 500,
        protein_g: 40,
        carbs_g: 10,
        fat_g: 20,
        fiber_g: 7,
        sugar_g: 12,
        alcohol_g: 3,
        notes: null,
        idempotency_key: null,
        ...overrides,
    };
}

const HEADER =
    "id,logged_at,timezone,meal_type,description,calories,protein_g,carbs_g,fat_g,fiber_g,sugar_g,alcohol_g,notes";

/**
 * Minimal RFC-4180 reader: splits a CSV document into rows of fields, honouring
 * quoted fields that contain commas, newlines, and doubled quotes. Needed so the
 * alignment tests below count *fields*, not commas.
 */
function parseCsv(csv: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < csv.length; i++) {
        const ch = csv[i];
        if (inQuotes) {
            if (ch === '"') {
                if (csv[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += ch;
            }
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === ",") {
            row.push(field);
            field = "";
        } else if (ch === "\n") {
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
        } else if (ch !== "\r") {
            field += ch;
        }
    }
    row.push(field);
    rows.push(row);
    return rows;
}

/** Zip a parsed CSV's header row against one data row into a lookup by name. */
function fieldsByName(csv: string, rowIndex = 1): Record<string, string> {
    const rows = parseCsv(csv);
    const header = rows[0]!;
    const row = rows[rowIndex]!;
    // Guard the whole premise of a by-name lookup: a short or long data row
    // would otherwise silently produce undefined/dropped fields.
    expect(row.length).toBe(header.length);
    const out: Record<string, string> = {};
    header.forEach((name, i) => {
        out[name] = row[i]!;
    });
    return out;
}

test("emits a header even with no meals", () => {
    expect(buildMealsCsv([], "UTC")).toBe(HEADER);
});

test("header and data rows have identical field counts", () => {
    // Every column populated, plus a row of all-null optionals and a row whose
    // text fields need quoting — misaligning CSV_COLUMNS against the positional
    // row builder changes the data-row width and fails here.
    const csv = buildMealsCsv(
        [
            meal(),
            meal({
                calories: null,
                protein_g: null,
                carbs_g: null,
                fat_g: null,
                fiber_g: null,
                sugar_g: null,
                alcohol_g: null,
                meal_type: null,
                notes: null,
            }),
            meal({
                description: 'Salad, "the big one"',
                notes: "line1\nline2",
            }),
        ],
        "UTC",
    );
    const rows = parseCsv(csv);
    expect(rows[0]!.length).toBe(HEADER.split(",").length);
    expect(rows).toHaveLength(4);
    for (const row of rows.slice(1)) {
        expect(row.length).toBe(rows[0]!.length);
    }
});

test("every value lands under its own header name", () => {
    // Distinct values per column: a shifted field lands under the wrong name and
    // fails, even when the row width still happens to match.
    const f = fieldsByName(
        buildMealsCsv(
            [
                meal({
                    calories: 500,
                    protein_g: 40,
                    carbs_g: 10,
                    fat_g: 20,
                    fiber_g: 7,
                    sugar_g: 12,
                    alcohol_g: 3,
                    notes: "post-run",
                }),
            ],
            "UTC",
        ),
    );
    expect(f).toEqual({
        id: "11111111-1111-1111-1111-111111111111",
        logged_at: "2026-06-20 14:30:00",
        timezone: "UTC",
        meal_type: "lunch",
        description: "Grilled chicken",
        calories: "500",
        protein_g: "40",
        carbs_g: "10",
        fat_g: "20",
        fiber_g: "7",
        sugar_g: "12",
        alcohol_g: "3",
        notes: "post-run",
    });
});

test("header column order is stable and importer-compatible", () => {
    // The importer matches columns by these exact names, so an export must be
    // re-importable without remapping. Renaming a column is a breaking change.
    expect(parseCsv(buildMealsCsv([], "UTC"))[0]).toEqual([
        "id",
        "logged_at",
        "timezone",
        "meal_type",
        "description",
        "calories",
        "protein_g",
        "carbs_g",
        "fat_g",
        "fiber_g",
        "sugar_g",
        "alcohol_g",
        "notes",
    ]);
});

test("renders timestamps in UTC when tz is UTC", () => {
    const f = fieldsByName(buildMealsCsv([meal()], "UTC"));
    expect(f.logged_at).toBe("2026-06-20 14:30:00");
    expect(f.timezone).toBe("UTC");
});

test("renders timestamps in the user's timezone when set", () => {
    // 14:30 UTC is 16:30 in Berlin (CEST, summer).
    const f = fieldsByName(buildMealsCsv([meal()], "Europe/Berlin"));
    expect(f.logged_at).toBe("2026-06-20 16:30:00");
    expect(f.timezone).toBe("Europe/Berlin");
});

test("leaves null macros and notes as empty fields", () => {
    const f = fieldsByName(
        buildMealsCsv(
            [
                meal({
                    calories: null,
                    protein_g: null,
                    carbs_g: null,
                    fat_g: null,
                    fiber_g: null,
                    sugar_g: null,
                    alcohol_g: null,
                    notes: null,
                }),
            ],
            "UTC",
        ),
    );
    for (const name of [
        "calories",
        "protein_g",
        "carbs_g",
        "fat_g",
        "fiber_g",
        "sugar_g",
        "alcohol_g",
        "notes",
    ]) {
        expect(f[name]).toBe("");
    }
    // Nulls stay empty rather than emitting "null"/"undefined".
    expect(buildMealsCsv([meal({ calories: null })], "UTC")).not.toContain(
        "null",
    );
});

test("quotes and escapes fields containing commas, quotes, and newlines", () => {
    const csv = buildMealsCsv(
        [
            meal({
                description: 'Salad, "the big one"',
                notes: "line1\nline2",
            }),
        ],
        "UTC",
    );
    expect(csv).toContain('"Salad, ""the big one"""');
    expect(csv).toContain('"line1\nline2"');
    // ...and the escaping survives a round trip through a real CSV reader,
    // with the embedded newline not splitting the row.
    const f = fieldsByName(csv);
    expect(f.description).toBe('Salad, "the big one"');
    expect(f.notes).toBe("line1\nline2");
    expect(f.fiber_g).toBe("7");
});
