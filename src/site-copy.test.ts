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
import { altUiFor } from "./copy/alt-ui.js";
import {
    PRIVACY,
    TERMS,
    type LegalBlock,
    type LegalDoc,
} from "./copy/legal.js";
import { LOGIN } from "./copy/login.js";
import { HEALTH_SYNC_COPY } from "./copy/health-sync.js";
import { APPLE_HEALTH, type AppleHealthDoc } from "./copy/apple-health.js";
import {
    HEALTH_SYNC_CLOSE_HOUR,
    HEALTH_SYNC_CONNECT_TTL_MINUTES,
    HEALTH_SYNC_LINK_IDLE_DAYS,
    HEALTH_SYNC_LINK_MAX_DAYS,
    HEALTH_SYNC_MAX_BACKFILL_DAYS,
    HEALTH_SYNC_RETENTION_DAYS,
    HEALTH_SYNC_SHORTCUT_NAME,
    HEALTH_SYNC_SHORTCUT_URL,
    HEALTH_SYNC_WINDOW_DAYS,
} from "./health-sync.js";
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

// Added sugar shipped the same way caffeine did: same guard, so the landing
// page's enumerations can't keep listing the old set. Unlike caffeine, the
// barcode card names it too — Open Food Facts carries an added-sugar figure
// where the label has one.
test("the landing page names added sugar wherever it lists nutrients", () => {
    const cards = [
        ...index.matchAll(/<h3>([^<]+)<\/h3>\s*<p>([\s\S]*?)<\/p>/g),
    ];
    const byTitle = new Map(
        cards.map((m) => [normalize(m[1]!), normalize(m[2]!)]),
    );
    for (const title of [
        "Meals in plain language",
        "Scan a barcode",
        "Goals & progress",
    ]) {
        expect(byTitle.get(title)).toContain("added sugar");
    }
    const { jsonLd, visible } = trackAnswers();
    for (const answer of [jsonLd!, visible!]) {
        expect(normalize(answer)).toContain("added sugar");
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
// an "everything" claim — the landing page's export card, its trust badge,
// llms.txt, the tool card, and the switching-cost card on all six comparison
// pages — and "everything" is only true relative to this list. Add a table to
// the schema, leave the archive as it is, and each of those claims turns false
// with nothing to catch it, which is the caffeine failure again in a different
// costume. So the copy is pinned to the file names, not to the adjectives.
const ARCHIVE_FILES = [
    "meals.csv",
    "meal_items.csv",
    "saved_meals.csv",
    "saved_meal_items.csv",
    "water.csv",
    "weight.csv",
    "body_measurements.csv",
    "goals.csv",
    "goals_history.csv",
    "profile.csv",
    "account.csv",
    "telemetry.csv",
    "connections.csv",
    "health_sync.csv",
    "README.txt",
];
// The tables behind those CSVs, as the prose names them.
const ARCHIVE_TABLES = [
    "meals",
    "saved meals",
    "water",
    "weight",
    "body measurements",
    "goals",
    "profile",
];

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
    // Water, weight, body measurements, goals and profile leave but do not return, and an LLM
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
            "one ZIP with your meals, saved meals, water, weight, body measurements, goals and profile",
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
// out of the same markup as the name instead of trusting the copy file. The
// buttons show "Metric" / "Imperial" (translated); their accessible names
// must START with that visible word (WCAG 2.5.3 Label in Name — speech users
// say what they see) and still carry the unit symbol the toggle switches to.
test("each unit button's aria-label starts with its visible text and names its unit", async () => {
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
                `${path}: the ${unit} button has no visible text`,
            ).toBeTruthy();
            expect(
                name,
                `${path}: the ${unit} button has no aria-label`,
            ).toBeTruthy();
            expect(
                name!.startsWith(visible),
                `${path}: aria-label "${name}" does not start with the visible "${visible}" (WCAG 2.5.3 Label in Name)`,
            ).toBe(true);
            expect(
                name!,
                `${path}: aria-label "${name}" does not name the unit "${unit}"`,
            ).toContain(unit!);
        }
    }
});

// Layout itself needs a browser, so what is pinned here is the structure the
// fix rests on. The calorie odometer is one reel per digit: it cannot shrink
// and cannot break mid-number, so when the live delta tag shared its row the
// digits ran out past the panel's right edge at 390px (#129). In the current
// design the tag sits in the tile's top row beside the icon, never in the
// figure's row, and that top row wraps; the tile itself may shrink below its
// content (min-width: 0) so the stats grid never forces a horizontal scroll.
test("the live stats delta tag never shares the odometer's row", async () => {
    const html = await Bun.file("./public/index.html").text();
    const style = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)]
        .map((m) => m[1])
        .join("\n");
    const block = (sel: string) => {
        const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const found = [
            ...style.matchAll(
                new RegExp(`(?:^|[}\\s])${esc}\\s*\\{([^}]*)\\}`, "g"),
            ),
        ];
        expect(found.length, `expected one \`${sel} {\` block`).toBe(1);
        return found[0]![1]!;
    };
    // Anchored on the semicolon so `wrap-reverse` does not read as wrap.
    expect(block(".lp-tile-top")).toMatch(/flex-wrap:\s*wrap;/);
    expect(block(".lp-tile")).toMatch(/min-width:\s*0;/);
    const tops = [
        ...html.matchAll(/<div class="lp-tile-top">([\s\S]*?)<\/div>/g),
    ];
    expect(tops.length).toBeGreaterThan(0);
    for (const t of tops) expect(t[1]).toContain('class="lp-delta"');
    const figs = [...html.matchAll(/<b class="lp-fig">([\s\S]*?)<\/b>/g)];
    expect(figs.length).toBe(tops.length);
    for (const f of figs) expect(f[1]).not.toContain("lp-delta");
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

