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
   Two reasons, and the first is measured: a series token is weak as ink in
   light mode (--cal 2.06:1 against the tile, --sug 1.98, --car 2.54), so a
   1.75px stroke in one of them at 13px is barely there. A filled silhouette
   carries the same ink density as the 6px dot it replaces. The second is
   register: the stroked set is UI affordance (chevron, close, notice), and
   these are content — keeping the two visually distinct is the point, not an
   accident.

   Drawn on the same 16-unit box, and chosen for what survives at 13px rather
   than for what looks best at 48. That distinction cost a whole draft: the
   first pass gave calories a flame, water a droplet and fiber a leaf, and at
   13px all three collapsed into the same teardrop, while protein-as-drumstick
   read as a lollipop and carbs-as-bread-slice as a rounded blob. Only a
   silhouette with a HOLE, a NOTCH or a PROTRUSION stays legible that small:

     flame      a side tongue, so it is not the droplet
     drumstick  a thin diagonal shaft — nothing else in the set has one
     bowl       wide and flat-bottomed, the only horizontal shape here
     avocado    a hole (evenodd), reads as a ring
     droplet    owns the teardrop, which is why nothing else may be one
     cube       the only square
     glass      stem and foot
     cup        a handle (evenodd)
     leaf       a stem protruding past the blade

   They are DECORATIVE: every tile names its metric in words beside the glyph,
   so this adds a shape channel to a card that otherwise separates its metrics
   by hue alone — which is the accessibility win — without becoming information
   that has to carry 3:1 on its own. */
var GLYPHS = {
    flame: {
        d: "M9.1 1.1c.5 2.3-.6 3.8-1.8 5.1C6 7.6 4.9 8.9 4.9 10.5a4.3 4.3 0 0 0 8.6 0c0-2.1-1.2-3.4-2.2-4.6-.7-.8-1.1-1.7-1.1-2.6 0-.8-.4-1.5-1.1-2.2z M5.3 6.8C4.1 7.8 3 9 3 10.6c0 1 .3 1.9.9 2.6C2.3 12.5 1.3 11 1.3 9.2c0-1.4.6-2.7 1.6-3.6.6.6 1.5 1 2.4 1.2z",
    },
    drumstick: {
        d: "M13 3a3.8 3.8 0 0 0-6.5 2.7c0 .5.1 1 .3 1.5L4.2 9.9a2 2 0 0 0-2.3 2.9 2 2 0 0 0 1.5.7 2 2 0 0 0 .7 1.5 2 2 0 0 0 2.9-2.3l2.8-2.6c.5.2 1 .3 1.5.3A3.8 3.8 0 0 0 13 3z",
    },
    bowl: {
        d: "M2.2 7.4h11.6a5.8 5.8 0 0 1-11.6 0z M4.9 6.6a3.1 3.1 0 0 1 6.2 0z",
    },
    avocado: {
        d: "M8 1.7c2.6 0 4.7 3.3 4.7 6.5A4.7 4.7 0 0 1 8 14.4a4.7 4.7 0 0 1-4.7-6.2C3.3 5 5.4 1.7 8 1.7zM8 6.3a2.1 2.1 0 1 0 0 4.2 2.1 2.1 0 0 0 0-4.2z",
        evenodd: true,
    },
    droplet: {
        d: "M8 1.6c2.9 3.5 4.6 5.9 4.6 7.9a4.6 4.6 0 0 1-9.2 0c0-2 1.7-4.4 4.6-7.9z",
    },
    cube: {
        d: "M4.9 3h6.2A1.9 1.9 0 0 1 13 4.9v6.2A1.9 1.9 0 0 1 11.1 13H4.9A1.9 1.9 0 0 1 3 11.1V4.9A1.9 1.9 0 0 1 4.9 3z",
    },
    glass: {
        d: "M4.6 2h6.8l-.5 4.3a3 3 0 0 1-2.2 2.5v3.8h2.1V14H5.2v-1.4h2.1V8.8a3 3 0 0 1-2.2-2.5z",
    },
    cup: {
        d: "M2.8 4.1h8.1v1.3h1.3a2.2 2.2 0 0 1 0 4.4h-.4a4.2 4.2 0 0 1-9-2.4zm8.1 2.6v1.8h1.3a.9.9 0 0 0 0-1.8z",
        evenodd: true,
    },
    leaf: {
        d: "M13.7 2.3c-5.9-.6-10 1.8-10.6 5.9-.4 2.6 1.1 4.7 3.6 5.1 4.1.6 7.6-4.1 7-11z M1.9 14.6l-1-.9 4.7-5.1 1 .9z",
    },
};

/* Same contract as icon(): a string, aria-hidden, sized by the caller. `.gi`
   (base.css) fills with currentColor, so a role class on an ancestor colours it
   exactly as it coloured the dot it replaces. */
function glyph(name, size) {
    var g = GLYPHS[name];
    if (!g) return "";
    var s = size || 13;
    return (
        '<svg class="gi" width="' +
        s +
        '" height="' +
        s +
        '" viewBox="0 0 16 16" aria-hidden="true"><path d="' +
        g.d +
        '"' +
        (g.evenodd ? ' fill-rule="evenodd"' : "") +
        "/></svg>"
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
