import type { Hono } from "hono";
import { SITE } from "./routes.js";

// RFC 9116 security.txt, built in code rather than served as a static file so
// Expires can never go stale. depersonalize.ts blanks the constant between the
// markers; an empty contact makes the route 404, because a file with no
// Contact line is invalid.
/* security-contact:start */
export const SECURITY_CONTACT = "anton@nutrition-mcp.com";
/* security-contact:end */
export const SECURITY_ADVISORY_URL =
    "https://github.com/akutishevsky/nutrition-mcp/security/advisories/new";
export const SECURITY_POLICY_URL =
    "https://github.com/akutishevsky/nutrition-mcp/security/policy";
export const SECURITY_TXT_PATH = "/.well-known/security.txt";

// Expires rolls forward at request time (RFC 9116 recommends less than a year
// ahead), truncated to UTC midnight so the body is stable for a whole day.
export const SECURITY_TXT_TTL_DAYS = 180;

export function securityTxt(opts: {
    contact: string;
    now: Date;
    site?: string;
}): string | null {
    if (!opts.contact) return null;
    // SITE, never the request's host: getBaseUrl trusts x-forwarded-host, and
    // Canonical is what tells a reader where the authentic file lives.
    const site = opts.site ?? SITE;
    const midnight = Date.UTC(
        opts.now.getUTCFullYear(),
        opts.now.getUTCMonth(),
        opts.now.getUTCDate(),
    );
    const expires = new Date(midnight + SECURITY_TXT_TTL_DAYS * 86_400_000)
        .toISOString()
        .replace(/\.\d{3}Z$/, "Z");
    return [
        `Contact: mailto:${opts.contact}`,
        `Contact: ${SECURITY_ADVISORY_URL}`,
        `Expires: ${expires}`,
        `Preferred-Languages: en, uk`,
        `Canonical: ${site}${SECURITY_TXT_PATH}`,
        `Policy: ${SECURITY_POLICY_URL}`,
        "",
    ].join("\n");
}

export function registerSecurityTxtRoute(app: Hono): void {
    app.get(SECURITY_TXT_PATH, (c) => {
        const body = securityTxt({
            contact: SECURITY_CONTACT,
            now: new Date(),
        });
        if (body === null) return c.notFound();
        return c.body(body, 200, {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
        });
    });
    app.get("/security.txt", (c) => c.redirect(SECURITY_TXT_PATH, 301));
}
