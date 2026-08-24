// Macro strip builder — shared by every widget that shows intake vs goal.
//
// Renders ONE compact block: the calorie ring beside its figure, three
// protein/carbs/fat bars, a "limits" row of the metrics you stay under
// (sugar, alcohol, caffeine) plus fiber, and the water line. It is not a card
// of its own — a widget drops it inside its single `.panel` under whatever top
// matter only that widget has (a chart, a range toggle, a weight line). Pairs
// with shared/macros.css (layout) and shared/ring.css (the gauge).
//
// Requires fmt(n, decimals) and esc(s) to already be defined in the widget scope.
//
// Data contract: `vals` and `goal` are plain objects keyed by macro
// (`calories`, `protein_g`, `carbs_g`, `fat_g`, `fiber_g`, `sugar_g`,
// `alcohol_g`, `caffeine_mg`, `water_ml`) — e.g. a day's totals, a range's
// averages, or a computed slice. Note that `caffeine_mg` is the ONE key not in
// grams, which is why the unit is in its name at every layer down to the DB
// column: a bare `caffeine` is how someone's 180 mg becomes 180 g.
// `wording` tunes the caption verb for the remaining amount on
// a FLOOR: { under: "left" | "under", over: "over" } (default "left" / "over").
// A ceiling ignores it — see macroBits.
//
// EVERY entry below must declare a `role`, because the strip is laid out BY
// ROLE and never by a hardcoded key list. A new entry therefore appears exactly
// where its role says it should — and an entry with no role (or an unknown one)
// renders nowhere at all rather than silently sprouting a fourth macro bar:
//
//   cal    the calorie gauge and its figure
//   macro  one of the three protein/carbs/fat bars
//   limit  one cell of the row under them — the metrics judged by a ceiling
//          you stay under, plus fiber, which shares the idiom because it is
//          read the same way ("21.8, of 30 g") even though it is a floor
//   bar    the full-width water line
//
// `direction` marks a target you stay UNDER rather than reach (mirrors
// GoalDirection in src/mcp.ts): exceeding a ceiling is flagged with --over,
// exceeding a floor is not.
//
// `signal` says what a 0 in the payload means, and so what earns a limit cell.
// "null" — the payload distinguishes never-recorded (null) from a recorded 0,
// so the null is the entire gate and a real 0 always shows. Only alcohol_g and
// caffeine_mg carry that signal (see totalsPayloadOf in src/mcp.ts).
// "data"  — TOTALS_ITEM types the metric as a plain number, so a day that
// recorded none of it is indistinguishable from a 0. The cell is earned by a
// value above zero or by a goal of the user's own, which is the same rule the
// carbs disclosure used when fiber and sugar lived inside it.
const MACROS = [
    {
        key: "calories",
        label: "Calories",
        unit: "kcal",
        color: "var(--calories)",
        decimals: 0,
        role: "cal",
    },
    {
        key: "protein_g",
        label: "Protein",
        unit: "g",
        color: "var(--protein)",
        decimals: 0,
        role: "macro",
    },
    {
        key: "carbs_g",
        label: "Carbs",
        unit: "g",
        color: "var(--carbs)",
        decimals: 0,
        role: "macro",
    },
    {
        key: "fat_g",
        label: "Fat",
        unit: "g",
        color: "var(--fat)",
        decimals: 0,
        role: "macro",
    },
    // Order within the row is the order they are read: the two breaches people
    // act on first, then caffeine, then the one floor.
    {
        key: "sugar_g",
        label: "Sugar",
        unit: "g",
        color: "var(--sugar)",
        decimals: 1,
        role: "limit",
        direction: "ceiling",
        signal: "data",
    },
    {
        key: "alcohol_g",
        label: "Alcohol",
        unit: "g",
        color: "var(--alcohol)",
        decimals: 1,
        role: "limit",
        direction: "ceiling",
        signal: "null",
        // Grams of ethanol mean nothing to most people, so the caption leads
        // with a drink count — see macroLimit. No other metric has a second
        // unit.
        gloss: "drinks",
    },
    {
        key: "caffeine_mg",
        label: "Caffeine",
        unit: "mg",
        color: "var(--caffeine)",
        // Whole milligrams. Every label and guideline is quoted that way (EFSA:
        // 400 mg/day), a tenth of a milligram is below anything anyone can act
        // on, and matching the model-facing text keeps "95 mg" one number in
        // both places. NOT a macro bar: caffeine carries zero kcal, so it must
        // never become a segment of an energy split.
        decimals: 0,
        role: "limit",
        direction: "ceiling",
        signal: "null",
    },
    {
        key: "fiber_g",
        label: "Fiber",
        unit: "g",
        color: "var(--fiber)",
        decimals: 1,
        role: "limit",
        signal: "data",
    },
    {
        key: "water_ml",
        label: "Water",
        unit: "ml",
        color: "var(--water)",
        decimals: 0,
        role: "bar",
    },
];

