import { scaleNutrients } from "../food-providers/nutrients.js";
import { normalizePortionUnit } from "../food-providers/portions.js";
import { rankCandidates, scoreCandidate } from "../food-providers/ranking.js";
import {
    encodeFoodCandidateId,
    type FoodSearchService,
} from "../food-providers/service.js";
import type { FoodCandidate } from "../food-providers/types.js";
import type { StructuredMealItemInput } from "../structured-meals/types.js";
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
 * Nutrition ONLY ever comes from provider candidates. An item with no
 * usable candidate becomes a labelled `model_estimate` with EMPTY
 * nutrients and the vision stage's assumptions preserved — the server
 * never invents nutrition numbers, provider IDs, or portions.
 */

export const LOW_PORTION_CONFIDENCE = 0.7;
export const AMBIGUITY_MIN_CONFIDENCE = 0.84;
export const AMBIGUITY_MARGIN = 0.08;

export type MealPhotoGroundingSource =
    "local catalog" | "USDA" | "Open Food Facts" | "model_estimate";

export interface GroundedMealPhotoItem {
    vision: MealPhotoVisionItem;
    draftItem: StructuredMealItemInput;
    /** Human-facing grounding label. USDA-backed candidates are labelled
     * USDA whether they were served from the local catalog cache or the
     * live provider — the local catalog IS cached provider data, and the
     * eval treats "local catalog" and "USDA" as the same grounded family. */
    groundingSource: MealPhotoGroundingSource;
    grounded: boolean;
    candidateId: string | null;
    tieBreakUsed: boolean;
    needsQuestion: boolean;
    question: {
        questionKey: string;
        prompt: string;
        impactScore: number;
    } | null;
}

export interface MealPhotoGroundingDeps {
    search: Pick<FoodSearchService, "search">["search"];
    chooseCandidates?: (
        requests: MealPhotoCandidateChoiceRequest[],
    ) => Promise<Map<string, MealPhotoCandidateChoice>>;
}

const WEIGHT_TO_GRAMS: Record<string, number> = {
    g: 1,
    kg: 1_000,
    oz: 28.349523125,
    lb: 453.59237,
};

function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

interface PortionResolution {
    nutrients: StructuredMealItemInput["nutrients"];
    gramWeight?: number;
    portionId: string;
    assumption?: string;
}

/**
 * Convert a vision quantity+unit into provider nutrition for that amount.
 * Mirrors `resolvePortion` in recipe-nutrition-resolution.ts: weight
 * units resolve against per-100g nutrition when available; otherwise the
 * candidate portion matching the vision unit is scaled by
 * quantity / portion.amount.
 */
export function resolveGroundedPortion(
    vision: MealPhotoVisionItem,
    candidate: FoodCandidate,
): PortionResolution | null {
    const unit = normalizePortionUnit(vision.unit);
    const gramsPerUnit = WEIGHT_TO_GRAMS[unit];
    if (gramsPerUnit !== undefined && candidate.nutrientsPer100g) {
        const grams = vision.quantity * gramsPerUnit;
        return {
            nutrients: scaleNutrients(candidate.nutrientsPer100g, grams / 100),
            gramWeight: round2(grams),
            portionId: "100g",
        };
    }
    const portion =
        candidate.portions.find(
            (candidate_portion) =>
                normalizePortionUnit(candidate_portion.unit) === unit,
        ) ?? candidate.portions[0];
    if (!portion || !(portion.amount > 0)) {
        if (candidate.nutrientsPer100g) {
            return {
                nutrients: { ...candidate.nutrientsPer100g },
                portionId: "100g",
                assumption: `Provider reports nutrition per 100 g; the photographed amount (${vision.quantity} ${vision.unit}) could not be converted, so the draft uses the per-100 g values for review.`,
            };
        }
        return null;
    }
    const factor = vision.quantity / portion.amount;
    return {
        nutrients: scaleNutrients(portion.nutrients, factor),
        gramWeight:
            portion.gramWeight === undefined
                ? undefined
                : round2(portion.gramWeight * factor),
        portionId: portion.id,
        assumption:
            normalizePortionUnit(portion.unit) !== unit
                ? `Used provider portion "${portion.label}" to interpret ${vision.quantity} ${vision.unit}.`
                : undefined,
    };
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
    };
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

    // Stage 4b: build draft items. Nutrition only from the picked
    // candidate; otherwise a labelled estimate with empty nutrients.
    return searched.map(({ vision, ranked }, index) => {
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
        const resolution = candidate
            ? resolveGroundedPortion(vision, candidate)
            : null;
        const question = questionFor(vision, index);
        const portionLabel = `${vision.quantity} ${vision.unit}`;
        if (candidate && resolution) {
            const displayName = [candidate.brand, candidate.name]
                .filter(Boolean)
                .join(" — ")
                .slice(0, 500);
            const assumptions = [...vision.assumptions];
            if (resolution.assumption) assumptions.push(resolution.assumption);
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
                        nutrition_snapshot: resolution.nutrients,
                    },
                },
                groundingSource: groundingSourceFor(candidate),
                grounded: true,
                candidateId: encodeFoodCandidateId(candidate),
                tieBreakUsed,
                needsQuestion: question !== null,
                question,
            };
        }
        return {
            vision,
            draftItem: {
                name: vision.name,
                quantity: vision.quantity,
                portionLabel,
                nutrients: {},
                sourceType: "model_estimate",
                confidence: vision.portion_confidence,
                assumptions: [...vision.assumptions].slice(0, 20),
                sourceSnapshot: {
                    resolution_layer: "meal_photo_grounding",
                    vision_name: vision.name,
                    cooking_method: vision.cooking_method,
                    portion_confidence: vision.portion_confidence,
                    candidate_id: null,
                    tie_break_used: tieBreakUsed,
                },
            },
            groundingSource: "model_estimate",
            grounded: false,
            candidateId: null,
            tieBreakUsed,
            needsQuestion: question !== null,
            question,
        };
    });
}
