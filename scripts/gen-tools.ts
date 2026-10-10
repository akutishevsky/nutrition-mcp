/**
 * Generates public/tools.html and its translated counterparts under
 * public/{locale}/ from the typed data in src/copy/tools.ts. This page
 * used to be hand-authored HTML with nav()/footer() copy-pasted in by
 * hand; see scripts/gen-legal.ts and scripts/site-partials.ts for why
 * every generated page now shares one copy of that markup instead.
 *
 * Layout (the "Dawn" redesign): a two-column hero (count pill + h1 left,
 * lead right), a sticky glass capsule of category chips with per-chip
 * counts, one rounded panel per category holding a CSS-columns masonry of
 * tool cards, and a Troubleshooting panel (sticky intro + numbered
 * accordion) last. It is built from the shared `.nm-*` primitives and
 * tokens in public/styles.css; only page layout lives in TOOLS_STYLE.
 *
 * The page-specific <style> block and the chip-scrollspy <script> are
 * spliced in verbatim as constants (TOOLS_STYLE / TOOLS_SCRIPT) — both are
 * pure CSS/JS with no translatable text in them, so they need no per-locale
 * handling, unlike everything driven from src/copy/tools.ts.
 *
 * Re-run after editing src/copy/tools.ts:
 *   bun run scripts/gen-tools.ts
 * The generated .html files are the served artifacts — don't hand-edit them.
 */

import { HTML_LANG, pathFor, urlFor, type SiteLocale } from "../src/routes.js";
import {
    SITE,
    esc,
    footer,
    generatedBanner,
    jsonLd,
    localeHead,
    nav,
    translationNotice,
    HEAD_ASSETS,
    SITE_SCRIPT,
    THEME_PREPAINT,
    THEME_COLOR_LIGHT,
    EMAIL_OFF_OPEN,
    EMAIL_OFF_CLOSE,
    ICON_LINKS,
    OG_IMAGE_META,
} from "./site-partials.js";
import {
    BADGE_META,
    CATEGORIES,
    CATEGORY_META,
    TOOLS,
    TOOLS_COPY,
    TROUBLESHOOTING_IDS,
    type BadgeKind,
    type CategoryId,
    type ToolIdentity,
    type ToolsDoc,
} from "../src/copy/tools.js";

/** Each category's colour role — sets `--c` (via the shared `.nm-c-*`
 * classes), which tints the section's 52px tile and every card's 38px tile. */
const CATEGORY_TINTS: Record<CategoryId, string> = {
    "logging-food-meals": "nm-c-cal",
    "reviewing-your-meals": "nm-c-pro",
    water: "nm-c-wat",
    weight: "nm-c-fat",
    "goals-progress": "nm-c-acc",
    "insights-trends": "nm-c-caf",
    "settings-account": "nm-c-fib",
};

/** Badges that render on the accent (green) tint; every other kind —
 * view, export, remove, widget — is grey. */
const ACCENT_BADGES = new Set<BadgeKind>([
    "log",
    "import",
    "edit",
    "setting",
    "lookup",
]);

/** Locale quotation marks around each card's "Try saying" example —
 * typography, not copy, so it is structural here rather than per-locale
 * prose in ToolsDoc. */
const QUOTES: Record<SiteLocale, [open: string, close: string]> = {
    en: ["“", "”"],
    de: ["„", "“"],
    es: ["«", "»"],
    fr: ["« ", " »"],
    nl: ["“", "”"],
    pl: ["„", "”"],
    it: ["«", "»"],
    uk: ["«", "»"],
    ja: ["「", "」"],
    tr: ["“", "”"],
};

/** The support address the Troubleshooting intro links to. Same literal as
 * the footer's Contact link (site-partials.ts); scripts/depersonalize.ts's
 * "tools: troubleshooting mailto" rule rewrites it on forks, which is why
 * the anchor must never be followed by a newline. */
const CONTACT_EMAIL = "anton@nutrition-mcp.com";