// The tool count is hand-typed in a dozen places — the /tools title, meta and
// OG descriptions and count pill in every locale, every locale's landing-page
// "Browse all N tools" CTA, and llms.txt — and nothing else ties them to the
// tools the server actually registers. Consolidating five settings tools into
// get_profile left stale counts behind that only a grep caught. So the set of
// names in TOOLS must equal the `server.registerTool()` names in src/mcp.ts
// (scraped from source rather than imported: building the server needs
// Supabase credentials), and every count field must name that many. README's
// table and the directory listing are still checked by hand.
test("the registered tool set and every hand-typed tool count agree", async () => {
    const mcpSrc = await Bun.file("./src/mcp.ts").text();
    const registered = [
        ...mcpSrc.matchAll(/server\.registerTool\(\s*"([a-z0-9_]+)"/g),
    ]
        .map((m) => m[1]!)
        .sort();
    // Guard the guard: a scrape that finds nothing would agree with an empty
    // TOOLS and pass vacuously.
    expect(
        registered.length,
        "scraped no registerTool names out of src/mcp.ts — this guard's regex has gone stale, not the copy",
    ).toBeGreaterThan(0);
    expect(
        TOOLS.map((t) => t.name).sort(),
        "TOOLS in src/copy/tools.ts and the registerTool() calls in src/mcp.ts disagree",
    ).toEqual(registered);

    const n = registered.length;
    const hasCount = (text: string) =>
        new RegExp(`(?<!\\d)${n}(?!\\d)`).test(text);
    const stale: string[] = [];
    for (const [locale, doc] of Object.entries(TOOLS_COPY)) {
        const fields: [string, string][] = [
            ["meta.title", doc!.meta.title],
            ["meta.description", doc!.meta.description],
            ["meta.ogDescription", doc!.meta.ogDescription],
            ["hero.countBold", doc!.hero.countBold],
        ];
        for (const [field, text] of fields)
            if (!hasCount(text)) stale.push(`tools.${locale}: ${field}`);
    }
    for (const [locale, doc] of Object.entries(INDEX))
        if (!hasCount(doc!.onboarding.toolsCta.body))
            stale.push(`index.${locale}: onboarding.toolsCta.body`);
    expect(stale, `these do not name ${n} tools`).toEqual([]);

    const llms = await Bun.file("./public/llms.txt").text();
    expect(llms).toContain(`all ${n} MCP tools`);
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
        en: "October 10, 2026",
        de: "10. Oktober 2026",
        es: "10 de octubre de 2026",
        fr: "10 octobre 2026",
        nl: "10 oktober 2026",
        pl: "10 października 2026",
        it: "10 ottobre 2026",
        uk: "10 жовтня 2026 року",
        ja: "2026年10月10日",
        tr: "10 Ekim 2026",
    };
    expect(dates).toEqual(
        Object.fromEntries(
            SITE_LOCALES.map((l) => [l, [expected[l], expected[l]]]),
        ),
    );
});

// Brief 13: the disclosures a directory review checks for, pinned per locale
// so a translation that drops one fails here rather than in review. Each
// keyword is a phrase from that locale's own translation. `oldCarveOut` is
// the pre-brief-13 "access tokens issued earlier keep up to a year" wording,
// which stopped being true once the last of those tokens expired.
const BRIEF13: Record<
    SiteLocale,
    {
        healthConsent: string;
        regions: string;
        aggregateStats: string;
        oldCarveOut: string;
    }
> = {
    en: {
        healthConsent: "health data",
        regions: "sanctions",
        aggregateStats: "at least three",
        oldCarveOut: "up to a year",
    },
    de: {
        healthConsent: "Gesundheitsdaten",
        regions: "Sanktions- und Exportkontrollgesetze",
        aggregateStats: "mindestens drei Profile",
        oldCarveOut: "bis zu einem Jahr",
    },
    es: {
        healthConsent: "que son datos de salud",
        regions: "leyes de sanciones y de control de exportaciones",
        aggregateStats: "al menos tres perfiles",
        oldCarveOut: "de hasta un año",
    },
    fr: {
        healthConsent: "données de santé",
        regions: "sanctions et de contrôle des exportations",
        aggregateStats: "au moins trois profils",
        oldCarveOut: "jusqu'à un an",
    },
    nl: {
        healthConsent: "gezondheidsgegevens",
        regions: "sanctie- en exportcontrolewetgeving",
        aggregateStats: "minstens drie profielen",
        oldCarveOut: "tot maximaal een jaar",
    },
    pl: {
        healthConsent: "danymi dotyczącymi zdrowia",
        regions: "sankcji i kontroli eksportu",
        aggregateStats: "co najmniej trzy profile",
        oldCarveOut: "nie dłuższy niż rok",
    },
    it: {
        healthConsent: "che sono dati sanitari",
        regions: "in materia di sanzioni e di controllo delle esportazioni",
        aggregateStats: "almeno tre profili",
        oldCarveOut: "fino a un anno",
    },
    uk: {
        healthConsent: "даєш згоду на те, щоб ми зберігали",
        regions: "санкції та експортний контроль",
        aggregateStats: "щонайменше три профілі",
        oldCarveOut: "зберігає строк дії, з яким його видали",
    },
    ja: {
        healthConsent: "健康データにあたります",
        regions: "制裁および輸出管理",
        aggregateStats: "少なくとも3つのプロフィール",
        oldCarveOut: "最長1年",
    },
    tr: {
        healthConsent: "sağlık verisidir",
        regions: "yaptırım ve ihracat kontrolü yasaları",
        aggregateStats: "en az üç profil",
        oldCarveOut: "bir yıla kadar",
    },
};

