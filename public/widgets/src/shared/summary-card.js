/* The get_nutrition_summary card, composed: header, the empty-state branch,
   and the tiered macro strip whose calorie focus panel carries the ring, the
   figure, the averaging label and the sparkline as one object.

   IT LIVES HERE, not in the template, because two callers build this card from
   one payload shape: the in-chat widget (nutrition-summary.html), which writes
   it into #root and then paints the chart into the panel it just created, and
   the public site's landing page, which renders the same card at BUILD TIME by
   evaluating these partials with no DOM at all (scripts/gen-index.ts). A card
   hand-approximated in a second place is a card that drifts; composed here it
   is the same string by construction.

   WHAT IT DOES NOT DO. It writes no DOM and reads no globals but the ambient
   T (shared/i18n.js) and the water unit (setWaterUnit, shared/macros.js): the
   caller resolves the locale and the unit before calling, exactly as render()
   always did. It returns a string.

   INCLUDE ORDER. After shared/macros.js and shared/spark.js, whose macroPanel,
   sparkReset, chartableKeys and sparkMarkup it calls, and after shared/date.js
   (rangeLabel, ymd, daysLoggedCaption) and shared/svg.js (calendarSlots). Like
   every partial here, everything it reaches for is resolved when a function
   RUNS, so only the first call has to come after all of them. */

/* "3 days logged", or "15 of 30 days logged" when the payload also says how
   wide the window was. The wording and the span rules live in
   daysLoggedCaption (shared/date.js); this card only reads its payload.
   `days_in_range` is OPTIONAL — a host replaying a tool result from before it
   existed has no such field, and older payloads must render exactly as they
   always did, which is why it is handed over raw for daysLoggedCaption to vet.

   `logged_days` falls back to the rows actually held: without it the caption
   printed "DAYS LOGGED" with no number in front. Same name and signature as
   when it sat in the template, because public/widgets/summary-caption.test.ts
   extracts it by name out of the assembled page. */
function loggedDaysCaption(data) {
    const raw = data.logged_days;
    const logged =
        raw != null && raw !== "" && Number.isFinite(Number(raw))
            ? Number(raw)
            : Array.isArray(data.days)
              ? data.days.length
              : 0;
    return daysLoggedCaption(logged, data.days_in_range);
}

/* Two logged days is the least that draws a line; one is a card with no chart
   at all rather than a chart with nothing in it — however wide the range
   around it. One rule, two readers: summaryCard resets the axis from it, and
   the template asks it again to decide whether to paint into that axis. */
function summaryCharted(data) {
    return !!(data && Array.isArray(data.days) && data.days.length >= 2);
}

/* The whole card as a string.

   `opts`: { onSeries: (key, opened) => void, inlineChart: boolean,
   idPrefix: string }.

     * onSeries is the chart coupling handed to macroPanel — a tile tap moves
       the focus panel (figure, ring, colour and line) to that metric. The
       in-chat template passes one; a build-time caller passes none, which
       changes no markup (macroPanel's ctx reads onSeries only when a tap
       fires; only chartKeys decides which tiles are controls).
     * inlineChart splices the calorie sparkline straight into the panel's
       `.fspark` slot instead of leaving it empty for a post-paint sparkPaint.
       It is for the caller with NO DOM. The in-chat path deliberately does not
       use it: there the strip reaches the document first and sparkPaint writes
       the node, which is what keeps SPARK.painted — and so the once-only
       entrance (`.fspark .cwrap.still`, chip.css) — honest.
     * idPrefix namespaces this card's drawer ids, and is handed straight to
       macroPanel (see MACRO_DRAWER_PREFIX in shared/macros.js). It is the one
       option this partial forwards without reading it: an iframe holds a
       single card and keeps the default, but the landing page builds two of
       these into one document and ids are document-global, so a card that
       swallowed the option would point both cards' aria-controls at whichever
       drawer came first. Forwarded rather than defaulted here, so "no prefix"
       stays one decision, made in macroDrawerId. */
