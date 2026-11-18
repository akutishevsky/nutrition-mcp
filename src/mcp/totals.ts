import { z } from "zod";
import { activityMetaFromDays, type ActivityTotals } from "../activity.js";
import {
    goalsOnDate,
    type GoalValues,
    type NutritionGoalsHistoryRow,
} from "../goals-history.js";
import {
    coveredDailyAverage,
    dateDiffDays,
    dayCarries,
    type DailyBucket,
} from "../insights.js";
import { clipDescription, type AlcoholDisplay } from "../meal-listing.js";
import {
    activityCreditPctFromProfile,
    getNutritionGoalsHistory,
    type Meal,
    type NutritionGoals,
    type Profile,
    type WaterEntry,
} from "../supabase.js";
import { dateInTz, todayInTz } from "../tz.js";
import {
    ACTIVITY_META_KEY,
    ADDED_SUGAR_META_KEY,
    LOCAL_TODAY_META_KEY,
    MEAL_BREAKDOWN_TOP_N,
    MEAL_CONTRIBUTORS_META_KEY,
    MEAL_ITEMS_META_KEY,
    MEAL_TIMES_META_KEY,
    PERIOD_AVERAGES_META_KEY,
    SATURATED_FAT_META_KEY,
    SODIUM_META_KEY,
    WEIGHT_SERIES_META_KEY,
} from "../widgets.js";

export interface DailyTotals {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    // Part of fat_g; text only, like added_sugar_g below.
    saturated_fat_g: number;
    trans_fat_g: number;
    fiber_g: number;
    sugar_g: number;
    // Text only: totalsPayloadOf picks its fields by name and never emits this
    // one, because every structuredContent shape that carries totals is frozen
    // (see ADDED_SUGAR_META_KEY for where the widgets get it instead).
    added_sugar_g: number;
    alcohol_g: number;
    // Milligrams, unlike every gram-valued field above it — the unit rides in
    // the name at every layer because caffeine is the one nutrient here whose
    // unit differs from its siblings. It carries no energy, so it never enters
    // a kcal derivation.
    caffeine_mg: number;
    // Milligrams like caffeine; text only, like added_sugar_g (the widgets get
    // it from SODIUM_META_KEY).
    sodium_mg: number;
    water_ml: number;
}

export function emptyTotals(): DailyTotals {
    return {
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        saturated_fat_g: 0,
        trans_fat_g: 0,
        fiber_g: 0,
        sugar_g: 0,
        added_sugar_g: 0,
        alcohol_g: 0,
        caffeine_mg: 0,
        sodium_mg: 0,
        water_ml: 0,
    };
}

export function sumMeals(meals: Meal[]): DailyTotals {
    const totals = emptyTotals();
    for (const m of meals) {
        totals.calories += m.calories ?? 0;
        totals.protein_g += m.protein_g ?? 0;
        totals.carbs_g += m.carbs_g ?? 0;
        totals.fat_g += m.fat_g ?? 0;
        totals.saturated_fat_g += m.saturated_fat_g ?? 0;
        totals.trans_fat_g += m.trans_fat_g ?? 0;
        // Summed regardless of the alcohol opt-in: the flag gates display, and
        // gating here would make the total depend on when it was computed.
        // The `?? 0` here is a SUM, which is fine — a missing value adds
        // nothing. It is only the AVERAGE that needs to know a null from a
        // zero, and that is what nutrientPresence below is for.
        totals.fiber_g += m.fiber_g ?? 0;
        totals.sugar_g += m.sugar_g ?? 0;
        totals.added_sugar_g += m.added_sugar_g ?? 0;
        totals.alcohol_g += m.alcohol_g ?? 0;
        totals.caffeine_mg += m.caffeine_mg ?? 0;
        totals.sodium_mg += m.sodium_mg ?? 0;
    }
    return totals;
}

// Which of the post-launch nutrients a day's meals actually carry. Every meal
// logged before each of them shipped has NULL fiber/sugar/alcohol/caffeine, and
// so does every row imported from an export whose file had no such column;
// `?? 0` cannot tell that apart from a genuine zero. A thin adapter over
// dayCarries in insights.ts — the rule itself lives there, once, so trends and
// the summary cannot drift apart (measured drift: 30 g/day of fiber shown as
// "30d avg: 5g" against a "Target: 30g").
//
// Caffeine is the sharpest case of the four: most meals legitimately never
// carry a value, so a day that recorded none is the norm rather than a relic of
// pre-feature history, and it is this flag — not any profile setting — that
// keeps a fabricated "0 mg" off the screen.
export interface NutrientPresence {
    saturated_fat_g: boolean;
    trans_fat_g: boolean;
    fiber_g: boolean;
    sugar_g: boolean;
    added_sugar_g: boolean;
    alcohol_g: boolean;
    caffeine_mg: boolean;
    sodium_mg: boolean;
}

