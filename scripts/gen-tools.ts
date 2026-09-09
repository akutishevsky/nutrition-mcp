/**
 * Generates public/tools.html and its translated counterparts under
 * public/{locale}/ from the typed data in src/copy/tools.ts. This page
 * used to be hand-authored HTML with nav()/footer() copy-pasted in by
 * hand; see scripts/gen-legal.ts and scripts/site-partials.ts for why
 * every generated page now shares one copy of that markup instead.
 *
 * Layout is the Dawn design system (public/styles.css): a page hero with
 * the glass count pill, a sticky category chip row, then one panel per
 * category holding a masonry of tool cards. Only what no other page needs
 * lives in the inline TOOLS_STYLE block below — everything else is a
 * shared primitive from styles.css (.nm-page-hero, .nm-chips, .nm-panel,
 * .nm-card, .nm-tile, .nm-tag, .nm-kv, .nm-say).
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

import { HTML_LANG, QUOTES, pathFor, type SiteLocale } from "../src/routes.js";
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

// Colour role per category (the .nm-c-* classes set --c, which .nm-tile
// reads). Structural like CATEGORY_META's icons, so it lives beside the
// generator's other presentation-only constants rather than in the copy
// file — same as ONB_TINTS / EX_TINTS in gen-index.ts. Neighbouring
// categories are kept on distinct hues so the chip row and the panel
// heads read as seven different things.
const CATEGORY_TINTS: Record<CategoryId, string> = {
    "logging-food-meals": "nm-c-cal",
    "reviewing-your-meals": "nm-c-pro",
    water: "nm-c-wat",
    weight: "nm-c-fat",
    "goals-progress": "nm-c-acc",
    "insights-trends": "nm-c-caf",
    "settings-account": "nm-c-fib",
};

// Badge kinds that read as "this tool changes something": accent tag.
// Everything else (view/export/remove, and the widget hint) is the plain
// grey tag — the system has two tags, not a variant per kind.
const ACCENT_BADGES: ReadonlySet<BadgeKind> = new Set([
    "log",
    "import",
    "edit",
    "setting",
    "lookup",
]);

// Page-only layout on top of the shared Dawn primitives in styles.css.
// Scoped to body.tools; no translatable text lives in here (see the file
// header above).
const TOOLS_STYLE = `        <style>
            /* Tools reference — page-specific layout on top of the shared
               Dawn primitives in styles.css. Everything reads from the
               shared tokens; nothing is hardcoded per theme. */

            /* ---- hero: count pill above the h1 ---- */
            /* The shared pill is nowrap (one short phrase); this one carries
               "Reference · 36 tools across 7 areas" and overflows a 320px
               viewport by a hair, so it wraps to two lines there instead. */
            body.tools .nm-page-hero .nm-pill {
                margin-bottom: 22px;
                max-width: 100%;
                height: auto;
                min-height: 32px;
                padding-top: 6px;
                padding-bottom: 6px;
                white-space: normal;
                line-height: 1.35;
            }
            body.tools .nm-page-hero .nm-pill .nm-pulse-dot {
                flex: none;
            }
            body.tools .nm-page-hero .nm-h1 {
                max-width: 14ch;
            }

            /* ---- main column: sticky chip row + stacked category panels ---- */
            body.tools .tools-main {
                padding-top: 0;
            }
            /* The chip strip sticks under the floating header for the whole
               list (its containing block is .tools-main, which wraps every
               panel). */
            body.tools .tools-cats {
                margin-bottom: 18px;
            }
            body.tools .tools-cats .nm-chip {
                flex: none;
            }
            body.tools .tools-cats .nm-chip i {
                color: var(--ink3);
            }
            body.tools .tools-cats .nm-chip.is-active i {
                color: inherit;
            }
            body.tools .tools-groups {
                display: grid;
                gap: 18px;
            }
            /* Clear the header pill plus the sticky chip strip after a jump. */
            body.tools .tools-group,
            body.tools .tool-card {
                scroll-margin-top: calc(var(--head-h) + 64px);
            }

            /* ---- category panel head: tile + title + one-liner ---- */
            body.tools .tools-group-head {
                display: flex;
                align-items: flex-start;
                gap: 16px;
                margin-bottom: 22px;
            }
            body.tools .tools-group-head .nm-tile {
                margin-top: 2px;
            }
            body.tools .tools-group-head .nm-body {
                margin-top: 6px;
                max-width: 60ch;
            }

            /* ---- cards: a masonry, so a 12-parameter card next to a
               parameterless one leaves no void (a row grid would stretch
               the short card to the tall one's height) ---- */
            /* .tool-card is the masonry item (break-inside, gap, anchor);
               the .nm-card surface is its one child, so the hover lift's
               transform never sits on a multicol item itself. */
            body.tools .tools-cards {
                columns: 1;
                column-gap: 14px;
                /* Cancel the last card's bottom margin inside the panel. */
                margin-bottom: -14px;
            }
            @media (min-width: 720px) {
                body.tools .tools-cards {
                    columns: 2;
                }
            }
            @media (min-width: 1080px) {
                body.tools .tools-cards {
                    columns: 3;
                }
            }
            body.tools .tool-card {
                break-inside: avoid;
                margin-bottom: 14px;
            }
            body.tools .tool-card:target > .nm-card {
                border-color: var(--acc);
                box-shadow:
                    0 0 0 3px color-mix(in srgb, var(--acc) 30%, transparent),
                    var(--shadow);
            }
            body.tools .tool-card h3 {
                font-size: 16px;
                line-height: 1.3;
                letter-spacing: 0;
            }
            body.tools .tool-name {
                font-family: var(--mono);
                font-size: 15px;
                font-weight: 600;
                letter-spacing: -0.01em;
                color: var(--ink);
                background: transparent;
                padding: 0;
                border-radius: 0;
                overflow-wrap: anywhere;
            }
            body.tools .tool-card .nm-card > p {
                margin: 0;
                font-size: 14.5px;
                line-height: 1.5;
            }
            body.tools .tool-badges {
                display: flex;
                flex-wrap: wrap;
                justify-content: flex-end;
                gap: 6px;
                min-width: 0;
            }
            body.tools .tool-badge i {
                font-size: 10px;
            }

            /* ---- parameters: the shared .nm-kv-compact rows; only the
               name cell's wrapping (mono name + required/optional tag on
               one line) is this page's ---- */
            body.tools .tool-params {
                display: grid;
                gap: 2px;
            }
            body.tools .tool-params .nm-kv-k {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 6px;
                font-size: 12.5px;
            }
            body.tools .tool-params .nm-kv-k .nm-tag {
                font-size: 10px;
                padding: 1px 7px;
            }
            body.tools .tool-params .nm-kv b {
                color: var(--ink);
            }

            /* ---- example phrase: the shared "Just say" box ---- */
            body.tools .tool-ex {
                display: grid;
                gap: 8px;
            }
            body.tools .tool-ex .nm-say {
                text-wrap: pretty;
            }
            /* Alternate input hint: this tool also accepts a photo, not just a
               typed phrase. */
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
                font-size: 0.9em;
                position: relative;
                top: 1px;
            }
        </style>`;

// Category chip row: lights the chip for the section in view, and keeps
// the active chip scrolled into view on narrow screens. Pure behaviour,
// no translatable text.
const SCROLLSPY_SCRIPT = `        <script>
            // Category chip row: highlight the chip for the section in view,
            // and keep the active chip scrolled into view on narrow screens.
            (function () {
                var scroller = document.querySelector(".tools-cats");
                if (!scroller) return;
                var chips = Array.prototype.slice.call(
                    scroller.querySelectorAll(".nm-chip"),
                );
                if (!chips.length) return;
                var groups = chips.map(function (c) {
                    return document.querySelector(c.getAttribute("href"));
                });
                var raf = 0;
                function offset() {
                    // Header pill + the sticky chip strip + breathing room.
                    var head =
                        parseFloat(
                            getComputedStyle(document.body).getPropertyValue(
                                "--head-h",
                            ),
                        ) || 86;
                    return head + scroller.offsetHeight + 24;
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
                    // Snap to the last category once scrolled to the bottom.
                    if (
                        window.innerHeight + window.scrollY >=
                        document.documentElement.scrollHeight - 4
                    )
                        idx = groups.length - 1;
                    for (var j = 0; j < chips.length; j++) {
                        var on = j === idx;
                        chips[j].classList.toggle("is-active", on);
                        if (on) chips[j].setAttribute("aria-current", "true");
                        else chips[j].removeAttribute("aria-current");
                    }
                    var active = chips[idx];
                    if (active) {
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
                chips.forEach(function (c) {
                    c.addEventListener("click", function () {
                        setTimeout(update, 60);
                    });
                });
                update();
            })();
        </script>`;

function renderBadge(kind: BadgeKind, label: string): string {
    const meta = BADGE_META[kind];
    const iconHtml = meta.icon
        ? `<i class="${meta.icon}" aria-hidden="true"></i>`
        : "";
    const accent = ACCENT_BADGES.has(kind) ? " nm-tag-acc" : "";
    return `<span class="nm-tag tool-badge${accent}">${iconHtml}${esc(label)}</span>`;
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
        ? `<span class="nm-tag nm-tag-acc">${esc(doc.ui.requiredLabel)}</span>`
        : `<span class="nm-tag">${esc(doc.ui.optionalLabel)}</span>`;
    const desc = descHtml ? `<span>${descHtml}</span>` : "";
    return `<li><span class="nm-kv-k"><code>${param.name}</code>${badge}</span>${desc}</li>`;
}

function renderToolCard(
    tool: ToolIdentity,
    doc: ToolsDoc,
    locale: SiteLocale,
): string {
    const prose = doc.tools[tool.name];
    // The example is quoted in the locale's own marks („…“, 「…」), not
    // English curly quotes — punctuation is part of the translation.
    const [q1, q2] = QUOTES[locale];
    if (!prose) {
        throw new Error(
            `src/copy/tools.ts: TOOLS_COPY is missing prose for tool "${tool.name}"`,
        );
    }
    const meta = CATEGORY_META[tool.category];
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
                    <ul class="nm-kv nm-kv-compact">
                        ${tool.params
                            .map((p) =>
                                renderParam(p, prose.params[p.name] ?? "", doc),
                            )
                            .join("\n                        ")}
                    </ul>
                </div>`;
    const photoHtml =
        tool.hasPhotoHint && prose.photoHint
            ? `
                    <p class="tool-ex-photo"><i class="fa-solid fa-camera" aria-hidden="true"></i><span>${esc(prose.photoHint)}</span></p>`
            : "";
    return `<article class="tool-card" id="${tool.name}" data-reveal>
                <div class="nm-card nm-card-sm">
                <div class="nm-card-top">
                    <span class="nm-tile nm-tile-md ${tint}" aria-hidden="true"><i class="${meta.icon}"></i></span>
                    <span class="tool-badges">${badgesHtml}</span>
                </div>
                <h3><code class="tool-name">${tool.name}</code></h3>
                <p>${esc(prose.description)}</p>${paramsHtml}
                <div class="tool-ex">
                    <div class="nm-say"><span class="nm-say-l">${esc(doc.ui.trySayingLabel)} </span>${q1}${esc(prose.example)}${q2}</div>${photoHtml}
                </div>
                </div>
            </article>`;
}

function renderCategoryChip(id: CategoryId, doc: ToolsDoc): string {
    const meta = CATEGORY_META[id];
    const label = doc.categories[id].pillLabel;
    const count = TOOLS.filter((t) => t.category === id).length;
    return `<a class="nm-chip" href="#${id}"><i class="${meta.icon}" aria-hidden="true"></i>${esc(label)}<span class="nm-chip-n">${count}</span></a>`;
}

// The entrance reveal sits on the small group head and on each card, not
// on the panel: site.js reveals an element once 8% of it is in view, and a
// category panel on a phone runs to several thousand pixels, so it would
// stay invisible for most of a scroll (or, past ~12 viewports tall, for
// good). A card tops out around two phone viewports.
function renderCategorySection(
    id: CategoryId,
    doc: ToolsDoc,
    locale: SiteLocale,
): string {
    const meta = CATEGORY_META[id];
    const cat = doc.categories[id];
    const toolsInCat = TOOLS.filter((t) => t.category === id);
    return `<section class="nm-panel nm-panel-lg tools-group" id="${id}" aria-labelledby="${id}-title">
                    <div class="tools-group-head" data-reveal>
                        <span class="nm-tile nm-tile-lg ${CATEGORY_TINTS[id]}" aria-hidden="true"><i class="${meta.icon}"></i></span>
                        <div>
                            <h2 class="nm-h3" id="${id}-title">${esc(cat.title)}</h2>
                            <p class="nm-body">${esc(cat.description)}</p>
                        </div>
                    </div>
                    <div class="tools-cards">
                        ${toolsInCat.map((t) => renderToolCard(t, doc, locale)).join("\n\n                        ")}
                    </div>
                </section>`;
}

function renderDoc(doc: ToolsDoc, locale: SiteLocale): string {
    const suffix = "/tools";
    const title = `${esc(doc.meta.title)} — Nutrition MCP`;
    const url = `${SITE}${pathFor(locale, suffix)}`;
    const notice = translationNotice(locale, suffix);

    const chips = CATEGORIES.map((id) => renderCategoryChip(id, doc)).join(
        "\n                    ",
    );
    const sections = CATEGORIES.map((id) =>
        renderCategorySection(id, doc, locale),
    ).join("\n\n                ");

    return `<!doctype html>
<html lang="${HTML_LANG[locale]}">
    <head>
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="utf-8" />
        <meta name="description" content="${attr(doc.meta.description)}" />
${localeHead(locale, suffix)}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#f7f7f9" />
        <meta property="og:title" content="${title}" />
        <meta
            property="og:description"
            content="${attr(doc.meta.ogDescription)}"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${url}" />
        <meta property="og:image" content="${SITE}/og.png" />
${HEAD_ASSETS}
${TOOLS_STYLE}
    </head>
    <body class="tools">
${generatedBanner("scripts/gen-tools.ts")}
${THEME_PREPAINT}

        <div class="nm-bg" aria-hidden="true">
            <div class="nm-bg-blob nm-bg-1"></div>
            <div class="nm-bg-blob nm-bg-2"></div>
            <div class="nm-bg-blob nm-bg-3"></div>
            <div class="nm-bg-fade"></div>
        </div>

${nav(locale, suffix, suffix)}

        <main id="main">
            <section class="nm-section nm-page-hero" aria-labelledby="tools-title">
                <p class="nm-pill"><span class="nm-pulse-dot" aria-hidden="true"></span><span>${esc(doc.hero.eyebrow)} · <b>${esc(doc.hero.countBold)}</b> ${esc(doc.hero.countTail)}</span></p>
                <h1 class="nm-h1" id="tools-title">${esc(doc.hero.title)}</h1>
                <p class="nm-lead">${esc(doc.hero.lead)}</p>
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
            <div class="nm-section tools-main">
                <nav class="nm-chips nm-chips-scroll nm-chips-sticky tools-cats" aria-label="${attr(doc.ui.categoriesLabel)}">
                    ${chips}
                </nav>

                <div class="tools-groups">
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
