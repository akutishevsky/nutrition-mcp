/* Chart geometry. Pure string math — no DOM, no measurement, no reads off an
   element — so it evaluates in a test harness where `document` is undefined,
   and so a chart can be built inside the same innerHTML string as everything
   else rather than in a second post-paint pass.

   The coordinate space is the viewBox, never CSS pixels: the svg is drawn at
   480x52 with preserveAspectRatio="none" and stretched by CSS, which is exactly
   why nothing here needs to know how wide the card is. */
var CH_W = 480,
    CH_H = 52,
    CH_PL = 6,
    CH_PR = 6,
    CH_PT = 7,
    CH_PB = 6,
    /* The floor of the plot box. On a zero-based chart it is also where the
       value 0 lands (chY(0, 0, top) resolves to exactly this), which is what
       makes the area fill below measure something real. */
    CH_BASE = CH_H - CH_PB;

/* Maps values to [x, y] pairs. A single value is centred rather than pinned to
   the left edge, so one weigh-in renders as a dot in the middle of the box. */
function chPoints(vals, yMin, yMax) {
    var n = vals.length,
        w = CH_W - CH_PL - CH_PR,
        h = CH_H - CH_PT - CH_PB,
        span = yMax - yMin || 1 /* || 1: a flat series would divide by zero */,
        out = [],
        i;
    for (i = 0; i < n; i++) {
        out.push([
            n === 1 ? CH_PL + w / 2 : CH_PL + (i / (n - 1)) * w,
            CH_PT + h - ((vals[i] - yMin) / span) * h,
        ]);
    }
    return out;
}

/* One-decimal coordinates: at 480 units stretched over ~340 CSS px that is well
   below a device pixel, and it keeps the `d` attribute short. */
function chPath(pts) {
    var d = "",
        i;
    for (i = 0; i < pts.length; i++) {
        d +=
            (i ? "L" : "M") + pts[i][0].toFixed(1) + " " + pts[i][1].toFixed(1);
    }
    return d;
}

/* The same series closed down to CH_BASE, for the wash under the line.
   ZERO-BASED charts only — see the .carea comment in chart.css for why a
   data-scaled chart must never call this.

   Reads a null entry as a gap exactly as the callers' own line paths do, so a
   day nobody logged stays unfilled instead of the wash bridging it. Each run of
   readings closes into its own subpath. A run of ONE point closes to zero width
   and paints nothing, which is right: there is no span under a single reading,
   and the line's round cap already draws it as a dot. */
function chArea(pts) {
    var d = "",
        run = [],
        i,
        j;
    function flush() {
        if (run.length > 1) {
            for (j = 0; j < run.length; j++) {
                d +=
                    (j ? "L" : "M") +
                    run[j][0].toFixed(1) +
                    " " +
                    run[j][1].toFixed(1);
            }
            d +=
                "L" +
                run[run.length - 1][0].toFixed(1) +
                " " +
                CH_BASE +
                "L" +
                run[0][0].toFixed(1) +
                " " +
                CH_BASE +
                "Z";
        }
        run = [];
    }
    for (i = 0; i < pts.length; i++) {
        if (pts[i]) run.push(pts[i]);
        else flush();
    }
    flush();
    return d;
}

/* Every chart needs its OWN gradient: the stops read var(--c), which resolves
   against the element the gradient sits in, so one shared <linearGradient>
   would paint every series in whichever colour its own ancestor happened to
   carry. Ids are document-global in HTML and component-gallery draws dozens
   of charts on one page, so they are counted rather than named. */
var CH_GRAD_N = 0;

/* defs + the filled path, given a `d` from chArea. The node is emitted even for
   an empty `d` (a one-point series has no area): trends re-points its chart by
   writing attributes rather than rebuilding it, and a node that sometimes is
   not there is exactly how that kind of repaint acquires a null check it will
   one day forget. An empty path paints nothing. */
function chAreaMarkup(d) {
    var id = "cg" + ++CH_GRAD_N;
    return (
        '<defs><linearGradient id="' +
        id +
        '" x1="0" y1="0" x2="0" y2="1"><stop class="cstop-a" offset="0"/>' +
        '<stop class="cstop-b" offset="1"/></linearGradient></defs>' +
        '<path class="carea" fill="url(#' +
        id +
        ')" d="' +
        d +
        '"/>'
    );
}

/* One vertical hairline per point, spanning the plot box from CH_PT down to
   CH_BASE — the .cday grid. Takes the same `pts` as the line, so a rule always
   lands exactly on its day's x; pass every day, gaps included, since a day with
   no reading is still a day. */
function chDayLines(pts) {
    var s = "",
        i,
        x;
    for (i = 0; i < pts.length; i++) {
        x = pts[i][0].toFixed(1);
        s +=
            '<line class="cday" x1="' +
            x +
            '" y1="' +
            CH_PT +
            '" x2="' +
            x +
            '" y2="' +
            CH_BASE +
            '"/>';
    }
    return s;
}

