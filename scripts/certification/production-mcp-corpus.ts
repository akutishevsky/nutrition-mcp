#!/usr/bin/env bun

process.env.MUNCH_REVIEWER_SEED_MODE = "true";

import { RECIPE_IMPORT_CORPUS } from "../../src/recipe-import/fixtures/recipe-corpus.js";
import { foodNameMatches } from "./food-name-match.js";
import { certificationAuthIp } from "./auth-ip.js";
import { shardRecipeCorpus } from "./recipe-corpus-sharding.js";

if (!process.env.DATABASE_URL) {
    throw new Error(
        "DATABASE_URL is required for production MCP corpus certification",
    );
}

const input =
    process.env.MUNCH_CERT_BASE_URL?.trim() ||
    process.env.MUNCH_APP_BASE_URL?.trim();
if (!input)
    throw new Error("MUNCH_CERT_BASE_URL or MUNCH_APP_BASE_URL is required");
const baseUrl = new URL(input).origin;
if (!baseUrl.startsWith("https://")) {
    throw new Error("Production MCP corpus certification requires HTTPS");
}

const { Hono } = await import("hono");
const { registerBetterAuthRoutes } = await import("../../src/auth/routes.js");
const { registerDiscoveryRoutes } = await import("../../src/discovery.js");
const { withAuthDatabase, withBillingDatabase, closePlatformDatabase } =
    await import("../../src/platform/database.js");

interface Identity {
    userId: string;
    email: string;
    clientId: string;
    accessToken: string;
}

interface ToolResult {
    content?: Array<{ type?: string; text?: string }>;
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
}

interface PhaseResult {
    phase: string;
    ok: boolean;
    duration_ms: number;
    detail: Record<string, unknown>;
}

const authApp = new Hono();
registerDiscoveryRoutes(authApp);
registerBetterAuthRoutes(authApp);

function cookieFrom(response: Response): string {
    const cookie = response.headers.get("set-cookie")?.split(";", 1)[0];
    if (!cookie) throw new Error("Better Auth issued no session cookie");
    return cookie;
}

function decodeHtml(value: string): string {
    return value
        .replaceAll("&amp;", "&")
        .replaceAll("&quot;", '"')
        .replaceAll("&#39;", "'")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">");
}

function hiddenValue(html: string, name: string): string {
    const match = html.match(
        new RegExp(`name=["']${name}["'][^>]*value=["']([^"']*)["']`),
    );
    if (!match?.[1]) throw new Error(`Consent page omitted ${name}`);
    return decodeHtml(match[1]);
}

async function codeChallenge(verifier: string): Promise<string> {
    const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(verifier),
    );
    return Buffer.from(digest)
        .toString("base64")
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replaceAll("=", "");
}

