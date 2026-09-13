/* The get_goal_progress card, composed: the header naming the day and what was
   logged on it, then nutrition-summary's tiered strip with the weight row after
   water — or, on a day with nothing in it, the empty card that still names the
   day.

   IT LIVES HERE, not in the template, for the same reason shared/summary-card.js
   and shared/trends-card.js do: the in-chat widget (templates/goal-progress.html)
   and the public site's landing page (src/widget-static.ts at build time,
   site/boot.js at runtime) build this card from one payload.

   THE WEIGHT ROW IS HANDED IN, not defined here. Its markup — weightExtra, with
   its reading/target states, the track and the scale glyphs — stays in
   goal-progress.html, and the caller passes that function as
   `opts.weightExtra`. The site build reads it out of the template's marked
   `site-card` region rather than out of a partial (src/widget-static.ts,
   scripts/gen-widget-card.ts), so there is still exactly one copy of it.

   WHAT IT DOES NOT DO. It writes no DOM and reads nothing but the ambient T /
   WIDGET_LOCALE and the water unit: the caller resolves both first, as
   render() does. The one side effect is macroPanel's ctx stash.

   INCLUDE ORDER. After shared/macros.js, shared/date.js and shared/fmt.js. */

// Whether this payload draws the strip (and so a drawer, and something for
// macroRestore to put back) rather than one of the two empty states. The
// template asks it too, so the "nothing logged" rule has one home.
function goalProgressShowsStrip(data) {
    if (!data || typeof data !== "object") return false;
    const meals = data.meal_count || 0;
    const water = data.water_entries || 0;
    const w = data.weight;
    return !(
        meals === 0 &&
        water === 0 &&
        !(w && (w.current != null || w.target != null))
    );
}

// The card as one string. `opts.weightExtra(weight)` is required (see above);
// `opts.idPrefix` namespaces the strip's drawer ids for a page holding more
// than one strip, and the weight row and its drawer head follow it because
// macroPanel hands them this strip's ids.
function goalProgressCard(data, opts) {
    const o = opts || {};
    if (typeof o.weightExtra !== "function") {
        throw new Error(
            "goalProgressCard: opts.weightExtra must be goal-progress.html's weightExtra",
        );
    }

    if (!data || typeof data !== "object") {
        return `
            <div class="empty">
              <div class="big">🎯</div>
              <div>${esc(T.goalProgress.empty)}</div>
            </div>`;
    }

    const totals = data.totals || {};
    const meals = data.meal_count || 0;
    const water = data.water_entries || 0;
    const w = data.weight;
    // "10 Jul" this year, "20 Nov 2025" otherwise; a date that is
    // not a real day passes through as it came (dayHeader).
    const day = dayHeader(data.date);

    if (!goalProgressShowsStrip(data)) {
        // A day with nothing in it still names the day, in a card
        // that looks like this widget — nutrition-summary's empty
        // range does the same. The body line is date-free because
        // the header already carries the date. Only when the date
        // is unusable is there no header to put it in, and then
        // the bare block says it inline as it always did.
        return ymd(data.date)
            ? `
          <div class="card c-cal">
            <div class="glow"></div>
            <header class="chead">
              <h1 class="ctitle">${esc(T.goalProgress.title)}</h1>
              <span class="cmeta">${esc(day)}</span>
            </header>
            <div class="empty">
              <div class="big">🎯</div>
              <div>${esc(T.goalProgress.nothingLogged)}</div>
            </div>
            <div class="foot" data-widget-foot></div>
          </div>`
            : `
            <div class="empty">
              <div class="big">🎯</div>
              <div>${esc(tpl(T.goalProgress.nothingLoggedFor, { date: day || T.goalProgress.thisDay }))}</div>
            </div>`;
    }

    // The date this widget shows is arbitrary — get_goal_progress
    // takes any date — so the calorie label only says "today" when
    // it actually is the viewer's today (#114); otherwise it names
    // the day. shortDate, not dayHeader: the header meta already
    // carries the year where it matters, and a year in the panel
    // label would be what ellipsises away the metric word (ja).
    const calLabel = isToday(data.date)
        ? T.macros.caloriesToday
        : tpl(T.macros.caloriesOn, { date: shortDate(data.date) });

    const strip = macroPanel(totals, data.goals, undefined, data.meals, {
        // nutrition-summary's three levels: the energy split
        // three-up under the panel, the ceilings a size down,
        // water as the closing bar (see "the tiers" in
        // shared/chip.css). No chartKeys and no onSeries — this
        // payload is one day, with no series to draw — so a
        // tile opens its meals and nothing else, and the panel
        // stays the day's calorie headline.
        tiers: true,
        // "us" | "uk" for a user who tracks alcohol, null for
        // one who does not.
        drinkUnit: data.drink_unit,
        calLabel,
        // The weight row, after water and before the drawer,
        // opening that same drawer. See weightExtra.
        extra: o.weightExtra(w),
        idPrefix: o.idPrefix,
    });

    // A day with a weight reading but no meals or water still shows
    // the strip (all zeros against the goals), so say why. Date-free
    // for the same reason as the empty card: the meta names the day.
    const bare = meals === 0 && water === 0;
    // The day itself and what was logged on it — the context the
    // strip's numbers are read against. A missing date drops its
    // slot rather than opening the line with " · ".
    //
    // …but the counts exist to say what the strip's numbers are made
    // of, and at zero they add nothing the `.csub` directly under
    // them does not already say — in the loudest slot on the card,
    // and at the price of a whole header row on a phone ("15 Jul ·
    // 0 meals · 0 waters" cannot sit beside the title, which cost
    // ~25px at 280px in 8 of 9 locales). The fully-empty card two
    // branches up prints the day alone for exactly this reason, and
    // this is the one state that contradicted it.
    const meta = [
        day,
        bare ? "" : plural(T.goalProgress.mealsCount, meals),
        bare ? "" : plural(T.goalProgress.waterCount, water),
    ]
        .filter(Boolean)
        .join(" · ");
    const sub = bare
        ? `<span class="csub">${esc(T.goalProgress.nothingLogged)}</span>`
        : "";

    return `
          <div class="card c-cal">
            <div class="glow"></div>
            <header class="chead">
              <h1 class="ctitle">${esc(T.goalProgress.title)}</h1>
              <span class="cmeta">${esc(meta)}</span>
              ${sub}
            </header>
            ${strip}
          </div>`;
}
