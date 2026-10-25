import { test, expect } from "bun:test";
import {
    GOALS,
    GOALS_DAY_MEALS,
    HERO_DAY_MEALS,
    MEAL_CARDS,
    TRENDS_DAYS,
    TRENDS_FATS,
    renderCard,
    usdaFoodSourcesMeta,
    type DemoCardId,
} from "../scripts/landing-cards.js";
import { INDEX } from "./copy/index.js";
import { digestCardId, exampleThread } from "../scripts/gen-index.js";
import { SITE_LOCALES } from "./routes.js";
import { NUTRIENT_SOURCES_META_KEY } from "./widgets.js";

// The demo cards are the real widgets' markup for the demo account, so their
// figures are pinned here: a fat figure that does not cover its saturated and
// trans parts, or a card that drops the fat cell, would read wrong on the
// landing page without any error.

/** The cards drawn by meal-logged and nutrition-summary, whose 2026-10
 * redesign shows a calorie half-gauge collapsed (the nutrient rows, saturated
 * fat among them, open on tap, which a still card has no way to do). */
const DAY_VIEW_CARDS: DemoCardId[] = [
    "hero-meal",
    "hero-day",
    "log-meal",
    "photo-meal",
    "scan-barcode",
    "saved-meal",
    "track-drinks",
    "usda-food",
];

// The goals card is the goal-progress widget, which no longer draws the macro
// strip: it shows status counters and the rest-of-today card instead.
test("the goals card shows the status counters and the rest-of-today card", () => {
    const html = renderCard("goals-progress", "en");
    expect(html).toContain('aria-label="Goals by status"');
    expect(html).toContain("For the rest of today");
    expect(html).not.toContain('class="strip');
});

const DAY_MEALS = [
    { description: "Breakfast", type: "breakfast" },
    { description: "Lunch", type: "lunch" },
    { description: "Snack", type: "snack" },
];

test("every day-view card draws the calorie gauge with real figures", () => {
    for (const id of DAY_VIEW_CARDS) {
        const html = renderCard(id, "en", "Meal", DAY_MEALS);
        expect(html, `${id} has no gauge`).toContain('class="gw');
        expect(html, `${id} has no kcal figure`).toMatch(/of [\d,]+ kcal/);
        expect(html, id).not.toMatch(/undefined|NaN/);
    }
});

// review-week is the trends widget, which no longer draws the macro strip:
// it offers saturated fat as one of its nutrient chips instead.
test("the review-week card offers saturated fat among its nutrients", () => {
    const html = renderCard("review-week", "en", "Meal", DAY_MEALS);
    expect(html).toContain("Saturated fat");
    expect(html).toContain("14-day calorie trend");
});

test("fat covers saturated and trans fat in every demo meal and day", () => {
    const rows = [
        ...Object.values(MEAL_CARDS).map((c) => c!.totals),
        ...HERO_DAY_MEALS.map(([, t]) => t),
        ...GOALS_DAY_MEALS,
    ];
    for (const t of rows) {
        expect(t.sat).toBeGreaterThanOrEqual(0);
        expect(t.fat).toBeGreaterThanOrEqual(t.sat + (t.trans ?? 0) - 1e-9);
    }
    TRENDS_DAYS.forEach(([date, kcal, , , fat], i) => {
        const [sat, trans] = TRENDS_FATS[i]!;
        if (!kcal) return;
        expect(fat, `${date} fat`).toBeGreaterThanOrEqual(sat + trans - 1e-9);
    });
});

test("the usda-food card's sources name USDA record 171477 and estimate added sugar", () => {
    const meta = usdaFoodSourcesMeta()[NUTRIENT_SOURCES_META_KEY]!;
    const slot = meta.meals[0]!.meal!;
    expect(slot.calories).toMatchObject({
        s: "usda",
        ref: "171477",
        data_type: "SR Legacy",
    });
    expect(slot.saturated_fat_g).toMatchObject({ s: "usda", ref: "171477" });
    expect(slot.added_sugar_g).toEqual({ s: "estimate" });
    expect(slot.trans_fat_g).toBeUndefined();
});

test("the usda-food card's figures match the slide copy in every locale", () => {
    const t = MEAL_CARDS["usda-food"]!.totals;
    expect(t.kcal).toBe(248);
    expect(t.pro).toBe(46.5);
    expect(t.fat).toBe(5.4);
    for (const locale of SITE_LOCALES) {
        const slide = INDEX[locale]!.examples.slides.find(
            (s) => s.id === "usda-food",
        )!;
        expect(
            slide.cards?.map((c) => c.kind),
            locale,
        ).toEqual(["meal-logged"]);
        expect(slide.cardMeals, locale).toHaveLength(1);
        if (locale === "en") {
            expect(slide.messages[1]!.text).toContain(
                "248 kcal, 46.5 g protein and 5.4 g fat",
            );
        }
    }
});

