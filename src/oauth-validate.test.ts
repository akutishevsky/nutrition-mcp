import { describe, expect, test } from "bun:test";
import {
    DENIED_SCHEMES,
    KNOWN_CLIENT_HOSTS,
    REDIRECT_URI_MAX_LENGTH,
    isLoopbackRedirect,
    isValidCodeChallenge,
    normalizeResource,
    parseRedirectUri,
    pkceS256,
    redirectDisplay,
    redirectMatches,
    resourceAllowed,
} from "./oauth-validate.js";

const CLAUDE_CALLBACK = "https://claude.ai/api/mcp/auth_callback";

function kindOf(uri: string): string | null {
    const parsed = parseRedirectUri(uri);
    return parsed.ok ? parsed.kind : null;
}

describe("parseRedirectUri", () => {
    test.each([
        [CLAUDE_CALLBACK, "https"],
        ["https://claude.com/api/mcp/auth_callback", "https"],
        ["https://chatgpt.com/connector/oauth/abc", "https"],
        ["http://localhost:6274/cb", "loopback"],
        ["http://127.0.0.1:51789/cb", "loopback"],
        ["http://[::1]:9/cb", "loopback"],
        ["http://localhost/cb", "loopback"],
        ["http://localhost:6274", "loopback"],
        ["http://localhost:6274/cb?x=1", "loopback"],
        ["cursor://anysphere.cursor-retrieval/oauth/cb", "custom"],
        // RFC 8252 §7.1 reverse-DNS form, single slash.
        ["com.example.app:/oauth2redirect", "custom"],
        // Scheme and host are case-insensitive.
        ["HTTP://LOCALHOST:1/cb", "loopback"],
        ["HTTPS://Claude.AI/api/mcp/auth_callback", "https"],
    ])("accepts %s as %s", (uri, kind) => {
        expect(kindOf(uri)).toBe(kind);
    });

    test("the parsed URL is returned with the result", () => {
        const parsed = parseRedirectUri(CLAUDE_CALLBACK);
        expect(parsed.ok).toBe(true);
        if (parsed.ok) expect(parsed.url.hostname).toBe("claude.ai");
    });

    test.each([
        // http off loopback, and loopback lookalikes.
        "http://evil.example/cb",
        "http://localhost.evil.example/cb",
        "http://localhost./cb",
        "http://%6cocalhost/cb",
        // Userinfo, in every scheme.
        "http://localhost@evil.example/cb",
        "http://localhost:80@evil.example/cb",
        "https://u:p@claude.ai/cb",
        "https://claude.ai@evil.example/cb",
        "cursor://user:pass@host/cb",
        // Fragments, including an empty one.
        "https://claude.ai/cb#frag",
        "https://claude.ai/cb#",
        "myapp:/cb#",
        // Denylisted schemes, in any case.
        "javascript:alert(1)",
        "JavaScript:alert(1)",
        "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
        "file:///etc/passwd",
        "vbscript:msgbox(1)",
        "blob:https://claude.ai/uuid",
        "about:blank",
        "ftp://example.com/cb",
        "ws://localhost/cb",
        "wss://example.com/cb",
        // Not absolute.
        "//localhost/cb",
        "/cb",
        "localhost/cb",
        "",
        // Special schemes forgive a missing or extra "//"; a redirect may not.
        "https:claude.ai/cb",
        "https:///claude.ai/cb",
        "http:localhost/cb",
        // Characters the WHATWG parser would silently rewrite.
        "http://localhost\\@evil.example/cb",
        "https://claude.ai\\evil.example/cb",
        "java\tscript:alert(1)",
        " https://claude.ai/cb",
        "https://claude.ai/cb ",
        "https://claude.ai/c\nb",
        "https://clаude.ai/cb", // Cyrillic "а"
        // Non-canonical hosts the consent page would display differently.
        "https://%63laude.ai/cb",
        "https://0x7f.1/cb",
        "https://[0:0::1]/cb",
        // Malformed percent-encoding.
        "https://claude.ai/%zz",
        "https://claude.ai/%4",
    ])("rejects %j", (uri) => {
        const parsed = parseRedirectUri(uri);
        expect(parsed.ok).toBe(false);
        if (!parsed.ok) expect(parsed.reason).not.toContain(uri || "\u0000");
    });

    test("enforces the length cap", () => {
        const base = "https://claude.ai/";
        const atCap = base + "a".repeat(REDIRECT_URI_MAX_LENGTH - base.length);
        expect(atCap.length).toBe(2000);
        expect(parseRedirectUri(atCap).ok).toBe(true);
        expect(parseRedirectUri(atCap + "a").ok).toBe(false);
    });

    // http and https are on the list only so they can never fall through to
    // "custom"; they have their own branches, exercised above.
    test("every other denylisted scheme is refused as a custom scheme", () => {
        for (const scheme of DENIED_SCHEMES) {
            if (scheme === "http" || scheme === "https") continue;
            expect(parseRedirectUri(`${scheme}://example/cb`).ok).toBe(false);
        }
    });

    // Browser launchers hand their payload to a browser as a web URL, so each
    // of these is an arbitrary https origin wearing a custom-scheme costume.
    test.each([
        "x-safari-https://evil.example/cb",
        "x-safari-http://evil.example/cb",
        "googlechromes://evil.example/cb",
        "googlechrome://evil.example/cb",
        "microsoft-edge:https://evil.example/cb",
        "microsoft-edge-https://evil.example/cb",
        "firefox://open-url?url=https://evil.example/cb",
        "opera-https://evil.example/cb",
        "brave://evil.example/cb",
        "intent://evil.example/cb",
        "view-source:https://evil.example/cb",
        "jar:https://evil.example/x.jar!/cb",
        "filesystem:https://evil.example/temporary/cb",
        "feed:https://evil.example/cb",
        "chrome://settings",
        "chrome-extension://abc/x",
        "moz-extension://abc/x",
        "resource://gre/x",
        "X-Safari-HTTPS://evil.example/cb",
    ])("refuses the browser-launcher scheme %j", (uri) => {
        expect(parseRedirectUri(uri).ok).toBe(false);
    });

    // URI_CHARS admits RFC 3986 sub-delims, so without a hostname rule a host
    // like "claude.ai$'.evil.example" was registrable — unresolvable, but it
    // reached the consent page, where "$'" is a replacement pattern.
    test.each([
        "https://claude.ai$'.evil.example/cb",
        "https://x$&y.example/cb",
        "https://ex$$a.com/cb",
        "https://a_b.example/cb",
        "https://-a.example/cb",
        "https://a-.example/cb",
        "https://a..example/cb",
    ])("refuses the non-LDH https host %j", (uri) => {
        const parsed = parseRedirectUri(uri);
        expect(parsed.ok).toBe(false);
    });

    test.each([
        "https://xn--bcher-kva.example/cb",
        "https://a-b.example:8443/cb",
        "https://192.0.2.1/cb",
        "https://[2001:db8::1]/cb",
    ])("still accepts the https host %j", (uri) => {
        expect(kindOf(uri)).toBe("https");
    });
});

