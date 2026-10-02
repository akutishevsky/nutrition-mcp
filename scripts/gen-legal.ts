/**
 * Generates public/privacy.html, public/terms.html, and their translated
 * counterparts under public/{locale}/ from the typed data in
 * src/copy/legal.ts. These two pages used to be hand-authored HTML with
 * nav()/footer() copy-pasted in by hand; see scripts/gen-alternatives.ts
 * and scripts/site-partials.ts for why every generated page now shares one
 * copy of that markup instead.
 *
 * Re-run after editing src/copy/legal.ts:
 *   bun run scripts/gen-legal.ts
 * The generated .html files are the served artifacts — don't hand-edit them.
 */

import { HTML_LANG, pathFor, type SiteLocale } from "../src/routes.js";
import {
    SITE,
    esc,
    footer,
    generatedBanner,
    localeHead,
    nav,
    translationNotice,
    HEAD_ASSETS,
    SITE_SCRIPT,
    THEME_PREPAINT,
    EMAIL_OFF_OPEN,
    EMAIL_OFF_CLOSE,
    THEME_COLOR_LIGHT,
    ICON_LINKS,
    OG_IMAGE_META,
} from "./site-partials.js";
import {
    PRIVACY,
    TERMS,
    type LegalBlock,
    type LegalDoc,
} from "../src/copy/legal.js";

