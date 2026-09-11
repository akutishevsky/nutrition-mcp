// Macro strip builder — shared by every widget that shows intake vs goal.
//
// Renders ONE compact block: the focus panel (a ring beside the figure, its
// meta line and a sparkline), ONE rail holding every nutrient tile — the limits
// included, they no longer collapse behind anything — and the single shared
// drawer they all open into. A tile carries the metric's name, its figure
// printed against its goal, and a background wash filling to its share of that
// goal; the distance to it and the meals behind it are one tap away. It is not a card
// of its own — a widget drops it inside its `.card` under whatever top matter
// only that widget has (a chart, a range toggle, a weight line). Pairs with
// shared/chip.css.
//
// Requires fmt(n, decimals), esc(s) and icon(name, size) to already be defined
// in the widget scope.
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
// renders nowhere at all rather than silently sprouting a fourth chip. The
// roles are the running order:
//
//   cal    the hero — the calorie gauge and its figure. NEVER a chip: it is
//          the one number nobody should have to go looking for
//   macro  a chip, first on the always-visible rail
//   bar    a chip after the macros (water), same rail
//   limit  a chip after those, on the SAME rail, in MACROS order — the metrics
//          judged by a ceiling you stay under, plus fiber, which shares the
//          idiom because it is read the same way ("21.8, of 30 g") even though
//          it is a floor. These used to sit behind a `.more` disclosure and do
//          not any more: a nutrient the user recorded is one they want to see
//          (see macroPanel)
//
// A RECORDED ZERO renders three different ways across those roles, and the
// difference is deliberate — the layout audit flagged it as possibly
// accidental, so here is the reason for each:
//
//   macro  "0 g". The meals that produced the calorie figure produced this one
//          too, so a 0 is a measurement of the day and reads as one.
//   limit  "none logged" (T.macros.noneLogged), in words. A limit's 0 is not
//          "you consumed none of it and here is the number" — for the two
//          signal:"null" limits it is the only reading a day can have without
//          anyone ever having tracked the metric, and a "0 mg of 400 mg" line
//          invented for someone who has never recorded caffeine is exactly what
//          issue #78 was about. Words cannot be misread as a measurement.
//   bar    "0 L", but only once the metric is on screen at all — and whether
//          it is on screen is the same question a limit asks (metricShown):
//          water is logged separately from meals, so a day with no water
//          logged has no water reading as opposed to a reading of zero, and an
//          empty bar for a metric nobody tracks is noise. A GOAL changes that:
//          it is the user saying they track this, so 0 against it is a real
//          reading and prints as one.
//
// `color` is a ROLE CLASS, not a colour: it sets --c (see base.css), which the
// glyph, the wash, the gauge arc and the drawer head all read. No emitter
// here ever writes a colour, so adding a nutrient is one MACROS entry, one
// token and one role class.
//
// `glyph` names a DRAWING in shared/icon.js, not a metric — "drumstick", not
// "protein" — for the same reason `color` names a class and not a hex: the
// table of shapes and the table of metrics stay independent, and no emitter
// here ever learns which shape belongs to which nutrient. It replaces the
// colour dot on every tile, which gave the card a second identity channel
// besides hue; a metric with no glyph falls back to the dot, so an entry added
// without a drawing degrades rather than breaks.
//
// `direction` marks a target you stay UNDER rather than reach (mirrors
// GoalDirection in src/mcp.ts): exceeding a ceiling is flagged with --over,
// exceeding a floor is not.
//
// `signal` says what a 0 in the payload means, and so what earns a limit chip.
// "null" — the payload distinguishes never-recorded (null) from a recorded 0,
// so the null is the entire gate and a real 0 always shows. Only alcohol_g and
// caffeine_mg carry that signal (see totalsPayloadOf in src/mcp.ts).
// "data"  — TOTALS_ITEM types the metric as a plain number, so a day that
// recorded none of it is indistinguishable from a 0. The chip is earned by a
// value above zero or by a goal of the user's own, which is the same rule the
// carbs disclosure used when fiber and sugar lived inside it.
const MACROS = [
    {
        key: "calories",
        label: "Calories",
        unit: "kcal",
        color: "c-cal",
        glyph: "flame",
        decimals: 0,
        role: "cal",
    },
    {
        key: "protein_g",
        label: "Protein",
        unit: "g",
        color: "c-pro",
        glyph: "drumstick",
        decimals: 0,
        role: "macro",
    },
    {
        key: "carbs_g",
        label: "Carbs",
        unit: "g",
        color: "c-car",
        glyph: "bowl",
        decimals: 0,
        role: "macro",
    },
    {
        key: "fat_g",
        label: "Fat",
        unit: "g",
        color: "c-fat",
        glyph: "avocado",
        decimals: 0,
        role: "macro",
    },
    // Order among the limits is the order they are read: the two breaches people
    // act on first, then caffeine, then the one floor.
    {
        key: "sugar_g",
        label: "Sugar",
        unit: "g",
        color: "c-sug",
        glyph: "cube",
        decimals: 1,
        role: "limit",
        direction: "ceiling",
        signal: "data",
    },
    {
        key: "alcohol_g",
        label: "Alcohol",
        unit: "g",
        color: "c-alc",
        glyph: "glass",
        decimals: 1,
        role: "limit",
        direction: "ceiling",
        signal: "null",
        // Grams of ethanol mean nothing to most people, so the caption leads
        // with a drink count — see macroCaption. No other metric has a second
        // unit.
        gloss: "drinks",
    },
    {
        key: "caffeine_mg",
        label: "Caffeine",
        unit: "mg",
        color: "c-caf",
        glyph: "cup",
        // Whole milligrams. Every label and guideline is quoted that way (EFSA:
        // 400 mg/day), a tenth of a milligram is below anything anyone can act
        // on, and matching the model-facing text keeps "95 mg" one number in
        // both places. NOT a macro: caffeine carries zero kcal, so it must
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
        color: "c-fib",
        glyph: "leaf",
        decimals: 1,
        role: "limit",
        signal: "data",
    },
    {
        key: "water_ml",
        label: "Water",
        unit: "ml",
        // The ONE metric read in a different unit from the one it is stored in
        // — the payload is millilitres because that is what a glass is logged
        // in, but a day's intake is spoken in litres and "2,100 ml" is three
        // more glyphs for no more meaning.
        //
        // `display` exists so that conversion is ONE decision instead of six.
        // Before it, the chip printed "2.1 L" while its caption said "of
        // 2,500 ml · 400 ml left", its accessible name said "Water 2,100 ml"
        // and the chart foot under it said "Water avg 2,100 ml" — three units
        // for one metric on screen at once, and a WCAG 2.5.3 label-in-name
        // failure since the visible label was not contained in the accessible
        // name (found by the regression audit). Everything that renders a
        // value now goes through macroNum()/macroUnit(); a template drawing a
        // chart foot must use them too.
        //
        // Fixed decimals rather than fmt()'s: fmt round-trips through
        // Number(), so a round 2 L would print "2" beside a "2.5 L" goal.
        //
        // Litres is the DEFAULT, not the only reading: setWaterUnit (below)
        // re-points this at WATER_DISPLAYS' US or UK fluid ounce when the
        // payload's `water_unit` says the profile weighs in pounds.
        display: { unit: "l", per: 1000, decimals: 1 },
        color: "c-wat",
        decimals: 0,
        role: "bar",
        glyph: "droplet",
        // Same signal as fiber and sugar, and for the same reason: water_ml is
        // a plain number in the payload, so a 0 is indistinguishable from a day
        // nobody logged any. The gate is therefore the same one — a value, OR a
        // goal of the user's own (metricShown). Water used to be gated on
        // `> 0` alone, which meant someone who had set a 2.5 L target and not
        // yet drunk anything saw no water on the card at all: the one reading
        // where the goal is the whole point was the one reading that was
        // dropped. A goal is the user saying they are tracking it.
        signal: "data",
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

// One strip per widget, so one drawer per document — the same assumption
// __macroCtx below already makes.
const MACRO_DRAWER_ID = "macro-drawer";
// The drawer head's metric name, which is what the drawer region is labelled
// by (aria-labelledby) — see the drawer in macroPanel.
const MACRO_DRAWER_NAME_ID = "macro-drawer-name";

// The translated label for a metric, falling back to the English literal
// above if the current locale's dictionary (T, from shared/i18n.js) is
// somehow missing it. Not baked into the MACROS entries themselves: T is
// only resolved once the widget's locale is known (setLocale(), called from
// render()), which is after this module-level array is built.
function macroLabel(m) {
    return (T.macros.labels && T.macros.labels[m.key]) || m.label;
}

// A meal's type, translated. Shared rather than per-template because the same
// value is printed in two places on one card — meal-logged's header line and
// every drawer row's `.ds` — and a lookup in only one of them is how a Japanese
// card ended up reading "昼食" above a list of "lunch".
//
// Case-insensitive, and falls back to the RAW stored string. The server's enum
// is breakfast/lunch/dinner/snack (log_meal and update_meal in src/mcp.ts;
// bulk_import_meals coerces anything else to snack), so those four are all
// T.macros.mealTypes carries — but a row written before that enum, or by some
// other path, must still show its own word rather than drop off the line.
function mealTypeLabel(v) {
    const raw = String(v);
    return (T.macros.mealTypes && T.macros.mealTypes[raw.toLowerCase()]) || raw;
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

// The three ways water can read, keyed by the payload's `water_unit` (resolved
// server-side by waterUnitFor in src/units.ts from the profile's weight and
// drink-unit preferences). Litres print a decimal; fluid ounces are already a
// glass-sized step, so they print whole — "71/85 fl oz", not "71.0". `unit` is
// a CODE, like every MACROS entry's; macroUnit prints it through unitLabel.
// Both ounces share the "fl_oz" code: the US/UK difference is in `per`, and
// neither locale's reader writes them differently.
const WATER_DISPLAYS = {
    l: { unit: "l", per: 1000, decimals: 1 },
    us_fl_oz: { unit: "fl_oz", per: 29.5735295625, decimals: 0 },
    uk_fl_oz: { unit: "fl_oz", per: 28.4130625, decimals: 0 },
};

// Point water's `display` at the payload's unit. AMBIENT, like the locale
// (setLocale): every renderer below reads `m.display` through macroNum /
// macroUnit / macroSteps, so swapping the one entry is what keeps the chip,
// its caption, its accessible name, the rounding the states are decided on
// and any chart foot in the same unit. A template calls it from render(),
// beside setLocale, before painting anything. Anything unknown — including a
// payload from before the field existed — reads in litres, as it always did.
function setWaterUnit(code) {
    const water = MACROS.find((m) => m.key === "water_ml");
    if (water) water.display = WATER_DISPLAYS[code] || WATER_DISPLAYS.l;
}

// How a metric's figure READS — the single place the stored unit becomes the
// displayed one. An entry with no `display` reads in the unit it is stored in;
// water is the only one that does not (see its MACROS entry for what happened
// when six call sites each decided for themselves).
//
// Keep every rendering of a value on these three: the chip figure, every
// caption macroBits builds, the accessible name, the gauge's label, and any
// chart foot a template draws. The moment one is bypassed the card starts
// stating one metric in two units at once.
function macroNum(m, v) {
    const d = m.display;
    return d
        ? macroDecimal(Number(v || 0) / d.per, d.decimals)
        : fmt(v, m.decimals);
}
// Returns the PRINTED label (unitLabel, shared/i18n.js) of the display code —
// never compare its result against a code; compare m.unit / m.display.unit.
function macroUnit(m) {
    return unitLabel((m.display && m.display.unit) || m.unit);
}
// The two together, for prose: "2.1 L", "148 g", "185 mg".
function macroAmount(m, v) {
    return `${macroNum(m, v)} ${macroUnit(m)}`;
}

// THE GRID A FIGURE IS PRINTED ON, as a whole number of display steps: whole
// grams / kcal / mg, sugar's tenths of a gram, water's tenths of a LITRE (100 ml
// — `display` again, so the step is the one the chip prints, not the one the
// payload stores). macroBits compares these integers rather than raw floats,
// because every state it names is read off the printed figures: protein at
// 159.6 of 160 printed "160/160 g · 0 g left", water at 2,480 of 2,500 ml
// "2.5/2.5 L · 0.0 L left", and sugar at 45.04 of 45 turned red and said
// "45/45 g · 0 g over" — a verdict the reader cannot see in the numbers beside
// it. Integers also make "equal" an exact test instead of a float `=== 0`.
//
// Math.round, and the figure is then PRINTED from the snapped value
// (macroFromSteps) rather than from the raw one, so the comparison and the
// digits can never disagree on a half-way case (45.05 is 45.0499… in binary,
// which toFixed and Math.round(x * 10) round in opposite directions).
function macroSteps(m, v) {
    const d = m.display;
    const scale = Math.pow(10, d ? d.decimals : m.decimals);
    return Math.round(((Number(v) || 0) / (d ? d.per : 1)) * scale);
}
function macroFromSteps(m, steps) {
    const d = m.display;
    const scale = Math.pow(10, d ? d.decimals : m.decimals);
    return (steps / scale) * (d ? d.per : 1);
}

// A fixed-decimal figure in the WIDGET's locale. toFixed always emits a dot
// and Number#toLocaleString with no locale argument keys off
// navigator.language — the HOST BROWSER's language, not the user's saved
// widget locale — so one German card printed "Zucker 58,2/45 g" beside
// "Wasser 2.1/2.5 L": two decimal separators, same rail, same moment.
// Intl is a browser built-in, so this makes no network request and is fine
// under the iframe's `default-src 'none'` CSP (Intl.PluralRules is already
// used the same way in shared/i18n.js).
//
// Built PER CALL, not once at module scope: WIDGET_LOCALE is only assigned by
// setLocale(), which runs inside render(), so a formatter built up here would
// freeze on "en" forever. The try/catch is for the no-DOM test harness and any
// engine that rejects the tag.
function macroDecimal(v, decimals) {
    const n = Number(v) || 0;
    try {
        return new Intl.NumberFormat(
            typeof WIDGET_LOCALE === "string" ? WIDGET_LOCALE : "en",
            {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            },
        ).format(n);
    } catch (_) {
        return n.toFixed(decimals);
    }
}

// Does this metric READ IN WORDS rather than as a measurement? A limit with
// nothing recorded does — see the role notes on MACROS: "0 mg of 400 mg"
// invented for someone who has never tracked caffeine is what issue #78 was
// about, and words cannot be misread as a reading.
//
// ONE PREDICATE, because there were three and they disagreed. macroLimit
// decided it for the tile's figure; tileLabel re-derived it on `signal: "null"`
// alone, so a sugar tile SHOWED "none logged" and ANNOUNCED "Sugar 0 g" — the
// same WCAG 2.5.3 label-in-name failure the water case fixed once already; and
// focusInner asked nobody at all, so the focus panel printed "0/400 mg"
// directly above a tile reading "none logged", one metric rendered two ways on
// one card at one moment. The decision belongs with the thing that RENDERS the
// value (chipValue), not with each caller — the same shape as the role-class
// rule: state on the container, never on the element that consumes it.
//
// A MISSING reading reads that way too, for every role. `vals` is a range's
// averages or a day's totals, and a key that is simply absent is not a
// measurement of zero — it used to be read as `?? 0`, so an averages object
// without protein printed "0/160 g · 160 g left" for a metric nobody had
// measured. macroBits flags it (`missing`) and it takes the "none logged"
// treatment with no distance to the goal.
function macroReadsAsNone(m, b) {
    return b.missing || (m.role === "limit" && !(b.val > 0));
}

// value vs goal → filled fraction, the target caption, the remaining-amount
// caption. Underbars and the gauge keep their metric colour even past 100% so
// the series stay distinct; only the figure turns red to flag going over a
// ceiling.
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
    // null/undefined is MISSING, not zero — see macroReadsAsNone.
    const raw = vals?.[m.key];
    const missing = raw == null;
    const val = missing ? 0 : Number(raw) || 0;
    const target = goal?.[m.key] ?? null;
    // The value as PRINTED (see macroSteps). Every state below is decided on
    // these steps; only the fill fraction stays raw, since a sliver of fill
    // is not a verdict anyone reads a number off.
    const sv = macroSteps(m, val);

    // A ceiling of 0 is a real limit — "none today" is the most likely
    // alcohol limit there is — so it is honoured, while a floor of 0 stays
    // "no goal set" (a 0 g protein target is meaningless).
    const zeroCeiling = ceiling && target === 0;
    const goalSet = (target != null && target > 0) || zeroCeiling;

    let pct = null;
    let over = false;
    // Tracked separately from the (translated) deltaStr text so callers can
    // detect the "equal on screen" states without string-matching a localized
    // value — see atLimit's use in macroCaption.
    let atLimit = false;
    let atGoal = false;
    let targetStr;
    let deltaStr = "";
    let goalShown = null;
    if (!goalSet) {
        targetStr = T.macros.noGoalSet;
    } else {
        const st = macroSteps(m, target);
        goalShown = macroFromSteps(m, st);
        // Every figure in these strings goes through macroAmount, so a metric
        // with a `display` (water) states its goal and its distance in the
        // same unit its chip prints — see the water MACROS entry.
        targetStr = `${ceiling ? T.macros.limitPrefix : T.macros.ofPrefix} ${macroAmount(m, goalShown)}`;
        if (zeroCeiling) {
            // Percent of zero has no value to report, so it is pinned rather
            // than left to divide into Infinity/NaN.
            over = sv > 0;
            pct = over ? 100 : 0;
        } else {
            pct = (val / target) * 100;
            over = sv > st;
        }
        if (missing) {
            // Nothing measured, so there is no distance to state — only the
            // goal it would be measured against.
        } else if (zeroCeiling && !over) {
            // A SOBER DAY IS NOT "AT LIMIT". With a limit of 0 and nothing
            // consumed, the steps are equal and the branch below would call it
            // "limit 0 g · at limit" — the phrasing of someone who has used up
            // their allowance, for the day they kept the limit perfectly. It
            // reads as the limit alone, with no distance at all.
        } else {
            const d = st - sv;
            if (d < 0) {
                deltaStr = `${macroAmount(m, macroFromSteps(m, -d))} ${overWord}`;
            } else if (d === 0) {
                // EQUAL ON SCREEN IS ITS OWN STATE, on either side of a
                // target. "0 g under" would be read as room left and "0 g
                // left" as a leftover of nothing; a ceiling reached is "at
                // limit" (never red — `over` is strictly past it) and a floor
                // reached is "at goal".
                if (ceiling) {
                    deltaStr = T.macros.atLimit;
                    atLimit = true;
                } else {
                    deltaStr = T.macros.atGoal;
                    atGoal = true;
                }
            } else {
                deltaStr = `${macroAmount(m, macroFromSteps(m, d))} ${underWord}`;
            }
        }
    }
    const frac = pct == null ? 0 : Math.max(0, Math.min(pct, 100)) / 100;
    const goalLine = deltaStr ? `${targetStr} · ${deltaStr}` : targetStr;
    return {
        val,
        // The value and goal AS PRINTED, in stored units — what chipValue
        // renders, so the digits are the ones the states were decided on.
        shown: macroFromSteps(m, sv),
        goalShown,
        missing,
        target,
        goalSet,
        pct,
        over,
        atLimit,
        atGoal,
        frac,
        goalLine,
        targetStr,
        deltaStr,
    };
}

// Is there anything behind THIS chip to disclose? Two conditions, and both
// matter:
//
//   1. the widget passed per-meal rows at all (trends does not, so its rails
//      disclose nothing), and
//   2. at least one of those meals contributed a positive amount of this
//      metric.
//
// The second is what keeps a chip from being a button that opens an empty list.
// Every metric on the strip is in MEAL_BREAKDOWN_ITEM (src/mcp.ts) — the limits
// included — so the test is the same one for all of them: a limit chip is
// tappable exactly when meals are behind it, and an alcohol chip reading "none
// logged" stays the static chip it always was. Water is never interactive by
// the same rule and needs no special case: water is logged separately and no
// meal row carries `water_ml`.
function macroHasDetail(m, ctx) {
    if (!ctx.meals) return false;
    return ctx.meals.some((meal) => (Number(meal?.[m.key]) || 0) > 0);
}

// Is this metric one the widget's chart can draw? A chip that selects a series
// is interactive even where no meal breakdown exists — that is the whole of
// trends' interactivity — but ONLY when the caller opted in through
// opts.chartKeys, so a strip built without it behaves exactly as before.
function macroOnChart(m, ctx) {
    return ctx.chartKeys.indexOf(m.key) !== -1;
}

// A chip is a control when it opens meals, selects a chart series, or both.
function macroTappable(m, ctx) {
    return macroHasDetail(m, ctx) || macroOnChart(m, ctx);
}

// The accessible name of an interactive chip — VALUE FIRST, action second.
//
// A <button> makes its children presentational: the gauge's own aria-label, the
// metric name and the goal caption all drop out of the accessibility tree, so a
// screen reader hears the action and no numbers at all, while the static chip
// beside it reads "Protein 148 g, of 160 g · 12 g left". Folding the value and
// goal state into the name restores exactly what the static chip exposes, in
// one announcement.
//
// The alternative — moving the button role to an inner element so the values
// stay exposed — was rejected: the whole pill is the tap target, so the button
// would either be smaller than what responds to a tap or would nest a second
// target inside the first.
//
// THE VISIBLE FIGURE, VERBATIM (WCAG 2.5.3 label-in-name). The tile prints
// "148/160 g" and the name used to say "148 g, of 160 g" — the visible string
// was not in the name, so a voice user saying what they see hit nothing. The
// name now carries chipValueText, which is built from the same pieces as the
// figure chipValue prints, and then only what the figure does NOT already say:
//
//   the distance      "12 g left" / "at goal" / "13.2 g over"
//   the limit phrase  "limit 45 g", on a CEILING only — "58.2/45 g" says there
//                     is a 45 but not that it is a limit, and "under" alone
//                     is ambiguous in several locales (pl "poniżej")
//   the goal phrase   when the figure carries no goal: "no goal set", or
//                     "of 160 g" beside a missing reading
//
// "·" separates value from goal visually; screen readers either skip it or
// announce "middle dot", so the spoken name uses commas. Returned WITHOUT a
// closing full stop: chipLabel and focusApply each finish the sentence with
// the action they promise.
function tileLabel(m, b) {
    const parts = [];
    if (m.direction === "ceiling" || !(b.target > 0) || b.missing) {
        parts.push(b.targetStr);
    }
    if (b.deltaStr) parts.push(b.deltaStr);
    return `${macroLabel(m)} ${chipValueText(m, b)}, ${parts.join(", ")}`;
}

// What activating THIS chip does, said once and truthfully. Three cases, one
// sentence each:
//
//   meals behind it           "Show the meals that contributed."
//   meals AND a chart series  that, then "Also shows this nutrient on the
//                             chart."
//   a chart series only       "Show this on the chart." (T.macros.showOnChart)
//
// The third used to be the second with its first half sliced off by length,
// which left "Also …" with nothing before it — on nutrition-summary's Water,
// and on EVERY tile of a range whose payload carries `meals: []`.
//
// Gated on macroOnChart — THIS chip being drawable — and not on the widget
// merely having a chart: nutrition-summary's chartableKeys() deliberately
// excludes the calorie hero, and gating on `ctx.chartKeys.length` had the hero
// promising a chart change that tapping it never makes (regression audit).
function chipLabel(m, b, ctx) {
    const name = `${tileLabel(m, b)}.`;
    const meals = macroHasDetail(m, ctx);
    if (!macroOnChart(m, ctx))
        return `${name} ${T.macros.showMealsContributed}`;
    if (!meals) return `${name} ${T.macros.showOnChart}`;
    return `${name} ${T.macros.showMealsContributed} ${T.macros.alsoChart}`;
}

// The attributes that turn a chip (or the hero) into a control, in the order
// the a11y snapshot test reads them.
//
// TWO SPECIES, and which one this is decides the STATE attribute as well as
// aria-controls:
//
//   a DISCLOSURE (meals sit behind it) gets aria-expanded plus aria-controls
//   naming the drawer it opens;
//   a TOGGLE (it only re-strokes the widget's chart) gets aria-pressed.
//
// Emitting aria-expanded on the second kind announced "expanded" and left the
// user hunting for a region that was never built — in trends there is no
// `.drawer` element in the document at all, and nutrition-summary's Water chip
// is the same case (a11y audit measured both). This is the reasoning the
// aria-controls gate already made — "pointing at an absent id is worse than
// saying nothing" — applied to the state attribute too. chipMarkup drops the
// disclosure chevron on the toggle species for the same reason.
function tapAttrs(m, b, ctx) {
    const state = macroHasDetail(m, ctx)
        ? ` aria-expanded="false" aria-controls="${MACRO_DRAWER_ID}"`
        : ` aria-pressed="false"`;
    return ` data-macro="${m.key}"${state} aria-label="${esc(chipLabel(m, b, ctx))}"`;
}

// The state attribute a control emitted (see tapAttrs), and its current value.
// Read off the element rather than recomputed, so the delegated handler works
// identically on a chart-only rail that has no drawer to consult.
function tapStateAttr(el) {
    return el.hasAttribute("aria-pressed") ? "aria-pressed" : "aria-expanded";
}

// The caption a chip carries for a screen reader and the drawer repeats in
// full. A macro's is the whole goal line; a LIMIT's is the limit itself, and
// the distance to it joins only when that is the thing to act on. Under a limit
// "13.1 g under" is noise — but a breach the chip already flags in --over
// deserves its words, and "at limit" is a state colour cannot express at all
// (`over` is pct > 100, so exactly at a ceiling reads as comfortably under it
// otherwise).
function macroCaption(m, b, ctx) {
    if (m.role !== "limit") return b.goalLine;
    let cap = b.targetStr;
    if (b.val > 0 && m.gloss === "drinks") {
        const drinks = macroDecimal(b.val / DRINK_GRAMS[ctx.drinkUnit], 1);
        // A template, not a suffix: Japanese needs the counter ON the number
        // ("2.0杯（US基準）") where "2.0 US基準の杯数" read as "2.0 drink-count".
        cap = `${tpl(T.macros.drinkLabels[ctx.drinkUnit], { n: drinks })} · ${cap}`;
    }
    if (b.deltaStr && (b.over || b.atLimit)) {
        cap = `${cap} · ${b.deltaStr}`;
    }
    return cap;
}

// THE FOCUS PANEL — the top of the card, and the one thing on it that is not a
// tile.
//
// Three shapes were rejected before this one, and all three failed the same
// way: they stacked the same parts vertically and left a row that held one
// number and a lot of air. The fix was not another arrangement, it was asking
// what each part is FOR and giving each exactly one job:
//
//   the ring      how far along  — the universal idiom for a goal, and the one
//                                  thing a glance should land on
//   the figure    the value, and what it is measured against
//   the meta      the period, and the distance left, in words
//   the sparkline the shape of the period — the only part that says whether
//                                  today is typical
//
// Nothing is drawn twice. The old panel had a ring AND a wash AND a chart all
// encoding the same fraction, and a date row restating a range the card header
// already prints.
//
// IT IS ONE ROW, and it compacts by WRAPPING rather than by a breakpoint. The
// sparkline is the flexible item (`flex: 1 1 150px`), so it takes whatever is
// left on a wide card and drops to its own full-width line under the figure
// when there is less than 150px for it — no media query, and the same markup at
// every width.
//
// The WHOLE PANEL is the button. The sparkline sits inside it, and a button
// makes its children presentational, so the chart is explicitly aria-hidden and
// the trend it shows is described in the button's own aria-label instead.
// When the focus panel flags a breach. A CEILING passed is a breach by
// definition — that is the tiles' rule and it is unchanged. Calories is the one
// addition: it declares no `direction`, so by the tiles' rule alone it would
// never flag, but a calorie goal is read as a ceiling by everyone who sets one,
// and the panel is the only place calories is shown. macroBits already words it
// that way ("1,000 kcal over"); this is what colours it to match.
//
// A floor that is merely exceeded — protein past its target — still does not
// flag, here or on a tile.
function focusOver(m, b) {
    return b.over && (m.direction === "ceiling" || m.role === "cal");
}

function focusRing(m, b) {
    // r=17 on a 40 viewBox: 2πr = 106.81, held back by the filled fraction. No
    // centre text — the figure it would repeat is 11px to its right at three
    // times the size.
    //
    // THE ARC IS OMITTED ENTIRELY AT ZERO, not drawn with a full offset. A
    // zero-length dash with `stroke-linecap: round` still paints a dot (SVG
    // 1.1 §11.4), so a day with nothing logged showed a tick at twelve
    // o'clock — a sliver of progress that does not exist. An empty track is
    // the honest picture of nothing.
    //
    // …but an empty track is only honest when there IS a goal to be 0% of.
    // With no goal (or no reading at all — see macroReadsAsNone) the track
    // alone read as "0% done" beside a figure that is nothing of the kind, the
    // exact misreading `.fdelta.mute`'s "no goal set" is there to prevent. So
    // the whole ring goes: the ring is the fraction, and there is none.
    if (!b.goalSet || b.missing) return "";
    const arc =
        b.frac > 0
            ? `<circle class="fra" cx="20" cy="20" r="17" transform="rotate(-90 20 20)" stroke-dasharray="106.81" stroke-dashoffset="${(106.81 * (1 - Math.min(b.frac, 1))).toFixed(2)}"></circle>`
            : "";
    return `<span class="fring"><svg viewBox="0 0 40 40" aria-hidden="true"><circle class="frt" cx="20" cy="20" r="17"></circle>${arc}</svg></span>`;
}

// `control` overrides "is this metric tappable" with "is this PANEL a control",
// which is not always the same question — see focusApply. Left undefined by
// focusPanel, which decides the tag from the same metric it is rendering.
// `mirror` is focusApply's return-to-calories mode, which swaps the disclosure
// chevron for a ✕ — the panel no longer discloses anything, it closes.
function focusInner(m, ctx, control, mirror) {
    const b = macroBits(m, ctx.vals, ctx.goal, ctx.wording);
    const on = control === undefined ? macroTappable(m, ctx) : !!control;
    // Calories names the PERIOD it covers ("Daily avg · logged days" — the one
    // place the denominator is named, #70); any other metric names itself,
    // because the period has not changed and its own name is what just did.
    const label = m.role === "cal" ? ctx.calLabel : macroLabel(m);
    // The distance left joins the label on one line instead of floating in a
    // pill at the far right of an otherwise empty row. It is the one part of
    // that line worth reading twice, so it is the one part in --ink.
    const delta = b.deltaStr
        ? `<b class="fdelta${focusOver(m, b) ? " over" : ""}">${esc(b.deltaStr)}</b>`
        : `<b class="fdelta mute">${esc(b.targetStr)}</b>`;
    const chev = mirror
        ? `<span class="chev">${icon("x", 12)}</span>`
        : on && macroHasDetail(m, ctx)
          ? `<span class="chev">${icon("chev", 14)}</span>`
          : "";
    // THREE PARTS, not one run of text. The meta line is one ellipsised row,
    // and an ellipsis eats what comes LAST — which was the delta, the one part
    // of the line worth reading twice. Measured at 320px: the distance left was
    // entirely absent in de/es/fr/it/uk and fully present in en and ja, same
    // card, same data, because the calorie label ("Daily avg · logged days")
    // is short in exactly those two languages. Split so chip.css can floor the
    // delta and shrink only the label — the same "floor it on the part that
    // must survive" `.fmain` already applies to the figure.
    return `${focusRing(m, b)}<span class="fmain"><span class="v">${chipValue(m, b)}</span><span class="fmeta"><span class="flabel">${esc(label)}</span><span class="fsep">·</span>${delta}</span></span><span class="fspark"></span>${chev}<span class="dcap">${esc(macroCaption(m, b, ctx))}</span>`;
}

// The panel. It is a <button> when there are meals behind the metric and a
// <span> otherwise, so the reset in chip.css has to suit both.
function focusPanel(m, ctx) {
    const b = macroBits(m, ctx.vals, ctx.goal, ctx.wording);
    const on = macroTappable(m, ctx);
    const tag = on ? "button" : "span";
    const type = on ? ' type="button"' : "";
    // NO `--p`. The panel carries no wash — chip.css says so outright ("its
    // ring is what encodes the fraction, and a wash behind it would be the same
    // number a second time") and declares no `--wash` on `.focus` — so the
    // property was written on every render and every series switch and read by
    // nothing. A dead write with a comment defending it is how the dead write
    // outlives the next cleanup.
    return `<${tag} class="focus ${m.color}${focusOver(m, b) ? " over" : ""}"${type}${on ? tapAttrs(m, b, ctx) : ""}>${focusInner(m, ctx)}</${tag}>`;
}

// Hand an existing panel a different metric. Everything that has to move moves
// together — the inner content, the colour role class the sparkline inside
// inherits --c from, and the over state. Doing it here rather than in the
// template is what keeps that list honest: an earlier version lived in the
// template and left every switched series showing the CALORIE fill under its
// own number.
//
// `selected` is the state the panel is being handed — whether THIS metric is
// the one currently open/pressed. It is a parameter and not a guess because
// the panel is a mirror: the metric it shows is chosen elsewhere (macroToggle,
// then the template's onSeries), and only the caller knows whether that metric
// arrived selected or released.
//
// A MIRROR IS NOT A SECOND COPY OF THE TILE. Handing the panel a non-calorie
// metric used to make it that metric's control in every attribute — same name,
// same aria-expanded, same aria-controls — so the a11y tree read two
// consecutive identical "Protein …, expanded" buttons, and the calorie drawer
// could not be reached at all until the tile was closed, because the only
// control that opened it was now wearing protein's identity. So while it shows
// any metric other than calories, the panel is a plain button with ONE job:
// its name says what it is showing (T.macros.showingMetric) and activating it
// returns to calories by closing whatever tile is open, through that tile
// (macroReturn). It carries `data-macro-return` instead of `data-macro`, so
// macroToggle's state loop, the ✕'s opener lookup and every `[data-macro]`
// query see exactly one control per metric again.
function focusApply(fx, m, ctx, selected) {
    if (!fx) return;
    const b = macroBits(m, ctx.vals, ctx.goal, ctx.wording);
    const isButton = fx.tagName === "BUTTON";
    const mirror = isButton && m.role !== "cal";
    // A CONTROL ONLY IF THE PANEL IS ONE. focusPanel picks <button> vs <span>
    // once, from the CALORIE metric — so a range whose meals are all zero-calorie
    // (coffee, tea) renders a <span class="focus">. Handing that span a tappable
    // metric used to stamp data-macro + aria-expanded + aria-controls onto it,
    // producing a generic element that the delegated click handler opened for
    // mouse users while it had no role, no tabindex and `cursor: default` — an
    // affordance for pointers and not for keyboards, wearing ARIA a generic
    // element may not carry. The tile stays the control in that case.
    const control = isButton && !mirror && macroTappable(m, ctx);
    fx.innerHTML = focusInner(m, ctx, control, mirror);
    fx.className = `focus ${m.color}${focusOver(m, b) ? " over" : ""}`;
    // ITS IDENTITY, NOT JUST ITS APPEARANCE. This used to rewrite the content
    // and stop, leaving data-macro, aria-label and the expanded/pressed state
    // frozen on calories — so after tapping Protein the headline control
    // displayed "148/160 g", announced "Calories 2,035 kcal", and toggled the
    // CALORIE drawer when activated. Three different metrics from one button.
    //
    // The state attribute has to be rebuilt rather than carried over: whether
    // this metric discloses a drawer (aria-expanded) or only re-strokes the
    // chart (aria-pressed) is a property of the METRIC, and the two species do
    // not use the same attribute. Remove both before setting either, or a
    // switch from a disclosing metric to a chart-only one leaves a stale
    // aria-expanded behind next to the new aria-pressed.
    //
    // Its VALUE, though, is `selected` and not a hardcoded "false". macroToggle
    // sets the panel's state to "true" and THEN calls onSeries, which lands
    // back here — so writing "false" unconditionally undid the state a moment
    // after setting it. Three things followed, all of them shipped: the panel
    // never painted the selected tint, ring or rotated chevron the tile paints
    // for the identical state; it announced "collapsed" over an open drawer;
    // and `open` is derived from that attribute, so re-activating it re-opened
    // the drawer instead of closing it — the panel's own breakdown had no exit
    // at all, and the drawer's ✕ (which resolves its trigger by key, and the
    // panel is first in document order) re-rendered what it was asked to close.
    //
    // Attributes are set in tapAttrs' order — data-macro, state, aria-controls,
    // aria-label — so a panel and a tile serialise the same way.
    fx.removeAttribute("aria-expanded");
    fx.removeAttribute("aria-controls");
    fx.removeAttribute("aria-pressed");
    fx.removeAttribute("data-macro-return");
    if (control) {
        const state = selected ? "true" : "false";
        fx.setAttribute("data-macro", m.key);
        if (macroHasDetail(m, ctx)) {
            fx.setAttribute("aria-expanded", state);
            fx.setAttribute("aria-controls", MACRO_DRAWER_ID);
        } else {
            fx.setAttribute("aria-pressed", state);
        }
        fx.setAttribute("aria-label", chipLabel(m, b, ctx));
    } else {
        // removeAttribute, not `delete dataset.macro`: the same call works on
        // the test harness's stand-in element, and it is one idiom for all
        // four attributes this function takes off.
        fx.removeAttribute("data-macro");
        if (mirror) {
            fx.setAttribute("data-macro-return", "");
            fx.setAttribute(
                "aria-label",
                tpl(T.macros.showingMetric, { metric: tileLabel(m, b) }),
            );
        } else {
            fx.removeAttribute("aria-label");
        }
    }
}

// The ctx macroPanel last stashed, so a template can re-render the focus panel
// for a different metric without rebuilding the strip. One strip per document,
// so one ctx is enough — the same assumption macroToggle already makes.
function macroCtx() {
    return __macroCtx;
}

// What a chip PRINTS. Two rules beyond "the figure and its unit":
//
//   * a limit with a real recorded zero reads in words, not as a measurement —
//     see macroReadsAsNone, and the role notes on MACROS. The test lives HERE,
//     in the renderer, and not in each caller: it used to be passed in as
//     `opts.words` by macroLimit, so the focus panel — the second caller, which
//     passes no such option — printed "0/400 mg" under a tile reading "none
//     logged";
//   * a goal, when there is one, printed beside the figure ("58.2/45 g") on
//     EVERY tile — see below. This used to depend on whether the tile was
//     interactive, which is why the builder still took an options object; it
//     no longer reads one, so it no longer takes one.
//
// A target of 0 is deliberately left off: "5.2 /0 g" reads as a typo, and a
// breached zero ceiling is already carried by the caption.
//
// It prints `b.shown` / `b.goalShown` — the figures SNAPPED to their display
// step (macroSteps) — rather than the raw ones, so the digits are exactly the
// ones macroBits decided "at goal" / "over" on. chipValueText below is the
// same figure as plain text, for the accessible name; the two must stay in
// step, which is why they sit together.
function chipValue(m, b) {
    if (macroReadsAsNone(m, b))
        return `<span class="none">${esc(T.macros.noneLogged)}</span>`;
    const val = macroNum(m, b.shown);
    const unit = esc(macroUnit(m));
    // EVERY tile prints its figure against its goal, tappable or not. It used
    // to print the bare figure and keep the goal for the drawer, which made a
    // metric's own target a thing you had to go looking for and left "over a
    // ceiling" carried by hue alone once the warning marker was dropped.
    // "58.2/45 g" says the breach in numbers — the informational cue, in the
    // slot that already exists. A metric with no goal prints the figure alone;
    // there is nothing to print it against.
    if (!(b.target > 0)) return `${val}<span class="u">${unit}</span>`;
    return `${val}<span class="u">/${macroNum(m, b.goalShown)} ${unit}</span>`;
}

// chipValue's figure as the words a screen reader and a voice user get:
// "148/160 g", "2.1 L", "none logged". See tileLabel for why it must be the
// visible string and not a paraphrase of it.
function chipValueText(m, b) {
    if (macroReadsAsNone(m, b)) return T.macros.noneLogged;
    const val = macroNum(m, b.shown);
    const unit = macroUnit(m);
    if (!(b.target > 0)) return `${val} ${unit}`;
    return `${val}/${macroNum(m, b.goalShown)} ${unit}`;
}

// The metric's mark: its glyph where the strip has one and the entry names a
// drawing, the plain colour dot otherwise. ONE decision point, called by both
// the tile and the drawer head — they sit on screen together whenever a
// breakdown is open, so a card that drew one as a shape and the other as a dot
// would be showing the same metric two ways at once. The `.dot` class is kept
// on the fallback exactly as it was, so an untiered widget's markup is
// unchanged.
function macroMark(m, ctx, size) {
    return ctx && ctx.tiers && m.glyph
        ? glyph(m.glyph, size || 17)
        : '<span class="dot"></span>';
}

// Where the mark SITS, which differs by species and is why this is not one
// string. A glyph is a grid item of the tile itself, so it can take a column of
// its own and centre across both rows the way the chevron does (chip.css). The
// dot cannot move: it lives inside `.ktop` beside the label, and hoisting it
// out would re-lay-out every widget still on the flat rail — which is the one
// thing the tiered flag exists to avoid. So the tiered tile emits the mark
// before `.ktop` and an untiered one emits it inside, and `.ktop` is left
// holding only the label in the first case.
function macroMarkOutside(m, ctx) {
    return ctx && ctx.tiers && m.glyph ? macroMark(m, ctx) : "";
}
function macroMarkInside(m, ctx) {
    return ctx && ctx.tiers && m.glyph ? "" : '<span class="dot"></span>';
}

// One chip: the metric's mark, its name, its figure, and the progress
// underbar.
//
// A real <button> when it is a control and a <span> when it is not, rather than
// one element with role="button" toggled on it: the static chip must not be
// focusable, must not announce itself as a button, and must keep its children
// in the accessibility tree.
function chipMarkup(m, b, opts) {
    const ctx = opts.ctx;
    const on = !!opts.interactive;
    // A floor passed is not a breach — only a ceiling is flagged.
    const over = b.over && m.direction === "ceiling";
    const tag = on ? "button" : "span";
    const type = on ? ' type="button"' : "";
    // The chevron is the DISCLOSURE affordance and nothing else. A chip that
    // only selects a chart series (trends' whole rail) opens nothing, so a
    // chevron on it promises a panel that does not exist — the visual half of
    // the aria-expanded fix in tapAttrs. It keeps the bordered pill, which is
    // what already separates a control from the borderless `.static` species.
    const chev =
        on && macroHasDetail(m, ctx)
            ? `<span class="chev">${icon("chev", 12)}</span>`
            : "";
    // Every tile wears the same dot, including one past its ceiling. A rail of
    // metrics reports what was eaten; it does not raise alarms, so a tile is
    // never a different SHAPE from its neighbours (deliberate design call — an
    // earlier pass put a warning triangle in the dot's slot here). What carries
    // the breach instead is INFORMATION: the value prints against its limit
    // ("58.2/45 g", see chipValue), so the state is legible from the numbers
    // rather than from hue alone, and the fill and the hairline turn --over on
    // top of that.
    //
    // TWO ROWS, not one line: name and its dot above, figure below, so a grid
    // of these reads down the columns as well as across, and the figure gets a
    // size worth reading. `--p` is the progress the tile's own background
    // fills to — see chip.css. It is a percentage string so CSS can feather
    // the leading edge against it without any further arithmetic.
    return `<${tag} class="chip${on ? "" : " static"}${over ? " over" : ""} ${m.color}"${type}${on ? tapAttrs(m, b, ctx) : ""} style="--p:${(b.frac * 100).toFixed(1)}%;--i:${opts.i || 0}">${macroMarkOutside(m, ctx)}<span class="ktop">${macroMarkInside(m, ctx)}<span class="k">${esc(macroLabel(m))}</span></span><span class="v">${chipValue(m, b)}</span>${chev}<span class="dcap">${esc(macroCaption(m, b, ctx))}</span></${tag}>`;
}

// Protein / carbs / fat — and water, which used to need an emitter of its own
// purely for the litre conversion. `display` on the MACROS entry decides how
// the figure reads now, so one builder covers both roles: the unit was needed
// in five other places too, which is precisely the bug it caused.
// `i` is the tile's position on the rail, and it exists only so chip.css can
// stagger the entrance — it has no bearing on what a tile says.
function macroChip(m, ctx, interactive, i) {
    const b = macroBits(m, ctx.vals, ctx.goal, ctx.wording);
    return chipMarkup(m, b, { ctx, interactive, i });
}

// Kept as a name because the dev gallery renders the water specimen through it
// and because "which builder made this chip" is worth being able to say.
function waterChip(m, ctx, interactive, i) {
    return macroChip(m, ctx, interactive, i);
}

// Does this metric earn a tile? Asked of every metric whose reading might be
// absent rather than zero — the four limits and water — and answered from
// `signal` on the MACROS entries: for alcohol and caffeine the payload's null
// is the whole gate and a recorded 0 is a real reading that stays on screen;
// for fiber, sugar and water a 0 could equally mean nobody logged any, so the
// tile is earned by a value or by a goal of the user's own.
//
// What the gate prevents is a "0 mg of 400 mg" line invented for someone who
// has never recorded any — the same suppression the model-facing text applies
// (recordedGoalLine in src/mcp.ts).
//
// It was called limitShown and water had a `> 0` test of its own inlined in
// macroPanel. Two gates for one question is how they drift: the inline one had
// no goal clause, so a user with a 2.5 L target and nothing drunk yet got no
// water row, while a user with a 30 g fiber target and nothing eaten yet got a
// fiber tile reading "none logged".
function metricShown(m, ctx) {
    const v = ctx.vals?.[m.key];
    if (v == null) return false;
    if (m.signal === "null") return true;
    return v > 0 || (ctx.goal ? (ctx.goal[m.key] ?? null) != null : false);
}

// A limit chip. A metric recorded as none reads that way in words rather than
// as a 0 that looks like a measurement (chipValue decides that now — see
// macroReadsAsNone; this used to hand the words down as an option, which is
// how the focus panel ended up printing the figure for the same reading);
// everything else is the figure and its unit, with the limit itself waiting in
// the caption.
function macroLimit(m, ctx, interactive, i) {
    // The gate again, so the chip builder is safe to call on its own and can
    // never invent a reading the strip would have suppressed.
    if (!metricShown(m, ctx)) return "";
    const b = macroBits(m, ctx.vals, ctx.goal, ctx.wording);
    return chipMarkup(m, b, { ctx, interactive, i });
}

// Everything the strip and its disclosure need, in one object: the values, the
// goals, the caption wording, the optional per-meal rows, the drink unit, the
// label above the calorie figure, and the widget's chart coupling. Built once
// per macroPanel() call and stashed for the delegated toggle handler.
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
        // The shared default calorie label, translated via
        // T.macros.caloriesToday. goal-progress.html and meal-logged.html
        // pass this same default explicitly when data.date is the viewer's
        // today, and T.macros.caloriesOn (day-scoped) otherwise, so the hero
        // never claims "today" for a date it knows is not (#114);
        // nutrition-summary.html and trends.html always pass their own more
        // specific calLabel (day count / range-averaged wording).
        calLabel: (opts && opts.calLabel) || T.macros.caloriesToday,
        // Set by a widget that puts something of its own — a chart, a range
        // toggle's chart — between the header line and the strip, so the strip
        // opens with the same hairline that separates its own sections.
        divided: !!(opts && opts.divided),
        // The chart coupling, passed explicitly rather than reached for through
        // a global: `chartKeys` are the metrics the widget's chart can draw,
        // and `onSeries(key, opened)` is what re-strokes it. A template that
        // forgets to pass them gets a strip that discloses meals and nothing
        // else, instead of a silent no-op — and a test can hand in a spy.
        // VISUAL LEVELS, opt-in. The strip's default is one flat rail of
        // identical tiles: every metric after the hero carries the same weight,
        // so sugar reads as loudly as protein and water — which is not food and
        // has no meal behind it — sits between fat and sugar as if it were one.
        // With `tiers` the same tiles are dealt into the three groups the
        // `role` field has always described, and chip.css gives each group its
        // own size and shape (see "the tiers" there).
        //
        // A FLAG AND NOT THE DEFAULT, for now: four widgets share this strip
        // and they are being moved one at a time, so the untiered path below is
        // still the one the other three render. Delete the flag — and the
        // `if` in macroPanel — once every caller passes it.
        tiers: !!(opts && opts.tiers),
        chartKeys:
            opts && Array.isArray(opts.chartKeys) ? opts.chartKeys.slice() : [],
        onSeries:
            opts && typeof opts.onSeries === "function" ? opts.onSeries : null,
    };
}

