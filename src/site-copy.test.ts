import { test, expect } from "bun:test";
import { INDEX } from "./copy/index.js";
import {
    CATEGORIES,
    TOOLS,
    TOOLS_COPY,
    TROUBLESHOOTING_IDS,
    type ToolsDoc,
    type TroubleshootingId,
} from "./copy/tools.js";
import { chromeFor } from "./copy/chrome.js";
import {
    PRIVACY,
    TERMS,
    type LegalBlock,
    type LegalDoc,
} from "./copy/legal.js";
import { SITE_LOCALES, pathFor, type SiteLocale } from "./routes.js";

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
    "account.csv",
    "telemetry.csv",
    "connections.csv",
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

// Layout itself needs a browser, so what is pinned here is the pair of
// declarations the fix rests on. The calorie odometer is one reel per digit:
// it cannot shrink and cannot break mid-number, so .facts-cal has to be free
// to wrap it onto its own line when the live delta tag joins the row, or the
// digits run out past the panel's right edge at 390px (#129). flex-end is the
// other half: space-between would park the odometer at the LEFT of that
// second line, and it is a no-op on any line holding the label, whose
// margin-right:auto absorbs the free space first.
test("the Nutrition Facts calorie row can wrap its odometer", async () => {
    const css = await Bun.file("./public/styles.css").text();
    // Every bare `.facts-cal {` block, not the first one: a later
    // `@media (max-width: 640px) { .facts-cal { flex-wrap: nowrap } }` wins
    // the cascade at exactly the widths this fix is about, and a
    // first-match-only check would still pass while #129 was back. Requiring
    // the selector to appear once makes adding a second block a loud failure
    // rather than a silent revert. The descendant rules (.facts-cal .label,
    // .facts-cal > :first-child) do not match — the selector has to be
    // followed by the brace.
    const blocks = [...css.matchAll(/\.facts-cal\s*\{([^}]*)\}/g)];
    expect(
        blocks.length,
        "expected exactly one `.facts-cal {` block in public/styles.css",
    ).toBe(1);
    // Anchored on the semicolon so `wrap-reverse` — which would put the
    // odometer ABOVE the label rather than below it — does not read as wrap.
    expect(blocks[0]![1]).toMatch(/flex-wrap:\s*wrap;/);
    expect(blocks[0]![1]).toMatch(/justify-content:\s*flex-end;/);
});

// scripts/gen-tools.ts renders `prose.params[p.name] ?? ""`, so a param added
// to TOOLS but forgotten in one locale file renders as a bare name with no
// description — silently, since ToolProse.params is a plain Record and no
// typecheck notices a missing key. The English source leaves a few params
// deliberately blank (self-explanatory update_meal fields); everywhere English
// has prose, every locale must too, and every locale must at least carry the key.
test("every /tools param has prose in every locale", () => {
    const missing: string[] = [];
    for (const locale of SITE_LOCALES) {
        const doc = TOOLS_COPY[locale];
        if (!doc) {
            missing.push(`${locale}: no ToolsDoc`);
            continue;
        }
        for (const tool of TOOLS) {
            const prose = doc.tools[tool.name];
            if (!prose) {
                missing.push(`${locale}: ${tool.name}`);
                continue;
            }
            for (const param of tool.params) {
                const text = prose.params[param.name];
                const english =
                    TOOLS_COPY.en!.tools[tool.name]!.params[param.name];
                if (typeof text !== "string") {
                    missing.push(`${locale}: ${tool.name}.${param.name}`);
                } else if (english && text.trim() === "") {
                    missing.push(
                        `${locale}: ${tool.name}.${param.name} (empty)`,
                    );
                }
            }
        }
    }
    expect(missing).toEqual([]);
});

// get_trends ranks best/worst day by calories only (computeTrends in
// src/insights.ts); the /tools copy once promised extremes for "each macro".
// Only English is asserted: the 8 locale lines were rewritten in the same
// change and are checked by diff review, since a per-language phrase list
// would pin wording rather than the claim.
test("the /tools get_trends copy does not promise per-macro extremes", () => {
    const prose = TOOLS_COPY.en!.tools.get_trends!.description;
    expect(prose).not.toContain("each macro");
    expect(prose).toContain("by calories");
});