test("every locale's privacy policy names Cloudflare and its __cf_bm cookie, and drops the year-long token carve-out", () => {
    const problems: string[] = [];
    for (const locale of SITE_LOCALES) {
        const privacy = allText(PRIVACY[locale]!);
        for (const token of ["Cloudflare", "__cf_bm"])
            if (!privacy.includes(token))
                problems.push(`${locale}: missing ${token}`);
        if (privacy.includes(BRIEF13[locale].oldCarveOut))
            problems.push(
                `${locale}: still has "${BRIEF13[locale].oldCarveOut}"`,
            );
    }
    expect(problems).toEqual([]);
});

test("every locale's privacy policy discloses the home page's aggregate stats threshold", () => {
    const missing = SITE_LOCALES.filter(
        (l) => !allText(PRIVACY[l]!).includes(BRIEF13[l].aggregateStats),
    );
    expect(missing).toEqual([]);
});

// Goals history (nutrition_goals_history): a new per-user table goes into the
// export, deleteAllUserData and the privacy policy together. Each locale must
// say a dated copy is kept when goals change (the Goals bullet), name the
// history where stored data is listed (retention and erasure), and name it in
// the Access and portability bullet; the terms' export paragraph names it too.
const GOALS_HISTORY: Record<
    SiteLocale,
    { dated: string; stored: string; access: string; terms: string }
> = {
    en: {
        dated: "Each time they change, we also keep a dated copy",
        stored: "goals and their change history",
        access: "the history of your goal changes",
        terms: "goals, goal history,",
    },
    de: {
        dated: "Jedes Mal, wenn sie sich ändern, bewahren wir außerdem eine datierte Kopie",
        stored: "Ziele samt dem Verlauf ihrer Änderungen",
        access: "den Verlauf deiner Zieländerungen",
        terms: "Zielen, dem Zielverlauf,",
    },
    es: {
        dated: "Cada vez que cambian, guardamos además una copia con fecha",
        stored: "tus objetivos y el historial de sus cambios, tus ajustes",
        access: "tus objetivos y el historial de sus cambios",
        terms: "objetivos, historial de objetivos,",
    },
    fr: {
        dated: "Chaque fois qu'ils changent, nous conservons aussi une copie datée",
        stored: "tes objectifs et l'historique de leurs modifications, tes réglages",
        access: "tes objectifs et l'historique de leurs modifications",
        terms: "l'historique de tes objectifs",
    },
    it: {
        dated: "Ogni volta che cambiano conserviamo anche una copia datata",
        stored: "gli obiettivi e la cronologia delle loro modifiche, le impostazioni",
        access: "i tuoi obiettivi e la cronologia delle loro modifiche",
        terms: "cronologia degli obiettivi",
    },
    nl: {
        dated: "Telkens als ze veranderen, bewaren we ook een gedateerde kopie",
        stored: "doelen en de geschiedenis van je doelwijzigingen, profielinstellingen",
        access: "je doelen en de geschiedenis van je doelwijzigingen",
        terms: "doelgeschiedenis",
    },
    pl: {
        dated: "Za każdym razem, gdy się zmieniają, zachowujemy też kopię z datą",
        stored: "cele wraz z historią ich zmian, ustawienia profilu",
        access: "cele wraz z historią ich zmian",
        terms: "historię celów",
    },
    uk: {
        dated: "Щоразу, коли вони змінюються, ми також зберігаємо копію з датою",
        stored: "їхніх змін, налаштування профілю",
        access: "цілі та історія їхніх змін",
        terms: "історії цілей",
    },
    ja: {
        dated: "目標が変わるたびに日付付きの控えも保存し",
        stored: "目標とその変更履歴、プロフィール設定",
        access: "目標とその変更履歴",
        terms: "目標の変更履歴",
    },
    tr: {
        dated: "Her değiştiklerinde ayrıca tarihli bir kopyasını saklıyoruz",
        stored: "hedefler ve değişiklik geçmişleri, profil ayarların",
        access: "hedeflerin ve hedef değişikliklerinin geçmişi",
        terms: "hedef geçmişi",
    },
};

test("every locale's privacy policy and terms name the goals history", () => {
    const problems: string[] = [];
    const count = (text: string, token: string) => text.split(token).length - 1;
    for (const locale of SITE_LOCALES) {
        const t = GOALS_HISTORY[locale];
        const privacy = allText(PRIVACY[locale]!);
        if (!privacy.includes(t.dated)) problems.push(`${locale}: dated copy`);
        if (!privacy.includes(t.access))
            problems.push(`${locale}: access and portability`);
        // Retention and erasure both list stored data.
        if (count(privacy, t.stored) < 2)
            problems.push(`${locale}: retention or erasure`);
        if (!allText(TERMS[locale]!).includes(t.terms))
            problems.push(`${locale}: terms export`);
    }
    expect(problems).toEqual([]);
});

// Nutrient sources (nutrient_sources, source_detail on meals, meal_items,
// saved_meals and saved_meal_items): each nutrient value records where it came
// from, and the export carries that, so the Access and portability bullet must
// say so in every locale. Pinned on the bullet, not on the whole policy, so a
// reworded meal-log sentence elsewhere does not trip it.
const NUTRIENT_SOURCES_ACCESS: Record<SiteLocale, string> = {
    en: "where each nutrient value came from",
    de: "der Herkunft jedes Nährwerts",
    es: "el origen de cada valor nutricional",
    fr: "l'origine de chaque valeur nutritionnelle",
    it: "l'origine di ogni valore nutrizionale",
    nl: "de herkomst van elke voedingswaarde",
    pl: "pochodzenie każdej wartości odżywczej",
    uk: "походження кожного поживного значення",
    ja: "各栄養値の出典",
    tr: "her besin değerinin kaynağıyla",
};