// Full macro strip: the focus panel, ONE rail carrying every metric (macros,
// water, then the limits), and the drawer they all open into — laid out by
// role, never by a hardcoded key list.
//
// `meals` is optional: when a non-empty array of per-meal breakdown rows is
// passed (each { description, meal_type, date, calories, protein_g, carbs_g,
// fat_g, fiber_g, sugar_g, alcohol_g, caffeine_mg }), every chip some meal
// contributed to becomes tappable and reveals those meals (see macroToggle) —
// the limits included, not just calories and the three macros.
//
// `opts` is optional: { drinkUnit: "us" | "uk", calLabel: string,
// divided: boolean, tiers: boolean, chartKeys: string[],
// onSeries: (key, opened) => void }.
function macroPanel(vals, goal, wording, meals, opts) {
    const ctx = macroCtxOf(vals, goal, wording, meals, opts);
    // Stash it so the delegated toggle handler can build the breakdown on
    // demand. One strip per widget, so a single slot is enough.
    __macroCtx = ctx;

    const cal = MACROS.find((m) => m.role === "cal");
    const macros = MACROS.filter((m) => m.role === "macro");
    // Both roles ask metricShown the same question — "was this tracked at
    // all?" — so neither can quietly grow a rule the other one lacks.
    const waters = MACROS.filter(
        (m) => m.role === "bar" && metricShown(m, ctx),
    );
    const limits = MACROS.filter(
        (m) => m.role === "limit" && metricShown(m, ctx),
    );
    const all = [cal].concat(macros, waters, limits);

    // Per chip, not per strip: every metric on the strip has per-meal figures
    // behind it, but only the ones some meal actually contributed to are worth
    // opening. The strip itself is interactive if any of its chips is — that is
    // what earns the region the breakdown renders into.
    const tap = (m) => macroTappable(m, ctx);
    const interactive = all.some(tap);
    // The hint promises MEALS, so it is gated on disclosure alone: a rail whose
    // chips only re-stroke a chart (trends) would be advertising something that
    // is not there.
    const discloses = all.some((m) => macroHasDetail(m, ctx));

    // What a tap does, said once — in the card's FOOT, not as a chip in the
    // rail. As a dashed full-width pill it was a third species of tile sitting
    // among the readings, and it stacked above the bridge's own settings note
    // as a second band of chrome: two boxes, two hairlines, ~64px, to carry two
    // lines of small print. Both now share one hairline-topped foot at the end
    // of the card.
    //
    // Hover and a cursor are the whole affordance on a pointer device and
    // NEITHER exists on a phone, which is where this widget mostly lives —
    // without a line saying so, the breakdown is a feature nobody discovers.
    // macroToggle hides it once a drawer is open: by then the answer is on
    // screen and the instruction is a row of noise above it.
    const hint = discloses
        ? `<span class="fhint" data-macro-hint>${icon("point", 12)}${esc(T.macros.tapHint)}</span>`
        : "";
    // The foot is emitted whether or not there is a hint, because it is also
    // the slot bridge.js appends its settings note into (`[data-widget-foot]`).
    // A widget with no strip at all — weight-trends, import-meals — has no
    // slot, and the bridge falls back to appending at the root; base.css styles
    // the note for both homes.
    const foot = `<div class="foot" data-widget-foot>${hint}</div>`;

    const chipFor = (m, i) =>
        // Two builders: a limit recorded as none says so in words rather than
        // as a 0, and carries its own display gate. Everything else — water
        // included, now that `display` decides how a figure reads — is one.
        m.role === "limit"
            ? macroLimit(m, ctx, tap(m), i)
            : macroChip(m, ctx, tap(m), i);

    // ONE RAIL, EVERY METRIC. The limits used to collapse behind a `.more` row
    // to buy height; they do not any more. A nutrient the user has recorded is
    // a nutrient they want to see, and "Alcohol · Caffeine · Fiber" behind a
    // chevron reads as the card hiding its own data. The tile grid pays the
    // height back instead — 8 tiles is a whole rectangle at 2 or 4 columns.
    //
    // ...but every one of those tiles is the same tile, so the card is a hero
    // and then a flat plain. `ctx.tiers` deals the SAME tiles into the groups
    // `role` already names, and chip.css sizes and shapes each group:
    //
    //   r-macro  protein / carbs / fat — the energy split, three up, directly
    //            under the hero and the biggest figures after it
    //   r-limit  the four judged against a ceiling, under a hairline, denser
    //            and a size down — read after the macros because they are the
    //            level below them
    //   r-water  water alone, LAST, and as a full-width bar rather than a
    //            tile. It is not on the levels at all: it is not food, no meal
    //            carries it, it is logged through a different tool and it is
    //            the only metric that never opens the drawer. Ranking it
    //            anywhere among the nutrients puts it on a ladder it is not
    //            standing on — so it goes under all of them, where the bar
    //            shape reads as the card's own closing line rather than as a
    //            fourth macro or a fifth limit.
    //
    // `--i` keeps counting ACROSS the groups rather than restarting in each,
    // so the entrance still deals left-to-right down the whole strip instead
    // of three rows starting at once.
    let i0 = 0;
    const railOf = (cls, items) => {
        if (!items.length) return "";
        const html = items.map((m, j) => chipFor(m, i0 + j)).join("");
        i0 += items.length;
        // HOW MANY TILES THIS RAIL ACTUALLY HAS, which is what the tiered grid
        // lays itself out to. The column count used to be a constant per tier —
        // four for the limits — so a user who does not track alcohol got three
        // tiles and a dead fourth cell. A rail is not "four wide", it is "as
        // wide as it has things to show", and only the rail knows that number.
        // Emitted only when tiered: the flat rail wraps and needs no count, and
        // its markup stays byte-identical.
        const n = ctx.tiers ? ` data-n="${items.length}"` : "";
        return `<div class="rail${cls ? ` ${cls}` : ""}"${n}>${html}</div>`;
    };
    // The untiered strip emits `<div class="rail">` with no modifier at all —
    // exactly the markup it always did, so a widget that has not been moved
    // over renders byte-for-byte what it rendered before.
    const tieredRails = ctx.tiers
        ? [railOf("r-macro", macros), railOf("r-limit", limits)]
        : null;
    // Built here rather than inside the array above so the stagger index it
    // takes is the LAST one — `--i` counts in reading order, and water reads
    // last (see the drawer note below for why it is not emitted last).
    const water = ctx.tiers ? railOf("r-water", waters) : "";

    // The breakdown renders in here on tap; hidden until then.
    //
    // NO aria-live, deliberately. It carried aria-live="polite" and never
    // announced once: the content is written while the region is still `hidden`
    // (display: none), so the mutation happens outside the accessibility tree,
    // and re-ordering the writes only moves the race rather than closing it. An
    // announcement that never fires is worse than none — so this is a plain
    // disclosure region and FOCUS is what reports the open: `tabindex="-1"`
    // makes it programmatically focusable, macroToggle moves focus into it, and
    // the ✕ hands focus back to the chip that opened it. Both ends of that are
    // observable in document.activeElement rather than hoped for. The chip's
    // aria-expanded + aria-controls is what names the relationship.
    //
    // A NAMED REGION, because focus lands on it. As a bare `div` it was a
    // generic element, so the moment focus arrived a screen reader read the
    // whole drawer — head, caption, every row — as one unlabelled run.
    // `role="region"` + `aria-labelledby` on the head's `.dname` makes the
    // arrival "Protein, region", and the rows are then read as rows. The name
    // follows the metric for free: macroDetailBody rewrites `.dname` (and its
    // id) on every open.
    const drawer = discloses
        ? `<div class="drawer" id="${MACRO_DRAWER_ID}" role="region" aria-labelledby="${MACRO_DRAWER_NAME_ID}" tabindex="-1" hidden></div>`
        : "";
    // THE DRAWER IS LAST, under every rail including water. It sat between the
    // limits and the water row for a while, on the reasoning that water can
    // never open it (no meal carries water_ml) so the breakdown belonged next
    // to the tiles that can — but that reasoning optimised the wrong thing. An
    // open drawer is a tall panel, and putting it there cut the metrics in two
    // and left the water bar stranded below it, reading as something that had
    // come loose rather than as the last of the readings.
    //
    // Adjacency was never really the prize: the drawer is already nowhere near
    // its trigger when the calorie panel at the top opens it. What it actually
    // is, is detail for the whole strip — so it goes under the whole strip, and
    // the metric rows stay contiguous whether or not anything is open.
    const body = tieredRails
        ? tieredRails.join("") + water + drawer
        : railOf("", macros.concat(waters, limits)) + drawer;
    return `
      <div class="strip${ctx.tiers ? " tiered" : ""}${ctx.divided ? " sec" : ""}"${interactive ? " data-macro-panel" : ""}>
        ${focusPanel(cal, ctx)}
        ${body}
        ${foot}
      </div>`;
}

