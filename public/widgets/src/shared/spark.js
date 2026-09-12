/* The sparkline inside the focus panel: one series at a time, drawn from the
   days a payload already carries, painted into the panel's `.fspark` slot.
   Calories by default; a tile takes it over while it is open and hands it back
   when it closes (a template's onSeries), so switching series costs no second
   round trip.

   INCLUDE ORDER. A template includes this file itself, AFTER shared/macros.js,
   and never from inside another partial: a nested include would put this
   file's text inside macros.js's, which breaks src/widgets.test.ts's verbatim
   "every included partial appears in full" check and macros.test.ts's raw
   evaluation of macros.js. Everything it reads from elsewhere — MACROS,
   focusApply and macroCtx (macros.js), the chart geometry and hairlineSlot
   (shared/svg.js), esc (the template) — is looked up when a function here
   RUNS, not when the file is evaluated, so the only hard requirement is that
   all of them are in the page before the first paint. The x axis a caller
   hands in comes from calendarSlots (svg.js), which reads date.js.

   Pure except for sparkReset/sparkPaint, which own SPARK below and write the
   one `.fspark` node they are handed. */

/* The chart's state between paints. `slots` is one entry per CALENDAR day of
   the range ({ t, day }: t the day's UTC midnight, day the payload row or
   null), not one per logged day — see calendarSlots (shared/svg.js). `painted`
   is whether the chart has been drawn once since the last sparkReset; every
   paint after that is `.still` (see `.fspark .cwrap.still` in chip.css).

   `var`, like svg.js's CH_GRAD_N, not `const`: a var is hoisted, so code that
   reaches SPARK before this file's include line has been evaluated (with no
   host, initWidget paints the sample synchronously) finds `undefined` rather
   than dying on a TDZ ReferenceError — the failure macros.js's MACROS already
   imposes an include order to avoid.

   ONE chart state for the whole document — which macroCtx no longer assumes,
   since it can bind a ctx per strip. A page holding two live charted strips
   must therefore sparkReset() its own slots immediately before each paint, or
   drive its second chart through sparkMarkup() directly (what a build-time
   caller does: see `inlineChart` in shared/summary-card.js). */
var SPARK = {
    slots: [],
    goals: null,
    key: "calories",
    painted: false,
};

// One reading, or null for "no reading". null is "nobody recorded
// this that day" and must not become a zero: it drops out of the
// average and breaks the line, exactly as it drops out of the
// server's own average (#78).
//
// A day with NO MEALS is a gap on every food series. `days[]` also
// carries days that only logged water, and those arrive with
// calories and every macro at 0 — charted as read, a day of
// drinking water and forgetting to log lunch dipped to 0 kcal and
// read as a fast. Water is the one series such a day really has.
// Gated on an explicit 0 so a payload without meal_count charts
// exactly as before.
//
// THAT IS THE ONLY GATE. A day with meals but nothing else (a
// 0-kcal coffee that carried caffeine) is a real reading on every
// series it recorded; a broader "has any data" test here would drop
// it, and trends' zero buckets are deliberately charted as 0 to
// match its all-days average.
function seriesValue(day, key) {
    if (!day) return null;
    const mealless =
        day.meal_count != null &&
        day.meal_count !== "" &&
        Number(day.meal_count) === 0;
    if (mealless && key !== "water_ml") return null;
    if (day[key] == null) return null;
    const v = Number(day[key]);
    return Number.isFinite(v) ? v : null;
}

// The chart draws whatever it has a reading for. A metric whose
// every reading is null OR zero would be a flat line on the floor
// pretending to be data, so it is not offered as a series at all —
// and a tile that is neither on the chart nor has meals behind it
// is rendered static by macroPanel (macroTappable, macros.js).
// Offering none (a single-day range, where there is no chart)
// leaves every chip a pure disclosure control. Read through
// seriesValue, so a water-only day's zeros count for nothing here
// either.
function chartableKeys(days) {
    return MACROS.filter((m) => m.role !== "cal")
        .map((m) => m.key)
        .filter((k) => days.some((d) => (seriesValue(d, k) || 0) > 0));
}

