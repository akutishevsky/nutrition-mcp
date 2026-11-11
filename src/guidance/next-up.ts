import { createHash } from "node:crypto";
import type { GuidancePreferences } from "./contracts.js";

/**
 * Next up — the pure domain of the Today guidance rework (brief
 * D1–D7, 2026-11-10). The old panel restated the day ("Protein
 * recorded so far: X g of a Y g target"); this module is the
 * machinery that makes that class of output impossible:
 *
 * - Context is assembled deterministically by the service from real
 *   reads (budget, pantry, plan, groceries, candidates). Everything
 *   a suggestion may cite lives in `NextUpContext` — the grounding
 *   boundary (D4). A model pick is validated against it, and every
 *   number the user sees is computed HERE from the context, never
 *   taken from model output.
 * - Every rendered line is typed (a suggestion, a use-first pantry
 *   signal, a planned-meal event, a grocery gap) and carries its
 *   remedy or action. `findRestatement` is the D1 tripwire the
 *   service runs over composed output before returning it.
 * - When there is genuinely nothing to act on, the section is ONE
 *   quiet line (D5) built from facts, not filler.
 */

export type NextUpDayPart = "morning" | "midday" | "evening";
export type NextUpSlot = "breakfast" | "lunch" | "dinner" | "snack";

export interface NextUpNutrition {
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
}

export interface NextUpPantryItem {
    name: string;
    quantity: number | null;
    unit: string | null;
    stock_state: "available" | "low" | "depleted";
    /** ISO timestamp of the last inventory change for this item. */
    updated_at: string;
}

export interface NextUpPlannedMeal {
    meal_slot: string | null;
    recipe_name: string;
    recipe_id: string;
    recipe_revision_id: string;
    servings: number;
    nutrition_per_serving: NextUpNutrition | null;
}

export interface NextUpCandidate {
    /** Stable identity: `recipe:<uuid>` or `recent:<meal uuid>`. */
    id: string;
    kind: "recipe" | "recent";
    name: string;
    recipe_id: string | null;
    recipe_revision_id: string | null;
    /** Default amount the suggestion proposes (servings for a recipe, 1 for a recent meal). */
    servings: number;
    /** Nutrition for the full suggested amount, from context data only. */
    nutrition: NextUpNutrition;
    ingredient_names: string[];
    /** Pantry item names (context spelling) this candidate uses. */
    uses_pantry: string[];
    /** For recent meals: when it was last logged (ISO date). */
    last_logged_date: string | null;
}

export interface NextUpFeatureFlags {
    plan: boolean;
    recipes: boolean;
    groceries: boolean;
    pantry: boolean;
}

export interface NextUpContext {
    date: string;
    day_part: NextUpDayPart;
    objective: GuidancePreferences["objective"];
    /** Daily targets; nulls where the user set no target. */
    goals: NextUpNutrition;
    /** Today's logged totals (0 where nothing is logged). */
    totals: NextUpNutrition;
    /** Meal types with a logged meal today. */
    filled_slots: string[];
    /** Today's planned meals (empty when the Plan module is off). */
    planned: NextUpPlannedMeal[];
    /** On-hand pantry items, use-first order (empty when Pantry is off). */
    pantry: NextUpPantryItem[];
    /** Open grocery item names, context spelling (empty when Groceries is off). */
    grocery_names: string[];
    /** Suggestion candidates from saved recipes + recent meals. */
    candidates: NextUpCandidate[];
    features: NextUpFeatureFlags;
}

export interface NextUpLanding {
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    /** True when the landing total reaches the protein target. */
    protein_goal_met: boolean | null;
    /** True when the landing total stays at or under the calorie target. */
    within_calorie_goal: boolean | null;
}

export interface NextUpSecondaryLine {
    kind: "use_first" | "planned" | "grocery_gap";
    text: string;
}

/** What the composer (model or deterministic fallback) may decide. */
export interface NextUpComposition {
    candidate_id: string;
    servings: number;
    /** One sentence on why this meal, now. Numbers are validated. */
    reason: string;
    source: "model" | "deterministic";
}

