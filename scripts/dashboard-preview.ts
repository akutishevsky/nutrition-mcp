// Local preview of the web dashboard, with fixture data and no Supabase.
//
//   bun run dashboard:preview        # then open http://localhost:8788/dashboard
//
// Serves the page exactly as scripts/gen-dashboard.ts renders it (rendered
// on every request; the package script runs under `bun --watch`, so editing
// src/copy/dashboard.ts or the generator restarts it — no re-run of the
// generator needed), plus public/dashboard.js, site.js, styles.css and the icons,
// the real assembled widgets at /dashboard/widget/:key (getWidgetHtml, with
// the CSP the production route sends), and fixture JSON for every
// /api/dashboard/* route the page calls. The tool fixtures are the widget
// harness's own (scripts/harness-day-view.ts, goal-progress-fixtures.ts,
// trends-scenarios.ts, digest-fixture.ts) plus a weight history built with
// the real src/weight-trend.ts, so the widgets draw what the server would.
//
// The page's own query string picks a state, read here from each API call's
// Referer (dashboard.js knows nothing about it):
//
//   ?variant=normal     fixtures (default)
//   ?variant=loading    every data call hangs: the skeletons stay up
//   ?variant=error      every data call answers 503: the first-load banner
//   ?variant=stale      the first load works, every later one fails: the
//                       refresh banner over the last good data (click
//                       Try again, or wait for the 60 s refresh)
//   ?variant=empty      an account with nothing logged
//   ?variant=signedout  every call answers 401: dashboard.js goes to sign-in
//
// Locales: /de/dashboard etc. render that locale (English strings until its
// dashboard.<locale>.ts exists). Nothing here is served by the production
// app; scripts/ is dev-only.

import { renderDashboard } from "./gen-dashboard.js";
import { summaryScenario } from "./harness-day-view.js";
import { goalProgressFixture } from "./goal-progress-fixtures.js";
import { trendsScenario } from "./trends-scenarios.js";
import { digestFixture } from "./digest-fixture.js";
import { LOCALES, type SiteLocale } from "../src/routes.js";
import { BODY_MEASUREMENT_KINDS } from "../src/units.js";
import { getWidgetHtml } from "../src/widgets.js";
import {
    WEIGHT_ENTRIES_META_KEY,
    WEIGHT_SERIES_META_KEY,
} from "../src/widgets.js";
import { analyzeWeightHistory, defaultRangeFor } from "../src/weight-trend.js";
import {
    buildWeightEntriesMeta,
    type WeightEntryRow,
} from "../src/weight-widget.js";
import { fromGrams } from "../src/units.js";
import { shiftLocalDate } from "../src/tz.js";

const PORT = Number(process.env.DASHBOARD_PREVIEW_PORT ?? 8788);
const TZ = "Europe/Kyiv";
const WIDGETS = [
    "nutrition-summary",
    "goal-progress",
    "trends",
    "weight-trends",
    "digest",
];
const WIDGET_CSP =
    "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; frame-ancestors 'self'";

type Variant = "normal" | "loading" | "error" | "stale" | "empty" | "signedout";
const VARIANTS: Variant[] = [
    "normal",
    "loading",
    "error",
    "stale",
    "empty",
    "signedout",
];

function today(): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}

// ---------- fixtures ----------

/** Deterministic noise in [0, 1). */
function rnd(i: number, seed = 1): number {
    const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
    return x - Math.floor(x);
}

const GOAL = 2200;
function calendarDays(from: string, to: string, empty: boolean) {
    const t = today();
    const out = [];
    for (let d = from; d <= to; d = shiftLocalDate(d, 1)) {
        const i = Math.round(
            (Date.parse(d + "T00:00:00Z") -
                Date.parse("2026-01-01T00:00:00Z")) /
                864e5,
        );
        const skip = empty || d > t || rnd(i, 3) < 0.08;
        const calories = skip
            ? null
            : d === t
              ? 1462
              : Math.round(1880 + rnd(i, 5) * 700);
        const mealCount = calories == null ? 0 : 3 + Math.floor(rnd(i, 7) * 3);
        const band = GOAL * 0.05;
        const status =
            calories == null
                ? "none"
                : calories - GOAL > band
                  ? "over"
                  : GOAL - calories > band
                    ? "under"
                    : "on";
        out.push({
            date: d,
            calories,
            goal: GOAL,
            mealCount,
            water_ml:
                calories == null ? 0 : 1500 + Math.round(rnd(i, 9) * 1200),
            status,
        });
    }
    return out;
}

