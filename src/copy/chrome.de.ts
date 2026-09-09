import type { ChromeCopy } from "./chrome.js";

export const CHROME_DE: ChromeCopy = {
    skipToContent: "Zum Inhalt springen",
    brandHomeAriaLabel: "Nutrition MCP Startseite",

    nav: {
        how: "So geht's",
        tools: "Werkzeuge",
        examples: "Beispiele",
        liveStats: "Live",
        liveStatsBadgeLabel: {
            one: "neuer Mahlzeiten-Eintrag seit dem Öffnen",
            other: "neue Mahlzeiten-Einträge seit dem Öffnen",
        },
        donate: "Spenden",
        faq: "FAQ",
    },

    landmarks: {
        primaryNav: "Hauptnavigation",
        menu: "Menü",
        footer: "Fußzeile",
    },

    githubAriaLabel: "GitHub-Repository",
    changeLanguageAriaLabel: "Sprache ändern",
    languageTitle: "Sprache",
    theme: {
        ariaLabel: "Design ändern",
        title: "Design",
        system: "System",
        light: "Hell",
        dark: "Dunkel",
    },
    connectCta: "Verbinden",
    openMenuAriaLabel: "Menü öffnen",
    closeMenuAriaLabel: "Menü schließen",

    menu: {
        howSmall: "3 Schritte",
        installSmall: "unter einer Minute",
        toolsSmall: "36 Werkzeuge",
        examplesSmall: "Live-Demos",
        liveStatsSmall: "seit dem Öffnen",
        alternatives: "Alternativen",
        alternativesSmall: "App-Wechsel",
        support: "Unterstützung",
        contact: "Kontakt",
        github: "GitHub",
        privacy: "Datenschutz",
        terms: "Bedingungen",
        connectInMinute: "In einer Minute verbinden",
    },

    footer: {
        blurb: "Kostenloses, quelloffenes Ernährungs-Tracking im Gespräch mit deiner KI. Gebaut und betrieben von einer Person, akutishevsky.",
        copyEndpointAriaLabel: "Endpunkt kopieren",
        social: { github: "GitHub", patreon: "Patreon", email: "E-Mail" },
        product: {
            heading: "Produkt",
            connect: "Verbinden",
            onboarding: "Die ersten fünf Minuten",
            examples: "Beispiele",
            live: "Live-Statistiken",
            tools: "Alle 36 Ernährungs-Werkzeuge",
            alternatives: "Alternativen zu MyFitnessPal & Co.",
        },
        openSource: {
            heading: "Quelloffen",
            source: "Quellcode auf GitHub",
            selfHost: "Anleitung zum Selbst-Hosten",
            bug: "Bug melden",
            llms: "llms.txt",
            licence: "MIT-Lizenz",
        },
        yourData: {
            heading: "Deine Daten",
            privacy: "Datenschutzerklärung",
            terms: "Nutzungsbedingungen",
            exportCsv: "Als CSV exportieren",
            deleteAccount: "Konto löschen",
            patreon: "Auf Patreon unterstützen",
            contact: "Kontakt",
        },
        copyright:
            "© 2026 akutishevsky · MIT · Barcode-Daten von Open Food Facts",
        bottomPrivacy: "Datenschutz",
        bottomTerms: "Bedingungen",
        bottomAlternatives: "Alternativen",
        disclaimer: "Ernährungswerte sind Schätzungen, kein medizinischer Rat.",
    },
};
