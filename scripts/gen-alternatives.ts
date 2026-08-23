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
    /** Font Awesome icon class for the hub card. */
    icon: string;
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
    },
    {
        name: "Cronometer",
        slug: "cronometer-mcp",
        file: "cronometer.html",
        icon: "fa-seedling",
    },
    {
        name: "Lose It!",
        slug: "lose-it-mcp",
        file: "lose-it.html",
        icon: "fa-bullseye",
    },
    {
        name: "MacroFactor",
        slug: "macrofactor-mcp",
        file: "macrofactor.html",
        icon: "fa-chart-simple",
    },
    {
        name: "Yazio",
        slug: "yazio-mcp",
        file: "yazio.html",
        icon: "fa-carrot",
    },
    {
        name: "Lifesum",
        slug: "lifesum-mcp",
        file: "lifesum.html",
        icon: "fa-leaf",
    },
];

/**
 * Trademark / non-affiliation notice shown near the footer of every comparison
 * page. Keeps the pages clearly independent and hedges the comparisons as
 * point-in-time — the main legal safeguards for "alternative to X" content.
 */
function disclaimerBand(text: string): string {
    return `        <div class="disclaimer-band">
            <div class="container">
                <p class="page-disclaimer">${text}</p>
            </div>
        </div>`;
}

// The "What you get instead" feature grid describes Nutrition MCP, so it's the
// same on every page. Icons are structural (never translated); title/body
// come from AltUiCopy.app.features, matched by array position.
const FEATURE_ICONS = [
    "fa-utensils",
    "fa-barcode",
    "fa-weight-scale",
    "fa-chart-area",
    "fa-file-csv",
    "fa-code-branch",
];

function featuresBlock(ui: AltUiCopy): string {
    const cards = ui.app.features
        .map(
            (f, i) => `                        <article class="card feature">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="fa-solid ${FEATURE_ICONS[i]}"></i
                            ></span>
                            <h3>${f.title}</h3>
                            <p>
                                ${f.body}
                            </p>
                        </article>`,
        )
        .join("\n");
    return `                    <div class="features-grid" data-reveal="stagger">
${cards}
                    </div>`;
}

