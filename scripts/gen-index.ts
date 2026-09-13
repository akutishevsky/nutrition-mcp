/**
 * Generates public/index.html (the landing page) and its translated
 * counterparts under public/{locale}/ from the typed data in
 * src/copy/index.ts.
 *
 * The page is the "Dawn" design (6a). Its header, sheet menu and footer are
 * the shared chrome — nav()/footer() in scripts/site-partials.ts, the same
 * markup every other generated page renders — and it loads the one site
 * stylesheet (/styles.css) through the shared HEAD_ASSETS; this file only
 * owns the sections between them (hero chat, how, connect, onboarding,
 * examples, live board, support, contact, FAQ, closing band) and the
 * page's own script. The design was first built here and then generalised
 * outward, which is why so many of the site's shared classes are nm-*.
 *
 * Re-run after editing src/copy/index.ts:
 *   bun run scripts/gen-index.ts
 * The generated .html files are the served artifacts — don't hand-edit them.
 */

import {
    HTML_LANG,
    QUOTES,
    hashPath,
    pathFor,
    urlFor,
    type SiteLocale,
} from "../src/routes.js";
import {
    EMAIL,
    EXT,
    GITHUB,
    HEAD_ASSETS,
    MCP_URL,
    PATREON,
    SITE,
    attr,
    esc,
    footer,
    generatedBanner,
    jsonLd,
    localeHead,
    nav,
    translationNotice,
    SITE_SCRIPT,
    THEME_PREPAINT,
} from "./site-partials.js";
import {
    INDEX,
    type ExampleMessage,
    type ExampleSlide,
    type ExampleSlideId,
    type FaqEntry,
    type HeroExchange,
    type IndexDoc,
} from "../src/copy/index.js";
import {
    renderGoalProgressCard,
    renderImportFileStep,
    renderMealLoggedCard,
    renderSummaryCard,
    renderTrendsCard,
    renderWeightTrendsCard,
    type GoalProgressPayload,
    type MealProgressPayload,
    type StartImportPayload,
    type SummaryPayload,
    type TrendsPayload,
    type WeightTrendsPayload,
} from "../src/widget-static.js";
import {
    DEMO_EXAMPLE_MEALS,
    DEMO_GOAL_PROGRESS_MEALS,
    DEMO_TRENDS,
    demoExampleMealLogged,
    demoGoalProgressPayload,
    demoStartImportPayload,
    demoSummaryPayload,
    demoWeightTrendsPayload,
    validateDemoPayload,
    type DemoExampleMealSlide,
    type DemoMealInput,
    type DemoTool,
} from "../src/copy/widget-demo.js";
import { WIDGET_STRINGS } from "../src/copy/widgets.js";

