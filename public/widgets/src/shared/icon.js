/* Icons as a path table plus a string builder — not an svg sprite, and not
   emoji for everything.

   No sprite because a <symbol> block would have to live outside #root (every
   render() replaces #root.innerHTML wholesale), so templates would own DOM in
   two places instead of one, and <use href="#x"> fragment resolution has enough
   host-dependent edge cases inside a sandboxed opaque-origin iframe that a
   silently blank icon is a real risk. Nine paths is ~400 bytes; the plumbing
   would cost more than the duplication.

   Every path is drawn on the same 16-unit box and scaled by width/height, so a
   9px chevron and a 16px warning triangle are one drawing at two sizes. Stroke
   is currentColor and fill is none (see .ic in base.css), which is what lets an
   icon follow the theme, the inverted chip and the --c role class for free. */
var ICONS = {
    chev: "M4 6.5l4 4 4-4",
    x: "M4.5 4.5l7 7M11.5 4.5l-7 7",
    check: "M3.5 8.4l3 3 6-6",
    warn: "M8 2.2l6 10.6H2zM8 6.4v3.3M8 11.3v.9",
    info: "M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12M8 7.4v4M8 4.9v.9",
    up: "M8 12.6V3.6M4.4 7.2L8 3.6l3.6 3.6",
    down: "M8 3.4v9M4.4 8.8L8 12.4l3.6-3.6",
    file: "M9 2H4.5A1.5 1.5 0 0 0 3 3.5v9A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V6zM9 2v4h4",
    point: "M6.5 8V4.2a1.3 1.3 0 0 1 2.6 0v6.4l1.6-1.4a1.2 1.2 0 0 1 1.7 1.7l-2.6 3a2 2 0 0 1-1.5.7H7a2 2 0 0 1-1.9-1.4l-1-3.2a1.2 1.2 0 0 1 1.7-1.4z",
};

/* NUTRIENT GLYPHS — a second table, and FILLED where ICONS above are stroked.
   The stroked set is UI affordance (chevron, close, notice); these are
   content, and keeping the two registers visually distinct is the point, not
   an accident.

   TWO LAYERS PER DRAWING, painted the object's own colours. Each entry is a
   base `a` — the silhouette — and a detail `b` painted after it, which sits
   inside the base in every drawing: inner flame, bone and glaze, crumb, pit,
   highlight, cube faces, wine, coffee, vein, dial. The colours are tokens
   (tokens.css, --gl-<name>-a/-b), applied by class in base.css, never written
   here. They used to be one path filled with the metric's series token, which
   painted the fat tile's avocado pink and the protein tile's drumstick
   violet: a series token is an identity, not the colour of a food, so it
   stays on what encodes a quantity or a state (the wash, the ring, the focus
   panel, the sparkline, the over-limit red) and the drawing is simply the
   object.

   EVERY DETAIL IS CUT OUT OF ITS BASE, with a gutter of 0.6 units (0.56 at
   the tightest rounded corner, where a round-join offset is sampled) between
   the hole and the detail inside it. On a light ground that gutter reads as
   part of a light detail; on a dark one it is a dark keyline. What it buys is
   that the drawing still separates when both layers are painted one colour —
   a monochrome use such as a single-ink fill: the pit, the dial, the bone,
   the crumb, the cube faces, the wine and the coffee all survive, where an
   uncut detail would merge into a plain egg, slab or hexagon. (Chrome's
   forced-colours mode is not that case: it keeps an SVG's authored fills.)

   Two details bend the rule for 1x, where a gutter on both sides of a thin
   part puts three sub-pixel stripes inside two pixels. The scale's needle has
   no gutter: it is a wedge of the slab reaching into the dial, so it keeps
   its mass (in one colour it merges into the dial, and the dial survives).
   The leaf's vein keeps its gutter on ONE side, so the band is one line, not
   a hatched stripe, and that gutter is the vein's edge when the drawing is
   one colour. The drumstick's glaze does NOT bend it: a long thin arc cut on
   both sides read as a grey eyelid in dark, and a one-sided crescent left a
   shadow line under the cream, so the glaze is a short streak 1.4 units wide
   along the upper-left rim, cut out with the full gutter all round, wide
   enough that its keylines fall either side of a real cream band. A detail
   that overlaps its base instead of meeting it, as the vein does on its
   other side and the dial does around the needle, has its edge over the
   base, not the ground, and leaves no seam.

   Two rules keep a cut honest. Paths fill NONZERO, so solids wind clockwise
   and holes counter-clockwise — and a hole must sit under exactly one solid,
   or the overlapping solids stack their winding and the hole fails to cut
   (which is why the bone and its hole are each one dog-bone outline, not a
   capsule plus two circles). And a detail never shares an edge with its
   base: two antialiased edges that meet exactly leave a seam of ground
   between them.

   Drawn on the same 16-unit box, for 17px and up, the smallest size anything
   ships at, and checked there at 1x as well as 2x. At 13px the gutter and the
   thinnest parts (the bone core, the vein, the cube fold) fall under a pixel,
   so a silhouette with a HOLE, a NOTCH or a PROTRUSION is still what tells
   two drawings apart at a glance: the flame's two tips (a lick and a tongue
   leaning right), the drumstick's taper into a two-knob bone, the bread's
   lobes over a waist, the avocado's pit, the teardrop only the droplet may
   use, the cube's hexagon, the glass's stem, the cup's handle, the leaf's
   stem and the scale's dial. The flame's orange band under its inner flame
   is 1.35 units, a pixel and a third at 17px.

   They are DECORATIVE: every tile names its metric in words beside the glyph,
   so a glyph adds a shape channel without becoming information that has to
   carry 3:1 on its own. Every light base clears 3:1 on --panel and --bg2, but
   not every one on a selected tile under its full wash (the numbers are in
   tokens.css). */
