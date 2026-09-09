// Translatable strings for the site-wide header (the "Dawn" floating pill
// bar: six short pill labels, the language/theme controls, the Connect
// CTA, the hamburger), the mobile sheet menu and the four-column footer —
// scripts/site-partials.ts's nav()/footer(), shared by every generated
// page (landing page, /tools, /privacy, /terms, /alternatives, /login).
//
// The pill labels and the footer used to live in IndexDoc (src/copy/
// index.ts) while the landing page had a chrome of its own; they moved
// here, values untouched, when that chrome became every page's. The
// registered-tool count ("36") is hand-typed in footer.product.tools and
// menu.toolsSmall, in every locale — see CLAUDE.md's "Registered tool
// set" for the full list of places that move together.
//
// This was a real, systemic gap: nav()/footer() already localized every
// HREF (via pathFor/hashPath) and built a full hreflang/language-switcher
// system, but every visible LABEL — "How it works", "Tools", "Connect",
// the whole footer — was a hardcoded English string literal, regardless of
// locale. A translated /de/tools page still had an all-English header and
// footer framing it, on every page, in every locale, because nav()/
// footer() are the one piece of markup shared by literally every
// generator and nobody had translated their labels. Found via a 7-locale
// proofreading pass (see PR description) before this file existed.
//
// "Nutrition MCP", "GitHub", "Patreon" and "llms.txt" are brand/product
// nouns and stay in Latin script in every locale.

import type { SiteLocale } from "../routes.js";
import { CHROME_DE } from "./chrome.de.js";
import { CHROME_ES } from "./chrome.es.js";
import { CHROME_FR } from "./chrome.fr.js";
import { CHROME_NL } from "./chrome.nl.js";
import { CHROME_PL } from "./chrome.pl.js";
import { CHROME_IT } from "./chrome.it.js";
import { CHROME_UK } from "./chrome.uk.js";
import { CHROME_JA } from "./chrome.ja.js";

/**
 * A count-sensitive string, picked at render time with `Intl.PluralRules`.
 * Same shape and same degradation as the widgets' PluralForms
 * (src/copy/widgets.ts) with one addition: `few` and `many`, which Polish
 * and Ukrainian genuinely need — their noun case turns on the digit class
 * (1 / 2-4 / 5+), and a badge counting arrivals since page-open sits in the
 * 1-4 band almost all of the time, which is exactly where the single
 * genitive form those two used to carry was wrong. Only `other` is
 * required; any category a locale omits falls back to it.
 */
export interface PluralForms {
    one?: string;
    few?: string;
    many?: string;
    other: string;
}

export interface ChromeCopy {
    skipToContent: string;
    /** aria-label on the brand link, e.g. "Nutrition MCP home". */
    brandHomeAriaLabel: string;

    /**
     * The six pill links in the header bar, in this order: how, examples,
     * liveStats, tools, donate, faq. They are SHORT — the bar is a 58px
     * pill and the six have to fit beside the brand and the controls at
     * 1120px in every locale ("How", "Examples", "Live", "Tools", "Donate",
     * "FAQ" in English); the sheet menu repeats them with a <small> hint
     * from menu.* beside each. The Connect item in the sheet's foot uses
     * menu.connectInMinute and the header's uses connectCta.
     */
    nav: {
        how: string;
        tools: string;
        examples: string;
        liveStats: string;
        /**
         * Screen-reader-only text inside the "Live stats" notification
         * badge, read straight after the digits: "Live stats 3 new food
         * logs since you opened". The badge itself shows the number and
         * nothing else, so this is the only thing naming what it counts.
         *
         * Count-sensitive, because the badge spends most of its life at 1:
         * "1 new food logs" is wrong in English and ungrammatical in Polish
         * and Ukrainian, where the case is chosen by the digit class.
         * liveBadge() emits every form as a data-plural-* attribute and
         * setNavBadge (in public/site.js, which every page loads) picks one
         * with Intl.PluralRules — one script serves all nine locales, so
         * the forms have to reach it through the markup rather than live in
         * its source.
         *
         * The number always comes FIRST and the label second, in every
         * locale: Japanese counts with a prefix ("3件の…"), so a reorder
         * that fixed Polish would break it. Only the label swaps.
         *
         * Whatever word a locale uses here must be the word its own stats
         * row uses for the same counter (IndexDoc.stats.rowFoodLogs) — the
         * badge and the row it links to are counting the same thing.
         */
        liveStatsBadgeLabel: PluralForms;
        /** Links to the landing page's Support section (#support). */
        donate: string;
        faq: string;
    };

