#!/usr/bin/env bun

import { appendFileSync } from "node:fs";
import { foodCatalogConfig } from "../src/food-providers/catalog-config.js";
import { FoodCatalogRepository } from "../src/food-providers/catalog-repository.js";
import type { FoodCandidate } from "../src/food-providers/types.js";

const apiKey = process.env.OPENROUTER_API_KEY?.trim();
if (!apiKey) {
    throw new Error(
        "OPENROUTER_API_KEY is required for Luna food adjudication",
    );
}

const model =
    process.env.MUNCH_FOOD_ADJUDICATION_MODEL?.trim() || "openai/gpt-5.6-luna-pro";
const repository = new FoodCatalogRepository(foodCatalogConfig());
const MAX_SEARCHES = 5;

interface CaseDefinition {
    id: string;
    userPhrase: string;
    context: string;
    required: string[];
    requiredAny?: string[];
    forbidden: string[];
}

interface PreparedCandidate {
    index: number;
    name: string;
    brand: string | null;
    data_kind: string;
    confidence: number;
    portions: string[];
    calories_per_100g: number | null;
}

interface PreparedSearch {
    search_query: string;
    candidates: PreparedCandidate[];
}

interface AgentDecision {
    decision: "select" | "refine";
    selected_index: number;
    search_query: string;
    confidence: number;
}

const CASES: CaseDefinition[] = [
    {
        id: "bacon-strips",
        userPhrase: "bacon",
        context: "I ate 3 strips of bacon with breakfast.",
        required: ["bacon"],
        forbidden: ["bit", "canadian", "meatless", "beef", "turkey"],
    },
    {
        id: "bacon-bits",
        userPhrase: "bacon",
        context: "I added 2 tablespoons of bacon bits to a salad.",
        required: ["bacon", "bit"],
        forbidden: ["meatless"],
    },
    {
        id: "diced-onion",
        userPhrase: "onion",
        context: "The recipe used 1 medium onion, diced.",
        required: ["onion"],
        forbidden: [
            "gravy",
            "mix",
            "ring",
            "powder",
            "dip",
            "bread",
            "soup",
            "green",
            "red",
            "white",
            "yellow",
            "sweet",
        ],
    },
    {
        id: "white-rice",
        userPhrase: "white rice",
        context: "I ate 1 cup of cooked white rice.",
        required: ["rice", "white", "cooked"],
        forbidden: ["flour", "bean", "pea", "corn", "wild"],
    },
    {
        id: "plain-walnuts",
        userPhrase: "walnuts",
        context: "I ate 1 ounce of plain walnuts as a snack.",
        required: ["walnut"],
        forbidden: ["glazed", "honey", "oil"],
    },
    {
        id: "salmon-fillet",
        userPhrase: "salmon",
        context: "Dinner included a 6 ounce grilled salmon fillet.",
        required: ["salmon", "grilled"],
        forbidden: ["salad", "sandwich"],
    },
    {
        id: "blueberries",
        userPhrase: "blueberries",
        context: "I ate 1 cup of fresh blueberries.",
        required: ["blueberr"],
        forbidden: ["juice", "milk", "dried", "frozen", "canned"],
    },
    {
        id: "cooked-spaghetti",
        userPhrase: "spaghetti",
        context:
            "I ate 2 cups of cooked spaghetti noodles with sauce logged separately.",
        required: ["cooked"],
        requiredAny: ["spaghetti", "noodle", "pasta"],
        forbidden: [
            "spinach",
            "squash",
            "meatball",
            "sauce",
            "dry",
            "protein fortified",
            "rice noodle",
            "egg noodle",
            "whole grain",
        ],
    },
    {
        id: "whole-egg",
        userPhrase: "egg",
        context: "Breakfast included 1 large whole egg.",
        required: ["egg", "whole"],
        forbidden: ["yolk", "dried", "bread", "burrito", "soup"],
    },
    {
        id: "chicken-thigh",
        userPhrase: "chicken thigh",
        context: "I ate one grilled boneless skinless chicken thigh.",
        required: ["chicken", "thigh", "grilled"],
        forbidden: [
            "breaded",
            "reheated",
            "coated",
            "skin eaten",
            "with sauce",
            "raw",
            "stewed",
            "sauteed",
            "rotisserie",
        ],
    },
    {
        id: "two-percent-milk",
        userPhrase: "2% milk",
        context: "I drank 1 cup of 2% dairy milk.",
        required: ["milk", "2%"],
        forbidden: [
            "yogurt",
            "rennin",
            "mix",
            "chocolate",
            "strawberry",
            "evaporated",
            "lactose free",
        ],
    },
    {
        id: "skim-milk",
        userPhrase: "skim milk",
        context: "I used 1 cup of skim milk in the recipe.",
        required: ["milk"],
        requiredAny: ["skim", "fat free", "nonfat"],
        forbidden: [
            "yogurt",
            "chocolate",
            "strawberry",
            "cheese",
            "evaporated",
            "lactose free",
        ],
    },
];