async function createIdentity(label: string): Promise<Identity> {
    const authIp = certificationAuthIp(label);
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const email = `production-cert-${label}-${suffix}@example.test`;
    const password = `Cert-${suffix}-Password!`;
    const redirectUri = `https://client.example/${label}/callback`;
    const resource = `${baseUrl}/mcp`;

    const signup = await authApp.request(`${baseUrl}/api/auth/sign-up/email`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            origin: baseUrl,
            "x-real-ip": authIp,
        },
        body: JSON.stringify({
            name: `Production cert ${label}`,
            email,
            password,
        }),
    });
    if (!signup.ok) {
        throw new Error(
            `Ephemeral signup failed: ${signup.status} ${await signup.text()}`,
        );
    }

    const userRows = await withAuthDatabase(
        (tx) =>
            tx<Array<{ id: string }>>`
            select id from munch.users where email = ${email} limit 1
        `,
    );
    const userId = userRows[0]?.id;
    if (!userId) throw new Error("Ephemeral signup created no user row");

    await withBillingDatabase(async (tx) => {
        await tx`
            insert into munch.subscriptions (
                user_id, stripe_subscription_id, stripe_price_id, status,
                current_period_start, current_period_end
            ) values (
                ${userId}, ${`production-cert-${suffix}`}, 'production-cert',
                'active', now(), now() + interval '1 day'
            )
        `;
    });

    const signIn = await authApp.request(`${baseUrl}/api/auth/sign-in/email`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            origin: baseUrl,
            "x-real-ip": authIp,
        },
        body: JSON.stringify({
            email,
            password,
            rememberMe: false,
            callbackURL: "/app",
        }),
    });
    if (!signIn.ok) {
        throw new Error(
            `Ephemeral sign-in failed: ${signIn.status} ${await signIn.text()}`,
        );
    }
    const cookie = cookieFrom(signIn);

    const registration = await authApp.request(
        `${baseUrl}/api/auth/oauth2/register`,
        {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-real-ip": authIp,
            },
            body: JSON.stringify({
                client_name: `Munch production cert ${label}`,
                redirect_uris: [redirectUri],
                token_endpoint_auth_method: "none",
                grant_types: ["authorization_code", "refresh_token"],
                response_types: ["code"],
            }),
        },
    );
    if (!registration.ok) {
        throw new Error(
            `Dynamic registration failed: ${registration.status} ${await registration.text()}`,
        );
    }
    const client = (await registration.json()) as { client_id?: string };
    if (!client.client_id)
        throw new Error("Dynamic registration returned no client_id");

    const verifier = `v-${suffix}-${"x".repeat(48)}`;
    const state = `state-${suffix}`;
    const authorize = new URL(`${baseUrl}/api/auth/oauth2/authorize`);
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("client_id", client.client_id);
    authorize.searchParams.set("redirect_uri", redirectUri);
    authorize.searchParams.set(
        "scope",
        "nutrition.read nutrition.write offline_access",
    );
    authorize.searchParams.set("resource", resource);
    authorize.searchParams.set("state", state);
    authorize.searchParams.set("code_challenge", await codeChallenge(verifier));
    authorize.searchParams.set("code_challenge_method", "S256");

    const authorization = await authApp.request(authorize, {
        headers: { cookie, "x-real-ip": authIp },
        redirect: "manual",
    });
    if (authorization.status !== 302) {
        throw new Error(
            `Authorization failed: ${authorization.status} ${await authorization.text()}`,
        );
    }
    const consentLocation = authorization.headers.get("location");
    if (!consentLocation?.includes("/connect/consent")) {
        throw new Error(
            `Authorization did not reach consent: ${consentLocation}`,
        );
    }

    const consentPage = await authApp.request(
        new URL(consentLocation, baseUrl),
        {
            headers: { cookie, "x-real-ip": authIp },
        },
    );
    const consentHtml = await consentPage.text();
    if (consentPage.status !== 200) {
        throw new Error(`Consent page failed: ${consentPage.status}`);
    }
    const consent = await authApp.request(`${baseUrl}/connect/consent`, {
        method: "POST",
        headers: {
            cookie,
            "content-type": "application/x-www-form-urlencoded",
            "x-real-ip": authIp,
        },
        body: new URLSearchParams({
            client_id: hiddenValue(consentHtml, "client_id"),
            scope: hiddenValue(consentHtml, "scope"),
            oauth_query: hiddenValue(consentHtml, "oauth_query"),
            csrf_token: hiddenValue(consentHtml, "csrf_token"),
            decision: "approve",
        }),
        redirect: "manual",
    });
    if (consent.status !== 302 && consent.status !== 303) {
        throw new Error(
            `Consent failed: ${consent.status} ${await consent.text()}`,
        );
    }
    const callbackLocation = consent.headers.get("location");
    if (!callbackLocation) throw new Error("Consent returned no callback");
    const callback = new URL(callbackLocation, redirectUri);
    if (callback.searchParams.get("state") !== state) {
        throw new Error("Consent did not preserve OAuth state");
    }
    const code = callback.searchParams.get("code");
    if (!code) throw new Error("Consent returned no authorization code");

    const token = await authApp.request(`${baseUrl}/api/auth/oauth2/token`, {
        method: "POST",
        headers: {
            "content-type": "application/x-www-form-urlencoded",
            "x-real-ip": authIp,
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: client.client_id,
            redirect_uri: redirectUri,
            code,
            code_verifier: verifier,
            resource,
        }),
    });
    const tokenText = await token.text();
    if (!token.ok) {
        throw new Error(
            `Token exchange failed: ${token.status} ${tokenText.slice(0, 300)}`,
        );
    }
    const tokens = JSON.parse(tokenText) as { access_token?: string };
    if (!tokens.access_token || tokens.access_token.split(".").length !== 3) {
        throw new Error(
            "Token exchange omitted the audience-bound access token",
        );
    }

    return {
        userId,
        email,
        clientId: client.client_id,
        accessToken: tokens.access_token,
    };
}