describe("redirectDisplay", () => {
    function display(uri: string): string {
        const parsed = parseRedirectUri(uri);
        if (!parsed.ok) throw new Error(parsed.reason);
        return redirectDisplay(parsed);
    }

    test("https and loopback show the host with its port", () => {
        expect(display(CLAUDE_CALLBACK)).toBe("claude.ai");
        expect(display("https://a.example:8443/cb?x=1")).toBe("a.example:8443");
        expect(display("http://localhost:6274/cb")).toBe("localhost:6274");
    });

    // The scheme alone ("x-safari-https://") would hide where the code goes
    // for any browser launcher the denylist misses.
    test("a custom scheme shows its authority and path, without the query", () => {
        expect(display("cursor://anysphere.cursor-retrieval/oauth/cb")).toBe(
            "cursor://anysphere.cursor-retrieval/oauth/cb",
        );
        expect(display("com.example.app:/oauth2redirect?x=1")).toBe(
            "com.example.app:/oauth2redirect",
        );
        expect(display("some-launcher://evil.example/cb?q=1")).toBe(
            "some-launcher://evil.example/cb",
        );
    });
});

// The #149 review's trick inputs. WHATWG URL normalizes every one of them to
// 127.0.0.1 or [::1], so a hostname check would call them loopback; they must be
// judged on the host as written.
describe("isLoopbackRedirect", () => {
    test.each([
        "http://localhost:6274/oauth/callback",
        "http://127.0.0.1:51789/cb",
        "http://[::1]:9/cb",
    ])("accepts %s", (uri) => {
        expect(isLoopbackRedirect(uri)).toBe(true);
    });

    test.each([
        "http://127.1/cb",
        "http://127.1:8080/cb",
        "http://0177.0.0.1/cb",
        "http://2130706433/cb",
        "http://0x7f000001/cb",
        "http://[0:0:0:0:0:0:0:1]/cb",
        "http://[0:0:0:0:0:0:0:1]:9/cb",
        "http://localhost.evil.example/cb",
        "http://localhost@evil.example/cb",
        "http://localhost./cb",
        "//localhost/cb",
        "javascript:alert(1)",
        // https loopback is matched exactly like any other https redirect.
        "https://localhost:6274/cb",
    ])("does not classify %s as loopback", (uri) => {
        expect(isLoopbackRedirect(uri)).toBe(false);
    });

    test("the numeric forms are refused outright, not reclassified", () => {
        for (const uri of [
            "http://127.1/cb",
            "http://0177.0.0.1/cb",
            "http://2130706433/cb",
            "http://[0:0:0:0:0:0:0:1]/cb",
        ]) {
            expect(parseRedirectUri(uri).ok).toBe(false);
        }
    });
});

