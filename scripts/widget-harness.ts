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
//
// The canned tool result each widget is handed is checked against that tool's
// REAL outputSchema before the server starts (assertFixturesMatchSchemas): a
// fixture that has drifted aborts the harness instead of quietly exercising a
// widget's fallback path while someone signs a layout off on it.
//
// Nothing here is served by the production app; scripts/ is dev-only.

import { McpServer } from "@modelcontextprotocol/server";
import { getWidgetHtml, WIDGET_TEMPLATES } from "../src/widgets.js";
import { registerTools } from "../src/mcp.js";
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
     <code>?maxHeight=600</code>, <code>?fail=1</code>, <code>?drinkUnit=us</code>.</p>
  <ul>${links}</ul>
</body></html>`;
}

type DrinkUnit = "us" | "uk";

// ---------------------------------------------------------------------------
// Canned tool results, one per widget.
//
// One shared fixture does NOT work: each widget's coerce() checks for its own
// shape, so a payload shaped for goal-progress leaves trends stuck on
// "Loading…" — which looks exactly like a broken handshake.
//
// These are checked against the tools' REAL outputSchemas at startup (see
// assertFixturesMatchSchemas below). They had silently drifted off them — the
// trends fixture sent `range_days` where the tool sends `default_range`, and
// weight-trends sent no `target` at all, so the dashed target line and the
// whole second `.cfoot` phrase never rendered here. A German clipping bug in
// exactly that phrase reached an audit instead of the harness. Since the
// harness is the surface heights and layouts are signed off on, a fixture that
// is not schema-valid is a review that measured the wrong thing.
// ---------------------------------------------------------------------------
function buildResults(
    drinkUnit: DrinkUnit | null,
    macroDrinkUnit: DrinkUnit,
): Record<string, unknown> {
    // One day of the daily series both get_nutrition_summary and get_trends
    // emit. Shaped for TRENDS_DAY_ITEM (the looser of the two: fiber/sugar
    // nullable there, plain numbers in the summary — a number satisfies both).
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
    // Deterministic, mildly spiky pseudo-series. get_trends and
    // get_weight_trends both send up to 30 days regardless of the text window
    // (`allBuckets.slice(-30)` / `seriesCutoff`) because their widgets slice
    // 7/14/30 client-side — so a 7-day fixture made the 14 and 30 toggles
    // repaint identical charts and hid every range-dependent bug.
    const END_DATE = "2026-07-15";
    const seriesDate = (i: number) =>
        new Date(Date.UTC(2026, 5, 16) + i * 86400000)
            .toISOString()
            .slice(0, 10);
    const seriesDays = Array.from({ length: 30 }, (_, i) =>
        day(seriesDate(i), 1875 + ((i * 137) % 500)),
    );
    // The summary's own window is the last 7 of those, so its header reads a
    // 7-day range while `logged_days`/`days_in_range` stay consistent with it.
    const days = seriesDays.slice(-7);
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
    // Per-meal breakdown rows: what makes the panel's chips tappable.
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

    return {
        // get_nutrition_summary
        "nutrition-summary": {
            start_date: days[0]!.date,
            end_date: END_DATE,
            logged_days: days.length,
            // Every day in the window is logged, so this previews the no-gap
            // caption. The gappy branch (where the header reads "3 of 30 days
            // logged") is pinned by public/widgets/summary-caption.test.ts;
            // raise days_in_range here if you want to eyeball it.
            days_in_range: days.length,
            drink_unit: macroDrinkUnit,
            locale: "en",
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
            // The denominators behind `averages` for the post-launch
            // nutrients. Caffeine is deliberately short of the window (the
            // series has null caffeine days), which is the whole reason this
            // field exists.
            recorded_days: {
                fiber_g: days.length,
                sugar_g: days.length,
                alcohol_g: days.length,
                caffeine_mg: days.filter((d) => d.caffeine_mg != null).length,
            },
            // The summary's day rows carry a meal_count the trends series
            // does not.
            days: days.map((d) => ({ ...d, meal_count: 4 })),
            meals: meals.map((m, i) => ({ ...m, date: days[i]!.date })),
        },
        // get_goal_progress
        "goal-progress": {
            date: END_DATE,
            meal_count: 4,
            water_entries: 6,
            drink_unit: macroDrinkUnit,
            locale: "en",
            goals,
            totals,
            // Populated on purpose: a null weight is the branch where the
            // `.more` weight row never renders, and an unrendered row is an
            // unreviewed one. Reading + target is the richest of the four
            // weight states (the drawer paints a track, not a prompt).
            weight: {
                current: 78.4,
                target: 75,
                unit: "kg",
                logged_on: "2026-07-14",
            },
            // Deliberately empty, so one macro widget covers the strip's
            // static path: with no per-meal rows behind them, no chip is a
            // button, the "tap a metric" hint is absent and every chip reads
            // as the plain figure it always was. The interactive path is
            // meal-logged and nutrition-summary above, which carry meals.
            meals: [],
        },
        // log_meal / update_meal (both declare MEAL_PROGRESS_OUTPUT_SCHEMA)
        "meal-logged": {
            action: "logged",
            date: END_DATE,
            // Alcohol tracking OFF for this one, so the panel must show no
            // alcohol chip at all (null, not 0) — while the caffeine chip
            // stays, which is the point: caffeine has no opt-in flag, only the
            // data-driven null.
            drink_unit: null,
            locale: "en",
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
            goals: { ...goals, alcohol_g: null },
            totals: { ...totals, alcohol_g: null },
            meals: mealsNoAlcohol,
        },
        // get_trends
        trends: {
            end_date: END_DATE,
            // Which toggle the widget opens on. `range_days` here was the
            // drift: the template reads `default_range`, so the seg opened on
            // its own fallback rather than on what the tool chose.
            default_range: 7,
            drink_unit: macroDrinkUnit,
            locale: "en",
            goals,
            days: seriesDays,
        },
        // get_weight_trends
        "weight-trends": {
            end_date: END_DATE,
            unit: "kg",
            // Populated on purpose: with target null the dashed target line
            // and the entire second `.cfoot` phrase ("Target 75.0 kg · 2.0 kg
            // to go") never paint — the exact string that was found clipping
            // in German at 320px, invisible here for as long as this was null.
            target: 75,
            default_range: 7,
            locale: "en",
            days: seriesDays.map((d, i) => ({
                date: d.date,
                // Gentle downward drift with noise, so 7/14/30 differ.
                weight:
                    Math.round((79.6 - i * 0.06 + (i % 3) * 0.15) * 10) / 10,
            })),
        },
        // start_meal_import
        "import-meals": {
            tz: "Europe/Kyiv",
            tz_configured: true,
            today: END_DATE,
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
            locale: "en",
        },
    };
}

// Which tool's outputSchema each widget's fixture must satisfy. component-gallery
// and any probe key are absent on purpose: no tool renders them.
const FIXTURE_TOOL: Record<string, string> = {
    "nutrition-summary": "get_nutrition_summary",
    "goal-progress": "get_goal_progress",
    "meal-logged": "log_meal",
    trends: "get_trends",
    "weight-trends": "get_weight_trends",
    "import-meals": "start_meal_import",
};

// Pull the tools' REAL outputSchemas by registering them against a throwaway
// McpServer and intercepting registerTool. Nothing is restated here — no copy
// of a field list to fall out of date, which is the failure this whole check
// exists to make impossible.
function collectOutputSchemas(): Map<string, { parse(v: unknown): unknown }> {
    const server = new McpServer(
        { name: "widget-harness", version: "0.0.0" },
        { capabilities: { tools: {}, resources: {} } },
    );
    const schemas = new Map<string, { parse(v: unknown): unknown }>();
    const original = server.registerTool.bind(server);
    (server as unknown as { registerTool: unknown }).registerTool = (
        name: string,
        config: { outputSchema?: { parse(v: unknown): unknown } },
        handler: unknown,
    ) => {
        if (config?.outputSchema) schemas.set(name, config.outputSchema);
        return (original as unknown as (...a: unknown[]) => unknown)(
            name,
            config,
            handler,
        );
    };
    // widgetsEnabled true, alcohol null: neither affects an outputSchema, which
    // is static per tool.
    registerTools(server, "harness-user", true, null);
    return schemas;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);

// Every key `parse()` DROPPED, at any depth, as a dotted path.
//
// This is the whole point of the guard and it used to stop at depth 1. Zod's
// z.object() strips unknown keys rather than rejecting them at EVERY level, so
// a top-level-only diff sees `range_days` (the original drift) but not a stale
// field inside `days[]`, `series[]`, `weight` or `summary` — the fixture would
// still parse, still look meaningful in the served HTML, and the widget would
// still never receive it. That is the same class of drift the guard exists to
// make impossible, so it has to walk.
//
// Array indices collapse to `[]` and paths are de-duplicated: a stale field on
// all 30 days of a series is one problem to fix, not thirty lines of output.
//
// What it deliberately does NOT catch, so nobody reads more into a green boot
// than is there: a key whose VALUE the schema rewrote rather than dropped (a
// z.coerce, a .default(), a .transform()) survives this check, because the key
// is still present after parse(). Only presence is compared.
function droppedKeys(
    fixture: unknown,
    parsed: unknown,
    path = "",
    out = new Set<string>(),
): Set<string> {
    if (Array.isArray(fixture)) {
        if (!Array.isArray(parsed)) return out;
        const n = Math.min(fixture.length, parsed.length);
        for (let i = 0; i < n; i++)
            droppedKeys(fixture[i], parsed[i], `${path}[]`, out);
        return out;
    }
    if (isPlainObject(fixture)) {
        if (!isPlainObject(parsed)) return out;
        for (const [key, value] of Object.entries(fixture)) {
            const where = path ? `${path}.${key}` : key;
            if (!(key in parsed)) out.add(where);
            else droppedKeys(value, parsed[key], where, out);
        }
        return out;
    }
    return out;
}

// Fail loudly at startup rather than serving a fixture that exercises fallback
// paths. Every drink_unit branch is checked, because the fixtures differ by it.
function assertFixturesMatchSchemas(): void {
    const schemas = collectOutputSchemas();
    const problems: string[] = [];
    for (const drinkUnit of [null, "us", "uk"] as const) {
        const results = buildResults(drinkUnit, drinkUnit ?? "us");
        for (const [widget, toolName] of Object.entries(FIXTURE_TOOL)) {
            const schema = schemas.get(toolName);
            if (!schema) {
                problems.push(
                    `${widget}: ${toolName} declares no outputSchema (renamed tool?)`,
                );
                continue;
            }
            const fixture = results[widget];
            try {
                const parsed = schema.parse(fixture);
                // parse() succeeding is not enough: z.object() STRIPS unknown
                // keys rather than rejecting them, so a stale field survives
                // the parse and is simply gone by the time the widget renders.
                // droppedKeys() walks the whole tree for them.
                const extra = [...droppedKeys(fixture, parsed)];
                if (extra.length) {
                    problems.push(
                        `${widget}: field(s) not in ${toolName}'s outputSchema: ${extra.join(", ")}`,
                    );
                }
            } catch (err) {
                problems.push(
                    `${widget} (drink_unit=${drinkUnit}) fails ${toolName}'s outputSchema:\n    ${String(
                        err instanceof Error ? err.message : err,
                    )
                        .split("\n")
                        .join("\n    ")}`,
                );
            }
        }
    }
    if (problems.length) {
        console.error(
            `\nharness fixtures are not schema-valid:\n\n${problems.join("\n\n")}\n`,
        );
        process.exit(1);
    }
}

function hostPage(widget: string, params: URLSearchParams): string {
    const serverTools = params.get("serverTools") !== "0";
    const answerTools = params.get("tools") !== "0";
    const delay = Number(params.get("delay") ?? 0);
    const maxHeight = params.get("maxHeight");
    const failCalls = params.get("fail") === "1";
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

    // Per-widget canned tool results, built and schema-checked at startup.
    // See buildResults() / assertFixturesMatchSchemas() at module level.
    const RESULTS = buildResults(drinkUnit, macroDrinkUnit);
    // Probe and gallery paint their own UI; anything non-null will do.
    const toolResult = RESULTS[widget] ?? { probe: true };

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
  <span class="cfg">serverTools=${serverTools} answerTools=${answerTools} delay=${delay}ms${maxHeight ? " maxHeight=" + maxHeight : ""}${failCalls ? " fail=1" : ""} drinkUnit=${drinkUnit ?? "null (tracking off)"}</span>
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
           params: { structuredContent: TOOL_RESULT } });
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
        structuredContent: TOOL_RESULT,
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

// Before the first request, not on it: a drifted fixture must stop the harness,
// not quietly render a fallback path someone then signs a layout off on.
assertFixturesMatchSchemas();

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
