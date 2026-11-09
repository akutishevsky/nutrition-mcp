import {
    assertCapabilityManifest,
    CAPABILITY_MANIFEST,
    MCP_TOOL_CAPABILITY_MAP,
} from "../src/capability-manifest.js";
import { MCP_INFRASTRUCTURE_TOOLS } from "../src/mcp-infrastructure.js";
import {
    CONDITIONAL_PREMIUM_MCP_TOOL_CAPABILITY_MAP,
    INVENTORY_CAPABILITY_CONTRACTS,
} from "../src/inventory/capabilities.js";
import { assertMobileCapabilityContracts } from "../src/mobile/capabilities.js";

const errors = [
    ...assertCapabilityManifest(),
    ...assertMobileCapabilityContracts(),
];
const discovered = new Set<string>();
const sourceFiles = new Bun.Glob("src/**/*.ts");
const conditionalToolMap =
    CONDITIONAL_PREMIUM_MCP_TOOL_CAPABILITY_MAP as Readonly<
        Record<string, string>
    >;

for (const contract of INVENTORY_CAPABILITY_CONTRACTS) {
    if (contract.mcp.length === 0 || contract.web.length === 0) {
        errors.push(
            `${contract.id}: premium Pantry capability must have MCP and web coverage`,
        );
    }
}

for await (const path of sourceFiles.scan({ cwd: "." })) {
    const source = await Bun.file(path).text();
    const pattern =
        /(?:registerTool|register)\(\s*(?:"([^"]+)"|'([^']+)'|`([^`]+)`)/gs;
    for (const match of source.matchAll(pattern)) {
        const toolName = match[1] || match[2] || match[3];
        if (toolName) discovered.add(toolName);
    }
}

for (const toolName of discovered) {
    if (
        !(toolName in MCP_TOOL_CAPABILITY_MAP) &&
        !(toolName in conditionalToolMap) &&
        !MCP_INFRASTRUCTURE_TOOLS.has(toolName)
    ) {
        errors.push(
            `MCP tool ${toolName} is registered in source but has no capability contract or infrastructure declaration`,
        );
    }
}

for (const toolName of Object.keys(MCP_TOOL_CAPABILITY_MAP)) {
    if (!discovered.has(toolName)) {
        errors.push(
            `Capability contract lists ${toolName}, but no source registration was found`,
        );
    }
}

for (const [toolName, capabilityId] of Object.entries(conditionalToolMap)) {
    if (!discovered.has(toolName)) {
        errors.push(
            `Conditional premium capability lists ${toolName}, but no source registration was found`,
        );
    }
    if (
        !INVENTORY_CAPABILITY_CONTRACTS.some(
            (contract) => contract.id === capabilityId,
        )
    ) {
        errors.push(
            `Conditional premium tool ${toolName} maps to unknown capability ${capabilityId}`,
        );
    }
}

for (const toolName of MCP_INFRASTRUCTURE_TOOLS) {
    if (!discovered.has(toolName)) {
        errors.push(
            `MCP infrastructure lists ${toolName}, but no source registration was found`,
        );
    }
    if (toolName in MCP_TOOL_CAPABILITY_MAP || toolName in conditionalToolMap) {
        errors.push(
            `MCP infrastructure tool ${toolName} must not also masquerade as an outcome capability`,
        );
    }
}

if (errors.length > 0) {
    console.error("Cross-surface capability manifest check failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

const appComplete = CAPABILITY_MANIFEST.filter(
    (capability) => capability.app.coverage === "complete",
).length;
const appExceptions = CAPABILITY_MANIFEST.filter(
    (capability) => capability.app.coverage === "missing",
).length;
const appPartial = CAPABILITY_MANIFEST.filter(
    (capability) => capability.app.coverage === "partial",
).length;
console.log(
    `Cross-surface capability manifest passed: ${discovered.size} MCP tools (${MCP_INFRASTRUCTURE_TOOLS.size} infrastructure, ${Object.keys(conditionalToolMap).length} conditional premium), ${new Set([...Object.values(MCP_TOOL_CAPABILITY_MAP), ...Object.values(conditionalToolMap)]).size} outcome capabilities, Android/iOS parity declared, app channel declared on all ${CAPABILITY_MANIFEST.length} rows (${appComplete} complete, ${appPartial} partial with documented gap, ${appExceptions} explicit website-only exceptions).`,
);
