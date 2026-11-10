#!/usr/bin/env bun

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { closePlatformDatabase } from "../src/platform/database.js";
import { previewRecipeUrl } from "../src/recipe-import/service.js";
import { registerRecipePlanningTools } from "../src/recipe-planning-tools.js";
import { createSmokeIdentity } from "./support/smoke-user.js";

if (!process.env.DATABASE_URL) {
    throw new Error(
        "DATABASE_URL is required for recipe import roundtrip smoke tests",
    );
}

function canonical(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, nested]) => [key, canonical(nested)]),
        );
    }
    return value;
}

function equalJson(actual: unknown, expected: unknown): boolean {
    return (
        JSON.stringify(canonical(actual)) ===
        JSON.stringify(canonical(expected))
    );
}

function sourceSnapshotBeforeAutomaticNutrition(value: unknown): unknown {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return value;
    }
    const { automatic_nutrition: _automaticNutrition, ...original } =
        value as Record<string, unknown>;
    return original;
}

function storedNumber(
    actual: unknown,
    expected: unknown,
    scale: number,
): boolean {
    if (expected == null) return actual == null;
    if (typeof actual !== "number" || typeof expected !== "number") {
        return false;
    }
    return Math.abs(actual - expected) <= 0.5 * 10 ** -scale + Number.EPSILON;
}

function sourceTypeMatchesResolvedNutrition(
    actual: any,
    expected: any,
): boolean {
    const automaticNutrition = actual.source_snapshot?.automatic_nutrition;
    if (automaticNutrition?.resolution === "low_impact_zero") {
        return actual.source_type === "model_estimate";
    }
    return actual.source_type === expected.source_type;
}

const sourceUrl = "https://example.com/roundtrip-lemon-pasta";
const html = `
    <html><head>
      <meta property="og:site_name" content="Roundtrip Kitchen" />
      <link rel="canonical" href="${sourceUrl}" />
    </head><body>
      <div class="wprm-recipe-container">
        <h2 class="wprm-recipe-name">Roundtrip Lemon Pasta</h2>
        <div class="wprm-recipe-summary">A source-faithful persistence fixture.</div>
        <div class="wprm-recipe-servings-container">Serves <span class="wprm-recipe-servings">2</span></div>
        <div class="wprm-recipe-prep-time-container">Prep Time 5 minutes</div>
        <div class="wprm-recipe-cook-time-container">Cook Time 15 minutes</div>
        <ul>
          <li class="wprm-recipe-ingredient"><span class="wprm-recipe-ingredient-amount">8</span> <span class="wprm-recipe-ingredient-unit">ounces</span> <span class="wprm-recipe-ingredient-name">spaghetti</span></li>
          <li class="wprm-recipe-ingredient"><span class="wprm-recipe-ingredient-amount">⅓</span> <span class="wprm-recipe-ingredient-unit">cup</span> <span class="wprm-recipe-ingredient-name">Parmesan cheese</span>, <span class="wprm-recipe-ingredient-notes">grated</span></li>
          <li class="wprm-recipe-ingredient"><span class="wprm-recipe-ingredient-name">Sea salt to taste</span></li>
        </ul>
        <ol>
          <li class="wprm-recipe-instruction"><div class="wprm-recipe-instruction-text">Cook the pasta until al dente.</div></li>
          <li class="wprm-recipe-instruction"><div class="wprm-recipe-instruction-text">Toss with the cheese and serve.</div></li>
        </ol>
      </div>
    </body></html>
`;

const user = await createSmokeIdentity("recipe-import-roundtrip");
const draft = await previewRecipeUrl(sourceUrl, {
    fetchPage: async (url) => ({
        submittedUrl: url,
        finalUrl: url,
        html,
    }),
    foodSearch: {
        search: async () => ({ candidates: [], failures: [] }),
    },
});

if (draft.parser.strategy !== "recipe_card_html") {
    throw new Error(`Unexpected parser strategy: ${draft.parser.strategy}`);
}
if (
    draft.recipe.instructions.length !== 2 ||
    draft.recipe.ingredients.length !== 3
) {
    throw new Error(
        "Parsed fixture did not preserve the expected recipe structure",
    );
}

const capabilities = {
    tier: "premium",
    entitlementSource: "subscription",
    coreNutrition: true,
    personalRecipesRead: true,
    personalRecipesWrite: true,
    personalPlanningRead: true,
    personalPlanningWrite: true,
    householdRead: false,
    householdWrite: false,
    householdManage: false,
    household: null,
    historyDays: null,
} as any;

const server = new McpServer({
    name: "recipe-roundtrip-server",
    version: "1.0.0",
});
registerRecipePlanningTools(server, user.userId, capabilities);
const client = new Client({
    name: "recipe-roundtrip-client",
    version: "1.0.0",
});
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
await server.connect(serverTransport);
await client.connect(clientTransport);

