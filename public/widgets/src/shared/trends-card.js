/* The get_trends card, composed: the header (title, window line and the
   7 / 14 / 30-day toggle), the tiered strip whose calorie focus panel carries
   the ring, the figure, the averaging label and the sparkline as one object,
   and the range slicing and averaging that produce them.

   IT LIVES HERE, not in the template, for the same reason
   shared/summary-card.js does: two callers build this card from one payload
   shape — the in-chat widget (trends.html), and the public site's landing
   page, which renders the same card at BUILD TIME by evaluating these partials
   with no DOM at all (scripts/gen-index.ts). A card hand-approximated in a
   second place is a card that drifts.

   THE DENOMINATOR IS EVERY CALENDAR DAY in the window, not just the logged
   ones: these averages answer "how am I doing across this stretch of time?",
   so a skipped day pulls the average down. That deliberately differs from the
   get_nutrition_summary dashboard, whose figures divide by logged days only
   (issue #70). Both name their denominator on screen — here that is the focus
   panel's label ("14-day avg · all days"), which follows the panel when a tile
   moves it — so keep it explicit if you touch it.

   WHAT IT DOES NOT DO. trendsView and trendsCard write no DOM and read no
   globals but the ambient T (shared/i18n.js) and the water unit
   (setWaterUnit): the caller resolves the locale and the unit before calling,
   exactly as render() always did. They return strings. The one exception is
   noted on trendsView: macroPanel stashes its ctx.

   INCLUDE ORDER. After shared/macros.js and shared/spark.js, whose macroPanel,
   chartableKeys, sparkPaint and sparkInline it calls, and after
   shared/date.js / shared/svg.js (rangeLabel, daysLoggedCaption, ymd,
   calendarSlots). Everything is resolved when a function RUNS, so only the
   first call has to come after all of them. */

// The windows the toggle offers, widest last.
const RANGES = [7, 14, 30];

// Trailing average over the days that actually carry this key:
// sum / count of non-null days — matches computeTrends'
// coveredSeries (src/insights.ts), which is where the tool's text
// trailingAverage comes from. Calories/protein/carbs/fat/water are
// never null (every day counts, as always), but fiber_g, sugar_g,
// alcohol_g and caffeine_mg arrive null on a day that never
// recorded them — dividing by days.length there would count a
// no-data day as a real zero, exactly the drift this fixes.
//
// A key that is null on EVERY day averages to null, not 0, which is
// what hides a metric the user has nothing to say about: alcohol_g
// when tracking is off, caffeine_mg when it was never recorded. A 0
// there would claim an alcohol-free / caffeine-free window instead.
function avgOf(days, key) {
    if (!days.length) return 0;
    let sum = 0;
    let seen = 0;
    for (const d of days) {
        if (d[key] == null) continue;
        seen++;
        sum += d[key] || 0;
    }
    if (!seen) return null;
    return sum / seen;
}

// ---- Labels ----------------------------------------------------------

// The focus panel's label once a tile has moved it to another metric
// (opts.metricLabel, shared/macros.js). It keeps the DENOMINATOR on
// the card: without it a selected panel read the bare "Protein" and
// nothing said any more that the figure is a range average. Two
// wordings, because two averaging rules coexist (see avgOf): the
// limits — fiber, sugar, alcohol, caffeine — are the metrics that
// arrive null on a day that did not record them, so they average
// over "days recorded"; everything else counts every day. Keyed on
// `role` rather than on a key list, like the rest of the strip.
function metricLabelFor(n) {
    return (m) =>
        tpl(
            m.role === "limit"
                ? T.trends.metricAvgRecorded
                : T.trends.metricAvgAllDays,
            { metric: macroLabel(m), range: n },
        );
}

// The sparkline's accessible name, as a function of the metric it
// is drawing (sparkPaint's opts.label). The panel is a <span>, not a
// button, so nothing else names the chart: this sentence is its
// entire description, and it switches with the series.
// metricOverRange deliberately carries no count-agreeing noun:
// Intl.PluralRules falls back to "other" for Polish/Ukrainian
// few/many, so a PluralForms key would read wrong at n = 2–4.
function chartLabelFor(n) {
    return (m) =>
        m.role === "cal"
            ? tpl(T.trends.caloriesOverRange, { range: n })
            : tpl(T.trends.metricOverRange, {
                  metric: macroLabel(m),
                  range: n,
              });
}