// The metrics that stand on their own as evidence that a day was logged at all
// — used by trends to count logged days. Derived from the roles so a new entry
// joins the test only if it is a top-level metric: fiber and sugar never appear
// without a meal that already contributes calories, and alcohol_g / caffeine_mg
// are null (not 0) on a day that recorded neither, so none of them belongs in
// the test.
const TOP_LEVEL_MACRO_KEYS = MACROS.filter(
    (m) => m.role === "cal" || m.role === "macro" || m.role === "bar",
).map((m) => m.key);

function dayHasData(day) {
    return TOP_LEVEL_MACRO_KEYS.some((k) => (day?.[k] || 0) > 0);
}

// The translated label for a metric, falling back to the English literal
// above if the current locale's dictionary (T, from shared/i18n.js) is
// somehow missing it. Not baked into the MACROS entries themselves: T is
// only resolved once the widget's locale is known (setLocale(), called from
// render()), which is after this module-level array is built.
function macroLabel(m) {
    return (T.macros.labels && T.macros.labels[m.key]) || m.label;
}

// Grams of pure ethanol per standard drink. Mirrors src/alcohol.ts (NIAAA:
// 14 g per US drink; NHS: one unit is 10 mL of ethanol = 7.893 g).
// Hand-copied rather than pulled in with @inlinets because src/widgets.test.ts
// requires every @include'd partial to appear VERBATIM in the assembled
// HTML, and a marker expanded inside this partial would break it. The unit
// NAMES ("US drinks" / "UK units") come from T.macros.drinkLabels instead of
// a sibling constant here, since — unlike the gram figures — they are
// user-visible text.
const DRINK_GRAMS = { us: 14, uk: 7.893 };

// value vs goal → filled fraction, the target caption, the remaining-amount
// caption, and the ring's centre. Bars and rings keep their metric colour even
// past 100% so the series stay distinct; only the figure turns red to flag
// going over a ceiling.
function macroBits(m, vals, goal, wording) {
    const ceiling = m.direction === "ceiling";
    // A ceiling reads as distance from a limit, never as budget remaining:
    // "limit 20 g · 20 g left" tells someone trying to drink less that they
    // have 20 g in hand, and over an average ("7-day average, 12 g left") it
    // means nothing at all. So a ceiling always uses under/over — matching the
    // "Days over limit" phrasing in computeTrends — and `wording` tunes the
    // floor case only (trends passes { under: "under" } for its averages).
    const underWord = ceiling
        ? T.macros.ceilingUnder
        : (wording && wording.under) || T.macros.floorUnder;
    const overWord = (wording && wording.over) || T.macros.over;
    const val = vals?.[m.key] ?? 0;
    const target = goal?.[m.key] ?? null;

    let pct = null;
    let over = false;
    if (target != null && target > 0) {
        pct = (val / target) * 100;
        over = pct > 100;
    } else if (ceiling && target === 0) {
        // A ceiling of 0 is a real limit — "none today" is the most likely
        // alcohol limit there is — so it is honoured, while a floor of 0 stays
        // "no goal set" (a 0 g protein target is meaningless). Percent of zero
        // has no value to report, so it is pinned rather than left to divide
        // into Infinity/NaN.
        over = val > 0;
        pct = over ? 100 : 0;
    }
    const frac = pct == null ? 0 : Math.max(0, Math.min(pct, 100)) / 100;
    const pctColor = over ? "var(--over)" : m.color;

    let goalLine, targetStr, deltaStr, center2;
    // Tracked separately from the (translated) deltaStr text so callers can
    // detect the "exactly at a ceiling" state without string-matching a
    // localized value — see its use in macroLimit.
    let atLimit = false;
    if (pct == null) {
        targetStr = T.macros.noGoalSet;
        deltaStr = "";
        goalLine = targetStr;
        center2 = `<div class="ru">${m.unit}</div>`;
    } else {
        const delta = target - val;
        if (delta < 0) {
            deltaStr = `${fmt(-delta, m.decimals)} ${m.unit} ${overWord}`;
        } else if (delta === 0 && ceiling) {
            // "0 g under" would be read as room left; exactly at a limit is
            // its own state.
            deltaStr = T.macros.atLimit;
            atLimit = true;
        } else {
            deltaStr = `${fmt(delta, m.decimals)} ${m.unit} ${underWord}`;
        }
        targetStr = `${ceiling ? T.macros.limitPrefix : T.macros.ofPrefix} ${fmt(target, m.decimals)} ${m.unit}`;
        goalLine = `${targetStr} · ${deltaStr}`;
        center2 = `<div class="rp" style="color:${pctColor}">${Math.round(pct)}%</div>`;
    }
    return {
        val,
        target,
        pct,
        over,
        atLimit,
        frac,
        goalLine,
        targetStr,
        deltaStr,
        center2,
    };
}

