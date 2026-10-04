import { expect, test } from "bun:test";
import {
    ADDED_SUGAR_MISSING_CATEGORY,
    addedSugarError,
    addedSugarMissing,
    addedSugarMissingError,
    addedSugarMissingText,
    addedSugarRequiredAt,
    parseAddedSugarRequiredFrom,
    addedSugarExtra,
    buildAddedSugarMeta,
    dayAddedSugar,
    roundedAddedSugar,
} from "./added-sugar.js";
import type { Meal } from "./supabase.js";

function meal(id: string, fields: Partial<Meal> = {}): Meal {
    return {
        id,
        user_id: "u1",
        logged_at: "2026-06-01T12:00:00Z",
        meal_type: "lunch",
        description: "test meal",
        calories: 300,
        protein_g: 10,
        carbs_g: 40,
        fat_g: 10,
        fiber_g: null,
        sugar_g: null,
        added_sugar_g: null,
        alcohol_g: null,
        caffeine_mg: null,
        notes: null,
        idempotency_key: null,
        ...fields,
    };
}

// ---------- addedSugarError ----------

test("addedSugarError accepts added at or below total", () => {
    expect(addedSugarError(0, 0)).toBeNull();
    expect(addedSugarError(12, 18)).toBeNull();
    expect(addedSugarError(35, 35)).toBeNull();
});

test("addedSugarError only binds when both sides are known", () => {
    expect(addedSugarError(null, 10)).toBeNull();
    expect(addedSugarError(undefined, 10)).toBeNull();
    expect(addedSugarError(40, null)).toBeNull();
    expect(addedSugarError(40, undefined)).toBeNull();
    expect(addedSugarError(null, null)).toBeNull();
});

test("addedSugarError describes added above total", () => {
    expect(addedSugarError(20, 12.5)).toBe(
        "added_sugar_g (20 g) is more than sugar_g (12.5 g); added sugars are part of total sugars.",
    );
    expect(addedSugarError(9.96, 4.04)).toBe(
        "added_sugar_g (10 g) is more than sugar_g (4 g); added sugars are part of total sugars.",
    );
});

test("addedSugarError never prints two equal figures", () => {
    // Rounded to one decimal both read "10 g"; the message widens instead.
    expect(addedSugarError(10.04, 10)).toBe(
        "added_sugar_g (10.04 g) is more than sugar_g (10 g); added sugars are part of total sugars.",
    );
});

test("addedSugarError text describes rather than directs", () => {
    const msg = addedSugarError(5, 1)!;
    expect(msg).not.toMatch(/\b(you should|please|ask|offer|must)\b/i);
});

// ---------- dayAddedSugar ----------

test("dayAddedSugar is null when no meal that day carries it", () => {
    expect(dayAddedSugar([])).toBeNull();
    expect(
        dayAddedSugar([meal("a", { sugar_g: 20 }), meal("b", { sugar_g: 5 })]),
    ).toBeNull();
});

test("dayAddedSugar sums the carrying meals, a recorded 0 included", () => {
    expect(dayAddedSugar([meal("a", { added_sugar_g: 0 })])).toBe(0);
    expect(
        dayAddedSugar([
            meal("a", { sugar_g: 28, added_sugar_g: 0 }), // banana
            meal("b", { sugar_g: 35, added_sugar_g: 35 }), // cola
            meal("c", { sugar_g: 4 }), // not recorded, contributes nothing
        ]),
    ).toBe(35);
});

// ---------- buildAddedSugarMeta ----------

test("buildAddedSugarMeta carries only the goal when given nothing else", () => {
    expect(buildAddedSugarMeta({ goal: 25 })).toEqual({ v: 1, goal: 25 });
    expect(buildAddedSugarMeta({ goal: undefined })).toEqual({
        v: 1,
        goal: null,
    });
    // 0 is a real ceiling, never coerced to null.
    expect(buildAddedSugarMeta({ goal: 0 })).toEqual({ v: 1, goal: 0 });
});

test("buildAddedSugarMeta reports per-day totals with null for unrecorded days", () => {
    const meta = buildAddedSugarMeta({
        goal: 25,
        days: {
            "2026-06-01": [
                meal("a", { added_sugar_g: 10 }),
                meal("b", { added_sugar_g: 25 }),
            ],
            "2026-06-02": [meal("c", { sugar_g: 12 })],
            "2026-06-03": [],
            "2026-06-04": [meal("d", { added_sugar_g: 0 })],
        },
    });
    expect(meta.days).toEqual({
        "2026-06-01": 35,
        "2026-06-02": null,
        "2026-06-03": null,
        "2026-06-04": 0,
    });
    expect(meta.meals).toBeUndefined();
    expect(meta.contributors).toBeUndefined();
});

