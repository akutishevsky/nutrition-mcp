import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { previewInventoryImage } from "../../src/inventory/vision.js";
import {
    validateMealIdeaGrounding,
    type PantryMealIdeasResponse,
} from "../../src/inventory/meal-ideas.js";
import { OpenRouterRecipeImportResolver } from "../../src/recipe-import/semantic-resolver.js";

/**
 * S0 ai-fixture lane: recorded OpenRouter responses (golden JSON in this
 * directory) replayed through the real AI modules with the transport
 * mocked. Deterministic, secret-free, zero live spend. The model slug in
 * every fixture is the program's target model; the modules under test do
 * not care which model "recorded" the envelope, only that the recorded
 * shape still parses, heals, and grounds.
 */

const fixtureDir = join(import.meta.dir);

async function loadFixture(name: string): Promise<Record<string, any>> {
    return JSON.parse(await readFile(join(fixtureDir, name), "utf8"));
}

function recordedFetcher(fixture: Record<string, any>, seen?: string[]) {
    return async (input: RequestInfo | URL) => {
        seen?.push(String(input));
        return new Response(JSON.stringify(fixture), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    };
}

function fixtureContent(fixture: Record<string, any>): string {
    const content = fixture.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
        throw new Error("Fixture is missing recorded message content");
    }
    return content;
}

const visionConfig = {
    apiKey: "fixture-key",
    model: "meta/muse-ember-1.0",
    baseUrl: "https://openrouter.invalid/v1",
    timeoutMs: 1_000,
};

describe("ai-fixture: pantry vision (recorded responses)", () => {
    test("receipt fixture parses through the strict preview schema", async () => {
        const fixture = await loadFixture("vision-receipt.response.json");
        const seen: string[] = [];
        const preview = await previewInventoryImage(
            {
                mode: "receipt",
                mimeType: "image/jpeg",
                bytes: new Uint8Array([1, 2, 3]),
            },
            visionConfig,
            { fetcher: recordedFetcher(fixture, seen) },
        );
        expect(seen).toEqual([
            "https://openrouter.invalid/v1/chat/completions",
        ]);
        expect(preview.lines).toHaveLength(3);
        expect(preview.lines[0]).toMatchObject({
            name: "Ground beef",
            is_food: true,
            location: "fridge",
        });
        expect(preview.lines[2]?.is_food).toBe(false);
    });

    test("pantry photo fixture parses and keeps review notes", async () => {
        const fixture = await loadFixture("vision-pantry-photo.response.json");
        const preview = await previewInventoryImage(
            {
                mode: "pantry_photo",
                mimeType: "image/png",
                bytes: new Uint8Array([4, 5]),
            },
            visionConfig,
            { fetcher: recordedFetcher(fixture) },
        );
        expect(preview.lines.map((line) => line.name)).toEqual([
            "Eggs",
            "Frozen peas",
        ]);
        expect(preview.lines[1]?.location).toBe("freezer");
        expect(preview.notes).toEqual(["Back row partially obscured."]);
    });
});

describe("ai-fixture: pantry meal ideas (recorded response + grounding)", () => {
    test("grounding keeps the grounded candidate and drops the invented one", async () => {
        const fixture = await loadFixture("meal-ideas.response.json");
        const decoded = JSON.parse(
            fixtureContent(fixture),
        ) as PantryMealIdeasResponse;
        expect(decoded.candidates).toHaveLength(2);

        const context = {
            request: {
                goal: "high_protein",
                meal_type: "dinner",
                servings: 2,
                max_minutes: 45,
                allow_missing_items: 1,
                assumed_staples: ["salt", "black pepper"],
            },
            pantry: [{ name: "ground beef" }, { name: "smoked paprika" }],
            saved_recipe_candidates: [
                {
                    recipe_id: "11111111-1111-4111-8111-111111111111",
                    name: "Smoky beef bowl",
                },
            ],
        };
        const grounded = validateMealIdeaGrounding(decoded, context as any);
        expect(grounded.candidates).toHaveLength(1);
        expect(grounded.candidates[0]?.name).toBe("Smoky beef bowl");
        expect(grounded.candidates[0]?.source).toBe("saved_recipe");
    });
});

describe("ai-fixture: recipe import resolver (recorded response)", () => {
    test("normalize fixture resolves ingredient intents with no invented IDs", async () => {
        const fixture = await loadFixture(
            "recipe-import-normalize.response.json",
        );
        const resolver = new OpenRouterRecipeImportResolver(
            {
                apiKey: "fixture-key",
                baseUrl: "https://openrouter.invalid/v1",
                model: "meta/muse-ember-1.0",
                timeoutMs: 1_000,
                maxTokens: 2_000,
                maxCallsPerImport: 2,
                responseFormat: "json_schema",
                responseHealing: true,
            },
            { fetcher: recordedFetcher(fixture) },
        );
        const recipe = {
            name: "Fixture Stew",
            description: "A generic fixture recipe.",
            servings: 4,
            instructions: ["Add the potatoes."],
            ingredients: [
                {
                    rawText: "4-5 small Yukon gold potatoes",
                    name: "small Yukon gold potatoes",
                    quantity: 4,
                    unit: "piece",
                },
            ],
        };
        const intents = await resolver.normalizeRecipe(recipe as any);
        expect(intents).toHaveLength(1);
        expect(intents[0]).toMatchObject({
            rawIndex: 0,
            name: "Yukon gold potato",
            quantity: 4.5,
            assumption: "Used the midpoint of the 4-5 potato range.",
        });
        expect(JSON.stringify(intents)).not.toContain("provider_food_id");
        expect(JSON.stringify(intents)).not.toContain("providerFoodId");
    });
});