// The conic-gradient ring gauge markup (size and band come from the CSS
// context). Its aria-label is what a STATIC gauge exposes; inside an
// interactive tile the button role makes every child presentational, so the
// value reaches a screen reader through the tile's own name instead — see
// tileLabel.
//
// At compact size the centre carries the percentage ALONE: the value it would
// otherwise repeat sits beside the ring at three times the size. With no goal
// there is no percentage, so the value moves back in.
function ringMarkup(m, b) {
    const cap =
        b.pct != null && b.frac > 0.005 ? `<div class="ring-cap"></div>` : "";
    const center =
        b.pct != null
            ? b.center2
            : `<div class="rv">${fmt(b.val, m.decimals)}</div>${b.center2}`;
    return `
      <div class="ring" style="--c:${m.color};--p:${b.frac.toFixed(4)}" role="img" aria-label="${esc(macroLabel(m))} ${fmt(b.val, m.decimals)} ${m.unit}">
        <div class="ring-track"></div>
        <div class="ring-arc"></div>
        ${cap}
        <div class="ring-center">${center}</div>
      </div>`;
}

// Is there anything behind THIS tile to disclose? Two conditions, and both
// matter:
//
//   1. the widget passed per-meal rows at all (trends does not, so its strip is
//      entirely static), and
//   2. at least one of those meals contributed a positive amount of this
//      metric.
//
// The second is what keeps a tile from being a button that opens an empty list.
// Every metric on the strip is in MEAL_BREAKDOWN_ITEM (src/mcp.ts) — the limits
// row included — so the test is the same one for all of them: a limit cell is
// tappable exactly when meals are behind it, and an alcohol cell reading "none
// logged" stays the static cell it always was. Water is never interactive by
// the same rule and needs no special case: water is logged separately and no
// meal row carries `water_ml`.
function macroHasDetail(m, ctx) {
    if (!ctx.meals) return false;
    return ctx.meals.some((meal) => (Number(meal?.[m.key]) || 0) > 0);
}

// The accessible name of an interactive tile — VALUE FIRST, action second.
//
// `role="button"` makes a tile's children presentational: the ring's own
// aria-label, the metric name and the goal caption all drop out of the
// accessibility tree, so a screen reader hears the action and no numbers at
// all, while the static tile beside it reads "Protein 120 g / PROTEIN / of
// 160 g · 40 g left". Folding the value and goal state into the name restores
// exactly what the static tile exposes, in one announcement.
//
// The alternative — moving role="button" to an inner element so the values stay
// exposed — was rejected: the whole tile is the tap target (a 44px column is
// the thing a finger aims at), so the button would either be smaller than what
// responds to a tap or would nest a second target inside the first.
function tileLabel(m, b) {
    // "·" separates value from goal visually; screen readers either skip it or
    // announce "middle dot", so the spoken name uses a comma.
    const state = b.goalLine.replace(" · ", ", ");
    return `${macroLabel(m)} ${fmt(b.val, m.decimals)} ${m.unit}, ${state}. ${T.macros.showMealsContributed}`;
}

// When a tile has something to disclose it is also a button that toggles its
// breakdown — see macroToggle below.
function interactiveAttrs(m, b, interactive) {
    return interactive
        ? ` role="button" tabindex="0" data-macro="${m.key}" aria-expanded="false" aria-label="${esc(tileLabel(m, b))}"`
        : "";
}