// The landing page's own JS: the hero chat replay, the examples carousel, the
// live-stats poller (count-ups, deltas, unit toggle, countdown, world map),
// the GitHub star count and the Patreon posts. Not prose — page behaviour.
// It holds no copy of its own: everything it shows it reads back out of the
// markup the generator wrote (<html lang>, data-* attributes, the static
// chat thread, the <template> for a post card), because this one string is
// embedded byte-identically into all nine locales' index.html.
//
// Written as a String.raw block so it reads as plain JS; the one rule that
// follows is that the script may contain neither a backtick nor "${".
// Exported for src/landing-script.test.ts, which pins the nine generated
// pages against THIS constant.
export const LANDING_SCRIPT: string = String.raw`            (function () {
                var reduceMotion = window.matchMedia(
                    "(prefers-reduced-motion: reduce)",
                ).matches;

                // The page's own language, stamped on <html lang> by the generator.
                // One script serves all nine locales, so it can never name a locale of
                // its own: it reads the one it was rendered in. Every figure, date and
                // clock on the page is formatted against this.
                var NUM_LOCALE = document.documentElement.lang || "en";

                function fmtInt(n) {
                    return Math.round(n).toLocaleString(NUM_LOCALE);
                }
                function fmtDec(n, digits) {
                    return n.toLocaleString(NUM_LOCALE, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: digits,
                    });
                }
                function wait(ms) {
                    return new Promise(function (resolve) {
                        setTimeout(resolve, ms);
                    });
                }
                // Resolves once the tab is visible again - the loops below sleep in a
                // background tab rather than burn timers nobody is watching.
                function whenVisible() {
                    if (!document.hidden) return Promise.resolve();
                    return new Promise(function (resolve) {
                        document.addEventListener("visibilitychange", function onShow() {
                            if (document.hidden) return;
                            document.removeEventListener("visibilitychange", onShow);
                            resolve();
                        });
                    });
                }
                // ---------- widget cards: keep the settings note ----------
                // The cards on this page are the real in-chat widgets, and
                // they carry the real settings note. In chat a MutationObserver
                // in shared/bridge.js keeps that note as the last child of the
                // card's last [data-widget-foot], for one reason: widgets
                // repaint from their own controls and take whatever is in the
                // old DOM with them. This page runs no bridge - there is no
                // host to handshake with and no iframe to size - but it does
                // run the repaints, and the trends card's 7 / 14 / 30 toggle
                // rewrites its whole body, so the note went with it on the
                // first tap. Same rule, same reason, six lines. It is the one
                // piece of bridge.js re-typed here, and it moves when that one
                // does. No copy of its own: the wording is the element the
                // generator already wrote, moved rather than rebuilt.
                document.querySelectorAll(".nm-widget-card").forEach(function (card) {
                    var note = card.querySelector(".wnote");
                    if (!note) return;
                    function place() {
                        var slots = card.querySelectorAll("[data-widget-foot]");
                        var slot = slots.length ? slots[slots.length - 1] : card;
                        // Guarded, not unconditional: an append the observer
                        // reports back to itself never stops.
                        if (slot.lastElementChild !== note) slot.appendChild(note);
                    }
                    new MutationObserver(place).observe(card, {
                        childList: true,
                        subtree: true,
                    });
                });

                // ---------- hero chat: replay the static thread ----------
                // The generator renders the whole conversation in full, so the page
                // reads without script and for crawlers. Here it is taken apart into
                // exchanges (a user or barcode bubble carrying data-clock, then
                // its AI reply) and
                // replayed as the design's loop: type the user line, show the typing
                // dots, reveal the reply, bring in the card for what has been logged
                // so far. Every bubble on screen is a clone of one the generator
                // wrote - the script holds no copy of its own, and it computes no
                // figure of its own either: the cards are REAL get_nutrition_summary
                // cards, rendered at build time by the widget's own emitters, one per
                // cumulative state of the thread.
                var chatList = document.querySelector("[data-chat-list]");
                var chatClock = document.querySelector("[data-chat-clock]");
                var chatPause = document.querySelector("[data-chat-pause]");
                // WCAG 2.2.2: the replay auto-starts and runs longer than 5 s, so
                // the reader gets a pause. It freezes the loop where it stands - mid
                // word if that is where it was - and play resumes from there. The
                // toggle mirrors whenVisible(): the loop awaits it at every step.
                var chatPaused = false;
                var chatResume = [];
                function whenPlaying() {
                    if (!chatPaused) return Promise.resolve();
                    return new Promise(function (resolve) {
                        chatResume.push(resolve);
                    });
                }
                if (chatPause && !reduceMotion) {
                    chatPause.addEventListener("click", function () {
                        chatPaused = !chatPaused;
                        chatPause.setAttribute("aria-pressed", String(chatPaused));
                        var icon = chatPause.querySelector("i");
                        if (icon) {
                            icon.classList.toggle("fa-pause", !chatPaused);
                            icon.classList.toggle("fa-play", chatPaused);
                        }
                        if (!chatPaused) {
                            var waiting = chatResume;
                            chatResume = [];
                            waiting.forEach(function (resolve) {
                                resolve();
                            });
                        }
                    });
                }
                if (chatList && !reduceMotion) {
                    // THE CARDS ARE MOVED, NEVER CLONED. Each is a real widget card
                    // whose behaviour (the drawer, a tile moving the focus panel,
                    // Escape) is bound by /widget-card.js to the card ELEMENT — the
                    // key macroStash keys its ctx on (shared/macros.js). A clone is
                    // not that element, so its taps would resolve to whichever card
                    // stashed last, which on this page is the trends card in the
                    // examples section. Collected once, up front: appendChild moves
                    // a card into the thread, the loop's own clear takes it back out,
                    // and a node held here survives being out of the document with
                    // its binding intact.
                    var heroCards = {};
                    document
                        .querySelectorAll("[data-hero-card]")
                        .forEach(function (el) {
                            el.getAttribute("data-hero-card")
                                .split(" ")
                                .forEach(function (i) {
                                    heroCards[i] = el;
                                });
                        });
                    var exchanges = [];
                    [].slice.call(chatList.children).forEach(function (node) {
                        if (node.matches(".nm-msg-user, .nm-msg-barcode")) {
                            exchanges.push({
                                user: node,
                                ai: null,
                                clock: node.getAttribute("data-clock") || "",
                                barcode: node.classList.contains("nm-msg-barcode"),
                            });
                        } else if (node.matches(".nm-msg-ai") && exchanges.length) {
                            exchanges[exchanges.length - 1].ai = node;
                        }
                    });
                    var CHAT_MAX = 12;
                    // Keeping the thread pinned to its bottom means reading
                    // scrollHeight, and reading it forces the browser to lay the
                    // thread out then and there. Doing that per typed character —
                    // roughly forty times a second — kept a layout running
                    // continuously underneath the sticky bar, which has to re-blur
                    // whatever moves behind it, and that is what made the bar flicker
                    // while the page sat still. Coalesced to at most one per frame,
                    // and taken inside the frame rather than between two timers.
                    var pinQueued = false;
                    function pinToBottom() {
                        if (pinQueued) return;
                        pinQueued = true;
                        requestAnimationFrame(function () {
                            pinQueued = false;
                            chatList.scrollTop = chatList.scrollHeight;
                        });
                    }
                    function push(el) {
                        var typing = chatList.querySelector(".nm-typing");
                        if (typing) typing.remove();
                        chatList.appendChild(el);
                        while (chatList.children.length > CHAT_MAX)
                            chatList.removeChild(chatList.firstChild);
                        pinToBottom();
                    }
                    function typingBubble() {
                        var d = document.createElement("div");
                        d.className = "nm-typing";
                        d.setAttribute("aria-hidden", "true");
                        for (var i = 0; i < 3; i++)
                            d.appendChild(document.createElement("span"));
                        return d;
                    }
                    async function typeUser(src) {
                        var text = src.textContent.trim();
                        // Shallow clone keeps the bubble's class and data attributes
                        // and drops its text, which is typed back in below.
                        var bubble = src.cloneNode(false);
                        var textNode = document.createTextNode("");
                        var caret = document.createElement("span");
                        caret.className = "nm-caret";
                        caret.setAttribute("aria-hidden", "true");
                        bubble.appendChild(textNode);
                        bubble.appendChild(caret);
                        push(bubble);
                        for (var i = 1; i <= text.length; i++) {
                            await whenPlaying();
                            textNode.nodeValue = text.slice(0, i);
                            pinToBottom();
                            await wait(24);
                        }
                        caret.remove();
                    }
                    async function replay() {
                        for (;;) {
                            chatList.textContent = "";
                            for (var i = 0; i < exchanges.length; i++) {
                                await whenVisible();
                                await whenPlaying();
                                var ex = exchanges[i];
                                if (chatClock) chatClock.textContent = ex.clock;
                                await wait(500);
                                if (ex.barcode) {
                                    push(ex.user.cloneNode(true));
                                    await wait(900);
                                } else {
                                    await typeUser(ex.user);
                                }
                                await wait(350);
                                await whenPlaying();
                                push(typingBubble());
                                await wait(900);
                                await whenPlaying();
                                if (ex.ai) push(ex.ai.cloneNode(true));
                                if (heroCards[i]) {
                                    await wait(500);
                                    push(heroCards[i]);
                                    await wait(3600);
                                } else {
                                    await wait(2600);
                                }
                            }
                            await wait(2200);
                            await whenPlaying();
                        }
                    }
                    // START AFTER THE DEFERRED SCRIPTS HAVE RUN. The first
                    // thing the loop does is empty the thread, and the hero
                    // cards live in it — so starting during parsing would
                    // clear them away before /widget-card.js ever saw them,
                    // and every tile on the hero card would then resolve to
                    // the other card's data (macroCtx's last-stash fallback,
                    // shared/macros.js). Deferred scripts run while
                    // readyState is already "interactive", so waiting for
                    // DOMContentLoaded is exactly waiting for them.
                    if (exchanges.length) {
                        if (document.readyState === "loading") {
                            document.addEventListener("DOMContentLoaded", replay, {
                                once: true,
                            });
                        } else {
                            replay();
                        }
                    }
                }

                // ---------- live GitHub star count ----------
                var starEls = document.querySelectorAll("[data-gh-stars]");
                if (starEls.length) {
                    fetch("https://api.github.com/repos/akutishevsky/nutrition-mcp")
                        .then(function (r) {
                            return r.ok ? r.json() : null;
                        })
                        .then(function (d) {
                            if (!d || typeof d.stargazers_count !== "number") return;
                            // Grouped in the page's language like every other figure.
                            var text = d.stargazers_count.toLocaleString(NUM_LOCALE);
                            starEls.forEach(function (el) {
                                el.textContent = text;
                            });
                        })
                        .catch(function () {});
                }

                // ---------- examples: the carousel ----------
                // The slides are a horizontal scroll-snap track, so without script
                // they already swipe, scroll and snap. What is left to script is
                // everything that has to agree with WHERE THE TRACK IS: the tabs, the
                // counter, which slides are inert, and the announcement. The active
                // slide is derived from the scroll position rather than stored, so a
                // swipe, a tab and a button all land in the same state.
                // No copy here: the announcement is the slide's own aria-label
                // ("3 of 10: Scan a barcode"), written by the generator in the
                // page's language.
                var exTrack = document.querySelector("[data-ex-track]");
                var exSlides = exTrack
                    ? [].slice.call(exTrack.querySelectorAll("[data-ex-slide]"))
                    : [];
                var exTabs = [].slice.call(document.querySelectorAll("[data-ex-tab]"));
                if (exTrack && exSlides.length) {
                    var exCount = document.querySelector("[data-ex-count]");
                    var exLive = document.querySelector("[data-ex-live]");
                    var exActive = -1;
                    // Set while a button- or tab-initiated scroll is under way: the
                    // slides a smooth scroll passes on its way are not choices, and
                    // letting them through flickers the tabs and the counter.
                    var exPending = null;
                    var exPendingTimer = 0;
                    // Relative to the first slide rather than to the track, so the
                    // track's inline padding (room for the slide's shadow) cancels out.
                    function exLeft(i) {
                        return exSlides[i].offsetLeft - exSlides[0].offsetLeft;
                    }
                    function exNearest() {
                        var x = exTrack.scrollLeft;
                        var best = 0;
                        for (var i = 1; i < exSlides.length; i++) {
                            if (Math.abs(exLeft(i) - x) < Math.abs(exLeft(best) - x))
                                best = i;
                        }
                        return best;
                    }
                    // Read at the moment of use, not once at load: the OS setting can
                    // change while the page is open.
                    function exStill() {
                        return window.matchMedia("(prefers-reduced-motion: reduce)")
                            .matches;
                    }
                    // The tabs and the arrows are the keyboard's way along the track.
                    // Left alone, Chrome makes a scroller with nothing focusable in it
                    // (the first two slides, once their neighbours are inert) a tab
                    // stop of its own, with no name and the UA's ring.
                    exTrack.tabIndex = -1;
                    // A tab row too wide for its box scrolls, and fades whichever edge
                    // has more tabs past it (.is-fade-start / .is-fade-end). Derived
                    // from the scroll position every time, like the active slide, so a
                    // drag, a reveal and a resize all land in the same state.
                    var exRow = exTabs.length ? exTabs[0].parentNode : null;
                    function exFade() {
                        if (!exRow) return;
                        var max = exRow.scrollWidth - exRow.clientWidth;
                        var x = exRow.scrollLeft;
                        exRow.classList.toggle("is-fade-start", max > 1 && x > 1);
                        exRow.classList.toggle("is-fade-end", max > 1 && x < max - 1);
                    }
                    if (exRow) {
                        var exFadeQueued = false;
                        exRow.addEventListener(
                            "scroll",
                            function () {
                                if (exFadeQueued) return;
                                exFadeQueued = true;
                                requestAnimationFrame(function () {
                                    exFadeQueued = false;
                                    exFade();
                                });
                            },
                            { passive: true },
                        );
                        // The labels are in a web font; the row is wider once it loads.
                        if (document.fonts && document.fonts.ready)
                            document.fonts.ready.then(function () {
                                if (exActive >= 0) exRevealTab(exTabs[exActive]);
                            });
                    }
                    // Keep the selected tab inside the row, clear of both fades (48px,
                    // the fade's width). Scrolls the row only - asking the element
                    // itself to scroll into view would move the page as well.
                    function exRevealTab(tab) {
                        exFade();
                        var row = tab && tab.parentNode;
                        if (!row || row.scrollWidth <= row.clientWidth + 1) return;
                        var rb = row.getBoundingClientRect();
                        var tb = tab.getBoundingClientRect();
                        var d = 0;
                        if (tb.left < rb.left + 48) d = tb.left - rb.left - 48;
                        else if (tb.right > rb.right - 48) d = tb.right - rb.right + 48;
                        if (d)
                            row.scrollTo({
                                left: row.scrollLeft + d,
                                behavior: exStill() ? "auto" : "smooth",
                            });
                    }
                    function exSetActive(i, announce) {
                        if (i === exActive) return;
                        // A swipe can take away the slide that holds focus (the trends
                        // card's toggle, say). Inert would drop it on <body>; hand it
                        // to the incoming slide's tab instead.
                        var held =
                            exActive >= 0 &&
                            exSlides[exActive].contains(document.activeElement);
                        exActive = i;
                        // The conversation scrolls inside its window, so a slide
                        // coming in reads from its first message, whatever the
                        // visitor left it scrolled to last time.
                        var exThread = exSlides[i].querySelector("[data-ex-thread]");
                        if (exThread) exThread.scrollTop = 0;
                        exSlides.forEach(function (slide, k) {
                            // Off-screen slides leave the tab order and the
                            // accessibility tree - the trends card's buttons would
                            // otherwise be tab stops nobody can see.
                            if (k === i) slide.removeAttribute("inert");
                            else slide.setAttribute("inert", "");
                        });
                        exTabs.forEach(function (tab, k) {
                            var on = k === i;
                            tab.setAttribute("aria-selected", String(on));
                            tab.tabIndex = on ? 0 : -1;
                        });
                        if (held && exTabs[i]) exTabs[i].focus({ preventScroll: true });
                        exRevealTab(exTabs[i]);
                        if (exCount) exCount.textContent = (i < 9 ? "0" : "") + (i + 1);
                        // Only the arrows announce: a tab moved to or clicked is
                        // already read out by its role ("Scan a barcode, selected"),
                        // and a swipe clears the region so it never goes on naming
                        // the slide before.
                        if (exLive)
                            exLive.textContent = announce
                                ? exSlides[i].getAttribute("aria-label") || ""
                                : "";
                    }
                    // Changing slides from deep inside one (the bar stuck under the
                    // header) lands at the top of the new slide, where its
                    // conversation starts, rather than wherever the old one was
                    // scrolled to - on a phone that is often its empty middle.
                    var exBar = document.querySelector("[data-ex-bar]");
                    function exBarOffset() {
                        if (!exBar) return 0;
                        var cs = getComputedStyle(exBar);
                        if (cs.position !== "sticky") return 0;
                        // Where the bar would be if it were not stuck.
                        var rest =
                            exBar.parentNode.getBoundingClientRect().top +
                            parseFloat(cs.marginTop);
                        return exBar.getBoundingClientRect().top - rest;
                    }
                    function exStick() {
                        if (exBar) exBar.classList.toggle("is-stuck", exBarOffset() > 0.5);
                    }
                    if (exBar) {
                        var exStickQueued = false;
                        window.addEventListener(
                            "scroll",
                            function () {
                                if (exStickQueued) return;
                                exStickQueued = true;
                                requestAnimationFrame(function () {
                                    exStickQueued = false;
                                    exStick();
                                });
                            },
                            { passive: true },
                        );
                        exStick();
                    }
                    // The bubbles rise in again - but only for a change the visitor
                    // asked for with a button or a tab. A swipe drags the slide in
                    // with its bubbles already in view, and replaying them there
                    // would blank what the visitor is looking at.
                    function exEnter(slide) {
                        if (exStill()) return;
                        exSlides.forEach(function (s) {
                            s.classList.remove("is-entering");
                        });
                        // Reading a layout property between the two class changes is
                        // what lets the same slide replay its animation.
                        void slide.offsetWidth;
                        slide.classList.add("is-entering");
                    }
                    function exGoTo(i, announce) {
                        var n = exSlides.length;
                        i = ((i % n) + n) % n;
                        if (i !== exActive) exEnter(exSlides[i]);
                        exSetActive(i, announce);
                        var stuck = exBarOffset();
                        if (stuck > 0.5)
                            window.scrollBy({
                                top: -stuck,
                                behavior: exStill() ? "auto" : "smooth",
                            });
                        clearTimeout(exPendingTimer);
                        exPending = exNearest() === i ? null : i;
                        // A scroll the visitor interrupts never arrives; stop waiting.
                        exPendingTimer = setTimeout(function () {
                            exPending = null;
                            exSync();
                        }, 1200);
                        exTrack.scrollTo({
                            left: exLeft(i),
                            behavior: exStill() ? "auto" : "smooth",
                        });
                    }
                    function exSync() {
                        var i = exNearest();
                        if (exPending !== null) {
                            if (i !== exPending) return;
                            exPending = null;
                            clearTimeout(exPendingTimer);
                        }
                        exSetActive(i, false);
                    }
                    var exScrollQueued = false;
                    exTrack.addEventListener(
                        "scroll",
                        function () {
                            if (exScrollQueued) return;
                            exScrollQueued = true;
                            requestAnimationFrame(function () {
                                exScrollQueued = false;
                                exSync();
                            });
                        },
                        { passive: true },
                    );
                    // A width change moves every slide's offset; put the active one
                    // back where it was instead of wherever the old offset now lands.
                    var exResizeQueued = false;
                    window.addEventListener("resize", function () {
                        if (exResizeQueued) return;
                        exResizeQueued = true;
                        requestAnimationFrame(function () {
                            exResizeQueued = false;
                            if (exActive < 0) return;
                            exPending = null;
                            exTrack.scrollTo({ left: exLeft(exActive), behavior: "auto" });
                            exRevealTab(exTabs[exActive]);
                            exStick();
                        });
                    });
                    document.querySelectorAll("[data-ex-dir]").forEach(function (btn) {
                        btn.addEventListener("click", function () {
                            var step = btn.getAttribute("data-ex-dir") === "prev" ? -1 : 1;
                            exGoTo((exPending !== null ? exPending : exActive) + step, true);
                        });
                    });
                    // The tab row is one tab stop (roving tabindex); the arrows move
                    // along it, Home and End jump to its ends, and moving is choosing.
                    // A card's drawer takes focus with preventScroll (shared/
                    // macros.js), which keeps the PAGE still - and, in a thread
                    // that scrolls, can leave the drawer below the window's
                    // edge. So focus arriving inside a thread brings the drawer
                    // (or the focused control) into the THREAD's view, by
                    // scrolling the thread alone: asking the element itself to
                    // scroll into view would move the page as well.
                    function exKeepInThread(thread, el) {
                        var tb = thread.getBoundingClientRect();
                        var eb = el.getBoundingClientRect();
                        var pad = 12;
                        var d = 0;
                        if (eb.bottom > tb.bottom - pad)
                            d = Math.min(eb.bottom - tb.bottom + pad, eb.top - tb.top - pad);
                        else if (eb.top < tb.top + pad) d = eb.top - tb.top - pad;
                        if (Math.abs(d) > 1)
                            thread.scrollTo({
                                top: thread.scrollTop + d,
                                behavior: exStill() ? "auto" : "smooth",
                            });
                    }
                    exSlides.forEach(function (slide) {
                        var thread = slide.querySelector("[data-ex-thread]");
                        if (!thread) return;
                        thread.addEventListener("focusin", function (e) {
                            var target = e.target;
                            if (target === thread) return;
                            var box = (target.closest && target.closest(".drawer")) || target;
                            // After the frame the drawer is laid out in.
                            requestAnimationFrame(function () {
                                exKeepInThread(thread, box);
                            });
                        });
                    });
                    exTabs.forEach(function (tab, i) {
                        tab.addEventListener("click", function () {
                            exGoTo(i, false);
                        });
                        tab.addEventListener("keydown", function (e) {
                            var n = exTabs.length;
                            var to = null;
                            if (e.key === "ArrowRight") to = (i + 1) % n;
                            else if (e.key === "ArrowLeft") to = (i - 1 + n) % n;
                            else if (e.key === "Home") to = 0;
                            else if (e.key === "End") to = n - 1;
                            if (to === null) return;
                            e.preventDefault();
                            exTabs[to].focus();
                            exGoTo(to, false);
                        });
                    });
                    exSync();
                }

                // ---------- live stats: units ----------
                // Every weight the API returns is in grams and every volume in
                // millilitres; both are only ever rendered through these, so the
                // Metric / Imperial toggle is a repaint and never a refetch.
                var UNIT_STORE = "stats-unit";
                var GRAMS_PER = { kg: 1000, lb: 453.59237 };
                var ML_PER = { kg: 1000, lb: 3785.411784 };
                var OUNCE_G = 28.349523125;
                // A remembered choice wins; failing that, the visitor's own
                // measurement system, since "512 kg" is not a quantity most readers of
                // the English page have a feel for.
                var unit = "kg";
                try {
                    var savedUnit = localStorage.getItem(UNIT_STORE);
                    if (savedUnit === "kg" || savedUnit === "lb") unit = savedUnit;
                    else if (/^en-US\b/i.test(navigator.language || "")) unit = "lb";
                } catch (e) {}
                function isMetric() {
                    return unit === "kg";
                }
                function same(v) {
                    return v;
                }
                function toWeight(g) {
                    return g / GRAMS_PER[unit];
                }
                function toVolume(ml) {
                    return ml / ML_PER[unit];
                }
                // A weight row's delta is read in the small unit of whichever system
                // is on screen - grams under kg, ounces under lb. Raw units, not the
                // display ones: a 40 g change is invisible once rounded to kg.
                function weightDelta(diff) {
                    return isMetric()
                        ? { n: diff, unit: " g", dec: 0 }
                        : { n: diff / OUNCE_G, unit: " oz", dec: 1 };
                }
                // Per /api/stats key: how the raw figure converts for display, the unit
                // symbol written beside it, and how the change since page load reads.
                // A key with no "delta" shows none; a key with no "unit" leaves the
                // markup's own alone.
                var FORMATS = {
                    total_calories: {
                        to: same,
                        unit: function () {
                            return "kcal";
                        },
                        delta: function (diff) {
                            return { n: diff, unit: " kcal", dec: 0 };
                        },
                    },
                    food_logs: {
                        to: same,
                        unit: null,
                        // The word after the count ("logs") is the page's own, read
                        // off the tag's data-delta-unit.
                        delta: function (diff, tag) {
                            var word = tag.getAttribute("data-delta-unit") || "";
                            return { n: diff, unit: word ? " " + word : "", dec: 0 };
                        },
                    },
                    timezones: { to: same, unit: null, delta: null },
                    total_protein_g: {
                        to: toWeight,
                        unit: function () {
                            return unit;
                        },
                        delta: weightDelta,
                    },
                    total_carbs_g: {
                        to: toWeight,
                        unit: function () {
                            return unit;
                        },
                        delta: weightDelta,
                    },
                    total_fat_g: {
                        to: toWeight,
                        unit: function () {
                            return unit;
                        },
                        delta: weightDelta,
                    },
                    weight_lost_g: {
                        to: toWeight,
                        unit: function () {
                            return unit;
                        },
                        delta: function (diff) {
                            return { n: toWeight(diff), unit: " " + unit, dec: 1 };
                        },
                    },
                    total_water_ml: {
                        to: toVolume,
                        unit: function () {
                            return isMetric() ? "L" : "gal";
                        },
                        delta: function (diff) {
                            return {
                                n: toVolume(diff),
                                unit: isMetric() ? " L" : " gal",
                                dec: 1,
                            };
                        },
                    },
                };
                // The keys whose display changes with the unit toggle.
                var UNIT_KEYS = Object.keys(FORMATS).filter(function (key) {
                    return FORMATS[key].to !== same;
                });

                // ---------- live stats: count-ups ----------
                // A count-up owns its element's text until the last frame, so anything
                // repainting that element behind its back is undone by the next one.
                // The unit toggle is exactly that, and the frame that wins writes the
                // OLD unit's magnitude under the NEW unit's suffix. So every pending
                // frame is parked here, and a repaint cancels the loop that would
                // overwrite it.
                var pending = new WeakMap();
                function cancelAnim(el) {
                    var h = pending.get(el);
                    if (h) {
                        cancelAnimationFrame(h);
                        pending.delete(el);
                    }
                }
                // Counts from "from" (0 on first paint, the previous value on a live
                // update) to "target", 1.3 s ease-out.
                function animate(el, target, from) {
                    from = from || 0;
                    cancelAnim(el);
                    if (reduceMotion) {
                        el.textContent = fmtInt(target);
                        return;
                    }
                    var dur = 1300,
                        start = null;
                    function step(ts) {
                        if (start === null) start = ts;
                        var p = Math.min((ts - start) / dur, 1);
                        var e = 1 - Math.pow(1 - p, 3);
                        el.textContent = fmtInt(from + (target - from) * e);
                        if (p < 1) pending.set(el, requestAnimationFrame(step));
                        else pending.delete(el);
                    }
                    pending.set(el, requestAnimationFrame(step));
                }
                // Re-triggered on every change so a second change is noticed too.
                function flash(el) {
                    var host = el.closest(".nm-stat-v") || el;
                    host.classList.remove("nm-flash");
                    void host.offsetWidth;
                    host.classList.add("nm-flash");
                }
                function statEls(attr, key) {
                    return document.querySelectorAll("[" + attr + '="' + key + '"]');
                }
                function paintUnit(key) {
                    var c = FORMATS[key];
                    if (!c.unit) return;
                    statEls("data-stat-unit", key).forEach(function (el) {
                        el.textContent = c.unit();
                    });
                }
                // "quiet" repaints the tag without replaying the pop - used when the
                // unit changed but the underlying figure did not.
                function showDelta(key, diff, quiet) {
                    var c = FORMATS[key];
                    if (!c.delta) return;
                    statEls("data-delta", key).forEach(function (tag) {
                        var d = c.delta(diff, tag);
                        var scale = Math.pow(10, d.dec);
                        var n = Math.round(d.n * scale) / scale;
                        tag.classList.toggle("down", n < 0);
                        // Nothing changed means nothing to say: an empty tag rather
                        // than a "+-0" placeholder on every card while the page is
                        // still, so the eye lands only on figures that moved.
                        if (!n) {
                            tag.textContent = "";
                            tag.hidden = true;
                            return;
                        }
                        tag.textContent =
                            (n > 0 ? "+" : "\u2212") + fmtDec(Math.abs(n), d.dec) + d.unit;
                        tag.hidden = false;
                        if (quiet) return;
                        tag.classList.remove("pop");
                        void tag.offsetWidth;
                        tag.classList.add("pop");
                    });
                }

                // "prev" is the last stats object painted, or null on first load.
                // Unchanged figures are left alone so the page is still while nothing
                // happens; changed ones count from old to new and flash.
                function setStats(stats, prev, base) {
                    Object.keys(FORMATS).forEach(function (key) {
                        var c = FORMATS[key];
                        var v = stats[key];
                        if (typeof v !== "number") {
                            // An older public_landing_stats() without this key (the DB
                            // can lag the app on a deploy): hide the card rather than
                            // show NaN.
                            statEls("data-stat-card", key).forEach(function (card) {
                                card.hidden = true;
                            });
                            return;
                        }
                        var before = prev ? prev[key] : null;
                        if (prev && before === v) return;
                        statEls("data-stat", key).forEach(function (el) {
                            animate(
                                el,
                                c.to(v),
                                typeof before === "number" ? c.to(before) : 0,
                            );
                            if (prev) flash(el);
                        });
                        paintUnit(key);
                        if (base) showDelta(key, v - base[key]);
                    });
                    // The "Live" nav badge counts food logs alone, and it is on the nav
                    // of every page - so public/site.js owns it site-wide rather than
                    // this script, which only ships on the landing page. Handing over
                    // the figures already fetched here keeps this page on one poll
                    // instead of two, and passing our own page-load baseline alongside
                    // them keeps the badge showing exactly what the delta tag on the
                    // food-logs card shows.
                    document.dispatchEvent(
                        new CustomEvent("live-stats", {
                            detail: { stats: stats, base: base },
                        }),
                    );
                }

                // ---------- live stats: world map ----------
                var SVGNS = "http://www.w3.org/2000/svg";
                // UTC-equivalent zones all resolve to the map center (lon 0, lat 0 -
                // open ocean), so plotting them drops a bogus dot in the middle of the
                // Atlantic. gen-map-data.ts parks every one of these on null island.
                var UTC_TZS = {
                    UTC: 1,
                    "Etc/UTC": 1,
                    "Etc/GMT": 1,
                    GMT: 1,
                    "Etc/Greenwich": 1,
                };
                // [halo, core] radius per level 1..5. Radii step by roughly sqrt(2) in area
                // terms rather than linearly, because a circle is read by its area:
                // doubling the radius would look like four times the share.
                var TZ_RADII = [
                    [5.5, 2.0],
                    [7.0, 2.5],
                    [9.0, 3.2],
                    [11.5, 3.9],
                    [14.5, 4.7],
                ];
                var tip = document.querySelector(".nm-tz-tip");
                var tipName = tip && tip.querySelector(".nm-tz-tip-n");
                var tipShare = tip && tip.querySelector(".nm-tz-tip-s");
                // "{share} of accounts", in the page's language — the sentence is
                // copy and rides in on the markup, this script holds none.
                var SHARE_PATTERN = tip
                    ? tip.getAttribute("data-share-pattern") || ""
                    : "";
                var tipOn = null;
                var tipShownAt = 0;
                var fmtPct = null;
                try {
                    fmtPct = new Intl.NumberFormat(NUM_LOCALE, { style: "percent" });
                } catch (e) {
                    fmtPct = null;
                }
                // The API rounds every share to whole percent and buckets the whole
                // long tail into 0, which reads as "under 1%" rather than pinpointing
                // the zones holding a single person — see timezoneShares() in
                // src/supabase.ts. The "<" is punctuation, not a word, so it needs no
                // translation; the number beside it is formatted by the browser.
                function shareLine(share) {
                    if (!SHARE_PATTERN) return "";
                    var pct = fmtPct
                        ? fmtPct.format((share > 0 ? share : 1) / 100)
                        : (share > 0 ? share : 1) + "%";
                    return SHARE_PATTERN.replace(
                        "{share}",
                        share > 0 ? pct : "<" + pct,
                    );
                }
                function showTip(core) {
                    if (!tip) return;
                    if (tipOn && tipOn !== core) tipOn.classList.remove("is-on");
                    tipShownAt = Date.now();
                    tipOn = core;
                    core.classList.add("is-on");
                    if (tipName)
                        tipName.textContent = (
                            core.getAttribute("data-tz") || ""
                        ).replace(/_/g, " ");
                    if (tipShare) {
                        var raw = core.getAttribute("data-share");
                        var line = raw === null ? "" : shareLine(Number(raw));
                        tipShare.textContent = line;
                        tipShare.hidden = !line;
                    }
                    // Percentages of the 1000x440 viewBox (map-data.json projects into
                    // 1000x500, but nothing but Antarctica sits below 440, so the box is
                    // cropped like the design's), so the tip tracks the dot at any size.
                    var cx = Number(core.getAttribute("cx"));
                    var cy = Number(core.getAttribute("cy"));
                    var r = Number(core.getAttribute("r"));
                    tip.style.left = cx / 10 + "%";
                    tip.style.top = ((cy - r) / 440) * 100 + "%";
                    tip.hidden = false;
                    // The tip is centred on its dot, so on Auckland or Fiji half of
                    // it hung past the card's edge and was clipped. Once it has a
                    // width, slide it back inside the map by however much it
                    // overhangs; the transform keeps centring it on the dot otherwise.
                    var map = tip.parentNode;
                    if (map && map.getBoundingClientRect) {
                        var box = map.getBoundingClientRect();
                        var half = tip.offsetWidth / 2;
                        var x = (cx / 1000) * box.width;
                        var min = half + 4;
                        var max = box.width - half - 4;
                        if (x < min || x > max) {
                            tip.style.left =
                                Math.max(min, Math.min(max, x)) + "px";
                        }
                    }
                }
                function hideTip() {
                    if (!tip) return;
                    if (tipOn) tipOn.classList.remove("is-on");
                    tipOn = null;
                    tip.hidden = true;
                }
                // Expect this to render sparsely for a while: the 2026-08-15
                // nullable_profile_timezone migration reset every profile's timezone to
                // NULL (see #99), and /api/stats only counts profiles that have set one
                // since - so the map fills back in as people call set_timezone.
                function buildMap(mapData, tzLevels, tzShares) {
                    var svg = document.getElementById("world-svg");
                    if (!svg || !mapData) return;
                    // The svg is a role="group" (not "img", whose children are
                    // presentational) so each focusable timezone dot keeps its own
                    // accessible name; the ~1,000 decorative land dots are one
                    // hidden group so they never enter the tree.
                    var land = document.createElementNS(SVGNS, "g");
                    land.setAttribute("aria-hidden", "true");
                    mapData.land.forEach(function (p) {
                        var c = document.createElementNS(SVGNS, "circle");
                        c.setAttribute("cx", p[0]);
                        c.setAttribute("cy", p[1]);
                        c.setAttribute("r", "2.5");
                        c.setAttribute("class", "nm-land");
                        land.appendChild(c);
                    });
                    svg.appendChild(land);
                    function sizeDot(dot, level) {
                        var r = TZ_RADII[level - 1];
                        dot.halo.setAttribute("r", r[0]);
                        dot.core.setAttribute("r", r[1]);
                        dot.level = level;
                    }
                    // The dot's accessible name carries whatever the tooltip shows,
                    // so the share is not sighted-only. A database that predates
                    // timezone_counts serves no shares at all, and then the name is
                    // just the zone and the tooltip's second line stays hidden.
                    function nameDot(dot, share) {
                        var tz = (dot.core.getAttribute("data-tz") || "").replace(
                            /_/g,
                            " ",
                        );
                        var line = typeof share === "number" ? shareLine(share) : "";
                        if (typeof share === "number")
                            dot.core.setAttribute("data-share", String(share));
                        dot.core.setAttribute(
                            "aria-label",
                            line ? tz + ", " + line : tz,
                        );
                        dot.share = share;
                    }
                    var seen = {};
                    var plotted = 0;
                    var halos = document.createDocumentFragment();
                    var cores = document.createDocumentFragment();
                    Object.keys(tzLevels || {}).forEach(function (tz) {
                        if (UTC_TZS[tz]) return;
                        var pt = mapData.tz[tz];
                        if (!pt) return;
                        var level = Math.min(
                            TZ_RADII.length,
                            Math.max(1, Math.round(tzLevels[tz]) || 1),
                        );
                        var share = tzShares ? tzShares[tz] : undefined;
                        if (typeof share !== "number" || !isFinite(share))
                            share = undefined;
                        // Alias spellings (Europe/Kiev vs Europe/Kyiv) project to the
                        // same coordinates and so share one dot. Keep the larger level
                        // and the larger share rather than whichever name came first —
                        // summing them would double-count a zone the API already
                        // counted once under each spelling.
                        var k = pt[0] + "," + pt[1];
                        if (seen[k]) {
                            if (level > seen[k].level) sizeDot(seen[k], level);
                            if (
                                share !== undefined &&
                                (seen[k].share === undefined ||
                                    share > seen[k].share)
                            )
                                nameDot(seen[k], share);
                            return;
                        }
                        var halo = document.createElementNS(SVGNS, "circle");
                        halo.setAttribute("cx", pt[0]);
                        halo.setAttribute("cy", pt[1]);
                        halo.setAttribute("class", "nm-halo");
                        if (!reduceMotion)
                            halo.style.animationDelay = (plotted % 6) * 0.45 + "s";
                        var core = document.createElementNS(SVGNS, "circle");
                        core.setAttribute("cx", pt[0]);
                        core.setAttribute("cy", pt[1]);
                        core.setAttribute("class", "nm-tz");
                        core.setAttribute("data-tz", tz);
                        // Reachable by keyboard, and named for screen readers by the
                        // same text the tooltip shows. An aria-label rather than a
                        // <title>: browsers render <title> as a native tooltip too,
                        // which showed up as a second, grey copy under ours.
                        core.setAttribute("tabindex", "0");
                        core.setAttribute("role", "img");
                        var dot = { halo: halo, core: core, level: 0 };
                        sizeDot(dot, level);
                        nameDot(dot, share);
                        seen[k] = dot;
                        halos.appendChild(halo);
                        cores.appendChild(core);
                        plotted++;
                    });
                    // Halos first so no halo paints over a neighbouring core.
                    svg.appendChild(halos);
                    svg.appendChild(cores);
                    // Hover, focus and tap all show the tooltip; tapping the same dot
                    // again, leaving, blurring or Escape hide it.
                    svg.addEventListener("mouseover", function (e) {
                        var core = e.target.closest(".nm-tz");
                        if (core) showTip(core);
                    });
                    svg.addEventListener("mouseout", function (e) {
                        if (e.target.closest(".nm-tz")) hideTip();
                    });
                    svg.addEventListener("focusin", function (e) {
                        var core = e.target.closest(".nm-tz");
                        if (core) showTip(core);
                    });
                    svg.addEventListener("focusout", function (e) {
                        if (e.target.closest(".nm-tz")) hideTip();
                    });
                    // A tap arrives as mouseover, focusin, click in one gesture - the
                    // first two show the tip, so the click only counts as "tap again
                    // to dismiss" when the tip has been up for longer than a gesture.
                    svg.addEventListener("click", function (e) {
                        var core = e.target.closest(".nm-tz");
                        if (!core) return;
                        if (
                            tipOn === core &&
                            !tip.hidden &&
                            Date.now() - tipShownAt > 300
                        )
                            hideTip();
                        else showTip(core);
                    });
                    document.addEventListener("keydown", function (e) {
                        if (e.key === "Escape") hideTip();
                    });
                }

                // ---------- live stats: countdown + since-open ----------
                var POLL_MS = 5000;
                var POLL_S = POLL_MS / 1000;
                var RING_LEN = 37.7;
                var countdown = POLL_S;
                var cdEl = document.querySelector("[data-countdown]");
                var cdRing = document.querySelector("[data-countdown-ring]");
                function paintCountdown() {
                    if (cdEl) cdEl.textContent = fmtInt(countdown);
                    if (cdRing)
                        cdRing.style.strokeDashoffset = String(
                            RING_LEN * (1 - countdown / POLL_S),
                        );
                }
                var openedAt = Date.now();
                var sinceEl = document.querySelector("[data-since-open]");
                // The "s" / "m" suffixes are copy, and this script holds none: the
                // browser's own unit data writes them in the page's language ("35s",
                // "35 с", "35秒"). The bare-letter fallback only runs where Intl has
                // no unit style at all.
                var fmtSecs = null;
                var fmtMins = null;
                var fmtHours = null;
                try {
                    fmtSecs = new Intl.NumberFormat(NUM_LOCALE, {
                        style: "unit",
                        unit: "second",
                        unitDisplay: "narrow",
                    });
                    fmtMins = new Intl.NumberFormat(NUM_LOCALE, {
                        style: "unit",
                        unit: "minute",
                        unitDisplay: "narrow",
                    });
                    fmtHours = new Intl.NumberFormat(NUM_LOCALE, {
                        style: "unit",
                        unit: "hour",
                        unitDisplay: "narrow",
                    });
                } catch (e) {
                    fmtSecs = fmtMins = fmtHours = null;
                }
                // Two units at a time, coarsening as the tab stays open: seconds,
                // then minutes and seconds, then hours and minutes. Past an hour the
                // seconds are dropped rather than making a third segment — nobody
                // reads them at that scale, and the chip stops growing.
                function fmtSince(secs) {
                    var h = Math.floor(secs / 3600);
                    var m = Math.floor((secs % 3600) / 60);
                    var s = secs % 60;
                    if (fmtSecs && fmtMins && fmtHours)
                        return secs < 60
                            ? fmtSecs.format(secs)
                            : secs < 3600
                              ? fmtMins.format(m) + " " + fmtSecs.format(s)
                              : fmtHours.format(h) + " " + fmtMins.format(m);
                    return secs < 60
                        ? fmtInt(secs) + "s"
                        : secs < 3600
                          ? fmtInt(m) + "m " + fmtInt(s) + "s"
                          : fmtInt(h) + "h " + fmtInt(m) + "m";
                }
                function paintSince() {
                    if (!sinceEl) return;
                    var secs = Math.max(0, Math.round((Date.now() - openedAt) / 1000));
                    sinceEl.textContent = fmtSince(secs);
                }

                // ---------- live stats: load, then keep live ----------
                var lastStats = null;
                var baseStats = null;
                var pollTimer = null;
                // #facts-live is also what tells public/site.js that this page polls
                // /api/stats for itself (see the live-stats event above).
                var liveEl = document.getElementById("facts-live");

                var unitBtns = [].slice.call(document.querySelectorAll("[data-unit]"));
                function paintUnitToggle() {
                    unitBtns.forEach(function (b) {
                        b.setAttribute(
                            "aria-pressed",
                            b.getAttribute("data-unit") === unit ? "true" : "false",
                        );
                    });
                }
                // Repainted in place rather than through setStats: counting 512 up to
                // 1,129 would read as the figure changing, when all that changed is
                // the unit it is written in. Cancelling first is what makes the toggle
                // win over a count-up already in flight on the same card.
                function repaintUnits() {
                    UNIT_KEYS.forEach(function (key) {
                        paintUnit(key);
                        if (!lastStats) return;
                        var v = lastStats[key];
                        if (typeof v !== "number") return;
                        statEls("data-stat", key).forEach(function (el) {
                            cancelAnim(el);
                            el.textContent = fmtInt(FORMATS[key].to(v));
                        });
                        if (baseStats) showDelta(key, v - baseStats[key], true);
                    });
                }
                paintUnitToggle();
                repaintUnits();
                unitBtns.forEach(function (b) {
                    b.addEventListener("click", function () {
                        var next = b.getAttribute("data-unit");
                        if (next === unit) return;
                        unit = next;
                        try {
                            localStorage.setItem(UNIT_STORE, unit);
                        } catch (e) {}
                        paintUnitToggle();
                        repaintUnits();
                    });
                });

                function fetchStats() {
                    return fetch("/api/stats", { cache: "no-store" }).then(function (r) {
                        if (!r.ok) throw new Error("stats");
                        return r.json();
                    });
                }
                function poll() {
                    pollTimer = null;
                    if (document.hidden) return;
                    fetchStats()
                        .then(function (stats) {
                            setStats(stats, lastStats, baseStats);
                            lastStats = stats;
                            if (liveEl) liveEl.classList.remove("stale");
                        })
                        .catch(function () {
                            if (liveEl) liveEl.classList.add("stale");
                        })
                        .then(function () {
                            countdown = POLL_S;
                            paintCountdown();
                            schedule();
                        });
                }
                function schedule() {
                    if (pollTimer || document.hidden) return;
                    pollTimer = setTimeout(poll, POLL_MS);
                }
                // A background tab stops polling; coming back refetches at once so the
                // figures are never minutes behind.
                document.addEventListener("visibilitychange", function () {
                    if (document.hidden) {
                        clearTimeout(pollTimer);
                        pollTimer = null;
                    } else if (lastStats) {
                        poll();
                    }
                });
                if (liveEl) {
                    Promise.all([
                        fetchStats(),
                        fetch("/map-data.json").then(function (r) {
                            return r.ok ? r.json() : null;
                        }),
                    ])
                        .then(function (res) {
                            var stats = res[0];
                            setStats(stats, null, null);
                            lastStats = stats;
                            // The deltas are measured from this moment.
                            baseStats = stats;
                            buildMap(
                                res[1],
                                stats.timezone_levels,
                                stats.timezone_shares,
                            );
                            liveEl.classList.add("on");
                            paintCountdown();
                            setInterval(function () {
                                if (document.hidden) return;
                                countdown = countdown > 1 ? countdown - 1 : POLL_S;
                                paintCountdown();
                                paintSince();
                            }, 1000);
                            schedule();
                        })
                        .catch(function () {
                            // The countdown row goes too: nothing starts the interval
                            // on this path, so a visible "next in 5s" would sit frozen
                            // above an empty section forever.
                            var row = document.getElementById("stat-row");
                            var map = document.getElementById("map-block");
                            var meta = document.getElementById("live-meta");
                            if (row) row.hidden = true;
                            if (map) map.hidden = true;
                            if (meta) meta.hidden = true;
                        });
                }

                // ---------- latest Patreon posts ----------
                // #patreon-updates ships hidden and stays so unless /api/patreon-posts
                // returns at least one post (a self-hosted deploy with no Patreon
                // credentials gets [] forever). Cards are built from the <template>
                // the generator wrote, so the "read post" label is the page's own.
                var postsBlock = document.getElementById("patreon-updates");
                var postsGrid = document.getElementById("patreon-posts-grid");
                var postTpl = document.getElementById("patreon-post-tpl");
                if (postsBlock && postsGrid && postTpl) {
                    var POST_ICONS = ["fa-camera", "fa-receipt", "fa-square-poll-vertical"];
                    var POST_TINTS = ["nm-c-acc", "nm-c-cal", "nm-c-pro"];
                    fetch("/api/patreon-posts")
                        .then(function (r) {
                            return r.ok ? r.json() : [];
                        })
                        .then(function (posts) {
                            if (!posts || !posts.length) return;
                            posts.slice(0, 3).forEach(function (p, i) {
                                var card =
                                    postTpl.content.firstElementChild.cloneNode(true);
                                card.href = p.url;
                                var tile = card.querySelector("[data-post-tile]");
                                if (tile) tile.classList.add(POST_TINTS[i % 3]);
                                var icon = card.querySelector("[data-post-icon]");
                                if (icon) icon.className = "fa-solid " + POST_ICONS[i % 3];
                                var date = card.querySelector("[data-post-date]");
                                if (date) {
                                    var when = new Date(p.publishedAt);
                                    date.textContent = isNaN(when.getTime())
                                        ? ""
                                        : when.toLocaleDateString(NUM_LOCALE, {
                                              month: "short",
                                              day: "numeric",
                                          });
                                }
                                var title = card.querySelector("[data-post-title]");
                                if (title) title.textContent = p.title || "";
                                var preview = card.querySelector("[data-post-preview]");
                                if (preview) preview.textContent = p.preview || "";
                                postsGrid.appendChild(card);
                            });
                            postsBlock.hidden = false;
                        })
                        .catch(function () {});
                }
            })();`;