const SLOT_ORDER: NextUpSlot[] = ["breakfast", "lunch", "dinner", "snack"];

export function dayPartForHour(hour: number): NextUpDayPart {
    if (hour < 11) return "morning";
    if (hour < 17) return "midday";
    return "evening";
}

function round1(value: number): number {
    return Math.round(value * 10) / 10;
}

function addNutrition(
    base: NextUpNutrition,
    extra: NextUpNutrition,
): NextUpNutrition {
    const add = (a: number | null, b: number | null) =>
        a == null && b == null ? null : round1((a ?? 0) + (b ?? 0));
    return {
        calories: add(base.calories, extra.calories),
        protein_g: add(base.protein_g, extra.protein_g),
        carbs_g: add(base.carbs_g, extra.carbs_g),
        fat_g: add(base.fat_g, extra.fat_g),
    };
}

/** Nutrition of a candidate scaled to an arbitrary serving count. */
export function scaleCandidateNutrition(
    candidate: NextUpCandidate,
    servings: number,
): NextUpNutrition {
    const factor = candidate.servings > 0 ? servings / candidate.servings : 0;
    const scale = (value: number | null) =>
        value == null ? null : round1(value * factor);
    return {
        calories: scale(candidate.nutrition.calories),
        protein_g: scale(candidate.nutrition.protein_g),
        carbs_g: scale(candidate.nutrition.carbs_g),
        fat_g: scale(candidate.nutrition.fat_g),
    };
}

/**
 * The slot the next suggestion should aim at: the day-part's natural
 * meal first, then the earliest main slot that is neither logged nor
 * planned. Snack only when every main slot is spoken for.
 */
export function targetSlotFor(context: NextUpContext): NextUpSlot {
    const covered = new Set<string>(context.filled_slots);
    for (const planned of context.planned) {
        if (planned.meal_slot) covered.add(planned.meal_slot);
    }
    const natural: NextUpSlot =
        context.day_part === "morning"
            ? "breakfast"
            : context.day_part === "midday"
              ? "lunch"
              : "dinner";
    if (!covered.has(natural)) return natural;
    for (const slot of SLOT_ORDER.slice(0, 3)) {
        if (!covered.has(slot)) return slot;
    }
    return "snack";
}

/** Remaining budget per nutrient (null when no target is set). */
export function remainingBudget(context: NextUpContext): NextUpNutrition {
    const remaining = (goal: number | null, total: number | null) =>
        goal == null ? null : round1(goal - (total ?? 0));
    return {
        calories: remaining(context.goals.calories, context.totals.calories),
        protein_g: remaining(context.goals.protein_g, context.totals.protein_g),
        carbs_g: remaining(context.goals.carbs_g, context.totals.carbs_g),
        fat_g: remaining(context.goals.fat_g, context.totals.fat_g),
    };
}

/** Where the day lands if the suggestion is eaten, computed server-side. */
export function landingFor(
    context: NextUpContext,
    candidate: NextUpCandidate,
    servings: number,
): NextUpLanding {
    const landing = addNutrition(
        {
            calories: context.totals.calories,
            protein_g: context.totals.protein_g,
            carbs_g: context.totals.carbs_g,
            fat_g: context.totals.fat_g,
        },
        scaleCandidateNutrition(candidate, servings),
    );
    return {
        ...landing,
        protein_goal_met:
            context.goals.protein_g == null || landing.protein_g == null
                ? null
                : landing.protein_g >= context.goals.protein_g,
        within_calorie_goal:
            context.goals.calories == null || landing.calories == null
                ? null
                : landing.calories <= context.goals.calories,
    };
}

/** Human landing sentence built only from computed landing values. */
export function landingText(
    context: NextUpContext,
    landing: NextUpLanding,
): string {
    const parts: string[] = [];
    if (landing.calories != null) {
        parts.push(
            `Day lands at ${Math.round(landing.calories).toLocaleString("en-US")} kcal`,
        );
    }
    if (landing.protein_goal_met === true) {
        parts.push("protein goal met");
    } else if (
        context.goals.protein_g != null &&
        landing.protein_g != null &&
        context.goals.protein_g - landing.protein_g > 0
    ) {
        parts.push(
            `${Math.round(context.goals.protein_g - landing.protein_g)} g of protein still to go`,
        );
    }
    if (landing.within_calorie_goal === false) {
        parts.push("a little over your calorie target");
    }
    return parts.length ? `${parts.join(" · ")}.` : "";
}