// Calories — the gauge, the running figure against its goal, and how much is
// left. `calLabel` names the period the figure covers, which is the one thing
// that genuinely differs between widgets ("Calories today" vs "14-day avg ·
// all days").
function macroCal(m, ctx, interactive) {
    const b = macroBits(m, ctx.vals, ctx.goal, ctx.wording);
    // Keyed off `pct`, not `target`. A FLOOR target of 0 is "no goal set" as
    // far as macroBits is concerned (a 0 kcal goal is meaningless), and
    // set_nutrition_goals will happily store one — so a `target != null` test
    // renders "1,980 / 0" beside a caption that says there is no goal.
    const goalPart =
        b.pct != null
            ? `<span class="cal-goal">/ ${fmt(b.target, m.decimals)}</span>`
            : "";
    // With no goal this slot carries "no goal set" — it is the only place the
    // calorie block can say so, and a lone figure beside an empty ring
    // otherwise reads as a widget that failed to load.
    const left = `<div class="cal-left">${esc(b.deltaStr || b.targetStr)}</div>`;
    return `
      <div class="cal${interactive ? " interactive" : ""}"${interactiveAttrs(m, b, interactive)}>${ringMarkup(m, b)}
        <div class="cal-txt">
          <div class="cal-lab">${esc(ctx.calLabel)}</div>
          <div class="cal-line">
            <div class="cal-val">${fmt(b.val, m.decimals)}${goalPart}</div>
            ${left}
          </div>
        </div>
      </div>`;
}

// One cell of either grid: name + figure, a thin bar, a caption. `num` and
// `cap` are what the two rows disagree on — a macro shows "95 /175" with the
// amount left underneath, a limit shows the bare figure with the limit itself
// underneath, because the limit appears nowhere else.
function macroTile(m, b, num, cap, interactive) {
    const flag = b.over && m.direction === "ceiling";
    // `nogoal` keeps the caption on screen at phone widths, where it is
    // otherwise the first thing dropped — see macros.css.
    const cls = `mtile${b.pct == null ? " nogoal" : ""}${interactive ? " interactive" : ""}`;
    return `
        <div class="${cls}"${interactiveAttrs(m, b, interactive)}>
          <div class="mtop">
            <span class="mkey">${esc(macroLabel(m))}</span>
            <span class="mnum"${flag ? ' style="color:var(--over)"' : ""}>${num}</span>
          </div>
          <div class="mbar"><div class="mfill" style="width:${(b.frac * 100).toFixed(1)}%;background:${m.color}"></div></div>
          <div class="mcap">${esc(cap)}</div>
        </div>`;
}

// Protein / carbs / fat.
function macroBarTile(m, ctx, interactive) {
    const b = macroBits(m, ctx.vals, ctx.goal, ctx.wording);
    // The unit rides in a span the narrow layout hides: at three columns
    // across a phone, "125/160 g" leaves the name and the figure touching,
    // and grams are what every macro is in anyway.
    // b.pct, not b.target — a floor goal of 0 is "no goal set" (see macroCal).
    const num =
        b.pct != null
            ? `${fmt(b.val, m.decimals)}<span class="msub">/${fmt(b.target, m.decimals)}<span class="munit"> ${m.unit}</span></span>`
            : `${fmt(b.val, m.decimals)}<span class="msub"> ${m.unit}</span>`;
    return macroTile(m, b, num, b.deltaStr || b.targetStr, interactive);
}

// Does this limit earn a cell? See `signal` on the MACROS entries: for alcohol
// and caffeine the payload's null is the whole gate and a recorded 0 is a real
// reading that stays on screen; for fiber and sugar a 0 could equally mean the
// day predates the column, so the cell is earned by a value or by a goal.
//
// What the gate prevents is a "0 mg of 400 mg" line invented for someone who
// has never recorded any — the same suppression the model-facing text applies
// (recordedGoalLine in src/mcp.ts).
function limitShown(m, ctx) {
    const v = ctx.vals?.[m.key];
    if (v == null) return false;
    if (m.signal === "null") return true;
    return v > 0 || (ctx.goal ? (ctx.goal[m.key] ?? null) != null : false);
}

