import { test, expect, describe } from "bun:test";
import {
    MEAL_TYPES,
    BASE_MEAL_TYPES,
    isMealType,
    type MealType,
} from "./meal-types.js";

const MIGRATION = new URL(
    "../supabase/migrations/20261108120000_meal_types.sql",
    import.meta.url,
);

const EXPECTED_ORDER = [
    "breakfast",
    "second_breakfast",
    "lunch",
    "afternoon_snack",
    "dinner",
    "supper",
    "pre_workout",
    "post_workout",
    "snack",
];

describe("MEAL_TYPES", () => {
    test("holds the nine types in day order", () => {
        const actual: string[] = [...MEAL_TYPES];
        expect(actual).toEqual(EXPECTED_ORDER);
    });

    test("has no duplicates", () => {
        expect(new Set(MEAL_TYPES).size).toBe(MEAL_TYPES.length);
    });
});

describe("BASE_MEAL_TYPES", () => {
    test("is exactly the original four", () => {
        expect([...BASE_MEAL_TYPES]).toEqual([
            "breakfast",
            "lunch",
            "dinner",
            "snack",
        ]);
    });

    test("is a subsequence of MEAL_TYPES, in the same order", () => {
        const positions = BASE_MEAL_TYPES.map((t) => MEAL_TYPES.indexOf(t));
        for (const p of positions) expect(p).toBeGreaterThanOrEqual(0);
        expect(positions).toEqual([...positions].sort((a, b) => a - b));
    });
});

describe("isMealType", () => {
    test("accepts every declared type", () => {
        for (const t of MEAL_TYPES) expect(isMealType(t)).toBe(true);
    });

    test("rejects unknown values, casing and non-strings", () => {
        expect(isMealType("brunch")).toBe(false);
        expect(isMealType("Breakfast")).toBe(false);
        expect(isMealType("")).toBe(false);
        expect(isMealType(null)).toBe(false);
        expect(isMealType(undefined)).toBe(false);
        expect(isMealType(1)).toBe(false);
    });

    test("narrows to MealType", () => {
        const v: unknown = "supper";
        if (isMealType(v)) {
            const typed: MealType = v;
            expect(typed).toBe("supper");
        } else {
            throw new Error("supper should narrow");
        }
    });
});

describe("the migration's check constraints", () => {
    test("meals_meal_type_check lists exactly MEAL_TYPES", async () => {
        const sql = await Bun.file(MIGRATION).text();
        const m = sql.match(
            /meals_meal_type_check\s+check \(meal_type = any \(array\[([\s\S]*?)\]\)\)/,
        );
        expect(m).not.toBeNull();
        const values = [...m![1]!.matchAll(/'([a-z_]+)'/g)].map((x) => x[1]!);
        expect(values).toEqual([...MEAL_TYPES]);
    });

    test("saved_meals_meal_type_check lists exactly MEAL_TYPES", async () => {
        const sql = await Bun.file(MIGRATION).text();
        const m = sql.match(
            /saved_meals_meal_type_check\s+check \(meal_type in \(([\s\S]*?)\)\)/,
        );
        expect(m).not.toBeNull();
        const values = [...m![1]!.matchAll(/'([a-z_]+)'/g)].map((x) => x[1]!);
        expect(values).toEqual([...MEAL_TYPES]);
    });

    test("the migration drops the old meals constraint before re-adding it", async () => {
        const sql = await Bun.file(MIGRATION).text();
        expect(sql).toContain(
            "alter table public.meals drop constraint if exists meals_meal_type_check;",
        );
    });
});

describe("widget labels for the meal types", () => {
    // Every object in a locale's widget strings that names the meal types
    // (nutrition summary, meal-logged, goal progress, digest) must give each
    // of the nine types its own label: two types sharing one label show a
    // user two different meals as the same meal.
    function mealTypeMaps(node: unknown, out: Record<string, string>[] = []) {
        if (node && typeof node === "object") {
            const rec = node as Record<string, unknown>;
            if ("second_breakfast" in rec && "supper" in rec) {
                out.push(rec as Record<string, string>);
            }
            for (const v of Object.values(rec)) mealTypeMaps(v, out);
        }
        return out;
    }

    test("every locale gives the nine types distinct labels", async () => {
        const { WIDGET_STRINGS } = await import("./copy/widgets.js");
        let checked = 0;
        for (const [locale, strings] of Object.entries(WIDGET_STRINGS)) {
            for (const map of mealTypeMaps(strings)) {
                checked++;
                const labels = MEAL_TYPES.map((t) => map[t]);
                for (const label of labels) {
                    expect(label, `${locale} is missing a label`).toBeTruthy();
                }
                expect(
                    new Set(labels).size,
                    `${locale} repeats a meal-type label: ${labels.join(" | ")}`,
                ).toBe(MEAL_TYPES.length);
            }
        }
        // Three namespaces per locale, nine locales.
        expect(checked).toBeGreaterThanOrEqual(9 * 3);
    });
});
