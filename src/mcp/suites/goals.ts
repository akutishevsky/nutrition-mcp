import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport, McpServer } from "@modelcontextprotocol/server";
import { describe, expect, spyOn, test } from "bun:test";
import { addedSugarExtra, type AddedSugarMeta } from "../../added-sugar.js";
import {
    ADDED_SUGAR_META_KEY,
    formatProgress,
    MEAL_BREAKDOWN_TOP_N,
    MEAL_CONTRIBUTORS,
    MEAL_CONTRIBUTORS_META_KEY,
    MEAL_ITEMS_META_KEY,
    MEAL_TIMES_META_KEY,
    mealBreakdown,
    nutrientPresence,
    registerTools,
    SATURATED_FAT_META_KEY,
    SODIUM_META_KEY,
    sumMeals,
    topMealBreakdown,
} from "../../mcp.js";
import type { Meal } from "../../supabase.js";
import { dateInTz, formatLocalDateTime, weekdayInTz } from "../../tz.js";
import {
    getWidgetHtml,
    GOAL_DAY_META_KEY,
    NUTRIENT_SOURCES_META_KEY,
    WIDGET_PREFS_META_KEY,
} from "../../widgets.js";
import {
    addedSugarGapMeals,
    type CallTool,
    db,
    ERAS,
    goals,
    ingredient,
    meal,
    MEAL_ID,
    PROFILE_BASE,
    textOf,
    type ToolResult,
    WATER_ID,
    withHttpClient,
    withTools,
} from "../test-harness.js";

