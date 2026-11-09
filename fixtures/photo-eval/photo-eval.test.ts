import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
    groundMealPhotoItems,
    type GroundedMealPhotoItem,
} from "../../src/meal-photo/grounding.js";
import {
    aggregateScores,
    scoreFixture,
    splitBySource,
    type PhotoEvalFixtureScore,
} from "../../src/meal-photo/scoring.js";
import type { FoodCandidate } from "../../src/food-providers/types.js";

/**
 * S3 photo-eval fixture harness (skeleton, track T5).
 *
 * This suite validates the golden fixture set itself and the recorded
 * Ember stage-2 responses for the per-PR subset, so the data contract the
 * S3 decider pipeline must satisfy is executable today:
 *
 *   - every fixture photo exists, is a JPEG, and is web-sized;
 *   - every fixture has golden expectations (item set, portion range,
 *     expected grounding provider, category tags);
 *   - the per-PR subset is exactly 10 fixtures, each with a recorded
 *     response that matches the brief section 3 stage-2 schema (items,
 *     cooking method, quantity + unit, portion confidence, assumptions)
 *     and agrees with the fixture's expectations.
 *
 * Pipeline-stage assertions (grounding execution against
 * src/canonical-food-search.ts, candidate ranking, draft shape, and the
 * section 3 accuracy bars) belong to S3 proper and are declared as TODO
 * tests at the bottom of this file — they are intentionally not silently
 * absent.
 */

const HERE = dirname(fileURLToPath(import.meta.url));

const PROVIDERS = [
    "local catalog",
    "USDA",
    "Open Food Facts",
    "model_estimate",
] as const;

const REQUIRED_CATEGORIES = [
    "single_item",
    "mixed_plate",
    "sauced_hidden",
    "restaurant",
    "packaged_label",
    "drinks",
    "poorly_lit",
    "partially_eaten",
] as const;

interface PortionExpectation {
    min_quantity: number;
    max_quantity: number;
    unit: string;
}

interface ItemExpectation {
    name: string;
    portion: PortionExpectation;
    expected_provider: string;
}

interface FixtureExpectation {
    id: string;
    file: string;
    source: string;
    categories: string[];
    items: ItemExpectation[];
}

interface RecordedItem {
    name: string;
    cooking_method: string | null;
    quantity: number;
    unit: string;
    portion_confidence: number;
    assumptions: string[];
}

function readJson<T>(relativePath: string): T {
    return JSON.parse(readFileSync(join(HERE, relativePath), "utf8")) as T;
}

const expectations = readJson<{
    version: number;
    fixtures: FixtureExpectation[];
}>("expectations.json");
const manifest = readJson<{
    fixtures: Array<{
        id: string;
        file: string;
        source: string;
        license: string;
    }>;
}>("manifest.json");
const subset = readJson<{ per_pr_fixture_ids: string[] }>("subset.json");

const fixturesById = new Map(expectations.fixtures.map((f) => [f.id, f]));

function jpegDimensions(bytes: Buffer): { width: number; height: number } {
    // Walk JPEG segments to the SOF0/SOF2 marker for the frame size.
    let offset = 2;
    while (offset + 9 < bytes.length) {
        if (bytes[offset] !== 0xff) break;
        const marker = bytes[offset + 1]!;
        if (marker === 0xc0 || marker === 0xc2) {
            return {
                height: bytes.readUInt16BE(offset + 5),
                width: bytes.readUInt16BE(offset + 7),
            };
        }
        offset += 2 + bytes.readUInt16BE(offset + 2);
    }
    throw new Error("no SOF marker found");
}

