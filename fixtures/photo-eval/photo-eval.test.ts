import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
// TODO(S3): pipeline-stage assertions, owned by the S3 photo-logging slice.
// These are declared (not silently absent) and become real tests when the
// meal_photo pipeline lands:
//   - grounding execution: each recorded item name resolves through the
//     canonical food search in the expected order (local catalog, then
//     USDA + Open Food Facts) or falls back to a labelled model_estimate;
//   - draft shape: the pipeline produces a meal draft whose items,
//     sources, and assumptions match the recorded response;
//   - accuracy bars (brief section 3): item recall >= 90%, >= 80% of
//     items provider-grounded, portions within +/-30% for >= 70% of
//     items, zero fabricated provider IDs or nutrition values, calorie
//     total within +/-25% on >= 75% of fixtures (nightly live eval).
// ---------------------------------------------------------------------------
describe("S3 pipeline stages (owned by the S3 slice)", () => {
    test.todo(
        "grounding resolves recorded items via the canonical search order",
    );
    test.todo(
        "pipeline produces a confirmable meal draft from a recorded response",
    );
    test.todo("fixture set meets the brief section 3 accuracy bars");
});
