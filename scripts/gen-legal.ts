/**
 * Generates public/privacy.html, public/terms.html, and their translated
 * counterparts under public/{locale}/ from the typed data in
 * src/copy/legal.ts. These two pages used to be hand-authored HTML with
 * nav()/footer() copy-pasted in by hand; see scripts/gen-alternatives.ts
 * and scripts/site-partials.ts for why every generated page now shares one
 * copy of that markup instead.
 *
 * The page is the Dawn document layout: a page hero (mono "Last updated"
 * eyebrow, h1, lead), the translation-notice band on non-English pages,
 * then a two-column .nm-doc — a sticky table of contents on the left (the
 * plain .nm-toc list on desktop, the same list folded into a <details> on
 * phones) and the prose in one big panel on the right. Everything visible
 * is a shared primitive from public/styles.css; the <style> block below
 * is only the page's own layout glue.
 *
 * Re-run after editing src/copy/legal.ts:
 *   bun run scripts/gen-legal.ts
 * The generated .html files are the served artifacts — don't hand-edit them.
 */

import { HTML_LANG, pathFor, type SiteLocale } from "../src/routes.js";
import {
    SITE,
    attr,
    esc,
    footer,
    generatedBanner,
    localeHead,
    nav,
    translationNotice,
    HEAD_ASSETS,
    SITE_SCRIPT,
    THEME_PREPAINT,
} from "./site-partials.js";
import {
    LEGAL_UI,
    PRIVACY,
    TERMS,
    type LegalBlock,
    type LegalDoc,
} from "../src/copy/legal.js";

// Page-only layout, identical on both pages. The primitives it arranges
// (.nm-page-hero, .nm-doc, .nm-toc, .nm-panel, .nm-prose, .nm-btn) are the
// shared ones in public/styles.css — nothing visual is defined here.
const LEGAL_STYLE = `        <style>
            /* The document sits directly under the hero (or the translation
               band); .nm-section's top padding would double the gap. */
            body.legal .legal-body {
                padding-top: 0;
            }
            /* A section jumped to from the TOC would land under the sticky
               pill bar otherwise (same margin .nm-prose h2 carries). */
            body.legal .legal-section {
                scroll-margin-top: calc(var(--head-h) + 16px);
            }
            /* The panel frames a 62ch measure; on a wide screen it stops
               short of the grid column instead of leaving a blank right
               half inside the surface. */
            body.legal .legal-panel {
                max-width: 760px;
            }
            body.legal .legal-foot {
                margin-top: 32px;
                padding-top: 24px;
                border-top: 1px solid var(--line);
            }
            body.legal .legal-foot .nm-btn i {
                font-size: 12px;
            }
        </style>`;

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
        return `                                <p>\n                                    ${localizeCrossLinks(b.html, locale)}\n                                </p>`;
    return `                                <ul>\n${b.items
        .map(
            (i) =>
                `                                    <li>${localizeCrossLinks(i, locale)}</li>`,
        )
        .join("\n")}\n                                </ul>`;
}

// Section ids are positional ("s1", "s2", …) rather than slugs of the
// heading: headings are translated, and the same section must keep the
// same anchor on every locale's page.
const sectionId = (i: number) => `s${i + 1}`;

function renderToc(doc: LegalDoc): string {
    return doc.sections
        .map(
            (s, i) =>
                `                                <li><a href="#${sectionId(i)}">${esc(s.heading)}</a></li>`,
        )
        .join("\n");
}

function renderDoc(
    doc: LegalDoc,
    other: LegalDoc,
    locale: SiteLocale,
    suffix: "/privacy" | "/terms",
    otherSuffix: "/privacy" | "/terms",
): string {
    const url = `${SITE}${pathFor(locale, suffix)}`;
    const title = `${esc(doc.title)} — Nutrition MCP`;
    const ui = LEGAL_UI[locale];
    const notice = translationNotice(locale, suffix);

    // The entrance reveal sits on the TOC and on each section, never on
    // the whole document: site.js reveals an element once 8% of it is in
    // view, and /terms runs to ~16 phone viewports, so a reveal on the body
    // could never reach that ratio — the prose stayed at opacity 0 on a
    // phone with JS enabled. A section tops out around two viewports.
    const sections = doc.sections
        .map(
            (s, i) =>
                `                            <section class="legal-section" id="${sectionId(i)}" data-reveal>
                                <h2>${esc(s.heading)}</h2>
${s.blocks.map((b) => renderBlock(b, locale)).join("\n")}
                            </section>`,
        )
        .join("\n\n");

    // The TOC is rendered twice — the plain sticky list for ≥900px and the
    // same list inside a <details> for phones — because a closed <details>
    // cannot be forced open from CSS; .nm-only-wide / .nm-only-narrow show
    // exactly one of them at any width.
    const toc = renderToc(doc);

    return `<!doctype html>
<html lang="${HTML_LANG[locale]}">
    <head>
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="utf-8" />
        <meta name="description" content="${attr(doc.metaDescription)}" />
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${attr(doc.ogDescription)}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${url}" />
        <meta property="og:image" content="${SITE}/og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${SITE}/og.png" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${attr(doc.ogDescription)}" />
${localeHead(locale, suffix)}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#f7f7f9" />
${HEAD_ASSETS}
${LEGAL_STYLE}
    </head>
    <body class="legal">
${generatedBanner("scripts/gen-legal.ts")}
${THEME_PREPAINT}

        <!-- The three colour blobs behind the hero. -->
        <div class="nm-bg" aria-hidden="true">
            <div class="nm-bg-blob nm-bg-1"></div>
            <div class="nm-bg-blob nm-bg-2"></div>
            <div class="nm-bg-blob nm-bg-3"></div>
            <div class="nm-bg-fade"></div>
        </div>

${nav(locale, suffix, suffix)}

        <main id="main">
            <section class="nm-section nm-page-hero" aria-labelledby="legal-title">
                <p class="nm-eyebrow">${esc(ui.lastUpdated)} · ${esc(doc.lastUpdated)}</p>
                <h1 class="nm-h1" id="legal-title">${esc(doc.title)}</h1>
                <p class="nm-lead">${esc(doc.metaDescription)}</p>
            </section>
${
    notice
        ? `
            <div class="nm-section nm-notice-band">
${notice}
            </div>
`
        : ""
}
            <div class="nm-section legal-body">
                <div class="nm-doc">
                    <aside class="nm-doc-aside" data-reveal>
                        <nav aria-label="${attr(ui.contents)}">
                            <ol class="nm-toc nm-only-wide">
${toc}
                            </ol>
                            <details class="nm-toc-fold nm-only-narrow">
                                <summary>${esc(ui.contents)} <i class="fa-solid fa-chevron-down" aria-hidden="true"></i></summary>
                                <ol class="nm-toc">
${toc}
                                </ol>
                            </details>
                        </nav>
                    </aside>

                    <div class="nm-panel nm-panel-lg legal-panel">
                        <div class="nm-prose">
${sections}
                        </div>

                        <div class="legal-foot nm-actions-row">
                            <a class="nm-btn nm-btn-outline nm-btn-md" href="${pathFor(locale, "")}"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> ${esc(doc.backToHome)}</a>
                            <a class="nm-btn nm-btn-soft nm-btn-md" href="${pathFor(locale, otherSuffix)}">${esc(other.title)} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
                        </div>
                    </div>
                </div>
            </div>
        </main>

${footer(locale, suffix)}

${SITE_SCRIPT}
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
