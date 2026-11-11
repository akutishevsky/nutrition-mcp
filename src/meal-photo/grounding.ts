import { scaleNutrients } from "../food-providers/nutrients.js";
import {
    normalizePortionUnit,
    portionUnitKind,
    sortPortionsNaturalFirst,
} from "../food-providers/portions.js";
import { rankCandidates, scoreCandidate } from "../food-providers/ranking.js";
import {
    encodeFoodCandidateId,
    type FoodSearchService,
} from "../food-providers/service.js";
import type { FoodCandidate } from "../food-providers/types.js";
import { blockingQuestionKey } from "../meal-drafts/blocking.js";
import type { StructuredMealItemInput } from "../structured-meals/types.js";
import type {
    MealPhotoEstimate,
    MealPhotoEstimateRequest,
} from "./estimate.js";
import type {
    MealPhotoCandidateChoice,
    MealPhotoCandidateChoiceRequest,
    MealPhotoVisionItem,
} from "./vision.js";

/**
 * Stages 3–4 of the photo-logging pipeline (brief §3): deterministic
 * grounding + deterministic candidate ranking, with ONE batched Ember
 * tie-break call spent only when the top candidates fall inside the
 * ambiguity band (mirroring the recipe resolver's rule: a strong
 * deterministic match — confidence ≥ 0.84 and a score margin ≥ 0.08 —
 * never spends a model call).
 *
 * Nutrition comes from provider candidates, or — for an item with no
 * usable candidate — from the LABELLED model-estimate fallback (brief
 * §3): a dedicated Ember estimate step (estimate.ts) produces estimated
 * values for the item's stated portion, stored as `model_estimate`
 * with a sourceSnapshot that records the estimate's origin. The
 * "never invent" rule governs PROVIDER attribution: this pipeline
 * never fabricates provider IDs, provider names, or source URLs, and
 * never passes model numbers off as provider data.
 *
 * Pipeline invariant (S3 hardening): every item ends with provider
 * values, estimate values, or a BLOCKING draft question — never
 * silently empty. When the estimate step is unavailable, fails, or
 * returns no usable estimate for an item, that item carries NO values
 * and a blocking question (see meal-drafts/blocking.ts), and the
 * shared confirm path refuses to confirm the draft until the user
 * supplies/confirms the item's nutrition or removes the item.
 */

export const LOW_PORTION_CONFIDENCE = 0.7;
export const AMBIGUITY_MIN_CONFIDENCE = 0.84;
export const AMBIGUITY_MARGIN = 0.08;

export type MealPhotoGroundingSource =
    "local catalog" | "USDA" | "Open Food Facts" | "model_estimate";

export interface MealPhotoDraftQuestionSpec {
    questionKey: string;
    prompt: string;
    impactScore: number;
    /** Blocking questions (estimate-missing) cannot be accepted away
     * via accept_remaining_assumptions; see meal-drafts/blocking.ts. */
    blocking: boolean;
}

export interface GroundedMealPhotoItem {
    vision: MealPhotoVisionItem;
    draftItem: StructuredMealItemInput;
    /** Human-facing grounding label. USDA-backed candidates are labelled
     * USDA whether they were served from the local catalog cache or the
     * live provider — the local catalog IS cached provider data, and the
     * eval treats "local catalog" and "USDA" as the same grounded family. */
    groundingSource: MealPhotoGroundingSource;
    grounded: boolean;
    /** True when the item's values came from the labelled model-estimate
     * step (not a provider). Mutually exclusive with `grounded`. */
    estimated: boolean;
    candidateId: string | null;
    tieBreakUsed: boolean;
    needsQuestion: boolean;
    question: MealPhotoDraftQuestionSpec | null;
}

