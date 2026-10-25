// Behaviour tests for the day-view partials (shared/gauge.js and
// shared/nutrients.js) that meal-logged and nutrition-summary are built from.
//
// Like macros.test.ts, the partials are evaluated the way the assembler splices
// them into a page — i18n.js, macros.js, gauge.js, nutrients.js, in the
// templates' include order, with the fmt/esc helpers each template defines —
// so the rules are pinned against the code that actually ships.
import { describe, expect, test } from "bun:test";
import { WIDGET_STRINGS_EN } from "../../src/copy/widgets";
import { PROVENANCE_NUTRIENT_KEYS } from "../../src/provenance";

const SRC = "./public/widgets/src";

function fmt(n: number, decimals?: number) {
    if (n == null || isNaN(n)) return "0";
    const r = decimals ? n.toFixed(decimals) : Math.round(n);
    return Number(r).toLocaleString("en");
}
const esc = (s: unknown) =>
    String(s).replace(
        /[&<>"]/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
    );

type Seg = { from: number; to: number; rep: number; kcal: number };
type Status = { text: string; st: string; over: boolean; near: boolean };
type Row = Record<string, unknown> & { items?: Record<string, unknown>[] };
type ViewMeal = { id: string; vals: Record<string, unknown>; cur: boolean };

const api = await (async () => {
    const parts = await Promise.all(
        ["i18n", "macros", "gauge", "nutrients"].map((f) =>
            Bun.file(`${SRC}/shared/${f}.js`).text(),
        ),
    );
    const factory = new Function(
        "fmt",
        "esc",
        "WIDGET_STRINGS",
        `${parts.join("\n")}\nreturn { gaugeSegments, nvStatus, mealTimesPayload, withItemSodium, mealItemsPayload, nvMealsFrom, nvDayHidden, nvBodyHtml, nvMoreHtml, nvStripHtml, SOURCE_NUTRIENT_KEYS };`,
    );
    return factory(fmt, esc, { en: WIDGET_STRINGS_EN }) as {
        gaugeSegments: (
            meals: { kcal: number; name: string }[],
            goal: number,
        ) => Seg[] | null;
        nvStatus: (
            kind: string,
            t: number | null,
            g: number | null,
            hasGoal: boolean,
            unit: string,
            V: Record<string, unknown>,
            key: string,
        ) => Status;
        mealTimesPayload: (
            raw: unknown,
            n: number,
        ) => { times: string[]; current: number | null } | null;
        withItemSodium: (payload: unknown, rows: Row[]) => Row[];
        mealItemsPayload: (raw: unknown) => unknown;
        nvMealsFrom: (
            rows: Row[],
            sub: (r: Row, i: number) => string,
            cur: number,
        ) => ViewMeal[];
        nvDayHidden: (
            V: Record<string, unknown>,
            key: string,
            list: { v: number | null }[],
        ) => number;
        nvBodyHtml: (
            V: Record<string, unknown>,
            row: Record<string, unknown>,
            st: Record<string, unknown>,
            enter: boolean,
        ) => string;
        nvMoreHtml: (
            V: Record<string, unknown>,
            key: string,
            rowsLen: number,
            shown: number,
        ) => string;
        nvStripHtml: (
            V: Record<string, unknown>,
            key: string,
            k: number,
            goal: number | null,
            kind: string,
        ) => string;
        SOURCE_NUTRIENT_KEYS: string[];
    };
})();

describe("the by-day strip's goal line", () => {
    // Bars are a share of .dbars' content box (68px less its 6px top
    // padding); the absolutely-positioned line is a share of the padding
    // box, so it must take the same 6px off or it sits ~10% above the bars.
    test("is placed against the bars' own box", () => {
        const V = {
            days: [
                { logged: true, vals: { calories: 2410 } },
                { logged: true, vals: { calories: 1800 } },
            ],
        };
        const html = api.nvStripHtml(V, "calories", 1, 2200, "ceil");
        const mx = 2410 * 1.08;
        expect(html).toContain(
            `bottom:calc((100% - 6px) * ${(2200 / mx).toFixed(4)})`,
        );
    });
});

test("macros.js tags every nutrient the server records a source for", () => {
    // Drift here silently drops the source word on that nutrient's
    // ingredients (sodium was missing once).
    expect([...api.SOURCE_NUTRIENT_KEYS].sort()).toEqual(
        [...PROVENANCE_NUTRIENT_KEYS].sort(),
    );
});

describe("gaugeSegments", () => {
    const m = (kcal: number, name = "x") => ({ kcal, name });

    test("nothing to split: one meal, nothing eaten, or no goal", () => {
        expect(api.gaugeSegments([m(500)], 2000)).toBeNull();
        expect(api.gaugeSegments([m(0), m(0)], 2000)).toBeNull();
        expect(api.gaugeSegments([m(500), m(400)], 0)).toBeNull();
        expect(api.gaugeSegments(null as never, 2000)).toBeNull();
    });

    test("one segment per meal when every boundary is wide enough", () => {
        const segs = api.gaugeSegments([m(500), m(600), m(700)], 2000)!;
        expect(segs.map((s) => [s.from, s.to])).toEqual([
            [0, 0],
            [1, 1],
            [2, 2],
        ]);
        expect(segs.reduce((n, s) => n + s.kcal, 0)).toBe(1800);
    });

    test("a tiny snack merges into its neighbour, represented by the larger meal", () => {
        const segs = api.gaugeSegments([m(600), m(5), m(700)], 2000)!;
        expect(segs).toHaveLength(2);
        const merged = segs.find((s) => s.to - s.from === 1)!;
        // The snack's end sits too close to breakfast's, so it joins the
        // segment after it.
        expect([merged.from, merged.to]).toEqual([1, 2]);
        expect(merged.kcal).toBe(705);
        expect(merged.rep).toBe(2);
    });

    test("more than 8 segments falls back to the solid arc", () => {
        const nine = Array.from({ length: 9 }, () => m(200));
        expect(api.gaugeSegments(nine, 2000)).toBeNull();
        expect(api.gaugeSegments(nine.slice(1), 2000)).toHaveLength(8);
    });
});

describe("nvStatus", () => {
    const V = { drinkUnit: null };
    const st = (
        kind: string,
        t: number | null,
        g: number | null,
        key = "protein_g",
    ) => api.nvStatus(kind, t, g, g != null, "g", V, key);

    test("targets: on target within ±5%, else to go / above", () => {
        expect(st("target", 95, 100).st).toBe("ok");
        expect(st("target", 105, 100).st).toBe("ok");
        expect(st("target", 94.9, 100).st).toBe("low");
        expect(st("target", 105.1, 100).st).toBe("near");
        expect(st("target", 50, 100).text).toContain("50");
    });

    test("ceilings: near from 90%, over above the limit", () => {
        expect(st("ceil", 89, 100, "sugar_g").st).toBe("ok");
        expect(st("ceil", 90, 100, "sugar_g").st).toBe("near");
        expect(st("ceil", 100, 100, "sugar_g").over).toBe(false);
        expect(st("ceil", 101, 100, "sugar_g").over).toBe(true);
    });

    test("a ceiling of 0 is an active limit: anything above it is over", () => {
        expect(st("ceil", 0, 0, "added_sugar_g").st).toBe("ok");
        expect(st("ceil", 1, 0, "added_sugar_g").over).toBe(true);
    });

    test("no goal: 'no limit' for a ceiling, 'no goal set' for the rest", () => {
        expect(st("ceil", 10, null, "sugar_g").text).toBe(
            WIDGET_STRINGS_EN.nutritionSummary.noLimit,
        );
        expect(st("target", 10, null).text).toBe(
            WIDGET_STRINGS_EN.macros.noGoalSet,
        );
    });

    test("an unknown figure carries no status", () => {
        expect(st("ceil", null, 100, "sugar_g")).toEqual({
            text: "",
            st: "zero",
            over: false,
            near: false,
        });
    });
});

describe("mealTimesPayload (untrusted _meta)", () => {
    test("valid payload passes through", () => {
        expect(
            api.mealTimesPayload(
                { v: 1, times: ["08:10", "13:00"], current: 1 },
                2,
            ),
        ).toEqual({ times: ["08:10", "13:00"], current: 1 });
    });

    test("wrong length, wrong version or a non-object is dropped", () => {
        expect(api.mealTimesPayload({ v: 1, times: ["08:10"] }, 2)).toBeNull();
        expect(api.mealTimesPayload({ v: 2, times: ["08:10"] }, 1)).toBeNull();
        expect(api.mealTimesPayload("08:10", 1)).toBeNull();
        expect(api.mealTimesPayload(null, 0)).toBeNull();
    });

    test("a malformed time is blanked, the rest kept", () => {
        expect(
            api.mealTimesPayload(
                { v: 1, times: ["8:10", "<b>", 1210, "12:10"] },
                4,
            )!.times,
        ).toEqual(["", "", "", "12:10"]);
    });

    test("an out-of-range or non-integer `current` is null", () => {
        for (const current of [-1, 2, 0.5, "1", null])
            expect(
                api.mealTimesPayload({ v: 1, times: ["a", "b"], current }, 2)!
                    .current,
            ).toBeNull();
    });
});

describe("withItemSodium", () => {
    const raw = {
        v: 1,
        meals: [
            [
                {
                    name: "Bread",
                    calories: 80,
                    protein_g: 3,
                    carbs_g: 15,
                    fat_g: 1,
                    sodium_mg: 150,
                },
                {
                    name: "Butter",
                    calories: 70,
                    protein_g: 0,
                    carbs_g: 0,
                    fat_g: 8,
                },
            ],
            null,
        ],
    };

    test("puts each item's sodium back by position, null when absent", () => {
        const rows: Row[] = [
            {
                description: "Toast",
                items: [{ name: "Bread" }, { name: "Butter" }],
            },
            { description: "Tea" },
        ];
        const out = api.withItemSodium(raw, rows);
        expect(out[0]!.items!.map((i) => i.sodium_mg)).toEqual([150, null]);
        expect(out[1]).toBe(rows[1]!);
    });

    test("a misaligned payload leaves the rows as they were", () => {
        const rows: Row[] = [
            { description: "Toast", items: [{ name: "Bread" }] },
        ];
        expect(api.withItemSodium(raw, rows)).toBe(rows);
        const two: Row[] = [
            { description: "Toast", items: [{ name: "Bread" }] },
            { description: "Tea" },
        ];
        expect(api.withItemSodium(raw, two)[0]).toBe(two[0]!);
    });

    test("a non-finite sodium is null, never a string", () => {
        const bad = {
            v: 1,
            meals: [
                [
                    {
                        name: "Salt",
                        calories: 0,
                        protein_g: 0,
                        carbs_g: 0,
                        fat_g: 0,
                        sodium_mg: "999",
                    },
                ],
            ],
        };
        const rows: Row[] = [
            { description: "Salt", items: [{ name: "Salt" }] },
        ];
        expect(
            api.withItemSodium(bad, rows)[0]!.items![0]!.sodium_mg,
        ).toBeNull();
    });
});

describe("a trimmed one-day summary says what it leaves out", () => {
    // get_nutrition_summary keeps each metric's top 8 even for one day, so a
    // day of 10 meals can arrive with 8 rows; meal_count says 10.
    const rows = Array.from({ length: 8 }, (_, i) => ({
        description: `Meal ${i}`,
        calories: 300 + i,
        protein_g: 10,
        caffeine_mg: i < 2 ? 80 : null,
    }));
    const meals = api.nvMealsFrom(rows, () => "", -1);
    const base = {
        mode: "day",
        dayWord: "today",
        meals,
        bounded: true,
        mealTotal: 10,
        nLogged: 1,
        drinkUnit: null,
    };
    const row = (key: string, unit = "g") => ({
        key,
        unit,
        k: 1,
        label: key,
        t: 100,
        nr: false,
        status: { text: "", over: false },
        def: { kind: "ceil" },
    });

    test("a list of every meal names the whole day and the hidden rows", () => {
        expect(api.nvDayHidden(base, "calories", [])).toBe(2);
        const html = api.nvBodyHtml(base, row("calories", "kcal"), {}, false);
        expect(html).toContain("By meal · 10 meals");
        expect(html).toContain("+ 2 smaller meals");
    });

    test("a sparse list counts from _meta's contributors when present", () => {
        const V = { ...base, contributors: { caffeine_mg: 3 } };
        const html = api.nvBodyHtml(V, row("caffeine_mg", "mg"), {}, false);
        expect(html).toContain("By meal · 3 meals");
        expect(html).toContain("+ 1 smaller meal");
    });

    test("without _meta a sparse list hedges", () => {
        const html = api.nvBodyHtml(base, row("caffeine_mg", "mg"), {}, false);
        expect(html).toContain(WIDGET_STRINGS_EN.macros.moreMealsMaybe);
    });

    test("an untrimmed day adds nothing", () => {
        const V = { ...base, mealTotal: 8 };
        expect(api.nvDayHidden(V, "calories", [])).toBe(0);
        const html = api.nvBodyHtml(V, row("calories", "kcal"), {}, false);
        expect(html).toContain("By meal · 8 meals");
        expect(html).not.toContain("smaller meal");
    });
});
