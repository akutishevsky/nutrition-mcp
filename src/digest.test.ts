import { describe, expect, test } from "bun:test";
import {
    computeDigest,
    digestMet,
    digestStatus,
    digestText,
    type DigestInput,
    type DigestPeriod,
} from "./digest.js";
import type { MealItemValues } from "./meal-items.js";
import type {
    Meal,
    NutritionGoals,
    WaterEntry,
    WeightEntry,
} from "./supabase.js";

// "Now" is Sat 24 Oct 2026, 17:40 in Kyiv (UTC+3 in October 2026: DST ends
// on the 25th), so local days are visibly not UTC days.
const NOW = new Date("2026-10-24T14:40:00Z");
const TZ = "Europe/Kyiv";

let seq = 0;
function meal(localDate: string, hhmm: string, over: Partial<Meal> = {}): Meal {
    // Kyiv is UTC+3 on every date these tests use.
    const [h, m] = hhmm.split(":").map(Number);
    const utc = new Date(`${localDate}T00:00:00Z`);
    utc.setUTCHours(h! - 3, m!);
    return {
        id: `m${++seq}`,
        user_id: "u",
        logged_at: utc.toISOString(),
        meal_type: "lunch",
        description: "Lentil soup",
        calories: 500,
        protein_g: 30,
        carbs_g: 60,
        fat_g: 15,
        fiber_g: 8,
        sugar_g: 5,
        added_sugar_g: 0,
        saturated_fat_g: 2,
        trans_fat_g: 0,
        sodium_mg: 600,
        alcohol_g: null,
        caffeine_mg: null,
        notes: null,
        idempotency_key: null,
        saved_meal_id: null,
        ...over,
    };
}
function water(localDate: string, hhmm: string, ml: number): WaterEntry {
    const m = meal(localDate, hhmm);
    return {
        id: `w${++seq}`,
        user_id: "u",
        amount_ml: ml,
        logged_at: m.logged_at,
        notes: null,
        created_at: "",
        idempotency_key: null,
    };
}
function weigh(localDate: string, kg: number): WeightEntry {
    return {
        id: `k${++seq}`,
        user_id: "u",
        weight_g: kg * 1000,
        logged_at: meal(localDate, "07:30").logged_at,
        notes: null,
        created_at: "",
        idempotency_key: null,
    };
}
const GOALS: NutritionGoals = {
    user_id: "u",
    daily_calories: 2000,
    daily_protein_g: 120,
    daily_carbs_g: null,
    daily_fat_g: null,
    daily_fiber_g: 30,
    daily_sugar_g: 40,
    daily_added_sugar_g: 25,
    daily_saturated_fat_g: 20,
    daily_sodium_mg: 2300,
    daily_caffeine_mg: 400,
    daily_alcohol_g: 0,
    daily_water_ml: 2500,
    target_weight_g: 75_000,
    updated_at: "",
};

function run(over: Partial<DigestInput> & { period: DigestPeriod }) {
    return computeDigest({
        now: NOW,
        tz: TZ,
        meals: [],
        water: [],
        weights: [],
        latestWeight: null,
        items: new Map(),
        goals: GOALS,
        alcohol: null,
        weightUnit: "kg",
        locale: "en",
        ...over,
    });
}
const row = (r: ReturnType<typeof run>, key: string) =>
    r.meta.metrics.find((m) => m.key === key);

