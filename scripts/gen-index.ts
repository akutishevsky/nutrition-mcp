/**
 * Generates public/index.html (the landing page) and its translated
 * counterparts under public/{locale}/ from the typed data in
 * src/copy/index.ts. Shares nav()/footer() and the page shell with every
 * other generator (scripts/site-partials.ts).
 *
 * Page-only pieces live beside it: scripts/landing-css.ts (the page's own
 * layout CSS, inlined in <head>), scripts/landing-cards.ts (the demo widget
 * cards and the drawn photos) and scripts/landing-script.js (the page's
 * behaviour, inlined verbatim as LANDING_SCRIPT).
 *
 * Re-run after editing any of them or src/copy/index.ts:
 *   bun run scripts/gen-index.ts
 * The generated .html files are the served artifacts — don't hand-edit them.
 */

import { HTML_LANG, pathFor, urlFor, type SiteLocale } from "../src/routes.js";
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
    THEME_COLOR_LIGHT,
    EMAIL_OFF_OPEN,
    EMAIL_OFF_CLOSE,
    ICON_LINKS,
    OG_IMAGE_META,
} from "./site-partials.js";
import {
    INDEX,
    type ExampleMessage,
    type ExampleSlide,
    type ExampleSlideId,
    type FaqEntry,
    type HeroExchange,
    type IndexDoc,
} from "../src/copy/index.js";
import {
    borschtSvg,
    packageSvg,
    renderCard,
    smoothieSvg,
    type DemoCardId,
} from "./landing-cards.js";
import { LANDING_CSS } from "./landing-css.js";

// The landing page's behaviour: hero replay, examples carousel, live stats
// (odometers, deltas, Metric/Imperial, the world map), the GitHub star count
// and the Patreon posts. Kept in its own .js file so it is ordinary,
// prettier-formatted JavaScript rather than a hand-escaped string; it holds
// no copy (every word it shows is read out of the markup).
//
// Exported for src/landing-script.test.ts, which pins the ten generated
// pages against THIS constant. scripts/depersonalize.ts matches its
// "live GitHub star count" and "recent Patreon posts" blocks by their
// comment lines and closing `.catch(function () {});\n    }` — keep both
// shapes.
export const LANDING_SCRIPT: string = await Bun.file(
    new URL("./landing-script.js", import.meta.url),
).text();

// The Claude connectors directory listing — the install tab's button.
const CLAUDE_DIRECTORY_URL = "https://claude.ai/directory/nutrition-mcp";
const SERVER_URL = "https://nutrition-mcp.com/mcp";
const REPO_URL = "https://github.com/akutishevsky/nutrition-mcp";
const PATREON_URL =
    "https://patreon.com/akutishevskyi?utm_medium=unknown&amp;utm_source=join_link&amp;utm_campaign=creatorshare_creator&amp;utm_content=copyLink";
const CONTACT_EMAIL = "anton@nutrition-mcp.com";

// ---------------------------------------------------------------- helpers

// src/copy/index.ts's `why.noteHtml` and `faq[].visibleHtml` carry plain
// href="/alternatives" data-link="alternatives" (or /privacy, /terms)
// markers, because the content string has no access to `locale` — this
// rewrites each to the locale-correct path. Without it a translated landing
// page would link to the English comparison hub or policy.
function localizeLinks(html: string, locale: SiteLocale): string {
    return html.replace(
        /href="\/(alternatives|privacy|terms)" data-link="\1"/g,
        (_m, page: string) =>
            `class="nm-link" href="${pathFor(locale, `/${page}`)}"`,
    );
}

function stripTags(html: string): string {
    return html
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function faqJsonLdText(entry: FaqEntry): string {
    return entry.jsonLdText ?? stripTags(entry.visibleHtml);
}

/** Escaped text with the server URL set as <code>. */
function withUrlCode(text: string): string {
    return esc(text).replace(SERVER_URL, `<code>${SERVER_URL}</code>`);
}

const fill = (s: string, vars: Record<string, string>): string =>
    s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? vars[k]! : m));

const pad2 = (n: number): string => String(n).padStart(2, "0");

/** A colour-role tile (`nm-tile`) holding one Font Awesome icon. */
function tile(icon: string, extra = ""): string {
    return `<span class="nm-tile${extra}" aria-hidden="true"><i class="${icon}"></i></span>`;
}

// ------------------------------------------------------------- structure