test("every locale's goals reply names the 20 g saturated-fat limit", () => {
    for (const locale of SITE_LOCALES) {
        const slide = INDEX[locale]!.examples.slides.find(
            (s) => s.id === "goals-progress",
        )!;
        const reply = slide.messages[slide.messages.length - 3]!.text;
        expect(reply, locale).toMatch(/20[\s\u00a0][g\u0433]/);
    }
});

// Show more: every card whose widget has one ships both states, and the
const EXPANDABLE_CARDS: DemoCardId[] = [
    "hero-meal",
    "hero-day",
    "hero-weight",
    "weight-trend",
    "log-meal",
    "photo-meal",
    "scan-barcode",
    "saved-meal",
    "track-drinks",
    "usda-food",
    "track-sodium",
    "goals-progress",
    "review-week",
];

/** The two states of a card, split at their markers in the shadow root. */
function statesOf(html: string): { collapsed: string; expanded: string } {
    const c = html.indexOf('class="nmw-s nmw-s-c"');
    const x = html.indexOf('class="nmw-s nmw-s-x"');
    expect(c, "collapsed state").toBeGreaterThan(-1);
    expect(x, "expanded state").toBeGreaterThan(c);
    return { collapsed: html.slice(c, x), expanded: html.slice(x) };
}

test("every expandable card renders its collapsed and expanded states", () => {
    for (const id of EXPANDABLE_CARDS) {
        const { collapsed, expanded } = statesOf(
            renderCard(id, "en", "Meal", DAY_MEALS),
        );
        expect(collapsed, `${id} collapsed`).toContain("Show more");
        expect(expanded, `${id} expanded`).toContain("Show less");
        for (const state of [collapsed, expanded])
            expect(
                (state.match(/nmw-tog/g) ?? []).length,
                `${id} pills`,
            ).toBeGreaterThan(0);
    }
});

test("the expanded state shows detail the collapsed one does not", () => {
    for (const id of EXPANDABLE_CARDS) {
        const { collapsed, expanded } = statesOf(
            renderCard(id, "en", "Meal", DAY_MEALS),
        );
        expect(expanded.length, id).toBeGreaterThan(collapsed.length);
        // The accordion cards open a row (its detail is an .accB); weight's
        // expanded state is its weigh-in list instead.
        if (!id.startsWith("hero-weight") && id !== "weight-trend")
            expect(collapsed, `${id} collapsed detail`).not.toContain(
                'class="accB',
            );
        if (!id.startsWith("hero-weight") && id !== "weight-trend")
            expect(expanded, `${id} expanded detail`).toContain('class="accB');
    }
});

test("the Show more pills' aria-expanded matches each state", () => {
    for (const id of EXPANDABLE_CARDS) {
        const { collapsed, expanded } = statesOf(
            renderCard(id, "en", "Meal", DAY_MEALS),
        );
        const pills = (state: string) =>
            state.match(/<button[^>]*nmw-tog[^>]*>/g) ?? [];
        for (const p of pills(collapsed))
            expect(p, id).toContain('aria-expanded="false"');
        for (const p of pills(expanded))
            expect(p, id).toContain('aria-expanded="true"');
    }
});

test("only the Show more pills are live in a card; every other control is inert", () => {
    for (const id of [...EXPANDABLE_CARDS, "import-file"] as const) {
        const html = renderCard(id, "en", "Meal", DAY_MEALS);
        for (const tag of html.match(
            /<(button|input|select|textarea|label)\b[^>]*>/g,
        ) ?? []) {
            if (tag.includes("nmw-tog")) continue;
            expect(tag, `${id} live control`).toContain(" inert");
        }
    }
});

test("cards without a Show more control ship a single state", () => {
    const html = renderCard("import-file", "en", "Meal", DAY_MEALS);
    expect(html).not.toContain("nmw-s-x");
    expect(html).not.toContain("nmw-tog");
});

// Sodium rides in each card's _meta, so it shows wherever the widget draws the
// nutrient: the meal and day views in their expanded state, the trends card's
// sodium chip. The digest card is the get_digest widget, built by the same
// computeDigest the tool runs.
test("sodium shows in the meal and day views' expanded state and in trends", () => {
    for (const id of ["hero-meal", "hero-day", "usda-food"] as const) {
        const { expanded } = statesOf(renderCard(id, "en", "Meal", DAY_MEALS));
        expect(expanded, `${id} sodium`).toContain("Sodium");
    }
    const trends = renderCard("review-week", "en", "Meal", DAY_MEALS);
    expect(trends, "trends sodium").toContain("Sodium");
});

