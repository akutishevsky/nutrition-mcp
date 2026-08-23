// Translatable strings for the site-wide header nav, mobile menu, and
// footer — scripts/site-partials.ts's nav()/footer(), shared by every
// generated page (landing page, /tools, /privacy, /terms, /alternatives).
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
// "Nutrition MCP" and "GitHub" are brand/product nouns and stay in Latin
// script in every locale — see ChromeCopy.footer.github's doc comment.

import type { SiteLocale } from "../routes.js";
import { CHROME_DE } from "./chrome.de.js";
import { CHROME_ES } from "./chrome.es.js";
import { CHROME_FR } from "./chrome.fr.js";
import { CHROME_NL } from "./chrome.nl.js";
import { CHROME_PL } from "./chrome.pl.js";
import { CHROME_IT } from "./chrome.it.js";
import { CHROME_UK } from "./chrome.uk.js";

export interface ChromeCopy {
    skipToContent: string;
    /** aria-label on the brand link, e.g. "Nutrition MCP home". */
    brandHomeAriaLabel: string;

    nav: {
        how: string;
        install: string;
        tools: string;
        examples: string;
        liveStats: string;
        faq: string;
    };

    githubAriaLabel: string;
    changeLanguageAriaLabel: string;
    languageTitle: string;
    switchToDarkModeAriaLabel: string;
    /** The header's primary CTA button, e.g. "Connect". */
    connectCta: string;
    openMenuAriaLabel: string;

    /** The mobile slide-out menu — nav items repeat nav.* concepts with a
     * trailing <small> hint, plus items the desktop nav omits. */
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
        /** The GitHub text link (distinct from the header's icon-button aria-label). */
        github: string;
        privacy: string;
        terms: string;
        connectInMinute: string;
    };

    footer: {
        tools: string;
        alternatives: string;
        howIBuiltThis: string;
        demo: string;
        github: string;
        contact: string;
        privacyPolicy: string;
        termsOfService: string;
        /** The one-sentence tagline under the footer links. */
        note: string;
    };
}

export const CHROME_EN: ChromeCopy = {
    skipToContent: "Skip to content",
    brandHomeAriaLabel: "Nutrition MCP home",

    nav: {
        how: "How it works",
        install: "Install",
        tools: "Tools",
        examples: "Examples",
        liveStats: "Live stats",
        faq: "FAQ",
    },

    githubAriaLabel: "GitHub repository",
    changeLanguageAriaLabel: "Change language",
    languageTitle: "Language",
    switchToDarkModeAriaLabel: "Switch to dark mode",
    connectCta: "Connect",
    openMenuAriaLabel: "Open menu",

    menu: {
        howSmall: "3 steps",
        installSmall: "under a minute",
        toolsSmall: "38 tools",
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
        tools: "Tools",
        alternatives: "Alternatives",
        howIBuiltThis: "How I built this",
        demo: "Demo",
        github: "GitHub",
        contact: "Contact",
        privacyPolicy: "Privacy Policy",
        termsOfService: "Terms of Service",
        note: "Free and open source. Nutrition figures are estimates, not medical advice.",
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
};

export function chromeFor(locale: SiteLocale): ChromeCopy {
    return CHROME_COPY[locale] ?? CHROME_EN;
}
