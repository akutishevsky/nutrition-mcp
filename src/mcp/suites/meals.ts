import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport, McpServer } from "@modelcontextprotocol/server";
import { describe, expect, test } from "bun:test";
import {
    BODY_MEASUREMENT_RANGE_MAX_DAYS,
    MAX_CAFFEINE_MG,
    MEALS_RANGE_MAX_DAYS,
    registerTools,
    SUMMARY_RANGE_MAX_DAYS,
    WEIGHT_RANGE_MAX_DAYS,
} from "../../mcp.js";
import { MEAL_TYPES } from "../../meal-types.js";
import type { MealInput } from "../../supabase.js";
import * as actualSupabase from "../../supabase.js";
import { dateInTz } from "../../tz.js";
import { getWidgetHtml, NUTRIENT_SOURCES_META_KEY } from "../../widgets.js";
import {
    db,
    meal,
    MEAL_ID,
    MEASUREMENT_ID,
    measurementRow,
    PROFILE_BASE,
    SAVED_ID,
    savedMealRow,
    storedMeal,
    textOf,
    WATER_ID,
    WEIGHT_ID,
    withTools,
} from "../test-harness.js";

export function registerMealSuites(): void {
    describe("log_meal / update_meal surface hidden alcohol", () => {
        const beer = {
            description: "Two beers",
            meal_type: "dinner",
            alcohol_g: 26,
        };

        // The whole point: with tracking off, alcohol is stored but appears in no
        // meal line, no goal line and no widget stat, so without this note the user
        // has no way to learn the feature exists.
        test("log_meal nudges when alcohol is stored but hidden", async () => {
            await withTools(null, async (call) => {
                const text = textOf(await call("log_meal", beer));
                expect(text).toContain("set_alcohol_tracking");
                expect(db.inserted[0]!.alcohol_g).toBe(26);
            });
        });

        // REPORT ONLY. Auto-enabling would surface alcohol to a user who never
        // asked for it — the exact harm the opt-in exists to prevent.
        test("the nudge never turns tracking on by itself", async () => {
            await withTools(null, async (call) => {
                await call("log_meal", beer);
                expect(db.profilePatches).toHaveLength(0);
                expect(db.profile!.alcohol_tracking_enabled).toBe(false);
            });
        });

        test("no nudge once the user tracks alcohol — it is already on screen", async () => {
            await withTools("us", async (call) => {
                const text = textOf(await call("log_meal", beer));
                expect(text).not.toContain("set_alcohol_tracking");
                expect(text).toContain("Alcohol:");
            });
        });

        test("no nudge for a meal with no alcohol, or with exactly zero", async () => {
            await withTools(null, async (call) => {
                const plain = textOf(
                    await call("log_meal", {
                        description: "Oatmeal",
                        meal_type: "breakfast",
                        calories: 300,
                    }),
                );
                expect(plain).not.toContain("set_alcohol_tracking");
                const zero = textOf(
                    await call("log_meal", {
                        description: "Alcohol-free beer",
                        meal_type: "snack",
                        alcohol_g: 0,
                    }),
                );
                expect(zero).not.toContain("set_alcohol_tracking");
            });
        });

        test("update_meal nudges on the same terms", async () => {
            await withTools(null, async (call) => {
                const text = textOf(
                    await call("update_meal", { id: MEAL_ID, alcohol_g: 14 }),
                );
                expect(text).toContain("set_alcohol_tracking");
            });
            await withTools("uk", async (call) => {
                const text = textOf(
                    await call("update_meal", { id: MEAL_ID, alcohol_g: 14 }),
                );
                expect(text).not.toContain("set_alcohol_tracking");
            });
        });
    });

    describe("log_meal / update_meal chase missing fiber and sugar", () => {
        test("log_meal without them says so and points at update_meal", async () => {
            await withTools(null, async (call) => {
                const text = textOf(
                    await call("log_meal", {
                        description: "Chicken salad",
                        meal_type: "lunch",
                        calories: 400,
                    }),
                );
                expect(text).toContain("fiber_g, sugar_g");
                expect(text).toContain("update_meal");
            });
        });

        test("log_meal with both — including zeros — says nothing", async () => {
            await withTools(null, async (call) => {
                const text = textOf(
                    await call("log_meal", {
                        description: "Ribeye steak",
                        meal_type: "dinner",
                        calories: 700,
                        fiber_g: 0,
                        sugar_g: 0,
                        added_sugar_g: 0,
                    }),
                );
                expect(text).not.toContain("update_meal");
            });
        });

        test("a caffeine-free meal is never nagged about caffeine", async () => {
            await withTools(null, async (call) => {
                const text = textOf(
                    await call("log_meal", {
                        description: "Ribeye steak",
                        meal_type: "dinner",
                        fiber_g: 0,
                        sugar_g: 0,
                    }),
                );
                expect(text).not.toContain("caffeine");
                expect(text).not.toContain("Caffeine");
            });
        });

        // The repair loop has to converge: backfilling one field must leave a note
        // naming only the other, not the same pair again.
        test("update_meal re-checks the meal it just wrote", async () => {
            await withTools(null, async (call) => {
                const text = textOf(
                    await call("update_meal", { id: MEAL_ID, fiber_g: 6 }),
                );
                expect(text).toContain("sugar_g");
                expect(text).not.toContain("fiber_g");
            });
        });
    });

    // ---------- caffeine, end to end through the real tools ----------

    describe("log_meal and update_meal round-trip caffeine_mg", () => {
        const coffee = {
            description: "Flat white",
            meal_type: "snack",
            calories: 120,
            caffeine_mg: 95,
        };

        test("the milligram figure reaches the DB layer, the text and the widget", async () => {
            await withTools(null, async (call) => {
                const r = await call("log_meal", coffee);
                expect(r.isError).toBeFalsy();
                expect(db.inserted[0]!.caffeine_mg).toBe(95);
                expect(textOf(r)).toContain("Caffeine: 95 mg");
                const sc = r.structuredContent as unknown as {
                    logged_meal: { caffeine_mg: number | null };
                    totals: { caffeine_mg: number | null };
                };
                expect(sc.logged_meal.caffeine_mg).toBe(95);
                expect(sc.totals.caffeine_mg).toBe(95);
            });
        });

        // z.coerce, for the same reason log_meal's other numbers have it: models
        // emit "95" as a string often enough that refusing it is a worse failure
        // than coercing it.
        test("a stringified figure is coerced like every other number", async () => {
            await withTools(null, async (call) => {
                await call("log_meal", { ...coffee, caffeine_mg: "95" });
                expect(db.inserted[0]!.caffeine_mg).toBe(95);
            });
        });

        test("omitting it stores nothing at all, rather than a 0", async () => {
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "Oatmeal",
                    meal_type: "breakfast",
                    calories: 300,
                });
                expect(db.inserted[0]).not.toHaveProperty("caffeine_mg");
                expect(textOf(r)).not.toContain("Caffeine");
                const sc = r.structuredContent as unknown as {
                    logged_meal: { caffeine_mg: number | null };
                    totals: { caffeine_mg: number | null };
                };
                // The key is present and null — a .nullable() outputSchema field is
                // REQUIRED, so omitting it would fail validation, not default.
                expect(sc.logged_meal.caffeine_mg).toBeNull();
                expect(sc.totals.caffeine_mg).toBeNull();
            });
        });

        test("update_meal passes a corrected figure through", async () => {
            await withTools(null, async (call) => {
                const r = await call("update_meal", {
                    id: MEAL_ID,
                    caffeine_mg: 126,
                });
                expect(r.isError).toBeFalsy();
                expect(db.mealUpdates[0]!.caffeine_mg).toBe(126);
                expect(textOf(r)).toContain("Caffeine: 126 mg");
            });

            await withTools(null, async (call) => {
                const r = await call("update_meal", {
                    id: MEAL_ID,
                    caffeine_mg: MAX_CAFFEINE_MG + 1,
                });
                expect(r.isError).toBe(true);
                // Still just the accepted write above — the rejection never
                // reached the DB layer.
                expect(db.mealUpdates).toHaveLength(1);
            });
        });

        // The idempotency-key text pluralises its noun per tool: "entries" for the
        // "entry" tools, "meals" / "measurements" for the others. "entrys" is a
        // typo that once shipped to the directory-listed tool descriptions.
        test("advertised idempotency descriptions pluralise the noun correctly", async () => {
            const server = new McpServer(
                { name: "t", version: "0.0.0" },
                { capabilities: { tools: {}, resources: {} } },
            );
            registerTools(server, "u1", true, null);
            const [ct, st] = InMemoryTransport.createLinkedPair();
            const client = new Client({ name: "c", version: "0.0.0" });
            await Promise.all([server.connect(st), client.connect(ct)]);
            const { tools } = await client.listTools();
            await client.close();
            await server.close();

            expect(JSON.stringify(tools)).not.toContain("entrys");
            const schemaOf = (name: string) =>
                JSON.stringify(tools.find((t) => t.name === name)?.inputSchema);
            expect(schemaOf("log_water")).toContain(
                "Two genuinely separate entries",
            );
            expect(schemaOf("log_active_calories")).toContain(
                "Two genuinely separate entries",
            );
            expect(schemaOf("log_meal")).toContain(
                "Two genuinely separate meals",
            );
            expect(schemaOf("log_body_measurement")).toContain(
                "Two separate measurements",
            );
        });

        // CONTRACT: no caffeine_tracking_enabled, no tool pair, no nudge. Alcohol
        // has all three because surfacing trace alcohol to someone in recovery is a
        // real harm; caffeine has no equivalent, and inventing a settings surface
        // for it would be a second thing to keep in sync forever.
        test("there is no caffeine opt-in anywhere on the tool surface", async () => {
            const server = new McpServer(
                { name: "t", version: "0.0.0" },
                { capabilities: { tools: {}, resources: {} } },
            );
            registerTools(server, "u1", true, null);
            const [ct, st] = InMemoryTransport.createLinkedPair();
            const client = new Client({ name: "c", version: "0.0.0" });
            await Promise.all([server.connect(st), client.connect(ct)]);
            const { tools } = await client.listTools();
            expect(
                tools.map((t) => t.name).filter((n) => n.includes("caffeine")),
            ).toEqual([]);
            await client.close();
            await server.close();

            await withTools(null, async (call) => {
                const text = textOf(await call("log_meal", coffee));
                expect(text).not.toContain("caffeine_tracking");
                expect(text).not.toContain("set_caffeine_tracking");
            });
        });

        // The digest is frozen (CONTRACT, and the "DO NOT ADD" comments in
        // src/supabase.ts and src/import.ts). Adding caffeine_mg to it would orphan
        // every `auto:` key already stored, so the same meal logged with and
        // without a caffeine figure must still derive one key — and that key must
        // still be the literal value the pre-caffeine code produced.
        test("caffeine does not enter the derived idempotency key", async () => {
            const PRE_CAFFEINE_KEY =
                "auto:ce32507d8d98f40ce37b9dcd4161d18dfb5628f1c97316342dda1f0d02ce95c6";
            const at = "2026-07-20T12:00:00.000Z";
            await withTools(null, async (call) => {
                await call("log_meal", { ...coffee, logged_at: at });
                await call("log_meal", {
                    ...coffee,
                    caffeine_mg: undefined,
                    logged_at: at,
                });
            });
            const keys = db.inserted.map((input) =>
                actualSupabase.mealIdempotencyKey(
                    "u1",
                    input as unknown as MealInput,
                    at,
                ),
            );
            expect(keys[0]).toBe(keys[1]!);
            expect(keys[0]).toBe(PRE_CAFFEINE_KEY);
        });
    });

    // The completeness rule is only as good as its reach: it has to be on the two
    // tools that write nutrition, and it must not contradict itself between the
    // tool-level paragraph and the per-field text (a model reading a specific
    // field's description will follow that one).
    describe("the nutrient-completeness rule reaches the write tools", () => {
        async function toolsOf() {
            const server = new McpServer(
                { name: "t", version: "0.0.0" },
                { capabilities: { tools: {}, resources: {} } },
            );
            registerTools(server, "u1", true, null);
            const [ct, st] = InMemoryTransport.createLinkedPair();
            const client = new Client({ name: "c", version: "0.0.0" });
            await Promise.all([server.connect(st), client.connect(ct)]);
            const { tools } = await client.listTools();
            await client.close();
            await server.close();
            return tools;
        }

        test("log_meal and update_meal both carry it", async () => {
            const tools = await toolsOf();
            for (const name of ["log_meal", "update_meal"]) {
                const desc =
                    tools.find((t) => t.name === name)?.description ?? "";
                expect(desc, name).toContain("are read on every meal");
                expect(desc, name).toContain("not as zero");
            }
        });

        test("fiber and sugar are described as expected, with reference values", async () => {
            const tools = await toolsOf();
            const props = tools.find((t) => t.name === "log_meal")?.inputSchema
                .properties as Record<string, { description?: string }>;
            for (const key of ["fiber_g", "sugar_g", "added_sugar_g"]) {
                const d = props[key]?.description ?? "";
                expect(d, key).toContain("every meal");
                // The last-resort anchors: without them an estimate has nothing
                // behind it.
                expect(d, key).toContain("per 100 g");
                expect(d, key).toContain("0 is the correct value");
                // Describes the field; never directs the assistant (#190).
                expect(d, key).not.toMatch(/send (this|0)|do not omit|say so/i);
            }
        });

        // #213's guard, extended to every added-sugar text the model reads: the
        // two meal fields, the import row, the goal and the coverage block.
        test("added sugar is described, never directed, wherever it appears", async () => {
            const tools = await toolsOf();
            const prop = (tool: string, key: string, nested?: string) => {
                const schema = tools.find((t) => t.name === tool)
                    ?.inputSchema as {
                    properties: Record<
                        string,
                        {
                            description?: string;
                            items?: {
                                properties: Record<
                                    string,
                                    { description?: string }
                                >;
                            };
                        }
                    >;
                };
                return nested
                    ? (schema.properties[nested]?.items?.properties[key]
                          ?.description ?? "")
                    : (schema.properties[key]?.description ?? "");
            };
            const texts: Record<string, string> = {
                log_meal: prop("log_meal", "added_sugar_g"),
                update_meal: prop("update_meal", "added_sugar_g"),
                import_row: prop("bulk_import_meals", "added_sugar_g", "meals"),
                goal: prop("set_nutrition_goals", "daily_added_sugar_g"),
            };
            for (const [where, d] of Object.entries(texts)) {
                expect(d.toLowerCase(), where).toContain("added");
                expect(d, where).not.toMatch(
                    /send (this|0)|do not omit|say so|\boffer\b|ask the user|you should|\balways\b|\bmust\b/i,
                );
            }
            // The definition the brief settled on, on both meal tools.
            for (const where of ["log_meal", "update_meal"]) {
                expect(texts[where], where).toContain("100% fruit juice");
                expect(texts[where], where).toContain("never more than it");
            }
            expect(texts.import_row).toContain("'Added sugars' column");
            expect(texts.goal).toContain("0 means none");
            // The added_sugar_g-accompanies-sugar_g sentence, true whether or
            // not the ADDED_SUGAR_REQUIRED_FROM gate is on ("may be refused").
            for (const where of ["log_meal", "update_meal"]) {
                expect(texts[where], where).toContain("It accompanies sugar_g");
                expect(texts[where], where).toContain("may be refused");
            }
            const coverage =
                tools.find((t) => t.name === "log_meal")?.description ?? "";
            expect(coverage).toContain("added_sugar_g is read on every meal");
            const accompanies =
                coverage.match(/It accompanies sugar_g[^.]*\./)?.[0] ?? "";
            expect(accompanies).toContain("may be refused");
            expect(accompanies).not.toMatch(
                /\bplease\b|\bmust\b|ask the user|\bretry\b|call again|you should|\balways\b/i,
            );
            const goalsTool =
                tools.find((t) => t.name === "set_nutrition_goals")
                    ?.description ?? "";
            expect(goalsTool).toContain("total sugar, added sugar, alcohol");
        });

        // The one field that must keep saying the opposite.
        test("caffeine still says omit rather than zero, on both tools", async () => {
            const tools = await toolsOf();
            for (const name of ["log_meal", "update_meal"]) {
                const props = tools.find((t) => t.name === name)?.inputSchema
                    .properties as Record<string, { description?: string }>;
                const d = props.caffeine_mg?.description ?? "";
                expect(d, name).toContain("measured, and it was none");
                expect(d.toLowerCase(), name).not.toContain(
                    "send it on every meal",
                );
            }
        });
    });

    // ---------- range listings are bounded ----------
    //
    // get_meals_by_date_range returns every meal as full text, so an unbounded
    // range dumped the whole diary into one response; get_nutrition_summary has
    // the same guard at a quarter. The readers page, so the caps are about
    // response size, not truncation. The guard runs inside withAnalytics, so each
    // rejection is an isError result with an analytics row, not a schema-level
    // refusal.
    describe("date-range listings reject bad and oversized ranges", () => {
        const rowsFor = (tool: string) =>
            db.analyticsRows.filter((r) => r.tool_name === tool);

        test("the meal cap is a month", () => {
            expect(MEALS_RANGE_MAX_DAYS).toBe(31);
        });

        test("a range one day over the cap is refused with the way forward", async () => {
            await withTools(null, async (call) => {
                const r = await call("get_meals_by_date_range", {
                    start_date: "2026-01-01",
                    end_date: "2026-02-01",
                });
                expect(r.isError).toBe(true);
                const text = textOf(r);
                expect(text).toContain("spans 32 days");
                expect(text).toContain(`at most ${MEALS_RANGE_MAX_DAYS} days`);
                expect(text).toContain("get_trends");
                // Not get_nutrition_summary: it is capped itself (at
                // SUMMARY_RANGE_MAX_DAYS), so it is no route to a longer period.
                expect(text).not.toContain("get_nutrition_summary");
                expect(text).toContain("monthly calls");
            });
            const rows = rowsFor("get_meals_by_date_range");
            expect(rows).toHaveLength(1);
            expect(rows[0]!.success).toBe(false);
            expect(rows[0]!.error_category).toBe("date_range_too_long");
        });

        test("exactly 31 days inclusive is accepted", async () => {
            db.meals = [meal({ logged_at: "2026-01-15T12:00:00.000Z" })];
            await withTools(null, async (call) => {
                const r = await call("get_meals_by_date_range", {
                    start_date: "2026-01-01",
                    end_date: "2026-01-31",
                });
                expect(r.isError).toBeFalsy();
                expect(textOf(r)).toContain("## 2026-01-15 (1 meal)");
            });
            expect(rowsFor("get_meals_by_date_range")[0]!.success).toBe(true);
        });

        test("a reversed range is refused", async () => {
            await withTools(null, async (call) => {
                const r = await call("get_meals_by_date_range", {
                    start_date: "2026-02-01",
                    end_date: "2026-01-01",
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain("is after end_date");
            });
            expect(rowsFor("get_meals_by_date_range")[0]!.error_category).toBe(
                "invalid_date_format",
            );
        });

        test.each(["2026-02-30", "2026-1-5", "yesterday", "2026-01-01T00:00"])(
            "a non-calendar date %p is refused",
            async (bad) => {
                await withTools(null, async (call) => {
                    const r = await call("get_meals_by_date_range", {
                        start_date: "2026-01-01",
                        end_date: bad,
                    });
                    expect(r.isError).toBe(true);
                    expect(textOf(r)).toContain(
                        `Invalid end_date "${bad}": not a real calendar date`,
                    );
                });
                expect(
                    rowsFor("get_meals_by_date_range")[0]!.error_category,
                ).toBe("invalid_date_format");
            },
        );

        test("get_weight_by_date_range has the same guard with a year's cap", async () => {
            await withTools(null, async (call) => {
                const ok = await call("get_weight_by_date_range", {
                    start_date: "2024-01-01",
                    end_date: "2024-12-31",
                });
                expect(ok.isError).toBeFalsy();
                expect(textOf(ok)).toContain("No weight found");

                const over = await call("get_weight_by_date_range", {
                    start_date: "2024-01-01",
                    end_date: "2025-01-01",
                });
                expect(over.isError).toBe(true);
                expect(textOf(over)).toContain(
                    `at most ${WEIGHT_RANGE_MAX_DAYS} days`,
                );
                expect(textOf(over)).toContain("get_weight_trends");
            });
        });

        test("get_body_measurements has the same guard with a year's cap", async () => {
            expect(BODY_MEASUREMENT_RANGE_MAX_DAYS).toBe(366);
            await withTools(null, async (call) => {
                const ok = await call("get_body_measurements", {
                    start_date: "2024-01-01",
                    end_date: "2024-12-31",
                });
                expect(ok.isError).toBeFalsy();
                expect(textOf(ok)).toContain("No body measurements found");

                const over = await call("get_body_measurements", {
                    start_date: "2024-01-01",
                    end_date: "2025-01-01",
                });
                expect(over.isError).toBe(true);
                expect(textOf(over)).toContain(
                    `at most ${BODY_MEASUREMENT_RANGE_MAX_DAYS} days`,
                );
            });
            expect(rowsFor("get_body_measurements")[1]!.error_category).toBe(
                "date_range_too_long",
            );
        });

        test("the summary cap is a quarter", () => {
            expect(SUMMARY_RANGE_MAX_DAYS).toBe(92);
        });

        test("get_nutrition_summary refuses a range one day over its cap", async () => {
            await withTools(null, async (call) => {
                const r = await call("get_nutrition_summary", {
                    start_date: "2026-01-01",
                    end_date: "2026-04-03",
                });
                expect(r.isError).toBe(true);
                const text = textOf(r);
                expect(text).toContain("spans 93 days");
                expect(text).toContain(
                    `at most ${SUMMARY_RANGE_MAX_DAYS} days`,
                );
                expect(text).toContain("get_trends");
            });
            const rows = rowsFor("get_nutrition_summary");
            expect(rows).toHaveLength(1);
            expect(rows[0]!.error_category).toBe("date_range_too_long");
        });

        test("get_nutrition_summary accepts exactly 92 days", async () => {
            await withTools(null, async (call) => {
                const r = await call("get_nutrition_summary", {
                    start_date: "2026-01-01",
                    end_date: "2026-04-02",
                });
                expect(r.isError).toBeFalsy();
            });
            expect(rowsFor("get_nutrition_summary")[0]!.success).toBe(true);
        });

        test("get_nutrition_summary refuses a reversed range", async () => {
            await withTools(null, async (call) => {
                const r = await call("get_nutrition_summary", {
                    start_date: "2026-02-01",
                    end_date: "2026-01-01",
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain("is after end_date");
            });
            expect(rowsFor("get_nutrition_summary")[0]!.error_category).toBe(
                "invalid_date_format",
            );
        });

        test("get_nutrition_summary refuses a non-calendar date", async () => {
            await withTools(null, async (call) => {
                const r = await call("get_nutrition_summary", {
                    start_date: "2026-02-01",
                    end_date: "2026-02-30",
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain(
                    `Invalid end_date "2026-02-30": not a real calendar date`,
                );
            });
        });
    });

    // ---------- meal listings are compact, local-time and bounded ----------
    //
    // A 30-day get_meals_by_date_range used to return ~257 KB: every meal as a
    // dozen lines with its raw UTC instant and full notes. The listings now default
    // to one line per meal (src/meal-listing.ts carries the unit tests); these
    // drive the real tools to prove the wiring, the schema and the descriptions.
    describe("meal listings are compact by default", () => {
        const KYIV_ISO = "2026-01-15T19:05:00.000Z";

        test("get_meals_today: one line with the id, local time, no note text", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            db.meals = [meal({ logged_at: KYIV_ISO, notes: "long note" })];
            await withTools(null, async (call) => {
                const r = await call("get_meals_today");
                expect(r.isError).toBeFalsy();
                const text = textOf(r);
                expect(text).toContain(`[id: ${MEAL_ID}]`);
                expect(text).toContain("Times are local (Europe/Kyiv)");
                expect(text).toContain("21:05");
                expect(text).not.toContain("long note");
                expect(text).not.toContain(KYIV_ISO);
                expect(text).not.toContain("T19:05");

                const full = textOf(
                    await call("get_meals_today", { detail: "full" }),
                );
                expect(full).toContain("Notes: long note");
                expect(full).toContain("Time: 2026-01-15 21:05");
                expect(full).not.toContain(KYIV_ISO);
            });
        });

        // Pinned form: the v2 SDK answers an input-schema violation with an
        // isError tool result naming the field (the same form the write-tool
        // bounds above get), not a rejected callTool promise. The handler never
        // runs, so no analytics row is written.
        test("get_meals_by_date rejects an unknown detail at the schema", async () => {
            db.meals = [meal()];
            await withTools(null, async (call) => {
                const r = await call("get_meals_by_date", {
                    date: "2026-07-26",
                    detail: "bogus",
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain("detail");
            });
            expect(
                db.analyticsRows.filter(
                    (r) => r.tool_name === "get_meals_by_date",
                ),
            ).toHaveLength(0);
        });

        test("the range listing keeps its day headers in both modes", async () => {
            db.meals = [meal({ logged_at: "2026-01-15T12:00:00.000Z" })];
            await withTools(null, async (call) => {
                for (const detail of [undefined, "compact", "full"]) {
                    const r = await call("get_meals_by_date_range", {
                        start_date: "2026-01-01",
                        end_date: "2026-01-31",
                        ...(detail ? { detail } : {}),
                    });
                    expect(r.isError).toBeFalsy();
                    expect(textOf(r)).toContain("## 2026-01-15 (1 meal)");
                    expect(textOf(r)).toContain("Times are local (UTC)");
                }
            });
        });

        test("detail is not sent to analytics", async () => {
            db.meals = [meal()];
            await withTools(null, async (call) => {
                await call("get_meals_by_date", {
                    date: "2026-07-26",
                    detail: "full",
                });
            });
            const row = db.analyticsRows.find(
                (r) => r.tool_name === "get_meals_by_date",
            )!;
            expect(JSON.stringify(row)).not.toContain("detail");
        });

        test("listTools shows detail on all three listings, and the id sources name the range tool", async () => {
            const server = new McpServer(
                { name: "t", version: "0.0.0" },
                { capabilities: { tools: {}, resources: {} } },
            );
            registerTools(server, "u1", true, null);
            const [ct, st] = InMemoryTransport.createLinkedPair();
            const client = new Client({ name: "c", version: "0.0.0" });
            await Promise.all([server.connect(st), client.connect(ct)]);
            const { tools } = await client.listTools();
            await client.close();
            await server.close();

            for (const name of [
                "get_meals_today",
                "get_meals_by_date",
                "get_meals_by_date_range",
            ]) {
                const schema = tools.find((t) => t.name === name)
                    ?.inputSchema as {
                    properties?: Record<string, { enum?: string[] }>;
                    required?: string[];
                };
                expect(schema.properties?.detail?.enum).toEqual([
                    "compact",
                    "full",
                ]);
                expect(schema.required ?? []).not.toContain("detail");
            }
            for (const name of ["update_meal", "delete_meal"]) {
                expect(
                    tools.find((t) => t.name === name)?.description,
                ).toContain("get_meals_by_date_range");
            }
        });

        test("get_water_today prints local HH:MM, not the stored instant", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            db.waterByDate = [
                {
                    id: WATER_ID,
                    user_id: "u1",
                    amount_ml: 250,
                    logged_at: KYIV_ISO,
                    notes: null,
                    created_at: KYIV_ISO,
                    idempotency_key: null,
                },
            ];
            await withTools(null, async (call) => {
                const text = textOf(await call("get_water_today"));
                expect(text).toContain("Times are local (Europe/Kyiv)");
                expect(text).toContain("- 250 ml at 21:05");
                expect(text).not.toContain("T19:05");
            });
        });

        test("get_weight_by_date_range prints local HH:MM, not the stored instant", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            db.weights = [
                {
                    id: WEIGHT_ID,
                    user_id: "u1",
                    weight_g: 70_000,
                    logged_at: KYIV_ISO,
                    notes: null,
                    created_at: KYIV_ISO,
                    idempotency_key: null,
                },
            ];
            await withTools(null, async (call) => {
                const text = textOf(
                    await call("get_weight_by_date_range", {
                        start_date: "2026-01-01",
                        end_date: "2026-01-31",
                    }),
                );
                expect(text).toContain("Times are local (Europe/Kyiv)");
                expect(text).toContain("## 2026-01-15");
                expect(text).toContain("at 21:05");
                expect(text).not.toContain("T19:05");
            });
        });

        test("get_body_measurements prints local HH:MM, not the stored instant", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            db.measurements = [
                measurementRow({ logged_at: KYIV_ISO, created_at: KYIV_ISO }),
            ];
            await withTools(null, async (call) => {
                const text = textOf(
                    await call("get_body_measurements", {
                        start_date: "2026-01-01",
                        end_date: "2026-01-31",
                    }),
                );
                expect(text).toContain("Times are local (Europe/Kyiv)");
                expect(text).toContain("## 2026-01-15");
                expect(text).toContain("- Waist 84.5 cm at 21:05");
                expect(text).not.toContain("T19:05");
            });
        });

        test("write confirmations show local time", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            await withTools(null, async (call) => {
                const logged = textOf(
                    await call("log_meal", {
                        description: "Soup",
                        meal_type: "dinner",
                        logged_at: "2026-01-15T21:05",
                    }),
                );
                expect(logged).toContain("Time: 2026-01-15 21:05");
                expect(logged).toContain("Meal logged (Europe/Kyiv time):");
                expect(logged).not.toContain("T19:05");

                const mealUpdated = textOf(
                    await call("update_meal", {
                        id: MEAL_ID,
                        logged_at: "2026-01-15T21:05",
                    }),
                );
                expect(mealUpdated).toContain(
                    "Meal updated (Europe/Kyiv time):",
                );

                const weight = textOf(
                    await call("log_weight", {
                        weight: 70,
                        unit: "kg",
                        logged_at: "2026-01-15T21:05",
                    }),
                );
                expect(weight).toContain("at 2026-01-15 21:05 (Europe/Kyiv)");
                expect(weight).not.toContain("T19:05");

                const updated = textOf(
                    await call("update_weight", {
                        id: WEIGHT_ID,
                        logged_at: "2026-01-15T21:05",
                    }),
                );
                expect(updated).toContain("at 2026-01-15 21:05");
                expect(updated).not.toContain("T19:05");
            });
        });
    });

    // ---------- every write path places logged_at in the user's timezone ----------

    // Issue #68. Before this, an offset-less `logged_at` went straight into a
    // timestamptz column, where Postgres reads it in the session zone (UTC). A Kyiv
    // user's 21:00 dinner landed at 21:00Z — midnight the NEXT day locally — so the
    // meal vanished from "today" and reappeared on tomorrow's summary, and a bare
    // date became UTC midnight, which for every negative-offset zone is the
    // PREVIOUS local day. bulk_import_meals had resolved these correctly for
    // months; the manual tools had no resolution at all. These tests drive the real
    // tools end-to-end and assert on the value handed to the DB layer, because the
    // echoed text alone cannot tell a correct instant from a mislabelled one.
    describe("manual write tools resolve logged_at in the profile timezone", () => {
        const oatmeal = {
            description: "Oatmeal",
            meal_type: "breakfast",
            calories: 300,
        };
        const loggedAtOf = (row: Record<string, unknown> | undefined) =>
            row?.logged_at as string | undefined;

        // The core case: 08:30 in Kyiv is 05:30Z in July (UTC+3). Storing the raw
        // string instead files the meal three hours late.
        test("an offset-less local time is read as wall-clock time in the saved zone", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            await withTools(null, async (call) => {
                await call("log_meal", {
                    ...oatmeal,
                    logged_at: "2026-07-20T08:30:00",
                });
                expect(loggedAtOf(db.inserted[0])).toBe(
                    "2026-07-20T05:30:00.000Z",
                );
            });
        });

        // The offset must come from the DATE being logged, not from today. Kyiv is
        // UTC+2 in January and UTC+3 in July, so a backfilled winter meal resolved
        // with the current offset would sit an hour off — enough to cross midnight
        // for anything logged late in the evening.
        test("a backfilled winter date uses that date's offset, not today's", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            await withTools(null, async (call) => {
                await call("log_meal", {
                    ...oatmeal,
                    logged_at: "2026-01-15T08:30",
                });
                expect(loggedAtOf(db.inserted[0])).toBe(
                    "2026-01-15T06:30:00.000Z",
                );
            });
        });

        // A date with no time is anchored at local NOON, not local midnight: noon
        // leaves ~12 hours of slack before any offset change could drag the row
        // onto an adjacent calendar day.
        test("a bare date anchors at local noon and reads back as the same day", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            await withTools(null, async (call) => {
                await call("log_meal", { ...oatmeal, logged_at: "2026-07-20" });
                const stored = loggedAtOf(db.inserted[0])!;
                expect(stored).toBe("2026-07-20T09:00:00.000Z");
                expect(dateInTz(stored, "Europe/Kyiv")).toBe("2026-07-20");
            });
        });

        // The exact shape of the bug, in the zone that shows it: UTC midnight on
        // 2026-07-20 is 17:00 on 2026-07-19 in Los Angeles, so the old behaviour
        // filed a bare date one day EARLY for every user west of Greenwich.
        test("a bare date in a negative-offset zone does not slip to the previous day", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "America/Los_Angeles" };
            await withTools(null, async (call) => {
                await call("log_meal", { ...oatmeal, logged_at: "2026-07-20" });
                const stored = loggedAtOf(db.inserted[0])!;
                expect(stored).toBe("2026-07-20T19:00:00.000Z");
                expect(dateInTz(stored, "America/Los_Angeles")).toBe(
                    "2026-07-20",
                );
                // The value the old code would have written, for contrast.
                expect(
                    dateInTz("2026-07-20T00:00:00.000Z", "America/Los_Angeles"),
                ).toBe("2026-07-19");
            });
        });

        // A value that carries its own offset already names an instant. Applying
        // the profile zone on top of it would shift a correct timestamp.
        test("a value carrying its own offset is untouched by the profile timezone", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            await withTools(null, async (call) => {
                await call("log_meal", {
                    ...oatmeal,
                    logged_at: "2026-07-20T08:30:00Z",
                });
                await call("log_meal", {
                    ...oatmeal,
                    logged_at: "2026-07-20T08:30:00+05:00",
                });
                expect(loggedAtOf(db.inserted[0])).toBe(
                    "2026-07-20T08:30:00.000Z",
                );
                expect(loggedAtOf(db.inserted[1])).toBe(
                    "2026-07-20T03:30:00.000Z",
                );
            });
        });

        // Same offset-carrying string, opposite hemisphere of the prime meridian:
        // the profile zone must make no difference at all.
        test("two profiles resolve the same offset-carrying value identically", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            await withTools(null, async (call) => {
                await call("log_meal", {
                    ...oatmeal,
                    logged_at: "2026-07-20T08:30:00+05:00",
                });
            });
            const kyiv = loggedAtOf(db.inserted[0]);
            db.inserted = [];
            db.profile = { ...PROFILE_BASE, timezone: "America/Los_Angeles" };
            await withTools(null, async (call) => {
                await call("log_meal", {
                    ...oatmeal,
                    logged_at: "2026-07-20T08:30:00+05:00",
                });
            });
            expect(loggedAtOf(db.inserted[0])).toBe(kyiv!);
        });

        // The resolver must stay out of the way when the caller said nothing:
        // insertMeal derives its own "now" AND folds logged_at into the content
        // digest, so substituting a value here would change the idempotency key.
        test("an omitted logged_at reaches the DB layer as undefined", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            await withTools(null, async (call) => {
                const r = await call("log_meal", oatmeal);
                expect(r.isError).toBeFalsy();
                expect(db.inserted).toHaveLength(1);
                expect(loggedAtOf(db.inserted[0])).toBeUndefined();
                expect(textOf(r)).not.toContain("set_timezone");
            });
        });

        // log_meal, update_meal and log_water validated logged_at not at all, so
        // junk was handed to Postgres and came back as a raw cast error (or, worse,
        // parsed into something plausible). The handler throws, and withAnalytics
        // turns that into an isError result rather than rejecting the call.
        test("log_meal rejects a logged_at it cannot place on the timeline", async () => {
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    ...oatmeal,
                    logged_at: "yesterday evening",
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain("logged_at is invalid");
                expect(db.inserted).toHaveLength(0);
            });
        });

        // Read as UTC, an ordinary same-day local time from a user east of UTC
        // resolves into the future and is rejected — a call that used to succeed.
        // "logged_at is in the future" alone names the wrong cause, so the failure
        // path has to carry the same unset-timezone hint the success path does.
        test("a future-looking local time on an unconfigured account blames the timezone", async () => {
            db.profile = null;
            await withTools(null, async (call) => {
                const soon = new Date(Date.now() + 2 * 60 * 60 * 1000)
                    .toISOString()
                    .slice(0, 19);
                const r = await call("log_meal", {
                    ...oatmeal,
                    logged_at: soon,
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain("in the future");
                expect(textOf(r)).toContain("set_timezone");
                expect(db.inserted).toHaveLength(0);
            });
        });

        // An unparseable value was never placed anywhere, so the timezone had
        // nothing to do with it and the hint would only misdirect.
        test("an unparseable value on an unconfigured account does not blame the timezone", async () => {
            db.profile = null;
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    ...oatmeal,
                    logged_at: "yesterday evening",
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).not.toContain("set_timezone");
            });
        });

        // A day/month swap ("20/07" mapped to month 20) is the realistic version of
        // the same mistake, and it must not roll over into a valid 2027 date.
        test("log_water rejects a calendar date that does not exist", async () => {
            await withTools(null, async (call) => {
                const r = await call("log_water", {
                    amount_ml: 250,
                    logged_at: "2026-20-07",
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain("logged_at is invalid");
                expect(db.waterInserted).toHaveLength(0);
            });
        });

        // update_meal took the third route with no validation at all, and it can
        // move an already-correct entry, so a bad value there is a silent
        // corruption rather than a failed write.
        test("update_meal resolves a moved timestamp in the saved zone", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            await withTools(null, async (call) => {
                const r = await call("update_meal", {
                    id: MEAL_ID,
                    logged_at: "2026-07-20T08:30:00",
                });
                expect(r.isError).toBeFalsy();
                expect(loggedAtOf(db.mealUpdates[0])).toBe(
                    "2026-07-20T05:30:00.000Z",
                );
            });
        });

        // No profiles row is the only reliable "timezone was never configured"
        // signal — a defaulted "UTC" column is indistinguishable from a user who
        // genuinely chose UTC. Falling back silently would file the entry hours off
        // with nothing on screen to explain it, so the tool has to say so.
        test("a never-configured timezone warns that the value was read as UTC", async () => {
            db.profile = null;
            await withTools(null, async (call) => {
                const text = textOf(
                    await call("log_meal", {
                        ...oatmeal,
                        logged_at: "2026-07-20T08:30:00",
                    }),
                );
                expect(text).toContain("set_timezone");
                expect(text).toContain("no timezone set");
                expect(loggedAtOf(db.inserted[0])).toBe(
                    "2026-07-20T08:30:00.000Z",
                );
            });
        });

        // #99: a profile row can exist — any of set_weight_unit, set_widget_display
        // or set_alcohol_tracking creates one — without the user ever having called
        // set_timezone. `profile !== null` alone must not read as "configured".
        test("a profile row with no timezone still warns, even though it exists", async () => {
            db.profile = { ...PROFILE_BASE, timezone: null };
            await withTools(null, async (call) => {
                const text = textOf(
                    await call("log_meal", {
                        ...oatmeal,
                        logged_at: "2026-07-20T08:30:00",
                    }),
                );
                expect(text).toContain("set_timezone");
                expect(text).toContain("no timezone set");
                expect(loggedAtOf(db.inserted[0])).toBe(
                    "2026-07-20T08:30:00.000Z",
                );
            });
        });

        // The warning is about a missing setting, not about the timestamp form: a
        // value carrying its own offset never consulted the timezone, so nagging
        // about it would be noise on every single call.
        test("no warning when the value carried its own offset, even with no profile", async () => {
            db.profile = null;
            await withTools(null, async (call) => {
                const text = textOf(
                    await call("log_meal", {
                        ...oatmeal,
                        logged_at: "2026-07-20T08:30:00Z",
                    }),
                );
                expect(text).not.toContain("set_timezone");
            });
        });

        // And a configured profile must stay quiet, or the note fires on every
        // ordinary log for every user who has done nothing wrong.
        test("no warning when the profile has a timezone", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            await withTools(null, async (call) => {
                const text = textOf(
                    await call("log_meal", {
                        ...oatmeal,
                        logged_at: "2026-07-20T08:30:00",
                    }),
                );
                expect(text).not.toContain("set_timezone");
            });
        });

        // The most common call shape of all: no logged_at, because "I just ate
        // this" never carries one. Found live — a meal logged this way with no
        // profile timezone produced no warning, silently defeating #99's entire
        // point for the overwhelming majority of real calls.
        test("still warns when logged_at is omitted entirely and the timezone is unset", async () => {
            db.profile = { ...PROFILE_BASE, timezone: null };
            await withTools(null, async (call) => {
                const text = textOf(await call("log_meal", oatmeal));
                expect(text).toContain("set_timezone");
                expect(text).toContain("no timezone set");
                expect(loggedAtOf(db.inserted[0])).toBeUndefined();
            });
        });

        test("no warning when logged_at is omitted and the timezone is configured", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            await withTools(null, async (call) => {
                const text = textOf(await call("log_meal", oatmeal));
                expect(text).not.toContain("set_timezone");
            });
        });

        // Water is bucketed into local days the same way meals are, so an
        // unresolved offset-less time moves a late-evening glass onto tomorrow's
        // hydration total.
        test("log_water resolves an offset-less time the same way", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            await withTools(null, async (call) => {
                const r = await call("log_water", {
                    amount_ml: 250,
                    logged_at: "2026-07-20T08:30:00",
                });
                expect(r.isError).toBeFalsy();
                expect(loggedAtOf(db.waterInserted[0])).toBe(
                    "2026-07-20T05:30:00.000Z",
                );
            });
        });

        // Weight is ordered by logged_at to pick "latest", so a few hours of drift
        // can reorder two readings taken on the same day.
        test("log_weight resolves an offset-less time the same way", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            await withTools(null, async (call) => {
                const r = await call("log_weight", {
                    weight: 70,
                    unit: "kg",
                    logged_at: "2026-07-20T08:30:00",
                });
                expect(r.isError).toBeFalsy();
                expect(loggedAtOf(db.weightInserted[0])).toBe(
                    "2026-07-20T05:30:00.000Z",
                );
            });
        });

        // update_weight builds a patch object, and only a defined logged_at may
        // appear in it — resolving must not smuggle an undefined key into an update
        // that was only meant to change the notes.
        test("update_weight resolves an offset-less time and omits an absent one", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            await withTools(null, async (call) => {
                await call("update_weight", {
                    id: WEIGHT_ID,
                    logged_at: "2026-07-20T08:30:00",
                });
                expect(loggedAtOf(db.weightUpdates[0])).toBe(
                    "2026-07-20T05:30:00.000Z",
                );
                await call("update_weight", {
                    id: WEIGHT_ID,
                    notes: "morning",
                });
                expect(db.weightUpdates[1]).not.toHaveProperty("logged_at");
            });
        });

        test("log_body_measurement resolves an offset-less time the same way", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            await withTools(null, async (call) => {
                const r = await call("log_body_measurement", {
                    kind: "waist",
                    value: 84.5,
                    unit: "cm",
                    logged_at: "2026-07-20T08:30:00",
                });
                expect(r.isError).toBeFalsy();
                expect(loggedAtOf(db.measurementInserted[0])).toBe(
                    "2026-07-20T05:30:00.000Z",
                );
            });
        });

        test("update_body_measurement resolves an offset-less time and omits an absent one", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            db.measurements = [measurementRow()];
            await withTools(null, async (call) => {
                await call("update_body_measurement", {
                    id: MEASUREMENT_ID,
                    logged_at: "2026-07-20T08:30:00",
                });
                expect(loggedAtOf(db.measurementUpdates[0])).toBe(
                    "2026-07-20T05:30:00.000Z",
                );
                await call("update_body_measurement", {
                    id: MEASUREMENT_ID,
                    notes: "morning",
                });
                expect(db.measurementUpdates[1]).not.toHaveProperty(
                    "logged_at",
                );
            });
        });

        // The point of the whole change. The two routes do NOT dedupe against each
        // other — the importer stamps `import:` keys and log_meal derives `auto:`
        // ones — so both copies are stored either way. What must not differ is
        // where they land: before the fix the same string went in hours apart, so
        // the hand-logged meal and the imported one could sit on different local
        // days and every read path disagreed with itself.
        test("log_meal and bulk_import_meals resolve the same string identically", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            const LOCAL = "2026-07-20T08:30:00";
            await withTools(null, async (call) => {
                await call("log_meal", { ...oatmeal, logged_at: LOCAL });
                await call("bulk_import_meals", {
                    meals: [
                        {
                            source_line: 1,
                            description: "Oatmeal",
                            logged_at: LOCAL,
                            calories: 300,
                        },
                    ],
                    expected_row_count: 1,
                    dry_run: false,
                });
                expect(db.inserted).toHaveLength(2);
                expect(loggedAtOf(db.inserted[1])).toBe(
                    loggedAtOf(db.inserted[0])!,
                );
                expect(loggedAtOf(db.inserted[0])).toBe(
                    "2026-07-20T05:30:00.000Z",
                );
            });
        });

        // Same invariant for the bare-date form, where the two routes could most
        // easily disagree: one anchoring at noon and the other at midnight would
        // put the manual entry and the imported one on different local days.
        test("log_meal and bulk_import_meals anchor a bare date identically", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "America/Los_Angeles" };
            await withTools(null, async (call) => {
                await call("log_meal", { ...oatmeal, logged_at: "2026-07-20" });
                await call("bulk_import_meals", {
                    meals: [
                        {
                            source_line: 1,
                            description: "Oatmeal",
                            logged_at: "2026-07-20",
                            calories: 300,
                        },
                    ],
                    expected_row_count: 1,
                    dry_run: false,
                });
                expect(loggedAtOf(db.inserted[1])).toBe(
                    loggedAtOf(db.inserted[0])!,
                );
                expect(loggedAtOf(db.inserted[0])).toBe(
                    "2026-07-20T19:00:00.000Z",
                );
            });
        });
    });

    // The three templates that read the nutrient-sources key carry its literal, so
    // the assembled widget can find the labels in _meta (see the widget tests).
    test.each(["nutrition-summary", "goal-progress", "meal-logged"])(
        "the %s widget reads _meta under NUTRIENT_SOURCES_META_KEY",
        async (key) => {
            expect(await getWidgetHtml(key)).toContain(
                JSON.stringify(NUTRIENT_SOURCES_META_KEY),
            );
        },
    );

    describe("meal types: every value is accepted by the meal tools", () => {
        test("log_meal, update_meal, save_meal, log_saved_meal and update_saved_meal take each of the nine types", async () => {
            db.savedMeals = [savedMealRow()];
            db.meals = [storedMeal({ id: MEAL_ID })];
            await withTools(null, async (call) => {
                for (const meal_type of MEAL_TYPES) {
                    db.inserted = [];
                    db.mealUpdates = [];
                    db.savedMealWrites = [];
                    db.savedMealUpdates = [];

                    const logged = await call("log_meal", {
                        description: "Test meal",
                        meal_type,
                    });
                    expect(logged.isError).toBeFalsy();
                    expect(db.inserted[0]!.meal_type).toBe(meal_type);

                    const updated = await call("update_meal", {
                        id: MEAL_ID,
                        meal_type,
                    });
                    expect(updated.isError).toBeFalsy();
                    expect(db.mealUpdates[0]!.meal_type).toBe(meal_type);

                    const saved = await call("save_meal", {
                        name: `Named ${meal_type}`,
                        meal_type,
                        calories: 100,
                        protein_g: 5,
                        carbs_g: 10,
                        fat_g: 3,
                    });
                    expect(saved.isError).toBeFalsy();
                    expect(db.savedMealWrites[0]!.input.meal_type).toBe(
                        meal_type,
                    );

                    const savedUpdate = await call("update_saved_meal", {
                        id: SAVED_ID,
                        meal_type,
                    });
                    expect(savedUpdate.isError).toBeFalsy();
                    expect(db.savedMealUpdates[0]!.fields.meal_type).toBe(
                        meal_type,
                    );

                    db.inserted = [];
                    const entry = await call("log_saved_meal", {
                        saved_meal: SAVED_ID,
                        meal_type,
                    });
                    expect(entry.isError).toBeFalsy();
                    expect(db.inserted[0]!.meal_type).toBe(meal_type);
                }
            });
        });

        test("an unknown meal type is refused before any write", async () => {
            db.savedMeals = [savedMealRow()];
            db.meals = [storedMeal({ id: MEAL_ID })];
            await withTools(null, async (call) => {
                const logged = await call("log_meal", {
                    description: "Brunch",
                    meal_type: "brunch",
                });
                expect(logged.isError).toBe(true);
                expect(db.inserted).toHaveLength(0);

                const updated = await call("update_meal", {
                    id: MEAL_ID,
                    meal_type: "brunch",
                });
                expect(updated.isError).toBe(true);
                expect(db.mealUpdates).toHaveLength(0);

                const saved = await call("save_meal", {
                    name: "Brunch",
                    meal_type: "brunch",
                    calories: 100,
                });
                expect(saved.isError).toBe(true);
                expect(db.savedMealWrites).toHaveLength(0);

                const entry = await call("log_saved_meal", {
                    saved_meal: SAVED_ID,
                    meal_type: "brunch",
                });
                expect(entry.isError).toBe(true);
                expect(db.inserted).toHaveLength(0);

                const savedUpdate = await call("update_saved_meal", {
                    id: SAVED_ID,
                    meal_type: "brunch",
                });
                expect(savedUpdate.isError).toBe(true);
                expect(db.savedMealUpdates).toHaveLength(0);
            });
        });

        test("log_saved_meal with no meal_type copies the saved meal's new default", async () => {
            db.savedMeals = [savedMealRow({ meal_type: "post_workout" })];
            await withTools(null, async (call) => {
                const r = await call("log_saved_meal", {
                    saved_meal: SAVED_ID,
                });
                expect(r.isError).toBeFalsy();
                expect(db.inserted[0]!.meal_type).toBe("post_workout");
            });
        });
    });
}
