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
type Pt = [number, number];
const api = await (async () => {
    const parts = await Promise.all(
        ["i18n", "fmt", "icon", "date", "svg", "macros", "spark"].map((n) =>
            Bun.file(`${SRC}/shared/${n}.js`).text(),
        ),
    );
    const factory = new Function(
        "WIDGET_STRINGS",
        `${parts.join("\n")}\nreturn { seriesValue, chartableKeys, sparkMarkup, sparkReset, SPARK, calendarSlots, MACROS, chCurve, chPath, chArea, chPoints, chY, chRuns, chRolling, chTrend, CH_W, CH_PL, CH_PR, CH_DAILY_SLOTS };`,
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
        chCurve: (p: Pt[]) => string;
        chPath: (p: Pt[]) => string;
        chArea: (p: (Pt | null)[]) => string;
        chPoints: (vals: number[], yMin: number, yMax: number) => Pt[];
        chY: (v: number, yMin: number, yMax: number) => number;
        chRuns: (vals: (number | null)[], maxGap: number) => number[][];
        chRolling: (
            vals: (number | null)[],
            k: number,
            runs: number[][],
        ) => (number | null)[];
        chTrend: (
            vals: (number | null)[],
            pts: Pt[],
            yMin: number,
            yMax: number,
        ) => string;
        CH_W: number;
        CH_PL: number;
        CH_PR: number;
        CH_DAILY_SLOTS: number;
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
    chCurve,
    chPath,
    chArea,
    chPoints,
    chY,
    chRuns,
    chRolling,
    chTrend,
    CH_W,
    CH_PL,
    CH_PR,
    CH_DAILY_SLOTS,
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

test("past a month the lone readings drop to one 2px texture path", () => {
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
    // The dense marks are ONE path of zero-length subpaths (chMarksD), so
    // count its subpaths, and check there is only the one path.
    const dense = (html: string) => {
        const paths = [...html.matchAll(/class="cpt dense" d="([^"]*)"/g)];
        expect(paths.length).toBeLessThanOrEqual(1);
        return paths.length ? paths[0]![1]!.match(/M/g)!.length : 0;
    };

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
        // Every reading is lone, so the real line has no subpath at all —
        // but a one-day gap is within the trend's ±k, so the trend is ONE
        // run across the whole window rather than nothing.
        expect(lineD(html)).toBe("");
        expect(trendD(html).match(/M/g)!.length).toBe(1);
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

// ---- the curve (shared/svg.js chCurve) --------------------------------------
//
// Every chart line is one monotone cubic through the exact readings. These pin
// what makes it honest rather than what it looks like: no C1 (tangent
// continuity) test, since the post-rounding control clamp leaves tiny kinks on
// purpose (see chCurveSegs).

const lineD = (html: string) =>
    html.match(/class="cline" pathLength="1" d="([^"]*)"/)![1]!;
const trendD = (html: string) =>
    (html.match(/class="ctrend" pathLength="1" d="([^"]*)"/) ?? [])[1] ?? "";

type Piece = { cmd: "L" | "C"; p: Pt[] };
// A line path's nodes (every M/L/C endpoint) and its pieces, each with its
// start point. Line paths only: an area's closing L/Z legs are not pieces of
// the curve.
function parse(d: string) {
    const nodes: Pt[] = [];
    const segs: Piece[] = [];
    let cur: Pt = [0, 0];
    let subpaths = 0;
    for (const m of d.matchAll(/([MLCZ])([^MLCZ]*)/g)) {
        const n = m[2]!.trim() ? m[2]!.trim().split(/\s+/).map(Number) : [];
        if (m[1] === "M") {
            cur = [n[0]!, n[1]!];
            nodes.push(cur);
            subpaths++;
        } else if (m[1] === "L") {
            const e: Pt = [n[0]!, n[1]!];
            segs.push({ cmd: "L", p: [cur, e] });
            cur = e;
            nodes.push(e);
        } else if (m[1] === "C") {
            const e: Pt = [n[4]!, n[5]!];
            segs.push({
                cmd: "C",
                p: [cur, [n[0]!, n[1]!], [n[2]!, n[3]!], e],
            });
            cur = e;
            nodes.push(e);
        }
    }
    return { nodes, segs, subpaths };
}
function sample(s: Piece, steps = 60): Pt[] {
    const out: Pt[] = [];
    for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        if (s.cmd === "L") {
            const [a, b] = s.p as [Pt, Pt];
            out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
        } else {
            const [a, b, c, e] = s.p as [Pt, Pt, Pt, Pt];
            const u = 1 - t;
            const f = (i: 0 | 1) =>
                u * u * u * a[i] +
                3 * u * u * t * b[i] +
                3 * u * t * t * c[i] +
                t * t * t * e[i];
            out.push([f(0), f(1)]);
        }
    }
    return out;
}
const key = (p: Pt) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
const EPS = 1e-9;

// x in days (uneven where a shape needs it), y as values on a 0-based axis.
const SHAPES: Record<string, { xs?: number[]; vs: number[]; lo?: number }> = {
    spike: { vs: [1900, 1900, 1900, 1900, 1900, 1900, 3600, 1900, 1900, 1900] },
    plateau: { vs: [1800, 1800, 2200, 2200, 2200, 2200, 1800, 1800] },
    V: { vs: [2000, 1500, 1000, 500, 0, 500, 1000, 1500, 2000] },
    zeros: { vs: [2000, 0, 2100, 2150, 0, 1900, 2300] },
    // A weekly weigher's month on a data-scaled axis: the bridged weight line.
    uneven: {
        xs: [0, 1, 5, 6, 13, 20, 21, 29],
        vs: [78.4, 78.1, 77.9, 78.3, 77.2, 76.9, 77.0, 76.2],
        lo: 75.5,
    },
    noisy: {
        vs: Array.from({ length: 60 }, (_, i) =>
            Math.round(
                2050 + 260 * Math.sin(i * 1.3) + 140 * Math.sin(i * 0.37 + 1),
            ),
        ),
    },
};
function shapePts(s: { xs?: number[]; vs: number[]; lo?: number }) {
    const lo = s.lo ?? 0;
    const hi = Math.max(...s.vs) * 1.15;
    if (!s.xs) return { pts: chPoints(s.vs, lo, hi), lo, hi };
    const span = s.xs[s.xs.length - 1]!;
    const w = CH_W - CH_PL - CH_PR;
    return {
        pts: s.xs.map(
            (x, i) => [CH_PL + (x / span) * w, chY(s.vs[i]!, lo, hi)] as Pt,
        ),
        lo,
        hi,
    };
}

test("every reading's (x, y) is a node of the curve, in order", () => {
    for (const [name, s] of Object.entries(SHAPES)) {
        const { pts } = shapePts(s);
        const { nodes, subpaths } = parse(chPath(pts));
        expect(subpaths, name).toBe(1);
        expect(nodes.map(key), name).toEqual(pts.map(key));
    }
});

test("no piece of the curve leaves the band its two readings span", () => {
    for (const [name, s] of Object.entries(SHAPES)) {
        const { segs } = parse(chPath(shapePts(s).pts));
        for (const seg of segs) {
            const a = seg.p[0]!;
            const e = seg.p[seg.p.length - 1]!;
            const lo = Math.min(a[1], e[1]);
            const hi = Math.max(a[1], e[1]);
            let px = -Infinity;
            for (const [x, y] of sample(seg)) {
                expect(y, name).toBeGreaterThanOrEqual(lo - EPS);
                expect(y, name).toBeLessThanOrEqual(hi + EPS);
                // and never runs backwards in time
                expect(x, name).toBeGreaterThanOrEqual(px - EPS);
                px = x;
            }
        }
    }
});

test("a piece whose two readings sit on one side of the goal never crosses it", () => {
    const goal = 2200;
    for (const [name, s] of Object.entries(SHAPES)) {
        if (s.lo) continue;
        const { pts, lo, hi } = shapePts(s);
        const gy = chY(goal, lo, hi);
        let checked = 0;
        for (const seg of parse(chPath(pts)).segs) {
            const a = seg.p[0]![1];
            const e = seg.p[seg.p.length - 1]![1];
            // screen y: smaller is higher, so "under the goal" is y > gy
            const under = a >= gy && e >= gy;
            const over = a <= gy && e <= gy;
            if (!under && !over) continue;
            checked++;
            for (const [, y] of sample(seg)) {
                if (under) expect(y, name).toBeGreaterThanOrEqual(gy - EPS);
                else expect(y, name).toBeLessThanOrEqual(gy + EPS);
            }
        }
        expect(checked, name).toBeGreaterThan(0);
    }
});

test("a two-reading run is a straight L; three or more are C pieces", () => {
    expect(
        chCurve([
            [6, 40],
            [84, 12.25],
        ]),
    ).toBe("M6.0 40.0L84.0 12.3");
    const three = chCurve([
        [6, 40],
        [84, 12],
        [162, 30],
    ]);
    expect(three).toMatch(/^M6\.0 40\.0C[^LMC]+C[^LMC]+$/);
    expect(chCurve([[6, 40]])).toBe("M6.0 40.0");
    expect(chCurve([])).toBe("");
});

test("a flat run has flat controls", () => {
    const flat = chCurve([
        [6, 20],
        [84, 20],
        [162, 20],
        [240, 20],
    ]);
    const nums = [...flat.matchAll(/C([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+) /g)];
    expect(nums.length).toBe(3);
    for (const m of nums) expect([m[2], m[4]]).toEqual(["20.0", "20.0"]);
    // and a plateau inside a run stays exactly on its level between readings
    const { segs } = parse(chPath(shapePts(SHAPES.plateau!).pts));
    const level = segs.filter((g) => g.p[0]![1] === g.p[g.p.length - 1]![1]);
    expect(level.length).toBeGreaterThan(0);
    for (const g of level)
        for (const [, y] of sample(g)) expect(y).toBeCloseTo(g.p[0]![1], 9);
});

test("the wash's top edge is the line's own curve, gapped the same way", () => {
    const pts = chPoints([1800, 2000, 2100, 0, 1900, 2200], 0, 2600);
    const gapped = pts.map((p, i) => (i === 3 ? null : p));
    const area = chArea(gapped);
    // Runs 0..2 and 4..5: two closed subpaths, each opening with its curve.
    expect(area.match(/M/g)!.length).toBe(2);
    expect(area.startsWith(chCurve(pts.slice(0, 3)))).toBe(true);
    expect(area).toContain(chCurve(pts.slice(4)));
    // A run of one closes to nothing.
    expect(chArea([pts[0]!, null, pts[2]!])).toBe("");
});

test("the sparkline's curve holds every reading and ends on the dot", () => {
    for (const [n, logged] of [
        [14, (i: number) => i % 5 !== 2],
        [30, (i: number) => i !== 9 && i !== 10],
        [90, (i: number) => i % 3 !== 2],
        [365, () => true],
    ] as const) {
        const start = `2026-0${n > 90 ? 1 : 5}-01`;
        const days = Array.from({ length: n }, (_, i) => i)
            .filter(logged)
            .map((i) =>
                meal(
                    new Date(Date.parse(`${start}T00:00:00Z`) + i * 864e5)
                        .toISOString()
                        .slice(0, 10),
                    1800 + ((i * 137) % 700),
                ),
            );
        const end = new Date(Date.parse(`${start}T00:00:00Z`) + (n - 1) * 864e5)
            .toISOString()
            .slice(0, 10);
        const slots = calendarSlots(days, start, end);
        expect(slots.length).toBe(n);
        const html = sparkMarkup({ slots, key: "calories", goals });
        const raw = slots.map((s) =>
            s.day ? (s.day.calories as number) : null,
        );
        const top = Math.max(...raw.filter((v) => v !== null), 2200, 1) * 1.15;
        const pts = chPoints(
            raw.map((v) => v ?? 0),
            0,
            top,
        );
        const inRun = raw.map(
            (v, i) =>
                v !== null &&
                ((i > 0 && raw[i - 1] !== null) ||
                    (i + 1 < n && raw[i + 1] !== null)),
        );
        const nodes = new Set(parse(lineD(html)).nodes.map(key));
        raw.forEach((_, i) => {
            if (inRun[i])
                expect(nodes.has(key(pts[i]!)), `${n}:${i}`).toBe(true);
        });
        // The dot is the real latest reading, not an average.
        const last = raw.findLastIndex((v) => v !== null);
        const dot = html.match(/class="cdot" d="M([\d.]+ [\d.]+)L/)![1];
        expect(dot).toBe(key(pts[last]!));
    }
});

// ---- the long-range trend (shared/svg.js chTrend) ---------------------------

const daily = (start: string, n: number, kcal: (i: number) => number | null) =>
    calendarSlots(
        Array.from({ length: n }, (_, i) => i)
            .filter((i) => kcal(i) !== null)
            .map((i) =>
                meal(
                    new Date(Date.parse(`${start}T00:00:00Z`) + i * 864e5)
                        .toISOString()
                        .slice(0, 10),
                    kcal(i)!,
                ),
            ),
        start,
        new Date(Date.parse(`${start}T00:00:00Z`) + (n - 1) * 864e5)
            .toISOString()
            .slice(0, 10),
    );
const wob = (i: number) =>
    Math.round(2050 + 260 * Math.sin(i * 1.3) + 140 * Math.sin(i * 0.37 + 1));

test("the trend is never drawn at 7, 14, 30 or 31 days, and is past that", () => {
    expect(CH_DAILY_SLOTS).toBe(31);
    for (const n of [7, 14, 30, 31]) {
        const html = sparkMarkup({
            slots: daily("2026-01-01", n, wob),
            key: "calories",
            goals,
        });
        expect(html, `${n}`).not.toContain("ctrend");
        expect(html, `${n}`).not.toContain("cthalo");
        expect(html, `${n}`).toContain(`class="cwrap ${color("calories")}"`);
    }
    for (const n of [32, 48, 90, 365]) {
        const html = sparkMarkup({
            slots: daily("2025-01-01", n, wob),
            key: "calories",
            goals,
            still: true,
        });
        expect(html, `${n}`).toContain(
            `class="cwrap ${color("calories")} long still"`,
        );
        expect((html.match(/class="ctrend"/g) ?? []).length, `${n}`).toBe(1);
        // No knock-out under it: the day layer is a translucent texture, so
        // nothing has to be cut out of it (chart.css says why).
        expect(html, `${n}`).not.toContain("cthalo");
    }
    // A dateless fallback axis is measured in slots too.
    const plain = calendarSlots(
        Array.from({ length: 48 }, (_, i) => meal(`2026-01-01`, wob(i))),
        "not a date",
        "2026-01-01",
    );
    expect(plain.length).toBe(48);
    expect(sparkMarkup({ slots: plain, key: "calories", goals })).toContain(
        'class="ctrend"',
    );
    // No run of two readings anywhere: nothing to trend.
    expect(
        chTrend(
            Array.from({ length: 90 }, (_, i) => (i % 9 === 0 ? 2000 : null)),
            chPoints(new Array(90).fill(0), 0, 1),
            0,
            1,
        ),
    ).toBe("");
});

test("long range: the dot and the real line sit on the real latest value; the trend ends on an average", () => {
    // A spike on the LAST day. The dot and the real line must say 3,400;
    // the trend must NOT hook up to it (it used to end on the raw day).
    const n = 365;
    const k = 7;
    const kcal = (i: number) => (i === n - 1 ? 3400 : wob(i));
    const html = sparkMarkup({
        slots: daily("2025-08-01", n, kcal),
        key: "calories",
        goals,
    });
    const top =
        Math.max(...Array.from({ length: n }, (_, i) => kcal(i))) * 1.15;
    const want = `${(CH_W - CH_PR).toFixed(1)} ${chY(3400, 0, top).toFixed(1)}`;
    const dot = html.match(/class="cdot" d="M([\d.]+ [\d.]+)L/)![1];
    expect(dot).toBe(want);
    const l = parse(lineD(html)).nodes;
    expect(key(l[l.length - 1]!)).toBe(want);
    // The trend reaches the same x, at the mean of the last k + 1 days...
    const t = parse(trendD(html)).nodes;
    const mean = (from: number, to: number) => {
        let sum = 0;
        for (let i = from; i <= to; i++) sum += kcal(i);
        return sum / (to - from + 1);
    };
    expect(key(t[t.length - 1]!)).toBe(
        `${(CH_W - CH_PR).toFixed(1)} ${chY(mean(n - 1 - k, n - 1), 0, top).toFixed(1)}`,
    );
    expect(key(t[t.length - 1]!)).not.toBe(want);
    // ...and starts at the first reading's x on the mean of the first k + 1.
    expect(key(t[0]!)).toBe(
        `${l[0]![0].toFixed(1)} ${chY(mean(0, k), 0, top).toFixed(1)}`,
    );
});

test("long range: an unfinished last day moves the trend's end by at most 1/(k + 1) of its departure", () => {
    // A steady 2,000 +/-60 quarter or year, then "today" at 800 kcal. The
    // axis top is set by the goal in both, so the two charts share a scale.
    const steady = (i: number) => 1940 + ((i * 37) % 120);
    for (const [n, k] of [
        [90, 3],
        [365, 7],
    ] as const) {
        const partial = (i: number) => (i === n - 1 ? 800 : steady(i));
        // Exact on the means: the clipped window at the end holds k + 1
        // readings, so the day counts for 1/(k + 1) of it.
        const vals = Array.from({ length: n }, (_, i) => partial(i));
        const base = Array.from({ length: n }, (_, i) => steady(i));
        const moved =
            chRolling(base, k, chRuns(base, k))[n - 1]! -
            chRolling(vals, k, chRuns(vals, k))[n - 1]!;
        const departure = steady(n - 1) - 800;
        expect(moved).toBeCloseTo(departure / (k + 1), 9);

        // And on the drawn path, to its 0.1-unit rounding.
        const endOf = (f: (i: number) => number) => {
            const html = sparkMarkup({
                slots: daily("2025-08-01", n, f),
                key: "calories",
                goals,
            });
            return parse(trendD(html)).nodes.slice(-2);
        };
        const top = 2200 * 1.15;
        const perKcal = (chY(0, 0, top) - chY(1000, 0, top)) / 1000;
        const [, e0] = endOf(steady);
        const [p1, e1] = endOf(partial);
        const movedKcal = (e1![1] - e0![1]) / perKcal;
        expect(movedKcal).toBeGreaterThan(0);
        expect(movedKcal).toBeLessThanOrEqual(
            departure / (k + 1) + 0.2 / perKcal,
        );
        // No hook: the trend's last piece rises or falls under 2 units
        // (the symmetric shrink it replaced dropped ~15 here).
        expect(Math.abs(e1![1] - p1![1])).toBeLessThan(2);
    }
});

test("long range: the trend stays inside the readings' range and is calmer than them", () => {
    const n = 365;
    const html = sparkMarkup({
        slots: daily("2025-08-01", n, wob),
        key: "calories",
        goals,
    });
    const line = parse(lineD(html));
    const ys = line.nodes.map((p) => p[1]);
    const lo = Math.min(...ys);
    const hi = Math.max(...ys);
    const trend = parse(trendD(html));
    let travelT = 0;
    for (const seg of trend.segs) {
        const s = sample(seg, 8);
        for (const [, y] of s) {
            expect(y).toBeGreaterThanOrEqual(lo - EPS);
            expect(y).toBeLessThanOrEqual(hi + EPS);
        }
        for (let i = 1; i < s.length; i++)
            travelT += Math.abs(s[i]![1] - s[i - 1]![1]);
    }
    let travelL = 0;
    for (let i = 1; i < line.nodes.length; i++)
        travelL += Math.abs(line.nodes[i]![1] - line.nodes[i - 1]![1]);
    // Total vertical travel: the trend moves a small fraction of the scribble.
    expect(travelT).toBeLessThan(travelL / 4);
    // Thinned nodes (every ceil(k/2) = 4 days on a year), not one per reading.
    expect(trend.nodes.length).toBeLessThan(line.nodes.length / 3);
});

test("chRuns / chRolling: a gap past k breaks the run, nulls never count, ends are clipped means", () => {
    const vals = [10, null, 20, 30, null, null, null, null, 40, 50];
    const runs = chRuns(vals, 3);
    expect(runs).toEqual([
        [0, 2, 3],
        [8, 9],
    ]);
    // Every window is [max(start, i - k), min(end, i + k)] within its run:
    // 0..3 holds 10, 20, 30 for all three of the first run's slots.
    expect(chRolling(vals, 3, runs)).toEqual([
        20,
        null,
        20,
        20,
        null,
        null,
        null,
        null,
        45,
        45,
    ]);
    // Centred in the middle of a run, one-sided toward each end, and never
    // the raw end reading. A zero is a reading.
    const v2 = [0, 100, 200, 300, 400, 500, 600];
    expect(chRolling(v2, 3, chRuns(v2, 3))).toEqual([
        150, 200, 250, 300, 350, 400, 450,
    ]);
    const v3 = [100, 0, 100, 0, 100, 0, 100];
    const r3 = chRolling(v3, 1, chRuns(v3, 1));
    expect(r3[0]).toBe(50);
    expect(r3[3]).toBeCloseTo(200 / 3, 9);
    expect(r3[6]).toBe(50);
});

test("long range: a lapse longer than the window breaks the trend as well as the line", () => {
    // 90 days (k = 3): a 1-day hole is bridged by the trend, a 10-day one is not.
    const html = sparkMarkup({
        slots: daily("2026-03-01", 90, (i) =>
            i === 20 || (i >= 50 && i < 60) ? null : wob(i),
        ),
        key: "calories",
        goals,
    });
    expect(parse(trendD(html)).subpaths).toBe(2);
    expect(parse(lineD(html)).subpaths).toBe(3);
});

test("long range paint order: line → marks → trend → goal → dot", () => {
    const html = sparkMarkup({
        slots: daily("2025-08-01", 365, (i) => (i % 2 === 0 ? wob(i) : null)),
        key: "calories",
        goals,
    });
    const at = (s: string) => html.indexOf(s);
    expect(at('class="cline"')).toBeLessThan(at('class="cpt dense"'));
    expect(html.lastIndexOf('class="cpt dense"')).toBeLessThan(
        at('class="ctrend"'),
    );
    expect(at('class="ctrend"')).toBeLessThan(at('class="cgoal"'));
    expect(at('class="cgoal"')).toBeLessThan(at('class="chalo"'));
});

// GOLDEN PINS. Two renders in one process always agree, so the determinism
// test below cannot fail on its own; these can. A change to the tangents, the
// post-rounding clamp, the window, the clipped ends or the node stride shows
// up here, and updating them is a deliberate act.
test("golden: chCurve and chTrend emit exactly these strings", () => {
    expect(
        chCurve([
            [6, 40],
            [84, 12],
            [162, 30],
            [240, 30],
        ]),
    ).toBe(
        "M6.0 40.0C32.0 30.7 58.0 12.0 84.0 12.0C110.0 12.0 136.0 30.0 162.0 30.0C188.0 30.0 214.0 30.0 240.0 30.0",
    );
    const vals = Array.from({ length: 48 }, (_, i) =>
        i % 11 === 5 ? null : 1800 + ((i * 263) % 600),
    );
    const d = chTrend(
        vals,
        chPoints(
            vals.map((v) => v ?? 0),
            0,
            2760,
        ),
        0,
        2760,
    );
    expect(d.length).toBe(721);
    expect(d.startsWith("M6.0 17.1C12.6 16.9 19.3 16.7 25.9 16.5C32.6")).toBe(
        true,
    );
    expect(d.slice(-40)).toBe(".1 16.3C460.7 16.4 467.4 16.6 474.0 16.8");
    // The whole string, as a short hash rather than 721 characters.
    expect(Bun.hash(d).toString(16)).toBe("e38de10c0907d4fe");
});

test("the markup is deterministic (the landing page renders it at build time)", () => {
    const strip = (h: string) => h.replace(/cg\d+/g, "cg");
    for (const n of [14, 90, 365]) {
        const slots = daily("2025-08-01", n, (i) =>
            i % 7 === 3 ? null : wob(i),
        );
        const a = sparkMarkup({ slots, key: "calories", goals });
        const b = sparkMarkup({ slots, key: "calories", goals });
        expect(strip(a)).toBe(strip(b));
    }
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
