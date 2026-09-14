/* Makes the landing page's widget cards live.

   The cards themselves are RENDERED AT BUILD TIME by the real emitters
   (shared/summary-card.js, shared/trends-card.js, shared/meal-logged-card.js,
   shared/goal-progress-card.js, shared/weight-trends-card.js — see
   scripts/gen-index.ts), so the markup in public/index.html is the same string
   chat gets. This file is the other half: it re-attaches the behaviour that
   markup implies — the drawer, the tile taps that move the focus panel,
   goal-progress' weight row, Escape, and the trends and weight-trends
   7 / 14 / 30 toggles — WITHOUT repainting anything on load. A repaint would
   flash, and it would throw away the exact bytes the drift test pins.

   It is the last partial in public/widget-card.js (scripts/gen-widget-card.ts),
   which is every shared JS partial the bound card templates include (plus
   goal-progress.html's site-card region, its weight row) EXCEPT
   shared/bridge.js: there is no MCP host here, no iframe to size and no
   postMessage handshake to run. The three helpers that only live in bridge.js
   are therefore not in scope — `tryRender` is a try/catch below, `keepFocus`
   is unnecessary (the seg buttons a range change repaints are exactly the ones
   it does NOT rebuild), and `reserveLine` is `reserveMeta` below:
   the same rule, deliberately re-typed, and the one thing in this file that
   has to move when bridge.js's does. Not the same CODE, though — an iframe's
   widget is laid out the moment it renders and never changes width, and
   neither is true of a card in a hidden slide of a responsive page, so this
   copy measures on a ResizeObserver. Its own comment carries why.

   HOW THE CTX COMES BACK. Every handler in shared/macros.js resolves the strip
   it was fired in through macroCtx() — the values, goals, meals and options
   macroPanel built that strip from. Only the MARKUP survived the build, so
   this file rebuilds the ctx the only way that cannot drift: it calls the very
   same card function on the very same payload, throws the returned string
   away, and binds the ctx that call stashed to the server's strip element
   (macroStash). Two cards on one page each get their own, which is what the
   WeakMap behind macroStash is for.

   THE TWO SINGLE-STATE GLOBALS that one iframe per widget made harmless are
   live here, and both are handled per card rather than left to luck:

     * SPARK (shared/spark.js) is one chart axis per document, so every paint
       is preceded by `armSpark(thisCard's slots, goals)`. `SPARK.painted` is
       forced true after the reset because the build-time render already WAS
       the first paint — the entrance is owed once, and it was spent in the
       HTML the visitor is looking at.

     * the drawer's id (macroDrawerId, shared/macros.js) is per-strip but
       caller-supplied, and this file is not the caller that supplied it. It
       reads the id back off the server's own drawer and patches it into every
       ctx it stashes and every body the toggle rewrites, so a runtime
       aria-controls can never point at the other card's drawer.

   THE PAGE CONTRACT, which scripts/gen-index.ts emits:

       <div class="nm-widget-card" data-widget="trends">
         <div class="wrap"> … the card, rendered at build time … </div>
         <script type="application/json" data-widget-payload="trends">
           { … the same structuredContent the card was rendered from … }
         </script>
       </div>

   The kind may be named on either the script (`data-widget-payload="trends"`)
   or the card (`data-widget`); with neither, the payload's own shape decides.
   Nothing here writes to the page until a visitor touches a card. */

/** The chart axis for the card about to paint. `painted` is forced on: the
 *  build-time render already spent the once-only entrance. */
function armSpark(slots, goals) {
    sparkReset(slots, goals);
    SPARK.painted = true;
}

/** The ambient locale and water unit are document-wide (shared/i18n.js,
 *  shared/macros.js), so each card re-asserts its own before it repaints.
 *  `<html lang>` is the PAGE's, not the widget's: setLocale stamps it for an
 *  iframe that owns its document, and here it would relabel the whole page. */
function useCard(data) {
    const lang = document.documentElement.lang;
    setLocaleFrom(data, null);
    document.documentElement.lang = lang;
    setWaterUnit(data && data.water_unit);
}

