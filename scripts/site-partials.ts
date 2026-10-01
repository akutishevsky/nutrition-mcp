// Shared HTML fragments for every generated public page (the landing page,
// /tools, /privacy, /terms, and the /alternatives comparison pages). Used to
// live duplicated inside scripts/gen-alternatives.ts; pulled out here so
// every generator shares one nav()/footer() — including the locale-aware
// links and the language switcher — instead of each page type forking its
// own copy and drifting the way public/index.html's hand-authored nav
// already had to be kept in sync by hand with this file's predecessor.
//
// Nothing here is escaped against untrusted input — every caller passes
// developer-authored constants (page copy, not visitor input), the same
// trust level as the rest of this generator family.

import {
    HTML_LANG,
    LOCALE_NAMES,
    OG_LOCALE,
    SITE,
    SITE_LOCALES,
    TRANSLATION_NOTICE,
    hashPath,
    pathFor,
    urlFor,
    type SiteLocale,
} from "../src/routes.js";
import { chromeFor, type ChromeCopy } from "../src/copy/chrome.js";

export { SITE };

/** Minimal HTML-entity escaping for text interpolated into element bodies. */
export function esc(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * The "this page is machine-translated" banner — empty string on English
 * (nothing to disclose) or a locale TRANSLATION_NOTICE hasn't reached yet
 * (silently omitting rather than showing a half-translated notice; every
 * shipped translation should have one before it ships, but a missing entry
 * degrading to "no notice" is safer than the alternative). `suffix` is the
 * page's PAGE_ROUTES key, used to link back to the *same* page in English.
 */
export function translationNotice(locale: SiteLocale, suffix: string): string {
    if (locale === "en") return "";
    const notice = TRANSLATION_NOTICE[locale];
    if (!notice) return "";
    return `                    <div class="translation-notice">
                        <p>
                            ${esc(notice.text)}
                            <a href="${pathFor("en", suffix)}">${esc(notice.linkText)}</a>
                        </p>
                    </div>`;
}

export function jsonLd(obj: unknown): string {
    return `        <script type="application/ld+json">\n${JSON.stringify(
        obj,
        null,
        4,
    )
        .split("\n")
        .map((l) => "            " + l)
        .join("\n")}\n        </script>`;
}

/** Google Analytics 4 measurement id. */
export const GA_MEASUREMENT_ID = "G-1K4HRB2R8X";
/** Microsoft Clarity project id. */
export const CLARITY_PROJECT_ID = "ykukhn1ofa";
/**
 * How long a stored consent choice (either one) stays valid before the
 * banner asks again: about six months, per CNIL's FAQ (Q21). GA's own
 * cookie_expires below is the same span in seconds, so `_ga` never outlives
 * the choice that allowed it.
 */
export const CONSENT_MAX_AGE_DAYS = 182;

/**
 * The consent-gated analytics loader: Google Analytics 4 in basic Consent
 * Mode v2 plus Microsoft Clarity (session replays + heatmaps). Nothing from
 * Google or Microsoft is fetched until the visitor accepts in the banner
 * (footer() renders it; public/site.js wires it): this inline script only
 * queues the all-denied consent default, reads the stored choice from
 * localStorage ("consent", `{ v: 1, choice, at }`, valid for
 * CONSENT_MAX_AGE_DAYS), stamps `data-consent` on <html> — "granted",
 * "denied" or "ask", which is what shows the banner — and calls load() when
 * the stored choice is granted. A Global Privacy Control signal with nothing
 * stored counts as denied without asking. Only analytics_storage is ever
 * granted; the three ad_* signals stay denied for good.
 *
 * Clarity is Microsoft's own install snippet with the project id filled in,
 * followed by its consentv2 call (capital-S keys, unlike gtag's). Kept out
 * of BASE_HEAD_ASSETS because the login page must not carry it: a replay of
 * the sign-in form is exactly the recording nobody should hold, masked
 * inputs or not. Its hosts are in the CSP in src/index.ts, and
 * scripts/depersonalize.ts strips the whole `<script data-analytics>`.
 *
 * A new tracker goes inside load(), never beside it, or it runs without
 * consent. The body reads bare localStorage / navigator / Date on purpose,
 * so src/consent.test.ts can run it with stubs; it must contain no `{{`
 * and no backticks.
 */
export function analyticsHead(): string {
    const maxAgeSeconds = CONSENT_MAX_AGE_DAYS * 86400;
    return `        <script data-analytics>
            (function (w, d) {
                var KEY = "consent";
                var MAX_AGE = ${CONSENT_MAX_AGE_DAYS} * 864e5;
                var GA_ID = "${GA_MEASUREMENT_ID}";
                var loaded = false;
                w.dataLayer = w.dataLayer || [];
                function gtag() {
                    w.dataLayer.push(arguments);
                }
                w.gtag = gtag;
                gtag("consent", "default", {
                    ad_storage: "denied",
                    ad_user_data: "denied",
                    ad_personalization: "denied",
                    analytics_storage: "denied",
                });
                function load() {
                    if (loaded) return;
                    loaded = true;
                    gtag("consent", "update", { analytics_storage: "granted" });
                    gtag("js", new Date());
                    gtag("config", GA_ID, {
                        allow_google_signals: false,
                        allow_ad_personalization_signals: false,
                        cookie_expires: ${maxAgeSeconds},
                    });
                    var s = d.createElement("script");
                    s.async = true;
                    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
                    d.head.appendChild(s);
                    (function (c, l, a, r, i, t, y) {
                        c[a] =
                            c[a] ||
                            function () {
                                (c[a].q = c[a].q || []).push(arguments);
                            };
                        t = l.createElement(r);
                        t.async = 1;
                        t.src = "https://www.clarity.ms/tag/" + i;
                        y = l.getElementsByTagName(r)[0];
                        y.parentNode.insertBefore(t, y);
                    })(w, d, "clarity", "script", "${CLARITY_PROJECT_ID}");
                    w.clarity("consentv2", {
                        ad_Storage: "denied",
                        analytics_Storage: "granted",
                    });
                }
                var choice = null;
                try {
                    var r = JSON.parse(localStorage.getItem(KEY));
                    var now = Date.now();
                    if (
                        r &&
                        r.v === 1 &&
                        (r.choice === "granted" || r.choice === "denied") &&
                        typeof r.at === "number" &&
                        r.at <= now &&
                        now - r.at < MAX_AGE
                    )
                        choice = r.choice;
                } catch (e) {}
                try {
                    if (!choice && navigator.globalPrivacyControl === true)
                        choice = "denied";
                } catch (e) {}
                d.documentElement.setAttribute("data-consent", choice || "ask");
                w.nmConsent = {
                    load: load,
                    isLoaded: function () {
                        return loaded;
                    },
                    key: KEY,
                    maxAge: MAX_AGE,
                };
                if (choice === "granted") load();
            })(window, document);
        </script>`;
}

/**
 * Off when NOINDEX is set (the dev deploy), so testing there never lands in
 * the production GA property or Clarity project. Read at generation time,
 * which on DigitalOcean is the Docker build (`bun run gen:all`), so the
 * variable must be available at build time, not only at run time. The
 * snippet, the consent banner and the footer's "Cookie settings" button all
 * key off this one flag, so they appear together or not at all.
 */
export const ANALYTICS_ENABLED = !process.env.NOINDEX;

const STYLE_ASSETS = `        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
        <link
            href="https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,400..900;1,400&family=Geist+Mono:wght@400..700&display=swap"
            rel="stylesheet"
        />
        <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.2.0/css/all.min.css"
        />
        <link rel="stylesheet" href="/styles.css" />`;

/**
 * The tab and home-screen icons ("Plugged Apple", built from logoSvg()'s
 * paths). Browsers that read SVG favicons take /favicon.svg (no cord, green,
 * light green under a dark UI); `sizes="32x32"` on the .ico keeps Chrome from
 * preferring it over the SVG. /favicon.ico is also the MCP server icon, so
 * its path never changes. Every generator's `<head>` uses this one block.
 */
export const ICON_LINKS = `        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />`;

/**
 * The `<head>` assets with no analytics at all: fonts, icons, styles. The
 * login page uses this — no GA, no Clarity, no consent banner there.
 */
export const BASE_HEAD_ASSETS = STYLE_ASSETS;

/**
 * Every public page's `<head>` assets (login excepted): the shared set plus
 * the consent-gated analytics loader, when analytics are enabled.
 */
export const HEAD_ASSETS = ANALYTICS_ENABLED
    ? `${STYLE_ASSETS}
${analyticsHead()}`
    : STYLE_ASSETS;

/**
 * `<meta name="theme-color">` values — the page background (`--bg` in
 * public/styles.css) in each theme. site.js rewrites the meta on every theme
 * change with these same two values, so a generator's static tag should use
 * THEME_COLOR_LIGHT (what a first paint with no stored override shows).
 */
export const THEME_COLOR_LIGHT = "#f7f7f9";
export const THEME_COLOR_DARK = "#0b0d12";

export const THEME_PREPAINT = `        <script>
            // Apply a saved theme override before paint to avoid a flash.
            (function () {
                try {
                    var t = localStorage.getItem("theme");
                    if (t === "dark" || t === "light")
                        document.body.setAttribute("data-theme", t);
                } catch (e) {}
            })();
        </script>`;

/**
 * Cloudflare Email Obfuscation opt-out. DigitalOcean fronts the app with its
 * managed Cloudflare, which has Email Obfuscation on and no dashboard to turn
 * it off: it rewrites every `mailto:` and bare address in served HTML to
 * `/cdn-cgi/l/email-protection#…`, which only a script decodes — so the
 * contact address in the privacy policy, terms and footer was unreadable
 * without JavaScript. Cloudflare leaves anything between these two comments
 * alone. Every generator wraps its whole `<body>` contents in one pair
 * (`src/alt-pages.test.ts` pins exactly one pair per page, with every
 * `mailto:` inside it).
 */
export const EMAIL_OFF_OPEN = `        <!--email_off-->`;
export const EMAIL_OFF_CLOSE = `        <!--/email_off-->`;

// Theme toggle, menu, reveals and copy buttons all live in /site.js.
export const SITE_SCRIPT = `        <script src="/site.js" defer></script>`;

export function generatedBanner(script: string): string {
    return `        <!-- Generated by ${script} — edit the data there, not this file. -->`;
}

/**
 * `<html lang>` + every `<head>` tag that makes the locale set legible to a
 * crawler: self-referencing canonical (never canonical-to-English — that
 * tells Google the translated page is a duplicate and it gets dropped from
 * the alternates), a full reciprocal hreflang set (every locale linking to
 * every locale, including itself, plus x-default -> English), and
 * og:locale/og:locale:alternate. `suffix` is the page's PAGE_ROUTES key
 * ("" for home, "/tools", ...) — the same value across every locale, since
 * slugs aren't localized.
 */
export function localeHead(locale: SiteLocale, suffix: string): string {
    const canonical = urlFor(locale, suffix);
    const hreflang = SITE_LOCALES.map(
        (l) =>
            `        <link rel="alternate" hreflang="${HTML_LANG[l]}" href="${urlFor(l, suffix)}" />`,
    ).join("\n");
    const xDefault = `        <link rel="alternate" hreflang="x-default" href="${urlFor("en", suffix)}" />`;
    const ogLocale = `        <meta property="og:locale" content="${OG_LOCALE[locale]}" />`;
    const ogAlternates = SITE_LOCALES.filter((l) => l !== locale)
        .map(
            (l) =>
                `        <meta property="og:locale:alternate" content="${OG_LOCALE[l]}" />`,
        )
        .join("\n");
    return `        <link rel="canonical" href="${canonical}" />
${hreflang}
${xDefault}
${ogLocale}
${ogAlternates}${localeFontLinks(locale)}`;
}

/**
 * Script fonts for the locales Urbanist can't set. Urbanist ships Latin only,
 * so /uk and /ja used to fall back to whatever the OS had. Mulish (Cyrillic)
 * is the closest Google Fonts match — single-storey a/g like Urbanist, x-height
 * 0.503em vs 0.501em; M PLUS 2 (Japanese) has the same geometric construction
 * and a variable 100–900 axis. Weight ranges here and in STYLE_ASSETS match
 * what the pages compute: 400 (unstyled body text) through 900 (`<b>` inside
 * an 800 element computes `bolder` = 900), plus 400 italic for `<em>` in
 * prose; M PLUS 2 has no italic. Geist Mono
 * already carries Cyrillic. Loaded only on the page that needs it, and the
 * public/styles.css `html[lang] body` overrides put each after Urbanist, so Latin
 * runs keep Urbanist and only the script's own glyphs come from here (Google's
 * unicode-range slicing downloads just the slices a page uses). Rationale and
 * measurements: the fonts spec of the redesign. Called from localeHead() and
 * directly by gen-login.ts, which has no localeHead().
 */
const LOCALE_FONT_FAMILY: Partial<Record<SiteLocale, string>> = {
    uk: "Mulish:ital,wght@0,400..900;1,400",
    ja: "M+PLUS+2:wght@400..900",
};

export function localeFontLinks(locale: SiteLocale): string {
    const family = LOCALE_FONT_FAMILY[locale];
    if (!family) return "";
    return `
        <link
            href="https://fonts.googleapis.com/css2?family=${family}&display=swap"
            rel="stylesheet"
        />`;
}

/**
 * The "Live stats" notification badge — an inline "+N" pill after the nav
 * item's label (the "+" is CSS, `.nav-badge-n::before`, so the digits stay
 * plain for setNavBadge and for screen readers). It ships [hidden] on every page
 * and is painted by public/site.js, which every page loads: the count is the
 * number of food logs written since the visitor arrived on the SITE, so it
 * keeps counting across a click from /tools to /privacy rather than
 * restarting at zero, which is what the screen-reader label ("… since you
 * opened") promises. It used to be painted by the landing page's own stats poller
 * (LANDING_SCRIPT in scripts/gen-index.ts) instead, and the consequence was
 * that on /tools, /privacy and every /alternatives page the badge shipped,
 * reserved its space in the nav, and then never moved.
 *
 * The landing page keeps its 5s poller for the figures it animates and hands
 * them to site.js through a "live-stats" event rather than let it poll a
 * second time; it sends its own page-load baseline along, so on that page the
 * badge shows exactly what the .delta tag on the food-logs row shows.
 *
 * The digits alone would say nothing to a screen reader, so the count is
 * followed by a visually-hidden label naming what it counts. Deliberately
 * NOT aria-live: the poller runs every few seconds and announcing each change
 * would make the page unusable with a screen reader open.
 *
 * That label is count-sensitive, so every grammatical form ships in the
 * markup as a data-plural-<category> attribute and setNavBadge (in
 * public/site.js, which every page loads) picks one
 * with Intl.PluralRules. The forms cannot live in the script: site.js is one
 * file served to all nine locales (as LANDING_SCRIPT is one string embedded
 * byte-identically into all nine index.html files), so anything it names in
 * its own source is wrong on eight of them — the same contract the odometer
 * caption and the #facts-live word already have.
 * The rendered .vh text is the `other` form, which is what a count of 0 (the
 * markup's resting state) selects in every locale that distinguishes forms.
 *
 * There are three copies per page, not two: below the .head-nav breakpoint
 * the whole nav collapses behind the hamburger, so the badge rides the
 * hamburger itself — otherwise the one surface that tells a phone visitor
 * something arrived is hidden inside the menu they have not opened. The
 * design has no badge there; styles.css draws that copy as a quiet dot.
 */
const PLURAL_CATEGORIES = ["one", "few", "many", "other"] as const;

function liveBadge(c: ChromeCopy, decorative?: boolean): string {
    // esc() leaves quotes alone — fine for text nodes, not for the attribute
    // values below, where an apostrophe is harmless but a double quote would
    // end the attribute early.
    const attr = (s: string) => esc(s).replace(/"/g, "&quot;");
    const forms = c.nav.liveStatsBadgeLabel;
    // The hamburger's copy carries no label, and so needs no forms either. A
    // button's aria-label IS its accessible name and swallows any text inside
    // it, so a .vh span there would never be read; the count is announced
    // properly on the Live stats item, which is on screen exactly when the
    // menu is open and this copy is hidden (see .menu-btn .nav-badge in
    // styles.css).
    const label = decorative
        ? ""
        : ` <span class="vh">${esc(forms.other)}</span>`;
    const plurals = decorative
        ? ""
        : PLURAL_CATEGORIES.filter((k) => forms[k])
              .map((k) => ` data-plural-${k}="${attr(forms[k]!)}"`)
              .join("");
    return `<span class="nav-badge" data-live-badge hidden${
        decorative ? ' aria-hidden="true"' : ""
    }${plurals}><span class="nav-badge-n">0</span>${label}</span>`;
}

/**
 * The brand mark: "Plugged Apple" (Logo Explorations, Turn 5 · Final,
 * variant 5a). One masked shape filled with currentColor, so `color` on the
 * element (or `.nm-logo { color: var(--acc) }` in styles.css) themes it.
 * The mask id must be unique per document — every page carries at least
 * two copies (header and footer) — so each caller passes its own short `id`:
 * "h" header, "f" footer, and e.g. "a" for the sign-in card, "l" legal,
 * "c" a comparison card. `cord: false` drops the plug's cord, which is the
 * favicon variant (5c) for sizes of 24px and under.
 */
export function logoSvg(
    id: string,
    size: number,
    opts: { cord?: boolean } = {},
): string {
    const cord =
        opts.cord === false
            ? ""
            : `<path d="M32 45V51" stroke="#000" stroke-width="5" stroke-linecap="round"/>`;
    return `<svg class="nm-logo" aria-hidden="true" focusable="false" viewBox="0 0 64 64" width="${size}" height="${size}"><mask id="nm-logo-${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64"><path d="M32 20C26 14 10 14 9 32C8 46 18 58 25 58C28 58 30 56.5 32 56.5C34 56.5 36 58 39 58C46 58 56 46 55 32C54 14 38 14 32 20Z" fill="#fff"/><path d="M35 15C35 8 40 4 47 4C47 11 42 15 35 15Z" fill="#fff"/><path d="M22 32H42V37A10 10 0 0 1 32 47A10 10 0 0 1 22 37Z" fill="#000"/><rect x="24.5" y="24" width="5" height="10" rx="2.5" fill="#000"/><rect x="34.5" y="24" width="5" height="10" rx="2.5" fill="#000"/>${cord}</mask><rect width="64" height="64" fill="currentColor" mask="url(#nm-logo-${id})"/></svg>`;
}

/**
 * The three drifting colour blobs behind the top of every page (decorative,
 * aria-hidden). nav() emits them, so a page gets them without asking;
 * "compact" is the shorter, fainter set the /tools design uses, and a page
 * can still stretch or shrink the box with `--blobs-h` on <body>. Absolute
 * against <body> (position: relative in styles.css), under main/footer
 * (z-index 1) and the header.
 */
export type BlobsVariant = "default" | "compact";
export function blobs(variant: BlobsVariant = "default"): string {
    const cls =
        variant === "compact" ? "nm-blobs nm-blobs-compact" : "nm-blobs";
    return `        <div class="${cls}" aria-hidden="true"><span class="b1"></span><span class="b2"></span><span class="b3"></span></div>`;
}

const REPO_URL = "https://github.com/akutishevsky/nutrition-mcp";

/** The three theme modes, in control order, with their Font Awesome icon. */
const THEME_MODES = [
    { mode: "system", icon: "fa-circle-half-stroke" },
    { mode: "light", icon: "fa-sun" },
    { mode: "dark", icon: "fa-moon" },
] as const;

/**
 * Shared site header + mobile menu. site.js owns the theme toggle, menu and
 * scroll state. `suffix` is the current page's PAGE_ROUTES key ("" for
 * home, "/tools", "/myfitnesspal-mcp", ...) — used to build the language
 * switcher (every switcher link points at the SAME page in another locale)
 * and, via `currentSuffix`, to mark the matching nav/menu link
 * aria-current="page" (a PAGE_ROUTES key, e.g. "/tools" — NOT a locale-
 * prefixed href, since that's computed here from the locale + suffix).
 *
 * Layout (public/styles.css): the header is two glass pills — `.head-bar`
 * (brand, primary nav with its sliding `.nav-ind` pill, hamburger) and
 * `.head-tools` (GitHub, language, theme, Connect; hidden under 700px,
 * where the sheet carries the same controls). Under 1060px — or whenever
 * the nav overflows its pill, which site.js detects and flags with
 * html.nav-tight — the nav collapses behind the hamburger into
 * `.site-menu`, a full-screen sheet.
 *
 * Every element scripts/depersonalize.ts strips (the consent <section>, each
 * GitHub <a>) must keep ending its own line: those rules match up to a
 * closing tag followed by "\n".
 */
export function nav(
    locale: SiteLocale,
    suffix: string,
    currentSuffix?: string,
    opts?: {
        /**
         * The static per-locale switcher below links to `urlFor(l, suffix)`
         * — wrong for a page that isn't really "at" a locale-prefixed URL
         * (public/login.html is rendered per in-flight OAuth session, not
         * routed by path). When true, the whole <details class="lang-switch">
         * block is replaced with a literal "{{LANG_SWITCHER}}" token for the
         * caller to substitute at request time (see renderLangSwitcher in
         * src/oauth.ts) instead of at generation time. The sheet menu's
         * language grid has the same problem, so it becomes a second token,
         * "{{LANG_SWITCHER_MENU}}" — below 700px .head-tools is hidden and
         * that grid is the only language switcher a phone gets.
         */
        dynamicSwitcher?: boolean;
        /** False on the login page, which carries no analytics. */
        consent?: boolean;
        /** The background blobs: "default", "compact" (/tools) or false. */
        blobs?: BlobsVariant | false;
    },
): string {
    const p = (id: string) => pathFor(locale, id);
    const h = (id: string) => hashPath(locale, id);
    const c = chromeFor(locale);
    const attr = (s: string) => esc(s).replace(/"/g, "&quot;");
    const code = (l: SiteLocale) => HTML_LANG[l].toUpperCase();
    const switcherItems = SITE_LOCALES.map((l) => {
        const active = l === locale;
        return `                            <a
                                href="${urlFor(l, suffix)}"
                                lang="${HTML_LANG[l]}"
                                hreflang="${HTML_LANG[l]}"${active ? '\n                                aria-current="page"' : ""}
                                ><span>${esc(LOCALE_NAMES[l])}</span><span class="lang-menu-code">${code(l)}</span></a
                            >`;
    }).join("\n");
    const menuLangItems = SITE_LOCALES.map((l) => {
        const active = l === locale;
        return `                    <a href="${urlFor(l, suffix)}" lang="${HTML_LANG[l]}" hreflang="${HTML_LANG[l]}" aria-label="${attr(LOCALE_NAMES[l])}" title="${attr(LOCALE_NAMES[l])}"${active ? ' aria-current="page"' : ""}>${code(l)}</a>`;
    }).join("\n");
    const themeSeg = THEME_MODES.map(
        ({ mode, icon }) =>
            `                        <button type="button" data-theme-set="${mode}" aria-pressed="${mode === "system"}" title="${attr(c.theme[mode])}"><i class="fa-solid ${icon}" aria-hidden="true"></i><span class="vh">${esc(c.theme[mode])}</span></button>`,
    ).join("\n");
    const menuTheme = THEME_MODES.map(
        ({ mode, icon }) =>
            `                    <button type="button" data-theme-set="${mode}" aria-pressed="${mode === "system"}"><i class="fa-solid ${icon}" aria-hidden="true"></i>${esc(c.theme[mode])}</button>`,
    ).join("\n");
    const arrow = `<i class="fa-solid fa-arrow-right" aria-hidden="true"></i>`;
    // The consent banner: a glass card in the normal flow above the sticky
    // header, so it pushes the page down rather than covering any of it.
    // html[data-consent] is stamped in <head> before first paint, so the
    // card is there from the first frame and nothing shifts. It sits after
    // the skip link (still the first tab stop) and ahead of the header, so
    // keyboard and screen-reader users meet it before the page. Reopened
    // from the footer's "Cookie settings", site.js docks it to the bottom
    // edge instead (html[data-consent-reopen]). `data-consent-link` keeps
    // the aria-current replaceAll below off its privacy link, and
    // `data-analytics` is what scripts/depersonalize.ts strips it by.
    // Accept and Reject share one style on purpose: the design draws Accept
    // as a filled button, which is the kind of nudge consent guidance warns
    // against, so neither choice is made the easier one.
    const banner =
        ANALYTICS_ENABLED && opts?.consent !== false
            ? `
        <section class="consent" role="region" aria-labelledby="consent-title" data-analytics>
            <div class="consent-inner">
                <p class="consent-text"><strong id="consent-title" class="consent-title">${esc(c.consent.title)}</strong> ${esc(c.consent.body)} <a data-consent-link href="${p("/privacy")}">${esc(c.footer.privacyPolicy)}</a></p>
                <div class="consent-actions">
                    <button type="button" class="consent-btn" data-consent-choice="denied">${esc(c.consent.reject)}</button>
                    <button type="button" class="consent-btn" data-consent-choice="granted">${esc(c.consent.accept)}</button>
                </div>
            </div>
        </section>`
            : "";
    const blobsHtml =
        opts?.blobs === false ? "" : `\n${blobs(opts?.blobs || "default")}`;
    const menuLangGroup = opts?.dynamicSwitcher
        ? "\n            {{LANG_SWITCHER_MENU}}"
        : `
            <div class="menu-group">
                <span class="menu-group-label" id="menu-lang-l">${esc(c.languageTitle)}</span>
                <div class="menu-langs" role="group" aria-labelledby="menu-lang-l">
${menuLangItems}
                </div>
            </div>`;
    const html = `        <a class="skip" href="#main">${esc(c.skipToContent)}</a>${blobsHtml}${banner}
        <header class="site-head" id="site-head">
            <div class="head-inner">
                <div class="head-bar">
                    <a class="brand" href="${p("")}" aria-label="${esc(c.brandHomeAriaLabel)}">${logoSvg("h", 28)}<span>Nutrition&nbsp;MCP</span></a>
                    <nav class="head-nav" aria-label="${esc(c.landmarks.primaryNav)}">
                        <span class="nav-ind" aria-hidden="true"></span>
                        <a href="${h("how")}">${esc(c.nav.how)}</a>
                        <a href="${h("install")}">${esc(c.nav.install)}</a>
                        <a href="${p("/tools")}">${esc(c.nav.tools)}</a>
                        <a href="${h("try")}">${esc(c.nav.examples)}</a>
                        <a class="nav-has-badge" href="${h("stats")}">${esc(c.nav.liveStats)}${liveBadge(c)}</a>
                        <a href="${h("faq")}">${esc(c.nav.faq)}</a>
                    </nav>
                    <button
                        class="menu-btn"
                        type="button"
                        id="menu-btn"
                        aria-expanded="false"
                        aria-controls="site-menu"
                        aria-label="${esc(c.openMenuAriaLabel)}"
                        data-close-label="${esc(c.closeMenuAriaLabel)}"
                    >
                        <i class="fa-solid fa-bars mb-open" aria-hidden="true"></i><i class="fa-solid fa-xmark mb-close" aria-hidden="true"></i>${liveBadge(c, true)}
                    </button>
                </div>
                <div class="head-tools">
                    <a
                        class="icon-btn head-gh"
                        href="${REPO_URL}"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="${esc(c.githubAriaLabel)}"
                        title="GitHub"
                        ><i class="fa-brands fa-github" aria-hidden="true"></i></a
                    >
${
    opts?.dynamicSwitcher
        ? "                    {{LANG_SWITCHER}}"
        : `                    <details class="lang-switch">
                        <summary
                            class="icon-btn"
                            aria-label="${esc(c.changeLanguageAriaLabel)}"
                            title="${esc(c.languageTitle)}"
                        >
                            <i class="fa-solid fa-language" aria-hidden="true"></i><span class="lang-code">${code(locale)}</span>
                        </summary>
                        <div class="lang-menu" role="group" aria-label="${esc(c.languageTitle)}">
${switcherItems}
                        </div>
                    </details>`
}
                    <div class="theme-seg" role="group" aria-label="${esc(c.theme.ariaLabel)}" title="${esc(c.theme.title)}">
${themeSeg}
                    </div>
                    <a class="head-cta" href="${h("install")}">${esc(c.connectCta)}</a>
                </div>
            </div>
        </header>
        <div class="site-menu" id="site-menu" hidden>
            <nav aria-label="${esc(c.landmarks.menu)}" class="menu-nav">
                <a href="${h("how")}"><span>${esc(c.nav.how)}</span>${arrow}</a>
                <a href="${h("install")}"><span>${esc(c.nav.install)}</span>${arrow}</a>
                <a href="${p("/tools")}"><span>${esc(c.nav.tools)}</span>${arrow}</a>
                <a href="${h("try")}"><span>${esc(c.nav.examples)}</span>${arrow}</a>
                <a href="${h("stats")}"><span class="menu-label">${esc(c.nav.liveStats)}${liveBadge(c)}</span>${arrow}</a>
                <a href="${h("faq")}"><span>${esc(c.nav.faq)}</span>${arrow}</a>
            </nav>${menuLangGroup}
            <div class="menu-group">
                <span class="menu-group-label" aria-hidden="true">${esc(c.theme.title)}</span>
                <div class="menu-theme" role="group" aria-label="${esc(c.theme.title)}">
${menuTheme}
                </div>
            </div>
            <div class="menu-foot">
                <a class="menu-gh" href="${REPO_URL}" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-github" aria-hidden="true"></i>${esc(c.menu.github)}<span class="menu-gh-stars" data-gh-stars hidden><i class="fa-solid fa-star" aria-hidden="true"></i><span data-gh-stars-n></span></span></a>
                <a class="menu-cta" href="${h("install")}">${esc(c.connectCta)}${arrow}</a>
            </div>
        </div>`;
    if (!currentSuffix) return html;
    const currentHref = p(currentSuffix);
    // replaceAll, not replace: a page like /tools appears in both the
    // desktop .head-nav and the .site-menu, and both copies need the mark.
    return html.replaceAll(
        `<a href="${currentHref}">`,
        `<a href="${currentHref}" aria-current="page">`,
    );
}

/**
 * `currentSuffix` is a PAGE_ROUTES key (e.g. "/privacy") when the current
 * page has a link in this footer (Tools, Alternatives, Privacy, Terms) —
 * that link gets aria-current="page", matching what every hand-authored
 * legal/tools page already did before it moved to a generator.
 *
 * With analytics enabled (and unless `opts.consent` is false — the login
 * page, which carries no analytics), the footer also gets a "Cookie
 * settings" button, which reopens the consent banner nav() renders. It is
 * driven by public/site.js against the `nmConsent` object analyticsHead()
 * defines, and carries `data-analytics`, the hook scripts/depersonalize.ts
 * strips it by.
 */
export function footer(
    locale: SiteLocale,
    currentSuffix?: string,
    opts: { consent?: boolean } = {},
): string {
    const p = (id: string) => pathFor(locale, id);
    const c = chromeFor(locale);
    const consent = ANALYTICS_ENABLED && opts.consent !== false;
    const settingsBtn = consent
        ? `
                        <button type="button" class="footer-link-btn" data-consent-open data-analytics>${esc(c.consent.settings)}</button>`
        : "";
    const html = `        <footer class="footer">
            <div class="footer-inner">
                <div class="footer-top">
                    <a class="footer-brand" href="${p("")}" aria-label="${esc(c.brandHomeAriaLabel)}">${logoSvg("f", 34)}<span>Nutrition&nbsp;MCP</span></a>
                    <nav class="footer-links" aria-label="${esc(c.landmarks.footer)}">
                        <a href="${p("/tools")}">${esc(c.footer.tools)}</a>
                        <a href="${p("/tools")}#troubleshooting">${esc(c.footer.troubleshooting)}</a>
                        <a href="${p("/alternatives")}">${esc(c.footer.alternatives)}</a>
                        <a
                            href="https://medium.com/@akutishevsky/how-i-replaced-myfitnesspal-and-other-apps-with-a-single-mcp-server-56ca5ec7d673"
                            target="_blank"
                            rel="noopener noreferrer"
                            >${esc(c.footer.howIBuiltThis)}</a
                        >
                        <a
                            href="https://youtube.com/shorts/Y1EHbfimQ70?feature=share"
                            target="_blank"
                            rel="noopener noreferrer"
                            >${esc(c.footer.demo)}</a
                        >
                        <a
                            href="${REPO_URL}"
                            target="_blank"
                            rel="noopener noreferrer"
                            >${esc(c.footer.github)}<span class="footer-stars" data-gh-stars hidden><i class="fa-solid fa-star" aria-hidden="true"></i><span data-gh-stars-n></span></span></a
                        >
                        <a href="mailto:anton@nutrition-mcp.com">${esc(c.footer.contact)}</a>
                        <a href="${p("/privacy")}">${esc(c.footer.privacyPolicy)}</a>
                        <a href="${p("/terms")}">${esc(c.footer.termsOfService)}</a>${settingsBtn}
                    </nav>
                </div>
                <p class="footer-note">${esc(c.footer.note)}</p>
            </div>
        </footer>`;
    if (!currentSuffix) return html;
    const currentHref = p(currentSuffix);
    return html.replaceAll(
        `<a href="${currentHref}">`,
        `<a href="${currentHref}" aria-current="page">`,
    );
}
