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
    type TrendsPayload,
} from "./widget-static.js";
import { buildWidgetCardCss } from "./widget-css.js";
import {
    LANDING_TRENDS_RANGE,
    heroCardStates,
    sumExchanges,
    trendsCardPayload,
} from "../scripts/gen-index.js";

// THE DRIFT GUARD for the landing page's two in-chat widget cards.
//
// The page ships the REAL get_nutrition_summary and get_trends cards, drawn
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

test("every locale's trends card on disk is the card the emitters render now", async () => {
    const pages = await landingPages();
    expect(pages.length).toBeGreaterThan(0);
    for (const { locale, path, html } of pages) {
        const card = asShipped(
            await renderTrendsCard(
                trendsCardPayload(locale),
                locale,
                LANDING_TRENDS_RANGE,
            ),
            locale,
        );
        expect(
            html.includes(card),
            `${path}: the trends card is not the one the widget emitters render now — ` +
                `re-run bun run scripts/gen-index.ts`,
        ).toBe(true);
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
        for (const kind of ["nutrition-summary", "trends"] as const) {
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
    const fresh = await buildWidgetCardCss();
    // The generator prepends its own banner and nothing else, so the file is
    // the transform's current output with a comment in front of it.
    expect(
        disk.endsWith(fresh),
        "public/widget-card.css is stale — re-run bun run scripts/gen-widget-card.ts",
    ).toBe(true);
});

test("public/widget-card.js is a fresh build of the widget partials", async () => {
    // The generator's own partial list, derived the same way: every
    // shared/*.js the two card templates @include (bridge.js excluded — no
    // host, no iframe), in include order, union across the two, then
    // site/boot.js last.
    const merged: string[] = [];
    for (const key of ["nutrition-summary", "trends"]) {
        for (const rel of await scriptPartialsOf(key))
            if (!merged.includes(rel)) merged.push(rel);
    }
    expect(merged.length).toBeGreaterThan(0);
    expect(merged).not.toContain("shared/bridge.js");
    let source = "";
    for (const rel of [...merged, "site/boot.js"]) {
        source +=
            (await resolveIncludes(await readSrc(rel), rel, [rel])) + "\n";
    }
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
                slide!.aiText,
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