function installBlock(locale: SiteLocale, ui: AltUiCopy): string {
    const steps = ui.app.installSteps
        .map((s, i) => {
            const html =
                i === 2
                    ? s.replace(
                          "{copyUrl}",
                          `<span class="copy-url"
                                    ><code>https://nutrition-mcp.com/mcp</code
                                    ><button
                                        class="copy-mini"
                                        type="button"
                                        data-copy="https://nutrition-mcp.com/mcp"
                                        aria-label="${esc(ui.app.copyUrlAriaLabel)}"
                                    >
                                        <i class="fa-solid fa-copy"></i></button
                                ></span>`,
                      )
                    : s;
            return `                            <li>
                                ${html}
                            </li>`;
        })
        .join("\n");
    const note = ui.app.installNoteTemplate.replace(
        "{link}",
        `<a href="${hashPath(locale, "install")}">${esc(ui.app.installLinkText)}</a>`,
    );
    return `                    <div class="card install-card">
                        <ol class="steps">
${steps}
                        </ol>
                        <p class="note">
                            ${note}
                        </p>
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
                `                                <li>\n                                    <i class="fa-solid fa-xmark"></i> ${esc(c)}\n                                </li>`,
        )
        .join("\n");
    const pros = ui.app.pros
        .map(
            (p) =>
                `                                <li>\n                                    <i class="fa-solid fa-circle-check"></i>\n                                    ${p}\n                                </li>`,
        )
        .join("\n");
    const faqDetails = faqs
        .map(
            (f) =>
                `                        <details>\n                            <summary>${esc(f.q)}</summary>\n                            <p>${esc(f.a)}</p>\n                        </details>`,
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
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#fbfbf9" />
${jsonLd(breadcrumb)}
${jsonLd(faqSchema)}
${HEAD_ASSETS}
    </head>
    <body class="landing">
${generatedBanner("scripts/gen-alternatives.ts")}
${THEME_PREPAINT}
${nav(locale, `/${app.slug}`)}

        <main id="main">
            <!-- Hero -->
            <section class="hero">
                <div class="container">
                    <nav class="crumb" aria-label="Breadcrumb">
                        <a href="${pathFor(locale, "")}">${esc(ui.breadcrumbHome)}</a>
                        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                        <a href="${pathFor(locale, "/alternatives")}">${esc(ui.breadcrumbAlternatives)}</a>
                        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                        <span>${esc(app.name)}</span>
                    </nav>
                    <div class="hero-copy hero-copy-wide">
                        <p class="eyebrow">${t(ui.app.heroEyebrow)}</p>
                        <h1 class="hero-title">
                            ${ui.app.heroTitleHtml.replaceAll("{app}", esc(app.name))}
                        </h1>
                        <p class="lead">
                            ${t(ui.app.heroLead)}
                        </p>
                        <div class="hero-actions">
                            <a class="btn btn-primary" href="#switch"
                                >${t(ui.app.ctaConnect)}</a
                            >
                            <a class="btn btn-secondary" href="#compare"
                                >${t(ui.app.ctaSeeComparison)}</a
                            >
                        </div>
                    </div>
${translationNotice(locale, `/${app.slug}`)}
                </div>
            </section>

            <!-- The honest answer -->
            <section class="section band" id="answer">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">${t(ui.app.answerEyebrow)}</p>
                        <h2 class="section-title">
                            ${t(ui.app.answerTitle)}
                        </h2>
                        <p class="section-sub">
                            ${ui.app.answerBodyHtml.replaceAll("{app}", esc(app.name))}
                        </p>
                    </div>
                </div>
            </section>

            <!-- What you get instead -->
            <section class="section" id="instead">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">${t(ui.app.insteadEyebrow)}</p>
                        <h2 class="section-title">
                            ${t(ui.app.insteadTitle)}
                        </h2>
                    </div>
${featuresBlock(ui)}
                </div>
            </section>

            <!-- Comparison -->
            <section class="section band" id="compare">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">${t(ui.app.compareEyebrow)}</p>
                        <h2 class="section-title">${t(ui.app.compareTitle)}</h2>
                    </div>
                    <div class="compare">
                        <div class="compare-col">
                            <h3 class="compare-h compare-h-old">
                                ${esc(app.name)}
                            </h3>
                            <ul>
${cons}
                            </ul>
                        </div>
                        <div class="compare-col compare-col-new">
                            <h3 class="compare-h compare-h-new">
                                Nutrition MCP
                            </h3>
                            <ul>
${pros}
                            </ul>
                        </div>
                    </div>
                    <p class="note compare-note">
                        ${esc(copy.note)}
                    </p>
                </div>
            </section>

            <!-- Moving from X (per-app, unique content) -->
            <section class="section" id="moving">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">${t(ui.app.movingEyebrow)}</p>
                        <h2 class="section-title">
                            ${esc(copy.migrate.title)}
                        </h2>
                    </div>
                    <div class="prose">
${copy.migrate.body
    .map((p) => `                        <p>${esc(p)}</p>`)
    .join("\n")}
                    </div>
                </div>
            </section>

            <!-- Bring your history (per-app, unique content) -->
            <section class="section band" id="import">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">${t(ui.app.importEyebrow)}</p>
                        <h2 class="section-title">
                            ${esc(copy.importSection.title)}
                        </h2>
                        <p class="section-sub">
                            ${t(ui.app.importSub)}
                        </p>
                    </div>
                    <div class="prose">
${copy.importSection.body
    .map((p) => `                        <p>${esc(p)}</p>`)
    .join("\n")}
                    </div>
                </div>
            </section>

            <!-- How to switch -->
            <section class="section" id="switch">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">${t(ui.app.switchEyebrow)}</p>
                        <h2 class="section-title">${t(ui.app.ctaConnect)}</h2>
                        <p class="section-sub">
                            ${t(ui.app.switchSub)}
                        </p>
                    </div>
${installBlock(locale, ui)}
                </div>
            </section>

            <!-- FAQ -->
            <section class="section band" id="faq">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">${t(ui.app.faqEyebrow)}</p>
                        <h2 class="section-title">
                            ${ui.app.faqTitleTemplate.replaceAll("{app}", esc(app.name))}
                        </h2>
                    </div>
                    <div class="faq">
${faqDetails}
                    </div>
                </div>
            </section>

            <!-- Closing CTA -->
            <section class="section cta">
                <div class="container cta-inner" data-reveal>
                    <h2 class="cta-title">
                        ${esc(ui.ctaClosingTitle)}
                    </h2>
                    <p class="cta-sub">
                        ${t(ui.app.ctaClosingSub)}
                    </p>
                    <div class="cta-actions">
                        <a class="btn btn-on-accent" href="#switch"
                            >${esc(ui.ctaQuickInstall)}</a
                        >
                        <a class="btn btn-ghost-accent" href="${pathFor(locale, "/alternatives")}"
                            >${t(ui.app.ctaOtherAlternatives)}</a
                        >
                    </div>
                </div>
            </section>
        </main>

${disclaimerBand(ui.disclaimerAppHtml.replaceAll("{app}", esc(app.name)))}

${footer(locale)}

${SITE_SCRIPT}
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
            `                        <a class="card feature alt-card" href="${pathFor(locale, `/${app.slug}`)}">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="fa-solid ${app.icon}"></i
                            ></span>
                            <h3>${esc(app.name)} &rarr;</h3>
                            <p>${esc(copyFor(app.slug, locale).hubBlurb)}</p>
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
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#fbfbf9" />
${jsonLd(breadcrumb)}
${HEAD_ASSETS}
    </head>
    <body class="landing">
${generatedBanner("scripts/gen-alternatives.ts")}
${THEME_PREPAINT}
${nav(locale, "/alternatives", "/alternatives")}

        <main id="main">
            <section class="hero">
                <div class="container">
                    <nav class="crumb" aria-label="Breadcrumb">
                        <a href="${pathFor(locale, "")}">${esc(ui.breadcrumbHome)}</a>
                        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                        <span>${esc(ui.breadcrumbAlternatives)}</span>
                    </nav>
                    <div class="hero-copy hero-copy-wide">
                        <p class="eyebrow">${esc(ui.hub.heroEyebrow)}</p>
                        <h1 class="hero-title">
                            ${ui.hub.heroTitleHtml}
                        </h1>
                        <p class="lead">
                            ${esc(ui.hub.heroLead)}
                        </p>
                        <div class="hero-actions">
                            <a class="btn btn-primary" href="${hashPath(locale, "install")}"
                                >${esc(ui.ctaQuickInstall)}</a
                            >
                            <a class="btn btn-secondary" href="${hashPath(locale, "try")}"
                                >${esc(ui.hub.ctaSeeExamples)}</a
                            >
                        </div>
                    </div>
${translationNotice(locale, "/alternatives")}
                </div>
            </section>

            <section class="section band" id="apps">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">${esc(ui.hub.appsEyebrow)}</p>
                        <h2 class="section-title">${esc(ui.hub.appsTitle)}</h2>
                        <p class="section-sub">
                            ${esc(ui.hub.appsSub)}
                        </p>
                    </div>
                    <div class="features-grid" data-reveal="stagger">
${cards}
                    </div>
                    <p class="note compare-note">
                        ${esc(ui.hub.noAppNote)}
                        <a href="mailto:anton@nutrition-mcp.com"
                            >${esc(ui.hub.requestComparisonLinkText)}</a
                        >.
                    </p>
                </div>
            </section>

            <section class="section" id="import">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">${esc(ui.hub.importEyebrow)}</p>
                        <h2 class="section-title">
                            ${esc(ui.hub.importTitle)}
                        </h2>
                        <p class="section-sub">
                            ${esc(ui.hub.importSub)}
                        </p>
                    </div>
                    <div class="prose">
${ui.hub.importBody.map((p) => `                        <p>\n                            ${p}\n                        </p>`).join("\n")}
                    </div>
                </div>
            </section>

            <section class="section cta">
                <div class="container cta-inner" data-reveal>
                    <h2 class="cta-title">
                        ${esc(ui.ctaClosingTitle)}
                    </h2>
                    <p class="cta-sub">
                        ${esc(ui.hub.ctaSub)}
                    </p>
                    <div class="cta-actions">
                        <a class="btn btn-on-accent" href="${hashPath(locale, "install")}"
                            >${esc(ui.ctaQuickInstall)}</a
                        >
                        <a
                            class="btn btn-ghost-accent"
                            href="https://github.com/akutishevsky/nutrition-mcp"
                            target="_blank"
                            rel="noopener noreferrer"
                            ><i class="fa-brands fa-github"></i> ${esc(ui.hub.ctaStarGithub)}</a
                        >
                    </div>
                </div>
            </section>
        </main>

${disclaimerBand(ui.disclaimerHubHtml.replace("{apps}", APPS.map((a) => esc(a.name)).join(", ")))}

${footer(locale, "/alternatives")}

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