const HOW_META = [
    { icon: "fa-solid fa-plug", c: "acc" },
    { icon: "fa-solid fa-comment-dots", c: "cal" },
    { icon: "fa-solid fa-chart-area", c: "pro" },
];
const ONBOARDING_META = [
    { icon: "fa-solid fa-clock", c: "wat" },
    { icon: "fa-solid fa-bullseye", c: "pro" },
    { icon: "fa-solid fa-language", c: "car" },
    { icon: "fa-solid fa-utensils", c: "cal" },
];
const FEATURE_META = [
    { icon: "fa-solid fa-comment-dots", c: "cal" },
    { icon: "fa-solid fa-barcode", c: "car" },
    { icon: "fa-solid fa-bullseye", c: "pro" },
    { icon: "fa-solid fa-chart-line", c: "fat" },
    { icon: "fa-solid fa-glass-water", c: "wat" },
    { icon: "fa-solid fa-weight-scale", c: "fib" },
    { icon: "fa-solid fa-earth-americas", c: "wat" },
    { icon: "fa-solid fa-file-import", c: "sug" },
    { icon: "fa-solid fa-file-zipper", c: "acc" },
];
const TRUST_ICONS = [
    "fa-solid fa-lock",
    "fa-brands fa-github",
    "fa-solid fa-file-csv",
    "fa-solid fa-trash-can",
];

/** Each example slide's icon, colour and the MCP tools its conversation
 * calls, in chip order (the first is the slide's main tool). Structure, not
 * copy: written once for every locale. */
/** A colour role (a token name in public/styles.css: acc, cal, pro, car,
 * fat, wat, fib, sug, caf, gold) as the inline custom properties the tiles
 * read: --c for fills and tints, --c-icon for the glyph drawn on them (the
 * contrast-safe *-icon token; the accent's own fill already is one). */
const roleVar = (k: string) => `var(--${k})`;
const roleIconVar = (k: string) =>
    k === "acc" ? "var(--acc)" : `var(--${k}-icon)`;
const roleStyle = (k: string) => `--c:${roleVar(k)};--c-icon:${roleIconVar(k)}`;

const EX_META: Record<
    ExampleSlideId,
    { icon: string; color: string; tools: string[] }
> = {
    "log-meal": {
        icon: "fa-solid fa-comment-dots",
        color: "cal",
        tools: ["log_meal", "log_water", "get_current_time"],
    },
    "photo-meal": {
        icon: "fa-solid fa-camera",
        color: "fat",
        tools: ["search_meals", "log_meal"],
    },
    "scan-barcode": {
        icon: "fa-solid fa-barcode",
        color: "car",
        tools: ["lookup_barcode", "log_meal"],
    },
    "goals-progress": {
        icon: "fa-solid fa-bullseye",
        color: "acc",
        tools: ["set_nutrition_goals", "get_goal_progress"],
    },
    "review-week": {
        icon: "fa-solid fa-chart-area",
        color: "pro",
        tools: ["get_trends"],
    },
    "weight-trend": {
        icon: "fa-solid fa-weight-scale",
        color: "wat",
        tools: [
            "log_weight",
            "get_weight_trends",
            "log_body_measurement",
            "get_body_measurements",
        ],
    },
    "meal-patterns": {
        icon: "fa-solid fa-magnifying-glass-chart",
        color: "fib",
        tools: ["get_meal_patterns"],
    },
    "track-drinks": {
        icon: "fa-solid fa-beer-mug-empty",
        color: "gold",
        tools: ["set_alcohol_tracking", "log_meal"],
    },
    "import-history": {
        icon: "fa-solid fa-file-import",
        color: "caf",
        tools: [
            "get_profile",
            "set_timezone",
            "start_meal_import",
            "bulk_import_meals",
        ],
    },
    "export-data": {
        icon: "fa-solid fa-box-archive",
        color: "sug",
        tools: ["export_all_data"],
    },
};
const EX_ORDER = Object.keys(EX_META) as ExampleSlideId[];

/** Which demo card each slide's widget is (its figures live in
 * scripts/landing-cards.ts). */
const EX_CARD: Partial<Record<ExampleSlideId, DemoCardId>> = {
    "log-meal": "log-meal",
    "photo-meal": "photo-meal",
    "scan-barcode": "scan-barcode",
    "goals-progress": "goals-progress",
    "review-week": "review-week",
    "weight-trend": "weight-trend",
    "track-drinks": "track-drinks",
    "import-history": "import-file",
};

/** The live-stats tiles, in grid order (the first spans two columns). */
const STAT_TILES: {
    key: string;
    icon: string;
    c: string;
    label: (s: IndexDoc["stats"]) => string;
    unit: string;
}[] = [
    {
        key: "total_calories",
        icon: "fa-solid fa-fire",
        c: "cal",
        label: (s) => s.calCaption,
        unit: "kcal",
    },
    {
        key: "food_logs",
        icon: "fa-solid fa-utensils",
        c: "cal",
        label: (s) => s.cards.foodLogs,
        unit: "",
    },
    {
        key: "total_protein_g",
        icon: "fa-solid fa-dumbbell",
        c: "pro",
        label: (s) => s.cards.protein,
        unit: "kg",
    },
    {
        key: "total_carbs_g",
        icon: "fa-solid fa-wheat-awn",
        c: "car",
        label: (s) => s.cards.carbs,
        unit: "kg",
    },
    {
        key: "total_fat_g",
        icon: "fa-solid fa-bottle-droplet",
        c: "gold",
        label: (s) => s.cards.fat,
        unit: "kg",
    },
    {
        key: "weight_lost_g",
        icon: "fa-solid fa-weight-scale",
        c: "fib",
        label: (s) => s.cards.weightLost,
        unit: "kg",
    },
    {
        key: "total_water_ml",
        icon: "fa-solid fa-glass-water",
        c: "wat",
        label: (s) => s.cards.water,
        unit: "L",
    },
];