/** The number formatting the script itself uses (toLocaleString against
 *  <html lang>), so the static render and the replay agree on "1,059". */
function num(n: number, locale: SiteLocale): string {
    return Math.round(n).toLocaleString(HTML_LANG[locale]);
}

// A trusted-HTML field (FAQ answers, install steps, notes) can't call
// pathFor(locale, …) itself, so an in-prose link to another page of the
// site is written as href="/alternatives" data-link="alternatives" and
// rewritten here to the locale-correct path. Without it a translated page
// silently links to the English version (the exact bug the login page
// shipped once — see scripts/gen-legal.ts's localizeCrossLinks).
function localizeLinks(html: string, locale: SiteLocale): string {
    return html.replace(
        /href="\/(alternatives|tools|privacy|terms)" data-link="\1"/g,
        (_m, page: string) => `href="${pathFor(locale, "/" + page)}"`,
    );
}

function stripTags(html: string): string {
    return html
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function faqJsonLdText(entry: FaqEntry): string {
    return entry.jsonLdText ?? stripTags(entry.visibleHtml);
}

// -------------------------------------------------------------------- hero

// The barcode "photo" in the hero chat: the design's bar pattern, drawn
// once here as <rect>s. Odd entries are gaps.
const BARCODE_BARS = [
    3, 1, 1, 2, 1, 3, 1, 1, 2, 2, 1, 1, 3, 1, 2, 1, 1, 1, 3, 2, 1, 1, 2, 1, 1,
    3, 1, 2, 1, 1, 2, 3, 1, 1, 1, 2, 1, 3, 1, 1, 2, 1, 1, 2, 3, 1, 1,
];
const BARCODE_DIGITS = "5449000000996";

function barcodeSvg(): string {
    let x = 0;
    const rects: string[] = [];
    BARCODE_BARS.forEach((w, i) => {
        const at = x;
        x += w + (i % 2 ? 1 : 0.6);
        if (i % 2) return;
        rects.push(
            `<rect x="${Number(at.toFixed(1))}" y="0" width="${w}" height="40"></rect>`,
        );
    });
    return `<svg viewBox="0 0 120 40" aria-hidden="true">${rects.join("")}</svg>`;
}

// ---------------------------------------------- the real widget cards
//
// The cards on this page — the get_nutrition_summary card in the hero chat
// and the eight on the examples slides (see renderExampleCard) — are not
// approximations of the in-chat widgets. They ARE the in-chat widgets,
// rendered at BUILD TIME: src/widget-static.ts evaluates the very shared
// partials the iframe runs (shared/macros.js, shared/spark.js,
// shared/summary-card.js, shared/trends-card.js and everything under them)
// in a sandbox with no DOM, and hands back the same string chat gets.
//
// What used to sit here instead was a second implementation of a card —
// renderWidget(), a hardcoded TREND_POINTS polyline, a WIDGET_GOALS object,
// and seventeen hand-translated labels per locale — and it had already
// drifted from the thing it was drawing: "Kohlenhydrate" where the widget
// deliberately abbreviates to "Kohlenh." (the long form truncates in that
// tile), 糖類 where the widget says 糖質, thousands separators typed with
// the wrong codepoint in fr and uk. Those strings are gone; WIDGET_STRINGS
// owns them, in one place, for the chat card and the page card alike.
//
// src/widget-card.test.ts is the enforcement: it re-renders both cards from
// these same payloads and requires the result to appear VERBATIM in the
// generated HTML. So an edit to any public/widgets/src/shared/ partial, to
// a card partial, or to src/copy/widgets.ts fails that test until this
// generator has been re-run — the generated-output staleness this repo
// keeps rediscovering, caught by a test instead of by a reader.

type Totals = {
    kcal: number;
    pro: number;
    car: number;
    fat: number;
    water: number;
    sugar: number;
    caf: number;
    fib: number;
};

/** Every exchange's deltas summed — the whole thread, or the first
 *  `upto + 1` exchanges of it, which is the state the card is in when the
 *  thread has played that far. Exported for src/widget-card.test.ts, which
 *  reconciles each rendered card state against it. */
export function sumExchanges(
    exchanges: HeroExchange[],
    upto: number = exchanges.length - 1,
): Totals {
    const t: Totals = {
        kcal: 0,
        pro: 0,
        car: 0,
        fat: 0,
        water: 0,
        sugar: 0,
        caf: 0,
        fib: 0,
    };
    for (const ex of exchanges.slice(0, upto + 1)) {
        for (const k of Object.keys(t) as (keyof Totals)[]) {
            t[k] += ex.add[k] ?? 0;
        }
    }
    return t;
}

/** The meals the thread has logged through exchange `upto`, in order —
 *  what the card's drawer opens onto. An exchange with no `meal` logged no
 *  food (the water one, the closing question), and a meal row for it would
 *  sit in every metric's breakdown reading zero. */
function mealsThrough(
    exchanges: HeroExchange[],
    upto: number,
): DemoMealInput[] {
    const out: DemoMealInput[] = [];
    for (const ex of exchanges.slice(0, upto + 1)) {
        if (!ex.meal) continue;
        out.push({
            description: ex.meal.description,
            meal_type: ex.meal.type,
            add: ex.add,
        });
    }
    return out;
}

/** One state of the hero's summary card. */
export interface HeroCardState {
    /** The exchange indices this one card is brought in after. More than
     *  one when consecutive widget exchanges log nothing between them —
     *  the thread's closing "How am I doing today?" adds no food, so it
     *  shows the card the meal before it produced rather than a second,
     *  byte-identical copy of it. */
    indices: number[];
    payload: SummaryPayload;
}

/** Every distinct summary card the hero thread passes through, in order.
 *
 *  The payload is the real get_nutrition_summary shape (src/copy/widget-demo.ts
 *  maps the thread's own `add` deltas onto the tool's keys and supplies the
 *  demo account's goals), so the card computes every figure, every delta
 *  word, every `.over` state, the ring's offset and each tile's wash the
 *  same way the tool's does. */
export function heroCardStates(
    doc: IndexDoc,
    locale: SiteLocale,
): HeroCardState[] {
    const exchanges = doc.hero.chat.exchanges;
    const states: HeroCardState[] = [];
    let lastKey = "";
    exchanges.forEach((ex, i) => {
        if (!ex.widget) return;
        const payload: SummaryPayload = {
            ...demoSummaryPayload(
                sumExchanges(exchanges, i),
                mealsThrough(exchanges, i),
            ),
            // THE PAYLOAD'S LOCALE IS THE PAGE'S. The widget runtime resolves
            // which dictionary to repaint in from this field
            // (setLocaleFrom in shared/i18n.js, via boot.js's useCard), so a
            // payload that said "en" on /de would leave the German card
            // correct until the first tap and English afterwards. In chat the
            // same field carries the user's own profile locale; here the
            // page's language IS the user's.
            locale,
        };
        const key = JSON.stringify(payload);
        const prev = states[states.length - 1];
        if (prev && key === lastKey) {
            prev.indices.push(i);
            return;
        }
        lastKey = key;
        states.push({ indices: [i], payload });
    });
    return states;
}

/** Which window the trends card opens on.
 *
 *  The middle one, not the payload's own `default_range`: 7 days of this
 *  series is a week with nothing missing, and the card's whole point here is
 *  that it reports what is and is not there — at 14 the header reads "13 of
 *  14 days logged" and the chart carries the skipped day. It is also the
 *  honest no-script state, since a visitor without JS never sees the other
 *  two. The emitted payload says the same number, so the pressed button, the
 *  JSON and the runtime's own fallback (boot.js prefers the pressed range)
 *  cannot disagree. */
export const LANDING_TRENDS_RANGE = 14;

/** The get_trends payload behind the examples card, for `locale`. */
export function trendsCardPayload(locale: SiteLocale): TrendsPayload {
    return { ...DEMO_TRENDS, locale, default_range: LANDING_TRENDS_RANGE };
}

/** The settings note, put where bridge.js would have put it.
 *
 *  In chat a MutationObserver in shared/bridge.js keeps one `.wnote` as the
 *  last child of the card's last `[data-widget-foot]`, whatever a template
 *  repaints. This page loads no bridge — there is no host to handshake with
 *  and no iframe to size — so the note is written into the same slot here,
 *  from the same string (`T.chrome.widgetsNote`). It is kept because it is
 *  true on this page too: widget display is a setting, and this is the only
 *  place that says so. */
function withSettingsNote(card: string, locale: SiteLocale): string {
    const marker = "data-widget-foot>";
    const at = card.lastIndexOf(marker);
    if (at < 0) {
        throw new Error(
            "the rendered widget card has no [data-widget-foot] to put the settings note in — " +
                "macroPanel emits one on every strip, so either the card is an empty state or that changed",
        );
    }
    const open = at + marker.length;
    const close = card.indexOf("</div>", open);
    if (close < 0 || card.slice(open, close).includes("<div")) {
        throw new Error(
            "the widget card's foot is no longer a flat <div> — find its real end before inserting the settings note",
        );
    }
    const note = WIDGET_STRINGS[locale]?.chrome.widgetsNote;
    if (!note) {
        throw new Error(
            `WIDGET_STRINGS has no "${locale}" entry, so the card's settings note has no wording`,
        );
    }
    return `${card.slice(0, close)}<div class="wnote">${esc(note)}</div>${card.slice(close)}`;
}

/** JSON for a `<script type="application/json">` body. Only `<` needs
 *  escaping — the element is raw text, so nothing in it is parsed as an
 *  entity, but a literal `</script` anywhere inside would end it early. */
function payloadJson(payload: unknown): string {
    return JSON.stringify(payload).replace(/</g, "\\u003c");
}

/** One card, wrapped the way the widget runtime and the scoped stylesheet
 *  both expect (see the header of public/widgets/src/site/boot.js):
 *
 *    `.nm-widget-card` is the scope src/widget-css.ts rewrote every widget
 *    selector under, and it is also the container the width queries resolve
 *    against — so the card sizes to the card, not to the viewport.
 *
 *    `.wrap` IS the widget's `#root` (shared/base.css). Reproducing that
 *    nesting is not decoration: `.wrap > .card` is what flattens the
 *    outermost card — no border, no radius, no shadow — because in chat the
 *    host has already drawn those. Drop the `.wrap` and the card grows a
 *    second edge just inside the frame the page draws for it.
 *
 *    The payload `<script>` is what makes the card live: /widget-card.js
 *    re-runs the same emitter on the same payload to rebuild the ctx its
 *    handlers resolve through. */
function widgetCardBlock(
    kind: Exclude<CardKind, "import-meals">,
    card: string,
    payload: unknown,
    locale: SiteLocale,
    indent: string,
    attrs = "",
): string {
    return `${indent}<div class="nm-widget-card" data-widget="${kind}"${attrs}>
${indent}    <div class="wrap">${withSettingsNote(card, locale)}
${indent}    </div>
${indent}    <script type="application/json" data-widget-payload="${kind}">${payloadJson(payload)}</script>
${indent}</div>`;
}

/** The hero states the thread passes through BEFORE the one it ends on,
 *  parked outside the conversation for the replay to bring in.
 *
 *  Real elements in the document from the start, not `<template>` content:
 *  /widget-card.js binds each card once, on load, to the element its
 *  handlers resolve their data through (macroStash, shared/macros.js). A
 *  card cloned into the thread afterwards would be a card whose taps
 *  resolve to whichever card stashed last, so the replay MOVES these
 *  instead — see the hero chat block in LANDING_SCRIPT.
 *
 *  Empty with the thread as it stands: its two widget exchanges produce one
 *  state, because the closing "How am I doing today?" logs nothing and the
 *  card it shows is the one the meal before it produced. */
function parkedHeroCards(cards: LandingCards): string {
    const parked = cards.hero.slice(0, -1);
    if (!parked.length) return "";
    return `                        <div class="nm-hero-cards" hidden>
${parked.join("\n")}
                        </div>
`;
}

/** The scoped widget stylesheet, plus the one thing about these cards that
 *  is the PAGE's business rather than the widget's.
 *
 *  This is the landing page only — deliberately not in HEAD_ASSETS. It is
 *  ~60 KB of CSS for the nine cards that exist on one
 *  page, and every other generated page would carry it for nothing.
 *
 *  The inline block is the house rule for layout only one page needs
 *  (CLAUDE.md): scoped under the body class, shared tokens and classes
 *  only, no colour literal, no fork of a shared block. It reaches the
 *  scope element and stops there — nothing in it selects inside a card. */
const WIDGET_CARD_HEAD = `        <link rel="stylesheet" href="/widget-card.css" />
        <style>
            /* THIS PAGE IS THE HOST. In chat, Claude and ChatGPT each draw
               the frame around the widget's iframe, which is exactly why
               \`.wrap > .card\` (public/widgets/src/shared/base.css) makes the
               outermost card flat — no border, no radius, no shadow, so the
               card never doubles an edge the host has already drawn. There
               is no host out here, so the frame is drawn once, on the scope
               element, and the card inside it stays byte-for-byte what chat
               gets. \`--r-card\` and \`--line\` are the widget's own tokens,
               defined on this very element by /widget-card.css, so the frame
               and the hairlines inside it can never drift apart. */
            body.landing .nm-widget-card {
                flex: none;
                align-self: stretch;
                border: 1px solid var(--line);
                border-radius: var(--r-card);
                overflow: hidden;
            }
        </style>`;

/** The runtime, on the landing page only and after the page's own script.
 *
 *  Two files, both deferred, and the ORDER IS LOAD-BEARING: deferred
 *  scripts run in document order, and /widget-card.js reads the dictionary
 *  the locale file put on window. Without the first the second warns once
 *  and leaves the cards exactly as they were rendered — which is a readable,
 *  correct, static card, so this is progressive enhancement rather than a
 *  dependency. */
const WIDGET_CARD_SCRIPTS = (locale: SiteLocale): string =>
    `        <script src="/widget-card.${locale}.js" defer></script>
        <script src="/widget-card.js" defer></script>`;

/** NO `.nm-c-*` TINT MAY SIT ABOVE A CARD.
 *
 *  The site's colour roles set `--c` (styles.css), and `--c` inherits. The
 *  widget's focus panel reads a BARE `var(--c)` with no fallback, because
 *  inside a widget the card itself always sets one (`.card.c-cal`) — so a
 *  `.nm-c-pro` wrapper anywhere above a card would not tint it, it would
 *  quietly blank the ring and the panel. The hero sits in an untinted chat
 *  and the examples panel is untinted too; both are two edits away from not
 *  being, and neither would fail anything else. */
async function assertCardsAreUntinted(
    html: string,
    file: string,
): Promise<void> {
    let tinted = 0;
    await new HTMLRewriter()
        .on('[class*="nm-c-"] .nm-widget-card', {
            element() {
                tinted++;
            },
        })
        .transform(new Response(html))
        .text();
    if (tinted) {
        throw new Error(
            `${file}: ${tinted} widget card(s) sit inside an .nm-c-* element. ` +
                `--c inherits and the focus panel reads a bare var(--c), so the ring and the panel would render uncoloured. ` +
                `Move the card out of the tinted wrapper.`,
        );
    }
}

/** Two cards mean two of everything the widgets id, and ids are
 *  document-global. The drawer's id is per-strip and CALLER-supplied
 *  (macroDrawerId, shared/macros.js), and both card partials now forward
 *  the `idPrefix` they are handed down to macroPanel, so two strips on one
 *  page no longer collide there. Everything else a card ids is still
 *  document-global and NOT prefixed — `#tr-body`, `#tr-meta` and the chart
 *  gradient ids — so a second trends card, or a card partial that grows a
 *  new fixed id, still collides. This is what says so out loud. */
function assertIdsAreUnique(html: string, file: string): void {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const m of html.matchAll(/\sid="([^"]*)"/g)) {
        const id = m[1]!;
        if (seen.has(id)) dupes.add(id);
        seen.add(id);
    }
    if (dupes.size) {
        throw new Error(
            `${file}: duplicate id(s) ${[...dupes].join(", ")}. ` +
                `A strip's drawer ids take a distinct idPrefix per card (summaryCard/trendsView forward it to macroPanel); ` +
                `the card's other ids — #tr-body, #tr-meta, the chart gradients — are fixed, so those need a real fix, not a prefix.`,
        );
    }
}

