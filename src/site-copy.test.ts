import { test, expect } from "bun:test";
import { INDEX } from "./copy/index.js";
import type { SiteLocale } from "./routes.js";

// The public pages are the only place the product describes ITSELF, and they
// are the surface that goes stale first: a nutrient ships across the server,
// the widgets, the importer and the tool descriptions, and the landing page
// keeps listing the old set. Caffeine did exactly that — README.md,
// public/llms.txt and public/tools.html named it while public/index.html and
// the generated comparison pages still enumerated the tracked set without it,
// so a visitor read "caffeine is not tracked" while their assistant was told
// it was. These tests pin the enumerations, not the prose around them.

const normalize = (s: string) =>
    s
        .replace(/\s+/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&#39;|&rsquo;/g, "'")
        .trim();

const index = await Bun.file("./public/index.html").text();

// The FAQ answer exists twice: once as JSON-LD, which is what Google indexes
// and may surface as a rich result, and once as the visible <details> a human
// reads. Two copies of one sentence is a drift generator — this is the guard.
function trackAnswers() {
    const jsonLd = index.match(
        /"name": "What can I track\?",\s*"acceptedAnswer": \{\s*"@type": "Answer",\s*"text": "([^"]+)"/,
    )?.[1];
    const visible = index.match(
        /<summary>What can I track\?<\/summary>\s*<p>([\s\S]*?)<\/p>/,
    )?.[1];
    return { jsonLd, visible };
}

test("the landing page's two 'What can I track?' answers say the same thing", () => {
    const { jsonLd, visible } = trackAnswers();
    expect(jsonLd).toBeTruthy();
    expect(visible).toBeTruthy();
    expect(normalize(visible!)).toBe(normalize(jsonLd!));
});

test("both name caffeine, and name it in milligrams", () => {
    const { jsonLd, visible } = trackAnswers();
    for (const answer of [jsonLd!, visible!]) {
        const t = normalize(answer);
        expect(t).toContain("Caffeine");
        expect(t).toContain("milligrams");
    }
});

// The two feature cards that enumerate what is logged and what limits can be
// set. The barcode card is deliberately excluded: Open Food Facts' caffeine
// path is out of scope, so lookup_barcode still leaves caffeine null and the
// card must keep saying so by omission.
test("the landing page's feature cards list caffeine where they list nutrients", () => {
    const cards = [
        ...index.matchAll(/<h3>([^<]+)<\/h3>\s*<p>([\s\S]*?)<\/p>/g),
    ];
    const byTitle = new Map(
        cards.map((m) => [normalize(m[1]!), normalize(m[2]!)]),
    );

    const meals = byTitle.get("Meals in plain language");
    expect(meals).toBeTruthy();
    expect(meals).toContain("caffeine");

    const goals = byTitle.get("Goals & progress");
    expect(goals).toBeTruthy();
    expect(goals).toContain("caffeine");

    // And the one that must NOT claim it.
    const barcode = byTitle.get("Scan a barcode");
    expect(barcode).toBeTruthy();
    expect(barcode).not.toContain("caffeine");
});

// The comparison pages are generated. Editing the HTML directly is silently
// undone by the next `bun run scripts/gen-alternatives.ts`, so the copy has to
// be right in the source data AND regenerated — this asserts both halves
// landed. The shared template prose (feature grid, comparison column) lives
// in src/copy/alt-ui.ts, not the generator itself — see that file's doc
// comment for why it was split out.
const altUi = await Bun.file("./src/copy/alt-ui.ts").text();

test("the comparison-page copy names caffeine in the tracked set", () => {
    expect(altUi).toContain("caffeine");
    // The shared right-hand column and the shared feature card, which every
    // page carries verbatim.
    expect(altUi).toContain(
        "calories, macros, fiber, sugar &amp; caffeine estimated for you",
    );
});

test("every generated comparison page is in step with it", async () => {
    const files = [
        "cronometer",
        "myfitnesspal",
        "lose-it",
        "macrofactor",
        "yazio",
        "lifesum",
    ];
    for (const slug of files) {
        const html = await Bun.file(
            `./public/alternatives/${slug}.html`,
        ).text();
        expect(html.toLowerCase(), `${slug}.html omits caffeine`).toContain(
            "caffeine",
        );
    }
});

