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
