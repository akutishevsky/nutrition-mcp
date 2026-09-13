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
function chF(v) {
    return (+v).toFixed(1);
}

/* ---- THE CURVE ----------------------------------------------------------
   Every chart line is ONE primitive: a monotone cubic (Fritsch–Carlson)
   through the exact readings. chPath, chArea and the sparkline's runs
   (sparkMarkup, shared/spark.js) all draw through chCurve; there is no second
   curve in the widgets, and there must not be one.

   Why this curve and not a softer one. It passes through every reading, and
   between two readings it never goes above the higher or below the lower: it
   draws no peak, trough or dip under the floor that nobody logged, and a
   segment whose two readings sit on the same side of the goal never crosses
   the goal. A Catmull-Rom or cardinal spline rounds its shoulders a little
   more and pays for it with overshoot — values between days that no day had.
   At 48–52px the difference in softness is not visible; the overshoot is
   measurable. The printed figures, the goal state and the over-goal red are
   decided elsewhere from real values and never read this geometry.

   Tangents for one run of [x, y] points, x strictly increasing: a
   spacing-weighted three-point slope, zeroed at every local extremum and flat
   stretch, then each interval's pair clamped to alpha^2 + beta^2 <= 9 — the
   condition under which the Hermite cubic is monotone on that interval. Each
   slope is divided by its own interval's width, so uneven calendar spacing (a
   bridged weight chart, a run that spans a gap on the trend) is handled. */
function chTangents(p) {
    var n = p.length,
        h = [],
        d = [],
        m = [],
        i,
        a,
        b,
        s;
    for (i = 0; i < n - 1; i++) {
        h.push(p[i + 1][0] - p[i][0]);
        d.push(h[i] ? (p[i + 1][1] - p[i][1]) / h[i] : 0);
    }
    for (i = 0; i < n; i++) {
        if (i === 0) m.push(d[0]);
        else if (i === n - 1) m.push(d[n - 2]);
        else if (d[i - 1] * d[i] <= 0) m.push(0);
        else m.push((h[i] * d[i - 1] + h[i - 1] * d[i]) / (h[i - 1] + h[i]));
    }
    for (i = 0; i < n - 1; i++) {
        if (d[i] === 0) {
            m[i] = 0;
            m[i + 1] = 0;
            continue;
        }
        a = m[i] / d[i];
        b = m[i + 1] / d[i];
        if (a < 0) m[i] = a = 0;
        if (b < 0) m[i + 1] = b = 0;
        s = a * a + b * b;
        if (s > 9) {
            s = 3 / Math.sqrt(s);
            m[i] = s * a * d[i];
            m[i + 1] = s * b * d[i];
        }
    }
    return m;
}

/* The segments of one run WITHOUT its leading M, so a line and its wash share
   them. Each Hermite piece as its Bezier: controls a third of the way along
   each end's tangent.

   THE CLAMP AFTER ROUNDING is what makes the guarantee survive the one-decimal
   output. Every control y is clamped, once rounded, between its two readings'
   rounded y; a Bezier lies inside the hull of its four points, so the drawn
   piece provably cannot leave the band its two readings span, however the
   0.1-unit rounding fell. The cost is a tangent kink of at most a few degrees
   on dense data, which no one can see — do not write a strict C1 test.

   A run of two is a straight L: the monotone cubic between two points is that
   line anyway, and an L is a fifth of the bytes. */
function chCurveSegs(p) {
    var n = p.length,
        s = "",
        m,
        i,
        h,
        y0,
        y1,
        lo,
        hi,
        c1,
        c2;
    if (n < 2) return "";
    if (n === 2) return "L" + chF(p[1][0]) + " " + chF(p[1][1]);
    m = chTangents(p);
    for (i = 0; i < n - 1; i++) {
        h = (p[i + 1][0] - p[i][0]) / 3;
        y0 = +chF(p[i][1]);
        y1 = +chF(p[i + 1][1]);
        lo = Math.min(y0, y1);
        hi = Math.max(y0, y1);
        c1 = Math.min(hi, Math.max(lo, +chF(p[i][1] + m[i] * h)));
        c2 = Math.min(hi, Math.max(lo, +chF(p[i + 1][1] - m[i + 1] * h)));
        s +=
            "C" +
            chF(p[i][0] + h) +
            " " +
            c1.toFixed(1) +
            " " +
            chF(p[i + 1][0] - h) +
            " " +
            c2.toFixed(1) +
            " " +
            chF(p[i + 1][0]) +
            " " +
            chF(p[i + 1][1]);
    }
    return s;
}

