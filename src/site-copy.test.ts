import { test, expect } from "bun:test";
import { INDEX } from "./copy/index.js";
import type { SiteLocale } from "./routes.js";
import { WIDGET_STRINGS } from "./copy/widgets.js";

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

/** The visible answer under a FAQ question. The landing page's FAQ rows are
 *  `<details class="nm-faq-row"><summary>` with the question wrapped in
 *  spans (number, question + category chip, plus/minus icon), so this
 *  anchors on the question's text node rather than on `<summary>Q</summary>`
 *  and takes the first <p> after that summary closes. */
function visibleFaqAnswer(html: string, question: string): string | undefined {
    const q = question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return html.match(
        new RegExp(
            `<span class="nm-faq-q">${q}\\s*<span[\\s\\S]*?</summary>\\s*<p>([\\s\\S]*?)</p>`,
        ),
    )?.[1];
}

// The FAQ answer exists twice: once as JSON-LD, which is what Google indexes
// and may surface as a rich result, and once as the visible <details> a human
// reads. Two copies of one sentence is a drift generator — this is the guard.
function trackAnswers() {
    const jsonLd = index.match(
        /"name": "What can I track\?",\s*"acceptedAnswer": \{\s*"@type": "Answer",\s*"text": "([^"]+)"/,
    )?.[1];
    const visible = visibleFaqAnswer(index, "What can I track?");
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

// The hero lead is where the landing page enumerates what gets tracked —
// "calories, protein, carbs, fat, fiber, sugar and caffeine" — and the one
// sentence a visitor is guaranteed to read. It is also what the meta
// description and the JSON-LD SoftwareApplication carry, so the four
// copies are pinned together.
test("the hero lead enumerates the tracked set, caffeine included", () => {
    const lead = index.match(/<p class="nm-lead">([\s\S]*?)<\/p>/)?.[1];
    expect(lead).toBeTruthy();
    const t = normalize(lead!);
    for (const nutrient of [
        "calories",
        "protein",
        "carbs",
        "fat",
        "fiber",
        "sugar",
        "caffeine",
    ]) {
        expect(t, `hero lead omits ${nutrient}`).toContain(nutrient);
    }
    // The summary card in the hero chat carries a caffeine tile too — the
    // static render is what a crawler and a no-JS visitor see, and it is the
    // real get_nutrition_summary card, so the word on that tile comes from
    // WIDGET_STRINGS rather than from this file's copy. Pinned against the
    // dictionary, with its unit, so a locale renaming the metric or the tile
    // vanishing (a caffeine-free demo payload suppresses it — a limit with
    // nothing recorded against it is not drawn) both fail here.
    const caffeine = WIDGET_STRINGS.en!.macros.labels.caffeine_mg;
    expect(caffeine.length).toBeGreaterThan(0);
    const tile = index.match(
        /<button class="chip c-caf"[\s\S]*?<\/button>/,
    )?.[0];
    expect(tile, "no caffeine tile on the hero card").toBeTruthy();
    expect(normalize(tile!)).toContain(`<span class="k">${caffeine}</span>`);
    expect(normalize(tile!)).toContain('<span class="u">/400 mg</span>');
    const meta = index.match(/<meta name="description" content="([^"]*)"/)?.[1];
    expect(normalize(meta ?? "")).toContain("caffeine");
});

