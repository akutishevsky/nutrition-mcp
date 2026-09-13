import { test, expect } from "bun:test";
import { SITE_LOCALES, type SiteLocale } from "./routes.js";
import { INDEX } from "./copy/index.js";
import { WIDGET_STRINGS } from "./copy/widgets.js";
import { validateDemoPayloads } from "./copy/widget-demo.js";
import { readSrc, resolveIncludes } from "./widgets.js";
import {
    renderSummaryCard,
    renderTrendsCard,
    scriptPartialsOf,
    siteRegionsOf,
    type TrendsPayload,
} from "./widget-static.js";
import {
    BUNDLED_TEMPLATES,
    assertNoRedeclarations,
    buildCardSheet,
} from "../scripts/gen-widget-card.js";
import { McpServer } from "@modelcontextprotocol/server";
import { registerTools } from "./mcp.js";
import {
    EXAMPLE_CARD_TOOL,
    EX_META,
    LANDING_TRENDS_RANGE,
    exampleCardPayload,
    heroCardStates,
    renderExampleCard,
    sumExchanges,
    trendsCardPayload,
} from "../scripts/gen-index.js";
import { validateDemoPayload } from "./copy/widget-demo.js";
import type { ExampleSlideId } from "./copy/index.js";

// THE DRIFT GUARD for the landing page's in-chat widget cards.
//
// The page ships the REAL widget cards (the hero's summary card and the
// examples carousel's eight), drawn
// at build time by the widget's own emitters (src/widget-static.ts), plus a
// mechanically-scoped copy of the widget CSS and a bundle of the same JS
// partials as a deferred runtime (scripts/gen-widget-card.ts). Three
// artifacts, all generated, all committed or served from disk — which makes
// the failure mode of this whole design a silently STALE card: someone edits
// shared/macros.js, or a word in src/copy/widgets.ja.ts, every test stays
// green, and nutrition-mcp.com goes on showing last month's card next to a
// chat that shows this month's.
//
// So everything here compares what is ON DISK against a fresh build of the
// same thing, in memory, from the same sources:
//
//   * each locale's card is re-rendered and must appear in that locale's
//     index.html VERBATIM — not "contains the right number", the bytes;
//   * public/widget-card.css must end with exactly what buildWidgetCardCss()
//     produces now;
//   * public/widget-card.js must contain exactly the partials, in order,
//     comment-stripped by the same Bun.Transpiler call the generator makes;
//   * each public/widget-card.<locale>.js must carry the dictionary
//     src/copy/widgets.<locale>.ts holds now.
//
// A failure here means one command: `bun run scripts/gen-widget-card.ts &&
// bun run scripts/gen-index.ts`.

const landingPath = (locale: SiteLocale): string =>
    locale === "en" ? "./public/index.html" : `./public/${locale}/index.html`;

type Page = { locale: SiteLocale; path: string; html: string };

/** Whatever landing pages exist on disk — the generated pages are
 *  .gitignored and rebuilt by `bun run gen:all`, so this walks reality the
 *  way src/landing-script.test.ts does rather than asserting a fixed nine. */
async function landingPages(): Promise<Page[]> {
    const out: Page[] = [];
    for (const locale of SITE_LOCALES) {
        const path = landingPath(locale);
        if (await Bun.file(path).exists())
            out.push({ locale, path, html: await Bun.file(path).text() });
    }
    return out;
}

const escText = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A rendered card as the generator puts it on the page: the emitter's own
 *  bytes with the settings note spliced into the last `[data-widget-foot]`,
 *  which is where shared/bridge.js's MutationObserver keeps it in chat and
 *  the one thing about these cards that is not the widget's own output.
 *
 *  Re-derived here rather than imported, so the generator and the test find
 *  that slot independently: everything on either side of the note is the
 *  renderer's output unmodified, and pinning both halves pins every byte of
 *  it. */
function asShipped(card: string, locale: SiteLocale): string {
    const at = card.lastIndexOf("data-widget-foot>");
    expect(at, "the rendered card has a [data-widget-foot]").toBeGreaterThan(
        -1,
    );
    const close = card.indexOf("</div>", at);
    expect(close, "the foot has a closing tag").toBeGreaterThan(-1);
    const note = `<div class="wnote">${escText(WIDGET_STRINGS[locale]!.chrome.widgetsNote)}</div>`;
    return card.slice(0, close) + note + card.slice(close);
}