// The privacy policy's "Website analytics" bullet tells a visitor how to
// withdraw consent, by the name of the footer button that does it. That name
// lives in chrome.<locale>.ts and the bullet in legal.<locale>.ts, so a rename
// on either side leaves the policy pointing at a button that no longer exists
// — in that language only. Asserted on the source data, not the generated
// page, so it holds before a regeneration.
const blockText = (b: LegalBlock) => (b.type === "p" ? [b.html] : b.items);

test("every locale's privacy analytics text names its own Cookie settings button", () => {
    const missing: string[] = [];
    for (const locale of SITE_LOCALES) {
        const doc = PRIVACY[locale];
        if (!doc) {
            missing.push(`${locale}: no privacy doc`);
            continue;
        }
        const analytics = doc.sections
            .flatMap((s) => s.blocks.flatMap(blockText))
            .filter((t) => t.includes("Microsoft Clarity"));
        const settings = chromeFor(locale).consent.settings;
        if (!analytics.some((t) => t.includes(settings)))
            missing.push(`${locale}: "${settings}"`);
    }
    expect(missing).toEqual([]);
});

// Before the consent banner the policy said, truthfully, that there was none
// and that GA's IP anonymization was off. Both are false now and are the kind
// of sentence a partial rewrite leaves behind in one locale.
test("no legal source still claims there is no consent banner", async () => {
    // Resolved against this file, not the cwd, and counted: a glob that
    // matches nothing would otherwise pass without checking anything.
    const glob = new Bun.Glob("copy/legal*.ts");
    const stale: string[] = [];
    let scanned = 0;
    for await (const path of glob.scan({
        cwd: import.meta.dir,
        absolute: true,
    })) {
        scanned++;
        const src = await Bun.file(path).text();
        if (/no consent banner/i.test(src))
            stale.push(`${path}: consent banner`);
        if (/IP anonymi/i.test(src)) stale.push(`${path}: IP anonymization`);
    }
    // One file per locale, except that en and de share legal.ts.
    expect(scanned).toBe(SITE_LOCALES.length - 1);
    expect(stale).toEqual([]);
});

// Translation is AI-generated per locale, so a locale can silently drop a
// paragraph of the privacy policy — and a missing paragraph is a policy that
// no longer matches the code in that language. Shape parity (sections,
// blocks per section, items per list) is the only cross-locale check.
const shape = (doc: LegalDoc) =>
    doc.sections.map((s) =>
        s.blocks.map((b) => (b.type === "p" ? "p" : `ul${b.items.length}`)),
    );
const allText = (doc: LegalDoc) =>
    doc.sections.flatMap((s) => s.blocks.flatMap(blockText)).join("\n");

test("every locale's privacy policy and terms have the English shape", () => {
    const mismatched: string[] = [];
    for (const [name, docs] of [
        ["privacy", PRIVACY],
        ["terms", TERMS],
    ] as const) {
        const en = shape(docs.en!);
        for (const locale of SITE_LOCALES) {
            const doc = docs[locale];
            if (!doc) mismatched.push(`${locale} ${name}: missing`);
            else if (JSON.stringify(shape(doc)) !== JSON.stringify(en))
                mismatched.push(`${locale} ${name}`);
        }
    }
    expect(mismatched).toEqual([]);
});

// The facts the directory review checks for: a contact, the hosting region,
// the children clause's link to the terms, and the ODbL credit for Open Food
// Facts. Language-neutral tokens, so they are asserted in every locale.
test("every locale's privacy policy names the contact, region and terms; its terms credit OFF", () => {
    const missing: string[] = [];
    for (const locale of SITE_LOCALES) {
        const privacy = allText(PRIVACY[locale]!);
        for (const token of [
            'href="mailto:anton@nutrition-mcp.com"',
            "eu-west-1",
            'data-legal-link="terms"',
            "Anton Kutishevskyi",
        ])
            if (!privacy.includes(token))
                missing.push(`${locale} privacy: ${token}`);
        const terms = allText(TERMS[locale]!);
        for (const token of [
            "https://opendatacommons.org/licenses/odbl/1-0/",
            "Open Database License (ODbL)",
            "Anton Kutishevskyi",
        ])
            if (!terms.includes(token))
                missing.push(`${locale} terms: ${token}`);
    }
    expect(missing).toEqual([]);
});

