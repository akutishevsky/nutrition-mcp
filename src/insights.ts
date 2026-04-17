import type { Meal, NutritionGoals, WaterEntry } from "./supabase.js";

export interface DailyBucket {
    date: string; // YYYY-MM-DD
    meals: Meal[];
    waterMl: number;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    mealTypes: Set<string>;
}

function mean(values: number[]): number {
    if (values.length === 0) return 0;
    let sum = 0;
    for (const v of values) sum += v;
    return sum / values.length;
}

function stdDev(values: number[]): number {
    if (values.length < 2) return 0;
    const m = mean(values);
    let sq = 0;
    for (const v of values) sq += (v - m) ** 2;
    return Math.sqrt(sq / (values.length - 1));
}

function round(n: number, places = 1): number {
    const f = 10 ** places;
    return Math.round(n * f) / f;
}

function addDays(date: string, days: number): string {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

function dateDiffDays(start: string, end: string): number {
    const a = new Date(`${start}T00:00:00Z`).getTime();
    const b = new Date(`${end}T00:00:00Z`).getTime();
    return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Build per-day buckets for every date in [startDate, endDate], including days with no logs. */
export function buildDailyBuckets(
    meals: Meal[],
    water: WaterEntry[],
    startDate: string,
    endDate: string,
): DailyBucket[] {
    const buckets = new Map<string, DailyBucket>();
    const totalDays = dateDiffDays(startDate, endDate);
    for (let i = 0; i <= totalDays; i++) {
        const date = addDays(startDate, i);
        buckets.set(date, {
            date,
            meals: [],
            waterMl: 0,
            calories: 0,
            protein_g: 0,
            carbs_g: 0,
            fat_g: 0,
            mealTypes: new Set(),
        });
    }

    for (const m of meals) {
        const date = m.logged_at.slice(0, 10);
        const b = buckets.get(date);
        if (!b) continue;
        b.meals.push(m);
        b.calories += m.calories ?? 0;
        b.protein_g += m.protein_g ?? 0;
        b.carbs_g += m.carbs_g ?? 0;
        b.fat_g += m.fat_g ?? 0;
        if (m.meal_type) b.mealTypes.add(m.meal_type);
    }

    for (const w of water) {
        const date = w.logged_at.slice(0, 10);
        const b = buckets.get(date);
        if (!b) continue;
        b.waterMl += w.amount_ml;
    }

    return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function trailingAverage(buckets: DailyBucket[], field: keyof DailyBucket, n: number): number {
    const slice = buckets.slice(-n);
    const values = slice.map((b) => b[field] as number);
    return mean(values);
}

function longestStreak(buckets: DailyBucket[], predicate: (b: DailyBucket) => boolean): number {
    let best = 0;
    let cur = 0;
    for (const b of buckets) {
        if (predicate(b)) {
            cur++;
            if (cur > best) best = cur;
        } else {
            cur = 0;
        }
    }
    return best;
}

function currentStreak(buckets: DailyBucket[], predicate: (b: DailyBucket) => boolean): number {
    let count = 0;
    for (let i = buckets.length - 1; i >= 0; i--) {
        if (predicate(buckets[i]!)) count++;
        else break;
    }
    return count;
}

function nonEmpty(b: DailyBucket): boolean {
    return b.meals.length > 0 || b.waterMl > 0;
}

function formatStatLine(
    label: string,
    unit: string,
    avg7: number,
    avg14: number,
    avg30: number,
    target: number | null,
    values: number[],
): string {
    const parts = [
        `${label}:`,
        `  7d avg: ${round(avg7)}${unit}`,
        `  14d avg: ${round(avg14)}${unit}`,
        `  30d avg: ${round(avg30)}${unit}`,
    ];
    if (target != null && target > 0) {
        const daysOnTarget = values.filter(
            (v) => v >= target * 0.9 && v <= target * 1.1,
        ).length;
        parts.push(`  Target: ${target}${unit}`);
        parts.push(
            `  Days within ±10% of target: ${daysOnTarget}/${values.length}`,
        );
    }
    const sd = stdDev(values);
    const m = mean(values);
    const cv = m > 0 ? (sd / m) * 100 : 0;
    parts.push(`  Std dev: ${round(sd)}${unit} (CV ${round(cv)}%)`);
    return parts.join("\n");
}

export function computeTrends(
    buckets: DailyBucket[],
    goals: NutritionGoals | null,
): string {
    if (buckets.length === 0) return "No data in range.";

    const logged = buckets.filter(nonEmpty);
    const caloriesDaily = buckets.map((b) => b.calories);
    const proteinDaily = buckets.map((b) => b.protein_g);
    const carbsDaily = buckets.map((b) => b.carbs_g);
    const fatDaily = buckets.map((b) => b.fat_g);
    const waterDaily = buckets.map((b) => b.waterMl);

    const sections: string[] = [];

    sections.push(
        `Trends — ${buckets[0]!.date} to ${buckets[buckets.length - 1]!.date} (${buckets.length} days)`,
    );

    // Logging activity
    sections.push(
        [
            "Logging activity:",
            `  Days with any log: ${logged.length}/${buckets.length} (${round((logged.length / buckets.length) * 100, 0)}%)`,
            `  Current logging streak: ${currentStreak(buckets, nonEmpty)} days`,
            `  Longest logging streak: ${longestStreak(buckets, nonEmpty)} days`,
        ].join("\n"),
    );

    // Macro/calorie stats
    sections.push(
        formatStatLine(
            "Calories",
            " kcal",
            trailingAverage(buckets, "calories", 7),
            trailingAverage(buckets, "calories", 14),
            trailingAverage(buckets, "calories", 30),
            goals?.daily_calories ?? null,
            caloriesDaily,
        ),
    );
    sections.push(
        formatStatLine(
            "Protein",
            "g",
            trailingAverage(buckets, "protein_g", 7),
            trailingAverage(buckets, "protein_g", 14),
            trailingAverage(buckets, "protein_g", 30),
            goals?.daily_protein_g ?? null,
            proteinDaily,
        ),
    );
    sections.push(
        formatStatLine(
            "Carbs",
            "g",
            trailingAverage(buckets, "carbs_g", 7),
            trailingAverage(buckets, "carbs_g", 14),
            trailingAverage(buckets, "carbs_g", 30),
            goals?.daily_carbs_g ?? null,
            carbsDaily,
        ),
    );
    sections.push(
        formatStatLine(
            "Fat",
            "g",
            trailingAverage(buckets, "fat_g", 7),
            trailingAverage(buckets, "fat_g", 14),
            trailingAverage(buckets, "fat_g", 30),
            goals?.daily_fat_g ?? null,
            fatDaily,
        ),
    );
    sections.push(
        formatStatLine(
            "Water",
            " ml",
            trailingAverage(buckets, "waterMl", 7),
            trailingAverage(buckets, "waterMl", 14),
            trailingAverage(buckets, "waterMl", 30),
            goals?.daily_water_ml ?? null,
            waterDaily,
        ),
    );

    // Best / worst day (by calorie target proximity if goals set, else raw extremes on logged days)
    if (logged.length > 0) {
        let best: DailyBucket | null = null;
        let worst: DailyBucket | null = null;
        const target = goals?.daily_calories ?? null;
        if (target != null && target > 0) {
            let bestDist = Infinity;
            let worstDist = -Infinity;
            for (const b of logged) {
                const dist = Math.abs(b.calories - target);
                if (dist < bestDist) {
                    bestDist = dist;
                    best = b;
                }
                if (dist > worstDist) {
                    worstDist = dist;
                    worst = b;
                }
            }
        } else {
            best = logged.reduce((a, b) => (a.calories < b.calories ? a : b));
            worst = logged.reduce((a, b) => (a.calories > b.calories ? a : b));
        }
        if (best && worst) {
            sections.push(
                [
                    "Extremes (by calories):",
                    `  Closest to ${target != null ? "target" : "lowest"}: ${best.date} — ${best.calories} kcal, ${round(best.protein_g)}g P`,
                    `  Furthest / highest: ${worst.date} — ${worst.calories} kcal, ${round(worst.protein_g)}g P`,
                ].join("\n"),
            );
        }
    }

    // Day-of-week averages (calories)
    const dowTotals: number[] = [0, 0, 0, 0, 0, 0, 0];
    const dowCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
    for (const b of buckets) {
        if (!nonEmpty(b)) continue;
        const d = new Date(`${b.date}T00:00:00Z`).getUTCDay();
        dowTotals[d]! += b.calories;
        dowCounts[d]! += 1;
    }
    const dowLines = DOW.map((name, i) => {
        const count = dowCounts[i]!;
        if (count === 0) return `  ${name}: —`;
        return `  ${name}: ${Math.round(dowTotals[i]! / count)} kcal avg`;
    });
    sections.push(["Day-of-week calorie averages:", ...dowLines].join("\n"));

    return sections.join("\n\n");
}

export function computeMealPatterns(buckets: DailyBucket[]): string {
    const logged = buckets.filter(nonEmpty);
    if (logged.length === 0) return "No data in range.";

    const sections: string[] = [
        `Patterns — ${buckets[0]!.date} to ${buckets[buckets.length - 1]!.date} (${logged.length} logged days of ${buckets.length})`,
    ];

    // Meal-type presence rates (only counting logged days)
    const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
    const presenceLines: string[] = [];
    for (const t of mealTypes) {
        const withType = logged.filter((b) => b.mealTypes.has(t));
        const rate = (withType.length / logged.length) * 100;
        presenceLines.push(
            `  ${t}: ${withType.length}/${logged.length} days (${round(rate, 0)}%)`,
        );
    }
    sections.push(["Meal-type presence (logged days):", ...presenceLines].join("\n"));

    // Breakfast effect
    const withBreakfast = logged.filter((b) => b.mealTypes.has("breakfast"));
    const withoutBreakfast = logged.filter((b) => !b.mealTypes.has("breakfast"));
    if (withBreakfast.length > 0 && withoutBreakfast.length > 0) {
        const avg = (xs: DailyBucket[], f: keyof DailyBucket) =>
            round(mean(xs.map((b) => b[f] as number)));
        sections.push(
            [
                "Breakfast effect:",
                `  Days WITH breakfast: ${withBreakfast.length} — ${avg(withBreakfast, "calories")} kcal, ${avg(withBreakfast, "protein_g")}g P, ${avg(withBreakfast, "waterMl")} ml water`,
                `  Days WITHOUT breakfast: ${withoutBreakfast.length} — ${avg(withoutBreakfast, "calories")} kcal, ${avg(withoutBreakfast, "protein_g")}g P, ${avg(withoutBreakfast, "waterMl")} ml water`,
                `  Delta: ${round(mean(withBreakfast.map((b) => b.calories)) - mean(withoutBreakfast.map((b) => b.calories)))} kcal`,
            ].join("\n"),
        );
    }

    // High-calorie lunch days
    const lunchKcal = (b: DailyBucket) =>
        b.meals
            .filter((m) => m.meal_type === "lunch")
            .reduce((s, m) => s + (m.calories ?? 0), 0);
    const bigLunchDays = logged.filter((b) => lunchKcal(b) >= 900);
    const normalLunchDays = logged.filter(
        (b) => lunchKcal(b) > 0 && lunchKcal(b) < 900,
    );
    if (bigLunchDays.length > 0 && normalLunchDays.length > 0) {
        sections.push(
            [
                "High-calorie-lunch days (lunch ≥ 900 kcal):",
                `  Frequency: ${bigLunchDays.length}/${logged.length} days`,
                `  Avg daily total on big-lunch days: ${round(mean(bigLunchDays.map((b) => b.calories)))} kcal`,
                `  Avg daily total on normal-lunch days: ${round(mean(normalLunchDays.map((b) => b.calories)))} kcal`,
            ].join("\n"),
        );
    }

    // Late-dinner effect (dinner logged after 20:00 local — using UTC hour, fine for v1)
    const isLateDinner = (b: DailyBucket) =>
        b.meals.some((m) => {
            if (m.meal_type !== "dinner") return false;
            const h = new Date(m.logged_at).getUTCHours();
            return h >= 20 || h < 4;
        });
    const lateDinnerDays = logged.filter(isLateDinner);
    const earlyDinnerDays = logged.filter(
        (b) => b.mealTypes.has("dinner") && !isLateDinner(b),
    );
    if (lateDinnerDays.length > 0 && earlyDinnerDays.length > 0) {
        sections.push(
            [
                "Late-dinner effect (dinner ≥ 20:00 UTC):",
                `  Late-dinner days: ${lateDinnerDays.length} — avg ${round(mean(lateDinnerDays.map((b) => b.calories)))} kcal, ${round(mean(lateDinnerDays.map((b) => b.protein_g)))}g P`,
                `  Early-dinner days: ${earlyDinnerDays.length} — avg ${round(mean(earlyDinnerDays.map((b) => b.calories)))} kcal, ${round(mean(earlyDinnerDays.map((b) => b.protein_g)))}g P`,
            ].join("\n"),
        );
    }

    // Weekend vs weekday
    const isWeekend = (b: DailyBucket) => {
        const d = new Date(`${b.date}T00:00:00Z`).getUTCDay();
        return d === 0 || d === 6;
    };
    const weekendDays = logged.filter(isWeekend);
    const weekdayDays = logged.filter((b) => !isWeekend(b));
    if (weekendDays.length > 0 && weekdayDays.length > 0) {
        sections.push(
            [
                "Weekend vs weekday:",
                `  Weekday avg: ${round(mean(weekdayDays.map((b) => b.calories)))} kcal, ${round(mean(weekdayDays.map((b) => b.protein_g)))}g P`,
                `  Weekend avg: ${round(mean(weekendDays.map((b) => b.calories)))} kcal, ${round(mean(weekendDays.map((b) => b.protein_g)))}g P`,
            ].join("\n"),
        );
    }

    // Outlier days (> 2 std from mean calories)
    const m = mean(logged.map((b) => b.calories));
    const sd = stdDev(logged.map((b) => b.calories));
    const outliers = logged.filter((b) => Math.abs(b.calories - m) > 2 * sd);
    if (outliers.length > 0 && sd > 0) {
        const lines = outliers
            .sort((a, b) => Math.abs(b.calories - m) - Math.abs(a.calories - m))
            .slice(0, 5)
            .map(
                (b) =>
                    `  ${b.date}: ${b.calories} kcal (${b.calories > m ? "+" : ""}${round(b.calories - m)} vs avg)`,
            );
        sections.push(["Outlier days (>2σ from avg):", ...lines].join("\n"));
    }

    return sections.join("\n\n");
}

export function computeWeeklyDigest(
    buckets: DailyBucket[],
    goals: NutritionGoals | null,
): string {
    if (buckets.length === 0) return "No data in the past week.";

    const logged = buckets.filter(nonEmpty);
    const avgCals = round(mean(buckets.map((b) => b.calories)));
    const avgProtein = round(mean(buckets.map((b) => b.protein_g)));
    const avgCarbs = round(mean(buckets.map((b) => b.carbs_g)));
    const avgFat = round(mean(buckets.map((b) => b.fat_g)));
    const avgWater = round(mean(buckets.map((b) => b.waterMl)));
    const totalMeals = buckets.reduce((s, b) => s + b.meals.length, 0);

    const lines: string[] = [];
    lines.push(
        `Weekly digest — ${buckets[0]!.date} to ${buckets[buckets.length - 1]!.date}`,
    );
    lines.push("");
    lines.push(`Logged ${logged.length}/${buckets.length} days, ${totalMeals} meals total.`);
    lines.push("");
    lines.push("Daily averages:");
    const line = (label: string, val: number, unit: string, target: number | null) => {
        if (target == null || target <= 0) return `  ${label}: ${val}${unit}`;
        const pct = round((val / target) * 100, 0);
        return `  ${label}: ${val}${unit} / ${target}${unit} target (${pct}%)`;
    };
    lines.push(line("Calories", avgCals, " kcal", goals?.daily_calories ?? null));
    lines.push(line("Protein", avgProtein, "g", goals?.daily_protein_g ?? null));
    lines.push(line("Carbs", avgCarbs, "g", goals?.daily_carbs_g ?? null));
    lines.push(line("Fat", avgFat, "g", goals?.daily_fat_g ?? null));
    lines.push(line("Water", avgWater, " ml", goals?.daily_water_ml ?? null));

    // Best and worst day this week (by calorie target if set)
    if (logged.length > 0) {
        const target = goals?.daily_calories ?? null;
        let best: DailyBucket;
        let worst: DailyBucket;
        if (target != null && target > 0) {
            best = logged.reduce((a, b) =>
                Math.abs(a.calories - target) <= Math.abs(b.calories - target)
                    ? a
                    : b,
            );
            worst = logged.reduce((a, b) =>
                Math.abs(a.calories - target) >= Math.abs(b.calories - target)
                    ? a
                    : b,
            );
        } else {
            best = logged.reduce((a, b) => (a.calories < b.calories ? a : b));
            worst = logged.reduce((a, b) => (a.calories > b.calories ? a : b));
        }
        lines.push("");
        lines.push(
            `Best day: ${best.date} (${best.calories} kcal, ${round(best.protein_g)}g P)`,
        );
        lines.push(
            `Roughest day: ${worst.date} (${worst.calories} kcal, ${round(worst.protein_g)}g P)`,
        );
    }

    if (!goals) {
        lines.push("");
        lines.push(
            "(Tip: call set_nutrition_goals to get target-based coaching in future digests.)",
        );
    }

    return lines.join("\n");
}
