import {
    Client,
    StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import {
    InMemoryTransport,
    type JsonSchemaType,
    McpServer,
} from "@modelcontextprotocol/server";
import { AjvJsonSchemaValidator } from "@modelcontextprotocol/server/validators/ajv";
import { describe, expect, spyOn, test } from "bun:test";
import { Hono } from "hono";
import {
    type AddedSugarMeta,
    addedSugarMissingText,
} from "../../added-sugar.js";
import { DELETED_ACCOUNT_ANALYTICS_ID } from "../../analytics.js";
import { ToolError } from "../../errors.js";
import {
    ADDED_SUGAR_META_KEY,
    handleMcp,
    MAX_ALCOHOL_G,
    MAX_CAFFEINE_MG,
    MAX_CALORIES,
    MAX_GOAL_G,
    MAX_GOAL_MG,
    MAX_MACRO_G,
    MEAL_CONTRIBUTORS,
    MEAL_CONTRIBUTORS_META_KEY,
    registerTools,
    START_IMPORT_OUTPUT_SCHEMA,
    sumMeals,
    TOTALS_ITEM,
    totalsPayloadOf,
} from "../../mcp.js";
import { getWidgetHtml } from "../../widgets.js";
import {
    addedSugarGapMeals,
    appFor,
    db,
    type EraMode,
    ERAS,
    goals,
    meal,
    MEAL_ID,
    MEASUREMENT_ID,
    PROFILE_BASE,
    rpc,
    sseFrame,
    storedMeal,
    textOf,
    type ToolResult,
    WATER_ID,
    WEIGHT_ID,
    withHttpClient,
    withTools,
} from "../test-harness.js";

export function registerProtocolSuites(): void {
    // ---------- (1) numeric bounds ----------

    describe("write-tool numeric bounds", () => {
        // These bounds must equal the ones bulk_import_meals enforces, or the same
        // figure is accepted through one door and refused at the other. There is no
        // drift test because there is nothing to drift: src/import.ts owns the three
        // constants and src/mcp.ts re-exports them, so both doors read one value.

        // numeric(6,2) — one more digit is a Postgres "numeric field overflow",
        // which is not something a model should have to learn by hitting it.
        test("the goal ceiling is what numeric(6,2) can hold", () => {
            expect(MAX_GOAL_G).toBe(9999.99);
        });

        // Was: -1 sailed through Zod, hit the migration's `check (fiber_g >= 0)`
        // and surfaced a raw Postgres constraint error to the model.
        test("log_meal rejects a negative gram figure before touching the DB", async () => {
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "Oatmeal",
                    meal_type: "breakfast",
                    fiber_g: -1,
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain("fiber_g");
                expect(db.inserted).toHaveLength(0);
            });
        });

        // WHY the upper bound exists, demonstrated on the payload builder: zod 4
        // accepts 1e308 (it only refuses Infinity), and the rounding every totals
        // path does turns 1e308 into Infinity. One such row therefore broke every
        // LATER get_nutrition_summary / get_goal_progress / log_meal for that date
        // on outputSchema validation, until someone deleted it by hand.
        test("an unbounded 1e308 figure would poison every later read of that date", () => {
            const payload = totalsPayloadOf(
                sumMeals([meal({ fiber_g: 1e308 })]),
                null,
                false,
            );
            expect(payload.fiber_g).toBe(Infinity);
            expect(TOTALS_ITEM.safeParse(payload).success).toBe(false);
        });

        test("...and log_meal now refuses to create that row in the first place", async () => {
            await withTools(null, async (call) => {
                for (const field of [
                    "calories",
                    "protein_g",
                    "carbs_g",
                    "fat_g",
                    "fiber_g",
                    "sugar_g",
                    "alcohol_g",
                    "caffeine_mg",
                ]) {
                    const r = await call("log_meal", {
                        description: "Oatmeal",
                        meal_type: "breakfast",
                        [field]: 1e308,
                    });
                    expect(r.isError).toBe(true);
                    expect(textOf(r)).toContain(field);
                }
                expect(db.inserted).toHaveLength(0);
            });
        });

        test("update_meal is bounded the same way", async () => {
            await withTools(null, async (call) => {
                expect(
                    (await call("update_meal", { id: MEAL_ID, sugar_g: -0.5 }))
                        .isError,
                ).toBe(true);
                expect(
                    (
                        await call("update_meal", {
                            id: MEAL_ID,
                            alcohol_g: 1e308,
                        })
                    ).isError,
                ).toBe(true);
            });
        });

        // 500 g of ethanol is already ~36 US drinks in one entry; the import path
        // has drawn the line there since it shipped.
        test("alcohol has a tighter ceiling than the other macros", async () => {
            await withTools("us", async (call) => {
                const ok = await call("log_meal", {
                    description: "Wine",
                    meal_type: "dinner",
                    alcohol_g: MAX_ALCOHOL_G,
                });
                expect(ok.isError).toBeFalsy();
                const tooMuch = await call("log_meal", {
                    description: "Wine",
                    meal_type: "dinner",
                    alcohol_g: MAX_ALCOHOL_G + 1,
                });
                expect(tooMuch.isError).toBe(true);
            });
        });

        // 5,000 mg is ~50 espressos and well past a lethal single dose, so anything
        // above it is a unit slip (grams read as mg, or a coffee-bean weight) rather
        // than a drink. The rejection has to name the field, because the useful
        // correction is "you sent grams" and only `caffeine_mg` says so.
        test("caffeine has its own milligram ceiling, named in the rejection", async () => {
            await withTools(null, async (call) => {
                const ok = await call("log_meal", {
                    description: "A pot of coffee",
                    meal_type: "snack",
                    caffeine_mg: MAX_CAFFEINE_MG,
                });
                expect(ok.isError).toBeFalsy();
                expect(db.inserted[0]!.caffeine_mg).toBe(MAX_CAFFEINE_MG);

                const tooMuch = await call("log_meal", {
                    description: "Coffee",
                    meal_type: "snack",
                    caffeine_mg: MAX_CAFFEINE_MG + 1,
                });
                expect(tooMuch.isError).toBe(true);
                expect(textOf(tooMuch)).toContain("caffeine_mg");
                expect(db.inserted).toHaveLength(1);
            });
        });

        test("a negative caffeine figure is refused before the DB check fires", async () => {
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "Coffee",
                    meal_type: "snack",
                    caffeine_mg: -1,
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain("caffeine_mg");
                expect(db.inserted).toHaveLength(0);
            });
        });

        test("the top of each range is still accepted", async () => {
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "A very large day",
                    meal_type: "dinner",
                    calories: MAX_CALORIES,
                    fiber_g: MAX_MACRO_G,
                    sugar_g: 0,
                });
                expect(r.isError).toBeFalsy();
                expect(db.inserted).toHaveLength(1);
            });
        });

        test("set_nutrition_goals rejects negatives and numeric(6,2) overflow", async () => {
            await withTools(null, async (call) => {
                expect(
                    (await call("set_nutrition_goals", { daily_fiber_g: -1 }))
                        .isError,
                ).toBe(true);
                expect(
                    (
                        await call("set_nutrition_goals", {
                            daily_sugar_g: MAX_GOAL_G + 1,
                        })
                    ).isError,
                ).toBe(true);
                expect(
                    (
                        await call("set_nutrition_goals", {
                            daily_alcohol_g: 1e308,
                        })
                    ).isError,
                ).toBe(true);
            });
        });

        // daily_caffeine_mg is numeric(7,2), not the (6,2) every gram target uses —
        // milligram figures run three orders larger, so it needs a ceiling of its
        // own or a legitimate limit would be refused by a bound sized for grams.
        test("the caffeine goal ceiling is what numeric(7,2) can hold", async () => {
            expect(MAX_GOAL_MG).toBe(99999.99);
            expect(MAX_GOAL_MG).toBeGreaterThan(MAX_GOAL_G);
            await withTools(null, async (call) => {
                expect(
                    (
                        await call("set_nutrition_goals", {
                            daily_caffeine_mg: MAX_GOAL_MG,
                        })
                    ).isError,
                ).toBeFalsy();
                expect(
                    (
                        await call("set_nutrition_goals", {
                            daily_caffeine_mg: MAX_GOAL_MG + 1,
                        })
                    ).isError,
                ).toBe(true);
                expect(
                    (
                        await call("set_nutrition_goals", {
                            daily_caffeine_mg: -1,
                        })
                    ).isError,
                ).toBe(true);
            });
        });

        // Clearing a target must survive the bounds: null is not a number and must
        // not be caught by .min(0).
        test("null still clears a goal", async () => {
            db.goals = null;
            await withTools(null, async (call) => {
                const r = await call("set_nutrition_goals", {
                    daily_fiber_g: null,
                });
                expect(r.isError).toBeFalsy();
            });
        });
    });

    // ---------- delete tools report what actually happened ----------

    // A delete that matched no row (stale id, typo, or an id belonging to another
    // user — filtered out by the `user_id` eq) used to still print "deleted", so
    // the model told the user the entry was gone while it kept showing up in every
    // summary and total. Each handler must branch on whether a row matched.
    describe("delete tools distinguish deleted from not-found", () => {
        const cases: {
            tool: string;
            id: string;
            seed: (id: string) => void;
            deleted: string;
            notFound: string;
        }[] = [
            {
                tool: "delete_meal",
                id: MEAL_ID,
                seed: (id) => {
                    db.meals = [storedMeal({ id })];
                },
                deleted: `Meal ${MEAL_ID} deleted.`,
                notFound: `No meal found with id ${MEAL_ID}.`,
            },
            {
                tool: "delete_water",
                id: WATER_ID,
                seed: (id) => db.rowIds.add(id),
                deleted: `Water entry ${WATER_ID} deleted.`,
                notFound: `No water entry found with id ${WATER_ID}.`,
            },
            {
                tool: "delete_weight",
                id: WEIGHT_ID,
                seed: (id) => db.rowIds.add(id),
                deleted: `Weight entry ${WEIGHT_ID} deleted.`,
                notFound: `No weight entry found with id ${WEIGHT_ID}.`,
            },
            {
                tool: "delete_body_measurement",
                id: MEASUREMENT_ID,
                seed: (id) => db.rowIds.add(id),
                deleted: `Body measurement ${MEASUREMENT_ID} deleted.`,
                notFound: `No body measurement found with id ${MEASUREMENT_ID}.`,
            },
        ];

        for (const c of cases) {
            test(`${c.tool} confirms a row it removed`, async () => {
                c.seed(c.id);
                await withTools(null, async (call) => {
                    expect(textOf(await call(c.tool, { id: c.id }))).toBe(
                        c.deleted,
                    );
                });
            });

            test(`${c.tool} does not claim success for an unknown id`, async () => {
                await withTools(null, async (call) => {
                    const text = textOf(await call(c.tool, { id: c.id }));
                    expect(text).toBe(c.notFound);
                    expect(text).not.toContain("deleted.");
                });
            });
        }
    });

    // ---------- id params are checked before the database ----------
    //
    // A non-uuid id used to reach Postgres and come back as a uuid cast error. The
    // delete tools answer it like any other missing row; the update tools throw a
    // ToolError, which categorizeError files as record_not_found.
    describe("id params are validated before the database", () => {
        const rowFor = (tool: string) =>
            db.analyticsRows.find((r) => r.tool_name === tool)!;

        test.each([
            ["delete_meal", "meal", "get_meals_today"],
            ["delete_water", "water entry", "get_water_today"],
            ["delete_weight", "weight entry", "get_weight_today"],
            [
                "delete_body_measurement",
                "body measurement",
                "get_body_measurements",
            ],
        ])(
            "%s answers a non-uuid id without touching the database",
            async (tool, kind, source) => {
                await withTools(null, async (call) => {
                    const r = await call(tool, { id: "not-a-uuid" });
                    expect(r.isError).toBeFalsy();
                    const text = textOf(r);
                    expect(
                        text.startsWith(
                            `No ${kind} found with id "not-a-uuid"`,
                        ),
                    ).toBe(true);
                    expect(text).toContain("ids are UUIDs");
                    expect(text).toContain(source);
                });
                expect(db.deleteCalls).toBe(0);
                // Nothing matched, as with a well-formed id that names no row:
                // an answer, not a failure.
                expect(rowFor(tool).success).toBe(true);
            },
        );

        test("the echoed id is clipped to 64 characters", async () => {
            await withTools(null, async (call) => {
                const text = textOf(
                    await call("delete_meal", { id: "x".repeat(200) }),
                );
                expect(text).toContain(`"${"x".repeat(64)}"`);
                expect(text).not.toContain("x".repeat(65));
            });
        });

        test.each([
            ["update_meal", "meal", "mealUpdates"],
            ["update_weight", "weight entry", "weightUpdates"],
            [
                "update_body_measurement",
                "body measurement",
                "measurementUpdates",
            ],
        ] as const)(
            "%s refuses a non-uuid id as record_not_found",
            async (tool, kind, updates) => {
                await withTools(null, async (call) => {
                    const r = await call(tool, {
                        id: "not-a-uuid",
                        notes: "x",
                    });
                    expect(r.isError).toBe(true);
                    expect(
                        textOf(r).startsWith(
                            `No ${kind} found with id "not-a-uuid"`,
                        ),
                    ).toBe(true);
                });
                expect(db[updates]).toHaveLength(0);
                // resolveWriteTimestamp reads the profile; the id check runs first.
                expect(db.profileReads).toHaveLength(0);
                expect(rowFor(tool).error_category).toBe("record_not_found");
            },
        );
    });

    // ---------- raw errors are sanitized at the exit ----------
    //
    // withAnalytics hands the model a ToolError's text verbatim and replaces every
    // other error with a category message plus a ref, so Postgres/PostgREST text
    // (table names, casts, constraint names) never reaches the conversation.
    describe("raw database errors never reach the model", () => {
        const rowFor = (tool: string) =>
            db.analyticsRows.find((r) => r.tool_name === tool)!;

        test("a read failure becomes a category message with a ref", async () => {
            db.failWith = new Error(
                'Failed to get meals: relation "public.meals" does not exist',
            );
            await withTools(null, async (call) => {
                const r = await call("get_nutrition_summary", {
                    start_date: "2026-07-01",
                    end_date: "2026-07-07",
                });
                expect(r.isError).toBe(true);
                const text = textOf(r);
                expect(text).toContain(
                    "get_nutrition_summary could not finish",
                );
                expect(text).toMatch(/\(ref [0-9a-f]{8}\)/);
                expect(text).not.toContain("relation");
                expect(text).not.toContain("Failed to");
                expect(text.startsWith("Error:")).toBe(false);
            });
            expect(rowFor("get_nutrition_summary").error_category).toBe(
                "supabase_error",
            );
        });

        test("a rejected value is reported as one, without the cast text", async () => {
            db.failWith = new Error(
                'Failed to delete meal: invalid input syntax for type uuid: "abc"',
            );
            await withTools(null, async (call) => {
                const r = await call("delete_meal", { id: MEAL_ID });
                expect(r.isError).toBe(true);
                const text = textOf(r);
                expect(text).toContain("rejected one of the values");
                expect(text).not.toContain("invalid input syntax");
                expect(text).not.toContain("uuid");
            });
            expect(rowFor("delete_meal").error_category).toBe(
                "db_rejected_value",
            );
        });

        // The real updateMeal pre-checks the row and throws this ToolError for a
        // well-formed id the user doesn't have; its text is written for the model.
        test("update_meal's not-found ToolError passes through verbatim", async () => {
            db.failWith = new ToolError(`No meal found with id ${MEAL_ID}.`);
            await withTools(null, async (call) => {
                const r = await call("update_meal", {
                    id: MEAL_ID,
                    notes: "x",
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toBe(`No meal found with id ${MEAL_ID}.`);
            });
            expect(rowFor("update_meal").error_category).toBe(
                "record_not_found",
            );
        });

        // upsertNutritionGoals throws this ToolError when the goal saved but its
        // history row did not; the tool must report it as written, not as a
        // per-category message that would hide that the goal itself went through.
        test("set_nutrition_goals reports a failed history insert verbatim", async () => {
            const message =
                "Failed to record this change in the goals history (ref 0123abcd). The new goals themselves were saved. Calling set_nutrition_goals again with the same values records the change, dated to when it was saved; it does not save anything twice.";
            db.goalsHistoryFailure = new ToolError(message);
            await withTools(null, async (call) => {
                const r = await call("set_nutrition_goals", {
                    daily_calories: 1800,
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toBe(message);
            });
            expect(db.goals?.daily_calories).toBe(1800);
        });

        // Resources bypass withAnalytics, and the SDK forwards a thrown message to
        // the client verbatim, so the weekly summary carries its own catch.
        test("the weekly-summary resource hides the raw text behind a ref", async () => {
            db.failWith = new Error(
                'Failed to get meals: relation "public.meals" does not exist',
            );
            const warn = spyOn(console, "warn").mockImplementation(() => {});
            try {
                const message = await withHttpClient("u1", "legacy", (client) =>
                    client
                        .readResource({ uri: "nutrition://weekly-summary" })
                        .then(
                            () => "resolved",
                            (e: unknown) =>
                                e instanceof Error ? e.message : String(e),
                        ),
                );
                expect(message).toContain("Couldn't build the weekly summary");
                const ref = message.match(/\(ref ([0-9a-f]{8})\)/)?.[1];
                expect(ref).toBeDefined();
                expect(message).not.toContain("relation");
                expect(message).not.toContain("Failed to");
                const line = warn.mock.calls
                    .map((c) => String(c[0]))
                    .find((l) => l.startsWith("[resource] weekly-summary"));
                expect(line).toBe(
                    `[resource] weekly-summary error ref=${ref}: ${JSON.stringify('Failed to get meals: relation "public.meals" does not exist')}`,
                );
            } finally {
                warn.mockRestore();
            }
        });
    });

    // ---------- single dates are validated before they are read ----------
    //
    // shiftLocalDate and zonedDayStartUtc roll "2026-99-99" over to 2034 instead of
    // failing, and throw their own internal wording for "yesterday", so each
    // date-taking read tool checks its date first and answers with the
    // caller-facing message.
    describe("date params are real calendar dates", () => {
        const rowFor = (tool: string) =>
            db.analyticsRows.find((r) => r.tool_name === tool)!;

        test.each([
            ["get_trends", "end_date", "yesterday"],
            ["get_meal_patterns", "end_date", "yesterday"],
            ["get_weight_trends", "end_date", "yesterday"],
            ["get_trends", "end_date", "2026-aa-01"],
            ["get_meals_by_date", "date", "2026-99-99"],
            ["get_goal_progress", "date", "2026-99-99"],
            ["get_water_by_date", "date", "2026-99-99"],
            ["get_weight_by_date", "date", "2026-99-99"],
            ["get_meals_by_date", "date", "2026-02-30"],
            ["get_body_measurements", "start_date", "2026-02-30"],
            ["get_body_measurements", "end_date", "yesterday"],
        ])("%s refuses %s %p", async (tool, param, bad) => {
            await withTools(null, async (call) => {
                const r = await call(tool, { [param]: bad });
                expect(r.isError).toBe(true);
                const text = textOf(r);
                expect(text).toContain(
                    `Invalid ${param} "${bad}": not a real calendar date`,
                );
                expect(text).not.toContain("Invalid Date");
                expect(text).not.toContain("Invalid date string");
            });
            expect(rowFor(tool).error_category).toBe("invalid_date_format");
        });
    });

    // ---------- delete_account leaves no trace of the deleted user ----------

    // deleteAllUserData deletes tool_analytics first, then withAnalytics inserts a
    // fresh row once the handler resolves. tool_analytics.user_id is a plain
    // varchar with no FK, so that insert succeeds and puts the just-deleted user's
    // id straight back into the table the tool promised it had emptied. The row
    // itself is still worth keeping — it must simply not be attributable.
    describe("delete_account analytics", () => {
        const rowsFor = (tool: string) =>
            db.analyticsRows.filter((r) => r.tool_name === tool);

        test("a completed deletion is recorded under the sentinel, not the user", async () => {
            await withTools(null, async (call) => {
                expect(
                    textOf(await call("delete_account", { confirm: true })),
                ).toContain("permanently deleted");
            });

            expect(db.accountWipes).toBe(1);
            const rows = rowsFor("delete_account");
            expect(rows).toHaveLength(1);
            expect(rows[0]!.user_id).toBe(DELETED_ACCOUNT_ANALYTICS_ID);
            expect(rows[0]!.success).toBe(true);
            expect(db.analyticsRows.some((r) => r.user_id === "u1")).toBe(
                false,
            );
        });

        test("a cancelled deletion stays attributed to the user", async () => {
            await withTools(null, async (call) => {
                expect(
                    textOf(await call("delete_account", { confirm: false })),
                ).toContain("cancelled");
            });

            expect(db.accountWipes).toBe(0);
            const rows = rowsFor("delete_account");
            expect(rows).toHaveLength(1);
            expect(rows[0]!.user_id).toBe("u1");
        });

        test("other tools still record the real user id", async () => {
            await withTools(null, async (call) => {
                await call("get_profile");
            });

            const rows = rowsFor("get_profile");
            expect(rows).toHaveLength(1);
            expect(rows[0]!.user_id).toBe("u1");
        });
    });

    // The whole-account archive is the server's ONLY export path — the meals-only
    // export_meals tool it replaced is gone, and its meals.csv now lives inside the
    // ZIP. So the description has to carry two things a user would otherwise be
    // stranded by: where the meal history went, and the asymmetry that five of the
    // six files have no way back in.
    describe("export_all_data is on the tool surface", () => {
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

        test("it is the only export tool — export_meals is gone", async () => {
            const names = (await toolsOf()).map((t) => t.name);
            expect(names).toContain("export_all_data");
            // Not merely renamed away: leaving the old tool registered beside this
            // one is the thing this decision rejected, so a re-added meals-only
            // export should fail here rather than quietly double the surface.
            expect(names).not.toContain("export_meals");
        });

        test("its description names every file and the import asymmetry", async () => {
            const desc =
                (await toolsOf()).find((t) => t.name === "export_all_data")
                    ?.description ?? "";
            for (const file of [
                "meals.csv",
                "water.csv",
                "weight.csv",
                "body_measurements.csv",
                "goals.csv",
                "goals_history.csv",
                "profile.csv",
                "account.csv",
                "telemetry.csv",
                "connections.csv",
                "README.txt",
            ]) {
                expect(desc, file).toContain(file);
            }
            expect(desc).toContain("60 minutes");
            expect(desc).toContain("export-only");
            // With no meals-only tool left, "export my meals" lands here. The
            // description has to say so, or the model reads a tool named
            // export_all_data and decides it is the wrong one.
            expect(desc).toContain("meals.csv inside the archive");
        });

        // The archive is a write — it uploads to the exports bucket — and the
        // signed link differs on every call, so despite reading like a query none
        // of this is read-only or idempotent.
        test("it is annotated as the write it is", async () => {
            const all = (await toolsOf()).find(
                (t) => t.name === "export_all_data",
            );
            expect(all?.annotations).toEqual({
                title: "Export All Data",
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: false,
            });
        });
    });

    // The connector directory's review criteria require a `title` and the
    // applicable hints in every tool's annotations — Claude derives auto-permissions
    // from them (read-only tools run unprompted, destructive ones always prompt).
    // The top-level `title` alone does not satisfy it, which is how 34 of 36 tools
    // shipped without one.
    describe("every tool carries directory-ready annotations", () => {
        test("title and hints are present and consistent", async () => {
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

            // destructiveHint is true exactly for tools that overwrite or remove a
            // user record — "false" means "only additive updates" in the spec, so
            // the update_* tools and set_nutrition_goals belong here. The six
            // preference setters stay out on purpose: each replaces one visible
            // preference that get_profile shows and the user can set back.
            const DESTRUCTIVE = new Set([
                "delete_meal",
                "delete_water",
                "delete_active_calories",
                "delete_weight",
                "delete_body_measurement",
                "delete_account",
                "update_meal",
                "update_weight",
                "update_body_measurement",
                "set_nutrition_goals",
                "update_saved_meal",
                "delete_saved_meal",
            ]);
            const OPEN_WORLD = new Set([
                "lookup_barcode",
                "search_foods",
                "get_food_macros",
            ]);
            expect(tools.length).toBe(53);
            for (const t of tools) {
                const a = t.annotations;
                expect(a?.title, t.name).toBeTruthy();
                expect(a?.title, t.name).toBe(t.title);
                // An omitted hint is absent in v2, not false, and clients then
                // apply the spec default (openWorldHint defaults to true) — so
                // presence is checked, not just the value.
                for (const hint of [
                    "readOnlyHint",
                    "destructiveHint",
                    "idempotentHint",
                    "openWorldHint",
                ] as const)
                    expect(typeof a?.[hint], `${t.name}.${hint}`).toBe(
                        "boolean",
                    );
                if (a?.readOnlyHint)
                    expect(a.destructiveHint, t.name).toBe(false);
                expect(a?.destructiveHint, t.name).toBe(
                    DESTRUCTIVE.has(t.name),
                );
                expect(a?.openWorldHint, t.name).toBe(OPEN_WORLD.has(t.name));
            }
        });

        // The two import tools once omitted openWorldHint, which a client reads
        // as the spec default `true` — wrong for both: neither reaches outside
        // this server.
        test("the import tools pin their full annotation objects", async () => {
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

            const byName = new Map(tools.map((t) => [t.name, t.annotations]));
            expect(byName.get("start_meal_import")).toEqual({
                title: "Import Meals from a File",
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            });
            expect(byName.get("bulk_import_meals")).toEqual({
                title: "Bulk Import Meals",
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            });
        });
    });

    describe("/mcp serves the 2026-07-28 revision", () => {
        test("a negotiating client lands on the modern era", async () => {
            await withHttpClient("u1", "auto", async (client) => {
                expect(client.getProtocolEra()).toBe("modern");
                expect(client.getServerVersion()?.name).toBe("nutrition-mcp");
            });
        });

        test("a pinned 2026-07-28 client connects without fallback", async () => {
            await withHttpClient(
                "u1",
                { pin: "2026-07-28" },
                async (client) => {
                    expect(client.getProtocolEra()).toBe("modern");
                },
            );
        });

        test("the server is built per request for the authenticated user", async () => {
            // Two users, then the first again: a per-user cache would read each
            // profile once, so the third read is what proves per-request.
            for (const user of ["user-a", "user-b", "user-a"]) {
                await withHttpClient(user, { pin: "2026-07-28" }, (client) =>
                    client.listTools(),
                );
            }
            // One read per user per connection, from the tools/list alone:
            // connect()'s server/discover probe is answered from the bare server,
            // which never touches the profile.
            expect(db.profileReads).toEqual(["user-a", "user-b", "user-a"]);
        });

        // server/discover is the first request every negotiating client sends and
        // its response — supportedVersions, capabilities, instructions — contains
        // nothing a tool registration produces. Paying a Supabase round-trip for it
        // made the probe the request that failed first under rate pressure.
        test("server/discover costs no profile read and still answers in full", async () => {
            const r = await rpc(
                appFor("u1"),
                {
                    id: 3,
                    method: "server/discover",
                    params: {
                        _meta: {
                            "io.modelcontextprotocol/protocolVersion":
                                "2026-07-28",
                            "io.modelcontextprotocol/clientCapabilities": {},
                        },
                    },
                },
                {
                    "mcp-protocol-version": "2026-07-28",
                    "mcp-method": "server/discover",
                },
            );
            expect(r.status).toBe(200);
            expect(db.profileReads).toEqual([]);
            const body = (await r.json()) as {
                result?: {
                    supportedVersions?: string[];
                    capabilities?: Record<string, unknown>;
                    instructions?: string;
                };
            };
            expect(body.result?.supportedVersions).toContain("2026-07-28");

            // ...and advertises exactly what the fully-registered server does. Both
            // paths build from one literal; this is the assertion that would catch
            // them drifting apart.
            const init = await sseFrame(
                await rpc(appFor("u1"), {
                    id: 4,
                    method: "initialize",
                    params: {
                        protocolVersion: "2025-11-25",
                        capabilities: {},
                        clientInfo: { name: "c", version: "0" },
                    },
                }),
            );
            const full = init.result as {
                capabilities: Record<string, unknown>;
                instructions: string;
            };
            expect(body.result?.capabilities).toEqual(full.capabilities);
            expect(body.result?.instructions).toBe(full.instructions);
            expect(full.instructions.length).toBeGreaterThan(0);
        });
    });

    // Directory policy: tool text must not direct Claude to external software the
    // user did not ask for. "search the web" used to appear in the nutrient rule,
    // the photo-logging steps, lookup_barcode and several field descriptions, so
    // this sweeps every surface the model reads — the server instructions, every
    // tool description and every input-field description — rather than pinning
    // the sites that happened to carry it.
    describe("tool text names no external tool", () => {
        const WEB = /web search|search the web|searching the web/i;

        test.each(ERAS)(
            "no instructions, tool or field description mentions web search (%p)",
            async (mode) => {
                await withHttpClient("u1", mode, async (client) => {
                    const instructions = client.getInstructions() ?? "";
                    expect(instructions.length).toBeGreaterThan(0);
                    expect(instructions).not.toMatch(WEB);
                    // Rewording for the policy kept the issue #102 default: the
                    // instructions still say to omit logged_at for "just now".
                    expect(instructions).toContain("omit logged_at");
                    expect(instructions).toContain("get_current_time");
                    const { tools } = await client.listTools();
                    expect(tools.length).toBeGreaterThan(30);
                    for (const tool of tools) {
                        expect(tool.description ?? "", tool.name).not.toMatch(
                            WEB,
                        );
                        const props = (tool.inputSchema.properties ??
                            {}) as Record<string, { description?: string }>;
                        for (const [key, prop] of Object.entries(props)) {
                            expect(
                                prop.description ?? "",
                                `${tool.name}.${key}`,
                            ).not.toMatch(WEB);
                        }
                    }
                });
            },
        );
    });

    // Policy 1.D and 2.D: tool text must not push the model to collect a location
    // the user never gave, nor to write something the user did not ask for. The
    // instructions and log_meal once asked for "the venue and city" of every
    // restaurant meal, and several strings told the model to backfill or log on
    // its own; each assertion pins one of those sites.
    describe("tool text leaves writes and location to the user", () => {
        const LOCATION = "do not infer a location the user did not state";

        test.each(ERAS)(
            "instructions and descriptions offer rather than direct (%p)",
            async (mode) => {
                await withHttpClient("u1", mode, async (client) => {
                    const instructions = client.getInstructions() ?? "";
                    expect(instructions.length).toBeGreaterThan(0);
                    expect(instructions).not.toContain(
                        "rather than mentioning it in prose",
                    );
                    expect(instructions).not.toContain("Podil");
                    expect(instructions).not.toMatch(/venue and city/);
                    expect(instructions).toContain(LOCATION);
                    expect(instructions).toContain(
                        "once the user wants it filled in",
                    );

                    const { tools } = await client.listTools();
                    const desc = (name: string) =>
                        tools.find((t) => t.name === name)?.description ?? "";

                    const logMeal = desc("log_meal");
                    expect(logMeal).not.toMatch(/Podil|Kyiv/);
                    expect(logMeal).not.toContain("venue and city");
                    expect(logMeal).toContain(LOCATION);

                    expect(desc("search_meals")).toContain(
                        "When the user has named the restaurant",
                    );

                    // Directory review, 2026-10-01: these described when to offer a
                    // setting or how to phrase a reply, not what the tool does.
                    expect(instructions).not.toMatch(/\boffer\b/i);
                    for (const name of [
                        "set_language",
                        "set_timezone",
                        "get_meal_patterns",
                        "get_trends",
                    ]) {
                        expect(desc(name), name).not.toMatch(/\boffer\b/i);
                        expect(desc(name), name).not.toMatch(/narrate/i);
                    }

                    const updateMeal = desc("update_meal");
                    expect(updateMeal).not.toContain(
                        "rather than telling the user",
                    );
                    expect(updateMeal).toContain("the user asks or agrees");

                    for (const tool of tools) {
                        expect(tool.description ?? "", tool.name).not.toMatch(
                            /\bCall set_/,
                        );
                        const props = (tool.inputSchema.properties ??
                            {}) as Record<string, { description?: string }>;
                        for (const [key, prop] of Object.entries(props)) {
                            expect(
                                prop.description ?? "",
                                `${tool.name}.${key}`,
                            ).not.toMatch(/\bCall set_/);
                        }
                    }
                });
            },
        );

        // A target weight with nothing logged is a fact to report, not a prompt
        // to go log a weight the user never mentioned (policy 2.D).
        test("get_goal_progress leaves logging a weight to the user", async () => {
            db.goals = goals({ target_weight_g: 70000 });
            await withTools(null, async (call) => {
                const text = textOf(
                    await call("get_goal_progress", { date: "2026-07-20" }),
                );
                expect(text).toContain("Weight: no entries yet (target");
                expect(text).not.toContain("Log one with");
                expect(text).toContain("The user can log one with log_weight.");
            });
        });

        // An offset-less time on an account with no timezone: the note says what
        // happened and what the user could do, not what the model should do next.
        test("the unset-timezone note does not direct a follow-up write", async () => {
            db.profile = null;
            await withTools(null, async (call) => {
                const text = textOf(
                    await call("log_meal", {
                        description: "Oatmeal",
                        meal_type: "breakfast",
                        calories: 300,
                        logged_at: "2026-07-20T08:30:00",
                    }),
                );
                expect(text).toContain("no timezone set");
                expect(text).toContain("set_timezone");
                expect(text).not.toContain("Then re-check this entry");
            });
        });
    });

    // Policy 2.B: descriptions must describe behaviour, not over-claim it. Each
    // assertion pins one claim that was once false: the derived idempotency key
    // only survives a replay that carries logged_at, the rate limit is per HTTP
    // request (not a "budget" a week of meals exhausts), get_trends ranks days by
    // calories only, and a timezone change regroups reads.
    describe("tool text makes only claims the code keeps", () => {
        test.each(ERAS)(
            "idempotency, rate-limit, trends and timezone text (%p)",
            async (mode) => {
                await withHttpClient("u1", mode, async (client) => {
                    const instructions = client.getInstructions() ?? "";
                    expect(instructions).not.toMatch(/exhaust/i);
                    expect(instructions).toContain("omit logged_at");
                    expect(instructions).toContain("get_current_time");
                    const { tools } = await client.listTools();
                    const byName = new Map(tools.map((t) => [t.name, t]));
                    const keyDescription = (name: string) =>
                        (
                            (byName.get(name)!.inputSchema.properties ??
                                {}) as Record<string, { description?: string }>
                        ).idempotency_key?.description ?? "";
                    for (const name of [
                        "log_meal",
                        "log_water",
                        "log_weight",
                        "log_body_measurement",
                    ]) {
                        const d = keyDescription(name);
                        expect(d, name).toContain("omits logged_at");
                        expect(d, name).toContain("adds a new");
                        expect(d, name).not.toContain(
                            "You normally don't need to set this",
                        );
                    }
                    expect(keyDescription("log_water")).toContain("500 ml");
                    expect(
                        byName.get("bulk_import_meals")!.description ?? "",
                    ).not.toMatch(/exhaust/i);
                    const trends = byName.get("get_trends")!.description ?? "";
                    expect(trends).not.toMatch(/each macro/);
                    expect(trends).toContain("best and worst day by calories");
                    const tz = byName.get("set_timezone")!.description ?? "";
                    expect(tz).not.toContain("re-buckets nothing");
                    expect(tz).toContain("regroups existing entries");
                    // An import retry dedupes only while the timezone is
                    // unchanged: the key hashes the instant the row resolves to.
                    expect(instructions).toContain(
                        "as long as the timezone hasn't changed",
                    );
                    expect(instructions).not.toContain("never duplicates");
                    // Scoped to this service, so they don't attract calls meant
                    // for another connector (policy 2.C).
                    expect(
                        byName.get("get_current_time")!.description ?? "",
                    ).toContain("nutrition tracker");
                    const del = byName.get("delete_account")!;
                    expect(del.title).toBe("Delete Nutrition Account");
                    expect(del.annotations?.title).toBe(
                        "Delete Nutrition Account",
                    );
                    expect(del.description ?? "").toContain(
                        "Nutrition MCP account",
                    );
                    for (const tool of tools) {
                        expect(JSON.stringify(tool), tool.name).not.toContain(
                            "idempotent retry",
                        );
                    }
                });
            },
        );
    });

    describe("dedupe headers do not claim a retry", () => {
        const WRITES: [string, Record<string, unknown>, string][] = [
            [
                "log_meal",
                {
                    description: "Oatmeal",
                    meal_type: "breakfast",
                    calories: 300,
                },
                "Meal logged",
            ],
            ["log_water", { amount_ml: 250 }, "Water logged"],
            ["log_weight", { weight: 70, unit: "kg" }, "Weight logged"],
            [
                "log_body_measurement",
                { kind: "waist", value: 84.5, unit: "cm" },
                "Body measurement logged",
            ],
        ];

        test.each(WRITES)(
            "%s says nothing new was added when the key matched",
            async (name, args) => {
                db.dedupe = true;
                await withTools(null, async (call) => {
                    const text = textOf(await call(name, args));
                    expect(text).not.toContain("idempotent retry");
                    expect(text).toContain("nothing new was added");
                });
            },
        );

        test.each(WRITES)(
            "%s keeps its plain header for a new entry",
            async (name, args, header) => {
                await withTools(null, async (call) => {
                    const text = textOf(await call(name, args));
                    expect(text).toContain(header);
                    expect(text).not.toContain("nothing new was added");
                });
            },
        );
    });

    // The product surface, driven end to end over BOTH legs. Everything in here is
    // era-agnostic by construction (one server factory), so a difference between
    // the two columns is a bug in the handler, not in the tools.
    describe("/mcp serves one tool surface on both protocol eras", () => {
        test.each(ERAS)(
            "list_changed is not advertised (%p) — nothing could deliver it",
            async (mode) => {
                await withHttpClient("u1", mode, async (client) => {
                    const caps = client.getServerCapabilities();
                    expect(caps?.tools).toEqual({ listChanged: false });
                    expect(caps?.resources).toEqual({ listChanged: false });
                });
            },
        );

        test.each(ERAS)(
            "tools/list carries the MCP Apps links and output schemas (%p)",
            async (mode) => {
                await withHttpClient("u1", mode, async (client) => {
                    const { tools } = await client.listTools();
                    expect(tools.length).toBeGreaterThan(30);
                    const logMeal = tools.find((t) => t.name === "log_meal");
                    expect(logMeal?._meta?.ui).toEqual({
                        resourceUri: "ui://widget/meal-logged.html",
                    });
                    expect(logMeal?.outputSchema?.type).toBe("object");
                });
            },
        );

        test.each(ERAS)(
            "tools/call returns text content (%p)",
            async (mode) => {
                await withHttpClient("u1", mode, async (client) => {
                    const r = await client.callTool({
                        name: "get_profile",
                        arguments: {},
                    });
                    expect(r.isError).toBeFalsy();
                    expect((r.content as { type: string }[])[0]?.type).toBe(
                        "text",
                    );
                });
            },
        );

        // structuredContent is what every widget paints from, and start_meal_import
        // is the tool where an empty one leaves the iframe stuck on its loading
        // state. Parsing the exported schema (rather than eyeballing a field) is
        // what proves the payload the wire carried still satisfies what the tool
        // declares — including the nullable fields that must be present-and-null.
        test.each(ERAS)(
            "structuredContent satisfies the declared outputSchema (%p)",
            async (mode) => {
                // Not UTC: that is both PROFILE_BASE's zone and the null-profile
                // fallback, so only a distinct zone proves the profile was read
                // for THIS user on this leg.
                db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
                await withHttpClient("u1", mode, async (client) => {
                    const r = await client.callTool({
                        name: "start_meal_import",
                        arguments: {},
                    });
                    expect(r.isError).toBeFalsy();
                    const sc = START_IMPORT_OUTPUT_SCHEMA.parse(
                        r.structuredContent,
                    );
                    expect(sc.tz).toBe("Europe/Kyiv");
                    expect(sc.tz_configured).toBe(true);
                    expect(sc.import_tool_name).toBe("bulk_import_meals");
                });
            },
        );

        // The summary widget's "N more meals" counts ride in the result's _meta
        // (the frozen outputSchema has no room for them), so _meta has to survive
        // the wire on both legs — and the call has to pass the client's own
        // outputSchema check, which listTools arms.
        test.each(ERAS)(
            "get_nutrition_summary's contributor counts survive in _meta (%p)",
            async (mode) => {
                db.meals = [meal()];
                await withHttpClient("u1", mode, async (client) => {
                    await client.listTools();
                    const r = await client.callTool({
                        name: "get_nutrition_summary",
                        arguments: {
                            start_date: "2026-01-01",
                            end_date: "2026-01-31",
                        },
                    });
                    expect(r.isError).toBeFalsy();
                    expect(r.structuredContent).not.toHaveProperty(
                        "meal_contributors",
                    );
                    expect(
                        MEAL_CONTRIBUTORS.parse(
                            r._meta?.[MEAL_CONTRIBUTORS_META_KEY],
                        ).calories,
                    ).toBe(1);
                });
            },
        );

        // `extra` rides in _meta beside the frozen structuredContent: the client's
        // outputSchema check (armed by listTools) must still pass on both legs.
        test.each(ERAS)(
            "get_nutrition_summary's added-sugar extra rows survive in _meta (%p)",
            async (mode) => {
                db.meals = addedSugarGapMeals();
                await withHttpClient("u1", mode, async (client) => {
                    await client.listTools();
                    const r = await client.callTool({
                        name: "get_nutrition_summary",
                        arguments: {
                            start_date: "2026-01-01",
                            end_date: "2026-01-31",
                        },
                    });
                    expect(r.isError).toBeFalsy();
                    const meta = r._meta?.[
                        ADDED_SUGAR_META_KEY
                    ] as AddedSugarMeta;
                    expect(meta.extra?.map((e) => e.description)).toEqual([
                        "sweetened iced tea",
                    ]);
                    expect(
                        (
                            r.structuredContent as {
                                meals: { description: string }[];
                            }
                        ).meals.map((m) => m.description),
                    ).not.toContain("sweetened iced tea");
                });
            },
        );

        // A widget is only usable if the resource read hands back the assembled,
        // fully-inlined document under the mcp-app mime type: the iframe CSP is
        // deny-all, so anything left un-inlined simply never loads.
        test.each(ERAS)(
            "ui:// widgets read as the assembled mcp-app document (%p)",
            async (mode) => {
                const assembled = await getWidgetHtml("meal-logged");
                await withHttpClient("u1", mode, async (client) => {
                    const res = await client.readResource({
                        uri: "ui://widget/meal-logged.html",
                    });
                    const c = res.contents[0] as {
                        mimeType?: string;
                        text?: string;
                    };
                    expect(c.mimeType).toBe("text/html;profile=mcp-app");
                    expect(c.text).toBe(assembled);
                    // Spot-check the served bytes directly too, so a resource that
                    // starts serving a template instead of the assembly fails here
                    // and not only in widgets.test.ts.
                    expect(
                        c.text?.trimStart().startsWith("<!doctype html>"),
                    ).toBe(true);
                    expect(c.text).toContain("function initWidget(config)");
                    expect(c.text).not.toMatch(/\/\*@include/);
                    expect(c.text).not.toMatch(/<script[^>]+src=/);
                });
            },
        );

        test.each(ERAS)(
            "input validation errors are in-band, not transport failures (%p)",
            async (mode) => {
                await withHttpClient("u1", mode, async (client) => {
                    const r = await client.callTool({
                        name: "log_meal",
                        arguments: { description: "x", meal_type: "brunch" },
                    });
                    expect(r.isError).toBe(true);
                });
            },
        );

        // The tool that writes: a legacy tools/call has to reach insertMeal with
        // the user the bearer middleware authenticated, not with whoever the
        // previous request was for.
        test.each(ERAS)(
            "a write reaches the DB for the authenticated user (%p)",
            async (mode) => {
                await withHttpClient("mode-user", mode, async (client) => {
                    const r = await client.callTool({
                        name: "log_meal",
                        arguments: {
                            description: "eggs",
                            meal_type: "breakfast",
                            calories: 200,
                        },
                    });
                    expect(r.isError).toBeFalsy();
                });
                expect(db.inserted).toHaveLength(1);
                expect(db.inserted[0]?.description).toBe("eggs");
                // authInfo.extra.userId is the single identity carrier on both
                // legs; every profile read of this exchange must name that user.
                expect(new Set(db.profileReads)).toEqual(
                    new Set(["mode-user"]),
                );
            },
        );
    });

    // The added-sugar refusal reaches both eras as an isError result carrying the
    // text, and a gated-on success still validates against the frozen schema
    // (withHttpClient arms the client's advertised-schema check).
    describe("/mcp: the added-sugar refusal on both eras", () => {
        test.each(ERAS)("refused and saved (%p)", async (mode) => {
            const before = process.env.ADDED_SUGAR_REQUIRED_FROM;
            process.env.ADDED_SUGAR_REQUIRED_FROM = "2000-01-01";
            try {
                await withHttpClient("u1", mode, async (client) => {
                    const refused = (await client.callTool({
                        name: "log_meal",
                        arguments: {
                            description: "Cola",
                            meal_type: "snack",
                            sugar_g: 35,
                        },
                    })) as ToolResult;
                    expect(refused.isError).toBe(true);
                    expect(textOf(refused)).toBe(addedSugarMissingText());
                    expect(db.inserted).toHaveLength(0);
                    const saved = (await client.callTool({
                        name: "log_meal",
                        arguments: {
                            description: "Cola",
                            meal_type: "snack",
                            sugar_g: 35,
                            added_sugar_g: 35,
                        },
                    })) as ToolResult;
                    expect(saved.isError).toBeFalsy();
                    expect(saved.structuredContent).toBeDefined();
                });
                expect(db.inserted).toHaveLength(1);
            } finally {
                if (before === undefined)
                    delete process.env.ADDED_SUGAR_REQUIRED_FROM;
                else process.env.ADDED_SUGAR_REQUIRED_FROM = before;
            }
        });
    });

    describe("/mcp still serves 2025-era clients unchanged", () => {
        test("a legacy client completes initialize and lists tools", async () => {
            await withHttpClient("u1", "legacy", async (client) => {
                expect(client.getProtocolEra()).toBe("legacy");
                expect(client.getServerVersion()?.name).toBe("nutrition-mcp");
                expect(client.getServerCapabilities()?.tools).toBeDefined();
                const { tools } = await client.listTools();
                expect(
                    tools.find((t) => t.name === "log_meal")?._meta?.ui,
                ).toEqual({ resourceUri: "ui://widget/meal-logged.html" });
            });
        });

        // The legacy leg keeps nothing between requests either: a fresh transport
        // and a fresh server per POST is what makes a deploy invisible to the
        // connector clients that are all on this leg today.
        test("every legacy request builds its own server", async () => {
            await withHttpClient("legacy-user", "legacy", async (client) => {
                const before = db.profileReads.length;
                await client.listTools();
                await client.listTools();
                expect(db.profileReads.length).toBe(before + 2);
            });
            expect(new Set(db.profileReads)).toEqual(new Set(["legacy-user"]));
        });

        // The factory serves the tool-less bare server for the two identity-only
        // methods, gated on `ctx.era === "modern"` because the legacy fallback
        // ignores Mcp-Method entirely. Without that gate a legacy client whose
        // proxy (or whose own header bug) sent a stray Mcp-Method would have been
        // answered by a server with no tools registered at all.
        test("a stray Mcp-Method header cannot strip the tools off a legacy request", async () => {
            await withHttpClient(
                "u1",
                "legacy",
                async (client) => {
                    expect(client.getProtocolEra()).toBe("legacy");
                    const { tools } = await client.listTools();
                    expect(tools.length).toBeGreaterThan(30);
                    // The bare server reads no profile, so a profile read is the
                    // direct witness that the full-server branch was taken —
                    // dropping the era guard makes this the first assertion to go.
                    expect(db.profileReads.length).toBeGreaterThan(0);
                },
                { "mcp-method": "server/discover" },
            );
        });

        test("legacy initialize answers in-band and issues no session id", async () => {
            const r = await rpc(appFor("u1"), {
                id: 1,
                method: "initialize",
                params: {
                    protocolVersion: "2025-11-25",
                    capabilities: {},
                    clientInfo: { name: "c", version: "0" },
                },
            });
            expect(r.status).toBe(200);
            expect(r.headers.get("mcp-session-id")).toBeNull();
            const frame = await sseFrame(r);
            expect(frame.error).toBeUndefined();
            expect(
                (frame.result as { protocolVersion: string }).protocolVersion,
            ).toBe("2025-11-25");
        });
    });

    describe("/mcp transport posture", () => {
        test.each(["GET", "DELETE"])(
            "%s is refused with 405 and no SSE stream",
            async (method) => {
                const r = await appFor("u1").request("http://x/mcp", {
                    method,
                });
                expect(r.status).toBe(405);
                expect(r.headers.get("allow")).toBe("POST");
            },
        );

        test("subscriptions/listen is refused without opening a stream", async () => {
            const r = await rpc(
                appFor("u1"),
                {
                    id: 7,
                    method: "subscriptions/listen",
                    params: {
                        notifications: { tools: true },
                        _meta: {
                            "io.modelcontextprotocol/protocolVersion":
                                "2026-07-28",
                            "io.modelcontextprotocol/clientCapabilities": {},
                        },
                    },
                },
                {
                    "mcp-protocol-version": "2026-07-28",
                    "mcp-method": "subscriptions/listen",
                },
            );
            expect(r.headers.get("content-type")).not.toContain(
                "text/event-stream",
            );
            const body = (await r.json()) as {
                id?: unknown;
                error?: { code: number };
            };
            expect(body.id).toBe(7);
            // -32603 "Subscription limit reached" is the SDK's own maxSubscriptions
            // refusal, and it is now the only one: a hand-rolled -32601 pre-check
            // used to answer first off the Mcp-Method header alone, so the endpoint
            // reported two different codes for one condition.
            expect(body.error?.code).toBe(-32603);
        });

        // What the pre-check got wrong. A client that puts the listen method in the
        // header but calls a tool in the body has a header bug, and the SDK says so
        // (-32020, HTTP 400). The pre-check answered 200 "Method not found" echoing
        // the tools/call id, which reads as "this tool does not exist".
        test("a Mcp-Method that disagrees with the body is a header error, not a missing method", async () => {
            const r = await rpc(
                appFor("u1"),
                {
                    id: 8,
                    method: "tools/call",
                    params: {
                        name: "get_profile",
                        arguments: {},
                        _meta: {
                            "io.modelcontextprotocol/protocolVersion":
                                "2026-07-28",
                            "io.modelcontextprotocol/clientCapabilities": {},
                        },
                    },
                },
                {
                    "mcp-protocol-version": "2026-07-28",
                    "mcp-method": "subscriptions/listen",
                    "mcp-name": "get_profile",
                },
            );
            expect(r.status).toBe(400);
            const body = (await r.json()) as {
                error?: { code: number; message: string };
            };
            expect(body.error?.code).toBe(-32020);
            expect(body.error?.message).toContain("headers and body disagree");
        });

        // The SDK's 415 gate runs before the body is read; the pre-check sat in
        // front of it and answered 200 to a POST that never had a valid body.
        test("a non-JSON Content-Type is refused 415 before anything is parsed", async () => {
            const r = await appFor("u1").request("http://x/mcp", {
                method: "POST",
                headers: {
                    "content-type": "text/plain",
                    "mcp-method": "subscriptions/listen",
                },
                body: "not json",
            });
            expect(r.status).toBe(415);
        });

        test("the icon URL follows the forwarding headers", async () => {
            await withHttpClient(
                "u1",
                { pin: "2026-07-28" },
                async (client) => {
                    const icons = client.getServerVersion()?.icons ?? [];
                    expect(icons.map((i) => i.src)).toEqual([
                        "https://nutrition-mcp.com/favicon.ico",
                        "https://nutrition-mcp.com/icon-192.png",
                        "https://nutrition-mcp.com/icon-512.png",
                    ]);
                },
                {
                    "x-forwarded-proto": "https",
                    "x-forwarded-host": "nutrition-mcp.com",
                },
            );
        });

        // With no forwarding headers the icon falls back to the request's own
        // origin — the same fallback getBaseUrl gives the OAuth metadata URLs. It
        // used to be a hardcoded "http://localhost", so one request could advertise
        // an icon on one host and its resource metadata on another.
        test("with no forwarding headers the icon URL is the request origin", async () => {
            await withHttpClient(
                "u1",
                { pin: "2026-07-28" },
                async (client) => {
                    expect(client.getServerVersion()?.icons?.[0]?.src).toBe(
                        "http://test.local/favicon.ico",
                    );
                },
            );
        });
    });

    // The access log in src/index.ts prints `era=…` from what handleMcp publishes on
    // the Hono context. It is the instrument for retiring the 2025-11-25 leg: when
    // nothing has logged era=legacy for a sustained window, flipping the SDK's
    // `legacy: "reject"` is safe. A guess derived from request headers would not be
    // trustworthy enough to make that call, so this asserts the value comes from the
    // era the SDK actually negotiated.
    describe("/mcp records the negotiated era for the access log", () => {
        // Same wiring as appFor, plus the read the access log performs after the
        // route resolves.
        function recordingApp(userId: string, seen: (entry: string) => void) {
            const app = new Hono();
            app.all("/mcp", async (c) => {
                c.set("userId", userId);
                const res = await handleMcp(c);
                seen(
                    `${c.req.method}:${c.get("mcpEra") ?? "-"}:${c.get("mcpClient") ?? "-"}`,
                );
                return res;
            });
            return app;
        }

        // Each entry is "METHOD:era" so the assertions can distinguish a request
        // the SDK served from one this endpoint refused before the SDK saw it.
        async function traceFor(
            mode: EraMode,
            identity: { name: string; version: string } = {
                name: "t",
                version: "0",
            },
        ): Promise<string[]> {
            const seen: string[] = [];
            const app = recordingApp("era-user", (era) => seen.push(era));
            const transport = new StreamableHTTPClientTransport(
                new URL("http://test.local/mcp"),
                { fetch: async (url, init) => app.request(String(url), init) },
            );
            const client = new Client(identity, {
                versionNegotiation: { mode },
            });
            await client.connect(transport);
            try {
                await client.listTools();
            } finally {
                await client.close();
            }
            return seen;
        }

        test("every served 2025-era request is recorded as legacy", async () => {
            const seen = await traceFor("legacy");
            const eras = seen
                .filter((s) => s.startsWith("POST:"))
                .map((s) => s.split(":")[1]);
            // initialize, notifications/initialized (the 202) and tools/list. The
            // 202 matters most: it is the marker that identifies a legacy client in
            // the log, so it must carry the era like any other request.
            expect(eras.length).toBeGreaterThanOrEqual(3);
            expect(new Set(eras)).toEqual(new Set(["legacy"]));
        });

        test("every served 2026-era request is recorded as modern", async () => {
            const seen = await traceFor({ pin: "2026-07-28" });
            const eras = seen
                .filter((s) => s.startsWith("POST:"))
                .map((s) => s.split(":")[1]);
            expect(eras.length).toBeGreaterThan(0);
            expect(new Set(eras)).toEqual(new Set(["modern"]));
        });

        test("the refused GET stream carries no era, not a guessed one", async () => {
            // A 2025-era client opens the standalone SSE stream with GET, which
            // handleMcp answers 405 before the SDK runs — so nothing negotiates an
            // era and the access log must omit the field.
            const seen = await traceFor("legacy");
            const gets = seen
                .filter((s) => s.startsWith("GET:"))
                .map((s) => s.split(":")[1]);
            expect(gets.length).toBeGreaterThan(0);
            expect(new Set(gets)).toEqual(new Set(["-"]));
        });

        test("a 2026-era client is named on every request, from the envelope", async () => {
            const seen = await traceFor(
                { pin: "2026-07-28" },
                {
                    name: "acme-client",
                    version: "9.9.9",
                },
            );
            const clients = seen
                .filter((s) => s.startsWith("POST:"))
                .map((s) => s.split(":")[2]);
            expect(clients.length).toBeGreaterThan(0);
            // The modern envelope carries clientInfo on every request, so unlike the
            // legacy leg there is no request that knows the era but not the client.
            expect(new Set(clients)).toEqual(new Set(["acme-client/9.9.9"]));
        });

        test("a 2025-era client is named on initialize, the only request that carries it", async () => {
            const seen = await traceFor("legacy", {
                name: "acme-client",
                version: "9.9.9",
            });
            const clients = seen
                .filter((s) => s.startsWith("POST:"))
                .map((s) => s.split(":")[2]);
            // Documents a real limitation rather than papering over it: on the
            // stateless legacy leg every request builds a fresh server and only
            // `initialize` carries clientInfo, so the rest log no client. One named
            // request per connection is still enough to answer who is on this leg.
            expect(clients).toContain("acme-client/9.9.9");
            expect(clients).toContain("-");
        });

        test("a client name cannot forge a log line", async () => {
            // Same injection surface as the SDK error messages: this value is
            // client-supplied and goes straight into the access line.
            const seen = await traceFor(
                { pin: "2026-07-28" },
                {
                    name: "evil\n[req] POST /mcp 200 1ms ip=9.9.9.9",
                    version: "1.0",
                },
            );
            const clients = seen
                .filter((s) => s.startsWith("POST:"))
                .map((s) => s.split(":")[2]);
            for (const c of clients) {
                expect(c).not.toContain("\n");
                expect(c).not.toContain(" ");
            }
            expect(clients[0]).toBe(
                "evil_[req]_POST_/mcp_200_1ms_ip=9.9.9.9/1.0",
            );
        });

        test("an over-long client name cannot push the real fields off the line", async () => {
            const seen = await traceFor(
                { pin: "2026-07-28" },
                {
                    name: "x".repeat(500),
                    version: "y".repeat(500),
                },
            );
            const client = seen
                .filter((s) => s.startsWith("POST:"))
                .map((s) => s.split(":")[2])[0];
            expect(client).toBe(`${"x".repeat(40)}/${"y".repeat(40)}`);
        });

        // The access log is a ring buffer holding well under an hour at production
        // volume, so it cannot answer "has anyone used legacy in the last 30 days".
        // tool_analytics can, and only if the era actually reaches the row.
        test.each(ERAS)(
            "the era reaches the tool_analytics row (%p)",
            async (mode) => {
                db.analyticsRows = [];
                await withHttpClient("u1", mode, (client) =>
                    client.callTool({
                        name: "get_current_time",
                        arguments: {},
                    }),
                );
                const rows = db.analyticsRows.filter(
                    (r) => r.tool_name === "get_current_time",
                );
                expect(rows.length).toBe(1);
                expect(rows[0]?.protocol_era).toBe(
                    mode === "legacy" ? "legacy" : "modern",
                );
            },
        );

        test("a modern tool call records the client that made it", async () => {
            db.analyticsRows = [];
            await withHttpClient("u1", { pin: "2026-07-28" }, (client) =>
                client.callTool({ name: "get_current_time", arguments: {} }),
            );
            const row = db.analyticsRows.find(
                (r) => r.tool_name === "get_current_time",
            );
            // withHttpClient's client identifies itself as { name: "t", version: "0" }.
            expect(row?.client_name).toBe("t/0");
        });

        test("a legacy tool call records the era but not the client", async () => {
            db.analyticsRows = [];
            await withHttpClient("u1", "legacy", (client) =>
                client.callTool({ name: "get_current_time", arguments: {} }),
            );
            const row = db.analyticsRows.find(
                (r) => r.tool_name === "get_current_time",
            );
            // Documents the limitation instead of hiding it: on the stateless legacy
            // leg a tool call is a separate request from `initialize`, and only
            // `initialize` carries clientInfo. The era — the field the retirement
            // decision actually rests on — is still recorded.
            expect(row?.protocol_era).toBe("legacy");
            expect(row?.client_name).toBeUndefined();
        });

        test("a request refused before the factory carries no era", async () => {
            // 415: the SDK rejects on Content-Type before reading the body, so no
            // server is built and nothing stamps the trace. Inventing an era here
            // would corrupt the very count the legacy retirement decision rests on.
            const seen: string[] = [];
            const app = recordingApp("era-user", (era) => seen.push(era));
            const r = await app.request("http://test.local/mcp", {
                method: "POST",
                headers: { "content-type": "text/plain" },
                body: "not json",
            });
            expect(r.status).toBe(415);
            expect(seen).toEqual(["POST:-:-"]);
        });
    });

    // ---------- output schemas are frozen once deployed ----------
    //
    // Hosts (claude.ai, Claude Desktop) cache tools/list for an unknown, possibly
    // multi-day period and validate every structuredContent against the CACHED
    // outputSchema. Zod 4 emits `additionalProperties: false` on every object, so
    // adding a structuredContent field — even an optional one — fails the whole
    // call ("Structured content does not match the tool's output schema: data must
    // NOT have additional properties") for every client still holding the old
    // list. That happened on dev when get_nutrition_summary grew
    // `meal_contributors`. Removing or narrowing a field breaks the same clients
    // the other way round. So an advertised outputSchema never changes once it
    // ships: new widget-only data goes in the CallToolResult's `_meta` (not
    // validated against outputSchema, and handed to MCP Apps views in full — see
    // MEAL_CONTRIBUTORS_META_KEY), and new model-facing data goes in `content`.
    //
    // src/output-schemas.frozen.json pins what production advertises, per tool
    // (null = no outputSchema). Changing it is a deliberate act that needs a
    // compatibility plan for stale host caches — not a snapshot refresh to make
    // this test pass. A new tool's schema is added the same way, and is frozen
    // from its first deploy. To rewrite the file after such a decision:
    //   UPDATE_OUTPUT_SCHEMAS=1 bun test src/mcp.test.ts -t "output schemas"
    // (which also runs prettier on the file, so format:check stays green).
    describe("output schemas are frozen once deployed", () => {
        const FROZEN_PATH = new URL(
            "../../output-schemas.frozen.json",
            import.meta.url,
        );

        async function advertised(
            widgetsEnabled: boolean,
            alcohol: "us" | "uk" | null,
        ): Promise<Record<string, unknown>> {
            const server = new McpServer(
                { name: "t", version: "0.0.0" },
                { capabilities: { tools: {}, resources: {} } },
            );
            registerTools(server, "u1", widgetsEnabled, alcohol);
            const [ct, st] = InMemoryTransport.createLinkedPair();
            const client = new Client({ name: "c", version: "0.0.0" });
            await Promise.all([server.connect(st), client.connect(ct)]);
            const { tools } = await client.listTools();
            await client.close();
            await server.close();
            const out: Record<string, unknown> = {};
            for (const t of [...tools].sort((a, b) =>
                a.name.localeCompare(b.name),
            )) {
                out[t.name] = t.outputSchema ?? null;
            }
            return out;
        }

        test("every tool's advertised outputSchema matches the frozen copy", async () => {
            const current = await advertised(true, null);
            if (process.env.UPDATE_OUTPUT_SCHEMAS === "1") {
                await Bun.write(
                    FROZEN_PATH,
                    JSON.stringify(current, null, 4) + "\n",
                );
                // The committed copy is prettier-clean (CI's format:check).
                await Bun.$`bunx prettier --write ${Bun.fileURLToPath(FROZEN_PATH)}`.quiet();
            }
            const frozen = (await Bun.file(FROZEN_PATH).json()) as Record<
                string,
                unknown
            >;
            // Same tool set, then each schema on its own so a failure names it.
            expect(Object.keys(current)).toEqual(Object.keys(frozen));
            for (const name of Object.keys(frozen)) {
                expect(current[name], name).toEqual(frozen[name]);
                // Key order too: compare the serialized form, whitespace aside.
                expect(JSON.stringify(current[name]), name).toBe(
                    JSON.stringify(frozen[name]),
                );
            }
            // The schema must not depend on per-user settings either: every
            // user's host caches the same list shape.
            for (const [w, a] of [
                [true, "us"],
                [false, null],
                [false, "uk"],
            ] as const) {
                expect(JSON.stringify(await advertised(w, a))).toBe(
                    JSON.stringify(current),
                );
            }
        });

        // Compiles the committed frozen copy itself (not the live server's
        // schema) with the SDK's own ajv provider — the JSON Schema 2020-12
        // engine a host runs — so this holds even if the test above were skipped.
        test("the summary validates against the frozen JSON, and the counts arrive in _meta", async () => {
            db.meals = [meal(), meal({ id: "m-2", caffeine_mg: 80 })];
            const frozen = (await Bun.file(FROZEN_PATH).json()) as Record<
                string,
                JsonSchemaType
            >;
            const validate = new AjvJsonSchemaValidator().getValidator(
                frozen.get_nutrition_summary!,
            );
            for (const alcohol of ["us", null] as const) {
                await withTools(alcohol, async (call) => {
                    const r = await call("get_nutrition_summary", {
                        start_date: "2026-01-01",
                        end_date: "2026-01-31",
                    });
                    expect(r.isError).toBeFalsy();
                    const result = validate(r.structuredContent);
                    expect(result.errorMessage).toBeUndefined();
                    expect(result.valid).toBe(true);
                    expect(r._meta?.[MEAL_CONTRIBUTORS_META_KEY]).toMatchObject(
                        {
                            calories: 2,
                            caffeine_mg: 1,
                            alcohol_g: alcohol ? expect.any(Number) : null,
                        },
                    );
                });
            }
            // The frozen schema really is strict: one extra field fails it, which
            // is the live failure this guard exists for.
            await withTools(null, async (call) => {
                const r = await call("get_nutrition_summary", {
                    start_date: "2026-01-01",
                    end_date: "2026-01-31",
                });
                expect(
                    validate({ ...r.structuredContent, meal_contributors: {} })
                        .valid,
                ).toBe(false);
            });
        });

        // The widget cannot import the key, so it carries the literal; a rename
        // on the server would otherwise pass every server test while every host
        // silently lost the exact counts.
        test("the summary widget reads _meta under MEAL_CONTRIBUTORS_META_KEY", async () => {
            const html = await getWidgetHtml("nutrition-summary");
            expect(html).toContain(JSON.stringify(MEAL_CONTRIBUTORS_META_KEY));
        });
    });

    test("delete_account names the Apple Health sync connection and its record", async () => {
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
        const desc =
            tools.find((t) => t.name === "delete_account")?.description ?? "";
        expect(desc).toContain("Apple Health sync connection");
        expect(desc).toContain("record of values sent");
    });
}