// The date at the top is the policy's promise of what changed when. Pinned
// so a content change that forgets to move it shows up here: update this
// list together with every lastUpdated.
test("lastUpdated is the date of the last policy change in every locale", () => {
    const dates = Object.fromEntries(
        SITE_LOCALES.map((l) => [
            l,
            [PRIVACY[l]!.lastUpdated, TERMS[l]!.lastUpdated],
        ]),
    );
    const expected: Record<SiteLocale, string> = {
        en: "September 27, 2026",
        de: "27. September 2026",
        es: "27 de septiembre de 2026",
        fr: "27 septembre 2026",
        nl: "27 september 2026",
        pl: "27 września 2026",
        it: "27 settembre 2026",
        uk: "27 вересня 2026 року",
        ja: "2026年9月27日",
    };
    expect(dates).toEqual(
        Object.fromEntries(
            SITE_LOCALES.map((l) => [l, [expected[l], expected[l]]]),
        ),
    );
});

// ------------------------------------------------ /tools troubleshooting

const troubleshootingLocales = Object.entries(TOOLS_COPY) as [
    SiteLocale,
    ToolsDoc,
][];

// gen-tools.ts writes one page per TOOLS_COPY entry; the section is the last
// thing on it, with its own jump-bar pill, and its entries are in id order.
test("every locale's /tools renders the Troubleshooting section last, in order", async () => {
    for (const [locale] of troubleshootingLocales) {
        const path =
            locale === "en"
                ? "./public/tools.html"
                : `./public/${locale}/tools.html`;
        const html = normalize(await Bun.file(path).text());
        expect(html, `${path}: section`).toContain('id="troubleshooting"');
        expect(html, `${path}: Help pill`).toMatch(
            /<a class="cat-pill" href="#troubleshooting"/,
        );
        const ids = [...html.matchAll(/<details id="([^"]+)"/g)]
            .map((m) => m[1])
            .filter((id) =>
                (TROUBLESHOOTING_IDS as readonly string[]).includes(id!),
            );
        expect(ids, `${path}: entry order`).toEqual([...TROUBLESHOOTING_IDS]);
        const lastCategory = CATEGORIES[CATEGORIES.length - 1]!;
        expect(
            html.indexOf('id="troubleshooting"'),
            `${path}: section comes after the last category`,
        ).toBeGreaterThan(html.indexOf(`id="${lastCategory}"`));
    }
});

// The footer (site-partials.ts footer(), on every page from all five
// generators) links to the section in its own locale, under the section's
// own title — so a stale page from a generator that wasn't re-run fails here.
test("every page's footer links to its locale's Troubleshooting section", async () => {
    for (const [locale, doc] of troubleshootingLocales)
        expect(chromeFor(locale).footer.troubleshooting, locale).toBe(
            doc.troubleshooting.title,
        );
    let pages = 0;
    for await (const file of new Bun.Glob("public/**/*.html").scan(".")) {
        if (file.startsWith("public/widgets/")) continue;
        const html = await Bun.file(file).text();
        if (!html.includes('<footer class="footer">')) continue;
        const locale =
            SITE_LOCALES.find(
                (l) => l !== "en" && file.startsWith(`public/${l}/`),
            ) ?? "en";
        expect(html, file).toContain(
            `<a href="${pathFor(locale, "/tools")}#troubleshooting">${chromeFor(locale).footer.troubleshooting}</a>`,
        );
        pages++;
    }
    expect(pages).toBeGreaterThan(SITE_LOCALES.length * 5);
});

const answerHrefs = (doc: ToolsDoc) =>
    TROUBLESHOOTING_IDS.flatMap((id) =>
        [
            ...doc.troubleshooting.items[id].answerHtml.matchAll(
                /href="([^"]*)"/g,
            ),
        ].map((m) => ({ id, href: m[1]! })),
    );