/** Every locale has to tell the same ten stories in the same shape — the
 * icons, tools and cards above are keyed by id and drawn by index. */
function assertExamples(doc: IndexDoc, locale: SiteLocale): void {
    const ids = doc.examples.slides.map((s) => s.id);
    if (ids.join() !== EX_ORDER.join())
        throw new Error(`${locale}: example slide ids ${ids.join()}`);
    for (const s of doc.examples.slides) {
        const want = EX_META[s.id].tools;
        const have = Object.keys(s.toolNotes);
        if (
            have.length !== want.length ||
            want.some((t) => !s.toolNotes[t]?.trim())
        )
            throw new Error(
                `${locale}: ${s.id} toolNotes must be exactly ${want.join(", ")}`,
            );
        // A host renders a widget at its tool call, so a card sits between
        // the user turn that asked and the ai reply that reads the result.
        for (const c of s.cards ?? [])
            if (
                s.messages[c.after]?.from !== "user" ||
                s.messages[c.after + 1]?.from !== "ai"
            )
                throw new Error(
                    `${locale}: ${s.id} card must follow a user turn and precede an ai reply (after: ${c.after})`,
                );
    }
}

// ---------------------------------------------------------------- hero

function heroThread(doc: IndexDoc, locale: SiteLocale): string {
    const out: string[] = [];
    const cardFor = (ex: HeroExchange): string => {
        switch (ex.card) {
            case "meal-logged":
                return renderCard(
                    "hero-meal",
                    locale,
                    ex.meal?.description ?? "",
                );
            case "nutrition-summary":
                return renderCard(
                    "hero-day",
                    locale,
                    "",
                    doc.hero.chat.exchanges.flatMap((e) =>
                        e.meal ? [e.meal] : [],
                    ),
                );
            case "weight-trends":
                return renderCard("hero-weight", locale);
            default:
                return "";
        }
    };
    for (const ex of doc.hero.chat.exchanges) {
        if (ex.photo) {
            out.push(
                `<div class="lp-msg-photo" data-kind="photo"><div role="img" aria-label="${esc(doc.hero.chat.photoAlt)}">${smoothieSvg()}</div><p>${esc(ex.userText)}</p></div>`,
            );
        } else {
            out.push(
                `<div class="lp-msg-u" data-kind="user">${esc(ex.userText)}</div>`,
            );
        }
        // The widget lands where the host draws it: under the turn whose tool
        // call produced it, above the assistant's reply (as in the examples).
        if (ex.card)
            out.push(
                `<div class="lp-card-slot" data-kind="card">${cardFor(ex)}</div>`,
            );
        out.push(
            `<div class="lp-msg-a" data-kind="ai">${esc(ex.aiText)}</div>`,
        );
    }
    return out.map((m) => `                            ${m}`).join("\n");
}

function renderHero(doc: IndexDoc, locale: SiteLocale): string {
    const h = doc.hero;
    return `            <section class="lp-hero" id="top">
                <div>
                    <h1 class="nm-h1">${esc(h.titleBeforeEm)}<em>${esc(h.titleEm)}</em>${esc(h.titleAfterEm)}</h1>
                    <p class="lp-lead">${esc(h.lead)}</p>
                    <div class="lp-ctas">
                        <a class="nm-btn nm-btn-acc" href="#install">${esc(h.ctaPrimary)} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
                        <a class="lp-support-btn" href="#support"><i class="fa-brands fa-patreon" aria-hidden="true"></i>${esc(h.ctaSecondary)}</a>
                    </div>
                </div>
                <div class="lp-demo">
                    <div class="lp-chatframe">
                        <div class="lp-chat">
                            <span class="lp-chat-ctl">
                                <button type="button" data-hero-pause aria-label="${esc(h.chat.pauseLabel)}" aria-pressed="false" hidden><i class="fa-solid fa-pause" aria-hidden="true"></i></button>
                                <button type="button" data-hero-replay aria-label="${esc(h.chat.replayLabel)}" hidden><i class="fa-solid fa-rotate-right" aria-hidden="true"></i></button>
                            </span>
                            <div class="lp-thread" id="hero-thread" role="region" aria-label="${esc(doc.examples.threadLabel)}" aria-live="off" tabindex="0">
${heroThread(doc, locale)}
                            </div>
                        </div>
                    </div>
                    <a class="lp-more" href="#try">${esc(h.moreExamples)}<i class="fa-solid fa-arrow-down" aria-hidden="true"></i></a>
                </div>
            </section>`;
}

// ------------------------------------------------------------- sections