// ---- Interactive breakdown ------------------------------------------------
// Set by macroPanel() when the strip is interactive; read by the delegated
// handlers below.
let __macroCtx = null;

// The control that opened the drawer that is currently open, remembered as an
// ELEMENT rather than looked up by key when the ✕ is pressed.
//
// Looking it up by `[data-macro="<open key>"]` was wrong the moment a widget
// grew a second control for the same metric: nutrition-summary re-points its
// focus panel at whatever tile is selected, so two elements answer that
// selector and querySelector returns the first in document order — always the
// panel, never the tile that actually opened the drawer. The ✕ then handed
// focus to the wrong control (and, with the panel's state stuck at "false",
// re-rendered the drawer it was asked to close). One drawer per document, so
// one slot is enough — the same assumption __macroCtx already makes.
let __macroOpener = null;

// The list of meals that contributed a positive amount of one metric,
// largest-first, capped so a long range stays readable.
function mealList(m, meals, flag) {
    // A single meal's contribution is a fraction of the day's, so grams get a
    // tenth here even where the chip rounds them whole — a 3.4 g and a 3.1 g
    // meal must not both read "3" in a list sorted by that very figure.
    // Whole-unit metrics keep their unit: kcal and mg of caffeine are quoted
    // whole at every scale (see the MACROS entries), and a tenth of a
    // milligram is below anything anyone can act on.
    const decimals = m.decimals === 0 && m.unit === "g" ? 1 : m.decimals;
    const rows = (meals || [])
        .map((meal) => ({ meal, v: Number(meal?.[m.key] ?? 0) || 0 }))
        .filter((r) => r.v > 0)
        .sort((a, b) => b.v - a.v);

    if (!rows.length) {
        return `<div class="dempty">${esc(tpl(T.macros.noMealsContributed, { label: macroLabel(m) }))}</div>`;
    }

    const CAP = 8;
    const shown = rows.slice(0, CAP);
    const extra = rows.length - shown.length;
    const items = shown
        .map(({ meal, v }, i) => {
            // Prefer a date tag for multi-day ranges, otherwise the meal type.
            // Translated: the single-day widgets print the type on their header
            // line too, and printing it raw here gave a Japanese meal-logged
            // card "昼食" above a drawer full of "lunch".
            // shortDate, not a raw ISO slice. The card header goes to real
            // trouble over the same quantity — hand-parsed to avoid UTC drift,
            // translated month names, a ja branch — and the drawer printed
            // "07-05" three lines under "5–7 Jul", which most of the nine
            // locales read as 7 May. shortDate prints no year either, so a
            // year-crossing range still shows "30 Dec" beside "2 Jan"; that is
            // the header's job and the rows stay short. Guarded because
            // shared/date.js is not included by every widget that includes this
            // file (the dev gallery is not), and a row with no date never
            // reaches this branch anyway.
            const sub = meal.date
                ? esc(
                      typeof shortDate === "function"
                          ? shortDate(meal.date)
                          : String(meal.date).slice(5),
                  )
                : meal.meal_type
                  ? esc(mealTypeLabel(meal.meal_type))
                  : "";
            // NO ROLE CLASS ON THE ROW — it sits on the `.dlist` container
            // below, with the same over flag the head takes. On the `<li>`
            // itself it was the bug class this file has already been fixed for
            // twice (the drawer head's dot, the sparkline wrapper): `.dhead.over`
            // reassigns --c to --over, but a sibling row is outside it, so a
            // breached metric's head resolved --c to red while every row under
            // it resolved the raw series token. Nothing in a row consumes --c
            // today (`.dv`/`.dv .u`/`.dn`/`.ds` are all --ink*, because var(--c)
            // on the drawer's --bg2 failed AA on 7 of the 9 nutrients in light
            // mode — worst 1.47:1, sugar's unit — and this list is the drawer's
            // entire payload), so it painted nothing; on the container it can
            // never start.
            return `
        <li style="--i:${i}">
          <span class="dv">${fmt(v, decimals)}<span class="u">${esc(unitLabel(m.unit))}</span></span>
          <span class="dn">${esc(meal.description || T.macros.untitledMeal)}</span>
          ${sub ? `<span class="ds">${sub}</span>` : ""}
        </li>`;
        })
        .join("");
    const more =
        extra > 0
            ? `<li class="dmore">${esc(plural(T.macros.moreMeals, extra))}</li>`
            : "";
    // The group's colour, once, where the head's own reassignment can reach it.
    return `<ul class="dlist ${m.color}${flag || ""}">${items}${more}</ul>`;
}

