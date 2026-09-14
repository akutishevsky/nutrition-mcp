import { test, expect } from "bun:test";
import {
    HTML_LANG,
    SITE_LOCALES,
    pathFor as routePath,
    type SiteLocale,
} from "./routes.js";
import { INDEX } from "./copy/index.js";
import {
    EXAMPLE_DOWNLOADS,
    EX_META,
    LANDING_SCRIPT,
    exampleStructure,
} from "../scripts/gen-index.js";
import { attr } from "../scripts/site-partials.js";
import { collectOutputSchemas, droppedKeys } from "./widget-schemas.js";

// The landing page's inline JS lives as one string constant (LANDING_SCRIPT
// in scripts/gen-index.ts) that is embedded verbatim into all nine locales'
// index.html. Nothing else in the suite looks inside it, so every i18n fix
// in it was revertible without a red test.
//
// Two halves here, and the DOM-contract half is the load-bearing one. The
// script deliberately holds no copy of its own — one script serves nine
// pages, so any language it named in its own source would be wrong on eight
// of them. Instead it READS everything it shows out of the markup the
// generator produced: <html lang> (drives every number, date and clock), the
// static hero thread (each user bubble's data-clock and each card's
// data-hero-card, brought back in order), the translated word on the
// food-logs delta tag (data-delta-unit), the countdown / since-open spans inside #facts-live,
// and the <template> a Patreon post card is built from. Those are contracts
// between generator and script: drop an attribute, rename an id, and the
// script silently degrades — the chat stops replaying, a card shows "—"
// forever, the delta reads "+3" with no noun — with no error anywhere. The
// tests below pin them against the real generated HTML.

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

/** Only what the generator can emit; enough that a translation containing an
 *  ampersand or a quote does not read as a mismatch. */
function unescapeHtml(s: string): string {
    return s
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&");
}

const text = (s: string) => unescapeHtml(collapse(s));
const stripTags = (s: string) => text(s.replace(/<[^>]+>/g, ""));

function pathFor(locale: SiteLocale): string {
    return locale === "en"
        ? "./public/index.html"
        : `./public/${locale}/index.html`;
}

type Page = { locale: SiteLocale; path: string; html: string };

/** Whatever landing pages exist on disk — translation lands one locale at a
 *  time, so this walks reality rather than asserting a fixed count. */
async function landingPages(): Promise<Page[]> {
    const out: Page[] = [];
    for (const locale of SITE_LOCALES) {
        const path = pathFor(locale);
        if (await Bun.file(path).exists())
            out.push({ locale, path, html: await Bun.file(path).text() });
    }
    return out;
}

/** The landing script is the one bare <script> block that wires the live
 *  stats board; the others are the pre-paint theme shim and JSON-LD. */
function landingScript(html: string): string | null {
    for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
        const body = m[1]!;
        if (body.includes('getElementById("facts-live")')) return body;
    }
    return null;
}

test("there is a landing page and a landing script on every locale", async () => {
    const pages = await landingPages();
    expect(pages.length).toBeGreaterThan(0);
    for (const { path, html } of pages) {
        expect(`${path}: ${landingScript(html) !== null}`).toBe(
            `${path}: true`,
        );
    }
});

// ---------------------------------------------------------------- contracts

// NUM_LOCALE is `document.documentElement.lang || "en"`. Without the
// attribute every figure on the live board, the chat clock and the Patreon
// post dates silently fall back to English grouping on all eight translated
// pages.
test("every landing page stamps its own <html lang>", async () => {
    for (const { locale, path, html } of await landingPages()) {
        const m = html.match(/<html[^>]*\slang="([^"]+)"/);
        expect(`${path}: ${m?.[1]}`).toBe(`${path}: ${HTML_LANG[locale]}`);
    }
});

// The hero chat plays the STATIC thread: the script takes the generator's
// bubbles apart into exchanges (a user bubble — typed, or a photo with its
// caption — followed by its AI reply), reads each one's clock off
// data-clock, and brings the bubbles back in one at a time. So the static
// markup is the whole contract — it is also what a no-JS visitor and every
// crawler read. Pinned per locale against the source data: one user bubble
// per exchange, in order, carrying the clock the copy declares, and the photo
// named by the page's own translated alt.
//
// The nutrient deltas are build-time input — scripts/gen-index.ts turns them
// into each card's real payload — and which exchange a card follows is on
// the card, as data-hero-card. Both are pinned below against IndexDoc, on the
// element that carries them.
const BUBBLE_RE =
    /<div class="nm-msg nm-msg-user( nm-msg-photo)?" data-clock="([^"]*)">([\s\S]*?)(?=\n\s*<div class="nm-msg nm-msg-ai">)/g;

test("the hero chat bubbles carry data-clock for the replay", async () => {
    for (const { locale, path, html } of await landingPages()) {
        const doc = INDEX[locale];
        expect(`${path}: ${!!doc}`).toBe(`${path}: true`);
        const exchanges = doc!.hero.chat.exchanges;
        const bubbles = [...html.matchAll(BUBBLE_RE)];
        expect(`${path}: ${bubbles.length} bubbles`).toBe(
            `${path}: ${exchanges.length} bubbles`,
        );
        expect(bubbles.length).toBeGreaterThan(0);
        bubbles.forEach((m, i) => {
            const [, photo, clock, body] = m;
            const ex = exchanges[i]!;
            expect(`${path} #${i}: ${photo ? "photo" : "typed"}`).toBe(
                `${path} #${i}: ${ex.photo ? "photo" : "typed"}`,
            );
            expect(`${path} #${i}: ${clock}`).toBe(
                `${path} #${i}: ${ex.clock}`,
            );
            expect(`${path} #${i}: ${stripTags(body!)}`).toBe(
                `${path} #${i}: ${text(ex.userText)}`,
            );
            if (ex.photo)
                expect(body).toContain(
                    `role="img" aria-label="${attr(doc!.hero.chat.photoAlt)}"`,
                );
        });
        // Every AI reply is on the page, in the copy's own words.
        const replies = [
            ...html.matchAll(
                /<div class="nm-msg nm-msg-ai">([\s\S]*?)<\/div>/g,
            ),
        ].map((m) => text(m[1]!));
        expect(replies).toEqual(exchanges.map((ex) => text(ex.aiText)));
    }
});