    /**
     * The aria-labels on the three <nav> landmarks — the header's primary
     * nav, the mobile sheet, and the footer. These are the region names a
     * screen reader reads out when jumping between landmarks, and they
     * were hardcoded English ("Primary" / "Menu" / "Footer") on all nine
     * locales: invisible on the page, so nothing in a visual review would
     * ever catch them.
     *
     * `primaryNav` wants the name a native speaker would give the region,
     * not a gloss of the English adjective — German says
     * "Hauptnavigation", not "Primär".
     *
     * There is no fourth entry for the language menu's own label: that one
     * reuses `languageTitle`, exactly as the theme menu beside it reuses
     * `theme.title`.
     */
    landmarks: {
        primaryNav: string;
        menu: string;
        footer: string;
    };

    /** Kept for a GitHub icon button in the bar; the Dawn header has none
     * (GitHub sits in the sheet's secondary row and the footer's social
     * circle), so nothing renders it today. */
    githubAriaLabel: string;
    changeLanguageAriaLabel: string;
    languageTitle: string;
    /**
     * The theme control — a three-button segmented group in the header bar
     * (System / Light / Dark icons, each named by `title` + a visually
     * hidden label). Three modes, not two: "System" is the default and
     * means no override is stored at all, so the OS setting drives the
     * page and keeps driving it if it flips mid-visit. `title` names the
     * group; `ariaLabel` is kept for a disclosure-style switcher and is
     * unused by the current markup.
     *
     * These labels are static, unlike the aria-label the old two-state
     * button carried: site.js used to rewrite it on every toggle, in
     * hardcoded English, so a translated page announced the control in
     * English the moment anyone used it.
     */
    theme: {
        ariaLabel: string;
        title: string;
        system: string;
        light: string;
        dark: string;
    };
    /** The header's primary CTA button, e.g. "Connect". */
    connectCta: string;
    /**
     * The hamburger button's two accessible names. The button is one
     * control that toggles, so its label has to change with its state —
     * and site.js is a single static file served to all nine locales, so
     * it cannot own either string. `openMenuAriaLabel` is rendered as the
     * button's initial aria-label and `closeMenuAriaLabel` rides along in
     * a `data-close-label` attribute; site.js reads both off the DOM.
     * Before that it swapped in hardcoded English on the first tap, so a
     * German visitor got "Menü öffnen" until they used the menu once and
     * "Open menu" forever after.
     */
    openMenuAriaLabel: string;
    closeMenuAriaLabel: string;

    /** The mobile sheet menu — nav items repeat nav.* with a trailing
     * <small> hint, plus items the desktop nav omits. `installSmall` is
     * unused since the Install item went (the sheet's Connect item in its
     * foot is connectInMinute) and is kept only so no locale has to be
     * touched for it. */
    menu: {
        howSmall: string;
        installSmall: string;
        toolsSmall: string;
        examplesSmall: string;
        liveStatsSmall: string;
        alternatives: string;
        alternativesSmall: string;
        support: string;
        contact: string;
        /** The GitHub text link in the sheet's secondary row. */
        github: string;
        privacy: string;
        terms: string;
        connectInMinute: string;
    };