export interface MealPhotoGroundingDeps {
    search: Pick<FoodSearchService, "search">["search"];
    chooseCandidates?: (
        requests: MealPhotoCandidateChoiceRequest[],
    ) => Promise<Map<string, MealPhotoCandidateChoice>>;
    /** Labelled model-estimate step for ungrounded items (estimate.ts).
     * Batched: one call receives every ungrounded item of the photo.
     * Optional in the deps shape so deterministic tests/lanes can omit
     * it — omitted or failed estimation yields blocking questions,
     * never silent empty items. */
    estimateNutrients?: (
        requests: MealPhotoEstimateRequest[],
    ) => Promise<Map<string, MealPhotoEstimate>>;
}

const WEIGHT_TO_GRAMS: Record<string, number> = {
    g: 1,
    kg: 1_000,
    oz: 28.349523125,
    lb: 453.59237,
    lbs: 453.59237,
    mg: 0.001,
};

/** Exact millilitres per volume unit (metric + US customary). Volume
 * quantities convert to volume portions through this table — never
 * through a serving count (see the unit-kind invariant on
 * resolveGroundedPortion). */
const VOLUME_TO_ML: Record<string, number> = {
    ml: 1,
    l: 1_000,
    cup: 236.5882365,
    tbsp: 14.7867648,
    tsp: 4.92892159,
    "fl oz": 29.5735296,
    pint: 473.176473,
    quart: 946.352946,
    gallon: 3785.41178,
};

/**
 * Ceiling for the GENERIC-portion fallback: a vision quantity read as
 * a count of a candidate's generic ("serving"-kind) portion is only
 * believable up to this many servings in one photographed item. Past
 * it, the quantity is a data error, not a portion — resolution
 * refuses (or falls to the labelled per-100 g values) instead of
 * silently multiplying a serving's nutrition by it.
 */
export const MAX_GENERIC_PORTION_FACTOR = 20;

/**
 * Ceiling on the gram weight of ONE resolved draft item. However a
 * quantity is expressed, a single photographed item line does not
 * weigh more than this; a resolution past it means the quantity or
 * the portion data is wrong, and the item must surface through the
 * estimate / blocking paths rather than land as a five-figure
 * calorie line. (The blowup case resolved to 127,500 g.)
 */
export const MAX_ITEM_GRAM_WEIGHT_G = 5_000;

function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

interface PortionResolution {
    nutrients: StructuredMealItemInput["nutrients"];
    gramWeight?: number;
    portionId: string;
    assumption?: string;
    /** Set when a count quantity was converted through grams-per-piece
     * taken from provider portion data (this candidate's own count
     * portion or a donor candidate's), never from the raw count. */
    countConversion?: {
        gramsPerPiece: number;
        donorPortionLabel: string;
        donorProvider: string;
    };
}

/**
 * A candidate portion that can weigh ONE of the vision item's count
 * units: count-kind unit ("piece", "ear", "slice", …) with a recorded
 * gram weight. An exact unit match wins; otherwise the most natural
 * count portion the candidate carries.
 */
export function findCountPortion(
    candidate: FoodCandidate,
    unit: string,
): FoodCandidate["portions"][number] | undefined {
    const counts = candidate.portions.filter(
        (portion) =>
            portion.amount > 0 &&
            portion.gramWeight !== undefined &&
            portion.gramWeight > 0 &&
            portionUnitKind(portion.unit) === "count",
    );
    if (counts.length === 0) return undefined;
    const normalized = normalizePortionUnit(unit);
    return (
        counts.find(
            (portion) => normalizePortionUnit(portion.unit) === normalized,
        ) ?? sortPortionsNaturalFirst(counts)[0]
    );
}

/** Scale one portion's nutrients by an exact, dimensionally sound
 * factor (same unit, same kind via a conversion table, or a recorded
 * gram weight). Shared by every resolution path below. Returns null
 * when the scaled gram weight breaks the single-item sanity ceiling
 * (MAX_ITEM_GRAM_WEIGHT_G) — the quantity is then a data error, and
 * the caller surfaces the item instead of landing the multiple. */