// The drawer's contents for one metric: which metric it is, the goal state the
// chip had no room for, and the meals behind it.
function macroDetailBody(m, ctx) {
    const b = macroBits(m, ctx.vals, ctx.goal, ctx.wording);
    // The `over` class rides the HEAD, not just its caption. `.chip.over`
    // reassigns --c to --over, so an over-limit tile's dot is red — and the
    // drawer that tile opens was printing the same metric's dot in its normal
    // series colour, because the head only ever carried the role class. One
    // metric, two dots, two colours, on screen at the same moment. Setting the
    // class here lets chip.css do the same --c reassignment it does on a tile,
    // so the dot follows for free and so does anything else keyed on --c.
    //
    // focusOver, not a second copy of the tiles' ceiling-only rule. There were
    // two predicates for one state: the panel counts a breached CALORIE goal
    // (calories declares no `direction`, but a calorie goal is read as a
    // ceiling by everyone who sets one) and this did not — so a user over their
    // calorie goal got a red ring, red hairline, red sparkline and red delta in
    // the panel, and the drawer that same panel opened drew its dot in calorie
    // orange with "1,000 kcal over" in the quietest ink on the card. The drawer
    // must agree with whatever opened it, and only the panel can open the
    // calorie drawer.
    const flag = focusOver(m, b) ? " over" : "";
    // The ROLE CLASS goes on the head, not on the dot — exactly as a tile puts
    // it on the chip and leaves its dot bare. On the dot it set --c on the dot
    // ITSELF, which outranks the --over the head reassigns, so a breached
    // metric kept its series colour here however the head was flagged.
    return `
      <div class="dhead ${m.color}${flag}">
        ${macroMark(m, ctx, 14)}
        <b class="dname" id="${MACRO_DRAWER_NAME_ID}">${esc(macroLabel(m))}</b>
        <span class="dcap${flag}">${esc(macroCaption(m, b, ctx))}</span>
        <button class="dx" type="button" data-macro-close aria-label="${esc(T.macros.closeBreakdown)}">${icon("x", 12)}</button>
      </div>${mealList(m, ctx.meals, flag)}`;
}