test("every locale's privacy policy says the export carries nutrient sources", () => {
    const missing = SITE_LOCALES.filter(
        (l) => !allText(PRIVACY[l]!).includes(NUTRIENT_SOURCES_ACCESS[l]),
    );
    expect(missing).toEqual([]);
});

// Saved meals (saved_meals, saved_meal_items, meal_items): a new per-user table
// goes into the export, deleteAllUserData and the privacy policy together. Each
// locale must name saved meals where stored data is listed, name them in the
// Access and portability bullet, and the terms' export paragraph names them too.
const SAVED_MEALS: Record<
    SiteLocale,
    {
        stored: string;
        access: string;
        terms: string;
        /** The Rectification bullet: saved meals can be corrected and deleted. */
        rectification: string;
        /** /tools#delete-account: what deleting the account removes. */
        deleteAccount: string;
        /** The comparison pages' "Import & own your data" card. */
        altCard: string;
    }
> = {
    en: {
        stored: "saved meals",
        access: "your saved meals (saved_meals.csv)",
        terms: "saved meals and their ingredients",
        rectification: "body measurement entry or any saved meal",
        deleteAccount: "your meals, saved meals, water",
        altCard: "one ZIP with your meals, saved meals, water",
    },
    de: {
        stored: "Gespeicherte Mahlzeiten",
        access: "deine gespeicherten Mahlzeiten (saved_meals.csv)",
        terms: "gespeicherten Mahlzeiten und deren Zutaten",
        rectification: "oder eine gespeicherte Mahlzeit zu korrigieren",
        deleteAccount:
            "deine Mahlzeiten, deine gespeicherten Mahlzeiten, Wasser-",
        altCard:
            "ein ZIP mit deinen Mahlzeiten, gespeicherten Mahlzeiten, Wasser",
    },
    es: {
        stored: "una comida que guardas con un nombre",
        access: "comidas guardadas (saved_meals.csv) y sus ingredientes (saved_meal_items.csv)",
        terms: "tus comidas guardadas y sus ingredientes",
        rectification: "y cualquier comida guardada",
        deleteAccount: "tus comidas, comidas guardadas, agua",
        altCard: "un ZIP con tus comidas, comidas guardadas, agua",
    },
    fr: {
        stored: "Repas sauvegardés",
        access: "saved_meals.csv",
        terms: "repas sauvegardés",
        rectification: "et n'importe quel repas sauvegardé",
        deleteAccount: "tes repas, tes repas sauvegardés, tes entrées d'eau",
        altCard:
            "un ZIP avec tes repas, tes repas sauvegardés, ton hydratation",
    },
    it: {
        stored: "Pasti salvati",
        access: "i tuoi pasti salvati (saved_meals.csv)",
        terms: "pasti salvati e i loro ingredienti",
        rectification: "e qualsiasi pasto salvato",
        deleteAccount: "pasti, pasti salvati, acqua",
        altCard: "un unico ZIP con pasti, pasti salvati, acqua",
    },
    nl: {
        stored: "Opgeslagen maaltijden",
        access: "opgeslagen maaltijden (saved_meals.csv)",
        terms: "opgeslagen maaltijden en hun ingrediënten",
        rectification: "of een opgeslagen maaltijd te corrigeren",
        deleteAccount: "je maaltijden, opgeslagen maaltijden, water",
        altCard: "met je maaltijden, opgeslagen maaltijden, water",
    },
    pl: {
        stored: "<strong>Zapisane posiłki</strong>",
        access: "zapisane posiłki (saved_meals.csv)",
        terms: "zapisane posiłki wraz ze składnikami",
        rectification: "lub zapisanego posiłku",
        deleteAccount: "Twoje posiłki, zapisane posiłki, wodę",
        altCard: "jeden ZIP z posiłkami, zapisanymi posiłkami, wodą",
    },
    uk: {
        stored: "Збережені страви",
        access: "saved_meals.csv",
        terms: "збережених страв та їхніх інгредієнтів",
        rectification: "а також збережену страву",
        deleteAccount: "твої прийоми їжі, збережені страви, воду",
        altCard: "прийоми їжі, збережені страви, вода",
    },
    ja: {
        stored: "名前を付けて保存した食事の、名前、説明、既定の食事の種類、1食分あたりの数値",
        access: "保存した食事（saved_meals.csv）",
        terms: "保存した食事とその材料",
        rectification: "記録や保存した食事の修正や削除",
        deleteAccount: "食事、保存した食事、水分",
        altCard: "食事・保存した食事・水分",
    },
    tr: {
        stored: "Kayıtlı yemekler",
        access: "saved_meals.csv",
        terms: "kayıtlı yemekler ve malzemeleri",
        rectification: "ya da kayıtlı bir yemeği düzeltmesini",
        deleteAccount: "yemeklerini, kayıtlı yemeklerini, suyunu",
        altCard: "yemeklerin, kayıtlı yemeklerin, suyun",
    },
};

