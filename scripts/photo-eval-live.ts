/**
 * Nightly LIVE photo eval (S3, brief §3 CI split): runs real Ember
 * vision (OpenRouter) against all 40 fixtures and grounds through the
 * live USDA + Open Food Facts providers (the local catalog layer needs
 * Postgres and is skipped in this lane — grounding here is the provider
 * registry, labelled as such in the report).
 *
 * Scores come from src/meal-photo/scoring.ts and are ALWAYS reported
 * split by fixture source (synthetic | real) plus combined. The fixture
 * set is 100% synthetic illustrations today: those scores measure Ember
 * on illustrations, NOT photographic accuracy. Ship readiness requires
 * a real-photo subset that exists AND passes the bars; with zero real
 * fixtures that criterion is UNMET by construction and the report says
 * so plainly.
 *
 * Exit code 1 when the combined §3 bars are breached (a visible nightly
 * failure). Outputs (default ./photo-eval-report/): report.json,
 * report.md, trend.json (the repo trend file with this run appended).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { OpenFoodFactsProvider } from "../src/food-providers/open-food-facts.js";
import { FoodProviderRegistry } from "../src/food-providers/registry.js";
import { UsdaFoodDataCentralProvider } from "../src/food-providers/usda.js";
import {
    groundMealPhotoItems,
    type MealPhotoGroundingDeps,
} from "../src/meal-photo/grounding.js";
import {
    aggregateScores,
    scoreFixture,
    splitBySource,
    type PhotoEvalFixtureScore,
} from "../src/meal-photo/scoring.js";
import {
    chooseMealPhotoCandidates,
    identifyMealPhoto,
    mealPhotoVisionConfig,
    MealPhotoNoFoodError,
    type MealPhotoVisionItem,
} from "../src/meal-photo/vision.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURES = join(ROOT, "fixtures", "photo-eval");
const OUT = process.env.PHOTO_EVAL_OUT ?? join(ROOT, "photo-eval-report");

interface ExpectationFixture {
    id: string;
    file: string;
    source: string;
    items: Array<{
        name: string;
        portion: { min_quantity: number; max_quantity: number; unit: string };
        expected_provider: string;
    }>;
}

const expectations = JSON.parse(
    await readFile(join(FIXTURES, "expectations.json"), "utf8"),
) as { fixtures: ExpectationFixture[] };

const config = mealPhotoVisionConfig();
if (!config) {
    console.error(
        "[photo-eval] OPENROUTER_API_KEY is not configured; the live lane cannot run.",
    );
    process.exit(2);
}

const registry = new FoodProviderRegistry([
    new UsdaFoodDataCentralProvider({ timeoutMs: 10_000 }),
    new OpenFoodFactsProvider({ timeoutMs: 10_000 }),
]);
const returnedByFixture = new Map<string, Set<string>>();
function groundingDeps(fixtureId: string): MealPhotoGroundingDeps {
    return {
        search: async (query: string, limit = 10) => {
            const result = await registry.search({ query, limit });
            const ids = returnedByFixture.get(fixtureId) ?? new Set<string>();
            for (const candidate of result.candidates) {
                ids.add(candidate.providerFoodId);
            }
            returnedByFixture.set(fixtureId, ids);
            return result;
        },
        chooseCandidates: (requests) =>
            chooseMealPhotoCandidates(requests, config),
    };
}

const scores: PhotoEvalFixtureScore[] = [];
const failures: Array<{ fixture: string; error: string }> = [];
for (const fixture of expectations.fixtures) {
    try {
        const bytes = new Uint8Array(
            await readFile(join(FIXTURES, fixture.file)),
        );
        let visionItems: MealPhotoVisionItem[] = [];
        try {
            const vision = await identifyMealPhoto(
                { mimeType: "image/jpeg", bytes },
                config,
            );
            visionItems = vision.items;
        } catch (error) {
            if (!(error instanceof MealPhotoNoFoodError)) throw error;
            visionItems = [];
        }
        const grounded = await groundMealPhotoItems(
            visionItems,
            groundingDeps(fixture.id),
        );
        // Reference calories: the EXPECTED items at golden-mid portions,
        // grounded through the same live providers.
        const goldenItems: MealPhotoVisionItem[] = fixture.items.map(
            (item) => ({
                name: item.name,
                cooking_method: null,
                quantity:
                    (item.portion.min_quantity + item.portion.max_quantity) / 2,
                unit: item.portion.unit,
                portion_confidence: 1,
                assumptions: [],
            }),
        );
        const goldenGrounded = await groundMealPhotoItems(
            goldenItems,
            groundingDeps(fixture.id),
        );
        const referenceCalories = goldenGrounded.reduce(
            (sum, entry) => sum + (entry.draftItem.nutrients.calories ?? 0),
            0,
        );
        scores.push(
            scoreFixture({
                fixtureId: fixture.id,
                source: fixture.source,
                expected: fixture.items,
                grounded,
                returnedProviderIds:
                    returnedByFixture.get(fixture.id) ?? new Set(),
                referenceCalories:
                    referenceCalories > 0 ? referenceCalories : null,
            }),
        );
        console.info(
            `[photo-eval] ${fixture.id} (${fixture.source}) recall=${scores.at(-1)!.recall.toFixed(2)} grounded=${scores.at(-1)!.groundedShare.toFixed(2)}`,
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push({ fixture: fixture.id, error: message });
        console.error(`[photo-eval] ${fixture.id} FAILED: ${message}`);
    }
}

const split = splitBySource(scores);
const runAt = new Date().toISOString();
const authFailure = failures.some((failure) => /HTTP 401/.test(failure.error));
const report = {
    run_at: runAt,
    model: config.model,
    grounding:
        "live USDA + Open Food Facts via FoodProviderRegistry (local catalog layer skipped: no Postgres in this lane)",
    calorie_bar_definition:
        "predicted draft calories vs reference calories from grounding the EXPECTED items at golden-mid portions through the same providers (measures identification + portion error impact, not absolute truth)",
    fixtures_scored: scores.length,
    fixtures_failed: failures,
    split: {
        combined: split.combined,
        synthetic: split.synthetic,
        real: split.real,
    },
    real_photo_ship_criterion: {
        met: split.realPhotoShipCriterionMet,
        statement: split.realPhotoShipCriterionMet
            ? "A real-photo subset exists and passes the §3 bars."
            : `UNMET: the real-photo subset has n=${split.real.fixtures} (a real subset must exist AND pass the bars before ship). Synthetic illustration scores below are NOT photographic accuracy.`,
    },
    per_fixture: scores,
};

await mkdir(OUT, { recursive: true });
await writeFile(join(OUT, "report.json"), JSON.stringify(report, null, 2));

const pct = (value: number | null) =>
    value === null ? "n/a" : `${Math.round(value * 100)}%`;
const lines = [
    `# Photo eval — live run ${runAt}`,
    ``,
    `Model: ${config.model} · Fixtures scored: ${scores.length}/40 · Fixture errors: ${failures.length}${authFailure ? " (includes OpenRouter HTTP 401 — authentication failure)" : ""}`,
    ``,
    `## Scores split by source`,
    ``,
    `| Split | n | Recall (bar ≥90%) | Grounded (≥80%) | Portions ±30% (≥70%) | Calories ±25% (≥75% of fixtures) | Fabrications (must be 0) | Bars |`,
    `|---|---|---|---|---|---|---|---|`,
    ...(
        [
            ["Combined", split.combined],
            ["Synthetic (illustrations)", split.synthetic],
            ["Real photos", split.real],
        ] as const
    ).map(
        ([label, agg]) =>
            `| ${label} | ${agg.fixtures} | ${pct(agg.recall)} | ${pct(agg.groundedShare)} | ${pct(agg.portionWithin30Share)} | ${pct(agg.calorieWithin25Share)} (${agg.calorieFixturesScored} scored) | ${agg.fabricatedIds + agg.fabricatedNutrition} | ${agg.fixtures === 0 ? "n/a" : agg.passesBars ? "PASS" : "FAIL"} |`,
    ),
    ``,
    `## Real-photo ship criterion`,
    ``,
    report.real_photo_ship_criterion.statement,
    ``,
    `Synthetic scores measure Ember on procedurally generated illustrations. They are not evidence of accuracy on real meal photographs.`,
    ``,
];
if (failures.length > 0) {
    lines.push(`## Fixture errors`, ``);
    for (const failure of failures) {
        lines.push(`- ${failure.fixture}: ${failure.error}`);
    }
    lines.push(``);
}
await writeFile(join(OUT, "report.md"), lines.join("\n"));

// Trend: append this run's split to the repo trend file's history.
const trendPath = join(FIXTURES, "trend.json");
let trend: { runs: Array<Record<string, unknown>> } = { runs: [] };
try {
    trend = JSON.parse(await readFile(trendPath, "utf8"));
} catch {
    trend = { runs: [] };
}
trend.runs.push({
    run_at: runAt,
    model: config.model,
    combined: split.combined,
    synthetic: split.synthetic,
    real_fixtures: split.real.fixtures,
    real_photo_ship_criterion_met: split.realPhotoShipCriterionMet,
    fixture_errors: failures.length,
});
await writeFile(join(OUT, "trend.json"), JSON.stringify(trend, null, 2));

console.info(lines.join("\n"));
if (failures.length > 0 || !split.combined.passesBars) {
    console.error(
        "[photo-eval] BAR BREACH or fixture errors — failing the run visibly.",
    );
    process.exit(1);
}
console.info("[photo-eval] combined bars pass (synthetic-only set).");
