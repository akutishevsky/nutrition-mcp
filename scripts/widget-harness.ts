// Local MCP Apps host harness for widget development.
//
//   bun run scripts/widget-harness.ts            # then open http://localhost:8787
//
// Mimics a STRICT host: it validates the ui/initialize request shape, withholds
// the tool result until the app sends ui/notifications/initialized, starts the
// iframe deliberately SHORT so a missing size-changed report shows up as a
// clipped widget, and — unlike anything else we have — answers app-initiated
// tools/call so a widget's server round-trip can be exercised offline.
//
// Query parameters let you reproduce host behaviours that are otherwise only
// observable in production:
//
//   ?serverTools=0      withhold hostCapabilities.serverTools
//   ?tools=0            accept tools/call but never answer (tests timeouts)
//   ?delay=3000         delay every tools/call, standing in for an approval prompt
//   ?maxHeight=600      impose hostContext.containerDimensions.maxHeight
//   ?fail=1             answer tools/call with a JSON-RPC error
//   ?drinkUnit=us       alcohol tracking ON for import-meals (default: off/null)
//   ?noMeta=1           deliver the tool result WITHOUT its _meta, as a host that
//                       drops it would (nutrition-summary then shows "N or more")
//
// Nothing here is served by the production app; scripts/ is dev-only.

import {
    getWidgetHtml,
    MEAL_CONTRIBUTORS_META_KEY,
    WIDGET_TEMPLATES,
} from "../src/widgets.js";
import { runImport } from "../src/import.js";
import type { MealInput, MealInsertResult } from "../src/supabase.js";

// In-memory stand-in for insertMeal, mirroring its dedup contract, so the harness
// can execute the REAL bulk_import_meals logic instead of returning canned data.
// That is what makes an end-to-end widget run meaningful: the same validation,
// idempotency keys and per-row report a client would get.
const store = new Map<string, MealInput & { id: string }>();
const byId = new Map<string, MealInput & { id: string }>();
let mealSeq = 0;
// Uuid-shaped, because the importer only honours a source_id that could name a
// real meal — "harness-1" ids would make an export re-import look like it
// deduped nothing, which is exactly the bug this flow now guards against.
const harnessMealId = (n: number) =>
    `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
async function fakeInsert(input: MealInput): Promise<MealInsertResult> {
    const key = input.idempotency_key!;
    const existing = store.get(key);
    if (existing) return { meal: existing as never, deduplicated: true };
    const meal = { id: harnessMealId(++mealSeq), ...input };
    store.set(key, meal);
    byId.set(meal.id, meal);
    return { meal: meal as never, deduplicated: false };
}

const PORT = Number(process.env.HARNESS_PORT ?? 8787);
const KEYS = Object.keys(WIDGET_TEMPLATES);

function indexPage(): string {
    const links = KEYS.map(
        (k) =>
            `<li><a href="/host?widget=${encodeURIComponent(k)}">${k}</a></li>`,
    ).join("");
    return `<!doctype html>