/* The last-point marker's geometry: a ZERO-LENGTH subpath at (x, y). A <circle>
   cannot be the marker here — its r is in viewBox units, and
   preserveAspectRatio="none" scales x by width/480 but y by 1, so r=5 drew a
   ~1.6x-wide oval on a 700px card and a tall one on a narrow card. A
   zero-length path with a round cap paints a disc whose diameter is the
   stroke width, and under vector-effect: non-scaling-stroke that width is in
   CSS px, so the disc is round at every card width (.chalo/.cdot in
   chart.css carry the widths). Returned as the bare `d` so a chart that
   re-points in place (trends) can write it as an attribute. */
function chDot(x, y) {
    var p = (+x).toFixed(1) + " " + (+y).toFixed(1);
    return "M" + p + "L" + p;
}

/* Halo + dot for the last point, halo first so the dot sits on it. */
function chDotMarkup(x, y) {
    var d = chDot(x, y);
    return (
        '<path class="chalo" d="' + d + '"/><path class="cdot" d="' + d + '"/>'
    );
}

/* The y for one value on the same scale — the goal/target line's y1 and y2. */
function chY(v, yMin, yMax) {
    var h = CH_H - CH_PT - CH_PB;
    return CH_PT + h - ((v - yMin) / (yMax - yMin || 1)) * h;
}

/* One small mark per READING, for a chart whose line bridges the days between
   readings. weight-trends draws that way on purpose: a weight is a sampled
   quantity, so a day nobody stepped on the scale is a gap in the sampling, not
   in the weight. But a bridged line alone hides which of its vertices were
   measured — a week of daily weigh-ins and two readings six days apart draw
   the same stroke — so each reading gets its own disc.

   Same zero-length, round-capped geometry as chDot and for the same reason (a
   <circle> would stretch into an oval; see chDot), one path per reading. `pts`
   may carry nulls, which draw nothing, so a caller can hand over the same
   calendar-slotted array its hairlines are built from. Emit these BEFORE
   chDotMarkup, so the last reading's halo and larger dot sit over its mark. */
function chMarksMarkup(pts) {
    var s = "",
        i;
    for (i = 0; i < pts.length; i++) {
        if (pts[i]) {
            s += '<path class="cpt" d="' + chDot(pts[i][0], pts[i][1]) + '"/>';
        }
    }
    return s;
}

/* ---- The calendar x axis ------------------------------------------------
   The two helpers below read utcDay() and DAY_MS from shared/date.js. They are
   looked up when called, not when this file is evaluated, so the only
   requirement is that date.js is in the page before a chart is DRAWN. Every
   template that includes svg.js (nutrition-summary, trends, weight-trends, the
   component gallery) includes date.js ahead of it; keep it that way. */

// THE X AXIS IS THE CALENDAR. `days[]` holds only the dates that
// logged something, so spacing points by array index made eight
// logged days in a 30-day window draw as eight evenly spaced
// consecutive ones: the gaps, which are most of what a month
// chart has to say, vanished. One slot per day from start_date to
// end_date, null where nothing was logged; everything downstream
// (the gapped line, the gapped wash, the last-reading dot) already
// reads null as a gap.
//
// Stepped in UTC milliseconds (utcDay, shared/date.js), never with
// local setDate(): a local midnight plus 24h lands on 23:00 or
// 01:00 across a DST change and the ISO slice then names the wrong
// day. Falls back to the plain logged-day array — the old
// behaviour, still a correct ORDER — whenever the range cannot be
// trusted: a malformed date, start after end, a logged day outside
// the range, or a window so wide (over ten years) that it is a
// payload fault rather than a chart.
function calendarSlots(days, start, end) {
    const plain = days.map((d) => ({ t: null, day: d }));
    const t0 = utcDay(start),
        t1 = utcDay(end);
    if (t0 === null || t1 === null || t0 > t1) return plain;
    const n = Math.round((t1 - t0) / DAY_MS) + 1;
    if (n > 3660) return plain;
    const byDate = new Map();
    for (const d of days) {
        const t = utcDay(d && d.date);
        if (t === null || t < t0 || t > t1) return plain;
        byDate.set(t, d);
    }
    const slots = [];
    for (let i = 0; i < n; i++) {
        const t = t0 + i * DAY_MS;
        slots.push({ t, day: byDate.get(t) || null });
    }
    return slots;
}

// Which slots get a day hairline. One per day while there is room
// for them to read as days — up to a month. Past that they merge:
// 365 one-pixel rules across ~340px is a grey slab, not a grid. Up
// to ~four months a rule marks each MONDAY instead (read off the
// calendar date, so it is a real week boundary, not every seventh
// slot from wherever the range began); wider than that, none — a
// weekly rule every 5px is the same slab again. A fallback axis
// with no dates marks every seventh slot, the nearest honest thing.
function hairlineSlot(slot, i, n) {
    if (n <= 31) return true;
    if (n > 120) return false;
    return slot.t === null ? i % 7 === 0 : new Date(slot.t).getUTCDay() === 1;
}