// Toggle the chip that was tapped. Selection is EXCLUSIVE: tapping another chip
// (or the drawer's ✕) closes whatever was open. Where the chip discloses meals
// the drawer swaps to them; where the widget passed a chart coupling, the chart
// re-strokes in that metric's colour. A chip can be either, or both.
//
// The height change is picked up by the bridge's ResizeObserver, which
// re-reports so the host grows the iframe.
function macroToggle(cell) {
    const panel = cell.closest("[data-macro-panel]");
    const ctx = __macroCtx;
    if (!panel || !ctx) return;
    const key = cell.dataset.macro;
    const m = MACROS.find((mm) => mm.key === key);
    if (!m) return;
    // The chip's own state is the source of truth, so this works identically
    // for a chart-only rail, which has no drawer to read a state off. Which
    // attribute holds that state depends on the species — a disclosure says
    // aria-expanded, a chart toggle says aria-pressed (see tapAttrs).
    const open = cell.getAttribute(tapStateAttr(cell)) !== "true";

    // KEYED, not identity-matched. A widget may render more than one control
    // for the same metric — nutrition-summary re-points its focus panel at
    // whatever tile is selected (focusApply), so after any tap the panel and
    // that tile both carry `data-macro="<key>"`. Marking only `cell` left the
    // other one reading "false" for a state it was visibly in: the a11y tree
    // showed two identically-named buttons disagreeing, and the ✕ resolved its
    // trigger to whichever was first in document order and found it "closed".
    // Every other widget renders one element per key, so this is the same loop
    // there — including trends, whose rail is aria-pressed only.
    panel.querySelectorAll("[data-macro]").forEach((c) => {
        c.setAttribute(
            tapStateAttr(c),
            open && c.dataset.macro === key ? "true" : "false",
        );
    });

    const drawer = panel.querySelector(".drawer");
    // Did a BREAKDOWN actually open? Not the same question as `open`: a
    // chart-only chip (nutrition-summary's Water, trends' whole rail) flips to
    // "true" and discloses nothing at all. Tracked rather than recomputed so
    // the answer is the one this call really produced.
    let disclosed = false;
    if (drawer) {
        if (open && macroHasDetail(m, ctx)) {
            drawer.innerHTML = macroDetailBody(m, ctx);
            drawer.dataset.open = key;
            drawer.hidden = false;
            // FOCUS FOLLOWS THE DISCLOSURE. The drawer is not adjacent to the
            // chip that opened it — it sits below the whole rail — so
            // "expanded" alone would leave a keyboard or screen-reader user to
            // go hunting, and this region carries no aria-live to announce
            // itself (see macroPanel for why). preventScroll because a focus()
            // inside a chat iframe can otherwise scroll the host page out from
            // under the conversation.
            drawer.focus({ preventScroll: true });
            // Which control this drawer belongs to, so the ✕ and Escape can
            // hand focus back to it rather than guess — see __macroOpener.
            __macroOpener = cell;
            disclosed = true;
        } else {
            // CROSS-CLOSE FOCUS. This branch also runs when something else
            // closes an open drawer — the limits rail collapsing under it, or
            // goal-progress's weight row taking the floor — and `hidden` on an
            // ancestor of the focused element makes the browser drop focus on
            // <body>, returning a keyboard user to the top of the tab ring.
            // Handing focus to this chip first is the same disclosure contract
            // the ✕ path already keeps: the region that is closing gives focus
            // back to its trigger, which is still in the DOM. A caller that
            // then opens something of its own focuses it AFTER this and wins
            // (goal-progress does exactly that).
            //
            // Guarded on containment, so the ordinary close — where focus is
            // already on the chip, or on nothing in particular — never yanks
            // it. `typeof document` because this partial is also evaluated
            // without a DOM (public/widgets/macros.test.ts).
            if (
                typeof document !== "undefined" &&
                document.activeElement &&
                drawer.contains(document.activeElement)
            ) {
                cell.focus({ preventScroll: true });
            }
            drawer.hidden = true;
            drawer.dataset.open = "";
            drawer.innerHTML = "";
            __macroOpener = null;
        }
    }
    // The instruction has been followed; the answer replaces it — but ONLY
    // when an answer really appeared. Gated on `disclosed`, not on `open`:
    // gated on `open` it also fired for a chart-only chip, so tapping Water on
    // nutrition-summary deleted "Tap a metric for the meals behind it" while
    // nothing opened to replace it — the instruction vanishing as a reward for
    // following it (regression recheck measured that).
    const hint = panel.querySelector("[data-macro-hint]");
    if (hint) hint.hidden = disclosed;

    if (ctx.onSeries) ctx.onSeries(key, open);
}

