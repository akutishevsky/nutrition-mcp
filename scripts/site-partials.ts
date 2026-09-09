// Shared HTML fragments for every generated public page (the landing page,
// /tools, /privacy, /terms, the /alternatives comparison pages and the
// OAuth login template). Used to live duplicated inside
// scripts/gen-alternatives.ts; pulled out here so every generator shares
// one nav()/footer() — including the locale-aware links and the language
// switcher — instead of each page type forking its own copy and drifting.
// The chrome is the "Dawn" design's: a floating glass pill bar (brand, six
// pill links, language <details>, three-button theme group, Connect CTA,
// hamburger), the full-screen sheet menu behind the hamburger, and the
// four-column footer. It was first built inside scripts/gen-index.ts for
// the landing page alone and moved back here, byte for byte, once the rest
// of the site followed — the header markup is what public/site.js and
// src/alt-pages.test.ts key off, so change it here and nowhere else.
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

// The maintainer's links, in one place: the footer's social circle and
// Open-source column render them on every page, and the landing page's
// hero / support / contact sections reuse the same constants.
// scripts/depersonalize.ts strips every one of them for a self-hoster.
export const GITHUB = "https://github.com/akutishevsky/nutrition-mcp";
export const PATREON =
    "https://patreon.com/akutishevskyi?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink";
export const EMAIL = "anton@nutrition-mcp.com";
export const MCP_URL = "https://nutrition-mcp.com/mcp";
/** The attribute pair every external link carries. */
export const EXT = 'target="_blank" rel="noopener noreferrer"';

