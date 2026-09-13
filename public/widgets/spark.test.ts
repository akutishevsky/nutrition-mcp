// Behaviour tests for the shared sparkline partial (shared/spark.js).
//
// Same technique as macros.test.ts: the RAW partials are evaluated in the
// order a charting template includes them — i18n, fmt, icon, date, svg,
// macros, then spark, which a template includes itself after macros.js.
// shared/fmt.js is the real one the page ships, not a stand-in: the chart's
// accessible name is caller-supplied text written into an attribute, and esc()
// is what keeps it one. `document` is left undefined, so
// only the pure half is covered here: seriesValue's gap rules, chartableKeys,
// sparkMarkup's markup and sparkReset's state. sparkPaint writes into a live
// focus panel through focusApply, and is checked in the harness instead.
import { test, expect } from "bun:test";
import { WIDGET_STRINGS_EN } from "../../src/copy/widgets";

const SRC = "./public/widgets/src";

type Day = Record<string, number | string | null>;
type Slot = { t: number | null; day: Day | null };
const api = await (async () => {
    const parts = await Promise.all(
        ["i18n", "fmt", "icon", "date", "svg", "macros", "spark"].map((n) =>
            Bun.file(`${SRC}/shared/${n}.js`).text(),
        ),
    );
    const factory = new Function(
        "WIDGET_STRINGS",
        `${parts.join("\n")}\nreturn { seriesValue, chartableKeys, sparkMarkup, sparkReset, SPARK, calendarSlots, MACROS };`,
    );
    return factory({ en: WIDGET_STRINGS_EN }) as {
        seriesValue: (day: Day | null, key: string) => number | null;
        chartableKeys: (days: Day[]) => string[];
        sparkMarkup: (o: {
            slots: Slot[];
            key: string;
            goals: Record<string, number> | null;
            still?: boolean;
            label?: string;
        }) => string;
        sparkReset: (slots: Slot[] | null, goals: unknown) => void;
        SPARK: {
            slots: Slot[];
            goals: unknown;
            key: string;
            painted: boolean;
        };
        calendarSlots: (days: Day[], start: string, end: string) => Slot[];
        MACROS: { key: string; color: string; role: string }[];
    };
})();
const {
    seriesValue,
    chartableKeys,
    sparkMarkup,
    sparkReset,
    SPARK,
    calendarSlots,
    MACROS,
} = api;
const color = (key: string) => MACROS.find((m) => m.key === key)!.color;

const meal = (date: string, calories: number, extra: Day = {}): Day => ({
    date,
    meal_count: 2,
    calories,
    protein_g: 100,
    water_ml: 2000,
    ...extra,
});

// ---- seriesValue -----------------------------------------------------------

test("null is a gap, never a zero", () => {
    expect(seriesValue(null, "calories")).toBeNull();
    expect(seriesValue(meal("2026-07-01", 1800), "fiber_g")).toBeNull();
    expect(
        seriesValue(
            meal("2026-07-01", 1800, { caffeine_mg: null }),
            "caffeine_mg",
        ),
    ).toBeNull();
});

test("a water-only day is a gap on every food series, a reading on water", () => {
    const d: Day = {
        date: "2026-07-01",
        meal_count: 0,
        calories: 0,
        protein_g: 0,
        water_ml: 1500,
    };
    expect(seriesValue(d, "calories")).toBeNull();
    expect(seriesValue(d, "protein_g")).toBeNull();
    expect(seriesValue(d, "water_ml")).toBe(1500);
});

// The one gate is meal_count === 0. A day WITH a meal whose calories are 0 —
// a black coffee logged for its caffeine — is a real 0 kcal reading and a real
// caffeine reading; a broader "has any data" gate (proposed for trends and
// rejected) would have dropped it from nutrition-summary's chart.
test("a 0-kcal day with a meal is a reading, not a gap", () => {
    const d: Day = {
        date: "2026-07-01",
        meal_count: 1,
        calories: 0,
        caffeine_mg: 95,
    };
    expect(seriesValue(d, "calories")).toBe(0);
    expect(seriesValue(d, "caffeine_mg")).toBe(95);
});

test("a payload without meal_count charts as read", () => {
    expect(seriesValue({ date: "2026-07-01", calories: 0 }, "calories")).toBe(
        0,
    );
    expect(
        seriesValue(
            { date: "2026-07-01", meal_count: "", calories: 5 },
            "calories",
        ),
    ).toBe(5);
});

test("stringified numbers are read, garbage is a gap", () => {
    expect(seriesValue({ calories: "1800" }, "calories")).toBe(1800);
    expect(seriesValue({ calories: "abc" }, "calories")).toBeNull();
});

