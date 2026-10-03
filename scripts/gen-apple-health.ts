/**
 * Generates public/apple-health.html and, for every other locale in
 * src/copy/apple-health.ts's APPLE_HEALTH, public/{locale}/apple-health.html:
 * the user-facing setup guide for Apple Health sync (the Nutrition MCP Health
 * iOS Shortcut). The maintainer's build sheet is docs/apple-health-shortcut.md;
 * this page covers only what the user sees and does.
 *
 * Same shape as the other generators (scripts/gen-legal.ts,
 * scripts/gen-alternatives.ts): typed copy in, nav()/footer() from
 * scripts/site-partials.ts around it, every internal link built here with
 * pathFor() so a translated page never links back to English.
 *
 * Re-run after editing src/copy/apple-health*.ts or setting
 * HEALTH_SYNC_SHORTCUT_URL in src/health-sync.ts:
 *   bun run scripts/gen-apple-health.ts
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
import { APPLE_HEALTH, type AppleHealthDoc } from "../src/copy/apple-health.js";
import { TOOLS_COPY } from "../src/copy/tools.js";
import {
    HEALTH_SYNC_FIELDS,
    HEALTH_SYNC_SHORTCUT_NAME,
    HEALTH_SYNC_SHORTCUT_URL,
    type HealthSyncField,
} from "../src/health-sync.js";

const SUFFIX = "/apple-health";
const FILE = "apple-health.html";

/** The build sheet on GitHub, linked from the self-hosting note.
 * scripts/depersonalize.ts removes that note (`ah-selfhost`) on a fork. */
const BUILD_SHEET_URL =
    "https://github.com/akutishevsky/nutrition-mcp/blob/main/docs/apple-health-shortcut.md";

/** The /tools troubleshooting entries the guide links to, in card order. */
const TROUBLESHOOTING = [
    "health-sync-yesterday",
    "health-sync-higher",
    "health-sync-stopped",
] as const;

/** Each nutrient chip's colour role (the widgets' palette). */
const FIELD_TINT: Record<HealthSyncField, string> = {
    energy_kcal: "cal",
    protein_g: "pro",
    carbohydrates_g: "car",
    fat_g: "fat",
    fiber_g: "fib",
    sugar_g: "sug",
    caffeine_mg: "caf",
    water_ml: "wat",
};

/** Section ids (never translated, so /de/apple-health#automate works) with
 * their fixed icon and tint, in page order. */
const SECTIONS = {
    before: { icon: "fa-list-check", tint: "acc" },
    install: { icon: "fa-download", tint: "wat" },
    connect: { icon: "fa-link", tint: "pro" },
    automate: { icon: "fa-wand-magic-sparkles", tint: "cal" },
    everyday: { icon: "fa-arrows-rotate", tint: "car" },
    privacy: { icon: "fa-shield-halved", tint: "fib" },
    troubleshooting: { icon: "fa-life-ring", tint: "fat" },
} as const;
type SectionId = keyof typeof SECTIONS;
const SECTION_IDS = Object.keys(SECTIONS) as SectionId[];

/** Fixed icons for AppleHealthDoc.automate.triggers, by index. */
const TRIGGER_ICONS = [
    { icon: "fa-heart-pulse", tint: "fat" },
    { icon: "fa-bell", tint: "cal" },
    { icon: "fa-plug", tint: "car" },
] as const;

/** Fixed icons for AppleHealthDoc.everyday.cards, by index. */
const EVERYDAY_ICONS = [
    { icon: "fa-plus", tint: "car" },
    { icon: "fa-arrow-down", tint: "fat" },
    { icon: "fa-bars", tint: "pro" },
    { icon: "fa-comment", tint: "wat" },
] as const;

const num = (i: number) => String(i + 1).padStart(2, "0");