export function nutrientPresence(meals: Meal[]): NutrientPresence {
    return {
        saturated_fat_g: dayCarries(meals, "saturated_fat_g"),
        trans_fat_g: dayCarries(meals, "trans_fat_g"),
        fiber_g: dayCarries(meals, "fiber_g"),
        sugar_g: dayCarries(meals, "sugar_g"),
        added_sugar_g: dayCarries(meals, "added_sugar_g"),
        alcohol_g: dayCarries(meals, "alcohol_g"),
        caffeine_mg: dayCarries(meals, "caffeine_mg"),
        sodium_mg: dayCarries(meals, "sodium_mg"),
    };
}

// Per-day means over a date range, and the denominator each one used.
//
// THE RULE, and it is insights.ts's rule rather than a second copy of it:
// calories, protein, carbs, fat and water divide by EVERY logged day, exactly
// as they always have (users have history built on those figures), while fiber,
// sugar, alcohol and caffeine go through coveredDailyAverage — a day carrying
// no value for a nutrient is excluded from both its numerator and its
// denominator. A nutrient nobody recorded reports 0 over 0 days, which callers
// must render as "not recorded" rather than as a genuine zero.
//
// LOGGED days, deliberately — and that is where this parts company with
// get_trends, which divides the same nutrients by every CALENDAR day in the
// window. Both are right for their own question ("what does a day I eat look
// like?" vs. "what am I averaging over the month?"), so issue #70 was closed by
// DISCLOSING the divergence rather than unifying it: a 15-of-30-days window
// legitimately reads 2000 kcal here and 1000 kcal there. Each side now names
// its own denominator in its text output (loggedDayAverageNote below, and the
// calendar-day note in insights.ts). Silently switching either one would
// rewrite the figures every existing user's history is built on.
export function rangeAverages(
    perDay: Array<{ meals: Meal[]; totals: DailyTotals }>,
): {
    // No trans fat average: nothing reads one (trans fat has no limit and is
    // shown per day only), so it is not zero-filled over every day here.
    averages: Omit<DailyTotals, "trans_fat_g">;
    recordedDays: {
        saturated_fat_g: number;
        fiber_g: number;
        sugar_g: number;
        added_sugar_g: number;
        alcohol_g: number;
        caffeine_mg: number;
        sodium_mg: number;
    };
} {
    const sum = emptyTotals();
    for (const { totals } of perDay) {
        sum.calories += totals.calories;
        sum.protein_g += totals.protein_g;
        sum.carbs_g += totals.carbs_g;
        sum.fat_g += totals.fat_g;
        sum.saturated_fat_g += totals.saturated_fat_g;
        sum.water_ml += totals.water_ml;
    }
    const mealsByDay = perDay.map((d) => d.meals);
    const fiber = coveredDailyAverage(mealsByDay, "fiber_g");
    const sugar = coveredDailyAverage(mealsByDay, "sugar_g");
    const addedSugar = coveredDailyAverage(mealsByDay, "added_sugar_g");
    const saturated = coveredDailyAverage(mealsByDay, "saturated_fat_g");
    const alcohol = coveredDailyAverage(mealsByDay, "alcohol_g");
    const caffeine = coveredDailyAverage(mealsByDay, "caffeine_mg");
    const sodium = coveredDailyAverage(mealsByDay, "sodium_mg");
    const n = perDay.length || 1;
    return {
        averages: {
            calories: sum.calories / n,
            protein_g: sum.protein_g / n,
            carbs_g: sum.carbs_g / n,
            fat_g: sum.fat_g / n,
            saturated_fat_g: saturated.avg ?? 0,
            fiber_g: fiber.avg ?? 0,
            sugar_g: sugar.avg ?? 0,
            added_sugar_g: addedSugar.avg ?? 0,
            alcohol_g: alcohol.avg ?? 0,
            caffeine_mg: caffeine.avg ?? 0,
            sodium_mg: sodium.avg ?? 0,
            water_ml: Math.round(sum.water_ml / n),
        },
        recordedDays: {
            fiber_g: fiber.days,
            sugar_g: sugar.days,
            added_sugar_g: addedSugar.days,
            saturated_fat_g: saturated.days,
            alcohol_g: alcohol.days,
            caffeine_mg: caffeine.days,
            sodium_mg: sodium.days,
        },
    };
}

