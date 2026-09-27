import { test, expect, describe } from "bun:test";
import {
    ANALYTICS_ENABLED,
    CLARITY_PROJECT_ID,
    CONSENT_MAX_AGE_DAYS,
    GA_MEASUREMENT_ID,
    analyticsHead,
    footer,
    nav,
} from "../scripts/site-partials.js";
import { chromeFor } from "./copy/chrome.js";
import {
    PAGE_ROUTES,
    SITE_LOCALES,
    pathFor,
    type SiteLocale,
} from "./routes.js";

// The public site loads Google Analytics and Microsoft Clarity only after the
// visitor accepts in the consent banner. Three pieces make that true and each
// can break on its own: the inline loader in the page head (analyticsHead()
// in scripts/site-partials.ts), the banner and "Cookie settings" button that
// footer() renders, and the wiring in public/site.js. A regression in any of
// them is silent in a browser that has already chosen, so these pin each one:
// the snippet's text, the snippet run against stubs, the generated pages, and
// the site.js source.

const snippet = analyticsHead();
const body = snippet
    .replace(/^\s*<script data-analytics>/, "")
    .replace(/<\/script>\s*$/, "");

const DENIED_DEFAULT = {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
};

describe("analytics head snippet (static)", () => {
    test("is one <script data-analytics> on its own line, 8-space indent", () => {
        expect(snippet.startsWith("        <script data-analytics>")).toBe(
            true,
        );
        expect(snippet.endsWith("</script>")).toBe(true);
        expect(snippet.match(/<script\b/g)).toHaveLength(1);
    });

    test("queues the consent default before any config", () => {
        const def = snippet.indexOf('gtag("consent", "default"');
        const config = snippet.indexOf('gtag("config"');
        expect(def).toBeGreaterThan(-1);
        expect(config).toBeGreaterThan(def);
    });

    test("the default denies exactly the four signals", () => {
        const block = snippet.match(
            /gtag\("consent", "default", \{([^}]*)\}/,
        )?.[1];
        expect(block).toBeTruthy();
        expect(block!.match(/"denied"/g)).toHaveLength(4);
        for (const key of Object.keys(DENIED_DEFAULT))
            expect(block).toMatch(new RegExp(`${key}:\\s*"denied"`));
        expect(block).not.toContain("granted");
    });

    test("only analytics storage is ever granted", () => {
        const granted = [...snippet.matchAll(/(\w+):\s*"granted"/g)].map(
            (m) => m[1],
        );
        expect(granted.length).toBeGreaterThan(0);
        // gtag's key is lowercase, Clarity's consentv2 capitalises the S.
        for (const key of granted)
            expect(["analytics_storage", "analytics_Storage"]).toContain(key!);
    });

    test("has no static <script src> for GA or Clarity", () => {
        expect(snippet).not.toMatch(/<script[^>]*\ssrc=/);
    });

    test("has no template placeholders or backticks", () => {
        expect(snippet).not.toContain("{{");
        expect(snippet).not.toContain("`");
    });

    test("GA config caps the cookie at the choice's lifetime and disables signals", () => {
        expect(CONSENT_MAX_AGE_DAYS * 86400).toBe(15724800);
        expect(snippet).toContain("cookie_expires: 15724800");
        expect(snippet).toContain("allow_google_signals: false");
        expect(snippet).toContain("allow_ad_personalization_signals: false");
    });
});

// ---- the snippet run against stubs ----

const NOW = Date.UTC(2026, 8, 27, 12, 0, 0);
const DAY = 864e5;

class FakeDate extends Date {
    constructor(v?: number) {
        super(v ?? NOW);
    }
    static override now() {
        return NOW;
    }
}

interface StubEl {
    tagName: string;
    async?: boolean | number;
    src?: string;
}

interface Run {
    win: Record<string, any>;
    attrs: Record<string, string>;
    scripts: StubEl[];
}

function runSnippet(opts: {
    stored?: unknown;
    getItemThrows?: boolean;
    gpc?: boolean;
}): Run {
    const win: Record<string, any> = {};
    const attrs: Record<string, string> = {};
    const scripts: StubEl[] = [];
    const firstScript = {
        parentNode: {
            insertBefore(el: StubEl) {
                scripts.push(el);
            },
        },
    };
    const doc = {
        createElement: (tagName: string): StubEl => ({ tagName }),
        head: {
            appendChild(el: StubEl) {
                scripts.push(el);
            },
        },
        getElementsByTagName: (tag: string) =>
            tag === "script" ? [firstScript] : [],
        documentElement: {
            setAttribute(k: string, v: string) {
                attrs[k] = v;
            },
        },
    };
    const localStorage = {
        getItem(key: string) {
            if (opts.getItemThrows) throw new Error("SecurityError");
            if (key !== "consent" || opts.stored === undefined) return null;
            return typeof opts.stored === "string"
                ? opts.stored
                : JSON.stringify(opts.stored);
        },
    };
    const navigator = opts.gpc ? { globalPrivacyControl: true } : {};
    new Function(
        "window",
        "document",
        "localStorage",
        "navigator",
        "Date",
        body,
    )(win, doc, localStorage, navigator, FakeDate);
    return { win, attrs, scripts };
}

