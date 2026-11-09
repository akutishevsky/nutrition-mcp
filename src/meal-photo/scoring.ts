import type { GroundedMealPhotoItem } from "./grounding.js";

/**
 * Photo-eval scoring (brief §3 bars), shared by the per-PR recorded lane
 * (`fixtures/photo-eval/photo-eval.test.ts`) and the nightly live lane
 * (`scripts/photo-eval-live.ts`).
 *
 * Bars: item recall ≥ 90%; ≥ 80% of items provider-grounded; portions
 * within ±30% of golden for ≥ 70% of items; ZERO fabricated provider IDs
 * or nutrition values (hard fail); calorie total within ±25% on ≥ 75%
 * of fixtures.
 *
 * Golden calorie totals do not exist in the fixture set, so the calorie
 * bar is scored against a REFERENCE total: the expected items grounded
 * through the same deterministic search (supplied by the caller as
 * `referenceCalories`). That measures the calorie impact of the
 * pipeline's identification + portion error, not absolute truth — the
 * report labels it as such.
 *
 * Scores are always reported SPLIT by fixture source (`synthetic` |
 * `real`) plus combined (Michael ruling, 2026-11-09 evening): synthetic
 * illustration scores are never presented as photographic accuracy, and
 * ship readiness requires a real-photo subset that exists AND passes.
 */

export interface PhotoEvalExpectationItem {
    name: string;
    portion: { min_quantity: number; max_quantity: number; unit: string };
    expected_provider: string;
}

export interface PhotoEvalFixtureScore {
    fixtureId: string;
    source: string;
    expectedItems: number;
    foundItems: number;
    recalledItems: number;
    recall: number;
    groundedItems: number;
    groundedShare: number;
    portionChecked: number;
    portionWithin30: number;
    fabricatedIds: number;
    fabricatedNutrition: number;
    predictedCalories: number | null;
    referenceCalories: number | null;
    calorieWithin25: boolean | null;
}

export interface PhotoEvalAggregate {
    fixtures: number;
    items: number;
    recall: number;
    groundedShare: number;
    portionWithin30Share: number;
    fabricatedIds: number;
    fabricatedNutrition: number;
    calorieFixturesScored: number;
    calorieWithin25Share: number | null;
    bars: {
        recall: boolean;
        grounded: boolean;
        portions: boolean;
        fabrication: boolean;
        calories: boolean;
    };
    passesBars: boolean;
}

