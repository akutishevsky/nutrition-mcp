/**
 * Generates the SEO "alternative to X" comparison pages under
 * public/alternatives/ from a single template plus the per-app data below.
 *
 * These pages target long-tail bridge queries seen in Search Console — e.g.
 * "myfitnesspal mcp", "connect cronometer to claude" — that the single-page
 * site can't rank for. Each page carries unique title/description/canonical/OG
 * plus FAQPage and BreadcrumbList JSON-LD.
 *
 * Edit the APPS data (or the shared template) here and re-run:
 *   bun run scripts/gen-alternatives.ts
 * The generated .html files are the served artifacts — don't hand-edit them.
 *
 * Self-hosting: scripts/depersonalize.ts cleans the generated .html files but
 * NOT this generator. If you regenerate, update SITE (src/routes.ts) and the
 * GA / Clarity tags, GitHub links and contact email in the shared fragments
 * (scripts/site-partials.ts) first.
 */

import {
    HTML_LANG,
    LOCALES,
    hashPath,
    pathFor,
    urlFor,
    type SiteLocale,
} from "../src/routes.js";
import {
    ALT_PAGE_META,
    ALTERNATIVES_COPY,
    type AppCopy,
    type AppSlug,
} from "../src/copy/alternatives.js";
import { ALT_UI_EN, altUiFor, type AltUiCopy } from "../src/copy/alt-ui.js";
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
    EMAIL_OFF_OPEN,
    EMAIL_OFF_CLOSE,
    THEME_COLOR_LIGHT,
    logoSvg,
    ICON_LINKS,
} from "./site-partials.js";

// The structural, non-translatable fields only. Every piece of prose about
// an app (hubBlurb, cons, note, migrate, importSection, importFaq,
// extraFaqs, freeAnswer) lives in src/copy/alternatives.ts's AppCopy,
// keyed by `slug`, and is looked up per-locale via copyFor() below — see
// that file's doc comments for what each field means and the accuracy
// rules (Yazio/Lifesum not recognised by name, sniffed-then-confirmed
// dates/units, browser-side parsing) that still apply wherever the copy
// now lives.
type App = {
    /** Display name, e.g. "MyFitnessPal". */
    name: string;
    /** URL path (no leading slash), e.g. "myfitnesspal-mcp". */
    slug: AppSlug;
    /** Output filename under public/alternatives/. */
    file: string;
    /** Font Awesome icon class (hub card, hero eyebrow chip, compare card). */
    icon: string;
    /** Colour role tinting the hub tile and hero chip: a `.nm-c-*` suffix. */
    tint: "cal" | "car" | "fat" | "pro" | "fib";
};

/**
 * Looks up an app's translatable copy for `locale`, falling back to English
 * when that locale has no entry yet (every locale but 'en' today — see
 * src/copy/alternatives.ts). English itself is asserted present via `!`
 * since ALTERNATIVES_COPY.en covers every AppSlug by construction.
 */
function copyFor(slug: AppSlug, locale: SiteLocale): AppCopy {
    return ALTERNATIVES_COPY[locale]?.[slug] ?? ALTERNATIVES_COPY.en![slug];
}

function metaFor(locale: SiteLocale) {
    return ALT_PAGE_META[locale] ?? ALT_PAGE_META.en!;
}

const APPS: App[] = [
    {
        name: "MyFitnessPal",
        slug: "myfitnesspal-mcp",
        file: "myfitnesspal.html",
        icon: "fa-fire-flame-curved",
        tint: "cal",
    },
    {
        name: "Cronometer",
        slug: "cronometer-mcp",
        file: "cronometer.html",
        icon: "fa-seedling",
        tint: "car",
    },
    {
        name: "Lose It!",
        slug: "lose-it-mcp",
        file: "lose-it.html",
        icon: "fa-bullseye",
        tint: "fat",
    },
    {
        name: "MacroFactor",
        slug: "macrofactor-mcp",
        file: "macrofactor.html",
        icon: "fa-chart-simple",
        tint: "pro",
    },
    {
        name: "Yazio",
        slug: "yazio-mcp",
        file: "yazio.html",
        icon: "fa-carrot",
        tint: "cal",
    },
    {
        name: "Lifesum",
        slug: "lifesum-mcp",
        file: "lifesum.html",
        icon: "fa-leaf",
        tint: "fib",
    },
];

/**
 * Trademark / non-affiliation notice, the last thing inside <main> on every
 * comparison page and the hub. Keeps the pages clearly independent and
 * hedges the comparisons as point-in-time — the main legal safeguards for
 * "alternative to X" content.
 */
function disclaimerBlock(html: string): string {
    return `            <div class="alt-sec alt-disclaimer">
                <p>${html}</p>
            </div>`;
}

/** The AI-translation disclosure under the hero (empty for English). */
function noticeBand(locale: SiteLocale, suffix: string): string {
    const notice = translationNotice(locale, suffix);
    return notice
        ? `            <div class="translation-notice-band">
${notice}
            </div>\n`
        : "";
}

/**
 * Breadcrumb landmark. The label falls back to English only while a locale
 * file still lacks `breadcrumbAriaLabel` (typecheck flags that file).
 */
function crumbNav(ui: AltUiCopy, items: string): string {
    const label = ui.breadcrumbAriaLabel ?? ALT_UI_EN.breadcrumbAriaLabel;
    return `                <nav class="alt-crumb" aria-label="${esc(label)}">
${items}
                </nav>`;
}