// The chart's markup for one series, from arguments alone: `slots` (see
// SPARK), the metric `key`, the payload's `goals` (or null), `still` (skip
// the entrance — every paint after the first) and an optional `label`.
//
// THE LABEL DECIDES THE ROLE. Inside a <button> panel (nutrition-summary)
// the svg's children are presentational, so an aria-label would be announced
// to nobody: the button's own name (tileLabel, shared/macros.js) already
// carries the value, the goal and the distance left, which is every figure
// this line draws, and the SHAPE is the part with no honest short sentence.
// So with no label the svg is aria-hidden — a decision on the record, not an
// omission. A panel that is a plain <span> (trends) has no name of its own to
// lean on, and passes a label: then the svg is role="img" with that name.
function sparkMarkup(o) {
    const key = o.key;
    const m =
        MACROS.find((mm) => mm.key === key) ||
        MACROS.find((mm) => mm.role === "cal");
    const slots = o.slots || [];
    const raw = slots.map((s) => seriesValue(s.day, m.key));
    const seen = raw.filter((v) => v !== null);
    const goal = o.goals ? (o.goals[m.key] ?? null) : null;
    // Zero-based, with headroom over the taller of the data and the
    // goal: a nutrient total's distance from zero is meaningful, so
    // the axis is never floated to the data's own floor.
    const top = Math.max(...seen, goal || 0, 1) * 1.15;
    const pts = chPoints(
        raw.map((v) => (v === null ? 0 : v)),
        0,
        top,
    );

    // Built here rather than with chPath(), which has no way to
    // express a gap: a run of readings is one subpath, and a
    // reading alone between two gaps gets a zero-length segment so
    // the round line cap paints it as a dot instead of nothing.
    let d = "";
    let last = -1;
    for (let i = 0; i < raw.length; i++) {
        if (raw[i] === null) continue;
        const xy = `${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`;
        const joined = i > 0 && raw[i - 1] !== null;
        d += (joined ? "L" : "M") + xy;
        if (!joined && (i + 1 >= raw.length || raw[i + 1] === null)) {
            d += "L" + xy;
        }
        last = i;
    }

    // The wash under the line, gapped exactly as `d` is: a day with
    // no reading gets no fill rather than the area bridging it.
    // Zero-based domain, so the box's floor really is 0 — see
    // .carea in chart.css.
    const area = chAreaMarkup(
        chArea(raw.map((v, i) => (v === null ? null : pts[i]))),
    );

    const goalLine =
        goal && goal > 0
            ? `<line class="cgoal" x1="${CH_PL}" y1="${chY(goal, 0, top).toFixed(1)}" x2="${CH_W - CH_PR}" y2="${chY(goal, 0, top).toFixed(1)}"/>`
            : "";
    // A hairline per day, a day with no reading included: the
    // line's gap then sits between two rules instead of floating
    // in an unmarked stretch of the box. Thinned on a long range
    // (hairlineSlot) by handing chDayLines a SUBSET of the same
    // points, so every rule still lands exactly on its day's x.
    const dayLines = chDayLines(
        pts.filter((_, i) => hairlineSlot(slots[i], i, slots.length)),
    );
    // One dot, on the last reading: it is the only thing that says
    // which end of the line is now.
    const dot = last >= 0 ? chDotMarkup(pts[last][0], pts[last][1]) : "";

    // NO CHART FOOT, so no average and no goal figure are computed
    // here. The rule a foot would have to follow still stands
    // wherever a figure IS printed: every one goes through
    // macroNum()/macroUnit() (macros.js), never fmt() + m.unit,
    // because that is the single place a metric's DISPLAY unit is
    // decided and water is the one metric whose display unit is not
    // its stored one. Bypassing it is what made an old foot read
    // "Water avg 2,100 ml · goal 2,500" two lines under a chip
    // saying "2.1 L". Nor a date foot: the card header prints the
    // range.
    //
    // PAINT ORDER: day → area → line → GOAL → dot. The goal used
    // to go under the wash and the line (day → goal → area →
    // line, the shared grammar's order), which hid it completely
    // whenever the series sat ON it: 2,200 kcal every day against
    // a 2,200 goal drew the 2.5px data stroke straight over the
    // dashes and the card showed no goal at all. Over the line,
    // the dashes read as the reference crossing the data; the dot
    // stays last so the "now" marker is never struck through.
    //
    // The literal below is indented as it always was: its whitespace
    // is part of the painted markup, and keeping it byte-for-byte is
    // what let this move out of nutrition-summary be verified as
    // rendering identically.
    const a11y = o.label
        ? `role="img" aria-label="${esc(o.label)}"`
        : 'aria-hidden="true"';
    return `
          <div class="cwrap ${m.color}${o.still ? " still" : ""}">
            <svg viewBox="0 0 ${CH_W} ${CH_H}" preserveAspectRatio="none" ${a11y}>
              ${dayLines}${area}
              <path class="cline" pathLength="1" d="${d}"/>
              ${goalLine}${dot}
            </svg>
          </div>`;
}