// ------------------------------------------------------------ the cards

test("every locale's hero card on disk is the card the emitters render now", async () => {
    const pages = await landingPages();
    expect(pages.length).toBeGreaterThan(0);
    for (const { locale, path, html } of pages) {
        const states = heroCardStates(INDEX[locale]!, locale);
        expect(`${path}: ${states.length} hero state(s)`).not.toBe(
            `${path}: 0 hero state(s)`,
        );
        for (const [n, s] of states.entries()) {
            const card = asShipped(
                await renderSummaryCard(s.payload, locale),
                locale,
            );
            expect(
                html.includes(card),
                `${path}: hero card ${n + 1}/${states.length} (exchanges ${s.indices.join(
                    " ",
                )}) is not the one the widget emitters render now — ` +
                    `re-run bun run scripts/gen-index.ts`,
            ).toBe(true);
        }
    }
});

// Every example slide's card, in every locale, in its own slide's thread and
// right after the reply its tool call belongs to (ExampleSlide.widgetAfter).
test("every locale's example cards on disk are the cards the emitters render now", async () => {
    const pages = await landingPages();
    expect(pages.length).toBeGreaterThan(0);
    for (const { locale, path, html } of pages) {
        const slides = INDEX[locale]!.examples.slides;
        const withCards = slides.filter((s) => s.widget);
        expect(withCards.map((s) => `${s.id}:${s.widget}`)).toEqual([
            "log-meal:meal-logged",
            "photo-meal:meal-logged",
            "scan-barcode:meal-logged",
            "goals-progress:goal-progress",
            "review-week:trends",
            "weight-trend:weight-trends",
            "track-drinks:meal-logged",
            "import-history:import-meals",
        ]);
        for (const slide of withCards) {
            const card = exampleCardPayload(slide, locale)!;
            const shipped = asShipped(
                await renderExampleCard(card, slide.id, locale),
                locale,
            );
            const at = html.indexOf(shipped);
            expect(
                at >= 0,
                `${path}: the ${slide.id} ${card.kind} card is not the one the widget emitters render now — ` +
                    `re-run bun run scripts/gen-index.ts`,
            ).toBe(true);
            // Inside its own slide's thread, right after the bubble it
            // follows: the thread opens after this slide's tag, and exactly
            // widgetAfter + 1 bubbles sit between that and the card.
            const slideAt = html.indexOf(`data-ex-id="${slide.id}"`);
            const thread = html.indexOf("data-ex-thread>", slideAt);
            expect(slideAt).toBeGreaterThan(-1);
            expect(thread).toBeGreaterThan(slideAt);
            expect(at).toBeGreaterThan(thread);
            const between = html.slice(thread, at);
            expect(
                between.includes("data-ex-slide>"),
                `${path} ${slide.id}: the card sits in another slide`,
            ).toBe(false);
            const bubbles = [
                ...between.matchAll(/<div class="nm-ex-(?:q|a)[" ]/g),
            ].length;
            expect(`${path} ${slide.id}: card after ${bubbles} bubbles`).toBe(
                `${path} ${slide.id}: card after ${slide.widgetAfter! + 1} bubbles`,
            );
        }
    }
});

