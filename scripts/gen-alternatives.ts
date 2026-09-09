/**
 * Generates the SEO "alternative to X" comparison pages under
 * public/alternatives/ from a single template plus the per-app data below.
 *
 * These pages target long-tail bridge queries seen in Search Console — e.g.
 * "myfitnesspal mcp", "connect cronometer to claude" — that the single-page
 * site can't rank for. Each page carries unique title/description/canonical/OG
 * plus FAQPage and BreadcrumbList JSON-LD.
 *
 * The pages are the "Dawn" design: shared chrome (nav()/footer()) and the
 * shared primitives in public/styles.css (.nm-*), with the little layout
 * that only these pages need — the two-column comparison, the sticky-headed
 * prose panels, the copy pill under the install steps — as an inline
 * <style> block scoped to body.alt (ALT_CSS below). Content still comes
 * entirely from src/copy/alt-ui.ts (the shared template prose) and
 * src/copy/alternatives.ts (the per-app prose).
 *
 * Edit the APPS data (or the shared template) here and re-run:
 *   bun run scripts/gen-alternatives.ts
 * The generated .html files are the served artifacts — don't hand-edit them.
 *
 * Self-hosting: scripts/depersonalize.ts cleans the generated .html files but
 * NOT this generator. If you regenerate, update SITE below and the GA tag,
 * GitHub links, and contact email in the shared fragments first.
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
import { altUiFor, type AltUiCopy } from "../src/copy/alt-ui.js";
import {
    EMAIL,
    EXT,
    GITHUB,
    MCP_URL,
    SITE,
    attr,
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
    /** Font Awesome icon class for the hub card and the comparison column. */
    icon: string;
    /** Colour-role class (.nm-c-*) tinting the app's icon tile. */
    tint: string;
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
        tint: "nm-c-cal",
    },
    {
        name: "Cronometer",
        slug: "cronometer-mcp",
        file: "cronometer.html",
        icon: "fa-seedling",
        tint: "nm-c-car",
    },
    {
        name: "Lose It!",
        slug: "lose-it-mcp",
        file: "lose-it.html",
        icon: "fa-bullseye",
        tint: "nm-c-fat",
    },
    {
        name: "MacroFactor",
        slug: "macrofactor-mcp",
        file: "macrofactor.html",
        icon: "fa-chart-simple",
        tint: "nm-c-pro",
    },
    {
        name: "Yazio",
        slug: "yazio-mcp",
        file: "yazio.html",
        icon: "fa-carrot",
        tint: "nm-c-sug",
    },
    {
        name: "Lifesum",
        slug: "lifesum-mcp",
        file: "lifesum.html",
        icon: "fa-leaf",
        tint: "nm-c-fib",
    },
];

// ---------- page CSS ----------