function scaledPortionResolution(
    vision: MealPhotoVisionItem,
    portion: FoodCandidate["portions"][number],
    factor: number,
): PortionResolution | null {
    const gramWeight =
        portion.gramWeight === undefined
            ? undefined
            : round2(portion.gramWeight * factor);
    if (gramWeight !== undefined && gramWeight > MAX_ITEM_GRAM_WEIGHT_G) {
        return null;
    }
    return {
        nutrients: scaleNutrients(portion.nutrients, factor),
        gramWeight,
        portionId: portion.id,
        assumption:
            normalizePortionUnit(portion.unit) !==
            normalizePortionUnit(vision.unit)
                ? `Used provider portion "${portion.label}" to interpret ${vision.quantity} ${vision.unit}.`
                : undefined,
    };
}

/**
 * Convert a vision quantity+unit into provider nutrition for that amount.
 * Mirrors `resolvePortion` in recipe-nutrition-resolution.ts: weight
 * units resolve against per-100g nutrition when available; otherwise the
 * candidate portion matching the vision unit is scaled by
 * quantity / portion.amount.
 *
 * COUNT-AS-GRAMS INVARIANT (photo-flow P1): when the vision quantity is
 * a COUNT ("3 piece") and the only portion available on this candidate
 * is weight-based ("100 g"), the legacy factor math would set
 * gram_weight to the raw count (3 g) and scale nutrients for 3 grams —
 * the production defect that logged 3 ears of corn at 2.4 kcal. A count
 * must never become a gram weight: this function now resolves a count
 * only against a count portion (exact unit, or any count portion the
 * candidate carries) and returns null otherwise, so the caller can try
 * a donor candidate's portion data or the labelled estimate path.
 *
 * UNIT-KIND INVARIANT (photo calorie blowup, 2026-11-10): the same
 * dimensional discipline applies to EVERY unit kind. The legacy
 * fallback scaled the candidate's FIRST portion by
 * quantity / portion.amount whatever the units were — so a VOLUME
 * quantity (the vision prompt itself asks for ml on liquids) against
 * a declared-serving portion (amount 1) read "300 ml" of tomato soup
 * as 300 servings: 48,450 kcal and a 127,500 g gram weight on a real
 * provider candidate (USDA fdcId 1966887), recurring across identifier
 * models in the full-pipeline eval because the bug sits downstream of
 * identification. The mirror error divided a generic "1 serving" by
 * a 100 g portion (factor 0.01 — a 1 g, 1 kcal curry). Resolution now
 * only ever scales a portion by a factor that is dimensionally sound:
 * the exact same unit, the same kind through an exact conversion
 * (volume↔volume via ml, weight through a portion's recorded gram
 * weight), a count against a count portion (P1), or a generic
 * portion word (bowl / plate / serving) read as a bounded count of
 * the candidate's generic portion. Two sanity ceilings bound every
 * path, exact matches included: a generic-portion factor above
 * MAX_GENERIC_PORTION_FACTOR, and a resolved gram weight above
 * MAX_ITEM_GRAM_WEIGHT_G, are data errors, not portions. Anything
 * else returns null — or, for a generic quantity against a
 * per-100 g-only candidate, the labelled per-100 g fallback — so the
 * item surfaces through the donor / estimate / blocking paths
 * instead of a silent absurdity.
 */
