import { test, expect } from "bun:test";
import {
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

/** The cards whose macro strip shows saturated fat (every card that is a meal
 * or a day of meals). */
const STRIP_CARDS: DemoCardId[] = [
    "hero-meal",
    "hero-day",
    "log-meal",
    "photo-meal",
    "scan-barcode",
    "saved-meal",
    "goals-progress",
    "review-week",
    "track-drinks",
    "usda-food",
];

const DAY_MEALS = [
    { description: "Breakfast", type: "breakfast" },
    { description: "Lunch", type: "lunch" },
    { description: "Snack", type: "snack" },
];

test("every strip card shows the saturated-fat cell and its limit", () => {
    for (const id of STRIP_CARDS) {
        const html = renderCard(id, "en", "Meal", DAY_MEALS);
        expect(html, `${id} omits saturated fat`).toContain("Saturated fat");
        expect(html, `${id} omits the 20 g limit`).toContain("limit 20 g");
    }
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
