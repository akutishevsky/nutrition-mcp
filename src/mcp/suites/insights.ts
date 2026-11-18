import { Client } from "@modelcontextprotocol/client";
import {
    InMemoryTransport,
    type JsonSchemaType,
    McpServer,
} from "@modelcontextprotocol/server";
import { AjvJsonSchemaValidator } from "@modelcontextprotocol/server/validators/ajv";
import { describe, expect, spyOn, test } from "bun:test";
import { z } from "zod";
import { buildDailyBuckets } from "../../insights.js";
import {
    goalsPayloadOf,
    MAX_CAFFEINE_MG,
    PERIOD_AVERAGES_META_KEY,
    registerTools,
    trendsDayPayloadOf,
} from "../../mcp.js";
import { PERIOD_ROW_COUNTS } from "../../periods.js";
import type { Meal } from "../../supabase.js";
import { shiftLocalDate } from "../../tz.js";
import { DIGEST_META_KEY, getWidgetHtml } from "../../widgets.js";
import {
    type CallTool,
    db,
    ERAS,
    goals,
    historyRow,
    ingredient,
    meal,
    MEAL_ID,
    PROFILE_BASE,
    textOf,
    withHttpClient,
    withTools,
} from "../test-harness.js";

export function registerInsightSuites(): void {
    // #99: the pure startImportPayload/runImport functions above take
    // tzConfigured as an already-computed boolean, so they can't catch a bug in
    // HOW mcp.ts computes it. These drive the real tools to cover that
    // derivation: a profile row (created by some other set_* tool) with no
    // timezone must count as unconfigured, the same as no profile at all.
    describe("start_meal_import and bulk_import_meals treat a timezone-less profile as unconfigured", () => {
        test("start_meal_import reports tz_configured=false and warns", async () => {
            db.profile = { ...PROFILE_BASE, timezone: null };
            await withTools(null, async (call) => {
                const r = await call("start_meal_import");
                const sc = r.structuredContent as unknown as {
                    tz_configured: boolean;
                };
                expect(sc.tz_configured).toBe(false);
                expect(textOf(r)).toContain("this account has no timezone set");
            });
        });

        test("bulk_import_meals warns that the timezone is unset", async () => {
            db.profile = { ...PROFILE_BASE, timezone: null };
            await withTools(null, async (call) => {
                const r = await call("bulk_import_meals", {
                    meals: [
                        {
                            source_line: 2,
                            description: "Oatmeal",
                            meal_type: "breakfast",
                            logged_at: "2026-07-20 08:30:00",
                        },
                    ],
                    expected_row_count: 1,
                    dry_run: true,
                });
                const sc = r.structuredContent as unknown as {
                    warnings: string[];
                };
                expect(sc.warnings.join(" ")).toContain(
                    "Your timezone is not set",
                );
            });
        });
    });

    // IMPORT_ROW_SCHEMA is a plain z.object, so zod STRIPS any key it does not
    // declare — exactly the silent failure the source_id block below pins. Drop
    // caffeine_mg from that schema and src/import.ts's unit tests all still pass
    // while every imported milligram is discarded on the way in.
    describe("bulk_import_meals carries caffeine_mg through the row schema", () => {
        const call = (
            c: CallTool,
            meals: Record<string, unknown>[],
            extra: Record<string, unknown> = {},
        ) =>
            c("bulk_import_meals", {
                meals,
                expected_row_count: meals.length,
                dry_run: false,
                ...extra,
            });

        test("an imported milligram figure reaches insertMeal", async () => {
            await withTools(null, async (c) => {
                const r = await call(c, [
                    {
                        source_line: 2,
                        description: "Cold brew",
                        logged_at: "2026-07-20",
                        calories: 5,
                        caffeine_mg: 200,
                    },
                ]);
                expect(r.isError).toBeFalsy();
                expect(db.inserted[0]!.caffeine_mg).toBe(200);
            });
        });

        // Bounds live in validateRow, not in Zod: a schema-level rejection happens
        // before the handler runs and discards the structured report, the warnings
        // and the analytics row — for what will be the caller's most common
        // mistake (a grams column mapped straight across).
        test("an out-of-range figure is a per-row error, not a lost batch", async () => {
            await withTools(null, async (c) => {
                const r = await call(c, [
                    {
                        source_line: 2,
                        description: "Oatmeal",
                        logged_at: "2026-07-20",
                        calories: 300,
                    },
                    {
                        source_line: 3,
                        description: "Coffee",
                        logged_at: "2026-07-20",
                        caffeine_mg: MAX_CAFFEINE_MG + 1,
                    },
                ]);
                expect(r.isError).toBeFalsy();
                const sc = r.structuredContent as unknown as {
                    status: string;
                    summary: { created: number; failed: number };
                    results: {
                        source_line: number;
                        status: string;
                        error: { field: string; message: string } | null;
                    }[];
                };
                // The good row still landed and the bad one is named — the whole
                // point of validating in the handler rather than in Zod.
                expect(sc.status).toBe("partial_success");
                expect(sc.summary.created).toBe(1);
                expect(sc.summary.failed).toBe(1);
                const bad = sc.results.find((row) => row.source_line === 3)!;
                expect(bad.status).toBe("failed");
                expect(bad.error!.field).toBe("caffeine_mg");
                // Milligrams in the message — reporting a gram bound here would
                // send the caller off correcting the wrong thing.
                expect(bad.error!.message).toContain(`${MAX_CAFFEINE_MG} mg`);
                expect(bad.error!.message).not.toContain(" g;");
            });
        });
    });

    describe("bulk_import_meals surfaces hidden alcohol", () => {
        const oatmeal = {
            source_line: 1,
            description: "Oatmeal",
            logged_at: "2026-07-20",
            calories: 300,
        };
        const beer = {
            source_line: 2,
            description: "Beer",
            logged_at: "2026-07-20",
            calories: 140,
            alcohol_g: 13,
        };
        const call = (
            c: CallTool,
            meals: Record<string, unknown>[],
            extra: Record<string, unknown> = {},
        ) =>
            c("bulk_import_meals", {
                meals,
                expected_row_count: meals.length,
                dry_run: false,
                ...extra,
            });

        // A backfill is where this matters most: dozens of rows of alcohol can land
        // and, with the gate off, none of it appears anywhere afterwards.
        test("nudges once when an imported row carried alcohol", async () => {
            await withTools(null, async (c) => {
                const text = textOf(await call(c, [oatmeal, beer]));
                expect(text).toContain("Alcohol saved with these meals");
                expect(text).toContain("set_alcohol_tracking");
                expect(db.profilePatches).toHaveLength(0);
            });
        });

        test("stays quiet when no row carried alcohol", async () => {
            await withTools(null, async (c) => {
                const text = textOf(await call(c, [oatmeal]));
                expect(text).not.toContain("set_alcohol_tracking");
            });
        });

        test("stays quiet when the user already tracks alcohol", async () => {
            await withTools("us", async (c) => {
                const text = textOf(await call(c, [oatmeal, beer]));
                expect(text).not.toContain("set_alcohol_tracking");
            });
        });

        // The note reads args.meals by the result row's `index`, so it must follow
        // the ROW that landed, not just "some row in the batch had alcohol". A row
        // rejected by validateRow stored nothing to be told about — and an
        // off-by-one here would blame the wrong row's alcohol.
        test("a rejected alcohol row does not trigger it", async () => {
            await withTools(null, async (c) => {
                const text = textOf(
                    await call(c, [oatmeal, { ...beer, alcohol_g: 10_000 }]),
                );
                expect(text).not.toContain("set_alcohol_tracking");
            });
        });

        // "saved" would be a lie on a dry run — nothing was written yet.
        test("a dry run says it would be saved, not that it was", async () => {
            await withTools(null, async (c) => {
                const text = textOf(
                    await call(c, [oatmeal, beer], { dry_run: true }),
                );
                expect(text).toContain("would be saved");
                expect(text).not.toContain("Alcohol saved with these meals");
                expect(text).toContain("set_alcohol_tracking");
            });
        });
    });

    // ---------- restoring an export is a no-op, not a second copy ----------

    // Issue #69. The server-side dedup is unit-tested in import.test.ts; what this
    // pins is the wiring, and specifically the one link that fails SILENTLY:
    // IMPORT_ROW_SCHEMA is a plain z.object, so zod strips any key it does not
    // declare. Drop source_id from that schema and every test in import.test.ts
    // still passes while the fix stops working in production.
    describe("bulk_import_meals honours the id column of our own export", () => {
        const EXPORTED_ID = "aaaaaaaa-1111-4111-8111-000000000001";

        const call = (
            c: CallTool,
            meals: Record<string, unknown>[],
            extra: Record<string, unknown> = {},
        ) =>
            c("bulk_import_meals", {
                meals,
                expected_row_count: meals.length,
                dry_run: false,
                ...extra,
            });

        const exportedRow = {
            source_line: 2,
            source_id: EXPORTED_ID,
            description: "Oatmeal",
            // Wall-clock form, exactly as export.ts renders it.
            logged_at: "2026-07-20 08:30:00",
            meal_type: "breakfast",
            calories: 300,
        };

        test("a row naming an existing meal is deduplicated, not inserted", async () => {
            db.meals = [meal({ id: EXPORTED_ID })];
            await withTools(null, async (c) => {
                const r = await call(c, [exportedRow]);
                const sc = r.structuredContent as unknown as {
                    summary: { created: number; deduplicated: number };
                    results: { status: string; meal_id: string | null }[];
                };
                expect(sc.summary.created).toBe(0);
                expect(sc.summary.deduplicated).toBe(1);
                expect(sc.results[0]!.status).toBe("deduplicated");
                expect(sc.results[0]!.meal_id).toBe(EXPORTED_ID);
                expect(db.inserted).toHaveLength(0);
            });
        });

        test("a dry run says so up front", async () => {
            db.meals = [meal({ id: EXPORTED_ID })];
            await withTools(null, async (c) => {
                const r = await call(c, [exportedRow], { dry_run: true });
                const sc = r.structuredContent as unknown as {
                    summary: { would_create: number; deduplicated: number };
                };
                expect(sc.summary.would_create).toBe(0);
                expect(sc.summary.deduplicated).toBe(1);
            });
        });

        test("an id the user does not have imports normally", async () => {
            await withTools(null, async (c) => {
                const r = await call(c, [exportedRow]);
                const sc = r.structuredContent as unknown as {
                    summary: { created: number };
                };
                expect(sc.summary.created).toBe(1);
                expect(db.inserted).toHaveLength(1);
            });
        });
    });

    // ---------- get_digest ----------
    //
    // A new tool: its structuredContent is frozen from the first deploy (pinned in
    // output-schemas.frozen.json like every other), and everything the widget
    // draws rides in _meta under DIGEST_META_KEY.
    describe("get_digest", () => {
        test("pins its full annotation object (read-only, closed world)", async () => {
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
            const t = tools.find((x) => x.name === "get_digest")!;
            expect(t.title).toBe("Get Nutrition Digest");
            expect(t.annotations).toEqual({
                title: "Get Nutrition Digest",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            });
            expect(t._meta?.ui).toEqual({
                resourceUri: "ui://widget/digest.html",
            });
        });

        test.each(ERAS)(
            "validates against the frozen schema and carries the digest in _meta (%p)",
            async (mode) => {
                const today = new Date().toISOString().slice(0, 10);
                db.goals = goals();
                db.meals = [meal({ logged_at: `${today}T00:00:01.000Z` })];
                const frozen = (await Bun.file(
                    new URL(
                        "../../output-schemas.frozen.json",
                        import.meta.url,
                    ),
                ).json()) as Record<string, JsonSchemaType>;
                const validate = new AjvJsonSchemaValidator().getValidator(
                    frozen.get_digest!,
                );
                await withHttpClient("u1", mode, async (client) => {
                    await client.listTools();
                    for (const period of [
                        "yesterday",
                        "today",
                        "last_7_days",
                        "last_30_days",
                    ]) {
                        const r = await client.callTool({
                            name: "get_digest",
                            arguments: { period },
                        });
                        expect(r.isError, period).toBeFalsy();
                        const v = validate(r.structuredContent);
                        expect(v.errorMessage).toBeUndefined();
                        expect(
                            Object.keys(r.structuredContent ?? {}).sort(),
                        ).toEqual([
                            "averages",
                            "days_in_range",
                            "end_date",
                            "goals",
                            "locale",
                            "logged_days",
                            "period",
                            "start_date",
                        ]);
                        const meta = (r._meta ?? {})[DIGEST_META_KEY] as {
                            v: number;
                            period: string;
                        };
                        expect(meta.v).toBe(1);
                        expect(meta.period).toBe(period);
                    }
                });
            },
        );

        test("defaults to yesterday, and the text is a factual summary", async () => {
            await withTools(null, async (call) => {
                const r = await call("get_digest", {});
                expect(r.isError).toBeFalsy();
                expect(r.structuredContent?.period).toBe("yesterday");
                expect(r.content[0]!.text).toContain("Nutrition digest for");
            });
        });

        test("alcohol stays out of the payload with tracking off", async () => {
            db.goals = goals();
            db.meals = [meal()];
            await withTools(null, async (call) => {
                const r = await call("get_digest", { period: "last_30_days" });
                const sc = r.structuredContent as {
                    averages: Record<string, unknown>;
                    goals: Record<string, unknown>;
                };
                expect(sc.averages.alcohol_g).toBeNull();
                expect(sc.goals.alcohol_g).toBeNull();
                const meta = r._meta![DIGEST_META_KEY] as {
                    metrics: { key: string }[];
                    drink_unit: unknown;
                };
                expect(meta.drink_unit).toBeNull();
                expect(meta.metrics.map((m) => m.key)).not.toContain(
                    "alcohol_g",
                );
            });
        });

        test("a failed meal-items read drops the items, never the digest", async () => {
            // No profile: the day is UTC, so yesterday's noon is yesterday.
            const yesterday = new Date(Date.now() - 86_400_000)
                .toISOString()
                .slice(0, 10);
            db.goals = goals();
            db.meals = [meal({ logged_at: `${yesterday}T12:00:00.000Z` })];
            db.mealItems.set(MEAL_ID, [ingredient(1, "Fusilli")]);
            type DigestMeals = {
                meals: { items: { name: string }[] | null }[];
            };
            await withTools(null, async (call) => {
                const ok = await call("get_digest", { period: "yesterday" });
                const okMeta = ok._meta![DIGEST_META_KEY] as DigestMeals;
                expect(okMeta.meals[0]!.items!.map((i) => i.name)).toEqual([
                    "Fusilli",
                ]);
            });
            db.mealItemsFailure = new Error("connection reset");
            const warn = spyOn(console, "warn").mockImplementation(() => {});
            try {
                // withTools lists tools first, so the client checks this
                // structuredContent against the advertised strict schema.
                await withTools(null, async (call) => {
                    const r = await call("get_digest", { period: "yesterday" });
                    expect(r.isError).toBeFalsy();
                    expect(r.structuredContent?.logged_days).toBe(1);
                    const meta = r._meta![DIGEST_META_KEY] as DigestMeals;
                    expect(meta.meals).toHaveLength(1);
                    expect(meta.meals[0]!.items).toBeNull();
                });
                expect(
                    warn.mock.calls.some((c) =>
                        String(c[0]).startsWith(
                            "[widget] digest meal-items read error ref=",
                        ),
                    ),
                ).toBe(true);
            } finally {
                warn.mockRestore();
            }
        });

        test("an unknown period is refused by the schema", async () => {
            await withTools(null, async (call) => {
                const r = await call("get_digest", { period: "last_year" });
                expect(r.isError).toBe(true);
            });
        });

        // The widget cannot import the key, so it carries the literal.
        test("the digest widget reads _meta under DIGEST_META_KEY", async () => {
            const html = await getWidgetHtml("digest");
            expect(html).toContain(JSON.stringify(DIGEST_META_KEY));
        });

        test.each(ERAS)(
            "ui://widget/digest.html reads as the assembled mcp-app document (%p)",
            async (mode) => {
                const assembled = await getWidgetHtml("digest");
                await withHttpClient("u1", mode, async (client) => {
                    const res = await client.readResource({
                        uri: "ui://widget/digest.html",
                    });
                    const c = res.contents[0] as {
                        mimeType?: string;
                        text?: string;
                    };
                    expect(c.mimeType).toBe("text/html;profile=mcp-app");
                    expect(c.text).toBe(assembled);
                });
            },
        );
    });

    // ---------- get_trends group_by: per-period averages in _meta ----------

    const PERIOD_TARGETS = z
        .strictObject({
            calories: z.number().nullable(),
            protein: z.number().nullable(),
            carbs: z.number().nullable(),
            fat: z.number().nullable(),
        })
        .nullable();

    const PERIOD_ROW = z.strictObject({
        key: z.string(),
        start: z.iso.date(),
        end: z.iso.date(),
        days: z.number().int(),
        partial: z.boolean(),
        logged_days: z.number().int(),
        avg: z
            .strictObject({
                calories: z.number(),
                protein: z.number(),
                carbs: z.number(),
                fat: z.number(),
            })
            .nullable(),
        targets: PERIOD_TARGETS,
        targets_changed: z.boolean(),
        targets_assumed: z.boolean(),
        on_target_days: z.number().int().nullable(),
        incomplete_days: z.number().int().nullable(),
    });

    const PERIOD_META = z.strictObject({
        v: z.literal(1),
        end_date: z.iso.date(),
        group_by: z.enum(["week", "month", "quarter", "year"]),
        targets_from: z.iso.date().nullable(),
        periods: z.strictObject({
            week: z.array(PERIOD_ROW),
            month: z.array(PERIOD_ROW),
            quarter: z.array(PERIOD_ROW),
            year: z.array(PERIOD_ROW),
        }),
    });

    describe("get_trends group_by", () => {
        const END = "2026-07-31";
        // One meal in late December 2025 (the first logged day, so every period
        // before it is dropped), nothing from January to June (kept: the gap is
        // the information), then most of July with varied totals.
        const JULY_GAPS = new Set([5, 6, 12]);
        const julyMeals = (): Meal[] => {
            const out: Meal[] = [];
            for (let d = 1; d <= 20; d++) {
                if (JULY_GAPS.has(d)) continue;
                const date = `2026-07-${String(d).padStart(2, "0")}`;
                out.push(
                    meal({
                        id: `jul-${d}-a`,
                        logged_at: `${date}T08:00:00.000Z`,
                        calories: 600 + 13 * d,
                        protein_g: 30 + d,
                        carbs_g: 70.5,
                        fat_g: 20 + d / 3,
                    }),
                );
                if (d % 3 === 0) {
                    out.push(
                        meal({
                            id: `jul-${d}-b`,
                            logged_at: `${date}T19:00:00.000Z`,
                            calories: 1100,
                            protein_g: 60,
                            carbs_g: 120,
                            fat_g: 41,
                        }),
                    );
                }
            }
            return out;
        };
        const FIXTURE = (): Meal[] => [
            meal({
                id: "dec",
                logged_at: "2025-12-30T12:00:00.000Z",
                calories: 1800,
            }),
            ...julyMeals(),
        ];
        // Goals recorded from July 10 (so July 1–9 assume them), raised on
        // July 20 — a change inside July.
        const HISTORY = [
            historyRow("2026-07-10T09:00:00.000Z", {
                daily_calories: 2000,
                daily_protein_g: 120,
                daily_carbs_g: 220,
                daily_fat_g: 70,
            }),
            historyRow("2026-07-20T18:00:00.000Z", {
                daily_calories: 2200,
                daily_protein_g: 140,
                daily_carbs_g: 240,
                daily_fat_g: 70,
            }),
        ];

        test.each(ERAS)(
            "structuredContent validates against the frozen schema and the periods ride in _meta (%p)",
            async (mode) => {
                db.meals = FIXTURE();
                db.goals = goals();
                db.goalsHistory = HISTORY;
                const frozen = (await Bun.file(
                    new URL(
                        "../../output-schemas.frozen.json",
                        import.meta.url,
                    ),
                ).json()) as Record<string, JsonSchemaType>;
                const validate = new AjvJsonSchemaValidator().getValidator(
                    frozen.get_trends!,
                );
                await withHttpClient("u1", mode, async (client) => {
                    await client.listTools();
                    const r = await client.callTool({
                        name: "get_trends",
                        arguments: { end_date: END, group_by: "month" },
                    });
                    expect(r.isError).toBeFalsy();
                    const result = validate(r.structuredContent);
                    expect(result.errorMessage).toBeUndefined();
                    expect(result.valid).toBe(true);
                    const meta = PERIOD_META.parse(
                        r._meta?.[PERIOD_AVERAGES_META_KEY],
                    );
                    expect(meta.end_date).toBe(END);
                    expect(meta.group_by).toBe("month");
                    // The widget's "targets before {date} not recorded" date:
                    // the first history row's local day.
                    expect(meta.targets_from).toBe("2026-07-10");
                    // Dec 2025 … Jul 2026, newest first: leading empty months
                    // dropped, the empty months inside the history kept.
                    expect(meta.periods.month.map((p) => p.key)).toEqual([
                        "2026-07",
                        "2026-06",
                        "2026-05",
                        "2026-04",
                        "2026-03",
                        "2026-02",
                        "2026-01",
                        "2025-12",
                    ]);
                    const feb = meta.periods.month.find(
                        (p) => p.key === "2026-02",
                    )!;
                    expect(feb).toMatchObject({
                        days: 28,
                        logged_days: 0,
                        avg: null,
                    });
                    expect(meta.periods.year.map((p) => p.key)).toEqual([
                        "2026",
                        "2025",
                    ]);
                    // Nothing in _meta leaked into the frozen payload.
                    expect(Object.keys(r.structuredContent ?? {})).toEqual([
                        "end_date",
                        "default_range",
                        "drink_unit",
                        "locale",
                        "goals",
                        "days",
                    ]);
                });
            },
        );

        test("without group_by: no _meta key, no history read, and today's read window and structuredContent", async () => {
            db.meals = FIXTURE();
            db.goals = goals();
            db.goalsHistory = HISTORY;
            await withTools(null, async (call) => {
                const plain = await call("get_trends", { end_date: END });
                expect(plain.isError).toBeFalsy();
                expect(plain._meta?.[PERIOD_AVERAGES_META_KEY]).toBeUndefined();
                expect(db.goalsHistoryReads).toBe(0);
                expect(db.mealRangeArgs).toEqual([["2026-07-02", END]]);
                // The pre-group_by payload, rebuilt from the same helpers the
                // handler always used: same keys, same order, same values.
                const start = shiftLocalDate(END, -29);
                const expected = {
                    end_date: END,
                    default_range: 30,
                    drink_unit: null,
                    locale: "en",
                    goals: goalsPayloadOf(db.goals, null),
                    days: buildDailyBuckets(
                        db.meals,
                        [],
                        start,
                        END,
                        "UTC",
                    ).map((b) => trendsDayPayloadOf(b, null)),
                };
                expect(JSON.stringify(plain.structuredContent)).toBe(
                    JSON.stringify(expected),
                );
                expect(textOf(plain)).not.toContain("per logged day");

                // group_by leaves structuredContent alone and only appends text.
                const grouped = await call("get_trends", {
                    end_date: END,
                    group_by: "month",
                });
                expect(JSON.stringify(grouped.structuredContent)).toBe(
                    JSON.stringify(expected),
                );
                expect(textOf(grouped).startsWith(textOf(plain))).toBe(true);
                expect(db.goalsHistoryReads).toBe(1);
                // One meal read, widened to the 5-year span.
                expect(db.mealRangeArgs).toEqual([
                    ["2026-07-02", END],
                    ["2022-01-01", END],
                ]);
            });
        });

        test("days still sets the structured window when group_by is set", async () => {
            db.meals = FIXTURE();
            await withTools(null, async (call) => {
                const plain = await call("get_trends", {
                    end_date: END,
                    days: 7,
                });
                const grouped = await call("get_trends", {
                    end_date: END,
                    days: 7,
                    group_by: "week",
                });
                expect(JSON.stringify(grouped.structuredContent)).toBe(
                    JSON.stringify(plain.structuredContent),
                );
                expect(
                    (grouped.structuredContent as { default_range: number })
                        .default_range,
                ).toBe(7);
            });
        });

        test("the text lists the requested granularity per logged day, with the goal notes", async () => {
            db.meals = FIXTURE();
            db.goalsHistory = HISTORY;
            await withTools(null, async (call) => {
                const month = textOf(
                    await call("get_trends", {
                        end_date: END,
                        group_by: "month",
                    }),
                );
                expect(month).toContain(
                    "Averages per logged day (days with no meals are excluded), vs the targets in effect at the time.",
                );
                const july = month
                    .split("\n")
                    .find((l) => l.startsWith("Jul 2026 · "));
                expect(july).toBeDefined();
                expect(july).toContain("17/31 days logged");
                expect(july).toContain("(target 2,200)");
                expect(july).toContain("targets changed mid-period");
                expect(july).toContain(
                    "targets before 2026-07-10 not recorded",
                );
                expect(month).toContain("Feb 2026 · 0/28 days logged");
                // Newest first.
                expect(month.indexOf("Jul 2026")).toBeLessThan(
                    month.indexOf("Dec 2025"),
                );

                const week = textOf(
                    await call("get_trends", {
                        end_date: END,
                        group_by: "week",
                    }),
                );
                expect(week).toContain("Jul 27 – Aug 2, 2026 (partial)");
                expect(week).not.toContain("Jul 2026 ·");
            });
        });

        test("meals before the 5-year span keep its empty early periods as inner gaps", async () => {
            db.meals = FIXTURE();
            const years = async () => {
                let rows: { key: string; logged_days: number }[] = [];
                await withTools(null, async (call) => {
                    const r = await call("get_trends", {
                        end_date: END,
                        group_by: "year",
                    });
                    rows = PERIOD_META.parse(
                        r._meta?.[PERIOD_AVERAGES_META_KEY],
                    ).periods.year;
                });
                return rows;
            };
            const cut = await years();
            expect(cut.map((r) => r.key)).not.toContain("2022");
            expect(db.mealsBeforeArgs).toEqual(["2022-01-01"]);

            db.mealsBefore = true;
            const kept = await years();
            expect(kept.map((r) => r.key)).toEqual([
                "2026",
                "2025",
                "2024",
                "2023",
                "2022",
            ]);
            expect(kept.at(-1)?.logged_days).toBe(0);
        });

        test("no goals history: averages only, no targets anywhere", async () => {
            db.meals = FIXTURE();
            db.goals = goals();
            await withTools(null, async (call) => {
                const r = await call("get_trends", {
                    end_date: END,
                    group_by: "quarter",
                });
                expect(r.isError).toBeFalsy();
                const meta = PERIOD_META.parse(
                    r._meta?.[PERIOD_AVERAGES_META_KEY],
                );
                for (const g of ["week", "month", "quarter", "year"] as const) {
                    for (const row of meta.periods[g]) {
                        expect(row.targets).toBeNull();
                        expect(row.on_target_days).toBeNull();
                        expect(row.incomplete_days).toBeNull();
                    }
                }
                expect(textOf(r)).toContain("No nutrition targets are set.");
                expect(textOf(r)).not.toContain("(target");
            });
        });

        test("nothing logged in the span still validates and returns empty periods", async () => {
            await withTools(null, async (call) => {
                const r = await call("get_trends", {
                    end_date: END,
                    group_by: "year",
                });
                expect(r.isError).toBeFalsy();
                const meta = PERIOD_META.parse(
                    r._meta?.[PERIOD_AVERAGES_META_KEY],
                );
                expect(meta.targets_from).toBeNull();
                expect(meta.periods).toEqual({
                    week: [],
                    month: [],
                    quarter: [],
                    year: [],
                });
                expect(textOf(r)).toContain(
                    `no meals logged in the last ${PERIOD_ROW_COUNTS.year} years`,
                );
            });
        });

        test("an unknown granularity is refused before the database", async () => {
            await withTools(null, async (call) => {
                const r = await call("get_trends", {
                    end_date: END,
                    group_by: "day",
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain("group_by");
                expect(db.mealRangeArgs).toEqual([]);
            });
        });

        test("logged days add up across granularities", async () => {
            db.meals = FIXTURE();
            db.goalsHistory = HISTORY;
            await withTools(null, async (call) => {
                const r = await call("get_trends", {
                    end_date: END,
                    group_by: "year",
                });
                const meta = PERIOD_META.parse(
                    r._meta?.[PERIOD_AVERAGES_META_KEY],
                );
                const logged = (g: "month" | "quarter" | "year") =>
                    meta.periods[g].reduce((n, p) => n + p.logged_days, 0);
                // All 18 logged days sit inside every span but the 26 weeks'.
                expect(logged("year")).toBe(18);
                expect(logged("quarter")).toBe(18);
                expect(logged("month")).toBe(18);
                const q3 = meta.periods.quarter.find(
                    (p) => p.key === "2026-Q3",
                )!;
                const julyToSep = meta.periods.month.filter((p) =>
                    ["2026-07", "2026-08", "2026-09"].includes(p.key),
                );
                expect(julyToSep.reduce((n, p) => n + p.logged_days, 0)).toBe(
                    q3.logged_days,
                );
            });
        });

        // The acceptance cross-check: for a month inside get_nutrition_summary's
        // 92-day cap, the month's per-logged-day averages are the summary's
        // logged-day averages over the same dates. No water-only day here: the
        // summary counts one as logged, a period row deliberately does not.
        test("a month's per-logged-day averages equal get_nutrition_summary's over the same dates", async () => {
            db.meals = julyMeals();
            db.goalsHistory = HISTORY;
            await withTools(null, async (call) => {
                const summary = (
                    await call("get_nutrition_summary", {
                        start_date: "2026-07-01",
                        end_date: END,
                    })
                ).structuredContent as {
                    logged_days: number;
                    averages: {
                        calories: number;
                        protein_g: number;
                        carbs_g: number;
                        fat_g: number;
                    };
                };
                const r = await call("get_trends", {
                    end_date: END,
                    group_by: "month",
                });
                const july = PERIOD_META.parse(
                    r._meta?.[PERIOD_AVERAGES_META_KEY],
                ).periods.month[0]!;
                expect(july.key).toBe("2026-07");
                expect(july.partial).toBe(false);
                expect(july.logged_days).toBe(summary.logged_days);
                const r1 = (n: number) => Math.round(n * 10) / 10;
                expect(Math.round(july.avg!.calories)).toBe(
                    summary.averages.calories,
                );
                expect(r1(july.avg!.protein)).toBe(summary.averages.protein_g);
                expect(r1(july.avg!.carbs)).toBe(summary.averages.carbs_g);
                expect(r1(july.avg!.fat)).toBe(summary.averages.fat_g);
            });
        });

        // The widget cannot import the key, so it carries the literal; a rename
        // on the server would otherwise pass every server test while every host
        // silently stayed on the 7/14/30-day view.
        test("the trends widget reads _meta under PERIOD_AVERAGES_META_KEY", async () => {
            expect(PERIOD_AVERAGES_META_KEY).toBe(
                "nutrition-mcp.com/period-averages",
            );
            const html = await getWidgetHtml("trends");
            expect(html).toContain(JSON.stringify(PERIOD_AVERAGES_META_KEY));
        });
    });
}
