import { PROTECTED_COMMERCE_TERMS } from "../src/product-config.js";
import { collectToolInventory } from "./openai-tool-inventory.js";

const inventory = await collectToolInventory();
const errors: string[] = [];
const warnings: string[] = [];

// Tools approved to declare openWorldHint: true because they reach the
// public internet or open-ended external entities (OpenAI app-review
// definition): public food databases (USDA FoodData Central, Open Food
// Facts), arbitrary user-supplied recipe URLs, and client-supplied cook
// photo download URLs, which the server fetches without a host allowlist.
// Every other tool is limited to the authenticated user's private Munch
// records and must declare false. Keep this set in sync with the tool
// definitions in src/; the audit enforces it in both directions.
const OPEN_WORLD_TOOLS = new Set([
    "parse_recipe_url",
    "search_foods",
    "get_food_details",
    "lookup_food_barcode",
    "lookup_barcode",
    "start_cook",
    "update_cook",
]);

if (inventory.length === 0)
    errors.push("No exposed MCP tools were discovered.");

for (const tool of inventory) {
    if (!tool.title) errors.push(`${tool.name}: missing title`);
    if (!tool.description) errors.push(`${tool.name}: missing description`);
    if (!tool.hasInputSchema) errors.push(`${tool.name}: missing inputSchema`);
    if (tool.hasStructuredContent && !tool.hasOutputSchema) {
        errors.push(`${tool.name}: structuredContent requires outputSchema`);
    } else if (!tool.hasOutputSchema) {
        warnings.push(
            `${tool.name}: text-only result has no outputSchema; add one if structuredContent is introduced`,
        );
    }
    if (tool.readOnlyHint === null)
        errors.push(`${tool.name}: missing readOnlyHint`);
    if (tool.openWorldHint === null)
        errors.push(`${tool.name}: missing openWorldHint`);
    if (tool.openWorldHint === true && !OPEN_WORLD_TOOLS.has(tool.name)) {
        errors.push(
            `${tool.name}: openWorldHint is true but the tool is not in the approved OPEN_WORLD_TOOLS set; only tools that reach the public internet may declare it`,
        );
    }
    if (tool.openWorldHint === false && OPEN_WORLD_TOOLS.has(tool.name)) {
        errors.push(
            `${tool.name}: openWorldHint must be true because this tool reaches the public internet or open-ended external entities`,
        );
    }
    if (tool.destructiveHint === null)
        errors.push(`${tool.name}: missing destructiveHint`);
    if (tool.idempotentHint === null)
        errors.push(`${tool.name}: missing idempotentHint`);
    if (
        tool.destructiveHint === true &&
        !/\b(confirm|confirmation)\b/i.test(tool.inputExcerpt)
    ) {
        errors.push(
            `${tool.name}: destructive tools must require schema-enforced confirmation`,
        );
    }

    const input = tool.inputExcerpt.toLowerCase();
    if (/\buser_id\b/.test(input)) {
        errors.push(`${tool.name}: inputSchema must not accept user_id`);
    }
    if (
        /\b(password|otp|one_time_code|api_key|secret|access_token|refresh_token|credit_card|ssn)\b/.test(
            input,
        )
    ) {
        errors.push(`${tool.name}: inputSchema appears to solicit credentials`);
    }

    const description = tool.description?.toLowerCase() ?? "";
    for (const term of PROTECTED_COMMERCE_TERMS) {
        if (description.includes(term)) {
            errors.push(`${tool.name}: description contains ${term}`);
        }
    }
}

const submissionFile = Bun.file("chatgpt-app-submission.json");
if (!(await submissionFile.exists())) {
    errors.push("chatgpt-app-submission.json is missing");
} else {
    const submission = (await submissionFile.json()) as {
        app_info?: { subtitle?: string; category?: string };
        tools?: Record<
            string,
            {
                annotations?: Record<string, boolean | null>;
                justifications?: Record<string, string>;
            }
        >;
        test_cases?: unknown[];
        negative_test_cases?: unknown[];
    };
    if ((submission.app_info?.subtitle?.length ?? 31) > 30) {
        errors.push("Submission subtitle exceeds 30 characters");
    }
    if (submission.app_info?.category !== "FOOD") {
        errors.push("Submission category must be FOOD");
    }
    if (submission.test_cases?.length !== 5) {
        errors.push("Submission must contain exactly five positive test cases");
    }
    if (submission.negative_test_cases?.length !== 3) {
        errors.push(
            "Submission must contain exactly three negative test cases",
        );
    }

    const expectedNames = inventory.map((tool) => tool.name).sort();
    const submittedNames = Object.keys(submission.tools ?? {}).sort();
    if (JSON.stringify(expectedNames) !== JSON.stringify(submittedNames)) {
        errors.push(
            "Submission tool inventory does not match exposed MCP tools",
        );
    }

    for (const name of submittedNames) {
        const submitted = submission.tools?.[name];
        for (const hint of [
            "readOnlyHint",
            "openWorldHint",
            "destructiveHint",
        ]) {
            if (typeof submitted?.annotations?.[hint] !== "boolean") {
                errors.push(`${name}: submission is missing ${hint}`);
            }
        }
        for (const justification of [
            "read_only_justification",
            "open_world_justification",
            "destructive_justification",
        ]) {
            if (!submitted?.justifications?.[justification]?.trim()) {
                errors.push(`${name}: submission is missing ${justification}`);
            }
        }
    }
}

if (warnings.length > 0) {
    console.warn("OpenAI submission audit warnings:");
    for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length > 0) {
    console.error("OpenAI submission audit failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(
    `OpenAI submission audit passed for ${inventory.length} exposed tools.`,
);