/* One run as one subpath: M, then its curve. A run of one is a bare M, which
   paints nothing — a caller that wants a lone reading SEEN marks it
   (chMarksMarkup) rather than drawing it. */
function chCurve(p) {
    return p.length
        ? "M" + chF(p[0][0]) + " " + chF(p[0][1]) + chCurveSegs(p)
        : "";
}

/* A series with no gaps — every point a reading — as one curve. weight-trends
   passes only its readings, so each bridge over unweighed days is one smooth
   piece from mark to mark. */
function chPath(pts) {
    return chCurve(pts);
}

/* The same series closed down to CH_BASE, for the wash under the line.
   ZERO-BASED charts only — see the .carea comment in chart.css for why a
   data-scaled chart must never call this.

   Reads a null entry as a gap exactly as the callers' own line paths do, so a
   day nobody logged stays unfilled instead of the wash bridging it. Each run of
   readings closes into its own subpath, and its top edge is the line's own
   curve (chCurve), so the wash never parts from the stroke. A run of ONE point
   closes to zero width and paints nothing, which is right: there is no span
   under a single reading, and the sparkline draws that reading as a mark
   instead (chMarksMarkup). */
function chArea(pts) {
    var d = "",
        run = [],
        i;
    function flush() {
        if (run.length > 1) {
            d +=
                chCurve(run) +
                "L" +
                chF(run[run.length - 1][0]) +
                " " +
                CH_BASE +
                "L" +
                chF(run[0][0]) +
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
   chDotMarkup, so the last reading's halo and larger dot sit over its mark.

   The focus panel's sparkline (sparkMarkup, shared/spark.js) calls this with
   only its LONE readings. Its line breaks at a gap rather than bridging it, so
   a reading with a gap on each side has no segment to sit on, and drawn as a
   zero-length piece of the 2.5px line it was a speck. */
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

/* The same marks as ONE `d` of zero-length subpaths, for a TRANSLUCENT layer:
   the sparkline's lone readings past CH_DAILY_SLOTS (`.cpt.dense`, chart.css).
   Separate translucent paths composite one over another, so marks closer than
   their own width stacked into a darker band wherever logging was densest;
   one path is stroked as one shape, a single tint however its round caps
   overlap. Nulls draw nothing, as in chMarksMarkup. */
function chMarksD(pts) {
    var d = "",
        i;
    for (i = 0; i < pts.length; i++) {
        if (pts[i]) d += chDot(pts[i][0], pts[i][1]);
    }
    return d;
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
/* The longest window still drawn a day at a time: a rule on every day here,
   and a full-size `.cpt` on a lone reading in the sparkline (sparkMarkup).
   Past it a slot is too narrow for either. `var` for CH_GRAD_N's reason. */
var CH_DAILY_SLOTS = 31;

function hairlineSlot(slot, i, n) {
    if (n <= CH_DAILY_SLOTS) return true;
    if (n > 120) return false;
    return slot.t === null ? i % 7 === 0 : new Date(slot.t).getUTCDay() === 1;
}

/* ---- THE LONG-RANGE TREND -----------------------------------------------
   Past CH_DAILY_SLOTS a day is under a pixel or two wide (~2.4px at 90 days
   in a 320px card, ~0.6px at 365), and the exact curve through daily readings
   is a scribble: every weekday/weekend swing drawn at full height, side by
   side. There, and ONLY there, the sparkline adds a second, calmer layer over
   the real one — a rolling mean of the readings, curved with the same chCurve.
   It is gated on the SAME threshold hairlineSlot and `.cpt.dense` use, not a
   second one: a 7/14/30-day chart never gets it, because at those widths
   every day is legible and the exact line is the whole chart.

   What it is honest about, and what it is not. It is an AVERAGE, so it does
   not show any single day, the last one included. The last-reading dot stays
   on the real latest value — sparkMarkup places it from the readings, never
   from this — so on a day that departs from the average the dot sits off the
   trend's end, which is exactly what that day did. The day-by-day layer stays
   drawn underneath as a texture (`.cwrap.long .cline`, chart.css, which says
   why it is not held to 3:1). The trend never feeds the figure, the goal
   state or the over-goal red, all decided from real values upstream.

   The half-width in CALENDAR days: ±3 (a week, the window that cancels the
   weekday/weekend eating cycle) up to four months, ±7 (a fortnight) beyond,
   where a week is still only a few pixels and reads as texture. */
function chTrendHalf(n) {
    return n <= 120 ? 3 : 7;
}

/* Runs of READINGS as slot indices, split wherever more than `maxGap`
   consecutive slots have no reading. The trend passes chTrendHalf(n) as the
   gap, so it BRIDGES a gap of at most k days and breaks at a longer one: an
   every-other-day year is one calm trend instead of 183 runs of one, which is
   the case a long range most needs smoothing for, while a real lapse in
   logging (longer than half the window) still shows as a break. The real
   layer beneath never bridges anything — it breaks at every unlogged day, at
   every range — so the gap is always still on screen. A missing day never
   enters a mean, as 0 or as anything else (#78). */
function chRuns(vals, maxGap) {
    var runs = [],
        run = [],
        prev = -1,
        i;
    for (i = 0; i < vals.length; i++) {
        if (vals[i] === null) continue;
        if (run.length && i - prev - 1 > maxGap) {
            runs.push(run);
            run = [];
        }
        run.push(i);
        prev = i;
    }
    if (run.length) runs.push(run);
    return runs;
}

/* A mean over the readings within ±k calendar days of slot i, never across a
   run boundary: the window is [max(start, i − k), min(end, i + k)].

   CLIPPED, NOT SHRUNK, AT A RUN'S ENDS. Inside a run the window is centred;
   near an end it loses the side that is not there and keeps the other, so a
   run's last slot is the mean of its last k + 1 days, not that one day. It
   used to shrink symmetrically, min(k, i − start, end − i), which kept the
   window centred but made every run's first and last node a single raw
   reading: an unfinished "today" of 800 kcal after a steady year at 2,000
   pulled the trend's heaviest stroke 15px down across its last 3px, and read
   as "my average collapsed" when the ±7-day mean was 1,843. Clipped, one day
   moves the end by at most 1/(k + 1) of its departure — a quarter on a
   quarter, an eighth on a year. The price is lag at the ends: the last k days
   average more past than future, so a change of habit arrives there
   gradually. Nothing is hidden by that: the real day is still the dot and the
   texture under the trend.
   Returns one entry per slot, null outside every run. */
function chRolling(vals, k, runs) {
    var out = vals.map(function () {
            return null;
        }),
        r,
        run,
        s,
        e,
        q,
        i,
        j,
        sum,
        c;
    for (r = 0; r < runs.length; r++) {
        run = runs[r];
        s = run[0];
        e = run[run.length - 1];
        for (q = 0; q < run.length; q++) {
            i = run[q];
            sum = 0;
            c = 0;
            for (j = Math.max(s, i - k); j <= Math.min(e, i + k); j++) {
                if (vals[j] !== null) {
                    sum += vals[j];
                    c++;
                }
            }
            out[i] = sum / c;
        }
    }
    return out;
}

/* The trend's `d` for one series, or "" when the range is not long. `vals`
   is one value or null per slot, `pts` the slots' [x, y] from chPoints (only
   the x is read), `yMin`/`yMax` the chart's own domain, so the trend sits on
   exactly the real layer's scale. Nodes sit only on READING slots, never on a
   gap slot: across a bridged gap the curve simply joins its two neighbours. A
   run of one draws nothing (its reading is a `.cpt.dense` mark already).

   NOT A NODE PER READING. A mean over 2k+1 days has nothing left to say at
   a one-day step, so a node goes down at most every ceil(k/2) calendar days
   (2 on a quarter, 4 on a year) — plus both ends of every run, always, so the
   trend spans its run's full width. chCurve through the thinned means is
   indistinguishable at card size, and a year's trend is a quarter of the
   bytes: the markup is rendered into the landing page at build time. */
function chTrend(vals, pts, yMin, yMax) {
    var n = vals.length,
        k,
        stride,
        runs,
        mean,
        d = "",
        r,
        q,
        run,
        keep,
        prev;
    if (n <= CH_DAILY_SLOTS) return "";
    k = chTrendHalf(n);
    stride = Math.ceil(k / 2);
    runs = chRuns(vals, k);
    mean = chRolling(vals, k, runs);
    for (r = 0; r < runs.length; r++) {
        run = runs[r];
        if (run.length < 2) continue;
        keep = [];
        prev = -Infinity;
        for (q = 0; q < run.length; q++) {
            if (q === run.length - 1 || run[q] - prev >= stride) {
                keep.push([pts[run[q]][0], chY(mean[run[q]], yMin, yMax)]);
                prev = run[q];
            }
        }
        d += chCurve(keep);
    }
    return d;
}
