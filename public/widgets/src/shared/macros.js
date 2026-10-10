// Macro strip builder — shared by every widget that shows intake vs goal.
//
// Renders ONE compact block: the calorie ring beside its figure, three
// protein/carbs/fat bars, a "limits" row of the metrics you stay under
// (sugar, alcohol, caffeine) plus fiber — with sugar and added sugar in a
// two-column row of their own above it whenever added sugar is on show — and
// the water line. It is not a card
// of its own — a widget drops it inside its single `.panel` under whatever top
// matter only that widget has (a chart, a range toggle, a weight line). Pairs
// with shared/macros.css (layout) and shared/ring.css (the gauge).
//
// Requires fmt(n, decimals) and esc(s) to already be defined in the widget scope.
//
// Data contract: `vals` and `goal` are plain objects keyed by macro
// (`calories`, `protein_g`, `carbs_g`, `fat_g`, `fiber_g`, `sugar_g`,
// `alcohol_g`, `caffeine_mg`, `water_ml`, and `added_sugar_g` once a template
// has merged it in from the result's `_meta` — see withAddedSugar) — e.g. a
// day's totals, a range's averages, or a computed slice. Note that `caffeine_mg` is the ONE key not in
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
// `row` (limits only) names a row of their own that some limit cells move
// into, and `opensRow` marks the cell whose presence opens it. Today there
// are two rows: sugar and added sugar share the "sugars" row, which exists
// only while the added-sugar cell is shown, and saturated and trans fat share
// the "fats" row, which exists while either fat cell is shown (see
// macroPanel). Without them, those cells stay in the limits row exactly where
// they always were.
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
//
// `unrecordedWithGoal` earns a cell with NO value at all, as long as the user
// set a limit for it: the cell then reads "not recorded" over an empty bar and
// the limit, so a limit the user set never silently disappears on a day the
// figure is simply unknown. Only added sugar has it — its null is "not
// recorded", never 0, and its limit only ever reaches the strip from the
// result's `_meta` (withAddedSugar), so a strip without `_meta` cannot take
// this path.
//
// `zeroIsValue` prints a recorded 0 as the number it is rather than "none
// logged". Only added sugar has it: every other limit's 0 may mean nothing was
// entered, but an added-sugar 0 is a figure someone recorded (not recorded is
// undefined, see above), and "none logged" beside it says the opposite.
// The unit glyph a MACROS entry's `unit` code renders as in the widget's
// language ("kcal" -> "ккал" in uk). The code itself stays the stable key the
// logic compares against (see mealList); only what is printed is translated.
// Falls back to the code for a dictionary without the entry.
function unitLabel(m) {
    const units = T.macros && T.macros.units;
    return (units && units[m.unit]) || m.unit;
}

// Always exactly one decimal, in the widget locale's separator ("2,5" in de),
// so a figure never carries a point beside comma-formatted neighbours.
function oneDecimal(x) {
    return Number(x).toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    });
}

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
    // Saturated fat has a daily ceiling (set_nutrition_goals) and trans fat
    // has none. Neither is in a structuredContent payload (those schemas are
    // frozen): a template merges both from the result's `_meta` with
    // withSaturatedFat, so without it neither reaches the strip and both
    // cells stay hidden. "data", as added sugar: null is "not recorded", never
    // 0, and a recorded 0 prints as 0 (zeroIsValue). Either fat cell opens a
    // row of its own, "fats", so the two share it, and a lone trans fat cell
    // takes the same half width a lone sugar cell does. That keeps the limits
    // row at four cells at most: sugar, alcohol, caffeine, fiber. Trans fat has
    // no goal: its cell reads "no goal set" over its figure and is never a
    // limit.
    {
        key: "saturated_fat_g",
        label: "Saturated fat",
        unit: "g",
        color: "var(--saturated)",
        decimals: 1,
        role: "limit",
        direction: "ceiling",
        signal: "data",
        row: "fats",
        opensRow: true,
        unrecordedWithGoal: true,
        zeroIsValue: true,
    },
    {
        key: "trans_fat_g",
        label: "Trans fat",
        unit: "g",
        color: "var(--trans)",
        decimals: 1,
        role: "limit",
        signal: "data",
        row: "fats",
        opensRow: true,
        zeroIsValue: true,
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
        row: "sugars",
    },
    // Added sugars (the US label definition): part of sugar_g, never more than
    // it, and the measure public guidance limits are written against — so a
    // ceiling of its own beside total sugar rather than a sub-line of it. It
    // is in no structuredContent payload (those schemas are frozen); a
    // template merges it from the result's `_meta` with withAddedSugar, and
    // without that `_meta` neither the value nor the limit reaches the strip,
    // so limitShown hides the cell — the strip is then exactly what it was
    // before the field existed. "data", not "null": the per-day figure is null
    // when not recorded, which the merge leaves undefined; with a limit set
    // such a day still shows the cell, reading "not recorded"
    // (`unrecordedWithGoal`), and a recorded 0 prints as 0 (`zeroIsValue`).
    // Shown, it opens the "sugars" row: the pair sits two-up on a row of its
    // own, so both full names fit beside their figures at every width.
    {
        key: "added_sugar_g",
        label: "Added sugar",
        unit: "g",
        color: "var(--added-sugar)",
        decimals: 1,
        role: "limit",
        direction: "ceiling",
        signal: "data",
        row: "sugars",
        opensRow: true,
        unrecordedWithGoal: true,
        zeroIsValue: true,
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
// joins the test only if it is a top-level metric: fiber, sugar and added sugar
// never appear without a meal that already contributes calories, and alcohol_g / caffeine_mg
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
        center2 = `<div class="ru">${esc(unitLabel(m))}</div>`;
    } else {
        const delta = target - val;
        if (delta < 0) {
            deltaStr = `${fmt(-delta, m.decimals)} ${esc(unitLabel(m))} ${overWord}`;
        } else if (delta === 0 && ceiling) {
            // "0 g under" would be read as room left; exactly at a limit is
            // its own state.
            deltaStr = T.macros.atLimit;
            atLimit = true;
        } else {
            deltaStr = `${fmt(delta, m.decimals)} ${esc(unitLabel(m))} ${underWord}`;
        }
        targetStr = `${ceiling ? T.macros.limitPrefix : T.macros.ofPrefix} ${fmt(target, m.decimals)} ${esc(unitLabel(m))}`;
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
      <div class="ring" style="--c:${m.color};--p:${b.frac.toFixed(4)}" role="img" aria-label="${esc(macroLabel(m))} ${fmt(b.val, m.decimals)} ${esc(unitLabel(m))}">
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
    return metricRows(m, ctx.meals || [], ctx).some(
        (meal) => (Number(meal?.[m.key]) || 0) > 0,
    );
}

