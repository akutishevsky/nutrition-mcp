/* The get_weight_trends card, composed: the header (title, window line and the
   7 / 14 / 30-day toggle), the latest reading as a `.focus.solo` panel with
   three fixed meta lines, and the data-scaled calendar chart inside it.

   IT LIVES HERE, not in the template, for the same reason shared/summary-card.js
   and shared/trends-card.js do: the in-chat widget (templates/weight-trends.html)
   and the public site's landing page (src/widget-static.ts at build time,
   site/boot.js at runtime) build this card from one payload.

   Every function here is a function of its ARGUMENTS — the payload, the range
   and whether the chart has already drawn in (`still`). The template keeps the
   state (which range the user picked, whether the chart has painted) and the
   DOM writes; the site's runtime keeps its own. Nothing here reads a global
   but the ambient T / WIDGET_LOCALE (shared/i18n.js).

   NAMES. This partial shares one scope with every other card partial on the
   public site's bundle (scripts/gen-widget-card.ts), where shared/trends-card.js
   already declares `RANGES` — so the toggle's windows are WEIGHT_RANGES, and
   the two window helpers carry a `wt` prefix.

   INCLUDE ORDER. After shared/i18n.js (T, tpl, plural, unitLabel),
   shared/date.js (utcDay, shiftDay, shortDate, rangeLabel), shared/svg.js (the
   chart geometry) and shared/fmt.js (esc). The dev gallery includes it too, and
   builds its `.focus.solo` specimens from panelHtml rather than a copy of it.

   There is NO chip rail, NO drawer and NO ring, and that is the point: this
   widget has a single series, a rail of one chip would be ceremony, and a
   weight is not a fraction of its target. So it needs neither macros.js nor
   spark.js — the panel is written right here out of chip.css's class names
   (`span.focus.solo`), which are the shared contract. */

// The windows the toggle offers, widest last.
const WEIGHT_RANGES = [7, 14, 30];

// Every weight on screen carries exactly one decimal — 77.0, not
// 77. This widget has no whole-number figures at all, so it uses
// this instead of the usual fmt(): rounding away a trailing zero
// would make the headline read at a different precision than the
// −2.9 beneath it.
function w1(n) {
    if (n == null || isNaN(n)) return "0.0";
    // WIDGET_LOCALE, not `undefined` (the host browser's locale):
    // a French profile on an English browser read "78.2 kg".
    const opts = {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    };
    try {
        return Number(n).toLocaleString(WIDGET_LOCALE || "en", opts);
    } catch (_) {
        return Number(n).toLocaleString(undefined, opts);
    }
}
// A value at the precision it is PRINTED at. Every verdict on the
// card — the change, the gap, "at target" — is worked out from
// these rather than from the raw floats, so it can never disagree
// with the figures beside it: 75.04 against a 74.96 target prints
// "75.0" twice, and must read "at target", not "0.1 kg to lose".
function r1(n) {
    return Math.round(Number(n) * 10) / 10;
}
// A real minus sign (U+2212), not a hyphen: at 24px beside a
// tabular figure a hyphen sits too high and too short to read as
// "minus".
function signed(n) {
    const s = n > 0 ? "+" : n < 0 ? "−" : "";
    return `${s}${w1(Math.abs(n))}`;
}

// ---- The window ----------------------------------------------------

// The readings the card can trust, oldest first: a real day and a
// finite weight. Anything else is a payload fault, and one bad row
// must not take the chart's y domain (NaN) down with it.
function wtReadings(data) {
    return (Array.isArray(data && data.days) ? data.days : [])
        .filter(
            (d) =>
                d &&
                utcDay(d.date) !== null &&
                Number.isFinite(Number(d.weight)),
        )
        .map((d) => ({ date: d.date, weight: Number(d.weight) }))
        .sort((a, b) => (a.date < b.date ? -1 : 1));
}

