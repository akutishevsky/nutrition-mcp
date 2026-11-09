import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Label rule (S3 hardening): the source label for `model_estimate`
 * items reads exactly "Model estimate" everywhere the item source
 * prints — the web/app draft review (public/app.js), the logged-meal
 * widget, and the MCP meal-review widget — while provider labels stay
 * exactly USDA / Open Food Facts / local catalog wording as before.
 */
const ROOT = join(import.meta.dir, "..", "..");

function read(relative: string): string {
    return readFileSync(join(ROOT, relative), "utf8");
}

describe("model_estimate source label is exactly 'Model estimate' at every render site", () => {
    test("web/app source labels (public/app.js, draft review + logged rows share this map)", () => {
        const appJs = read("public/app.js");
        expect(appJs).toContain('model_estimate: "Model estimate"');
        expect(appJs).not.toContain('model_estimate: "Estimated"');
        // Provider labels unchanged.
        expect(appJs).toContain('usda: "USDA"');
        expect(appJs).toContain('open_food_facts: "Open Food Facts"');
    });

    test("logged-meal widget (public/widgets meal-logged)", () => {
        const logged = read("public/widgets/src/templates/meal-logged.html");
        expect(logged).toContain('if (item.source_type === "model_estimate")');
        expect(logged).toContain('return "Model estimate"');
        expect(logged).not.toContain('return "Estimated"');
        expect(logged).toContain('return "USDA"');
        expect(logged).toContain('return "Open Food Facts"');
    });

    test("MCP meal-review widget already prints 'Model estimate' and keeps provider labels", () => {
        const review = read("public/widgets/src/templates/meal-review.html");
        expect(review).toContain('return "Model estimate"');
        expect(review).toContain('return "USDA match"');
        expect(review).toContain('return "Package database"');
    });
});