// Page-layout CSS, shared by both documents. Tokens (--bg, --panel, --ink2,
// --acc-txt …), fonts, the blobs, header and footer come from
// public/styles.css + nav()/footer(); everything here is legal-page layout.
// The TOC switches from a collapsible card to a sticky column at 960px — a
// page-specific breakpoint, hence its own .legal-only-* pair rather than
// the 700px .nm-only-* primitives.
const LEGAL_STYLE = `        <style>
            main.legal-main {
                font-size: 17px;
                line-height: 1.55;
                overflow-x: clip;
            }

            /* Hero */
            .legal-hero {
                position: relative;
                z-index: 1;
                max-width: var(--container, 1160px);
                margin: 0 auto;
                padding: clamp(36px, 5vw, 72px) var(--gutter, clamp(16px, 4vw, 40px))
                    clamp(28px, 4vw, 48px);
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                align-items: end;
                gap: 24px clamp(32px, 5vw, 72px);
            }
            .legal-hero-text {
                flex: 1 1 520px;
                min-width: 0;
            }
            .legal-updated {
                margin: 0 0 22px;
                display: inline-flex;
                align-items: center;
                gap: 10px;
                max-width: 100%;
                box-sizing: border-box;
                min-height: 34px;
                padding: 6px 14px 6px 12px;
                background: var(--glass);
                -webkit-backdrop-filter: blur(12px);
                backdrop-filter: blur(12px);
                border: 1px solid var(--line);
                border-radius: 999px;
                font-size: 14px;
                font-weight: 500;
                color: var(--ink2);
                line-height: 1.35;
                animation: nm-rise 0.6s both;
            }
            .legal-dot {
                flex: none;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: var(--acc);
                animation: nm-pulse 2.2s infinite;
            }
            .legal-date {
                font-family: var(--mono);
                font-size: 13px;
                color: var(--ink);
            }
            .legal-title {
                margin: 0;
                max-width: 14ch;
                font-weight: 800;
                font-size: clamp(42px, 5.6vw, 78px);
                line-height: 1;
                letter-spacing: -0.045em;
                text-wrap: balance;
                animation: nm-rise 0.6s 0.08s both;
            }
            .legal-lead {
                margin: 20px 0 0;
                max-width: 52ch;
                font-size: clamp(17px, 1.5vw, 19px);
                color: var(--ink2);
                text-wrap: pretty;
                animation: nm-rise 0.6s 0.16s both;
            }

            /* Privacy / Terms switcher pill */
            .legal-switch {
                flex: none;
                display: flex;
                gap: 4px;
                max-width: 100%;
                box-sizing: border-box;
                overflow-x: auto;
                scrollbar-width: none;
                padding: 5px;
                background: var(--glass);
                -webkit-backdrop-filter: blur(18px) saturate(160%);
                backdrop-filter: blur(18px) saturate(160%);
                border: 1px solid var(--line);
                border-radius: 999px;
                box-shadow: var(--shadow);
                animation: nm-rise 0.6s 0.2s both;
            }
            .legal-switch::-webkit-scrollbar {
                display: none;
            }
            .legal-switch a {
                display: inline-flex;
                align-items: center;
                height: 38px;
                padding: 0 16px;
                border-radius: 999px;
                font-size: 14px;
                font-weight: 700;
                white-space: nowrap;
                color: var(--ink2);
                text-decoration: none;
            }
            .legal-switch a:hover {
                color: var(--ink);
                background: var(--bg2);
            }
            .legal-switch a[aria-current="page"],
            .legal-switch a[aria-current="page"]:hover {
                background: var(--ink);
                color: var(--bg);
            }

            /* Translation notice (not in the English-only design) */
            .legal-notice-wrap {
                position: relative;
                z-index: 1;
                max-width: var(--container, 1160px);
                margin: 0 auto clamp(18px, 3vw, 28px);
                padding: 0 var(--gutter, clamp(16px, 4vw, 40px));
                box-sizing: border-box;
            }
            .legal-notice-wrap .translation-notice {
                margin: 0;
            }

            /* Two-column body: TOC + article */
            .legal-body {
                position: relative;
                z-index: 1;
                max-width: var(--container, 1160px);
                margin: 0 auto;
                padding: 0 var(--gutter, clamp(16px, 4vw, 40px))
                    clamp(40px, 6vw, 88px);
                display: flex;
                flex-wrap: wrap;
                gap: 18px clamp(20px, 4vw, 48px);
                align-items: flex-start;
            }
            .legal-aside {
                flex: 1 1 240px;
                min-width: 0;
                position: relative;
                z-index: 5;
            }
            /* Scoped to .legal-toc so they outrank .legal-toc-list's own
               display: grid, which comes later at the same specificity and
               used to show the wide list above the fold on phones. */
            .legal-toc .legal-only-narrow {
                display: block;
            }
            .legal-toc .legal-only-wide {
                display: none;
            }
            @media (min-width: 960px) {
                .legal-aside {
                    position: sticky;
                    top: 110px;
                }
                .legal-toc .legal-only-narrow {
                    display: none;
                }
                .legal-toc .legal-only-wide {
                    display: grid;
                }
            }

            /* TOC */
            .legal-toc-list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: grid;
                gap: 2px;
            }
            .legal-toc-list a {
                display: grid;
                grid-template-columns: 28px 1fr;
                gap: 6px;
                align-items: baseline;
                padding: 8px 12px;
                border-radius: 14px;
                background: transparent;
                color: var(--ink2);
                font-size: 15px;
                font-weight: 600;
                line-height: 1.3;
                text-decoration: none;
                transition:
                    background 0.25s,
                    color 0.25s;
            }
            .legal-toc-list a:hover {
                color: var(--ink);
                background: var(--bg2);
            }
            .legal-toc-num {
                font-family: var(--mono);
                font-size: 11.5px;
                font-weight: 500;
                color: var(--ink3);
            }
            .legal-toc-label {
                text-wrap: pretty;
            }
            .legal-toc-list a.active {
                background: var(--panel);
                color: var(--ink);
                font-weight: 700;
            }
            .legal-toc-list a.active .legal-toc-num {
                color: var(--acc-txt);
            }

            /* Narrow TOC: collapsible card */
            .legal-toc-fold {
                background: var(--panel);
                border: 1px solid var(--line);
                border-radius: 24px;
                box-shadow: var(--shadow);
                overflow: hidden;
            }
            .legal-toc-fold summary {
                list-style: none;
                width: 100%;
                min-height: 56px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 0 10px 0 20px;
                box-sizing: border-box;
                color: var(--ink);
                cursor: pointer;
                font-weight: 700;
                font-size: 16px;
                text-align: left;
            }
            .legal-toc-fold summary::-webkit-details-marker {
                display: none;
            }
            .legal-toc-fold-title {
                min-width: 0;
            }
            .legal-toc-fold-icon {
                flex: none;
                width: 34px;
                height: 34px;
                border-radius: 50%;
                background: var(--bg2);
                color: var(--ink);
                display: grid;
                place-items: center;
                font-size: 12px;
            }
            .legal-toc-fold[open] .legal-toc-fold-icon {
                background: var(--ink);
                color: var(--bg);
            }
            .legal-toc-fold .ic-minus,
            .legal-toc-fold[open] .ic-plus {
                display: none;
            }
            .legal-toc-fold[open] .ic-minus {
                display: inline-block;
            }
            .legal-toc-fold .legal-toc-list {
                gap: 0;
                padding: 0 8px 8px;
                border-top: 1px solid var(--line);
                animation: nm-rise 0.25s both;
            }
            .legal-toc-fold .legal-toc-list a {
                grid-template-columns: 30px 1fr;
                min-height: 44px;
                box-sizing: border-box;
                padding: 11px 12px;
                font-size: 15.5px;
                color: var(--ink);
            }

            /* Article panel */
            .legal-article {
                flex: 3 1 560px;
                min-width: 0;
                box-sizing: border-box;
                background: var(--panel);
                border: 1px solid var(--line);
                border-radius: 32px;
                box-shadow: var(--shadow);
                padding: clamp(22px, 4vw, 56px) clamp(20px, 4vw, 56px)
                    clamp(22px, 3vw, 40px);
            }
            .legal-section {
                /* html's scroll-padding-top (the header height) adds to
                   this; together they land a jumped-to section 110px down,
                   inside the scroll-spy's 140px line, as in the design. */
                scroll-margin-top: calc(110px - var(--head-h, 90px));
                padding: clamp(28px, 4vw, 40px) 0;
                border-top: 1px solid var(--line);
            }
            .legal-section:first-of-type {
                padding: 0 0 clamp(28px, 4vw, 40px);
                border-top: 0;
            }
            .legal-section-head {
                display: grid;
                grid-template-columns: auto minmax(0, 1fr);
                gap: 4px 14px;
                align-items: baseline;
            }
            .legal-num {
                font-family: var(--mono);
                font-size: 13px;
                font-weight: 500;
                color: var(--acc-txt);
            }
            .legal-section h2 {
                margin: 0;
                font-weight: 800;
                font-size: clamp(24px, 2.6vw, 32px);
                line-height: 1.1;
                letter-spacing: -0.03em;
                text-wrap: balance;
            }
            .legal-blocks {
                display: grid;
                gap: 16px;
                margin-top: 18px;
            }
            .legal-blocks p {
                margin: 0;
                max-width: 68ch;
                font-size: 17px;
                line-height: 1.7;
                color: var(--ink2);
                text-wrap: pretty;
            }
            .legal-blocks strong {
                color: var(--ink);
                font-weight: 700;
            }
            .legal-blocks code {
                font-family: var(--mono);
                font-size: 0.86em;
                color: var(--ink);
                background: var(--bg2);
                padding: 2px 6px;
                border-radius: 6px;
                overflow-wrap: anywhere;
            }
            .legal-blocks a {
                color: var(--acc);
                font-weight: 700;
                text-decoration: underline;
                text-underline-offset: 3px;
                overflow-wrap: anywhere;
            }
            .legal-blocks ul {
                margin: 0;
                padding: 4px 18px;
                list-style: none;
                display: grid;
                background: var(--bg);
                border: 1px solid var(--line);
                border-radius: 22px;
            }
            .legal-blocks li {
                display: grid;
                grid-template-columns: 10px minmax(0, 1fr);
                gap: 14px;
                padding: 14px 0;
                border-bottom: 1px solid var(--line);
                font-size: 16px;
                line-height: 1.65;
                color: var(--ink2);
                text-wrap: pretty;
            }
            .legal-blocks li:last-child {
                border-bottom: 0;
            }
            .legal-blocks li::before {
                content: "";
                width: 7px;
                height: 7px;
                margin-top: 10px;
                border-radius: 50%;
                background: var(--acc);
            }
            .legal-li {
                min-width: 0;
            }

            /* Foot */
            .legal-foot {
                margin-top: clamp(28px, 4vw, 44px);
                padding-top: 20px;
                border-top: 1px solid var(--line);
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                align-items: center;
                gap: 12px 20px;
            }
            .legal-back {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                min-height: 44px;
                font-weight: 700;
                font-size: 15px;
                color: var(--ink2);
                text-decoration: none;
            }
            .legal-back:hover {
                color: var(--ink);
            }
            .legal-next {
                display: inline-flex;
                align-items: center;
                gap: 10px;
                height: 44px;
                padding: 0 18px;
                border: 1px solid var(--line2);
                border-radius: 999px;
                font-weight: 700;
                font-size: 15px;
                color: var(--ink);
                text-decoration: none;
            }
            .legal-next:hover {
                color: var(--ink);
                background: var(--bg2);
            }
            .legal-back i,
            .legal-next i {
                font-size: 12px;
            }
        </style>`;