// A limit cell. Alcohol's caption leads with the drink count as an intuitive
// gloss ("2.0 US drinks · limit 20 g"); caffeine has no second unit anyone
// thinks in, so it is milligrams alone. A metric recorded as none reads that
// way in words rather than as a 0 that looks like a measurement.
function macroLimit(m, ctx, interactive) {
    // The gate again, so the cell builder is safe to call on its own and can
    // never invent a reading the strip would have suppressed.
    if (!limitShown(m, ctx)) return "";
    const b = macroBits(m, ctx.vals, ctx.goal, ctx.wording);
    // The unit is already in the caption underneath ("limit 400 mg"), and
    // caffeine's milligrams are the one unit here that cannot be guessed — so
    // it is spelled out beside the figure only when there is no limit to
    // carry it.
    const unit = b.pct == null ? `<span class="msub"> ${m.unit}</span>` : "";
    const num =
        b.val > 0
            ? `${fmt(b.val, m.decimals)}${unit}`
            : `<span class="mnone">${esc(T.macros.noneLogged)}</span>`;
    let cap = b.targetStr;
    if (b.val > 0 && m.gloss === "drinks") {
        const drinks = (b.val / DRINK_GRAMS[ctx.drinkUnit]).toFixed(1);
        cap = `${drinks} ${T.macros.drinkLabels[ctx.drinkUnit]} · ${cap}`;
    }
    // The limit itself is the caption; BY HOW MUCH joins it only when that is
    // the thing to act on. Under a limit "13.1 g under" is noise in a cell
    // this size — but a breach the figure already flags in --over deserves its
    // size, and "at limit" is a state the colour cannot express at all
    // (`over` is pct > 100, so exactly at a ceiling reads as comfortably
    // under it otherwise).
    if (b.deltaStr && (b.over || b.atLimit)) {
        cap = `${cap} · ${b.deltaStr}`;
    }
    return macroTile(m, b, num, cap, interactive);
}

// Water — one line, in litres. The payload is millilitres because that is what
// a glass is logged in, but a day's intake is spoken in litres and "2,100 /
// 2,500 ml" is four more glyphs to read for no more meaning.
function macroWater(m, ctx) {
    const b = macroBits(m, ctx.vals, ctx.goal, ctx.wording);
    // Always a tenth, not fmt()'s — fmt round-trips through Number(), so a
    // round 2 L would print "2" beside a "2.5 L" goal.
    const L = (ml) => (ml / 1000).toFixed(1);
    // b.pct, not b.target — a floor goal of 0 is "no goal set" (see macroCal).
    const num =
        b.pct != null
            ? `${L(b.val)}<span class="wsub">/${L(b.target)} L</span>`
            : `${L(b.val)}<span class="wsub"> L</span>`;
    return `
      <div class="wrow psec">
        <span class="wlab"><span class="dot" style="background:${m.color}"></span>${esc(macroLabel(m))}</span>
        <div class="mbar"><div class="mfill" style="width:${(b.frac * 100).toFixed(1)}%;background:${m.color}"></div></div>
        <span class="wnum">${num}</span>
      </div>`;
}

// Everything the strip and its disclosure need, in one object: the values, the
// goals, the caption wording, the optional per-meal rows, the drink unit, and
// the label above the calorie figure. Built once per macroPanel() call and
// stashed for the delegated toggle handler.
function macroCtxOf(vals, goal, wording, meals, opts) {
    const unit = opts && opts.drinkUnit;
    return {
        vals: vals || {},
        goal: goal || null,
        wording,
        meals: Array.isArray(meals) && meals.length > 0 ? meals : null,
        // The server sends `drink_unit` on every payload with an alcohol
        // figure and all four production templates pass it through as
        // opts.drinkUnit — do not unwire that. The fallback covers a caller
        // that passes no opts at all (the dev-only component gallery) or an
        // unrecognised unit: "us" is what src/mcp.ts uses for an
        // alcohol-tracking user with no saved preference.
        drinkUnit: DRINK_GRAMS[unit] ? unit : "us",
        // The shared default calorie-ring label, translated via
        // T.macros.caloriesToday. goal-progress.html and meal-logged.html
        // don't override it and rely on this default in production;
        // nutrition-summary.html and trends.html always pass their own more
        // specific calLabel (day count / range-averaged wording).
        calLabel: (opts && opts.calLabel) || T.macros.caloriesToday,
        // Set by a widget that puts something of its own — a chart, a range
        // toggle's chart — between the header line and the strip, so the strip
        // opens with the same hairline that separates its own sections.
        divided: !!(opts && opts.divided),
    };
}

