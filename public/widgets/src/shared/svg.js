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
   carry. Ids are document-global in HTML and component-gallery draws four
   charts on one page, so they are counted rather than named. */
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

/* The y for one value on the same scale — the goal/target line's y1 and y2. */
function chY(v, yMin, yMax) {
    var h = CH_H - CH_PT - CH_PB;
    return CH_PT + h - ((v - yMin) / (yMax - yMin || 1)) * h;
}