test("every locale's privacy policy and terms name saved meals", () => {
    const problems: string[] = [];
    for (const locale of SITE_LOCALES) {
        const t = SAVED_MEALS[locale];
        const privacy = allText(PRIVACY[locale]!);
        if (!privacy.includes(t.stored))
            problems.push(`${locale}: stored data`);
        if (!privacy.includes(t.access))
            problems.push(`${locale}: access and portability`);
        if (!allText(TERMS[locale]!).includes(t.terms))
            problems.push(`${locale}: terms export`);
    }
    expect(problems).toEqual([]);
});

// Saved meals can be corrected and deleted (update_saved_meal,
// delete_saved_meal) and are removed with the account and carried in the
// export, so every place a locale enumerates the user's data names them: the
// Rectification bullet, /tools#delete-account and the comparison pages'
// export card. English-only pins let the other nine drift unnoticed.
test("every locale names saved meals in rectification, account deletion and the export card", () => {
    const problems: string[] = [];
    for (const locale of SITE_LOCALES) {
        const t = SAVED_MEALS[locale];
        if (!allText(PRIVACY[locale]!).includes(t.rectification))
            problems.push(`${locale}: rectification`);
        const answer =
            TOOLS_COPY[locale]!.troubleshooting.items["delete-account"]
                .answerHtml;
        if (!answer.includes(t.deleteAccount))
            problems.push(`${locale}: /tools#delete-account`);
        const card = altUiFor(locale).app.features.find((f) =>
            f.body.includes("ZIP"),
        );
        if (!card?.body.includes(t.altCard))
            problems.push(`${locale}: comparison-page export card`);
    }
    expect(problems).toEqual([]);
});

// search_meals now also matches ingredient names and lists saved meals; the
// /tools entry says so in every locale, naming saved meals with the same word
// the privacy policy uses.
const SEARCH_MEALS_SAVED: Record<SiteLocale, string> = {
    en: "lists your saved meals whose name, description or ingredients match",
    de: "gespeicherte Mahlzeiten, deren Name, Beschreibung oder Zutaten passen",
    es: "tus comidas guardadas cuyo nombre, descripción o ingredientes coinciden",
    fr: "tes repas sauvegardés dont le nom, la description ou les ingrédients correspondent",
    it: "i tuoi pasti salvati il cui nome, descrizione o ingredienti corrispondono",
    nl: "opgeslagen maaltijden waarvan de naam, beschrijving of ingrediënten overeenkomen",
    pl: "zapisane posiłki, których nazwa, opis lub składniki pasują",
    uk: "збережені страви, чия назва, опис чи інгредієнти збігаються",
    ja: "名前・説明・材料が一致する保存した食事",
    tr: "adı, açıklaması ya da malzemeleri eşleşen kayıtlı yemeklerini",
};

test("every locale's search_meals entry names ingredient and saved-meal matches", () => {
    const problems: string[] = [];
    for (const locale of SITE_LOCALES) {
        const text = TOOLS_COPY[locale]!.tools.search_meals!.description;
        if (!text.includes(SEARCH_MEALS_SAVED[locale]))
            problems.push(`${locale}: search_meals`);
    }
    expect(problems).toEqual([]);
});

// Inserting "saved meals" into the retention sentence once left the genitive
// chain "d'hydratation, de poids" (fr) / "wody, wagi" (pl) hanging off it.
test("the French and Polish retention sentences keep each category its own phrase", () => {
    const fr = allText(PRIVACY.fr!);
    expect(fr).toContain(
        "Tes journaux de repas, d'hydratation, de poids et de mensurations, tes repas sauvegardés, tes objectifs",
    );
    expect(fr).not.toContain("tes repas sauvegardés, d'hydratation");
    const pl = allText(PRIVACY.pl!);
    expect(pl).toContain(
        "Twoje wpisy posiłków, wody, wagi i wymiarów ciała, zapisane posiłki, cele",
    );
    expect(pl).not.toContain("zapisane posiłki, wody");
});

// validateItems makes only fiber, total sugar and added sugar all-or-none
// across items; alcohol and caffeine are summed over the items that carry
// them. A rule saying "every item or none" for all of them would push a
// caffeine_mg 0 onto the toast beside a latte.
test("every locale's log_meal items text names the all-or-none and per-item nutrients", () => {
    const problems: string[] = [];
    for (const locale of SITE_LOCALES) {
        const items = TOOLS_COPY[locale]!.tools.log_meal!.params.items ?? "";
        const pos = (key: string) => items.indexOf(`<code>${key}</code>`);
        for (const key of [
            "fiber_g",
            "sugar_g",
            "added_sugar_g",
            "alcohol_g",
            "caffeine_mg",
        ])
            if (pos(key) < 0) problems.push(`${locale}: no ${key}`);
        // The three all-or-none keys come before the two per-item ones, so
        // each group is stated as its own clause.
        if (pos("added_sugar_g") > pos("alcohol_g"))
            problems.push(`${locale}: groups out of order`);
    }
    expect(problems).toEqual([]);
    expect(TOOLS_COPY.en!.tools.log_meal!.params.items).toContain(
        "<code>alcohol_g</code> and <code>caffeine_mg</code> only on the items that contain them",
    );
});

// log_saved_meal's item_amounts are what was actually eaten in this entry:
// servings scales the saved meal first, then item_amounts set single items.
// The public docs must not describe them as a bare "new amount".
test("the /tools log_saved_meal text describes item_amounts as amounts actually eaten", () => {
    const en = TOOLS_COPY.en!.tools.log_saved_meal!;
    expect(en.params.item_amounts).toContain("actually eaten in this entry");
    expect(en.params.item_amounts).toContain(
        "Servings scales the saved meal first",
    );
    expect(en.description).toContain("set to the amount actually eaten");
    for (const locale of SITE_LOCALES) {
        expect(
            TOOLS_COPY[locale]!.tools.log_saved_meal!.params.item_amounts,
            `${locale}: item_amounts still reads as a bare "new amount"`,
        ).not.toMatch(
            /^(New amounts|Neue Mengen|Nuevas cantidades|Nouvelles quantités|Nuove quantità|個々の材料の新しい分量|Nieuwe hoeveelheden|Nowe ilości|Tek tek malzemeler için yeni|Нові кількості)/,
        );
    }
});