// Close whatever breakdown is open, THROUGH the control that opened it, so the
// state attribute, the chart and the tap hint all unwind by the same path a
// second tap would take. Returns whether anything was actually closed.
function macroCloseDrawer(panel) {
    const drawer = panel && panel.querySelector(".drawer");
    if (!drawer || !drawer.dataset.open) return false;
    const cell =
        __macroOpener && panel.contains(__macroOpener)
            ? __macroOpener
            : // Fallback for a strip rebuilt under an open drawer: by key, as
              // this always did. Ambiguous where a widget mirrors a metric on
              // two controls, which is exactly why the opener is remembered.
              panel.querySelector(`[data-macro="${drawer.dataset.open}"]`);
    if (!cell) return false;
    // Focus goes back to the trigger BEFORE macroToggle empties the drawer:
    // closing destroys the ✕ that currently has focus, and the browser then
    // drops focus on <body>, returning a keyboard user to the top of the tab
    // ring (a11y audit measured exactly that). The trigger is still in the DOM,
    // and handing focus back to it is the disclosure contract.
    cell.focus({ preventScroll: true });
    macroToggle(cell);
    return true;
}

// Release a pressed chart toggle — the second half of Escape. A chart-only
// chip (nutrition-summary's Water, trends' whole rail) opens no drawer, so
// macroCloseDrawer finds nothing and Escape used to leave it pressed: the one
// selection on the card with no keyboard exit but a second activation.
// Routed through macroToggle like every other release, so the chart and the
// mirrored focus panel unwind by the same path. Focus is not moved — a toggle
// takes none, so whatever holds it (the chip itself, usually) still exists.
// Returns whether anything was released.
function macroReleaseToggle(panel) {
    const held =
        panel && panel.querySelector('[data-macro][aria-pressed="true"]');
    if (!held) return false;
    macroToggle(held);
    return true;
}

