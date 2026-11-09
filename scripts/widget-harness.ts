// Strict local MCP Apps host for visual and interaction testing.
//
//   bun run scripts/widget-harness.ts
//
// It starts widgets inline, supports ui/request-display-mode, responds to
// ui/message/update-model-context, and exercises app-initiated tool calls.

import { getWidgetHtml, WIDGET_TEMPLATES } from "../src/widgets.js";

const PORT = Number(process.env.HARNESS_PORT ?? 8787);
const KEYS = Object.keys(WIDGET_TEMPLATES);

const goals = {
    calories: 2200,
    protein_g: 160,
    carbs_g: 220,
    fat_g: 70,
    fiber_g: 30,
    sugar_g: 45,
    alcohol_g: null,
    water_ml: 2500,
};
const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 6, 17 + index));
    const wave = Math.sin(index / 3);
    return {
        date: date.toISOString().slice(0, 10),
        meal_count: index % 8 === 0 ? 0 : 3,
        calories: index % 8 === 0 ? 0 : Math.round(2020 + wave * 240),
        protein_g: index % 8 === 0 ? 0 : Math.round(145 + wave * 18),
        carbs_g: index % 8 === 0 ? 0 : Math.round(210 + wave * 25),
        fat_g: index % 8 === 0 ? 0 : Math.round(68 + wave * 8),
        fiber_g: index % 8 === 0 ? 0 : Math.round((26 + wave * 4) * 10) / 10,
        sugar_g: index % 8 === 0 ? 0 : Math.round((48 + wave * 8) * 10) / 10,
        alcohol_g: null,
        water_ml: index % 8 === 0 ? 0 : Math.round(2050 + wave * 300),
    };
});
const meals = [
    {
        description: "Overnight oats with berries",
        meal_type: "breakfast",
        calories: 430,
        protein_g: 19,
        carbs_g: 63,
        fat_g: 12,
    },
    {
        description: "Grilled chicken and rice bowl",
        meal_type: "lunch",
        calories: 650,
        protein_g: 52,
        carbs_g: 78,
        fat_g: 16,
    },
    {
        description: "Salmon with vegetables",
        meal_type: "dinner",
        calories: 720,
        protein_g: 55,
        carbs_g: 44,
        fat_g: 34,
    },
];