/** Every kind of card the landing page renders. */
export type CardKind =
    | "nutrition-summary"
    | "trends"
    | "meal-logged"
    | "goal-progress"
    | "weight-trends"
    | "import-meals";

/** The card an example slide shows, with the payload it is drawn from. */
export type ExampleCard =
    | { kind: "trends"; payload: TrendsPayload }
    | { kind: "meal-logged"; payload: MealProgressPayload }
    | { kind: "goal-progress"; payload: GoalProgressPayload }
    | { kind: "weight-trends"; payload: WeightTrendsPayload }
    | { kind: "import-meals"; payload: StartImportPayload };

/** The tool whose outputSchema each example card's payload stands in for. */
export const EXAMPLE_CARD_TOOL: Record<ExampleCard["kind"], DemoTool> = {
    trends: "get_trends",
    "meal-logged": "log_meal",
    "goal-progress": "get_goal_progress",
    "weight-trends": "get_weight_trends",
    "import-meals": "start_meal_import",
};

/** How many `cardMeals` a card of each kind lists. */
const CARD_MEALS: Record<ExampleCard["kind"], number> = {
    trends: 0,
    "meal-logged": 1,
    "goal-progress": DEMO_GOAL_PROGRESS_MEALS.length,
    "weight-trends": 0,
    "import-meals": 0,
};