/** Re-assert this card's locale and water unit BEFORE any of shared/macros.js's
 *  handlers acts on a tap or a key inside it. Those handlers are delegated on
 *  `document` in the bubble phase, so a capture-phase listener on the card's
 *  own root always runs first — including for the paths no binder hands a
 *  callback to: a tile opening its drawer, Escape closing it, and the default
 *  that moves a tiered strip's focus panel on a tap (shared/macros.js), which
 *  repaints a mirrored figure through macroNum and T. Without it a tap on one
 *  card after another card had bound (or repainted) printed its figures in
 *  whichever card's unit was asserted last. Cheap and idempotent, so the
 *  binders with their own onSeries keep calling useCard there too. */
function useCardOnInput(root, data) {
    const assert = function () {
        useCard(data);
    };
    root.addEventListener("click", assert, true);
    root.addEventListener("keydown", assert, true);
}

/** The ids the SERVER wrote, read back off the drawer so every runtime
 *  pointer agrees with the shipped HTML whatever prefix built it. */
function drawerIds(root) {
    const d = root.querySelector(".drawer");
    if (!d || !d.id) return null;
    return {
        id: d.id,
        name: d.getAttribute("aria-labelledby") || d.id + "-name",
    };
}

/** Put those ids back on a body that was just rewritten from a ctx that did
 *  not know them. A no-op when they already match. */
function applyDrawerIds(scope, ids) {
    if (!ids) return;
    const d = scope.querySelector(".drawer");
    if (!d || d.id === ids.id) return;
    const old = d.id;
    d.id = ids.id;
    d.setAttribute("aria-labelledby", ids.name);
    const sel = '[aria-controls="' + old + '"]';
    scope.querySelectorAll(sel).forEach(function (el) {
        el.setAttribute("aria-controls", ids.id);
    });
}

/** Bind the ctx the last macroPanel call stashed to `panel`, with this card's
 *  real drawer ids on it. */
function stashCard(panel, ids) {
    const ctx = macroCtx();
    if (ctx && ids) {
        ctx.drawerId = ids.id;
        ctx.drawerNameId = ids.name;
    }
    return macroStash(panel, ctx);
}

/* THE BUILD'S ICU AND THE VISITOR'S ICU ARE NOT THE SAME ICU, and the dates on
   these cards go through Intl (shared/date.js). Bun 1.4.2 ships ICU 78.1 and
   writes "8 Sep 2025", "25 ago – 7 set 2025", "25 sie 2025 – 7 wrz 2025";
   Chrome 153 writes "8 Sept 2025", "25 ago – 07 set 2025", "25 sie–7 wrz 2025"
   for the same three locales (en, it, pl — the other six agree today, and
   which six agree is itself a moving target).

   THE BROWSER WINS, because a browser is what renders this card in chat and
   chat is the thing this page is replicating. It is also the only answer that
   makes ONE card self-consistent: the header ships from the build engine and
   is never repainted, while the drawer it opens writes its rows through the
   same shortDate() in the visitor's engine — so an English hero card printed
   "8 Sep 2025" above a drawer full of "8 Sept", one tap in.

   So on bind every date-bearing string is recomputed HERE, through the very
   functions that produced it (rangeLabel / dayHeader / intlDateRange, reached
   by re-running the card's own emitter — never a formatter hand-written for
   this file), and written back only where it differs from the shipped bytes.
   Six locales in nine, and every locale on an engine that agrees, therefore
   touch no DOM at all and cannot flash. On the trends card the whole of that
   surface is the header meta (the populated window line and the whole-empty
   card's alike); every strip card that can show one day — meal-logged,
   goal-progress and a single-day nutrition-summary, whose calorie panel reads
   "Calories · 7 Sep" like theirs — also dates its panel label and, spoken, the
   panel's name, and meal-logged its sub-line (DAY_CARD_TEXTS); weight-trends
   names its chart with two dates. The drawer is written at tap time by the
   visitor's engine already.

   THE RESIDUAL, stated plainly: a visitor with JavaScript disabled reads the
   BUILD engine's spelling, which can differ from their browser's by a few
   characters ("Sep" for "Sept"). That is the no-JS state by design — the
   server-rendered bytes are complete and readable, and src/widget-card.test.ts
   pins them — and no test can catch that class of divergence, because both
   halves of a drift comparison render in the same runtime. The only way to see
   it is to compare a built page against a browser, by hand, as this was
   found. */
