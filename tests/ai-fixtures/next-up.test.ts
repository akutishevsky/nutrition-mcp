import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { composeNextUpSuggestion } from "../../src/app/next-up-ai.js";
import type { NextUpContext } from "../../src/guidance/next-up.js";
import { websiteGuidanceAiConfig } from "../../src/website-ai-config.js";

/**
 * Next up composition (guidance rework D4): the recorded Ember
 * envelope replays through the real compose module — request build,
 * parse, and the grounding validation — with the transport mocked.
 * A pick that cites anything outside the assembled context resolves
 * to null here, and the service falls back to its deterministic
 * pick; an ungrounded answer can never reach the home screen.
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

const context: NextUpContext = {
    date: "2026-11-10",
    day_part: "midday",
    objective: "maintain",
    goals: { calories: 2000, protein_g: 120, carbs_g: 220, fat_g: 65 },
    totals: { calories: 900, protein_g: 55, carbs_g: 100, fat_g: 30 },
    filled_slots: ["breakfast"],
    planned: [],
    pantry: [
        {
            name: "Chicken breast",
            quantity: 2,
            unit: "pieces",
            stock_state: "low",
            updated_at: "2026-11-07T10:00:00.000Z",
        },
    ],
    grocery_names: [],
    candidates: [
        {
            id: "recipe:11111111-1111-4111-8111-111111111111",
            kind: "recipe",
            name: "Chicken rice bowl",
            recipe_id: "11111111-1111-4111-8111-111111111111",
            recipe_revision_id: "22222222-2222-4222-8222-222222222222",
            servings: 1,
            nutrition: {
                calories: 520,
                protein_g: 42,
                carbs_g: 48,
                fat_g: 16,
            },
            ingredient_names: ["Chicken breast", "Rice", "Broccoli"],
            uses_pantry: ["Chicken breast"],
            last_logged_date: null,
        },
    ],
    features: { plan: true, recipes: true, groceries: true, pantry: true },
};

describe("ai-fixture: next-up composition (recorded response)", () => {
    test("recorded pick validates against the assembled context", async () => {
        const fixture = await loadFixture("next-up-compose.response.json");
        expect(fixture.model).toBe("meta/muse-ember");
        const config = websiteGuidanceAiConfig({
            OPENROUTER_API_KEY: "<redacted>",
        });
        expect(config?.model).toBe("meta/muse-ember");
        const seen: string[] = [];
        const composition = await composeNextUpSuggestion(
            { config: config!, context },
            { fetcher: recordedFetcher(fixture, seen) },
        );
        expect(seen).toEqual(["https://openrouter.ai/api/v1/chat/completions"]);
        expect(composition?.source).toBe("model");
        expect(composition?.candidate_id).toBe(context.candidates[0]!.id);
        expect(composition?.reason).toContain("chicken breast");
    });
});
