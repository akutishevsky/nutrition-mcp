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
