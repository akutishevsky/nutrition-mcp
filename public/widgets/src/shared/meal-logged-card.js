/* The log_meal / update_meal card, composed: the header naming the meal just
   logged (the day it landed on, its meal type and description, the calories
   it added) over the day's tiered strip.

   IT LIVES HERE, not in the template, for the same reason shared/summary-card.js
   and shared/trends-card.js do: two callers build this card from one payload —
   the in-chat widget (templates/meal-logged.html, via render()), and the public
   site's landing page, which renders the same card at BUILD TIME by evaluating
   these partials with no DOM (src/widget-static.ts) and binds it at runtime
   (site/boot.js). A card hand-approximated in a second place is a card that
   drifts.

   WHAT IT DOES NOT DO. It writes no DOM and reads nothing but the ambient T /
   WIDGET_LOCALE (shared/i18n.js) and the water unit (setWaterUnit): the caller
   resolves the locale and the unit first, exactly as render() does. The one
   side effect is macroPanel's own — it stashes the strip's ctx as the fallback
   the delegated handlers resolve through.

   INCLUDE ORDER. After shared/macros.js (macroPanel, mealTypeLabel), shared/
   date.js (isToday, shortDate, dayHeader) and shared/fmt.js (fmt, esc).
   Everything is resolved when the function RUNS, so only the first call has to
   come after all of them. */

// The card as one string, or "" when there is nothing to show.
//
// Per product decision: with no goals there is no target to show progress
// against, so the widget shows nothing at all — render() writes an empty root
// and the host collapses the frame. The check is repeated here so a caller
// that skips render()'s own early return (the site build) cannot draw a card
// the widget never would.
//
// `opts.idPrefix` namespaces the strip's drawer ids (see MACRO_DRAWER_PREFIX in
// shared/macros.js). The widget passes none — one strip per iframe keeps the
// default ids — and a page holding several of these cards passes one per card.
function mealLoggedCard(data, opts) {
    const o = opts || {};
    if (!data || !data.has_goals || !data.goals) return "";

    const totals = data.totals || {};
    // update_meal (and log_meal, via a backdated logged_at) can
    // show a day that is not the viewer's today, so the hero only
    // claims "today" when data.date actually is that day (#114);
    // otherwise it names the day, which is also why that day is
    // on the header line below. shortDate, never the year: this
    // label is the panel's first meta line, which ellipsises from
    // the END, and ja's caloriesOn puts the metric word last
    // ("{date}のカロリー") — a year in front of it is what the
    // ellipsis would eat first. Saying "not today" is the whole
    // job (#114); the year, when there is one, is on .csub.
    const calLabel = isToday(data.date)
        ? T.macros.caloriesToday
        : tpl(T.macros.caloriesOn, { date: shortDate(data.date) });
    const strip = macroPanel(
        totals,
        data.goals,
        undefined,
        data.meals,
        // `drink_unit` is null for a user who does not track
        // alcohol, which is also the case in which no alcohol
        // figure reaches the strip; macroCtxOf falls back to the
        // server's own default of "us". TIERED, like
        // nutrition-summary: the calorie panel, then macros /
        // limits / water each on a rail laid out to its own tile
        // count. No chartKeys and no onSeries — a single-day card
        // has no series to draw — but a tile tap still moves the
        // focus panel to that metric (figure, ring, colour, label,
        // and the ✕ back to calories) and opens its meals: moving
        // the panel needs no chart, so it is the strip's own
        // default (focusFollow in shared/macros.js), not wiring
        // here. meal-logged.test.ts pins the flag, since dropping
        // it would quietly bring back the flat rail, and the
        // panel following the tile.
        {
            drinkUnit: data.drink_unit,
            calLabel,
            tiers: true,
            idPrefix: o.idPrefix,
        },
    );

    // The meal that was just logged names itself on the header
    // line, alongside the day it landed on (#114) — the strip
    // below is that whole day's totals, not necessarily today's.
    // dayHeader, not shortDate: a backdated update_meal can land
    // in an earlier year, and "20 Nov" alone would then read as
    // this November. dayHeader prints the year only when it is
    // not this one, and passes a malformed date through as-is.
    const meal = data.logged_meal;
    const bits = [];
    if (data.date) bits.push(esc(dayHeader(data.date)));
    // Meal type BEFORE the description, not after it. The
    // description is the only unbounded string on this line, so
    // anything behind it is what a clamp eats first — a 150-char
    // meal name used to take the trailing "· lunch" with it and
    // the card lost the one word that classified the entry
    // (layout audit, minor). Both are still shown in full
    // whenever they fit; only the ordering changed.
    if (meal && meal.description) {
        if (meal.meal_type) bits.push(esc(mealTypeLabel(meal.meal_type)));
        bits.push(esc(meal.description));
    }
    const sub = bits.join(" · ");
    // The one header meta that is a value rather than context, so
    // it takes .kcal — the calories this meal added, in the calorie
    // colour, beside the day total the hero shows.
    const added =
        meal && meal.calories != null
            ? tpl(T.mealLogged.addedKcal, {
                  kcal: fmt(meal.calories, 0),
              })
            : "";

    // Same widget for log_meal and update_meal — the action only
    // changes the header wording.
    const title =
        data.action === "updated"
            ? T.mealLogged.titleUpdated
            : T.mealLogged.titleLogged;

    return `
          <div class="card c-cal">
            <div class="glow"></div>
            <header class="chead">
              <h1 class="ctitle">${esc(title)}</h1>
              ${added ? `<span class="cmeta kcal">${esc(added)}</span>` : ""}
              ${sub ? `<span class="csub">${sub}</span>` : ""}
            </header>
            ${strip}
          </div>`;
}