describe("redirectMatches", () => {
    test("exact match is true", () => {
        expect(redirectMatches(CLAUDE_CALLBACK, CLAUDE_CALLBACK)).toBe(true);
        expect(
            redirectMatches(
                "cursor://anysphere.cursor-retrieval/oauth/cb",
                "cursor://anysphere.cursor-retrieval/oauth/cb",
            ),
        ).toBe(true);
    });

    test("a lookalike host is false", () => {
        expect(
            redirectMatches(
                CLAUDE_CALLBACK,
                "https://claude.ai.evil.example/api/mcp/auth_callback",
            ),
        ).toBe(false);
    });

    test("a prefix, suffix or case variant of an https URI is false", () => {
        expect(redirectMatches(CLAUDE_CALLBACK, CLAUDE_CALLBACK + "/x")).toBe(
            false,
        );
        expect(redirectMatches(CLAUDE_CALLBACK, CLAUDE_CALLBACK + "?x=1")).toBe(
            false,
        );
        expect(
            redirectMatches(
                CLAUDE_CALLBACK,
                "https://claude.ai/api/mcp/AUTH_CALLBACK",
            ),
        ).toBe(false);
    });

    test("loopback ignores the port", () => {
        expect(
            redirectMatches(
                "http://localhost/callback",
                "http://localhost:51789/callback",
            ),
        ).toBe(true);
        expect(
            redirectMatches(
                "http://127.0.0.1:1111/callback",
                "http://127.0.0.1:2222/callback",
            ),
        ).toBe(true);
        expect(redirectMatches("http://[::1]/cb", "http://[::1]:9/cb")).toBe(
            true,
        );
        expect(
            redirectMatches("http://LOCALHOST/cb", "http://localhost:9/cb"),
        ).toBe(true);
    });

    test("localhost does not match 127.0.0.1", () => {
        expect(
            redirectMatches(
                "http://localhost:6274/cb",
                "http://127.0.0.1:6274/cb",
            ),
        ).toBe(false);
        expect(redirectMatches("http://127.0.0.1/cb", "http://[::1]/cb")).toBe(
            false,
        );
    });

    test("a different loopback path or query is false", () => {
        expect(
            redirectMatches("http://localhost/cb", "http://localhost:9/other"),
        ).toBe(false);
        expect(
            redirectMatches("http://localhost/cb", "http://localhost:9/cb/"),
        ).toBe(false);
        expect(
            redirectMatches("http://localhost/cb?a=1", "http://localhost:9/cb"),
        ).toBe(false);
        expect(
            redirectMatches(
                "http://localhost/cb?a=1",
                "http://localhost:9/cb?a=1",
            ),
        ).toBe(true);
    });

    test("a loopback trick never matches a registered loopback", () => {
        for (const presented of [
            "http://127.1:9/cb",
            "http://2130706433:9/cb",
            "http://[0:0:0:0:0:0:0:1]:9/cb",
            "http://localhost:9@evil.example/cb",
        ]) {
            expect(redirectMatches("http://127.0.0.1/cb", presented)).toBe(
                false,
            );
            expect(redirectMatches("http://[::1]/cb", presented)).toBe(false);
            expect(redirectMatches("http://localhost/cb", presented)).toBe(
                false,
            );
        }
    });

    test("an https port is not ignored", () => {
        expect(
            redirectMatches(
                "https://example.com/cb",
                "https://example.com:8443/cb",
            ),
        ).toBe(false);
        expect(
            redirectMatches(
                "https://localhost/cb",
                "https://localhost:8443/cb",
            ),
        ).toBe(false);
    });

    test("an invalid presented URI never matches, even if registered verbatim", () => {
        // Defence in depth: a row that slipped into storage before D3 existed.
        expect(
            redirectMatches("javascript:alert(1)", "javascript:alert(1)"),
        ).toBe(false);
        expect(
            redirectMatches("http://evil.example/cb", "http://evil.example/cb"),
        ).toBe(false);
    });
});