// TOC scroll-spy, mirroring the design: the active section is the last one
// whose top is within 140px of the viewport top, and the last section wins
// at the bottom of the page, so an item is always lit. Marks the link in
// both TOC copies (wide list and narrow fold), and closes the narrow fold
// when one of its links is followed. Pure behaviour, no translatable text.
const TOC_SCRIPT = `        <script>
            (function () {
                var links = document.querySelectorAll(
                    ".legal-toc-list a[href^='#']",
                );
                var secs = document.querySelectorAll(".legal-section[id]");
                if (!links.length || !secs.length) return;
                var raf = 0;
                function update() {
                    raf = 0;
                    var idx = 0;
                    for (var i = 0; i < secs.length; i++) {
                        if (secs[i].getBoundingClientRect().top - 140 <= 1)
                            idx = i;
                    }
                    if (
                        window.innerHeight + window.scrollY >=
                        document.documentElement.scrollHeight - 4
                    )
                        idx = secs.length - 1;
                    var href = "#" + secs[idx].id;
                    for (var j = 0; j < links.length; j++) {
                        var on = links[j].getAttribute("href") === href;
                        links[j].classList.toggle("active", on);
                        if (on) links[j].setAttribute("aria-current", "true");
                        else links[j].removeAttribute("aria-current");
                    }
                }
                function onScroll() {
                    if (!raf) raf = requestAnimationFrame(update);
                }
                window.addEventListener("scroll", onScroll, { passive: true });
                window.addEventListener("resize", onScroll);
                update();
                var fold = document.querySelector(".legal-toc-fold");
                if (fold)
                    fold.addEventListener("click", function (e) {
                        if (e.target.closest && e.target.closest("a"))
                            fold.open = false;
                    });
            })();
        </script>`;