function normalized(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9%]+/g, " ")
        .trim();
}

function candidatePasses(
    definition: CaseDefinition,
    candidate: PreparedCandidate,
): boolean {
    const name = normalized(candidate.name);
    const hasRequired = definition.required.every((token) =>
        name.includes(normalized(token)),
    );
    const hasRequiredAny =
        !definition.requiredAny?.length ||
        definition.requiredAny.some((token) =>
            name.includes(normalized(token)),
        );
    const avoidsForbidden = definition.forbidden.every(
        (token) => !name.includes(normalized(token)),
    );
    return hasRequired && hasRequiredAny && avoidsForbidden;
}

async function openRouterJson<T>(
    title: string,
    system: string,
    user: unknown,
    schemaName: string,
    schema: Record<string, unknown>,
): Promise<T> {
    const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            method: "POST",
            headers: {
                authorization: `Bearer ${apiKey}`,
                "content-type": "application/json",
                "HTTP-Referer": "https://munch.business",
                "X-Title": title,
            },
            body: JSON.stringify({
                model,
                temperature: 0,
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: JSON.stringify(user) },
                ],
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: schemaName,
                        strict: true,
                        schema,
                    },
                },
            }),
            signal: AbortSignal.timeout(60_000),
        },
    );
    if (!response.ok) {
        throw new Error(
            `OpenRouter ${schemaName} failed: ${response.status} ${(await response.text()).slice(0, 1000)}`,
        );
    }
    const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content)
        throw new Error(`OpenRouter returned no ${schemaName} content`);
    return JSON.parse(content) as T;
}

function prepareCandidates(candidates: FoodCandidate[]): PreparedCandidate[] {
    return candidates.map((candidate, index) => ({
        index,
        name: candidate.name,
        brand: candidate.brand ?? null,
        data_kind: candidate.dataKind,
        confidence: candidate.confidence,
        portions: candidate.portions
            .slice(0, 5)
            .map((portion) => portion.label),
        calories_per_100g: candidate.nutrientsPer100g?.calories ?? null,
    }));
}

async function retrieve(searchQuery: string): Promise<PreparedSearch> {
    const hits = await repository.searchLocal(searchQuery, 10);
    return {
        search_query: searchQuery,
        candidates: prepareCandidates(hits.map((hit) => hit.candidate)),
    };
}

async function askLunaToDecide(
    definition: CaseDefinition,
    searches: PreparedSearch[],
    current: PreparedSearch,
): Promise<AgentDecision> {
    return openRouterJson<AgentDecision>(
        "Munch food search agent CI",
        "You control factual food lookup for Munch. The first search uses the user's natural food phrase so you can inspect broad database results before narrowing anything. Decide whether the CURRENT candidates contain a defensible nutritional match for the full user context or whether another search is needed. Quantity and unit words such as strips, tablespoons, cups, and ounces are evidence about food form and portion; they are not automatically database search terms. Candidate ordering is retrieval relevance, not correctness. Database labels often omit conversational cut, shape, serving-size, or plain/unmodified wording, so do not require the candidate name to literally repeat words such as diced, medium, fillet, plain, fresh, boneless, or skinless when the candidate is otherwise the same base food and does not contradict the user's facts. Select semantically equivalent generic database wording when it is the closest factual nutritional match. Select only when the candidate satisfies explicit preparation/form facts and does not require an unsupported brand, ingredient, species, subtype, or preparation. For an unqualified common food, do not silently substitute a named alternative species or specialty subtype just because it is available; refine toward the conventional or generic form instead. If a candidate directly conflicts with an explicit fact, refine rather than accepting the conflict. A conservative generic candidate is preferable to a more specific candidate that invents an unmentioned modifier. If earlier refinements have not produced a better exact label, choose the least-modified nutritionally equivalent base-food candidate rather than continuing to chase wording. When decision is select, selected_index must identify the CURRENT candidate and search_query must be an empty string. When decision is refine, provide a concise improved food query, set selected_index to 0 as a placeholder, and do not mechanically copy every serving-unit word. Never invent facts absent from the user's context.",
        {
            user_phrase: definition.userPhrase,
            context: definition.context,
            previous_searches: searches.map((search) => ({
                search_query: search.search_query,
                candidate_names: search.candidates.map(
                    (candidate) => candidate.name,
                ),
            })),
            current_search: current,
        },
        "munch_food_agent_decision",
        {
            type: "object",
            additionalProperties: false,
            required: [
                "decision",
                "selected_index",
                "search_query",
                "confidence",
            ],
            properties: {
                decision: { type: "string", enum: ["select", "refine"] },
                selected_index: { type: "integer", minimum: 0 },
                search_query: { type: "string", maxLength: 120 },
                confidence: { type: "number", minimum: 0, maximum: 1 },
            },
        },
    );
}

