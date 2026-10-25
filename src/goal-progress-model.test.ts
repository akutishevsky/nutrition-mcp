import { describe, expect, test } from "bun:test";
import {
    gpBiggest,
    gpDayMetaOf,
    gpBreakdown,
    gpFits,
    gpFoodsFor,
    gpGroups,
    gpHint,
    gpItemsFor,
    gpRestCells,
    gpRows,
    gpStatus,
    type GpDay,
    type GpFood,
    type GpMeal,
    type GpRow,
} from "./goal-progress-model.js";

const GOALS = {
    calories: 2200,
    protein: 160,
    carbs: 220,
    fat: 70,
    fiber: 30,
    sugar: 45,
    added_sugar: 25,
    saturated: 20,
    sodium: 2300,
    caffeine: 400,
    alcohol: 20,
    water: 2500,
};

function meal(name: string, v: GpMeal["v"], items: GpMeal["items"] = null) {
    return { name, type: "snack", time: "12:00", items, v } as GpMeal;
}

function day(over: Partial<GpDay> = {}): GpDay {
    return {
        today: true,
        alcoholOn: true,
        goals: GOALS,
        totals: {
            calories: 1500,
            protein: 100,
            carbs: 200,
            fat: 50,
            fiber: 20,
            sugar: 30,
            added_sugar: 10,
            saturated: 12,
            trans: 0.4,
            sodium: 1800,
            caffeine: 120,
            alcohol: 0,
            water: 1500,
        },
        meals: [meal("Oats", { calories: 400 })],
        water: [],
        hasLog: true,
        foods: null,
        ...over,
    };
}

const keyOf = (rows: readonly GpRow[]) => rows.map((r) => r.key);

describe("gpStatus", () => {
    test("a target is reached within its tolerance", () => {
        expect(gpStatus("target", "g", 159.96, 160)).toBe("ok");
        expect(gpStatus("target", "g", 159.9, 160)).toBe("togo");
        expect(gpStatus("target", "ml", 2496, 2500)).toBe("ok");
    });
    test("a target exceeded is still on track, never over", () => {
        expect(gpStatus("target", "g", 300, 220)).toBe("ok");
    });
    test("near is the last 5% of the budget and the last 10% of a limit", () => {
        expect(gpStatus("budget", "kcal", 2100, 2200)).toBe("near");
        expect(gpStatus("budget", "kcal", 2080, 2200)).toBe("ok");
        expect(gpStatus("limit", "g", 41, 45)).toBe("near");
        expect(gpStatus("limit", "g", 40, 45)).toBe("ok");
        expect(gpStatus("limit", "g", 45.04, 45)).toBe("near");
        expect(gpStatus("limit", "g", 45.1, 45)).toBe("over");
    });
    test("a limit of 0 is crossed by any amount and has no near", () => {
        expect(gpStatus("limit", "g", 0, 0)).toBe("ok");
        expect(gpStatus("limit", "g", 0.03, 0)).toBe("ok");
        expect(gpStatus("limit", "g", 1, 0)).toBe("over");
    });
});

describe("gpRows", () => {
    test("carbs and fat are targets, not limits", () => {
        const rows = gpRows(
            day({ totals: { ...day().totals, carbs: 300, fat: 100 } }),
        );
        const carbs = rows.find((r) => r.key === "carbs")!;
        expect(carbs.kind).toBe("target");
        expect(carbs.st).toBe("ok");
        expect(rows.find((r) => r.key === "fat")!.st).toBe("ok");
    });
    test("alcohol only with tracking on, and 0 when nothing was logged", () => {
        expect(keyOf(gpRows(day({ alcoholOn: false })))).not.toContain(
            "alcohol",
        );
        const on = gpRows(
            day({ totals: { ...day().totals, alcohol: null } }),
        ).find((r) => r.key === "alcohol")!;
        expect(on.t).toBe(0);
        expect(on.st).toBe("ok");
    });
    test("caffeine needs a recorded figure", () => {
        expect(
            keyOf(gpRows(day({ totals: { ...day().totals, caffeine: null } }))),
        ).not.toContain("caffeine");
    });
    test("a set limit with no day total is not recorded, never dropped", () => {
        const rows = gpRows(day({ totals: { ...day().totals, sodium: null } }));
        expect(rows.find((r) => r.key === "sodium")!.st).toBe("nr");
    });
    test("a goal that is not set is not a row; trans fat only when recorded", () => {
        const rows = gpRows(day({ goals: { ...GOALS, sodium: null } }));
        expect(keyOf(rows)).not.toContain("sodium");
        expect(rows.find((r) => r.key === "trans")!.st).toBe("none");
        expect(
            keyOf(gpRows(day({ totals: { ...day().totals, trans: 0 } }))),
        ).not.toContain("trans");
    });
    test("a day with no meals reads every meal nutrient as 0", () => {
        const rows = gpRows(
            day({
                meals: [],
                totals: { sodium: null, water: 500 },
            }),
        );
        expect(rows.find((r) => r.key === "sodium")!.t).toBe(0);
        expect(rows.find((r) => r.key === "water")!.t).toBe(500);
    });
});

