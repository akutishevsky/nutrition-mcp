import { test, expect } from "bun:test";
import { HTML_LANG, SITE_LOCALES, type SiteLocale } from "./routes.js";
import { INDEX } from "./copy/index.js";
import { LANDING_SCRIPT } from "../scripts/gen-index.js";
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
// static hero thread (each user bubble's data-add / data-clock, cloned and
// replayed), the translated word on the food-logs delta tag
// (data-delta-unit), the countdown / since-open spans inside #facts-live,
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

// The hero chat replays the STATIC thread: the script takes the generator's
// bubbles apart into exchanges (a user or barcode bubble followed by its AI
// reply), reads each one's clock off data-clock, and clones the bubbles back
// in one at a time. So the static markup is the whole contract — it is also
// what a no-JS visitor and every crawler read. Pinned per locale against the
// source data: one user bubble per exchange, in order, carrying the clock the
// copy declares.
//
// Two attributes the bubbles used to carry are gone, because nothing reads
// them any more and an attribute nothing reads is a contract that only looks
// live. The nutrient deltas are build-time input now — scripts/gen-index.ts
// sums them per exchange into a real get_nutrition_summary payload — and
// which exchange the card follows is on the card, as data-hero-card. Both
// are pinned below against IndexDoc, on the element that carries them.
const BUBBLE_RE =
    /<div class="nm-msg (nm-msg-user|nm-msg-barcode)" data-clock="([^"]*)">([\s\S]*?)(?=\n\s*<div class="nm-msg nm-msg-ai">)/g;

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
            const [, kind, clock, body] = m;
            const ex = exchanges[i]!;
            expect(`${path} #${i}: ${kind}`).toBe(
                `${path} #${i}: ${ex.barcode ? "nm-msg-barcode" : "nm-msg-user"}`,
            );
            expect(`${path} #${i}: ${clock}`).toBe(
                `${path} #${i}: ${ex.clock}`,
            );
            if (!ex.barcode)
                expect(`${path} #${i}: ${stripTags(body!)}`).toBe(
                    `${path} #${i}: ${text(ex.userText ?? "")}`,
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

// WHICH EXCHANGES THE CARD FOLLOWS. This is what `HeroExchange.widget`
// declares and what the replay resolves a card by: `data-hero-card` lists the
// exchange indices one card is brought in after, space-separated, because a
// widget exchange that logged nothing new shares the card before it rather
// than emitting a byte-identical second copy. Every flagged exchange must be
// covered exactly once, or the replay reaches an exchange that says a card is
// due and has none to show.
test("every widget exchange has a hero card, and no exchange has two", async () => {
    for (const { locale, path, html } of await landingPages()) {
        const exchanges = INDEX[locale]!.hero.chat.exchanges;
        const flagged = exchanges.flatMap((ex, i) => (ex.widget ? [i] : []));
        expect(
            flagged.length,
            `${locale}: the copy flags a widget`,
        ).toBeGreaterThan(0);
        const served = [...html.matchAll(/\sdata-hero-card="([^"]*)"/g)]
            .flatMap((m) => m[1]!.split(" "))
            .map(Number)
            .sort((a, b) => a - b);
        expect(`${path}: hero cards after ${served.join(",")}`).toBe(
            `${path}: hero cards after ${flagged.join(",")}`,
        );
    }
});

// WHERE THE THREAD'S NUTRIENTS ACTUALLY LAND.
//
// This used to read three painted <span data-w> figures, a data-goal per bar
// and a `--deg` on the ring out of a hand-built mock, which meant it pinned
// the mock's arithmetic and nothing else. The mock is gone: the hero card is
// the real get_nutrition_summary card, rendered by the widget's own emitters
// from a real payload, so what is worth pinning is that the payload the page
// ships is (a) a payload the TOOL could have sent, and (b) the thread's own
// deltas summed. Both are checked against the live outputSchema and against
// IndexDoc, not against anything this file restates — and the card's own
// bytes are pinned verbatim in src/widget-card.test.ts.
const heroPayloadOf = (html: string): unknown =>
    JSON.parse(
        html.match(
            /<script type="application\/json" data-widget-payload="nutrition-summary">([\s\S]*?)<\/script>/,
        )?.[1] ?? "null",
    );

test("the hero card ships a payload the tool's own schema accepts", async () => {
    const schema = collectOutputSchemas().get("get_nutrition_summary");
    expect(schema, "get_nutrition_summary has an outputSchema").toBeTruthy();
    for (const { locale, path, html } of await landingPages()) {
        const payload = heroPayloadOf(html);
        expect(`${path}: has a payload`).toBe(
            `${path}: ${payload ? "has a payload" : "no payload"}`,
        );
        // parse() throws on a missing or mistyped field; droppedKeys names the
        // ones z.object() silently STRIPS, which is how a renamed key reaches
        // the page and never reaches the widget.
        const parsed = schema!.parse(payload);
        expect(
            `${path}: dropped ${[...droppedKeys(payload, parsed)].join(",")}`,
        ).toBe(`${path}: dropped `);
        // The runtime resolves which dictionary to repaint in from this field
        // (boot.js -> setLocaleFrom). "en" on /de leaves a German card correct
        // until the first tap and English afterwards, with nothing failing.
        expect(
            `${path}: payload locale ${(payload as { locale: string }).locale}`,
        ).toBe(`${path}: payload locale ${locale}`);
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
        // The hero's summary cards, one per cumulative state of the thread.
        // Missing, the thread replays without ever showing a card — and it
        // is the card the whole hero exists to demonstrate.
        ['querySelectorAll("[data-hero-card]")', "data-hero-card="],
        ['querySelector("[data-countdown]")', "<b data-countdown>"],
        ['querySelector("[data-countdown-ring]")', "data-countdown-ring>"],
        ['querySelector("[data-since-open]")', "<span data-since-open>"],
        ['querySelector(".nm-tz-tip")', 'class="nm-tz-tip"'],
        ['querySelectorAll("[data-unit]")', 'data-unit="kg"'],
        ['querySelectorAll("[data-gh-stars]")', "<span data-gh-stars>"],
        ["[data-ex-dir]", 'data-ex-dir="prev"'],
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
// The "Live" nav badge is driven from public/site.js, which every page
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