const CHEVRON = `<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>`;

/** Eyebrow + heading stack used at the top of every section. */
function head(eyebrow: string, id: string, title: string, extra = ""): string {
    return `                    <p class="nm-eyebrow">${eyebrow}</p>
                    <h2 id="${id}" class="nm-h2">${title}</h2>${extra}`;
}

/**
 * Page CSS. Everything here is layout specific to the /alternatives pages;
 * type, buttons, tiles, the ink slab and the accordion are the shared
 * `.nm-*` primitives in public/styles.css. Colours are tokens only, so dark
 * mode needs nothing of its own. Values are the design's
 * ("Alternatives Page.dc.html").
 */
const ALT_CSS = `        <style>
            body.alt .alt-sec {
                position: relative;
                z-index: 1;
                max-width: var(--container);
                margin: 0 auto;
                box-sizing: content-box;
                padding: clamp(8px, 2vw, 24px) var(--gutter);
            }
            body.alt .alt-sec-lg {
                padding-top: var(--section-pad);
                padding-bottom: var(--section-pad);
            }
            body.alt .alt-hero {
                padding-top: clamp(28px, 4vw, 56px);
                padding-bottom: clamp(32px, 5vw, 64px);
            }
            body.alt #apps {
                padding-top: clamp(24px, 4vw, 56px);
                padding-bottom: clamp(24px, 4vw, 56px);
            }
            body.alt .alt-sec-cta {
                padding-top: clamp(24px, 3vw, 40px);
                padding-bottom: clamp(24px, 3vw, 40px);
            }
            body.alt .alt-disclaimer {
                padding-top: clamp(16px, 2vw, 28px);
                padding-bottom: clamp(32px, 4vw, 56px);
            }
            body.alt .alt-disclaimer p {
                margin: 0;
                max-width: 96ch;
                font-size: 13px;
                line-height: 1.6;
                color: var(--ink3);
                text-wrap: pretty;
            }
            body.alt .nm-eyebrow {
                margin: 0;
                letter-spacing: 0.08em;
            }

            /* breadcrumb */
            body.alt .alt-crumb {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 8px;
                margin-bottom: clamp(24px, 4vw, 40px);
                font-size: 14px;
                font-weight: 600;
                color: var(--ink3);
                animation: nm-rise 0.6s both;
            }
            body.alt .alt-crumb a {
                color: var(--ink2);
            }
            body.alt .alt-crumb a:hover {
                color: var(--acc-txt);
            }
            body.alt .alt-crumb i {
                font-size: 9px;
            }
            body.alt .alt-crumb [aria-current] {
                color: var(--ink);
            }

            /* hero */
            body.alt .alt-hero-row {
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                align-items: end;
                gap: 24px clamp(32px, 5vw, 72px);
            }
            body.alt .alt-hero-main {
                flex: 1 1 560px;
                min-width: 0;
            }
            body.alt .alt-hero-side {
                flex: 1 1 340px;
                max-width: 46ch;
                display: grid;
                gap: 24px;
                animation: nm-rise 0.6s 0.16s both;
            }
            body.alt-hub .alt-hero-side {
                flex: 1 1 400px;
                max-width: 470px;
            }
            body.alt .alt-pill {
                margin: 0 0 22px;
                height: auto;
                min-height: 34px;
                box-sizing: border-box;
                gap: 10px;
                padding: 4px 14px 4px 5px;
                font-size: 14px;
                white-space: normal;
                animation: nm-rise 0.6s both;
            }
            body.alt .alt-pill.is-dot {
                padding: 6px 14px 6px 12px;
            }
            body.alt .alt-pill .nm-pulse-dot {
                animation-duration: 2.2s;
            }
            body.alt .alt-pill-icon {
                flex: none;
                width: 26px;
                height: 26px;
                border-radius: 50%;
                background: color-mix(in srgb, var(--c) 16%, var(--panel));
                color: var(--c-icon);
                display: grid;
                place-items: center;
                font-size: 11px;
            }
            body.alt .alt-h1 {
                max-width: 14ch;
                animation: nm-rise 0.6s 0.08s both;
            }
            body.alt-hub .alt-h1 {
                max-width: 15ch;
            }
            body.alt .alt-h1 em {
                font-style: normal;
                color: var(--acc-txt);
            }
            body.alt .alt-lead {
                margin: 0;
                font-size: clamp(17px, 1.5vw, 19px);
                color: var(--ink2);
                text-wrap: pretty;
            }
            body.alt .alt-actions,
            body.alt .alt-cta-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            body.alt .alt-actions .nm-btn {
                height: 52px;
                padding: 0 24px;
                gap: 10px;
                font-size: 17px;
            }
            body.alt .alt-actions .nm-btn-glass {
                padding: 0 22px;
                font-weight: 600;
                border-color: var(--line2);
            }
            body.alt .alt-actions .nm-btn-glass:hover {
                background: var(--bg2);
                color: var(--ink);
            }
            body.alt .nm-btn i {
                font-size: 12px;
            }
            body.alt .nm-btn-ghost-dark .fa-github {
                font-size: 18px;
            }
            body.alt .nm-btn-ghost-dark .nm-stars {
                font-family: var(--mono);
                font-size: 13px;
                opacity: 0.75;
            }
            body.alt .nm-btn-ghost-dark .nm-stars i {
                font-size: 10px;
            }

            /* section heads */
            body.alt .alt-stack {
                display: grid;
                gap: 14px;
                align-content: start;
            }
            body.alt .alt-head {
                margin-bottom: 32px;
            }
            body.alt .alt-head-row {
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                align-items: end;
                gap: 16px clamp(32px, 5vw, 72px);
                margin-bottom: 32px;
            }
            body.alt .alt-head-row > .alt-stack {
                flex: 1 1 560px;
                min-width: 0;
            }
            body.alt .alt-head-row > .nm-sub {
                flex: 1 1 400px;
                max-width: 470px;
            }
            body.alt #instead-title {
                max-width: 16ch;
            }

            /* the short answer */
            body.alt .alt-answer {
                padding: clamp(24px, 4vw, 48px);
                display: grid;
                grid-template-columns: repeat(
                    auto-fit,
                    minmax(min(100%, 340px), 1fr)
                );
                gap: clamp(20px, 4vw, 56px);
                align-items: start;
            }
            body.alt .alt-answer .nm-h2 {
                font-size: clamp(30px, 3.8vw, 48px);
                line-height: 1.02;
                letter-spacing: -0.035em;
            }
            body.alt .alt-answer-body {
                margin: 0;
                color: var(--ink2);
                font-size: 17.5px;
                line-height: 1.65;
                text-wrap: pretty;
            }
            body.alt .alt-answer-body em {
                color: var(--ink);
            }

            /* card grids (features, hub app cards) */
            body.alt .alt-grid {
                display: grid;
                grid-template-columns: repeat(
                    auto-fit,
                    minmax(min(100%, 300px), 1fr)
                );
                gap: 14px;
            }
            body.alt .alt-tcard {
                padding: 24px;
                display: grid;
                gap: 14px;
                align-content: start;
                color: var(--ink);
                transition:
                    transform 0.25s,
                    border-color 0.25s;
            }
            body.alt .alt-tcard:hover {
                transform: translateY(-4px);
            }
            body.alt .alt-tcard .nm-tile {
                width: 44px;
                height: 44px;
                border-radius: 16px;
                font-size: 17px;
            }
            body.alt .alt-feature h3 {
                margin: 0;
                font-weight: 800;
                font-size: 20px;
                letter-spacing: -0.02em;
                line-height: 1.2;
            }
            body.alt .alt-feature p {
                margin: 8px 0 0;
                font-size: 15px;
                color: var(--ink2);
                text-wrap: pretty;
            }
            body.alt .alt-app-card {
                gap: 16px;
            }
            body.alt .alt-app-card:hover {
                border-color: var(--line2);
                color: var(--ink);
            }
            body.alt .alt-app-card .nm-tile {
                width: 48px;
                height: 48px;
                font-size: 18px;
            }
            body.alt .alt-app-top {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            body.alt .alt-app-arrow {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: var(--bg2);
                display: grid;
                place-items: center;
                font-size: 12px;
                color: var(--ink);
            }
            body.alt .alt-app-card h3 {
                margin: 0;
                font-weight: 800;
                font-size: 22px;
                letter-spacing: -0.025em;
                line-height: 1.15;
            }
            body.alt .alt-app-card p {
                margin: 6px 0 0;
                font-size: 15px;
                color: var(--ink2);
                text-wrap: pretty;
            }
            body.alt .alt-note {
                margin: 20px 0 0;
                max-width: 72ch;
                font-size: 15px;
                color: var(--ink2);
                text-wrap: pretty;
            }
            body.alt #apps .alt-note {
                margin-top: 22px;
            }
            body.alt .alt-note a,
            body.alt .alt-install-note a,
            body.alt .alt-steps a {
                color: var(--acc-txt);
                font-weight: 700;
                text-decoration: underline;
                text-underline-offset: 3px;
            }

            /* compare */
            body.alt .alt-compare {
                display: grid;
                grid-template-columns: repeat(
                    auto-fit,
                    minmax(min(100%, 340px), 1fr)
                );
                gap: 14px;
            }
            body.alt .alt-compare-old {
                background: var(--bg2);
                border: 1px solid var(--line);
                border-radius: 28px;
                padding: 28px;
            }
            body.alt .alt-compare-new {
                border-radius: 28px;
                padding: 28px;
            }
            body.alt .alt-compare-glow {
                position: absolute;
                right: -80px;
                bottom: -120px;
                width: 320px;
                height: 320px;
                border-radius: 50%;
                background: var(--acc);
                opacity: 0.28;
                filter: blur(80px);
                pointer-events: none;
            }
            body.alt .alt-compare h3 {
                position: relative;
                margin: 0 0 20px;
                display: flex;
                align-items: center;
                gap: 12px;
                font-weight: 800;
                font-size: 22px;
                letter-spacing: -0.02em;
            }
            body.alt .alt-compare-old h3 {
                color: var(--ink2);
            }
            body.alt .alt-compare-ico {
                flex: none;
                width: 36px;
                height: 36px;
                border-radius: 12px;
                background: var(--panel);
                color: var(--ink3);
                display: grid;
                place-items: center;
                font-size: 14px;
            }
            body.alt .alt-compare-new h3 .nm-logo {
                display: block;
                flex: none;
                color: var(--acc-on-dark);
            }
            body.alt .alt-list {
                position: relative;
                margin: 0;
                padding: 0;
                list-style: none;
                display: grid;
                gap: 14px;
            }
            body.alt .alt-compare-old .alt-list {
                color: var(--ink2);
            }
            body.alt .alt-list li {
                display: grid;
                grid-template-columns: 22px 1fr;
                gap: 12px;
                align-items: start;
                line-height: 1.45;
            }
            body.alt .alt-list li > i {
                width: 22px;
                height: 22px;
                margin-top: 1px;
                border-radius: 50%;
                display: grid;
                place-items: center;
                font-size: 11px;
            }
            body.alt .alt-compare-old .alt-list li > i {
                background: var(--line);
                color: var(--ink3);
            }
            body.alt .alt-compare-new .alt-list li > i {
                background: var(--acc);
                color: var(--acc-ink);
            }

            /* split sections: heading left, panel right */
            body.alt .alt-split {
                display: flex;
                flex-wrap: wrap;
                gap: clamp(24px, 4vw, 56px);
                align-items: flex-start;
            }
            body.alt .alt-split-head {
                flex: 1 1 300px;
                display: grid;
                gap: 14px;
            }
            body.alt .alt-faq-head {
                flex: 1 1 280px;
            }
            @media (min-width: 900px) {
                body.alt .alt-split-head.is-sticky {
                    position: sticky;
                    top: 110px;
                }
            }
            body.alt .alt-panel {
                flex: 1.5 1 480px;
                min-width: 0;
            }
            body.alt .alt-prose {
                padding: clamp(22px, 3vw, 40px);
                display: grid;
                gap: 18px;
            }
            body.alt .alt-prose p {
                margin: 0;
                color: var(--ink2);
                font-size: 16.5px;
                line-height: 1.65;
                text-wrap: pretty;
            }

            /* install steps */
            body.alt .alt-steps-panel {
                padding: clamp(18px, 2.6vw, 32px);
                display: grid;
                gap: 8px;
            }
            body.alt .alt-steps {
                margin: 0;
                padding: 0;
                list-style: none;
                display: grid;
                gap: 8px;
            }
            body.alt .alt-steps li {
                display: grid;
                grid-template-columns: 40px 1fr;
                gap: 16px;
                align-items: center;
                padding: 14px 16px 14px 14px;
                background: var(--bg);
                border: 1px solid var(--line);
                border-radius: 20px;
                font-size: 16.5px;
                line-height: 1.45;
                text-wrap: pretty;
            }
            body.alt .alt-step-n {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: var(--ink);
                color: var(--bg);
                display: grid;
                place-items: center;
                font-family: var(--mono);
                font-size: 14px;
                font-weight: 600;
            }
            body.alt .alt-steps li:last-child .alt-step-n {
                background: var(--acc);
                color: var(--acc-ink);
            }
            body.alt .alt-install-note {
                margin: 8px 4px 0;
                font-size: 14.5px;
                color: var(--ink2);
                text-wrap: pretty;
            }

            /* FAQ: the shared .nm-faq accordion inside a panel */
            body.alt .alt-faq {
                flex: 2 1 520px;
                padding: 6px clamp(14px, 2vw, 26px);
                border-top: 1px solid var(--line);
            }
            body.alt .alt-faq .nm-faq-row:last-child {
                border-bottom: 0;
            }
            body.alt .alt-faq .nm-faq-q {
                font-size: 17px;
                line-height: 1.35;
            }
            body.alt .alt-faq .nm-faq-n {
                min-width: 24px;
            }
            body.alt .alt-faq .nm-faq-ic {
                font-size: 11px;
                color: var(--ink2);
            }
            body.alt .alt-faq .nm-faq-row[open] .nm-faq-ic {
                color: var(--bg);
                transform: none;
            }
            /* The design swaps plus for minus on an open row, where the
               shared accordion rotates the plus into an x. */
            body.alt .alt-faq .nm-faq-row[open] .nm-faq-ic i::before {
                content: "\\f068";
            }
            body.alt .alt-faq .nm-faq-a {
                margin: 0;
                padding: 0 46px 20px 44px;
                max-width: 68ch;
                font-size: 15.5px;
                text-wrap: pretty;
            }
            @media (max-width: 559px) {
                body.alt .alt-faq .nm-faq-q {
                    font-size: 16px;
                }
                body.alt .alt-faq .nm-faq-a {
                    padding: 0 4px 20px;
                }
            }

            /* closing CTA */
            body.alt .alt-cta {
                padding: clamp(28px, 6vw, 88px) clamp(20px, 6vw, 88px);
                text-align: center;
            }
            body.alt .alt-cta-blob {
                position: absolute;
                width: 400px;
                height: 400px;
                border-radius: 50%;
                filter: blur(90px);
                pointer-events: none;
            }
            body.alt .alt-cta-blob-bl {
                left: -60px;
                bottom: -140px;
                background: var(--car);
                opacity: 0.28;
            }
            body.alt .alt-cta-blob-tr {
                right: -60px;
                top: -140px;
                background: var(--pro);
                opacity: 0.24;
            }
            body.alt .alt-cta h2 {
                position: relative;
                margin: 0 auto;
                max-width: 16ch;
                font-weight: 800;
                font-size: clamp(36px, 5.6vw, 78px);
                line-height: 0.98;
                letter-spacing: -0.045em;
                text-wrap: balance;
            }
            body.alt .alt-cta > p {
                position: relative;
                margin: 18px auto 0;
                max-width: 40ch;
                opacity: 0.8;
            }
            body.alt .alt-cta-actions {
                position: relative;
                justify-content: center;
                gap: 12px;
                margin-top: 30px;
            }
            body.alt .alt-cta-actions .nm-btn {
                font-size: 16px;
            }
            body.alt .alt-cta-actions .nm-btn-ghost-dark {
                padding: 0 24px;
                gap: 10px;
                font-weight: 600;
            }

            /* Long translations (uk, de) must wrap on a 320px screen. */
            @media (max-width: 420px) {
                body.alt .alt-actions .nm-btn,
                body.alt .alt-cta-actions .nm-btn {
                    white-space: normal;
                    height: auto;
                    min-height: 52px;
                    padding-top: 12px;
                    padding-bottom: 12px;
                    line-height: 1.25;
                    text-align: center;
                }
            }
            @media (prefers-reduced-motion: reduce) {
                body.alt .alt-tcard:hover {
                    transform: none;
                }
            }
        </style>`;