// The column count for a grid, as the two custom properties macros.css reads.
// Four limits do not fit across a phone, so they become a 2×2; three or fewer
// keep one row at both widths. The row therefore handles one to four cells
// with no special case — alcohol simply is or is not among them.
function gridCols(n) {
    return `--lc:${n === 4 ? 2 : n};--lcw:${n}`;
}

// Full macro strip: the calorie row, the three macro bars, the limits row and
// the water line, laid out by role (never by a hardcoded key list).
//
// `meals` is optional: when a non-empty array of per-meal breakdown rows is
// passed (each { description, meal_type, date, calories, protein_g, carbs_g,
// fat_g, fiber_g, sugar_g, alcohol_g, caffeine_mg }), every tile some meal
// contributed to becomes tappable and reveals those meals (see macroToggle) —
// the limits row included, not just calories and the three bars.
//
// `opts` is optional: { drinkUnit: "us" | "uk", calLabel: string,
// divided: boolean }.
function macroPanel(vals, goal, wording, meals, opts) {
    const ctx = macroCtxOf(vals, goal, wording, meals, opts);
    // Stash it so the delegated toggle handler can build the breakdown on
    // demand. One strip per widget, so a single slot is enough.
    __macroCtx = ctx;

    const cal = MACROS.find((m) => m.role === "cal");
    const trio = MACROS.filter((m) => m.role === "macro");
    const limits = MACROS.filter(
        (m) => m.role === "limit" && limitShown(m, ctx),
    );
    const waters = MACROS.filter(
        // Only show a bar for a metric that was actually tracked — an empty bar
        // for an untouched metric is noise.
        (m) => m.role === "bar" && (ctx.vals[m.key] ?? 0) > 0,
    );

    // Per tile, not per strip: every metric on the strip has per-meal figures
    // behind it, but only the ones some meal actually contributed to are worth
    // opening. The strip itself is interactive if any of its tiles is — that is
    // what earns the hint line and the region the breakdown renders into.
    const tap = (m) => macroHasDetail(m, ctx);
    const interactive = [cal, ...trio, ...limits].some(tap);
    const limitRow = limits.length
        ? `<div class="mgrid lim n${limits.length} psec" style="${gridCols(limits.length)}">${limits
              .map((m) => macroLimit(m, ctx, tap(m)))
              .join("")}
        </div>`
        : "";
    // What a tap does, said once. Hover and a cursor are the whole affordance
    // on a pointer device and NEITHER exists on a phone, which is where this
    // widget mostly lives — without a line saying so, the breakdown is a
    // feature nobody discovers. It sits under the grids rather than at the end
    // of the strip so it is next to the tiles it describes, and macroToggle
    // hides it once a breakdown is open: by then the answer is on screen and
    // the instruction is just a row of noise above it.
    const hint = interactive
        ? `<div class="mhint" data-macro-hint>${esc(T.macros.tapHint)}</div>`
        : "";
    // The breakdown renders into this region on tap; hidden until then.
    const detail = interactive
        ? `<div class="macro-detail psec" hidden aria-live="polite"></div>`
        : "";
    return `
      <div class="strip${ctx.divided ? " psec" : ""}"${interactive ? " data-macro-panel" : ""}>
        <div class="srow">
          ${macroCal(cal, ctx, tap(cal))}
          <div class="sgrids">
            <div class="mgrid" style="${gridCols(3)}">${trio
                .map((m) => macroBarTile(m, ctx, tap(m)))
                .join("")}
            </div>
            ${limitRow}
            ${hint}
          </div>
        </div>
        ${waters.map((m) => macroWater(m, ctx)).join("")}
        ${detail}
      </div>`;
}

// ---- Interactive breakdown ------------------------------------------------
// Set by macroPanel() when the strip is interactive; read by the delegated
// handlers below.
let __macroCtx = null;

