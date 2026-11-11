import { describe, expect, test } from "bun:test";
import {
    dayPartForHour,
    findRestatement,
    fingerprintNextUpContext,
    isDaySettled,
    landingFor,
    landingText,
    missingIngredientsFor,
    namesMatch,
    pickDeterministicCandidate,
    quietLineFor,
    remainingBudget,
    scaleCandidateNutrition,
    secondaryLinesFor,
    targetSlotFor,
    textIsGrounded,
    validateComposition,
    type NextUpCandidate,
    type NextUpContext,
} from "./next-up.js";

function candidate(partial: Partial<NextUpCandidate> = {}): NextUpCandidate {
    return {
        id: "recipe:11111111-1111-4111-8111-111111111111",
        kind: "recipe",
        name: "Chicken rice bowl",
        recipe_id: "11111111-1111-4111-8111-111111111111",
        recipe_revision_id: "22222222-2222-4222-8222-222222222222",
        servings: 1,
        nutrition: { calories: 520, protein_g: 42, carbs_g: 48, fat_g: 16 },
        ingredient_names: ["Chicken breast", "Rice", "Broccoli"],
        uses_pantry: ["Chicken breast"],
        last_logged_date: null,
        ...partial,
    };
}

function context(partial: Partial<NextUpContext> = {}): NextUpContext {
    return {
        date: "2026-11-10",
        day_part: "midday",
        objective: "maintain",
        goals: {
            calories: 2000,
            protein_g: 120,
            carbs_g: 220,
            fat_g: 65,
        },
        totals: { calories: 900, protein_g: 55, carbs_g: 100, fat_g: 30 },
        filled_slots: ["breakfast"],
        planned: [],
        pantry: [
            {
                name: "Chicken breast",
                quantity: 2,
                unit: "pieces",
                stock_state: "available",
                updated_at: "2026-11-08T10:00:00.000Z",
            },
        ],
        grocery_names: [],
        candidates: [candidate()],
        features: { plan: true, recipes: true, groceries: true, pantry: true },
        ...partial,
    };
}

