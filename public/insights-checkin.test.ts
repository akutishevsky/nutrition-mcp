import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { getWeeklyGuidance } from "../src/guidance-repository.js";

// Regression coverage for the Insights default-view outage: renderInsights
// selected a 7/30/90-day trend range (30 by default) and passed that whole
// range to /api/app/insights/checkin, whose handler (getWeeklyGuidance) only
// accepts one to seven days. The check-in call returned HTTP 500, api()
// threw, and the whole Insights view fell to "That view could not be
// loaded." The weekly check-in panel is by definition the most recent seven
// days of the selected range, so renderInsights must window its check-in
// request to those seven days while the trend request keeps the full range.

const appSource = readFileSync(new URL("./app.js", import.meta.url), "utf8");
const renderInsightsSource = appSource.match(
    /async function renderInsights\(\) \{[\s\S]*?\n\}/,
)![0];
const shiftDateSource = appSource.match(
    /function shiftDate\(date, days\) \{[\s\S]*?\n\}/,
)![0];
// S6 slice 7: renderInsights now builds its rule rows through these
// pure helpers — the harness runs the real helpers alongside it.
const percentSource = appSource.match(
    /function percent\(value, target\) \{[\s\S]*?\n\}/,
)![0];
const insightRuleSource = appSource.match(
    /function insightRule\(label, valueHtml\) \{[\s\S]*?\n\}/,
)![0];
const insightProgressRuleSource = appSource.match(
    /function insightProgressRule\(label, value, unit, target\) \{[\s\S]*?\n\}/,
)![0];

const insightsFixture = {
    vitals: {
        water: { entries: [], totalMl: 0 },
        weight: { entries: [], days: [], unit: "kg", narrative: "" },
    },
    trends: { days: [], narrative: "" },
    patterns: { narrative: "" },
    progress: { goals: {}, totals: {}, mealCount: 0, weight: null },
    provenance: {
        coverage: {},
        confidence: {},
        sources: [],
        contributors: { calories: [] },
    },
    loggedDays: 0,
    mealCount: 0,
    averages: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
};

const checkinFixture = {
    coverage_percent: 0,
    nutrition_target_coverage_days: 0,
    calendar_days: 7,
    averages_on_recorded_days: {
        calories: { value: null },
        protein_g: { average: null },
    },
    uncertain_nutrition_meals: 0,
    observations: [],
};

async function runRenderInsights(insightsDays: number) {
    const calls: string[] = [];
    const content = { innerHTML: "" };
    const context = {
        state: {
            date: "2026-11-09",
            insightsDays,
            bootstrap: { profile: { preferred_weight_unit: "kg" } },
            waterEntries: [],
            weightEntries: [],
        },
        content,
        setLoading: () => {},
        api: async (path: string) => {
            calls.push(path);
            if (path.startsWith("/api/app/insights/checkin")) {
                return checkinFixture;
            }
            if (path.startsWith("/api/app/insights?")) return insightsFixture;
            throw new Error(`Unexpected api path: ${path}`);
        },
        escapeHtml: (value: unknown) => String(value ?? ""),
        number: (value: unknown) => (value == null ? "—" : String(value)),
        metricCard: (label: string, value: unknown) =>
            `<div>${label}:${value ?? "—"}</div>`,
        formatDate: (value: string) => value,
        displayWeightUnit: () => "kg",
        waterEntryRows: () => "",
        weightChart: () => "",
        weightEntryRows: () => "",
        barChart: () => "",
    };
    await runInNewContext(
        `${shiftDateSource}\n${percentSource}\n${insightRuleSource}\n${insightProgressRuleSource}\n${renderInsightsSource}\nrenderInsights();`,
        context,
    );
    return { calls, html: content.innerHTML };
}

function rangeOf(path: string) {
    const url = new URL(path, "https://munch.example");
    const start = url.searchParams.get("start")!;
    const end = url.searchParams.get("end")!;
    const days =
        (Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) /
            86_400_000 +
        1;
    return { start, end, days };
}

describe("Insights weekly check-in window", () => {
    test("the default 30-day load succeeds and windows the check-in to the most recent 7 days", async () => {
        const { calls, html } = await runRenderInsights(30);
        const trends = rangeOf(calls[0]!);
        const checkin = rangeOf(calls[1]!);
        // The trend panel keeps the full selected range.
        expect(calls[0]).toStartWith("/api/app/insights?");
        expect(trends).toEqual({
            start: "2026-10-11",
            end: "2026-11-09",
            days: 30,
        });
        // The weekly check-in receives only the most recent seven days, the
        // window getWeeklyGuidance accepts.
        expect(calls[1]).toStartWith("/api/app/insights/checkin?");
        expect(checkin).toEqual({
            start: "2026-11-03",
            end: "2026-11-09",
            days: 7,
        });
        expect(html).toContain("Weekly check-in");
        expect(html).toContain("Last 30 days");
    });

    test("a 90-day load also windows the check-in to the most recent 7 days", async () => {
        const { calls } = await runRenderInsights(90);
        expect(rangeOf(calls[0]!).days).toBe(90);
        expect(rangeOf(calls[1]!)).toEqual({
            start: "2026-11-03",
            end: "2026-11-09",
            days: 7,
        });
    });

    test("a 7-day load keeps the check-in on the full selected range", async () => {
        const { calls } = await runRenderInsights(7);
        expect(rangeOf(calls[1]!)).toEqual({
            start: "2026-11-03",
            end: "2026-11-09",
            days: 7,
        });
    });

    test("the weekly guidance handler still rejects ranges over seven days", async () => {
        // The fix windows the request in the SPA; it must not weaken the
        // handler contract that the MCP get_weekly_checkin tool also uses.
        await expect(
            getWeeklyGuidance({
                userId: "00000000-0000-0000-0000-000000000000",
                startDate: "2026-10-11",
                endDate: "2026-11-09",
            }),
        ).rejects.toThrow(
            "Weekly guidance requires a valid date range of one to seven days",
        );
    });
});