async function cleanupIdentity(identity: Identity | null): Promise<void> {
    if (!identity) return;
    await withAuthDatabase(async (tx) => {
        await tx`
            delete from munch."oauthClient"
            where "clientId" = ${identity.clientId}
        `;
        await tx`delete from munch.users where id = ${identity.userId}`;
    });
}

function parseJsonRpc(
    text: string,
    contentType: string,
): Record<string, unknown> {
    if (contentType.includes("text/event-stream")) {
        const data = text
            .split(/\r?\n/)
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trim())
            .find(Boolean);
        if (!data)
            throw new Error("MCP SSE response contained no JSON-RPC data");
        return JSON.parse(data) as Record<string, unknown>;
    }
    if (!text.trim())
        throw new Error("MCP response contained no JSON-RPC data");
    return JSON.parse(text) as Record<string, unknown>;
}

function mcpHeaders(identity: Identity): Record<string, string> {
    return {
        authorization: `Bearer ${identity.accessToken}`,
        accept: "application/json, text/event-stream",
        "content-type": "application/json",
        "mcp-protocol-version": "2025-06-18",
    };
}

let rpcId = 1;
async function mcpRequest(
    identity: Identity,
    method: string,
    params: Record<string, unknown>,
) {
    const response = await fetch(`${baseUrl}/mcp`, {
        method: "POST",
        headers: mcpHeaders(identity),
        body: JSON.stringify({ jsonrpc: "2.0", id: rpcId++, method, params }),
    });
    const text = await response.text();
    if (!response.ok) {
        throw new Error(
            `MCP ${method} returned ${response.status}: ${text.slice(0, 500)}`,
        );
    }
    const body = parseJsonRpc(text, response.headers.get("content-type") ?? "");
    if (body.error)
        throw new Error(`MCP ${method} error: ${JSON.stringify(body.error)}`);
    return body;
}

async function initialize(identity: Identity): Promise<Set<string>> {
    const init = await mcpRequest(identity, "initialize", {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "Munch production corpus", version: "1.0.0" },
    });
    const server = (
        init.result as { serverInfo?: { name?: string } } | undefined
    )?.serverInfo?.name;
    if (server !== "Munch")
        throw new Error(`Unexpected MCP server ${String(server)}`);

    const tools = await mcpRequest(identity, "tools/list", {});
    const records = (
        tools.result as { tools?: Array<{ name?: string }> } | undefined
    )?.tools;
    if (!Array.isArray(records) || records.length === 0)
        throw new Error("MCP returned no tools");
    return new Set(
        records
            .map((tool) => tool.name)
            .filter((name): name is string => Boolean(name)),
    );
}

async function callTool(
    identity: Identity,
    name: string,
    args: Record<string, unknown>,
): Promise<{ result: ToolResult; duration_ms: number }> {
    const started = performance.now();
    const body = await mcpRequest(identity, "tools/call", {
        name,
        arguments: args,
    });
    const duration = Number((performance.now() - started).toFixed(2));
    const result = body.result as ToolResult | undefined;
    if (!result) throw new Error(`${name} returned no result`);
    if (result.isError) {
        const text =
            result.content?.map((part) => part.text ?? "").join(" ") ?? "";
        throw new Error(`${name} returned tool error: ${text.slice(0, 500)}`);
    }
    return { result, duration_ms: duration };
}

function p95(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return Number(
        sorted[
            Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)
        ]!.toFixed(2),
    );
}

const FOOD_CASES = [
    ["eggs", ["egg"]],
    ["egg whites", ["egg", "white"]],
    ["milk", ["milk"]],
    ["cheddar cheese", ["cheddar"]],
    ["American cheese", ["american", "cheese"]],
    ["Greek yogurt", ["yogurt"]],
    ["cottage cheese", ["cottage"]],
    ["ground beef", ["beef"]],
    ["90% lean ground beef", ["beef"]],
    ["chicken breast", ["chicken"]],
    ["chicken thigh", ["chicken"]],
    ["turkey bacon", ["turkey", "bacon"]],
    ["pork loin", ["pork"]],
    ["salmon", ["salmon"]],
    ["tuna", ["tuna"]],
    ["white rice", ["rice"]],
    ["brown rice", ["rice"]],
    ["pasta", ["pasta", "spaghetti", "macaroni"]],
    ["oats", ["oat"]],
    ["white bread", ["bread"]],
    ["whole wheat bread", ["bread", "wheat"]],
    ["sourdough bread", ["sourdough", "bread"]],
    ["tortilla", ["tortilla"]],
    ["potato", ["potato"]],
    ["russet potato", ["potato", "russet"]],
    ["sweet potato", ["sweet potato", "sweetpotato"]],
    ["spinach", ["spinach"]],
    ["broccoli", ["broccoli"]],
    ["carrots", ["carrot"]],
    ["onions", ["onion"]],
    ["bell peppers", ["pepper"]],
    ["avocado", ["avocado"]],
    ["banana", ["banana"]],
    ["apple", ["apple"]],
    ["orange", ["orange"]],
    ["strawberries", ["strawberry"]],
    ["blueberries", ["blueberry"]],
    ["olive oil", ["olive"]],
    ["butter", ["butter"]],
    ["peanut butter", ["peanut"]],
    ["almonds", ["almond"]],
    ["black beans", ["black bean", "beans"]],
    ["kidney beans", ["kidney", "beans"]],
    ["chickpeas", ["chickpea", "garbanzo"]],
    ["corn", ["corn"]],
    ["popcorn", ["popcorn"]],
    ["flour", ["flour"]],
    ["sugar", ["sugar"]],
    ["honey", ["honey"]],
] as const;