/** The strip's drawer ids on an example card. Ids are document-global and
 *  the page holds seven strips besides the hero's, so each card takes its slide's id. */
export const exampleIdPrefix = (id: ExampleSlideId): string => `ex-${id}`;

/** The card behind a slide, for `locale`, or null on a slide without one.
 *  Figures are src/copy/widget-demo.ts's; the meal descriptions are the
 *  slide's own `cardMeals`, in the page's language. */
export function exampleCardPayload(
    slide: ExampleSlide,
    locale: SiteLocale,
): ExampleCard | null {
    if (!slide.widget) return null;
    const meals = slide.cardMeals ?? [];
    if (
        meals.length !== CARD_MEALS[slide.widget] ||
        meals.some((m) => typeof m !== "string" || !m.trim())
    ) {
        throw new Error(
            `${locale}: examples slide "${slide.id}" needs exactly ${CARD_MEALS[slide.widget]} non-empty cardMeals for its ${slide.widget} card, got ${meals.length}.`,
        );
    }
    switch (slide.widget) {
        case "trends":
            return { kind: "trends", payload: trendsCardPayload(locale) };
        case "meal-logged":
            if (!(slide.id in DEMO_EXAMPLE_MEALS))
                throw new Error(
                    `examples slide "${slide.id}" shows a meal-logged card, but DEMO_EXAMPLE_MEALS (src/copy/widget-demo.ts) has no meal for it`,
                );
            return {
                kind: "meal-logged",
                payload: demoExampleMealLogged(
                    slide.id as DemoExampleMealSlide,
                    meals[0]!,
                    locale,
                ),
            };
        case "goal-progress":
            return {
                kind: "goal-progress",
                payload: demoGoalProgressPayload(meals, locale),
            };
        case "weight-trends":
            return {
                kind: "weight-trends",
                payload: demoWeightTrendsPayload(locale),
            };
        case "import-meals":
            return {
                kind: "import-meals",
                payload: demoStartImportPayload(locale),
            };
    }
}

/** An example card's markup, exactly as the emitters return it (before the
 *  settings note). src/widget-card.test.ts renders through this too. */
export async function renderExampleCard(
    card: ExampleCard,
    slideId: ExampleSlideId,
    locale: SiteLocale,
): Promise<string> {
    const idPrefix = exampleIdPrefix(slideId);
    switch (card.kind) {
        case "trends":
            return renderTrendsCard(
                card.payload,
                locale,
                LANDING_TRENDS_RANGE,
                { idPrefix },
            );
        case "meal-logged":
            return renderMealLoggedCard(card.payload, locale, { idPrefix });
        case "goal-progress":
            return renderGoalProgressCard(card.payload, locale, { idPrefix });
        case "weight-trends":
            // Its own default window: get_weight_trends called with no
            // `days`, as the conversation does.
            return renderWeightTrendsCard(
                card.payload,
                locale,
                card.payload.default_range,
            );
        case "import-meals":
            return renderImportFileStep(card.payload, locale);
    }
}

/** An example card wrapped for the page.
 *
 *  Seven are live (widgetCardBlock, bound by /widget-card.js). The importer is
 *  a STILL PICTURE of its first step: its real flow parses a file in the
 *  browser and calls bulk_import_meals, neither of which means anything on
 *  this page. So it ships no payload, its controls are `inert`, and the
 *  wrapper is one `role="img"` named by `examples.importerAlt`. The
 *  `data-widget` value still matters: the importer's scoped CSS hangs off
 *  `:where([data-widget="import-meals"])` (scripts/gen-widget-card.ts). The
 *  `.page` class is the importer template's own root class. */
function exampleCardBlock(
    card: ExampleCard,
    markup: string,
    doc: IndexDoc,
    locale: SiteLocale,
    indent: string,
): string {
    if (card.kind !== "import-meals")
        return widgetCardBlock(card.kind, markup, card.payload, locale, indent);
    // The caption is what tells a MOUSE or TOUCH user it is a picture: the
    // dashed drop zone still looks like a button, and role="img" + inert only
    // reach a keyboard and a screen reader. It repeats what the image's name
    // already says, so it is hidden from assistive tech.
    return `${indent}<div class="nm-widget-card" data-widget="import-meals" role="img" aria-label="${attr(doc.examples.importerAlt)}">
${indent}    <div class="wrap page" inert>${withSettingsNote(markup, locale)}
${indent}    </div>
${indent}</div>
${indent}<p class="nm-ex-still" aria-hidden="true"><i class="fa-solid fa-eye"></i> ${esc(doc.examples.importerCaption)}</p>`;
}

/** Every card of one locale's page, rendered and wrapped. */
export interface LandingCards {
    /** One block per distinct hero state, in thread order. The last is the
     *  state the thread ends on and the one rendered into the conversation;
     *  any earlier ones are parked outside it for the replay to bring in. */
    hero: string[];
    /** One block per example slide that shows a card, keyed by slide id. */
    examples: Partial<Record<ExampleSlideId, string>>;
}

async function renderLandingCards(
    doc: IndexDoc,
    locale: SiteLocale,
): Promise<LandingCards> {
    // First, so a locale still missing a slide's card fields fails by name
    // rather than half-way through a payload.
    assertExamplesMirrorEnglish(doc, locale);
    const states = heroCardStates(doc, locale);
    if (!states.length) {
        throw new Error(
            "no hero exchange is marked `widget: true`, so the landing page would ship a chat with no summary card",
        );
    }
    const exampleCards = doc.examples.slides.flatMap((s) => {
        const card = exampleCardPayload(s, locale);
        return card ? [{ slide: s, card }] : [];
    });
    // Against the LIVE outputSchemas, before a single card is drawn — the
    // same guard scripts/widget-harness.ts runs over its fixtures, and for
    // the same reason: a payload the tool would never send renders a card
    // that quietly falls back. It also catches the failure Zod does not
    // raise, a key `z.object()` strips rather than rejects.
    for (const s of states)
        await validateDemoPayload("get_nutrition_summary", s.payload);
    for (const { card } of exampleCards)
        await validateDemoPayload(EXAMPLE_CARD_TOOL[card.kind], card.payload);
    const examples: LandingCards["examples"] = {};
    for (const { slide, card } of exampleCards) {
        examples[slide.id] = exampleCardBlock(
            card,
            await renderExampleCard(card, slide.id, locale),
            doc,
            locale,
            " ".repeat(36),
        );
    }
    const hero: string[] = [];
    for (const s of states) {
        hero.push(
            widgetCardBlock(
                "nutrition-summary",
                await renderSummaryCard(s.payload, locale),
                s.payload,
                locale,
                " ".repeat(28),
                // Which exchanges this card is brought in after; the replay
                // reads it to know which state belongs where. Space-separated
                // because one card can serve two exchanges (HeroCardState).
                ` data-hero-card="${attr(s.indices.join(" "))}"`,
            ),
        );
    }
    return { hero, examples };
}

/** One exchange of the hero thread, statically.
 *
 *  The bubble carries ONE attribute, the clock the replay puts in the chat
 *  header while it plays. It used to carry two more, and both are gone
 *  because nothing reads them any more: the nutrient deltas are consumed at
 *  BUILD time (heroCardStates turns them into the card's payload), and which
 *  exchange the card follows is on the card, as `data-hero-card`. An
 *  attribute nothing reads is a contract that looks live and is not — and
 *  both of those facts are now on the page in the one place they can be
 *  checked against what they claim: the card itself. */
function renderExchange(doc: IndexDoc, ex: HeroExchange): string {
    const data = ` data-clock="${attr(ex.clock)}"`;
    const user = ex.barcode
        ? `                            <div class="nm-msg nm-msg-barcode"${data}>
                                <div class="nm-barcode">
                                    ${barcodeSvg()}
                                    <span class="nm-barcode-digits">${BARCODE_DIGITS}</span>
                                </div>
                                <div class="nm-barcode-cap">${esc(doc.hero.chat.photoCaption)}</div>
                            </div>`
        : `                            <div class="nm-msg nm-msg-user"${data}>${esc(ex.userText ?? "")}</div>`;
    return `${user}
                            <div class="nm-msg nm-msg-ai">${esc(ex.aiText)}</div>`;
}