function syncMeta(el, text) {
    if (!el || typeof text !== "string" || !text) return;
    if (el.textContent === text) return;
    el.textContent = text;
}

/** The same, for a card whose emitter returns one string and keeps no separate
 *  handle on its header: render a fresh copy, pair its date-bearing elements
 *  with the shipped ones in document order and sync each. Parsed into a
 *  <template>, so the copy is inert and never reaches the document. A count
 *  mismatch means the card's shape moved under this file — leave the bytes
 *  alone rather than write one card's date into another's slot.
 *
 *  `texts` are selectors whose TEXT carries a date, and every one of them must
 *  be a text-only element (textContent replaces children). `labels` are
 *  selectors whose `aria-label` carries one. A strip card that can show one
 *  day spends a date in more places than the header meta — see
 *  DAY_CARD_TEXTS. A selector that matches nothing on either side is skipped,
 *  so one list serves cards that print only some of those slots. */
const HEADER_META = [".chead .cmeta"];
function syncCardMeta(root, html, texts, labels) {
    const doc = document.createElement("template");
    doc.innerHTML = html;
    const pairs = function (sel) {
        const fresh = doc.content.querySelectorAll(sel);
        const live = root.querySelectorAll(sel);
        return fresh.length && fresh.length === live.length
            ? { fresh: fresh, live: live }
            : null;
    };
    for (const sel of texts || HEADER_META) {
        const p = pairs(sel);
        if (!p) continue;
        for (let i = 0; i < p.live.length; i++) {
            syncMeta(p.live[i], p.fresh[i].textContent);
        }
    }
    for (const sel of labels || []) {
        const p = pairs(sel);
        if (!p) continue;
        for (let i = 0; i < p.live.length; i++) {
            const want = p.fresh[i].getAttribute("aria-label");
            if (want && p.live[i].getAttribute("aria-label") !== want) {
                p.live[i].setAttribute("aria-label", want);
            }
        }
    }
}

/* Where a strip card that can show one day (meal-logged, goal-progress, a
   single-day nutrition-summary) prints a date: the header meta (goal-progress'
   "13 Sep 2025 · 4 meals", nutrition-summary's "7 Sep 2025"), the header
   subtitle (meal-logged's "15 Sep 2025 · Breakfast · …"), the calorie panel's
   label ("Calories · 15 Sep") — and, spoken, the panel's name when it is a
   button and the weight row's name ("…, last logged 12 Sep 2025"). All the
   text slots are text-only elements in the emitters. On a multi-day summary
   the panel label is "Daily avg · logged days" and compares equal, so it is
   never written. */
const DAY_CARD_TEXTS = [".chead .cmeta", ".chead .csub", ".focus .flabel"];
const DAY_CARD_LABELS = [
    ".focus[aria-label]",
    "[data-macro-extra][aria-label]",
];

/** bridge.js's reserveLine, for a page that does not load bridge.js: floor the
 *  window line at the tallest range label so a toggle cannot move the card.
 *
 *  DEFERRED AND REPEATED, which bridge.js's copy does not have to be. In chat
 *  the widget IS the document and is laid out the instant it renders. Here the
 *  card is on a responsive page and may have no box when it is bound: it
 *  shipped for a while inside the old examples picker's inactive panel, which
 *  was `display:none` until LANDING_SCRIPT showed it — so a measurement at
 *  bind time read 0 for every candidate, and the floor written from it was
 *  `min-height: 0px`: indistinguishable from never having run, and permanent,
 *  because the inline 0 survived the panel being shown. (The carousel that
 *  replaced it lays every slide out, off to the side of its track, but a
 *  future wrapper that hides one is two lines away.)
 *  And WHICH label is tallest depends on the width: at 360px the 14- and
 *  30-day labels wrap to two rows where the 7-day one does not (the card moved
 *  470 → 455 → 470 px across a toggle), while at >=1280px nothing wraps and
 *  the floor is irrelevant — which is why this was invisible on a desktop.
 *
 *  A ResizeObserver answers both halves at once: an element with no box is
 *  reported at 0x0 and reported again with its real size the moment the panel
 *  is shown, and every later width change is reported too. Three things keep
 *  it honest — the measure runs in a rAF AFTER the callback (writing from
 *  inside it is what produces "ResizeObserver loop completed with undelivered
 *  notifications"), it writes nothing when the probe still measures 0, and it
 *  is keyed on the WIDTH it last measured at, so its own height write cannot
 *  feed it. Call it AFTER the meta's text is final (see syncMeta): the probe
 *  restores whatever it found, so a stale string measured here is a stale
 *  string put back. */
