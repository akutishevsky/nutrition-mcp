// Pure validation for the OAuth 2.0 authorization flow: redirect URIs, PKCE and
// RFC 8707 resource indicators. No Supabase, no Hono, no I/O — everything here
// is a function of its arguments, so it unit-tests without mocks and both
// /register and /authorize can apply the exact same rules (D3 in the brief).
//
// The redirect rules exist because /authorize used to deliver an authorization
// code to any redirect_uri it was handed (#148). Registration binds a client to
// its redirect URIs; these functions decide which URIs may be registered and
// whether a presented one matches.
import { createHash } from "node:crypto";
import { mcpResourceUrl } from "./discovery.js";

// Hosts the consent notice treats as a recognised assistant. Anything else
// still works (registration is open), but the login page warns the user that
// the code is going somewhere unfamiliar. Exact hostnames, never suffixes:
// a suffix test on "claude.ai" also admits "claude.ai.evil.example".
export const KNOWN_CLIENT_HOSTS: ReadonlySet<string> = new Set([
    "claude.ai",
    "claude.com",
    "chatgpt.com",
]);

export type RedirectKind = "https" | "loopback" | "custom";

export type ParsedRedirect =
    { ok: true; kind: RedirectKind; url: URL } | { ok: false; reason: string };

export const REDIRECT_URI_MAX_LENGTH = 2000;

// Schemes that may never be registered as a "private-use" custom scheme: either
// they execute or render content in the browser (javascript, data, vbscript,
// blob, about), read local files (file), or are network schemes that are not a
// callback into an app (ftp, ws, wss). http/https are here because they have
// their own, stricter rules above the custom-scheme branch — an http URI must
// never fall through to "custom" and dodge the loopback-only restriction.
//
// The second group are browser launchers and wrapper schemes: each one hands
// its payload to a browser as a web URL ("x-safari-https://evil.example/cb"
// opens https://evil.example/cb in Safari on iOS; "microsoft-edge:https://…"
// does the same in Edge), so registering one is registering an arbitrary web
// origin while dodging the https host rules. A denylist can never be complete,
// which is why the consent notice also shows a custom URI's full path rather
// than just its scheme (redirectDisplay).
export const DENIED_SCHEMES: ReadonlySet<string> = new Set([
    "javascript",
    "data",
    "file",
    "vbscript",
    "blob",
    "about",
    "ftp",
    "ws",
    "wss",
    "http",
    "https",
    "x-safari-http",
    "x-safari-https",
    "googlechrome",
    "googlechromes",
    "microsoft-edge",
    "microsoft-edge-http",
    "microsoft-edge-https",
    "firefox",
    "opera-http",
    "opera-https",
    "brave",
    "intent",
    "view-source",
    "jar",
    "filesystem",
    "feed",
    "chrome",
    "chrome-extension",
    "moz-extension",
    "resource",
]);

// The only hosts an http: redirect may name, compared against the host as it
// is literally written in the URI. They are deliberately not interchangeable:
// a client registered on localhost does not match 127.0.0.1.
const LOOPBACK_HOSTS: ReadonlySet<string> = new Set([
    "localhost",
    "127.0.0.1",
    "[::1]",
]);

// RFC 3986's character set: unreserved, reserved and "%". Anything outside it —
// whitespace, control characters, backslashes, quotes, non-ASCII — is refused
// before the string reaches the WHATWG parser, because that parser silently
// rewrites exactly those characters (strips tabs and newlines, so
// "java\tscript:" parses as javascript:; turns "\" into "/" in special schemes,
// so "http://localhost\@evil.example" parses as host localhost). A redirect URI
// is matched by exact string equality, so the string that is registered has to
// be the string a browser will actually follow.
const URI_CHARS = /^[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+$/;
const BAD_PERCENT = /%(?![0-9A-Fa-f]{2})/;
const SCHEME = /^([A-Za-z][A-Za-z0-9+.-]*):/;
// An https host has to be something a browser can resolve and a CA can issue a
// certificate for: dot-separated LDH labels (IDNs arrive as punycode, since the
// canonical-form check requires the raw host to equal URL.hostname), or a
// bracketed IPv6 literal. URI_CHARS alone still admits sub-delims such as "$",
// "'" and "&" in a host, which can never resolve but do end up on the consent
// page.
const HTTPS_HOST =
    /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*|\[[0-9a-f:.]+\])$/;