    /**
     * The four-column footer: the brand block (blurb, endpoint copy pill,
     * social circle), then Product / Open source / Your data link columns,
     * then the legal line. The product links point at landing-page
     * sections (#connect, #onboarding, #examples, #live, #faq, #contact)
     * via hashPath, so they resolve from every page.
     */
    footer: {
        /** Under the logo; names the maintainer's handle, which
         * scripts/depersonalize.ts swaps for a placeholder. */
        blurb: string;
        /** aria-label of the round copy button in the endpoint pill. */
        copyEndpointAriaLabel: string;
        /** aria-labels of the three social circle links. */
        social: { github: string; patreon: string; email: string };
        product: {
            heading: string;
            connect: string;
            onboarding: string;
            examples: string;
            live: string;
            /** Carries the registered-tool count, e.g. "All 36 nutrition
             * tools". */
            tools: string;
            alternatives: string;
        };
        openSource: {
            heading: string;
            source: string;
            selfHost: string;
            bug: string;
            llms: string;
            licence: string;
        };
        yourData: {
            heading: string;
            privacy: string;
            terms: string;
            exportCsv: string;
            deleteAccount: string;
            patreon: string;
            contact: string;
        };
        /** e.g. "© 2026 akutishevsky · MIT · Barcode data from Open Food
         * Facts". */
        copyright: string;
        bottomPrivacy: string;
        bottomTerms: string;
        bottomAlternatives: string;
        /** e.g. "Nutrition figures are estimates, not medical advice." */
        disclaimer: string;
    };
}

export const CHROME_EN: ChromeCopy = {
    skipToContent: "Skip to content",
    brandHomeAriaLabel: "Nutrition MCP home",

    nav: {
        how: "How",
        tools: "Tools",
        examples: "Examples",
        liveStats: "Live",
        liveStatsBadgeLabel: {
            one: "new food log since you opened",
            other: "new food logs since you opened",
        },
        donate: "Donate",
        faq: "FAQ",
    },

    landmarks: {
        primaryNav: "Primary",
        menu: "Menu",
        footer: "Footer",
    },

    githubAriaLabel: "GitHub repository",
    changeLanguageAriaLabel: "Change language",
    languageTitle: "Language",
    theme: {
        ariaLabel: "Change theme",
        title: "Theme",
        system: "System",
        light: "Light",
        dark: "Dark",
    },
    connectCta: "Connect",
    openMenuAriaLabel: "Open menu",
    closeMenuAriaLabel: "Close menu",

    menu: {
        howSmall: "3 steps",
        installSmall: "under a minute",
        toolsSmall: "36 tools",
        examplesSmall: "live demos",
        liveStatsSmall: "since you opened",
        alternatives: "Alternatives",
        alternativesSmall: "switching apps",
        support: "Support",
        contact: "Contact",
        github: "GitHub",
        privacy: "Privacy",
        terms: "Terms",
        connectInMinute: "Connect in a minute",
    },

    footer: {
        blurb: "Free, open-source nutrition tracking by talking to your AI. Made and run by one person, akutishevsky.",
        copyEndpointAriaLabel: "Copy endpoint",
        social: { github: "GitHub", patreon: "Patreon", email: "Email" },
        product: {
            heading: "Product",
            connect: "Connect",
            onboarding: "First five minutes",
            examples: "Examples",
            live: "Live stats",
            tools: "All 36 nutrition tools",
            alternatives: "Alternatives to MyFitnessPal & co.",
        },
        openSource: {
            heading: "Open source",
            source: "Source on GitHub",
            selfHost: "Self-hosting guide",
            bug: "Report a bug",
            llms: "llms.txt",
            licence: "MIT licence",
        },
        yourData: {
            heading: "Your data",
            privacy: "Privacy policy",
            terms: "Terms of service",
            exportCsv: "Export as CSV",
            deleteAccount: "Delete account",
            patreon: "Support on Patreon",
            contact: "Contact",
        },
        copyright:
            "© 2026 akutishevsky · MIT · Barcode data from Open Food Facts",
        bottomPrivacy: "Privacy",
        bottomTerms: "Terms",
        bottomAlternatives: "Alternatives",
        disclaimer: "Nutrition figures are estimates, not medical advice.",
    },
};

export const CHROME_COPY: Partial<Record<SiteLocale, ChromeCopy>> = {
    en: CHROME_EN,
    de: CHROME_DE,
    es: CHROME_ES,
    fr: CHROME_FR,
    nl: CHROME_NL,
    pl: CHROME_PL,
    it: CHROME_IT,
    uk: CHROME_UK,
    ja: CHROME_JA,
};

export function chromeFor(locale: SiteLocale): ChromeCopy {
    return CHROME_COPY[locale] ?? CHROME_EN;
}