describe("gpRestCells", () => {
    test("calories first, then what is to go, then over, near, then the closest limits", () => {
        const rows = gpRows(
            day({
                totals: {
                    ...day().totals,
                    sugar: 50,
                    sodium: 2200,
                },
            }),
        );
        const cells = gpRestCells(rows, 5);
        expect(cells.map((c) => [c.row.key, c.kind])).toEqual([
            ["calories", "calLeft"],
            ["protein", "toGo"],
            ["carbs", "toGo"],
            ["fat", "toGo"],
            ["fiber", "toGo"],
        ]);
        const few = gpRestCells(
            gpRows(
                day({
                    totals: {
                        ...day().totals,
                        protein: 160,
                        carbs: 220,
                        fat: 70,
                        fiber: 30,
                        water: 2500,
                        sugar: 50,
                        sodium: 2200,
                    },
                }),
            ),
            5,
        );
        expect(few.map((c) => [c.row.key, c.kind])).toEqual([
            ["calories", "calLeft"],
            ["sugar", "over"],
            ["sodium", "pct"],
            ["saturated", "pct"],
        ]);
    });
});

const FOODS: GpFood[] = [
    {
        name: "Greek yogurt",
        amount: 170,
        unit: "g",
        v: { calories: 125, protein: 17, sugar: 6, sodium: 60 },
    },
    {
        name: "Chicken breast",
        amount: 150,
        unit: "g",
        v: { calories: 248, protein: 46, sugar: 0, sodium: 110 },
    },
    {
        name: "Protein bar",
        amount: 60,
        unit: "g",
        v: { calories: 220, protein: 20, sugar: 18, sodium: 200 },
    },
];

describe("logged foods", () => {
    test("ranked by the nutrient per kcal, and only foods from the history", () => {
        const rows = gpRows(day());
        const protein = rows.find((r) => r.key === "protein")!;
        expect(gpFoodsFor(protein, rows, FOODS, 2).map((f) => f.name)).toEqual([
            "Chicken breast",
            "Greek yogurt",
        ]);
        expect(gpFoodsFor(protein, rows, null, 2)).toEqual([]);
        expect(gpFoodsFor(protein, rows, [], 2)).toEqual([]);
    });
    test("a food that would cross a near or over limit is left out", () => {
        const rows = gpRows(day({ totals: { ...day().totals, sugar: 50 } }));
        expect(gpFits(FOODS[2]!, rows)).toBe(false);
        expect(gpFits(FOODS[1]!, rows)).toBe(true);
    });
});

describe("gpHint", () => {
    test("over the budget comes first, with the water still to go", () => {
        const rows = gpRows(
            day({ totals: { ...day().totals, calories: 2400 } }),
        );
        const h = gpHint(rows, day());
        expect(h?.kind).toBe("over");
        expect(h?.kind === "over" && h.water?.key).toBe("water");
    });
    test("a logged food when one fits, else what is still to go", () => {
        const withFoods = day({ foods: FOODS });
        const h = gpHint(gpRows(withFoods), withFoods);
        expect(h?.kind === "food" && h.food.name).toBe("Chicken breast");
        expect(gpHint(gpRows(day()), day())?.kind).toBe("toGo");
    });
    test("no hint on a past day or a day with nothing logged", () => {
        expect(gpHint(gpRows(day()), day({ today: false }))).toBeNull();
        expect(gpHint(gpRows(day()), day({ hasLog: false }))).toBeNull();
    });
    test("everything on track", () => {
        const d = day({
            totals: {
                calories: 1500,
                protein: 160,
                carbs: 220,
                fat: 70,
                fiber: 30,
                sugar: 10,
                added_sugar: 0,
                saturated: 5,
                sodium: 1000,
                caffeine: 100,
                alcohol: 0,
                water: 2500,
            },
        });
        expect(gpHint(gpRows(d), d)).toEqual({ kind: "all" });
    });
});

