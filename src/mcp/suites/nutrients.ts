import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport, McpServer } from "@modelcontextprotocol/server";
import { describe, expect, spyOn, test } from "bun:test";
import { z } from "zod";
import {
    ADDED_SUGAR_REQUIRED_FROM_ENV,
    type AddedSugarMeta,
    addedSugarMissingText,
} from "../../added-sugar.js";
import {
    ADDED_SUGAR_META_KEY,
    addedSugarRequiredNow,
    ceilingAverageLine,
    formatGoals,
    formatProgress,
    LOCAL_TODAY_META_KEY,
    MAX_GOAL_G,
    MAX_GOAL_MG,
    MAX_SODIUM_MG,
    MEAL_BREAKDOWN_TOP_N,
    MEAL_CONTRIBUTORS,
    MEAL_CONTRIBUTORS_META_KEY,
    MEAL_TIMES_META_KEY,
    mealBreakdown,
    nutrientPresence,
    PERIOD_AVERAGES_META_KEY,
    rangeAverages,
    registerTools,
    SATURATED_FAT_META_KEY,
    SODIUM_META_KEY,
    sumMeals,
    topMealBreakdown,
    updatedAddedSugarError,
} from "../../mcp.js";
import type { ReferenceRecord } from "../../provenance.js";
import type { Meal } from "../../supabase.js";
import {
    ACTIVITY_META_KEY,
    getWidgetHtml,
    NUTRIENT_SOURCES_META_KEY,
} from "../../widgets.js";
import {
    db,
    ERAS,
    goals,
    ingredient,
    meal,
    MEAL_ID,
    SAVED_ID,
    savedMealRow,
    storedMeal,
    textOf,
    type ToolResult,
    withHttpClient,
    withTools,
} from "../test-harness.js";