// The fractional height of `el`. `offsetHeight` rounds to whole pixels, and a
// floor rounded DOWN is not a floor: a two-line meta at a 14.7px line-height
// measures 29.391px and reserves 29px, so the card still moved 0.391px on a
// toggle — the whole defect this reserves against, just small enough to read
// as a rendering artefact. getBoundingClientRect keeps the fraction.
function lineH(el) {
    return el.getBoundingClientRect().height;
}

function reserveMeta(el, texts) {
    if (!el || !texts || !texts.length) return;
    let at = -1;
    const measure = function () {
        const width = el.offsetWidth;
        // No box at all — display:none, or detached. The probe below would
        // read 0 for every candidate and the `!tallest` guard would throw the
        // answer away, so leave the DOM alone entirely rather than swap four
        // strings through a span nobody can see. (`.cmeta.crow` is
        // flex-basis:100%, so a laid-out one always has width.)
        if (!width && !lineH(el)) return;
        const current = el.textContent;
        el.style.minHeight = "";
        let tallest = lineH(el);
        for (const text of texts) {
            el.textContent = text;
            const h = lineH(el);
            if (h > tallest) tallest = h;
        }
        el.textContent = current;
        // Hidden, detached or not yet laid out: every probe read 0, and a 0px
        // floor is not a floor. Keep whatever is already there — nothing, the
        // first time round — and wait to be called again.
        if (!tallest) return;
        at = width;
        el.style.minHeight = tallest + "px";
    };
    if (typeof ResizeObserver !== "function") {
        measure();
        return;
    }
    let queued = false;
    new ResizeObserver(function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () {
            queued = false;
            if (el.offsetWidth === at) return;
            measure();
        });
    }).observe(el);
}

/** get_nutrition_summary: one strip, one chart, no controls of its own —
 *  every tap is macros.js's, and all this owes it is the ctx, the axis and
 *  this browser's spelling of its dates. */
function bindSummaryCard(root, data) {
    // An empty-state card has no strip: nothing discloses, nothing charts.
    if (!root.querySelector("[data-macro-panel]")) return;
    useCard(data);
    const ids = drawerIds(root);
    let slots = [];
    let goals = null;
    // The MARKUP is thrown away; the call is here for the ctx it stashes, the
    // axis it resets and the dates it recomputes. Same function, same payload
    // as the build, so the ctx a tap resolves is the one the markup was
    // emitted from — and every date is this browser's spelling of exactly the
    // string the build wrote: the header meta, and on a single-day card the
    // calorie panel's "Calories · 7 Sep" and the panel's spoken name too.
    const html = summaryCard(data, {
        onSeries: function (key, opened) {
            useCard(data);
            armSpark(slots, goals);
            sparkPaint(
                root.querySelector(".focus"),
                opened ? key : "calories",
                opened,
            );
        },
    });
    slots = SPARK.slots;
    goals = SPARK.goals;
    stashCard(root.querySelector("[data-macro-panel]"), ids);
    syncCardMeta(root, html, DAY_CARD_TEXTS, DAY_CARD_LABELS);
}

/** get_trends: the same, plus the range toggle — which is trends.html's
 *  setRange minus the bridge (see the head of this file). The slicing,
 *  averaging, window line and markup are the shared functions the in-chat
 *  card uses; what is written out here is only where they land. */
