import type { ChromeCopy } from "./chrome.js";

export const CHROME_PL: ChromeCopy = {
    skipToContent: "Przejdź do treści",
    brandHomeAriaLabel: "Nutrition MCP — strona główna",

    nav: {
        how: "Jak to działa",
        install: "Instalacja",
        tools: "Narzędzia",
        examples: "Przykłady",
        liveStats: "Statystyki na żywo",
        liveStatsBadgeLabel: {
            one: "nowy posiłek zapisany od otwarcia strony",
            few: "nowe posiłki zapisane od otwarcia strony",
            many: "nowych posiłków zapisanych od otwarcia strony",
            other: "nowych posiłków zapisanych od otwarcia strony",
        },
        faq: "FAQ",
    },

    landmarks: {
        primaryNav: "Nawigacja główna",
        menu: "Menu",
        footer: "Stopka",
    },

    githubAriaLabel: "Repozytorium na GitHubie",
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
        github: "GitHub",
    },

    footer: {
        tools: "Narzędzia",
        troubleshooting: "Rozwiązywanie problemów",
        appleHealth: "Apple Health",
        alternatives: "Alternatywy",
        howIBuiltThis: "Jak to zbudowałem",
        demo: "Demo",
        github: "GitHub",
        contact: "Kontakt",
        privacyPolicy: "Polityka prywatności",
        termsOfService: "Regulamin",
        note: "Darmowy projekt open source. Wartości odżywcze są szacunkowe i nie stanowią porady medycznej.",
    },

    consent: {
        title: "Analityczne pliki cookie.",
        body: "Za Twoją zgodą Google Analytics zlicza odwiedziny, a Microsoft Clarity rejestruje kliknięcia i przewijanie w postaci nagrań sesji, abyśmy wiedzieli, które strony są pomocne, a gdzie użytkownicy się gubią. Żadne z nich nie uruchomi się, dopóki nie wyrazisz zgody.",
        accept: "Akceptuj",
        reject: "Odrzuć",
        settings: "Ustawienia plików cookie",
    },
};