// ---- Slicing and the view a range owns ------------------------------

// The days in the last `range` calendar days, oldest first. The
// tool sends a bucket for every calendar day (zeros for unlogged
// days), so this is a window of the calendar, not of the logs.
function trendsSlice(data, range) {
    return data.days
        .slice()
        .sort((a, b) => (a.date < b.date ? -1 : 1))
        .slice(-range);
}

// The header's window line for ONE range, on its own — the only
// piece of header state a range change rewrites, and the only one
// whose height can move (a label carrying a year takes a second row
// where a short one does not). Split out so render() can measure
// every candidate before it paints; trendsView reads the same
// function, so the measured string and the printed one cannot
// differ.
function trendsMeta(data, range) {
    const slice = trendsSlice(data, range);
    if (!slice.length) return "";
    const end = ymd(data.end_date)
        ? data.end_date
        : slice[slice.length - 1].date;
    return `${rangeLabel(slice[0].date, end)} · ${daysLoggedCaption(
        slice.filter(dayHasData).length,
        slice.length,
    )}`;
}

// Everything a range owns, derived from `data` alone and WRITING
// NOTHING — so a range change can build it first and give up
// cleanly if it throws (see setRange in trends.html). Returns the
// header meta, the body's markup, the goals it was built against,
// and what the sparkline needs once that markup is in the
// document: its calendar axis (null for a range with nothing in
// it, which has no strip) and its accessible names.
//
// One exception to "writes nothing": macroPanel stashes its ctx for
// the delegated handlers. That is harmless here because every
// caller writes this body into the document straight after.
//
// `opts`: { onSeries: (key, opened) => void, idPrefix: string }.
//
// onSeries omitted, a tile tap repaints the panel inside #tr-body —
// the element trendsCard emits, and the only trends card in an
// iframe that holds one widget. A page with a card of its own
// passes its own.
//
// idPrefix namespaces this card's drawer ids and is handed straight
// to macroPanel (see MACRO_DRAWER_PREFIX in shared/macros.js) — the
// one option forwarded without being read here. An iframe holds a
// single card and keeps the default; the landing page builds two
// cards into one document, where ids are global and a swallowed
// prefix would point both cards' aria-controls at whichever drawer
// came first. Not defaulted here: "no prefix" is macroDrawerId's
// one decision.
function trendsView(data, range, opts) {
    const o = opts || {};
    const slice = trendsSlice(data, range);
    const n = slice.length;
    const last = slice[n - 1];
    // The header names the tool's window when it can: end_date is
    // the day the series was cut at, and the buckets run up to it.
    const end = ymd(data.end_date) ? data.end_date : last.date;
    // dayHasData (shared/macros.js) derives its test from MACROS,
    // so it covers exactly the top-level metrics — fiber, sugar,
    // alcohol and caffeine never appear without a meal that already
    // contributes calories, and a null on any of them must not
    // count as a logged day.
    const logged = slice.filter(dayHasData).length;
    // "5–11 Jul · 5 of 7 days logged": the window, then how much of
    // it was logged. This used to be the chart's own foot; it is the
    // same header line nutrition-summary prints, and it is the one
    // place the count of skipped days is said out loud. Built by
    // trendsMeta, so render() can measure every range's candidate
    // before painting one (see the reserveLine call there).
    const meta = trendsMeta(data, range);

    if (!logged) {
        // A range with nothing in it while a wider one has data (the
        // whole-empty card is render()'s). The header still names
        // the window and says "0 of 7 days logged"; the body says to
        // widen it. The foot is emitted so the bridge's settings note
        // keeps its home at the end of the card — without one it
        // falls back to the root, under the card instead of in it.
        return {
            meta,
            body: `
              <div class="empty">
                <div class="big">📈</div>
                <div>${esc(tpl(T.trends.rangeEmpty, { range: n }))}</div>
              </div>
              <div class="foot" data-widget-foot></div>`,
            slots: null,
            goals: data.goals,
        };
    }

    const avg = {};
    for (const m of MACROS) avg[m.key] = avgOf(slice, m.key);

    const chartLabel = chartLabelFor(n);
    // The panel is found inside THIS card's body, never
    // document-wide — see sparkPaint in shared/spark.js.
    const onSeries =
        typeof o.onSeries === "function"
            ? o.onSeries
            : (key, opened) =>
                  sparkPaint(
                      document.querySelector("#tr-body .focus"),
                      opened ? key : "calories",
                      opened,
                      { label: chartLabel },
                  );

    // No per-meal rows in a trends payload, so nothing here
    // discloses meals — chartKeys/onSeries are what keep the tiles
    // interactive, as the panel's series selector. chartableKeys
    // (shared/spark.js) is recomputed per range, so a metric whose
    // every reading in THIS window is null or zero is a static tile
    // rather than a toggle that draws a flat line on the floor.
    // Calories is never among them: it is the default series, and
    // deselecting any tile returns to it.
    //
    // The floor-metric averaged wording uses its own dedicated
    // string (T.trends.avgUnder) — distinct from macros.floorUnder's
    // live "still left today" framing and macros.ceilingUnder's
    // safety-margin framing, neither of which fits a historical
    // average's shortfall. See macroBits' wording.
    //
    // THE RING IS KEPT on purpose (the old layout dropped it for a
    // flat hero): every tile on this card shows its average as a
    // fraction of its goal, so a calorie headline without one would
    // be the only exception on the card.
    const body = macroPanel(
        avg,
        data.goals,
        { under: T.trends.avgUnder },
        null,
        {
            tiers: true,
            drinkUnit: data.drink_unit,
            // The one place the denominator is named: these are
            // averages over every calendar day in the window,
            // skipped days included.
            calLabel: tpl(T.trends.avgAllDays, { range: n }),
            metricLabel: metricLabelFor(n),
            chartKeys: chartableKeys(slice),
            onSeries,
            // This card's drawer ids. Undefined on the in-chat path,
            // which keeps the historical "macro-drawer".
            idPrefix: o.idPrefix,
        },
    );
    return {
        meta,
        body,
        slots: calendarSlots(slice, slice[0].date, end),
        label: chartLabel,
        // Carried so trendsCard's `inlineChart` can draw the same
        // series sparkPaint would have; nothing on the in-chat
        // path reads it.
        goals: data.goals,
    };
}