function bindTrendsCard(root, data) {
    // An empty-state card has no strip: nothing discloses, nothing charts.
    if (!root.querySelector("[data-macro-panel]")) return;
    useCard(data);
    const ids = drawerIds(root);
    const bodyOf = function () {
        return root.querySelector("#tr-body") || root;
    };
    // The RENDERED range wins over the payload's default: what is pressed in
    // the HTML is what the visitor is looking at.
    const pressed = root.querySelector('[data-range][aria-pressed="true"]');
    let range =
        RANGES.indexOf(data && data.default_range) >= 0
            ? data.default_range
            : 30;
    if (pressed && Number(pressed.dataset.range)) {
        range = Number(pressed.dataset.range);
    }
    let view = null;
    const opts = {
        onSeries: function (key, opened) {
            useCard(data);
            armSpark(view.slots, view.goals);
            sparkPaint(
                bodyOf().querySelector(".focus"),
                opened ? key : "calories",
                opened,
                { label: view.label },
            );
        },
    };
    view = trendsView(data, range, opts);
    stashCard(bodyOf().querySelector("[data-macro-panel]"), ids);
    // This browser's spelling of the window line, THEN the floor measured over
    // this browser's three candidates — in that order, because the probe
    // restores the text it finds (see reserveMeta) and because a toggle writes
    // trendsMeta's output over whatever is there on the first tap. Without the
    // sync, that tap was where an English card changed "7 Sep" to "7 Sept".
    syncMeta(root.querySelector("#tr-meta"), view.meta);
    reserveMeta(
        root.querySelector("#tr-meta"),
        RANGES.map(function (r) {
            return trendsMeta(data, r);
        }),
    );

    root.addEventListener("click", function (e) {
        const btn = e.target.closest ? e.target.closest("[data-range]") : null;
        if (!btn || !root.contains(btn)) return;
        const n = Number(btn.dataset.range);
        if (!n || n === range) return;
        // Built BEFORE anything is written, so a throw leaves the card exactly
        // as it was rather than a toggle claiming 30 over 7 days of data.
        let next = null;
        try {
            next = trendsView(data, n, opts);
        } catch (err) {
            try {
                console.error("[widget-card] range failed:", err);
            } catch (_) {}
            return;
        }
        const body = bodyOf();
        // The series the visitor was comparing, carried across the change.
        const held = body.querySelector('[data-macro][aria-pressed="true"]');
        const heldKey = held ? held.dataset.macro : "";
        range = n;
        view = next;
        // The seg buttons are never rebuilt — the one being operated must stay
        // under the pointer and under the focus ring.
        root.querySelectorAll("[data-range]").forEach(function (b) {
            b.setAttribute(
                "aria-pressed",
                String(Number(b.dataset.range) === n),
            );
        });
        const meta = root.querySelector("#tr-meta");
        if (meta) meta.textContent = next.meta;
        body.innerHTML = next.body;
        applyDrawerIds(body, ids);
        stashCard(body.querySelector("[data-macro-panel]"), ids);
        if (!next.slots) return;
        armSpark(next.slots, next.goals);
        const tile = heldKey
            ? body.querySelector('[data-macro="' + heldKey + '"]:not(.focus)')
            : null;
        // Through the tile, so its pressed state, the panel and the line all
        // move by the path a tap takes — only if that metric is still a
        // control in this window (chartableKeys differs per range).
        if (tile) macroToggle(tile);
        else {
            sparkPaint(body.querySelector(".focus"), "calories", false, {
                label: next.label,
            });
        }
    });
}

/** log_meal / update_meal: one strip, no chart, and no controls this file has
 *  to drive — a tile or the calorie panel opens the meals behind it in this
 *  card's drawer, a tile tap also moves the focus panel to that metric (the
 *  tiered strip's default, as on nutrition-summary), and ✕ / Escape hand it
 *  all back, every one of them macros.js's. All this owes the card is the ctx
 *  (so several of these cards on one page each open their OWN meals), its
 *  locale and water unit asserted before each of those taps repaints
 *  (useCardOnInput), and this browser's spelling of its dates. */