// PLAYED ONCE, THEN LEFT STANDING. The replay used to clear the thread and
// start over two seconds after the last reply, before anyone could read it.
// It now stops on the finished thread, and a replay button takes the pause
// button's slot in the chat header to start it again — named in the page's
// language, like the pause toggle it replaces. An endless loop sneaking back
// in fails here.
test("the hero chat plays once and has a translated replay button", async () => {
    const start = LANDING_SCRIPT.indexOf("// ---------- hero chat");
    const end = LANDING_SCRIPT.indexOf("// ---------- live GitHub star count");
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const hero = LANDING_SCRIPT.slice(start, end);
    expect(
        `loops: ${/for\s*\(\s*;\s*;\s*\)|while\s*\(\s*true\s*\)/.test(hero)}`,
    ).toBe("loops: false");
    expect(hero).toContain('querySelector("[data-chat-replay]")');
    for (const { locale, path, html } of await landingPages()) {
        const label = INDEX[locale]!.hero.chat.replayLabel;
        expect(`${locale} replayLabel: ${Boolean(label?.trim())}`).toBe(
            `${locale} replayLabel: true`,
        );
        const button =
            /<button type="button" class="nm-round nm-chat-replay" data-chat-replay hidden>([\s\S]*?)<\/button>/.exec(
                html,
            )?.[1] ?? "";
        expect(`${path}: ${stripTags(button)}`).toBe(`${path}: ${text(label)}`);
        // Pause ships hidden too: the first run un-hides it, and the two
        // share one slot, so neither shows without script.
        expect(html).toContain(
            '<button type="button" class="nm-round nm-chat-pause" data-chat-pause aria-pressed="false" hidden>',
        );
    }
});

// WHICH EXCHANGE EACH CARD FOLLOWS. This is what `HeroExchange.card` declares
// and what the replay resolves a card by: `data-hero-card` names the exchange
// whose reply the card is brought in after. Every exchange that names a card
// must have exactly one, or the replay reaches an exchange that says a card
// is due and has none to show.
test("every hero exchange that names a card has exactly one", async () => {
    for (const { locale, path, html } of await landingPages()) {
        const exchanges = INDEX[locale]!.hero.chat.exchanges;
        const flagged = exchanges.flatMap((ex, i) =>
            ex.card ? [`${i}:${ex.card}`] : [],
        );
        expect(
            flagged.length,
            `${locale}: the copy names a card`,
        ).toBeGreaterThan(0);
        const served = [
            ...html.matchAll(
                /<div class="nm-widget-card" data-widget="([a-z-]+)" data-nosnippet data-hero-card="(\d+)">/g,
            ),
        ].map((m) => `${m[2]}:${m[1]}`);
        expect(`${path}: hero cards ${served.join(",")}`).toBe(
            `${path}: hero cards ${flagged.join(",")}`,
        );
    }
});

// WHEN AND HOW IT PLAYS, and whether anyone watched. The run starts when the
// chat is half in view — on a phone it sits a screen down, under the hero's
// text, and a run that began on load had played its photo before anyone got
// there. Every card is shown from its top instead of pinned by its bottom,
// nothing is trimmed from a thread that now stands, and the demo reports its
// start, finish and replays — and the hero's two calls to action — to the
// page's analytics, when the page has any. The thread and every widget card
// are data-nosnippet, so a search result never quotes a tile or the banter.
test("the hero chat starts in view, shows cards from the top, and reports what happened", async () => {
    const start = LANDING_SCRIPT.indexOf("// ---------- hero chat");
    const end = LANDING_SCRIPT.indexOf("// ---------- live GitHub star count");
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const hero = LANDING_SCRIPT.slice(start, end);
    for (const hook of [
        "new IntersectionObserver(",
        "{ threshold: 0.5 }",
        "function showCard(",
        'heroTrack("hero_demo_start")',
        'heroTrack("hero_demo_complete", {',
        'heroTrack("hero_demo_replay")',
        '"hero_cta_click"',
        'typeof window.gtag === "function"',
    ])
        expect(hero).toContain(hook);
    expect(hero).not.toContain("CHAT_MAX");
    for (const { locale, path, html } of await landingPages()) {
        // A scrollable box is a tab stop: named, focusable — and unquoted.
        expect(html, path).toContain(
            `<div class="nm-chat-list" role="region" aria-label="${attr(INDEX[locale]!.examples.threadLabel)}" tabindex="0" data-nosnippet data-chat-list>`,
        );
        const wrappers = html.match(/<div class="nm-widget-card"[^>]*>/g) ?? [];
        expect(wrappers.length).toBeGreaterThan(0);
        for (const w of wrappers) expect(w, path).toContain(" data-nosnippet");
    }
});

// WHERE THE THREAD'S NUTRIENTS ACTUALLY LAND.
//
// The hero's cards are the real widget cards, rendered by the widget's own
// emitters from real payloads, so what is worth pinning is that each payload
// the page ships is (a) a payload its TOOL could have sent, and (b) the
// thread's own deltas summed. Both are checked against the live outputSchemas
// and against IndexDoc, not against anything this file restates — and the
// cards' own bytes are pinned verbatim in src/widget-card.test.ts.
const heroPayloadOf = (html: string): unknown =>
    JSON.parse(
        html.match(
            /<script type="application\/json" data-widget-payload="nutrition-summary">([\s\S]*?)<\/script>/,
        )?.[1] ?? "null",
    );

/** The hero, from its heading to the "More examples" link under the chat. */
function heroOf(html: string): string {
    const at = html.indexOf('id="hero-title"');
    return html.slice(at, html.indexOf('<a class="nm-more"', at));
}

const HERO_TOOL: Record<string, string> = {
    "meal-logged": "log_meal",
    "nutrition-summary": "get_nutrition_summary",
    "weight-trends": "get_weight_trends",
};

test("every hero card ships a payload its tool's own schema accepts", async () => {
    const schemas = collectOutputSchemas();
    for (const { locale, path, html } of await landingPages()) {
        const shipped = [
            ...heroOf(html).matchAll(
                /<script type="application\/json" data-widget-payload="([a-z-]+)">([\s\S]*?)<\/script>/g,
            ),
        ];
        expect(`${path}: ${shipped.map((m) => m[1]).join(",")}`).toBe(
            `${path}: ${INDEX[locale]!.hero.chat.exchanges.flatMap((ex) => (ex.card ? [ex.card] : [])).join(",")}`,
        );
        for (const [, kind, json] of shipped) {
            const payload = JSON.parse(json!) as { locale: string };
            const schema = schemas.get(HERO_TOOL[kind!]!);
            expect(schema, `${kind} has an outputSchema`).toBeTruthy();
            // parse() throws on a missing or mistyped field; droppedKeys names
            // the ones z.object() silently STRIPS, which is how a renamed key
            // reaches the page and never reaches the widget.
            const parsed = schema!.parse(payload);
            expect(
                `${path} ${kind}: dropped ${[...droppedKeys(payload, parsed)].join(",")}`,
            ).toBe(`${path} ${kind}: dropped `);
            // The runtime resolves which dictionary to repaint in from this
            // field (boot.js -> setLocaleFrom). "en" on /de leaves a German
            // card correct until the first tap and English afterwards.
            expect(`${path} ${kind}: payload locale ${payload.locale}`).toBe(
                `${path} ${kind}: payload locale ${locale}`,
            );
        }
    }
});

