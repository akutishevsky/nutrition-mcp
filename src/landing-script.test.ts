import { test, expect } from "bun:test";
import { HTML_LANG, SITE_LOCALES, type SiteLocale } from "./routes.js";
import { INDEX } from "./copy/index.js";
import { LANDING_SCRIPT } from "../scripts/gen-index.js";

// The landing page's inline JS lives as one hand-escaped string constant
// (LANDING_SCRIPT in scripts/gen-index.ts) that is embedded verbatim into all
// nine locales' index.html. Nothing else in the suite looks inside it, so
// every i18n fix in it was revertible without a red test.
//
// Two halves here, and the DOM-contract half is the load-bearing one. The
// script deliberately holds no copy of its own — one script serves nine
// pages, so any language it named in its own source would be wrong on eight
// of them. Instead it READS three things out of the markup the generator
// produced: <html lang> (drives every number and the clock), the translated
// word already sitting in #facts-live, and the translated caption in the
// .odo-cap span beside the odometer. Those are contracts between generator
// and script: rename .odo-cap, empty #facts-live, or drop lang= and the
// script silently degrades to English or to a broken locale with no error
// anywhere. The tests below pin them against the real generated HTML.

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

/** Prettier splits long tags as `<span class="x"\n    >text</span\n>`, so the
 *  closing `>` of the open tag cannot be assumed to sit on the same line. */
function spanText(html: string, attr: string): string | null {
    const m = html.match(
        new RegExp(`<span[^>]*${attr}[^>]*>([\\s\\S]*?)</span`),
    );
    return m ? text(m[1]!) : null;
}

/** The landing script is the one bare <script> block that wires the live
 *  stats panel; the others are the pre-paint theme shim and JSON-LD. */
function landingScript(html: string): string | null {
    for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
        const body = m[1]!;
        if (body.includes('getElementById("facts-live")')) return body;
    }
    return null;
}

/** The statement beginning at `start`, up to and including its terminator. */
function statementAt(script: string, start: string, end: string): string {
    const at = script.indexOf(start);
    if (at === -1) return "";
    const stop = script.indexOf(end, at + start.length);
    return stop === -1 ? "" : script.slice(at, stop + end.length);
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
// attribute every figure in the Nutrition Facts panel and the clock beside
// it silently fall back to English grouping on all eight translated pages.
test("every landing page stamps its own <html lang>", async () => {
    for (const { locale, path, html } of await landingPages()) {
        const m = html.match(/<html[^>]*\slang="([^"]+)"/);
        expect(`${path}: ${m?.[1]}`).toBe(`${path}: ${HTML_LANG[locale]}`);
    }
});

// The script captures #facts-live's text before the first stats fetch and
// rebuilds the line from it. An empty node means the live line loses its
// label entirely on every locale, English included.
test("#facts-live carries this locale's own translated live label", async () => {
    for (const { locale, path, html } of await landingPages()) {
        const doc = INDEX[locale];
        expect(`${path}: ${!!doc}`).toBe(`${path}: true`);
        const found = spanText(html, 'id="facts-live"');
        expect(`${path}: ${found}`).toBe(
            `${path}: ${text(doc!.stats.liveLabel)}`,
        );
        expect(`${path}: ${(found ?? "").length > 0}`).toBe(`${path}: true`);
    }
});

// setOdometer copies this into the odometer's aria-label. Rename the class
// and every locale goes back to announcing "N calories tracked" in English
// to screen readers, with the page still looking perfect.
test("the odometer's caption sits in a .odo-cap span, translated", async () => {
    for (const { locale, path, html } of await landingPages()) {
        const doc = INDEX[locale];
        expect(`${path}: ${!!doc}`).toBe(`${path}: true`);
        expect(`${path}: ${spanText(html, 'class="odo-cap"')}`).toBe(
            `${path}: ${text(doc!.stats.calCaption)}`,
        );
    }
});

// The script reaches the caption via `el.parentNode.querySelector(".odo-cap")`
// — so it has to be a SIBLING of the odometer, not merely present somewhere.
// No intervening </div> between the two is exactly that, for this markup.
test("the .odo-cap span is a sibling of the odometer it captions", async () => {
    for (const { path, html } of await landingPages()) {
        const odo = html.indexOf('data-odo="total_calories"');
        const cap = html.indexOf('class="odo-cap"');
        expect(`${path}: ${odo !== -1 && cap > odo}`).toBe(`${path}: true`);
        const between = html.slice(odo, cap);
        expect(`${path}: ${between.includes("</div>")}`).toBe(`${path}: false`);
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

// The live line used to be replaced wholesale with "Live · since " + time,
// throwing away the one translated word on it a second after paint.
test("the live line is rebuilt from the label already on the page", async () => {
    const script = await theScript();
    expect(script).toContain("var liveLabel = liveEl ? liveEl.textContent");
    const assign = statementAt(script, "liveEl.textContent =", ";");
    expect(`live assignment: ${assign.includes("liveLabel")}`).toBe(
        "live assignment: true",
    );
    expect(`live assignment: ${/"Live/.test(assign)}`).toBe(
        "live assignment: false",
    );
});

// The aria-label used to be built as text + " calories tracked" outright.
// The English string survives only as a fallback for a missing caption node,
// so the assertion is that the caption is what is preferred.
test("the odometer announces the caption the page rendered", async () => {
    const script = await theScript();
    expect(script).toContain('querySelector(".odo-cap")');
    const stmt = statementAt(script, "el.setAttribute(", ");");
    expect(`aria-label: ${stmt.includes("capText")}`).toBe("aria-label: true");
    // English strictly after capText in the statement == English is the
    // else-branch. If it ever leads, the caption stopped being preferred.
    const caption = stmt.indexOf("capText");
    const english = stmt.indexOf("calories tracked");
    expect(
        `aria-label fallback last: ${caption !== -1 && caption < english}`,
    ).toBe("aria-label fallback last: true");
});

// The script is a hand-escaped string literal in the generator, so a bad
// edit can ship a syntax error that no typecheck and no test would see.
// new Function compiles without running.
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
// The "Live stats" nav badge is driven from public/site.js, which every page
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
// marker it checks for is #facts-live — the landing page's live indicator.
// That is a generator/script contract exactly like .odo-cap above: rename or
// drop the id and the landing page silently starts polling twice, which no
// assertion elsewhere would notice.
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