const entries = (r: Run) =>
    (r.win.dataLayer as ArrayLike<unknown>[]).map((e) => Array.from(e));

function expectNothingLoaded(r: Run) {
    expect(r.scripts).toHaveLength(0);
    expect(r.win.clarity).toBeUndefined();
    expect(r.win.nmConsent.isLoaded()).toBe(false);
    expect(entries(r)).toEqual([["consent", "default", DENIED_DEFAULT]]);
}

function expectLoaded(r: Run) {
    expect(r.win.nmConsent.isLoaded()).toBe(true);
    const ga = r.scripts.find((s) =>
        s.src?.startsWith("https://www.googletagmanager.com/gtag/js"),
    );
    expect(ga?.src).toContain(`id=${GA_MEASUREMENT_ID}`);
    const clarity = r.scripts.find((s) =>
        s.src?.startsWith("https://www.clarity.ms/tag/"),
    );
    expect(clarity?.src).toContain(CLARITY_PROJECT_ID);
    const q = (r.win.clarity.q as ArrayLike<unknown>[]).map((e) =>
        Array.from(e),
    );
    expect(q).toContainEqual([
        "consentv2",
        { ad_Storage: "denied", analytics_Storage: "granted" },
    ]);
    const dl = entries(r);
    expect(dl[0]).toEqual(["consent", "default", DENIED_DEFAULT]);
    expect(dl[1]).toEqual([
        "consent",
        "update",
        { analytics_storage: "granted" },
    ]);
    expect(dl[2]![0]).toBe("js");
    expect(dl[3]).toEqual([
        "config",
        GA_MEASUREMENT_ID,
        {
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
            cookie_expires: 15724800,
        },
    ]);
}

const record = (choice: string, at: number, v = 1) => ({ v, choice, at });

describe("analytics head snippet (behaviour)", () => {
    test("nothing stored: asks, loads nothing, only the default is queued", () => {
        const r = runSnippet({});
        expect(r.attrs["data-consent"]).toBe("ask");
        expectNothingLoaded(r);
        expect(r.win.nmConsent.key).toBe("consent");
        expect(r.win.nmConsent.maxAge).toBe(CONSENT_MAX_AGE_DAYS * DAY);
    });

    test("fresh granted: loads GA and Clarity with consent granted", () => {
        const r = runSnippet({ stored: record("granted", NOW - DAY) });
        expect(r.attrs["data-consent"]).toBe("granted");
        expectLoaded(r);
    });

    test("load() is idempotent", () => {
        const r = runSnippet({ stored: record("granted", NOW - DAY) });
        const before = r.scripts.length;
        r.win.nmConsent.load();
        expect(r.scripts).toHaveLength(before);
    });

    test("granted 183 days old: asks again, loads nothing", () => {
        const r = runSnippet({ stored: record("granted", NOW - 183 * DAY) });
        expect(r.attrs["data-consent"]).toBe("ask");
        expectNothingLoaded(r);
    });

    test("granted with a future timestamp: asks, loads nothing", () => {
        const r = runSnippet({ stored: record("granted", NOW + DAY) });
        expect(r.attrs["data-consent"]).toBe("ask");
        expectNothingLoaded(r);
    });

    test("stored denied: denied, loads nothing", () => {
        const r = runSnippet({ stored: record("denied", NOW - DAY) });
        expect(r.attrs["data-consent"]).toBe("denied");
        expectNothingLoaded(r);
    });

    test("GPC with nothing stored: denied without asking", () => {
        const r = runSnippet({ gpc: true });
        expect(r.attrs["data-consent"]).toBe("denied");
        expectNothingLoaded(r);
    });

    test("GPC with a stored granted: the explicit choice wins", () => {
        const r = runSnippet({
            gpc: true,
            stored: record("granted", NOW - DAY),
        });
        expect(r.attrs["data-consent"]).toBe("granted");
        expectLoaded(r);
    });

    test("getItem throws: asks, does not throw", () => {
        const r = runSnippet({ getItemThrows: true });
        expect(r.attrs["data-consent"]).toBe("ask");
        expectNothingLoaded(r);
    });

    test("malformed JSON: asks", () => {
        const r = runSnippet({ stored: "{not json" });
        expect(r.attrs["data-consent"]).toBe("ask");
        expectNothingLoaded(r);
    });

    test("unknown record version: asks", () => {
        const r = runSnippet({ stored: record("granted", NOW - DAY, 2) });
        expect(r.attrs["data-consent"]).toBe("ask");
        expectNothingLoaded(r);
    });

    test("unknown choice value: asks", () => {
        const r = runSnippet({ stored: record("yes", NOW - DAY) });
        expect(r.attrs["data-consent"]).toBe("ask");
        expectNothingLoaded(r);
    });
});