// ---- chartableKeys ---------------------------------------------------------

test("offers every non-calorie metric with a positive reading, and only those", () => {
    const days = [
        meal("2026-07-01", 1800, { fiber_g: 0, caffeine_mg: null }),
        meal("2026-07-02", 1900, { fiber_g: 0, sugar_g: 12 }),
    ];
    const keys = chartableKeys(days);
    expect(keys).not.toContain("calories");
    expect(keys).toContain("protein_g");
    expect(keys).toContain("sugar_g");
    expect(keys).toContain("water_ml");
    // All zero is a flat line on the floor; all null is nothing at all.
    expect(keys).not.toContain("fiber_g");
    expect(keys).not.toContain("caffeine_mg");
});

test("a water-only day's zeros offer nothing but water", () => {
    const d: Day = {
        date: "2026-07-01",
        meal_count: 0,
        calories: 0,
        protein_g: 5,
        water_ml: 1500,
    };
    expect(chartableKeys([d])).toEqual(["water_ml"]);
});

// ---- sparkMarkup -----------------------------------------------------------

const week = [
    meal("2026-07-01", 1800),
    meal("2026-07-02", 2000),
    // 07-03 not logged at all
    { date: "2026-07-04", meal_count: 0, calories: 0, water_ml: 1500 },
    meal("2026-07-05", 2100),
    // 07-06 not logged: 07-07 is a lone reading
    meal("2026-07-07", 1700),
];
const weekSlots = calendarSlots(week, "2026-07-01", "2026-07-07");
const goals = { calories: 2200, protein_g: 160 };

test("unlabelled, the chart is aria-hidden (a button panel names it)", () => {
    const html = sparkMarkup({ slots: weekSlots, key: "calories", goals });
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
    expect(html).not.toContain("aria-label");
});

test("labelled, the chart is an escaped role=img", () => {
    const html = sparkMarkup({
        slots: weekSlots,
        key: "calories",
        goals,
        label: 'Calories over 7 days <"avg">',
    });
    expect(html).toContain(
        'role="img" aria-label="Calories over 7 days &lt;&quot;avg&quot;&gt;"',
    );
    expect(html).not.toContain("aria-hidden");
});

test("wears the metric's role class, and .still only when asked", () => {
    const first = sparkMarkup({ slots: weekSlots, key: "protein_g", goals });
    expect(first).toContain(`class="cwrap ${color("protein_g")}"`);
    const again = sparkMarkup({
        slots: weekSlots,
        key: "protein_g",
        goals,
        still: true,
    });
    expect(again).toContain(`class="cwrap ${color("protein_g")} still"`);
});

test("an unknown key falls back to calories", () => {
    const html = sparkMarkup({ slots: weekSlots, key: "nope", goals });
    expect(html).toContain(`class="cwrap ${color("calories")}"`);
});

test("gaps break the line; a lone reading is a mark, not a path segment", () => {
    const html = sparkMarkup({ slots: weekSlots, key: "calories", goals });
    const d = html.match(/class="cline" pathLength="1" d="([^"]*)"/)![1]!;
    // Runs: 07-01..02, then 07-05 alone (07-03 unlogged, 07-04 water-only,
    // 07-06 unlogged), then 07-07 alone. Only the run is a subpath: as a
    // zero-length segment a lone reading was a speck the width of the line.
    expect(d.match(/M/g)!.length).toBe(1);
    expect(d).not.toMatch(/M([\d.]+ [\d.]+)L\1(?=M|$)/);
    // Each lone reading is a zero-length .cpt mark on its own day's x (slots
    // 4 and 6 of 7, at 6 + i/6 * 468), 07-07's included: its dot covers it.
    const marks = [
        ...html.matchAll(
            /class="cpt" d="M([\d.]+) ([\d.]+)L([\d.]+) ([\d.]+)"/g,
        ),
    ];
    expect(marks.map((m) => m[1])).toEqual(["318.0", "474.0"]);
    for (const m of marks) expect([m[3], m[4]]).toEqual([m[1], m[2]]);
    // After the goal, so no dash cuts one; before the halo, so the dot stays
    // the one mark on top.
    expect(html.indexOf('class="cgoal"')).toBeLessThan(
        html.indexOf('class="cpt"'),
    );
    expect(html.lastIndexOf('class="cpt"')).toBeLessThan(
        html.indexOf('class="chalo"'),
    );
});