describe("digestStatus and digestMet", () => {
    test("calories is a budget: on target from 90 % to 100 % of the goal", () => {
        expect(digestStatus("calories", 1850, 2000)).toBe("ok");
        expect(digestStatus("calories", 1700, 2000)).toBe("togo");
        expect(digestStatus("calories", 2001, 2000)).toBe("over");
        expect(digestMet("calories", 1800, 2000)).toBe(true);
        expect(digestMet("calories", 1790, 2000)).toBe(false);
    });
    test("protein, carbs, fat, fiber and water are targets to reach", () => {
        expect(digestStatus("protein_g", 119, 120)).toBe("togo");
        expect(digestStatus("fat_g", 90, 70)).toBe("ok");
        expect(digestStatus("water_ml", 2500, 2500)).toBe("ok");
    });
    test("a limit is over, near (within 10 %) or ok, and 0 is a real limit", () => {
        expect(digestStatus("sugar_g", 41, 40)).toBe("over");
        expect(digestStatus("sugar_g", 37, 40)).toBe("near");
        expect(digestStatus("sugar_g", 20, 40)).toBe("ok");
        expect(digestStatus("alcohol_g", 0, 0)).toBe("ok");
        expect(digestStatus("alcohol_g", 1, 0)).toBe("over");
    });
    test("nothing recorded is nr, no goal is none, and trans fat never has one", () => {
        expect(digestStatus("sodium_mg", null, 2300)).toBe("nr");
        expect(digestStatus("sodium_mg", 900, null)).toBe("none");
        expect(digestStatus("trans_fat_g", 1, 2)).toBe("none");
    });
});

describe("periods", () => {
    test("yesterday, today and both ranges end where they should", () => {
        expect(run({ period: "yesterday" }).structured).toMatchObject({
            start_date: "2026-10-23",
            end_date: "2026-10-23",
            days_in_range: 1,
        });
        expect(run({ period: "today" }).meta.as_of).toBe("17:40");
        expect(run({ period: "last_7_days" }).structured).toMatchObject({
            start_date: "2026-10-17",
            end_date: "2026-10-23",
            days_in_range: 7,
        });
        expect(run({ period: "last_30_days" }).structured).toMatchObject({
            start_date: "2026-09-24",
            end_date: "2026-10-23",
            days_in_range: 30,
        });
        expect(run({ period: "yesterday" }).meta.as_of).toBeNull();
    });

    test("days are local: a 23:30 Kyiv meal is filed on its local day", () => {
        const late = meal("2026-10-23", "23:30", { calories: 777 });
        // 20:30Z on the 23rd; still the 23rd locally.
        const r = run({ period: "yesterday", meals: [late] });
        expect(row(r, "calories")!.value).toBe(777);
    });

    test("today stops at now, and yesterday is compared up to the same clock time", () => {
        const r = run({
            period: "today",
            meals: [
                meal("2026-10-24", "08:00", { calories: 400 }),
                // After 17:40: not part of "so far" (a future-dated entry).
                meal("2026-10-24", "19:00", { calories: 900 }),
                meal("2026-10-23", "12:00", { calories: 600 }),
                meal("2026-10-23", "20:00", { calories: 1000 }),
            ],
        });
        expect(row(r, "calories")!.value).toBe(400);
        expect(r.meta.meals).toHaveLength(1);
        expect(r.meta.meals[0]!.time).toBe("08:00");
    });
});

describe("statuses, averages and the not-recorded rule", () => {
    test("a nutrient no meal records is not recorded, never zero", () => {
        const r = run({
            period: "yesterday",
            meals: [meal("2026-10-23", "12:00", { sodium_mg: null })],
        });
        expect(row(r, "sodium_mg")).toMatchObject({
            value: null,
            status: "nr",
        });
        expect(r.meta.not_recorded).toContain("sodium_mg");
        expect(r.structured.averages.sodium_mg).toBeNull();
    });

    test("range averages are per logged day and per recording day", () => {
        const r = run({
            period: "last_7_days",
            meals: [
                meal("2026-10-22", "12:00", {
                    calories: 1000,
                    sodium_mg: null,
                }),
                meal("2026-10-23", "12:00", { calories: 2000, sodium_mg: 800 }),
            ],
        });
        expect(r.structured.logged_days).toBe(2);
        expect(row(r, "calories")!.value).toBe(1500);
        expect(row(r, "sodium_mg")).toMatchObject({
            value: 800,
            recorded_days: 1,
        });
        expect(r.meta.partial).toEqual(
            expect.arrayContaining([{ key: "sodium_mg", days: 1 }]),
        );
        expect(r.meta.sparse).toBe(true);
        expect(r.meta.verdict?.[0]).toEqual({ c: "logged", n: 2, of: 7 });
    });

    test("the score and the day groups follow the statuses", () => {
        const r = run({
            period: "yesterday",
            meals: [
                meal("2026-10-23", "12:00", {
                    calories: 1900,
                    protein_g: 130,
                    sugar_g: 50,
                }),
            ],
        });
        expect(r.meta.groups.over).toContain("sugar_g");
        expect(r.meta.groups.ok).toContain("protein_g");
        expect(r.meta.groups.togo).toContain("fiber_g");
        expect(r.meta.verdict?.[0]).toEqual({ c: "cal_on_target" });
        expect(r.meta.verdict).toContainEqual({ c: "over", keys: ["sugar_g"] });
        const { met, of } = r.meta.score!;
        expect(of).toBe(
            r.meta.groups.over.length +
                r.meta.groups.near.length +
                r.meta.groups.togo.length +
                r.meta.groups.ok.length,
        );
        expect(met).toBe(r.meta.groups.ok.length + r.meta.groups.near.length);
    });
});