// Which calendar days the selected range covers. `end` is the
// payload's end_date when it is a real day, else the newest
// reading's; `start` is range-1 days before it. A DATE window, not
// slice(-range): weigh-ins are sparse, so the last 7 entries can
// span a season, and "last 7 days" has to mean days. With neither
// end usable there is no window to name, and start/end are null —
// the card then shows every reading, on the plain fallback axis.
function wtWindow(data, all, range) {
    const end =
        utcDay(data.end_date) !== null
            ? data.end_date
            : all.length
              ? all[all.length - 1].date
              : null;
    const start = end ? shiftDay(end, -(range - 1)) : null;
    const slice = start
        ? all.filter((d) => d.date >= start && d.date <= end)
        : all;
    return { start, end: start ? end : null, slice };
}

// ---- The panel -----------------------------------------------------

// One meta line built around a FIGURE, out of a translated template
// that holds it as {key}. chip.css's `.fdelta.fline` keeps the
// figure whole (`flex: none`) and lets only the prose around it
// ellipsise, so the template is split at the placeholder rather
// than filled in one piece — and split, not assumed to START with
// it: Japanese writes "{date}から{change}" and Ukrainian
// "лишилось скинути {amount}", so the prose can sit on either side.
// The prose spans keep their own spaces (the flex row has no gap —
// see `.fdelta .fsince`), and the markup is one line with no
// whitespace between spans because `white-space: pre` would print
// it. A template without exactly one placeholder is filled whole
// and treated as prose, which can only ever ellipsise.
function figureLine(template, key, figure, vars) {
    const parts = String(template).split(`{${key}}`);
    if (parts.length !== 2) {
        const all = tpl(template, { ...vars, [key]: figure });
        return `<b class="fdelta fline"><span class="fsince">${esc(all)}</span></b>`;
    }
    const prose = (s) =>
        s ? `<span class="fsince">${esc(tpl(s, vars))}</span>` : "";
    return `<b class="fdelta fline">${prose(parts[0])}<span>${esc(figure)}</span>${prose(parts[1])}</b>`;
}
// A meta line with no figure in it (needTwo, rangeEmpty, noTarget):
// muted, and still guarded. Inside `.fline` the text is one
// `.fsince` run, the shared "prose that may give" class, so a long
// translation ellipsises inside the panel instead of printing
// across its border — a span panel keeps only a 9px inset to lose
// it in. The full sentence stays in the DOM, so a screen reader
// (the panel is a plain <span>, not a button) still hears all of it.
function quietLine(text) {
    return `<b class="fdelta fline mute"><span class="fsince">${esc(text)}</span></b>`;
}

// Line 3: how far the latest reading is from the target, then the
// target itself. The gap is the reading and stays whole; the
// target is the reference, a step quieter (`.fgive`) and the part
// that ellipsises first. `latest` is null on a range with no
// readings, which names the target alone.
function targetLine(latest, target, unit) {
    if (!(target > 0)) return quietLine(T.weightTrends.noTarget);
    const give = `<span class="fgive"> · ${esc(
        tpl(T.weightTrends.target, {
            value: `${w1(target)} ${unit}`,
        }),
    )}</span>`;
    if (latest == null) {
        // No gap to lead with, so no separator either.
        return `<b class="fdelta fline"><span class="fgive">${esc(
            tpl(T.weightTrends.target, {
                value: `${w1(target)} ${unit}`,
            }),
        )}</span></b>`;
    }
    const gap = r1(r1(latest) - r1(target));
    const gapText =
        gap === 0
            ? T.weightTrends.atTarget
            : tpl(gap > 0 ? T.weightTrends.toLose : T.weightTrends.toGain, {
                  amount: `${w1(Math.abs(gap))} ${unit}`,
              });
    return `<b class="fdelta fline"><span>${esc(gapText)}</span>${give}</b>`;
}