export function resolveGroundedPortion(
    vision: MealPhotoVisionItem,
    candidate: FoodCandidate,
): PortionResolution | null {
    const unit = normalizePortionUnit(vision.unit);
    const gramsPerUnit = WEIGHT_TO_GRAMS[unit];
    if (gramsPerUnit !== undefined && candidate.nutrientsPer100g) {
        const grams = vision.quantity * gramsPerUnit;
        if (grams > MAX_ITEM_GRAM_WEIGHT_G) return null;
        return {
            nutrients: scaleNutrients(candidate.nutrientsPer100g, grams / 100),
            gramWeight: round2(grams),
            portionId: "100g",
        };
    }
    const visionKind = portionUnitKind(vision.unit);
    const usable = candidate.portions.filter((portion) => portion.amount > 0);
    const exactPortion = usable.find(
        (portion) => normalizePortionUnit(portion.unit) === unit,
    );
    if (exactPortion) {
        if (
            visionKind === "count" &&
            portionUnitKind(exactPortion.unit) === "weight"
        ) {
            // The count-as-grams guard (defensive: the unit sets make
            // an exact count/weight unit collision impossible today).
            return null;
        }
        const factor = vision.quantity / exactPortion.amount;
        if (visionKind !== "other" || factor <= MAX_GENERIC_PORTION_FACTOR) {
            return scaledPortionResolution(vision, exactPortion, factor);
        }
        // An absurd count of an exactly-named generic portion ("300
        // serving") falls through to the generic branch below, which
        // lands on the labelled per-100 g fallback instead of the
        // multiple.
    }
    if (visionKind === "count") {
        const countPortion = findCountPortion(candidate, vision.unit);
        if (countPortion) {
            const resolution = scaledPortionResolution(
                vision,
                countPortion,
                vision.quantity / countPortion.amount,
            );
            if (!resolution) return null;
            return {
                ...resolution,
                countConversion: {
                    gramsPerPiece: round2(
                        countPortion.gramWeight! / countPortion.amount,
                    ),
                    donorPortionLabel: countPortion.label,
                    donorProvider: candidate.provider,
                },
            };
        }
        // Legacy generic fallback for counts, kept but bounded: a
        // count read as that many of the candidate's first portion —
        // never a weight portion (P1), never an absurd multiple.
        const fallback = usable[0];
        if (!fallback || portionUnitKind(fallback.unit) === "weight") {
            return null;
        }
        const factor = vision.quantity / fallback.amount;
        if (factor > MAX_GENERIC_PORTION_FACTOR) return null;
        return scaledPortionResolution(vision, fallback, factor);
    }
    if (visionKind === "weight") {
        // No per-100 g panel (the fast path above did not fire): weigh
        // the quantity through a portion's recorded gram weight — the
        // factor is grams / gram weight, dimensionally exact. Without
        // any gram weight there is no honest conversion.
        const weighable = usable.find(
            (portion) =>
                portion.gramWeight !== undefined && portion.gramWeight > 0,
        );
        if (gramsPerUnit === undefined || !weighable) return null;
        const grams = vision.quantity * gramsPerUnit;
        return scaledPortionResolution(
            vision,
            weighable,
            grams / weighable.gramWeight!,
        );
    }
    if (visionKind === "volume") {
        // Volume converts to a volume portion through exact ml
        // ratios only. A volume is never a count of servings, and a
        // millilitre is not a gram (density is not provider data) —
        // anything else refuses, so the estimate path prices the
        // stated volume directly.
        const mlPerUnit = VOLUME_TO_ML[unit];
        const volumePortion = usable.find(
            (portion) =>
                portionUnitKind(portion.unit) === "volume" &&
                VOLUME_TO_ML[normalizePortionUnit(portion.unit)] !== undefined,
        );
        if (mlPerUnit === undefined || !volumePortion) return null;
        const portionMl =
            volumePortion.amount *
            VOLUME_TO_ML[normalizePortionUnit(volumePortion.unit)]!;
        return scaledPortionResolution(
            vision,
            volumePortion,
            (vision.quantity * mlPerUnit) / portionMl,
        );
    }
    // Generic portion words (bowl, plate, serving, …): a bounded count
    // of the candidate's generic portion, or the labelled per-100 g
    // fallback when the candidate carries no generic portion — never
    // quantity / 100 against the 100 g row, never a multiple of a
    // weight or volume portion.
    const genericPortion = usable.find(
        (portion) => portionUnitKind(portion.unit) === "other",
    );
    if (genericPortion) {
        const factor = vision.quantity / genericPortion.amount;
        if (factor <= MAX_GENERIC_PORTION_FACTOR) {
            return scaledPortionResolution(vision, genericPortion, factor);
        }
    }
    if (candidate.nutrientsPer100g) {
        return {
            nutrients: { ...candidate.nutrientsPer100g },
            portionId: "100g",
            assumption: `Provider reports nutrition per 100 g; the photographed amount (${vision.quantity} ${vision.unit}) could not be converted, so the draft uses the per-100 g values for review.`,
        };
    }
    return null;
}

