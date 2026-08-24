import { test, expect } from "bun:test";
import {
    buildExportReadme,
    buildGoalsCsv,
    buildMealsCsv,
    buildProfileCsv,
    buildWaterCsv,
    buildWeightCsv,
    EXPORT_ARCHIVE_FILES,
} from "./export.js";
import type {
    Meal,
    NutritionGoals,
    Profile,
    WaterEntry,
    WeightEntry,
} from "./supabase.js";
import { buildZip } from "./zip.js";

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
        caffeine_mg: 95,
        notes: null,
        idempotency_key: null,
        ...overrides,
    };
}

const HEADER =
    "id,logged_at,timezone,meal_type,description,calories,protein_g,carbs_g,fat_g,fiber_g,sugar_g,alcohol_g,caffeine_mg,notes";

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
                caffeine_mg: null,
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
                    caffeine_mg: 95,
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
        caffeine_mg: "95",
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
        // Between alcohol_g and notes, and spelled with its unit: the importer
        // matches on this exact string, and "caffeine" alone would let a grams
        // column bind to a milligram field.
        "caffeine_mg",
        "notes",
    ]);
});

test("the caffeine header is the importer's own alias, in milligrams", async () => {
    // The re-import contract, checked against the importer rather than against
    // a copy of the name: the widget auto-maps by these aliases, so a rename on
    // either side silently turns a restored backup into a caffeine-less one.
    const { findColumn, normalizeHeader } = await import("./csv.js");
    const header = parseCsv(buildMealsCsv([], "UTC"))[0]!;

    expect(header).toContain("caffeine_mg");
    expect(normalizeHeader("caffeine_mg")).toBe("caffeine_mg");
    // "Caffeine (mg)" is what real exports write; both reach the same key.
    expect(findColumn(header, ["caffeine_mg", "caffeine"])).toBe(
        header.indexOf("caffeine_mg"),
    );
    // A grams spelling must NOT match our header, or a re-import could bind a
    // milligram column to a grams alias and be wrong by 1000x.
    expect(findColumn(header, ["caffeine_g"])).toBe(-1);
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
                    caffeine_mg: null,
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
        // Every meal logged before caffeine existed carries NULL here, so this
        // is the common case, not an edge one: it must render as an empty cell,
        // never as a 0 that a re-import would read as "definitely no caffeine".
        "caffeine_mg",
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

// ---------- The rest of the archive ----------
//
// Same shape of test as the meals ones above, applied per file: the header text
// is the contract, and the header/row field counts are what catches a column
// list that has drifted out of step with its positional row builder.

function water(overrides: Partial<WaterEntry> = {}): WaterEntry {
    return {
        id: "22222222-2222-2222-2222-222222222222",
        user_id: "user-1",
        amount_ml: 500,
        logged_at: "2026-06-20T14:30:00.000Z",
        notes: null,
        created_at: "2026-06-20T14:30:05.000Z",
        idempotency_key: null,
        ...overrides,
    };
}

function weight(overrides: Partial<WeightEntry> = {}): WeightEntry {
    return {
        id: "33333333-3333-3333-3333-333333333333",
        user_id: "user-1",
        weight_g: 75000,
        logged_at: "2026-06-20T14:30:00.000Z",
        notes: null,
        created_at: "2026-06-20T14:30:05.000Z",
        idempotency_key: null,
        ...overrides,
    };
}

function goals(overrides: Partial<NutritionGoals> = {}): NutritionGoals {
    return {
        user_id: "user-1",
        daily_calories: 2200,
        daily_protein_g: 150,
        daily_carbs_g: 220,
        daily_fat_g: 70,
        daily_fiber_g: 30,
        daily_sugar_g: 40,
        daily_alcohol_g: 14,
        daily_caffeine_mg: 400,
        daily_water_ml: 2500,
        target_weight_g: 72000,
        updated_at: "2026-06-20T14:30:00.000Z",
        ...overrides,
    };
}

function profile(overrides: Partial<Profile> = {}): Profile {
    return {
        user_id: "user-1",
        timezone: "Europe/Berlin",
        preferred_weight_unit: "kg",
        widgets_enabled: true,
        alcohol_tracking_enabled: false,
        preferred_drink_unit: "us",
        locale: null,
        created_at: "2026-01-02T14:30:00.000Z",
        updated_at: "2026-06-20T14:30:00.000Z",
        ...overrides,
    };
}

const WATER_HEADER = "id,logged_at,timezone,amount_ml,notes";
const WEIGHT_HEADER =
    "id,logged_at,timezone,weight_g,weight_display,weight_unit,notes";
const GOALS_HEADER =
    "daily_calories,daily_protein_g,daily_carbs_g,daily_fat_g,daily_fiber_g,daily_sugar_g,daily_alcohol_g,daily_caffeine_mg,daily_water_ml,target_weight_g,updated_at,timezone";
const PROFILE_HEADER =
    "timezone,preferred_weight_unit,preferred_drink_unit,alcohol_tracking_enabled,widgets_enabled,created_at,updated_at";

test("water.csv header names carry the unit and the zone", () => {
    expect(parseCsv(buildWaterCsv([], "UTC"))[0]).toEqual([
        "id",
        "logged_at",
        "timezone",
        // Not "amount": the number is millilitres, and a header that does not
        // say so is how 500 ml is read back as 500 of something else.
        "amount_ml",
        "notes",
    ]);
    expect(buildWaterCsv([], "UTC")).toBe(WATER_HEADER);
});

test("water.csv header and data rows have identical field counts", () => {
    const csv = buildWaterCsv(
        [water(), water({ notes: null }), water({ notes: 'a, "b"\nc' })],
        "UTC",
    );
    const rows = parseCsv(csv);
    expect(rows[0]!.length).toBe(WATER_HEADER.split(",").length);
    expect(rows).toHaveLength(4);
    for (const row of rows.slice(1)) {
        expect(row.length).toBe(rows[0]!.length);
    }
});

test("every water value lands under its own header name", () => {
    const f = fieldsByName(
        buildWaterCsv([water({ notes: "after the run" })], "UTC"),
    );
    expect(f).toEqual({
        id: "22222222-2222-2222-2222-222222222222",
        logged_at: "2026-06-20 14:30:00",
        timezone: "UTC",
        amount_ml: "500",
        notes: "after the run",
    });
});

test("water.csv renders timestamps in the given zone, even across the date line", () => {
    // 23:30 UTC is already the next calendar day in Tokyo. A wall clock with
    // the wrong date is the failure mode that a "same time, different zone"
    // fixture cannot catch.
    const f = fieldsByName(
        buildWaterCsv(
            [water({ logged_at: "2026-06-20T23:30:00.000Z" })],
            "Asia/Tokyo",
        ),
    );
    expect(f.logged_at).toBe("2026-06-21 08:30:00");
    // The zone column must name the zone the wall clock beside it is in, or
    // the timestamp silently re-resolves against whatever zone reads it (#97).
    expect(f.timezone).toBe("Asia/Tokyo");
});

test("water.csv survives commas, quotes and newlines in notes", () => {
    const f = fieldsByName(
        buildWaterCsv(
            [water({ notes: 'glass, "the big one"\nrefilled' })],
            "UTC",
        ),
    );
    expect(f.notes).toBe('glass, "the big one"\nrefilled');
    expect(f.amount_ml).toBe("500");
});

test("weight.csv header names both the stored grams and the readable value", () => {
    expect(parseCsv(buildWeightCsv([], "UTC", "kg"))[0]).toEqual([
        "id",
        "logged_at",
        "timezone",
        "weight_g",
        "weight_display",
        "weight_unit",
        "notes",
    ]);
    expect(buildWeightCsv([], "UTC", "kg")).toBe(WEIGHT_HEADER);
});

test("weight.csv header and data rows have identical field counts", () => {
    const csv = buildWeightCsv(
        [weight(), weight({ notes: null }), weight({ notes: 'a, "b"\nc' })],
        "UTC",
        "lb",
    );
    const rows = parseCsv(csv);
    expect(rows[0]!.length).toBe(WEIGHT_HEADER.split(",").length);
    expect(rows).toHaveLength(4);
    for (const row of rows.slice(1)) {
        expect(row.length).toBe(rows[0]!.length);
    }
});

test("weight_display converts the stored grams and weight_unit agrees", () => {
    const kg = fieldsByName(buildWeightCsv([weight()], "UTC", "kg"));
    expect(kg.weight_g).toBe("75000");
    expect(kg.weight_display).toBe("75");
    expect(kg.weight_unit).toBe("kg");

    // Same stored row, other preference: 75000 g is 165.3 lb. The grams column
    // is unchanged — the display column is derived, never the other way round.
    const lb = fieldsByName(buildWeightCsv([weight()], "UTC", "lb"));
    expect(lb.weight_g).toBe("75000");
    expect(lb.weight_display).toBe("165.3");
    expect(lb.weight_unit).toBe("lb");
});

test("every weight value lands under its own header name", () => {
    const f = fieldsByName(
        buildWeightCsv(
            [
                weight({
                    logged_at: "2026-06-20T23:30:00.000Z",
                    notes: "before breakfast",
                }),
            ],
            "Asia/Tokyo",
            "kg",
        ),
    );
    expect(f).toEqual({
        id: "33333333-3333-3333-3333-333333333333",
        logged_at: "2026-06-21 08:30:00",
        timezone: "Asia/Tokyo",
        weight_g: "75000",
        weight_display: "75",
        weight_unit: "kg",
        notes: "before breakfast",
    });
});

test("weight.csv survives commas, quotes and newlines in notes", () => {
    const f = fieldsByName(
        buildWeightCsv(
            [weight({ notes: 'fasted, "post-run"\nscale 2' })],
            "UTC",
            "kg",
        ),
    );
    expect(f.notes).toBe('fasted, "post-run"\nscale 2');
    expect(f.weight_display).toBe("75");
});

test("goals.csv is header-only when the account has never set goals", () => {
    // Header-only, not absent and not empty: the archive always has the same
    // six files with the same headers, so a reader never has to discover which
    // files this particular export happened to include.
    expect(buildGoalsCsv(null, "UTC")).toBe(GOALS_HEADER);
});

test("goals.csv header and its single row have identical field counts", () => {
    const rows = parseCsv(buildGoalsCsv(goals(), "UTC"));
    expect(rows[0]!.length).toBe(GOALS_HEADER.split(",").length);
    expect(rows).toHaveLength(2);
    expect(rows[1]!.length).toBe(rows[0]!.length);
});

test("every goal value lands under its own header name", () => {
    const f = fieldsByName(buildGoalsCsv(goals(), "Europe/Berlin"));
    expect(f).toEqual({
        daily_calories: "2200",
        daily_protein_g: "150",
        daily_carbs_g: "220",
        daily_fat_g: "70",
        daily_fiber_g: "30",
        daily_sugar_g: "40",
        daily_alcohol_g: "14",
        // Milligrams next to nine gram/ml columns, spelled so in the header.
        daily_caffeine_mg: "400",
        daily_water_ml: "2500",
        target_weight_g: "72000",
        updated_at: "2026-06-20 16:30:00",
        timezone: "Europe/Berlin",
    });
});

test("goals.csv exports the alcohol target regardless of the display opt-in", () => {
    // The builder takes no preference at all, and that is the point: the
    // alcohol opt-in governs what the tools *show*, while the export promises
    // everything that was logged. A gate here would look like a bug fix and be
    // a data loss.
    const f = fieldsByName(
        buildGoalsCsv(goals({ daily_alcohol_g: 14 }), "UTC"),
    );
    expect(f.daily_alcohol_g).toBe("14");
});

test("goals.csv leaves unset targets as empty fields", () => {
    const csv = buildGoalsCsv(
        goals({
            daily_calories: null,
            daily_protein_g: null,
            daily_carbs_g: null,
            daily_fat_g: null,
            daily_fiber_g: null,
            daily_sugar_g: null,
            daily_alcohol_g: null,
            daily_caffeine_mg: null,
            daily_water_ml: null,
            target_weight_g: null,
        }),
        "UTC",
    );
    const f = fieldsByName(csv);
    for (const name of GOALS_HEADER.split(",")) {
        if (name === "updated_at" || name === "timezone") continue;
        expect(f[name]).toBe("");
    }
    expect(csv).not.toContain("null");
});

test("profile.csv is header-only when there is no profile row", () => {
    expect(buildProfileCsv(null, "UTC")).toBe(PROFILE_HEADER);
});

test("profile.csv header and its single row have identical field counts", () => {
    const rows = parseCsv(buildProfileCsv(profile(), "UTC"));
    expect(rows[0]!.length).toBe(PROFILE_HEADER.split(",").length);
    expect(rows).toHaveLength(2);
    expect(rows[1]!.length).toBe(rows[0]!.length);
});

test("every profile value lands under its own header name", () => {
    const f = fieldsByName(buildProfileCsv(profile(), "Europe/Berlin"));
    expect(f).toEqual({
        timezone: "Europe/Berlin",
        preferred_weight_unit: "kg",
        preferred_drink_unit: "us",
        // A toggle that is off must read "false", not blank: blank is what an
        // unset preference looks like, and the two are different facts.
        alcohol_tracking_enabled: "false",
        widgets_enabled: "true",
        created_at: "2026-01-02 15:30:00",
        updated_at: "2026-06-20 16:30:00",
    });
});

test("profile.csv names the zone its own timestamps are rendered in", () => {
    // The profile never ran set_timezone, so the export falls back to UTC and
    // the timezone column says UTC — the two timestamps beside it would
    // otherwise be zone-less wall clocks in the one file that is supposed to
    // explain the account's zone.
    const f = fieldsByName(buildProfileCsv(profile({ timezone: null }), "UTC"));
    expect(f.timezone).toBe("UTC");
    expect(f.created_at).toBe("2026-01-02 14:30:00");
    expect(f.updated_at).toBe("2026-06-20 14:30:00");
});

test("profile.csv survives a free-form value needing quoting", () => {
    // preferred_drink_unit is free-form text to the DB, so an unrecognised
    // value must round-trip rather than break the row.
    const f = fieldsByName(
        buildProfileCsv(
            profile({ preferred_drink_unit: 'us, "standard"' as never }),
            "UTC",
        ),
    );
    expect(f.preferred_drink_unit).toBe('us, "standard"');
    expect(f.widgets_enabled).toBe("true");
});

const README_OPTS = {
    generatedAt: new Date("2026-06-20T14:30:00.000Z"),
    tz: "Europe/Berlin",
    tzConfigured: true,
    weightUnit: "kg" as const,
    counts: { meals: 120, water: 45, weight: 12 },
};

test("the README names every file in the archive", () => {
    const readme = buildExportReadme(README_OPTS);
    for (const name of EXPORT_ARCHIVE_FILES) {
        expect(readme).toContain(name);
    }
});

test("the README states when, in which zone, and that the zone was chosen", () => {
    const readme = buildExportReadme(README_OPTS);
    expect(readme).toContain("2026-06-20 16:30:00");
    expect(readme).toContain("Europe/Berlin");
    expect(readme).toContain("120 rows");
    expect(readme).toContain("45 rows");
    expect(readme).toContain("12 rows");
});

test("the README says outright when the zone defaulted to UTC", () => {
    // An unconfigured timezone silently means UTC everywhere in this server,
    // and someone reading their own wall clocks back has to be told before they
    // interpret a single timestamp.
    const readme = buildExportReadme({
        ...README_OPTS,
        tz: "UTC",
        tzConfigured: false,
    });
    expect(readme).toContain("No timezone has ever been set");
    expect(readme).toContain("set_timezone");
});

test("the README spells out the mixed units", () => {
    const readme = buildExportReadme(README_OPTS);
    expect(readme).toContain("MILLIGRAMS");
    expect(readme).toContain("caffeine_mg");
    expect(readme).toContain("amount_ml");
    expect(readme).toContain("ethanol");
    expect(readme).toContain("weight_g");
});

test("the README says only meals.csv can be re-imported", () => {
    const readme = buildExportReadme(README_OPTS);
    expect(readme).toContain("Only meals.csv can be read back in");
    expect(readme).toContain("start_meal_import");
    expect(readme).toContain("bulk_import_meals");
    expect(readme).toContain("export-only");
});

// ---------- The archive ----------

/**
 * Minimal ZIP reader: seek the EOCD, walk the central directory, follow each
 * record's offset to its payload. `src/zip.test.ts` is where the format itself
 * is verified against the spec; here all that is needed is names and contents.
 */
function readZipEntries(buf: Uint8Array): { name: string; content: string }[] {
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    const decoder = new TextDecoder();
    let eocd = -1;
    for (let i = buf.length - 22; i >= 0; i--) {
        if (view.getUint32(i, true) === 0x06054b50) {
            eocd = i;
            break;
        }
    }
    expect(eocd).toBeGreaterThanOrEqual(0);

    const count = view.getUint16(eocd + 10, true);
    let p = view.getUint32(eocd + 16, true);
    const out: { name: string; content: string }[] = [];
    for (let i = 0; i < count; i++) {
        expect(view.getUint32(p, true)).toBe(0x02014b50);
        const size = view.getUint32(p + 24, true);
        const nameLen = view.getUint16(p + 28, true);
        const extraLen = view.getUint16(p + 30, true);
        const commentLen = view.getUint16(p + 32, true);
        const localOffset = view.getUint32(p + 42, true);
        const name = decoder.decode(buf.subarray(p + 46, p + 46 + nameLen));
        p += 46 + nameLen + extraLen + commentLen;

        const localNameLen = view.getUint16(localOffset + 26, true);
        const localExtraLen = view.getUint16(localOffset + 28, true);
        const start = localOffset + 30 + localNameLen + localExtraLen;
        out.push({
            name,
            content: decoder.decode(buf.subarray(start, start + size)),
        });
    }
    return out;
}

test("EXPORT_ARCHIVE_FILES is the archive's real, ordered file list", () => {
    // The constant exists so the tool text and the site copy can pin their
    // claim to the archive instead of restating it; `exportAllData` builds its
    // entries by mapping over it, keyed by a Record typed on this same list, so
    // a file added on one side without the other is a compile error.
    expect([...EXPORT_ARCHIVE_FILES]).toEqual([
        "meals.csv",
        "water.csv",
        "weight.csv",
        "goals.csv",
        "profile.csv",
        "README.txt",
    ]);
});

test("an archive assembled from the builders reads back file for file", () => {
    // The same assembly `exportAllData` performs, minus the Supabase round
    // trips: every builder's output goes in under its name in the constant's
    // order, and comes back out intact.
    const tz = "Europe/Berlin";
    const contents: Record<string, string> = {
        "meals.csv": buildMealsCsv([meal()], tz),
        "water.csv": buildWaterCsv([water()], tz),
        "weight.csv": buildWeightCsv([weight()], tz, "kg"),
        "goals.csv": buildGoalsCsv(goals(), tz),
        "profile.csv": buildProfileCsv(profile(), tz),
        "README.txt": buildExportReadme(README_OPTS),
    };
    const entries = readZipEntries(
        buildZip(
            EXPORT_ARCHIVE_FILES.map((name) => ({
                name,
                data: contents[name]!,
            })),
            new Date("2026-06-20T14:30:00.000Z"),
        ),
    );

    expect(entries.map((e) => e.name)).toEqual([...EXPORT_ARCHIVE_FILES]);
    for (const entry of entries) {
        expect(entry.content).toBe(contents[entry.name]!);
    }
    // The archived meal file must be the same bytes export_meals hands out, or
    // the one file in here that is re-importable quietly stops being so.
    expect(entries[0]!.content).toBe(buildMealsCsv([meal()], tz));
    // Every CSV in the archive carries its header even when its table is empty.
    for (const csv of ["meals.csv", "water.csv", "weight.csv"] as const) {
        expect(contents[csv]!.split("\n")[0]).not.toBe("");
    }
});