// ---- footer() markup ----

const unescape = (s: string) =>
    s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

describe("consent markup in nav() and footer()", () => {
    const n = ANALYTICS_ENABLED ? 1 : 0;

    test("footer() renders the settings button, and no banner, only when analytics are on", () => {
        const html = footer("de", "/privacy");
        expect(html.match(/data-consent-open/g) ?? []).toHaveLength(n);
        expect(html).not.toContain('class="consent"');
    });

    test("nav() renders the banner after the skip link and before the header", () => {
        const html = nav("de", "/privacy", "/privacy");
        expect(html.match(/<section class="consent"/g) ?? []).toHaveLength(n);
        if (!ANALYTICS_ENABLED) return;
        const skip = html.indexOf('class="skip"');
        const banner = html.indexOf('<section class="consent"');
        const header = html.indexOf('<header class="site-head"');
        expect(skip).toBeLessThan(banner);
        expect(banner).toBeLessThan(header);
    });

    test("{ consent: false } leaves the banner and the button out", () => {
        for (const html of [
            footer("de", "/privacy", { consent: false }),
            nav("de", "", undefined, { dynamicSwitcher: true, consent: false }),
        ]) {
            expect(html).not.toContain("data-consent-open");
            expect(html).not.toContain('class="consent"');
            expect(html).not.toContain("data-analytics");
        }
    });

    test("the banner's privacy link is not marked aria-current", () => {
        if (!ANALYTICS_ENABLED) return;
        const html = nav("de", "/privacy", "/privacy");
        const link = html.match(/<a data-consent-link[^>]*>/)?.[0];
        expect(link).toBe(
            `<a data-consent-link href="${pathFor("de", "/privacy")}">`,
        );
    });
});

// ---- generated pages ----

// Copied, not imported: scripts/depersonalize.ts runs on import. Keep these
// in step with ANALYTICS_SNIPPET_RULE / CONSENT_BANNER_RULE /
// CONSENT_SETTINGS_RULE there.
const DEPERSONALIZE_RULES: Record<string, RegExp> = {
    snippet: /[ \t]*<script data-analytics>[\s\S]*?<\/script>\n/,
    banner: /[ \t]*<section class="consent"[\s\S]*?<\/section>\n/,
    settings: /[ \t]*<button[^>]*data-consent-open[\s\S]*?<\/button\s*>\n/,
};

const count = (html: string, re: RegExp) =>
    (html.match(new RegExp(re.source, re.flags.replace("g", "") + "g")) ?? [])
        .length;

const localeFile = (locale: SiteLocale, file: string) =>
    locale === "en" ? `./public/${file}` : `./public/${locale}/${file}`;

interface Page {
    path: string;
    locale: SiteLocale;
    login: boolean;
    html: string;
}

async function loadPages(): Promise<Page[]> {
    const pages: Page[] = [];
    for (const locale of SITE_LOCALES) {
        const files = [
            ...Object.values(PAGE_ROUTES).map((f) => ({ f, login: false })),
            { f: "login.html", login: true },
        ];
        for (const { f, login } of files) {
            const path = localeFile(locale, f);
            const file = Bun.file(path);
            if (!(await file.exists())) continue;
            pages.push({ path, locale, login, html: await file.text() });
        }
    }
    return pages;
}

const pages = await loadPages();
const publicPages = pages.filter((p) => !p.login);
const loginPages = pages.filter((p) => p.login);

