import { configuredSite } from "./health-sync-routes.js";
import { SITE } from "./routes.js";

/**
 * Rewrites hardcoded canonical/placeholder site origins in generated public
 * pages (`public/*.html`, `sitemap.xml`, `robots.txt`, `llms.txt`) to match
 * `PUBLIC_BASE_URL` when self-hosted. Leaves email addresses (`@nutrition-mcp.com`)
 * untouched and returns `text` verbatim when `site` is the default `SITE`.
 */
export function rewritePublicSite(
    text: string,
    site: string = configuredSite(),
): string {
    if (site === SITE) return text;
    const host = new URL(site).host;
    return text
        .replace(/https:\/\/(?:nutrition-mcp\.com|your-domain\.com)/g, site)
        .replace(/(?<!@)(?:nutrition-mcp\.com|your-domain\.com)/g, host);
}

/** Reads a generated public text/HTML file with `PUBLIC_BASE_URL` applied. */
export async function readPublicText(
    filePath: string,
    site: string = configuredSite(),
): Promise<string> {
    return rewritePublicSite(await Bun.file(filePath).text(), site);
}