// The "What you get instead" feature grid describes Nutrition MCP, so it's the
// same on every page. Icons and tints are structural (never translated);
// title/body come from AltUiCopy.app.features, matched by array position.
const FEATURES: { icon: string; tint: string }[] = [
    { icon: "fa-utensils", tint: "cal" },
    { icon: "fa-barcode", tint: "car" },
    { icon: "fa-weight-scale", tint: "fib" },
    { icon: "fa-chart-area", tint: "pro" },
    { icon: "fa-file-csv", tint: "sug" },
    { icon: "fa-code-branch", tint: "acc" },
];

function featuresBlock(ui: AltUiCopy): string {
    const cards = ui.app.features
        .map((f, i) => {
            const { icon, tint } = FEATURES[i]!;
            return `                    <article class="nm-card alt-tcard alt-feature nm-c-${tint}">
                        <span class="nm-tile" aria-hidden="true"><i class="fa-solid ${icon}"></i></span>
                        <div>
                            <h3>${f.title}</h3>
                            <p>${f.body}</p>
                        </div>
                    </article>`;
        })
        .join("\n");
    return `                <div class="alt-grid" data-reveal="stagger">
${cards}
                </div>`;
}

function installBlock(locale: SiteLocale, ui: AltUiCopy): string {
    const steps = ui.app.installSteps
        .map(
            (s, i) =>
                `                        <li><span class="alt-step-n" aria-hidden="true">${i + 1}</span><span>${s}</span></li>`,
        )
        .join("\n");
    const note = ui.app.installNoteTemplate.replace(
        "{link}",
        `<a href="${hashPath(locale, "install")}">${esc(ui.app.installLinkText)}</a>`,
    );
    return `                <div class="nm-card alt-panel alt-steps-panel">
                    <ol class="alt-steps">
${steps}
                    </ol>
                    <p class="alt-install-note">${note}</p>
                </div>`;
}