export function registerGoalSuites(): void {
    describe("set_nutrition_goals accepts a caffeine limit", () => {
        test("the limit is stored in milligrams and echoed back", async () => {
            await withTools(null, async (call) => {
                const r = await call("set_nutrition_goals", {
                    daily_caffeine_mg: 400,
                });
                expect(r.isError).toBeFalsy();
                expect(db.goals!.daily_caffeine_mg).toBe(400);
                expect(textOf(r)).toContain("- Caffeine (max): 400 mg");
                expect(textOf(await call("get_nutrition_goals"))).toContain(
                    "- Caffeine (max): 400 mg",
                );
            });
        });

        // The whole reason caffeine is a ceiling rather than a floor: 0 is the goal
        // someone cutting it out entirely sets, and a floor would file that as
        // "unset" — stored, echoed, then silently ignored, which is how the 0 g
        // alcohol limit bug went.
        test("a limit of 0 is stored, echoed and honoured", async () => {
            await withTools(null, async (call) => {
                const r = await call("set_nutrition_goals", {
                    daily_caffeine_mg: 0,
                });
                expect(db.goals!.daily_caffeine_mg).toBe(0);
                expect(textOf(r)).toContain("- Caffeine (max): 0 mg");
                expect(textOf(r)).not.toContain("Caffeine (max): not set");
            });
            // ...and the progress line then reports anything at all as over it.
            expect(
                formatProgress(
                    sumMeals([meal({ caffeine_mg: 95 })]),
                    goals({ daily_caffeine_mg: 0 }),
                    null,
                    nutrientPresence([meal({ caffeine_mg: 95 })]),
                ),
            ).toContain("Caffeine: 95 / 0 mg limit (95 mg over)");
        });

        test("null clears it, and an omitted field keeps the stored value", async () => {
            await withTools(null, async (call) => {
                await call("set_nutrition_goals", { daily_caffeine_mg: 400 });
                await call("set_nutrition_goals", { daily_protein_g: 130 });
                expect(db.goals!.daily_caffeine_mg).toBe(400);
                await call("set_nutrition_goals", { daily_caffeine_mg: null });
                expect(db.goals!.daily_caffeine_mg).toBeNull();
            });
        });
    });

    // ---------- (3) the two alcohol-setting tools ----------

    describe("set_alcohol_tracking", () => {
        test("enabling writes the flag and confirms it", async () => {
            await withTools(null, async (call) => {
                const r = await call("set_alcohol_tracking", { enabled: true });
                expect(db.profilePatches[0]!.alcohol_tracking_enabled).toBe(
                    true,
                );
                expect(db.profile!.alcohol_tracking_enabled).toBe(true);
                const text = textOf(r);
                expect(text).toContain("enabled");
                expect(text).not.toContain("disabled");
                expect(text).toContain("US standard drinks");
            });
        });

        test("disabling writes false and says so", async () => {
            db.profile = { ...PROFILE_BASE, alcohol_tracking_enabled: true };
            await withTools("us", async (call) => {
                const r = await call("set_alcohol_tracking", {
                    enabled: false,
                });
                expect(db.profilePatches[0]!.alcohol_tracking_enabled).toBe(
                    false,
                );
                expect(db.profile!.alcohol_tracking_enabled).toBe(false);
                expect(textOf(r)).toContain("disabled");
                expect(textOf(r)).toContain("already logged is kept");
            });
        });

        test("drink_unit is stored when given and left alone when omitted", async () => {
            await withTools(null, async (call) => {
                await call("set_alcohol_tracking", {
                    enabled: true,
                    drink_unit: "uk",
                });
                expect(db.profile!.preferred_drink_unit).toBe("uk");
                // Toggling off and on again must not reset the saved unit, so the
                // patch may not carry preferred_drink_unit at all.
                await call("set_alcohol_tracking", { enabled: false });
                expect(db.profilePatches[1]).not.toHaveProperty(
                    "preferred_drink_unit",
                );
                const r = await call("set_alcohol_tracking", { enabled: true });
                expect(textOf(r)).toContain("UK units");
            });
        });

        test("rejects a drink unit that is not us or uk", async () => {
            await withTools(null, async (call) => {
                const r = await call("set_alcohol_tracking", {
                    enabled: true,
                    drink_unit: "metric",
                });
                expect(r.isError).toBe(true);
                expect(db.profilePatches).toHaveLength(0);
            });
        });

        // The old copy told the user the change landed "from the next
        // conversation" and that an open chat might keep the previous setting.
        // Both were false: handleMcp builds a fresh McpServer per POST
        // (sessionIdGenerator: undefined) and buildMcpServer re-reads the profile
        // each time, and unlike widgets_enabled the gate touches no registration
        // metadata that a host would need a tools/list refresh to pick up.
        test("does not tell the user to start a new chat", async () => {
            await withTools(null, async (call) => {
                const on = textOf(
                    await call("set_alcohol_tracking", { enabled: true }),
                );
                const off = textOf(
                    await call("set_alcohol_tracking", { enabled: false }),
                );
                for (const text of [on, off]) {
                    expect(text).not.toContain("next conversation");
                    expect(text).not.toContain("reconnect");
                    expect(text).not.toContain("new conversation");
                }
            });
        });

        test("its description does not repeat the reconnect caveat either", async () => {
            await withTools(null, async () => {});
            const server = new McpServer(
                { name: "t", version: "0.0.0" },
                { capabilities: { tools: {}, resources: {} } },
            );
            registerTools(server, "u1", true, null);
            const [ct, st] = InMemoryTransport.createLinkedPair();
            const client = new Client({ name: "c", version: "0.0.0" });
            await Promise.all([server.connect(st), client.connect(ct)]);
            const { tools } = await client.listTools();
            const setAlcohol = tools.find(
                (t) => t.name === "set_alcohol_tracking",
            );
            expect(setAlcohol?.description).not.toContain(
                "until it reconnects",
            );
            // set_widget_display KEEPS its caveat: widgets_enabled decides each
            // tool's _meta.ui link, which really does need a tools/list refresh.
            const setWidgets = tools.find(
                (t) => t.name === "set_widget_display",
            );
            expect(setWidgets?.description).toContain("reconnects");
            await client.close();
            await server.close();
        });
    });

    describe("set_widget_display expanded", () => {
        test("expanded alone is stored and leaves enabled untouched", async () => {
            await withTools(null, async (call) => {
                const r = await call("set_widget_display", { expanded: true });
                expect(r.isError).toBeFalsy();
                expect(db.profilePatches[0]!.widgets_expanded).toBe(true);
                expect("widgets_enabled" in db.profilePatches[0]!).toBe(false);
                expect(textOf(r)).toContain("open expanded");
                expect(textOf(r)).not.toContain("Widgets enabled");
            });
        });

        test("enabled alone leaves expanded untouched", async () => {
            await withTools(null, async (call) => {
                const r = await call("set_widget_display", { enabled: false });
                expect(db.profilePatches[0]!.widgets_enabled).toBe(false);
                expect("widgets_expanded" in db.profilePatches[0]!).toBe(false);
                expect(textOf(r)).toContain("Widgets disabled.");
            });
        });

        test("neither field is refused with nothing written", async () => {
            await withTools(null, async (call) => {
                const r = await call("set_widget_display", {});
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain("give enabled, expanded or both");
                expect(db.profilePatches).toHaveLength(0);
            });
        });

        test("get_profile names the expanded preference", async () => {
            db.profile = { ...PROFILE_BASE, widgets_expanded: true };
            await withTools(null, async (call) => {
                expect(textOf(await call("get_profile"))).toContain(
                    "Widgets: enabled, opening expanded.",
                );
            });
        });

        test("widget results carry the preference only when expanded is on", async () => {
            db.goals = goals();
            const prefsOf = async (opts: {
                widgetsEnabled?: boolean;
                widgetsExpanded?: boolean;
            }) => {
                let meta: unknown = "unset";
                await withTools(
                    null,
                    async (call) => {
                        const r = await call("get_goal_progress", {
                            date: "2026-07-26",
                        });
                        expect(r.isError).toBeFalsy();
                        meta = r._meta?.[WIDGET_PREFS_META_KEY];
                    },
                    opts,
                );
                return meta;
            };
            expect(await prefsOf({ widgetsExpanded: true })).toEqual({
                v: 1,
                expanded: true,
            });
            // Off (the default): the result is exactly what it was before.
            expect(await prefsOf({})).toBeUndefined();
            // Widgets off: nothing would read it.
            expect(
                await prefsOf({ widgetsEnabled: false, widgetsExpanded: true }),
            ).toBeUndefined();
        });

        // Every tool linking a widget with a Show more button must wrap its handler,
        // or that tool silently ignores the preference. Scraped from the source
        // like the tool names in site-copy.test.ts: calling every such tool would
        // need a fixture per tool, and the get_goal_progress test above already
        // checks what the wrapper does.
        test("every tool linking an expandable widget is wrapped", async () => {
            const parts = [
                await Bun.file(new URL("../../mcp.ts", import.meta.url)).text(),
            ];
            for await (const file of new Bun.Glob("*.ts").scan({
                cwd: new URL("../tools", import.meta.url).pathname,
            })) {
                parts.push(
                    await Bun.file(
                        new URL(`../tools/${file}`, import.meta.url),
                    ).text(),
                );
            }
            const src = parts.join("\n");
            const blocks = src.split("    server.registerTool(\n").slice(1);
            const linked = blocks.filter(
                (b) =>
                    /uiMeta\(\w+_WIDGET_URI\)/.test(b) &&
                    !b.includes("uiMeta(IMPORT_MEALS_WIDGET_URI)"),
            );
            expect(linked.length).toBe(8);
            for (const b of linked) {
                const name = /^\s*"(\w+)"/.exec(b)![1];
                expect({
                    name,
                    wrapped: /\n        withWidgetPrefs\(\s*async /.test(b),
                }).toEqual({
                    name,
                    wrapped: true,
                });
            }
        });

        // The widgets cannot import the key: shared/bridge.js repeats it, and each
        // widget with a Show more button must actually consult it.
        test("every expandable widget reads the preference", async () => {
            for (const key of [
                "meal-logged",
                "nutrition-summary",
                "goal-progress",
                "trends",
                "weight-trends",
                "digest",
            ]) {
                const html = await getWidgetHtml(key);
                expect(html).toContain(`"${WIDGET_PREFS_META_KEY}"`);
                expect(html).toMatch(/startExpanded\((meta|resultMeta)\)/);
            }
        });
    });

    describe("get_profile > alcohol tracking section", () => {
        test("reports enabled with the saved unit", async () => {
            db.profile = {
                ...PROFILE_BASE,
                alcohol_tracking_enabled: true,
                preferred_drink_unit: "uk",
            };
            await withTools("uk", async (call) => {
                const text = textOf(await call("get_profile", {}));
                expect(text).toContain("Alcohol tracking: enabled");
                expect(text).toContain("UK units");
                expect(text).not.toContain("no preference saved");
            });
        });

        test("flags the US fallback as a default, not a choice", async () => {
            db.profile = { ...PROFILE_BASE, alcohol_tracking_enabled: true };
            await withTools("us", async (call) => {
                const text = textOf(await call("get_profile", {}));
                expect(text).toContain("US standard drinks");
                expect(text).toContain("no preference saved");
            });
        });

        test("reports disabled, and that stored alcohol is kept", async () => {
            await withTools(null, async (call) => {
                const text = textOf(await call("get_profile", {}));
                expect(text).toContain("Alcohol tracking: disabled");
                expect(text).toContain("still stored");
                expect(text).toContain("set_alcohol_tracking");
            });
        });

        // A profile row that has never been touched must read as OFF: the fallback
        // is the opt-in itself.
        test("no profile row at all reads as disabled", async () => {
            db.profile = null;
            await withTools(null, async (call) => {
                expect(textOf(await call("get_profile", {}))).toContain(
                    "Alcohol tracking: disabled",
                );
            });
        });
    });

    // ---------- the summary ships only the meals its widget can show ----------
    //
    // structuredContent.meals used to be one row per meal: 186 meals came to
    // ~47 KB, of which the widget draws the top MEAL_BREAKDOWN_TOP_N per metric.
    describe("get_nutrition_summary bounds its meal breakdown", () => {
        const METRICS = [
            "calories",
            "protein_g",
            "carbs_g",
            "fat_g",
            "fiber_g",
            "sugar_g",
            "alcohol_g",
            "caffeine_mg",
        ] as const;

        type Row = Record<string, unknown> & { description: string };
        interface SummaryPayload {
            meals: Row[];
        }
        /** The per-metric counts ride in the result's _meta, never in
         *  structuredContent, whose schema is frozen (see the output-schema
         *  freeze guard below). */
        const contributorsOf = (r: ToolResult) =>
            r._meta?.[MEAL_CONTRIBUTORS_META_KEY] as Record<
                string,
                number | null
            >;

        /** The widget's own mealList ranking: v > 0, descending, stable. */
        const topOf = (rows: Row[], key: string) =>
            rows
                .map((row) => ({ row, v: Number(row[key] ?? 0) || 0 }))
                .filter((r) => r.v > 0)
                .sort((a, b) => b.v - a.v)
                .slice(0, MEAL_BREAKDOWN_TOP_N)
                .map((r) => r.row.description);

        // 31 days × 6 meals with metrics that peak on different meals, so the
        // union is genuinely wider than any single metric's top 8.
        function month(): Meal[] {
            const out: Meal[] = [];
            for (let d = 1; d <= 31; d++) {
                for (let i = 0; i < 6; i++) {
                    const n = (d - 1) * 6 + i;
                    out.push(
                        meal({
                            id: `m-${n}`,
                            logged_at: `2026-01-${String(d).padStart(2, "0")}T${String(6 + i * 2).padStart(2, "0")}:00:00.000Z`,
                            description: `meal ${n}`,
                            calories: 200 + ((n * 37) % 500),
                            protein_g: (n * 13) % 60,
                            carbs_g: (n * 29) % 90,
                            fat_g: (n * 7) % 40,
                            fiber_g: (n * 11) % 15,
                            sugar_g: (n * 17) % 30,
                            alcohol_g: n % 10 === 0 ? 14 : 0,
                            caffeine_mg: i === 0 ? 50 + d : null,
                        }),
                    );
                }
            }
            return out;
        }

        const summarize = (call: CallTool) =>
            call("get_nutrition_summary", {
                start_date: "2026-01-01",
                end_date: "2026-01-31",
            });

        test("a long meal description is clipped in structuredContent.meals, like a listing", async () => {
            const long = "x".repeat(500);
            db.meals = [
                meal({ description: long, logged_at: "2026-01-10T12:00:00Z" }),
            ];
            await withTools(null, async (call) => {
                const r = await summarize(call);
                expect(r.isError).toBeFalsy();
                const sc = r.structuredContent as unknown as SummaryPayload;
                expect(sc.meals).toHaveLength(1);
                expect(sc.meals[0]!.description).toBe(`${"x".repeat(200)}…`);
            });
        });

        test("a 186-meal month ships only the per-metric top N, with true counts", async () => {
            const meals = month();
            db.meals = meals;
            for (const alcohol of ["us", null] as const) {
                await withTools(alcohol, async (call) => {
                    const r = await summarize(call);
                    expect(r.isError).toBeFalsy();
                    const sc = r.structuredContent as unknown as SummaryPayload;
                    expect(sc.meals.length).toBeLessThanOrEqual(
                        METRICS.length * MEAL_BREAKDOWN_TOP_N,
                    );
                    expect(sc.meals.length).toBeGreaterThan(
                        MEAL_BREAKDOWN_TOP_N,
                    );
                    expect(sc).not.toHaveProperty("meal_contributors");
                    const contributors = contributorsOf(r);
                    expect(() =>
                        MEAL_CONTRIBUTORS.parse(contributors),
                    ).not.toThrow();
                    expect(contributors.calories).toBe(186);
                    expect(contributors.caffeine_mg).toBe(31);
                    expect(contributors.alcohol_g).toBe(alcohol ? 19 : null);

                    // What the full breakdown would have been, ranked the widget's
                    // way: every metric's top N survives the cut unchanged, and
                    // nothing outside every top N is shipped.
                    const all = mealBreakdown(meals, "UTC", alcohol) as Row[];
                    const tops = new Set<string>();
                    for (const key of METRICS) {
                        const expected = topOf(all, key);
                        expect(topOf(sc.meals, key)).toEqual(expected);
                        for (const d of expected) tops.add(d);
                    }
                    for (const row of sc.meals) {
                        expect(tops.has(row.description)).toBe(true);
                    }
                    expect(sc.meals.length).toBe(tops.size);
                    // Logged order is kept.
                    const order = sc.meals.map((m) =>
                        Number(m.description.slice(5)),
                    );
                    expect([...order].sort((a, b) => a - b)).toEqual(order);
                });
            }
        });

        test("the added-sugar list gets its top meals via _meta.extra, structuredContent.meals unchanged", async () => {
            const meals = addedSugarGapMeals();
            db.meals = meals;
            for (const alcohol of ["us", null] as const) {
                await withTools(alcohol, async (call) => {
                    const r = await summarize(call);
                    expect(r.isError).toBeFalsy();
                    const sc = r.structuredContent as unknown as SummaryPayload;
                    // Exactly what topMealBreakdown kept before `extra` existed:
                    // the drink tops nothing that ranks rows, so it is absent.
                    const before = topMealBreakdown(
                        mealBreakdown(meals, "UTC", alcohol),
                        alcohol,
                    ).meals;
                    expect(sc.meals).toEqual(before as Row[]);
                    expect(
                        sc.meals.some(
                            (m) => m.description === "sweetened iced tea",
                        ),
                    ).toBe(false);

                    const meta = r._meta?.[
                        ADDED_SUGAR_META_KEY
                    ] as AddedSugarMeta;
                    expect(meta.v).toBe(1);
                    expect(meta.contributors).toBe(2);
                    // The kept bowl with 2 g is in `meals`, so not in `extra`.
                    expect(meta.extra).toEqual([
                        {
                            description: "sweetened iced tea",
                            meal_type: "snack",
                            date: "2026-01-20",
                            added_sugar_g: 30,
                        },
                    ]);
                });
            }
        });

        test("extra rows are formatted exactly like breakdown rows", () => {
            const meals = [
                meal({
                    id: "00000000-0000-4000-8000-300000000000",
                    description: "y".repeat(500),
                    meal_type: null,
                    // 00:30 on the 11th in Kyiv, still the 10th in UTC.
                    logged_at: "2026-01-10T22:30:00.000Z",
                    added_sugar_g: 12.345,
                }),
            ];
            const rows = mealBreakdown(meals, "Europe/Kyiv", null);
            expect(
                addedSugarExtra(meals, rows, [], MEAL_BREAKDOWN_TOP_N),
            ).toEqual([
                {
                    description: `${"y".repeat(200)}…`,
                    meal_type: null,
                    date: "2026-01-11",
                    added_sugar_g: 12.3,
                },
            ]);
        });

        test("the empty path carries zero contributors in _meta", async () => {
            for (const alcohol of ["us", null] as const) {
                await withTools(alcohol, async (call) => {
                    const r = await summarize(call);
                    const sc = r.structuredContent as unknown as SummaryPayload;
                    expect(sc.meals).toEqual([]);
                    expect(sc).not.toHaveProperty("meal_contributors");
                    expect(contributorsOf(r)).toEqual({
                        calories: 0,
                        protein_g: 0,
                        carbs_g: 0,
                        fat_g: 0,
                        fiber_g: 0,
                        sugar_g: 0,
                        alcohol_g: alcohol ? expect.any(Number) : null,
                        caffeine_mg: 0,
                    });
                });
            }
        });
    });

    // ---------- the summary states its own denominator (issue #70) ----------
    //
    // The unit-level pin above proves the two aggregations legitimately disagree.
    // This proves get_nutrition_summary SAYS so, which is the actual fix: the
    // calendar length of the window rides on the wire next to logged_days, and the
    // text warns the model that get_trends will print a smaller figure for the same
    // days. Neither is reachable from a pure function — both are assembled in the
    // handler — so this goes through the real tool.
    describe("get_nutrition_summary discloses its logged-day denominator", () => {
        const START = "2026-06-27";
        const END = "2026-07-26"; // 30 calendar days inclusive
        const dayAt = (i: number) => {
            const d = new Date(`${START}T00:00:00Z`);
            d.setUTCDate(d.getUTCDate() + i);
            return d.toISOString().slice(0, 10);
        };

        /** `step` 2 logs every other day (15 of 30), `step` 1 logs all 30. */
        function stage(step: number): void {
            db.meals = [];
            db.water = [];
            for (let i = 0; i < 30; i += step) {
                db.meals.push(
                    meal({
                        id: `d-${i}`,
                        logged_at: `${dayAt(i)}T12:00:00.000Z`,
                        calories: 2000,
                        protein_g: 100,
                        carbs_g: 200,
                        fat_g: 80,
                        fiber_g: null,
                        sugar_g: null,
                        alcohol_g: null,
                    }),
                );
                db.water.push({
                    id: `w-${i}`,
                    user_id: "u1",
                    amount_ml: 2000,
                    logged_at: `${dayAt(i)}T12:00:00.000Z`,
                    notes: null,
                    created_at: `${dayAt(i)}T12:00:00.000Z`,
                    idempotency_key: null,
                });
            }
        }

        interface SummaryPayload {
            logged_days: number;
            days_in_range: number;
            averages: Record<string, number>;
            locale: string;
        }

        const summarize = async (call: CallTool) =>
            call("get_nutrition_summary", { start_date: START, end_date: END });

        test("a half-logged window reports 15 logged days out of 30 in range", async () => {
            stage(2);
            await withTools(null, async (call) => {
                const r = await summarize(call);
                const sc = r.structuredContent as unknown as SummaryPayload;
                expect(sc.logged_days).toBe(15);
                expect(sc.days_in_range).toBe(30);
                // Per LOGGED day — the same 2000 kcal a user sees on any one of the
                // days they ate, not the 1000 get_trends reports for the month.
                expect(sc.averages.calories).toBe(2000);
                expect(sc.averages.protein_g).toBe(100);
                expect(sc.averages.carbs_g).toBe(200);
                expect(sc.averages.fat_g).toBe(80);
                expect(sc.averages.water_ml).toBe(2000);
            });
        });

        test("...and the text tells the model which denominator that was", async () => {
            stage(2);
            await withTools(null, async (call) => {
                const text = textOf(await summarize(call));
                expect(text).toContain(
                    "Daily averages are per logged day — 15 of the 30 days in range.",
                );
                expect(text).toContain(
                    "get_trends averages over all 30 calendar days instead",
                );
            });
        });

        // No gap, nothing to disclose: the note would be noise on what is the
        // common case for anyone logging daily.
        test("a fully-logged window stays silent about the denominator", async () => {
            stage(1);
            await withTools(null, async (call) => {
                const r = await summarize(call);
                const sc = r.structuredContent as unknown as SummaryPayload;
                expect(sc.logged_days).toBe(30);
                expect(sc.days_in_range).toBe(30);
                expect(sc.averages.calories).toBe(2000);
                expect(textOf(r)).not.toContain("per logged day");
            });
        });

        // days_in_range is a declared outputSchema field, so the early return for a
        // window with nothing in it has to carry it too or the SDK rejects the
        // result outright.
        test("an empty range still reports the size of the window", async () => {
            await withTools(null, async (call) => {
                const r = await summarize(call);
                const sc = r.structuredContent as unknown as SummaryPayload;
                expect(r.isError).toBeFalsy();
                expect(sc.logged_days).toBe(0);
                expect(sc.days_in_range).toBe(30);
                // The empty-range branch has its own structuredContent literal,
                // separate from the populated one below — both must carry the
                // widget's resolved locale, not just the common case.
                expect(sc.locale).toBe("en");
            });
        });

        // The dashboard widget reads structuredContent.locale (get_language /
        // set_language) to render its own strings — not the language of `content`,
        // which stays whatever the model uses.
        test("structuredContent carries the profile's saved widget language", async () => {
            stage(1);
            db.profile = { ...PROFILE_BASE, locale: "de" };
            await withTools(null, async (call) => {
                const sc = (await summarize(call))
                    .structuredContent as unknown as SummaryPayload;
                expect(sc.locale).toBe("de");
            });
        });

        test("structuredContent defaults locale to English when never set", async () => {
            stage(1);
            db.profile = { ...PROFILE_BASE, locale: null };
            await withTools(null, async (call) => {
                const sc = (await summarize(call))
                    .structuredContent as unknown as SummaryPayload;
                expect(sc.locale).toBe("en");
            });
        });

        // A single-day range is 1 day, not 0 — an off-by-one here would make the
        // note read "1 of the 0 days in range" on the most ordinary query there is.
        test("a single-day range spans one day", async () => {
            stage(1);
            await withTools(null, async (call) => {
                const r = (await call("get_nutrition_summary", {
                    start_date: START,
                    end_date: START,
                })) as ToolResult;
                const sc = r.structuredContent as unknown as SummaryPayload;
                expect(sc.days_in_range).toBe(1);
            });
        });
    });

    // The same covered-days rule as fiber and sugar, but with no opt-in above it
    // and with the "never recorded" case as the norm rather than the exception —
    // so the summary is where a fabricated "0 mg average" would be most visible.
    describe("get_nutrition_summary reports caffeine over its covered days only", () => {
        const START = "2026-07-20";
        const END = "2026-07-24"; // 5 calendar days inclusive

        interface SummaryPayload {
            averages: Record<string, number | null>;
            recorded_days: Record<string, number | null>;
            days: { date: string; caffeine_mg: number | null }[];
        }

        /** One meal a day for five days; `caffeine` gives each day's figure, with
         *  null meaning that day recorded no caffeine at all. */
        function stage(caffeine: (number | null)[]): void {
            db.meals = caffeine.map((mg, i) =>
                meal({
                    id: `d-${i}`,
                    logged_at: `2026-07-2${i}T12:00:00.000Z`,
                    calories: 600,
                    fiber_g: null,
                    sugar_g: null,
                    alcohol_g: null,
                    caffeine_mg: mg,
                }),
            );
        }

        const summarize = (call: CallTool) =>
            call("get_nutrition_summary", { start_date: START, end_date: END });

        test("two coffee days out of five average over the two", async () => {
            stage([95, null, null, 105, null]);
            await withTools(null, async (call) => {
                const r = await summarize(call);
                const sc = r.structuredContent as unknown as SummaryPayload;
                expect(sc.recorded_days.caffeine_mg).toBe(2);
                expect(sc.averages.caffeine_mg).toBe(100);
                // The wrong answer: 200 / 5 logged days.
                expect(sc.averages.caffeine_mg).not.toBe(40);
                // Per-day, an uncovered day is null rather than a summed 0, so the
                // widget's client-side re-average can tell them apart.
                expect(sc.days.map((d) => d.caffeine_mg)).toEqual([
                    95,
                    null,
                    null,
                    105,
                    null,
                ]);
                // And the text says which days the figure came from.
                expect(textOf(r)).toContain("caffeine 2");
            });
        });

        // The #78 trap in its most likely form: five logged days, none of them a
        // coffee. Nothing may claim a caffeine figure — not an average, not a
        // per-day zero, not a line in the text.
        test("a window with no caffeine at all reports null, not 0", async () => {
            stage([null, null, null, null, null]);
            await withTools(null, async (call) => {
                const r = await summarize(call);
                const sc = r.structuredContent as unknown as SummaryPayload;
                expect(sc.recorded_days.caffeine_mg).toBe(0);
                expect(sc.averages.caffeine_mg).toBeNull();
                expect(sc.days.every((d) => d.caffeine_mg === null)).toBe(true);
                expect(textOf(r)).not.toContain("Caffeine");
                expect(textOf(r)).not.toContain("caffeine");
            });
        });

        // recorded_days.caffeine_mg is a non-nullable declared field and averages
        // is a TOTALS_ITEM, so the empty-window early return has to build both — an
        // omitted key there is a validation error, not a null.
        test("an empty window still emits a complete, valid payload", async () => {
            await withTools(null, async (call) => {
                const r = await summarize(call);
                const sc = r.structuredContent as unknown as SummaryPayload;
                expect(r.isError).toBeFalsy();
                expect(sc.recorded_days.caffeine_mg).toBe(0);
                expect(sc.averages.caffeine_mg).toBeNull();
                expect(Object.keys(sc.averages)).toContain("caffeine_mg");
            });
        });

        // Every day covered: the coverage note is for PARTIAL coverage only, so
        // naming caffeine here would be noise on the case of a daily coffee
        // drinker, which is the most common caffeine user there is.
        test("a fully-covered window stays silent about caffeine coverage", async () => {
            stage([95, 95, 95, 95, 95]);
            await withTools(null, async (call) => {
                const r = await summarize(call);
                const sc = r.structuredContent as unknown as SummaryPayload;
                expect(sc.recorded_days.caffeine_mg).toBe(5);
                expect(sc.averages.caffeine_mg).toBe(95);
                expect(textOf(r)).not.toContain("caffeine 5");
            });
        });
    });

    // ---------- the server is the clock (issue #102) ----------
    //
    // Several hosts (Claude Desktop among them) keep the wall clock out of the
    // model's context. With no clock the model either interrogated the user ("what
    // time is it?") on every single log, or guessed — and a guessed time lands on
    // the wrong local day for anyone far from UTC. The server always knows both the
    // instant and the user's zone, so it says so.
    //
    // These read the real clock, so they assert SHAPE and ZONE, never a pinned
    // value: the date is compared against dateInTz sampled around the call, which
    // is both zone-sensitive and immune to a midnight rollover mid-test.
    describe("current-time disclosure", () => {
        /** "Local time now: Sunday 2026-08-09 15:04:22 (Europe/Kyiv)." */
        const clockRe = (tz: string) =>
            new RegExp(
                `Local time now: ([A-Z][a-z]+day) (\\d{4}-\\d{2}-\\d{2}) (\\d{2}:\\d{2}:\\d{2}) \\(${tz}\\)\\.`,
            );
        const UTC_NOW_RE =
            /UTC now: (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\./;

        /** Assert the clock line names `tz`'s local day and weekday right now. */
        function expectClockIn(
            text: string,
            tz: string,
            sampled: string[],
        ): void {
            const m = text.match(clockRe(tz));
            expect(m).not.toBeNull();
            const utc = text.match(UTC_NOW_RE);
            expect(utc).not.toBeNull();
            const instant = utc![1]!;
            // The two halves are one instant rendered twice, so the zone is
            // genuinely applied and not merely printed in the label — this holds at
            // every hour, including the ones where tz and UTC share a date.
            expect(`${m![2]} ${m![3]}`).toBe(formatLocalDateTime(instant, tz));
            expect(m![1]).toBe(weekdayInTz(instant, tz));
            // ...and that instant is now, not a fixture.
            expect(sampled).toContain(dateInTz(instant, tz));
        }

        /** Local dates in `tz` before and after the call, to absorb a rollover. */
        async function around(
            tz: string,
            run: () => Promise<string>,
        ): Promise<{ text: string; sampled: string[] }> {
            const before = dateInTz(new Date(), tz);
            const text = await run();
            const after = dateInTz(new Date(), tz);
            return { text, sampled: [...new Set([before, after])] };
        }

        test("get_profile reports the zone AND the user's current wall clock", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            await withTools(null, async (call) => {
                const { text, sampled } = await around(
                    "Europe/Kyiv",
                    async () => textOf(await call("get_profile")),
                );
                expect(text).toContain("Timezone: Europe/Kyiv.");
                expectClockIn(text, "Europe/Kyiv", sampled);
            });
        });

        test("get_profile still gives a clock when no timezone is set", async () => {
            db.profile = null;
            await withTools(null, async (call) => {
                const { text, sampled } = await around("UTC", async () =>
                    textOf(await call("get_profile")),
                );
                expect(text).toContain(
                    "Timezone: not set (defaulting to UTC).",
                );
                expectClockIn(text, "UTC", sampled);
                // Knowing the time must not cost the caller the nudge to configure
                // a zone — UTC is a fallback, not the user's clock.
                expect(text).toContain("set_timezone");
                // …but it is the user's setting to choose, not a call to make.
                expect(text).not.toContain("Call set_");
                expect(text).toContain("The user can");
            });
        });

        // #99: a profile row created by some other set_* tool, with timezone still
        // null, must read the same as no profile at all.
        test("get_profile treats a profile with no timezone as unset", async () => {
            db.profile = { ...PROFILE_BASE, timezone: null };
            await withTools(null, async (call) => {
                const { text, sampled } = await around("UTC", async () =>
                    textOf(await call("get_profile")),
                );
                expect(text).toContain(
                    "Timezone: not set (defaulting to UTC).",
                );
                expectClockIn(text, "UTC", sampled);
                expect(text).toContain("set_timezone");
                expect(text).not.toContain("Call set_");
                expect(text).toContain("The user can");
            });
        });

        test("set_language rejects a code outside the supported set", async () => {
            await withTools(null, async (call) => {
                const r = await call("set_language", { locale: "xx" });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain("Unsupported language");
                expect(db.profilePatches).toHaveLength(0);
            });
        });

        test("set_language persists a supported locale", async () => {
            await withTools(null, async (call) => {
                const r = await call("set_language", { locale: "de" });
                expect(textOf(r)).toContain("Deutsch");
                expect(textOf(r)).toContain("de");
                expect(db.profilePatches).toContainEqual({ locale: "de" });
                expect(db.profile?.locale).toBe("de");
            });
        });

        test("get_profile defaults language to English when never set", async () => {
            db.profile = { ...PROFILE_BASE, locale: null };
            await withTools(null, async (call) => {
                const text = textOf(await call("get_profile"));
                expect(text).toContain(
                    "Language: not set (defaulting to English).",
                );
                expect(text).toContain("set_language");
                expect(text).not.toContain("Call set_");
                expect(text).toContain("The user can");
            });
        });

        // #99-shaped case, same as timezone: a profile row created by some other
        // set_* tool with locale still null must read the same as no profile at all.
        test("get_profile treats a profile with no locale as unset", async () => {
            db.profile = { ...PROFILE_BASE, locale: null, timezone: "UTC" };
            await withTools(null, async (call) => {
                const text = textOf(await call("get_profile"));
                expect(text).toContain(
                    "Language: not set (defaulting to English).",
                );
            });
        });

        test("get_profile reports a saved locale", async () => {
            db.profile = { ...PROFILE_BASE, locale: "fr" };
            await withTools(null, async (call) => {
                const text = textOf(await call("get_profile"));
                expect(text).toContain("Français");
                expect(text).toContain("fr");
            });
        });

        test("get_profile reports weight unit and widget display together", async () => {
            db.profile = {
                ...PROFILE_BASE,
                preferred_weight_unit: "lb",
                widgets_enabled: false,
            };
            await withTools(null, async (call) => {
                const text = textOf(await call("get_profile"));
                expect(text).toContain("Weight unit: lb.");
                expect(text).toContain("Widgets: disabled.");
            });
        });

        test("get_profile flags weight unit as unset and widgets as enabled by default", async () => {
            db.profile = null;
            await withTools(null, async (call) => {
                const text = textOf(await call("get_profile"));
                expect(text).toContain("Weight unit: not set.");
                expect(text).toContain("Widgets: enabled, opening collapsed.");
            });
        });

        test("get_profile reports a saved length unit", async () => {
            db.profile = { ...PROFILE_BASE, preferred_length_unit: "in" };
            await withTools(null, async (call) => {
                expect(textOf(await call("get_profile"))).toContain(
                    "Length unit: in.",
                );
            });
        });

        test("get_profile flags the length unit as unset without directing a call", async () => {
            db.profile = null;
            await withTools(null, async (call) => {
                const text = textOf(await call("get_profile"));
                expect(text).toContain("Length unit: not set.");
                expect(text).not.toContain("Call set_");
            });
        });

        test("get_profile reports Apple Health sync as not connected", async () => {
            await withTools(null, async (call) => {
                expect(textOf(await call("get_profile"))).toContain(
                    "Apple Health sync: not connected.",
                );
            });
        });

        test("get_profile reports a connected Apple Health sync in local time", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            db.healthSyncLink = {
                kind: "shortcut",
                fields: ["energy_kcal"],
                fallback_tz: "Europe/Kyiv",
                sync_start_date: "2026-09-26",
                created_at: "2026-09-26T22:30:00.000Z",
                last_used_at: "2026-10-02T05:10:00.000Z",
                last_sync_at: "2026-10-02T05:10:30.000Z",
                expires_at: "2026-12-31T05:10:00.000Z",
            };
            db.healthSyncSentThrough = "2026-10-01";
            await withTools(null, async (call) => {
                const text = textOf(await call("get_profile"));
                // 22:30Z on the 26th is already the 27th in Kyiv.
                expect(text).toContain(
                    "Apple Health sync: connected 2026-09-27, sent through 2026-10-01, last sync 2026-10-02 08:10.",
                );
            });
        });

        test("get_current_time answers in the profile's zone, and is measured", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Asia/Tokyo" };
            await withTools(null, async (call) => {
                const { text, sampled } = await around("Asia/Tokyo", async () =>
                    textOf(await call("get_current_time")),
                );
                expectClockIn(text, "Asia/Tokyo", sampled);
                expect(text).not.toContain("No timezone is set");
            });

            const rows = db.analyticsRows.filter(
                (r) => r.tool_name === "get_current_time",
            );
            expect(rows).toHaveLength(1);
            expect(rows[0]!.user_id).toBe("u1");
            expect(rows[0]!.success).toBe(true);
        });

        // Without this the UTC fallback reads as the user's real local time, and a
        // model would resolve "this morning" against a clock up to 14 hours off.
        test("get_current_time flags that an unset zone means UTC, not local", async () => {
            db.profile = null;
            await withTools(null, async (call) => {
                const { text, sampled } = await around("UTC", async () =>
                    textOf(await call("get_current_time")),
                );
                expectClockIn(text, "UTC", sampled);
                expect(text).toContain("No timezone is set for this account");
                expect(text).toContain("set_timezone");
            });
        });

        // #99: same as above, but via a profile row an unrelated set_* tool
        // created — this is the case that used to go quiet forever.
        test("get_current_time flags an unset zone even when the profile row exists", async () => {
            db.profile = { ...PROFILE_BASE, timezone: null };
            await withTools(null, async (call) => {
                const { text, sampled } = await around("UTC", async () =>
                    textOf(await call("get_current_time")),
                );
                expectClockIn(text, "UTC", sampled);
                expect(text).toContain("No timezone is set for this account");
                expect(text).toContain("set_timezone");
            });
        });

        // The shipped guidance is the actual fix: the three "log it now" tools used
        // to tell the model to ask the user for the time before calling them. Now
        // they tell it to omit the field and let the server stamp now.
        test("log_meal, log_water, log_weight and log_body_measurement tell the model to omit logged_at, not to ask", async () => {
            const server = new McpServer(
                { name: "t", version: "0.0.0" },
                { capabilities: { tools: {}, resources: {} } },
            );
            registerTools(server, "u1", true, null);
            const [ct, st] = InMemoryTransport.createLinkedPair();
            const client = new Client({ name: "c", version: "0.0.0" });
            await Promise.all([server.connect(st), client.connect(ct)]);
            try {
                const { tools } = await client.listTools();
                const propsOf = (name: string) =>
                    (
                        tools.find((t) => t.name === name)?.inputSchema as {
                            properties?: Record<
                                string,
                                { description?: string }
                            >;
                        }
                    )?.properties;
                for (const name of [
                    "log_meal",
                    "log_water",
                    "log_weight",
                    "log_body_measurement",
                ]) {
                    const desc = propsOf(name)?.logged_at?.description ?? "";
                    expect(desc).not.toBe("");
                    expect(desc).not.toContain(
                        "ask the user before calling this tool",
                    );
                    expect(desc).not.toMatch(
                        /\b(?:do not|don't) ask the user\b/i,
                    );
                    expect(desc).toContain("get_current_time");
                }
                // The three older tools still carry the inherited wording: the
                // server knows the time, so there is no need to ask (#102). They
                // move to the descriptive form under #198.
                for (const name of ["log_meal", "log_water", "log_weight"]) {
                    const desc = propsOf(name)?.logged_at?.description ?? "";
                    expect(desc).toContain("The server knows the current time");
                    expect(desc).toContain("no need to ask the user");
                    expect(desc).toContain("omit this field entirely");
                }
                // log_body_measurement, added after the directory review, only
                // describes what an omitted value means and what the key does.
                const body = propsOf("log_body_measurement");
                const bodyLoggedAt = body?.logged_at?.description ?? "";
                expect(bodyLoggedAt).toContain(
                    "Omitted, the server stamps the entry with the current time",
                );
                for (const text of [
                    bodyLoggedAt,
                    body?.idempotency_key?.description ?? "",
                ]) {
                    expect(text).not.toBe("");
                    expect(text).not.toMatch(
                        /\b(?:never|do not|don't|no need to|omit this|only supply|pass any|send the same)\b/i,
                    );
                }
                // ...and the tool that replaces the question is actually reachable.
                expect(tools.map((t) => t.name)).toContain("get_current_time");
            } finally {
                await client.close();
                await server.close();
            }
        });
    });

    // get_goal_progress's day detail (GOAL_DAY_META_KEY, built by buildGoalDayMeta
    // in src/goal-day.ts): unrecorded row nutrients, water entries and, on today
    // only, the user's own logged foods; the rows' times ride beside it under the
    // shared MEAL_TIMES_META_KEY. In _meta, never structuredContent (frozen), and
    // the template must spell every key it reads.
    describe("get_goal_progress carries the day detail in _meta", () => {
        const DAY = "2026-07-26";
        async function call(client: Client, args: Record<string, unknown>) {
            const r = (await client.callTool({
                name: "get_goal_progress",
                arguments: args,
            })) as unknown as ToolResult;
            expect(r.isError).toBeFalsy();
            expect(JSON.stringify(r.structuredContent)).not.toContain("foods");
            return r._meta?.[GOAL_DAY_META_KEY] as Record<string, unknown>;
        }

        describe.each(ERAS)("%p", (mode) => {
            test("a past day: times and gaps per row, water, no clock, no foods", async () => {
                db.meals = [
                    meal({ logged_at: `${DAY}T08:10:00Z`, fiber_g: null }),
                ];
                db.waterByDate = [
                    {
                        id: WATER_ID,
                        user_id: "u1",
                        amount_ml: 300,
                        logged_at: `${DAY}T07:50:00Z`,
                        notes: null,
                        created_at: `${DAY}T07:50:00Z`,
                        idempotency_key: null,
                    },
                ];
                db.mealRangeArgs = [];
                await withHttpClient("u1", mode, async (client) => {
                    const meta = await call(client, { date: DAY });
                    expect(meta).toEqual({
                        v: 1,
                        now: null,
                        meals: [{ missing: ["fiber_g"] }],
                        water: [{ time: "07:50", ml: 300 }],
                    });
                });
                await withHttpClient("u1", mode, async (client) => {
                    const r = (await client.callTool({
                        name: "get_goal_progress",
                        arguments: { date: DAY },
                    })) as unknown as ToolResult;
                    expect(r._meta?.[MEAL_TIMES_META_KEY]).toEqual({
                        v: 1,
                        times: ["08:10"],
                    });
                });
                // No history read for a past day.
                expect(db.mealRangeArgs).toEqual([]);
                db.waterByDate = [];
            });

            test("today: the clock and the user's own foods, alcohol never named", async () => {
                db.meals = [
                    meal({
                        description: "Chicken bowl",
                        protein_g: 46,
                        alcohol_g: 0,
                    }),
                    meal({
                        id: "00000000-0000-4000-8000-0000000000f2",
                        description: "Beer",
                        protein_g: 12,
                        alcohol_g: 14,
                    }),
                ];
                db.mealRangeArgs = [];
                await withHttpClient("u1", mode, async (client) => {
                    const meta = await call(client, {});
                    expect(meta.now).toMatch(/^\d\d:\d\d$/);
                    const foods = meta.foods as { name: string }[];
                    expect(foods.map((f) => f.name)).toEqual(["Chicken bowl"]);
                });
                expect(db.mealRangeArgs).toHaveLength(1);
            });

            test("a failed history read drops only the foods", async () => {
                db.meals = [meal()];
                db.mealItemsFailure = new Error("boom");
                const warn = spyOn(console, "warn").mockImplementation(
                    () => {},
                );
                try {
                    await withHttpClient("u1", mode, async (client) => {
                        const meta = await call(client, {});
                        expect(meta.now).not.toBeNull();
                        expect(meta.foods).toBeUndefined();
                        expect(meta.meals).toHaveLength(1);
                    });
                } finally {
                    warn.mockRestore();
                    db.mealItemsFailure = null;
                }
            });

            test("a failed history range read drops only the foods, not the items", async () => {
                db.meals = [meal({ description: "Chicken bowl" })];
                db.mealItems.set(MEAL_ID, [ingredient(1, "Chicken")]);
                db.failWith = new Error("range boom");
                const warn = spyOn(console, "warn").mockImplementation(
                    () => {},
                );
                try {
                    await withHttpClient("u1", mode, async (client) => {
                        const r = (await client.callTool({
                            name: "get_goal_progress",
                            arguments: {},
                        })) as unknown as ToolResult;
                        expect(r.isError).toBeFalsy();
                        const meta = r._meta?.[GOAL_DAY_META_KEY] as Record<
                            string,
                            unknown
                        >;
                        expect(meta.now).not.toBeNull();
                        expect(meta.foods).toBeUndefined();
                        expect(meta.meals).toHaveLength(1);
                        expect(Object.keys(r._meta ?? {})).toContain(
                            MEAL_ITEMS_META_KEY,
                        );
                    });
                    expect(
                        warn.mock.calls.some((c) =>
                            String(c[0]).includes(
                                "goal-day history read error",
                            ),
                        ),
                    ).toBe(true);
                } finally {
                    warn.mockRestore();
                    db.failWith = null;
                    db.mealItems = new Map();
                }
            });
        });

        test("the goal-progress widget reads every key it is sent", async () => {
            const html = await getWidgetHtml("goal-progress");
            for (const key of [
                GOAL_DAY_META_KEY,
                MEAL_TIMES_META_KEY,
                SODIUM_META_KEY,
                ADDED_SUGAR_META_KEY,
                SATURATED_FAT_META_KEY,
                MEAL_ITEMS_META_KEY,
                NUTRIENT_SOURCES_META_KEY,
            ]) {
                expect(html).toContain(JSON.stringify(key));
            }
        });
    });
}