/** Minimal HTML-entity escaping for text interpolated into element bodies. */
export function esc(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** esc() leaves quotes alone — fine for text nodes, not for attribute
 *  values, where a double quote would end the attribute early. */
export function attr(s: string): string {
    return esc(s).replace(/"/g, "&quot;");
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

// The <head> every page shares: the two faces the design is set in
// (Urbanist for everything read, Geist Mono for everything copied), Font
// Awesome 7 for the icons, the one stylesheet, and the GA snippet (kept in
// exactly this shape because scripts/depersonalize.ts matches on it).
export const HEAD_ASSETS = `        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
        <link
            href="https://fonts.googleapis.com/css2?family=Urbanist:wght@500;600;700;800&family=Geist+Mono:wght@400;500&display=swap"
            rel="stylesheet"
        />
        <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.2.0/css/all.min.css"
        />
        <link rel="stylesheet" href="/styles.css" />
        <script
            async
            src="https://www.googletagmanager.com/gtag/js?id=G-1K4HRB2R8X"
        ></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag() {
                dataLayer.push(arguments);
            }
            gtag("js", new Date());
            gtag("config", "G-1K4HRB2R8X");
        </script>`;

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
${ogAlternates}`;
}

/**
 * The "Live stats" notification badge — an app-icon-style count that hangs
 * off the top-right corner of the nav item. It ships [hidden] on every page
 * and is painted by public/site.js, which every page loads: the count is the
 * number of food logs written since the visitor arrived on the SITE, so it
 * keeps counting across a click from /tools to /privacy rather than
 * restarting at zero, which is what the menu's "since you opened" hint
 * promises. It used to be painted by the landing page's own stats poller
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
 * something arrived is hidden inside the menu they have not opened.
 */
const PLURAL_CATEGORIES = ["one", "few", "many", "other"] as const;

// Exported (rather than private to nav()) because site.js's setNavBadge and
// src/alt-pages.test.ts both pin this exact markup, and a page that ever
// needs the badge outside the shared chrome must ship the same bytes.
export function liveBadge(c: ChromeCopy, decorative?: boolean): string {
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
 * Shared site header (the floating glass pill bar) + the mobile sheet menu.
 * site.js owns the theme group, the sheet, the switcher's light-dismiss,
 * scroll-spy and scroll state; the class and id hooks it keys off
 * (#site-head, #menu-btn / #site-menu, .head-nav, .lang-switch,
 * [data-theme-set], .nav-has-badge / [data-live-badge]) live here.
 *
 * `suffix` is the current page's PAGE_ROUTES key ("" for home, "/tools",
 * "/myfitnesspal-mcp", ...) — used to build the language switcher (every
 * switcher link points at the SAME page in another locale) and, via
 * `currentSuffix`, to mark the matching nav/menu link aria-current="page"
 * (a PAGE_ROUTES key, e.g. "/tools" — NOT a locale-prefixed href, since
 * that's computed here from the locale + suffix).
 *
 * The six pills link to the landing page's sections through hashPath()
 * ("/#how" in English, "/de#live" in German), which on the landing page
 * itself resolves to the same in-page anchors — so the same markup serves
 * every page, and site.js's scroll-spy simply finds nothing to light on a
 * page without those sections.
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
         * src/oauth.ts) instead of at generation time.
         */
        dynamicSwitcher?: boolean;
    },
): string {
    const p = (id: string) => pathFor(locale, id);
    const h = (id: string) => hashPath(locale, id);
    const c = chromeFor(locale);
    const n = c.nav;
    const switcherItems = SITE_LOCALES.map((l) => {
        const active = l === locale;
        return `                    <a
                        href="${urlFor(l, suffix)}"
                        lang="${HTML_LANG[l]}"
                        hreflang="${HTML_LANG[l]}"${active ? '\n                        aria-current="page"' : ""}
                        ><span>${esc(LOCALE_NAMES[l])}</span
                        ><span class="nm-lang-code">${HTML_LANG[l]}</span></a
                    >`;
    }).join("\n");
    // Three modes as a segmented group, not a disclosure: System is the
    // default and rests pressed until site.js reads the saved override.
    const themeBtn = (mode: "system" | "light" | "dark", icon: string) =>
        `                    <button
                        type="button"
                        data-theme-set="${mode}"
                        aria-pressed="${mode === "system" ? "true" : "false"}"
                        title="${attr(c.theme[mode])}"
                    >
                        <i class="fa-solid ${icon}" aria-hidden="true"></i>
                        <span class="vh">${esc(c.theme[mode])}</span>
                    </button>`;
    const html = `        <a class="skip" href="#main">${esc(c.skipToContent)}</a>
        <header class="nm-header" id="site-head">
            <div class="nm-bar">
                <a class="nm-brand" href="${p("")}" aria-label="${attr(c.brandHomeAriaLabel)}">
                    <span class="nm-mark" aria-hidden="true">🍏</span>
                    <span class="nm-brand-text">Nutrition&nbsp;MCP</span>
                </a>
                <nav class="head-nav" aria-label="${attr(c.landmarks.primaryNav)}">
                    <a href="${h("how")}">${esc(n.how)}</a>
                    <a href="${h("examples")}">${esc(n.examples)}</a>
                    <a class="nav-has-badge" href="${h("live")}">${esc(n.liveStats)}${liveBadge(c)}</a>
                    <a href="${p("/tools")}">${esc(n.tools)}</a>
                    <a href="${h("support")}">${esc(n.donate)}</a>
                    <a href="${h("faq")}">${esc(n.faq)}</a>
                </nav>
${
    opts?.dynamicSwitcher
        ? "                {{LANG_SWITCHER}}"
        : `                <details class="lang-switch">
                    <summary
                        aria-label="${attr(c.changeLanguageAriaLabel)}"
                        title="${attr(c.languageTitle)}"
                    >
                        <i class="fa-solid fa-language" aria-hidden="true"></i>
                        <span class="lang-code">${HTML_LANG[locale].toUpperCase()}</span>
                    </summary>
                    <div class="lang-menu" role="group" aria-label="${attr(c.languageTitle)}">
${switcherItems}
                    </div>
                </details>`
}
                <div
                    class="nm-theme"
                    role="group"
                    aria-label="${attr(c.theme.title)}"
                    title="${attr(c.theme.title)}"
                >
${themeBtn("system", "fa-circle-half-stroke")}
${themeBtn("light", "fa-sun")}
${themeBtn("dark", "fa-moon")}
                </div>
                <a class="nm-cta head-cta" href="${h("connect")}">${esc(c.connectCta)}</a>
                <button
                    class="icon-btn menu-btn"
                    type="button"
                    id="menu-btn"
                    aria-expanded="false"
                    aria-controls="site-menu"
                    aria-label="${attr(c.openMenuAriaLabel)}"
                    data-close-label="${attr(c.closeMenuAriaLabel)}"
                >
                    <span class="burger" aria-hidden="true"></span>${liveBadge(c, true)}
                </button>
            </div>
        </header>
        <div class="site-menu" id="site-menu" hidden>
            <nav aria-label="${attr(c.landmarks.menu)}">
                <a href="${h("how")}">${esc(n.how)} <small>${esc(c.menu.howSmall)}</small></a>
                <a href="${h("examples")}">${esc(n.examples)} <small>${esc(c.menu.examplesSmall)}</small></a>
                <a href="${h("live")}"><span class="menu-label nav-has-badge">${esc(n.liveStats)}${liveBadge(c)}</span> <small>${esc(c.menu.liveStatsSmall)}</small></a>
                <a href="${p("/tools")}">${esc(n.tools)} <small>${esc(c.menu.toolsSmall)}</small></a>
                <a href="${h("support")}">${esc(n.donate)}</a>
                <a href="${h("faq")}">${esc(n.faq)}</a>
                <a href="${p("/alternatives")}">${esc(c.menu.alternatives)} <small>${esc(c.menu.alternativesSmall)}</small></a>
            </nav>
            <div class="menu-secondary">
                <a href="${h("support")}">${esc(c.menu.support)}</a>
                <a href="${h("contact")}">${esc(c.menu.contact)}</a>
                <a href="${GITHUB}" ${EXT}>${esc(c.menu.github)}</a>
                <a href="${p("/privacy")}">${esc(c.menu.privacy)}</a>
                <a href="${p("/terms")}">${esc(c.menu.terms)}</a>
            </div>
            <div class="menu-foot">
                <a class="nm-cta" href="${h("connect")}">${esc(c.menu.connectInMinute)}</a>
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
 * The four-column footer: brand block (blurb, endpoint copy pill, social
 * circle), then Product / Open source / Your data columns inside one
 * <nav class="footer-links"> landmark, and the legal line. `currentSuffix`
 * is a PAGE_ROUTES key (e.g. "/privacy") when the current page has a link
 * in this footer (Tools, Alternatives, Privacy, Terms) — every copy of
 * that link gets aria-current="page".
 */
export function footer(locale: SiteLocale, currentSuffix?: string): string {
    const p = (id: string) => pathFor(locale, id);
    const h = (id: string) => hashPath(locale, id);
    const c = chromeFor(locale);
    const f = c.footer;
    const link = (href: string, label: string, external = false) =>
        `                    <a href="${href}"${external ? " " + EXT : ""}>${esc(label)}</a>`;
    const html = `        <footer class="nm-footer">
            <div class="nm-footer-grid">
                <div class="nm-footer-brand">
                    <a class="nm-footer-logo" href="${p("")}">
                        <span class="nm-mark-lg" aria-hidden="true">🍏</span>
                        <span>Nutrition MCP</span>
                    </a>
                    <p class="nm-footer-blurb">${esc(f.blurb)}</p>
                    <div class="nm-endpoint-sm">
                        <span class="nm-pulse-dot" aria-hidden="true"></span>
                        <span class="nm-endpoint-url">nutrition-mcp.com/mcp</span>
                        <button
                            type="button"
                            class="copy-mini nm-copy-round"
                            data-copy="${MCP_URL}"
                            aria-label="${attr(f.copyEndpointAriaLabel)}"
                        >
                            <i class="fa-solid fa-copy" aria-hidden="true"></i>
                        </button>
                    </div>
                    <div class="nm-social">
                        <a href="${GITHUB}" ${EXT} aria-label="${attr(f.social.github)}"><i class="fa-brands fa-github" aria-hidden="true"></i></a>
                        <a href="${PATREON}" ${EXT} aria-label="${attr(f.social.patreon)}"><i class="fa-brands fa-patreon" aria-hidden="true"></i></a>
                        <a href="mailto:${EMAIL}" aria-label="${attr(f.social.email)}"><i class="fa-solid fa-envelope" aria-hidden="true"></i></a>
                    </div>
                </div>
                <nav class="footer-links" aria-label="${attr(c.landmarks.footer)}">
                    <div class="nm-fcol">
                        <b>${esc(f.product.heading)}</b>
${link(h("connect"), f.product.connect)}
${link(h("onboarding"), f.product.onboarding)}
${link(h("examples"), f.product.examples)}
${link(h("live"), f.product.live)}
${link(p("/tools"), f.product.tools)}
${link(p("/alternatives"), f.product.alternatives)}
                    </div>
                    <div class="nm-fcol">
                        <b>${esc(f.openSource.heading)}</b>
${link(GITHUB, f.openSource.source, true)}
${link(GITHUB + "#readme", f.openSource.selfHost, true)}
${link(GITHUB + "/issues", f.openSource.bug, true)}
${link("/llms.txt", f.openSource.llms)}
${link(GITHUB + "/blob/main/LICENSE", f.openSource.licence, true)}
                    </div>
                    <div class="nm-fcol">
                        <b>${esc(f.yourData.heading)}</b>
${link(p("/privacy"), f.yourData.privacy)}
${link(p("/terms"), f.yourData.terms)}
${link(h("faq"), f.yourData.exportCsv)}
${link(h("faq"), f.yourData.deleteAccount)}
${link(PATREON, f.yourData.patreon, true)}
${link(h("contact"), f.yourData.contact)}
                    </div>
                </nav>
            </div>
            <div class="nm-footer-bottom">
                <span class="nm-footer-legal">
                    <span>${esc(f.copyright)}</span>
                    <a href="${p("/privacy")}">${esc(f.bottomPrivacy)}</a>
                    <a href="${p("/terms")}">${esc(f.bottomTerms)}</a>
                    <a href="${p("/alternatives")}">${esc(f.bottomAlternatives)}</a>
                </span>
                <span>${esc(f.disclaimer)}</span>
            </div>
        </footer>`;
    if (!currentSuffix) return html;
    const currentHref = p(currentSuffix);
    return html.replaceAll(
        `<a href="${currentHref}">`,
        `<a href="${currentHref}" aria-current="page">`,
    );
}