test("the hero card's figures are the thread's deltas summed", async () => {
    for (const { locale, path, html } of await landingPages()) {
        const exchanges = INDEX[locale]!.hero.chat.exchanges;
        const payload = heroPayloadOf(html) as {
            averages: Record<string, number | null>;
            meals: { description: string }[];
        };
        const totals: Record<string, number> = {};
        for (const ex of exchanges)
            for (const [k, v] of Object.entries(ex.add))
                totals[k] = (totals[k] ?? 0) + (v ?? 0);
        // The hero chat's own short keys, against the tool's.
        const KEYS: [short: string, tool: string][] = [
            ["kcal", "calories"],
            ["pro", "protein_g"],
            ["car", "carbs_g"],
            ["fat", "fat_g"],
            ["sugar", "sugar_g"],
            ["caf", "caffeine_mg"],
            ["water", "water_ml"],
        ];
        for (const [short, tool] of KEYS) {
            expect(`${path} ${tool}: ${payload.averages[tool]}`).toBe(
                `${path} ${tool}: ${totals[short] ?? 0}`,
            );
        }
        // …and every meal the thread logged is behind them, so the drawer
        // reconciles with the tiles rather than showing a subset of them.
        expect(payload.meals.map((m) => m.description)).toEqual(
            exchanges.flatMap((ex) => (ex.meal ? [ex.meal.description] : [])),
        );
        // The card the visitor sees IS one of those figures, printed. Read
        // back out of the markup so a payload that never reached the emitter
        // cannot pass this.
        const printed = html
            .slice(html.indexOf('data-widget="nutrition-summary"'))
            .match(/<span class="v">([^<]*)<span class="u">/)?.[1];
        expect(`${path} ring: ${printed}`).toBe(
            `${path} ring: ${(totals.kcal ?? 0).toLocaleString(HTML_LANG[locale])}`,
        );
    }
});

// #facts-live is the live board's refresh line. It holds the countdown the
// script ticks (a <b data-countdown> inside the translated sentence, plus the
// ring's arc) — so the translated words around the number have to come from
// the page, split around the number exactly as the copy declares them.
test("#facts-live carries this locale's own refresh sentence around the countdown", async () => {
    for (const { locale, path, html } of await landingPages()) {
        const doc = INDEX[locale];
        expect(`${path}: ${!!doc}`).toBe(`${path}: true`);
        const block = html.match(
            /<span id="facts-live"[^>]*>([\s\S]*?<\/span>)\s*<\/span>/,
        )?.[1];
        expect(`${path}: has #facts-live`).toBe(
            `${path}: ${block ? "has #facts-live" : "no #facts-live"}`,
        );
        expect(`${path}: ${block!.includes("data-countdown-ring")}`).toBe(
            `${path}: true`,
        );
        const line = block!.match(/<span>([\s\S]*?)<\/span>/)?.[1] ?? "";
        expect(line).toContain("<b data-countdown>");
        expect(`${path}: ${stripTags(line)}`).toBe(
            `${path}: ${text(doc!.live.refreshBefore + "5" + doc!.live.refreshAfter)}`,
        );
        const since = html.match(
            /<span class="nm-since">([\s\S]*?)<\/span>\s*<\/span>/,
        )?.[1];
        expect(`${path}: ${!!since}`).toBe(`${path}: true`);
        expect(since!).toContain("<span data-since-open>");
        expect(`${path}: ${stripTags(since!)}`).toBe(
            `${path}: ${text(doc!.live.sinceOpenLabel + " · 0s")}`,
        );
    }
});

// The food-logs delta tag reads "+3 logs": the number is the script's, the
// noun is the page's, read off data-delta-unit. Hardcode it and eight
// locales read "+3 logs" in English.
test("the food-logs delta noun is read off the page, translated", async () => {
    for (const { locale, path, html } of await landingPages()) {
        const doc = INDEX[locale];
        const tag = html.match(
            /<span class="nm-delta" data-delta="food_logs"([^>]*)>/,
        )?.[1];
        expect(`${path}: ${!!tag}`).toBe(`${path}: true`);
        const word = /data-delta-unit="([^"]*)"/.exec(tag!)?.[1];
        expect(`${path}: ${text(word ?? "")}`).toBe(
            `${path}: ${text(doc!.live.foodLogsUnit)}`,
        );
    }
});

