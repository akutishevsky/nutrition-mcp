import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { getWeeklyGuidance } from "../src/guidance-repository.js";

// Regression coverage for the default-view outage class (PR #184):
// the trends workspace request keeps the full selected range (7/30/90
// days), while the weekly check-in inside the Digest card — whose
// handler (getWeeklyGuidance) only accepts one to seven days — must
// be windowed to the most recent seven days. Passing the full range
// returned HTTP 500, api() threw, and the whole view fell to "That
// view could not be loaded." This harness also pins the Trends
// surface contract: the Digest carries the narratives + check-in +
// the "Explain my week" chat entry (T8), and chart reference lines
// carry their values as on-chart labels (T13).

const appSource = readFileSync(new URL("./app.js", import.meta.url), "utf8");
const trendsBlockSource = appSource.match(
    /\/\/ TRENDS-START[\s\S]*?\/\/ TRENDS-END/,
)![0];
const shiftDateSource = appSource.match(
    /function shiftDate\(date, days\) \{[\s\S]*?\n\}/,
)![0];
const chatEntryRowSource = appSource.match(
    /function chatEntryRow\(surface, label, subline\) \{[\s\S]*?\n\}/,
)![0];

const barDays = [
    "2026-11-03",
    "2026-11-04",
    "2026-11-05",
    "2026-11-06",
    "2026-11-07",
    "2026-11-08",
    "2026-11-09",
].map((date, i) => ({
    date,
    value: [1980, 2050, 2210, 1905, 2000, 1875, 2010][i],
    hasLog: true,
}));

const trendsFixture = {
    startDate: "2026-10-11",
    endDate: "2026-11-09",
    rangeDays: 30,
    timezone: "UTC",
    weightUnit: "lb",
    alcoholTrackingEnabled: true,
    layout: {
        version: 1,
        cards: [{ shape: "bar", data: "calories", size: "full" }],
    },
    catalog: [],
    cards: [
        {
            shape: "bar",
            data: "calories",
            size: "full",
            title: "Calories",
            subtitle: "Daily total · kcal",
            headline: { value: "2,010", unit: "kcal", note: "daily average" },
            verdict: {
                lead: "Target 2,000 kcal — ",
                strong: "in range 6 of 7 days",
            },
            coverage: null,
            empty: null,
            chart: {
                kind: "bars",
                metric: "calories",
                unit: "kcal",
                days: barDays,
                reference: {
                    type: "band",
                    value: 1900,
                    value2: 2100,
                    label: "target 1,900–2,100",
                },
                rolling: null,
            },
        },
    ],
    digest: {
        weekly: "You logged 6 of the last 7 days.",
        trends: "Trend narrative text.",
        patterns: "Pattern narrative text.",
    },
};

const checkinFixture = {
    coverage_percent: 86,
    nutrition_target_coverage_days: 6,
    calendar_days: 7,
    averages_on_recorded_days: {
        calories: { value: null },
        protein_g: { average: null },
    },
    uncertain_nutrition_meals: 0,
    observations: ["Protein landed under target on most logged days."],
};

async function runRenderTrends(trendsRangeDays: number) {
    const calls: string[] = [];
    const content = { innerHTML: "" };
    const context = {
        state: {
            date: "2026-11-09",
            trendsRangeDays,
            trendsEditing: false,
            trendsData: null,
            trendsCheckin: null,
            trendsDonutModes: new Map(),
        },
        content,
        setLoading: () => {},
        api: async (path: string) => {
            calls.push(path);
            if (path.startsWith("/api/app/insights/checkin")) {
                return checkinFixture;
            }
            if (path.startsWith("/api/app/trends?")) return trendsFixture;
            throw new Error(`Unexpected api path: ${path}`);
        },
        escapeHtml: (value: unknown) => String(value ?? ""),
        number: (value: unknown) => (value == null ? "—" : String(value)),
        formatDate: (value: string) => value,
        formatTime: (value: string) => value,
        toast: () => {},
        navigate: () => {},
        openDialog: () => {},
        dialog: { open: false, close: () => {} },
    };
    await runInNewContext(
        `${shiftDateSource}\n${chatEntryRowSource}\n${trendsBlockSource}\nrenderTrends();`,
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

describe("Trends workspace + Digest check-in window", () => {
    test("the default 30-day load succeeds and windows the check-in to the most recent 7 days", async () => {
        const { calls, html } = await runRenderTrends(30);
        const trends = rangeOf(calls[0]!);
        const checkin = rangeOf(calls[1]!);
        // The trends workspace keeps the full selected range.
        expect(calls[0]).toStartWith("/api/app/trends?");
        expect(trends).toEqual({
            start: "2026-10-11",
            end: "2026-11-09",
            days: 30,
        });
        // The weekly check-in receives only the most recent seven days,
        // the window getWeeklyGuidance accepts.
        expect(calls[1]).toStartWith("/api/app/insights/checkin?");
        expect(checkin).toEqual({
            start: "2026-11-03",
            end: "2026-11-09",
            days: 7,
        });
        // The Digest card carries the check-in and the chat seed (T8).
        expect(html).toContain("The week in words");
        expect(html).toContain("Weekly check-in");
        expect(html).toContain("Explain my week");
        expect(html).toContain('data-testid="chat-entry-insights"');
        // Verdict headline, not a bare number (T6).
        expect(html).toContain("in range 6 of 7 days");
        // T13: the target band is labeled on the chart with its values,
        // and every bar carries its day.
        expect(html).toContain("target 1,900–2,100");
        expect(html).toContain("data-chart-label");
        for (const day of barDays) {
            expect(html).toContain(`data-bar-date="${day.date}"`);
        }
    });

    test("a 90-day load also windows the check-in to the most recent 7 days", async () => {
        const { calls } = await runRenderTrends(90);
        expect(rangeOf(calls[0]!).days).toBe(90);
        expect(rangeOf(calls[1]!)).toEqual({
            start: "2026-11-03",
            end: "2026-11-09",
            days: 7,
        });
    });

    test("a 7-day load keeps the check-in on the full selected range", async () => {
        const { calls } = await runRenderTrends(7);
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