function renderHero(
    doc: IndexDoc,
    locale: SiteLocale,
    cards: LandingCards,
): string {
    const hero = doc.hero;
    const exchanges = hero.chat.exchanges;
    const lastClock = exchanges.length
        ? exchanges[exchanges.length - 1]!.clock
        : "";
    return `            <section class="nm-section nm-hero" id="top" aria-labelledby="hero-title">
                <div>
                    <h1 class="nm-h1" id="hero-title">
                        ${esc(hero.titleBeforeEm)}<span class="nm-em">${esc(hero.titleEm)}<span class="nm-underline" aria-hidden="true"></span></span>${esc(hero.titleAfterEm)}
                    </h1>
                    <p class="nm-lead">${esc(hero.lead)}</p>
                    <div class="nm-hero-actions">
                        <a class="nm-btn nm-btn-primary" href="${hashPath(locale, "connect")}"
                            >${esc(hero.ctaPrimary)}
                            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i
                        ></a>
                        <a class="nm-btn nm-btn-glass" href="${GITHUB}" ${EXT}>
                            <i class="fa-brands fa-github" aria-hidden="true"></i>
                            <span>${esc(hero.ctaGithub)}</span>
                            <span class="nm-stars"><i class="fa-solid fa-star" aria-hidden="true"></i><span data-gh-stars>—</span></span>
                        </a>
                    </div>
                </div>
                <div class="nm-hero-stage">
                    <div class="nm-chat-shell">
                        <div class="nm-chat">
                            <div class="nm-chat-head">
                                <span class="nm-chat-who">
                                    <span class="nm-avatar" aria-hidden="true">🍏</span>
                                    ${esc(hero.chat.status)}
                                </span>
                                <span class="nm-chat-tools">
                                    <span class="nm-chat-clock" data-chat-clock>${esc(lastClock)}</span>
                                    <button type="button" class="nm-round nm-chat-pause" data-chat-pause aria-pressed="false">
                                        <i class="fa-solid fa-pause" aria-hidden="true"></i>
                                        <span class="vh">${esc(hero.chat.pauseLabel)}</span>
                                    </button>
                                </span>
                            </div>
                            <div class="nm-chat-list" data-chat-list>
${exchanges.map((ex) => renderExchange(doc, ex)).join("\n")}
${cards.hero[cards.hero.length - 1]}
                            </div>
                        </div>
${parkedHeroCards(cards)}                    </div>
                    <a class="nm-more" href="${hashPath(locale, "examples")}"
                        >${esc(hero.moreExamples)}
                        <i class="fa-solid fa-arrow-down" aria-hidden="true"></i
                    ></a>
                </div>
            </section>`;
}

// ---------------------------------------------------------------- sections

const HOW_ICONS = ["fa-plug", "fa-comment-dots", "fa-chart-area"];
const HOW_TINTS = ["nm-c-acc", "nm-c-cal", "nm-c-pro"];

function renderHow(doc: IndexDoc): string {
    const cards = doc.how.steps
        .map(
            (
                s,
                i,
            ) => `                    <div class="nm-card ${HOW_TINTS[i] ?? "nm-c-acc"}">
                        <div class="nm-blob" aria-hidden="true"></div>
                        <div class="nm-card-top">
                            <span class="nm-tile" aria-hidden="true"><i class="fa-solid ${HOW_ICONS[i] ?? "fa-circle"}"></i></span>
                            <span class="nm-count">${esc(doc.how.counter.replace("{n}", String(i + 1)))}</span>
                        </div>
                        <div>
                            <h3>${esc(s.title)}</h3>
                            <p>${esc(s.body)}</p>
                        </div>
                    </div>`,
        )
        .join("\n");
    return `            <section class="nm-section" id="how" aria-labelledby="how-title" data-reveal>
                <div class="nm-head-row">
                    <div>
                        <p class="nm-eyebrow">${esc(doc.how.eyebrow)}</p>
                        <h2 class="nm-h2 nm-h2-narrow" id="how-title">${esc(doc.how.title)}</h2>
                    </div>
                    <p class="nm-sub">${esc(doc.how.sub)}</p>
                </div>
                <div class="nm-cards3" data-reveal="stagger">
${cards}
                </div>
            </section>`;
}

function renderConnect(doc: IndexDoc, locale: SiteLocale): string {
    const c = doc.connect;
    const steps = (list: string[]) =>
        list
            .map(
                (s) =>
                    `                                <li><span>${localizeLinks(s, locale)}</span></li>`,
            )
            .join("\n");
    return `            <section class="nm-section" id="connect" aria-labelledby="connect-title" data-reveal>
                <div class="nm-split">
                    <div>
                        <p class="nm-eyebrow">${esc(c.eyebrow)}</p>
                        <h2 class="nm-h2" id="connect-title">${esc(c.title)}</h2>
                        <p class="nm-sub">${esc(c.sub)}</p>
                        <div class="nm-endpoint">
                            <span class="nm-endpoint-url">${MCP_URL}</span>
                            <button
                                type="button"
                                class="copy-mini nm-copy"
                                data-copy="${MCP_URL}"
                                data-label="${attr(c.copyLabel)}"
                                data-copied-label="${attr(c.copiedLabel)}"
                                aria-label="${attr(c.copyAriaLabel)}"
                            >
                                <i class="fa-solid fa-copy" aria-hidden="true"></i>
                            </button>
                        </div>
                        <ul class="nm-checks">
${c.bullets.map((b) => `                            <li><i class="fa-solid fa-circle-check" aria-hidden="true"></i>${esc(b)}</li>`).join("\n")}
                        </ul>
                    </div>
                    <fieldset class="nm-panel nm-tabs">
                        <legend class="vh">${esc(c.tabsLabel)}</legend>
                        <input type="radio" name="itab" id="itab-claude" class="tab-input" checked />
                        <input type="radio" name="itab" id="itab-chatgpt" class="tab-input" />
                        <input type="radio" name="itab" id="itab-other" class="tab-input" />
                        <div class="nm-seg">
                            <label for="itab-claude" class="seg-claude"
                                ><i class="fa-brands fa-claude" aria-hidden="true"></i>
                                <span>Claude</span></label
                            >
                            <label for="itab-chatgpt" class="seg-chatgpt"
                                ><i class="fa-brands fa-openai" aria-hidden="true"></i>
                                <span>ChatGPT</span></label
                            >
                            <label for="itab-other" class="seg-other"
                                ><i class="fa-solid fa-terminal" aria-hidden="true"></i>
                                <span>${esc(c.otherTabLabel)}</span></label
                            >
                        </div>
                        <div class="nm-tab-panel panel-claude">
                            <ol class="nm-steps">
${steps(c.claude.steps)}
                            </ol>
                            <p class="nm-note">${esc(c.claude.note)}</p>
                        </div>
                        <div class="nm-tab-panel panel-chatgpt">
                            <ol class="nm-steps">
${steps(c.chatgpt.steps)}
                            </ol>
                            <p class="nm-note">${esc(c.chatgpt.note)}</p>
                        </div>
                        <div class="nm-tab-panel panel-other">
                            <!-- prettier-ignore -->
                            <pre class="nm-pre">{
  "mcpServers": {
    "nutrition": {
      "url": "${MCP_URL}"
    }
  }
}</pre>
                            <p>${localizeLinks(c.other.noteHtml, locale)}</p>
                        </div>
                    </fieldset>
                </div>
            </section>`;
}

const ONB_ICONS = [
    "fa-clock-four",
    "fa-bullseye",
    "fa-language",
    "fa-utensils",
];
const ONB_TINTS = ["nm-c-wat", "nm-c-pro", "nm-c-car", "nm-c-cal"];

function renderOnboarding(doc: IndexDoc, locale: SiteLocale): string {
    const o = doc.onboarding;
    // The example phrase is quoted in the locale's own marks („…“, 「…」),
    // not English curly quotes — punctuation is part of the translation.
    const [q1, q2] = QUOTES[locale];
    const cards = o.steps
        .map(
            (s, i) => `                    <div class="nm-onb-card">
                        <div class="nm-onb-step">
                            <span class="nm-tile nm-tile-sm ${ONB_TINTS[i] ?? "nm-c-acc"}" aria-hidden="true"><i class="fa-solid ${ONB_ICONS[i] ?? "fa-circle"}"></i></span>
                            ${esc(o.stepLabel.replace("{n}", String(i + 1)))}
                        </div>
                        <h3>${esc(s.title)}</h3>
                        <p>${esc(s.body)}</p>
                        <div class="nm-say"><span class="nm-say-l">${esc(o.justSay)}</span>${q1}${esc(s.say)}${q2}</div>
                    </div>`,
        )
        .join("\n");
    return `            <section class="nm-section" id="onboarding" aria-labelledby="onboarding-title" data-reveal>
                <div class="nm-head-row">
                    <h2 class="nm-h2 nm-h2-narrow" id="onboarding-title">${esc(o.title)}</h2>
                    <p class="nm-sub">${esc(o.sub)}</p>
                </div>
                <div class="nm-onb" data-reveal="stagger">
                    <div class="nm-rail" aria-hidden="true"></div>
${cards}
                </div>
            </section>`;
}

/** What each example slide shows beside its words: the icon and tint of its
 *  left column and its tab, and the MCP tools its conversation calls — each
 *  printed as one row of the tool list under the description: its chip, then
 *  that slide's ExampleSlide.toolNotes line for it. The first row carries the
 *  plug icon; the rest sit under the "Also uses" heading.
 *
 *  STRUCTURE, NOT COPY, and written ONCE for all nine locales: keyed by
 *  ExampleSlide.id, so a translation cannot give a slide another slide's icon
 *  by reordering, and has nothing here to translate. These used to be three
 *  arrays matched to the slides by index. Every tool must be a name
 *  src/mcp.ts registers (src/landing-script.test.ts), so a rename there moves
 *  here too. `Record<ExampleSlideId, …>` means a new id without an entry is a
 *  type error. */
type ExampleMeta = {
    icon: string;
    tint: string;
    tools: [string, ...string[]];
};
export const EX_META: Record<ExampleSlideId, ExampleMeta> = {
    "log-meal": {
        icon: "fa-comment-dots",
        tint: "nm-c-cal",
        tools: ["log_meal", "log_water", "get_current_time"],
    },
    "photo-meal": {
        icon: "fa-camera",
        tint: "nm-c-fat",
        tools: ["log_meal", "search_meals"],
    },
    "scan-barcode": {
        icon: "fa-barcode",
        tint: "nm-c-car",
        tools: ["lookup_barcode", "log_meal"],
    },
    "goals-progress": {
        icon: "fa-bullseye",
        tint: "nm-c-acc",
        tools: ["set_nutrition_goals", "get_goal_progress"],
    },
    "review-week": {
        icon: "fa-chart-area",
        tint: "nm-c-pro",
        tools: ["get_trends"],
    },
    "weight-trend": {
        icon: "fa-weight-scale",
        tint: "nm-c-wat",
        tools: ["log_weight", "get_weight_trends"],
    },
    "meal-patterns": {
        icon: "fa-magnifying-glass-chart",
        tint: "nm-c-fib",
        tools: ["get_meal_patterns"],
    },
    "track-drinks": {
        icon: "fa-beer-mug-empty",
        tint: "nm-c-oil",
        tools: ["set_alcohol_tracking", "log_meal"],
    },
    "import-history": {
        icon: "fa-file-import",
        tint: "nm-c-caf",
        tools: ["start_meal_import", "get_profile", "set_timezone"],
    },
    "export-data": {
        icon: "fa-box-archive",
        tint: "nm-c-sug",
        tools: ["export_all_data"],
    },
};

/** A slide's structure as one comparable line per slide: its id, its widget
 *  and the from / photo sequence of its messages. Everything a translation
 *  must copy and nothing it translates. */
export function exampleStructure(slides: readonly ExampleSlide[]): string[] {
    return slides.map((s) =>
        [
            s?.id,
            // The card, the reply it follows and how many meals it lists:
            // all three are structure, and the last is the one count a
            // translation could get wrong while translating the meals.
            s?.widget
                ? `${s.widget}@${s.widgetAfter ?? "?"}`
                : s?.widgetAfter != null
                  ? `-@${s.widgetAfter}`
                  : "-",
            `meals:${Array.isArray(s?.cardMeals) ? s.cardMeals.length : 0}`,
            ...(Array.isArray(s?.messages)
                ? s.messages.map((m) =>
                      m.from === "user" && m.photo ? `user+${m.photo}` : m.from,
                  )
                : ["(no messages)"]),
        ].join(" "),
    );
}

/** A locale whose slides do not mirror English's structure would render a
 *  different conversation, a missing card or, when a slide still has the old
 *  userText / aiText shape, crash half-way through the page. Refuse it by
 *  name instead. Also refuses an empty bubble (every typed message needs its
 *  words, and only a photo turn may go without a caption), an empty
 *  description, and toolNotes that do not name exactly the slide's EX_META
 *  tools, each with a non-empty line — a missing note would leave a chip
 *  with nothing beside it, or crash on a locale still on the old shape. */
function assertExamplesMirrorEnglish(doc: IndexDoc, locale: SiteLocale): void {
    const en = INDEX.en!.examples.slides;
    const slides = Array.isArray(doc.examples.slides)
        ? doc.examples.slides
        : [];
    const want = exampleStructure(en);
    const got = exampleStructure(slides);
    const diff = want.findIndex((line, i) => got[i] !== line);
    if (diff >= 0 || got.length !== want.length) {
        const i = diff >= 0 ? diff : want.length;
        throw new Error(
            `${locale}: examples.slides must mirror English's structure (ids, widget, message from/photo sequence). ` +
                `Slide ${i + 1}: expected "${want[i] ?? "(none)"}", got "${got[i] ?? "(none)"}".`,
        );
    }
    slides.forEach((s) =>
        s.messages.forEach((m, k) => {
            const photo = m.from === "user" && m.photo;
            if (!photo && !m.text?.trim())
                throw new Error(
                    `${locale}: examples slide "${s.id}" message ${k + 1} has no text.`,
                );
        }),
    );
    for (const key of [
        "threadLabel",
        "importerAlt",
        "importerCaption",
    ] as const)
        if (!doc.examples[key]?.trim())
            throw new Error(`${locale}: examples.${key} is empty.`);
    slides.forEach((s) => {
        // A card follows the reply of the turn whose tool call returned it.
        if (
            s.widget &&
            (!Number.isInteger(s.widgetAfter) ||
                s.messages[s.widgetAfter!]?.from !== "ai")
        )
            throw new Error(
                `${locale}: examples slide "${s.id}" widgetAfter must be the index of the ai reply its ${s.widget} card follows, got ${s.widgetAfter}.`,
            );
        if (!s.description?.trim())
            throw new Error(
                `${locale}: examples slide "${s.id}" has no description.`,
            );
        const notes: Record<string, unknown> = s.toolNotes ?? {};
        const want = [...EX_META[s.id].tools].sort().join(",");
        const got = Object.keys(notes).sort().join(",");
        if (got !== want)
            throw new Error(
                `${locale}: examples slide "${s.id}" toolNotes must name exactly its tools (${want}), got "${got || "(none)"}".`,
            );
        for (const [tool, note] of Object.entries(notes))
            if (typeof note !== "string" || !note.trim())
                throw new Error(
                    `${locale}: examples slide "${s.id}" has an empty toolNotes.${tool}.`,
                );
    });
}