// Page CSS. Tokens (--bg, --panel, --ink2, --acc-txt …), fonts, the blobs,
// header and footer come from public/styles.css + nav()/footer(); type,
// cards, tiles, chips, pills, tags and buttons are the shared .nm-*
// primitives. Colours are tokens only, so dark mode needs nothing here.
const AH_STYLE = `        <style>
            main.ah-main {
                position: relative;
                z-index: 1;
                overflow-x: clip;
            }
            .ah-wrap {
                box-sizing: content-box;
                max-width: var(--container);
                margin: 0 auto;
                padding: 0 var(--gutter);
            }

            /* Hero: text beside the "what you'll see" card */
            .ah-hero {
                padding-top: clamp(32px, 5vw, 72px);
                padding-bottom: clamp(24px, 4vw, 44px);
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 28px clamp(32px, 5vw, 64px);
            }
            .ah-hero-text {
                flex: 1 1 440px;
                min-width: 0;
            }
            .ah-hero .nm-pill {
                margin: 0 0 22px;
                max-width: 100%;
                box-sizing: border-box;
                animation: nm-rise 0.6s both;
            }
            .ah-hero .nm-pill i {
                color: var(--fat-icon);
            }
            .ah-hero .nm-h1 {
                max-width: 14ch;
                animation: nm-rise 0.6s 0.08s both;
            }
            .ah-hero .nm-lead {
                margin-top: 20px;
                animation: nm-rise 0.6s 0.16s both;
            }
            .ah-see {
                flex: 1 1 340px;
                min-width: 0;
                box-sizing: border-box;
                padding: clamp(20px, 3vw, 30px);
                animation: nm-rise 0.6s 0.2s both;
            }
            .ah-see h2 {
                margin: 0 0 14px;
                font-size: 19px;
                font-weight: 800;
                letter-spacing: -0.02em;
            }
            .ah-see .nm-label-mono {
                display: block;
                margin: 18px 0 10px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
            }
            .ah-chips {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin: 0;
                padding: 0;
                list-style: none;
            }
            .ah-chip {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                min-height: 32px;
                padding: 4px 12px;
                box-sizing: border-box;
                border-radius: 999px;
                background: var(--bg);
                border: 1px solid var(--line);
                font-size: 14px;
                font-weight: 600;
                color: var(--ink);
            }
            .ah-chip small {
                font-size: 12px;
                font-weight: 500;
                color: var(--ink3);
            }
            .ah-alcohol {
                margin: 12px 0 0;
                font-size: 14px;
                color: var(--ink3);
            }

            /* Bulleted lists (hero card, before, privacy) */
            .ah-list {
                margin: 0;
                padding: 0;
                list-style: none;
                display: grid;
                gap: 10px;
            }
            .ah-list li {
                display: grid;
                grid-template-columns: 10px minmax(0, 1fr);
                gap: 12px;
                font-size: 16px;
                line-height: 1.6;
                color: var(--ink2);
                text-wrap: pretty;
            }
            .ah-list li::before {
                content: "";
                width: 7px;
                height: 7px;
                margin-top: 10px;
                border-radius: 50%;
                background: var(--acc);
            }
            .ah-main strong {
                color: var(--ink);
                font-weight: 700;
            }
            .ah-main code {
                font-family: var(--mono);
                font-size: 0.88em;
                color: var(--ink);
                background: var(--bg2);
                padding: 2px 6px;
                border-radius: 6px;
            }

            /* In-page section links */
            .ah-toc {
                display: flex;
                gap: 8px;
                overflow-x: auto;
                scrollbar-width: none;
                padding-bottom: clamp(20px, 3vw, 32px);
            }
            .ah-toc::-webkit-scrollbar {
                display: none;
            }
            .ah-toc .nm-chip {
                flex: none;
                text-decoration: none;
            }

            /* Sections */
            .ah-body {
                display: grid;
                gap: clamp(16px, 2.4vw, 24px);
                padding-bottom: var(--section-pad);
            }
            .ah-sec {
                scroll-margin-top: 20px;
                padding: clamp(22px, 4vw, 44px);
                display: grid;
                gap: 20px;
                min-width: 0;
            }
            .ah-sec-head {
                display: flex;
                align-items: center;
                gap: 16px;
            }
            .ah-num {
                display: block;
                margin-bottom: 4px;
                font-family: var(--mono);
                font-size: 12.5px;
                font-weight: 500;
                color: var(--acc-txt);
            }
            .ah-sec h2 {
                margin: 0;
                font-weight: 800;
                font-size: clamp(24px, 2.8vw, 34px);
                line-height: 1.1;
                letter-spacing: -0.03em;
                text-wrap: balance;
            }
            .ah-label {
                margin: 4px 0 0;
                font-family: var(--mono);
                font-size: 12px;
                font-weight: 500;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: var(--ink3);
            }
            .ah-p {
                margin: 0;
                max-width: 68ch;
                font-size: 16.5px;
                line-height: 1.65;
                color: var(--ink2);
                text-wrap: pretty;
            }
            .ah-note {
                margin: 0;
                padding: 14px 18px;
                border-radius: 18px;
                background: var(--bg2);
                font-size: 15px;
                line-height: 1.6;
                color: var(--ink2);
                text-wrap: pretty;
            }

            /* Numbered steps */
            .ah-steps {
                margin: 0;
                padding: 0;
                list-style: none;
                display: grid;
                gap: 8px;
            }
            .ah-steps li {
                display: grid;
                grid-template-columns: 36px minmax(0, 1fr);
                gap: 14px;
                align-items: start;
                padding: 14px 16px 14px 14px;
                background: var(--bg);
                border: 1px solid var(--line);
                border-radius: 20px;
                font-size: 16px;
                line-height: 1.55;
                color: var(--ink2);
                text-wrap: pretty;
            }
            .ah-step-n {
                width: 36px;
                height: 36px;
                margin-top: -5px;
                border-radius: 50%;
                background: var(--ink);
                color: var(--bg);
                display: grid;
                place-items: center;
                font-family: var(--mono);
                font-size: 13px;
                font-weight: 600;
            }
            .ah-steps li:last-child .ah-step-n {
                background: var(--acc);
                color: var(--acc-ink);
            }

            /* Install */
            .ah-install {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 14px 20px;
            }
            .ah-shortcut {
                display: inline-flex;
                align-items: center;
                gap: 12px;
                max-width: 100%;
                box-sizing: border-box;
                padding: 10px 18px 10px 10px;
                border-radius: 20px;
                background: linear-gradient(
                    135deg,
                    color-mix(in srgb, var(--fat) 18%, var(--panel)),
                    color-mix(in srgb, var(--cal) 14%, var(--panel))
                );
                border: 1px solid var(--line);
                font-weight: 700;
                color: var(--ink);
            }
            .ah-shortcut .nm-tile {
                background: var(--fat-icon);
                color: var(--on-icon);
            }
            .ah-pending {
                display: inline-flex;
                align-items: center;
                gap: 10px;
                margin: 0;
                padding: 10px 16px;
                border-radius: 999px;
                border: 1px dashed var(--line2);
                font-size: 15px;
                font-weight: 600;
                color: var(--ink2);
            }

            /* Cards inside a section (triggers, everyday, troubleshooting) */
            .ah-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
                gap: 12px;
            }
            .ah-mini {
                display: grid;
                align-content: start;
                gap: 10px;
                padding: 18px;
                background: var(--bg);
                border: 1px solid var(--line);
                border-radius: 22px;
                min-width: 0;
            }
            .ah-mini-top {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
            }
            .ah-mini-title {
                margin: 0;
                font-size: 17px;
                font-weight: 700;
                line-height: 1.3;
                color: var(--ink);
                overflow-wrap: anywhere;
            }
            .ah-mini p {
                margin: 0;
                font-size: 15px;
                line-height: 1.6;
                color: var(--ink2);
                text-wrap: pretty;
            }
            a.ah-mini {
                text-decoration: none;
                transition:
                    border-color 0.2s,
                    transform 0.2s;
            }
            a.ah-mini:hover {
                border-color: var(--line2);
                transform: translateY(-2px);
            }
            .ah-more {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-size: 14.5px;
                font-weight: 700;
                color: var(--acc-txt);
            }
            .ah-more i {
                font-size: 12px;
            }
            .ah-selfhost {
                margin: 0;
                font-size: 14.5px;
                color: var(--ink3);
                text-align: center;
            }
            .ah-selfhost a {
                color: var(--acc-txt);
                font-weight: 700;
                text-decoration: underline;
                text-underline-offset: 3px;
            }
            @media (max-width: 559px) {
                .ah-sec-head .nm-tile {
                    display: none;
                }
            }
        </style>`;