const SAVED = [
    {
        id: "s1",
        name: "Chicken & rice bowl",
        meal_type: "lunch",
        calories: 642,
        protein_g: 48,
        carbs_g: 72,
        fat_g: 16,
        itemCount: 4,
    },
    {
        id: "s2",
        name: "Overnight oats with berries",
        meal_type: "breakfast",
        calories: 410,
        protein_g: 18,
        carbs_g: 62,
        fat_g: 10,
        itemCount: 5,
    },
    {
        id: "s3",
        name: "Protein shake",
        meal_type: "post_workout",
        calories: 230,
        protein_g: 32,
        carbs_g: 14,
        fat_g: 5,
        itemCount: 3,
    },
    {
        id: "s4",
        name: "Salmon, potatoes & salad",
        meal_type: "dinner",
        calories: 690,
        protein_g: 42,
        carbs_g: 55,
        fat_g: 32,
        itemCount: 4,
    },
];

const MEALS: [number, string, string, number, string[]][] = [
    [
        0,
        "12:40",
        "Chicken & rice bowl",
        642,
        ["Basmati rice", "Chicken breast", "Broccoli", "Soy glaze"],
    ],
    [
        0,
        "08:05",
        "Greek yogurt, oats & blueberries",
        452,
        ["Greek yogurt", "Rolled oats", "Blueberries"],
    ],
    [
        2,
        "19:30",
        "Salmon, potatoes & salad",
        690,
        ["Salmon fillet", "New potatoes", "Mixed salad"],
    ],
    [
        3,
        "13:10",
        "Fried rice with egg",
        580,
        ["Jasmine rice", "Egg", "Spring onion", "Peas"],
    ],
    [
        6,
        "12:55",
        "Chicken & rice bowl",
        605,
        ["Basmati rice", "Chicken breast", "Broccoli", "Soy glaze"],
    ],
    [
        9,
        "20:15",
        "Burrito bowl",
        720,
        ["Brown rice", "Black beans", "Beef mince", "Salsa"],
    ],
    [
        12,
        "08:20",
        "Overnight oats with berries",
        395,
        ["Rolled oats", "Milk", "Raspberries"],
    ],
    [
        15,
        "13:00",
        "Rice cakes & peanut butter",
        310,
        ["Rice cakes", "Peanut butter"],
    ],
];

function search(q: string) {
    const ql = q.toLowerCase();
    const t = today();
    const meals = MEALS.map(([ago, time, description, calories, items], i) => ({
        id: "m" + i,
        date: shiftLocalDate(t, -ago),
        time,
        description,
        meal_type: null,
        calories,
        items: description.toLowerCase().includes(ql)
            ? []
            : items.filter((n) => n.toLowerCase().includes(ql)),
    })).filter(
        (m) => m.description.toLowerCase().includes(ql) || m.items.length,
    );
    const savedMeals = SAVED.filter((s) =>
        s.name.toLowerCase().includes(ql),
    ).map((s) => ({ id: s.id, name: s.name, calories: s.calories }));
    return { meals, savedMeals };
}

function measurements(empty: boolean) {
    if (empty)
        return {
            unit: "cm",
            sites: [],
            unmeasured: [...BODY_MEASUREMENT_KINDS],
        };
    const latest = "2026-11-03";
    const first = "2026-08-04";
    const rows: [string, number, number | null, number][] = [
        ["waist", 84.0, 86.5, 9],
        ["hips", 98.0, 99.0, 9],
        ["neck", 38.0, null, 1],
        ["chest", 101.5, 101.0, 7],
        ["upper_arm", 34.5, 33.5, 6],
        ["thigh", 57.0, 58.0, 6],
    ];
    const sites = rows.map(([kind, v, f, n]) => ({
        kind,
        latest: { value: v, unit: "cm", date: latest },
        first: f == null ? null : { value: f, unit: "cm", date: first },
        entries: n,
    }));
    const seen = new Set(rows.map((r) => r[0]));
    return {
        unit: "cm",
        sites,
        unmeasured: BODY_MEASUREMENT_KINDS.filter((k) => !seen.has(k)),
    };
}

