import { Client } from "@modelcontextprotocol/client";
import {
    InMemoryTransport,
    type JsonSchemaType,
    McpServer,
} from "@modelcontextprotocol/server";
import { AjvJsonSchemaValidator } from "@modelcontextprotocol/server/validators/ajv";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { z } from "zod";
import { registerTools, WEIGHT_SERIES_META_KEY } from "../../mcp.js";
import type { WeightEntry } from "../../supabase.js";
import * as actualSupabase from "../../supabase.js";
import { shiftLocalDate, todayInTz } from "../../tz.js";
import { rateForDisplay } from "../../weight-trend.js";
import {
    ACTIVITY_META_KEY,
    BODY_MEASUREMENTS_META_KEY,
    getWidgetHtml,
    WEIGHT_ENTRIES_META_KEY,
} from "../../widgets.js";
import {
    ACTIVE_ID,
    db,
    ERAS,
    goals,
    historyRow,
    meal,
    MEASUREMENT_ID,
    measurementRow,
    OTHER_ACTIVE_ID,
    PROFILE_BASE,
    textOf,
    WEIGHT_ID,
    withHttpClient,
    withTools,
} from "../test-harness.js";

export function registerMetricSuites(): void {
    // ---------- body measurements ----------
    //
    // Five tools over body_measurement_log. What is pinned here is the handler
    // logic: the unit rule (explicit, then the saved length unit, then refuse —
    // never the weight unit), the per-site plausibility check, the kind filter and
    // default window of the read, display in the preferred unit, and the update
    // path that re-reads a stored number in a corrected unit. The SQL side is in
    // supabase.test.ts / supabase-window.test.ts.
    describe("body measurements", () => {
        const rowsFor = (tool: string) =>
            db.analyticsRows.filter((r) => r.tool_name === tool);

        test("an explicit unit is stored as entered, plus its millimetres", async () => {
            await withTools(null, async (call) => {
                const r = await call("log_body_measurement", {
                    kind: "hips",
                    value: 40,
                    unit: "in",
                });
                expect(r.isError).toBeFalsy();
                const text = textOf(r);
                expect(text).toContain("Body measurement logged: Hips 40 in");
                expect(text).toContain(`ID: ${MEASUREMENT_ID}`);
            });
            expect(db.measurementInserted).toHaveLength(1);
            expect(db.measurementInserted[0]).toMatchObject({
                kind: "hips",
                value_mm: 1016,
                value_entered: 40,
                entered_unit: "in",
            });
        });

        test("a saved length unit fills in a missing unit", async () => {
            db.profile = { ...PROFILE_BASE, preferred_length_unit: "cm" };
            await withTools(null, async (call) => {
                const r = await call("log_body_measurement", {
                    kind: "waist",
                    value: 84.5,
                });
                expect(r.isError).toBeFalsy();
                expect(textOf(r)).toContain("Waist 84.5 cm");
            });
            expect(db.measurementInserted[0]).toMatchObject({
                value_mm: 845,
                entered_unit: "cm",
            });
        });

        test("no unit and no saved length unit is refused", async () => {
            await withTools(null, async (call) => {
                const r = await call("log_body_measurement", {
                    kind: "waist",
                    value: 84.5,
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain("No length unit given");
                expect(textOf(r)).toContain("set_length_unit");
            });
            expect(db.measurementInserted).toHaveLength(0);
            expect(rowsFor("log_body_measurement")[0]!.error_category).toBe(
                "missing_required_param",
            );
        });

        test("the weight unit is never used as a length unit", async () => {
            db.profile = { ...PROFILE_BASE, preferred_weight_unit: "lb" };
            await withTools(null, async (call) => {
                const r = await call("log_body_measurement", {
                    kind: "waist",
                    value: 33,
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain("No length unit given");
            });
            expect(db.measurementInserted).toHaveLength(0);
        });

        test("an implausible value is refused, with the other unit only when it fits", async () => {
            await withTools(null, async (call) => {
                const mm = await call("log_body_measurement", {
                    kind: "waist",
                    value: 845,
                    unit: "cm",
                });
                expect(mm.isError).toBe(true);
                expect(textOf(mm)).toContain("is outside the plausible range");

                const swapped = await call("log_body_measurement", {
                    kind: "calf",
                    value: 10,
                    unit: "cm",
                });
                expect(swapped.isError).toBe(true);
                expect(textOf(swapped)).toContain(
                    "As 10 in it would be in range",
                );
                // No hint when the number fits neither unit.
                expect(textOf(mm)).not.toContain(" As ");
            });
            expect(db.measurementInserted).toHaveLength(0);
            expect(rowsFor("log_body_measurement")[0]!.error_category).toBe(
                "invalid_numeric_value",
            );
        });

        test("the kind filter reaches the reader and only that site is listed", async () => {
            db.measurements = [
                measurementRow({ kind: "waist" }),
                measurementRow({
                    id: "00000000-0000-4000-8000-000000000005",
                    kind: "neck",
                    value_mm: 380,
                    value_entered: 38,
                }),
            ];
            await withTools(null, async (call) => {
                const text = textOf(
                    await call("get_body_measurements", {
                        kind: "neck",
                        start_date: "2026-08-01",
                        end_date: "2026-08-31",
                    }),
                );
                expect(text).toContain("- Neck 38 cm");
                expect(text).not.toContain("Waist");
            });
            expect(db.measurementRangeArgs[0]!.kind).toBe("neck");
        });

        test("the default window is the 30 days ending today in the user's zone", async () => {
            const tz = "Pacific/Auckland";
            db.profile = { ...PROFILE_BASE, timezone: tz };
            db.measurements = [measurementRow()];
            await withTools(null, async (call) => {
                const r = await call("get_body_measurements", {});
                expect(textOf(r)).toContain(`Times are local (${tz})`);
                await call("get_body_measurements", {
                    start_date: "2026-01-01",
                });
                await call("get_body_measurements", { end_date: "2026-03-31" });
            });
            const today = todayInTz(tz);
            expect(db.measurementRangeArgs[0]).toEqual({
                s: shiftLocalDate(today, -29),
                e: today,
                tz,
                kind: undefined,
            });
            expect(db.measurementRangeArgs[1]!.s).toBe("2026-01-01");
            expect(db.measurementRangeArgs[1]!.e).toBe(today);
            expect(db.measurementRangeArgs[2]!.s).toBe("2026-03-02");
            expect(db.measurementRangeArgs[2]!.e).toBe("2026-03-31");
            expect(
                rowsFor("get_body_measurements")[0]!.date_range_days,
            ).toBeUndefined();
        });

        test("a saved length unit converts the display; without one each row keeps its own", async () => {
            db.measurements = [measurementRow()];
            const range = { start_date: "2026-08-01", end_date: "2026-08-31" };
            await withTools(null, async (call) => {
                expect(
                    textOf(await call("get_body_measurements", range)),
                ).toContain("- Waist 84.5 cm");
                db.profile = { ...PROFILE_BASE, preferred_length_unit: "in" };
                expect(
                    textOf(await call("get_body_measurements", range)),
                ).toContain("- Waist 33.3 in");
            });
        });

        test("a new value is read in the entry's own unit, not the preference", async () => {
            db.profile = { ...PROFILE_BASE, preferred_length_unit: "cm" };
            db.measurements = [
                measurementRow({
                    value_mm: 813,
                    value_entered: 32,
                    entered_unit: "in",
                }),
            ];
            await withTools(null, async (call) => {
                const r = await call("update_body_measurement", {
                    id: MEASUREMENT_ID,
                    value: 33,
                });
                expect(r.isError).toBeFalsy();
                expect(textOf(r)).toContain("Waist 33 in");
            });
            expect(db.measurementUpdates[0]).toMatchObject({
                value_mm: 838,
                value_entered: 33,
                entered_unit: "in",
            });
        });

        test("a unit alone re-reads the stored number in that unit", async () => {
            db.measurements = [
                measurementRow({
                    kind: "neck",
                    value_mm: 320,
                    value_entered: 32,
                    entered_unit: "cm",
                }),
            ];
            await withTools(null, async (call) => {
                const r = await call("update_body_measurement", {
                    id: MEASUREMENT_ID,
                    unit: "in",
                });
                expect(r.isError).toBeFalsy();
                expect(textOf(r)).toContain("Neck 32 in");
            });
            expect(db.measurementUpdates[0]).toMatchObject({
                value_mm: 813,
                value_entered: 32,
                entered_unit: "in",
            });
        });

        test("update_body_measurement takes no kind", async () => {
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
            try {
                const { tools } = await client.listTools();
                const update = tools.find(
                    (t) => t.name === "update_body_measurement",
                )!;
                expect(
                    Object.keys(update.inputSchema.properties ?? {}),
                ).not.toContain("kind");
                expect(
                    tools.find((t) => t.name === "log_body_measurement")!
                        .inputSchema.properties,
                ).toHaveProperty("kind");
            } finally {
                await client.close();
                await server.close();
            }
        });

        test("an update with nothing to change is refused before any write", async () => {
            db.measurements = [measurementRow()];
            await withTools(null, async (call) => {
                const r = await call("update_body_measurement", {
                    id: MEASUREMENT_ID,
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain("Nothing to change");
            });
            expect(db.measurementUpdates).toHaveLength(0);
            expect(rowsFor("update_body_measurement")[0]!.error_category).toBe(
                "missing_required_param",
            );
        });

        test("updating the value of a missing row is record_not_found", async () => {
            await withTools(null, async (call) => {
                const r = await call("update_body_measurement", {
                    id: MEASUREMENT_ID,
                    value: 80,
                });
                expect(r.isError).toBe(true);
                expect(
                    textOf(r).startsWith("No body measurement found with id"),
                ).toBe(true);
            });
            expect(db.measurementUpdates).toHaveLength(0);
            expect(rowsFor("update_body_measurement")[0]!.error_category).toBe(
                "record_not_found",
            );
        });

        test("set_length_unit saves, clears and refuses an unknown unit", async () => {
            await withTools(null, async (call) => {
                const set = await call("set_length_unit", { unit: "in" });
                expect(textOf(set)).toContain("set to in");
                expect(db.profilePatches[0]).toEqual({
                    preferred_length_unit: "in",
                });

                const cleared = await call("set_length_unit", { unit: null });
                expect(textOf(cleared)).toContain("cleared");
                expect(db.profilePatches[1]).toEqual({
                    preferred_length_unit: null,
                });

                const bad = await call("set_length_unit", { unit: "mm" });
                expect(bad.isError).toBe(true);
            });
            expect(db.profilePatches).toHaveLength(2);
        });

        test("a long listing stops on a whole day and names where to continue", async () => {
            const notes = "n".repeat(1000);
            db.measurements = Array.from({ length: 50 }, (_, i) => {
                const date = shiftLocalDate("2026-01-01", i);
                return measurementRow({
                    id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
                    logged_at: `${date}T08:00:00.000Z`,
                    notes,
                });
            });
            await withTools(null, async (call) => {
                const text = textOf(
                    await call("get_body_measurements", {
                        start_date: "2026-01-01",
                        end_date: "2026-02-28",
                        kind: "waist",
                    }),
                );
                const m = text.match(
                    /\(Listing stops after (\d{4}-\d{2}-\d{2}) to keep the response short; get_body_measurements with start_date (\d{4}-\d{2}-\d{2}), end_date 2026-02-28 and kind waist returns the rest\.\)$/,
                );
                expect(m).not.toBeNull();
                expect(m![2]).toBe(shiftLocalDate(m![1]!, 1));
                // The notice is the only thing past the budget, and the last day
                // listed is complete.
                const body = text.slice(0, text.lastIndexOf("\n\n(Listing"));
                expect(body.length).toBeLessThanOrEqual(40_000);
                expect(body).toContain(`## ${m![1]}`);
                expect(body).not.toContain(`## ${m![2]}`);
            });
        });

        test("notes reach the data layer as sent", async () => {
            await withTools(null, async (call) => {
                await call("log_body_measurement", {
                    kind: "upper_arm",
                    value: 34,
                    unit: "cm",
                    notes: "left\\nside",
                });
            });
            expect(db.measurementInserted[0]!.notes).toBe("left\\nside");
        });

        test("a deduplicated log is rendered from the stored row", async () => {
            db.dedupe = true;
            await withTools(null, async (call) => {
                const text = textOf(
                    await call("log_body_measurement", {
                        kind: "waist",
                        value: 84.5,
                        unit: "cm",
                        logged_at: "2026-08-07T08:00:00Z",
                    }),
                );
                expect(text.startsWith("Already logged")).toBe(true);
                expect(text).toContain("Waist 84.5 cm");
                expect(text).toContain(`ID: ${MEASUREMENT_ID}`);
            });
        });
    });

    // ---------- get_weight_trends: trend weight and long-range series ----------

    /** A stored weigh-in at an exact instant. */
    function weighIn(logged_at: string, weight_g: number): WeightEntry {
        return {
            id: WEIGHT_ID,
            user_id: "u1",
            weight_g,
            logged_at,
            notes: null,
            created_at: logged_at,
            idempotency_key: null,
        };
    }

    /** One 08:00 UTC weigh-in a day for `days` days from `from`, losing
     *  `lossPerDay` grams a day from `startG`. */
    function dailyWeighIns(
        from: string,
        days: number,
        startG: number,
        lossPerDay = 0,
    ): WeightEntry[] {
        return Array.from({ length: days }, (_, i) =>
            weighIn(
                `${shiftLocalDate(from, i)}T08:00:00.000Z`,
                startG - lossPerDay * i,
            ),
        );
    }

    /** The `_meta[WEIGHT_SERIES_META_KEY]` contract the widget reads (v1). Strict,
     *  so a stray field fails here before it surprises the template. */
    const POINT = { weight: z.number(), trend: z.number() };

    const WEIGHT_SERIES = z.strictObject({
        v: z.literal(1),
        unit: z.string(),
        daily: z.array(z.strictObject({ date: z.iso.date(), ...POINT })),
        daily_year: z.array(z.strictObject({ date: z.iso.date(), ...POINT })),
        weekly: z.array(z.strictObject({ start: z.iso.date(), ...POINT })),
        monthly: z.array(
            z.strictObject({
                month: z.string().regex(/^\d{4}-\d{2}$/),
                ...POINT,
            }),
        ),
        first: z
            .strictObject({ date: z.iso.date(), weight: z.number() })
            .nullable(),
        trend_latest: z.number().nullable(),
        trend_date: z.iso.date().nullable(),
        weekly_rate: z.number().nullable(),
    });

    describe("get_weight_trends", () => {
        // Kyiv is UTC+3 in summer, so the day bucketing is visibly local: the
        // 21:30Z weigh-in on May 31 is June 1 there, the 20:00Z one is not.
        const FIXTURE = [
            weighIn("2024-02-10T08:00:00.000Z", 92_000), // history only
            weighIn("2026-05-31T20:00:00.000Z", 85_000), // May 31 local: warm-up
            weighIn("2026-05-31T21:30:00.000Z", 80_000), // June 1 local
            weighIn("2026-06-01T06:00:00.000Z", 81_000), // June 1 local
            weighIn("2026-06-15T08:00:00.000Z", 79_940),
            weighIn("2026-06-29T22:30:00.000Z", 79_000), // June 30 local
            weighIn("2026-07-01T08:00:00.000Z", 70_000), // after end_date
        ];

        // The 30-day structuredContent the pre-trend handler produced for this
        // fixture, written out by hand: same keys, same order, same values. It
        // is frozen, so the full-history read must not change one byte of it.
        const EXPECTED_STRUCTURED = {
            end_date: "2026-06-30",
            unit: "kg",
            target: null,
            default_range: 30,
            locale: "en",
            days: [
                { date: "2026-06-01", weight: 80.5 },
                { date: "2026-06-15", weight: 79.9 },
                { date: "2026-06-30", weight: 79 },
            ],
        };

        test.each(ERAS)(
            "structuredContent validates against the frozen schema and the series rides in _meta (%p)",
            async (mode) => {
                db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
                db.weights = FIXTURE;
                const frozen = (await Bun.file(
                    new URL(
                        "../../output-schemas.frozen.json",
                        import.meta.url,
                    ),
                ).json()) as Record<string, JsonSchemaType>;
                const validate = new AjvJsonSchemaValidator().getValidator(
                    frozen.get_weight_trends!,
                );
                await withHttpClient("u1", mode, async (client) => {
                    await client.listTools();
                    const r = await client.callTool({
                        name: "get_weight_trends",
                        arguments: { end_date: "2026-06-30" },
                    });
                    expect(r.isError).toBeFalsy();
                    const result = validate(r.structuredContent);
                    expect(result.errorMessage).toBeUndefined();
                    expect(result.valid).toBe(true);
                    const meta = WEIGHT_SERIES.parse(
                        r._meta?.[WEIGHT_SERIES_META_KEY],
                    );
                    expect(meta.unit).toBe("kg");
                    expect(meta.first).toEqual({
                        date: "2024-02-10",
                        weight: 92,
                    });
                    expect(meta.trend_date).toBe("2026-06-30");
                    // Nothing in _meta leaked into the frozen payload.
                    expect(Object.keys(r.structuredContent ?? {})).toEqual(
                        Object.keys(EXPECTED_STRUCTURED),
                    );
                });
            },
        );

        test("structuredContent.days is byte for byte the pre-trend 30-day payload", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            db.weights = FIXTURE;
            await withTools(null, async (call) => {
                const r = await call("get_weight_trends", {
                    end_date: "2026-06-30",
                });
                expect(r.isError).toBeFalsy();
                expect(JSON.stringify(r.structuredContent)).toBe(
                    JSON.stringify(EXPECTED_STRUCTURED),
                );
            });
        });

        test("one full-history read; warm-up and history days stay out of structuredContent", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            db.weights = FIXTURE;
            await withTools(null, async (call) => {
                const r = await call("get_weight_trends", {
                    end_date: "2026-06-30",
                });
                expect(db.weightReads).toEqual(["all"]);
                const days = (
                    r.structuredContent as { days: { date: string }[] }
                ).days.map((d) => d.date);
                expect(days).not.toContain("2026-05-31");
                expect(days).not.toContain("2024-02-10");
                expect(days).not.toContain("2026-07-01");
                const meta = WEIGHT_SERIES.parse(
                    r._meta?.[WEIGHT_SERIES_META_KEY],
                );
                // The warm-up day was read and fed the trend: it is in the
                // 90-day series, and the trend on June 1 is pulled toward 85 kg
                // rather than seeded at 80.5.
                expect(meta.daily.map((d) => d.date)).toEqual([
                    "2026-05-31",
                    "2026-06-01",
                    "2026-06-15",
                    "2026-06-30",
                ]);
                expect(meta.daily[1]!.trend).toBeGreaterThan(80.5);
                // Weigh-ins after end_date never reach any series.
                expect(meta.monthly.map((m) => m.month)).toEqual([
                    "2024-02",
                    "2026-05",
                    "2026-06",
                ]);
                // The text names the history the window does not show.
                expect(textOf(r)).toContain(
                    `Since first weigh-in (2024-02-10, 92 kg): `,
                );
                expect(textOf(r)).toContain(
                    `trend now ${meta.trend_latest} kg.`,
                );
            });
        });

        test("a 3-year user gets a monthly series of every month, and the text rate equals the chip's", async () => {
            // 2023-07-01 … 2026-06-30: 1096 daily weigh-ins over 36 months.
            db.weights = dailyWeighIns("2023-07-01", 1096, 100_000, 20);
            await withTools(null, async (call) => {
                const r = await call("get_weight_trends", {
                    end_date: "2026-06-30",
                });
                expect(r.isError).toBeFalsy();
                const meta = WEIGHT_SERIES.parse(
                    r._meta?.[WEIGHT_SERIES_META_KEY],
                );
                expect(meta.monthly).toHaveLength(36);
                expect(meta.monthly[0]!.month).toBe("2023-07");
                expect(meta.monthly.at(-1)!.month).toBe("2026-06");
                expect(meta.weekly).toHaveLength(53);
                expect(meta.daily).toHaveLength(90);
                expect(meta.first).toEqual({ date: "2023-07-01", weight: 100 });
                // 20 g a day is 0.14 kg a week: 2 decimals in _meta, and the
                // 1 decimal both the text and the chip show.
                expect(meta.weekly_rate).toBe(-0.14);
                expect(rateForDisplay(meta.weekly_rate!)).toBe(-0.1);
                // Exact glyphs: a real minus (U+2212) and one decimal, the same
                // rule as the widget chip's signed().
                expect(textOf(r)).toContain(
                    `Trend weight: ${meta.trend_latest} kg (−0.1 kg/week over the last 2 weeks)`,
                );
                expect(textOf(r)).not.toMatch(/\(-\d/);
                // structuredContent still holds only the last 30 days.
                expect(
                    (r.structuredContent as { days: unknown[] }).days,
                ).toHaveLength(30);
            });
        });

        test("default_range maps days to the widget's ranges", async () => {
            db.weights = dailyWeighIns("2026-06-01", 30, 80_000);
            const cases: [number, number][] = [
                [7, 7],
                [14, 14],
                [30, 30],
                [90, 90],
                [365, 365],
                [2, 30],
                [45, 30],
            ];
            await withTools(null, async (call) => {
                for (const [days, expected] of cases) {
                    const r = await call("get_weight_trends", {
                        days,
                        end_date: "2026-06-30",
                    });
                    expect(
                        (r.structuredContent as { default_range: number })
                            .default_range,
                        `days=${days}`,
                    ).toBe(expected);
                }
            });
        });

        test("the text names the 30-day span of the structured series when the window differs", async () => {
            db.weights = dailyWeighIns("2026-03-01", 122, 80_000);
            const note =
                "The structured daily series covers the last 30 days only";
            await withTools(null, async (call) => {
                const r93 = await call("get_weight_trends", {
                    days: 93,
                    end_date: "2026-06-30",
                });
                expect(textOf(r93)).toContain(
                    `${note} (2026-06-01 to 2026-06-30); the figures above cover the requested 93-day window.`,
                );
                const r7 = await call("get_weight_trends", {
                    days: 7,
                    end_date: "2026-06-30",
                });
                expect(textOf(r7)).toContain(note);
                const r30 = await call("get_weight_trends", {
                    end_date: "2026-06-30",
                });
                expect(textOf(r30)).not.toContain(note);
            });
        });

        test("no weigh-ins at all still returns the frozen payload and an empty series", async () => {
            await withTools(null, async (call) => {
                const r = await call("get_weight_trends", {
                    end_date: "2026-06-30",
                });
                expect(r.isError).toBeFalsy();
                expect(r.structuredContent).toMatchObject({ days: [] });
                expect(
                    WEIGHT_SERIES.parse(r._meta?.[WEIGHT_SERIES_META_KEY]),
                ).toMatchObject({
                    daily: [],
                    weekly: [],
                    monthly: [],
                    first: null,
                    trend_latest: null,
                    weekly_rate: null,
                });
            });
        });

        test("the per-reading list and the measurements ride in _meta, local and in display units", async () => {
            db.profile = {
                ...PROFILE_BASE,
                timezone: "Europe/Kyiv",
                preferred_length_unit: null,
            };
            db.weights = [
                weighIn("2026-06-29T22:30:00.000Z", 79_000), // June 30, 01:30 local
                {
                    ...weighIn("2026-06-30T17:05:00.000Z", 79_400),
                    notes: "Evening",
                },
                weighIn("2025-01-10T08:00:00.000Z", 90_000), // before the 365-day window
            ];
            db.measurements = [
                measurementRow({
                    kind: "waist",
                    value_mm: 845,
                    value_entered: 84.5,
                    entered_unit: "cm",
                    logged_at: "2026-06-20T08:00:00.000Z",
                }),
                // Entered in inches: shown back as typed, not round-tripped.
                measurementRow({
                    kind: "waist",
                    value_mm: 838,
                    value_entered: 33,
                    entered_unit: "in",
                    logged_at: "2026-06-28T08:00:00.000Z",
                }),
                measurementRow({
                    kind: "neck",
                    value_mm: 390,
                    value_entered: 39,
                    entered_unit: "cm",
                    logged_at: "2026-06-25T08:00:00.000Z",
                }),
            ];
            await withTools(null, async (call) => {
                const r = await call("get_weight_trends", {
                    end_date: "2026-06-30",
                });
                expect(r.isError).toBeFalsy();
                const entries = r._meta?.[WEIGHT_ENTRIES_META_KEY] as {
                    v: number;
                    to: string;
                    truncated: boolean;
                    entries: {
                        date: string;
                        time: string;
                        weight: number;
                        note: string | null;
                    }[];
                };
                expect(entries.v).toBe(1);
                expect(entries.to).toBe("2026-06-30");
                expect(entries.truncated).toBe(false);
                expect(entries.entries).toEqual([
                    {
                        date: "2026-06-30",
                        time: "01:30",
                        weight: 79,
                        note: null,
                    },
                    {
                        date: "2026-06-30",
                        time: "20:05",
                        weight: 79.4,
                        note: "Evening",
                    },
                ]);
                const meas = r._meta?.[BODY_MEASUREMENTS_META_KEY] as {
                    sites: Record<
                        string,
                        {
                            unit: string;
                            entries: { date: string; value: number }[];
                        }
                    >;
                };
                // No saved length unit: each site in the unit of its latest entry.
                expect(meas.sites.waist).toEqual({
                    unit: "in",
                    entries: [
                        { date: "2026-06-20", value: 33.3 },
                        { date: "2026-06-28", value: 33 },
                    ],
                });
                expect(meas.sites.neck!.unit).toBe("cm");
                expect(Object.keys(meas.sites)).toEqual(["waist", "neck"]);
            });
        });

        test("a failed measurements read drops that key, never the tool", async () => {
            db.weights = dailyWeighIns("2026-06-01", 30, 80_000);
            const orig = console.warn;
            const warned: string[] = [];
            console.warn = (...a: unknown[]) => void warned.push(a.join(" "));
            const realMeasurements = db.measurements;
            Object.defineProperty(db, "measurements", {
                configurable: true,
                get() {
                    throw new Error("boom: user u1");
                },
            });
            try {
                await withTools(null, async (call) => {
                    const r = await call("get_weight_trends", {
                        end_date: "2026-06-30",
                    });
                    expect(r.isError).toBeFalsy();
                    expect(
                        r._meta?.[BODY_MEASUREMENTS_META_KEY],
                    ).toBeUndefined();
                    expect(r._meta?.[WEIGHT_ENTRIES_META_KEY]).toBeDefined();
                });
            } finally {
                Object.defineProperty(db, "measurements", {
                    configurable: true,
                    writable: true,
                    value: realMeasurements,
                });
                console.warn = orig;
            }
            // Logged without the error text (it could carry user data).
            expect(warned.join("\n")).not.toContain("u1");
        });

        test("the weight-trends widget repeats the entries and measurements keys", async () => {
            expect(WEIGHT_ENTRIES_META_KEY).toBe(
                "nutrition-mcp.com/weight-entries",
            );
            expect(BODY_MEASUREMENTS_META_KEY).toBe(
                "nutrition-mcp.com/body-measurements",
            );
            const html = await getWidgetHtml("weight-trends");
            expect(html).toContain(JSON.stringify(WEIGHT_ENTRIES_META_KEY));
            expect(html).toContain(JSON.stringify(BODY_MEASUREMENTS_META_KEY));
        });

        // The widget cannot import the key, so it carries the literal; a rename
        // on the server would otherwise pass every server test while every host
        // silently fell back to the raw 7/14/30-day chart.
        test("the weight-trends widget reads _meta under WEIGHT_SERIES_META_KEY", async () => {
            expect(WEIGHT_SERIES_META_KEY).toBe(
                "nutrition-mcp.com/weight-series",
            );
            const html = await getWidgetHtml("weight-trends");
            expect(html).toContain(JSON.stringify(WEIGHT_SERIES_META_KEY));
        });
    });

    // ---------- active calories (issue #220) ----------

    describe("active calories tools", () => {
        const ACTIVE_ENTRY = (
            over: Partial<actualSupabase.ActiveCaloriesEntry> = {},
        ): actualSupabase.ActiveCaloriesEntry => ({
            id: ACTIVE_ID,
            user_id: "u1",
            kcal: 400,
            credit_pct: 80,
            logged_at: "2026-01-15T19:05:00.000Z",
            notes: null,
            created_at: "2026-01-15T19:05:00.000Z",
            idempotency_key: null,
            ...over,
        });

        test("log_active_calories snapshots the profile's credit share onto the row", async () => {
            db.profile = { ...PROFILE_BASE, activity_credit_pct: 80 };
            db.activeEntries = [ACTIVE_ENTRY()];
            await withTools(null, async (call) => {
                const r = await call("log_active_calories", { kcal: 400 });
                expect(r.isError).toBeFalsy();
                expect(db.activeInserted[0]!.kcal).toBe(400);
                expect(db.activeInserted[0]!.credit_pct).toBe(80);
                const text = textOf(r);
                expect(text).toContain("400 kcal burned");
                expect(text).toContain(
                    "320 kcal of it counts against intake at 80%",
                );
                expect(text).toContain("The calorie goal is unchanged.");
                expect(text).not.toMatch(/earned/i);
            });
        });

        test("log_active_calories counts 100% when the share was never set", async () => {
            db.profile = { ...PROFILE_BASE };
            await withTools(null, async (call) => {
                await call("log_active_calories", { kcal: 250 });
                expect(db.activeInserted[0]!.credit_pct).toBe(100);
            });
        });

        test("log_active_calories refuses an out-of-range kcal before any write", async () => {
            await withTools(null, async (call) => {
                for (const kcal of [0, -5, 10_001, 1.5]) {
                    const r = await call("log_active_calories", { kcal });
                    expect(r.isError, String(kcal)).toBe(true);
                }
                expect(db.activeInserted).toHaveLength(0);
            });
        });

        test("log_active_calories resolves logged_at in the profile timezone like log_water", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            await withTools(null, async (call) => {
                await call("log_active_calories", {
                    kcal: 300,
                    logged_at: "2026-01-15T21:05",
                });
                expect(db.activeInserted[0]!.logged_at).toBe(
                    "2026-01-15T19:05:00.000Z",
                );
            });
        });

        test("get_active_calories lists local times, the share and the day totals", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            db.activeEntries = [
                ACTIVE_ENTRY({
                    kcal: 300,
                    credit_pct: 50,
                    logged_at: "2026-01-15T19:05:00.000Z",
                    notes: "evening run",
                }),
            ];
            await withTools(null, async (call) => {
                const text = textOf(
                    await call("get_active_calories", { date: "2026-01-15" }),
                );
                expect(text).toContain("Times are local (Europe/Kyiv)");
                expect(text).toContain(
                    "- 21:05 · 300 kcal · 50% counted (evening run)",
                );
                expect(text).toContain(`[id: ${ACTIVE_ID}]`);
                expect(text).toContain(
                    "300 kcal burned, 150 kcal counted against intake",
                );
            });
        });

        test("an Apple Health day total stands for its day; manual entries are listed, not added", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            db.activeEntries = [
                ACTIVE_ENTRY({
                    id: "11111111-1111-4111-8111-111111111111",
                    kcal: 300,
                    credit_pct: 100,
                    logged_at: "2026-01-15T07:00:00.000Z",
                    notes: "run",
                }),
                ACTIVE_ENTRY({
                    kcal: 520,
                    credit_pct: 100,
                    logged_at: "2026-01-15T10:00:00.000Z",
                    source: "apple_health",
                    source_date: "2026-01-15",
                }),
            ];
            await withTools(null, async (call) => {
                const text = textOf(
                    await call("get_active_calories", { date: "2026-01-15" }),
                );
                expect(text).toContain(
                    "2026-01-15: 520 kcal burned, 520 kcal counted against intake",
                );
                expect(text).toContain(
                    `- Apple Health day total · 520 kcal · 100% counted [id: ${ACTIVE_ID}]`,
                );
                expect(text).toContain(
                    "- 09:00 · 300 kcal · 100% counted (run) · not added: the Apple Health total includes it",
                );

                const logged = textOf(
                    await call("log_active_calories", {
                        kcal: 300,
                        logged_at: "2026-01-15T09:00",
                    }),
                );
                expect(logged).toContain(
                    "2026-01-15 has an Apple Health day total (520 kcal), which already includes the day's workouts, so this entry is kept but not added to the day's total.",
                );
                expect(logged).toContain("Day 2026-01-15: 520 kcal burned");
            });
        });

        test("get_active_calories says so when nothing is logged", async () => {
            await withTools(null, async (call) => {
                const r = await call("get_active_calories", {
                    date: "2026-01-15",
                });
                expect(textOf(r)).toContain(
                    "No active calories logged on 2026-01-15.",
                );
            });
        });

        test("get_active_calories refuses a range over 31 days and a half range", async () => {
            await withTools(null, async (call) => {
                const long = await call("get_active_calories", {
                    start_date: "2026-01-01",
                    end_date: "2026-03-01",
                });
                expect(long.isError).toBe(true);
                expect(textOf(long)).toContain("Date range too long");
                const half = await call("get_active_calories", {
                    start_date: "2026-01-01",
                });
                expect(half.isError).toBe(true);
            });
        });

        test("delete_active_calories reports deleted, then not found", async () => {
            db.rowIds.add(ACTIVE_ID);
            await withTools(null, async (call) => {
                expect(
                    textOf(
                        await call("delete_active_calories", { id: ACTIVE_ID }),
                    ),
                ).toBe(`Active calories entry ${ACTIVE_ID} deleted.`);
                expect(
                    textOf(
                        await call("delete_active_calories", { id: ACTIVE_ID }),
                    ),
                ).toContain("No active calories entry found");
            });
        });

        test("delete_active_calories answers a non-uuid id before the database", async () => {
            await withTools(null, async (call) => {
                const r = await call("delete_active_calories", { id: "nope" });
                expect(textOf(r)).toContain("ids are UUIDs");
                expect(db.deleteCalls).toBe(0);
            });
        });

        test("set_activity_credit writes the share, null resets it, out of range is refused", async () => {
            await withTools(null, async (call) => {
                const set = await call("set_activity_credit", { percent: 80 });
                expect(db.profilePatches.at(-1)!.activity_credit_pct).toBe(80);
                expect(textOf(set)).toContain("Activity credit set to 80%");
                expect(textOf(set)).toContain("entries logged before keep");

                const reset = await call("set_activity_credit", {
                    percent: null,
                });
                expect(
                    db.profilePatches.at(-1)!.activity_credit_pct,
                ).toBeNull();
                expect(textOf(reset)).toContain("reset to the default of 100%");

                const before = db.profilePatches.length;
                const bad = await call("set_activity_credit", { percent: 101 });
                expect(bad.isError).toBe(true);
                expect(db.profilePatches.length).toBe(before);
            });
        });

        test("get_profile reports the activity credit share in one line", async () => {
            db.profile = { ...PROFILE_BASE, activity_credit_pct: 60 };
            await withTools(null, async (call) => {
                const text = textOf(await call("get_profile"));
                expect(text).toContain(
                    "Active calories: 60% counts against intake",
                );
            });
            db.profile = { ...PROFILE_BASE };
            await withTools(null, async (call) => {
                const text = textOf(await call("get_profile"));
                expect(text).toContain(
                    "Active calories: 100% counts against intake",
                );
                expect(text).toContain("the default; never set");
            });
        });
    });

    // ---------- active calories on the read tools ----------
    // get_nutrition_summary, get_goal_progress and get_trends read the period's
    // activity rows and say so beside intake. With no rows, nothing changes: no
    // line, no _meta key. Dates are fixed past days, so "today" is only ever
    // computed from the clock where a test needs it.
    describe("active calories on the read tools", () => {
        const DAY = "2026-07-26";
        const ACTIVE_ROW = (
            over: Partial<actualSupabase.ActiveCaloriesEntry> = {},
        ): actualSupabase.ActiveCaloriesEntry => ({
            id: ACTIVE_ID,
            user_id: "u1",
            kcal: 400,
            credit_pct: 80,
            logged_at: `${DAY}T19:00:00.000Z`,
            notes: null,
            created_at: `${DAY}T19:00:00.000Z`,
            idempotency_key: null,
            ...over,
        });

        beforeEach(() => {
            db.activeEntries = [];
            db.goalsHistory = [];
            db.profile = { ...PROFILE_BASE };
        });
        afterEach(() => {
            db.activeEntries = [];
            db.goalsHistory = [];
        });

        test("with no activity, the read tools add no line and no _meta key", async () => {
            db.meals = [meal({ calories: 2100 })];
            db.goals = goals({ daily_calories: 2000 });
            await withTools(null, async (call) => {
                const summary = await call("get_nutrition_summary", {
                    start_date: DAY,
                    end_date: DAY,
                });
                const range = await call("get_nutrition_summary", {
                    start_date: "2026-07-25",
                    end_date: "2026-07-27",
                });
                const progress = await call("get_goal_progress", { date: DAY });
                const trends = await call("get_trends", {
                    days: 7,
                    end_date: DAY,
                });
                for (const r of [summary, range, progress, trends]) {
                    expect(r.isError).toBeFalsy();
                    expect(textOf(r)).not.toContain("Active calories");
                    expect(r._meta ?? {}).not.toHaveProperty(ACTIVITY_META_KEY);
                }
            });
        });

        test("a single day's summary line sits beside intake and the goal, with _meta days", async () => {
            db.meals = [meal({ calories: 2100 })];
            db.goals = goals({ daily_calories: 2000 });
            db.activeEntries = [ACTIVE_ROW()];
            await withTools(null, async (call) => {
                const r = await call("get_nutrition_summary", {
                    start_date: DAY,
                    end_date: DAY,
                });
                expect(textOf(r)).toContain(
                    "Active calories: burned 400 kcal, credited 320 (80%). Net intake 1,780 kcal (220 under the 2,000 goal).",
                );
                expect(r._meta?.[ACTIVITY_META_KEY]).toEqual({
                    v: 1,
                    days: [{ date: DAY, burned_kcal: 400, credited_kcal: 320 }],
                });
            });
        });

        test("a day with activity and no meals keeps its section and says there is no net intake", async () => {
            db.meals = [];
            db.water = [];
            db.goals = goals({ daily_calories: 2000 });
            db.activeEntries = [ACTIVE_ROW()];
            await withTools(null, async (call) => {
                const r = await call("get_nutrition_summary", {
                    start_date: DAY,
                    end_date: DAY,
                });
                const text = textOf(r);
                // Activity alone is not a logged day: the day keeps its text
                // section and activity line, but structuredContent is what it was
                // before active calories existed (no logged day, no day entry).
                expect(text).toContain(
                    `No meals or water logged between ${DAY} and ${DAY}.`,
                );
                expect(text).toContain(`## ${DAY} (0 meals)`);
                expect(text).toContain(
                    "Active calories: burned 400 kcal, credited 320 (80%). No meals logged, so there is no net intake to report.",
                );
                const sc = r.structuredContent as {
                    logged_days: number;
                    days: { date: string; meal_count: number }[];
                };
                expect(sc.logged_days).toBe(0);
                expect(sc.days).toEqual([]);
            });
        });

        test("an activity-only day is not a logged day: logged_days and the averages count the meal day alone", async () => {
            db.meals = [
                meal({ logged_at: "2026-07-25T12:00:00.000Z", calories: 2100 }),
            ];
            db.goals = goals({ daily_calories: 2000 });
            db.activeEntries = [ACTIVE_ROW()];
            await withTools(null, async (call) => {
                const r = await call("get_nutrition_summary", {
                    start_date: "2026-07-25",
                    end_date: DAY,
                });
                expect(r.isError).toBeFalsy();
                const sc = r.structuredContent as {
                    logged_days: number;
                    days_in_range: number;
                    days: { date: string }[];
                    averages: { calories: number };
                };
                expect(sc.logged_days).toBe(1);
                expect(sc.days_in_range).toBe(2);
                expect(sc.days.map((d) => d.date)).toEqual(["2026-07-25"]);
                // One logged day, so the average is that day's 2,100 kcal, not
                // 1,050 over the two calendar days.
                expect(sc.averages.calories).toBe(2100);
                const text = textOf(r);
                expect(text).toContain(`## ${DAY} (0 meals)`);
                expect(text).toContain(
                    "Active calories: burned 400 kcal, credited 320 (80%). No meals logged, so there is no net intake to report.",
                );
                expect(text).toContain(
                    "(Daily averages are per logged day — 1 of the 2 days in range.",
                );
                expect(r._meta?.[ACTIVITY_META_KEY]).toEqual({
                    v: 1,
                    days: [{ date: DAY, burned_kcal: 400, credited_kcal: 320 }],
                });
            });
        });

        // Activity is a text and _meta addition only. Every read tool's
        // structuredContent must be exactly what it is with no activity rows at
        // all, for an activity-only day and for a range holding one.
        test("activity leaves structuredContent unchanged on every read tool", async () => {
            db.meals = [
                meal({ logged_at: "2026-07-25T12:00:00.000Z", calories: 2100 }),
            ];
            db.goals = goals({ daily_calories: 2000 });
            const calls: Array<[string, Record<string, unknown>]> = [
                [
                    "get_nutrition_summary",
                    { start_date: "2026-07-25", end_date: DAY },
                ],
                ["get_nutrition_summary", { start_date: DAY, end_date: DAY }],
                ["get_goal_progress", { date: DAY }],
                ["get_goal_progress", { date: "2026-07-25" }],
                ["get_trends", { days: 7, end_date: DAY }],
            ];
            await withTools(null, async (call) => {
                for (const [name, args] of calls) {
                    db.activeEntries = [ACTIVE_ROW()];
                    const withActivity = await call(name, args);
                    db.activeEntries = [];
                    const without = await call(name, args);
                    expect(withActivity.isError).toBeFalsy();
                    expect(without.isError).toBeFalsy();
                    expect(withActivity.structuredContent).toEqual(
                        without.structuredContent,
                    );
                }
            });
            db.activeEntries = [];
        });

        test("a range's summary adds the window totals and a daily average over the range", async () => {
            db.meals = [meal({ calories: 2100 })];
            db.goals = goals({ daily_calories: 2000 });
            db.activeEntries = [
                ACTIVE_ROW(),
                ACTIVE_ROW({
                    id: OTHER_ACTIVE_ID,
                    kcal: 200,
                    credit_pct: 100,
                    logged_at: "2026-07-27T18:00:00.000Z",
                }),
            ];
            await withTools(null, async (call) => {
                const r = await call("get_nutrition_summary", {
                    start_date: "2026-07-25",
                    end_date: "2026-07-27",
                });
                expect(textOf(r)).toContain(
                    "Active calories: burned 600 kcal, credited 520 (87%) over 2 days with activity. Daily average over the 3 days in range: burned 200 kcal, credited 173 kcal.",
                );
                // The per-day lines stay per day: the range line is additional.
                expect(textOf(r)).toContain(
                    "Net intake 1,780 kcal (220 under the 2,000 goal).",
                );
            });
        });

        test("a later set_activity_credit does not rewrite a stored row's share", async () => {
            // The profile now says 50%, but the row was written at 80%: the read
            // path must use the row's snapshot and never the profile.
            db.profile = { ...PROFILE_BASE, activity_credit_pct: 50 };
            db.meals = [meal({ calories: 2100 })];
            db.goals = goals({ daily_calories: 2000 });
            db.activeEntries = [ACTIVE_ROW({ credit_pct: 80 })];
            await withTools(null, async (call) => {
                const r = await call("get_nutrition_summary", {
                    start_date: DAY,
                    end_date: DAY,
                });
                expect(textOf(r)).toContain("credited 320 (80%)");
                expect(textOf(r)).not.toContain("(50%)");
                expect(r._meta?.[ACTIVITY_META_KEY]).toEqual({
                    v: 1,
                    days: [{ date: DAY, burned_kcal: 400, credited_kcal: 320 }],
                });
            });
        });

        test("a single past day is judged against the goal in effect that day", async () => {
            // The history changes the calorie goal on 2026-07-20; the current row
            // is the later value. A day before the change keeps the older goal.
            db.goals = goals({ daily_calories: 2200 });
            db.goalsHistory = [
                historyRow("2026-07-01T10:00:00.000Z", {
                    daily_calories: 1800,
                }),
                historyRow("2026-07-20T10:00:00.000Z", {
                    daily_calories: 2200,
                }),
            ];
            db.meals = [meal({ calories: 1700 })];
            db.activeEntries = [ACTIVE_ROW()];
            await withTools(null, async (call) => {
                const before = await call("get_nutrition_summary", {
                    start_date: "2026-07-15",
                    end_date: "2026-07-15",
                });
                expect(
                    (
                        before.structuredContent as {
                            goals: { calories: number };
                        }
                    ).goals.calories,
                ).toBe(1800);
                const after = await call("get_nutrition_summary", {
                    start_date: DAY,
                    end_date: DAY,
                });
                expect(
                    (
                        after.structuredContent as {
                            goals: { calories: number };
                        }
                    ).goals.calories,
                ).toBe(2200);
                expect(textOf(after)).toContain("(820 under the 2,200 goal)");
                const progress = await call("get_goal_progress", { date: DAY });
                expect(
                    (
                        progress.structuredContent as {
                            goals: { calories: number };
                        }
                    ).goals.calories,
                ).toBe(2200);
                expect(textOf(progress)).toContain(
                    "Net intake 1,380 kcal (820 under the 2,200 goal).",
                );
            });
        });

        test("today's date keeps the current goal, whatever the history says", async () => {
            // A deliberately stale last history row (2200) against the current
            // row (2000): today reads the current row and never the history.
            const today = new Date().toISOString().slice(0, 10);
            db.goals = goals({ daily_calories: 2000 });
            db.goalsHistory = [
                historyRow("2026-07-20T10:00:00.000Z", {
                    daily_calories: 2200,
                }),
            ];
            await withTools(null, async (call) => {
                const r = await call("get_nutrition_summary", {
                    start_date: today,
                    end_date: today,
                });
                expect(
                    (r.structuredContent as { goals: { calories: number } })
                        .goals.calories,
                ).toBe(2000);
                const progress = await call("get_goal_progress", {});
                expect(
                    (
                        progress.structuredContent as {
                            goals: { calories: number };
                        }
                    ).goals.calories,
                ).toBe(2000);
            });
        });

        test("get_goal_progress gives its day one activity line and no _meta key", async () => {
            db.meals = [meal({ calories: 2100 })];
            db.goals = goals({ daily_calories: 2000 });
            db.activeEntries = [ACTIVE_ROW()];
            await withTools(null, async (call) => {
                const r = await call("get_goal_progress", { date: DAY });
                expect(textOf(r)).toContain(
                    "Active calories: burned 400 kcal, credited 320 (80%). Net intake 1,780 kcal (220 under the 2,000 goal).",
                );
                expect(r._meta ?? {}).not.toHaveProperty(ACTIVITY_META_KEY);
            });
        });

        test("get_trends averages activity over the window and sends the series in _meta", async () => {
            db.meals = [meal({ calories: 2100 })];
            db.goals = goals({ daily_calories: 2000 });
            db.activeEntries = [ACTIVE_ROW()];
            await withTools(null, async (call) => {
                const r = await call("get_trends", { days: 7, end_date: DAY });
                // Burned and credited average over every calendar day of the
                // 7-day window (400/7, 320/7). Net intake averages over the one
                // day that has a meal: 2100 - 320 = 1,780.
                expect(textOf(r)).toContain(
                    "Active calories over the last 7 days, averaged over all 7 calendar days: burned avg 57 kcal/day, credited avg 46 kcal/day. Net intake avg 1,780 kcal/day over the 1 day with a meal",
                );
                expect(r._meta?.[ACTIVITY_META_KEY]).toEqual({
                    v: 1,
                    days: [{ date: DAY, burned_kcal: 400, credited_kcal: 320 }],
                });
            });
        });

        test("get_trends' _meta ships only the last 30 days even for a 90-day window", async () => {
            db.meals = [meal({ calories: 2100 })];
            db.goals = goals({ daily_calories: 2000 });
            // 2026-04-01 is outside the 30-day series (which starts 2026-06-27);
            // 2026-07-01 is inside it. The activity read is not range-filtered in
            // the mock, so the cut has to happen in the handler.
            db.activeEntries = [
                ACTIVE_ROW({ logged_at: "2026-04-01T19:00:00.000Z" }),
                ACTIVE_ROW({ logged_at: "2026-07-01T19:00:00.000Z" }),
                ACTIVE_ROW(),
            ];
            await withTools(null, async (call) => {
                const r = await call("get_trends", { days: 90, end_date: DAY });
                expect(textOf(r)).toContain("over the last 90 days");
                expect(r._meta?.[ACTIVITY_META_KEY]).toEqual({
                    v: 1,
                    days: [
                        {
                            date: "2026-07-01",
                            burned_kcal: 400,
                            credited_kcal: 320,
                        },
                        { date: DAY, burned_kcal: 400, credited_kcal: 320 },
                    ],
                });
            });
        });

        test("get_trends' _meta reaches the 30-day series, but the text stays on its window", async () => {
            // 2026-07-10 is 16 days before the end: outside the 7-day text window,
            // inside the 30-day series the widget re-averages.
            db.meals = [meal({ calories: 2100 })];
            db.goals = goals({ daily_calories: 2000 });
            db.activeEntries = [
                ACTIVE_ROW({ logged_at: "2026-07-10T19:00:00.000Z" }),
            ];
            await withTools(null, async (call) => {
                const r = await call("get_trends", { days: 7, end_date: DAY });
                expect(textOf(r)).not.toContain(
                    "Active calories over the last",
                );
                expect(r._meta?.[ACTIVITY_META_KEY]).toEqual({
                    v: 1,
                    days: [
                        {
                            date: "2026-07-10",
                            burned_kcal: 400,
                            credited_kcal: 320,
                        },
                    ],
                });
            });
        });
    });
}