function normalizeName(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/** Token-containment name match, the same leniency the inventory matcher uses. */
export function namesMatch(a: string, b: string): boolean {
    const left = normalizeName(a);
    const right = normalizeName(b);
    if (!left || !right) return false;
    if (left === right) return true;
    const leftTokens = new Set(left.split(" "));
    const rightTokens = new Set(right.split(" "));
    const smaller =
        leftTokens.size <= rightTokens.size ? leftTokens : rightTokens;
    const larger =
        leftTokens.size <= rightTokens.size ? rightTokens : leftTokens;
    return [...smaller].every((token) => larger.has(token));
}

/**
 * Ingredients of the candidate that are neither on hand nor already
 * queued on the grocery list — the exact set "Add missing to
 * groceries" sends (recomputed server-side at action time too).
 */
export function missingIngredientsFor(
    candidate: NextUpCandidate,
    context: NextUpContext,
): string[] {
    const covered = (name: string) =>
        context.pantry.some((item) => namesMatch(item.name, name)) ||
        context.grocery_names.some((item) => namesMatch(item, name));
    return candidate.ingredient_names.filter((name) => !covered(name));
}

/**
 * True when the day needs nothing: dinner is logged or planned, and
 * any set targets are essentially met. Quiet beats suggesting a
 * fourth meal nobody asked for (D5).
 */
export function isDaySettled(context: NextUpContext): boolean {
    const dinnerCovered =
        context.filled_slots.includes("dinner") ||
        context.planned.some((meal) => meal.meal_slot === "dinner");
    if (!dinnerCovered) return false;
    const budget = remainingBudget(context);
    if (budget.calories != null && budget.calories < -100) return false;
    if (budget.calories != null && budget.calories > 250) return false;
    if (budget.protein_g != null && budget.protein_g > 10) return false;
    return true;
}

/**
 * The ONE quiet line for a settled or empty-handed day (D5). Built
 * from facts only; each clause is present only when it is true.
 */
export function quietLineFor(context: NextUpContext): string {
    const plannedDinner = context.planned.find(
        (meal) => meal.meal_slot === "dinner",
    );
    const budget = remainingBudget(context);
    const onTrack =
        (budget.calories == null ||
            (budget.calories >= -100 && budget.calories <= 250)) &&
        (budget.protein_g == null || budget.protein_g <= 10);
    const lowItems = context.pantry.filter(
        (item) => item.stock_state === "low",
    );
    if (plannedDinner && onTrack && lowItems.length === 0) {
        return "You're set for today — dinner is planned and nothing in the pantry needs using up.";
    }
    if (
        context.filled_slots.includes("dinner") &&
        onTrack &&
        lowItems.length === 0
    ) {
        return "You're set for today — dinner is logged and the day landed on track.";
    }
    if (plannedDinner) {
        return `Dinner is planned — ${plannedDinner.recipe_name}. Nothing else needs deciding today.`;
    }
    return "Nothing needs deciding right now — log the next meal when you eat it.";
}

/**
 * Deterministic pick (D4 fallback + fixture-lane composition). The
 * model chooses among the same candidates when it is available; this
 * scorer keeps the panel honest when it is not. Ordering follows the
 * brief: pantry use-first usage and the biggest open macro gap
 * dominate; saved recipes edge out recent meals.
 */
export function pickDeterministicCandidate(
    context: NextUpContext,
): NextUpComposition | null {
    if (context.candidates.length === 0) return null;
    const budget = remainingBudget(context);
    const useFirst = context.pantry[0]?.name ?? null;
    let best: { candidate: NextUpCandidate; score: number } | null = null;
    for (const candidate of context.candidates) {
        let score = 0;
        if (useFirst && candidate.uses_pantry.includes(useFirst)) score += 3;
        score += Math.min(2, Math.max(0, candidate.uses_pantry.length - 1));
        if (
            budget.protein_g != null &&
            budget.protein_g > 0 &&
            candidate.nutrition.protein_g != null
        ) {
            score +=
                (Math.min(budget.protein_g, candidate.nutrition.protein_g) /
                    budget.protein_g) *
                4;
        }
        if (
            budget.calories != null &&
            candidate.nutrition.calories != null &&
            candidate.nutrition.calories > budget.calories * 1.1 &&
            budget.calories > 0
        ) {
            score -= 3;
        }
        if (candidate.kind === "recipe") score += 0.5;
        if (!best || score > best.score) best = { candidate, score };
    }
    if (!best) return null;
    return {
        candidate_id: best.candidate.id,
        servings: best.candidate.servings,
        reason: deterministicReason(context, best.candidate),
        source: "deterministic",
    };
}

function deterministicReason(
    context: NextUpContext,
    candidate: NextUpCandidate,
): string {
    const budget = remainingBudget(context);
    const useFirst = context.pantry[0]?.name ?? null;
    if (useFirst && candidate.uses_pantry.includes(useFirst)) {
        return `Uses the ${useFirst.toLowerCase()} — your oldest pantry item.`;
    }
    if (
        budget.protein_g != null &&
        budget.protein_g >= 15 &&
        (candidate.nutrition.protein_g ?? 0) >= 20
    ) {
        return "Closes most of today's protein gap.";
    }
    if (candidate.kind === "recent") {
        return "You logged it recently; it fit the day.";
    }
    return "Fits what's on hand and today's budget.";
}

/**
 * Up to two typed secondary lines. Each is a signal WITH its remedy
 * or consequence — never a bare restatement (D1). The primary's own
 * facts are not repeated here.
 */
export function secondaryLinesFor(
    context: NextUpContext,
    primary: NextUpCandidate | null,
): NextUpSecondaryLine[] {
    const lines: NextUpSecondaryLine[] = [];
    const useFirst = context.pantry[0] ?? null;
    if (
        useFirst &&
        useFirst.stock_state === "low" &&
        (!primary || !primary.uses_pantry.includes(useFirst.name))
    ) {
        lines.push({
            kind: "use_first",
            text: `The ${useFirst.name.toLowerCase()} is running low — worth using before it's gone.`,
        });
    } else if (
        useFirst &&
        (!primary || !primary.uses_pantry.includes(useFirst.name)) &&
        context.pantry.length > 1
    ) {
        lines.push({
            kind: "use_first",
            text: `The ${useFirst.name.toLowerCase()} has been in the pantry longest — a good next thing to build a meal around.`,
        });
    }
    const plannedDinner = context.planned.find(
        (meal) => meal.meal_slot === "dinner",
    );
    if (plannedDinner && targetSlotFor(context) !== "dinner") {
        lines.push({
            kind: "planned",
            text: `Dinner is already planned: ${plannedDinner.recipe_name}.`,
        });
    }
    if (primary && context.features.groceries) {
        const missing = missingIngredientsFor(primary, context);
        if (missing.length > 0) {
            lines.push({
                kind: "grocery_gap",
                text: `${missing.length} ingredient${missing.length === 1 ? "" : "s"} for the suggestion ${missing.length === 1 ? "isn't" : "aren't"} in your pantry — add ${missing.length === 1 ? "it" : "them"} from the card.`,
            });
        }
    }
    return lines.slice(0, 2);
}

const RESTATEMENT_PATTERNS: RegExp[] = [
    /recorded so far/i,
    /is not evidence that you have eaten nothing/i,
    /keep logging meals as you go/i,
    /planning does not mean the meal was eaten/i,
    /are not counted as eaten/i,
    /^(protein|calories|water|carbs|fat) recorded\b/i,
    /\btrack_only\b/,
];

/**
 * D1 tripwire: returns the offending pattern when a line restates
 * what the screen already shows (or leaks the raw objective enum,
 * D6), or null when the line carries new information.
 */
export function findRestatement(text: string): string | null {
    for (const pattern of RESTATEMENT_PATTERNS) {
        if (pattern.test(text)) return pattern.source;
    }
    return null;
}

/** Every number a line may cite: context totals, goals, candidate + landing values. */
export function contextNumbers(context: NextUpContext): number[] {
    const values: number[] = [];
    const push = (value: number | null | undefined) => {
        if (value != null && Number.isFinite(value)) values.push(value);
    };
    for (const source of [context.totals, context.goals]) {
        push(source.calories);
        push(source.protein_g);
        push(source.carbs_g);
        push(source.fat_g);
    }
    for (const candidate of context.candidates) {
        push(candidate.nutrition.calories);
        push(candidate.nutrition.protein_g);
        push(candidate.nutrition.carbs_g);
        push(candidate.nutrition.fat_g);
        const landing = landingFor(context, candidate, candidate.servings);
        push(landing.calories);
        push(landing.protein_g);
        push(landing.carbs_g);
        push(landing.fat_g);
    }
    push(context.planned.length);
    push(context.pantry.length);
    push(context.grocery_names.length);
    return values;
}

/**
 * Grounding check for free text (D4): every number in the text must
 * be a number the context actually contains (within rounding).
 * Counts of context collections are numbers too, via contextNumbers.
 */
export function textIsGrounded(text: string, context: NextUpContext): boolean {
    const allowed = contextNumbers(context);
    const found = text.match(/\d[\d,]*(?:\.\d+)?/g) ?? [];
    for (const raw of found) {
        const value = Number(raw.replaceAll(",", ""));
        if (!Number.isFinite(value)) return false;
        const ok = allowed.some(
            (candidate) =>
                Math.abs(candidate - value) <= Math.max(1, value * 0.02),
        );
        if (!ok) return false;
    }
    return true;
}

/**
 * Validate a model composition against the context (D4). Returns the
 * composition or null — the caller falls back to the deterministic
 * pick, so an ungrounded model answer can never reach the screen.
 */
export function validateComposition(
    value: unknown,
    context: NextUpContext,
): NextUpComposition | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }
    const record = value as Record<string, unknown>;
    const candidateId = record.candidate_id;
    const servings = record.servings;
    const reason = record.reason;
    if (typeof candidateId !== "string") return null;
    const candidate = context.candidates.find(
        (entry) => entry.id === candidateId,
    );
    if (!candidate) return null;
    if (
        typeof servings !== "number" ||
        !Number.isFinite(servings) ||
        servings < 0.25 ||
        servings > 4
    ) {
        return null;
    }
    if (typeof reason !== "string") return null;
    const trimmed = reason.trim();
    if (trimmed.length < 1 || trimmed.length > 280) return null;
    if (findRestatement(trimmed)) return null;
    if (!textIsGrounded(trimmed, context)) return null;
    return {
        candidate_id: candidateId,
        servings,
        reason: trimmed,
        source: "model",
    };
}