describe("photo-eval fixture set integrity", () => {
    test("contains exactly 40 golden fixtures", () => {
        expect(expectations.fixtures).toHaveLength(40);
        expect(fixturesById.size).toBe(40);
    });

    test("covers every brief section 3 category", () => {
        const counts = new Map<string, number>();
        for (const fixture of expectations.fixtures) {
            for (const category of fixture.categories) {
                counts.set(category, (counts.get(category) ?? 0) + 1);
            }
        }
        for (const category of REQUIRED_CATEGORIES) {
            expect(counts.get(category) ?? 0).toBeGreaterThan(0);
        }
    });

    test("every fixture photo exists, is JPEG, and is web-sized (<=1600px)", () => {
        for (const fixture of expectations.fixtures) {
            const path = join(HERE, fixture.file);
            const bytes = readFileSync(path);
            expect(bytes.length).toBeGreaterThan(0);
            expect(bytes[0]).toBe(0xff);
            expect(bytes[1]).toBe(0xd8);
            const { width, height } = jpegDimensions(bytes);
            expect(Math.max(width, height)).toBeLessThanOrEqual(1600);
            expect(statSync(path).size).toBeGreaterThan(0);
        }
    });

    test("photo files on disk match the expectation set (no orphans)", () => {
        const onDisk = readdirSync(join(HERE, "photos"))
            .filter((name) => name.endsWith(".jpg"))
            .sort();
        const expected = expectations.fixtures
            .map((fixture) => fixture.file.replace(/^photos\//, ""))
            .sort();
        expect(onDisk).toEqual(expected);
    });

    test("every fixture has provenance in the manifest", () => {
        expect(manifest.fixtures).toHaveLength(40);
        for (const entry of manifest.fixtures) {
            expect(fixturesById.has(entry.id)).toBe(true);
            expect(entry.source.length).toBeGreaterThan(0);
            expect(entry.license.length).toBeGreaterThan(0);
        }
    });

    test("every expectation item has a provider and a sane portion range", () => {
        for (const fixture of expectations.fixtures) {
            expect(fixture.items.length).toBeGreaterThan(0);
            expect(fixture.categories.length).toBeGreaterThan(0);
            for (const item of fixture.items) {
                expect(item.name.length).toBeGreaterThan(0);
                expect(PROVIDERS).toContain(item.expected_provider as never);
                expect(item.portion.unit.length).toBeGreaterThan(0);
                expect(item.portion.min_quantity).toBeGreaterThan(0);
                expect(item.portion.max_quantity).toBeGreaterThanOrEqual(
                    item.portion.min_quantity,
                );
            }
        }
    });

    test("expectations keep the section 3 grounding bar reachable (>=80% provider-grounded)", () => {
        const items = expectations.fixtures.flatMap((fixture) => fixture.items);
        const grounded = items.filter(
            (item) => item.expected_provider !== "model_estimate",
        );
        expect(grounded.length / items.length).toBeGreaterThanOrEqual(0.8);
    });
});

describe("per-PR recorded-response subset", () => {
    test("designates exactly 10 fixtures, all present in the fixture set", () => {
        expect(subset.per_pr_fixture_ids).toHaveLength(10);
        expect(new Set(subset.per_pr_fixture_ids).size).toBe(10);
        for (const id of subset.per_pr_fixture_ids) {
            expect(fixturesById.has(id)).toBe(true);
        }
    });

    test("every subset fixture has a recorded response matching the stage-2 schema", () => {
        for (const id of subset.per_pr_fixture_ids) {
            const recorded = readJson<{
                fixture_id: string;
                recorded: boolean;
                model: string;
                stage: string;
                response: { items: RecordedItem[] };
            }>(join("recorded", `${id}.json`));

            expect(recorded.fixture_id).toBe(id);
            expect(recorded.recorded).toBe(true);
            expect(recorded.stage).toBe("identify_and_portions");
            // Stage 2 must never carry nutrition numbers (brief section 3).
            expect(JSON.stringify(recorded)).not.toMatch(
                /calories|protein_g|carbs_g|fat_g/,
            );

            const fixture = fixturesById.get(id)!;
            const expectedByName = new Map(
                fixture.items.map((item) => [item.name, item]),
            );
            expect(recorded.response.items.length).toBe(fixture.items.length);
            for (const item of recorded.response.items) {
                const expected = expectedByName.get(item.name);
                expect(expected).toBeDefined();
                expect(
                    item.cooking_method === null ||
                        typeof item.cooking_method === "string",
                ).toBe(true);
                expect(item.quantity).toBeGreaterThan(0);
                expect(item.unit).toBe(expected!.portion.unit);
                expect(item.quantity).toBeGreaterThanOrEqual(
                    expected!.portion.min_quantity,
                );
                expect(item.quantity).toBeLessThanOrEqual(
                    expected!.portion.max_quantity,
                );
                expect(item.portion_confidence).toBeGreaterThanOrEqual(0);
                expect(item.portion_confidence).toBeLessThanOrEqual(1);
                expect(Array.isArray(item.assumptions)).toBe(true);
                for (const assumption of item.assumptions) {
                    expect(typeof assumption).toBe("string");
                    expect(assumption.length).toBeGreaterThan(0);
                }
            }
        }
    });
});

// ---------------------------------------------------------------------------
// S3 pipeline stages (resolved in the S3 slice): the recorded subset runs
// the FULL deterministic pipeline per-PR — recorded stage-2 response →
// grounding through a canonical-search seam → draft-item shape → §3 bar
// scoring. The fake search below stands in for FoodSearchService (which
// needs Postgres): it returns one provider candidate per expected item,
// labelled by the expected provider family ("local catalog" and "USDA"
// are the same USDA-backed family; the local catalog is cached provider
// data), and NO candidate for items whose expectation is model_estimate.
// Nutrition in the fake candidates is provider-supplied test data, so
// the lane can prove draft nutrition derives from providers only.
// The nightly LIVE lane (scripts/photo-eval-live.ts) measures the real
// model + real providers against the same bars.
// ---------------------------------------------------------------------------

function recordedItems(id: string): RecordedItem[] {
    return readJson<{ response: { items: RecordedItem[] } }>(
        join("recorded", `${id}.json`),
    ).response.items;
}

function fakeCandidate(
    fixtureId: string,
    item: ItemExpectation,
    index: number,
): FoodCandidate | null {
    if (item.expected_provider === "model_estimate") return null;
    const provider =
        item.expected_provider === "Open Food Facts"
            ? ("open_food_facts" as const)
            : ("usda" as const);
    const mid = (item.portion.min_quantity + item.portion.max_quantity) / 2;
    const nutrients = {
        calories: 100,
        protein_g: 10,
        carbs_g: 12,
        fat_g: 4,
    };
    return {
        provider,
        providerFoodId: `eval-${fixtureId}-${index}`,
        name: item.name,
        dataKind: "generic",
        nutrientsPer100g: nutrients,
        portions: [
            {
                id: "eval-portion",
                amount: mid,
                unit: item.portion.unit,
                label: `${mid} ${item.portion.unit}`,
                gramWeight: 100,
                nutrients,
            },
        ],
        attribution: {
            label:
                provider === "usda"
                    ? "USDA FoodData Central"
                    : "Open Food Facts",
        },
        confidence: 0.95,
    };
}

function fakeSearchFor(fixture: FixtureExpectation) {
    const candidates = fixture.items
        .map((item, index) => fakeCandidate(fixture.id, item, index))
        .filter((candidate): candidate is FoodCandidate => candidate !== null);
    const returnedProviderIds = new Set(
        candidates.map((candidate) => candidate.providerFoodId),
    );
    const search = async (query: string) => ({
        candidates: candidates.filter(
            (candidate) =>
                candidate.name.toLowerCase() === query.trim().toLowerCase(),
        ),
        failures: [],
    });
    return { search, returnedProviderIds };
}

async function runRecordedPipeline(fixture: FixtureExpectation): Promise<{
    grounded: GroundedMealPhotoItem[];
    returnedProviderIds: Set<string>;
}> {
    const { search, returnedProviderIds } = fakeSearchFor(fixture);
    const grounded = await groundMealPhotoItems(recordedItems(fixture.id), {
        search: search as never,
    });
    return { grounded, returnedProviderIds };
}

async function referenceCalories(fixture: FixtureExpectation): Promise<number> {
    const { search } = fakeSearchFor(fixture);
    const goldenItems = fixture.items.map((item) => ({
        name: item.name,
        cooking_method: null,
        quantity: (item.portion.min_quantity + item.portion.max_quantity) / 2,
        unit: item.portion.unit,
        portion_confidence: 1,
        assumptions: [] as string[],
    }));
    const grounded = await groundMealPhotoItems(goldenItems, {
        search: search as never,
    });
    return grounded.reduce(
        (sum, entry) => sum + (entry.draftItem.nutrients.calories ?? 0),
        0,
    );
}

describe("S3 pipeline stages (recorded subset, deterministic)", () => {
    test("every fixture declares a source (synthetic | real)", () => {
        for (const fixture of expectations.fixtures) {
            expect(["synthetic", "real"]).toContain(fixture.source);
        }
        const manifestById = new Map(
            manifest.fixtures.map((entry) => [entry.id, entry]),
        );
        for (const fixture of expectations.fixtures) {
            expect(manifestById.get(fixture.id)?.source).toBe(fixture.source);
        }
    });

    test("grounding resolves recorded items via the canonical search order", async () => {
        for (const id of subset.per_pr_fixture_ids) {
            const fixture = fixturesById.get(id)!;
            const { grounded } = await runRecordedPipeline(fixture);
            expect(grounded).toHaveLength(fixture.items.length);
            grounded.forEach((entry, index) => {
                const expected = fixture.items[index]!;
                if (expected.expected_provider === "model_estimate") {
                    expect(entry.grounded).toBe(false);
                    expect(entry.draftItem.sourceType).toBe("model_estimate");
                    // Nutrition NEVER comes from the model: ungrounded
                    // items carry empty nutrients, assumptions preserved.
                    expect(entry.draftItem.nutrients).toEqual({});
                    expect(entry.draftItem.assumptions).toEqual(
                        entry.vision.assumptions,
                    );
                } else {
                    expect(entry.grounded).toBe(true);
                    const expectedFamily =
                        expected.expected_provider === "Open Food Facts"
                            ? "Open Food Facts"
                            : "USDA";
                    expect(entry.groundingSource).toBe(expectedFamily);
                    expect(entry.draftItem.providerFoodId).toBe(
                        `eval-${fixture.id}-${index}`,
                    );
                    // Draft nutrition is the provider's, scaled — never
                    // the recorded response's (it carries none).
                    expect(entry.draftItem.nutrients.calories).toBeGreaterThan(
                        0,
                    );
                }
            });
        }
    });

    test("pipeline produces a confirmable meal draft shape from a recorded response", async () => {
        for (const id of subset.per_pr_fixture_ids) {
            const fixture = fixturesById.get(id)!;
            const { grounded } = await runRecordedPipeline(fixture);
            // Draft items: one per vision item, in order, each a valid
            // StructuredMealItemInput shape for upsertMealDraftItem.
            for (const entry of grounded) {
                expect(entry.draftItem.name.length).toBeGreaterThan(0);
                expect(entry.draftItem.quantity).toBe(entry.vision.quantity);
                expect(entry.draftItem.portionLabel).toBe(
                    `${entry.vision.quantity} ${entry.vision.unit}`,
                );
                expect(entry.draftItem.confidence).toBe(
                    entry.vision.portion_confidence,
                );
            }
            // Low-confidence items MUST surface as draft questions.
            const lowConfidence = grounded.filter(
                (entry) => entry.vision.portion_confidence < 0.7,
            );
            for (const entry of lowConfidence) {
                expect(entry.needsQuestion).toBe(true);
                expect(entry.question?.prompt).toContain(entry.vision.name);
            }
        }
        // The poorly-lit and partially-eaten fixtures exercise the
        // question path with real recorded confidences (0.5–0.65).
        const poorlyLit = await runRecordedPipeline(
            fixturesById.get("poorly-lit-01-chicken-rice")!,
        );
        expect(poorlyLit.grounded.every((entry) => entry.needsQuestion)).toBe(
            true,
        );
    });

    test("recorded subset meets the brief section 3 accuracy bars (split by source)", async () => {
        const scores: PhotoEvalFixtureScore[] = [];
        for (const id of subset.per_pr_fixture_ids) {
            const fixture = fixturesById.get(id)!;
            const { grounded, returnedProviderIds } =
                await runRecordedPipeline(fixture);
            scores.push(
                scoreFixture({
                    fixtureId: fixture.id,
                    source: fixture.source,
                    expected: fixture.items,
                    grounded,
                    returnedProviderIds,
                    referenceCalories: await referenceCalories(fixture),
                }),
            );
        }
        const split = splitBySource(scores);
        // Per-PR lane bars on the recorded subset: recall, grounding,
        // portions, and the zero-fabrication hard bar. The calorie bar
        // is scored and printed here; it is enforced on the full
        // 40-fixture aggregate by the nightly live lane.
        expect(split.combined.bars.recall).toBe(true);
        expect(split.combined.bars.grounded).toBe(true);
        expect(split.combined.bars.portions).toBe(true);
        expect(split.combined.bars.fabrication).toBe(true);
        expect(split.combined.fabricatedIds).toBe(0);
        expect(split.combined.fabricatedNutrition).toBe(0);
        // Source split is always printed; with zero real fixtures the
        // real-photo ship criterion is UNMET by construction.
        console.info(
            `[photo-eval] per-PR subset synthetic n=${split.synthetic.fixtures} recall=${split.synthetic.recall.toFixed(2)} grounded=${split.synthetic.groundedShare.toFixed(2)} portions=${split.synthetic.portionWithin30Share.toFixed(2)} calorieWithin25=${split.synthetic.calorieWithin25Share === null ? "n/a" : split.synthetic.calorieWithin25Share.toFixed(2)} | real n=${split.real.fixtures} | real-photo ship criterion met: ${split.realPhotoShipCriterionMet}`,
        );
        expect(split.real.fixtures).toBe(0);
        expect(split.realPhotoShipCriterionMet).toBe(false);
        expect(aggregateScores(scores).fixtures).toBe(10);
    });
});