// A loopback redirect split on the raw string. Matching the authority against
// literal host names — rather than trusting URL.hostname — is what keeps
// "http://127.1", "http://0177.0.0.1", "http://2130706433" and
// "http://[0:0:0:0:0:0:0:1]" out: the WHATWG parser normalizes every one of
// those to 127.0.0.1 or [::1], so a hostname comparison alone would classify
// them as loopback even though the registered string names no loopback host.
// It also refuses a percent-encoded host ("%6cocalhost") and a trailing dot
// ("localhost."). Scheme and host are case-insensitive (RFC 3986 §6.2.2.1).
const LOOPBACK_RAW =
    /^(http):\/\/(localhost|127\.0\.0\.1|\[::1\])(?::(\d{1,5}))?([/?].*)?$/i;

// The host exactly as written between "//" and the first "/", "?" or "#", with
// the port removed. Null when the authority carries userinfo.
function rawHost(uri: string, scheme: string): string | null {
    const rest = uri.slice(scheme.length + 3);
    const end = rest.search(/[/?#]/);
    const authority = end === -1 ? rest : rest.slice(0, end);
    if (authority.includes("@")) return null;
    if (authority.startsWith("[")) {
        const close = authority.indexOf("]");
        return close === -1 ? authority : authority.slice(0, close + 1);
    }
    const colon = authority.indexOf(":");
    return colon === -1 ? authority : authority.slice(0, colon);
}

// Classify and validate a redirect URI under D3. The same rules run at
// /register (for every registered URI) and at /authorize (for the presented
// one), so a URI that could not have been registered can never be presented.
// `reason` is safe to log and to return to the caller: it never echoes the URI.
export function parseRedirectUri(uri: string): ParsedRedirect {
    if (typeof uri !== "string" || uri.length === 0) {
        return { ok: false, reason: "redirect_uri is empty" };
    }
    if (uri.length > REDIRECT_URI_MAX_LENGTH) {
        return {
            ok: false,
            reason: `redirect_uri exceeds ${REDIRECT_URI_MAX_LENGTH} characters`,
        };
    }
    if (!URI_CHARS.test(uri)) {
        return {
            ok: false,
            reason: "redirect_uri contains characters not allowed in a URI",
        };
    }
    if (BAD_PERCENT.test(uri)) {
        return {
            ok: false,
            reason: "redirect_uri contains a malformed percent-encoding",
        };
    }
    // RFC 6749 §3.1.2: the redirection endpoint MUST NOT include a fragment.
    // Checked on the raw string because URL.hash is "" for a bare trailing "#".
    if (uri.includes("#")) {
        return {
            ok: false,
            reason: "redirect_uri must not contain a fragment",
        };
    }
    // An absolute URI starts with a scheme. "//localhost/cb" is a
    // scheme-relative reference and is refused here, before URL ever sees it.
    const schemeMatch = SCHEME.exec(uri);
    if (!schemeMatch) {
        return { ok: false, reason: "redirect_uri must be an absolute URI" };
    }
    let url: URL;
    try {
        url = new URL(uri);
    } catch {
        return { ok: false, reason: "redirect_uri must be an absolute URI" };
    }
    const scheme = schemeMatch[1]!.toLowerCase();
    // Belt and braces: the scheme the parser saw must be the one written.
    if (url.protocol !== `${scheme}:`) {
        return { ok: false, reason: "redirect_uri scheme is ambiguous" };
    }
    if (url.username !== "" || url.password !== "") {
        return { ok: false, reason: "redirect_uri must not contain userinfo" };
    }

    if (scheme === "https" || scheme === "http") {
        // Special schemes forgive "https:host" and "https:///host"; a redirect
        // URI has to spell its authority out.
        if (uri.slice(scheme.length + 1, scheme.length + 3) !== "//") {
            return {
                ok: false,
                reason: "redirect_uri must be an absolute URI",
            };
        }
        const host = rawHost(uri, scheme);
        if (host === null) {
            return {
                ok: false,
                reason: "redirect_uri must not contain userinfo",
            };
        }
        if (scheme === "http") {
            if (!LOOPBACK_RAW.test(uri) || !LOOPBACK_HOSTS.has(url.hostname)) {
                return {
                    ok: false,
                    reason: "http redirect_uri is only allowed for localhost, 127.0.0.1 or [::1]",
                };
            }
            return { ok: true, kind: "loopback", url };
        }
        // The host the consent page shows (URL.hostname) must be the host the
        // registrant wrote. The parser decodes percent-escapes, rewrites
        // numeric IPv4 forms and compresses IPv6, so a raw "%63laude.ai" would
        // otherwise be displayed as the recognised "claude.ai".
        if (host === "" || host.toLowerCase() !== url.hostname) {
            return {
                ok: false,
                reason: "redirect_uri host is not in canonical form",
            };
        }
        if (!HTTPS_HOST.test(url.hostname)) {
            return {
                ok: false,
                reason: "redirect_uri host is not a valid hostname",
            };
        }
        return { ok: true, kind: "https", url };
    }

    if (DENIED_SCHEMES.has(scheme)) {
        return {
            ok: false,
            reason: `redirect_uri scheme "${scheme}" is not allowed`,
        };
    }
    // A private-use scheme (RFC 8252 §7.1), e.g. cursor:// or
    // com.example.app:/cb — how desktop and mobile apps receive the code.
    return { ok: true, kind: "custom", url };
}

// What the consent notice names as the destination. For https and loopback it
// is the host (with port). For a private-use scheme it is the whole URI minus
// its query: the scheme alone ("x-safari-https://") hides where the code goes,
// and a custom URI's authority and path are exactly what an app — or a
// browser-launcher scheme the denylist missed — routes on. The query is left
// out because it is the part a client varies per request and never names a
// destination.
export function redirectDisplay(parsed: {
    kind: RedirectKind;
    url: URL;
}): string {
    if (parsed.kind !== "custom") return parsed.url.host;
    const href = parsed.url.href;
    const q = href.indexOf("?");
    return q === -1 ? href : href.slice(0, q);
}

// Whether a URI is a valid http loopback redirect under D3. https://localhost
// is not "loopback" here: RFC 8252 §7.3's any-port rule is for http loopback
// listeners, and an https redirect is matched exactly like any other.
export function isLoopbackRedirect(uri: string): boolean {
    const parsed = parseRedirectUri(uri);
    return parsed.ok && parsed.kind === "loopback";
}

// Does a presented redirect_uri match a registered one? Exact string equality,
// never a prefix or host test, with one exception: loopback ignores the port
// (RFC 8252 §7.3), because a native client binds an ephemeral port at request
// time and cannot know it at registration. Everything else about a loopback URI
// — scheme, host, path and query — must still match, and localhost never
// stands in for 127.0.0.1 or vice versa.
export function redirectMatches(
    registered: string,
    presented: string,
): boolean {
    const p = parseRedirectUri(presented);
    if (!p.ok) return false;
    if (registered === presented) return true;
    if (p.kind !== "loopback") return false;
    if (!isLoopbackRedirect(registered)) return false;
    const r = LOOPBACK_RAW.exec(registered)!;
    const q = LOOPBACK_RAW.exec(presented)!;
    return (
        r[1]!.toLowerCase() === q[1]!.toLowerCase() &&
        r[2]!.toLowerCase() === q[2]!.toLowerCase() &&
        (r[4] ?? "") === (q[4] ?? "")
    );
}

// RFC 7636 §4.2: an S256 challenge is base64url(sha256(verifier)) without
// padding, which is always exactly 43 characters.
export function isValidCodeChallenge(challenge: string): boolean {
    return (
        typeof challenge === "string" && /^[A-Za-z0-9_-]{43}$/.test(challenge)
    );
}

// Base64url without padding (RFC 4648 §5).
export function base64URLEncode(buffer: Buffer): string {
    return buffer
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
}

// RFC 7636 §4.2 S256 transform: BASE64URL-ENCODE(SHA256(ASCII(code_verifier))).
export function pkceS256(verifier: string): string {
    return base64URLEncode(createHash("sha256").update(verifier).digest());
}

// RFC 8707 resource indicator, normalized for comparison: an absolute http(s)
// URI with no fragment and no userinfo, lowercased scheme and host (the URL
// parser does that, and drops a default port), and a single trailing slash
// removed so "https://host/mcp/" and "https://host/" compare equal to
// "https://host/mcp" and "https://host". Null for anything else, including a
// relative reference.
export function normalizeResource(resource: string): string | null {
    if (typeof resource !== "string" || resource.length === 0) return null;
    if (!SCHEME.test(resource) || resource.includes("#")) return null;
    let url: URL;
    try {
        url = new URL(resource);
    } catch {
        return null;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username !== "" || url.password !== "") return null;
    const path = url.pathname.endsWith("/")
        ? url.pathname.slice(0, -1)
        : url.pathname;
    return `${url.protocol}//${url.host}${path}${url.search}`;
}

// Is `resource` this server? Accepts the MCP endpoint (the canonical resource
// the protected-resource metadata advertises) or the bare origin, which some
// clients send instead.
export function resourceAllowed(resource: string, baseUrl: string): boolean {
    const n = normalizeResource(resource);
    if (n === null) return false;
    return (
        n === normalizeResource(mcpResourceUrl(baseUrl)) ||
        n === normalizeResource(baseUrl)
    );
}