// Layout only these pages need, on top of the shared primitives. Scoped to
// body.alt so it can't leak into another page, and kept here rather than in
// styles.css so page agents never edit the stylesheet concurrently.
const ALT_CSS = `        <style>
            /* Hero: the crumb pill sits above the eyebrow. (The accent <em> in
               the h1 is the shared .nm-h1 em rule.) */
            body.alt .nm-page-hero .nm-crumb {
                margin-bottom: 22px;
            }
            /* The hero and closing-band buttons wrap on a phone: the widest
               translations of ctaConnect ("Підключись менш ніж за хвилину")
               run past the shared nowrap pill's edge at 320px. */
            @media (max-width: 420px) {
                body.alt .nm-hero-actions .nm-btn,
                body.alt .nm-cta-actions .nm-btn {
                    white-space: normal;
                    height: auto;
                    min-height: 54px;
                    padding: 12px 22px;
                    line-height: 1.25;
                    text-align: center;
                }
            }
            body.alt .nm-h2 {
                margin-bottom: 14px;
            }
            body.alt .nm-head-row .nm-h2,
            body.alt .nm-head-row .nm-h2 + .nm-sub {
                margin-bottom: 0;
            }
            /* The honest answer: heading left, one big paragraph right. */
            body.alt .alt-answer {
                margin: 0;
                max-width: 58ch;
                font-size: clamp(16px, 1.3vw, 18.5px);
                line-height: 1.55;
                color: var(--ink2);
                text-wrap: pretty;
            }
            body.alt .alt-answer em {
                color: var(--ink);
                font-weight: 700;
                font-style: normal;
            }
            /* Comparison: the old app's list beside the dark emphasis panel
               (the landing's support pair). The cards' own grid gap spaces
               the list; .nm-checks' top margin was written for a column. */
            body.alt .alt-compare {
                display: grid;
                grid-template-columns: repeat(
                    auto-fit,
                    minmax(min(100%, 340px), 1fr)
                );
                gap: 14px;
                align-items: stretch;
            }
            body.alt .alt-compare .nm-checks {
                margin: 0;
            }
            body.alt .alt-compare .nm-card-top {
                justify-content: flex-start;
            }
            body.alt .alt-compare-old .nm-tile {
                --c: var(--ink3);
            }
            body.alt .alt-compare-note {
                margin-top: 18px;
                max-width: 70ch;
            }
            /* Prose panels (moving from X, bring your history): a sticky
               heading column beside the paragraphs; one column below 900px
               where a sticky heading would sit on the text. */
            body.alt .alt-doc {
                display: grid;
                grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
                gap: clamp(24px, 4vw, 56px);
                align-items: start;
            }
            body.alt .alt-doc-head {
                position: sticky;
                top: calc(var(--head-h) + 16px);
            }
            body.alt .alt-doc-head .nm-h2 {
                margin-bottom: 0;
            }
            body.alt .alt-doc-head .nm-sub {
                margin-top: 14px;
            }
            body.alt .alt-doc .nm-prose {
                max-width: none;
            }
            @media (max-width: 899.98px) {
                body.alt .alt-doc {
                    grid-template-columns: minmax(0, 1fr);
                }
                body.alt .alt-doc-head {
                    position: static;
                }
            }
            /* Install steps: raw <strong> UI labels in the step strings; the
               server URL is a plain <code> in the sentence (as on the landing
               page) and the shared copy pill sits under the list. */
            body.alt .nm-steps strong {
                color: var(--ink);
                font-weight: 700;
            }
            body.alt .alt-steps .nm-copy-pill {
                margin-top: 18px;
            }
            body.alt .alt-steps .nm-note {
                margin-top: 18px;
            }
            body.alt .alt-steps .nm-note a {
                color: var(--acc-text);
                font-weight: 700;
                text-decoration: underline;
                text-underline-offset: 2px;
            }
            /* Hub: the six app cards are links; the arrow sits where the
               landing's card index would. */
            body.alt .alt-card-arrow {
                color: var(--ink3);
                font-size: 14px;
                transition: color 0.2s, transform 0.2s;
            }
            body.alt a.nm-card:hover .alt-card-arrow {
                color: var(--acc);
                transform: translateX(3px);
            }
            body.alt .alt-request {
                margin-top: 18px;
            }
            /* Trademark line under the closing band. */
            body.alt .alt-disclaimer {
                padding-top: 0;
                padding-bottom: clamp(32px, 4vw, 56px);
            }
            body.alt .alt-disclaimer .nm-notice {
                font-size: 13px;
            }
        </style>`;

// ---------- shared fragments ----------

const BG_BLOBS = `        <div class="nm-bg" aria-hidden="true">
            <div class="nm-bg-blob nm-bg-1"></div>
            <div class="nm-bg-blob nm-bg-2"></div>
            <div class="nm-bg-blob nm-bg-3"></div>
            <div class="nm-bg-fade"></div>
        </div>`;

function noticeBand(locale: SiteLocale, suffix: string): string {
    const notice = translationNotice(locale, suffix);
    if (!notice) return "";
    return `
            <div class="nm-section nm-notice-band">
${notice}
            </div>
`;
}

/**
 * Trademark / non-affiliation notice under the closing band of every
 * comparison page. Keeps the pages clearly independent and hedges the
 * comparisons as point-in-time — the main legal safeguards for "alternative
 * to X" content. `html` is already escaped/raw as the caller decided.
 */
function disclaimerBand(html: string): string {
    return `            <div class="nm-section alt-disclaimer">
                <div class="nm-notice is-muted">
                    <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
                    <p>${html}</p>
                </div>
            </div>`;
}

// The "What you get instead" feature grid describes Nutrition MCP, so it's the
// same on every page. Icons are structural (never translated); title/body
// come from AltUiCopy.app.features, matched by array position. The tints
// are the same kind of thing: one colour role per card, by position.
const FEATURE_ICONS = [
    "fa-utensils",
    "fa-barcode",
    "fa-weight-scale",
    "fa-chart-area",
    "fa-file-csv",
    "fa-code-branch",
];
const FEATURE_TINTS = [
    "nm-c-cal",
    "nm-c-car",
    "nm-c-fib",
    "nm-c-pro",
    "nm-c-wat",
    "nm-c-acc",
];

