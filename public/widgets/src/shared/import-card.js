/* The import widget's card shell and its first step, as pure string emitters.

   IT LIVES HERE, not in the template, for one reason: the public site's landing
   page shows the importer's FIRST STEP as a still picture of what appears in
   chat, rendered at BUILD TIME by evaluating the template's partials with no
   DOM (src/widget-static.ts). A hand-copied drop zone would be a second
   implementation of the card, and it would drift.

   templates/import-meals.html keeps its own names — esc, notice, cardOpen,
   cardHead, cardClose, fileStep — as one-line wrappers over these, so every
   step function and every test that reaches for those names is unchanged. The
   state they used to read (S.step, S.errors, CFG, API, SUPPORT_EMAIL) is passed
   in as arguments here instead.

   Static only: the landing page's runtime bundle never includes this partial
   (the picture's controls are inert), and nothing here touches the DOM.

   INCLUDE ORDER. After shared/i18n.js (T, tpl) and shared/icon.js (icon). */

// HTML escaping for text going into markup or an attribute. The importer's own
// variant, deliberately not shared/fmt.js's: it also maps null to "" and
// escapes "'", and every step of this widget has always been written with it.
function impEsc(s) {
    return String(s == null ? "" : s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Every notice is the same object: a leading mark naming the
// severity by SHAPE, then the message. The shape is what carries
// it — the tint alone would leave "warning" and "error" identical
// to anyone who cannot separate the two hues. `glyph` overrides the
// drawn icon with a character, used only for the envelope, which
// the shared nine-icon set has no path for.
function impNotice(kind, bodyHtml, glyph) {
    // aria-hidden: the envelope is decoration beside a sentence
    // that already says "email"; read aloud it is a stray symbol
    // name. The drawn icons are aria-hidden by icon() itself.
    const mark = glyph
        ? '<span class="nico" aria-hidden="true">' + glyph + "</span>"
        : icon({ warn: "warn", error: "x", ok: "check" }[kind] || "info", 15);
    return (
        '<div class="notice' +
        (kind ? " notice-" + kind : "") +
        '">' +
        mark +
        "<span>" +
        bodyHtml +
        "</span></div>"
    );
}

// Every step is one Dawn card, built the way every other widget's
// is: the card with its glow, a .chead header line, then the body,
// then the foot the bridge's settings note lands in. The card is
// c-acc because a form has no nutrient to be tinted by — the glow
// is the brand green, like the primary button under it.
function impCardOpen() {
    return '<section class="card c-acc"><div class="glow"></div>';
}

// The header line plus the step rail under it, for the step named `step`
// ("file" | "map" | "preview" | "done").
//
// The title names the step, so the mono .cmeta carries only the
// count ("Step 2 of 4"): the old caption, "Step 2 of 4 · Map
// columns", repeated the heading word for word on the map step in
// all nine locales once the two shared a line.
//
// The h1 is the focus target when the step changes (keepFocus's
// [data-focus-fallback]): tabindex="-1" makes it focusable by
// script only, and base.css draws no ring on it, since a ring
// round a heading reads as something to press. Its screen-reader
// announcement IS the step change.
//
// The rail — a 3px track in place of the four numbered pills that
// used to be here, which cost ~26px and overflowed 320px in every
// locale with a word longer than "Preview" — is aria-hidden: the
// count beside the title already says what it draws.
function impCardHead(title, step) {
    const order = ["file", "map", "preview", "done"];
    // Guard the -1: render() only ever passes one of the four, but
    // a width of -0% and "step 0 of 4" is a nasty way to find out.
    const at = Math.max(0, order.indexOf(step));
    return (
        '<header class="chead"><h1 class="ctitle" id="imp-title" tabindex="-1" data-focus-fallback>' +
        impEsc(title) +
        '</h1><span class="cmeta">' +
        impEsc(
            tpl(T.importMeals.stepCount, {
                n: at + 1,
                total: order.length,
            }),
        ) +
        '</span></header><div class="steps" aria-hidden="true"><span style="width:' +
        Math.round(((at + 1) / order.length) * 100) +
        '%"></span></div>'
    );
}

// The card's last line: the slot bridge.js puts its settings note
// in, so the note reads as this card's small print under a hairline
// rather than as a centred caption floating below the page.
function impCardClose() {
    return '<div class="foot" data-widget-foot></div></section>';
}

// Step 1, "Choose your export": the drop zone and whatever has to be said
// above it.
//
//   o.noTools       the host cannot call tools, so the import cannot run here
//   o.supportEmail  the contact shown under that warning ("" or null: none)
//   o.tzConfigured  false: the account has no timezone, so dates read as UTC
//   o.errors        local pre-flight problems; the first one is shown
//   o.step          the step the header counts (render() only ever draws this
//                   card on "file")
function importFileStep(o) {
    const noTools = o.noTools
        ? impNotice("warn", impEsc(T.importMeals.noToolsWarning)) +
          (o.supportEmail
              ? impNotice(
                    "",
                    tpl(T.importMeals.emailFallback, {
                        email: "<b>" + impEsc(o.supportEmail) + "</b>",
                    }),
                    "✉",
                )
              : "")
        : "";
    const tzWarn = !o.tzConfigured
        ? impNotice("warn", impEsc(T.importMeals.tzWarning))
        : "";
    const errors = o.errors || [];
    return (
        impCardOpen() +
        impCardHead(T.importMeals.chooseExportHeading, o.step) +
        noTools +
        tzWarn +
        (errors.length ? impNotice("error", impEsc(errors[0])) : "") +
        '<label class="drop" id="drop">' +
        icon("file", 22) +
        "<strong>" +
        impEsc(T.importMeals.dropChoose) +
        "</strong><span>" +
        impEsc(T.importMeals.dropOr) +
        "</span>" +
        '<input type="file" class="drop-input" id="file" accept=".csv,text/csv,text/plain" />' +
        "</label>" +
        '<div class="hint" style="margin-top:8px">' +
        impEsc(T.importMeals.recognizedHint) +
        "</div>" +
        impCardClose()
    );
}