async function runLunaAgent(definition: CaseDefinition): Promise<{
    searches: PreparedSearch[];
    candidates: PreparedCandidate[];
    selectedIndex: number;
    confidence: number;
}> {
    const searches: PreparedSearch[] = [];
    let query = definition.userPhrase;

    for (let attempt = 0; attempt < MAX_SEARCHES; attempt += 1) {
        const current = await retrieve(query);
        searches.push(current);
        const decision = await askLunaToDecide(definition, searches, current);

        if (decision.decision === "select") {
            const selected = current.candidates[decision.selected_index];
            if (!selected) {
                throw new Error(
                    `Luna selected invalid index ${decision.selected_index} for ${definition.id} (candidate count ${current.candidates.length})`,
                );
            }
            return {
                searches,
                candidates: current.candidates,
                selectedIndex: decision.selected_index,
                confidence: decision.confidence,
            };
        }

        if (attempt === MAX_SEARCHES - 1) {
            const trace = searches
                .map(
                    (search) =>
                        `${search.search_query} => ${search.candidates
                            .map((candidate) => candidate.name)
                            .join(" | ")}`,
                )
                .join(" || ");
            throw new Error(
                `Luna still requested refinement after ${searches.length} searches for ${definition.id}: ${trace}`,
            );
        }

        const refined = decision.search_query.trim();
        if (!refined) {
            throw new Error(
                `Luna requested refinement without a query for ${definition.id}`,
            );
        }
        if (normalized(refined) === normalized(query)) {
            throw new Error(
                `Luna repeated the same search query for ${definition.id}: ${refined}`,
            );
        }
        query = refined;
    }

    throw new Error(`Luna agent loop exhausted for ${definition.id}`);
}

const results: Array<Record<string, unknown>> = [];
const failures: string[] = [];

for (const definition of CASES) {
    const startedAt = performance.now();
    try {
        const agent = await runLunaAgent(definition);
        const chosen = agent.candidates[agent.selectedIndex];
        if (!chosen) {
            throw new Error(
                `selected invalid index ${agent.selectedIndex} (candidate count ${agent.candidates.length})`,
            );
        }
        const ok = candidatePasses(definition, chosen);
        results.push({
            id: definition.id,
            user_phrase: definition.userPhrase,
            context: definition.context,
            search_queries: agent.searches.map((search) => search.search_query),
            selected_index: agent.selectedIndex,
            selected_name: chosen.name,
            confidence: agent.confidence,
            duration_ms: Number((performance.now() - startedAt).toFixed(2)),
            ok,
            candidate_names: agent.candidates.map(
                (candidate) => candidate.name,
            ),
        });
        if (!ok) failures.push(`${definition.id}: ${chosen.name}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        results.push({
            id: definition.id,
            user_phrase: definition.userPhrase,
            context: definition.context,
            duration_ms: Number((performance.now() - startedAt).toFixed(2)),
            ok: false,
            error: message,
        });
        failures.push(`${definition.id}: ${message}`);
    }
}

const passed = results.filter((result) => result.ok === true).length;
const report = { model, cases: results.length, passed, failures, results };
console.log(
    `[food_ai_adjudication] ${JSON.stringify({ model, cases: results.length, passed, failed: failures.length })}`,
);
console.log(JSON.stringify(report, null, 2));

const summary = process.env.GITHUB_STEP_SUMMARY;
if (summary) {
    appendFileSync(
        summary,
        `\n### Luna food search + candidate adjudication\n\nModel: \`${model}\`\n\nPassed: **${passed}/${results.length}** contextual agent loops.\n`,
    );
}

if (failures.length > 0) {
    throw new Error(
        `Luna food agent loop failed ${failures.length}/${results.length} cases: ${failures.join("; ")}`,
    );
}