// insights.ts is deliberately free of Supabase, so it cannot know about the
// per-user opt-in: it renders an alcohol line whenever the data contains any
// (see hasAnyPositive there). Zeroing the series is how the flag reaches it —
// both computeTrends and computeWeeklyDigest suppress alcohol on an all-zero
// series, and neither derives anything else from it. Cheap: the buckets are
// per-request and at most 365 shallow copies.
//
// Alcohol only. The spread copies caffeine_mg through untouched, which is the
// intent: caffeine has no opt-in flag to reach insights.ts with, and there
// hasAnyPositive alone decides whether its line is drawn.
export function gateAlcohol(
    buckets: DailyBucket[],
    alcohol: AlcoholDisplay,
): DailyBucket[] {
    if (alcohol) return buckets;
    return buckets.map((b) => ({ ...b, alcohol_g: 0 }));
}

export function sumWater(entries: WaterEntry[]): number {
    let total = 0;
    for (const e of entries) total += e.amount_ml;
    return total;
}

// Inclusive day count of a range the caller has already validated.
export function dayCountOf(start: string, end: string): number {
    return dateDiffDays(start, end) + 1;
}

// The goal history a single past day is judged against, read inside the
// caller's Promise.all so it runs alongside the day's other reads. `date` is
// null when no single past day is in play (a range, today, a future date), and
// then nothing is read and goalsForDate keeps the current row.
export function pastDayGoalHistory(
    userId: string,
    date: string | null,
    tz: string,
): Promise<NutritionGoalsHistoryRow[] | null> {
    if (date === null || date >= todayInTz(tz)) return Promise.resolve(null);
    return getNutritionGoalsHistory(userId);
}

// The calorie goal a single date is judged against. Today, a future date and a
// range keep the current row (history is null). A past single date gets the
// goal in effect on that date from the history pastDayGoalHistory read, so
// changing the goal today does not re-judge last week. The result has the
// shape of the current row; only the goal columns come from history.
export function goalsForDate(
    userId: string,
    date: string,
    tz: string,
    current: NutritionGoals | null,
    history: NutritionGoalsHistoryRow[] | null,
): NutritionGoals | null {
    if (history === null) return current;
    const on = goalsOnDate(history, date, tz);
    if (!on) return current;
    const values: GoalValues = on.goals;
    return {
        ...values,
        user_id: userId,
        updated_at: current?.updated_at ?? "",
    };
}

// The `_meta` entry for active calories, from per-day totals; present only when
// the period has any. Callers pass the map they already grouped the period into.
export function activityMetaEntry(
    byDay: ReadonlyMap<string, ActivityTotals>,
): Record<string, unknown> {
    const meta = activityMetaFromDays(byDay);
    return meta ? { [ACTIVITY_META_KEY]: meta } : {};
}

// get_profile's line for the share of active calories that counts against
// intake. Descriptive, like the other setting lines: it names the default when
// nothing was ever chosen, and says the calorie goal is untouched.
export function activityCreditLine(profile: Profile | null): string {
    const pct = activityCreditPctFromProfile(profile);
    const chosen = profile?.activity_credit_pct != null;
    return `Active calories: ${pct}% counts against intake for entries logged from now on${chosen ? "" : " (the default; never set)"}. Burned energy is shown beside intake and never changes the calorie goal. Entries already logged keep the share they were logged with. The user can change it with set_activity_credit.`;
}

// Per-meal macro breakdown handed to the widgets so tapping a macro ring can
// reveal which meals contributed to it. `date` is null for single-day views
// (the widget labels each row by meal type instead) and set to YYYY-MM-DD for
// multi-day ranges so the widget can tag each meal with its day.
export const MEAL_BREAKDOWN_ITEM = z.object({
    description: z.string(),
    meal_type: z.string().nullable(),
    date: z.string().nullable(),
    calories: z.number(),
    protein_g: z.number(),
    carbs_g: z.number(),
    fat_g: z.number(),
    fiber_g: z.number(),
    sugar_g: z.number(),
    // Nullable where the other macros are not: null is how every structured
    // payload says "this user does not track alcohol", which a 0 could not
    // distinguish from a genuinely alcohol-free day.
    alcohol_g: z.number().nullable(),
    // Nullable for the neighbouring reason with no flag behind it: this meal
    // simply has no caffeine figure. Most meals never will, so a 0 here would
    // claim the user measured a caffeine-free lunch. Milligrams.
    caffeine_mg: z.number().nullable(),
});

export function mealBreakdown(
    meals: Meal[],
    dateTz: string | null,
    alcohol: AlcoholDisplay,
) {
    return meals.map((m) => ({
        description: clipDescription(m.description),
        meal_type: m.meal_type ?? null,
        date: dateTz ? dateInTz(m.logged_at, dateTz) : null,
        calories: Math.round(m.calories ?? 0),
        protein_g: Math.round((m.protein_g ?? 0) * 10) / 10,
        carbs_g: Math.round((m.carbs_g ?? 0) * 10) / 10,
        fat_g: Math.round((m.fat_g ?? 0) * 10) / 10,
        fiber_g: Math.round((m.fiber_g ?? 0) * 10) / 10,
        sugar_g: Math.round((m.sugar_g ?? 0) * 10) / 10,
        alcohol_g: alcohol ? Math.round((m.alcohol_g ?? 0) * 10) / 10 : null,
        caffeine_mg:
            m.caffeine_mg == null ? null : Math.round(m.caffeine_mg * 10) / 10,
    }));
}