function faqsFor(
    app: App,
    copy: AppCopy,
    ui: AltUiCopy,
): { q: string; a: string }[] {
    const faq = ui.app.faq;
    return [
        {
            q: faq.mcpQ.replaceAll("{app}", app.name),
            a: faq.mcpA.replaceAll("{app}", app.name),
        },
        {
            q: faq.connectQ.replaceAll("{app}", app.name),
            a: faq.connectA.replaceAll("{app}", app.name),
        },
        ...copy.extraFaqs,
        {
            q: faq.goodAltQ.replaceAll("{app}", app.name),
            a: faq.goodAltA,
        },
        {
            q: faq.importQ.replaceAll("{app}", app.name),
            a: copy.importFaq + ui.app.importFallbackNote,
        },
        {
            q: faq.readExportQ,
            a: faq.readExportA,
        },
        {
            q: faq.freeQ,
            a: copy.freeAnswer ?? faq.freeAFallback,
        },
    ];
}

/** Numbered accordion rows (native exclusive <details>, the first open). */
function faqRows(faqs: { q: string; a: string }[]): string {
    return faqs
        .map(
            (
                f,
                i,
            ) => `                    <details class="nm-faq-row" name="alt-faq"${i === 0 ? " open" : ""}>
                        <summary class="nm-faq-q"><span class="nm-faq-n">${String(i + 1).padStart(2, "0")}</span><span>${esc(f.q)}</span><span class="nm-faq-ic" aria-hidden="true"><i class="fa-solid fa-plus"></i></span></summary>
                        <p class="nm-faq-a">${esc(f.a)}</p>
                    </details>`,
        )
        .join("\n");
}

