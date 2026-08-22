// Formatting for the MCP client's self-reported name and version.
//
// The value is client-supplied and lands in two places that both care: the
// access log in src/index.ts, where a raw value could carry newlines and forge
// "[req] …" entries (the same injection surface as the SDK's error messages),
// and the tool_analytics.client_name column, which is a varchar the caller
// should not be able to overrun. One implementation so the two cannot drift —
// a name that reads one way in the log and another in the table would make the
// legacy-retirement counts impossible to reconcile.
//
// It lives in its own module rather than in mcp.ts because analytics.ts needs it
// too, and analytics.ts is imported BY mcp.ts — putting it there would be a
// cycle.

const MAX_FIELD_LENGTH = 40;

function clean(value: string): string {
    return (
        value
            // Non-printables become "_" rather than vanishing: a deleted newline
            // silently welds together the text on either side of it, hiding what
            // the client actually sent.
            .replace(/[^\x20-\x7E]/g, "_")
            // No whitespace, so a value can never fake a field break in the
            // space-separated access line.
            .replace(/\s+/g, "_")
            .slice(0, MAX_FIELD_LENGTH)
    );
}

/**
 * Render an MCP client's identity as `name/version`, or `name` alone when it
 * reported no version. Returns undefined when there is no usable name — which
 * is the normal case on the 2025-era leg, where only `initialize` carries
 * clientInfo and every other request builds a fresh server that never saw it.
 */
export function formatClientId(
    info: { name?: string; version?: string } | undefined,
): string | undefined {
    const name = info?.name ? clean(info.name) : "";
    if (!name) return undefined;
    const version = info?.version ? clean(info.version) : "";
    return version ? `${name}/${version}` : name;
}