function renderHow(doc: IndexDoc): string {
    const cards = doc.how.steps
        .map((s, i) => {
            const m = HOW_META[i]!;
            return `                    <div class="nm-card lp-how-card lp-hover-lift nm-c-${m.c}">
                        <span class="nm-blob" aria-hidden="true"></span>
                        <div class="lp-how-top">${tile(m.icon)}<span class="nm-label-mono">${esc(fill(doc.how.counter, { n: String(i + 1) }))}</span></div>
                        <div><h3 class="lp-how-h">${esc(s.title)}</h3><p>${esc(s.body)}</p></div>
                    </div>`;
        })
        .join("\n");
    return `            <section class="nm-section lp-sec" id="how">
                <h2 class="nm-h2 lp-mb">${esc(doc.how.title)}</h2>
                <div class="lp-how-grid">
${cards}
                </div>
            </section>`;
}

function renderInstall(doc: IndexDoc): string {
    const i = doc.install;
    const steps = (list: string[]) =>
        list
            .map(
                (s) =>
                    `                                <li><span>${s}</span></li>`,
            )
            .join("\n");
    return `            <section class="nm-section lp-sec" id="install">
                <div class="lp-install">
                    <div class="lp-sticky">
                        <h2 class="nm-h2">${esc(i.title)}</h2>
                        <p class="nm-sub">${esc(i.sub)}</p>
                        <div class="lp-url"><span>${SERVER_URL}</span><button class="nm-icon-btn copy-mini" type="button" data-copy="${SERVER_URL}" aria-label="${esc(i.copyAriaLabel)}"><i class="fa-regular fa-copy" aria-hidden="true"></i></button></div>
                    </div>
                    <div class="nm-card lp-tabcard">
                        <fieldset>
                            <legend class="vh">${esc(i.tabsLabel)}</legend>
                            <input type="radio" name="itab" id="itab-claude" class="lp-tab-input" checked />
                            <input type="radio" name="itab" id="itab-chatgpt" class="lp-tab-input" />
                            <input type="radio" name="itab" id="itab-other" class="lp-tab-input" />
                            <div class="lp-seg">
                                <label for="itab-claude"><i class="fa-brands fa-claude" aria-hidden="true"></i>Claude</label>
                                <label for="itab-chatgpt"><i class="fa-brands fa-openai" aria-hidden="true"></i>ChatGPT</label>
                                <label for="itab-other"><i class="fa-solid fa-terminal" aria-hidden="true"></i>${esc(i.otherTabLabel)}</label>
                            </div>
                            <div class="lp-panel lp-panel-claude">
                                <a class="lp-claude-btn" href="${CLAUDE_DIRECTORY_URL}" target="_blank" rel="noopener"><i class="fa-brands fa-claude" aria-hidden="true"></i>${esc(i.claude.cta)}<i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>
                                <ol class="lp-steps">
${steps(i.claude.steps)}
                                </ol>
                                <p class="lp-panel-note">${withUrlCode(i.claude.note)}</p>
                            </div>
                            <div class="lp-panel lp-panel-chatgpt">
                                <ol class="lp-steps">
${steps(i.chatgpt.steps)}
                                </ol>
                            </div>
                            <div class="lp-panel lp-panel-other">
                                <!-- prettier-ignore -->
                                <pre>{
  "mcpServers": {
    "nutrition": {
      "url": "${SERVER_URL}"
    }
  }
}</pre>
                                <p class="lp-panel-note">${i.other.note}</p>
                            </div>
                        </fieldset>
                    </div>
                </div>
            </section>`;
}

function renderOnboarding(doc: IndexDoc, locale: SiteLocale): string {
    const o = doc.onboarding;
    const cards = o.steps
        .map((s, i) => {
            const m = ONBOARDING_META[i]!;
            return `                    <li class="nm-card nm-c-${m.c}">
                        <span class="lp-onb-top">${tile(m.icon, " nm-tile-md")}<span class="nm-label-mono">${pad2(i + 1)}</span></span>
                        <p><b>${esc(s.title)}</b> — ${esc(s.body)}</p>
                        <div class="lp-say"><span>${esc(o.justSay)}</span><q>${esc(s.say)}</q></div>
                    </li>`;
        })
        .join("\n");
    return `            <section class="nm-section lp-sec" id="onboarding">
                <div class="lp-head">
                    <h2 class="nm-h2 lp-onb-h2">${esc(o.title)}</h2>
                    <p>${esc(o.sub)}</p>
                </div>
                <ol class="lp-onb">
${cards}
                </ol>
                <p class="lp-note">${esc(o.note)}</p>
                <a class="lp-tools-cta" href="${pathFor(locale, "/tools")}">
                    <span aria-hidden="true"><i class="fa-solid fa-toolbox"></i></span>
                    <span class="lp-tools-text"><b>${esc(o.toolsCta.heading)}</b>${esc(o.toolsCta.body)}</span>
                    <span class="lp-tools-go">${esc(o.toolsCta.arrow)} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
                </a>
            </section>`;
}

// -------------------------------------------------------------- examples