/** Prose paragraphs inside a split section's panel. `raw` skips escaping. */
function proseParas(paras: string[], raw = false): string {
    return paras
        .map((p) => `                    <p>${raw ? p : esc(p)}</p>`)
        .join("\n");
}

// ---------- per-app page ----------

function renderApp(app: App, locale: SiteLocale = "en"): string {
    const copy = copyFor(app.slug, locale);
    const meta = metaFor(locale);
    const ui = altUiFor(locale);
    const url = urlFor(locale, `/${app.slug}`);
    // The <title> deliberately does NOT mention import: these pages rank on the
    // exact bridge query ("<app> mcp", "connect <app> to claude") and diluting
    // that head term would cost more than an import keyword gains. The
    // description is a click-through lever rather than a ranking one, so it does
    // carry import — abandoning logged history is the top objection to switching.
    // app.name (the brand, e.g. "MyFitnessPal") is never translated — only
    // the {app} placeholder's surrounding template is locale-specific.
    const desc = meta.appDesc.replaceAll("{app}", app.name);
    const ogDesc = meta.appOgDesc.replaceAll("{app}", app.name);
    const title = meta.appTitle.replaceAll("{app}", app.name);
    const faqs = faqsFor(app, copy, ui);
    // "Plain" AltUiCopy strings (see src/copy/alt-ui.ts's field docs) are
    // substituted then escaped here; "Html"-suffixed / documented-raw fields
    // already carry their own entities/tags and are inserted as-is below.
    const t = (s: string) => esc(s.replaceAll("{app}", app.name));
    const raw = (s: string) => s.replaceAll("{app}", esc(app.name));

    const breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Nutrition MCP",
                item: SITE,
            },
            {
                "@type": "ListItem",
                position: 2,
                name: "Alternatives",
                item: urlFor(locale, "/alternatives"),
            },
            {
                "@type": "ListItem",
                position: 3,
                name: `${app.name} MCP`,
                item: url,
            },
        ],
    };
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
    };

    const cons = copy.cons
        .map(
            (c) =>
                `                            <li><i class="fa-solid fa-xmark" aria-hidden="true"></i><span>${esc(c)}</span></li>`,
        )
        .join("\n");
    const pros = ui.app.pros
        .map(
            (p) =>
                `                            <li><i class="fa-solid fa-check" aria-hidden="true"></i><span>${p}</span></li>`,
        )
        .join("\n");

    return `<!doctype html>
<html lang="${HTML_LANG[locale]}">
    <head>
        <title>${esc(title)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="utf-8" />
        <meta name="description" content="${esc(desc)}" />
        <meta property="og:title" content="${esc(title)}" />
        <meta property="og:description" content="${esc(ogDesc)}" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="${url}" />
        <meta property="og:image" content="${SITE}/og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${SITE}/og.png" />
        <meta name="twitter:title" content="${esc(title)}" />
        <meta name="twitter:description" content="${esc(ogDesc)}" />
${localeHead(locale, `/${app.slug}`)}
${ICON_LINKS}
        <meta name="theme-color" content="${THEME_COLOR_LIGHT}" />
${jsonLd(breadcrumb)}
${jsonLd(faqSchema)}
${HEAD_ASSETS}
${ALT_CSS}
    </head>
    <body class="alt">
${generatedBanner("scripts/gen-alternatives.ts")}
${EMAIL_OFF_OPEN}
${THEME_PREPAINT}
${nav(locale, `/${app.slug}`, undefined, { blobs: "compact" })}

        <main id="main">
            <!-- Hero -->
            <section class="alt-sec alt-hero" aria-labelledby="app-title">
${crumbNav(
    ui,
    `                    <a href="${pathFor(locale, "")}">${esc(ui.breadcrumbHome)}</a>${CHEVRON}
                    <a href="${pathFor(locale, "/alternatives")}">${esc(ui.breadcrumbAlternatives)}</a>${CHEVRON}
                    <span aria-current="page">${esc(app.name)}</span>`,
)}
                <div class="alt-hero-row">
                    <div class="alt-hero-main">
                        <p class="nm-pill alt-pill"><span class="alt-pill-icon nm-c-${app.tint}" aria-hidden="true"><i class="fa-solid ${app.icon}"></i></span>${t(ui.app.heroEyebrow)}</p>
                        <h1 id="app-title" class="nm-h1 alt-h1">${raw(ui.app.heroTitleHtml)}</h1>
                    </div>
                    <div class="alt-hero-side">
                        <p class="alt-lead">${t(ui.app.heroLead)}</p>
                        <div class="alt-actions">
                            <a class="nm-btn nm-btn-ink" href="#switch">${t(ui.app.ctaConnect)}<i class="fa-solid fa-arrow-down" aria-hidden="true"></i></a>
                            <a class="nm-btn nm-btn-glass" href="#compare">${t(ui.app.ctaSeeComparison)}</a>
                        </div>
                    </div>
                </div>
            </section>
${noticeBand(locale, `/${app.slug}`)}
            <!-- The short answer -->
            <section class="alt-sec" id="answer" aria-labelledby="answer-title">
                <div class="nm-card nm-card-lg alt-answer" data-reveal>
                    <div class="alt-stack">
                        <p class="nm-eyebrow">${t(ui.app.answerEyebrow)}</p>
                        <h2 id="answer-title" class="nm-h2">${t(ui.app.answerTitle)}</h2>
                    </div>
                    <p class="alt-answer-body">${raw(ui.app.answerBodyHtml)}</p>
                </div>
            </section>

            <!-- What you get instead -->
            <section class="alt-sec alt-sec-lg" id="instead" aria-labelledby="instead-title">
                <div class="alt-stack alt-head" data-reveal>
${head(t(ui.app.insteadEyebrow), "instead-title", t(ui.app.insteadTitle))}
                </div>
${featuresBlock(ui)}
            </section>

            <!-- Comparison -->
            <section class="alt-sec alt-sec-lg" id="compare" aria-labelledby="compare-title">
                <div class="alt-stack alt-head" data-reveal>
${head(t(ui.app.compareEyebrow), "compare-title", t(ui.app.compareTitle))}
                </div>
                <div class="alt-compare" data-reveal="stagger">
                    <div class="alt-compare-old">
                        <h3><span class="alt-compare-ico" aria-hidden="true"><i class="fa-solid ${app.icon}"></i></span>${esc(app.name)}</h3>
                        <ul class="alt-list">
${cons}
                        </ul>
                    </div>
                    <div class="nm-ink alt-compare-new">
                        <span class="alt-compare-glow" aria-hidden="true"></span>
                        <h3>${logoSvg("c", 36)}Nutrition MCP</h3>
                        <ul class="alt-list">
${pros}
                        </ul>
                    </div>
                </div>
                <p class="alt-note">${esc(copy.note)}</p>
            </section>

            <!-- Moving from X (per-app, unique content) -->
            <section class="alt-sec alt-sec-lg alt-split" id="moving" aria-labelledby="moving-title">
                <div class="alt-split-head is-sticky">
${head(t(ui.app.movingEyebrow), "moving-title", esc(copy.migrate.title))}
                </div>
                <div class="nm-card alt-panel alt-prose" data-reveal>
${proseParas(copy.migrate.body)}
                </div>
            </section>

            <!-- Bring your history (per-app, unique content) -->
            <section class="alt-sec alt-sec-lg alt-split" id="import" aria-labelledby="import-title">
                <div class="alt-split-head is-sticky">
${head(
    t(ui.app.importEyebrow),
    "import-title",
    esc(copy.importSection.title),
    `\n                    <p class="nm-sub">${t(ui.app.importSub)}</p>`,
)}
                </div>
                <div class="nm-card alt-panel alt-prose" data-reveal>
${proseParas(copy.importSection.body)}
                </div>
            </section>

            <!-- How to switch -->
            <section class="alt-sec alt-sec-lg alt-split" id="switch" aria-labelledby="switch-title">
                <div class="alt-split-head">
${head(
    t(ui.app.switchEyebrow),
    "switch-title",
    t(ui.app.ctaConnect),
    `\n                    <p class="nm-sub">${t(ui.app.switchSub)}</p>`,
)}
                </div>
${installBlock(locale, ui)}
            </section>

            <!-- FAQ -->
            <section class="alt-sec alt-sec-lg alt-split" id="faq" aria-labelledby="faq-title">
                <div class="alt-split-head alt-faq-head is-sticky">
${head(t(ui.app.faqEyebrow), "faq-title", raw(ui.app.faqTitleTemplate))}
                </div>
                <div class="nm-card alt-panel alt-faq">
${faqRows(faqs)}
                </div>
            </section>

            <!-- Closing CTA -->
            <section class="alt-sec alt-sec-cta" aria-labelledby="cta-title">
                <div class="nm-ink alt-cta" data-reveal>
                    <span class="alt-cta-blob alt-cta-blob-bl" aria-hidden="true"></span>
                    <span class="alt-cta-blob alt-cta-blob-tr" aria-hidden="true"></span>
                    <h2 id="cta-title">${esc(ui.ctaClosingTitle)}</h2>
                    <p>${t(ui.app.ctaClosingSub)}</p>
                    <div class="alt-cta-actions">
                        <a class="nm-btn nm-btn-lg nm-btn-acc nm-btn-fw" href="#switch">${esc(ui.ctaQuickInstall)}</a>
                        <a class="nm-btn nm-btn-lg nm-btn-ghost-dark nm-btn-fw" href="${pathFor(locale, "/alternatives")}">${t(ui.app.ctaOtherAlternatives)}<i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
                    </div>
                </div>
            </section>

${disclaimerBlock(raw(ui.disclaimerAppHtml))}
        </main>

${footer(locale)}

${SITE_SCRIPT}
${EMAIL_OFF_CLOSE}
    </body>
</html>
`;
}