function bindMealLoggedCard(root, data) {
    useCard(data);
    useCardOnInput(root, data);
    const ids = drawerIds(root);
    // The markup is thrown away; the call is here for the ctx it stashes and
    // the dates it recomputes (see bindSummaryCard).
    const html = mealLoggedCard(data, {});
    if (!html) return;
    const panel = root.querySelector("[data-macro-panel]");
    if (panel) stashCard(panel, ids);
    syncCardMeta(root, html, DAY_CARD_TEXTS, DAY_CARD_LABELS);
}

/** get_goal_progress: the same — drawer, the focus panel following a tile tap,
 *  the input-time locale and unit — plus the weight row: one more control on
 *  the strip (`data-macro-extra="weight"`) opening the same drawer, whose body
 *  is goal-progress.html's own weightExtra (bundled from its site-card
 *  region). */
function bindGoalProgressCard(root, data) {
    useCard(data);
    useCardOnInput(root, data);
    const ids = drawerIds(root);
    const html = goalProgressCard(data, { weightExtra: weightExtra });
    if (goalProgressShowsStrip(data)) {
        const panel = root.querySelector("[data-macro-panel]");
        if (panel) stashCard(panel, ids);
    }
    syncCardMeta(root, html, DAY_CARD_TEXTS, DAY_CARD_LABELS);
}

/** An element's SVG name, or "" — the chart's aria-label carries two dates. */
function svgLabel(scope) {
    const svg = scope && scope.querySelector("svg[aria-label]");
    return svg ? svg.getAttribute("aria-label") : "";
}

/** get_weight_trends: no strip and no drawer, only the 7 / 14 / 30 toggle —
 *  weight-trends.html's setRange minus the bridge. The window, the panel and
 *  the chart are shared/weight-trends-card.js's; what is written out here is
 *  only where they land. */
function bindWeightTrendsCard(root, data) {
    const meta = root.querySelector("#wt-meta");
    const body = root.querySelector("#wt-body");
    // The empty card has no toggle and nothing to switch.
    if (!meta || !body) return;
    useCard(data);
    // The RENDERED range wins over the payload's default: what is pressed in
    // the HTML is what the visitor is looking at.
    const pressed = root.querySelector('[data-range][aria-pressed="true"]');
    let range =
        WEIGHT_RANGES.indexOf(data && data.default_range) >= 0
            ? data.default_range
            : 30;
    if (pressed && WEIGHT_RANGES.indexOf(Number(pressed.dataset.range)) >= 0) {
        range = Number(pressed.dataset.range);
    }

    // This browser's spelling of the dates. The header line is text; the body
    // spends them in the panel label, the change line and the chart's name, so
    // it is compared as a whole and rewritten only when this engine spells
    // something differently. `.still` on the rewrite: the chart already drew
    // in from the shipped bytes, and a second entrance would be a flash.
    syncMeta(meta, weightTrendsMeta(data, range));
    const fresh = document.createElement("template");
    fresh.innerHTML = weightTrendsBody(data, range, true);
    if (
        fresh.content.textContent !== body.textContent ||
        svgLabel(fresh.content) !== svgLabel(body)
    ) {
        body.innerHTML = fresh.innerHTML;
    }
    // AFTER the sync, over this browser's three candidates (see reserveMeta).
    reserveMeta(
        meta,
        WEIGHT_RANGES.map(function (r) {
            return weightTrendsMeta(data, r);
        }),
    );

    root.addEventListener("click", function (e) {
        const btn = e.target.closest ? e.target.closest("[data-range]") : null;
        if (!btn || !root.contains(btn)) return;
        const n = Number(btn.dataset.range);
        if (!n || n === range || WEIGHT_RANGES.indexOf(n) < 0) return;
        // Built BEFORE anything is written, so a throw leaves the card exactly
        // as it was rather than a toggle claiming 30 over 7 days of data.
        let html = "";
        let text = "";
        try {
            useCard(data);
            html = weightTrendsBody(data, n, true);
            text = weightTrendsMeta(data, n);
        } catch (err) {
            try {
                console.error("[widget-card] range failed:", err);
            } catch (_) {}
            return;
        }
        range = n;
        // The seg buttons are never rebuilt — the one being operated must stay
        // under the pointer and under the focus ring.
        root.querySelectorAll("[data-range]").forEach(function (b) {
            b.setAttribute(
                "aria-pressed",
                String(Number(b.dataset.range) === n),
            );
        });
        meta.textContent = text;
        body.innerHTML = html;
    });
}