// The panel: the figure, three fixed meta lines, and the chart in
// the `.fspark` row under them — nutrition-summary's panel, as a
// plain <span> because nothing on it discloses anything.
//
// THREE LINES, EVERY STATE. `.focus.solo .fmeta` gives each line a
// 13px box whether it holds text or not, and `.fspark` keeps its
// 48px row, so a range toggle never changes the card's height — a
// range with one reading still draws its chart box, and a range
// with none keeps the whole shell (figure "—", the reason on line
// 2, the target on line 3, a chart of rules and the target line).
// The old range-empty state swapped a ~145px panel for a 52px
// message, and the card jumped on a tap that changed no data.
//
// Nothing here carries a direction colour. The old delta pill went
// accent or --over by whether the weight had moved toward the
// target; weight has no breach state, the sign already says which
// way it went, and the gap on line 3 says how far is left.
function panelHtml(win, target, unit, range, still) {
    const slice = win.slice;
    const n = slice.length;
    const last = n ? slice[n - 1] : null;
    // The whole span per branch, because the two are not the same
    // kind of thing. The placeholder exists only to hold the
    // figure's box open (see "THREE LINES, EVERY STATE" above), so
    // it is decorative and marked as such — the panel is a plain
    // <span>, so its children stay in the accessibility tree and an
    // em dash was being announced ahead of "Latest", a punctuation
    // mark before the two lines that actually say there is no
    // reading. Decorative marks are aria-hidden everywhere here
    // (icon.js, the glyph silhouettes); it must stay VISIBLE.
    // A BARE UNIT IS NOT A GOAL — chipValue (shared/macros.js) made
    // this call for every other card's headline and says why there:
    // the goal branch begins its span with "/" and carries its own
    // space, so the 2px `.fmain .v .u` puts in reads as a separator;
    // with nothing but the unit in the span the same 2px printed
    // "78.2kg". The space is what makes the figure and its unit read
    // as one quantity, and `bare` is what keeps this `.u` out of the
    // <480px stacking rule should the markup ever sit under a chip.
    // The card's other three kg figures already print a real space.
    const figure = last
        ? `<span class="v">${w1(last.weight)}<span class="u bare"> ${esc(unit)}</span></span>`
        : `<span class="v" aria-hidden="true">—</span>`;
    // shortDate, not dayHeader — the same call goal-progress-card.js
    // makes for its panel label. The header's window line already
    // carries the year where it matters (rangeLabel), the change line
    // two rows down dates its first reading with shortDate, and
    // `.flabel` is the line that ellipsises: a year here was a second
    // date format inside one panel and the first thing cut at a chat
    // card's width.
    const label = last
        ? `${T.weightTrends.latest} · ${shortDate(last.date)}`
        : T.weightTrends.latest;

    let line2;
    if (!n) {
        line2 = quietLine(tpl(T.weightTrends.rangeEmpty, { range }));
    } else if (n < 2) {
        line2 = quietLine(T.weightTrends.needTwo);
    } else {
        // Dated from the first weigh-in IN the window, not from
        // the window's own length: two readings a day apart inside
        // a 30-day range are a one-day change, and "−1.0 kg in
        // 30 d" claims a month-long trend that was never measured.
        const change = r1(r1(last.weight) - r1(slice[0].weight));
        line2 = figureLine(
            T.weightTrends.sinceDate,
            "change",
            `${signed(change)} ${unit}`,
            { date: shortDate(slice[0].date) },
        );
    }

    return `<span class="focus c-acc solo"><span class="fmain">${figure}<span class="fmeta"><span class="flabel">${esc(label)}</span>${line2}${targetLine(last ? last.weight : null, target, unit)}</span></span><span class="fspark">${chartHtml(win, target, unit, still)}</span></span>`;
}

// ---- The chart -----------------------------------------------------