// src/copy/legal.ts's cross-link paragraphs ("...our Terms of Service")
// carry a plain href="/terms" plus a data-legal-link="terms" marker,
// because the content string itself has no access to `locale` — this
// rewrites that href to the locale-correct path (e.g. "/de/terms") and
// drops the marker. Without it, a translated privacy page's in-prose link
// to the terms page would silently point at the English one (caught live
// in the browser before this existed — the marker was added anticipating
// exactly this, then never wired up).
function localizeCrossLinks(html: string, locale: SiteLocale): string {
    return html
        .replace(
            /href="\/terms" data-legal-link="terms"/,
            `href="${pathFor(locale, "/terms")}"`,
        )
        .replace(
            /href="\/privacy" data-legal-link="privacy"/,
            `href="${pathFor(locale, "/privacy")}"`,
        );
}

function renderBlock(b: LegalBlock, locale: SiteLocale): string {
    if (b.type === "p")
        return `                            <p>${localizeCrossLinks(b.html, locale)}</p>`;
    // The item text is wrapped in a span so its inline <strong>/<a> stay in
    // one grid cell beside the ::before dot.
    return `                            <ul>\n${b.items
        .map(
            (i) =>
                `                                <li><span class="legal-li">${localizeCrossLinks(i, locale)}</span></li>`,
        )
        .join("\n")}\n                            </ul>`;
}