async function runFoodPhase(): Promise<PhaseResult> {
    let identity: Identity | null = null;
    const started = performance.now();
    try {
        identity = await createIdentity("food");
        const tools = await initialize(identity);
        if (!tools.has("search_foods") || !tools.has("lookup_food_barcode")) {
            throw new Error(
                "Food tools are missing from authenticated MCP discovery",
            );
        }
        const rows: Array<Record<string, unknown>> = [];
        const durations: number[] = [];
        for (const [query, expected] of FOOD_CASES) {
            const call = await callTool(identity, "search_foods", {
                query,
                limit: 5,
            });
            durations.push(call.duration_ms);
            const candidates = call.result.structuredContent?.candidates as
                Array<Record<string, unknown>> | undefined;
            const top = candidates?.[0];
            const name = typeof top?.name === "string" ? top.name : "";
            if (!top || !foodNameMatches(name, expected)) {
                throw new Error(
                    `Food query ${query} returned an implausible top result: ${name || "none"}`,
                );
            }
            rows.push({
                query,
                top_name: name,
                provider: top.provider,
                data_kind: top.data_kind,
                candidate_count: candidates?.length ?? 0,
                duration_ms: call.duration_ms,
            });
        }
        return {
            phase: "foods",
            ok: true,
            duration_ms: Number((performance.now() - started).toFixed(2)),
            detail: { cases: rows.length, p95_ms: p95(durations), rows },
        };
    } finally {
        await cleanupIdentity(identity);
    }
}

async function runBarcodePhase(): Promise<PhaseResult> {
    let identity: Identity | null = null;
    const started = performance.now();
    try {
        identity = await createIdentity("barcode");
        await initialize(identity);
        const barcodes = ["049000028904", "028400090896", "000000000000"];
        const rows: Array<Record<string, unknown>> = [];
        for (const barcode of barcodes) {
            for (let attempt = 1; attempt <= 2; attempt++) {
                const call = await callTool(identity, "lookup_food_barcode", {
                    barcode,
                });
                const candidates = call.result.structuredContent?.candidates as
                    Array<Record<string, unknown>> | undefined;
                if (
                    barcode === "000000000000" &&
                    (candidates?.length ?? 0) !== 0
                ) {
                    throw new Error(
                        "All-zero GTIN unexpectedly resolved to a food",
                    );
                }
                const failures = call.result.structuredContent
                    ?.provider_failures as unknown[] | undefined;
                rows.push({
                    barcode,
                    attempt,
                    duration_ms: call.duration_ms,
                    candidates: candidates?.length ?? 0,
                    top_name:
                        typeof candidates?.[0]?.name === "string"
                            ? candidates[0]!.name
                            : null,
                    provider_failures: failures?.length ?? 0,
                });
            }
        }
        return {
            phase: "barcodes",
            ok: true,
            duration_ms: Number((performance.now() - started).toFixed(2)),
            detail: { rows },
        };
    } finally {
        await cleanupIdentity(identity);
    }
}