/**
 * Fingerprint of everything that invalidates a cached composition
 * (D4): the day's meals and totals, the plan, pantry state, grocery
 * state, goals, objective, candidates, and the module flags. Any
 * meal log / plan change / pantry change / grocery change moves it.
 */
export function fingerprintNextUpContext(context: NextUpContext): string {
    const stable = {
        date: context.date,
        day_part: context.day_part,
        objective: context.objective,
        goals: context.goals,
        totals: context.totals,
        filled_slots: [...context.filled_slots].sort(),
        planned: context.planned.map((meal) => ({
            slot: meal.meal_slot,
            recipe: meal.recipe_id,
            revision: meal.recipe_revision_id,
            servings: meal.servings,
        })),
        pantry: context.pantry.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            stock_state: item.stock_state,
            updated_at: item.updated_at,
        })),
        grocery_names: [...context.grocery_names].sort(),
        candidates: context.candidates.map((candidate) => ({
            id: candidate.id,
            servings: candidate.servings,
            nutrition: candidate.nutrition,
            uses_pantry: candidate.uses_pantry,
            ingredient_names: candidate.ingredient_names,
        })),
        features: context.features,
    };
    return createHash("sha256")
        .update(JSON.stringify(stable))
        .digest("hex")
        .slice(0, 32);
}
