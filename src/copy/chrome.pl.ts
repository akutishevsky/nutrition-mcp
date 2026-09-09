import type { ChromeCopy } from "./chrome.js";

export const CHROME_PL: ChromeCopy = {
    skipToContent: "Przejdź do treści",
    brandHomeAriaLabel: "Nutrition MCP — strona główna",

    nav: {
        how: "Jak to działa",
        tools: "Narzędzia",
        examples: "Przykłady",
        liveStats: "Na żywo",
        liveStatsBadgeLabel: {
            one: "nowy wpis jedzenia od otwarcia strony",
            few: "nowe wpisy jedzenia od otwarcia strony",
            many: "nowych wpisów jedzenia od otwarcia strony",
            other: "nowych wpisów jedzenia od otwarcia strony",
        },
        donate: "Wsparcie",
        faq: "FAQ",
    },

    landmarks: {
        primaryNav: "Nawigacja główna",
        menu: "Menu",
        footer: "Stopka",
    },

    githubAriaLabel: "Repozytorium na GitHub",
    changeLanguageAriaLabel: "Zmień język",
    languageTitle: "Język",
    theme: {
        ariaLabel: "Zmień motyw",
        title: "Motyw",
        system: "Systemowy",
        light: "Jasny",
        dark: "Ciemny",
    },
    connectCta: "Połącz",
    openMenuAriaLabel: "Otwórz menu",
    closeMenuAriaLabel: "Zamknij menu",

    menu: {
        howSmall: "3 kroki",
        installSmall: "poniżej minuty",
        toolsSmall: "36 narzędzi",
        examplesSmall: "przykłady na żywo",
        liveStatsSmall: "od otwarcia strony",
        alternatives: "Alternatywy",
        alternativesSmall: "zmiana aplikacji",
        support: "Wsparcie",
        contact: "Kontakt",
        github: "GitHub",
        privacy: "Prywatność",
        terms: "Regulamin",
        connectInMinute: "Połącz się w minutę",
    },

    footer: {
        blurb: "Darmowe, otwartoźródłowe śledzenie diety przez rozmowę ze swoim AI. Tworzone i prowadzone przez jedną osobę, akutishevsky.",
        copyEndpointAriaLabel: "Kopiuj adres endpointu",
        social: { github: "GitHub", patreon: "Patreon", email: "E-mail" },
        product: {
            heading: "Produkt",
            connect: "Połącz",
            onboarding: "Pierwsze pięć minut",
            examples: "Przykłady",
            live: "Statystyki na żywo",
            tools: "Wszystkie 36 narzędzi",
            alternatives: "Alternatywy dla MyFitnessPal i innych",
        },
        openSource: {
            heading: "Open source",
            source: "Kod na GitHub",
            selfHost: "Przewodnik po samodzielnym hostingu",
            bug: "Zgłoś błąd",
            llms: "llms.txt",
            licence: "Licencja MIT",
        },
        yourData: {
            heading: "Twoje dane",
            privacy: "Polityka prywatności",
            terms: "Regulamin",
            exportCsv: "Eksport do CSV",
            deleteAccount: "Usuń konto",
            patreon: "Wesprzyj na Patreon",
            contact: "Kontakt",
        },
        copyright:
            "© 2026 akutishevsky · MIT · Dane kodów kreskowych z Open Food Facts",
        bottomPrivacy: "Prywatność",
        bottomTerms: "Regulamin",
        bottomAlternatives: "Alternatywy",
        disclaimer:
            "Wartości odżywcze są szacunkowe, nie stanowią porady medycznej.",
    },
};