// Every hook the script queries, on every page. Each one is a silent
// failure when missing: no stat card animates, the map never draws, the
// countdown never ticks, the Patreon block stays hidden even with posts.
test("every id / attribute hook the script queries exists on every landing page", async () => {
    const hooks: [string, string][] = [
        ['getElementById("facts-live")', 'id="facts-live"'],
        ['getElementById("stat-row")', 'id="stat-row"'],
        ['getElementById("map-block")', 'id="map-block"'],
        ['getElementById("world-svg")', 'id="world-svg"'],
        ['getElementById("patreon-updates")', 'id="patreon-updates"'],
        ['getElementById("patreon-posts-grid")', 'id="patreon-posts-grid"'],
        [
            'getElementById("patreon-post-tpl")',
            '<template id="patreon-post-tpl">',
        ],
        ['querySelector("[data-chat-list]")', "data-chat-list>"],
        ['querySelector("[data-chat-clock]")', "data-chat-clock>"],
        // The replay button. Missing, the thread plays once and there is
        // no way to see it again short of reloading the page.
        ['querySelector("[data-chat-replay]")', "data-chat-replay hidden>"],
        // What the replay waits to see before it starts, and the calls to
        // action whose clicks it reports.
        ['closest(".nm-chat")', '<div class="nm-chat">'],
        ['querySelectorAll(".nm-hero-actions a")', 'class="nm-hero-actions"'],
        // The hero's three cards, one per exchange that names a `card`.
        // Missing, the thread replays without ever showing a card — and it
        // is the card the whole hero exists to demonstrate.
        ['querySelectorAll("[data-hero-card]")', "data-hero-card="],
        ['querySelector("[data-countdown]")', "<b data-countdown>"],
        ['querySelector("[data-countdown-ring]")', "data-countdown-ring>"],
        ['querySelector("[data-since-open]")', "<span data-since-open>"],
        ['querySelector(".nm-tz-tip")', 'class="nm-tz-tip"'],
        ['querySelectorAll("[data-unit]")', 'data-unit="kg"'],
        ['querySelectorAll("[data-gh-stars]")', "<span data-gh-stars>"],
        // The examples carousel. The track is what the active slide is
        // derived from; the off-screen slides get inert; the tabs and the
        // counter mirror them; the live region is the only thing that
        // announces a change. Missing, the buttons scroll nothing and the
        // tabs never move — while the track still swipes, so it looks fine.
        ['querySelector("[data-ex-track]")', "data-ex-track>"],
        ['querySelectorAll("[data-ex-slide]")', "data-ex-slide>"],
        ['querySelectorAll("[data-ex-tab]")', "data-ex-tab>"],
        ['querySelector("[data-ex-count]")', "<span data-ex-count>"],
        ['querySelector("[data-ex-live]")', "data-ex-live>"],
        ["[data-ex-dir]", 'data-ex-dir="prev"'],
        // The sticky bar: without it the scroll-back to the new slide's top
        // on a phone silently does nothing.
        ['querySelector("[data-ex-bar]")', "data-ex-bar>"],
        ["[data-post-title]", "data-post-title"],
        ["[data-post-preview]", "data-post-preview"],
        ["[data-post-date]", "data-post-date"],
    ];
    for (const [inScript] of hooks) {
        expect(
            `script queries ${inScript}: ${LANDING_SCRIPT.includes(inScript)}`,
        ).toBe(`script queries ${inScript}: true`);
    }
    const pages = await landingPages();
    expect(pages.length).toBeGreaterThan(0);
    for (const { path, html } of pages) {
        for (const [, inPage] of hooks) {
            expect(`${path} has ${inPage}: ${html.includes(inPage)}`).toBe(
                `${path} has ${inPage}: true`,
            );
        }
        // One card per /api/stats key the script formats, each addressable
        // by data-stat-card so a key the DB does not serve yet can be hidden
        // rather than shown as NaN.
        for (const key of [
            "total_calories",
            "food_logs",
            "total_protein_g",
            "total_carbs_g",
            "total_fat_g",
            "weight_lost_g",
            "total_water_ml",
        ]) {
            expect(
                `${path} card ${key}: ${html.includes(`data-stat-card="${key}"`)}`,
            ).toBe(`${path} card ${key}: true`);
            expect(
                `${path} stat ${key}: ${html.includes(`data-stat="${key}"`)}`,
            ).toBe(`${path} stat ${key}: true`);
        }
        expect(html).toContain('data-stat="timezones"');
    }
});

// -------------------------------------------------------------- the script

async function theScript(): Promise<string> {
    const pages = await landingPages();
    const script = landingScript(pages[0]!.html);
    expect(script).not.toBeNull();
    return script!;
}

// One shared constant embedded nine times. Any divergence means a page was
// hand-edited or a generator run went half-finished.
test("the landing script is byte-identical on every locale", async () => {
    const pages = await landingPages();
    const first = landingScript(pages[0]!.html);
    for (const { path, html } of pages) {
        expect(`${path}: ${landingScript(html) === first}`).toBe(
            `${path}: true`,
        );
    }
});

test("the landing script reads its locale off <html lang>", async () => {
    const script = await theScript();
    expect(script).toContain(
        'var NUM_LOCALE = document.documentElement.lang || "en";',
    );
});

// fmtInt used to hardcode toLocaleString("en-US") and the clock used
// toLocaleTimeString([]), which follows the BROWSER rather than the page. A
// literal tag, an empty array, or `undefined` are all regressions.
test("the landing script never formats against a locale of its own", async () => {
    const script = await theScript();
    const calls = [
        ...script.matchAll(
            /\.toLocale(?:String|DateString|TimeString)\s*\(([^)]*)/g,
        ),
    ];
    expect(calls.length).toBeGreaterThan(0);
    const offenders = calls
        .map((c) => collapse(c[1]!))
        .filter((arg) => !arg.startsWith("NUM_LOCALE"));
    expect(`toLocale args not NUM_LOCALE: ${offenders.join(" | ")}`).toBe(
        "toLocale args not NUM_LOCALE: ",
    );
});

// One deliberate exception, do NOT "fix" it: /^en-US\b/i.test(navigator.language)
// picks the kg/lb default. That keys off the VISITOR's measurement system,
// not the page's language — a German speaker on a US machine still wants
// pounds — so it is correct precisely because it names a locale the page
// does not. Every other mention of a locale tag in the script is a bug.
test("the only locale tag in the landing script is the kg/lb picker", async () => {
    const script = await theScript();
    const offenders = script
        .split("\n")
        .filter((line) => /\ben-US\b/.test(line))
        .filter((line) => !line.includes("navigator.language"));
    expect(`stray en-US lines: ${offenders.join(" | ")}`).toBe(
        "stray en-US lines: ",
    );
});

// The script must hold no copy: every visible string it writes is either a
// number, a unit symbol, or text it read off the page. A quick smell test
// for the likeliest regression — an English word from the live board or
// the chat sneaking into the source as a literal.
test("the landing script holds none of the page's copy", async () => {
    // Comments may name a word as an example; only code counts.
    const script = (await theScript()).replace(/^\s*\/\/.*$/gm, "");
    const en = INDEX.en!;
    for (const literal of [
        en.live.foodLogsUnit,
        en.live.sinceOpenLabel,
        en.live.refreshBefore.trim(),
        en.hero.chat.status,
        en.support.postLinkLabel,
    ]) {
        expect(
            `script contains "${literal}": ${script.includes(`"${literal}`)}`,
        ).toBe(`script contains "${literal}": false`);
    }
});

// The script is a String.raw block in the generator, so a bad edit can ship
// a syntax error that no typecheck and no test would see. new Function
// compiles without running.
test("the landing script parses", async () => {
    const script = await theScript();
    expect(() => new Function(script)).not.toThrow();
});

// ------------------------------------------------------- generator vs. page

// Everything above reads the script back out of the generated HTML, so the
// suite catches a script that was REVERTED and one that diverged across
// locales — but not the opposite and likelier mistake: an edit to
// LANDING_SCRIPT in scripts/gen-index.ts that was never regenerated. All nine
// files agree with each other and with every contract, and every assertion
// stays green while the shipped script is the old one. That is the
// generator-drift failure CLAUDE.md warns about on every generated page.
//
// So pin the artifact against its source, the way src/alt-pages.test.ts pins
// nav strings against src/copy/chrome.ts rather than against scraped HTML.
// The generator's write loop is guarded by `import.meta.main` so that
// importing the constant here does not regenerate the pages and repair the
// drift before it is measured.
//
// A raw substring check is enough because prettier leaves the block alone:
// LANDING_SCRIPT is already written in prettier's own style at the exact
// indentation the <script> tag puts it at, so `bun run format` over the
// generated HTML reproduces it byte for byte. If that ever stops being true
// the failure is loud, and the fix is to compare collapsed whitespace here
// rather than to hand-reformat the constant.
test("every landing page carries the generator's current LANDING_SCRIPT", async () => {
    const pages = await landingPages();
    expect(pages.length).toBeGreaterThan(0);
    for (const { path, html } of pages) {
        expect(`${path}: ${html.includes(LANDING_SCRIPT)}`).toBe(
            `${path}: true`,
        );
    }
});