/* The card as a string: the header — title, the window line and the range
   toggle — over the body a range change repaints.

   The meta is emitted BEFORE the seg, so a screen reader hears which window
   the figures cover before the control that changes it; `.cmeta.crow`
   (base.css) puts it back on the header's second row visually.

   The glow stays calorie-tinted whatever series is selected: the panel's own
   colour moves with the series, and a whole card changing hue on every tap was
   a second, louder copy of that one signal.

   `opts`: { range: number, inlineChart: boolean }. `range` is the window that
   reads as pressed. `inlineChart` splices the sparkline straight into the
   panel's `.fspark` slot instead of leaving it empty for a post-paint
   sparkPaint — for the caller with NO DOM. The in-chat path deliberately does
   not use it: there the body reaches the document first and sparkPaint writes
   the node, which is what keeps SPARK.painted, and so the once-only entrance,
   honest. */
function trendsCard(view, opts) {
    const o = opts || {};
    const range = o.range;
    const seg = RANGES.map(
        (r) =>
            `<button type="button" data-range="${r}" aria-pressed="${r === range}" aria-label="${esc(tpl(T.trends.rangeDaysAriaLabel, { n: r }))}">${r}</button>`,
    ).join("");
    // The chart's accessible name is a function of the metric
    // being drawn (see chartLabelFor); the inline one always draws
    // calories, so it is resolved here rather than in sparkMarkup.
    const cal = MACROS.find((m) => m.role === "cal");
    const body = o.inlineChart
        ? sparkInline(view.body, {
              slots: view.slots,
              key: "calories",
              goals: view.goals,
              still: false,
              label:
                  typeof view.label === "function"
                      ? view.label(cal)
                      : view.label,
          })
        : view.body;
    return `
          <div class="card c-cal">
            <div class="glow"></div>
            <header class="chead">
              <h1 class="ctitle">${esc(T.trends.title)}</h1>
              <span class="cmeta crow" id="tr-meta">${esc(view.meta)}</span>
              <div class="seg" role="group" aria-label="${esc(T.trends.windowAriaLabel)}">${seg}</div>
            </header>
            <div id="tr-body">${body}</div>
          </div>`;
}
