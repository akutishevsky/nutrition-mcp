// Export files for the import-meals widget in the harness (dev-only).
//
// The importer's whole input is a file the user picks, so the harness cannot
// show its states from a tool result alone. `?csv=<name>` on the host page
// hands the widget one of these files as if it had been dropped on it (see
// the /widget/ route in scripts/widget-harness.ts), which reproduces each of
// the redesign's scenarios — clean, needs attention, kJ, a missing calories
// column, long names, one meal, a large file, failing rows, a failing dry
// run, our own export, alcohol, a binary file and an empty one — through the
// real parser, mapper and preview rather than a mock of them.

import { buildMealsCsv } from "../src/export.js";
import type { Meal } from "../src/supabase.js";

export interface ImportFixture {
    name: string;
    /** File contents, base64 (so a binary fixture survives the trip). */
    base64: string;
}

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
const csv = (rows: (string | number)[][], delim = ",") =>
    rows
        .map((r) =>
            r
                .map((c) => {
                    const s = String(c);
                    return /[",\n;]/.test(s) && delim === ","
                        ? '"' + s.replace(/"/g, '""') + '"'
                        : s;
                })
                .join(delim),
        )
        .join("\n") + "\n";

const pad = (n: number) => String(n).padStart(2, "0");
const isoDay = (start: string, plus: number) => {
    const d = new Date(start + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + plus);
    return d.toISOString().slice(0, 10);
};

const FOODS: [string, string, number, number, number, number, number][] = [
    // meal, food, kcal, protein, carbs, fat, sodium mg
    ["Breakfast", "Oatmeal with blueberries", 310, 10.2, 54, 6.1, 120],
    ["Breakfast", "Flat white", 120, 6.4, 9.8, 6.2, 85],
    ["Lunch", "Chicken Caesar salad", 540, 38, 18, 34, 980],
    ["Lunch", "Lentil soup", 360, 21, 52, 7.5, 760],
    ["Dinner", "Salmon, rice and greens", 680, 42, 66, 24, 640],
    ["Dinner", "Mushroom risotto", 610, 16, 82, 22, 1120],
    ["Snacks", "Greek yogurt with honey", 190, 15, 22, 4.8, 55],
    ["Snacks", "Apple", 95, 0.5, 25, 0.3, 2],
];

/** Cronometer "servings" export: Day + Time columns, ISO dates, sodium. */
function cronometer(days: number, start = "2026-10-01"): string {
    const rows: (string | number)[][] = [
        [
            "Day",
            "Time",
            "Group",
            "Food Name",
            "Amount",
            "Energy (kcal)",
            "Protein (g)",
            "Carbs (g)",
            "Fat (g)",
            "Fiber (g)",
            "Sugars (g)",
            "Sodium (mg)",
        ],
    ];
    for (let d = 0; d < days; d++) {
        const meals = 3 + (d % 2);
        for (let m = 0; m < meals; m++) {
            const f = FOODS[(d * 3 + m * 2) % FOODS.length]!;
            const hh = [7, 12, 19, 16][m]!;
            rows.push([
                isoDay(start, d),
                `${pad(hh)}:${pad((d * 7 + m * 13) % 60)}`,
                f[0],
                f[1],
                "1.00 serving",
                f[2],
                f[3],
                f[4],
                f[5],
                (Math.round(f[4] * 0.08 * 10) / 10).toFixed(1),
                (Math.round(f[4] * 0.2 * 10) / 10).toFixed(1),
                f[6],
            ]);
        }
    }
    return csv(rows);
}

function needsAttention(): string {
    // Day-first dates (31/10 settles it), 12-hour times, a few rows with no
    // time, two dates that cannot exist, a blank row, a totals row, a ragged
    // row, and the same header twice.
    const rows: (string | number)[][] = [
        [
            "Date",
            "Time",
            "Meal",
            "Food Name",
            "Amount",
            "Amount",
            "Energy (kcal)",
            "Protein (g)",
            "Carbs (g)",
            "Fat (g)",
        ],
        [
            "28/09/2026",
            "7:40 AM",
            "Breakfast",
            "Porridge",
            "1",
            "bowl",
            310,
            10,
            54,
            6,
        ],
        [
            "28/09/2026",
            "12:40 PM",
            "Lunch",
            "Tuna sandwich",
            "1",
            "each",
            450,
            28,
            40,
            18,
        ],
        ["28/09/2026", "", "Snacks", "Banana", "1", "each", 105, 1.3, 27, 0.4],
        [
            "31/09/2026",
            "7:15 PM",
            "Dinner",
            "Pasta bake",
            "1",
            "plate",
            720,
            30,
            88,
            24,
        ],
        [
            "29/09/2026",
            "8:05 AM",
            "Breakfast",
            "Scrambled eggs on toast",
            "1",
            "plate",
            420,
            24,
            30,
            22,
        ],
        ["", "", "", "", "", "", "", "", "", ""],
        [
            "29/09/2026",
            "",
            "Lunch",
            "Leftover pasta bake",
            "1",
            "plate",
            640,
            26,
            80,
            21,
        ],
        [
            "2026-13-02",
            "6:30 PM",
            "Dinner",
            "Stir fry",
            "1",
            "bowl",
            560,
            32,
            60,
            18,
        ],
        ["30/09/2026", "9:10 AM", "Breakfast", "Yogurt and granola"],
        [
            "31/10/2026",
            "1:00 PM",
            "Lunch",
            "Burrito bowl",
            "1",
            "bowl",
            690,
            34,
            78,
            24,
        ],
        ["Totals", "", "", "", "", "", 4295, 185.3, 457, 133.4],
    ];
    return csv(rows);
}

function kilojoules(): string {
    const rows: (string | number)[][] = [
        ["Date", "Meal", "Food", "Energy", "Protein", "Carbohydrates", "Fat"],
    ];
    for (let d = 0; d < 5; d++) {
        for (let m = 0; m < 3; m++) {
            const f = FOODS[(d + m * 3) % FOODS.length]!;
            const date = isoDay("2026-10-01", d);
            const [y, mo, da] = date.split("-");
            rows.push([
                `${da}/${mo}/${y}`,
                f[0],
                f[1],
                Math.round((f[2] + 140) * 4.184),
                f[3],
                f[4],
                f[5],
            ]);
        }
    }
    return csv(rows);
}

function germanNoCalories(): string {
    const rows: (string | number)[][] = [
        [
            "Datum",
            "Uhrzeit",
            "Mahlzeit",
            "Lebensmittel",
            "Menge",
            "Brennwert (kJ)",
            "Eiweiß (g)",
            "Kohlenhydrate (g)",
            "Fett (g)",
            "Natrium (mg)",
        ],
    ];
    const de = [
        [
            "Frühstück",
            "Müsli mit Milch",
            "1 Portion",
            1450,
            "12,5",
            "48,0",
            "9,2",
            180,
        ],
        [
            "Mittagessen",
            "Linseneintopf",
            "1 Teller",
            1600,
            "21,0",
            "52,4",
            "7,5",
            820,
        ],
        [
            "Abendessen",
            "Brot mit Käse",
            "2 Scheiben",
            2100,
            "24,3",
            "44,0",
            "26,1",
            1240,
        ],
    ];
    for (let d = 0; d < 4; d++)
        for (const r of de)
            rows.push([
                `${pad(1 + d)}.10.2026`,
                ["07:30", "12:45", "19:10"][de.indexOf(r)]!,
                ...(r as (string | number)[]),
            ]);
    return csv(rows, ";");
}

function longNames(): string {
    const rows: (string | number)[][] = [
        [
            "Date",
            "Time",
            "Food Name",
            "Serving Size",
            "Calories",
            "Protein",
            "Carbs",
            "Fat",
            "Notes",
        ],
        [
            "2026-10-20",
            "08:10",
            "Сирники зі сметаною, домашнім полуничним варенням і свіжою м’ятою, приготовані на кокосовій олії, з додатковою порцією меду та подрібненими волоськими горіхами зверху, подані з чашкою трав’яного чаю",
            "1 plate",
            640,
            28,
            62,
            30,
            "breakfast at grandma's, with jam, honey, and walnuts",
        ],
        [
            "2026-10-20",
            "13:30",
            "Borscht with sour cream, pampushky with garlic, a side of pickled cucumbers and a slice of rye bread",
            "1 bowl",
            520,
            18,
            64,
            20,
            "",
        ],
        [
            "2026-10-20",
            "19:05",
            "Варені вареники з картоплею та смаженою цибулею",
            "12 pcs",
            710,
            20,
            104,
            22,
            "dinner, shared, estimated portion",
        ],
        ["2026-10-21", "09:00", "Espresso", "1 cup", 3, 0.2, 0, 0, ""],
    ];
    return csv(rows);
}

function single(): string {
    return csv([
        [
            "Day",
            "Time",
            "Food Name",
            "Energy (kcal)",
            "Protein (g)",
            "Carbs (g)",
            "Fat (g)",
        ],
        ["2026-10-14", "08:00", "Avocado toast", 380, 9, 34, 22],
    ]);
}

/** 92 days; 2026-07-05 has 56 meals (more than one 50-row batch). */
function large(): string {
    const rows: (string | number)[][] = [
        [
            "Day",
            "Time",
            "Food Name",
            "Energy (kcal)",
            "Protein (g)",
            "Carbs (g)",
            "Fat (g)",
        ],
    ];
    for (let d = 0; d < 92; d++) {
        const date = isoDay("2026-06-01", d);
        const n = date === "2026-07-05" ? 56 : 3;
        for (let m = 0; m < n; m++) {
            const f = FOODS[(d + m) % FOODS.length]!;
            rows.push([
                date,
                `${pad(7 + (m % 14))}:${pad((m * 7) % 60)}`,
                n > 3 ? `${f[1]} (tasting ${m + 1})` : f[1],
                f[2],
                f[3],
                f[4],
                f[5],
            ]);
        }
    }
    return csv(rows);
}

/** MyFitnessPal shape (Meal column, no food name); two rows the server
 * refuses (a negative protein figure, an over-long note). */
function importErrors(): string {
    const rows: (string | number)[][] = [
        [
            "Date",
            "Meal",
            "Calories",
            "Fat (g)",
            "Carbohydrates (g)",
            "Protein (g)",
            "Note",
        ],
    ];
    for (let d = 0; d < 6; d++) {
        for (const [i, meal] of ["Breakfast", "Lunch", "Dinner"].entries()) {
            rows.push([
                isoDay("2026-10-01", d),
                meal,
                400 + i * 150 + d * 10,
                12 + i * 4,
                50 + i * 10,
                d === 2 && i === 1 ? -12 : 20 + i * 8,
                d === 4 && i === 2 ? "x".repeat(4312) : "",
            ]);
        }
    }
    return csv(rows);
}

/** Dated well into the future: the server's dry run refuses every row. */
function dryRunFails(): string {
    return csv([
        [
            "Day",
            "Time",
            "Food Name",
            "Energy (kcal)",
            "Protein (g)",
            "Carbs (g)",
            "Fat (g)",
        ],
        ["2027-03-01", "08:00", "Porridge", 310, 10, 54, 6],
        ["2027-03-01", "13:00", "Soup", 360, 21, 52, 7],
        ["2027-03-02", "19:00", "Curry", 690, 30, 70, 28],
    ]);
}

function ownExport(): string {
    const base = {
        user_id: "harness-user",
        saturated_fat_g: null,
        trans_fat_g: null,
        fiber_g: null,
        sugar_g: null,
        added_sugar_g: null,
        alcohol_g: null,
        caffeine_mg: null,
        sodium_mg: null,
        notes: null,
        idempotency_key: null,
        saved_meal_id: null,
        nutrient_sources: null,
        source_detail: null,
    };
    const meals = FOODS.slice(0, 6).map(
        (f, i) =>
            ({
                ...base,
                id: `00000000-0000-4000-8000-${String(900 + i).padStart(12, "0")}`,
                logged_at: `2026-10-${pad(10 + Math.floor(i / 3))}T${pad(6 + (i % 3) * 5)}:15:00.000Z`,
                meal_type: f[0].toLowerCase(),
                description: f[1],
                calories: f[2],
                protein_g: f[3],
                carbs_g: f[4],
                fat_g: f[5],
                sodium_mg: f[6],
            }) as unknown as Meal,
    );
    return buildMealsCsv(meals, "Europe/Kyiv");
}

function alcohol(): string {
    return csv([
        [
            "Day",
            "Time",
            "Food Name",
            "Energy (kcal)",
            "Protein (g)",
            "Carbs (g)",
            "Fat (g)",
            "Alcohol (g)",
        ],
        ["2026-10-17", "19:30", "Pinot noir, 175 ml", 145, 0.1, 4.6, 0, 17.4],
        ["2026-10-17", "20:00", "Cheese board", 520, 28, 6, 42, 0],
        ["2026-10-18", "18:45", "Lager, 500 ml", 215, 1.6, 18, 0, 19.7],
    ]);
}

const FIXTURES: Record<
    string,
    () => { name: string; text?: string; bytes?: Uint8Array }
> = {
    clean: () => ({ name: "servings.csv", text: cronometer(14) }),
    attention: () => ({
        name: "cronometer-servings-sept.csv",
        text: needsAttention(),
    }),
    kj: () => ({ name: "easy-diet-diary-export.csv", text: kilojoules() }),
    nocalories: () => ({
        name: "ernaehrung-oktober.csv",
        text: germanNoCalories(),
    }),
    long: () => ({
        name: "MacroFactor-food-log-export-2026-10-24-full-history-v2 (1) — copy.csv",
        text: longNames(),
    }),
    single: () => ({ name: "one-meal.csv", text: single() }),
    large: () => ({ name: "food-diary-summer.csv", text: large() }),
    errors: () => ({ name: "myfitnesspal-meals.csv", text: importErrors() }),
    dryfail: () => ({ name: "planned-meals.csv", text: dryRunFails() }),
    own: () => ({ name: "meals.csv", text: ownExport() }),
    alcohol: () => ({ name: "weekend.csv", text: alcohol() }),
    // The head of a real .xlsx (a ZIP local file header).
    xlsx: () => ({
        name: "Nutrition-Report-2026.xlsx",
        bytes: new Uint8Array([
            0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00, 0x08, 0x00, 0x00,
            0x00, 0x21, 0x00, 0x62, 0xee, 0x9d, 0x68, 0x5e, 0x01, 0x00, 0x00,
        ]),
    }),
    empty: () => ({
        name: "meals-empty.csv",
        text: "Date,Food Name,Calories\n",
    }),
};

export const IMPORT_FIXTURE_NAMES = Object.keys(FIXTURES);

export function importFixture(key: string): ImportFixture | null {
    const make = FIXTURES[key];
    if (!make) return null;
    const f = make();
    return {
        name: f.name,
        base64: f.bytes
            ? Buffer.from(f.bytes).toString("base64")
            : b64(f.text ?? ""),
    };
}
