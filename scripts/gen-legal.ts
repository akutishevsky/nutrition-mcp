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
} from "./site-partials.js";
import {
    PRIVACY,
    TERMS,
    type LegalBlock,
    type LegalDoc,
} from "../src/copy/legal.js";

// Page-layout CSS, identical on both pages in the original hand-authored
// HTML (verified by diff) except for the metadata around it — kept as one
// constant here for the same reason nav()/footer() are shared.
const LEGAL_STYLE = `        <style>
            /* Page layout: sticky header, centred stage, footer at the foot.
               body.auth in styles.css is flex-centred for the old standalone
               card; here the stage does the centring instead. */
            body.auth {
                display: flex;
                flex-direction: column;
                align-items: stretch;
                justify-content: flex-start;
                padding: 0;
            }
            body.auth > main {
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            /* Reading layout: one measured column, no card. */
            .legal-page {
                width: 100%;
                max-width: 760px;
                margin: 0 auto;
                padding: clamp(2.5rem, 7vw, 5rem) clamp(1.25rem, 4vw, 2.5rem)
                    clamp(3rem, 8vw, 6rem);
            }
            .legal-page .auth-card {
                background: transparent;
                border: 0;
                border-radius: 0;
                box-shadow: none;
                padding: 0;
                animation: none;
            }
            .legal-page .auth-head {
                text-align: left;
                margin-bottom: 0;
            }
            .legal-page .auth-mark {
                display: none;
            }
            .legal-page .auth-title {
                font-size: clamp(2.2rem, 5vw, 3.4rem);
            }
            body.auth .legal-page .legal-updated {
                margin: 0 0 1rem;
            }
            body.auth .legal-page .legal-updated.eyebrow {
                font-size: 0.74rem;
                color: var(--accent-hover);
            }
            .legal-page .translation-notice {
                margin-bottom: clamp(2rem, 4vw, 2.75rem);
            }
            body.auth .legal-page .auth-card .legal-section {
                margin: 0 0 clamp(2rem, 4vw, 2.75rem);
                padding-top: 1rem;
                border-top: 3px solid var(--rule);
            }
            body.auth .legal-page .legal-heading {
                font-size: clamp(1.3rem, 2.4vw, 1.6rem);
                line-height: 1.15;
                margin: 0 0 0.85rem;
            }
            body.auth .legal-page .legal-section p {
                font-size: 1.05rem;
                line-height: 1.65;
                color: var(--ink-2);
                text-wrap: pretty;
            }
            body.auth .legal-page .legal-section strong {
                color: var(--ink);
            }
            body.auth .legal-page .legal-section p + p,
            body.auth .legal-page .legal-section ul + p {
                margin-top: 1rem;
            }
            body.auth .legal-page .legal-section ul {
                list-style: none;
                margin: 1rem 0 0;
                padding: 0;
                border-top: 1px solid var(--line);
                font-size: 1.05rem;
                line-height: 1.65;
                color: var(--ink-2);
            }
            body.auth .legal-page .legal-section li {
                margin: 0;
                padding: 0.75rem 0;
                border-bottom: 1px solid var(--line);
            }
            body.auth .legal-page .legal-foot {
                text-align: left;
                margin-top: 0;
                padding-top: 1.25rem;
                border-top: 3px solid var(--rule);
                font-family: var(--font-mono);
                font-size: 0.8rem;
            }
            .legal-page .legal-back {
                font-size: inherit;
                color: var(--ink-2);
            }
            .legal-page .legal-back:hover {
                color: var(--ink);
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
        return `                        <p>\n                            ${localizeCrossLinks(b.html, locale)}\n                        </p>`;
    return `                        <ul>\n${b.items
        .map(
            (i) =>
                `                            <li>${localizeCrossLinks(i, locale)}</li>`,
        )
        .join("\n")}\n                        </ul>`;
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

    const sections = doc.sections
        .map(
            (s) =>
                `                    <div class="legal-section">
                        <h2 class="legal-heading">${esc(s.heading)}</h2>
${s.blocks.map((b) => renderBlock(b, locale)).join("\n")}
                    </div>`,
        )
        .join("\n\n");

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
        <meta property="og:image" content="${SITE}/og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${SITE}/og.png" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${esc(doc.ogDescription)}" />
${localeHead(locale, suffix)}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#fbfbf9" />
${HEAD_ASSETS}
${LEGAL_STYLE}
    </head>
    <body class="auth">
${generatedBanner("scripts/gen-legal.ts")}
${THEME_PREPAINT}

${nav(locale, suffix, suffix)}

        <main id="main">
            <div class="legal-page">
                <div class="auth-card">
                    <div class="auth-head">
                        <span class="auth-mark" aria-hidden="true">🍏</span>
                        <h1 class="auth-title display">${esc(doc.title)}</h1>
                    </div>

                    <p class="legal-updated eyebrow">${esc(doc.lastUpdated)}</p>

${translationNotice(locale, suffix)}

${sections}

                    <div class="legal-foot">
                        <a href="${pathFor(locale, "")}" class="legal-back">&larr; ${esc(doc.backToHome)}</a>
                        <span class="legal-sep" aria-hidden="true">·</span>
                        <a href="${pathFor(locale, otherSuffix)}" class="legal-back">${esc(other.title)}</a>
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