function list(items: string[], indent: string): string {
    return `${indent}<ul class="ah-list">
${items.map((i) => `${indent}    <li><span>${i}</span></li>`).join("\n")}
${indent}</ul>`;
}

function steps(items: string[], indent: string): string {
    return `${indent}<ol class="ah-steps">
${items
    .map(
        (s, i) =>
            `${indent}    <li><span class="ah-step-n" aria-hidden="true">${i + 1}</span><span>${s}</span></li>`,
    )
    .join("\n")}
${indent}</ol>`;
}

function tile(icon: string, tint: string, md = false): string {
    return `<span class="nm-tile${md ? " nm-tile-md" : ""} nm-c-${tint}" aria-hidden="true"><i class="fa-solid ${icon}"></i></span>`;
}

/** Section titles in page order — the TOC and the section headings agree. */
function titles(doc: AppleHealthDoc): Record<SectionId, string> {
    return {
        before: doc.before.title,
        install: doc.install.title,
        connect: doc.connect.title,
        automate: doc.automate.title,
        everyday: doc.everyday.title,
        privacy: doc.privacy.title,
        troubleshooting: doc.troubleshooting.title,
    };
}

function section(id: SectionId, title: string, body: string): string {
    const i = SECTION_IDS.indexOf(id);
    const { icon, tint } = SECTIONS[id];
    return `                <section class="nm-card ah-sec" id="${id}" aria-labelledby="${id}-title">
                    <div class="ah-sec-head">
                        ${tile(icon, tint)}
                        <div>
                            <span class="ah-num" aria-hidden="true">${num(i)}</span>
                            <h2 id="${id}-title">${esc(title)}</h2>
                        </div>
                    </div>
${body}
                </section>`;
}

