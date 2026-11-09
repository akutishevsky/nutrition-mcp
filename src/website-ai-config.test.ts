import { expect, test } from "bun:test";
import {
    DEFAULT_WEBSITE_AI_MODEL,
    openRouterReasoningParam,
    providerErrorDetail,
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

test("reasoning param: mandatory-reasoning Muse models get the floor effort, others keep the disable", () => {
    // meta/muse-* endpoints reject reasoning.enabled=false with HTTP 400
    // ("Reasoning is mandatory for this endpoint and cannot be disabled").
    expect(openRouterReasoningParam("meta/muse-ember")).toEqual({
        reasoning: { effort: "minimal" },
    });
    expect(openRouterReasoningParam("meta/muse-spark-1.3")).toEqual({
        reasoning: { effort: "minimal" },
    });
    expect(openRouterReasoningParam("openai/gpt-test")).toEqual({
        reasoning: { enabled: false },
    });
    expect(openRouterReasoningParam("qwen/qwen3.7-flash")).toEqual({
        reasoning: { enabled: false },
    });
});

test("provider error detail surfaces a bounded excerpt of the error body", async () => {
    const response = new Response(
        JSON.stringify({
            error: {
                message:
                    "Reasoning is mandatory for this endpoint and cannot be disabled.",
                code: 400,
            },
        }),
        { status: 400 },
    );
    const detail = await providerErrorDetail(response);
    expect(detail).toContain("Reasoning is mandatory");
    expect(detail.startsWith(": ")).toBe(true);
    expect(await providerErrorDetail(new Response("", { status: 500 }))).toBe(
        "",
    );
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