describe("sources and breakdown", () => {
    const meals: GpMeal[] = [
        meal("Bowl", { sodium: 1100, caffeine: null }, [
            {
                name: "Teriyaki sauce",
                amount: 30,
                unit: "ml",
                v: { sodium: 880 },
                src: {},
            },
            {
                name: "Chicken",
                amount: 150,
                unit: "g",
                v: { sodium: 110 },
                src: {},
            },
        ]),
        meal("Cola", { sodium: 35, caffeine: 34 }),
        meal("Leftovers", { sodium: null, caffeine: null }),
    ];
    const row = (key: GpRow["key"], st: GpRow["st"] = "near") =>
        ({
            key,
            st,
            unit: "mg",
            kind: "limit",
            emoji: "",
            t: 0,
            g: 0,
        }) as GpRow;

    test("the biggest source is an ingredient when the meal lists them", () => {
        expect(gpBiggest(row("sodium"), meals)).toEqual({
            name: "Teriyaki sauce",
            amount: 30,
            unit: "ml",
            v: 880,
        });
    });
    test("unrecorded meals are listed last; optional nutrients are counted out", () => {
        const b = gpBreakdown(row("sodium"), meals);
        expect(b.rows.map((r) => [r.i, r.share])).toEqual([
            [0, 97],
            [1, 3],
            [2, null],
        ]);
        expect(b.missing).toBe(1);
        const c = gpBreakdown(row("caffeine"), meals);
        expect(c.rows.map((r) => r.i)).toEqual([1]);
        expect(c.none).toBe(2);
    });
    test("ingredients largest first", () => {
        expect(
            gpItemsFor("sodium", meals[0]!.items!).map((i) => i.name),
        ).toEqual(["Teriyaki sauce", "Chicken"]);
    });
    test("groups keep the metric order", () => {
        const g = gpGroups(gpRows(day()));
        expect(keyOf(g.togo)).toEqual([
            "protein",
            "carbs",
            "fat",
            "fiber",
            "water",
        ]);
        expect(g.trans?.key).toBe("trans");
    });
});

describe("gpDayMetaOf", () => {
    test("rebuilds the payload buildGoalDayMeta writes", async () => {
        const { buildGoalDayMeta } = await import("./goal-day.js");
        const meta = buildGoalDayMeta({
            meals: [
                {
                    logged_at: "2026-10-24T06:10:00Z",
                    calories: 400,
                    protein_g: 20,
                    carbs_g: 50,
                    fat_g: 10,
                    fiber_g: null,
                    sugar_g: 5,
                } as never,
            ],
            water: [
                { logged_at: "2026-10-24T07:00:00Z", amount_ml: 300 } as never,
            ],
            tz: "Europe/Kyiv",
            now: new Date("2026-10-24T17:45:00Z"),
            foods: [
                {
                    name: "Greek yogurt",
                    amount: 170,
                    unit: "g",
                    calories: 125,
                    protein_g: 17,
                    carbs_g: 6,
                    fat_g: 3.4,
                    fiber_g: 0,
                    sugar_g: 6,
                    added_sugar_g: 0,
                    saturated_fat_g: 2.1,
                    sodium_mg: 60,
                    caffeine_mg: null,
                },
            ],
        });
        const out = gpDayMetaOf(JSON.parse(JSON.stringify(meta)))!;
        expect(out.now).toBe("20:45");
        expect(out.meals).toEqual([{ missing: ["fiber_g"] }]);
        expect(out.water).toEqual([{ time: "10:00", ml: 300 }]);
        expect(out.foods?.[0]?.v.protein).toBe(17);
        expect(out.foods?.[0]?.v.caffeine).toBeNull();
    });
    test("anything malformed is dropped, never trusted", () => {
        expect(gpDayMetaOf(null)).toBeNull();
        expect(gpDayMetaOf({ v: 2 })).toBeNull();
        expect(gpDayMetaOf([])).toBeNull();
        const out = gpDayMetaOf({
            v: 1,
            now: "25:99",
            meals: [null, { time: "<b>", missing: ["x", "sugar_g", 3] }],
            water: [{ ml: -1 }, { ml: "5" }, { time: "08:00", ml: 250 }],
            foods: [
                { name: "x".repeat(61), calories: 1 },
                { name: "Ok", calories: "1" },
                { name: " Apple ", calories: 95, protein_g: -3, unit: 4 },
            ],
        })!;
        expect(out.now).toBeNull();
        expect(out.meals).toEqual([{ missing: [] }, { missing: ["sugar_g"] }]);
        expect(out.water).toEqual([{ time: "08:00", ml: 250 }]);
        expect(out.foods).toEqual([
            {
                name: "Apple",
                amount: null,
                unit: null,
                v: {
                    calories: 95,
                    protein: null,
                    carbs: null,
                    fat: null,
                    fiber: null,
                    sugar: null,
                    added_sugar: null,
                    saturated: null,
                    sodium: null,
                    caffeine: null,
                },
            },
        ]);
        expect(gpDayMetaOf({ v: 1 })!.foods).toBeNull();
    });
});