/** A year of weigh-ins, 81.6 → 78.3 kg with noise and a few skipped days. */
function weightResult(days: number, empty: boolean) {
    const end = today();
    const rows: WeightEntryRow[] = [];
    if (!empty) {
        for (let i = 364; i >= 0; i--) {
            if (i > 0 && rnd(i, 11) < 0.22) continue;
            const kg = 78.3 + (i / 364) * 3.3 + (rnd(i, 13) - 0.5) * 0.9;
            rows.push({
                logged_at: `${shiftLocalDate(end, -i)}T07:${String(10 + Math.floor(rnd(i, 2) * 40)).padStart(2, "0")}:00+02:00`,
                weight_g: Math.round((i === 0 ? 78.3 : kg) * 1000),
                notes: i === 3 ? "After a long run" : null,
            });
        }
    }
    const a = analyzeWeightHistory(rows, TZ, "kg", end);
    const cutoff = shiftLocalDate(end, -29);
    return {
        structuredContent: {
            end_date: end,
            unit: "kg",
            target: 76,
            default_range: defaultRangeFor(days),
            locale: "en",
            days: a.days
                .filter((d) => d.date >= cutoff)
                .map((d) => ({
                    date: d.date,
                    weight: fromGrams(d.weight_g, "kg"),
                })),
        },
        _meta: {
            [WEIGHT_SERIES_META_KEY]: a.meta,
            [WEIGHT_ENTRIES_META_KEY]: buildWeightEntriesMeta(
                rows,
                TZ,
                "kg",
                end,
                end,
            ),
        },
    };
}

function toolResult(
    name: string,
    args: Record<string, unknown>,
    empty: boolean,
): { structuredContent: unknown; _meta: unknown } | null {
    switch (name) {
        case "get_nutrition_summary": {
            const s = summaryScenario(empty ? "nothing" : "today");
            return s && { structuredContent: s.result, _meta: s.meta };
        }
        case "get_goal_progress": {
            const g = goalProgressFixture(empty ? "empty" : "typical", "us");
            return { structuredContent: g.result, _meta: g.meta };
        }
        case "get_trends": {
            const t = trendsScenario(empty ? "empty" : "typical", null);
            const days = Number(args.days) || 30;
            return {
                structuredContent: {
                    ...t.result,
                    default_range: days <= 7 ? 7 : days <= 14 ? 14 : 30,
                },
                _meta: t.meta,
            };
        }
        case "get_weight_trends":
            return weightResult(Number(args.days) || 30, empty);
        case "get_digest": {
            const f = digestFixture(
                new URLSearchParams({
                    period: String(args.period ?? "yesterday"),
                    scenario: empty ? "empty" : "typical",
                }),
            );
            return { structuredContent: f.result, _meta: f.meta };
        }
    }
    return null;
}

// ---------- server ----------

const JSON_HEADERS = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "private, no-store",
};
const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

/** The page's ?variant=, read off the API call's Referer. */
function variantOf(req: Request): Variant {
    const ref = req.headers.get("referer");
    let v: string | null = null;
    try {
        if (ref) v = new URL(ref).searchParams.get("variant");
    } catch {}
    return (VARIANTS as string[]).includes(v ?? "") ? (v as Variant) : "normal";
}

/** ?variant=stale: per page load, the first round of calls succeeds. */
const staleSeen = new Map<string, number>();