// ---------------------------------------------------------------------
// The "Live statistics" nav badge is driven from public/site.js, which every page
// loads — not from here, which ships on the landing page alone. This script
// keeps its own 5s poll (its figures are on screen and animate) and hands the
// result over through a "live-stats" event, so the landing page still makes
// one request per tick rather than two.
//
// Every way that handoff can break is silent. Drop the dispatch and the badge
// freezes at whatever site.js last saw, with no error anywhere; leave a copy
// of the painter behind here and two pollers repaint the same three spans off
// two different baselines, on the landing page only. So pin the event name
// against the listener that consumes it, and pin that this file no longer
// paints.
test("the landing script hands its figures to site.js instead of painting the badge", async () => {
    const siteJs = await Bun.file("./public/site.js").text();
    expect(LANDING_SCRIPT).toContain('new CustomEvent("live-stats"');
    expect(siteJs).toContain('doc.addEventListener("live-stats"');
    expect(LANDING_SCRIPT).not.toContain("data-live-badge");
    expect(LANDING_SCRIPT).not.toContain("setNavBadge");
});

// site.js polls /api/stats for itself on every page EXCEPT this one, and the
// marker it checks for is #facts-live — the landing page's refresh line.
// That is a generator/script contract exactly like the hooks above: rename
// or drop the id and the landing page silently starts polling twice, which
// no assertion elsewhere would notice.
test("#facts-live is what stops site.js polling a second time on the landing page", async () => {
    const siteJs = await Bun.file("./public/site.js").text();
    expect(siteJs).toContain('getElementById("facts-live")');
    const pages = await landingPages();
    expect(pages.length).toBeGreaterThan(0);
    for (const { path, html } of pages) {
        expect(`${path}: ${html.includes('id="facts-live"')}`).toBe(
            `${path}: true`,
        );
    }
});

// #patreon-updates starts hidden and the script only clears that attribute
// once /api/patreon-posts actually returns a post — a self-hosted deploy with
// no Patreon credentials gets [] back forever, so the block must render
// invisible by default rather than as an empty card.
test("#patreon-updates renders hidden on every landing page", async () => {
    const pages = await landingPages();
    expect(pages.length).toBeGreaterThan(0);
    for (const { path, html } of pages) {
        const m = html.match(
            /<div class="patreon-updates" id="patreon-updates"( hidden)?>/,
        );
        expect(`${path}: ${m?.[1]}`).toBe(`${path}:  hidden`);
    }
});

// Each example slide lists the MCP tools its conversation calls (EX_META in
// scripts/gen-index.ts, keyed by slide id): the primary one as .nm-ex-tool,
// first in the tool list, the rest as .nm-ex-chip. Those names are hand-kept, like
// the tool count, so a rename in src/mcp.ts would leave a stale chip on nine
// landing pages without this.
test("every examples tool chip names a tool src/mcp.ts registers", async () => {
    const source = await Bun.file(
        new URL("./mcp.ts", import.meta.url).pathname,
    ).text();
    const registered = new Set(
        [...source.matchAll(/registerTool\(\s*"([a-z0-9_]+)"/g)].map(
            (m) => m[1]!,
        ),
    );
    const all = Object.values(EX_META).flatMap((m) => m.tools);
    expect(all.length).toBeGreaterThan(0);
    for (const name of all)
        expect(`EX_META ${name}: ${registered.has(name)}`).toBe(
            `EX_META ${name}: true`,
        );
    const pages = await landingPages();
    expect(pages.length).toBeGreaterThan(0);
    for (const { locale, path, html } of pages) {
        const chips = [
            ...html.matchAll(
                /<a class="nm-ex-tool"[^>]*>[\s\S]*?<code>([^<]+)<\/code>|<a class="nm-ex-chip"[^>]*><code>([^<]+)<\/code>/g,
            ),
        ].map((m) => m[1] ?? m[2]!);
        // In the page's slide order, not EX_META's key order: reordering
        // the slides is a legitimate change that leaves every chip right.
        const want = INDEX[locale]!.examples.slides.flatMap(
            (s) => EX_META[s.id].tools,
        );
        expect(`${path}: ${chips.join(",")}`).toBe(
            `${path}: ${want.join(",")}`,
        );
    }
});

// Every examples tool chip is a link to that tool's card on the SAME locale's
// tools page: the href is that locale's /tools path plus #<tool name>, the
// card with that id exists on that locale's generated tools.html, and the
// accessible name contains the visible tool name (WCAG 2.5.3). A hardcoded
// "/tools" on /de would send a German visitor to the English page.
test("every examples tool chip links to its card on this locale's tools page", async () => {
    const pages = await landingPages();
    // Every locale is populated: a locale whose page failed to generate must
    // fail here, not be skipped by landingPages().
    expect(pages.map((p) => p.locale)).toEqual([...SITE_LOCALES]);
    for (const { locale, path, html } of pages) {
        const label = INDEX[locale]!.examples.toolLinkLabel;
        expect(`${locale}: ${label.includes("{tool}")}`).toBe(
            `${locale}: true`,
        );
        // No chip may be left as bare text.
        expect(
            `${path}: ${/<span class="nm-ex-tool">|<code class="nm-ex-chip">/.test(html)}`,
        ).toBe(`${path}: false`);
        const toolsFile =
            locale === "en"
                ? "./public/tools.html"
                : `./public/${locale}/tools.html`;
        const toolsHtml = await Bun.file(toolsFile).text();
        const cardIds = new Set(
            [
                ...toolsHtml.matchAll(
                    /<article class="tool-card" id="([^"]+)"/g,
                ),
            ].map((m) => m[1]!),
        );
        expect(cardIds.size).toBeGreaterThan(0);
        // Every chip is one row of its slide's tool list: the link, then that
        // tool's note (ExampleSlide.toolNotes) as plain text AFTER it — never
        // inside the link, where it would bury the tool name the chip shows
        // in a sentence-long accessible name.
        const links = [
            ...html.matchAll(
                /<li class="nm-ex-use"><a class="(nm-ex-tool|nm-ex-chip)" href="([^"]*)" aria-label="([^"]*)">(?:(?!<\/a>)[\s\S])*?<code>([^<]+)<\/code>(?:(?!<\/a>)[\s\S])*<\/a> <span class="nm-ex-note">([^<]*)<\/span><\/li>/g,
            ),
        ];
        const slides = INDEX[locale]!.examples.slides;
        const want = slides.flatMap((s) => EX_META[s.id].tools);
        expect(`${path}: ${links.map((m) => m[4]).join(",")}`).toBe(
            `${path}: ${want.join(",")}`,
        );
        // No chip outside a row, so none renders without its note.
        expect(
            `${path}: ${(html.match(/<a class="nm-ex-(?:tool|chip)"/g) ?? []).length} chips`,
        ).toBe(`${path}: ${want.length} chips`);
        expect(
            `${path}: ${links.map((m) => `${m[4]}: ${unescapeHtml(m[5]!)}`).join(" | ")}`,
        ).toBe(
            `${path}: ${slides
                .flatMap((s) =>
                    EX_META[s.id].tools.map((t) => `${t}: ${s.toolNotes?.[t]}`),
                )
                .join(" | ")}`,
        );
        for (const m of links) {
            const [, , href, aria, name] = m as unknown as string[];
            const got = unescapeHtml(href!);
            expect(`${path} ${name}: ${got}`).toBe(
                `${path} ${name}: ${routePath(locale, "/tools")}#${name}`,
            );
            expect(`${path} ${name} card: ${cardIds.has(name!)}`).toBe(
                `${path} ${name} card: true`,
            );
            expect(`${path} ${name} aria: ${unescapeHtml(aria!)}`).toBe(
                `${path} ${name} aria: ${label.replace("{tool}", name!)}`,
            );
        }
    }
});

