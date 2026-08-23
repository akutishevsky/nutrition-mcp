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
    hashPath,
    pathFor,
    urlFor,
    type SiteLocale,
} from "../src/routes.js";
import {
    ALTERNATIVES_COPY,
    type AppCopy,
    type AppSlug,
} from "../src/copy/alternatives.js";
import {
    SITE,
    esc,
    footer,
    generatedBanner,
    jsonLd,
    localeHead,
    nav,
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
// same on every page.
const FEATURES = `                    <div class="features-grid" data-reveal="stagger">
                        <article class="card feature">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="fa-solid fa-utensils"></i
                            ></span>
                            <h3>Meals in plain language</h3>
                            <p>
                                Say &ldquo;oatmeal with banana and peanut
                                butter&rdquo; — your AI estimates calories and
                                macros, fiber, total sugar and caffeine included, and logs
                                it. No database search.
                            </p>
                        </article>
                        <article class="card feature">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="fa-solid fa-barcode"></i
                            ></span>
                            <h3>Barcode scanning — free</h3>
                            <p>
                                Send a product barcode and pull the label macros
                                from Open Food Facts — fiber and sugar too, where
                                the label lists them. No Premium subscription to
                                unlock it.
                            </p>
                        </article>
                        <article class="card feature">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="fa-solid fa-weight-scale"></i
                            ></span>
                            <h3>Weight &amp; goals</h3>
                            <p>
                                Log body weight in kg or lb, set calorie, macro,
                                fiber, sugar, caffeine, and water goals — fiber a
                                target to reach, sugar and caffeine limits to
                                stay under — and track
                                trends toward a goal weight. Alcohol tracking is
                                there too, opt-in and off unless you turn it on.
                            </p>
                        </article>
                        <article class="card feature">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="fa-solid fa-chart-area"></i
                            ></span>
                            <h3>Summaries &amp; trends</h3>
                            <p>
                                Ask for daily totals, weekly trends, streaks, and
                                recurring meal patterns — right in the chat.
                            </p>
                        </article>
                        <article class="card feature">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="fa-solid fa-file-csv"></i
                            ></span>
                            <h3>Import &amp; own your data</h3>
                            <p>
                                Import your meal history from another app's CSV
                                export — parsed in your browser, not by the AI.
                                Take everything back out whenever you want: one
                                ZIP with your meals, water, weight, goals and
                                profile as CSV files. Meals are the only part
                                that can be imported back in for now. Or delete
                                your account, just as easily.
                            </p>
                        </article>
                        <article class="card feature">
                            <span class="feature-icon" aria-hidden="true"
                                ><i class="fa-solid fa-code-branch"></i
                            ></span>
                            <h3>Open source &amp; free</h3>
                            <p>
                                MIT-licensed and self-hostable — no ads, no
                                paywall, no upsell. Audit the code or run your own
                                instance.
                            </p>
                        </article>
                    </div>`;

function installBlock(locale: SiteLocale): string {
    return `                    <div class="card install-card">
                        <ol class="steps">
                            <li>
                                Open <strong>Claude</strong> (web or desktop) and
                                click <strong>Customize</strong> →
                                <strong>Connectors</strong>.
                            </li>
                            <li>
                                Click <strong>+</strong>, then
                                <strong>Add custom connector</strong>, and give it
                                a name like <strong>Nutrition</strong>.
                            </li>
                            <li>
                                Paste
                                <span class="copy-url"
                                    ><code>https://nutrition-mcp.com/mcp</code
                                    ><button
                                        class="copy-mini"
                                        type="button"
                                        data-copy="https://nutrition-mcp.com/mcp"
                                        aria-label="Copy server URL"
                                    >
                                        <i class="fa-solid fa-copy"></i></button
                                ></span>
                                into the
                                <strong>Remote MCP server URL</strong> field and
                                click <strong>Add</strong>.
                            </li>
                            <li>
                                Click <strong>Connect</strong>, sign in, and start
                                logging by saying what you ate.
                            </li>
                        </ol>
                        <p class="note">
                            Using ChatGPT or another client instead? The
                            <a href="${hashPath(locale, "install")}">full install guide</a> covers
                            ChatGPT, Cursor, VS Code, Claude Code, and more.
                        </p>
                    </div>`;
}

// The Nutrition MCP (right) column of the comparison is identical everywhere.
const PROS = [
    "Built as an MCP server — lives inside Claude &amp; ChatGPT",
    "Describe meals in plain language; calories, macros, fiber, sugar &amp; caffeine estimated for you",
    "Barcode scanning, trends, CSV import &amp; export — all free",
    "No separate app, no ads, open source",
];

// ---------- helpers ----------

/**
 * Every import answer promises a panel that opens in the chat. That is the
 * widget path; a client with widgets off gets the paste fallback instead, where
 * the model does parse the rows (start_meal_import says so at src/mcp.ts). The
 * caveat is appended centrally so all seven pages carry the same wording rather
 * than six hand-edited variants.
 */
const IMPORT_FALLBACK_NOTE =
    " In clients without in-chat panels you can paste your export instead.";

function faqsFor(app: App, copy: AppCopy): { q: string; a: string }[] {
    return [
        {
            q: `Does ${app.name} have an MCP server?`,
            a: `No. ${app.name} does not offer a Model Context Protocol (MCP) server, so there is no official way to connect it to Claude, ChatGPT, or other AI assistants. Nutrition MCP is a free, open-source alternative built as an MCP server from the ground up, so you can log meals and macros directly inside your AI.`,
        },
        {
            q: `How do I connect ${app.name} to Claude?`,
            a: `There is no official ${app.name} connector for Claude, because ${app.name} has no MCP server or public MCP integration. The closest option is Nutrition MCP, a free MCP server: add https://nutrition-mcp.com/mcp as a custom connector in Claude, sign in, and start logging by conversation.`,
        },
        ...copy.extraFaqs,
        {
            q: `Is Nutrition MCP a good ${app.name} alternative?`,
            a: `If you want to track calories, macros — fiber, total sugar, and caffeine included — water, and weight without opening a separate app or searching a food database, yes. Instead of tapping through a database, you describe what you ate in plain language, send a photo, or scan a barcode, and your AI logs it — completely free and open source.`,
        },
        {
            q: `Can I import my ${app.name} data?`,
            a: copy.importFaq + IMPORT_FALLBACK_NOTE,
        },
        {
            q: `Does the AI read my export file when I import?`,
            a: `Not when the importer opens. It parses the CSV in your browser and shows you what will be added before anything is written: how many meals, the calorie total, anything it had to flag, and the rows themselves — a long file lists the first of them plus a count of the rest rather than every line. Only the rows you confirm are sent, and they go as structured data rather than through the AI's reply, so no row can be mistyped or invented in transit. Each row also carries a content fingerprint, so running the same file again reports those meals as already logged instead of duplicating them. If your client can't display in-chat panels, the fallback is to paste the export — the AI does read it on that path, so prefer the importer when you have the choice.`,
        },
        {
            q: `Is Nutrition MCP free?`,
            a:
                copy.freeAnswer ??
                `Yes. Nutrition MCP is completely free with no premium tier, ads, or paywalled features — unlike apps that put some features behind a subscription. You only need a Claude or ChatGPT account to connect.`,
        },
    ];
}

// ---------- per-app page ----------

function renderApp(app: App, locale: SiteLocale = "en"): string {
    const copy = copyFor(app.slug, locale);
    const url = urlFor(locale, `/${app.slug}`);
    // The <title> deliberately does NOT mention import: these pages rank on the
    // exact bridge query ("<app> mcp", "connect <app> to claude") and diluting
    // that head term would cost more than an import keyword gains. The
    // description is a click-through lever rather than a ranking one, so it does
    // carry import — abandoning logged history is the top objection to switching.
    const desc = `No MCP server for ${app.name}? Nutrition MCP logs meals and macros inside Claude or ChatGPT — free, open source, and it imports your CSV export.`;
    const ogDesc = `${app.name} has no MCP server. Nutrition MCP is a free, open-source alternative that logs meals, macros, and weight in Claude or ChatGPT — and imports your ${app.name} history from a CSV export.`;
    const title = `${app.name} MCP Server? Track Nutrition in Claude & ChatGPT`;
    const faqs = faqsFor(app, copy);

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
    const pros = PROS.map(
        (p) =>
            `                                <li>\n                                    <i class="fa-solid fa-circle-check"></i>\n                                    ${p}\n                                </li>`,
    ).join("\n");
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
                        <a href="${pathFor(locale, "")}">Home</a>
                        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                        <a href="${pathFor(locale, "/alternatives")}">Alternatives</a>
                        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                        <span>${esc(app.name)}</span>
                    </nav>
                    <div class="hero-copy hero-copy-wide">
                        <p class="eyebrow">${esc(app.name)} alternative</p>
                        <h1 class="hero-title">
                            Looking for a <em>${esc(app.name)} MCP</em> server?
                        </h1>
                        <p class="lead">
                            ${esc(app.name)} doesn't have one — so you can't use
                            it inside Claude or ChatGPT. Nutrition MCP does the
                            same job by conversation, and it's free and open
                            source.
                        </p>
                        <div class="hero-actions">
                            <a class="btn btn-primary" href="#switch"
                                >Connect in under a minute</a
                            >
                            <a class="btn btn-secondary" href="#compare"
                                >See the comparison</a
                            >
                        </div>
                    </div>
                </div>
            </section>

            <!-- The honest answer -->
            <section class="section band" id="answer">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">The short answer</p>
                        <h2 class="section-title">
                            No, ${esc(app.name)} has no MCP server.
                        </h2>
                        <p class="section-sub">
                            The Model Context Protocol (MCP) is the open standard
                            that lets AI assistants like Claude and ChatGPT
                            connect to outside tools. ${esc(app.name)} doesn't
                            publish an MCP server, so there's no official way to
                            log food to it from your AI. If you searched for
                            &ldquo;${esc(app.name)} MCP&rdquo; or &ldquo;connect
                            ${esc(app.name)} to Claude,&rdquo; what you're really
                            after is a nutrition tracker that lives
                            <em>inside</em> your AI — that's exactly what
                            Nutrition MCP is.
                        </p>
                    </div>
                </div>
            </section>

            <!-- What you get instead -->
            <section class="section" id="instead">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">What you get instead</p>
                        <h2 class="section-title">
                            The same tracking, just by talking
                        </h2>
                    </div>
${FEATURES}
                </div>
            </section>

            <!-- Comparison -->
            <section class="section band" id="compare">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">${esc(app.name)} vs. Nutrition MCP</p>
                        <h2 class="section-title">How they stack up</h2>
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
                        <p class="eyebrow">Moving from ${esc(app.name)}</p>
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
                        <p class="eyebrow">Your ${esc(app.name)} history</p>
                        <h2 class="section-title">
                            ${esc(copy.importSection.title)}
                        </h2>
                        <p class="section-sub">
                            Ask to import and an importer opens right in the
                            chat: pick your export, map the columns, preview
                            what will be added, then confirm. The file
                            is read in your browser — the AI never sees the
                            rows. In clients without in-chat panels, paste your
                            export instead.
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
                        <p class="eyebrow">How to switch</p>
                        <h2 class="section-title">Connect in under a minute</h2>
                        <p class="section-sub">
                            Works with any MCP client that supports OAuth 2.0
                            with PKCE. On first connect you create an account
                            with Google or an email and password.
                        </p>
                    </div>
${installBlock(locale)}
                </div>
            </section>

            <!-- FAQ -->
            <section class="section band" id="faq">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">FAQ</p>
                        <h2 class="section-title">
                            ${esc(app.name)} &amp; MCP questions
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
                        Track nutrition inside the AI you already use.
                    </h2>
                    <p class="cta-sub">
                        Free and open source — no ${esc(app.name)} account, no app
                        to open.
                    </p>
                    <div class="cta-actions">
                        <a class="btn btn-on-accent" href="#switch"
                            >Quick install</a
                        >
                        <a class="btn btn-ghost-accent" href="${pathFor(locale, "/alternatives")}"
                            >Other alternatives</a
                        >
                    </div>
                </div>
            </section>
        </main>

${disclaimerBand(`${esc(app.name)} is a trademark of its respective owner. Nutrition MCP is an independent, open-source project and is not affiliated with, endorsed by, or sponsored by ${esc(app.name)}. Comparisons reflect publicly available information at the time of writing and may change.`)}

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

    const title =
        "Nutrition App MCP Alternatives — Track Food in Claude & ChatGPT";
    // As on the per-app pages, the title keeps the head term and the description
    // carries the import hook. See renderApp for the reasoning.
    const desc =
        "MyFitnessPal, Cronometer, and Lose It! have no MCP server. Nutrition MCP is the free, open-source alternative for Claude and ChatGPT — and imports your history.";
    const ogDesc =
        "Your nutrition app doesn't have an MCP server. Nutrition MCP is a free, open-source alternative that works inside Claude or ChatGPT — and imports your history from a CSV export.";

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
                        <a href="${pathFor(locale, "")}">Home</a>
                        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                        <span>Alternatives</span>
                    </nav>
                    <div class="hero-copy hero-copy-wide">
                        <p class="eyebrow">MCP alternatives</p>
                        <h1 class="hero-title">
                            Your nutrition app doesn't have an
                            <em>MCP server</em>.
                        </h1>
                        <p class="lead">
                            Apps like MyFitnessPal, Cronometer, and Lose It can't
                            connect to Claude or ChatGPT. Nutrition MCP is the
                            free, open-source way to track meals, macros, and
                            weight by talking to your AI.
                        </p>
                        <div class="hero-actions">
                            <a class="btn btn-primary" href="${hashPath(locale, "install")}"
                                >Quick install</a
                            >
                            <a class="btn btn-secondary" href="${hashPath(locale, "try")}"
                                >See examples</a
                            >
                        </div>
                    </div>
                </div>
            </section>

            <section class="section band" id="apps">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">Switching from…</p>
                        <h2 class="section-title">Pick your current app</h2>
                        <p class="section-sub">
                            See how Nutrition MCP compares to the tracker you use
                            today — and how to move your logging, and your
                            existing history, into your AI.
                        </p>
                    </div>
                    <div class="features-grid" data-reveal="stagger">
${cards}
                    </div>
                    <p class="note compare-note">
                        Don't see your app? It almost certainly has no MCP server
                        either — Nutrition MCP works the same way regardless of
                        what you're switching from.
                        <a href="mailto:anton@nutrition-mcp.com"
                            >Request a comparison</a
                        >.
                    </p>
                </div>
            </section>

            <section class="section" id="import">
                <div class="container" data-reveal>
                    <div class="section-head">
                        <p class="eyebrow">Bringing your history</p>
                        <h2 class="section-title">
                            You don't have to start from zero
                        </h2>
                        <p class="section-sub">
                            The usual reason people stay put is the years already
                            logged. Ask to import and an importer opens right in
                            the chat: pick your export, map the columns, preview
                            what will be added, then confirm — or paste
                            the export if your client has no in-chat panels.
                        </p>
                    </div>
                    <div class="prose">
                        <p>
                            The file is parsed in your browser, not read by the
                            AI — so the rows can't be mistyped on the way in, and
                            you see the exact meals before any of them are
                            written. Exports from MyFitnessPal, Cronometer, Lose
                            It!, and MacroFactor have their columns recognised by
                            name; any other CSV works too, you just point the
                            mapper at each column once. What comes across is the
                            date and time, food, meal, calories, protein, carbs,
                            fat, fiber, total sugar, and caffeine in
                            milligrams — and alcohol as well, if
                            you've switched alcohol tracking on first.
                        </p>
                        <p>
                            The awkward parts of real export files are handled:
                            DD/MM/YYYY and MM/DD/YYYY dates, energy in kilojoules
                            as well as kilocalories, semicolon-delimited European
                            files whose numbers use comma decimals, quoted fields
                            with line breaks inside them, trailing totals rows,
                            and deleted-row flags. Column headings don't have to
                            be English either — a German export's Kalorien or
                            Ballaststoffe is recognised, and fiber, sugar, and
                            caffeine are matched in Spanish, French, Italian,
                            and Dutch too.
                            Where a file is genuinely
                            ambiguous — 05/06 could be May or June — the importer
                            shows its reading next to a row from your own file and
                            asks you to confirm rather than guessing. And each row
                            carries a content fingerprint, so re-importing the
                            same file reports the meals as already logged instead
                            of duplicating them.
                        </p>
                    </div>
                </div>
            </section>

            <section class="section cta">
                <div class="container cta-inner" data-reveal>
                    <h2 class="cta-title">
                        Track nutrition inside the AI you already use.
                    </h2>
                    <p class="cta-sub">
                        Free and open source — it works with Claude, ChatGPT, and
                        any MCP client.
                    </p>
                    <div class="cta-actions">
                        <a class="btn btn-on-accent" href="${hashPath(locale, "install")}"
                            >Quick install</a
                        >
                        <a
                            class="btn btn-ghost-accent"
                            href="https://github.com/akutishevsky/nutrition-mcp"
                            target="_blank"
                            rel="noopener noreferrer"
                            ><i class="fa-brands fa-github"></i> Star on GitHub</a
                        >
                    </div>
                </div>
            </section>
        </main>

${disclaimerBand(`${APPS.map((a) => esc(a.name)).join(", ")}, and other product names are trademarks of their respective owners. Nutrition MCP is an independent, open-source project and is not affiliated with or endorsed by them. Comparisons reflect publicly available information at the time of writing and may change.`)}

${footer(locale, "/alternatives")}

${SITE_SCRIPT}
    </body>
</html>
`;
}

// ---------- write + sitemap ----------

const OUT_DIR = "./public/alternatives";

// English only for now — the per-app APPS data (cons, migrate, FAQ, etc.)
// isn't translated yet, so generating other locales here would ship pages
// with a translated header/footer around untranslated English body copy.
// The `locale` parameter threaded through renderApp/renderHub above is
// ready for when that data lands; this loop is the only place to extend
// once it does. src/routes.ts's ALT_PAGES is the source of truth for the
// route -> file map src/index.ts serves these from — keep app.slug/app.file
// here in sync with it by hand, the same as before.
for (const app of APPS) {
    await Bun.write(`${OUT_DIR}/${app.file}`, renderApp(app));
    console.log(`wrote ${app.file}  (/${app.slug})`);
}
await Bun.write(`${OUT_DIR}/index.html`, renderHub());
console.log("wrote index.html  (/alternatives)");