test("the digest cards render both states", () => {
    for (const id of ["digest-week", "daily-digest"] as const) {
        const html = renderCard(id, "en", "Meal", DAY_MEALS);
        const { collapsed, expanded } = statesOf(html);
        expect(collapsed, id).toContain("Show more");
        expect(expanded, id).toContain("Show less");
        expect(html, id).not.toMatch(/undefined|NaN/);
    }
});

test("the track-sodium card opens sodium as its expanded row", () => {
    const { collapsed, expanded } = statesOf(
        renderCard("track-sodium", "en", "Tonkotsu ramen", DAY_MEALS),
    );
    // Collapsed, no nutrient row is open; expanded, the sodium row is.
    expect(collapsed).not.toContain('class="accB');
    expect(expanded).toContain('class="accB');
    expect(expanded).toMatch(/data-k="sodium_mg"[^>]*aria-expanded="true"/);
});

test("every locale's review-week slide draws the trends card, then the digest", () => {
    for (const locale of SITE_LOCALES) {
        const slide = INDEX[locale]!.examples.slides.find(
            (s) => s.id === "review-week",
        )!;
        expect(
            slide.cards?.map((c) => c.kind),
            locale,
        ).toEqual(["trends", "digest"]);
        expect(Object.keys(slide.toolNotes), locale).toEqual([
            "get_trends",
            "get_digest",
        ]);
    }
});
// Sodium is tracked in milligrams and carried in every demo meal and day, so
// the figures the sodium slide and the digest quote are the ones the cards are
// built from.
test("every demo meal and day carries a sodium figure", () => {
    const rows = [
        ...Object.values(MEAL_CARDS).map((c) => c!.totals),
        ...HERO_DAY_MEALS.map(([, t]) => t),
        ...GOALS_DAY_MEALS,
    ];
    for (const t of rows) {
        expect(t.na).toBeGreaterThan(0);
    }
    expect(GOALS.sodium).toBe(2300);
});

test("the track-sodium card's meal is over the 2,300 mg limit", () => {
    const na = MEAL_CARDS["track-sodium"]!.totals.na;
    expect(na).toBe(2640);
    expect(na).toBeGreaterThan(GOALS.sodium);
    const html = renderCard("track-sodium", "en", "Tonkotsu ramen", DAY_MEALS);
    expect(html).toContain("Tonkotsu ramen");
});

test("the digest card draws its gauge and the demo period", () => {
    const html = renderCard("daily-digest", "en", "", DAY_MEALS);
    expect(html).toContain('class="gw');
    expect(html).toContain("Sun 8 Mar");
    expect(html).toContain("1,150 of 2,000 kcal");
    expect(html).not.toMatch(/undefined|NaN/);
});

test("no card repeats an element id inside its shadow root", () => {
    const ids: DemoCardId[] = [
        "hero-meal",
        "hero-day",
        "hero-weight",
        "log-meal",
        "photo-meal",
        "scan-barcode",
        "saved-meal",
        "goals-progress",
        "review-week",
        "weight-trend",
        "track-drinks",
        "track-sodium",
        "import-file",
        "usda-food",
        "daily-digest",
        "digest-week",
    ];
    for (const id of ids) {
        const html = renderCard(id, "en", "Meal", DAY_MEALS);
        const root = html.slice(
            html.indexOf("<template shadowrootmode"),
            html.indexOf("</template>"),
        );
        const seen = [...root.matchAll(/\sid="([^"]*)"/g)].map((m) => m[1]);
        const dupes = seen.filter((v, i) => seen.indexOf(v) !== i);
        expect(dupes, `${id} duplicate ids`).toEqual([]);
    }
});

test("the daily-digest slide's card is the one-day digest, not the week", () => {
    expect(digestCardId("daily-digest")).toBe("daily-digest");
    expect(digestCardId("review-week")).toBe("digest-week");
    const doc = INDEX.en!;
    const slide = doc.examples.slides.find((s) => s.id === "daily-digest")!;
    const thread = exampleThread(slide, doc, "en");
    expect(thread).toContain("Sun 8 Mar");
    expect(thread).toContain("1,150 of 2,000 kcal");
    expect(thread).not.toContain("28 Feb");
});

test("every locale has the digest and sodium slides", () => {
    for (const locale of SITE_LOCALES) {
        const ids = INDEX[locale]!.examples.slides.map((s) => s.id);
        expect(ids, locale).toContain("daily-digest");
        expect(ids, locale).toContain("track-sodium");
    }
});

test("the english goals reply names the sodium limit", () => {
    const slide = INDEX.en!.examples.slides.find(
        (s) => s.id === "goals-progress",
    )!;
    expect(slide.messages[3]!.text).toContain("2,300 mg sodium");
});