// The wrapper is not decoration: `.nm-widget-card` is the scope every widget
// selector was rewritten under AND the container the width queries resolve
// against, `.wrap` is the widget's own #root (which is what makes
// `.wrap > .card` flatten the outermost card, as the host's frame does in
// chat), and the payload script is what /widget-card.js binds behaviour to.
// Drop any one of them and the card still renders — wrong, or dead.
test("each card is wrapped the way the runtime and the scoped CSS expect", async () => {
    for (const { path, html } of await landingPages()) {
        for (const kind of [
            "nutrition-summary",
            "trends",
            "meal-logged",
            "goal-progress",
            "weight-trends",
        ] as const) {
            const open = html.indexOf(
                `<div class="nm-widget-card" data-widget="${kind}"`,
            );
            expect(`${path}: ${kind} card present`).toBe(
                `${path}: ${open >= 0 ? "" : "no "}${kind} card present`,
            );
            const block = html.slice(open, open + 400);
            expect(
                block,
                `${path}: the ${kind} card has no .wrap between the scope and the card`,
            ).toContain('<div class="wrap">');
            expect(
                html.slice(open),
                `${path}: the ${kind} card ships no payload for the runtime to bind to`,
            ).toContain(
                `<script type="application/json" data-widget-payload="${kind}">`,
            );
        }
        // The importer is a picture: one named image, its controls inert, no
        // payload for the runtime to bind (it has no binder).
        const imp = html.match(
            /<div class="nm-widget-card" data-widget="import-meals" role="img" aria-label="([^"]+)">\s*<div class="wrap page" inert>/,
        );
        expect(
            imp,
            `${path}: the importer picture is wrapped as an inert, named image`,
        ).toBeTruthy();
        expect(html).not.toContain('data-widget-payload="import-meals"');
        // …and says so to a pointer or touch user too, whom role="img" and
        // inert never reach: the drop zone still LOOKS like a button.
        expect(
            html.slice(html.indexOf('data-widget="import-meals" role="img"')),
            `${path}: the importer picture has no visible preview caption under it`,
        ).toMatch(
            /^[^]*?<\/div>\s*<p class="nm-ex-still" aria-hidden="true"><i class="fa-solid fa-eye"><\/i> \S/,
        );
    }
});

// What each card-bearing slide's reply quotes, as plain numbers. The reply
// beside a card is the ai message the card follows (ExampleSlide.widgetAfter),
// and each of these figures must be printed by the card AND quoted by that
// reply in the card's own formatting for the locale ("1,540", "1.540",
// "1 540"). Figures the reply states but the card does not print (a 0 the
// card calls "none logged", the weight reply's text-only 7-day average) are
// left out, as are figures the card prints and the reply never mentions.
const QUOTED_FIGURES: Partial<Record<ExampleSlideId, number[]>> = {
    "log-meal": [320, 11, 6, 95],
    "photo-meal": [470, 24, 43, 22, 7, 10],
    "scan-barcode": [139, 35, 32],
    "goals-progress": [1540, 104, 460, 56],
    "weight-trend": [78.4, 1.8, 3.4],
    "track-drinks": [17.9, 2.3, 180],
};

/** Every figure token in a run of markup's text, separators and decimals
 *  included, as the card prints them. */
function figureTokens(markup: string): string[] {
    const text = markup
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&#8239;/g, " ");
    return [...text.matchAll(/\d(?:[\d.,   ]*\d)?/g)].map((m) => m[0]);
}

/** Whether a figure token spells `n` in some locale's format: the same digits
 *  AND the same decimals, so 17.9 matches "17.9" or "17,9" but never "179" or
 *  "1.79", and 1540 matches "1,540", "1.540" or "1 540" but never "15.40". */
function spells(token: string, n: number): boolean {
    const [int, frac = ""] = String(n).split(".");
    const groups = token.split(/[.,\s\u00a0\u202f]/u);
    if (groups.join("") !== int + frac) return false;
    if (frac) return groups.length >= 2 && groups.at(-1) === frac;
    return groups.slice(1).every((g) => g.length === 3);
}

test("each example card's reply quotes the figures its card prints", async () => {
    for (const locale of Object.keys(INDEX) as SiteLocale[]) {
        for (const slide of INDEX[locale]!.examples.slides) {
            const want = QUOTED_FIGURES[slide.id];
            if (!want) continue;
            const card = exampleCardPayload(slide, locale);
            expect(
                card?.kind ?? null,
                `${locale} ${slide.id}: the slide shows no card`,
            ).not.toBeNull();
            if (!card) continue;
            const tokens = figureTokens(
                await renderExampleCard(card, slide.id, locale),
            );
            const reply = slide.messages[slide.widgetAfter!];
            expect(
                reply?.from,
                `${locale} ${slide.id}: the card follows an ai reply`,
            ).toBe("ai");
            for (const n of want) {
                // The card's own spelling(s) of that number.
                const spelled = [
                    ...new Set(tokens.filter((t) => spells(t, n))),
                ];
                expect(
                    spelled.length,
                    `${locale} ${slide.id}: the card does not print ${n}`,
                ).toBeGreaterThan(0);
                expect(
                    spelled.some((t) => reply!.text!.includes(t)),
                    `${locale} ${slide.id}: the reply "${reply!.text}" does not quote the card's ${spelled.join(" / ")}`,
                ).toBe(true);
            }
        }
    }
});