const RESULTS: Record<string, unknown> = {
    "meal-logged": {
        action: "logged",
        date: "2026-08-18",
        logged_meal: {
            description: "Starbucks Medicine Ball Tea, Venti",
            meal_type: "snack",
            calories: 130,
            protein_g: 0,
            carbs_g: 33,
            fat_g: 0,
        },
        meal_items: [
            {
                id: "sample-starbucks-1",
                position: 0,
                name: "Starbucks Medicine Ball Tea",
                quantity: 1,
                portion_label: "Venti (20 fl oz)",
                gram_weight: null,
                nutrients: {
                    calories: 130,
                    protein_g: 0,
                    carbs_g: 33,
                    fat_g: 0,
                    fiber_g: 0,
                    sugar_g: 30,
                    alcohol_g: null,
                    sodium_mg: null,
                    saturated_fat_g: null,
                    cholesterol_mg: null,
                    potassium_mg: null,
                },
                source_type: "published_restaurant",
                provider: "starbucks",
                provider_food_id: "medicine-ball-venti",
                provider_revision: null,
                source_url: null,
                source_updated_at: null,
                confidence: 0.98,
                assumptions: [],
                source_snapshot: {
                    resolution_layer: "published_restaurant",
                },
            },
        ],
        has_goals: true,
        goals,
        totals: {
            calories: 1090,
            protein_g: 84,
            carbs_g: 126,
            fat_g: 33,
            fiber_g: 18,
            sugar_g: 42,
            alcohol_g: null,
            water_ml: 1600,
        },
    },
    "meal-review": {
        id: "review-123",
        version: 1,
        status: "awaiting_confirmation",
        source_mode: "photo",
        meal_type: "dinner",
        description: "Homemade chicken, rice, and vegetables",
        ready_for_confirmation: true,
        items: [
            {
                name: "Roasted chicken thigh",
                portion_label: "1 medium thigh",
                nutrients: {
                    calories: 285,
                    protein_g: 28,
                    carbs_g: 0,
                    fat_g: 19,
                },
                source_type: "model_estimate",
                confidence: 0.84,
                assumptions: ["Fork used as the scale reference"],
            },
            {
                name: "Rice",
                portion_label: "about 1 cup",
                nutrients: {
                    calories: 205,
                    protein_g: 4,
                    carbs_g: 45,
                    fat_g: 0.4,
                },
                source_type: "model_estimate",
                confidence: 0.58,
                assumptions: [],
            },
        ],
        totals: {
            calories: 490,
            protein_g: 32,
            carbs_g: 45,
            fat_g: 19.4,
        },
        assumptions: ["Fork used as the primary scale reference"],
    },
    "goal-progress": {
        date: "2026-08-05",
        meal_count: 4,
        water_entries: 6,
        goals,
        totals: {
            calories: 1980,
            protein_g: 148,
            carbs_g: 231,
            fat_g: 74,
            fiber_g: 24.6,
            sugar_g: 51,
            alcohol_g: null,
            water_ml: 2100,
        },
        weight: {
            current: 174.2,
            target: 165,
            unit: "lb",
            logged_on: "2026-08-05",
        },
    },
    "nutrition-summary": {
        start_date: days[days.length - 7]!.date,
        end_date: days[days.length - 1]!.date,
        logged_days: 6,
        goals,
        averages: {
            calories: 2055,
            protein_g: 148,
            carbs_g: 212,
            fat_g: 72,
            fiber_g: 26,
            sugar_g: 49,
            alcohol_g: null,
            water_ml: 2110,
        },
        days: days.slice(-7),
        meals,
    },
    trends: { end_date: days.at(-1)!.date, default_range: 14, goals, days },
    "weight-trends": {
        end_date: days.at(-1)!.date,
        unit: "lb",
        target: 165,
        default_range: 30,
        days: days
            .filter((_, index) => index % 2 === 0)
            .map((day, index) => ({
                date: day.date,
                weight: 178.4 - index * 0.22,
            })),
    },
    "import-meals": {
        tz: "America/New_York",
        tz_configured: true,
        max_rows_per_call: 50,
        import_tool_name: "bulk_import_meals",
        known_source_apps: [
            "MyFitnessPal",
            "Cronometer",
            "Lose It!",
            "MacroFactor",
        ],
        drink_unit: null,
    },
    "cook-summary": {
        cook: {
            id: "00000000-0000-4000-8000-0000000000c1",
            title: "Smoked brisket",
            status: "finished",
            cook_date: "2026-08-02",
            notes: "Oak smoke, wrapped at the stall.",
        },
        dishes: [{ name: "Brisket" }, { name: "Burnt ends" }],
        updates: [],
        events: [
            {
                event_at: "2026-08-02T06:00:00Z",
                event_type: "started",
                note: "Brisket on the smoker",
                setpoint_temperature: 250,
                setpoint_unit: "F",
            },
            {
                event_at: "2026-08-02T09:15:00Z",
                event_type: "checked",
                note: "Bark setting up",
            },
            {
                event_at: "2026-08-02T12:30:00Z",
                event_type: "wrapped",
                note: "Wrapped in butcher paper",
                internal_temperature: 165,
                internal_unit: "F",
            },
            {
                event_at: "2026-08-02T15:40:00Z",
                event_type: "checked",
                note: "Probe sliding in",
            },
            {
                event_at: "2026-08-02T18:45:00Z",
                event_type: "finished",
                note: "Probe tender",
                internal_temperature: 203,
                internal_unit: "F",
            },
        ],
        outcomes: [
            {
                dish_id: null,
                written_feedback:
                    "Tender and juicy; bark held up after the wrap.",
                next_time_notes: "Rest a full hour before slicing.",
            },
        ],
        media: [],
    },
};

// Slice-1 state/longest fixtures for the Facts Panel port. Selected with
// ?fixture=<name> on the host page; the default RESULT above stays the
// primary fixture for each widget.
function coveredAverage(
    series: typeof days,
    key:
        | "calories"
        | "protein_g"
        | "carbs_g"
        | "fat_g"
        | "fiber_g"
        | "sugar_g"
        | "water_ml",
): number {
    const logged = series.filter((day) => day.meal_count > 0);
    const mean =
        logged.reduce((sum, day) => sum + (day[key] ?? 0), 0) / logged.length;
    return key === "calories" || key === "water_ml"
        ? Math.round(mean)
        : Math.round(mean * 10) / 10;
}

const GOALS_TEXT = [
    "Current daily goals:",
    "- Calories: 2200 kcal",
    "- Protein: 160g",
    "- Carbs: 220g",
    "- Fat: 70g",
    "- Fiber: 30g",
    "- Sugar (total, max): 45g",
    "- Water: 2500 ml",
    "- Target weight: 165 lb",
].join("\n");

