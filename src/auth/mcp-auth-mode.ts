export type McpAuthMode = "better-auth" | "railway" | "inherited";

export function resolveMcpAuthMode(
    betterAuthEnabled: boolean,
    railwayAuthEnabled: boolean,
): McpAuthMode {
    if (betterAuthEnabled) return "better-auth";
    if (railwayAuthEnabled) return "railway";
    return "inherited";
}
