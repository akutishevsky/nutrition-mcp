import { describe, expect, test } from "bun:test";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MunchCapabilities } from "./billing/capabilities.js";
import { registerFoodTools } from "./food-tools.js";
import { registerRecipeImportTools } from "./recipe-import-tools.js";
import { registerRecipePlanningTools } from "./recipe-planning-tools.js";
import { registerSavedFoodTools } from "./saved-food-tools.js";
import { withVersionedWidgetResources } from "./widget-resource-versioning.js";
import { getWidgetHtml } from "./widgets.js";

const capabilities = {
    tier: "premium",
} as unknown as MunchCapabilities;

function capture(
    register: (server: McpServer, widgetsEnabled: boolean) => void,
    widgetsEnabled: boolean,
) {
    const configs = new Map<string, Record<string, any>>();
    const resources = new Map<string, string>();
    const fakeServer = {
        registerTool(name: string, config: Record<string, any>) {
            configs.set(name, config);
        },
        registerResource(name: string, uri: string) {
            resources.set(name, uri);
        },
    } as unknown as McpServer;
    register(withVersionedWidgetResources(fakeServer), widgetsEnabled);
    return { configs, resources };
}

const FOOD_LABEL_URI = "ui://widget/food-label/v2.html";
const RECIPE_URI = "ui://widget/recipe/v2.html";

describe("food-label widget bindings (UI meta only)", () => {
    test("food tools advertise the versioned food-label UI when enabled", () => {
        const { configs, resources } = capture(
            (server, enabled) =>
                registerFoodTools(server, "test-user", enabled),
            true,
        );
        for (const name of [
            "search_foods",
            "get_food_details",
            "lookup_food_barcode",
        ]) {
            expect(configs.get(name)?._meta?.ui?.resourceUri).toBe(
                FOOD_LABEL_URI,
            );
        }
        expect([...resources.values()]).toContain(FOOD_LABEL_URI);
    });

    test("saved food tools advertise the food-label UI when enabled", () => {
        const { configs } = capture(
            (server, enabled) =>
                registerSavedFoodTools(
                    server,
                    "test-user",
                    capabilities,
                    enabled,
                ),
            true,
        );
        for (const name of ["search_saved_foods", "list_saved_foods"]) {
            expect(configs.get(name)?._meta?.ui?.resourceUri).toBe(
                FOOD_LABEL_URI,
            );
        }
        // Write/ack tools stay text-only.
        for (const name of [
            "save_food",
            "mark_saved_food_used",
            "delete_saved_food",
        ]) {
            expect(configs.get(name)?._meta?.ui).toBeUndefined();
        }
    });

    test("no food tool advertises UI when widget display is disabled", () => {
        const food = capture(
            (server, enabled) =>
                registerFoodTools(server, "test-user", enabled),
            false,
        );
        const saved = capture(
            (server, enabled) =>
                registerSavedFoodTools(
                    server,
                    "test-user",
                    capabilities,
                    enabled,
                ),
            false,
        );
        for (const configs of [food.configs, saved.configs]) {
            for (const config of configs.values()) {
                expect(config._meta?.ui).toBeUndefined();
            }
        }
    });
});

describe("recipe widget bindings (UI meta only)", () => {
    test("recipe read tools and the import review advertise the recipe UI", () => {
        const planning = capture(
            (server, enabled) =>
                registerRecipePlanningTools(
                    server,
                    "test-user",
                    capabilities,
                    enabled,
                ),
            true,
        );
        for (const name of ["search_recipes", "get_recipe"]) {
            expect(planning.configs.get(name)?._meta?.ui?.resourceUri).toBe(
                RECIPE_URI,
            );
        }
        expect([...planning.resources.values()]).toContain(RECIPE_URI);
        // Commit acks stay text-only: the review happens on parse_recipe_url.
        for (const name of ["save_recipe", "update_recipe", "delete_recipe"]) {
            expect(planning.configs.get(name)?._meta?.ui).toBeUndefined();
        }

        const imports = capture(
            (server, enabled) =>
                registerRecipeImportTools(
                    server,
                    "test-user",
                    capabilities,
                    enabled,
                ),
            true,
        );
        expect(
            imports.configs.get("parse_recipe_url")?._meta?.ui?.resourceUri,
        ).toBe(RECIPE_URI);
    });

    test("no recipe tool advertises UI when widget display is disabled", () => {
        const planning = capture(
            (server, enabled) =>
                registerRecipePlanningTools(
                    server,
                    "test-user",
                    capabilities,
                    enabled,
                ),
            false,
        );
        const imports = capture(
            (server, enabled) =>
                registerRecipeImportTools(
                    server,
                    "test-user",
                    capabilities,
                    enabled,
                ),
            false,
        );
        for (const configs of [planning.configs, imports.configs]) {
            for (const config of configs.values()) {
                expect(config._meta?.ui).toBeUndefined();
            }
        }
    });
});

describe("food-label and recipe template contracts", () => {
    test("both widgets build on the Facts grammar and declare fullscreen", async () => {
        for (const key of ["food-label", "recipe"]) {
            const source = await Bun.file(
                `./public/widgets/src/templates/${key}.html`,
            ).text();
            expect(source).toContain("shared/facts.css");
            expect(source).toContain("shared/facts.js");
            expect(source).toContain('displayModes: ["inline", "fullscreen"]');
            const html = await getWidgetHtml(key);
            expect(html).toContain("f-band");
        }
    });

    test("recipe review is a confirm-before-save surface", async () => {
        const source = await Bun.file(
            "./public/widgets/src/templates/recipe.html",
        ).text();
        expect(source).toContain("Nothing is saved until you tap Save recipe.");
        expect(source).toContain("factsStickyBar");
        expect(source).toContain('callTool("save_recipe"');
        expect(source).toContain('"Save recipe"');
    });

    test("assembled food-label and recipe HTML carry no commerce content", async () => {
        for (const key of ["food-label", "recipe"]) {
            const html = await getWidgetHtml(key);
            expect(html).not.toMatch(
                /pricing|premium|upgrade|checkout|subscribe|free trial|billing|\$[0-9]/i,
            );
        }
    });
});