// answerHtml is plain data with no pathFor(): a "/privacy" link would send a
// German reader to the English page.
test("troubleshooting answers link only to #anchors, https:// or mailto:", () => {
    const bad: string[] = [];
    for (const [locale, doc] of troubleshootingLocales)
        for (const { id, href } of answerHrefs(doc))
            if (!/^(#|https:\/\/|mailto:)/.test(href) || href.startsWith("/"))
                bad.push(`${locale} ${id}: ${href}`);
    expect(bad).toEqual([]);
});

test("troubleshooting #anchors resolve and ids collide with nothing", () => {
    const toolNames = new Set(TOOLS.map((t) => t.name));
    const targets = new Set<string>([...toolNames, ...TROUBLESHOOTING_IDS]);
    const dangling: string[] = [];
    for (const [locale, doc] of troubleshootingLocales)
        for (const { id, href } of answerHrefs(doc))
            if (href.startsWith("#") && !targets.has(href.slice(1)))
                dangling.push(`${locale} ${id}: ${href}`);
    expect(dangling).toEqual([]);
    for (const id of [...TROUBLESHOOTING_IDS, "troubleshooting"]) {
        expect(toolNames.has(id), `${id} is also a tool name`).toBe(false);
        expect(
            (CATEGORIES as string[]).includes(id),
            `${id} is also a category id`,
        ).toBe(false);
    }
});

// The copy restates limits from the code. Each value is scraped from its
// source, so changing a constant fails here until all 9 locale files say so.
const scrape = async (path: string, re: RegExp): Promise<string> => {
    const m = re.exec(await Bun.file(path).text());
    if (!m?.[1]) throw new Error(`${path}: ${re} matched nothing`);
    return m[1];
};
const LIMIT = await scrape(
    "./src/rate-limit.ts",
    /const LIMIT_PER_WINDOW = (\d+);/,
);
const AUTH_LIMIT = await scrape(
    "./src/rate-limit.ts",
    /const AUTH_LIMIT_PER_WINDOW = (\d+);/,
);
const STRIKES = await scrape(
    "./src/rate-limit.ts",
    /const BAN_STRIKE_THRESHOLD = (\d+);/,
);
const BANS = (
    await scrape(
        "./src/rate-limit.ts",
        /const BAN_DURATIONS_MS = \[([\d,\s]+)\]\.map\(\(m\) => m \* 60_000\);/,
    )
)
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);
const SESSION_MIN = await scrape(
    "./src/oauth.ts",
    /const SESSION_TTL_MS = (\d+) \* 60 \* 1000;/,
);
const REFRESH_DAYS = await scrape(
    "./src/oauth.ts",
    /const REFRESH_TOKEN_TTL_SECONDS = (\d+) \* 24 \* 60 \* 60;/,
);
const EXPORT_MIN = await scrape(
    "./src/export.ts",
    /const EXPORT_TTL_SECONDS = 60 \* (\d+);/,
);
const FIRST_BAN = BANS[0]!;
const LAST_BAN = BANS[BANS.length - 1]!;

// Which numbers each entry must carry, in every language.
const PINNED_DIGITS: Partial<Record<TroubleshootingId, string[]>> = {
    "cannot-connect": [REFRESH_DAYS],
    "session-expired": [SESSION_MIN],
    "rate-limited": [LIMIT, AUTH_LIMIT, STRIKES, FIRST_BAN],
    "export-link": [EXPORT_MIN],
};

test("the English troubleshooting copy states the limits in the code", () => {
    const items = TOOLS_COPY.en!.troubleshooting.items;
    const capText = LAST_BAN === "60" ? "an hour" : `${LAST_BAN} minutes`;
    const expected: [TroubleshootingId, string][] = [
        ["cannot-connect", `at least every ${REFRESH_DAYS} days`],
        ["session-expired", `${SESSION_MIN} minutes`],
        ["rate-limited", `${LIMIT} requests a minute`],
        ["rate-limited", `${AUTH_LIMIT} requests a minute`],
        ["rate-limited", `${STRIKES} rejected connection attempts`],
        ["rate-limited", `${FIRST_BAN} minutes`],
        ["rate-limited", `at most ${capText}`],
        ["export-link", `${EXPORT_MIN} minutes`],
    ];
    for (const [id, phrase] of expected)
        expect(items[id].answerHtml, `${id}`).toContain(phrase);
});

test("the ban cap is still the hour every locale's prose names", () => {
    // PINNED_DIGITS can't pin the cap: every locale writes it as "an hour" in
    // words. A different last BAN_DURATIONS_MS entry means rewriting that
    // phrase in all 9 tools*.ts files (and README), not just English.
    expect(LAST_BAN, "update 'at most an hour' in every locale").toBe("60");
});

test("every locale's troubleshooting copy carries the same numbers", () => {
    const missing: string[] = [];
    for (const [locale, doc] of troubleshootingLocales)
        for (const [id, digits] of Object.entries(PINNED_DIGITS) as [
            TroubleshootingId,
            string[],
        ][])
            for (const d of digits)
                if (
                    !new RegExp(`(?<!\\d)${d}(?!\\d)`).test(
                        doc.troubleshooting.items[id].answerHtml,
                    )
                )
                    missing.push(`${locale} ${id}: ${d}`);
    expect(missing).toEqual([]);
});