var GLYPHS = {
    // a campfire flame: a lick on the left, a tongue leaning right on an S, a
    // round belly; the detail is a smaller flame with its own tip, not a drop
    flame: {
        a: {
            d: "M8 15.3C4.85 15.3 2.3 13 2.3 10C2.3 7.6 3 5.6 3.95 3.6C4.45 5.1 5.1 6.1 6.1 6.75C5.8 4.2 7.4 2.2 10.1 0.45C9.85 2.3 10.55 3.55 11.55 4.95C12.8 6.45 13.7 8 13.7 10C13.7 13 11.15 15.3 8 15.3zM10.17 13.13C10.67 12.64 11.02 11.85 11.02 11.11C11.02 8.87 9.96 7.19 8.76 6.33C8.6 6.23 8.41 6.2 8.23 6.26C8.06 6.32 7.92 6.45 7.85 6.63C7.65 7.19 7.5 7.64 7.16 8.23C6.24 8.95 5.1 9.74 5.1 11.11C5.1 11.85 5.45 12.64 5.95 13.13C6.45 13.61 7.26 13.95 8.06 13.95C8.86 13.95 9.67 13.61 10.17 13.13z",
        },
        b: {
            d: "M8.06 13.35C6.7 13.35 5.7 12.35 5.7 11.11C5.7 9.99 6.66 9.39 7.62 8.63C8.02 7.95 8.22 7.39 8.42 6.83C9.54 7.59 10.42 9.03 10.42 11.11C10.42 12.35 9.42 13.35 8.06 13.35z",
        },
    },
    // a roast leg tapering into a two-knob bone (one dog-bone hole under the
    // one solid), and a short glaze streak along the upper-left rim, cut out
    // with the full gutter
    drumstick: {
        a: {
            d: "M10.47 1.52C12.59 1.72 14.28 3.41 14.48 5.53C14.68 7.66 13.34 9.63 11.28 10.23L7.52 11.31L6.29 12.54C6.37 12.76 6.41 13 6.41 13.25C6.41 14.5 5.39 15.52 4.14 15.52C3.15 15.52 2.31 14.89 2 14C1.11 13.69 0.48 12.85 0.48 11.86C0.48 10.61 1.5 9.59 2.75 9.59C3 9.59 3.24 9.63 3.46 9.71L4.69 8.48L5.77 4.72C6.37 2.66 8.34 1.32 10.47 1.52zM6.04 11.59C5.63 11.54 5.24 11.36 4.94 11.06C4.64 10.76 4.46 10.37 4.41 9.96L3.63 10.75C3.39 10.56 3.08 10.44 2.75 10.44C1.97 10.44 1.33 11.08 1.33 11.86C1.33 12.64 1.95 13.26 2.72 13.28C2.74 14.05 3.36 14.67 4.14 14.67C4.92 14.67 5.56 14.03 5.56 13.25C5.56 12.92 5.44 12.61 5.25 12.37zM6.57 5.66C6.69 5.92 7.01 6.23 7.3 6.34C7.6 6.44 8.04 6.41 8.3 6.29C8.56 6.17 8.84 5.85 8.97 5.56C9.1 5.08 9.39 4.84 9.89 4.81C10.19 4.74 10.57 4.52 10.74 4.3C10.9 4.07 11.02 3.66 10.98 3.35C10.93 3.04 10.71 2.67 10.49 2.5C10.26 2.33 9.85 2.23 9.54 2.24C8.24 2.46 7.02 3.44 6.52 4.67C6.44 4.98 6.45 5.41 6.57 5.66z",
        },
        b: {
            d: "M4.33 12.45C4.69 12.54 4.96 12.86 4.96 13.25C4.96 13.7 4.59 14.07 4.14 14.07C3.68 14.07 3.32 13.7 3.32 13.25C3.32 13.15 3.33 13.06 3.37 12.97C3.29 12.94 3.22 12.9 3.16 12.84C3.1 12.78 3.06 12.71 3.03 12.63C2.94 12.67 2.85 12.68 2.75 12.68C2.3 12.68 1.93 12.32 1.93 11.86C1.93 11.41 2.3 11.04 2.75 11.04C3.14 11.04 3.46 11.31 3.55 11.67L4.17 11.05C4.27 11.2 4.39 11.35 4.52 11.48C4.65 11.61 4.8 11.73 4.95 11.83zM7.09 4.88C7.49 3.78 8.46 2.99 9.61 2.83C9.99 2.79 10.33 3.06 10.38 3.43C10.43 3.81 10.18 4.16 9.8 4.22C9.16 4.31 8.63 4.75 8.4 5.35C8.27 5.72 7.87 5.9 7.51 5.77C7.14 5.64 6.96 5.24 7.09 4.88z",
        },
    },
    // a slice of toast: two lobes over a waist, the crumb cut out of the crust
    bread: {
        a: {
            d: "M4.8 1.8H11.2A3.6 3.6 0 0 1 12.8 8.62V13.2A1.3 1.3 0 0 1 11.5 14.5H4.5A1.3 1.3 0 0 1 3.2 13.2V8.62A3.6 3.6 0 0 1 4.8 1.8zM4.8 3.05A2.35 2.35 0 0 0 4.45 7.72V12.9A0.35 0.35 0 0 0 4.8 13.25H11.2A0.35 0.35 0 0 0 11.55 12.9V7.72A2.35 2.35 0 0 0 11.2 3.05z",
        },
        b: {
            d: "M4.8 3.65H11.2A1.75 1.75 0 1 1 10.95 7.13V12.3A0.35 0.35 0 0 1 10.6 12.65H5.4A0.35 0.35 0 0 1 5.05 12.3V7.13A1.75 1.75 0 1 1 4.8 3.65z",
        },
    },
    // the pit, in the hole that made the old one-colour avocado a ring
    avocado: {
        a: {
            d: "M8 1.4c2.7 0 4.9 3.4 4.9 6.8A4.9 4.9 0 0 1 8 14.6a4.9 4.9 0 0 1-4.9-6.4C3.1 4.8 5.3 1.4 8 1.4zM5.2 9.7A2.8 2.8 0 1 0 10.8 9.7A2.8 2.8 0 1 0 5.2 9.7z",
        },
        b: { d: "M5.8 9.7A2.2 2.2 0 1 1 10.2 9.7A2.2 2.2 0 1 1 5.8 9.7z" },
    },
    // a highlight band along the lower left
    droplet: {
        a: {
            d: "M8 1.2c3 3.6 4.8 6.1 4.8 8.3a4.8 4.8 0 0 1-9.6 0c0-2.2 1.8-4.7 4.8-8.3zM7.33 13.29A1.1 1.1 0 0 0 7.71 11.12A1.65 1.65 0 0 1 6.36 9.64A1.1 1.1 0 0 0 4.16 9.84A3.85 3.85 0 0 0 7.33 13.29z",
        },
        b: {
            d: "M7.44 12.7A3.25 3.25 0 0 1 4.76 9.78A.5 .5 0 0 1 5.76 9.7A2.25 2.25 0 0 0 7.61 11.72A.5 .5 0 0 1 7.44 12.7z",
        },
    },
    // cream top and left faces cut out of a tan hexagon; the rest is the shade face
    cube: {
        a: {
            d: "M8 1.2L14.2 4.75L14.2 11.25L8 14.8L1.8 11.25L1.8 4.75zM3.06 4.95L8 7.78L12.94 4.95L8 2.12zM2.6 10.79L7.55 13.62L7.55 8.56L2.6 5.73z",
        },
        b: {
            d: "M8 2.81L11.73 4.95L8 7.09L4.27 4.95zM3.2 6.76L6.95 8.91L6.95 12.59L3.2 10.44z",
        },
    },
    // wine cut out of the glass's lower half; stem and foot stay base
    glass: {
        a: {
            d: "M4 1.4H12V5.4A4 4 0 0 1 4 5.4zM7.25 8.8L8.75 8.8L8.75 12.9L7.25 12.9zM5.3 12.8L10.7 12.8A.8 .8 0 0 1 10.7 14.4L5.3 14.4A.8 .8 0 0 1 5.3 12.8zM4.95 4.3V5.4A3.05 3.05 0 0 0 11.05 5.4V4.3z",
        },
        b: { d: "M5.55 4.9H10.45V5.4A2.45 2.45 0 0 1 5.55 5.4z" },
    },
    // coffee cut out below the rim; the handle is a C that never enters the body
    cup: {
        a: {
            d: "M1.4 3.2H11.4V9.2A3.6 3.6 0 0 1 7.8 12.8H5A3.6 3.6 0 0 1 1.4 9.2zM11 4.8A2.6 2.6 0 1 1 11 9.8L11 8.34A1.25 1.25 0 1 0 11 6.26zM3.95 6.95L8.85 6.95A1.45 1.45 0 0 0 8.85 4.05L3.95 4.05A1.45 1.45 0 0 0 3.95 6.95z",
        },
        b: {
            d: "M3.95 4.65L8.85 4.65A.85 .85 0 0 1 8.85 6.35L3.95 6.35A.85 .85 0 0 1 3.95 4.65z",
        },
    },
    // a vein along the blade, its gutter on the lower side only: a gutter on
    // both sides aliased into hatching on the diagonal at 1x
    leaf: {
        a: {
            d: "M4.2 11.8C2.6 7 7.6 2 14 2c0 6.4-5 11.4-9.8 9.8zM4.8 12.3 1.9 15.1 1.1 14.3 4 11.5zM6.39 10.59L11.89 5.09A0.6 0.6 0 0 0 11.05 4.25L5.55 9.75A0.6 0.6 0 0 0 6.39 10.59z",
        },
        b: {
            d: "M5.33 9.53L10.83 4.03A0.45 0.45 0 0 1 11.47 4.67L5.97 10.17A0.45 0.45 0 0 1 5.33 9.53z",
        },
    },
    // a dial cut out of the slab; the needle is a wedge of the slab reaching
    // into it, with no gutter of its own, so it keeps its mass at 1x
    scale: {
        a: {
            d: "M4.6 3h6.8A2.6 2.6 0 0 1 14 5.6v5A2.6 2.6 0 0 1 11.4 13.2H4.6A2.6 2.6 0 0 1 2 10.6v-5A2.6 2.6 0 0 1 4.6 3zM4.1 9.2L5.64 9.2L9.01 5.68L10.46 6.74L9.14 9.2L11.9 9.2V8.6A3.9 3.9 0 0 0 4.1 8.6z",
        },
        b: {
            d: "M4.7 8.6A3.3 3.3 0 0 1 11.3 8.6L9.06 8.6L9.97 6.82L9.08 6.17L6.68 8.6z",
        },
    },
};