describe("no goals are ever invented", () => {
    test("without goals: no statuses, no score, no verdict, no rest of today", () => {
        const r = run({
            period: "today",
            goals: null,
            meals: [meal("2026-10-24", "12:00")],
        });
        expect(r.meta.has_goals).toBe(false);
        expect(r.meta.verdict).toBeNull();
        expect(r.meta.score).toBeNull();
        expect(r.meta.rest).toBeNull();
        expect(r.structured.goals).toBeNull();
        for (const m of r.meta.metrics) {
            expect(m.goal).toBeNull();
            expect(["none", "nr"]).toContain(m.status);
        }
        expect(r.meta.highlights.map((h) => h.code)).not.toContain("all_met");
    });
});

describe("alcohol only with tracking on", () => {
    const beer = meal("2026-10-23", "20:00", {
        description: "IPA",
        alcohol_g: 28,
        calories: 400,
    });
    test("off: no alcohol row, a null average and goal", () => {
        const r = run({ period: "yesterday", meals: [beer] });
        expect(row(r, "alcohol_g")).toBeUndefined();
        expect(r.structured.averages.alcohol_g).toBeNull();
        expect(r.structured.goals!.alcohol_g).toBeNull();
        expect(r.meta.drink_unit).toBeNull();
    });
    test("on: the row is there against its 0 g limit", () => {
        const r = run({ period: "yesterday", meals: [beer], alcohol: "uk" });
        expect(row(r, "alcohol_g")).toMatchObject({
            value: 28,
            goal: 0,
            status: "over",
        });
        expect(r.meta.drink_unit).toBe("uk");
    });
});

describe("water and weight", () => {
    test("water sums the day and weight is in the user's unit", () => {
        const r = run({
            period: "yesterday",
            meals: [meal("2026-10-23", "12:00")],
            water: [
                water("2026-10-23", "09:00", 500),
                water("2026-10-23", "15:00", 750),
            ],
            weights: [weigh("2026-10-20", 80), weigh("2026-10-23", 79.5)],
            weightUnit: "lb",
        });
        expect(r.meta.water).toMatchObject({ value_ml: 1250, goal_ml: 2500 });
        expect(r.meta.weight.unit).toBe("lb");
        expect(r.meta.weight.latest).toEqual({
            value: 175.3,
            date: "2026-10-23",
        });
        expect(r.meta.weight.previous?.date).toBe("2026-10-20");
        expect(r.meta.weight.on_day).toBe(true);
        expect(r.meta.weight.goal).toBe(165.3);
    });
    test("no recent weigh-in names the last one known", () => {
        const old = weigh("2026-09-01", 81);
        const r = run({
            period: "yesterday",
            weights: [old],
            latestWeight: old,
        });
        expect(r.meta.weight.latest).toBeNull();
        expect(r.meta.weight.last_known).toEqual({
            value: 81,
            date: "2026-09-01",
        });
    });
});