// The examples are STRUCTURE plus words, and only the words translate. Every
// locale lists English's slide ids in English's order, with the same widget
// and the same from / photo sequence of messages — so the conversation, its
// photo turns and its card are the same on every page — and every page
// renders each slide with that id's icon, tint and tools. A translation that
// reorders, drops or adds a bubble fails here (and the generator refuses to
// build it), instead of shipping a different conversation in one language.
test("every locale's example slides mirror English's structure", async () => {
    const en = exampleStructure(INDEX.en!.examples.slides);
    expect(en.length).toBe(Object.keys(EX_META).length);
    // Length alone passes a duplicated id standing in for a dropped one.
    expect(new Set(INDEX.en!.examples.slides.map((s) => s.id)).size).toBe(
        Object.keys(EX_META).length,
    );
    for (const locale of Object.keys(INDEX) as SiteLocale[]) {
        expect(exampleStructure(INDEX[locale]!.examples.slides)).toEqual(en);
    }
    // Every slide has its description and exactly one non-empty note per
    // tool EX_META lists for it. The note's KEY is the tool name — structure,
    // copied verbatim — and only its words translate, so a locale that drops,
    // adds or renames one would print a chip with nothing beside it.
    for (const locale of Object.keys(INDEX) as SiteLocale[]) {
        for (const s of INDEX[locale]!.examples.slides) {
            const at = `${locale} ${s.id}`;
            expect(`${at} description: ${Boolean(s.description?.trim())}`).toBe(
                `${at} description: true`,
            );
            const notes: Record<string, unknown> = s.toolNotes ?? {};
            const tools = EX_META[s.id].tools;
            expect(`${at} notes: ${Object.keys(notes).sort().join(",")}`).toBe(
                `${at} notes: ${[...tools].sort().join(",")}`,
            );
            for (const t of tools) {
                const note = notes[t];
                expect(
                    `${at} ${t}: ${typeof note === "string" && note.trim() !== ""}`,
                ).toBe(`${at} ${t}: true`);
            }
        }
    }
    const pages = await landingPages();
    expect(pages.length).toBeGreaterThan(0);
    for (const { locale, path, html } of pages) {
        const slides = INDEX[locale]!.examples.slides;
        const rendered = [
            ...html.matchAll(
                /data-ex-id="([^"]+)" data-ex-slide>\s*<div class="nm-ex-info (nm-c-[a-z]+)">[\s\S]*?<i class="fa-solid ([a-z0-9-]+)">/g,
            ),
        ].map((m) => `${m[1]} ${m[2]} ${m[3]}`);
        expect(`${path}: ${rendered.join(" | ")}`).toBe(
            `${path}: ${slides
                .map(
                    (s) =>
                        `${s.id} ${EX_META[s.id].tint} ${EX_META[s.id].icon}`,
                )
                .join(" | ")}`,
        );
        // One bubble per message, in order, with the photo turns drawn.
        const track = html.slice(
            html.indexOf("data-ex-track>"),
            html.indexOf("data-ex-live>"),
        );
        const bubbles = [
            ...track.matchAll(
                /<div class="nm-ex-(q nm-ex-q-photo|q|a)">(?:\s*<div class="nm-ex-snap (nm-ex-snap-meal|nm-barcode)"|[^<]*(<span class="nm-ex-file">))?/g,
            ),
        ].map((m) =>
            m[1] === "a"
                ? m[3]
                    ? "ai+export-zip"
                    : "ai"
                : m[2]
                  ? `user+${m[2] === "nm-barcode" ? "package" : "meal"}`
                  : "user",
        );
        expect(`${path}: ${bubbles.join(" ")}`).toBe(
            `${path}: ${slides
                .flatMap((s) =>
                    s.messages.map((m) =>
                        m.from === "user" && m.photo
                            ? `user+${m.photo}`
                            : m.from === "ai" && m.download
                              ? `ai+${m.download}`
                              : m.from,
                    ),
                )
                .join(" ")}`,
        );
        // Every photo is named, in the page's language.
        const e = INDEX[locale]!.examples;
        for (const alt of [e.photoMealAlt, e.photoPackageAlt])
            expect(
                `${path}: ${html.includes(`role="img" aria-label="${attr(alt)}"`)}`,
            ).toBe(`${path}: true`);
        expect(
            `${path}: ${html.includes(`<span class="nm-ex-of"> / ${String(slides.length).padStart(2, "0")}</span>`)}`,
        ).toBe(`${path}: true`);
    }
});

