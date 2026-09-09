import type { ChromeCopy } from "./chrome.js";

export const CHROME_NL: ChromeCopy = {
    skipToContent: "Naar de inhoud",
    brandHomeAriaLabel: "Nutrition MCP startpagina",

    nav: {
        how: "Hoe",
        tools: "Tools",
        examples: "Voorbeelden",
        liveStats: "Live",
        liveStatsBadgeLabel: {
            one: "nieuwe voedingslog sinds je de pagina opende",
            other: "nieuwe voedingslogs sinds je de pagina opende",
        },
        donate: "Doneer",
        faq: "FAQ",
    },

    landmarks: {
        primaryNav: "Hoofdnavigatie",
        menu: "Menu",
        footer: "Voettekst",
    },

    githubAriaLabel: "GitHub-repository",
    changeLanguageAriaLabel: "Taal wijzigen",
    languageTitle: "Taal",
    theme: {
        ariaLabel: "Thema wijzigen",
        title: "Thema",
        system: "Systeem",
        light: "Licht",
        dark: "Donker",
    },
    connectCta: "Verbind",
    openMenuAriaLabel: "Menu openen",
    closeMenuAriaLabel: "Menu sluiten",

    menu: {
        howSmall: "3 stappen",
        installSmall: "binnen een minuut",
        toolsSmall: "36 tools",
        examplesSmall: "live demo's",
        liveStatsSmall: "sinds je de pagina opende",
        alternatives: "Alternatieven",
        alternativesSmall: "van app wisselen",
        support: "Steun",
        contact: "Contact",
        github: "GitHub",
        privacy: "Privacy",
        terms: "Voorwaarden",
        connectInMinute: "Verbind binnen een minuut",
    },

    footer: {
        blurb: "Gratis, open-source voeding bijhouden door met je AI te praten. Gemaakt en gerund door één persoon, akutishevsky.",
        copyEndpointAriaLabel: "Endpoint kopiëren",
        social: { github: "GitHub", patreon: "Patreon", email: "E-mail" },
        product: {
            heading: "Product",
            connect: "Verbind",
            onboarding: "Eerste vijf minuten",
            examples: "Voorbeelden",
            live: "Live statistieken",
            tools: "Alle 36 voedingstools",
            alternatives: "Alternatieven voor MyFitnessPal & co.",
            contact: "Contact",
        },
        openSource: {
            heading: "Open source",
            source: "Broncode op GitHub",
            selfHost: "Zelfhostingshandleiding",
            bug: "Een bug melden",
            llms: "llms.txt",
            licence: "MIT-licentie",
        },
        copyright:
            "© 2026 akutishevsky · MIT · Barcodegegevens van Open Food Facts",
        bottomPrivacy: "Privacy",
        bottomTerms: "Voorwaarden",
        bottomAlternatives: "Alternatieven",
        disclaimer: "Voedingswaarden zijn schattingen, geen medisch advies.",
    },
};