// Weight over time, one slot per CALENDAR day of the window
// (calendarSlots, shared/svg.js), so a weekly weigher's four
// readings sit a week apart instead of four evenly spaced
// consecutive-looking points.
//
// THE LINE BRIDGES THE DAYS BETWEEN READINGS — unlike
// nutrition-summary's, which breaks at a day with no log. A
// calorie total is a count of what was eaten that day, so a day
// with no log is missing data and a line across it would invent
// meals. A weight is a SAMPLED quantity: it existed on the days
// nobody stepped on the scale, and the straight segment between two
// readings is the honest guess at it — where a gap would reduce a
// weekly weigher's month to four isolated dots. What a bridge must
// not do is pass for daily data: with a hairline on every day the
// stroke across twenty unweighed days looks exactly like twenty
// readings. So every READING gets its own mark (chMarksMarkup), and
// only the marks are measurements.
//
// Y is scaled to the DATA range (widened to include the target)
// rather than to zero, because the question is "which way is this
// going", not "how far from nothing is it" — on a zero-based axis
// a 3 kg move across a month is a flat line. For the same reason
// there is NO area wash: the floor of the box is an arbitrary
// weight, not a quantity (see .carea in chart.css).
//
// PAINT ORDER: day rules → line → target → marks → last-reading
// dot. The target sits OVER the line (a bare 2.5px stroke would
// swallow the dashes where they meet — see `.fspark .cgoal`), and
// the marks over both, since they are the data; the last dot goes
// last and covers its own reading's mark.
function chartHtml(win, target, unit, still) {
    const slice = win.slice;
    const n = slice.length;
    const slots = calendarSlots(slice, win.start, win.end);
    const hasTarget = target > 0;
    const weights = slice.map((d) => d.weight);
    const ref = hasTarget ? weights.concat([target]) : weights;
    let lo = ref.length ? Math.min(...ref) : 0;
    let hi = ref.length ? Math.max(...ref) : 1;
    // One weigh-in, a run of identical ones, or a target alone has
    // no range at all: give it a ±1 unit window so the point lands
    // mid-box instead of dividing by zero.
    if (hi === lo) {
        hi = lo + 1;
        lo = lo - 1;
    }
    const pad = (hi - lo) * 0.18;
    const yMin = lo - pad;
    const yMax = hi + pad;
    // Every slot gets an x; only a slot with a reading gets a y
    // that means anything, and only those points are drawn.
    const xy = chPoints(
        slots.map((s) => (s.day ? s.day.weight : yMin)),
        yMin,
        yMax,
    );
    const pts = slots.map((s, i) => (s.day ? xy[i] : null));
    const read = pts.filter(Boolean);

    const dayLines = chDayLines(
        xy.filter((_, i) => hairlineSlot(slots[i], i, slots.length)),
    );
    // pathLength="1" is what lets `.fspark .cline` draw the line in
    // with one dash (chip.css) — and a lone reading has no line to
    // draw, only its dot.
    const line =
        read.length >= 2
            ? `<path class="cline" pathLength="1" d="${chPath(read)}"/>`
            : "";
    const ty = hasTarget ? chY(target, yMin, yMax).toFixed(1) : null;
    const goal =
        ty != null
            ? `<line class="cgoal" x1="${CH_PL}" y1="${ty}" x2="${CH_W - CH_PR}" y2="${ty}"/>`
            : "";
    const lastPt = read.length ? read[read.length - 1] : null;
    const dot = lastPt ? chDotMarkup(lastPt[0], lastPt[1]) : "";

    // The label names the WINDOW's two ends and the latest value —
    // the existing string, whose word order each locale fixes, fed
    // what the axis now spans. With no window (no usable end date)
    // it falls back to the readings' own ends. A range with no
    // readings has nothing to describe beyond the panel's own lines,
    // which already say so, and is hidden instead.
    const a11y = n
        ? `role="img" aria-label="${esc(
              tpl(T.weightTrends.chartAriaLabel, {
                  from: shortDate(win.start || slice[0].date),
                  to: shortDate(win.end || slice[n - 1].date),
                  latest: `${w1(slice[n - 1].weight)} ${unit}`,
              }),
          )}"`
        : 'aria-hidden="true"';

    // `c-acc` on the .cwrap itself, not only on the panel: chart.css
    // keeps the brand stroke un-darkened only for `.cwrap.c-acc`
    // (--acc is already AA-corrected), and without it the line,
    // marks and dot would be drawn in the darkened variant.
    return `<span class="cwrap c-acc${still ? " still" : ""}"><svg viewBox="0 0 ${CH_W} ${CH_H}" preserveAspectRatio="none" ${a11y}>${dayLines}${line}${goal}${chMarksMarkup(pts)}${dot}</svg></span>`;
}

// ---- The card ------------------------------------------------------

// The header's window line: "5–11 Jul · 4 weigh-ins".
//
// "weigh-ins" counts DAYS, knowingly: the tool averages same-day
// readings into one row, so someone who weighs twice a day sees
// half their weigh-ins here. Almost nobody does, and a days-weighed
// plural would be a new string in nine locales — kept this round
// and recorded as an open question in the port plan.
function wtMetaText(win) {
    const count = plural(T.weightTrends.weighIns, win.slice.length);
    return win.start ? `${rangeLabel(win.start, win.end)} · ${count}` : count;
}

