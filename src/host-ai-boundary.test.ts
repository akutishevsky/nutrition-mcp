import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import type { FoodCandidate } from "./food-providers/types.js";
import { previewRecipeUrl } from "./recipe-import/service.js";

const SRC_ROOT = resolve(import.meta.dir);
const MCP_ENTRY = resolve(SRC_ROOT, "mcp-runtime.ts");

const FORBIDDEN_MCP_MODULES = new Set([
    "inventory/meal-ideas.ts",
    "inventory/vision.ts",
    "meal-photo/vision.ts",
    "meal-photo/estimate.ts",
    "meal-photo/grounding.ts",
    "meal-photo/pipeline.ts",
    "recipe-import/semantic-resolver.ts",
]);

const FORBIDDEN_MCP_SOURCE_PATTERNS: Array<[RegExp, string]> = [
    [/OPENROUTER_API_KEY/, "OpenRouter credentials"],
    [/openrouter\.ai/i, "OpenRouter endpoint"],
    [/\/chat\/completions/, "model completion endpoint"],
    [/MUNCH_AI_MODEL/, "website AI model selector"],
    [/MUNCH_[A-Z0-9_]*_AI_MODEL/, "feature AI model selector"],
    [/MUNCH_PANTRY_(?:VISION|PLANNING)_MODEL/, "Pantry AI model selector"],
];

function repoPath(file: string): string {
    return relative(SRC_ROOT, file).split(sep).join("/");
}

function resolveSourceImport(
    fromFile: string,
    specifier: string,
): string | null {
    if (!specifier.startsWith(".")) return null;
    const raw = resolve(dirname(fromFile), specifier);
    const candidates = [
        raw,
        raw.replace(/\.js$/i, ".ts"),
        raw.replace(/\.js$/i, ".tsx"),
        `${raw}.ts`,
        `${raw}.tsx`,
        resolve(raw, "index.ts"),
    ];
    return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function relativeImports(source: string): string[] {
    const imports = new Set<string>();
    const patterns = [
        /\b(?:import|export)\s+(?:type\s+)?[^;]*?\sfrom\s+["'](\.[^"']+)["']/g,
        /\bimport\s+["'](\.[^"']+)["']/g,
        /\bimport\(\s*["'](\.[^"']+)["']\s*\)/g,
    ];
    for (const pattern of patterns) {
        for (const match of source.matchAll(pattern)) {
            if (match[1]) imports.add(match[1]);
        }
    }
    return [...imports];
}

function reachableMcpSources(): Map<string, string> {
    const pending = [MCP_ENTRY];
    const visited = new Map<string, string>();
    while (pending.length > 0) {
        const file = pending.pop()!;
        if (visited.has(file)) continue;
        const source = readFileSync(file, "utf8");
        visited.set(file, source);
        for (const specifier of relativeImports(source)) {
            const target = resolveSourceImport(file, specifier);
            if (target && target.startsWith(`${SRC_ROOT}${sep}`))
                pending.push(target);
        }
    }
    return visited;
}

const flourCandidate: FoodCandidate = {
    provider: "usda",
    providerFoodId: "100",
    name: "all purpose flour",
    dataKind: "generic",
    portions: [
        {
            id: "cup",
            amount: 1,
            unit: "cup",
            label: "1 cup",
            gramWeight: 120,
            nutrients: {
                calories: 455,
                protein_g: 12.9,
                carbs_g: 95.4,
                fat_g: 1.2,
            },
        },
    ],
    nutrientsPer100g: {
        calories: 364,
        protein_g: 10.3,
        carbs_g: 76.3,
        fat_g: 1,
    },
    attribution: {
        label: "USDA FoodData Central",
        url: "https://fdc.nal.usda.gov/food/100",
    },
    confidence: 0.98,
};

describe("host AI / MCP architecture boundary", () => {
    test("MCP dependency graph cannot reach website model clients or credentials", () => {
        const reachable = reachableMcpSources();
        expect(reachable.size).toBeGreaterThan(10);

        const violations: string[] = [];
        for (const [file, source] of reachable) {
            const path = repoPath(file);
            if (FORBIDDEN_MCP_MODULES.has(path)) {
                violations.push(
                    `${path}: website AI module is reachable from MCP`,
                );
            }
            for (const [pattern, label] of FORBIDDEN_MCP_SOURCE_PATTERNS) {
                if (pattern.test(source)) {
                    violations.push(`${path}: contains ${label}`);
                }
            }
        }

        expect(violations).toEqual([]);
    });

    test("recipe preview stays deterministic even when website AI credentials exist", async () => {
        const previousApiKey = process.env.OPENROUTER_API_KEY;
        const previousEnabled = process.env.MUNCH_RECIPE_IMPORT_AI_ENABLED;
        const previousFetch = globalThis.fetch;
        let unexpectedFetches = 0;

        process.env.OPENROUTER_API_KEY = "test-key-must-not-be-used";
        process.env.MUNCH_RECIPE_IMPORT_AI_ENABLED = "true";
        globalThis.fetch = (async () => {
            unexpectedFetches += 1;
            throw new Error(
                "MCP recipe preview attempted an unexpected network call",
            );
        }) as typeof fetch;

        try {
            const draft = await previewRecipeUrl("https://example.com/recipe", {
                fetchPage: async (url) => ({
                    submittedUrl: url,
                    finalUrl: url,
                    html: `
                        <script type="application/ld+json">
                        {
                          "@type":"Recipe",
                          "name":"Simple Bread",
                          "recipeYield":"4 servings",
                          "recipeIngredient":["1 cup all purpose flour"],
                          "recipeInstructions":"Mix and bake."
                        }
                        </script>
                    `,
                }),
                foodSearch: {
                    search: async () => ({
                        candidates: [flourCandidate],
                        failures: [],
                    }),
                },
            });

            expect(draft.recipe.name).toBe("Simple Bread");
            expect(draft.recipe.ingredients[0]?.provider).toBe("usda");
            expect(unexpectedFetches).toBe(0);
        } finally {
            globalThis.fetch = previousFetch;
            if (previousApiKey === undefined)
                delete process.env.OPENROUTER_API_KEY;
            else process.env.OPENROUTER_API_KEY = previousApiKey;
            if (previousEnabled === undefined)
                delete process.env.MUNCH_RECIPE_IMPORT_AI_ENABLED;
            else process.env.MUNCH_RECIPE_IMPORT_AI_ENABLED = previousEnabled;
        }
    });
});