// A card on a slide stands for a widget one of that slide's tools REALLY
// returns — read back from src/mcp.ts's own registrations, not a list kept
// here — and the converse: a slide whose tools include one that returns a
// widget must show its card (meal-patterns and export-data call none).
test("every example card is a widget one of its slide's tools declares", () => {
    const server = new McpServer(
        { name: "widget-card-test", version: "0.0.0" },
        { capabilities: { tools: {}, resources: {} } },
    );
    const widgetOf = new Map<string, string>();
    const original = server.registerTool.bind(server);
    (server as unknown as { registerTool: unknown }).registerTool = (
        name: string,
        config: { _meta?: { ui?: { resourceUri?: string } } },
        handler: unknown,
    ) => {
        const uri = config?._meta?.ui?.resourceUri;
        if (uri) widgetOf.set(name, uri);
        return (original as unknown as (...a: unknown[]) => unknown)(
            name,
            config,
            handler,
        );
    };
    // widgetsEnabled true: with widgets off no tool declares a resource.
    registerTools(server, "widget-card-test", true, null);
    expect(widgetOf.size).toBeGreaterThan(0);
    for (const locale of Object.keys(INDEX) as SiteLocale[]) {
        for (const slide of INDEX[locale]!.examples.slides) {
            const tools: string[] = EX_META[slide.id].tools;
            if (!slide.widget) {
                const returning = tools.filter((t) => widgetOf.has(t));
                expect(
                    `${locale} ${slide.id}: calls widget tools [${returning.join(", ")}] but shows no card`,
                ).toBe(
                    `${locale} ${slide.id}: calls widget tools [] but shows no card`,
                );
                continue;
            }
            const tool = EXAMPLE_CARD_TOOL[slide.widget];
            expect(
                tools,
                `${locale} ${slide.id}: its ${slide.widget} card stands for ${tool}, which the slide does not call`,
            ).toContain(tool);
            expect(
                widgetOf.get(tool),
                `${locale} ${slide.id}: ${tool} does not return the ${slide.widget} widget`,
            ).toBe(`ui://widget/${slide.widget}.html`);
        }
    }
});

// The payload each example card is drawn from, in every locale, against the
// live tool schema — the object the page embeds, not a canonical one.
test("every locale's example card payloads match the live tool schemas", async () => {
    for (const locale of Object.keys(INDEX) as SiteLocale[]) {
        for (const slide of INDEX[locale]!.examples.slides) {
            const card = exampleCardPayload(slide, locale);
            if (card)
                await validateDemoPayload(
                    EXAMPLE_CARD_TOOL[card.kind],
                    card.payload,
                );
        }
    }
});

// Both files, both deferred, and the strings file FIRST: deferred scripts run
// in document order and /widget-card.js reads the dictionary off the global
// the locale file sets. Reversed, the runtime warns once and every card stays
// static — which is a correct page, so nothing else would notice.
test("each page loads the scoped CSS and the runtime, in the order that works", async () => {
    for (const { locale, path, html } of await landingPages()) {
        const css = html.indexOf(
            '<link rel="stylesheet" href="/widget-card.css"',
        );
        const site = html.indexOf('<link rel="stylesheet" href="/styles.css"');
        expect(`${path}: widget-card.css after styles.css`).toBe(
            `${path}: ${css > site && site >= 0 ? "" : "NOT "}widget-card.css after styles.css`,
        );
        const strings = html.indexOf(
            `<script src="/widget-card.${locale}.js" defer></script>`,
        );
        const runtime = html.indexOf(
            '<script src="/widget-card.js" defer></script>',
        );
        expect(`${path}: strings then runtime`).toBe(
            `${path}: ${strings >= 0 && runtime > strings ? "" : "NOT "}strings then runtime`,
        );
    }
});

// --------------------------------------------------- the generated assets

test("public/widget-card.css is a fresh build of the widget partials", async () => {
    const disk = await Bun.file("./public/widget-card.css").text();
    // src/widget-css.ts's sheet, then the other page cards' own rules
    // (goal-progress' weight track, the importer's form and step rail).
    const fresh = await buildCardSheet();
    // The generator prepends its own banner and nothing else, so the file is
    // the transform's current output with a comment in front of it.
    expect(
        disk.endsWith(fresh),
        "public/widget-card.css is stale — re-run bun run scripts/gen-widget-card.ts",
    ).toBe(true);
    // The rules that were missing before the sheet carried them: without the
    // track the weight drawer's bar has no height, and the importer's drop
    // zone is an unstyled label.
    expect(disk).toContain(
        '.nm-widget-card:where([data-widget="goal-progress"]) .wtrack {',
    );
    expect(disk).toContain(
        '.nm-widget-card:where([data-widget="import-meals"]) .drop {',
    );
});

