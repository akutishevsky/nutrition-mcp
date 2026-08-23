/**
 * Generates public/tools.html and its translated counterparts under
 * public/{locale}/ from the typed data in src/copy/tools.ts. This page
 * used to be hand-authored HTML with nav()/footer() copy-pasted in by
 * hand; see scripts/gen-legal.ts and scripts/site-partials.ts for why
 * every generated page now shares one copy of that markup instead.
 *
 * The page-specific <style> block and the category-scrollspy <script> are
 * spliced in verbatim as constants (TOOLS_STYLE / SCROLLSPY_SCRIPT) — both
 * are pure CSS/JS with no translatable text in them, so they need no
 * per-locale handling, unlike everything driven from src/copy/tools.ts.
 *
 * Re-run after editing src/copy/tools.ts:
 *   bun run scripts/gen-tools.ts
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
    BADGE_META,
    CATEGORIES,
    CATEGORY_META,
    TOOLS,
    TOOLS_COPY,
    type BadgeKind,
    type CategoryId,
    type ToolIdentity,
    type ToolsDoc,
} from "../src/copy/tools.js";

// Page-layout CSS, unchanged from the previous hand-authored tools.html —
// on top of the shared "Nutrition Facts" tokens in styles.css. No
// translatable text lives in here (see the file header above).
const TOOLS_STYLE = `        <style>
            /* Tools reference — page-specific layout on top of the shared
               "Nutrition Facts" tokens in styles.css. Everything here reads
               from the shared tokens; nothing is hardcoded per theme. */

            /* ---- hero: a section-head ledger row, left-aligned ---- */
            .tools-hero {
                padding: clamp(2.5rem, 6vw, 4.5rem) 0 0;
            }
            .tools-hero .container {
                max-width: 1080px;
            }
            .tools-hero .section-head {
                margin-bottom: 0;
                padding-bottom: clamp(1.5rem, 3vw, 2.25rem);
            }
            .tools-hero .lead {
                margin-bottom: 0;
            }
            .tools-hero .count-pill {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                margin-top: 1.25rem;
                padding: 0.4rem 0.85rem;
                border-radius: 999px;
                border: 1px solid var(--line);
                background: var(--surface);
                color: var(--ink-2);
                font-family: var(--font-mono);
                font-size: 0.78rem;
                letter-spacing: 0.02em;
                justify-self: start;
            }
            .tools-hero .count-pill i {
                color: var(--accent);
                font-size: 0.85em;
            }
            .tools-hero .count-pill b {
                color: var(--ink);
                font-weight: 500;
            }
            @media (min-width: 900px) {
                .tools-hero .count-pill {
                    grid-column: 2;
                }
            }

            .tools-main {
                padding: 1.5rem 0 clamp(4rem, 8vw, 6.5rem);
            }
            .tools-main .container {
                max-width: 1080px;
            }

            /* ---- tool groups: each head is a ledger entry ---- */
            .tool-group {
                margin-top: clamp(3rem, 6vw, 4.5rem);
            }
            .tool-group:first-child {
                margin-top: 1.5rem;
            }
            .tool-group-head {
                display: flex;
                align-items: flex-start;
                gap: 1rem;
                padding-top: 1.1rem;
                border-top: 3px solid var(--rule);
                margin-bottom: 1.5rem;
            }
            .tool-group-icon {
                flex: none;
                width: 40px;
                height: 40px;
                display: grid;
                place-items: center;
                border-radius: 12px;
                background: var(--accent-soft);
                color: var(--accent-hover);
                font-size: 0.95rem;
                margin-top: 0.15rem;
            }
            .tool-group-head h2 {
                font-family: var(--font-display);
                font-weight: 700;
                font-variation-settings: "opsz" 96;
                letter-spacing: -0.025em;
                line-height: 1.05;
                font-size: clamp(1.5rem, 2.6vw, 1.9rem);
                margin: 0;
                color: var(--ink);
                text-wrap: balance;
            }
            .tool-group-head p {
                margin: 0.35rem 0 0;
                color: var(--ink-2);
                font-size: 0.95rem;
                max-width: 60ch;
                text-wrap: pretty;
            }

            /* ---- cards: cells of one ruled grid ---- */
            .tool-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 1px;
                background: var(--line);
                border: 1px solid var(--line);
                border-radius: var(--radius-lg);
                overflow: hidden;
            }
            @media (min-width: 900px) {
                .tool-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
            }
            .tool-card {
                display: flex;
                flex-direction: column;
                min-width: 0;
                background: var(--surface);
                padding: 1.25rem 1.35rem 1.2rem;
                scroll-margin-top: calc(var(--head-h) + 76px);
                transition: background 0.2s ease;
            }
            .tool-card:hover {
                background: var(--surface-2);
            }
            .tool-card:target {
                background: var(--accent-soft);
            }
            .tool-head {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-bottom: 0.7rem;
            }
            .tool-name {
                font-family: var(--font-mono);
                font-size: 0.95rem;
                font-weight: 500;
                letter-spacing: -0.01em;
                color: var(--ink);
                background: transparent;
                border: 0;
                padding: 0;
                border-radius: 0;
                margin-right: 0.25rem;
                overflow-wrap: anywhere;
            }
            /* styles.css owns a floating, animated .chip for the landing hero;
               the card badges reset that here. */
            .tool-head .chip {
                position: static;
                opacity: 1;
                animation: none;
                box-shadow: none;
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
                font-family: var(--font-mono);
                font-size: 0.66rem;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                line-height: 1;
                padding: 0.3rem 0.55rem;
                border-radius: 999px;
                border: 1px solid transparent;
                white-space: nowrap;
                background: var(--accent-soft);
                color: var(--accent-hover);
            }
            /* One accent family, graded by weight: filled for writes, outlined
               for reads, dashed for the "has a widget" hint. */
            .tool-head .chip i {
                width: auto;
                height: auto;
                border-radius: 0;
                background: transparent;
                align-self: center;
            }
            .tool-head .chip-log,
            .tool-head .chip-edit,
            .tool-head .chip-setting,
            .tool-head .chip-lookup {
                background: var(--accent-soft);
                color: var(--accent-hover);
            }
            .tool-head .chip-view {
                background: transparent;
                color: var(--ink-2);
                border-color: var(--line);
            }
            .tool-head .chip-remove {
                background: transparent;
                color: var(--ink);
                border-color: var(--ink);
            }
            .tool-head .chip-widget {
                background: transparent;
                color: var(--ink-2);
                border: 1px dashed var(--line);
            }
            .tool-desc {
                margin: 0;
                color: var(--ink-2);
                font-size: 0.95rem;
                line-height: 1.55;
                text-wrap: pretty;
            }

            /* ---- parameters: hairline rows, name left / description right ---- */
            .tool-params {
                margin-top: 1rem;
            }
            .tool-params-label,
            .tool-ex-label {
                display: block;
                font-family: var(--font-mono);
                font-size: 0.68rem;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: var(--ink-3);
                padding-bottom: 0.4rem;
                border-bottom: 1px solid var(--rule);
                margin-bottom: 0;
            }
            .tool-params ul {
                list-style: none;
                margin: 0;
                padding: 0;
            }
            .tool-params li {
                position: relative;
                padding: 0.5rem 0 0.5rem 10rem;
                border-bottom: 1px solid var(--line-2);
                font-size: 0.86rem;
                color: var(--ink-2);
                line-height: 1.5;
                min-height: 2.4rem;
            }
            .tool-params li > code:first-child {
                position: absolute;
                left: 0;
                top: 0.5rem;
                width: 9.5rem;
                font-family: var(--font-mono);
                font-size: 0.8rem;
                color: var(--ink);
                background: transparent;
                border: 0;
                padding: 0;
                border-radius: 0;
                overflow-wrap: anywhere;
                line-height: 1.5;
            }
            .tool-params code {
                font-family: var(--font-mono);
                font-size: 0.8rem;
                color: var(--ink);
            }
            .param-req,
            .param-opt {
                display: inline-block;
                font-family: var(--font-mono);
                font-size: 0.6rem;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                line-height: 1;
                padding: 0.2rem 0.4rem;
                border-radius: 999px;
                margin: 0 0.15rem 0 0;
                vertical-align: 0.1em;
                border: 1px solid transparent;
            }
            .param-req {
                background: var(--accent-soft);
                color: var(--accent-hover);
            }
            .param-opt {
                background: transparent;
                color: var(--ink-3);
                border-color: var(--line);
            }
            @media (max-width: 640px) {
                .tool-params li {
                    padding-left: 0;
                }
                .tool-params li > code:first-child {
                    position: static;
                    display: block;
                    width: auto;
                    margin-bottom: 0.2rem;
                }
            }

            /* ---- example phrase ---- */
            .tool-ex {
                margin-top: auto;
                padding-top: 1rem;
            }
            .tool-ex > p:not(.tool-ex-photo) {
                margin: 0;
                position: relative;
                padding: 0.6rem 0 0 1.35rem;
                color: var(--ink);
                font-family: var(--font-display);
                font-variation-settings: "opsz" 24;
                font-weight: 500;
                font-size: 1rem;
                line-height: 1.45;
                text-wrap: pretty;
            }
            .tool-ex > p:not(.tool-ex-photo)::before {
                content: "\\201C";
                position: absolute;
                left: 0;
                top: 0.45rem;
                font-family: var(--font-display);
                font-size: 1.5rem;
                line-height: 1;
                color: var(--accent);
            }
            /* Alternate input hint: this tool also accepts a photo, not just a
               typed phrase. */
            .tool-ex-photo {
                margin: 0.5rem 0 0 1.35rem;
                display: flex;
                align-items: baseline;
                gap: 0.45rem;
                font-size: 0.86rem;
                line-height: 1.45;
                color: var(--ink-2);
            }
            .tool-ex-photo i {
                color: var(--accent);
                font-size: 0.9em;
                position: relative;
                top: 1px;
            }

            /* ---- sticky category jump-bar with scrollspy ----
               Sits directly under the site header (top: var(--head-h), which
               shrinks to 56px once scrolled) and shares its frosted ground;
               the active pill tracks the section in view. */
            html {
                scroll-behavior: smooth;
            }
            .tool-group {
                scroll-margin-top: calc(var(--head-h) + 70px);
            }
            .cat-nav {
                position: sticky;
                top: var(--head-h);
                z-index: 30;
                background: color-mix(in srgb, var(--bg) 84%, transparent);
                -webkit-backdrop-filter: saturate(160%) blur(14px);
                backdrop-filter: saturate(160%) blur(14px);
                border-top: 1px solid var(--line);
                border-bottom: 1px solid var(--line);
                transition: top 0.3s var(--ease-out);
            }
            .cat-nav .container {
                max-width: 1080px;
            }
            .cat-nav-scroll {
                display: flex;
                gap: 0.5rem;
                overflow-x: auto;
                padding: 0.6rem 2px;
                scrollbar-width: none;
            }
            .cat-nav-scroll::-webkit-scrollbar {
                display: none;
            }
            .cat-pill {
                flex: none;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.45rem;
                min-height: 36px;
                padding: 0.4rem 1rem;
                border-radius: 999px;
                border: 1px solid var(--line);
                background: transparent;
                color: var(--ink);
                font-size: 0.9rem;
                font-weight: 600;
                letter-spacing: -0.01em;
                text-decoration: none;
                white-space: nowrap;
                transition:
                    background 0.2s ease,
                    border-color 0.2s ease,
                    color 0.2s ease;
            }
            .cat-pill i {
                font-size: 0.85em;
                color: var(--ink-2);
            }
            .cat-pill:hover {
                border-color: var(--ink);
            }
            .cat-pill:focus-visible {
                outline: 2px solid var(--accent);
                outline-offset: 2px;
            }
            .cat-pill.active {
                background: var(--ink);
                border-color: var(--ink);
                color: var(--bg);
            }
            .cat-pill.active i {
                color: inherit;
            }
        </style>`;

// Category jump-bar: highlights the pill for the section in view, and
// keeps the active pill scrolled into view on narrow screens. Pure
// behaviour, no translatable text — unchanged from the previous
// hand-authored tools.html.
const SCROLLSPY_SCRIPT = `        <script>
            // Category jump-bar: highlight the pill for the section in view, and
            // keep the active pill scrolled into view on narrow screens.
            (function () {
                var pills = Array.prototype.slice.call(
                    document.querySelectorAll(".cat-pill"),
                );
                if (!pills.length) return;
                var scroller = document.querySelector(".cat-nav-scroll");
                var groups = pills.map(function (p) {
                    return document.querySelector(p.getAttribute("href"));
                });
                var OFFSET = 140; // 64px header + ~58px bar + breathing room
                var raf = 0;
                function update() {
                    raf = 0;
                    var idx = 0;
                    for (var i = 0; i < groups.length; i++) {
                        if (
                            groups[i] &&
                            groups[i].getBoundingClientRect().top - OFFSET <= 1
                        )
                            idx = i;
                    }
                    // Snap to the last category once scrolled to the bottom.
                    if (
                        window.innerHeight + window.scrollY >=
                        document.documentElement.scrollHeight - 4
                    )
                        idx = groups.length - 1;
                    for (var j = 0; j < pills.length; j++)
                        pills[j].classList.toggle("active", j === idx);
                    var active = pills[idx];
                    if (active && scroller) {
                        var pr = active.getBoundingClientRect();
                        var sr = scroller.getBoundingClientRect();
                        scroller.scrollLeft +=
                            pr.left + pr.width / 2 - (sr.left + sr.width / 2);
                    }
                }
                function onScroll() {
                    if (!raf) raf = requestAnimationFrame(update);
                }
                window.addEventListener("scroll", onScroll, { passive: true });
                window.addEventListener("resize", onScroll);
                pills.forEach(function (p) {
                    p.addEventListener("click", function () {
                        setTimeout(update, 60);
                    });
                });
                update();
            })();
        </script>`;

function renderBadge(kind: BadgeKind, label: string): string {
    const meta = BADGE_META[kind];
    const iconHtml = meta.icon
        ? `<i class="${meta.icon}" aria-hidden="true"></i> `
        : "";
    return `<span class="chip ${meta.cls}">${iconHtml}${esc(label)}</span>`;
}

// `descHtml` is trusted HTML (see src/copy/tools.ts's file header) — most
// param descriptions are markup-free plain characters that pass through
// untouched, a handful carry inline <b>/<code>.
function renderParam(
    param: { name: string; required: boolean },
    descHtml: string,
    doc: ToolsDoc,
): string {
    const badge = param.required
        ? `<span class="param-req">${esc(doc.ui.requiredLabel)}</span>`
        : `<span class="param-opt">${esc(doc.ui.optionalLabel)}</span>`;
    const tail = descHtml ? ` — ${descHtml}` : "";
    return `<li><code>${param.name}</code> ${badge}${tail}</li>`;
}

function renderToolCard(tool: ToolIdentity, doc: ToolsDoc): string {
    const prose = doc.tools[tool.name];
    if (!prose) {
        throw new Error(
            `src/copy/tools.ts: TOOLS_COPY is missing prose for tool "${tool.name}"`,
        );
    }
    const badgesHtml = tool.badges
        .map((k) => renderBadge(k, doc.badges[k]))
        .join("\n                    ");
    const paramsHtml =
        tool.params.length === 0
            ? ""
            : `<div class="tool-params">
                    <span class="tool-params-label">${esc(doc.ui.parametersLabel)}</span>
                    <ul>
                        ${tool.params
                            .map((p) =>
                                renderParam(p, prose.params[p.name] ?? "", doc),
                            )
                            .join("\n                        ")}
                    </ul>
                </div>`;
    const photoHtml =
        tool.hasPhotoHint && prose.photoHint
            ? `<p class="tool-ex-photo">
                        <i class="fa-solid fa-camera" aria-hidden="true"></i>
                        ${esc(prose.photoHint)}
                    </p>`
            : "";
    return `<article class="tool-card" id="${tool.name}">
                <div class="tool-head">
                    <code class="tool-name">${tool.name}</code>
                    ${badgesHtml}
                </div>
                <p class="tool-desc">${esc(prose.description)}</p>
                ${paramsHtml}
                <div class="tool-ex">
                    <span class="tool-ex-label">${esc(doc.ui.trySayingLabel)}</span>
                    <p>${esc(prose.example)}</p>
                    ${photoHtml}
                </div>
            </article>`;
}

function renderCategoryPill(id: CategoryId, doc: ToolsDoc): string {
    const meta = CATEGORY_META[id];
    const label = doc.categories[id].pillLabel;
    return `<a class="cat-pill" href="#${id}"
                            ><i class="${meta.icon}" aria-hidden="true"></i>
                            ${esc(label)}</a
                        >`;
}

function renderCategorySection(id: CategoryId, doc: ToolsDoc): string {
    const meta = CATEGORY_META[id];
    const cat = doc.categories[id];
    const toolsInCat = TOOLS.filter((t) => t.category === id);
    return `<section class="tool-group" data-reveal id="${id}">
                        <div class="tool-group-head">
                            <span class="tool-group-icon"
                                ><i class="${meta.icon}" aria-hidden="true"></i
                            ></span>
                            <div>
                                <h2>${esc(cat.title)}</h2>
                                <p>${esc(cat.description)}</p>
                            </div>
                        </div>
                        <div class="tool-grid">
                            ${toolsInCat.map((t) => renderToolCard(t, doc)).join("\n\n                            ")}
                        </div>
                    </section>`;
}

function renderDoc(doc: ToolsDoc, locale: SiteLocale): string {
    const suffix = "/tools";
    const title = `${esc(doc.meta.title)} — Nutrition MCP`;
    const url = `${SITE}${pathFor(locale, suffix)}`;

    const pills = CATEGORIES.map((id) => renderCategoryPill(id, doc)).join(
        "\n                        ",
    );
    const sections = CATEGORIES.map((id) =>
        renderCategorySection(id, doc),
    ).join("\n\n                    ");

    return `<!doctype html>