describe("meals and habits", () => {
    test("the day lists meals with local times and their items", () => {
        const m = meal("2026-10-23", "13:05", { description: "Salad" });
        const items = new Map<string, MealItemValues[]>([
            [
                m.id,
                [
                    {
                        position: 0,
                        name: "Leaves",
                        amount: 80,
                        unit: "g",
                        calories: 20,
                        protein_g: 1,
                        carbs_g: 3,
                        fat_g: 0,
                    } as MealItemValues,
                ],
            ],
        ]);
        const r = run({ period: "yesterday", meals: [m], items });
        expect(r.meta.meals[0]).toMatchObject({
            time: "13:05",
            name: "Salad",
            items: [{ name: "Leaves", amount: 80, unit: "g", calories: 20 }],
        });
    });
    test("a range reports typical times and top foods by calories", () => {
        const meals = [
            meal("2026-10-21", "08:00", {
                meal_type: "breakfast",
                description: "Oats",
                calories: 300,
            }),
            meal("2026-10-22", "08:20", {
                meal_type: "breakfast",
                description: "oats ",
                calories: 300,
            }),
            meal("2026-10-23", "08:40", {
                meal_type: "breakfast",
                description: "Eggs",
                calories: 400,
            }),
            meal("2026-10-23", "13:00", {
                meal_type: "lunch",
                description: "Pizza",
                calories: 900,
            }),
        ];
        const r = run({ period: "last_7_days", meals });
        expect(r.meta.habits!.times).toEqual([
            { type: "breakfast", time: "08:20" },
            { type: "lunch", time: "13:00" },
        ]);
        expect(r.meta.habits!.top[0]).toEqual({
            name: "Pizza",
            count: 1,
            calories: 900,
        });
        expect(r.meta.habits!.top[1]).toMatchObject({
            count: 2,
            calories: 600,
        });
        expect(r.meta.habits!.meals_per_day).toBe(1.3);
    });
});

describe("highlights are descriptive and drawn from the user's own log", () => {
    test("the biggest sugar source and the largest source of a limit gone over", () => {
        const r = run({
            period: "yesterday",
            meals: [
                meal("2026-10-23", "09:00", {
                    description: "Cola",
                    sugar_g: 53,
                    sodium_mg: 20,
                }),
                meal("2026-10-23", "13:00", {
                    description: "Ramen",
                    sugar_g: 6,
                    sodium_mg: 2650,
                }),
            ],
        });
        expect(r.meta.highlights).toContainEqual({
            code: "sugar_source",
            name: "Cola",
            count: 1,
            grams: 53,
            share: 90,
        });
        expect(r.meta.highlights).toContainEqual({
            code: "over_source",
            key: "sodium_mg",
            days: null,
            name: "Ramen",
            each: 2650,
            count: 1,
        });
    });

    test("a target fallen short names only a food the user has logged", () => {
        const yogurt = meal("2026-10-10", "16:00", {
            description: "Greek yogurt",
            protein_g: 20,
            calories: 150,
        });
        const day = meal("2026-10-23", "13:00", { protein_g: 40, fiber_g: 30 });
        const r = run({ period: "yesterday", meals: [yogurt, day] });
        const h = r.meta.highlights.find((x) => x.code === "short_source");
        expect(h).toMatchObject({
            key: "protein_g",
            name: "Greek yogurt",
            amount: 20,
        });

        // With no history that qualifies, nothing is named at all.
        const lone = run({
            period: "yesterday",
            meals: [meal("2026-10-23", "13:00", { protein_g: 5, fiber_g: 30 })],
        });
        expect(lone.meta.highlights.map((x) => x.code)).not.toContain(
            "short_source",
        );
    });

    test("with tracking off a drink with alcohol is never offered as an example", () => {
        const beer = meal("2026-10-10", "20:00", {
            description: "Protein beer",
            protein_g: 30,
            alcohol_g: 14,
            calories: 150,
        });
        const r = run({
            period: "yesterday",
            meals: [
                beer,
                meal("2026-10-23", "13:00", { protein_g: 20, fiber_g: 30 }),
            ],
        });
        expect(JSON.stringify(r.meta.highlights)).not.toContain("Protein beer");
    });

    test("at most three, and the calorie streak counts consecutive days in the zone", () => {
        const meals = [1, 2, 3, 4].map((i) =>
            meal(`2026-10-${String(24 - i).padStart(2, "0")}`, "12:00", {
                calories: 1900,
                protein_g: 120,
                fiber_g: 30,
            }),
        );
        const r = run({ period: "yesterday", meals });
        expect(r.meta.highlights.length).toBeLessThanOrEqual(3);
        expect(r.meta.highlights).toContainEqual({ code: "streak", days: 4 });
    });
});