// Cronometer is the one export in the list that actually ships a
// "Caffeine (mg)" column, which the importer's ALIASES table auto-maps — so
// its page is the one that would be actively wrong, not merely incomplete,
// if it kept telling switchers their caffeine history stays behind.
test("the Cronometer page says its caffeine column crosses over", async () => {
    const html = normalize(
        await Bun.file("./public/alternatives/cronometer.html").text(),
    );
    expect(html).toContain("Caffeine (mg) column");
    // And the 1000x guard is explained rather than left as a blank row.
    expect(html).toContain("headed in grams is left unmapped");
    // The out-of-scope claim is still not made anywhere on the page.
    expect(html).not.toContain("caffeine from Open Food Facts");
});

// What `export_all_data` puts in the ZIP. Every page now makes some version of
// an "everything" claim — the landing page's export card, its trust badge,
// llms.txt, the tool card, and the switching-cost card on all six comparison
// pages — and "everything" is only true relative to this list. Add a table to
// the schema, leave the archive as it is, and each of those claims turns false
// with nothing to catch it, which is the caffeine failure again in a different
// costume. So the copy is pinned to the file names, not to the adjectives.
const ARCHIVE_FILES = [
    "meals.csv",
    "water.csv",
    "weight.csv",
    "goals.csv",
    "profile.csv",
    "README.txt",
];
// The tables behind those CSVs, as the prose names them.
const ARCHIVE_TABLES = ["meals", "water", "weight", "goals", "profile"];