test("every locale's terms restrict use to supported regions and sanctions law", () => {
    const missing = SITE_LOCALES.filter(
        (l) => !allText(TERMS[l]!).includes(BRIEF13[l].regions),
    );
    expect(missing).toEqual([]);
});

test("every locale's login consent note names health data and keeps both links", () => {
    const problems: string[] = [];
    for (const locale of SITE_LOCALES) {
        const note = LOGIN[locale].consentNote;
        if (!note.includes(BRIEF13[locale].healthConsent))
            problems.push(`${locale}: no health-data consent`);
        for (const token of ["{terms}", "{privacy}"])
            if (!note.includes(token)) problems.push(`${locale}: no ${token}`);
    }
    expect(problems).toEqual([]);
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
            /<a class="nm-chip tools-chip" href="#troubleshooting"/,
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
// source, so changing a constant fails here until all 10 locale files say so.
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
/** "05:00" — the local time a day closes for Apple Health sync. */
const CLOSE_TIME = `${String(HEALTH_SYNC_CLOSE_HOUR).padStart(2, "0")}:00`;
const LAST_BAN = BANS[BANS.length - 1]!;

// Which numbers each entry must carry, in every language.
const PINNED_DIGITS: Partial<Record<TroubleshootingId, string[]>> = {
    "cannot-connect": [REFRESH_DAYS],
    "session-expired": [SESSION_MIN],
    "rate-limited": [LIMIT, AUTH_LIMIT, STRIKES, FIRST_BAN],
    "export-link": [EXPORT_MIN],
    // Apple Health sync: the 05:00 close is pinned separately below (it is a
    // clock time, not a bare number).
    "health-sync-yesterday": [
        String(HEALTH_SYNC_WINDOW_DAYS),
        String(HEALTH_SYNC_MAX_BACKFILL_DAYS),
    ],
    "health-sync-higher": [String(HEALTH_SYNC_WINDOW_DAYS)],
    "health-sync-stopped": [
        String(HEALTH_SYNC_LINK_IDLE_DAYS),
        String(HEALTH_SYNC_LINK_MAX_DAYS),
        String(HEALTH_SYNC_CONNECT_TTL_MINUTES),
    ],
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
        ["health-sync-yesterday", `at ${CLOSE_TIME} the next morning`],
        ["health-sync-yesterday", `the last ${HEALTH_SYNC_WINDOW_DAYS} days`],
        [
            "health-sync-yesterday",
            `up to ${HEALTH_SYNC_MAX_BACKFILL_DAYS} earlier days`,
        ],
        ["health-sync-higher", `the last ${HEALTH_SYNC_WINDOW_DAYS} days`],
        [
            "health-sync-stopped",
            `${HEALTH_SYNC_LINK_IDLE_DAYS} days without a sync`,
        ],
        [
            "health-sync-stopped",
            `${HEALTH_SYNC_LINK_MAX_DAYS} days after connecting`,
        ],
        [
            "health-sync-stopped",
            `within ${HEALTH_SYNC_CONNECT_TTL_MINUTES} minutes`,
        ],
    ];
    for (const [id, phrase] of expected)
        expect(items[id].answerHtml, `${id}`).toContain(phrase);
});