function renderPage(doc: AppleHealthDoc, locale: SiteLocale): string {
    const url = `${SITE}${pathFor(locale, SUFFIX)}`;
    const title = `${esc(doc.meta.title)} — Nutrition MCP`;
    const t = titles(doc);
    const I = "                    ";
    const tools = TOOLS_COPY[locale] ?? TOOLS_COPY.en!;

    const chips = HEALTH_SYNC_FIELDS.map((f) => {
        const note =
            f === "water_ml"
                ? ` <small>(${esc(doc.hero.waterNote)})</small>`
                : "";
        return `                        <li class="ah-chip"><span class="nm-dot nm-c-${FIELD_TINT[f]}" aria-hidden="true"></span>${esc(doc.hero.nutrients[f])}${note}</li>`;
    }).join("\n");

    const toc = SECTION_IDS.map(
        (id, i) =>
            `                <a class="nm-chip" href="#${id}"><span class="nm-chip-n">${num(i)}</span>${esc(t[id])}</a>`,
    ).join("\n");

    const install = HEALTH_SYNC_SHORTCUT_URL
        ? `<a class="nm-btn nm-btn-acc nm-btn-fw" href="${esc(HEALTH_SYNC_SHORTCUT_URL)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-download" aria-hidden="true"></i>${esc(doc.install.button)}</a>`
        : `<p class="ah-pending" role="note"><span class="nm-pulse-dot" aria-hidden="true"></span>${esc(doc.install.pending)}</p>`;

    const triggers = doc.automate.triggers
        .map(
            (tr, i) => `${I}    <div class="ah-mini">
${I}        <div class="ah-mini-top">${tile(TRIGGER_ICONS[i]!.icon, TRIGGER_ICONS[i]!.tint, true)}<span class="nm-tag${i === 0 ? " nm-tag-acc" : ""}">${esc(tr.tag)}</span></div>
${I}        <h4 class="ah-mini-title">${esc(tr.when)}</h4>
${I}        <p>${tr.body}</p>
${I}    </div>`,
        )
        .join("\n");

    const everyday = doc.everyday.cards
        .map(
            (c, i) => `${I}    <div class="ah-mini">
${I}        ${tile(EVERYDAY_ICONS[i]!.icon, EVERYDAY_ICONS[i]!.tint, true)}
${I}        <h3 class="ah-mini-title">${esc(c.title)}</h3>
${I}        <p>${c.body}</p>
${I}    </div>`,
        )
        .join("\n");

    const troubleshooting = TROUBLESHOOTING.map(
        (
            id,
        ) => `${I}    <a class="ah-mini" href="${pathFor(locale, "/tools")}#${id}">
${I}        <span class="ah-mini-title">${esc(tools.troubleshooting.items[id].question)}</span>
${I}        <span class="ah-more">${esc(doc.troubleshooting.readMore)}<i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
${I}    </a>`,
    ).join("\n");

    const selfHost = doc.selfHost.textHtml.replace(
        "{link}",
        `<a href="${BUILD_SHEET_URL}" target="_blank" rel="noopener noreferrer">${esc(doc.selfHost.linkText)}</a>`,
    );

    const notice = translationNotice(locale, SUFFIX);

    const sections = [
        section("before", t.before, list(doc.before.items, I)),
        section(
            "install",
            t.install,
            `${I}<p class="ah-p">${HEALTH_SYNC_SHORTCUT_URL ? doc.install.lead : doc.install.leadPending}</p>
${I}<div class="ah-install">
${I}    <span class="ah-shortcut">${tile("fa-heart-pulse", "fat", true)}${esc(HEALTH_SYNC_SHORTCUT_NAME)}</span>
${I}    ${install}
${I}</div>
${I}<p class="ah-note">${doc.install.nameNote}</p>`,
        ),
        section(
            "connect",
            t.connect,
            `${steps(doc.connect.steps, I)}
${I}<p class="ah-note">${doc.connect.note}</p>`,
        ),
        section(
            "automate",
            t.automate,
            `${I}<p class="ah-p">${doc.automate.lead}</p>
${I}<h3 class="ah-label">${esc(doc.automate.triggersLabel)}</h3>
${I}<div class="ah-grid">
${triggers}
${I}</div>
${I}<h3 class="ah-label">${esc(doc.automate.stepsLabel)}</h3>
${steps(doc.automate.steps, I)}
${I}<p class="ah-note">${doc.automate.note}</p>`,
        ),
        section(
            "everyday",
            t.everyday,
            `${I}<div class="ah-grid">
${everyday}
${I}</div>`,
        ),
        section(
            "privacy",
            t.privacy,
            `${list(doc.privacy.items, I)}
${I}<p class="ah-p"><a class="nm-link" href="${pathFor(locale, "/privacy")}">${esc(doc.privacy.policyLink)}</a></p>`,
        ),
        section(
            "troubleshooting",
            t.troubleshooting,
            `${I}<p class="ah-p">${esc(doc.troubleshooting.lead)}</p>
${I}<div class="ah-grid">
${troubleshooting}
${I}</div>`,
        ),
    ].join("\n\n");

    return `<!doctype html>
<html lang="${HTML_LANG[locale]}">
    <head>
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="utf-8" />
        <meta name="description" content="${esc(doc.meta.description)}" />
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${esc(doc.meta.ogDescription)}" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="${url}" />
${OG_IMAGE_META}
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${esc(doc.meta.ogDescription)}" />
${localeHead(locale, SUFFIX)}
${ICON_LINKS}
        <meta name="theme-color" content="${THEME_COLOR_LIGHT}" />
${HEAD_ASSETS}
${AH_STYLE}
    </head>
    <body class="ah">
${generatedBanner("scripts/gen-apple-health.ts")}
${EMAIL_OFF_OPEN}
${THEME_PREPAINT}

${nav(locale, SUFFIX)}

        <main id="main" class="ah-main">
            <section class="ah-wrap ah-hero" aria-labelledby="ah-title">
                <div class="ah-hero-text">
                    <p class="nm-pill"><i class="fa-solid fa-heart-pulse" aria-hidden="true"></i>${esc(doc.hero.eyebrow)}</p>
                    <h1 class="nm-h1" id="ah-title">${esc(doc.hero.title)}</h1>
                    <p class="nm-lead">${esc(doc.hero.lead)}</p>
                </div>
                <aside class="nm-card ah-see" aria-labelledby="ah-see-title">
                    <h2 id="ah-see-title">${esc(doc.hero.seeTitle)}</h2>
${list(doc.hero.seeItems, I)}
                    <span class="nm-label-mono" id="ah-nutrients">${esc(doc.hero.nutrientsLabel)}</span>
                    <ul class="ah-chips" aria-labelledby="ah-nutrients">
${chips}
                    </ul>
                    <p class="ah-alcohol">${esc(doc.hero.alcoholNote)}</p>
                </aside>
            </section>
${notice ? `\n            <div class="translation-notice-band">\n${notice}\n            </div>\n` : ""}
            <nav class="ah-wrap ah-toc" aria-label="${esc(doc.tocLabel)}">
${toc}
            </nav>

            <div class="ah-wrap ah-body">
${sections}

                <p class="ah-selfhost">${selfHost}</p>
            </div>
        </main>

${footer(locale, SUFFIX)}

${SITE_SCRIPT}
${EMAIL_OFF_CLOSE}
    </body>
</html>
`;
}

for (const [locale, doc] of Object.entries(APPLE_HEALTH) as [
    SiteLocale,
    AppleHealthDoc,
][]) {
    const file =
        locale === "en" ? `./public/${FILE}` : `./public/${locale}/${FILE}`;
    await Bun.write(file, renderPage(doc, locale));
    console.log(`wrote ${file}`);
}