// ---------- hub page ----------

function renderHub(locale: SiteLocale = "en"): string {
    const url = urlFor(locale, "/alternatives");
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
                name: "Alternatives",
                item: url,
            },
        ],
    };
    const cards = APPS.map(
        (app) =>
            `                    <a class="nm-card alt-tcard alt-app-card nm-c-${app.tint}" href="${pathFor(locale, `/${app.slug}`)}">
                        <div class="alt-app-top"><span class="nm-tile" aria-hidden="true"><i class="fa-solid ${app.icon}"></i></span><span class="alt-app-arrow" aria-hidden="true"><i class="fa-solid fa-arrow-right"></i></span></div>
                        <div>
                            <h3>${esc(app.name)}</h3>
                            <p>${esc(copyFor(app.slug, locale).hubBlurb)}</p>
                        </div>
                    </a>`,
    ).join("\n");

    // As on the per-app pages, the title keeps the head term and the description
    // carries the import hook. See renderApp for the reasoning.
    const meta = metaFor(locale);
    const ui = altUiFor(locale);
    const title = meta.hubTitle;
    const desc = meta.hubDesc;
    const ogDesc = meta.hubOgDesc;

    return `<!doctype html>
<html lang="${HTML_LANG[locale]}">
    <head>
        <title>${esc(title)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="utf-8" />
        <meta name="description" content="${esc(desc)}" />
        <meta property="og:title" content="${esc(title)}" />
        <meta property="og:description" content="${esc(ogDesc)}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${url}" />
        <meta property="og:image" content="${SITE}/og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${SITE}/og.png" />
        <meta name="twitter:title" content="${esc(title)}" />
        <meta name="twitter:description" content="${esc(ogDesc)}" />
${localeHead(locale, "/alternatives")}
${ICON_LINKS}
        <meta name="theme-color" content="${THEME_COLOR_LIGHT}" />
${jsonLd(breadcrumb)}
${HEAD_ASSETS}
${ALT_CSS}
    </head>
    <body class="alt alt-hub">
${generatedBanner("scripts/gen-alternatives.ts")}
${EMAIL_OFF_OPEN}
${THEME_PREPAINT}
${nav(locale, "/alternatives", "/alternatives", { blobs: "compact" })}

        <main id="main">
            <section class="alt-sec alt-hero" aria-labelledby="hub-title">
${crumbNav(
    ui,
    `                    <a href="${pathFor(locale, "")}">${esc(ui.breadcrumbHome)}</a>${CHEVRON}
                    <span aria-current="page">${esc(ui.breadcrumbAlternatives)}</span>`,
)}
                <div class="alt-hero-row">
                    <div class="alt-hero-main">
                        <p class="nm-pill alt-pill is-dot"><span class="nm-pulse-dot" aria-hidden="true"></span>${esc(ui.hub.heroEyebrow)}</p>
                        <h1 id="hub-title" class="nm-h1 alt-h1">${ui.hub.heroTitleHtml}</h1>
                    </div>
                    <div class="alt-hero-side">
                        <p class="alt-lead">${esc(ui.hub.heroLead)}</p>
                        <div class="alt-actions">
                            <a class="nm-btn nm-btn-ink" href="${hashPath(locale, "install")}">${esc(ui.ctaQuickInstall)}<i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
                            <a class="nm-btn nm-btn-glass" href="${hashPath(locale, "try")}">${esc(ui.hub.ctaSeeExamples)}</a>
                        </div>
                    </div>
                </div>
            </section>
${noticeBand(locale, "/alternatives")}
            <section class="alt-sec" id="apps" aria-labelledby="apps-title">
                <div class="alt-head-row" data-reveal>
                    <div class="alt-stack">
${head(esc(ui.hub.appsEyebrow), "apps-title", esc(ui.hub.appsTitle))}
                    </div>
                    <p class="nm-sub">${esc(ui.hub.appsSub)}</p>
                </div>
                <div class="alt-grid" data-reveal="stagger">
${cards}
                </div>
                <p class="alt-note">
                    ${esc(ui.hub.noAppNote)}
                    <a href="mailto:anton@nutrition-mcp.com">${esc(ui.hub.requestComparisonLinkText)}</a>.
                </p>
            </section>

            <section class="alt-sec alt-sec-lg alt-split" id="import" aria-labelledby="import-title">
                <div class="alt-split-head is-sticky">
${head(
    esc(ui.hub.importEyebrow),
    "import-title",
    esc(ui.hub.importTitle),
    `\n                    <p class="nm-sub">${esc(ui.hub.importSub)}</p>`,
)}
                </div>
                <div class="nm-card alt-panel alt-prose" data-reveal>
${proseParas(ui.hub.importBody, true)}
                </div>
            </section>

            <section class="alt-sec alt-sec-cta" aria-labelledby="cta-title">
                <div class="nm-ink alt-cta" data-reveal>
                    <span class="alt-cta-blob alt-cta-blob-bl" aria-hidden="true"></span>
                    <span class="alt-cta-blob alt-cta-blob-tr" aria-hidden="true"></span>
                    <h2 id="cta-title">${esc(ui.ctaClosingTitle)}</h2>
                    <p>${esc(ui.hub.ctaSub)}</p>
                    <div class="alt-cta-actions">
                        <a class="nm-btn nm-btn-lg nm-btn-acc nm-btn-fw" href="${hashPath(locale, "install")}">${esc(ui.ctaQuickInstall)}</a>
                        <a class="nm-btn nm-btn-lg nm-btn-ghost-dark nm-btn-fw" href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-github" aria-hidden="true"></i>${esc(ui.hub.ctaStarGithub)}<span class="nm-stars" data-gh-stars hidden><i class="fa-solid fa-star" aria-hidden="true"></i><span data-gh-stars-n></span></span></a>
                    </div>
                </div>
            </section>

${disclaimerBlock(ui.disclaimerHubHtml.replace("{apps}", APPS.map((a) => esc(a.name)).join(", ")))}
        </main>

${footer(locale, "/alternatives")}

${SITE_SCRIPT}
${EMAIL_OFF_CLOSE}
    </body>
</html>
`;
}