function summaryCard(data, opts) {
    const o = opts || {};
    const hasRange = !!(
        ymd(data && data.start_date) && ymd(data && data.end_date)
    );
    if (!data || !Array.isArray(data.days) || data.days.length === 0) {
        // A range with nothing in it still names the range: the
        // empty message alone could not say WHICH week was empty,
        // and a card with no header was the only one of this
        // widget's states that did not look like this widget.
        const empty = `
              <div class="empty">
                <div class="big">🍽️</div>
                <div>${esc(T.nutritionSummary.empty)}</div>
              </div>`;
        return hasRange
            ? `
          <div class="card c-cal">
            <div class="glow"></div>
            <header class="chead">
              <h1 class="ctitle">${esc(T.nutritionSummary.title)}</h1>
              <span class="cmeta">${esc(rangeLabel(data.start_date, data.end_date))}</span>
            </header>
            ${empty}
            <div class="foot" data-widget-foot></div>
          </div>`
            : empty;
    }
    const days = data.days.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    const multi = days.length > 1;
    // Name the denominator: this average divides by the days that
    // actually have a log, while the trends widget's figures divide
    // by every calendar day in the window. Same macros, different
    // number — labelling both is the fix for issue #70. Keyed on
    // LOGGED days, not on the range: a week with one logged day
    // averages over that one day, whose figure is also, exactly,
    // the week's total.
    const calLabel = multi
        ? T.nutritionSummary.dailyAvgLoggedDays
        : T.nutritionSummary.total;
    // The HEADER, though, is keyed on the RANGE. A seven-day window
    // with one logged day printed "7 JUL" alone, which reads as a
    // single-day summary and hides the six empty days — the range
    // plus "1 of 7 days logged" is what was actually asked for.
    // Without a usable start/end (an old payload) the logged count
    // decides, as it always did. A single day goes through
    // rangeLabel(d, d) so a past year still shows.
    const ranged = hasRange ? data.start_date !== data.end_date : multi;
    const single = hasRange ? data.end_date : days[0].date;
    const meta = ranged
        ? `${rangeLabel(hasRange ? data.start_date : days[0].date, hasRange ? data.end_date : days[days.length - 1].date)} · ${loggedDaysCaption(data)}`
        : rangeLabel(single, single);

    const charted = summaryCharted(data);
    const slots = charted
        ? calendarSlots(days, data.start_date, data.end_date)
        : [];
    // A new card: a new axis, calories, and the chart's entrance
    // owed again (see `.fspark .cwrap.still` in chip.css).
    sparkReset(slots, data.goals);

    // Calorie hero, the macro rail, the limits rail and the drawer.
    // Tapping a chip opens the meals behind it and hands the chart
    // that nutrient; closing it gives the chart back to calories.
    const strip = macroPanel(data.averages, data.goals, undefined, data.meals, {
        // THREE VISUAL LEVELS instead of one flat rail of
        // eight identical tiles: the energy split (protein /
        // carbs / fat) three-up under the hero, water as a
        // full-width bar of its own because it is not food and
        // no meal carries it, and the four ceilings last,
        // behind a hairline and a size down. See "the tiers"
        // in shared/chip.css for what each level is made of.
        tiers: true,
        // "us" | "uk" for a user who tracks alcohol, null for
        // one who does not — and null is also the case in which
        // no alcohol figure reaches the strip at all.
        drinkUnit: data.drink_unit,
        calLabel,
        chartKeys: charted ? chartableKeys(days) : [],
        onSeries: o.onSeries,
        // This card's drawer ids. Undefined on the in-chat path, which
        // keeps the historical "macro-drawer".
        idPrefix: o.idPrefix,
    });

    // The chart goes INSIDE the focus panel, under the figure row: the panel
    // is the figure and its own chart as one object, so the number and the
    // series it came from can never disagree (see focusInner in
    // shared/macros.js). No label — the panel is a button, whose own name
    // already carries every figure the line draws.
    const body = o.inlineChart
        ? sparkInline(strip, {
              slots,
              key: "calories",
              goals: data.goals,
              still: false,
          })
        : strip;

    return `
          <div class="card c-cal">
            <div class="glow"></div>
            <header class="chead">
              <h1 class="ctitle">${esc(T.nutritionSummary.title)}</h1>
              <span class="cmeta">${esc(meta)}</span>
            </header>
            ${body}
          </div>`;
}