test("buildAddedSugarMeta keys per-meal values by id, null when unrecorded", () => {
    const meta = buildAddedSugarMeta({
        goal: null,
        meals: [
            meal("a", { added_sugar_g: 12.5 }),
            meal("b", { added_sugar_g: 0 }),
            meal("c"),
        ],
    });
    expect(meta.meals).toEqual({ a: 12.5, b: 0, c: null });
});

test("buildAddedSugarMeta counts contributors above zero only", () => {
    const meta = buildAddedSugarMeta({
        goal: 25,
        contributorsOf: [
            meal("a", { added_sugar_g: 12 }),
            meal("b", { added_sugar_g: 0 }),
            meal("c"),
            meal("d", { added_sugar_g: 0.5 }),
        ],
    });
    expect(meta.contributors).toBe(2);
    // An empty window is a real 0, not an absent field.
    expect(
        buildAddedSugarMeta({ goal: 25, contributorsOf: [] }).contributors,
    ).toBe(0);
});

// ---------- addedSugarExtra ----------

/** Breakdown-shaped rows that just name each meal, so the tests can see which
 * meal a row came from; the real formatting is mealBreakdown's (mcp.test.ts). */
const rowsFor = (meals: Meal[]) =>
    meals.map((m) => ({
        description: m.description,
        meal_type: m.meal_type,
        date: "2026-06-01",
    }));

test("addedSugarExtra lists the top added-sugar meals the kept rows miss, most first", () => {
    const meals = [
        meal("a", { description: "a", added_sugar_g: 5 }),
        meal("b", { description: "b", added_sugar_g: 30 }),
        meal("c", { description: "c", added_sugar_g: 12 }),
        meal("d", { description: "d", added_sugar_g: null }),
        meal("e", { description: "e", added_sugar_g: 0 }),
    ];
    // a is kept already; d (unrecorded) and e (0) never rank.
    expect(addedSugarExtra(meals, rowsFor(meals), [0, 3], 8)).toEqual([
        {
            description: "b",
            meal_type: "lunch",
            date: "2026-06-01",
            added_sugar_g: 30,
        },
        {
            description: "c",
            meal_type: "lunch",
            date: "2026-06-01",
            added_sugar_g: 12,
        },
    ]);
});

test("addedSugarExtra takes the overall top N first, then drops the kept ones", () => {
    // 10 meals, 10..1 g. Top 3 = indices 0,1,2; index 1 is kept, so only 0
    // and 2 come back — never index 3, which is outside the top 3.
    const meals = Array.from({ length: 10 }, (_, i) =>
        meal(`m${i}`, { description: `m${i}`, added_sugar_g: 10 - i }),
    );
    const extra = addedSugarExtra(meals, rowsFor(meals), [1], 3);
    expect(extra.map((r) => r.description)).toEqual(["m0", "m2"]);
});

test("addedSugarExtra is capped at N", () => {
    const meals = Array.from({ length: 20 }, (_, i) =>
        meal(`m${i}`, { description: `m${i}`, added_sugar_g: 1 + i }),
    );
    const extra = addedSugarExtra(meals, rowsFor(meals), [], 8);
    expect(extra).toHaveLength(8);
    expect(extra[0]!.description).toBe("m19");
    expect(extra[7]!.description).toBe("m12");
});

test("addedSugarExtra breaks ties to the earlier meal", () => {
    const meals = ["x", "y", "z"].map((id) =>
        meal(id, { description: id, added_sugar_g: 7 }),
    );
    expect(
        addedSugarExtra(meals, rowsFor(meals), [], 2).map((r) => r.description),
    ).toEqual(["x", "y"]);
});

test("addedSugarExtra rounds to one decimal, ranks on the rounded value and drops what rounds to 0", () => {
    const meals = [
        meal("a", { description: "a", added_sugar_g: 2.04 }),
        meal("b", { description: "b", added_sugar_g: 2.03 }),
        meal("c", { description: "c", added_sugar_g: 0.04 }),
        meal("d", { description: "d", added_sugar_g: 3.456 }),
    ];
    const extra = addedSugarExtra(meals, rowsFor(meals), [], 8);
    // a and b both read 2.0 → tie → earlier first; c reads 0.0 → gone.
    expect(extra.map((r) => [r.description, r.added_sugar_g])).toEqual([
        ["d", 3.5],
        ["a", 2],
        ["b", 2],
    ]);
});