function exampleMessage(m: ExampleMessage, doc: IndexDoc): string {
    const e = doc.examples;
    if (m.from === "user" && m.photo) {
        const svg = m.photo === "meal" ? borschtSvg() : packageSvg();
        const alt = m.photo === "meal" ? e.photoMealAlt : e.photoPackageAlt;
        return `<div class="lp-msg-photo"><div role="img" aria-label="${esc(alt)}">${svg}</div>${m.text ? `<p>${esc(m.text)}</p>` : ""}</div>`;
    }
    if (m.from === "user") return `<div class="lp-msg-u">${esc(m.text)}</div>`;
    // A link the reply passes on (export_all_data's download URL) is part of
    // the reply's text, as a host renders it — not a file card under it.
    const link = m.link
        ? `<span class="lp-msg-link">${esc(m.link)}</span>`
        : "";
    return `<div class="lp-msg-a">${esc(m.text)}${link}</div>`;
}

function exampleThread(
    s: ExampleSlide,
    doc: IndexDoc,
    locale: SiteLocale,
): string {
    const cardId = EX_CARD[s.id];
    const meals = [...(s.cardMeals ?? [])];
    const out: string[] = [];
    s.messages.forEach((m, i) => {
        out.push(exampleMessage(m, doc));
        for (const c of s.cards ?? []) {
            if (c.after !== i || !cardId) continue;
            const meal = c.kind === "meal-logged" ? (meals.shift() ?? "") : "";
            out.push(
                `<div class="lp-card-slot">${renderCard(cardId, locale, meal)}</div>`,
            );
        }
    });
    return out.map((m) => `                                ${m}`).join("\n");
}

function renderExamples(doc: IndexDoc, locale: SiteLocale): string {
    const e = doc.examples;
    const total = e.slides.length;
    const toolHref = (t: string) => `${pathFor(locale, "/tools")}#${t}`;
    const chip = (t: string, main: boolean) =>
        `<a class="lp-chip" href="${toolHref(t)}" target="_blank" rel="noopener" aria-label="${esc(fill(e.toolLinkLabel, { tool: t }))}">${main ? '<i class="fa-solid fa-plug" aria-hidden="true"></i>' : ""}${t}<i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`;
    const tabs = e.slides
        .map((s, i) => {
            const m = EX_META[s.id];
            return `                    <button class="lp-ex-tab" type="button" role="tab" id="ex-tab-${i + 1}" aria-controls="ex-panel-${i + 1}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" aria-label="${esc(s.title)}" title="${esc(s.title)}" data-c="${roleVar(m.color)}" data-ci="${roleIconVar(m.color)}" style="${roleStyle(m.color)}"><span><i class="${m.icon}" aria-hidden="true"></i></span></button>`;
        })
        .join("\n");
    const panels = e.slides
        .map((s, i) => {
            const m = EX_META[s.id];
            const [main, ...more] = m.tools;
            const moreHtml = more.length
                ? `
                            <p class="lp-ex-also">${esc(e.moreToolsLabel)}</p>
${more.map((t) => `                            <div class="lp-ex-more">${chip(t, false)}<p>${esc(s.toolNotes[t]!)}</p></div>`).join("\n")}`
                : "";
            return `                <div class="lp-ex-panel${i === 0 ? " is-on" : ""}" id="ex-panel-${i + 1}" role="tabpanel" aria-labelledby="ex-tab-${i + 1}" style="${roleStyle(m.color)}">
                    <div class="lp-ex-info">
                        <div class="lp-ex-title"><span class="lp-ex-icon" aria-hidden="true"><i class="${m.icon}"></i></span><h3 class="lp-ex-h">${esc(s.title)}</h3></div>
                        <p class="lp-ex-desc">${esc(s.description)}</p>
                        <div class="lp-ex-tools">
                            ${chip(main!, true)}
                            <p>${esc(s.toolNotes[main!]!)}</p>${moreHtml}
                        </div>
                    </div>
                    <div class="lp-ex-chat">
                        <div class="lp-ex-thread" role="region" aria-label="${esc(e.threadLabel)}" tabindex="0">
${exampleThread(s, doc, locale)}
                        </div>
                    </div>
                </div>`;
        })
        .join("\n");
    return `            <section class="nm-section lp-sec lp-try" id="try">
                <div class="lp-head">
                    <h2 class="nm-h2">${esc(e.title)}</h2>
                    <p>${esc(e.sub)}</p>
                </div>
                <div class="lp-ex-bar">
                    <div class="lp-ex-tabs" id="ex-tabs" role="tablist" aria-label="${esc(e.pickerLabel)}">
                        <span class="lp-ex-ring" id="ex-ring" aria-hidden="true"></span>
${tabs}
                    </div>
                    <div class="lp-ex-nav">
                        <span class="lp-ex-count" aria-hidden="true"><b id="ex-count">01</b><span> / ${pad2(total)}</span></span>
                        <button class="lp-round" type="button" data-ex-dir="prev" aria-label="${esc(e.prevLabel)}"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i></button>
                        <button class="lp-round" type="button" data-ex-dir="next" aria-label="${esc(e.nextLabel)}"><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
                    </div>
                </div>
                <div class="lp-ex-box" id="try-carousel" role="region" aria-roledescription="${esc(e.carouselRoleDescription)}" aria-label="${esc(e.carouselLabel)}" style="${roleStyle(EX_META[e.slides[0]!.id].color)}">
                    <span class="lp-ex-blob" aria-hidden="true"></span>
${panels}
                </div>
            </section>`;
}