function nameKey(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

/** Two item names match when one contains the other's tokens. */
export function namesMatch(expected: string, found: string): boolean {
    const a = nameKey(expected);
    const b = nameKey(found);
    if (!a || !b) return false;
    if (a === b) return true;
    const aTokens = new Set(a.split(" "));
    const bTokens = new Set(b.split(" "));
    const smaller = aTokens.size <= bTokens.size ? aTokens : bTokens;
    const larger = aTokens.size <= bTokens.size ? bTokens : aTokens;
    return [...smaller].every((token) => larger.has(token));
}

export function scoreFixture(input: {
    fixtureId: string;
    source: string;
    expected: PhotoEvalExpectationItem[];
    grounded: GroundedMealPhotoItem[];
    /** Every provider food ID the search actually returned for this
     * fixture; a draft item carrying any other ID is a fabrication. */
    returnedProviderIds: ReadonlySet<string>;
    /** Provider nutrition is the only legitimate nutrition source: for
     * each grounded item the caller supplies the candidate nutrition
     * snapshot the draft values must derive from. Checked structurally
     * in the lanes; here we count model_estimate items that nevertheless
     * carry nutrition as fabricated nutrition. */
    referenceCalories: number | null;
}): PhotoEvalFixtureScore {
    const { expected, grounded } = input;
    let recalled = 0;
    let portionChecked = 0;
    let portionWithin30 = 0;
    const usedFound = new Set<number>();
    for (const item of expected) {
        const foundIndex = grounded.findIndex(
            (entry, index) =>
                !usedFound.has(index) &&
                (namesMatch(item.name, entry.vision.name) ||
                    namesMatch(item.name, entry.draftItem.name)),
        );
        if (foundIndex === -1) continue;
        usedFound.add(foundIndex);
        recalled += 1;
        const entry = grounded[foundIndex]!;
        if (entry.vision.unit === item.portion.unit) {
            portionChecked += 1;
            const goldenMid =
                (item.portion.min_quantity + item.portion.max_quantity) / 2;
            if (
                goldenMid > 0 &&
                Math.abs(entry.vision.quantity - goldenMid) / goldenMid <= 0.3
            ) {
                portionWithin30 += 1;
            }
        }
    }
    let fabricatedIds = 0;
    let fabricatedNutrition = 0;
    let predictedCalories = 0;
    let hasCalories = false;
    for (const entry of grounded) {
        if (entry.draftItem.providerFoodId) {
            if (
                !input.returnedProviderIds.has(entry.draftItem.providerFoodId)
            ) {
                fabricatedIds += 1;
            }
        }
        if (!entry.grounded) {
            const nutrients = entry.draftItem.nutrients;
            if (Object.values(nutrients).some((value) => value !== undefined)) {
                fabricatedNutrition += 1;
            }
        }
        const calories = entry.draftItem.nutrients.calories;
        if (calories !== undefined) {
            predictedCalories += calories;
            hasCalories = true;
        }
    }
    const calorieWithin25 =
        input.referenceCalories !== null && input.referenceCalories > 0
            ? Math.abs(
                  (hasCalories ? predictedCalories : 0) -
                      input.referenceCalories,
              ) /
                  input.referenceCalories <=
              0.25
            : null;
    return {
        fixtureId: input.fixtureId,
        source: input.source,
        expectedItems: expected.length,
        foundItems: grounded.length,
        recalledItems: recalled,
        recall: expected.length ? recalled / expected.length : 0,
        groundedItems: grounded.filter((entry) => entry.grounded).length,
        groundedShare: grounded.length
            ? grounded.filter((entry) => entry.grounded).length /
              grounded.length
            : 0,
        portionChecked,
        portionWithin30,
        fabricatedIds,
        fabricatedNutrition,
        predictedCalories: hasCalories ? predictedCalories : null,
        referenceCalories: input.referenceCalories,
        calorieWithin25,
    };
}

export function aggregateScores(
    scores: PhotoEvalFixtureScore[],
): PhotoEvalAggregate {
    const items = scores.reduce((sum, score) => sum + score.expectedItems, 0);
    const recalled = scores.reduce(
        (sum, score) => sum + score.recalledItems,
        0,
    );
    const found = scores.reduce((sum, score) => sum + score.foundItems, 0);
    const groundedItems = scores.reduce(
        (sum, score) => sum + score.groundedItems,
        0,
    );
    const portionChecked = scores.reduce(
        (sum, score) => sum + score.portionChecked,
        0,
    );
    const portionWithin30 = scores.reduce(
        (sum, score) => sum + score.portionWithin30,
        0,
    );
    const calorieScored = scores.filter(
        (score) => score.calorieWithin25 !== null,
    );
    const calorieOk = calorieScored.filter(
        (score) => score.calorieWithin25,
    ).length;
    const fabricatedIds = scores.reduce(
        (sum, score) => sum + score.fabricatedIds,
        0,
    );
    const fabricatedNutrition = scores.reduce(
        (sum, score) => sum + score.fabricatedNutrition,
        0,
    );
    const aggregate: PhotoEvalAggregate = {
        fixtures: scores.length,
        items,
        recall: items ? recalled / items : 0,
        groundedShare: found ? groundedItems / found : 0,
        portionWithin30Share: portionChecked
            ? portionWithin30 / portionChecked
            : 0,
        fabricatedIds,
        fabricatedNutrition,
        calorieFixturesScored: calorieScored.length,
        calorieWithin25Share: calorieScored.length
            ? calorieOk / calorieScored.length
            : null,
        bars: {
            recall: items > 0 && recalled / items >= 0.9,
            grounded: found > 0 && groundedItems / found >= 0.8,
            portions:
                portionChecked > 0 && portionWithin30 / portionChecked >= 0.7,
            fabrication: fabricatedIds === 0 && fabricatedNutrition === 0,
            calories:
                calorieScored.length > 0 &&
                calorieOk / calorieScored.length >= 0.75,
        },
        passesBars: false,
    };
    aggregate.passesBars = Object.values(aggregate.bars).every(Boolean);
    return aggregate;
}

export function splitBySource(scores: PhotoEvalFixtureScore[]): {
    combined: PhotoEvalAggregate;
    synthetic: PhotoEvalAggregate;
    real: PhotoEvalAggregate;
    /** Ship-readiness criterion (Michael ruling): a real-photo subset
     * must EXIST and pass the bars. With zero real fixtures this is
     * UNMET by construction. */
    realPhotoShipCriterionMet: boolean;
} {
    const synthetic = aggregateScores(
        scores.filter((score) => score.source === "synthetic"),
    );
    const real = aggregateScores(
        scores.filter((score) => score.source === "real"),
    );
    return {
        combined: aggregateScores(scores),
        synthetic,
        real,
        realPhotoShipCriterionMet: real.fixtures > 0 && real.passesBars,
    };
}