const EXTRA_RECIPE_URLS = [
    {
        site: "Half Baked Harvest",
        url: "https://www.halfbakedharvest.com/slow-cooker-coq-au-vin/",
    },
    {
        site: "Allrecipes",
        url: "https://www.allrecipes.com/recipe/20144/banana-banana-bread/",
    },
    {
        site: "Serious Eats",
        url: "https://www.seriouseats.com/the-best-slow-cooked-bolognese-sauce-recipe",
    },
    {
        site: "Sally's Baking Addiction",
        url: "https://sallysbakingaddiction.com/chewy-chocolate-chip-cookies/",
    },
    {
        site: "BBC Good Food",
        url: "https://www.bbcgoodfood.com/recipes/chicken-tikka-masala",
    },
    {
        site: "Simply Recipes",
        url: "https://www.simplyrecipes.com/recipes/banana_bread/",
    },
] as const;

async function runRecipePhase(): Promise<PhaseResult> {
    const identities: Identity[] = [];
    const started = performance.now();
    try {
        const corpus = [
            ...RECIPE_IMPORT_CORPUS.map((entry) => ({
                site: entry.site,
                url: entry.url,
            })),
            ...EXTRA_RECIPE_URLS,
        ];
        const recipeShards = shardRecipeCorpus(corpus);
        const rows: Array<Record<string, unknown>> = [];
        const durations: number[] = [];

        for (const [shardIndex, shard] of recipeShards.entries()) {
            const identity = await createIdentity(`recipes-${shardIndex + 1}`);
            identities.push(identity);
            const tools = await initialize(identity);
            if (!tools.has("parse_recipe_url"))
                throw new Error("parse_recipe_url is missing");

            for (const entry of shard) {
                try {
                    const call = await callTool(identity, "parse_recipe_url", {
                        url: entry.url,
                    });
                    durations.push(call.duration_ms);
                    const draft = call.result.structuredContent?.draft as
                        Record<string, any> | undefined;
                    const recipe = draft?.recipe as
                        Record<string, any> | undefined;
                    const ingredients = Array.isArray(recipe?.ingredients)
                        ? recipe.ingredients
                        : [];
                    if (!recipe?.name || ingredients.length === 0) {
                        throw new Error(
                            "parsed draft omitted recipe name or ingredients",
                        );
                    }
                    const review = Array.isArray(draft?.ingredient_review)
                        ? draft.ingredient_review
                        : [];
                    rows.push({
                        site: entry.site,
                        url: entry.url,
                        shard: shardIndex + 1,
                        ok: true,
                        duration_ms: call.duration_ms,
                        name: recipe.name,
                        ingredients: ingredients.length,
                        requires_review: Boolean(draft?.requires_review),
                        ambiguous_or_unresolved: review.filter(
                            (item: any) =>
                                item?.resolution === "ambiguous" ||
                                item?.resolution === "unresolved",
                        ).length,
                        warnings: Array.isArray(draft?.warnings)
                            ? draft.warnings.length
                            : 0,
                    });
                } catch (error) {
                    rows.push({
                        site: entry.site,
                        url: entry.url,
                        shard: shardIndex + 1,
                        ok: false,
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    });
                }
            }
        }

        const succeeded = rows.filter((row) => row.ok === true).length;
        if (succeeded < 20) {
            throw new Error(
                `Recipe corpus had only ${succeeded}/${rows.length} successful parses`,
            );
        }
        return {
            phase: "recipes",
            ok: true,
            duration_ms: Number((performance.now() - started).toFixed(2)),
            detail: {
                total: rows.length,
                succeeded,
                failed: rows.length - succeeded,
                shards: recipeShards.map((shard) => shard.length),
                p95_ms: p95(durations),
                rows,
            },
        };
    } finally {
        for (const identity of identities.reverse()) {
            await cleanupIdentity(identity);
        }
    }
}