// ------------------------------------------------------------ live stats

function renderStats(doc: IndexDoc): string {
    const s = doc.stats;
    const u = s.foodLogsUnit;
    const plurals = (["one", "few", "many", "other"] as const)
        .filter((k) => u[k])
        .map((k) => ` data-plural-${k}="${esc(u[k]!)}"`)
        .join("");
    const tiles = STAT_TILES.map(
        (
            t,
        ) => `                    <div class="lp-tile" data-tile="${t.key}" style="${roleStyle(t.c)}"${t.key === "food_logs" ? plurals : ""}>
                        <div class="lp-tile-top"><span class="nm-tile" style="${roleStyle(t.c)}" aria-hidden="true"><i class="${t.icon}"></i></span><span class="lp-delta" role="status" hidden></span></div>
                        <div><b class="lp-fig"><span class="lp-odo" data-odo="${t.key}" role="img" aria-label="${esc(t.label(s))}">—</span><span class="lp-unit" aria-hidden="true">${t.unit}</span></b><span class="odo-cap">${esc(t.label(s))}</span></div>
                    </div>`,
    ).join("\n");
    return `            <section class="nm-section lp-sec lp-stats" id="stats">
                <div class="lp-head">
                    <div>
                        <h2 class="nm-h2">${esc(s.title)}</h2>
                        <p>${esc(s.sub)}</p>
                    </div>
                    <div class="lp-units" role="group" aria-label="${esc(s.unitGroupLabel)}">
                        <button type="button" data-unit="kg" aria-pressed="true" aria-label="${esc(s.unitKgLabel)}">${esc(s.unitMetricLabel)}</button>
                        <button type="button" data-unit="lb" aria-pressed="false" aria-label="${esc(s.unitLbLabel)}">${esc(s.unitImperialLabel)}</button>
                    </div>
                </div>
                <div class="lp-meta" id="stats-meta">
                    <span><svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="var(--track)" stroke-width="2.5"></circle><circle id="stats-ring" cx="8" cy="8" r="6" fill="none" stroke="var(--acc)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="37.7"></circle></svg><span>${esc(s.refreshBefore)}<b id="stats-next">5</b>${esc(s.refreshAfter)}</span><span class="vh" id="facts-live" role="status">${esc(s.liveLabel)}</span></span>
                    <span class="lp-since"><i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i>${esc(s.sinceOpenLabel)} · <span id="stats-since">0:00</span></span>
                </div>
                <div class="lp-tiles" id="stat-row">
${tiles}
                </div>
                <div class="nm-card lp-map" id="map-block">
                    <div class="lp-map-head">
                        <span class="lp-tz"><i class="fa-solid fa-earth-americas" aria-hidden="true"></i><b data-stat="timezones">—</b>${esc(s.timezonesAfter)}</span>
                        <span class="lp-map-note">${esc(s.mapNote)}</span>
                    </div>
                    <div class="lp-map-wrap">
                        <svg id="world-svg" viewBox="0 0 1000 440" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(s.mapAriaLabel)}"></svg>
                    </div>
                    <p class="lp-map-foot"><i class="fa-solid fa-lock" aria-hidden="true"></i><span>${esc(s.foot)}</span></p>
                </div>
            </section>`;
}

// -------------------------------------------------------- features / why

function renderFeatures(doc: IndexDoc): string {
    const cards = doc.features.cards
        .map((c, i) => {
            const m = FEATURE_META[i] ?? FEATURE_META[0]!;
            return `                    <article class="nm-card lp-hover-lift nm-c-${m.c}">
                        ${tile(m.icon)}
                        <div><h3>${esc(c.title)}</h3>
                        <p>${esc(c.body)}</p></div>
                    </article>`;
        })
        .join("\n");
    return `            <section class="nm-section lp-sec" id="features">
                <h2 class="nm-h2 lp-mb">${esc(doc.features.title)}</h2>
                <div class="lp-feat">
${cards}
                </div>
            </section>`;
}