/* Same contract as icon(): a string, aria-hidden, sized by the caller — 17px
   by default, the limit tile's size, because nothing ships smaller and the
   details only hold from there. It writes one class per drawing (`gi-<name>`)
   and a class per layer, and no colour: base.css maps the classes onto the
   tokens. The base comes first because the detail paints over its hole. */
function glyph(name, size) {
    var g = GLYPHS[name];
    if (!g) return "";
    var s = size || 17;
    var layer = function (cls, l) {
        return '<path class="' + cls + '" d="' + l.d + '"/>';
    };
    return (
        '<svg class="gi gi-' +
        name +
        '" width="' +
        s +
        '" height="' +
        s +
        '" viewBox="0 0 16 16" aria-hidden="true">' +
        layer("ga", g.a) +
        layer("gb", g.b) +
        "</svg>"
    );
}

/* aria-hidden on every icon: an icon here is always inside a control whose own
   aria-label already says the thing, so announcing it again is noise. */
function icon(name, size) {
    var s = size || 14;
    return (
        '<svg class="ic' +
        (s <= 12 ? " ic-sm" : "") +
        '" width="' +
        s +
        '" height="' +
        s +
        '" viewBox="0 0 16 16" aria-hidden="true"><path d="' +
        ICONS[name] +
        '"/></svg>'
    );
}