async function runMealRecipePhase(): Promise<PhaseResult> {
    let identity: Identity | null = null;
    const started = performance.now();
    try {
        identity = await createIdentity("meal-recipe");
        const tools = await initialize(identity);
        for (const required of [
            "prepare_meal_review",
            "resolve_meal_review",
            "confirm_meal_draft",
            "save_meal_as_recipe",
        ]) {
            if (!tools.has(required))
                throw new Error(`MCP discovery omitted ${required}`);
        }

        const originalItem = {
            name: "Cooked ground beef",
            quantity: 1,
            portion_label: "6 oz cooked",
            gram_weight: 170,
            nutrients: { calories: 390, protein_g: 44, carbs_g: 0, fat_g: 23 },
            source_type: "model_estimate",
            provider: "production certification",
            confidence: 0.72,
            assumptions: ["Lean percentage unknown"],
            source_snapshot: { certification: true },
        };
        const prepared = await callTool(identity, "prepare_meal_review", {
            source_mode: "text",
            meal_type: "dinner",
            description: "Production certification ground beef bowl",
            request_id: crypto.randomUUID(),
            items: [originalItem],
            questions: [
                {
                    question_key: "ground_beef_lean_percent",
                    prompt: "What lean percentage was the ground beef?",
                    impact_score: 90,
                    item_position: 0,
                },
            ],
        });
        const first = prepared.result.structuredContent?.review as
            Record<string, any> | undefined;
        const draftId = first?.id as string | undefined;
        const version = first?.version as number | undefined;
        const question = Array.isArray(first?.questions)
            ? first.questions.find((value: any) => value?.status === "open")
            : null;
        if (!draftId || !version || !question?.id)
            throw new Error("prepare_meal_review returned incomplete state");

        const reconciledItem = {
            ...originalItem,
            nutrients: { calories: 360, protein_g: 45, carbs_g: 0, fat_g: 19 },
            assumptions: [
                "90% lean ground beef; cooking fat not independently verified",
            ],
            source_snapshot: {
                certification: true,
                established_facts: { lean_percentage: 90 },
            },
        };
        const resolved = await callTool(identity, "resolve_meal_review", {
            draft_id: draftId,
            expected_version: version,
            items: [reconciledItem],
            answers: [{ question_id: question.id, answer: "90% lean" }],
            questions: [],
        });
        const second = resolved.result.structuredContent?.review as
            Record<string, any> | undefined;
        if (second?.status !== "awaiting_confirmation") {
            throw new Error(
                `Resolved review status was ${String(second?.status)}`,
            );
        }
        const itemAssumptions = Array.isArray(second?.items?.[0]?.assumptions)
            ? second.items[0].assumptions.join(" ").toLowerCase()
            : "";
        if (itemAssumptions.includes("unknown")) {
            throw new Error(
                "Resolved meal retained the stale lean-percentage assumption",
            );
        }

        const confirmed = await callTool(identity, "confirm_meal_draft", {
            draft_id: draftId,
            expected_version: second.version,
            confirmed: true,
        });
        const third = confirmed.result.structuredContent?.draft as
            Record<string, any> | undefined;
        const mealId = third?.confirmed_meal_id as string | undefined;
        if (!mealId) throw new Error("Confirmed draft returned no meal id");

        const recipeName = `Production certification recipe ${draftId.slice(0, 8)}`;
        const save1 = await callTool(identity, "save_meal_as_recipe", {
            meal_id: mealId,
            scope: "personal",
            name: recipeName,
            servings: 1,
        });
        const recipe1 = save1.result.structuredContent?.recipe as
            Record<string, any> | undefined;
        if (!recipe1?.recipeId || recipe1?.sourceMealId !== mealId) {
            throw new Error(
                "First meal-to-recipe conversion lost source meal lineage",
            );
        }
        const save2 = await callTool(identity, "save_meal_as_recipe", {
            meal_id: mealId,
            scope: "personal",
            name: recipeName,
            servings: 1,
        });
        const recipe2 = save2.result.structuredContent?.recipe as
            Record<string, any> | undefined;
        if (
            recipe2?.recipeId !== recipe1.recipeId ||
            recipe2?.deduplicated !== true
        ) {
            throw new Error(
                "Repeated meal-to-recipe conversion created or reported a duplicate recipe",
            );
        }

        return {
            phase: "meal_review_and_recipe",
            ok: true,
            duration_ms: Number((performance.now() - started).toFixed(2)),
            detail: {
                prepared_ms: prepared.duration_ms,
                resolved_ms: resolved.duration_ms,
                confirmed_ms: confirmed.duration_ms,
                save_first_ms: save1.duration_ms,
                save_repeat_ms: save2.duration_ms,
                deduplicated: true,
                source_lineage_preserved: true,
                stale_assumption_cleared: true,
            },
        };
    } finally {
        await cleanupIdentity(identity);
    }
}

const startedAt = new Date();
const phases: PhaseResult[] = [];
try {
    phases.push(await runFoodPhase());
    phases.push(await runBarcodePhase());
    phases.push(await runRecipePhase());
    phases.push(await runMealRecipePhase());
    const report = {
        ok: phases.every((phase) => phase.ok),
        base_url: baseUrl,
        started_at: startedAt.toISOString(),
        completed_at: new Date().toISOString(),
        phases,
    };
    console.log(`[production_mcp_corpus] ${JSON.stringify(report)}`);
} finally {
    await closePlatformDatabase();
}