describe("generated pages", () => {
    test("there are pages to check", () => {
        expect(publicPages.length).toBeGreaterThan(0);
        expect(loginPages.length).toBeGreaterThan(0);
    });

    test("every public page carries one snippet, banner and settings button (or none on NOINDEX)", () => {
        const n = ANALYTICS_ENABLED ? 1 : 0;
        for (const p of publicPages) {
            const got = {
                path: p.path,
                snippet: count(p.html, /<script data-analytics>/),
                banner: count(p.html, /<section class="consent"/),
                settings: count(p.html, /data-consent-open/),
            };
            expect(got).toEqual({
                path: p.path,
                snippet: n,
                banner: n,
                settings: n,
            });
        }
    });

    test("the login page carries no analytics at all", () => {
        for (const p of loginPages) {
            const got = {
                path: p.path,
                analytics: count(p.html, /data-analytics/),
                banner: count(p.html, /class="consent"/),
                settings: count(p.html, /data-consent-open/),
                gtm: count(p.html, /googletagmanager/),
                clarity: count(p.html, /clarity/i),
                gtag: count(p.html, /gtag\(/),
            };
            expect(got).toEqual({
                path: p.path,
                analytics: 0,
                banner: 0,
                settings: 0,
                gtm: 0,
                clarity: 0,
                gtag: 0,
            });
        }
    });

    test("no page loads GA or Clarity from a static <script src>", () => {
        for (const p of pages) {
            expect({
                path: p.path,
                hits: count(
                    p.html,
                    /<script[^>]*\ssrc="https:\/\/(www\.googletagmanager\.com|[^"]*clarity\.ms)/,
                ),
            }).toEqual({ path: p.path, hits: 0 });
        }
    });

    test("each locale's banner and button read that locale's chrome copy", () => {
        if (!ANALYTICS_ENABLED) return;
        for (const p of publicPages) {
            const c = chromeFor(p.locale).consent;
            const pick = (re: RegExp) => {
                const m = p.html.match(re)?.[1];
                return m === undefined ? undefined : unescape(m);
            };
            expect({
                path: p.path,
                title: pick(
                    /<strong id="consent-title" class="consent-title">([\s\S]*?)<\/strong>/,
                ),
                body: pick(/<\/strong> ([\s\S]*?) <a data-consent-link/),
                reject: pick(
                    /<button[^>]*data-consent-choice="denied"[^>]*>([\s\S]*?)<\/button>/,
                ),
                accept: pick(
                    /<button[^>]*data-consent-choice="granted"[^>]*>([\s\S]*?)<\/button>/,
                ),
                settings: pick(
                    /<button[^>]*data-consent-open[^>]*>([\s\S]*?)<\/button>/,
                ),
            }).toEqual({
                path: p.path,
                title: c.title,
                body: c.body,
                reject: c.reject,
                accept: c.accept,
                settings: c.settings,
            });
        }
    });

    test("Accept and Reject have identical class lists", () => {
        if (!ANALYTICS_ENABLED) return;
        for (const p of publicPages) {
            const cls = (choice: string) =>
                p.html
                    .match(
                        new RegExp(
                            `<button[^>]*data-consent-choice="${choice}"[^>]*>`,
                        ),
                    )?.[0]
                    .match(/class="([^"]*)"/)?.[1];
            const reject = cls("denied");
            expect(reject).toBeTruthy();
            expect({ path: p.path, accept: cls("granted") }).toEqual({
                path: p.path,
                accept: reject,
            });
        }
    });

    test("the depersonalize rules each match once on a public page and never on login", () => {
        const n = ANALYTICS_ENABLED ? 1 : 0;
        for (const [name, re] of Object.entries(DEPERSONALIZE_RULES)) {
            for (const p of publicPages)
                expect({ path: p.path, name, hits: count(p.html, re) }).toEqual(
                    { path: p.path, name, hits: n },
                );
            for (const p of loginPages)
                expect({ path: p.path, name, hits: count(p.html, re) }).toEqual(
                    { path: p.path, name, hits: 0 },
                );
        }
    });
});

// ---- site.js wiring ----

describe("site.js consent wiring", () => {
    const src = Bun.file("./public/site.js").text();

    test("wires the banner, the settings button and withdrawal", async () => {
        const js = await src;
        for (const needle of [
            "data-consent-choice",
            "data-consent-open",
            '"consentv2"',
            '"consent", false',
            'analytics_storage: "denied"',
            "_clck",
            "_clsk",
            '"_ga"',
            '"_ga_"',
            "location.reload()",
        ])
            expect(js).toContain(needle);
    });

    // The header disclosures' Escape handler is a bubble-phase listener on
    // document added at init; the reopened banner's is added later. Unless
    // the banner's runs in the capture phase, the disclosure closes first,
    // the "another layer is open" guard sees nothing, and one Escape
    // dismisses both.
    test("the reopened banner's Escape runs before the disclosures'", async () => {
        const js = await src;
        expect(js).toContain('doc.addEventListener("keydown", onEscape, true)');
        expect(js).toContain(
            'doc.removeEventListener("keydown", onEscape, true)',
        );
        expect(js).not.toMatch(
            /(add|remove)EventListener\("keydown", onEscape\)/,
        );
    });

    test("hides the controls when the loader is absent", async () => {
        const js = await src;
        expect(js).toContain("window.nmConsent");
        expect(js).toMatch(/if \(!nm\)/);
    });
});