// The focus panel in its mirror mode (see focusApply): return the card to
// calories by releasing whichever control holds the selection, through that
// control — the drawer closes, the tile's state resets, the hint returns and
// onSeries repaints the panel as the calorie control, all by the path a
// second tap on the tile takes. Focus stays on the panel: it is the same
// element before and after, only its content and name change.
function macroReturn(fx) {
    const panel = fx && fx.closest("[data-macro-panel]");
    const ctx = __macroCtx;
    if (!panel || !ctx) return;
    const held = Array.from(panel.querySelectorAll("[data-macro]")).find(
        (c) => c.getAttribute(tapStateAttr(c)) === "true",
    );
    if (held) {
        macroToggle(held);
        return;
    }
    // Nothing is selected (a strip rebuilt under the mirror): repaint
    // calories directly, as the release would have.
    const cal = MACROS.find((mm) => mm.role === "cal");
    if (ctx.onSeries) ctx.onSeries(cal.key, false);
}

// Delegated once per document. No-ops on strips with no [data-macro] chips, so
// widgets that pass neither meals nor chartKeys are unaffected.
if (typeof document !== "undefined" && !window.__macroWired) {
    window.__macroWired = true;
    document.addEventListener("click", (e) => {
        if (e.target.closest("[data-macro-close]")) {
            macroCloseDrawer(e.target.closest("[data-macro-panel]"));
            return;
        }
        const back = e.target.closest("[data-macro-return]");
        if (back) {
            macroReturn(back);
            return;
        }
        const cell = e.target.closest("[data-macro]");
        if (cell) macroToggle(cell);
    });
    // ESCAPE IS THE DRAWER'S KEYBOARD EXIT. It is the one region on this card
    // that TAKES focus, so a user who lands in it needs a way back that does
    // not depend on finding the ✕ — and until Escape was wired the drawer had
    // exactly one exit. Routed through macroCloseDrawer, so focus returns to
    // the trigger exactly as the ✕ does.
    //
    // A drawer first; only if none was open, a pressed chart toggle
    // (macroReleaseToggle) — one Escape undoes one thing, the most recent kind.
    //
    // preventDefault ONLY when something really closed or released: the MCP
    // Apps host owns the iframe's chrome and may bind Escape itself, so a
    // no-op keypress has to stay the host's.
    document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape" && e.key !== "Esc") return;
        const target = e.target && e.target.closest ? e.target : null;
        const panel =
            (target && target.closest("[data-macro-panel]")) ||
            // Focus may have drifted off the strip (or onto <body>) while the
            // drawer is still open; one strip per document, so this is the one.
            document.querySelector("[data-macro-panel]");
        if (macroCloseDrawer(panel) || macroReleaseToggle(panel)) {
            e.preventDefault();
        }
    });
    document.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
        const cell = e.target.closest("[data-macro]");
        if (!cell) return;
        // A real <button> already turns Enter and Space into a click, and
        // handling the key as well would toggle twice — the second one closing
        // what the first opened. This branch is for any [data-macro] element a
        // template renders that is not natively activatable.
        if (cell.tagName === "BUTTON") return;
        e.preventDefault();
        macroToggle(cell);
    });
}