/** The meal a user photographs on the photo-meal slide: a bowl of borscht
 *  with sour cream and dill, a slice of rye bread, a spoon on a napkin, on a
 *  wooden table, seen from above. Drawn, not an image file — the page makes
 *  no request for it — and every fill is a token mix in styles.css
 *  (.nm-ex-meal-*), so there is no colour literal here. Those mixes use the
 *  nutrient tokens, so the drawing follows the theme's palette (unlike the
 *  barcode label, which is --paper in both); the photo bubble's frame is
 *  --paper-ink in both themes. aria-hidden, because the bubble around it is
 *  role="img" with the translated examples.photoMealAlt as its name. */
function mealPhotoSvg(): string {
    return `<svg viewBox="0 0 220 140" aria-hidden="true">
<rect class="nm-ex-meal-table" width="220" height="140"></rect>
<path class="nm-ex-meal-grain" d="M0 16c52-5 120 7 220-2M0 50c64-6 132 8 220 0M0 96c44-5 150 9 220-1M0 128c70-4 128 6 220-2"></path>
<rect class="nm-ex-meal-cloth" x="150" y="-18" width="84" height="74" rx="5" transform="rotate(14 192 19)"></rect>
<g class="nm-ex-meal-spoon" transform="rotate(-24 186 26)"><ellipse cx="170" cy="26" rx="10" ry="7"></ellipse><rect x="178" y="24" width="42" height="4" rx="2"></rect></g>
<circle class="nm-ex-meal-shade" cx="85" cy="78" r="57"></circle>
<circle class="nm-ex-meal-bowl" cx="80" cy="72" r="57"></circle>
<circle class="nm-ex-meal-rim" cx="80" cy="72" r="48"></circle>
<circle class="nm-ex-meal-soup" cx="80" cy="72" r="44"></circle>
<g class="nm-ex-meal-beet"><rect x="52" y="52" width="16" height="4" rx="2" transform="rotate(-30 60 54)"></rect><rect x="96" y="92" width="18" height="4" rx="2" transform="rotate(20 105 94)"></rect><rect x="56" y="92" width="14" height="4" rx="2" transform="rotate(40 63 94)"></rect><rect x="100" y="48" width="15" height="4" rx="2" transform="rotate(60 107 50)"></rect><rect x="44" y="72" width="12" height="4" rx="2" transform="rotate(-70 50 74)"></rect></g>
<g class="nm-ex-meal-veg"><rect x="108" y="70" width="10" height="5" rx="2" transform="rotate(15 113 72)"></rect><rect x="70" y="100" width="9" height="5" rx="2" transform="rotate(-20 74 102)"></rect><rect x="62" y="42" width="8" height="5" rx="2"></rect></g>
<path class="nm-ex-meal-cream" d="M66 64c4-10 20-12 27-4 9 0 13 9 8 16-3 8-16 11-25 8-10 0-15-11-10-20z"></path>
<path class="nm-ex-meal-dill" d="M74 66l7 3m-3-6l2 7m9 2l6-5m-3 7l5 2m-17 6l5-5m-1 6l4-3"></path>
<g transform="rotate(-16 176 102)"><path class="nm-ex-meal-crust" d="M144 84c0-16 12-22 22-22h20c10 0 22 6 22 22v36c0 4-3 6-6 6h-52c-3 0-6-2-6-6z"></path><path class="nm-ex-meal-crumb" d="M150 86c0-12 9-17 17-17h18c8 0 17 5 17 17v32c0 2-1 3-3 3h-46c-2 0-3-1-3-3z"></path><g class="nm-ex-meal-seed"><ellipse cx="162" cy="88" rx="2.2" ry="1.2"></ellipse><ellipse cx="184" cy="96" rx="2.2" ry="1.2" transform="rotate(40 184 96)"></ellipse><ellipse cx="170" cy="110" rx="2.2" ry="1.2" transform="rotate(-30 170 110)"></ellipse><ellipse cx="192" cy="112" rx="2.2" ry="1.2"></ellipse><ellipse cx="176" cy="80" rx="2.2" ry="1.2" transform="rotate(70 176 80)"></ellipse></g></g>
</svg>`;
}

/** One bubble of an example conversation. A user photo turn is the picture
 *  (role="img", named by the translated alt) with its optional caption under
 *  it: the meal drawing, or the package's barcode label — the same label the
 *  hero's barcode card draws. */
function renderExampleMessage(
    e: IndexDoc["examples"],
    m: ExampleMessage,
    pad: string,
): string {
    if (m.from === "ai")
        return `${pad}<div class="nm-ex-a">${esc(m.text)}</div>`;
    if (!m.photo) return `${pad}<div class="nm-ex-q">${esc(m.text)}</div>`;
    const snap =
        m.photo === "meal"
            ? `<div class="nm-ex-snap nm-ex-snap-meal" role="img" aria-label="${attr(e.photoMealAlt)}">${mealPhotoSvg()}</div>`
            : `<div class="nm-ex-snap nm-barcode" role="img" aria-label="${attr(e.photoPackageAlt)}">${barcodeSvg()}<span class="nm-barcode-digits">${BARCODE_DIGITS}</span></div>`;
    const cap = m.text ? `<span class="nm-ex-cap">${esc(m.text)}</span>` : "";
    return `${pad}<div class="nm-ex-q nm-ex-q-photo">
${pad}    ${snap}${cap ? `\n${pad}    ${cap}` : ""}
${pad}</div>`;
}

const pad2 = (n: number): string => String(n).padStart(2, "0");

/** The examples carousel.
 *
 *  A header row (title + sub), one bar holding the tabs, the counter and
 *  prev / next, then a horizontal scroll-snap track of full-width slides.
 *  Every slide is the height of the tallest (the track's align-items:
 *  stretch in public/styles.css, not script), so a change of slide never
 *  moves the page, and each chat window ends in a wordless, aria-hidden
 *  composer that makes a short conversation's spare room look like a chat
 *  window rather than a gap. The track is the whole no-script experience —
 *  it swipes, scrolls and snaps on its own, and the bar stays hidden until
 *  script can make it work — and LANDING_SCRIPT keeps the tabs, the
 *  counter, `inert` and a polite announcement in step with wherever the
 *  track is.
 *
 *  THE TABS ARE AN ICON PAGER AT EVERY WIDTH. Ten labelled pills cannot fit
 *  one row at any width the page has, and a labelled row that scrolls hides
 *  most of the choices; ten 46px icons plus the selected tab's label fit a
 *  desktop bar whole, and on narrower bars the row scrolls with a fade on
 *  whichever edge has more tabs past it, the script keeping the selected tab
 *  clear of the fades. An icon tab's accessible name is still its title,
 *  visually hidden and never removed.
 *
 *  Each slide's left column is a compact head (the icon beside the primary
 *  tool the conversation calls and the title) over the description and the
 *  secondary tools; the right column is the chat window, every message a
 *  bubble in order. The slide's aria-label is its position and its title
 *  ("1 of 10: Log in plain words"), so a screen reader entering the panel
 *  hears what it is about — the bar's counter is the one visible position.
 *
 *  At one column (≤860px) the bar is sticky under the header, since a
 *  conversation slide is then taller than the screen and the bar holds the
 *  only controls; the script dresses it as a pill only while it is stuck.
 *
 *  THE TINT IS NEVER ON THE SLIDE. The review-week slide holds the real
 *  trends card, and `--c` inherits into the widget's focus panel (see
 *  assertCardsAreUntinted), so the `.nm-c-*` role sits on the left column —
 *  which the glow and the icon live inside — and on the tab, and nowhere
 *  above a card.
 *
 *  Nothing in the markup is `inert`: a visitor without script can still
 *  reach, read and use every slide. The script makes the off-screen slides
 *  inert once it is there to bring them back. */
function renderExamples(
    doc: IndexDoc,
    locale: SiteLocale,
    cards: LandingCards,
): string {
    assertExamplesMirrorEnglish(doc, locale);
    const e = doc.examples;
    const toolsPath = pathFor(locale, "/tools");
    if (!e.toolLinkLabel.includes("{tool}"))
        throw new Error(
            `${locale}: examples.toolLinkLabel must contain {tool}, so each chip's accessible name contains the tool name it shows.`,
        );
    const total = e.slides.length;
    const position = (i: number): string =>
        `${e.slideLabel
            .replace("{n}", String(i + 1))
            .replace("{total}", String(total))}: ${e.slides[i]!.title}`;
    const slides = e.slides
        .map((s, i) => {
            const meta = EX_META[s.id];
            const [tool, ...moreTools] = meta.tools;
            // Every chip is a link to that tool's card on this locale's tools
            // page (gen-tools.ts gives each card id="<tool name>"). The
            // visible text stays the bare tool name; the accessible name
            // says where it goes and contains that name.
            const toolLink = (t: string, cls: string, lead: string): string =>
                `<a class="${cls}" href="${attr(`${toolsPath}#${t}`)}" aria-label="${attr(e.toolLinkLabel.replace("{tool}", t))}">${lead}<code>${esc(t)}</code><i class="fa-solid fa-arrow-right nm-ex-go" aria-hidden="true"></i></a>`;
            // One row per tool: its chip, then what that tool did in this
            // conversation. The note sits AFTER the link, never inside it, so
            // the link's accessible name stays "<tool> on the Tools page".
            const row = (t: string, cls: string, lead: string): string =>
                `\n                                        <li class="nm-ex-use">${toolLink(t, cls, lead)} <span class="nm-ex-note">${esc(s.toolNotes[t]!)}</span></li>`;
            const more = moreTools.length
                ? `\n                                    <p class="nm-ex-more-l" id="ex-more-${i + 1}">${esc(e.moreToolsLabel)}</p>\n                                    <ul class="nm-ex-tools" aria-labelledby="ex-more-${i + 1}">${moreTools
                      .map((t) => row(t, "nm-ex-chip", ""))
                      .join("")}\n                                    </ul>`
                : "";
            // The real card the conversation's tool call returned, right
            // after the reply of that turn (widgetAfter) — not always the
            // last bubble: log-meal's card follows its first reply, and the
            // water it logs next returns none. The live cards work: drawers,
            // tile taps and the trends / weight 7 / 14 / 30 toggles.
            const card = cards.examples[s.id];
            if (Boolean(s.widget) !== Boolean(card))
                throw new Error(
                    `${locale}: examples slide "${s.id}" ${s.widget ? `wants a ${s.widget} card that was not rendered` : "was rendered a card it does not name"}.`,
                );
            const messages = s.messages
                .map(
                    (m, k) =>
                        renderExampleMessage(e, m, " ".repeat(36)) +
                        (card && k === s.widgetAfter ? `\n${card}` : ""),
                )
                .join("\n");
            return `                        <div class="nm-ex-slide" id="ex-slide-${i + 1}" role="tabpanel" aria-roledescription="${attr(e.slideRole)}" aria-label="${attr(position(i))}" data-ex-id="${attr(s.id)}" data-ex-slide>
                            <div class="nm-ex-info ${meta.tint}">
                                <span class="nm-ex-glow" aria-hidden="true"></span>
                                <span class="nm-ex-icon" aria-hidden="true"><i class="fa-solid ${meta.icon}"></i></span>
                                <h3 class="nm-ex-title">${esc(s.title)}</h3>
                                <p class="nm-ex-desc">${esc(s.description)}</p>
                                <div class="nm-ex-uses">
                                    <ul class="nm-ex-tools">${row(tool!, "nm-ex-tool", `<i class="fa-solid fa-plug" aria-hidden="true"></i>`)}
                                    </ul>${more}
                                </div>
                            </div>
                            <div class="nm-ex-chat">
                                <div class="nm-ex-chat-head">
                                    <span class="nm-chat-who">
                                        <span class="nm-avatar" aria-hidden="true">🍏</span>
                                        ${esc(e.status)}
                                    </span>
                                </div>
                                <div class="nm-ex-thread" role="region" aria-label="${attr(e.threadLabel)}" tabindex="0" data-ex-thread>
${messages}
                                </div>
                                <div class="nm-ex-compose" aria-hidden="true"><i class="fa-solid fa-plus"></i><span class="nm-ex-compose-caret"></span><span class="nm-ex-compose-send"><i class="fa-solid fa-arrow-up"></i></span></div>
                            </div>
                        </div>`;
        })
        .join("\n");
    const tabs = e.slides
        .map((s, i) => {
            const meta = EX_META[s.id];
            return `                    <button type="button" class="nm-ex-tab ${meta.tint}" id="ex-tab-${i + 1}" role="tab" aria-selected="${i === 0}" aria-controls="ex-slide-${i + 1}" tabindex="${i === 0 ? 0 : -1}" data-ex-tab>
                        <span class="nm-ex-dot" aria-hidden="true"><i class="fa-solid ${meta.icon}"></i></span>
                        <span class="nm-ex-tab-name">${esc(s.title)}</span>
                    </button>`;
        })
        .join("\n");
    return `            <section class="nm-section" id="examples" aria-labelledby="examples-title" data-reveal>
                <div class="nm-head-row nm-ex-head">
                    <h2 class="nm-h2 nm-h2-narrow" id="examples-title">${esc(e.title)}</h2>
                    <p class="nm-sub">${esc(e.sub)}</p>
                </div>
                <div class="nm-ex-carousel" role="region" aria-roledescription="${attr(e.carouselRole)}" aria-label="${attr(e.carouselLabel)}">
                    <div class="nm-ex-bar" data-ex-bar>
                        <div class="nm-ex-tabs" role="tablist" aria-label="${attr(e.pickerLabel)}">
${tabs}
                        </div>
                        <div class="nm-ex-nav">
                            <span class="nm-ex-count" aria-hidden="true"><span data-ex-count>01</span><span class="nm-ex-of"> / ${pad2(total)}</span></span>
                            <button type="button" class="nm-round nm-ex-arrow" data-ex-dir="prev" aria-controls="ex-track" aria-label="${attr(e.prevLabel)}"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i></button>
                            <button type="button" class="nm-round nm-ex-arrow" data-ex-dir="next" aria-controls="ex-track" aria-label="${attr(e.nextLabel)}"><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
                        </div>
                    </div>
                    <div class="nm-ex-track" id="ex-track" data-ex-track>
${slides}
                    </div>
                    <p class="vh" aria-live="polite" aria-atomic="true" data-ex-live></p>
                </div>
            </section>`;
}

type StatCard = {
    key: string;
    icon: string;
    tint: string;
    label: string;
    /** The unit the markup rests in (metric); the script repaints it. */
    unit: string;
    dark?: boolean;
    deltaUnit?: string;
};

function renderStatCard(s: StatCard): string {
    const deltaUnit = s.deltaUnit
        ? ` data-delta-unit="${attr(s.deltaUnit)}"`
        : "";
    return `                    <div class="nm-stat${s.dark ? " nm-stat-dark" : ""}" data-stat-card="${s.key}">
                        <div class="nm-stat-top">
                            <span class="nm-tile nm-tile-md ${s.tint}" aria-hidden="true"><i class="fa-solid ${s.icon}"></i></span>
                            <span class="nm-delta" data-delta="${s.key}"${deltaUnit} hidden></span>
                        </div>
                        <div>
                            <b class="nm-stat-v"><span data-stat="${s.key}">—</span><span class="nm-stat-u" data-stat-unit="${s.key}">${s.unit}</span></b>
                            <span class="nm-stat-l">${esc(s.label)}</span>
                        </div>
                    </div>`;
}