test("addedSugarExtra is empty when every top added-sugar meal is already kept", () => {
    const meals = [
        meal("a", { description: "a", added_sugar_g: 9 }),
        meal("b", { description: "b", added_sugar_g: 4 }),
        meal("c", { description: "c" }),
    ];
    expect(addedSugarExtra(meals, rowsFor(meals), [0, 1], 8)).toEqual([]);
    expect(addedSugarExtra([], [], [], 8)).toEqual([]);
});

test("buildAddedSugarMeta carries extra only when given", () => {
    expect(buildAddedSugarMeta({ goal: 25 })).not.toHaveProperty("extra");
    const extra = [
        {
            description: "cola",
            meal_type: "snack",
            date: "2026-06-01",
            added_sugar_g: 30,
        },
    ];
    expect(buildAddedSugarMeta({ goal: 25, extra })).toEqual({
        v: 1,
        goal: 25,
        extra,
    });
});

// ---------- roundedAddedSugar: one rule for listing and counting ----------

test("roundedAddedSugar rounds to one decimal and keeps null as not recorded", () => {
    expect(roundedAddedSugar(meal("a"))).toBeNull();
    expect(roundedAddedSugar(meal("a", { added_sugar_g: 0 }))).toBe(0);
    expect(roundedAddedSugar(meal("a", { added_sugar_g: 0.04 }))).toBe(0);
    expect(roundedAddedSugar(meal("a", { added_sugar_g: 0.05 }))).toBe(0.1);
    expect(roundedAddedSugar(meal("a", { added_sugar_g: 3.456 }))).toBe(3.5);
});

test("contributors skip a meal that rounds to 0 g, which can never be listed", () => {
    // 9 meals of 1 g or more plus one 0.04 g: the widget can list at most the
    // 9, so "N more" (contributors − shown) must be computed from 9, not 10.
    const meals = [
        ...Array.from({ length: 9 }, (_, i) =>
            meal(`m${i}`, { description: `m${i}`, added_sugar_g: 1 + i }),
        ),
        meal("tiny", { description: "tiny", added_sugar_g: 0.04 }),
    ];
    const meta = buildAddedSugarMeta({ goal: 25, contributorsOf: meals });
    expect(meta.contributors).toBe(9);
    // Exactly the meals addedSugarExtra can ever rank.
    expect(addedSugarExtra(meals, rowsFor(meals), [], 100)).toHaveLength(9);
});

test("contributors count a meal that rounds up to 0.1 g", () => {
    const meals = [meal("a", { added_sugar_g: 0.05 })];
    expect(
        buildAddedSugarMeta({ goal: null, contributorsOf: meals }).contributors,
    ).toBe(1);
    expect(addedSugarExtra(meals, rowsFor(meals), [], 8)).toEqual([
        {
            description: "test meal",
            meal_type: "lunch",
            date: "2026-06-01",
            added_sugar_g: 0.1,
        },
    ]);
});

test("per-meal values use the same rounding, so a kept 0.04 g row is not listed", () => {
    // The widget lists a kept row when its meals value is > 0; at raw 0.04 it
    // would show "0.0 g" and be one more row than contributors counts.
    const meta = buildAddedSugarMeta({
        goal: null,
        meals: [
            meal("a", { added_sugar_g: 0.04 }),
            meal("b", { added_sugar_g: 0.05 }),
            meal("c", { added_sugar_g: 2.04 }),
            meal("d"),
        ],
        contributorsOf: [
            meal("a", { added_sugar_g: 0.04 }),
            meal("b", { added_sugar_g: 0.05 }),
            meal("c", { added_sugar_g: 2.04 }),
            meal("d"),
        ],
    });
    expect(meta.meals).toEqual({ a: 0, b: 0.1, c: 2, d: null });
    const listed = Object.values(meta.meals!).filter((v) => (v ?? 0) > 0);
    expect(listed).toHaveLength(meta.contributors!);
});

test("day totals sum raw values, not per-meal rounded ones", () => {
    // Three 0.04 g meals are 0.12 g that day, not 0.
    const day = [0, 1, 2].map((i) => meal(`m${i}`, { added_sugar_g: 0.04 }));
    expect(dayAddedSugar(day)).toBeCloseTo(0.12, 10);
});