// ---------- write + sitemap ----------

const OUT_DIR = "./public/alternatives";

// English first — src/routes.ts's ALT_PAGES is the source of truth for the
// route -> file map src/index.ts serves these from; keep app.slug/app.file
// here in sync with it by hand.
for (const app of APPS) {
    await Bun.write(`${OUT_DIR}/${app.file}`, renderApp(app));
    console.log(`wrote ${app.file}  (/${app.slug})`);
}
await Bun.write(`${OUT_DIR}/index.html`, renderHub());
console.log("wrote index.html  (/alternatives)");

// Then every locale that actually has translated per-app content — checked
// against ALTERNATIVES_COPY directly (not just "is this locale in
// src/routes.ts's LOCALES") so a locale added there before its translation
// lands doesn't silently get an English page wearing that locale's URL
// (copyFor()'s fallback exists for a locale with a FEW missing app entries,
// not for skipping translation entirely).
for (const locale of LOCALES) {
    if (!ALTERNATIVES_COPY[locale]) continue;
    const dir = `./public/${locale}/alternatives`;
    for (const app of APPS) {
        await Bun.write(`${dir}/${app.file}`, renderApp(app, locale));
        console.log(`wrote ${locale}/${app.file}  (/${locale}/${app.slug})`);
    }
    await Bun.write(`${dir}/index.html`, renderHub(locale));
    console.log(`wrote ${locale}/index.html  (/${locale}/alternatives)`);
}