function renderLive(doc: IndexDoc): string {
    const l = doc.live;
    const cards: StatCard[] = [
        {
            key: "total_calories",
            icon: "fa-fire",
            tint: "nm-c-cal",
            label: l.cards.calories,
            unit: "kcal",
            dark: true,
        },
        {
            key: "food_logs",
            icon: "fa-utensils",
            tint: "nm-c-cal",
            label: l.cards.foodLogs,
            unit: "",
            deltaUnit: l.foodLogsUnit,
        },
        {
            key: "total_protein_g",
            icon: "fa-dumbbell",
            tint: "nm-c-pro",
            label: l.cards.protein,
            unit: "kg",
        },
        {
            key: "total_carbs_g",
            icon: "fa-wheat-awn",
            tint: "nm-c-car",
            label: l.cards.carbs,
            unit: "kg",
        },
        {
            key: "total_fat_g",
            // An oil bottle in a golden tint, not a droplet in the fat series'
            // pink - that read as a drop of blood next to the weight card.
            icon: "fa-bottle-droplet",
            tint: "nm-c-oil",
            label: l.cards.fat,
            unit: "kg",
        },
        {
            key: "weight_lost_g",
            icon: "fa-weight-scale",
            tint: "nm-c-fib",
            label: l.cards.weightLost,
            unit: "kg",
        },
        {
            key: "total_water_ml",
            icon: "fa-glass-water",
            tint: "nm-c-wat",
            label: l.cards.water,
            unit: "L",
        },
    ];
    return `            <section class="nm-section" id="live" aria-labelledby="live-title" data-reveal>
                <div class="nm-head-row nm-live-head">
                    <div>
                        <p class="nm-eyebrow nm-live-eyebrow">
                            <span class="nm-pulse-dot" aria-hidden="true"></span>${esc(l.eyebrow)}
                        </p>
                        <h2 class="nm-h2" id="live-title">${esc(l.title)}</h2>
                        <p class="nm-sub">${esc(l.sub)}</p>
                    </div>
                    <div class="nm-units" role="group" aria-label="${attr(l.unitGroupLabel)}">
                        <button type="button" data-unit="kg" aria-pressed="true">${esc(l.unitMetricLabel)}</button>
                        <button type="button" data-unit="lb" aria-pressed="false">${esc(l.unitImperialLabel)}</button>
                    </div>
                </div>
                <div class="nm-live-meta" id="live-meta">
                    <span id="facts-live" class="nm-refresh">
                        <svg class="nm-refresh-ring" viewBox="0 0 16 16" aria-hidden="true">
                            <circle class="nm-refresh-track" cx="8" cy="8" r="6"></circle>
                            <circle class="nm-refresh-arc" cx="8" cy="8" r="6" transform="rotate(-90 8 8)" data-countdown-ring></circle>
                        </svg>
                        <span>${esc(l.refreshBefore)}<b data-countdown>5</b>${esc(l.refreshAfter)}</span>
                    </span>
                    <span class="nm-since"><i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i>${esc(l.sinceOpenLabel)} · <span data-since-open>0s</span></span>
                </div>
                <div class="nm-stats" id="stat-row" data-reveal="stagger">
${cards.map(renderStatCard).join("\n")}
                </div>
                <div class="nm-map-card" id="map-block">
                    <div class="nm-map-head">
                        <span class="nm-tz-chip"><i class="fa-solid fa-earth-americas" aria-hidden="true"></i><b data-stat="timezones">—</b>${esc(l.timezonesAfter)}</span>
                        <span class="nm-map-note">${esc(l.mapNote)}</span>
                    </div>
                    <div class="nm-map">
                        <svg
                            id="world-svg"
                            viewBox="0 0 1000 440"
                            preserveAspectRatio="xMidYMid meet"
                            role="group"
                            aria-label="${attr(l.mapAriaLabel)}"
                        ></svg>
                        <div
                            class="nm-tz-tip"
                            role="tooltip"
                            data-share-pattern="${attr(l.mapShare)}"
                            hidden
                        >
                            <span class="nm-tz-tip-n"></span
                            ><span class="nm-tz-tip-s" hidden></span>
                        </div>
                    </div>
                </div>
            </section>`;
}

function renderSupport(doc: IndexDoc): string {
    const s = doc.support;
    return `            <section class="nm-section" id="support" aria-labelledby="support-title" data-reveal>
                <div class="nm-support-grid">
                    <div class="nm-card-big">
                        <p class="nm-eyebrow">${esc(s.eyebrow)}</p>
                        <h2 class="nm-h2 nm-h2-sm" id="support-title">${esc(s.title)}</h2>
                        <p class="nm-sub">${esc(s.sub)}</p>
                        <ul class="nm-checks">
${s.bullets.map((b) => `                            <li><i class="fa-solid fa-circle-check" aria-hidden="true"></i>${esc(b)}</li>`).join("\n")}
                        </ul>
                    </div>
                    <div class="nm-card-big nm-card-dark nm-c-acc">
                        <div class="nm-blob nm-blob-br" aria-hidden="true"></div>
                        <p class="nm-eyebrow">${esc(s.patreon.eyebrow)}</p>
                        <h3>${esc(s.patreon.title)}</h3>
                        <p class="nm-sub">${esc(s.patreon.sub)}</p>
                        <div class="nm-actions">
                            <a class="nm-btn nm-btn-primary nm-btn-md" href="${PATREON}" ${EXT}>
                                <i class="fa-brands fa-patreon" aria-hidden="true"></i>
                                ${esc(s.patreon.cta)}
                            </a>
                            <a class="nm-btn nm-btn-ghost nm-btn-md" href="${GITHUB}" ${EXT}>
                                <i class="fa-brands fa-github" aria-hidden="true"></i>
                                <span>${esc(s.patreon.starCta)}</span>
                                <span class="nm-stars"><i class="fa-solid fa-star" aria-hidden="true"></i><span data-gh-stars>—</span></span>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="patreon-updates" id="patreon-updates" hidden>
                    <div class="nm-posts-head">
                        <h3><i class="fa-brands fa-patreon" aria-hidden="true"></i>${esc(s.postsTitle)}</h3>
                        <a class="nm-link-acc" href="${PATREON}" ${EXT}
                            >${esc(s.postsAll)}
                            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i
                        ></a>
                    </div>
                    <div class="nm-posts" id="patreon-posts-grid"></div>
                    <template id="patreon-post-tpl">
                        <a class="nm-post" ${EXT}>
                            <span class="nm-post-top">
                                <span class="nm-tile nm-tile-36" data-post-tile aria-hidden="true"><i data-post-icon></i></span>
                                <span class="nm-post-date" data-post-date></span>
                            </span>
                            <b data-post-title></b>
                            <span class="nm-post-preview" data-post-preview></span>
                            <span class="vh">${esc(s.postLinkLabel)}</span>
                        </a>
                    </template>
                </div>
            </section>`;
}

function renderContact(doc: IndexDoc): string {
    const c = doc.contact;
    const row = (
        href: string,
        tint: string,
        icon: string,
        card: { title: string; sub: string },
        external: boolean,
    ) => `                        <a class="nm-row-link" href="${href}"${external ? " " + EXT : ""}>
                            <span class="nm-tile nm-tile-lg ${tint}" aria-hidden="true"><i class="${icon}"></i></span>
                            <span><b>${esc(card.title)}</b><small>${esc(card.sub)}</small></span>
                            <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                        </a>`;
    return `            <section class="nm-section" id="contact" aria-labelledby="contact-title" data-reveal>
                <div class="nm-contact nm-c-acc">
                    <div class="nm-blob nm-blob-tl" aria-hidden="true"></div>
                    <div class="nm-contact-l">
                        <p class="nm-eyebrow">${esc(c.eyebrow)}</p>
                        <h2 class="nm-h2" id="contact-title">${esc(c.title)}</h2>
                        <p class="nm-sub">${esc(c.sub)}</p>
                        <a class="nm-email" href="mailto:${EMAIL}" aria-label="${attr(c.emailAriaLabel)}">
                            <span class="nm-email-addr">${EMAIL}</span>
                            <span class="nm-email-arrow" aria-hidden="true"><i class="fa-solid fa-arrow-right"></i></span>
                        </a>
                    </div>
                    <div class="nm-contact-r">
${row("mailto:" + EMAIL, "nm-c-acc", "fa-solid fa-envelope", c.cards.email, false)}
${row(GITHUB + "/issues", "nm-c-pro", "fa-brands fa-github", c.cards.issues, true)}
${row(PATREON, "nm-c-cal", "fa-brands fa-patreon", c.cards.patreon, true)}
                    </div>
                </div>
            </section>`;
}

const FAQ_CATEGORIES = [
    "all",
    "basics",
    "clients",
    "tracking",
    "data",
] as const;

function renderFaq(doc: IndexDoc, locale: SiteLocale): string {
    const f = doc.faqSection;
    const chips = FAQ_CATEGORIES.map(
        (
            cat,
            i,
        ) => `                        <input type="radio" name="faqcat" id="faqcat-${cat}" class="tab-input"${i === 0 ? " checked" : ""} />
                        <label class="nm-faq-chip" for="faqcat-${cat}">${esc(f.categories[cat])}</label>`,
    ).join("\n");
    const rows = doc.faq
        .map(
            (
                entry,
                i,
            ) => `                    <details class="nm-faq-row" data-cat="${entry.category}">
                        <summary>
                            <span class="nm-faq-n">${String(i + 1).padStart(2, "0")}</span>
                            <span class="nm-faq-q">${esc(entry.question)} <span class="nm-faq-cat">${esc(f.categories[entry.category])}</span></span>
                            <span class="nm-faq-ic" aria-hidden="true"><i class="fa-solid fa-plus"></i></span>
                        </summary>
                        <p>${localizeLinks(entry.visibleHtml, locale)}</p>
                    </details>`,
        )
        .join("\n");
    return `            <section class="nm-section nm-faq" id="faq" aria-labelledby="faq-title" data-reveal>
                <div class="nm-faq-side">
                    <p class="nm-eyebrow">${esc(f.eyebrow)}</p>
                    <h2 class="nm-h2" id="faq-title">${esc(f.title)}</h2>
                    <p class="nm-sub">
                        ${esc(f.subBefore)}<a href="${hashPath(locale, "contact")}">${esc(f.subLink)}</a>${esc(f.subAfter)}
                    </p>
                    <div class="nm-faq-cats" role="radiogroup" aria-label="${attr(f.categoriesLabel)}">
${chips}
                    </div>
                </div>
                <div class="nm-faq-list">
${rows}
                </div>
            </section>`;
}

function renderCta(doc: IndexDoc, locale: SiteLocale): string {
    const c = doc.cta;
    return `            <section class="nm-section nm-cta-sec" aria-labelledby="cta-title" data-reveal>
                <div class="nm-cta-band">
                    <div class="nm-blob nm-blob-bl nm-c-car" aria-hidden="true"></div>
                    <div class="nm-blob nm-blob-tr nm-c-pro" aria-hidden="true"></div>
                    <h2 id="cta-title">${esc(c.title)}</h2>
                    <p>${esc(c.sub)}</p>
                    <div class="nm-cta-actions">
                        <a class="nm-btn nm-btn-primary nm-btn-lg" href="${hashPath(locale, "connect")}">${esc(c.primary)}</a>
                        <a class="nm-btn nm-btn-ghost nm-btn-lg" href="${GITHUB}" ${EXT}>
                            <i class="fa-brands fa-github" aria-hidden="true"></i>
                            <span>${esc(c.secondary)}</span>
                            <span class="nm-stars"><i class="fa-solid fa-star" aria-hidden="true"></i><span data-gh-stars>—</span></span>
                        </a>
                    </div>
                </div>
            </section>`;
}

// -------------------------------------------------------------------- page

export function renderDoc(
    doc: IndexDoc,
    locale: SiteLocale,
    cards: LandingCards,
): string {
    const suffix = "";
    const url = urlFor(locale, suffix);
    const title = esc(doc.title);
    const notice = translationNotice(locale, suffix);

    const softwareAppSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Nutrition MCP",
        description: doc.metaDescription,
        url,
        applicationCategory: "HealthApplication",
        operatingSystem: "Any",
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
        },
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: doc.faq.map((entry) => ({
            "@type": "Question",
            name: entry.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: faqJsonLdText(entry),
            },
        })),
    };

    return `<!doctype html>
<html lang="${HTML_LANG[locale]}">
    <head>
        <title>
            ${title}
        </title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="utf-8" />
        <meta name="description" content="${attr(doc.metaDescription)}" />
        <meta name="keywords" content="${attr(doc.keywords)}" />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <meta property="og:title" content="${attr(doc.ogTitle ?? doc.title)}" />
        <meta property="og:description" content="${attr(doc.ogDescription)}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${url}" />
        <meta property="og:image" content="${SITE}/og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${SITE}/og.png" />
        <meta name="twitter:title" content="${attr(doc.ogTitle ?? doc.title)}" />
        <meta name="twitter:description" content="${attr(doc.twitterDescription ?? doc.ogDescription)}" />
${localeHead(locale, suffix)}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#f7f7f9" />
${jsonLd(softwareAppSchema)}
${jsonLd(faqSchema)}
${HEAD_ASSETS}
${WIDGET_CARD_HEAD}
    </head>
    <body class="landing">
${generatedBanner("scripts/gen-index.ts")}
${THEME_PREPAINT}

        <!-- The three colour blobs behind the hero. -->
        <div class="nm-bg" aria-hidden="true">
            <div class="nm-bg-blob nm-bg-1"></div>
            <div class="nm-bg-blob nm-bg-2"></div>
            <div class="nm-bg-blob nm-bg-3"></div>
            <div class="nm-bg-fade"></div>
        </div>

${nav(locale, suffix)}

        <main id="main">
${renderHero(doc, locale, cards)}
${
    notice
        ? `
            <div class="nm-section nm-notice-band">
${notice}
            </div>
`
        : ""
}
${renderHow(doc)}

${renderConnect(doc, locale)}

${renderOnboarding(doc, locale)}

${renderExamples(doc, locale, cards)}

${renderLive(doc)}

${renderSupport(doc)}

${renderContact(doc)}

${renderFaq(doc, locale)}

${renderCta(doc, locale)}
        </main>

${footer(locale)}

        <script>
${LANDING_SCRIPT}
        </script>
${WIDGET_CARD_SCRIPTS(locale)}
${SITE_SCRIPT}
    </body>
</html>
`;
}

// Only when run as a script. src/landing-script.test.ts imports
// LANDING_SCRIPT from here, and an unguarded write loop would regenerate the
// nine pages as a side effect of that import — which is precisely the drift
// the test exists to catch, silently repaired a millisecond before it looks.
if (import.meta.main) {
    for (const [locale, doc] of Object.entries(INDEX) as [
        SiteLocale,
        IndexDoc,
    ][]) {
        const file =
            locale === "en"
                ? "./public/index.html"
                : `./public/${locale}/index.html`;
        const html = renderDoc(
            doc,
            locale,
            await renderLandingCards(doc, locale),
        );
        await assertCardsAreUntinted(html, file);
        assertIdsAreUnique(html, file);
        await Bun.write(file, html);
        console.log(`wrote ${file}`);
    }
}