test("parseAddedSugarRequiredFrom: unset/empty off, ISO on, anything else invalid", () => {
    expect(parseAddedSugarRequiredFrom(undefined)).toBe(null);
    expect(parseAddedSugarRequiredFrom("")).toBe(null);
    expect(parseAddedSugarRequiredFrom("  ")).toBe(null);
    expect(parseAddedSugarRequiredFrom("2026-10-20")).toBe(
        Date.parse("2026-10-20T00:00:00Z"),
    );
    expect(parseAddedSugarRequiredFrom("2026-10-20T09:30:00+03:00")).toBe(
        Date.parse("2026-10-20T06:30:00Z"),
    );
    expect(parseAddedSugarRequiredFrom("2026-10-20T06:30Z")).toBe(
        Date.parse("2026-10-20T06:30:00Z"),
    );
    // An offset-less time would depend on the host's zone.
    expect(parseAddedSugarRequiredFrom("2026-10-20T06:30:00")).toBe("invalid");
    expect(parseAddedSugarRequiredFrom("October 20 2026")).toBe("invalid");
    expect(parseAddedSugarRequiredFrom("true")).toBe("invalid");
    expect(parseAddedSugarRequiredFrom("2026-13-45")).toBe("invalid");
    // Shapes Date.parse would silently roll forward to another day.
    expect(parseAddedSugarRequiredFrom("2026-02-30")).toBe("invalid");
    expect(parseAddedSugarRequiredFrom("2025-02-29")).toBe("invalid");
    expect(parseAddedSugarRequiredFrom("2026-04-31T10:00Z")).toBe("invalid");
    expect(parseAddedSugarRequiredFrom("2026-02-30T10:00:00+02:00")).toBe(
        "invalid",
    );
    expect(parseAddedSugarRequiredFrom("2026-10-10T24:00Z")).toBe("invalid");
    expect(parseAddedSugarRequiredFrom("2026-10-10T23:60Z")).toBe("invalid");
    expect(parseAddedSugarRequiredFrom("2026-10-10T23:59:60Z")).toBe("invalid");
    expect(parseAddedSugarRequiredFrom("2026-10-10T10:00+25:00")).toBe(
        "invalid",
    );
    expect(parseAddedSugarRequiredFrom("2026-00-10")).toBe("invalid");
    expect(parseAddedSugarRequiredFrom("2026-10-00")).toBe("invalid");
    // Real edge dates still parse.
    expect(parseAddedSugarRequiredFrom("2028-02-29")).toBe(
        Date.parse("2028-02-29T00:00:00Z"),
    );
    expect(parseAddedSugarRequiredFrom("2026-12-31T23:59:59Z")).toBe(
        Date.parse("2026-12-31T23:59:59Z"),
    );
});

test("addedSugarRequiredAt is on from the instant, off before it and when unset", () => {
    const at = Date.parse("2026-10-20T00:00:00Z");
    expect(addedSugarRequiredAt("2026-10-20", at - 1)).toBe(false);
    expect(addedSugarRequiredAt("2026-10-20", at)).toBe(true);
    expect(addedSugarRequiredAt(undefined, at)).toBe(false);
    expect(addedSugarRequiredAt("garbage", at)).toBe(false);
});

test("addedSugarMissing: sugar_g given, added_sugar_g not, nothing stored", () => {
    expect(addedSugarMissing({ sugar_g: 35 })).toBe(true);
    expect(addedSugarMissing({ sugar_g: 0 })).toBe(true);
    expect(addedSugarMissing({ sugar_g: 35, added_sugar_g: 0 })).toBe(false);
    expect(addedSugarMissing({})).toBe(false);
    expect(addedSugarMissing({ added_sugar_g: 5 })).toBe(false);
    // update_meal: a stored added_sugar_g keeps the row complete.
    expect(addedSugarMissing({ sugar_g: 35 }, null)).toBe(true);
    expect(addedSugarMissing({ sugar_g: 35 }, 0)).toBe(false);
    expect(addedSugarMissing({ sugar_g: 35 }, 12)).toBe(false);
});

test("the refusal carries its own analytics category and describes, never directs", () => {
    const err = addedSugarMissingError("m1");
    expect(err.category).toBe(ADDED_SUGAR_MISSING_CATEGORY);
    expect(ADDED_SUGAR_MISSING_CATEGORY).toBe("added_sugar_missing");
    expect(err.message).toBe(addedSugarMissingText("m1"));
    expect(addedSugarMissingText()).toStartWith("Not saved:");
    expect(addedSugarMissingText("m1")).toContain("meal m1 is unchanged");
    for (const text of [addedSugarMissingText(), addedSugarMissingText("m1")]) {
        expect(text).toContain(
            "added_sugar_g is required whenever sugar_g is given",
        );
        expect(text).not.toMatch(
            /\bplease\b|\bmust\b|ask the user|\bretry\b|call again|you should/i,
        );
    }
});