const FIXTURES: Record<string, Record<string, unknown>> = {
    "nutrition-summary": {
        // Longest realistic payload: the full 30-day series. Averages are
        // computed from the series here so fixture arithmetic is exact.
        long: {
            start_date: days[0]!.date,
            end_date: days[days.length - 1]!.date,
            logged_days: days.filter((day) => day.meal_count > 0).length,
            goals,
            averages: {
                calories: coveredAverage(days, "calories"),
                protein_g: coveredAverage(days, "protein_g"),
                carbs_g: coveredAverage(days, "carbs_g"),
                fat_g: coveredAverage(days, "fat_g"),
                fiber_g: coveredAverage(days, "fiber_g"),
                sugar_g: coveredAverage(days, "sugar_g"),
                alcohol_g: null,
                water_ml: coveredAverage(days, "water_ml"),
            },
            recorded_days: {
                fiber_g: days.filter((day) => day.meal_count > 0).length,
                sugar_g: days.filter((day) => day.meal_count > 0).length,
                alcohol_g: null,
            },
            days,
            meals,
        },
        empty: {
            start_date: days[0]!.date,
            end_date: days[6]!.date,
            logged_days: 0,
            goals,
            averages: {
                calories: 0,
                protein_g: 0,
                carbs_g: 0,
                fat_g: 0,
                fiber_g: 0,
                sugar_g: 0,
                alcohol_g: null,
                water_ml: 0,
            },
            days: [],
            meals: [],
        },
        error: { error: "The summary could not be read. Try again in chat." },
    },
    "goal-progress": {
        // The goals tools are text-output tools; this is the exact payload
        // shape their binding delivers ({ text } from formatGoals).
        targets: { text: GOALS_TEXT },
        "targets-updated": {
            text: `Goals updated.\n\n${GOALS_TEXT}`,
        },
        "targets-empty": {
            text: "No nutrition goals set. Use set_nutrition_goals to define daily targets.",
        },
        empty: {
            date: "2026-08-05",
            meal_count: 0,
            water_entries: 0,
            goals,
            totals: {
                calories: 0,
                protein_g: 0,
                carbs_g: 0,
                fat_g: 0,
                fiber_g: 0,
                sugar_g: 0,
                alcohol_g: null,
                water_ml: 0,
            },
            weight: null,
            meals: [],
        },
        error: { error: "Goal progress could not be read. Try again in chat." },
    },
    trends: {
        // Longest realistic payload: the full 30-day series at a 30-day
        // default range (the height-gate fixture for the fold).
        long: {
            end_date: days[days.length - 1]!.date,
            default_range: 30,
            goals,
            days,
        },
        // Partial coverage: a 14-day window with two explicit gap days
        // (zeroed rows, as buildDailyBuckets emits for unlogged days).
        gap: {
            end_date: days[days.length - 1]!.date,
            default_range: 14,
            goals,
            days: days.slice(-14).map((day, index) =>
                index === 3 || index === 9
                    ? {
                          ...day,
                          meal_count: 0,
                          calories: 0,
                          protein_g: 0,
                          carbs_g: 0,
                          fat_g: 0,
                          fiber_g: 0,
                          sugar_g: 0,
                          water_ml: 0,
                      }
                    : day,
            ),
        },
        empty: {
            end_date: days[days.length - 1]!.date,
            default_range: 14,
            goals,
            days: [],
        },
        error: { error: "Trends could not be read. Try again in chat." },
    },
    "weight-trends": {
        // Longest realistic payload: a weigh-in on each of 30 days.
        long: {
            end_date: days[days.length - 1]!.date,
            unit: "lb",
            target: 165,
            default_range: 30,
            days: days.map((day, index) => ({
                date: day.date,
                weight: Math.round((178.4 - index * 0.22) * 10) / 10,
            })),
        },
        empty: {
            end_date: days[days.length - 1]!.date,
            unit: "lb",
            target: 165,
            default_range: 30,
            days: [],
        },
        single: {
            end_date: days[days.length - 1]!.date,
            unit: "lb",
            target: 165,
            default_range: 30,
            days: [{ date: days[days.length - 1]!.date, weight: 172.3 }],
        },
        nogoal: {
            end_date: days[days.length - 1]!.date,
            unit: "lb",
            target: null,
            default_range: 30,
            days: days
                .filter((_, index) => index % 2 === 0)
                .map((day, index) => ({
                    date: day.date,
                    weight: 178.4 - index * 0.22,
                })),
        },
        // get_weight_by_date_range is a text-output tool; this is the exact
        // payload shape its binding delivers ({ text } in the server's
        // per-day listing format, one multi-entry day included).
        range: {
            text: [
                "## 2026-07-27",
                "- 178.4 lb at 2026-07-27T11:30:00.000Z [id: w-1]",
                "",
                "## 2026-07-29 (avg 177.9 lb, 2 entries)",
                "- 178.2 lb at 2026-07-29T11:30:00.000Z [id: w-2]",
                "- 177.6 lb at 2026-07-29T23:30:00.000Z [id: w-3]",
                "",
                "## 2026-08-02",
                "- 176.8 lb at 2026-08-02T11:30:00.000Z [id: w-4]",
                "",
                "## 2026-08-05",
                "- 175.9 lb at 2026-08-05T11:30:00.000Z [id: w-5]",
            ].join("\n"),
        },
        "range-empty": {
            text: "No weight found between 2026-07-07 and 2026-08-05.",
        },
        error: {
            error: "Weight trends could not be read. Try again in chat.",
        },
    },
    "cook-summary": {
        // Longest realistic payload: 12 timeline events + 4 photos.
        // Inline must carry only the last 5 events; the photo grid and
        // full timeline are fullscreen-only. Result line = written_feedback.
        long: {
            cook: {
                id: "00000000-0000-4000-8000-0000000000c2",
                title: "Low-and-slow pork shoulder for the family cookout",
                status: "finished",
                cook_date: "2026-08-09",
                notes: "Hickory and oak.",
            },
            dishes: [
                {
                    name: "Pork shoulder",
                    method: "smoked",
                    equipment: "offset smoker",
                },
                { name: "Slaw" },
            ],
            updates: [],
            events: Array.from({ length: 12 }, (_, i) => ({
                event_at: `2026-08-09T${String(5 + i).padStart(2, "0")}:05:00Z`,
                event_type: [
                    "started",
                    "checked",
                    "spritzed",
                    "checked",
                    "wrapped",
                    "checked",
                    "checked",
                    "rested",
                    "checked",
                    "pulled",
                    "sauced",
                    "finished",
                ][i],
                note: `Step ${i + 1} of the cook`,
                internal_temperature: i === 11 ? 205 : undefined,
                internal_unit: i === 11 ? "F" : undefined,
            })),
            outcomes: [
                {
                    dish_id: null,
                    written_feedback: "Pulled clean, still juicy at serving.",
                    next_time_notes: "Start an hour earlier next time.",
                },
            ],
            media: [1, 2, 3, 4].map((n) => ({
                url: `https://munch.business/cook-photos/long-${n}.jpg`,
                caption: `Cook photo ${n}`,
                file_name: `long-${n}.jpg`,
            })),
        },
        // NEW empty state: zero-result search_cooks (audit Fix / slice 4).
        "empty-search": { cooks: [] },
        search: {
            cooks: [
                {
                    title: "Smoked brisket",
                    cook_date: "2026-08-02",
                    status: "finished",
                },
                {
                    title: "Weeknight chicken",
                    cook_date: "2026-07-27",
                    status: "finished",
                },
                {
                    title: "Ribs, first attempt",
                    cook_date: "2026-07-19",
                    status: "finished",
                },
            ],
        },
        // finish_cook payload shape: { cook: <record> } only.
        finish: {
            cook: {
                id: "00000000-0000-4000-8000-0000000000c3",
                title: "Weeknight chicken",
                status: "finished",
                cook_date: "2026-08-10",
            },
        },
        // Partial state: the cook saved, two photos need a retry.
        "photo-fail": {
            cook_id: "00000000-0000-4000-8000-0000000000c4",
            recorded: true,
            media_failures: [
                {
                    file_name: "IMG_2041.jpg",
                    message: "The photo was not saved: download failed",
                },
                {
                    file_name: "IMG_2042.jpg",
                    message: "The photo was not saved: download failed",
                },
            ],
            cook: {
                cook: {
                    id: "00000000-0000-4000-8000-0000000000c4",
                    title: "Ribs, second attempt",
                    status: "active",
                    cook_date: "2026-08-11",
                    notes: "",
                },
                dishes: [{ name: "Spare ribs" }],
                updates: [],
                events: [
                    {
                        event_at: "2026-08-11T10:00:00Z",
                        event_type: "started",
                        note: "Ribs on",
                    },
                ],
                outcomes: [],
                media: [],
            },
        },
        error: { error: "The cook could not be read. Try again in chat." },
    },
    "import-meals": {
        // bulk_import_meals direct payload (Fix 6): 8 rows -> 5 created,
        // 1 deduplicated, 2 failed with per-row errors, 1 skipped by caller.
        results: {
            status: "partial_success",
            dry_run: false,
            summary: {
                total: 8,
                created: 5,
                deduplicated: 1,
                would_create: 0,
                failed: 2,
                not_attempted: 0,
                duplicate_rows_in_file: 0,
                rows_without_calories: 1,
                skipped_by_caller: 1,
            },
            warnings: [
                "1 row(s) had no meal type in the source; it was inferred from the time of day.",
            ],
            results: [
                ...[2, 3, 4, 5, 6].map((line, i) => ({
                    index: i,
                    source_line: line,
                    client_row_id: null,
                    status: "created",
                    meal_id: `m-${line}`,
                    description: `Meal ${line}`,
                    logged_at: "2026-08-01T12:00:00Z",
                    meal_type: "lunch",
                    meal_type_inferred: false,
                    description_synthesized: false,
                    logged_at_from_bare_date: false,
                    error: null,
                })),
                {
                    index: 5,
                    source_line: 7,
                    client_row_id: null,
                    status: "deduplicated",
                    meal_id: "m-7",
                    description: "Meal 7",
                    logged_at: "2026-08-01T18:00:00Z",
                    meal_type: "dinner",
                    meal_type_inferred: false,
                    description_synthesized: false,
                    logged_at_from_bare_date: false,
                    error: null,
                },
                {
                    index: 6,
                    source_line: 8,
                    client_row_id: null,
                    status: "failed",
                    meal_id: null,
                    description: null,
                    logged_at: null,
                    meal_type: null,
                    meal_type_inferred: false,
                    description_synthesized: false,
                    logged_at_from_bare_date: false,
                    error: {
                        code: "invalid_logged_at",
                        field: "logged_at",
                        message:
                            "logged_at is invalid: that calendar date does not exist",
                        suggested_fix: "Check for a day/month swap.",
                        retryable: true,
                    },
                },
                {
                    index: 7,
                    source_line: 9,
                    client_row_id: null,
                    status: "failed",
                    meal_id: null,
                    description: null,
                    logged_at: null,
                    meal_type: null,
                    meal_type_inferred: false,
                    description_synthesized: false,
                    logged_at_from_bare_date: false,
                    error: {
                        code: "missing_description",
                        field: "description",
                        message:
                            "description is required and could not be synthesized",
                        suggested_fix: "Map a food-name column.",
                        retryable: true,
                    },
                },
            ],
        },
    },
};