const attr = (s: string) => esc(s).replace(/"/g, "&quot;");

// Page-layout CSS on top of the shared Dawn tokens and `.nm-*` primitives
// in styles.css. Every colour is a token, so dark mode follows the shared
// declarations. No translatable text lives in here (see the file header).
const TOOLS_STYLE = `        <style>
            /* ---- hero: pill + h1 left, lead right (bottom-aligned) ---- */
            body.tools .tools-hero {
                position: relative;
                z-index: 1;
                max-width: var(--container);
                margin: 0 auto;
                padding: clamp(36px, 5vw, 72px) var(--gutter)
                    clamp(28px, 4vw, 48px);
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                align-items: end;
                gap: 24px clamp(32px, 5vw, 72px);
            }
            body.tools .tools-hero-main {
                flex: 1 1 520px;
                min-width: 0;
            }
            /* Sentence-case count pill, not the shared pill's single line. */
            body.tools .tools-count {
                margin: 0 0 22px;
                gap: 10px;
                max-width: 100%;
                box-sizing: border-box;
                min-height: 34px;
                height: auto;
                padding: 6px 14px 6px 12px;
                font-size: 14px;
                font-weight: 500;
                white-space: normal;
                line-height: 1.35;
                animation: nm-rise 0.6s both;
            }
            body.tools .tools-count b {
                color: var(--ink);
                font-weight: 700;
            }
            body.tools .tools-count .nm-pulse-dot {
                animation: nm-pulse 2.2s infinite;
            }
            body.tools .tools-hero .nm-h1 {
                margin: 0;
                max-width: 14ch;
                font-weight: 800;
                font-size: clamp(42px, 5.6vw, 78px);
                line-height: 1;
                letter-spacing: -0.045em;
                text-wrap: balance;
                animation: nm-rise 0.6s 0.08s both;
            }
            body.tools .tools-hero .nm-h1 em {
                font-style: normal;
                color: var(--acc);
            }
            body.tools .tools-lead {
                flex: 1 1 340px;
                margin: 0;
                max-width: 44ch;
                font-size: clamp(17px, 1.5vw, 19px);
                color: var(--ink2);
                text-wrap: pretty;
                animation: nm-rise 0.6s 0.16s both;
            }

            /* ---- main column ---- */
            body.tools .tools-main {
                position: relative;
                z-index: 1;
                max-width: var(--container);
                margin: 0 auto;
                padding: 0 var(--gutter) clamp(40px, 6vw, 88px);
            }
            body.tools .tools-groups {
                display: grid;
                gap: 18px;
            }

            /* ---- sticky category capsule ---- */
            body.tools .tools-cats {
                position: sticky;
                top: calc(var(--head-h, 90px) - 6px);
                z-index: 10;
                margin-bottom: 18px;
            }
            body.tools .tools-cats-scroll {
                display: flex;
                gap: 4px;
                padding: 5px;
                overflow-x: auto;
                scrollbar-width: none;
                background: var(--glass);
                -webkit-backdrop-filter: blur(18px) saturate(160%);
                backdrop-filter: blur(18px) saturate(160%);
                border: 1px solid var(--line);
                border-radius: 999px;
                box-shadow: var(--shadow);
            }
            body.tools .tools-cats-scroll::-webkit-scrollbar {
                display: none;
            }
            body.tools .tools-chip {
                flex: none;
                gap: 8px;
                height: 38px;
                padding: 0 8px 0 14px;
                border: 0;
                background: transparent;
                color: var(--ink);
                font-size: 14px;
                font-weight: 700;
                text-decoration: none;
                transition:
                    background 0.3s ease,
                    color 0.3s ease;
            }
            body.tools .tools-chip:hover {
                background: var(--bg2);
                color: var(--ink);
            }
            body.tools .tools-chip i {
                font-size: 12px;
                color: var(--ink3);
                transition: color 0.3s ease;
            }
            body.tools .tools-chip .nm-chip-n {
                min-width: 22px;
                height: 22px;
                box-sizing: border-box;
                padding: 0 6px;
                display: inline-grid;
                place-items: center;
                border-radius: 999px;
                background: var(--bg2);
                font-size: 11px;
                font-weight: 500;
                color: var(--ink3);
                opacity: 1;
            }
            body.tools .tools-chip.is-active {
                background: var(--ink);
                color: var(--bg);
            }
            body.tools .tools-chip.is-active i {
                color: var(--bg);
            }
            body.tools .tools-chip.is-active .nm-chip-n {
                background: color-mix(in srgb, var(--bg) 18%, transparent);
                color: var(--bg);
            }
            body.tools .tools-chip:focus-visible {
                outline: 2px solid var(--acc);
                outline-offset: 2px;
            }

            /* ---- category panel ----
               html's scroll-padding-top already clears the header; the
               extra margin clears the sticky chip capsule too. */
            body.tools .tools-group {
                scroll-margin-top: 60px;
                background: var(--panel);
                border: 1px solid var(--line);
                border-radius: 32px;
                box-shadow: var(--shadow);
                padding: clamp(18px, 3vw, 36px);
            }
            body.tools .tools-group-head {
                display: flex;
                align-items: flex-start;
                gap: 16px;
                margin-bottom: 24px;
            }
            body.tools .tools-group-head > div,
            body.tools .tools-help-side > div {
                min-width: 0;
            }
            body.tools .tools-tile-lg {
                width: 52px;
                height: 52px;
                border-radius: 18px;
                font-size: 20px;
            }
            body.tools .tools-h2 {
                margin: 2px 0 0;
                font-weight: 800;
                font-size: clamp(26px, 3vw, 36px);
                line-height: 1.05;
                letter-spacing: -0.035em;
            }
            body.tools .tools-group-head p {
                margin: 8px 0 0;
                max-width: 60ch;
                color: var(--ink2);
                font-size: 16px;
                text-wrap: pretty;
            }

            /* ---- masonry of cards: 3 -> 2 -> 1 columns on its own ---- */
            body.tools .tools-cards {
                columns: 3 300px;
                column-gap: 14px;
                margin-bottom: -14px;
            }
            body.tools .tool-card {
                break-inside: avoid;
                margin-bottom: 14px;
                scroll-margin-top: 60px;
            }
            body.tools .tool-card-body {
                background: var(--bg);
                border: 1px solid var(--line);
                border-radius: 24px;
                padding: 20px;
                display: grid;
                gap: 14px;
                transition: border-color 0.3s ease;
            }
            body.tools .tool-card-top {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 12px;
            }
            body.tools .tools-tile-md {
                width: 38px;
                height: 38px;
                border-radius: 13px;
                font-size: 14px;
            }
            body.tools .tool-badges {
                display: flex;
                flex-wrap: wrap;
                justify-content: flex-end;
                gap: 6px;
                min-width: 0;
            }
            body.tools .tool-badge {
                gap: 5px;
                height: 24px;
                padding: 0 10px;
                background: var(--bg2);
                color: var(--ink2);
                font-family: inherit;
                font-size: 12px;
                font-weight: 700;
            }
            body.tools .tool-badge.nm-tag-acc {
                background: var(--acc-soft);
                color: var(--acc-txt);
            }
            body.tools .tool-badge i {
                font-size: 10px;
            }
            body.tools .tool-card h3 {
                margin: 0;
                font-size: 16px;
                line-height: 1.3;
            }
            body.tools .tool-name {
                border: 0;
                font-family: var(--mono);
                font-size: 15px;
                font-weight: 600;
                letter-spacing: -0.01em;
                color: var(--ink);
                overflow-wrap: anywhere;
                background: none;
                padding: 0;
            }
            body.tools .tool-desc {
                margin: 0;
                font-size: 14.5px;
                line-height: 1.5;
                color: var(--ink2);
                text-wrap: pretty;
            }

            /* ---- parameters: name + tag, then the description ---- */
            body.tools .tool-params {
                display: grid;
                gap: 4px;
            }
            body.tools .tool-params .nm-label-mono {
                font-family: var(--mono);
                font-size: 11px;
                font-weight: 500;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: var(--ink3);
            }
            body.tools .tool-params ul {
                margin: 0;
                padding: 0;
                list-style: none;
                display: grid;
            }
            body.tools .tool-params li {
                display: grid;
                gap: 3px;
                padding: 9px 0;
                border-top: 1px solid var(--line);
                font-size: 13.5px;
                line-height: 1.45;
                color: var(--ink2);
            }
            body.tools .tool-param-k {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 6px;
            }
            body.tools .tool-param-k code {
                border: 0;
                font-family: var(--mono);
                font-size: 12.5px;
                font-weight: 500;
                color: var(--ink);
                overflow-wrap: anywhere;
                background: none;
                padding: 0;
            }
            body.tools .tool-ptag {
                height: 18px;
                padding: 0 7px;
                background: var(--bg2);
                color: var(--ink3);
                font-family: inherit;
                font-size: 10.5px;
                font-weight: 700;
            }
            body.tools .tool-ptag.nm-tag-acc {
                background: var(--acc-soft);
                color: var(--acc-txt);
            }
            body.tools .tool-param-d {
                text-wrap: pretty;
            }
            body.tools .tool-param-d b {
                color: var(--ink);
            }
            body.tools .tool-param-d code {
                border: 0;
                font-family: var(--mono);
                font-size: 12px;
                color: var(--ink);
                background: var(--bg2);
                padding: 1px 5px;
                border-radius: 5px;
            }

            /* ---- "Try saying" ---- */
            body.tools .tool-ex {
                display: grid;
                gap: 8px;
            }
            body.tools .tool-say {
                margin: 0;
                padding: 12px 14px;
                background: var(--bg2);
                border-radius: 16px;
                font-size: 14px;
                font-weight: 600;
                line-height: 1.4;
                color: var(--ink);
                text-wrap: pretty;
            }
            body.tools .tool-say-l {
                color: var(--ink3);
                font-weight: 500;
            }
            body.tools .tool-ex-photo {
                margin: 0;
                padding: 0 4px;
                display: flex;
                align-items: baseline;
                gap: 8px;
                font-size: 13px;
                line-height: 1.45;
                color: var(--ink2);
            }
            body.tools .tool-ex-photo i {
                flex: none;
                color: var(--acc);
                font-size: 12px;
                position: relative;
                top: 1px;
            }

            /* ---- arriving on /tools#<tool_name>: ring the card ---- */
            body.tools .tool-card:target {
                opacity: 1;
                transform: none;
                transition: none;
            }
            body.tools .tool-card:target > .tool-card-body {
                border-color: var(--acc);
                box-shadow:
                    0 0 0 3px color-mix(in srgb, var(--acc) 30%, transparent),
                    var(--shadow);
                animation: nm-arrive 3s ease-out;
            }

            /* ---- troubleshooting: sticky intro + numbered accordion ---- */
            body.tools .tools-help {
                display: flex;
                flex-wrap: wrap;
                gap: clamp(20px, 4vw, 48px);
                align-items: flex-start;
            }
            body.tools .tools-help-side {
                flex: 1 1 260px;
                display: flex;
                align-items: flex-start;
                gap: 16px;
                position: relative;
            }
            @media (min-width: 900px) {
                body.tools .tools-help-side {
                    position: sticky;
                    top: 160px;
                }
            }
            body.tools .tools-help-tile {
                --c: var(--acc-txt);
                --c-icon: var(--acc-txt);
                background: var(--acc-soft);
            }
            body.tools .tools-help-side p {
                margin: 8px 0 0;
                max-width: 32ch;
                color: var(--ink2);
                font-size: 16px;
                text-wrap: pretty;
            }
            body.tools .tools-help-side .tools-help-contact {
                margin-top: 14px;
                font-size: 14px;
                color: var(--ink3);
            }
            body.tools .tools-help-contact a {
                color: var(--acc-txt);
                font-weight: 700;
                text-decoration: underline;
                text-underline-offset: 3px;
                overflow-wrap: anywhere;
            }
            body.tools .tools-help-list {
                flex: 2 1 520px;
                min-width: 0;
                background: var(--bg);
                border: 1px solid var(--line);
                border-radius: 24px;
                padding: 4px clamp(12px, 2vw, 22px);
            }
            body.tools .tools-help-row {
                border-bottom: 1px solid var(--line);
                scroll-margin-top: 60px;
            }
            body.tools .tools-help-row:last-child {
                border-bottom: 0;
            }
            body.tools .tools-help-row .nm-faq-q {
                padding: 17px 4px;
                color: var(--ink);
                font-size: 16.5px;
            }
            body.tools .tools-help-row .nm-faq-n {
                min-width: 24px;
            }
            body.tools .tools-help-row .nm-faq-ic {
                font-size: 11px;
            }
            /* plus turns into minus (no rotation, unlike the landing FAQ) */
            body.tools .tools-help-row[open] .nm-faq-ic {
                transform: none;
            }
            body.tools .tools-help-row[open] .nm-faq-ic i::before {
                content: "\\f068";
            }
            body.tools .tools-help-row .nm-faq-a {
                margin: 0;
                padding: 0 46px 20px 44px;
                color: var(--ink2);
                font-size: 15px;
                max-width: 68ch;
                text-wrap: pretty;
                animation: nm-rise 0.25s both;
            }
            @media (max-width: 520px) {
                body.tools .tools-help-row .nm-faq-a {
                    padding: 0 0 18px;
                }
            }
            body.tools .tools-help-row .nm-faq-a b,
            body.tools .tools-help-row .nm-faq-a strong {
                color: var(--ink);
            }
            body.tools .tools-help-row .nm-faq-a code {
                border: 0;
                font-family: var(--mono);
                font-size: 13px;
                color: var(--ink);
                background: var(--bg2);
                padding: 2px 6px;
                border-radius: 6px;
                word-break: break-all;
            }
            /* A tool cross-link (<a href="#tool"><code>tool</code></a>)
               renders as a mono chip; elsewhere it stays an underlined link. */
            body.tools .tools-help-row .nm-faq-a a:has(> code:only-child) {
                /* inline, not inline-flex: a padded inline-flex box
                   stretches the line box and opens gaps in the paragraph */
                display: inline;
                padding: 1px 7px;
                -webkit-box-decoration-break: clone;
                box-decoration-break: clone;
                border-radius: 999px;
                background: var(--bg2);
                border: 1px solid var(--line);
                font-family: var(--mono);
                font-size: 12.5px;
                font-weight: 400;
                color: var(--ink);
                text-decoration: none;
            }
            body.tools
                .tools-help-row
                .nm-faq-a
                a:has(> code:only-child):hover {
                border-color: var(--acc);
            }
            body.tools .tools-help-row .nm-faq-a a > code:only-child {
                background: none;
                padding: 0;
                font-size: inherit;
                word-break: normal;
            }
        </style>`;

// Category chips: highlight the chip for the section in view and keep it
// centred in the capsule on narrow screens; re-align a /tools#<tool_name>
// arrival once fonts settle; plus the Troubleshooting deep-link opener.
// Pure behaviour, no translatable text.
const TOOLS_SCRIPT = `        <script>
            (function () {
                var nav = document.querySelector(".tools-cats");
                var scroller = document.querySelector(".tools-cats-scroll");
                if (!nav || !scroller) return;
                var chips = Array.prototype.slice.call(
                    scroller.querySelectorAll(".tools-chip"),
                );
                if (!chips.length) return;
                var groups = chips.map(function (c) {
                    return document.querySelector(c.getAttribute("href"));
                });
                var reduce = window.matchMedia(
                    "(prefers-reduced-motion: reduce)",
                );
                var raf = 0;
                var current = -1;
                // The category of the card the URL's hash names, when that
                // card is on screen; -1 otherwise.
                function targetGroup() {
                    var id = location.hash.slice(1);
                    if (!id) return -1;
                    try {
                        id = decodeURIComponent(id);
                    } catch (e) {}
                    var el = document.getElementById(id);
                    // Cards only: a chip sets the hash too, and a stale
                    // #water must not pin that chip at the foot of the page.
                    if (!el || !el.matches(".tool-card")) return -1;
                    var group = el.closest(".tools-group");
                    if (!group) return -1;
                    var r = el.getBoundingClientRect();
                    if (r.bottom <= 0 || r.top >= window.innerHeight) return -1;
                    return groups.indexOf(group);
                }
                function offset() {
                    // Header + the sticky chip capsule + breathing room.
                    var head =
                        parseFloat(
                            getComputedStyle(document.body).getPropertyValue(
                                "--head-h",
                            ),
                        ) || 90;
                    return head + nav.offsetHeight + 24;
                }
                function update() {
                    raf = 0;
                    var idx = 0;
                    var top = offset();
                    for (var i = 0; i < groups.length; i++) {
                        if (
                            groups[i] &&
                            groups[i].getBoundingClientRect().top - top <= 1
                        )
                            idx = i;
                    }
                    // Snap to the last chip (Help) once scrolled to the
                    // bottom, unless the page was opened on a tool card that
                    // is on screen there.
                    if (
                        window.innerHeight + window.scrollY >=
                        document.documentElement.scrollHeight - 4
                    ) {
                        idx = groups.length - 1;
                        var hit = targetGroup();
                        if (hit >= 0) idx = hit;
                    }
                    for (var j = 0; j < chips.length; j++) {
                        var on = j === idx;
                        chips[j].classList.toggle("is-active", on);
                        if (on) chips[j].setAttribute("aria-current", "true");
                        else chips[j].removeAttribute("aria-current");
                    }
                    var active = chips[idx];
                    if (
                        active &&
                        idx !== current &&
                        scroller.scrollWidth > scroller.clientWidth
                    ) {
                        var pr = active.getBoundingClientRect();
                        var sr = scroller.getBoundingClientRect();
                        scroller.scrollTo({
                            left:
                                scroller.scrollLeft +
                                pr.left +
                                pr.width / 2 -
                                (sr.left + sr.width / 2),
                            behavior: reduce.matches ? "auto" : "smooth",
                        });
                    }
                    current = idx;
                }
                function onScroll() {
                    if (!raf) raf = requestAnimationFrame(update);
                }
                window.addEventListener("scroll", onScroll, { passive: true });
                window.addEventListener("resize", function () {
                    current = -1;
                    onScroll();
                });
                window.addEventListener("hashchange", onScroll);
                // On a cold-cache visit to /tools#<tool_name> the browser
                // jumps before fonts and icons lay out, and the reflow above
                // leaves the card under the capsule. Re-align once they
                // settle, but only until the reader moves the page.
                var userMoved = false;
                function markMoved() {
                    userMoved = true;
                }
                ["wheel", "touchstart", "keydown", "pointerdown"].forEach(
                    function (t) {
                        window.addEventListener(t, markMoved, {
                            passive: true,
                            once: true,
                        });
                    },
                );
                function realign() {
                    if (!userMoved && location.hash.length > 1) {
                        var id = location.hash.slice(1);
                        try {
                            id = decodeURIComponent(id);
                        } catch (e) {}
                        var el = document.getElementById(id);
                        if (el && el.matches(".tool-card, .tools-group"))
                            el.scrollIntoView({
                                block: "start",
                                behavior: "instant",
                            });
                    }
                    onScroll();
                }
                window.addEventListener("load", realign);
                if (document.fonts) {
                    document.fonts.ready.then(realign);
                    document.fonts.addEventListener("loadingdone", realign);
                }
                chips.forEach(function (c) {
                    c.addEventListener("click", function () {
                        setTimeout(update, 60);
                    });
                });
                update();
            })();

            // Troubleshooting deep links: /tools#wrong-day opens that entry
            // and brings it to the top, on load, on in-page hash changes, and
            // on a click of a link to the hash already in the URL.
            // Without JS the browser still scrolls to it, just closed.
            (function () {
                var reduce = window.matchMedia(
                    "(prefers-reduced-motion: reduce)",
                );
                function openFromHash() {
                    var id;
                    try {
                        id = decodeURIComponent(location.hash.slice(1));
                    } catch (e) {
                        return;
                    }
                    if (!id) return;
                    var el = document.getElementById(id);
                    if (!el || el.tagName !== "DETAILS") return;
                    el.open = true;
                    el.scrollIntoView({
                        block: "start",
                        behavior: reduce.matches ? "auto" : "smooth",
                    });
                }
                if (document.readyState === "loading")
                    document.addEventListener("DOMContentLoaded", openFromHash);
                else openFromHash();
                window.addEventListener("hashchange", openFromHash);
                // A link to the hash already in the URL fires no hashchange,
                // so an entry closed since arriving would stay closed.
                document.addEventListener("click", function (e) {
                    var a = e.target.closest && e.target.closest('a[href^="#"]');
                    if (!a || a.getAttribute("href") !== location.hash) return;
                    var target = document.getElementById(
                        location.hash.slice(1),
                    );
                    if (!target || target.tagName !== "DETAILS") return;
                    e.preventDefault();
                    openFromHash();
                });
            })();
        </script>`;

// ------------------------------------------------- locale-lag tolerance
// Fields added with the redesign (hero.titleBeforeEm/titleEm/titleAfterEm,
// ui.categoriesLabel, troubleshooting.stillStuck) reach the locale files in
// a later translation pass. Until then a locale doc may still carry only
// the old hero.title, so read them defensively instead of crashing the
// whole run; once every locale has them, these collapse to plain reads.

function heroTitleHtml(doc: ToolsDoc): string {
    const h = doc.hero as Partial<ToolsDoc["hero"]> & { title?: string };
    if (typeof h.titleEm === "string") {
        return `${esc(h.titleBeforeEm ?? "")}<em>${esc(h.titleEm)}</em>${esc(h.titleAfterEm ?? "")}`;
    }
    return esc(h.title ?? "");
}

function categoriesLabel(doc: ToolsDoc): string {
    return (
        (doc.ui as Partial<ToolsDoc["ui"]>).categoriesLabel ??
        TOOLS_COPY.en!.ui.categoriesLabel
    );
}

// ------------------------------------------------------------ rendering

function renderBadge(kind: BadgeKind, label: string): string {
    const meta = BADGE_META[kind];
    const iconHtml = meta.icon
        ? `<i class="${meta.icon}" aria-hidden="true"></i>`
        : "";
    const acc = ACCENT_BADGES.has(kind) ? " nm-tag-acc" : "";
    return `<span class="nm-tag tool-badge${acc}">${iconHtml}${esc(label)}</span>`;
}

// `descHtml` is trusted HTML (see src/copy/tools.ts's file header) — most
// param descriptions are markup-free plain characters that pass through
// untouched, a handful carry inline <b>/<code>.
function renderParam(
    param: { name: string; required: boolean },
    descHtml: string,
    doc: ToolsDoc,
): string {
    const tag = param.required
        ? `<span class="nm-tag tool-ptag nm-tag-acc">${esc(doc.ui.requiredLabel)}</span>`
        : `<span class="nm-tag tool-ptag">${esc(doc.ui.optionalLabel)}</span>`;
    const desc = descHtml
        ? `<span class="tool-param-d">${descHtml}</span>`
        : "";
    return `<li><span class="tool-param-k"><code>${param.name}</code>${tag}</span>${desc}</li>`;
}

function renderToolCard(
    tool: ToolIdentity,
    doc: ToolsDoc,
    locale: SiteLocale,
): string {
    const prose = doc.tools[tool.name];
    if (!prose) {
        throw new Error(
            `src/copy/tools.ts: TOOLS_COPY is missing prose for tool "${tool.name}"`,
        );
    }
    const icon = CATEGORY_META[tool.category].icon;
    const tint = CATEGORY_TINTS[tool.category];
    const badgesHtml = tool.badges
        .map((k) => renderBadge(k, doc.badges[k]))
        .join("");
    const paramsHtml =
        tool.params.length === 0
            ? ""
            : `
                                    <div class="tool-params">
                                        <span class="nm-label-mono">${esc(doc.ui.parametersLabel)}</span>
                                        <ul>
                                            ${tool.params
                                                .map((p) =>
                                                    renderParam(
                                                        p,
                                                        prose.params[p.name] ??
                                                            "",
                                                        doc,
                                                    ),
                                                )
                                                .join(
                                                    "\n                                            ",
                                                )}
                                        </ul>
                                    </div>`;
    const photoHtml =
        tool.hasPhotoHint && prose.photoHint
            ? `
                                        <p class="tool-ex-photo"><i class="fa-solid fa-camera" aria-hidden="true"></i><span>${esc(prose.photoHint)}</span></p>`
            : "";
    const [q1, q2] = QUOTES[locale];
    return `<article class="tool-card" id="${tool.name}" data-reveal>
                                <div class="tool-card-body">
                                    <div class="tool-card-top">
                                        <span class="nm-tile tools-tile-md ${tint}" aria-hidden="true"><i class="${icon}"></i></span>
                                        <span class="tool-badges">${badgesHtml}</span>
                                    </div>
                                    <h3><code class="tool-name">${tool.name}</code></h3>
                                    <p class="tool-desc">${esc(prose.description)}</p>${paramsHtml}
                                    <div class="tool-ex">
                                        <p class="tool-say"><span class="tool-say-l">${esc(doc.ui.trySayingLabel)} </span>${q1}${esc(prose.example)}${q2}</p>${photoHtml}
                                    </div>
                                </div>
                            </article>`;
}

function renderChip(
    href: string,
    icon: string,
    label: string,
    count: number,
): string {
    return `<a class="nm-chip tools-chip" href="${href}"><i class="${icon}" aria-hidden="true"></i>${esc(label)}<span class="nm-chip-n">${count}</span></a>`;
}

function renderCategorySection(
    id: CategoryId,
    doc: ToolsDoc,
    locale: SiteLocale,
): string {
    const meta = CATEGORY_META[id];
    const cat = doc.categories[id];
    const toolsInCat = TOOLS.filter((t) => t.category === id);
    return `<section class="tools-group" id="${id}" aria-labelledby="${id}-title">
                        <div class="tools-group-head" data-reveal>
                            <span class="nm-tile tools-tile-lg ${CATEGORY_TINTS[id]}" aria-hidden="true"><i class="${meta.icon}"></i></span>
                            <div>
                                <h2 class="tools-h2" id="${id}-title">${esc(cat.title)}</h2>
                                <p>${esc(cat.description)}</p>
                            </div>
                        </div>
                        <div class="tools-cards">
                            ${toolsInCat.map((t) => renderToolCard(t, doc, locale)).join("\n                            ")}
                        </div>
                    </section>`;
}

// Rendered last, after every category. `answerHtml` is trusted HTML (see
// TroubleshootingEntry); the question is plain text. No FAQPage JSON-LD:
// this is support copy, not marketing, and the landing page owns that.
// Rows stay native <details> — the deep-link opener keys on that tag.
function renderTroubleshootingSection(doc: ToolsDoc): string {
    const t = doc.troubleshooting;
    const stillStuck = (t as Partial<ToolsDoc["troubleshooting"]>).stillStuck;
    // The mailto anchor must end on the same line as </p>: see CONTACT_EMAIL.
    const contactHtml = stillStuck
        ? `
                                <p class="tools-help-contact">${esc(stillStuck)} <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>`
        : "";
    const rows = TROUBLESHOOTING_IDS.map(
        (id, i) => `<details id="${id}" class="nm-faq-row tools-help-row">
                                <summary class="nm-faq-q"><span class="nm-faq-n">${String(i + 1).padStart(2, "0")}</span><span>${esc(t.items[id].question)}</span><span class="nm-faq-ic" aria-hidden="true"><i class="fa-solid fa-plus"></i></span></summary>
                                <p class="nm-faq-a">${t.items[id].answerHtml}</p>
                            </details>`,
    ).join("\n                            ");
    return `<section class="tools-group tools-help" id="troubleshooting" aria-labelledby="troubleshooting-title">
                        <div class="tools-help-side" data-reveal>
                            <span class="nm-tile tools-tile-lg tools-help-tile" aria-hidden="true"><i class="fa-solid fa-life-ring"></i></span>
                            <div>
                                <h2 class="tools-h2" id="troubleshooting-title">${esc(t.title)}</h2>
                                <p>${esc(t.description)}</p>${contactHtml}
                            </div>
                        </div>
                        <div class="tools-help-list">
                            ${rows}
                        </div>
                    </section>`;
}

function renderDoc(doc: ToolsDoc, locale: SiteLocale): string {
    const suffix = "/tools";
    const title = `${esc(doc.meta.title)} — Nutrition MCP`;
    const url = `${SITE}${pathFor(locale, suffix)}`;
    // BreadcrumbList only — no FAQPage for troubleshooting (Google limited
    // FAQ rich results to government/health sites in Aug 2023).
    const breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Nutrition MCP",
                item: urlFor(locale, ""),
            },
            {
                "@type": "ListItem",
                position: 2,
                name: doc.meta.title,
                item: url,
            },
        ],
    };

    const chips = [
        ...CATEGORIES.map((id) =>
            renderChip(
                `#${id}`,
                CATEGORY_META[id].icon,
                doc.categories[id].pillLabel,
                TOOLS.filter((t) => t.category === id).length,
            ),
        ),
        renderChip(
            "#troubleshooting",
            "fa-solid fa-life-ring",
            doc.troubleshooting.pillLabel,
            TROUBLESHOOTING_IDS.length,
        ),
    ].join("\n                        ");
    const sections = CATEGORIES.map((id) =>
        renderCategorySection(id, doc, locale),
    ).join("\n\n                    ");
    const notice = translationNotice(locale, suffix);

    return `<!doctype html>
<html lang="${HTML_LANG[locale]}">
    <head>
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="utf-8" />
        <meta name="description" content="${esc(doc.meta.description)}" />
${localeHead(locale, suffix)}
${ICON_LINKS}
        <meta name="theme-color" content="${THEME_COLOR_LIGHT}" />
        <meta property="og:title" content="${title}" />
        <meta
            property="og:description"
            content="${esc(doc.meta.ogDescription)}"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${url}" />
${OG_IMAGE_META}
        <meta name="twitter:title" content="${title}" />
        <meta
            name="twitter:description"
            content="${esc(doc.meta.ogDescription)}"
        />
${jsonLd(breadcrumb)}
${HEAD_ASSETS}
${TOOLS_STYLE}
    </head>
    <body class="tools">
${generatedBanner("scripts/gen-tools.ts")}
${EMAIL_OFF_OPEN}
${THEME_PREPAINT}

${nav(locale, suffix, suffix, { blobs: "compact" })}

        <main id="main">
            <section class="tools-hero" aria-labelledby="tools-title">
                <div class="tools-hero-main">
                    <p class="nm-pill tools-count"><span class="nm-pulse-dot" aria-hidden="true"></span><span>${esc(doc.hero.eyebrow)} · <b>${esc(doc.hero.countBold)}</b> ${esc(doc.hero.countTail)}</span></p>
                    <h1 class="nm-h1" id="tools-title">${heroTitleHtml(doc)}</h1>
                </div>
                <p class="nm-lead tools-lead">${esc(doc.hero.lead)}</p>
            </section>
${notice ? `\n            <div class="translation-notice-band">\n${notice}\n            </div>\n` : ""}
            <div class="tools-main">
                <nav class="tools-cats" aria-label="${attr(categoriesLabel(doc))}">
                    <div class="tools-cats-scroll">
                        ${chips}
                    </div>
                </nav>

                <div class="tools-groups">
                    ${sections}

                    ${renderTroubleshootingSection(doc)}
                </div>
            </div>
        </main>

${footer(locale, suffix)}

${TOOLS_SCRIPT}
${SITE_SCRIPT}
${EMAIL_OFF_CLOSE}
    </body>
</html>
`;
}

for (const [locale, doc] of Object.entries(TOOLS_COPY) as [
    SiteLocale,
    ToolsDoc,
][]) {
    const file =
        locale === "en"
            ? "./public/tools.html"
            : `./public/${locale}/tools.html`;
    await Bun.write(file, renderDoc(doc, locale));
    console.log(`wrote ${file}`);
}