// The list above is a mirror, and mirrors drift. src/export.ts owns the real
// archive, so whenever it names its members, the two must agree exactly — a
// seventh file added there, or one dropped, fails here before the pages can go
// quietly stale. (It is matched against the source text rather than imported:
// src/export.ts reaches for Supabase credentials at call time, and a copy
// guard should not need them.)
test("the pinned archive list matches what src/export.ts actually writes", async () => {
    const exportSrc = await Bun.file("./src/export.ts").text();
    const named = [
        ...new Set(
            [...exportSrc.matchAll(/["'`]([A-Za-z0-9_.-]+\.(?:csv|txt))["'`]/g)]
                .map((m) => m[1]!)
                // Only bare file names are archive members; anything with a
                // path in front of it is a storage key, not a ZIP entry.
                .filter((name) => !name.includes("/")),
        ),
    ].sort();
    // A scrape that finds nothing is the failure mode this guard is most
    // likely to die of — rename a constant, change how the names are written,
    // and an empty set would quietly agree with everything. Demand a non-empty
    // match, so a broken regex fails loudly instead of passing vacuously.
    expect(
        named.length,
        "scraped no archive file names out of src/export.ts — this guard's regex has gone stale, not the copy",
    ).toBeGreaterThan(0);
    expect(
        named,
        "src/export.ts and this test's ARCHIVE_FILES disagree — whatever the archive gained or lost has to reach the public copy too",
    ).toEqual([...ARCHIVE_FILES].sort());
});

test("the landing page's export card names every table in the archive", () => {
    const cards = [
        ...index.matchAll(/<h3>([^<]+)<\/h3>\s*<p>([\s\S]*?)<\/p>/g),
    ];
    const card = new Map(
        cards.map((m) => [normalize(m[1]!), normalize(m[2]!)]),
    ).get("Export & own your data");
    expect(card).toBeTruthy();
    for (const table of ARCHIVE_TABLES) {
        expect(card, `export card omits ${table}`).toContain(table);
    }
    // And the half of the claim that is easy to over-promise: the ZIP comes
    // out, but only meals go back in.
    expect(card).toContain("only part that can be imported back in");
});

test("tools.html documents export_all_data and what is in the ZIP", async () => {
    const tools = await Bun.file("./public/tools.html").text();
    // Prettier wraps the tag when the name is long enough, so match the pair
    // loosely rather than pinning today's line breaks.
    expect(tools).toMatch(
        /<code class="tool-name"\s*>\s*export_all_data\s*<\/code\s*>/,
    );
    expect(tools).toContain('id="export_all_data"');
    const normalized = normalize(tools);
    for (const file of ARCHIVE_FILES) {
        expect(normalized, `tools.html omits ${file}`).toContain(file);
    }
    // The tool count in the title, the meta/OG descriptions and the count pill
    // is the number of cards below it, and a card added without touching those
    // five places is the classic way this page goes wrong.
    // Counted on the normalized text: prettier wraps the opening tag once the
    // attributes get long, so the raw file spells this two different ways.
    const cardCount = [...normalized.matchAll(/<article class="tool-card"/g)]
        .length;
    for (const claim of [...normalized.matchAll(/(?:all|All) (\d+) [Tt]ools/g)])
        expect(
            Number(claim[1]),
            `"${claim[0]}" disagrees with the ${cardCount} tool cards on the page`,
        ).toBe(cardCount);
    expect(normalized).toContain(`<b>${cardCount} tools</b>`);
    // export_meals was removed, not kept beside the archive; a lingering card
    // documents a tool the server will not answer to.
    expect(normalized).not.toContain("export_meals");
});

test("llms.txt names the export tool and the archive members", async () => {
    const llms = await Bun.file("./public/llms.txt").text();
    expect(llms).toContain("export_all_data");
    // The meals-only tool was removed rather than kept alongside the archive.
    // An LLM reading a stale mention would hand the user a tool name the
    // server no longer answers to.
    expect(llms).not.toContain("export_meals");
    for (const file of ARCHIVE_FILES) {
        expect(llms, `llms.txt omits ${file}`).toContain(file);
    }
    // Water, weight, goals and profile leave but do not return, and an LLM
    // reading this file is exactly who would otherwise promise a round trip.
    expect(llms).toContain("export-only");
});

// The strongest switching-cost line on the comparison pages is that all of the
// data comes back out, so it has to enumerate what "all" means — in the
// source copy, and in the six pages that were regenerated from it.
test("the comparison-page card names every table it promises back", async () => {
    for (const table of ARCHIVE_TABLES) {
        expect(altUi, `alt-ui.ts omits ${table}`).toContain(table);
    }
    expect(altUi).toContain("Take everything back out whenever you want");

    for (const slug of [
        "cronometer",
        "myfitnesspal",
        "lose-it",
        "macrofactor",
        "yazio",
        "lifesum",
    ]) {
        const html = normalize(
            await Bun.file(`./public/alternatives/${slug}.html`).text(),
        );
        expect(
            html,
            `${slug}.html was not regenerated from alt-ui.ts`,
        ).toContain(
            "one ZIP with your meals, water, weight, goals and profile",
        );
    }
});

// The kg / lb toggle in the landing page's live-stats panel. Its visible text
// is the bare symbol — hardcoded in scripts/gen-index.ts, never localized —
// while the accessible name is the spelled-out unit, so WCAG 2.5.3 Label in
// Name only holds while the name CONTAINS the symbol: a voice-control user
// saying "click lb" is otherwise addressing a control named "Pounds", and
// nothing happens. de/nl/fr paired word and symbol first, for the unrelated
// reason that their word for "pound" is 500 g (see src/copy/index.de.ts);
// these two tests are what make the pairing the rule for every locale rather
// than a coincidence in three, including a locale added later.
test("every locale's unit-toggle accessible name contains its symbol", () => {
    const locales = Object.keys(INDEX) as SiteLocale[];
    // Guard the guard: an empty INDEX would make the loop vacuously pass.
    expect(locales).toContain("en");
    for (const locale of locales) {
        const stats = INDEX[locale]!.stats;
        expect(
            stats.unitKgLabel,
            `${locale}: unitKgLabel must contain the visible "kg"`,
        ).toContain("kg");
        expect(
            stats.unitLbLabel,
            `${locale}: unitLbLabel must contain the visible "lb"`,
        ).toContain("lb");
    }
});

// And the same thing one step later, on the rendered page: the pairing only
// reaches a user if the generator was re-run, and this reads the visible text
// out of the same markup as the name instead of trusting that the symbol is
// still what the button shows.
test("each unit button's aria-label contains that button's visible text", async () => {
    for (const locale of Object.keys(INDEX) as SiteLocale[]) {
        // gen-index.ts writes exactly one page per INDEX entry, so a missing
        // file here is a page that was never regenerated.
        const path =
            locale === "en"
                ? "./public/index.html"
                : `./public/${locale}/index.html`;
        const html = await Bun.file(path).text();
        const buttons = [
            ...html.matchAll(
                /<button\b([^>]*\bdata-unit="(kg|lb)"[^>]*)>([\s\S]*?)<\/button>/g,
            ),
        ];
        expect(
            buttons.map((m) => m[2]),
            `${path}: the kg and lb buttons`,
        ).toEqual(["kg", "lb"]);
        for (const [, attrs, unit, body] of buttons) {
            const name = /aria-label="([^"]*)"/.exec(attrs!)?.[1];
            const visible = body!.trim();
            expect(
                visible,
                `${path}: the ${unit} button's visible text is not the bare symbol`,
            ).toBe(unit!);
            expect(
                name,
                `${path}: the ${unit} button has no aria-label`,
            ).toBeTruthy();
            expect(
                name!,
                `${path}: aria-label "${name}" does not contain the visible "${visible}" (WCAG 2.5.3 Label in Name)`,
            ).toContain(visible);
        }
    }
});
