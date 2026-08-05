export type McpAuthMode = "better-auth" | "railway";

export function resolveMcpAuthMode(
    betterAuthEnabled: boolean,
    railwayAuthEnabled: boolean,
): McpAuthMode {
    if (betterAuthEnabled) return "better-auth";
    if (railwayAuthEnabled) return "railway";
    throw new Error("Munch requires Better Auth or Railway OAuth");
}