/**
 * Cross-candidate count conversion (photo-flow P1): the picked
 * candidate cannot weigh the vision item's count unit, but another
 * ranked candidate for the same food carries a count portion with a
 * gram weight. The grams-per-piece come from that donor's PROVIDER
 * portion data; the nutrients stay with the pick (its per-100 g
 * panel) whenever it has one, so attribution stays honest and the
 * conversion is recorded as an explicit assumption. When the pick has
 * no per-100 g panel, the donor candidate itself becomes the pick —
 * its count portion resolves the item end to end.
 */
export function resolveCountViaDonor(
    vision: MealPhotoVisionItem,
    pick: FoodCandidate,
    ranked: FoodCandidate[],
): { candidate: FoodCandidate; resolution: PortionResolution } | null {
    if (portionUnitKind(vision.unit) !== "count") return null;
    for (const donor of ranked) {
        const portion = findCountPortion(donor, vision.unit);
        if (!portion) continue;
        const gramsPerPiece = portion.gramWeight! / portion.amount;
        if (pick.nutrientsPer100g) {
            const grams = vision.quantity * gramsPerPiece;
            if (grams > MAX_ITEM_GRAM_WEIGHT_G) continue;
            return {
                candidate: pick,
                resolution: {
                    nutrients: scaleNutrients(
                        pick.nutrientsPer100g,
                        grams / 100,
                    ),
                    gramWeight: round2(grams),
                    portionId: "100g",
                    assumption: `Counted ${vision.quantity} ${vision.unit} at about ${round2(gramsPerPiece)} g each — grams per ${portion.unit} from provider portion data ("${portion.label}"); nutrition from this food's per-100 g values.`,
                    countConversion: {
                        gramsPerPiece: round2(gramsPerPiece),
                        donorPortionLabel: portion.label,
                        donorProvider: donor.provider,
                    },
                },
            };
        }
        const resolution = resolveGroundedPortion(vision, donor);
        if (resolution) return { candidate: donor, resolution };
    }
    return null;
}

function groundingSourceFor(
    candidate: FoodCandidate,
): MealPhotoGroundingSource {
    return candidate.provider === "usda" ? "USDA" : "Open Food Facts";
}

function questionFor(
    vision: MealPhotoVisionItem,
    index: number,
): GroundedMealPhotoItem["question"] {
    if (vision.portion_confidence >= LOW_PORTION_CONFIDENCE) return null;
    return {
        questionKey: `photo_portion_${index}`,
        prompt: `About how much ${vision.name} — the photo estimate was ${vision.quantity} ${vision.unit}. Correct it if that looks off.`,
        impactScore: 80,
        blocking: false,
    };
}

function blockingQuestionFor(
    vision: MealPhotoVisionItem,
    index: number,
): GroundedMealPhotoItem["question"] {
    return {
        questionKey: blockingQuestionKey(index),
        prompt: `We couldn't find nutrition for ${vision.name} (${vision.quantity} ${vision.unit}) in a food database, and the automatic estimate didn't come through. Please supply or confirm its nutrition, or remove the item — this draft can't be confirmed until that's done.`,
        impactScore: 100,
        blocking: true,
    };
}

/**
 * The pipeline invariant, asserted by tests: an item is complete only
 * when it carries provider values, estimate values, or a blocking
 * question. Anything else is a silently-empty item — the production
 * defect this hardening removes.
 */