function renderWhy(doc: IndexDoc, locale: SiteLocale): string {
    const w = doc.why;
    const items = (list: string[], icon: string) =>
        list
            .map(
                (t) =>
                    `<li><i class="fa-solid ${icon}" aria-hidden="true"></i>${esc(t)}</li>`,
            )
            .join("");
    const trust = doc.trust
        .map(
            (t, i) =>
                `                    <div>${tile(TRUST_ICONS[i]!)}<span><b>${esc(t.label)}</b>${esc(t.small)}</span></div>`,
        )
        .join("\n");
    return `            <section class="nm-section lp-sec lp-why" id="why">
                <div class="lp-head">
                    <h2 class="nm-h2">${esc(w.title)}</h2>
                    <p>${esc(w.sub)}</p>
                </div>
                <div class="lp-why-grid">
                    <div class="lp-why-old">
                        <h3 class="lp-why-h">${esc(w.oldHeading)}</h3>
                        <ul>${items(w.oldItems, "fa-xmark")}</ul>
                    </div>
                    <div class="lp-why-new">
                        <span class="nm-blob" aria-hidden="true"></span>
                        <h3 class="lp-why-h">${esc(w.newHeading)}</h3>
                        <ul>${items(w.newItems, "fa-check")}</ul>
                    </div>
                </div>
                <p class="lp-why-note">${localizeLinks(w.noteHtml, locale)}</p>
                <div class="lp-trust">
${trust}
                </div>
            </section>`;
}

// ------------------------------------------------- support / cta / contact

function stars(): string {
    return `<span class="nm-stars" data-gh-stars hidden><i class="fa-solid fa-star" aria-hidden="true"></i><span data-gh-stars-n></span></span>`;
}

function renderSupport(doc: IndexDoc): string {
    const s = doc.support;
    return `            <!-- Support -->
            <section class="nm-section lp-sec lp-support" id="support">
                <div class="lp-free">
                    <h2 class="nm-h2">${esc(s.title)}</h2>
                    <p>${esc(s.sub)}</p>
                    <div class="lp-tier">
                        <div class="lp-tier-head"><h3>${esc(s.free.tier)}</h3><b>${esc(s.free.price)}</b></div>
                        <p>${esc(s.free.desc)}</p>
                        <a class="nm-btn lp-follow" href="${PATREON_URL}" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-patreon" aria-hidden="true"></i>${esc(s.free.cta)}</a>
                    </div>
                </div>
                <div class="lp-paid">
                    <span class="nm-blob" aria-hidden="true"></span>
                    <span class="lp-paid-eyebrow">${esc(s.paid.tier)}</span>
                    <h3>${esc(s.paid.price)}</h3>
                    <p>${esc(s.paid.desc)}</p>
                    <div class="lp-paid-ctas">
                        <a class="nm-btn lp-pop" href="${PATREON_URL}" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-patreon" aria-hidden="true"></i>${esc(s.paid.cta)}</a>
                        <a class="nm-btn nm-btn-ghost-dark" href="${REPO_URL}" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-github" aria-hidden="true"></i>${esc(doc.cta.secondary)}${stars()}</a>
                    </div>
                </div>
                <div class="patreon-updates" id="patreon-updates" hidden>
                    <div class="lp-posts-head">
                        <h3><i class="fa-brands fa-patreon" aria-hidden="true"></i>${esc(s.updatesTitle)}<span class="lp-free-badge">${esc(s.updatesBadge)}</span></h3>
                        <span>${esc(s.updatesNote)}</span>
                    </div>
                    <div class="lp-posts" id="patreon-grid" data-link-label="${esc(s.postLinkLabel)}"></div>
                    <div class="lp-pager" id="patreon-pager" hidden>
                        <button class="lp-round" type="button" data-posts-dir="prev" aria-label="${esc(s.updatesPrevLabel)}"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
                        <div class="lp-dots" id="patreon-dots" data-dot-label="${esc(s.updatesDotLabel)}"></div>
                        <button class="lp-round" type="button" data-posts-dir="next" aria-label="${esc(s.updatesNextLabel)}"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
                    </div>
                </div>
            </section>`;
}

function renderCta(doc: IndexDoc): string {
    const c = doc.cta;
    return `            <section class="nm-section lp-sec lp-cta-sec">
                <div class="nm-ink lp-cta">
                    <span class="nm-blob b1" aria-hidden="true"></span>
                    <span class="nm-blob b2" aria-hidden="true"></span>
                    <h2 class="nm-h2">${esc(c.title)}</h2>
                    <p>${esc(c.sub)}</p>
                    <div class="lp-cta-btns">
                        <a class="nm-btn nm-btn-acc nm-btn-lg" href="#install">${esc(c.primary)}</a>
                        <a class="nm-btn nm-btn-lg nm-btn-ghost-dark" href="${REPO_URL}" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-github" aria-hidden="true"></i>${esc(c.secondary)}${stars()}</a>
                    </div>
                </div>
            </section>`;
}

function renderContact(doc: IndexDoc): string {
    const c = doc.contact;
    return `            <!-- Contact -->
            <section class="nm-section lp-sec" id="contact">
                <div class="nm-card nm-card-lg lp-contact">
                    <span class="nm-blob" aria-hidden="true"></span>
                    <div>
                        <h2 class="nm-h2">${esc(c.title)}</h2>
                        <p>${esc(c.sub)}</p>
                    </div>
                    <div>
                        <a class="lp-mail" href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
                        <a class="nm-btn nm-btn-ink" href="mailto:${CONTACT_EMAIL}"><i class="fa-solid fa-envelope" aria-hidden="true"></i>${esc(c.cta)}</a>
                    </div>
                </div>
            </section>`;
}