describe("PKCE", () => {
    // The verifier is the one printed in RFC 7636 Appendix B. (The OAuth
    // hardening brief quoted a different, mistyped verifier.)
    test("pkceS256 passes the RFC 7636 Appendix B vector", () => {
        expect(pkceS256("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
            "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
        );
    });

    test("isValidCodeChallenge accepts exactly 43 base64url characters", () => {
        expect(
            isValidCodeChallenge("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"),
        ).toBe(true);
        expect(isValidCodeChallenge("a".repeat(43))).toBe(true);
        expect(isValidCodeChallenge("_-".repeat(21) + "A")).toBe(true);
    });

    test.each([
        ["42 characters", "a".repeat(42)],
        ["44 characters", "a".repeat(44)],
        ["standard base64 +", "+".repeat(43)],
        ["standard base64 /", "/".repeat(43)],
        ["padding", "a".repeat(42) + "="],
        ["whitespace", "a".repeat(42) + " "],
        ["trailing newline", "a".repeat(43) + "\n"],
        ["empty", ""],
    ])("isValidCodeChallenge rejects %s", (_label, challenge) => {
        expect(isValidCodeChallenge(challenge)).toBe(false);
    });
});

describe("resource indicators", () => {
    const BASE = "https://nutrition-mcp.com";

    test.each([
        "https://nutrition-mcp.com/mcp",
        "HTTPS://Nutrition-MCP.com/mcp/",
        "https://nutrition-mcp.com",
        "https://nutrition-mcp.com/",
        "https://nutrition-mcp.com:443/mcp",
    ])("resourceAllowed accepts %s", (resource) => {
        expect(resourceAllowed(resource, BASE)).toBe(true);
    });

    test.each([
        "https://evil.example/mcp",
        "/other",
        "/mcp",
        "https://nutrition-mcp.com/other",
        "https://nutrition-mcp.com/mcp#x",
        "https://nutrition-mcp.com/mcp?x=1",
        "https://u@nutrition-mcp.com/mcp",
        "http://nutrition-mcp.com/mcp",
        "https://nutrition-mcp.com.evil.example/mcp",
        "https://nutrition-mcp.com:8443/mcp",
        "",
    ])("resourceAllowed rejects %j", (resource) => {
        expect(resourceAllowed(resource, BASE)).toBe(false);
    });

    test("resourceAllowed follows a local base URL with a port", () => {
        expect(
            resourceAllowed(
                "http://localhost:8080/mcp",
                "http://localhost:8080",
            ),
        ).toBe(true);
        expect(
            resourceAllowed(
                "http://localhost:9999/mcp",
                "http://localhost:8080",
            ),
        ).toBe(false);
    });

    test("normalizeResource", () => {
        expect(normalizeResource("HTTPS://Nutrition-MCP.com/mcp/")).toBe(
            "https://nutrition-mcp.com/mcp",
        );
        expect(normalizeResource("https://nutrition-mcp.com/")).toBe(
            "https://nutrition-mcp.com",
        );
        expect(normalizeResource("/other")).toBeNull();
        expect(normalizeResource("urn:example:resource")).toBeNull();
        expect(normalizeResource("not a url")).toBeNull();
    });
});

test("KNOWN_CLIENT_HOSTS is exactly the recognised assistants", () => {
    expect([...KNOWN_CLIENT_HOSTS].sort()).toEqual([
        "chatgpt.com",
        "claude.ai",
        "claude.com",
    ]);
});