describe("next-up domain", () => {
    test("day parts split at 11 and 17", () => {
        expect(dayPartForHour(6)).toBe("morning");
        expect(dayPartForHour(10)).toBe("morning");
        expect(dayPartForHour(11)).toBe("midday");
        expect(dayPartForHour(16)).toBe("midday");
        expect(dayPartForHour(17)).toBe("evening");
        expect(dayPartForHour(23)).toBe("evening");
    });

    test("target slot is the day-part meal unless covered", () => {
        expect(targetSlotFor(context())).toBe("lunch");
        expect(
            targetSlotFor(context({ filled_slots: ["breakfast", "lunch"] })),
        ).toBe("dinner");
        expect(
            targetSlotFor(
                context({
                    filled_slots: ["breakfast", "lunch", "dinner"],
                }),
            ),
        ).toBe("snack");
        // Evening with dinner planned: the earliest still-open main
        // slot wins (lunch), and only a fully spoken-for day falls
        // through to snack.
        expect(
            targetSlotFor(
                context({
                    day_part: "evening",
                    planned: [
                        {
                            meal_slot: "dinner",
                            recipe_name: "Soup",
                            recipe_id: "x",
                            recipe_revision_id: "y",
                            servings: 1,
                            nutrition_per_serving: null,
                        },
                    ],
                }),
            ),
        ).toBe("lunch");
        expect(
            targetSlotFor(
                context({
                    day_part: "evening",
                    filled_slots: ["breakfast", "lunch"],
                    planned: [
                        {
                            meal_slot: "dinner",
                            recipe_name: "Soup",
                            recipe_id: "x",
                            recipe_revision_id: "y",
                            servings: 1,
                            nutrition_per_serving: null,
                        },
                    ],
                }),
            ),
        ).toBe("snack");
    });

    test("remaining budget and landing math come from the context", () => {
        const ctx = context();
        expect(remainingBudget(ctx)).toEqual({
            calories: 1100,
            protein_g: 65,
            carbs_g: 120,
            fat_g: 35,
        });
        const landing = landingFor(ctx, candidate(), 1);
        expect(landing.calories).toBe(1420);
        expect(landing.protein_g).toBe(97);
        expect(landing.protein_goal_met).toBe(false);
        expect(landing.within_calorie_goal).toBe(true);
        const text = landingText(ctx, landing);
        expect(text).toContain("1,420 kcal");
        expect(text).toContain("23 g of protein still to go");
    });

    test("scaling a candidate scales every nutrient", () => {
        expect(scaleCandidateNutrition(candidate(), 2)).toEqual({
            calories: 1040,
            protein_g: 84,
            carbs_g: 96,
            fat_g: 32,
        });
    });

    test("names match on token containment", () => {
        expect(namesMatch("Chicken breast", "chicken")).toBe(true);
        expect(namesMatch("Greek yogurt", "Yogurt, Greek")).toBe(true);
        expect(namesMatch("Rice", "Rice vinegar")).toBe(true);
        expect(namesMatch("Rice", "Beans")).toBe(false);
    });

    test("missing ingredients exclude pantry and grocery coverage", () => {
        const ctx = context({ grocery_names: ["Broccoli"] });
        expect(missingIngredientsFor(candidate(), ctx)).toEqual(["Rice"]);
        expect(
            missingIngredientsFor(
                candidate(),
                context({ grocery_names: ["Broccoli", "Rice"] }),
            ),
        ).toEqual([]);
    });

    test("a settled day needs dinner covered and targets essentially met", () => {
        expect(isDaySettled(context())).toBe(false);
        expect(
            isDaySettled(
                context({
                    filled_slots: ["breakfast", "lunch", "dinner"],
                    totals: {
                        calories: 1950,
                        protein_g: 118,
                        carbs_g: 210,
                        fat_g: 60,
                    },
                }),
            ),
        ).toBe(true);
        expect(
            isDaySettled(
                context({
                    planned: [
                        {
                            meal_slot: "dinner",
                            recipe_name: "Soup",
                            recipe_id: "x",
                            recipe_revision_id: "y",
                            servings: 1,
                            nutrition_per_serving: null,
                        },
                    ],
                    totals: {
                        calories: 1500,
                        protein_g: 60,
                        carbs_g: 100,
                        fat_g: 30,
                    },
                }),
            ),
        ).toBe(false);
    });

    test("the brief's example quiet line appears for a planned, on-track day", () => {
        const line = quietLineFor(
            context({
                planned: [
                    {
                        meal_slot: "dinner",
                        recipe_name: "Tomato soup",
                        recipe_id: "x",
                        recipe_revision_id: "y",
                        servings: 1,
                        nutrition_per_serving: null,
                    },
                ],
                totals: {
                    calories: 1900,
                    protein_g: 115,
                    carbs_g: 200,
                    fat_g: 60,
                },
                pantry: [],
            }),
        );
        expect(line).toBe(
            "You're set for today — dinner is planned and nothing in the pantry needs using up.",
        );
    });

    test("deterministic pick prefers the pantry use-first candidate", () => {
        const other = candidate({
            id: "recipe:33333333-3333-4333-8333-333333333333",
            name: "Beef stew",
            uses_pantry: [],
            nutrition: { calories: 600, protein_g: 65, carbs_g: 30, fat_g: 28 },
        });
        const pick = pickDeterministicCandidate(
            context({ candidates: [other, candidate()] }),
        );
        expect(pick?.candidate_id).toBe(candidate().id);
        expect(pick?.reason).toContain("chicken breast");
        expect(pick?.source).toBe("deterministic");
    });

    test("secondary lines are typed signals: one beside a primary, priority-ordered", () => {
        const ctx = context({
            pantry: [
                {
                    name: "Spinach",
                    quantity: 1,
                    unit: "bag",
                    stock_state: "low",
                    updated_at: "2026-11-07T10:00:00.000Z",
                },
                {
                    name: "Chicken breast",
                    quantity: 2,
                    unit: "pieces",
                    stock_state: "available",
                    updated_at: "2026-11-08T10:00:00.000Z",
                },
            ],
            planned: [
                {
                    meal_slot: "dinner",
                    recipe_name: "Tomato soup",
                    recipe_id: "x",
                    recipe_revision_id: "y",
                    servings: 1,
                    nutrition_per_serving: null,
                },
            ],
        });
        const lines = secondaryLinesFor(ctx, candidate());
        // With a primary on screen the height budget carries ONE
        // secondary line; the highest-priority signal (use-first)
        // wins over the planned-dinner note.
        expect(lines.length).toBe(1);
        expect(lines[0]?.kind).toBe("use_first");
        expect(lines[0]?.text).toContain("spinach");
        for (const line of lines) {
            expect(findRestatement(line.text)).toBeNull();
        }
        // Without the use-first signal, the planned line surfaces.
        const plannedOnly = secondaryLinesFor(
            context({
                pantry: [],
                planned: [
                    {
                        meal_slot: "dinner",
                        recipe_name: "Tomato soup",
                        recipe_id: "x",
                        recipe_revision_id: "y",
                        servings: 1,
                        nutrition_per_serving: null,
                    },
                ],
            }),
            candidate(),
        );
        expect(plannedOnly.map((line) => line.kind)).toEqual(["planned"]);
    });

    test("D1 tripwire catches the old panel's restatements and the raw enum", () => {
        expect(
            findRestatement("Protein recorded so far: 55 g of a 120 g target."),
        ).not.toBeNull();
        expect(
            findRestatement(
                "No food is recorded for today yet; this is not evidence that you have eaten nothing.",
            ),
        ).not.toBeNull();
        expect(findRestatement("Objective: track_only")).not.toBeNull();
        expect(
            findRestatement(
                "It uses the chicken — the pantry item that's been sitting longest.",
            ),
        ).toBeNull();
    });

    test("grounding: reason text may only cite context numbers", () => {
        const ctx = context();
        expect(textIsGrounded("It closes the 65 g protein gap.", ctx)).toBe(
            true,
        );
        expect(textIsGrounded("It has 999 g of protein.", ctx)).toBe(false);
        expect(
            textIsGrounded("You logged it recently and it fit well.", ctx),
        ).toBe(true);
    });

    test("composition validation rejects unknown candidates and invented numbers", () => {
        const ctx = context();
        expect(
            validateComposition(
                {
                    candidate_id: candidate().id,
                    servings: 1,
                    reason: "It uses the chicken breast from your pantry.",
                },
                ctx,
            )?.source,
        ).toBe("model");
        expect(
            validateComposition(
                {
                    candidate_id: "recipe:nope",
                    servings: 1,
                    reason: "It uses the chicken breast from your pantry.",
                },
                ctx,
            ),
        ).toBeNull();
        expect(
            validateComposition(
                {
                    candidate_id: candidate().id,
                    servings: 1,
                    reason: "It packs 400 g of protein.",
                },
                ctx,
            ),
        ).toBeNull();
        expect(
            validateComposition(
                {
                    candidate_id: candidate().id,
                    servings: 9,
                    reason: "It uses the chicken breast from your pantry.",
                },
                ctx,
            ),
        ).toBeNull();
    });

    test("fingerprint is stable for identical context and moves on a meal log", () => {
        const a = fingerprintNextUpContext(context());
        const b = fingerprintNextUpContext(context());
        expect(a).toBe(b);
        const afterLog = fingerprintNextUpContext(
            context({
                totals: {
                    calories: 1420,
                    protein_g: 97,
                    carbs_g: 148,
                    fat_g: 46,
                },
                filled_slots: ["breakfast", "lunch"],
            }),
        );
        expect(afterLog).not.toBe(a);
        const afterPantryChange = fingerprintNextUpContext(
            context({
                pantry: [
                    {
                        name: "Chicken breast",
                        quantity: 1,
                        unit: "pieces",
                        stock_state: "low",
                        updated_at: "2026-11-10T10:00:00.000Z",
                    },
                ],
            }),
        );
        expect(afterPantryChange).not.toBe(a);
    });
});