<html><head><meta charset="utf-8"><title>Widget harness</title>
<style>
  body{font:14px/1.5 -apple-system,system-ui,sans-serif;margin:32px;max-width:760px}
  code{background:#eee;padding:1px 4px;border-radius:3px}
  li{margin:4px 0}
</style></head>
<body>
  <h1>MCP Apps widget harness</h1>
  <p>Pick a widget. Append query flags to simulate host behaviour:
     <code>?serverTools=0</code>, <code>?tools=0</code>, <code>?delay=3000</code>,
     <code>?maxHeight=600</code>, <code>?fail=1</code>, <code>?drinkUnit=us</code>,
     <code>?noMeta=1</code>.</p>
  <ul>${links}</ul>
</body></html>`;
}

function hostPage(widget: string, params: URLSearchParams): string {
    const serverTools = params.get("serverTools") !== "0";
    const answerTools = params.get("tools") !== "0";
    const delay = Number(params.get("delay") ?? 0);
    const maxHeight = params.get("maxHeight");
    const failCalls = params.get("fail") === "1";
    // A host that forwards structuredContent but not the result's _meta. The
    // summary's per-metric meal counts travel ONLY in _meta (structuredContent
    // is validated against a cached outputSchema and can never gain a field),
    // so this is how the "N or more smaller meals" fallback is previewed.
    const noMeta = params.get("noMeta") === "1";
    // The alcohol opt-in, as every tool that touches alcohol sends it:
    // "us"/"uk" when the user tracks alcohol, null when they do not. Default
    // null, because that is the default account state and the state the
    // importer must never leak in.
    //
    // The macro widgets need it too, and for them null means something the
    // importer never has to model: their fixtures below DO carry alcohol
    // figures, so passing null would say "tracking off" and hide the row
    // outright. They take `macroDrinkUnit`, which is the flag when set and
    // "us" otherwise — the server's own default for a tracking user with no
    // saved preference. `?drinkUnit=uk` is therefore the only way to see the
    // "1.6 UK units" gloss anywhere.
    const drinkUnitParam = params.get("drinkUnit");
    const drinkUnit =
        drinkUnitParam === "us" || drinkUnitParam === "uk"
            ? drinkUnitParam
            : null;
    const macroDrinkUnit = drinkUnit ?? "us";

    // Per-widget canned tool results. One shared fixture does NOT work: each
    // widget's coerce() checks for its own shape, so a payload shaped for
    // goal-progress leaves trends stuck on "Loading…" — which looks exactly like
    // a broken handshake. Keep these in step with each template's SAMPLE.
    const day = (d: string, kcal: number) => ({
        date: d,
        calories: kcal,
        protein_g: Math.round(kcal * 0.07),
        carbs_g: Math.round(kcal * 0.11),
        fat_g: Math.round(kcal * 0.03),
        fiber_g: Math.round(kcal * 0.013 * 10) / 10,
        sugar_g: Math.round(kcal * 0.028 * 10) / 10,
        // Alcohol tracking ON in these fixtures except where noted; 0 is a
        // tracked alcohol-free day, null (see "meal-logged") is tracking off.
        alcohol_g: kcal > 2100 ? 13.9 : 0,
        // Caffeine on most days but not all. null is "nothing recorded that
        // day" — the trends widget must average over the days that carry it,
        // and a 0 here would be a claim the user never made.
        caffeine_mg: kcal > 1900 ? 165 : null,
        water_ml: 1800,
    });
    const days = [
        day("2026-07-09", 1980),
        day("2026-07-10", 2210),
        day("2026-07-11", 1875),
        day("2026-07-12", 2340),
        day("2026-07-13", 2050),
        day("2026-07-14", 1920),
        day("2026-07-15", 2160),
    ];
    const goals = {
        calories: 2200,
        protein_g: 160,
        carbs_g: 220,
        fat_g: 70,
        fiber_g: 30,
        sugar_g: 45,
        alcohol_g: 20,
        caffeine_mg: 400,
        water_ml: 2500,
    };
    const totals = {
        calories: 1850,
        protein_g: 120,
        carbs_g: 190,
        fat_g: 62,
        fiber_g: 24.6,
        // Over its ceiling, so the sub-row inside the carbs disclosure flags it.
        sugar_g: 61.3,
        alcohol_g: 27.7,
        // Over its ceiling too, so the stat line flags it.
        caffeine_mg: 470,
        water_ml: 1500,
    };
    // Per-meal breakdown rows: what makes the panel's tiles tappable.
    const meals = [
        {
            description: "Overnight oats with berries",
            meal_type: "breakfast",
            date: null,
            calories: 420,
            protein_g: 18,
            carbs_g: 62,
            fat_g: 12,
            fiber_g: 9.4,
            sugar_g: 24.6,
            alcohol_g: 0,
            caffeine_mg: null,
        },
        {
            description: "Grilled chicken & rice bowl",
            meal_type: "lunch",
            date: null,
            calories: 650,
            protein_g: 52,
            carbs_g: 78,
            fat_g: 16,
            fiber_g: 6.2,
            sugar_g: 9.4,
            alcohol_g: 0,
            caffeine_mg: null,
        },
        {
            description: "Salmon with quinoa & veg",
            meal_type: "dinner",
            date: null,
            calories: 780,
            protein_g: 56,
            carbs_g: 77,
            fat_g: 32,
            fiber_g: 7.9,
            sugar_g: 14.7,
            alcohol_g: 27.7,
            caffeine_mg: null,
        },
        {
            description: "Double espresso",
            meal_type: "snack",
            date: null,
            calories: 10,
            protein_g: 0,
            carbs_g: 1,
            fat_g: 0,
            fiber_g: 0,
            sugar_g: 0,
            alcohol_g: 0,
            caffeine_mg: 470,
        },
    ];
    // Same rows with alcohol tracking OFF: null, not 0, everywhere.
    const mealsNoAlcohol = meals.map((m) => ({ ...m, alcohol_g: null }));

    // The summary spans a week, so it gets more rows than the widget's CAP (8)
    // — enough that its lists overflow and the "N more" line is on screen.
    const extraSummaryMeals = [
        ["Greek yogurt & honey", "breakfast", 240, 17, 30, 6, 0, 26],
        ["Turkey wrap", "lunch", 480, 34, 44, 17, 5.1, 4.2],
        ["Lentil soup", "dinner", 390, 22, 55, 8, 14.2, 6.8],
        ["Apple", "snack", 95, 0.5, 25, 0.3, 4.4, 19],
        ["Protein bar", "snack", 210, 20, 23, 7, 3, 6.5],
        ["Beef stir-fry", "dinner", 610, 44, 48, 24, 5.6, 11.3],
        ["Banana", "snack", 105, 1.3, 27, 0.4, 3.1, 14.4],
    ] as const;
    const summaryMeals = [
        ...meals,
        ...extraSummaryMeals.map(
            ([
                description,
                meal_type,
                calories,
                protein_g,
                carbs_g,
                fat_g,
                fiber_g,
                sugar_g,
            ]) => ({
                description,
                meal_type,
                date: null,
                calories,
                protein_g,
                carbs_g,
                fat_g,
                fiber_g,
                sugar_g,
                alcohol_g: 0,
                caffeine_mg: null,
            }),
        ),
    ].map((m, i) => ({ ...m, date: days[i % days.length]!.date }));
    // What get_nutrition_summary sends in the result's _meta under
    // MEAL_CONTRIBUTORS_META_KEY: per metric, how many meals had a value above
    // zero. Two more meals than are listed contributed calories and the three
    // macros — the server trimmed them, being outside every metric's top 8 —
    // so the counts run past the rows exactly as a real trimmed payload does.
    const TRIMMED = new Set(["calories", "protein_g", "carbs_g", "fat_g"]);
    const summaryMeta = {
        [MEAL_CONTRIBUTORS_META_KEY]: Object.fromEntries(
            (
                [
                    "calories",
                    "protein_g",
                    "carbs_g",
                    "fat_g",
                    "fiber_g",
                    "sugar_g",
                    "alcohol_g",
                    "caffeine_mg",
                ] as const
            ).map((k) => [
                k,
                summaryMeals.filter((m) => (m[k] ?? 0) > 0).length +
                    (TRIMMED.has(k) ? 2 : 0),
            ]),
        ),
    };
    // Per-widget CallToolResult `_meta`, delivered beside structuredContent.
    const METAS: Record<string, unknown> = {
        "nutrition-summary": summaryMeta,
    };

    const RESULTS: Record<string, unknown> = {
        "nutrition-summary": {
            start_date: "2026-07-09",
            end_date: "2026-07-15",
            logged_days: days.length,
            // 2026-07-09 → 2026-07-15 is 7 calendar days and all 7 are logged,
            // so this previews the no-gap caption. The gappy branch (where the
            // header reads "15 of 30 days logged") is pinned by
            // public/widgets/summary-caption.test.ts; edit both dates together
            // if you want to eyeball it here.
            days_in_range: days.length,
            drink_unit: macroDrinkUnit,
            goals,
            averages: {
                calories: 2076,
                protein_g: 145,
                carbs_g: 228,
                fat_g: 62,
                fiber_g: 27.4,
                sugar_g: 58.1,
                alcohol_g: 7.9,
                caffeine_mg: 165,
                water_ml: 1800,
            },
            days,
            meals: summaryMeals,
        },
        "goal-progress": {
            date: "2026-07-15",
            meal_count: 4,
            water_entries: 6,
            drink_unit: macroDrinkUnit,
            goals,
            totals,
            has_goals: true,
            // Deliberately empty, so one macro widget covers the strip's
            // static path: with no per-meal rows behind them, no tile is a
            // button, the "tap a metric" hint is absent and every cell reads
            // as the plain figure it always was. The interactive path is
            // meal-logged and nutrition-summary below, which carry meals.
            meals: [],
        },
        "meal-logged": {
            action: "logged",
            date: "2026-07-15",
            logged_meal: {
                description: "Grilled chicken salad",
                meal_type: "lunch",
                calories: 520,
                protein_g: 42,
                carbs_g: 28,
                fat_g: 22,
                fiber_g: 7.4,
                sugar_g: 6.1,
                alcohol_g: null,
                caffeine_mg: null,
            },
            has_goals: true,
            // Alcohol tracking OFF for this one, so the panel must show no
            // alcohol stat line at all (null, not 0) — while the caffeine line
            // stays, which is the point: caffeine has no opt-in flag, only the
            // data-driven null.
            drink_unit: null,
            goals: { ...goals, alcohol_g: null },
            totals: { ...totals, alcohol_g: null },
            meals: mealsNoAlcohol,
        },
        trends: { range_days: 7, days, goals, drink_unit: macroDrinkUnit },
        // start_meal_import's payload. Without it the importer would fall back
        // to its built-in defaults and the alcohol gate would never be
        // exercised here — which is exactly how the leak shipped.
        "import-meals": {
            tz: "Europe/Kyiv",
            tz_configured: true,
            today: "2026-07-15",
            max_rows_per_call: 50,
            import_tool_name: "bulk_import_meals",
            known_source_apps: [
                "myfitnesspal",
                "cronometer",
                "loseit",
                "macrofactor",
            ],
            widgets_enabled: true,
            drink_unit: drinkUnit,
        },
        "weight-trends": {
            range_days: 7,
            unit: "kg",
            days: days.map((d, i) => ({
                date: d.date,
                weight_kg: 82.4 - i * 0.1,
                weight: 82.4 - i * 0.1,
            })),
        },
    };
    // Probe and gallery paint their own UI; anything non-null will do.
    const toolResult = RESULTS[widget] ?? { probe: true };
    const toolMeta = noMeta ? null : (METAS[widget] ?? null);

    return `<!doctype html>
<html><head><meta charset="utf-8"><title>host: ${widget}</title>
<style>
  body{font:13px/1.5 -apple-system,system-ui,sans-serif;margin:16px}
  #frame{width:100%;height:130px;border:2px solid #888;border-radius:8px;transition:height .15s}
  #log{margin-top:12px;padding:8px;background:#111;color:#0f0;border-radius:6px;
       font:11px/1.5 ui-monospace,monospace;white-space:pre-wrap;max-height:300px;overflow:auto}
  .cfg{color:#666}
</style></head>
<body>
  <strong>${widget}</strong>
  <span class="cfg">serverTools=${serverTools} answerTools=${answerTools} delay=${delay}ms${maxHeight ? " maxHeight=" + maxHeight : ""}${failCalls ? " fail=1" : ""}${noMeta ? " noMeta=1" : ""} drinkUnit=${drinkUnit ?? "null (tracking off)"}</span>
  <div style="margin-top:8px"><iframe id="frame" sandbox="allow-scripts" src="/widget/${encodeURIComponent(widget)}"></iframe></div>
  <div style="margin-top:8px">
    <button onclick="hostRequest(1)">host req id=1</button>
    <button onclick="hostRequest(2)">host req id=2</button>
    <button onclick="hostNotify()">host-context-changed (dark)</button>
  </div>
  <div id="log">host ready — iframe starts at 130px and grows only on size-changed</div>
<script>
const CFG = {
  serverTools: ${serverTools},
  answerTools: ${answerTools},
  delay: ${delay},
  maxHeight: ${maxHeight ? Number(maxHeight) : "null"},
  fail: ${failCalls},
};
const TOOL_RESULT = ${JSON.stringify(toolResult)};
// The result's _meta (null with ?noMeta=1 or for a widget that has none). The
// spec has the host forward the whole CallToolResult, _meta included.
const TOOL_META = ${JSON.stringify(toolMeta)};
const toolResultParams = () => TOOL_META
  ? { structuredContent: TOOL_RESULT, _meta: TOOL_META }
  : { structuredContent: TOOL_RESULT };
const frame = document.getElementById("frame");
const logEl = document.getElementById("log");
const log = (m) => { logEl.textContent += "\\n" + m; logEl.scrollTop = logEl.scrollHeight; };
let initialized = false;

function send(msg) { frame.contentWindow.postMessage(msg, "*"); }

// A host->app REQUEST. The spec's ui/resource-teardown example uses id 1, which
// collides with the app's own first request unless the app namespaces its ids.
// The app must answer, and must NOT treat this as a response.
function hostRequest(id) {
  log("-> host REQUEST ui/resource-teardown (id " + id + ")");
  send({ jsonrpc: "2.0", id, method: "ui/resource-teardown", params: { reason: "test" } });
}
function hostNotify() {
  log("-> host-context-changed theme=dark");
  send({ jsonrpc: "2.0", method: "ui/notifications/host-context-changed",
         params: { hostContext: { theme: "dark" } } });
}

window.addEventListener("message", (e) => {
  if (e.source !== frame.contentWindow) return;   // what bridge.js should also do
  const d = e.data;
  if (!d || typeof d !== "object") return;

  // ---- ui/initialize (strict: validate the request shape) ----
  if (d.method === "ui/initialize") {
    const p = d.params || {};
    const ok = p.protocolVersion && p.appInfo && p.appCapabilities;
    log("<- ui/initialize " + JSON.stringify(p.appInfo || null));
    if (!ok) {
      log("!! REJECTED: needs protocolVersion + appInfo + appCapabilities " +
          "(clientInfo/capabilities is the MCP-core shape and is wrong here)");
      return;
    }
    const hostContext = { theme: "light" };
    if (CFG.maxHeight) hostContext.containerDimensions = { maxHeight: CFG.maxHeight };
    const hostCapabilities = {};
    if (CFG.serverTools) hostCapabilities.serverTools = {};
    send({ jsonrpc: "2.0", id: d.id, result: {
      protocolVersion: "2026-01-26",
      hostInfo: { name: "local-harness", version: "1.0.0" },
      hostCapabilities, hostContext,
    }});
    return;
  }

  // ---- required before the host will deliver data ----
  if (d.method === "ui/notifications/initialized") {
    initialized = true;
    log("<- initialized; delivering tool-result");
    send({ jsonrpc: "2.0", method: "ui/notifications/tool-result",
           params: toolResultParams() });
    return;
  }

  // ---- height reporting ----
  if (d.method === "ui/notifications/size-changed") {
    const h = d.params && d.params.height;
    const capped = CFG.maxHeight ? Math.min(h, CFG.maxHeight) : h;
    frame.style.height = capped + "px";
    log("<- size-changed height=" + h + (capped !== h ? " (capped to " + capped + ")" : ""));
    return;
  }

  // ---- ui/update-model-context (a REQUEST, params.content ContentBlocks) ----
  if (d.method === "ui/update-model-context") {
    const p = d.params || {};
    const shapeOk = Array.isArray(p.content) || !!p.structuredContent;
    log("<- ui/update-model-context id=" + d.id + " shapeOk=" + shapeOk +
        " " + JSON.stringify(p).slice(0, 120));
    if (d.id != null) send({ jsonrpc: "2.0", id: d.id, result: {} });
    return;
  }

  // ---- app-initiated tools/call ----
  if (d.method === "tools/call") {
    const name = d.params && d.params.name;
    log("<- tools/call " + name + " (id " + d.id + ")");
    if (!initialized) log("!! app called a tool before the handshake finished");
    if (!CFG.answerTools) { log("   (answerTools=0: dropping, app should time out)"); return; }
    setTimeout(async () => {
      if (CFG.fail) {
        send({ jsonrpc: "2.0", id: d.id, error: { code: -32603, message: "harness: simulated failure" } });
        log("-> error for id " + d.id);
        return;
      }
      // bulk_import_meals runs for real, server-side, against an in-memory store.
      if (name === "bulk_import_meals") {
        // What the widget actually decided to send, before the server sees it:
        // the field list settles arguments like "is alcohol still written when
        // tracking is off?" by inspection rather than by belief.
        const rows = (d.params.arguments && d.params.arguments.meals) || [];
        const fields = [...new Set(rows.flatMap((r) => Object.keys(r)))];
        log("   " + rows.length + " rows, fields: " + fields.join(",") +
            " | alcohol_g on " + rows.filter((r) => r.alcohol_g != null).length + " row(s)");
        try {
          const r = await fetch("/tool/bulk_import_meals", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(d.params.arguments || {}),
          });
          const sc = await r.json();
          send({ jsonrpc: "2.0", id: d.id, result: {
            content: [{ type: "text", text: "see structuredContent" }],
            structuredContent: sc,
          }});
          log("-> real import result id " + d.id + ": status=" + sc.status +
              " created=" + sc.summary.created + " dedup=" + sc.summary.deduplicated +
              " failed=" + sc.summary.failed + (sc.dry_run ? " (dry run)" : ""));
        } catch (e) {
          send({ jsonrpc: "2.0", id: d.id, error: { code: -32603, message: String(e) } });
          log("-> error for id " + d.id + ": " + e);
        }
        return;
      }
      send({ jsonrpc: "2.0", id: d.id, result: {
        content: [{ type: "text", text: "harness canned result for " + name }],
        ...toolResultParams(),
      }});
      log("-> result for id " + d.id + (CFG.delay ? " after " + CFG.delay + "ms" : ""));
    }, CFG.delay);
    return;
  }

  // App answering one of OUR requests.
  if (d.id != null && d.method === undefined) {
    log("<- app answered id " + d.id + " " + JSON.stringify(d.result || d.error));
    return;
  }
  log("<- (unhandled) " + JSON.stringify(d).slice(0, 160));
});
</script>
</body></html>`;
}

Bun.serve({
    port: PORT,
    async fetch(req) {
        const url = new URL(req.url);

        if (url.pathname === "/") {
            return new Response(indexPage(), {
                headers: { "content-type": "text/html; charset=utf-8" },
            });
        }
        if (url.pathname === "/host") {
            const widget = url.searchParams.get("widget") ?? KEYS[0]!;
            if (!KEYS.includes(widget)) {
                return new Response(`unknown widget: ${widget}`, {
                    status: 404,
                });
            }
            return new Response(hostPage(widget, url.searchParams), {
                headers: { "content-type": "text/html; charset=utf-8" },
            });
        }
        if (
            url.pathname === "/tool/bulk_import_meals" &&
            req.method === "POST"
        ) {
            const args = (await req.json()) as Parameters<typeof runImport>[0];
            const result = await runImport(args, {
                userId: "harness-user",
                tz: "Europe/Kyiv",
                tzConfigured: true,
                nowMs: Date.now(),
                insert: fakeInsert,
                async existingKeys(keys) {
                    return new Set(keys.filter((k) => store.has(k)));
                },
                async existingMealIds(ids) {
                    return new Set(ids.filter((id) => byId.has(id)));
                },
            });
            return Response.json(result);
        }
        if (url.pathname === "/tool/reset" && req.method === "POST") {
            store.clear();
            byId.clear();
            mealSeq = 0;
            return Response.json({ ok: true, cleared: true });
        }
        if (url.pathname.startsWith("/widget/")) {
            const key = decodeURIComponent(
                url.pathname.slice("/widget/".length),
            );
            if (!KEYS.includes(key)) {
                return new Response(`unknown widget: ${key}`, { status: 404 });
            }
            // Same CSP the MCP Apps sandbox applies, so a widget that reaches
            // for the network here fails here too.
            return new Response(await getWidgetHtml(key), {
                headers: {
                    "content-type": "text/html; charset=utf-8",
                    "content-security-policy":
                        "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:",
                },
            });
        }
        return new Response("not found", { status: 404 });
    },
});

console.log(`widget harness on http://localhost:${PORT}`);
console.log(`widgets: ${KEYS.join(", ")}`);