// Section anchors are slugs of the ENGLISH heading at the same index, so
// /de/privacy#how-long-we-keep-data works in every locale. Section counts
// match across locales ("every locale's privacy policy and terms have the
// English shape" in src/site-copy.test.ts); the fallback covers a mismatch.
function slug(heading: string): string {
    return heading
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function sectionIds(english: LegalDoc, count: number): string[] {
    return Array.from({ length: count }, (_, i) => {
        const h = english.sections[i]?.heading;
        return h ? slug(h) : `section-${i + 1}`;
    });
}

const num = (i: number) => String(i + 1).padStart(2, "0");

function renderDoc(
    doc: LegalDoc,
    other: LegalDoc,
    locale: SiteLocale,
    suffix: "/privacy" | "/terms",
    otherSuffix: "/privacy" | "/terms",
): string {
    const url = `${SITE}${pathFor(locale, suffix)}`;
    const title = `${esc(doc.title)} — Nutrition MCP`;

    const english = (suffix === "/privacy" ? PRIVACY : TERMS).en ?? doc;
    const ids = sectionIds(english, doc.sections.length);
    // Locale files gain these fields after the English ones; until a
    // translation lands, fall back rather than print "undefined".
    const lead = doc.lead ?? doc.metaDescription;
    const documentsLabel =
        doc.documentsLabel ?? english.documentsLabel ?? "Legal documents";
    const tocLabel = doc.tocLabel ?? english.tocLabel ?? "On this page";
    const privacyTitle = suffix === "/privacy" ? doc.title : other.title;
    const termsTitle = suffix === "/terms" ? doc.title : other.title;
    const current = (s: string) => (s === suffix ? ` aria-current="page"` : "");

    const tocItems = (indent: string) =>
        doc.sections
            .map(
                (s, i) =>
                    `${indent}<li><a href="#${ids[i]}"><span class="legal-toc-num">${num(i)}</span><span class="legal-toc-label">${esc(s.heading)}</span></a></li>`,
            )
            .join("\n");

    const sections = doc.sections
        .map(
            (s, i) =>
                `                    <section class="legal-section" id="${ids[i]}" aria-labelledby="${ids[i]}-title">
                        <div class="legal-section-head">
                            <span class="legal-num" aria-hidden="true">${num(i)}</span>
                            <h2 id="${ids[i]}-title">${esc(s.heading)}</h2>
                        </div>
                        <div class="legal-blocks">
${s.blocks.map((b) => renderBlock(b, locale)).join("\n")}
                        </div>
                    </section>`,
        )
        .join("\n\n");

    const notice = translationNotice(locale, suffix, "legal");

    return `<!doctype html>
<html lang="${HTML_LANG[locale]}">
    <head>
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="utf-8" />
        <meta name="description" content="${esc(doc.metaDescription)}" />
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${esc(doc.ogDescription)}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${url}" />
${OG_IMAGE_META}
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${esc(doc.ogDescription)}" />
${localeHead(locale, suffix)}
${ICON_LINKS}
        <meta name="theme-color" content="${THEME_COLOR_LIGHT}" />
${HEAD_ASSETS}
${LEGAL_STYLE}
    </head>
    <body class="legal">
${generatedBanner("scripts/gen-legal.ts")}
${EMAIL_OFF_OPEN}
${THEME_PREPAINT}

${nav(locale, suffix, suffix)}

        <main id="main" class="legal-main">
            <section class="legal-hero" aria-labelledby="legal-title">
                <div class="legal-hero-text">
                    <p class="legal-updated"><span class="legal-dot" aria-hidden="true"></span><span class="legal-date">${esc(doc.lastUpdated)}</span></p>
                    <h1 class="legal-title" id="legal-title">${esc(doc.title)}</h1>
                    <p class="legal-lead">${esc(lead)}</p>
                </div>
                <nav class="legal-switch" aria-label="${esc(documentsLabel)}">
                    <a href="${pathFor(locale, "/privacy")}"${current("/privacy")}>${esc(privacyTitle)}</a>
                    <a href="${pathFor(locale, "/terms")}"${current("/terms")}>${esc(termsTitle)}</a>
                </nav>
            </section>
${notice ? `\n            <div class="legal-notice-wrap">\n${notice}\n            </div>\n` : ""}
            <div class="legal-body">
                <aside class="legal-aside">
                    <nav class="legal-toc" aria-label="${esc(tocLabel)}">
                        <ol class="legal-toc-list legal-only-wide">
${tocItems("                            ")}
                        </ol>
                        <details class="legal-toc-fold legal-only-narrow">
                            <summary><span class="legal-toc-fold-title">${esc(doc.title)}</span><span class="legal-toc-fold-icon" aria-hidden="true"><i class="fa-solid fa-plus ic-plus"></i><i class="fa-solid fa-minus ic-minus"></i></span></summary>
                            <ol class="legal-toc-list">
${tocItems("                                ")}
                            </ol>
                        </details>
                    </nav>
                </aside>

                <article class="legal-article" aria-labelledby="legal-title">
${sections}

                    <div class="legal-foot">
                        <a class="legal-back" href="${pathFor(locale, "")}"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i>${esc(doc.backToHome)}</a>
                        <a class="legal-next" href="${pathFor(locale, otherSuffix)}">${esc(other.title)}<i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
                    </div>
                </article>
            </div>
        </main>

${footer(locale, suffix)}

${TOC_SCRIPT}
${SITE_SCRIPT}
${EMAIL_OFF_CLOSE}
    </body>
</html>
`;
}

for (const [locale, doc] of Object.entries(PRIVACY) as [
    SiteLocale,
    LegalDoc,
][]) {
    const otherDoc = TERMS[locale];
    if (!otherDoc) {
        throw new Error(
            `src/copy/legal.ts: locale "${locale}" has a PRIVACY entry but no TERMS entry`,
        );
    }
    const file =
        locale === "en"
            ? "./public/privacy.html"
            : `./public/${locale}/privacy.html`;
    await Bun.write(
        file,
        renderDoc(doc, otherDoc, locale, "/privacy", "/terms"),
    );
    console.log(`wrote ${file}`);
}

for (const [locale, doc] of Object.entries(TERMS) as [SiteLocale, LegalDoc][]) {
    const otherDoc = PRIVACY[locale];
    if (!otherDoc) {
        throw new Error(
            `src/copy/legal.ts: locale "${locale}" has a TERMS entry but no PRIVACY entry`,
        );
    }
    const file =
        locale === "en"
            ? "./public/terms.html"
            : `./public/${locale}/terms.html`;
    await Bun.write(
        file,
        renderDoc(doc, otherDoc, locale, "/terms", "/privacy"),
    );
    console.log(`wrote ${file}`);
}