<html lang="${HTML_LANG[locale]}">
    <head>
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="utf-8" />
        <meta name="description" content="${esc(doc.meta.description)}" />
${localeHead(locale, suffix)}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#fbfbf9" />
        <meta property="og:title" content="${title}" />
        <meta
            property="og:description"
            content="${esc(doc.meta.ogDescription)}"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${url}" />
        <meta property="og:image" content="${SITE}/og.png" />
${HEAD_ASSETS}
${TOOLS_STYLE}
    </head>
    <body class="landing">
${generatedBanner("scripts/gen-tools.ts")}
${THEME_PREPAINT}

${nav(locale, suffix, suffix)}

        <main id="main">
            <section class="tools-hero">
                <div class="container">
                    <div class="section-head">
                        <p class="eyebrow">${esc(doc.hero.eyebrow)}</p>
                        <h1 class="section-title">${esc(doc.hero.title)}</h1>
                        <p class="lead section-sub">
                            ${esc(doc.hero.lead)}
                        </p>
                        <span class="count-pill"
                            ><i
                                class="fa-solid fa-wrench"
                                aria-hidden="true"
                            ></i
                            ><b>${esc(doc.hero.countBold)}</b> ${esc(doc.hero.countTail)}</span
                        >
                    </div>

${translationNotice(locale, suffix)}
                </div>
            </section>

            <nav class="cat-nav" aria-label="Jump to a tool category">
                <div class="container">
                    <div class="cat-nav-scroll" role="list">
                        ${pills}
                    </div>
                </div>
            </nav>

            <div class="tools-main">
                <div class="container">
                    ${sections}
                </div>
            </div>
        </main>

${footer(locale, suffix)}

${SCROLLSPY_SCRIPT}
${SITE_SCRIPT}
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
