import { describe, expect, spyOn, test } from "bun:test";
import { z } from "zod";
import { addedSugarMissingText } from "../../added-sugar.js";
import {
    MEAL_BREAKDOWN_TOP_N,
    MEAL_ITEMS_META_KEY,
    missingNutrientNote,
} from "../../mcp.js";
import { type MealItemValues } from "../../meal-items.js";
import type { Meal } from "../../supabase.js";
import { getWidgetHtml } from "../../widgets.js";
import {
    BURGER_ITEMS,
    db,
    ingredient,
    meal,
    MEAL_ID,
    OTHER_SAVED_ID,
    SAVED_ID,
    savedMealId,
    savedMealRow,
    storedMeal,
    textOf,
    type ToolResult,
    withAddedSugarGate,
    withTools,
} from "../test-harness.js";

export function registerSavedMealSuites(): void {
    describe("log_meal with items", () => {
        test("sums the items into the meal totals and stores the items", async () => {
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "Burger",
                    meal_type: "lunch",
                    items: BURGER_ITEMS,
                });
                expect(r.isError).toBeFalsy();
                const row = db.inserted[0]!;
                expect(row.calories).toBeCloseTo(450.5);
                expect(row.protein_g).toBe(30);
                expect(row.fiber_g).toBe(1);
                const stored = row.items as MealItemValues[];
                expect(stored.map((i) => i.position)).toEqual([1, 2]);
                expect(stored[1]!.amount).toBe(120);
                expect(textOf(r)).toContain("Items:");
                expect(textOf(r)).toContain("2. Котлета — 120 g");
            });
        });

        test("refuses totals sent beside items", async () => {
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "Burger",
                    meal_type: "lunch",
                    calories: 500,
                    items: BURGER_ITEMS,
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain("not both");
                expect(db.inserted).toHaveLength(0);
            });
        });

        test("names the item that lacks a required nutrient", async () => {
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "Burger",
                    meal_type: "lunch",
                    items: [
                        BURGER_ITEMS[0],
                        { name: "Соус", calories: 40, protein_g: 0, fat_g: 4 },
                    ],
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain('item 2 ("Соус")');
                expect(textOf(r)).toContain("carbs_g");
                expect(db.inserted).toHaveLength(0);
            });
        });

        test("the added-sugar gate applies to each item", async () => {
            await withAddedSugarGate(true, async () => {
                await withTools(null, async (call) => {
                    const r = await call("log_meal", {
                        description: "Burger",
                        meal_type: "lunch",
                        items: [
                            { ...BURGER_ITEMS[0], added_sugar_g: undefined },
                        ],
                    });
                    expect(r.isError).toBe(true);
                    expect(textOf(r)).toContain(addedSugarMissingText());
                    expect(db.inserted).toHaveLength(0);
                });
            });
        });
    });

    describe("update_meal on a meal with items", () => {
        test("refuses a direct total change, and replaces the items when given", async () => {
            db.meals = [storedMeal({ id: MEAL_ID, calories: 100 })];
            db.mealItems.set(MEAL_ID, [ingredient(1, "Булка")]);
            await withTools(null, async (call) => {
                const refused = await call("update_meal", {
                    id: MEAL_ID,
                    calories: 500,
                });
                expect(refused.isError).toBe(true);
                expect(textOf(refused)).toContain("sum of its 1 item");
                expect(db.mealUpdates).toHaveLength(0);

                const described = await call("update_meal", {
                    id: MEAL_ID,
                    notes: "Burger, eaten at home",
                });
                expect(described.isError).toBeFalsy();

                const replaced = await call("update_meal", {
                    id: MEAL_ID,
                    items: BURGER_ITEMS,
                });
                expect(replaced.isError).toBeFalsy();
                const write = db.itemReplacements[0]!;
                expect(write.items).toHaveLength(2);
                expect(write.fields.calories).toBeCloseTo(450.5);
            });
        });
    });

    describe("save_meal", () => {
        test("saves a named meal from items and writes no meal entry", async () => {
            await withTools(null, async (call) => {
                const r = await call("save_meal", {
                    name: "Burger",
                    meal_type: "lunch",
                    items: BURGER_ITEMS,
                });
                expect(r.isError).toBeFalsy();
                expect(db.savedMealWrites).toHaveLength(1);
                expect(db.savedMealWrites[0]!.input.calories).toBeCloseTo(
                    450.5,
                );
                expect(db.inserted).toHaveLength(0);
                expect(textOf(r)).toContain(
                    `Saved meal "Burger" [saved meal id:`,
                );
            });
        });

        test("refuses a name already in use and names the saved meal holding it", async () => {
            db.savedMeals = [savedMealRow()];
            await withTools(null, async (call) => {
                const r = await call("save_meal", {
                    name: "oatmeal BOWL",
                    calories: 400,
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain(
                    `already have a saved meal named "oatmeal BOWL" [saved meal id: ${SAVED_ID}]`,
                );
            });
        });

        test("copies a logged meal, its ingredients included", async () => {
            db.meals = [
                storedMeal({
                    id: MEAL_ID,
                    calories: 300,
                    description: "Pasta",
                }),
            ];
            db.mealItems.set(MEAL_ID, [
                ingredient(1, "Паста", { amount: 100, unit: "g" }),
            ]);
            await withTools(null, async (call) => {
                const r = await call("save_meal", {
                    name: "Pasta",
                    from_meal_id: MEAL_ID,
                });
                expect(r.isError).toBeFalsy();
                const write = db.savedMealWrites[0]!;
                expect(write.input.calories).toBe(300);
                expect(write.items).toHaveLength(1);
                expect(write.input.description).toBe("Pasta");
            });
        });

        test("refuses items or totals sent with from_meal_id", async () => {
            db.meals = [storedMeal({ id: MEAL_ID })];
            await withTools(null, async (call) => {
                const r = await call("save_meal", {
                    name: "Pasta",
                    from_meal_id: MEAL_ID,
                    calories: 5,
                });
                expect(r.isError).toBe(true);
                expect(db.savedMealWrites).toHaveLength(0);
            });
        });

        test("refuses a saved meal with neither items nor calories", async () => {
            await withTools(null, async (call) => {
                const none = await call("save_meal", { name: "Tea" });
                expect(none.isError).toBe(true);
                expect(textOf(none)).toContain("either items or its totals");
                const noCalories = await call("save_meal", {
                    name: "Tea",
                    protein_g: 1,
                });
                expect(noCalories.isError).toBe(true);
                expect(db.savedMealWrites).toHaveLength(0);
            });
        });
    });

    describe("get_saved_meals", () => {
        test("lists each saved meal with its items, and says when there are none", async () => {
            await withTools(null, async (call) => {
                const empty = await call("get_saved_meals");
                expect(textOf(empty)).toBe("No saved meals yet.");
            });
            db.savedMeals = [
                savedMealRow({
                    items: [
                        ingredient(1, "Вівсянка", { amount: 60, unit: "g" }),
                    ],
                }),
            ];
            await withTools(null, async (call) => {
                const all = await call("get_saved_meals");
                expect(textOf(all)).toContain(
                    `"Oatmeal bowl" [saved meal id: ${SAVED_ID}]`,
                );
                expect(textOf(all)).toContain("1. Вівсянка — 60 g");
                const none = await call("get_saved_meals", {
                    name_contains: "pancake",
                });
                expect(textOf(none)).toBe('No saved meals matching "pancake".');
            });
        });
    });

    describe("log_saved_meal", () => {
        test("scales by servings, then applies item amounts and leave_out", async () => {
            db.savedMeals = [
                savedMealRow({
                    calories: 300,
                    items: [
                        ingredient(1, "Вівсянка", {
                            amount: 100,
                            unit: "g",
                            calories: 200,
                            protein_g: 10,
                            carbs_g: 30,
                            fat_g: 4,
                        }),
                        ingredient(2, "Банан", {
                            amount: 1,
                            unit: "pcs",
                            calories: 100,
                            protein_g: 2,
                            carbs_g: 30,
                            fat_g: 2,
                        }),
                    ],
                }),
            ];
            await withTools(null, async (call) => {
                const r = await call("log_saved_meal", {
                    saved_meal: "oatmeal bowl",
                    servings: 2,
                    item_amounts: [{ item: "Вівсянка", amount: 50 }],
                    leave_out: ["2"],
                });
                expect(r.isError).toBeFalsy();
                const row = db.inserted[0]!;
                // Two servings make 200 g at 400 kcal; item_amounts then sets the
                // oats to the 50 g actually eaten in this entry: 100 kcal, not
                // multiplied by servings again.
                expect(row.calories).toBe(100);
                expect(row.saved_meal_id).toBe(SAVED_ID);
                expect(row.description).toBe(
                    "Oatmeal with banana (2 servings)",
                );
                expect(row.meal_type).toBe("breakfast");
                const stored = row.items as MealItemValues[];
                expect(stored).toHaveLength(1);
                expect(stored[0]!.amount).toBe(50);
                expect(textOf(r)).toContain(`From saved meal "Oatmeal bowl".`);
            });
        });

        test("names the saved meals when the name matches none", async () => {
            db.savedMeals = [savedMealRow()];
            await withTools(null, async (call) => {
                const r = await call("log_saved_meal", {
                    saved_meal: "Pancakes",
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain(
                    'No saved meal found named "Pancakes".',
                );
                expect(textOf(r)).toContain('"Oatmeal bowl"');
            });
        });

        test("needs a meal type when the saved meal has no default", async () => {
            db.savedMeals = [savedMealRow({ meal_type: null })];
            await withTools(null, async (call) => {
                const r = await call("log_saved_meal", {
                    saved_meal: "Oatmeal bowl",
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain("no default meal type");
                expect(db.inserted).toHaveLength(0);
            });
        });

        test("refuses item changes on a saved meal without items", async () => {
            db.savedMeals = [savedMealRow()];
            await withTools(null, async (call) => {
                const r = await call("log_saved_meal", {
                    saved_meal: SAVED_ID,
                    leave_out: ["1"],
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain("has no items");
            });
        });
    });

    describe("concurrent edits to one meal keep each other's labels", () => {
        test("a label edit landing between an update's read and its write is kept, not overwritten", async () => {
            db.meals = [
                meal({
                    protein_g: 25,
                    fat_g: 20,
                    nutrient_sources: {
                        protein_g: { s: "estimate" },
                        fat_g: { s: "estimate" },
                    },
                }),
            ];
            // Another edit restates protein_g as the user's own figure, after this
            // call has read the row and before it writes.
            db.concurrentMealEdit = {
                protein_g: 30,
                nutrient_sources: {
                    protein_g: { s: "user" },
                    fat_g: { s: "estimate" },
                },
            };
            await withTools(null, async (call) => {
                const r = await call("update_meal", { id: MEAL_ID, fat_g: 22 });
                expect(r.isError).toBeFalsy();
            });
            // The first write was refused; the retry merged onto the stored row,
            // so the protein label the other edit wrote survives.
            expect(db.mealUpdates).toHaveLength(1);
            expect(db.mealUpdates[0]!.nutrient_sources).toEqual({
                protein_g: { s: "user" },
                fat_g: { s: "estimate" },
            });
        });

        test("a row that keeps moving is refused after the bounded retries, with nothing written", async () => {
            db.meals = [meal({ fat_g: 20 })];
            db.concurrentEditPersists = true;
            db.concurrentMealEdit = (row) => ({ fat_g: (row.fat_g ?? 0) + 1 });
            await withTools(null, async (call) => {
                const r = await call("update_meal", { id: MEAL_ID, fat_g: 5 });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain(
                    "changed while this edit was being saved, so nothing was written. Send the same edit again.",
                );
            });
            expect(db.mealUpdates).toHaveLength(0);
            expect(db.mealUpdateGuards).toHaveLength(3);
        });

        test("update_meal restates a value the call sends again as the user's own figure", async () => {
            db.meals = [
                meal({
                    protein_g: 25,
                    nutrient_sources: { protein_g: { s: "estimate" } },
                }),
            ];
            await withTools(null, async (call) => {
                const r = await call("update_meal", {
                    id: MEAL_ID,
                    protein_g: 25,
                    user_stated: ["protein_g"],
                });
                expect(r.isError).toBeFalsy();
            });
            expect(db.mealUpdates.at(-1)!.nutrient_sources).toEqual({
                protein_g: { s: "user" },
            });
        });

        test("update_meal keeps the stored label of a user_stated nutrient the call does not send", async () => {
            db.meals = [
                meal({
                    protein_g: 25,
                    fat_g: 20,
                    nutrient_sources: { protein_g: { s: "estimate" } },
                }),
            ];
            await withTools(null, async (call) => {
                const r = await call("update_meal", {
                    id: MEAL_ID,
                    fat_g: 22,
                    user_stated: ["protein_g"],
                });
                expect(r.isError).toBeFalsy();
            });
            expect(db.mealUpdates.at(-1)!.nutrient_sources).toEqual({
                protein_g: { s: "estimate" },
                fat_g: { s: "estimate" },
            });
        });

        test("update_saved_meal's totals path keeps a label edit that landed after its read", async () => {
            db.savedMeals = [
                savedMealRow({
                    protein_g: 10,
                    nutrient_sources: { protein_g: { s: "estimate" } },
                }),
            ];
            db.concurrentSavedMealEdit = {
                protein_g: 12,
                nutrient_sources: { protein_g: { s: "user" } },
            };
            await withTools(null, async (call) => {
                const r = await call("update_saved_meal", {
                    id: SAVED_ID,
                    fat_g: 7,
                });
                expect(r.isError).toBeFalsy();
            });
            expect(db.savedMealUpdates.at(-1)!.fields.nutrient_sources).toEqual(
                {
                    protein_g: { s: "user" },
                    fat_g: { s: "estimate" },
                },
            );
        });

        test("update_saved_meal restates an unchanged total as the user's own figure", async () => {
            db.savedMeals = [
                savedMealRow({
                    protein_g: 10,
                    nutrient_sources: { protein_g: { s: "estimate" } },
                }),
            ];
            await withTools(null, async (call) => {
                const r = await call("update_saved_meal", {
                    id: SAVED_ID,
                    protein_g: 10,
                    user_stated: ["protein_g"],
                });
                expect(r.isError).toBeFalsy();
            });
            expect(db.savedMealUpdates.at(-1)!.fields.nutrient_sources).toEqual(
                {
                    protein_g: { s: "user" },
                },
            );
        });
    });

    describe("update_saved_meal and delete_saved_meal", () => {
        test("refuses an empty change, a direct total on an itemized meal, a taken name and an unknown id", async () => {
            db.savedMeals = [
                savedMealRow({ items: [ingredient(1, "Вівсянка")] }),
                savedMealRow({ id: OTHER_SAVED_ID, name: "Pancakes" }),
            ];
            await withTools(null, async (call) => {
                const empty = await call("update_saved_meal", { id: SAVED_ID });
                expect(empty.isError).toBe(true);
                expect(textOf(empty)).toContain("Nothing to change");

                const totals = await call("update_saved_meal", {
                    id: SAVED_ID,
                    calories: 5,
                });
                expect(totals.isError).toBe(true);
                expect(textOf(totals)).toContain("sum of its 1 item");

                const taken = await call("update_saved_meal", {
                    id: OTHER_SAVED_ID,
                    name: "oatmeal bowl",
                });
                expect(taken.isError).toBe(true);
                expect(textOf(taken)).toContain(`[saved meal id: ${SAVED_ID}]`);

                const unknown = await call("update_saved_meal", {
                    id: savedMealId(0xff),
                    description: "x",
                });
                expect(unknown.isError).toBe(true);
                expect(textOf(unknown)).toContain(
                    "No saved meal found with id",
                );
            });
        });

        test("deleting a saved meal leaves the meals logged from it as they were", async () => {
            db.savedMeals = [savedMealRow()];
            db.meals = [
                storedMeal({
                    id: MEAL_ID,
                    description: "Oatmeal with banana",
                    saved_meal_id: SAVED_ID,
                }),
            ];
            await withTools(null, async (call) => {
                const r = await call("delete_saved_meal", { id: SAVED_ID });
                expect(textOf(r)).toBe(
                    'Saved meal "Oatmeal bowl" deleted. Meals already logged from it keep their values.',
                );
                expect(db.savedMeals).toHaveLength(0);
                expect(db.meals[0]!.description).toBe("Oatmeal with banana");
                expect(db.meals[0]!.saved_meal_id).toBeNull();
            });
        });
    });

    describe("saved meals and ingredients in reads", () => {
        test("search_meals lists the saved meals that match", async () => {
            db.savedMeals = [
                savedMealRow({ items: [ingredient(1, "Вівсянка")] }),
            ];
            await withTools(null, async (call) => {
                const r = await call("search_meals", { queries: ["oatmeal"] });
                expect(textOf(r)).toContain("No past meals matching");
                expect(textOf(r)).toContain("Saved meals matching: 1 found.");
                expect(textOf(r)).toContain(`[saved meal id: ${SAVED_ID}]`);
            });
        });

        test("get_meals_today shows an ingredient count, and the list in full detail", async () => {
            db.meals = [storedMeal({ id: MEAL_ID, description: "Burger" })];
            db.mealItems.set(MEAL_ID, [
                ingredient(1, "Булка"),
                ingredient(2, "Котлета"),
            ]);
            await withTools(null, async (call) => {
                const compact = await call("get_meals_today");
                expect(textOf(compact)).toContain("2 items");
                const full = await call("get_meals_today", { detail: "full" });
                expect(textOf(full)).toContain("Items:");
                expect(textOf(full)).toContain("2. Котлета");
            });
        });
    });

    describe("saved meals: review fixes", () => {
        test("the name-taken refusal describes update_saved_meal and keeps the name out of the log", async () => {
            db.savedMeals = [savedMealRow({ name: "Grated carrot salad" })];
            const warn = spyOn(console, "warn").mockImplementation(() => {});
            const log = spyOn(console, "log").mockImplementation(() => {});
            try {
                await withTools(null, async (call) => {
                    const r = await call("save_meal", {
                        name: "grated carrot SALAD",
                        calories: 120,
                    });
                    expect(r.isError).toBe(true);
                    expect(textOf(r)).toBe(
                        `You already have a saved meal named "grated carrot SALAD" [saved meal id: ${SAVED_ID}]. update_saved_meal changes it; a different name saves another one.`,
                    );
                });
                const logged = [...warn.mock.calls, ...log.mock.calls]
                    .flat()
                    .map(String)
                    .join("\n");
                expect(logged).toContain("save_meal");
                // Filed under its own category, not rate_limited by "Grated".
                expect(logged).toContain("meal_items_invalid");
                expect(logged.toLowerCase()).not.toContain("carrot");
            } finally {
                warn.mockRestore();
                log.mockRestore();
            }
        });

        test("a saved-meal name that matches none never reaches the runtime log", async () => {
            db.savedMeals = [
                savedMealRow({ name: "Insulin-day oats" }),
                savedMealRow({ id: OTHER_SAVED_ID, name: "Mom's borscht" }),
            ];
            const warn = spyOn(console, "warn").mockImplementation(() => {});
            const log = spyOn(console, "log").mockImplementation(() => {});
            try {
                await withTools(null, async (call) => {
                    const r = await call("log_saved_meal", {
                        saved_meal: "borsch",
                    });
                    expect(r.isError).toBe(true);
                    expect(textOf(r)).toContain('"Mom\'s borscht"');
                });
                const logged = [...warn.mock.calls, ...log.mock.calls]
                    .flat()
                    .map(String)
                    .join("\n");
                expect(logged).toContain("record_not_found");
                expect(logged).not.toContain("borsch");
                expect(logged).not.toContain("Insulin");
            } finally {
                warn.mockRestore();
                log.mockRestore();
            }
        });

        test("an escaped saved-meal name resolves to the stored one", async () => {
            db.savedMeals = [savedMealRow({ name: "Сніданок" })];
            await withTools(null, async (call) => {
                const r = await call("log_saved_meal", {
                    saved_meal:
                        "\\u0421\\u043d\\u0456\\u0434\\u0430\\u043d\\u043e\\u043a",
                });
                expect(r.isError).toBeFalsy();
                expect(db.inserted[0]!.saved_meal_id).toBe(SAVED_ID);
            });
        });

        test("log_saved_meal refuses totals past what a single meal holds, before writing", async () => {
            db.savedMeals = [
                savedMealRow({ calories: 15_000 }),
                savedMealRow({
                    id: OTHER_SAVED_ID,
                    name: "Feast",
                    items: [ingredient(1, "Торт", { calories: 12_000 })],
                }),
            ];
            await withTools(null, async (call) => {
                const totalsOnly = await call("log_saved_meal", {
                    saved_meal: SAVED_ID,
                    servings: 2,
                });
                expect(totalsOnly.isError).toBe(true);
                expect(textOf(totalsOnly)).toContain("calories 30000");
                const itemized = await call("log_saved_meal", {
                    saved_meal: "Feast",
                    servings: 2,
                });
                expect(itemized.isError).toBe(true);
                expect(textOf(itemized)).toContain("calories 24000");
                expect(db.inserted).toHaveLength(0);
            });
        });

        test("a saved meal without items scales its totals by servings", async () => {
            db.savedMeals = [savedMealRow({ calories: 301, protein_g: 12.5 })];
            await withTools(null, async (call) => {
                const r = await call("log_saved_meal", {
                    saved_meal: SAVED_ID,
                    servings: 0.5,
                });
                expect(r.isError).toBeFalsy();
                const row = db.inserted[0]!;
                expect(row.calories).toBeCloseTo(150.5);
                expect(row.protein_g).toBeCloseTo(6.25);
                expect(row.description).toBe(
                    "Oatmeal with banana (0.5 servings)",
                );
                expect(row.items).toBeUndefined();
            });
        });

        test("save_meal bounds the description, and from_meal_id refuses an over-long copied one", async () => {
            db.meals = [
                storedMeal({
                    id: MEAL_ID,
                    calories: 300,
                    description: "x".repeat(2500),
                }),
            ];
            await withTools(null, async (call) => {
                const empty = await call("save_meal", {
                    name: "Tea",
                    calories: 2,
                    description: "   ",
                });
                expect(empty.isError).toBe(true);
                expect(textOf(empty)).toContain("1 to 2000 characters");

                const long = await call("save_meal", {
                    name: "Tea",
                    calories: 2,
                    description: "y".repeat(2001),
                });
                expect(long.isError).toBe(true);
                expect(textOf(long)).toContain("has 2001");

                const copied = await call("save_meal", {
                    name: "Big dinner",
                    from_meal_id: MEAL_ID,
                });
                expect(copied.isError).toBe(true);
                expect(textOf(copied)).toContain("2500 characters");
                expect(db.savedMealWrites).toHaveLength(0);

                const replaced = await call("save_meal", {
                    name: "Big dinner",
                    from_meal_id: MEAL_ID,
                    description: "  Big dinner, short  ",
                });
                expect(replaced.isError).toBeFalsy();
                expect(db.savedMealWrites[0]!.input.description).toBe(
                    "Big dinner, short",
                );
            });
        });

        test("save_meal refuses past the saved-meal cap and an unknown from_meal_id", async () => {
            await withTools(null, async (call) => {
                const unknown = await call("save_meal", {
                    name: "Pasta",
                    from_meal_id: savedMealId(0xfe),
                });
                expect(unknown.isError).toBe(true);
                expect(textOf(unknown)).toContain("No meal found with id");
            });
            db.savedMeals = Array.from({ length: 200 }, (_, i) =>
                savedMealRow({
                    id: savedMealId(0x1000 + i),
                    name: `Meal ${i}`,
                }),
            );
            await withTools(null, async (call) => {
                const r = await call("save_meal", {
                    name: "One more",
                    calories: 5,
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain("already holds 200 saved meals");
                expect(db.savedMealWrites).toHaveLength(0);
            });
        });

        test("save_meal keeps every nutrient and shows added sugar on the sugar figure", async () => {
            await withTools(null, async (call) => {
                const r = await call("save_meal", {
                    name: "Cola",
                    calories: 140,
                    protein_g: 0,
                    carbs_g: 35,
                    fat_g: 0,
                    sugar_g: 35,
                    added_sugar_g: 35,
                    caffeine_mg: 34,
                });
                expect(r.isError).toBeFalsy();
                expect(textOf(r)).toContain("sugar 35 g (35 added)");
                expect(textOf(r)).not.toContain("added sugar 35 g");
                expect(textOf(r)).toContain("caffeine");
            });
        });

        test("update_saved_meal renames, replaces items with summed totals, and updates totals alone", async () => {
            db.savedMeals = [
                savedMealRow({
                    calories: 300,
                    fiber_g: 4,
                    alcohol_g: 10,
                    items: [ingredient(1, "Вівсянка", { alcohol_g: 10 })],
                }),
                savedMealRow({
                    id: OTHER_SAVED_ID,
                    name: "Tea",
                    calories: 2,
                    fiber_g: 0,
                    sugar_g: 10,
                    added_sugar_g: 5,
                }),
            ];
            await withTools(null, async (call) => {
                const renamed = await call("update_saved_meal", {
                    id: SAVED_ID,
                    name: "Porridge",
                    description: "\\u041a\\u0430\\u0448\\u0430",
                });
                expect(renamed.isError).toBeFalsy();
                expect(textOf(renamed)).toContain(
                    'Saved meal "Porridge" updated. Meals already logged from it keep their values.',
                );
                expect(db.savedMealUpdates[0]!.fields).toEqual({
                    name: "Porridge",
                    description: "Каша",
                });
                expect(db.savedMealUpdates[0]!.items).toBeNull();

                const replaced = await call("update_saved_meal", {
                    id: SAVED_ID,
                    items: BURGER_ITEMS,
                });
                expect(replaced.isError).toBeFalsy();
                const write = db.savedMealUpdates[1]!;
                expect(write.items).toHaveLength(2);
                expect(write.fields.calories).toBeCloseTo(450.5);
                expect(write.fields.fiber_g).toBe(1);
                // No item carries alcohol any more: the stale total is cleared.
                expect(write.fields.alcohol_g).toBeNull();
                expect(db.savedMeals[0]!.alcohol_g).toBeNull();

                const totals = await call("update_saved_meal", {
                    id: OTHER_SAVED_ID,
                    calories: 4,
                });
                expect(totals.isError).toBeFalsy();
                // The changed total takes an estimate label; nothing else is sent.
                expect(db.savedMealUpdates[2]!.fields).toEqual({
                    calories: 4,
                    nutrient_sources: { calories: { s: "estimate" } },
                    source_detail: null,
                });
                const tea = db.savedMeals.find((s) => s.id === OTHER_SAVED_ID)!;
                expect(tea.calories).toBe(4);
                expect(tea.sugar_g).toBe(10);
                expect(tea.added_sugar_g).toBe(5);
                expect(tea.fiber_g).toBe(0);

                const emptyDescription = await call("update_saved_meal", {
                    id: OTHER_SAVED_ID,
                    description: "",
                });
                expect(emptyDescription.isError).toBe(true);
                expect(textOf(emptyDescription)).toContain(
                    "1 to 2000 characters",
                );
                expect(db.savedMealUpdates).toHaveLength(3);
            });
        });

        test("update_saved_meal checks the sugar pair against the stored partner and names the saved meal under the gate", async () => {
            db.savedMeals = [
                savedMealRow({ sugar_g: 10, added_sugar_g: null }),
                savedMealRow({ id: OTHER_SAVED_ID, name: "Tea", sugar_g: 10 }),
            ];
            await withTools(null, async (call) => {
                const over = await call("update_saved_meal", {
                    id: SAVED_ID,
                    added_sugar_g: 30,
                });
                expect(over.isError).toBe(true);
                expect(db.savedMealUpdates).toHaveLength(0);
            });
            await withAddedSugarGate(true, async () => {
                await withTools(null, async (call) => {
                    const r = await call("update_saved_meal", {
                        id: OTHER_SAVED_ID,
                        sugar_g: 12,
                    });
                    expect(r.isError).toBe(true);
                    expect(textOf(r)).toContain(
                        `Not saved, saved meal ${OTHER_SAVED_ID} is unchanged`,
                    );
                    expect(textOf(r)).toContain(
                        "the saved meal has no added sugar recorded",
                    );
                    expect(textOf(r)).not.toMatch(/Not saved, meal /);
                    expect(db.savedMealUpdates).toHaveLength(0);
                });
            });
        });

        test("the missing-nutrient note on an itemized meal points at items, not a totals field", async () => {
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "Rice",
                    meal_type: "lunch",
                    items: [
                        {
                            name: "Rice",
                            calories: 200,
                            protein_g: 4,
                            carbs_g: 44,
                            fat_g: 0,
                        },
                    ],
                });
                expect(r.isError).toBeFalsy();
                const text = textOf(r);
                expect(text).toContain("Not recorded on this meal: fiber_g");
                expect(text).toContain(
                    "sum of its 1 item, so update_meal adds",
                );
                expect(text).toContain("with the value on each item");
                expect(text).not.toContain("update_meal can add the value");
            });
        });

        test("missingNutrientNote names the items path only for an itemized meal", () => {
            const meal = storedMeal({ id: MEAL_ID, calories: 100 });
            expect(missingNutrientNote(meal)).toContain(
                `update_meal can add the value to id ${MEAL_ID}`,
            );
            const itemized = missingNutrientNote(meal, 3);
            expect(itemized).toContain("sum of its 3 items");
            expect(itemized).not.toContain("update_meal can add the value");
        });
    });

    // ---------- ingredients ride in _meta for the widgets' expandable rows ----------

    describe("meal items ride in _meta on every breakdown widget tool", () => {
        // The payload's whole v1 contract, strictly: a stray key would mean the
        // widget is reading something the server never promised.
        const NUTRIENT = z.number().nullable();
        const ITEM = z.strictObject({
            name: z.string(),
            amount: z.number().nullable(),
            unit: z.string().nullable(),
            calories: NUTRIENT,
            protein_g: NUTRIENT,
            carbs_g: NUTRIENT,
            fat_g: NUTRIENT,
            saturated_fat_g: NUTRIENT,
            trans_fat_g: NUTRIENT,
            fiber_g: NUTRIENT,
            sugar_g: NUTRIENT,
            added_sugar_g: NUTRIENT,
            alcohol_g: NUTRIENT,
            caffeine_mg: NUTRIENT,
            sodium_mg: NUTRIENT,
        });
        const MEAL_ITEMS_META = z.strictObject({
            v: z.literal(1),
            meals: z.array(z.array(ITEM).min(1).nullable()),
        });
        type Payload = z.infer<typeof MEAL_ITEMS_META>;
        type Item = z.infer<typeof ITEM>;

        const OTHER_ID = "00000000-0000-4000-8000-0000000000e1";

        /** The key's payload, parsed, after checking the rows it aligns with and
         *  that nothing leaked into structuredContent. */
        function itemsOf(r: ToolResult): Payload {
            expect(r.isError).toBeFalsy();
            const rows = (r.structuredContent as { meals: unknown[] }).meals;
            const meta = MEAL_ITEMS_META.parse(r._meta?.[MEAL_ITEMS_META_KEY]);
            expect(meta.meals).toHaveLength(rows.length);
            expect(JSON.stringify(r.structuredContent)).not.toContain(
                '"items"',
            );
            return meta;
        }

        function expectNoKey(r: ToolResult) {
            expect(r.isError).toBeFalsy();
            expect(r.structuredContent).toBeDefined();
            expect(r._meta ?? {}).not.toHaveProperty(MEAL_ITEMS_META_KEY);
        }

        test("log_meal: the logged meal's items, in position order, rounded like the rows", async () => {
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "Burger",
                    meal_type: "lunch",
                    items: BURGER_ITEMS,
                });
                const meta = itemsOf(r);
                const items = meta.meals[0]! as Item[];
                expect(items.map((i) => i.name)).toEqual(["Булка", "Котлета"]);
                expect(items[1]).toMatchObject({
                    amount: 120,
                    unit: "g",
                    calories: 301,
                    protein_g: 25,
                    fiber_g: 0,
                    added_sugar_g: 0,
                    caffeine_mg: null,
                });
                // Never the stored position: the array order is the order.
                expect(items[0]).not.toHaveProperty("position");
            });
        });

        test("log_meal: no key at all when no meal of the day has items", async () => {
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "Apple",
                    meal_type: "snack",
                    calories: 95,
                    protein_g: 0,
                    carbs_g: 25,
                    fat_g: 0,
                });
                expectNoKey(r);
            });
        });

        test("update_meal: the day's rows, re-read after the item replacement", async () => {
            db.meals = [storedMeal({ id: MEAL_ID, calories: 100 })];
            db.mealItems.set(MEAL_ID, [ingredient(1, "Булка")]);
            await withTools(null, async (call) => {
                const r = await call("update_meal", {
                    id: MEAL_ID,
                    items: BURGER_ITEMS,
                });
                const meta = itemsOf(r);
                expect((meta.meals[0] as Item[]).map((i) => i.name)).toEqual([
                    "Булка",
                    "Котлета",
                ]);
            });
        });

        test("log_saved_meal: the logged copy's items", async () => {
            db.savedMeals = [
                savedMealRow({
                    items: [
                        ingredient(1, "Вівсянка", { amount: 100, unit: "g" }),
                        ingredient(2, "Банан", { amount: 1, unit: "pcs" }),
                    ],
                }),
            ];
            await withTools(null, async (call) => {
                const r = await call("log_saved_meal", {
                    saved_meal: "Oatmeal bowl",
                });
                const meta = itemsOf(r);
                expect((meta.meals[0] as Item[]).map((i) => i.name)).toEqual([
                    "Вівсянка",
                    "Банан",
                ]);
            });
        });

        test("get_goal_progress: one slot per row, null for a meal without items", async () => {
            db.meals = [
                meal({ id: OTHER_ID, description: "Coffee" }),
                meal({ id: MEAL_ID, description: "Pasta" }),
            ];
            db.mealItems.set(MEAL_ID, [
                ingredient(1, "Fusilli", { fiber_g: 3.04 }),
                ingredient(2, "Sauce"),
            ]);
            await withTools("us", async (call) => {
                const r = await call("get_goal_progress", {
                    date: "2026-07-26",
                });
                const meta = itemsOf(r);
                expect(meta.meals[0]).toBeNull();
                const items = meta.meals[1] as Item[];
                expect(items.map((i) => [i.name, i.fiber_g])).toEqual([
                    ["Fusilli", 3],
                    ["Sauce", null],
                ]);
            });
        });

        test("item alcohol is null with tracking off, the stored value with it on", async () => {
            db.meals = [meal({ id: MEAL_ID, description: "Pasta and a beer" })];
            db.mealItems.set(MEAL_ID, [
                ingredient(1, "Beer", { alcohol_g: 14 }),
            ]);
            await withTools(null, async (call) => {
                const r = await call("get_goal_progress", {
                    date: "2026-07-26",
                });
                expect(
                    (itemsOf(r).meals[0] as Item[])[0]!.alcohol_g,
                ).toBeNull();
            });
            await withTools("us", async (call) => {
                const r = await call("get_goal_progress", {
                    date: "2026-07-26",
                });
                expect((itemsOf(r).meals[0] as Item[])[0]!.alcohol_g).toBe(14);
            });
        });

        describe("get_nutrition_summary", () => {
            // Ten meals carrying only calories, so the summary keeps the top 8 by
            // calories: indices 0 and 1 (the smallest) are dropped.
            function tenMeals(): Meal[] {
                return Array.from({ length: 10 }, (_, i) =>
                    meal({
                        id: savedMealId(0xe00 + i),
                        logged_at: `2026-07-${String(10 + i).padStart(2, "0")}T12:00:00.000Z`,
                        description: `Meal ${i}`,
                        calories: 100 + i * 10,
                        protein_g: 0,
                        carbs_g: 0,
                        fat_g: 0,
                        fiber_g: 0,
                        sugar_g: 0,
                        alcohol_g: 0,
                    }),
                );
            }
            const ARGS = { start_date: "2026-07-01", end_date: "2026-07-31" };

            test("aligned with the kept rows, never the whole window", async () => {
                db.meals = tenMeals();
                db.mealItems.set(savedMealId(0xe00), [
                    ingredient(1, "Dropped"),
                ]);
                db.mealItems.set(savedMealId(0xe05), [ingredient(1, "Kept")]);
                await withTools(null, async (call) => {
                    const r = await call("get_nutrition_summary", ARGS);
                    const rows = (
                        r.structuredContent as {
                            meals: { description: string }[];
                        }
                    ).meals;
                    expect(rows).toHaveLength(MEAL_BREAKDOWN_TOP_N);
                    const meta = itemsOf(r);
                    const at = rows.findIndex(
                        (row) => row.description === "Meal 5",
                    );
                    meta.meals.forEach((slot, i) => {
                        if (i === at)
                            expect((slot as Item[])[0]!.name).toBe("Kept");
                        else expect(slot).toBeNull();
                    });
                });
            });

            test("no key when only a dropped meal has items, nor on the empty path", async () => {
                db.meals = tenMeals();
                db.mealItems.set(savedMealId(0xe00), [
                    ingredient(1, "Dropped"),
                ]);
                await withTools(null, async (call) => {
                    expectNoKey(await call("get_nutrition_summary", ARGS));
                    db.meals = [];
                    expectNoKey(await call("get_nutrition_summary", ARGS));
                });
            });
        });

        test("a failed items read never fails the tool: the key is just absent", async () => {
            db.meals = [meal({ id: MEAL_ID })];
            db.mealItems.set(MEAL_ID, [ingredient(1, "Fusilli")]);
            db.mealItemsFailure = new Error("connection reset");
            const warn = spyOn(console, "warn").mockImplementation(() => {});
            try {
                await withTools(null, async (call) => {
                    expectNoKey(
                        await call("get_goal_progress", { date: "2026-07-26" }),
                    );
                    expectNoKey(
                        await call("get_nutrition_summary", {
                            start_date: "2026-07-01",
                            end_date: "2026-07-31",
                        }),
                    );
                    const logged = await call("log_meal", {
                        description: "Burger",
                        meal_type: "lunch",
                        items: BURGER_ITEMS,
                    });
                    expectNoKey(logged);
                    expect(textOf(logged)).toContain("Items:");
                });
                const lines = warn.mock.calls.map((c) => String(c[0]));
                expect(
                    lines.filter((l) => l.startsWith("[widget] meal-items")),
                ).toHaveLength(3);
                for (const l of lines) expect(l).not.toContain("u1");
            } finally {
                warn.mockRestore();
            }
        });

        test.each(["meal-logged", "goal-progress", "nutrition-summary"])(
            "the %s widget reads _meta under MEAL_ITEMS_META_KEY",
            async (key) => {
                expect(await getWidgetHtml(key)).toContain(
                    JSON.stringify(MEAL_ITEMS_META_KEY),
                );
            },
        );
    });

    describe("log_saved_meal re-derives the meal's labels from the items it keeps", () => {
        const TAG = { s: "usda", ref: "171477" } as const;

        test("leave_out drops an item, so the meal's calories are labelled from the one kept", async () => {
            db.savedMeals = [
                savedMealRow({
                    items: [
                        ingredient(1, "Chicken", {
                            calories: 200,
                            nutrient_sources: { calories: TAG },
                        }),
                        ingredient(2, "Sauce", {
                            calories: 100,
                            nutrient_sources: { calories: { s: "estimate" } },
                        }),
                    ],
                }),
            ];
            await withTools(null, async (call) => {
                const kept = await call("log_saved_meal", {
                    saved_meal: SAVED_ID,
                    meal_type: "dinner",
                });
                expect(kept.isError).toBeFalsy();
                expect(db.inserted.at(-1)!.nutrient_sources).toMatchObject({
                    calories: {
                        s: "mixed",
                        parts: [
                            { s: "usda", share: 67 },
                            { s: "estimate", share: 33 },
                        ],
                    },
                });
                const r = await call("log_saved_meal", {
                    saved_meal: SAVED_ID,
                    meal_type: "dinner",
                    leave_out: ["2"],
                });
                expect(r.isError).toBeFalsy();
                expect(db.inserted.at(-1)!.nutrient_sources).toMatchObject({
                    calories: TAG,
                });
            });
        });
    });
}