test("public/widget-card.js is a fresh build of the widget partials", async () => {
    // The generator's own partial list, derived the same way: every
    // shared/*.js the bound card templates @include (bridge.js excluded — no
    // host, no iframe), in include order, union across them, then each
    // template's site-card regions, then site/boot.js last.
    const keys = BUNDLED_TEMPLATES.map((f) => f.replace(/\.html$/, ""));
    expect(keys).toEqual([
        "nutrition-summary",
        "trends",
        "meal-logged",
        "goal-progress",
        "weight-trends",
    ]);
    const merged: string[] = [];
    for (const key of keys) {
        for (const rel of await scriptPartialsOf(key))
            if (!merged.includes(rel)) merged.push(rel);
    }
    expect(merged.length).toBeGreaterThan(0);
    expect(merged).not.toContain("shared/bridge.js");
    // A still picture is not driven, so its code does not ship.
    expect(merged).not.toContain("shared/import-card.js");
    const units: { label: string; text: string }[] = [];
    for (const rel of merged) {
        units.push({
            label: rel,
            text: await resolveIncludes(await readSrc(rel), rel, [rel]),
        });
    }
    for (const key of keys) {
        for (const text of await siteRegionsOf(key))
            units.push({ label: `${key}#region`, text });
    }
    units.push({
        label: "site/boot.js",
        text: await resolveIncludes(
            await readSrc("site/boot.js"),
            "site/boot.js",
            ["site/boot.js"],
        ),
    });
    // A function declared twice would silently replace the other for every
    // card on the page; the generator refuses, and so does this.
    expect(() => assertNoRedeclarations(units)).not.toThrow();
    expect(() =>
        assertNoRedeclarations([
            { label: "a", text: "function esc(s) {}" },
            { label: "b", text: "    function esc(s) {}" },
        ]),
    ).toThrow(/esc/);
    const source = units.map((u) => u.text + "\n").join("");
    // The same call the generator makes, not a regex: these partials are full
    // of regex and template literals whose whitespace is painted markup.
    const body = new Bun.Transpiler({ loader: "js" }).transformSync(source);
    const disk = await Bun.file("./public/widget-card.js").text();
    expect(
        disk.includes(body),
        "public/widget-card.js does not contain the current partials — re-run bun run scripts/gen-widget-card.ts",
    ).toBe(true);
});

test("each locale's strings file carries that locale's current dictionary", async () => {
    for (const locale of SITE_LOCALES) {
        const path = `./public/widget-card.${locale}.js`;
        expect(`${path} exists: ${await Bun.file(path).exists()}`).toBe(
            `${path} exists: true`,
        );
        const text = await Bun.file(path).text();
        const json = text.match(
            /window\.NM_WIDGET_STRINGS = ([\s\S]*);\s*$/,
        )?.[1];
        expect(json, `${path}: no NM_WIDGET_STRINGS assignment`).toBeTruthy();
        const shipped = JSON.parse(json!) as Record<
            string,
            Record<string, unknown>
        >;
        // shared/i18n.js initialises T to WIDGET_STRINGS.en before any locale
        // is resolved, so "en" rides along on every page.
        expect(Object.keys(shipped).sort()).toEqual(
            [...new Set(["en", locale])].sort(),
        );
        for (const [loc, dict] of Object.entries(shipped)) {
            const live = WIDGET_STRINGS[loc as SiteLocale] as unknown as Record<
                string,
                unknown
            >;
            for (const ns of Object.keys(dict)) {
                expect(
                    dict[ns],
                    `${path}: the "${loc}.${ns}" namespace is stale — re-run bun run scripts/gen-widget-card.ts`,
                ).toEqual(live[ns]);
            }
            // What the bound cards reach for, and not what the still picture
            // would: the importer's table is the heaviest in the dictionary.
            for (const ns of ["mealLogged", "goalProgress", "weightTrends"]) {
                expect(`${path} ${loc} ships ${ns}: ${ns in dict}`).toBe(
                    `${path} ${loc} ships ${ns}: true`,
                );
            }
            expect(
                `${path} ${loc} ships importMeals: ${"importMeals" in dict}`,
            ).toBe(`${path} ${loc} ships importMeals: false`);
        }
    }
});