export function registerNutrientSuites(): void {
    // ---------- added sugar ----------
    //
    // Tracked beside total sugar with its own ceiling, never inside any frozen
    // structuredContent shape: every figure here reaches the model through
    // `content`. withTools arms the client's strict schema check, so each tool
    // call below also proves no structuredContent object gained a field.

    describe("added sugar", () => {
        const banana = (id: string) =>
            meal({
                id,
                description: "Banana (120 g)",
                meal_type: "snack",
                calories: 107,
                protein_g: 1.3,
                carbs_g: 27.4,
                fat_g: 0.4,
                fiber_g: 3.1,
                sugar_g: 14.7,
                added_sugar_g: 0,
                alcohol_g: null,
            });
        const cola = meal({
            id: "00000000-0000-4000-8000-0000000000c0",
            description: "Cola (330 ml)",
            meal_type: "snack",
            calories: 139,
            protein_g: 0,
            carbs_g: 35,
            fat_g: 0,
            fiber_g: 0,
            sugar_g: 35,
            added_sugar_g: 35,
            alcohol_g: null,
        });

        describe("added ≤ total is a ToolError, never clamped", () => {
            test("log_meal refuses added above total in the same call", async () => {
                await withTools(null, async (call) => {
                    const r = await call("log_meal", {
                        description: "Sweetened yogurt",
                        meal_type: "snack",
                        sugar_g: 10,
                        added_sugar_g: 12,
                    });
                    expect(r.isError).toBe(true);
                    expect(textOf(r)).toContain(
                        "added_sugar_g (12 g) is more than sugar_g (10 g); added sugars are part of total sugars.",
                    );
                    expect(db.inserted).toHaveLength(0);
                });
            });

            test("log_meal stores a consistent pair, and added sugar alone", async () => {
                await withTools(null, async (call) => {
                    const r = await call("log_meal", {
                        description: "Cola (330 ml)",
                        meal_type: "snack",
                        sugar_g: 35,
                        added_sugar_g: "35",
                    });
                    expect(r.isError).toBeFalsy();
                    expect(db.inserted[0]!.added_sugar_g).toBe(35);
                    const alone = await call("log_meal", {
                        description: "Honey (1 tbsp)",
                        meal_type: "snack",
                        added_sugar_g: 17,
                    });
                    expect(alone.isError).toBeFalsy();
                    expect(db.inserted[1]!.added_sugar_g).toBe(17);
                });
            });

            test("update_meal checks added_sugar_g alone against the stored sugar_g", async () => {
                db.meals = [meal({ sugar_g: 10, added_sugar_g: null })];
                await withTools(null, async (call) => {
                    const r = await call("update_meal", {
                        id: MEAL_ID,
                        added_sugar_g: 12,
                    });
                    expect(r.isError).toBe(true);
                    expect(textOf(r)).toContain(
                        "added_sugar_g (12 g) is more than sugar_g (10 g)",
                    );
                    expect(db.mealUpdates).toHaveLength(0);
                    expect(db.storedMealReads).toBe(1);

                    const ok = await call("update_meal", {
                        id: MEAL_ID,
                        added_sugar_g: 8,
                    });
                    expect(ok.isError).toBeFalsy();
                    expect(db.mealUpdates[0]!.added_sugar_g).toBe(8);
                });
            });

            test("update_meal checks sugar_g alone against the stored added_sugar_g", async () => {
                db.meals = [meal({ sugar_g: 40, added_sugar_g: 30 })];
                await withTools(null, async (call) => {
                    const r = await call("update_meal", {
                        id: MEAL_ID,
                        sugar_g: 20,
                    });
                    expect(r.isError).toBe(true);
                    expect(textOf(r)).toContain(
                        "added_sugar_g (30 g) is more than sugar_g (20 g)",
                    );
                    expect(db.mealUpdates).toHaveLength(0);
                });
            });

            test("update_meal conditions a one-sided write on the stored value it checked", async () => {
                db.meals = [meal({ sugar_g: 10, added_sugar_g: null })];
                await withTools(null, async (call) => {
                    const added = await call("update_meal", {
                        id: MEAL_ID,
                        added_sugar_g: 8,
                    });
                    expect(added.isError).toBeFalsy();
                    // The guard is the whole row as it was read (every nutrient
                    // column and both labels), so the sugar it checked is in it.
                    expect(db.mealUpdateGuards[0]).toMatchObject({
                        sugar_g: 10,
                        added_sugar_g: null,
                    });
                });
                db.meals = [meal({ sugar_g: 40, added_sugar_g: null })];
                await withTools(null, async (call) => {
                    const sugar = await call("update_meal", {
                        id: MEAL_ID,
                        sugar_g: 20,
                    });
                    expect(sugar.isError).toBeFalsy();
                    // A null stored value is guarded as null (IS NULL).
                    expect(db.mealUpdateGuards[1]).toMatchObject({
                        sugar_g: 40,
                        added_sugar_g: null,
                    });
                });
            });

            test("update_meal writes nothing when the checked value moved before the write, and re-checks the new value", async () => {
                db.meals = [meal({ sugar_g: 40, added_sugar_g: null })];
                // Another update_meal lowers sugar_g after this call's check read
                // sugar_g 40 and accepted added_sugar_g 30. The write is refused,
                // the row is re-read, and the check now fails on the stored 20 g.
                db.concurrentMealEdit = { sugar_g: 20 };
                await withTools(null, async (call) => {
                    const r = await call("update_meal", {
                        id: MEAL_ID,
                        added_sugar_g: 30,
                    });
                    expect(r.isError).toBe(true);
                    expect(textOf(r)).toContain(
                        "added_sugar_g (30 g) is more than sugar_g (20 g)",
                    );
                    expect(db.mealUpdates).toHaveLength(0);
                    // One guarded write (refused by the concurrent edit); the
                    // re-read then fails the check before any second write.
                    expect(db.mealUpdateGuards).toHaveLength(1);
                });
                const row = db.analyticsRows.find(
                    (r) => r.tool_name === "update_meal",
                );
                expect(row?.error_category).not.toBe("record_not_found");
            });

            test("update_meal passing both checks the pair from this call", async () => {
                db.meals = [meal({ sugar_g: 5, added_sugar_g: 5 })];
                await withTools(null, async (call) => {
                    const bad = await call("update_meal", {
                        id: MEAL_ID,
                        sugar_g: 20,
                        added_sugar_g: 25,
                    });
                    expect(bad.isError).toBe(true);
                    const ok = await call("update_meal", {
                        id: MEAL_ID,
                        sugar_g: 20,
                        added_sugar_g: 15,
                    });
                    expect(ok.isError).toBeFalsy();
                    // The row is read for its labels either way; only the good
                    // call writes, guarded by the row it read.
                    expect(db.storedMealReads).toBe(2);
                    expect(db.mealUpdateGuards).toHaveLength(1);
                    expect(db.mealUpdateGuards[0]).toMatchObject({
                        sugar_g: 5,
                        added_sugar_g: 5,
                    });
                });
            });

            test("updatedAddedSugarError merges the passed value over the stored one", () => {
                const stored = { sugar_g: 10, added_sugar_g: 4 };
                expect(
                    updatedAddedSugarError({ added_sugar_g: 10 }, stored),
                ).toBe(null);
                expect(
                    updatedAddedSugarError({ added_sugar_g: 11 }, stored),
                ).toContain("is more than sugar_g (10 g)");
                expect(
                    updatedAddedSugarError({ sugar_g: 3 }, stored),
                ).toContain("added_sugar_g (4 g)");
                // A side not recorded anywhere leaves nothing to compare against.
                expect(
                    updatedAddedSugarError(
                        { added_sugar_g: 50 },
                        { sugar_g: null, added_sugar_g: null },
                    ),
                ).toBe(null);
                expect(
                    updatedAddedSugarError({ added_sugar_g: 50 }, null),
                ).toBe(null);
            });
        });

        // The rollout-gated refusal: sugar_g without added_sugar_g. The gate is an
        // env var read per call, so these set and restore it rather than mock a
        // module (see "Server wiring" in CLAUDE.md for why the gate exists).
        describe("sugar_g without added_sugar_g (ADDED_SUGAR_REQUIRED_FROM)", () => {
            const PAST = "2000-01-01T00:00:00Z";
            const FUTURE = "2999-01-01T00:00:00Z";
            async function withGate(
                value: string | undefined,
                run: () => Promise<void>,
            ): Promise<void> {
                const before = process.env[ADDED_SUGAR_REQUIRED_FROM_ENV];
                if (value === undefined)
                    delete process.env[ADDED_SUGAR_REQUIRED_FROM_ENV];
                else process.env[ADDED_SUGAR_REQUIRED_FROM_ENV] = value;
                try {
                    await run();
                } finally {
                    if (before === undefined)
                        delete process.env[ADDED_SUGAR_REQUIRED_FROM_ENV];
                    else process.env[ADDED_SUGAR_REQUIRED_FROM_ENV] = before;
                }
            }
            const colaArgs = {
                description: "Cola (330 ml)",
                meal_type: "snack",
                sugar_g: 35,
            };

            test.each([
                ["unset", undefined],
                ["empty", ""],
                ["garbage", "next tuesday"],
                ["offset-less time", "2000-01-01T00:00"],
                ["in the future", FUTURE],
            ])("gate %s: sugar alone is still saved", async (_label, value) => {
                const warn = spyOn(console, "warn").mockImplementation(
                    () => {},
                );
                try {
                    await withGate(value, async () => {
                        expect(addedSugarRequiredNow()).toBe(false);
                        await withTools(null, async (call) => {
                            const r = await call("log_meal", colaArgs);
                            expect(r.isError).toBeFalsy();
                            expect(db.inserted).toHaveLength(1);
                            expect(
                                db.inserted[0]!.added_sugar_g,
                            ).toBeUndefined();
                        });
                    });
                } finally {
                    warn.mockRestore();
                }
            });

            test("an unparseable gate warns once, naming only the variable", () => {
                const warn = spyOn(console, "warn").mockImplementation(
                    () => {},
                );
                try {
                    return withGate("not-a-date-xyz", async () => {
                        addedSugarRequiredNow();
                        addedSugarRequiredNow();
                        const lines = warn.mock.calls
                            .map((c) => String(c[0]))
                            .filter((l) =>
                                l.includes(ADDED_SUGAR_REQUIRED_FROM_ENV),
                            );
                        expect(lines).toHaveLength(1);
                        expect(lines[0]).not.toContain("not-a-date-xyz");
                    });
                } finally {
                    warn.mockRestore();
                }
            });

            test("the gate switches on at its instant", () =>
                withGate("2026-10-05T00:00:00+03:00", async () => {
                    const at = Date.parse("2026-10-04T21:00:00Z");
                    expect(addedSugarRequiredNow(at - 1)).toBe(false);
                    expect(addedSugarRequiredNow(at)).toBe(true);
                }));

            test("gate past: log_meal refuses sugar without added sugar, writing nothing", () =>
                withGate(PAST, async () => {
                    await withTools(null, async (call) => {
                        for (const sugar_g of [35, 0]) {
                            const r = await call("log_meal", {
                                ...colaArgs,
                                sugar_g,
                            });
                            expect(r.isError).toBe(true);
                            expect(textOf(r)).toBe(addedSugarMissingText());
                        }
                    });
                    expect(db.inserted).toHaveLength(0);
                    // Refused before the profile read behind the timestamp.
                    expect(db.profileReads).toHaveLength(0);
                    const rows = db.analyticsRows.filter(
                        (r) => r.tool_name === "log_meal",
                    );
                    expect(rows).toHaveLength(2);
                    for (const row of rows) {
                        expect(row.success).toBe(false);
                        expect(row.error_category).toBe("added_sugar_missing");
                    }
                }));

            test("gate past: added sugar 0, or no sugar at all, is saved", () =>
                withGate(PAST, async () => {
                    await withTools(null, async (call) => {
                        const zero = await call("log_meal", {
                            description: "Apple",
                            meal_type: "snack",
                            sugar_g: 10,
                            added_sugar_g: 0,
                        });
                        expect(zero.isError).toBeFalsy();
                        const none = await call("log_meal", {
                            description: "Eggs",
                            meal_type: "breakfast",
                            calories: 150,
                        });
                        expect(none.isError).toBeFalsy();
                        // The missing-nutrient note still names the gap.
                        expect(textOf(none)).toContain(
                            "sugar_g, added_sugar_g",
                        );
                    });
                    expect(db.inserted).toHaveLength(2);
                }));

            test("gate past: the pair check still applies when both are given", () =>
                withGate(PAST, async () => {
                    await withTools(null, async (call) => {
                        const r = await call("log_meal", {
                            ...colaArgs,
                            sugar_g: 10,
                            added_sugar_g: 12,
                        });
                        expect(r.isError).toBe(true);
                        expect(textOf(r)).toContain(
                            "added_sugar_g (12 g) is more than sugar_g (10 g)",
                        );
                    });
                }));

            test("gate past: update_meal refuses sugar_g on a meal with no added sugar stored", () =>
                withGate(PAST, async () => {
                    db.meals = [meal({ sugar_g: 10, added_sugar_g: null })];
                    await withTools(null, async (call) => {
                        const r = await call("update_meal", {
                            id: MEAL_ID,
                            sugar_g: 35,
                        });
                        expect(r.isError).toBe(true);
                        expect(textOf(r)).toBe(addedSugarMissingText(MEAL_ID));
                        expect(textOf(r)).toContain(
                            `meal ${MEAL_ID} is unchanged`,
                        );
                        expect(db.mealUpdates).toHaveLength(0);
                        // Both given: saved.
                        const both = await call("update_meal", {
                            id: MEAL_ID,
                            sugar_g: 35,
                            added_sugar_g: 35,
                        });
                        expect(both.isError).toBeFalsy();
                    });
                    expect(db.mealUpdates).toHaveLength(1);
                    const refused = db.analyticsRows.find(
                        (r) => r.tool_name === "update_meal" && !r.success,
                    );
                    expect(refused?.error_category).toBe("added_sugar_missing");
                }));

            test("gate past: update_meal accepts sugar_g when added sugar is already stored", () =>
                withGate(PAST, async () => {
                    db.meals = [meal({ sugar_g: 40, added_sugar_g: 30 })];
                    await withTools(null, async (call) => {
                        const ok = await call("update_meal", {
                            id: MEAL_ID,
                            sugar_g: 35,
                        });
                        expect(ok.isError).toBeFalsy();
                        // The existing added ≤ total check is untouched. (The
                        // stub's updateMeal stores only the fields passed, so
                        // re-stage the stored pair.)
                        db.meals = [meal({ sugar_g: 40, added_sugar_g: 30 })];
                        const low = await call("update_meal", {
                            id: MEAL_ID,
                            sugar_g: 20,
                        });
                        expect(low.isError).toBe(true);
                        expect(textOf(low)).toContain(
                            "added_sugar_g (30 g) is more than sugar_g (20 g)",
                        );
                    });
                }));

            test("gate past: update_meal without sugar_g, and a missing meal, are unaffected", () =>
                withGate(PAST, async () => {
                    db.meals = [meal({ sugar_g: null, added_sugar_g: null })];
                    await withTools(null, async (call) => {
                        const r = await call("update_meal", {
                            id: MEAL_ID,
                            calories: 300,
                        });
                        expect(r.isError).toBeFalsy();
                        const added = await call("update_meal", {
                            id: MEAL_ID,
                            added_sugar_g: 5,
                        });
                        expect(added.isError).toBeFalsy();
                    });
                    expect(db.mealUpdates).toHaveLength(2);
                    // No such meal: not the added-sugar refusal (the stub's
                    // updateMeal stands in for the real not-found check).
                    db.meals = [];
                    await withTools(null, async (call) => {
                        const r = await call("update_meal", {
                            id: MEAL_ID,
                            sugar_g: 5,
                        });
                        expect(textOf(r)).not.toContain(
                            "added_sugar_g is required",
                        );
                    });
                }));

            test("gate past: bulk_import_meals is unaffected", () =>
                withGate(PAST, async () => {
                    await withTools(null, async (call) => {
                        const r = await call("bulk_import_meals", {
                            meals: [
                                {
                                    source_line: 2,
                                    description: "Cola",
                                    logged_at: "2026-07-20",
                                    calories: 139,
                                    sugar_g: 35,
                                },
                            ],
                            expected_row_count: 1,
                            dry_run: false,
                        });
                        expect(r.isError).toBeFalsy();
                        expect(
                            (r.structuredContent as { status: string }).status,
                        ).toBe("success");
                    });
                    expect(db.inserted).toHaveLength(1);
                    expect(db.inserted[0]!.sugar_g).toBe(35);
                }));

            test("the refusal text describes, never directs", () => {
                for (const text of [
                    addedSugarMissingText(),
                    addedSugarMissingText(MEAL_ID),
                ]) {
                    expect(text).toContain("100% fruit juice");
                    expect(text).not.toMatch(
                        /\bplease\b|you must|\bmust\b|ask the user|\bretry\b|call again|you should|\boffer\b/i,
                    );
                }
            });
        });

        describe("formatProgress / formatGoals", () => {
            test("an added-sugar ceiling line follows Sugar", () => {
                const day = [banana("b1"), banana("b2"), cola];
                const text = formatProgress(
                    sumMeals(day),
                    goals({ daily_sugar_g: null, daily_added_sugar_g: 25 }),
                    null,
                    nutrientPresence(day),
                );
                const lines = text.split("\n");
                const sugarAt = lines.findIndex((l) => l.startsWith("Sugar:"));
                expect(lines[sugarAt]).toBe("Sugar: 64.4g");
                expect(lines[sugarAt + 1]).toBe(
                    "Added sugar: 35 / 25g limit (140%, 10g over)",
                );
            });

            test("0 is a real added-sugar ceiling", () => {
                const zero = goals({ daily_added_sugar_g: 0 });
                const clear = [meal({ added_sugar_g: 0 })];
                expect(
                    formatProgress(
                        sumMeals(clear),
                        zero,
                        null,
                        nutrientPresence(clear),
                    ),
                ).toContain("Added sugar: 0 / 0g limit (clear)");
                const over = [meal({ added_sugar_g: 5 })];
                expect(
                    formatProgress(
                        sumMeals(over),
                        zero,
                        null,
                        nutrientPresence(over),
                    ),
                ).toContain("Added sugar: 5 / 0g limit (5g over)");
                expect(formatGoals(zero)).toContain("- Added sugar (max): 0g");
            });

            // A meal logged before the column existed is NULL: "not recorded"
            // when a limit is set, nothing at all otherwise — never "0g".
            test("an unrecorded day is not recorded, not zero", () => {
                const old = [meal({ added_sugar_g: null })];
                const present = nutrientPresence(old);
                expect(present.added_sugar_g).toBe(false);
                expect(
                    formatProgress(
                        sumMeals(old),
                        goals({ daily_added_sugar_g: 25 }),
                        null,
                        present,
                    ),
                ).toContain(
                    "Added sugar: not recorded on this day (limit 25g)",
                );
                const noLimit = formatProgress(
                    sumMeals(old),
                    goals(),
                    null,
                    present,
                );
                expect(noLimit).not.toContain("Added sugar");
                // Total sugar is untouched by the missing added figure.
                expect(noLimit).toContain("Sugar: 12 / 40g limit");
            });

            // The ChatGPT report: a cola logged with sugar_g 35 and no
            // added_sugar_g. The added-sugar line must still be there, saying it
            // was not recorded, so total sugar is never read against the
            // added-sugar limit. 0 is a real ceiling, so it gets the line too.
            test("a limit with nothing recorded prints the gap, 0 included", () => {
                const cola = [meal({ sugar_g: 35, added_sugar_g: null })];
                const present = nutrientPresence(cola);
                for (const [limit, shown] of [
                    [29, "29"],
                    [0, "0"],
                    [27.5, "27.5"],
                ] as const) {
                    const text = formatProgress(
                        sumMeals(cola),
                        goals({
                            daily_sugar_g: null,
                            daily_added_sugar_g: limit,
                        }),
                        null,
                        present,
                    );
                    const lines = text.split("\n");
                    const sugarAt = lines.findIndex((l) =>
                        l.startsWith("Sugar:"),
                    );
                    expect(lines[sugarAt]).toBe("Sugar: 35g");
                    expect(lines[sugarAt + 1]).toBe(
                        `Added sugar: not recorded on this day (limit ${shown}g)`,
                    );
                    expect(text).not.toMatch(/Added sugar: 35/);
                    // Describes the gap, never directs (#190's guard).
                    expect(lines[sugarAt + 1]).not.toMatch(
                        /\b(ask|offer|should|estimate|call|tell|suggest|please|must)\b/i,
                    );
                }
                // No limit and nothing recorded: exactly as before, no line.
                const none = formatProgress(
                    sumMeals(cola),
                    goals({ daily_sugar_g: null, daily_added_sugar_g: null }),
                    null,
                    present,
                );
                expect(none).not.toContain("Added sugar");
                expect(none.split("\n")).toHaveLength(
                    formatProgress(
                        sumMeals(cola),
                        goals({
                            daily_sugar_g: null,
                            daily_added_sugar_g: null,
                        }),
                        null,
                        { ...present, added_sugar_g: false },
                    ).split("\n").length,
                );
            });

            test("goals list both sugar limits, labelled apart", () => {
                const text = formatGoals(
                    goals({ daily_sugar_g: 50, daily_added_sugar_g: 25 }),
                );
                expect(text).toContain("- Sugar, total (max): 50g");
                expect(text).toContain("- Added sugar (max): 25g");
                expect(text.indexOf("Sugar, total")).toBeLessThan(
                    text.indexOf("Added sugar"),
                );
                expect(formatGoals(goals())).toContain(
                    "- Added sugar (max): not set",
                );
            });
        });

        describe("coverage", () => {
            const day = (over: Partial<Meal>) => {
                const meals = [meal(over)];
                return { meals, totals: sumMeals(meals) };
            };

            test("a day with sugar but no added sugar drops out of the added-sugar average only", () => {
                const { averages, recordedDays } = rangeAverages([
                    day({ sugar_g: 20, added_sugar_g: 10 }),
                    day({ sugar_g: 30, added_sugar_g: null }),
                ]);
                expect(recordedDays.sugar_g).toBe(2);
                expect(averages.sugar_g).toBe(25);
                expect(recordedDays.added_sugar_g).toBe(1);
                expect(averages.added_sugar_g).toBe(10);
            });

            test("ceilingAverageLine (added sugar) reads against the limit, and stays quiet when it has nothing to add", () => {
                expect(ceilingAverageLine("Added sugar", 10, 1, 2, 25)).toBe(
                    "\n\nAdded sugar, daily average: 10 / 25g limit (40%, under)",
                );
                expect(ceilingAverageLine("Added sugar", 10, 2, 2, null)).toBe(
                    "\n\nAdded sugar, daily average: 10g",
                );
                // A single day already prints its own line.
                expect(ceilingAverageLine("Added sugar", 10, 1, 1, 25)).toBe(
                    "",
                );
                // Nothing recorded is not an average of 0: silent without a
                // limit, the gap stated with one (0 is a real limit).
                expect(ceilingAverageLine("Added sugar", 0, 0, 3, null)).toBe(
                    "",
                );
                expect(ceilingAverageLine("Added sugar", 0, 0, 3, 25)).toBe(
                    "\n\nAdded sugar, daily average: not recorded in this period (limit 25g)",
                );
                expect(ceilingAverageLine("Added sugar", 0, 0, 3, 0)).toBe(
                    "\n\nAdded sugar, daily average: not recorded in this period (limit 0g)",
                );
                // A single day still defers to its own section.
                expect(ceilingAverageLine("Added sugar", 0, 0, 1, 25)).toBe("");
            });

            test("get_nutrition_summary states an unrecorded range against the limit", async () => {
                db.goals = goals({ daily_added_sugar_g: 29 });
                db.meals = [
                    meal({
                        logged_at: "2026-07-25T12:00:00.000Z",
                        sugar_g: 35,
                        added_sugar_g: null,
                    }),
                    meal({
                        id: "00000000-0000-4000-8000-0000000000d3",
                        logged_at: "2026-07-26T12:00:00.000Z",
                        sugar_g: 20,
                        added_sugar_g: null,
                    }),
                ];
                await withTools(null, async (call) => {
                    const r = await call("get_nutrition_summary", {
                        start_date: "2026-07-25",
                        end_date: "2026-07-26",
                    });
                    expect(r.isError).toBeFalsy();
                    const text = textOf(r);
                    expect(text).toContain(
                        "Added sugar, daily average: not recorded in this period (limit 29g)",
                    );
                    expect(
                        text.match(
                            /Added sugar: not recorded on this day \(limit 29g\)/g,
                        ),
                    ).toHaveLength(2);
                    // None recorded is not partial coverage: no coverage note.
                    expect(text).not.toContain("added sugar 0");
                    const meta = r._meta?.[
                        ADDED_SUGAR_META_KEY
                    ] as AddedSugarMeta;
                    expect(meta.goal).toBe(29);
                    expect(meta.days).toEqual({
                        "2026-07-25": null,
                        "2026-07-26": null,
                    });
                });
                // Without a limit the text is exactly what it was.
                db.goals = goals({ daily_added_sugar_g: null });
                await withTools(null, async (call) => {
                    const text = textOf(
                        await call("get_nutrition_summary", {
                            start_date: "2026-07-25",
                            end_date: "2026-07-26",
                        }),
                    );
                    expect(text).not.toContain("Added sugar");
                });
            });

            test("get_nutrition_summary averages added sugar in text over the days that record it", async () => {
                db.goals = goals({ daily_added_sugar_g: 25 });
                db.meals = [
                    meal({
                        logged_at: "2026-07-25T12:00:00.000Z",
                        sugar_g: 20,
                        added_sugar_g: 10,
                    }),
                    meal({
                        id: "00000000-0000-4000-8000-0000000000d2",
                        logged_at: "2026-07-26T12:00:00.000Z",
                        sugar_g: 30,
                        added_sugar_g: null,
                    }),
                ];
                await withTools(null, async (call) => {
                    const r = await call("get_nutrition_summary", {
                        start_date: "2026-07-25",
                        end_date: "2026-07-26",
                    });
                    expect(r.isError).toBeFalsy();
                    const text = textOf(r);
                    expect(text).toContain(
                        "Added sugar, daily average: 10 / 25g limit (40%, under)",
                    );
                    expect(text).toContain(
                        "(Averaged over the days that record each figure, not all 2: added sugar 1.)",
                    );
                    expect(text).toContain(
                        "Added sugar: not recorded on this day (limit 25g)",
                    );
                });
            });
        });

        describe("set_nutrition_goals", () => {
            test("stores, keeps, clears and echoes the added-sugar limit", async () => {
                await withTools(null, async (call) => {
                    const set = await call("set_nutrition_goals", {
                        daily_added_sugar_g: 25,
                    });
                    expect(set.isError).toBeFalsy();
                    expect(db.goals!.daily_added_sugar_g).toBe(25);
                    expect(textOf(set)).toContain("- Added sugar (max): 25g");

                    await call("set_nutrition_goals", { daily_protein_g: 130 });
                    expect(db.goals!.daily_added_sugar_g).toBe(25);

                    const zero = await call("set_nutrition_goals", {
                        daily_added_sugar_g: 0,
                    });
                    expect(textOf(zero)).toContain("- Added sugar (max): 0g");

                    await call("set_nutrition_goals", {
                        daily_added_sugar_g: null,
                    });
                    expect(db.goals!.daily_added_sugar_g).toBeNull();

                    const bad = await call("set_nutrition_goals", {
                        daily_added_sugar_g: MAX_GOAL_G + 1,
                    });
                    expect(bad.isError).toBe(true);
                });
            });
        });

        // The brief's acceptance day: two ~120 g bananas and a 330 ml cola.
        test("acceptance: bananas and a cola against a 25 g added-sugar limit", async () => {
            db.meals = [banana("b1"), banana("b2"), cola];
            db.goals = goals({ daily_sugar_g: null, daily_added_sugar_g: 25 });
            await withTools(null, async (call) => {
                const r = await call("get_goal_progress", {
                    date: "2026-07-26",
                });
                expect(r.isError).toBeFalsy();
                const text = textOf(r);
                expect(text).toContain("Sugar: 64.4g");
                expect(text).toContain(
                    "Added sugar: 35 / 25g limit (140%, 10g over)",
                );
            });
            // With the old 25 g total limit kept as well, both lines show.
            db.goals = goals({ daily_sugar_g: 25, daily_added_sugar_g: 25 });
            await withTools(null, async (call) => {
                const text = textOf(
                    await call("get_goal_progress", { date: "2026-07-26" }),
                );
                expect(text).toContain(
                    "Sugar: 64.4 / 25g limit (258%, 39.4g over)",
                );
                expect(text).toContain(
                    "Added sugar: 35 / 25g limit (140%, 10g over)",
                );
            });
        });
    });

    // ---------- added sugar reaches the widgets through _meta ----------
    //
    // No structuredContent object may gain a field (the schemas are frozen), so
    // the five widget tools carry an AddedSugarMeta under ADDED_SUGAR_META_KEY in
    // the result's _meta instead. Driven over HTTP on both eras: withHttpClient
    // arms the client's advertised-schema check, so every call below also proves
    // structuredContent still validates against the frozen schema.
    describe("added sugar rides in _meta on every widget tool", () => {
        // The payload's whole v1 contract, strictly: a stray key would mean the
        // widget is reading something the server never promised.
        const ADDED_SUGAR_META = z
            .object({
                v: z.literal(1),
                goal: z.number().nullable(),
                days: z.record(z.string(), z.number().nullable()).optional(),
                meals: z.record(z.string(), z.number().nullable()).optional(),
                contributors: z.number().int().min(0).optional(),
                extra: z
                    .array(
                        z.strictObject({
                            description: z.string(),
                            meal_type: z.string().nullable(),
                            date: z.string().nullable(),
                            added_sugar_g: z.number().positive(),
                        }),
                    )
                    .max(MEAL_BREAKDOWN_TOP_N)
                    .optional(),
            })
            .strict();
        type AddedSugarPayload = z.infer<typeof ADDED_SUGAR_META>;

        const DAY = "2026-07-26";
        const BANANA_1 = "00000000-0000-4000-8000-0000000000b1";
        const BANANA_2 = "00000000-0000-4000-8000-0000000000b2";
        const COLA = "00000000-0000-4000-8000-0000000000c1";

        // The brief's acceptance day: two bananas (~120 g each) and a 330 ml
        // cola — about 64 g total sugar, 35 g of it added, all from the cola.
        function bananasAndCola(): Meal[] {
            return [
                meal({
                    id: BANANA_1,
                    logged_at: `${DAY}T08:00:00.000Z`,
                    description: "Banana",
                    calories: 107,
                    sugar_g: 14.7,
                    added_sugar_g: 0,
                    alcohol_g: 0,
                }),
                meal({
                    id: BANANA_2,
                    logged_at: `${DAY}T11:00:00.000Z`,
                    description: "Banana",
                    calories: 107,
                    sugar_g: 14.7,
                    added_sugar_g: 0,
                    alcohol_g: 0,
                }),
                meal({
                    id: COLA,
                    logged_at: `${DAY}T15:00:00.000Z`,
                    description: "Cola 330 ml",
                    calories: 139,
                    sugar_g: 35,
                    added_sugar_g: 35,
                    alcohol_g: 0,
                }),
            ];
        }

        async function call(
            client: Client,
            name: string,
            args: Record<string, unknown>,
        ): Promise<{ r: ToolResult; meta: AddedSugarPayload }> {
            const r = (await client.callTool({
                name,
                arguments: args,
            })) as unknown as ToolResult;
            expect(r.isError).toBeFalsy();
            expect(r.structuredContent).toBeDefined();
            // Nothing added sugar touches may leak into structuredContent.
            expect(JSON.stringify(r.structuredContent)).not.toContain(
                "added_sugar",
            );
            const meta = ADDED_SUGAR_META.parse(
                r._meta?.[ADDED_SUGAR_META_KEY],
            );
            return { r, meta };
        }

        // The widget joins meta.meals to the breakdown rows BY POSITION (the rows
        // carry no id), so the two must have one length and one order.
        function expectJoinable(r: ToolResult, meta: AddedSugarPayload) {
            const rows = (r.structuredContent as { meals: unknown[] }).meals;
            expect(Object.keys(meta.meals ?? {})).toHaveLength(rows.length);
        }

        describe.each(ERAS)("%p", (mode) => {
            test("log_meal: goal, the day, and the shown meals", async () => {
                db.goals = goals({ daily_added_sugar_g: 25 });
                await withHttpClient("u1", mode, async (client) => {
                    const { r, meta } = await call(client, "log_meal", {
                        description: "Cola 330 ml",
                        meal_type: "snack",
                        calories: 139,
                        sugar_g: 35,
                        added_sugar_g: 35,
                        logged_at: `${DAY}T15:00:00Z`,
                    });
                    expect(meta.goal).toBe(25);
                    expect(meta.days).toEqual({ [DAY]: 35 });
                    expect(meta.meals).toEqual({ [MEAL_ID]: 35 });
                    expect(meta).not.toHaveProperty("contributors");
                    expectJoinable(r, meta);
                });
            });

            // The ChatGPT report, end to end: a 330 ml cola logged with sugar_g
            // 35 and no added_sugar_g against a 29 g limit. The text states the
            // gap instead of leaving total sugar to be read against the limit,
            // and _meta still carries the goal beside a null (not recorded) day,
            // which is what lets the widget show its "not recorded" cell.
            test("log_meal without added_sugar_g: not recorded, goal kept", async () => {
                db.goals = goals({
                    daily_sugar_g: null,
                    daily_added_sugar_g: 29,
                });
                await withHttpClient("u1", mode, async (client) => {
                    const { r, meta } = await call(client, "log_meal", {
                        description: "Cola 330 ml",
                        meal_type: "snack",
                        calories: 139,
                        sugar_g: 35,
                        logged_at: `${DAY}T15:00:00Z`,
                    });
                    const text = textOf(r);
                    expect(text).toContain("Sugar: 35g");
                    expect(text).toContain(
                        "Added sugar: not recorded on this day (limit 29g)",
                    );
                    expect(text).not.toMatch(/Added sugar: 35|6g over/);
                    expect(meta).toEqual({
                        v: 1,
                        goal: 29,
                        days: { [DAY]: null },
                        meals: { [MEAL_ID]: null },
                    });
                });
            });

            test("get_trends with a limit and nothing recorded keeps the goal", async () => {
                db.goals = goals({ daily_added_sugar_g: 29 });
                db.meals = [
                    meal({
                        logged_at: `${DAY}T15:00:00.000Z`,
                        sugar_g: 35,
                        added_sugar_g: null,
                    }),
                ];
                await withHttpClient("u1", mode, async (client) => {
                    const { r, meta } = await call(client, "get_trends", {
                        days: 7,
                        end_date: DAY,
                    });
                    expect(textOf(r)).toContain(
                        "Added sugar: not recorded in this period (limit 29g)",
                    );
                    expect(meta.goal).toBe(29);
                    expect(meta.days?.[DAY]).toBeNull();
                    expect(
                        Object.values(meta.days ?? {}).every((v) => v === null),
                    ).toBe(true);
                });
            });

            test("log_meal with no goals and no added sugar still carries it", async () => {
                await withHttpClient("u1", mode, async (client) => {
                    const { meta } = await call(client, "log_meal", {
                        description: "Toast",
                        meal_type: "snack",
                        calories: 80,
                        logged_at: `${DAY}T08:00:00Z`,
                    });
                    // Not recorded: a null day and a null meal, never 0.
                    expect(meta).toEqual({
                        v: 1,
                        goal: null,
                        days: { [DAY]: null },
                        meals: { [MEAL_ID]: null },
                    });
                });
            });

            test("update_meal: the same payload as log_meal", async () => {
                db.goals = goals({ daily_added_sugar_g: 0 });
                await withHttpClient("u1", mode, async (client) => {
                    const { r, meta } = await call(client, "update_meal", {
                        id: MEAL_ID,
                        sugar_g: 20,
                        added_sugar_g: 12,
                        logged_at: `${DAY}T12:00:00Z`,
                    });
                    // 0 is a real ceiling, not "unset".
                    expect(meta.goal).toBe(0);
                    expect(meta.days).toEqual({ [DAY]: 12 });
                    expect(meta.meals).toEqual({ [MEAL_ID]: 12 });
                    expectJoinable(r, meta);
                });
            });

            test("get_goal_progress: the acceptance day", async () => {
                db.goals = goals({
                    daily_sugar_g: null,
                    daily_added_sugar_g: 25,
                });
                db.meals = bananasAndCola();
                await withHttpClient("u1", mode, async (client) => {
                    const { r, meta } = await call(
                        client,
                        "get_goal_progress",
                        {
                            date: DAY,
                        },
                    );
                    expect(meta.goal).toBe(25);
                    expect(meta.days).toEqual({ [DAY]: 35 });
                    expect(meta.meals).toEqual({
                        [BANANA_1]: 0,
                        [BANANA_2]: 0,
                        [COLA]: 35,
                    });
                    expect(Object.keys(meta.meals!)).toEqual([
                        BANANA_1,
                        BANANA_2,
                        COLA,
                    ]);
                    // A single day lists every meal; nothing to add.
                    expect(meta).not.toHaveProperty("extra");
                    expectJoinable(r, meta);
                });
            });

            test("get_goal_progress: an empty day", async () => {
                await withHttpClient("u1", mode, async (client) => {
                    const { meta } = await call(client, "get_goal_progress", {
                        date: DAY,
                    });
                    expect(meta).toEqual({
                        v: 1,
                        goal: null,
                        days: { [DAY]: null },
                        meals: {},
                    });
                });
            });

            test("get_nutrition_summary: merged beside the contributors", async () => {
                db.goals = goals({ daily_added_sugar_g: 25 });
                // A pre-feature day (no added sugar recorded) beside the
                // acceptance day: it is null, never 0.
                db.meals = [
                    meal({
                        id: "00000000-0000-4000-8000-0000000000a1",
                        logged_at: "2026-07-25T12:00:00.000Z",
                        added_sugar_g: null,
                    }),
                    ...bananasAndCola(),
                ];
                await withHttpClient("u1", mode, async (client) => {
                    const { r, meta } = await call(
                        client,
                        "get_nutrition_summary",
                        { start_date: "2026-07-20", end_date: DAY },
                    );
                    expect(meta.goal).toBe(25);
                    expect(meta.days).toEqual({
                        "2026-07-25": null,
                        [DAY]: 35,
                    });
                    expect(meta.contributors).toBe(1);
                    expect(meta.meals?.[COLA]).toBe(35);
                    // Every meal is kept here, so nothing is left for `extra`.
                    expect(meta.extra).toEqual([]);
                    expectJoinable(r, meta);
                    // The contributors key is still there, in the same object.
                    expect(
                        MEAL_CONTRIBUTORS.parse(
                            r._meta?.[MEAL_CONTRIBUTORS_META_KEY],
                        ).calories,
                    ).toBe(4);
                });
            });

            test("get_nutrition_summary: the empty path", async () => {
                await withHttpClient("u1", mode, async (client) => {
                    const { r, meta } = await call(
                        client,
                        "get_nutrition_summary",
                        { start_date: "2026-07-20", end_date: DAY },
                    );
                    expect(meta).toEqual({
                        v: 1,
                        goal: null,
                        days: {},
                        meals: {},
                        contributors: 0,
                    });
                    expect(
                        MEAL_CONTRIBUTORS.parse(
                            r._meta?.[MEAL_CONTRIBUTORS_META_KEY],
                        ).calories,
                    ).toBe(0);
                });
            });

            test("get_trends: goal and the 30-day series", async () => {
                db.goals = goals({ daily_added_sugar_g: 25 });
                db.meals = bananasAndCola();
                await withHttpClient("u1", mode, async (client) => {
                    const { r, meta } = await call(client, "get_trends", {
                        days: 7,
                        end_date: DAY,
                    });
                    expect(meta.goal).toBe(25);
                    const days = meta.days!;
                    // Every day of the series the widget can toggle across, so
                    // it can re-average 7/14/30 on its own.
                    const series = (
                        r.structuredContent as { days: { date: string }[] }
                    ).days.map((d) => d.date);
                    expect(Object.keys(days).sort()).toEqual(
                        [...series].sort(),
                    );
                    expect(series).toHaveLength(30);
                    expect(days[DAY]).toBe(35);
                    expect(days["2026-07-25"]).toBeNull();
                    expect(meta).not.toHaveProperty("meals");
                    expect(r._meta).not.toHaveProperty(
                        PERIOD_AVERAGES_META_KEY,
                    );
                });
            });

            test("get_trends: the empty series, and merged with period averages", async () => {
                await withHttpClient("u1", mode, async (client) => {
                    const { r, meta } = await call(client, "get_trends", {
                        end_date: DAY,
                        group_by: "month",
                    });
                    expect(meta.goal).toBeNull();
                    expect(Object.values(meta.days!)).toHaveLength(30);
                    expect(
                        Object.values(meta.days!).every((v) => v === null),
                    ).toBe(true);
                    expect(r._meta?.[PERIOD_AVERAGES_META_KEY]).toBeDefined();
                });
            });
        });

        test("added sugar never changes which rows the summary keeps", () => {
            // Eight meals lead every row metric; a ninth is last on all of them
            // but first on added sugar. Ranking by added sugar would add it to
            // structuredContent.meals for every host, _meta or not, so it stays
            // out: the added-sugar list draws from the kept rows only.
            const meals = [
                meal({
                    id: "x0",
                    description: "sweet",
                    calories: 1,
                    protein_g: 0.1,
                    carbs_g: 0.1,
                    fat_g: 0.1,
                    fiber_g: 0.1,
                    sugar_g: 40,
                    added_sugar_g: 40,
                    alcohol_g: 0,
                }),
                ...Array.from({ length: 8 }, (_, i) =>
                    meal({
                        id: `x${i + 1}`,
                        description: `big ${i}`,
                        sugar_g: 50 + i,
                        added_sugar_g: 0,
                        caffeine_mg: 80,
                    }),
                ),
            ];
            const rows = mealBreakdown(meals, "UTC", "us");
            const top = topMealBreakdown(rows, "us");
            expect(top.kept).not.toContain(0);
            expect(top.kept).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
            expect(top.meals).toEqual(top.kept.map((i) => rows[i]!));
            expect(() =>
                MEAL_CONTRIBUTORS.parse(top.contributors),
            ).not.toThrow();
        });

        // Each widget repeats the key as a literal (it cannot import), so a
        // rename on one side would silently drop the cell.
        test.each([
            "nutrition-summary",
            "goal-progress",
            "meal-logged",
            "trends",
        ])("the assembled %s widget reads the key", async (key) => {
            expect(await getWidgetHtml(key)).toContain(ADDED_SUGAR_META_KEY);
        });
    });

    // Saturated fat rides in _meta beside added sugar (SATURATED_FAT_META_KEY,
    // built by buildSaturatedFatMeta in src/saturated-fat.ts), on every tool that
    // carries AddedSugarMeta. Its output schemas are frozen, so the figure is
    // asserted absent from structuredContent here and the frozen pin is checked
    // by the "output schemas" test above.
    describe("saturated fat rides in _meta on every widget tool", () => {
        const SATURATED_META = z
            .strictObject({
                v: z.literal(1),
                goal: z.number().nullable(),
                days: z.record(z.string(), z.number().nullable()).optional(),
                meals: z.record(z.string(), z.number().nullable()).optional(),
                contributors: z.number().optional(),
                extra: z
                    .array(
                        z.strictObject({
                            description: z.string(),
                            meal_type: z.string().nullable(),
                            date: z.string().nullable(),
                            saturated_fat_g: z.number(),
                        }),
                    )
                    .optional(),
                trans: z
                    .strictObject({
                        days: z
                            .record(z.string(), z.number().nullable())
                            .optional(),
                        meals: z
                            .record(z.string(), z.number().nullable())
                            .optional(),
                        contributors: z.number().optional(),
                        extra: z
                            .array(
                                z.strictObject({
                                    description: z.string(),
                                    meal_type: z.string().nullable(),
                                    date: z.string().nullable(),
                                    trans_fat_g: z.number(),
                                }),
                            )
                            .optional(),
                    })
                    .optional(),
            })
            .strict();
        const DAY = "2026-07-26";

        async function call(
            client: Client,
            name: string,
            args: Record<string, unknown>,
        ) {
            const r = (await client.callTool({
                name,
                arguments: args,
            })) as unknown as ToolResult;
            expect(r.isError).toBeFalsy();
            expect(r.structuredContent).toBeDefined();
            // Nothing saturated fat touches may leak into structuredContent.
            expect(JSON.stringify(r.structuredContent)).not.toContain(
                "saturated",
            );
            const meta = SATURATED_META.parse(
                r._meta?.[SATURATED_FAT_META_KEY],
            );
            return { r, meta };
        }

        describe.each(ERAS)("%p", (mode) => {
            test("log_meal: the saturated goal, the day and the shown meal", async () => {
                db.goals = goals({ daily_saturated_fat_g: 20 });
                await withHttpClient("u1", mode, async (client) => {
                    const { meta } = await call(client, "log_meal", {
                        description: "Cheese burger",
                        meal_type: "dinner",
                        calories: 600,
                        fat_g: 30,
                        saturated_fat_g: 12,
                        logged_at: `${DAY}T18:00:00Z`,
                    });
                    expect(meta.goal).toBe(20);
                    expect(meta.days).toEqual({ [DAY]: 12 });
                    expect(meta.meals).toEqual({ [MEAL_ID]: 12 });
                });
            });

            test("log_meal: no goal and no saturated fat is goal null, not a zero", async () => {
                db.goals = goals({ daily_saturated_fat_g: null });
                await withHttpClient("u1", mode, async (client) => {
                    const { meta } = await call(client, "log_meal", {
                        description: "Rice",
                        meal_type: "dinner",
                        calories: 200,
                        logged_at: `${DAY}T18:00:00Z`,
                    });
                    expect(meta.goal).toBeNull();
                    expect(meta.days).toEqual({ [DAY]: null });
                    expect(meta.meals).toEqual({ [MEAL_ID]: null });
                });
            });

            test("update_meal: the same payload as log_meal", async () => {
                db.goals = goals({ daily_saturated_fat_g: 20 });
                db.meals = [
                    meal({
                        logged_at: `${DAY}T18:00:00Z`,
                        fat_g: 30,
                        saturated_fat_g: null,
                    }),
                ];
                await withHttpClient("u1", mode, async (client) => {
                    const { meta } = await call(client, "update_meal", {
                        id: MEAL_ID,
                        saturated_fat_g: 9,
                        logged_at: `${DAY}T18:00:00Z`,
                    });
                    expect(meta.goal).toBe(20);
                    expect(meta.days).toEqual({ [DAY]: 9 });
                });
            });

            test("get_goal_progress, get_nutrition_summary and get_trends carry it", async () => {
                db.goals = goals({ daily_saturated_fat_g: 20 });
                db.meals = [
                    meal({
                        logged_at: `${DAY}T12:00:00Z`,
                        fat_g: 25,
                        saturated_fat_g: 9,
                    }),
                ];
                await withHttpClient("u1", mode, async (client) => {
                    const progress = await call(client, "get_goal_progress", {
                        date: DAY,
                    });
                    expect(progress.meta.goal).toBe(20);
                    expect(progress.meta.days).toEqual({ [DAY]: 9 });

                    const summary = await call(
                        client,
                        "get_nutrition_summary",
                        {
                            start_date: DAY,
                            end_date: DAY,
                        },
                    );
                    expect(summary.meta.goal).toBe(20);
                    expect(summary.meta.days?.[DAY]).toBe(9);

                    const trends = await call(client, "get_trends", {
                        end_date: DAY,
                    });
                    expect(trends.meta.goal).toBe(20);
                    expect(trends.meta.days?.[DAY]).toBe(9);
                });
            });
        });
    });

    // Sodium rides in _meta beside saturated fat (SODIUM_META_KEY, built by
    // buildSodiumMeta in src/sodium.ts), on every tool that carries the
    // saturated-fat payload. Output schemas are frozen, so the figure is asserted
    // absent from structuredContent here; the frozen pin is the "output schemas"
    // test above. The meal-logged, nutrition-summary and trends widgets read the
    // key; the trends literal is checked at the end of this block, the other two
    // in the "meal times" block below.
    describe("sodium rides in _meta on every widget tool", () => {
        const SODIUM_META = z.strictObject({
            v: z.literal(1),
            goal: z.number().nullable(),
            days: z.record(z.string(), z.number().nullable()).optional(),
            meals: z.record(z.string(), z.number().nullable()).optional(),
            contributors: z.number().optional(),
            extra: z
                .array(
                    z.strictObject({
                        description: z.string(),
                        meal_type: z.string().nullable(),
                        date: z.string().nullable(),
                        sodium_mg: z.number(),
                    }),
                )
                .optional(),
        });
        const DAY = "2026-07-26";

        async function call(
            client: Client,
            name: string,
            args: Record<string, unknown>,
        ) {
            const r = (await client.callTool({
                name,
                arguments: args,
            })) as unknown as ToolResult;
            expect(r.isError).toBeFalsy();
            expect(r.structuredContent).toBeDefined();
            // Nothing sodium touches may leak into structuredContent.
            expect(JSON.stringify(r.structuredContent)).not.toContain("sodium");
            const meta = SODIUM_META.parse(r._meta?.[SODIUM_META_KEY]);
            return { r, meta };
        }

        describe.each(ERAS)("%p", (mode) => {
            test("log_meal: the sodium goal, the day and the shown meal", async () => {
                db.goals = goals({ daily_sodium_mg: 2300 });
                await withHttpClient("u1", mode, async (client) => {
                    const { r, meta } = await call(client, "log_meal", {
                        description: "Ramen",
                        meal_type: "dinner",
                        calories: 600,
                        sodium_mg: 1820,
                        logged_at: `${DAY}T18:00:00Z`,
                    });
                    expect(meta.goal).toBe(2300);
                    expect(meta.days).toEqual({ [DAY]: 1820 });
                    expect(meta.meals).toEqual({ [MEAL_ID]: 1820 });
                    const text = (r.content as { text: string }[])[0]!.text;
                    expect(text).toContain("Sodium: 1820 mg");
                    expect(text).toContain(
                        "Sodium: 1820 / 2300 mg limit (79%, under)",
                    );
                });
            });

            test("log_meal: no goal and no sodium is goal null, not a zero", async () => {
                db.goals = goals({ daily_sodium_mg: null });
                await withHttpClient("u1", mode, async (client) => {
                    const { meta } = await call(client, "log_meal", {
                        description: "Rice",
                        meal_type: "dinner",
                        calories: 200,
                        logged_at: `${DAY}T18:00:00Z`,
                    });
                    expect(meta.goal).toBeNull();
                    expect(meta.days).toEqual({ [DAY]: null });
                    expect(meta.meals).toEqual({ [MEAL_ID]: null });
                });
            });

            test("update_meal: the same payload as log_meal", async () => {
                db.goals = goals({ daily_sodium_mg: 1500 });
                db.meals = [
                    meal({ logged_at: `${DAY}T18:00:00Z`, sodium_mg: null }),
                ];
                await withHttpClient("u1", mode, async (client) => {
                    const { meta } = await call(client, "update_meal", {
                        id: MEAL_ID,
                        sodium_mg: 640,
                        logged_at: `${DAY}T18:00:00Z`,
                    });
                    expect(meta.goal).toBe(1500);
                    expect(meta.days).toEqual({ [DAY]: 640 });
                });
            });

            test("get_goal_progress, get_nutrition_summary and get_trends carry it", async () => {
                db.goals = goals({ daily_sodium_mg: 2300 });
                db.meals = [
                    meal({ logged_at: `${DAY}T12:00:00Z`, sodium_mg: 900 }),
                ];
                await withHttpClient("u1", mode, async (client) => {
                    const progress = await call(client, "get_goal_progress", {
                        date: DAY,
                    });
                    expect(progress.meta.goal).toBe(2300);
                    expect(progress.meta.days).toEqual({ [DAY]: 900 });

                    const summary = await call(
                        client,
                        "get_nutrition_summary",
                        {
                            start_date: DAY,
                            end_date: DAY,
                        },
                    );
                    expect(summary.meta.goal).toBe(2300);
                    expect(summary.meta.days?.[DAY]).toBe(900);
                    expect(summary.meta.contributors).toBe(1);
                    expect(summary.meta.extra).toEqual([]);

                    const trends = await call(client, "get_trends", {
                        end_date: DAY,
                    });
                    expect(trends.meta.goal).toBe(2300);
                    expect(trends.meta.days?.[DAY]).toBe(900);
                    // get_trends alone also says which day is still running.
                    expect(trends.r._meta?.[LOCAL_TODAY_META_KEY]).toEqual({
                        v: 1,
                        today: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
                    });
                    expect(
                        progress.r._meta?.[LOCAL_TODAY_META_KEY],
                    ).toBeUndefined();
                });
            });
        });

        // The trends widget draws sodium (and saturated fat, and the
        // still-running day) from `_meta`; it cannot import, so it repeats each
        // key as a literal, and a rename on the server would silently drop them.
        test("the assembled trends widget reads every key it draws", async () => {
            expect(LOCAL_TODAY_META_KEY).toBe("nutrition-mcp.com/local-today");
            const html = await getWidgetHtml("trends");
            for (const key of [
                ADDED_SUGAR_META_KEY,
                SATURATED_FAT_META_KEY,
                SODIUM_META_KEY,
                LOCAL_TODAY_META_KEY,
            ]) {
                expect(html).toContain(JSON.stringify(key));
            }
        });
    });

    // Each row's local clock time rides in _meta (MEAL_TIMES_META_KEY, built by
    // buildMealTimesMeta in src/meal-times.ts), aligned with structuredContent.meals;
    // the meal-progress tools add the written meal's position. Output schemas are
    // frozen, so none of it may reach structuredContent.
    describe("meal times ride in _meta beside the breakdown rows", () => {
        const TIMES_META = z.strictObject({
            v: z.literal(1),
            times: z.array(z.string().regex(/^\d{2}:\d{2}$/)),
            current: z.number().nullable().optional(),
        });
        const DAY = "2026-07-26";

        describe.each(ERAS)("%p", (mode) => {
            test("log_meal names the written meal's position and every row's time", async () => {
                await withHttpClient("u1", mode, async (client) => {
                    const r = (await client.callTool({
                        name: "log_meal",
                        arguments: {
                            description: "Ramen",
                            meal_type: "dinner",
                            calories: 600,
                            logged_at: `${DAY}T18:00:00Z`,
                        },
                    })) as unknown as ToolResult;
                    expect(r.isError).toBeFalsy();
                    const sc = r.structuredContent as { meals: unknown[] };
                    const meta = TIMES_META.parse(
                        r._meta?.[MEAL_TIMES_META_KEY],
                    );
                    expect(meta.times).toHaveLength(sc.meals.length);
                    expect(meta.current).toBe(sc.meals.length - 1);
                    expect(JSON.stringify(sc)).not.toContain('"times"');
                });
            });

            test("a backdated log_meal points `current` at its own row, not the last one", async () => {
                db.sameDayMeals = [
                    meal({
                        id: "00000000-0000-4000-8000-0000000000aa",
                        logged_at: `${DAY}T19:00:00Z`,
                        description: "Late dinner",
                    }),
                ];
                await withHttpClient("u1", mode, async (client) => {
                    const r = (await client.callTool({
                        name: "log_meal",
                        arguments: {
                            description: "Early oats",
                            meal_type: "breakfast",
                            calories: 350,
                            logged_at: `${DAY}T07:00:00Z`,
                        },
                    })) as unknown as ToolResult;
                    expect(r.isError).toBeFalsy();
                    const sc = r.structuredContent as {
                        meals: { description: string }[];
                    };
                    const meta = TIMES_META.parse(
                        r._meta?.[MEAL_TIMES_META_KEY],
                    );
                    expect(sc.meals).toHaveLength(2);
                    expect(meta.current).not.toBe(sc.meals.length - 1);
                    expect(sc.meals[meta.current!]!.description).toBe(
                        "Early oats",
                    );
                });
            });

            test("update_meal points `current` at the edited meal among later ones", async () => {
                db.meals = [
                    meal({
                        logged_at: `${DAY}T08:00:00Z`,
                        description: "Toast",
                    }),
                ];
                db.sameDayMeals = [
                    meal({
                        id: "00000000-0000-4000-8000-0000000000bb",
                        logged_at: `${DAY}T19:00:00Z`,
                        description: "Late dinner",
                    }),
                ];
                await withHttpClient("u1", mode, async (client) => {
                    const r = (await client.callTool({
                        name: "update_meal",
                        arguments: {
                            id: MEAL_ID,
                            description: "Toast",
                            calories: 320,
                        },
                    })) as unknown as ToolResult;
                    expect(r.isError).toBeFalsy();
                    const sc = r.structuredContent as {
                        meals: { description: string }[];
                    };
                    const meta = TIMES_META.parse(
                        r._meta?.[MEAL_TIMES_META_KEY],
                    );
                    expect(sc.meals[meta.current!]!.description).toBe("Toast");
                    expect(meta.current).toBe(0);
                });
            });

            test("get_nutrition_summary carries one time per kept row, and none on an empty range", async () => {
                db.meals = [meal({ logged_at: `${DAY}T12:30:00Z` })];
                await withHttpClient("u1", mode, async (client) => {
                    const r = (await client.callTool({
                        name: "get_nutrition_summary",
                        arguments: { start_date: DAY, end_date: DAY },
                    })) as unknown as ToolResult;
                    const sc = r.structuredContent as { meals: unknown[] };
                    const meta = TIMES_META.parse(
                        r._meta?.[MEAL_TIMES_META_KEY],
                    );
                    expect(meta.times).toHaveLength(sc.meals.length);
                    expect(meta.current).toBeUndefined();

                    db.meals = [];
                    const empty = (await client.callTool({
                        name: "get_nutrition_summary",
                        arguments: { start_date: DAY, end_date: DAY },
                    })) as unknown as ToolResult;
                    expect(
                        TIMES_META.parse(empty._meta?.[MEAL_TIMES_META_KEY]),
                    ).toEqual({ v: 1, times: [] });
                });
            });
        });

        // The widgets cannot import the keys, so each repeats the literals.
        test.each(["meal-logged", "nutrition-summary"])(
            "the %s template reads the meal-times and sodium keys",
            async (key) => {
                const tpl = await Bun.file(
                    `./public/widgets/src/templates/${key}.html`,
                ).text();
                expect(tpl).toContain(JSON.stringify(MEAL_TIMES_META_KEY));
                expect(tpl).toContain(JSON.stringify(SODIUM_META_KEY));
                const html = await getWidgetHtml(key);
                expect(html).toContain(JSON.stringify(MEAL_TIMES_META_KEY));
                expect(html).toContain(JSON.stringify(SODIUM_META_KEY));
            },
        );

        // The same literal rule for the activity key (the summary's gauge line and
        // the trends' Burned / Net options).
        test.each(["nutrition-summary", "trends"])(
            "the %s template reads the activity key",
            async (key) => {
                const tpl = await Bun.file(
                    `./public/widgets/src/templates/${key}.html`,
                ).text();
                expect(tpl).toContain(JSON.stringify(ACTIVITY_META_KEY));
                const html = await getWidgetHtml(key);
                expect(html).toContain(JSON.stringify(ACTIVITY_META_KEY));
            },
        );
    });

    describe("sodium in the model-facing text", () => {
        test("formatProgress: whole mg against the limit, and stated when not recorded", () => {
            const salty = meal({ sodium_mg: 2600.4 });
            const over = formatProgress(
                sumMeals([salty]),
                goals({ daily_sodium_mg: 2300 }),
                "us",
                nutrientPresence([salty]),
            );
            expect(over).toContain(
                "Sodium: 2600 / 2300 mg limit (113%, 300 mg over)",
            );

            const none = meal({ sodium_mg: null });
            expect(
                formatProgress(
                    sumMeals([none]),
                    goals({ daily_sodium_mg: 2300 }),
                    "us",
                    nutrientPresence([none]),
                ),
            ).toContain("Sodium: not recorded on this day (limit 2300 mg)");
            // No limit and nothing recorded: no line, never a made-up 0.
            expect(
                formatProgress(
                    sumMeals([none]),
                    goals({ daily_sodium_mg: null }),
                    "us",
                    nutrientPresence([none]),
                ),
            ).not.toContain("Sodium");
            // 0 is a real limit.
            expect(
                formatProgress(
                    sumMeals([none]),
                    goals({ daily_sodium_mg: 0 }),
                    "us",
                    nutrientPresence([none]),
                ),
            ).toContain("Sodium: not recorded on this day (limit 0 mg)");
        });

        test("formatGoals names the sodium limit in mg", () => {
            expect(
                formatGoals(goals({ daily_sodium_mg: 2300 }), "kg", "us"),
            ).toContain("- Sodium (max): 2300 mg");
        });

        test("ceilingAverageLine takes a mg unit for sodium", () => {
            expect(ceilingAverageLine("Sodium", 1800, 2, 3, 2300, " mg")).toBe(
                "\n\nSodium, daily average: 1800 / 2300 mg limit (78%, under)",
            );
            expect(ceilingAverageLine("Sodium", 0, 0, 3, 2300, " mg")).toBe(
                "\n\nSodium, daily average: not recorded in this period (limit 2300 mg)",
            );
            expect(ceilingAverageLine("Sodium", 0, 0, 3, null, " mg")).toBe("");
        });

        test("the sodium field descriptions describe without directing", async () => {
            const server = new McpServer(
                { name: "nutrition-mcp-test", version: "0.0.0" },
                { capabilities: { tools: {}, resources: {} } },
            );
            registerTools(server, "u1", true, null);
            const [clientTransport, serverTransport] =
                InMemoryTransport.createLinkedPair();
            const client = new Client({
                name: "test-client",
                version: "0.0.0",
            });
            await Promise.all([
                server.connect(serverTransport),
                client.connect(clientTransport),
            ]);
            const { tools } = await client.listTools();
            const logMeal = tools.find((t) => t.name === "log_meal")!;
            const props = (
                logMeal.inputSchema as {
                    properties: Record<string, { description?: string }>;
                }
            ).properties;
            expect(props.sodium_mg?.description).toContain("not salt");
            const goalsTool = tools.find(
                (t) => t.name === "set_nutrition_goals",
            )!;
            const gProps = (
                goalsTool.inputSchema as {
                    properties: Record<string, { description?: string }>;
                }
            ).properties;
            expect(gProps.daily_sodium_mg?.description).toContain("MILLIGRAMS");
            for (const d of [
                props.sodium_mg!.description!,
                gProps.daily_sodium_mg!.description!,
            ])
                expect(d).not.toMatch(/\b(you should|ask the user|offer)\b/i);
            await client.close();
        });
    });

    describe("sodium on the write tools", () => {
        test("log_meal stores sodium_mg and bounds it at MAX_SODIUM_MG", async () => {
            expect(MAX_SODIUM_MG).toBe(20_000);
            await withTools(null, async (call) => {
                const ok = await call("log_meal", {
                    description: "Soup",
                    meal_type: "lunch",
                    calories: 180,
                    sodium_mg: 890,
                });
                expect(ok.isError).toBeFalsy();
                expect(db.inserted.at(-1)!.sodium_mg).toBe(890);
                const before = db.inserted.length;
                const over = await call("log_meal", {
                    description: "Soup",
                    meal_type: "lunch",
                    calories: 180,
                    sodium_mg: MAX_SODIUM_MG + 1,
                });
                expect(over.isError).toBe(true);
                expect(db.inserted).toHaveLength(before);
            });
        });

        test("an itemized log_meal with sodium on some items is refused, nothing saved", async () => {
            await withTools(null, async (call) => {
                const before = db.inserted.length;
                const r = await call("log_meal", {
                    description: "Burger",
                    meal_type: "lunch",
                    items: [
                        {
                            name: "Bun",
                            calories: 200,
                            protein_g: 6,
                            carbs_g: 38,
                            fat_g: 3,
                            sodium_mg: 380,
                        },
                        {
                            name: "Patty",
                            calories: 300,
                            protein_g: 25,
                            carbs_g: 0,
                            fat_g: 22,
                        },
                    ],
                });
                expect(r.isError).toBe(true);
                expect(db.inserted).toHaveLength(before);
            });
        });

        test("set_nutrition_goals writes daily_sodium_mg; 0 is kept; MAX_GOAL_MG bounds it", async () => {
            await withTools(null, async (call) => {
                expect(
                    (
                        await call("set_nutrition_goals", {
                            daily_sodium_mg: 2300,
                        })
                    ).isError,
                ).toBeFalsy();
                expect(db.goals?.daily_sodium_mg).toBe(2300);
                expect(
                    (await call("set_nutrition_goals", { daily_sodium_mg: 0 }))
                        .isError,
                ).toBeFalsy();
                expect(db.goals?.daily_sodium_mg).toBe(0);
                // Leaving it out keeps the stored value.
                await call("set_nutrition_goals", { daily_calories: 2100 });
                expect(db.goals?.daily_sodium_mg).toBe(0);
                expect(
                    (
                        await call("set_nutrition_goals", {
                            daily_sodium_mg: MAX_GOAL_MG + 1,
                        })
                    ).isError,
                ).toBe(true);
                expect(
                    (await call("set_nutrition_goals", { daily_sodium_mg: -1 }))
                        .isError,
                ).toBe(true);
            });
        });
    });

    // ---------- per-nutrient provenance on the write paths ----------

    describe("nutrient provenance on the write paths", () => {
        const USDA_CHICKEN: ReferenceRecord = {
            source: "usda",
            id: "171477",
            name: "Chicken, broilers or fryers, breast, roasted",
            data_type: "Foundation",
            basis: "per_100g",
            values: {
                calories: 165,
                protein_g: 31,
                carbs_g: 0,
                fat_g: 3.6,
                fiber_g: 0,
                sugar_g: 0,
                added_sugar_g: 0,
            },
            added_sugar_estimated: false,
            fetched_at: "2026-10-01T00:00:00.000Z",
        };
        const OFF_CRISPS: ReferenceRecord = {
            source: "openfoodfacts",
            id: "5000159484695",
            name: "Crisps",
            data_type: null,
            basis: "per_serving",
            values: { calories: 150, protein_g: 2, carbs_g: 15, fat_g: 10 },
            added_sugar_estimated: false,
            fetched_at: null,
        };
        // Calories 247.5 for 150 g of the usda record above, so 248 verifies.
        const CHICKEN_150G = {
            calories: 248,
            protein_g: 46.5,
            carbs_g: 0,
            fat_g: 5.4,
            fiber_g: 0,
            sugar_g: 0,
            added_sugar_g: 0,
        };
        const CHICKEN_REF = { source: "usda", id: "171477", amount_g: 150 };
        const TAG = { s: "usda", ref: "171477" } as const;

        // The sources line only, from a result's model text.
        const sourcesLineOf = (r: ToolResult) =>
            textOf(r)
                .split("\n")
                .find((l) => l.startsWith("Sources:"));

        test("log_meal: values a usda record matches are labelled with it, with the record's detail", async () => {
            db.foodRecords.set("usda:171477", USDA_CHICKEN);
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "Chicken breast",
                    meal_type: "lunch",
                    ...CHICKEN_150G,
                    food_ref: CHICKEN_REF,
                });
                expect(r.isError).toBeFalsy();
                const row = db.inserted.at(-1)!;
                expect(row.nutrient_sources).toEqual({
                    calories: TAG,
                    protein_g: TAG,
                    carbs_g: TAG,
                    fat_g: TAG,
                    fiber_g: TAG,
                    sugar_g: TAG,
                    added_sugar_g: TAG,
                });
                expect(row.source_detail).toEqual({
                    "usda:171477": {
                        name: USDA_CHICKEN.name,
                        data_type: "Foundation",
                        amount_g: 150,
                        fetched_at: "2026-10-01T00:00:00.000Z",
                    },
                });
                expect(db.foodCacheReads).toEqual(["usda:171477"]);
                expect(sourcesLineOf(r)).toBe(
                    "Sources: calories, protein, carbs, fat, fiber, sugar, added sugar match USDA FoodData Central 171477 for 150 g.",
                );
            });
        });

        test("log_meal: a value that misses the record is estimated, and a user_stated one is the user's", async () => {
            db.foodRecords.set("usda:171477", USDA_CHICKEN);
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "Chicken breast",
                    meal_type: "lunch",
                    ...CHICKEN_150G,
                    calories: 400,
                    fiber_g: 4,
                    food_ref: CHICKEN_REF,
                    user_stated: ["fiber_g"],
                });
                expect(r.isError).toBeFalsy();
                const sources = db.inserted.at(-1)!.nutrient_sources as Record<
                    string,
                    unknown
                >;
                expect(sources.calories).toEqual({ s: "estimate" });
                expect(sources.protein_g).toEqual(TAG);
                expect(sources.fiber_g).toEqual({ s: "user" });
                expect(sourcesLineOf(r)).toContain("calories");
                expect(sourcesLineOf(r)).toContain("estimated");
            });
        });

        test("log_meal: a cache miss labels every value estimated and still writes", async () => {
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "Chicken breast",
                    meal_type: "lunch",
                    ...CHICKEN_150G,
                    food_ref: CHICKEN_REF,
                });
                expect(r.isError).toBeFalsy();
                expect(db.inserted.at(-1)!.nutrient_sources).toEqual(
                    Object.fromEntries(
                        Object.keys(CHICKEN_150G).map((k) => [
                            k,
                            { s: "estimate" },
                        ]),
                    ),
                );
                expect(sourcesLineOf(r)).toBe("Sources: all values estimated.");
            });
        });

        test("log_meal: with no food_ref and nothing stated, no sources line is written", async () => {
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "Apple",
                    meal_type: "snack",
                    calories: 95,
                    protein_g: 0,
                    carbs_g: 25,
                    fat_g: 0,
                });
                expect(r.isError).toBeFalsy();
                expect(sourcesLineOf(r)).toBeUndefined();
                expect(db.foodCacheReads).toEqual([]);
            });
        });

        test("food_ref: a per-serving record refuses amount_g, and a per-100 g one refuses servings", async () => {
            db.foodRecords.set("openfoodfacts:5000159484695", OFF_CRISPS);
            db.foodRecords.set("usda:171477", USDA_CHICKEN);
            await withTools(null, async (call) => {
                const perServing = await call("log_meal", {
                    description: "Crisps",
                    meal_type: "snack",
                    calories: 150,
                    protein_g: 2,
                    carbs_g: 15,
                    fat_g: 10,
                    food_ref: {
                        source: "openfoodfacts",
                        id: "5000159484695",
                        amount_g: 30,
                    },
                });
                expect(perServing.isError).toBe(true);
                expect(textOf(perServing)).toContain("stored per serving");
                const per100 = await call("log_meal", {
                    description: "Chicken",
                    meal_type: "lunch",
                    calories: 248,
                    protein_g: 46.5,
                    carbs_g: 0,
                    fat_g: 5.4,
                    food_ref: {
                        source: "openfoodfacts",
                        id: "171477",
                        servings: 1,
                    },
                });
                expect(per100.isError).toBe(true);
                expect(db.inserted).toHaveLength(0);
            });
        });

        test("food_ref: a malformed id is refused as food_ref_invalid before anything is written", async () => {
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "Chicken",
                    meal_type: "lunch",
                    calories: 248,
                    protein_g: 46.5,
                    carbs_g: 0,
                    fat_g: 5.4,
                    food_ref: { source: "usda", id: "12ab", amount_g: 150 },
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain("not a FoodData Central id");
                expect(db.inserted).toHaveLength(0);
            });
        });

        test("food_ref: a refused id reaches the caller but not the runtime log", async () => {
            const logged: string[] = [];
            const spies = [
                spyOn(console, "log"),
                spyOn(console, "warn"),
                spyOn(console, "error"),
            ].map((spy) =>
                spy.mockImplementation((...args: unknown[]) => {
                    logged.push(args.map(String).join(" "));
                }),
            );
            try {
                await withTools(null, async (call) => {
                    const r = await call("log_meal", {
                        description: "Chicken",
                        meal_type: "lunch",
                        calories: 248,
                        protein_g: 46.5,
                        carbs_g: 0,
                        fat_g: 5.4,
                        food_ref: { source: "usda", id: "12ab", amount_g: 150 },
                    });
                    expect(r.isError).toBe(true);
                    expect(textOf(r)).toContain("12ab");
                });
            } finally {
                for (const spy of spies) spy.mockRestore();
            }
            expect(logged.join("\n")).toContain("food_ref_invalid");
            expect(logged.join("\n")).not.toContain("12ab");
        });

        test("food_ref: a label sent with no nutrient values is refused, not dropped", async () => {
            await withTools(null, async (call) => {
                const r = await call("update_meal", {
                    id: "11111111-1111-4111-8111-111111111111",
                    description: "Chicken",
                    food_ref: CHICKEN_REF,
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain("send the values they describe");
                const saved = await call("update_saved_meal", {
                    id: "22222222-2222-4222-8222-222222222222",
                    name: "Chicken",
                    user_stated: ["protein_g"],
                });
                expect(saved.isError).toBe(true);
                expect(textOf(saved)).toContain(
                    "send the values they describe",
                );
            });
        });

        test("food_ref: a meal-level ref beside items is refused, and so is user_stated on the meal", async () => {
            await withTools(null, async (call) => {
                const beside = await call("log_meal", {
                    description: "Lunch",
                    meal_type: "lunch",
                    items: [
                        {
                            name: "Chicken",
                            calories: 165,
                            protein_g: 31,
                            carbs_g: 0,
                            fat_g: 3.6,
                        },
                    ],
                    food_ref: CHICKEN_REF,
                });
                expect(beside.isError).toBe(true);
                expect(textOf(beside)).toContain("goes on each item");
                const stated = await call("log_meal", {
                    description: "Lunch",
                    meal_type: "lunch",
                    items: [
                        {
                            name: "Chicken",
                            calories: 165,
                            protein_g: 31,
                            carbs_g: 0,
                            fat_g: 3.6,
                        },
                    ],
                    user_stated: ["calories"],
                });
                expect(stated.isError).toBe(true);
                expect(textOf(stated)).toContain(
                    "user_stated goes on each item",
                );
                expect(db.inserted).toHaveLength(0);
            });
        });

        test("log_meal items: each item is labelled, and the meal's label is derived from them", async () => {
            db.foodRecords.set("usda:171477", {
                ...USDA_CHICKEN,
                values: { calories: 200, protein_g: 0, carbs_g: 0, fat_g: 0 },
            });
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "Plate",
                    meal_type: "dinner",
                    items: [
                        {
                            name: "Chicken",
                            amount: 100,
                            unit: "g",
                            calories: 200,
                            protein_g: 0,
                            carbs_g: 0,
                            fat_g: 0,
                            food_ref: {
                                source: "usda",
                                id: "171477",
                                amount_g: 100,
                            },
                        },
                        {
                            name: "Sauce",
                            calories: 100,
                            protein_g: 0,
                            carbs_g: 0,
                            fat_g: 0,
                            user_stated: ["calories"],
                        },
                    ],
                });
                expect(r.isError).toBeFalsy();
                const row = db.inserted.at(-1)!;
                expect(row.nutrient_sources).toMatchObject({
                    calories: {
                        s: "mixed",
                        parts: [
                            { s: "usda", share: 67 },
                            { s: "user", share: 33 },
                        ],
                    },
                });
                const items = db.mealItems.get(db.meals[0]!.id)!;
                expect(items[0]!.nutrient_sources).toMatchObject({
                    calories: TAG,
                });
                expect(items[1]!.nutrient_sources).toMatchObject({
                    calories: { s: "user" },
                });
            });
        });

        test("update_meal: a plain meal re-labels only the nutrients whose value changed", async () => {
            db.meals = [
                storedMeal({
                    id: MEAL_ID,
                    description: "Chicken breast",
                    calories: 165,
                    protein_g: 31,
                    carbs_g: 0,
                    fat_g: 3.6,
                    nutrient_sources: {
                        calories: TAG,
                        protein_g: TAG,
                        carbs_g: TAG,
                        fat_g: TAG,
                    },
                    source_detail: {
                        "usda:171477": { name: USDA_CHICKEN.name },
                    },
                }),
            ];
            await withTools(null, async (call) => {
                const r = await call("update_meal", {
                    id: MEAL_ID,
                    calories: 200,
                });
                expect(r.isError).toBeFalsy();
                expect(db.mealUpdates.at(-1)!.nutrient_sources).toEqual({
                    calories: { s: "estimate" },
                    protein_g: TAG,
                    carbs_g: TAG,
                    fat_g: TAG,
                });
            });
        });

        test("update_meal: a changed nutrient takes the label of the ref that matches it", async () => {
            db.foodRecords.set("usda:171477", USDA_CHICKEN);
            db.meals = [
                storedMeal({
                    id: MEAL_ID,
                    description: "Chicken breast",
                    calories: 165,
                    nutrient_sources: { calories: { s: "estimate" } },
                }),
            ];
            await withTools(null, async (call) => {
                const r = await call("update_meal", {
                    id: MEAL_ID,
                    calories: 247,
                    food_ref: CHICKEN_REF,
                });
                expect(r.isError).toBeFalsy();
                expect(db.mealUpdates.at(-1)!.nutrient_sources).toEqual({
                    calories: TAG,
                });
            });
        });

        test("update_meal: an itemized meal's labels are re-derived from its new items", async () => {
            db.foodRecords.set("usda:171477", {
                ...USDA_CHICKEN,
                values: { calories: 200, protein_g: 0, carbs_g: 0, fat_g: 0 },
            });
            db.meals = [storedMeal({ id: MEAL_ID, description: "Plate" })];
            await withTools(null, async (call) => {
                const r = await call("update_meal", {
                    id: MEAL_ID,
                    items: [
                        {
                            name: "Chicken",
                            amount: 100,
                            calories: 200,
                            protein_g: 0,
                            carbs_g: 0,
                            fat_g: 0,
                            food_ref: {
                                source: "usda",
                                id: "171477",
                                amount_g: 100,
                            },
                        },
                    ],
                });
                expect(r.isError).toBeFalsy();
                const write = db.itemReplacements.at(-1)!;
                expect(write.fields.nutrient_sources).toMatchObject({
                    calories: TAG,
                });
            });
        });

        test("save_meal: a plain saved meal is labelled from its food_ref", async () => {
            db.foodRecords.set("usda:171477", USDA_CHICKEN);
            await withTools(null, async (call) => {
                const r = await call("save_meal", {
                    name: "Plain chicken",
                    meal_type: "lunch",
                    calories: 165,
                    protein_g: 31,
                    carbs_g: 0,
                    fat_g: 3.6,
                    food_ref: { source: "usda", id: "171477", amount_g: 100 },
                });
                expect(r.isError).toBeFalsy();
                const write = db.savedMealWrites.at(-1)!;
                expect(write.input.nutrient_sources).toMatchObject({
                    calories: TAG,
                    protein_g: TAG,
                });
                expect(textOf(r)).toContain("Sources: ");
            });
        });

        test("log_saved_meal: servings keep the tag and scale the record amount with the values", async () => {
            db.savedMeals = [
                savedMealRow({
                    nutrient_sources: { calories: TAG, protein_g: TAG },
                    source_detail: {
                        "usda:171477": {
                            name: USDA_CHICKEN.name,
                            amount_g: 150,
                        },
                    },
                }),
            ];
            await withTools(null, async (call) => {
                const r = await call("log_saved_meal", {
                    saved_meal: SAVED_ID,
                    meal_type: "lunch",
                    servings: 2,
                });
                expect(r.isError).toBeFalsy();
                const row = db.inserted.at(-1)!;
                expect(row.nutrient_sources).toEqual({
                    calories: TAG,
                    protein_g: TAG,
                });
                // The values doubled, so they match the record for 300 g.
                expect(row.source_detail).toEqual({
                    "usda:171477": { name: USDA_CHICKEN.name, amount_g: 300 },
                });
            });
        });

        test("log_saved_meal: a totals-only saved meal copies its labels, and servings keep the tags", async () => {
            db.savedMeals = [
                savedMealRow({
                    nutrient_sources: { calories: TAG, protein_g: TAG },
                    source_detail: {
                        "usda:171477": { name: USDA_CHICKEN.name },
                    },
                }),
            ];
            await withTools(null, async (call) => {
                const r = await call("log_saved_meal", {
                    saved_meal: SAVED_ID,
                    meal_type: "lunch",
                    servings: 2,
                });
                expect(r.isError).toBeFalsy();
                const row = db.inserted.at(-1)!;
                expect(row.nutrient_sources).toEqual({
                    calories: TAG,
                    protein_g: TAG,
                });
                expect(row.source_detail).toEqual({
                    "usda:171477": { name: USDA_CHICKEN.name },
                });
            });
        });

        test("_meta: the sources payload matches the strict schema and names are cut to 60 characters", async () => {
            const long = { ...USDA_CHICKEN, name: "x".repeat(90) };
            db.foodRecords.set("usda:171477", long);
            const NUTRIENT_SOURCE = z.strictObject({
                s: z.enum([
                    "usda",
                    "openfoodfacts",
                    "user",
                    "estimate",
                    "mixed",
                ]),
                ref: z.string().optional(),
                name: z.string().optional(),
                data_type: z.string().optional(),
                parts: z
                    .array(
                        z.strictObject({
                            s: z.enum([
                                "usda",
                                "openfoodfacts",
                                "user",
                                "estimate",
                            ]),
                            share: z.number(),
                        }),
                    )
                    .optional(),
            });
            const SOURCES_META = z.strictObject({
                v: z.literal(1),
                meals: z.array(
                    z
                        .strictObject({
                            meal: z
                                .record(z.string(), NUTRIENT_SOURCE)
                                .nullable(),
                            items: z
                                .array(
                                    z
                                        .record(z.string(), NUTRIENT_SOURCE)
                                        .nullable(),
                                )
                                .nullable(),
                        })
                        .nullable(),
                ),
            });
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "Chicken breast",
                    meal_type: "lunch",
                    ...CHICKEN_150G,
                    food_ref: CHICKEN_REF,
                });
                expect(r.isError).toBeFalsy();
                const meta = SOURCES_META.parse(
                    r._meta?.[NUTRIENT_SOURCES_META_KEY],
                );
                expect(meta.meals).toHaveLength(
                    (r.structuredContent as { meals: unknown[] }).meals.length,
                );
                const labels = meta.meals[0]!.meal!;
                expect(labels.calories).toEqual({
                    s: "usda",
                    ref: "171477",
                    name: `${"x".repeat(59)}…`,
                    data_type: "Foundation",
                });
                expect(JSON.stringify(r.structuredContent)).not.toContain(
                    "nutrient_sources",
                );
            });
        });

        test("_meta: alcohol carries no label while tracking is off, and is labelled when on", async () => {
            const ALCOHOL = {
                description: "Beer",
                meal_type: "dinner",
                calories: 180,
                protein_g: 1,
                carbs_g: 13,
                fat_g: 0,
                alcohol_g: 13,
            };
            await withTools(null, async (call) => {
                const off = await call("log_meal", ALCOHOL);
                const meta = off._meta?.[NUTRIENT_SOURCES_META_KEY] as {
                    meals: { meal: Record<string, unknown> }[];
                };
                expect(meta.meals[0]!.meal).not.toHaveProperty("alcohol_g");
                expect(meta.meals[0]!.meal).toHaveProperty("calories");
            });
            await withTools("us", async (call) => {
                const on = await call("log_meal", ALCOHOL);
                const meta = on._meta?.[NUTRIENT_SOURCES_META_KEY] as {
                    meals: { meal: Record<string, unknown> }[];
                };
                expect(meta.meals[0]!.meal).toHaveProperty("alcohol_g");
            });
        });

        test("_meta: a failed items read drops the sources key and the tool still succeeds", async () => {
            db.foodRecords.set("usda:171477", USDA_CHICKEN);
            db.mealItemsFailure = new Error("items unavailable");
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "Chicken breast",
                    meal_type: "lunch",
                    ...CHICKEN_150G,
                    food_ref: CHICKEN_REF,
                });
                expect(r.isError).toBeFalsy();
                expect(r.structuredContent).toBeDefined();
                expect(r._meta ?? {}).not.toHaveProperty(
                    NUTRIENT_SOURCES_META_KEY,
                );
            });
        });

        // The ingredient lines a model reads under an itemized write (content only).
        const ITEM_CHICKEN = {
            calories: 248,
            protein_g: 46.5,
            carbs_g: 0,
            fat_g: 5.4,
            fiber_g: 0,
            sugar_g: 0,
            added_sugar_g: 0,
        };
        const CHICKEN_ITEM_LINE =
            "- Chicken breast: USDA 171477 (150 g) for calories, protein, carbs, fat, fiber, sugar, added sugar";

        test("log_meal: an itemized meal names each ingredient's record in the model text", async () => {
            db.foodRecords.set("usda:171477", USDA_CHICKEN);
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "Lunch",
                    meal_type: "lunch",
                    items: [
                        {
                            name: "Chicken breast",
                            amount: 150,
                            unit: "g",
                            ...ITEM_CHICKEN,
                            food_ref: CHICKEN_REF,
                        },
                        {
                            name: "Rice",
                            amount: 100,
                            unit: "g",
                            calories: 130,
                            protein_g: 2.7,
                            carbs_g: 28,
                            fat_g: 0.3,
                            fiber_g: 0.4,
                            sugar_g: 0.1,
                            added_sugar_g: 0,
                        },
                    ],
                });
                expect(r.isError).toBeFalsy();
                expect(textOf(r)).toContain(
                    `Ingredient sources:\n${CHICKEN_ITEM_LINE}`,
                );
                // Rice has no label beyond an estimate, so it gets no line.
                expect(textOf(r)).not.toContain("- Rice:");
            });
        });

        test("log_meal: an itemized meal with no record or user label gets no ingredient block", async () => {
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "Lunch",
                    meal_type: "lunch",
                    items: [
                        {
                            name: "Rice",
                            amount: 100,
                            unit: "g",
                            calories: 130,
                            protein_g: 2.7,
                            carbs_g: 28,
                            fat_g: 0.3,
                        },
                    ],
                });
                expect(r.isError).toBeFalsy();
                expect(textOf(r)).not.toContain("Ingredient sources:");
            });
        });

        test("update_meal: an itemized update names the ingredient records too", async () => {
            db.foodRecords.set("usda:171477", USDA_CHICKEN);
            db.meals = [storedMeal({ id: MEAL_ID, description: "Plate" })];
            await withTools(null, async (call) => {
                const r = await call("update_meal", {
                    id: MEAL_ID,
                    items: [
                        {
                            name: "Chicken breast",
                            amount: 150,
                            unit: "g",
                            ...ITEM_CHICKEN,
                            food_ref: CHICKEN_REF,
                        },
                    ],
                });
                expect(r.isError).toBeFalsy();
                expect(textOf(r)).toContain(
                    `Ingredient sources:\n${CHICKEN_ITEM_LINE}`,
                );
            });
        });

        test("save_meal: an itemized saved meal names the ingredient records", async () => {
            db.foodRecords.set("usda:171477", USDA_CHICKEN);
            await withTools(null, async (call) => {
                const r = await call("save_meal", {
                    name: "Chicken plate",
                    meal_type: "lunch",
                    items: [
                        {
                            name: "Chicken breast",
                            amount: 150,
                            unit: "g",
                            ...ITEM_CHICKEN,
                            food_ref: CHICKEN_REF,
                        },
                    ],
                });
                expect(r.isError).toBeFalsy();
                expect(textOf(r)).toContain(
                    `Ingredient sources:\n${CHICKEN_ITEM_LINE}`,
                );
            });
        });

        test("log_saved_meal: a logged copy names the ingredient records it keeps", async () => {
            db.savedMeals = [
                savedMealRow({
                    items: [
                        ingredient(1, "Chicken breast", {
                            calories: 248,
                            nutrient_sources: {
                                calories: TAG,
                                protein_g: TAG,
                            },
                            source_detail: {
                                "usda:171477": {
                                    name: USDA_CHICKEN.name,
                                    amount_g: 150,
                                },
                            },
                        }),
                    ],
                }),
            ];
            await withTools(null, async (call) => {
                const r = await call("log_saved_meal", {
                    saved_meal: SAVED_ID,
                    meal_type: "dinner",
                });
                expect(r.isError).toBeFalsy();
                expect(textOf(r)).toContain(
                    "Ingredient sources:\n- Chicken breast: USDA 171477 (150 g) for calories, protein",
                );
            });
        });

        test("item names reach the caller but never a console log line", async () => {
            db.foodRecords.set("usda:171477", USDA_CHICKEN);
            const marker = "Zebrafish-Secret-Name";
            const logged: string[] = [];
            const spies = [
                spyOn(console, "log"),
                spyOn(console, "warn"),
                spyOn(console, "error"),
                spyOn(console, "info"),
                spyOn(console, "debug"),
            ].map((spy) =>
                spy.mockImplementation((...args: unknown[]) => {
                    logged.push(args.map(String).join(" "));
                }),
            );
            try {
                await withTools(null, async (call) => {
                    const r = await call("log_meal", {
                        description: "Lunch",
                        meal_type: "lunch",
                        items: [
                            {
                                name: marker,
                                amount: 150,
                                unit: "g",
                                ...ITEM_CHICKEN,
                                food_ref: CHICKEN_REF,
                            },
                        ],
                    });
                    expect(r.isError).toBeFalsy();
                    expect(textOf(r)).toContain(marker);
                });
            } finally {
                for (const spy of spies) spy.mockRestore();
            }
            expect(logged.join("\n")).not.toContain(marker);
        });
    });
}