// The window line for `range` — what the header shows on that toggle
// position, and what the template's reserveLine measures all three of.
function weightTrendsMeta(data, range) {
    return wtMetaText(wtWindow(data, wtReadings(data), range));
}

// Everything below the header for one window. Split out of the card so a
// range change can rewrite this alone and leave the header — and the seg
// button the user is standing on — in place.
function wtBodyHtml(data, win, range, still) {
    // A CODE in the payload ("kg" / "lb"), the printed label from
    // here down — every block below only ever prints it.
    const unit = unitLabel(data.unit || "kg");
    const target = Number(data.target);
    return panelHtml(
        win,
        Number.isFinite(target) ? target : null,
        unit,
        range,
        still,
    );
}

// The body for `range`: the `#wt-body` contents a toggle writes.
function weightTrendsBody(data, range, still) {
    return wtBodyHtml(
        data,
        wtWindow(data, wtReadings(data), range),
        range,
        still,
    );
}

function wtSegHtml(range) {
    return WEIGHT_RANGES.map(
        (r) =>
            `<button type="button" data-range="${r}" aria-pressed="${r === range}" aria-label="${esc(tpl(T.weightTrends.rangeAriaLabel, { n: r }))}">${r}</button>`,
    ).join("");
}

// The whole card, opened on `range`. Built as ONE string before anything is
// written, so a throw anywhere in it leaves the previous card standing (the
// bridge's tryRender then decides what a first paint shows).
//
// `opts.still` is whether the chart has already drawn in once: every paint
// after the first is `.still`, so a range switch is instant and only a new
// tool result replays the draw-in. `range` is the caller's resolved window
// (render() has already turned default_range into one of WEIGHT_RANGES).
function weightTrendsCard(data, range, opts) {
    const o = opts || {};
    data = data && typeof data === "object" ? data : {};
    const all = wtReadings(data);
    const empty = `
            <div class="empty">
              <div class="big">⚖️</div>
              <div>${esc(T.weightTrends.empty)}</div>
            </div>`;
    if (all.length === 0) {
        // Nothing in the whole 30-day series. With a real end date
        // the card still names the window it looked at — the empty
        // message alone cannot say WHICH stretch was empty — as
        // nutrition-summary's empty card does. The window named is
        // the one this card would otherwise be SHOWING (`range`,
        // already resolved from default_range by the caller), not the
        // 30 days the payload happens to span: a 7-day question
        // answered with a month-long heading, and no toggle on the
        // card to explain the wider window, is the card answering a
        // question nobody asked. trends' empty branch reads the same
        // way. No toggle: every range of an empty series is equally
        // empty. Without a date there is nothing to head a card
        // with, so the bare state stands.
        //
        // The line is wtMetaText over that window — "5–11 Jul ·
        // 0 weigh-ins", the string a range with no readings prints
        // in the same header — not the bare range: two empty cards
        // for one window must not describe it two ways.
        if (utcDay(data.end_date) === null) return empty;
        return `
          <div class="card c-acc">
            <div class="glow"></div>
            <header class="chead">
              <h1 class="ctitle">${esc(T.weightTrends.title)}</h1>
              <span class="cmeta">${esc(wtMetaText(wtWindow(data, all, range)))}</span>
            </header>
            ${empty}
            <div class="foot" data-widget-foot></div>
          </div>`;
    }
    const win = wtWindow(data, all, range);
    const body = wtBodyHtml(data, win, range, o.still);
    // The window line comes BEFORE the seg in the DOM, so a screen
    // reader hears which days the figures cover before the control
    // that changes them; `.chead > .cmeta.crow` (base.css) puts it
    // back on a row of its own under the title.
    return `
          <div class="card c-acc">
            <div class="glow"></div>
            <header class="chead">
              <h1 class="ctitle">${esc(T.weightTrends.title)}</h1>
              <span class="cmeta crow" id="wt-meta">${esc(wtMetaText(win))}</span>
              <div class="seg" role="group" aria-label="${esc(T.weightTrends.windowAriaLabel)}">${wtSegHtml(range)}</div>
            </header>
            <div id="wt-body">${body}</div>
            <div class="foot" data-widget-foot></div>
          </div>`;
}