// ------------------------------------------------- the cards vs. the copy

// The hero card is the thread's running total, so the card the replay brings
// in after exchange N must be exactly what exchanges 0..N logged. Pinned
// against sumExchanges — the generator's own summing function — rather than
// against the final state alone, which is all the page's markup shows.
test("each hero card state is the thread summed up to its own exchange", () => {
    const locales = Object.keys(INDEX) as SiteLocale[];
    expect(locales).toContain("en");
    for (const locale of locales) {
        const doc = INDEX[locale]!;
        const exchanges = doc.hero.chat.exchanges;
        const states = heroCardStates(doc, locale);
        expect(
            states.length,
            `${locale}: at least one card state`,
        ).toBeGreaterThan(0);
        // Every widget-flagged exchange is served by exactly one state.
        const flagged = exchanges.flatMap((ex, i) => (ex.widget ? [i] : []));
        expect(states.flatMap((s) => s.indices)).toEqual(flagged);
        for (const s of states) {
            // A state's OWN exchange is its first index; the later ones share
            // it only because they logged nothing new.
            const at = s.indices[0]!;
            const want = sumExchanges(exchanges, at);
            const avg = s.payload.averages;
            expect(`${locale}@${at} kcal: ${avg.calories}`).toBe(
                `${locale}@${at} kcal: ${want.kcal}`,
            );
            expect(`${locale}@${at} protein: ${avg.protein_g}`).toBe(
                `${locale}@${at} protein: ${want.pro}`,
            );
            expect(`${locale}@${at} carbs: ${avg.carbs_g}`).toBe(
                `${locale}@${at} carbs: ${want.car}`,
            );
            expect(`${locale}@${at} fat: ${avg.fat_g}`).toBe(
                `${locale}@${at} fat: ${want.fat}`,
            );
            expect(`${locale}@${at} sugar: ${avg.sugar_g}`).toBe(
                `${locale}@${at} sugar: ${want.sugar}`,
            );
            expect(`${locale}@${at} caffeine: ${avg.caffeine_mg}`).toBe(
                `${locale}@${at} caffeine: ${want.caf}`,
            );
            expect(`${locale}@${at} water: ${avg.water_ml}`).toBe(
                `${locale}@${at} water: ${want.water}`,
            );
            for (const i of s.indices.slice(1)) {
                expect(
                    JSON.stringify(sumExchanges(exchanges, i)),
                    `${locale}: exchange ${i} shares a card with ${at} but logged something`,
                ).toBe(JSON.stringify(want));
            }
        }
    }
});

// The examples slide's reply is an AI quoting the card underneath it. It used
// to quote a different week than the mock it sat over ("2,035 kcal across 6
// logged days" beside a hardcoded polyline), and nothing said so.
//
// It quotes THREE figures — the average, how much of the window was logged,
// and the distance to the goal — and all three are pinned, because pinning
// only the average leaves the same bug one edit away: move
// LANDING_TRENDS_RANGE to 30 and the average assertion follows the card to
// its new value while nine locales go on saying "across 13 of the last 14
// days — 170 under your target", fully green.
//
// The card's own figures are locale-formatted — "1,830", "1.830", "1830", a
// NARROW no-break space in fr, a no-break space in uk — so this also catches
// a translation that typed the separator by hand and got the codepoint wrong,
// which is one of the drifts this whole rebuild exists to end.

/** The first number in a run of text, separators and all: "170 kcal under"
 *  -> "170", "1 830 kcal sous l'objectif" -> "1 830". Trailing separators are
 *  dropped so the result is what a reader would quote. */
function firstFigure(text: string): string {
    // Every group separator Intl.NumberFormat reaches for across these nine
    // locales: a plain space, NBSP, narrow NBSP, thin space, "." and ",".
    const run = /\d[\d.,\u0020\u00a0\u202f\u2009]*/.exec(text)?.[0] ?? "";
    return run.replace(/\D+$/u, "");
}

