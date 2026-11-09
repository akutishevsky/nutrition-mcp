import { expect, test } from "bun:test";
import {
    DEFAULT_WEBSITE_AI_MODEL,
    websiteAiModel,
    websiteGuidanceAiConfig,
} from "./website-ai-config.js";

test("website AI uses one shared model variable", () => {
    expect(websiteAiModel({})).toBe(DEFAULT_WEBSITE_AI_MODEL);
    expect(DEFAULT_WEBSITE_AI_MODEL).toBe("meta/muse-ember");
    expect(websiteAiModel({ MUNCH_AI_MODEL: "custom/model" })).toBe(
        "custom/model",
    );
    expect(
        websiteAiModel({
            MUNCH_RECIPE_IMPORT_AI_MODEL: "legacy/recipe",
            MUNCH_PANTRY_VISION_MODEL: "legacy/vision",
            MUNCH_PANTRY_PLANNING_MODEL: "legacy/planning",
        }),
    ).toBe(DEFAULT_WEBSITE_AI_MODEL);
});

test("guidance AI defaults to Ember, honours the shared override, and keeps its kill switch", () => {
    expect(
        websiteGuidanceAiConfig({ OPENROUTER_API_KEY: "test-key" })?.model,
    ).toBe("meta/muse-ember");
    expect(
        websiteGuidanceAiConfig({
            OPENROUTER_API_KEY: "test-key",
            MUNCH_AI_MODEL: "custom/model",
        })?.model,
    ).toBe("custom/model");
    expect(
        websiteGuidanceAiConfig({
            OPENROUTER_API_KEY: "test-key",
            MUNCH_GUIDANCE_AI_ENABLED: "false",
        }),
    ).toBeNull();
    expect(websiteGuidanceAiConfig({})).toBeNull();
});