describe("rest of today", () => {
    test("states remaining amounts and a food from the user's own log", () => {
        const shake = meal("2026-10-20", "16:00", {
            description: "Protein shake",
            protein_g: 40,
            calories: 210,
            sugar_g: 4,
        });
        const r = run({
            period: "today",
            meals: [
                shake,
                meal("2026-10-24", "12:00", { calories: 1000, protein_g: 50 }),
            ],
            water: [water("2026-10-24", "10:00", 1000)],
        });
        expect(r.meta.rest).toMatchObject({
            kcal_left: 1000,
            kcal_over: null,
            water_left_ml: 1500,
            food: {
                name: "Protein shake",
                key: "protein_g",
                amount: 40,
                calories: 210,
            },
        });
        expect(r.meta.rest!.togo).toContainEqual({
            key: "protein_g",
            amount: 70,
        });
    });
    test("only for today", () => {
        expect(
            run({ period: "yesterday", meals: [meal("2026-10-23", "12:00")] })
                .meta.rest,
        ).toBeNull();
    });
});

describe("trends", () => {
    test("a clear fall in sodium over two weeks is a falling card, good against a limit", () => {
        const meals: Meal[] = [];
        for (let i = 1; i <= 14; i++) {
            const d = new Date(Date.UTC(2026, 9, 24 - i))
                .toISOString()
                .slice(0, 10);
            meals.push(meal(d, "12:00", { sodium_mg: i <= 7 ? 1500 : 3000 }));
        }
        const r = run({ period: "yesterday", meals });
        const card = r.meta.trends.cards.find((c) => c.key === "sodium_mg");
        expect(card).toMatchObject({
            dir: "falling",
            tone: "good",
            a: 1500,
            b: 3000,
        });
        expect(card!.series).toHaveLength(14);
    });
    test("too few days to tell are listed, not drawn", () => {
        const r = run({
            period: "yesterday",
            meals: [meal("2026-10-23", "12:00")],
        });
        expect(r.meta.trends.cards).toHaveLength(0);
        expect(r.meta.trends.few).toContain("calories");
    });
});

describe("digestText", () => {
    test("states the figures, the goals and the period", () => {
        const r = run({
            period: "yesterday",
            meals: [meal("2026-10-23", "12:00", { calories: 2100 })],
        });
        const text = digestText(r);
        expect(text).toContain("Nutrition digest for 2026-10-23");
        expect(text).toContain("- Calories: 2100 kcal / goal 2000 kcal (over)");
        expect(text).toContain("- Sugar: 5 g / limit 40 g (met)");
        expect(text).toContain("Meals logged: 1.");
    });
    test("nothing logged says so", () => {
        expect(digestText(run({ period: "last_30_days" }))).toContain(
            "nothing logged",
        );
    });
});

describe("payload size stays proportional", () => {
    test("meal names are clipped and a range lists at most 40 meals per day", () => {
        const long = "x".repeat(500);
        const meals = Array.from({ length: 60 }, (_, i) =>
            meal(
                "2026-10-23",
                `${String(6 + Math.floor(i / 6)).padStart(2, "0")}:${String((i % 6) * 10).padStart(2, "0")}`,
                {
                    description: long,
                },
            ),
        );
        const r = run({ period: "last_7_days", meals });
        const day = r.meta.days.find((d) => d.date === "2026-10-23")!;
        expect(day.meals).toHaveLength(40);
        expect(day.meals[0]!.name.length).toBe(200);
    });
});