test("the ban cap is still the hour every locale's prose names", () => {
    // PINNED_DIGITS can't pin the cap: every locale writes it as "an hour" in
    // words. A different last BAN_DURATIONS_MS entry means rewriting that
    // phrase in all 10 tools*.ts files (and README), not just English.
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

// ------------------------------------------------ Apple Health sync

// The sync's numbers are restated in prose in four places: the /tools
// troubleshooting entries (above), the privacy policy, the connect-link error
// page and the shortcut's build guide. Each is pinned against the constant in
// src/health-sync.ts, so changing one there fails here until every locale
// says so too.
test("every locale's troubleshooting names the 05:00 close and the shortcut", () => {
    const missing: string[] = [];
    for (const [locale, doc] of troubleshootingLocales) {
        const items = doc.troubleshooting.items;
        if (!items["health-sync-yesterday"].answerHtml.includes(CLOSE_TIME))
            missing.push(`${locale}: ${CLOSE_TIME}`);
        for (const id of [
            "health-sync-yesterday",
            "health-sync-stopped",
        ] as const)
            if (!items[id].answerHtml.includes(HEALTH_SYNC_SHORTCUT_NAME))
                missing.push(`${locale} ${id}: ${HEALTH_SYNC_SHORTCUT_NAME}`);
    }
    expect(missing).toEqual([]);
});

// Apple Health can't lower a value, and "Delete All Data from Shortcuts" also
// wipes every other shortcut's samples: the decrease entry must say how to fix
// a day by hand without ever recommending that button.
test("the English health-sync-higher entry warns off Delete All Data", () => {
    const html =
        TOOLS_COPY.en!.troubleshooting.items["health-sync-higher"].answerHtml;
    expect(html).toContain("Show All Data");
    expect(html).toMatch(/Never use <strong>Delete All Data from Shortcuts/);
});

const hasNumber = (text: string, n: number) =>
    new RegExp(`(?<!\\d)${n}(?!\\d)`).test(text);

test("every locale's privacy policy states the sync's retention numbers", () => {
    const missing: string[] = [];
    for (const locale of SITE_LOCALES) {
        const privacy = allText(PRIVACY[locale]!);
        for (const n of [
            HEALTH_SYNC_RETENTION_DAYS,
            HEALTH_SYNC_CONNECT_TTL_MINUTES,
            HEALTH_SYNC_LINK_IDLE_DAYS,
            HEALTH_SYNC_LINK_MAX_DAYS,
        ])
            if (!hasNumber(privacy, n)) missing.push(`${locale}: ${n}`);
        if (!privacy.includes("Apple Health"))
            missing.push(`${locale}: Apple Health`);
    }
    expect(missing).toEqual([]);
});

test("every locale's expired connect-link page states its lifetime", () => {
    const missing = SITE_LOCALES.filter(
        (l) =>
            !hasNumber(
                HEALTH_SYNC_COPY[l].errors.expired.body,
                HEALTH_SYNC_CONNECT_TTL_MINUTES,
            ),
    );
    expect(missing).toEqual([]);
});

test("the shortcut build guide names the shortcut and the sync's numbers", async () => {
    const guide = await Bun.file("./docs/apple-health-shortcut.md").text();
    expect(guide).toContain(`\`${HEALTH_SYNC_SHORTCUT_NAME}\``);
    expect(guide).toContain(`${CLOSE_TIME} local time`);
    expect(guide).toContain(`last ${HEALTH_SYNC_WINDOW_DAYS} closed days`);
    expect(guide).toContain(`${HEALTH_SYNC_CONNECT_TTL_MINUTES} minutes`);
    expect(guide).toContain(`${HEALTH_SYNC_RETENTION_DAYS} days`);
});

// ------------------------------------------------ /apple-health

// The setup guide (scripts/gen-apple-health.ts, src/copy/apple-health*.ts)
// restates the sync's rules in prose, like the troubleshooting entries above:
// pinned against src/health-sync.ts in every locale.
const appleHealthLocales = Object.entries(APPLE_HEALTH) as [
    SiteLocale,
    AppleHealthDoc,
][];
const appleHealthText = (doc: AppleHealthDoc) => JSON.stringify(doc);
const appleHealthFile = (locale: SiteLocale) =>
    locale === "en"
        ? "./public/apple-health.html"
        : `./public/${locale}/apple-health.html`;

test("the Apple Health guide exists in every locale", () => {
    expect(Object.keys(APPLE_HEALTH).sort()).toEqual([...SITE_LOCALES].sort());
});

test("every locale's Apple Health guide states the sync's numbers and the shortcut name", () => {
    const missing: string[] = [];
    for (const [locale, doc] of appleHealthLocales) {
        const text = appleHealthText(doc);
        if (!text.includes(CLOSE_TIME))
            missing.push(`${locale}: ${CLOSE_TIME}`);
        if (!text.includes(HEALTH_SYNC_SHORTCUT_NAME))
            missing.push(`${locale}: ${HEALTH_SYNC_SHORTCUT_NAME}`);
        for (const n of [
            HEALTH_SYNC_WINDOW_DAYS,
            HEALTH_SYNC_RETENTION_DAYS,
            HEALTH_SYNC_CONNECT_TTL_MINUTES,
            HEALTH_SYNC_LINK_IDLE_DAYS,
            HEALTH_SYNC_LINK_MAX_DAYS,
        ])
            if (!hasNumber(text, n)) missing.push(`${locale}: ${n}`);
        // The automation's input is a literal the shortcut compares against.
        if (!text.includes("<code>auto</code>"))
            missing.push(`${locale}: <code>auto</code>`);
    }
    expect(missing).toEqual([]);
});

test("the English Apple Health guide restates the rules in the code", () => {
    const text = appleHealthText(APPLE_HEALTH.en);
    for (const phrase of [
        `<strong>${CLOSE_TIME}</strong> the next morning`,
        `the last ${HEALTH_SYNC_WINDOW_DAYS} days`,
        `the last ${HEALTH_SYNC_WINDOW_DAYS} finished days`,
        `for ${HEALTH_SYNC_RETENTION_DAYS} days`,
        `for ${HEALTH_SYNC_CONNECT_TTL_MINUTES} minutes`,
        `${HEALTH_SYNC_LINK_IDLE_DAYS} days without a sync`,
        `${HEALTH_SYNC_LINK_MAX_DAYS} days after connecting`,
        "Show All Data",
    ])
        expect(text, phrase).toContain(phrase);
    // Health can't lower a value, and "Delete All Data from Shortcuts" wipes
    // every other shortcut's samples too: only ever named to warn against it.
    expect(text).toMatch(/Never use <strong>Delete All Data from Shortcuts/);
    expect(text.split("Delete All Data from Shortcuts").length - 1).toBe(1);
    expect(text).not.toMatch(/whoop/i);
});

test("every built Apple Health guide links its troubleshooting entries and policy in its own locale", async () => {
    for (const [locale] of appleHealthLocales) {
        const html = await Bun.file(appleHealthFile(locale)).text();
        for (const id of [
            "health-sync-yesterday",
            "health-sync-higher",
            "health-sync-stopped",
        ])
            expect(html, `${locale} #${id}`).toContain(
                `href="${pathFor(locale, "/tools")}#${id}"`,
            );
        expect(html, `${locale} privacy`).toContain(
            `href="${pathFor(locale, "/privacy")}"`,
        );
        // No dead install button while the iCloud link is unpublished.
        if (HEALTH_SYNC_SHORTCUT_URL) {
            expect(html).toContain(`href="${HEALTH_SYNC_SHORTCUT_URL}"`);
            expect(html).not.toContain('class="ah-pending"');
        } else {
            expect(html).toContain('class="ah-pending"');
            expect(html).not.toContain("icloud.com/shortcuts");
        }
    }
});

test("every page's footer links the Apple Health guide in its locale", async () => {
    let pages = 0;
    for await (const file of new Bun.Glob("public/**/*.html").scan(".")) {
        if (file.startsWith("public/widgets/")) continue;
        const html = await Bun.file(file).text();
        if (!html.includes('<footer class="footer">')) continue;
        const locale =
            SITE_LOCALES.find(
                (l) => l !== "en" && file.startsWith(`public/${l}/`),
            ) ?? "en";
        expect(html, file).toMatch(
            new RegExp(
                `<a href="${pathFor(locale, "/apple-health")}"(?: aria-current="page")?>${chromeFor(locale).footer.appleHealth}</a>`,
            ),
        );
        pages++;
    }
    expect(pages).toBeGreaterThan(SITE_LOCALES.length * 5);
});

// Saved meals and meal ingredients on the landing page: the meta description
// (which also feeds og/twitter and the SoftwareApplication JSON-LD), the
// "What can I track?" answer and a FAQ entry of their own, in every locale.
// Matched case-insensitively on word stems so inflection and capitalisation
// don't matter.
// Stems for "saved meal" and "ingredient" as each index.<locale>.ts words them.
const LANDING_SAVED_MEALS: Record<
    SiteLocale,
    { saved: string; ingredient: string }
> = {
    en: { saved: "saved meal", ingredient: "ingredient" },
    de: { saved: "gespeichert", ingredient: "zutat" },
    es: { saved: "guardad", ingredient: "ingrediente" },
    fr: { saved: "sauvegard", ingredient: "ingrédient" },
    nl: { saved: "opgeslagen", ingredient: "ingrediënt" },
    pl: { saved: "zapisan", ingredient: "składnik" },
    it: { saved: "salvat", ingredient: "ingredient" },
    uk: { saved: "збережен", ingredient: "інгредієнт" },
    ja: { saved: "保存", ingredient: "材料" },
    tr: { saved: "kayıtlı", ingredient: "malzeme" },
};

test("every locale's landing meta and FAQ mention saved meals and ingredients", () => {
    const en = INDEX.en!;
    // Locale FAQs mirror English entry for entry, so the English position
    // names the same question everywhere.
    const trackAt = en.faq.findIndex((f) => f.question === "What can I track?");
    const savedAt = en.faq.findIndex((f) =>
        f.question.startsWith("Can I save meals I eat often"),
    );
    expect(trackAt).toBeGreaterThanOrEqual(0);
    expect(savedAt).toBe(trackAt + 1);
    const problems: string[] = [];
    for (const locale of SITE_LOCALES) {
        const doc = INDEX[locale]!;
        const t = LANDING_SAVED_MEALS[locale];
        const has = (s: string | undefined, token: string) =>
            (s ?? "").toLocaleLowerCase(locale).includes(token);
        if (!has(doc.metaDescription, t.saved))
            problems.push(`${locale}: metaDescription`);
        if (!has(doc.ogDescription, t.saved))
            problems.push(`${locale}: ogDescription`);
        if (doc.faq.length !== en.faq.length)
            problems.push(`${locale}: faq has ${doc.faq.length} entries`);
        const track = doc.faq[trackAt]?.visibleHtml;
        if (!has(track, t.saved) || !has(track, t.ingredient))
            problems.push(`${locale}: "What can I track?" answer`);
        const saved = doc.faq[savedAt];
        if (!has(saved?.visibleHtml, t.saved))
            problems.push(`${locale}: saved-meals FAQ answer`);
    }
    expect(problems).toEqual([]);
});

// The saved-meal example slide: same position as English in every locale,
// quoting the demo card's figures (MEAL_CARDS["saved-meal"] in
// scripts/landing-cards.ts: 865 kcal, 95 g protein). A translation that drops
// the slide is otherwise only a "skipped" warning from gen-index.ts.
test("every locale has the saved-meal example slide with its figures", () => {
    const at = INDEX.en!.examples.slides.findIndex(
        (s) => s.id === "saved-meal",
    );
    expect(at).toBe(3);
    const problems: string[] = [];
    for (const locale of SITE_LOCALES) {
        const slides = INDEX[locale]!.examples.slides;
        const enIds = INDEX.en!.examples.slides.map((s) => s.id).join();
        if (slides.map((s) => s.id).join() !== enIds)
            problems.push(`${locale}: slide ids differ from English`);
        const slide = slides[at];
        if (slide?.id !== "saved-meal") {
            problems.push(`${locale}: no saved-meal slide at ${at}`);
            continue;
        }
        const reply = slide.messages[3];
        if (
            reply?.from !== "ai" ||
            !/(^|\D)865(\D|$)/.test(reply.text) ||
            !/(^|\D)95(\D|$)/.test(reply.text)
        )
            problems.push(`${locale}: reply must quote 865 kcal and 95 g`);
        if (Object.keys(slide.toolNotes).join() !== "log_saved_meal,save_meal")
            problems.push(`${locale}: toolNotes keys`);
        if (
            slide.cards?.length !== 1 ||
            slide.cards[0]!.kind !== "meal-logged" ||
            slide.cards[0]!.after !== 2 ||
            slide.cardMeals?.length !== 1
        )
            problems.push(`${locale}: card structure`);
    }
    expect(problems).toEqual([]);
});