const idempotencyKey = `recipe-import-roundtrip:${crypto.randomUUID()}`;
const save = await client.callTool({
    name: "save_recipe",
    arguments: {
        scope: "personal",
        recipe: draft.recipe,
        idempotency_key: idempotencyKey,
    },
});
if (save.isError) {
    throw new Error(`save_recipe failed: ${JSON.stringify(save.content)}`);
}
const saved = (save.structuredContent as any)?.recipe;
if (!saved?.recipeId || !saved?.revisionId) {
    throw new Error("save_recipe returned no recipe or revision ID");
}

const replay = await client.callTool({
    name: "save_recipe",
    arguments: {
        scope: "personal",
        recipe: draft.recipe,
        idempotency_key: idempotencyKey,
    },
});
if (
    replay.isError ||
    !(replay.structuredContent as any)?.recipe?.deduplicated
) {
    throw new Error("save_recipe did not deduplicate an idempotent replay");
}

const read = await client.callTool({
    name: "get_recipe",
    arguments: {
        recipe_id: saved.recipeId,
        recipe_revision_id: saved.revisionId,
    },
});
if (read.isError) {
    throw new Error(`get_recipe failed: ${JSON.stringify(read.content)}`);
}
const stored = (read.structuredContent as any)?.recipe;
if (!stored) throw new Error("get_recipe returned no recipe");

if (
    stored.name !== draft.recipe.name ||
    stored.description !== draft.recipe.description
) {
    throw new Error(
        "Recipe identity or description changed during persistence",
    );
}
if (!equalJson(stored.instructions, draft.recipe.instructions)) {
    throw new Error("Recipe instructions changed during persistence");
}
if (!storedNumber(stored.servings, draft.recipe.servings, 3)) {
    throw new Error("Recipe servings changed beyond database precision");
}
if (stored.source?.type !== "imported" || stored.source?.url !== sourceUrl) {
    throw new Error("Recipe source provenance changed during persistence");
}
if (stored.ingredients.length !== draft.recipe.ingredients.length) {
    throw new Error("Recipe ingredient count changed during persistence");
}

for (let index = 0; index < draft.recipe.ingredients.length; index += 1) {
    const expected = draft.recipe.ingredients[index]!;
    const actual = stored.ingredients[index]!;
    if (
        actual.position !== index ||
        actual.name !== expected.name ||
        actual.unit !== (expected.unit ?? null) ||
        actual.preparation !== (expected.preparation ?? null) ||
        actual.optional !== (expected.optional ?? false) ||
        !sourceTypeMatchesResolvedNutrition(actual, expected) ||
        actual.source_url !== (expected.source_url ?? null)
    ) {
        throw new Error(
            `Recipe ingredient ${index} changed during persistence`,
        );
    }
    if (!storedNumber(actual.quantity, expected.quantity ?? null, 3)) {
        throw new Error(
            `Recipe ingredient ${index} quantity changed beyond database precision`,
        );
    }
    if (
        !equalJson(
            sourceSnapshotBeforeAutomaticNutrition(actual.source_snapshot),
            expected.source_snapshot,
        )
    ) {
        throw new Error(
            `Recipe ingredient ${index} source snapshot changed beyond additive nutrition provenance`,
        );
    }
    if (typeof actual.source_snapshot?.raw_ingredient !== "string") {
        throw new Error(`Recipe ingredient ${index} lost its raw source text`);
    }
}

const logged = await client.callTool({
    name: "log_recipe",
    arguments: {
        recipe_id: saved.recipeId,
        recipe_revision_id: saved.revisionId,
        servings_consumed: 0.5,
        meal_type: "dinner",
        idempotency_key: `recipe-import-log:${crypto.randomUUID()}`,
    },
});
if (logged.isError) {
    throw new Error(`log_recipe failed: ${JSON.stringify(logged.content)}`);
}
const loggedContent = logged.structuredContent as any;
// The saved recipe yields 2 servings. Logging 0.5 serving is one quarter of
// the full recipe, so the 8 oz pasta ingredient must scale to 2 oz.
if (
    loggedContent?.recipe_id !== saved.recipeId ||
    loggedContent?.recipe_revision_id !== saved.revisionId ||
    loggedContent?.logged_meal?.items?.length !== 3 ||
    loggedContent?.logged_meal?.items?.[0]?.quantity !== 2
) {
    throw new Error(
        "Logged imported recipe did not preserve revision provenance or serving scaling",
    );
}

await client.close();
await server.close();
await closePlatformDatabase();
console.log("Recipe import parse -> save -> read -> log roundtrip passed.");