// The barcode exchange is deliberately excluded from that claim: Open Food
// Facts' caffeine path is out of scope, so lookup_barcode still leaves
// caffeine null and the hero's barcode reply must keep saying so by
// omission — its deltas add no caffeine to the widget, in any locale (the
// deltas are the same numbers on every page, see HeroExchange.add).
test("the hero's barcode exchange does not claim caffeine", () => {
    const locales = Object.keys(INDEX) as SiteLocale[];
    expect(locales).toContain("en");
    for (const locale of locales) {
        const barcode = INDEX[locale]!.hero.chat.exchanges.filter(
            (ex) => ex.barcode,
        );
        expect(barcode.length, `${locale}: one barcode exchange`).toBe(1);
        expect(
            barcode[0]!.add.caf,
            `${locale}: the barcode reply must not add caffeine`,
        ).toBeUndefined();
        expect(normalize(barcode[0]!.aiText).toLowerCase()).not.toContain(
            "caffeine",
        );
    }
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
// an "everything" claim — the landing page's export FAQ, its "always free"
// bullets, llms.txt, the tool card, and the switching-cost card on all six
// comparison pages — and "everything" is only true relative to this list.
// Add a table to the schema, leave the archive as it is, and each of those
// claims turns false with nothing to catch it, which is the caffeine failure
// again in a different costume. So the copy is pinned to the file names, not
// to the adjectives.
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

// The landing page's export claim moved from a feature card into the FAQ
// ("Who can see my data, and can I export it?"), and the half of it that is
// easy to over-promise — the ZIP comes out, but only meals go back in — sits
// in the import FAQ next to it. Both are read out of the visible answers, so
// the copy AND the regeneration have to be right; the JSON-LD twin of each
// is derived from the same field by the generator.
test("the landing page's export FAQ names every table in the archive", () => {
    const answer = visibleFaqAnswer(
        index,
        "Who can see my data, and can I export it?",
    );
    expect(answer).toBeTruthy();
    const t = normalize(answer!);
    for (const table of ARCHIVE_TABLES) {
        expect(t, `export FAQ omits ${table}`).toContain(table);
    }
});

test("the landing page's import FAQ says only meals come back in", () => {
    const answer = visibleFaqAnswer(
        index,
        "Can I import my MyFitnessPal or Cronometer history?",
    );
    expect(answer).toBeTruthy();
    expect(normalize(answer!)).toContain(
        "Meals are the only part that can be imported back in for now.",
    );
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

// The Metric / Imperial toggle in the landing page's live-stats board. Its
// visible text IS its accessible name — "Metric" / "Imperial", translated
// per locale, with no aria-label layered over it — so WCAG 2.5.3 Label in
// Name holds by construction as long as nobody adds one. The two data-unit
// values stay "kg" / "lb" regardless of locale: they are the stored
// preference key's vocabulary (stats-unit in localStorage) and what the
// script's en-US default writes, not anything a visitor reads. Two halves
// pinned: the source labels exist and differ (a locale that copied one into
// the other renders two identical pills), and the rendered buttons carry no
// aria-label that could name them something other than what they show.
test("every locale's unit labels are present and distinct", () => {
    const locales = Object.keys(INDEX) as SiteLocale[];
    // Guard the guard: an empty INDEX would make the loop vacuously pass.
    expect(locales).toContain("en");
    for (const locale of locales) {
        const live = INDEX[locale]!.live;
        expect(
            live.unitMetricLabel.trim().length,
            `${locale}: metric`,
        ).toBeGreaterThan(0);
        expect(
            live.unitImperialLabel.trim().length,
            `${locale}: imperial`,
        ).toBeGreaterThan(0);
        expect(
            live.unitMetricLabel,
            `${locale}: the two unit labels are identical`,
        ).not.toBe(live.unitImperialLabel);
    }
});

test("each unit button's visible text is its accessible name", async () => {
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
        const live = INDEX[locale]!.live;
        for (const [, attrs, unit, body] of buttons) {
            const visible = normalize(body!);
            expect(
                visible,
                `${path}: the ${unit} button's visible text is not the locale's label`,
            ).toBe(
                normalize(
                    unit === "kg"
                        ? live.unitMetricLabel
                        : live.unitImperialLabel,
                ),
            );
            // No aria-label: the visible word is the name. An aria-label
            // that does not contain the visible text would break voice
            // control ("click Metric" addressing a control named "Kilograms").
            const name = /aria-label="([^"]*)"/.exec(attrs!)?.[1];
            if (name !== undefined) {
                expect(
                    normalize(name),
                    `${path}: aria-label "${name}" does not contain the visible "${visible}" (WCAG 2.5.3 Label in Name)`,
                ).toContain(visible);
            }
        }
    }
});