async function apiResponse(req: Request, url: URL): Promise<Response> {
    const variant = variantOf(req);
    const path = url.pathname;
    if (variant === "signedout")
        return json(
            { ok: false, error: "unauthenticated", message: "Sign in again." },
            401,
        );
    if (path === "/api/dashboard/session")
        return json({
            ok: true,
            csrf: "preview-csrf-token",
            locale: "en",
            timezone: TZ,
        });
    if (variant === "loading") await new Promise(() => {});
    if (variant === "error")
        return json(
            {
                ok: false,
                error: "unavailable",
                message: "Try again in a moment.",
                ref: "0badc0de",
            },
            503,
        );
    if (variant === "stale") {
        const key = req.headers.get("referer") ?? "";
        if (path === "/api/dashboard/status") {
            const n = (staleSeen.get(key) ?? 0) + 1;
            staleSeen.set(key, n);
            if (n > 1)
                return json(
                    {
                        ok: false,
                        error: "unavailable",
                        message: "Try again in a moment.",
                    },
                    503,
                );
        }
    }
    const empty = variant === "empty";
    // A little latency, so the "Updating…" state is visible.
    await Bun.sleep(150);

    if (path === "/api/dashboard/status")
        return json({
            ok: true,
            timezone: TZ,
            locale: "en",
            today: today(),
            weightUnit: "kg",
            lengthUnit: "cm",
            lastLoggedAt: empty ? null : new Date().toISOString(),
            hasData: !empty,
        });
    if (path === "/api/dashboard/calendar") {
        const from = url.searchParams.get("from") ?? today();
        const to = url.searchParams.get("to") ?? today();
        return json({ ok: true, days: calendarDays(from, to, empty) });
    }
    if (path === "/api/dashboard/search") {
        const q = (url.searchParams.get("q") ?? "").trim();
        if (q.length < 2 || q.length > 100)
            return json(
                { ok: false, error: "bad_request", message: "Bad query." },
                400,
            );
        return json({
            ok: true,
            ...(empty ? { meals: [], savedMeals: [] } : search(q)),
        });
    }
    if (path === "/api/dashboard/saved-meals")
        return json({ ok: true, savedMeals: empty ? [] : SAVED });
    if (path === "/api/dashboard/measurements")
        return json({ ok: true, ...measurements(empty) });
    if (path.startsWith("/api/dashboard/tool/")) {
        const name = decodeURIComponent(
            path.slice("/api/dashboard/tool/".length),
        );
        let args: Record<string, unknown> = {};
        try {
            args = JSON.parse(url.searchParams.get("args") ?? "{}");
        } catch {}
        const r = toolResult(name, args, empty);
        if (!r)
            return json(
                { ok: false, error: "bad_request", message: "Unknown tool." },
                400,
            );
        return json({ ok: true, ...r });
    }
    return json(
        { ok: false, error: "bad_request", message: "Not found." },
        404,
    );
}

const STATIC: Record<string, string> = {
    "/dashboard.js": "application/javascript; charset=utf-8",
    "/site.js": "application/javascript; charset=utf-8",
    "/styles.css": "text/css; charset=utf-8",
    "/favicon.ico": "image/x-icon",
    "/favicon.svg": "image/svg+xml",
    "/apple-touch-icon.png": "image/png",
};

const html = (body: string) =>
    new Response(body, {
        headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store",
        },
    });

Bun.serve({
    port: PORT,
    idleTimeout: 0,
    async fetch(req) {
        const url = new URL(req.url);
        const path = url.pathname;
        if (path === "/") return Response.redirect("/dashboard", 302);
        // A page load starts ?variant=stale's "first round succeeds" over.
        if (path === "/dashboard") {
            staleSeen.clear();
            return html(renderDashboard("en"));
        }
        const m = path.match(/^\/([a-z]{2})\/dashboard$/);
        if (m && (LOCALES as readonly string[]).includes(m[1]!)) {
            staleSeen.clear();
            return html(renderDashboard(m[1] as SiteLocale));
        }
        if (path.startsWith("/api/dashboard/")) return apiResponse(req, url);
        // The footer's GitHub link asks site.js for a star count.
        if (path === "/api/github-stars") return json({ stars: 128 });
        if (path.startsWith("/dashboard/widget/")) {
            const key = decodeURIComponent(
                path.slice("/dashboard/widget/".length),
            );
            if (!WIDGETS.includes(key))
                return new Response("unknown widget", { status: 404 });
            return new Response(await getWidgetHtml(key), {
                headers: {
                    "content-type": "text/html; charset=utf-8",
                    "content-security-policy": WIDGET_CSP,
                    "cache-control": "no-store",
                },
            });
        }
        if (path === "/dashboard/login")
            return html(
                `<!doctype html><meta charset="utf-8"><title>Sign in (preview)</title><p style="font:16px system-ui;padding:40px">Preview: dashboard.js sent you to sign-in (${url.search}). <a href="/dashboard">Back</a></p>`,
            );
        if (path === "/dashboard/logout" && req.method === "POST") {
            const form = await req.formData();
            console.log(`[preview] sign out, csrf=${String(form.get("csrf"))}`);
            return new Response(null, {
                status: 303,
                headers: { location: "/dashboard" },
            });
        }
        if (STATIC[path])
            return new Response(Bun.file(`./public${path}`), {
                headers: {
                    "content-type": STATIC[path]!,
                    "cache-control": "no-store",
                },
            });
        return new Response("not found", { status: 404 });
    },
});

console.log(`dashboard preview on http://localhost:${PORT}/dashboard`);
console.log(`variants: ${VARIANTS.map((v) => `?variant=${v}`).join(" ")}`);
