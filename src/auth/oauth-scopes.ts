export const MUNCH_OAUTH_SCOPES = [
    "nutrition.read",
    "nutrition.write",
    "offline_access",
] as const;

export const MUNCH_DEFAULT_OAUTH_SCOPES = [
    "nutrition.read",
    "nutrition.write",
    "offline_access",
] as const;

export function munchMcpResourceUrl(baseUrl: string): string {
    return `${baseUrl.replace(/\/$/, "")}/mcp`;
}

export function describeOAuthScope(scope: string): string {
    switch (scope) {
        case "nutrition.read":
            return "Read your Munch nutrition records, goals, saved foods, hydration, and weight data.";
        case "nutrition.write":
            return "Add, update, and delete Munch nutrition records on your behalf.";
        case "offline_access":
            return "Keep Munch connected in ChatGPT using renewable access.";
        default:
            return scope;
    }
}