function featuresBlock(ui: AltUiCopy): string {
    const cards = ui.app.features
        .map(
            (f, i) => `                    <article class="nm-card">
                        <div class="nm-card-top">
                            <span class="nm-tile nm-tile-md ${FEATURE_TINTS[i]}" aria-hidden="true"
                                ><i class="fa-solid ${FEATURE_ICONS[i]}"></i
                            ></span>
                            <span class="nm-count">${String(i + 1).padStart(2, "0")}</span>
                        </div>
                        <h3>${f.title}</h3>
                        <p>${f.body}</p>
                    </article>`,
        )
        .join("\n");
    return `                <div class="nm-grid" data-reveal="stagger">
${cards}
                </div>`;
}

// The URL is written into the step as plain <code>, exactly as the
// landing's own install steps do; the copy control is the unmodified
// shared pill under the list, not a restyled one mid-sentence.
function installBlock(locale: SiteLocale, ui: AltUiCopy): string {
    const steps = ui.app.installSteps
        .map((s, i) => {
            const html =
                i === 2 ? s.replace("{copyUrl}", `<code>${MCP_URL}</code>`) : s;
            return `                        <li><span>${html}</span></li>`;
        })
        .join("\n");
    const note = ui.app.installNoteTemplate.replace(
        "{link}",
        `<a href="${hashPath(locale, "connect")}">${esc(ui.app.installLinkText)}</a>`,
    );
    return `                    <div class="nm-panel nm-panel-md alt-steps">
                        <ol class="nm-steps nm-steps-boxed">
${steps}
                        </ol>
                        <div class="nm-copy-pill">
                            <code class="nm-endpoint-url">${MCP_URL}</code>
                            <button
                                class="copy-mini nm-copy-round"
                                type="button"
                                data-copy="${MCP_URL}"
                                aria-label="${attr(ui.app.copyUrlAriaLabel)}"
                            >
                                <i class="fa-solid fa-copy" aria-hidden="true"></i>
                            </button>
                        </div>
                        <p class="nm-note">${note}</p>
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

/** A section heading block: eyebrow, h2 (id for aria-labelledby), sub. */
function headRow(
    id: string,
    eyebrow: string,
    titleHtml: string,
    subHtml?: string,
): string {
    const sub = subHtml
        ? `\n                    <p class="nm-sub">${subHtml}</p>`
        : "";
    return `                <div class="nm-head-row">
                    <div>
                        <p class="nm-eyebrow">${eyebrow}</p>
                        <h2 class="nm-h2 nm-h2-sm" id="${id}">${titleHtml}</h2>
                    </div>${sub}
                </div>`;
}

/**
 * A prose panel: sticky eyebrow + title (+ sub) on the left, paragraphs on
 * the right — the "moving from X" and "bring your history" sections.
 */
function docPanel(
    id: string,
    eyebrow: string,
    titleHtml: string,
    paragraphs: string[],
    subHtml?: string,
): string {
    const sub = subHtml
        ? `\n                        <p class="nm-sub">${subHtml}</p>`
        : "";
    return `                <div class="nm-panel nm-panel-lg">
                    <div class="alt-doc">
                        <div class="alt-doc-head">
                            <p class="nm-eyebrow">${eyebrow}</p>
                            <h2 class="nm-h2 nm-h2-sm" id="${id}">${titleHtml}</h2>${sub}
                        </div>
                        <div class="nm-prose">
${paragraphs.map((p) => `                            <p>${p}</p>`).join("\n")}
                        </div>
                    </div>
                </div>`;
}

function faqList(faqs: { q: string; a: string }[]): string {
    const rows = faqs
        .map(
            (f, i) => `                    <details class="nm-faq-row">
                        <summary>
                            <span class="nm-faq-n">${String(i + 1).padStart(2, "0")}</span>
                            <span class="nm-faq-q">${esc(f.q)}</span>
                            <span class="nm-faq-ic" aria-hidden="true"><i class="fa-solid fa-plus"></i></span>
                        </summary>
                        <p>${esc(f.a)}</p>
                    </details>`,
        )
        .join("\n");
    return `                <div class="nm-faq-list">
${rows}
                </div>`;
}

// ---------- per-app page ----------

function renderApp(app: App, locale: SiteLocale = "en"): string {
    const copy = copyFor(app.slug, locale);
    const meta = metaFor(locale);
    const ui = altUiFor(locale);
    const suffix = `/${app.slug}`;
    const url = urlFor(locale, suffix);
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
                // The visible crumb's word, so a translated page's rich
                // result does not show an English crumb; the brand names
                // either side stay untranslated.
                name: ui.breadcrumbAlternatives,
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
                `                            <li><i class="fa-solid fa-circle-check" aria-hidden="true"></i><span>${p}</span></li>`,
        )
        .join("\n");

    return `<!doctype html>
<html lang="${HTML_LANG[locale]}">
    <head>
        <title>${esc(title)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="utf-8" />
        <meta name="description" content="${attr(desc)}" />
        <meta property="og:title" content="${attr(title)}" />
        <meta property="og:description" content="${attr(ogDesc)}" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="${url}" />
        <meta property="og:image" content="${SITE}/og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${SITE}/og.png" />
        <meta name="twitter:title" content="${attr(title)}" />
        <meta name="twitter:description" content="${attr(ogDesc)}" />
${localeHead(locale, suffix)}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#f7f7f9" />
${jsonLd(breadcrumb)}
${jsonLd(faqSchema)}
${HEAD_ASSETS}
${ALT_CSS}
    </head>
    <body class="alt">
${generatedBanner("scripts/gen-alternatives.ts")}
${THEME_PREPAINT}

${BG_BLOBS}

${nav(locale, suffix)}

        <main id="main">
            <!-- Hero -->
            <section class="nm-section nm-page-hero" aria-labelledby="hero-title">
                <nav class="nm-crumb" aria-label="${attr(ui.breadcrumbAriaLabel)}">
                    <a href="${pathFor(locale, "")}">${esc(ui.breadcrumbHome)}</a>
                    <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                    <a href="${pathFor(locale, "/alternatives")}">${esc(ui.breadcrumbAlternatives)}</a>
                    <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                    <span aria-current="page">${esc(app.name)}</span>
                </nav>
                <p class="nm-eyebrow">${t(ui.app.heroEyebrow)}</p>
                <h1 class="nm-h1" id="hero-title">${ui.app.heroTitleHtml.replaceAll("{app}", esc(app.name))}</h1>
                <p class="nm-lead">${t(ui.app.heroLead)}</p>
                <div class="nm-hero-actions">
                    <a class="nm-btn nm-btn-primary" href="#switch"
                        >${t(ui.app.ctaConnect)}
                        <i class="fa-solid fa-arrow-right" aria-hidden="true"></i
                    ></a>
                    <a class="nm-btn nm-btn-glass" href="#compare">${t(ui.app.ctaSeeComparison)}</a>
                </div>
            </section>
${noticeBand(locale, suffix)}
            <!-- The honest answer -->
            <section class="nm-section" id="answer" aria-labelledby="answer-title" data-reveal>
                <div class="nm-split">
                    <div>
                        <p class="nm-eyebrow">${t(ui.app.answerEyebrow)}</p>
                        <h2 class="nm-h2" id="answer-title">${t(ui.app.answerTitle)}</h2>
                    </div>
                    <p class="alt-answer">${ui.app.answerBodyHtml.replaceAll("{app}", esc(app.name))}</p>
                </div>
            </section>

            <!-- What you get instead -->
            <section class="nm-section" id="instead" aria-labelledby="instead-title" data-reveal>
${headRow("instead-title", t(ui.app.insteadEyebrow), t(ui.app.insteadTitle))}
${featuresBlock(ui)}
            </section>

            <!-- Comparison -->
            <section class="nm-section" id="compare" aria-labelledby="compare-title" data-reveal>
${headRow("compare-title", t(ui.app.compareEyebrow), t(ui.app.compareTitle))}
                <div class="alt-compare" data-reveal="stagger">
                    <div class="nm-card nm-card-flat alt-compare-old">
                        <div class="nm-card-top">
                            <span class="nm-tile nm-tile-md" aria-hidden="true"
                                ><i class="fa-solid ${app.icon}"></i
                            ></span>
                            <h3>${esc(app.name)}</h3>
                        </div>
                        <ul class="nm-checks nm-checks-lg">
${cons}
                        </ul>
                    </div>
                    <div class="nm-card nm-card-flat nm-card-dark nm-c-acc">
                        <span class="nm-blob nm-blob-br" aria-hidden="true"></span>
                        <div class="nm-card-top">
                            <span class="nm-tile nm-tile-md" aria-hidden="true">🍏</span>
                            <h3>Nutrition MCP</h3>
                        </div>
                        <ul class="nm-checks nm-checks-lg">
${pros}
                        </ul>
                    </div>
                </div>
                <p class="nm-note alt-compare-note">${esc(copy.note)}</p>
            </section>

            <!-- Moving from X (per-app, unique content) -->
            <section class="nm-section" id="moving" aria-labelledby="moving-title" data-reveal>
${docPanel(
    "moving-title",
    t(ui.app.movingEyebrow),
    esc(copy.migrate.title),
    copy.migrate.body.map(esc),
)}
            </section>

            <!-- Bring your history (per-app, unique content) -->
            <section class="nm-section" id="import" aria-labelledby="import-title" data-reveal>
${docPanel(
    "import-title",
    t(ui.app.importEyebrow),
    esc(copy.importSection.title),
    copy.importSection.body.map(esc),
    t(ui.app.importSub),
)}
            </section>

            <!-- How to switch -->
            <section class="nm-section" id="switch" aria-labelledby="switch-title" data-reveal>
                <div class="nm-split">
                    <div>
                        <p class="nm-eyebrow">${t(ui.app.switchEyebrow)}</p>
                        <h2 class="nm-h2" id="switch-title">${t(ui.app.ctaConnect)}</h2>
                        <p class="nm-sub">${t(ui.app.switchSub)}</p>
                    </div>
${installBlock(locale, ui)}
                </div>
            </section>

            <!-- FAQ -->
            <section class="nm-section" id="faq" aria-labelledby="faq-title" data-reveal>
${headRow("faq-title", t(ui.app.faqEyebrow), ui.app.faqTitleTemplate.replaceAll("{app}", esc(app.name)))}
${faqList(faqs)}
            </section>

            <!-- Closing CTA -->
            <section class="nm-section nm-cta-sec" aria-labelledby="cta-title" data-reveal>
                <div class="nm-cta-band">
                    <span class="nm-blob nm-blob-bl nm-c-car" aria-hidden="true"></span>
                    <span class="nm-blob nm-blob-tr nm-c-pro" aria-hidden="true"></span>
                    <h2 id="cta-title">${esc(ui.ctaClosingTitle)}</h2>
                    <p>${t(ui.app.ctaClosingSub)}</p>
                    <div class="nm-cta-actions">
                        <a class="nm-btn nm-btn-primary nm-btn-lg" href="#switch">${esc(ui.ctaQuickInstall)}</a>
                        <a class="nm-btn nm-btn-ghost nm-btn-lg" href="${pathFor(locale, "/alternatives")}">${t(ui.app.ctaOtherAlternatives)}</a>
                    </div>
                </div>
            </section>

${disclaimerBand(ui.disclaimerAppHtml.replaceAll("{app}", esc(app.name)))}
        </main>

${footer(locale)}

${SITE_SCRIPT}
    </body>
</html>
`;
}

// ---------- hub page ----------

function renderHub(locale: SiteLocale = "en"): string {
    const suffix = "/alternatives";
    const url = urlFor(locale, suffix);
    const ui = altUiFor(locale);
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
                name: ui.breadcrumbAlternatives,
                item: url,
            },
        ],
    };
    const cards = APPS.map(
        (app) =>
            `                    <a class="nm-card ${app.tint}" href="${pathFor(locale, `/${app.slug}`)}">
                        <div class="nm-card-top">
                            <span class="nm-tile nm-tile-md" aria-hidden="true"
                                ><i class="fa-solid ${app.icon}"></i
                            ></span>
                            <i class="fa-solid fa-arrow-right alt-card-arrow" aria-hidden="true"></i>
                        </div>
                        <h3>${esc(app.name)}</h3>
                        <p>${esc(copyFor(app.slug, locale).hubBlurb)}</p>
                    </a>`,
    ).join("\n");

    // As on the per-app pages, the title keeps the head term and the description
    // carries the import hook. See renderApp for the reasoning.
    const meta = metaFor(locale);
    const title = meta.hubTitle;
    const desc = meta.hubDesc;
    const ogDesc = meta.hubOgDesc;

    return `<!doctype html>
<html lang="${HTML_LANG[locale]}">
    <head>
        <title>${esc(title)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="utf-8" />
        <meta name="description" content="${attr(desc)}" />
        <meta property="og:title" content="${attr(title)}" />
        <meta property="og:description" content="${attr(ogDesc)}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${url}" />
        <meta property="og:image" content="${SITE}/og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${SITE}/og.png" />
        <meta name="twitter:title" content="${attr(title)}" />
        <meta name="twitter:description" content="${attr(ogDesc)}" />
${localeHead(locale, suffix)}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#f7f7f9" />
${jsonLd(breadcrumb)}
${HEAD_ASSETS}
${ALT_CSS}
    </head>
    <body class="alt">
${generatedBanner("scripts/gen-alternatives.ts")}
${THEME_PREPAINT}

${BG_BLOBS}

${nav(locale, suffix, suffix)}

        <main id="main">
            <!-- Hero -->
            <section class="nm-section nm-page-hero" aria-labelledby="hero-title">
                <nav class="nm-crumb" aria-label="${attr(ui.breadcrumbAriaLabel)}">
                    <a href="${pathFor(locale, "")}">${esc(ui.breadcrumbHome)}</a>
                    <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                    <span aria-current="page">${esc(ui.breadcrumbAlternatives)}</span>
                </nav>
                <p class="nm-eyebrow">${esc(ui.hub.heroEyebrow)}</p>
                <h1 class="nm-h1" id="hero-title">${ui.hub.heroTitleHtml}</h1>
                <p class="nm-lead">${esc(ui.hub.heroLead)}</p>
                <div class="nm-hero-actions">
                    <a class="nm-btn nm-btn-primary" href="${hashPath(locale, "connect")}"
                        >${esc(ui.ctaQuickInstall)}
                        <i class="fa-solid fa-arrow-right" aria-hidden="true"></i
                    ></a>
                    <a class="nm-btn nm-btn-glass" href="${hashPath(locale, "examples")}">${esc(ui.hub.ctaSeeExamples)}</a>
                </div>
            </section>
${noticeBand(locale, suffix)}
            <!-- Pick your app -->
            <section class="nm-section" id="apps" aria-labelledby="apps-title" data-reveal>
${headRow("apps-title", esc(ui.hub.appsEyebrow), esc(ui.hub.appsTitle), esc(ui.hub.appsSub))}
                <div class="nm-grid" data-reveal="stagger">
${cards}
                </div>
                <div class="nm-notice alt-request">
                    <i class="fa-solid fa-circle-question" aria-hidden="true"></i>
                    <p>
                        ${esc(ui.hub.noAppNote)}
                        <a href="mailto:${EMAIL}">${esc(ui.hub.requestComparisonLinkText)}</a>.
                    </p>
                </div>
            </section>

            <!-- Bringing your history -->
            <section class="nm-section" id="import" aria-labelledby="import-title" data-reveal>
${docPanel(
    "import-title",
    esc(ui.hub.importEyebrow),
    esc(ui.hub.importTitle),
    ui.hub.importBody,
    esc(ui.hub.importSub),
)}
            </section>

            <!-- Closing CTA -->
            <section class="nm-section nm-cta-sec" aria-labelledby="cta-title" data-reveal>
                <div class="nm-cta-band">
                    <span class="nm-blob nm-blob-bl nm-c-car" aria-hidden="true"></span>
                    <span class="nm-blob nm-blob-tr nm-c-pro" aria-hidden="true"></span>
                    <h2 id="cta-title">${esc(ui.ctaClosingTitle)}</h2>
                    <p>${esc(ui.hub.ctaSub)}</p>
                    <div class="nm-cta-actions">
                        <a class="nm-btn nm-btn-primary nm-btn-lg" href="${hashPath(locale, "connect")}">${esc(ui.ctaQuickInstall)}</a>
                        <a class="nm-btn nm-btn-ghost nm-btn-lg" href="${GITHUB}" ${EXT}>
                            <i class="fa-brands fa-github" aria-hidden="true"></i>
                            <span>${esc(ui.hub.ctaStarGithub)}</span>
                        </a>
                    </div>
                </div>
            </section>

${disclaimerBand(ui.disclaimerHubHtml.replace("{apps}", APPS.map((a) => esc(a.name)).join(", ")))}
        </main>

${footer(locale, suffix)}

${SITE_SCRIPT}
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