// Splice a chart into the `.fspark` slot of a strip's MARKUP, for a caller
// that has no DOM to paint into — the public site renders these cards at build
// time (shared/summary-card.js, shared/trends-card.js). `o` is sparkMarkup's
// own options object. Returns the markup unchanged when there is nothing to
// draw, so a short range needs no branch at the call site.
//
// The in-chat path deliberately does NOT use this: there the strip reaches the
// document first and sparkPaint writes the node, which is what keeps
// SPARK.painted — and so the once-only entrance (`.fspark .cwrap.still`,
// chip.css) — honest. A function replacement, not a string one, because a `$`
// in the generated markup would otherwise be read as a capture reference.
function sparkInline(html, o) {
    if (!o || !o.slots || !o.slots.length) return html;
    return html.replace(
        '<span class="fspark"></span>',
        () => `<span class="fspark">${sparkMarkup(o)}</span>`,
    );
}

// A new card: a new axis, new goals, calories, and the entrance owed again.
// Call it once per render, before the first sparkPaint. An empty `slots` (a
// card with fewer than two logged days) makes every later sparkPaint a
// panel-only switch that draws no chart.
function sparkReset(slots, goals) {
    SPARK.slots = Array.isArray(slots) ? slots : [];
    SPARK.goals = goals || null;
    SPARK.key = "calories";
    SPARK.painted = false;
}

// Hand the whole focus panel a metric: its figure, goal, delta,
// colour, ring and sparkline all switch together. This is the fix
// for the oldest fault in this layout — the chart restroking to
// protein while the figure above it went on saying calories.
//
// `fx` is the panel ELEMENT, found by the caller inside its own root, never
// looked up here: a page can hold more than one strip (the gallery's
// specimens), and a document-wide query would repaint whichever came first.
//
// The template's render() owns the whole card, so rebuilding it from here
// would throw away the tile that was just tapped and the drawer it
// opened; only the panel's own children are replaced. The
// sparkline has its own full-width row at every width (`.fspark`,
// chip.css), so a series switch changes no height and cannot start
// a size-changed storm.
//
// `selected` is whether the metric arrives SELECTED — a panel that
// mirrors a tile's metric has to be told what the tile's state is, or it
// announces "collapsed" over the drawer it just opened and can never be
// toggled shut (see focusApply).
//
// `opts.label` names the chart (see sparkMarkup): a string, or a function of
// the MACROS entry being painted, since a caller whose name depends on the
// metric (trends' "Protein over 7 days") would otherwise have to resolve the
// key itself. Omitted, the chart is aria-hidden.
function sparkPaint(fx, key, selected, opts) {
    if (!fx) return;
    const m =
        MACROS.find((x) => x.key === key) ||
        MACROS.find((x) => x.role === "cal");
    SPARK.key = m.key;
    // One call moves the button, the colour role class the chart
    // inherits --c from, the over state and the wash's `--p`
    // together — see focusApply in shared/macros.js. The ctx is
    // resolved FROM the panel, so a page holding two live strips
    // repaints each from its own (macroCtx, shared/macros.js).
    focusApply(fx, m, macroCtx(fx), !!selected);
    // focusApply rebuilt the panel's children, so the sparkline
    // slot is a fresh empty node every time.
    const box = fx.querySelector(".fspark");
    if (box && SPARK.slots.length) {
        const l = opts && opts.label;
        box.innerHTML = sparkMarkup({
            slots: SPARK.slots,
            key: SPARK.key,
            goals: SPARK.goals,
            still: SPARK.painted,
            label: typeof l === "function" ? l(m) : l,
        });
        // Every paint after this one is a switch, and emits
        // `.still` — see `.fspark .cwrap.still` in chip.css.
        SPARK.painted = true;
    }
}