/** The two numbers the card's "N of M days logged" caption prints, read
 *  through that locale's own template rather than a guess at its word order —
 *  fr puts the span last, ja puts it first. Returns them in {logged, span}
 *  form, or null when the caption is no longer that phrase at all (a fully
 *  logged window prints `daysLogged` instead, which has no M in it). */
function daysLoggedFigures(
    meta: string,
    locale: SiteLocale,
): { logged: string; span: string } | null {
    const parts = escText(
        WIDGET_STRINGS[locale]!.nutritionSummary.daysOfLogged,
    ).split(/\{(logged|span)\}/);
    const order: string[] = [];
    let pattern = "";
    for (const [i, part] of parts.entries()) {
        if (i % 2 === 0) pattern += part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        else {
            order.push(part);
            pattern += "(\\d+)";
        }
    }
    const m = new RegExp(pattern).exec(meta);
    if (!m || order.length !== 2) return null;
    return {
        logged: m[order.indexOf("logged") + 1]!,
        span: m[order.indexOf("span") + 1]!,
    };
}

test("the trends slide's reply quotes the figures its card prints", async () => {
    for (const locale of Object.keys(INDEX) as SiteLocale[]) {
        const slide = INDEX[locale]!.examples.slides.find(
            (s) => s.widget === "trends",
        );
        expect(
            slide,
            `${locale}: a slide carries the trends card`,
        ).toBeTruthy();
        const card = await renderTrendsCard(
            trendsCardPayload(locale),
            locale,
            LANDING_TRENDS_RANGE,
        );
        const quote = (what: string, figure: string | undefined) => {
            expect(figure, `${locale}: the card prints ${what}`).toBeTruthy();
            expect(
                // The reply beside the card is the ai message the card
                // follows (ExampleSlide.widgetAfter).
                slide!.messages[slide!.widgetAfter!]?.text,
                `${locale}: the reply does not quote the card's ${what} "${figure}" — ` +
                    `the card and the prose beside it have drifted apart`,
            ).toContain(figure!);
        };

        // The focus panel's headline: "<avg><span class="u">/<goal> kcal".
        quote(
            "calorie average",
            card.match(/<span class="v">([^<]*)<span class="u">/)?.[1],
        );
        // …and its delta, "170 kcal under", which the reply renders as "170
        // under your target".
        quote(
            "distance to the goal",
            firstFigure(card.match(/<b class="fdelta">([^<]*)</)?.[1] ?? ""),
        );

        // The header's window and how much of it was logged.
        const meta = card.match(/id="tr-meta"[^>]*>([^<]*)</)?.[1];
        expect(meta, `${locale}: the card prints a header meta`).toBeTruthy();
        const days = daysLoggedFigures(meta!, locale);
        expect(
            days,
            `${locale}: the card's meta "${meta}" no longer prints the "N of M days logged" caption the reply quotes`,
        ).not.toBeNull();
        quote("logged-day count", days!.logged);
        quote("window length", days!.span);
    }
});

// WHAT IS EMITTED IS WHAT IS VALIDATED.
//
// scripts/gen-index.ts validates each hero state against the live
// get_nutrition_summary schema, exactly as it renders it — but the trends
// payload it renders is `{...DEMO_TRENDS, locale, default_range}`, a spread,
// and the canonical object is not it. `z.object()` STRIPS unknown keys rather
// than rejecting them, at every depth, so a field added or renamed in that
// spread would reach no schema and silently never reach the widget. So the
// object the page actually embeds is parsed here, in every locale.
test("every locale's embedded trends payload matches the live tool schema", async () => {
    for (const locale of Object.keys(INDEX) as SiteLocale[]) {
        const hero = heroCardStates(INDEX[locale]!, locale)[0]!;
        await validateDemoPayloads(hero.payload, trendsCardPayload(locale));
    }
});

test("a key the tool does not send is caught in the trends payload too", async () => {
    // The guard above is only worth its runtime if the payload handed to it
    // is the one checked — a defaulted parameter that went unused would look
    // identical. This is the failure the harness fixtures actually had.
    const hero = heroCardStates(INDEX.en!, "en")[0]!;
    const stale = {
        ...trendsCardPayload("en"),
        range_days: LANDING_TRENDS_RANGE,
    } as unknown as TrendsPayload;
    await expect(validateDemoPayloads(hero.payload, stale)).rejects.toThrow(
        /range_days/,
    );
});