function indexPage(): string {
    return `<!doctype html><html><head><meta charset="utf-8"><title>Munch widget harness</title><style>body{font:14px/1.5 system-ui;margin:32px;max-width:760px}li{margin:6px 0}</style></head><body><h1>Munch widget harness</h1><ul>${KEYS.map((key) => `<li><a href="/host?widget=${encodeURIComponent(key)}">${key}</a></li>`).join("")}</ul></body></html>`;
}

function hostPage(widget: string, fixture?: string): string {
    const result = (fixture ? FIXTURES[widget]?.[fixture] : undefined) ??
        RESULTS[widget] ?? { probe: true };
    return `<!doctype html><html><head><meta charset="utf-8"><title>${widget}</title><style>
body{margin:0;background:#f3f3f3;font:13px/1.4 system-ui;color:#222}.bar{position:sticky;top:0;z-index:2;display:flex;gap:8px;align-items:center;padding:8px 12px;background:#fff;border-bottom:1px solid #ddd}.bar span{color:#666}.stage{padding:12px}.frame{display:block;width:100%;height:150px;border:0;background:transparent}.stage.fullscreen{position:fixed;inset:0;z-index:5;padding:0;background:#fff}.stage.fullscreen .frame{height:100vh}.log{position:fixed;right:8px;bottom:8px;z-index:8;width:min(440px,calc(100vw - 16px));max-height:140px;overflow:auto;padding:8px;border-radius:8px;background:#111;color:#b7ffbf;font:10px/1.4 ui-monospace,monospace;white-space:pre-wrap;opacity:.88}</style></head><body>
<div class="bar"><strong>${widget}</strong><span>strict MCP Apps host</span><button id="theme">Toggle theme</button></div>
<div class="stage" id="stage"><iframe class="frame" id="frame" sandbox="allow-scripts" src="/widget/${encodeURIComponent(widget)}"></iframe></div><div class="log" id="log">host ready</div>
<script>
const RESULT=${JSON.stringify(result)};const frame=document.getElementById("frame");const stage=document.getElementById("stage");const logEl=document.getElementById("log");let theme="light";let mode="inline";const log=(text)=>{logEl.textContent+="\\n"+text;logEl.scrollTop=logEl.scrollHeight};const send=(message)=>frame.contentWindow.postMessage(message,"*");
document.getElementById("theme").onclick=()=>{theme=theme==="light"?"dark":"light";send({jsonrpc:"2.0",method:"ui/notifications/host-context-changed",params:{hostContext:{theme,displayMode:mode,availableDisplayModes:["inline","fullscreen"]}}})};
window.addEventListener("message",async(event)=>{if(event.source!==frame.contentWindow)return;const data=event.data;if(!data||typeof data!=="object")return;
if(data.method==="ui/initialize"){log("initialize "+JSON.stringify({appInfo:data.params?.appInfo,appCapabilities:data.params?.appCapabilities}));send({jsonrpc:"2.0",id:data.id,result:{protocolVersion:"2026-01-26",hostInfo:{name:"munch-harness",version:"2.0.0"},hostCapabilities:{serverTools:{}},hostContext:{theme,displayMode:mode,availableDisplayModes:["inline","fullscreen"]}}});return}
if(data.method==="ui/notifications/initialized"){log("initialized; delivering result");send({jsonrpc:"2.0",method:"ui/notifications/tool-result",params:{structuredContent:RESULT}});return}
if(data.method==="ui/notifications/size-changed"){if(mode==="inline")frame.style.height=Math.max(80,data.params?.height||150)+"px";return}
if(data.method==="ui/request-display-mode"){mode=data.params?.mode==="fullscreen"?"fullscreen":"inline";stage.classList.toggle("fullscreen",mode==="fullscreen");if(mode==="fullscreen")frame.style.height="";log("display mode -> "+mode);send({jsonrpc:"2.0",id:data.id,result:{displayMode:mode}});send({jsonrpc:"2.0",method:"ui/notifications/host-context-changed",params:{hostContext:{theme,displayMode:mode,availableDisplayModes:["inline","fullscreen"]}}});return}
if(data.method==="ui/message"){log("message: "+(data.params?.content?.[0]?.text||""));send({jsonrpc:"2.0",id:data.id,result:{}});return}
if(data.method==="ui/update-model-context"){log("context: "+(data.params?.content?.[0]?.text||""));send({jsonrpc:"2.0",id:data.id,result:{}});return}
if(data.method==="tools/call"){const name=data.params?.name;log("tool call: "+name);let structuredContent={};if(name==="confirm_meal_draft")structuredContent={status:"confirmed"};else if(name==="bulk_import_meals"){const args=data.params?.arguments||{};structuredContent={status:"success",dry_run:!!args.dry_run,summary:{created:args.dry_run?0:(args.meals||[]).length,deduplicated:0,failed:0},results:(args.meals||[]).map((row,index)=>({index,source_line:row.source_line,status:args.dry_run?"would_create":"created"}))}}send({jsonrpc:"2.0",id:data.id,result:{content:[{type:"text",text:"ok"}],structuredContent}});return}
if(data.id!=null)send({jsonrpc:"2.0",id:data.id,result:{}})
});
</script></body></html>`;
}

Bun.serve({
    port: PORT,
    async fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === "/") {
            return new Response(indexPage(), {
                headers: { "content-type": "text/html; charset=utf-8" },
            });
        }
        if (url.pathname === "/host") {
            const widget = url.searchParams.get("widget") || KEYS[0]!;
            const fixture = url.searchParams.get("fixture") || undefined;
            return new Response(hostPage(widget, fixture), {
                headers: { "content-type": "text/html; charset=utf-8" },
            });
        }
        if (url.pathname.startsWith("/widget/")) {
            const widget = decodeURIComponent(url.pathname.slice(8));
            try {
                return new Response(await getWidgetHtml(widget), {
                    headers: { "content-type": "text/html; charset=utf-8" },
                });
            } catch (error) {
                return new Response(String(error), { status: 404 });
            }
        }
        return new Response("not found", { status: 404 });
    },
});

console.log(`Munch widget harness: http://localhost:${PORT}`);