// The list of meals that contributed a positive amount of one metric,
// largest-first, capped so a long range stays readable.
function mealList(m, meals) {
    // A single meal's contribution is a fraction of the day's, so grams get a
    // tenth here even where the strip rounds them whole — a 3.4 g and a 3.1 g
    // meal must not both read "3" in a list sorted by that very figure.
    // Whole-unit metrics keep their unit: kcal and mg of caffeine are quoted
    // whole at every scale (see the MACROS entries), and a tenth of a
    // milligram is below anything anyone can act on.
    const decimals = m.decimals === 0 && m.unit === "g" ? 1 : m.decimals;
    const rows = meals
        .map((meal) => ({ meal, v: Number(meal?.[m.key] ?? 0) || 0 }))
        .filter((r) => r.v > 0)
        .sort((a, b) => b.v - a.v);

    if (!rows.length) {
        return `<div class="md-empty">${esc(tpl(T.macros.noMealsContributed, { label: macroLabel(m) }))}</div>`;
    }

    const CAP = 8;
    const shown = rows.slice(0, CAP);
    const extra = rows.length - shown.length;
    const items = shown
        .map(({ meal, v }) => {
            // Prefer a date tag for multi-day ranges, otherwise the meal type.
            const sub = meal.date
                ? esc(String(meal.date).slice(5))
                : meal.meal_type
                  ? esc(meal.meal_type)
                  : "";
            return `
        <li class="md-row">
          <span class="md-val" style="color:${m.color}">${fmt(v, decimals)}<span class="md-unit">${esc(m.unit)}</span></span>
          <span class="md-name">${esc(meal.description || T.macros.untitledMeal)}</span>
          ${sub ? `<span class="md-sub">${sub}</span>` : ""}
        </li>`;
        })
        .join("");
    const more =
        extra > 0
            ? `<li class="md-more">${esc(plural(T.macros.moreMeals, extra))}</li>`
            : "";
    return `<ul class="md-list">${items}${more}</ul>`;
}

// Build the breakdown for one metric: the meals behind it, in the strip's own
// card rather than on a second surface below it.
function macroDetailBody(m, ctx) {
    return `
      <div class="md-head">
        <span class="md-title"><span class="dot" style="background:${m.color}"></span>${esc(tpl(T.macros.byMealTitle, { label: macroLabel(m) }))}</span>
        <button class="md-close" data-macro-close aria-label="${esc(T.macros.closeBreakdown)}">✕</button>
      </div>${mealList(m, ctx.meals)}`;
}

// Toggle the breakdown for the tapped tile. Tapping the open tile again (or its
// ✕) collapses it; tapping another tile swaps the list. The height change is
// picked up by the bridge's ResizeObserver, which re-reports so the host grows
// the iframe.
function macroToggle(cell) {
    const panel = cell.closest("[data-macro-panel]");
    if (!panel || !__macroCtx) return;
    const detail = panel.querySelector(".macro-detail");
    if (!detail) return;
    const key = cell.dataset.macro;
    const alreadyOpen = detail.dataset.open === key && detail.hidden === false;

    panel.querySelectorAll("[data-macro]").forEach((c) => {
        const on = c === cell && !alreadyOpen;
        c.classList.toggle("open", on);
        c.setAttribute("aria-expanded", on ? "true" : "false");
    });

    // The instruction has been followed; the answer replaces it.
    const hint = panel.querySelector("[data-macro-hint]");

    if (alreadyOpen) {
        detail.hidden = true;
        detail.dataset.open = "";
        detail.innerHTML = "";
        if (hint) hint.hidden = false;
        return;
    }
    const m = MACROS.find((mm) => mm.key === key);
    if (!m) return;
    detail.innerHTML = macroDetailBody(m, __macroCtx);
    detail.dataset.open = key;
    detail.hidden = false;
    if (hint) hint.hidden = true;
}

// Delegated once per document. No-ops on non-interactive strips (no
// [data-macro] tiles), so widgets that omit meals are unaffected.
if (typeof document !== "undefined" && !window.__macroWired) {
    window.__macroWired = true;
    document.addEventListener("click", (e) => {
        if (e.target.closest("[data-macro-close]")) {
            const panel = e.target.closest("[data-macro-panel]");
            const detail = panel && panel.querySelector(".macro-detail");
            if (detail && detail.dataset.open) {
                const cell = panel.querySelector(
                    `[data-macro="${detail.dataset.open}"]`,
                );
                if (cell) macroToggle(cell);
            }
            return;
        }
        const cell = e.target.closest("[data-macro]");
        if (cell) macroToggle(cell);
    });
    document.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
        const cell = e.target.closest("[data-macro]");
        if (!cell) return;
        e.preventDefault();
        macroToggle(cell);
    });
}