// The export reply hands over a file the way a chat shows a signed link: the
// archive's real name and how long the link lasts. It is a PICTURE of that
// link — the real one is per-user and dead within the hour — so it must never
// become a control or print a URL someone could copy.
test("the download chip names the real archive, its 60 minutes, and is not a link", async () => {
    // The name is the one export_all_data writes (exportArchivePath).
    const supabase = await Bun.file("./src/supabase.ts").text();
    for (const { fileName } of Object.values(EXAMPLE_DOWNLOADS))
        expect(supabase).toContain(`/${fileName}\``);
    // …in the bucket src/export.ts uploads it to.
    for (const { bucket } of Object.values(EXAMPLE_DOWNLOADS))
        expect(await Bun.file("./src/export.ts").text()).toContain(
            `const EXPORT_BUCKET = "${bucket}";`,
        );
    // …and the lifetime is the one src/export.ts signs it for.
    const exportTs = await Bun.file("./src/export.ts").text();
    expect(exportTs).toMatch(/EXPORT_TTL_SECONDS = 60 \* 60\b/);
    for (const locale of Object.keys(INDEX) as SiteLocale[]) {
        const e = INDEX[locale]!.examples;
        expect(
            `${locale} downloadExpires: ${/\b60\b/.test(e.downloadExpires ?? "")}`,
        ).toBe(`${locale} downloadExpires: true`);
        const withDownload = e.slides.flatMap((s) =>
            s.messages.flatMap((m) =>
                m.from === "ai" && m.download ? [`${s.id}:${m.download}`] : [],
            ),
        );
        expect(withDownload).toEqual(["export-data:export-zip"]);
    }
    const pages = await landingPages();
    expect(pages.length).toBeGreaterThan(0);
    for (const { locale, path, html } of pages) {
        const chips = [
            ...html.matchAll(
                /<span class="nm-ex-file">([\s\S]*?)<\/span><\/span><\/span>/g,
            ),
        ];
        expect(`${path}: ${chips.length} download chip(s)`).toBe(
            `${path}: 1 download chip(s)`,
        );
        const chip = chips[0]![0];
        expect(chip).toContain(
            `<span class="nm-ex-file-name">${EXAMPLE_DOWNLOADS["export-zip"].fileName}</span>`,
        );
        expect(stripTags(chip)).toContain(
            text(INDEX[locale]!.examples.downloadExpires),
        );
        expect(chip).not.toMatch(
            /<a\b|<button|href=|tabindex|role=|https?:|\/\//,
        );
        // An example of the link, in its real shape, with every per-user part
        // elided: no host or project ref, no user id, no token.
        const { bucket, fileName } = EXAMPLE_DOWNLOADS["export-zip"];
        expect(stripTags(chip)).toContain(`…/${bucket}/…/${fileName}?token=…`);
        expect(stripTags(chip)).not.toMatch(
            /supabase|[0-9a-f]{8}-[0-9a-f]{4}|[A-Za-z0-9_.-]{32,}/i,
        );
        // Inside the export slide's reply bubble.
        const slide = html.slice(html.indexOf('data-ex-id="export-data"'));
        expect(slide.indexOf(chip)).toBeGreaterThan(-1);
        expect(
            slide
                .slice(0, slide.indexOf(chip))
                .lastIndexOf('<div class="nm-ex-a">'),
        ).toBeGreaterThan(
            slide.slice(0, slide.indexOf(chip)).lastIndexOf("</div>"),
        );
    }
});

// A card in a thread lines up with the assistant replies around it: same left
// edge, and exactly the widest a reply may run — never the thread's full
// width, which put every card past the bubbles beside it. Both widths read
// ONE token, redefined per breakpoint on .nm-ex-chat, so this pins that
// nothing sets either width any other way. (Measured in a browser at 1440,
// 820, 390 and 360 when it was introduced.)
test("example cards and assistant replies share one width token", async () => {
    // Comments out first: they sit between rules and carry no braces, so a
    // selector read as "everything since the last brace" would include them.
    const css = (await Bun.file("./public/styles.css").text()).replace(
        /\/\*[\s\S]*?\*\//g,
        "",
    );
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
        sel: m[1]!.trim(),
        body: m[2]!,
    }));
    const decl = (body: string, prop: string) =>
        new RegExp(`(?:^|[;\\s])${prop}\\s*:\\s*([^;]+);`)
            .exec(body)?.[1]
            ?.trim();
    // Every rule that sizes a reply bubble sizes it by the token.
    const replyWidths = rules
        .filter(
            (r) =>
                /(^|,\s*)\.nm-ex-a\s*$/.test(r.sel) ||
                /\.nm-ex-a(\s*,|$)/.test(r.sel),
        )
        .map((r) => decl(r.body, "max-width"))
        .filter(Boolean);
    expect(replyWidths).toEqual(["var(--ex-reply-w)"]);
    // The card in a thread takes that token as its width.
    const card = rules.find(
        (r) => r.sel === ".nm-ex-chat .nm-ex-thread > .nm-widget-card",
    );
    expect(card, "the thread card width rule").toBeTruthy();
    expect(decl(card!.body, "width")).toBe("var(--ex-reply-w)");
    expect(decl(card!.body, "align-self")).toBe("flex-start");
    // No other rule gives a thread card a width or stretches it back.
    for (const r of rules)
        if (r.sel.includes(".nm-ex-thread > .nm-widget-card") && r !== card)
            expect(
                `${r.sel}: ${/(^|[;\s])(max-)?width\s*:|align-self/.test(r.body)}`,
            ).toBe(`${r.sel}: false`);
    // The token is only ever set on .nm-ex-chat, as a percentage.
    const sets = rules.filter((r) => /--ex-reply-w\s*:/.test(r.body));
    expect(sets.map((r) => r.sel)).toEqual([
        ".nm-ex-chat",
        ".nm-ex-chat",
        ".nm-ex-chat",
    ]);
    for (const r of sets)
        expect(decl(r.body, "--ex-reply-w")).toMatch(/^\d+%$/);
});