/* Which binder a card kind takes. A kind the page names that is not here is a
   card this bundle cannot drive (the importer's first step is a still picture
   and ships no payload at all), so it is said once and left static. */
const BINDERS = {
    "nutrition-summary": bindSummaryCard,
    trends: bindTrendsCard,
    "meal-logged": bindMealLoggedCard,
    "goal-progress": bindGoalProgressCard,
    "weight-trends": bindWeightTrendsCard,
};

function bindWidgetCard(script) {
    const card =
        (script.closest && script.closest(".nm-widget-card")) ||
        script.parentElement;
    if (!card) return;
    // `.wrap` IS the widget's #root (shared/base.css); a card that dropped it
    // is bound on the card element, which contains the same strip either way.
    const root = card.querySelector(".wrap") || card;
    const data = JSON.parse(script.textContent);
    // Named on the script or the card, as scripts/gen-index.ts always does.
    // The shape fallback only knows the first two kinds, which is all it was
    // ever written for.
    const kind =
        script.getAttribute("data-widget-payload") ||
        card.getAttribute("data-widget") ||
        (data && data.default_range != null ? "trends" : "nutrition-summary");
    const bind = BINDERS[kind];
    if (!bind) {
        try {
            console.warn(
                '[widget-card] no binder for card kind "' +
                    kind +
                    '"; it stays static',
            );
        } catch (e) {}
        return;
    }
    bind(root, data);
    warnLocale(data);
    levelCardHeadings(card);
}

/* A card's title is an <h1> because in chat it IS the document: the iframe
   holds nothing else. On this page it sits inside the page's outline — the
   hero card under the page's own <h1>, an example card under its slide's <h3>
   — so a heading-by-heading reader met "Meal logged" announced as a second
   top-level heading. The markup must stay byte-for-byte the widget's, so the
   level is corrected here, as ARIA, once the runtime binds. No binder
   rewrites a card's header (they repaint a strip or a body), so this holds. */
function levelCardHeadings(card) {
    const level = card.closest("[data-ex-slide]") ? "4" : "2";
    card.querySelectorAll("h1.ctitle").forEach(function (h) {
        h.setAttribute("aria-level", level);
    });
}

/* THE STRINGS FILE IS PER PAGE AND THE PAYLOAD IS PER CARD. They agree by
   construction — the same locale renders both — but if they ever stop
   agreeing, shared/i18n.js falls back to English and the first tap repaints a
   translated card in English, with nothing failing. Said out loud once per
   card, where whoever changed it will see it. */
function warnLocale(data) {
    const want = data && data.locale;
    if (!want) return;
    const base = String(want).split(/[-_]/)[0].toLowerCase();
    if (base === WIDGET_LOCALE) return;
    try {
        console.warn(
            '[widget-card] payload locale "' +
                want +
                '" is not in this page\'s strings file; the cards will repaint in "' +
                WIDGET_LOCALE +
                '"',
        );
    } catch (e) {}
}

function bindWidgetCards() {
    const found = document.querySelectorAll(
        'script[type="application/json"][data-widget-payload]',
    );
    found.forEach(function (script) {
        // One bad card must not take the other one down with it: the markup is
        // already on screen and readable, and a failed bind costs only the
        // interactions.
        try {
            bindWidgetCard(script);
        } catch (e) {
            try {
                console.error("[widget-card] bind failed:", e);
            } catch (_) {}
        }
    });
}

if (typeof document !== "undefined") {
    // Deferred, so the document is already parsed by the time this runs; the
    // listener is for a caller that loads the bundle some other way.
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bindWidgetCards, {
            once: true,
        });
    } else {
        bindWidgetCards();
    }
}