test("a mark only where a reading has a gap on each side, on either axis", () => {
    const count = (html: string) => (html.match(/class="cpt"/g) ?? []).length;
    // Water reads the water-only 07-04, so only 07-07 stands alone.
    expect(
        count(sparkMarkup({ slots: weekSlots, key: "water_ml", goals })),
    ).toBe(1);
    const full = calendarSlots(
        [meal("2026-07-01", 1800), meal("2026-07-02", 1900)],
        "2026-07-01",
        "2026-07-02",
    );
    expect(count(sparkMarkup({ slots: full, key: "calories", goals }))).toBe(0);
    // A range that cannot be trusted falls back to the dateless axis, which
    // reads a gap the same way.
    const plain = calendarSlots(
        [
            meal("2026-07-01", 1800),
            { date: "2026-07-02", meal_count: 0, calories: 0, water_ml: 900 },
            meal("2026-07-03", 1900),
            meal("2026-07-04", 2000),
        ],
        "not a date",
        "2026-07-04",
    );
    expect(plain.every((s) => s.t === null)).toBe(true);
    expect(count(sparkMarkup({ slots: plain, key: "calories", goals }))).toBe(
        1,
    );
});

test("past a month a lone reading's mark drops to line weight", () => {
    // Every other day logged, so every reading stands alone.
    const gappy = (start: string, end: string, n: number) =>
        calendarSlots(
            Array.from({ length: n }, (_, i) => {
                const d = new Date(
                    Date.parse(`${start}T00:00:00Z`) + i * 864e5,
                );
                return meal(d.toISOString().slice(0, 10), 1800 + i);
            }).filter((_, i) => i % 2 === 0),
            start,
            end,
        );
    const full = (html: string) => (html.match(/class="cpt"/g) ?? []).length;
    const dense = (html: string) =>
        (html.match(/class="cpt dense"/g) ?? []).length;

    // A month: a slot is wide enough for the 4px bead.
    const month = gappy("2026-07-01", "2026-07-31", 31);
    expect(month.length).toBe(31);
    const m = sparkMarkup({ slots: month, key: "calories", goals });
    expect(full(m)).toBe(16);
    expect(dense(m)).toBe(0);

    // A quarter and a year: no full-size mark at all.
    for (const [start, end, n] of [
        ["2026-05-03", "2026-07-31", 90],
        ["2025-08-01", "2026-07-31", 365],
    ] as const) {
        const slots = gappy(start, end, n);
        expect(slots.length).toBe(n);
        const html = sparkMarkup({ slots, key: "calories", goals });
        expect(full(html)).toBe(0);
        expect(dense(html)).toBe(Math.ceil(n / 2));
    }
});

test("the goal line is drawn only for a positive goal", () => {
    expect(sparkMarkup({ slots: weekSlots, key: "calories", goals })).toContain(
        'class="cgoal"',
    );
    expect(
        sparkMarkup({ slots: weekSlots, key: "fiber_g", goals }),
    ).not.toContain('class="cgoal"');
    expect(
        sparkMarkup({ slots: weekSlots, key: "calories", goals: null }),
    ).not.toContain('class="cgoal"');
});

test("one hairline per day up to a month, none on a year", () => {
    const count = (html: string) => (html.match(/class="cday"/g) ?? []).length;
    expect(
        count(sparkMarkup({ slots: weekSlots, key: "calories", goals })),
    ).toBe(7);
    const year = calendarSlots(
        [meal("2025-08-01", 1800), meal("2026-07-31", 2000)],
        "2025-08-01",
        "2026-07-31",
    );
    expect(year.length).toBe(365);
    expect(count(sparkMarkup({ slots: year, key: "calories", goals }))).toBe(0);
});

test("the last-reading dot sits on the last reading", () => {
    const html = sparkMarkup({ slots: weekSlots, key: "calories", goals });
    expect((html.match(/class="cdot"/g) ?? []).length).toBe(1);
    const none = sparkMarkup({
        slots: weekSlots,
        key: "caffeine_mg",
        goals,
    });
    expect(none).not.toContain('class="cdot"');
});

// ---- sparkReset ------------------------------------------------------------

test("sparkReset starts a card over: new axis, calories, entrance owed", () => {
    SPARK.key = "protein_g";
    SPARK.painted = true;
    sparkReset(weekSlots, goals);
    expect(SPARK.slots).toBe(weekSlots);
    expect(SPARK.goals).toBe(goals);
    expect(SPARK.key).toBe("calories");
    expect(SPARK.painted).toBe(false);
    sparkReset(null, undefined);
    expect(SPARK.slots).toEqual([]);
    expect(SPARK.goals).toBeNull();
});