// The examples carousel is equal-height by CSS alone: the track stretches
// every slide to the tallest one (public/styles.css), so changing slide never
// moves anything below it, with or without script. The script used to set the
// track to the ACTIVE slide's height on every change, and that is exactly the
// jump this replaced: a script that sizes the track again, or a track that
// stops stretching, brings it back without failing anything else. Every chat
// window also ends in the composer that makes a short slide's spare room read
// as a chat window rather than a gap.
test("the examples track is equal-height by CSS, and the script never sizes it", async () => {
    // Only the carousel's part of the script: the hero, the map and the
    // stats may size or observe things of their own.
    const start = LANDING_SCRIPT.indexOf('querySelector("[data-ex-track]")');
    const end = LANDING_SCRIPT.indexOf("// ---------- live stats");
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const carousel = LANDING_SCRIPT.slice(start, end);
    const sizes =
        /style\.(min|max)?[hH]eight|setProperty\(\s*["'](min-|max-)?height|cssText/;
    expect(`sizes something: ${sizes.test(carousel)}`).toBe(
        "sizes something: false",
    );
    expect(`observes a size: ${carousel.includes("ResizeObserver")}`).toBe(
        "observes a size: false",
    );
    const css = await Bun.file("./public/styles.css").text();
    const track = /\n\.nm-ex-track \{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(track).toContain("align-items: stretch;");
    // No other rule, media query included, may undo that: a track that
    // aligns its slides any other way, or a slide that aligns itself.
    for (const [, rule] of css.matchAll(
        /\n\s*[^{}\n]*\.nm-ex-(?:track|slide)\s*\{([^}]*)\}/g,
    )) {
        expect(rule).not.toMatch(/align-self|align-items:(?!\s*stretch)/);
    }
    const pages = await landingPages();
    expect(pages.length).toBeGreaterThan(0);
    for (const { path, html } of pages) {
        expect(
            `${path}: styled track ${/<div class="nm-ex-track"[^>]*\sstyle=/.test(html)}`,
        ).toBe(`${path}: styled track false`);
        const slides = (
            html.match(/<div class="nm-ex-slide"[^>]*data-ex-slide>/g) ?? []
        ).length;
        const composers = (
            html.match(/<div class="nm-ex-compose" aria-hidden="true">/g) ?? []
        ).length;
        expect(slides).toBeGreaterThan(0);
        expect(`${path}: ${composers} composers`).toBe(
            `${path}: ${slides} composers`,
        );
    }
    // THE CONVERSATION SCROLLS INSIDE A FIXED WINDOW. Eight threads carry a
    // real card, so a thread that sized to its content would make every
    // slide as tall as the longest conversation plus its card. The thread
    // must contribute no height of its own (flex-basis 0, min-height 0) and
    // scroll instead, with the window's floor holding the footprint.
    const thread = /\n\.nm-ex-thread \{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(thread).toContain("flex: 1 1 0;");
    expect(thread).toContain("min-height: 0;");
    // Size containment is insurance on top of the basis: it keeps the
    // content from counting should a later rule override flex-basis again
    // (a second .nm-ex-thread rule with flex: 1 0 auto once grew every slide).
    expect(thread).toContain("contain: size;");
    expect(thread).toContain("overflow-y: auto;");
    // Scrolling must chain to the page at the thread's ends.
    expect(thread).not.toContain("overscroll-behavior");
    const chat = /\n\.nm-ex-chat \{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(chat).toMatch(/min-height: \d+px;/);
});

// Each chat window's conversation scrolls, so it is a keyboard stop: a named
// region a keyboard can focus and scroll with the arrow keys, in the page's
// language — and the carousel starts each newly active slide's conversation
// at its first message.
test("every example thread is a named, focusable region", async () => {
    const pages = await landingPages();
    expect(pages.length).toBeGreaterThan(0);
    for (const { locale, path, html } of pages) {
        const label = INDEX[locale]!.examples.threadLabel;
        expect(`${locale} threadLabel: ${Boolean(label?.trim())}`).toBe(
            `${locale} threadLabel: true`,
        );
        const slides = INDEX[locale]!.examples.slides.length;
        const threads = html.match(/<div class="nm-ex-thread"[^>]*>/g) ?? [];
        expect(`${path}: ${threads.length} threads`).toBe(
            `${path}: ${slides} threads`,
        );
        for (const t of threads)
            expect(t).toBe(
                `<div class="nm-ex-thread" role="region" aria-label="${attr(label)}" tabindex="0" data-ex-thread>`,
            );
    }
    const start = LANDING_SCRIPT.indexOf('querySelector("[data-ex-track]")');
    const carousel = LANDING_SCRIPT.slice(start);
    expect(carousel).toContain('querySelector("[data-ex-thread]")');
    expect(carousel).toContain("scrollTop = 0");
    // A drawer opened inside a card is focused with preventScroll, so the
    // script scrolls the THREAD to it — never the page (no scrollIntoView).
    expect(carousel).toContain('"focusin"');
    expect(
        carousel.slice(0, carousel.indexOf("// ---------- live stats")),
    ).not.toContain("scrollIntoView");
});

// The other half of the header's spy contract (src/alt-pages.test.ts pins
// the markup): site.js must treat the Connect CTA as a spy link and read
// the extra section ids off data-spy-also, or the CTA silently never lights.
test("site.js spies the header CTA and reads its data-spy-also ids", async () => {
    const siteJs = await Bun.file("./public/site.js").text();
    expect(siteJs).toContain("a.head-cta[href*='#']");
    expect(siteJs).toContain('getAttribute("data-spy-also")');
});

// A SLIDE'S CARDS ENTER WHEN THE SLIDE IS FIRST SEEN. In chat a card draws in
// as it renders; the slides render with the page, off-screen, and their
// entrances ran out unseen. The script marks a slide data-seen once it is
// active and in view, and until then styles.css holds its cards at rest. A
// slide swiped in with its card already painted skips to the end of that
// card's entrances instead of restarting them under the reader.
test("example cards hold their entrance until their slide is seen", async () => {
    const css = (await Bun.file("./public/styles.css").text()).replace(
        /\s+/g,
        " ",
    );
    expect(css).toContain(
        "html.js .nm-ex-slide:not([data-seen]) .nm-widget-card *, html.js .nm-ex-slide:not([data-seen]) .nm-widget-card *::before,",
    );
    expect(css).toContain("animation-name: none !important;");
    const start = LANDING_SCRIPT.indexOf("function exMarkSeen(");
    expect(start).toBeGreaterThan(-1);
    const seen = LANDING_SCRIPT.slice(
        start,
        LANDING_SCRIPT.indexOf("if (typeof IntersectionObserver", start),
    );
    expect(seen).toContain('s.setAttribute("data-seen", "")');
    expect(seen).toContain('s.classList.contains("is-entering")');
    expect(seen).toContain("getAnimations({ subtree: true })");
    expect(seen).toContain("t.endTime !== Infinity");
    expect(LANDING_SCRIPT).toContain(
        "exActive = i;\n                        exMarkSeen();",
    );
});

// The importer's pictures other than the last drop their whole foot, not just
// the settings note, or its hairline and padding frame nothing.
test("the importer's non-done pictures drop their whole foot", async () => {
    const css = (await Bun.file("./public/styles.css").text()).replace(
        /\s+/g,
        " ",
    );
    expect(css).toContain(
        '.nm-ex-thread [data-import-step]:not([data-import-step="done"]) [data-widget-foot] {',
    );
});

// The hero thread's inset focus ring is scoped through its parent, so the
// site's generic `body [tabindex]:focus-visible` (0,2,1) cannot outrank it.
test("the hero thread's own inset focus ring wins over the site's", async () => {
    const css = (await Bun.file("./public/styles.css").text()).replace(
        /\s+/g,
        " ",
    );
    expect(css).toContain(".nm-chat .nm-chat-list:focus-visible {");
});