export function mealPhotoItemIsComplete(entry: GroundedMealPhotoItem): boolean {
    const hasValues = Object.values(entry.draftItem.nutrients).some(
        (value) => value !== undefined,
    );
    return hasValues || (entry.question !== null && entry.question.blocking);
}

export function isAmbiguous(query: string, ranked: FoodCandidate[]): boolean {
    const top = ranked[0];
    if (!top || ranked.length < 2) return false;
    const second = ranked[1]!;
    const margin =
        scoreCandidate({ query }, top) - scoreCandidate({ query }, second);
    return (
        top.confidence < AMBIGUITY_MIN_CONFIDENCE || margin < AMBIGUITY_MARGIN
    );
}

export async function groundMealPhotoItems(
    items: MealPhotoVisionItem[],
    deps: MealPhotoGroundingDeps,
): Promise<GroundedMealPhotoItem[]> {
    // Stage 3: canonical search per item (local catalog first, then USDA
    // + Open Food Facts concurrently — that resolution order lives inside
    // FoodSearchService.search and is reused unchanged).
    const searched = await Promise.all(
        items.map(async (vision) => {
            const query = vision.cooking_method
                ? `${vision.name}`.trim()
                : vision.name.trim();
            const result = await deps.search(query, 10);
            const ranked = rankCandidates({ query }, result.candidates);
            return { vision, query, ranked };
        }),
    );

    // Stage 4a: collect every ambiguous item for ONE batched tie-break.
    const tieBreakRequests: MealPhotoCandidateChoiceRequest[] = [];
    searched.forEach(({ vision, query, ranked }, index) => {
        if (deps.chooseCandidates && isAmbiguous(query, ranked)) {
            tieBreakRequests.push({
                key: `item:${index}`,
                itemName: vision.name,
                cookingMethod: vision.cooking_method,
                candidates: ranked.slice(0, 5).map((candidate) => ({
                    candidateId: encodeFoodCandidateId(candidate),
                    name: candidate.name,
                    brand: candidate.brand ?? null,
                    provider: candidate.provider,
                })),
            });
        }
    });
    let choices = new Map<string, MealPhotoCandidateChoice>();
    if (tieBreakRequests.length > 0 && deps.chooseCandidates) {
        try {
            choices = await deps.chooseCandidates(tieBreakRequests);
        } catch {
            // Tie-break failure never fails the pipeline (recipe-resolver
            // posture): deterministic ranking still applies.
            choices = new Map();
        }
    }

    // Stage 4b: resolve each item's pick deterministically first, so
    // every ungrounded item can be collected for ONE batched estimate
    // call (stage 4c) before any draft item is built.
    const picks = searched.map(({ vision, ranked }, index) => {
        const key = `item:${index}`;
        const choice = choices.get(key);
        let candidate: FoodCandidate | undefined = ranked[0];
        let tieBreakUsed = false;
        if (choice) {
            tieBreakUsed = true;
            candidate = choice.candidateId
                ? ranked.find(
                      (entry) =>
                          encodeFoodCandidateId(entry) === choice.candidateId,
                  )
                : undefined;
            if (choice.candidateId && !candidate) {
                // The chooser returned an ID outside the ranked set —
                // discard it and keep the deterministic pick.
                candidate = ranked[0];
            }
            if (choice.candidateId === null) candidate = undefined;
        }
        let resolution = candidate
            ? resolveGroundedPortion(vision, candidate)
            : null;
        // Count-as-grams (P1): a null resolution for a count quantity
        // against a weight-only candidate is not "ungrounded" yet —
        // another ranked candidate's portion data may weigh the count.
        // Only when no donor exists does the item fall to the labelled
        // estimate path, flagged so the estimate must report a gram
        // weight for the stated portion.
        let countMismatch = false;
        if (candidate && !resolution) {
            if (portionUnitKind(vision.unit) === "count") {
                const viaDonor = resolveCountViaDonor(
                    vision,
                    candidate,
                    ranked,
                );
                if (viaDonor) {
                    candidate = viaDonor.candidate;
                    resolution = viaDonor.resolution;
                } else {
                    countMismatch = true;
                }
            }
        }
        return {
            vision,
            index,
            key,
            candidate,
            resolution,
            tieBreakUsed,
            countMismatch,
        };
    });

    // Stage 4c: labelled model-estimate fallback for ungrounded items.
    // A failed/absent estimate step never fails the pipeline and never
    // fabricates values: those items fall through with NO nutrients
    // and a blocking question instead (stage 4d).
    const estimateRequests: MealPhotoEstimateRequest[] = picks
        .filter((pick) => !(pick.candidate && pick.resolution))
        .map((pick) => ({
            key: pick.key,
            name: pick.vision.name,
            cookingMethod: pick.vision.cooking_method,
            quantity: pick.vision.quantity,
            unit: pick.vision.unit,
            assumptions: [...pick.vision.assumptions],
            ...(pick.countMismatch ? { gramWeightNeeded: true } : {}),
        }));
    let estimates = new Map<string, MealPhotoEstimate>();
    if (estimateRequests.length > 0 && deps.estimateNutrients) {
        try {
            estimates = await deps.estimateNutrients(estimateRequests);
        } catch {
            estimates = new Map();
        }
    }

    // Stage 4d: build draft items. Nutrition from the picked provider
    // candidate, else from the labelled estimate, else nothing at all
    // plus a blocking question — never silently empty.
    return picks.map(
        ({
            vision,
            index,
            key,
            candidate,
            resolution,
            tieBreakUsed,
            countMismatch,
        }) => {
            const portionQuestion = questionFor(vision, index);
            const portionLabel = `${vision.quantity} ${vision.unit}`;
            if (candidate && resolution) {
                const displayName = [candidate.brand, candidate.name]
                    .filter(Boolean)
                    .join(" — ")
                    .slice(0, 500);
                const assumptions = [...vision.assumptions];
                if (resolution.assumption)
                    assumptions.push(resolution.assumption);
                return {
                    vision,
                    draftItem: {
                        name: displayName || vision.name,
                        quantity: vision.quantity,
                        portionLabel,
                        gramWeight: resolution.gramWeight,
                        nutrients: resolution.nutrients,
                        sourceType: candidate.provider,
                        provider: candidate.provider,
                        providerFoodId: candidate.providerFoodId,
                        providerRevision: candidate.sourceUpdatedAt,
                        sourceUrl: candidate.attribution.url,
                        sourceUpdatedAt: candidate.sourceUpdatedAt,
                        confidence: vision.portion_confidence,
                        assumptions: assumptions.slice(0, 20),
                        sourceSnapshot: {
                            resolution_layer: "meal_photo_grounding",
                            vision_name: vision.name,
                            cooking_method: vision.cooking_method,
                            portion_confidence: vision.portion_confidence,
                            candidate_id: encodeFoodCandidateId(candidate),
                            provider: candidate.provider,
                            provider_food_id: candidate.providerFoodId,
                            selected_portion_id: resolution.portionId,
                            tie_break_used: tieBreakUsed,
                            ...(resolution.countConversion
                                ? {
                                      count_conversion:
                                          resolution.countConversion,
                                  }
                                : {}),
                            nutrition_snapshot: resolution.nutrients,
                        },
                    },
                    groundingSource: groundingSourceFor(candidate),
                    grounded: true,
                    estimated: false,
                    candidateId: encodeFoodCandidateId(candidate),
                    tieBreakUsed,
                    needsQuestion: portionQuestion !== null,
                    question: portionQuestion,
                };
            }
            const estimate = estimates.get(key);
            const usableEstimate =
                estimate &&
                Object.values(estimate.nutrients).some(
                    (value) => value !== undefined,
                ) &&
                (estimate.nutrients.calories ?? 0) > 0
                    ? estimate
                    : undefined;
            if (usableEstimate) {
                const assumptions = [...vision.assumptions];
                let question = portionQuestion;
                if (countMismatch) {
                    if (usableEstimate.gramWeight !== undefined) {
                        // The estimate weighed the count: record the
                        // conversion as an explicit, labelled estimate
                        // assumption — the weight is the model's, the
                        // nutrition is the model's, nothing poses as
                        // provider data.
                        const perPiece =
                            vision.quantity > 0
                                ? round2(
                                      usableEstimate.gramWeight /
                                          vision.quantity,
                                  )
                                : usableEstimate.gramWeight;
                        assumptions.push(
                            `Estimated weight: ${vision.quantity} ${vision.unit} ≈ ${usableEstimate.gramWeight} g (about ${perPiece} g each) — model estimate; the food database entry for this item only reports per-100 g values.`,
                        );
                    } else if (!question) {
                        // Nutrition estimated, but the count still has
                        // no defensible gram weight — ask, don't imply.
                        question = {
                            questionKey: `photo_portion_${index}`,
                            prompt: `How much does one ${vision.unit} of ${vision.name} weigh in grams? The draft uses estimated nutrition for ${vision.quantity} ${vision.unit}, but the item's database entry only reports per-100 g values and no gram weight could be derived.`,
                            impactScore: 85,
                            blocking: false,
                        };
                    }
                }
                return {
                    vision,
                    draftItem: {
                        name: vision.name,
                        quantity: vision.quantity,
                        portionLabel,
                        gramWeight: usableEstimate.gramWeight,
                        nutrients: usableEstimate.nutrients,
                        sourceType: "model_estimate" as const,
                        confidence: vision.portion_confidence,
                        assumptions: assumptions.slice(0, 20),
                        sourceSnapshot: {
                            resolution_layer: "meal_photo_grounding",
                            vision_name: vision.name,
                            cooking_method: vision.cooking_method,
                            portion_confidence: vision.portion_confidence,
                            candidate_id: null,
                            tie_break_used: tieBreakUsed,
                            // Estimate audit trail: these values came from
                            // the labelled model-estimate step, explicitly
                            // NOT from any provider — no provider fields
                            // exist on this draft item at all.
                            estimate_origin: "model_estimate",
                            estimate_step: "meal_photo_estimate",
                            ...(countMismatch ? { count_mismatch: true } : {}),
                            ...(usableEstimate.gramWeight !== undefined
                                ? {
                                      estimate_gram_weight:
                                          usableEstimate.gramWeight,
                                  }
                                : {}),
                            nutrition_snapshot: usableEstimate.nutrients,
                        },
                    },
                    groundingSource: "model_estimate" as const,
                    grounded: false,
                    estimated: true,
                    candidateId: null,
                    tieBreakUsed,
                    needsQuestion: question !== null,
                    question,
                };
            }
            const blocking = blockingQuestionFor(vision, index);
            return {
                vision,
                draftItem: {
                    name: vision.name,
                    quantity: vision.quantity,
                    portionLabel,
                    nutrients: {},
                    sourceType: "model_estimate" as const,
                    confidence: vision.portion_confidence,
                    assumptions: [...vision.assumptions].slice(0, 20),
                    sourceSnapshot: {
                        resolution_layer: "meal_photo_grounding",
                        vision_name: vision.name,
                        cooking_method: vision.cooking_method,
                        portion_confidence: vision.portion_confidence,
                        candidate_id: null,
                        tie_break_used: tieBreakUsed,
                        estimate_origin: "model_estimate",
                        estimate_step: "meal_photo_estimate",
                        estimate_status: "unavailable",
                        blocking_question_key: blocking!.questionKey,
                    },
                },
                groundingSource: "model_estimate" as const,
                grounded: false,
                estimated: false,
                candidateId: null,
                tieBreakUsed,
                needsQuestion: true,
                question: blocking,
            };
        },
    );
}