function renderFaq(doc: IndexDoc, locale: SiteLocale): string {
    // Native <details name="faq">: no script, one open at a time, the first
    // open. The number and the +/− are CSS (counter + ::after), so <summary>
    // holds only the question — src/site-copy.test.ts reads it that way.
    const rows = doc.faq
        .map(
            (
                q,
                i,
            ) => `                    <details name="faq"${i === 0 ? " open" : ""}>
                        <summary>${esc(q.question)}</summary>
                        <p>${localizeLinks(q.visibleHtml, locale)}</p>
                    </details>`,
        )
        .join("\n");
    return `            <section class="nm-section lp-sec lp-faq" id="faq">
                <div class="lp-sticky">
                    <h2 class="nm-h2">${esc(doc.faqSection.title)}</h2>
                </div>
                <div class="nm-card lp-faq-list">
${rows}
                </div>
            </section>`;
}

// -------------------------------------------------------------------- page

function renderDoc(doc: IndexDoc, locale: SiteLocale): string {
    assertExamples(doc, locale);
    const suffix = "";
    const url = urlFor(locale, suffix);
    const title = esc(doc.title);
    const notice = translationNotice(locale, suffix);

    const softwareAppSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Nutrition MCP",
        description: doc.metaDescription,
        url,
        image: `${SITE}/og.png`,
        inLanguage: HTML_LANG[locale],
        applicationCategory: "HealthApplication",
        operatingSystem: "Any",
        isAccessibleForFree: true,
        license: "https://opensource.org/licenses/MIT",
        author: {
            "@type": "Person",
            name: "Anton Kutishevskyi",
            url: REPO_URL,
        },
        // A profile of the project, not an endorsement: the directory
        // listing carries Anthropic's Community label.
        sameAs: [REPO_URL, CLAUDE_DIRECTORY_URL],
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
        },
    };

    // Google reads WebSite markup for the site name on the domain root only,
    // so it is emitted on the English page (/) and nowhere else.
    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Nutrition MCP",
        url: `${SITE}/`,
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: doc.faq.map((entry) => ({
            "@type": "Question",
            name: entry.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: faqJsonLdText(entry),
            },
        })),
    };

    return `<!doctype html>
<html lang="${HTML_LANG[locale]}">
    <head>
        <title>
            ${title}
        </title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="utf-8" />
        <meta name="description" content="${esc(doc.metaDescription)}" />
        <meta name="keywords" content="${esc(doc.keywords)}" />
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
${locale === "en" ? jsonLd(websiteSchema) + "\n" : ""}${jsonLd(softwareAppSchema)}
${jsonLd(faqSchema)}
${HEAD_ASSETS}
        <style>${LANDING_CSS}</style>
    </head>
    <body class="landing">
${generatedBanner("scripts/gen-index.ts")}
${EMAIL_OFF_OPEN}
${THEME_PREPAINT}

${nav(locale, suffix)}

        <main id="main">
${renderHero(doc, locale)}
${
    notice
        ? `            <div class="translation-notice-band">
${notice}
            </div>`
        : ""
}
${renderHow(doc)}
${renderInstall(doc)}
${renderOnboarding(doc, locale)}
${renderExamples(doc, locale)}
${renderStats(doc)}
${renderFeatures(doc)}
${renderWhy(doc, locale)}
${renderSupport(doc)}
${renderCta(doc)}
${renderContact(doc)}
${renderFaq(doc, locale)}
        </main>

${footer(locale)}

        <script>
${LANDING_SCRIPT}
        </script>
${SITE_SCRIPT}
${EMAIL_OFF_CLOSE}
    </body>
</html>
`;
}

// Only when run as a script. src/landing-script.test.ts imports
// LANDING_SCRIPT from here, and an unguarded write loop would regenerate the
// ten pages as a side effect of that import — which is precisely the drift
// the test exists to catch, silently repaired a millisecond before it looks.
if (import.meta.main) {
    for (const [locale, doc] of Object.entries(INDEX) as [
        SiteLocale,
        IndexDoc,
    ][]) {
        const file =
            locale === "en"
                ? "./public/index.html"
                : `./public/${locale}/index.html`;
        let html: string;
        try {
            html = renderDoc(doc, locale);
        } catch (err) {
            // A translation that has not caught up with IndexDoc yet (a
            // missing field reads as undefined at runtime, since only
            // `bun run typecheck` sees the type). English must always build.
            if (locale === "en") throw err;
            console.warn(
                `skipped ${file}: src/copy/index.${locale}.ts does not match IndexDoc yet (${(err as Error).message})`,
            );
            continue;
        }
        await Bun.write(file, html);
        console.log(`wrote ${file}`);
    }
}