// MEAL_BREAKDOWN_TOP_N lives in src/widgets.ts (Supabase-free, so the widget
// harness can import it too); re-exported here for existing importers.
export { MEAL_BREAKDOWN_TOP_N };

// The metrics a summary's meal list can be opened on, in MEAL_BREAKDOWN_ITEM's
// field names.
export const BREAKDOWN_METRICS = [
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
    "alcohol_g",
    "caffeine_mg",
] as const;

export type BreakdownRow = ReturnType<typeof mealBreakdown>[number];

// How many meals contributed to each metric over the whole window — the true
// "N more meals" denominator once `meals` is cut to the top N. Alcohol is null
// when tracking is off, like every other structured alcohol field.
export const MEAL_CONTRIBUTORS = z.object({
    calories: z.number(),
    protein_g: z.number(),
    carbs_g: z.number(),
    fat_g: z.number(),
    fiber_g: z.number(),
    sugar_g: z.number(),
    alcohol_g: z.number().nullable(),
    caffeine_mg: z.number(),
});

export type MealContributors = z.infer<typeof MEAL_CONTRIBUTORS>;

// Defined in src/widgets.ts (so the side-effect-free widget harness can import
// it too); re-exported here beside the MealContributors it carries.
export { MEAL_CONTRIBUTORS_META_KEY };
// Same arrangement for get_weight_trends' series (WeightSeriesMeta, built in
// src/weight-trend.ts).
export { WEIGHT_SERIES_META_KEY };
// And for get_trends' per-period averages (PeriodAveragesMeta, built in
// src/periods.ts), present only when `group_by` is set.
export { PERIOD_AVERAGES_META_KEY };
// And for the added-sugar figures (AddedSugarMeta) that five tools carry
// beside their frozen structuredContent.
export {
    ACTIVITY_META_KEY,
    ADDED_SUGAR_META_KEY,
    SATURATED_FAT_META_KEY,
    SODIUM_META_KEY,
};
// And get_trends' local "today" (the trends widget's still-running-day rule).
export { LOCAL_TODAY_META_KEY };
// And for the ingredients behind the breakdown rows (MealItemsMeta, built in
// src/meal-items.ts), present only when some row has items.
export { MEAL_ITEMS_META_KEY };
// And for each row's local clock time (MealTimesMeta, built in
// src/meal-times.ts), plus the written meal's position on the meal-progress
// tools.
export { MEAL_TIMES_META_KEY };

/** Zero contributors, for a window with no meals at all. `.nullable()` is not
 *  optional: the alcohol key is always present, null when tracking is off. */
export function emptyMealContributors(
    alcohol: AlcoholDisplay,
): MealContributors {
    return {
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
        sugar_g: 0,
        alcohol_g: alcohol ? 0 : null,
        caffeine_mg: 0,
    };
}

/**
 * Bound a multi-day breakdown to what the summary widget can show: the
 * order-preserving union of each metric's top MEAL_BREAKDOWN_TOP_N rows (by
 * value, ties to the earlier row — the widget's own stable sort), so at most
 * 8 metrics × N rows. A 186-meal month otherwise shipped ~47 KB of rows the
 * widget never drew. `contributors` counts every row with a positive value,
 * which is the widget's own `v > 0` filter.
 */
export function topMealBreakdown(
    rows: BreakdownRow[],
    alcohol: AlcoholDisplay,
): {
    meals: BreakdownRow[];
    contributors: MealContributors;
    /** Indices of the kept rows, in order — to pick the matching meals. */
    kept: number[];
} {
    const keep = new Set<number>();
    const contributors = emptyMealContributors(alcohol);
    const top = (values: number[]) =>
        values
            .map((v, i) => ({ i, v }))
            .filter((r) => r.v > 0)
            .sort((a, b) => b.v - a.v || a.i - b.i);
    for (const key of BREAKDOWN_METRICS) {
        const ranked = top(rows.map((row) => row[key] ?? 0));
        if (key !== "alcohol_g" || alcohol) contributors[key] = ranked.length;
        for (const r of ranked.slice(0, MEAL_BREAKDOWN_TOP_N)) keep.add(r.i);
    }
    const kept = rows.map((_, i) => i).filter((i) => keep.has(i));
    return {
        meals: kept.map((i) => rows[i]!),
        contributors,
        kept,
    };
}

// Every goals / totals / averages payload in this file has the same shape, so
// they share one schema each (and one builder each, below) instead of four
// hand-maintained copies — which is what let three of them drift apart on the
// last field addition.