// The rows one metric's breakdown draws from: the strip's `meals`, then any
// rows sent for that metric alone (`ctx.extraRows`, keyed by metric key —
// today only added sugar's, see withAddedSugar). A metric with no extra rows
// gets `meals` itself, so every other list is exactly what it was.
function metricRows(m, meals, ctx) {
    const extra = ctx && ctx.extraRows ? ctx.extraRows[m.key] : null;
    return Array.isArray(extra) && extra.length ? meals.concat(extra) : meals;
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
    return `${macroLabel(m)} ${fmt(b.val, m.decimals)} ${unitLabel(m)}, ${state}. ${T.macros.showMealsContributed}`;
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
function macroTile(m, b, num, cap, interactive, attrs) {
    const flag = b.over && m.direction === "ceiling";
    // `nogoal` keeps the caption on screen at phone widths, where it is
    // otherwise the first thing dropped — see macros.css.
    const cls = `mtile${b.pct == null ? " nogoal" : ""}${interactive ? " interactive" : ""}`;
    return `
        <div class="${cls}"${interactiveAttrs(m, b, interactive)}${attrs || ""}>
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
            ? `${fmt(b.val, m.decimals)}<span class="msub">/${fmt(b.target, m.decimals)}<span class="munit"> ${esc(unitLabel(m))}</span></span>`
            : `${fmt(b.val, m.decimals)}<span class="msub"> ${esc(unitLabel(m))}</span>`;
    return macroTile(m, b, num, b.deltaStr || b.targetStr, interactive);
}

// Does this limit earn a cell? See `signal` on the MACROS entries: for alcohol
// and caffeine the payload's null is the whole gate and a recorded 0 is a real
// reading that stays on screen; for fiber and sugar a 0 could equally mean the
// day predates the column, so the cell is earned by a value or by a goal.
// Added sugar is "data" too, and is undefined whenever `_meta` did not carry a
// recorded figure (see withAddedSugar): with a limit set that is a "not
// recorded" cell (unrecordedShown), without one the cell stays hidden. Its
// recorded values, 0 included, always earn the cell (`zeroIsValue`): undefined
// already stands for "not recorded", so a 0 is a figure someone entered, and
// with no limit it prints as "0 g".
//
// What the gate prevents is a "0 mg of 400 mg" line invented for someone who
// has never recorded any — the same suppression the model-facing text applies
// (recordedGoalLine in src/mcp.ts).
function limitShown(m, ctx) {
    const v = ctx.vals?.[m.key];
    if (v == null) return unrecordedShown(m, ctx);
    if (m.signal === "null" || m.zeroIsValue) return true;
    return v > 0 || (ctx.goal ? (ctx.goal[m.key] ?? null) != null : false);
}

// A metric with no value is on show only when it opts in (`unrecordedWithGoal`)
// and a limit is set — a finite number, 0 included, since a ceiling of 0 is a
// real limit (see macroBits).
function unrecordedShown(m, ctx) {
    return (
        !!m.unrecordedWithGoal && !!ctx.goal && Number.isFinite(ctx.goal[m.key])
    );
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
    // No value, but a limit (unrecordedShown): the figure slot says the day is
    // unknown, the bar stays empty and the caption is the limit alone — never
    // "at limit" or "29 g under", which would judge a figure nobody entered.
    // Nothing is behind it, so it is never a button; its name says the same
    // three things in one announcement.
    if (ctx.vals?.[m.key] == null) {
        const cap = b.targetStr;
        const name = `${macroLabel(m)}, ${T.macros.notRecorded}, ${cap}`;
        return macroTile(
            m,
            b,
            `<span class="mnone">${esc(T.macros.notRecorded)}</span>`,
            cap,
            false,
            ` role="group" aria-label="${esc(name)}"`,
        );
    }
    // The unit is already in the caption underneath ("limit 400 mg"), and
    // caffeine's milligrams are the one unit here that cannot be guessed — so
    // it is spelled out beside the figure only when there is no limit to
    // carry it.
    const unit =
        b.pct == null ? `<span class="msub"> ${esc(unitLabel(m))}</span>` : "";
    const num =
        b.val > 0 || m.zeroIsValue
            ? `${fmt(b.val, m.decimals)}${unit}`
            : `<span class="mnone">${esc(T.macros.noneLogged)}</span>`;
    let cap = b.targetStr;
    if (b.val > 0 && m.gloss === "drinks") {
        const drinks = oneDecimal(b.val / DRINK_GRAMS[ctx.drinkUnit]);
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
    const L = (ml) => oneDecimal(ml / 1000);
    const unitL = esc(unitLabel({ unit: "L" }));
    // b.pct, not b.target — a floor goal of 0 is "no goal set" (see macroCal).
    const num =
        b.pct != null
            ? `${L(b.val)}<span class="wsub">/${L(b.target)} ${unitL}</span>`
            : `${L(b.val)}<span class="wsub"> ${unitL}</span>`;
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
        // pass this same default explicitly when data.date is the viewer's
        // today, and T.macros.caloriesOn (day-scoped) otherwise, so the ring
        // never claims "today" for a date it knows is not (#114);
        // nutrition-summary.html and trends.html always pass their own more
        // specific calLabel (day count / range-averaged wording).
        calLabel: (opts && opts.calLabel) || T.macros.caloriesToday,
        // Set by a widget that puts something of its own — a chart, a range
        // toggle's chart — between the header line and the strip, so the strip
        // opens with the same hairline that separates its own sections.
        divided: !!(opts && opts.divided),
        // Per metric, how many meals contributed a positive amount. Sent by
        // get_nutrition_summary in the CallToolResult's `_meta` (NOT in
        // structuredContent: hosts validate that against a cached copy of the
        // outputSchema, so it can never gain a field), because its `meals`
        // array is bounded to the union of each metric's top CAP rows and so
        // cannot count the rest. null means no counts arrived.
        contributors:
            opts && opts.contributors && typeof opts.contributors === "object"
                ? opts.contributors
                : null,
        // True when `meals` may be a server-trimmed subset (nutrition-summary).
        // Without `contributors` — a host that drops `_meta` — the count past
        // CAP is then only a lower bound, and mealList says so. false (every
        // other caller) means `meals` is complete and its rows are exact.
        bounded: !!(opts && opts.bounded),
        // How many meals the window really holds (nutrition-summary sums its
        // days' meal_count), or null. Lets a bounded list that the server did
        // NOT trim — every meal made some metric's top CAP — count exactly.
        mealTotal:
            opts && Number.isFinite(opts.mealTotal) ? opts.mealTotal : null,
        // Rows that belong to ONE metric's breakdown only, keyed by metric key
        // ({ added_sugar_g: [...] }, built by withAddedSugar from the
        // AddedSugarMeta's `extra`). They join that metric's list (metricRows)
        // and nothing else: no other metric's list, tile or count sees them.
        // null (every caller without them) leaves every list as it was.
        extraRows:
            opts && opts.extraRows && typeof opts.extraRows === "object"
                ? opts.extraRows
                : null,
    };
}

// The column count for a grid, as the two custom properties macros.css reads.
// Four limits do not fit across a phone, so they become a 2×2; three or fewer
// keep one row at both widths. The row therefore handles one to four cells
// with no special case — alcohol simply is or is not among them. It never
// gets a fifth: added sugar takes sugar into a row of its own (see
// macroPanel). (Below 360px every limits row is two columns, and between 700
// and 859px four stay a 2×2: see macros.css.)
function gridCols(n) {
    return `--lc:${n === 4 ? 2 : n};--lcw:${n}`;
}

// A row of limit cells. The sugars row is always two columns, at every width
// and whatever it holds: two cells a half each is what lets "ADDED SUGAR" /
// "ZUGESETZTER ZUCKER" sit beside its figure unabbreviated. A lone cell (added
// sugar shown while total sugar is not — a 0 g day against an added-sugar
// limit) keeps that half width rather than stretching across the strip, so it
// reads as the same cell it is beside sugar, at the same size.
function limitRowMarkup(cells, ctx, tap, own) {
    const cls = own ? "mgrid lim pair psec" : `mgrid lim n${cells.length} psec`;
    const cols = own ? "--lc:2;--lcw:2" : gridCols(cells.length);
    return `<div class="${cls}" style="${cols}">${cells
        .map((m) => macroLimit(m, ctx, tap(m)))
        .join("")}
        </div>`;
}

// Full macro strip: the calorie row, the three macro bars, the limits row and
// the water line, laid out by role (never by a hardcoded key list).
//
// `meals` is optional: when a non-empty array of per-meal breakdown rows is
// passed (each { description, meal_type, date, calories, protein_g, carbs_g,
// fat_g, fiber_g, sugar_g, alcohol_g, caffeine_mg }, plus added_sugar_g once
// withAddedSugar has merged it), every tile some meal
// contributed to becomes tappable and reveals those meals (see macroToggle) —
// the limits row included, not just calories and the three bars.
//
// `opts` is optional: { drinkUnit: "us" | "uk", calLabel: string,
// divided: boolean, contributors: { [metricKey]: number } | null,
// bounded: boolean, mealTotal: number | null,
// extraRows: { [metricKey]: row[] } | null }.
// `bounded` marks `meals` as a possibly server-trimmed subset
// (nutrition-summary), `mealTotal` is how many meals the window really holds,
// and `contributors` is the true per-metric count of meals with a positive
// value that such a caller receives out of band (the result's `_meta`); the
// breakdown's "N more meals" line counts against it instead of meals.length,
// and, trimmed but without a count, says "N or more" (or, at exactly CAP
// rows, "possibly more") rather than a number it cannot know. `extraRows`
// adds rows to a single metric's breakdown only (added sugar's, from
// `_meta`; see withAddedSugar and metricRows).
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
    // A limit with a `row` leaves the limits row for a row of its own only
    // while a cell that opens that row is shown — today, sugar and added sugar
    // move together into the sugars row once added sugar is on screen. With
    // no such cell nothing moves, and the markup is exactly what it was before
    // the sugars row existed. Own rows come first: the visual order stays the
    // MACROS order (saturated fat, trans fat, sugar, added sugar, alcohol,
    // caffeine, fiber).
    const opened = new Set(limits.filter((m) => m.opensRow).map((m) => m.row));
    const ownRows = [...opened].map((r) => limits.filter((m) => m.row === r));
    const rest = limits.filter((m) => !opened.has(m.row));
    const limitRow =
        ownRows.map((cells) => limitRowMarkup(cells, ctx, tap, true)).join("") +
        (rest.length ? limitRowMarkup(rest, ctx, tap, false) : "");
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

// ---- Added sugar, from the result's `_meta` ---------------------------------
// Five tools carry an AddedSugarMeta (src/added-sugar.ts) under the
// "nutrition-mcp.com/added-sugar" `_meta` key, because no structuredContent
// object may gain a field. Each template reads that key itself (the literal
// lives in the template, like the summary's contributors key) and merges it
// into the strip's inputs here, before macroPanel. A missing, malformed or
// future-versioned payload merges nothing at all, so the strip is byte for
// byte what it was before the field existed.
function addedSugarPayload(raw) {
    return raw && typeof raw === "object" && raw.v === 1 ? raw : null;
}

// The added-sugar figure for a set of local dates: the mean over the dates the
// payload carries a recorded (finite) value for, or undefined when none does.
// A null day is "not recorded" and drops out of the average — the same rule
// the server's text applies — rather than counting as 0. One date gives that
// day's total; trends passes its 7/14/30-day slice, the summary its days.
function addedSugarFor(as, dates) {
    return recordedMeanFor(as, dates);
}

// The same rule for any per-day payload part with a `days` map: saturated fat
// and trans fat (withSaturatedFat) and added sugar all average over the days
// that recorded them. addedSugarFor is this with its own name.
function recordedMeanFor(as, dates) {
    if (!as || !as.days || typeof as.days !== "object") return undefined;
    let sum = 0;
    let seen = 0;
    for (const d of dates) {
        const v = as.days[d];
        if (Number.isFinite(v)) {
            sum += v;
            seen++;
        }
    }
    return seen ? sum / seen : undefined;
}

// Merge an AddedSugarMeta into the strip's inputs. `value` is the figure the
// cell shows (addedSugarFor); undefined leaves `vals` without the key, so
// limitShown shows a "not recorded" cell when a limit is set and hides it
// otherwise. Returns new objects and never mutates the payload's own.
//
// `meals` are the breakdown rows (MEAL_BREAKDOWN_ITEM), which carry no id, so
// `as.meals` — keyed by meal id, built by the server from the same rows in the
// same order — is joined BY POSITION, and only when the counts agree. Any
// mismatch leaves the rows as they are: the cell then simply has no breakdown,
// which is better than attributing one meal's sugar to another. A meal with no
// recorded value gets null, which mealList leaves out.
//
// `extraRows` carries `as.extra` (get_nutrition_summary only): the meals among
// the window's top CAP by added sugar that are NOT in `meals`. The summary's
// `meals` is the union of every OTHER metric's top CAP (structuredContent is
// frozen, so added sugar cannot rank rows into it), which can leave out the
// meal with the most added sugar of all — a sweetened drink that tops no other
// metric. Those rows join the added-sugar list only, as
// `{ added_sugar_g: [...] }` for macroPanel's opts.extraRows, and only when
// the positional join above succeeded: without the kept rows' figures the
// extras alone would rank as a top list with its biggest entries missing.
// null when there are none, so a payload without `extra` changes nothing.
function withAddedSugar(as, value, vals, goal, meals) {
    if (!as) return { vals, goal, meals, extraRows: null };
    const out = { vals, goal, meals, extraRows: null };
    if (Number.isFinite(value)) {
        out.vals = Object.assign({}, vals, { added_sugar_g: value });
    }
    if (Number.isFinite(as.goal)) {
        out.goal = Object.assign({}, goal, { added_sugar_g: as.goal });
    }
    if (Array.isArray(meals) && as.meals && typeof as.meals === "object") {
        const per = Object.values(as.meals);
        if (per.length === meals.length) {
            out.meals = meals.map((meal, i) =>
                Object.assign({}, meal, {
                    added_sugar_g: Number.isFinite(per[i]) ? per[i] : null,
                }),
            );
            const extra = addedSugarExtraRows(as);
            if (extra.length) out.extraRows = { added_sugar_g: extra };
        }
    }
    return out;
}

// `as.extra`, validated: it arrives from the host, so it is untrusted. Keeps
// only entries that are objects with a string description and a finite,
// positive added_sugar_g, rebuilds each from those four fields alone (a stray
// `calories` on one can never reach another metric), and caps at 8 — the
// server never sends more than MEAL_BREAKDOWN_TOP_N. Anything else is [].
function addedSugarExtraRows(as) {
    if (!as || !Array.isArray(as.extra)) return [];
    const rows = [];
    for (const e of as.extra) {
        if (rows.length >= 8) break;
        if (!e || typeof e !== "object") continue;
        if (typeof e.description !== "string") continue;
        const v = e.added_sugar_g;
        if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) continue;
        rows.push({
            description: e.description,
            meal_type: typeof e.meal_type === "string" ? e.meal_type : null,
            date: typeof e.date === "string" ? e.date : null,
            added_sugar_g: v,
        });
    }
    return rows;
}

// The summary's per-metric "N more" counts with added sugar's folded in.
// Returns `contributors` untouched when the payload has no count.
function withAddedSugarContributors(as, contributors) {
    if (!as || !Number.isFinite(as.contributors)) return contributors;
    return Object.assign({}, contributors, {
        added_sugar_g: as.contributors,
    });
}

// ---- Saturated and trans fat, from the result's `_meta` ---------------------
// The same arrangement as added sugar: the tools carry a SaturatedFatMeta
// under the "nutrition-mcp.com/saturated-fat" `_meta` key (src/saturated-fat.ts),
// and each template that shows the strip reads that key and merges it here,
// after withAddedSugar. Shape: `{ v: 1, goal, days, meals, trans? }`, where
// `goal` is the saturated-fat ceiling or null, `days` maps a local date to the
// day's saturated fat (null = not recorded), `meals` is keyed by meal id and
// joined BY POSITION with the breakdown rows (as added sugar's is), and
// `trans` is `{ days, meals }` for trans fat in the same shape, with no goal.
// A missing, malformed or future-versioned payload merges nothing, so the
// strip is byte for byte what it was before the fields existed.
function saturatedFatPayload(raw) {
    return raw && typeof raw === "object" && raw.v === 1 ? raw : null;
}

// `part.extra`, validated for one nutrient: the meals among the window's top
// CAP that the kept rows miss (get_nutrition_summary only). Untrusted, like
// addedSugarExtraRows: each entry is rebuilt from its four fields, kept only
// with a string description and a finite positive value, at most 8.
function nutrientExtraRows(part, key) {
    if (!part || !Array.isArray(part.extra)) return [];
    const rows = [];
    for (const e of part.extra) {
        if (rows.length >= 8) break;
        if (!e || typeof e !== "object") continue;
        if (typeof e.description !== "string") continue;
        const v = e[key];
        if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) continue;
        rows.push({
            description: e.description,
            meal_type: typeof e.meal_type === "string" ? e.meal_type : null,
            date: typeof e.date === "string" ? e.date : null,
            [key]: v,
        });
    }
    return rows;
}

// Merge one nutrient's per-day value and per-meal values into the strip's
// inputs, the way withAddedSugar does for added sugar. `limit` says whether the
// part may set a goal: trans fat never does, whatever its payload carries.
// Returns new objects and never mutates the payload's own. `extraRows` and
// `contributors` are keyed by the nutrient, for macroPanel's opts, and are
// null when the part sent neither.
function withNutrient(part, key, value, vals, goal, meals, limit) {
    const out = { vals, goal, meals, extraRows: null, contributors: null };
    if (!part || typeof part !== "object") return out;
    if (Number.isFinite(value)) {
        out.vals = Object.assign({}, vals, { [key]: value });
    }
    if (limit && Number.isFinite(part.goal)) {
        out.goal = Object.assign({}, goal, { [key]: part.goal });
    }
    if (Number.isFinite(part.contributors)) {
        out.contributors = { [key]: part.contributors };
    }
    if (Array.isArray(meals) && part.meals && typeof part.meals === "object") {
        const per = Object.values(part.meals);
        if (per.length === meals.length) {
            out.meals = meals.map((meal, i) =>
                Object.assign({}, meal, {
                    [key]: Number.isFinite(per[i]) ? per[i] : null,
                }),
            );
            const extra = nutrientExtraRows(part, key);
            if (extra.length) out.extraRows = { [key]: extra };
        }
    }
    return out;
}

// The strip's saturated and trans fat for a set of local dates. `dates` is the
// same list the template gives addedSugarFor, so the three figures always
// cover the same days. A missing payload returns the inputs untouched. The
// result also carries `extraRows` and `contributors` for the nutrients the
// payload sent them for (see withNutrient); the summary merges them in.
function withSaturatedFat(raw, dates, vals, goal, meals) {
    const sf = saturatedFatPayload(raw);
    if (!sf) return { vals, goal, meals, extraRows: null, contributors: null };
    let out = withNutrient(
        sf,
        "saturated_fat_g",
        recordedMeanFor(sf, dates),
        vals,
        goal,
        meals,
        true,
    );
    if (sf.trans && typeof sf.trans === "object") {
        const tr = withNutrient(
            sf.trans,
            "trans_fat_g",
            recordedMeanFor(sf.trans, dates),
            out.vals,
            out.goal,
            out.meals,
            false,
        );
        out = {
            vals: tr.vals,
            goal: tr.goal,
            meals: tr.meals,
            extraRows: Object.assign({}, out.extraRows, tr.extraRows),
            contributors: Object.assign({}, out.contributors, tr.contributors),
        };
    }
    return out;
}

// ---- Meal items, from the result's `_meta` ----------------------------------
// A meal logged with an ingredient list carries its items in the result's
// `_meta` under "nutrition-mcp.com/meal-items" (no structuredContent object may
// gain a field — see "Server wiring" in CLAUDE.md), as
// `{ v: 1, meals: [ [item, …] | null, … ] }`: a plain array aligned BY
// POSITION with the breakdown rows, which carry no id. Each template reads the
// key itself and merges it here, after withAddedSugar. A missing, malformed or
// future-versioned payload merges nothing, so the rows — and the strip — are
// exactly what they were before the field existed.
function mealItemsPayload(raw) {
    return raw &&
        typeof raw === "object" &&
        raw.v === 1 &&
        Array.isArray(raw.meals)
        ? raw
        : null;
}

// Must equal MAX_ITEMS_PER_MEAL in src/meal-items.ts (checked by
// public/widgets/macros.test.ts): the server never stores more, so a longer
// slot is not something it sent.
const MEAL_ITEMS_CAP = 30;
const MEAL_ITEM_NUTRIENTS = [
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "saturated_fat_g",
    "trans_fat_g",
    "fiber_g",
    "sugar_g",
    "added_sugar_g",
    "alcohol_g",
    "caffeine_mg",
];

// One slot's items, validated: it arrives from the host, so it is untrusted.
// Keeps only objects with a non-empty string name and rebuilds each from the
// whitelisted fields alone, every number finite or null. Anything else is [].
function mealItemsOf(slot) {
    if (!Array.isArray(slot)) return [];
    const out = [];
    for (const it of slot) {
        if (out.length >= MEAL_ITEMS_CAP) break;
        if (!it || typeof it !== "object") continue;
        if (typeof it.name !== "string" || it.name === "") continue;
        const item = {
            name: it.name,
            amount: Number.isFinite(it.amount) ? it.amount : null,
            unit: typeof it.unit === "string" ? it.unit : null,
        };
        for (const k of MEAL_ITEM_NUTRIENTS) {
            item[k] = Number.isFinite(it[k]) ? it[k] : null;
        }
        out.push(item);
    }
    return out;
}

// Join a meal-items payload onto the breakdown rows as `meal.items`, by
// position and only when the counts agree; any mismatch returns `meals`
// itself, so a stale or foreign payload can never hang one meal's ingredients
// under another. Rows whose slot validates to no item stay the same object;
// the rest are copies, never the caller's own rows mutated.
function withMealItems(payload, meals) {
    if (!payload || !Array.isArray(meals)) return meals;
    if (payload.meals.length !== meals.length) return meals;
    return meals.map((meal, i) => {
        const items = mealItemsOf(payload.meals[i]);
        return items.length ? Object.assign({}, meal, { items }) : meal;
    });
}

// ---- Interactive breakdown ------------------------------------------------
// Set by macroPanel() when the strip is interactive; read by the delegated
// handlers below.
let __macroCtx = null;

// The list of meals that contributed a positive amount of one metric,
// largest-first, capped so a long range stays readable.
function mealList(m, meals, ctx) {
    // A single meal's contribution is a fraction of the day's, so grams get a
    // tenth here even where the strip rounds them whole — a 3.4 g and a 3.1 g
    // meal must not both read "3" in a list sorted by that very figure.
    // Whole-unit metrics keep their unit: kcal and mg of caffeine are quoted
    // whole at every scale (see the MACROS entries), and a tenth of a
    // milligram is below anything anyone can act on.
    const decimals = m.decimals === 0 && m.unit === "g" ? 1 : m.decimals;
    // `meals` plus this metric's own extra rows (metricRows), if any. The sort
    // is stable, so a tie keeps a kept row ahead of an extra one, and extras
    // keep the server's ranked order among themselves.
    const rows = metricRows(m, meals, ctx)
        .map((meal) => ({ meal, v: Number(meal?.[m.key] ?? 0) || 0 }))
        .filter((r) => r.v > 0)
        .sort((a, b) => b.v - a.v);

    if (!rows.length) {
        return `<div class="md-empty">${esc(tpl(T.macros.noMealsContributed, { label: macroLabel(m) }))}</div>`;
    }

    // Must equal MEAL_BREAKDOWN_TOP_N in src/widgets.ts (checked by
    // public/widgets/macros.test.ts): get_nutrition_summary
    // sends only the union of each metric's top N meals (added sugar's top N
    // completed by its `extra` rows), so a larger CAP would list rows the
    // server may have dropped.
    const CAP = 8;
    const shown = rows.slice(0, CAP);
    // Four cases for the "N more" line:
    //   1. a true count arrived (nutrition-summary's `_meta`) — exact;
    //   2. `meals` was trimmed server-side but no count arrived (a host that
    //      drops `_meta`) and rows run past CAP — the rows beyond CAP are only
    //      the ones some OTHER metric's top CAP kept, so the real number can
    //      be larger: say "N or more";
    //   3. the same, with exactly CAP rows — the commonest trim, where one set
    //      of big meals leads every metric: nothing proves a meal is missing,
    //      nothing proves none is, so say "possibly more" without a number;
    //   4. otherwise `meals` is complete (or under CAP) — exact from the rows.
    // "Trimmed" is `bounded` unless `mealTotal` shows every meal arrived.
    const count = ctx && ctx.contributors ? ctx.contributors[m.key] : null;
    // Number.isFinite, not a coercion: null (alcohol with tracking off) or a
    // stray string is "no count", never 0.
    const exact = Number.isFinite(count);
    const trimmed =
        !!(ctx && ctx.bounded) &&
        !(ctx.mealTotal != null && ctx.mealTotal <= meals.length);
    const lowerBound = !exact && trimmed && rows.length > CAP;
    const maybeMore = !exact && trimmed && rows.length === CAP;
    const extra = (exact ? count : rows.length) - shown.length;
    const items = shown
        .map(({ meal, v }, i) => {
            // Prefer a date tag for multi-day ranges, otherwise the meal type.
            const sub = meal.date
                ? esc(String(meal.date).slice(5))
                : meal.meal_type
                  ? esc(meal.meal_type)
                  : "";
            if (Array.isArray(meal.items) && meal.items.length) {
                return mealRowWithItems(m, meal, v, sub, decimals, i, ctx);
            }
            return `
        <li class="md-row">
          <span class="md-val" style="color:${m.color}">${fmt(v, decimals)}<span class="md-unit">${esc(unitLabel(m))}</span></span>
          <span class="md-name">${esc(meal.description || T.macros.untitledMeal)}</span>
          ${sub ? `<span class="md-sub">${sub}</span>` : ""}
        </li>`;
        })
        .join("");
    const more = maybeMore
        ? `<li class="md-more">${esc(T.macros.moreMealsMaybe)}</li>`
        : extra > 0
          ? `<li class="md-more">${esc(
                plural(
                    lowerBound ? T.macros.moreMealsAtLeast : T.macros.moreMeals,
                    extra,
                ),
            )}</li>`
          : "";
    return `<ul class="md-list">${items}${more}</ul>`;
}

// A breakdown row whose meal has ingredients: the same value / name / sub line,
// wrapped in a disclosure button, over a hidden list of the items ranked by the
// metric on show. Everything inside a <button> is its accessible name, so the
// figure is read as before, followed by the item count; no aria-label replaces
// it. The id only has to be unique within the document: a widget mounts one
// breakdown, and a page that mounts a second (the dev gallery's pinned copy
// beside its live strip) gives it its own `ctx.idPrefix`.
//
// The item list sits inside .macro-detail, which is aria-live so a swapped
// breakdown is announced; content made visible inside a live region counts
// as an addition, so without aria-live="off" opening a row would read every
// item aloud after the button's own "expanded". aria-expanded is the feedback.
function mealRowWithItems(m, meal, v, sub, decimals, i, ctx) {
    const prefix = (ctx && ctx.idPrefix) || "md-items";
    const id = `${prefix}-${m.key}-${i}`;
    const n = meal.items.length;
    return `
        <li class="md-row has-items">
          <button type="button" class="md-open" data-meal-open aria-expanded="false" aria-controls="${id}">
            <span class="md-val" style="color:${m.color}">${fmt(v, decimals)}<span class="md-unit">${esc(unitLabel(m))}</span></span>
            <span class="md-name">${esc(meal.description || T.macros.untitledMeal)}</span>
            ${sub ? `<span class="md-sub">${sub}</span>` : ""}
            <span class="md-count" aria-hidden="true">${n}</span><span class="md-chev" aria-hidden="true">›</span>
            <span class="sr-only">${esc(plural(T.macros.ingredientCount, n))}</span>
          </button>
          <ul class="md-items" id="${id}" aria-live="off" hidden>${mealItemRows(m, meal.items, decimals)}</ul>
        </li>`;
}

// One meal's items, biggest first by the metric on show. An item with no value
// for it reads "–" and sorts last; a recorded 0 is a value and reads "0". The
// sort is stable, so ties keep the order the items were logged in.
function mealItemRows(m, items, decimals) {
    return items
        .map((it) => ({ it, v: Number.isFinite(it[m.key]) ? it[m.key] : null }))
        .sort((a, b) =>
            a.v === null
                ? b.v === null
                    ? 0
                    : 1
                : b.v === null
                  ? -1
                  : b.v - a.v,
        )
        .map(({ it, v }) => {
            const val =
                v === null
                    ? `<span class="md-none" role="img" aria-label="${esc(T.macros.notRecorded)}">–</span>`
                    : `${fmt(v, decimals)}<span class="md-unit">${esc(unitLabel(m))}</span>`;
            const amt = Number.isFinite(it.amount)
                ? `<span class="md-iamt">${esc(String(it.amount))}${it.unit ? ` ${esc(it.unit)}` : ""}</span>`
                : "";
            return `<li class="md-item"><span class="md-ival">${val}</span><span class="md-iname">${esc(it.name)}</span>${amt}</li>`;
        })
        .join("");
}

// Build the breakdown for one metric: the meals behind it, in the strip's own
// card rather than on a second surface below it.
function macroDetailBody(m, ctx) {
    return `
      <div class="md-head">
        <span class="md-title"><span class="dot" style="background:${m.color}"></span>${esc(tpl(T.macros.byMealTitle, { label: macroLabel(m) }))}</span>
        <button class="md-close" data-macro-close aria-label="${esc(T.macros.closeBreakdown)}">✕</button>
      </div>${mealList(m, ctx.meals || [], ctx)}`;
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

// Open or close one meal's item list. One open at a time per breakdown:
// opening a row closes whichever was open, tapping the open row closes it, and
// switching metric rebuilds the list, which resets it (the item order depends
// on the metric). Height changes reach the host through the bridge's
// ResizeObserver, as the breakdown's own do.
function mealRowToggle(btn) {
    const scope = btn.closest(".macro-detail") || btn.closest(".md-list");
    if (!scope) return;
    const opening = btn.getAttribute("aria-expanded") !== "true";
    scope.querySelectorAll("[data-meal-open]").forEach((b) => {
        const on = b === btn && opening;
        b.setAttribute("aria-expanded", on ? "true" : "false");
        const row = b.closest(".md-row");
        if (row) row.classList.toggle("open", on);
        const list = row && row.querySelector(".md-items");
        if (list) list.hidden = !on;
    });
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
        // Before the tile lookup: a row button is a native <button>, so Enter
        // and Space arrive here as clicks and need no keydown branch.
        const mealRow = e.target.closest("[data-meal-open]");
        if (mealRow) {
            mealRowToggle(mealRow);
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
